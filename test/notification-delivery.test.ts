import { describe, expect, it, vi } from "vitest";
import { deliverSubagentNotification, formatSubagentToast } from "../src/notification-delivery.js";
import type { NotificationDetails } from "../src/types.js";

function makeDetails(overrides: Partial<NotificationDetails> = {}): NotificationDetails {
  return {
    id: "agent-1",
    description: "Subagent A",
    status: "completed",
    toolUses: 2,
    totalTokens: 5700,
    durationMs: 3400,
    resultPreview: "바위 안정적이라서",
    ...overrides,
  };
}

describe("notification delivery", () => {
  it("formats a concise toast for a single interactive completion", () => {
    const text = formatSubagentToast(makeDetails());
    expect(text).toContain("Background agent update");
    expect(text).toContain("Subagent A — completed");
    expect(text).toContain("2 tool uses");
    expect(text).toContain("5.7k tokens");
    expect(text).toContain("3.4s");
    expect(text).toContain("바위 안정적이라서");
  });

  it("formats grouped updates without dumping every agent", () => {
    const text = formatSubagentToast(makeDetails({
      others: [
        makeDetails({ id: "agent-2", description: "Subagent B", resultPreview: "가위" }),
        makeDetails({ id: "agent-3", description: "Subagent C", resultPreview: "보" }),
      ],
    }), 2);

    expect(text).toContain("3 background agent updates");
    expect(text).toContain("Subagent A — completed");
    expect(text).toContain("Subagent B — completed");
    expect(text).toContain("+1 more");
    expect(text).not.toContain("Subagent C — completed");
  });

  it("suppresses background completion delivery in interactive sessions", () => {
    const sendMessage = vi.fn();
    const notify = vi.fn();

    const route = deliverSubagentNotification(
      { sendMessage } as any,
      { hasUI: true, ui: { notify } } as any,
      { content: "raw", details: makeDetails() },
    );

    expect(route).toBe("suppressed");
    expect(notify).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("suppresses background completion delivery without a UI as well", () => {
    const sendMessage = vi.fn();

    const route = deliverSubagentNotification(
      { sendMessage } as any,
      undefined,
      { content: "raw", details: makeDetails({ status: "error" }) },
    );

    expect(route).toBe("suppressed");
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
