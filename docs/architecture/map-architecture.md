# Map architecture

`MapShell` owns map-page UI state. `MapCanvas` owns exactly one MapLibre instance and updates its GeoJSON source and layer visibility without recreating the map. `map-layers.ts` is the single registry for technical layer IDs and translated labels.

Regulation geometry is requested by viewport through `GET /api/v1/regulations/geojson`. The API filters by EPSG:4326 bounding box and publishes only verified rule and geometry records. Textual rules without geometry are returned by `GET /api/v1/regulations` and are not drawn.

The initial basemap is the official swisstopo vector style. MapLibre attribution remains visible. A future dark style transformation must preserve source, sprite, glyph and attribution definitions.

