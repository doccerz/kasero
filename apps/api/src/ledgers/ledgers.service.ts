import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, isNull } from 'drizzle-orm';
import { DB_TOKEN } from '../database/database.module';
import { contracts, payables, payments, fund } from '../database/schema';

export interface LedgerView {
    payables: any[];
    payments: any[];
    fund: any[];
    amount_due: string;
}

export type PaymentRow = typeof payments.$inferSelect;

@Injectable()
export class LedgersService {
    constructor(@Inject(DB_TOKEN) private readonly db: any) {}

    async getLedger(contractId: string, referenceDate?: string): Promise<LedgerView> {
        const refDate = referenceDate ?? new Date().toISOString().split('T')[0];

        const [payableRows, paymentRows, fundRows] = await Promise.all([
            this.db.select().from(payables).where(eq(payables.contractId, contractId)),
            this.db.select().from(payments).where(eq(payments.contractId, contractId)),
            this.db.select().from(fund).where(eq(fund.contractId, contractId)),
        ]);

        const totalOwed = payableRows
            .filter((p: any) => p.dueDate <= refDate)
            .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

        const totalPaid = paymentRows
            .filter((p: any) => p.voidedAt === null || p.voidedAt === undefined)
            .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

        const amount_due = Math.max(0, totalOwed - totalPaid).toFixed(2);

        return { payables: payableRows, payments: paymentRows, fund: fundRows, amount_due };
    }

    async recordPayment(contractId: string, data: { amount: string; date?: string }): Promise<PaymentRow> {
        const [contract] = await this.db.select().from(contracts).where(eq(contracts.id, contractId));
        if (!contract) throw new NotFoundException('Contract not found');
        if (contract.status === 'voided') throw new BadRequestException('Cannot record payment on a voided contract');

        const date = data.date ?? new Date().toISOString().split('T')[0];
        const [row] = await this.db
            .insert(payments)
            .values({ contractId, amount: data.amount, date })
            .returning();

        return row;
    }

    async voidPayment(paymentId: string): Promise<PaymentRow> {
        const [existing] = await this.db
            .select()
            .from(payments)
            .where(eq(payments.id, paymentId));

        if (!existing) {
            throw new NotFoundException(`Payment ${paymentId} not found`);
        }

        if (existing.voidedAt !== null && existing.voidedAt !== undefined) {
            throw new BadRequestException('Payment is already voided');
        }

        const [updated] = await this.db
            .update(payments)
            .set({ voidedAt: new Date() })
            .where(eq(payments.id, paymentId))
            .returning();

        return updated;
    }
}
