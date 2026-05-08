import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  MIN_SATURATION, DIFFICULTY, PALETTE,
  seededRandom, rgbDistance, getColorForDate,
  hexToRgb, rgbToHsl, getLocalDateStr, getTimeRemaining,
  calculateStreak, parseImportJson, buildExportObject,
} from "./logic.js";

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
function exportData(submissions) {
  const exportObj = buildExportObject(submissions);
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

/* ─── Styles ─── */
const fonts = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,300&family=Space+Mono:wght@400;700&display=swap');`;

const theme = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F5F5F5",
  text: "#1A1A1A",
  textSecondary: "#666666",
  textTertiary: "#999999",
  border: "#E8E8E8",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
  shadowLg: "0 4px 16px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
  radius: "16px",
  radiusSm: "12px",
  green: "#2E7D32",
  red: "#C62828",
  font: "'DM Sans', sans-serif",
  mono: "'Space Mono', monospace",
};

/* ─── Components ─── */

function CountdownTimer() {
  const [time, setTime] = useState(getTimeRemaining());
  useEffect(() => {
    const iv = setInterval(() => setTime(getTimeRemaining()), 1000);
    return () => clearInterval(iv);
  }, []);
  return <span style={{ fontFamily: theme.mono, fontSize: "14px", color: theme.textSecondary }}>{time}</span>;
}

function ColorSwatch({ hex, name, large }) {
  const size = large ? 160 : 48;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: large ? "16px" : "6px" }}>
      <div style={{
        width: size, height: size, borderRadius: large ? "24px" : "12px",
        backgroundColor: hex, boxShadow: `0 4px 20px ${hex}44, ${theme.shadow}`,
        border: "3px solid rgba(255,255,255,0.8)",
        transition: "transform 0.3s ease",
      }} />
      {large && (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: theme.mono, fontSize: "22px", fontWeight: 700, color: theme.text, letterSpacing: "1px" }}>{hex}</div>
          <div style={{ fontSize: "15px", color: theme.textSecondary, marginTop: "4px", fontWeight: 500 }}>{name}</div>
        </div>
      )}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: theme.surface, borderRadius: theme.radius,
      boxShadow: theme.shadow, padding: "24px",
      border: `1px solid ${theme.border}`, ...style,
    }}>{children}</div>
  );
}

function Button({ children, onClick, variant = "primary", disabled = false, style = {} }) {
  const base = {
    fontFamily: theme.font, fontSize: "15px", fontWeight: 600,
    border: "none", borderRadius: theme.radiusSm, padding: "14px 28px",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s ease", display: "inline-flex", alignItems: "center",
    gap: "8px", opacity: disabled ? 0.5 : 1, ...style,
  };
  const variants = {
    primary: { ...base, background: theme.text, color: "#FFF" },
    secondary: { ...base, background: theme.surfaceAlt, color: theme.text, border: `1px solid ${theme.border}` },
    ghost: { ...base, background: "transparent", color: theme.textSecondary, padding: "8px 16px" },
  };
  return <button style={variants[variant]} onClick={onClick} disabled={disabled}>{children}</button>;
}

/* ─── Screens ─── */

function DifficultyPicker({ onSelect }) {
  return (
    <Card>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: theme.textTertiary, marginBottom: "8px" }}>
          Choose Difficulty
        </div>
        <div style={{ fontSize: "14px", color: theme.textSecondary }}>
          Pick your challenge level for today
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {Object.entries(DIFFICULTY).map(([key, diff]) => (
          <button key={key} onClick={() => onSelect(key)} style={{
            display: "flex", alignItems: "center", gap: "16px",
            padding: "18px 20px", borderRadius: theme.radiusSm,
            background: theme.surface, border: `2px solid ${theme.border}`,
            cursor: "pointer", textAlign: "left", fontFamily: theme.font,
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = theme.text; e.currentTarget.style.background = theme.surfaceAlt; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.background = theme.surface; }}
          >
            <span style={{ fontSize: "28px" }}>{diff.emoji}</span>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: theme.text, marginBottom: "2px" }}>{diff.label}</div>
              <div style={{ fontSize: "13px", color: theme.textSecondary }}>{diff.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function ChallengeScreen({ todayColor, onComplete, existingSubmission }) {
  const [difficulty, setDifficulty] = useState(existingSubmission?.difficulty || null);
  const [photos, setPhotos] = useState([]);
  const [results, setResults] = useState(existingSubmission?.results || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [previews, setPreviews] = useState([]);
  const submitPreviewsRef = useRef([]);
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

  const handleFileInput = (e) => { if (e.target.files) addFiles(e.target.files); };

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
      submitPreviewsRef.current = dataUrls;
      setResults(res);
      setAnalyzing(false);
      onComplete(res, difficulty);
    } catch {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setDifficulty(null);
    submitPreviewsRef.current = [];
    setPhotos([]);
    setPreviews((old) => { old.forEach(URL.revokeObjectURL); return []; });
    setHasReset(true);
  };

  if (results) {
    return <ResultsScreen results={results} previews={submitPreviewsRef.current} todayColor={todayColor} onReset={handleReset} difficulty={difficulty} />;
  }

  if (existingSubmission?.completed && !hasReset) {
    return <ResultsScreen results={existingSubmission.results} previews={[]} todayColor={todayColor} onReset={handleReset} difficulty={existingSubmission.difficulty || "easy"} />;
  }

  if (!difficulty) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Card>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: theme.textTertiary, marginBottom: "20px" }}>
              Today's Color
            </div>
            <ColorSwatch hex={todayColor.hex} name={todayColor.name} large />
          </div>
        </Card>
        <DifficultyPicker onSelect={setDifficulty} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Card>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: theme.textTertiary, marginBottom: "20px" }}>
            Today's Color
          </div>
          <ColorSwatch hex={todayColor.hex} name={todayColor.name} large />
          <div style={{ marginTop: "20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.textTertiary} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            <CountdownTimer />
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: theme.textTertiary, marginBottom: "16px" }}>
          Upload Photos ({photos.length}/{maxPhotos})
        </div>
        <div style={{ fontSize: "14px", color: theme.textSecondary, marginBottom: "20px", lineHeight: 1.5 }}>
          Find <strong>{todayColor.name}</strong> in the real world and upload {maxPhotos} photos.{difficulty === "hard" ? " Tight color matching — only close shades count!" : " Each photo just needs a touch of the color somewhere in the frame — we use a wide color tolerance so natural lighting and shades all count!"}
        </div>

        {previews.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "12px", marginBottom: "20px" }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position: "relative", borderRadius: "12px", overflow: "hidden", aspectRatio: "1", background: theme.surfaceAlt }}>
                <img src={src} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => removePhoto(i)} style={{
                  position: "absolute", top: "6px", right: "6px", width: "24px", height: "24px",
                  borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff",
                  border: "none", cursor: "pointer", fontSize: "14px", display: "flex",
                  alignItems: "center", justifyContent: "center", lineHeight: 1,
                }}>×</button>
              </div>
            ))}
          </div>
        )}

        {photos.length < maxPhotos && (
          <div style={{ marginBottom: "16px" }}>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Upload Photos
            </Button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileInput} style={{ display: "none" }} />

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {photos.length === maxPhotos && (
            <Button onClick={handleSubmit} disabled={analyzing}>
              {analyzing ? (
                <>
                  <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Analyzing...
                </>
              ) : "Submit Challenge"}
            </Button>
          )}
        </div>
      </Card>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function ResultsScreen({ results, previews = [], todayColor, onReset, difficulty = "easy" }) {
  const config = DIFFICULTY[difficulty];
  const passCount = results.filter((r) => r.passed).length;
  const allPassed = passCount === results.length;

  const diffLabel = difficulty === "hard" ? " [Hard Mode]" : "";
  const shareText = `🎨 Color Snap ${getLocalDateStr()}${diffLabel}\n\n${todayColor.hex} ${todayColor.name}\n\n${results.map((r) => (r.passed ? "🟢" : "🔴")).join("")} ${passCount}/${results.length}`;

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ text: shareText }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      alert("Copied to clipboard!");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Card style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>{allPassed ? "🎉" : "📸"}</div>
        <div style={{ fontSize: "22px", fontWeight: 700, color: theme.text, marginBottom: "4px" }}>
          {allPassed ? "Perfect Score!" : passCount > 0 ? "Nice Work!" : "Keep Trying!"}
        </div>
        <div style={{ fontSize: "14px", color: theme.textSecondary }}>
          {passCount}/{results.length} photos passed{difficulty === "hard" ? " — Hard Mode" : ""}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "2px", color: theme.textTertiary, marginBottom: "20px" }}>
          Results
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {results.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", borderRadius: theme.radiusSm,
              background: r.passed ? "#E8F5E9" : "#FFEBEE",
              border: `1px solid ${r.passed ? "#C8E6C9" : "#FFCDD2"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "22px" }}>{r.passed ? "🟢" : "🔴"}</span>
                {previews[i] && (
                  <img src={previews[i]} alt={`Photo ${i + 1}`} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px", border: `2px solid ${r.passed ? "#C8E6C9" : "#FFCDD2"}` }} />
                )}
                <span style={{ fontWeight: 600, fontSize: "15px", color: theme.text }}>Photo {i + 1}</span>
              </div>
              <div style={{ fontFamily: theme.mono, fontSize: "14px", color: r.passed ? theme.green : theme.red, fontWeight: 700 }}>
                {r.matchPercentage}%
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ textAlign: "center", background: theme.surfaceAlt }}>
        <div style={{ fontFamily: theme.mono, fontSize: "13px", color: theme.textSecondary, marginBottom: "16px", whiteSpace: "pre-line", lineHeight: 1.8, textAlign: "left", padding: "12px 16px", background: theme.surface, borderRadius: theme.radiusSm, border: `1px solid ${theme.border}` }}>
          {shareText}
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Button onClick={handleShare}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
            Share Results
          </Button>
          {onReset && (
            <Button variant="secondary" onClick={onReset}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
              Try Again
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function CalendarScreen({ submissions, onExport, onImport }) {
  const fileInputRef = useRef(null);
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const monthName = new Date(viewYear, viewMonth).toLocaleString("default", { month: "long", year: "numeric" });

  const streak = calculateStreak(submissions);

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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Card style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "8px" }}>🔥</div>
        <div style={{ fontSize: "40px", fontWeight: 700, fontFamily: theme.mono, color: theme.text }}>{streak}</div>
        <div style={{ fontSize: "14px", color: theme.textSecondary, fontWeight: 500 }}>day streak</div>
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <Button variant="ghost" onClick={prevMonth}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </Button>
          <div style={{ fontSize: "16px", fontWeight: 600, color: theme.text }}>{monthName}</div>
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
            const dayColor = getColorForDate(dateStr);
            const isToday = dateStr === getLocalDateStr();

            return (
              <div key={dateStr} style={{
                position: "relative", aspectRatio: "1",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "10px", fontSize: "13px", fontWeight: isToday ? 700 : 500,
                color: sub?.completed ? "#FFF" : isToday ? theme.text : theme.textSecondary,
                background: sub?.completed ? dayColor.hex : isToday ? theme.surfaceAlt : "transparent",
                border: isToday && !sub?.completed ? `2px solid ${theme.border}` : "none",
                boxShadow: sub?.completed ? `0 2px 8px ${dayColor.hex}44` : "none",
                cursor: "default",
                transition: "all 0.2s ease",
              }}>
                {day}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: theme.text }}>Your Data</div>
          <div style={{ fontSize: "13px", color: theme.textSecondary, marginTop: "2px" }}>Transfer streak data between devices</div>
        </div>
        <input ref={fileInputRef} type="file" accept=".json,application/json" style={{ display: "none" }}
          onChange={(e) => { if (e.target.files[0]) { onImport(e.target.files[0]); e.target.value = ""; } }} />
        <div style={{ display: "flex", gap: "12px" }}>
          <Button variant="secondary" onClick={onExport} style={{ flex: 1, justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Export
          </Button>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()} style={{ flex: 1, justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Import
          </Button>
        </div>
      </Card>
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
        background: theme.surface, borderRadius: theme.radius, padding: "32px 28px",
        maxWidth: "400px", width: "100%", boxShadow: theme.shadowLg,
        position: "relative",
      }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: "absolute", top: "16px", right: "16px", width: "28px", height: "28px",
          borderRadius: "50%", background: theme.surfaceAlt, color: theme.textSecondary,
          border: `1px solid ${theme.border}`, cursor: "pointer", fontSize: "16px",
          display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
        }}>×</button>

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎨</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: theme.text, marginBottom: "4px" }}>Welcome to Color Snap</div>
          <div style={{ fontSize: "14px", color: theme.textSecondary }}>Your daily color challenge</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "28px" }}>
          {[
            { icon: "🎯", title: "Daily Color", desc: "Each day you get a new color to find in the real world." },
            { icon: "📸", title: "Snap Photos", desc: "Upload photos that contain the day's color anywhere in the frame." },
            { icon: "✅", title: "Get Scored", desc: "Each photo is analyzed for color accuracy. Choose Easy (3 photos) or Hard (5 photos)!" },
            { icon: "🔥", title: "Build a Streak", desc: "Complete challenges daily to build your streak and share results." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ fontSize: "22px", lineHeight: 1, flexShrink: 0, marginTop: "2px" }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 600, color: theme.text, marginBottom: "2px" }}>{item.title}</div>
                <div style={{ fontSize: "13px", color: theme.textSecondary, lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onClose} style={{ width: "100%", justifyContent: "center" }}>
          Got it, let's go!
        </Button>
      </div>
    </div>
  );
}

/* ─── App ─── */
export default function Game() {
  const [tab, setTab] = useState("challenge");
  const [data, setData] = useState(loadData);
  const [showInfo, setShowInfo] = useState(() => !localStorage.getItem(ONBOARDING_KEY));
  const todayStr = getLocalDateStr();
  const todayColor = useMemo(() => getColorForDate(todayStr), [todayStr]);

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
        [todayStr]: { completed: true, results, passCount, date: todayStr, difficulty },
      },
    };
    setData(newData);
    saveData(newData);
  };

  const tabs = [
    { id: "challenge", label: "Challenge", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
    )},
    { id: "calendar", label: "Streak", icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    )},
  ];

  return (
    <div style={{ fontFamily: theme.font, background: theme.bg, minHeight: "100vh", color: theme.text }}>
      <style>{fonts}</style>

      {/* Onboarding / Info Modal */}
      {showInfo && <InfoModal onClose={handleCloseInfo} />}

      {/* Floating Info Button */}
      <button onClick={() => setShowInfo(true)} style={{
        position: "fixed", bottom: "80px", right: "20px", zIndex: 99,
        width: "40px", height: "40px", borderRadius: "50%",
        background: theme.surface, border: `1px solid ${theme.border}`,
        boxShadow: theme.shadow, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: theme.textSecondary, fontSize: "18px", fontWeight: 700,
        fontFamily: theme.font, transition: "all 0.2s ease",
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
      </button>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100, background: "rgba(250,250,250,0.85)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${theme.border}`, padding: "16px 20px",
      }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "10px", background: todayColor.hex,
              boxShadow: `0 2px 8px ${todayColor.hex}44`,
            }} />
            <div>
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.3px" }}>Color Snap</div>
              <div style={{ fontSize: "11px", color: theme.textTertiary, fontWeight: 500 }}>daily color challenge</div>
            </div>
          </div>
          <div style={{ fontFamily: theme.mono, fontSize: "12px", color: theme.textTertiary }}>
            {todayStr}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "480px", margin: "0 auto", padding: "20px 16px 100px" }}>
        {tab === "challenge" && (
          <ChallengeScreen
            todayColor={todayColor}
            onComplete={handleComplete}
            existingSubmission={data.submissions[todayStr]}
          />
        )}
        {tab === "calendar" && <CalendarScreen
          submissions={data.submissions}
          onExport={() => exportData(data.submissions)}
          onImport={(file) => {
            importData(file, data.submissions).then((result) => {
              const newData = { ...data, submissions: result.merged };
              setData(newData);
              saveData(newData);
              alert(`Imported ${result.importedCount} submissions from ${result.exportedFrom}${result.overlapping > 0 ? ` (${result.overlapping} overlapping — best scores kept)` : ""}`);
            }).catch((err) => alert(err.message));
          }}
        />}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(250,250,250,0.9)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)", borderTop: `1px solid ${theme.border}`,
      }}>
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", padding: "8px 0 env(safe-area-inset-bottom, 8px)" }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
              padding: "10px 0", border: "none", background: "transparent", cursor: "pointer",
              color: tab === t.id ? theme.text : theme.textTertiary,
              transition: "color 0.2s ease",
            }}>
              {t.icon}
              <span style={{ fontSize: "11px", fontWeight: 600 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
