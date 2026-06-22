import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!result) return;
    // celebratory toast on mount
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
      <Confetti fire={true} />
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
                  <b>{step.title}</b>
                  <p>{step.detail}</p>
                  <span className="meta">{step.meta}</span>
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
          </div>
          <div className="panel">
            <h3><span className="ic" style={{ background: c[1] }}>◆</span> Communities to join</h3>
            <div className="chips">
              {p.communities.map((cm, i) => (
                <span className="chip" key={i}><span className="em">{cm.emoji}</span>{cm.name}</span>
              ))}
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
          <Link to="/quiz" className="btn outline">↻ Retake quiz</Link>
          {user && <Link to="/my-results" className="btn">My results →</Link>}
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
  function copy() {
    const text = `I'm ${article(p.name)} ${p.name} ${p.emoji} — ${p.title}. Discover your Aviva AI Persona!`;
    navigator.clipboard?.writeText(text).then(
      () => toast({ emoji: '📋', title: 'Copied to clipboard!' }),
      () => toast({ emoji: '⚠️', title: 'Could not copy' })
    );
  }
  return (
    <div className="modal-bg" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <div className="share-card">
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
          <button className="btn sm" onClick={copy}>📋 Copy share text</button>
        </div>
      </div>
    </div>
  );
}

function article(word) {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}
