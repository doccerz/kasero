import http from 'http';
import type { AddressInfo } from 'net';

// Fixture data served by the mock API server on port 3099
const FIXTURES: Record<string, object | object[]> = {
    '/admin/dashboard': [
        {
            id: 'space-1',
            name: 'Unit 1A',
            description: 'Ground floor corner unit',
            occupancyStatus: 'overdue',
            tenantId: 'tenant-1',
            tenantName: 'Maria Santos',
            contractId: 'contract-1',
            amountDue: '12000.00',
            nextDueDate: '2026-03-01',
        },
        {
            id: 'space-2',
            name: 'Unit 2B',
            description: 'Second floor unit',
            occupancyStatus: 'nearing',
            tenantId: 'tenant-2',
            tenantName: 'Jose Rizal',
            contractId: 'contract-2',
            amountDue: '8000.00',
            nextDueDate: '2026-04-01',
        },
        {
            id: 'space-3',
            name: 'Unit 3C',
            description: 'Third floor unit',
            occupancyStatus: 'occupied',
            tenantId: 'tenant-3',
            tenantName: 'Andres Bonifacio',
            contractId: 'contract-3',
            amountDue: '0.00',
            nextDueDate: '2026-05-01',
        },
        {
            id: 'space-4',
            name: 'Unit 4D',
            occupancyStatus: 'vacant',
        },
    ],
    // Fixture for TC-DASH-004: All spaces overdue
    '/admin/dashboard-all-overdue': [
        {
            id: 'space-overdue-1',
            name: 'Unit A',
            description: 'All overdue unit 1',
            occupancyStatus: 'overdue',
            tenantId: 'tenant-1',
            tenantName: 'Maria Santos',
            contractId: 'contract-1',
            amountDue: '2000.00',
            nextDueDate: '2026-03-01',
        },
        {
            id: 'space-overdue-2',
            name: 'Unit B',
            description: 'All overdue unit 2',
            occupancyStatus: 'overdue',
            tenantId: 'tenant-2',
            tenantName: 'Jose Rizal',
            contractId: 'contract-2',
            amountDue: '1500.00',
            nextDueDate: '2026-03-01',
        },
        {
            id: 'space-overdue-3',
            name: 'Unit C',
            description: 'All overdue unit 3',
            occupancyStatus: 'overdue',
            tenantId: 'tenant-3',
            tenantName: 'Andres Bonifacio',
            contractId: 'contract-3',
            amountDue: '3000.00',
            nextDueDate: '2026-03-01',
        },
        {
            id: 'space-overdue-4',
            name: 'Unit D',
            description: 'All overdue unit 4',
            occupancyStatus: 'overdue',
            tenantId: 'tenant-4',
            tenantName: 'Juan Luna',
            contractId: 'contract-4',
            amountDue: '2500.00',
            nextDueDate: '2026-03-01',
        },
    ],
    // Fixture for TC-DASH-007: Large dataset (55 spaces)
    '/admin/dashboard-large': Array.from({ length: 55 }, (_, i) => ({
        id: `space-bulk-${i + 1}`,
        name: `Unit ${i + 1}`,
        description: `Bulk test unit ${i + 1}`,
        occupancyStatus: i % 4 === 0 ? 'overdue' : i % 4 === 1 ? 'nearing' : i % 4 === 2 ? 'occupied' : 'vacant',
        tenantId: i % 4 === 3 ? undefined : `tenant-${i + 1}`,
        tenantName: i % 4 === 3 ? undefined : `Tenant ${i + 1}`,
        contractId: i % 4 === 3 ? undefined : `contract-${i + 1}`,
        amountDue: i % 4 === 0 ? '1000.00' : '0.00',
        nextDueDate: '2026-04-15',
    })),
    '/admin/spaces': [
        { id: 'space-1', name: 'Unit 1A', description: 'Ground floor corner unit' },
        { id: 'space-2', name: 'Unit 2B', description: 'Second floor unit' },
        { id: 'space-3', name: 'Unit 3C', description: 'Third floor unit' },
        { id: 'space-4', name: 'Unit 4D' },
    ],
    '/admin/spaces/space-1': {
        id: 'space-1',
        name: 'Unit 1A',
        description: 'Ground floor corner unit',
    },
    '/admin/spaces/space-empty': {
        id: 'space-empty',
        name: 'Empty Unit',
    },
    '/admin/tenants': [
        {
            id: 'tenant-1',
            firstName: 'Maria',
            lastName: 'Santos',
            status: 'active',
            contactInfo: { email: 'maria@example.com', phone: '+63 912 000 0001' },
        },
        {
            id: 'tenant-2',
            firstName: 'Jose',
            lastName: 'Rizal',
            status: 'active',
            contactInfo: { email: 'jose@example.com', phone: '+63 912 000 0002' },
        },
    ],
    '/admin/tenants/tenant-1': {
        id: 'tenant-1',
        firstName: 'Maria',
        lastName: 'Santos',
        status: 'active',
        contactInfo: { email: 'maria@example.com', phone: '+63 912 000 0001' },
    },
    '/admin/contracts': [
        {
            id: 'contract-1',
            spaceId: 'space-1',
            tenantId: 'tenant-1',
            tenantName: 'Maria Santos',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            rentAmount: '8000.00',
            status: 'posted',
        },
        {
            id: 'contract-2',
            spaceId: 'space-2',
            tenantId: 'tenant-2',
            tenantName: 'Jose Rizal',
            startDate: '2025-03-01',
            endDate: '2026-02-28',
            rentAmount: '6000.00',
            status: 'draft',
        },
        {
            id: 'contract-3',
            spaceId: 'space-1',
            tenantId: 'tenant-2',
            tenantName: 'Jose Rizal',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            rentAmount: '7000.00',
            status: 'draft',
        },
        {
            id: 'contract-4',
            spaceId: 'space-1',
            tenantId: 'tenant-1',
            tenantName: 'Maria Santos',
            startDate: '2023-01-01',
            endDate: '2023-12-31',
            rentAmount: '6000.00',
            status: 'voided',
        },
    ],
    '/admin/contracts/contract-2': {
        id: 'contract-2',
        spaceId: 'space-2',
        tenantId: 'tenant-2',
        tenantName: 'Jose Rizal',
        startDate: '2025-03-01',
        endDate: '2026-02-28',
        rentAmount: '6000.00',
        billingFrequency: 'monthly',
        dueDateRule: 5,
        status: 'draft',
    },
    '/admin/contracts/contract-2/ledger': {
        amountDue: '0.00',
        payables: [],
        payments: [],
        fund: [],
    },
    '/admin/contracts/contract-1': {
        id: 'contract-1',
        spaceId: 'space-1',
        tenantId: 'tenant-1',
        tenantName: 'Maria Santos',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        rentAmount: '8000.00',
        billingFrequency: 'monthly',
        dueDateRule: 5,
        status: 'posted',
    },
    '/admin/contracts/contract-1/ledger': {
        amountDue: '16000.00',
        payables: [
            { id: 'pay1', periodStart: '2025-01-01', periodEnd: '2025-01-31', dueDate: '2025-01-05', billingDate: '2025-01-01', amount: '8000.00' },
            { id: 'pay2', periodStart: '2025-02-01', periodEnd: '2025-02-28', dueDate: '2025-02-05', billingDate: '2025-02-01', amount: '8000.00' },
        ],
        payments: [
            { id: 'pmt1', date: '2025-01-10', amount: '8000.00', voidedAt: null },
            { id: 'pmt2', date: '2025-02-12', amount: '4000.00', voidedAt: '2025-03-01' },
            { id: 'pmt3', date: '2026-03-29', amount: '1000.00', voidedAt: null },
        ],
        fund: [
            { id: 'fund1', type: 'deposit', amount: '16000.00' },
        ],
    },
    '/internal/contracts/public/VALIDCODE': {
        ledger: {
            amount_due: '5000.00',
            payables: [
                { id: 'p1', periodStart: '2026-01-01', periodEnd: '2026-01-31', dueDate: '2026-01-05', amount: '5000.00' },
            ],
            fund: [
                { id: 'f1', type: 'deposit', amount: '10000.00' },
            ],
        },
    },
    '/internal/tenants/entry/VALIDTOKEN': { status: 'valid' },
    '/auth/login': { access_token: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock' },
    '/admin/profile': { id: '1', username: 'admin', name: null, email: null },
};

let server: http.Server;

function readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });
}

export default async function globalSetup() {
    server = http.createServer(async (req, res) => {
        const url = req.url ?? '/';
        const method = req.method ?? 'GET';

        res.setHeader('Content-Type', 'application/json');

        // Handle query params for dashboard variants (used by tests)
        const urlWithoutQuery = url.split('?')[0];
        const queryParams = new URLSearchParams(url.split('?')[1] || '');

        // Handle dashboard with query param for different scenarios
        if (urlWithoutQuery === '/admin/dashboard') {
            const scenario = queryParams.get('scenario');
            if (scenario === 'all-overdue') {
                res.writeHead(200);
                res.end(JSON.stringify(FIXTURES['/admin/dashboard-all-overdue']));
                return;
            }
            if (scenario === 'large') {
                res.writeHead(200);
                res.end(JSON.stringify(FIXTURES['/admin/dashboard-large']));
                return;
            }
        }

        // Handle login — set a mock cookie header
        if (url === '/auth/login' && method === 'POST') {
            res.setHeader('Set-Cookie', 'auth_token=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock; Path=/; HttpOnly');
            res.writeHead(200);
            res.end(JSON.stringify({ access_token: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiJ9.mock' }));
            return;
        }

        // Handle entry token POST (submission)
        if (url.startsWith('/internal/tenants/entry/') && method === 'POST') {
            const token = url.split('/').pop();
            if (token === 'ERRORTOKEN') {
                res.writeHead(422);
                res.end(JSON.stringify({ message: 'Validation failed' }));
            } else {
                res.writeHead(200);
                res.end(JSON.stringify({ ok: true }));
            }
            return;
        }

        // Handle entry token GET
        if (url.startsWith('/internal/tenants/entry/')) {
            const token = url.split('/').pop();
            if (token === 'VALIDTOKEN' || token === 'ERRORTOKEN') {
                res.writeHead(200);
                res.end(JSON.stringify({ status: 'valid' }));
            } else if (token === 'USEDTOKEN') {
                res.writeHead(410);
                res.end(JSON.stringify({ message: 'Already used' }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ message: 'Not found' }));
            }
            return;
        }

        // Handle public contract codes
        if (url.startsWith('/internal/contracts/public/')) {
            const code = url.split('/').pop();
            if (code === 'VALIDCODE') {
                const data = FIXTURES['/internal/contracts/public/VALIDCODE'];
                res.writeHead(200);
                res.end(JSON.stringify(data));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ message: 'Not found' }));
            }
            return;
        }

        // CRUD: spaces
        if (url === '/admin/spaces' && method === 'POST') {
            const raw = await readBody(req);
            const body = JSON.parse(raw || '{}');
            const newSpace = { id: 'space-new', name: body.name, description: body.description ?? undefined };
            res.writeHead(201);
            res.end(JSON.stringify(newSpace));
            return;
        }

        const spaceEditMatch = url.match(/^\/admin\/spaces\/([^/]+)$/);
        if (spaceEditMatch) {
            if (method === 'PATCH') {
                const raw = await readBody(req);
                const body = JSON.parse(raw || '{}');
                const existing = FIXTURES[url] as Record<string, unknown> | undefined;
                const updated = { ...(existing ?? { id: spaceEditMatch[1] }), ...body };
                res.writeHead(200);
                res.end(JSON.stringify(updated));
                return;
            }
            if (method === 'DELETE') {
                res.writeHead(204);
                res.end();
                return;
            }
        }

        // CRUD: tenants
        if (url === '/admin/tenants' && method === 'POST') {
            const raw = await readBody(req);
            const body = JSON.parse(raw || '{}');
            const newTenant = {
                id: 'tenant-new',
                firstName: body.firstName,
                lastName: body.lastName,
                status: 'active',
                contactInfo: body.contactInfo ?? {},
            };
            res.writeHead(201);
            res.end(JSON.stringify(newTenant));
            return;
        }

        const tenantEditMatch = url.match(/^\/admin\/tenants\/([^/]+)$/);
        if (tenantEditMatch && method === 'PATCH') {
            const raw = await readBody(req);
            const body = JSON.parse(raw || '{}');
            const existing = FIXTURES[url] as Record<string, unknown> | undefined;
            const updated = { ...(existing ?? { id: tenantEditMatch[1] }), ...body };
            res.writeHead(200);
            res.end(JSON.stringify(updated));
            return;
        }

        // CRUD: contracts
        if (url === '/admin/contracts' && method === 'POST') {
            const raw = await readBody(req);
            const body = JSON.parse(raw || '{}');
            const newContract = { id: 'contract-new', ...body, status: 'draft' };
            res.writeHead(201);
            res.end(JSON.stringify(newContract));
            return;
        }

        const contractMatch = url.match(/^\/admin\/contracts\/([^/]+)$/);
        if (contractMatch && method === 'PATCH') {
            const raw = await readBody(req);
            const body = JSON.parse(raw || '{}');
            const existing = FIXTURES[url] as Record<string, unknown> | undefined;
            const updated = { ...(existing ?? { id: contractMatch[1] }), ...body };
            res.writeHead(200);
            res.end(JSON.stringify(updated));
            return;
        }

        const contractPostMatch = url.match(/^\/admin\/contracts\/([^/]+)\/post$/);
        if (contractPostMatch && method === 'POST') {
            res.writeHead(200);
            res.end(JSON.stringify({ id: contractPostMatch[1], status: 'posted' }));
            return;
        }

        const contractVoidMatch = url.match(/^\/admin\/contracts\/([^/]+)\/void$/);
        if (contractVoidMatch && method === 'POST') {
            res.writeHead(200);
            res.end(JSON.stringify({ id: contractVoidMatch[1], status: 'voided' }));
            return;
        }

        const contractPaymentsMatch = url.match(/^\/admin\/contracts\/([^/]+)\/payments$/);
        if (contractPaymentsMatch && method === 'POST') {
            const raw = await readBody(req);
            const body = JSON.parse(raw || '{}');
            const newPayment = { id: 'pmt-new', ...body, voidedAt: null };
            res.writeHead(201);
            res.end(JSON.stringify(newPayment));
            return;
        }

        const paymentVoidMatch = url.match(/^\/admin\/payments\/([^/]+)\/void$/);
        if (paymentVoidMatch && method === 'POST') {
            res.writeHead(200);
            res.end(JSON.stringify({ id: paymentVoidMatch[1], voidedAt: new Date().toISOString() }));
            return;
        }

        // Static fixtures (GET)
        const fixture = FIXTURES[url];
        if (fixture !== undefined) {
            res.writeHead(200);
            res.end(JSON.stringify(fixture));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Not found' }));
        }
    });

    await new Promise<void>((resolve) => {
        server.listen(3099, resolve);
    });

    const port = (server.address() as AddressInfo).port;
    console.log(`Mock API server running on port ${port}`);

    // Store teardown function
    (globalThis as unknown as Record<string, unknown>).__mockApiServer = server;
}
