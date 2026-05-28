import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DailyEntry } from "@/hooks/useUserData";
import { useMemo, useState } from "react";

interface HydrationHeatmapProps {
  dailyData: DailyEntry[];
  goal: number;
}

function getColor(oz: number, goal: number): string {
  if (oz === 0) return "#f3f4f6";
  const pct = oz / goal;
  if (pct >= 1.5) return "#f59e0b"; // gold
  if (pct >= 1.0) return "#22c55e"; // green
  if (pct >= 0.75) return "#2563eb"; // dark blue
  if (pct >= 0.25) return "#60a5fa"; // medium blue
  return "#bfdbfe"; // light blue
}

export function HydrationHeatmap({ dailyData, goal }: HydrationHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; oz: number; x: number; y: number } | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());

  const { grid, months } = useMemo(() => {
    const dataMap = new Map<string, number>();
    for (const entry of dailyData) {
      const d = new Date(entry.date);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      dataMap.set(key, entry.totalOz);
    }

    const jan1 = new Date(Date.UTC(year, 0, 1));
    const startDow = jan1.getUTCDay();

    const weeks: { date: string; oz: number; dow: number }[][] = [];
    let currentWeek: { date: string; oz: number; dow: number }[] = [];

    // Pad first week
    for (let i = 0; i < startDow; i++) {
      currentWeek.push({ date: '', oz: -1, dow: i });
    }

    const d = new Date(jan1);
    while (d.getUTCFullYear() === year) {
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      const dow = d.getUTCDay();
      currentWeek.push({ date: key, oz: dataMap.get(key) ?? 0, dow });

      if (dow === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      d.setUTCDate(d.getUTCDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    // Month labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthPositions: { label: string; weekIdx: number }[] = [];
    let prevMonth = -1;
    weeks.forEach((week, weekIdx) => {
      for (const cell of week) {
        if (cell.date) {
          const month = parseInt(cell.date.split('-')[1]) - 1;
          if (month !== prevMonth) {
            monthPositions.push({ label: monthNames[month], weekIdx });
            prevMonth = month;
          }
          break;
        }
      }
    });

    return { grid: weeks, months: monthPositions };
  }, [dailyData, year]);

  const cellSize = 14;
  const gap = 2;
  const step = cellSize + gap;

  const currentYear = new Date().getFullYear();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Hydration Calendar</CardTitle>
            <CardDescription>{dailyData.filter(d => d.totalOz >= goal).length} days at goal</CardDescription>
          </div>
          <div className="flex gap-1">
            {[currentYear - 1, currentYear].map(y => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-2 py-1 text-xs rounded ${year === y ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="relative" style={{ minWidth: grid.length * step + 30 }}>
          {/* Month labels */}
          <div className="flex mb-1 ml-7" style={{ height: 14 }}>
            {months.map((m, i) => (
              <span
                key={i}
                className="text-xs text-gray-400 absolute"
                style={{ left: m.weekIdx * step + 28 }}
              >
                {m.label}
              </span>
            ))}
          </div>
          {/* Day labels + Grid */}
          <div className="flex">
            <div className="flex flex-col justify-between mr-1" style={{ height: 7 * step - gap }}>
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                <span key={i} className="text-xs text-gray-400 leading-none" style={{ height: cellSize, lineHeight: `${cellSize}px` }}>
                  {label}
                </span>
              ))}
            </div>
            <svg width={grid.length * step} height={7 * step}>
              {grid.map((week, wi) =>
                week.map((cell) => {
                  if (cell.date === '') return null;
                  const isFuture = new Date(`${cell.date}T00:00:00Z`) > new Date();
                  return (
                    <rect
                      key={cell.date}
                      x={wi * step}
                      y={cell.dow * step}
                      width={cellSize}
                      height={cellSize}
                      rx={2}
                      fill={isFuture ? '#fafafa' : getColor(cell.oz, goal)}
                      className="cursor-pointer"
                      onMouseEnter={(e) => {
                        const rect = (e.target as SVGRectElement).getBoundingClientRect();
                        setHoveredDay({ date: cell.date, oz: cell.oz, x: rect.left, y: rect.top });
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  );
                })
              )}
            </svg>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
            <span>Less</span>
            {['#f3f4f6', '#bfdbfe', '#60a5fa', '#2563eb', '#22c55e', '#f59e0b'].map(color => (
              <div key={color} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            ))}
            <span>More</span>
          </div>
        </div>
        {/* Tooltip */}
        {hoveredDay && (
          <div
            className="fixed z-50 px-2 py-1 bg-gray-900 text-white text-xs rounded pointer-events-none"
            style={{ left: hoveredDay.x, top: hoveredDay.y - 32 }}
          >
            {hoveredDay.date}: {Math.round(hoveredDay.oz)} oz ({Math.round((hoveredDay.oz / goal) * 100)}% of goal)
          </div>
        )}
      </CardContent>
    </Card>
  );
}
