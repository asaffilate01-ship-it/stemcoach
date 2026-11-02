import type { AuthorLesson } from "./tutorialExpansionLargeAuthoring";
import { authorTenCheckLesson } from "./tutorialExpansionLargeAuthoring";

/** Original humanities formative content; not third-party exam questions. */
const specs: AuthorLesson[] = [
  {
    id: "inflation-real-income-index", subject: "economics", title: "Inflation, Price Indices and Real Income", level: "Intermediate",
    summary: "Use inflation and price indices to distinguish money values from purchasing power.",
    objectives: ["Calculate simple index changes", "Distinguish nominal and real changes", "Identify effects of inflation"],
    lesson: [
      "Inflation is a sustained increase in the general price level; a fall in the inflation rate does not itself mean prices are falling.",
      "A price index compares a basket of prices with a base, commonly assigned 100. An index of 110 indicates a 10% rise from that base.",
      "Real income adjusts nominal income for changes in the price level. If wages rise less quickly than prices, purchasing power may fall."
    ],
    workedExample: "An index rises from 120 to 126. Inflation over that interval is (126−120)/120 × 100 = 5%. A wage rise of 3% in that interval would not fully offset this general price rise.",
    examTip: "Always divide the index change by the starting index, not automatically by 100.",
    commonMistake: "Confusing disinflation (slower inflation) with deflation (falling general prices).",
    checks: [
      ["If inflation falls from 8% to 4%, what does that usually indicate?", ["Prices have halved","Prices now fall 4%","Prices rise more slowly","All goods cost less"],2,"Positive inflation of 4% still indicates rising general prices, just more slowly than at 8%."],
      ["A price index increases from 100 to 115. What is the change from its base?", ["15% increase","115% increase","15% decrease","1.15% increase"],0,"An index of 115 against a base of 100 is 15 points, or 15%, higher."],
      ["Which term describes income adjusted for purchasing power?", ["Nominal income","Gross output","Interest income","Real income"],3,"Real income accounts for movements in prices instead of considering only the stated currency amount."],
      ["Prices rise by 6% while wages rise 2%. What is the likely direction of real wages?", ["They increase faster","They decline","They remain exactly unchanged","They automatically double"],1,"If the general price level increases faster than nominal wages, the wage buys less on average."],
      ["Which situation describes deflation?", ["A general fall in prices","A slower increase in prices","Higher inflation than last year","No price comparisons"],0,"Deflation means a decline in the general price level, not merely a declining rate of inflation."],
      ["An index moves from 200 to 220. What is the percentage increase?", ["20%","220%","10%","2%"],2,"Change divided by starting index is 20 ÷ 200 = 0.10, equivalent to 10%."],
      ["Which policy objective relates directly to inflation?", ["Preserving yesterday's quantity sold","Fixing every firm's wage","Eliminating competition","Maintaining price stability"],3,"Maintaining price stability usually means limiting large or unpredictable increases in the general price level."],
      ["What is a limitation of a representative price basket?", ["It records no prices","Different households may buy different goods","It cannot compare two periods","It always equals household income"],1,"A typical price basket may differ from an individual household's actual spending pattern."]
    ],
    truth: ["Disinflation always means the general price level is falling.", false, "Disinflation means the rate of price increase is slowing; prices may continue to rise."],
    recall: ["What is the economic term for income after accounting for price-level changes?", "real income", "Real income measures money income in purchasing-power terms.", ["real wages when referring to wages"]]
  },
  {
    id: "dramatic-irony-stagecraft", subject: "english-literature", title: "Dramatic Irony, Stagecraft and Audience Response", level: "Intermediate",
    summary: "Analyse how dialogue, stage directions and audience knowledge shape dramatic meaning.",
    objectives: ["Recognise dramatic irony", "Analyse stage directions", "Develop evidence-led interpretations"],
    lesson: [
      "Dramatic irony occurs when an audience knows something a character does not, creating effects such as tension or sympathy.",
      "Stage directions may establish movement, pace, silence or lighting; discuss how these could be interpreted in performance.",
      "A strong analysis links a precise dramatic choice to a plausible audience response while acknowledging context and alternative readings."
    ],
    workedExample: "Suppose a character promises 'I trust the messenger' after the audience has seen the messenger hide a letter. The knowledge gap may make the line tense rather than reassuring.",
    examTip: "Describe the precise dramatic technique and explain an effect; avoid claiming all audiences must react identically.",
    commonMistake: "Calling every surprising event dramatic irony even where the audience and character have the same information.",
    checks: [
      ["What is essential for dramatic irony?", ["A happy ending","Audience knows more than a character","A rhyming couplet","Two scenes happening simultaneously"],1,"Dramatic irony depends on a difference between audience knowledge and the character's understanding."],
      ["A direction reads '[long silence]'. What can a performer communicate?", ["Only a change of setting","A new narrator","A definite plot resolution","Hesitation or tension"],3,"A sustained pause can create discomfort or suggest an emotion without spoken dialogue."],
      ["Which claim is strongest when analysing theatre?", ["The lighting may make the room feel threatening","Every audience feels exactly the same","All dialogue is spoken ironically","The playwright cannot shape timing"],0,"A cautious, evidence-led explanation links the stagecraft to a possible audience response."],
      ["Which feature is an example of stagecraft?", ["A table of contents","An author biography","Lighting change during a scene","A chapter page number"],2,"Lighting is a performance choice that can frame characters, space and audience attention."],
      ["A character says 'Nothing can go wrong' after the audience sees a trap. What effect is plausible?", ["There can be no irony","The line gains tension through audience knowledge","The audience loses all information","The character becomes omniscient"],1,"The audience anticipates risk while the character believes everything is safe, creating dramatic irony."],
      ["What should a close analysis include?", ["An observation supported by a specific line or direction","Only a list of character names","A summary without explanation","A claim about universal reactions"],0,"Quoting or precisely referring to the text supports the interpretation that follows."],
      ["Why might a playwright repeat a pause?", ["To change the publishing year","To guarantee a comic ending","To remove meaning from speech","To establish an uneasy rhythm"],3,"Repeated pauses can affect pacing and suggest unspoken conflict or uncertainty."],
      ["Which phrase appropriately allows interpretation?", ["It proves every reader is afraid","No alternative is possible","This may suggest the character is concealing fear","The text has no performance possibilities"],2,"Literary analysis benefits from calibrated language that allows for alternative performance choices."]
    ],
    truth: ["Dramatic irony requires the character to know precisely what the audience knows.", false, "Dramatic irony instead depends on a gap between what the audience and character know."],
    recall: ["What term describes a situation where an audience knows more than a character?", "dramatic irony", "Dramatic irony is defined by the audience's privileged knowledge relative to a character.", ["dramatic-irony"]]
  },
  {
    id: "experiment-design-controls", subject: "psychology", title: "Psychological Experiments: Variables and Controls", level: "Intermediate",
    summary: "Identify independent and dependent variables, confounds and simple ways to improve validity.",
    objectives: ["Define independent and dependent variables", "Recognise confounding factors", "Propose feasible controls"],
    lesson: [
      "The independent variable is manipulated by a researcher; the dependent variable is measured as an outcome.",
      "A confounding variable offers another explanation for a result because it changes systematically with the independent variable.",
      "Random allocation, standardised instructions and counterbalancing can address specific design problems, but no single technique removes every source of bias."
    ],
    workedExample: "If participants study with or without background music and then take the same memory test, music condition is the independent variable and recall score is the dependent variable.",
    examTip: "Operationalise both variables clearly enough that someone could repeat the procedure.",
    commonMistake: "Treating any uncontrolled variable as a demonstrated confound without showing how it varies across conditions.",
    checks: [
      ["In a study changing room lighting and measuring recall, what is the independent variable?", ["Recall score","Room lighting","Participant age","Answer sheet size"],1,"The researcher deliberately changes lighting; the recall score is the measured dependent variable."],
      ["What is the dependent variable in a study measuring reaction time after caffeine?", ["Caffeine dose","Testing room","Instruction wording","Reaction time"],3,"Reaction time is the measured outcome in this experimental comparison."],
      ["Which procedure helps limit differences in instructions across participants?", ["Using a standard script","Giving each group different directions","Allowing random tasks","Never recording procedures"],0,"Standardised instructions make a procedural factor more consistent between groups."],
      ["Why might order effects occur in repeated-measures studies?", ["The sample is always too large","There is no independent variable","Practice or fatigue can affect later trials","The same researcher cannot test twice"],2,"A person may improve through practice or worsen through fatigue on later conditions."],
      ["What can counterbalancing help address?", ["Missing consent","Order effects","Any sampling bias","All confounding variables"],1,"Changing the sequence of conditions across participants can reduce systematic order effects."],
      ["What does random allocation assign?", ["Participants to conditions by chance","Marks to correct answers","The dependent variable's units","The research question after testing"],0,"Random allocation places participants into study conditions using a chance procedure."],
      ["What is operationalisation?", ["Choosing an abstract label only","Guessing likely findings","Writing an opinion","Defining exactly how a variable is manipulated or measured"],3,"Operational definitions make variables measurable and allow another researcher to understand the procedure."],
      ["A confound differs between conditions and affects outcome. What risk does it pose?", ["It increases sample diversity only","It guarantees valid conclusions","It offers an alternative cause for the result","It changes consent automatically"],2,"A confounding factor is a plausible rival explanation, making a causal inference less secure."]
    ],
    truth: ["A dependent variable is the outcome that the researcher measures.", true, "The dependent variable is operationally measured to assess the effect associated with the independent variable."],
    recall: ["What is the name of a variable deliberately changed by an experimenter?", "independent variable", "The researcher manipulates the independent variable while measuring a dependent outcome.", ["iv"]]
  },
  {
    id: "urbanisation-push-pull", subject: "geography", title: "Urbanisation, Migration and Push–Pull Factors", level: "Intermediate",
    summary: "Explain how migration and natural change influence the growth of urban settlements.",
    objectives: ["Distinguish urbanisation from urban growth", "Classify push and pull factors", "Assess benefits and pressures of urban growth"],
    lesson: [
      "Urbanisation is an increasing share of a population living in urban areas; urban population growth can also occur without a rising share.",
      "Push factors encourage people to leave an origin, while pull factors attract them to a destination; motives may interact.",
      "Urban growth can expand access to services and jobs but may create housing, infrastructure and environmental pressures if poorly managed."
    ],
    workedExample: "A worker may leave an area with limited jobs (push) and choose a city offering training and employment (pull). These are distinct but related reasons for one move.",
    examTip: "Specify whose perspective and which location your push–pull factor describes.",
    commonMistake: "Assuming that any increase in a city's population automatically proves the national urban percentage is rising.",
    checks: [
      ["What does urbanisation most precisely describe?", ["All cities shrinking","A rising proportion living in urban areas","Any rise in national birth rate","Only rural population growth"],1,"Urbanisation refers to growth in the urban share of the total population."],
      ["Which is usually a push factor from a place of origin?", ["A new job in the destination","Better transport in the destination","A larger destination university","Loss of local employment"],3,"Loss of work at the starting location may encourage residents to move elsewhere."],
      ["Which is a pull factor?", ["Access to jobs in a destination","Drought in the origin","Conflict in the origin","Crop failure at home"],0,"A job opportunity at the destination attracts a potential migrant toward that place."],
      ["Can an urban population increase without a rise in the urban share?", ["Never","Only in capital cities","Yes, if the total population grows comparably or faster","Only after a census correction"],2,"An urban headcount can rise while its percentage of the entire population remains steady or falls."],
      ["Which challenge may accompany rapid urban growth?", ["Instant elimination of unemployment","Housing and transport pressure","Guaranteed equal access to water","No change in waste production"],1,"Housing supply and urban infrastructure may struggle to keep pace with rapid growth."],
      ["Which could be a benefit of well-managed urban growth?", ["Wider access to healthcare and services","Automatic absence of pollution","No need for transport networks","An end to all poverty"],0,"Cities can support dense service networks and wider opportunities when resources are managed effectively."],
      ["How does natural increase affect an urban population?", ["It means only immigration","It means more emigrants than immigrants","It always reduces urban numbers","Births exceeding deaths can raise population"],3,"Natural increase occurs when births outnumber deaths and can add to a city's residents."],
      ["Which evidence would best support a claim about urbanisation?", ["A photograph of one street","One person's travel story alone","Urban share of population over time","The number of railway stations only"],2,"A time series of the urban share directly measures whether urbanisation is occurring."]
    ],
    truth: ["A rise in the number of people living in cities always means the urban share has increased.", false, "The urban population may grow while the country's total population grows as fast or faster."],
    recall: ["What term describes a factor that attracts migrants to a destination?", "pull factor", "A pull factor is a perceived benefit associated with the place people may move to.", ["a pull factor"]]
  },
  {
    id: "contribution-profit-margin", subject: "business-studies", title: "Contribution, Costs and Profit Decisions", level: "Intermediate",
    summary: "Use contribution per unit to reason about fixed costs and simple break-even decisions.",
    objectives: ["Calculate unit contribution", "Classify fixed and variable costs", "Interpret break-even output"],
    lesson: [
      "Contribution per unit = selling price per unit − variable cost per unit. Contribution pays towards fixed costs and then profit.",
      "At a constant positive unit contribution, break-even units = fixed costs ÷ contribution per unit, rounded up to a whole sale where necessary.",
      "Profit = total contribution − fixed costs in this simplified linear cost model. A positive contribution does not alone guarantee overall profit."
    ],
    workedExample: "A product sells for £12 with variable cost £7. Unit contribution is £5. With fixed costs of £200, break-even is 200/5 = 40 units, assuming the model's costs and prices remain constant.",
    examTip: "Keep variable and fixed costs distinct, and round break-even units up when units are indivisible.",
    commonMistake: "Calling contribution the same as net profit, even though fixed costs remain to be covered.",
    checks: [
      ["A product sells for £20 with £12 variable cost. What is contribution per unit?", ["£32","£12","£8","£20"],2,"Contribution is price minus variable cost, so £20 − £12 gives £8 per unit."],
      ["Which is most often a fixed cost over a short relevant period?", ["Packaging per item","Monthly premises rent","Raw materials per order","Card fee per sale"],1,"Rent is often payable regardless of how many units are sold within the period."],
      ["What is the break-even output with £120 fixed costs and £6 contribution per unit?", ["20 units","6 units","720 units","126 units"],0,"Divide fixed costs by the £6 per-unit contribution: 120 ÷ 6 = 20 units."],
      ["A firm makes 30 units of £4 contribution each, with £100 fixed costs. What profit follows?", ["£120","£30","£100","£20"],3,"Total contribution is 30 × 4 = £120; subtract £100 fixed costs for £20 profit."],
      ["Which factor usually increases contribution per unit if other things stay constant?", ["Higher variable cost","Lower selling price","Higher selling price","Higher fixed rent"],2,"Increasing unit price while holding unit variable cost constant increases the difference between them."],
      ["What does a positive contribution per unit guarantee?", ["Contribution toward fixed costs, not necessarily profit","An immediate net profit","No variable costs","No need for sales"],0,"Contribution is a step toward covering fixed costs; overall profit depends on volume and fixed costs."],
      ["If fixed costs are £105 and contribution is £10 per unit, what whole-unit break-even output is needed?", ["10 units","11 units","105 units","1 unit"],1,"10.5 units are needed mathematically, so at least 11 whole units must be sold to cover fixed costs."],
      ["Which formula represents total contribution?", ["Variable cost ÷ price","Fixed cost + selling price","Price × fixed cost","Unit contribution × units sold"],3,"Contribution accumulates with every unit sold, assuming unit contribution is unchanged."]
    ],
    truth: ["If contribution per unit is positive, a business must already be profitable.", false, "A business may still make a loss when its total contribution is less than fixed costs."],
    recall: ["What is the term for selling price per unit minus variable cost per unit?", "contribution", "Contribution per unit equals unit selling price less the unit variable cost.", ["unit contribution","contribution per unit"]]
  }
];
export const largeHumanitiesExpansion = specs.map(authorTenCheckLesson);
