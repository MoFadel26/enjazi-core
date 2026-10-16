# syntax=docker/dockerfile:1

# One image, one origin: ASP.NET Core serves the API, the SignalR hub and the
# built React app (ADR-0008). The two build stages run on the build machine's
# own architecture and only the output targets the image's, so building the
# linux/amd64 image on an arm64 Mac does not emulate the compilers.

FROM --platform=$BUILDPLATFORM node:22-slim AS web
WORKDIR /src/Enjazi.Web
COPY src/Enjazi.Web/package.json src/Enjazi.Web/package-lock.json ./
RUN npm ci
COPY src/Enjazi.Web/ ./
# Vite bakes VITE_ variables into the bundle at build time. The publishable
# key is public; the deploy workflow passes it from a repository variable.
ARG VITE_CLERK_PUBLISHABLE_KEY
RUN npm run build

FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS api
ARG TARGETARCH
WORKDIR /src
COPY src/Enjazi.Api/Enjazi.Api.csproj Enjazi.Api/
RUN dotnet restore Enjazi.Api/Enjazi.Api.csproj -a $TARGETARCH
COPY src/Enjazi.Api/ Enjazi.Api/
# The build normally regenerates openapi.json by starting the app; that file
# is committed and checked by scripts/verify-phase-3.sh, not built here.
RUN dotnet publish Enjazi.Api/Enjazi.Api.csproj -c Release -a $TARGETARCH --no-restore \
    -p:OpenApiGenerateDocuments=false -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=api /app ./
COPY --from=web /src/Enjazi.Web/dist ./wwwroot
ENV ASPNETCORE_HTTP_PORTS=8080 \
    Database__MigrateOnStartup=true
EXPOSE 8080
# The non-root user the .NET images ship with.
USER $APP_UID
ENTRYPOINT ["dotnet", "Enjazi.Api.dll"]
