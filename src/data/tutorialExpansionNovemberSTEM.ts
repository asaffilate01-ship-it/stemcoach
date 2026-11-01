import type { Tutorial } from "./tutorials";
import { mcq, numeric, trueFalse, multi, short, order, match, fillBlanks } from "./tutorialQuestions";

/**
 * Original formative examples for revision, not independently board-verified.
 * Answer keys are deliberately deterministic; every item requires academic review
 * and curriculum/version mapping before use as certified exam content.
 */
export const novemberSTEM: Tutorial[] = [
  {
    id: "statistics-mean-median-spread", subject: "mathematics",
    title: "Mean, Median and Data Spread", level: "Foundation", minutes: 14,
    summary: "Choose an average, find the range and explain what an outlier can change.",
    objectives: ["Calculate the arithmetic mean and median", "Calculate the range from extremes", "Compare the effects of an outlier"],
    lesson: [
      "The arithmetic mean is the sum of all values divided by the number of values. Check that the number of observations is counted correctly.",
      "To find the median, order observations first; for an even number, average the two central observations. The mode is the most frequently occurring value.",
      "The range is the largest value minus the smallest. An extreme value can change the mean and range greatly, while the median may remain unchanged."
    ],
    workedExample: "For 2, 3, 3, 7 and 10, the mean is (2+3+3+7+10)/5 = 5; the median is 3; the mode is 3; and the range is 10−2 = 8.",
    examTip: "Show the ordered list for the median and display the mean calculation rather than giving an unsupported answer.",
    commonMistake: "The median is a position in the sorted data, not the value obtained by dividing the sum by the sample size.",
    checkpoint: mcq("What is the mean of 2, 4, 6 and 8?", ["4", "5", "6", "8"], "5", "The four values total 20. Divide by the four observations: 20/4 = 5.", "Add the values first, then divide by their count."),
    practice: [
      numeric("What is the median of the ordered set 3, 7, 7, 9, 12?", 7, "There are five values, so the middle (third) value is 7.", "The middle position is third, not the mean."),
      mcq("What is the range of 3, 5, 12 and 14?", ["9", "11", "14", "34"], "11", "Subtract the smallest value 3 from the largest value 14 to obtain 11.", "Range uses only the largest and smallest values."),
      trueFalse("Adding 4 to every observation leaves the range unchanged.", true, "Both extremes increase by 4, so their difference remains the same.", "Compare the difference between the two extremes."),
      multi("Which statements about averages and spread are true?", ["An outlier can change the mean", "The median is relatively resistant to an outlier", "The range uses the maximum and minimum", "A set always has exactly one mode"], ["An outlier can change the mean", "The median is relatively resistant to an outlier", "The range uses the maximum and minimum"], "The mean and range respond to extremes; the median depends on ordered middle positions. Some data sets have several modes or no unique mode.", "One of the statements incorrectly claims uniqueness."),
      order("Place these steps for finding the median in the correct order.", ["Order the values from smallest to largest", "Locate the middle position or pair of positions", "Read the centre or average the two middle values"], "Ordering must precede finding the centre, which gives the median value.", "The values must be ordered before identifying the centre."),
      fillBlanks("Complete the median and range for 2, 4, 7, 9, 10.", [["median", "The middle value is:", "7"], ["range", "The largest minus smallest equals:", "8"]], "The third of five ordered values is 7, and the range is 10 − 2 = 8.", "Read the third value, then subtract the extremes."),
      numeric("Calculate the mean of 4, 6, 10 and 12.", 8, "The sum is 32 and there are four values, giving 32/4 = 8.", "The total must be divided by four observations.")
    ]
  },
  {
    id: "electrical-power-and-energy", subject: "physics",
    title: "Electrical Power and Energy Transfers", level: "Intermediate", minutes: 16,
    summary: "Calculate electrical power and energy and distinguish watts from joules and kilowatt-hours.",
    objectives: ["Use P = VI and E = Pt", "Identify standard units of power and energy", "Convert power and duration into watt-hours"],
    lesson: [
      "Electrical power is the rate of energy transfer. For a component, P = VI where V is potential difference in volts and I is current in amperes.",
      "Transferred energy is E = Pt when power is constant, with joules when power is in watts and time is in seconds.",
      "Electricity bills often use kilowatt-hours: energy in kWh equals power in kW multiplied by time in hours. One kWh equals 3.6 million joules."
    ],
    workedExample: "A 12 V device drawing 2 A has power P = 12×2 = 24 W. In 15 s, E = 24×15 = 360 J; for a full hour it would transfer 24 Wh.",
    examTip: "Write the equation, substitute values with units and check whether the question requests joules or kilowatt-hours.",
    commonMistake: "Multiplying watts by hours gives watt-hours, not joules; using seconds instead gives joules.",
    checkpoint: mcq("A 6 V component draws 2 A for 5 s. How much energy is transferred?", ["12 J", "30 J", "60 J", "120 J"], "60 J", "P = 6×2 = 12 W, then E = 12×5 = 60 J.", "Use P = VI first, then E = Pt."),
    practice: [
      numeric("A device transfers 120 J in 4 s. What is its power in watts?", 30, "Power is energy transferred per second: 120/4 = 30 W.", "Divide energy by time in seconds."),
      trueFalse("The potential difference across each parallel branch is the same.", true, "Branches connected to the same pair of circuit nodes share the same potential difference.", "Think about the two shared connection points."),
      multi("Which unit-symbol pairings are correct?", ["Power — watt (W)", "Energy — joule (J)", "Current — ampere (A)", "Resistance — kilogram (kg)"], ["Power — watt (W)", "Energy — joule (J)", "Current — ampere (A)"], "Watts, joules and amperes measure power, energy and current respectively. Resistance is measured in ohms.", "Resistance has an electrical unit, not a mass unit."),
      match("Match these electrical quantities to their SI units.", [["Electric charge", "coulomb"], ["Potential difference", "volt"], ["Resistance", "ohm"]], "Charge is measured in coulombs, potential difference in volts and resistance in ohms.", "Recall C, V and Ω on circuit data sheets."),
      fillBlanks("Find power and then energy for a 12 V, 3 A device operating for 10 s.", [["power", "Power in watts is:", "36"], ["energy", "Energy in joules is:", "360"]], "P = VI = 12×3 = 36 W; E = Pt = 36×10 = 360 J.", "Calculate watts before joules."),
      mcq("A constant 20 W lamp runs for 3 hours. How much energy does it use?", ["0.006 kWh", "0.06 kWh", "0.6 kWh", "60 kWh"], "0.06 kWh", "20 W = 0.020 kW. Multiply by 3 hours: 0.020×3 = 0.060 kWh.", "Convert watts into kilowatts first."),
      numeric("A 2 kW heater runs for 30 minutes. What energy does it use in kWh?", 1, "Thirty minutes equals half an hour, so energy = 2 kW × 0.5 h = 1 kWh.", "Convert the duration to hours.")
    ]
  },
  {
    id: "empirical-formula-method", subject: "chemistry",
    title: "Empirical Formulae and Mole Ratios", level: "Intermediate", minutes: 16,
    summary: "Convert mass data to mole ratios and simplify to the smallest whole-number formula.",
    objectives: ["Calculate moles from mass and relative atomic mass", "Simplify mole ratios", "Distinguish molecular and empirical formulae"],
    lesson: [
      "An empirical formula shows the simplest whole-number ratio of atoms of each element in a substance.",
      "Convert each element's mass to amount in moles by dividing by its relative atomic mass, then divide each amount by the smallest amount.",
      "Where ratios are fractional, multiply all ratios by the same small integer to obtain whole numbers. A molecular formula can be an integer multiple of an empirical formula."
    ],
    workedExample: "A compound has 12 g of carbon and 32 g of oxygen. Moles are C: 12/12 = 1 and O: 32/16 = 2; the ratio is 1:2, so the empirical formula is CO2.",
    examTip: "Set out a mass ÷ relative atomic mass row for each element and only round ratios when chemically justified.",
    commonMistake: "Dividing masses directly gives a mass ratio, not the atom-number ratio required for an empirical formula.",
    checkpoint: mcq("A sample has 12 g of carbon and 32 g of oxygen (Ar C=12, O=16). What is its empirical formula?", ["CO", "CO2", "C2O", "C2O3"], "CO2", "Moles of C = 1 and of O = 2; the simplest atomic ratio is C:O = 1:2.", "Convert each element's mass into moles."),
    practice: [
      numeric("How many moles are in 24 g of magnesium if Ar(Mg) = 24?", 1, "Amount = mass ÷ molar mass = 24/24 = 1 mol.", "Divide grams by grams per mole."),
      mcq("How many moles are in 28 g of N2 if Mr(N2) = 28?", ["0.5 mol", "1 mol", "2 mol", "28 mol"], "1 mol", "28 g divided by 28 g/mol gives 1 mol of nitrogen molecules.", "Use molecular mass for the N2 molecules."),
      trueFalse("A molecular formula may be a whole-number multiple of an empirical formula.", true, "For example, C6H12O6 has empirical formula CH2O, a factor of six smaller.", "Compare actual atom counts with simplest ratios."),
      multi("Which actions belong in an empirical-formula calculation?", ["Convert each element's mass to moles", "Divide mole amounts by the smallest", "Scale fractional ratios to whole numbers", "Use raw masses as atom counts"], ["Convert each element's mass to moles", "Divide mole amounts by the smallest", "Scale fractional ratios to whole numbers"], "Empirical formulae require mole ratios; raw mass values do not directly count atoms.", "Relative atomic mass is the key conversion."),
      order("Order these actions for deriving an empirical formula from mass data.", ["Convert the mass of each element to moles", "Divide all mole amounts by the smallest", "Multiply fractions if necessary to get whole-number subscripts"], "The three steps convert composition into the simplest atomic mole ratio.", "A formula is the result, not the starting point."),
      fillBlanks("A sample contains 48 g carbon and 8 g hydrogen (Ar C=12, H=1).", [["carbon", "Amount of carbon in moles:", "4"], ["hydrogen", "Amount of hydrogen in moles:", "8"], ["formula", "Simplest empirical formula:", "CH2"]], "48/12 = 4 mol of carbon; 8/1 = 8 mol of hydrogen. Divide by four for C:H = 1:2.", "Calculate the two mole amounts, then divide by four."),
      short("What is the empirical formula of C2H6?", "CH3", "Divide both subscripts in C2H6 by their greatest common factor, two, to obtain CH3.", "Find the largest whole number dividing both subscripts.")
    ]
  },
  {
    id: "monohybrid-inheritance", subject: "biology",
    title: "Monohybrid Inheritance and Probability", level: "Intermediate", minutes: 15,
    summary: "Interpret simple inheritance crosses using genotype, phenotype and probabilities.",
    objectives: ["Distinguish allele and genotype", "Construct a monohybrid cross", "Find offspring genotype probabilities"],
    lesson: [
      "An allele is an alternative form of a gene. A diploid individual usually carries two alleles of an autosomal gene, one from each parent.",
      "For a complete-dominance model, the dominant allele can determine the phenotype in heterozygotes, while a recessive phenotype appears with two recessive alleles.",
      "Each parent's gametes carry one allele at the locus. A Punnett grid displays equally likely allele combinations under the model's assumptions; probabilities are not guarantees for small families."
    ],
    workedExample: "With B dominant to b, two heterozygous parents (Bb × Bb) each make B and b gametes. Outcomes BB, Bb, Bb, bb give genotype ratio 1:2:1 and recessive phenotype probability 1/4.",
    examTip: "State the dominance assumption, show parental gametes and label probability as a chance rather than a guaranteed count.",
    commonMistake: "A 25% probability of bb does not mean exactly one of every four children must have the recessive phenotype.",
    checkpoint: mcq("For Bb × Bb with complete dominance, what is the chance of genotype bb?", ["0%", "25%", "50%", "75%"], "25%", "One of the four equally likely Punnett-grid combinations is bb, so probability is 1/4.", "Write B and b on both sides of the Punnett grid."),
    practice: [
      numeric("In percent, what is the chance of bb from Bb × Bb?", 25, "The recessive genotype appears in one of four outcomes: 1/4 × 100 = 25%.", "Convert the one-in-four chance to a percentage."),
      trueFalse("An individual with genotype Bb is heterozygous at this gene.", true, "Heterozygous means that the two alleles at the locus differ.", "The two letters represent different alleles."),
      multi("Which statements are consistent with basic Mendelian inheritance?", ["An allele is a version of a gene", "Homozygous means two matching alleles", "Gametes carry one allele per locus", "A child inherits every allele only from its father"], ["An allele is a version of a gene", "Homozygous means two matching alleles", "Gametes carry one allele per locus"], "Alleles come from both parents in this model; gametes are haploid at each locus.", "Offspring inherit genetic information from both parents."),
      order("Place these steps of sexual inheritance in their biological order.", ["Parents produce gametes by meiosis", "An egg and sperm fuse in fertilisation", "A zygote inherits one allele from each gamete"], "Meiosis forms haploid gametes, fertilisation combines them and the offspring inherits both contributions.", "Inheritance starts with gametes being made."),
      match("Match each genotype with its description.", [["BB", "homozygous dominant"], ["Bb", "heterozygous"], ["bb", "homozygous recessive"]], "Both letters the same indicate homozygosity; two different alleles indicate heterozygosity.", "Pay attention to whether the letters match."),
      fillBlanks("For the cross Aa × aa, complete the recessive genotype and its probability.", [["genotype", "Recessive offspring genotype:", "aa"], ["chance", "Percentage of offspring with this genotype:", "50"]], "The first parent produces A or a and the second produces a only, giving Aa or aa with equal probability.", "The second parent can pass on only a."),
      mcq("If a dominant-phenotype organism crossed with aa produces both dominant and recessive offspring, which genotype must the first parent have under this model?", ["AA", "Aa", "aa", "AABB"], "Aa", "Recessive offspring must receive a from both parents, so the dominant-phenotype parent must carry allele a and be heterozygous.", "A recessive child must receive a from both parents.")
    ]
  },
  {
    id: "sql-queries-and-keys", subject: "computer-science",
    title: "Relational Database Queries and Keys", level: "Intermediate", minutes: 17,
    summary: "Understand primary keys, joins, filters and the order of basic SQL operations.",
    objectives: ["Distinguish primary keys from ordinary columns", "Read SELECT, WHERE and ORDER BY", "Explain what a LEFT JOIN returns"],
    lesson: [
      "A primary key uniquely identifies each row in a relational table and must not be NULL. Foreign keys reference keys in another table and help express relationships.",
      "In a SELECT query, WHERE filters rows, ORDER BY sorts the result and DISTINCT removes duplicate projected rows. COUNT(*) counts result rows.",
      "A LEFT JOIN preserves rows from the left table even where a matching right-table row does not exist. The conceptual processing order begins with FROM/JOIN, then WHERE, then SELECT."
    ],
    workedExample: "SELECT name FROM products WHERE price > 10 ORDER BY name lists only products costing more than 10, then sorts their names. Names are values; a primary key such as product_id is the stable row identifier.",
    examTip: "Read the SQL one clause at a time and distinguish filtering source rows from sorting returned results.",
    commonMistake: "Assuming LEFT JOIN removes unmatched left-hand rows; that behaviour would be like an INNER JOIN instead.",
    checkpoint: mcq("What is the main purpose of a primary key?", ["Sort every result automatically", "Uniquely identify each table row", "Encrypt stored text", "Remove the need for indexes"], "Uniquely identify each table row", "A primary key has unique non-null values that distinguish individual records.", "Think about how two similar rows can be distinguished."),
    practice: [
      trueFalse("A LEFT JOIN can include left-table rows with no matching right-table row.", true, "Where there is no match, left rows are retained and right-side columns are generally NULL.", "A left join retains the entire left side."),
      multi("Which descriptions of common SQL clauses are accurate?", ["SELECT chooses the output columns", "WHERE filters rows using a condition", "ORDER BY specifies result ordering", "DELETE is guaranteed harmless without a WHERE clause"], ["SELECT chooses the output columns", "WHERE filters rows using a condition", "ORDER BY specifies result ordering"], "DELETE without a limiting condition can remove every row in a table, so it is not inherently harmless.", "One statement concerns unsafe data deletion."),
      match("Match SQL clauses to their roles.", [["WHERE", "filter rows"], ["ORDER BY", "sort output"], ["GROUP BY", "combine rows into groups"]], "Filtering, ordering and grouping are separate SQL operations.", "Sorting does not change which rows match WHERE."),
      order("Order these stages of a simple SQL query's conceptual evaluation.", ["Read the source table in FROM", "Apply the row filter in WHERE", "Project selected columns in SELECT"], "In the simplified logical evaluation, FROM provides rows, WHERE filters and SELECT projects output columns.", "SQL syntax order and evaluation order are not identical."),
      short("Which SQL keyword removes duplicate result rows in SELECT queries?", "DISTINCT", "SELECT DISTINCT returns only unique combinations of the selected columns.", "This keyword follows SELECT and removes duplicates."),
      fillBlanks("Complete: SELECT ___ FROM products WHERE price ___ 10 to return product names with prices above 10.", [["column", "Selected column name:", "name"], ["comparison", "Comparison operator:", ">"]], "The query SELECT name FROM products WHERE price > 10 filters products above 10 and returns their names.", "Choose a column and the greater-than operator."),
      mcq("What does SELECT COUNT(*) FROM orders WHERE status = 'paid' return?", ["The sum of paid amounts", "The number of matching paid rows", "A list of order IDs", "The most recent order"], "The number of matching paid rows", "COUNT(*) counts rows remaining after the WHERE status = 'paid' filter.", "COUNT(*) counts rows, not monetary totals.")
    ]
  }
];
