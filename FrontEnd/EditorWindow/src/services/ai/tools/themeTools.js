import { defineTool, ok, fail } from "./defineTool";
import { useEditorStore } from "@/store/editorStore";

const MODES = ["light", "dark"];
const TOKEN_GROUPS = ["color", "typography", "spacing", "radius", "shadow"];

/* --- colour maths, so generateTheme is deterministic rather than a guess --- */

function hexToHsl(hex) {
  const clean = String(hex).replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: lightness };

  const delta = max - min;
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;

  return { h: (hue * 60 + 360) % 360, s: saturation, l: lightness };
}

function hslToHex({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const segment = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][segment];
  return `#${[r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}

const shift = (hsl, { h = 0, s = 0, l = 0 }) =>
  hslToHex({
    h: (hsl.h + h + 360) % 360,
    s: Math.min(1, Math.max(0, hsl.s + s)),
    l: Math.min(1, Math.max(0, hsl.l + l)),
  });

/** Named palettes the model can reach for by name. */
export const THEME_PRESETS = {
  violet: { primary: "#2B0A5A", secondary: "#6D28D9" },
  ocean: { primary: "#0C4A6E", secondary: "#0284C7" },
  forest: { primary: "#14532D", secondary: "#16A34A" },
  sunset: { primary: "#7C2D12", secondary: "#EA580C" },
  slate: { primary: "#1E293B", secondary: "#475569" },
  rose: { primary: "#881337", secondary: "#E11D48" },
};

function currentTheme() {
  return useEditorStore.getState().globalTheme;
}

/** Deep-merge into the token tree; updateGlobalTheme is a shallow merge. */
function writeTokens(mode, group, values) {
  const theme = currentTheme();
  const modeTokens = theme.tokens?.[mode] || {};
  useEditorStore.getState().updateGlobalTheme({
    tokens: {
      ...theme.tokens,
      [mode]: { ...modeTokens, [group]: { ...(modeTokens[group] || {}), ...values } },
    },
  });
}

/** Build a full colour set from one base colour, keeping text readable. */
function derivePalette(baseHex, mode) {
  const hsl = hexToHsl(baseHex);
  if (!hsl) return null;
  const dark = mode === "dark";

  return dark
    ? {
        primary: shift(hsl, { l: Math.max(0, 0.62 - hsl.l) }),
        secondary: shift(hsl, { h: 12, l: Math.max(0, 0.72 - hsl.l) }),
        background: shift(hsl, { s: -0.55, l: -hsl.l + 0.07 }),
        canvasBackground: shift(hsl, { s: -0.55, l: -hsl.l + 0.07 }),
        text: "#F3F4F6",
        subtitle: "#9CA3AF",
        badgeBg: shift(hsl, { l: Math.max(0, 0.28 - hsl.l) }),
        badgeText: shift(hsl, { l: Math.max(0, 0.85 - hsl.l) }),
      }
    : {
        primary: baseHex,
        secondary: shift(hsl, { h: 12, l: 0.18 }),
        background: "#FFFFFF",
        canvasBackground: "#FFFFFF",
        text: shift(hsl, { s: -0.25, l: -hsl.l + 0.18 }),
        subtitle: "#64748B",
        badgeBg: shift(hsl, { s: -0.3, l: Math.max(0, 0.93 - hsl.l) }),
        badgeText: shift(hsl, { l: Math.max(0, 0.42 - hsl.l) }),
      };
}

export const applyTheme = defineTool({
  name: "applyTheme",
  description: "Applies a named colour preset to the whole site, in the current or a chosen colour mode.",
  parameters: {
    type: "object",
    properties: {
      preset: { type: "string", enum: Object.keys(THEME_PRESETS), description: `One of: ${Object.keys(THEME_PRESETS).join(", ")}.` },
      mode: { type: "string", enum: MODES, description: "Colour mode to write into. Defaults to the active mode." },
    },
    required: ["preset"],
  },
  execute: ({ preset, mode }) => {
    const chosen = THEME_PRESETS[preset];
    if (!chosen) return fail(`Unknown preset '${preset}'. Available: ${Object.keys(THEME_PRESETS).join(", ")}.`);

    const target = mode || currentTheme().mode || "light";
    const palette = derivePalette(chosen.primary, target);
    writeTokens(target, "color", { ...palette, secondary: chosen.secondary });

    return ok({ preset, mode: target, colors: currentTheme().tokens[target].color });
  },
});

export const updateThemeToken = defineTool({
  name: "updateThemeToken",
  description: "Changes one design token, e.g. the primary colour or the heading size. Everything bound to that token updates.",
  parameters: {
    type: "object",
    properties: {
      group: { type: "string", enum: TOKEN_GROUPS, description: `Token group: ${TOKEN_GROUPS.join(", ")}.` },
      key: { type: "string", description: "Token name inside the group, e.g. 'primary', 'headingSize'." },
      value: { type: "string", description: "New value, e.g. '#2563eb' or '64px'." },
      mode: { type: "string", enum: MODES, description: "Colour mode. Defaults to the active mode." },
    },
    required: ["group", "key", "value"],
  },
  execute: ({ group, key, value, mode }) => {
    if (!TOKEN_GROUPS.includes(group)) return fail(`Unknown token group '${group}'. Expected: ${TOKEN_GROUPS.join(", ")}.`);

    const target = mode || currentTheme().mode || "light";
    const existing = currentTheme().tokens?.[target]?.[group];
    if (!existing) return fail(`No '${group}' tokens exist for mode '${target}'.`);
    if (!(key in existing)) {
      return fail(`Unknown token '${key}' in ${group}. Available: ${Object.keys(existing).join(", ")}.`);
    }

    const previous = existing[key];
    writeTokens(target, group, { [key]: value });
    return ok({ group, key, mode: target, previous, value });
  },
});

export const generateTheme = defineTool({
  name: "generateTheme",
  description: "Builds a full colour palette from one base colour, deriving readable text, background and badge colours.",
  parameters: {
    type: "object",
    properties: {
      baseColor: { type: "string", description: "Base brand colour as hex, e.g. '#2563eb'." },
      mode: { type: "string", enum: MODES, description: "Colour mode to generate for. Defaults to the active mode." },
    },
    required: ["baseColor"],
  },
  execute: ({ baseColor, mode }) => {
    const target = mode || currentTheme().mode || "light";
    const palette = derivePalette(baseColor, target);
    if (!palette) return fail(`'${baseColor}' is not a valid hex colour (expected #rgb or #rrggbb).`);

    writeTokens(target, "color", palette);
    return ok({ baseColor, mode: target, colors: palette });
  },
});

export const switchColorScheme = defineTool({
  name: "switchColorScheme",
  description: "Switches the site between light and dark mode.",
  parameters: {
    type: "object",
    properties: { mode: { type: "string", enum: MODES, description: "Mode to switch to. Omit to toggle." } },
  },
  execute: ({ mode }) => {
    const current = currentTheme().mode || "light";
    const next = mode || (current === "light" ? "dark" : "light");
    if (!MODES.includes(next)) return fail(`Unknown mode '${next}'. Expected: ${MODES.join(", ")}.`);

    useEditorStore.getState().updateGlobalTheme({ mode: next });
    return ok({ previous: current, mode: next });
  },
});

export const themeTools = [applyTheme, updateThemeToken, generateTheme, switchColorScheme];
