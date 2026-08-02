# Northstar product redesign brief

## Product and audience

Northstar is a private spending check-in for people who use RBC purchase alerts and want a clearer view of day-to-day card spending without adopting a full budgeting system. The primary user is expected to open the responsive web app once a day, understand the current month or billing cycle, correct uncategorized purchases, and leave.

Primary job to be done: “When I check my recent card activity, help me understand how much I have spent, what is driving it, and what needs my attention so I can act in a few minutes.”

## Current-product audit

Observed in the existing product:

- Working flows include email/password authentication, Gmail connection and unread-message sync, bulk manual email parsing, transaction search and deletion, merchant normalization, category rules, billing-cycle settings, a dashboard, and a filterable Deep Dive.
- The dashboard exposes useful data but gives equal visual weight to four metrics, a billing panel, a chart, an insight card, and recent activity. The result is informative but not decisive.
- The Deep Dive shows eight metrics and seven charts at once. Several views repeat the same totals, filters occupy the full first screen, and the category pie chart depends heavily on colour and hover.
- Page-level controls, form fields, loading states, and notices use one-off styles. Focus treatment is inconsistent and some actions rely on small targets.
- Wide tables overflow correctly but do not become scan-friendly transaction cards on mobile.
- Empty states explain what is absent but do not consistently offer the next action.
- The navigation preserves every feature but its order does not match the daily flow of review, understand, then import or configure.

## Focused competitive research

Evidence observed in current official product documentation:

- [Copilot Money for Web](https://help.copilot.money/en/articles/11780342-copilot-money-for-web) places review state directly in transaction lists, supports multi-filter transaction totals, and adds keyboard-first list actions.
- [Copilot Categories](https://help.copilot.money/en/articles/9504513-categories-tab-overview) compares current spending with a budget or the previous month and orders categories by spend.
- [YNAB Spending Trends](https://support.ynab.com/en_us/spending-trends-H1inlhzAc) uses progressive drill-down from category groups to categories to source transactions, while keeping visible totals synchronized with the selected level.
- [Revolut spending analytics](https://help.revolut.com/en-SG/help/accounts/budget-and-analytics/how-can-i-see-my-spending-and-income-analytics/) leads with a current total and previous-period comparison, then lets users change timeframe and grouping.
- [Revolut category adjustment](https://help.revolut.com/en-DK/help/accounts/budget-and-analytics/how-to-assign-and-adjust-categories-for-your-transactions/) explicitly offers “only this transaction” and “all from this merchant” scopes after recategorization.
- [Rocket Money Category Review](https://help.rocketmoney.com/en/articles/13778317-transaction-category-review) presents recent transactions as a focused one-at-a-time review queue.
- [Rocket Money Watchlist](https://help.rocketmoney.com/en/articles/13704685-track-the-spending-that-matters-most-with-a-watchlist) makes a small set of user-relevant categories or merchants visible on the dashboard without requiring a full budget.

Conclusions applied to Northstar:

- A previous-period comparison is more useful than another isolated total.
- “Needs attention” belongs in the main daily flow, not as a secondary utility.
- Advanced analysis should retain powerful filters but reveal them progressively.
- Horizontal bars with direct labels and values communicate category contribution more accessibly than a colour-dependent pie.
- Categorization scope should remain explicit because it affects both historical data and future rules.

Patterns intentionally avoided: copying any competitor’s branding; presenting bank balances Northstar does not possess; labelling pattern-based observations as advice; defaulting to dense chart galleries; and using red or green alone to imply financial judgement.

## Design direction

### Information architecture

1. **Overview** — today’s check-in: monthly total, comparison, category drivers, attention, billing context, and recent activity.
2. **Transactions** — searchable ledger and safe deletion.
3. **Needs attention** — focused categorization queue.
4. **Deep Dive** — progressive filters, comparison, trends, breakdowns, and source rows.
5. **Import** — manual paste/file import and review.
6. **Merchants** — normalized merchant roll-up.
7. **Settings** — billing period, Gmail connection, and privacy explanation.

### Primary flow

Sign in → scan the Overview → review any uncategorized purchases → apply a category to one purchase, all matching purchases, or future imports → return to an accurate Overview. Import and Gmail sync remain supporting entry points.

### Principles

- Answer one question per section.
- Make the next useful action visible.
- Use progressive disclosure for expert controls.
- State comparisons and uncertainty in plain language.
- Keep financial language calm and nonjudgmental.
- Use dense, aligned rows for data and reserve cards for meaningful grouping.
- Never depend on colour, hover, or a chart alone to communicate a result.

### Visual direction

A warm off-white workspace, deep evergreen navigation, ink-forward typography, quiet stone borders, and restrained mint/amber accents. A confident serif is reserved for large totals and page titles; the UI remains system-sans for legibility. Surfaces use small radii and almost no elevation. Category colour is supportive; direct labels, values, and bar lengths carry the information.

### Constraints and unchanged functionality

- Preserve Next.js, Supabase authentication and Row Level Security, Gmail OAuth/sync, the RBC parser, category rules, billing calculations, deletion, filtering, and existing database shape.
- Do not claim access to balances, income, investments, or professional financial advice.
- Treat the current date and imported transaction dates as source data, even when sample or future-dated.
- Keep the app useful for one primary user while leaving signup and isolated accounts functional for UI exploration.

### Success criteria

- The first dashboard viewport answers amount spent, comparison, top drivers, attention, and next action.
- A user can reach and categorize the next unresolved purchase in one navigation action.
- Advanced filters no longer dominate the first Deep Dive viewport.
- Primary pages remain usable at 375 px, 768 px, 1280 px, and wider desktop widths without clipped controls or unreadable tables.
- Interactive elements have visible keyboard focus, meaningful accessible names, and touch targets near or above 44 px.
- Every loading, empty, error, success, and destructive state provides understandable feedback or recovery.
