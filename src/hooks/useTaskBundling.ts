import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BundleableTask {
  bundleable_task_id: string;
  pickup_address: string;
  dropoff_address: string;
  distance_from_pickup_km: number;
  distance_from_dropoff_km: number;
}

export const useTaskBundling = () => {
  const [loading, setLoading] = useState(false);
  const [bundleableTasks, setBundleableTasks] = useState<BundleableTask[]>([]);
  const { toast } = useToast();

  const findBundleableTasks = async (taskId: string, maxDistanceKm = 5) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("find_bundleable_tasks", {
        task_id: taskId,
        max_distance_km: maxDistanceKm,
      });

      if (error) throw error;

      setBundleableTasks(data || []);

      if (data && data.length > 0) {
        toast({
          title: "Nearby Tasks Found",
          description: `Found ${data.length} tasks that can be bundled together`,
        });
      }

      return data;
    } catch (error: any) {
      console.error("Task bundling error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to find bundleable tasks",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const bundleTasks = async (mainTaskId: string, taskIds: string[]) => {
    try {
      const { error } = await supabase
        .from("volunteer_tasks")
        .update({ bundled_tasks: taskIds })
        .eq("id", mainTaskId);

      if (error) throw error;

      // Mark bundled tasks as assigned to prevent double assignment
      await supabase
        .from("volunteer_tasks")
        .update({ status: "assigned" })
        .in("id", taskIds);

      toast({
        title: "Tasks Bundled",
        description: `Successfully bundled ${taskIds.length} tasks together`,
      });

      return true;
    } catch (error: any) {
      console.error("Bundle error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to bundle tasks",
        variant: "destructive",
      });
      return false;
    }
  };

  return { findBundleableTasks, bundleTasks, bundleableTasks, loading };
};
