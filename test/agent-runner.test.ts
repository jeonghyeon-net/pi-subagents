import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAgentSession, inMemorySessionManager, createSettingsManager, getAgentDir, loaderReload, loaderCtor } = vi.hoisted(() => ({
  createAgentSession: vi.fn(),
  inMemorySessionManager: vi.fn(() => ({ kind: "memory-session-manager" })),
  createSettingsManager: vi.fn(() => ({ kind: "settings-manager" })),
  getAgentDir: vi.fn(() => "/home/test/.pi/agent"),
  loaderReload: vi.fn(async () => {}),
  loaderCtor: vi.fn(),
}));

vi.mock("@mariozechner/pi-coding-agent", () => ({
  createAgentSession,
  DefaultResourceLoader: class {
    constructor(options: any) {
      loaderCtor(options);
    }
    async reload() {
      return loaderReload();
    }
  },
  getAgentDir,
  SessionManager: { inMemory: inMemorySessionManager },
  SettingsManager: { create: createSettingsManager },
}));

vi.mock("../src/agent-types.js", () => ({
  getConfig: vi.fn(() => ({
    displayName: "Explore",
    description: "Explore",
    builtinToolNames: ["read"],
    extensions: false,
    skills: false,
    promptMode: "replace",
  })),
  getAgentConfig: vi.fn(() => ({
    name: "Explore",
    description: "Explore",
    builtinToolNames: ["read"],
    extensions: false,
    skills: false,
    systemPrompt: "You are Explore.",
    promptMode: "replace",
    inheritContext: false,
    runInBackground: false,
    isolated: false,
  })),
  getMemoryTools: vi.fn(() => []),
  getReadOnlyMemoryTools: vi.fn(() => []),
  getToolsForType: vi.fn(() => [{ name: "read" }]),
}));

vi.mock("../src/env.js", () => ({
  detectEnv: vi.fn(async () => ({ isGitRepo: false, branch: "", platform: "linux" })),
}));

vi.mock("../src/prompts.js", () => ({
  buildAgentPrompt: vi.fn(() => "system prompt"),
}));

vi.mock("../src/memory.js", () => ({
  buildMemoryBlock: vi.fn(() => ""),
  buildReadOnlyMemoryBlock: vi.fn(() => ""),
}));

vi.mock("../src/skill-loader.js", () => ({
  preloadSkills: vi.fn(() => []),
}));

import { resumeAgent, runAgent } from "../src/agent-runner.js";

function createSession(finalText: string) {
  const listeners: Array<(event: any) => void> = [];
  const session = {
    messages: [] as any[],
    subscribe: vi.fn((listener: (event: any) => void) => {
      listeners.push(listener);
      return () => {};
    }),
    prompt: vi.fn(async () => {
      session.messages.push({
        role: "assistant",
        content: [{ type: "text", text: finalText }],
      });
    }),
    abort: vi.fn(),
    steer: vi.fn(),
    getActiveToolNames: vi.fn(() => ["read"]),
    setActiveToolsByName: vi.fn(),
    bindExtensions: vi.fn(async () => {}),
  };
  return { session, listeners };
}

const ctx = {
  cwd: "/tmp",
  model: undefined,
  modelRegistry: { find: vi.fn(), getAvailable: vi.fn(() => []) },
  getSystemPrompt: vi.fn(() => "parent prompt"),
  sessionManager: { getBranch: vi.fn(() => []) },
} as any;

const pi = {} as any;

beforeEach(() => {
  createAgentSession.mockReset();
  inMemorySessionManager.mockClear();
  createSettingsManager.mockClear();
  getAgentDir.mockClear();
  loaderReload.mockClear();
  loaderCtor.mockClear();
});

describe("agent-runner final output capture", () => {
  it("returns the final assistant text even when no text_delta events were streamed", async () => {
    const { session } = createSession("LOCKED");
    createAgentSession.mockResolvedValue({ session });

    const result = await runAgent(ctx, "Explore", "Say LOCKED", { pi });

    expect(result.responseText).toBe("LOCKED");
  });

  it("passes explicit cwd and agentDir into settings/resource loading and does not pass Tool instances to createAgentSession", async () => {
    const { session } = createSession("BOUND");
    createAgentSession.mockResolvedValue({ session });

    await runAgent(ctx, "Explore", "Say BOUND", { pi });

    expect(getAgentDir).toHaveBeenCalledTimes(1);
    expect(createSettingsManager).toHaveBeenCalledWith("/tmp", "/home/test/.pi/agent");
    expect(loaderCtor).toHaveBeenCalledWith(expect.objectContaining({
      cwd: "/tmp",
      agentDir: "/home/test/.pi/agent",
      settingsManager: { kind: "settings-manager" },
      systemPromptOverride: expect.any(Function),
    }));
    expect(inMemorySessionManager).toHaveBeenCalledWith("/tmp");
    expect(createAgentSession).toHaveBeenCalledWith(expect.objectContaining({
      cwd: "/tmp",
      settingsManager: { kind: "settings-manager" },
      sessionManager: { kind: "memory-session-manager" },
      resourceLoader: expect.any(Object),
    }));
    expect(createAgentSession.mock.calls[0][0]).not.toHaveProperty("tools");
  });

  it("binds extensions before prompting", async () => {
    const { session } = createSession("BOUND");
    createAgentSession.mockResolvedValue({ session });

    await runAgent(ctx, "Explore", "Say BOUND", { pi });

    expect(session.bindExtensions).toHaveBeenCalledTimes(1);
    expect(session.bindExtensions).toHaveBeenCalledWith(
      expect.objectContaining({ onError: expect.any(Function) }),
    );

    const bindOrder = session.bindExtensions.mock.invocationCallOrder[0];
    const promptOrder = session.prompt.mock.invocationCallOrder[0];
    expect(bindOrder).toBeLessThan(promptOrder);
  });

  it("resumeAgent also falls back to the final assistant message text", async () => {
    const { session } = createSession("RESUMED");

    const result = await resumeAgent(session as any, "Continue");

    expect(result).toBe("RESUMED");
  });
});
