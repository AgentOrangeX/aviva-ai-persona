import { PERSONAS } from './personas.js';
import { publishedResourcesForPersona } from './learningResources.js';

const MAX_RECOMMENDATIONS = 5;

/**
 * Builds recommendations from two sources, in priority order:
 *  1. Incomplete steps in the user's own persona journey (the designed
 *     sequence — finish this before anything extra), in step order.
 *  2. Admin-published resources assigned to that persona (PER-034),
 *     freshest first.
 *
 * "completed items are not shown as next actions" (PER-009's acceptance
 * criteria) is enforced here for journey steps, which are the only content
 * type this app tracks per-user completion for. Published resources have
 * no completion concept in the current data model — there's no in-app way
 * to mark a video or external link "done" — so they're always eligible
 * once published; that's a real scope boundary, not an oversight.
 */
export function buildRecommendations({ personaKey, completedStepIndices }) {
  const persona = PERSONAS[personaKey];
  if (!persona) return [];

  const items = [];

  persona.journey.forEach((step, i) => {
    if (completedStepIndices.includes(i)) return;
    items.push({
      type: 'journey_step',
      stepIndex: i,
      title: step.title,
      detail: step.detail,
      url: step.url || null,
      reason: `Next step in your ${persona.name} journey`,
    });
  });

  for (const r of publishedResourcesForPersona(personaKey)) {
    items.push({
      type: 'resource',
      resourceId: r.id,
      title: r.title,
      detail: r.description,
      url: r.url,
      reason: `Published for ${persona.name}s by your Learning Team`,
    });
  }

  return items.slice(0, MAX_RECOMMENDATIONS);
}
