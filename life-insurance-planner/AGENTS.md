

# CSS migration rules

## Non-negotiable rules
- Never add new styles to `styles.css` unless I explicitly approve it.
- Treat `styles.css` as legacy/quarantine.
- Put new component styles in `components.css`.
- Put neutral shared base/reset rules in `base.css`.
- Put reusable tokens only in `tokens.css`.
- Put layout patterns in `layout.css`.
- Put one-off helpers in `utilities.css`.
- We must make the styling clean and cascading


## Workflow
- Investigate first, edit second.
- Work on one component at a time unless I explicitly ask to bundle related work.
- Add new component classes additively.
- Never remove legacy selectors unless I explicitly approve it.
- Never edit JS for CSS migrations unless I explicitly approve it.
- Show the exact affected files and diff before broader changes.
- Browser verification is required after each migration.

## Guardrails
- Do not rewrite the whole stylesheet.
- Do not move unrelated CSS while working on one component.
- Do not invent new tokens unless values are clearly reused.
- Prefer shared components over host-specific styling.
- If a request would require touching `styles.css`, stop and explain why.

- Work one component at a time.
- Investigate first, edit second.
- Never rewrite the whole stylesheet.
- Never remove legacy selectors unless explicitly approved.
- Do not touch styles.css unless explicitly approved.
- Do not edit JS for CSS migrations unless explicitly approved.
- Add new component classes additively.
- Keep diffs minimal and reviewable.
- Migrate shared visuals first, not layout, unless explicitly requested.
- Prefer shared components over host-specific styling.
- Do not invent new tokens unless values are clearly reused.
- Show exact affected files and selectors before broad changes.
- Browser verification is required after each migration.