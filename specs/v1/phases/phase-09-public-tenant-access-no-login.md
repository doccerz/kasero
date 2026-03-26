# Phase 9 — Public Tenant Access (No Login)

## Goal
Provide read-only tenant-facing access without login, mediated by the frontend.

## Objectives
- Support one-time tenant self-entry through a public link or QR code.
- Support a read-only public tenant status page.
- Protect public access with unique, non-guessable, revocable codes.

## Tasks
### Tenant Self-Entry
- Build the one-time public link or QR flow.
- Capture tenant personal details.
- Require privacy consent.
- Expire the link after successful submission or when data is already filled.

### Public Status View
- Build direct URL access by public code.
- Build homepage code-entry flow.
- Display read-only status information including:
  - amount due
  - charge breakdown
  - due date

### Public Access Validation
- Resolve the contract by public code.
- Validate the contract is active and valid for public viewing.
- Ensure backend access remains frontend-mediated.
- Support code revocation behavior.

## Deliverables
- Tenant self-entry page
- Public financial status page
- Public-code validation logic

## Exit Criteria
- Tenants can access permitted read-only information without login.
- Public codes are random, unique, revocable, and non-guessable.
