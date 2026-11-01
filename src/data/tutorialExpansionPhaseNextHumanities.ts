import type { Tutorial } from "./tutorials";
import { mcq, numeric, trueFalse, multi, order, match, fillBlanks, short } from "./tutorialQuestions";

/** Original formative study drafts, awaiting independent academic review. */
export const phaseNextHumanities: Tutorial[] = [
  {
    id: "ppf-capacity-and-choice", subject: "economics",
    title: "Production Frontiers: Capacity and Opportunity Cost", level: "Intermediate", minutes: 15,
    summary: "Reason about trade-offs, productive efficiency and shifts in productive capacity.",
    objectives: ["Define opportunity cost", "Interpret points on or within a PPF", "Describe how the productive frontier can shift"],
    lesson: [
      "Opportunity cost is the value of the next-best alternative forgone when a choice is made, rather than every alternative together.",
      "A production possibility frontier shows possible maximum combinations of two outputs given resources and technology. Points on the frontier are productively efficient under its assumptions; points inside indicate spare resources or inefficiency.",
      "An outward shift reflects increased productive capacity, such as more resources or better technology. A move along the frontier instead reallocates existing productive resources."
    ],
    workedExample: "Suppose available resources can produce either 40 bicycles or 20 tables at the extremes. Moving from 20 bicycles and 10 tables to 30 bicycles and 5 tables gains ten bicycles but forgoes five tables, assuming both points are feasible.",
    examTip: "Distinguish a movement along a frontier from a shift of the entire frontier, and identify the specific alternative forgone.",
    commonMistake: "Calling the money spent the opportunity cost in every case without considering the value of the next-best forgone use.",
    checkpoint: mcq("What does opportunity cost mean in an economic choice?", ["The value of the next-best alternative forgone", "The sum of all possible benefits", "Every item purchased", "A tax collected by government"], "The value of the next-best alternative forgone", "Opportunity cost focuses on the single next-best use given up by making a choice, not the price alone.", "Identify what you could otherwise have done."),
    practice: [
      trueFalse("A point inside a PPF can indicate unemployed resources or inefficient production.", true, "With fixed resources and technology, a point within the frontier may imply that production capacity is not fully used.", "The frontier itself represents maximum feasible combinations."),
      multi("Which factors may shift an economy's PPF outwards?", ["An improvement in productive technology", "A larger productive labour force", "More usable capital equipment", "Merely relabelling the horizontal axis"], ["An improvement in productive technology", "A larger productive labour force", "More usable capital equipment"], "Better technology or more productive inputs raise potential output. Renaming an axis does not create resources.", "Choose real changes to productive capacity."),
      match("Match a point's PPF location with its usual interpretation.", [["On the frontier", "productively efficient"], ["Inside the frontier", "currently underusing potential capacity"], ["Outside the frontier", "unattainable with existing resources"]], "The frontier separates currently feasible output from unattainable combinations under given assumptions.", "Think maximum, underused and beyond capacity."),
      order("Arrange steps for explaining an opportunity cost when output changes.", ["Identify the initial combination of outputs", "Identify the new combination after the decision", "Calculate the amount of the next-best alternative forgone"], "Opportunity cost is what is given up when reallocating resources from the original to the new production choice.", "Identify the two production points before computing a loss."),
      numeric("A choice gains 6 extra tables but sacrifices 12 chairs. How many chairs are forgone per additional table?", 2, "Twelve forgone chairs divided by six additional tables gives an opportunity cost of two chairs per table.", "Divide the amount sacrificed by the amount gained.")
    ]
  },
  {
    id: "unseen-poetry-voice-imagery", subject: "english-literature",
    title: "Unseen Poetry: Voice, Imagery and Tone", level: "Intermediate", minutes: 17,
    summary: "Read original short poetry closely and support interpretations with precise language.",
    objectives: ["Identify personification and imagery", "Distinguish speaker from author", "Explain how repetition and line breaks can affect tone"],
    lesson: [
      "When approaching an unseen poem, make an initial inference about situation and speaker, then return to specific words or structural choices that support it.",
      "Imagery can engage the senses, while personification gives an object or idea human qualities. Neither device has a single automatic meaning; a claim needs contextual evidence.",
      "The speaker is the voice inside the poem and is not necessarily the poet. Tone concerns the attitude conveyed by that voice, whereas a reader's mood or emotional response may differ."
    ],
    workedExample: "In the original lines 'The station clock held its breath / as the final train slipped away', the clock is personified. That image and the departure could suggest a moment of tension or loss, but other supported interpretations remain possible.",
    examTip: "Quote a brief precise detail from the supplied text and explain how it contributes to a defensible reading.",
    commonMistake: "Assuming that a poem's first-person speaker must be the real poet or that one image proves a single emotional response.",
    checkpoint: mcq("In 'The station clock held its breath', what is the clearest language technique?", ["Personification", "Onomatopoeia", "A literal scientific observation", "Alliteration only"], "Personification", "The inanimate clock is given the human action of holding its breath, inviting interpretation of tension or anticipation.", "Look for a human action assigned to an object."),
    practice: [
      trueFalse("The speaker of a poem must always be identical to its real author.", false, "A poem can use an invented speaker or persona. Identifying a first-person voice is not proof of autobiography.", "A voice inside a text may be fictional."),
      multi("Which moves strengthen analysis of unseen poetry?", ["Refer to a specific word or phrase", "Explore how an image supports a possible tone", "Consider a justified alternative reading", "Claim all readers must experience the same emotion"], ["Refer to a specific word or phrase", "Explore how an image supports a possible tone", "Consider a justified alternative reading"], "Evidence and qualified inference strengthen analysis; different readers may reach different supported interpretations.", "One option makes an unjustified universal claim."),
      match("Match poetic terminology to its most relevant meaning.", [["Personification", "giving human qualities to something non-human"], ["Enjambment", "continuing syntax beyond a line ending"], ["Speaker", "the voice presented within the poem"]], "Personification concerns human attributes, enjambment concerns line structure, and speaker refers to the textual voice.", "Think language image, line break and voice."),
      order("Order a sensible sequence for a close-reading paragraph.", ["Make a focused claim about the voice or tone", "Select a brief detail supporting the claim", "Explain how its wording or structure develops the effect"], "An interpretation becomes persuasive when the precise detail and reasoning are explicitly connected to it.", "A claim needs evidence and analysis."),
      short("What term describes the voice that speaks within a poem?", "speaker", "The speaker is the textual voice or persona, which need not be identical to the real-life poet.", "Do not automatically call the voice the author.", ["the speaker", "persona"])
    ]
  },
  {
    id: "psychology-memory-encoding-retrieval", subject: "psychology",
    title: "Memory: Encoding, Storage and Retrieval", level: "Foundation", minutes: 15,
    summary: "Distinguish stages of memory and recognise common explanations for forgetting.",
    objectives: ["Distinguish encoding from retrieval", "Identify examples of proactive and retroactive interference", "Explain why remembering is not always exact reproduction"],
    lesson: [
      "Encoding transforms encountered information into a form that can be represented in memory. Storage involves retaining that information over time.",
      "Retrieval makes stored information available for a task. A failure to recall immediately does not necessarily mean the information was never encoded.",
      "Proactive interference occurs when older learning disrupts new learning; retroactive interference occurs when newer learning disrupts recall of earlier learning. Memory reports can be reconstructive."
    ],
    workedExample: "A learner who keeps entering an old password after setting a new one illustrates proactive interference. Trouble recalling an old password because the new password comes to mind is a possible example of retroactive interference.",
    examTip: "Describe the direction of interference—old information affecting new learning or the reverse—before naming the effect.",
    commonMistake: "Treating encoding, storage and retrieval as three synonyms for remembering rather than distinct processes.",
    checkpoint: mcq("Which memory process makes previously stored information available when answering a question?", ["Encoding", "Retrieval", "Sampling", "Reinforcement"], "Retrieval", "Retrieval involves accessing information already represented in memory for use in a present task.", "Think of bringing information back to mind."),
    practice: [
      trueFalse("A failure to recall a fact on one occasion necessarily proves it was never encoded.", false, "Retrieval can fail because of absent cues, interference or other factors even when something was encoded.", "Recall depends on more than initial learning."),
      multi("Which statements about memory processes are reasonable?", ["Encoding concerns representing new information", "Retrieval concerns accessing stored information", "Storage concerns persistence over time", "One confident memory is guaranteed completely accurate"], ["Encoding concerns representing new information", "Retrieval concerns accessing stored information", "Storage concerns persistence over time"], "Encoding, storage and retrieval describe related processes. Subjective confidence alone does not guarantee accuracy.", "Distinguish a mental process from a claim of perfect accuracy."),
      match("Match each term to its example.", [["Encoding", "forming a memory of a new number"], ["Storage", "retaining a word list overnight"], ["Retrieval", "recalling the list in class"]], "Encountering and representing information is encoding; preserving it is storage; using it again is retrieval.", "Track when the information is first learned and later recalled."),
      order("Arrange the simplified stages involved in later recalling new information.", ["Encode the new information", "Retain some representation over time", "Retrieve it when prompted"], "This common explanatory sequence separates initial representation, persistence and later access.", "Start with learning before later remembering."),
      fillBlanks("Complete these two interference definitions.", [["proactive", "Old learning disrupting new learning is ___ interference:", "proactive"], ["retroactive", "New learning disrupting older recall is ___ interference:", "retroactive"]], "Proactive interference runs from old to new, whereas retroactive interference runs from new to old.", "Remember which learning happened first.")
    ]
  },
  {
    id: "tectonic-boundaries-risk", subject: "geography",
    title: "Plate Boundaries and Hazard Risk", level: "Intermediate", minutes: 16,
    summary: "Interpret divergent, convergent and transform boundaries and why hazards become disasters.",
    objectives: ["Classify major plate-boundary movements", "Link subduction to earthquake and volcanic hazards", "Distinguish physical hazard from vulnerability"],
    lesson: [
      "Divergent plate boundaries involve plates moving apart and can be associated with new crust formation and volcanic activity, including mid-ocean ridges.",
      "Convergent boundaries involve plates moving together. In some convergent settings an oceanic plate subducts beneath another plate and may be associated with earthquakes and volcanic arcs.",
      "Transform boundaries involve plates sliding horizontally past one another and commonly produce earthquakes. Disaster risk also depends on exposure, vulnerability and preparedness, not solely physical magnitude."
    ],
    workedExample: "At an oceanic–continental convergent boundary, a denser oceanic slab may subduct beneath continental crust. Earthquake shaking and, in some settings, volcanic activity create hazards whose effects depend on buildings and emergency planning.",
    examTip: "Name the boundary type, describe relative plate movement and then specify hazards without claiming every boundary behaves identically.",
    commonMistake: "Assuming every earthquake triggers a volcanic eruption or that a larger hazard automatically causes the greatest loss of life.",
    checkpoint: mcq("At a transform boundary, how do tectonic plates mainly move relative to one another?", ["Move apart", "Slide past one another", "Always merge into one plate", "Stop moving entirely"], "Slide past one another", "Transform boundaries accommodate mainly horizontal relative plate movement and frequently generate earthquakes.", "The key motion is sideways."),
    practice: [
      trueFalse("The same earthquake hazard can produce different impacts in different communities.", true, "Exposure, building resilience, population density and preparedness influence consequences beyond physical magnitude.", "Think about vulnerability and preparedness."),
      multi("Which statements about plate boundaries are supported?", ["Divergent plates separate", "Transform boundaries often cause earthquakes", "Some subduction zones produce volcanic arcs", "Every transform boundary produces a volcanic arc"], ["Divergent plates separate", "Transform boundaries often cause earthquakes", "Some subduction zones produce volcanic arcs"], "Separation, transform earthquakes and subduction-related volcanism are typical. Transform motion does not necessarily generate volcanism.", "One claim incorrectly says every boundary makes a volcanic arc."),
      match("Match the plate-boundary type to its movement.", [["Divergent", "move apart"], ["Convergent", "move together"], ["Transform", "slide sideways past"]], "The three boundary types describe relative motions: away, towards and lateral sliding.", "Match the words diverge, converge and transform to the arrows."),
      order("Order these steps in a simplified disaster-risk assessment.", ["Identify the physical hazard", "Assess exposed people and structures", "Consider vulnerability and local preparedness"], "Risk assessment considers what can happen, who or what is exposed, and how resilient they are.", "Physical shaking alone does not determine all impacts."),
      fillBlanks("Name the movement at two boundaries.", [["divergent", "Plates moving apart meet at a ___ boundary:", "divergent"], ["transform", "Plates sliding past meet at a ___ boundary:", "transform"]], "Divergent describes separating plates; transform describes plates slipping laterally past one another.", "One term means separating and the other sideways motion.")
    ]
  },
  {
    id: "cash-flow-forecasting", subject: "business-studies",
    title: "Cash Flow Forecasts and Liquidity", level: "Intermediate", minutes: 16,
    summary: "Calculate net cash flow and closing balance, and distinguish cash from profit.",
    objectives: ["Compute net cash flow from receipts and payments", "Calculate a closing cash balance", "Explain why a profitable business can face liquidity problems"],
    lesson: [
      "Cash inflows are money received during a period, and outflows are money paid. Net cash flow is total inflows minus total outflows, which can be negative.",
      "Closing cash balance equals opening cash balance plus net cash flow. That closing balance becomes the following period's opening balance in a basic forecast.",
      "Cash and accounting profit are not interchangeable. Credit sales, timing of supplier payments and investment expenditure can make cash availability differ from reported profit."
    ],
    workedExample: "With £1,000 opening cash, £2,500 of receipts and £1,800 of payments, net cash flow is £700 and closing cash balance is £1,700. A sale on credit may contribute revenue before cash arrives.",
    examTip: "Make signs explicit when subtracting payments, and carry the correct closing cash balance into the next period.",
    commonMistake: "Assuming a positive accounting profit always means adequate cash is immediately available for wages and bills.",
    checkpoint: mcq("Inflows are £900 and outflows £650. What is net cash flow?", ["£250", "£650", "£900", "£1,550"], "£250", "Net cash flow is inflows minus outflows, so £900 − £650 = £250 for the period.", "Subtract cash paid from cash received."),
    practice: [
      numeric("Opening cash is £500 and net cash flow is −£120. What is closing cash in pounds?", 380, "Closing cash = opening cash + net movement = £500 − £120 = £380.", "Apply the negative net movement to the opening balance."),
      trueFalse("A profitable company can still have difficulty paying a bill if customers pay late.", true, "Credit revenue can be recorded before cash is collected, so profit does not guarantee immediate liquidity.", "Revenue and receipts may occur on different dates."),
      multi("Which items are typically cash outflows when paid?", ["Staff wages", "Supplier invoices settled", "Rent paid", "An unpaid customer invoice received"], ["Staff wages", "Supplier invoices settled", "Rent paid"], "Paying wages, suppliers and rent uses cash. An unpaid customer invoice is not yet a cash receipt.", "Distinguish payment from an invoice."),
      match("Match cash-flow terms to their meanings.", [["Opening balance", "cash at the start of a period"], ["Net cash flow", "receipts minus payments"], ["Closing balance", "cash after that period's movement"]], "Opening cash plus the net cash movement yields the closing cash balance.", "The terms indicate before, movement and after."),
      fillBlanks("A period begins with £300, has £800 inflows and £950 outflows.", [["net", "Net cash flow in pounds, including its sign:", "-150"], ["closing", "Closing balance in pounds:", "150"]], "Net cash flow is £800 − £950 = −£150. The closing balance is £300 − £150 = £150.", "Calculate the negative net movement first.")
    ]
  },
];
