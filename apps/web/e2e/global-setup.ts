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
    '/admin/spaces/space-1': {
        id: 'space-1',
        name: 'Unit 1A',
        description: 'Ground floor corner unit',
    },
    '/admin/spaces/space-empty': {
        id: 'space-empty',
        name: 'Empty Unit',
    },
    '/admin/contracts': [
        {
            id: 'contract-1',
            spaceId: 'space-1',
            tenantId: 'tenant-1',
            tenantName: 'Maria Santos',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            status: 'posted',
        },
        {
            id: 'contract-2',
            spaceId: 'space-2',
            tenantId: 'tenant-2',
            tenantName: 'Jose Rizal',
            startDate: '2025-03-01',
            endDate: '2026-02-28',
            status: 'draft',
        },
    ],
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
            { id: 'pay1', periodStart: '2025-01-01', periodEnd: '2025-01-31', dueDate: '2025-01-05', amount: '8000.00' },
            { id: 'pay2', periodStart: '2025-02-01', periodEnd: '2025-02-28', dueDate: '2025-02-05', amount: '8000.00' },
        ],
        payments: [
            { id: 'pmt1', date: '2025-01-10', amount: '8000.00', voidedAt: null },
            { id: 'pmt2', date: '2025-02-12', amount: '4000.00', voidedAt: '2025-03-01' },
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
    '/auth/login': { access_token: 'mock-jwt-token' },
};

let server: http.Server;

export default async function globalSetup() {
    server = http.createServer((req, res) => {
        const url = req.url ?? '/';
        const method = req.method ?? 'GET';

        res.setHeader('Content-Type', 'application/json');

        // Handle login — set a mock cookie header
        if (url === '/auth/login' && method === 'POST') {
            res.setHeader('Set-Cookie', 'auth_token=mock-jwt-token; Path=/; HttpOnly');
            res.writeHead(200);
            res.end(JSON.stringify({ access_token: 'mock-jwt-token' }));
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
