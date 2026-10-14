# Wodblok Application Style Guide

**Scope:** The editor in `src/`, especially `src/shell.html` and `src/modules/`. The marketing site is a separate surface. This guide records the existing editor styling and gives future contributors rules for extending it without incidental redesign.

**Baseline inspected:** Wodblok 1.6.0. If this guide and implementation disagree, inspect the current source and update the guide when a styling change is intentional.

## Design intent

Wodblok is a focused creative tool for stamped patterns and artwork. The editor combines warm paper-like surfaces, restrained brass/gold accents, compact controls, subtle borders, and a stage that keeps the artwork as the focus. The interface should feel crafted, calm, precise, and professional. Preserve the existing visual language; do not redesign neighboring panels just to make a new feature stand out.

## Theme tokens

The editor supports explicit light and dark themes. Theme preference is stored using the existing `wb60_theme` key and reflected through `data-theme` on the root element. Reuse CSS custom properties from `src/shell.html`; do not add one-off colors for ordinary UI chrome.

| Token | Light | Dark | Use |
|---|---|---|---|
| `--stage` | `#eae4d8` | `#1b1a18` | Work stage |
| `--stage-dot` | `rgba(60,40,10,.07)` | `rgba(255,255,255,.04)` | Subtle stage texture |
| `--panel` | `#f6f2e9` | `#242220` | Panels and app surfaces |
| `--raise` | `#ffffff` | `#2e2b28` | Raised surfaces and popovers |
| `--field` | `#ffffff` | `#1e1c1a` | Input backgrounds |
| `--line` | `#ddd5c6` | `#37332f` | Quiet borders and separators |
| `--line2` | `#cbc2b0` | `#4a453f` | Stronger outlines |
| `--fg` | `#26221d` | `#ede6da` | Primary text |
| `--mut` | `#706858` | `#a39b8e` | Secondary text |
| `--faint` | `#766d60` | `#8f887c` | Tertiary text and group labels |
| `--acc` | `#b8914f` | `#c9a66b` | Primary accent and focus |
| `--acc-ink` | `#8a6528` | `#c9a66b` | Text on soft active states |
| `--acc-fg` | `#1b1a18` | `#1b1a18` | Text on solid accent |
| `--acc-soft` | `rgba(184,145,79,.16)` | `rgba(201,166,107,.16)` | Selected/active background |
| `--warn` | `#c0532e` | `#e8895c` | Warnings and dirty state |
| `--ok` | `#3f8f66` | `#7fb08a` | Success state |
| `--shadow` | Warm layered shadow | Dark layered shadow | Floating UI |
| `--paper-shadow` | Warm broad shadow | Dark broad shadow | Artwork/paper elevation |

The dark tokens are set for both system dark preference and explicit `data-theme="dark"`; preserve both paths. The explicit light theme uses `data-theme="light"`.

Rules:
- Prefer semantic tokens over literal colors.
- Literal colors are appropriate for artwork, color picker values, or data-specific comparisons—not ordinary UI chrome.
- Keep brass/gold accents restrained; warning and success colors are semantic, not decorative.
- Check contrast in both themes, especially muted labels, disabled controls, and selected rows.

## Typography

- **Primary UI font:** Hanken Grotesk, with system fallbacks: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.
- **Display accent:** Fraunces, with Georgia/serif fallback. It is used selectively for brand/splash and some panel headings, not for all UI.
- **Base UI size:** `12.5px / 1.4` in the main shell.
- Use tabular numerals for measurements, dimensions, counts, and values users compare.
- Use the sans-serif UI face for controls and most panel content. Keep hierarchy compact and functional.
- Fonts are injected by the build at `/*@@FONTS@@*/`; do not add remote font requests. The app must not rely on runtime network access.

## Spacing, shapes, borders, and elevation

The interface uses compact, rounded controls, not oversized web-app cards. Existing conventions include:
- Common control corners around 6–8px; menus and popovers around 10–12px.
- Thin borders: `--line` for quiet separators and `--line2` for clearer control edges.
- Swatches have rounded corners and an inset edge so pale colors remain visible.
- Panel headers are compact and often separated by a thin divider.
- Shadows are reserved for floating surfaces and artwork/paper; do not shadow every panel or row.
- Reuse dimensions and classes from a neighboring control instead of inventing new measurements for every feature.

## Controls and states

- Match existing button, icon-button, tab, field, slider, and menu patterns. Avoid a new visual treatment for one feature.
- Hover/focus/active transitions are subtle; common transitions are about 120ms.
- Standard visible focus is `:focus-visible { outline: 2px solid var(--acc); outline-offset: 1px; }`. Do not remove focus indicators.
- Icons use current-color strokes and rounded caps/joins; common stroke width is about 1.7, with some toolbar controls around 2.1–2.6. Prefer the established line-icon style over emoji.
- Icon-only controls need an accessible name/title and keyboard access.
- Fields use `--field`, `--line2`, and the existing type scale.
- Color swatches should have a visible boundary for light colors.
- Sliders have a subtle hover-thumb scale and accent-soft active halo; preserve responsiveness.
- Selected items typically use `--acc-soft`, accent border and/or accent text. Do not communicate state by color alone when it needs to be unambiguous.
- Disabled controls commonly reduce opacity and become non-interactive. Dirty/unsaved status uses `--warn`.
- Do not add explanatory text or tooltips inside panels. Use concise labels and clear grouping instead.

## Panels, docks, menus, and workspaces

The workspace supports docked groups, tabbed panels, floating panels, and resizable docks. Panel naming and mode groupings are defined in `src/modules/34-desktop-shell.js` (look for `PNAME`, `MODEP`, and `wsDef`).

- Add new tools to the existing workspace/panel model, not a separate window system.
- Reuse panel headings, tabs, dock, floating-panel, and resize conventions.
- Keep controls usable in narrow panels; avoid fixed widths that cause overflow.
- Group related controls and align labels/values predictably.
- Respect Pattern and Stamp modes and saved workspaces.
- Do not open tool windows at launch; the app launches in Pattern mode, cleared.
- Hover may enhance feedback but must never be the only way to discover or use an action.
- Avoid browser `alert`, `confirm`, and `prompt`; use existing in-app interaction patterns.

## Motion and canvas

- Motion should be short and purposeful. Menus and color popovers use a quick entrance of about 130ms; transitions are generally around 120ms.
- Respect `prefers-reduced-motion: reduce`; disable nonessential animation and transitions.
- Use `--stage` and `--stage-dot` for the work area; `body.plain` intentionally removes stage dots.
- Use `--paper-shadow` for paper/artwork elevation where appropriate.
- Keep selection outlines, guides, masks, grid lines, and previews distinguishable without overpowering the artwork.
- Panel styling must not change artwork rendering or export output.
- Check canvas-adjacent UI at multiple zoom levels and viewport sizes.

## Language and layout

- Use concise labels that describe the action or setting; avoid redundant helper paragraphs and panel tooltips.
- Match existing terminology and spelling. The editor uses British spelling in labels such as **Colours** and **Colour grading**.
- Use sentence case for normal controls unless an existing convention (such as uppercase group labels) applies.
- Keep naming, capitalization, units, and number formatting consistent within a panel.
- Avoid novelty gradients, glassmorphism, large marketing-style cards, or heavy outlines unless a deliberate product-wide design decision changes the system.
- Safe-area insets are supported. Keep the current web-first layout usable at narrow and short viewport sizes without starting a broader responsive redesign as part of a small feature.

## Styling workflow

1. Read this guide and inspect the nearest existing control in `src/shell.html` and the relevant UI module.
2. Search for existing tokens, classes, icons, and interaction patterns before adding new ones.
3. Prefer small, local CSS changes; avoid broad selectors that unintentionally affect other tools.
4. Check explicit light and dark themes, focus, disabled/selected states, reduced motion, narrow widths, and short viewports.
5. Do not add panel tooltips, remote fonts, runtime network calls, or dependencies without approval.
6. Run relevant tests. For drawing, dragging, or slider changes, follow `CLAUDE.md` and run `npm run perf`; no performance regression over 10% is acceptable.
7. Inspect intentional screenshot changes; never regenerate snapshots just to make tests pass. Follow the approval rules in `CLAUDE.md`.
8. Update this guide when a deliberate change establishes a reusable convention.

## Source-of-truth map

| Concern | Source |
|---|---|
| Theme initialization, tokens, global typography/focus/control/motion CSS | `src/shell.html` |
| Docking, panel groups, workspace behavior | `src/modules/34-desktop-shell.js` and shell CSS |
| Tool-specific controls | Relevant file in `src/modules/` |
| Module startup order | `src/main.js` |
| Engineering constraints | `CLAUDE.md` |
| Existing UI audit/screenshots | `docs/ux-review.md` and `docs/ux-review/` |

## New UI checklist

- [ ] Uses existing theme tokens where possible.
- [ ] Works in light and dark themes.
- [ ] Matches nearby typography, spacing, corner radii, borders, and icons.
- [ ] Has suitable hover, focus-visible, selected, disabled, and error/dirty states.
- [ ] Does not rely on hover or add panel tooltips/explanatory copy.
- [ ] Fits docked, tabbed, and floating panel layouts.
- [ ] Respects reduced motion and keyboard use.
- [ ] Does not unintentionally alter artwork rendering.
- [ ] Relevant tests pass and screenshot changes are explained.
- [ ] This guide is updated if a new reusable convention is introduced.
