// My Small Town — data layer.
// Talks to Supabase when js/config.js is filled in; otherwise runs a demo
// backend that keeps everything in this browser's localStorage.
// Both backends expose the same functions, so pages never care which is live.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const isDemo = !SUPABASE_URL || !SUPABASE_ANON_KEY;

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

    async signOut() {
      await sb.auth.signOut();
    },

    async getProfile(userId) {
      const { data, error } = await sb.from('profiles').select('id, display_name, avatar, approved').eq('id', userId).maybeSingle();
      if (error) fail(error);
      return data;
    },

    async saveProfile(userId, { display_name, avatar }) {
      const { error } = await sb.from('profiles').upsert({ id: userId, display_name, avatar });
      if (error) fail(error);
    },

    async listMyGroups(userId) {
      const { data, error } = await sb.from('memberships')
        .select('joined_at, groups (id, name, town_name, accent, invite_code, created_by, created_at)')
        .eq('user_id', userId);
      if (error) fail(error);
      return data.filter((m) => m.groups).map((m) => ({ ...m.groups, joined_at: m.joined_at }))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
    },

    async createGroup({ name, town_name, accent }) {
      const { data, error } = await sb.rpc('create_group', { p_name: name, p_town: town_name, p_accent: accent });
      if (error) fail(error);
      return data;
    },

    async joinGroup(code) {
      const { data, error } = await sb.rpc('join_group', { p_code: code });
      if (error) fail(error);
      return data;
    },

    async updateGroup(groupId, fields) {
      const { error } = await sb.from('groups').update(fields).eq('id', groupId);
      if (error) fail(error);
    },

    async loadGroup(groupId) {
      const [g, m, t, v] = await Promise.all([
        sb.from('groups').select('id, name, town_name, accent, invite_code, created_by, created_at').eq('id', groupId).single(),
        sb.from('memberships').select('user_id, joined_at, profiles (display_name, avatar)').eq('group_id', groupId),
        sb.from('thanks').select('id, author_id, recipient_id, recipient_name, body, day, created_at').eq('group_id', groupId).order('created_at'),
        sb.from('visits').select('user_id, day').eq('group_id', groupId)
      ]);
      for (const r of [g, m, t, v]) if (r.error) fail(r.error);
      return {
        group: g.data,
        members: m.data.map((row) => ({
          user_id: row.user_id,
          joined_at: row.joined_at,
          name: row.profiles?.display_name ?? 'Someone',
          avatar: row.profiles?.avatar
        })),
        thanks: t.data,
        visits: v.data
      };
    },

    async shareThanks(row) {
      const { error } = await sb.from('thanks').insert({ ...row, author_id: cachedUser.id });
      if (error) {
        if (error.code === '23505') throw new Error("You've already shared today's thank-you in this group.");
        fail(error);
      }
    },

    async recordVisit(groupId, day) {
      const { error } = await sb.from('visits')
        .upsert({ group_id: groupId, user_id: cachedUser.id, day }, { onConflict: 'group_id,user_id,day', ignoreDuplicates: true });
      if (error) fail(error);
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
  const isMember = (db, gid, uid) => db.memberships.some((m) => m.group_id === gid && m.user_id === uid);
  const me = (db) => {
    if (!db.session) throw new Error('Please sign in first.');
    return db.session;
  };

  return {
    async getUser() {
      const db = load();
      return db.session ? { id: db.session, email: Object.keys(db.users).find((e) => db.users[e] === db.session) } : null;
    },

    async sendCode() { /* demo mode signs in without an email */ },

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
      return p ? { id: userId, ...p, approved: p.approved !== false } : null;
    },

    async saveProfile(userId, { display_name, avatar }) {
      const db = load();
      db.profiles[userId] = { display_name, avatar };
      save(db);
    },

    async listMyGroups(userId) {
      const db = load();
      return db.memberships.filter((m) => m.user_id === userId)
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

    async joinGroup(code) {
      const db = load();
      const uid = me(db);
      const group = db.groups.find((g) => squash(g.invite_code) === squash(code));
      if (!group) throw new Error('No group has that code. Check it and try again.');
      if (!isMember(db, group.id, uid)) {
        db.memberships.push({ group_id: group.id, user_id: uid, joined_at: new Date().toISOString() });
        save(db);
      }
      return group.id;
    },

    async updateGroup(groupId, fields) {
      const db = load();
      Object.assign(db.groups.find((g) => g.id === groupId), fields);
      save(db);
    },

    async loadGroup(groupId) {
      const db = load();
      return {
        group: db.groups.find((g) => g.id === groupId),
        members: db.memberships.filter((m) => m.group_id === groupId).map((m) => ({
          user_id: m.user_id,
          joined_at: m.joined_at,
          name: db.profiles[m.user_id]?.display_name ?? 'Someone',
          avatar: db.profiles[m.user_id]?.avatar
        })),
        thanks: db.thanks.filter((t) => t.group_id === groupId).sort((a, b) => a.created_at.localeCompare(b.created_at)),
        visits: db.visits.filter((v) => v.group_id === groupId)
      };
    },

    async shareThanks(row) {
      const db = load();
      const uid = me(db);
      if (db.thanks.some((t) => t.group_id === row.group_id && t.author_id === uid && t.day === row.day)) {
        throw new Error("You've already shared today's thank-you in this group.");
      }
      db.thanks.push({ id: uuid(), ...row, author_id: uid, created_at: new Date().toISOString() });
      save(db);
    },

    async recordVisit(groupId, day) {
      const db = load();
      const uid = me(db);
      if (!db.visits.some((v) => v.group_id === groupId && v.user_id === uid && v.day === day)) {
        db.visits.push({ group_id: groupId, user_id: uid, day });
        save(db);
      }
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
