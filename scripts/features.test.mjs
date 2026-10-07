import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
async function moduleAt(path) {
  return import(
    "data:text/javascript;base64," +
      Buffer.from(
        ts.transpile(fs.readFileSync(new URL(path, import.meta.url), "utf8"), {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ES2022,
        }),
      ).toString("base64")
  );
}
const { containsSlur, displayChatText } = await moduleAt(
  "../src/lib/slur-filter.ts",
);
const { youtubeVideoId } = await moduleAt("../src/lib/video.ts");
test("slur filter rejects case, leetspeak, separators and invisible characters", () => {
  for (const input of [
    "NIGGER",
    "n1gg3r",
    "n.i.g.g.e.r",
    "n\u200bigga",
    "faggots",
  ])
    assert.equal(containsSlur(input), true, input);
});
test("ordinary profanity and innocent substrings stay readable", () => {
  for (const input of [
    "fuck this shit",
    "damn, that was good",
    "raccoon",
    "spice",
    "Nigeria",
    "hello everyone",
    "classroom",
  ])
    assert.equal(containsSlur(input), false, input);
});
test("incoming names and messages are filtered too", () => {
  assert.equal(displayChatText("nigga", true), "Filtered name");
  assert.equal(
    displayChatText("hello nigga"),
    "[Message hidden: contains a slur]",
  );
  assert.equal(displayChatText("damn"), "damn");
});
test("watch links, short links, Shorts and IDs are recognized", () => {
  for (const input of [
    "M7lc1UVf-VE",
    "https://youtu.be/M7lc1UVf-VE?t=5",
    "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    "https://www.youtube.com/shorts/M7lc1UVf-VE",
  ])
    assert.equal(youtubeVideoId(input), "M7lc1UVf-VE");
});
test("unrelated websites and malformed video links are rejected", () => {
  for (const input of [
    "https://evil.test/watch?v=M7lc1UVf-VE",
    "not a link",
    "javascript:M7lc1UVf-VE",
    "https://youtube.com/watch?v=123",
  ])
    assert.equal(youtubeVideoId(input), null);
});
