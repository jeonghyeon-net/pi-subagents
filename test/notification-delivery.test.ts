import { describe, expect, it } from "vitest";
import { SUBAGENT_NOTIFICATION_OPTIONS } from "../src/notification-delivery.js";

describe("notification delivery", () => {
  it("keeps completion nudges visual-only until the next explicit parent turn", () => {
    expect(SUBAGENT_NOTIFICATION_OPTIONS).toEqual({ deliverAs: "followUp", triggerTurn: false });
  });
});
