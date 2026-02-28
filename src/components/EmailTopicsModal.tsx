import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TopicGroup {
  keyword: string;
  ideas: string[];
}

interface EmailTopicsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: TopicGroup[];
}

const EmailTopicsModal = ({ open, onOpenChange, topics }: EmailTopicsModalProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-video-topics', {
        body: { email: email.trim(), topics: topics.slice(0, 10) },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to send email');

      setSent(true);
      toast({ title: "Email sent!", description: `Top 10 video ideas sent to ${email}` });
    } catch (err: any) {
      toast({
        title: "Failed to send email",
        description: err.message || "Try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setEmail("");
      setSent(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Top 10 Video Ideas
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Check className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Email sent successfully!</p>
            <p className="text-xs text-muted-foreground mt-1">Check your inbox for your video ideas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We'll send the top 10 AI-generated video topic ideas directly to your inbox — ready to use for your next content session.
            </p>
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !email.trim()}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send to My Email
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailTopicsModal;
