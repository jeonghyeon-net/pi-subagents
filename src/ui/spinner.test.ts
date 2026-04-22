import { describe, expect, it } from "vitest";
import { getClaudeSpinnerFrames, SPINNER_INTERVAL_MS } from "./spinner.js";

describe("spinner", () => {
  it("matches Claude Code's darwin frame sequence", () => {
    expect(getClaudeSpinnerFrames("xterm-256color", "darwin")).toEqual([
      "·", "✢", "✳", "✶", "✻", "✽",
      "✽", "✻", "✶", "✳", "✢", "·",
    ]);
  });

  it("uses Ghostty's asterisk fallback", () => {
    expect(getClaudeSpinnerFrames("xterm-ghostty", "darwin")).toEqual([
      "·", "✢", "✳", "✶", "✻", "*",
      "*", "✻", "✶", "✳", "✢", "·",
    ]);
  });

  it("uses Claude Code's 120ms interval", () => {
    expect(SPINNER_INTERVAL_MS).toBe(120);
  });
});
