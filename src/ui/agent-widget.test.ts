import { describe, expect, it } from "vitest";
import { formatTokens, formatTurns } from "./agent-widget.js";

describe("agent widget formatting", () => {
  it("formats turns without the overlapping glyph", () => {
    expect(formatTurns(1)).toBe("turn 1");
    expect(formatTurns(5, 30)).toBe("turn 5/30");
  });

  it("pluralizes tokens", () => {
    expect(formatTokens(1)).toBe("1 token");
    expect(formatTokens(5_000)).toBe("5.0k tokens");
  });
});
