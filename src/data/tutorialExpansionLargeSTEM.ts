import type { AuthorLesson } from "./tutorialExpansionLargeAuthoring";
import { authorTenCheckLesson } from "./tutorialExpansionLargeAuthoring";

/** Original practice content; independent examination-board verification is still required. */
const specs: AuthorLesson[] = [
  {
    id: "compound-growth-percentages", subject: "mathematics", title: "Compound Growth and Repeated Percentage Change", level: "Intermediate",
    summary: "Use multipliers to model successive percentage changes rather than adding percentages.",
    objectives: ["Convert percentage changes to multipliers", "Use repeated multipliers", "Explain the difference between initial and final values"],
    lesson: [
      "An increase by p% uses multiplier 1 + p/100; a decrease uses 1 − p/100.",
      "Repeated growth over n equal periods follows final = initial × multiplier^n. The percentage acts on the new amount each time.",
      "A rise and fall of the same percentage usually do not cancel because their bases differ."
    ],
    workedExample: "£200 grows by 10% in each of two years. Its value becomes £200 × 1.10² = £242, not £240; year two earns 10% of £220.",
    examTip: "Write your multiplier and the number of periods before entering the calculation.",
    commonMistake: "Adding two 10% increases to make 20% overlooks the second year's growth on the new value.",
    checks: [
      ["What is the multiplier for a 12% increase?", ["1.12","0.88","12","0.12"],0,"Adding 12% means keeping 100% plus 12%, giving 112% of the starting value, or 1.12."],
      ["What multiplier represents a 15% decrease?", ["1.15","0.15","0.85","0.75"],2,"After losing 15%, 85% of the original remains. Convert 85% to the decimal 0.85."],
      ["A £100 account grows by 10% twice. What is the final balance?", ["£120","£121","£110","£122"],1,"The first year gives £110 and the second gives £121 because 10% is applied to £110."],
      ["Which expression represents 5% growth over three equal years?", ["1.05 × 3","0.95³","1.05³","1 + 0.05³"],2,"A 5% growth multiplier is 1.05; applying it three times means multiplying by 1.05 cubed."],
      ["A price rises 20% then falls 20%. How does it compare with the start?", ["It is unchanged","It is 4% lower","It is 4% higher","It is 40% lower"],1,"Multipliers 1.20 and 0.80 give 0.96, leaving the price at 96% of the starting amount."],
      ["What is the value of £80 after one 25% increase?", ["£85","£95","£100","£105"],2,"One quarter of £80 is £20; add that to £80 to obtain £100."],
      ["How many percentage points separate 40% from 55%?", ["15 percentage points","37.5 percentage points","95 percentage points","5 percentage points"],0,"Percentage points are the arithmetic difference between two percentages, so 55 minus 40 equals 15."],
      ["A £500 amount is multiplied by 0.9 each period. What happens?", ["It grows 90%","It falls 90%","It grows 10%","It falls 10%"],3,"Multiplying by 0.9 retains 90% of the previous amount, a 10% reduction per period."]
    ],
    truth: ["Two successive increases of 10% are exactly a 20% increase overall.", false, "They amount to 1.10² = 1.21, which is a 21% overall increase."],
    recall: ["What decimal multiplier represents a 30% decrease?", "0.7", "Retaining 70% after a 30% reduction gives the decimal multiplier 0.7.", ["0.70"]]
  },
  {
    id: "work-energy-power-calculations", subject: "physics", title: "Work, Energy Transfer and Power", level: "Intermediate",
    summary: "Distinguish energy transferred from the rate of transfer using joules and watts.",
    objectives: ["Calculate mechanical work in simple aligned-force problems", "Use power = energy/time", "Explain energy versus power"],
    lesson: [
      "For a constant force parallel to motion, work done = force × displacement (W = Fs), measured in joules.",
      "Power is the rate of energy transfer, P = E/t, measured in watts (joules per second).",
      "A larger power rating means faster energy transfer, not necessarily more total energy without considering time."
    ],
    workedExample: "A 20 N force moves a box 3 m along the force direction, transferring 60 J. If this takes 5 seconds, average power is 60/5 = 12 W.",
    examTip: "Identify whether the question asks for energy transferred (J) or its rate (W).",
    commonMistake: "Using a force perpendicular to displacement as if it performed Fs work along the movement.",
    checks: [
      ["What work is done by 10 N acting parallel through 4 m?", ["2.5 J","14 J","40 J","400 J"],2,"The constant force is aligned with the four-metre displacement, so work is 10 × 4 = 40 J."],
      ["A device transfers 120 J in 6 s. What is its average power?", ["20 W","720 W","0.05 W","114 W"],0,"Average power equals energy transferred divided by elapsed time: 120 ÷ 6 = 20 watts."],
      ["What is the SI unit of power?", ["joule","watt","newton","metre"],1,"One watt represents one joule of energy transferred per second."],
      ["Which quantity is measured in joules?", ["Power","Acceleration","Frequency","Work done"],3,"Work is an energy transfer and is measured in joules; power is measured in watts."],
      ["A 60 W lamp operates for 10 s. What energy does it transfer?", ["6 J","600 J","70 J","6000 J"],1,"Using E = Pt, energy transferred is 60 × 10 = 600 joules."],
      ["A constant 8 N force moves an object 0 m. What work does it do along that displacement?", ["0 J","8 J","64 J","1 J"],0,"The displacement is zero, so work along the movement equals F × 0 = 0 joules."],
      ["Two machines each transfer 300 J, one in 3 s and one in 6 s. Which has higher average power?", ["The 6 s machine","Both have the same power","The 3 s machine","Neither transfers energy"],2,"For the same energy, a shorter time produces higher power: 100 W compared with 50 W."],
      ["A 5 W motor runs for 4 seconds. How many joules are transferred?", ["1.25 J","9 J","45 J","20 J"],3,"Energy equals power times time, so 5 joules per second for 4 seconds gives 20 joules."]
    ],
    truth: ["A watt is equivalent to one joule per second.", true, "Power measures energy transferred each second, so one watt equals one J/s."],
    recall: ["What is the SI unit of energy transferred?", "joule", "The joule (symbol J) is the SI energy unit, including mechanical work.", ["joules","j"]]
  },
  {
    id: "acid-base-indicators", subject: "chemistry", title: "Acids, Bases, pH and Neutralisation", level: "Foundation",
    summary: "Interpret pH and indicators, and describe acid–base neutralisation using suitable examples.",
    objectives: ["Classify acidic and alkaline solutions", "Recognise neutralisation products", "Use indicator evidence carefully"],
    lesson: [
      "At room temperature, pH 7 is neutral; values below 7 are acidic and values above 7 are alkaline on the conventional aqueous scale.",
      "An acid reacts with a suitable base to form a salt; water also forms in many neutralisations, for example acid + metal hydroxide.",
      "Universal indicator gives an approximate pH by colour comparison. Colour alone does not reveal a precise concentration."
    ],
    workedExample: "Hydrochloric acid + sodium hydroxide → sodium chloride + water. Equal reacting amounts of this strong acid and strong alkali can yield an approximately neutral solution.",
    examTip: "Distinguish pH, concentration and acid strength; they describe different features.",
    commonMistake: "Assuming every base dissolves in water: a soluble base is an alkali, but some bases are insoluble.",
    checks: [
      ["Which pH value is acidic on the conventional aqueous scale?", ["9","12","7","3"],3,"A solution with pH below 7 is acidic; pH 3 is in the acidic range."],
      ["Which pH is neutral at roughly room temperature?", ["7","1","4","14"],0,"Neutral water is assigned approximately pH 7 at room temperature."],
      ["What is produced when hydrochloric acid reacts fully with sodium hydroxide?", ["Hydrogen and oxygen","Sodium chloride and water","Sodium and hydrogen","Chlorine and water"],1,"This is an acid–metal-hydroxide neutralisation, yielding the salt sodium chloride and water."],
      ["Which substance is an alkali when dissolved in water?", ["Sand","Copper metal","Sodium hydroxide","Carbon dioxide"],2,"Sodium hydroxide is a soluble base that releases hydroxide ions in aqueous solution."],
      ["What does universal indicator mainly estimate?", ["Mass of solute","Exact acid concentration","Melting point","Solution pH"],3,"Its colour is compared with a chart to estimate pH, not a precise molar concentration."],
      ["A solution at pH 11 is best described as what?", ["Alkaline","Acidic","Neutral","Pure water"],0,"Eleven is above neutral pH 7 and therefore lies on the alkaline side of the scale."],
      ["Which pair could be used for a neutralisation reaction?", ["Sand and salt","Sulfuric acid and potassium hydroxide","Copper and plastic","Oxygen and nitrogen"],1,"An acid such as sulfuric acid can react with potassium hydroxide, which is a base, to form a salt and water."],
      ["Which statement best distinguishes bases and alkalis?", ["All bases are acids","Alkalis have pH below 7","An alkali is a soluble base","No alkali is a base"],2,"Alkalis are bases that dissolve in water; not all bases are sufficiently soluble to be alkalis."]
    ],
    truth: ["Every base is necessarily soluble in water.", false, "A soluble base is called an alkali, but many bases are insoluble in water."],
    recall: ["What is the common name for a base soluble in water?", "alkali", "A soluble base is called an alkali; the terms should not be used interchangeably for insoluble bases.", ["an alkali"]]
  },
  {
    id: "ecosystem-food-webs", subject: "biology", title: "Ecosystems, Food Webs and Energy Transfer", level: "Intermediate",
    summary: "Explain energy flows through trophic levels and the effect of population changes.",
    objectives: ["Read food-chain arrow direction", "Explain energy losses between levels", "Predict changes in food webs"],
    lesson: [
      "Food-chain arrows show the direction of energy transfer, usually from eaten organism to consumer.",
      "Producers often obtain energy from sunlight, while consumers obtain chemical energy by eating other organisms.",
      "Not all energy transfers to the next trophic level: respiration, movement, heat and waste account for losses."
    ],
    workedExample: "Grass → rabbit → fox shows energy passing from a producer to a primary consumer and then a secondary consumer. A decrease in rabbits could reduce the food available to foxes.",
    examTip: "Say that energy is transferred or dissipated, not created or destroyed in a food chain.",
    commonMistake: "Reversing food-chain arrows so they point toward the organism that is eaten.",
    checks: [
      ["In grass → rabbit → fox, which organism is the producer?", ["Rabbit","Fox","Grass","All three"],2,"Grass makes biomass using light energy, making it the producer at the start of this chain."],
      ["What do food-chain arrows indicate?", ["Direction of energy transfer","Organism size","Direction of movement","Age of organisms"],0,"The arrow points from the consumed organism toward its consumer, tracing energy transfer."],
      ["Which is a primary consumer in algae → snail → fish?", ["Algae","Fish","Neither","Snail"],3,"The snail eats the producer algae, so it occupies the first consumer level."],
      ["Why is less energy generally available at higher trophic levels?", ["Energy disappears entirely","Energy is transferred in respiration, movement and waste","Producers eat consumers","Heat flows backwards"],1,"Organisms use energy for life processes and lose some as heat or waste, reducing transfer to the next level."],
      ["Which change could reduce a predator's available food?", ["More rainfall every year","Higher plant growth always","A decline in its main prey","A change in daylight length alone"],2,"If a predator depends heavily on one prey species, a decline in that prey can reduce food availability."],
      ["Which organism is typically the source of energy entering a grazing food chain?", ["A green plant","A carnivore","A decomposer only","A top predator"],0,"Photosynthetic plants capture light energy which then supports grazing consumers."],
      ["What role do decomposers play in ecosystems?", ["They manufacture sunlight","They stop all nutrient cycles","They always eat living herbivores","They break down dead matter and recycle nutrients"],3,"Decomposers process dead organic matter and release nutrients that can be reused by producers."],
      ["Which statement about interconnected food chains is correct?", ["They never share a species","They form food webs","They are all identical","They prevent population change"],1,"Multiple feeding relationships connect into food webs with several links among organisms."]
    ],
    truth: ["A fox that eats rabbits is a producer in a grass–rabbit–fox chain.", false, "The fox consumes an animal and is a consumer, whereas the grass is the producer."],
    recall: ["What term describes an organism that makes its own organic food from inorganic materials, often using light?", "producer", "Producers such as plants form the base of many food chains by making organic material.", ["a producer","primary producer"]]
  },
  {
    id: "relational-database-keys", subject: "computer-science", title: "Relational Databases, Keys and Simple Queries", level: "Intermediate",
    summary: "Link tables with keys and reason about basic SQL SELECT queries.",
    objectives: ["Distinguish primary and foreign keys", "Understand filtering in SELECT queries", "Explain why relationships help reduce duplication"],
    lesson: [
      "A primary key uniquely identifies a row; a foreign key references a key in another table to represent a relationship.",
      "A SELECT query chooses columns to return, while WHERE filters rows based on a condition.",
      "Separating related entities into tables can reduce redundant data, provided the appropriate relationships are maintained."
    ],
    workedExample: "Students(StudentID, Name) stores each student once. Enrolments(StudentID, CourseID) references StudentID, allowing one student to enrol in several courses without copying the student's name into every row.",
    examTip: "Draw example rows and trace the key values between tables before choosing a SQL answer.",
    commonMistake: "Assuming that a foreign key must be unique; multiple child rows can reference one parent row.",
    checks: [
      ["What is the principal purpose of a primary key?", ["To choose a font","To uniquely identify a row","To sort every query","To encrypt a table"],1,"A primary key provides a unique row identifier used for reliable references and updates."],
      ["Which SQL clause filters rows in a query?", ["ORDER BY","SELECT","FROM","WHERE"],3,"WHERE restricts returned rows to those satisfying the condition in the predicate."],
      ["What does SELECT Name FROM Students request?", ["Values from the Name column","Only the last student","A new table named Name","Removal of Name"],0,"SELECT lists the requested column and FROM identifies the table being queried."],
      ["Which is most likely a foreign key in an Enrolments table?", ["StudentName in Students","DatabasePassword","StudentID referencing Students","ScreenSize"],2,"Enrolments.StudentID can refer to Students.StudentID to connect an enrolment with a student."],
      ["Can two enrolment rows share the same StudentID foreign-key value?", ["Never","Yes, if one student has several enrolments","Only when a row has no course","Only in an empty table"],1,"A student may enrol in several courses, yielding multiple child rows referencing one parent student."],
      ["Which query selects all columns from Courses?", ["SELECT * FROM Courses","SELECT Courses WHERE *","FROM * SELECT Courses","DELETE FROM Courses"],0,"The star selects all columns, and FROM Courses gives the table being read."],
      ["Which construct names the table to be queried?", ["WHERE","LIMIT","SELECT","FROM"],3,"The FROM clause identifies the relation or table that supplies the rows."],
      ["Why split Students and Enrolments into related tables?", ["To force one course per student","To prevent joining records","To avoid needless duplication of student details","To eliminate all keys"],2,"A separate enrolment table allows multiple enrolments without repeating each student's full details."]
    ],
    truth: ["A foreign key can reference a primary key value stored in another table.", true, "That is a standard way to model a relationship between two relational tables."],
    recall: ["Which SQL keyword begins a statement that retrieves columns from a table?", "SELECT", "SELECT identifies the columns to retrieve; FROM identifies the source table.", ["select"]]
  }
];
export const largeSTEMExpansion = specs.map(authorTenCheckLesson);
