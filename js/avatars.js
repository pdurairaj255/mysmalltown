// My Small Town — the 40 townspeople you can choose to be (10 per age group).
//
// Each avatar is a recipe (age group, skin, hair, outfit, extras). The same
// recipe draws both the round portrait used in lists and the small figure
// that walks around town, so a person looks like themselves everywhere.
// Hair and face shapes are written relative to the head (cx, cy, r), which
// is what lets one set of shapes work at both sizes.

const INK = '#221A47';
const SKIN = { s1: '#F6D3B3', s2: '#E8B48A', s3: '#C68A5B', s4: '#9A6440', s5: '#6B4226' };
const HAIR = { black: '#2B2238', dark: '#4A2E1F', brown: '#7A4E2D', red: '#B5532E', blonde: '#E8C15A', gray: '#A9A3BD', white: '#EEEAF6' };
const SHIRT = { coral: '#FF7A59', violet: '#9B7BFF', sky: '#4FB7FF', mint: '#3DD49A', pink: '#FF7EB6', sun: '#FFD23F' };
const TINT = { '#FF7A59': '#FFC2B0', '#9B7BFF': '#D4C6FF', '#4FB7FF': '#B5E0FF', '#3DD49A': '#A8F0CF', '#FF7EB6': '#FFC4DD', '#FFD23F': '#FFE98F' };
const HAT = { beanie: '#FF7A59', cap: '#FFD23F', headscarf: '#9B7BFF', turban: '#4FB7FF', sunhat: '#FFE98F', flatcap: '#8F86B5' };

export const AGE_GROUPS = ['Kids', 'Teens', 'Adults', 'Grandparents'];

// hat: a SHIRT color name for hats and headscarves (otherwise HAT's default).
const make = (id, age, label, skin, hair, hairColor, shirt, extras = [], hat = null) =>
  ({ id, age, label, skin: SKIN[skin], hair, hairColor: HAIR[hairColor], shirt: SHIRT[shirt], extras, hat: hat ? SHIRT[hat] : HAT[hair] });

export const AVATARS = [
  make('kid-1', 'Kids', 'Kid with pigtails', 's2', 'pigtails', 'brown', 'pink', ['cheeks']),
  make('kid-2', 'Kids', 'Kid with spiky hair', 's4', 'spiky', 'black', 'sun', ['cheeks']),
  make('kid-3', 'Kids', 'Kid with a curly puff and a bow', 's5', 'puff', 'black', 'mint', ['cheeks', 'bow']),
  make('kid-4', 'Kids', 'Kid with a bowl cut', 's1', 'bowl', 'blonde', 'sky', ['cheeks']),
  make('kid-5', 'Kids', 'Kid with two buns', 's3', 'buns', 'dark', 'coral', ['cheeks']),
  make('kid-6', 'Kids', 'Kid with braids', 's5', 'braids', 'black', 'violet', ['cheeks']),
  make('kid-7', 'Kids', 'Kid with red curls and freckles', 's1', 'curlytop', 'red', 'mint', ['cheeks', 'freckles']),
  make('kid-8', 'Kids', 'Kid with glasses', 's3', 'short', 'black', 'sky', ['cheeks', 'glasses']),
  make('kid-9', 'Kids', 'Kid in a ball cap', 's2', 'cap', 'blonde', 'sun', ['cheeks'], 'coral'),
  make('kid-10', 'Kids', 'Kid with a bob and a bow', 's4', 'bob', 'dark', 'pink', ['cheeks', 'bow']),
  make('teen-1', 'Teens', 'Teen with headphones', 's3', 'swoop', 'black', 'violet', ['headphones']),
  make('teen-2', 'Teens', 'Teen with a ponytail', 's1', 'ponytail', 'red', 'mint'),
  make('teen-3', 'Teens', 'Teen in a beanie', 's4', 'beanie', 'black', 'sky'),
  make('teen-4', 'Teens', 'Teen with long hair', 's2', 'long', 'dark', 'pink'),
  make('teen-5', 'Teens', 'Teen in a ball cap', 's5', 'cap', 'black', 'coral'),
  make('teen-6', 'Teens', 'Teen with locs', 's5', 'locs', 'black', 'mint'),
  make('teen-7', 'Teens', 'Teen in a headscarf', 's3', 'headscarf', 'black', 'sun', [], 'violet'),
  make('teen-8', 'Teens', 'Teen with curls and freckles', 's1', 'curlytop', 'brown', 'pink', ['freckles']),
  make('teen-9', 'Teens', 'Teen with a mohawk', 's4', 'mohawk', 'black', 'sky'),
  make('teen-10', 'Teens', 'Teen with buns and earrings', 's2', 'buns', 'dark', 'coral', ['earrings']),
  make('adult-1', 'Adults', 'Adult with short hair', 's2', 'short', 'brown', 'sky'),
  make('adult-2', 'Adults', 'Adult with long hair', 's5', 'long', 'black', 'sun'),
  make('adult-3', 'Adults', 'Adult with a beard', 's3', 'short', 'black', 'mint', ['beard']),
  make('adult-4', 'Adults', 'Adult with a bob and glasses', 's1', 'bob', 'blonde', 'coral', ['glasses']),
  make('adult-5', 'Adults', 'Adult with a bun', 's4', 'bun', 'dark', 'violet'),
  make('adult-6', 'Adults', 'Adult in a headscarf', 's4', 'headscarf', 'black', 'coral', ['earrings'], 'mint'),
  make('adult-7', 'Adults', 'Adult with locs and a beard', 's5', 'locs', 'black', 'violet', ['beard']),
  make('adult-8', 'Adults', 'Adult with a side part and glasses', 's1', 'sidepart', 'brown', 'mint', ['glasses']),
  make('adult-9', 'Adults', 'Adult with braids and earrings', 's3', 'braids', 'black', 'pink', ['earrings']),
  make('adult-10', 'Adults', 'Adult in a turban with a beard', 's2', 'turban', 'black', 'sun', ['beard'], 'sky'),
  make('grand-1', 'Grandparents', 'Grandparent with glasses', 's1', 'bald', 'white', 'violet', ['glasses', 'cardigan']),
  make('grand-2', 'Grandparents', 'Grandparent with a bun and glasses', 's3', 'bun', 'gray', 'pink', ['glasses', 'cardigan']),
  make('grand-3', 'Grandparents', 'Grandparent with a mustache', 's5', 'short', 'gray', 'sky', ['mustache', 'cardigan']),
  make('grand-4', 'Grandparents', 'Grandparent with white curls', 's2', 'curls', 'white', 'mint', ['cardigan']),
  make('grand-5', 'Grandparents', 'Grandparent with a beard and glasses', 's4', 'bald', 'gray', 'sun', ['beard', 'glasses', 'cardigan']),
  make('grand-6', 'Grandparents', 'Grandparent in a sun hat', 's2', 'sunhat', 'white', 'coral', ['glasses', 'cardigan']),
  make('grand-7', 'Grandparents', 'Grandparent in a flat cap with a mustache', 's3', 'flatcap', 'gray', 'mint', ['mustache', 'cardigan']),
  make('grand-8', 'Grandparents', 'Grandparent in a headscarf with glasses', 's5', 'headscarf', 'black', 'violet', ['glasses', 'cardigan'], 'pink'),
  make('grand-9', 'Grandparents', 'Grandparent with a white bob and earrings', 's1', 'bob', 'white', 'sky', ['earrings', 'cardigan']),
  make('grand-10', 'Grandparents', 'Grandparent with gray locs and glasses', 's5', 'locs', 'gray', 'sun', ['glasses', 'cardigan'])
];

export const DEFAULT_AVATAR = 'adult-1';
const byId = new Map(AVATARS.map((v) => [v.id, v]));
// Unknown ids (old data, typos) fall back to a default, so nothing from the
// database is ever written into the page unchecked.
export const avatarById = (id) => byId.get(id) || byId.get(DEFAULT_AVATAR);
export const shirtOf = (id) => avatarById(id).shirt;
export const tintOf = (id) => TINT[avatarById(id).shirt];

// ---------- Shapes (relative to the head: cx, cy, r) ----------

const n = (v) => Math.round(v * 100) / 100;

function hairBack(v, { cx, cy, r }) {
  const f = `fill="${v.hairColor}" stroke="${INK}" stroke-width="${n(r * 0.09)}"`;
  switch (v.hair) {
    case 'long':
      return `<path d="M${n(cx - 1.08 * r)} ${n(cy - 0.2 * r)} Q${n(cx - 1.08 * r)} ${n(cy - 1.15 * r)} ${cx} ${n(cy - 1.15 * r)} Q${n(cx + 1.08 * r)} ${n(cy - 1.15 * r)} ${n(cx + 1.08 * r)} ${n(cy - 0.2 * r)} L${n(cx + 1.2 * r)} ${n(cy + 1.75 * r)} L${n(cx - 1.2 * r)} ${n(cy + 1.75 * r)} Z" ${f}/>`;
    case 'bob':
      return `<path d="M${n(cx - 1.1 * r)} ${n(cy - 0.2 * r)} Q${n(cx - 1.1 * r)} ${n(cy - 1.15 * r)} ${cx} ${n(cy - 1.15 * r)} Q${n(cx + 1.1 * r)} ${n(cy - 1.15 * r)} ${n(cx + 1.1 * r)} ${n(cy - 0.2 * r)} L${n(cx + 1.14 * r)} ${n(cy + 0.9 * r)} L${n(cx - 1.14 * r)} ${n(cy + 0.9 * r)} Z" ${f}/>`;
    case 'puff':
      return `<circle cx="${cx}" cy="${n(cy - 0.2 * r)}" r="${n(1.4 * r)}" ${f}/>`;
    case 'curls':
      return `<circle cx="${cx}" cy="${n(cy - 0.1 * r)}" r="${n(1.22 * r)}" ${f}/>`;
    case 'pigtails':
      return [-1, 1].map((s) => `<circle cx="${n(cx + s * 1.25 * r)}" cy="${n(cy + 0.1 * r)}" r="${n(0.42 * r)}" ${f}/>`).join('');
    case 'ponytail':
      return `<ellipse cx="${n(cx + 1.2 * r)}" cy="${n(cy + 0.55 * r)}" rx="${n(0.34 * r)}" ry="${n(0.7 * r)}" ${f}/>`;
    case 'buns':
      return [-1, 1].map((s) => `<circle cx="${n(cx + s * 0.68 * r)}" cy="${n(cy - 1.0 * r)}" r="${n(0.42 * r)}" ${f}/>`).join('');
    case 'bun':
      return `<circle cx="${cx}" cy="${n(cy - 1.25 * r)}" r="${n(0.45 * r)}" ${f}/>`;
    case 'braids':
      return [-1, 1].map((k) => `<rect x="${n(cx + (k < 0 ? -1.2 : 0.86) * r)}" y="${n(cy - 0.3 * r)}" width="${n(0.34 * r)}" height="${n(2.05 * r)}" rx="${n(0.17 * r)}" ${f}/>`
        + `<rect x="${n(cx + (k < 0 ? -1.21 : 0.85) * r)}" y="${n(cy + 1.45 * r)}" width="${n(0.36 * r)}" height="${n(0.14 * r)}" fill="${SHIRT.sun}"/>`).join('');
    case 'locs':
      return [-1.18, -0.92, 0.92, 1.18].map((x) => `<rect x="${n(cx + x * r - 0.13 * r)}" y="${n(cy - 0.7 * r)}" width="${n(0.26 * r)}" height="${n(2.25 * r)}" rx="${n(0.13 * r)}" ${f}/>`).join('');
    case 'headscarf':
      // The scarf wraps the head and falls to the shoulders; the face shows through.
      return `<path d="M${n(cx - 1.3 * r)} ${n(cy + 1.7 * r)} Q${n(cx - 1.42 * r)} ${n(cy - 1.5 * r)} ${cx} ${n(cy - 1.45 * r)} Q${n(cx + 1.42 * r)} ${n(cy - 1.5 * r)} ${n(cx + 1.3 * r)} ${n(cy + 1.7 * r)} Z" fill="${v.hat}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`;
    default:
      return '';
  }
}

// The hair across the top of the head.
function topCap(cx, cy, r, f) {
  return `<path d="M${n(cx - r)} ${n(cy - 0.1 * r)} Q${n(cx - r)} ${n(cy - 1.15 * r)} ${cx} ${n(cy - 1.15 * r)} Q${n(cx + r)} ${n(cy - 1.15 * r)} ${n(cx + r)} ${n(cy - 0.1 * r)} Q${n(cx + 0.5 * r)} ${n(cy - 0.75 * r)} ${cx} ${n(cy - 0.62 * r)} Q${n(cx - 0.55 * r)} ${n(cy - 0.55 * r)} ${n(cx - r)} ${n(cy - 0.1 * r)} Z" ${f}/>`;
}

function dome(cx, cy, r, color) {
  return `<path d="M${n(cx - 1.08 * r)} ${n(cy - 0.25 * r)} Q${n(cx - 1.08 * r)} ${n(cy - 1.35 * r)} ${cx} ${n(cy - 1.35 * r)} Q${n(cx + 1.08 * r)} ${n(cy - 1.35 * r)} ${n(cx + 1.08 * r)} ${n(cy - 0.25 * r)} Z" fill="${color}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`;
}

function hairFront(v, { cx, cy, r }) {
  const f = `fill="${v.hairColor}" stroke="${INK}" stroke-width="${n(r * 0.09)}"`;
  const sides = [-1, 1].map((s) => `<rect x="${n(cx + (s < 0 ? -1.02 : 0.74) * r)}" y="${n(cy - 0.35 * r)}" width="${n(0.28 * r)}" height="${n(0.65 * r)}" ${f}/>`).join('');
  // Curved hair hugging the sides of the head (bald tops, and under grown-up hats).
  const tufts = [-1, 1].map((k) => `<path d="M${n(cx + k * 0.99 * r)} ${n(cy + 0.2 * r)} Q${n(cx + k * 1.16 * r)} ${n(cy - 0.45 * r)} ${n(cx + k * 0.72 * r)} ${n(cy - 0.78 * r)} Q${n(cx + k * 0.82 * r)} ${n(cy - 0.3 * r)} ${n(cx + k * 0.72 * r)} ${n(cy + 0.08 * r)} Z" ${f}/>`).join('');
  switch (v.hair) {
    case 'bald':
      return tufts;
    case 'spiky': {
      const pts = [[-1, -0.2], [-0.85, -1.25], [-0.5, -0.95], [-0.2, -1.45], [0.1, -1.0], [0.45, -1.4], [0.65, -0.95], [0.95, -1.2], [1, -0.2], [0.5, -0.6], [-0.5, -0.6]];
      return `<polygon points="${pts.map(([x, y]) => `${n(cx + x * r)},${n(cy + y * r)}`).join(' ')}" ${f}/>`;
    }
    case 'bowl':
      return `<path d="M${n(cx - 1.05 * r)} ${n(cy + 0.15 * r)} L${n(cx - 1.05 * r)} ${n(cy - 0.35 * r)} Q${n(cx - 1.05 * r)} ${n(cy - 1.2 * r)} ${cx} ${n(cy - 1.2 * r)} Q${n(cx + 1.05 * r)} ${n(cy - 1.2 * r)} ${n(cx + 1.05 * r)} ${n(cy - 0.35 * r)} L${n(cx + 1.05 * r)} ${n(cy + 0.15 * r)} L${n(cx + 0.82 * r)} ${n(cy + 0.15 * r)} L${n(cx + 0.82 * r)} ${n(cy - 0.35 * r)} L${n(cx - 0.82 * r)} ${n(cy - 0.35 * r)} L${n(cx - 0.82 * r)} ${n(cy + 0.15 * r)} Z" ${f}/>`;
    case 'swoop':
      return topCap(cx, cy, r, f) + `<path d="M${n(cx - 1.05 * r)} ${n(cy - 0.3 * r)} Q${n(cx - 0.6 * r)} ${n(cy - 1.55 * r)} ${n(cx + 0.7 * r)} ${n(cy - 1.2 * r)} Q${n(cx - 0.1 * r)} ${n(cy - 0.85 * r)} ${n(cx - 1.05 * r)} ${n(cy - 0.3 * r)} Z" ${f}/>`;
    case 'curls':
      return [[-0.6, -0.72, 0.45], [0, -0.92, 0.5], [0.6, -0.72, 0.45]].map(([x, y, s]) => `<circle cx="${n(cx + x * r)}" cy="${n(cy + y * r)}" r="${n(s * r)}" ${f}/>`).join('');
    case 'beanie':
      return sides + dome(cx, cy, r, v.hat)
        + `<rect x="${n(cx - 1.12 * r)}" y="${n(cy - 0.5 * r)}" width="${n(2.24 * r)}" height="${n(0.36 * r)}" rx="${n(0.12 * r)}" fill="${v.hat}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`
        + `<circle cx="${cx}" cy="${n(cy - 1.4 * r)}" r="${n(0.28 * r)}" fill="#FFFFFF" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`;
    case 'cap':
      return sides + dome(cx, cy, r, v.hat)
        + `<path d="M${n(cx + 0.2 * r)} ${n(cy - 0.5 * r)} L${n(cx + 1.6 * r)} ${n(cy - 0.42 * r)} Q${n(cx + 1.66 * r)} ${n(cy - 0.24 * r)} ${n(cx + 1.42 * r)} ${n(cy - 0.2 * r)} L${n(cx + 0.2 * r)} ${n(cy - 0.28 * r)} Z" fill="${v.hat}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`;
    case 'ponytail':
      return topCap(cx, cy, r, f) + `<circle cx="${n(cx + 1.02 * r)}" cy="${n(cy - 0.2 * r)}" r="${n(0.3 * r)}" fill="${SHIRT.sun}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`;
    case 'curlytop':
      return [[-0.72, -0.55, 0.36], [-0.32, -0.88, 0.42], [0.15, -0.95, 0.42], [0.58, -0.78, 0.4], [0.85, -0.42, 0.3]]
        .map(([x, y, sz]) => `<circle cx="${n(cx + x * r)}" cy="${n(cy + y * r)}" r="${n(sz * r)}" ${f}/>`).join('');
    case 'sidepart':
      return topCap(cx, cy, r, f) + `<path d="M${n(cx - 0.35 * r)} ${n(cy - 1.12 * r)} Q${n(cx + 0.7 * r)} ${n(cy - 1.2 * r)} ${n(cx + 1.05 * r)} ${n(cy - 0.25 * r)} Q${n(cx + 0.45 * r)} ${n(cy - 0.85 * r)} ${n(cx - 0.35 * r)} ${n(cy - 0.7 * r)} Z" ${f}/>`;
    case 'mohawk':
      return `<path d="M${n(cx - 0.28 * r)} ${n(cy - 0.75 * r)} Q${n(cx - 0.3 * r)} ${n(cy - 1.75 * r)} ${cx} ${n(cy - 1.85 * r)} Q${n(cx + 0.3 * r)} ${n(cy - 1.75 * r)} ${n(cx + 0.28 * r)} ${n(cy - 0.75 * r)} Z" ${f}/>`;
    case 'locs':
      return topCap(cx, cy, r, f) + [-0.45, 0, 0.45].map((x) => `<line x1="${n(cx + x * r)}" y1="${n(cy - 1.05 * r)}" x2="${n(cx + x * 1.3 * r)}" y2="${n(cy - 0.62 * r)}" stroke="${INK}" stroke-width="${n(r * 0.06)}"/>`).join('');
    case 'headscarf':
      return `<path d="M${n(cx - 1.02 * r)} ${n(cy - 0.05 * r)} Q${n(cx - 1.05 * r)} ${n(cy - 1.15 * r)} ${cx} ${n(cy - 1.12 * r)} Q${n(cx + 1.05 * r)} ${n(cy - 1.15 * r)} ${n(cx + 1.02 * r)} ${n(cy - 0.05 * r)} Q${n(cx + 0.6 * r)} ${n(cy - 0.62 * r)} ${cx} ${n(cy - 0.6 * r)} Q${n(cx - 0.6 * r)} ${n(cy - 0.62 * r)} ${n(cx - 1.02 * r)} ${n(cy - 0.05 * r)} Z" fill="${v.hat}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`;
    case 'turban':
      return `<path d="M${n(cx - 1.1 * r)} ${n(cy - 0.2 * r)} Q${n(cx - 1.25 * r)} ${n(cy - 1.65 * r)} ${cx} ${n(cy - 1.6 * r)} Q${n(cx + 1.25 * r)} ${n(cy - 1.65 * r)} ${n(cx + 1.1 * r)} ${n(cy - 0.2 * r)} Q${cx} ${n(cy - 0.62 * r)} ${n(cx - 1.1 * r)} ${n(cy - 0.2 * r)} Z" fill="${v.hat}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`
        + `<path d="M${n(cx - 0.85 * r)} ${n(cy - 0.55 * r)} Q${n(cx - 0.1 * r)} ${n(cy - 1.5 * r)} ${n(cx + 0.9 * r)} ${n(cy - 1.0 * r)}" fill="none" stroke="${INK}" stroke-width="${n(r * 0.08)}"/>`;
    case 'sunhat':
      return tufts + `<ellipse cx="${cx}" cy="${n(cy - 0.62 * r)}" rx="${n(1.75 * r)}" ry="${n(0.36 * r)}" fill="${v.hat}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`
        + `<path d="M${n(cx - 0.85 * r)} ${n(cy - 0.7 * r)} Q${n(cx - 0.85 * r)} ${n(cy - 1.55 * r)} ${cx} ${n(cy - 1.55 * r)} Q${n(cx + 0.85 * r)} ${n(cy - 1.55 * r)} ${n(cx + 0.85 * r)} ${n(cy - 0.7 * r)} Z" fill="${v.hat}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`
        + `<rect x="${n(cx - 0.85 * r)}" y="${n(cy - 0.95 * r)}" width="${n(1.7 * r)}" height="${n(0.22 * r)}" fill="${SHIRT.coral}"/>`;
    case 'flatcap':
      return tufts + `<path d="M${n(cx - 1.08 * r)} ${n(cy - 0.35 * r)} Q${n(cx - 1.0 * r)} ${n(cy - 1.25 * r)} ${n(cx + 0.1 * r)} ${n(cy - 1.2 * r)} Q${n(cx + 1.05 * r)} ${n(cy - 1.15 * r)} ${n(cx + 1.45 * r)} ${n(cy - 0.45 * r)} Q${n(cx + 0.3 * r)} ${n(cy - 0.55 * r)} ${n(cx - 1.08 * r)} ${n(cy - 0.35 * r)} Z" fill="${v.hat}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`;
    default: // short, long, bob, puff, pigtails, buns, bun
      return topCap(cx, cy, r, f);
  }
}

function face(v, { cx, cy, r }) {
  const s = [];
  const has = (x) => v.extras.includes(x);
  const line = `stroke="${INK}" stroke-width="${n(0.12 * r)}" stroke-linecap="round" fill="none"`;
  if (has('freckles')) s.push([-1, 1].map((k) => [[0.5, 0.28], [0.66, 0.36], [0.56, 0.44]]
    .map(([x, y]) => `<circle cx="${n(cx + k * x * r)}" cy="${n(cy + y * r)}" r="${n(0.06 * r)}" fill="#B5532E" opacity="0.7"/>`).join('')).join(''));
  if (has('earrings')) s.push([-1, 1].map((k) => `<circle cx="${n(cx + k * 0.98 * r)}" cy="${n(cy + 0.52 * r)}" r="${n(0.14 * r)}" fill="${SHIRT.sun}" stroke="${INK}" stroke-width="${n(r * 0.05)}"/>`).join(''));
  if (has('cheeks')) s.push([-1, 1].map((k) => `<circle cx="${n(cx + k * 0.58 * r)}" cy="${n(cy + 0.36 * r)}" r="${n(0.18 * r)}" fill="#FF7EB6" opacity="0.55"/>`).join(''));
  s.push([-1, 1].map((k) => `<circle cx="${n(cx + k * 0.37 * r)}" cy="${n(cy + 0.07 * r)}" r="${n(0.12 * r)}" fill="${INK}"/>`).join(''));
  if (has('beard')) {
    s.push(`<path d="M${n(cx - 0.97 * r)} ${n(cy + 0.25 * r)} Q${n(cx - 0.92 * r)} ${n(cy + 1.25 * r)} ${cx} ${n(cy + 1.3 * r)} Q${n(cx + 0.92 * r)} ${n(cy + 1.25 * r)} ${n(cx + 0.97 * r)} ${n(cy + 0.25 * r)} Q${n(cx + 0.6 * r)} ${n(cy + 0.9 * r)} ${cx} ${n(cy + 0.86 * r)} Q${n(cx - 0.6 * r)} ${n(cy + 0.9 * r)} ${n(cx - 0.97 * r)} ${n(cy + 0.25 * r)} Z" fill="${v.hairColor}" stroke="${INK}" stroke-width="${n(r * 0.09)}"/>`);
    s.push(`<path d="M${n(cx - 0.42 * r)} ${n(cy + 0.5 * r)} Q${cx} ${n(cy + 0.3 * r)} ${n(cx + 0.42 * r)} ${n(cy + 0.5 * r)} Q${cx} ${n(cy + 0.62 * r)} ${n(cx - 0.42 * r)} ${n(cy + 0.5 * r)} Z" fill="${v.hairColor}" stroke="${INK}" stroke-width="${n(r * 0.07)}"/>`);
    s.push(`<path d="M${n(cx - 0.18 * r)} ${n(cy + 0.72 * r)} Q${cx} ${n(cy + 0.8 * r)} ${n(cx + 0.18 * r)} ${n(cy + 0.72 * r)}" ${line}/>`);
  } else {
    s.push(`<path d="M${n(cx - 0.3 * r)} ${n(cy + 0.44 * r)} Q${cx} ${n(cy + 0.66 * r)} ${n(cx + 0.3 * r)} ${n(cy + 0.44 * r)}" ${line}/>`);
  }
  if (has('mustache')) s.push(`<path d="M${n(cx - 0.48 * r)} ${n(cy + 0.42 * r)} Q${cx} ${n(cy + 0.16 * r)} ${n(cx + 0.48 * r)} ${n(cy + 0.42 * r)} Q${cx} ${n(cy + 0.56 * r)} ${n(cx - 0.48 * r)} ${n(cy + 0.42 * r)} Z" fill="${v.hairColor}" stroke="${INK}" stroke-width="${n(r * 0.07)}"/>`);
  if (has('glasses')) {
    const g = `fill="none" stroke="${INK}" stroke-width="${n(0.1 * r)}"`;
    s.push([-1, 1].map((k) => `<circle cx="${n(cx + k * 0.37 * r)}" cy="${n(cy + 0.07 * r)}" r="${n(0.27 * r)}" ${g}/>`).join('')
      + `<line x1="${n(cx - 0.1 * r)}" y1="${n(cy + 0.07 * r)}" x2="${n(cx + 0.1 * r)}" y2="${n(cy + 0.07 * r)}" ${g}/>`);
  }
  return s.join('');
}

function extrasOver(v, { cx, cy, r }) {
  const s = [];
  if (v.extras.includes('headphones')) {
    s.push(`<path d="M${n(cx - 1.12 * r)} ${cy} Q${n(cx - 1.12 * r)} ${n(cy - 1.45 * r)} ${cx} ${n(cy - 1.45 * r)} Q${n(cx + 1.12 * r)} ${n(cy - 1.45 * r)} ${n(cx + 1.12 * r)} ${cy}" fill="none" stroke="${INK}" stroke-width="${n(0.18 * r)}"/>`);
    s.push([-1, 1].map((k) => `<rect x="${n(cx + (k < 0 ? -1.34 : 0.94) * r)}" y="${n(cy - 0.3 * r)}" width="${n(0.4 * r)}" height="${n(0.75 * r)}" rx="${n(0.12 * r)}" fill="${SHIRT.coral}" stroke="${INK}" stroke-width="${n(0.08 * r)}"/>`).join(''));
  }
  if (v.extras.includes('bow')) {
    const bx = cx + 0.75 * r, by = cy - 1.05 * r;
    s.push(`<path d="M${n(bx)} ${n(by)} L${n(bx - 0.45 * r)} ${n(by - 0.3 * r)} L${n(bx - 0.45 * r)} ${n(by + 0.3 * r)} Z M${n(bx)} ${n(by)} L${n(bx + 0.45 * r)} ${n(by - 0.3 * r)} L${n(bx + 0.45 * r)} ${n(by + 0.3 * r)} Z" fill="${SHIRT.sun}" stroke="${INK}" stroke-width="${n(0.08 * r)}"/>`);
  }
  return s.join('');
}

// ---------- Drawings ----------

// Round head-and-shoulders portrait, drawn in a 40×40 box (the CSS circle crops it).
export function portrait(id, { title } = {}) {
  const v = avatarById(id);
  const kid = v.age === 'Kids';
  const head = kid ? { cx: 20, cy: 19, r: 8.5 } : { cx: 20, cy: 17, r: 7.5 };
  const parts = [`<rect width="40" height="40" fill="${TINT[v.shirt]}"/>`, hairBack(v, head)];
  if (kid) {
    parts.push(`<path d="M10 41 Q10 30.5 20 30.5 Q30 30.5 30 41 Z" fill="${v.shirt}" stroke="${INK}" stroke-width="0.8"/>`);
  } else {
    parts.push(`<rect x="18" y="22" width="4" height="7" fill="${v.skin}"/>`,
      `<path d="M7 41 Q7 28 20 28 Q33 28 33 41 Z" fill="${v.shirt}" stroke="${INK}" stroke-width="0.8"/>`);
    if (v.extras.includes('cardigan')) parts.push(`<path d="M17.2 28.3 L20 33 L22.8 28.3 Z" fill="#FFFFFF" stroke="${INK}" stroke-width="0.6"/><line x1="20" y1="33" x2="20" y2="41" stroke="${INK}" stroke-width="0.6"/>`);
  }
  parts.push(`<circle cx="${head.cx}" cy="${head.cy}" r="${head.r}" fill="${v.skin}"/>`, hairFront(v, head), face(v, head), extrasOver(v, head));
  const a11y = title ? `role="img" aria-label="${title.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return `<svg viewBox="0 0 40 40" ${a11y}>${parts.join('')}</svg>`;
}

// Small full figure for the town scene. (x, y) is where an adult's head goes;
// feet land at y + 18 whatever the age. hatAttr fills a hard hat (for people
// helping or leading a build) and replaces their hair or hat on top.
export function figure(id, x, y, { hatAttr = null } = {}) {
  const v = avatarById(id);
  const [r, dy, bw, bh] = { Kids: [3.8, 4.5, 8, 9.5], Teens: [4.2, 1.5, 9, 12], Adults: [4.5, 0, 9, 13], Grandparents: [4.5, 0, 9, 13] }[v.age];
  const head = { cx: x, cy: y + dy, r };
  const parts = [
    hairBack(v, head),
    `<rect x="${n(x - bw / 2)}" y="${n(head.cy + r + 0.5)}" width="${bw}" height="${bh}" rx="3" fill="${v.shirt}" stroke="${INK}" stroke-width="0.8"/>`,
    `<circle cx="${x}" cy="${n(head.cy)}" r="${r}" fill="${v.skin}"/>`
  ];
  if (v.extras.includes('beard')) parts.push(`<path d="M${n(x - 0.97 * r)} ${n(head.cy + 0.25 * r)} Q${x} ${n(head.cy + 1.7 * r)} ${n(x + 0.97 * r)} ${n(head.cy + 0.25 * r)} Q${x} ${n(head.cy + 0.75 * r)} ${n(x - 0.97 * r)} ${n(head.cy + 0.25 * r)} Z" fill="${v.hairColor}"/>`);
  if (hatAttr) {
    parts.push(`<path d="M${n(x - 1.1 * r)} ${n(head.cy - 0.2 * r)} a${n(1.1 * r)} ${n(1.1 * r)} 0 0 1 ${n(2.2 * r)} 0 z" ${hatAttr} stroke="${INK}" stroke-width="0.6"/>`);
  } else {
    parts.push(hairFront(v, head));
  }
  return parts.join('');
}
