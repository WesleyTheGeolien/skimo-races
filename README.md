# Skimo races

A small web app to browse ski-mountaineering races for the 2026–27 winter around Albertville. It has a Mapbox map, a month calendar and a list, plus filters.

It's a static site: the race data is bundled from `src/data/races.json`, with no backend.

## Quick start

```bash
npm install
cp .env.example .env      # add your Mapbox token
npm run dev
```

Open http://localhost:5173.

- **Map**: one dot per venue, coloured by the most important race there and sized by how many races it hosts. Click a dot to list its races.
- **Calendar**: a month grid. Races that last several days show on each of their days, and undated races are listed below the grid.
- **List**: a sortable list with distances from home.
- **Filters**: text search, distance from home (default: Mercury, editable), date range, level, format (individual / team / vertical / sprint / relay), night races only, and show weekly series once (the Millet Courchevel verticals). Filters are saved in the browser.

## Editing the data

`scripts/raw.tsv` is the source list, exported from the original spreadsheet. After editing it:

```bash
npm run data   # regenerates src/data/races.json
```

The script works out each race's level, format, night flag, country and end date from the text. Hand-checked values go in `OVERRIDES` in `scripts/build_data.py`.

## Notes

- Coordinates are town or village centres, not exact race starts. Distances are straight-line distances.
- The level labels (Coupe de France, Regional, Promo…) come from the ski-alpinisme.fr calendar codes.
- Stack: Vite, React 19, TypeScript and mapbox-gl v3. `npm run build` outputs a static site in `dist/` that you can host anywhere (GitHub Pages, Netlify…). The Mapbox token ends up in the public bundle, so restrict it to your site's URL in the Mapbox dashboard.
