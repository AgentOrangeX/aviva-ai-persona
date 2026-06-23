import { useEffect, useState, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Badge, COLORS } from '../components/PersonaArt.jsx';
import { Confetti, useToast } from '../components/UI.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const DIM_LABELS = {
  curiosity: 'Curiosity',
  influence: 'Influence',
  innovation: 'Innovation',
  technical: 'Technical capability',
  strategy: 'Strategic thinking',
  change: 'Change leadership',
  customer: 'Customer focus',
};
const DIM_COLORS = {
  curiosity: '#176FC1', influence: '#FCCA12', innovation: '#59C247',
  technical: '#0E4E8A', strategy: '#8A4FC4', change: '#E0AE00', customer: '#3FA431',
};

const ACHIEVEMENTS = {
  finisher: { emoji: '🏁', name: 'Finisher', desc: 'Completed the assessment' },
  rare: { emoji: '💎', name: 'Rare Find', desc: 'Unlocked a rare persona' },
  balanced: { emoji: '⚖️', name: 'Well Rounded', desc: 'Strong across many dimensions' },
  curious: { emoji: '🧭', name: 'Endlessly Curious', desc: 'Off-the-chart curiosity' },
  customer: { emoji: '❤️', name: 'Customer Champion', desc: 'Customer focus leads the way' },
  champion: { emoji: '⚡', name: 'Change Champion', desc: 'High potential to drive adoption' },
};
const ALL_ACH = Object.keys(ACHIEVEMENTS);

export default function ResultPage() {
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const [showShare, setShowShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(location.state?.saved || false);

  const result = location.state?.result;
  const fromHistory = location.state?.fromHistory || false;

  useEffect(() => {
    if (!result || fromHistory) return;
    // celebratory toast on mount (only for a freshly completed result)
    const t = setTimeout(() => {
      toast({ emoji: result.persona.emoji, title: `You're ${article(result.persona.name)} ${result.persona.name}!`, detail: result.rare ? 'A rare persona — nice!' : 'Explore your strengths below.' });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!result) {
    return (
      <div className="wrap">
        <div className="center-msg">
          <p>No result to show yet.</p>
          <Link to="/quiz" className="btn" style={{ marginTop: 16 }}>Take the quiz →</Link>
        </div>
      </div>
    );
  }

  const p = result.persona;
  const c = COLORS[p.key] || COLORS.explorer;
  const achievements = result.achievements || [];

  return (
    <>
      <Confetti fire={!fromHistory} />
      <div className="wrap">
        <section className="result-hero">
          <div className="badge-stage"><Badge persona={p.key} size={200} /></div>
          <div className={`rarity ${result.rare ? 'rare' : 'common'}`}>
            {result.rare ? '💎 Rare persona' : '✨ Your persona'}
          </div>
          <h1>{p.emoji} The {p.name}</h1>
          <p className="tag">{p.title}</p>
          <p className="tag" style={{ marginTop: 12 }}>{p.blurb}</p>
        </section>

        <div className="grid2">
          <div className="panel">
            <h3><span className="ic" style={{ background: c[0] }}>★</span> Your superpowers</h3>
            <ul className="list">
              {p.superpowers.map((s, i) => (
                <li key={i}><span className="mk" style={{ background: c[0] }}>✓</span>{s}</li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3><span className="ic" style={{ background: c[1] }}>↗</span> Growth areas</h3>
            <ul className="list">
              {p.growthAreas.map((s, i) => (
                <li key={i}><span className="mk" style={{ background: c[1] }}>→</span>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="panel dims">
          <h3><span className="ic" style={{ background: '#176FC1' }}>≡</span> Your dimension profile</h3>
          {Object.entries(result.dimPct).map(([key, val]) => (
            <div className="dim-row" key={key}>
              <span className="lab">{DIM_LABELS[key]}</span>
              <div className="dim-bar"><i style={{ width: `${val}%`, background: DIM_COLORS[key] }} /></div>
              <span className="val">{val}</span>
            </div>
          ))}
        </div>

        <div className="panel journey">
          <h3><span className="ic" style={{ background: c[0] }}>↪</span> Your learning journey</h3>
          <div className="steps">
            {p.journey.map((step, i) => (
              <div className="step" key={i}>
                <span className="num" style={{ background: i % 2 ? c[1] : c[0] }}>{i + 1}</span>
                <div className="body">
                  <b>
                    {step.url ? (
                      <a href={step.url} target="_blank" rel="noopener noreferrer" className="step-link">
                        {step.title} <span className="step-ext" aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      step.title
                    )}
                  </b>
                  <p>{step.detail}</p>
                  {step.url ? (
                    <a href={step.url} target="_blank" rel="noopener noreferrer" className="meta meta-link">
                      {step.meta} · Open resource ↗
                    </a>
                  ) : (
                    <span className="meta">{step.meta}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid2">
          <div className="panel">
            <h3><span className="ic" style={{ background: c[0] }}>◎</span> Career directions</h3>
            <div className="career">
              {p.careers.map((r, i) => (
                <div className="role" key={i}><b>{r.role}</b><span>{r.detail}</span></div>
              ))}
            </div>
            <p className="section-note">These are some suggested roles that are starting to emerge in the AI space in the insurance sector. As these types of roles arise at Aviva, they will appear here.</p>
          </div>
          <div className="panel">
            <h3><span className="ic" style={{ background: c[1] }}>◆</span> Communities to join</h3>
            <div className="coming-soon">
              <span className="coming-soon-badge">Coming soon</span>
              <p>AI communities at Aviva are being set up. Once they launch, the ones suited to your persona will appear here.</p>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3><span className="ic" style={{ background: '#E0AE00' }}>🏆</span> Achievements</h3>
          <div className="ach-grid">
            {ALL_ACH.map((key) => {
              const a = ACHIEVEMENTS[key];
              const unlocked = achievements.includes(key);
              return (
                <div className={`ach ${unlocked ? '' : 'locked'}`} key={key}>
                  <span className="em">{a.emoji}</span>
                  <div><b>{a.name}</b><span>{unlocked ? a.desc : 'Locked'}</span></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="result-cta">
          <button className="btn sun" onClick={() => setShowShare(true)}>📇 Share my card</button>
          {fromHistory ? (
            <Link to="/my-results" className="btn">← Back to my results</Link>
          ) : (
            <>
              <Link to="/quiz" className="btn outline">↻ Retake quiz</Link>
              {user && <Link to="/my-results" className="btn">My results →</Link>}
            </>
          )}
        </div>
      </div>

      {showShare && (
        <ShareModal result={result} onClose={() => setShowShare(false)} toast={toast} />
      )}
    </>
  );
}

function ShareModal({ result, onClose, toast }) {
  const p = result.persona;
  const c = COLORS[p.key] || COLORS.explorer;
  const cardRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);

  useEffect(() => {
    // Feature-detect Web Share with files (mobile mostly).
    try {
      setCanShareFiles(!!navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  function copy() {
    const text = `I'm ${article(p.name)} ${p.name} ${p.emoji} — ${p.title}. Discover your Aviva AI Persona!`;
    navigator.clipboard?.writeText(text).then(
      () => toast({ emoji: '📋', title: 'Copied to clipboard!' }),
      () => toast({ emoji: '⚠️', title: 'Could not copy' })
    );
  }

  // Render an SVG element to a loaded HTMLImageElement.
  function svgToImage(svgEl, px) {
    return new Promise((resolve, reject) => {
      const xml = new XMLSerializer().serializeToString(svgEl);
      const svg64 = btoa(unescape(encodeURIComponent(xml)));
      const img = new Image();
      img.width = px;
      img.height = px;
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = `data:image/svg+xml;base64,${svg64}`;
    });
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Compose the share card on a canvas and return a PNG blob.
  async function buildImage() {
    const W = 1080;
    const H = 1350; // portrait, social-friendly
    const scale = 2; // crisp on retina
    const canvas = document.createElement('canvas');
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#FBFAF6';
    ctx.fillRect(0, 0, W, H);

    // Top banner gradient (persona colours)
    const grad = ctx.createLinearGradient(0, 0, W, 620);
    grad.addColorStop(0, c[0]);
    grad.addColorStop(1, c[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 620);

    // Brand line
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = '700 30px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AVIVA · AI PERSONA', W / 2, 90);

    // Badge (rasterised from the hidden SVG in the modal)
    const svgEl = cardRef.current?.querySelector('svg');
    if (svgEl) {
      const badgeImg = await svgToImage(svgEl, 360);
      ctx.drawImage(badgeImg, W / 2 - 180, 150, 360, 360);
    }

    // Persona name
    ctx.fillStyle = '#10243A';
    ctx.font = '900 76px Segoe UI, system-ui, sans-serif';
    ctx.fillText(`${p.emoji} ${p.name}`, W / 2, 760);

    // Title (wrapped)
    ctx.fillStyle = '#3C5267';
    ctx.font = '500 36px Segoe UI, system-ui, sans-serif';
    wrapText(ctx, p.title, W / 2, 825, W - 200, 46);

    // Rarity pill
    if (result.rare) {
      ctx.fillStyle = c[1];
      const pillW = 260, pillH = 60, pillX = W / 2 - pillW / 2, pillY = 905;
      roundRect(ctx, pillX, pillY, pillW, pillH, 30);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '800 30px Segoe UI, system-ui, sans-serif';
      ctx.fillText('RARE FIND 💎', W / 2, pillY + 40);
    }

    // Superpowers heading
    let y = result.rare ? 1030 : 980;
    ctx.fillStyle = '#10243A';
    ctx.font = '800 34px Segoe UI, system-ui, sans-serif';
    ctx.fillText('My AI superpowers', W / 2, y);
    y += 56;
    ctx.fillStyle = '#3C5267';
    ctx.font = '500 30px Segoe UI, system-ui, sans-serif';
    p.superpowers.slice(0, 3).forEach((s) => {
      const short = s.split('—')[0].trim();
      wrapText(ctx, `• ${short}`, W / 2, y, W - 220, 40);
      y += 56;
    });

    // Footer
    ctx.fillStyle = '#8A93A0';
    ctx.font = '600 26px Segoe UI, system-ui, sans-serif';
    ctx.fillText('Discover your AI persona at Aviva', W / 2, H - 60);

    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  }

  async function download() {
    setBusy(true);
    try {
      const blob = await buildImage();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aviva-ai-persona-${p.key}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ emoji: '🖼️', title: 'Image downloaded' });
    } catch {
      toast({ emoji: '⚠️', title: 'Could not create image' });
    } finally {
      setBusy(false);
    }
  }

  async function shareImage() {
    setBusy(true);
    try {
      const blob = await buildImage();
      const file = new File([blob], `aviva-ai-persona-${p.key}.png`, { type: 'image/png' });
      await navigator.share({
        files: [file],
        title: 'My Aviva AI Persona',
        text: `I'm ${article(p.name)} ${p.name} ${p.emoji} — ${p.title}.`,
      });
    } catch {
      // user cancelled or share failed — no toast needed
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="share-card" ref={cardRef}>
          <div className="sc-top">
            <div className="sc-brand">Aviva · AI Persona</div>
            <div className="sc-badge"><Badge persona={p.key} size={120} /></div>
          </div>
          <div className="sc-body">
            <h3>{p.emoji} {p.name}</h3>
            <div className="sc-tag">{p.title}</div>
            <div className="sc-supers">
              {p.superpowers.slice(0, 3).map((s, i) => (
                <span key={i}>{s.split('—')[0].split(' ').slice(0, 3).join(' ')}</span>
              ))}
            </div>
            <div className="sc-foot">Discover yours · {result.rare ? 'RARE FIND 💎' : 'aviva.ai/persona'}</div>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn sm" onClick={download} disabled={busy}>{busy ? 'Creating…' : '⬇ Download image'}</button>
          {canShareFiles && <button className="btn sun sm" onClick={shareImage} disabled={busy}>📤 Share</button>}
          <button className="btn outline sm" onClick={copy}>📋 Copy text</button>
        </div>
      </div>
    </div>
  );
}

// Canvas helper: centre-aligned word wrap.
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}

function article(word) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}
