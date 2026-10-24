# Database

PostgreSQL schemas are separated by data-owning module: `identity`, `players`, `findings`, and `exploration`. GeoCatalog and Regulations reserve their module boundaries for later data imports.

All timestamps are UTC `timestamptz`. Spatial data uses EPSG:4326 and GiST indexes. EF Core migrations are the only regular schema-change mechanism.

For the first local bootstrap, Compose runs `infra/docker/001_initial_schema.sql` against a fresh database volume. The runtime DbContexts already use module-specific migration history tables. EF design-time migrations can be generated once the EF design package is available from NuGet.

