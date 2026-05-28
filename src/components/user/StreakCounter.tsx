import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { DailyEntry } from "@/hooks/useUserData";
import { useMemo } from "react";

interface StreakCounterProps {
  streak: number;
  dailyData: DailyEntry[];
  goal: number;
}

export function StreakCounter({ streak, dailyData, goal }: StreakCounterProps) {
  const personalBest = useMemo(() => {
    if (dailyData.length === 0) return streak;
    const sorted = [...dailyData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let max = 0;
    let current = 0;
    for (const day of sorted) {
      if (day.totalOz >= goal) {
        current++;
        max = Math.max(max, current);
      } else {
        current = 0;
      }
    }
    return Math.max(max, streak);
  }, [dailyData, goal, streak]);

  const getFlameStyle = (): { color: string; className: string } => {
    if (streak >= 30) return { color: "#f59e0b", className: "animate-pulse drop-shadow-[0_0_12px_#f59e0b]" };
    if (streak >= 7) return { color: "#ef4444", className: "animate-pulse" };
    if (streak >= 1) return { color: "#f97316", className: "" };
    return { color: "#9ca3af", className: "" };
  };

  const style = getFlameStyle();

  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4 px-6">
        <div className={style.className}>
          <Flame size={40} color={style.color} fill={streak > 0 ? style.color : "none"} />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{streak}</span>
            <span className="text-sm text-gray-500">day streak</span>
          </div>
          {personalBest > streak && (
            <p className="text-xs text-gray-400">Personal best: {personalBest} days</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
