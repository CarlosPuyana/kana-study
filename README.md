# Kana Study

Aplicación web para estudiar japonés desde el navegador. Incluye contenido y modos de estudio para kana, kanji y vocabulario, con progreso guardado localmente en el dispositivo.

## Documentación

**[Índice central de documentación](docs/INDEX.md)** — arquitectura, módulos, hitos, lanzamiento y evidencias locales.

## Módulos

- Kana
- Kanji
- Vocabulary
- Flags
- Mazos
- RUSH

## Requisitos

- Node.js 24.15.0 o una versión compatible con `engines.node`
- npm

## Desarrollo

```bash
npm install
npm start
```

La aplicación de desarrollo se sirve en `http://localhost:4200/` y utiliza hash routing.

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

## Deployment

El despliegue en GitHub Pages es automático mediante GitHub Actions al hacer push a la rama `main`. El workflow usa Node.js 24.15.0, `npm ci` y el build candidato:

```bash
npm run build:manga-candidate
```

Este comando compila con la base `/kana-study/`, valida que el bundle inicial sea estrictamente menor de 750000 bytes y genera `dist/kana-study-candidate/browser`. `npm run build` utiliza otra entrada y no sustituye esta validación. [Diagnóstico y optimización del bundle](docs/GITHUB_PAGES_BUNDLE.md).

Tras el primer push, selecciona **GitHub Actions** como origen en **Settings → Pages** del repositorio.

El progreso de estudio se guarda en el navegador mediante `localStorage` e IndexedDB; no se sincroniza entre dispositivos.
