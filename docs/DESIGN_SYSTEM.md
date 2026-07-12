# Good Goods UI Decisions

The UI direction was generated with ui-ux-pro-max and checked against its grocery color, accessibility, form, loading, and React Native guidance. Shadcn documentation was then used for variant-based Button and Badge APIs, grouped form fields, composable empty states, and explicit loading composition.

Official shadcn components are browser DOM components, so they are not installed in this Expo project. Their useful conventions are implemented once with React Native primitives under `src/components/ui`.

The source of truth is `design-system/good-goods/MASTER.md`. In short:

- Swiss-modern editorial layout with real product images.
- Rubik headings and Nunito Sans body text.
- Neutral paper surfaces, accessible leaf green actions, restrained tomato emphasis, and brass delivery/rating details.
- 4/8 px spacing rhythm, 8 px maximum radius, and 48 px controls.
- One clear primary action per screen.
- Visible checkout labels, inline errors, loading feedback, and no decorative animation.

