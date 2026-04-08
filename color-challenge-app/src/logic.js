/* ─── Constants ─── */
export const MIN_SATURATION = 0.15; // skip near-gray pixels

export const DIFFICULTY = {
  easy: { label: "Easy", photos: 3, hueTolerance: 25, satTolerance: 0.55, lightTolerance: 0.45, threshold: 2, emoji: "\u{1F60A}", desc: "Wide color tolerance, 3 photos" },
  hard: { label: "Hard", photos: 5, hueTolerance: 15, satTolerance: 0.35, lightTolerance: 0.3, threshold: 4, emoji: "\u{1F525}", desc: "Tight color tolerance, 5 photos" },
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
  const rng = seededRandom(monthKey + "-colorchallenge-monthly-v1");
  const usedIndices = new Set();
  const monthColors = [];
  for (let i = 0; i < daysInMonth; i++) {
    let idx = Math.floor(rng() * PALETTE.length);
    let attempts = 0;
    while (attempts < 200) {
      if (usedIndices.has(idx)) {
        idx = Math.floor(rng() * PALETTE.length);
        attempts++;
        continue;
      }
      // Ensure consecutive days are visually distinct
      if (monthColors.length > 0) {
        const prevColor = monthColors[monthColors.length - 1];
        const candidate = PALETTE[idx];
        if (rgbDistance(prevColor.hex, candidate.hex) < MIN_CONSECUTIVE_DISTANCE) {
          idx = Math.floor(rng() * PALETTE.length);
          attempts++;
          continue;
        }
      }
      break;
    }
    usedIndices.add(idx);
    monthColors.push(PALETTE[idx]);
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
    };
  }
  // Merge: keep higher passCount, existing wins ties (has local context)
  const merged = { ...existingSubmissions };
  for (const [key, sub] of Object.entries(validSubs)) {
    if (!merged[key] || sub.passCount > merged[key].passCount) {
      merged[key] = sub;
    }
  }
  return {
    merged,
    importedCount: Object.keys(validSubs).length,
    overlapping: Object.keys(validSubs).filter((k) => k in existingSubmissions).length,
    exportedFrom: cs.exportedFrom || "unknown",
  };
}

/**
 * Build the universal export JSON object (without triggering download).
 * Used by tests and by the UI export function.
 */
export function buildExportObject(submissions) {
  const exportObj = {
    colorSnap: {
      version: 1,
      exportedAt: new Date().toISOString(),
      exportedFrom: "web",
      submissions: {},
      shields: { shieldedDates: [], shieldsRemaining: 0 },
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
    };
  }
  return exportObj;
}
