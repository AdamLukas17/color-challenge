import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/* ─── Constants ─── */
const TOLERANCE = 25;
const THRESHOLD = 60;
const MAX_PHOTOS = 5;

/* ─── Curated Color Palette (~100 interesting, photographable colors) ─── */
const PALETTE = [
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

/* ─── Seeded Random (deterministic per date) ─── */
function seededRandom(seed) {
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

function getColorForDate(dateStr) {
  const rng = seededRandom(dateStr + "-colorchallenge-v1");
  const idx = Math.floor(rng() * PALETTE.length);
  return PALETTE[idx];
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function getLocalDateStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getTimeRemaining() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ─── Image Analysis (client-side via Canvas, easily portable to server) ─── */
function analyzeImage(file, targetHex) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 400;
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const target = hexToRgb(targetHex);
      let matchCount = 0;
      const totalPixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const dr = Math.abs(data[i] - target.r);
        const dg = Math.abs(data[i + 1] - target.g);
        const db = Math.abs(data[i + 2] - target.b);
        if (dr <= TOLERANCE && dg <= TOLERANCE && db <= TOLERANCE) {
          matchCount++;
        }
      }
      const pct = (matchCount / totalPixels) * 100;
      URL.revokeObjectURL(url);
      resolve({ matchPercentage: Math.round(pct * 10) / 10, passed: pct >= THRESHOLD });
    };
    img.src = url;
  });
}

/* ─── localStorage helpers ─── */
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

function calculateStreak(submissions) {
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

/* Generate a synthetic test image as a Blob */
function generateTestImage(targetHex, matchPercent) {
  return new Promise((resolve) => {
    const size = 200;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const target = hexToRgb(targetHex);

    // Fill matching portion with target color (with slight natural variation)
    const matchRows = Math.floor(size * (matchPercent / 100));
    for (let y = 0; y < matchRows; y++) {
      for (let x = 0; x < size; x++) {
        const vary = Math.floor(Math.random() * 16) - 8;
        ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, target.r + vary))},${Math.min(255, Math.max(0, target.g + vary))},${Math.min(255, Math.max(0, target.b + vary))})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    // Fill remainder with a contrasting color
    if (matchRows < size) {
      const contrastColors = ["#2B2D42", "#8D99AE", "#EDF2F4", "#D90429", "#FFBE0B"];
      ctx.fillStyle = contrastColors[Math.floor(Math.random() * contrastColors.length)];
      ctx.fillRect(0, matchRows, size, size - matchRows);
      // Add some texture
      for (let y = matchRows; y < size; y++) {
        for (let x = 0; x < size; x += 3) {
          ctx.fillStyle = `rgba(${Math.random()*255|0},${Math.random()*255|0},${Math.random()*255|0},0.15)`;
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }

    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

function ChallengeScreen({ todayColor, onComplete, existingSubmission }) {
  const [photos, setPhotos] = useState([]);
  const [results, setResults] = useState(existingSubmission?.results || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [generating, setGenerating] = useState(false);
  const fileRef = useRef(null);

  const addFiles = useCallback((files) => {
    const newFiles = Array.from(files).filter(f => f.type.startsWith("image/")).slice(0, MAX_PHOTOS - photos.length);
    if (newFiles.length === 0) return;
    const newPhotos = [...photos, ...newFiles].slice(0, MAX_PHOTOS);
    setPhotos(newPhotos);
    const newPreviews = newPhotos.map((f) => URL.createObjectURL(f));
    setPreviews((old) => { old.forEach(URL.revokeObjectURL); return newPreviews; });
  }, [photos]);

  const handleFileInput = (e) => { if (e.target.files) addFiles(e.target.files); };

  const removePhoto = (idx) => {
    const np = [...photos]; np.splice(idx, 1); setPhotos(np);
    const nv = [...previews]; URL.revokeObjectURL(nv[idx]); nv.splice(idx, 1); setPreviews(nv);
  };

  const handleGenerateDemo = async () => {
    setGenerating(true);
    // Generate 5 test images with varying match percentages (some pass, some fail)
    const matchPercents = [85, 72, 45, 91, 55];
    const blobs = await Promise.all(matchPercents.map((pct) => generateTestImage(todayColor.hex, pct)));
    const files = blobs.map((b, i) => new File([b], `test-photo-${i + 1}.png`, { type: "image/png" }));
    setPhotos(files);
    setPreviews((old) => { old.forEach(URL.revokeObjectURL); return files.map(f => URL.createObjectURL(f)); });
    setGenerating(false);
  };

  const handleSubmit = async () => {
    setAnalyzing(true);
    const res = await Promise.all(photos.map((f) => analyzeImage(f, todayColor.hex)));
    setResults(res);
    setAnalyzing(false);
    onComplete(res);
  };

  if (results) {
    return <ResultsScreen results={results} todayColor={todayColor} />;
  }

  if (existingSubmission?.completed) {
    return <ResultsScreen results={existingSubmission.results} todayColor={todayColor} />;
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
          Upload Photos ({photos.length}/{MAX_PHOTOS})
        </div>
        <div style={{ fontSize: "14px", color: theme.textSecondary, marginBottom: "20px", lineHeight: 1.5 }}>
          Take {MAX_PHOTOS} photos where <strong>60%+</strong> of the frame is {todayColor.name} (±{TOLERANCE} RGB tolerance).
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

        {photos.length < MAX_PHOTOS && (
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
          {photos.length === 0 && (
            <Button variant="secondary" onClick={handleGenerateDemo} disabled={generating}>
              {generating ? (
                <>
                  <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: theme.text, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Generating...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Try Demo Photos
                </>
              )}
            </Button>
          )}
          {photos.length === MAX_PHOTOS && (
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

function ResultsScreen({ results, todayColor }) {
  const passCount = results.filter((r) => r.passed).length;
  const allPassed = passCount === MAX_PHOTOS;

  const shareText = `🎨 Color Challenge ${getLocalDateStr()}\n\n${todayColor.hex} ${todayColor.name}\n\n${results.map((r) => (r.passed ? "🟢" : "🔴")).join("")} ${passCount}/${MAX_PHOTOS}`;

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
          {passCount}/{MAX_PHOTOS} photos passed
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
        <Button onClick={handleShare}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
          Share Results
        </Button>
      </Card>
    </div>
  );
}

function CalendarScreen({ submissions }) {
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
    </div>
  );
}

/* ─── App ─── */
export default function App() {
  const [tab, setTab] = useState("challenge");
  const [data, setData] = useState(loadData);
  const todayStr = getLocalDateStr();
  const todayColor = useMemo(() => getColorForDate(todayStr), [todayStr]);

  const handleComplete = (results) => {
    const passCount = results.filter((r) => r.passed).length;
    const newData = {
      ...data,
      submissions: {
        ...data.submissions,
        [todayStr]: { completed: true, results, passCount, date: todayStr },
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
              <div style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.3px" }}>Chromatic</div>
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
        {tab === "calendar" && <CalendarScreen submissions={data.submissions} />}
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
