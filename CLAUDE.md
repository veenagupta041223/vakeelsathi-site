# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VakeelSathi is a landing page for a legal services platform connecting Indians with verified lawyers. The site is a static HTML/CSS website hosted on GitHub Pages with a Formspree-integrated waitlist form.

## Architecture

### File Structure
- **index.html** — Main landing page with hero section, features grid, how-it-works steps, and waitlist form
- **thank-you.html** — Confirmation page displayed after waitlist signup
- **styles.css** — Single stylesheet for the entire site; uses CSS variables for theming
- **assets/** — Logo (SVG) and favicon; minimal external dependencies
- **CNAME** — Custom domain configuration for GitHub Pages

### Design System
The site uses a cohesive color palette and design system defined as CSS variables at the top of `styles.css:1-9`:
- **--indigo (#1A237E)** — Primary color for hero, headings, buttons, footer
- **--saffron (#F57C00)** — Accent color for highlights and secondary buttons
- **--success (#2E7D32)** — Reserved for future use
- **--bg (#F7F7FB)** — Subtle off-white background for contrast sections
- **--radius (14px)** — Border radius for buttons and cards
- **--max-width (1100px)** — Content container max-width for readability

### Key Components
**Hero Section** — Branded header with logo, wordmark, tagline in Hindi (Noto Sans Devanagari font), and primary CTA button. Used on both index.html and thank-you.html.

**Feature Cards** — 6-item grid (responsive: 1 column mobile, 2 tablets, 3 desktop) showcasing VakeelSathi's services. Each card has an SVG icon, heading, and description.

**How It Works** — 3-step numbered list explaining the user journey.

**Waitlist Form** — Formspree-powered form (action="https://formspree.io/f/xnpavzdz") collecting name, phone (10-digit validation), and optional email. Includes honeypot field and redirect to thank-you page.

**Footer** — Minimal footer with logo, copyright, and contact email.

### Responsive Design
Breakpoints defined inline via media queries:
- Mobile-first base styles (single column layouts, smaller fonts)
- `@media (min-width: 768px)` — Tablet layout (2-column feature grid)
- `@media (min-width: 1024px)` — Desktop layout (3-column feature grid)

## Common Development Tasks

### Viewing the Site
Open `index.html` in a browser or use a simple HTTP server:
```bash
# Python 3
python3 -m http.server 8000

# Node.js (if installed)
npx http-server
```
Then navigate to `http://localhost:8000`.

### Editing Content
- **Headlines & body text** — Edit directly in `index.html`
- **Styling & spacing** — Edit `styles.css`; remember to use the CSS variable names for consistency
- **Colors** — Update the color variables in `styles.css:1-9`, then CSS will cascade to all components

### Adding Icons
SVG icons are embedded inline in `index.html` (e.g., `index.html:33-34`). To add a new icon:
1. Source from Material Design Icons or a similar library
2. Copy the SVG `<path>` element
3. Embed it inline in an `<svg viewBox="0 0 24 24" fill="currentColor">` wrapper
4. The icon will inherit color from the `.feature-card svg { color: var(--saffron) }` rule

### Form Configuration
Waitlist form submits to Formspree endpoint `xnpavzdz`. If changing the form endpoint:
1. Create a new Formspree form on https://formspree.io
2. Update the `action` URL in `index.html:95`
3. Update the `_next` redirect URL in `index.html:96` to match your domain

### Deployment
The site auto-deploys to `https://vakeelsathi.in` via GitHub Pages when changes are pushed to the `main` branch. The CNAME file ensures the custom domain is used.

## Recent Work

Latest commits have added:
- Waitlist form with Formspree integration (thank-you page redirect)
- Custom domain via CNAME
- How-it-works section with step numbering
- Why-VakeelSathi value proposition
- Feature cards grid
- Hero section with branding

## Next Steps

Potential improvements for future iterations:
1. **Add a navigation menu** — Current design lacks header nav; consider adding if more pages are added
2. **Mobile optimization** — Test form UX on small screens; consider mobile-specific button sizing
3. **Analytics** — Add Google Analytics or similar to track waitlist conversions
4. **Email automation** — Integrate with an email service to send confirmation emails post-signup
5. **SEO enhancements** — Add structured data (schema.org) for better search visibility
6. **Accessibility audit** — Run through WCAG guidelines; consider ARIA labels for icons
7. **Content localization** — Current tagline is Hindi; consider full Hindi version or language toggle
