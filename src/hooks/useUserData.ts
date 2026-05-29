import { useState, useEffect, useMemo } from "react";
import { awsApi, ConsumptionData } from "../services/awsApi";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfile {
  custId: string;
  name: string;
  email: string;
  height: number;
  weight: number;
  gender: string;
  birthday: string;
  dailyGoal: number;
  userUnits: number; // 0=oz, 1=ml (matches iOS measurementType)
}

export interface DailyEntry {
  date: string;
  totalOz: number;
  entries: SipEntry[];
}

export interface SipEntry {
  seconds: number;
  ounces: number;
  deviceType?: string;
  drinkType?: number;
}

export interface UserHydrationData {
  profile: UserProfile | null;
  dailyData: DailyEntry[];
  todayData: DailyEntry | null;
  streak: number;
  goal: number;
  loading: boolean;
  error: string | null;
}

function parseConsumptionData(data: ConsumptionData): DailyEntry[] {
  const entries: DailyEntry[] = [];

  for (const dateKey in data) {
    const raw = data[dateKey];
    if (!raw || raw.length === 0) continue;

    // Entries with missing/zero timestamps bucket under the Unix epoch (1969/1970);
    // skip them so they don't show up as phantom days or inflate totals.
    const dateStr = dateKey.includes('T') ? dateKey : `${dateKey}T00:00:00.000Z`;
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime()) || parsedDate.getUTCFullYear() < 2015) continue;

    let totalOz = 0;
    const sips: SipEntry[] = [];

    for (const entry of raw) {
      const id = entry[0];
      if (id === '-1' || id === -1) {
        const val = typeof entry[1] === 'string' ? parseFloat(entry[1]) : entry[1];
        totalOz = isNaN(val) ? 0 : val;
        continue;
      }

      const seconds = typeof entry[0] === 'string' ? parseInt(entry[0]) : entry[0];
      const ounces = typeof entry[1] === 'string' ? parseFloat(entry[1]) : entry[1];

      sips.push({
        seconds: isNaN(seconds) ? 0 : seconds,
        ounces: isNaN(ounces) ? 0 : ounces,
        deviceType: entry[2] as string | undefined,
        drinkType: entry[3] != null ? Number(entry[3]) : undefined,
      });
    }

    entries.push({ date: dateStr, totalOz, entries: sips });
  }

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return entries;
}

// `readuser` runs `SELECT * FROM Customer`, so this is the raw column order:
// [0]CustID [1]Name [2](legacy) [3]FireID [4]Email [5]Height [6]Weight
// [7]Gender [8]Birthday [9]dailyGoal [10]userUnits
function parseProfile(data: any[]): UserProfile | null {
  if (!data || data === '0' as any || data.length === 0) return null;
  return {
    custId: data[0] || '',
    name: data[1] || '',
    email: data[4] || '',
    height: parseFloat(data[5]) || 0,
    weight: parseFloat(data[6]) || 0,
    gender: data[7] || '',
    birthday: data[8] || '',
    dailyGoal: parseInt(data[9]) || 60,
    userUnits: parseInt(data[10]) || 0,
  };
}

export function useUserData(): UserHydrationData {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allConsumption, setAllConsumption] = useState<ConsumptionData>({});
  const [streak, setStreak] = useState(0);
  const [goal, setGoal] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const custId = user?.id || null;

  useEffect(() => {
    if (!custId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Initial load: fetch full history (cached after first load) + static fields.
    // getTodayConsumption is intentionally omitted — today's data is already
    // included in getAllConsumption, so deriving it from there saves one
    // Lambda call and one Cloudflare decrypt roundtrip.
    const initialLoad = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileData, allData, streakVal, goalVal] = await Promise.all([
          awsApi.getUserProfile(custId),
          awsApi.getAllConsumption(custId),
          awsApi.getStreak(custId),
          awsApi.getGoal(custId),
        ]);
        if (cancelled) return;
        setProfile(parseProfile(profileData));
        setAllConsumption(allData);
        setStreak(streakVal);
        setGoal(goalVal);
      } catch (err) {
        if (!cancelled) setError("Failed to load hydration data");
        console.error("useUserData fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Polling: only re-fetch today's sips and merge into the cached history.
    // Historical data is immutable so there's no need to re-decrypt it.
    const pollRefresh = async () => {
      try {
        const [merged, streakVal] = await Promise.all([
          awsApi.refreshTodayInCache(custId),
          awsApi.getStreak(custId),
        ]);
        if (cancelled) return;
        setAllConsumption(merged);
        setStreak(streakVal);
      } catch (err) {
        console.error("useUserData poll error:", err);
      }
    };

    initialLoad();
    const interval = setInterval(pollRefresh, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [custId]);

  const dailyData = useMemo(() => parseConsumptionData(allConsumption), [allConsumption]);
  // todayData is derived from the full history — no separate fetch needed
  const todayData = useMemo(() => dailyData[0] ?? null, [dailyData]);

  return { profile, dailyData, todayData, streak, goal, loading, error };
}
