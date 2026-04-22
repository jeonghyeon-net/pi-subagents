import { describe, expect, it } from "vitest";
import { ERROR_STATUSES, formatTokens } from "./agent-widget.js";

describe("agent widget formatting", () => {
  it("pluralizes tokens", () => {
    expect(formatTokens(1)).toBe("1 token");
    expect(formatTokens(5_000)).toBe("5.0k tokens");
  });

  it("treats only error and stopped as non-success outcomes", () => {
    expect(ERROR_STATUSES.has("error")).toBe(true);
    expect(ERROR_STATUSES.has("stopped")).toBe(true);
    expect(ERROR_STATUSES.has("completed")).toBe(false);
  });
});
