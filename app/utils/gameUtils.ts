/**
 * Game utility functions
 */

/**
 * Generates a random game ID
 * @returns A random 6-character alphanumeric ID
 */
export function getRandomGameId(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
} 