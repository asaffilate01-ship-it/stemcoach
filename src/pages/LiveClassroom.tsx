import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Whiteboard } from "@/components/classroom/Whiteboard";
import { Video, PenTool, Users, Copy, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const JITSI_DOMAIN = "meet.jit.si";

export default function LiveClassroom() {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState("");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(true);

  const generateRoom = () => {
    const id = `stemcoach-${Date.now().toString(36)}`;
    setRoomName(id);
  };

  const joinRoom = () => {
    if (!roomName.trim()) {
      toast({ title: "Enter a room name", variant: "destructive" });
      return;
    }
    setActiveRoom(roomName.trim().replace(/\s+/g, "-").toLowerCase());
  };

  const copyLink = () => {
    const url = `https://${JITSI_DOMAIN}/${activeRoom}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Room link copied!" });
  };

  if (!activeRoom) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto flex max-w-lg flex-col items-center gap-6 px-4 pt-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Video className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Live Classroom</h1>
          <p className="text-center text-muted-foreground">
            Start or join a live video classroom with a built-in collaborative whiteboard.
          </p>

          <div className="flex w-full gap-2">
            <Input
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            />
            <Button onClick={joinRoom}>Join</Button>
          </div>

          <Button variant="outline" onClick={generateRoom} className="gap-2">
            <Users className="h-4 w-4" /> Generate New Room
          </Button>
        </div>
      </div>
    );
  }

  const jitsiUrl = `https://${JITSI_DOMAIN}/${activeRoom}#userInfo.displayName="${encodeURIComponent(user?.email?.split("@")[0] || "Student")}"&config.prejoinConfig.enabled=false&config.startWithAudioMuted=true`;

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader />

      {/* Room bar */}
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2">
        <span className="text-sm font-medium text-muted-foreground">Room:</span>
        <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono">{activeRoom}</code>
        <Button size="sm" variant="ghost" onClick={copyLink} className="h-7 gap-1">
          <Copy className="h-3 w-3" /> Copy Link
        </Button>
        <a href={`https://${JITSI_DOMAIN}/${activeRoom}`} target="_blank" rel="noopener noreferrer">
          <Button size="sm" variant="ghost" className="h-7 gap-1">
            <ExternalLink className="h-3 w-3" /> Open Full
          </Button>
        </a>
        <div className="flex-1" />
        <Button
          size="sm"
          variant={showWhiteboard ? "default" : "outline"}
          onClick={() => setShowWhiteboard(!showWhiteboard)}
          className="gap-1.5"
        >
          <PenTool className="h-3.5 w-3.5" />
          {showWhiteboard ? "Hide" : "Show"} Whiteboard
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setActiveRoom(null)}>
          Leave
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {showWhiteboard ? (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={55} minSize={30}>
              <iframe
                src={jitsiUrl}
                className="h-full w-full border-0"
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                title="Live Video"
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={45} minSize={25}>
              <Whiteboard />
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <iframe
            src={jitsiUrl}
            className="h-full w-full border-0"
            allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
            title="Live Video"
          />
        )}
      </div>
    </div>
  );
}
