import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, BookOpen, Atom, Beaker, Dna, Calculator } from "lucide-react";
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
        ],
      },
      {
        topic: "Calculus",
        formulas: [
          { name: "Power Rule", formula: "d/dx (xⁿ) = nxⁿ⁻¹", description: "Differentiate power functions" },
          { name: "Chain Rule", formula: "d/dx [f(g(x))] = f'(g(x))·g'(x)", description: "Composite function derivative" },
          { name: "Product Rule", formula: "d/dx [uv] = u'v + uv'", description: "Derivative of products" },
          { name: "Integration by Parts", formula: "∫u dv = uv - ∫v du", description: "Integrate products" },
          { name: "Fundamental Theorem", formula: "∫ₐᵇ f(x)dx = F(b) - F(a)", description: "Definite integral evaluation" },
        ],
      },
      {
        topic: "Statistics",
        formulas: [
          { name: "Mean", formula: "x̄ = Σxᵢ / n", description: "Average of data set" },
          { name: "Variance", formula: "σ² = Σ(xᵢ - x̄)² / n", description: "Spread of data" },
          { name: "Standard Deviation", formula: "σ = √(Σ(xᵢ - x̄)² / n)", description: "Root of variance" },
          { name: "Probability (OR)", formula: "P(A∪B) = P(A) + P(B) - P(A∩B)", description: "Addition rule" },
          { name: "Binomial Probability", formula: "P(X=k) = C(n,k) pᵏ (1-p)ⁿ⁻ᵏ", description: "Binomial distribution" },
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
          { name: "Kinetic Energy", formula: "KE = ½mv²", description: "Energy of motion" },
          { name: "GPE", formula: "GPE = mgh", description: "Gravitational potential energy" },
          { name: "Work Done", formula: "W = Fs·cosθ", description: "Force × displacement" },
          { name: "Power", formula: "P = W/t = Fv", description: "Rate of energy transfer" },
        ],
      },
      {
        topic: "Waves & Optics",
        formulas: [
          { name: "Wave Speed", formula: "v = fλ", description: "Speed = frequency × wavelength" },
          { name: "Period", formula: "T = 1/f", description: "Time for one cycle" },
          { name: "Snell's Law", formula: "n₁sinθ₁ = n₂sinθ₂", description: "Refraction of light" },
          { name: "Critical Angle", formula: "sinθc = n₂/n₁", description: "Total internal reflection" },
        ],
      },
      {
        topic: "Electricity",
        formulas: [
          { name: "Ohm's Law", formula: "V = IR", description: "Voltage = current × resistance" },
          { name: "Power (electrical)", formula: "P = IV = I²R = V²/R", description: "Electrical power" },
          { name: "Energy", formula: "E = Pt = QV", description: "Electrical energy" },
          { name: "Resistors (series)", formula: "R_total = R₁ + R₂ + ...", description: "Series combination" },
          { name: "Resistors (parallel)", formula: "1/R = 1/R₁ + 1/R₂ + ...", description: "Parallel combination" },
        ],
      },
      {
        topic: "Nuclear & Particles",
        formulas: [
          { name: "Mass-Energy", formula: "E = mc²", description: "Einstein's mass-energy equivalence" },
          { name: "Half-Life", formula: "N = N₀(½)^(t/t½)", description: "Radioactive decay" },
          { name: "Photon Energy", formula: "E = hf = hc/λ", description: "Energy of a photon" },
          { name: "de Broglie", formula: "λ = h/p = h/mv", description: "Matter wave wavelength" },
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
          { name: "Avogadro", formula: "N = n × Nₐ", description: "Number of particles (Nₐ = 6.022×10²³)" },
          { name: "Dilution", formula: "C₁V₁ = C₂V₂", description: "Dilution equation" },
        ],
      },
      {
        topic: "Energetics",
        formulas: [
          { name: "Enthalpy Change", formula: "ΔH = ΣΔHf(products) - ΣΔHf(reactants)", description: "Hess's Law" },
          { name: "q = mcΔT", formula: "q = mcΔT", description: "Energy from temperature change" },
          { name: "Bond Enthalpy", formula: "ΔH = Σ(bonds broken) - Σ(bonds formed)", description: "From bond energies" },
        ],
      },
      {
        topic: "Rates & Equilibrium",
        formulas: [
          { name: "Rate", formula: "Rate = Δ[conc] / Δt", description: "Change in concentration over time" },
          { name: "Kc Expression", formula: "Kc = [products]ⁿ / [reactants]ᵐ", description: "Equilibrium constant" },
          { name: "Kp Expression", formula: "Kp = (p_products)ⁿ / (p_reactants)ᵐ", description: "Pressure equilibrium constant" },
          { name: "pH", formula: "pH = -log₁₀[H⁺]", description: "Measure of acidity" },
        ],
      },
      {
        topic: "Electrochemistry",
        formulas: [
          { name: "EMF", formula: "E°cell = E°cathode - E°anode", description: "Cell potential" },
          { name: "Faraday's Law", formula: "m = (MIt) / (nF)", description: "Mass deposited in electrolysis" },
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
        topic: "Genetics",
        formulas: [
          { name: "Hardy-Weinberg", formula: "p² + 2pq + q² = 1", description: "Allele frequency in population" },
          { name: "Allele Frequency", formula: "p + q = 1", description: "Two allele frequencies sum to 1" },
          { name: "Chi-Squared", formula: "χ² = Σ(O - E)² / E", description: "Test observed vs expected ratios" },
        ],
      },
      {
        topic: "Ecology",
        formulas: [
          { name: "Simpson's Index", formula: "D = 1 - Σ(n/N)²", description: "Biodiversity index" },
          { name: "Lincoln Index", formula: "N = (n₁ × n₂) / n_r", description: "Capture-recapture population estimate" },
          { name: "Net Primary Productivity", formula: "NPP = GPP - R", description: "Energy available for consumers" },
        ],
      },
      {
        topic: "Cell Biology",
        formulas: [
          { name: "Magnification", formula: "M = Image size / Actual size", description: "Microscope magnification" },
          { name: "Water Potential", formula: "Ψ = Ψs + Ψp", description: "Solute + pressure potential" },
          { name: "Surface Area:Volume", formula: "SA:V ratio decreases as size increases", description: "Affects exchange efficiency" },
        ],
      },
      {
        topic: "Respiration & Photosynthesis",
        formulas: [
          { name: "Photosynthesis", formula: "6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", description: "Overall equation" },
          { name: "Respiration", formula: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O", description: "Overall equation" },
          { name: "RQ", formula: "RQ = CO₂ produced / O₂ consumed", description: "Respiratory quotient" },
        ],
      },
    ],
  },
];

export default function FormulaSheets() {
  useDocumentTitle("Formula Sheets | STEMCoach");
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
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">📐 Formula Sheets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Quick reference for key formulas across all subjects</p>
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
