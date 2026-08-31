---
version: alpha
name: 'SW Low Volt'
description: 'A precise rack-elevation visual system for a hands-on Maryland low-voltage contractor.'
colors:
  primary: '#006BD6'
  rack-black: '#102B40'
  deep-navy: '#173F5F'
  panel-steel: '#244E6E'
  panel: '#19384F'
  steel-mist: '#E4EEF6'
  steel-mist-soft: '#F1F6FA'
  chrome-ink: '#102438'
  chrome-text: '#355269'
  chrome-border: '#B6C9D8'
  chrome-control-border: '#71879B'
  chrome-blue: '#004F9F'
  action-blue: '#006BD6'
  signal-blue: '#0A84FF'
  signal-cyan: '#62C5FF'
  equipment-white: '#F6F9FC'
  muted-dark: '#B5C3D0'
  error: '#FF8A8A'
typography:
  display:
    fontFamily: 'Barlow Condensed, Arial Narrow, sans-serif'
  body:
    fontFamily: 'Source Sans 3, Arial, sans-serif'
  utility:
    fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace'
rounded:
  DEFAULT: '0.125rem'
  control: '0.25rem'
  panel: '0.375rem'
spacing:
  section-gap: '7rem'
  page-gutter: 'clamp(1.25rem, 4vw, 4.5rem)'
  page-max: '90rem'
components:
  button:
    backgroundColor: '{colors.action-blue}'
    textColor: '{colors.equipment-white}'
  navigation:
    backgroundColor: '{colors.steel-mist}'
    textColor: '{colors.chrome-ink}'
  navigation-secondary:
    textColor: '{colors.chrome-text}'
  navigation-active:
    textColor: '{colors.chrome-ink}'
  navigation-marker:
    backgroundColor: '{colors.action-blue}'
  chrome-link:
    textColor: '{colors.chrome-blue}'
  chrome-divider:
    backgroundColor: '{colors.chrome-border}'
  chrome-control-outline:
    backgroundColor: '{colors.chrome-control-border}'
  focus-ring-dark:
    backgroundColor: '{colors.signal-cyan}'
  focus-ring-light:
    backgroundColor: '{colors.chrome-blue}'
  mobile-navigation:
    backgroundColor: '{colors.steel-mist-soft}'
    textColor: '{colors.chrome-text}'
  hero:
    backgroundColor: '{colors.rack-black}'
    textColor: '{colors.equipment-white}'
  media-frame:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.muted-dark}'
  service-panel:
    backgroundColor: '{colors.panel-steel}'
    textColor: '{colors.equipment-white}'
  form:
    backgroundColor: '{colors.deep-navy}'
    textColor: '{colors.equipment-white}'
  form-secondary:
    textColor: '{colors.muted-dark}'
  mobile-quote-bar:
    backgroundColor: '{colors.steel-mist}'
    textColor: '{colors.chrome-ink}'
  cable-route:
    backgroundColor: '{colors.signal-blue}'
---

# SW Low Volt Design System

## Overview

### Creative North Star

The site should feel like opening a clean telecom room after a disciplined install: squared rack elevations, deliberate cable paths, clear labels, and nothing left loose. The brand expression comes from the physical vocabulary of patch panels and labeled terminations—not generic “cyber” effects.

### Product context and register

- **Audience and primary job:** General contractors, facilities teams, businesses, property managers, schools, municipalities, and homeowners need to verify fit quickly, call, request a quote, or invite SW Low Volt to bid.
- **Target market and evidence:** Maryland, including Glen Burnie, Pasadena, Ocean City, Berlin, Ocean Pines, and Salisbury, as confirmed by the current business scope.
- **Locale and language policy:** English (US), direct and trade-literate without unnecessary jargon.
- **Usage scene:** Mobile-first for urgent calls and field review; desktop for scope review and plan/spec submission.
- **Register:** Brand site with functional lead forms.
- **Memorable signature:** One electric-blue cable route crosses the hero and resolves into a labeled quote port.
- **Restraint:** Forms, navigation, and long-copy sections remain quiet and familiar.
- **Anti-references:** Generic electrician templates, floating pill-card grids, neon “cybersecurity” scenery, handshake stock photos, and decorative rounded containers.
- **Token ownership/runtime mapping:** The hand-authored tokens in `public/styles.css` are canonical. This file mirrors their accepted values and explains their use; the five static HTML pages consume those semantic CSS variables directly.

## Colors

Rack Black, Deep Navy, and Panel Steel are lifted into clearer blue-slate tones so dark sections retain their industrial character without feeling near-black. Steel Mist carries the header, footer, mobile navigation, and utility pages; the transparent black-and-blue logo sits directly on that light equipment-finish surface without a backing plate. Chrome Ink and Chrome Blue keep navigation and footer text readable on Steel Mist. Action Blue remains reserved for solid calls to action, while brighter Signal Blue and Signal Cyan are used for cable paths, focus, ticks, and short labels on dark surfaces. Equipment White carries high-priority content on dark sections, while Muted Dark supports secondary copy there. Focus rings use Signal Cyan on dark surfaces and Chrome Blue on light steel. Error is always paired with visible text and an icon or field state.

## Typography

Barlow Condensed creates compact, confident display headlines reminiscent of equipment labels. Source Sans 3 carries body and form copy. The platform monospace stack is limited to scope codes, technical eyebrows, and process markers. All primary typefaces are self-hosted in `public/fonts` to avoid render-blocking font requests. Headlines use tight line-height and restrained uppercase; body copy stays sentence case and readable at 16px or larger.

## Layout

Content lives on a 90rem maximum canvas with fluid gutters. Sections behave like full-width rack bays separated by steel hairlines rather than floating cards. Split layouts collapse to one column below 900px. Header and mobile quote controls reserve their geometry to avoid layout shifts and safe-area overlap.

## Elevation & Depth

Hierarchy comes from tonal layers, inset lines, and selective image contrast. Static content does not float. The header may use restrained backdrop blur; the primary quote control may use one short blue glow. Heavy drop shadows and glass-card stacks are not part of the system.

## Shapes

Panels are nearly square with a 6px maximum radius. Buttons and inputs use 4px corners. Tags are rectangular equipment labels, never pills. Dividers use one-pixel steel rules with occasional port ticks.

## Components

### Foundational visual states

Every control has explicit default, hover, focus-visible, active, disabled, busy, success, and error treatment. Focus uses a high-contrast Signal Cyan outline on dark surfaces and Chrome Blue on light steel. Busy states preserve control dimensions. Reduced motion removes path-drawing and reveal transforms while preserving content.

### Buttons and actions

Solid Action Blue is the primary quote action; outlined Equipment White is secondary; text links use Signal Cyan with an arrow. Buttons are at least 44px tall on touch surfaces. Labels describe the actual outcome: “Request a quote” and “Add us to your bid list.”

### Navigation and data display

Navigation uses text links with a blue terminal-line active marker. Mobile navigation is an accessible sheet. Service summaries use rack-panel dividers and scope labels instead of generic cards.

### Forms and overlays

Labels stay visible above fields. Validation is inline and focuses the first invalid field. Textareas are fixed-size with sufficient height. Upload controls support click and keyboard selection, visible file details, removal, type/size validation, and progress. Status feedback uses a stable live region. Native selects are an intentional durability choice: their closed state follows the design tokens while the open menu remains a familiar platform control.

### Iconography

Simple arrows, check marks, and communication symbols remain secondary to text labels. Icon-only controls always include accessible names.

### Motion

One 900ms cable-route draw introduces the hero. Other motion is limited to 140–220ms state changes and short scroll reveals. `prefers-reduced-motion` disables all nonessential transforms and smooth scrolling.

### Content and data visualization

Copy is grounded, specific, and active. It describes scope, coordination, and closeout without inventing certifications, project counts, or testimonials. Technical labels use short strings such as `CAT6 / DATA`, `RACK / WIFI`, and `CAMERA / ACCESS`.

## Do's and Don'ts

- **Do:** Use equipment-bay structure, labels, and cable routing to make the trade visible.
- **Do:** Keep calls, quote requests, and bid invitations obvious at every viewport.
- **Don't:** Present generated or stock imagery as completed SW Low Volt work.
- **Don't:** let bright blue carry long body copy or allow the sticky mobile CTA to cover content.
