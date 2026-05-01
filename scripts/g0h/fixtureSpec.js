const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

const ZONES = {
  ivy: 'ivy-cloister',
  moss: 'moss-hollow',
  pool: 'pool-heart',
  sun: 'sun-court'
};

const CAST = [
  {
    alias: 'Aster',
    zoneId: ZONES.moss,
    boardPos: { zoneId: ZONES.moss, u: 8, v: 8, h: 0 },
    purpose: 'caregiver and loyalty-choice witness',
    ability: 'warmRally',
    drives: { caregiving: 0.74, socialConnection: 0.72, safetyAvoidance: 0.24, statusExpression: 0.42 },
    emotions: { attachment: 0.62, relief: 0.36, curiosity: 0.34, threat: 0.12 },
    traits: { empathy: 0.78, protectiveness: 0.7, sociability: 0.74 }
  },
  {
    alias: 'Briar',
    zoneId: ZONES.moss,
    boardPos: { zoneId: ZONES.moss, u: 10, v: 8, h: 0 },
    purpose: 'distressed companion',
    drives: { socialConnection: 0.66, safetyAvoidance: 0.38, rest: 0.36 },
    emotions: { attachment: 0.5, agitation: 0.24, threat: 0.18 }
  },
  {
    alias: 'Clover',
    zoneId: ZONES.moss,
    boardPos: { zoneId: ZONES.moss, u: 12, v: 8, h: 0 },
    purpose: 'competing distressed companion',
    drives: { socialConnection: 0.64, safetyAvoidance: 0.36, rest: 0.34 },
    emotions: { attachment: 0.48, agitation: 0.22, threat: 0.16 }
  },
  {
    alias: 'Lumen',
    zoneId: ZONES.ivy,
    boardPos: { zoneId: ZONES.ivy, u: 7, v: 7, h: 0 },
    purpose: 'scout and teacher signal source',
    ability: 'teacher',
    drives: { exploration: 0.82, statusExpression: 0.68, socialConnection: 0.58 },
    emotions: { curiosity: 0.76, significance: 0.44, relief: 0.28 },
    traits: { curiosity: 0.82, confidence: 0.7, sociability: 0.62 }
  },
  {
    alias: 'Mira',
    zoneId: ZONES.ivy,
    boardPos: { zoneId: ZONES.ivy, u: 8, v: 7, h: 0 },
    purpose: 'scout recipient',
    drives: { exploration: 0.56, socialConnection: 0.58 },
    emotions: { curiosity: 0.52, attachment: 0.34 }
  },
  {
    alias: 'Nettle',
    zoneId: ZONES.ivy,
    boardPos: { zoneId: ZONES.ivy, u: 9, v: 7, h: 0 },
    purpose: 'scout recipient',
    drives: { exploration: 0.52, socialConnection: 0.56 },
    emotions: { curiosity: 0.5, attachment: 0.32 }
  },
  {
    alias: 'Iris',
    zoneId: ZONES.ivy,
    boardPos: { zoneId: ZONES.ivy, u: 16, v: 8, h: 0 },
    purpose: 'jealousy and attachment subject',
    drives: { socialConnection: 0.7, statusExpression: 0.48 },
    emotions: { attachment: 0.74, rejection: 0.18, agitation: 0.2 }
  },
  {
    alias: 'Juniper',
    zoneId: ZONES.ivy,
    boardPos: { zoneId: ZONES.ivy, u: 17, v: 8, h: 0 },
    purpose: 'bond partner in jealousy triangle',
    drives: { socialConnection: 0.68, exploration: 0.42 },
    emotions: { attachment: 0.68, relief: 0.34 }
  },
  {
    alias: 'Kite',
    zoneId: ZONES.ivy,
    boardPos: { zoneId: ZONES.ivy, u: 18, v: 8, h: 0 },
    purpose: 'third-party affection and rivalry target',
    drives: { socialConnection: 0.62, statusExpression: 0.56 },
    emotions: { significance: 0.42, curiosity: 0.42 }
  },
  {
    alias: 'Orchid',
    zoneId: ZONES.pool,
    boardPos: { zoneId: ZONES.pool, u: 10, v: 10, h: 0 },
    purpose: 'bonded partner missing Pollen',
    drives: { socialConnection: 0.76, caregiving: 0.5, rest: 0.42 },
    emotions: { attachment: 0.76, rejection: 0.24, exhaustion: 0.2 }
  },
  {
    alias: 'Pollen',
    zoneId: ZONES.moss,
    boardPos: { zoneId: ZONES.moss, u: 28, v: 18, h: 0 },
    purpose: 'absent bonded partner',
    drives: { exploration: 0.72, socialConnection: 0.56 },
    emotions: { curiosity: 0.58, attachment: 0.48 }
  },
  {
    alias: 'Vale',
    zoneId: ZONES.pool,
    boardPos: { zoneId: ZONES.pool, u: 28, v: 17, h: 0 },
    purpose: 'isolated lonely butterfly',
    drives: { socialConnection: 0.88, rest: 0.36, exploration: 0.24 },
    emotions: { rejection: 0.46, attachment: 0.28, exhaustion: 0.26 }
  },
  {
    alias: 'Rowan',
    zoneId: ZONES.sun,
    boardPos: { zoneId: ZONES.sun, u: 8, v: 8, h: 0 },
    purpose: 'battle team high contribution',
    ability: 'speedzone',
    drives: { statusExpression: 0.76, exploration: 0.58 },
    emotions: { significance: 0.58, curiosity: 0.42 }
  },
  {
    alias: 'Sage',
    zoneId: ZONES.sun,
    boardPos: { zoneId: ZONES.sun, u: 10, v: 8, h: 0 },
    purpose: 'battle ally support',
    ability: 'shimmer',
    drives: { statusExpression: 0.62, caregiving: 0.52 },
    emotions: { significance: 0.42, relief: 0.3 }
  },
  {
    alias: 'Thorn',
    zoneId: ZONES.sun,
    boardPos: { zoneId: ZONES.sun, u: 13, v: 8, h: 0 },
    purpose: 'battle opponent',
    ability: 'sting',
    drives: { statusExpression: 0.72, safetyAvoidance: 0.34 },
    emotions: { significance: 0.5, agitation: 0.32 }
  },
  {
    alias: 'Wisp',
    zoneId: ZONES.sun,
    boardPos: { zoneId: ZONES.sun, u: 15, v: 8, h: 0 },
    purpose: 'battle opponent',
    ability: 'welcome',
    drives: { statusExpression: 0.58, exploration: 0.5 },
    emotions: { curiosity: 0.44, agitation: 0.28 }
  }
];

const EDGES = [
  ['Aster', 'Briar', { trust: 0.72, comfort: 0.7, attachment: 0.68, protectiveness: 0.62, bondTier: 'companion', coTimeSeconds: 900 }],
  ['Aster', 'Clover', { trust: 0.7, comfort: 0.68, attachment: 0.66, protectiveness: 0.6, bondTier: 'companion', coTimeSeconds: 900 }],
  ['Iris', 'Juniper', { trust: 0.78, comfort: 0.76, attachment: 0.84, bondTier: 'bonded', coTimeSeconds: 1900 }],
  ['Iris', 'Kite', { rivalry: 0.38, resentment: 0.2, trust: 0.34, comfort: 0.24 }],
  ['Juniper', 'Kite', { admiration: 0.62, comfort: 0.58, trust: 0.52 }],
  ['Orchid', 'Pollen', { trust: 0.82, comfort: 0.8, attachment: 0.84, bondTier: 'bonded', coTimeSeconds: 1900, lastSeenAtFrameOffset: -120000 }]
];

const FLOWERS = [
  { id: 'moss-fresh-a', kind: 'flower', zoneId: ZONES.moss, u: 6, v: 13, h: 0, flowerType: 'daisy' },
  { id: 'moss-fresh-b', kind: 'flower', zoneId: ZONES.moss, u: 7, v: 13, h: 0, flowerType: 'tulip' },
  { id: 'moss-fresh-c', kind: 'flower', zoneId: ZONES.moss, u: 8, v: 14, h: 0, flowerType: 'lavender' },
  { id: 'moss-fresh-d', kind: 'flower', zoneId: ZONES.moss, u: 9, v: 14, h: 0, flowerType: 'sprout' },
  { id: 'moss-aging-a', kind: 'aging-flower', zoneId: ZONES.moss, u: 11, v: 13, h: 0, flowerType: 'daisy' },
  { id: 'moss-aging-b', kind: 'aging-flower', zoneId: ZONES.moss, u: 12, v: 13, h: 0, flowerType: 'tulip' },
  { id: 'moss-aging-c', kind: 'aging-flower', zoneId: ZONES.moss, u: 13, v: 13, h: 0, flowerType: 'lavender' },
  { id: 'moss-pile-a', kind: 'dirt-pile', zoneId: ZONES.moss, u: 15, v: 12, h: 0 },
  { id: 'moss-pile-b', kind: 'dirt-pile', zoneId: ZONES.moss, u: 16, v: 12, h: 0 },
  { id: 'moss-pile-c', kind: 'dirt-pile', zoneId: ZONES.moss, u: 17, v: 12, h: 0 },
  { id: 'moss-pile-d', kind: 'dirt-pile', zoneId: ZONES.moss, u: 18, v: 12, h: 0 },
  { id: 'ivy-reserve-a', kind: 'reserve-food-ball', zoneId: ZONES.ivy, u: 11, v: 13, h: 0, flowerType: 'daisy' },
  { id: 'ivy-reserve-b', kind: 'reserve-food-ball', zoneId: ZONES.ivy, u: 12, v: 13, h: 0, flowerType: 'lavender' },
  { id: 'pool-flower-a', kind: 'flower', zoneId: ZONES.pool, u: 25, v: 15, h: 0, flowerType: 'tulip' },
  { id: 'pool-flower-b', kind: 'flower', zoneId: ZONES.pool, u: 26, v: 16, h: 0, flowerType: 'sprout' }
];

const BLOCKS = [
  { id: 'ivy-shelter-a', zoneId: ZONES.ivy, u: 4, v: 16, h: 0 },
  { id: 'ivy-shelter-b', zoneId: ZONES.ivy, u: 5, v: 16, h: 0 },
  { id: 'ivy-shelter-c', zoneId: ZONES.ivy, u: 6, v: 16, h: 0 },
  { id: 'moss-stack-base', zoneId: ZONES.moss, u: 20, v: 15, h: 0 },
  { id: 'moss-stack-top', zoneId: ZONES.moss, u: 20, v: 15, h: 1 },
  { id: 'moss-stack-neighbor', zoneId: ZONES.moss, u: 21, v: 15, h: 0 },
  { id: 'pool-wall-a', zoneId: ZONES.pool, u: 24, v: 15, h: 0 },
  { id: 'pool-wall-b', zoneId: ZONES.pool, u: 25, v: 15, h: 0 },
  { id: 'pool-wall-c', zoneId: ZONES.pool, u: 26, v: 15, h: 0 }
];

const SCREENSHOTS = [
  '00-ivy-focused.png',
  '01-inspect-lumen.png',
  '02-overview.png',
  '03-moss-distress.png',
  '04-flower-cleanup.png',
  '05-block-stack.png',
  '06-pool-grief-lonely.png',
  '07-after-reload-inspect.png',
  '08-sun-battle.png',
  '09-final-feed.png'
];

const HUMAN_REVIEW_QUESTIONS = [
  'Does focused mode read as one coherent playable space?',
  'Can you tell where butterflies can move?',
  'Can you tell when something is higher/lower?',
  'Do blocks look snapped and non-overlapping?',
  'Do flower decay, dirt piles, and food reserves read as actual world objects?',
  'Does the feed feel less repetitive and more like cause -> response?',
  'Does inspect explain social state without claiming literal consciousness?',
  'Do distress/caregiving/loyalty/grief/pride/shame read as functional behavior?',
  'Are butterfly sprites clear enough during the scripted close-ups?',
  'Does battle/ability presentation fit the sim-board rules?',
  'After reload, does continuity feel intact?'
];

function getFixtureSpec() {
  return {
    label: 'g0h-scripted-fixture',
    root: ROOT,
    saveExportRoot: path.join(ROOT, 'qa_logs', 'save_exports'),
    packetRoot: path.join(ROOT, 'qa_logs', 'g0h_scripted_playthrough'),
    zones: ZONES,
    cast: CAST,
    edges: EDGES.map(([source, target, values]) => ({ source, target, values })),
    flowers: FLOWERS,
    blocks: BLOCKS,
    screenshots: SCREENSHOTS,
    humanReviewQuestions: HUMAN_REVIEW_QUESTIONS,
    minimumDurationMs: 420000
  };
}

module.exports = {
  ROOT,
  ZONES,
  CAST,
  EDGES,
  FLOWERS,
  BLOCKS,
  SCREENSHOTS,
  HUMAN_REVIEW_QUESTIONS,
  getFixtureSpec
};
