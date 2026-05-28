import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DailyEntry, UserProfile } from "@/hooks/useUserData";
import { useMemo } from "react";
import { Lightbulb } from "lucide-react";

interface DidYouKnowProps {
  dailyData: DailyEntry[];
  profile: UserProfile | null;
}

// Science-backed hydration facts. Kept conservative and sourced from
// mainstream physiology / NASEM guidance rather than folk rules.
const FACTS: string[] = [
  "Your brain is roughly 73% water — losing just 1–2% of body water can measurably impair concentration and short-term memory.",
  "Thirst lags behind need: by the time you feel thirsty you may already be about 1–2% dehydrated.",
  "Water regulates body temperature through sweat. A 2% drop in body water can noticeably reduce physical performance.",
  "Your kidneys filter around 50 gallons of blood a day — staying hydrated helps them clear waste and lowers kidney-stone risk.",
  "About 20% of typical daily water intake comes from food, especially fruits and vegetables.",
  "Randomized trials suggest drinking water before meals can modestly increase satiety and support weight management.",
  "There's no strong evidence behind the rigid '8 glasses a day' rule — actual needs vary with body size, activity, and climate.",
];

export function DidYouKnow({ dailyData, profile }: DidYouKnowProps) {
  // Rotate the fact daily so it feels fresh but stays deterministic.
  const fact = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getUTCFullYear(), 0, 0).getTime()) / 86_400_000
    );
    return FACTS[dayOfYear % FACTS.length];
  }, []);

  const personalized = useMemo(() => {
    const totalOz = dailyData.reduce((s, d) => s + d.totalOz, 0);
    if (totalOz <= 0) return null;
    const liters = totalOz * 0.0295735;
    const bottles = Math.round(totalOz / 16.9); // standard 16.9 oz bottle
    const name = profile?.name?.split(" ")[0];
    return `${name ? `${name}, you've` : "You've"} logged ${Math.round(totalOz).toLocaleString()} oz so far — about ${liters.toFixed(1)} L, or ${bottles.toLocaleString()} standard water bottles.`;
  }, [dailyData, profile]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Did You Know?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-gray-700">{fact}</p>
        {personalized && (
          <p className="text-xs text-gray-400 border-t pt-3">{personalized}</p>
        )}
      </CardContent>
    </Card>
  );
}
