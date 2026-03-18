import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ArrowRight, Calendar, Building2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const boards = [
  { id: "aqa", name: "AQA", country: "🇬🇧" },
  { id: "edexcel", name: "Edexcel / Pearson", country: "🇬🇧" },
  { id: "ocr", name: "OCR", country: "🇬🇧" },
  { id: "ocr-mei", name: "OCR MEI", country: "🇬🇧" },
  { id: "wjec", name: "WJEC / Eduqas", country: "🏴" },
  { id: "caie", name: "Cambridge (CAIE)", country: "🌍" },
  { id: "ib", name: "IB", country: "🌍" },
  { id: "ap", name: "AP (College Board)", country: "🇺🇸" },
  { id: "cbse", name: "CBSE", country: "🇮🇳" },
  { id: "fbise", name: "FBISE", country: "🇵🇰" },
];

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "Economics", "Business Studies", "Geography", "History", "Psychology",
];

const years = Array.from({ length: 10 }, (_, i) => (2024 - i).toString());

const sessions = ["May/June", "October/November", "January"];

// Mock past paper data
const mockPapers = [
  { id: "1", board: "aqa", subject: "Mathematics", year: "2024", session: "May/June", paper: "Paper 1 (Non-Calculator)", level: "GCSE", duration: "1h 30m", marks: 80 },
  { id: "2", board: "aqa", subject: "Mathematics", year: "2024", session: "May/June", paper: "Paper 2 (Calculator)", level: "GCSE", duration: "1h 30m", marks: 80 },
  { id: "3", board: "aqa", subject: "Mathematics", year: "2024", session: "May/June", paper: "Paper 3 (Calculator)", level: "GCSE", duration: "1h 30m", marks: 80 },
  { id: "4", board: "edexcel", subject: "Mathematics", year: "2024", session: "May/June", paper: "Paper 1 (Non-Calculator)", level: "GCSE", duration: "1h 30m", marks: 80 },
  { id: "5", board: "edexcel", subject: "Mathematics", year: "2024", session: "May/June", paper: "Paper 2 (Calculator)", level: "GCSE", duration: "1h 30m", marks: 80 },
  { id: "6", board: "aqa", subject: "Physics", year: "2024", session: "May/June", paper: "Paper 1", level: "GCSE", duration: "1h 45m", marks: 100 },
  { id: "7", board: "aqa", subject: "Physics", year: "2024", session: "May/June", paper: "Paper 2", level: "GCSE", duration: "1h 45m", marks: 100 },
  { id: "8", board: "edexcel", subject: "Chemistry", year: "2024", session: "May/June", paper: "Paper 1", level: "GCSE", duration: "1h 45m", marks: 100 },
  { id: "9", board: "ocr", subject: "Biology", year: "2023", session: "May/June", paper: "Paper 1 (Breadth)", level: "A-Level", duration: "2h", marks: 100 },
  { id: "10", board: "caie", subject: "Physics", year: "2023", session: "October/November", paper: "Paper 1 (MCQ)", level: "AS-Level", duration: "1h 15m", marks: 40 },
  { id: "11", board: "caie", subject: "Physics", year: "2023", session: "October/November", paper: "Paper 2 (Structured)", level: "AS-Level", duration: "1h 15m", marks: 60 },
  { id: "12", board: "ib", subject: "Mathematics", year: "2023", session: "May/June", paper: "Paper 1 (No Calculator)", level: "SL", duration: "1h 30m", marks: 80 },
  { id: "13", board: "cbse", subject: "Physics", year: "2024", session: "May/June", paper: "Set 1", level: "Class 12", duration: "3h", marks: 70 },
  { id: "14", board: "aqa", subject: "Computer Science", year: "2024", session: "May/June", paper: "Paper 1", level: "GCSE", duration: "1h 30m", marks: 80 },
  { id: "15", board: "edexcel", subject: "Economics", year: "2024", session: "May/June", paper: "Paper 1 (Microeconomics)", level: "A-Level", duration: "2h", marks: 100 },
  { id: "16", board: "aqa", subject: "Psychology", year: "2024", session: "May/June", paper: "Paper 1", level: "A-Level", duration: "2h", marks: 96 },
  { id: "17", board: "aqa", subject: "Geography", year: "2023", session: "May/June", paper: "Paper 1 (Physical)", level: "GCSE", duration: "1h 30m", marks: 88 },
  { id: "18", board: "edexcel", subject: "History", year: "2023", session: "May/June", paper: "Paper 1", level: "GCSE", duration: "1h 15m", marks: 52 },
  { id: "19", board: "aqa", subject: "Business Studies", year: "2024", session: "May/June", paper: "Paper 1", level: "A-Level", duration: "2h", marks: 100 },
  { id: "20", board: "ap", subject: "Physics", year: "2024", session: "May/June", paper: "AP Physics 1", level: "AP", duration: "3h", marks: 50 },
];

export default function PastPapers() {
  useDocumentTitle("Past Papers | STEMCoach");
  const navigate = useNavigate();
  const [board, setBoard] = useState<string>("all");
  const [subject, setSubject] = useState<string>("all");
  const [year, setYear] = useState<string>("all");

  const filtered = mockPapers.filter((p) => {
    if (board !== "all" && p.board !== board) return false;
    if (subject !== "all" && p.subject !== subject) return false;
    if (year !== "all" && p.year !== year) return false;
    return true;
  });

  const getBoardName = (id: string) => boards.find((b) => b.id === id)?.name || id;
  const getBoardFlag = (id: string) => boards.find((b) => b.id === id)?.country || "";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main id="main-content" className="container mx-auto px-4 py-6 pb-28 lg:pb-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">📝 Past Papers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Practice with real exam-style questions from past papers</p>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select value={board} onValueChange={setBoard}>
            <SelectTrigger>
              <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Boards" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Boards</SelectItem>
              {boards.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.country} {b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger>
              <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <p className="mb-4 text-sm text-muted-foreground">{filtered.length} paper{filtered.length !== 1 ? "s" : ""} found</p>

        {/* Papers Grid */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No papers match your filters</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((paper, i) => (
              <motion.div
                key={paper.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="group cursor-pointer border-border/50 transition-all hover:border-primary/30 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">{getBoardFlag(paper.board)}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{getBoardName(paper.board)}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{paper.level}</span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-foreground">{paper.subject}</h3>
                        <p className="text-xs text-muted-foreground">{paper.paper}</p>
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{paper.year} · {paper.session}</span>
                          <span>{paper.duration}</span>
                          <span>{paper.marks} marks</span>
                        </div>
                      </div>
                      <FileText className="h-8 w-8 text-muted-foreground/30 transition-colors group-hover:text-primary/50" />
                    </div>
                    <Button
                      size="sm"
                      className="mt-3 w-full gap-1.5 text-xs"
                      onClick={() => navigate(`/practice/past-paper?board=${paper.board}&subject=${paper.subject.toLowerCase()}`)}
                    >
                      Start Practice <ArrowRight className="h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
