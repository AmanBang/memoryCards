/**
 * Generates a unique ID for game sessions
 * @returns A unique string ID
 */
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Formats time in milliseconds to a readable string (mm:ss)
 * @param ms Time in milliseconds
 * @returns Formatted time string
 */
export function formatTime(ms: number | null): string {
  if (!ms) return '00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
/**
 * Calculates the grid dimensions based on the number of cards
 * @param cardCount Total number of cards
 * @returns An object with rows and columns
 */
export function calculateGrid(cardCount: number): { rows: number; cols: number } {
  // For standard 16 cards (Easy mode), prefer 4x4 layout
  if (cardCount === 16) {
    return { rows: 4, cols: 4 };
  }

  // Find the most square-like dimensions
  let cols = Math.ceil(Math.sqrt(cardCount));
  let rows = Math.ceil(cardCount / cols);

  return { rows, cols };
}
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
} 