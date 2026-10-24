# Geodata import pipeline

1. Download an official dataset and record its version, licence and source URL.
2. Parse the source in its native CRS and validate geometry types.
3. Transform geometry to EPSG:4326 for `geo.waterbodies` and GeoJSON delivery.
4. Import waterbody identifiers and geometry into GeoCatalog.
5. Link a regulation to an external identifier through an explicit import contract.
6. Publish a regulation zone only after the source rule, object type, scope and geometry have been reviewed.

The current MVP does not import nationwide waterbody or protected-area geometry. Candidate rules remain textual and are never rendered as inferred polygons.

