import { describe, it, expect } from "vitest";
import { parseCSV, parseImportPayload, normalizeQuestionPayload } from "./adminImport";

describe("parseCSV", () => {
  it("parses simple rows", () => {
    const csv = `title,order_index
"A",0
B,1`;
    const rows = parseCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ title: "A", order_index: "0" });
    expect(rows[1]).toEqual({ title: "B", order_index: "1" });
  });

  it("handles escaped quotes", () => {
    const csv = `a,b
"""hello""",x`;
    const rows = parseCSV(csv);
    expect(rows[0]).toEqual({ a: '"hello"', b: "x" });
  });
});

describe("parseImportPayload", () => {
  it("parses JSON array", () => {
    const r = parseImportPayload('[{"x":1}]', "");
    expect(r.ok && r.data).toEqual([{ x: 1 }]);
  });

  it("wraps single JSON object", () => {
    const r = parseImportPayload('{"x":1}', "");
    expect(r.ok && r.data).toEqual([{ x: 1 }]);
  });

  it("rejects invalid JSON", () => {
    const r = parseImportPayload("{", "");
    expect(r.ok).toBe(false);
  });
});

describe("normalizeQuestionPayload", () => {
  it("parses pipe-separated options string", () => {
    const r = normalizeQuestionPayload({
      type: "mc",
      instruction: "Q",
      options: "a|b|c",
      answer: "0",
    });
    expect(r.options).toEqual(["a", "b", "c"]);
  });
});
