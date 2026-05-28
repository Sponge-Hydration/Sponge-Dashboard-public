import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DailyEntry } from "@/hooks/useUserData";
import { useMemo, useState } from "react";

interface SipTimelineProps {
  todayData: DailyEntry | null;
}

const DRINK_COLORS: Record<number, string> = {
  100: "#3b82f6", // water - blue
  110: "#92400e", // coffee - brown
  120: "#d97706", // beer - amber
  121: "#881337", // wine - burgundy
  122: "#6b7280", // liquor - gray
};

const DRINK_LABELS: Record<number, string> = {
  100: "Water",
  110: "Coffee",
  120: "Beer",
  121: "Wine",
  122: "Liquor",
};

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function SipTimeline({ todayData }: SipTimelineProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sips = useMemo(() => {
    if (!todayData) return [];
    return todayData.entries
      .filter(e => e.seconds > 0)
      .sort((a, b) => a.seconds - b.seconds);
  }, [todayData]);

  const summary = useMemo(() => {
    if (sips.length === 0) return null;
    const totalOz = sips.reduce((s, e) => s + e.ounces, 0);
    const avgOz = totalOz / sips.length;
    const timeSpan = sips[sips.length - 1].seconds - sips[0].seconds;
    const avgMinsBetween = sips.length > 1 ? Math.round(timeSpan / 60 / (sips.length - 1)) : 0;
    return { count: sips.length, avgOz, avgMinsBetween };
  }, [sips]);

  const maxOz = useMemo(() => Math.max(...sips.map(s => s.ounces), 1), [sips]);

  const hourLabels = [0, 6, 12, 18, 24];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Today's Drinks</CardTitle>
        <CardDescription>
          {summary
            ? `${summary.count} sips, avg ${summary.avgOz.toFixed(1)} oz${summary.avgMinsBetween > 0 ? ` every ${summary.avgMinsBetween} min` : ''}`
            : "No sips recorded yet today"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sips.length === 0 ? (
          <div className="h-16 flex items-center justify-center text-gray-400 text-sm">
            Drink some water to see your timeline!
          </div>
        ) : (
          <div className="relative">
            {/* Hour labels */}
            <div className="flex justify-between text-xs text-gray-400 mb-1 px-1">
              {hourLabels.map(h => (
                <span key={h}>{h === 0 ? '12am' : h === 12 ? '12pm' : h === 24 ? '12am' : h > 12 ? `${h - 12}pm` : `${h}am`}</span>
              ))}
            </div>
            {/* Timeline bar */}
            <div className="relative h-12 bg-gray-100 rounded-full overflow-visible">
              {sips.map((sip, i) => {
                const leftPct = (sip.seconds / 86400) * 100;
                const size = 12 + (sip.ounces / maxOz) * 20;
                const color = DRINK_COLORS[sip.drinkType ?? 100] || DRINK_COLORS[100];
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2 rounded-full cursor-pointer transition-transform hover:scale-125"
                    style={{
                      left: `${leftPct}%`,
                      width: size,
                      height: size,
                      backgroundColor: color,
                      transform: `translateX(-50%) translateY(-50%)`,
                      zIndex: hoveredIdx === i ? 10 : 1,
                    }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {hoveredIdx === i && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-20">
                        {formatTime(sip.seconds)} — {sip.ounces.toFixed(1)} oz
                        {sip.drinkType && sip.drinkType !== 100 && ` (${DRINK_LABELS[sip.drinkType] || 'Other'})`}
                        {sip.deviceType && ` via ${sip.deviceType}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            {sips.some(s => s.drinkType && s.drinkType !== 100) && (
              <div className="flex gap-3 mt-3 text-xs text-gray-500">
                {Object.entries(DRINK_COLORS).map(([type, color]) => {
                  const typeNum = parseInt(type);
                  if (!sips.some(s => (s.drinkType ?? 100) === typeNum)) return null;
                  return (
                    <div key={type} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {DRINK_LABELS[typeNum]}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
