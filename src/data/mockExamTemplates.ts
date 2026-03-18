/**
 * Real exam board mock exam templates
 * Based on actual exam structures from major boards worldwide
 */

export interface MockExamTemplate {
  id: string;
  name: string;
  board: string;
  curriculum: string;
  subject: string;
  paper: string;
  tier?: string;
  questionCount: number;
  durationMinutes: number;
  totalMarks: number;
  description: string;
  icon: string;
  color: string;
}

export const mockExamTemplates: MockExamTemplate[] = [
  // ── UK GCSE ──
  { id: "aqa-gcse-physics-p1", name: "AQA GCSE Physics Paper 1", board: "AQA", curriculum: "uk-gcse", subject: "physics", paper: "Paper 1", tier: "Higher", questionCount: 25, durationMinutes: 105, totalMarks: 100, description: "Energy, Electricity, Particle Model, Atomic Structure", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "aqa-gcse-physics-p2", name: "AQA GCSE Physics Paper 2", board: "AQA", curriculum: "uk-gcse", subject: "physics", paper: "Paper 2", tier: "Higher", questionCount: 25, durationMinutes: 105, totalMarks: 100, description: "Forces, Waves, Magnetism, Space", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "aqa-gcse-chemistry-p1", name: "AQA GCSE Chemistry Paper 1", board: "AQA", curriculum: "uk-gcse", subject: "chemistry", paper: "Paper 1", tier: "Higher", questionCount: 25, durationMinutes: 105, totalMarks: 100, description: "Atomic Structure, Bonding, Quantitative Chemistry, Chemical Changes, Energy Changes", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "aqa-gcse-chemistry-p2", name: "AQA GCSE Chemistry Paper 2", board: "AQA", curriculum: "uk-gcse", subject: "chemistry", paper: "Paper 2", tier: "Higher", questionCount: 25, durationMinutes: 105, totalMarks: 100, description: "Rate, Equilibrium, Organic Chemistry, Chemical Analysis, Atmosphere, Resources", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "aqa-gcse-biology-p1", name: "AQA GCSE Biology Paper 1", board: "AQA", curriculum: "uk-gcse", subject: "biology", paper: "Paper 1", tier: "Higher", questionCount: 25, durationMinutes: 105, totalMarks: 100, description: "Cell Biology, Organisation, Infection, Bioenergetics", icon: "🧬", color: "hsl(38,92%,45%)" },
  { id: "aqa-gcse-biology-p2", name: "AQA GCSE Biology Paper 2", board: "AQA", curriculum: "uk-gcse", subject: "biology", paper: "Paper 2", tier: "Higher", questionCount: 25, durationMinutes: 105, totalMarks: 100, description: "Homeostasis, Inheritance, Variation, Evolution, Ecology", icon: "🧬", color: "hsl(38,92%,45%)" },
  { id: "aqa-gcse-maths-p1", name: "AQA GCSE Maths Paper 1 (Non-Calc)", board: "AQA", curriculum: "uk-gcse", subject: "mathematics", paper: "Paper 1", tier: "Higher", questionCount: 25, durationMinutes: 90, totalMarks: 80, description: "Non-calculator paper covering all topics", icon: "∑", color: "hsl(221,83%,53%)" },
  { id: "aqa-gcse-maths-p2", name: "AQA GCSE Maths Paper 2 (Calculator)", board: "AQA", curriculum: "uk-gcse", subject: "mathematics", paper: "Paper 2", tier: "Higher", questionCount: 25, durationMinutes: 90, totalMarks: 80, description: "Calculator paper covering all topics", icon: "∑", color: "hsl(221,83%,53%)" },
  { id: "edexcel-gcse-physics-p1", name: "Edexcel GCSE Physics Paper 1", board: "Edexcel (Pearson)", curriculum: "uk-gcse", subject: "physics", paper: "Paper 1", tier: "Higher", questionCount: 25, durationMinutes: 105, totalMarks: 100, description: "Key Concepts, Motion, Forces, Conservation, Waves, Light, Radioactivity", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "edexcel-gcse-chemistry-p1", name: "Edexcel GCSE Chemistry Paper 1", board: "Edexcel (Pearson)", curriculum: "uk-gcse", subject: "chemistry", paper: "Paper 1", tier: "Higher", questionCount: 25, durationMinutes: 105, totalMarks: 100, description: "Key Concepts, States of Matter, Chemical Changes, Extracting Metals, Groups", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "ocr-gcse-physics-j249-p1", name: "OCR GCSE Physics J249 Paper 1", board: "OCR", curriculum: "uk-gcse", subject: "physics", paper: "Paper 1", tier: "Higher", questionCount: 25, durationMinutes: 90, totalMarks: 90, description: "Matter, Forces, Electricity, Magnetism, Waves", icon: "⚛", color: "hsl(250,80%,55%)" },

  // ── UK A-Level ──
  { id: "aqa-alevel-physics-p1", name: "AQA A-Level Physics Paper 1", board: "AQA", curriculum: "uk-alevel", subject: "physics", paper: "Paper 1", questionCount: 30, durationMinutes: 120, totalMarks: 85, description: "Measurements, Particles, Waves, Mechanics, Materials, Electricity", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "aqa-alevel-physics-p2", name: "AQA A-Level Physics Paper 2", board: "AQA", curriculum: "uk-alevel", subject: "physics", paper: "Paper 2", questionCount: 30, durationMinutes: 120, totalMarks: 85, description: "Thermal, Fields, Nuclear, Astrophysics (Option)", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "aqa-alevel-physics-p3", name: "AQA A-Level Physics Paper 3", board: "AQA", curriculum: "uk-alevel", subject: "physics", paper: "Paper 3", questionCount: 25, durationMinutes: 120, totalMarks: 80, description: "Practical Skills & Data Analysis + Optional Topic", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "aqa-alevel-chemistry-p1", name: "AQA A-Level Chemistry Paper 1", board: "AQA", curriculum: "uk-alevel", subject: "chemistry", paper: "Paper 1", questionCount: 30, durationMinutes: 120, totalMarks: 105, description: "Physical & Inorganic Chemistry", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "aqa-alevel-chemistry-p2", name: "AQA A-Level Chemistry Paper 2", board: "AQA", curriculum: "uk-alevel", subject: "chemistry", paper: "Paper 2", questionCount: 30, durationMinutes: 120, totalMarks: 105, description: "Physical & Organic Chemistry", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "aqa-alevel-biology-p1", name: "AQA A-Level Biology Paper 1", board: "AQA", curriculum: "uk-alevel", subject: "biology", paper: "Paper 1", questionCount: 30, durationMinutes: 120, totalMarks: 91, description: "Biological Molecules, Cells, Organisms Exchange, Genetics", icon: "🧬", color: "hsl(38,92%,45%)" },
  { id: "aqa-alevel-maths-p1", name: "AQA A-Level Maths Paper 1 (Pure)", board: "AQA", curriculum: "uk-alevel", subject: "mathematics", paper: "Paper 1", questionCount: 30, durationMinutes: 120, totalMarks: 100, description: "Pure Mathematics: Algebra, Calculus, Trigonometry, Vectors", icon: "∑", color: "hsl(221,83%,53%)" },
  { id: "aqa-alevel-maths-p2", name: "AQA A-Level Maths Paper 2 (Pure & Mechanics)", board: "AQA", curriculum: "uk-alevel", subject: "mathematics", paper: "Paper 2", questionCount: 30, durationMinutes: 120, totalMarks: 100, description: "Pure Mathematics & Mechanics", icon: "∑", color: "hsl(221,83%,53%)" },
  { id: "edexcel-alevel-physics-p1", name: "Edexcel A-Level Physics Paper 1", board: "Edexcel (Pearson)", curriculum: "uk-alevel", subject: "physics", paper: "Paper 1", questionCount: 30, durationMinutes: 105, totalMarks: 80, description: "Advanced Mechanics, Electric Fields, Gravitational Fields, Capacitors, Oscillations", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "edexcel-alevel-maths-p1", name: "Edexcel A-Level Maths Paper 1 (Pure 1)", board: "Edexcel (Pearson)", curriculum: "uk-alevel", subject: "mathematics", paper: "Paper 1", questionCount: 30, durationMinutes: 120, totalMarks: 100, description: "Pure Mathematics 1", icon: "∑", color: "hsl(221,83%,53%)" },
  { id: "ocr-alevel-physics-a-p1", name: "OCR A-Level Physics A Paper 1", board: "OCR", curriculum: "uk-alevel", subject: "physics", paper: "Paper 1", questionCount: 30, durationMinutes: 135, totalMarks: 100, description: "Modelling Physics: Motion, Forces, Electrons, Waves, Quantum", icon: "⚛", color: "hsl(250,80%,55%)" },

  // ── Cambridge IGCSE ──
  { id: "caie-igcse-physics-p2", name: "Cambridge IGCSE Physics Paper 2", board: "Cambridge (CAIE)", curriculum: "uk-igcse", subject: "physics", paper: "Paper 2", questionCount: 40, durationMinutes: 75, totalMarks: 40, description: "Multiple Choice — all topics", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "caie-igcse-physics-p4", name: "Cambridge IGCSE Physics Paper 4", board: "Cambridge (CAIE)", curriculum: "uk-igcse", subject: "physics", paper: "Paper 4 (Extended)", questionCount: 30, durationMinutes: 75, totalMarks: 80, description: "Extended Theory — structured and free-response", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "caie-igcse-chemistry-p2", name: "Cambridge IGCSE Chemistry Paper 2", board: "Cambridge (CAIE)", curriculum: "uk-igcse", subject: "chemistry", paper: "Paper 2", questionCount: 40, durationMinutes: 75, totalMarks: 40, description: "Multiple Choice — all topics", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "caie-igcse-biology-p2", name: "Cambridge IGCSE Biology Paper 2", board: "Cambridge (CAIE)", curriculum: "uk-igcse", subject: "biology", paper: "Paper 2", questionCount: 40, durationMinutes: 75, totalMarks: 40, description: "Multiple Choice — all topics", icon: "🧬", color: "hsl(38,92%,45%)" },
  { id: "caie-igcse-maths-p2", name: "Cambridge IGCSE Maths Paper 2 (Extended)", board: "Cambridge (CAIE)", curriculum: "uk-igcse", subject: "mathematics", paper: "Paper 2 (Extended)", questionCount: 25, durationMinutes: 90, totalMarks: 70, description: "Extended — Short-answer structured questions", icon: "∑", color: "hsl(221,83%,53%)" },

  // ── Cambridge IAL ──
  { id: "caie-ial-physics-p1", name: "Cambridge IAL Physics Paper 1", board: "Cambridge (CAIE)", curriculum: "uk-ial", subject: "physics", paper: "Paper 1", questionCount: 40, durationMinutes: 75, totalMarks: 40, description: "Multiple Choice covering AS content", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "edexcel-ial-physics-u1", name: "Edexcel IAL Physics Unit 1", board: "Edexcel International (IAL)", curriculum: "uk-ial", subject: "physics", paper: "Unit 1", questionCount: 30, durationMinutes: 90, totalMarks: 80, description: "Mechanics & Materials", icon: "⚛", color: "hsl(250,80%,55%)" },

  // ── IB Diploma ──
  { id: "ib-sl-physics-p1", name: "IB Physics SL Paper 1", board: "IB SL", curriculum: "ib-dp-sl", subject: "physics", paper: "Paper 1", questionCount: 30, durationMinutes: 45, totalMarks: 30, description: "30 MCQs covering Core topics", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "ib-hl-physics-p1", name: "IB Physics HL Paper 1", board: "IB HL", curriculum: "ib-dp-hl", subject: "physics", paper: "Paper 1", questionCount: 40, durationMinutes: 60, totalMarks: 40, description: "40 MCQs covering Core + AHL topics", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "ib-sl-chemistry-p1", name: "IB Chemistry SL Paper 1", board: "IB SL", curriculum: "ib-dp-sl", subject: "chemistry", paper: "Paper 1", questionCount: 30, durationMinutes: 45, totalMarks: 30, description: "30 MCQs covering Core topics", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "ib-hl-chemistry-p1", name: "IB Chemistry HL Paper 1", board: "IB HL", curriculum: "ib-dp-hl", subject: "chemistry", paper: "Paper 1", questionCount: 40, durationMinutes: 60, totalMarks: 40, description: "40 MCQs covering Core + AHL topics", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "ib-sl-biology-p1", name: "IB Biology SL Paper 1", board: "IB SL", curriculum: "ib-dp-sl", subject: "biology", paper: "Paper 1", questionCount: 30, durationMinutes: 45, totalMarks: 30, description: "30 MCQs covering Core topics", icon: "🧬", color: "hsl(38,92%,45%)" },
  { id: "ib-sl-maths-ai-p1", name: "IB Maths AI SL Paper 1", board: "IB SL", curriculum: "ib-dp-sl", subject: "mathematics", paper: "Paper 1", questionCount: 20, durationMinutes: 90, totalMarks: 80, description: "Short & extended response — Technology required", icon: "∑", color: "hsl(221,83%,53%)" },

  // ── US AP ──
  { id: "ap-physics-1", name: "AP Physics 1", board: "AP Physics 1", curriculum: "us-ap", subject: "physics", paper: "Full Exam", questionCount: 50, durationMinutes: 90, totalMarks: 50, description: "MCQs — Kinematics, Dynamics, Energy, Momentum, Rotation, Waves", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "ap-physics-2", name: "AP Physics 2", board: "AP Physics 2", curriculum: "us-ap", subject: "physics", paper: "Full Exam", questionCount: 50, durationMinutes: 90, totalMarks: 50, description: "MCQs — Fluids, Thermodynamics, Electricity, Magnetism, Optics, Modern", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "ap-chemistry", name: "AP Chemistry", board: "AP Chemistry", curriculum: "us-ap", subject: "chemistry", paper: "Section I", questionCount: 60, durationMinutes: 90, totalMarks: 60, description: "60 MCQs — Atomic Structure, Bonding, Reactions, Kinetics, Equilibrium, Thermo", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "ap-biology", name: "AP Biology", board: "AP Biology", curriculum: "us-ap", subject: "biology", paper: "Section I", questionCount: 60, durationMinutes: 90, totalMarks: 60, description: "60 MCQs — Cell Biology, Genetics, Evolution, Ecology", icon: "🧬", color: "hsl(38,92%,45%)" },
  { id: "ap-calculus-ab", name: "AP Calculus AB", board: "AP Calculus AB", curriculum: "us-ap", subject: "mathematics", paper: "Section I", questionCount: 45, durationMinutes: 105, totalMarks: 54, description: "Part A (no calc) + Part B (graphing calc)", icon: "∑", color: "hsl(221,83%,53%)" },
  { id: "ap-calculus-bc", name: "AP Calculus BC", board: "AP Calculus BC", curriculum: "us-ap", subject: "mathematics", paper: "Section I", questionCount: 45, durationMinutes: 105, totalMarks: 54, description: "Part A (no calc) + Part B (graphing calc) — includes BC topics", icon: "∑", color: "hsl(221,83%,53%)" },
  { id: "ap-cs-a", name: "AP Computer Science A", board: "AP Computer Science A", curriculum: "us-ap", subject: "computer-science", paper: "Section I", questionCount: 40, durationMinutes: 90, totalMarks: 40, description: "40 MCQs — OOP, Data Structures, Algorithms, Recursion", icon: "⟨⟩", color: "hsl(340,75%,50%)" },

  // ── SAT ──
  { id: "sat-math", name: "SAT Math Section", board: "SAT Math", curriculum: "us-sat", subject: "mathematics", paper: "Full Section", questionCount: 44, durationMinutes: 80, totalMarks: 800, description: "Algebra, Problem-Solving, Advanced Math, Geometry/Trig", icon: "∑", color: "hsl(221,83%,53%)" },

  // ── India CBSE ──
  { id: "cbse-12-physics", name: "CBSE Class 12 Physics", board: "CBSE", curriculum: "india-cbse-12", subject: "physics", paper: "Full Paper", questionCount: 33, durationMinutes: 180, totalMarks: 70, description: "Electrostatics, Current, Magnetism, EMI, Optics, Modern Physics, Electronics", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "cbse-12-chemistry", name: "CBSE Class 12 Chemistry", board: "CBSE", curriculum: "india-cbse-12", subject: "chemistry", paper: "Full Paper", questionCount: 33, durationMinutes: 180, totalMarks: 70, description: "Solutions, Electrochemistry, Kinetics, d-block, Coordination, Organic, Polymers", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "cbse-12-maths", name: "CBSE Class 12 Mathematics", board: "CBSE", curriculum: "india-cbse-12", subject: "mathematics", paper: "Full Paper", questionCount: 38, durationMinutes: 180, totalMarks: 80, description: "Relations, Calculus, Vectors, 3D Geometry, Linear Programming, Probability", icon: "∑", color: "hsl(221,83%,53%)" },
  { id: "cbse-10-maths", name: "CBSE Class 10 Mathematics", board: "CBSE", curriculum: "india-cbse-10", subject: "mathematics", paper: "Full Paper", questionCount: 38, durationMinutes: 180, totalMarks: 80, description: "Number Systems, Algebra, Coordinate Geometry, Trigonometry, Statistics", icon: "∑", color: "hsl(221,83%,53%)" },

  // ── India JEE ──
  { id: "jee-main-physics", name: "JEE Main Physics", board: "JEE Main", curriculum: "india-jee", subject: "physics", paper: "Section", questionCount: 30, durationMinutes: 60, totalMarks: 100, description: "MCQs + Numerical — Mechanics, Electrodynamics, Optics, Modern", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "jee-main-chemistry", name: "JEE Main Chemistry", board: "JEE Main", curriculum: "india-jee", subject: "chemistry", paper: "Section", questionCount: 30, durationMinutes: 60, totalMarks: 100, description: "Physical, Organic & Inorganic Chemistry MCQs + Numerical", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "jee-main-maths", name: "JEE Main Mathematics", board: "JEE Main", curriculum: "india-jee", subject: "mathematics", paper: "Section", questionCount: 30, durationMinutes: 60, totalMarks: 100, description: "Algebra, Calculus, Coordinate Geometry, Trigonometry, Vectors, Statistics", icon: "∑", color: "hsl(221,83%,53%)" },

  // ── India NEET ──
  { id: "neet-physics", name: "NEET Physics", board: "NEET UG", curriculum: "india-neet", subject: "physics", paper: "Section A + B", questionCount: 50, durationMinutes: 60, totalMarks: 180, description: "45 MCQs (Section A) + 15 MCQs (Section B, attempt 10)", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "neet-chemistry", name: "NEET Chemistry", board: "NEET UG", curriculum: "india-neet", subject: "chemistry", paper: "Section A + B", questionCount: 50, durationMinutes: 60, totalMarks: 180, description: "Physical, Organic & Inorganic Chemistry MCQs", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "neet-biology", name: "NEET Biology", board: "NEET UG", curriculum: "india-neet", subject: "biology", paper: "Botany + Zoology", questionCount: 100, durationMinutes: 120, totalMarks: 360, description: "Botany & Zoology MCQs — Section A + B", icon: "🧬", color: "hsl(38,92%,45%)" },

  // ── Pakistan ──
  { id: "fbise-fsc-physics-p1", name: "FBISE FSC Physics Paper I", board: "Federal Board (FBISE)", curriculum: "pakistan-fsc", subject: "physics", paper: "Paper I", questionCount: 30, durationMinutes: 150, totalMarks: 68, description: "Measurements, Vectors, Motion, Thermodynamics, Waves, Optics", icon: "⚛", color: "hsl(250,80%,55%)" },
  { id: "punjab-fsc-chemistry", name: "Punjab Board FSC Chemistry", board: "Punjab Board (Lahore)", curriculum: "pakistan-fsc", subject: "chemistry", paper: "Full Paper", questionCount: 30, durationMinutes: 150, totalMarks: 68, description: "Atomic Structure, Chemical Bonding, Thermochemistry, Electrochemistry, Organic", icon: "⚗", color: "hsl(142,71%,40%)" },
  { id: "ecat-engineering", name: "ECAT Engineering Test", board: "ECAT (Engineering)", curriculum: "pakistan-ecat-mdcat", subject: "mathematics", paper: "Full Test", questionCount: 30, durationMinutes: 100, totalMarks: 400, description: "Physics + Chemistry + Mathematics combined MCQs", icon: "∑", color: "hsl(221,83%,53%)" },
  { id: "mdcat-medical", name: "MDCAT Medical Test", board: "MDCAT (Medical)", curriculum: "pakistan-ecat-mdcat", subject: "biology", paper: "Full Test", questionCount: 50, durationMinutes: 150, totalMarks: 200, description: "Biology + Chemistry + Physics + English combined MCQs", icon: "🧬", color: "hsl(38,92%,45%)" },

  // ── IELTS ──
  { id: "ielts-academic-reading", name: "IELTS Academic Reading", board: "British Council", curriculum: "ielts-academic", subject: "ielts", paper: "Reading", questionCount: 40, durationMinutes: 60, totalMarks: 40, description: "3 reading passages with 40 questions total", icon: "🌐", color: "hsl(200,80%,45%)" },
  { id: "ielts-general-reading", name: "IELTS General Training Reading", board: "British Council", curriculum: "ielts-general", subject: "ielts", paper: "Reading", questionCount: 40, durationMinutes: 60, totalMarks: 40, description: "Sections 1-3 with 40 questions total", icon: "🌐", color: "hsl(200,80%,45%)" },
];

// Group templates by curriculum for easy filtering
export function getTemplatesByCurriculum(curriculumId: string): MockExamTemplate[] {
  return mockExamTemplates.filter(t => t.curriculum === curriculumId);
}

export function getTemplatesBySubject(subjectId: string): MockExamTemplate[] {
  return mockExamTemplates.filter(t => t.subject === subjectId);
}

export function getTemplatesByBoard(board: string): MockExamTemplate[] {
  return mockExamTemplates.filter(t => t.board === board);
}

export const examBoardGroups = [
  { label: "UK GCSE", boards: ["AQA", "Edexcel (Pearson)", "OCR"], curriculum: "uk-gcse" },
  { label: "UK A-Level", boards: ["AQA", "Edexcel (Pearson)", "OCR"], curriculum: "uk-alevel" },
  { label: "Cambridge IGCSE", boards: ["Cambridge (CAIE)"], curriculum: "uk-igcse" },
  { label: "International A-Level", boards: ["Cambridge (CAIE)", "Edexcel International (IAL)"], curriculum: "uk-ial" },
  { label: "IB Diploma", boards: ["IB SL", "IB HL"], curriculum: "ib-dp-sl" },
  { label: "US AP", boards: ["AP Physics 1", "AP Physics 2", "AP Chemistry", "AP Biology", "AP Calculus AB", "AP Calculus BC", "AP Computer Science A"], curriculum: "us-ap" },
  { label: "SAT", boards: ["SAT Math"], curriculum: "us-sat" },
  { label: "India CBSE", boards: ["CBSE"], curriculum: "india-cbse-12" },
  { label: "India JEE", boards: ["JEE Main"], curriculum: "india-jee" },
  { label: "India NEET", boards: ["NEET UG"], curriculum: "india-neet" },
  { label: "Pakistan", boards: ["Federal Board (FBISE)", "Punjab Board (Lahore)", "ECAT (Engineering)", "MDCAT (Medical)"], curriculum: "pakistan-fsc" },
  { label: "IELTS", boards: ["British Council"], curriculum: "ielts-academic" },
];
