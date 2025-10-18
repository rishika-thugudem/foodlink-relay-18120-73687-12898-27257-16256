import { useEffect, useRef, useState } from "react";
import { useTrackVolunteerLocation } from "@/hooks/useVolunteerLocation";
import { Card } from "./ui/card";
import { Loader2 } from "lucide-react";

interface LiveDeliveryMapProps {
  taskId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  volunteerId?: string;
}

const LiveDeliveryMap = ({
  taskId,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  volunteerId,
}: LiveDeliveryMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any>({});
  const { location: volunteerLocation } = useTrackVolunteerLocation(volunteerId);

  useEffect(() => {
    if (!mapRef.current || map) return;

    // Initialize map
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=geometry`;
    script.async = true;
    script.onload = () => {
      const googleMap = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: pickupLat, lng: pickupLng },
        zoom: 12,
      });

      // Add pickup marker
      const pickupMarker = new (window as any).google.maps.Marker({
        position: { lat: pickupLat, lng: pickupLng },
        map: googleMap,
        label: "P",
        title: "Pickup Location",
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 10,
        },
      });

      // Add dropoff marker
      const dropoffMarker = new (window as any).google.maps.Marker({
        position: { lat: dropoffLat, lng: dropoffLng },
        map: googleMap,
        label: "D",
        title: "Dropoff Location",
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 10,
        },
      });

      setMap(googleMap);
      setMarkers({ pickup: pickupMarker, dropoff: dropoffMarker });

      // Fit bounds to show both markers
      const bounds = new (window as any).google.maps.LatLngBounds();
      bounds.extend({ lat: pickupLat, lng: pickupLng });
      bounds.extend({ lat: dropoffLat, lng: dropoffLng });
      googleMap.fitBounds(bounds);
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng]);

  // Update volunteer location marker
  useEffect(() => {
    if (!map || !volunteerLocation) return;

    if (markers.volunteer) {
      markers.volunteer.setPosition({
        lat: volunteerLocation.latitude,
        lng: volunteerLocation.longitude,
      });
    } else {
      const volunteerMarker = new (window as any).google.maps.Marker({
        position: {
          lat: volunteerLocation.latitude,
          lng: volunteerLocation.longitude,
        },
        map: map,
        label: "V",
        title: "Volunteer Location (Live)",
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          fillColor: "#f59e0b",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          scale: 12,
        },
      });

      setMarkers((prev: any) => ({ ...prev, volunteer: volunteerMarker }));

      // Update bounds to include volunteer
      const bounds = new (window as any).google.maps.LatLngBounds();
      bounds.extend({ lat: pickupLat, lng: pickupLng });
      bounds.extend({ lat: dropoffLat, lng: dropoffLng });
      bounds.extend({
        lat: volunteerLocation.latitude,
        lng: volunteerLocation.longitude,
      });
      map.fitBounds(bounds);
    }
  }, [map, volunteerLocation, markers, pickupLat, pickupLng, dropoffLat, dropoffLng]);

  if (!volunteerId) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No volunteer assigned yet</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div ref={mapRef} className="w-full h-[400px]" />
      {!volunteerLocation && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Waiting for volunteer location...</span>
        </div>
      )}
    </Card>
  );
};

export default LiveDeliveryMap;
