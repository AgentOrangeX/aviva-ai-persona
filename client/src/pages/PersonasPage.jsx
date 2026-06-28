import { Link } from 'react-router-dom';
import { PersonaArt, COLORS } from '../components/PersonaArt.jsx';

const PERSONAS = [
  {
    key: 'explorer', name: 'Explorer',
    title: 'The curious first-mover who tries everything',
    blurb: 'You reach for the new tool before there is a manual. You learn by doing, and your enthusiasm gives everyone else permission to experiment.',
    superpowers: [
      'Fearless experimenter — you will prototype before others finish the meeting',
      'Spots emerging tools early and shares the good ones',
      'Turns "I wonder if…" into a working demo',
    ],
    growthAreas: [
      'Bring others along — your discoveries are most valuable when shared',
      'Slow down to document what works so it scales beyond you',
      'Connect experiments to clear business outcomes',
    ],
  },
  {
    key: 'builder', name: 'Builder',
    title: 'The maker who ships working solutions',
    blurb: 'Ideas are cheap; you make things real. You go quiet, build the thing, and come back with a tool people can actually use. Reliability is your signature.',
    superpowers: [
      'Turns concepts into robust, working tools',
      'Understands data, models and what "good" looks like',
      'Builds for reuse — your solutions last and scale',
    ],
    growthAreas: [
      'Communicate the "why" so your work gets the visibility it deserves',
      'Involve users earlier to avoid building the wrong thing well',
      'Mentor others into building — multiply your impact',
    ],
  },
  {
    key: 'collaborator', name: 'Collaborator',
    title: 'The connector who makes AI a team sport',
    blurb: 'You are the reason ideas travel. You translate between the curious and the cautious, and you make sure no one gets left behind as the team adopts new ways of working.',
    superpowers: [
      'Brings sceptics on board with patience, not pressure',
      'Translates technical wins into language everyone understands',
      'Builds the psychological safety that lets teams experiment',
    ],
    growthAreas: [
      'Trust your own ideas — you are a creator, not just a connector',
      'Develop deeper technical fluency to widen your influence',
      'Set boundaries so you are enabling, not rescuing',
    ],
  },
  {
    key: 'innovator', name: 'Innovator',
    title: 'The original thinker who imagines what is next',
    blurb: 'You do not just use AI — you reimagine the problem entirely. Your questions start with "what if we did not have to…" and end with something nobody had pictured.',
    superpowers: [
      'Reframes problems so the obvious answer stops being obvious',
      'Connects ideas across domains into novel solutions',
      'Comfortable with ambiguity where others want certainty',
    ],
    growthAreas: [
      'Pair with builders to turn vision into shipped reality',
      'Validate ideas with customers early and often',
      'Pick your battles — not every idea needs to be pursued now',
    ],
  },
  {
    key: 'pathfinder', name: 'Pathfinder',
    title: 'The strategist who maps the route ahead',
    blurb: 'You see the whole board. You weigh risk, value and timing, then chart the path that gets a team somewhere worthwhile — and you know which corners must not be cut.',
    superpowers: [
      'Sees how AI connects to strategy, risk and regulation',
      'Prioritises ruthlessly — separates signal from shiny',
      'Balances ambition with the realities of insurance',
    ],
    growthAreas: [
      'Get hands-on occasionally so strategy stays grounded',
      'Move from plans to momentum — ship a small win',
      'Make space for the wild ideas your strategy might miss',
    ],
  },
  {
    key: 'optimiser', name: 'Optimiser',
    title: 'The efficiency engine who removes friction',
    blurb: 'You see wasted minutes everywhere and quietly automate them away. Where others see "that is just how we do it", you see a workflow waiting to be improved.',
    superpowers: [
      'Turns repetitive work into reusable, automated flows',
      'Measures impact — you can prove the hours you save',
      'Makes processes calmer, faster and less error-prone',
    ],
    growthAreas: [
      'Share your automations so the whole team benefits',
      'Balance optimisation with the human moments worth keeping',
      'Step back to question whether the process should exist at all',
    ],
  },
  {
    key: 'catalyst', name: 'Catalyst',
    title: 'The rare leader who ignites change at scale',
    blurb: 'You do not just adopt AI — you make whole teams move. You combine vision, influence and the courage to lead through uncertainty. Where you go, momentum follows.',
    superpowers: [
      'Mobilises people around a compelling AI vision',
      'Leads confidently through ambiguity and change',
      'Combines strategy, influence and hands-on credibility',
    ],
    growthAreas: [
      'Build a bench — develop the next wave of champions',
      'Protect your energy; lead sustainably, not heroically',
      'Stay close to the detail so your vision stays real',
    ],
  },
];

export default function PersonasPage() {
  return (
    <div className="wrap">
      <section className="hero">
        <span className="eyebrow">⚡ The seven personas</span>
        <h1>
          Meet the <span className="grad">AI Personas</span>
        </h1>
        <p className="lead">
          Everyone brings AI to life in their own way. These seven personas describe
          the distinct strengths people show when adopting AI at work — your
          superpowers, and where you could grow next.
        </p>
        <div className="hero-cta">
          <Link to="/quiz" className="btn">Take the quiz →</Link>
        </div>

        <nav className="persona-chips" aria-label="Jump to a persona">
          {PERSONAS.map((p) => (
            <a key={p.key} href={`#${p.key}`} className="persona-chip">
              <PersonaArt persona={p.key} size={26} />
              {p.name}
            </a>
          ))}
        </nav>
      </section>

      <section className="persona-explainers">
        {PERSONAS.map((p) => {
          const c = COLORS[p.key] || COLORS.explorer;
          const grad = `linear-gradient(135deg, ${c[0]}, ${c[1]})`;
          return (
            <article className="px-card" id={p.key} key={p.key}>
              <div className="px-band" style={{ background: grad }} />
              <div className="px-body">
                <div className="px-head">
                  <PersonaArt persona={p.key} size={62} />
                  <div>
                    <h2 className="px-name">{p.name}</h2>
                    <p className="px-title">{p.title}</p>
                  </div>
                </div>
                <p className="px-blurb">{p.blurb}</p>
                <div className="px-cols">
                  <div className="px-col">
                    <h3>Superpowers</h3>
                    <ul className="px-list px-sp">
                      {p.superpowers.map((s, i) => (
                        <li key={i} style={{ '--bullet': c[0] }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="px-col">
                    <h3>Growth areas</h3>
                    <ul className="px-list px-gr">
                      {p.growthAreas.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
