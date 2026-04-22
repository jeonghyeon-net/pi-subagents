import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createOutputFilePath } from "../src/output-file.js";

const root = join(tmpdir(), `pi-subagents-${process.getuid?.() ?? 0}`);

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("createOutputFilePath", () => {
  it("encodes Windows cwd safely into a relative path segment", () => {
    const outputPath = createOutputFilePath("C:\\Users\\foo\\project", "agent-1", "session-1");

    expect(outputPath).toContain(join("Users-foo-project", "session-1", "tasks", "agent-1.output"));
    expect(outputPath).not.toContain("C:\\Users\\foo\\project");
    expect(existsSync(root)).toBe(true);
  });

  it("keeps POSIX cwd encoding stable", () => {
    const outputPath = createOutputFilePath("/home/user/project", "agent-2", "session-2");

    expect(outputPath).toContain(join("home-user-project", "session-2", "tasks", "agent-2.output"));
    expect(existsSync(root)).toBe(true);
  });
});
