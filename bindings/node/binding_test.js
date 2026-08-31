import assert from "node:assert";
import { test } from "node:test";
import Parser from "tree-sitter";

test("can load grammar and parse representative syntax", async () => {
  const parser = new Parser();
  const { default: language } = await import("./index.js");
  assert.doesNotThrow(() => parser.setLanguage(language));

  const source = `#[annotations()]
fun reveal[T](value: ^T) T {
  ret value:^T;
}`;
  const tree = parser.parse(source);

  assert.equal(tree.rootNode.hasError, false, tree.rootNode.toString());
});
