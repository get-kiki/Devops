# พักแป๊บ design

## Surface

A Thai focus timer for a desk in daytime light. Familiar buttons, modes, sliders and task checkboxes keep the workspace immediately usable. The window illustration is original inline SVG; no shipping raster images or stock assets.

## Tokens

- Background `#f3f4ed`, paper `#fffefa`, ink `#294437`, secondary ink `#647265`.
- Action green `#365e48`, pale green workspace `#e8eddf`, lines `#dce1d4`.
- Font: Noto Sans Thai, Tahoma, sans-serif. Body and secondary labels have a 12px minimum. Title 32px desktop and 28px mobile, section titles 17px. Timer 94px desktop, 90px mobile, tabular figures.
- Main spacing 8, 12, 16, 20, 24, 32, 40, 48px. Main panels use 20px radius, small controls 7–13px, timer buttons pill shaped.

## Composition

Maximum outer width 1200px with 48px desktop gutters, 24px tablet and 16px mobile. Timer and two supporting panels form a two-column workspace. Below 640px they stack. Primary action is always beside reset beneath the timer.

## State and interaction

Active modes use a white fill. Playing sound uses solid action green. Timer running animates a small leaf, with reduced-motion support. Task text is struck through when complete; changing it retains keyboard focus. Focus rings use brown `#9b673b` and a 4px offset. The breathing dialog closes with Escape and returns focus to its trigger.

## Verification

Independent finish review found a task checkbox focus loss, corrected by updating the completion count without replacing the checkbox. Regression test explicitly checks focus after Space. Desktop 1280px and mobile 390px/320px captures were inspected. Browser integration tests cover core interactions. Font loading uses Google Fonts; system fallbacks remain functional offline.
