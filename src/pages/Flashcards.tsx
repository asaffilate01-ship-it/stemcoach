import { useState, useEffect, useCallback, useMemo } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Plus, Brain, Check, X, Loader2 } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string | null;
  topic: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
}

function sm2(card: Flashcard, quality: number): Partial<Flashcard> {
  let { ease_factor, interval_days, repetitions } = card;

  if (quality >= 3) {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions++;
  } else {
    repetitions = 0;
    interval_days = 1;
  }

  ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const next = new Date();
  next.setDate(next.getDate() + interval_days);

  return {
    ease_factor,
    interval_days,
    repetitions,
    next_review: next.toISOString().slice(0, 10),
  };
}

export default function Flashcards() {
  useDocumentTitle("Flashcards");
  const { user } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"deck" | "review">("deck");

  useEffect(() => {
    if (!user) return;
    loadCards();
  }, [user]);

  const loadCards = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .order("next_review", { ascending: true });
    setCards((data as Flashcard[]) || []);
    setLoading(false);
  };

  const dueCards = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return cards.filter((c) => c.next_review <= today);
  }, [cards]);

  const reviewCards = mode === "review" ? dueCards : cards;
  const currentCard = reviewCards[currentIdx];

  const generateFromWrongAnswers = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data: created, error } = await supabase.rpc("create_flashcards_from_mistakes", { _limit: 20 });
      if (error) throw error;
      await loadCards();
      const count = Number(created || 0);
      toast(count > 0
        ? { title: `${count} flashcards created!`, description: "Generated securely from your missed questions." }
        : { title: "All caught up!", description: "No new missed questions need flashcards." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setGenerating(false);
  };

  const rateCard = async (quality: number) => {
    if (!currentCard) return;
    const updates = sm2(currentCard, quality);
    await supabase
      .from("flashcards")
      .update(updates as any)
      .eq("id", currentCard.id);

    setCards((prev) =>
      prev.map((c) => (c.id === currentCard.id ? { ...c, ...updates } as Flashcard : c))
    );
    setFlipped(false);
    setCurrentIdx((prev) => {
      const next = prev + 1;
      return next >= reviewCards.length ? 0 : next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading flashcards...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <PageTransition>
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="stem-label mb-1">Study</div>
            <h1 className="stem-heading text-3xl">Flashcards</h1>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === "deck" ? "default" : "outline"}
              onClick={() => { setMode("deck"); setCurrentIdx(0); setFlipped(false); }}
              className="rounded-xl"
            >
              All ({cards.length})
            </Button>
            <Button
              size="sm"
              variant={mode === "review" ? "default" : "outline"}
              onClick={() => { setMode("review"); setCurrentIdx(0); setFlipped(false); }}
              className="rounded-xl"
            >
              Due ({dueCards.length})
            </Button>
          </div>
        </div>

        <Button
          onClick={generateFromWrongAnswers}
          disabled={generating}
          variant="outline"
          className="mb-6 w-full gap-2 rounded-xl"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Auto-generate from missed questions
        </Button>

        {reviewCards.length === 0 ? (
          <div className="stem-card rounded-xl p-12 text-center">
            <Brain className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-semibold">
              {mode === "review" ? "No cards due for review!" : "No flashcards yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {mode === "review"
                ? "Come back later or switch to view all cards."
                : "Click the button above to generate cards from your wrong answers."}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-center text-sm text-muted-foreground">
              Card {currentIdx + 1} of {reviewCards.length}
              {currentCard?.subject && (
                <span className="ml-2 rounded-lg bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {currentCard.subject}
                </span>
              )}
              {currentCard?.topic && (
                <span className="ml-1 rounded-lg bg-muted px-2 py-0.5 text-xs">
                  {currentCard.topic}
                </span>
              )}
            </div>

            <div
              onClick={() => setFlipped(!flipped)}
              className="stem-card cursor-pointer rounded-2xl p-8 text-center transition-all hover:shadow-lg"
              style={{ minHeight: 200, perspective: 1000 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={flipped ? "back" : "front"}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex min-h-[160px] flex-col items-center justify-center"
                >
                  <span className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {flipped ? "Answer" : "Question"}
                  </span>
                  <p className="whitespace-pre-wrap text-lg leading-relaxed">
                    {flipped ? currentCard?.back : currentCard?.front}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <p className="mt-2 text-center text-xs text-muted-foreground">
              {flipped ? "Rate your recall below" : "Tap to reveal answer"}
            </p>

            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex justify-center gap-2"
              >
                <Button size="sm" variant="outline" onClick={() => rateCard(1)} className="gap-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5">
                  <X className="h-3.5 w-3.5" /> Again
                </Button>
                <Button size="sm" variant="outline" onClick={() => rateCard(3)} className="gap-1 rounded-xl">
                  Hard
                </Button>
                <Button size="sm" variant="outline" onClick={() => rateCard(4)} className="gap-1 rounded-xl border-primary/30 text-primary hover:bg-primary/5">
                  Good
                </Button>
                <Button size="sm" variant="outline" onClick={() => rateCard(5)} className="gap-1 rounded-xl border-success/30 text-success hover:bg-success/5">
                  <Check className="h-3.5 w-3.5" /> Easy
                </Button>
              </motion.div>
            )}

            <div className="mt-6 flex justify-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setFlipped(false); }}
                disabled={currentIdx === 0}
                className="rounded-xl"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setCurrentIdx(Math.min(reviewCards.length - 1, currentIdx + 1)); setFlipped(false); }}
                disabled={currentIdx === reviewCards.length - 1}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          </>
        )}
        </main>
      </PageTransition>
    </div>
  );
}
