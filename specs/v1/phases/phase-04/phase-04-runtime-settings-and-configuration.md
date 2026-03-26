# Phase 4 — Runtime Settings & Configuration

## Goal
Implement the generic key-value settings model for runtime policy control.

## Objectives
- Store runtime settings in the database.
- Load and cache settings on startup.
- Make settings available to services and query logic.

## Tasks
### Settings Storage
- Build the settings table.
- Define a seed list of default settings.
- Include policy flags such as `tenant.hide_expired`.

### Startup Loading and Caching
- Load settings during application startup.
- Cache settings in memory.
- Define refresh strategy if settings become editable later.

### Settings Access Layer
- Create service helpers for settings lookup.
- Use settings in visibility and policy decisions.
- Avoid hardcoding policy behavior that the spec expects to remain configurable.

## Deliverables
- Settings service
- Startup settings cache
- Default policy seeds

## Exit Criteria
- Runtime policies are loaded from the database.
- Business logic can reference settings without schema changes.
