/**
 * Legacy AI Service for text improvement inline inputs.
 * All core AI conversational logic has moved to the Modular AI Agent Architecture in /ai
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function improveText(text) {
  await delay(800);
  if (!text || text.length < 3) return text;
  
  const variations = [
    `Transform your experience with ${text.toLowerCase()}`,
    `${text} - Built for the modern web.`,
    `Discover the power of ${text.toLowerCase()} today.`,
    `Elevate your workflow: ${text}`,
    `${text} designed for scale.`
  ];
  return variations[Math.floor(Math.random() * variations.length)];
}
