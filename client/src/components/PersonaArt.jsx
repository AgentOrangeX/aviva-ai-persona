import { useId } from 'react';

const COLORS = {
  explorer: ['#4F97D6', '#176FC1'],
  optimiser: ['#FCCA12', '#E0AE00'],
  collaborator: ['#59C247', '#3FA431'],
  innovator: ['#8A4FC4', '#176FC1'],
  builder: ['#0E4E8A', '#176FC1'],
  pathfinder: ['#3FA431', '#176FC1'],
  catalyst: ['#FCCA12', '#59C247'],
};

const FACES = {
  explorer: (
    <>
      <circle cx="34" cy="42" r="3.4" fill="#10243A" />
      <circle cx="56" cy="42" r="3.4" fill="#10243A" />
      <path d="M36 56 Q45 64 54 56" stroke="#10243A" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  optimiser: (
    <>
      <rect x="29" y="39" width="9" height="5" rx="2.5" fill="#10243A" />
      <rect x="52" y="39" width="9" height="5" rx="2.5" fill="#10243A" />
      <path d="M37 57 L53 57" stroke="#10243A" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  collaborator: (
    <>
      <circle cx="34" cy="42" r="3.4" fill="#10243A" />
      <circle cx="56" cy="42" r="3.4" fill="#10243A" />
      <path d="M34 55 Q45 62 56 55" stroke="#10243A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="28" cy="50" r="3" fill="#FCCA12" opacity=".7" />
      <circle cx="62" cy="50" r="3" fill="#FCCA12" opacity=".7" />
    </>
  ),
  innovator: (
    <>
      <path d="M30 40 L40 44 L30 48" stroke="#10243A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M60 40 L50 44 L60 48" stroke="#10243A" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37 56 Q45 62 53 56" stroke="#10243A" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  builder: (
    <>
      <rect x="30" y="40" width="8" height="6" rx="2" fill="#10243A" />
      <rect x="52" y="40" width="8" height="6" rx="2" fill="#10243A" />
      <rect x="38" y="56" width="14" height="3.5" rx="1.75" fill="#10243A" />
    </>
  ),
  pathfinder: (
    <>
      <circle cx="34" cy="42" r="3.4" fill="#10243A" />
      <circle cx="56" cy="42" r="3.4" fill="#10243A" />
      <path d="M35 57 Q45 61 55 53" stroke="#10243A" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  catalyst: (
    <>
      <path d="M30 39 L38 43" stroke="#10243A" strokeWidth="3" strokeLinecap="round" />
      <path d="M60 39 L52 43" stroke="#10243A" strokeWidth="3" strokeLinecap="round" />
      <circle cx="34" cy="44" r="3.2" fill="#10243A" />
      <circle cx="56" cy="44" r="3.2" fill="#10243A" />
      <path d="M36 55 Q45 64 54 55" stroke="#10243A" strokeWidth="3.4" fill="none" strokeLinecap="round" />
    </>
  ),
};

const MOTIFS = {
  explorer: (c) => (
    <>
      <circle cx="45" cy="20" r="6" fill="#fff" opacity=".9" />
      <path d="M45 14 L45 8 M45 32 L45 26 M51 20 L57 20 M39 20 L33 20" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".85" />
      <circle cx="45" cy="20" r="2.4" fill={c[0]} />
    </>
  ),
  optimiser: () => (
    <>
      <path d="M22 22 L30 14 L38 20 L48 10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
      <circle cx="48" cy="10" r="3" fill="#fff" />
    </>
  ),
  collaborator: () => (
    <>
      <circle cx="33" cy="18" r="6" fill="#fff" opacity=".9" />
      <circle cx="57" cy="18" r="6" fill="#fff" opacity=".9" />
      <path d="M39 18 L51 18" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".9" />
    </>
  ),
  innovator: () => (
    <>
      <path d="M45 8 C38 8 34 13 34 19 C34 24 38 26 38 30 L52 30 C52 26 56 24 56 19 C56 13 52 8 45 8Z" fill="#fff" opacity=".92" />
      <rect x="39" y="31" width="12" height="3.5" rx="1.5" fill="#fff" opacity=".8" />
    </>
  ),
  builder: () => (
    <>
      <rect x="33" y="12" width="11" height="11" rx="2.5" fill="#fff" opacity=".92" />
      <rect x="46" y="12" width="11" height="11" rx="2.5" fill="#fff" opacity=".7" />
      <rect x="39" y="24" width="11" height="9" rx="2.5" fill="#fff" opacity=".8" />
    </>
  ),
  pathfinder: () => (
    <>
      <path d="M25 30 Q40 8 55 24 Q62 32 66 18" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="2 5" opacity=".9" />
      <circle cx="66" cy="18" r="4" fill="#fff" />
      <circle cx="25" cy="30" r="3.2" fill="#fff" />
    </>
  ),
  catalyst: () => (
    <path d="M48 6 L40 24 L48 24 L42 38 L58 18 L49 18 Z" fill="#fff" opacity=".95" />
  ),
};

export function PersonaArt({ persona, size = 72 }) {
  const id = useId().replace(/:/g, '');
  const c = COLORS[persona] || COLORS.explorer;
  return (
    <svg viewBox="0 0 90 90" width={size} height={size} role="img" aria-label={`${persona} persona illustration`}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c[0]} />
          <stop offset="1" stopColor={c[1]} />
        </linearGradient>
        <radialGradient id={`s${id}`} cx=".35" cy=".3" r=".9">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="45" cy="52" r="33" fill={`url(#g${id})`} />
      <circle cx="45" cy="52" r="33" fill={`url(#s${id})`} />
      <g>{FACES[persona]}</g>
      <g>{(MOTIFS[persona] || (() => null))(c)}</g>
    </svg>
  );
}

export function Badge({ persona, size = 200 }) {
  const id = useId().replace(/:/g, '');
  const c = COLORS[persona] || COLORS.explorer;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`${persona} badge`}>
      <defs>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c[0]} />
          <stop offset="1" stopColor={c[1]} />
        </linearGradient>
        <radialGradient id={`gl${id}`} cx=".5" cy=".4" r=".7">
          <stop offset="0" stopColor="#fff" stopOpacity=".4" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform="translate(100,100)">
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x="-4" y="-92" width="8" height="20" rx="4" fill={c[1]} opacity=".55" transform={`rotate(${i * 30})`} />
        ))}
      </g>
      <circle cx="100" cy="100" r="74" fill={`url(#r${id})`} stroke="#fff" strokeWidth="5" />
      <circle cx="100" cy="100" r="74" fill={`url(#gl${id})`} />
      <g transform="translate(55,48)">
        <PersonaArt persona={persona} size={90} />
      </g>
    </svg>
  );
}

export { COLORS };
