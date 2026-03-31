import { Injectable, Inject, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { eq, sql, getTableColumns } from 'drizzle-orm';
import { DB_TOKEN } from '../database/database.module';
import { contracts, tenants, payables, payments, fund, publicAccessCodes, audit } from '../database/schema';

// ────────────────────────────────────────────────────────────────────
// Pure helpers
// ────────────────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number): number {
    // month is 1-based
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonths(year: number, month: number, day: number, n: number): [number, number, number] {
    month += n;
    while (month > 12) { month -= 12; year++; }
    const clampedDay = Math.min(day, daysInMonth(year, month));
    return [year, month, clampedDay];
}

function toYMD(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface GeneratePayablesParams {
    contractId: string;
    startDate: string;
    endDate: string;
    rentAmount: string;
    billingFrequency: 'monthly' | 'quarterly' | 'annually';
    dueDateRule: number;
    billingDateRule?: number;
}

export function generatePayables(params: GeneratePayablesParams) {
    const { contractId, startDate, endDate, rentAmount, billingFrequency, dueDateRule, billingDateRule } = params;

    const stepMap: Record<string, number> = { monthly: 1, quarterly: 3, annually: 12 };
    const step = stepMap[billingFrequency];

    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const endMs = Date.UTC(ey, em - 1, ed);

    const result: Array<{
        contractId: string;
        periodStart: string;
        periodEnd: string;
        amount: string;
        dueDate: string;
        billingDate: string;
    }> = [];

    let [cy, cm, cd] = [sy, sm, sd];

    while (Date.UTC(cy, cm - 1, cd) <= endMs) {
        const periodStart = toYMD(cy, cm, cd);

        // next cursor
        const [ny, nm, nd] = addMonths(cy, cm, cd, step);

        // periodEnd = one day before next cursor, clamped to endDate
        let [pey, pem, ped] = addMonths(cy, cm, cd, step);
        // subtract one day from (pey, pem, nd=nd)
        let peMinus = new Date(Date.UTC(pey, pem - 1, 1));
        peMinus.setUTCDate(peMinus.getUTCDate() - 1);
        pey = peMinus.getUTCFullYear();
        pem = peMinus.getUTCMonth() + 1;
        ped = peMinus.getUTCDate();

        // clamp to endDate
        if (Date.UTC(pey, pem - 1, ped) > endMs) {
            [pey, pem, ped] = [ey, em, ed];
        }

        const clampedDue = Math.min(dueDateRule, daysInMonth(cy, cm));
        const dueDate = toYMD(cy, cm, clampedDue);

        const billingDate = billingDateRule != null
            ? toYMD(cy, cm, Math.min(billingDateRule, daysInMonth(cy, cm)))
            : dueDate;

        result.push({ contractId, periodStart, periodEnd: toYMD(pey, pem, ped), amount: rentAmount, dueDate, billingDate });

        [cy, cm, cd] = [ny, nm, nd];
    }

    return result;
}

// ────────────────────────────────────────────────────────────────────
// ContractsService
// ────────────────────────────────────────────────────────────────────

@Injectable()
export class ContractsService {
    constructor(@Inject(DB_TOKEN) private readonly db: any) {}

    async findAll() {
        return this.db
            .select({
                ...getTableColumns(contracts),
                tenantName: sql<string>`${tenants.firstName} || ' ' || ${tenants.lastName}`,
            })
            .from(contracts)
            .leftJoin(tenants, eq(contracts.tenantId, tenants.id));
    }

    async findOne(id: string) {
        const rows = await this.db.select().from(contracts).where(eq(contracts.id, id));
        if (!rows[0]) throw new NotFoundException('Contract not found');
        return rows[0];
    }

    async create(data: {
        tenantId: string;
        spaceId: string;
        startDate: string;
        endDate: string;
        rentAmount: string;
        billingFrequency: 'monthly' | 'quarterly' | 'annually';
        dueDateRule: number;
        depositAmount?: string;
        advanceMonths?: number;
        metadata?: unknown;
    }) {
        const rows = await this.db.insert(contracts).values(data).returning();
        return rows[0];
    }

    async update(id: string, data: Partial<Omit<typeof contracts.$inferInsert, 'status'>>) {
        const existing = await this.findOne(id);
        if (existing.status === 'posted') {
            throw new BadRequestException('Cannot modify a posted contract');
        }
        const rows = await this.db
            .update(contracts)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(contracts.id, id))
            .returning();
        return rows[0];
    }

    async post(id: string) {
        const existing = await this.findOne(id);
        const payableRows = generatePayables({
            contractId: id,
            startDate: existing.startDate,
            endDate: existing.endDate,
            rentAmount: existing.rentAmount,
            billingFrequency: existing.billingFrequency,
            dueDateRule: existing.dueDateRule,
            ...(existing.billingDateRule != null ? { billingDateRule: existing.billingDateRule } : {}),
        });

        try {
            return await this.db.transaction(async (tx: any) => {
                // 1. Transition to posted
                const [posted] = await tx
                    .update(contracts)
                    .set({ status: 'posted', updatedAt: new Date() })
                    .where(eq(contracts.id, id))
                    .returning();

                // 2. Public access code (DB auto-generates UUID)
                await tx.insert(publicAccessCodes).values({ contractId: id });

                // 3. Fund entry for deposit
                if (existing.depositAmount) {
                    await tx.insert(fund).values({ contractId: id, type: 'deposit', amount: existing.depositAmount });
                }

                // 4. Advance payment
                if (existing.advanceMonths && existing.advanceMonths > 0) {
                    const advanceAmount = (parseFloat(existing.rentAmount) * existing.advanceMonths).toFixed(2);
                    await tx.insert(payments).values({
                        contractId: id,
                        amount: advanceAmount,
                        date: existing.startDate,
                    });
                }

                // 5. All recurring payables
                if (payableRows.length > 0) {
                    await tx.insert(payables).values(payableRows);
                }

                return posted;
            });
        } catch (err: any) {
            if (err?.code === '23505' || err?.cause?.code === '23505') {
                throw new ConflictException('A posted contract already exists for this space');
            }
            throw err;
        }
    }

    async void(id: string) {
        const existing = await this.findOne(id);
        if (existing.status !== 'posted') {
            throw new BadRequestException('Only posted contracts can be voided');
        }
        return await this.db.transaction(async (tx: any) => {
            const [voided] = await tx
                .update(contracts)
                .set({ status: 'voided', updatedAt: new Date() })
                .where(eq(contracts.id, id))
                .returning();
            await tx.insert(audit).values({ entityType: 'contract', entityId: id, action: 'void' });
            return voided;
        });
    }

    async revokeAccessCode(contractId: string) {
        await this.findOne(contractId);
        const rows = await this.db
            .update(publicAccessCodes)
            .set({ revokedAt: new Date() })
            .where(eq(publicAccessCodes.contractId, contractId))
            .returning();
        if (!rows[0]) throw new NotFoundException('No public access code found for this contract');
        return rows[0];
    }
}
