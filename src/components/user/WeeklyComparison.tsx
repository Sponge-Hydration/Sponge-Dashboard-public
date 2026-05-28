import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from "recharts";
import { DailyEntry } from "@/hooks/useUserData";
import { useMemo } from "react";

interface WeeklyComparisonProps {
  dailyData: DailyEntry[];
  goal: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeeklyComparison({ dailyData, goal }: WeeklyComparisonProps) {
  const { chartData, thisWeekAvg, lastWeekAvg } = useMemo(() => {
    const now = new Date();
    const todayDow = now.getUTCDay();

    const thisWeekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - todayDow));
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7);

    const thisWeek: Record<number, number> = {};
    const lastWeek: Record<number, number> = {};

    for (const entry of dailyData) {
      const d = new Date(entry.date);
      const diff = (thisWeekStart.getTime() - d.getTime()) / 86400000;

      if (diff <= 0 && diff > -7) {
        thisWeek[d.getUTCDay()] = entry.totalOz;
      } else if (diff > 0 && diff <= 7) {
        lastWeek[d.getUTCDay()] = entry.totalOz;
      }
    }

    const data = DAY_NAMES.map((name, i) => ({
      day: name,
      thisWeek: thisWeek[i] != null ? Math.round(thisWeek[i] * 10) / 10 : null,
      lastWeek: lastWeek[i] != null ? Math.round(lastWeek[i] * 10) / 10 : null,
    }));

    const twVals = Object.values(thisWeek);
    const lwVals = Object.values(lastWeek);
    const twAvg = twVals.length > 0 ? twVals.reduce((a, b) => a + b, 0) / twVals.length : 0;
    const lwAvg = lwVals.length > 0 ? lwVals.reduce((a, b) => a + b, 0) / lwVals.length : 0;

    return { chartData: data, thisWeekAvg: twAvg, lastWeekAvg: lwAvg };
  }, [dailyData]);

  const pctChange = lastWeekAvg > 0 ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Weekly Comparison</CardTitle>
        <CardDescription>
          Averaging {Math.round(thisWeekAvg)} oz/day
          {lastWeekAvg > 0 && (
            <span className={pctChange >= 0 ? 'text-green-500' : 'text-red-500'}>
              {' '}({pctChange >= 0 ? '+' : ''}{Math.round(pctChange)}% vs last week)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number | null) => value != null ? [`${value} oz`] : ['—']}
            />
            <Legend />
            <ReferenceLine y={goal} stroke="#f59e0b" strokeDasharray="6 4" label={{ value: 'Goal', position: 'right', fontSize: 11, fill: '#f59e0b' }} />
            <Bar dataKey="thisWeek" name="This Week" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="lastWeek" name="Last Week" fill="#bfdbfe" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
