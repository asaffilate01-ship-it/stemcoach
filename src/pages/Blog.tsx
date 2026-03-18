import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, ArrowRight, BookOpen, Lightbulb, GraduationCap, Brain, Clock, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "study-tips", label: "Study Tips", icon: Lightbulb },
  { id: "exam-prep", label: "Exam Prep", icon: GraduationCap },
  { id: "subject-guides", label: "Subject Guides", icon: Brain },
];

// Seed blog posts (will come from DB when admin publishes)
const seedPosts = [
  {
    id: "1", title: "10 Proven Study Techniques Backed by Science", slug: "10-proven-study-techniques",
    excerpt: "Discover the most effective study methods that cognitive science has validated, from spaced repetition to active recall.",
    category: "study-tips", author_name: "STEMCoach Team", published_at: "2026-03-15", read_time: "5 min",
    cover_gradient: "from-primary to-[hsl(258,60%,52%)]",
  },
  {
    id: "2", title: "How to Ace Your GCSE Maths Exam", slug: "ace-gcse-maths",
    excerpt: "A complete guide to GCSE Mathematics preparation: from understanding the mark scheme to time management strategies.",
    category: "exam-prep", author_name: "STEMCoach Team", published_at: "2026-03-12", read_time: "8 min",
    cover_gradient: "from-[hsl(250,80%,55%)] to-[hsl(280,70%,50%)]",
  },
  {
    id: "3", title: "Understanding Organic Chemistry: A Beginner's Guide", slug: "organic-chemistry-guide",
    excerpt: "Break down the complexity of organic chemistry with this structured approach to learning functional groups, mechanisms, and reactions.",
    category: "subject-guides", author_name: "STEMCoach Team", published_at: "2026-03-10", read_time: "10 min",
    cover_gradient: "from-[hsl(142,71%,40%)] to-[hsl(160,60%,38%)]",
  },
  {
    id: "4", title: "The Feynman Technique: Learn Anything Faster", slug: "feynman-technique",
    excerpt: "Named after Nobel Prize-winning physicist Richard Feynman, this technique helps you deeply understand any concept by teaching it simply.",
    category: "study-tips", author_name: "STEMCoach Team", published_at: "2026-03-08", read_time: "4 min",
    cover_gradient: "from-[hsl(38,92%,45%)] to-[hsl(25,85%,50%)]",
  },
  {
    id: "5", title: "A-Level Physics: Essential Formulas You Must Know", slug: "alevel-physics-formulas",
    excerpt: "A comprehensive list of the most important A-Level Physics formulas organized by topic, with tips on when and how to apply them.",
    category: "subject-guides", author_name: "STEMCoach Team", published_at: "2026-03-05", read_time: "7 min",
    cover_gradient: "from-[hsl(340,75%,50%)] to-[hsl(0,84%,55%)]",
  },
  {
    id: "6", title: "How to Create the Perfect Revision Timetable", slug: "revision-timetable",
    excerpt: "Step-by-step guide to building a revision timetable that balances subjects, includes breaks, and maximizes retention.",
    category: "exam-prep", author_name: "STEMCoach Team", published_at: "2026-03-02", read_time: "6 min",
    cover_gradient: "from-[hsl(200,80%,45%)] to-[hsl(220,70%,50%)]",
  },
];

export default function Blog() {
  useDocumentTitle("Blog — Study Tips & Exam Guides | STEMCoach");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = seedPosts.filter((post) => {
    const matchesCategory = category === "all" || post.category === category;
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featured = seedPosts[0];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main id="main-content" className="container mx-auto px-4 py-6 pb-28 lg:pb-12">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">📚 STEMCoach Blog</h1>
          <p className="mt-1 text-sm text-muted-foreground">Study tips, exam strategies, and subject guides to help you succeed</p>
        </div>

        {/* Featured Post */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card
            className="group cursor-pointer overflow-hidden border-border/50 transition-all hover:shadow-lg"
            onClick={() => navigate(`/blog/${featured.slug}`)}
          >
            <div className={`h-32 bg-gradient-to-br ${featured.cover_gradient} sm:h-48`}>
              <div className="flex h-full items-end p-6">
                <div className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                  Featured
                </div>
              </div>
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{featured.published_at}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{featured.read_time}</span>
              </div>
              <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors sm:text-xl">{featured.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{featured.excerpt}</p>
              <div className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
                Read more <ChevronRight className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                category === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Posts Grid */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No articles found</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(1).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="group cursor-pointer border-border/50 transition-all hover:border-primary/20 hover:shadow-md h-full"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <div className={`h-24 rounded-t-xl bg-gradient-to-br ${post.cover_gradient}`} />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                        {post.category.replace("-", " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    <div className="mt-3 text-xs text-muted-foreground">{post.published_at}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
