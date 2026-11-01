import type { Tutorial } from "./tutorials";
import { mcq, numeric, trueFalse, multi, order, match, fillBlanks } from "./tutorialQuestions";

/** Original formative study drafts, not independently board-certified. */
export const phaseNextSTEM: Tutorial[] = [
  {
    id: "arithmetic-sequences-nth-term", subject: "mathematics",
    title: "Arithmetic Sequences: Calculating Terms", level: "Foundation", minutes: 14,
    summary: "Use a common difference to find terms and interpret a linear nth-term formula.",
    objectives: ["Find the constant difference in an arithmetic sequence", "Use a + (n−1)d to find a term", "Check a sequence formula against its first terms"],
    lesson: [
      "An arithmetic sequence has the same difference between each pair of consecutive terms; this difference can be positive, zero or negative.",
      "If the first term is a and the common difference is d, the nth term is a + (n−1)d. The first term corresponds to n = 1.",
      "A linear formula such as 4n − 1 gives the terms 3, 7, 11 and 15 for n = 1, 2, 3 and 4. Always substitute a known term to check the formula."
    ],
    workedExample: "The sequence 5, 8, 11, 14 has first term 5 and common difference 3. Its nth term is 5 + (n−1)×3 = 3n + 2; the sixth term is 3×6 + 2 = 20.",
    examTip: "Start term numbering at n = 1 and verify your formula against both the first and second terms.",
    commonMistake: "Using a + nd rather than a + (n−1)d adds one unnecessary common difference to every term.",
    checkpoint: mcq("What is the nth term of 3, 7, 11, 15, ...?", ["4n − 1", "4n + 1", "3n + 4", "n + 4"], "4n − 1", "The difference is 4 and the first term is 3, giving 3 + (n−1)×4 = 4n − 1.", "Use first term plus n minus one common differences."),
    practice: [
      numeric("What is the sixth term of an arithmetic sequence starting at 5 with common difference 3?", 20, "The sixth term is 5 + (6−1)×3 = 5 + 15 = 20. Count five intervals after the first term.", "Count the gaps between the first and sixth terms."),
      trueFalse("The sequence 10, 7, 4, 1 has common difference −3.", true, "Each successive term decreases by exactly 3, so the common difference is negative three.", "Subtract the previous term from the next."),
      multi("Which statements about arithmetic sequences are correct?", ["They have a constant difference", "Their nth term can be linear in n", "Their common difference may be negative", "They must begin with zero"], ["They have a constant difference", "Their nth term can be linear in n", "Their common difference may be negative"], "Constant differences generate a linear formula. The first term can be any value, not just zero.", "Identify the one restriction that is not required."),
      order("Place the steps for deriving the nth term of an arithmetic sequence in order.", ["Find the first term and common difference", "Substitute both into a + (n−1)d", "Simplify and check the formula against a known term"], "The formula is built from the first term and common difference, then simplified and checked.", "Find the difference before constructing the formula."),
      fillBlanks("A sequence starts at 2 and increases by 5 each term.", [["difference", "Common difference:", "5"], ["term", "Fourth term of the sequence:", "17"]], "The terms are 2, 7, 12, 17, so the difference is 5 and the fourth term is 17.", "Write out four terms and compare their gaps.")
    ]
  },
  {
    id: "waves-frequency-period-speed", subject: "physics",
    title: "Wave Speed, Frequency and Period", level: "Intermediate", minutes: 16,
    summary: "Calculate wave speed and distinguish a cycle's period from its frequency.",
    objectives: ["Use wave speed = frequency × wavelength", "Relate period to frequency", "Identify units for wave quantities"],
    lesson: [
      "Frequency f measures cycles per second in hertz (Hz); the period T measures the time for a single complete cycle in seconds.",
      "Wave speed v equals frequency multiplied by wavelength: v = fλ. Wavelength is the distance between equivalent points on neighbouring cycles.",
      "Frequency and period are reciprocals, so T = 1/f for a periodic wave with non-zero frequency. Keep seconds, metres and hertz consistent."
    ],
    workedExample: "For a wave with frequency 4 Hz and wavelength 3 m, v = fλ = 4×3 = 12 m/s. Its period is T = 1/4 = 0.25 s.",
    examTip: "Write the equation first and clearly distinguish a wave's speed, period and frequency, including their units.",
    commonMistake: "Dividing wavelength by frequency instead of multiplying, or treating one hertz as one second.",
    checkpoint: mcq("A wave has frequency 4 Hz and wavelength 3 m. What is its speed?", ["0.75 m/s", "7 m/s", "12 m/s", "24 m/s"], "12 m/s", "Multiply the frequency by wavelength: v = 4 Hz × 3 m = 12 m/s.", "Use wave speed equals frequency times wavelength."),
    practice: [
      numeric("What is the period in seconds of a wave with frequency 5 Hz?", 0.2, "Frequency 5 Hz means five complete cycles per second, so period T = 1/5 = 0.2 s.", "Period and frequency are reciprocals."),
      trueFalse("Increasing frequency while holding wavelength constant increases wave speed in v = fλ.", true, "For the stated constant wavelength, the speed calculated by v = fλ increases proportionally with frequency.", "Ask which factor in the product changes."),
      multi("Which statements describe periodic waves correctly?", ["Frequency is measured in hertz", "Period is measured in seconds", "Wave speed can be measured in metres per second", "Wavelength is measured in kilograms"], ["Frequency is measured in hertz", "Period is measured in seconds", "Wave speed can be measured in metres per second"], "Hertz, seconds and metres per second are the appropriate units. Wavelength is a distance, not a mass.", "One unit is not a measure of length."),
      match("Match wave quantities with their standard units.", [["Frequency", "hertz"], ["Wavelength", "metre"], ["Period", "second"]], "Frequency counts cycles per second, wavelength is a distance and period is a duration.", "Think cycles, distance and time."),
      fillBlanks("A wave has frequency 10 Hz and wavelength 2 m.", [["speed", "Wave speed in metres per second:", "20"], ["period", "Period in seconds:", "0.1"]], "Speed is 10 × 2 = 20 m/s; period is the reciprocal of 10 Hz, giving 0.1 s.", "Multiply for speed, divide one by frequency for period.")
    ]
  },
  {
    id: "solution-concentration-dilution", subject: "chemistry",
    title: "Molar Concentration: Volume and Dilution Calculations", level: "Intermediate", minutes: 15,
    summary: "Find molar concentrations and reason about dilution without changing the solute amount.",
    objectives: ["Use c = n/V with volume in dm³", "Convert between cm³ and dm³", "Explain how dilution affects concentration"],
    lesson: [
      "Molar concentration c is the amount of solute n in moles divided by the solution volume V in cubic decimetres: c = n/V.",
      "One cubic decimetre equals 1000 cubic centimetres. Divide cm³ by 1000 before using c = n/V in mol/dm³.",
      "Adding solvent to the same solute amount increases the volume and lowers the concentration. A simple dilution obeys c₁V₁ = c₂V₂ when no solute is gained or lost."
    ],
    workedExample: "A solution containing 0.20 mol solute in 500 cm³ has V = 0.500 dm³ and c = 0.20/0.500 = 0.40 mol/dm³. Diluting it to 1.00 dm³ gives c = 0.20 mol/dm³.",
    examTip: "Convert solution volumes to dm³ before substituting into the molar concentration equation.",
    commonMistake: "Using 500 in place of 0.500 dm³, which makes the concentration one thousand times too small.",
    checkpoint: mcq("A solution has 0.2 mol of solute in 0.5 dm³. What is its concentration?", ["0.1 mol/dm³", "0.4 mol/dm³", "2.5 mol/dm³", "4 mol/dm³"], "0.4 mol/dm³", "Use c = n/V, so 0.20 ÷ 0.50 = 0.40 mol per cubic decimetre.", "Concentration is moles divided by volume."),
    practice: [
      numeric("Find concentration in mol/dm³ for 0.6 mol in 2 dm³.", 0.3, "The concentration is amount divided by volume: c = 0.6/2 = 0.3 mol/dm³.", "Divide the number of moles by two."),
      trueFalse("Five hundred cubic centimetres is equal to 0.5 cubic decimetres.", true, "Since 1000 cm³ equals 1 dm³, divide 500 by 1000 to obtain 0.5 dm³.", "Use 1000 cubic centimetres per cubic decimetre."),
      multi("Which statements about simple dilution are correct?", ["Adding solvent increases total volume", "The solute amount can remain unchanged", "Concentration decreases when the volume grows at fixed solute amount", "Dilution always creates more solute"], ["Adding solvent increases total volume", "The solute amount can remain unchanged", "Concentration decreases when the volume grows at fixed solute amount"], "A pure-solvent addition increases volume without adding solute, so the same number of moles occupies more liquid.", "Dilution does not manufacture solute."),
      match("Match these solution quantities to their units.", [["Amount of substance", "mole"], ["Molar concentration", "mol/dm³"], ["Solution volume", "dm³"]], "Amount is counted in moles, concentration in mol per volume and volume in cubic decimetres.", "The slash indicates moles per unit volume."),
      fillBlanks("A solution contains 0.10 mol solute in 250 cm³.", [["volume", "Solution volume in dm³:", "0.25"], ["concentration", "Concentration in mol/dm³:", "0.4"]], "250 cm³ is 0.25 dm³ and c = 0.10 / 0.25 = 0.40 mol/dm³.", "First convert 250 cm³ and then divide amount by volume.")
    ]
  },
  {
    id: "photosynthesis-rate-analysis", subject: "biology",
    title: "Photosynthesis Rate: Limiting-Factor Analysis", level: "Intermediate", minutes: 15,
    summary: "Describe how light, carbon dioxide and temperature can limit photosynthesis.",
    objectives: ["Identify products and reactants of photosynthesis", "Interpret a limiting factor", "Explain enzyme effects at high temperatures"],
    lesson: [
      "Photosynthesis converts carbon dioxide and water into carbohydrates and oxygen using light energy, in a process associated with chloroplasts.",
      "At low light levels, increasing light intensity can increase photosynthesis, but the rate may level off when another factor such as carbon dioxide availability becomes limiting.",
      "Photosynthetic reactions depend on enzymes, so temperature affects rate. Extremely high temperatures can impair enzymes and other plant processes; temperature effects are not simply unlimited increases."
    ],
    workedExample: "If a plant's photosynthesis rate rises with light intensity and then plateaus, increasing light further will not necessarily help. At that point carbon dioxide or temperature may constrain the rate.",
    examTip: "When interpreting a graph, describe the observed increase or plateau before explaining possible limiting factors.",
    commonMistake: "Claiming that brighter light must always increase photosynthesis, even after the rate reaches a plateau.",
    checkpoint: mcq("Which gas is typically released as a product of oxygenic photosynthesis?", ["Nitrogen", "Oxygen", "Carbon dioxide", "Hydrogen"], "Oxygen", "In oxygenic photosynthesis, water is split and oxygen is released while carbon dioxide contributes to carbohydrate synthesis.", "Recall the gas released by water splitting."),
    practice: [
      trueFalse("A photosynthesis rate may stop increasing with light when carbon dioxide is limiting.", true, "Once light is adequate, a shortage of another input such as carbon dioxide can limit the rate.", "Increasing one factor cannot overcome every shortage."),
      multi("Which factors can affect the rate of photosynthesis?", ["Light intensity", "Carbon dioxide availability", "Temperature", "The spelling of a plant's species name"], ["Light intensity", "Carbon dioxide availability", "Temperature"], "Energy supply, reactant availability and enzyme function influence the rate; word spelling does not.", "Choose factors that affect the biological process."),
      match("Match each photosynthesis factor to a common effect.", [["Light", "supplies energy for the reactions"], ["Carbon dioxide", "provides carbon for carbohydrates"], ["Chlorophyll", "absorbs light energy"]], "Light provides the energy, carbon dioxide provides carbon and chlorophyll captures light for the photosynthetic process.", "One is energy, one is carbon, and one is a pigment."),
      order("Order the events in a simplified photosynthesis model.", ["Chlorophyll absorbs light", "Light-driven reactions provide chemical energy", "Carbon dioxide is incorporated into carbohydrates"], "Light capture and subsequent chemical processes make it possible to build carbohydrates from carbon dioxide.", "Start with the energy source."),
      fillBlanks("Complete the reactant and product gases in oxygenic photosynthesis.", [["reactant", "Gas taken in as a carbon source:", "carbon dioxide"], ["product", "Gas commonly released:", "oxygen"]], "Carbon dioxide supplies the carbon fixed into carbohydrate; oxygen is released during the light-driven splitting of water.", "One gas contributes carbon, the other is released.")
    ]
  },
  {
    id: "binary-hex-data-representation", subject: "computer-science",
    title: "Binary and Hexadecimal Data Representation", level: "Foundation", minutes: 16,
    summary: "Convert small non-negative integers between decimal, binary and hexadecimal.",
    objectives: ["Use binary place values to decode values", "Convert four binary bits to a hex digit", "Relate bits to bytes"],
    lesson: [
      "Binary is base two and uses digits 0 and 1. Each place value is a power of two, increasing from the right as 1, 2, 4, 8, 16 and so on.",
      "Hexadecimal is base sixteen, with digits 0–9 then A–F for decimal ten through fifteen. One hex digit corresponds exactly to four bits.",
      "Eight bits make one byte. Representations differ in compactness but denote the same underlying numerical value when interpreted in the same unsigned context."
    ],
    workedExample: "Binary 1010 has place values 8+0+2+0 = decimal 10, written A in hexadecimal. Binary 1111 is 8+4+2+1 = 15 and corresponds to hex F.",
    examTip: "Write powers of two over each binary digit and specify whether the representation is unsigned.",
    commonMistake: "Reading 1010 in binary as decimal one thousand and ten instead of evaluating its powers of two.",
    checkpoint: mcq("What decimal number is represented by unsigned binary 1010?", ["8", "10", "12", "16"], "10", "The set positions are eight and two, so unsigned binary 1010 equals 8+2 = decimal 10.", "Write 8, 4, 2, 1 above the four bits."),
    practice: [
      numeric("What is the decimal value of unsigned binary 1101?", 13, "Binary 1101 means 8+4+0+1, giving a total decimal value of 13.", "Add the powers of two whose bits are one."),
      trueFalse("One byte contains eight bits.", true, "In contemporary computing a byte is an octet of eight bits, while a nibble contains four bits.", "Think of the standard bit count in a byte."),
      multi("Which representations equal decimal fifteen?", ["Binary 1111", "Hex F", "Unsigned decimal 15", "Binary 1010"], ["Binary 1111", "Hex F", "Unsigned decimal 15"], "1111₂ sums to fifteen and hexadecimal F also encodes fifteen. Binary 1010 equals ten.", "Compare all forms to decimal fifteen."),
      match("Match each unsigned four-bit binary number to decimal.", [["0011", "3"], ["1010", "10"], ["1111", "15"]], "Binary place values are 8, 4, 2, 1; adding set positions gives 3, 10 and 15.", "Convert each value from powers of two."),
      fillBlanks("Convert unsigned binary 1001 and hex A into decimal.", [["binary", "Decimal value of binary 1001:", "9"], ["hex", "Decimal value of hexadecimal A:", "10"]], "Binary 1001 is 8+1 = 9; hexadecimal A is the single digit for decimal 10.", "Remember 8, 4, 2, 1 and hexadecimal digits A–F.")
    ]
  },
];
