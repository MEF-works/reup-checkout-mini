/**
 * "Did you know" fact cards keyed by industry, shown during P2P verification wait.
 * Facts rotate every 5 seconds. Industry is matched case-insensitively; unknown industries use "general".
 */

const FACTS_BY_INDUSTRY: Record<string, string[]> = {
  general: [
    'Many merchants see higher completion rates when customers pay with methods they already use daily.',
    'P2P payments typically settle in minutes, so you can fulfill orders the same day.',
    'Using a clear reference or order ID in the payment note helps match payments to orders instantly.',
    'Customers who pay via app often return—they already have you saved in their contacts.',
    'Keeping one primary P2P method per brand reduces confusion and speeds repeat checkout.',
  ],
  'general retail': [
    'Retail cart abandonment drops when checkout offers familiar payment apps.',
    'Same-day confirmation via P2P can enable same-day or next-day shipping for many items.',
    'A single, consistent “send to” handle builds trust and makes repeat purchases faster.',
    'Order references in the payment note double as customer service tickets if something goes wrong.',
    'Retailers often use P2P for preorders and limited drops to avoid chargebacks.',
  ],
  'rare sneaker resale': [
    'Sneaker resale often uses P2P to avoid platform fees and chargeback risk on high-ticket items.',
    'Including the style name or SKU in the payment note helps match payment to the exact pair.',
    'Many buyers prefer sending payment in-app so they have a record of the transaction.',
    'Quick verification means you can ship same day and stay ahead of release-day demand.',
    'P2P settlement is final—no chargebacks—which protects sellers on high-value sneakers.',
  ],
  fashion: [
    'Fashion brands use P2P for pop-ups and limited drops to keep checkout fast and flexible.',
    'Adding “order #” in the payment note makes returns and exchanges easier to track.',
    'International buyers often use P2P apps that support cross-border sends.',
    'Verification within minutes lets you reserve inventory and ship before the window closes.',
    'Consistent branding on your “send to” handle reinforces trust at checkout.',
  ],
  electronics: [
    'Electronics sellers use P2P to avoid chargebacks on high-value, easily disputed items.',
    'Including the product name or serial in the note helps with warranty and support later.',
    'Same-day payment confirmation can enable same-day shipping for in-stock items.',
    'Many buyers keep a balance in P2P apps, so payment is instant from their perspective.',
    'A clear “send to” and reference reduces support tickets and mistaken payments.',
  ],
  subscription: [
    'Subscription renewals via P2P reduce failed card retries and involuntary churn.',
    'Using the same reference format each time (e.g. “SUB-12345”) makes reconciliation simple.',
    'Customers who pay monthly via app often have lower support contact rates.',
    'Instant verification means you can restore access or extend the period immediately.',
    'P2P is useful for annual plans where one payment covers the full term.',
  ],
};

const DEFAULT_KEY = 'general';

function normalizeIndustry(industry: string): string {
  const trimmed = (industry || '').trim().toLowerCase();
  if (!trimmed) return DEFAULT_KEY;
  // Exact match
  if (FACTS_BY_INDUSTRY[trimmed]) return trimmed;
  // Substring match (e.g. "Rare Sneaker Resale" -> "rare sneaker resale" contains "sneaker")
  for (const key of Object.keys(FACTS_BY_INDUSTRY)) {
    if (key !== DEFAULT_KEY && trimmed.includes(key)) return key;
  }
  if (trimmed.includes('sneaker') || trimmed.includes('resale')) return 'rare sneaker resale';
  if (trimmed.includes('fashion') || trimmed.includes('apparel')) return 'fashion';
  if (trimmed.includes('electron')) return 'electronics';
  if (trimmed.includes('subscription') || trimmed.includes('recurring')) return 'subscription';
  return DEFAULT_KEY;
}

export function getFactsForIndustry(industry: string): string[] {
  const key = normalizeIndustry(industry);
  return FACTS_BY_INDUSTRY[key] ?? FACTS_BY_INDUSTRY[DEFAULT_KEY];
}
