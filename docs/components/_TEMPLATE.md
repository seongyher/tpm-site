# Component Name

Source: `src/components/.../ComponentName.astro`

## Purpose

Describe the component's job in one or two concrete sentences. Say what it is
responsible for and what it must not own.

## Public Contract

- List public props, slots, variants, required accessible labels, and required
  data shape.
- Name mutually exclusive states explicitly.
- Avoid vague boolean clusters; prefer semantic variants and discriminated
  states.

## Composition Relationships

Document parent, child, and sibling relationships: alignment, shared dimensions,
spacing, containment, ordering, visibility exclusivity, sticky/fixed behavior,
and what should happen during scroll and resize.

## Layout And Responsiveness

Document the mobile base behavior, tablet/desktop/wide behavior, short-viewport
behavior, wrapping rules, overflow rules, and whether the component depends on
viewport width or container width.

## Layering And Scrolling

Document any sticky, fixed, absolute, overlay, popover, scroll-container, or
`z-index` behavior. If none is intended, say so.

## Interaction States

Document default, hover, focus-visible, active, disabled, current, selected,
expanded/collapsed, empty, loading, error, missing content, long content, and
dense content where applicable.

## Accessibility Semantics

Document semantic element choices, landmarks, labels, keyboard behavior, touch
behavior, ARIA requirements, no-JavaScript fallback, and expected focus order.

## Content Edge Cases

Document long titles, long words, missing images, missing excerpts, many tags,
empty states, dense lists, one-item lists, unusual punctuation, and author
content the component must tolerate.

## Localization And Direction

Document user-facing labels, generated labels, date/count formatting inputs,
long translated strings, non-Latin scripts, right-to-left direction, and any
icon or ordering behavior that changes with text direction. If the component is
locale-neutral because it renders no text and inherits direction safely, say so.

## Theme Behavior

Document light/dark mode requirements for readable text, visible borders,
visible focus rings, correct CTA contrast, and semantic token usage.

## Testable Invariants

- List explicit render, layout, accessibility, interaction, and visual
  invariants.
- Prefer relationship assertions over screenshot-only tests where possible.

## Follow-Up Notes

Record brittle or questionable implementation decisions here with a clear
follow-up. Do not silently encode accidental behavior into tests.
