import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { useAINGOMatching } from "@/hooks/useAINGOMatching";
import { Sparkles, Check, Loader2 } from "lucide-react";

interface AIMatchingDialogProps {
  donationId: string;
  onSelectNGO: (ngoId: string) => void;
}

const AIMatchingDialog = ({ donationId, onSelectNGO }: AIMatchingDialogProps) => {
  const [open, setOpen] = useState(false);
  const { findMatches, matches, loading } = useAINGOMatching();

  const handleFindMatches = async () => {
    await findMatches(donationId);
  };

  const handleSelectNGO = (ngoId: string) => {
    onSelectNGO(ngoId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" onClick={handleFindMatches}>
          <Sparkles className="h-4 w-4" />
          AI-Powered NGO Matching
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Recommended NGOs
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-3">AI is analyzing the best matches...</span>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match, idx) => (
              <Card key={match.user_id} className="relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                    {match.match_score}% Match
                  </div>
                </div>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{match.organization_name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{match.reason}</p>
                    </div>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    onClick={() => handleSelectNGO(match.user_id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Select This NGO
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Click "Find Matches" to get AI-powered NGO recommendations
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIMatchingDialog;
