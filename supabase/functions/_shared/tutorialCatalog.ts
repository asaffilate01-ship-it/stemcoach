export interface TutorialContext {
  id: string;
  subject: string;
  title: string;
}

/**
 * Minimal server-side catalogue used to validate lesson context before it is
 * added to the coach system prompt. Full lesson content remains in the app.
 */
export const TUTORIAL_CONTEXTS = [
  { id: "quadratic-equations", subject: "mathematics", title: "Solving Quadratic Equations" },
  { id: "gradient-and-rate", subject: "mathematics", title: "Gradient as a Rate of Change" },
  { id: "newtons-laws", subject: "physics", title: "Newton's Laws and Free-Body Diagrams" },
  { id: "electrical-circuits", subject: "physics", title: "Series and Parallel Circuits" },
  { id: "moles-stoichiometry", subject: "chemistry", title: "Moles and Stoichiometry" },
  { id: "bonding-properties", subject: "chemistry", title: "Bonding, Structure, and Properties" },
  { id: "cell-division", subject: "biology", title: "Mitosis, Meiosis, and the Cell Cycle" },
  { id: "enzyme-rates", subject: "biology", title: "Enzymes and Rate Experiments" },
  { id: "algorithms-complexity", subject: "computer-science", title: "Algorithms and Big-O Thinking" },
  { id: "boolean-logic", subject: "computer-science", title: "Boolean Logic and Truth Tables" },
  { id: "simultaneous-equations", subject: "mathematics", title: "Simultaneous Equations by Elimination" },
  { id: "probability-trees", subject: "mathematics", title: "Probability Trees and Conditional Events" },
  { id: "momentum-collisions", subject: "physics", title: "Momentum and Collisions" },
  { id: "radioactivity-half-life", subject: "physics", title: "Radioactivity and Half-Life" },
  { id: "rates-of-reaction", subject: "chemistry", title: "Rates of Reaction and Collision Theory" },
  { id: "equilibrium-le-chatelier", subject: "chemistry", title: "Equilibrium and Le Chatelier's Principle" },
  { id: "photosynthesis-limiting-factors", subject: "biology", title: "Photosynthesis and Limiting Factors" },
  { id: "inheritance-punnett", subject: "biology", title: "Inheritance and Punnett Squares" },
  { id: "binary-data", subject: "computer-science", title: "Binary, Hexadecimal, and Data Representation" },
  { id: "network-security", subject: "computer-science", title: "Network Threats and Defences" },
  { id: "price-elasticity", subject: "economics", title: "Price Elasticity of Demand" },
  { id: "analysing-quotations", subject: "english-literature", title: "Analysing a Quotation" },
  { id: "reliability-validity", subject: "psychology", title: "Reliability and Validity" },
  { id: "river-processes", subject: "geography", title: "River Erosion and Transport" },
  { id: "break-even", subject: "business-studies", title: "Break-Even Analysis" },
  { id: "ielts-paragraph-cohesion", subject: "ielts", title: "Building a Cohesive Academic Paragraph" },
  { id: "celta-concept-checking", subject: "celta", title: "Concept-Checking Questions" },
  { id: "french-perfect-tense", subject: "french", title: "Le passé composé avec avoir" },
  { id: "german-accusative", subject: "german", title: "Nominative and Accusative Cases" },
] as const satisfies readonly TutorialContext[];

export function findTutorialContext(id: unknown): TutorialContext | null {
  if (typeof id !== "string") return null;
  return TUTORIAL_CONTEXTS.find((tutorial) => tutorial.id === id) || null;
}
