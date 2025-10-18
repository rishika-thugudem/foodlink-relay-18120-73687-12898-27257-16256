import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NGOMatch {
  user_id: string;
  organization_name: string;
  match_score: number;
  reason: string;
}

export const useAINGOMatching = () => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<NGOMatch[]>([]);
  const { toast } = useToast();

  const findMatches = async (donationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-ngo-matcher", {
        body: { donationId },
      });

      if (error) throw error;

      setMatches(data.matches || []);
      
      toast({
        title: "AI Matching Complete",
        description: `Found ${data.matches?.length || 0} suitable NGOs`,
      });

      return data.matches;
    } catch (error: any) {
      console.error("AI matching error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to find NGO matches",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { findMatches, matches, loading };
};
