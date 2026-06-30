---
name: maps-location-integrations
description: Use when integrating maps, geolocation services, address autocomplete, location-based features, or geographic data visualization. Triggers on requests like "add a map", "Google Maps", "Mapbox", "location picker", "address autocomplete", "geolocation", "nearby search", "store locator", or when any map or location functionality is needed.
---

# Maps and Location Integrations

## Goal
Integrate maps and location services with proper API key management and performance optimization.

## Do Not Use When
- No location features needed

## Required Inputs To Inspect
- Map provider (Google Maps, Mapbox, Leaflet)
- Features needed (display, search, routing, geocoding)
- API key management
- Mobile performance requirements

## Workflow

1. **Choose provider**: Google Maps (feature-rich), Mapbox (customizable), Leaflet (free, open)
2. **Get API key**: Restrict by domain and API
3. **Load SDK**: Async loading to avoid blocking
4. **Display map**: Initialize with center and zoom
5. **Add markers**: Points of interest
6. **Add interactions**: Click, drag, zoom
7. **Implement search**: Geocoding and places autocomplete
8. **Handle geolocation**: Get user location with permission
9. **Optimize**: Lazy load, cluster markers, limit re-renders

## Quality Checks
- [ ] Map loads without blocking page
- [ ] Markers display correctly
- [ ] Mobile performance acceptable
- [ ] Geolocation permission handled gracefully

## Safety Rules
- Restrict API keys by domain
- Don't expose unrestricted keys client-side
- Handle geolocation denial gracefully

## Coordinates With
- `third-party-api-integration` — for API setup
- `performance-audit-optimizer` — for map performance
