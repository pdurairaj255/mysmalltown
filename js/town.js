// My Small Town — how a town grows, and how to draw it.
//
// Rules (the same ones the Year ahead screen explains):
// - Weeks run Monday–Sunday, counted from the week the group started.
// - When a week ends with at least two-thirds of the group having shared a
//   thank-you, the next piece of the current building goes up. 52 pieces in all.
// - A quiet week still adds something small (a tree or a flower bed).
// - Anyone who visits on 3 or more days in a week lights a streetlight.
// - Thank-yous to people outside the group bring visitors that week.
// - Each townsperson is at home, out and about, helping or leading, based on
//   what they did this week.

import { esc, dayKey, addDays, daysBetween, mondayOf, possessive, listNames } from './util.js';

const INK = '#221A47';
const SLAB = '#8F86B5';
const SKIN = ['#C68A5B', '#E8B48A', '#7A4E2D', '#F1C9A5'];

// ---------- Buildings ----------

const FIRST_HOMES = [[26, 214, 46, 36, '#FF7A59', '#FFE98F'], [86, 218, 38, 28, '#FF7EB6'], [222, 162, 28, 22, '#9B7BFF']];
const MORE_HOMES = [[268, 164, 30, 24, 'accent'], [14, 160, 26, 20, '#4FB7FF'], [46, 156, 22, 18, '#FF7A59']];
const EVEN_MORE_HOMES = [[300, 160, 24, 20, '#FF7EB6'], [128, 226, 22, 18, '#9B7BFF'], [236, 244, 22, 18, '#FF7A59'], [2, 240, 20, 16, '#4FB7FF']];
const SHOP_COLORS = ['#FF7A59', '#4FB7FF', '#FF7EB6', '#FFD23F', '#9B7BFF', '#3DD49A'];

const homesBuilding = (homes) => ({
  draw: (b, d) => homes.slice(0, b).map((h) => d.house(...h)).join(''),
  ghost: (b, d) => homes.slice(b).map((h) => d.ghostHouse(...h)).join(''),
  anchors: homes.map(([x, base, w, h]) => [x + w / 2, base - h])
});

export const BUILDINGS = [
  {
    name: 'First homes', blurb: 'One home, then two neighbors.',
    stages: ['Home', 'Home', 'Home'],
    phrases: ['The first home went up', "A neighbor's home went up", 'A third home went up on the hill'],
    ...homesBuilding(FIRST_HOMES)
  },
  {
    name: 'Community center', blurb: 'A place for the whole town to gather.',
    stages: ['Base', 'Walls', 'Roof'],
    phrases: ['The community center foundation was laid', 'The community center walls went up', 'The community center opened its doors'],
    draw: (b, d) => [
      b >= 1 ? d.rect(258, 221, 58, 4, SLAB) : '',
      b >= 2 ? d.rect(262, 192, 50, 32, '#4FB7FF') : '',
      b >= 3 ? d.rect(258, 186, 58, 7, INK) + d.rect(266, 199, 42, 7, '#FF7A59') + d.rect(281, 210, 12, 14, INK) : ''
    ].join(''),
    ghost: (b, d) => d.ghostRect(258, 186, 58, 38),
    anchors: [[287, 222], [287, 205], [287, 188]],
    crane: [330, 224, 160, 296, 346, 306, 182]
  },
  {
    name: 'More homes', blurb: 'Two more houses. Anyone who joins the group arrives with a suitcase and moves in.',
    stages: ['Home', 'Home', 'Home'],
    phrases: ['A new home went up on the hill', 'A little blue house went up', 'Another home went up on the hill'],
    ...homesBuilding(MORE_HOMES)
  },
  {
    name: 'Schoolhouse', blurb: 'Five pieces: base, frame, walls, roof and bell tower.',
    stages: ['Base', 'Frame', 'Walls', 'Roof', 'Bell tower'],
    phrases: ['The schoolhouse foundation was poured', 'The schoolhouse frame went up', 'The schoolhouse walls went up', 'The schoolhouse got its roof', 'The schoolhouse bell rang for the first time'],
    draw: (b, d) => [
      b >= 1 ? d.rect(86, 146, 66, 5, SLAB) : '',
      b === 2 ? `<rect x="88" y="106" width="62" height="40" fill="none" stroke="${INK}" stroke-width="1.5"/><line x1="108" y1="106" x2="108" y2="146" stroke="${INK}" stroke-width="1.5"/><line x1="130" y1="106" x2="130" y2="146" stroke="${INK}" stroke-width="1.5"/>` : '',
      b >= 3 ? `<rect x="88" y="106" width="62" height="40" fill="#FFC2B0" stroke="${INK}" stroke-width="1.5"/><rect x="96" y="114" width="10" height="10" fill="#FFFFFF" stroke="${INK}"/><rect x="132" y="114" width="10" height="10" fill="#FFFFFF" stroke="${INK}"/>` + d.rect(113, 128, 12, 18, INK) : '',
      b >= 4 ? `<polygon points="84,107 119,86 154,107" fill="${INK}"/>` : '',
      b >= 5 ? d.rect(112, 72, 14, 15, 'accent', `stroke="${INK}"`) + `<polygon points="109,73 119,63 129,73" fill="${INK}"/>` : ''
    ].join(''),
    ghost: (b, d) => (b < 3 ? d.ghostRect(88, 106, 62, 40) : '')
      + (b < 4 ? `<polygon points="84,107 119,86 154,107" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="4 3"/>` : '')
      + d.ghostRect(112, 72, 14, 15),
    anchors: [[119, 148], [119, 126], [119, 126], [119, 96], [119, 78]],
    crane: [168, 150, 60, 132, 194, 142, 90]
  },
  {
    name: 'More homes', blurb: 'Room for more family and friends to join and move in.',
    stages: ['Home', 'Home', 'Home', 'Home'],
    phrases: ['A pink house went up on the hill', 'A cottage went up by the road', 'A home went up by the community center', 'A little house went up at the edge of town'],
    ...homesBuilding(EVEN_MORE_HOMES)
  },
  {
    name: 'Hospital', blurb: 'Eight small steps, from foundation to opening day.',
    stages: ['Base', 'Frame', 'Walls', 'Windows', 'Roof', 'Sign', 'Doors', 'Flag'],
    phrases: ['The hospital foundation was laid', 'The hospital frame went up', 'The hospital walls went up', 'The hospital windows went in', 'The hospital got its roof', 'The hospital sign went up', 'The hospital doors were hung', 'The hospital opened, flag flying'],
    draw: (b, d) => [
      b >= 1 ? d.rect(175, 149, 42, 4, SLAB) : '',
      b === 2 ? `<rect x="178" y="124" width="36" height="26" fill="none" stroke="${INK}" stroke-width="1.5"/><line x1="196" y1="124" x2="196" y2="150" stroke="${INK}" stroke-width="1.5"/>` : '',
      b >= 3 ? `<rect x="178" y="124" width="36" height="26" fill="#FFFFFF" stroke="${INK}"/>` : '',
      b >= 4 ? `<rect x="181" y="128" width="7" height="7" fill="#B5E0FF" stroke="${INK}" stroke-width="0.8"/><rect x="204" y="128" width="7" height="7" fill="#B5E0FF" stroke="${INK}" stroke-width="0.8"/>` : '',
      b >= 5 ? d.rect(175, 119, 42, 6, INK) : '',
      b >= 6 ? d.rect(194, 127, 4, 11, '#FF7A59') + d.rect(190.5, 130.5, 11, 4, '#FF7A59') : '',
      b >= 7 ? d.rect(191, 141, 10, 9, INK) : '',
      b >= 8 ? `<line x1="214" y1="119" x2="214" y2="103" stroke="${INK}" stroke-width="1.5"/><polygon points="214,103 226,107 214,111" ${d.fill('accent')}/>` : ''
    ].join(''),
    ghost: (b, d) => (b < 5 ? d.ghostRect(175, 119, 42, 34) : ''),
    anchors: [[196, 150], [196, 136], [196, 136], [196, 132], [196, 120], [196, 132], [196, 145], [220, 107]],
    crane: [166, 150, 96, 150, 200, 190, 112]
  },
  {
    name: 'Main street', blurb: 'A row of little shops along the far ridge.',
    stages: ['Shop', 'Shop', 'Shop', 'Shop', 'Shop', 'Shop'],
    phrases: ['The bakery opened on main street', 'The hardware store opened', 'A flower shop opened', 'The corner cafe opened', 'A bookshop opened', 'The market opened, finishing main street'],
    draw: (b, d) => Array.from({ length: b }, (_, i) => {
      const x = 156 + i * 13, base = Math.round(117 - (x - 150) * 0.15);
      return d.rect(x, base - 11, 11, 11, SHOP_COLORS[i]) + d.rect(x - 1, base - 13, 13, 3, INK) + d.rect(x + 4, base - 5, 3, 5, INK);
    }).join(''),
    ghost: () => '',
    anchors: Array.from({ length: 6 }, (_, i) => [161 + i * 13, 100])
  },
  {
    name: 'Park', blurb: 'Trees, a bench and a fountain on the west ridge.',
    stages: ['Tree', 'Tree', 'Bench', 'Fountain', 'Tree', 'Flowers'],
    phrases: ['The park got its first tree', 'A second tree grew in the park', 'A bench went in at the park', 'The park fountain started flowing', 'Another tree grew in the park', 'Flowers bloomed in the park'],
    draw: (b, d) => [
      b >= 1 ? d.tree(10, 106, 6) : '',
      b >= 2 ? d.tree(26, 102, 7) : '',
      b >= 3 ? d.rect(36, 108, 13, 3, '#7A4E2D') + d.rect(37, 111, 2, 3, '#7A4E2D') + d.rect(46, 111, 2, 3, '#7A4E2D') : '',
      b >= 4 ? `<ellipse cx="58" cy="111" rx="7" ry="2.5" fill="#4FB7FF" stroke="${INK}" stroke-width="0.6"/><rect x="57" y="101" width="2" height="9" fill="#4FB7FF"/>` : '',
      b >= 5 ? d.tree(72, 104, 5) : '',
      b >= 6 ? d.flowers(6, 116, 0.6) : ''
    ].join(''),
    ghost: () => '',
    anchors: [[10, 100], [26, 96], [42, 106], [58, 104], [72, 98], [12, 114]]
  },
  {
    name: 'Library', blurb: 'A library with columns and a lamp on each side.',
    stages: ['Base', 'Steps', 'Walls', 'Columns', 'Roof', 'Sign', 'Lamps'],
    phrases: ['The library foundation was laid', 'The library steps went in', 'The library walls went up', 'The library columns went up', 'The library got its roof', 'The library sign went up', 'The library lamps came on'],
    draw: (b, d) => [
      b >= 1 ? d.rect(240, 103, 40, 3, SLAB) : '',
      b >= 2 ? d.rect(244, 100, 32, 3, '#E2DCF7') : '',
      b >= 3 ? d.rect(246, 85, 28, 15, '#FFE98F') : '',
      b >= 4 ? [250, 256, 264, 270].map((x) => `<line x1="${x}" y1="86" x2="${x}" y2="100" stroke="${INK}" stroke-width="1.5"/>`).join('') : '',
      b >= 5 ? `<polygon points="243,86 260,75 277,86" fill="${INK}"/>` : '',
      b >= 6 ? d.rect(254, 88, 12, 3, 'accent') : '',
      b >= 7 ? [238, 282].map((x) => `<line x1="${x}" y1="103" x2="${x}" y2="93" stroke="${INK}" stroke-width="1.2"/><circle cx="${x}" cy="92" r="2" ${d.fill('accent')}/>`).join('') : ''
    ].join(''),
    ghost: (b, d) => (b < 5 ? d.ghostRect(243, 75, 34, 31) : ''),
    anchors: [[260, 104], [260, 101], [260, 92], [260, 92], [260, 80], [260, 89], [238, 92]]
  },
  {
    name: 'Town square', blurb: 'A plaza with a fountain, benches and a clock tower.',
    stages: ['Plaza', 'Fountain', 'Bench', 'Bench', 'Tree', 'Tree', 'Clock'],
    phrases: ['The town square was paved', 'The square fountain started flowing', 'A bench went in on the square', 'A second bench went in on the square', 'A tree grew on the square', 'Another tree grew on the square', 'The clock tower struck noon. The town is complete!'],
    draw: (b, d) => [
      b >= 1 ? `<ellipse cx="318" cy="104" rx="26" ry="4" fill="#E2DCF7"/>` : '',
      b >= 2 ? `<ellipse cx="318" cy="103" rx="6" ry="2" fill="#4FB7FF" stroke="${INK}" stroke-width="0.6"/><rect x="317" y="95" width="2" height="7" fill="#4FB7FF"/>` : '',
      b >= 3 ? d.rect(298, 100, 10, 2.5, '#7A4E2D') : '',
      b >= 4 ? d.rect(328, 100, 10, 2.5, '#7A4E2D') : '',
      b >= 5 ? d.tree(292, 94, 5) : '',
      b >= 6 ? d.tree(345, 93, 5) : '',
      b >= 7 ? d.rect(306, 80, 7, 16, '#FF7EB6') + `<polygon points="304,81 309.5,74 315,81" fill="${INK}"/><circle cx="309.5" cy="86" r="2.2" fill="#FFFFFF" stroke="${INK}" stroke-width="0.6"/>` : ''
    ].join(''),
    ghost: () => '',
    anchors: [[318, 104], [318, 98], [303, 98], [333, 98], [292, 90], [345, 89], [309, 80]]
  }
];

export const TOTAL_PIECES = BUILDINGS.reduce((n, b) => n + b.stages.length, 0);
const FILL_IN_START = BUILDINGS.slice(0, 6).reduce((n, b) => n + b.stages.length, 0);

BUILDINGS.reduce((offset, b) => { b.offset = offset; return offset + b.stages.length; }, 0);

// Where construction stands after `pieces` pieces are built.
export function progressAt(pieces) {
  const index = BUILDINGS.findIndex((b) => pieces < b.offset + b.stages.length);
  if (index === -1) {
    const last = BUILDINGS[BUILDINGS.length - 1];
    return { done: true, index: BUILDINGS.length - 1, building: last, built: last.stages.length, total: last.stages.length };
  }
  const building = BUILDINGS[index];
  return { done: false, index, building, built: pieces - building.offset, total: building.stages.length };
}

export function pieceInfo(piece) {
  const { building, built } = progressAt(piece);
  return { building, stage: building.stages[built], phrase: building.phrases[built] };
}

// Quiet-week additions, in the order they appear.
const EXTRA_SLOTS = [
  ['tree', 148, 194, 12], ['flowers', 24, 226], ['tree', 234, 203, 10], ['tree', 338, 128, 9],
  ['flowers', 90, 228], ['tree', 8, 186, 8], ['tree', 330, 194, 9], ['flowers', 262, 232], ['tree', 76, 146, 6]
];
export const extraPhrase = (i) => (EXTRA_SLOTS[i % EXTRA_SLOTS.length][0] === 'tree' ? 'A new tree grew by the road' : 'Flowers bloomed in town');

const LIGHT_SLOTS = [[140, 240], [172, 204], [210, 178], [166, 162], [226, 222], [154, 180], [250, 176], [120, 244], [196, 250], [80, 176], [330, 170], [12, 170]];
// Kept above y≈232 so name tags (drawn 20px below) stay inside the 260px scene.
const PEOPLE_SLOTS = [[160, 222], [192, 226], [250, 222], [300, 228], [112, 228], [60, 226], [226, 232], [330, 230]];
const VISITOR_SLOTS = [[208, 212], [186, 242], [176, 186]];

// ---------- Rules ----------

export const STATUS = {
  home: { label: 'At home', bg: 'var(--line)' },
  out: { label: 'Out and about', bg: 'var(--sky-tint)' },
  helping: { label: 'Helping', bg: 'var(--mint-tint)' },
  leading: { label: 'Leading', bg: 'var(--accent)' }
};

export function statusText(status, buildingName) {
  const site = buildingName.toLowerCase();
  return {
    leading: `Leading the crew on the ${site}`,
    helping: `Helping build the ${site}`,
    out: 'Out and about in town',
    home: 'Relaxing at home'
  }[status];
}

export const goalFor = (memberCount) => Math.max(1, Math.ceil((memberCount * 2) / 3));

export function computeTown({ group, members, thanks, visits, today = dayKey() }) {
  const start = mondayOf(dayKey(group.created_at));
  const weekOf = (day) => Math.floor(daysBetween(start, day) / 7);
  const currentIndex = Math.max(0, weekOf(today));

  const weeks = Array.from({ length: currentIndex + 1 }, (_, i) => ({
    index: i,
    number: i + 1,
    start: addDays(start, i * 7),
    end: addDays(start, i * 7 + 6),
    complete: i < currentIndex,
    thanks: [],
    visitDays: new Map()
  }));
  for (const t of thanks) {
    const w = weeks[weekOf(t.day)];
    if (w) w.thanks.push(t);
  }
  for (const v of visits) {
    const w = weeks[weekOf(v.day)];
    if (!w) continue;
    if (!w.visitDays.has(v.user_id)) w.visitDays.set(v.user_id, []);
    w.visitDays.get(v.user_id).push(v.day);
  }

  let pieces = 0, extras = 0, lights = 0;
  for (const w of weeks) {
    w.members = members.filter((m) => dayKey(m.joined_at) <= w.end);
    w.sharers = new Set(w.thanks.map((t) => t.author_id));
    w.goal = goalFor(w.members.length);
    w.goalMet = w.sharers.size >= w.goal;
    w.lit = [...w.visitDays].filter(([, days]) => days.length >= 3)
      .map(([user_id, days]) => ({ user_id, day: days.sort()[2] }));
    w.outsiders = w.thanks.filter((t) => !t.recipient_id);
    w.before = { pieces, extras, lights };
    lights += w.lit.length;
    if (w.complete) {
      if (w.goalMet && pieces < TOTAL_PIECES) w.newPiece = pieces++;
      else if (!w.goalMet) w.newExtra = extras++;
    }
    w.after = { pieces, extras, lights };
  }

  const town = { group, members, start, weeks, current: weeks[currentIndex], completed: weeks.filter((w) => w.complete) };
  town.state = sceneState(town, town.current);
  town.progress = progressAt(town.state.pieces);
  town.news = buildNews(town);
  return town;
}

export function statusFor(userId, week) {
  const shared = week.thanks.filter((t) => t.author_id === userId).length;
  const received = week.thanks.filter((t) => t.recipient_id === userId).length;
  if (shared >= 2 || (shared >= 1 && received >= 2)) return 'leading';
  if (shared >= 1) return 'helping';
  if ((week.visitDays.get(userId) || []).length) return 'out';
  return 'home';
}

// What the town looks like at the end of `week` ("before" = at its start).
export function sceneState(town, week, { before = false } = {}) {
  if (!week) return { pieces: 0, extras: 0, lights: 0, people: [], visitors: 0 };
  const counts = before ? week.before : week.after;
  const prev = before ? town.weeks[week.index - 1] : week;
  return {
    ...counts,
    people: (prev ? prev.members : []).map((m) => ({ name: m.name, color: m.color, status: prev ? statusFor(m.user_id, prev) : 'home' })),
    visitors: prev ? prev.outsiders.length : 0
  };
}

const nameOf = (town, id) => town.members.find((m) => m.user_id === id)?.name ?? 'Someone';

// What changed in a finished week, for the Sunday recap.
export function weekChanges(town, week) {
  const items = [];
  if (week.newPiece !== undefined) {
    const credit = week.thanks[week.thanks.length - 1];
    items.push({
      kind: 'build',
      title: pieceInfo(week.newPiece).phrase,
      detail: `${week.sharers.size} of ${week.members.length} shared a thank-you, meeting the goal of ${week.goal}` +
        (credit ? `. Last one: ${possessive(nameOf(town, credit.author_id))} thank-you to ${credit.recipient_name}` : '')
    });
  } else if (week.newExtra !== undefined) {
    items.push({
      kind: 'extra',
      title: extraPhrase(week.newExtra),
      detail: `A quiet week: ${week.sharers.size} of ${week.goal} needed shared a thank-you. The town never goes backward.`
    });
  }
  if (week.lit.length) {
    items.push({
      kind: 'light',
      title: week.lit.length === 1 ? 'A streetlight came on' : `${week.lit.length} streetlights came on`,
      detail: `${listNames(week.lit.map((l) => nameOf(town, l.user_id)))} stopped by 3 or more days`
    });
  }
  for (const t of week.outsiders) {
    items.push({ kind: 'visitor', title: 'A traveler passed through town', detail: `From ${possessive(nameOf(town, t.author_id))} thank-you to ${t.recipient_name}` });
  }
  return items;
}

function buildNews(town) {
  const news = [];
  for (const m of town.members) {
    if (m.user_id === town.group.created_by) continue;
    news.push({ day: dayKey(m.joined_at), kind: 'join', member: m, text: `${m.name} joined the group and moved into town.` });
  }
  news.push({ day: dayKey(town.group.created_at), kind: 'start', text: `${town.group.town_name} was founded in an empty meadow.` });
  for (const w of town.weeks) {
    if (w.newPiece !== undefined) news.push({ day: addDays(w.end, 0), kind: 'build', text: `${pieceInfo(w.newPiece).phrase}.` });
    if (w.newExtra !== undefined) news.push({ day: w.end, kind: 'extra', text: `${extraPhrase(w.newExtra)} after a quiet week.` });
    for (const l of w.lit) news.push({ day: l.day, kind: 'light', member: town.members.find((m) => m.user_id === l.user_id), text: `${nameOf(town, l.user_id)} lit a streetlight with a third visit this week.` });
    for (const t of w.outsiders) news.push({ day: t.day, kind: 'visitor', text: `A traveler arrived, thanks to ${possessive(nameOf(town, t.author_id))} thank-you to ${t.recipient_name}.` });
  }
  return news.sort((a, b) => b.day.localeCompare(a.day));
}

// ---------- Drawing ----------

function drawing(accent) {
  const fill = (c) => (c === 'accent' ? (accent ? `fill="${accent}"` : 'class="a-fill"') : `fill="${c}"`);
  const d = {
    fill,
    rect: (x, y, w, h, c, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${fill(c)} ${extra}/>`,
    ghostRect: (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="4 3"/>`,
    house(x, base, w, h, c, door = INK) {
      const top = base - h, roof = Math.round(h * 0.62);
      const dw = Math.max(5, Math.round(w * 0.26)), dh = Math.round(h * 0.5);
      let s = d.rect(x, top, w, h, c) + `<polygon points="${x - 5},${top + 2} ${x + w / 2},${top - roof} ${x + w + 5},${top + 2}" fill="${INK}"/>`;
      s += d.rect(x + (w - dw) / 2, base - dh, dw, dh, door);
      if (w >= 28) {
        const ws = Math.round(w * 0.19), wy = top + Math.round(h * 0.22);
        s += d.rect(x + Math.round(w * 0.11), wy, ws, ws, '#FFFFFF') + d.rect(x + w - Math.round(w * 0.11) - ws, wy, ws, ws, '#FFFFFF');
      }
      return s;
    },
    ghostHouse(x, base, w, h) {
      const top = base - h, roof = Math.round(h * 0.62);
      return d.ghostRect(x, top, w, h) + `<polygon points="${x - 5},${top + 2} ${x + w / 2},${top - roof} ${x + w + 5},${top + 2}" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    },
    tree: (x, y, r) => `<rect x="${x - 2}" y="${y + r - 4}" width="4" height="${Math.round(r * 0.9) + 4}" fill="#7A4E2D"/><circle cx="${x}" cy="${y}" r="${r}" fill="#1E9E6E"/>`,
    flowers: (x, y, s = 1) => [['#FF7EB6', 0, 0], ['accent', 10, 4], ['#9B7BFF', 22, 0], ['#FF7EB6', 34, 4]]
      .map(([c, dx, dy]) => `<circle cx="${x + dx * s}" cy="${y + dy * s}" r="${3.5 * s}" ${fill(c)}/>`).join(''),
    light: (x, y) => `<line x1="${x}" y1="${y + 18}" x2="${x}" y2="${y}" stroke="${INK}" stroke-width="2"/><circle cx="${x}" cy="${y - 2}" r="3.5" ${fill('accent')} stroke="${INK}" stroke-width="1"/>`,
    crane: ([mx, my0, my1, jx0, jx1, hx, hy]) =>
      `<line x1="${mx}" y1="${my0}" x2="${mx}" y2="${my1}" stroke="#FF7A59" stroke-width="3"/><line x1="${jx0}" y1="${my1 + 2}" x2="${jx1}" y2="${my1 + 2}" stroke="#FF7A59" stroke-width="3"/>` +
      `<line x1="${hx}" y1="${my1 + 2}" x2="${hx}" y2="${hy}" stroke="${INK}" stroke-width="1.5"/>` + d.rect(hx - 9, hy, 18, 4, 'accent', `stroke="${INK}"`),
    sparkle: (x, y) => `<path d="M${x} ${y - 8} L${x + 2} ${y - 2} L${x + 8} ${y} L${x + 2} ${y + 2} L${x} ${y + 8} L${x - 2} ${y + 2} L${x - 8} ${y} L${x - 2} ${y - 2} Z" ${fill('accent')} stroke="${INK}" stroke-width="1"/>`,
    person(x, y, color, skin, hat) {
      let s = `<circle cx="${x}" cy="${y}" r="4.5" fill="${skin}"/><rect x="${x - 4.5}" y="${y + 5}" width="9" height="13" rx="3" fill="${esc(color)}" stroke="${INK}" stroke-width="0.8"/>`;
      if (hat) s += `<path d="M${x - 5} ${y - 1} a5 5 0 0 1 10 0 z" ${fill('accent')} stroke="${INK}" stroke-width="0.6"/>`;
      return s;
    },
    tag(x, y, name) {
      const label = esc(name.split(' ')[0].slice(0, 10));
      const w = Math.max(24, label.length * 4.6 + 9);
      return `<rect x="${x - w / 2}" y="${y}" width="${w}" height="11" rx="5.5" fill="#FFFFFF" stroke="${INK}" stroke-width="0.8"/><text x="${x}" y="${y + 8.3}" text-anchor="middle" font-family="Figtree, sans-serif" font-size="8" font-weight="700" fill="${INK}">${label}</text>`;
    }
  };
  return d;
}

function extraAt(i, d) {
  const [kind, x, y, r] = EXTRA_SLOTS[i];
  return kind === 'tree' ? d.tree(x, y, r) : d.flowers(x, y);
}

// state: { pieces, extras, lights, people: [{ name, color, status }], visitors }
// opts:  { accent (literal color, for exported images), labels, since (an
//          earlier state; new things get sparkles), viewBox, title }
export function renderScene(state, opts = {}) {
  const { accent, labels = true, since = null, viewBox = '0 0 350 260', title } = opts;
  const d = drawing(accent);
  const parts = [
    `<rect x="0" y="0" width="350" height="260" fill="#B5E0FF"/>`,
    `<circle cx="300" cy="48" r="20" ${d.fill('accent')}/>`,
    `<ellipse cx="70" cy="45" rx="26" ry="11" fill="#FFFFFF"/><ellipse cx="92" cy="40" rx="18" ry="12" fill="#FFFFFF"/><ellipse cx="220" cy="30" rx="22" ry="9" fill="#FFFFFF"/>`
  ];
  if (state.pieces >= FILL_IN_START) {
    parts.push(`<path d="M150 116 Q235 92 350 106 L350 160 L150 160 Z" fill="#CFF7E4"/><path d="M0 122 Q70 100 150 118 L150 160 L0 160 Z" fill="#CFF7E4"/>`);
  }
  parts.push(
    `<path d="M0 165 Q80 125 175 150 Q260 172 350 140 L350 260 L0 260 Z" fill="#A8F0CF"/>`,
    `<path d="M0 205 Q110 180 210 200 Q290 214 350 196 L350 260 L0 260 Z" fill="#3DD49A"/>`,
    `<path d="M215 262 C205 235 175 225 182 200 C186 186 200 178 196 165" stroke="#FFE98F" stroke-width="12" stroke-linecap="round" fill="none"/>`
  );

  for (let i = 0; i < Math.min(state.extras, EXTRA_SLOTS.length); i++) parts.push(extraAt(i, d));

  const progress = progressAt(state.pieces);
  for (const b of BUILDINGS) {
    const built = Math.max(0, Math.min(b.stages.length, state.pieces - b.offset));
    if (built) parts.push(b.draw(built, d));
    if (!progress.done && b === progress.building) {
      parts.push(b.ghost(built, d));
      if (built && b.crane) parts.push(d.crane(b.crane));
    }
  }

  for (let i = 0; i < Math.min(state.lights, LIGHT_SLOTS.length); i++) parts.push(d.light(...LIGHT_SLOTS[i]));

  (state.people || []).slice(0, PEOPLE_SLOTS.length).forEach((p, i) => {
    const [x, y] = PEOPLE_SLOTS[i];
    parts.push(d.person(x, y, p.color, SKIN[i % SKIN.length], p.status === 'leading' || p.status === 'helping'));
    if (labels) parts.push(d.tag(x, y + 20, p.name));
  });
  for (let i = 0; i < Math.min(state.visitors || 0, VISITOR_SLOTS.length); i++) {
    const [x, y] = VISITOR_SLOTS[i];
    parts.push(d.person(x, y, i % 2 ? '#4FB7FF' : '#FF7EB6', SKIN[(i + 1) % SKIN.length], false), d.rect(x - 11, y + 9, 6, 9, '#7A4E2D', 'rx="2"'));
  }

  if (since) {
    for (let p = since.pieces; p < state.pieces; p++) {
      const { building, built } = progressAt(p);
      parts.push(d.sparkle(...building.anchors[built]));
    }
    for (let i = since.extras; i < Math.min(state.extras, EXTRA_SLOTS.length); i++) parts.push(d.sparkle(EXTRA_SLOTS[i][1], EXTRA_SLOTS[i][2] - 10));
    for (let i = since.lights; i < Math.min(state.lights, LIGHT_SLOTS.length); i++) parts.push(d.sparkle(LIGHT_SLOTS[i][0] + 8, LIGHT_SLOTS[i][1] - 6));
  }

  const a11y = title ? `role="img" aria-label="${esc(title)}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" ${a11y}>${parts.join('')}</svg>`;
}

// A plain-language description of a scene, for screen readers.
export function describeScene(townName, state) {
  const p = progressAt(state.pieces);
  const bits = [];
  if (!state.pieces) bits.push('an empty meadow');
  else bits.push(p.done ? 'every building finished' : `${p.built} of ${p.total} pieces of the ${p.building.name.toLowerCase()} built`);
  if (state.lights) bits.push(`${state.lights} streetlight${state.lights === 1 ? '' : 's'}`);
  if (state.people?.length) bits.push(`townspeople ${listNames(state.people.map((x) => x.name))}`);
  if (state.visitors) bits.push(`${state.visitors} visitor${state.visitors === 1 ? '' : 's'}`);
  return `${townName}: ${bits.join(', ')}`;
}
