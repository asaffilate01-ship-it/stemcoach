import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Twitter, Link2, Copy, Check, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface ShareProgressProps {
  title: string;
  text: string;
  url?: string;
  trigger?: React.ReactNode;
}

export function ShareProgress({ title, text, url, trigger }: ShareProgressProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || window.location.href;
  const fullText = `${text}\n\n${shareUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {}
    }
  };

  const shareLinks = [
    {
      name: "Twitter / X",
      icon: Twitter,
      color: "hover:bg-[hsl(200,100%,45%)]/10 hover:text-[hsl(200,100%,45%)]",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "hover:bg-[hsl(142,70%,45%)]/10 hover:text-[hsl(142,70%,45%)]",
      href: `https://wa.me/?text=${encodeURIComponent(fullText)}`,
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" /> Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" /> Share Your Progress
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {/* Preview */}
          <div className="rounded-xl border border-border/50 bg-muted/50 p-4">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{text}</p>
          </div>

          {/* Share Options */}
          <div className="grid grid-cols-2 gap-2">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all ${link.color}`}
              >
                <link.icon className="h-4 w-4" />
                {link.name}
              </a>
            ))}
          </div>

          {/* Copy & Native Share */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-1.5" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
            {typeof navigator.share !== "undefined" && (
              <Button className="flex-1 gap-1.5" onClick={handleNativeShare}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
