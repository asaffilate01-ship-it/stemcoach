import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { Footer } from "@/components/layout/Footer";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Calendar, BookOpen, Lightbulb, GraduationCap, Brain, Clock, ChevronRight, ArrowLeft } from "lucide-react";
import { blogArticles } from "@/data/blogArticles";
import { motion } from "framer-motion";

const categories = [
  { id: "all", label: "All", icon: BookOpen },
  { id: "study-tips", label: "Study Tips", icon: Lightbulb },
  { id: "exam-prep", label: "Exam Prep", icon: GraduationCap },
  { id: "subject-guides", label: "Subject Guides", icon: Brain },
];

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
  {
    id: "7", title: "Mastering A-Level Economics: Micro vs Macro", slug: "mastering-economics",
    excerpt: "Understand the key differences between microeconomics and macroeconomics, and learn the best strategies for tackling essay questions.",
    category: "subject-guides", author_name: "STEMCoach Team", published_at: "2026-02-28", read_time: "9 min",
    cover_gradient: "from-[hsl(340,75%,50%)] to-[hsl(360,80%,55%)]",
  },
  {
    id: "8", title: "How Spaced Repetition Supercharges Memory", slug: "spaced-repetition-guide",
    excerpt: "Learn why spacing out your study sessions is far more effective than cramming, and how to implement it with flashcards and apps.",
    category: "study-tips", author_name: "STEMCoach Team", published_at: "2026-02-25", read_time: "6 min",
    cover_gradient: "from-[hsl(270,60%,50%)] to-[hsl(290,55%,45%)]",
  },
  {
    id: "9", title: "GCSE Biology: The Cell Topic Simplified", slug: "gcse-biology-cells",
    excerpt: "Everything you need to know about cell structure, transport, and division for your GCSE Biology exam — broken down clearly.",
    category: "subject-guides", author_name: "STEMCoach Team", published_at: "2026-02-22", read_time: "8 min",
    cover_gradient: "from-[hsl(38,92%,45%)] to-[hsl(25,85%,50%)]",
  },
  {
    id: "10", title: "Top 5 Mistakes Students Make in Maths Exams", slug: "maths-exam-mistakes",
    excerpt: "Avoid these common pitfalls that cost students marks every year — from misreading questions to forgetting units.",
    category: "exam-prep", author_name: "STEMCoach Team", published_at: "2026-02-20", read_time: "5 min",
    cover_gradient: "from-primary to-[hsl(258,60%,52%)]",
  },
  {
    id: "11", title: "Computer Science: Understanding Big-O Notation", slug: "big-o-notation",
    excerpt: "A student-friendly guide to algorithmic complexity. Learn what O(n), O(log n), and O(n²) actually mean with real examples.",
    category: "subject-guides", author_name: "STEMCoach Team", published_at: "2026-02-18", read_time: "7 min",
    cover_gradient: "from-[hsl(200,80%,45%)] to-[hsl(220,70%,50%)]",
  },
  {
    id: "12", title: "How to Write a Perfect English Literature Essay", slug: "english-lit-essay",
    excerpt: "Master the PEAL structure, learn to embed quotations, and understand what examiners are really looking for in your essays.",
    category: "exam-prep", author_name: "STEMCoach Team", published_at: "2026-02-15", read_time: "8 min",
    cover_gradient: "from-[hsl(210,70%,45%)] to-[hsl(230,65%,50%)]",
  },
  {
    id: "13", title: "Active Recall: The #1 Study Method You're Not Using", slug: "active-recall",
    excerpt: "Research shows active recall is one of the most powerful learning strategies. Here's how to use it effectively for every subject.",
    category: "study-tips", author_name: "STEMCoach Team", published_at: "2026-02-12", read_time: "5 min",
    cover_gradient: "from-[hsl(142,71%,40%)] to-[hsl(160,60%,38%)]",
  },
  {
    id: "14", title: "Geography Fieldwork: Planning Your Investigation", slug: "geography-fieldwork",
    excerpt: "A step-by-step guide to planning, conducting, and writing up your geography fieldwork investigation for GCSE and A-Level.",
    category: "subject-guides", author_name: "STEMCoach Team", published_at: "2026-02-10", read_time: "10 min",
    cover_gradient: "from-[hsl(160,60%,38%)] to-[hsl(180,50%,35%)]",
  },
  {
    id: "15", title: "How to Stay Motivated During Exam Season", slug: "exam-motivation",
    excerpt: "Practical tips for maintaining focus, managing stress, and keeping your energy up when the pressure is on.",
    category: "study-tips", author_name: "STEMCoach Team", published_at: "2026-02-08", read_time: "4 min",
    cover_gradient: "from-[hsl(30,80%,50%)] to-[hsl(45,75%,45%)]",
  },
  {
    id: "16", title: "A-Level Chemistry: Organic Mechanisms Cheat Sheet", slug: "organic-mechanisms",
    excerpt: "All the key organic mechanisms you need for A-Level Chemistry in one place — nucleophilic substitution, elimination, and more.",
    category: "subject-guides", author_name: "STEMCoach Team", published_at: "2026-02-05", read_time: "9 min",
    cover_gradient: "from-[hsl(142,71%,40%)] to-[hsl(160,60%,38%)]",
  },
  {
    id: "17", title: "Psychology: Key Studies You Must Know", slug: "psychology-key-studies",
    excerpt: "From Milgram to Bandura — the essential psychology studies for GCSE and A-Level, summarised with evaluation points.",
    category: "subject-guides", author_name: "STEMCoach Team", published_at: "2026-02-02", read_time: "11 min",
    cover_gradient: "from-[hsl(30,80%,50%)] to-[hsl(45,75%,45%)]",
  },
  {
    id: "18", title: "IELTS Writing Task 2: How to Score Band 7+", slug: "ielts-writing-band7",
    excerpt: "A structured approach to IELTS essay writing — learn the format, linking phrases, and common mistakes to avoid.",
    category: "exam-prep", author_name: "STEMCoach Team", published_at: "2026-01-30", read_time: "7 min",
    cover_gradient: "from-[hsl(250,80%,55%)] to-[hsl(280,70%,50%)]",
  },
  {
    id: "19", title: "Business Studies: Break-Even Analysis Explained", slug: "break-even-analysis",
    excerpt: "Learn how to calculate, draw, and interpret break-even charts — one of the most tested topics in Business Studies exams.",
    category: "subject-guides", author_name: "STEMCoach Team", published_at: "2026-01-28", read_time: "6 min",
    cover_gradient: "from-[hsl(270,60%,50%)] to-[hsl(290,55%,45%)]",
  },
  {
    id: "20", title: "History: How to Evaluate Sources Like a Pro", slug: "history-source-evaluation",
    excerpt: "Master source analysis with the OPCVL framework — Origin, Purpose, Content, Value, and Limitations explained with examples.",
    category: "exam-prep", author_name: "STEMCoach Team", published_at: "2026-01-25", read_time: "7 min",
    cover_gradient: "from-[hsl(340,75%,50%)] to-[hsl(0,84%,55%)]",
  },
];

function ArticleView({ slug }: { slug: string }) {
  const post = seedPosts.find((p) => p.slug === slug);
  const sections = blogArticles[slug];

  if (!post || !sections) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main id="main-content" className="container mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-foreground">Article not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This article may have moved or been renamed.</p>
          <Link to="/blog" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to the blog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main id="main-content" className="container mx-auto max-w-3xl px-4 py-6 pb-28 lg:pb-12">
        <Link to="/blog" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All articles
        </Link>
        <div className={`mb-6 h-32 rounded-2xl bg-gradient-to-br ${post.cover_gradient} sm:h-44`} />
        <article>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium capitalize text-primary">
            {post.category.replace("-", " ")}
          </span>
          <h1 className="mt-3 text-2xl font-bold leading-tight text-foreground sm:text-3xl">{post.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.published_at}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.read_time}</span>
            <span>{post.author_name}</span>
          </div>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{post.excerpt}</p>

          {sections.map((section) => (
            <section key={section.heading} className="mt-8">
              <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
              {section.paragraphs.map((para, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-muted-foreground">{para}</p>
              ))}
              {section.bullets && (
                <ul className="mt-3 space-y-2">
                  {section.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        <div className="mt-10 rounded-2xl border border-primary/10 bg-primary/5 p-6 text-center">
          <h2 className="text-base font-semibold text-foreground">Put this into practice</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try a timed practice set with STEMcoach feedback on every answer.</p>
          <Link to="/subjects" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Start practising <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function Blog() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const activePost = slug ? seedPosts.find((p) => p.slug === slug) : undefined;
  useDocumentTitle(
    activePost ? `${activePost.title} | STEMCoach Blog` : "Blog — Study Tips & Exam Guides | STEMCoach",
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = seedPosts.filter((post) => {
    const matchesCategory = category === "all" || post.category === category;
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featured = seedPosts[0];

  if (slug) return <ArticleView slug={slug} />;

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
