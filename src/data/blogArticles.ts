export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export const blogArticles: Record<string, ArticleSection[]> = {
  "10-proven-study-techniques": [
    {
      heading: "Why most revision fails",
      paragraphs: [
        "Re-reading notes and highlighting feel productive because they are easy. Cognitive research consistently shows the opposite: the harder a study method feels in the moment, the more durable the learning tends to be. This is called desirable difficulty.",
        "The ten techniques below are ordered by how much evidence supports them, so start at the top and only add more once the first two are habits.",
      ],
    },
    {
      heading: "The ten techniques",
      paragraphs: ["Use these together rather than picking one in isolation."],
      bullets: [
        "Active recall — close the book and write down everything you remember before checking.",
        "Spaced repetition — revisit a topic after 1 day, 3 days, 7 days, then 21 days.",
        "Practice questions under exam conditions, timed, with no notes.",
        "Interleaving — mix topics in one session instead of blocking one topic for hours.",
        "Self-explanation — say out loud why each step of a worked solution follows from the last.",
        "Elaboration — connect a new fact to something you already know well.",
        "Dual coding — pair written notes with a diagram, graph, or flowchart.",
        "Concrete examples — collect two or three worked examples per abstract rule.",
        "Retrieval before instruction — attempt a question before you are taught the method.",
        "Distributed sessions — four 30-minute sessions beat one two-hour block.",
      ],
    },
    {
      heading: "A simple weekly plan",
      paragraphs: [
        "Pick three subjects per week. For each, do one 30-minute recall session, one 30-minute timed question set, and one 15-minute review of everything you got wrong. That is 3 hours 45 minutes per week and will outperform ten hours of re-reading.",
      ],
    },
  ],
  "ace-gcse-maths": [
    {
      heading: "Understand how marks are awarded",
      paragraphs: [
        "GCSE Maths papers award method marks (M), accuracy marks (A), and marks for a correct final answer (B). Losing marks is usually about presentation, not knowledge: an unlabelled working line or a missing unit costs you marks even when your thinking was right.",
        "Always show one clear line of working per step, and never erase incorrect attempts entirely — cross them out, because examiners can still award method marks from crossed-out work if nothing else is offered.",
      ],
    },
    {
      heading: "The topics that carry the most marks",
      paragraphs: ["Across foundation and higher tiers, the highest-yield areas are consistent."],
      bullets: [
        "Number: fractions, percentages, ratio and proportion.",
        "Algebra: solving equations, rearranging formulae, sequences.",
        "Geometry: angle rules, Pythagoras, trigonometry, circle theorems (higher).",
        "Statistics: averages from tables, cumulative frequency, box plots.",
        "Probability: tree diagrams and conditional probability.",
      ],
    },
    {
      heading: "Timing strategy",
      paragraphs: [
        "Aim for roughly one mark per minute. If a question stalls you for more than two minutes beyond its mark value, flag it and move on — the last pages often contain accessible marks that students never reach.",
        "Reserve the final ten minutes for checking units, rounding instructions, and any question you flagged.",
      ],
    },
  ],
  "organic-chemistry-guide": [
    {
      heading: "Organic chemistry is a language, not a list",
      paragraphs: [
        "Students who memorise reactions individually drown in them. Students who learn functional groups and the handful of mechanisms that act on them can predict reactions they have never seen before.",
        "Start by being fluent in naming: chain length, functional group suffix, substituent prefixes, and numbering by lowest locant.",
      ],
    },
    {
      heading: "The core functional groups",
      paragraphs: ["Almost every school-level reaction moves between these."],
      bullets: [
        "Alkanes and alkenes — addition across the double bond.",
        "Halogenoalkanes — nucleophilic substitution and elimination.",
        "Alcohols — oxidation to aldehydes, ketones, and carboxylic acids.",
        "Carbonyls — nucleophilic addition.",
        "Carboxylic acids and esters — condensation and hydrolysis.",
      ],
    },
    {
      heading: "How to revise mechanisms",
      paragraphs: [
        "Draw every mechanism from a blank page rather than copying. Curly arrows always start at a lone pair or a bond and end where the electron pair goes. If you can explain in words why each arrow moves, you understand it; if you can only draw it, you have memorised a picture.",
      ],
    },
  ],
  "feynman-technique": [
    {
      heading: "Four steps",
      paragraphs: ["The method is deliberately simple, which is why it exposes gaps so quickly."],
      bullets: [
        "Write the concept name at the top of a blank page.",
        "Explain it as though teaching a twelve-year-old, in plain sentences with no jargon.",
        "Mark every point where you stumble, hand-wave, or fall back on a technical term.",
        "Return to your source material only for those specific gaps, then re-explain.",
      ],
    },
    {
      heading: "Why it works",
      paragraphs: [
        "Recognition feels like understanding. Reading a definition triggers recognition, so students overestimate what they know. Producing an explanation from memory requires retrieval plus organisation, which is far closer to what an exam question demands.",
        "It is also fast feedback: you find out within two minutes whether you actually understand a topic, instead of discovering it in the exam hall.",
      ],
    },
    {
      heading: "Using it with STEMcoach",
      paragraphs: [
        "After answering a practice question, write your own one-paragraph explanation before opening the worked solution. Then compare. The differences are your revision list for the week.",
      ],
    },
  ],
  "alevel-physics-formulas": [
    {
      heading: "Know what is on the data sheet",
      paragraphs: [
        "Most A-Level boards provide a formula booklet, so the marks are not for recalling equations — they are for choosing the right one and rearranging it correctly. Spend a session reading the booklet itself so you know exactly what you do and do not need to memorise.",
      ],
    },
    {
      heading: "Equations worth knowing cold",
      paragraphs: ["These appear repeatedly and are often not given in usable form."],
      bullets: [
        "SUVAT equations for uniform acceleration.",
        "F = ma, and momentum p = mv with impulse FΔt = Δp.",
        "Work, energy, power: W = Fs cosθ, P = Fv, efficiency ratios.",
        "Circular motion: a = v²/r and F = mv²/r.",
        "Waves: v = fλ, and the double-slit relation λ = ax/D.",
        "Electricity: V = IR, P = I²R, and the potential divider rule.",
        "Capacitors and radioactive decay: both exponential, both of the form x = x₀e^(-t/τ).",
      ],
    },
    {
      heading: "Units are marks",
      paragraphs: [
        "Carry units through every line of algebra. If your final unit is wrong, your rearrangement is wrong — this is a free error-check that costs seconds and saves whole questions.",
      ],
    },
  ],
  "revision-timetable": [
    {
      heading: "Start from the exam dates, not from today",
      paragraphs: [
        "Write every exam date on one page, then count backwards. Subjects with earlier exams get earlier peaks; subjects with later exams get maintenance sessions now and intensity later.",
      ],
    },
    {
      heading: "Build the week in blocks",
      paragraphs: ["A timetable that assumes perfect days always collapses. Build in slack."],
      bullets: [
        "Use 30–40 minute blocks with 5–10 minute breaks, not open-ended hours.",
        "Never schedule more than three subjects in one day.",
        "Leave two empty catch-up blocks per week for whatever slipped.",
        "Schedule one full rest evening — it protects the rest of the plan.",
      ],
    },
    {
      heading: "Make it measurable",
      paragraphs: [
        "Replace 'revise biology' with 'complete 15 questions on transport in cells and review every mistake'. A timetable made of verifiable outputs tells you honestly whether the week worked.",
      ],
    },
  ],
  "mastering-economics": [
    {
      heading: "Micro and macro answer different questions",
      paragraphs: [
        "Microeconomics asks how individual agents — consumers, firms, single markets — allocate scarce resources. Macroeconomics asks how the whole economy behaves: output, employment, inflation, and the balance of payments.",
        "Most lost marks come from answering a macro question with micro reasoning, or vice versa. Read the command word and the unit of analysis before writing a single line.",
      ],
    },
    {
      heading: "Structure every essay the same way",
      paragraphs: ["Examiners reward a predictable, disciplined structure."],
      bullets: [
        "Define the key term precisely.",
        "Draw and fully label the relevant diagram.",
        "Explain the chain of reasoning, one causal link per sentence.",
        "Apply it to the context given in the extract or case study.",
        "Evaluate: magnitude, time lag, and what the answer depends on.",
      ],
    },
    {
      heading: "Evaluation is where the grades are",
      paragraphs: [
        "Strong evaluation is specific: 'the effect depends on the price elasticity of demand, which for this good is likely low because it has few substitutes' beats 'it depends on other factors'.",
      ],
    },
  ],
  "spaced-repetition-guide": [
    {
      heading: "The forgetting curve",
      paragraphs: [
        "Without review, most newly learned material decays sharply within days. Each successful review flattens the curve, so the next review can be scheduled further away. This is the entire basis of spaced repetition.",
      ],
    },
    {
      heading: "A schedule that works",
      paragraphs: ["If you are not using an algorithm, this manual schedule is close enough."],
      bullets: [
        "Review 1: the same day you learn it.",
        "Review 2: one day later.",
        "Review 3: three days later.",
        "Review 4: one week later.",
        "Review 5: three weeks later, then monthly.",
      ],
    },
    {
      heading: "What to put on a card",
      paragraphs: [
        "One idea per card, phrased as a question with a single unambiguous answer. If the answer is a list of six things, split it into six cards — long answers are the main reason people abandon flashcards.",
        "STEMcoach turns every question you get wrong into a flashcard automatically and schedules it using the SM-2 algorithm, so the spacing is handled for you.",
      ],
    },
  ],
  "gcse-biology-cells": [
    {
      heading: "Structure follows function",
      paragraphs: [
        "Every cell question ultimately rewards the same move: name the structure, state its function, then link the two. A root hair cell is long and thin because that increases surface area, which increases the rate of water uptake by osmosis.",
      ],
    },
    {
      heading: "What you must be able to recall",
      paragraphs: ["These come up in almost every paper."],
      bullets: [
        "Differences between eukaryotic and prokaryotic cells.",
        "Functions of the nucleus, mitochondria, ribosomes, chloroplasts, cell wall, and vacuole.",
        "Diffusion, osmosis, and active transport — and which requires energy.",
        "Cell differentiation and the role of stem cells.",
        "Mitosis and the stages of the cell cycle.",
        "Microscopy calculations: magnification = image size ÷ actual size.",
      ],
    },
    {
      heading: "The calculation examiners love",
      paragraphs: [
        "Magnification questions are guaranteed marks if you convert units first. Get everything into micrometres before dividing, and write the unit at every step.",
      ],
    },
  ],
  "maths-exam-mistakes": [
    {
      heading: "Five mistakes that cost real marks",
      paragraphs: ["None of these are about ability — they are about habit."],
      bullets: [
        "Rounding too early, then carrying the error through every later step.",
        "Ignoring the command word: 'show that' requires full working, 'write down' does not.",
        "Dropping units, or mixing cm and m within one calculation.",
        "Not reading the accuracy instruction — 3 significant figures versus 2 decimal places.",
        "Leaving blanks. An attempt can earn method marks; an empty space cannot.",
      ],
    },
    {
      heading: "Build a personal error log",
      paragraphs: [
        "After every practice paper, write each mistake in one line and tag it as careless, method, or knowledge. After three papers a pattern appears, and that pattern is your revision plan.",
        "Careless errors are fixed by checking routines, method errors by worked examples, and knowledge errors by returning to the topic itself. Treating all three the same way is why students plateau.",
      ],
    },
  ],
};
