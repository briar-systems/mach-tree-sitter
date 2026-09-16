// parses the pinned mach release with this grammar and checks the type-operand
// intrinsic list against the compiler. MACH_SRC points at a local source tree
// instead of fetching the release
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { TYPE_OPERAND_INTRINSICS } from "../intrinsics.js";

const root = new URL("..", import.meta.url).pathname;
const version = readFileSync(join(root, ".mach-version"), "utf8").trim();
const excluded = [join("test", "fuzz") + sep];

function fetchRelease(ver) {
    const dir = mkdtempSync(join(tmpdir(), "mach-src-"));
    const url = `https://codeload.github.com/briar-systems/mach/tar.gz/refs/tags/v${ver}`;
    const res = execFileSync("curl", ["-fsSL", "--retry", "3", url], { maxBuffer: 1 << 30 });
    execFileSync("tar", ["-xz", "-C", dir, "--strip-components=1"], { input: res });
    return dir;
}

function machFiles(dir) {
    return readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile() && e.name.endsWith(".mach"))
        .map((e) => join(e.parentPath, e.name))
        .filter((p) => !excluded.some((x) => relative(dir, p).startsWith(x)));
}

function parseFailures(dir, files) {
    const list = join(mkdtempSync(join(tmpdir(), "mach-paths-")), "paths.txt");
    writeFileSync(list, files.join("\n") + "\n");
    let out;
    try {
        out = execFileSync("tree-sitter", ["parse", "--quiet", "--paths", list], { encoding: "utf8", maxBuffer: 1 << 28 });
    } catch (e) {
        // the cli exits non-zero when any file has an error node
        out = e.stdout ?? "";
        if (!out) throw e;
    }
    return out
        .split("\n")
        .filter((l) => /\((ERROR|MISSING)\b/.test(l))
        .map((l) => relative(dir, l.split(/\s+/)[0]) + "  " + l.slice(l.lastIndexOf("(")));
}

function compilerIntrinsics(dir) {
    const path = join(dir, "src", "lang", "fe", "comptime.mach");
    const body = readFileSync(path, "utf8").match(/fun intrinsic_takes_type_operand\b[^{]*\{([\s\S]*?)\n\}/);
    if (!body) throw new Error(`intrinsic_takes_type_operand not found in ${relative(dir, path)}`);
    const names = [...body[1].matchAll(/view_eq_str\(\s*text\s*,\s*"([^"]+)"\s*\)/g)].map((m) => m[1]);
    if (names.length === 0) throw new Error("intrinsic_takes_type_operand lists no names");
    return names;
}

const dir = process.env.MACH_SRC || fetchRelease(version);
console.log(`mach ${process.env.MACH_SRC ? `source at ${dir}` : `v${version}`}`);
let failed = false;

const files = machFiles(dir);
const failures = parseFailures(dir, files);
console.log(`parse: ${files.length - failures.length}/${files.length} files clean`);
for (const f of failures) console.log(`  ${f}`);
failed ||= failures.length > 0;

const compiler = new Set(compilerIntrinsics(dir));
const grammar = new Set(TYPE_OPERAND_INTRINSICS);
const missing = [...compiler].filter((n) => !grammar.has(n));
const extra = [...grammar].filter((n) => !compiler.has(n));
console.log(`type-operand intrinsics: ${compiler.size} in compiler, ${grammar.size} in grammar`);
if (missing.length) console.log(`  missing from intrinsics.js: ${missing.join(", ")}`);
if (extra.length) console.log(`  not in the compiler: ${extra.join(", ")}`);
failed ||= missing.length > 0 || extra.length > 0;

process.exit(failed ? 1 : 0);
