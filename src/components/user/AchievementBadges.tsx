import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyEntry } from "@/hooks/useUserData";
import { useMemo } from "react";
import { Droplet, Target, Flame, Trophy, Waves, CalendarCheck, Award, Zap, Lock, LucideIcon } from "lucide-react";

interface AchievementBadgesProps {
  dailyData: DailyEntry[];
  streak: number;
  goal: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  earned: boolean;
}

function longestGoalStreak(dailyData: DailyEntry[], goal: number): number {
  const chronological = [...dailyData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let max = 0;
  let current = 0;
  for (const day of chronological) {
    if (day.totalOz >= goal) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

export function AchievementBadges({ dailyData, streak, goal }: AchievementBadgesProps) {
  const achievements = useMemo<Achievement[]>(() => {
    const daysLogged = dailyData.length;
    const everHitGoal = dailyData.some((d) => d.totalOz >= goal);
    const bestStreak = Math.max(longestGoalStreak(dailyData, goal), streak);
    const maxDayOz = dailyData.reduce((m, d) => Math.max(m, d.totalOz), 0);
    const totalAllTime = dailyData.reduce((s, d) => s + d.totalOz, 0);

    return [
      {
        id: "first-drop",
        title: "First Drop",
        description: "Logged your first hydration data",
        icon: Droplet,
        color: "text-sky-500",
        earned: daysLogged > 0,
      },
      {
        id: "goal-getter",
        title: "Goal Getter",
        description: "Hit your daily goal at least once",
        icon: Target,
        color: "text-green-500",
        earned: everHitGoal,
      },
      {
        id: "week-warrior",
        title: "Week Warrior",
        description: "7 days in a row at goal",
        icon: Flame,
        color: "text-orange-500",
        earned: bestStreak >= 7,
      },
      {
        id: "monthly-master",
        title: "Monthly Master",
        description: "30 days in a row at goal",
        icon: Trophy,
        color: "text-amber-500",
        earned: bestStreak >= 30,
      },
      {
        id: "overachiever",
        title: "Overachiever",
        description: "Reached 150% of your goal in a day",
        icon: Zap,
        color: "text-violet-500",
        earned: maxDayOz >= goal * 1.5,
      },
      {
        id: "century",
        title: "Century Sip",
        description: "Drank 100 oz in a single day",
        icon: Waves,
        color: "text-blue-500",
        earned: maxDayOz >= 100,
      },
      {
        id: "consistent",
        title: "Consistent",
        description: "Logged data on 30 different days",
        icon: CalendarCheck,
        color: "text-teal-500",
        earned: daysLogged >= 30,
      },
      {
        id: "hydration-hero",
        title: "Hydration Hero",
        description: "1,000 oz logged all-time",
        icon: Award,
        color: "text-rose-500",
        earned: totalAllTime >= 1000,
      },
    ];
  }, [dailyData, streak, goal]);

  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Achievements</CardTitle>
          <span className="text-sm text-gray-500">
            {earnedCount}/{achievements.length}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {achievements.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.id}
                title={`${a.title} — ${a.description}`}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                  a.earned ? "bg-white" : "bg-gray-50 opacity-50"
                }`}
              >
                <div className="relative">
                  <Icon className={`h-7 w-7 ${a.earned ? a.color : "text-gray-400"}`} />
                  {!a.earned && (
                    <Lock className="absolute -bottom-1 -right-1 h-3 w-3 text-gray-400" />
                  )}
                </div>
                <span className="text-[11px] font-medium leading-tight">{a.title}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
