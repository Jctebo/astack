/**
 * Cross-platform constants for astack browse.
 *
 * On macOS/Linux: TEMP_DIR = '/tmp', path.sep = '/'  — identical to hardcoded values.
 * On Windows: TEMP_DIR = os.tmpdir(), path.sep = '\\' — correct Windows behavior.
 */

import * as os from 'os';
import * as path from 'path';

export const IS_WINDOWS = process.platform === 'win32';
export const TEMP_DIR = IS_WINDOWS ? os.tmpdir() : '/tmp';

/** Check if resolvedPath is within dir, using platform-aware separators. */
export function isPathWithin(resolvedPath: string, dir: string): boolean {
  const normalizedPath = path.resolve(resolvedPath);
  const normalizedDir = path.resolve(dir);
  return normalizedPath === normalizedDir || normalizedPath.startsWith(normalizedDir + path.sep);
}
