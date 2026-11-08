// My Small Town — data layer.
// Talks to Supabase when js/config.js is filled in; otherwise runs a demo
// backend that keeps everything in this browser's localStorage.
// Both backends expose the same functions, so pages never care which is live.
//
// People vs. accounts: an account is a sign-in (one email). A person is a
// profile. Grown-ups' profile id equals their account id; kids are extra
// profiles managed by a parent's account. Anything a person does (join,
// share, visit) names the person explicitly.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { NOTES_PER_DAY } from './util.js';

export const isDemo = !SUPABASE_URL || !SUPABASE_ANON_KEY;

// Current members get their name and avatar. People who have been deleted
// become anonymous former members, kept only so past weeks add up the same.
function splitMembers(rows, profileOf) {
  const members = [];
  const formerMembers = [];
  for (const r of rows) {
    if (r.left_at) {
      formerMembers.push({ user_id: r.user_id, joined_at: r.joined_at, left_at: r.left_at, name: 'A former member' });
    } else {
      const p = profileOf(r.user_id);
      members.push({ user_id: r.user_id, joined_at: r.joined_at, name: p?.display_name ?? 'Someone', avatar: p?.avatar, is_kid: !!p?.is_kid });
    }
  }
  return { members, formerMembers };
}

const DAILY_LIMIT = `You've already shared ${NOTES_PER_DAY} notes of appreciation today in this group.`;
const NEEDS_007 = 'This needs a database update first: run supabase/migrations/007_note_deletion_and_emails.sql in Supabase (see SETUP.md).';
// True when a query failed only because the database is missing a newer column.
const missingColumn = (error) => !!error && (error.code === '42703' || error.code === 'PGRST204' || /column .* does not exist|Could not find the .* column/i.test(error.message || ''));

// ---------- Supabase ----------

function supabaseBackend(sb) {
  const fail = (error) => { throw new Error(error.message || 'Something went wrong. Please try again.'); };
  let cachedUser;

  return {
    async getUser() {
      const { data, error } = await sb.auth.getSession();
      if (error) fail(error);
      cachedUser = data.session?.user ?? null;
      return cachedUser ? { id: cachedUser.id, email: cachedUser.email } : null;
    },

    async sendCode(email, redirectTo) {
      const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
      if (error) fail(error);
    },

    async verifyCode(email, code) {
      const { error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) fail(error);
    },

    // Finishes sign-in from the link in the email. The link only opens the app;
    // this uses up the one-time sign-in, so email scanners opening it do no harm.
    async verifyLink(tokenHash) {
      const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
      if (error) fail(error);
    },

    async signOut() {
      await sb.auth.signOut();
    },

    // The signed-in grown-up's own profile.
    async getProfile(userId) {
      let { data, error } = await sb.from('profiles').select('id, display_name, avatar, approved, notify').eq('id', userId).maybeSingle();
      // Before update 007 the notify column doesn't exist yet: carry on without it.
      if (missingColumn(error)) ({ data, error } = await sb.from('profiles').select('id, display_name, avatar, approved').eq('id', userId).maybeSingle());
      if (error) fail(error);
      return data;
    },

    async saveProfile(userId, { display_name, avatar }) {
      const { error } = await sb.from('profiles').upsert({ id: userId, display_name, avatar });
      if (error) fail(error);
    },

    // 'instant', 'daily', 'weekly' or 'off'. See supabase/functions/notify-notes.
    async saveNotify(userId, notify) {
      const { error } = await sb.from('profiles').update({ notify }).eq('id', userId);
      if (missingColumn(error)) throw new Error(NEEDS_007);
      if (error) fail(error);
    },

    // Everyone this account manages: the grown-up first, then their kids.
    async listPeople(accountId) {
      const { data, error } = await sb.from('profiles')
        .select('id, display_name, avatar, is_kid, created_at')
        .eq('account_id', accountId)
        .order('is_kid')
        .order('created_at');
      if (error) fail(error);
      return data;
    },

    async addKid({ display_name, avatar, groupIds }) {
      const { data, error } = await sb.rpc('add_kid', { p_name: display_name, p_avatar: avatar, p_groups: groupIds });
      if (error) fail(error);
      return data;
    },

    async updatePerson(personId, { display_name, avatar }) {
      const { error } = await sb.from('profiles').update({ display_name, avatar }).eq('id', personId);
      if (error) fail(error);
    },

    // See delete_person() in supabase/schema.sql for exactly what this keeps and erases.
    async removeKid(personId) {
      const { error } = await sb.rpc('remove_kid', { p_kid: personId });
      if (error) fail(error);
    },

    async listMyGroups(personId) {
      const { data, error } = await sb.from('memberships')
        .select('joined_at, groups (id, name, town_name, accent, invite_code, created_by, created_at)')
        .eq('user_id', personId)
        .is('left_at', null);
      if (error) fail(error);
      return data.filter((m) => m.groups).map((m) => ({ ...m.groups, joined_at: m.joined_at }))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },

    async createGroup({ name, town_name, accent }) {
      const { data, error } = await sb.rpc('create_group', { p_name: name, p_town: town_name, p_accent: accent });
      if (error) fail(error);
      return data;
    },

    async joinGroup(code, personId) {
      const { data, error } = await sb.rpc('join_group', { p_code: code, p_person: personId });
      if (error) fail(error);
      return data;
    },

    async updateGroup(groupId, fields) {
      const { error } = await sb.from('groups').update(fields).eq('id', groupId);
      if (error) fail(error);
    },

    // Deletes the group and its town for everyone. See delete_group() in supabase/schema.sql.
    async deleteGroup(groupId) {
      const { error } = await sb.rpc('delete_group', { p_group: groupId });
      if (error) fail(error);
    },

    async loadGroup(groupId) {
      const notes = (cols) => sb.from('thanks').select(cols).eq('group_id', groupId).order('created_at');
      let [g, m, t, v] = await Promise.all([
        sb.from('groups').select('id, name, town_name, accent, invite_code, created_by, created_at').eq('id', groupId).single(),
        sb.from('memberships').select('user_id, joined_at, left_at').eq('group_id', groupId),
        notes('id, author_id, recipient_id, recipient_name, body, day, created_at, deleted_at'),
        sb.from('visits').select('user_id, day').eq('group_id', groupId)
      ]);
      // Before update 007 the deleted_at column doesn't exist yet: carry on without it.
      if (missingColumn(t.error)) t = await notes('id, author_id, recipient_id, recipient_name, body, day, created_at');
      for (const r of [g, m, t, v]) if (r.error) fail(r.error);
      const ids = m.data.filter((r) => !r.left_at).map((r) => r.user_id);
      const p = await sb.from('profiles').select('id, display_name, avatar, is_kid').in('id', ids);
      if (p.error) fail(p.error);
      const byId = new Map(p.data.map((row) => [row.id, row]));
      return { group: g.data, ...splitMembers(m.data, (id) => byId.get(id)), thanks: t.data, visits: v.data };
    },

    // row.author_id is the person sharing (the grown-up or one of their kids).
    async shareThanks(row) {
      const { error } = await sb.from('thanks').insert(row);
      if (error) {
        if (error.code === '23505') throw new Error(DAILY_LIMIT);
        fail(error);
      }
    },

    // Erases a note's words for everyone; it still counts toward the town. See delete_note().
    async deleteNote(noteId) {
      const { error } = await sb.rpc('delete_note', { p_note: noteId });
      if (error && (error.code === 'PGRST202' || /delete_note/.test(error.message || ''))) throw new Error(NEEDS_007);
      if (error) fail(error);
    },

    async recordVisit(groupId, day, personId) {
      const { error } = await sb.from('visits')
        .upsert({ group_id: groupId, user_id: personId, day }, { onConflict: 'group_id,user_id,day', ignoreDuplicates: true });
      if (error) fail(error);
    },

    // See delete_account() in supabase/schema.sql for exactly what this keeps and erases.
    async deleteMyAccount() {
      const { error } = await sb.rpc('delete_my_account');
      if (error) fail(error);
      await sb.auth.signOut();
    }
  };
}

// ---------- Demo (this browser only) ----------

// Same shape as the database's new_invite_code(): REYES-7KQ3-XM9P.
function inviteCode(name) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const prefix = (name.replace(/^\s*the\s+/i, '').replace(/[^A-Za-z]/g, '').slice(0, 5) || 'TOWN').toUpperCase();
  const chars = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => alphabet[b % alphabet.length]).join('');
  return `${prefix}-${chars.slice(0, 4)}-${chars.slice(4)}`;
}
const squash = (code) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

function demoBackend() {
  const KEY = 'mst.demo';
  const empty = () => ({ users: {}, session: null, profiles: {}, groups: [], memberships: [], thanks: [], visits: [] });
  const load = () => {
    try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return empty(); }
  };
  const save = (db) => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage full or blocked */ } };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
  const me = (db) => {
    if (!db.session) throw new Error('Please sign in first.');
    return db.session;
  };
  // Profiles saved before kid profiles existed belong to themselves.
  const accountOf = (db, personId) => db.profiles[personId]?.account_id ?? personId;
  const controls = (db, personId) => !!db.profiles[personId] && accountOf(db, personId) === me(db);
  const activeMember = (db, gid, personId) => db.memberships.some((m) => m.group_id === gid && m.user_id === personId && !m.left_at);

  // Mirrors delete_person() in supabase/schema.sql.
  function deletePerson(db, person) {
    for (const g of db.groups.filter((x) => x.created_by === person)) {
      const heir = db.memberships
        .filter((m) => m.group_id === g.id && m.user_id !== person && !m.left_at)
        .sort((a, b) => Number(!!db.profiles[a.user_id]?.is_kid) - Number(!!db.profiles[b.user_id]?.is_kid)
          || a.joined_at.localeCompare(b.joined_at) || a.user_id.localeCompare(b.user_id))[0];
      if (heir) {
        g.created_by = heir.user_id;
      } else {
        db.groups = db.groups.filter((x) => x.id !== g.id);
        for (const k of ['memberships', 'thanks', 'visits']) db[k] = db[k].filter((r) => r.group_id !== g.id);
      }
    }
    for (const t of db.thanks) {
      if (t.author_id === person) {
        t.body = null;
        if (!t.recipient_id) t.recipient_name = 'Someone outside the group';
      }
      if (t.recipient_id === person) t.recipient_name = 'A former member';
    }
    const now = new Date().toISOString();
    for (const m of db.memberships) if (m.user_id === person && !m.left_at) m.left_at = now;
    delete db.profiles[person];
  }

  return {
    async getUser() {
      const db = load();
      return db.session ? { id: db.session, email: Object.keys(db.users).find((e) => db.users[e] === db.session) } : null;
    },

    async sendCode() { /* demo mode signs in without an email */ },

    async verifyLink() { throw new Error('Demo mode has no email links.'); },

    async verifyCode(email) {
      const db = load();
      const key = email.trim().toLowerCase();
      db.users[key] = db.users[key] || uuid();
      db.session = db.users[key];
      save(db);
    },

    async signOut() {
      const db = load();
      db.session = null;
      save(db);
    },

    async getProfile(userId) {
      const p = load().profiles[userId];
      // Demo mode has no administrator: everyone is approved unless a test sets approved: false.
      return p ? { id: userId, notify: 'off', ...p, approved: p.approved !== false } : null;
    },

    async saveProfile(userId, { display_name, avatar }) {
      const db = load();
      db.profiles[userId] = { ...db.profiles[userId], display_name, avatar, account_id: userId, is_kid: false, created_at: db.profiles[userId]?.created_at ?? new Date().toISOString() };
      save(db);
    },

    async saveNotify(userId, notify) {
      const db = load();
      db.profiles[userId].notify = notify;
      save(db);
    },

    async listPeople(accountId) {
      const db = load();
      return Object.entries(db.profiles)
        .filter(([id]) => accountOf(db, id) === accountId)
        .map(([id, p]) => ({ id, display_name: p.display_name, avatar: p.avatar, is_kid: !!p.is_kid, created_at: p.created_at ?? '' }))
        .sort((a, b) => Number(a.is_kid) - Number(b.is_kid) || a.created_at.localeCompare(b.created_at));
    },

    async addKid({ display_name, avatar, groupIds = [] }) {
      const db = load();
      const uid = me(db);
      if (Object.values(db.profiles).filter((p) => p.is_kid && p.account_id === uid).length >= 10) {
        throw new Error('An account can manage up to 10 kids.');
      }
      const id = uuid();
      const now = new Date().toISOString();
      db.profiles[id] = { display_name: display_name.trim(), avatar, account_id: uid, is_kid: true, approved: true, created_at: now };
      for (const gid of groupIds) if (activeMember(db, gid, uid)) db.memberships.push({ group_id: gid, user_id: id, joined_at: now });
      save(db);
      return id;
    },

    async updatePerson(personId, { display_name, avatar }) {
      const db = load();
      if (!controls(db, personId)) throw new Error("You can only change yourself or one of your kids.");
      Object.assign(db.profiles[personId], { display_name, avatar });
      save(db);
    },

    async removeKid(personId) {
      const db = load();
      if (!controls(db, personId) || !db.profiles[personId].is_kid) throw new Error("That isn't one of your kids.");
      deletePerson(db, personId);
      save(db);
    },

    async listMyGroups(personId) {
      const db = load();
      return db.memberships.filter((m) => m.user_id === personId && !m.left_at)
        .map((m) => ({ ...db.groups.find((g) => g.id === m.group_id), joined_at: m.joined_at }))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },

    async createGroup({ name, town_name, accent }) {
      const db = load();
      const uid = me(db);
      let code;
      do { code = inviteCode(name); } while (db.groups.some((g) => g.invite_code === code));
      const now = new Date().toISOString();
      const group = { id: uuid(), name: name.trim(), town_name: town_name.trim(), accent, invite_code: code, created_by: uid, created_at: now };
      db.groups.push(group);
      db.memberships.push({ group_id: group.id, user_id: uid, joined_at: now });
      save(db);
      return group.id;
    },

    async joinGroup(code, personId) {
      const db = load();
      const person = personId || me(db);
      if (!controls(db, person)) throw new Error('You can only join as yourself or one of your kids.');
      const group = db.groups.find((g) => squash(g.invite_code) === squash(code));
      if (!group) throw new Error('No group has that code. Check it and try again.');
      if (!db.memberships.some((m) => m.group_id === group.id && m.user_id === person)) {
        db.memberships.push({ group_id: group.id, user_id: person, joined_at: new Date().toISOString() });
        save(db);
      }
      return group.id;
    },

    async updateGroup(groupId, fields) {
      const db = load();
      Object.assign(db.groups.find((g) => g.id === groupId), fields);
      save(db);
    },

    async deleteGroup(groupId) {
      const db = load();
      const group = db.groups.find((g) => g.id === groupId);
      if (!group || !controls(db, group.created_by)) throw new Error('Only the person who owns this group can delete its town.');
      db.groups = db.groups.filter((g) => g.id !== groupId);
      for (const k of ['memberships', 'thanks', 'visits']) db[k] = db[k].filter((r) => r.group_id !== groupId);
      save(db);
    },

    async loadGroup(groupId) {
      const db = load();
      return {
        group: db.groups.find((g) => g.id === groupId),
        ...splitMembers(db.memberships.filter((m) => m.group_id === groupId), (id) => db.profiles[id]),
        thanks: db.thanks.filter((t) => t.group_id === groupId).sort((a, b) => a.created_at.localeCompare(b.created_at)),
        visits: db.visits.filter((v) => v.group_id === groupId)
      };
    },

    async shareThanks(row) {
      const db = load();
      if (!controls(db, row.author_id) || !activeMember(db, row.group_id, row.author_id)) {
        throw new Error('You can only share as yourself or one of your kids.');
      }
      if (db.thanks.filter((t) => t.group_id === row.group_id && t.author_id === row.author_id && t.day === row.day).length >= NOTES_PER_DAY) {
        throw new Error(DAILY_LIMIT);
      }
      db.thanks.push({ id: uuid(), ...row, created_at: new Date().toISOString() });
      save(db);
    },

    async deleteNote(noteId) {
      const db = load();
      const note = db.thanks.find((t) => t.id === noteId);
      if (!note || !controls(db, note.author_id)) throw new Error('You can only delete your own notes.');
      note.body = null;
      note.deleted_at = new Date().toISOString();
      if (!note.recipient_id) note.recipient_name = 'Someone outside the group';
      save(db);
    },

    async recordVisit(groupId, day, personId) {
      const db = load();
      if (!controls(db, personId) || !activeMember(db, groupId, personId)) return;
      if (!db.visits.some((v) => v.group_id === groupId && v.user_id === personId && v.day === day)) {
        db.visits.push({ group_id: groupId, user_id: personId, day });
        save(db);
      }
    },

    // Mirrors delete_account() in supabase/schema.sql.
    async deleteMyAccount() {
      const db = load();
      const uid = me(db);
      for (const [id, p] of Object.entries(db.profiles)) if (p.is_kid && p.account_id === uid) deletePerson(db, id);
      deletePerson(db, uid);
      for (const [email, id] of Object.entries(db.users)) if (id === uid) delete db.users[email];
      db.session = null;
      save(db);
    }
  };
}

async function pickBackend() {
  if (isDemo) return demoBackend();
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
  return supabaseBackend(createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
  }));
}

export const api = await pickBackend();
