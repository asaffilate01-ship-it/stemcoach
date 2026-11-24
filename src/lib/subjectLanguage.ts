/** TTS support and bidirectional presentation for language learning content. */
export function studySpeechLanguage(subject: string): string {
  switch (subject) {
    case "italian": return "it-IT";
    case "spanish": return "es-ES";
    case "arabic": return "ar-SA";
    case "urdu": return "ur-PK";
    case "turkish": return "tr-TR";
    case "welsh": return "cy-GB";
    case "french": return "fr-FR";
    case "german": return "de-DE";
    default: return "en-GB";
  }
}
