import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Detect output language from curriculum
function getLanguageForCurriculum(curriculum: string): { lang: string; instruction: string } {
  if (curriculum?.startsWith("fr-") || curriculum === "uni-fr") {
    return { lang: "fr", instruction: "IMPORTANT: Write ALL content in FRENCH (question_text, options, explanation, worked_solution, tuition_tips, exam_tip, mark_scheme, model_answer — everything must be in French)." };
  }
  if (curriculum?.startsWith("de-") || curriculum === "uni-de") {
    return { lang: "de", instruction: "IMPORTANT: Write ALL content in GERMAN (question_text, options, explanation, worked_solution, tuition_tips, exam_tip, mark_scheme, model_answer — everything must be in German)." };
  }
  return { lang: "en", instruction: "" };
}

// Expanded subjects with granular subtopics for 1M+ question coverage
const SUBJECTS = [
  {
    id: "mathematics",
    topics: [
      { name: "Algebra", subtopics: ["Linear Equations", "Quadratic Equations", "Simultaneous Equations", "Inequalities", "Sequences & Series", "Algebraic Fractions", "Completing the Square", "Factor Theorem", "Polynomial Division", "Surds & Indices"] },
      { name: "Calculus", subtopics: ["Differentiation Basics", "Chain Rule", "Product & Quotient Rule", "Integration", "Definite Integrals", "Areas Under Curves", "Differential Equations", "Implicit Differentiation", "Parametric Differentiation", "Integration by Parts"] },
      { name: "Trigonometry", subtopics: ["Sine & Cosine Rules", "Trigonometric Identities", "Trig Equations", "Radians", "Small Angle Approximations", "Inverse Trig Functions", "Double Angle Formulae", "Harmonic Form", "Trig Graphs", "3D Trigonometry"] },
      { name: "Statistics", subtopics: ["Probability", "Conditional Probability", "Binomial Distribution", "Normal Distribution", "Hypothesis Testing", "Correlation & Regression", "Data Representation", "Central Tendency", "Dispersion", "Sampling Methods"] },
      { name: "Geometry", subtopics: ["Circle Theorems", "Coordinate Geometry", "Vectors in 2D", "Transformations", "Congruence & Similarity", "Area & Volume", "Pythagoras", "Loci & Construction", "Angles in Polygons", "3D Shapes & Nets"] },
      { name: "Vectors & Matrices", subtopics: ["Vector Addition", "Scalar Products", "Cross Products", "Matrix Operations", "Determinants", "Inverse Matrices", "Linear Transformations", "Eigenvalues", "Vector Equations of Lines", "Vector Equations of Planes"] },
      { name: "Number Theory", subtopics: ["Prime Numbers", "HCF & LCM", "Standard Form", "Ratio & Proportion", "Percentage Change", "Compound Interest", "Bounds & Error", "Recurring Decimals", "Fractional Indices", "Estimation"] },
      { name: "Further Pure", subtopics: ["Complex Numbers", "Polar Coordinates", "Hyperbolic Functions", "Maclaurin Series", "Proof by Induction", "Roots of Polynomials", "De Moivre's Theorem", "Partial Fractions", "L'Hôpital's Rule", "Improper Integrals"] },
    ],
  },
  {
    id: "physics",
    topics: [
      { name: "Mechanics", subtopics: ["Newton's Laws", "Projectile Motion", "Momentum & Impulse", "Circular Motion", "Work Energy & Power", "Gravitational Fields", "Simple Harmonic Motion", "Torque & Moments", "Friction", "Free Body Diagrams"] },
      { name: "Electricity", subtopics: ["Ohm's Law", "Series & Parallel Circuits", "Kirchhoff's Laws", "EMF & Internal Resistance", "Resistivity", "Potential Dividers", "Capacitors", "RC Circuits", "Electrical Energy", "Semiconductors"] },
      { name: "Waves", subtopics: ["Wave Properties", "Reflection & Refraction", "Diffraction", "Interference & Superposition", "Standing Waves", "Sound Waves", "Electromagnetic Spectrum", "Polarisation", "Doppler Effect", "Wave-Particle Duality"] },
      { name: "Thermodynamics", subtopics: ["Heat Transfer", "Specific Heat Capacity", "Latent Heat", "Gas Laws", "Kinetic Theory", "First Law of Thermodynamics", "Second Law & Entropy", "Internal Energy", "P-V Diagrams", "Boltzmann Distribution"] },
      { name: "Magnetism & EM", subtopics: ["Magnetic Fields", "Electromagnetic Induction", "Faraday's Law", "Lenz's Law", "Transformers", "AC Circuits", "Motor Effect", "Magnetic Flux", "Solenoids", "Hall Effect"] },
      { name: "Nuclear & Particle Physics", subtopics: ["Atomic Structure", "Radioactive Decay", "Half-Life", "Nuclear Fission", "Nuclear Fusion", "Particle Classification", "Quarks & Leptons", "Conservation Laws", "Mass-Energy Equivalence", "Binding Energy"] },
      { name: "Quantum Physics", subtopics: ["Photoelectric Effect", "Energy Levels", "Line Spectra", "de Broglie Wavelength", "Uncertainty Principle", "Quantum Tunnelling", "Wave Functions", "Electron Diffraction", "Photon Model", "Planck's Constant"] },
      { name: "Astrophysics", subtopics: ["Stellar Evolution", "HR Diagrams", "Cosmological Red Shift", "Hubble's Law", "Big Bang Theory", "Black Body Radiation", "Luminosity & Flux", "Parallax", "Standard Candles", "Dark Matter & Energy"] },
    ],
  },
  {
    id: "chemistry",
    topics: [
      { name: "Atomic Structure", subtopics: ["Electron Configuration", "Isotopes", "Mass Spectrometry", "Ionisation Energy", "Atomic Orbitals", "Quantum Numbers", "Aufbau Principle", "Shielding & Penetration", "Atomic Radius Trends", "Electron Affinity"] },
      { name: "Bonding", subtopics: ["Ionic Bonding", "Covalent Bonding", "Metallic Bonding", "Intermolecular Forces", "Hydrogen Bonding", "Bond Polarity", "Shapes of Molecules (VSEPR)", "Dative Covalent Bonds", "Lattice Structures", "Bond Enthalpy"] },
      { name: "Stoichiometry", subtopics: ["Moles & Molar Mass", "Empirical & Molecular Formulae", "Balanced Equations", "Limiting Reagents", "Percentage Yield", "Atom Economy", "Titration Calculations", "Gas Volumes", "Concentration", "Avogadro's Number"] },
      { name: "Organic Chemistry", subtopics: ["Alkanes", "Alkenes", "Alcohols", "Halogenoalkanes", "Aldehydes & Ketones", "Carboxylic Acids", "Esters", "Amines & Amides", "Polymers", "Aromatic Chemistry"] },
      { name: "Thermochemistry", subtopics: ["Enthalpy Changes", "Hess's Law", "Bond Enthalpies", "Calorimetry", "Born-Haber Cycles", "Entropy", "Gibbs Free Energy", "Lattice Enthalpy", "Enthalpy of Solution", "Enthalpy of Combustion"] },
      { name: "Kinetics", subtopics: ["Rate of Reaction", "Collision Theory", "Activation Energy", "Catalysts", "Rate Equations", "Order of Reaction", "Arrhenius Equation", "Rate-Determining Step", "Maxwell-Boltzmann Distribution", "Concentration-Time Graphs"] },
      { name: "Equilibrium", subtopics: ["Le Chatelier's Principle", "Equilibrium Constants Kc", "Equilibrium Constants Kp", "Acid-Base Equilibria", "pH Calculations", "Buffer Solutions", "Solubility Product Ksp", "Partition Coefficient", "Industrial Equilibria", "Common Ion Effect"] },
      { name: "Electrochemistry", subtopics: ["Oxidation & Reduction", "Redox Equations", "Electrochemical Cells", "Standard Electrode Potentials", "Electrolysis", "Faraday's Laws", "Batteries & Fuel Cells", "Corrosion", "Nernst Equation", "Half-Equations"] },
    ],
  },
  {
    id: "biology",
    topics: [
      { name: "Cell Biology", subtopics: ["Cell Structure", "Organelles", "Cell Membrane & Transport", "Mitosis", "Meiosis", "Cell Cycle", "Stem Cells", "Prokaryotic vs Eukaryotic", "Microscopy", "Cell Specialisation"] },
      { name: "Genetics", subtopics: ["DNA Structure", "DNA Replication", "Protein Synthesis", "Gene Expression", "Genetic Crosses", "Punnett Squares", "Sex-Linked Inheritance", "Codominance", "Mutations", "Epigenetics"] },
      { name: "Evolution", subtopics: ["Natural Selection", "Evidence for Evolution", "Speciation", "Genetic Drift", "Adaptive Radiation", "Classification", "Phylogenetics", "Hardy-Weinberg", "Artificial Selection", "Molecular Clocks"] },
      { name: "Human Physiology", subtopics: ["Circulatory System", "Respiratory System", "Digestive System", "Nervous System", "Endocrine System", "Immune System", "Excretory System", "Musculoskeletal System", "Homeostasis", "Hormonal Control"] },
      { name: "Plant Biology", subtopics: ["Photosynthesis", "Respiration", "Transpiration", "Plant Hormones", "Xylem & Phloem", "Leaf Structure", "Root Structure", "Plant Reproduction", "Tropisms", "Limiting Factors"] },
      { name: "Ecology", subtopics: ["Ecosystems", "Food Chains & Webs", "Energy Transfer", "Nutrient Cycles", "Biodiversity", "Population Dynamics", "Conservation", "Succession", "Human Impact", "Sampling Methods"] },
      { name: "Biotechnology", subtopics: ["Genetic Engineering", "PCR", "Gel Electrophoresis", "Gene Therapy", "Cloning", "GM Organisms", "Fermentation", "Monoclonal Antibodies", "CRISPR", "Bioinformatics"] },
      { name: "Microbiology", subtopics: ["Bacteria Structure", "Viruses", "Fungi", "Antibiotics & Resistance", "Aseptic Techniques", "Koch's Postulates", "Bacterial Growth", "Gram Staining", "Pathogens & Disease", "Vaccination"] },
    ],
  },
  {
    id: "computer-science",
    topics: [
      { name: "Programming", subtopics: ["Variables & Data Types", "Control Flow", "Functions & Procedures", "Recursion", "OOP Concepts", "File Handling", "Error Handling", "String Manipulation", "Arrays & Lists", "Pseudocode & Flowcharts"] },
      { name: "Algorithms", subtopics: ["Sorting Algorithms", "Searching Algorithms", "Graph Traversal (BFS/DFS)", "Dijkstra's Algorithm", "Divide & Conquer", "Dynamic Programming", "Greedy Algorithms", "Time Complexity", "Space Complexity", "Hashing"] },
      { name: "Data Structures", subtopics: ["Stacks", "Queues", "Linked Lists", "Binary Trees", "Hash Tables", "Graphs", "Heaps", "Sets & Maps", "Priority Queues", "Trie"] },
      { name: "Databases", subtopics: ["Relational Databases", "SQL Queries", "Normalisation", "Entity-Relationship Diagrams", "Primary & Foreign Keys", "Joins", "Indexing", "ACID Properties", "NoSQL Concepts", "Data Modelling"] },
      { name: "Networking", subtopics: ["TCP/IP Model", "OSI Model", "DNS & DHCP", "HTTP & HTTPS", "Network Topologies", "Packet Switching", "Firewalls", "Encryption", "IP Addressing", "Subnetting"] },
      { name: "Cybersecurity", subtopics: ["Threats & Attacks", "Social Engineering", "Malware Types", "Symmetric & Asymmetric Encryption", "Digital Signatures", "Authentication", "Network Security", "Penetration Testing", "Risk Assessment", "Data Protection Laws"] },
      { name: "Computer Architecture", subtopics: ["Von Neumann Architecture", "CPU Components", "Fetch-Decode-Execute", "Memory Types", "Secondary Storage", "Logic Gates", "Boolean Algebra", "Instruction Sets", "Pipelining", "Parallel Processing"] },
      { name: "Software Engineering", subtopics: ["SDLC Models", "Agile Methodology", "Testing Strategies", "Version Control", "UML Diagrams", "Requirements Analysis", "Design Patterns", "Documentation", "Debugging", "Code Review"] },
    ],
  },
  {
    id: "english-language",
    topics: [
      { name: "Reading Comprehension", subtopics: ["Inference", "Summarising", "Language Analysis", "Structure Analysis", "Writer's Methods", "Comparison", "Evaluating Texts", "Identifying Bias", "Fact vs Opinion", "Text Types"] },
      { name: "Creative Writing", subtopics: ["Narrative Writing", "Descriptive Writing", "Persuasive Writing", "Discursive Writing", "Letter Writing", "Speech Writing", "Article Writing", "Review Writing", "Imagery & Figurative Language", "Tone & Register"] },
      { name: "Grammar & Punctuation", subtopics: ["Sentence Types", "Clauses & Phrases", "Subject-Verb Agreement", "Tenses", "Active & Passive Voice", "Apostrophes", "Colons & Semicolons", "Commas", "Paragraphing", "Spelling Rules"] },
      { name: "Spoken Language", subtopics: ["Presentation Skills", "Debate Techniques", "Audience Awareness", "Formal vs Informal", "Accent & Dialect", "Rhetoric Devices", "Body Language", "Active Listening", "Discussion Skills", "Storytelling"] },
    ],
  },
  {
    id: "english-literature",
    topics: [
      { name: "Poetry Analysis", subtopics: ["Poetic Form", "Rhyme & Metre", "Imagery in Poetry", "Themes in Poetry", "War Poetry", "Love Poetry", "Nature Poetry", "Unseen Poetry", "Comparing Poems", "Poetic Voice"] },
      { name: "Shakespeare", subtopics: ["Macbeth", "Romeo & Juliet", "The Merchant of Venice", "Much Ado About Nothing", "A Midsummer Night's Dream", "Julius Caesar", "The Tempest", "Hamlet", "Othello", "Twelfth Night"] },
      { name: "Prose Analysis", subtopics: ["Character Analysis", "Theme Exploration", "Narrative Voice", "Setting & Atmosphere", "Plot Structure", "Social & Historical Context", "Symbolism", "Writer's Purpose", "Conflict", "Genre Conventions"] },
      { name: "Modern Texts", subtopics: ["An Inspector Calls", "Lord of the Flies", "Animal Farm", "A Christmas Carol", "Of Mice and Men", "The Great Gatsby", "Blood Brothers", "Noughts & Crosses", "Never Let Me Go", "The Curious Incident"] },
    ],
  },
  {
    id: "ielts",
    topics: [
      { name: "Reading", subtopics: ["True/False/Not Given", "Matching Headings", "Summary Completion", "Multiple Choice", "Short Answer Questions", "Sentence Completion", "Diagram Labelling", "Matching Features", "Flow Chart Completion", "Skimming & Scanning"] },
      { name: "Writing", subtopics: ["Task 1 Academic (Graphs)", "Task 1 Academic (Maps)", "Task 1 Academic (Processes)", "Task 1 General (Letters)", "Task 2 Opinion Essays", "Task 2 Discussion Essays", "Task 2 Problem-Solution", "Task 2 Advantage-Disadvantage", "Cohesion & Coherence", "Grammar Range & Accuracy"] },
      { name: "Listening", subtopics: ["Form Completion", "Multiple Choice", "Matching", "Map/Plan Labelling", "Note Completion", "Table Completion", "Sentence Completion", "Diagram Labelling", "Summary Completion", "Short Answer Questions"] },
      { name: "Speaking", subtopics: ["Part 1 Personal Questions", "Part 2 Cue Card", "Part 3 Discussion", "Fluency & Coherence", "Lexical Resource", "Grammatical Range", "Pronunciation", "Idiomatic Language", "Paraphrasing", "Opinion Development"] },
      { name: "Academic Vocabulary", subtopics: ["Academic Word List", "Topic Vocabulary: Education", "Topic Vocabulary: Environment", "Topic Vocabulary: Health", "Topic Vocabulary: Technology", "Topic Vocabulary: Society", "Collocations", "Synonyms & Antonyms", "Formal Register", "Word Formation"] },
    ],
  },
  {
    id: "celta",
    topics: [
      { name: "Language Analysis", subtopics: ["Grammar for Teaching", "Phonology", "Lexis & Vocabulary", "Discourse Analysis", "Functional Language", "Meaning Form Pronunciation", "Concept Checking Questions", "Error Analysis", "Language Grading", "Authentic vs Graded Materials"] },
      { name: "Teaching Methodology", subtopics: ["PPP Framework", "Task-Based Learning", "Test-Teach-Test", "Communicative Approach", "Lexical Approach", "Inductive vs Deductive", "Scaffolding", "Differentiation", "Receptive Skills Teaching", "Productive Skills Teaching"] },
      { name: "Classroom Management", subtopics: ["Interaction Patterns", "Giving Instructions", "Monitoring", "Feedback & Correction", "Classroom Language", "Pacing & Timing", "Student Engagement", "Mixed Ability Classes", "Large Classes", "Behaviour Management"] },
      { name: "Lesson Planning", subtopics: ["Aims & Objectives", "Lesson Staging", "Materials Design", "Anticipating Problems", "Board Work", "Warmers & Lead-ins", "Controlled Practice", "Freer Practice", "Homework Tasks", "Reflection & Evaluation"] },
    ],
  },
  {
    id: "economics",
    topics: [
      { name: "Microeconomics", subtopics: ["Supply & Demand", "Price Elasticity", "Market Structures", "Consumer Theory", "Producer Theory", "Market Failure", "Government Intervention", "Externalities", "Public Goods", "Income Elasticity"] },
      { name: "Macroeconomics", subtopics: ["GDP & National Income", "Inflation", "Unemployment", "Economic Growth", "Fiscal Policy", "Monetary Policy", "Supply-Side Policies", "Balance of Payments", "Exchange Rates", "Aggregate Demand & Supply"] },
      { name: "International Economics", subtopics: ["Trade Theory", "Protectionism", "Trading Blocs", "WTO", "Globalisation", "Foreign Direct Investment", "Terms of Trade", "Current Account", "Capital Flows", "Developing Economies"] },
      { name: "Development Economics", subtopics: ["Measures of Development", "Causes of Poverty", "Aid & Debt", "Structural Adjustment", "Sustainable Development", "Human Development Index", "Gender & Development", "Education & Health", "Microfinance", "Rural vs Urban Development"] },
    ],
  },
  {
    id: "business-studies",
    topics: [
      { name: "Business Organisation", subtopics: ["Sole Traders", "Partnerships", "Limited Companies", "Franchises", "Social Enterprises", "Business Objectives", "Stakeholders", "Business Growth", "Mergers & Acquisitions", "Multinational Corporations"] },
      { name: "Marketing", subtopics: ["Market Research", "Segmentation & Targeting", "Marketing Mix (4Ps)", "Branding", "Digital Marketing", "Pricing Strategies", "Product Life Cycle", "Promotion", "Distribution Channels", "Market Positioning"] },
      { name: "Finance", subtopics: ["Revenue & Costs", "Break-Even Analysis", "Cash Flow", "Profit & Loss", "Balance Sheets", "Financial Ratios", "Sources of Finance", "Budgeting", "Investment Appraisal", "Working Capital"] },
      { name: "Human Resources", subtopics: ["Recruitment & Selection", "Training & Development", "Motivation Theories", "Leadership Styles", "Organisational Structure", "Employment Law", "Workforce Planning", "Performance Management", "Employee Relations", "Diversity & Inclusion"] },
      { name: "Operations", subtopics: ["Production Methods", "Quality Management", "Lean Production", "Supply Chain", "Stock Control", "Capacity Utilisation", "Economies of Scale", "Technology in Operations", "Ethical Operations", "Location Decisions"] },
    ],
  },
  {
    id: "geography",
    topics: [
      { name: "Physical Geography", subtopics: ["Plate Tectonics", "Volcanoes", "Earthquakes", "Rivers & Flooding", "Coastal Landscapes", "Glaciation", "Weather & Climate", "Ecosystems", "Tropical Rainforests", "Hot Deserts"] },
      { name: "Human Geography", subtopics: ["Urbanisation", "Population Change", "Migration", "Economic Development", "Globalisation", "Resource Management", "Water Resources", "Energy Resources", "Food Resources", "Changing Cities"] },
      { name: "Environmental Geography", subtopics: ["Climate Change", "Sustainability", "Deforestation", "Desertification", "Ocean Acidification", "Pollution", "Biodiversity Loss", "Conservation", "Carbon Cycle", "Water Cycle"] },
      { name: "Geographical Skills", subtopics: ["Map Skills", "GIS & Remote Sensing", "Fieldwork Techniques", "Data Presentation", "Statistical Analysis", "Sampling Methods", "Graph Interpretation", "Photo Interpretation", "Cross Sections", "Geographical Investigation"] },
    ],
  },
  {
    id: "history",
    topics: [
      { name: "Modern History", subtopics: ["World War I", "World War II", "Cold War", "Decolonisation", "Civil Rights Movement", "Russian Revolution", "Chinese Revolution", "Vietnam War", "Fall of the Berlin Wall", "9/11 & War on Terror"] },
      { name: "British History", subtopics: ["Tudor Period", "Stuart Period", "Industrial Revolution", "Victorian Era", "British Empire", "Suffragettes", "Welfare State", "Post-War Britain", "Thatcherism", "Norman Conquest"] },
      { name: "Source Analysis", subtopics: ["Primary Sources", "Secondary Sources", "Reliability", "Bias & Perspective", "Provenance", "Utility", "Cross-Referencing", "Causation", "Consequence", "Significance"] },
      { name: "Political History", subtopics: ["Democracy & Dictatorship", "Fascism", "Communism", "Nationalism", "Imperialism", "Human Rights", "International Relations", "United Nations", "European Union", "Political Ideologies"] },
    ],
  },
  {
    id: "psychology",
    topics: [
      { name: "Approaches", subtopics: ["Biological Approach", "Cognitive Approach", "Behaviourist Approach", "Psychodynamic Approach", "Humanistic Approach", "Social Learning Theory", "Biopsychosocial Model", "Evolutionary Psychology", "Comparison of Approaches", "Origins of Psychology"] },
      { name: "Research Methods", subtopics: ["Experimental Methods", "Observation", "Self-Report (Questionnaires)", "Correlations", "Case Studies", "Sampling Methods", "Ethical Issues", "Reliability & Validity", "Data Analysis", "Peer Review"] },
      { name: "Biopsychology", subtopics: ["Nervous System", "Neurons & Synapses", "Brain Structure", "Localisation of Function", "Lateralisation", "Endocrine System", "Fight or Flight", "Circadian Rhythms", "Sleep Stages", "Biological Rhythms"] },
      { name: "Social Psychology", subtopics: ["Conformity", "Obedience", "Social Influence", "Minority Influence", "Social Change", "Milgram's Studies", "Asch's Studies", "Zimbardo's Prison Experiment", "Prejudice & Discrimination", "Group Dynamics"] },
      { name: "Memory & Cognition", subtopics: ["Multi-Store Model", "Working Memory Model", "Long-Term Memory Types", "Forgetting", "Eyewitness Testimony", "Cognitive Interview", "Schemas", "Attention", "Decision Making", "Problem Solving"] },
    ],
  },
  {
    id: "french",
    topics: [
      { name: "Grammaire", subtopics: ["Conjugaison présent", "Conjugaison passé composé", "Conjugaison imparfait", "Subjonctif", "Conditionnel", "Pronoms relatifs", "Pronoms compléments", "Accords du participe passé", "Voix passive", "Discours indirect"] },
      { name: "Compréhension écrite", subtopics: ["Texte argumentatif", "Texte narratif", "Texte informatif", "Article de presse", "Extrait littéraire", "Synthèse de documents", "Questions de compréhension", "Vocabulaire en contexte", "Idées principales", "Inférences"] },
      { name: "Expression écrite", subtopics: ["Dissertation", "Commentaire de texte", "Essai argumentatif", "Lettre formelle", "Résumé", "Compte rendu", "Rédaction créative", "Paragraphe structuré", "Introduction et conclusion", "Connecteurs logiques"] },
      { name: "Littérature française", subtopics: ["Le classicisme", "Les Lumières", "Le romantisme", "Le réalisme", "Le naturalisme", "Le surréalisme", "L'existentialisme", "Poésie moderne", "Théâtre classique", "Roman contemporain"] },
      { name: "Oral", subtopics: ["Exposé", "Débat", "Entretien", "Argumentation orale", "Lecture à voix haute", "Présentation de projet", "Analyse d'image", "Prise de parole", "Écoute active", "Phonétique"] },
    ],
  },
  {
    id: "german",
    topics: [
      { name: "Grammatik", subtopics: ["Konjugation Präsens", "Perfekt", "Präteritum", "Konjunktiv II", "Passiv", "Relativsätze", "Nebensätze", "Adjektivdeklination", "Präpositionen", "Modalverben"] },
      { name: "Leseverstehen", subtopics: ["Sachtext", "Zeitungsartikel", "Literarischer Text", "Diagramme verstehen", "Zusammenfassung", "Textanalyse", "Argumentationsstruktur", "Wortschatz im Kontext", "Hauptaussagen", "Detailverständnis"] },
      { name: "Schriftlicher Ausdruck", subtopics: ["Erörterung", "Textgebundener Aufsatz", "Leserbrief", "Bericht", "Stellungnahme", "Formeller Brief", "Zusammenfassung schreiben", "Kreatives Schreiben", "Einleitung und Schluss", "Argumentation"] },
      { name: "Deutsche Literatur", subtopics: ["Sturm und Drang", "Klassik (Goethe/Schiller)", "Romantik", "Realismus", "Expressionismus", "Nachkriegsliteratur", "Moderne Lyrik", "Drama des 20. Jahrhunderts", "Kurzgeschichten", "Gegenwartsliteratur"] },
      { name: "Mündliche Prüfung", subtopics: ["Präsentation", "Diskussion", "Bildbeschreibung", "Rollenspiel", "Zusammenfassung mündlich", "Stellungnahme mündlich", "Hörverstehen", "Aussprache", "Redewendungen", "Alltagskommunikation"] },
    ],
  },
];

const CURRICULUM_BOARDS: { id: string; boards: string[] }[] = [
  { id: "uk-gcse", boards: ["AQA", "Edexcel", "OCR"] },
  { id: "uk-alevel", boards: ["AQA", "Edexcel", "OCR"] },
  { id: "uk-btec", boards: ["Pearson BTEC"] },
  { id: "uk-scottish-nat5", boards: ["SQA"] },
  { id: "uk-scottish-higher", boards: ["SQA"] },
  { id: "uk-igcse", boards: ["Cambridge", "Edexcel International"] },
  { id: "uk-ial", boards: ["Edexcel IAL", "Cambridge"] },
  { id: "uk-olevel", boards: ["Cambridge"] },
  { id: "ib-myp", boards: ["IB MYP"] },
  { id: "ib-dp-sl", boards: ["IB SL"] },
  { id: "ib-dp-hl", boards: ["IB HL"] },
  { id: "us-middle", boards: ["Common Core", "NGSS"] },
  { id: "us-highschool", boards: ["Common Core", "NGSS"] },
  { id: "us-ap", boards: ["College Board AP"] },
  { id: "us-sat", boards: ["College Board SAT"] },
  { id: "us-act", boards: ["ACT"] },
  { id: "india-cbse-10", boards: ["CBSE"] },
  { id: "india-cbse-12", boards: ["CBSE"] },
  { id: "india-icse-10", boards: ["ICSE"] },
  { id: "india-isc-12", boards: ["ISC"] },
  { id: "india-state", boards: ["Maharashtra", "Karnataka", "Tamil Nadu"] },
  { id: "india-jee", boards: ["JEE Main", "JEE Advanced"] },
  { id: "india-neet", boards: ["NEET UG"] },
  { id: "india-olympiad", boards: ["NSEP", "RMO"] },
  { id: "pakistan-matric", boards: ["Punjab Board", "Federal Board"] },
  { id: "pakistan-fsc", boards: ["Punjab Board", "Federal Board"] },
  { id: "pakistan-olevel", boards: ["Cambridge"] },
  { id: "pakistan-alevel", boards: ["Cambridge", "Edexcel IAL"] },
  { id: "pakistan-ecat-mdcat", boards: ["ECAT", "MDCAT"] },
  { id: "ielts-academic", boards: ["British Council", "IDP"] },
  { id: "ielts-general", boards: ["British Council", "IDP"] },
  { id: "celta", boards: ["Cambridge CELTA"] },
  // France
  { id: "fr-seconde", boards: ["Éducation Nationale"] },
  { id: "fr-premiere", boards: ["Éducation Nationale"] },
  { id: "fr-bac-general", boards: ["Éducation Nationale"] },
  { id: "fr-bac-techno", boards: ["Éducation Nationale"] },
  { id: "fr-bac-pro", boards: ["Éducation Nationale"] },
  { id: "fr-bts", boards: ["Éducation Nationale", "Rectorat"] },
  { id: "fr-cpge", boards: ["Concours CCP", "Concours Mines-Ponts", "Concours X-ENS", "Concours Centrale-Supélec", "BCE", "Ecricome"] },
  { id: "fr-dut-but", boards: ["IUT / Éducation Nationale"] },
  { id: "uni-fr", boards: ["Sorbonne Université", "Université de Paris", "Grande École"] },
  // Germany
  { id: "de-mittlerer", boards: ["Kultusministerkonferenz"] },
  { id: "de-oberstufe", boards: ["Kultusministerkonferenz"] },
  { id: "de-abitur", boards: ["Kultusministerkonferenz", "Bayern Abitur", "NRW Abitur", "Baden-Württemberg Abitur", "Niedersachsen Abitur", "Hessen Abitur", "Sachsen Abitur", "Berlin Abitur", "Hamburg Abitur"] },
  { id: "de-fachabitur", boards: ["Kultusministerkonferenz", "FOS Bayern", "FOS NRW", "FOS Hessen"] },
  { id: "de-berufliches-gym", boards: ["Kultusministerkonferenz", "BG Baden-Württemberg", "BG NRW"] },
  { id: "uni-de", boards: ["TU9 Universitäten", "Universität München (LMU)", "TU München", "Universität Heidelberg", "RWTH Aachen", "Fachhochschule"] },
];

// Question type distribution optimised for variety and accuracy
const QUESTION_TYPES = [
  { type: "mcq", count: 20, weight: "Single correct answer from 4 options" },
  { type: "multi-select", count: 15, weight: "2-3 correct answers from 4-6 options" },
  { type: "essay", count: 8, weight: "Extended written response with mark scheme" },
  { type: "numerical", count: 12, weight: "Calculation with exact numerical answer" },
];

const DIFFICULTIES = [1, 2, 3, 4, 5];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const denied = await requireCronOrAdmin(req, supabase, corsHeaders);
    if (denied) return denied;

    const body = await req.json().catch(() => ({}));
    const action = body.action || "process";

    if (action === "seed") {
      console.log("[BATCH] Seeding generation queue for 1M+ questions...");

      const { count: existingCount } = await supabase
        .from("generation_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      if ((existingCount || 0) > 5000) {
        return new Response(JSON.stringify({ message: "Queue already has pending items", pending: existingCount }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const rows: any[] = [];
      let estimatedTotal = 0;

      for (const subject of SUBJECTS) {
        for (const topic of subject.topics) {
          for (const subtopic of topic.subtopics) {
            for (const curr of CURRICULA) {
              for (const qType of QUESTION_TYPES) {
                for (const diff of DIFFICULTIES) {
                  rows.push({
                    subject: subject.id,
                    topic: topic.name,
                    subtopic,
                    curriculum: curr.id,
                    boards: curr.boards,
                    difficulty: diff,
                    question_type: qType.type,
                    count: qType.count,
                    status: "pending",
                  });
                  estimatedTotal += qType.count;
                }
              }
            }
          }
        }
      }

      // Insert in batches of 500
      let inserted = 0;
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await supabase.from("generation_queue").insert(batch);
        if (error) console.error("[BATCH] Insert error:", error.message);
        else inserted += batch.length;
      }

      return new Response(JSON.stringify({
        message: "Queue seeded for 1M+ questions",
        total_combinations: rows.length,
        inserted,
        estimated_questions: estimatedTotal,
        subjects: SUBJECTS.length,
        curricula: CURRICULA.length,
        question_types: QUESTION_TYPES.length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "status") {
      const [pending, done, failed, total] = await Promise.all([
        supabase.from("generation_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("generation_queue").select("*", { count: "exact", head: true }).eq("status", "done"),
        supabase.from("generation_queue").select("*", { count: "exact", head: true }).eq("status", "failed"),
        supabase.from("questions").select("*", { count: "exact", head: true }),
      ]);

      return new Response(JSON.stringify({
        queue_pending: pending.count || 0,
        queue_done: done.count || 0,
        queue_failed: failed.count || 0,
        total_questions: total.count || 0,
        target: 2000000,
        progress_pct: Math.round(((total.count || 0) / 2000000) * 100 * 10) / 10,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Process: pick next pending items and generate
    const BATCH_SIZE = 3;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { data: pendingItems } = await supabase
      .from("generation_queue").select("*")
      .eq("status", "pending").order("created_at", { ascending: true }).limit(BATCH_SIZE);

    if (!pendingItems || pendingItems.length === 0) {
      return new Response(JSON.stringify({ message: "No pending items in queue" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalInserted = 0;
    const results: any[] = [];

    for (const item of pendingItems) {
      await supabase.from("generation_queue").update({ status: "processing" }).eq("id", item.id);

      try {
        const typeInstructions: Record<string, string> = {
          mcq: `Multiple choice question with EXACTLY 4 options labelled A, B, C, D. Only ONE option is correct. 
The correct_answer field MUST exactly match one of the options.
Provide a thorough explanation of WHY the correct answer is right and why each wrong option is incorrect.`,
          "multi-select": `Multiple choice with 4-6 options where EXACTLY 2-3 are correct. Set allow_multiple_answers to true.
List ALL correct answers in the correct_answers array. Each must exactly match an option.
Explain why each correct answer is right and why the others are wrong.`,
          essay: `Extended written response question (4-8 marks). Include:
- command_word (e.g. "Evaluate", "Discuss", "Analyse", "Explain", "Compare")
- mark_scheme with detailed bullet points for each mark
- model_answer showing a full exemplar response
- max_marks (between 4 and 8)
The correct_answer should be a brief summary. The model_answer should be comprehensive.`,
          numerical: `Numerical calculation question. The answer MUST be a specific number with units.
Show the complete worked_solution with step-by-step calculations.
Include the formula used. Double-check all arithmetic is correct.
The correct_answer must include the numerical value AND the unit (e.g. "24.5 m/s", "3.14 mol").`,
        };

        const accuracyPrompt = `
ACCURACY RULES — VIOLATIONS WILL CAUSE REJECTION:
1. Every correct_answer MUST be factually, scientifically, and mathematically CORRECT.
2. For MCQ: the correct_answer MUST exactly match one of the 4 options.
3. For multi-select: every item in correct_answers MUST exactly match an option.
4. For numerical: show FULL working and VERIFY the arithmetic step-by-step before finalising.
5. For essay: the mark_scheme must align with real exam board marking criteria.
6. Explanations must be detailed, accurate, and educational.
7. worked_solution must show complete step-by-step reasoning.
8. tuition_tips must give genuinely helpful study advice for the specific subtopic.
9. exam_tip must reflect real exam technique advice.
10. NO placeholder or generic content — every field must be specific to the question.`;

        const { instruction: langInstruction } = getLanguageForCurriculum(item.curriculum);

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are a senior ${item.subject} examiner and question writer for ${item.curriculum} exams (${item.boards.join(", ")}).
Create ${item.count} HIGH QUALITY, EXAM-STANDARD questions.
Subject: ${item.subject} | Topic: ${item.topic} | Subtopic: ${item.subtopic}
Difficulty: ${item.difficulty}/5 | Type: ${item.question_type}

${typeInstructions[item.question_type] || typeInstructions.mcq}

${accuracyPrompt}
${langInstruction}`,
              },
              {
                role: "user",
                content: `Generate exactly ${item.count} ${item.question_type} questions for "${item.subtopic}" (under ${item.topic}) at difficulty ${item.difficulty}/5.
Each question must be unique, exam-quality, and have verified correct answers.`,
              },
            ],
            tools: [{
              type: "function",
              function: {
                name: "submit_questions",
                description: "Submit the generated questions with verified correct answers.",
                parameters: {
                  type: "object",
                  properties: {
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question_text: { type: "string" },
                          options: { type: "array", items: { type: "string" } },
                          correct_answer: { type: "string" },
                          correct_answers: { type: "array", items: { type: "string" } },
                          allow_multiple_answers: { type: "boolean" },
                          explanation: { type: "string" },
                          worked_solution: { type: "string" },
                          tuition_tips: { type: "array", items: { type: "string" } },
                          exam_tip: { type: "string" },
                          formula: { type: "string" },
                          points: { type: "number" },
                          mark_scheme: { type: "string" },
                          model_answer: { type: "string" },
                          max_marks: { type: "number" },
                          command_word: { type: "string" },
                        },
                        required: ["question_text", "correct_answer", "explanation", "worked_solution", "tuition_tips", "exam_tip", "points"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["questions"],
                  additionalProperties: false,
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "submit_questions" } },
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error(`[BATCH] AI error for ${item.subject}/${item.topic}/${item.subtopic}: ${aiResponse.status} ${errText}`);
          if (aiResponse.status === 429) {
            await supabase.from("generation_queue").update({ status: "pending" }).eq("id", item.id);
            results.push({ id: item.id, status: "rate_limited" });
            break;
          }
          await supabase.from("generation_queue").update({ status: "failed" }).eq("id", item.id);
          results.push({ id: item.id, status: "ai_error", error: aiResponse.status });
          continue;
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        const generated = toolCall ? JSON.parse(toolCall.function.arguments) : { questions: [] };

        if (!generated.questions || generated.questions.length === 0) {
          await supabase.from("generation_queue").update({ status: "failed" }).eq("id", item.id);
          results.push({ id: item.id, status: "no_questions" });
          continue;
        }

        // Validate: for MCQ, correct_answer must match one of the options
        const validatedQuestions = generated.questions.filter((q: any) => {
          if (!q.question_text || !q.correct_answer) return false;
          if (item.question_type === "mcq" && q.options) {
            const opts = Array.isArray(q.options) ? q.options : [];
            if (opts.length < 4) return false;
            if (!opts.includes(q.correct_answer)) {
              // Try to fix: check if answer text is a partial match
              const match = opts.find((o: string) => o.includes(q.correct_answer) || q.correct_answer.includes(o));
              if (match) q.correct_answer = match;
              else return false;
            }
          }
          if (item.question_type === "multi-select" && q.correct_answers) {
            const opts = Array.isArray(q.options) ? q.options : [];
            if (!q.correct_answers.every((a: string) => opts.includes(a))) return false;
          }
          return true;
        });

        const rows = validatedQuestions.map((q: any) => ({
          subject: item.subject, topic: item.topic, subtopic: item.subtopic,
          curriculum: item.curriculum, boards: item.boards,
          difficulty: item.difficulty, question_type: item.question_type,
          question_text: q.question_text,
          options: q.options ? JSON.stringify(q.options) : null,
          correct_answer: q.correct_answer || "",
          correct_answers: q.correct_answers || [],
          allow_multiple_answers: q.allow_multiple_answers || (item.question_type === "multi-select"),
          explanation: q.explanation || "",
          worked_solution: q.worked_solution || "",
          tuition_tips: q.tuition_tips || [],
          exam_tip: q.exam_tip || "",
          formula: q.formula || null,
          points: q.points || 1,
          mark_scheme: q.mark_scheme || null,
          model_answer: q.model_answer || null,
          max_marks: q.max_marks || q.points || 1,
          command_word: q.command_word || null,
        }));

        if (rows.length === 0) {
          await supabase.from("generation_queue").update({ status: "failed" }).eq("id", item.id);
          results.push({ id: item.id, status: "validation_failed" });
          continue;
        }

        const { data: inserted, error: insertError } = await supabase.from("questions").insert(rows).select("id");
        if (insertError) {
          console.error(`[BATCH] DB insert error: ${insertError.message}`);
          await supabase.from("generation_queue").update({ status: "failed" }).eq("id", item.id);
          results.push({ id: item.id, status: "db_error", error: insertError.message });
          continue;
        }

        const count = inserted?.length || 0;
        totalInserted += count;
        await supabase.from("generation_queue").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", item.id);
        results.push({ id: item.id, status: "done", inserted: count, subject: item.subject, topic: item.topic, subtopic: item.subtopic });

        // Delay between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        console.error(`[BATCH] Error processing ${item.id}:`, e);
        await supabase.from("generation_queue").update({ status: "failed" }).eq("id", item.id);
        results.push({ id: item.id, status: "error", error: (e as Error).message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, inserted: totalInserted, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[BATCH] Fatal error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
