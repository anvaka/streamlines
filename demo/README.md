# streamlines-demo (Vue 3 + Vite)

This is a demo for the streamline generation library. It was migrated from Vue 2 + Webpack to **Vue 3 + Vite**.

## Development

```bash
npm install
npm run dev
```

Visit the printed local URL (default: http://localhost:5173 ).

## Production build

```bash
npm run build
npm run preview # locally preview dist build
```

## Migration highlights

- Upgraded to Vue 3 and Vite build pipeline (removed legacy `build/` and `config/` usage).
- Converted CommonJS modules to ES modules.
- Replaced `vue-color` with `@ckpack/vue-color` (Vue 3 compatible).
- Implemented direct CodeMirror 5 integration (previous wrapper was Vue 2 only).
- Added lazy load via dynamic import in `nativeMain.js`.

If something seems off after the migration, please open an issue or submit a PR.
