ForgeAI Design Rule

Canonical design system and interface specification for ForgeAI.

Version: 1.0Updated: 2026-07-29Status: ActiveApplies to: Marketing website, authentication, onboarding, dashboard, templates, AI builder, code view, version history, publishing, collaboration, billing, settings, emails, and generated preview chrome.

1. Purpose

This file is the single source of truth for the ForgeAI product experience.Designers, developers, and AI coding agents must use it when creating orchanging any ForgeAI interface.

ForgeAI is an AI-native website and application builder for founders,freelancers, agencies, designers, developers, and small businesses. The productmust make sophisticated creation feel understandable without hiding the stateof the system.

The experience should feel:

Precise, calm, and trustworthy.

Premium without being ornamental.

Capable without appearing complicated.

Friendly to beginners and efficient for experts.

AI-native without relying on generic AI visual clichés.

Fast, reversible, and safe.

When this file conflicts with an explicit, current user requirement, theexplicit user requirement wins. Record intentional deviations rather thansilently changing the system.

2. Product Promise

ForgeAI helps a user move through this loop:

Describe an idea.

Clarify the goal and audience.

Generate a usable first version.

Inspect the result.

Edit visually or through conversation.

Test responsive and functional behaviour.

Restore any earlier version.

Share, export, or publish confidently.

Every design decision should shorten, clarify, or de-risk this loop.

Primary user outcome

A new user should reach a credible, editable preview in less than five minutes.

Primary product principles

Show progress, not mystery.AI activity must have understandable stages, useful status messages, andrecoverable errors.

Make every change reversible.Provide undo, redo, checkpoints, version history, and clear destructiveconfirmations.

Keep the canvas central.Controls support the work. They must not compete visually with the work.

Progressive disclosure.Beginners see the next useful decision. Experts can open code, logs, tokens,advanced properties, and deployment details when needed.

Real functionality over decorative simulation.Do not display buttons, toggles, filters, menus, or status indicators thathave no working behaviour.

Design in systems.Build from tokens and reusable components, not isolated one-off pages.

Use real content.Realistic content reveals hierarchy, wrapping, spacing, and accessibilityproblems that placeholder text hides.

Accessibility is a foundation.Keyboard access, contrast, focus, semantics, motion preferences, and screenreader output are required.

Trust must be visible.Users should understand what will change, what is saved, what is private,what is public, and what may cost money.

No lock-in cues.Export, ownership, versioning, and integration surfaces should feel likenormal parts of the product rather than hidden escape hatches.

3. Brand Foundation

3.1 Brand character

Use these attributes to evaluate every visual direction:

Attribute

Meaning in the interface

Intelligent

Clear information architecture and context-aware controls

Composed

Restrained colour, consistent rhythm, and low visual noise

Capable

Powerful workflows, visible state, and reliable feedback

Open

Export, integrations, editable output, and understandable system status

Human

Plain language, forgiving flows, and useful recovery

Crafted

Strong typography, alignment, spacing, and interaction details

3.2 Brand voice

ForgeAI speaks like an experienced product partner:

Direct and calm.

Specific instead of vague.

Helpful without being chatty.

Confident without exaggeration.

Honest about limitations, failures, and unfinished work.

Prefer:

“Your site is ready to review.”

“We couldn’t publish because the domain verification is incomplete.”

“Restore version 12? Your current draft will remain in history.”

“Add a database so projects can be saved across devices.”

Avoid:

“Magic complete!”

“Oopsie!”

“Something went wrong” without context or recovery.

“Revolutionary,” “game-changing,” and unsupported superlatives.

Blaming the user.

3.3 Product naming

Product name: ForgeAI

Use “ForgeAI” in prose and headings.

Use “Forge” only where compact navigation space requires it.

Do not write “Forge AI,” “Forge.ai,” or “FORGEAI” in normal interface copy.

The wordmark may use custom casing only in the official brand asset.

4. Visual Direction

ForgeAI uses a restrained, editorial developer-tool aesthetic.

Required characteristics

Neutral surfaces with one controlled violet-indigo accent.

High-contrast typography with clear density levels.

Fine borders instead of heavy container shadows.

Compact application controls around a spacious canvas.

Purposeful depth for overlays, floating controls, and dragged objects.

Monospace type only for code, identifiers, technical values, and logs.

Product previews should remain visually distinct from ForgeAI chrome.

Avoid

Large purple-blue gradient backgrounds.

Glowing AI orbs as the main brand device.

Excessive glassmorphism or blur.

Nested cards inside cards inside cards.

Oversized rounded rectangles on every surface.

Random neon colour accents.

Decorative charts with fake data.

Empty dashboards filled with meaningless metrics.

Excessive emoji.

Generic stock illustrations of robots, brains, or magic wands.

5. Design Tokens

All visual values must come from semantic tokens. Do not hardcode colours,spacing, radii, shadows, or typography repeatedly inside components.

5.1 Colour system

Light theme

:root {
  color-scheme: light;

  --color-bg: #f7f8fa;
  --color-canvas: #eef1f5;
  --color-surface: #ffffff;
  --color-surface-subtle: #f1f3f6;
  --color-surface-raised: #ffffff;
  --color-surface-inverse: #151820;

  --color-text-primary: #111318;
  --color-text-secondary: #5d6470;
  --color-text-tertiary: #7b8492;
  --color-text-inverse: #f7f8fa;
  --color-text-disabled: #9da4af;

  --color-border: #dde1e7;
  --color-border-strong: #c6ccd5;
  --color-border-focus: #5b5fef;

  --color-accent: #5b5fef;
  --color-accent-hover: #4d51d8;
  --color-accent-active: #4246c4;
  --color-accent-soft: #eeeefe;
  --color-accent-text: #3f43b7;

  --color-success: #16865c;
  --color-success-soft: #e5f5ee;
  --color-warning: #a86509;
  --color-warning-soft: #fff3da;
  --color-danger: #c43d4d;
  --color-danger-hover: #a93241;
  --color-danger-soft: #fdecef;
  --color-info: #246bce;
  --color-info-soft: #eaf2ff;

  --color-selection: rgba(91, 95, 239, 0.14);
  --color-overlay: rgba(12, 15, 22, 0.52);
  --color-scrim: rgba(12, 15, 22, 0.72);
}

Dark theme

[data-theme="dark"] {
  color-scheme: dark;

  --color-bg: #0d0f14;
  --color-canvas: #090b0f;
  --color-surface: #14171d;
  --color-surface-subtle: #1a1e26;
  --color-surface-raised: #1e222b;
  --color-surface-inverse: #f3f5f7;

  --color-text-primary: #f3f5f7;
  --color-text-secondary: #aab0bc;
  --color-text-tertiary: #818997;
  --color-text-inverse: #111318;
  --color-text-disabled: #626a78;

  --color-border: #2b303a;
  --color-border-strong: #3a414d;
  --color-border-focus: #8b8ff7;

  --color-accent: #8b8ff7;
  --color-accent-hover: #9c9ffa;
  --color-accent-active: #767aed;
  --color-accent-soft: #26284d;
  --color-accent-text: #b8bafc;

  --color-success: #46bd8a;
  --color-success-soft: #163b2e;
  --color-warning: #e4a84b;
  --color-warning-soft: #47351a;
  --color-danger: #ef7180;
  --color-danger-hover: #f18d98;
  --color-danger-soft: #4b222a;
  --color-info: #6ea6f2;
  --color-info-soft: #193452;

  --color-selection: rgba(139, 143, 247, 0.2);
  --color-overlay: rgba(0, 0, 0, 0.62);
  --color-scrim: rgba(0, 0, 0, 0.8);
}

Colour rules

Accent colour identifies selection, primary actions, links, focus, and activegeneration states.

Do not use accent colour for large decorative backgrounds.

Green means successful completion, never general emphasis.

Amber means caution, incomplete configuration, or waiting.

Red means error, destructive action, or data-loss risk.

Blue means neutral information.

Status meaning must never depend on colour alone. Pair colour with text,shape, icon, or placement.

Verify WCAG AA contrast for every text/background combination.

5.2 Typography

Font families

--font-sans: "Inter", "Geist", system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
--font-display: "Inter", "Geist", system-ui, sans-serif;
--font-mono: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;

Use one sans-serif family throughout the core interface. A secondary editorialserif may appear only in marketing campaign art or generated site previews, notin the ForgeAI application shell.

Type scale

Token

Size / line-height

Weight

Use

display-xl

64 / 68

650

Marketing hero on wide screens

display-lg

52 / 58

650

Marketing hero

display-md

42 / 48

650

Major marketing section

heading-xl

32 / 40

650

Page title

heading-lg

24 / 32

650

Main panel heading

heading-md

20 / 28

600

Section heading

heading-sm

16 / 24

600

Card and group heading

body-lg

18 / 28

400

Marketing lead text

body-md

16 / 24

400

Default body

body-sm

14 / 20

400

Dense application copy

label-md

14 / 20

550

Inputs and controls

label-sm

12 / 16

600

Eyebrows, badges, metadata

code-md

13 / 20

400

Code editor and logs

code-sm

12 / 18

400

Inline technical metadata

Typography rules

Use sentence case for headings, buttons, tabs, and menu items.

Do not use all caps except short technical badges of four characters or less.

Marketing text measure: 55–72 characters.

Application body text measure: 45–80 characters.

Use tabular numbers for metrics, versions, billing, times, and token usage.

Do not reduce application text below 12px.

Do not use font weight alone to communicate selection.

5.3 Spacing

Use a 4px base unit.

--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;

Spacing rules:

Default control gap: 8px.

Default form field gap: 16px.

Default card padding: 20px.

Dense panel padding: 12–16px.

Page content padding: 24px desktop, 20px tablet, 16px mobile.

Marketing section spacing: 96–128px desktop, 72px tablet, 56px mobile.

Use proximity to express relationships before adding dividers or containers.

5.4 Layout grid and breakpoints

--breakpoint-xs: 480px;
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;

Marketing grid

Maximum content width: 1200px.

Maximum wide-media width: 1440px.

Desktop: 12 columns, 24px gutters.

Tablet: 8 columns, 20px gutters.

Mobile: 4 columns, 16px gutters.

Application grid

Application fills the viewport.

Main app navigation: 64px collapsed or 240px expanded.

Builder page tree panel: 256–288px.

Builder properties panel: 304–360px.

Optional AI chat panel: 336–400px.

Top application bar: 56px.

Builder toolbar: 48px.

Minimum usable canvas width: 360px.

Panels must be resizable where expert workflows benefit from it.

5.5 Radius

--radius-xs: 4px;
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-pill: 999px;

Rules:

Inputs and standard buttons: 8px.

Cards and panels: 12px.

Large marketing media: 16px.

Badges and segmented controls: pill where appropriate.

Avoid applying 20–32px radii indiscriminately.

5.6 Borders

--border-width: 1px;
--border-width-strong: 2px;

Prefer borders and tonal surface shifts to heavy shadows.

Use a strong border for selected components only when the selection outlinewould otherwise be unclear.

Dashed borders are reserved for drop zones, empty slots, and optional regions.

5.7 Shadows

--shadow-xs: 0 1px 2px rgba(15, 18, 24, 0.06);
--shadow-sm: 0 4px 12px rgba(15, 18, 24, 0.08);
--shadow-md: 0 12px 32px rgba(15, 18, 24, 0.12);
--shadow-lg: 0 24px 64px rgba(15, 18, 24, 0.18);
--shadow-focus: 0 0 0 3px rgba(91, 95, 239, 0.24);

Use shadow-xs for quiet elevation.

Use shadow-sm for menus and floating toolbars.

Use shadow-md for dialogs.

Use shadow-lg only for major modal layers.

Dark theme shadows may use higher opacity but must not create glowing edges.

5.8 Layering

--z-base: 0;
--z-sticky: 100;
--z-toolbar: 200;
--z-dropdown: 400;
--z-popover: 500;
--z-overlay: 700;
--z-modal: 800;
--z-toast: 900;
--z-tooltip: 1000;

Never introduce arbitrary z-index: 99999.

5.9 Motion

--duration-instant: 80ms;
--duration-fast: 120ms;
--duration-base: 180ms;
--duration-slow: 240ms;
--duration-enter: 220ms;
--duration-exit: 160ms;

--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);
--ease-exit: cubic-bezier(0.4, 0, 1, 1);

Motion rules:

Motion explains hierarchy, cause, state, or spatial relationship.

Buttons and inputs: 120–180ms.

Panels and dialogs: 180–240ms.

Do not animate layout continuously during AI generation.

Use skeletons or stable progress steps rather than bouncing loaders.

Dragged items may scale to 1.01–1.02 with a stronger shadow.

Respect prefers-reduced-motion; replace motion with instant state changes oropacity transitions under 100ms.

6. Iconography and Imagery

6.1 Icons

Use one consistent outline icon family.

Standard size: 16px in dense controls, 20px in regular controls, 24px forfeature illustrations.

Stroke width should remain visually consistent.

Icons supplement labels; unfamiliar actions must include text or a tooltip.

Destructive icons use the danger colour only in destructive contexts.

Avoid mixing filled, outline, hand-drawn, and 3D icon styles.

6.2 Product imagery

Prefer real product screenshots, generated-site examples, and workflowdemonstrations.

Use screenshots with realistic content and visible interaction state.

Keep preview artwork separate from ForgeAI interface tokens.

Generated imagery must match the user’s project, not ForgeAI’s brand paletteby default.

Include useful alternative text.

Never ship broken external image URLs or generic placeholder images.

6.3 Marketing art direction

Show creation in progress: prompt, structure, canvas, and outcome.

Use subtle spatial composition rather than floating random cards.

Abstract graphics may suggest structure, iteration, connection, or layers.

Avoid humanoid robots, glowing brains, magic wands, and excessive sparkles.

7. Application Architecture

7.1 Global application shell

The shell contains:

Product navigation.

Workspace switcher.

Primary content region.

Contextual page actions.

Global account/help controls.

Rules:

Keep persistent navigation visually quieter than page content.

The current destination must be visible through more than colour alone.

Preserve navigation state when moving between related project screens.

Display save/sync state near project identity, not in transient toasts alone.

Do not place unrelated global and project-specific actions in the same menu.

7.2 Builder shell

Desktop builder hierarchy:

Application top bar
└── Project toolbar
    ├── Left panel: pages, layers, components, assets
    ├── Centre: responsive canvas
    ├── Right panel: properties, styles, interactions
    └── AI panel: conversation, plan, progress, logs

The canvas is the visual centre. Side panels use compact density and must notvisually dominate.

Left panel

Tabs: Pages, Layers, Components, Assets.

Tree items show hierarchy, visibility, lock state, and context actions.

Selected item uses accent-soft background plus a visible indicator.

Drag and drop shows exact insertion position.

Renaming supports Enter to confirm and Escape to cancel.

Canvas

Use a neutral canvas background distinct from the rendered page.

Display the current breakpoint and viewport width.

Support desktop, tablet, mobile, fit, zoom in, and zoom out.

Use a subtle outline for selected elements.

Place selection handles outside content when possible.

Do not let ForgeAI controls appear inside exported user content.

The rendered page must remain interactive in Preview mode.

Right panel

Organize controls by Content, Layout, Style, Responsive, Interaction, andAdvanced.

Show the most common controls first.

Hide advanced CSS and technical identifiers behind disclosure.

Use proper inputs for values rather than requiring raw text.

Changes should update the canvas immediately and autosave shortly afterward.

AI panel

Distinguish user messages, AI explanations, plans, tool activity, warnings,and completion summaries.

Use structured progress rows rather than long streams of technical output.

Allow the user to stop generation.

Make proposed plans reviewable before execution for large changes.

Show which pages or components will change.

Provide a concise diff summary after completion.

7.3 Responsive builder behaviour

1280px and above

Show canvas plus two supporting panels.

AI panel may be docked or toggled.

Panels may be resized.

1024–1279px

Keep canvas and one active side panel visible.

Secondary panels become drawers or tabbed overlays.

768–1023px

Prioritize preview and review workflows.

Use one side drawer at a time.

Move device controls into a compact toolbar.

Below 768px

Do not compress the desktop builder into unusable columns.

Use a full-screen canvas with bottom sheets for pages, AI, and properties.

Support common edits: text, image, colour, visibility, reorder, undo, preview,and publish.

Direct complex code editing to a larger viewport without blocking basic work.

8. Marketing Website Rules

8.1 Header

Height: 64–72px.

Use a simple wordmark, primary navigation, sign-in action, and one main CTA.

Keep no more than six top-level navigation items.

On mobile, use a full-height or large sheet menu with clear grouping.

Header may become subtly opaque or bordered after scrolling.

8.2 Hero

The hero must communicate:

What ForgeAI does.

Who it helps.

What the user can accomplish.

The primary next action.

Use:

One strong headline.

One concise supporting paragraph.

One primary CTA and at most one secondary CTA.

A real product demonstration or credible interactive preview.

Avoid:

Four or more CTA buttons.

Vague headlines such as “Build the future.”

Decorative dashboard fragments that do not explain the workflow.

8.3 Feature sections

Organize features around user outcomes, not internal technology.

Alternate copy and media only when the rhythm remains meaningful.

Use diagrams or screenshots when they explain multi-step behaviour.

Do not place every feature in an identical card grid.

8.4 Social proof

Use verified customer names, roles, companies, and results.

Never invent logos, statistics, testimonials, or awards.

If real proof is unavailable, omit the section or label examples clearly.

8.5 Pricing

Make plan differences scannable.

Explain usage units in plain language.

Display monthly/annual pricing state clearly.

Do not hide material limits behind tooltips.

Provide a comparison table for complex differences.

8.6 Final CTA

Reaffirm the concrete outcome.

Use the same primary CTA language as the hero when possible.

Do not create artificial urgency.

9. Core Components

9.1 Buttons

Variants:

Primary

Secondary

Ghost

Destructive

Link

Icon-only

Sizes:

Small: 32px

Medium: 40px

Large: 48px

Rules:

Minimum touch target: 44×44px on touch devices.

Use verb-led labels: “Create project,” “Publish site,” “Restore version.”

Use one primary button per action group.

Loading buttons preserve width and replace the leading icon with a progressindicator.

Disabled buttons require an adjacent reason when the user may not understandwhy they are disabled.

Icon-only buttons require accessible names and tooltips.

Destructive actions must not use the primary accent style.

9.2 Inputs

Standard height: 40px desktop, 44px touch.

Each field may include:

Visible label.

Optional description.

Required or optional status.

Input control.

Validation or helper message.

Rules:

Do not rely on placeholder text as the label.

Validate after meaningful interaction, not on every empty keystroke.

Preserve user input after errors.

Error messages explain how to recover.

Use correct input types and autocomplete attributes.

Textareas expand within sensible limits.

9.3 Prompt composer

The composer supports:

Multiline instructions.

File/image/reference attachment.

Mode selection: Ask, Plan, Build.

Model/provider selection when applicable.

Send and Stop.

Optional prompt enhancement.

Rules:

Keep the default state simple.

Place advanced controls behind a menu.

Show attached references as removable chips.

Preserve unsent drafts.

Enter sends only when that convention is clearly communicated; supportShift+Enter for a new line.

Warn before sending secrets detected in plaintext.

9.4 Cards

Cards group content that belongs together. A card is not the default wrapper forevery section.

Project card includes:

Preview thumbnail.

Project name.

Updated time.

Environment or publish state.

Collaborator presence when useful.

Context menu.

Template card includes:

Clear thumbnail.

Template name and category.

Short outcome-focused description.

Preview and Use template actions.

Use hover elevation only when the full card is interactive.

9.5 Navigation

Use persistent side navigation for the application.

Use tabs only for sibling views of the same context.

Use breadcrumbs for deep hierarchy, not as a substitute for navigation.

Selected navigation has background, indicator, and correct aria-current.

Collapse labels only when icons remain unambiguous.

9.6 Menus and popovers

Open near the invoking control.

Keep action labels concise.

Separate destructive actions visually.

Support arrow keys, Enter, Escape, and typeahead where appropriate.

Close when focus moves outside unless the popover contains a multi-step task.

9.7 Dialogs and sheets

Use a dialog for focused decisions that block the current flow. Use a sheet forsupporting context, inspector controls, or mobile panels.

Dialog width: 420–640px for most flows.

Use a clear title and optional description.

Primary action appears last in reading order.

Initial focus goes to the first meaningful control, not automatically to adestructive action.

Escape closes non-destructive dialogs.

Long multi-step flows belong on a page or dedicated full-height sheet.

9.8 Toasts

Confirm background events and non-blocking results.

Do not use a toast as the only evidence of saving, publishing, or failure.

Default duration: 4–6 seconds.

Persistent or critical errors belong inline.

Provide Undo when a recent reversible action benefits from it.

9.9 Badges and status

Approved statuses:

Draft

Generating

Ready

Published

Needs attention

Failed

Archived

Use consistent colour and icon mapping throughout the product.

9.10 Tables

Use tables for exact multi-field comparisons and administrative data.

Keep the primary identifier in the first visible column.

Right-align numeric values.

Provide sorting only where implemented.

Use sticky headers for long tables.

On mobile, allow horizontal scroll or switch to structured rows; do notsqueeze unreadable columns.

9.11 Empty states

An empty state contains:

A clear explanation of what belongs here.

Why it is useful.

One primary next action.

Optional secondary learning action.

Do not use oversized illustrations to fill the page.

9.12 Loading states

Use skeletons when content structure is known.

Use a spinner for short, local actions.

Use staged progress for AI generation, import, export, and deployment.

Keep existing content visible during background refresh.

Avoid indeterminate loading when the system can name the current stage.

9.13 Error states

Every error should answer:

What failed?

What was preserved?

What can the user do now?

Where can technical users inspect details?

Keep stack traces and raw provider errors behind “View details.”

9.14 Tooltips

Use for icon explanation or brief supplementary context.

Do not hide essential instructions in a tooltip.

Show after a short delay.

Must be reachable by keyboard and dismissible.

10. AI-Specific Interaction Rules

10.1 Planning

For large changes, show a plan containing:

User goal.

Assumptions.

Affected pages and components.

Data or integration changes.

Ordered implementation steps.

Risks or irreversible actions.

Allow the user to edit, approve, or reject the plan.

10.2 Generation progress

Use meaningful stages such as:

Understanding the brief

Planning pages

Creating the design system

Building components

Connecting data

Testing interactions

Preparing preview

Do not fabricate precise percentages unless the system has real progress data.

10.3 Clarification

Ask only questions that materially affect the result.

Group related questions.

Offer 2–4 useful options plus a custom response.

Explain why a high-impact answer matters.

Respect information already provided.

10.4 Proposed changes

Before a broad edit, show:

Scope.

Files/screens affected.

Whether data or schema changes are required.

Whether existing functionality may change.

Afterward, show:

What changed.

What was tested.

Any remaining limitation.

The version/checkpoint created.

10.5 AI failure

Preserve the user’s prompt and attachments.

Keep the last working preview.

Distinguish rate limits, missing configuration, validation failures, buildfailures, and network errors.

Offer retry, revise prompt, restore version, or inspect details as applicable.

Never discard a project because one generation failed.

10.6 Trust and cost

Show when an action consumes paid usage.

Show which connected service will be accessed.

Require confirmation before publishing, purchasing a domain, changingbilling, sending external messages, or deleting stored data.

Do not expose model secrets or internal system prompts.

11. Page Specifications

11.1 Authentication

Keep the page visually simple.

Show product identity and a concise benefit.

Support clear sign-in, sign-up, password recovery, and provider states.

Display OAuth errors inline with a recovery action.

Do not place fake testimonials beside sensitive authentication forms.

11.2 Onboarding

Collect only what improves the initial result:

User role.

Project type.

Business/product name.

Audience.

Primary outcome or CTA.

Needed pages.

Visual direction.

Existing brand/reference assets.

Use a visible step indicator for multi-step onboarding. Allow Back and Save andexit. Provide sensible defaults.

11.3 Projects dashboard

Priority order:

Create project.

Continue recent project.

Understand project status.

Find or filter projects.

Access templates and imports.

Do not lead with vanity statistics.

11.4 Template gallery

Filters remain visible and easy to clear.

Categories describe use cases, not internal design terminology.

Template previews use realistic content.

Preview must not immediately create a project.

“Use template” clearly creates a copy.

11.5 Builder

The builder must support:

Pages and hierarchy.

Visual selection.

Text editing.

Image replacement.

Layout and spacing controls.

Design tokens.

Responsive visibility and overrides.

AI conversation.

Undo and redo.

Autosave state.

Preview.

Version history.

Share and publish.

Advanced code, logs, and schema tools may be separate modes but must use thesame project state.

11.6 Version history

Each version shows:

Version number or clear timestamp.

Author.

Source: user, AI, import, restore, or publish.

Concise summary.

Preview option.

Restore option.

Restoring creates a new version; it must not erase later history.

11.7 Publishing

The publish flow shows:

Environment.

Domain or generated URL.

Build status.

Last published version.

Changes since publish.

Required checks.

Expected cost if applicable.

Successful publishing provides:

Live URL.

Copy and open actions.

SEO/domain follow-up when needed.

Rollback path.

11.8 Team and permissions

Make current role visible.

Explain permission differences.

Resolve people before invitations.

Pending invitations are distinguishable from active members.

Role changes and removals require clear confirmation.

11.9 Billing and usage

Separate plan, usage, invoices, and payment method.

Explain usage units with examples.

Show included allowance, current usage, and forecast where reliable.

Warn before an action likely to cross a limit.

Never use confusing double negatives around billing controls.

11.10 Settings

Group settings into:

General

Appearance

Design system

Domains

Integrations

AI providers

Team

Security

Billing

Data and export

Settings that affect only one project must not appear as global settings.

12. Responsive Design Rules

Design every screen for desktop, tablet, and mobile from the beginning.

Mobile

Minimum horizontal page padding: 16px.

Minimum touch target: 44×44px.

Stack primary content before secondary context.

Convert side panels to sheets.

Keep primary actions reachable without obscuring form content.

Avoid horizontal scrolling except for code, wide tables, or canvases where itis intentional.

Do not hide essential actions only in hover.

Tablet

Use 8-column layouts.

Keep one supporting panel visible where space allows.

Prefer collapsible navigation.

Preserve preview scale and readable property controls.

Desktop

Use available width to increase context, not merely stretch text.

Keep marketing copy within readable measure.

Support resizable builder panels.

Maintain a meaningful minimum canvas width.

Large screens

Centre marketing content within maximum widths.

Do not expand panels indefinitely.

Let the canvas gain most additional space.

13. Accessibility

ForgeAI targets WCAG 2.2 AA.

Required

Semantic HTML landmarks.

Logical heading hierarchy.

Keyboard access for all interactive elements.

Visible focus with at least a 3:1 focus indicator contrast.

Skip link to main content.

Accessible names for icon-only buttons.

Correct labels, descriptions, and errors for fields.

aria-live for appropriate generation, save, publish, and error updates.

Captions or transcripts for instructional video.

Alternative text for meaningful images.

Empty alt text for purely decorative images.

Reduced motion support.

200% zoom without lost content or functionality.

Reflow at 320 CSS pixels where applicable.

Contrast validation in both themes.

Builder accessibility

Page/layer trees support arrow-key navigation.

Drag-and-drop operations have keyboard alternatives.

Resize and reorder interactions expose accessible controls.

Canvas selection state is announced.

Device preview controls expose the active state.

AI progress does not repeatedly interrupt screen reader users.

Colour controls include text values and contrast feedback.

14. Content Design

Labels

Use familiar product language.

Prefer verbs for actions and nouns for destinations.

Keep labels stable across pages.

Avoid technical terms when a plain term is accurate.

Button examples

Prefer:

Create project

Generate website

Review plan

Apply changes

Restore version

Publish site

Connect domain

Invite member

Avoid:

Go

Yes

Submit

Continue when the destination is unclear

Do it

Confirmation messages

State the object and consequence:

“Delete ‘Summer Campaign’? This removes the project and its unpublishedversions.”

“Unpublish forge.example.com? Visitors will no longer be able to open it.”

Dates and times

Use relative time for recent activity, with exact time available on hover orfocus.

Use the user’s locale and time zone.

Use unambiguous full dates in billing, audit, and publishing records.

15. Themes and User-Generated Designs

ForgeAI chrome and generated-site designs are separate systems.

ForgeAI theme changes must never silently alter the generated website theme.

Generated websites use their own scoped design tokens.

Preview iframe or sandbox styles must not leak into the application shell.

Imported design systems must be validated and scoped.

Show a clear boundary between global ForgeAI settings, workspace designsystems, and project design tokens.

Design system portability

ForgeAI projects should be able to represent their design rules in a portableDESIGN.md containing:

Brand direction.

Colours.

Typography.

Spacing.

Grid.

Radii.

Borders.

Shadows.

Motion.

Components.

Responsive behaviour.

Accessibility rules.

Prohibited patterns.

16. Implementation Rules

16.1 Component architecture

Build reusable primitives before page-specific composition.

Use semantic component names.

Separate visual variants from business logic.

Use controlled variants rather than duplicated class strings.

Components must include hover, active, focus, disabled, loading, error, anddark-theme states where applicable.

Do not create multiple near-identical button, input, modal, or card systems.

16.2 Styling

Map semantic tokens to CSS variables.

Framework utilities may consume tokens but must not replace semantic naming.

Do not use raw hex colours in component markup.

Do not use unexplained arbitrary spacing values.

Keep responsive rules close to the component or layout they govern.

Support light and dark themes without duplicating the full component tree.

16.3 Suggested component stack

Where compatible:

React and TypeScript.

Accessible headless primitives such as Radix UI.

shadcn/ui as a starting implementation, customised to ForgeAI tokens.

Lucide-style outline icons.

Monaco for code editing.

A validated schema for AI-generated layouts.

The design system is technology-independent. Equivalent accessible tools areallowed.

16.4 Performance

Avoid shipping large editor dependencies to marketing pages.

Lazy-load code editor, logs, and advanced builder panels.

Reserve image aspect ratios to prevent layout shift.

Virtualize long trees, logs, tables, and version lists.

Optimistically update only reversible, low-risk local actions.

Keep interaction feedback under 100ms when possible.

16.5 State persistence

Show Saving, Saved, Offline, Conflict, and Failed to save states.

Autosave must not interrupt editing.

Resolve concurrent-edit conflicts explicitly.

Preserve unsent prompts, incomplete forms, and recoverable drafts.

17. Prohibited Patterns

Never introduce the following without an explicit approved exception:

Hardcoded colour values repeated across components.

Placeholder buttons or menus that do nothing.

Lorem ipsum in production-facing screens.

Fake testimonials, logos, ratings, user counts, revenue, or security claims.

Auto-playing sound.

Essential actions available only on hover.

Destructive actions beside primary actions without separation.

Modal dialogs nested inside modal dialogs.

Toast-only critical errors.

Infinite spinners with no context.

AI percentage progress that is not based on real progress.

Irreversible restore behaviour.

Auto-publishing after generation.

Raw secrets in client-side code or interface logs.

Unreviewed arbitrary generated code running in the main application context.

Excessive gradients, glass blur, glow, and animated background effects.

Mixing multiple icon families.

More than one visually dominant CTA in the same action group.

Mobile layouts created by simply shrinking desktop panels.

Accessibility attributes added without correct interaction behaviour.

18. AI Agent Instructions

Any AI agent implementing ForgeAI UI must follow this sequence:

Read this entire file before changing interface code.

Identify the affected product surface and user flow.

Reuse existing tokens and components.

Check desktop, tablet, mobile, light theme, and dark theme.

Use real product copy and realistic data.

Implement complete interaction states.

Preserve unrelated working behaviour.

Run type, build, accessibility, and interaction checks.

Summarize what changed and what remains.

Before generating a new screen

The agent must define:

Screen purpose.

Primary user.

Primary action.

Entry and exit points.

Required data.

Loading, empty, error, success, permission, and offline states.

Responsive transformation.

Reused components.

When editing an existing screen

Make the smallest change that satisfies the requirement.

Do not restyle unrelated components.

Do not replace working design tokens with one-off values.

Do not remove accessibility behaviour.

Do not change content hierarchy merely to make a screenshot look balanced.

When instructions are ambiguous

Ask focused questions if the answer materially changes the design.

Otherwise follow this file and state the assumption.

19. Definition of Done

A ForgeAI interface is complete only when all relevant checks pass.

Visual

Uses ForgeAI semantic design tokens.

Aligns to the defined grid and spacing scale.

Uses the approved typography hierarchy.

Uses consistent icons, radii, borders, and shadows.

Maintains clear hierarchy in light and dark themes.

Avoids prohibited visual clichés.

Responsive

Works at 320px, 375px, 768px, 1024px, 1280px, and 1536px.

Has no accidental horizontal overflow.

Converts panels to appropriate drawers or sheets.

Preserves the primary task at every breakpoint.

Meets minimum touch target sizes.

Interaction

Every visible control works.

Hover, active, focus, disabled, loading, success, and error states exist.

Keyboard interaction is complete.

Destructive actions have appropriate confirmation.

Save and generation states are understandable.

Undo, retry, or recovery is available where applicable.

Accessibility

Semantic structure and heading order are correct.

Labels and accessible names are complete.

Contrast meets WCAG AA.

Focus is visible and logically ordered.

Screen reader announcements are useful and not noisy.

Reduced-motion behaviour is implemented.

Drag, resize, and reorder have keyboard alternatives.

Content

Uses real, concise, consistent copy.

Error messages explain recovery.

No fabricated social proof or metrics.

Dates, numbers, usage, and pricing are unambiguous.

No lorem ipsum remains.

Engineering

Components reuse existing primitives.

No repeated hardcoded token values.

Types and production build pass.

Critical user flows are tested.

Large dependencies are loaded only where needed.

Untrusted generated content is isolated and validated.

Existing working behaviour remains intact.

20. Final Design Test

Before approving a ForgeAI design, ask:

Can a first-time user identify the next action in five seconds?

Can an expert reach advanced controls without fighting the interface?

Is AI activity understandable and interruptible?

Can the user safely undo or restore the change?

Is the canvas more visually important than its controls?

Does every visible control perform a real action?

Does the design remain usable without colour, hover, animation, or a mouse?

Does the mobile experience preserve the task instead of compressing it?

Are privacy, publishing, permissions, and cost clear before commitment?

Does the result look specifically like ForgeAI rather than a generic AIdashboard?

If any answer is “no,” the design is not finished.