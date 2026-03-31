process.env.PLAYWRIGHT_BASE_URL = 'http://localhost:3000';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'replace-with-a-strong-password';

const { execSync } = require('child_process');
try {
    const result = execSync('npx playwright test e2e/sit-ledger.spec.ts --reporter=list', {
        cwd: __dirname,
        env: process.env,
        stdio: 'pipe',
    });
    console.log(result.toString());
} catch (err) {
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    process.exit(err.status ?? 1);
}
