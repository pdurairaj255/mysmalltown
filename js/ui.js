// My Small Town — what every screen does on load, plus small UI helpers.

import { api, isDemo } from './api.js';
import { computeTown } from './town.js';
import { esc, dayKey } from './util.js';
import { portrait, tintOf, shirtOf, AVATARS, AGE_GROUPS } from './avatars.js';

export { api, isDemo, portrait, tintOf, shirtOf, AVATARS, AGE_GROUPS };

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

// A person's round avatar portrait. Decorative: their name is always shown beside it.
export function avatar(person, size = '') {
  return `<span class="avatar avatar--pic ${size}" aria-hidden="true">${portrait(person?.avatar)}</span>`;
}

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } }
};
export const rememberGroup = (id) => store.set('mst.currentGroup', id);

// Who is using the app right now: the grown-up or one of their kids. Kept
// per device. "Chosen" lasts until the app is closed, so a family device asks
// "Who's using the app?" each time it's opened.
const session = {
  get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* private mode */ } }
};
export function setActivePerson(id) {
  store.set('mst.activePerson', id);
  session.set('mst.whoChosen', '1');
}

// Every avatar as a radio button, grouped by age. name: the radio group name.
export function avatarPicker(name = 'avatar') {
  return AGE_GROUPS.map((age) => `
    <fieldset class="avatar-group">
      <legend>${age}</legend>
      <div class="avatar-grid">
        ${AVATARS.filter((v) => v.age === age).map((v) => `
          <label class="avatar-choice" title="${esc(v.label)}">
            <input type="radio" name="${name}" value="${v.id}">
            <span class="pic">${portrait(v.id)}</span>
            <span class="sr-only">${esc(v.label)}</span>
          </label>`).join('')}
      </div>
    </fieldset>`).join('');
}

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

// Signs the account in (or sends them to sign in), works out who is using
// the app, loads that person's groups and the current group's data, records
// today's visit, and works out the town.
// needGroup: send people with no group to the home screen's welcome.
// choosing: this is the "Who's using the app?" screen itself.
export async function boot({ needGroup = true, choosing = false } = {}) {
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
  if (!profile.approved) {
    location.replace(`signin.html?step=waiting&next=${encodeURIComponent(herePage())}`);
    return never();
  }
  const people = await api.listPeople(user.id);
  const person = people.find((p) => p.id === store.get('mst.activePerson')) || people.find((p) => p.id === user.id)
    || { id: user.id, display_name: profile.display_name, avatar: profile.avatar, is_kid: false };
  if (!choosing && people.some((p) => p.is_kid) && !session.get('mst.whoChosen')) {
    location.replace(`who.html?next=${encodeURIComponent(herePage())}`);
    return never();
  }
  const base = { user, profile, people, person, hasKids: people.some((p) => p.is_kid) };
  const groups = await api.listMyGroups(person.id);
  const group = groups.find((g) => g.id === store.get('mst.currentGroup')) || groups[0] || null;
  if (!group) {
    if (needGroup) { location.replace('index.html'); return never(); }
    return { ...base, groups, group: null };
  }
  rememberGroup(group.id);
  applyAccent(group.accent);
  const today = dayKey();
  await api.recordVisit(group.id, today, person.id).catch(() => {});
  const data = await api.loadGroup(group.id);
  const town = computeTown({ ...data, today });
  // "me" is whoever is using the app, so "you" on every screen means them.
  const me = data.members.find((m) => m.user_id === person.id);
  return { ...base, groups, group: data.group, data, town, me, today };
}
