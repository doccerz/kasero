import {
    pgTable,
    pgEnum,
    uuid,
    text,
    jsonb,
    date,
    timestamp,
    numeric,
    integer,
    unique,
} from 'drizzle-orm/pg-core';

export const tenantStatusEnum = pgEnum('tenant_status', ['active', 'inactive']);
export const billingFrequencyEnum = pgEnum('billing_frequency', ['monthly', 'quarterly', 'annually']);
export const contractStatusEnum = pgEnum('contract_status', ['draft', 'posted', 'voided']);
export const fundTypeEnum = pgEnum('fund_type', ['deposit', 'excess']);
export const auditActionEnum = pgEnum('audit_action', ['void', 'state_change']);

export const spaces = pgTable('spaces', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    metadata: jsonb('metadata'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tenants = pgTable('tenants', {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    contactInfo: jsonb('contact_info'),
    status: tenantStatusEnum('status').notNull().default('inactive'),
    expirationDate: date('expiration_date'),
    entryToken: uuid('entry_token'),
    entryTokenUsedAt: timestamp('entry_token_used_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contracts = pgTable('contracts', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
    spaceId: uuid('space_id').notNull().references(() => spaces.id),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    rentAmount: numeric('rent_amount', { precision: 12, scale: 2 }).notNull(),
    billingFrequency: billingFrequencyEnum('billing_frequency').notNull(),
    dueDateRule: integer('due_date_rule').notNull(),
    billingDateRule: integer('billing_date_rule'),
    depositAmount: numeric('deposit_amount', { precision: 12, scale: 2 }),
    advanceMonths: integer('advance_months'),
    status: contractStatusEnum('status').notNull().default('draft'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const payables = pgTable('payables', {
    id: uuid('id').defaultRandom().primaryKey(),
    contractId: uuid('contract_id').notNull().references(() => contracts.id),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    dueDate: date('due_date').notNull(),
    billingDate: date('billing_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const payments = pgTable('payments', {
    id: uuid('id').defaultRandom().primaryKey(),
    contractId: uuid('contract_id').notNull().references(() => contracts.id),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    date: date('date').notNull(),
    voidedAt: timestamp('voided_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const fund = pgTable('fund', {
    id: uuid('id').defaultRandom().primaryKey(),
    contractId: uuid('contract_id').notNull().references(() => contracts.id),
    type: fundTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const settings = pgTable('settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    key: text('key').notNull(),
    value: text('value'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [unique().on(t.key)]);

export const appVersion = pgTable('app_version', {
    id: uuid('id').defaultRandom().primaryKey(),
    version: text('version').notNull(),
    initializedAt: timestamp('initialized_at').defaultNow().notNull(),
});

export const adminUsers = pgTable('admin_users', {
    id: uuid('id').defaultRandom().primaryKey(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name'),
    email: text('email'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [unique().on(t.username)]);

export const publicAccessCodes = pgTable('public_access_codes', {
    id: uuid('id').defaultRandom().primaryKey(),
    contractId: uuid('contract_id').notNull().references(() => contracts.id),
    code: uuid('code').defaultRandom().notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [unique().on(t.code)]);

export const audit = pgTable('audit', {
    id: uuid('id').defaultRandom().primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    action: auditActionEnum('action').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
