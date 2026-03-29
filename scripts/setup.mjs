/* eslint-disable no-console */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const composeFile = resolve(rootDir, 'docker-compose.yml');
const dockerCommand = process.platform === 'win32' ? 'docker.exe' : 'docker';
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

/** Pairs of [source, target] — target is skipped if it already exists */
const envFiles = [
  ['apps/core/.env.example', 'apps/core/.env.local'],
  ['packages/db/.env.example', 'packages/db/.env'],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCommand(command, args) {
  return [command, ...args].join(' ');
}

/**
 * Run a command synchronously, inheriting stdio by default.
 * Throws on non-zero exit or spawn error.
 */
function run(command, args, { capture = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  });

  if (result.error) throw result.error;

  if (result.status !== 0) {
    const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    const err = new Error(
      output || `${formatCommand(command, args)} failed with exit code ${result.status ?? 1}.`,
    );
    err.cause = output;
    throw err;
  }

  return result.stdout ?? '';
}

function fail(message) {
  console.error(`\nSetup failed: ${message}`);
  process.exit(1);
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

function copyEnvFiles() {
  let created = 0;

  for (const [source, target] of envFiles) {
    const sourcePath = resolve(rootDir, source);
    const targetPath = resolve(rootDir, target);

    if (existsSync(targetPath)) {
      console.log(`  Skipping existing ${target}`);
      continue;
    }

    copyFileSync(sourcePath, targetPath);
    console.log(`  Created ${target}`);
    created += 1;
  }

  if (created === 0) console.log('  All environment files already present');
}

function ensureDockerAvailable() {
  const result = spawnSync(dockerCommand, ['info'], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.error?.code === 'ENOENT') {
    fail('Docker CLI not found. Install Docker Desktop and ensure `docker` is on PATH.');
  }

  if (result.status !== 0) {
    fail(
      'Docker is not running or not reachable. Start Docker Desktop and retry.',
    );
  }
}

function waitForPostgres(timeoutMs = 60_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const result = spawnSync(
      dockerCommand,
      ['compose', '-f', composeFile, 'exec', '-T', 'postgres', 'pg_isready', '-U', 'finfolio', '-d', 'finfolio'],
      { cwd: rootDir, encoding: 'utf8', stdio: 'pipe' },
    );

    if (!result.error && result.status === 0) {
      console.log('  Postgres is ready');
      return;
    }

    sleep(2_000);
  }

  fail('Postgres did not become ready within 60s.');
}


function startInfra() {
  ensureDockerAvailable();
  console.log('  Starting Docker services...');

  // Try --wait flag (Docker Compose v2.1+), fall back to polling
  try {
    run(dockerCommand, ['compose', '-f', composeFile, 'up', '-d', '--wait']);
    return;
  } catch (error) {
    const message = `${error.cause ?? error.message}`;
    if (!message.includes('unknown flag: --wait')) throw error;
  }

  run(dockerCommand, ['compose', '-f', composeFile, 'up', '-d']);
  waitForPostgres();
}

function stopInfra() {
  ensureDockerAvailable();
  console.log('  Stopping Docker services...');
  run(dockerCommand, ['compose', '-f', composeFile, 'down']);
}

function runMigrations() {
  console.log('  Running database migrations...');
  run(pnpmCommand, ['--filter', '@fin-folio/db', 'run', 'db:migrate']);
  console.log('  Migrations complete');
}

function generateMigration(name) {
  console.log('  Building schema...');
  run(pnpmCommand, ['--filter', '@fin-folio/db', 'run', 'build']);

  const args = ['--filter', '@fin-folio/db', 'exec', 'drizzle-kit', 'generate'];
  if (name) {
    args.push('--name', name);
    console.log(`  Generating migration: ${name}`);
  } else {
    console.log('  Generating migration (no --name given, filename will be random)');
  }

  run(pnpmCommand, args);
}

function setup() {
  console.log('\n── Step 1: Copy environment files');
  copyEnvFiles();

  console.log('\n── Step 2: Start infrastructure');
  startInfra();

  console.log('\n── Step 3: Run migrations');
  runMigrations();

  console.log('\n✓ Setup complete! Run: pnpm dev\n');
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

try {
  const command = process.argv[2] ?? 'setup';

  switch (command) {
    case 'env:copy':
      copyEnvFiles();
      break;
    case 'infra:start':
      startInfra();
      break;
    case 'infra:stop':
      stopInfra();
      break;
    case 'db:generate':
      generateMigration(process.argv[3]);
      break;
    case 'db:migrate':
      runMigrations();
      break;
    case 'setup':
      setup();
      break;
    default:
      fail(`Unknown command "${command}". Use one of: setup, infra:start, infra:stop, env:copy, db:migrate`);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
