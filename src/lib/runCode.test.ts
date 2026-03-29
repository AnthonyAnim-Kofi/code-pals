import { describe, it, expect } from "vitest";
import { gradingOutput, consoleLinesFromRun } from "./runCode";

describe("gradingOutput", () => {
  it("prefers stdout over stderr", () => {
    expect(
      gradingOutput({ stdout: "hello", stderr: "warn" }),
    ).toBe("hello");
  });

  it("falls back to stderr when stdout empty", () => {
    expect(gradingOutput({ stdout: "", stderr: "oops" })).toBe("oops");
  });
});

describe("consoleLinesFromRun", () => {
  it("builds output and error lines", () => {
    const lines = consoleLinesFromRun({ stdout: "a", stderr: "b" });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual({ type: "output", text: "a" });
    expect(lines[1]).toEqual({ type: "error", text: "b" });
  });
});
