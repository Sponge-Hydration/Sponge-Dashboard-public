import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { awsApi } from "@/services/awsApi";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, TrendingUp, User } from "lucide-react";

interface DependentSummary {
  custId: string;
  name: string;
  todayOz: number;
  goal: number;
}

export default function Family() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dependents, setDependents] = useState<DependentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const linked = await awsApi.getDependents(user.id);

      // Fetch goals and all today-data in parallel; today-data uses a single
      // batch decrypt call for all dependents instead of one POST per person.
      const custIds = linked.map(({ CustID }) => CustID);
      const [todaySummary, ...goals] = await Promise.all([
        awsApi.getDependentsTodaySummary(custIds),
        ...linked.map(({ CustID }) => awsApi.getGoal(CustID)),
      ]);

      const summaries = linked.map(({ CustID, Name }, i) => ({
        custId: CustID,
        name: Name,
        todayOz: todaySummary[CustID]?.todayOz ?? 0,
        goal: goals[i] as number,
      }));

      setDependents(summaries);
      setLoading(false);
    };

    load();
  }, [user]);

  const getStatusColor = (oz: number, goal: number) => {
    const pct = oz / goal;
    if (pct >= 1) return "text-green-600";
    if (pct >= 0.5) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusLabel = (oz: number, goal: number) => {
    const pct = oz / goal;
    if (pct >= 1) return "Hydrated";
    if (pct >= 0.5) return "Mild Dehydration";
    return "Dehydrated";
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Family</h1>
        <p className="text-gray-500 text-sm mt-1">Monitor your linked family members' hydration</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : dependents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-medium text-gray-600">No linked family members yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Contact your administrator to link a family member's account.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dependents.map((dep) => (
            <Card
              key={dep.custId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/dashboard/patient/${dep.custId}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {dep.name.charAt(0).toUpperCase()}
                  </div>
                  {dep.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Droplets size={14} />
                    Today
                  </div>
                  <span className={`font-semibold ${getStatusColor(dep.todayOz, dep.goal)}`}>
                    {dep.todayOz.toFixed(1)} / {dep.goal} oz
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      dep.todayOz / dep.goal >= 1
                        ? "bg-green-500"
                        : dep.todayOz / dep.goal >= 0.5
                        ? "bg-yellow-400"
                        : "bg-red-400"
                    }`}
                    style={{ width: `${Math.min(100, (dep.todayOz / dep.goal) * 100).toFixed(1)}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp size={12} className={getStatusColor(dep.todayOz, dep.goal)} />
                  <span className={getStatusColor(dep.todayOz, dep.goal)}>
                    {getStatusLabel(dep.todayOz, dep.goal)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
