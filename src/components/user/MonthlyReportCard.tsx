import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DailyEntry } from "@/hooks/useUserData";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthlyReportCardProps {
  dailyData: DailyEntry[];
  goal: number;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getGrade(pct: number): { letter: string; color: string } {
  if (pct >= 90) return { letter: 'A', color: 'bg-green-100 text-green-800' };
  if (pct >= 75) return { letter: 'B', color: 'bg-blue-100 text-blue-800' };
  if (pct >= 60) return { letter: 'C', color: 'bg-yellow-100 text-yellow-800' };
  return { letter: 'D', color: 'bg-red-100 text-red-800' };
}

export function MonthlyReportCard({ dailyData, goal }: MonthlyReportCardProps) {
  const now = new Date();
  const [monthOffset, setMonthOffset] = useState(0);

  const selectedDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthOffset, 1));
  const selectedYear = selectedDate.getUTCFullYear();
  const selectedMonth = selectedDate.getUTCMonth();

  const stats = useMemo(() => {
    const monthDays = dailyData.filter(d => {
      const date = new Date(d.date);
      return date.getUTCFullYear() === selectedYear && date.getUTCMonth() === selectedMonth;
    });

    if (monthDays.length === 0) return null;

    const totalOz = monthDays.reduce((s, d) => s + d.totalOz, 0);
    const avgDaily = totalOz / monthDays.length;
    const daysAtGoal = monthDays.filter(d => d.totalOz >= goal).length;
    const goalPct = (daysAtGoal / monthDays.length) * 100;

    const sorted = [...monthDays].sort((a, b) => b.totalOz - a.totalOz);
    const bestDay = sorted[0];
    const worstDay = sorted[sorted.length - 1];

    let longestStreak = 0, currentStreak = 0;
    const chronological = [...monthDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    for (const day of chronological) {
      if (day.totalOz >= goal) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      totalOz: Math.round(totalOz),
      avgDaily: Math.round(avgDaily * 10) / 10,
      daysAtGoal,
      totalDays: monthDays.length,
      goalPct,
      bestDay,
      worstDay,
      longestStreak,
    };
  }, [dailyData, selectedYear, selectedMonth, goal]);

  const grade = stats ? getGrade(stats.goalPct) : null;

  const formatDay = (entry: DailyEntry) => {
    const d = new Date(entry.date);
    return `${MONTH_NAMES[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Monthly Report Card</CardTitle>
          <div className="flex items-center gap-2">
            <button onClick={() => setMonthOffset(o => o + 1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <button
              onClick={() => setMonthOffset(o => Math.max(0, o - 1))}
              className="p-1 hover:bg-gray-100 rounded"
              disabled={monthOffset === 0}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!stats ? (
          <p className="text-gray-400 text-sm text-center py-4">No data for this month</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={`text-3xl px-4 py-2 ${grade!.color}`}>{grade!.letter}</Badge>
              <div>
                <p className="text-sm font-medium">{stats.daysAtGoal}/{stats.totalDays} days at goal</p>
                <p className="text-xs text-gray-500">{Math.round(stats.goalPct)}% completion</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Total</dt>
                <dd className="font-semibold">{stats.totalOz} oz</dd>
              </div>
              <div>
                <dt className="text-gray-500">Daily Avg</dt>
                <dd className="font-semibold">{stats.avgDaily} oz</dd>
              </div>
              <div>
                <dt className="text-gray-500">Best Day</dt>
                <dd className="font-semibold text-green-600">{formatDay(stats.bestDay)} ({Math.round(stats.bestDay.totalOz)} oz)</dd>
              </div>
              <div>
                <dt className="text-gray-500">Lowest Day</dt>
                <dd className="font-semibold text-red-500">{formatDay(stats.worstDay)} ({Math.round(stats.worstDay.totalOz)} oz)</dd>
              </div>
              <div>
                <dt className="text-gray-500">Best Streak</dt>
                <dd className="font-semibold">{stats.longestStreak} days</dd>
              </div>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
