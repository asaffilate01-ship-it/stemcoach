export type QuestionType = "mcq" | "numerical" | "multi-step" | "essay";
export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type Subject = "mathematics" | "physics" | "chemistry" | "biology" | "computer-science";

export interface Question {
  id: string;
  subject: Subject;
  topic: string;
  subtopic: string;
  curriculum: string;
  board: string;
  difficulty: Difficulty;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  workedSolution: string;
  tuitionTips: string[];
  examTip: string;
  formula?: string;
  points: number;
}

export interface SubjectInfo {
  id: Subject;
  name: string;
  icon: string;
  color: string;
  questionCount: number;
  topics: string[];
}

export const subjects: SubjectInfo[] = [
  {
    id: "mathematics",
    name: "Mathematics",
    icon: "∑",
    color: "221 83% 53%",
    questionCount: 7000,
    topics: ["Algebra", "Calculus", "Trigonometry", "Statistics", "Geometry", "Vectors", "Matrices", "Differential Equations"],
  },
  {
    id: "physics",
    name: "Physics",
    icon: "⚛",
    color: "250 80% 60%",
    questionCount: 6000,
    topics: ["Mechanics", "Electricity", "Waves", "Thermodynamics", "Magnetism", "Nuclear Physics", "Quantum Physics", "Optics"],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    icon: "⚗",
    color: "142 71% 45%",
    questionCount: 6000,
    topics: ["Atomic Structure", "Bonding", "Stoichiometry", "Organic Chemistry", "Thermochemistry", "Kinetics", "Equilibrium", "Electrochemistry"],
  },
  {
    id: "biology",
    name: "Biology",
    icon: "🧬",
    color: "38 92% 50%",
    questionCount: 5500,
    topics: ["Cell Biology", "Genetics", "Evolution", "Human Physiology", "Plant Biology", "Ecology", "Biotechnology", "Microbiology"],
  },
  {
    id: "computer-science",
    name: "Computer Science",
    icon: "⟨⟩",
    color: "0 84% 60%",
    questionCount: 4000,
    topics: ["Programming", "Algorithms", "Data Structures", "Databases", "Networking", "Cybersecurity", "Operating Systems", "AI"],
  },
];

export const curricula = [
  { id: "uk-gcse", label: "UK GCSE", country: "🇬🇧", boards: ["AQA", "Edexcel", "OCR"] },
  { id: "uk-igcse", label: "IGCSE", country: "🌍", boards: ["Cambridge", "Edexcel International"] },
  { id: "uk-alevel", label: "A-Level", country: "🇬🇧", boards: ["AQA", "Edexcel", "OCR", "Cambridge"] },
  { id: "ib", label: "IB Diploma", country: "🌍", boards: ["IB SL", "IB HL"] },
  { id: "us-highschool", label: "US Grade 9–11", country: "🇺🇸", boards: ["Common Core", "AP"] },
  { id: "india-cbse", label: "India CBSE", country: "🇮🇳", boards: ["CBSE", "ISC"] },
  { id: "pakistan-fsc", label: "Pakistan FSC", country: "🇵🇰", boards: ["Punjab Board", "Federal Board", "Sindh Board"] },
];

export const difficultyLabels: Record<Difficulty, string> = {
  1: "Foundation",
  2: "GCSE",
  3: "Advanced GCSE",
  4: "A-Level",
  5: "Olympiad",
};

export const sampleQuestions: Question[] = [
  {
    id: "phys-001",
    subject: "physics",
    topic: "Mechanics",
    subtopic: "SUVAT Equations",
    curriculum: "uk-alevel",
    board: "AQA",
    difficulty: 4,
    type: "mcq",
    text: "A projectile is launched at 20 m/s at an angle of 30° to the horizontal. What is the maximum height reached?",
    options: ["3.2 m", "5.1 m", "10.2 m", "15.3 m"],
    correctAnswer: "5.1 m",
    explanation: "At maximum height, vertical velocity = 0. Using v² = u² − 2gs with u = 20sin30° = 10 m/s: 0 = 100 − 2(9.8)s → s = 5.1 m",
    workedSolution: "Step 1: Find vertical component: u_y = 20 × sin(30°) = 10 m/s\nStep 2: At max height, v_y = 0\nStep 3: Use v² = u² − 2gs\nStep 4: 0 = 10² − 2(9.8)(s)\nStep 5: s = 100 / 19.6 = 5.1 m",
    tuitionTips: [
      "Always resolve velocity into horizontal and vertical components first",
      "At maximum height, vertical velocity is zero — this is your key condition",
      "Use SUVAT equation v² = u² + 2as when you don't need time",
      "Check: if the angle were 90°, max height would be u²/2g = 20.4 m"
    ],
    examTip: "Draw a diagram showing the trajectory and label the components. Examiners award marks for clear working.",
    formula: "v² = u² + 2as",
    points: 4,
  },
  {
    id: "math-001",
    subject: "mathematics",
    topic: "Calculus",
    subtopic: "Differentiation",
    curriculum: "uk-alevel",
    board: "Edexcel",
    difficulty: 3,
    type: "mcq",
    text: "Find the derivative of f(x) = 3x² + 2x − 5",
    options: ["6x + 2", "3x + 2", "6x² + 2", "6x − 5"],
    correctAnswer: "6x + 2",
    explanation: "Apply the power rule: d/dx(axⁿ) = naxⁿ⁻¹. So d/dx(3x²) = 6x, d/dx(2x) = 2, d/dx(−5) = 0.",
    workedSolution: "Step 1: Differentiate each term separately\nStep 2: d/dx(3x²) = 2 × 3x¹ = 6x\nStep 3: d/dx(2x) = 2\nStep 4: d/dx(−5) = 0\nStep 5: f'(x) = 6x + 2",
    tuitionTips: [
      "The power rule: bring the power down, reduce it by 1",
      "Constants differentiate to zero",
      "Differentiate each term independently — don't try to do it all at once",
      "Watch for negative and fractional powers — same rule applies"
    ],
    examTip: "Always simplify your answer. Write f'(x) = not just the derivative.",
    formula: "d/dx(xⁿ) = nxⁿ⁻¹",
    points: 3,
  },
  {
    id: "chem-001",
    subject: "chemistry",
    topic: "Stoichiometry",
    subtopic: "Molar Mass",
    curriculum: "uk-gcse",
    board: "AQA",
    difficulty: 2,
    type: "mcq",
    text: "What is the molar mass of CO₂?",
    options: ["28 g/mol", "32 g/mol", "44 g/mol", "48 g/mol"],
    correctAnswer: "44 g/mol",
    explanation: "CO₂ = 1 carbon (12) + 2 oxygen (16 each) = 12 + 32 = 44 g/mol",
    workedSolution: "Step 1: Identify atoms: 1× C, 2× O\nStep 2: Carbon = 12 g/mol\nStep 3: Oxygen = 16 g/mol each\nStep 4: Total = 12 + (2 × 16) = 44 g/mol",
    tuitionTips: [
      "Always use the periodic table for atomic masses — don't guess",
      "Count each atom carefully, especially with subscripts",
      "Common mistake: forgetting there are TWO oxygen atoms",
      "Molar mass has units g/mol — always include units"
    ],
    examTip: "Show your working clearly: list each element, its atomic mass, and multiply by count.",
    formula: "M = Σ(atomic mass × count)",
    points: 2,
  },
  {
    id: "bio-001",
    subject: "biology",
    topic: "Cell Biology",
    subtopic: "Organelles",
    curriculum: "uk-gcse",
    board: "Edexcel",
    difficulty: 2,
    type: "mcq",
    text: "Which organelle is responsible for producing ATP through aerobic respiration?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
    correctAnswer: "Mitochondria",
    explanation: "Mitochondria are the 'powerhouses' of the cell, where aerobic respiration occurs to produce ATP (adenosine triphosphate).",
    workedSolution: "The question asks about ATP production via aerobic respiration.\n\nNucleus → stores DNA, controls cell activity\nRibosome → protein synthesis\nMitochondria → aerobic respiration → ATP ✓\nGolgi apparatus → packages and distributes proteins",
    tuitionTips: [
      "Remember: Mitochondria = energy factory",
      "Both plant and animal cells have mitochondria",
      "Don't confuse with chloroplasts (photosynthesis, only in plants)",
      "ATP = adenosine triphosphate = the cell's energy currency"
    ],
    examTip: "If asked to 'explain', don't just name the organelle — describe what happens inside it.",
    points: 1,
  },
  {
    id: "cs-001",
    subject: "computer-science",
    topic: "Algorithms",
    subtopic: "Time Complexity",
    curriculum: "uk-alevel",
    board: "OCR",
    difficulty: 4,
    type: "mcq",
    text: "What is the time complexity of binary search?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
    correctAnswer: "O(log n)",
    explanation: "Binary search halves the search space with each comparison, so it takes at most log₂(n) comparisons for n elements.",
    workedSolution: "Binary search works on sorted data:\n1. Compare middle element\n2. If match → found\n3. If target < middle → search left half\n4. If target > middle → search right half\n\nEach step halves n → after k steps: n/2ᵏ = 1 → k = log₂(n)\nTherefore O(log n)",
    tuitionTips: [
      "Binary search REQUIRES sorted data — this is a common exam trap",
      "Think of it like a phone book: you don't check every page",
      "Compare: linear search O(n) vs binary search O(log n)",
      "For 1,000,000 items: linear = 1M steps, binary = ~20 steps"
    ],
    examTip: "Always state the precondition: 'Binary search requires the data to be sorted.'",
    formula: "T(n) = O(log₂ n)",
    points: 3,
  },
  {
    id: "phys-002",
    subject: "physics",
    topic: "Electricity",
    subtopic: "Ohm's Law",
    curriculum: "uk-gcse",
    board: "AQA",
    difficulty: 2,
    type: "mcq",
    text: "A resistor has a resistance of 10 Ω. If the current flowing through it is 2 A, what is the voltage across it?",
    options: ["5 V", "10 V", "20 V", "40 V"],
    correctAnswer: "20 V",
    explanation: "Using Ohm's Law: V = IR = 2 × 10 = 20 V",
    workedSolution: "Step 1: Identify known values: I = 2 A, R = 10 Ω\nStep 2: Apply Ohm's Law: V = IR\nStep 3: V = 2 × 10 = 20 V",
    tuitionTips: [
      "Ohm's Law: V = IR (Voltage = Current × Resistance)",
      "Remember the triangle: V on top, I and R on the bottom",
      "Units: V in volts, I in amps, R in ohms",
      "This only applies to ohmic conductors at constant temperature"
    ],
    examTip: "Always state the formula before substituting values.",
    formula: "V = IR",
    points: 2,
  },
  {
    id: "math-002",
    subject: "mathematics",
    topic: "Algebra",
    subtopic: "Quadratic Equations",
    curriculum: "uk-gcse",
    board: "Edexcel",
    difficulty: 2,
    type: "mcq",
    text: "Solve x² − 5x + 6 = 0",
    options: ["x = 1 or x = 6", "x = 2 or x = 3", "x = −2 or x = −3", "x = 5 or x = 1"],
    correctAnswer: "x = 2 or x = 3",
    explanation: "Factorising: (x − 2)(x − 3) = 0, so x = 2 or x = 3",
    workedSolution: "Step 1: Find two numbers that multiply to give 6 and add to give −5\nStep 2: −2 × −3 = 6 ✓ and −2 + −3 = −5 ✓\nStep 3: Factorise: (x − 2)(x − 3) = 0\nStep 4: x − 2 = 0 → x = 2\nStep 5: x − 3 = 0 → x = 3",
    tuitionTips: [
      "For x² + bx + c = 0, find two numbers that multiply to c and add to b",
      "If factorising is hard, use the quadratic formula as backup",
      "Always check by substituting your answers back in",
      "The discriminant b²−4ac tells you how many solutions exist"
    ],
    examTip: "Show the factorised form before writing the solutions. Examiners look for method.",
    formula: "x = (−b ± √(b²−4ac)) / 2a",
    points: 3,
  },
  {
    id: "chem-002",
    subject: "chemistry",
    topic: "Atomic Structure",
    subtopic: "Electron Configuration",
    curriculum: "uk-alevel",
    board: "OCR",
    difficulty: 3,
    type: "mcq",
    text: "What is the electron configuration of Iron (Fe, Z=26)?",
    options: ["1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶", "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁸", "1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁴", "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶ 4s²"],
    correctAnswer: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶ 4s²",
    explanation: "Iron has 26 electrons. The 4s orbital fills before 3d. Configuration: [Ar] 3d⁶ 4s².",
    workedSolution: "Step 1: Fe has atomic number 26 → 26 electrons\nStep 2: Fill orbitals in order: 1s² 2s² 2p⁶ 3s² 3p⁶ → 18 electrons (Argon core)\nStep 3: 4s fills before 3d\nStep 4: 4s² → 20 electrons\nStep 5: 3d⁶ → 26 electrons total\nStep 6: Written as: 1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁶ 4s²",
    tuitionTips: [
      "4s fills before 3d, but 4s empties before 3d when forming ions",
      "Use the Aufbau principle and the diagonal rule",
      "Shorthand: [Ar] 3d⁶ 4s² — learn noble gas core notation",
      "Exceptions exist: Cr and Cu have special configurations"
    ],
    examTip: "Write both full and shorthand notation. Check total electrons match atomic number.",
    points: 3,
  },
];
