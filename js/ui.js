// My Small Town — what every screen does on load, plus small UI helpers.

import { api, isDemo } from './api.js';
import { computeTown } from './town.js';
import { esc, dayKey } from './util.js';

export { api, isDemo };

// Colors people pick for themselves (dot color + light tint for cards).
export const PEOPLE_COLORS = [
  { name: 'Mint', hex: '#3DD49A', tint: '#A8F0CF' },
  { name: 'Violet', hex: '#9B7BFF', tint: '#D4C6FF' },
  { name: 'Sky', hex: '#4FB7FF', tint: '#B5E0FF' },
  { name: 'Coral', hex: '#FF7A59', tint: '#FFC2B0' },
  { name: 'Pink', hex: '#FF7EB6', tint: '#FFC4DD' },
  { name: 'Sun', hex: '#FFD23F', tint: '#FFE98F' }
];
export const tintOf = (hex) => PEOPLE_COLORS.find((c) => c.hex === hex)?.tint ?? '#EDE8FC';

// Colors a group can choose for its town.
export const ACCENTS = [
  { name: 'Sunshine', hex: '#FFD23F' },
  { name: 'Coral', hex: '#FF7A59' },
  { name: 'Mint', hex: '#3DD49A' },
  { name: 'Sky', hex: '#4FB7FF' }
];

export function applyAccent(hex) {
  if (/^#[0-9A-Fa-f]{6}$/.test(hex || '')) document.documentElement.style.setProperty('--accent', hex);
}

export function avatar(person, size = '') {
  const initial = esc((person?.name || '?').trim().charAt(0).toUpperCase());
  return `<span class="avatar ${size}" aria-hidden="true" style="background: ${esc(person?.color || '#FFFFFF')}">${initial}</span>`;
}

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } }
};
export const rememberGroup = (id) => store.set('mst.currentGroup', id);

// Only ever send people back to one of our own pages.
export function safeNext(value, fallback = 'index.html') {
  return /^[a-z-]+\.html(\?[\w=&%.-]*)?$/.test(value || '') ? value : fallback;
}
const herePage = () => (location.pathname.split('/').pop() || 'index.html') + location.search;

function showDemoBanner() {
  if (document.querySelector('.demo-banner')) return;
  const div = document.createElement('div');
  div.className = 'demo-banner';
  div.textContent = 'Demo mode: everything stays on this device. See SETUP.md to connect a database.';
  document.body.prepend(div);
}

export function showError(target, message) {
  target.innerHTML = `<div class="card" role="alert"><p class="item-title">Something went wrong</p><p class="note">${esc(message)}</p><a class="btn btn--md btn--outline" href="">Try again</a></div>`;
}

export function toast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), 2600);
}

const never = () => new Promise(() => {});

// Signs the person in (or sends them to sign in), loads their groups and the
// current group's data, records today's visit, and works out the town.
// needGroup: send people with no group to the home screen's welcome.
export async function boot({ needGroup = true } = {}) {
  if (isDemo) showDemoBanner();
  const user = await api.getUser();
  if (!user) {
    location.replace(`signin.html?next=${encodeURIComponent(herePage())}`);
    return never();
  }
  const profile = await api.getProfile(user.id);
  if (!profile) {
    location.replace(`signin.html?step=profile&next=${encodeURIComponent(herePage())}`);
    return never();
  }
  const groups = await api.listMyGroups(user.id);
  const group = groups.find((g) => g.id === store.get('mst.currentGroup')) || groups[0] || null;
  if (!group) {
    if (needGroup) { location.replace('index.html'); return never(); }
    return { user, profile, groups, group: null };
  }
  rememberGroup(group.id);
  applyAccent(group.accent);
  const today = dayKey();
  await api.recordVisit(group.id, today).catch(() => {});
  const data = await api.loadGroup(group.id);
  const town = computeTown({ ...data, today });
  const me = data.members.find((m) => m.user_id === user.id);
  return { user, profile, groups, group: data.group, data, town, me, today };
}
