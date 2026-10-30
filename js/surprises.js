// My Small Town — the surprise a visit streak brings.
//
// Anyone who stops by on 3 or more days in a week brings one surprise to town.
// Which surprise is decided by a hash of the group, the week and the person, so
// it's random-feeling but identical on every family member's phone, and the
// same week always replays the same way.

import { possessive } from './util.js';

const INK = '#221A47';

// Weights add up to 100, so each is roughly "out of 100 surprises".
const KINDS = [
  ['light', 35],
  ['pet', 27],
  ['shop', 18],
  ['cleanup', 15],
  ['rare', 5]
];
const TYPES = {
  pet: ['dog', 'cat', 'ducks', 'bunny', 'chickens'],
  shop: ['grocery', 'icecream', 'bakery', 'lemonade', 'flowers'],
  rare: ['dinosaur', 'superhero']
};

// FNV-1a: a small, stable string hash. Not for security, just for dice.
function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function rollSurprise(groupId, weekIndex, userId) {
  const h = hash(`${groupId}:${weekIndex}:${userId}`);
  let roll = h % 100;
  let kind = KINDS[KINDS.length - 1][0];
  for (const [k, weight] of KINDS) {
    if (roll < weight) { kind = k; break; }
    roll -= weight;
  }
  const types = TYPES[kind];
  return { kind, type: types ? types[hash(`${h}:type`) % types.length] : null };
}

// ---------- Words ----------

const PET = { dog: 'A puppy', cat: 'A cat', ducks: 'A family of ducks', bunny: 'A bunny', chickens: 'Two chickens' };
const SHOP = { grocery: 'grocery stand', icecream: 'ice cream cart', bakery: 'bakery cart', lemonade: 'lemonade stand', flowers: 'flower stall' };

export function surpriseTitle({ kind, type }) {
  switch (kind) {
    case 'light': return 'A new streetlight came on';
    case 'pet': return `${PET[type]} moved to town`;
    case 'shop': return `A pop-up ${SHOP[type]} opened`;
    case 'cleanup': return 'Trash clean-up Sunday';
    default: return type === 'dinosaur' ? 'A friendly dinosaur moved to town!' : 'A superhero joined the town!';
  }
}

export function surpriseDetail({ kind }, name) {
  switch (kind) {
    case 'cleanup': return `${name} rallied a clean-up crew. The town will be spotless all next week.`;
    case 'rare': return `A rare surprise from ${possessive(name)} visits. Only about 1 in 20 surprises is this lucky!`;
    default: return `A surprise from ${possessive(name)} 3 days of visits this week`;
  }
}

// Short plain-language phrase for screen-reader scene descriptions.
export function describeSurprises(list) {
  const count = (k) => list.filter((s) => s.kind === k).length;
  const bits = [];
  const n = (k, one, many) => { const c = count(k); if (c) bits.push(c === 1 ? one : `${c} ${many}`); };
  n('light', 'a streetlight', 'streetlights');
  n('pet', 'a pet', 'pets');
  n('shop', 'a pop-up shop', 'pop-up shops');
  if (list.some((s) => s.type === 'dinosaur')) bits.push('a friendly dinosaur');
  if (list.some((s) => s.type === 'superhero')) bits.push('a superhero');
  return bits;
}

// ---------- Drawing ----------

// Where each kind of surprise appears, in order. Ground points (x, y) are
// where feet or posts touch the grass; the superhero flies in the sky.
const SLOTS = {
  light: [[140, 240], [172, 204], [210, 178], [166, 162], [226, 222], [154, 180], [250, 176], [120, 244], [196, 250], [80, 176], [12, 170]],
  pet: [[18, 242], [138, 214], [244, 240], [96, 252], [318, 218], [62, 254], [282, 254], [138, 256]],
  shop: [[150, 206], [252, 248], [8, 214], [306, 254], [338, 254]],
  dinosaur: [[326, 204], [20, 192]],
  superhero: [[118, 72], [246, 84]]
};
const GLINTS = [[60, 170], [122, 150], [204, 190], [282, 176], [322, 232], [40, 216], [232, 150], [168, 120], [96, 236]];

const stroke = (w = 0.8) => `stroke="${INK}" stroke-width="${w}"`;

const PETS = {
  dog: (x, y) => `<line x1="${x - 6}" y1="${y - 6}" x2="${x - 9}" y2="${y - 10}" stroke="#C68A5B" stroke-width="1.6" stroke-linecap="round"/>`
    + [x - 4, x - 1, x + 2, x + 4.5].map((lx) => `<line x1="${lx}" y1="${y - 3}" x2="${lx}" y2="${y}" stroke="${INK}" stroke-width="1.2"/>`).join('')
    + `<ellipse cx="${x}" cy="${y - 5}" rx="6.5" ry="3.5" fill="#C68A5B" ${stroke(0.7)}/><circle cx="${x + 6}" cy="${y - 8.5}" r="3" fill="#C68A5B" ${stroke(0.7)}/>`
    + `<ellipse cx="${x + 7.6}" cy="${y - 9.5}" rx="1.2" ry="2.2" fill="#7A4E2D"/><circle cx="${x + 6.6}" cy="${y - 9}" r="0.5" fill="${INK}"/>`,
  cat: (x, y) => `<path d="M${x - 5} ${y - 5} Q${x - 11} ${y - 8} ${x - 8} ${y - 13}" fill="none" stroke="#7E7896" stroke-width="1.6" stroke-linecap="round"/>`
    + [x - 3, x + 3].map((lx) => `<line x1="${lx}" y1="${y - 3}" x2="${lx}" y2="${y}" stroke="${INK}" stroke-width="1.2"/>`).join('')
    + `<ellipse cx="${x}" cy="${y - 4.5}" rx="5.5" ry="3" fill="#A9A3BD" ${stroke(0.7)}/><circle cx="${x + 5}" cy="${y - 8}" r="2.7" fill="#A9A3BD" ${stroke(0.7)}/>`
    + `<polygon points="${x + 3},${y - 9.5} ${x + 3.4},${y - 12.5} ${x + 5},${y - 10.5}" fill="#A9A3BD" ${stroke(0.5)}/><polygon points="${x + 5.5},${y - 10.5} ${x + 7},${y - 12.5} ${x + 7.2},${y - 9.5}" fill="#A9A3BD" ${stroke(0.5)}/>`,
  ducks: (x, y) => `<ellipse cx="${x}" cy="${y - 3.5}" rx="5" ry="3.2" fill="#FFFFFF" ${stroke(0.7)}/><circle cx="${x + 4}" cy="${y - 7.5}" r="2.2" fill="#FFFFFF" ${stroke(0.7)}/><polygon points="${x + 6},${y - 7.8} ${x + 8.5},${y - 7.2} ${x + 6},${y - 6.6}" fill="#FF7A59"/>`
    + [9, 14].map((dx) => `<ellipse cx="${x + dx}" cy="${y - 2}" rx="2.4" ry="1.8" fill="#FFD23F" ${stroke(0.5)}/><circle cx="${x + dx + 1.8}" cy="${y - 4}" r="1.3" fill="#FFD23F" ${stroke(0.5)}/>`).join(''),
  bunny: (x, y) => `<circle cx="${x - 4}" cy="${y - 4}" r="1.4" fill="#FFFFFF" ${stroke(0.5)}/><ellipse cx="${x}" cy="${y - 3.5}" rx="4" ry="3.2" fill="#FFFFFF" ${stroke(0.7)}/>`
    + `<ellipse cx="${x + 2.8}" cy="${y - 11.5}" rx="0.9" ry="2.8" fill="#FFFFFF" ${stroke(0.5)}/><ellipse cx="${x + 4.6}" cy="${y - 11.5}" rx="0.9" ry="2.8" fill="#FFFFFF" ${stroke(0.5)}/>`
    + `<circle cx="${x + 3.6}" cy="${y - 7.2}" r="2.4" fill="#FFFFFF" ${stroke(0.7)}/><circle cx="${x + 4.3}" cy="${y - 7.6}" r="0.45" fill="${INK}"/>`,
  chickens: (x, y) => [[0, '#FFFFFF'], [10, '#E8B48A']].map(([dx, c]) => {
    const cx = x + dx;
    return `<line x1="${cx - 1}" y1="${y - 2}" x2="${cx - 1}" y2="${y}" stroke="#FF7A59" stroke-width="1"/><line x1="${cx + 1}" y1="${y - 2}" x2="${cx + 1}" y2="${y}" stroke="#FF7A59" stroke-width="1"/>`
      + `<circle cx="${cx}" cy="${y - 4.5}" r="3.4" fill="${c}" ${stroke(0.7)}/><circle cx="${cx + 2.8}" cy="${y - 8.3}" r="1.9" fill="${c}" ${stroke(0.6)}/>`
      + `<circle cx="${cx + 2.6}" cy="${y - 10.4}" r="0.9" fill="#FF7A59"/><polygon points="${cx + 4.5},${y - 8.6} ${cx + 6},${y - 8.1} ${cx + 4.5},${y - 7.6}" fill="#FFD23F"/>`;
  }).join('')
};

const SHOP_COLORS = { grocery: '#3DD49A', icecream: '#FF7EB6', bakery: '#FFD23F', lemonade: '#4FB7FF', flowers: '#9B7BFF' };
const SHOP_GOODS = {
  grocery: (x, y) => [['#FF7A59', -5], ['#3DD49A', -1.5], ['#FFD23F', 2], ['#FF7A59', 5.5]].map(([c, dx]) => `<circle cx="${x + dx}" cy="${y - 9.5}" r="1.6" fill="${c}" ${stroke(0.4)}/>`).join(''),
  icecream: (x, y) => `<polygon points="${x - 2},${y - 9} ${x + 2},${y - 9} ${x},${y - 4}" fill="#E8B48A" ${stroke(0.5)}/><circle cx="${x}" cy="${y - 10.5}" r="2.4" fill="#FF7EB6" ${stroke(0.5)}/>`,
  bakery: (x, y) => `<ellipse cx="${x - 3}" cy="${y - 9.5}" rx="3" ry="1.6" fill="#C68A5B" ${stroke(0.5)}/><ellipse cx="${x + 3.5}" cy="${y - 9.5}" rx="2.2" ry="1.6" fill="#E8B48A" ${stroke(0.5)}/>`,
  lemonade: (x, y) => `<rect x="${x - 2}" y="${y - 13}" width="4" height="5" rx="1" fill="#FFE98F" ${stroke(0.5)}/><rect x="${x + 3.5}" y="${y - 11}" width="2" height="3" fill="#FFFFFF" ${stroke(0.4)}/>`,
  flowers: (x, y) => [['#FF7EB6', -4], ['#9B7BFF', 0], ['#FFD23F', 4]].map(([c, dx]) => `<line x1="${x + dx}" y1="${y - 8}" x2="${x + dx}" y2="${y - 11}" stroke="#1E9E6E" stroke-width="0.8"/><circle cx="${x + dx}" cy="${y - 11.5}" r="1.5" fill="${c}"/>`).join('')
};
function shop(type, x, y) {
  const c = SHOP_COLORS[type];
  const stripes = [0, 1, 2, 3, 4].map((i) => `<rect x="${x - 10 + i * 4}" y="${y - 21}" width="4" height="4" fill="${i % 2 ? '#FFFFFF' : c}"/>`).join('');
  return `<line x1="${x - 8}" y1="${y}" x2="${x - 8}" y2="${y - 18}" stroke="${INK}" stroke-width="1"/><line x1="${x + 8}" y1="${y}" x2="${x + 8}" y2="${y - 18}" stroke="${INK}" stroke-width="1"/>`
    + stripes + `<rect x="${x - 10}" y="${y - 21}" width="20" height="4" fill="none" ${stroke(0.7)}/>`
    + `<rect x="${x - 9}" y="${y - 8}" width="18" height="8" fill="#FFFFFF" ${stroke(0.8)}/><rect x="${x - 9}" y="${y - 5}" width="18" height="2" fill="${c}"/>`
    + SHOP_GOODS[type](x, y);
}

function dinosaur(x, y, accentFill) {
  const body = '#9B7BFF';
  return `<path d="M${x + 9} ${y - 10} Q${x + 18} ${y - 9} ${x + 22} ${y - 3} Q${x + 15} ${y - 4} ${x + 9} ${y - 5} Z" fill="${body}" ${stroke()}/>`
    + `<rect x="${x - 5}" y="${y - 5}" width="4" height="5" rx="1" fill="${body}" ${stroke()}/><rect x="${x + 4}" y="${y - 5}" width="4" height="5" rx="1" fill="${body}" ${stroke()}/>`
    + [[x - 3, y - 16], [x + 2, y - 17], [x + 7, y - 15]].map(([sx, sy]) => `<polygon points="${sx - 2},${sy + 2} ${sx},${sy - 2} ${sx + 2},${sy + 2}" ${accentFill} ${stroke(0.6)}/>`).join('')
    + `<ellipse cx="${x + 2}" cy="${y - 9}" rx="10" ry="7" fill="${body}" ${stroke()}/><ellipse cx="${x}" cy="${y - 7}" rx="5" ry="3.5" fill="#D4C6FF"/>`
    + `<path d="M${x - 5} ${y - 12} L${x - 8} ${y - 21} L${x - 3} ${y - 22} L${x - 1} ${y - 13} Z" fill="${body}" ${stroke()}/>`
    + `<ellipse cx="${x - 8}" cy="${y - 23}" rx="6" ry="4.2" fill="${body}" ${stroke()}/><circle cx="${x - 9.5}" cy="${y - 24}" r="0.9" fill="${INK}"/>`
    + `<path d="M${x - 13} ${y - 22} Q${x - 11} ${y - 20.5} ${x - 8.5} ${y - 21.5}" fill="none" ${stroke(0.7)} stroke-linecap="round"/>`
    + `<line x1="${x - 7}" y1="${y - 9}" x2="${x - 10}" y2="${y - 7}" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>`;
}

function superhero(x, y, accentFill) {
  return `<line x1="${x - 26}" y1="${y - 3}" x2="${x - 18}" y2="${y - 3}" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/><line x1="${x - 24}" y1="${y + 2}" x2="${x - 16}" y2="${y + 2}" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/>`
    + `<polygon points="${x - 1},${y - 3} ${x - 16},${y - 7} ${x - 13},${y + 4}" fill="#FF7A59" ${stroke(0.7)}/>`
    + `<rect x="${x - 10}" y="${y - 2.5}" width="16" height="5.5" rx="2.7" fill="#4FB7FF" ${stroke(0.8)}/><rect x="${x - 12}" y="${y - 2.3}" width="4" height="5" rx="1.5" fill="#FF7A59" ${stroke(0.6)}/>`
    + `<line x1="${x + 3}" y1="${y - 1}" x2="${x + 13}" y2="${y - 5}" stroke="#4FB7FF" stroke-width="2.4" stroke-linecap="round"/><circle cx="${x + 13.5}" cy="${y - 5.2}" r="1.6" fill="#E8B48A" ${stroke(0.5)}/>`
    + `<circle cx="${x + 9}" cy="${y}" r="3.3" fill="#E8B48A" ${stroke(0.6)}/><path d="M${x + 6} ${y - 0.5} Q${x + 7} ${y - 4.5} ${x + 11.5} ${y - 2.2}" fill="#2B2238"/>`
    + `<polygon points="${x - 3},${y - 1.5} ${x - 1.8},${y + 0.6} ${x - 4.2},${y + 0.6}" ${accentFill}/>`;
}

// Draws every surprise in `list` (oldest first). Returns the SVG parts and,
// per surprise, a point to put a "new!" sparkle on.
export function drawSurprises(list, { accentFill, light }) {
  const used = { light: 0, pet: 0, shop: 0, dinosaur: 0, superhero: 0 };
  const parts = [];
  const anchors = [];
  for (const s of list) {
    const slotKey = s.kind === 'rare' ? s.type : s.kind;
    if (s.kind === 'cleanup') { anchors.push([175, 150]); continue; }
    const slot = SLOTS[slotKey][used[slotKey]++];
    if (!slot) { anchors.push(null); continue; }
    const [x, y] = slot;
    if (s.kind === 'light') { parts.push(light(x, y)); anchors.push([x + 8, y - 6]); }
    else if (s.kind === 'pet') { parts.push(PETS[s.type](x, y)); anchors.push([x + 2, y - 16]); }
    else if (s.kind === 'shop') { parts.push(shop(s.type, x, y)); anchors.push([x + 12, y - 24]); }
    else if (s.type === 'dinosaur') { parts.push(dinosaur(x, y, accentFill)); anchors.push([x - 14, y - 30]); }
    else { parts.push(superhero(x, y, accentFill)); anchors.push([x + 18, y - 10]); }
  }
  return { parts: parts.join(''), anchors };
}

// The shine on a town the week after a trash clean-up Sunday.
export function drawSpotless() {
  return GLINTS.map(([x, y]) => `<path d="M${x} ${y - 5} L${x + 1.2} ${y - 1.2} L${x + 5} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 5} L${x - 1.2} ${y + 1.2} L${x - 5} ${y} L${x - 1.2} ${y - 1.2} Z" fill="#FFFFFF" ${stroke(0.6)}/>`).join('');
}
