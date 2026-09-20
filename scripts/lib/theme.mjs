// Colour system: generates assets/css/tokens.css and measures WCAG contrast for every pair that matters.
// Themes: light, dark, sepia (low brightness), contrast (high contrast), cvd (colour-blind friendly), paper (e-ink).

export function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

export const FAMILY_HUES = {
  blue: [215, 72], red: [358, 70], orange: [26, 88], purple: [268, 55], pink: [322, 62], teal: [178, 72],
  crimson: [342, 62], green: [138, 55], slate: [212, 18], indigo: [244, 60], gold: [44, 92],
};
const FAMILIES = Object.keys(FAMILY_HUES);

// Okabe-Ito inspired, darkened where needed so they hold 4.5:1 on the light background.
const CVD_ACCENT = {
  blue: "#0058a3", red: "#a63c00", orange: "#8f5700", purple: "#7a3f75", pink: "#a1476f", teal: "#00695c",
  crimson: "#8f3a00", green: "#00695c", slate: "#4a5560", indigo: "#2a4aa8", gold: "#7a5c00",
};

const BASE = {
  console: { bg: "#0b0f14", surface: "#121a23", surface2: "#16212c", text: "#d3dde0", muted: "#93a8b5", border: "#5b7383", soft: "#2b3b4a", link: "#6cd5ff", primary: "#4dd6b4", onPrimary: "#05110d", focus: "#ffd166", ok: "#7ee787", bad: "#ff8a8a", warn: "#ffb454", cyan: "#6cd5ff", violet: "#b79cff", scheme: "dark", fam: "dark" },
  terminal: { bg: "#0a0f0a", surface: "#0e160e", surface2: "#0a1c0e", text: "#33ff66", muted: "#5fd47f", border: "#1f8f3f", soft: "#164d24", link: "#55e6ff", primary: "#33ff66", onPrimary: "#041004", focus: "#ffb300", ok: "#7dff9a", bad: "#ff7a7a", warn: "#ffb300", cyan: "#55e6ff", violet: "#d59cff", scheme: "dark", fam: "dark" },
  amber: { bg: "#120c04", surface: "#1a1206", surface2: "#241806", text: "#ffb84d", muted: "#d9a04a", border: "#8a6a2a", soft: "#4a3410", link: "#ffe0a3", primary: "#e39a1b", onPrimary: "#140b00", focus: "#ffffff", ok: "#d9e05a", bad: "#ff8f70", warn: "#ffd27a", cyan: "#ffe0a3", violet: "#ff9d6e", scheme: "dark", fam: "dark" },
  ice: { bg: "#060c14", surface: "#0b1622", surface2: "#0f1f30", text: "#cfe6ff", muted: "#8fb0d0", border: "#4f7fa8", soft: "#234868", link: "#7fe4ff", primary: "#4fb4ff", onPrimary: "#03101c", focus: "#ffcf7a", ok: "#79e6c1", bad: "#ff8fa0", warn: "#ffcf7a", cyan: "#7fe4ff", violet: "#a9a2ff", scheme: "dark", fam: "dark" },
  light: { bg: "#fbfaf7", surface: "#ffffff", surface2: "#f1efe9", text: "#1b1c20", muted: "#4b4d55", border: "#6f7079", soft: "#d6d3ca", link: "#0a4fbd", primary: "#0a4fbd", onPrimary: "#ffffff", focus: "#0a4fbd", ok: "#0b6b3a", bad: "#b3261e", warn: "#7a5000", cyan: "#00607f", violet: "#5b3fb0", scheme: "light", fam: "light" },
  sepia: { bg: "#efe2c6", surface: "#f6ecd5", surface2: "#e6d6b3", text: "#3a2d18", muted: "#57452a", border: "#75633f", soft: "#cbb88f", link: "#6b3200", primary: "#5d3a0a", onPrimary: "#fbf3e0", focus: "#6b3200", ok: "#2f5d1f", bad: "#8f2a1a", warn: "#6b4a00", cyan: "#0a5060", violet: "#5a3a8a", scheme: "light", fam: "sepia" },
  contrast: { bg: "#000000", surface: "#000000", surface2: "#101010", text: "#ffffff", muted: "#eaeaea", border: "#ffffff", soft: "#9a9a9a", link: "#ffe14d", primary: "#ffe14d", onPrimary: "#000000", focus: "#7dd3ff", ok: "#7dff9a", bad: "#ff9c9c", warn: "#ffd24d", cyan: "#7dd3ff", violet: "#d6b8ff", scheme: "dark", fam: "contrast" },
  cvd: { bg: "#fbfaf7", surface: "#ffffff", surface2: "#f1efe9", text: "#1b1c20", muted: "#4b4d55", border: "#6f7079", soft: "#d6d3ca", link: "#0058a3", primary: "#0058a3", onPrimary: "#ffffff", focus: "#0058a3", ok: "#0058a3", bad: "#a63c00", warn: "#7a5000", cyan: "#00607f", violet: "#7a3f75", scheme: "light", fam: "cvd" },
  paper: { bg: "#ffffff", surface: "#ffffff", surface2: "#ffffff", text: "#000000", muted: "#000000", border: "#000000", soft: "#000000", link: "#000000", primary: "#000000", onPrimary: "#ffffff", focus: "#000000", ok: "#000000", bad: "#000000", warn: "#000000", cyan: "#000000", violet: "#000000", scheme: "light", fam: "paper" },
};

function family(theme, name) {
  const [h, s] = FAMILY_HUES[name];
  switch (theme) {
    case "light": return { accent: hslToHex(h, s, 26), tint: hslToHex(h, 55, 95), ink: hslToHex(h, 60, 15) };
    case "dark": return { accent: hslToHex(h, Math.round(s * 0.9), 72), tint: hslToHex(h, 28, 17), ink: hslToHex(h, 40, 92) };
    case "sepia": return { accent: hslToHex(h, Math.round(s * 0.6), 24), tint: hslToHex(h, 32, 86), ink: hslToHex(h, 40, 13) };
    case "contrast": return { accent: hslToHex(h, 100, 72), tint: "#000000", ink: "#ffffff" };
    case "cvd": return { accent: CVD_ACCENT[name], tint: hslToHex(h, 30, 95), ink: "#1b1c20" };
    case "paper": return { accent: "#000000", tint: "#ffffff", ink: "#000000" };
  }
}

export function buildThemes() {
  const themes = {};
  for (const [name, base] of Object.entries(BASE)) {
    const fams = {};
    for (const f of FAMILIES) fams[f] = family(base.fam, f);
    themes[name] = { ...base, fams };
  }
  return themes;
}

function decls(t) {
  const lines = [
    `color-scheme:${t.scheme}`,
    `--bg:${t.bg}`, `--surface:${t.surface}`, `--surface2:${t.surface2}`, `--text:${t.text}`, `--muted:${t.muted}`,
    `--border:${t.border}`, `--soft:${t.soft}`, `--link:${t.link}`, `--primary:${t.primary}`, `--on-primary:${t.onPrimary}`,
    `--focus:${t.focus}`, `--ok:${t.ok}`, `--bad:${t.bad}`, `--warn:${t.warn}`, `--cyan:${t.cyan}`, `--violet:${t.violet}`,
  ];
  for (const [f, c] of Object.entries(t.fams)) lines.push(`--f-${f}:${c.accent}`, `--f-${f}-bg:${c.tint}`, `--f-${f}-ink:${c.ink}`);
  return lines.join(";");
}

export function tokensCss() {
  const T = buildThemes();
  let css = "/* generated by scripts/lib/theme.mjs - do not edit */\n";
  css += `:root{${decls(T.console)}}\n`; // the default look: colourful console
  css += `@media (prefers-contrast:more){:root:not([data-theme]){${decls(T.contrast)}}}\n`;
  for (const name of Object.keys(T)) css += `:root[data-theme="${name}"]{${decls(T[name])}}\n`;
  return css;
}

/** Returns [{theme, pair, ratio, min, ok}] for every checked pair. */
export function contrastReport() {
  const T = buildThemes();
  const rows = [];
  const add = (theme, pair, a, b, min) => {
    const r = contrast(a, b);
    rows.push({ theme, pair, ratio: Math.round(r * 100) / 100, min, ok: r >= min });
  };
  for (const [name, t] of Object.entries(T)) {
    for (const bg of ["bg", "surface", "surface2"]) {
      add(name, `text on ${bg}`, t.text, t[bg], 7);
      add(name, `muted on ${bg}`, t.muted, t[bg], 4.5);
      add(name, `link on ${bg}`, t.link, t[bg], 4.5);
      add(name, `ok on ${bg}`, t.ok, t[bg], 4.5);
      add(name, `bad on ${bg}`, t.bad, t[bg], 4.5);
      add(name, `warn on ${bg}`, t.warn, t[bg], 4.5);
    }
    add(name, "on-primary on primary", t.onPrimary, t.primary, 4.5);
    for (const c of ["cyan", "violet", "warn", "ok"]) { add(name, `${c} (reference colour) on bg`, t[c], t.bg, 4.5); add(name, `${c} (reference colour) on surface`, t[c], t.surface, 4.5); }
    add(name, "border on bg (UI boundary)", t.border, t.bg, 3);
    add(name, "border on surface (UI boundary)", t.border, t.surface, 3);
    add(name, "focus ring on bg", t.focus, t.bg, 3);
    add(name, "focus ring on surface", t.focus, t.surface, 3);
    for (const [f, c] of Object.entries(t.fams)) {
      add(name, `family ${f}: accent on bg`, c.accent, t.bg, 4.5);
      add(name, `family ${f}: accent on surface`, c.accent, t.surface, 4.5);
      add(name, `family ${f}: ink on tint`, c.ink, c.tint, 7);
      add(name, `family ${f}: accent on tint`, c.accent, c.tint, 4.5);
    }
  }
  return rows;
}
