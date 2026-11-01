import type { Tutorial } from "./tutorials";
import { mcq, numeric, trueFalse, multi, short, order, match, fillBlanks } from "./tutorialQuestions";

/** Original, author-drafted formative revision. Independent curriculum review pending. */
export const novemberHumanities: Tutorial[] = [
  {
    id: "demand-price-elasticity", subject: "economics",
    title: "Demand Elasticity: Calculations and Interpretation", level: "Intermediate", minutes: 16,
    summary: "Calculate signed elasticity, interpret magnitudes and explain why demand sensitivity differs.",
    objectives: ["Use percentage changes to calculate PED", "Distinguish elastic from inelastic demand", "Discuss substitutes and adjustment time"],
    lesson: [
      "Price elasticity of demand measures the responsiveness of quantity demanded to changes in price: PED = percentage change in quantity demanded ÷ percentage change in price.",
      "Under the usual downward-sloping demand relationship, a price rise reduces quantity demanded, so the signed PED is negative. The absolute magnitude is often used to describe sensitivity.",
      "A magnitude above 1 means elastic demand, below 1 means inelastic demand and exactly 1 is unit elastic. Availability of substitutes and time to adjust can affect responsiveness."
    ],
    workedExample: "If price increases by 10% and quantity demanded falls by 20%, signed PED = −20% ÷ 10% = −2. Its magnitude is 2, so demand is price elastic for this change.",
    examTip: "Label whether you report signed elasticity or its absolute magnitude, and show both percentage changes before division.",
    commonMistake: "Using the change in units of sales divided by the change in pounds of price; PED compares percentages, not absolute amounts.",
    checkpoint: mcq("Price rises 10% and quantity demanded falls 20%. What is signed PED?", ["−0.5", "−2", "+2", "+0.5"], "−2", "PED = −20% ÷ +10% = −2, or magnitude 2.", "Use percentage quantity change over percentage price change."),
    practice: [
      numeric("Quantity demanded falls 15% after a 5% price rise. What is the absolute magnitude of PED?", 3, "The magnitude is 15/5 = 3, indicating elastic demand over the measured interval.", "Use absolute percentage changes for magnitude."),
      mcq("What does an absolute PED magnitude of 0.4 indicate?", ["Elastic demand", "Inelastic demand", "Unit elasticity", "Perfectly elastic demand"], "Inelastic demand", "A percentage change in quantity demanded is smaller than the percentage change in price when the magnitude is below 1.", "Compare 0.4 with the threshold of one."),
      trueFalse("PED is calculated using percentage rather than absolute price and quantity changes.", true, "Percentage changes enable comparisons between goods with different price and quantity units.", "A ratio of pounds to units would not be the PED measure."),
      multi("Which considerations may affect the magnitude of price elasticity?", ["Availability of close substitutes", "Time for consumers to adjust", "Whether the good is a necessity", "The number of letters in the product name"], ["Availability of close substitutes", "Time for consumers to adjust", "Whether the good is a necessity"], "Substitutes, adjustment time and necessity can influence responsiveness; spelling length does not.", "Think about consumer choices and available alternatives."),
      order("Put the steps for a signed PED calculation in a sensible order.", ["Calculate the percentage change in quantity demanded", "Calculate the percentage change in price", "Divide the first percentage by the second"], "The PED formula uses quantity percentage change in the numerator and price percentage change in the denominator.", "Find the two percentages before forming a ratio."),
      fillBlanks("For a price rise of 10% and quantity fall of 5%, give signed PED and its magnitude.", [["signed", "Signed PED:", "-0.5"], ["magnitude", "Absolute PED magnitude:", "0.5"]], "Signed PED is −5/10 = −0.5; its magnitude is 0.5, indicating inelastic demand.", "Pay attention to whether a negative sign is required."),
      short("What term describes demand with absolute PED greater than 1?", "elastic", "Elastic demand means the proportional quantity response exceeds the proportional price change.", "Its magnitude exceeds the unit-elastic threshold.", ["price elastic", "price-elastic"])
    ]
  },
  {
    id: "literature-argument-and-evidence", subject: "english-literature",
    title: "Building a Literary Interpretation", level: "Intermediate", minutes: 17,
    summary: "Use precise textual observations, interpretation and alternative readings to build an argument.",
    objectives: ["Separate observations from inferences", "Support claims with textual detail", "Explain how narrative technique shapes reader response"],
    lesson: [
      "An analytical paragraph makes an arguable claim about the text rather than merely listing events or naming a literary device.",
      "Textual detail supports a claim: analyse word choice, structure, narrative perspective or imagery and connect those choices to the interpretation.",
      "An alternative reading can deepen an argument when it is also supported by the text. Context should illuminate a claim, not replace close analysis."
    ],
    workedExample: "In an original imaginary scene, a narrator repeatedly checks a locked door. Rather than only writing 'the door is mentioned', a reader could argue that repetition and the locked setting build a sense of confinement.",
    examTip: "Make a claim, refer to a precise detail and explain how it supports your interpretation; avoid unsupported assertions of author intention.",
    commonMistake: "Simply naming a simile or repeating a plot event without explaining what that technique contributes to meaning.",
    checkpoint: mcq("Which sentence is an arguable literary interpretation rather than simple plot summary?", ["The character enters the room", "The room is described in two paragraphs", "The narrow setting may suggest the character feels trapped", "The chapter ends with a door closing"], "The narrow setting may suggest the character feels trapped", "This statement interprets the potential effect of setting and can be supported or challenged with evidence.", "Look for an evidence-based claim about meaning or effect."),
    practice: [
      trueFalse("A first-person narrator is always reliable and knows every character's thoughts.", false, "First-person narration can be limited or unreliable; access to other minds is not guaranteed.", "Narrators can misremember, misread and conceal information."),
      multi("Which choices strengthen a literary analysis paragraph?", ["Refer to precise textual detail", "Explain the effect of a selected technique", "Consider a supported alternative interpretation", "Treat the author's intention as certain without evidence"], ["Refer to precise textual detail", "Explain the effect of a selected technique", "Consider a supported alternative interpretation"], "Analysis links evidence to meaning and handles uncertainty; unsupported certainty weakens the argument.", "Distinguish evidence from claims about unseen intentions."),
      match("Match each literary term with its best description.", [["Narrative perspective", "position from which a story is told"], ["Symbolism", "a concrete detail suggesting further meanings"], ["Juxtaposition", "placing contrasting details close together"]], "Perspective controls the telling, symbolism invites meanings beyond the literal and juxtaposition produces comparisons.", "Ask whether the term concerns telling, symbolic association or contrast."),
      order("Put these moves in a clear analytical paragraph sequence.", ["State a focused claim about the text", "Introduce a precise supporting detail", "Explain how that detail develops your claim"], "A clear claim followed by evidence and reasoning helps a reader follow the interpretation.", "Evidence becomes useful when its relevance is explained."),
      short("What figure of speech makes an explicit comparison with 'like' or 'as'?", "simile", "A simile explicitly compares two things, commonly using like or as; it differs from a direct metaphor.", "The comparison word is the key clue.", ["a simile"]),
      fillBlanks("Complete these basic terms used in close reading.", [["symbol", "A recurring object used to suggest ideas can be a:", "symbol"], ["narrator", "The voice presenting events is the:", "narrator"]], "A symbol can carry associations beyond an object's literal role, while a narrator is the telling voice.", "An object may suggest meaning and a voice tells events."),
      mcq("An imaginary story repeats the phrase 'still no reply'. Which is the strongest supported inference?", ["Repetition may create anxiety about silence", "The writer certainly hated letters", "Every reader will feel exactly the same emotion", "The story must be set in a particular century"], "Repetition may create anxiety about silence", "This claim links an observable repeated phrase to a possible effect without asserting unknowable facts.", "Prefer evidence-based, qualified interpretation.")
    ]
  },
  {
    id: "psychology-experiment-design", subject: "psychology",
    title: "Research Methods: Experiments and Validity", level: "Intermediate", minutes: 16,
    summary: "Identify variables, control confounds and distinguish consistency from accuracy.",
    objectives: ["Identify independent and dependent variables", "Explain random allocation and confounds", "Distinguish reliability, validity and ethical protection"],
    lesson: [
      "In a controlled experiment, the independent variable is deliberately changed and the dependent variable is measured as the outcome.",
      "A confounding variable changes alongside the independent variable and offers an alternative explanation for the result. Random allocation can reduce systematic participant differences between conditions.",
      "Reliability concerns consistency of measurement; validity concerns whether a measure or inference captures what it claims. Ethical practice includes informed consent, withdrawal rights and appropriate debriefing."
    ],
    workedExample: "To test whether noise affects recall, assign people randomly to quiet or noisy conditions, give both groups the same memory list and measure words recalled. Noise is the independent variable; recall count is the dependent variable.",
    examTip: "Operationalise variables in observable units and state how the design controls plausible alternative explanations.",
    commonMistake: "Claiming that correlation alone establishes that one variable causes another or confusing consistency with construct validity.",
    checkpoint: mcq("Why may researchers randomly allocate participants to experimental conditions?", ["To guarantee identical participants", "To reduce systematic differences between groups", "To eliminate all measurement error", "To ensure a large sample"], "To reduce systematic differences between groups", "Random allocation reduces selection bias between conditions in expectation, though it cannot guarantee perfect balance.", "Random allocation aims to prevent systematic group assignment."),
    practice: [
      numeric("Twelve participants are assigned equally to two groups. How many are in each group?", 6, "Twelve participants divided between two groups gives six per group.", "Divide the sample size by two."),
      trueFalse("A strong correlation, by itself, proves a causal relationship.", false, "Correlation can reflect confounding, reverse causation or chance rather than a demonstrated causal mechanism.", "An association alone cannot isolate what caused the outcome."),
      multi("Which are generally relevant protections for human research participants?", ["Informed consent where appropriate", "The right to withdraw", "Confidential handling of identifiable records", "A rule forbidding withdrawal after distress"], ["Informed consent where appropriate", "The right to withdraw", "Confidential handling of identifiable records"], "Ethical protections aim to respect autonomy and privacy; withdrawal must not be prohibited simply to retain data.", "Consider voluntariness and respectful data handling."),
      match("Match experiment terminology to its meaning.", [["Independent variable", "factor deliberately manipulated"], ["Dependent variable", "outcome that is measured"], ["Confounding variable", "alternative influence that varies with the manipulation"]], "The investigator changes the independent variable, measures the dependent variable and controls confounds.", "Distinguish the cause being tested from the measured outcome."),
      order("Place these experiment-planning steps in a reasonable order.", ["Define a testable hypothesis", "Specify how variables will be measured", "Collect observations using the agreed procedure"], "A hypothesis guides operational definitions, and the procedure then produces relevant observations.", "An experiment needs a plan before collecting measurements."),
      fillBlanks("Complete these two measurement-quality concepts.", [["consistency", "The consistency of repeated measures is:", "reliability"], ["accuracy", "Measuring the intended construct concerns:", "validity"]], "Reliability is consistency, while validity addresses whether the measure captures what it purports to measure.", "One refers to repeatability and the other to the intended concept."),
      mcq("In a double-blind drug trial, which parties are usually kept unaware of individual assignments during measurement?", ["Only the participant", "Only the statistician", "Participants and relevant assessing researchers", "Everyone including the randomisation system"], "Participants and relevant assessing researchers", "Blinding participants and assessors can reduce expectancy and observer bias; an independent allocation system still tracks assignment.", "Double refers to two types of people who could influence the result.")
    ]
  },
  {
    id: "river-storm-hydrographs", subject: "geography",
    title: "River Hydrographs and Flood Response", level: "Intermediate", minutes: 15,
    summary: "Interpret lag time, peak discharge and factors affecting river response to rainfall.",
    objectives: ["Locate peak rainfall and peak discharge", "Calculate lag time", "Explain runoff and infiltration effects"],
    lesson: [
      "A storm hydrograph shows how a river's discharge responds to rainfall through time. A rising limb records increasing discharge and a falling limb its decline.",
      "Lag time is the interval between peak rainfall and peak river discharge. It is not necessarily the duration from the start of the storm to the peak discharge.",
      "Surface permeability, saturation, relief and vegetation can affect infiltration and runoff. Urban impermeable surfaces often contribute to a quicker river response when other factors are comparable."
    ],
    workedExample: "If peak rain occurs at 10:00 and peak river discharge at 15:00, lag time is five hours. A steep rising limb means the measured discharge increases rapidly after rain.",
    examTip: "Read the time axes carefully, name both peaks and state whether you are discussing lag time or total storm duration.",
    commonMistake: "Subtracting storm start time from peak discharge rather than subtracting peak rainfall time from peak discharge time.",
    checkpoint: mcq("What does lag time in a storm hydrograph usually measure?", ["Time between peak rainfall and peak discharge", "Time before the first rain begins", "Total duration of the flood season", "Time for a river to reach the sea"], "Time between peak rainfall and peak discharge", "Lag time is measured between the rainfall peak and the subsequent river-discharge peak.", "Use the two peaks on the time axis."),
    practice: [
      numeric("Peak rainfall occurs at 10:00 and peak discharge at 15:00. How many hours is the lag time?", 5, "From 10:00 to 15:00 is five hours.", "Subtract the hour of maximum rainfall."),
      trueFalse("Replacing permeable ground with impermeable paving can shorten storm lag time, all else equal.", true, "Less infiltration and faster surface runoff can move storm water into channels sooner.", "Consider whether rainfall can soak into sealed surfaces."),
      multi("Which factors can influence the shape of a storm hydrograph?", ["Soil saturation before the storm", "Vegetation interception", "Catchment slope", "The spelling of the river's name"], ["Soil saturation before the storm", "Vegetation interception", "Catchment slope"], "Water storage, infiltration and travel speeds affect runoff pathways; a name does not.", "Focus on water movement, not labels."),
      match("Match these hydrograph terms to their meanings.", [["Rising limb", "discharge increasing"], ["Falling limb", "discharge declining"], ["Baseflow", "sustained contribution from groundwater"]], "A storm's response rises and falls, while baseflow commonly contributes water between rainfall events.", "Follow the curve before and after peak discharge."),
      order("Place a simplified storm response in time order.", ["Rain falls on the catchment", "Runoff and throughflow reach channels", "River discharge reaches its peak"], "Rainfall initiates pathways to the channel and discharge subsequently peaks.", "The river cannot respond before receiving water."),
      fillBlanks("Peak rainfall is at 14:00 and peak discharge is at 18:00.", [["hours", "Lag-time duration as a number:", "4"], ["units", "Time unit used in this calculation:", "hours"]], "18:00 minus 14:00 is a four-hour lag between rainfall and discharge peaks.", "Subtract the two clock times and name the unit."),
      mcq("Which feature most directly indicates a rapid rise in river discharge?", ["A steep rising limb", "A gentle falling limb", "A flat dry-weather line", "A distant coastline"], "A steep rising limb", "A steep slope on the discharge–time graph means discharge increases over a short interval.", "Rate of increase appears as a graph's slope.")
    ]
  },
  {
    id: "break-even-contribution", subject: "business-studies",
    title: "Contribution, Break-Even and Margin of Safety", level: "Intermediate", minutes: 16,
    summary: "Calculate unit contribution, break-even output and how far actual sales exceed that threshold.",
    objectives: ["Find contribution per unit", "Calculate break-even units from fixed costs", "Interpret the margin of safety"],
    lesson: [
      "Contribution per unit equals selling price minus variable cost per unit. Each unit's contribution first helps cover fixed costs.",
      "With positive unit contribution, break-even output in units is fixed costs divided by contribution per unit. Rounding up to a whole unit may be necessary if units cannot be split.",
      "Margin of safety in units equals actual or expected sales units minus break-even sales units. It can be negative when the business remains below break-even."
    ],
    workedExample: "If price is £15, variable cost £9 and fixed costs £1,200, contribution is £6 per unit. Break-even output is £1,200 ÷ £6 = 200 units.",
    examTip: "Use consistent units and distinguish sales revenue, contribution and profit; break-even is a volume, not a price.",
    commonMistake: "Dividing fixed costs by selling price instead of by contribution per unit, which overstates the money available to cover fixed costs.",
    checkpoint: mcq("Fixed costs are £1,000 and contribution is £5 per unit. What is break-even output?", ["100 units", "200 units", "500 units", "5,000 units"], "200 units", "Break-even units = fixed costs / unit contribution = 1,000/5 = 200.", "Divide fixed costs by contribution, not selling price."),
    practice: [
      numeric("Selling price is £15 and unit variable cost is £9. What is contribution per unit in pounds?", 6, "Contribution per unit = £15 − £9 = £6.", "Subtract variable cost from selling price."),
      trueFalse("With unchanged positive unit contribution, an increase in fixed costs increases break-even units.", true, "The firm must sell more units to cover a larger fixed-cost total at the same contribution per unit.", "Break-even uses fixed costs in its numerator."),
      multi("Which business statements are correct?", ["Unit contribution equals price minus unit variable cost", "Margin of safety can be expressed as units sold above break-even", "Fixed costs are assumed constant within the relevant range of a simple model", "Unit contribution always equals revenue minus all fixed costs"], ["Unit contribution equals price minus unit variable cost", "Margin of safety can be expressed as units sold above break-even", "Fixed costs are assumed constant within the relevant range of a simple model"], "Unit contribution excludes fixed costs, which are covered by cumulative contribution.", "Differentiate per-unit variable cost from total fixed cost."),
      match("Match a typical term to its example or definition.", [["Fixed cost", "monthly rent"], ["Variable cost", "raw material per unit"], ["Contribution per unit", "selling price less unit variable cost"]], "Fixed costs do not scale with each unit in the relevant range, unlike per-unit inputs; contribution is price less variable cost.", "Ask which costs change with units produced."),
      order("Put the break-even calculation steps in order.", ["Calculate the unit contribution", "Identify the total fixed cost", "Divide fixed cost by contribution per unit"], "Once unit contribution and fixed cost are known, their ratio gives break-even output.", "The division is the final step."),
      fillBlanks("Selling price £20, unit variable cost £12 and fixed costs £800.", [["contribution", "Contribution per unit in pounds:", "8"], ["breakeven", "Break-even volume in units:", "100"]], "Contribution is £20−£12 = £8 and break-even output is £800/£8 = 100 units.", "Find the contribution before the break-even volume."),
      mcq("A firm sells 500 units and breaks even at 400 units. What is its margin of safety?", ["100 units", "400 units", "500 units", "900 units"], "100 units", "Margin of safety is actual volume minus break-even volume = 500−400 = 100 units.", "Subtract the break-even threshold from actual sales.")
    ]
  }
];
