import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface GoalProgressRingProps {
  currentOz: number;
  goalOz: number;
}

export function GoalProgressRing({ currentOz, goalOz }: GoalProgressRingProps) {
  const [animatedPct, setAnimatedPct] = useState(0);
  const pct = goalOz > 0 ? (currentOz / goalOz) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(Math.min(pct, 150)), 100);
    return () => clearTimeout(timer);
  }, [pct]);

  const radius = 90;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(animatedPct, 100) / 100) * circumference;

  const getColor = () => {
    if (animatedPct >= 100) return "#f59e0b"; // gold
    if (animatedPct >= 80) return "#10b981"; // green
    if (animatedPct >= 50) return "#14b8a6"; // teal
    return "#3b82f6"; // blue
  };

  const remaining = Math.max(goalOz - currentOz, 0);

  return (
    <Card className="flex items-center justify-center">
      <CardContent className="flex flex-col items-center justify-center py-6 px-4">
        <div className="relative">
          <svg width="220" height="220" viewBox="0 0 220 220">
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={getColor()}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 110 110)"
              className="transition-all duration-1000 ease-out"
              style={animatedPct >= 100 ? {
                filter: `drop-shadow(0 0 8px ${getColor()})`,
              } : undefined}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: getColor() }}>
              {Math.round(currentOz)}
            </span>
            <span className="text-sm text-gray-500">/ {goalOz} oz</span>
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-gray-600">
          {currentOz >= goalOz
            ? `Goal exceeded by ${Math.round(currentOz - goalOz)} oz!`
            : `${Math.round(remaining)} oz remaining`}
        </p>
      </CardContent>
    </Card>
  );
}
