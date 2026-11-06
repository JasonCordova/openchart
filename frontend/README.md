# OpenChart frontend

A single React + TypeScript landing page with animated CSS gradient blobs, a reduced-motion fallback, and a hospital estimate/freshness notice.

## Run locally

Use Node.js 24 LTS (`.nvmrc` is included), or a supported Node version matching `package.json`, when installing dependencies.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

Node.js 24 is also pinned as a project-local development dependency. The npm scripts automatically use that runtime, so an older system Node installation does not run Vite, TypeScript, or the preview server. Your system Node installation is unchanged.

If you previously encountered `node:util` / `styleText` errors, they came from starting Vite with an unsupported Node version. Install the dependencies, then use `npm run dev` rather than running the global `node` executable directly.

```sh
npm run build
npm run preview
```

The build command checks TypeScript and creates the static production site in `dist/`. This page does not require a backend or AWS credentials. Procedure search is not implemented yet.

“Explore prices” blurs and fades the landing page into an empty black placeholder for the future application. The blur and fade share a 1.1-second animation, and the placeholder appears when that animation finishes. Background motion pauses during the transition, and visitors who prefer reduced motion go straight to the placeholder.

The background uses soft radial gradients on one gently moving layer, without blur or backdrop filters. The colors move together within a fixed viewport so they remain blended when zooming. Animation starts paused when the visitor prefers reduced motion, and the footer’s Play/Pause motion button lets visitors control it. DM Sans loads from Google Fonts, with local system-font fallbacks.
