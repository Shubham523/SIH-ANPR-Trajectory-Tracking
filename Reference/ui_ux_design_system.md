# Design System: Utilitarian Traffic Dashboard

**Project:** City-Wide AI Engine for Multi-Camera ANPR Trajectory Tracking
**Design Philosophy:** Pure Utility, High Data Density, Flat UI.
**Tech Stack Alignment:** React + Tailwind CSS

## 1. Core Principles & Anti-Patterns

To ensure a professional, enterprise-grade application suitable for law enforcement and traffic authorities, this design system explicitly rejects modern "AI-startup" aesthetics.

**What we STRICTLY AVOID (Anti-Patterns):**
*   **No Gradients:** Zero use of `bg-gradient-to-*`. All backgrounds and elements must be solid colors.
*   **No Glassmorphism:** Zero use of backdrop blurs, semi-transparent overlays, or frosted glass effects.
*   **No Glow/Neon:** No glowing drop-shadows or neon text (e.g., no electric blues or vibrant purples).
*   **No Soft/Floating UI:** Avoid large, diffused shadows. UI elements should feel anchored and structured.

**What we EMBRACE:**
*   **Brutalism & Borders:** High reliance on 1px solid borders (`border-slate-300` or `border-slate-800`) to separate content cleanly.
*   **Flat Design:** Absolute solid colors. If depth is needed, use hard offset shadows (e.g., `shadow-[2px_2px_0px_rgba(0,0,0,1)]`) or rely solely on border contrast.
*   **Information Density:** Tight padding (`p-2`, `p-4` max), compact text, and grid-based layouts to maximize visible data on a single screen.

## 2. Color Palette (Tailwind)

The palette relies on standard, high-contrast colors suitable for long viewing hours.

*   **Backgrounds:** 
    *   Base App Background: `bg-slate-100`
    *   Panel/Card Background: `bg-white`
    *   Header/Sidebar: `bg-slate-900`
*   **Text & Typography:**
    *   Primary Text: `text-slate-900`
    *   Secondary Text: `text-slate-600`
    *   Inverted Text (on dark panels): `text-slate-50`
*   **Status & Alerts (Solid only):**
    *   Critical/Alert (e.g., Suspect Vehicle Found): `bg-red-600 text-white`
    *   Warning/Congestion: `bg-amber-500 text-black`
    *   Active/Online (Camera Status): `bg-emerald-600 text-white`
*   **Borders:** `border-slate-300` for light mode separation, `border-slate-700` for dark accents.

## 3. Typography

*   **UI/Interface Text:** System Sans-Serif (`font-sans`). Clean, readable, neutral (e.g., Inter, Helvetica, Arial).
*   **Data Points (Critical):** Monospace (`font-mono`). **Must** be used for all License Plate Numbers, Timestamps, Global IDs, and Coordinate data to ensure vertical alignment in tables and instant readability.

## 4. Component Styles (Tailwind Examples)

### 4.1. Cards and Panels
Used for camera feeds, data tables, and search modules.
```html
<div class="bg-white border border-slate-400 p-4 rounded-none">
  <!-- Content -->
</div>
```
*Rule: `rounded-none` or `rounded-sm` at maximum. No pill-shapes or large border radii.*

### 4.2. Buttons
Flat, strictly functional interactions.
```html
<!-- Primary Action -->
<button class="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 border border-slate-900 transition-none">
  Search Trajectory
</button>

<!-- Secondary/Cancel Action -->
<button class="bg-white hover:bg-slate-100 text-slate-800 font-bold py-2 px-4 border border-slate-400 transition-none">
  Clear Filters
</button>
```

### 4.3. Data Tables (Vehicle Logs)
Dense, readable lists of tracked vehicles.
```html
<table class="w-full text-left text-sm border-collapse border border-slate-300">
  <thead>
    <tr class="bg-slate-200 border-b border-slate-400 text-slate-900">
      <th class="p-2 border-r border-slate-300">Timestamp</th>
      <th class="p-2 border-r border-slate-300">Camera ID</th>
      <th class="p-2">Plate (OCR)</th>
    </tr>
  </thead>
  <tbody>
    <tr class="border-b border-slate-300 hover:bg-slate-50">
      <td class="p-2 border-r border-slate-300 font-mono">14:02:11</td>
      <td class="p-2 border-r border-slate-300">CAM-N-04</td>
      <td class="p-2 font-mono bg-yellow-100 font-bold">HR26-DK-9921</td>
    </tr>
  </tbody>
</table>
```

## 5. Structural Layout

The dashboard should follow a strict multi-pane layout:
1.  **Top Bar (Compact):** 40px height. System status, clock, and user profile. `bg-slate-900 text-white`.
2.  **Left Sidebar (Fixed):** 250px width. Navigation (Live Map, Search, Camera Nodes, Settings).
3.  **Main Content Area (Fluid Grid):** 
    *   **Map View:** Large, border-enclosed map element (using standard map tiles, not dark-mode/neon styles).
    *   **Live Feed Sidebar (Right):** A 300px column showing real-time incoming ANPR hits stacked vertically.

By enforcing these constraints, the interface will look like a serious, heavy-duty operational tool rather than a consumer tech demo.