import { Injectable, Inject } from '@nestjs/common';
import { isNull, inArray, getTableColumns, sql, eq } from 'drizzle-orm';
import { DB_TOKEN } from '../database/database.module';
import { spaces, contracts, tenants, payables, payments } from '../database/schema';

export interface DashboardEntry {
    id: string;
    name: string;
    description?: string;
    occupancyStatus: 'overdue' | 'nearing' | 'occupied' | 'vacant';
    tenantId?: string;
    tenantName?: string;
    contractId?: string;
    amountDue?: string;
    nextDueDate?: string;
}

const STATUS_RANK: Record<string, number> = { overdue: 0, nearing: 1, occupied: 2, vacant: 3 };

function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
}

@Injectable()
export class DashboardService {
    constructor(@Inject(DB_TOKEN) private readonly db: any) {}

    async getDashboard(referenceDate?: string): Promise<DashboardEntry[]> {
        const refDate = referenceDate ?? new Date().toISOString().split('T')[0];

        const [spaceRows, contractRows] = await Promise.all([
            this.db.select().from(spaces).where(isNull(spaces.deletedAt)),
            this.db.select({
                ...getTableColumns(contracts),
                tenantName: sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}`,
            }).from(contracts).leftJoin(tenants, eq(contracts.tenantId, tenants.id)).where(eq(contracts.status, 'posted')),
        ]);

        const contractIds: string[] = contractRows.map((c: any) => c.id);

        let payableRows: any[] = [];
        let paymentRows: any[] = [];

        if (contractIds.length > 0) {
            [payableRows, paymentRows] = await Promise.all([
                this.db.select().from(payables).where(inArray(payables.contractId, contractIds)),
                this.db.select().from(payments).where(inArray(payments.contractId, contractIds)),
            ]);
        }

        const contractBySpaceId = new Map<string, any>();
        for (const c of contractRows) {
            contractBySpaceId.set(c.spaceId, c);
        }

        const payablesByContractId = new Map<string, any[]>();
        for (const p of payableRows) {
            const list = payablesByContractId.get(p.contractId) ?? [];
            list.push(p);
            payablesByContractId.set(p.contractId, list);
        }

        const paymentsByContractId = new Map<string, any[]>();
        for (const p of paymentRows) {
            const list = paymentsByContractId.get(p.contractId) ?? [];
            list.push(p);
            paymentsByContractId.set(p.contractId, list);
        }

        const todayPlus7 = addDays(refDate, 7);

        const entries: DashboardEntry[] = spaceRows.map((space: any) => {
            const contract = contractBySpaceId.get(space.id);

            if (!contract) {
                return {
                    id: space.id,
                    name: space.name,
                    ...(space.description ? { description: space.description } : {}),
                    occupancyStatus: 'vacant' as const,
                };
            }

            const contractPayables = payablesByContractId.get(contract.id) ?? [];
            const contractPayments = paymentsByContractId.get(contract.id) ?? [];

            const pastDuePayables = contractPayables.filter((p: any) => p.dueDate <= refDate);
            const futurePayables = contractPayables.filter((p: any) => p.dueDate > refDate);

            const totalOwed = pastDuePayables.reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
            const totalPaid = contractPayments
                .filter((p: any) => p.voidedAt === null || p.voidedAt === undefined)
                .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
            const amountDue = Math.max(0, totalOwed - totalPaid).toFixed(2);

            const nextDueDate = futurePayables.length > 0
                ? futurePayables.map((p: any) => p.dueDate).sort()[0]
                : undefined;

            let occupancyStatus: DashboardEntry['occupancyStatus'];
            if (parseFloat(amountDue) > 0) {
                occupancyStatus = 'overdue';
            } else if (nextDueDate && nextDueDate <= todayPlus7) {
                occupancyStatus = 'nearing';
            } else {
                occupancyStatus = 'occupied';
            }

            return {
                id: space.id,
                name: space.name,
                ...(space.description ? { description: space.description } : {}),
                occupancyStatus,
                tenantId: contract.tenantId,
                tenantName: contract.tenantName,
                contractId: contract.id,
                amountDue,
                ...(nextDueDate ? { nextDueDate } : {}),
            };
        });

        return entries.sort((a, b) => STATUS_RANK[a.occupancyStatus] - STATUS_RANK[b.occupancyStatus]);
    }
}
