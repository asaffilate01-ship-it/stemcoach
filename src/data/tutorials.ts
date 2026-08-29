export interface TutorialCheckpoint {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface Tutorial {
  id: string;
  subject: "mathematics" | "physics" | "chemistry" | "biology" | "computer-science";
  title: string;
  level: "Foundation" | "Intermediate" | "Advanced";
  minutes: number;
  summary: string;
  objectives: string[];
  lesson: string[];
  workedExample: string;
  checkpoint: TutorialCheckpoint;
}

export const tutorials: Tutorial[] = [
  {
    id: "quadratic-equations", subject: "mathematics", title: "Solving Quadratic Equations", level: "Intermediate", minutes: 12,
    summary: "Move between factoring, completing the square, and the quadratic formula.",
    objectives: ["Recognise a quadratic equation", "Choose an efficient method", "Check roots by substitution"],
    lesson: ["Write the equation in the form ax² + bx + c = 0.", "Try factoring when integer factor pairs are visible.", "Otherwise use x = (−b ± √(b² − 4ac)) / 2a. The discriminant tells you how many real roots exist."],
    workedExample: "For x² − 5x + 6 = 0, find two numbers with product 6 and sum −5: −2 and −3. Therefore (x − 2)(x − 3) = 0, so x = 2 or x = 3.",
    checkpoint: { question: "What are the roots of x² + x − 6 = 0?", options: ["2 and −3", "−2 and 3", "1 and −6", "−1 and 6"], answer: "2 and −3", explanation: "(x + 3)(x − 2) = 0, so x = −3 or x = 2." },
  },
  {
    id: "gradient-and-rate", subject: "mathematics", title: "Gradient as a Rate of Change", level: "Foundation", minutes: 9,
    summary: "Interpret straight-line and curve gradients in mathematical and scientific contexts.",
    objectives: ["Calculate rise over run", "Interpret gradient units", "Estimate a tangent gradient"],
    lesson: ["For a straight line, gradient = change in y ÷ change in x.", "The gradient's units are y-units per x-unit.", "For a curve, draw a tangent at the point and calculate the tangent's gradient."],
    workedExample: "A distance–time graph rises from 20 m at 4 s to 50 m at 10 s. Speed = (50 − 20)/(10 − 4) = 5 m/s.",
    checkpoint: { question: "A line passes through (2, 5) and (6, 13). What is its gradient?", options: ["2", "4", "8", "18"], answer: "2", explanation: "(13 − 5)/(6 − 2) = 8/4 = 2." },
  },
  {
    id: "newtons-laws", subject: "physics", title: "Newton's Laws and Free-Body Diagrams", level: "Intermediate", minutes: 14,
    summary: "Connect resultant force, acceleration, and interaction pairs.",
    objectives: ["Draw force arrows", "Find resultant force", "Distinguish balanced forces from action–reaction pairs"],
    lesson: ["Draw only forces acting on the chosen object.", "Newton's second law is F = ma, where F is the resultant force.", "Third-law forces are equal and opposite but act on different objects."],
    workedExample: "A 4 kg trolley has 18 N forward and 6 N resistive force. Resultant force = 12 N, so acceleration = 12/4 = 3 m/s².",
    checkpoint: { question: "A 5 kg object accelerates at 2 m/s². What resultant force acts on it?", options: ["2.5 N", "7 N", "10 N", "25 N"], answer: "10 N", explanation: "F = ma = 5 × 2 = 10 N." },
  },
  {
    id: "electrical-circuits", subject: "physics", title: "Series and Parallel Circuits", level: "Foundation", minutes: 12,
    summary: "Track current, potential difference, and resistance through common circuits.",
    objectives: ["Apply V = IR", "Compare series and parallel rules", "Calculate total resistance"],
    lesson: ["Current is the same everywhere in a series circuit.", "Potential difference is the same across parallel branches.", "Series resistances add; adding a parallel branch reduces total resistance."],
    workedExample: "Two series resistors of 3 Ω and 5 Ω have total resistance 8 Ω. On a 16 V supply, I = V/R = 2 A.",
    checkpoint: { question: "What is the total resistance of 4 Ω and 6 Ω in series?", options: ["2.4 Ω", "10 Ω", "24 Ω", "0.42 Ω"], answer: "10 Ω", explanation: "Series resistances add: 4 + 6 = 10 Ω." },
  },
  {
    id: "moles-stoichiometry", subject: "chemistry", title: "Moles and Stoichiometry", level: "Intermediate", minutes: 15,
    summary: "Use balanced equations to move between mass, moles, and reacting ratios.",
    objectives: ["Calculate amount from mass", "Use equation coefficients as mole ratios", "Identify a limiting reactant"],
    lesson: ["Amount (mol) = mass (g) ÷ molar mass (g mol⁻¹).", "Balance the equation before using its coefficients.", "Convert each reactant to moles, then compare using the equation ratio."],
    workedExample: "2H₂ + O₂ → 2H₂O. Four moles of H₂ require two moles of O₂ and produce four moles of H₂O.",
    checkpoint: { question: "How many moles are in 18 g of water (Mr = 18)?", options: ["0.5 mol", "1 mol", "18 mol", "324 mol"], answer: "1 mol", explanation: "n = m/Mr = 18/18 = 1 mol." },
  },
  {
    id: "bonding-properties", subject: "chemistry", title: "Bonding, Structure, and Properties", level: "Foundation", minutes: 11,
    summary: "Explain macroscopic properties using particles, bonds, and forces.",
    objectives: ["Compare ionic, molecular, and metallic structures", "Explain melting points", "Predict electrical conductivity"],
    lesson: ["Ionic lattices contain oppositely charged ions with strong electrostatic attractions.", "Simple molecular substances have strong covalent bonds within molecules but weaker intermolecular forces.", "Metals conduct because delocalised electrons can move through the lattice."],
    workedExample: "Solid sodium chloride does not conduct because its ions are fixed. Molten sodium chloride conducts because the ions can move and carry charge.",
    checkpoint: { question: "Why does graphite conduct electricity?", options: ["It contains mobile ions", "It has delocalised electrons", "Its molecules evaporate", "Its covalent bonds break"], answer: "It has delocalised electrons", explanation: "One electron per carbon is delocalised and can move along the layers." },
  },
  {
    id: "cell-division", subject: "biology", title: "Mitosis, Meiosis, and the Cell Cycle", level: "Intermediate", minutes: 14,
    summary: "Compare the purposes and products of the two types of nuclear division.",
    objectives: ["Outline the cell cycle", "Compare daughter cells", "Link meiosis to genetic variation"],
    lesson: ["Before division, DNA replicates during interphase.", "Mitosis produces two genetically identical diploid cells for growth and repair.", "Meiosis produces four genetically different haploid gametes and includes two divisions."],
    workedExample: "A human body cell with 46 chromosomes produces two 46-chromosome cells by mitosis; a germ cell produces gametes with 23 chromosomes by meiosis.",
    checkpoint: { question: "Which process produces four genetically varied haploid cells?", options: ["Binary fission", "Mitosis", "Meiosis", "DNA replication"], answer: "Meiosis", explanation: "Meiosis halves chromosome number and generates variation through crossing over and independent assortment." },
  },
  {
    id: "enzyme-rates", subject: "biology", title: "Enzymes and Rate Experiments", level: "Foundation", minutes: 10,
    summary: "Explain enzyme specificity and evaluate rate data.",
    objectives: ["Describe an active site", "Explain temperature and pH effects", "Plan a fair test"],
    lesson: ["An enzyme's active site is complementary to its substrate.", "Increasing temperature raises collision frequency until the optimum; excessive heat changes the active site's shape.", "Change one independent variable and control the rest."],
    workedExample: "To test pH, use buffer solutions at different pH values while keeping temperature, enzyme concentration, substrate concentration, and volume constant.",
    checkpoint: { question: "Why can very high temperature stop an enzyme working?", options: ["The substrate freezes", "The enzyme is used up", "The active site changes shape", "The pH becomes neutral"], answer: "The active site changes shape", explanation: "Heat disrupts bonds maintaining the enzyme's structure, so the substrate no longer fits." },
  },
  {
    id: "algorithms-complexity", subject: "computer-science", title: "Algorithms and Big-O Thinking", level: "Advanced", minutes: 15,
    summary: "Compare algorithm growth rates and recognise common complexity patterns.",
    objectives: ["Interpret O(1), O(n), and O(n²)", "Estimate loop complexity", "Choose a scalable approach"],
    lesson: ["Big-O describes how resource use grows as input size n grows.", "One loop over n items is usually O(n); two nested full loops are usually O(n²).", "Binary search is O(log n), but requires sorted data."],
    workedExample: "A loop that checks every pair of n items performs about n² comparisons, so its time complexity is O(n²).",
    checkpoint: { question: "What is the typical time complexity of binary search on a sorted array?", options: ["O(1)", "O(log n)", "O(n)", "O(n²)"], answer: "O(log n)", explanation: "Each comparison halves the remaining search space." },
  },
  {
    id: "boolean-logic", subject: "computer-science", title: "Boolean Logic and Truth Tables", level: "Foundation", minutes: 9,
    summary: "Evaluate AND, OR, and NOT expressions systematically.",
    objectives: ["Complete truth tables", "Apply operator precedence", "Simplify basic expressions"],
    lesson: ["AND is true only when both inputs are true.", "OR is true when at least one input is true.", "NOT reverses a Boolean value; use brackets to make evaluation order clear."],
    workedExample: "If A is true and B is false, A AND B is false, while A OR B is true and NOT B is true.",
    checkpoint: { question: "If A = false and B = true, what is NOT A AND B?", options: ["true", "false", "undefined", "0 only"], answer: "true", explanation: "NOT A is true, and true AND true is true." },
  },
];
