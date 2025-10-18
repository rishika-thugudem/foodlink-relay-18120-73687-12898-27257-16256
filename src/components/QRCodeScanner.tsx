import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Check, X } from "lucide-react";

interface QRCodeScannerProps {
  taskId: string;
  action: "pickup" | "delivery";
  onVerified: () => void;
}

const QRCodeScanner = ({ taskId, action, onVerified }: QRCodeScannerProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!code.trim()) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-qr-code", {
        body: { code: code.trim().toUpperCase(), taskId, action },
      });

      if (error) throw error;

      if (data.valid) {
        toast({
          title: "Verified!",
          description: data.message,
        });
        onVerified();
      } else {
        toast({
          title: "Invalid Code",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {action === "pickup" ? "Verify Pickup" : "Verify Delivery"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            className="font-mono text-lg"
          />
          <Button onClick={handleVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Scan the QR code or enter the 8-character verification code shown on the{" "}
          {action === "pickup" ? "donor's" : "NGO's"} screen
        </p>
      </CardContent>
    </Card>
  );
};

export default QRCodeScanner;
