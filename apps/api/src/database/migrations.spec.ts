import * as fs from 'fs';
import * as path from 'path';

describe('Drizzle migration journal', () => {
    const migrationsDir = path.resolve(__dirname, '../../drizzle/migrations');
    const journalPath = path.join(migrationsDir, 'meta/_journal.json');

    it('includes migration 0007_profile_void_billing', () => {
        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
        const tags = journal.entries.map((e: { tag: string }) => e.tag);
        expect(tags).toContain('0007_profile_void_billing');
    });

    it('includes migration 0008_tenant_soft_delete', () => {
        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
        const tags = journal.entries.map((e: { tag: string }) => e.tag);
        expect(tags).toContain('0008_tenant_soft_delete');
    });

    // Guard against forgetting to register a migration in the journal (which
    // causes drizzle's migrator to silently skip it — see fix/tenant-create-500-docker).
    it('registers every .sql file in the journal', () => {
        const sqlFiles = fs
            .readdirSync(migrationsDir)
            .filter((f) => f.endsWith('.sql'))
            .map((f) => f.replace(/\.sql$/, ''))
            .sort();
        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
        const tags = journal.entries.map((e: { tag: string }) => e.tag).sort();
        expect(tags).toEqual(sqlFiles);
    });
});
