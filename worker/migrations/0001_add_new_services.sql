-- SQLite can't ALTER a CHECK constraint in place, so rebuild the table with
-- the widened `service` allow-list and swap it in.
CREATE TABLE leads_new (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  service     TEXT NOT NULL CHECK (service IN (
                'cheque-bounce-notice', 'legal-notice-money-recovery',
                'reply-to-legal-notice', 'rent-agreement-drafting',
                'sale-deed-review', 'property-title-verification',
                'will-drafting', 'mutual-divorce-petition',
                'employment-contract-offer-letter', 'co-founder-agreement',
                'startup-incorporation-pvt-ltd', 'startup-establishment',
                'gst-registration', 'msme-registration', 'pancard-registration',
                'consumer-complaint-filing',
                'e-challan-dispute-filing', 'mact-accident-claim',
                'cyber-fraud-complaint', 'bank-account-unfreezing',
                'marriage-registration', 'other')),
  message     TEXT,
  consent     INTEGER NOT NULL CHECK (consent = 1),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  user_agent  TEXT
);

INSERT INTO leads_new SELECT * FROM leads;
DROP TABLE leads;
ALTER TABLE leads_new RENAME TO leads;
