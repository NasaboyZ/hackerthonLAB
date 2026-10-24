# Regulation data model

The `regulations` schema contains `rules`, `sources`, and `zones`. Rules carry the legal classification and verification state. Sources are separate rows so a rule can cite multiple authorities. Zones carry only geometry with a source and geometry-verification status.

`PROHIBITED`, `RESTRICTED`, `UNKNOWN`, and `INFORMATION_ONLY` are distinct values. Missing geometry never becomes an `allowed` result. The current bootstrap contains verified Basel-Stadt, Zürich and Thurgau textual records and no regulation zones.

The local bootstrap is idempotent in `infra/docker/001_initial_schema.sql`. Runtime DbContexts use the `regulations` schema and a module-specific EF migration history table; generated EF migrations should be added when the EF design package is available in the environment.

