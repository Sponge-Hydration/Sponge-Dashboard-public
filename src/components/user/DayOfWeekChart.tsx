import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from "recharts";
import { DailyEntry } from "@/hooks/useUserData";
import { useMemo } from "react";

interface DayOfWeekChartProps {
  dailyData: DailyEntry[];
  goal: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DayOfWeekChart({ dailyData, goal }: DayOfWeekChartProps) {
  const { chartData, bestDay, worstDay } = useMemo(() => {
    const totals: number[][] = [[], [], [], [], [], [], []];

    for (const entry of dailyData) {
      const d = new Date(entry.date);
      totals[d.getUTCDay()].push(entry.totalOz);
    }

    const data = DAY_NAMES.map((name, i) => {
      const vals = totals[i];
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { day: name, avg: Math.round(avg * 10) / 10, meetsGoal: avg >= goal };
    });

    let best = data[0], worst = data[0];
    for (const d of data) {
      if (d.avg > best.avg) best = d;
      if (d.avg < worst.avg && d.avg > 0) worst = d;
    }

    return { chartData: data, bestDay: best, worstDay: worst };
  }, [dailyData, goal]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Day-of-Week Trends</CardTitle>
        <CardDescription>
          {bestDay.avg > 0 && (
            <>
              Best: <span className="text-green-600 font-medium">{bestDay.day} ({bestDay.avg} oz)</span>
              {worstDay.day !== bestDay.day && (
                <> | Watch: <span className="text-red-500 font-medium">{worstDay.day} ({worstDay.avg} oz)</span></>
              )}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="day" type="category" tick={{ fontSize: 12 }} width={35} />
            <Tooltip formatter={(value: number) => [`${value} oz avg`, 'Hydration']} />
            <ReferenceLine x={goal} stroke="#f59e0b" strokeDasharray="6 4" />
            <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.meetsGoal ? '#22c55e' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
