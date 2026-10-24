FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/Directory.Build.props backend/Directory.Packages.props backend/Magnetrail.slnx backend/GlobalUsings.cs ./backend/
COPY backend/src ./backend/src
RUN dotnet restore backend/src/Magnetrail.Api/Magnetrail.Api.csproj
RUN dotnet publish backend/src/Magnetrail.Api/Magnetrail.Api.csproj -c Release --no-restore -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
COPY --from=build /app/publish .
COPY infra/docker/001_initial_schema.sql /app/schema/001_initial_schema.sql

ENTRYPOINT ["sh", "-c", "exec dotnet Magnetrail.Api.dll --urls http://0.0.0.0:${PORT:-8080}"]
