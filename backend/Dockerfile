# Portfolio API: ASP.NET Core 8 + MongoDB. Build context: this backend/ folder.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY Directory.Build.props ./
COPY src/ src/
RUN dotnet publish src/Dhucar.Portfolio.Api/Dhucar.Portfolio.Api.csproj -c Release -o /app /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app ./
COPY seed/content.json seed/content.json
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_CLI_TELEMETRY_OPTOUT=1
# Run as the image's built-in non-root user.
USER app
EXPOSE 8080
ENTRYPOINT ["dotnet", "Dhucar.Portfolio.Api.dll"]
