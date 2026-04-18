# CSS migration rules

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