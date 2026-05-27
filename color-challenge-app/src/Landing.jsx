import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const COLORS = [
  { hex: "#F3722C", name: "tangerine" },
  { hex: "#2A9D8F", name: "teal" },
  { hex: "#E63946", name: "crimson" },
  { hex: "#FFBE0B", name: "amber" },
  { hex: "#8338EC", name: "violet" },
  { hex: "#06D6A0", name: "mint green" },
  { hex: "#0077B6", name: "ocean blue" },
  { hex: "#F72585", name: "hot pink" },
  { hex: "#90BE6D", name: "pistachio" },
  { hex: "#FB5607", name: "blaze orange" },
  { hex: "#4361EE", name: "royal blue" },
  { hex: "#FFD166", name: "goldenrod" },
];

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.colorsnap.colorchallenge";
const APP_STORE_URL = "https://apps.apple.com/us/app/color-snap-app/id6768472641";

function luminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

const cap = (s) => s.replace(/\b\w/g, (m) => m.toUpperCase());

export default function Landing() {
  const swatchRef = useRef(null);
  const swatchGlowRef = useRef(null);
  const hexTextRef = useRef(null);
  const nameTextRef = useRef(null);
  const avatarDotRef = useRef(null);
  const phoneWrapRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    let i = 0;
    const tick = () => {
      const c = COLORS[i % COLORS.length];
      const dark = luminance(c.hex) > 0.55;
      const onColor = dark ? "rgba(0,0,0,0.85)" : "#FFFFFF";
      const onColorDim = dark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.7)";

      if (swatchRef.current) swatchRef.current.setAttribute("fill", c.hex);
      if (swatchGlowRef.current) swatchGlowRef.current.setAttribute("fill", c.hex);
      if (avatarDotRef.current) avatarDotRef.current.setAttribute("fill", c.hex);
      if (hexTextRef.current) {
        hexTextRef.current.setAttribute("fill", onColorDim);
        hexTextRef.current.textContent = c.hex;
      }
      if (nameTextRef.current) {
        nameTextRef.current.setAttribute("fill", onColor);
        nameTextRef.current.textContent = cap(c.name);
      }
      if (phoneWrapRef.current) {
        phoneWrapRef.current.style.setProperty("--halo", c.hex);
      }
      i++;
    };

    tick();
    const id = setInterval(tick, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`landing${menuOpen ? " menu-open" : ""}`}>
      <div className="page">

        <header className="topbar">
          <div className="brand">
            color<br />snap
            <div className="jp">un color al día</div>
          </div>

          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "close menu" : "open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="4" y1="8" x2="20" y2="8" />
                <line x1="4" y1="13" x2="20" y2="13" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>

          <nav className="nav" onClick={closeMenu}>
            {/* play web -> /play (router) */}
            <Link className="nav-item" to="/play">
              <svg className="icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="18" cy="18" r="12" />
                <ellipse cx="18" cy="18" rx="6" ry="12" />
                <line x1="6" y1="18" x2="30" y2="18" />
              </svg>
              <div>
                <div className="label">
                  play web <span className="pill live">live</span>
                </div>
                <div className="sub">
                  instant in-browser<br />
                  no install
                </div>
              </div>
            </Link>

            {/* android */}
            <a className="nav-item" href={PLAY_STORE_URL} target="_blank" rel="noreferrer">
              <svg className="icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
                <polygon points="13,10 13,26 28,18" />
              </svg>
              <div>
                <div className="label">
                  android <span className="pill live">live</span>
                </div>
                <div className="sub">
                  <span className="accent">play store</span>
                </div>
              </div>
            </a>

            {/* ios */}
            <a className="nav-item" href={APP_STORE_URL} target="_blank" rel="noreferrer">
              <svg className="icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="11" y="6" width="14" height="24" rx="2.5" />
                <line x1="15" y1="9" x2="21" y2="9" />
                <circle cx="18" cy="27" r="0.8" fill="currentColor" />
              </svg>
              <div>
                <div className="label">
                  ios <span className="pill live">live</span>
                </div>
                <div className="sub">
                  <span className="accent">app store</span>
                </div>
              </div>
            </a>

            {/* about — personal site */}
            <a
              className="nav-item"
              href="https://www.adammolina.com"
              target="_blank"
              rel="noreferrer"
            >
              <svg className="icon" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.2">
                <circle cx="18" cy="18" r="13" />
                <line x1="18" y1="14" x2="18" y2="25" />
                <circle cx="18" cy="11" r="0.9" fill="currentColor" />
              </svg>
              <div>
                <div className="label">about</div>
                <div className="sub">
                  made by<br />
                  <span className="accent">adam</span>
                </div>
              </div>
            </a>
          </nav>

          <div className="meta">
            a daily color hunt.<br />
            one color, one day.
            <div style={{ marginTop: 6, color: "var(--accent)", letterSpacing: "0.05em" }}>
              una caza de color diaria
            </div>
            <div className="mark">C.S.</div>
          </div>
        </header>

        <section className="hero">
          <div className="left">
            <h1>— today's color</h1>
            <p>every day at midnight a new color drops. open the app, point your camera at something that matches, and snap.</p>
            <p className="dim">two difficulties. monthly streaks. web, iOS, and Android.</p>
            <div className="stat-row">
              <div className="stat"><span className="num">101</span>colors</div>
              <div className="stat"><span className="num">∞</span>days</div>
              <div className="stat"><span className="num">2</span>modes</div>
            </div>
          </div>

          <div className="phone-wrap" ref={phoneWrapRef}>
            <svg
              className="phone"
              width="340"
              height="660"
              viewBox="0 0 340 660"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="6" y="6" width="328" height="648" rx="46" fill="#1a1a1a" stroke="#2c2c2c" strokeWidth="1" />
              <rect x="14" y="14" width="312" height="632" rx="40" fill="#0e0e0e" />

              <rect x="2" y="180" width="4" height="60" rx="2" fill="#262626" />
              <rect x="334" y="220" width="4" height="80" rx="2" fill="#262626" />

              <rect x="14" y="14" width="312" height="632" rx="40" fill="#ECF2EE" />

<text x="30" y="92" fill="#1F4D44" fontFamily="Roboto Flex" fontSize="18" fontWeight="700">Color Snap</text>
              <rect x="208" y="76" width="60" height="22" rx="11" fill="#C7E9DD" />
              <text x="238" y="91" fill="#1F4D44" fontFamily="Roboto" fontSize="11" fontWeight="500" textAnchor="middle">May 8</text>
              <circle ref={avatarDotRef} className="avatar-dot" cx="294" cy="87" r="11" fill="#E63946" />

              <path
                ref={swatchGlowRef}
                className="swatch-glow"
                d="M 30 133 Q 30 115 48 115 L 292 115 Q 310 115 310 133 L 310 330 L 30 330 Z"
                fill="#E63946"
              />
              <path
                ref={swatchRef}
                className="swatch"
                d="M 30 133 Q 30 115 48 115 L 292 115 Q 310 115 310 133 L 310 330 L 30 330 Z"
                fill="#E63946"
              />
              <text ref={nameTextRef} className="name-text" x="170" y="237" fill="#FFFFFF" fontFamily="Roboto Flex" fontSize="30" fontWeight="700" textAnchor="middle">Crimson</text>
              <text ref={hexTextRef} className="hex-text" x="170" y="262" fill="rgba(255,255,255,0.7)" fontFamily="Roboto" fontSize="12" fontWeight="500" textAnchor="middle">#E63946</text>

              <path d="M 30 330 L 310 330 L 310 367 Q 310 385 292 385 L 48 385 Q 30 385 30 367 Z" fill="#DDEBE5" />
              <text x="44" y="362" fill="#1F4D44" fontFamily="Roboto" fontSize="11" fontWeight="500">Today's Color</text>
              <rect x="216" y="345" width="82" height="26" rx="13" fill="#C7E9DD" />
              <circle cx="227" cy="358" r="5" fill="none" stroke="#1F4D44" strokeWidth="1" />
              <line x1="227" y1="358" x2="227" y2="355" stroke="#1F4D44" strokeWidth="1" strokeLinecap="round" />
              <line x1="227" y1="358" x2="229" y2="360" stroke="#1F4D44" strokeWidth="1" strokeLinecap="round" />
              <line x1="225" y1="352" x2="229" y2="352" stroke="#1F4D44" strokeWidth="1" strokeLinecap="round" />
              <text x="240" y="362" fill="#1F4D44" fontFamily="Roboto" fontSize="11" fontWeight="500">17:08:42</text>

              <text x="30" y="416" fill="#1F4D44" fontFamily="Roboto Flex" fontSize="10" fontWeight="700" letterSpacing="2">CHOOSE DIFFICULTY</text>
              <text x="30" y="438" fill="#5A6E68" fontFamily="Roboto" fontSize="11">Pick your challenge level for today</text>

              <rect x="30" y="452" width="130" height="100" rx="14" fill="#E5ECE7" />
              <g transform="translate(95 480)">
                <circle r="13" fill="none" stroke="#1F4D44" strokeWidth="2" />
                <circle cx="-4.5" cy="-2" r="1.6" fill="#1F4D44" />
                <circle cx="4.5" cy="-2" r="1.6" fill="#1F4D44" />
                <path d="M -6 3.5 Q 0 9.5 6 3.5" stroke="#1F4D44" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
              <text x="95" y="515" fill="#1F4D44" fontFamily="Roboto" fontSize="13" fontWeight="700" textAnchor="middle">Easy</text>
              <text x="95" y="531" fill="#5A6E68" fontFamily="Roboto" fontSize="9" textAnchor="middle">Wide color tolerance,</text>
              <text x="95" y="543" fill="#5A6E68" fontFamily="Roboto" fontSize="9" textAnchor="middle">3 photos</text>

              <rect x="180" y="452" width="130" height="100" rx="14" fill="#E5ECE7" />
              <g
                transform="translate(245 480)"
                stroke="#1F4D44"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M 0 -12 C -3 -13 -7 -12 -8 -9 C -11 -9 -12 -6 -11 -3 C -13 -1 -13 3 -10 4 C -11 8 -7 11 -3 10 C -2 12 2 12 3 10 C 7 11 11 8 10 4 C 13 3 13 -1 11 -3 C 12 -6 11 -9 8 -9 C 7 -12 3 -13 0 -12 Z" />
                <line x1="0" y1="-11" x2="0" y2="10" />
                <path d="M -7 -4 Q -4 -4 -4 -1 Q -7 -1 -7 2 Q -4 2 -4 5" />
                <path d="M 7 -4 Q 4 -4 4 -1 Q 7 -1 7 2 Q 4 2 4 5" />
              </g>
              <text x="245" y="515" fill="#1F4D44" fontFamily="Roboto" fontSize="13" fontWeight="700" textAnchor="middle">Hard</text>
              <text x="245" y="531" fill="#5A6E68" fontFamily="Roboto" fontSize="9" textAnchor="middle">Tight color tolerance,</text>
              <text x="245" y="543" fill="#5A6E68" fontFamily="Roboto" fontSize="9" textAnchor="middle">5 photos</text>

              <line x1="14" y1="612" x2="326" y2="612" stroke="#D6DEDA" strokeWidth="1" />
              <rect x="60" y="618" width="44" height="22" rx="11" fill="#C7E9DD" />
              <g stroke="#1F4D44" strokeWidth="1.4" fill="none" strokeLinejoin="round">
                <rect x="74" y="624" width="16" height="10" rx="2" />
                <rect x="78" y="622" width="8" height="3" rx="0.5" fill="#1F4D44" stroke="none" />
                <circle cx="82" cy="629" r="2.2" />
              </g>
              <g stroke="#1F4D44" strokeWidth="1.4" fill="none">
                <rect x="162" y="622" width="16" height="14" rx="1.5" />
                <line x1="162" y1="626" x2="178" y2="626" />
                <line x1="166" y1="620" x2="166" y2="624" />
                <line x1="174" y1="620" x2="174" y2="624" />
              </g>
              <g transform="translate(258 629)">
                <g fill="#1F4D44" stroke="none">
                  <rect x="-0.9" y="-7.2" width="1.8" height="2.4" />
                  <rect x="-0.9" y="4.8" width="1.8" height="2.4" />
                  <rect x="-7.2" y="-0.9" width="2.4" height="1.8" />
                  <rect x="4.8" y="-0.9" width="2.4" height="1.8" />
                  <g transform="rotate(45)">
                    <rect x="-0.9" y="-7.2" width="1.8" height="2.4" />
                    <rect x="-0.9" y="4.8" width="1.8" height="2.4" />
                    <rect x="-7.2" y="-0.9" width="2.4" height="1.8" />
                    <rect x="4.8" y="-0.9" width="2.4" height="1.8" />
                  </g>
                </g>
                <circle r="4.6" fill="#ECF2EE" stroke="#1F4D44" strokeWidth="1.4" />
                <circle r="1.7" fill="#1F4D44" />
              </g>
            </svg>
          </div>

          <div className="right">
            <h1>— how it works</h1>
            <p>upload from your camera roll or shoot live. we sample the photo and score it against today's hue, saturation and lightness.</p>
            <p className="dim">your pictures saves locally, export and import progress to move between devices.</p>
            <div className="stat-row">
              <div className="stat"><span className="num">±25°</span>easy</div>
              <div className="stat"><span className="num">±15°</span>hard</div>
            </div>
          </div>
        </section>

        <footer className="footer-row">
          <div>© 2026 color snap · made in brooklyn</div>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="mailto:adammolina17@gmail.com">contact</a>
          </div>
        </footer>

      </div>
    </div>
  );
}
