# OpenChart frontend

A React + TypeScript landing page with animated CSS gradients, a reduced-motion fallback, and a fullscreen Mapbox explorer.

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

“Explore prices” starts loading the map while blurring the landing page and fading its content to transparent over 1.1 seconds with ease-out timing. Once the map is ready and the landing transition finishes, the map fades in over 1.1 seconds with the same ease-out timing above the original gradient colors. The landing page is removed when the map is fully visible. There is no separate loading screen. Background motion pauses during the transition; visitors who prefer reduced motion skip the animations. Mapbox is loaded in a separate bundle after entering the explorer.

## Mapbox explorer

`src/components/PriceMap/PriceMap.tsx` owns the map, with styles in `src/components/PriceMap/PriceMap.css` and the original sample city data in `src/components/samplePlaces.ts`. Vite reads the existing `REACT_APP_MAPBOX_TOKEN` variable from `frontend/.env`:

```dotenv
REACT_APP_MAPBOX_TOKEN=your_public_mapbox_access_token
```

Restart the development server after changing `.env`. The token must be a public Mapbox browser token; it is included in the browser bundle. The `.env` file is ignored by Git.

The map starts over the contiguous US and includes clustered pins, city popups, sample city search, location tracking, zoom buttons, and a compass. Click the arrow-shaped location button to request location access. Location requires HTTPS or localhost and browser permission. The OpenChart wordmark returns to the landing page.

The pins are sample cities from the previous integration, not hospital records or procedure prices. Replace the sample data when hospital data becomes available.

The search UI lives in `src/components/MapSearch/`, with reusable dropdown and result-row components in `src/components/SearchDropdown/` and `src/components/SearchResult/`. The custom dropdown matches the field width and opens and closes over 200ms with ease-in-out timing. Select a city with the mouse or Arrow keys and Enter; Escape or clicking outside closes the panel. Location, Price, and Procedure filters are disabled placeholders for future functionality.

The background uses soft radial gradients on one gently moving layer, without blur or backdrop filters. The colors move together within a fixed viewport so they remain blended when zooming. Animation starts paused when the visitor prefers reduced motion, and the footer’s Play/Pause motion button lets visitors control it. DM Sans loads from Google Fonts, with local system-font fallbacks.
