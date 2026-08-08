/**
 * Two-level org taxonomy: Business Area -> Functions.
 *
 * "Other" isn't in the source taxonomy document — added here as a catch-all
 * so someone whose team genuinely isn't represented yet isn't forced into
 * a wrong bucket. When "Other" is picked as the Business Area, the Function
 * field becomes free text instead of a constrained dropdown.
 */
export const TAXONOMY = {
  'General Insurance (GI)': [
    'Claims', 'Underwriting', 'Pricing', 'Product', 'Distribution', 'Sales',
    'Customer', 'Operations', 'Actuarial', 'Transformation',
  ],
  'Insurance, Wealth & Retirement (IWR)': [
    'Wealth', 'Workplace', 'Retirement', 'Protection', 'Health', 'Advice',
    'Product', 'Distribution', 'Operations', 'Customer', 'Actuarial', 'Transformation',
  ],
  'Aviva Investors': [
    'Investment Management', 'Real Assets', 'ESG / Sustainable Investment',
    'Investment Strategy', 'Distribution', 'Operations', 'Risk', 'Product', 'Client Management',
  ],
  'Customer & Marketing (C&M)': [
    'Marketing', 'Brand', 'Customer Experience', 'Customer Insight', 'CRM',
    'Digital', 'Proposition', 'Content', 'Media', 'Loyalty', 'Marketing Analytics',
  ],
  'CIO / Technology': [
    'Software Engineering', 'Architecture', 'Cloud', 'Infrastructure', 'Cyber Security',
    'Technology Operations', 'Platforms', 'DevOps / Platform Engineering',
    'Technology Strategy', 'Delivery', 'Enterprise Applications',
  ],
  'Data & AI': [
    'Artificial Intelligence', 'AI Product', 'Data Science', 'Data Engineering',
    'Analytics', 'Data Governance', 'AI Governance', 'MLOps', 'Data Strategy', 'AI Enablement',
  ],
  'Operations / COO': [
    'Customer Operations', 'Business Operations', 'Operational Excellence', 'Change',
    'Programme Delivery', 'Procurement', 'Outsourcing', 'Property / Workplace',
    'Business Continuity / Resilience',
  ],
  Finance: [
    'Financial Planning & Analysis', 'Financial Control', 'Tax', 'Treasury', 'Capital',
    'Investor Relations', 'Commercial Finance', 'Finance Transformation',
  ],
  Risk: [
    'Enterprise Risk', 'Operational Risk', 'Insurance Risk', 'Financial Risk', 'Model Risk',
    'Technology Risk', 'Conduct Risk', 'Emerging Risk', 'Risk Analytics',
  ],
  'Governance / Compliance / Legal': [
    'Compliance', 'Financial Crime', 'Legal', 'Privacy / Data Protection',
    'Regulatory Affairs', 'Governance', 'Company Secretariat', 'Conduct', 'Assurance',
  ],
  'People / HR': [
    'Talent Acquisition', 'Learning & Development', 'HR Business Partnering', 'Reward',
    'Talent', 'Employee Experience', 'Diversity & Inclusion', 'People Analytics',
    'HR Operations', 'Workforce Transformation',
  ],
  'Strategy & Transformation': [
    'Corporate Strategy', 'Transformation', 'Innovation', 'M&A', 'Strategic Partnerships',
    'Portfolio Management', 'Transformation Office', 'Operating Model',
  ],
  'Corporate Affairs': [
    'Corporate Communications', 'Media Relations', 'Public Affairs', 'Reputation',
    'Sustainability', 'Community', 'Events',
  ],
  'Internal Audit': [
    'Business Audit', 'Technology Audit', 'Financial Audit', 'Risk Audit',
    'Regulatory Audit', 'Data & AI Audit', 'Audit Analytics',
  ],
};

export const BUSINESS_AREAS = [...Object.keys(TAXONOMY), 'Other'];

export function functionsFor(businessArea) {
  return TAXONOMY[businessArea] || [];
}
