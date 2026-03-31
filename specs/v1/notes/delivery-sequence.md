# Delivery Sequence

## Recommended Implementation Order
1. Foundation and project setup
2. Database schema, migrations, and invariants
3. Authentication and admin access
4. Runtime settings and configuration
5. Core master data: spaces and tenants
6. Contracts: draft, posting, and immutability
7. Financial model and ledger implementation
8. Contract posting atomic workflow
9. Public tenant access (no login)
10. Dashboard and admin operational views
11. Dates, timezone, and data semantics
12. Testing and business rule validation
13. Deployment readiness and initialization

## Why This Order Works
- Foundational infrastructure and schema work must come first.
- Authentication is needed before admin features are usable.
- Contracts depend on spaces, tenants, and schema constraints.
- Financial logic depends on contracts being stable.
- Public tenant access depends on posted contracts and generated public codes.
- Testing and deployment hardening are most effective once the core domain is complete.
