/**
 * pi.js — Pi Coding Agent adapter (pi.dev, earendil-works/pi).
 *
 * Skills: <scope>/skills/<id>/ — one symlink per skill.
 *   project scope → .pi/skills/<id>
 *   global scope  → ~/.pi/agent/skills/<id>
 *
 * Pi discovers skills as folders containing a SKILL.md, which is exactly the
 * almanac skill layout — so a plain symlink works with no transformation.
 *
 * Skills only: Pi has no agent-definition directory. Project instructions go
 * in AGENTS.md (handled by the codex adapter), not per-agent files.
 */

import { existsSync, mkdirSync, symlinkSync, unlinkSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import { FrameworkAdapter } from './base.js';

export class PiAdapter extends FrameworkAdapter {
  static id = 'pi';
  static displayName = 'Pi Coding Agent';
  static strategy = 'symlink';
  static contentTypes = ['skill'];

  async detect(projectDir) {
    return existsSync(resolve(projectDir, '.pi'));
  }

  _skillsBase(projectDir, scope) {
    return scope === 'global'
      ? resolve(homedir(), '.pi/agent/skills')
      : resolve(projectDir, '.pi/skills');
  }

  async install(item, projectDir, scope, options = {}) {
    if (item.type !== 'skill') {
      return { action: 'skipped', path: '', details: 'Pi supports skills only' };
    }

    const skillsDir = this._skillsBase(projectDir, scope);
    const targetPath = resolve(skillsDir, item.id);

    if (options.dryRun) return { action: 'created', path: targetPath, details: 'dry-run' };
    if (existsSync(targetPath) && !options.force) {
      return { action: 'skipped', path: targetPath, details: 'already exists' };
    }

    mkdirSync(skillsDir, { recursive: true });
    if (existsSync(targetPath)) try { unlinkSync(targetPath); } catch {}

    const source = item.sourceDir || resolve(options.almanacRoot, 'skills', item.id);
    symlinkSync(source, targetPath);
    return { action: 'created', path: targetPath };
  }

  async uninstall(item, projectDir, scope, options = {}) {
    if (item.type !== 'skill') {
      return { action: 'skipped', path: '', details: 'Pi supports skills only' };
    }
    const targetPath = resolve(this._skillsBase(projectDir, scope), item.id);
    if (!existsSync(targetPath)) {
      return { action: 'skipped', path: targetPath, details: 'not installed' };
    }
    if (options.dryRun) return { action: 'removed', path: targetPath, details: 'dry-run' };
    unlinkSync(targetPath);
    return { action: 'removed', path: targetPath };
  }

  async listInstalled(projectDir, scope) {
    const items = [];
    const skillsDir = this._skillsBase(projectDir, scope);
    if (existsSync(skillsDir)) {
      for (const name of readdirSync(skillsDir)) {
        items.push({ id: name, type: 'skill', path: resolve(skillsDir, name) });
      }
    }
    return items;
  }

  async audit(projectDir, scope) {
    const installed = await this.listInstalled(projectDir, scope);
    return {
      framework: PiAdapter.displayName,
      ok: installed.length > 0 ? [`${installed.length} skills installed`] : [],
      warnings: installed.length === 0 ? ['No Pi content installed'] : [],
      errors: [],
    };
  }
}
