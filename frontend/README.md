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

The build command checks TypeScript and creates the static production site in `dist/`.
The map requires the [Spring Boot backend](../backend/README.md) and local MySQL.
Run `mvn spring-boot:run` from `backend/`, then start Vite in a second terminal.
No AWS credentials are needed. Procedure search is not implemented yet.

Vite proxies `/api` to `http://127.0.0.1:8080`. If the backend uses another port,
set `API_PROXY_TARGET` in `frontend/.env` and restart Vite. This variable stays in
Vite's server configuration; database credentials belong only in `backend/.env`.
For production hosting, configure the web server to forward `/api` to Spring Boot.
`npm run preview` serves a static build and is not the API development proxy.

“Explore prices” starts loading the map while blurring the landing page and fading its content to transparent over 0.45 seconds with ease-out timing. Once the map is ready and the landing transition finishes, the map fades in over 0.45 seconds with the same ease-out timing above the original gradient colors. The landing page is removed when the map is fully visible. There is no separate loading screen. Background motion pauses during the transition; visitors who prefer reduced motion skip the animations. Mapbox is loaded in a separate bundle after entering the explorer.

## Mapbox explorer

`src/components/PriceMap/PriceMap.tsx` owns the map, with styles in
`src/components/PriceMap/PriceMap.css`. `src/api/hospitals.ts` loads real hospital
records from `GET /api/hospitals`. Vite reads the existing `REACT_APP_MAPBOX_TOKEN`
variable from `frontend/.env`:

```dotenv
REACT_APP_MAPBOX_TOKEN=your_public_mapbox_access_token
```

Restart the development server after changing `.env`. The token must be a public Mapbox browser token; it is included in the browser bundle. The `.env` file is ignored by Git.

The map starts over the contiguous US and allows navigation to Alaska, Hawaii and
territories. It includes individual hospital markers, hospital search, state filtering,
location tracking, zoom buttons and a compass. Click the arrow-shaped location
button to request location access. Location requires HTTPS or localhost and browser
permission. The OpenChart wordmark returns to the landing page.

Markers use each hospital's actual database latitude and longitude. Mapbox's native
GeoJSON clustering groups nearby hospitals with `cluster: true`,
`clusterRadius: 50`, and `clusterMaxZoom: 14`. Native clustering has no hard maximum
hospital count per cluster. Click a cluster to zoom to its native expansion level.
At zoom level 15 and above, hospitals appear individually and may overlap.
Visible locations use purple 32-by-32-pixel circular count buttons, including `1`
for individual hospitals. They use Mapbox's normal HTML Marker rendering above the
map canvas, so roads and map labels cannot cover them. Clustering stays native to
Mapbox; the circle styling does not change its grouping algorithm. Names remain
available in tooltips and hospital cards. Only markers inside or near
the viewport are created; updates are scheduled after camera/source changes rather
than on every frame. IDs distinguish
records with identical names. Clicking a marker or choosing a search result opens
a card with the hospital's name, address, a labeled placeholder image, and a globe
link to its website when available. Missing websites display “Website unavailable”.
Only HTTP(S) website links are enabled. No fictional prices are attached to these
records. Close a card using its button, Escape, or a map click. Changing the state
filter closes it. Refresh reloads current database rows; failures offer Retry.

`src/components/PriceMap/HospitalCard.tsx` renders the card into a Mapbox popup
through a React portal. The existing illustrative exterior at
`src/components/PriceMap/assets/sample-hospital.jpg` is reused as a placeholder;
it is not a photograph of the named hospital.

The search UI lives in `src/components/MapSearch/`, with reusable dropdown and
result-row components in `src/components/SearchDropdown/` and
`src/components/SearchResult/`. Search matches hospital names, addresses, cities,
states and ZIP codes, showing up to 50 matches. Select with the mouse or Arrow keys
and Enter; Escape or clicking outside closes the panel. The State filter accepts
full state names from MySQL and limits both results and markers. State polygons
receive a purple tint where a boundary is available. Choose All to clear the filter
and return to the national overview. Price and Procedure filters remain disabled.

State highlights use the [US state boundary GeoJSON](https://docs.mapbox.com/mapbox-gl-js/assets/us_states.geojson) from [Mapbox's state polygon example](https://docs.mapbox.com/mapbox-gl-js/example/hover-styles/), bundled in `src/components/PriceMap/usStates.json` to avoid a separate runtime download. `stateBoundaries.ts` matches the state codes used by the filter to the dataset's full state names.

The background uses soft radial gradients on one gently moving layer, without blur or backdrop filters. The colors move together within a fixed viewport so they remain blended when zooming. Animation starts paused when the visitor prefers reduced motion, and the footer’s Play/Pause motion button lets visitors control it. DM Sans loads from Google Fonts, with local system-font fallbacks.
