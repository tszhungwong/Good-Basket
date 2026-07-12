# Good Goods Design System

> Generated with ui-ux-pro-max, then adapted to the approved local-market product identity and React Native platform requirements.

## Direction

- Product: customer-facing neighborhood grocery and home-goods marketplace.
- Style: Swiss-modern editorial structure with real product photography.
- Density: 6/10, compact enough for repeat shopping without feeling crowded.
- Motion: 2/10, limited to native navigation and press feedback.
- Layout: mobile-first, one column on phones and a two-column product grid when width permits.

## Colors

| Role | Value | Use |
| --- | --- | --- |
| Canvas | `#F4F6F1` | App background |
| Surface | `#FFFFFF` | Cards and controls |
| Ink | `#111815` | Primary text |
| Muted ink | `#5B675F` | Secondary text |
| Line | `#DCE4DD` | Borders and dividers |
| Brand | `#047857` | Primary actions and selected state |
| Brand pressed | `#065F46` | Press feedback |
| Brand soft | `#E7F6EF` | Selected supporting surfaces |
| Tomato | `#B93826` | Cart emphasis and destructive attention |
| Tomato soft | `#FCEBE6` | Accent background |
| Brass | `#9A5A08` | Ratings and delivery details |
| Brass soft | `#FFF2D6` | Delivery background |
| Success | `#166534` | Confirmed status |
| Danger | `#B42318` | Errors and destructive actions |
| Scrim | `rgba(17, 24, 21, 0.52)` | Modal isolation |

Brand, tomato, success, and danger use white foreground text. Color never carries state alone; pair it with text or an icon.

## Typography

- Heading: Rubik 600/700.
- Body: Nunito Sans 400/600/700.
- Scale: 12, 14, 16, 18, 24, 32, and 40.
- Body text starts at 16 with a 24 line height.
- Letter spacing remains at the platform default.
- Prices use tabular figures where supported.

## Geometry

- Spacing follows 4, 8, 12, 16, 24, 32, 40, 48, and 64.
- Controls have at least a 48 px touch area.
- Cards, fields, and buttons use an 8 px maximum corner radius.
- Product media reserves a stable aspect ratio before loading.
- Wide screens constrain content to 1120 px and readable forms to 680 px.

## Component Rules

- Buttons use semantic variants: primary, secondary, outline, and ghost.
- Button loading state composes a spinner, label, disabled behavior, and accessibility state.
- Badges use named tones rather than arbitrary per-screen colors.
- Fields compose a visible label, native input, optional helper, and nearby error.
- Empty and error states compose icon, title, explanation, and one recovery action.
- Category and sort option sets expose selected state to assistive technology.
- Icon-only actions always include an accessibility label.

## Storefront Composition

1. Compact Good Goods identity and cart action.
2. Search field.
3. Delivery information strip.
4. Image-led featured product.
5. Product heading, sort action, and category controls.
6. Scannable product grid.
7. Persistent cart summary only when the cart has items.

## Motion and Feedback

- Use opacity or background changes for press feedback without changing bounds.
- Show loading feedback after 300 ms and disable repeated submission.
- Do not add decorative loops, parallax, bounce, or layout-shifting hover effects.
- Respect native reduced-motion and navigation settings.

## Accessibility Checklist

- Minimum 4.5:1 contrast for body text.
- Minimum 44 px iOS and 48 px Android touch targets.
- Visible labels and inline errors for checkout fields.
- Logical reading and focus order.
- Meaningful labels for images and icons.
- Safe-area clearance for fixed bottom actions.
- No horizontal page overflow at phone widths.

