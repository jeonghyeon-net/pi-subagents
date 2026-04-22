import { describe, expect, it, vi } from "vitest";
import { deliverSubagentNotification, formatSubagentToast, SUBAGENT_NOTIFICATION_OPTIONS } from "../src/notification-delivery.js";
import type { NotificationDetails } from "../src/types.js";

function makeDetails(overrides: Partial<NotificationDetails> = {}): NotificationDetails {
  return {
    id: "agent-1",
    description: "Subagent A",
    status: "completed",
    toolUses: 2,
    turnCount: 1,
    maxTurns: undefined,
    totalTokens: 5700,
    durationMs: 3400,
    resultPreview: "바위 안정적이라서",
    ...overrides,
  };
}

describe("notification delivery", () => {
  it("keeps fallback session nudges passive", () => {
    expect(SUBAGENT_NOTIFICATION_OPTIONS).toEqual({ deliverAs: "followUp", triggerTurn: false });
  });

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

  it("uses ui notifications in interactive sessions instead of injecting chat messages", () => {
    const sendMessage = vi.fn();
    const notify = vi.fn();

    const route = deliverSubagentNotification(
      { sendMessage } as any,
      { hasUI: true, ui: { notify } } as any,
      { content: "raw", details: makeDetails() },
    );

    expect(route).toBe("ui");
    expect(notify).toHaveBeenCalledOnce();
    expect(notify.mock.calls[0]?.[0]).toContain("Subagent A — completed");
    expect(notify.mock.calls[0]?.[1]).toBe("info");
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("falls back to session messages when no interactive UI is available", () => {
    const sendMessage = vi.fn();

    const route = deliverSubagentNotification(
      { sendMessage } as any,
      undefined,
      { content: "raw", details: makeDetails({ status: "error" }) },
    );

    expect(route).toBe("session");
    expect(sendMessage).toHaveBeenCalledOnce();
    expect(sendMessage).toHaveBeenCalledWith({
      customType: "subagent-notification",
      content: "raw",
      display: true,
      details: expect.objectContaining({ description: "Subagent A", status: "error" }),
    }, SUBAGENT_NOTIFICATION_OPTIONS);
  });
});
