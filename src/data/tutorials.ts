export interface TutorialCheckpoint {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface Tutorial {
  id: string;
  subject:
    | "mathematics" | "physics" | "chemistry" | "biology" | "computer-science"
    | "economics" | "english-literature" | "psychology" | "geography"
    | "business-studies" | "ielts" | "celta" | "french" | "german";
  title: string;
  level: "Foundation" | "Intermediate" | "Advanced";
  minutes: number;
  summary: string;
  objectives: string[];
  lesson: string[];
  workedExample: string;
  checkpoint: TutorialCheckpoint;
  practice?: TutorialCheckpoint[];
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
  {
    id: "simultaneous-equations", subject: "mathematics", title: "Simultaneous Equations by Elimination", level: "Intermediate", minutes: 13,
    summary: "Eliminate one variable, solve the remaining equation, and check the pair.",
    objectives: ["Align coefficients", "Eliminate one variable", "Check both original equations"],
    lesson: ["Write both equations with like terms aligned.", "Multiply an equation when necessary so one pair of coefficients is equal or opposite.", "Add or subtract the equations, solve for one variable, then substitute back."],
    workedExample: "For x + y = 7 and x − y = 1, add the equations to get 2x = 8, so x = 4. Then y = 3. Both equations are satisfied.",
    checkpoint: { question: "Solve x + y = 9 and x − y = 3.", options: ["x = 6, y = 3", "x = 3, y = 6", "x = 9, y = 3", "x = 12, y = 6"], answer: "x = 6, y = 3", explanation: "Adding gives 2x = 12, so x = 6; substitution gives y = 3." },
    practice: [{ question: "If 2x + y = 11 and y = 3, what is x?", options: ["2", "4", "7", "8"], answer: "4", explanation: "2x + 3 = 11, so 2x = 8 and x = 4." }],
  },
  {
    id: "probability-trees", subject: "mathematics", title: "Probability Trees and Conditional Events", level: "Advanced", minutes: 16,
    summary: "Multiply along branches, add alternative routes, and update probabilities without replacement.",
    objectives: ["Complete branch probabilities", "Multiply along a route", "Add mutually exclusive routes"],
    lesson: ["Probabilities leaving a node sum to 1.", "Multiply probabilities along a complete path.", "Add probabilities for distinct paths that produce the required event."],
    workedExample: "Two fair coin tosses have P(two heads) = 1/2 × 1/2 = 1/4. Exactly one head has two routes, HT and TH, so its probability is 1/4 + 1/4 = 1/2.",
    checkpoint: { question: "A fair coin is tossed twice. What is P(at least one head)?", options: ["1/4", "1/2", "3/4", "1"], answer: "3/4", explanation: "Use the complement: 1 − P(TT) = 1 − 1/4 = 3/4." },
    practice: [{ question: "Probabilities on two branches from the same node are 0.35 and p. Find p.", options: ["0.35", "0.55", "0.65", "1.35"], answer: "0.65", explanation: "Branch probabilities sum to 1, so p = 1 − 0.35 = 0.65." }],
  },
  {
    id: "momentum-collisions", subject: "physics", title: "Momentum and Collisions", level: "Advanced", minutes: 16,
    summary: "Apply conservation of momentum with a consistent direction convention.",
    objectives: ["Calculate momentum", "Choose signs for direction", "Solve before-and-after equations"],
    lesson: ["Momentum p = mv is a vector, so direction matters.", "Total momentum is conserved in a closed system.", "Kinetic energy is conserved only in elastic collisions."],
    workedExample: "A 2 kg trolley at 4 m/s sticks to a stationary 6 kg trolley. Before, p = 8 kg m/s. After, 8v = 8, so v = 1 m/s.",
    checkpoint: { question: "A 3 kg object moves at 5 m/s. What is its momentum?", options: ["0.6 kg m/s", "8 kg m/s", "15 kg m/s", "75 kg m/s"], answer: "15 kg m/s", explanation: "p = mv = 3 × 5 = 15 kg m/s." },
    practice: [{ question: "Two objects stick together in a collision. What kind of collision is this?", options: ["Perfectly inelastic", "Always elastic", "Nuclear", "Static"], answer: "Perfectly inelastic", explanation: "Sticking together is the defining idealisation of a perfectly inelastic collision." }],
  },
  {
    id: "radioactivity-half-life", subject: "physics", title: "Radioactivity and Half-Life", level: "Intermediate", minutes: 13,
    summary: "Read decay data, calculate repeated halving, and distinguish activity from half-life.",
    objectives: ["Apply repeated halving", "Interpret decay graphs", "Use corrected count rates"],
    lesson: ["Half-life is the mean time for the number of undecayed nuclei or activity to halve.", "Subtract background count before using measured count rate.", "Radioactive decay is random for one nucleus but predictable for a large sample."],
    workedExample: "A corrected count rate falls from 800 counts/min to 100 counts/min. That is three halvings: 800 → 400 → 200 → 100.",
    checkpoint: { question: "A sample has a half-life of 6 hours. What fraction remains after 18 hours?", options: ["1/2", "1/3", "1/6", "1/8"], answer: "1/8", explanation: "18 hours is three half-lives, so the fraction is (1/2)³ = 1/8." },
    practice: [{ question: "Why is background count subtracted?", options: ["To isolate the source's count rate", "To increase activity", "To change half-life", "To stop decay"], answer: "To isolate the source's count rate", explanation: "The detector also records radiation from the surroundings." }],
  },
  {
    id: "rates-of-reaction", subject: "chemistry", title: "Rates of Reaction and Collision Theory", level: "Intermediate", minutes: 14,
    summary: "Explain rate changes using collision frequency, energy, and activation energy.",
    objectives: ["Describe successful collisions", "Explain temperature effects", "Interpret rate graphs"],
    lesson: ["Particles must collide with enough energy and suitable orientation to react.", "Higher temperature increases collision frequency and the fraction above activation energy.", "A catalyst provides an alternative pathway with lower activation energy."],
    workedExample: "Raising temperature makes particles move faster. More collisions occur per second and a larger fraction of collisions can overcome the activation energy.",
    checkpoint: { question: "What does a catalyst lower?", options: ["Activation energy", "Product energy", "Equilibrium yield", "Reactant concentration"], answer: "Activation energy", explanation: "A catalyst provides an alternative reaction pathway with lower activation energy." },
    practice: [{ question: "On a product-volume graph, what shows the initial rate?", options: ["Initial gradient", "Final volume only", "x-intercept", "Area under the line"], answer: "Initial gradient", explanation: "Rate is change in product divided by change in time, represented by the graph's gradient." }],
  },
  {
    id: "equilibrium-le-chatelier", subject: "chemistry", title: "Equilibrium and Le Chatelier's Principle", level: "Advanced", minutes: 16,
    summary: "Predict how concentration, pressure, and temperature affect dynamic equilibrium.",
    objectives: ["Describe dynamic equilibrium", "Predict concentration effects", "Separate catalyst and yield effects"],
    lesson: ["At dynamic equilibrium, forward and reverse reaction rates are equal.", "The system responds to oppose a change in conditions.", "A catalyst speeds both directions and does not change equilibrium position."],
    workedExample: "For N₂ + 3H₂ ⇌ 2NH₃, increasing pressure favours the right side because it has fewer moles of gas.",
    checkpoint: { question: "What happens to equilibrium composition when only a catalyst is added?", options: ["It is unchanged", "More products form", "More reactants form", "The reverse reaction stops"], answer: "It is unchanged", explanation: "Both forward and reverse rates increase, so the same equilibrium is reached faster." },
    practice: [{ question: "At dynamic equilibrium, which rates are equal?", options: ["Forward and reverse reaction rates", "Heating and cooling rates", "Diffusion and osmosis rates", "Mass and volume rates"], answer: "Forward and reverse reaction rates", explanation: "Equal opposing rates keep macroscopic concentrations constant." }],
  },
  {
    id: "photosynthesis-limiting-factors", subject: "biology", title: "Photosynthesis and Limiting Factors", level: "Intermediate", minutes: 14,
    summary: "Link the photosynthesis equation to rate data and limiting-factor graphs.",
    objectives: ["Recall reactants and products", "Identify a limiting factor", "Interpret a plateau"],
    lesson: ["Photosynthesis uses carbon dioxide and water to make glucose and oxygen using light energy.", "Light intensity, carbon dioxide concentration and temperature can limit the rate.", "A plateau means another factor has become limiting."],
    workedExample: "If increasing light no longer raises the rate, light is not limiting in that region; carbon dioxide or temperature may now limit the process.",
    checkpoint: { question: "Why can a light-intensity graph reach a plateau?", options: ["Another factor becomes limiting", "Photosynthesis stops permanently", "Light has no energy", "Oxygen becomes a reactant"], answer: "Another factor becomes limiting", explanation: "Once light is sufficient, carbon dioxide concentration or temperature may control the rate." },
    practice: [{ question: "Which gas is a reactant in photosynthesis?", options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], answer: "Carbon dioxide", explanation: "Plants use carbon dioxide and water to produce glucose and oxygen." }],
  },
  {
    id: "inheritance-punnett", subject: "biology", title: "Inheritance and Punnett Squares", level: "Intermediate", minutes: 15,
    summary: "Move between alleles, genotypes, phenotypes, and genetic probabilities.",
    objectives: ["Distinguish genotype and phenotype", "Construct a Punnett square", "Calculate offspring probabilities"],
    lesson: ["A genotype is an allele combination; phenotype is the expressed characteristic.", "A dominant allele is expressed in a heterozygote.", "Each parent contributes one allele to each offspring."],
    workedExample: "For Tt × Tt, the genotypes are TT, Tt, Tt and tt. If T is dominant, three of four expected offspring show the dominant phenotype.",
    checkpoint: { question: "In Tt × Tt, what is the probability of genotype tt?", options: ["0", "1/4", "1/2", "3/4"], answer: "1/4", explanation: "One of the four equally likely Punnett-square boxes is tt." },
    practice: [{ question: "What does heterozygous mean?", options: ["Two different alleles", "Two identical alleles", "No alleles", "Only a recessive phenotype"], answer: "Two different alleles", explanation: "A heterozygous genotype contains two different alleles for the gene." }],
  },
  {
    id: "binary-data", subject: "computer-science", title: "Binary, Hexadecimal, and Data Representation", level: "Intermediate", minutes: 14,
    summary: "Convert number bases and explain why hexadecimal is a compact binary notation.",
    objectives: ["Convert binary to denary", "Group binary into nibbles", "Relate bits and bytes"],
    lesson: ["Binary place values are powers of two.", "Four bits form one hexadecimal digit.", "Eight bits form one byte; storage prefixes depend on the stated convention."],
    workedExample: "Binary 101101 equals 32 + 8 + 4 + 1 = 45 in denary. Grouped as 0010 1101, it is 2D in hexadecimal.",
    checkpoint: { question: "What is binary 1101 in denary?", options: ["9", "11", "13", "15"], answer: "13", explanation: "8 + 4 + 0 + 1 = 13." },
    practice: [{ question: "How many bits are in one byte?", options: ["4", "8", "16", "32"], answer: "8", explanation: "A byte is conventionally defined as eight bits." }],
  },
  {
    id: "network-security", subject: "computer-science", title: "Network Threats and Defences", level: "Advanced", minutes: 16,
    summary: "Match common attacks to proportionate preventive and detective controls.",
    objectives: ["Recognise social engineering", "Distinguish hashing and encryption", "Choose layered controls"],
    lesson: ["Phishing manipulates users into revealing information or running malicious content.", "Encryption protects confidentiality in transit or storage; hashing is a one-way integrity or password-verification tool.", "Layered security combines technical controls, monitoring, updates and user training."],
    workedExample: "For password storage, use a slow password-hashing function with a unique salt. Do not store decryptable plaintext-equivalent passwords.",
    checkpoint: { question: "Which control most directly reduces harm from a stolen password?", options: ["Multi-factor authentication", "A larger monitor", "File compression", "A faster processor"], answer: "Multi-factor authentication", explanation: "A second independent factor can prevent a password alone from granting access." },
    practice: [{ question: "What is the main purpose of a firewall?", options: ["Filter network traffic using rules", "Hash every file", "Physically repair cables", "Create strong passwords"], answer: "Filter network traffic using rules", explanation: "A firewall permits or blocks traffic according to configured security rules." }],
  },
  {
    id: "price-elasticity", subject: "economics", title: "Price Elasticity of Demand", level: "Intermediate", minutes: 14,
    summary: "Calculate responsiveness and explain why elasticity matters to revenue decisions.",
    objectives: ["Calculate price elasticity of demand", "Interpret elastic and inelastic values", "Connect elasticity to total revenue"],
    lesson: ["Price elasticity of demand (PED) measures how strongly quantity demanded responds to a price change.", "PED = percentage change in quantity demanded ÷ percentage change in price; discussion often uses its absolute magnitude.", "Demand is elastic when the magnitude exceeds 1 and inelastic when it is below 1."],
    workedExample: "If price rises by 10% and quantity demanded falls by 20%, PED = −20% ÷ 10% = −2. The magnitude is 2, so demand is elastic.",
    checkpoint: { question: "Quantity demanded falls by 6% after price rises by 12%. What is the PED magnitude?", options: ["0.5", "2", "6", "18"], answer: "0.5", explanation: "The magnitude is 6 ÷ 12 = 0.5, so demand is inelastic over this change." },
    practice: [{ question: "Which PED magnitude represents elastic demand?", options: ["1.6", "0.8", "0.2", "0"], answer: "1.6", explanation: "A PED magnitude greater than 1 means quantity is proportionately more responsive than price." }],
  },
  {
    id: "analysing-quotations", subject: "english-literature", title: "Analysing a Quotation", level: "Intermediate", minutes: 13,
    summary: "Build a precise interpretation from language, form, structure, and context.",
    objectives: ["Select a focused quotation", "Analyse a deliberate writer's choice", "Link evidence to an interpretive argument"],
    lesson: ["Begin with a clear claim that answers the question rather than retelling the plot.", "Select a short piece of evidence and identify a specific word, image, structural choice, or contrast.", "Explain more than one plausible effect where the wording supports it, then connect the analysis back to the whole text."],
    workedExample: "Instead of writing ‘the storm is bad’, analyse the violent verb in a storm description, explain how it personifies nature as threatening, and relate that threat to the character's loss of control.",
    checkpoint: { question: "Which sentence is the strongest analytical move after a quotation?", options: ["The verb suggests force and makes the setting feel hostile", "This quote is on page ten", "The story continues after this", "The quotation has six words"], answer: "The verb suggests force and makes the setting feel hostile", explanation: "It identifies a specific language choice and explains how that choice develops an interpretation." },
    practice: [{ question: "Why are short, focused quotations often useful?", options: ["They make close analysis easier", "They remove the need for explanation", "They prove every interpretation", "They replace the argument"], answer: "They make close analysis easier", explanation: "A concise selection lets the response examine precise writer choices instead of copying a long passage." }],
  },
  {
    id: "reliability-validity", subject: "psychology", title: "Reliability and Validity", level: "Intermediate", minutes: 14,
    summary: "Evaluate whether a measure is consistent and whether it measures what it claims.",
    objectives: ["Distinguish reliability from validity", "Recognise common checks", "Suggest a proportionate improvement"],
    lesson: ["Reliability concerns consistency: a reliable measure produces similar results under comparable conditions.", "Validity concerns whether the study or measure supports the conclusion it claims to support.", "A measure can be reliable but invalid, such as a miscalibrated instrument that gives the same wrong value repeatedly."],
    workedExample: "Two observers independently code the same behaviour. Comparing their coding assesses inter-observer reliability; a clear coding frame can improve agreement.",
    checkpoint: { question: "A questionnaire gives similar scores when repeated a week later. What does this most directly support?", options: ["Test–retest reliability", "Ecological validity", "Population validity", "Demand characteristics"], answer: "Test–retest reliability", explanation: "Consistency across two administrations of the same measure is evidence of test–retest reliability." },
    practice: [{ question: "Can a measure be reliable but not valid?", options: ["Yes", "No", "Only in experiments", "Only with interviews"], answer: "Yes", explanation: "A measure may consistently produce the same result while failing to measure the intended construct." }],
  },
  {
    id: "river-processes", subject: "geography", title: "River Erosion and Transport", level: "Foundation", minutes: 12,
    summary: "Distinguish the main river processes and connect them to changing channel conditions.",
    objectives: ["Describe four erosion processes", "Identify transport processes", "Explain when deposition occurs"],
    lesson: ["Hydraulic action is the force of water on the channel; abrasion is scraping by carried sediment.", "Attrition makes transported particles collide and become smaller and rounder; solution dissolves soluble material.", "Deposition occurs when the river loses energy and can no longer carry all of its load."],
    workedExample: "When a river enters flatter land, its velocity may fall. Larger sediment is deposited first because the river no longer has enough energy to transport it.",
    checkpoint: { question: "Which process makes river sediment smaller and rounder through collisions?", options: ["Attrition", "Hydraulic action", "Suspension", "Evaporation"], answer: "Attrition", explanation: "During attrition, transported particles collide with each other and gradually become smaller and smoother." },
    practice: [{ question: "Why does a river deposit material?", options: ["It loses energy", "Its discharge always rises", "The load becomes weightless", "Gravity stops acting"], answer: "It loses energy", explanation: "A lower-energy flow has less capacity and competence to carry sediment." }],
  },
  {
    id: "break-even", subject: "business-studies", title: "Break-Even Analysis", level: "Intermediate", minutes: 13,
    summary: "Calculate contribution and break-even output, then interpret the margin of safety.",
    objectives: ["Calculate contribution per unit", "Calculate break-even output", "Explain margin of safety"],
    lesson: ["Contribution per unit = selling price per unit − variable cost per unit.", "Break-even output = fixed costs ÷ contribution per unit.", "Margin of safety = actual or forecast sales − break-even sales; a larger positive margin provides more protection against a sales fall."],
    workedExample: "A product sells for £20, has £12 variable cost and £4,000 fixed costs. Contribution is £8, so break-even output is 4,000 ÷ 8 = 500 units.",
    checkpoint: { question: "Price is £15 and variable cost is £9. What is contribution per unit?", options: ["£6", "£9", "£15", "£24"], answer: "£6", explanation: "Contribution per unit equals selling price minus variable cost: £15 − £9 = £6." },
    practice: [{ question: "Forecast sales are 900 units and break-even is 650. What is the margin of safety?", options: ["250 units", "650 units", "900 units", "1,550 units"], answer: "250 units", explanation: "Margin of safety = 900 − 650 = 250 units." }],
  },
  {
    id: "ielts-paragraph-cohesion", subject: "ielts", title: "Building a Cohesive Academic Paragraph", level: "Intermediate", minutes: 13,
    summary: "Organise one central idea with a clear claim, relevant support, and logical connections.",
    objectives: ["Write a focused topic sentence", "Develop rather than list ideas", "Use referencing and linking naturally"],
    lesson: ["Give each paragraph one controlling idea that directly contributes to the response.", "Support the idea with explanation, evidence, or a concrete example, then show why that support matters.", "Use pronouns, repeated key terms, synonyms, and logical connectors accurately; too many memorised linking phrases can make writing less natural."],
    workedExample: "A paragraph about public transport can state its main benefit, explain how fewer private journeys reduce congestion, illustrate the effect with a city example, and connect the result back to urban quality of life.",
    checkpoint: { question: "What is the main role of a topic sentence?", options: ["State the paragraph's controlling idea", "Add an unrelated example", "Repeat the entire introduction", "List every possible opinion"], answer: "State the paragraph's controlling idea", explanation: "A focused topic sentence establishes the idea that the rest of the paragraph will explain and support." },
    practice: [{ question: "Which approach usually improves cohesion?", options: ["Use clear logical references between sentences", "Start every sentence with however", "Change topic in every sentence", "Avoid repeating any key term"], answer: "Use clear logical references between sentences", explanation: "Cohesion comes from meaningful connections, not from inserting connectors mechanically." }],
  },
  {
    id: "celta-concept-checking", subject: "celta", title: "Concept-Checking Questions", level: "Intermediate", minutes: 14,
    summary: "Check meaning with short questions that reveal understanding instead of asking learners to self-report it.",
    objectives: ["Identify the target concept", "Write focused checking questions", "Avoid questions that merely invite yes or no"],
    lesson: ["First identify the essential meaning features learners must understand, including time, completion, possibility, or speaker attitude where relevant.", "Ask simple questions whose answers demonstrate those features; keep their language easier than the target item.", "Avoid relying on ‘Do you understand?’ because learners can answer yes without showing what they understood."],
    workedExample: "For ‘She used to live here’, useful checks include ‘Does she live here now?’ (No) and ‘Did she live here in the past?’ (Yes).",
    checkpoint: { question: "Which is the strongest concept-checking question for ‘must’?", options: ["Is it necessary?", "Do you understand must?", "Can you repeat must?", "How many letters are in must?"], answer: "Is it necessary?", explanation: "The question checks the core concept of obligation using language simpler than a long definition." },
    practice: [{ question: "Why should checking questions use simple language?", options: ["So difficulty in the question does not hide understanding", "So learners never speak", "So the teacher supplies every answer", "So form is ignored"], answer: "So difficulty in the question does not hide understanding", explanation: "A linguistically complex checking question may test the question itself rather than the target concept." }],
  },
  {
    id: "french-perfect-tense", subject: "french", title: "Le passé composé avec avoir", level: "Foundation", minutes: 13,
    summary: "Form and use the French perfect tense with a present-tense auxiliary and past participle.",
    objectives: ["Choose the correct form of avoir", "Form common past participles", "Place common negatives correctly"],
    lesson: ["For many verbs, the passé composé uses the present tense of avoir followed by a past participle.", "Regular patterns include -er → -é, -ir → -i, and -re → -u, although important irregular participles must be learned.", "In a basic negative sentence, ne and pas usually surround the conjugated auxiliary: je n'ai pas regardé."],
    workedExample: "Nous avons fini combines nous + avons with the past participle fini, meaning ‘we finished’ or ‘we have finished’ according to context.",
    checkpoint: { question: "Which sentence correctly means ‘I watched’?", options: ["J'ai regardé", "Je suis regarder", "J'avoir regardé", "Je regardé ai"], answer: "J'ai regardé", explanation: "The first-person form ai is followed by the past participle regardé." },
    practice: [{ question: "What is the regular past participle of finir?", options: ["fini", "finé", "finu", "finiré"], answer: "fini", explanation: "Regular -ir verbs commonly form the past participle by replacing -ir with -i." }],
  },
  {
    id: "german-accusative", subject: "german", title: "Nominative and Accusative Cases", level: "Foundation", minutes: 14,
    summary: "Identify the subject and direct object, then choose the appropriate definite or indefinite article.",
    objectives: ["Identify nominative subjects", "Identify accusative direct objects", "Apply the masculine article change"],
    lesson: ["The nominative case normally marks the subject that performs the verb.", "The accusative case commonly marks the direct object affected by the verb.", "Masculine singular articles change in the accusative: der → den and ein → einen; feminine, neuter, and plural definite articles do not change between these two cases."],
    workedExample: "Der Mann sieht den Hund: der Mann is the nominative subject, while den Hund is the masculine accusative direct object.",
    checkpoint: { question: "Complete: Ich sehe ___ Mann.", options: ["den", "der", "dem", "des"], answer: "den", explanation: "Mann is masculine and functions as the direct object, so the accusative definite article is den." },
    practice: [{ question: "In ‘Die Frau kauft einen Apfel’, what is the direct object?", options: ["einen Apfel", "die Frau", "kauft", "no direct object"], answer: "einen Apfel", explanation: "The apple receives the action of buying and is marked by the masculine accusative article einen." }],
  },
];
