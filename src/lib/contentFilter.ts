/**
 * A simple utility for filtering mature content.
 * Real applications would likely use an external ML-based filter or a much more extensive dictionary.
 */

const MATURE_KEYWORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "dick",
  "pussy",
  "cock",
  "slut",
  "whore",
  "bastard",
  "motherfucker",
  "porn",
  "nsfw",
  "nude",
  "nudes",
  "sex",
];

/**
 * Checks if a string contains mature keywords.
 */
export function isMature(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return MATURE_KEYWORDS.some((word) => {
    // Check for exact word boundaries to avoid matching "peacocks" or "assassins"
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lower);
  });
}

/**
 * Masks mature keywords in a string with asterisks.
 */
export function maskText(text: string): string {
  if (!text) return text;
  let masked = text;
  
  for (const word of MATURE_KEYWORDS) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    masked = masked.replace(regex, "*".repeat(word.length));
  }
  
  return masked;
}
