import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, TrendingUp, Target, Flame } from "lucide-react";
import { DailyEntry } from "@/hooks/useUserData";
import { useMemo } from "react";

interface QuickStatsProps {
  todayOz: number;
  dailyData: DailyEntry[];
  streak: number;
  goal: number;
}

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pctChange = ((current - previous) / previous) * 100;
  if (Math.abs(pctChange) < 1) return null;

  const isUp = pctChange > 0;
  return (
    <span className={`text-xs font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
      {isUp ? '+' : ''}{Math.round(pctChange)}%
    </span>
  );
}

export function QuickStats({ todayOz, dailyData, streak, goal }: QuickStatsProps) {
  const stats = useMemo(() => {
    const last7 = dailyData.slice(0, 7);
    const prev7 = dailyData.slice(7, 14);

    const avg7 = last7.length > 0
      ? last7.reduce((s, d) => s + d.totalOz, 0) / last7.length
      : 0;
    const prevAvg7 = prev7.length > 0
      ? prev7.reduce((s, d) => s + d.totalOz, 0) / prev7.length
      : 0;

    const daysAtGoal = dailyData.filter(d => d.totalOz >= goal).length;
    const goalRate = dailyData.length > 0
      ? (daysAtGoal / dailyData.length) * 100
      : 0;

    const yesterdayOz = dailyData.length > 1 ? dailyData[1]?.totalOz ?? 0 : 0;

    return { avg7, prevAvg7, goalRate, yesterdayOz };
  }, [dailyData, goal]);

  const cards = [
    {
      title: "Today",
      value: `${Math.round(todayOz)} oz`,
      icon: Droplets,
      trend: { current: todayOz, previous: stats.yesterdayOz },
    },
    {
      title: "7-Day Avg",
      value: `${Math.round(stats.avg7)} oz`,
      icon: TrendingUp,
      trend: { current: stats.avg7, previous: stats.prevAvg7 },
    },
    {
      title: "Streak",
      value: `${streak} days`,
      icon: Flame,
      trend: null,
    },
    {
      title: "Goal Rate",
      value: `${Math.round(stats.goalRate)}%`,
      icon: Target,
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-1 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs text-gray-500 font-medium">{card.title}</CardTitle>
              <card.icon className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="pb-3 px-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{card.value}</span>
              {card.trend && (
                <TrendArrow current={card.trend.current} previous={card.trend.previous} />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
