/**
 * Canonical question bank. Source of truth for scoring.
 * Each option's `weights` feed the hidden dimensions in scoring.js.
 * `type`: behaviour | scenario | mc | insurance | aviva | leadership
 *
 * IMPORTANT: option order and weights are server-authoritative. The client
 * fetches questions WITHOUT weights so the model cannot be reverse-engineered.
 */
export const QUESTIONS = [
  { id: 1, type: 'behaviour', tag: 'Behavioural', text: 'A brand-new AI tool lands in your inbox. What happens next?', options: [
    { text: 'I open it within the hour and start poking around', weights: { curiosity: 3, innovation: 1 } },
    { text: 'I check what problem it solves before touching it', weights: { strategy: 2, technical: 1 } },
    { text: 'I ask the team if anyone has tried it yet', weights: { influence: 2, curiosity: 1 } },
    { text: 'I wait until there is a clear, approved use for it', weights: { change: 1, customer: 1 } },
  ] },
  { id: 2, type: 'scenario', tag: 'Scenario', text: 'Your team is drowning in repetitive claims-status emails. Your instinct?', options: [
    { text: 'Draft a reusable AI prompt template and share it today', weights: { technical: 2, influence: 1 } },
    { text: 'Map the whole workflow, then automate the worst bottleneck', weights: { technical: 2, strategy: 2 } },
    { text: 'Reimagine it — should customers even need to ask?', weights: { innovation: 3, customer: 1 } },
    { text: 'Pitch a proper roadmap to fix it across the function', weights: { strategy: 2, change: 1 } },
  ] },
  { id: 3, type: 'mc', tag: 'Multiple choice', text: 'Pick the phrase that feels most like you:', options: [
    { text: '"Let\'s just try it and see"', weights: { curiosity: 3 } },
    { text: '"Let\'s make this run smoother"', weights: { technical: 2, strategy: 1 } },
    { text: '"Let\'s get everyone on board"', weights: { influence: 2, change: 1 } },
    { text: '"Let\'s question why we do it at all"', weights: { innovation: 2, strategy: 1 } },
  ] },
  { id: 4, type: 'insurance', tag: 'Insurance', text: 'An AI model could speed up underwriting decisions. Your first thought is about…', options: [
    { text: 'How accurate and explainable the model really is', weights: { technical: 2, strategy: 1 } },
    { text: 'Whether it treats every customer fairly', weights: { customer: 3, change: 1 } },
    { text: 'How quickly we could pilot it', weights: { curiosity: 2, innovation: 1 } },
    { text: 'How it fits regulatory and risk expectations', weights: { strategy: 2, change: 1 } },
  ] },
  { id: 5, type: 'behaviour', tag: 'Behavioural', text: 'You learn best by…', options: [
    { text: 'Breaking something and figuring out why', weights: { curiosity: 2, technical: 1 } },
    { text: 'Building a working version of it', weights: { technical: 3 } },
    { text: 'Teaching it to someone else', weights: { influence: 2, change: 1 } },
    { text: 'Seeing how it fits the bigger picture first', weights: { strategy: 3 } },
  ] },
  { id: 6, type: 'scenario', tag: 'Scenario', text: 'A colleague is nervous that AI will replace their role. You…', options: [
    { text: 'Show them a tool that makes their day easier today', weights: { influence: 2, customer: 1 } },
    { text: 'Sit with them and reframe AI as their co-pilot', weights: { change: 3, influence: 1 } },
    { text: 'Explain honestly what AI can and cannot do', weights: { strategy: 1, customer: 2 } },
    { text: 'Invite them to build something small with you', weights: { technical: 1, influence: 1, curiosity: 1 } },
  ] },
  { id: 7, type: 'aviva', tag: 'Aviva', text: 'Aviva serves millions of customers. The AI opportunity that excites you most is…', options: [
    { text: 'Faster, fairer claims that feel human', weights: { customer: 3, change: 1 } },
    { text: 'Smarter products no competitor has imagined', weights: { innovation: 3, strategy: 1 } },
    { text: 'Freeing colleagues from admin to do meaningful work', weights: { change: 2, customer: 1 } },
    { text: 'Rock-solid tools the whole business can rely on', weights: { technical: 2, strategy: 1 } },
  ] },
  { id: 8, type: 'leadership', tag: 'Leadership', text: 'In a group stuck on a hard decision, you tend to…', options: [
    { text: 'Surface a bold option no one has considered', weights: { innovation: 2, influence: 1 } },
    { text: 'Map the trade-offs so the path is clear', weights: { strategy: 3 } },
    { text: 'Get everyone aligned and moving', weights: { influence: 2, change: 2 } },
    { text: 'Prototype an answer to test instead of debate', weights: { technical: 1, curiosity: 2 } },
  ] },
  { id: 9, type: 'mc', tag: 'Multiple choice', text: 'Your ideal AI project would let you…', options: [
    { text: 'Explore lots of tools and possibilities', weights: { curiosity: 3 } },
    { text: 'Build one excellent thing end to end', weights: { technical: 3 } },
    { text: 'Bring a team along on the journey', weights: { influence: 2, change: 1 } },
    { text: 'Shape direction for the whole programme', weights: { strategy: 2, change: 1 } },
  ] },
  { id: 10, type: 'behaviour', tag: 'Behavioural', text: 'When a new idea pops into your head, you usually…', options: [
    { text: 'Sketch it immediately, however rough', weights: { innovation: 2, curiosity: 1 } },
    { text: 'Pressure-test whether it is actually worth doing', weights: { strategy: 2 } },
    { text: 'Run it past people to see if it lands', weights: { influence: 2, customer: 1 } },
    { text: 'Start building a tiny proof of concept', weights: { technical: 2, innovation: 1 } },
  ] },
  { id: 11, type: 'insurance', tag: 'Insurance', text: 'A GenAI assistant drafts customer letters. What matters most to you?', options: [
    { text: 'The tone feels genuinely human and reassuring', weights: { customer: 3 } },
    { text: 'Every claim it makes is accurate and compliant', weights: { technical: 1, strategy: 2 } },
    { text: 'It actually saves advisors meaningful time', weights: { change: 1, strategy: 1, technical: 1 } },
    { text: 'We can keep improving it from real feedback', weights: { curiosity: 2, innovation: 1 } },
  ] },
  { id: 12, type: 'scenario', tag: 'Scenario', text: 'Two teams want opposite things from one AI tool. You…', options: [
    { text: 'Find the shared goal beneath the conflict', weights: { influence: 2, strategy: 1 } },
    { text: 'Build a flexible version that serves both', weights: { technical: 2, innovation: 1 } },
    { text: 'Decide based on customer impact', weights: { customer: 2, strategy: 1 } },
    { text: 'Propose a phased plan so both get a turn', weights: { strategy: 2, change: 1 } },
  ] },
  { id: 13, type: 'leadership', tag: 'Leadership', text: 'People come to you because you are good at…', options: [
    { text: 'Making complex things feel simple', weights: { influence: 2, customer: 1 } },
    { text: 'Knowing how things actually work under the hood', weights: { technical: 3 } },
    { text: 'Seeing three moves ahead', weights: { strategy: 3 } },
    { text: 'Getting things moving when others stall', weights: { change: 3 } },
  ] },
  { id: 14, type: 'behaviour', tag: 'Behavioural', text: 'How do you feel about ambiguity — no clear right answer?', options: [
    { text: 'Love it; that is where the interesting stuff is', weights: { innovation: 2, curiosity: 2 } },
    { text: 'Fine, as long as I can experiment my way through', weights: { curiosity: 2, technical: 1 } },
    { text: 'I bring people together to navigate it', weights: { influence: 2, change: 1 } },
    { text: 'I create structure to reduce it', weights: { strategy: 3 } },
  ] },
  { id: 15, type: 'mc', tag: 'Multiple choice', text: 'A weekend with no plans. Which sounds best?', options: [
    { text: 'Trying a brand-new hobby or gadget', weights: { curiosity: 3 } },
    { text: 'Finally finishing that thing you are making', weights: { technical: 2, innovation: 1 } },
    { text: 'Hosting friends and connecting people', weights: { influence: 2, customer: 1 } },
    { text: 'Planning something ambitious for the months ahead', weights: { strategy: 2, change: 1 } },
  ] },
  { id: 16, type: 'aviva', tag: 'Aviva', text: 'To embed AI across Aviva responsibly, the biggest lever is…', options: [
    { text: 'Helping every colleague feel confident to try', weights: { change: 3, influence: 1 } },
    { text: 'Strong governance people actually trust', weights: { strategy: 2, customer: 1 } },
    { text: 'Brilliant tools that prove their value fast', weights: { technical: 2, innovation: 1 } },
    { text: 'A few visible wins that inspire the rest', weights: { influence: 2, change: 1 } },
  ] },
  { id: 17, type: 'scenario', tag: 'Scenario', text: 'Your AI experiment fails publicly in a demo. You…', options: [
    { text: 'Laugh it off and share what you learned', weights: { curiosity: 2, change: 1 } },
    { text: 'Dig into exactly why it broke', weights: { technical: 3 } },
    { text: 'Reframe it as a step toward the bigger goal', weights: { strategy: 1, change: 2 } },
    { text: 'Use it to make the room comfortable with risk', weights: { influence: 2, change: 1 } },
  ] },
  { id: 18, type: 'behaviour', tag: 'Behavioural', text: 'You would rather be known as the person who…', options: [
    { text: 'Always finds the next big thing', weights: { curiosity: 2, innovation: 1 } },
    { text: 'Builds tools people cannot live without', weights: { technical: 3 } },
    { text: 'Makes everyone around them better', weights: { influence: 2, change: 1 } },
    { text: 'Sets the direction worth following', weights: { strategy: 2, change: 1 } },
  ] },
  { id: 19, type: 'leadership', tag: 'Leadership', text: 'A senior leader asks "should we invest in this AI idea?" You answer with…', options: [
    { text: 'A working demo they can click through', weights: { technical: 2, curiosity: 1 } },
    { text: 'The customer outcome it unlocks', weights: { customer: 3 } },
    { text: 'A clear value-vs-risk case', weights: { strategy: 3 } },
    { text: 'A vision of where it takes us', weights: { innovation: 2, change: 1 } },
  ] },
  { id: 20, type: 'insurance', tag: 'Insurance', text: 'Fraud detection could improve with AI. What is your angle?', options: [
    { text: 'The clever patterns a model could spot', weights: { innovation: 2, technical: 1 } },
    { text: 'Making sure honest customers are not wrongly flagged', weights: { customer: 3 } },
    { text: 'Building the detection pipeline properly', weights: { technical: 3 } },
    { text: 'Where it sits in the wider risk strategy', weights: { strategy: 2, change: 1 } },
  ] },
  { id: 21, type: 'mc', tag: 'Multiple choice', text: 'Choose your spirit emoji:', options: [
    { text: '🧭 always pointing somewhere new', weights: { curiosity: 2, innovation: 1 } },
    { text: '⚙️ quietly making things work', weights: { technical: 2, strategy: 1 } },
    { text: '🤝 better together', weights: { influence: 2, customer: 1 } },
    { text: '⚡ here to spark momentum', weights: { change: 2, influence: 1 } },
  ] },
  { id: 22, type: 'behaviour', tag: 'Behavioural', text: 'When you read about an AI breakthrough, you mostly think…', options: [
    { text: '"I have to try this"', weights: { curiosity: 3 } },
    { text: '"How is it actually built?"', weights: { technical: 3 } },
    { text: '"Who at Aviva needs to hear about this?"', weights: { influence: 2, change: 1 } },
    { text: '"What does this change about our strategy?"', weights: { strategy: 3 } },
  ] },
  { id: 23, type: 'scenario', tag: 'Scenario', text: 'You have one free hour to improve how your team works. You…', options: [
    { text: 'Automate the most annoying repeated task', weights: { technical: 2, strategy: 1 } },
    { text: 'Run a quick session sharing an AI tip', weights: { influence: 2, change: 1 } },
    { text: 'Sketch a bolder way the work could be done', weights: { innovation: 3 } },
    { text: 'Test three new tools and report back', weights: { curiosity: 3 } },
  ] },
  { id: 24, type: 'aviva', tag: 'Aviva', text: 'Aviva\'s purpose is helping people thrive in uncertain times. AI helps most by…', options: [
    { text: 'Personalising support to each customer\'s moment', weights: { customer: 3, innovation: 1 } },
    { text: 'Giving advisors superpowers, not replacing them', weights: { change: 2, influence: 1 } },
    { text: 'Making the business resilient and well-run', weights: { strategy: 2, technical: 1 } },
    { text: 'Opening doors to protect more people, affordably', weights: { innovation: 2, customer: 1 } },
  ] },
  { id: 25, type: 'leadership', tag: 'Leadership', text: 'Your team is hesitant to change how they work. Your move:', options: [
    { text: 'Show, do not tell — demo a quick win live', weights: { technical: 1, influence: 1, curiosity: 1 } },
    { text: 'Listen first, then co-design the change with them', weights: { change: 3, influence: 1 } },
    { text: 'Connect the change to something they care about', weights: { influence: 2, customer: 1 } },
    { text: 'Lay out a clear, low-risk path forward', weights: { strategy: 2, change: 1 } },
  ] },
  { id: 26, type: 'mc', tag: 'Multiple choice', text: 'What gives you the most energy at work?', options: [
    { text: 'Discovering something nobody else has tried', weights: { curiosity: 2, innovation: 1 } },
    { text: 'Seeing a thing you built being used', weights: { technical: 3 } },
    { text: 'A team clicking into gear together', weights: { influence: 2, change: 1 } },
    { text: 'A plan coming together exactly as you saw it', weights: { strategy: 3 } },
  ] },
  { id: 27, type: 'behaviour', tag: 'Behavioural', text: 'Be honest — what is your relationship with risk?', options: [
    { text: 'I will take a smart bet to learn fast', weights: { curiosity: 2, innovation: 1, change: 1 } },
    { text: 'I de-risk by building solid foundations', weights: { technical: 2, strategy: 1 } },
    { text: 'I manage risk by bringing people with me', weights: { influence: 2, change: 1 } },
    { text: 'I weigh it carefully against the upside', weights: { strategy: 3 } },
  ] },
  { id: 28, type: 'leadership', tag: 'Leadership', text: 'Five years from now, the AI contribution you would be proudest of:', options: [
    { text: 'A culture where everyone happily experiments', weights: { change: 3, influence: 1 } },
    { text: 'A landmark tool that changed how Aviva works', weights: { technical: 2, innovation: 1 } },
    { text: 'A strategy that put Aviva ahead of the field', weights: { strategy: 3 } },
    { text: 'A generation of colleagues I helped grow', weights: { influence: 2, change: 2, customer: 1 } },
  ] },
];

/** Public version of questions — weights stripped, for the client. */
export function publicQuestions() {
  return QUESTIONS.map((q) => ({
    id: q.id,
    type: q.type,
    tag: q.tag,
    text: q.text,
    options: q.options.map((o) => ({ text: o.text })),
  }));
}
