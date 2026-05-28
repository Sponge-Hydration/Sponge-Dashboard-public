import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DailyEntry, UserProfile } from "@/hooks/useUserData";
import { useMemo } from "react";
import { Sparkles, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";

interface HydrationRecommendationProps {
  profile: UserProfile | null;
  goal: number;
  dailyData: DailyEntry[];
}

// NASEM/IOM adequate-intake guidance: ~125 oz/day total water for men and
// ~91 oz for women, of which ~80% typically comes from beverages.
function recommendedBeverageOz(profile: UserProfile | null): number | null {
  const g = profile?.gender?.trim().toLowerCase();
  if (!g) return null;
  if (g.startsWith("m")) return 100;
  if (g.startsWith("f") || g.startsWith("w")) return 73;
  return null;
}

export function HydrationRecommendation({ profile, goal, dailyData }: HydrationRecommendationProps) {
  const { recentAvg, daysCounted } = useMemo(() => {
    // dailyData is sorted newest-first; average over up to the 7 most recent logged days.
    const recent = dailyData.slice(0, 7);
    if (recent.length === 0) return { recentAvg: 0, daysCounted: 0 };
    const sum = recent.reduce((s, d) => s + d.totalOz, 0);
    return { recentAvg: sum / recent.length, daysCounted: recent.length };
  }, [dailyData]);

  const guideline = recommendedBeverageOz(profile);
  const target = goal > 0 ? goal : guideline ?? 64;
  const pct = Math.min((recentAvg / Math.max(target, 1)) * 100, 100);

  const gap = target - recentAvg;
  const cups = Math.max(0, Math.round(gap / 8)); // 8 oz cups

  const status: { icon: typeof TrendingUp; color: string; message: string } = (() => {
    if (daysCounted === 0) {
      return {
        icon: Sparkles,
        color: "text-sky-500",
        message: `Start logging to see how you track against your ${Math.round(target)} oz goal.`,
      };
    }
    if (recentAvg >= target) {
      return {
        icon: CheckCircle2,
        color: "text-green-600",
        message: `You're averaging ${Math.round(recentAvg)} oz — at or above your goal. Keep it up!`,
      };
    }
    if (pct >= 75) {
      return {
        icon: TrendingUp,
        color: "text-amber-500",
        message: `Close! Averaging ${Math.round(recentAvg)} oz. About ${cups} more cup${cups === 1 ? "" : "s"} a day would hit ${Math.round(target)} oz.`,
      };
    }
    return {
      icon: TrendingDown,
      color: "text-red-500",
      message: `Averaging ${Math.round(recentAvg)} oz over the last ${daysCounted} day${daysCounted === 1 ? "" : "s"}. Aim for ~${cups} more cups daily to reach ${Math.round(target)} oz.`,
    };
  })();

  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          Recommendation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${status.color}`} />
          <p className="text-sm leading-relaxed text-gray-700">{status.message}</p>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Recent daily average</span>
            <span>
              {Math.round(recentAvg)} / {Math.round(target)} oz
            </span>
          </div>
          <Progress value={pct} />
        </div>

        {guideline && (
          <p className="text-xs text-gray-400 border-t pt-3">
            Guideline: adults assigned {profile?.gender?.toLowerCase().startsWith("m") ? "male" : "female"} at
            birth average ~{guideline} oz/day from beverages (NASEM adequate intake).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
