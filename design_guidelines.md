# Design Guidelines: Stock Analyser (Professional Editorial)

This document outlines the design system for the **Stock Analyser** application, following a "Modern Editorial" aesthetic. It prioritizes authority, factual clarity, and professional data presentation, avoiding all "marketing fluff" or non-factual metadata.

---

## 1. Aesthetic Vision
**"Stock Analyser"** aims to feel like a high-end financial terminal or a professional newspaper (e.g., Financial Times, The Wall Street Journal). It provides raw intelligence without decorative noise.

- **Primary Metaphor:** A high-end printed journal (`Paper` and `Ink`).
- **Design Philosophy:** Lead with typography. Let the grid provide rigid structure. No fake data or "fluff" labels.
- **Differentiation:** Professional high-contrast serif for both headings and numerical data points.

---

## 2. Color System
The palette is derived from physical paper and high-contrast ink.

| Role | Variable | Hex Code | Description |
| :--- | :--- | :--- | :--- |
| **Paper (BG)** | `--paper-bg` | `#FBF9F4` | Warm off-white, reduces eye strain, feels "printed". |
| **Ink (Text)** | `--ink-text` | `#1A1A1A` | Deep charcoal for maximum legibility. |
| **Signal (Accent)**| `--signal` | `#FF4D30` | Vibrant red-orange for primary actions and alerts. |
| **Highlight** | `--highlight` | `#E6FF00` | Neon yellow for functional hover states. |
| **Rule (Border)** | `--rule` | `#333333` | Thin, high-contrast lines for grid definition. |

### NO FLUFF RULE
- **Accuracy First:** Do not include fake "Volume" numbers, "Issue" dates, or "Refresh rates" unless they are hooked to real backend logic.
- **Minimalist Meta:** Metadata labels must be functional (e.g., "SENTIMENT INDEX", "TERMINAL", "ASSET").

---

## 3. Typography
Standardized serif typography for authority and legibility.

| Level | Style | Recommended Fonts | Attributes |
| :--- | :--- | :--- | :--- |
| **Display (Headings)**| Modern Serif | *Playfair Display* | Black weight, High Contrast, Uppercase. |
| **Data (Numbers)** | Modern Serif | *Playfair Display* | Standardized with headlines. Tabular Nums. |
| **Body (Reading)** | Classic Serif | *Crimson Pro* | Generous line-height (1.6). |
| **Metadata / UI** | Monospace | *IBM Plex Mono* | All caps, letter-spacing (0.05em). |

---

## 4. Layout & Grid
The application uses a rigid, bordered structure.

- **Visible Borders:** 1px solid borders (`--rule`) separate all major layout sections.
- **Editorial Panels:** Containers use white backgrounds with rigid 1px borders to separate content from the paper background.
- **Negative Space:** Generous but controlled. Avoid "magazine-style" overlapping for the sake of professional clarity.

---

## 5. Visual Language

### 5.1 Charts & Data Visualization
- **Style:** Minimalist, high-contrast. Avoid gradients and glows.
- **Lines:** Use solid or step-curve lines (`stepAfter`) for sentiment to indicate discrete data points.
- **Colors:** Use `Ink` for positive/neutral trends and `Signal` for negative trends.

### 5.2 Micro-interactions
- **Hover:** Use background shifts (`--highlight`) or underline transitions. Avoid heavy shadows.
- **Loading:** Use minimalist loaders that don't distract from the editorial layout.
