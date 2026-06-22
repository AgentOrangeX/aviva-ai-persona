import { Link } from 'react-router-dom';
import { PersonaArt } from '../components/PersonaArt.jsx';
import { useAuth } from '../lib/auth.jsx';

const PEEK = [
  ['explorer', 'Explorer'],
  ['builder', 'Builder'],
  ['collaborator', 'Collaborator'],
  ['innovator', 'Innovator'],
  ['pathfinder', 'Pathfinder'],
  ['optimiser', 'Optimiser'],
  ['catalyst', 'Catalyst'],
];

export default function IntroPage() {
  const { user } = useAuth();
  return (
    <div className="wrap">
      <section className="hero">
        <span className="eyebrow">⚡ Aviva · AI enablement</span>
        <h1>
          Discover your <span className="grad">AI Persona</span>
        </h1>
        <p className="lead">
          Seven dimensions. Twenty-eight questions. One playful snapshot of how you
          bring AI to life at Aviva — and where you could go next.
        </p>
        <div className="hero-cta">
          <Link to="/quiz" className="btn">Start the quiz →</Link>
          {!user && <Link to="/login" className="btn outline">Log in</Link>}
        </div>

        <div className="persona-peek" aria-hidden="true">
          {PEEK.map(([key, name]) => (
            <div className="peek" key={key}>
              <PersonaArt persona={key} size={72} />
              <span>{name}</span>
            </div>
          ))}
        </div>

        <div className="facts">
          <div className="fact"><b>7</b><span>Personas to unlock</span></div>
          <div className="fact"><b>~4</b><span>Minutes to finish</span></div>
          <div className="fact"><b>1</b><span>Rare persona to find</span></div>
        </div>
      </section>
    </div>
  );
}
