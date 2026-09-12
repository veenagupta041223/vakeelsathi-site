CREATE TABLE IF NOT EXISTS leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  service     TEXT NOT NULL CHECK (service IN (
                'cheque-bounce-notice', 'legal-notice-money-recovery',
                'reply-to-legal-notice', 'rent-agreement-drafting',
                'sale-deed-review', 'property-title-verification',
                'will-drafting', 'mutual-divorce-petition',
                'employment-contract-offer-letter', 'co-founder-agreement',
                'startup-incorporation-pvt-ltd', 'consumer-complaint-filing',
                'e-challan-dispute-filing', 'other')),
  message     TEXT,
  consent     INTEGER NOT NULL CHECK (consent = 1),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  user_agent  TEXT
);
