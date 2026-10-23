// Generated comments pad the dash with spaces. Swallow that padding so the
// replacement reads as a comma, not a double-spaced ", ".
export function stripDashes(source: string): string {
  return source.replaceAll(/[^\S\n]*[\u2014\u2013][^\S\n]*/g, ", ");
}
