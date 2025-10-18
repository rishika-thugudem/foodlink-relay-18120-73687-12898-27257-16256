import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NearestVolunteer {
  volunteer_id: string;
  volunteer_name: string;
  distance_km: number;
}

export const useNearestVolunteer = () => {
  const [loading, setLoading] = useState(false);
  const [volunteers, setVolunteers] = useState<NearestVolunteer[]>([]);
  const { toast } = useToast();

  const findNearestVolunteers = async (
    pickupLat: number,
    pickupLng: number,
    maxDistanceKm = 50
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("find_nearest_volunteer", {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        max_distance_km: maxDistanceKm,
      });

      if (error) throw error;

      setVolunteers(data || []);

      if (data && data.length > 0) {
        toast({
          title: "Volunteers Found",
          description: `Found ${data.length} volunteers within ${maxDistanceKm}km`,
        });
      } else {
        toast({
          title: "No Volunteers Nearby",
          description: `No volunteers found within ${maxDistanceKm}km radius`,
          variant: "destructive",
        });
      }

      return data;
    } catch (error: any) {
      console.error("Find volunteer error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to find volunteers",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (taskId: string, volunteerId: string) => {
    try {
      const { error } = await supabase
        .from("volunteer_tasks")
        .update({
          volunteer_id: volunteerId,
          status: "assigned",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;

      // Create notification for volunteer
      await supabase.from("notifications").insert({
        user_id: volunteerId,
        title: "New Task Assigned",
        message: "You have been assigned a new delivery task",
        type: "task_assigned",
        related_id: taskId,
      });

      toast({
        title: "Task Assigned",
        description: "Volunteer has been notified",
      });

      return true;
    } catch (error: any) {
      console.error("Assign task error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign task",
        variant: "destructive",
      });
      return false;
    }
  };

  return { findNearestVolunteers, assignTask, volunteers, loading };
};
