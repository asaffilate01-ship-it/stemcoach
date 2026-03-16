import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Pen, Eraser, Trash2, Circle, Square, Minus, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Tool = "pen" | "eraser" | "line" | "rect" | "circle";

interface DrawEvent {
  type: "stroke" | "shape" | "clear";
  tool: Tool;
  color: string;
  size: number;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  canvasW: number;
  canvasH: number;
}

const COLORS = [
  "hsl(var(--foreground))",
  "hsl(var(--primary))",
  "hsl(0 84% 60%)",
  "hsl(142 71% 45%)",
  "hsl(48 96% 53%)",
  "hsl(280 67% 55%)",
];

const SIZES = [2, 4, 8, 16];

interface WhiteboardProps {
  roomId?: string;
}

export function Whiteboard({ roomId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const [peerCount, setPeerCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx?.drawImage(canvas, 0, 0);

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }, []);

  // Apply a remote draw event
  const applyDrawEvent = useCallback((evt: DrawEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scaleX = canvas.width / evt.canvasW;
    const scaleY = canvas.height / evt.canvasH;

    if (evt.type === "clear") {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.save();
    ctx.strokeStyle = evt.tool === "eraser" ? "white" : evt.color;
    ctx.lineWidth = evt.tool === "eraser" ? evt.size * 4 : evt.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (evt.type === "stroke" && evt.points && evt.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(evt.points[0].x * scaleX, evt.points[0].y * scaleY);
      for (let i = 1; i < evt.points.length; i++) {
        ctx.lineTo(evt.points[i].x * scaleX, evt.points[i].y * scaleY);
      }
      ctx.stroke();
    } else if (evt.type === "shape" && evt.start && evt.end) {
      const sx = evt.start.x * scaleX, sy = evt.start.y * scaleY;
      const ex = evt.end.x * scaleX, ey = evt.end.y * scaleY;

      ctx.beginPath();
      if (evt.tool === "line") {
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else if (evt.tool === "rect") {
        ctx.strokeRect(sx, sy, ex - sx, ey - sy);
      } else if (evt.tool === "circle") {
        const rx = Math.abs(ex - sx) / 2;
        const ry = Math.abs(ey - sy) / 2;
        const cx = sx + (ex - sx) / 2;
        const cy = sy + (ey - sy) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }, []);

  // Setup realtime channel
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`whiteboard-${roomId}`, {
      config: { presence: { key: crypto.randomUUID() } },
    });

    channel
      .on("broadcast", { event: "draw" }, ({ payload }) => {
        applyDrawEvent(payload as DrawEvent);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setPeerCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ joined_at: Date.now() });
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, applyDrawEvent]);

  const broadcastDraw = useCallback((evt: DrawEvent) => {
    channelRef.current?.send({ type: "broadcast", event: "draw", payload: evt });
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    setStartPos(pos);
    currentStrokeRef.current = [pos];

    if (tool === "pen" || tool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    if (tool === "line" || tool === "rect" || tool === "circle") {
      snapshotRef.current = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);

    if (tool === "pen") {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      currentStrokeRef.current.push(pos);
    } else if (tool === "eraser") {
      ctx.strokeStyle = "white";
      ctx.lineWidth = size * 4;
      ctx.lineCap = "round";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      currentStrokeRef.current.push(pos);
    } else if (snapshotRef.current) {
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";

      if (tool === "line") {
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === "rect") {
        ctx.beginPath();
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === "circle") {
        const rx = Math.abs(pos.x - startPos.x) / 2;
        const ry = Math.abs(pos.y - startPos.y) / 2;
        const cx = startPos.x + (pos.x - startPos.x) / 2;
        const cy = startPos.y + (pos.y - startPos.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const endDraw = (e?: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (tool === "pen" || tool === "eraser") {
      const evt: DrawEvent = {
        type: "stroke",
        tool,
        color,
        size,
        points: currentStrokeRef.current,
        canvasW: canvas.width,
        canvasH: canvas.height,
      };
      broadcastDraw(evt);
    } else {
      const endPos = e && "clientX" in e ? getPos(e) : startPos;
      const evt: DrawEvent = {
        type: "shape",
        tool,
        color,
        size,
        start: startPos,
        end: endPos,
        canvasW: canvas.width,
        canvasH: canvas.height,
      };
      broadcastDraw(evt);
    }

    setIsDrawing(false);
    snapshotRef.current = null;
    currentStrokeRef.current = [];
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (canvasRef.current) {
      broadcastDraw({
        type: "clear",
        tool: "pen",
        color: "",
        size: 0,
        canvasW: canvasRef.current.width,
        canvasH: canvasRef.current.height,
      });
    }
  };

  const tools: { id: Tool; icon: typeof Pen; label: string }[] = [
    { id: "pen", icon: Pen, label: "Pen" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "rect", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Circle, label: "Circle" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b bg-muted/30 px-3 py-2">
        {tools.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tool === t.id ? "default" : "ghost"}
            onClick={() => setTool(t.id)}
            className="h-8 w-8 p-0"
            title={t.label}
          >
            <t.icon className="h-4 w-4" />
          </Button>
        ))}

        <div className="mx-1 h-6 w-px bg-border" />

        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`h-6 w-6 rounded-full border-2 transition-transform ${color === c ? "scale-125 border-foreground" : "border-transparent"}`}
            style={{ backgroundColor: c }}
          />
        ))}

        <div className="mx-1 h-6 w-px bg-border" />

        {SIZES.map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className={`flex h-8 w-8 items-center justify-center rounded ${size === s ? "bg-primary/20" : ""}`}
          >
            <div className="rounded-full bg-foreground" style={{ width: s + 2, height: s + 2 }} />
          </button>
        ))}

        <div className="mx-1 h-6 w-px bg-border" />

        <Button size="sm" variant="ghost" onClick={clearCanvas} className="h-8 gap-1 text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </Button>

        {roomId && peerCount > 0 && (
          <>
            <div className="mx-1 h-6 w-px bg-border" />
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {peerCount} online
            </span>
          </>
        )}
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 cursor-crosshair overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className="touch-none"
        />
      </div>
    </div>
  );
}
