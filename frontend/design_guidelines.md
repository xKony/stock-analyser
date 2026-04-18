# Design Guidelines: The AI Intelligence (Modern Editorial)

This document outlines the design system for the **Stock Analyser** application, inspired by the "Modern Editorial" and "Neo-Brutalist Newspaper" aesthetic. It represents a pivot from dark-mode "Deep Space" aesthetics to a high-contrast, authoritative, and text-heavy journalistic style.

---

## 1. Aesthetic Vision
**"The AI Intelligence"** style aims to feel like a high-end financial or technology journal. It prioritizes authority, clarity, and a sense of being "early" to the story.

- **Primary Metaphor:** A physical newspaper or high-end magazine (`Paper` and `Ink`).
- **Design Philosophy:** Lead with typography. Let the grid provide structure. Use motion to guide attention, not just for decoration.
- **Differentiation:** High-contrast serif pairings, oversized data points, and visible structural rules (borders).

---

## 2. Color System
Based on the `color_guidelines.png` and `design_idea.md` analysis.

| Role | Variable | Hex Code | Description |
| :--- | :--- | :--- | :--- |
| **Paper (BG)** | `--paper-bg` | `#FBF9F4` | Warm off-white, reduces eye strain, feels "printed". |
| **Ink (Text)** | `--ink-text` | `#1A1A1A` | Deep charcoal for maximum legibility. |
| **Signal (Accent)**| `--signal` | `#FF4D30` | Vibrant red-orange for primary actions and alerts. |
| **Highlight** | `--highlight` | `#E6FF00` | Neon yellow for key terms and hover-state highlights. |
| **Rule (Border)** | `--rule` | `#333333` | Thin, high-contrast lines for grid definition. |
| **Muted Ink** | `--ink-muted`| `#666666` | For secondary metadata and captions. |

### Semantic Usage
- **Success:** Use a refined emerald green (e.g., `#00A36C`) if needed, but prefer the `Signal` color for general emphasis.
- **Sentiment:** 
  - Positive sentiment should lean on bold typography or subtle green underlines.
  - Negative sentiment should use the `Signal` (`#FF4D30`) accent.

---

## 3. Typography
Typography is the most critical element of this brand. Use high-quality web fonts.

| Level | Style | Recommended Fonts | Attributes |
| :--- | :--- | :--- | :--- |
| **Display (Headings)**| Modern Serif | *Playfair Display*, *Bodoni*, *Prata* | Bold, High Contrast, Tight Tracking. |
| **Body (Reading)** | Classic Serif | *Crimson Pro*, *Lora*, *Charter* | Generous line-height (1.6), 18px+ base. |
| **Metadata / UI** | Monospace | *IBM Plex Mono*, *JetBrains Mono* | All caps, letter-spacing (0.05em). |

### Typographic Hierarchy
- **H1 (Hero):** Staggered or overlapping display serif. Use italics for prepositions (e.g., "*this week in* **STOCKS**").
- **H2 (Section):** Monospaced labels above horizontal rules (e.g., "SECTION 01 / SENTIMENT ANALYSIS").
- **Data Points:** Oversized bold serifs for numbers (Tabular Nums).

---

## 4. Layout & Grid
The application should use a rigid but flexible grid system.

- **Visible Borders:** Use 1px solid or dotted borders (`--rule`) to separate sidebar, header, and main content.
- **Asymmetry:** Allow for "Editorial" layouts where text columns vary in width.
- **Margins:** Generous negative space. The content should not feel cramped.
- **Rule Lines:** Horizontal rules should define the flow. Use dotted lines for secondary divisions.

---

## 5. Visual Language & Components

### 5.1 Decorative Elements
- **Dotted Rules:** Use CSS `border-style: dotted` for structural lines.
- **Highlighted Text:** Use a background-color transition of `--highlight` to simulate a physical highlighter.
- **Metadata Ribbons:** Thin horizontal bars at the very top or bottom of panels containing "Breaking News" or timestamps.

### 5.2 Micro-interactions (Framer Motion)
- **Staggered Reveals:** Content should load with a subtle upward fade-in, staggered from top to bottom.
- **Hover States:** Instead of shadows, use "Ink" fills or "Highlight" background changes.
- **Cursors:** Custom cursors or interaction indicators that feel like a "Loupe" or "Pen".

### 5.3 Charts & Data Visualization
- **Style:** Minimalist. Avoid heavy gradients or 3D effects.
- **Colors:** Use the `Signal` and `Ink` palette. Areas should be filled with light tints or subtle patterns (hatching).
- **Typography:** All chart labels must be monospaced.

---

## 6. Implementation Checklist (Next.js/Tailwind)

1. **Update `globals.css`:**
   - [ ] Switch `:root` colors to the Paper/Ink palette.
   - [ ] Remove `color-scheme: dark`.
   - [ ] Add font-face declarations for Serif and Monospace.
   - [ ] Redefine `glass-panel` to use high-opacity paper colors instead of dark transparencies.

2. **Refactor Components:**
   - [ ] Replace rounded corners (`--radius-card: 20px`) with sharp corners (`0px`) or very subtle ones (`2px`).
   - [ ] Add `border-b border-rule` to section headers.
   - [ ] Use `font-serif` for all analytical text and `font-mono` for all technical metadata.

3. **Motion Strategy:**
   - [ ] Implement `LayoutGroup` for smooth transitions between dashboard views.
   - [ ] Use `animate-in` utilities for the "Newspaper reveal" effect.
