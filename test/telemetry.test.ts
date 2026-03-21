import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const ROOT = path.resolve(import.meta.dir, '..');
const BIN = path.join(ROOT, 'bin');
const BASH = process.platform === 'win32' && fs.existsSync('C:\\Program Files\\Git\\bin\\bash.exe')
  ? 'C:\\Program Files\\Git\\bin\\bash.exe'
  : 'bash';

let tmpDir: string;

function runScript(scriptName: string, args: string[] = [], env: Record<string, string> = {}): string {
  const result = spawnSync(BASH, [path.join(BIN, scriptName), ...args], {
    cwd: ROOT,
    env: { ...process.env, ASTACK_STATE_DIR: tmpDir, ASTACK_DIR: ROOT, ...env },
    encoding: 'utf-8',
    timeout: 30000,
  });

  if ((result.status ?? 1) !== 0) {
    throw new Error(`Command failed: ${scriptName} ${args.join(' ')}\n${result.stderr}`);
  }

  return result.stdout.trim();
}

function setConfig(key: string, value: string) {
  runScript('astack-config', ['set', key, value]);
}

function readJsonl(): string[] {
  const file = path.join(tmpDir, 'analytics', 'skill-usage.jsonl');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf-8').trim().split('\n').filter(Boolean);
}

function parseJsonl(): any[] {
  return readJsonl().map((line) => JSON.parse(line));
}

function slowTest(name: string, fn: () => void | Promise<void>, timeout: number = 20_000) {
  test(name, fn, timeout);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astack-tel-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('astack-telemetry-log', () => {
  slowTest('appends valid JSONL when tier=anonymous', () => {
    setConfig('telemetry', 'anonymous');
    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '142', '--outcome', 'success', '--session-id', 'test-123']);

    const events = parseJsonl();
    expect(events).toHaveLength(1);
    expect(events[0].v).toBe(1);
    expect(events[0].skill).toBe('qa');
    expect(events[0].duration_s).toBe(142);
    expect(events[0].outcome).toBe('success');
    expect(events[0].session_id).toBe('test-123');
    expect(events[0].event_type).toBe('skill_run');
    expect(events[0].os).toBeTruthy();
    expect(events[0].astack_version).toBeTruthy();
  });

  slowTest('produces no output when tier=off', () => {
    setConfig('telemetry', 'off');
    runScript('astack-telemetry-log', ['--skill', 'ship', '--duration', '30', '--outcome', 'success', '--session-id', 'test-456']);
    expect(readJsonl()).toHaveLength(0);
  });

  slowTest('defaults to off for invalid tier value', () => {
    setConfig('telemetry', 'invalid_value');
    runScript('astack-telemetry-log', ['--skill', 'ship', '--duration', '30', '--outcome', 'success', '--session-id', 'test-789']);
    expect(readJsonl()).toHaveLength(0);
  });

  slowTest('includes installation_id for community tier', () => {
    setConfig('telemetry', 'community');
    runScript('astack-telemetry-log', ['--skill', 'review', '--duration', '100', '--outcome', 'success', '--session-id', 'comm-123']);

    const events = parseJsonl();
    expect(events).toHaveLength(1);
    expect(events[0].installation_id).toMatch(/^[a-f0-9]{64}$/);
  });

  slowTest('installation_id is null for anonymous tier', () => {
    setConfig('telemetry', 'anonymous');
    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '50', '--outcome', 'success', '--session-id', 'anon-123']);

    const events = parseJsonl();
    expect(events[0].installation_id).toBeNull();
  });

  slowTest('includes error_class when provided', () => {
    setConfig('telemetry', 'anonymous');
    runScript('astack-telemetry-log', ['--skill', 'browse', '--duration', '10', '--outcome', 'error', '--error-class', 'timeout', '--session-id', 'err-123']);

    const events = parseJsonl();
    expect(events[0].error_class).toBe('timeout');
    expect(events[0].outcome).toBe('error');
  });

  slowTest('handles missing duration gracefully', () => {
    setConfig('telemetry', 'anonymous');
    runScript('astack-telemetry-log', ['--skill', 'qa', '--outcome', 'success', '--session-id', 'nodur-123']);

    const events = parseJsonl();
    expect(events[0].duration_s).toBeNull();
  });

  slowTest('supports event_type flag', () => {
    setConfig('telemetry', 'anonymous');
    runScript('astack-telemetry-log', ['--event-type', 'upgrade_prompted', '--skill', '', '--outcome', 'success', '--session-id', 'up-123']);

    const events = parseJsonl();
    expect(events[0].event_type).toBe('upgrade_prompted');
  });

  slowTest('includes local-only fields (_repo_slug, _branch)', () => {
    setConfig('telemetry', 'anonymous');
    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '50', '--outcome', 'success', '--session-id', 'local-123']);

    const events = parseJsonl();
    expect(events[0]).toHaveProperty('_repo_slug');
    expect(events[0]).toHaveProperty('_branch');
  });

  slowTest('creates analytics directory if missing', () => {
    const analyticsDir = path.join(tmpDir, 'analytics');
    if (fs.existsSync(analyticsDir)) fs.rmSync(analyticsDir, { recursive: true });

    setConfig('telemetry', 'anonymous');
    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '50', '--outcome', 'success', '--session-id', 'mkdir-123']);

    expect(fs.existsSync(analyticsDir)).toBe(true);
    expect(readJsonl()).toHaveLength(1);
  });
});

describe('.pending marker', () => {
  slowTest('finalizes stale .pending from another session as outcome:unknown', () => {
    setConfig('telemetry', 'anonymous');

    const analyticsDir = path.join(tmpDir, 'analytics');
    fs.mkdirSync(analyticsDir, { recursive: true });
    fs.writeFileSync(
      path.join(analyticsDir, '.pending-old-123'),
      '{"skill":"old-skill","ts":"2026-03-18T00:00:00Z","session_id":"old-123","astack_version":"0.6.4"}',
    );

    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '50', '--outcome', 'success', '--session-id', 'new-456']);

    const events = parseJsonl();
    expect(events).toHaveLength(2);
    expect(events[0].skill).toBe('old-skill');
    expect(events[0].outcome).toBe('unknown');
    expect(events[0].session_id).toBe('old-123');
    expect(events[1].skill).toBe('qa');
    expect(events[1].outcome).toBe('success');
  });

  slowTest('.pending-SESSION file is removed after finalization', () => {
    setConfig('telemetry', 'anonymous');

    const analyticsDir = path.join(tmpDir, 'analytics');
    fs.mkdirSync(analyticsDir, { recursive: true });
    const pendingPath = path.join(analyticsDir, '.pending-stale-session');
    fs.writeFileSync(pendingPath, '{"skill":"stale","ts":"2026-03-18T00:00:00Z","session_id":"stale-session","astack_version":"v"}');

    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '50', '--outcome', 'success', '--session-id', 'new-456']);
    expect(fs.existsSync(pendingPath)).toBe(false);
  });

  slowTest('does not finalize own session pending marker', () => {
    setConfig('telemetry', 'anonymous');

    const analyticsDir = path.join(tmpDir, 'analytics');
    fs.mkdirSync(analyticsDir, { recursive: true });
    fs.writeFileSync(
      path.join(analyticsDir, '.pending-same-session'),
      '{"skill":"in-flight","ts":"2026-03-18T00:00:00Z","session_id":"same-session","astack_version":"v"}',
    );

    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '50', '--outcome', 'success', '--session-id', 'same-session']);

    const events = parseJsonl();
    expect(events).toHaveLength(1);
    expect(events[0].skill).toBe('qa');
  });

  slowTest('tier=off still clears own session pending', () => {
    setConfig('telemetry', 'off');

    const analyticsDir = path.join(tmpDir, 'analytics');
    fs.mkdirSync(analyticsDir, { recursive: true });
    const pendingPath = path.join(analyticsDir, '.pending-off-123');
    fs.writeFileSync(pendingPath, '{"skill":"stale","ts":"2026-03-18T00:00:00Z","session_id":"off-123","astack_version":"v"}');

    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '50', '--outcome', 'success', '--session-id', 'off-123']);

    expect(fs.existsSync(pendingPath)).toBe(false);
    expect(readJsonl()).toHaveLength(0);
  });
});

describe('astack-analytics', () => {
  slowTest('shows "no data" for empty JSONL', () => {
    const output = runScript('astack-analytics');
    expect(output).toContain('no data');
  });

  slowTest('renders usage dashboard with events', () => {
    setConfig('telemetry', 'anonymous');
    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '120', '--outcome', 'success', '--session-id', 'a-1']);
    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '60', '--outcome', 'success', '--session-id', 'a-2']);
    runScript('astack-telemetry-log', ['--skill', 'ship', '--duration', '30', '--outcome', 'error', '--error-class', 'timeout', '--session-id', 'a-3']);

    const output = runScript('astack-analytics', ['all']);
    expect(output).toContain('/qa');
    expect(output).toContain('/ship');
    expect(output).toContain('2 runs');
    expect(output).toContain('1 runs');
    expect(output).toContain('Success rate: 66%');
    expect(output).toContain('Errors: 1');
  });

  slowTest('filters by time window', () => {
    setConfig('telemetry', 'anonymous');
    runScript('astack-telemetry-log', ['--skill', 'qa', '--duration', '60', '--outcome', 'success', '--session-id', 't-1']);

    const output7d = runScript('astack-analytics', ['7d']);
    expect(output7d).toContain('/qa');
    expect(output7d).toContain('last 7 days');
  });
});

describe('astack-telemetry-sync', () => {
  slowTest('exits silently with no endpoint configured', () => {
    expect(runScript('astack-telemetry-sync')).toBe('');
  });

  slowTest('exits silently with no JSONL file', () => {
    expect(runScript('astack-telemetry-sync', [], { ASTACK_TELEMETRY_ENDPOINT: 'http://localhost:9999' })).toBe('');
  });
});

describe('astack-community-dashboard', () => {
  slowTest('shows unconfigured message when no Supabase config available', () => {
    const output = runScript('astack-community-dashboard', [], {
      ASTACK_DIR: tmpDir,
      ASTACK_SUPABASE_URL: '',
      ASTACK_SUPABASE_ANON_KEY: '',
    });
    expect(output).toContain('Supabase not configured');
    expect(output).toContain('astack-analytics');
  });

  slowTest('connects to Supabase when config exists', () => {
    const output = runScript('astack-community-dashboard');
    expect(output).toContain('astack community dashboard');
    expect(output).not.toContain('Supabase not configured');
  });
});
