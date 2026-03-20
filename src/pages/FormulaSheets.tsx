import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, BookOpen, Atom, Beaker, Dna, Calculator, Globe, TrendingUp, Landmark, Mountain, Brain, Languages } from "lucide-react";
import { motion } from "framer-motion";

interface Formula {
  name: string;
  formula: string;
  description: string;
}

interface FormulaCategory {
  topic: string;
  formulas: Formula[];
}

interface SubjectFormulas {
  subject: string;
  icon: typeof Calculator;
  gradient: string;
  categories: FormulaCategory[];
}

const formulaData: SubjectFormulas[] = [
  {
    subject: "Mathematics",
    icon: Calculator,
    gradient: "from-primary to-[hsl(258,60%,52%)]",
    categories: [
      {
        topic: "Algebra",
        formulas: [
          { name: "Quadratic Formula", formula: "x = (-b ± √(b² - 4ac)) / 2a", description: "Solves ax² + bx + c = 0" },
          { name: "Difference of Squares", formula: "a² - b² = (a+b)(a-b)", description: "Factoring identity" },
          { name: "Binomial Expansion", formula: "(a+b)ⁿ = Σ C(n,k) aⁿ⁻ᵏ bᵏ", description: "Expand powers of binomials" },
          { name: "Completing the Square", formula: "x² + bx = (x + b/2)² - (b/2)²", description: "Rewrite quadratics in vertex form" },
          { name: "Sum of AP", formula: "Sₙ = n/2 (2a + (n-1)d)", description: "Sum of arithmetic progression" },
          { name: "Sum of GP", formula: "Sₙ = a(1 - rⁿ) / (1 - r)", description: "Sum of geometric progression" },
          { name: "Logarithm Laws", formula: "log(ab) = log a + log b", description: "Product rule for logarithms" },
          { name: "Change of Base", formula: "logₐb = logc b / logc a", description: "Convert between log bases" },
        ],
      },
      {
        topic: "Trigonometry",
        formulas: [
          { name: "Sine Rule", formula: "a/sinA = b/sinB = c/sinC", description: "Relates sides and angles" },
          { name: "Cosine Rule", formula: "c² = a² + b² - 2ab·cos(C)", description: "Generalised Pythagoras" },
          { name: "Area of Triangle", formula: "A = ½ab·sin(C)", description: "Using two sides and included angle" },
          { name: "Pythagorean Identity", formula: "sin²θ + cos²θ = 1", description: "Fundamental trig identity" },
          { name: "Double Angle (sin)", formula: "sin(2θ) = 2sinθ·cosθ", description: "Double angle formula" },
          { name: "Double Angle (cos)", formula: "cos(2θ) = cos²θ - sin²θ", description: "Double angle formula" },
          { name: "Tan Identity", formula: "tanθ = sinθ / cosθ", description: "Definition of tangent" },
          { name: "Sec/Cosec/Cot", formula: "sec²θ = 1 + tan²θ", description: "Reciprocal trig identity" },
        ],
      },
      {
        topic: "Calculus",
        formulas: [
          { name: "Power Rule", formula: "d/dx (xⁿ) = nxⁿ⁻¹", description: "Differentiate power functions" },
          { name: "Chain Rule", formula: "d/dx [f(g(x))] = f'(g(x))·g'(x)", description: "Composite function derivative" },
          { name: "Product Rule", formula: "d/dx [uv] = u'v + uv'", description: "Derivative of products" },
          { name: "Quotient Rule", formula: "d/dx [u/v] = (u'v - uv') / v²", description: "Derivative of quotients" },
          { name: "Integration by Parts", formula: "∫u dv = uv - ∫v du", description: "Integrate products" },
          { name: "Fundamental Theorem", formula: "∫ₐᵇ f(x)dx = F(b) - F(a)", description: "Definite integral evaluation" },
          { name: "Trapezium Rule", formula: "∫ ≈ h/2 [y₀ + 2(y₁+...+yₙ₋₁) + yₙ]", description: "Numerical integration" },
        ],
      },
      {
        topic: "Statistics & Probability",
        formulas: [
          { name: "Mean", formula: "x̄ = Σxᵢ / n", description: "Average of data set" },
          { name: "Variance", formula: "σ² = Σ(xᵢ - x̄)² / n", description: "Spread of data" },
          { name: "Standard Deviation", formula: "σ = √(Σ(xᵢ - x̄)² / n)", description: "Root of variance" },
          { name: "Probability (OR)", formula: "P(A∪B) = P(A) + P(B) - P(A∩B)", description: "Addition rule" },
          { name: "Binomial Probability", formula: "P(X=k) = C(n,k) pᵏ (1-p)ⁿ⁻ᵏ", description: "Binomial distribution" },
          { name: "Normal Distribution", formula: "Z = (X - μ) / σ", description: "Standard score / z-score" },
          { name: "Poisson Distribution", formula: "P(X=k) = e⁻λ λᵏ / k!", description: "Events in fixed interval" },
          { name: "Correlation", formula: "r = Σ(xᵢ-x̄)(yᵢ-ȳ) / √[Σ(xᵢ-x̄)²Σ(yᵢ-ȳ)²]", description: "Pearson correlation coefficient" },
        ],
      },
      {
        topic: "Vectors & Matrices",
        formulas: [
          { name: "Dot Product", formula: "a·b = |a||b|cosθ", description: "Scalar product of two vectors" },
          { name: "Cross Product Magnitude", formula: "|a×b| = |a||b|sinθ", description: "Vector product magnitude" },
          { name: "Unit Vector", formula: "â = a / |a|", description: "Vector of length 1" },
          { name: "Determinant (2×2)", formula: "det = ad - bc", description: "For matrix [[a,b],[c,d]]" },
        ],
      },
    ],
  },
  {
    subject: "Physics",
    icon: Atom,
    gradient: "from-[hsl(250,80%,55%)] to-[hsl(280,70%,50%)]",
    categories: [
      {
        topic: "Mechanics",
        formulas: [
          { name: "SUVAT (v)", formula: "v = u + at", description: "Final velocity" },
          { name: "SUVAT (s)", formula: "s = ut + ½at²", description: "Displacement" },
          { name: "SUVAT (v²)", formula: "v² = u² + 2as", description: "Velocity-displacement" },
          { name: "Newton's 2nd Law", formula: "F = ma", description: "Force = mass × acceleration" },
          { name: "Weight", formula: "W = mg", description: "Weight force (g ≈ 9.81 m/s²)" },
          { name: "Momentum", formula: "p = mv", description: "Linear momentum" },
          { name: "Impulse", formula: "FΔt = Δp", description: "Change in momentum" },
          { name: "Kinetic Energy", formula: "KE = ½mv²", description: "Energy of motion" },
          { name: "GPE", formula: "GPE = mgh", description: "Gravitational potential energy" },
          { name: "Work Done", formula: "W = Fs·cosθ", description: "Force × displacement" },
          { name: "Power", formula: "P = W/t = Fv", description: "Rate of energy transfer" },
          { name: "Hooke's Law", formula: "F = kx", description: "Spring force" },
          { name: "Elastic PE", formula: "EPE = ½kx²", description: "Energy stored in spring" },
        ],
      },
      {
        topic: "Circular Motion & Gravitation",
        formulas: [
          { name: "Centripetal Acceleration", formula: "a = v²/r = ω²r", description: "Acceleration towards centre" },
          { name: "Centripetal Force", formula: "F = mv²/r", description: "Force towards centre" },
          { name: "Angular Velocity", formula: "ω = 2π/T = 2πf", description: "Rate of rotation" },
          { name: "Newton's Gravity", formula: "F = Gm₁m₂/r²", description: "Gravitational force" },
          { name: "Gravitational Field", formula: "g = GM/r²", description: "Field strength" },
          { name: "Orbital Speed", formula: "v = √(GM/r)", description: "Speed for circular orbit" },
        ],
      },
      {
        topic: "Waves & Optics",
        formulas: [
          { name: "Wave Speed", formula: "v = fλ", description: "Speed = frequency × wavelength" },
          { name: "Period", formula: "T = 1/f", description: "Time for one cycle" },
          { name: "Snell's Law", formula: "n₁sinθ₁ = n₂sinθ₂", description: "Refraction of light" },
          { name: "Critical Angle", formula: "sinθc = n₂/n₁", description: "Total internal reflection" },
          { name: "Diffraction Grating", formula: "d sinθ = nλ", description: "Maxima condition" },
          { name: "Young's Slits", formula: "λ = ax/D", description: "Double slit interference" },
        ],
      },
      {
        topic: "Electricity & Magnetism",
        formulas: [
          { name: "Ohm's Law", formula: "V = IR", description: "Voltage = current × resistance" },
          { name: "Power (electrical)", formula: "P = IV = I²R = V²/R", description: "Electrical power" },
          { name: "Energy", formula: "E = Pt = QV", description: "Electrical energy" },
          { name: "Resistors (series)", formula: "R_total = R₁ + R₂ + ...", description: "Series combination" },
          { name: "Resistors (parallel)", formula: "1/R = 1/R₁ + 1/R₂ + ...", description: "Parallel combination" },
          { name: "Coulomb's Law", formula: "F = kq₁q₂/r²", description: "Electrostatic force" },
          { name: "Capacitance", formula: "C = Q/V", description: "Charge stored per volt" },
          { name: "Time Constant", formula: "τ = RC", description: "RC circuit time constant" },
          { name: "Magnetic Force", formula: "F = BIL sinθ", description: "Force on current-carrying wire" },
          { name: "EMF (Faraday)", formula: "ε = -dΦ/dt", description: "Induced EMF" },
        ],
      },
      {
        topic: "Thermal Physics",
        formulas: [
          { name: "Specific Heat", formula: "Q = mcΔT", description: "Heat energy transfer" },
          { name: "Latent Heat", formula: "Q = mL", description: "Phase change energy" },
          { name: "Ideal Gas Law", formula: "pV = nRT", description: "Gas equation" },
          { name: "Boltzmann", formula: "½mv² = 3/2 kT", description: "Average KE of gas molecule" },
        ],
      },
      {
        topic: "Nuclear & Quantum",
        formulas: [
          { name: "Mass-Energy", formula: "E = mc²", description: "Einstein's mass-energy equivalence" },
          { name: "Half-Life", formula: "N = N₀(½)^(t/t½)", description: "Radioactive decay" },
          { name: "Photon Energy", formula: "E = hf = hc/λ", description: "Energy of a photon" },
          { name: "de Broglie", formula: "λ = h/p = h/mv", description: "Matter wave wavelength" },
          { name: "Photoelectric", formula: "hf = Φ + ½mv²_max", description: "Photoelectric equation" },
          { name: "Activity", formula: "A = λN = A₀e^(-λt)", description: "Rate of decay" },
          { name: "Decay Constant", formula: "λ = ln2 / t½", description: "Probability of decay per unit time" },
        ],
      },
    ],
  },
  {
    subject: "Chemistry",
    icon: Beaker,
    gradient: "from-[hsl(142,71%,40%)] to-[hsl(160,60%,38%)]",
    categories: [
      {
        topic: "Moles & Stoichiometry",
        formulas: [
          { name: "Moles", formula: "n = m / Mᵣ", description: "Moles from mass and molar mass" },
          { name: "Concentration", formula: "c = n / V", description: "Moles per volume (mol/dm³)" },
          { name: "Ideal Gas", formula: "pV = nRT", description: "Ideal gas equation" },
          { name: "Molar Volume", formula: "V = 24 dm³ at RTP", description: "Volume of 1 mol gas at RTP" },
          { name: "Avogadro", formula: "N = n × Nₐ", description: "Number of particles (Nₐ = 6.022×10²³)" },
          { name: "Dilution", formula: "C₁V₁ = C₂V₂", description: "Dilution equation" },
          { name: "Percentage Yield", formula: "% yield = (actual/theoretical) × 100", description: "Efficiency of reaction" },
          { name: "Atom Economy", formula: "% AE = (Mᵣ desired / Σ Mᵣ products) × 100", description: "Efficiency of atom use" },
        ],
      },
      {
        topic: "Energetics & Thermodynamics",
        formulas: [
          { name: "Enthalpy Change", formula: "ΔH = ΣΔHf(products) - ΣΔHf(reactants)", description: "Hess's Law" },
          { name: "q = mcΔT", formula: "q = mcΔT", description: "Energy from temperature change" },
          { name: "Bond Enthalpy", formula: "ΔH = Σ(bonds broken) - Σ(bonds formed)", description: "From bond energies" },
          { name: "Gibbs Free Energy", formula: "ΔG = ΔH - TΔS", description: "Spontaneity of reaction" },
          { name: "Entropy Change", formula: "ΔS = ΣS(products) - ΣS(reactants)", description: "Disorder change" },
        ],
      },
      {
        topic: "Rates & Equilibrium",
        formulas: [
          { name: "Rate", formula: "Rate = Δ[conc] / Δt", description: "Change in concentration over time" },
          { name: "Rate Equation", formula: "Rate = k[A]ᵐ[B]ⁿ", description: "Rate law expression" },
          { name: "Arrhenius", formula: "k = Ae^(-Eₐ/RT)", description: "Rate constant temperature dependence" },
          { name: "Kc Expression", formula: "Kc = [products]ⁿ / [reactants]ᵐ", description: "Equilibrium constant" },
          { name: "Kp Expression", formula: "Kp = (p_products)ⁿ / (p_reactants)ᵐ", description: "Pressure equilibrium constant" },
          { name: "pH", formula: "pH = -log₁₀[H⁺]", description: "Measure of acidity" },
          { name: "pOH", formula: "pOH = -log₁₀[OH⁻]", description: "Measure of alkalinity" },
          { name: "Kw", formula: "Kw = [H⁺][OH⁻] = 1×10⁻¹⁴", description: "Ionic product of water at 25°C" },
          { name: "Henderson-Hasselbalch", formula: "pH = pKa + log([A⁻]/[HA])", description: "Buffer pH calculation" },
        ],
      },
      {
        topic: "Electrochemistry",
        formulas: [
          { name: "EMF", formula: "E°cell = E°cathode - E°anode", description: "Cell potential" },
          { name: "Faraday's Law", formula: "m = (MIt) / (nF)", description: "Mass deposited in electrolysis" },
          { name: "Nernst Equation", formula: "E = E° - (RT/nF)lnQ", description: "Non-standard cell potential" },
        ],
      },
      {
        topic: "Organic Chemistry",
        formulas: [
          { name: "Degree of Unsaturation", formula: "DBE = (2C + 2 + N - H - X) / 2", description: "Double bond equivalents" },
          { name: "Empirical Formula", formula: "Divide moles by smallest", description: "Simplest whole number ratio" },
          { name: "Molecular Formula", formula: "n × empirical formula = molecular formula", description: "Actual number of atoms" },
        ],
      },
    ],
  },
  {
    subject: "Biology",
    icon: Dna,
    gradient: "from-[hsl(38,92%,45%)] to-[hsl(25,85%,50%)]",
    categories: [
      {
        topic: "Genetics & Evolution",
        formulas: [
          { name: "Hardy-Weinberg", formula: "p² + 2pq + q² = 1", description: "Allele frequency in population" },
          { name: "Allele Frequency", formula: "p + q = 1", description: "Two allele frequencies sum to 1" },
          { name: "Chi-Squared", formula: "χ² = Σ(O - E)² / E", description: "Test observed vs expected ratios" },
          { name: "Selection Pressure", formula: "Δp = spq² / (1 - sq²)", description: "Allele frequency change under selection" },
        ],
      },
      {
        topic: "Ecology & Environment",
        formulas: [
          { name: "Simpson's Index", formula: "D = 1 - Σ(n/N)²", description: "Biodiversity index" },
          { name: "Lincoln Index", formula: "N = (n₁ × n₂) / n_r", description: "Capture-recapture population estimate" },
          { name: "Net Primary Productivity", formula: "NPP = GPP - R", description: "Energy available for consumers" },
          { name: "Ecological Efficiency", formula: "% = (energy at trophic level n+1 / n) × 100", description: "Energy transfer between trophic levels" },
          { name: "Population Growth", formula: "dN/dt = rN((K-N)/K)", description: "Logistic growth equation" },
        ],
      },
      {
        topic: "Cell Biology",
        formulas: [
          { name: "Magnification", formula: "M = Image size / Actual size", description: "Microscope magnification" },
          { name: "Water Potential", formula: "Ψ = Ψs + Ψp", description: "Solute + pressure potential" },
          { name: "Surface Area:Volume", formula: "SA:V ratio decreases as size increases", description: "Affects exchange efficiency" },
          { name: "Mitotic Index", formula: "MI = dividing cells / total cells", description: "Proportion of cells dividing" },
        ],
      },
      {
        topic: "Respiration & Photosynthesis",
        formulas: [
          { name: "Photosynthesis", formula: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", description: "Overall equation" },
          { name: "Respiration", formula: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O", description: "Overall equation" },
          { name: "RQ", formula: "RQ = CO₂ produced / O₂ consumed", description: "Respiratory quotient" },
          { name: "ATP Yield", formula: "1 glucose → ~38 ATP (aerobic)", description: "Maximum ATP from oxidative phosphorylation" },
        ],
      },
    ],
  },
  {
    subject: "Computer Science",
    icon: Brain,
    gradient: "from-[hsl(200,80%,45%)] to-[hsl(220,70%,50%)]",
    categories: [
      {
        topic: "Data Representation",
        formulas: [
          { name: "Binary to Decimal", formula: "Σ bᵢ × 2ⁱ", description: "Sum of bit × position value" },
          { name: "Hex to Binary", formula: "Each hex digit = 4 binary bits", description: "Base 16 to base 2 conversion" },
          { name: "Two's Complement Range", formula: "-2ⁿ⁻¹ to 2ⁿ⁻¹ - 1", description: "Range for n-bit signed integers" },
          { name: "Image File Size", formula: "Size = W × H × colour depth", description: "In bits (÷8 for bytes)" },
          { name: "Sound File Size", formula: "Size = sample rate × bit depth × duration × channels", description: "In bits" },
        ],
      },
      {
        topic: "Algorithms & Complexity",
        formulas: [
          { name: "Linear Search", formula: "O(n)", description: "Worst case time complexity" },
          { name: "Binary Search", formula: "O(log n)", description: "Requires sorted data" },
          { name: "Bubble Sort", formula: "O(n²)", description: "Worst & average case" },
          { name: "Merge Sort", formula: "O(n log n)", description: "Consistent performance" },
          { name: "Big-O Hierarchy", formula: "O(1) < O(log n) < O(n) < O(n²) < O(2ⁿ)", description: "Common complexity classes" },
        ],
      },
      {
        topic: "Boolean Logic",
        formulas: [
          { name: "De Morgan's (AND)", formula: "¬(A ∧ B) = ¬A ∨ ¬B", description: "NOT of AND" },
          { name: "De Morgan's (OR)", formula: "¬(A ∨ B) = ¬A ∧ ¬B", description: "NOT of OR" },
          { name: "XOR", formula: "A ⊕ B = (A ∧ ¬B) ∨ (¬A ∧ B)", description: "Exclusive OR" },
          { name: "Half Adder", formula: "Sum = A ⊕ B, Carry = A ∧ B", description: "Single bit addition" },
        ],
      },
      {
        topic: "Networking",
        formulas: [
          { name: "Bandwidth", formula: "Data transferred / Time", description: "Measured in bps" },
          { name: "Latency", formula: "Delay = Propagation + Transmission + Processing", description: "Total network delay" },
          { name: "Subnet Hosts", formula: "2ⁿ - 2 (n = host bits)", description: "Usable addresses in subnet" },
        ],
      },
    ],
  },
  {
    subject: "Economics",
    icon: TrendingUp,
    gradient: "from-[hsl(340,75%,50%)] to-[hsl(0,84%,55%)]",
    categories: [
      {
        topic: "Microeconomics",
        formulas: [
          { name: "PED", formula: "PED = % change in Qd / % change in P", description: "Price elasticity of demand" },
          { name: "YED", formula: "YED = % change in Qd / % change in Y", description: "Income elasticity of demand" },
          { name: "XED", formula: "XED = % change in Qd of A / % change in P of B", description: "Cross elasticity of demand" },
          { name: "PES", formula: "PES = % change in Qs / % change in P", description: "Price elasticity of supply" },
          { name: "Total Revenue", formula: "TR = P × Q", description: "Price times quantity sold" },
          { name: "Profit", formula: "Profit = TR - TC", description: "Total revenue minus total cost" },
          { name: "Average Cost", formula: "AC = TC / Q", description: "Cost per unit" },
          { name: "Marginal Cost", formula: "MC = ΔTC / ΔQ", description: "Cost of one more unit" },
        ],
      },
      {
        topic: "Macroeconomics",
        formulas: [
          { name: "GDP", formula: "GDP = C + I + G + (X - M)", description: "Expenditure approach" },
          { name: "Multiplier", formula: "k = 1 / (1 - MPC) = 1 / MPW", description: "Keynesian multiplier" },
          { name: "MPC + MPS", formula: "MPC + MPS = 1", description: "Marginal propensities sum to 1" },
          { name: "Inflation Rate", formula: "Inflation = ((CPI₁ - CPI₀) / CPI₀) × 100", description: "Year-on-year price change" },
          { name: "Real GDP", formula: "Real GDP = Nominal GDP / (Price Index / 100)", description: "Adjusted for inflation" },
          { name: "Unemployment Rate", formula: "U = (Unemployed / Labour Force) × 100", description: "Percentage jobless" },
          { name: "Terms of Trade", formula: "ToT = (Index of export prices / Index of import prices) × 100", description: "Relative export strength" },
          { name: "Budget Deficit", formula: "Deficit = G - T", description: "Government spending minus tax revenue" },
        ],
      },
    ],
  },
  {
    subject: "Business Studies",
    icon: Landmark,
    gradient: "from-[hsl(270,60%,50%)] to-[hsl(290,55%,45%)]",
    categories: [
      {
        topic: "Finance & Accounts",
        formulas: [
          { name: "Gross Profit", formula: "GP = Revenue - Cost of Sales", description: "Before operating expenses" },
          { name: "Net Profit", formula: "NP = GP - Expenses", description: "After all costs" },
          { name: "GP Margin", formula: "GP Margin = (GP / Revenue) × 100", description: "Profitability ratio" },
          { name: "NP Margin", formula: "NP Margin = (NP / Revenue) × 100", description: "Net profitability" },
          { name: "Break-Even", formula: "BEP = Fixed Costs / (SP - VC per unit)", description: "Units to cover all costs" },
          { name: "Contribution", formula: "Contribution = SP - Variable Cost", description: "Per unit towards fixed costs" },
          { name: "ROI", formula: "ROI = (Net Profit / Investment) × 100", description: "Return on investment" },
          { name: "Payback Period", formula: "Time for cumulative cash flow = 0", description: "Investment recovery time" },
          { name: "ARR", formula: "ARR = (Average Annual Profit / Investment) × 100", description: "Average rate of return" },
          { name: "Current Ratio", formula: "Current Assets / Current Liabilities", description: "Short-term liquidity" },
          { name: "Gearing Ratio", formula: "(Non-current Liabilities / Capital Employed) × 100", description: "Debt proportion" },
        ],
      },
      {
        topic: "Marketing & Operations",
        formulas: [
          { name: "Market Share", formula: "MS = (Firm Sales / Total Market Sales) × 100", description: "Percentage of market" },
          { name: "Market Growth", formula: "MG = ((New - Old) / Old) × 100", description: "Year-on-year change" },
          { name: "Capacity Utilisation", formula: "CU = (Actual Output / Max Output) × 100", description: "Efficiency of production" },
          { name: "Labour Productivity", formula: "LP = Output / Number of Workers", description: "Output per worker" },
          { name: "Labour Turnover", formula: "LT = (Leavers / Average Staff) × 100", description: "Staff replacement rate" },
          { name: "Absenteeism", formula: "AR = (Days Absent / Total Working Days) × 100", description: "Rate of absence" },
        ],
      },
    ],
  },
  {
    subject: "Geography",
    icon: Mountain,
    gradient: "from-[hsl(160,60%,38%)] to-[hsl(180,50%,35%)]",
    categories: [
      {
        topic: "Physical Geography",
        formulas: [
          { name: "Hydraulic Radius", formula: "R = A / P", description: "Cross-section area / wetted perimeter" },
          { name: "River Discharge", formula: "Q = A × V", description: "Area × velocity (m³/s)" },
          { name: "Manning's Equation", formula: "V = (R^(2/3) × S^(1/2)) / n", description: "Flow velocity" },
          { name: "Recurrence Interval", formula: "T = (n + 1) / m", description: "Flood frequency analysis" },
          { name: "Lapse Rate", formula: "6.5°C per 1000m (ELR)", description: "Temperature decrease with altitude" },
        ],
      },
      {
        topic: "Human & Statistical",
        formulas: [
          { name: "Population Density", formula: "PD = Population / Area", description: "People per km²" },
          { name: "Natural Increase", formula: "NI = Birth Rate - Death Rate", description: "Population change (per 1000)" },
          { name: "Spearman's Rank", formula: "rs = 1 - (6Σd² / n(n²-1))", description: "Correlation coefficient" },
          { name: "Chi-Squared", formula: "χ² = Σ(O - E)² / E", description: "Statistical significance test" },
          { name: "Nearest Neighbour", formula: "Rn = 2D̄√(n/A)", description: "Settlement distribution pattern" },
          { name: "Location Quotient", formula: "LQ = (eᵢ/e) / (Eᵢ/E)", description: "Regional specialisation" },
        ],
      },
    ],
  },
  {
    subject: "Psychology",
    icon: Brain,
    gradient: "from-[hsl(30,80%,50%)] to-[hsl(45,75%,45%)]",
    categories: [
      {
        topic: "Research Methods",
        formulas: [
          { name: "Mean", formula: "x̄ = Σx / n", description: "Measure of central tendency" },
          { name: "Median", formula: "Middle value of ordered data", description: "Central value" },
          { name: "Mode", formula: "Most frequent value", description: "Most common score" },
          { name: "Range", formula: "Range = Highest - Lowest", description: "Measure of dispersion" },
          { name: "Standard Deviation", formula: "σ = √(Σ(x-x̄)² / n)", description: "Spread around the mean" },
          { name: "Significance Level", formula: "p ≤ 0.05 (typically)", description: "5% probability of Type I error" },
        ],
      },
      {
        topic: "Statistical Tests",
        formulas: [
          { name: "Chi-Squared", formula: "χ² = Σ(O - E)² / E", description: "Nominal data, independent measures" },
          { name: "Mann-Whitney U", formula: "U = n₁n₂ + n₁(n₁+1)/2 - R₁", description: "Ordinal, independent measures" },
          { name: "Wilcoxon T", formula: "T = smaller of ΣR+ or ΣR-", description: "Ordinal, repeated measures" },
          { name: "Spearman's rho", formula: "rs = 1 - (6Σd² / n(n²-1))", description: "Correlation for ordinal data" },
          { name: "Effect Size", formula: "d = (M₁ - M₂) / SDpooled", description: "Cohen's d" },
        ],
      },
    ],
  },
  {
    subject: "English",
    icon: Languages,
    gradient: "from-[hsl(210,70%,45%)] to-[hsl(230,65%,50%)]",
    categories: [
      {
        topic: "Language Analysis Frameworks",
        formulas: [
          { name: "AFOREST", formula: "Alliteration, Facts, Opinions, Rhetorical Q, Emotive, Statistics, Triples", description: "Persuasive techniques" },
          { name: "PEAL", formula: "Point, Evidence, Analysis, Link", description: "Paragraph structure" },
          { name: "SMILE", formula: "Structure, Meaning, Imagery, Language, Effect", description: "Poetry analysis framework" },
          { name: "AO1-AO4", formula: "AO1: Ideas, AO2: Analysis, AO3: Context, AO4: SPaG", description: "Assessment objectives" },
        ],
      },
      {
        topic: "Literary Devices",
        formulas: [
          { name: "Metaphor", formula: "X is Y (implicit comparison)", description: "Direct comparison without like/as" },
          { name: "Simile", formula: "X is like Y / X is as ... as Y", description: "Comparison using like/as" },
          { name: "Personification", formula: "Giving human qualities to non-human", description: "Animate the inanimate" },
          { name: "Pathetic Fallacy", formula: "Weather/nature reflects mood", description: "Environment mirrors emotion" },
          { name: "Oxymoron", formula: "Two contradictory words together", description: "e.g. 'bitter sweet'" },
          { name: "Juxtaposition", formula: "Placing contrasting ideas side by side", description: "Highlights difference" },
        ],
      },
      {
        topic: "Essay Structure",
        formulas: [
          { name: "Introduction", formula: "Context → Thesis → Outline", description: "Set up argument" },
          { name: "Body Paragraph", formula: "Topic sentence → Evidence → Analysis → Link", description: "PEAL structure" },
          { name: "Conclusion", formula: "Summarise → Evaluate → Final thought", description: "Wrap up argument" },
          { name: "Comparative", formula: "Similarly/However/Conversely + evidence", description: "Linking two texts" },
        ],
      },
    ],
  },
];

export default function FormulaSheets() {
  useDocumentTitle("Formula & Reference Sheets | STEMCoach");
  const [search, setSearch] = useState("");
  const [activeSubject, setActiveSubject] = useState(0);

  const subject = formulaData[activeSubject];
  const filtered = subject.categories
    .map((cat) => ({
      ...cat,
      formulas: cat.formulas.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.formula.toLowerCase().includes(search.toLowerCase()) ||
          f.description.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.formulas.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main id="main-content" className="container mx-auto px-4 py-6 pb-28 lg:pb-12">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">📐 Formula & Reference Sheets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quick reference for key formulas, frameworks, and equations across all subjects</p>
        </div>

        {/* Subject Tabs */}
        <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-none pb-2">
          {formulaData.map((s, i) => (
            <button
              key={s.subject}
              onClick={() => { setActiveSubject(i); setSearch(""); }}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                i === activeSubject
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <s.icon className="h-3.5 w-3.5" />
              {s.subject}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={`Search ${subject.subject} formulas...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Formulas */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">No formulas found matching "{search}"</div>
        ) : (
          <Accordion type="multiple" defaultValue={filtered.map((c) => c.topic)} className="space-y-3">
            {filtered.map((cat) => (
              <AccordionItem key={cat.topic} value={cat.topic} className="rounded-xl border border-border/50 bg-card px-4 shadow-sm">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    {cat.topic}
                    <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {cat.formulas.length}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-2 pb-2 sm:grid-cols-2">
                    {cat.formulas.map((f, fi) => (
                      <motion.div
                        key={f.name}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: fi * 0.03 }}
                        className="rounded-lg border border-border/30 bg-background p-3"
                      >
                        <div className="text-xs font-medium text-muted-foreground">{f.name}</div>
                        <div className="mt-1 font-mono text-sm font-semibold text-foreground">{f.formula}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{f.description}</div>
                      </motion.div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </main>
    </div>
  );
}
