import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  message: string;
  created_at: string;
}

interface ClassroomChatProps {
  roomId: string;
}

export function ClassroomChat({ roomId }: ClassroomChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load existing messages
    supabase
      .from("classroom_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100)
      .then(({ data }) => setMessages((data as Message[]) || []));

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "classroom_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !user || sending) return;
    setSending(true);
    const displayName = user.email?.split("@")[0] || "Anonymous";
    await supabase.from("classroom_messages").insert({
      room_id: roomId,
      user_id: user.id,
      display_name: displayName,
      message: input.trim(),
    } as any);
    setInput("");
    setSending(false);
  };

  return (
    <div className="flex h-full flex-col border-l bg-background">
      <div className="border-b px-3 py-2">
        <h3 className="text-sm font-semibold">Chat</h3>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-2">
          {messages.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No messages yet</p>
          )}
          {messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="mb-0.5 text-[10px] text-muted-foreground">{msg.display_name}</span>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${
                    isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      <div className="border-t p-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-1.5"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="h-8 text-sm"
          />
          <Button type="submit" size="sm" disabled={sending || !input.trim()} className="h-8 w-8 p-0">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
