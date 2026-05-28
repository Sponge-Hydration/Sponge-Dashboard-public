import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserData } from "@/hooks/useUserData";
import { GoalProgressRing } from "@/components/user/GoalProgressRing";
import { StreakCounter } from "@/components/user/StreakCounter";
import { QuickStats } from "@/components/user/QuickStats";
import { SipTimeline } from "@/components/user/SipTimeline";
import { WeeklyComparison } from "@/components/user/WeeklyComparison";
import { DayOfWeekChart } from "@/components/user/DayOfWeekChart";
import { HydrationHeatmap } from "@/components/user/HydrationHeatmap";
import { MonthlyReportCard } from "@/components/user/MonthlyReportCard";
import { AchievementBadges } from "@/components/user/AchievementBadges";
import { DidYouKnow } from "@/components/user/DidYouKnow";
import { HydrationRecommendation } from "@/components/user/HydrationRecommendation";

const MyHydration = () => {
  const { profile, dailyData, todayData, streak, goal, loading, error } = useUserData();

  const todayOz = todayData?.totalOz ?? 0;
  const firstName = profile?.name?.split(' ')[0] || 'there';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-64" />
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          </div>
          <Skeleton className="h-48" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Welcome back, {firstName}!</h1>

        {/* Hero: Progress Ring + Quick Stats + Streak */}
        <div className="grid gap-6 md:grid-cols-3">
          <GoalProgressRing currentOz={todayOz} goalOz={goal} />
          <div className="md:col-span-2 space-y-4">
            <QuickStats
              todayOz={todayOz}
              dailyData={dailyData}
              streak={streak}
              goal={goal}
            />
            <StreakCounter streak={streak} dailyData={dailyData} goal={goal} />
          </div>
        </div>

        {/* Sip Timeline */}
        <SipTimeline todayData={todayData} />

        {/* Weekly Comparison + Day of Week */}
        <div className="grid gap-6 md:grid-cols-2">
          <WeeklyComparison dailyData={dailyData} goal={goal} />
          <DayOfWeekChart dailyData={dailyData} goal={goal} />
        </div>

        {/* Heatmap */}
        <HydrationHeatmap dailyData={dailyData} goal={goal} />

        {/* Report Card + Badges */}
        <div className="grid gap-6 md:grid-cols-2">
          <MonthlyReportCard dailyData={dailyData} goal={goal} />
          <AchievementBadges dailyData={dailyData} streak={streak} goal={goal} />
        </div>

        {/* Did You Know + Recommendation */}
        <div className="grid gap-6 md:grid-cols-2">
          <DidYouKnow dailyData={dailyData} profile={profile} />
          <HydrationRecommendation profile={profile} goal={goal} dailyData={dailyData} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyHydration;
