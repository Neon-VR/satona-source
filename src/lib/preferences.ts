export function readPreference<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function savePreference(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("satona-preferences"));
}
export const tabPresets = [
  {
    id: "satona",
    title: "Satona",
    domain: "",
    icon: "/satona-logo.png",
    label: "Satona",
  },
  {
    id: "classroom",
    title: "Google Classroom",
    domain: "classroom.google.com",
    label: "Classroom",
  },
  {
    id: "docs",
    title: "Google Docs",
    domain: "docs.google.com",
    label: "Docs",
  },
  { id: "youtube", title: "YouTube", domain: "youtube.com", label: "YouTube" },
  {
    id: "forms",
    title: "Google Forms",
    domain: "docs.google.com/forms",
    label: "Forms",
  },
  {
    id: "forums",
    title: "Google Groups",
    domain: "groups.google.com",
    label: "Forums / Groups",
  },
  { id: "gmail", title: "Gmail", domain: "mail.google.com", label: "Gmail" },
];
export const presetIcon = (preset: (typeof tabPresets)[number]) =>
  preset.icon ||
  `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent("https://" + preset.domain)}&sz=64`;
export function applyPreferences() {
  const identity = readPreference("satona.identity", {
    title: "Satona",
    icon: "/satona-logo.png",
  });
  document.title = identity.title || "Satona";
  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.append(favicon);
  }
  favicon.removeAttribute("type");
  favicon.href = identity.icon || "/satona-logo.png";
  document.documentElement.style.setProperty(
    "--accent",
    readPreference("satona.accent", "#a4f6c1"),
  );
  document.documentElement.dataset.motion = readPreference(
    "satona.motion",
    true,
  )
    ? "on"
    : "off";
}
