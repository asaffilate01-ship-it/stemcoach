import type { Tutorial } from "./tutorials";
import { mcq, numeric, short, multi, trueFalse, match, order, fillBlanks, diagramLabel } from "./tutorialQuestions";

/** Teaching drafts for self-check revision. Not independently accredited or exam-board verified. */
export const nextQAExpansionA: Tutorial[] = [
  {
    id: "triangle-diagram-labelling", subject: "mathematics", title: "Trigonometry: Label a Right Triangle", level: "Foundation", minutes: 15,
    summary: "Identify sides relative to the chosen angle and solve basic right-triangle ratios.",
    objectives: ["Identify the hypotenuse", "Label opposite and adjacent sides relative to θ", "Choose a suitable trigonometric ratio"],
    lesson: [
      "The hypotenuse is always opposite the right angle, so it is the triangle's longest side.",
      "The opposite side is across from the marked acute angle θ; the adjacent side touches θ but is not the hypotenuse.",
      "Use sin θ = opposite/hypotenuse, cos θ = adjacent/hypotenuse and tan θ = opposite/adjacent.",
    ],
    workedExample: "If the opposite side to θ is 6 cm and the hypotenuse is 10 cm, sin θ = 6/10 = 0.6. The angle θ is approximately 36.9° in degree mode.",
    examTip: "Re-label opposite and adjacent whenever the reference angle changes.",
    commonMistake: "Choosing the vertical side as 'opposite' without checking which angle is labelled θ.",
    checkpoint: diagramLabel("Label the three sides A, B and C of the right triangle relative to the angle θ drawn at the bottom right.", "right-triangle", [
      ["A", 78, 109, "Opposite"], ["B", 191, 174, "Adjacent"], ["C", 210, 106, "Hypotenuse"],
    ], ["Hypotenuse", "Adjacent", "Opposite"], "With θ at the lower-right corner, the vertical left side is opposite, the bottom side is adjacent, and the diagonal is the hypotenuse.", "First find the side opposite the square right-angle marker."),
    practice: [
      fillBlanks("Complete both ratios for the marked angle θ in a right triangle.", [
        ["sin", "sin θ = opposite ÷ ____", "hypotenuse"],
        ["tan", "tan θ = opposite ÷ ____", "adjacent"],
      ], "Sine uses opposite over hypotenuse; tangent uses opposite over adjacent.", "Recall the SOH and TOA mnemonics."),
      numeric("A triangle has opposite side 9 cm and hypotenuse 15 cm. What is sin θ?", 0.6, "sin θ = 9 ÷ 15 = 0.6.", "Use the ratio opposite over hypotenuse."),
      trueFalse("When the marked acute angle changes, the hypotenuse stays the same side.", true, "The hypotenuse always faces the right angle; opposite and adjacent may swap.", "Only the right angle defines the hypotenuse."),
    ],
  },
  {
    id: "circuit-diagram-labelling", subject: "physics", title: "Reading Simple Electrical Circuit Diagrams", level: "Foundation", minutes: 16,
    summary: "Identify circuit symbols and apply a basic current–voltage–resistance relationship.",
    objectives: ["Identify a cell, resistor and connecting wire", "Recognise a simple series loop", "Calculate current using V = IR"],
    lesson: [
      "A cell symbol uses one longer and one shorter line, with a conducting wire completing the circuit.",
      "A resistor can be shown as a rectangular symbol in IEC-style diagrams; it restricts current for a given voltage.",
      "A simple complete series loop has the same current through the resistor and cell. For an ideal resistor, current I = V/R.",
    ],
    workedExample: "With one ideal 6 V cell and a single 3 Ω resistor, the ideal current is I = 6/3 = 2 A. Real internal resistance can reduce the measured current.",
    examTip: "Read each circuit symbol rather than assuming every rectangle is a battery.",
    commonMistake: "Confusing the two-line cell symbol with the resistor symbol.",
    checkpoint: diagramLabel("Label the component or connection at A, B and C in this simple series circuit diagram.", "circuit", [
      ["A", 68, 90, "Cell"], ["B", 214, 46, "Resistor"], ["C", 332, 144, "Connecting wire"],
    ], ["Cell", "Resistor", "Connecting wire"], "A is the cell made of unequal parallel lines; B is the rectangular resistor; C is the conducting wire closing the loop.", "Look for a pair of unequal lines to locate the cell."),
    practice: [
      fillBlanks("Complete the two quantities in Ohm's law, V = I × R.", [
        ["i", "I represents electric ____", "current"],
        ["r", "R represents ____", "resistance"],
      ], "I is the electric current measured in amperes; R is resistance measured in ohms.", "Think about what amperes and ohms measure."),
      numeric("A 12 V ideal supply is connected across a 4 Ω resistor. What current flows in amperes?", 3, "I = V/R = 12/4 = 3 A.", "Divide voltage by resistance."),
      multi("Which statements are true for a single resistor in a complete simple series loop?", ["Current passes through the resistor", "The circuit requires a continuous conducting path", "A resistor makes current infinite", "Ohm's law gives I = V/R for an ideal ohmic resistor"], ["Current passes through the resistor", "The circuit requires a continuous conducting path", "Ohm's law gives I = V/R for an ideal ohmic resistor"], "A complete path allows current and an ideal resistor follows I = V/R; resistance does not create infinite current.", "Think of what happens if the wire is broken."),
    ],
  },
  {
    id: "reaction-energetics", subject: "chemistry", title: "Exothermic and Endothermic Reactions", level: "Intermediate", minutes: 15,
    summary: "Distinguish energy released from absorbed and interpret the sign of enthalpy change.",
    objectives: ["Classify exothermic versus endothermic processes", "Interpret ΔH signs", "Explain bond breaking and bond making"],
    lesson: [
      "An exothermic reaction transfers energy from the reacting system to its surroundings; ΔH is negative for a conventional reaction enthalpy change.",
      "An endothermic reaction absorbs net energy from the surroundings, so ΔH is positive.",
      "Breaking chemical bonds requires energy; forming bonds releases energy. Their net balance influences ΔH.",
    ],
    workedExample: "If a reaction transfers 80 kJ from the reacting system to surroundings at constant pressure, ΔH = −80 kJ for the reaction as written. The negative sign identifies an exothermic reaction.",
    examTip: "State whether the energy change belongs to the system or to the surroundings.",
    commonMistake: "Claiming that breaking bonds releases energy; breaking bonds always requires an input.",
    checkpoint: fillBlanks("Complete the signs of reaction enthalpy change.", [
      ["exo", "For an exothermic reaction, ΔH is ____.", "negative"],
      ["endo", "For an endothermic reaction, ΔH is ____.", "positive"],
    ], "Exothermic reactions have negative ΔH and endothermic reactions have positive ΔH when using conventional system enthalpy change.", "Think of energy leaving or entering the system."),
    practice: [
      mcq("Which process requires energy to be supplied directly?", ["Breaking a chemical bond", "Forming a chemical bond", "Forming a stable lattice only", "Condensing a gas into a liquid"], "Breaking a chemical bond", "Energy must be added to separate chemically bonded atoms.", "Bond formation tends to release energy."),
      trueFalse("Combustion of methane under normal conditions is exothermic.", true, "Complete combustion of methane releases more energy through bond formation than it consumes in bond breaking.", "Burning fuel transfers heat into the surroundings."),
      numeric("A reaction absorbs 45 kJ at constant pressure. What is ΔH in kJ for the system?", 45, "Endothermic reactions have a positive enthalpy change, so ΔH = +45 kJ.", "Absorbed means positive change for the reacting system."),
    ],
  },
  {
    id: "animal-cell-diagram", subject: "biology", title: "Animal Cell Organelles and Their Functions", level: "Foundation", minutes: 16,
    summary: "Identify cell structures on a simple diagram and explain their functions.",
    objectives: ["Identify nucleus, cytoplasm and cell membrane", "Describe where many cell reactions occur", "Distinguish transport control from genetic information storage"],
    lesson: [
      "The cell membrane forms a selective boundary controlling movement of substances into and out of the cell.",
      "The cytoplasm is the material within the membrane, containing many chemical reactions and structures.",
      "The nucleus contains much of a typical animal cell's DNA; mitochondria release usable energy from respiratory substrates through aerobic respiration.",
    ],
    workedExample: "When explaining why an animal cell requires a cell membrane, state that it separates internal contents from external fluid and regulates transport across the boundary.",
    examTip: "Label the actual structure touched by the marker before stating a biological function.",
    commonMistake: "Saying 'the nucleus is the brain of the cell' without a precise description of DNA and gene expression.",
    checkpoint: diagramLabel("Label A, B and C on this simplified animal-cell diagram.", "cell", [
      ["A", 187, 112, "Nucleus"], ["B", 265, 121, "Cytoplasm"], ["C", 360, 112, "Cell membrane"],
    ], ["Cell membrane", "Nucleus", "Cytoplasm"], "The nucleus is the round central structure; cytoplasm occupies the interior around it; the membrane is the thin outer boundary.", "The outermost line is the membrane, not the nucleus."),
    practice: [
      fillBlanks("Complete the functions of two animal-cell structures.", [
        ["membrane", "The cell ____ controls exchange with surroundings.", "membrane"],
        ["nucleus", "The ____ contains most of the cell's DNA.", "nucleus"],
      ], "The cell membrane regulates exchange, while the nucleus contains most of the DNA in typical animal cells.", "Think of the boundary and the genetic compartment."),
      multi("Which structures commonly occur in a typical animal cell?", ["Nucleus", "Cell membrane", "Mitochondria", "Cellulose cell wall"], ["Nucleus", "Cell membrane", "Mitochondria"], "Most animal cells have a membrane, mitochondria and a nucleus; cellulose walls are characteristic of plant cells, not animal cells.", "A red blood cell is a special exception to typical structure."),
      trueFalse("The cytoplasm is the same structure as the cell membrane.", false, "Cytoplasm is inside the cell boundary; the membrane surrounds it.", "The two structures have different locations."),
    ],
  },
  {
    id: "trace-algorithm-loops", subject: "computer-science", title: "Tracing Loops and Accumulator Variables", level: "Intermediate", minutes: 15,
    summary: "Trace simple loops using a table of changing values.",
    objectives: ["Identify an accumulator", "Trace iteration order", "Distinguish off-by-one errors"],
    lesson: [
      "An accumulator variable stores a running total or product and needs a suitable starting value, often 0 for sums.",
      "Trace each loop iteration by writing the loop variable and updated accumulator value on a new row.",
      "An off-by-one error occurs when the loop visits one more or one fewer item than intended.",
    ],
    workedExample: "For total = 0, then for i in [1, 2, 3], total = total + i, the totals after each iteration are 1, 3 and 6.",
    examTip: "Do not skip intermediate rows; show the value after every loop update.",
    commonMistake: "Reporting the last value of i instead of the accumulated total.",
    checkpoint: fillBlanks("Complete the trace of a running sum over [2, 4, 6], starting total = 0.", [
      ["first", "Total after adding 2 = ____", "2"],
      ["second", "Total after also adding 4 = ____", "6"],
      ["third", "Total after also adding 6 = ____", "12"],
    ], "The running totals are 2, 6 and 12 for the three iterations.", "Add each next number to the accumulated total."),
    practice: [
      numeric("A loop adds 1 + 2 + 3 + 4 to an accumulator starting at 0. What is the final value?", 10, "The iterations produce 1, then 3, then 6, then 10.", "Trace the running sum rather than reporting the last loop index."),
      order("Arrange the tracing steps for a running-total loop.", ["Initialise the total", "Read the next loop value", "Update the total", "Record the new total in the trace table"], "Start with a known value, process the next iteration, update and record it before repeating.", "The total is updated before its final value is recorded."),
      short("What is the term for a variable that stores a running total?", "accumulator", "An accumulator collects values as a program iterates.", "It accumulates the partial results."),
    ],
  },
  {
    id: "inflation-purchasing-power", subject: "economics", title: "Inflation and Real Purchasing Power", level: "Intermediate", minutes: 16,
    summary: "Distinguish price levels, inflation and the effects of rising living costs.",
    objectives: ["Define inflation as a rate of price-level increase", "Calculate a simple percentage price change", "Explain purchasing-power effects"],
    lesson: [
      "Inflation is a sustained increase in the general price level, commonly measured using an index of consumer prices.",
      "A lower positive inflation rate means prices are rising more slowly, not that they are necessarily falling.",
      "With unchanged nominal income, higher prices reduce the quantity of goods and services that income can buy.",
    ],
    workedExample: "If a representative basket costs £200 and later £210, its price increase is £10, or 5% of the original £200. This simple example does not substitute for a properly weighted consumer price index.",
    examTip: "Distinguish inflation (rate) from the price level (amount).",
    commonMistake: "Calling a fall in inflation from 5% to 2% a fall in all prices.",
    checkpoint: mcq("Inflation falls from 6% to 3%, remaining positive. What does that usually mean?", ["Prices are still increasing, but at a slower rate", "All prices fall by 3%", "The overall price level immediately returns to its old value", "All wages double"], "Prices are still increasing, but at a slower rate", "With positive inflation the aggregate price index continues to rise, although less rapidly.", "A positive rate is still an increase."),
    practice: [
      numeric("A reference basket rises from £80 to £84. What is its percentage price increase?", 5, "Change = £4; 4 ÷ 80 × 100 = 5%.", "Divide the change by the starting price."),
      fillBlanks("Complete two terms used in inflation analysis.", [
        ["nominal", "Income stated in money amounts without adjusting for price changes is ____ income.", "nominal"],
        ["real", "Income adjusted for price-level changes is ____ income.", "real"],
      ], "Nominal is unadjusted money value; real accounts for changes in the general price level.", "Real values adjust for inflation."),
      trueFalse("A 2% positive inflation rate means the average measured price level is falling.", false, "Positive inflation still represents a rise in the general price level, though individual prices can fall.", "Consider the sign of the rate."),
    ],
  },
  {
    id: "comparing-poetry-voices", subject: "english-literature", title: "Comparing Speaker, Tone and Imagery in Poetry", level: "Intermediate", minutes: 15,
    summary: "Compare two short original poetic lines through tone and language choice.",
    objectives: ["Identify a poetic speaker", "Compare how diction shapes tone", "Use balanced textual comparisons"],
    lesson: [
      "The speaker in a poem is the voice addressing readers and is not automatically the real-life poet.",
      "Tone is an attitude conveyed through diction, rhythm and imagery; compare words in context rather than simply listing emotions.",
      "A useful comparison makes one interpretive point, supports it with evidence from both texts, and explains a meaningful similarity or contrast.",
    ],
    workedExample: "Original lines: 'Morning lifts the shutters gently' versus 'Morning tears the curtains open.' Both personify morning, but 'gently' suggests calm while 'tears' suggests aggression.",
    examTip: "Use a single comparative sentence linking both writers' choices, not two unrelated mini-essays.",
    commonMistake: "Assuming the speaker is necessarily identical to the poet.",
    checkpoint: mcq("In the original phrase 'Morning tears the curtains open', what might 'tears' suggest?", ["Forceful or abrupt action", "Calm and gentle movement", "An exact scientific prediction", "A neutral weather measurement"], "Forceful or abrupt action", "The violent verb 'tears' conveys sudden force and may make the scene feel unsettling.", "Compare 'tears' to 'lifts'."),
    practice: [
      fillBlanks("Complete the literary analysis terms.", [
        ["speaker", "The voice speaking in a poem is the ____.", "speaker"],
        ["tone", "The attitude conveyed by the speaker's language is the ____.", "tone"],
      ], "The speaker is the constructed voice and tone is the attitude communicated through language.", "Focus on who speaks and the attitude conveyed."),
      multi("Which comments use close textual analysis rather than unsupported claims?", ["The verb 'tears' suggests violence", "The adverb 'gently' may create a calm tone", "The poet must be angry in real life", "Contrasting the verbs helps explain a change in mood"], ["The verb 'tears' suggests violence", "The adverb 'gently' may create a calm tone", "Contrasting the verbs helps explain a change in mood"], "The supported interpretations focus on textual evidence, not assumptions about a writer's private feelings.", "Base interpretation on actual words."),
      trueFalse("The speaker of a poem must always be the author speaking autobiographically.", false, "A poet may construct a fictional or dramatic voice separate from their own identity.", "Think of dramatic monologues."),
    ],
  },
];
