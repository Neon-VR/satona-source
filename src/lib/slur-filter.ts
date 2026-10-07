// Targeted identity-based slurs only. Ordinary profanity is deliberately allowed.
// Word boundaries avoid matching unrelated words such as "raccoon" or "spice".
const terms = [
  "nigger",
  "nigga",
  "faggot",
  "kike",
  "chink",
  "spic",
  "wetback",
  "gook",
  "tranny",
  "coon",
  "raghead",
  "towelhead",
  "retard",
];
const substitutions: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  "!": "i",
};
const pattern = new RegExp(
  `(?:^|[^a-z])(?:${terms.map((term) => term.split("").join("[\\W_]*")).join("|")})(?:s)?(?=$|[^a-z])`,
  "i",
);
export function containsSlur(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u200b-\u200f\ufeff]/g, "")
    .toLowerCase()
    .replace(/[013457@$!]/g, (character) => substitutions[character]);
  return pattern.test(normalized);
}
export function displayChatText(value: string, name = false) {
  return containsSlur(value)
    ? name
      ? "Filtered name"
      : "[Message hidden: contains a slur]"
    : value;
}
