import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  MIN_SATURATION, DIFFICULTY, PALETTE,
  getColorForDate,
  hexToRgb, rgbToHsl, getLocalDateStr, getTimeRemaining,
  calculateStreak, parseImportJson, buildExportObject, getLastNDays,
} from "./logic.js";
import { version as APP_VERSION } from "../package.json";

/* ─── Pure logic (palette, seeded RNG, color algorithms, streak,
 *     import/export) extracted to logic.js for testability.
 *     Everything is imported at the top of this file.
 * ──────────────────────────────────────────────────────────────────── */

/* ─── Image Analysis (client-side via Canvas — stays here, needs DOM) ─── */
function analyzeImage(file, targetHex, { hueTolerance = 25, satTolerance = 0.55, lightTolerance = 0.45, threshold = 2 } = {}) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const fail = () => { URL.revokeObjectURL(url); resolve({ matchPercentage: 0, passed: false }); };
    img.onerror = fail;
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) { fail(); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const target = hexToRgb(targetHex);
        const targetHsl = rgbToHsl(target.r, target.g, target.b);
        // Chroma-based neutrality test (HSV-style). HSL saturation is
        // numerically unstable near L=0 or L=1 — Snow White (#FDFFFC) has
        // HSL.s ≈ 0.98 even though it's perceptually white — so we use the
        // raw RGB chroma instead.
        const isNeutral = (r, g, b) => {
          const maxC = Math.max(r, g, b);
          if (maxC === 0) return true;
          const minC = Math.min(r, g, b);
          return (maxC - minC) / maxC < MIN_SATURATION;
        };
        const isNeutralTarget = isNeutral(target.r, target.g, target.b);
        let matchCount = 0;
        let comparablePixels = 0;
        const totalPixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          const pr = data[i], pg = data[i + 1], pb = data[i + 2];
          const pixelHsl = rgbToHsl(pr, pg, pb);
          if (isNeutralTarget) {
            // Match neutral pixels by lightness alone — hue is unreliable
            // and HSL saturation is unstable for near-neutral pixels.
            if (!isNeutral(pr, pg, pb)) continue;
            comparablePixels++;
            if (Math.abs(pixelHsl.l - targetHsl.l) > lightTolerance) continue;
            matchCount++;
            continue;
          }
          if (pixelHsl.s < MIN_SATURATION) continue;
          comparablePixels++;
          const hueDiff = Math.abs(pixelHsl.h - targetHsl.h);
          const circularDiff = Math.min(hueDiff, 360 - hueDiff);
          if (circularDiff > hueTolerance) continue;
          if (Math.abs(pixelHsl.s - targetHsl.s) > satTolerance) continue;
          if (Math.abs(pixelHsl.l - targetHsl.l) > lightTolerance) continue;
          matchCount++;
        }
        const denominator = comparablePixels > 0 ? comparablePixels : totalPixels;
        const pct = (matchCount / denominator) * 100;
        URL.revokeObjectURL(url);
        resolve({ matchPercentage: Math.round(pct * 10) / 10, passed: pct >= threshold });
      } catch { fail(); }
    };
    img.src = url;
  });
}

/* ─── localStorage helpers ─── */
const ONBOARDING_KEY = "color-challenge-onboarded";
const STORAGE_KEY = "color-challenge-data";

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { submissions: {} };
  } catch { return { submissions: {} }; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/* ─── Data Export/Import (browser wrappers around logic.js functions) ─── */
function exportData(submissions, shields) {
  const exportObj = buildExportObject(submissions, shields);
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "colorsnap-data.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file, existingSubmissions) {
  return new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) return reject(new Error("File is too large (max 5MB)"));
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        resolve(parseImportJson(e.target.result, existingSubmissions));
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/* ─── Theme ───
 * Colors are CSS variables so the Appearance setting (System / Light / Dark)
 * can switch them; the values mirror the iOS/Android apps (teal accent, mint
 * containers). */
const THEME_KEY = "color-snap-theme";

const LIGHT_VARS = `
  --cs-bg: #FAFAFA; --cs-surface: #FFFFFF; --cs-surface-alt: #F2F2F5;
  --cs-text: #1A1A1A; --cs-text-2: #666666; --cs-text-3: #8E8E93;
  --cs-border: #E5E5EA; --cs-chrome: rgba(250,250,250,0.88);
  --cs-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --cs-shadow-lg: 0 4px 16px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
  --cs-accent: #006B60; --cs-on-accent: #FFFFFF; --cs-mint: #A8E5DC; --cs-mint-soft: #E0F2EF;
  --cs-green: #2E7D32; --cs-red: #C62828;
  --cs-pass-bg: #E8F5E9; --cs-pass-border: #C8E6C9; --cs-fail-bg: #FFEBEE; --cs-fail-border: #FFCDD2;
`;
const DARK_VARS = `
  --cs-bg: #121212; --cs-surface: #1C1C1E; --cs-surface-alt: #2C2C2E;
  --cs-text: #F2F2F2; --cs-text-2: #ABABAB; --cs-text-3: #8E8E93;
  --cs-border: #38383A; --cs-chrome: rgba(18,18,18,0.88);
  --cs-shadow: 0 1px 3px rgba(0,0,0,0.5);
  --cs-shadow-lg: 0 4px 16px rgba(0,0,0,0.6);
  --cs-accent: #5FD4C4; --cs-on-accent: #00201C; --cs-mint: #005045; --cs-mint-soft: #0F3A35;
  --cs-green: #81C784; --cs-red: #EF9A9A;
  --cs-pass-bg: #1B3A20; --cs-pass-border: #2E5E35; --cs-fail-bg: #3E1E1E; --cs-fail-border: #6B2C2C;
`;
const themeCss = `
  :root, :root[data-cs-theme="light"] { ${LIGHT_VARS} }
  @media (prefers-color-scheme: dark) { :root:not([data-cs-theme="light"]) { ${DARK_VARS} } }
  :root[data-cs-theme="dark"] { ${DARK_VARS} }
  @keyframes spin { to { transform: rotate(360deg) } }
`;

const fonts = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,300&family=Space+Mono:wght@400;700&display=swap');`;

const theme = {
  bg: "var(--cs-bg)",
  surface: "var(--cs-surface)",
  surfaceAlt: "var(--cs-surface-alt)",
  text: "var(--cs-text)",
  textSecondary: "var(--cs-text-2)",
  textTertiary: "var(--cs-text-3)",
  border: "var(--cs-border)",
  chrome: "var(--cs-chrome)",
  shadow: "var(--cs-shadow)",
  shadowLg: "var(--cs-shadow-lg)",
  accent: "var(--cs-accent)",
  onAccent: "var(--cs-on-accent)",
  mint: "var(--cs-mint)",
  mintSoft: "var(--cs-mint-soft)",
  green: "var(--cs-green)",
  red: "var(--cs-red)",
  passBg: "var(--cs-pass-bg)",
  passBorder: "var(--cs-pass-border)",
  failBg: "var(--cs-fail-bg)",
  failBorder: "var(--cs-fail-border)",
  radius: "16px",
  radiusSm: "12px",
  font: "'DM Sans', sans-serif",
  mono: "'Space Mono', monospace",
};

const APP_STORE_URL = "https://apps.apple.com/us/app/color-snap-app/id6768472641";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.colorsnap.colorchallenge";

/** Readable text color (near-black or white) on top of a color swatch. */
function contrastText(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1A1A1A" : "#FFFFFF";
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

function loadThemeMode() {
  try { return localStorage.getItem(THEME_KEY) || "system"; } catch { return "system"; }
}

/* ─── Icons (inline SVG, no emoji) ─── */
const Icon = {
  camera: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  flame: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 002.5 2.5z"/></svg>,
  gear: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  smile: (s = 36) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  scope: (s = 36) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><line x1="12" y1="1" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="23"/><line x1="1" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="23" y2="12"/></svg>,
  clock: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  check: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  calendar: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  close: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  upload: (s = 18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  download: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  refresh: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  info: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="10.5"/><line x1="12" y1="5" x2="12.01" y2="5"/></svg>,
  bell: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
};
const DIFFICULTY_ICON = { easy: Icon.smile, hard: Icon.flame, pro: Icon.scope };

/* ─── Components ─── */

function CountdownPill() {
  const [time, setTime] = useState(getTimeRemaining());
  useEffect(() => {
    const iv = setInterval(() => setTime(getTimeRemaining()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      background: theme.mint, color: theme.accent, borderRadius: "999px",
      padding: "6px 12px", fontFamily: theme.mono, fontSize: "13px", fontWeight: 700,
    }}>
      {Icon.clock()}{time}
    </span>
  );
}

function SectionLabel({ children, style = {} }) {
  return (
    <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: theme.textTertiary, ...style }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: theme.surface, borderRadius: theme.radius,
      boxShadow: theme.shadow, padding: "22px",
      border: `1px solid ${theme.border}`, ...style,
    }}>{children}</div>
  );
}

function Button({ children, onClick, variant = "primary", disabled = false, style = {} }) {
  const base = {
    fontFamily: theme.font, fontSize: "15px", fontWeight: 700,
    border: "none", borderRadius: "999px", padding: "14px 26px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease", display: "inline-flex", alignItems: "center",
    justifyContent: "center", gap: "8px", opacity: disabled ? 0.5 : 1, ...style,
  };
  const variants = {
    primary: { ...base, background: theme.accent, color: theme.onAccent },
    secondary: { ...base, background: theme.surfaceAlt, color: theme.text },
    tonal: { ...base, background: theme.mintSoft, color: theme.accent },
    ghost: { ...base, background: "transparent", color: theme.accent, padding: "8px 12px" },
  };
  return <button style={variants[variant]} onClick={onClick} disabled={disabled}>{children}</button>;
}

/** The big "today's color" card shared by the Challenge screen states. */
function TodayColorCard({ todayColor }) {
  const fg = contrastText(todayColor.hex);
  return (
    <div style={{ borderRadius: "24px", overflow: "hidden", background: theme.surfaceAlt, boxShadow: theme.shadow }}>
      <div style={{ background: todayColor.hex, padding: "44px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", fontWeight: 800, letterSpacing: "-1px", color: fg, lineHeight: 1.1 }}>{todayColor.name}</div>
        <div style={{ fontFamily: theme.mono, fontSize: "15px", color: fg, opacity: 0.7, marginTop: "8px" }}>{todayColor.hex}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
        <span style={{ fontSize: "15px", fontWeight: 700, color: theme.text }}>Today's Color</span>
        <CountdownPill />
      </div>
    </div>
  );
}

/* ─── Screens ─── */

function DifficultyPicker({ onSelect }) {
  return (
    <div>
      <SectionLabel style={{ marginBottom: "6px" }}>Choose Difficulty</SectionLabel>
      <div style={{ fontSize: "14px", color: theme.textSecondary, marginBottom: "16px" }}>Pick your challenge level for today</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {Object.entries(DIFFICULTY).map(([key, diff]) => (
          <button key={key} onClick={() => onSelect(key)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
            padding: "22px 8px", borderRadius: "18px", border: `2px solid transparent`,
            background: theme.surfaceAlt, cursor: "pointer", fontFamily: theme.font,
            color: theme.accent, transition: "border-color 0.2s ease",
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--cs-accent)"; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
          >
            {DIFFICULTY_ICON[key](36)}
            <span style={{ fontSize: "17px", fontWeight: 700, color: theme.text }}>{diff.label}</span>
            <span style={{ fontSize: "12px", color: theme.textSecondary, textAlign: "center", lineHeight: 1.35 }}>{diff.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChallengeScreen({ todayColor, onComplete, existingSubmission }) {
  const [difficulty, setDifficulty] = useState(existingSubmission?.difficulty || null);
  const [photos, setPhotos] = useState([]);
  const [results, setResults] = useState(existingSubmission?.results || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [submitPreviews, setSubmitPreviews] = useState([]);
  const [hasReset, setHasReset] = useState(false);
  const fileRef = useRef(null);

  const config = difficulty ? DIFFICULTY[difficulty] : null;
  const maxPhotos = config?.photos || 3;

  const addFiles = useCallback((files) => {
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, maxPhotos - photos.length);
    if (newFiles.length === 0) return;
    const newPhotos = [...photos, ...newFiles].slice(0, maxPhotos);
    setPhotos(newPhotos);
    const newPreviews = newPhotos.map((f) => URL.createObjectURL(f));
    setPreviews((old) => { old.forEach(URL.revokeObjectURL); return newPreviews; });
  }, [photos, maxPhotos]);

  const handleFileInput = (e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; };

  const removePhoto = (idx) => {
    const np = [...photos]; np.splice(idx, 1); setPhotos(np);
    const nv = [...previews]; URL.revokeObjectURL(nv[idx]); nv.splice(idx, 1); setPreviews(nv);
  };

  const handleSubmit = async () => {
    setAnalyzing(true);
    try {
      const readDataUrl = (f) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(f);
      });
      const [res, dataUrls] = await Promise.all([
        Promise.all(photos.map((f) => analyzeImage(f, todayColor.hex, config))),
        Promise.all(photos.map(readDataUrl)),
      ]);
      setSubmitPreviews(dataUrls);
      setResults(res);
      setAnalyzing(false);
      onComplete(res, difficulty);
    } catch {
      setAnalyzing(false);
    }
  };

  const clearPhotos = () => {
    setPhotos([]);
    setPreviews((old) => { old.forEach(URL.revokeObjectURL); return []; });
  };

  const handleReset = () => {
    setResults(null);
    setDifficulty(null);
    setSubmitPreviews([]);
    clearPhotos();
    setHasReset(true);
  };

  if (results) {
    return <ResultsScreen results={results} previews={submitPreviews} todayColor={todayColor} onReset={handleReset} difficulty={difficulty} />;
  }

  if (existingSubmission?.completed && !hasReset) {
    return <ResultsScreen results={existingSubmission.results} previews={[]} todayColor={todayColor} onReset={handleReset} difficulty={existingSubmission.difficulty || "easy"} />;
  }

  if (!difficulty) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <TodayColorCard todayColor={todayColor} />
        <DifficultyPicker onSelect={setDifficulty} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <TodayColorCard todayColor={todayColor} />

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
          <SectionLabel>Upload Photos ({photos.length}/{maxPhotos})</SectionLabel>
          {!existingSubmission && (
            <Button variant="ghost" onClick={() => { setDifficulty(null); clearPhotos(); }} style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
              {Icon.refresh()} Change difficulty
            </Button>
          )}
        </div>
        <div style={{ fontSize: "14px", color: theme.textSecondary, marginBottom: "20px", lineHeight: 1.5 }}>
          Find <strong style={{ color: theme.text }}>{todayColor.name}</strong> in the real world and upload {maxPhotos} photo{maxPhotos === 1 ? "" : "s"}.{difficulty === "pro" ? " Tightest color matching — one shot, only very close shades count!" : difficulty === "hard" ? " Tight color matching — only close shades count!" : " Each photo just needs a touch of the color somewhere in the frame — we use a wide color tolerance so natural lighting and shades all count!"}
        </div>

        {previews.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: "relative", borderRadius: "12px", overflow: "hidden", aspectRatio: "1", background: theme.surfaceAlt }}>
                <img src={src} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => removePhoto(i)} aria-label={`Remove photo ${i + 1}`} style={{
                  position: "absolute", top: "6px", right: "6px", width: "24px", height: "24px",
                  borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff",
                  border: "none", cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center", padding: 0,
                }}>{Icon.close(14)}</button>
              </div>
            ))}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" multiple={maxPhotos > 1} onChange={handleFileInput} style={{ display: "none" }} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
          {photos.length < maxPhotos && (
            <Button variant="tonal" onClick={() => fileRef.current?.click()}>
              {Icon.upload()} Upload Photo{maxPhotos - photos.length === 1 ? "" : "s"}
            </Button>
          )}
          {photos.length === maxPhotos && (
            <Button onClick={handleSubmit} disabled={analyzing} style={{ width: "100%" }}>
              {analyzing ? (
                <>
                  <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "currentColor", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Analyzing...
                </>
              ) : "Submit Challenge"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function ResultsScreen({ results, previews = [], todayColor, onReset, difficulty = "easy" }) {
  const passCount = results.filter((r) => r.passed).length;
  const allPassed = passCount === results.length;

  const modeLabel = difficulty === "hard" ? "Hard Mode" : difficulty === "pro" ? "Pro Mode" : "";
  const diffLabel = modeLabel ? ` [${modeLabel}]` : "";
  const shareText = `🎨 Color Snap ${getLocalDateStr()}${diffLabel}\n\n${todayColor.hex} ${todayColor.name}\n\n${results.map((r) => (r.passed ? "🟢" : "🔴")).join("")} ${passCount}/${results.length}`;

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: shareText }); } catch { /* user dismissed the share sheet */ }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Card style={{ textAlign: "center", background: theme.surfaceAlt, border: "none", boxShadow: "none", padding: "32px 22px" }}>
        <div style={{ width: 56, height: 56, borderRadius: "16px", background: todayColor.hex, margin: "0 auto 14px", boxShadow: `0 4px 16px ${todayColor.hex}55` }} />
        <div style={{ fontSize: "24px", fontWeight: 800, color: theme.text, marginBottom: "4px" }}>
          {allPassed ? "Perfect Score!" : passCount > 0 ? "Nice Work!" : "Keep Trying!"}
        </div>
        <div style={{ fontSize: "14px", color: theme.textSecondary }}>
          {passCount}/{results.length} photo{results.length === 1 ? "" : "s"} passed{modeLabel ? ` — ${modeLabel}` : ""}
        </div>
      </Card>

      <div>
        <SectionLabel style={{ marginBottom: "12px" }}>Breakdown</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {results.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", borderRadius: theme.radiusSm,
              background: r.passed ? theme.passBg : theme.failBg,
              border: `1px solid ${r.passed ? theme.passBorder : theme.failBorder}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {previews[i] && (
                  <img src={previews[i]} alt={`Photo ${i + 1}`} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "8px" }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: theme.text }}>Photo {i + 1}</div>
                  <div style={{ fontFamily: theme.mono, fontSize: "13px", color: theme.textSecondary }}>{r.matchPercentage}% match</div>
                </div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, color: r.passed ? theme.green : theme.red }}>{r.passed ? "Pass" : "Fail"}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel style={{ marginBottom: "12px" }}>Share</SectionLabel>
        <div style={{ fontFamily: theme.mono, fontSize: "13px", color: "#F2F2F2", whiteSpace: "pre-line", lineHeight: 1.8, padding: "16px 18px", background: "#151515", borderRadius: "18px", marginBottom: "16px" }}>
          {shareText}
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Button onClick={handleShare}>Share Results</Button>
          {onReset && <Button variant="secondary" onClick={onReset}>{Icon.refresh()} Try Again</Button>}
        </div>
      </div>
    </div>
  );
}

function StreakScreen({ submissions, todayStr, onOpenCalendar }) {
  const streak = calculateStreak(submissions);
  const days = getLastNDays(todayStr, 7);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Card style={{ textAlign: "center", padding: "30px 22px" }}>
        <div style={{ fontFamily: theme.mono, fontSize: "64px", fontWeight: 700, color: theme.accent, lineHeight: 1 }}>{streak}</div>
        <div style={{ fontSize: "18px", color: theme.textSecondary, marginTop: "8px" }}>day streak</div>
      </Card>

      <Card>
        <SectionLabel style={{ marginBottom: "16px" }}>Last 7 Days</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
          {days.map(({ dateStr, letter }) => {
            const sub = submissions[dateStr];
            const done = !!sub?.completed;
            const dayColor = sub?.targetHex || getColorForDate(dateStr).hex;
            const isToday = dateStr === todayStr;
            return (
              <div key={dateStr} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div title={dateStr} style={{
                  width: "100%", aspectRatio: "1", borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: done ? dayColor : theme.surfaceAlt,
                  color: done ? contrastText(dayColor) : "transparent",
                  border: isToday && !done ? `2px solid ${theme.border}` : "none",
                }}>{done && Icon.check()}</div>
                <span style={{ fontSize: "12px", color: theme.textTertiary, fontWeight: 600 }}>{letter}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Button variant="tonal" onClick={onOpenCalendar} style={{ width: "100%", borderRadius: "16px", padding: "16px" }}>
        {Icon.calendar()} View full calendar
      </Button>
    </div>
  );
}

function CalendarView({ submissions, onClose }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const monthName = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button onClick={onClose} aria-label="Close calendar" style={{
          width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
          background: theme.surfaceAlt, color: theme.text, display: "flex", alignItems: "center", justifyContent: "center",
        }}>{Icon.close()}</button>
        <div style={{ fontSize: "20px", fontWeight: 700, color: theme.text }}>Calendar</div>
      </div>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <Button variant="ghost" onClick={prevMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </Button>
          <div style={{ fontSize: "16px", fontWeight: 700, color: theme.text }}>{monthName}</div>
          <Button variant="ghost" onClick={nextMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </Button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", textAlign: "center" }}>
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} style={{ fontSize: "12px", fontWeight: 600, color: theme.textTertiary, padding: "8px 0" }}>{d}</div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const sub = submissions[dateStr];
            // Prefer the color stored at completion time; fall back to recomputing.
            const dayHex = sub?.targetHex || getColorForDate(dateStr).hex;
            const isToday = dateStr === getLocalDateStr();

            return (
              <div key={dateStr} style={{
                position: "relative", aspectRatio: "1",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "10px", fontSize: "13px", fontWeight: isToday ? 700 : 500,
                color: sub?.completed ? contrastText(dayHex) : isToday ? theme.text : theme.textSecondary,
                background: sub?.completed ? dayHex : isToday ? theme.surfaceAlt : "transparent",
                border: isToday && !sub?.completed ? `2px solid ${theme.border}` : "none",
              }}>
                {day}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function SettingsScreen({ themeMode, onThemeModeChange, onExport, onImport }) {
  const fileInputRef = useRef(null);
  const modes = [["system", "System"], ["light", "Light"], ["dark", "Dark"]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Card>
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <div style={{ color: theme.accent, marginTop: "2px" }}>{Icon.bell()}</div>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: theme.text }}>Daily Reminder</div>
            <div style={{ fontSize: "14px", color: theme.textSecondary, marginTop: "4px", lineHeight: 1.45 }}>
              Reminders and the alarm live in the Color Snap app. Get it on{" "}
              <a href={APP_STORE_URL} target="_blank" rel="noreferrer" style={{ color: theme.accent, fontWeight: 600 }}>iPhone</a> or{" "}
              <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" style={{ color: theme.accent, fontWeight: 600 }}>Android</a>.
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: "17px", fontWeight: 700, color: theme.text }}>Appearance</div>
        <div style={{ fontSize: "14px", color: theme.textSecondary, marginTop: "2px", marginBottom: "16px" }}>Override the system theme</div>
        <div role="radiogroup" aria-label="Appearance" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", background: theme.surfaceAlt, borderRadius: "999px", padding: "4px" }}>
          {modes.map(([id, label]) => (
            <button key={id} role="radio" aria-checked={themeMode === id} onClick={() => onThemeModeChange(id)} style={{
              border: "none", borderRadius: "999px", padding: "10px 0", cursor: "pointer",
              fontFamily: theme.font, fontSize: "15px", fontWeight: 600,
              background: themeMode === id ? theme.surface : "transparent",
              color: theme.text, boxShadow: themeMode === id ? theme.shadow : "none",
            }}>{label}</button>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: "17px", fontWeight: 700, color: theme.text }}>Your Data</div>
        <div style={{ fontSize: "14px", color: theme.textSecondary, marginTop: "2px", marginBottom: "16px" }}>Transfer streak data between devices</div>
        <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: "none" }}
          onChange={(e) => { if (e.target.files[0]) { onImport(e.target.files[0]); e.target.value = ""; } }} />
        <div style={{ display: "flex", gap: "12px" }}>
          <Button variant="secondary" onClick={onExport} style={{ flex: 1, borderRadius: "14px" }}>{Icon.upload(16)} Export</Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, borderRadius: "14px" }}>{Icon.download()} Import</Button>
        </div>
      </Card>

      <div style={{ textAlign: "center", fontSize: "14px", color: theme.textTertiary }}>Color Snap v{APP_VERSION}</div>
    </div>
  );
}

/* ─── Info Modal ─── */
function InfoModal({ onClose }) {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div style={{
        background: theme.surface, borderRadius: "24px", padding: "32px 28px",
        maxWidth: "400px", width: "100%", boxShadow: theme.shadowLg,
        position: "relative",
      }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" style={{
          position: "absolute", top: "16px", right: "16px", width: "30px", height: "30px",
          borderRadius: "50%", background: theme.surfaceAlt, color: theme.textSecondary,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
        }}>{Icon.close(16)}</button>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "24px", fontWeight: 800, color: theme.text, marginBottom: "4px" }}>Welcome to Color Snap</div>
          <div style={{ fontSize: "14px", color: theme.textSecondary }}>Your daily color challenge</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
          {[
            { icon: Icon.scope(20), title: "Daily Color", desc: "Each day you get a new color to find in the real world." },
            { icon: Icon.camera(20), title: "Snap Photos", desc: "Upload photos that contain the day's color anywhere in the frame." },
            { icon: Icon.check(20), title: "Get Scored", desc: "Each photo is analyzed for color accuracy. Choose Easy (3 photos), Hard (5 photos), or Pro (1 photo)!" },
            { icon: Icon.flame(20), title: "Build a Streak", desc: "Complete challenges daily to build your streak and share results." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: theme.mintSoft, color: theme.accent, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: theme.text, marginBottom: "2px" }}>{item.title}</div>
                <div style={{ fontSize: "13px", color: theme.textSecondary, lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onClose} style={{ width: "100%" }}>Got it, let's go!</Button>
      </div>
    </div>
  );
}

/* ─── App ─── */
const SCREENS = ["challenge", "streak", "settings"];
const TABS = [
  { id: "challenge", label: "Challenge", icon: Icon.camera },
  { id: "streak", label: "Streak", icon: Icon.flame },
  { id: "settings", label: "Settings", icon: Icon.gear },
];

export default function Game() {
  const [tab, setTab] = useState("challenge");
  const [showCalendar, setShowCalendar] = useState(false);
  const [data, setData] = useState(loadData);
  const [showInfo, setShowInfo] = useState(() => !localStorage.getItem(ONBOARDING_KEY));
  const [themeMode, setThemeMode] = useState(loadThemeMode);
  // Wide browsers get two panes side by side, like the unfolded phones.
  const twoPane = useMediaQuery("(min-width: 900px)");
  const todayStr = getLocalDateStr();
  const todayColor = useMemo(() => getColorForDate(todayStr), [todayStr]);
  const todayLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "system") root.removeAttribute("data-cs-theme");
    else root.setAttribute("data-cs-theme", themeMode);
    try { localStorage.setItem(THEME_KEY, themeMode); } catch { /* storage unavailable: setting just won't persist */ }
    return () => root.removeAttribute("data-cs-theme");
  }, [themeMode]);

  const handleCloseInfo = () => {
    setShowInfo(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  };

  const handleComplete = (results, difficulty) => {
    const passCount = results.filter((r) => r.passed).length;
    const newData = {
      ...data,
      submissions: {
        ...data.submissions,
        [todayStr]: { completed: true, results, passCount, date: todayStr, difficulty, targetHex: todayColor.hex, targetName: todayColor.name },
      },
    };
    setData(newData);
    saveData(newData);
  };

  const handleImport = (file) => {
    importData(file, data.submissions).then((result) => {
      // Preserve shields carried in the file so a later export keeps them.
      const newData = { ...data, submissions: result.merged, shields: result.shields ?? data.shields };
      setData(newData);
      saveData(newData);
      alert(`Imported ${result.importedCount} submissions from ${result.exportedFrom}${result.overlapping > 0 ? ` (${result.overlapping} overlapping — best scores kept)` : ""}`);
    }).catch((err) => alert(err.message));
  };

  const selectTab = (id) => { setShowCalendar(false); setTab(id); };

  const renderScreen = (id) => {
    if (id === "challenge") return (
      <ChallengeScreen todayColor={todayColor} onComplete={handleComplete} existingSubmission={data.submissions[todayStr]} />
    );
    if (id === "streak") return (
      <StreakScreen submissions={data.submissions} todayStr={todayStr} onOpenCalendar={() => setShowCalendar(true)} />
    );
    return (
      <SettingsScreen themeMode={themeMode} onThemeModeChange={setThemeMode}
        onExport={() => exportData(data.submissions, data.shields)} onImport={handleImport} />
    );
  };

  // Two panes: adjacent screens with Streak as the pivot (Challenge | Streak,
  // then Streak | Settings), same as the apps.
  const pairStart = tab === "settings" ? 1 : 0;
  const maxWidth = twoPane && !showCalendar ? "1040px" : showCalendar && twoPane ? "640px" : "480px";

  return (
    <div style={{ fontFamily: theme.font, background: theme.bg, minHeight: "100vh", color: theme.text }}>
      <style>{fonts}</style>
      <style>{themeCss}</style>

      {showInfo && <InfoModal onClose={handleCloseInfo} />}

      <button onClick={() => setShowInfo(true)} aria-label="How to play" style={{
        position: "fixed", bottom: "96px", right: "20px", zIndex: 99,
        width: "48px", height: "48px", borderRadius: "50%",
        background: theme.mint, border: "none", color: theme.accent,
        boxShadow: theme.shadowLg, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{Icon.info(22)}</button>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100, background: theme.chrome,
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", padding: "14px 20px",
      }}>
        <div style={{ maxWidth, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", color: theme.text }}>Color Snap</div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ background: theme.mint, color: theme.accent, borderRadius: "999px", padding: "6px 14px", fontSize: "13px", fontWeight: 700 }}>{todayLabel}</span>
            <div title={`${todayColor.name} ${todayColor.hex}`} style={{ width: 32, height: 32, borderRadius: "50%", background: todayColor.hex, border: `1px solid ${theme.border}` }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth, margin: "0 auto", padding: "16px 16px 110px" }}>
        {showCalendar ? (
          <CalendarView submissions={data.submissions} onClose={() => setShowCalendar(false)} />
        ) : twoPane ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
            <div>{renderScreen(SCREENS[pairStart])}</div>
            <div>{renderScreen(SCREENS[pairStart + 1])}</div>
          </div>
        ) : (
          renderScreen(tab)
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: theme.chrome, backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderTop: `1px solid ${theme.border}`,
      }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", padding: "8px 0 max(8px, env(safe-area-inset-bottom))" }}>
          {TABS.map((t) => {
            const active = tab === t.id && !showCalendar;
            return (
              <button key={t.id} onClick={() => selectTab(t.id)} aria-current={active ? "page" : undefined} style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                padding: "6px 0", border: "none", background: "transparent", cursor: "pointer",
                color: active ? theme.accent : theme.textTertiary, fontFamily: theme.font,
              }}>
                <span style={{ display: "flex", padding: "4px 18px", borderRadius: "999px", background: active ? theme.mintSoft : "transparent" }}>{t.icon()}</span>
                <span style={{ fontSize: "12px", fontWeight: 700 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
