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
  { id: "arithmetic-sequences", subject: "mathematics", title: "Arithmetic Sequences and the nth Term" },
  { id: "right-triangle-trigonometry", subject: "mathematics", title: "Right-Triangle Trigonometry" },
  { id: "kinetic-potential-energy", subject: "physics", title: "Kinetic and Gravitational Energy Stores" },
  { id: "wave-speed-frequency", subject: "physics", title: "Wave Speed, Frequency and Wavelength" },
  { id: "acid-base-neutralisation", subject: "chemistry", title: "Acids, Alkalis and Neutralisation" },
  { id: "organic-functional-groups", subject: "chemistry", title: "Identifying Organic Functional Groups" },
  { id: "human-circulation", subject: "biology", title: "Blood Circulation and the Heart" },
  { id: "ecology-food-webs", subject: "biology", title: "Food Chains, Food Webs and Energy Transfer" },
  { id: "demand-supply-equilibrium", subject: "economics", title: "Demand, Supply and Market Equilibrium" },
  { id: "opportunity-cost-ppf", subject: "economics", title: "Opportunity Cost and Production Possibilities" },
  { id: "literary-imagery", subject: "english-literature", title: "Imagery, Metaphor and Reader Effect" },
  { id: "narrative-structure", subject: "english-literature", title: "Narrative Perspective, Structure and Suspense" },
  { id: "sampling-bias", subject: "psychology", title: "Sampling, Bias and Research Ethics" },
  { id: "experimental-design", subject: "psychology", title: "Experimental Variables and Study Design" },
  { id: "arrays-lists-searching", subject: "computer-science", title: "Arrays, Lists and Searching Algorithms" },
  { id: "program-testing-debugging", subject: "computer-science", title: "Program Testing, Trace Tables and Debugging" },
  { id: "plate-tectonics", subject: "geography", title: "Plate Boundaries, Earthquakes and Volcanoes" },
  { id: "climate-data-interpretation", subject: "geography", title: "Interpreting Climate Graphs and Data" },
  { id: "business-cash-flow", subject: "business-studies", title: "Cash Flow, Profit and Working Capital" },
  { id: "market-segmentation", subject: "business-studies", title: "Market Segmentation and the Marketing Mix" },
  { id: "ielts-task-one-data", subject: "ielts", title: "Academic Writing Task 1: Describing Data" },
  { id: "ielts-speaking-extended-answer", subject: "ielts", title: "Developing Natural Spoken Answers" },
  { id: "celta-instruction-checking", subject: "celta", title: "Clear Classroom Instructions and ICQs" },
  { id: "celta-feedback-error-correction", subject: "celta", title: "Feedback and Learner Error Correction" },
  { id: "french-near-future", subject: "french", title: "Le futur proche : aller + infinitif" },
  { id: "french-adjective-agreement", subject: "french", title: "French Adjective Agreement" },
  { id: "german-present-tense", subject: "german", title: "German Present-Tense Verb Endings" },
  { id: "german-main-clause-order", subject: "german", title: "German Main-Clause Word Order" },
] as const satisfies readonly TutorialContext[];

export function findTutorialContext(id: unknown): TutorialContext | null {
  if (typeof id !== "string") return null;
  return TUTORIAL_CONTEXTS.find((tutorial) => tutorial.id === id) || null;
}
