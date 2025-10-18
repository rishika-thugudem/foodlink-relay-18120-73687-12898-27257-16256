import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useVolunteerLocation = (volunteerId: string | undefined, enableTracking = false) => {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!volunteerId || !enableTracking) return;

    let watchId: number;

    const startTracking = () => {
      if ("geolocation" in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const newLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              heading: position.coords.heading,
              speed: position.coords.speed,
              accuracy: position.coords.accuracy,
            };

            setLocation(newLocation);

            // Update location in database
            try {
              const { error: upsertError } = await supabase
                .from("volunteer_locations")
                .upsert({
                  volunteer_id: volunteerId,
                  ...newLocation,
                  updated_at: new Date().toISOString(),
                });

              if (upsertError) throw upsertError;
            } catch (err: any) {
              console.error("Error updating location:", err);
              setError(err.message);
            }
          },
          (err) => {
            console.error("Geolocation error:", err);
            setError(err.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
          }
        );
      } else {
        setError("Geolocation not supported");
      }
    };

    startTracking();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [volunteerId, enableTracking]);

  return { location, error };
};

export const useTrackVolunteerLocation = (volunteerId: string | undefined) => {
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!volunteerId) return;

    const fetchInitialLocation = async () => {
      const { data, error } = await supabase
        .from("volunteer_locations")
        .select("*")
        .eq("volunteer_id", volunteerId)
        .single();

      if (!error && data) {
        setLocation(data);
      }
      setLoading(false);
    };

    fetchInitialLocation();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`volunteer-location-${volunteerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "volunteer_locations",
          filter: `volunteer_id=eq.${volunteerId}`,
        },
        (payload) => {
          setLocation(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [volunteerId]);

  return { location, loading };
};
