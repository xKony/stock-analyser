# Stakent Design System (Style Guide)

> **Philosophy**: A deep-space, high-performance financial aesthetic.
> **Feel**: "Professional," "Liquid," "Alive."
> **Motion**: 60fps mandatory. Physics-based springs.

---

## 1. VISUAL FOUNDATION

### Color Palette (The Void & The Neon)

| Role               | HEX                     | Usage                                            |
| ------------------ | ----------------------- | ------------------------------------------------ |
| **App Background** | `#0B0E14`               | Deepest layer. Almost black, hint of blue.       |
| **Surface (Base)** | `#151923`               | Primary card background.                         |
| **Surface (Elev)** | `#1C212E`               | Hover states, active panels.                     |
| **Brand Violet**   | `#6C63FF`               | Primary actions, active navigation.              |
| **Brand Gradient** | `#7C3AED` → `#4F46E5`   | Marketing highlights, major CTAs (`135deg`).     |
| **Success**        | `#22C55E`               | Positive trends, "Safe" status.                  |
| **Error**          | `#EF4444`               | Negative trends, "Risk" status.                  |
| **Text Primary**   | `#FFFFFF`               | Headings, key values.                            |
| **Text Secondary** | `#94A3B8`               | Labels, descriptions (Slate-400).                |
| **Border Subtle**  | `rgba(255,255,255,0.05)`| Card outlines (essential for low contrast areas).|

### Glassmorphism & Depth
-   **Glass Overlay**: `backdrop-filter: blur(12px)` on `rgba(15, 23, 42, 0.6)`.
-   **Glow**: Use colored shadows, not black.
    -   *Violet Glow*: `box-shadow: 0 0 24px rgba(108, 99, 255, 0.25)`.
-   **Depth**: 3-layer system. App Shell (`#0B0E14`) → Card (`#151923`) → Floated Element (Glass/Gradient).

---

## 2. SHAPE & TYPOGRAPHY

### Component Geometry
-   **Cards**: `20px` border-radius. Smooth, organic feel.
-   **Buttons**: `12px` border-radius.
-   **Inputs**: `12px` border-radius, background `#252A3B`.
-   **Pills/Badges**: `999px` (Capsule).

### Typography (Inter / DM Sans)
-   **Headings**: Bold (`700`), tight tracking (`-0.02em`).
-   **Body**: Regular (`400`), readable slate.
-   **Data/Numbers**: **Monospaced / Tabular Nums**.
    -   `font-variant-numeric: tabular-nums` is MANDATORY for all tickers, prices, and % changes.

---

## 3. MOTION LANGUAGE (60FPS)

> **Rule**: If it changes, it animates.

-   **Spring Physics** (Framer Motion defaults):
    -   `stiffness: 400`, `damping: 30` (Snappy, responsive).
    -   `stiffness: 200`, `damping: 20` (Gentle, floaty).
-   **Hover States**:
    -   **Lift**: `y: -4px`.
    -   **Scale**: `scale: 1.02`.
    -   **Border**: Lighten border color.
-   **Entrance**: Staggered fade-up. Never simultaneous.

---

## 4. DATA VISUALIZATION STYLES

### Sparklines & Charts
-   **Line Style**: Monotone curve, `stroke-width: 2px`.
-   **Fills**: Vertical gradient fade.
    -   Stop 0%: `rgba(brand, 0.2)`.
    -   Stop 100%: `rgba(brand, 0)`.
-   **Grid**: **REMOVE IT**. No horizontal/vertical grid lines on sparklines.
-   **Axes**: Minimal or hidden. Focus on the trend shape.

### Semantic Coloring
-   **Green (#22C55E)**: ONLY for positive financial deltas.
-   **Red (#EF4444)**: ONLY for negative financial deltas.
-   *Never use these colors for decoration.* Decoration should use Brand Violet or Neutral Gradients.

---

## 5. CSS VARIABLES (COPY-PASTE)

```css
:root {
  --bg-app: #0B0E14;
  --bg-card: #151923;
  --bg-card-hover: #1C212E;

  --brand-primary: #6C63FF;
  --brand-gradient: linear-gradient(135deg, #7C3AED, #4F46E5);

  --text-primary: #FFFFFF;
  --text-secondary: #94A3B8;

  --radius-card: 20px;
  --radius-btn: 12px;

  --font-sans: 'Inter', sans-serif;
}
```
