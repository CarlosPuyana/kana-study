# Kana Study

Aplicación web para estudiar japonés desde el navegador. Incluye contenido y modos de estudio para kana, kanji y vocabulario, con progreso guardado localmente en el dispositivo.

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

El despliegue en GitHub Pages es automático mediante GitHub Actions al hacer push a la rama `main`. El workflow compila la aplicación con la base `/kana-study/` y publica el contenido estático de `dist/kana-study/browser`.

Tras el primer push, selecciona **GitHub Actions** como origen en **Settings → Pages** del repositorio.

El progreso de estudio se guarda en el navegador mediante `localStorage` e IndexedDB; no se sincroniza entre dispositivos.
