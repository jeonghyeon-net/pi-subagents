import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import type { NotificationDetails } from "./types.js";
import { formatMs, formatTokens, formatTurns } from "./ui/agent-widget.js";

export const SUBAGENT_NOTIFICATION_OPTIONS = {
  deliverAs: "followUp" as const,
  triggerTurn: false,
};

type NotifyLevel = "info" | "warning" | "error";

function isErrorStatus(status: string): boolean {
  return status === "error" || status === "aborted";
}

function isWarningStatus(status: string): boolean {
  return status === "stopped" || status === "steered";
}

function getNotifyLevel(all: NotificationDetails[]): NotifyLevel {
  if (all.some((d) => isErrorStatus(d.status))) return "error";
  if (all.some((d) => isWarningStatus(d.status))) return "warning";
  return "info";
}

function getStatusText(status: string): string {
  if (status === "error") return "failed";
  if (status === "aborted") return "aborted";
  if (status === "stopped") return "stopped";
  if (status === "steered") return "completed (turn limit)";
  return "completed";
}

function getPreviewLine(resultPreview: string): string | undefined {
  return resultPreview
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
}

function formatStats(d: NotificationDetails): string {
  const parts: string[] = [];
  if (d.turnCount > 0) parts.push(formatTurns(d.turnCount, d.maxTurns));
  if (d.toolUses > 0) parts.push(`${d.toolUses} tool use${d.toolUses === 1 ? "" : "s"}`);
  if (d.totalTokens > 0) parts.push(formatTokens(d.totalTokens));
  if (d.durationMs > 0) parts.push(formatMs(d.durationMs));
  return parts.join(" · ");
}

function formatToastLine(d: NotificationDetails): string {
  let line = `• ${d.description} — ${getStatusText(d.status)}`;
  const stats = formatStats(d);
  if (stats) line += ` (${stats})`;

  const preview = getPreviewLine(d.resultPreview);
  if (preview) line += `\n  ⎿ ${preview}`;

  return line;
}

export function formatSubagentToast(details: NotificationDetails, maxItems = 5): string {
  const all = [details, ...(details.others ?? [])];

  if (all.length === 1) {
    return ["Background agent update", formatToastLine(all[0]).slice(2)].join("\n");
  }

  const lines = [`${all.length} background agent updates`];
  const shown = all.slice(0, maxItems);
  for (const item of shown) lines.push(formatToastLine(item));
  if (all.length > shown.length) lines.push(`• +${all.length - shown.length} more`);
  return lines.join("\n");
}

export function deliverSubagentNotification(
  pi: Pick<ExtensionAPI, "sendMessage">,
  ctx: Pick<ExtensionContext, "hasUI" | "ui"> | undefined,
  payload: { content: string; details: NotificationDetails },
): "ui" | "session" {
  const all = [payload.details, ...(payload.details.others ?? [])];

  if (ctx?.hasUI) {
    ctx.ui.notify(formatSubagentToast(payload.details), getNotifyLevel(all));
    return "ui";
  }

  pi.sendMessage<NotificationDetails>({
    customType: "subagent-notification",
    content: payload.content,
    display: true,
    details: payload.details,
  }, SUBAGENT_NOTIFICATION_OPTIONS);
  return "session";
}
