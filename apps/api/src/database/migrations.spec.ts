import * as fs from 'fs';
import * as path from 'path';

describe('Drizzle migration journal', () => {
    const journalPath = path.resolve(__dirname, '../../drizzle/migrations/meta/_journal.json');

    it('includes migration 0007_profile_void_billing', () => {
        const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
        const tags = journal.entries.map((e) => e.tag);
        expect(tags).toContain('0007_profile_void_billing');
    });
});
