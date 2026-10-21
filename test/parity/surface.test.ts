import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as vue from "../../index";
import * as react from "../../vendor/upstream/packages/streamdown/index.tsx";

function props(file: string, name: string) {
  const source = ts.createSourceFile(
    file,
    readFileSync(new URL(file, import.meta.url), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = source.statements.find(
    (node) => ts.isTypeAliasDeclaration(node) && node.name.text === name,
  ) as ts.TypeAliasDeclaration;
  const parts = ts.isIntersectionTypeNode(declaration.type)
    ? declaration.type.types
    : [declaration.type];
  return parts
    .filter(ts.isTypeLiteralNode)
    .flatMap((type) =>
      type.members
        .filter(ts.isPropertySignature)
        .map((property) => property.name.getText(source)),
    );
}

describe("upstream public surface", () => {
  it("exports every upstream public type", () => {
    const names = (file: string) => {
      const source = ts.createSourceFile(
        file,
        readFileSync(new URL(file, import.meta.url), "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX,
      );
      const result = new Set<string>();
      for (const node of source.statements) {
        if (
          ts.isExportDeclaration(node) &&
          node.exportClause &&
          ts.isNamedExports(node.exportClause)
        ) {
          for (const item of node.exportClause.elements) {
            if (node.isTypeOnly || item.isTypeOnly) result.add(item.name.text);
          }
        } else if (
          (ts.isInterfaceDeclaration(node) ||
            ts.isTypeAliasDeclaration(node)) &&
          node.modifiers?.some(
            (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
          )
        )
          result.add(node.name.text);
      }
      return result;
    };
    const upstream = names(
      "../../vendor/upstream/packages/streamdown/index.tsx",
    );
    const native = names("../../index.ts");
    for (const name of upstream)
      expect(native, `public type: ${name}`).toContain(name);
  });
  it("exports every upstream runtime symbol", () => {
    for (const name of Object.keys(react))
      expect(vue, name).toHaveProperty(name);
  });
  it("accepts every inherited Markdown pipeline option", () => {
    const keys = (file: string) => {
      const source = ts.createSourceFile(
        file,
        readFileSync(new URL(file, import.meta.url), "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      const declaration = source.statements.find(
        (node) =>
          ts.isInterfaceDeclaration(node) && node.name.text === "Options",
      ) as ts.InterfaceDeclaration;
      return declaration.members
        .filter(ts.isPropertySignature)
        .map((property) => property.name.getText(source));
    };
    const upstream = keys(
      "../../vendor/upstream/packages/streamdown/lib/markdown.ts",
    );
    const native = keys("../../lib/markdown.ts");
    expect(upstream.length).toBeGreaterThan(10);
    for (const name of upstream) {
      expect(native, name).toContain(name);
      expect((vue.Streamdown as any).props, name).toHaveProperty(name);
      if (name !== "children")
        expect((vue.Block as any).props, name).toHaveProperty(name);
    }
  });
  it("declares and accepts every upstream Streamdown-specific option", () => {
    const upstream = props(
      "../../vendor/upstream/packages/streamdown/index.tsx",
      "StreamdownProps",
    );
    const native = props("../../lib/types.ts", "StreamdownProps");
    expect(upstream.length).toBeGreaterThanOrEqual(30);
    for (const name of upstream) {
      expect(native, `public type: ${name}`).toContain(name);
      expect(
        (vue.Streamdown as any).props,
        `runtime prop: ${name}`,
      ).toHaveProperty(name);
    }
  });
});
