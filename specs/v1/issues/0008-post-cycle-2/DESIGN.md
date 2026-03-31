# Design System Strategy: The Architectural Curated Interface

## 1. Overview & Creative North Star
**Creative North Star: "The Precision Architect"**

This design system moves away from the "generic dashboard" aesthetic of property management software and toward a high-end, editorial experience. In real estate, trust is built through precision, clarity, and a sense of permanence. We achieve this by breaking the "bootstrap template" look. 

Rather than relying on rigid boxes and heavy borders, we utilize **Intentional Asymmetry** and **Tonal Depth**. This system treats the PWA as a series of layered, architectural planes. We prioritize breathing room (whitespace) over dense data grids, ensuring that high-stakes information—like occupancy rates or financial yields—is framed with the same intentionality as a feature spread in an architectural digest.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a foundation of authoritative Navy (`tertiary`) and Slate (`secondary`), punctuated by a vibrant Emerald (`primary`) that signals action and growth.

### The "No-Line" Rule
To achieve a premium feel, **1px solid borders are strictly prohibited for sectioning.** Traditional dividers create visual clutter that makes a PWA feel "small." Instead, define boundaries through:
*   **Background Shifts:** Place a `surface_container_low` card on a `surface` background to create a "ghost" boundary.
*   **Subtle Tonal Transitions:** Use `surface_container_highest` for sidebars against a `surface_bright` main stage.

### Surface Hierarchy & Nesting
Think of the UI as stacked sheets of fine, semi-translucent paper.
*   **Base Layer:** `surface` (#f8f9ff) - The canvas of the application.
*   **Content Sections:** `surface_container` (#e6eeff) - Use this for large logical groupings.
*   **Interactive Elements:** `surface_container_lowest` (#ffffff) - Use this for cards or inputs that sit "on top" of sections to invite interaction.

### The "Glass & Gradient" Rule
Standard flat colors feel static. To inject "soul" into the real estate experience:
*   **Glassmorphism:** For floating action buttons (FABs) or navigation overlays, use `surface_variant` at 80% opacity with a `backdrop-blur` of 12px.
*   **Signature Textures:** For high-level financial summaries or Hero CTAs, use a subtle linear gradient from `primary` (#00180e) to `primary_container` (#002f1e). This depth suggests a premium, "locked-in" quality that flat emerald cannot provide.

---

## 3. Typography: The Editorial Edge
We employ a dual-font strategy to balance character with utility.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision and modern "tech-meets-luxury" feel. Use `display-lg` (3.5rem) sparingly for high-level portfolio totals. Use `headline-sm` (1.5rem) for property names to give them a distinct identity.
*   **Body & Labels (Inter):** The workhorse. Inter’s tall x-height ensures maximum legibility for lease agreements and maintenance logs. 
*   **Hierarchy as Identity:** By contrasting the bold, expressive Manrope headlines with the neutral Inter body text, we convey a brand that is both visionary (the "Curator") and operationally rigorous (the "Manager").

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often messy. This system utilizes **Tonal Layering** to convey hierarchy.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface_container_lowest` (white) card sitting on a `surface_container_low` background creates a natural lift.
*   **Ambient Shadows:** If a shadow is required for a floating element (like a modal), use a high-dispersion shadow: `box-shadow: 0 10px 40px rgba(13, 28, 46, 0.06);`. Note the color: we use a tint of `on_surface` (Navy) rather than black, mimicking natural light.
*   **The "Ghost Border" Fallback:** If a container lacks contrast (e.g., white on white), use a "Ghost Border": `outline_variant` (#c5c6d2) at **15% opacity**. It should be felt, not seen.

---

## 5. Components & Interaction Patterns

### Buttons
*   **Primary:** High-contrast Emerald. Use `primary_fixed_dim` (#68dba9) for the background with `on_primary_fixed` (#002114) text. Apply `rounded-md` (0.375rem) for a crisp, professional edge.
*   **Secondary:** Use the `secondary_container` (#d5e0f8). No border. This is for "Add Tenant" or "Export" actions.
*   **Tertiary:** Ghost style. No background. Use `on_surface_variant` text.

### Input Fields & Cards
*   **The Forbidden Divider:** Never use a horizontal line to separate list items. Use **Vertical White Space** (Spacing `5` - 1.1rem) or a subtle background toggle between `surface_container_low` and `surface_container_lowest`.
*   **Fields:** Background should be `surface_container_highest` with a 1px "Ghost Border" that transitions to `primary` (Emerald) on focus. This creates a "glow" effect indicating the system is "active."

### Real-Estate Specific Components
*   **Portfolio Scorecards:** Use `surface_container_highest` with a `primary` top-border (2px) to denote "Premium" status assets.
*   **Occupancy Chips:** Instead of standard pills, use a "Status Bar" approach—a thin vertical line of `primary` (Emerald) or `error` (#ba1a1a) next to the property name, rather than an enclosed box.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical spacing. A wider left margin on property details can create a sophisticated, editorial look.
*   **Do** use `primary_fixed` for success states and `error_container` for overdue payments, keeping the palette cohesive.
*   **Do** prioritize "Breathing Room." Use Spacing `8` (1.75rem) as your default padding for containers.

### Don’t:
*   **Don’t** use 100% black text. Always use `on_surface` (#0d1c2e) to keep the UI feeling "expensive" and soft on the eyes.
*   **Don’t** use default shadows. If a shadow looks like a "shadow," it's too dark. It should look like a "soft glow of depth."
*   **Don’t** use dividers. If two elements feel cluttered, increase the spacing from the scale (e.g., move from `4` to `6`) rather than adding a line. Lines are "scaffolding"; we want "architecture."