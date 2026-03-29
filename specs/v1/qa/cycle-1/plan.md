# SIT/UAT Test Cases — Kasero

## Context

Kasero is a property/space rental management system. This document defines System Integration Testing (SIT) and User Acceptance Testing (UAT) test cases written from the perspective of end users — no code knowledge assumed.

**Users involved:**
- **Admin** — logs in with credentials; manages spaces, tenants, contracts, payments
- **Tenant** — no login; accesses their own status page via a unique link/code

**Modules covered:**
1. Authentication
2. Dashboard
3. Spaces Management
4. Tenants Management
5. Contracts Management
6. Ledger & Payments
7. Tenant Status (Public View)

---

## **IMPORTANT** **MUST** follow test strategy
- All generated test artifacts should be save in the same directory:
    @[specs/v1/qa/cycle-1/](./)
- Before all the test starts, spin up the instance:
```
docker compose up -d --build
```
- Tests will be done in iteration so it MUST be noted to skip tests that are tagged as PASS, FAIL, or BLOCKED already
- Only 1 test should be done per iteration
- Try to run through all the tests by using the UI
- Mark the test as BLOCKED if it is; add notes for helpful information
- When a test is successful, mark it as PASS
- When a test fails, Don't investigate nor fix the issue. 
    - Document it in the Notes section in the summary: 
        "Findings: <findings>; How to replicate: <how-to-replicate>; Expected: <expected>; Actual: <actual>"
    - Mark test as FAIL

---

## Test Execution Summary Template

| Test Case ID | Description | Tester | Date | Result (Pass/Fail/Blocked) | Notes |
|---|---|---|---|---|---|
| TC-AUTH-001 | Admin login happy path | Claude | 2026-03-29 | PASS | |
| TC-AUTH-002 | Login wrong password | Claude | 2026-03-29 | PASS | |
| TC-AUTH-003 | Login empty fields | Claude | 2026-03-29 | PASS | |
| TC-AUTH-004 | Access protected page without login | Claude | 2026-03-29 | PASS | |
| TC-AUTH-005 | Admin logout | Claude | 2026-03-29 | PASS | |
| TC-DASH-001 | Dashboard space summary | Claude | 2026-03-29 | PASS | |
| TC-DASH-002 | Overdue status | Claude | 2026-03-29 | BLOCKED | Precondition not met: no space with a posted overdue contract exists in current DB state |
| TC-DASH-003 | Vacant status | Claude | 2026-03-29 | PASS | |
| TC-SPACE-001 | Create space | Claude | 2026-03-29 | PASS | |
| TC-SPACE-002 | Create space missing fields | Claude | 2026-03-29 | PASS | |
| TC-SPACE-003 | View space details | Claude | 2026-03-29 | FAIL | Findings: Strict mode violation — `getByText(/contracts/i)` matched 3 elements (nav link, section heading "Contracts", "No contracts for this space."); How to replicate: navigate to /admin/spaces, click first space link, assert Contracts section; Expected: single "Contracts" section heading visible; Actual: assertion failed due to ambiguous locator matching 3 elements |
| TC-SPACE-004 | Edit space | Claude | 2026-03-29 | PASS | |
| TC-SPACE-005 | Soft-delete space | Claude | 2026-03-29 | PASS | |
| TC-SPACE-006 | Deleted space rejects contracts | Claude | 2026-03-29 | BLOCKED | Precondition not met: no contract creation UI with space selector exists — cannot verify deleted space exclusion from selection |
| TC-TENANT-001 | Create tenant | Claude | 2026-03-29 | PASS | |
| TC-TENANT-002 | Create tenant missing fields | Claude | 2026-03-29 | PASS | |
| TC-TENANT-003 | View tenant details | Claude | 2026-03-29 | PASS | |
| TC-TENANT-004 | Edit tenant | Claude | 2026-03-29 | PASS | |
| TC-TENANT-005 | Tenant cannot be deleted | Claude | 2026-03-29 | PASS | |
| TC-TENANT-006 | Tenant active on contract start | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contract with start date ≤ today exists; contract creation UI not yet implemented |
| TC-TENANT-007 | Tenant inactive after contract ends | Claude | 2026-03-29 | BLOCKED | Precondition not met: no expired contract exists in current DB state; contract creation UI not yet implemented |
| TC-CONTRACT-001 | Create draft contract | Claude | 2026-03-29 | BLOCKED | Precondition not met: no contract creation UI exists — Add Contract button not present in /admin/contracts |
| TC-CONTRACT-002 | Edit draft contract | Claude | 2026-03-29 | BLOCKED | Precondition not met: no draft contracts in DB and no contract creation UI implemented |
| TC-CONTRACT-003 | Post contract | Claude | 2026-03-29 | BLOCKED | Precondition not met: no draft contracts exist; no Post Contract button in contract detail page |
| TC-CONTRACT-004 | Posted contract fields locked | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contracts in DB; contract creation/posting UI not yet implemented |
| TC-CONTRACT-005 | No two active contracts per space | Claude | 2026-03-29 | BLOCKED | Precondition not met: contract creation UI not yet implemented; cannot verify duplicate contract prevention |
| TC-CONTRACT-006 | Payables generated on post | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contracts exist; contract creation/posting UI not yet implemented |
| TC-CONTRACT-007 | Advance payment in ledger | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contracts with advance payment; contract creation UI not yet implemented |
| TC-CONTRACT-008 | Deposit in fund (not amount due) | Claude | 2026-03-29 | BLOCKED | Precondition not met: no posted contracts with deposit; contract creation UI not yet implemented |
| TC-LEDGER-001 | View ledger | | | | |
| TC-LEDGER-002 | Amount due calculated correctly | | | | |
| TC-PAYMENT-001 | Record payment | | | | |
| TC-PAYMENT-002 | Record payment missing fields | | | | |
| TC-PAYMENT-003 | Void payment | | | | |
| TC-PAYMENT-004 | Cannot re-void a voided payment | | | | |
| TC-PUBLIC-001 | Tenant views public status | | | | |
| TC-PUBLIC-002 | Invalid public link | | | | |
| TC-PUBLIC-003 | No internal IDs exposed publicly | | | | |
| TC-PUBLIC-004 | Tenant self-entry flow | | | | |
| TC-INTEGRITY-001 | Timezone consistency | | | | |
| TC-INTEGRITY-002 | Billing period alignment | | | | |
| TC-INTEGRITY-003 | App loads without errors | | | | |
 
--- 

## Test Case Conventions

| Field | Description |
|-------|-------------|
| **ID** | Unique test case identifier |
| **Priority** | P1 = Critical, P2 = High, P3 = Medium |
| **Preconditions** | State required before executing the test |
| **Steps** | What the user does |
| **Expected Result** | What the user should see / experience |

---

## 1. Authentication

### TC-AUTH-001 — Admin Login (Happy Path)
**Priority:** P1

**Preconditions:** Admin credentials have been set up.

**Steps:**
1. Navigate to the admin login page.
2. Enter valid username and password.
3. Click **Login**.

**Expected Result:** Admin is redirected to the Dashboard. No error messages are shown.

---

### TC-AUTH-002 — Admin Login with Wrong Password
**Priority:** P1

**Preconditions:** Admin is on the login page.

**Steps:**
1. Enter a valid username but an incorrect password.
2. Click **Login**.

**Expected Result:** An error message is displayed (e.g., "Invalid credentials"). The admin stays on the login page.

---

### TC-AUTH-003 — Admin Login with Empty Fields
**Priority:** P2

**Preconditions:** Admin is on the login page.

**Steps:**
1. Leave both username and password fields empty.
2. Click **Login**.

**Expected Result:** Form validation prevents submission. Error indicators appear on the empty fields.

---

### TC-AUTH-004 — Accessing Protected Page Without Login
**Priority:** P1

**Preconditions:** User is not logged in.

**Steps:**
1. Directly navigate to a protected admin page (e.g., the Spaces list page).

**Expected Result:** User is redirected to the login page. The protected content is not shown.

---

### TC-AUTH-005 — Admin Logout
**Priority:** P2

**Preconditions:** Admin is logged in.

**Steps:**
1. Click the **Logout** button or link.

**Expected Result:** Admin is redirected to the login page. Navigating back to a protected page requires re-authentication.

---

## 2. Dashboard

### TC-DASH-001 — Dashboard Loads with Correct Space Summary
**Priority:** P1

**Preconditions:** Admin is logged in. At least one space exists.

**Steps:**
1. Navigate to the Dashboard.

**Expected Result:** A list/grid of spaces is shown. Each space displays its status: **Vacant**, **Occupied**, **Nearing** (payment due soon), or **Overdue** (unpaid balance). Spaces are sorted: Overdue first, then Nearing, then Occupied, then Vacant.

---

### TC-DASH-002 — Overdue Status Displayed Correctly
**Priority:** P1

**Preconditions:** A space has a posted contract with an unpaid balance past its due date.

**Steps:**
1. Navigate to the Dashboard.

**Expected Result:** That space is marked **Overdue** and appears at the top of the list.

---

### TC-DASH-003 — Vacant Space Displayed on Dashboard
**Priority:** P2

**Preconditions:** A space exists with no active/posted contract.

**Steps:**
1. Navigate to the Dashboard.

**Expected Result:** That space appears as **Vacant** at the bottom of the list.

---

## 3. Spaces Management

### TC-SPACE-001 — Create a New Space
**Priority:** P1

**Preconditions:** Admin is logged in.

**Steps:**
1. Navigate to the **Spaces** section.
2. Click **Add Space** (or equivalent button).
3. Fill in all required fields (e.g., space name/number).
4. Click **Save**.

**Expected Result:** The new space appears in the spaces list. A success confirmation is shown.

---

### TC-SPACE-002 — Create Space with Missing Required Fields
**Priority:** P2

**Preconditions:** Admin is on the Create Space form.

**Steps:**
1. Leave one or more required fields empty.
2. Click **Save**.

**Expected Result:** Form validation blocks submission. Error messages indicate which fields are required.

---

### TC-SPACE-003 — View Space Details
**Priority:** P2

**Preconditions:** At least one space exists.

**Steps:**
1. Navigate to the **Spaces** list.
2. Click on a space to open its detail view.

**Expected Result:** The space detail page shows all space information and any associated contracts.

---

### TC-SPACE-004 — Edit an Existing Space
**Priority:** P2

**Preconditions:** At least one space exists.

**Steps:**
1. Open the detail/edit view for a space.
2. Modify a field (e.g., space name).
3. Click **Save**.

**Expected Result:** The change is reflected in the space list and detail view. A success message is shown.

---

### TC-SPACE-005 — Delete (Soft-Delete) a Space
**Priority:** P1

**Preconditions:** A space exists with no active posted contract.

**Steps:**
1. Navigate to the space.
2. Click **Delete** (or equivalent action).
3. Confirm the deletion if prompted.

**Expected Result:** The space no longer appears in the active spaces list. No data is permanently lost (soft delete).

---

### TC-SPACE-006 — Deleted Space Does Not Accept New Contracts
**Priority:** P1

**Preconditions:** A space has been soft-deleted.

**Steps:**
1. Attempt to create a new contract and assign it to the deleted space.

**Expected Result:** The deleted space is not available for selection. The action is blocked.

---

## 4. Tenants Management

### TC-TENANT-001 — Create a New Tenant
**Priority:** P1

**Preconditions:** Admin is logged in.

**Steps:**
1. Navigate to the **Tenants** section.
2. Click **Add Tenant**.
3. Fill in all required fields (first name, last name, contact info, etc.).
4. Click **Save**.

**Expected Result:** The new tenant appears in the tenants list with **Inactive** status. A success message is shown.

---

### TC-TENANT-002 — Create Tenant with Missing Required Fields
**Priority:** P2

**Preconditions:** Admin is on the Create Tenant form.

**Steps:**
1. Leave one or more required fields empty.
2. Click **Save**.

**Expected Result:** Form validation blocks submission. Error messages indicate the required fields.

---

### TC-TENANT-003 — View Tenant Details
**Priority:** P2

**Preconditions:** At least one tenant exists.

**Steps:**
1. Navigate to the **Tenants** list.
2. Click on a tenant to open their detail view.

**Expected Result:** The tenant's detail page shows personal information, status (Active/Inactive), and any associated contracts.

---

### TC-TENANT-004 — Edit Tenant Information
**Priority:** P2

**Preconditions:** At least one tenant exists.

**Steps:**
1. Open the edit view for a tenant.
2. Modify a field (e.g., phone number).
3. Click **Save**.

**Expected Result:** The change is reflected immediately on the tenant's detail page. A success message is shown.

---

### TC-TENANT-005 — Tenant Cannot Be Deleted
**Priority:** P1

**Preconditions:** A tenant exists.

**Steps:**
1. Navigate to the tenant's detail or list view.
2. Look for a **Delete** button.

**Expected Result:** No delete option is available for tenants. Tenants can only be deactivated through contract lifecycle, not manually deleted.

---

### TC-TENANT-006 — Tenant Status Changes to Active on Contract Start
**Priority:** P1

**Preconditions:** A tenant has a posted contract with a start date of today or earlier.

**Steps:**
1. Navigate to the tenant's detail page.

**Expected Result:** The tenant's status shows **Active**.

---

### TC-TENANT-007 — Tenant Status Reverts to Inactive After Contract Ends
**Priority:** P1

**Preconditions:** A tenant had an active contract that has now expired/ended.

**Steps:**
1. Navigate to the tenant's detail page after the contract end date has passed.

**Expected Result:** The tenant's status shows **Inactive**.

---

## 5. Contracts Management

### TC-CONTRACT-001 — Create a Draft Contract
**Priority:** P1

**Preconditions:** At least one tenant and one available (vacant) space exist.

**Steps:**
1. Navigate to the **Contracts** section.
2. Click **Add Contract**.
3. Select a tenant and a space.
4. Fill in contract details: start date, end date, rent amount, billing frequency, due date rule.
5. Enter deposit amount and advance payment amount.
6. Click **Save**.

**Expected Result:** A new contract is created in **Draft** status. It appears in the contracts list.

---

### TC-CONTRACT-002 — Edit a Draft Contract
**Priority:** P2

**Preconditions:** A contract in **Draft** status exists.

**Steps:**
1. Open the draft contract.
2. Modify one or more fields (e.g., rent amount).
3. Click **Save**.

**Expected Result:** The changes are saved. The contract remains in **Draft** status.

---

### TC-CONTRACT-003 — Post a Contract (Finalize)
**Priority:** P1

**Preconditions:** A contract in **Draft** status exists with all required fields filled.

**Steps:**
1. Open the draft contract.
2. Click **Post Contract** (or equivalent).
3. Confirm the action if prompted.

**Expected Result:**
- The contract status changes to **Posted**.
- The space becomes **Occupied**.
- The tenant status becomes **Active** (if start date is today or past).
- A public access link/code is generated for the tenant.
- Edit options for core fields are no longer available.

---

### TC-CONTRACT-004 — Posted Contract Cannot Be Edited
**Priority:** P1

**Preconditions:** A contract in **Posted** status exists.

**Steps:**
1. Open the posted contract.
2. Attempt to modify core fields (start date, end date, rent amount, billing frequency, due date rule).

**Expected Result:** Fields are locked/read-only. No save option exists for those fields. An error or warning is shown if attempted.

---

### TC-CONTRACT-005 — Cannot Create Two Active Contracts for the Same Space
**Priority:** P1

**Preconditions:** A space already has a **Posted** contract.

**Steps:**
1. Attempt to create a new contract and assign it to the same space.
2. Try to post the new contract.

**Expected Result:** The system blocks the action. An error message indicates the space already has an active contract.

---

### TC-CONTRACT-006 — Contract Generates Payables on Posting
**Priority:** P1

**Preconditions:** A draft contract has been posted.

**Steps:**
1. Navigate to the contract's **Ledger** view.

**Expected Result:** A list of payables is shown for every billing period from the contract start date to the end date. Amounts and due dates match the contract terms.

---

### TC-CONTRACT-007 — Advance Payment Reflected in Ledger
**Priority:** P1

**Preconditions:** A contract was posted with an advance payment specified.

**Steps:**
1. Navigate to the contract's **Ledger** view.
2. Look at the **Payments** section.

**Expected Result:** The advance payment is listed as a payment entry. The amount due reflects this deduction.

---

### TC-CONTRACT-008 — Deposit Reflected in Fund (Not in Amount Due)
**Priority:** P1

**Preconditions:** A contract was posted with a deposit amount specified.

**Steps:**
1. Navigate to the contract's **Ledger** view.
2. Look at the **Fund** section.

**Expected Result:** The deposit appears in the **Fund** section. It does NOT reduce the **Amount Due** in the payables/payments ledger.

---

## 6. Ledger & Payments

### TC-LEDGER-001 — View Contract Ledger
**Priority:** P1

**Preconditions:** A posted contract exists.

**Steps:**
1. Open the posted contract.
2. Navigate to the **Ledger** section.

**Expected Result:** Three sections are visible: **Payables** (what is owed per period), **Payments** (money received), and **Fund** (deposits/overpayments). A current **Amount Due** is shown.

---

### TC-LEDGER-002 — Amount Due Calculated Correctly
**Priority:** P1

**Preconditions:** A posted contract with some payables and payments exists.

**Steps:**
1. Open the contract's Ledger.
2. Review the **Amount Due** figure.

**Expected Result:** Amount Due = sum of all payables with a due date on or before today − sum of all non-voided payments. The result is never negative.

---

### TC-PAYMENT-001 — Record a Payment
**Priority:** P1

**Preconditions:** A posted contract with an outstanding balance exists.

**Steps:**
1. Navigate to the contract's Ledger.
2. Click **Record Payment**.
3. Enter the payment amount and date.
4. Click **Save**.

**Expected Result:** The payment appears in the **Payments** list. The **Amount Due** decreases accordingly.

---

### TC-PAYMENT-002 — Record Payment with Missing Fields
**Priority:** P2

**Preconditions:** Admin is on the Record Payment form.

**Steps:**
1. Leave the amount or date field empty.
2. Click **Save**.

**Expected Result:** Form validation blocks submission. Error messages are displayed.

---

### TC-PAYMENT-003 — Void a Payment
**Priority:** P1

**Preconditions:** A payment has been recorded on a contract.

**Steps:**
1. Navigate to the contract's Ledger.
2. Find the payment in the **Payments** list.
3. Click **Void** on the payment.
4. Confirm the action if prompted.

**Expected Result:** The payment is marked as **Voided** in the payments list. The **Amount Due** increases by the voided amount. The void action is recorded (an audit entry exists).

---

### TC-PAYMENT-004 — Voided Payment Cannot Be Voided Again
**Priority:** P2

**Preconditions:** A payment has already been voided.

**Steps:**
1. Navigate to the contract's Ledger.
2. Find the voided payment.
3. Attempt to void it again.

**Expected Result:** The **Void** option is not available (or is disabled) for already-voided payments.

---

## 7. Tenant Status — Public View

### TC-PUBLIC-001 — Tenant Views Status via Public Link
**Priority:** P1

**Preconditions:** A contract has been posted. A public access link/code has been generated for the tenant.

**Steps:**
1. Open the public access link (provided by admin to the tenant) in a browser — **without logging in**.

**Expected Result:** The tenant's status page loads showing their contract details, current amount due, and payment history. No login is required.

---

### TC-PUBLIC-002 — Invalid or Tampered Public Link Returns Error
**Priority:** P1

**Preconditions:** User has a guessed or invalid public access code.

**Steps:**
1. Navigate to the public status URL with a random/incorrect code.

**Expected Result:** An error page is shown (e.g., "Not found" or "Invalid link"). No contract data is exposed.

---

### TC-PUBLIC-003 — Public Page Does Not Expose Internal IDs
**Priority:** P1

**Preconditions:** Tenant is viewing their public status page.

**Steps:**
1. Review the URL and all visible content on the public status page.

**Expected Result:** No internal database IDs (contract ID, tenant ID, etc.) are visible in the URL or on the page. Only the public access code is used in the URL.

---

### TC-PUBLIC-004 — Tenant Self-Entry Flow
**Priority:** P2

**Preconditions:** A tenant entry link has been issued.

**Steps:**
1. Open the tenant entry link in a browser.
2. Complete the self-entry form with required information.
3. Submit the form.

**Expected Result:** The form is submitted successfully. The link becomes invalid (single-use). If the same link is accessed again, a "link already used" error is shown.

---

## 8. Edge Cases & System Integrity

### TC-INTEGRITY-001 — System Timezone Consistency
**Priority:** P2

**Preconditions:** Admin is logged in.

**Steps:**
1. Create a contract with today's date as the start date.
2. Review the displayed dates throughout the system (contract list, ledger, dashboard).

**Expected Result:** All dates are displayed consistently in Philippine time (Asia/Manila). No timezone offset issues appear.

---

### TC-INTEGRITY-002 — Billing Periods Aligned to Contract Terms
**Priority:** P2

**Preconditions:** A contract is posted with monthly billing.

**Steps:**
1. Navigate to the contract's Ledger.
2. Review all generated payables.

**Expected Result:** Each payable corresponds to exactly one billing period. Months with 28/29/30/31 days are handled correctly (no skip or overlap). End-of-month dates do not overflow into the next month.

---

### TC-INTEGRITY-003 — App is Accessible and Loads Without Errors
**Priority:** P1

**Preconditions:** The application is deployed and running.

**Steps:**
1. Open the application URL in a browser.
2. Navigate through major sections: Dashboard, Spaces, Tenants, Contracts.

**Expected Result:** All pages load without visible errors, broken layouts, or console-level crashes. Navigation links function correctly.
