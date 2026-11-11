import type { Tutorial } from "./tutorials";
import { mcq, numeric, trueFalse, multi, order } from "./tutorialQuestions";

/**
 * Original mathematics formative teaching examples, pending qualified curriculum review.
 * They are not official past-paper questions or certified assessment records.
 */
export const newMathematicsLessons: Tutorial[] = [
  {
    id: "ratio-sharing-reasoning", subject: "mathematics", title: "Sharing Amounts in Two- and Three-Part Ratios",
    level: "Foundation", minutes: 15,
    summary: "Share a known amount accurately by converting the ratio into equal parts.",
    objectives: ["Find the total number of ratio parts", "Calculate the value of one part", "Check all distributed shares sum to the starting amount"],
    lesson: [
      "An amount shared in the ratio 2:3 is divided into five equal parts, not into two or three parts.",
      "Add every number in the ratio before dividing the total amount by that number of parts.",
      "Multiply the one-part value by each ratio number; finally add the shares and check the original total.",
    ],
    workedExample: "Share 60 counters in the ratio 2:3. There are 2 + 3 = 5 parts; one part is 60 ÷ 5 = 12. The two shares are 24 and 36 counters, and 24 + 36 = 60.",
    examTip: "Write the total number of ratio parts before dividing the amount, and check that your individual shares add back to the original.",
    commonMistake: "Dividing the whole amount by only the first ratio number gives an incorrect one-part value.",
    checkpoint: mcq("Share 80 sweets in the ratio 3:5. What is the larger share?", ["30 sweets", "35 sweets", "50 sweets", "60 sweets"], "50 sweets", "There are eight equal parts worth 10 sweets each, so the larger five-part share equals 50 sweets.", "First count all eight equal parts in the ratio."),
    practice: [
      numeric("A total of £72 is shared 5:4. What is the smaller share in pounds?", 32, "Nine parts each represent £8, so the four-part smaller share is 4 × £8 = £32.", "Divide 72 by the sum of the ratio parts."),
      mcq("A class shares 45 counters in the ratio 2:7. What is the smaller share?", ["5", "10", "15", "35"], "10", "The ratio has nine parts, each worth five counters. Two parts are therefore ten counters.", "The smaller number of parts is two."),
      trueFalse("Multiplying both numbers in a ratio by the same positive factor preserves the share proportions.", true, "The ratio 2:3 has the same relative shares as 8:12 because both terms were multiplied by four.", "Compare the fractions 2/5 and 8/20."),
      numeric("Share 96 tokens in the ratio 5:7. What is the first share?", 40, "The ratio has twelve parts. Each part is 96 ÷ 12 = 8 tokens; five parts give 40 tokens.", "Calculate the size of one ratio part."),
      multi("Which ratios are equivalent to 2:5?", ["4:10", "6:15", "8:20", "5:2"], ["4:10", "6:15", "8:20"], "Multiplying both ratio terms by 2, 3 or 4 keeps the same proportions. Reversing the terms changes which share is larger.", "The same multiplier must apply to both terms."),
      order("Place these steps for sharing an amount in a ratio into a sensible order.", ["Add the ratio terms to find total parts", "Divide the amount by the total parts", "Multiply the one-part value by each ratio term"], "First calculate the number of parts, then their value, then each share. This ensures a complete allocation.", "You cannot find one part before counting all parts."),
      numeric("Share 120 units in the ratio 1:3:6. What is the largest share?", 72, "There are ten equal parts, each worth twelve units. Six parts therefore give the largest share of 72.", "Add all three ratio terms, not just two."),
    ],
  },
  {
    id: "standard-form-arithmetic", subject: "mathematics", title: "Standard Form: Converting and Calculating",
    level: "Intermediate", minutes: 17,
    summary: "Express large and small numbers using powers of ten and perform simple calculations.",
    objectives: ["Write numbers as a × 10ⁿ with 1 ≤ |a| < 10", "Interpret positive and negative powers", "Multiply and divide standard-form quantities"],
    lesson: [
      "In standard form a × 10ⁿ, the non-zero coefficient a has magnitude at least one but less than ten.",
      "A positive exponent shifts the decimal value towards a large number; a negative exponent represents a small magnitude.",
      "To multiply, multiply coefficients and add powers; to divide, divide coefficients and subtract powers. Normalise the coefficient afterwards.",
    ],
    workedExample: "0.00046 = 4.6 × 10⁻⁴ because multiplying 4.6 by 0.0001 gives 0.00046. Also, (3 × 10⁴)(2 × 10²) = 6 × 10⁶.",
    examTip: "Check the coefficient is between 1 and 10 in magnitude, then verify the answer by estimating the original size.",
    commonMistake: "Using a positive exponent for a number between zero and one changes a tiny number into a very large one.",
    checkpoint: mcq("What is 5,400,000 written correctly in standard form?", ["5.4 × 10⁶", "54 × 10⁵", "5.4 × 10⁵", "0.54 × 10⁷"], "5.4 × 10⁶", "Move the decimal six places left to obtain 5.4; the original is 5.4 million, or 5.4 × 10⁶.", "Count decimal places and use a coefficient below ten."),
    practice: [
      numeric("Find n if 0.0072 = 7.2 × 10ⁿ.", -3, "Moving the decimal three places left from 7.2 gives 0.0072, so the required exponent is negative three.", "A number below one uses a negative power of ten."),
      mcq("Calculate (3.6 × 10³) ÷ (1.2 × 10²).", ["3", "30", "300", "3,000"], "30", "Divide 3.6 by 1.2 to get 3, and subtract exponents 3 − 2 = 1. Therefore the result is 3 × 10¹ = 30.", "Divide coefficients and subtract the exponents."),
      trueFalse("9.5 × 10³ is in valid standard form.", true, "The coefficient 9.5 is at least one and less than ten, and the exponent is an integer.", "Check the magnitude of the coefficient."),
      multi("Which expressions are already in valid standard form?", ["4.2 × 10⁻³", "0.6 × 10⁴", "7 × 10²", "12 × 10⁻¹"], ["4.2 × 10⁻³", "7 × 10²"], "Coefficients 4.2 and 7 lie in the required range. Coefficients 0.6 and 12 must be normalised.", "The leading coefficient must be at least one and below ten."),
      numeric("Calculate (3 × 10⁴) + (2 × 10⁴) as an ordinary whole number.", 50000, "Both powers are the same, so add the coefficients: (3 + 2) × 10⁴ = 5 × 10⁴ = 50,000.", "First check whether the exponents match."),
      order("Order these steps for multiplying two numbers in standard form.", ["Multiply the two coefficients", "Add the two powers of ten", "Normalise the coefficient if needed"], "Coefficient multiplication and exponent addition produce the intermediate product; normalising ensures correct standard form.", "Deal with the coefficients and powers separately."),
      mcq("Which ordinary decimal is equal to 2.7 × 10⁻²?", ["0.0027", "0.027", "0.27", "27"], "0.027", "Multiplication by 10⁻² means division by 100, so 2.7 divided by 100 is 0.027.", "A power of negative two divides by one hundred."),
    ],
  },
  {
    id: "linear-inequalities-number-line", subject: "mathematics", title: "Linear Inequalities and Number-Line Solutions",
    level: "Intermediate", minutes: 16,
    summary: "Solve inequalities and interpret strict and inclusive bounds without changing the solution set.",
    objectives: ["Solve one- and two-step linear inequalities", "Reverse the direction when multiplying or dividing by a negative", "Interpret strict and inclusive boundary points"],
    lesson: [
      "An inequality compares two quantities: < or > is strict, while ≤ or ≥ includes equality.",
      "Add or subtract the same quantity from both sides without changing the inequality direction.",
      "When multiplying or dividing both sides by a negative, reverse the inequality. Check with a substituted test value.",
    ],
    workedExample: "To solve −2x < 10, divide both sides by −2 and reverse the inequality, giving x > −5. Testing x = 0 gives 0 < 10, so it satisfies the original.",
    examTip: "Circle every negative multiplier or divisor as a reminder to reverse the inequality sign.",
    commonMistake: "Failing to reverse the symbol after dividing by a negative gives the opposite set of solutions.",
    checkpoint: mcq("Solve the inequality 2x + 3 > 11.", ["x > 4", "x < 4", "x > 7", "x < 7"], "x > 4", "Subtract three from both sides to obtain 2x > 8, then divide by positive two to get x > 4.", "First isolate the term containing x."),
    practice: [
      numeric("What is the greatest integer satisfying x < 7?", 6, "The strict inequality excludes seven, so the greatest integer less than seven is six.", "A strict less-than symbol excludes the boundary."),
      trueFalse("Dividing both sides of an inequality by a negative number reverses the inequality sign.", true, "For example 2 > 1 becomes −2 < −1 when multiplied by negative one, so the comparison reverses.", "Try multiplying a familiar true inequality by −1."),
      mcq("Solve the inequality −2x < 10.", ["x < −5", "x > −5", "x < 5", "x > 5"], "x > −5", "Dividing by −2 reverses the less-than symbol, so the solution is x > −5.", "Reversing the inequality is essential for negative divisors."),
      numeric("Find the largest integer x satisfying x + 9 ≤ 16.", 7, "Subtract nine from both sides to obtain x ≤ 7. Equality is allowed, so seven is the largest integer.", "The inclusive bound permits the endpoint."),
      multi("Which values of x satisfy 3x < 12?", ["−1", "0", "3", "4"], ["−1", "0", "3"], "Dividing by positive three gives x < 4; the first three values qualify but four is excluded.", "Check each value against the strict boundary of four."),
      order("Put these steps for solving 4x + 2 ≤ 18 in order.", ["Subtract 2 from both sides", "Divide both sides by positive 4", "Write the final solution x ≤ 4"], "The algebra becomes 4x ≤ 16 and then x ≤ 4; no sign reversal is needed because four is positive.", "Remove the constant before dividing."),
      numeric("Find the smallest integer satisfying 2x − 1 ≥ 5.", 3, "Adding one gives 2x ≥ 6, then dividing by two gives x ≥ 3, so three is the first allowed integer.", "Remember that ≥ includes equality."),
    ],
  },
  {
    id: "similarity-length-area-volume", subject: "mathematics", title: "Similar Shapes: Length, Area and Volume Scale Factors",
    level: "Intermediate", minutes: 18,
    summary: "Distinguish the effects of linear scale factors on lengths, areas and volumes.",
    objectives: ["Identify a linear scale factor from matching sides", "Square the scale factor for area", "Cube the scale factor for volume"],
    lesson: [
      "Similar shapes have matching angles and side lengths in the same ratio; the scale factor compares corresponding lengths.",
      "If lengths change by factor k, areas change by factor k² because both dimensions scale.",
      "For similar solids, volume changes by factor k³ because three independent dimensions scale.",
    ],
    workedExample: "A shape enlarged by linear scale factor 3 has every corresponding length multiplied by 3, every area multiplied by 9, and every volume multiplied by 27.",
    examTip: "Label the factor k for lengths, k² for areas and k³ for volumes before doing any numerical calculation.",
    commonMistake: "Multiplying the area or volume by only k ignores the additional scaled dimensions.",
    checkpoint: mcq("Two similar squares have side-length scale factor 3. What is the area scale factor?", ["3", "6", "9", "27"], "9", "Area scales with the square of the length factor, so 3² = 9.", "Each of the two dimensions triples."),
    practice: [
      numeric("A cube is enlarged by linear scale factor 2. What is its volume scale factor?", 8, "Volume scales as the cube of the length factor: 2³ = 8.", "Three dimensions each double."),
      mcq("A shape is reduced by linear scale factor 1/2. What is its area scale factor?", ["1/2", "1/4", "2", "4"], "1/4", "Area is multiplied by (1/2)² = 1/4, because both lengths are halved.", "Square the length multiplier."),
      trueFalse("If the length ratio of two similar solids is 1:4, their area ratio is 1:16.", true, "Squaring each length-ratio term gives the area ratio 1²:4² = 1:16.", "Areas are two-dimensional."),
      numeric("A side of 6 cm enlarges to 15 cm. What is the linear scale factor?", 2.5, "Divide the new length by the original: 15 ÷ 6 = 2.5.", "Use new length divided by original length."),
      multi("A solid is enlarged by linear scale factor 3. Which statements are true?", ["Matching lengths triple", "Areas increase ninefold", "Volumes increase twenty-sevenfold", "Angles triple"], ["Matching lengths triple", "Areas increase ninefold", "Volumes increase twenty-sevenfold"], "Lengths, areas and volumes change by k, k² and k³ respectively; corresponding angles remain equal in similar shapes.", "Angles do not scale with the dimensions."),
      order("Place these steps for finding a new area from a length scale factor in order.", ["Identify the ratio of corresponding lengths", "Square the linear scale factor", "Multiply the original area by the squared factor"], "The linear factor must be squared before it is applied to the original area.", "Start with corresponding sides, not the area."),
      numeric("An original area is 5 cm². If lengths enlarge by factor 4, what is the new area in cm²?", 80, "Square the linear factor four to obtain sixteen. Multiply the original 5 cm² by 16 to get 80 cm².", "Calculate the area multiplier 4² before multiplying."),
    ],
  },
];
