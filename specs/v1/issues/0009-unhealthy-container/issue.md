# Unhealthy app container

```
/app/node_modules/drizzle-orm/pg-core/session.cjs:66
        throw new import_errors.DrizzleQueryError(queryString, params, e);
              ^

DrizzleQueryError: Failed query: insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing
params: admin,$2b$10$iYBi5//w8w.p/8kbPhfoy.WQL2JgNfsiFb33kVZv/UJwkB4/VoqyW
    at NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:66:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
    at async bootstrap (/app/dist/src/main.js:13:9) {
  query: 'insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing',
  params: [
    'admin',
    '$2b$10$iYBi5//w8w.p/8kbPhfoy.WQL2JgNfsiFb33kVZv/UJwkB4/VoqyW'
  ],
  cause: error: column "name" of relation "admin_users" does not exist
      at /app/node_modules/pg-pool/index.js:45:11
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async /app/node_modules/drizzle-orm/node-postgres/session.cjs:148:20
      at async NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:64:16)
      at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
      at async bootstrap (/app/dist/src/main.js:13:9) {
    length: 128,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '63',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_target.c',
    line: '1066',
    routine: 'checkInsertTargets'
  }
}

Node.js v24.14.1
/app/node_modules/drizzle-orm/pg-core/session.cjs:66
        throw new import_errors.DrizzleQueryError(queryString, params, e);
              ^

DrizzleQueryError: Failed query: insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing
params: admin,$2b$10$OY7V.7n65H73JSBW5qDShuY6B1/RovahNkLtBzcrqQsmHU1BgnQOS
    at NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:66:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
    at async bootstrap (/app/dist/src/main.js:13:9) {
  query: 'insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing',
  params: [
    'admin',
    '$2b$10$OY7V.7n65H73JSBW5qDShuY6B1/RovahNkLtBzcrqQsmHU1BgnQOS'
  ],
  cause: error: column "name" of relation "admin_users" does not exist
      at /app/node_modules/pg-pool/index.js:45:11
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async /app/node_modules/drizzle-orm/node-postgres/session.cjs:148:20
      at async NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:64:16)
      at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
      at async bootstrap (/app/dist/src/main.js:13:9) {
    length: 128,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '63',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_target.c',
    line: '1066',
    routine: 'checkInsertTargets'
  }
}

Node.js v24.14.1
/app/node_modules/drizzle-orm/pg-core/session.cjs:66
        throw new import_errors.DrizzleQueryError(queryString, params, e);
              ^

DrizzleQueryError: Failed query: insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing
params: admin,$2b$10$laDcpTNaNOGbpMcHGtMZqeOQaKuF5cHt.C39JKhIhbPZCJDova5um
    at NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:66:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
    at async bootstrap (/app/dist/src/main.js:13:9) {
  query: 'insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing',
  params: [
    'admin',
    '$2b$10$laDcpTNaNOGbpMcHGtMZqeOQaKuF5cHt.C39JKhIhbPZCJDova5um'
  ],
  cause: error: column "name" of relation "admin_users" does not exist
      at /app/node_modules/pg-pool/index.js:45:11
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async /app/node_modules/drizzle-orm/node-postgres/session.cjs:148:20
      at async NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:64:16)
      at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
      at async bootstrap (/app/dist/src/main.js:13:9) {
    length: 128,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '63',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_target.c',
    line: '1066',
    routine: 'checkInsertTargets'
  }
}

Node.js v24.14.1
/app/node_modules/drizzle-orm/pg-core/session.cjs:66
        throw new import_errors.DrizzleQueryError(queryString, params, e);
              ^

DrizzleQueryError: Failed query: insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing
params: admin,$2b$10$Rpp2LYdtL716vtQqH2keteAdY9ityIRhwj/i8cnL1vXFw5bLslaau
    at NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:66:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
    at async bootstrap (/app/dist/src/main.js:13:9) {
  query: 'insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing',
  params: [
    'admin',
    '$2b$10$Rpp2LYdtL716vtQqH2keteAdY9ityIRhwj/i8cnL1vXFw5bLslaau'
  ],
  cause: error: column "name" of relation "admin_users" does not exist
      at /app/node_modules/pg-pool/index.js:45:11
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async /app/node_modules/drizzle-orm/node-postgres/session.cjs:148:20
      at async NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:64:16)
      at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
      at async bootstrap (/app/dist/src/main.js:13:9) {
    length: 128,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '63',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_target.c',
    line: '1066',
    routine: 'checkInsertTargets'
  }
}

Node.js v24.14.1
/app/node_modules/drizzle-orm/pg-core/session.cjs:66
        throw new import_errors.DrizzleQueryError(queryString, params, e);
              ^

DrizzleQueryError: Failed query: insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing
params: admin,$2b$10$l7GOGR0CzNGFPuCJf61w0exr7ZniB.ozsyOojV1CrJedLK1boqsK2
    at NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:66:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
    at async bootstrap (/app/dist/src/main.js:13:9) {
  query: 'insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing',
  params: [
    'admin',
    '$2b$10$l7GOGR0CzNGFPuCJf61w0exr7ZniB.ozsyOojV1CrJedLK1boqsK2'
  ],
  cause: error: column "name" of relation "admin_users" does not exist
      at /app/node_modules/pg-pool/index.js:45:11
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async /app/node_modules/drizzle-orm/node-postgres/session.cjs:148:20
      at async NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:64:16)
      at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
      at async bootstrap (/app/dist/src/main.js:13:9) {
    length: 128,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '63',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_target.c',
    line: '1066',
    routine: 'checkInsertTargets'
  }
}

Node.js v24.14.1
/app/node_modules/drizzle-orm/pg-core/session.cjs:66
        throw new import_errors.DrizzleQueryError(queryString, params, e);
              ^

DrizzleQueryError: Failed query: insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing
params: admin,$2b$10$4wIPHFKGEuC59JnlVJQSoevBp5h4.NH0O1a56axg4d9PcfX94V4g.
    at NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:66:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
    at async bootstrap (/app/dist/src/main.js:13:9) {
  query: 'insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing',
  params: [
    'admin',
    '$2b$10$4wIPHFKGEuC59JnlVJQSoevBp5h4.NH0O1a56axg4d9PcfX94V4g.'
  ],
  cause: error: column "name" of relation "admin_users" does not exist
      at /app/node_modules/pg-pool/index.js:45:11
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async /app/node_modules/drizzle-orm/node-postgres/session.cjs:148:20
      at async NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:64:16)
      at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
      at async bootstrap (/app/dist/src/main.js:13:9) {
    length: 128,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '63',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_target.c',
    line: '1066',
    routine: 'checkInsertTargets'
  }
}

Node.js v24.14.1
/app/node_modules/drizzle-orm/pg-core/session.cjs:66
        throw new import_errors.DrizzleQueryError(queryString, params, e);
              ^

DrizzleQueryError: Failed query: insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing
params: admin,$2b$10$RwZd0yqLYawwBGt4aHp9UOAve2meXHfexCy1G4JyvEcyHrEqkOIWa
    at NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:66:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
    at async bootstrap (/app/dist/src/main.js:13:9) {
  query: 'insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing',
  params: [
    'admin',
    '$2b$10$RwZd0yqLYawwBGt4aHp9UOAve2meXHfexCy1G4JyvEcyHrEqkOIWa'
  ],
  cause: error: column "name" of relation "admin_users" does not exist
      at /app/node_modules/pg-pool/index.js:45:11
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async /app/node_modules/drizzle-orm/node-postgres/session.cjs:148:20
      at async NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:64:16)
      at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
      at async bootstrap (/app/dist/src/main.js:13:9) {
    length: 128,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '63',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_target.c',
    line: '1066',
    routine: 'checkInsertTargets'
  }
}

Node.js v24.14.1
/app/node_modules/drizzle-orm/pg-core/session.cjs:66
        throw new import_errors.DrizzleQueryError(queryString, params, e);
              ^

DrizzleQueryError: Failed query: insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing
params: admin,$2b$10$MqdSjRKKy46rAMt51CaTdO/ZEMjS40rCeFDHMO/yXSQDOkhLjf02.
    at NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:66:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
    at async bootstrap (/app/dist/src/main.js:13:9) {
  query: 'insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing',
  params: [
    'admin',
    '$2b$10$MqdSjRKKy46rAMt51CaTdO/ZEMjS40rCeFDHMO/yXSQDOkhLjf02.'
  ],
  cause: error: column "name" of relation "admin_users" does not exist
      at /app/node_modules/pg-pool/index.js:45:11
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async /app/node_modules/drizzle-orm/node-postgres/session.cjs:148:20
      at async NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:64:16)
      at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
      at async bootstrap (/app/dist/src/main.js:13:9) {
    length: 128,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '63',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_target.c',
    line: '1066',
    routine: 'checkInsertTargets'
  }
}

Node.js v24.14.1
/app/node_modules/drizzle-orm/pg-core/session.cjs:66
        throw new import_errors.DrizzleQueryError(queryString, params, e);
              ^

DrizzleQueryError: Failed query: insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing
params: admin,$2b$10$LshbelGIFQ67ml6j8M0ceOWj.CbK1Pqm7C.bCrtVADE0nRFP8IJ0W
    at NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:66:15)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
    at async bootstrap (/app/dist/src/main.js:13:9) {
  query: 'insert into "admin_users" ("id", "username", "password_hash", "name", "email", "created_at") values (default, $1, $2, default, default, default) on conflict do nothing',
  params: [
    'admin',
    '$2b$10$LshbelGIFQ67ml6j8M0ceOWj.CbK1Pqm7C.bCrtVADE0nRFP8IJ0W'
  ],
  cause: error: column "name" of relation "admin_users" does not exist
      at /app/node_modules/pg-pool/index.js:45:11
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
      at async /app/node_modules/drizzle-orm/node-postgres/session.cjs:148:20
      at async NodePgPreparedQuery.queryWithCache (/app/node_modules/drizzle-orm/pg-core/session.cjs:64:16)
      at async seedAdminUser (/app/dist/src/database/seed.js:16:5)
      at async bootstrap (/app/dist/src/main.js:13:9) {
    length: 128,
    severity: 'ERROR',
    code: '42703',
    detail: undefined,
    hint: undefined,
    position: '63',
    internalPosition: undefined,
    internalQuery: undefined,
    where: undefined,
    schema: undefined,
    table: undefined,
    column: undefined,
    dataType: undefined,
    constraint: undefined,
    file: 'parse_target.c',
    line: '1066',
    routine: 'checkInsertTargets'
  }
}
```