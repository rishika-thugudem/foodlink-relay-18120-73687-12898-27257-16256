import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Leaf, Package, Users, TrendingUp } from "lucide-react";

interface Analytics {
  totalDonations: number;
  totalMeals: number;
  totalCO2Saved: number;
  activeVolunteers: number;
  topDonors: any[];
  topVolunteers: any[];
  recentImpact: {
    thisWeek: number;
    lastWeek: number;
  };
}

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get total stats
        const { data: profiles } = await supabase
          .from("profiles")
          .select("total_donations, total_meals_donated, co2_saved_kg, total_deliveries");

        const totalDonations = profiles?.reduce((sum, p) => sum + (p.total_donations || 0), 0) || 0;
        const totalMeals = profiles?.reduce((sum, p) => sum + (p.total_meals_donated || 0), 0) || 0;
        const totalCO2Saved = profiles?.reduce((sum, p) => sum + (Number(p.co2_saved_kg) || 0), 0) || 0;
        const activeVolunteers = profiles?.filter(p => (p.total_deliveries || 0) > 0).length || 0;

        // Get top donors
        const { data: topDonors } = await supabase
          .from("profiles")
          .select("full_name, total_donations, total_meals_donated")
          .order("total_donations", { ascending: false })
          .limit(5);

        // Get top volunteers
        const { data: topVolunteers } = await supabase
          .from("profiles")
          .select("full_name, total_deliveries, average_rating")
          .order("total_deliveries", { ascending: false })
          .limit(5);

        // Calculate week-over-week growth
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const { data: thisWeekDonations } = await supabase
          .from("donations")
          .select("estimated_meals")
          .gte("created_at", oneWeekAgo.toISOString());

        const { data: lastWeekDonations } = await supabase
          .from("donations")
          .select("estimated_meals")
          .gte("created_at", twoWeeksAgo.toISOString())
          .lt("created_at", oneWeekAgo.toISOString());

        const thisWeek = thisWeekDonations?.reduce((sum, d) => sum + (d.estimated_meals || 0), 0) || 0;
        const lastWeek = lastWeekDonations?.reduce((sum, d) => sum + (d.estimated_meals || 0), 0) || 0;

        setAnalytics({
          totalDonations,
          totalMeals,
          totalCO2Saved,
          activeVolunteers,
          topDonors: topDonors || [],
          topVolunteers: topVolunteers || [],
          recentImpact: { thisWeek, lastWeek },
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center p-8">No data available</div>;
  }

  const growthPercentage = analytics.recentImpact.lastWeek > 0
    ? ((analytics.recentImpact.thisWeek - analytics.recentImpact.lastWeek) / analytics.recentImpact.lastWeek * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalDonations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meals Served</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMeals.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
            <Leaf className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCO2Saved.toFixed(0)} kg</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{growthPercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.recentImpact.thisWeek} meals this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Donors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topDonors.map((donor, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{donor.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {donor.total_meals_donated} meals donated
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-primary">#{idx + 1}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Volunteers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topVolunteers.map((volunteer, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{volunteer.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {volunteer.total_deliveries} deliveries • ⭐ {Number(volunteer.average_rating).toFixed(1)}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-primary">#{idx + 1}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
