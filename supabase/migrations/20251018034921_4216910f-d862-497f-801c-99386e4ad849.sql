-- Add geospatial function to find nearest available volunteer
CREATE OR REPLACE FUNCTION public.find_nearest_volunteer(
  pickup_lat DECIMAL,
  pickup_lng DECIMAL,
  max_distance_km DECIMAL DEFAULT 50
)
RETURNS TABLE (
  volunteer_id UUID,
  volunteer_name TEXT,
  distance_km DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    ROUND(
      (6371 * acos(
        cos(radians(pickup_lat)) * 
        cos(radians(p.latitude)) * 
        cos(radians(p.longitude) - radians(pickup_lng)) + 
        sin(radians(pickup_lat)) * 
        sin(radians(p.latitude))
      ))::NUMERIC, 2
    ) as distance
  FROM profiles p
  INNER JOIN user_roles ur ON ur.user_id = p.id
  WHERE 
    ur.role = 'volunteer'
    AND p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND (6371 * acos(
      cos(radians(pickup_lat)) * 
      cos(radians(p.latitude)) * 
      cos(radians(p.longitude) - radians(pickup_lng)) + 
      sin(radians(pickup_lat)) * 
      sin(radians(p.latitude))
    )) <= max_distance_km
  ORDER BY distance ASC
  LIMIT 10;
END;
$$;

-- Add function to bundle nearby tasks
CREATE OR REPLACE FUNCTION public.find_bundleable_tasks(
  task_id UUID,
  max_distance_km DECIMAL DEFAULT 5
)
RETURNS TABLE (
  bundleable_task_id UUID,
  pickup_address TEXT,
  dropoff_address TEXT,
  distance_from_pickup_km DECIMAL,
  distance_from_dropoff_km DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_pickup_lat DECIMAL;
  task_pickup_lng DECIMAL;
  task_dropoff_lat DECIMAL;
  task_dropoff_lng DECIMAL;
BEGIN
  -- Get the coordinates of the reference task
  SELECT pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude
  INTO task_pickup_lat, task_pickup_lng, task_dropoff_lat, task_dropoff_lng
  FROM volunteer_tasks
  WHERE id = task_id;

  RETURN QUERY
  SELECT 
    vt.id,
    vt.pickup_address,
    vt.dropoff_address,
    ROUND(
      (6371 * acos(
        cos(radians(task_pickup_lat)) * 
        cos(radians(vt.pickup_latitude)) * 
        cos(radians(vt.pickup_longitude) - radians(task_pickup_lng)) + 
        sin(radians(task_pickup_lat)) * 
        sin(radians(vt.pickup_latitude))
      ))::NUMERIC, 2
    ) as pickup_distance,
    ROUND(
      (6371 * acos(
        cos(radians(task_dropoff_lat)) * 
        cos(radians(vt.dropoff_latitude)) * 
        cos(radians(vt.dropoff_longitude) - radians(task_dropoff_lng)) + 
        sin(radians(task_dropoff_lat)) * 
        sin(radians(vt.dropoff_latitude))
      ))::NUMERIC, 2
    ) as dropoff_distance
  FROM volunteer_tasks vt
  WHERE 
    vt.id != task_id
    AND vt.status = 'available'
    AND (6371 * acos(
      cos(radians(task_pickup_lat)) * 
      cos(radians(vt.pickup_latitude)) * 
      cos(radians(vt.pickup_longitude) - radians(task_pickup_lng)) + 
      sin(radians(task_pickup_lat)) * 
      sin(radians(vt.pickup_latitude))
    )) <= max_distance_km
    AND (6371 * acos(
      cos(radians(task_dropoff_lat)) * 
      cos(radians(vt.dropoff_latitude)) * 
      cos(radians(vt.dropoff_longitude) - radians(task_dropoff_lng)) + 
      sin(radians(task_dropoff_lat)) * 
      sin(radians(vt.dropoff_latitude))
    )) <= max_distance_km
  ORDER BY pickup_distance ASC, dropoff_distance ASC
  LIMIT 5;
END;
$$;

-- Create table for volunteer live locations
CREATE TABLE IF NOT EXISTS public.volunteer_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2),
  speed DECIMAL(6, 2),
  accuracy DECIMAL(8, 2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(volunteer_id)
);

-- Enable RLS
ALTER TABLE public.volunteer_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for volunteer_locations
CREATE POLICY "Anyone can view volunteer locations"
  ON public.volunteer_locations FOR SELECT
  USING (true);

CREATE POLICY "Volunteers can update their own location"
  ON public.volunteer_locations FOR INSERT
  WITH CHECK (auth.uid() = volunteer_id);

CREATE POLICY "Volunteers can update their location"
  ON public.volunteer_locations FOR UPDATE
  USING (auth.uid() = volunteer_id);

-- Enable realtime for volunteer locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.volunteer_locations;

-- Add QR code field to donations
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Add verification fields to volunteer_tasks
ALTER TABLE public.volunteer_tasks ADD COLUMN IF NOT EXISTS pickup_verified BOOLEAN DEFAULT false;
ALTER TABLE public.volunteer_tasks ADD COLUMN IF NOT EXISTS pickup_verification_code TEXT;
ALTER TABLE public.volunteer_tasks ADD COLUMN IF NOT EXISTS delivery_verified BOOLEAN DEFAULT false;
ALTER TABLE public.volunteer_tasks ADD COLUMN IF NOT EXISTS delivery_verification_code TEXT;

-- Create index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_volunteer_locations_coords ON public.volunteer_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_pickup_coords ON public.volunteer_tasks(pickup_latitude, pickup_longitude);
CREATE INDEX IF NOT EXISTS idx_volunteer_tasks_dropoff_coords ON public.volunteer_tasks(dropoff_latitude, dropoff_longitude);