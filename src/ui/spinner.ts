/** Claude Code source-based spinner frames and timing. */

const DARWIN_CHARS = ["·", "✢", "✳", "✶", "✻", "✽"];
const GHOSTTY_CHARS = ["·", "✢", "✳", "✶", "✻", "*"];
const OTHER_CHARS = ["·", "✢", "*", "✶", "✻", "✽"];

export const SPINNER_INTERVAL_MS = 120;

export function getClaudeSpinnerChars(term = process.env.TERM, platform = process.platform): string[] {
  if (term === "xterm-ghostty") return GHOSTTY_CHARS;
  return platform === "darwin" ? DARWIN_CHARS : OTHER_CHARS;
}

export function getClaudeSpinnerFrames(term = process.env.TERM, platform = process.platform): string[] {
  const chars = getClaudeSpinnerChars(term, platform);
  return [...chars, ...[...chars].reverse()];
}

export const SPINNER = getClaudeSpinnerFrames();
