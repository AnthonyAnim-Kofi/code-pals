import { describe, it, expect } from "vitest";
import { resolveCodeRunnerLanguage, getRunnerFileLabel } from "./codeRunnerLanguage";

describe("resolveCodeRunnerLanguage", () => {
  it("maps curriculum slugs to editor + Piston api", () => {
    const django = resolveCodeRunnerLanguage({ slug: "django", nameFallback: "python" });
    expect(django.editorLanguage).toBe("python");
    expect(django.apiLanguage).toBe("python");

    const cpp = resolveCodeRunnerLanguage({ slug: "cpp", nameFallback: "python" });
    expect(cpp.editorLanguage).toBe("cpp");
    expect(cpp.apiLanguage).toBe("cpp");
    expect(cpp.canRunInSandbox).toBe(true);

    const ts = resolveCodeRunnerLanguage({ slug: "typescript", nameFallback: "typescript" });
    expect(ts.editorLanguage).toBe("typescript");
    expect(ts.apiLanguage).toBe("typescript");

    const angular = resolveCodeRunnerLanguage({ slug: "angular", nameFallback: "Angular" });
    expect(angular.editorLanguage).toBe("typescript");
    expect(angular.apiLanguage).toBe("typescript");
  });

  it("treats html/css as markup preview, not Piston", () => {
    const html = resolveCodeRunnerLanguage({ slug: "html", nameFallback: "html" });
    expect(html.isMarkup).toBe(true);
    expect(html.canRunInSandbox).toBe(false);
  });

  it("disables sandbox for sql/database tracks", () => {
    const sql = resolveCodeRunnerLanguage({ slug: "sql", nameFallback: "SQL" });
    expect(sql.canRunInSandbox).toBe(false);

    const graphql = resolveCodeRunnerLanguage({ slug: "graphql", nameFallback: "GraphQL" });
    expect(graphql.canRunInSandbox).toBe(false);
  });

  it("infers C++ and C# from display name when slug missing", () => {
    const cpp = resolveCodeRunnerLanguage({ slug: "", nameFallback: "c++" });
    expect(cpp.apiLanguage).toBe("cpp");

    const cs = resolveCodeRunnerLanguage({ slug: "", nameFallback: "C#" });
    expect(cs.apiLanguage).toBe("csharp");
  });
});

describe("getRunnerFileLabel", () => {
  it("returns sensible file names", () => {
    expect(getRunnerFileLabel("python")).toBe("main.py");
    expect(getRunnerFileLabel("cpp")).toBe("main.cpp");
    expect(getRunnerFileLabel("kotlin")).toBe("Main.kt");
  });
});
