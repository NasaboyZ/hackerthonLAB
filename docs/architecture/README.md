# Architecture

Magnetrail is a modular monolith: one API deployment, one PostgreSQL database, explicit module boundaries, and no message broker.

Modules communicate through public contracts and application services. A module must not access another module's internal classes, `DbContext`, or tables directly.

The backend uses vertical slices inside each module. Domain code stays independent of ASP.NET Core, EF Core, and PostgreSQL.

