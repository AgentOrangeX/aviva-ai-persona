/**
 * Persona content. The visual SVGs live in the client; this is the
 * textual content the API returns alongside a scored result.
 */
export const PERSONAS = {
  explorer: {
    name: 'Explorer', emoji: '🧭', colors: ['#4F97D6', '#176FC1'],
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
    journey: [
      { title: 'Prompt fundamentals', detail: 'Master clear prompting and verification habits in Microsoft Copilot.', meta: 'Self-paced • 2 hrs', url: 'https://learn.microsoft.com/en-us/training/modules/write-effective-prompts-do-more-prompting/' },
      { title: 'Tool radar', detail: 'Build your AI fluency and learn what the main tools are good for.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/ai/' },
      { title: 'Work smarter with Copilot', detail: 'Hands-on module on using Copilot day to day.', meta: 'Self-paced • 1 hr', url: 'https://learn.microsoft.com/en-us/training/modules/explore-microsoft-copilot-business-users/' },
      { title: 'Responsible AI basics', detail: 'Understand the principles of using AI safely and responsibly.', meta: 'Required • 1 hr', url: 'https://learn.microsoft.com/en-us/training/modules/embrace-responsible-ai-principles-practices/' },
    ],
    careers: [
      { role: 'AI Adoption Specialist', detail: 'Help teams discover and embed new tools' },
      { role: 'Innovation Analyst', detail: 'Scout and trial emerging capabilities' },
    ],
    communities: [
      { emoji: '🧪', name: 'AI Explorers Guild' },
      { emoji: '💬', name: 'Copilot Champions' },
      { emoji: '📚', name: 'Learning Lab' },
    ],
  },
  optimiser: {
    name: 'Optimiser', emoji: '⚙️', colors: ['#FCCA12', '#E0AE00'],
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
    journey: [
      { title: 'Workflow mapping', detail: 'Learn to streamline and automate everyday work with Copilot.', meta: 'Self-paced • 1 hr', url: 'https://learn.microsoft.com/en-us/training/modules/explore-microsoft-copilot-business-users/' },
      { title: 'Copilot for productivity', detail: 'Automate summaries, drafting and data tidy-ups across Microsoft 365.', meta: 'Self-paced • 3 hrs', url: 'https://learn.microsoft.com/en-us/training/paths/craft-effective-prompts-copilot-microsoft-365/' },
      { title: 'Power Platform intro', detail: 'Build simple flows that save your team time each week.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/training/paths/create-powerapps/' },
      { title: 'Responsible AI basics', detail: 'Apply responsible AI principles to anything you automate.', meta: 'Required • 1 hr', url: 'https://learn.microsoft.com/en-us/training/modules/embrace-responsible-ai-principles-practices/' },
    ],
    careers: [
      { role: 'Automation Lead', detail: 'Own process automation across a function' },
      { role: 'Operations AI Partner', detail: 'Embed AI into operational workflows' },
    ],
    communities: [
      { emoji: '⚡', name: 'Automation Network' },
      { emoji: '📊', name: 'Process Excellence' },
      { emoji: '🛠️', name: 'Power Platform Users' },
    ],
  },
  collaborator: {
    name: 'Collaborator', emoji: '🤝', colors: ['#59C247', '#3FA431'],
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
    journey: [
      { title: 'AI literacy for all', detail: 'Build the foundational AI fluency you can share with your team.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/ai/' },
      { title: 'Work smarter with Copilot', detail: 'Practical Copilot skills you can demo to colleagues.', meta: 'Self-paced • 1 hr', url: 'https://learn.microsoft.com/en-us/training/modules/explore-microsoft-copilot-business-users/' },
      { title: 'AI for business leaders', detail: 'How teams adopt AI, and how to bring people with you.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/training/paths/transform-your-business-with-microsoft-ai/' },
      { title: 'Responsible AI basics', detail: 'Ground your advocacy in responsible AI principles.', meta: 'Required • 1 hr', url: 'https://learn.microsoft.com/en-us/training/modules/embrace-responsible-ai-principles-practices/' },
    ],
    careers: [
      { role: 'AI Enablement Manager', detail: 'Lead adoption programmes across teams' },
      { role: 'People & Culture AI Lead', detail: 'Shape how Aviva learns to use AI' },
    ],
    communities: [
      { emoji: '🌱', name: 'AI Champions Network' },
      { emoji: '🎤', name: 'Enablement Circle' },
      { emoji: '🤗', name: 'Inclusive Tech Group' },
    ],
  },
  innovator: {
    name: 'Innovator', emoji: '💡', colors: ['#8A4FC4', '#176FC1'],
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
    journey: [
      { title: 'AI fundamentals', detail: 'Understand what generative AI can and cannot do.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/training/paths/get-started-with-artificial-intelligence-on-azure/' },
      { title: 'GenAI use-case design', detail: 'Explore Azure OpenAI and how to shape novel AI concepts.', meta: 'Self-paced • 3 hrs', url: 'https://learn.microsoft.com/en-us/training/paths/develop-ai-solutions-azure-openai/' },
      { title: 'Prompt engineering', detail: 'Sharpen the prompting skills behind great prototypes.', meta: 'Self-paced • 1 hr', url: 'https://learn.microsoft.com/en-us/training/modules/write-effective-prompts-do-more-prompting/' },
      { title: 'Responsible innovation', detail: 'Stress-test ideas against ethics and risk.', meta: 'Required • 1 hr', url: 'https://learn.microsoft.com/en-us/training/modules/embrace-responsible-ai-principles-practices/' },
    ],
    careers: [
      { role: 'AI Product Owner', detail: 'Shape AI-powered products end-to-end' },
      { role: 'Innovation Lead', detail: 'Drive the future-of-insurance agenda' },
    ],
    communities: [
      { emoji: '🚀', name: 'Innovation Studio' },
      { emoji: '🔮', name: 'Future of Insurance Lab' },
      { emoji: '🎨', name: 'GenAI Use-case Forum' },
    ],
  },
  builder: {
    name: 'Builder', emoji: '🔧', colors: ['#0E4E8A', '#176FC1'],
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
    journey: [
      { title: 'Azure AI fundamentals', detail: 'Solidify the foundations of AI services and how they fit together.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/training/paths/get-started-with-artificial-intelligence-on-azure/' },
      { title: 'Build with Azure OpenAI', detail: 'Create a small tool using the Azure OpenAI service and APIs.', meta: 'Hands-on • 4 hrs', url: 'https://learn.microsoft.com/en-us/training/paths/develop-ai-solutions-azure-openai/' },
      { title: 'Responsible AI engineering', detail: 'Apply responsible AI to anything you build.', meta: 'Required • 2 hrs', url: 'https://learn.microsoft.com/en-us/training/modules/embrace-responsible-ai-principles-practices/' },
      { title: 'GitHub Copilot for devs', detail: 'Speed up your build workflow with AI-assisted coding.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/training/paths/copilot/' },
    ],
    careers: [
      { role: 'AI Engineer', detail: 'Build and deploy AI capabilities' },
      { role: 'ML Solutions Developer', detail: 'Develop models for insurance use-cases' },
    ],
    communities: [
      { emoji: '🧱', name: 'AI Builders Guild' },
      { emoji: '💾', name: 'Data & Models Group' },
      { emoji: '🔌', name: 'API Practitioners' },
    ],
  },
  pathfinder: {
    name: 'Pathfinder', emoji: '🗺️', colors: ['#3FA431', '#176FC1'],
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
    journey: [
      { title: 'AI for business leaders', detail: 'Plan, strategise and scale AI initiatives responsibly.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/training/paths/transform-your-business-with-microsoft-ai/' },
      { title: 'Responsible AI principles', detail: 'Understand the governance and risk expectations for AI.', meta: 'Required • 2 hrs', url: 'https://learn.microsoft.com/en-us/training/modules/embrace-responsible-ai-principles-practices/' },
      { title: 'AI fluency foundations', detail: 'Map AI opportunities to business objectives with confidence.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/ai/' },
      { title: 'Lead a roadmap', detail: 'Apply Copilot adoption practices to plan your area\'s roll-out.', meta: 'Self-paced', url: 'https://adoption.microsoft.com/en-us/copilot/' },
    ],
    careers: [
      { role: 'AI Strategy Manager', detail: 'Set the AI agenda for a business unit' },
      { role: 'Transformation Lead', detail: 'Steer large-scale AI change' },
    ],
    communities: [
      { emoji: '🧭', name: 'AI Strategy Council' },
      { emoji: '⚖️', name: 'Responsible AI Forum' },
      { emoji: '📈', name: 'Transformation Network' },
    ],
  },
  catalyst: {
    name: 'Catalyst', emoji: '⚡', colors: ['#FCCA12', '#59C247'],
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
    journey: [
      { title: 'AI for business leaders', detail: 'Frame a vision and lead AI adoption across your area.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/training/paths/transform-your-business-with-microsoft-ai/' },
      { title: 'Copilot adoption playbook', detail: 'Practical guidance for driving adoption at scale.', meta: 'Self-paced', url: 'https://adoption.microsoft.com/en-us/copilot/' },
      { title: 'Executive AI fluency', detail: 'Speak credibly about AI value and risk to leadership.', meta: 'Self-paced', url: 'https://learn.microsoft.com/en-us/ai/' },
      { title: 'Responsible AI leadership', detail: 'Own the ethics conversation for your team.', meta: 'Required • 2 hrs', url: 'https://learn.microsoft.com/en-us/training/modules/embrace-responsible-ai-principles-practices/' },
    ],
    careers: [
      { role: 'Head of AI Enablement', detail: 'Lead Aviva\'s adoption at scale' },
      { role: 'Director, AI Transformation', detail: 'Own the enterprise AI agenda' },
    ],
    communities: [
      { emoji: '⚡', name: 'AI Leaders Circle' },
      { emoji: '🌍', name: 'Enterprise Change Network' },
      { emoji: '🏆', name: 'Champions Council' },
    ],
  },
};
