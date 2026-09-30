# Kana Study - Codex project instructions

## Goal
Build a browser-first Japanese study application. The current scope is the foundation: Home, Settings, translations, theming, kana data, progress state, routing, and persistence. The learning session itself will be designed in a later phase.

## Stack
- Angular 22, standalone components, strict TypeScript.
- SCSS only. Do not add Bootstrap, Tailwind, Material, or another UI library unless explicitly requested.
- Client-side only for now. Do not add a backend, authentication, Supabase, or APIs unless explicitly requested.
- Hash routing is intentional so GitHub Pages refresh/deep-link behavior stays simple.
- State persists in `localStorage` through services in `src/app/core/services`.

## Architecture rules
- Feature pages belong in `src/app/features`.
- Reusable presentational components belong in `src/app/shared/components`.
- Models belong in `src/app/core/models`.
- App-level state/business logic belongs in `src/app/core/services`.
- Japanese study data belongs in `src/app/data`.
- Do not put feature logic in the root `App` component.

## Internationalization
- Every user-facing string must be translated through `TranslationService`.
- Whenever a translation key is added, add it to all three files:
  - `src/assets/i18n/es.json`
  - `src/assets/i18n/en.json`
  - `src/assets/i18n/ca.json`
- Spanish is the default language.

## Themes
- Use semantic CSS custom properties from `src/styles.scss`.
- Components must not hardcode their own dark/light color palettes.
- Supported theme preferences: `dark`, `light`, `system`.
- Dark is the default.

## Study data and progress
- Kana IDs are stable persistence identifiers. Never casually rename them.
- Progress states are `new`, `learning`, `memorized`.
- Disabling content must hide it from current totals without deleting its saved progress.
- Hiragana and katakana are not assigned artificial JLPT levels. JLPT metadata is for future kanji/vocabulary content.

## Browser and UX requirements
- Must work in current Chrome and Safari.
- Keep keyboard focus styles and semantic buttons/links.
- Design mobile-first and keep desktop layouts responsive.
- Avoid experimental browser APIs unless there is a graceful fallback.

## Current scope boundaries
- `/learn`, `/cards`, `/selection`, `/medals`, and `/more` are intentionally placeholders.
- Do not invent the learning algorithm or quiz behavior until the user defines that phase.
- Medal rules/names are intentionally placeholders.

## Before finishing a change
1. Run `npm run build`.
2. If tests exist for the changed behavior, run `npm test`.
3. Keep all three translations synchronized.
4. Check both dark and light theme styling.
5. Do not commit generated `dist/` or `node_modules/`.
