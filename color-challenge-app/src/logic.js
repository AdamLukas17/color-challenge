/* ─── Constants ─── */
export const MIN_SATURATION = 0.15; // skip near-gray pixels

export const DIFFICULTY = {
  easy: { label: "Easy", photos: 3, hueTolerance: 25, satTolerance: 0.55, lightTolerance: 0.45, threshold: 2, emoji: "\u{1F60A}", desc: "Wide color tolerance, 3 photos" },
  hard: { label: "Hard", photos: 5, hueTolerance: 15, satTolerance: 0.35, lightTolerance: 0.3, threshold: 4, emoji: "\u{1F525}", desc: "Tight color tolerance, 5 photos" },
  pro: { label: "Pro", photos: 1, hueTolerance: 8, satTolerance: 0.2, lightTolerance: 0.18, threshold: 5, emoji: "\u{25C6}", desc: "Tightest tolerance, 1 photo" },
};

/* ─── Curated Color Palette (~100 interesting, photographable colors) ─── */
export const PALETTE = [
  { hex: "#E63946", name: "Crimson" },
  { hex: "#F4A261", name: "Sandy Orange" },
  { hex: "#E9C46A", name: "Maize" },
  { hex: "#2A9D8F", name: "Teal" },
  { hex: "#264653", name: "Dark Slate" },
  { hex: "#606C38", name: "Olive" },
  { hex: "#DDA15E", name: "Tan" },
  { hex: "#BC6C25", name: "Sienna" },
  { hex: "#0077B6", name: "Ocean Blue" },
  { hex: "#00B4D8", name: "Sky Blue" },
  { hex: "#90E0EF", name: "Powder Blue" },
  { hex: "#F72585", name: "Hot Pink" },
  { hex: "#7209B7", name: "Purple" },
  { hex: "#3A0CA3", name: "Indigo" },
  { hex: "#4361EE", name: "Royal Blue" },
  { hex: "#4CC9F0", name: "Cyan" },
  { hex: "#FF6B6B", name: "Coral" },
  { hex: "#C44536", name: "Rust" },
  { hex: "#772E25", name: "Mahogany" },
  { hex: "#197278", name: "Deep Teal" },
  { hex: "#EDDDD4", name: "Linen" },
  { hex: "#283D3B", name: "Pine" },
  { hex: "#C8B88A", name: "Khaki" },
  { hex: "#7F5539", name: "Saddle Brown" },
  { hex: "#B7B7A4", name: "Sage" },
  { hex: "#FFE066", name: "Sunflower" },
  { hex: "#06D6A0", name: "Mint Green" },
  { hex: "#118AB2", name: "Cerulean" },
  { hex: "#073B4C", name: "Midnight Blue" },
  { hex: "#EF476F", name: "Watermelon" },
  { hex: "#FFD166", name: "Goldenrod" },
  { hex: "#8338EC", name: "Violet" },
  { hex: "#FF006E", name: "Magenta" },
  { hex: "#FB5607", name: "Blaze Orange" },
  { hex: "#FFBE0B", name: "Amber" },
  { hex: "#3A86A7", name: "Steel Blue" },
  { hex: "#8AC926", name: "Lime Green" },
  { hex: "#1982C4", name: "Dodger Blue" },
  { hex: "#6A4C93", name: "Plum" },
  { hex: "#F94144", name: "Red" },
  { hex: "#F3722C", name: "Tangerine" },
  { hex: "#F8961E", name: "Apricot" },
  { hex: "#F9844A", name: "Peach" },
  { hex: "#F9C74F", name: "Butter" },
  { hex: "#90BE6D", name: "Pistachio" },
  { hex: "#43AA8B", name: "Jade" },
  { hex: "#4D908E", name: "Sea Green" },
  { hex: "#577590", name: "Blue Grey" },
  { hex: "#277DA1", name: "Marine" },
  { hex: "#DEAAFF", name: "Lavender" },
  { hex: "#B8E0D2", name: "Seafoam" },
  { hex: "#D6CCC2", name: "Warm Grey" },
  { hex: "#F5EBE0", name: "Cream" },
  { hex: "#D5C6E0", name: "Lilac" },
  { hex: "#AAD8B0", name: "Celadon" },
  { hex: "#FF9F1C", name: "Marigold" },
  { hex: "#2EC4B6", name: "Turquoise" },
  { hex: "#E71D36", name: "Cherry" },
  { hex: "#011627", name: "Navy" },
  { hex: "#FDFFFC", name: "Snow White" },
  { hex: "#41EAD4", name: "Aqua" },
  { hex: "#F0A6CA", name: "Rose" },
  { hex: "#B8BEDD", name: "Periwinkle" },
  { hex: "#9C89B8", name: "Wisteria" },
  { hex: "#F0E6EF", name: "Thistle" },
  { hex: "#EFC3E6", name: "Orchid Pink" },
  { hex: "#A4C3B2", name: "Eucalyptus" },
  { hex: "#CCE3DE", name: "Mint Cream" },
  { hex: "#6B9080", name: "Fern" },
  { hex: "#FF4D6D", name: "Flamingo" },
  { hex: "#FF758F", name: "Salmon Pink" },
  { hex: "#C9184A", name: "Raspberry" },
  { hex: "#590D22", name: "Burgundy" },
  { hex: "#FEC89A", name: "Peach Puff" },
  { hex: "#FFD6A5", name: "Cantaloupe" },
  { hex: "#CAFFBF", name: "Honeydew" },
  { hex: "#9BF6FF", name: "Ice Blue" },
  { hex: "#A0C4FF", name: "Baby Blue" },
  { hex: "#BDB2FF", name: "Soft Violet" },
  { hex: "#FFC6FF", name: "Pink Lace" },
  { hex: "#386641", name: "Forest" },
  { hex: "#6A994E", name: "Moss" },
  { hex: "#A7C957", name: "Chartreuse" },
  { hex: "#BC4749", name: "Brick Red" },
  { hex: "#2B2D42", name: "Gunmetal" },
  { hex: "#8D99AE", name: "Cool Grey" },
  { hex: "#EF233C", name: "Scarlet" },
  { hex: "#D90429", name: "Vermillion" },
  { hex: "#FCA311", name: "Saffron" },
  { hex: "#14213D", name: "Oxford Blue" },
  { hex: "#E5E5E5", name: "Silver" },
  { hex: "#CDB4DB", name: "Pastel Purple" },
  { hex: "#FFC8DD", name: "Cotton Candy" },
  { hex: "#FFAFCC", name: "Blush" },
  { hex: "#BDE0FE", name: "Light Sky" },
  { hex: "#A2D2FF", name: "Cornflower" },
  { hex: "#FFB703", name: "Turmeric" },
  { hex: "#FB8500", name: "Pumpkin" },
  { hex: "#023047", name: "Prussian Blue" },
  { hex: "#219EBC", name: "Pacific Blue" },
  { hex: "#8ECAE6", name: "Columbia Blue" },
];

/* ─── Palette versioning (freeze-forward) ───
 * Adding colors changes getColorForDate's output for EVERY date, because the
 * index is seeded by palette length. To avoid retroactively changing the color
 * on days users already played, new colors only take effect from CUTOVER_MONTH
 * onward. Months before the cutover keep drawing from the original palette
 * (PALETTE), so every past and current-month color is frozen.
 * Keep this logic and the palette arrays identical across web / Android /
 * iOS app / iOS widget. */
export const CUTOVER_MONTH = "2026-11"; // YYYY-MM; new colors take effect this month

// New colors for the Nov 2026 update are appended here (never reordered).
// Empty until the palette-expansion step lands.
export const PALETTE_ADDITIONS = [
  { hex: "#8E0B21", name: "Oxblood" },
  { hex: "#993344", name: "Garnet" },
  { hex: "#AB2521", name: "Maroon" },
  { hex: "#EC3013", name: "Carmine" },
  { hex: "#CC6677", name: "Ruby" },
  { hex: "#DE6654", name: "Poppy" },
  { hex: "#D98C99", name: "Candy Apple" },
  { hex: "#8E320B", name: "Umber" },
  { hex: "#8E5E0B", name: "Terracotta" },
  { hex: "#BD430F", name: "Copper" },
  { hex: "#996B33", name: "Persimmon" },
  { hex: "#BF8640", name: "Ember" },
  { hex: "#D69729", name: "Clementine" },
  { hex: "#8E7C0B", name: "Bronze" },
  { hex: "#BD870F", name: "Caramel" },
  { hex: "#998B33", name: "Ochre" },
  { hex: "#BDA60F", name: "Brass" },
  { hex: "#BFA740", name: "Mustard" },
  { hex: "#D6B529", name: "Honey" },
  { hex: "#A2AB21", name: "Dijon" },
  { hex: "#ECDA13", name: "Citrine" },
  { hex: "#D3D629", name: "Harvest" },
  { hex: "#F0E142", name: "Dandelion" },
  { hex: "#CACC66", name: "Lemon" },
  { hex: "#D9D28C", name: "Canary" },
  { hex: "#72AB21", name: "Avocado" },
  { hex: "#B6EC13", name: "Lemongrass" },
  { hex: "#80EC13", name: "Pear" },
  { hex: "#C4F042", name: "Citron" },
  { hex: "#99F042", name: "Wasabi" },
  { hex: "#DEF471", name: "Celery" },
  { hex: "#66BF40", name: "Fir" },
  { hex: "#54EC13", name: "Hunter" },
  { hex: "#40BF40", name: "Malachite" },
  { hex: "#29D629", name: "Emerald" },
  { hex: "#13EC13", name: "Shamrock" },
  { hex: "#40BF66", name: "Kelly" },
  { hex: "#13EC54", name: "Clover" },
  { hex: "#339961", name: "Spruce" },
  { hex: "#0FBD5D", name: "Viridian" },
  { hex: "#29D682", name: "Myrtle" },
  { hex: "#66CC94", name: "Spearmint" },
  { hex: "#42F090", name: "Verdant" },
  { hex: "#7EE7AD", name: "Parakeet" },
  { hex: "#0FBDB7", name: "Deepwater" },
  { hex: "#13ECCB", name: "Lagoon" },
  { hex: "#29D6D0", name: "Verdigris" },
  { hex: "#13E6EC", name: "Peacock" },
  { hex: "#66CCBD", name: "Patina" },
  { hex: "#7EE7D7", name: "Oasis" },
  { hex: "#71F4EF", name: "Caribbean" },
  { hex: "#0B818E", name: "Deep Cyan" },
  { hex: "#40ACBF", name: "Glacier" },
  { hex: "#29B4D6", name: "Capri" },
  { hex: "#13C1EC", name: "Tiffany" },
  { hex: "#66ADCC", name: "Robin Egg" },
  { hex: "#71D3F4", name: "Celeste" },
  { hex: "#335E99", name: "Deep Azure" },
  { hex: "#0F58BD", name: "Azure" },
  { hex: "#1393EC", name: "Larkspur" },
  { hex: "#136DEC", name: "Denim" },
  { hex: "#429FF0", name: "Cornflower Blue" },
  { hex: "#71AFF4", name: "Bluebell" },
  { hex: "#184081", name: "Sapphire" },
  { hex: "#2137AB", name: "Cobalt" },
  { hex: "#4067BF", name: "Admiral" },
  { hex: "#1346EC", name: "Zaffre" },
  { hex: "#6685CC", name: "Lapis" },
  { hex: "#8CA4D9", name: "Blueberry" },
  { hex: "#7186F4", name: "Danube" },
  { hex: "#180FBD", name: "Inkwell" },
  { hex: "#473399", name: "Ultramarine" },
  { hex: "#4640BF", name: "Iris" },
  { hex: "#3129D6", name: "Delphinium" },
  { hex: "#4F13EC", name: "Hyacinth" },
  { hex: "#6C40BF", name: "Blue Violet" },
  { hex: "#9213EC", name: "Blackberry" },
  { hex: "#9440BF", name: "Grape" },
  { hex: "#A829D6", name: "Amethyst" },
  { hex: "#9266CC", name: "Heather" },
  { hex: "#AF54DE", name: "Mauve" },
  { hex: "#AC7EE7", name: "Orchid" },
  { hex: "#8A3399", name: "Eggplant" },
  { hex: "#A921AB", name: "Aubergine" },
  { hex: "#CB13EC", name: "Byzantium" },
  { hex: "#BD40BF", name: "Royal Purple" },
  { hex: "#D642F0", name: "Mulberry" },
  { hex: "#CC66C7", name: "Pansy" },
  { hex: "#BD0F90", name: "Wine Berry" },
  { hex: "#99336F", name: "Cerise" },
  { hex: "#EC13C4", name: "Fuchsia" },
  { hex: "#D629A9", name: "Fandango" },
  { hex: "#BF4095", name: "Peony" },
  { hex: "#F042D0", name: "Shocking Pink" },
  { hex: "#73264E", name: "Mulberry Pink" },
  { hex: "#BD0F69", name: "Punch" },
  { hex: "#D62975", name: "Bubblegum" },
  { hex: "#CC669B", name: "Carnation" },
  { hex: "#F0429C", name: "Taffy" },
  { hex: "#F471B5", name: "Petal" },
];

// V2 = original palette plus the additions, in order.
export const PALETTE_V2 = [...PALETTE, ...PALETTE_ADDITIONS];

/** Palette in effect for a given "YYYY-MM" month key. Lexicographic comparison
 *  is correct because keys are zero-padded YYYY-MM. */
export function paletteForMonth(monthKey) {
  return monthKey >= CUTOVER_MONTH ? PALETTE_V2 : PALETTE;
}

export const MIN_CONSECUTIVE_DISTANCE = 100;

/* ─── Seeded Random (deterministic per date) ─── */
export function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967296;
  };
}

export function rgbDistance(hex1, hex2) {
  const c1 = hexToRgb(hex1);
  const c2 = hexToRgb(hex2);
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function getColorForDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const monthKey = `${year}-${month}`;
  const daysInMonth = new Date(year, d.getMonth() + 1, 0).getDate();
  const dayIndex = d.getDate() - 1; // 0-based

  // Generate unique colors for the entire month using the month seed.
  // Consecutive days must be visually distinct (RGB distance >= 100).
  // Palette is chosen by month so new colors only appear from CUTOVER_MONTH on.
  const palette = paletteForMonth(monthKey);

  // From the cutover onward, day 1 must also be visually distinct from the
  // previous month's last day (cross-month diversity), matching iOS. Computed
  // for the whole month (not just day-1 requests) so every day comes from one
  // consistent generation — otherwise day 1 could collide with day 2. Before the
  // cutover this stays null so the original pre-cutover colors are preserved.
  let crossMonthPrev = null;
  if (monthKey >= CUTOVER_MONTH) {
    const prevDay = new Date(d);
    prevDay.setDate(0); // rolls back to the last day of the previous month
    const py = prevDay.getFullYear();
    const pm = String(prevDay.getMonth() + 1).padStart(2, "0");
    const pd = String(prevDay.getDate()).padStart(2, "0");
    crossMonthPrev = getColorForDate(`${py}-${pm}-${pd}`);
  }

  const rng = seededRandom(monthKey + "-colorchallenge-monthly-v1");
  const usedIndices = new Set();
  const monthColors = [];
  for (let i = 0; i < daysInMonth; i++) {
    const prevColor = i === 0 ? crossMonthPrev : monthColors[monthColors.length - 1];
    let idx = Math.floor(rng() * palette.length);
    let attempts = 0;
    while (
      attempts < 200 &&
      (usedIndices.has(idx) ||
        (prevColor && rgbDistance(prevColor.hex, palette[idx].hex) < MIN_CONSECUTIVE_DISTANCE))
    ) {
      idx = Math.floor(rng() * palette.length);
      attempts++;
    }
    usedIndices.add(idx);
    monthColors.push(palette[idx]);
  }
  return monthColors[dayIndex];
}

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  switch (max) {
    case r: h = ((g - b) / d + 6) % 6; break;
    case g: h = (b - r) / d + 2;       break;
    default: h = (r - g) / d + 4;      break;
  }
  return { h: h * 60, s, l };
}

export function getLocalDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function getTimeRemaining() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function calculateStreak(submissions) {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const sub = submissions[key];
    if (sub && sub.completed) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else if (streak === 0) {
      d.setDate(d.getDate() - 1);
      const prevKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (submissions[prevKey]?.completed) { streak++; d.setDate(d.getDate() - 1); } else break;
    } else { break; }
  }
  return streak;
}

/**
 * Parse and validate an import file's JSON content.
 * Returns { merged, importedCount, overlapping, exportedFrom } or throws.
 * This is the synchronous core of importData (no FileReader needed for tests).
 */
export function parseImportJson(jsonString, existingSubmissions) {
  const root = JSON.parse(jsonString);
  if (!root.colorSnap) throw new Error("Not a valid Color Snap export file");
  const cs = root.colorSnap;
  if (cs.version !== 1) throw new Error(cs.version > 1
    ? "This export was created by a newer version. Please update."
    : "Not a valid Color Snap export file"
  );
  const imported = cs.submissions || {};
  // Validate date keys
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const validSubs = {};
  for (const [key, sub] of Object.entries(imported)) {
    if (!dateRe.test(key)) continue;
    validSubs[key] = {
      completed: sub.completed ?? false,
      date: sub.date || key,
      difficulty: sub.difficulty || "easy",
      passCount: sub.passCount ?? 0,
      results: (sub.results || []).map((r) => ({
        matchPercentage: r.matchPercentage,
        passed: r.passed,
      })),
      ...(sub.targetHex ? { targetHex: sub.targetHex, targetName: sub.targetName } : {}),
    };
  }
  // Merge: keep higher passCount, existing wins ties (has local context)
  const merged = { ...existingSubmissions };
  for (const [key, sub] of Object.entries(validSubs)) {
    if (!merged[key] || sub.passCount > merged[key].passCount) {
      merged[key] = sub;
    }
  }
  // Preserve the shields block so the web app can carry it through to a later
  // export (phone -> web -> phone). null when the file had no shields.
  const shields = cs.shields && Array.isArray(cs.shields.shieldedDates)
    ? {
        shieldedDates: cs.shields.shieldedDates.filter((d) => dateRe.test(d)),
        shieldsRemaining: cs.shields.shieldsRemaining,
      }
    : null;

  return {
    merged,
    importedCount: Object.keys(validSubs).length,
    overlapping: Object.keys(validSubs).filter((k) => k in existingSubmissions).length,
    exportedFrom: cs.exportedFrom || "unknown",
    shields,
  };
}

/**
 * Build the universal export JSON object (without triggering download).
 * Used by tests and by the UI export function.
 */
export function buildExportObject(submissions, shields = null) {
  const exportObj = {
    colorSnap: {
      version: 1,
      exportedAt: new Date().toISOString(),
      exportedFrom: "web",
      submissions: {},
    },
  };
  for (const [key, sub] of Object.entries(submissions)) {
    exportObj.colorSnap.submissions[key] = {
      completed: sub.completed,
      date: sub.date || key,
      difficulty: sub.difficulty || "easy",
      passCount: sub.passCount,
      results: sub.results.map((r) => ({
        matchPercentage: r.matchPercentage,
        passed: r.passed,
      })),
      ...(sub.targetHex ? { targetHex: sub.targetHex, targetName: sub.targetName } : {}),
    };
  }
  // Round-trip shields the web app is holding (it has no shield feature of its
  // own, but preserves the block so phone -> web -> phone transfers keep them).
  // Omit the block entirely when there's nothing to carry, so phones preserve
  // their local shields on a Replace instead of seeing an empty block.
  if (shields && Array.isArray(shields.shieldedDates)) {
    exportObj.colorSnap.shields = {
      shieldedDates: shields.shieldedDates,
      shieldsRemaining: shields.shieldsRemaining ?? 0,
    };
  }
  return exportObj;
}
