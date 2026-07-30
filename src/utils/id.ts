/** Generate a unique short ID for new records */
export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
