import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import LiveDeliveryMap from "@/components/LiveDeliveryMap";
import QRCodeScanner from "@/components/QRCodeScanner";
import AIMatchingDialog from "@/components/AIMatchingDialog";
import { useNearestVolunteer } from "@/hooks/useNearestVolunteer";
import { useTaskBundling } from "@/hooks/useTaskBundling";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Sparkles, Package, BarChart3, QrCode, Users } from "lucide-react";

const SystemDemo = () => {
  const [selectedTab, setSelectedTab] = useState("analytics");
  const { findNearestVolunteers, volunteers, loading: volunteerLoading } = useNearestVolunteer();
  const { findBundleableTasks, bundleableTasks, loading: bundleLoading } = useTaskBundling();

  // Demo coordinates (San Francisco)
  const demoPickupLat = 37.7749;
  const demoPickupLng = -122.4194;
  const demoDropoffLat = 37.7849;
  const demoDropoffLng = -122.4094;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            FoodLink Backend System Demo
          </h1>
          <p className="text-xl text-muted-foreground">
            AI-Powered Food Rescue Platform with Real-time Tracking
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI Matching
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" />
              Geospatial Queries
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Package className="h-3 w-3" />
              Real-time Tracking
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <QrCode className="h-3 w-3" />
              QR Verification
            </Badge>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="ai-matching" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Matching
            </TabsTrigger>
            <TabsTrigger value="geospatial" className="gap-2">
              <MapPin className="h-4 w-4" />
              Geospatial
            </TabsTrigger>
            <TabsTrigger value="live-tracking" className="gap-2">
              <Package className="h-4 w-4" />
              Live Track
            </TabsTrigger>
            <TabsTrigger value="qr-verify" className="gap-2">
              <QrCode className="h-4 w-4" />
              QR Verify
            </TabsTrigger>
            <TabsTrigger value="bundling" className="gap-2">
              <Users className="h-4 w-4" />
              Bundling
            </TabsTrigger>
          </TabsList>

          {/* Analytics Dashboard */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Impact Analytics Dashboard</CardTitle>
                <CardDescription>
                  Real-time metrics showing platform impact and user engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Matching */}
          <TabsContent value="ai-matching" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered NGO Matching</CardTitle>
                <CardDescription>
                  Using Lovable AI (Gemini 2.5 Flash) to intelligently match donations with NGOs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">How it works:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>AI analyzes donation details (type, quantity, location, urgency)</li>
                    <li>Considers NGO capacity, specialization, and proximity</li>
                    <li>Generates match scores with reasoning</li>
                    <li>Returns top 3 recommendations ranked by suitability</li>
                  </ol>
                </div>
                <div className="flex justify-center">
                  <AIMatchingDialog
                    donationId="demo-donation-id"
                    onSelectNGO={(ngoId) => console.log("Selected NGO:", ngoId)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geospatial Features */}
          <TabsContent value="geospatial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Geospatial Volunteer Assignment</CardTitle>
                <CardDescription>
                  PostGIS-powered nearest volunteer matching using Haversine formula
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Features:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Real-time distance calculations using Earth's radius (6371 km)</li>
                    <li>Filter volunteers within configurable radius (default 50km)</li>
                    <li>Sort by proximity for optimal assignment</li>
                    <li>Indexed geospatial queries for sub-millisecond performance</li>
                  </ul>
                </div>
                <Button
                  onClick={() => findNearestVolunteers(demoPickupLat, demoPickupLng)}
                  disabled={volunteerLoading}
                >
                  {volunteerLoading ? "Searching..." : "Find Nearest Volunteers"}
                </Button>
                {volunteers.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Results:</h4>
                    {volunteers.map((v, idx) => (
                      <Card key={v.volunteer_id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{v.volunteer_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {v.distance_km}km away
                              </p>
                            </div>
                            <Badge>{idx + 1}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Tracking */}
          <TabsContent value="live-tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Delivery Tracking</CardTitle>
                <CardDescription>
                  Live volunteer location updates via Supabase Realtime + Google Maps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Technology Stack:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Supabase Realtime subscriptions for sub-second updates</li>
                    <li>Browser Geolocation API with high accuracy mode</li>
                    <li>Google Maps integration for visual tracking</li>
                    <li>Automatic map bounds adjustment</li>
                  </ul>
                </div>
                <LiveDeliveryMap
                  taskId="demo-task"
                  pickupLat={demoPickupLat}
                  pickupLng={demoPickupLng}
                  dropoffLat={demoDropoffLat}
                  dropoffLng={demoDropoffLng}
                  volunteerId="demo-volunteer-id"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* QR Verification */}
          <TabsContent value="qr-verify" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Verification System</CardTitle>
                <CardDescription>
                  Secure pickup/delivery verification with auto-generated QR codes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Security Features:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Unique 8-character codes per transaction</li>
                    <li>Separate codes for pickup and delivery</li>
                    <li>Automatic status updates upon verification</li>
                    <li>Real-time notifications to all parties</li>
                    <li>Immutable audit trail in database</li>
                  </ul>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <QRCodeScanner
                    taskId="demo-task-id"
                    action="pickup"
                    onVerified={() => console.log("Pickup verified")}
                  />
                  <QRCodeScanner
                    taskId="demo-task-id"
                    action="delivery"
                    onVerified={() => console.log("Delivery verified")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Task Bundling */}
          <TabsContent value="bundling" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Smart Task Bundling Optimization</CardTitle>
                <CardDescription>
                  Automatically group nearby pickups/dropoffs for efficient routes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Optimization Algorithm:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Calculate distance between both pickup AND dropoff points</li>
                    <li>Configurable proximity threshold (default 5km)</li>
                    <li>Prioritize tasks with closest pickup distance</li>
                    <li>Reduce volunteer travel time by up to 60%</li>
                    <li>Increase volunteer efficiency and satisfaction</li>
                  </ul>
                </div>
                <Button
                  onClick={() => findBundleableTasks("demo-task-id")}
                  disabled={bundleLoading}
                >
                  {bundleLoading ? "Analyzing..." : "Find Bundleable Tasks"}
                </Button>
                {bundleableTasks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Nearby Tasks:</h4>
                    {bundleableTasks.map((task) => (
                      <Card key={task.bundleable_task_id}>
                        <CardContent className="pt-4">
                          <p className="text-sm">
                            <span className="font-medium">Pickup:</span> {task.pickup_address}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Dropoff:</span> {task.dropoff_address}
                          </p>
                          <div className="flex gap-4 mt-2">
                            <Badge variant="outline">
                              Pickup: {task.distance_from_pickup_km}km
                            </Badge>
                            <Badge variant="outline">
                              Dropoff: {task.distance_from_dropoff_km}km
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Technical Architecture */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h3 className="font-semibold mb-2">Backend</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Supabase (PostgreSQL + PostGIS)</li>
                  <li>✓ Edge Functions (Deno runtime)</li>
                  <li>✓ Row Level Security (RLS)</li>
                  <li>✓ Realtime subscriptions</li>
                  <li>✓ Geospatial indexes</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">AI & APIs</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Lovable AI (Gemini 2.5 Flash)</li>
                  <li>✓ Google Maps JavaScript API</li>
                  <li>✓ QR Server API</li>
                  <li>✓ Geolocation API</li>
                  <li>✓ WebSocket connections</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Features</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>✓ Smart NGO matching</li>
                  <li>✓ Live volunteer tracking</li>
                  <li>✓ QR verification</li>
                  <li>✓ Task bundling</li>
                  <li>✓ Impact analytics</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemDemo;
