/* PR Social Insight — หน้าเว็บหลัก */
(function () {
"use strict";
const CFG = window.APP_CONFIG || {}, DOMAIN = CFG.DOMAIN || 'cmu.ac.th', API = window.API || {};
const APP_NAME = CFG.APP_NAME || 'PR Social Insight';
// โลโก้หน่วยงาน: ใส่ LOGO_URL ใน config.js (เช่น 'assets/logo.png') ถ้าว่างจะแสดงตัวอักษรย่อ
const brandMark = () => CFG.LOGO_URL
  ? `<span class="brand-mark logo"><img src="${String(CFG.LOGO_URL).replace(/"/g, '&quot;')}" alt="โลโก้ ${String(APP_NAME).replace(/[<>"]/g, '')}" onerror="this.parentNode.classList.remove('logo');this.parentNode.textContent='${String(CFG.LOGO_TEXT || 'PR').replace(/['"<>\\]/g, '')}'"></span>`
  : `<span class="brand-mark">${String(CFG.LOGO_TEXT || 'PR').replace(/[<>&]/g, '')}</span>`;
(function setFavicon() { if (!CFG.LOGO_URL) return; let l = document.querySelector('link[rel="icon"]'); if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); } l.href = CFG.LOGO_URL; })();

/* ================= utilities ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} } };
const nf = new Intl.NumberFormat('th-TH');
function fk(n) { if (n == null || !isFinite(n)) return '—'; const a = Math.abs(n); if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'M'; if (a >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'; return nf.format(Math.round(n)); }
const fnum = n => n == null || !isFinite(n) ? '—' : nf.format(Math.round(n));
const pct = (x, d = 1) => x == null || !isFinite(x) ? '—' : (x * 100).toFixed(d) + '%';
const fdate = d => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
const fds = d => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
const fdt = d => new Date(d).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
function fdur(s) { if (s == null || !isFinite(s)) return '—'; s = Math.round(s); if (s < 60) return s + ' วิ'; if (s < 3600) return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' นาที'; const h = s / 3600; return (h >= 100 ? fk(h) : h.toFixed(1)) + ' ชม.'; }
function fmins(m) { if (m == null || !isFinite(m)) return '—'; if (m < 60) return Math.round(m) + ' นาที'; return (m / 60).toFixed(1) + ' ชม.'; }
const DAY = 864e5;
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); })();
const iso = ms => { const d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };
const sod = ms => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const n0 = v => (v == null || !isFinite(v) ? 0 : v);

/* ================= vocab ================= */
const PL = { fb: { name: 'Facebook', short: 'FB', c: 'var(--fb)' }, ig: { name: 'Instagram', short: 'IG', c: 'var(--ig)' }, tt: { name: 'TikTok', short: 'TT', c: 'var(--tt)' } };
const PKEYS = ['fb', 'ig', 'tt'];
const TYPES = ['Photo', 'Album', 'Reel', 'Short Video', 'Long Video', 'Story', 'Infographic', 'Announcement', 'Live', 'Link Post'];
const VIDEO = new Set(['Reel', 'Short Video', 'Long Video', 'Story', 'Live']);
const PTYPES = { fb: ['Photo', 'Album', 'Reel', 'Long Video', 'Story', 'Infographic', 'Announcement', 'Live', 'Link Post'], ig: ['Photo', 'Album', 'Reel', 'Story', 'Infographic', 'Announcement', 'Live'], tt: ['Short Video', 'Long Video', 'Photo', 'Story', 'Live'] };
const CATS = [{ k: 'news', t: 'ข่าวประชาสัมพันธ์', c: '#3d5a80' }, { k: 'knowledge', t: 'Knowledge', c: '#2f7d6d' }, { k: 'ent', t: 'Entertainment', c: '#b0476e' }, { k: 'promo', t: 'Promotion', c: '#b8621c' }, { k: 'event', t: 'Event', c: '#6a4c93' }, { k: 'bts', t: 'Behind the scenes', c: '#4f5d75' }, { k: 'ugc', t: 'User Generated Content', c: '#6f7d2f' }, { k: 'engage', t: 'Engagement Post', c: '#b8473a' }, { k: 'edu', t: 'Educational', c: '#1f6f9c' }];
const CAT = Object.fromEntries(CATS.map(c => [c.k, c]));
const SENT = [{ k: 'pos', t: 'Positive', th: 'เชิงบวก', c: 'var(--s-pos)' }, { k: 'neu', t: 'Neutral', th: 'ทั่วไป', c: 'var(--s-neu)' }, { k: 'neg', t: 'Negative', th: 'เชิงลบ', c: 'var(--s-neg)' }, { k: 'q', t: 'Question', th: 'คำถาม', c: 'var(--s-q)' }, { k: 'cmp', t: 'Complaint', th: 'ร้องเรียน', c: 'var(--s-cmp)' }, { k: 'int', t: 'Interested', th: 'สนใจ', c: 'var(--s-int)' }, { k: 'buy', t: 'Purchase intent', th: 'ตั้งใจซื้อ', c: 'var(--s-buy)' }];
const SE = Object.fromEntries(SENT.map(s => [s.k, s]));
const MENUS = [{ k: 'dashboard', t: 'ภาพรวม', sub: 'Overview' }, { k: 'posts', t: 'คอนเทนต์', sub: 'Content' }, { k: 'comments', t: 'ความคิดเห็น', sub: 'Conversations' }, { k: 'audience', t: 'ผู้ติดตาม', sub: 'Audience' }, { k: 'add', t: 'เพิ่มคอนเทนต์', sub: 'Add content' }, { k: 'admin', t: 'ทีมและสิทธิ์', sub: 'Team & access' }];
const PAGES = MENUS.concat([{ k: 'connect', t: 'เชื่อมต่อบัญชี', sub: 'Integrations' }]);
const NAV_GROUPS = [['วิเคราะห์', ['dashboard', 'posts', 'comments', 'audience']], ['จัดการ', ['add', 'connect', 'admin']]];
const ROLES = { 'Super Admin': { menus: MENUS.map(m => m.k), platforms: PKEYS }, 'Editor': { menus: ['dashboard', 'posts', 'comments', 'audience', 'add'], platforms: PKEYS }, 'Analyst': { menus: ['dashboard', 'posts', 'comments', 'audience'], platforms: PKEYS }, 'Viewer': { menus: ['dashboard'], platforms: PKEYS } };
const AGES = ['13–17', '18–24', '25–34', '35–44', '45–54', '55+'];

const ICON = {
  dashboard: '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
  posts: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  comments: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/>',
  audience: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  add: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  admin: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  reply: '<path d="M9 14 4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  plug: '<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4"/>'
};
ICON.connect = ICON.plug;
const ic = (k, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

/* ================= state ================= */
let DB = { posts: [], audience: {}, followers: [], users: [], logs: [] };
let ME = null, FIDX = {};
const S = {
  page: 'dashboard', acting: null,
  f: { platform: 'all', period: 'month', from: iso(TODAY - 29 * DAY), to: iso(TODAY) }, trend: 'reach',
  pf: { q: '', type: '', cat: '', sort: 'new', view: 'grid' },
  ct: 'overview', cf: { cat: '', unreplied: false, q: '' }, cpSort: 'comments', ppSort: 'count', person: null,
  addTab: 'post', editing: null, parsed: [], img: null,
  openPost: null, drawerCat: '', delPost: false, adminEdit: null, confirmDel: null, replyOpen: null, csv: null,
  fx: { link: '', cat: 'news' }, fbLogin: null, pimp: null, pdm: 'views', recent: {}, recentPl: null, connForm: null, metaChoose: null, ttAuth: null, confirmDisc: null, prefill: null
};
const root = () => $('#root');
const me = () => (S.acting ? DB.users.find(u => u.email === S.acting) : ME) || ME;
const can = m => { const u = me(); if (!u) return false; if (m === 'connect') return u.menus.includes('admin'); return u.menus.includes(m); };
const allowedP = () => { const u = me(); return u ? PKEYS.filter(p => u.platforms.includes(p) && (!ME || ME.platforms.includes(p))) : []; };
const activeP = () => { const a = allowedP(); return S.f.platform === 'all' ? a : a.filter(p => p === S.f.platform); };
const localLog = what => DB.logs.unshift({ at: Date.now(), who: ME.email, what });

function load(d) {
  ME = d.user;
  DB = { posts: d.posts || [], audience: d.audience || {}, followers: d.followers || [], daily: (d.daily || []).map(withT), users: d.users || [], logs: d.logs || [], sheetUrl: d.sheetUrl || '', connections: d.connections || {}, loadedAt: Date.now() };
  DB.posts.forEach(p => { p.comments = p.comments || []; p.m = p.m || {}; });
  buildFIdx();
}
function withT(x) { x._t = parseISO(x.date); return x; }
function buildFIdx() {
  FIDX = {};
  PKEYS.forEach(p => { FIDX[p] = DB.followers.filter(f => f.platform === p).map(f => [sod(f.date), f.followers, f.date, f.source || 'manual']).sort((a, b) => a[2] - b[2]); });
}
function folAt(p, ms) {
  const a = FIDX[p]; if (!a || !a.length) return null;
  const t = sod(ms); let lo = 0, hi = a.length - 1, ans = -1;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (a[mid][0] <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
  return ans < 0 ? a[0][1] : a[ans][1];
}
function sumFol(ps, ms) { let s = 0, any = false; ps.forEach(p => { const v = folAt(p, ms); if (v != null) { s += v; any = true; } }); return any ? s : null; }

/* ================= period & aggregation ================= */
const PERIODS = [['day', 'รายวัน'], ['week', 'รายสัปดาห์'], ['month', 'รายเดือน'], ['year', 'รายปี'], ['all', 'ทั้งหมด'], ['custom', 'กำหนดเอง']];
function range() {
  const t = TODAY, end = t + DAY, p = S.f.period; let from, to = end;
  if (p === 'day') from = t; else if (p === 'week') from = t - 6 * DAY; else if (p === 'month') from = t - 29 * DAY; else if (p === 'year') from = t - 364 * DAY;
  else if (p === 'all') { const ts = DB.posts.map(x => x.at).concat((DB.daily || []).map(x => x._t)); from = ts.length ? sod(Math.min(...ts)) : t - 29 * DAY; }
  else { from = S.f.from ? parseISO(S.f.from) : t - 29 * DAY; to = S.f.to ? parseISO(S.f.to) + DAY : end; if (to <= from) to = from + DAY; }
  const len = to - from; return { from, to, pf: from - len, pt: from, hasPrev: p !== 'all' };
}
function rangeText(r) { const a = fdate(r.from), b = fdate(r.to - 1); return a === b ? a : `${fds(r.from)} – ${b}`; }
const postsOf = ps => DB.posts.filter(x => ps.includes(x.platform));
const postsIn = (from, to, ps = activeP()) => DB.posts.filter(x => ps.includes(x.platform) && x.at >= from && x.at < to);
const eng = m => n0(m.reactions) + n0(m.comments) + n0(m.shares) + n0(m.saves);
function agg(list) {
  const a = { n: list.length, reach: 0, impressions: 0, reactions: 0, comments: 0, shares: 0, saves: 0, clicks: 0, profileVisits: 0, newFollowers: 0, linkClicks: 0, videoViews: 0, eng: 0 };
  list.forEach(p => { for (const k in p.m) if (k in a) a[k] += n0(p.m[k]); a.eng += eng(p.m); if (p.v) a.videoViews += n0(p.v.videoViews); });
  a.er = a.reach ? a.eng / a.reach : null; return a;
}
function cstats(list) {
  const all = list.flatMap(p => p.comments.map(c => Object.assign({}, c, { post: p, ref: c })));
  const by = {}; SENT.forEach(s => by[s.k] = 0); all.forEach(c => by[c.cat] = (by[c.cat] || 0) + 1);
  const replied = all.filter(c => c.thread.some(t => t.from === 'page'));
  const convo = replied.filter(c => c.thread.some(t => t.from === 'user'));
  const rt = replied.map(c => (c.thread.find(t => t.from === 'page').at - c.at) / 6e4).filter(x => x >= 0);
  const needs = all.filter(c => ['q', 'cmp', 'buy'].includes(c.cat) && !c.thread.some(t => t.from === 'page'));
  return { all, total: all.length, by, replyRate: all.length ? replied.length / all.length : null, convoRate: replied.length ? convo.length / replied.length : null, avgRT: rt.length ? rt.reduce((s, x) => s + x, 0) / rt.length : null, needs, posRate: all.length ? by.pos / all.length : null, negRate: all.length ? (by.neg + by.cmp) / all.length : null };
}
function delta(cur, prev) { if (prev == null || cur == null || !isFinite(prev) || prev === 0) return null; return (cur - prev) / prev; }
function dpill(d) { if (d == null) return '<span class="pill flat">—</span>'; const up = d >= 0; return `<span class="pill ${Math.abs(d) < .005 ? 'flat' : up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(d * 100).toFixed(1)}%</span>`; }
function buckets(from, to) {
  const span = (to - from) / DAY, b = [];
  if (span <= 1.01) { for (let h = 0; h < 24; h++) { const s = from + h * 36e5; b.push({ s, e: s + 36e5, l: String(h).padStart(2, '0') + ':00' }); } return { u: 'hour', b }; }
  if (span <= 62) { for (let s = from; s < to; s += DAY) b.push({ s, e: Math.min(s + DAY, to), l: fds(s) }); return { u: 'day', b }; }
  if (span <= 200) { for (let s = from; s < to; s += 7 * DAY) b.push({ s, e: Math.min(s + 7 * DAY, to), l: fds(s) }); return { u: 'week', b }; }
  let d = new Date(from); d = new Date(d.getFullYear(), d.getMonth(), 1);
  while (d.getTime() < to) { const n = new Date(d.getFullYear(), d.getMonth() + 1, 1); b.push({ s: Math.max(d.getTime(), from), e: Math.min(n.getTime(), to), l: d.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }) }); d = n; }
  return { u: 'month', b };
}

/* ================= charts ================= */
let charts = [], gradSeq = 0;
function smoothPath(pts) {
  const f = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
  if (pts.length < 3) return pts.map((p, i) => (i ? 'L' : 'M') + f(p)).join('');
  const n = pts.length, dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / (dx[i] || 1); }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; } const a = t[i] / m[i], b = t[i + 1] / m[i], q = a * a + b * b; if (q > 9) { const k = 3 / Math.sqrt(q); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; } }
  let d = 'M' + f(pts[0]);
  for (let i = 0; i < n - 1; i++) { const h = dx[i] / 3; d += `C${(pts[i][0] + h).toFixed(1)} ${(pts[i][1] + t[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)} ${(pts[i + 1][1] - t[i + 1] * h).toFixed(1)} ${f(pts[i + 1])}`; }
  return d;
}
function niceStep(x) { const p = Math.pow(10, Math.floor(Math.log10(x))); const f = x / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; }
function lineChart(el, cfg, animate) {
  const W = Math.max(260, el.clientWidth), H = cfg.h || 250, m = { t: 14, r: 14, b: 28, l: 48 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b, n = cfg.labels.length;
  const mx = Math.max(1, ...cfg.series.flatMap(s => s.values)); const step = niceStep(mx / 4); const top = Math.ceil(mx / step) * step;
  const x = i => m.l + (n <= 1 ? iw / 2 : i * iw / (n - 1)), y = v => m.t + ih - v / top * ih;
  let g = '';
  for (let v = 0; v <= top + 1e-9; v += step) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line);stroke-width:1${v ? ';stroke-dasharray:2 4' : ''}"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${fk(v)}</text>`;
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
  cfg.labels.forEach((l, i) => { if (i % every === 0) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`; });
  let defs = '';
  cfg.series.forEach(s => {
    const pts = s.values.map((v, i) => [x(i), y(v)]); const d = smoothPath(pts); const gid = 'lg' + (++gradSeq);
    defs += `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${s.color};stop-opacity:${cfg.series.length > 1 ? .16 : .28}"/><stop offset="1" style="stop-color:${s.color};stop-opacity:0"/></linearGradient>`;
    if (n > 1) g += `<path class="${animate === 'soft' ? 'fade-in' : animate ? 'area-fade' : ''}" d="${d}L${x(n - 1)} ${y(0)}L${x(0)} ${y(0)}Z" fill="url(#${gid})"/>`;
    g += `<path class="${animate === 'soft' ? 'fade-in' : animate ? 'line-draw' : ''}" pathLength="1" d="${d}" style="fill:none;stroke:${s.color};stroke-width:2.25;stroke-linejoin:round;stroke-linecap:round"/>`;
    const lp = pts[pts.length - 1]; if (lp) g += `<circle class="${animate ? 'area-fade' : ''}" cx="${lp[0]}" cy="${lp[1]}" r="4" style="fill:${s.color};stroke:var(--surface);stroke-width:2"/>`;
  });
  g += `<line class="xh" x1="0" x2="0" y1="${m.t}" y2="${m.t + ih}" style="stroke:var(--ink-3);stroke-width:1;opacity:0;transition:opacity .15s"/>`;
  g += cfg.series.map((s, k) => `<circle class="hd hd${k}" r="4.5" cx="-10" cy="-10" style="fill:${s.color};stroke:var(--surface);stroke-width:2;opacity:0;transition:opacity .15s"/>`).join('');
  g += `<rect class="hit" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" style="fill:transparent"/>`;
  el.innerHTML = `<svg width="${W}" height="${H}" role="img" aria-label="${esc(cfg.aria || 'กราฟแนวโน้ม')}"><defs>${defs}</defs>${g}</svg><div class="tip"></div>`;
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), xh = svg.querySelector('.xh'), hit = svg.querySelector('.hit');
  const move = ev => {
    const r = svg.getBoundingClientRect(); let i = n <= 1 ? 0 : Math.round((ev.clientX - r.left - m.l) / iw * (n - 1)); i = Math.max(0, Math.min(n - 1, i));
    xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.style.opacity = 1;
    cfg.series.forEach((s, k) => { const c = svg.querySelector('.hd' + k); c.setAttribute('cx', x(i)); c.setAttribute('cy', y(s.values[i])); c.style.opacity = 1; });
    tip.innerHTML = `<b>${esc(cfg.tips ? cfg.tips[i] : cfg.labels[i])}</b>` + cfg.series.map(s => `<div class="row"><i class="dot" style="background:${s.color}"></i><span>${esc(s.name)}</span><span>${(cfg.fmt || fk)(s.values[i])}</span></div>`).join('');
    const tp = Math.min(...cfg.series.map(s => y(s.values[i])));
    const tw = tip.offsetWidth; tip.style.left = Math.max(tw / 2, Math.min(W - tw / 2, x(i))) + 'px'; tip.style.top = (tp - 10) + 'px'; tip.classList.add('on');
  };
  hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
  hit.addEventListener('pointerleave', () => { tip.classList.remove('on'); xh.style.opacity = 0; svg.querySelectorAll('.hd').forEach(c => c.style.opacity = 0); });
}
const drawChart = (el, cfg, animate) => (cfg.type === 'bar' ? vbarChart : lineChart)(el, cfg, animate);
function mountChart(id, cfg, animate) { const el = document.getElementById(id); if (!el) return; charts = charts.filter(c => c.el !== el); charts.push({ el, cfg }); drawChart(el, cfg, animate); }
let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => charts.forEach(c => { if (document.body.contains(c.el)) drawChart(c.el, c.cfg, false); }), 150); });
function barList(items, o = {}) {
  if (!items.length) return `<div class="empty">ยังไม่มีข้อมูลในช่วงนี้</div>`;
  const max = o.max || Math.max(...items.map(i => i.v)) || 1;
  return `<div class="bars">${items.map((i, k) => `<div class="bar-row" title="${esc(i.l)}: ${esc((o.fmt || fk)(i.v))}"><span class="bl">${esc(i.l)}${i.sub ? ` <small>${esc(i.sub)}</small>` : ''}</span><span class="bar-track"><span class="bar-fill" style="--i:${k};width:${Math.max(.5, i.v / max * 100)}%;background:${i.c || o.c || 'var(--accent)'}"></span></span><span class="bv">${(o.fmt || fk)(i.v)}${i.ext ? ` <small>${esc(i.ext)}</small>` : ''}</span></div>`).join('')}</div>`;
}
function stack100(by, { legend = true } = {}) {
  const tot = SENT.reduce((s, x) => s + (by[x.k] || 0), 0);
  if (!tot) return `<div class="empty">ยังไม่มีความคิดเห็น</div>`;
  return `<div class="stack100">${SENT.filter(s => by[s.k]).map(s => `<span title="${s.t} · ${pct(by[s.k] / tot)} (${by[s.k]})" style="width:${by[s.k] / tot * 100}%;background:${s.c}"></span>`).join('')}</div>` +
    (legend ? `<div class="slegend">${SENT.map(s => `<div><i style="background:${s.c}"></i>${s.t} <span class="muted">${s.th}</span><b>${pct((by[s.k] || 0) / tot, 0)}</b></div>`).join('')}</div>` : '');
}
function miniStack(by) { const tot = SENT.reduce((s, x) => s + (by[x.k] || 0), 0); if (!tot) return '<span class="muted">—</span>'; return `<div class="mini-stack">${SENT.filter(s => by[s.k]).map(s => `<span title="${s.t} ${by[s.k]}" style="width:${by[s.k] / tot * 100}%;background:${s.c}"></span>`).join('')}</div>`; }
function spark(vals, color, W = 120, H = 34) {
  if (vals.length < 2) return ''; const mn = Math.min(...vals), mx = Math.max(...vals); const sc = v => H - 4 - (mx === mn ? .5 : (v - mn) / (mx - mn)) * (H - 8);
  const pts = vals.map((v, i) => [i / (vals.length - 1) * (W - 6) + 3, sc(v)]); const d = smoothPath(pts); const gid = 'sg' + (++gradSeq); const lp = pts[pts.length - 1];
  return `<svg class="spark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${color};stop-opacity:.25"/><stop offset="1" style="stop-color:${color};stop-opacity:0"/></linearGradient></defs><path class="area-fade" d="${d}L${lp[0]} ${H}L${pts[0][0]} ${H}Z" fill="url(#${gid})"/><path class="line-draw" pathLength="1" d="${d}" style="fill:none;stroke:${color};stroke-width:2;stroke-linecap:round"/><circle cx="${lp[0]}" cy="${lp[1]}" r="3" style="fill:${color};stroke:var(--surface);stroke-width:1.5"/></svg>`;
}
function emptyState(title, text, action) {
  return `<div class="empty-state"><svg viewBox="0 0 124 92" width="124" height="92" aria-hidden="true"><rect x="16" y="22" width="72" height="54" rx="12" style="fill:var(--surface-2);stroke:var(--line-2)"/><rect x="34" y="12" width="72" height="54" rx="12" style="fill:var(--surface);stroke:var(--line-2)"/><path d="M46 50l10-12 8 8 10-13 14 17" style="fill:none;stroke:var(--accent);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round"/><circle cx="52" cy="28" r="4" style="fill:var(--accent-2)"/><path d="M104 10l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" style="fill:var(--gold)"/></svg><b>${title}</b><p>${text}</p>${action ? `<div class="btns">${action}</div>` : ''}</div>`;
}
function ago(ms) {
  if (!ms) return '—'; const s = (Date.now() - ms) / 1000;
  if (s < 60) return 'เมื่อสักครู่'; if (s < 3600) return Math.floor(s / 60) + ' นาทีที่แล้ว'; if (s < 86400) return Math.floor(s / 3600) + ' ชั่วโมงที่แล้ว';
  if (s < 7 * 86400) return Math.floor(s / 86400) + ' วันที่แล้ว'; return fdate(ms);
}
function donut(segs, o = {}) {
  segs = segs.filter(s => s.v > 0); const tot = segs.reduce((s, x) => s + x.v, 0);
  if (!tot) return emptyState(o.emptyTitle || 'ยังไม่มีข้อมูล', o.emptyText || 'ข้อมูลจะแสดงเมื่อมีโพสต์ในช่วงที่เลือก');
  const R = 52, C = 2 * Math.PI * R, gap = segs.length > 1 ? 2.2 : 0; let off = 0;
  const arcs = segs.map((s, i) => { const len = Math.max(.6, s.v / tot * C - gap); const a = `<circle class="arc" data-seg="${i}" r="${R}" cx="70" cy="70" style="stroke:${s.c};--c:${C.toFixed(1)};stroke-dasharray:${len.toFixed(2)} ${C.toFixed(1)};stroke-dashoffset:${(-off).toFixed(2)}"></circle>`; off += s.v / tot * C; return a; }).join('');
  const data = segs.map(s => [s.l, (o.fmt || fk)(s.v), pct(s.v / tot, 0)]);
  return `<div class="donut${o.small ? ' sm' : ''}" data-segs="${esc(JSON.stringify(data))}">
    <div class="donut-fig"><svg viewBox="0 0 140 140" role="img" aria-label="${esc(o.aria || 'แผนภูมิวงกลม')}"><circle r="${R}" cx="70" cy="70" class="arc-bg"></circle><g transform="rotate(-90 70 70)">${arcs}</g></svg>
     <div class="donut-c"><b>${o.centerHtml || esc(o.center || '')}</b><span>${esc(o.sub || '')}</span></div></div>
    <ul class="donut-legend">${segs.map((s, i) => `<li data-seg="${i}"><i style="background:${s.c}"></i><span>${esc(s.l)}</span><b>${(o.fmt || fk)(s.v)}</b><em>${pct(s.v / tot, 0)}</em></li>`).join('')}</ul></div>`;
}
function donutHover(e) {
  const seg = e.target.closest && e.target.closest('.donut [data-seg]');
  const dn = e.target.closest && e.target.closest('.donut');
  $$('.donut').forEach(d => { if (d !== dn || !seg) donutReset(d); });
  if (!seg || !dn) return;
  const i = +seg.dataset.seg, data = JSON.parse(dn.dataset.segs || '[]')[i]; if (!data) return;
  const c = $('.donut-c', dn); if (!dn._orig) dn._orig = c.innerHTML;
  c.innerHTML = `<b>${esc(data[2])}</b><span>${esc(data[0])}</span>`; c.classList.add('hov');
  $$('[data-seg]', dn).forEach(x => x.classList.toggle('hot', +x.dataset.seg === i));
}
function donutReset(d) { if (d._orig) { const c = $('.donut-c', d); c.innerHTML = d._orig; c.classList.remove('hov'); d._orig = null; } $$('.hot', d).forEach(x => x.classList.remove('hot')); }
document.addEventListener('pointerover', donutHover);
function vbarChart(el, cfg, animate) {
  const W = Math.max(260, el.clientWidth), H = cfg.h || 250, m = { t: 14, r: 10, b: 28, l: 48 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b, n = cfg.labels.length;
  const totals = cfg.labels.map((_, i) => cfg.series.reduce((s, x) => s + n0(x.values[i]), 0));
  const mx = Math.max(1, ...totals); const step = niceStep(mx / 4); const top = Math.ceil(mx / step) * step;
  const y = v => m.t + ih - v / top * ih; const cw = iw / n; const bw = Math.max(3, Math.min(30, cw * .62)); const x = i => m.l + (i + .5) * cw;
  let g = '';
  for (let v = 0; v <= top + 1e-9; v += step) g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line);stroke-width:1${v ? ';stroke-dasharray:2 4' : ''}"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end">${fk(v)}</text>`;
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
  cfg.labels.forEach((l, i) => { if (i % every === 0) g += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`; });
  cfg.labels.forEach((_, i) => {
    let acc = 0; let col = '';
    const segs = cfg.series.map(s => ({ v: n0(s.values[i]), c: s.color })).filter(s => s.v > 0);
    segs.forEach((s, j) => { const y1 = y(acc + s.v), y0 = y(acc); const h = Math.max(1, y0 - y1 - (j < segs.length - 1 ? 1.5 : 0)); col += `<rect x="${(x(i) - bw / 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="${j === segs.length - 1 ? 3 : 1}" style="fill:${s.c}"/>`; acc += s.v; });
    g += `<g class="${animate === 'soft' ? 'fade-in' : animate ? 'vb-grow' : ''}" style="--i:${Math.min(i, 40)}">${col}</g>`;
  });
  g += `<rect class="vhl" x="0" y="${m.t}" width="${cw}" height="${ih}" style="fill:var(--ink);opacity:0;transition:opacity .15s"/>`;
  g += `<rect class="hit" x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" style="fill:transparent"/>`;
  el.innerHTML = `<svg width="${W}" height="${H}" role="img" aria-label="${esc(cfg.aria || 'กราฟแท่ง')}">${g}</svg><div class="tip"></div>`;
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), hl = svg.querySelector('.vhl'), hit = svg.querySelector('.hit');
  const move = ev => {
    const r = svg.getBoundingClientRect(); let i = Math.floor((ev.clientX - r.left - m.l) / cw); i = Math.max(0, Math.min(n - 1, i));
    hl.setAttribute('x', m.l + i * cw); hl.style.opacity = .05;
    tip.innerHTML = `<b>${esc(cfg.tips ? cfg.tips[i] : cfg.labels[i])}</b>` + cfg.series.map(s => `<div class="row"><i class="dot" style="background:${s.color}"></i><span>${esc(s.name)}</span><span>${fnum(s.values[i])}</span></div>`).join('') + `<div class="row" style="border-top:1px solid rgba(255,255,255,.2);margin-top:3px;padding-top:3px"><span>รวม</span><span>${fnum(totals[i])}</span></div>`;
    const tw = tip.offsetWidth; tip.style.left = Math.max(tw / 2, Math.min(W - tw / 2, x(i))) + 'px'; tip.style.top = (y(totals[i]) - 10) + 'px'; tip.classList.add('on');
  };
  hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
  hit.addEventListener('pointerleave', () => { tip.classList.remove('on'); hl.style.opacity = 0; });
}
function heatmap(list) {
  const days = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'], dayFull = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'];
  const blocks = [[6, 9, '06–09'], [9, 12, '09–12'], [12, 15, '12–15'], [15, 18, '15–18'], [18, 21, '18–21'], [21, 24, '21–24'], [0, 6, '00–06']];
  const cell = days.map(() => blocks.map(() => ({ n: 0, e: 0, r: 0 })));
  list.forEach(p => { const d = new Date(p.at); const di = (d.getDay() + 6) % 7, h = d.getHours(); const bi = blocks.findIndex(b => h >= b[0] && h < b[1]); if (bi < 0) return; const c = cell[di][bi]; c.n++; c.e += eng(p.m); c.r += n0(p.m.reach); });
  const val = c => c.n ? (c.r ? c.e / c.r : null) : null;
  let max = 0, best = null;
  cell.forEach((row, di) => row.forEach((c, bi) => { const v = val(c); if (v != null && v > max) { max = v; best = { di, bi, v, n: c.n }; } }));
  if (!list.length) return emptyState('ยังไม่มีข้อมูลเวลาโพสต์', 'เมื่อมีโพสต์ ระบบจะแสดงว่าวันและเวลาไหนได้ผลดีที่สุด');
  return `<div class="heat" role="table" aria-label="อัตราการมีส่วนร่วมตามวันและเวลา">
    <div class="heat-row head" role="row"><span></span>${blocks.map(b => `<span role="columnheader">${b[2]}</span>`).join('')}</div>
    ${days.map((d, di) => `<div class="heat-row" role="row"><span role="rowheader">${d}</span>${blocks.map((b, bi) => { const c = cell[di][bi], v = val(c); const a = v == null ? 0 : Math.round(14 + v / (max || 1) * 80); return `<span role="cell" class="hc${best && best.di === di && best.bi === bi ? ' best' : ''}" style="${v == null ? '' : `background:color-mix(in srgb,var(--accent) ${a}%,var(--surface-2))`}" title="${dayFull[di]} ${b[2]} น. · ${c.n} โพสต์${v != null ? ' · ER ' + pct(v, 1) : ''}"></span>`; }).join('')}</div>`).join('')}
    <div class="heat-foot"><span>น้อย</span><i></i><span>มาก</span></div>
   </div>${best ? `<p class="note heat-best">${ic('spark', 13)} ดีที่สุด: <b>${dayFull[best.di]} ${blocks[best.bi][2]} น.</b> · ER ${pct(best.v, 1)} (${best.n} โพสต์)</p>` : ''}`;
}

function split(a, la, lb) { const b = 1 - a; return `<div class="split"><div class="split-bar"><span style="width:${a * 100}%;background:var(--accent)">${pct(a, 0)}</span><span style="width:${b * 100}%;background:var(--ink-3)">${pct(b, 0)}</span></div><div class="split-labels"><span><i class="dot" style="background:var(--accent)"></i> ${la}</span><span>${lb} <i class="dot" style="background:var(--ink-3)"></i></span></div></div>`; }
function countUp(scope, prev) {
  const els = $$('[data-count]', scope); if (!els.length) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; if (reduce) return;
  const fmt = (el, v) => { const f = el.dataset.fmt; return f === 'pct' ? pct(v, +el.dataset.dec || 0) : f === 'n' ? fnum(v) : fk(v); };
  const items = els.map(el => { const b = +el.dataset.count; const k = el.dataset.key; const a = prev ? (k && prev[k] != null && isFinite(prev[k]) ? prev[k] : b) : 0; return { el, a, b }; }).filter(x => x.a !== x.b || !prev);
  if (!items.length) return;
  items.forEach(x => x.el.textContent = fmt(x.el, x.a));
  const t0 = performance.now(), D = prev ? 820 : 950;
  const tick = t => { const k = Math.min(1, (t - t0) / D), e = 1 - Math.pow(1 - k, 3); items.forEach(x => x.el.textContent = fmt(x.el, x.a + (x.b - x.a) * e)); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
const cnt = (v, f = 'k', dec, key) => v == null || !isFinite(v) ? '—' : `<span data-count="${v}" data-fmt="${f}"${dec != null ? ` data-dec="${dec}"` : ''}${key ? ` data-key="${key}"` : ''}>${f === 'pct' ? pct(v, dec || 0) : f === 'n' ? fnum(v) : fk(v)}</span>`;

/* ================= small renderers ================= */
const platChip = p => `<span class="chip plat"><i class="dot" style="background:${PL[p].c}"></i>${PL[p].name}</span>`;
const typeChip = t => `<span class="chip">${esc(t)}</span>`;
const catChip = k => CAT[k] ? `<span class="chip" style="background:color-mix(in srgb,${CAT[k].c} 15%,transparent);color:var(--ink)">${esc(CAT[k].t)}</span>` : '';
function thumb(p, sm) {
  const c = (CAT[p.cat] || CATS[0]).c, pc = (PL[p.platform] || PL.fb).c;
  return `<div class="thumb${sm ? ' sm' : ''}${p.img ? '' : ' ph'}" style="--tc:${c};--tp:${pc}">${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('ph');this.remove()">` : (sm ? '' : `<span class="t-cap">${esc(p.caption)}</span><span class="t-mark">${(PL[p.platform] || PL.fb).short}</span>`)}${VIDEO.has(p.type) ? `<span class="t-play">${ic('play', 12)}</span>` : ''}<span class="t-type">${esc(p.type)}</span></div>`;
}
const initials = n => esc((n || '?').replace(/^(ฝ่าย|ทีม)/, '').trim().slice(0, 2));
function stagger(scope) { $$('[data-stagger]', scope).forEach(c => Array.from(c.children).forEach((ch, i) => ch.style.setProperty('--i', Math.min(i, 12)))); }

/* ================= toast & helpers ================= */
function toast(text, type = 'ok') {
  let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast ' + type;
  t.innerHTML = `<span class="ti">${ic(type === 'error' ? 'x' : type === 'info' ? 'spark' : 'check', 12)}</span><span>${esc(text)}</span>`;
  box.appendChild(t); while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, type === 'error' ? 4200 : 2600);
}
function handleErr(e) {
  if (e && e.code === 'unauthorized') { toast(e.message, 'error'); setTimeout(() => showAuth(), 700); return; }
  toast((e && e.message) || 'เกิดข้อผิดพลาด ลองอีกครั้ง', 'error');
}
async function busy(btn, fn) {
  if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  try { return await fn(); }
  catch (e) { handleErr(e); throw e; }
  finally { if (btn) { btn.classList.remove('loading'); btn.disabled = false; } }
}
function applyTheme() { const t = store.get('psi_theme'); if (t) document.documentElement.setAttribute('data-theme', t); }
function isDark() { const a = document.documentElement.getAttribute('data-theme'); return a ? a === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }

/* =====================================================================
   AUTH — ขอตรวจสอบสิทธิ์ด้วยอีเมล @cmu.ac.th
   ===================================================================== */
const A = { email: '', sentTo: '', demoCode: null, timer: null, resendAt: 0 };
function showAuth() {
  closeDrawer(); ME = null; S.acting = null;
  const r = root();
  const paint = () => {
    r.innerHTML = `<div class="auth" id="auth">
      <section class="auth-art" aria-hidden="true">
        <div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="grain"></div>
        <div class="auth-brand">${brandMark()}<b>${esc(APP_NAME)}</b></div>
        <div class="auth-copy"><span class="eyebrow">${esc(CFG.ORG_NAME || 'Public Relations')} · Social Analytics</span><h1>ข้อมูลโซเชียลทุกช่องทาง ในที่เดียว</h1><p>Facebook, Instagram และ TikTok — ตัวชี้วัดรายโพสต์ ความคิดเห็นเชิงคุณภาพ และข้อมูลผู้ชม สำหรับวางกลยุทธ์คอนเทนต์</p></div>
        <div class="float-cards"><div class="fc">Reach<b>+48.0%</b>${spark([3, 4, 3.6, 5, 4.8, 6.2, 7], '#e9c77f', 110, 26)}</div><div class="fc">Engagement rate<b>5.71%</b></div><div class="fc">Positive comments<b>33%</b></div></div>
      </section>
      <section class="auth-panel"><div class="auth-card">
        <ol class="stepper" aria-label="ขั้นตอนเข้าสู่ระบบ"><li data-s="1"><span>1</span><em class="lbl">อีเมล</em></li><li class="bar" data-b="1" aria-hidden="true"></li><li data-s="2"><span>2</span><em class="lbl">ยืนยันรหัส</em></li><li class="bar" data-b="2" aria-hidden="true"></li><li data-s="3"><span>3</span><em class="lbl">ตรวจสอบสิทธิ์</em></li></ol>
        <div id="step-host" aria-live="polite"></div>
        <div class="auth-foot">${ic('lock', 15)}<span>ใช้ได้เฉพาะอีเมล <b class="mono">@${esc(DOMAIN)}</b> · ผู้ใช้ใหม่จะถูกส่งคำขอสิทธิ์ถึงแอดมินโดยอัตโนมัติ</span></div>
      </div></section></div>`;
    setStep(1, stepEmail());
  };
  const app = $('.app', r);
  if (app) { app.style.transition = 'opacity .3s'; app.style.opacity = 0; setTimeout(paint, 280); } else paint();
}
function setStep(n, html, after) {
  const host = $('#step-host'); if (!host) return;
  const old = host.firstElementChild;
  const put = () => {
    host.innerHTML = `<div class="step enter">${html}</div>`;
    $$('.stepper li[data-s]').forEach(li => { const s = +li.dataset.s; li.classList.toggle('on', s === n); li.classList.toggle('done', s < n); li.querySelector('span').innerHTML = s < n ? ic('check', 13) : s; });
    $$('.stepper .bar').forEach(b => b.classList.toggle('done', +b.dataset.b < n));
    bindStep(n); if (after) after();
  };
  if (old) { old.classList.remove('enter'); old.classList.add('leave'); setTimeout(put, 190); } else put();
}
function stepEmail(err) {
  const user = A.email ? A.email.replace('@' + DOMAIN, '') : '';
  return `<h2>ขอสิทธิ์เข้าใช้งาน</h2>
   <p class="lead">ยืนยันตัวตนด้วยอีเมลมหาวิทยาลัย ระบบจะส่งรหัส 6 หลักไปที่อีเมลของคุณ</p>
   <form id="f-email" novalidate class="stack" style="gap:14px">
    <div class="field"><label for="au-email">อีเมลมหาวิทยาลัย</label>
     <div class="email-box${err ? ' err' : ''}" id="email-box"><input id="au-email" name="email" autocomplete="username" inputmode="email" autocapitalize="off" spellcheck="false" placeholder="ชื่อผู้ใช้" value="${esc(user)}"><span class="suffix" id="sfx">@${esc(DOMAIN)}</span></div>
     <span class="err-msg" id="au-err" ${err ? '' : 'hidden'}>${esc(err || '')}</span>
    </div>
    <button class="btn primary lg" type="submit" id="au-send">ขอรหัสยืนยัน ${ic('arrow', 16)}</button>
   </form>
   ${API.demo ? `<div class="field"><span class="lbl">โหมดสาธิต · ลองด้วยบัญชีตัวอย่าง</span><div class="demo-accts">${['pr.admin', 'tiktok.team', 'nattapong.k', 'new.staff'].map(u => `<button type="button" class="chip" data-auth="demo" data-v="${u}@${DOMAIN}">${u}@${DOMAIN}</button>`).join('')}<button type="button" class="chip" data-auth="demo" data-v="someone@gmail.com">someone@gmail.com</button></div></div>` : ''}`;
}
function stepOtp(err) {
  return `<h2>กรอกรหัสยืนยัน</h2>
   <p class="lead">ส่งรหัส 6 หลักไปที่ <b>${esc(A.sentTo)}</b> แล้ว รหัสใช้ได้ 10 นาที ตรวจสอบกล่องจดหมายหรือ Junk</p>
   ${A.demoCode ? `<div class="demo-box">${ic('spark', 16)}<span>โหมดสาธิต — ระบบจริงจะส่งรหัสทางอีเมล รหัสของคุณคือ</span><b>${A.demoCode}</b><button type="button" class="btn sm" data-auth="fill">กรอกให้</button></div>` : ''}
   <form id="f-otp" novalidate class="stack" style="gap:14px">
    <div class="otp${err ? ' err shake' : ''}" id="otp" role="group" aria-label="รหัสยืนยัน 6 หลัก">${[0, 1, 2, 3, 4, 5].map(i => `<input inputmode="numeric" pattern="[0-9]*" maxlength="1" ${i === 0 ? 'autocomplete="one-time-code"' : 'autocomplete="off"'} aria-label="หลักที่ ${i + 1}" data-i="${i}">`).join('')}</div>
    <span class="err-msg" id="otp-err" ${err ? '' : 'hidden'}>${esc(err || '')}</span>
    <button class="btn primary lg" type="submit" id="otp-go">ยืนยันและตรวจสอบสิทธิ์ ${ic('arrow', 16)}</button>
   </form>
   <div class="resend"><button type="button" class="linkbtn" data-auth="back">เปลี่ยนอีเมล</button><span id="rs"></span></div>`;
}
function stepCheck() {
  return `<h2>กำลังตรวจสอบสิทธิ์</h2><p class="lead">${esc(A.email)}</p>
   <ul class="checks">${[['ck1', `อีเมลอยู่ในโดเมน @${DOMAIN}`], ['ck2', 'ยืนยันรหัส OTP'], ['ck3', 'ตรวจสอบสิทธิ์การเข้าใช้งาน'], ['ck4', 'โหลดข้อมูลแดชบอร์ด']].map(([id, t]) => `<li id="${id}"><span class="ci"></span>${t}</li>`).join('')}</ul>`;
}
function stepResult(kind) {
  if (kind === 'pending') return `<div class="result"><div class="badge-ic wait">${ic('clock', 30)}</div><h2>ส่งคำขอสิทธิ์แล้ว</h2>
    <p class="lead">อีเมล <b>${esc(A.email)}</b> ยืนยันตัวตนสำเร็จ แต่ยังไม่มีสิทธิ์เข้าใช้งาน ระบบแจ้งแอดมินให้แล้ว</p>
    <div class="timeline"><div class="done">ยืนยันอีเมล @${esc(DOMAIN)}</div><div class="now">รอแอดมินอนุมัติสิทธิ์และกำหนดเมนูที่เข้าถึงได้</div><div>เข้าสู่ระบบอีกครั้งหลังได้รับอีเมลแจ้งอนุมัติ</div></div>
    ${API.demo ? `<p class="note" style="margin:0">ลองเข้าด้วย pr.admin@${esc(DOMAIN)} เพื่ออนุมัติคำขอนี้ในเมนู “ผู้ใช้และสิทธิ์”</p>` : ''}
    <button type="button" class="btn" data-auth="restart">กลับหน้าเข้าสู่ระบบ</button></div>`;
  if (kind === 'suspended') return `<div class="result"><div class="badge-ic no">${ic('lock', 28)}</div><h2>บัญชีถูกระงับการใช้งาน</h2>
    <p class="lead">อีเมล <b>${esc(A.email)}</b> ถูกระงับสิทธิ์ ติดต่อแอดมิน${esc(CFG.ORG_NAME || '')}หากคิดว่าเป็นความผิดพลาด</p><button type="button" class="btn" data-auth="restart">กลับหน้าเข้าสู่ระบบ</button></div>`;
  return `<div class="result"><div class="badge-ic ok">${ic('check', 32)}</div><h2>ยินดีต้อนรับ${ME ? ', ' + esc(ME.name) : ''}</h2><p class="lead">ได้รับสิทธิ์ ${esc(ME ? ME.role : '')} · กำลังเปิดแดชบอร์ด</p></div>`;
}
function bindStep(n) {
  if (n === 1) {
    const inp = $('#au-email'), sfx = $('#sfx');
    const sync = () => { sfx.style.opacity = inp.value.includes('@') ? 0 : 1; sfx.style.width = inp.value.includes('@') ? '0' : ''; sfx.style.padding = inp.value.includes('@') ? '0' : ''; };
    inp.addEventListener('input', () => { sync(); $('#email-box').classList.remove('err'); $('#au-err').hidden = true; }); sync();
    setTimeout(() => inp.focus(), 60);
  }
  if (n === 2) {
    const boxes = $$('#otp input');
    boxes.forEach((b, i) => {
      b.addEventListener('input', () => { const d = b.value.replace(/\D/g, ''); b.value = d.slice(-1); b.classList.toggle('filled', !!b.value); $('#otp').classList.remove('err', 'shake'); $('#otp-err').hidden = true; if (b.value && i < 5) boxes[i + 1].focus(); if (boxes.every(x => x.value)) submitOtp(); });
      b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && i > 0) { boxes[i - 1].value = ''; boxes[i - 1].classList.remove('filled'); boxes[i - 1].focus(); e.preventDefault(); } if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1].focus(); if (e.key === 'ArrowRight' && i < 5) boxes[i + 1].focus(); });
      b.addEventListener('paste', e => { const t = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/\D/g, '').slice(0, 6); if (!t) return; e.preventDefault(); fillOtp(t); });
      b.addEventListener('focus', () => b.select());
    });
    setTimeout(() => boxes[0].focus(), 80);
    startResendTimer();
  }
}
function fillOtp(t) { const boxes = $$('#otp input'); t.split('').forEach((d, i) => { if (boxes[i]) { boxes[i].value = d; boxes[i].classList.add('filled'); } }); if (t.length >= 6) submitOtp(); else boxes[Math.min(t.length, 5)].focus(); }
function startResendTimer() {
  clearInterval(A.timer);
  const tick = () => { const el = $('#rs'); if (!el) { clearInterval(A.timer); return; } const left = Math.ceil((A.resendAt - Date.now()) / 1000); if (left > 0) el.textContent = `ส่งรหัสใหม่ได้ใน ${left} วินาที`; else { el.innerHTML = `<button type="button" class="linkbtn" data-auth="resend">ส่งรหัสใหม่</button>`; clearInterval(A.timer); } };
  tick(); A.timer = setInterval(tick, 1000);
}
function normEmail(v) { v = String(v || '').trim().toLowerCase(); if (!v) return ''; return v.includes('@') ? v : v + '@' + DOMAIN; }
async function submitEmail(v) {
  const email = normEmail(v);
  const bad = msg => { const box = $('#email-box'), er = $('#au-err'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('err', 'shake'); er.textContent = msg; er.hidden = false; };
  if (!email) return bad('กรอกชื่อผู้ใช้อีเมลของคุณ');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('รูปแบบอีเมลไม่ถูกต้อง ตรวจสอบแล้วลองอีกครั้ง');
  if (!email.endsWith('@' + DOMAIN)) return bad(`ระบบนี้อนุญาตเฉพาะอีเมล @${DOMAIN} — ใช้อีเมลมหาวิทยาลัยของคุณแทน`);
  const btn = $('#au-send'); btn.classList.add('loading'); btn.disabled = true;
  try {
    const r = await API.requestOtp(email);
    A.email = email; A.sentTo = r.sentTo || email; A.demoCode = r.demoCode || null; A.resendAt = Date.now() + (r.resendIn || 60) * 1000;
    setStep(2, stepOtp());
  } catch (e) {
    btn.classList.remove('loading'); btn.disabled = false;
    if (e.code === 'too_soon') { A.email = email; A.sentTo = email; A.demoCode = null; A.resendAt = Date.now() + 60e3; setStep(2, stepOtp()); toast('เพิ่งส่งรหัสไปเมื่อสักครู่ ใช้รหัสล่าสุดในอีเมลได้เลย', 'info'); return; }
    bad(e.message || 'ส่งรหัสไม่สำเร็จ ลองอีกครั้ง');
  }
}
let verifying = false;
async function submitOtp() {
  if (verifying) return;
  const code = $$('#otp input').map(b => b.value).join('');
  if (code.length < 6) { const o = $('#otp'); o.classList.remove('shake'); void o.offsetWidth; o.classList.add('err', 'shake'); const er = $('#otp-err'); er.textContent = 'กรอกรหัสให้ครบ 6 หลัก'; er.hidden = false; return; }
  verifying = true; clearInterval(A.timer);
  setStep(3, stepCheck(), () => runChecks(code));
}
async function runChecks(code) {
  const mark = (id, st) => { const li = $('#' + id); if (!li) return; li.className = st; li.querySelector('.ci').innerHTML = st === 'ok' ? ic('check', 14) : st === 'fail' ? ic('x', 13) : ''; };
  const minWait = p => Promise.all([p, wait(480)]).then(r => r[0]);
  try {
    mark('ck1', 'run'); await wait(380); mark('ck1', 'ok');
    mark('ck2', 'run');
    let res;
    try { res = await minWait(API.verifyOtp(A.email, code)); }
    catch (e) { mark('ck2', 'fail'); await wait(650); verifying = false; setStep(2, stepOtp(e.message)); if (e.code === 'otp_expired' || e.code === 'otp_locked') A.resendAt = 0; return; }
    mark('ck2', 'ok'); mark('ck3', 'run'); await wait(420);
    if (res.status !== 'active') { mark('ck3', 'fail'); await wait(500); verifying = false; setStep(3, stepResult(res.status)); return; }
    mark('ck3', 'ok'); mark('ck4', 'run');
    let d; try { d = await minWait(API.bootstrap()); } catch (e) { mark('ck4', 'fail'); verifying = false; await wait(600); handleErr(e); setStep(1, stepEmail()); return; }
    load(d); mark('ck4', 'ok'); await wait(350);
    setStep(3, stepResult('ok'));
    await wait(1000);
    verifying = false;
    const auth = $('#auth'); if (auth) auth.classList.add('leaving');
    await wait(420);
    S.page = 'dashboard'; startApp();
    toast(`เข้าสู่ระบบแล้ว · ${ME.email}`);
  } catch (e) { verifying = false; handleErr(e); }
}

/* =====================================================================
   APP SHELL
   ===================================================================== */
function startApp() {
  root().innerHTML = `<div class="app"><aside class="side" id="side"></aside><main><div class="topbar" id="topbar"></div><div id="view" class="view"></div></main><div id="fab-slot"></div></div>`;
  renderSide(); renderTop(); renderView('enter');
}
function renderSkeleton() {
  root().innerHTML = `<div class="app"><aside class="side"><div class="brand">${brandMark()}<div><b>${esc(APP_NAME)}</b><small>กำลังโหลด…</small></div></div>${[1, 2, 3, 4, 5].map(() => '<div class="sk" style="height:34px"></div>').join('')}</aside>
   <main><div class="sk-wrap"><div class="sk" style="height:32px;width:280px"></div><div class="sk" style="height:38px;width:min(640px,100%)"></div><div class="sk" style="height:104px"></div><div class="grid-3"><div class="sk" style="height:150px"></div><div class="sk" style="height:150px"></div><div class="sk" style="height:150px"></div></div><div class="sk" style="height:300px"></div></div></main></div>`;
}
function renderSide() {
  const u = me(); if (!u) return;
  if (!can(S.page)) S.page = (PAGES.find(m => can(m.k)) || MENUS[0]).k;
  const pending = DB.users.filter(x => x.status === 'pending').length;
  const needs = cstats(postsOf(allowedP())).needs.length;
  setTimeout(renderFab);
  $('#side').innerHTML = `
   <div class="brand">${brandMark()}<div><b>${esc(APP_NAME)}</b><small>${esc(CFG.ORG_NAME || 'Social Analytics')}</small></div></div>
   <nav class="nav" aria-label="เมนูหลัก">${NAV_GROUPS.map(([g, keys]) => { const items = keys.filter(k => can(k)); if (!items.length) return ''; return `<div class="nav-label">${g}</div>` + items.map(k => { const m = PAGES.find(x => x.k === k); const warn = k === 'connect' && PKEYS.some(p => conn(p).error); return `<button data-act="nav" data-v="${k}" ${S.page === k ? 'aria-current="page"' : ''}>${ic(k)}<span>${m.t}</span>${k === 'admin' && pending ? `<span class="count">${pending}</span>` : ''}${k === 'comments' && needs ? `<span class="count" title="คำถาม ร้องเรียน หรือสนใจซื้อ ที่ยังไม่ได้ตอบ">${needs}</span>` : ''}${warn ? '<span class="count" title="การเชื่อมต่อมีปัญหา">!</span>' : ''}</button>`; }).join(''); }).join('')}
   </nav>
   <div class="me">
    <span class="mode-pill" title="${API.demo ? 'ยังไม่ได้ตั้งค่า API_URL ใน config.js' : 'บันทึกข้อมูลลงฐานข้อมูลของหน่วยงาน'}">${ic(API.demo ? 'spark' : 'sheet', 12)} ${API.demo ? 'โหมดสาธิต' : 'เชื่อมต่อฐานเก็บข้อมูลแล้ว'}</span>
    <div class="me-row"><span class="avatar">${initials(ME.name)}</span><div><b>${esc(ME.name)}</b><span>${esc(ME.email)} · ${esc(ME.role)}</span></div></div>
    <div class="me-actions"><button class="btn sm ghost" data-act="theme" aria-label="สลับธีมสว่าง/มืด">${ic(isDark() ? 'sun' : 'moon', 15)} ${isDark() ? 'ธีมสว่าง' : 'ธีมมืด'}</button><button class="btn sm ghost" data-act="logout">${ic('out', 15)} ออกจากระบบ</button></div>
   </div>`;
}
function renderFab() { const f = $('#fab-slot'); if (f) f.innerHTML = can('add') ? `<button class="fab${S.page === 'add' ? ' raised' : ''}" data-act="dupscan" title="ตรวจหาข้อมูลซ้ำในฐานข้อมูล">${ic('search', 17)}<span>ตรวจข้อมูลซ้ำ</span></button>` : ''; }
function renderTop() {
  const u = me();
  $('#topbar').innerHTML = `
   ${S.acting ? `<div class="impersonate">${ic('eye', 16)} กำลังดูตัวอย่างมุมมองของ <b>${esc(u.email)}</b> (${esc(u.role)}) — เมนูและแพลตฟอร์มแสดงตามสิทธิ์ของผู้ใช้นี้<button class="btn sm" data-act="stop-acting">กลับเป็นมุมมองของฉัน</button></div>` : ''}
   <div class="title-row"><div><span class="eyebrow-sm">${ic(S.page, 13)} ${esc((PAGES.find(m => m.k === S.page) || {}).sub || '')}</span><h1>${pageTitle()}</h1><p>${pageSub()}</p></div>
    <div class="filters">${['dashboard', 'posts', 'comments', 'audience'].includes(S.page) ? `<button class="btn ghost upd" data-act="refresh" title="ดึงยอดผู้ติดตามล่าสุดและโหลดข้อมูลล่าสุดจากฐานข้อมูล">${ic('refresh', 15)} <span>อัปเดตล่าสุด ${DB.loadedAt ? new Date(DB.loadedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.' : ''}</span></button>` : ''}${S.page === 'posts' && can('add') ? `${PKEYS.some(p => conn(p).connected) ? `<button class="btn" data-act="sync-all">${ic('refresh', 16)} อัปเดตจากแพลตฟอร์ม</button>` : ''}<button class="btn primary" data-act="go-link">${ic('add', 16)} เพิ่มคอนเทนต์</button>` : ''}</div></div>
   ${['dashboard', 'posts', 'comments', 'audience'].includes(S.page) ? filtersBar() : ''}`;
}
function greet() { const h = new Date().getHours(); return h < 12 ? 'สวัสดีตอนเช้า' : h < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น'; }
function dashInsight() {
  const r = range(); const a = agg(postsIn(r.from, r.to)), b = agg(postsIn(r.pf, r.pt)); const d = r.hasPrev ? delta(a.reach, b.reach) : null;
  const day = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (!DB.posts.length) return day + ' · เริ่มเพิ่มคอนเทนต์เพื่อดูภาพรวมทุกแพลตฟอร์ม';
  return day + ' · ' + (d != null ? `การเข้าถึงช่วงนี้${d >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(d * 100).toFixed(0)}% จากช่วงก่อนหน้า (${a.n} โพสต์)` : `${a.n} โพสต์ในช่วงที่เลือก`);
}
function pageTitle() { return { dashboard: `${greet()}, ${esc(((ME && ME.name) || '').split(/\s+/)[0])}`, posts: 'คอนเทนต์ทั้งหมด', comments: 'ความคิดเห็น', audience: 'ผู้ติดตาม', add: S.editing ? 'แก้ไขคอนเทนต์' : 'เพิ่มคอนเทนต์', connect: 'เชื่อมต่อบัญชี', admin: 'ทีมและสิทธิ์การใช้งาน' }[S.page]; }
function pageSub() { return { dashboard: dashInsight(), posts: 'ผลลัพธ์รายโพสต์จาก Facebook, Instagram และ TikTok เรียงจากล่าสุดไปเก่าสุด', comments: 'ฟังเสียงผู้ติดตาม จัดหมวดความรู้สึก และติดตามการตอบกลับ', audience: 'ใครติดตามเรา อยู่ที่ไหน และเติบโตแค่ไหน', add: 'วางลิงก์ให้ระบบดึงข้อมูล กรอกเอง หรือนำเข้าไฟล์ CSV', connect: 'เชื่อมต่อเพจและบัญชีของหน่วยงาน เพื่อดึงยอดและความคิดเห็นอัตโนมัติ', admin: `อนุญาตเฉพาะอีเมล @${DOMAIN} · กำหนดเมนูและแพลตฟอร์มที่แต่ละคนเข้าถึงได้` }[S.page]; }
function filtersBar() {
  const a = allowedP(), r = range(), showPeriod = S.page !== 'audience';
  return `<div class="filters">
   <div class="seg" role="group" aria-label="แพลตฟอร์ม">${a.length > 1 ? `<button data-act="fp" data-v="all" aria-pressed="${S.f.platform === 'all'}">ทั้งหมด</button>` : ''}${a.map(p => `<button data-act="fp" data-v="${p}" aria-pressed="${S.f.platform === p || a.length === 1}"><i class="dot" style="background:${PL[p].c}"></i>${PL[p].name}</button>`).join('')}</div>
   ${showPeriod ? `<div class="seg" role="group" aria-label="ช่วงเวลา">${PERIODS.map(([k, t]) => `<button data-act="per" data-v="${k}" aria-pressed="${S.f.period === k}">${t}</button>`).join('')}</div>
   ${S.f.period === 'custom' ? `<div class="filters soft"><input class="input" type="date" id="f-from" value="${S.f.from}" max="${iso(TODAY)}" data-change="from" style="width:auto" aria-label="วันที่เริ่ม"><span class="muted">ถึง</span><input class="input" type="date" id="f-to" value="${S.f.to}" max="${iso(TODAY)}" data-change="to" style="width:auto" aria-label="วันที่สิ้นสุด"></div>` : ''}
   <span class="range-label">${ic('cal', 15)} ${rangeText(r)}</span>` : ''}
  </div>`;
}
const VIEWS = {};
const AFTER = {};
let viewSeq = 0;
function renderView(mode = 'fade') {
  const v = $('#view'); if (!v) return;
  const my = ++viewSeq;
  const prev = {}; if (mode === 'soft') $$('[data-key]', v).forEach(el => { prev[el.dataset.key] = +el.dataset.count; });
  const doRender = () => {
    if (my !== viewSeq) return;
    charts = [];
    v.classList.remove('leaving', 'anim', 'soft', 'dim');
    if (mode === 'fade' || mode === 'enter') v.classList.add('anim');
    if (mode === 'soft') v.classList.add('soft');
    v.innerHTML = VIEWS[S.page]();
    stagger(v);
    if (AFTER[S.page]) AFTER[S.page](mode === 'soft' ? 'soft' : mode === 'none' ? false : 'draw');
    if (mode !== 'none') { countUp(v, mode === 'soft' ? prev : null); setTimeout(() => { if (my === viewSeq) v.classList.remove('anim', 'soft'); }, 1600); }
  };
  if (mode === 'fade' && v.childElementCount) { v.classList.add('leaving'); setTimeout(doRender, 150); }
  else if (mode === 'soft' && v.childElementCount) { v.classList.add('dim'); setTimeout(doRender, 210); }
  else doRender();
}
function go(page, tab) {
  if (!can(page)) return;
  if (page === 'add' && (S.page !== 'add' || tab)) { S.catTouched = false; S.editing = null; S.parsed = []; S.img = null; S.addTab = tab || 'link'; if (tab !== 'post') S.prefill = null; }
  S.page = page; S.person = null; closeDrawer();
  $$('#side .nav button').forEach(b => b.dataset.v === page ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  renderTop(); renderView('fade'); renderFab(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function refilter() { renderTop(); renderView('soft'); }

/* ================= overview ================= */
const REACTIONS = [{ k: 'like', e: '👍', t: 'ถูกใจ', c: '#2a78d6' }, { k: 'love', e: '❤️', t: 'รักเลย', c: '#e34948' }, { k: 'care', e: '🥰', t: 'ห่วงใย', c: '#eda100' }, { k: 'haha', e: '😆', t: 'ฮ่าฮ่า', c: '#eda100' }, { k: 'wow', e: '😮', t: 'ว้าว', c: '#eda100' }, { k: 'sad', e: '😢', t: 'เศร้า', c: '#eda100' }, { k: 'angry', e: '😡', t: 'โกรธ', c: '#eb6834' }];
const ENG_PARTS = [{ k: 'reactions', t: 'ถูกใจ / ความรู้สึก', c: 'var(--e1)' }, { k: 'comments', t: 'ความคิดเห็น', c: 'var(--e2)' }, { k: 'shares', t: 'แชร์', c: 'var(--e3)' }, { k: 'saves', t: 'บันทึก', c: 'var(--e4)' }];
const TYPE_COLORS = ['var(--accent)', 'var(--fb)', 'var(--ig)', 'var(--tt)', 'var(--e3)', 'var(--ink-3)'];
function reactionTotals(list) { const t = {}; REACTIONS.forEach(r => t[r.k] = 0); let any = false; list.forEach(p => { if (p.reactionsBreakdown) { any = true; REACTIONS.forEach(r => t[r.k] += n0(p.reactionsBreakdown[r.k])); } }); return any ? t : null; }
function folMeta(p) { const a = FIDX[p]; if (!a || !a.length) return null; const l = a[a.length - 1]; return { v: l[1], at: l[2], src: l[3] }; }
function srcLabel(src, at, platform) {
  if (!at) return '';
  if (src === 'api') return `<span class="src api" title="${esc(fdt(at))}">${ic('refresh', 11)} ${platform ? 'ดึงจาก ' + PL[platform].name + ' · ' : ''}${ago(at)}</span>`;
  if (src === 'csv') return `<span class="src man" title="${esc(fdt(at))}">${ic('file', 11)} นำเข้า CSV · ${fdate(at)}</span>`;
  return `<span class="src man" title="${esc(fdt(at))}">${ic('edit', 11)} กรอกเอง · ${fdate(at)}</span>`;
}
const hasData = p => DB.posts.some(x => x.platform === p) || (FIDX[p] && FIDX[p].length > 0) || DB.daily.some(x => x.platform === p);
const shownP = () => { const a = activeP(); const d = a.filter(hasData); return d.length ? d : a; };
/* ---------- ข้อมูลระดับเพจรายวัน (Meta Business Suite → Insights) ---------- */
const PAGE_M = [
  { k: 'views', t: 'ยอดดู', en: 'Views', ic: 'eye' },
  { k: 'viewers', t: 'ผู้ชม', en: 'Viewers', ic: 'audience' },
  { k: 'interactions', t: 'การโต้ตอบกับเนื้อหา', en: 'Content interactions', ic: 'heart' },
  { k: 'linkClicks', t: 'การคลิกลิงก์', en: 'Link clicks', ic: 'link' },
  { k: 'visits', t: 'การเข้าชมเพจ', en: 'Visits', ic: 'target' },
  { k: 'follows', t: 'การติดตามใหม่', en: 'Follows', ic: 'add' },
  { k: 'unfollows', t: 'การเลิกติดตาม', en: 'Unfollows', ic: 'x' }
];
const PM = Object.fromEntries(PAGE_M.map(m => [m.k, m]));
const PAGE_GUESS = [['unfollows', /เลิกติดตาม|unfollow/i], ['follows', /ติดตาม|follow/i], ['linkClicks', /คลิกลิงก์|link.?click/i], ['visits', /เข้าชม|visit/i], ['interactions', /โต้ตอบ|interaction|engagement|มีส่วนร่วม/i], ['viewers', /ผู้ชม|viewer|reach|เข้าถึง/i], ['views', /ยอดดู|view|impression|การดู/i]];
const guessPageMetric = t => (PAGE_GUESS.find(([, re]) => re.test(t || '')) || [null])[0];
const dailyIn = (from, to, ps) => DB.daily.filter(d => ps.includes(d.platform) && d._t >= from && d._t < to);
const dsum = (l, k) => l.some(d => d[k] != null) ? l.reduce((s, d) => s + n0(d[k]), 0) : null;
function pageSection(r, ps, fol) {
  const all = DB.daily.filter(d => ps.includes(d.platform)); if (!all.length) return '';
  const have = PAGE_M.filter(m => all.some(d => d[m.k] != null)); if (!have.length) return '';
  if (!have.some(m => m.k === S.pdm)) S.pdm = have[0].k;
  const cur = dailyIn(r.from, r.to, ps), prev = r.hasPrev ? dailyIn(r.pf, r.pt, ps) : [];
  const minT = Math.min(...all.map(d => d._t)), maxT = Math.max(...all.map(d => d._t));
  const days = [...new Set(cur.map(d => d.date))].length;
  const tiles = have.map(m => { const v = dsum(cur, m.k), pv = dsum(prev, m.k); const d = v != null && pv != null ? delta(v, pv) : null;
    return `<button class="pm-tile" type="button" data-act="pdm" data-v="${m.k}" aria-pressed="${S.pdm === m.k}"><span class="pm-l">${ic(m.ic, 14)}<span>${m.t}<small>${m.en}</small></span></span><b>${cnt(v, 'k', null, 'pm-' + m.k)}</b>${d != null ? dpill(d) : ''}</button>`; }).join('');
  const folTile = fol ? `<div class="pm-tile static"><span class="pm-l">${ic('audience', 14)}<span>ผู้ติดตามทั้งหมด<small>Followers</small></span></span><b>${cnt(fol.v, 'k', null, 'pm-fol')}</b>${fol.src || ''}</div>` : '';
  const multi = [...new Set(all.map(d => d.platform))].length > 1;
  return `<section class="panel page-panel"><div class="panel-head"><div><h2>ภาพรวมเพจ <small class="en">Page insights</small></h2><p>ตัวเลขระดับเพจทั้งหมด (รวมทุกโพสต์และหน้าเพจ) · มีข้อมูล ${fds(minT)} – ${fdate(maxT)}${cur.length ? ` · ช่วงนี้ ${days} วัน` : ''}</p></div>${can('add') ? `<button class="btn sm" data-act="go-csv">${ic('upload', 14)} นำเข้าไฟล์ใหม่</button>` : ''}</div>
    <div class="pm-grid" data-stagger>${folTile}${tiles}</div>
    ${cur.length ? `<div class="chart" id="ch-page"></div>${multi ? `<div class="legend">${ps.filter(p => all.some(d => d.platform === p)).map(p => `<span><i style="background:${PL[p].c}"></i>${PL[p].name}</span>`).join('')}</div>` : ''}`
      : `<div class="empty" style="margin-top:14px">ไม่มีข้อมูลเพจรายวันในช่วงที่เลือก <button class="linkbtn" data-act="pd-range">ดูช่วง ${fds(minT)} – ${fdate(maxT)}</button></div>`}</section>`;
}
function mountPageChart(animate) {
  const el = $('#ch-page'); if (!el) return;
  const r = range(), ps = shownP().filter(p => DB.daily.some(d => d.platform === p));
  const ts = DB.daily.filter(d => ps.includes(d.platform)).map(d => d._t); const to = Math.max(r.from + DAY, Math.min(r.to, Math.max(...ts) + DAY)), fr = Math.max(r.from, Math.min(...ts));
  let B = buckets(fr < to ? fr : r.from, to);
  if (B.u === 'hour') B = buckets(to - 14 * DAY, to);
  const k = S.pdm, m = PM[k];
  const tips = B.b.map(b => B.u === 'day' ? fdate(b.s) : B.u === 'week' ? `${fds(b.s)} – ${fdate(b.e - 1)}` : b.l);
  const series = ps.map(p => ({ name: `${m.t} · ${PL[p].name}`, color: ps.length > 1 ? PL[p].c : 'var(--accent)', values: B.b.map(b => n0(dsum(dailyIn(b.s, b.e, [p]), k))) }));
  mountChart('ch-page', { labels: B.b.map(b => b.l), tips, series, fmt: fnum, aria: 'กราฟ ' + m.t + ' รายวัน' }, animate);
}
VIEWS.dashboard = function () {
  const r = range(), ps = shownP(); const cur = postsIn(r.from, r.to), prev = postsIn(r.pf, r.pt);
  const A_ = agg(cur), B = agg(prev), C = cstats(cur), D = cstats(prev);
  const endMs = Math.min(r.to - 1, Date.now());
  const fNow = sumFol(ps, endMs), fStart = sumFol(ps, r.from - DAY), fPrev = sumFol(ps, r.pf - DAY);
  const gain = fNow != null && fStart != null ? fNow - fStart : null, gainPrev = fStart != null && fPrev != null ? fStart - fPrev : null;
  const BK = buckets(r.from, r.to).b;
  const per = f => BK.map(b => f(postsIn(b.s, b.e)));
  const sp = {
    fol: BK.map(b => n0(sumFol(ps, Math.min(b.e, TODAY + DAY) - DAY))),
    reach: per(l => l.reduce((s, x) => s + n0(x.m.reach), 0)), imp: per(l => l.reduce((s, x) => s + n0(x.m.impressions), 0)),
    eng: per(l => l.reduce((s, x) => s + eng(x.m), 0)), er: per(l => agg(l).er || 0), rep: per(l => n0(cstats(l).replyRate))
  };
  const k = (key, icon, label, en, val, d, sub, series) => `<article class="kcard"><div class="kc-top"><span class="kc-ic">${ic(icon, 16)}</span><span class="k-label">${label}<small>${en}</small></span>${r.hasPrev ? dpill(d) : ''}</div><div class="k-val">${val}</div><div class="kc-foot"><span class="k-sub">${sub || ''}</span>${spark(series, 'var(--accent)', 92, 30)}</div></article>`;
  const tiles = [
    fNow != null && k('kpi-fol', 'audience', 'ผู้ติดตามทั้งหมด', 'Followers', cnt(fNow, 'k', null, 'kpi-fol'), delta(gain, gainPrev), gain ? `+${fk(gain)} ในช่วงนี้` : 'ยอดล่าสุด', sp.fol),
    A_.reach > 0 && k('kpi-reach', 'target', 'การเข้าถึง', 'Reach', cnt(A_.reach, 'k', null, 'kpi-reach'), delta(A_.reach, B.reach), `จาก ${A_.n} โพสต์`, sp.reach),
    A_.impressions > 0 && k('kpi-imp', 'eye', 'การมองเห็น', 'Views', cnt(A_.impressions, 'k', null, 'kpi-imp'), delta(A_.impressions, B.impressions), r.hasPrev ? 'เทียบช่วงก่อนหน้า' : 'ทั้งหมด', sp.imp),
    A_.eng > 0 && k('kpi-eng', 'heart', 'การมีส่วนร่วม', 'Engagement', cnt(A_.eng, 'k', null, 'kpi-eng'), delta(A_.eng, B.eng), 'ถูกใจ ความคิดเห็น แชร์ บันทึก', sp.eng),
    A_.er > 0 && k('kpi-er', 'percent', 'อัตราการมีส่วนร่วม', 'Engagement rate', cnt(A_.er, 'pct', 2, 'kpi-er'), delta(A_.er, B.er), 'ต่อการเข้าถึง', sp.er),
    C.total > 0 && k('kpi-rep', 'reply', 'อัตราการตอบกลับ', 'Response rate', cnt(C.replyRate, 'pct', 0, 'kpi-rep'), delta(C.replyRate, D.replyRate), C.avgRT != null ? `ตอบเฉลี่ยใน ${fmins(C.avgRT)}` : `${fnum(C.total)} ความคิดเห็น`, sp.rep)
  ].filter(Boolean);
  const kp = tiles.length ? `<section class="kgrid n${tiles.length}" aria-label="ตัวชี้วัดหลัก" data-stagger>${tiles.join('')}</section>` : '';

  const TM = [['reach', 'Reach'], ['impressions', 'Views'], ['eng', 'Engagement'], ['newFollowers', 'ผู้ติดตามใหม่']];
  const plSeg = ps.map(p => ({ l: PL[p].name, v: agg(cur.filter(x => x.platform === p)).eng, c: PL[p].c }));
  const multi = ps.length > 1;
  const row1 = `<div class="${multi ? 'grid-main' : 'stack'}" data-stagger>
    <section class="panel"><div class="panel-head"><div><h2>แนวโน้มตามช่วงเวลา</h2><p>${{ hour: 'รายชั่วโมง', day: 'รายวัน', week: 'รายสัปดาห์', month: 'รายเดือน' }[buckets(r.from, r.to).u]} · แยกตามแพลตฟอร์ม</p></div>
      <div class="seg" role="group" aria-label="ตัวชี้วัดในกราฟ">${TM.map(([k2, t]) => `<button data-act="trend" data-v="${k2}" aria-pressed="${S.trend === k2}">${t}</button>`).join('')}</div></div>
      <div class="chart" id="ch-trend"></div>${ps.length > 1 ? `<div class="legend">${ps.map(p => `<span><i style="background:${PL[p].c}"></i>${PL[p].name}</span>`).join('')}</div>` : ''}</section>
    ${multi ? `<section class="panel"><div class="panel-head"><div><h2>สัดส่วนการมีส่วนร่วม</h2><p>แต่ละแพลตฟอร์มสร้าง Engagement เท่าไร</p></div></div>
      ${donut(plSeg, { centerHtml: cnt(A_.eng, 'k', null, 'd-eng'), sub: 'การมีส่วนร่วมรวม', emptyText: 'ยังไม่มีโพสต์ในช่วงที่เลือก' })}</section>` : ''}
   </div>`;

  const cards = !multi && folAt(ps[0], endMs) == null ? '' : `<section class="${multi ? 'grid-3' : 'grid-3 single'}" data-stagger>${ps.map(p => {
    const a = agg(cur.filter(x => x.platform === p)); const f = folAt(p, endMs); const g = f != null ? f - n0(folAt(p, r.from - DAY)) : null; const fm = folMeta(p);
    const sv = []; const end = Math.min(r.to, TODAY + DAY); const st = Math.max(1, Math.floor((end - r.from) / DAY / 24));
    if (f != null) { for (let t = r.from; t < end; t += st * DAY) sv.push(n0(folAt(p, t))); sv.push(f); }
    const cn = (DB.connections || {})[p] || {};
    return `<article class="plat-card" style="--pc:${PL[p].c}"><header><span class="pl-badge" style="background:${PL[p].c}">${PL[p].short}</span><div><b>${PL[p].name}</b><small>${cn.connected ? esc(cn.name || 'เชื่อมต่อแล้ว') : 'ยังไม่เชื่อมต่อ API'}</small></div><span class="pc-n">${a.n} โพสต์</span></header>
     <div class="pc-mid"><div><div class="big">${cnt(f, 'k', null, 'pf-' + p)}</div><div class="note">${f == null ? 'ยังไม่ได้บันทึกยอดผู้ติดตาม' : 'ผู้ติดตาม'}${g && f != null ? ` · <span style="color:var(--good)">+${fk(g)}</span>` : ''}</div></div>${spark(sv, PL[p].c)}</div>
     ${a.n ? `<div class="plat-stats"><div><small>Reach</small><b>${fk(a.reach)}</b></div><div><small>Engagement</small><b>${fk(a.eng)}</b></div><div><small>ER</small><b>${pct(a.er, 2)}</b></div></div>` : ''}
     <footer>${fm ? srcLabel(fm.src, fm.at) : '<span class="src man">ยังไม่มีข้อมูล</span>'}</footer></article>`;
  }).join('')}</section>`;

  const sentSeg = SENT.map(s => ({ l: s.t + ' · ' + s.th, v: C.by[s.k], c: s.c }));
  const row2 = `<div class="${C.total ? 'grid-main' : 'stack'}" data-stagger>
    <section class="panel"><div class="panel-head"><div><h2>องค์ประกอบของการมีส่วนร่วม</h2><p>ถูกใจ ความคิดเห็น แชร์ และบันทึก ในแต่ละช่วงเวลา</p></div></div>
      <div class="chart" id="ch-eng"></div><div class="legend">${ENG_PARTS.map(x => `<span><i style="background:${x.c}"></i>${x.t}</span>`).join('')}</div></section>
    ${C.total ? `<section class="panel"><div class="panel-head"><div><h2>ความรู้สึกจากความคิดเห็น</h2><p>${fnum(C.total)} ความคิดเห็น จัดหมวดอัตโนมัติ</p></div>${can('comments') ? `<button class="btn sm" data-act="nav" data-v="comments">ดูทั้งหมด</button>` : ''}</div>
      ${donut(sentSeg, { centerHtml: cnt(C.posRate, 'pct', 0, 'd-pos'), sub: 'เชิงบวก', fmt: fnum })}</section>` : ''}
   </div>`;

  const rb = reactionTotals(cur); const rbTot = rb ? REACTIONS.reduce((s, x) => s + rb[x.k], 0) : 0;
  const tc = {}; cur.forEach(p => tc[p.type] = (tc[p.type] || 0) + 1);
  const te = Object.entries(tc).sort((a, b) => b[1] - a[1]); const top5 = te.slice(0, 5); const rest = te.slice(5).reduce((s, x) => s + x[1], 0);
  const typeSeg = top5.map(([t, v], i) => ({ l: t, v, c: TYPE_COLORS[i] })).concat(rest ? [{ l: 'อื่นๆ', v: rest, c: TYPE_COLORS[5] }] : []);
  const p3 = [];
  if (rb && rbTot) p3.push(`<section class="panel"><div class="panel-head"><div><h2>ผู้ติดตามกดความรู้สึกอะไร</h2><p>${rb ? `${fnum(rbTot)} ครั้ง · จากโพสต์ Facebook ที่ดึงผ่าน API` : 'แยกตามอิโมจิ (Facebook)'}</p></div></div>
      ${rb && rbTot ? `<div class="react-row">${REACTIONS.map(x => `<div class="react" title="${x.t} ${fnum(rb[x.k])}"><span class="re">${x.e}</span><b>${cnt(rb[x.k], 'k', null, 'rb-' + x.k)}</b><small>${pct(rb[x.k] / rbTot, 0)}</small></div>`).join('')}</div>
        ${barList(REACTIONS.filter(x => rb[x.k]).map(x => ({ l: x.e + '  ' + x.t, v: rb[x.k], c: x.c, ext: pct(rb[x.k] / rbTot, 0) })), { fmt: fnum })}`
      : ''}</section>`);
  const catSeg = CATS.map(c2 => ({ l: c2.t, v: cur.filter(x => x.cat === c2.k).length, c: c2.c })).sort((a, b) => b.v - a.v);
  if (cur.length) p3.push(`<section class="panel"><div class="panel-head"><div><h2>ประเภทคอนเทนต์</h2><p>สัดส่วนจำนวนโพสต์</p></div></div>${donut(typeSeg, { centerHtml: cnt(cur.length, 'n', null, 'd-posts'), sub: 'โพสต์', fmt: fnum, small: true })}</section>`);
  if (cur.length) p3.push(`<section class="panel"><div class="panel-head"><div><h2>หมวดหมู่คอนเทนต์</h2><p>สัดส่วนจำนวนโพสต์แต่ละหมวด</p></div></div>${donut(catSeg, { centerHtml: cnt(CATS.filter(c2 => cur.some(x => x.cat === c2.k)).length, 'n', null, 'd-cats'), sub: 'หมวด', fmt: fnum, small: true })}</section>`);
  if (cur.length) p3.push(`<section class="panel"><div class="panel-head"><div><h2>ช่วงเวลาที่โพสต์แล้วได้ผลดี</h2><p>อัตราการมีส่วนร่วมเฉลี่ย ตามวันและเวลาที่โพสต์</p></div></div>${heatmap(cur)}</section>`);
  const row3 = p3.length ? `<div class="${p3.length >= 3 ? 'grid-3' : p3.length === 2 ? 'grid-2' : 'stack'}" data-stagger>${p3.slice(0, 3).join('')}</div>${p3.length > 3 ? `<div class="grid-3" data-stagger>${p3.slice(3).join('')}</div>` : ''}` : '';

  const byType = TYPES.map(t => { const l = cur.filter(x => x.type === t); const a = agg(l); return { l: t, v: a.er || 0, sub: `(${l.length})`, n: l.length }; }).filter(x => x.n).sort((a, b) => b.v - a.v);
  const byCat = CATS.map(c => { const l = cur.filter(x => x.cat === c.k); const a = agg(l); return { l: c.t, v: a.reach, ext: 'ER ' + pct(a.er, 1), c: c.c, n: l.length }; }).filter(x => x.n).sort((a, b) => b.v - a.v);
  const perf = `<div class="grid-2" data-stagger><section class="panel"><div class="panel-head"><div><h2>รูปแบบคอนเทนต์ที่ได้ผลดี</h2><p>อัตราการมีส่วนร่วมเฉลี่ย · (จำนวนโพสต์)</p></div></div>${barList(byType, { fmt: v => pct(v, 2) })}</section>
   <section class="panel"><div class="panel-head"><div><h2>หมวดหมู่คอนเทนต์</h2><p>การเข้าถึงรวม และอัตราการมีส่วนร่วมของแต่ละหมวด</p></div></div>${barList(byCat)}</section></div>`;

  const top = [...cur].sort((a, b) => eng(b.m) - eng(a.m)).slice(0, 5);
  const topRow = `<section class="panel"><div class="panel-head"><div><h2>โพสต์ที่โดดเด่น</h2><p>5 อันดับตามการมีส่วนร่วมในช่วงที่เลือก</p></div>${can('posts') ? `<button class="btn sm" data-act="nav" data-v="posts">ดูคอนเทนต์ทั้งหมด</button>` : ''}</div>
    ${top.length ? `<div class="top-grid" data-stagger>${top.map((p, i) => `<button class="top-card" data-act="open" data-id="${p.id}"><span class="rank">${i + 1}</span>${thumb(p)}<div class="tc-body"><div class="tc-meta"><i class="dot" style="background:${PL[p.platform].c}"></i>${PL[p.platform].name} · ${fds(p.at)}</div><p>${esc(p.caption)}</p><div class="tc-stats"><span>${ic('heart', 12)} ${fk(eng(p.m))}</span><span>${ic('target', 12)} ${fk(p.m.reach)}</span><span>${p.m.reach ? pct(eng(p.m) / p.m.reach, 1) : '—'}</span></div></div></button>`).join('')}</div>` : emptyState('ยังไม่มีโพสต์ในช่วงนี้', 'ลองเปลี่ยนช่วงเวลาด้านบน หรือเพิ่มคอนเทนต์ใหม่')}
    ${C.needs.length && can('comments') ? `<div class="callout warn" style="margin-top:14px">${ic('clock', 18)}<div><b>${C.needs.length} ความคิดเห็นรอการตอบกลับ</b> — คำถาม เรื่องร้องเรียน และผู้ที่สนใจซื้อ ที่เพจยังไม่ได้ตอบ <button class="linkbtn" data-act="goto-unreplied">เปิดรายการ</button></div></div>` : ''}</section>`;
  const hasPosts = DB.posts.some(x => ps.includes(x.platform));
  const onlyFol = !hasPosts && tiles.length === 1 && fNow != null && DB.daily.some(d => ps.includes(d.platform));
  const fm0 = ps.map(folMeta).filter(Boolean).sort((a, b) => b.at - a.at)[0];
  const pageSec = pageSection(r, ps, onlyFol ? { v: fNow, src: fm0 ? `<span class="pm-na">${srcLabel(fm0.src, fm0.at)}</span>` : '' } : null);
  return `<div class="stack" data-stagger>${onboarding()}${onlyFol ? '' : kp}${pageSec}${hasPosts ? row1 : ''}${cards}${hasPosts ? row2 + row3 + perf + topRow : ''}</div>`;
};
function onboarding() {
  if (!can('add')) return '';
  const anyConn = PKEYS.some(p => ((DB.connections || {})[p] || {}).connected);
  const steps = [
    { t: 'เชื่อมต่อฐานเก็บข้อมูล', d: API.demo ? 'โหมดสาธิต' : 'บันทึกลงฐานข้อมูลอัตโนมัติ', done: true },
    { t: 'เชื่อมต่อบัญชีโซเชียล', d: 'เพื่อดึงยอดและความคิดเห็นอัตโนมัติ', done: anyConn, act: can('connect') ? 'go-connect' : null },
    { t: 'บันทึกยอดผู้ติดตาม', d: 'ดึงอัตโนมัติหรือกรอกเอง', done: DB.followers.length > 0, act: 'go-aud' },
    { t: 'เพิ่มคอนเทนต์แรก', d: 'วางลิงก์ นำเข้า CSV หรือกรอกเอง', done: DB.posts.length > 0, act: 'go-link' }
  ];
  if (can('admin')) steps.push({ t: 'เชิญทีม', d: `เพิ่มอีเมล @${DOMAIN}`, done: DB.users.length > 1, act: 'go-admin' });
  const done = steps.filter(s => s.done).length; if (done === steps.length) return '';
  return `<section class="onboard"><div class="ob-head"><div><span class="eyebrow-sm">${ic('spark', 13)} เริ่มต้นใช้งาน</span><h2>อีก ${steps.length - done} ขั้น แดชบอร์ดของคุณก็พร้อมใช้งาน</h2></div><div class="ob-ring" style="--p:${done / steps.length}"><span>${done}/${steps.length}</span></div></div>
   <ol class="ob-steps">${steps.map((s, i) => `<li class="${s.done ? 'done' : ''}"><span class="ob-n">${s.done ? ic('check', 14) : i + 1}</span><div><b>${s.t}</b><small>${s.d}</small></div>${!s.done && s.act ? `<button class="btn sm primary" data-act="${s.act}">เริ่ม ${ic('arrow', 13)}</button>` : ''}</li>`).join('')}</ol></section>`;
}
AFTER.dashboard = function (animate) {
  const r = range(), ps = shownP(); const B = buckets(r.from, r.to); const k = S.trend;
  const series = ps.map(p => ({ name: PL[p].name, color: PL[p].c, values: B.b.map(b => {
    if (k === 'newFollowers' && B.u !== 'hour') { const a = folAt(p, Math.min(b.e, TODAY + DAY) - DAY), z = folAt(p, b.s - DAY); return a != null && z != null ? Math.max(0, a - z) : 0; }
    const l = postsIn(b.s, b.e, [p]); return k === 'eng' ? l.reduce((s, x) => s + eng(x.m), 0) : l.reduce((s, x) => s + n0(x.m[k]), 0);
  }) }));
  const tips = B.b.map(b => B.u === 'hour' ? b.l : B.u === 'day' ? fdate(b.s) : B.u === 'week' ? `${fds(b.s)} – ${fdate(b.e - 1)}` : b.l);
  mountChart('ch-trend', { labels: B.b.map(b => b.l), tips, series, aria: 'กราฟแนวโน้ม ' + k }, animate);
  const engS = ENG_PARTS.map(x => ({ name: x.t, color: x.c, values: B.b.map(b => postsIn(b.s, b.e).reduce((s, p) => s + n0(p.m[x.k]), 0)) }));
  mountChart('ch-eng', { type: 'bar', labels: B.b.map(b => b.l), tips, series: engS, aria: 'กราฟแท่งองค์ประกอบการมีส่วนร่วม' }, animate);
  mountPageChart(animate);
};

/* ================= posts ================= */
VIEWS.posts = function () {
  const pf = S.pf;
  return `<div class="toolbar">
   <div class="search">${ic('search', 16)}<input class="input" id="pq" type="search" placeholder="ค้นหาจากข้อความโพสต์หรือลิงก์" value="${esc(pf.q)}" data-input="pq" aria-label="ค้นหาโพสต์"></div>
   <select class="input" id="ptype" data-change="ptype" aria-label="ประเภทโพสต์"><option value="">ทุกประเภท</option>${TYPES.map(t => `<option ${pf.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
   <select class="input" id="pcat" data-change="pcat" aria-label="หมวดหมู่"><option value="">ทุกหมวดหมู่</option>${CATS.map(c => `<option value="${c.k}" ${pf.cat === c.k ? 'selected' : ''}>${c.t}</option>`).join('')}</select>
   <select class="input" id="psort" data-change="psort" aria-label="เรียงลำดับ">${[['new', 'ล่าสุด → เก่าสุด'], ['old', 'เก่าสุด → ล่าสุด'], ['reach', 'Reach สูงสุด'], ['eng', 'Engagement สูงสุด'], ['cmt', 'ความคิดเห็นมากสุด']].map(([k, t]) => `<option value="${k}" ${pf.sort === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
   <div class="seg" role="group" aria-label="มุมมอง"><button data-act="pview" data-v="grid" aria-pressed="${pf.view === 'grid'}" aria-label="แบบการ์ด">${ic('grid', 15)}</button><button data-act="pview" data-v="list" aria-pressed="${pf.view === 'list'}" aria-label="แบบตาราง">${ic('list', 15)}</button></div>
  </div>
  <p class="note" id="pcount" style="margin:-6px 0 12px"></p>
  <div id="post-list"></div>`;
};
AFTER.posts = () => renderPostList(true);
function filteredPosts() {
  const r = range(), pf = S.pf, q = pf.q.trim().toLowerCase();
  const l = postsIn(r.from, r.to).filter(p => (!pf.type || p.type === pf.type) && (!pf.cat || p.cat === pf.cat) && (!q || p.caption.toLowerCase().includes(q) || p.link.toLowerCase().includes(q)));
  const s = { new: (a, b) => b.at - a.at, old: (a, b) => a.at - b.at, reach: (a, b) => n0(b.m.reach) - n0(a.m.reach), eng: (a, b) => eng(b.m) - eng(a.m), cmt: (a, b) => n0(b.m.comments) - n0(a.m.comments) }[pf.sort];
  return l.sort(s);
}
function renderPostList(animate) {
  const el = $('#post-list'); if (!el) return; const l = filteredPosts();
  $('#pcount').textContent = `พบ ${l.length} โพสต์ · ${rangeText(range())}`;
  el.classList.remove('anim'); if (animate) { void el.offsetWidth; el.classList.add('anim'); }
  if (!l.length) {
    el.innerHTML = DB.posts.length ? `<div class="panel">${emptyState('ไม่พบโพสต์ตามตัวกรองนี้', 'ลองเปลี่ยนช่วงเวลาเป็น “ทั้งหมด” หรือล้างคำค้นและตัวกรอง', `<button class="btn" data-act="per" data-v="all">ดูทุกช่วงเวลา</button>`)}</div>`
      : `<div class="panel">${emptyState('ยังไม่มีโพสต์ในระบบ', 'เพิ่มโพสต์ทีละรายการ หรือนำเข้าไฟล์ CSV ที่ Export จาก Meta Business Suite / TikTok Studio', can('add') ? `<button class="btn" data-act="go-csv">${ic('file', 15)} นำเข้า CSV</button><button class="btn primary" data-act="nav" data-v="add">${ic('add', 15)} เพิ่มโพสต์</button>` : '')}</div>`;
    return;
  }
  if (S.pf.view === 'grid') {
    el.innerHTML = `<div class="post-grid" data-stagger>${l.map(p => `<button class="post-card" data-act="open" data-id="${p.id}"><div class="thumb-wrap">${thumb(p)}</div><div class="pc-body"><div class="pc-meta">${platChip(p.platform)}${catChip(p.cat)}<span class="pc-date">${fdate(p.at)}</span></div><p>${esc(p.caption)}</p>
      <div class="pc-metrics"><div><small>Reach</small><b>${fk(p.m.reach)}</b></div><div><small>${p.v ? 'Views' : 'Impr.'}</small><b>${fk(p.v ? p.v.videoViews : p.m.impressions)}</b></div><div><small>Eng.</small><b>${fk(eng(p.m))}</b></div><div><small>คอมเมนต์</small><b>${fk(p.m.comments)}</b></div></div>${postSrc(p)}</div></button>`).join('')}</div>`;
  } else {
    el.innerHTML = `<div class="tbl-wrap post-list"><table class="tbl"><thead><tr><th>โพสต์</th><th>แพลตฟอร์ม</th><th>ประเภท</th><th>หมวดหมู่</th><th>วันที่</th><th class="r">Reach</th><th class="r">Impr./Views</th><th class="r">Reactions</th><th class="r">Comments</th><th class="r">Shares</th><th class="r">Saves</th><th class="r">ER</th></tr></thead><tbody data-stagger>
    ${l.map(p => `<tr class="click" data-act="open" data-id="${p.id}"><td><div class="cell-post">${thumb(p, 1)}<p style="white-space:normal">${esc(p.caption)}</p></div></td><td>${platChip(p.platform)}</td><td>${esc(p.type)}</td><td>${catChip(p.cat)}</td><td>${fdt(p.at)}</td><td class="r num">${fk(p.m.reach)}</td><td class="r num">${fk(p.v ? p.v.videoViews : p.m.impressions)}</td><td class="r num">${fk(p.m.reactions)}</td><td class="r num">${fk(p.m.comments)}</td><td class="r num">${fk(p.m.shares)}</td><td class="r num">${fk(p.m.saves)}</td><td class="r num">${p.m.reach ? pct(eng(p.m) / p.m.reach, 2) : '—'}</td></tr>`).join('')}
    </tbody></table></div>`;
  }
  stagger(el);
}

function postSrc(p, long) {
  if (p.source === 'api') return `<span class="src api${p.syncError ? ' err' : ''}" title="${esc(p.syncError || ('อัปเดตล่าสุด ' + (p.syncedAt ? fdt(p.syncedAt) : '')))}">${ic('refresh', 11)} ${long ? 'ดึงจาก ' + PL[p.platform].name + ' · ' : ''}${p.syncError ? 'อัปเดตไม่สำเร็จ' : 'อัปเดต ' + ago(p.syncedAt)}</span>`;
  return `<span class="src man">${ic(p.source === 'csv' ? 'file' : 'edit', 11)} ${p.source === 'csv' ? 'นำเข้า CSV' : 'กรอกเอง'}</span>`;
}
/* ================= post drawer ================= */
const MROWS = [['reach', 'Reach'], ['impressions', 'Impressions / Views'], ['reactions', 'Likes / Reactions'], ['comments', 'Comments'], ['shares', 'Shares'], ['saves', 'Saves'], ['clicks', 'Clicks'], ['profileVisits', 'Profile Visits'], ['newFollowers', 'New Followers'], ['linkClicks', 'Link Clicks']];
function openPost(id) {
  S.openPost = id; S.drawerCat = ''; S.delPost = false;
  const d = $('#drawer'); d.setAttribute('aria-hidden', 'false'); renderDrawer(true);
  requestAnimationFrame(() => { d.classList.add('on'); $('#backdrop').classList.add('on'); });
  setTimeout(() => { const b = $('#drawer [data-act="close-drawer"]'); if (b) b.focus(); }, 80);
}
function closeDrawer() { S.openPost = null; const d = $('#drawer'); if (!d) return; d.classList.remove('on'); $('#backdrop').classList.remove('on'); d.setAttribute('aria-hidden', 'true'); }
function renderDrawer(animate) {
  const p = DB.posts.find(x => x.id === S.openPost); const d = $('#drawer'); if (!p) { closeDrawer(); return; }
  const C = cstats([p]); const v = p.v;
  const af = p.apiFields || []; const apiTag = k => af.includes(k) ? '<i class="api-dot" title="ดึงจาก API"></i>' : '';
  const mRows = MROWS.filter(([k]) => p.m[k] != null && p.m[k] !== 0);
  const vRows = v ? [['Video Views', v.videoViews, fnum], ['Average Watch Time', v.avgWatch, fdur], ['Total Watch Time', v.totalWatch, fdur], ['Completion Rate', v.completion, x => pct(x, 1)]].filter(([, x]) => x != null && x !== 0) : [];
  const missing = MROWS.filter(([k]) => !(p.m[k] != null && p.m[k] !== 0)).map(([, t]) => t);
  const mg = mRows.map(([k, t]) => `<div><small>${t}${apiTag(k)}</small><b>${fnum(p.m[k])}</b></div>`).join('') +
    (p.m.reach ? `<div><small>Engagement rate</small><b>${pct(eng(p.m) / p.m.reach, 2)}</b></div>` : '') +
    vRows.map(([t, x, f]) => `<div><small>${t}</small><b>${f(x)}</b></div>`).join('');
  const base = v && Math.max(n0(v.s3), n0(v.videoViews));
  const ret = v && base ? [['3-second views', v.s3], ['5-second views', v.s5], ['10-second views', v.s10], ['ดูถึง 25%', v.p25], ['ดูถึง 50%', v.p50], ['ดูถึง 75%', v.p75], ['ดูจบ 100%', v.p100]].filter(([, x]) => x != null).map(([l, x]) => ({ l, v: x, ext: pct(x / base, 0) })) : null;
  const list = p.comments.filter(c => !S.drawerCat || c.cat === S.drawerCat);
  const canEdit = can('add');
  d.innerHTML = `<div class="drawer-head"><button class="icon-btn" data-act="close-drawer" aria-label="ปิด">${ic('x', 18)}</button><h2>${esc(p.caption)}</h2>
    ${canEdit ? `<button class="btn sm" data-act="edit-post" data-id="${p.id}">${ic('edit', 14)} แก้ไข</button>${S.delPost ? `<button class="btn sm danger" data-act="del-post-yes" data-id="${p.id}">ยืนยันลบ</button><button class="btn sm" data-act="del-post-no">ยกเลิก</button>` : `<button class="btn sm danger" data-act="del-post">ลบ</button>`}` : ''}</div>
   <div class="drawer-body${animate ? ' anim' : ''}" data-stagger>
    <div class="pd-top">${thumb(p)}<div class="pd-info"><div style="display:flex;gap:6px;flex-wrap:wrap">${platChip(p.platform)}${typeChip(p.type)}${catChip(p.cat)}</div>
      <p>${esc(p.caption)}</p><span class="note">โพสต์เมื่อ ${fdt(p.at)}${v && v.duration ? ` · ความยาว ${fdur(v.duration)}` : ''}${p.createdBy ? ` · บันทึกโดย ${esc(p.createdBy)}` : ''}</span>
      <a class="pd-link" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">${ic('link', 14)} ${esc(p.link)}</a></div></div>
    <div class="syncbar${p.source === 'api' ? ' api' : ''}"><div>${p.source === 'api' ? `<b>${ic('refresh', 14)} ดึงข้อมูลจาก ${PL[p.platform].name}</b><span>อัปเดตล่าสุด ${p.syncedAt ? fdt(p.syncedAt) + ' น. (' + ago(p.syncedAt) + ')' : '—'}</span>` : `<b>${ic(p.source === 'csv' ? 'file' : 'edit', 14)} ${p.source === 'csv' ? 'นำเข้าจากไฟล์ CSV' : 'กรอกข้อมูลเอง'}</b><span>${conn(p.platform).connected ? 'กดดึงข้อมูลเพื่อให้ระบบอัปเดตตัวเลขและความคิดเห็นจากแพลตฟอร์ม' : PL[p.platform].name + ' ยังไม่ได้เชื่อมต่อ — ตัวเลขชุดนี้มาจากการกรอกเอง'}</span>`}${p.syncError ? `<span class="warn-t">อัปเดตครั้งล่าสุดไม่สำเร็จ: ${esc(p.syncError)}</span>` : ''}</div>
     ${canSync(p) ? `<button class="btn sm primary" data-act="sync-post" data-id="${p.id}">${ic('refresh', 14)} ${p.source === 'api' ? 'อัปเดตข้อมูล' : 'ดึงข้อมูลจากลิงก์'}</button>` : ''}</div>
    <section><div class="panel-head"><div><h2>ตัวชี้วัดของโพสต์</h2>${af.length ? `<p><i class="api-dot"></i> ดึงจาก API · ช่องที่เหลือมาจากการกรอกเอง</p>` : ''}</div></div><div class="metric-grid">${mg}</div>${missing.length ? `<p class="note" style="margin:8px 0 0">ไม่มีข้อมูล: ${missing.join(', ')}</p>` : ''}</section>
    ${p.reactionsBreakdown ? (() => { const rb = p.reactionsBreakdown, tot = REACTIONS.reduce((s, x) => s + n0(rb[x.k]), 0); return tot ? `<section class="panel"><div class="panel-head"><div><h2>ความรู้สึกที่ผู้ติดตามกด</h2><p>${fnum(tot)} ครั้ง แยกตามอิโมจิ</p></div></div><div class="react-row">${REACTIONS.map(x => `<div class="react"><span class="re">${x.e}</span><b>${fnum(rb[x.k])}</b><small>${x.t} · ${pct(n0(rb[x.k]) / tot, 0)}</small></div>`).join('')}</div></section>` : ''; })() : ''}
    ${ret ? `<section class="panel"><div class="panel-head"><div><h2>การรับชมวิดีโอ (Retention)</h2><p>สัดส่วนเทียบกับยอดรับชมทั้งหมด</p></div></div>${barList(ret, { c: PL[p.platform].c, fmt: fnum })}</section>` : ''}
    <section class="panel"><div class="panel-head"><div><h2>ความคิดเห็นของโพสต์นี้</h2><p>${C.total} ความคิดเห็นหลัก · ตอบกลับ ${pct(C.replyRate, 0)} · บทสนทนาต่อเนื่อง ${pct(C.convoRate, 0)} · ตอบเฉลี่ยใน ${fmins(C.avgRT)}</p></div></div>
     ${stack100(C.by)}
     <div class="filters" style="margin-top:16px"><button class="chip" data-act="dcat" data-v="" aria-pressed="${!S.drawerCat}">ทั้งหมด ${p.comments.length}</button>${SENT.filter(s => C.by[s.k]).map(s => `<button class="chip" data-act="dcat" data-v="${s.k}" aria-pressed="${S.drawerCat === s.k}"><i class="dot" style="background:${s.c}"></i>${s.t} ${C.by[s.k]}</button>`).join('')}</div>
     <div style="margin-top:6px" id="dlist">${list.map(c => cmtItem(c)).join('') || emptyState(p.comments.length ? 'ไม่มีความคิดเห็นในหมวดนี้' : 'ยังไม่มีความคิดเห็น', p.comments.length ? 'เลือกหมวดอื่นด้านบน' : p.platform === 'tt' && p.source === 'api' ? 'TikTok ไม่เปิดให้ดึงรายการความคิดเห็น เพิ่มเองได้จากปุ่ม “แก้ไข”' : canSync(p) ? 'กด “ดึงข้อมูล” ด้านบนเพื่อดึงความคิดเห็นทั้งหมด หรือเพิ่มเองจากปุ่ม “แก้ไข”' : 'เพิ่มความคิดเห็นได้จากปุ่ม “แก้ไข” แล้ววางข้อความทีละบรรทัด')}</div>
    </section>
   </div>`;
  stagger(d);
}
function cmtItem(c, post) {
  const sel = can('comments') ? `<select class="cat-sel" data-change="recat" data-id="${c.id}" aria-label="หมวดความคิดเห็น" style="border-color:${SE[c.cat].c}">${SENT.map(s => `<option value="${s.k}" ${c.cat === s.k ? 'selected' : ''}>${s.t}</option>`).join('')}</select>` : `<span class="cat-dot" style="margin-left:auto"><i class="dot" style="background:${SE[c.cat].c}"></i>${SE[c.cat].t}</span>`;
  const replied = c.thread.some(t => t.from === 'page');
  const replyUI = !can('comments') ? '' : S.replyOpen === c.id
    ? `<form class="reply-form" data-id="${c.id}"><input class="input" id="rp-${c.id}" placeholder="ข้อความที่เพจตอบกลับ (ไม่บังคับ)" maxlength="500" aria-label="ข้อความตอบกลับ"><button class="btn sm primary" type="submit">บันทึก</button><button class="btn sm ghost" type="button" data-act="reply-cancel">ยกเลิก</button></form>`
    : `<button class="linkbtn sm" type="button" data-act="reply-open" data-id="${c.id}">${ic('reply', 13)} ${replied ? 'บันทึกการตอบกลับเพิ่ม' : 'บันทึกว่าเพจตอบกลับแล้ว'}</button>`;
  return `<div class="cmt" data-cid="${c.id}" data-ctx="${post ? 1 : 0}"><div class="cmt-head"><span class="avatar" style="width:26px;height:26px;font-size:11px">${initials(c.author)}</span><b>${esc(c.author)}</b><time>${fdt(c.at)}</time><span class="tag-auto">${c.auto ? 'จัดหมวดอัตโนมัติ' : 'แก้หมวดแล้ว'}</span>${sel}</div>
   ${post ? `<span class="note"><a href="#" data-act="open" data-id="${post.id}">${esc(post.caption)}</a> · ${PL[post.platform].name}</span>` : ''}
   <p>${esc(c.text)}</p>
   ${c.thread.length ? `<div class="thread">${c.thread.map(t => `<div class="${t.from}"><b>${t.from === 'page' ? 'เพจ (ตอบกลับ)' : esc(c.author)}</b> · ${esc(t.text)} <span class="muted">· ${fdt(t.at)}</span></div>`).join('')}</div>` : (['q', 'cmp', 'buy'].includes(c.cat) ? '<span class="status pending">ยังไม่ได้ตอบกลับ</span>' : '')}
   ${replyUI}
  </div>`;
}
function findComment(id) { for (const p of DB.posts) { const c = p.comments.find(x => x.id === id); if (c) return { c, p }; } return null; }
function rerenderCmt(id) {
  const f = findComment(id); if (!f) return;
  $$(`.cmt[data-cid="${CSS.escape(id)}"]`).forEach(el => { el.outerHTML = cmtItem(f.c, el.dataset.ctx === '1' ? f.p : null); });
  const inp = $('#rp-' + CSS.escape(id)); if (inp) inp.focus();
}

/* ================= comments page ================= */
VIEWS.comments = function () {
  const r = range(); const list = postsIn(r.from, r.to); const C = cstats(list);
  const tabs = [['overview', 'ภาพรวม'], ['posts', 'แยกรายโพสต์'], ['people', 'รายบุคคล'], ['feed', 'ความคิดเห็นทั้งหมด']];
  let body = '';
  if (S.ct === 'overview') {
    const perP = activeP().map(p => { const c = cstats(list.filter(x => x.platform === p)); return `<div><div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;gap:8px;flex-wrap:wrap"><span><i class="dot" style="background:${PL[p].c}"></i> ${PL[p].name}</span><span class="muted">${c.total} ความคิดเห็น · ตอบกลับ ${pct(c.replyRate, 0)}</span></div>${stack100(c.by, { legend: false })}</div>`; }).join('');
    const byType = TYPES.map(t => { const c = cstats(list.filter(x => x.type === t)); return { l: t, v: c.total ? c.posRate : 0, ext: c.total + ' คอมเมนต์', n: c.total, c: 'var(--s-pos)' }; }).filter(x => x.n).sort((a, b) => b.v - a.v);
    body = `<div class="stack" data-stagger>
     <section class="kpis" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
      ${[['ความคิดเห็นทั้งหมด', cnt(C.total, 'n')], ['อัตราการตอบกลับ', cnt(C.replyRate, 'pct', 0)], ['บทสนทนาต่อเนื่อง', cnt(C.convoRate, 'pct', 0)], ['เวลาตอบกลับเฉลี่ย', fmins(C.avgRT)], ['เชิงบวก', cnt(C.posRate, 'pct', 0)], ['เชิงลบ + ร้องเรียน', cnt(C.negRate, 'pct', 0)]].map(([a, b]) => `<div class="kpi"><span class="k-label">${a}</span><span class="k-val">${b}</span></div>`).join('')}
     </section>
     <div class="grid-2">
      <section class="panel"><div class="panel-head"><div><h2>หมวดความคิดเห็นโดยรวม</h2><p>Positive · Neutral · Negative · Question · Complaint · Interested · Purchase intent</p></div></div>
       ${barList(SENT.map(s => ({ l: s.t, sub: s.th, v: C.by[s.k], c: s.c, ext: pct(C.total ? C.by[s.k] / C.total : 0, 0) })), { fmt: fnum })}</section>
      <section class="panel"><div class="panel-head"><div><h2>แยกตามแพลตฟอร์ม</h2><p>สัดส่วนหมวดความคิดเห็นในแต่ละช่องทาง</p></div></div><div class="stack" style="gap:16px">${perP}</div>
       <div class="slegend">${SENT.map(s => `<div><i style="background:${s.c}"></i>${s.t}</div>`).join('')}</div></section>
     </div>
     <div class="grid-2">
      <section class="panel"><div class="panel-head"><div><h2>ประเภทโพสต์ที่ได้ความคิดเห็นเชิงบวกมากสุด</h2><p>% Positive ของความคิดเห็นในแต่ละประเภท</p></div></div>${barList(byType, { fmt: v => pct(v, 0) })}</section>
      <section class="panel"><div class="panel-head"><div><h2>รอการตอบกลับ</h2><p>คำถาม ร้องเรียน และผู้ที่ตั้งใจซื้อ ที่เพจยังไม่ได้ตอบ</p></div>${C.needs.length ? `<button class="btn sm" data-act="goto-unreplied">ดูทั้งหมด ${C.needs.length}</button>` : ''}</div>
       ${C.needs.slice(0, 4).map(c => cmtItem(c.ref, c.post)).join('') || '<div class="empty">ตอบกลับครบทุกความคิดเห็นแล้ว</div>'}</section>
     </div></div>`;
  } else if (S.ct === 'posts') {
    const rows = list.map(p => ({ p, c: cstats([p]) }));
    const s = S.cpSort; rows.sort({ comments: (a, b) => b.c.total - a.c.total, pos: (a, b) => n0(b.c.posRate) - n0(a.c.posRate), neg: (a, b) => n0(b.c.negRate) - n0(a.c.negRate), reply: (a, b) => (a.c.replyRate == null ? 2 : a.c.replyRate) - (b.c.replyRate == null ? 2 : b.c.replyRate), date: (a, b) => b.p.at - a.p.at }[s]);
    const th = (k, t) => `<th class="r"><button data-act="cpsort" data-v="${k}" aria-pressed="${s === k}">${t}${s === k ? ' ↓' : ''}</button></th>`;
    body = `<p class="note" style="margin:0 0 12px">คลิกแถวเพื่อเปิดโพสต์และอ่านความคิดเห็นทั้งหมด · เรียง “ตอบกลับ” จะแสดงโพสต์ที่ตอบน้อยที่สุดก่อน</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>โพสต์</th><th><button data-act="cpsort" data-v="date" aria-pressed="${s === 'date'}">วันที่${s === 'date' ? ' ↓' : ''}</button></th>${th('comments', 'ความคิดเห็น')}<th>สัดส่วนหมวด</th>${th('pos', 'Positive')}${th('neg', 'Negative+Complaint')}<th class="r">คำถาม</th>${th('reply', 'ตอบกลับ')}</tr></thead><tbody data-stagger>
     ${rows.map(({ p, c }) => `<tr class="click" data-act="open" data-id="${p.id}"><td><div class="cell-post">${thumb(p, 1)}<div><p>${esc(p.caption)}</p><span class="note"><i class="dot" style="background:${PL[p.platform].c}"></i> ${PL[p.platform].name} · ${esc(p.type)}</span></div></div></td><td style="white-space:nowrap">${fdate(p.at)}</td><td class="r num">${c.total}</td><td>${miniStack(c.by)}</td><td class="r num">${pct(c.posRate, 0)}</td><td class="r num">${pct(c.negRate, 0)}</td><td class="r num">${c.by.q}</td><td class="r num">${pct(c.replyRate, 0)}</td></tr>`).join('') || '<tr><td colspan="8"><div class="empty">ไม่มีโพสต์ในช่วงนี้</div></td></tr>'}
     </tbody></table></div>`;
  } else if (S.ct === 'people') {
    const map = {}; C.all.forEach(c => { const key = c.post.platform + '|' + c.author; (map[key] = map[key] || { key, name: c.author, p: c.post.platform, list: [] }).list.push(c); });
    const people = Object.values(map).map(x => { const by = {}; SENT.forEach(s => by[s.k] = 0); x.list.forEach(c => by[c.cat]++); const top = SENT.reduce((a, s) => by[s.k] > by[a.k] ? s : a, SENT[0]); const rep = x.list.filter(c => c.thread.some(t => t.from === 'page')).length; const back = x.list.filter(c => c.thread.some(t => t.from === 'user')).length; return Object.assign(x, { by, top, rep: rep / x.list.length, back, posts: new Set(x.list.map(c => c.post.id)).size, last: Math.max(...x.list.map(c => c.at)) }); });
    const s = S.ppSort; people.sort({ count: (a, b) => b.list.length - a.list.length, last: (a, b) => b.last - a.last, neg: (a, b) => (b.by.neg + b.by.cmp) - (a.by.neg + a.by.cmp) }[s]);
    const th = (k, t) => `<button class="chip" data-act="ppsort" data-v="${k}" aria-pressed="${s === k}">${t}</button>`;
    body = `<div class="filters" style="margin-bottom:12px"><span class="note">เรียงตาม</span>${th('count', 'แสดงความคิดเห็นบ่อยสุด')}${th('last', 'ล่าสุด')}${th('neg', 'เชิงลบ/ร้องเรียนมากสุด')}</div>
     <p class="note" style="margin:0 0 12px">ระบุบุคคลตามชื่อบัญชีในแต่ละแพลตฟอร์ม · คลิกแถวเพื่อดูความคิดเห็นทั้งหมดของบุคคลนั้น</p>
     <div class="tbl-wrap"><table class="tbl"><thead><tr><th>ผู้แสดงความคิดเห็น</th><th>แพลตฟอร์ม</th><th class="r">ความคิดเห็น</th><th class="r">โพสต์ที่ร่วม</th><th>หมวดหลัก</th><th>สัดส่วนหมวด</th><th class="r">เพจตอบกลับ</th><th class="r">คุยต่อ</th><th>ล่าสุด</th></tr></thead><tbody>
     ${people.slice(0, 60).map(x => `<tr class="click" data-act="person" data-v="${esc(x.key)}" aria-expanded="${S.person === x.key}"><td><div class="me-row"><span class="avatar" style="width:28px;height:28px;font-size:11px">${initials(x.name)}</span><b>${esc(x.name)}</b></div></td><td>${platChip(x.p)}</td><td class="r num">${x.list.length}</td><td class="r num">${x.posts}</td><td><span class="cat-dot"><i class="dot" style="background:${x.top.c}"></i>${x.top.t}</span></td><td>${miniStack(x.by)}</td><td class="r num">${pct(x.rep, 0)}</td><td class="r num">${x.back}</td><td style="white-space:nowrap">${fdate(x.last)}</td></tr>
       ${S.person === x.key ? `<tr class="edit-row"><td colspan="9"><div class="edit-box">${x.list.sort((a, b) => b.at - a.at).map(c => cmtItem(c.ref, c.post)).join('')}</div></td></tr>` : ''}`).join('') || '<tr><td colspan="9"><div class="empty">ไม่มีความคิดเห็นในช่วงนี้</div></td></tr>'}
     </tbody></table></div>`;
  } else {
    const cf = S.cf;
    body = `<div class="toolbar"><div class="search">${ic('search', 16)}<input class="input" id="cq" type="search" placeholder="ค้นหาข้อความหรือชื่อ" value="${esc(cf.q)}" data-input="cq" aria-label="ค้นหาความคิดเห็น"></div>
      <label class="chip" style="cursor:pointer;padding:7px 10px"><input type="checkbox" id="cunr" data-change="cunr" ${cf.unreplied ? 'checked' : ''} style="accent-color:var(--accent)"> เฉพาะที่ยังไม่ตอบ</label></div>
     <div class="filters" style="margin-bottom:10px"><button class="chip" data-act="ccat" data-v="" aria-pressed="${!cf.cat}">ทั้งหมด ${C.total}</button>${SENT.map(s => `<button class="chip" data-act="ccat" data-v="${s.k}" aria-pressed="${cf.cat === s.k}"><i class="dot" style="background:${s.c}"></i>${s.t} ${C.by[s.k]}</button>`).join('')}</div>
     <section class="panel" id="cfeed"></section>`;
  }
  return `<div class="tabs" role="tablist">${tabs.map(([k, t]) => `<button role="tab" data-act="ctab" data-v="${k}" aria-selected="${S.ct === k}">${t}</button>`).join('')}</div><div data-stagger>${body}</div>`;
};
AFTER.comments = () => { if (S.ct === 'feed') renderFeed(); };
AFTER.add = () => { if (S.addTab === 'link' && !S.editing) loadRecent(S.recentPl); };
function renderFeed() {
  const el = $('#cfeed'); if (!el) return;
  const r = range(); const C = cstats(postsIn(r.from, r.to)); const cf = S.cf, q = cf.q.trim().toLowerCase();
  const l = C.all.filter(c => (!cf.cat || c.cat === cf.cat) && (!cf.unreplied || !c.thread.some(t => t.from === 'page')) && (!q || c.text.toLowerCase().includes(q) || c.author.toLowerCase().includes(q))).sort((a, b) => b.at - a.at);
  el.innerHTML = `<span class="note">${l.length} รายการ${l.length > 80 ? ' · แสดง 80 รายการล่าสุด' : ''}</span>${l.slice(0, 80).map(c => cmtItem(c.ref, c.post)).join('') || '<div class="empty" style="margin-top:10px">ไม่พบความคิดเห็นตามตัวกรองนี้</div>'}`;
}

/* ================= audience ================= */
function audOf(p) { return DB.audience[p] || {}; }
function mergeAud(ps, field) {
  const have = ps.filter(p => audOf(p)[field] != null); if (!have.length) return null;
  const w = p => n0(folAt(p, Date.now())) || 1; const W = have.reduce((s, p) => s + w(p), 0);
  if (typeof audOf(have[0])[field] === 'number') return have.reduce((s, p) => s + audOf(p)[field] * w(p) / W, 0);
  const out = {}; have.forEach(p => { for (const [k, v] of Object.entries(audOf(p)[field])) out[k] = (out[k] || 0) + v * w(p) / W; }); return out;
}
function audBars(obj, c) {
  if (!obj || !Object.keys(obj).length) return `<div class="empty">แพลตฟอร์มไม่เปิดเผยข้อมูลส่วนนี้ หรือยังไม่ได้บันทึก</div>`;
  const e = Object.entries(obj); const other = e.filter(([k]) => k === 'อื่นๆ'); const main = e.filter(([k]) => k !== 'อื่นๆ').sort((a, b) => b[1] - a[1]);
  return barList([...main, ...other].map(([k, v]) => ({ l: k, v, c: k === 'อื่นๆ' ? 'var(--ink-3)' : c })), { fmt: v => pct(v, 1), max: Math.max(...e.map(x => x[1])) });
}
function agePyramid(ag) {
  const ages = Object.keys(ag).sort((a, b) => parseInt(a) - parseInt(b));
  const F = a => n0(ag[a]['หญิง']), M = a => n0(ag[a]['ชาย']); const mx = Math.max(...ages.flatMap(a => [F(a), M(a)])) || 1;
  const tf = ages.reduce((s, a) => s + F(a), 0), tm = ages.reduce((s, a) => s + M(a), 0);
  return `<div class="pyr"><div class="pyr-head"><span><i style="background:var(--e2)"></i>ผู้หญิง ${pct(tf, 1)}</span><span>ช่วงอายุ</span><span>ผู้ชาย ${pct(tm, 1)}<i style="background:var(--fb)"></i></span></div>
    ${ages.map(a => `<div class="pyr-row"><span class="pyr-v">${pct(F(a), 1)}</span><div class="pyr-bar l"><span style="width:${F(a) / mx * 100}%"></span></div><b>${esc(a)}</b><div class="pyr-bar r"><span style="width:${M(a) / mx * 100}%"></span></div><span class="pyr-v r">${pct(M(a), 1)}</span></div>`).join('')}</div>`;
}
VIEWS.audience = function () {
  const ps = activeP(); const label = ps.length > 1 ? 'รวมทุกแพลตฟอร์ม (ถ่วงน้ำหนักตามจำนวนผู้ติดตาม)' : PL[ps[0]].name;
  const g = mergeAud(ps, 'gender'), a = mergeAud(ps, 'age'), newA = mergeAud(ps, 'newAud'), fo = mergeAud(ps, 'followers');
  const nm = f => { const m = ps.filter(p => audOf(p)[f] == null).map(p => PL[p].name); return m.length && m.length < ps.length ? `<p class="note" style="margin:8px 0 0">ไม่รวม ${m.join(', ')} (ไม่มีข้อมูล)</p>` : ''; };
  const top = o => o ? Object.entries(o).filter(([k]) => k !== 'อื่นๆ').sort((x, y) => y[1] - x[1])[0] : null;
  const prov = mergeAud(ps, 'province'), city = mergeAud(ps, 'city');
  const topAge = top(a), topG = top(g), topPlace = top(prov) || top(city);
  const cur = postsIn(TODAY - 89 * DAY, TODAY + DAY); const bt = TYPES.map(t => { const l = cur.filter(x => x.type === t); return { t, er: agg(l).er || 0, n: l.length }; }).filter(x => x.n >= 2).sort((x, y) => y.er - x.er)[0];
  const asOf = Math.max(0, ...ps.map(p => audOf(p).asOf || 0));
  const hasAny = !!(g || a || newA != null);
  const srcRow = `<div class="src-row">${ps.map(p => { const A2 = audOf(p); const fm = folMeta(p); return `<span class="src-item"><span class="pl-badge xs" style="background:${PL[p].c}">${PL[p].short}</span><span>ผู้ติดตาม ${fm ? srcLabel(fm.src, fm.at) : '<span class="src man">ยังไม่มี</span>'}</span><span>ข้อมูลผู้ชม ${A2.asOf ? srcLabel(A2.source, A2.asOf) : '<span class="src man">ยังไม่มี</span>'}</span></span>`; }).join('')}</div>`;
  return `<div class="stack" data-stagger>${srcRow}
   ${hasAny ? `<div class="callout">${ic('spark', 18)}<div><b>สรุปสำหรับวางกลยุทธ์คอนเทนต์</b> · ${label}<br>
    กลุ่มหลักคือ${topG ? ` <b>${esc(topG[0])}</b> (${pct(topG[1], 0)})` : ''}${topAge ? ` อายุ <b>${esc(topAge[0])} ปี</b> (${pct(topAge[1], 0)})` : ''}${topPlace ? ` อยู่ที่ <b>${esc(topPlace[0])}</b> มากที่สุด` : ''}${newA != null ? ` · ผู้ชมใหม่ ${pct(newA, 0)}` : ''}${fo != null ? ` · ${pct(1 - fo, 0)} ของผู้เข้าถึงยังไม่ได้ติดตามเพจ` : ''}${bt ? ` · ในรอบ 90 วัน <b>${bt.t}</b> ได้ ER สูงสุด (${pct(bt.er, 2)})` : ''}</div></div>`
    : `<div class="callout">${ic('sheet', 18)}<div><b>ยังไม่มีข้อมูลผู้ชม</b> — เชื่อมต่อ Instagram เพื่อดึงเพศ อายุ ประเทศ และเมืองอัตโนมัติ หรือกรอกเองที่เมนู “เพิ่มคอนเทนต์” แท็บ “ผู้ติดตาม / ผู้ชม”</div></div>`}
   ${(() => { const fp = ps.filter(p => FIDX[p] && FIDX[p].length); const hasF = DB.daily.some(d => ps.includes(d.platform) && d.follows != null);
     const grow = fp.length ? `<section class="panel"><div class="panel-head"><div><h2>การเติบโตของผู้ติดตาม</h2><p>ยอดผู้ติดตามที่บันทึกไว้ · 30 วันล่าสุด</p></div></div><div class="chart" id="ch-fol"></div>${fp.length > 1 ? `<div class="legend">${fp.map(p => `<span><i style="background:${PL[p].c}"></i>${PL[p].name}</span>`).join('')}</div>` : ''}</section>` : '';
     const daily = hasF ? `<section class="panel"><div class="panel-head"><div><h2>การติดตามใหม่รายวัน</h2><p>จำนวนคนที่กดติดตามเพจในแต่ละวัน · 30 วันล่าสุดที่มีข้อมูล</p></div></div><div class="chart" id="ch-follows"></div>${(() => { const dp = ps.filter(p => DB.daily.some(d => d.platform === p && d.follows != null)); return dp.length > 1 ? `<div class="legend">${dp.map(p => `<span><i style="background:${PL[p].c}"></i>${PL[p].name}</span>`).join('')}</div>` : ''; })()}</section>` : '';
     return grow && daily ? `<div class="grid-2">${grow}${daily}</div>` : grow + daily; })()}
   ${(() => { const p = ps.find(x => audOf(x).ageGender); return p ? `<section class="panel"><div class="panel-head"><div><h2>อายุและเพศของผู้ติดตาม</h2><p>${PL[p].name} · สัดส่วนจากผู้ติดตามทั้งหมด${audOf(p).asOf ? ` · ข้อมูล ณ ${fdate(audOf(p).asOf)}` : ''}</p></div></div>${agePyramid(audOf(p).ageGender)}</section>` : ''; })()}
   <div class="grid-2">
    <section class="panel"><div class="panel-head"><div><h2>เพศ (Gender)</h2></div></div>${audBars(g, 'var(--accent)')}${nm('gender')}</section>
    <section class="panel"><div class="panel-head"><div><h2>ช่วงอายุ (Age range)</h2></div></div>${audBars(a, 'var(--accent)')}${nm('age')}</section>
   </div>
   <div class="grid-3">
    <section class="panel"><div class="panel-head"><div><h2>ประเทศ</h2></div></div>${audBars(mergeAud(ps, 'country'), 'var(--accent-2)')}${nm('country')}</section>
    <section class="panel"><div class="panel-head"><div><h2>จังหวัด</h2>${ps.some(p => audOf(p).source === 'csv' && audOf(p).city) ? '<p>รวมจากเมืองยอดนิยมในไฟล์</p>' : ''}</div></div>${audBars(prov, 'var(--accent-2)')}${nm('province')}</section>
    <section class="panel"><div class="panel-head"><div><h2>เมือง / อำเภอ</h2></div></div>${audBars(city, 'var(--accent-2)')}${nm('city')}</section>
   </div>
   <div class="grid-3">
    <section class="panel"><div class="panel-head"><div><h2>ภาษา</h2></div></div>${audBars(mergeAud(ps, 'lang'), 'var(--accent-2)')}${nm('lang')}</section>
    <section class="panel"><div class="panel-head"><div><h2>ผู้ชมใหม่ / ผู้ชมเดิม</h2><p>New vs Returning audience</p></div></div>${newA != null ? split(newA, 'ผู้ชมใหม่', 'กลับมาดูซ้ำ') : '<div class="empty">ไม่มีข้อมูล</div>'}</section>
    <section class="panel"><div class="panel-head"><div><h2>ผู้ติดตาม / ไม่ใช่ผู้ติดตาม</h2><p>สัดส่วนของ Reach</p></div></div>${fo != null ? split(fo, 'ผู้ติดตาม', 'ไม่ใช่ผู้ติดตาม') : '<div class="empty">ไม่มีข้อมูล</div>'}</section>
   </div>
   <p class="note">ข้อมูลผู้ชมเป็นภาพรวม ณ วันที่บันทึกล่าสุด${asOf ? ` (${fdate(asOf)})` : ''} ไม่เปลี่ยนตามช่วงเวลา</p>
  </div>`;
};
AFTER.audience = function (animate) {
  const ps = activeP().filter(p => FIDX[p] && FIDX[p].length); const bb = buckets(TODAY - 29 * DAY, TODAY + DAY);
  const dl = DB.daily.filter(d => activeP().includes(d.platform) && d.follows != null);
  if (dl.length) { const end = Math.max(...dl.map(d => d._t)) + DAY; const db2 = buckets(end - 30 * DAY, end); const dp = [...new Set(dl.map(d => d.platform))];
    mountChart('ch-follows', { type: 'bar', labels: db2.b.map(b => b.l), tips: db2.b.map(b => fdate(b.s)), series: dp.map(p => ({ name: 'ติดตามใหม่ · ' + PL[p].name, color: dp.length > 1 ? PL[p].c : 'var(--accent)', values: db2.b.map(b => n0(dsum(dailyIn(b.s, b.e, [p]), 'follows'))) })), aria: 'กราฟการติดตามใหม่รายวัน' }, animate); }
  mountChart('ch-fol', { labels: bb.b.map(b => b.l), tips: bb.b.map(b => fdate(b.s)), series: ps.map(p => ({ name: PL[p].name, color: PL[p].c, values: bb.b.map(b => n0(folAt(p, b.s))) })), aria: 'กราฟผู้ติดตาม' }, animate);
};

/* ================= add data ================= */
function autoCat(t) {
  const s = t.toLowerCase();
  if (/ซื้อ|ราคา|สั่ง|โอน|จอง|พรีออเดอร์|ไซซ์|ขาย|บัตร/.test(s)) return 'buy';
  if (/ล่ม|ช้า|เสีย|ไม่พอ|ร้องเรียน|ผิดหวัง|ไม่มีคนรับ|แย่มาก|ไม่ได้รับ/.test(s)) return 'cmp';
  if (/\?|ไหม|มั้ย|ยังไง|อย่างไร|เมื่อไหร่|เมื่อไร|ไหน|อะไร|ใคร|เท่าไร|เท่าไหร่|กี่|หรือเปล่า|รึเปล่า|หรือยัง/.test(s)) return 'q';
  if (/สนใจ|อยากไป|อยากได้|ขอรายละเอียด|ไปด้วย|ต้องไป|อยากเข้าร่วม/.test(s)) return 'int';
  if (/ไม่ชอบ|แย่|น่าเบื่อ|ไม่โอเค|อ่านยาก|ห่วย/.test(s)) return 'neg';
  if (/ดี|ชอบ|สวย|ภูมิใจ|เยี่ยม|ขอบคุณ|ยินดี|รัก|น่ารัก|❤|💜|👏|🥰|เจ๋ง|ปัง/.test(s)) return 'pos';
  return 'neu';
}
const localDT = ms => new Date(ms - new Date(ms).getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
VIEWS.add = function () {
  const tabs = `<div class="tabs" role="tablist">${S.editing ? '' : `<button role="tab" data-act="addtab" data-v="link" aria-selected="${S.addTab === 'link'}">${ic('link', 15)} วางลิงก์ ดึงอัตโนมัติ</button>`}<button role="tab" data-act="addtab" data-v="post" aria-selected="${S.addTab === 'post'}">${ic('edit', 15)} ${S.editing ? 'แก้ไขคอนเทนต์' : 'กรอกเอง'}</button>${S.editing ? '' : `<button role="tab" data-act="addtab" data-v="csv" aria-selected="${S.addTab === 'csv'}">${ic('file', 15)} นำเข้าไฟล์ CSV</button><button role="tab" data-act="addtab" data-v="aud" aria-selected="${S.addTab === 'aud'}">${ic('audience', 15)} ผู้ติดตาม / ผู้ชม</button>`}</div>`;
  if (S.addTab === 'link' && !S.editing) return tabs + linkView();
  if (S.addTab === 'aud') return tabs + audForm();
  if (S.addTab === 'csv') return tabs + `<div id="csv-area">${csvView()}</div>`;
  const e = S.editing ? DB.posts.find(p => p.id === S.editing) : null; const ap = allowedP();
  if (!ap.length) return tabs + '<div class="empty">บัญชีของคุณยังไม่ได้รับสิทธิ์แพลตฟอร์มใด</div>';
  const pf = !e && S.prefill ? S.prefill : null;
  const pl = e ? e.platform : (pf && ap.includes(pf.platform) ? pf.platform : ap[0]); const ty = e ? e.type : PTYPES[pl][0];
  const val = k => e && e.m[k] != null ? e.m[k] : ''; const vv = k => e && e.v && e.v[k] != null ? e.v[k] : '';
  const img = S.img || (e && e.img);
  const num = (id, l, v, h) => `<div class="field"><label for="${id}">${l}</label><input class="input num" type="number" min="0" step="any" id="${id}" value="${v}" inputmode="decimal">${h ? `<span class="hint">${h}</span>` : ''}</div>`;
  const isV = VIDEO.has(ty);
  return tabs + `<form id="post-form" class="stack" novalidate data-stagger>
   <section class="form-sec"><h3><span class="n">1</span>ข้อมูลโพสต์</h3><p>ลิงก์และภาพโพสต์จะถูกเก็บไว้เพื่อเปิดดูย้อนหลังได้จากคลังโพสต์</p>
    <div class="fgrid">
     <div class="field"><label for="a-plat">แพลตฟอร์ม</label><select class="input" id="a-plat" data-change="aplat">${ap.map(p => `<option value="${p}" ${pl === p ? 'selected' : ''}>${PL[p].name}</option>`).join('')}</select></div>
     <div class="field"><label for="a-date">วันและเวลาที่โพสต์</label><input class="input" type="datetime-local" id="a-date" value="${localDT(e ? e.at : Date.now())}"></div>
     <div class="field"><label for="a-type">ประเภทโพสต์</label><select class="input" id="a-type" data-change="atype">${TYPES.map(t => `<option ${ty === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
     <div class="field"><label for="a-cat">หมวดหมู่คอนเทนต์</label><select class="input" id="a-cat">${CATS.map(c => `<option value="${c.k}" ${e && e.cat === c.k ? 'selected' : ''}>${c.t}</option>`).join('')}</select><span class="hint" id="cat-hint">${e ? '' : 'พิมพ์ข้อความโพสต์แล้วระบบจะแนะนำหมวดให้'}</span></div>
     <div class="field wide"><label for="a-link">ลิงก์โพสต์</label><input class="input" type="url" id="a-link" placeholder="https://www.facebook.com/..." value="${esc(e ? e.link : pf ? pf.link : '')}"><span class="err-msg" id="err-link" hidden>ใส่ลิงก์ที่ขึ้นต้นด้วย https:// เช่น ลิงก์ที่คัดลอกจากปุ่มแชร์ของโพสต์</span></div>
     <div class="field wide"><label for="a-cap">ข้อความโพสต์ / ชื่อโพสต์</label><input class="input" id="a-cap" data-input="acap" placeholder="เช่น Open House 2026 เปิดบ้านให้น้อง ม.ปลาย" value="${esc(e ? e.caption : '')}"><span class="err-msg" id="err-cap" hidden>ใส่ชื่อหรือข้อความโพสต์เพื่อใช้ค้นหาภายหลัง</span></div>
     <div class="field wide"><span class="lbl">ภาพโพสต์</span><label class="upload" for="a-img" id="drop">${img ? `<img src="${esc(img)}" alt="ภาพโพสต์ที่เลือก" referrerpolicy="no-referrer">` : ic('upload', 28)}<div><b>${img ? 'เปลี่ยนภาพ' : 'อัปโหลดภาพหรือภาพหน้าปกวิดีโอ'}</b><div class="note">JPG, PNG หรือ WEBP · ลากไฟล์มาวางหรือคลิกเพื่อเลือก${API.demo ? '' : ' · เก็บไว้ใน Google Drive'}</div></div></label><input type="file" id="a-img" accept="image/*" data-change="aimg" class="sr"></div>
    </div></section>
   <section class="form-sec"><h3><span class="n">2</span>ตัวชี้วัดของโพสต์</h3><p>คัดลอกจาก Meta Business Suite หรือ TikTok Studio · เว้นว่างได้หากแพลตฟอร์มไม่มีข้อมูล</p>
    <div class="fgrid">${num('m-reach', 'Reach', val('reach'))}${num('m-impressions', 'Impressions / Views', val('impressions'))}${num('m-reactions', 'Likes / Reactions', val('reactions'))}${num('m-comments', 'Comments', val('comments'), 'เว้นว่างเพื่อนับจากความคิดเห็นที่บันทึก')}${num('m-shares', 'Shares', val('shares'))}${num('m-saves', 'Saves', val('saves'))}${num('m-clicks', 'Clicks', val('clicks'))}${num('m-profileVisits', 'Profile Visits', val('profileVisits'))}${num('m-newFollowers', 'New Followers', val('newFollowers'))}${num('m-linkClicks', 'Link Clicks', val('linkClicks'))}</div></section>
   <div class="collapse${isV ? '' : ' closed'}" id="vid-sec"><div><section class="form-sec"><h3><span class="n">3</span>ตัวชี้วัดวิดีโอ</h3><p>แสดงเมื่อเลือกประเภท Reel, Short Video, Long Video, Story หรือ Live</p>
    <div class="fgrid">${num('v-duration', 'ความยาววิดีโอ (วินาที)', vv('duration'))}${num('v-videoViews', 'Video Views', vv('videoViews'))}${num('v-avgWatch', 'Average Watch Time (วินาที)', vv('avgWatch'))}${num('v-totalWatch', 'Total Watch Time (วินาที)', vv('totalWatch'), 'เว้นว่างเพื่อคำนวณ Views × Avg')}${num('v-completion', 'Completion Rate (%)', e && e.v && e.v.completion != null ? (e.v.completion * 100).toFixed(1) : '', 'เว้นว่างเพื่อคำนวณจาก 100% ÷ 3 วินาที')}
     ${num('v-s3', '3-second views', vv('s3'))}${num('v-s5', '5-second views', vv('s5'))}${num('v-s10', '10-second views', vv('s10'))}${num('v-p25', 'ดูถึง 25%', vv('p25'))}${num('v-p50', 'ดูถึง 50%', vv('p50'))}${num('v-p75', 'ดูถึง 75%', vv('p75'))}${num('v-p100', 'ดูจบ 100%', vv('p100'))}</div></section></div></div>
   <section class="form-sec"><h3><span class="n">${isV ? 4 : 3}</span>ความคิดเห็น</h3><p>วางความคิดเห็นทีละบรรทัดในรูปแบบ <span class="kbd">ชื่อ: ข้อความ</span> ระบบจะจัดหมวดให้อัตโนมัติ แล้วแก้หมวดเองได้ก่อนบันทึก${e ? ` · โพสต์นี้มี ${e.comments.length} ความคิดเห็นอยู่แล้ว รายการใหม่จะเพิ่มต่อท้าย` : ''}</p>
    <textarea class="input" id="a-cmts" placeholder="ศิริพร ท.: สมัครได้ถึงวันไหนคะ&#10;Kittipat J.: เสื้อมีไซซ์ XL ไหมครับ จะสั่ง 2 ตัว&#10;ณัฐธิดา ส.: ภูมิใจมากค่ะ"></textarea>
    <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap;align-items:center"><button type="button" class="btn" data-act="parse">${ic('spark', 15)} จัดหมวดความคิดเห็น</button><span class="note" id="parsed-n">${S.parsed.length ? `${S.parsed.length} รายการพร้อมบันทึก` : ''}</span></div>
    <div id="parsed">${parsedTable()}</div></section>
   <div class="form-actions">${e ? `<button type="button" class="btn" data-act="cancel-edit">ยกเลิก</button>` : ''}<button type="submit" class="btn primary lg" id="save-post">${e ? 'บันทึกการแก้ไข' : 'บันทึกโพสต์'}</button></div>
  </form>`;
};
function parsedTable() {
  if (!S.parsed.length) return '';
  return `<div class="tbl-wrap soft" style="margin-top:12px"><table class="tbl"><thead><tr><th>ผู้แสดงความคิดเห็น</th><th>ข้อความ</th><th>หมวด</th><th>เพจตอบแล้ว</th></tr></thead><tbody>
   ${S.parsed.map((c, i) => `<tr><td style="white-space:nowrap">${esc(c.author)}</td><td>${esc(c.text)}</td><td><select class="cat-sel" data-change="pcat-row" data-i="${i}" aria-label="หมวด" style="border-color:${SE[c.cat].c}">${SENT.map(s => `<option value="${s.k}" ${c.cat === s.k ? 'selected' : ''}>${s.t}</option>`).join('')}</select></td><td><input type="checkbox" data-change="prep" data-i="${i}" ${c.replied ? 'checked' : ''} aria-label="เพจตอบกลับแล้ว" style="accent-color:var(--accent)"></td></tr>`).join('')}
  </tbody></table></div>`;
}
const mapToLines = o => o ? Object.entries(o).map(([k, v]) => `${k} ${(v * 100).toFixed(1)}`).join('\n') : '';
function linesToMap(t) { const o = {}; String(t || '').split('\n').forEach(l => { const m = l.trim().match(/^(.+?)[\s:：]+([\d.]+)\s*%?$/); if (m) o[m[1].trim()] = parseFloat(m[2]) / 100; }); return o; }
function audForm() {
  const ap = allowedP(); if (!ap.length) return '<div class="empty">บัญชีของคุณยังไม่ได้รับสิทธิ์แพลตฟอร์มใด</div>';
  return `<form id="aud-form" class="stack" novalidate data-stagger>
   <section class="form-sec"><h3><span class="n">1</span>ภาพรวมผู้ติดตาม</h3><p>บันทึกตัวเลขจากหน้า Insights ของแต่ละแพลตฟอร์ม ระบบใช้เป็นข้อมูลล่าสุดและใช้คำนวณการเติบโตของผู้ติดตาม</p>
    <div class="fgrid"><div class="field"><label for="u-plat">แพลตฟอร์ม</label><select class="input" id="u-plat" data-change="uplat">${ap.map(x => `<option value="${x}">${PL[x].name}</option>`).join('')}</select></div>
     <div class="field"><label for="u-date">ข้อมูล ณ วันที่</label><input class="input" type="date" id="u-date" value="${iso(TODAY)}" max="${iso(TODAY)}"></div>
     <div class="field"><label for="u-fol">ผู้ติดตามทั้งหมด</label><input class="input num" type="number" min="0" id="u-fol" value="${folAt(ap[0], Date.now()) || ''}"></div></div></section>
   <div id="u-fields">${audFields(ap[0])}</div>
   <div class="form-actions"><button type="submit" class="btn primary lg" id="save-aud">บันทึกข้อมูลผู้ชม</button></div></form>`;
}
function audFields(p) {
  const A_ = audOf(p); const g = A_.gender || {}, a = A_.age || {};
  const n = (id, l, v) => `<div class="field"><label for="${id}">${l}</label><input class="input num" type="number" min="0" max="100" step="0.1" id="${id}" value="${v == null ? '' : (v * 100).toFixed(1)}"></div>`;
  const ta = (id, l, v, ph) => `<div class="field"><label for="${id}">${l}</label><textarea class="input" id="${id}" rows="5" placeholder="${ph}">${esc(mapToLines(v))}</textarea></div>`;
  return `<div class="stack soft"><section class="form-sec"><h3><span class="n">2</span>เพศ อายุ และพฤติกรรม (%)</h3><p>เว้นว่างช่องที่แพลตฟอร์มไม่ให้ข้อมูล ระบบจะใช้ค่าเดิมที่บันทึกไว้</p>
   <div class="fgrid">${n('g-f', 'หญิง', g['หญิง'])}${n('g-m', 'ชาย', g['ชาย'])}${AGES.map((k, i) => n('age-' + i, 'อายุ ' + k, a[k])).join('')}${n('u-new', 'ผู้ชมใหม่ (New audience)', A_.newAud)}${n('u-fo', 'Reach จากผู้ติดตาม', A_.followers)}</div></section>
   <section class="form-sec"><h3><span class="n">3</span>พื้นที่และภาษา (%)</h3><p>พิมพ์ทีละบรรทัด “ชื่อ ตัวเลข%” เช่น <span class="kbd">เชียงใหม่ 46</span></p>
   <div class="fgrid">${ta('m-country', 'ประเทศ', A_.country, 'ไทย 94.1')}${ta('m-province', 'จังหวัด', A_.province, 'เชียงใหม่ 46')}${ta('m-city', 'เมือง / อำเภอ', A_.city, 'อ.เมืองเชียงใหม่ 28')}${ta('m-lang', 'ภาษา', A_.lang, 'ไทย 91')}</div></section></div>`;
}

/* จัดหมวดหมู่คอนเทนต์อัตโนมัติจากข้อความโพสต์: ให้คะแนนตามคำสำคัญ (คำในช่วงต้นโพสต์ได้คะแนน ×2) แล้วเลือกหมวดที่คะแนนสูงสุด */
const CONTENT_RULES = {
  news: [[/ประกาศ/, 2], [/ปิดให้บริการ|งดให้บริการ|ปิดบริการ|เปิดให้บริการ|เปิดบริการ|ให้บริการตามปกติ|เวลาเปิด|เวลาทำการ|เวลาให้บริการ|เปิด 24 ชั่วโมง|ขยายเวลา/, 2], [/วันหยุด|หยุดทำการ|ชดเชย/, 2], [/ขอแจ้ง|แจ้งผู้ใช้|แจ้งให้ทราบ|โปรดทราบ|เนื่องจาก/, 1], [/ขอแสดงความยินดี|แสดงความยินดี|ได้รับการแต่งตั้ง|ดำรงตำแหน่ง|ได้รับรางวัล|ถ้วยรางวัล|เหรียญรางวัล/, 3], [/วันคล้ายวัน|ทรงพระเจริญ|น้อมรำลึก|เฉลิมพระเกียรติ|พระราชสมภพ|ประสูติ|ไว้อาลัย/, 3], [/ค่าปรับ|คืนหนังสือ|ค้างส่ง|ค้างชำระ|เสนอชื่อสำเร็จการศึกษา/, 2], [/ต้อนรับ|เยี่ยมชม|ศึกษาดูงาน|ตรวจประเมิน|ISO|ลงนาม|MOU|ความร่วมมือ/i, 2], [/รับสมัคร(งาน|บุคคล|พนักงาน)|ตำแหน่งว่าง|คุณสมบัติ(ผู้สมัคร)?/, 2], [/ชำรุด|ซ่อม|ปรับปรุง(พื้นที่|อาคาร)|ไฟฟ้าดับ|ระบบขัดข้อง|งดใช้/, 2], [/ติดต่อสอบถาม|ช่องทางการติดต่อ/, 1]],
  event: [[/กิจกรรม/, 2], [/ขอเชิญ|เชิญชวน|ร่วมงาน|เข้าร่วม|ร่วมกิจกรรม|แวะมา|เช็คอิน|check.?in/i, 2], [/อบรม|training|workshop|เวิร์กช็อป|สัมมนา|บรรยาย|webinar|zoom|เสวนา|talk/i, 3], [/on tour|open house|freshmen|book fair|สัปดาห์หนังสือ|งานวัน|เทศกาล|นิทรรศการ|exhibition|ปีใหม่เมือง|สงกรานต์|ลอยกระทง/i, 3], [/ลงทะเบียน|สมัครเข้าร่วม/, 2], [/แข่งขัน|ประกวด|กีฬา/, 2], [/บริจาค|จิตอาสา|ทำบุญ|พิธี|สืบสานประเพณี/, 2]],
  edu: [[/วิธี(การ)?|ขั้นตอน|คู่มือ|how to|tips?\b|เคล็ดลับ/i, 3], [/สืบค้น|ฐานข้อมูล|database|e-?books?|e-?journal|OPAC|ค้นหาหนังสือ/i, 2], [/วิจัย|research|อ้างอิง|citation|endnote|zotero|mendeley|ตีพิมพ์|วารสาร|วิทยานิพนธ์|thesis|turnitin|originality|plagiarism|AI for/i, 2], [/จองห้อง|จองที่นั่ง|booking|นัดหมาย|ใช้งานระบบ|แนะนำการใช้|การใช้ห้องสมุด|เข้าใช้งาน|รับสิทธิ์/i, 2]],
  knowledge: [[/รู้หรือไม่|รู้ไหม|ความรู้|เกร็ด|สาระ|fact/i, 3], [/แนะนำหนังสือ|หนังสือแนะนำ|หนังสือใหม่|new books?|book review|รีวิวหนังสือ|น่าอ่าน|อ่านอะไรดี|ยืมสูงสุด|ยอดนิยม|หนังสือ(เยาวชน|นวนิยาย|การ์ตูน)/i, 3], [/ประวัติ|ที่มาของ|ความเป็นมา|จดหมายเหตุ|archive|สูตรอาหาร|สูตรการทำ/i, 2]],
  promo: [[/บริการใหม่|ฟรี|ไม่มีค่าใช้จ่าย/, 2], [/ส่วนลด|ลดราคา|จำหน่าย|พรีออเดอร์|ของที่ระลึก|สั่งซื้อ/, 3], [/ส่งหนังสือ|document delivery|นำส่ง|บริการส่ง|ไปส่ง|ไปรษณีย์/i, 3]],
  engage: [[/แบบสอบถาม|แบบประเมิน|ความพึงพอใจ|survey|poll|โหวต/i, 4], [/คอมเมนต์|แสดงความคิดเห็น|ตอบคำถาม|ร่วมตอบ|ทายกัน|ทายซิ|quiz|ลุ้นรับ|ชิงรางวัล|ของรางวัล|แท็กเพื่อน|แชร์โพสต์/i, 3], [/บอกได้|ใครเคย|คุณชอบ|ชอบแบบไหน/, 1]],
  bts: [[/เบื้องหลัง|behind the scenes?|ทีมงาน|ชีวิตบรรณารักษ์|หนึ่งวันของ/i, 3], [/presented by/i, 2]],
  ugc: [[/รีโพสต์|repost|ขอบคุณภาพ|ภาพโดย|photo by|เครดิตภาพ|credit ?:|จากผู้ใช้บริการ|#มุมโปรด/i, 3]],
  ent: [[/555|😂|🤣|🤭|🥱|🥶|มีม|meme|\bPOV\b/i, 1], [/เดี๊ยน|งับ|ค่าาา|คร้าบ|จ้าาา|ค๊า|บร้า|ไอริน|แม่เคาะ|โอ้ยย|ฮือ|ขำ|แกร|ตัวแม่|ฉ่ำ|เบย|เด้อ|เน้อ|จ้ะ|หนู|เพี้ยน|ทำไมม/, 1], [/อากาศ|ร้อน|หนาว|ฝนตก|ผ้าห่ม|องศา|หน้าฝน|แฉะ/, 1]]
};
const CONTENT_PRIORITY = ['news', 'event', 'edu', 'engage', 'promo', 'knowledge', 'bts', 'ugc', 'ent'];
function autoCategory(text) {
  const s = String(text || ''); if (!s.trim()) return 'news';
  const head = s.slice(0, 200);
  let best = null, bestScore = 0;
  CONTENT_PRIORITY.forEach(k => {
    let score = 0;
    CONTENT_RULES[k].forEach(([re, w]) => { if (re.test(head)) score += w * 2; else if (re.test(s)) score += w; });
    if (score > bestScore) { best = k; bestScore = score; }
  });
  return best || (s.length < 180 ? 'ent' : 'news');
}

/* ================= CSV import ================= */
const CSV_FIELDS = [
  ['link', 'ลิงก์โพสต์', true], ['at', 'วันและเวลาที่โพสต์', true], ['caption', 'ข้อความโพสต์ (Description)'], ['title', 'ชื่อโพสต์ (Title)'], ['type', 'ประเภทโพสต์'],
  ['reach', 'Reach'], ['impressions', 'Impressions / Views'], ['reactions', 'Likes / Reactions'], ['comments', 'Comments'], ['shares', 'Shares'], ['saves', 'Saves'],
  ['clicks', 'Clicks'], ['profileVisits', 'Profile Visits'], ['newFollowers', 'New Followers'], ['linkClicks', 'Link Clicks'],
  ['videoViews', 'Video Views'], ['s3', '3-second views'], ['avgWatch', 'Average Watch Time'], ['totalWatch', 'Total Watch Time'], ['completion', 'Completion Rate'], ['duration', 'ความยาววิดีโอ']
];
const CSV_GUESS = [
  ['linkClicks', [/link ?clicks?|คลิกลิงก์|คลิกที่ลิงก์/]],
  ['s3', [/3[- ]?sec|3 วินาที/]],
  ['avgWatch', [/average (watch|view|play)|^average seconds viewed$|avg\.? ?(watch|view)|^จำนวนวินาทีที่รับชมโดยเฉลี่ย$|เวลา(ในการ)?(ดู|รับชม)เฉลี่ย|ดูเฉลี่ย/]],
  ['totalWatch', [/total (watch|view|play) ?time|^seconds viewed$|total seconds|^จำนวนวินาทีที่รับชม$|เวลา(ในการ)?(ดู|รับชม)(ทั้งหมด|รวม)|^watch time/]],
  ['completion', [/complet|ดูจบ|finish|full video|watched full/]],
  ['duration', [/duration|ความยาว|^length|^ระยะเวลา/]],
  ['videoViews', [/video views?|การดูวิดีโอ|ยอดดูวิดีโอ|video plays?/]],
  ['link', [/permalink|post link|video link|^link$|^url$|ลิงก์โพสต์|ลิงก์วิดีโอ|^ลิงก์$/, /link|url|ลิงก์/], /click|คลิก/],
  ['at', [/publish(ed)? ?(time|date)|เวลา(ที่)?เผยแพร่|วันที่เผยแพร่|วันที่โพสต์|เวลาโพสต์|post(ed)? ?(time|date|on)|create(d| time)/, /^date|^วันที่|time$/]],
  ['caption', [/^description$|caption|message|^คำอธิบาย$|^คำบรรยาย$|^ข้อความโพสต์$/]],
  ['title', [/^title$|^ชื่อ$|^ชื่อโพสต์$|video title|^ชื่อวิดีโอ$/]],
  ['type', [/post type|content type|media type|^ประเภทโพสต์$/, /^type$|^ประเภท$/]],
  ['reach', [/reach|การเข้าถึง|เข้าถึง/]],
  ['impressions', [/impression|การแสดงผล|ยอดดู|ยอดวิว|(^|total |post )views?$|^views|การดู$/]],
  ['reactions', [/reaction|likes?$|ถูกใจ|รีแอค|ความรู้สึก|^likes/]],
  ['comments', [/(^|total |post )comments?$|^ความคิดเห็น$|จำนวนความคิดเห็น|comment count/]],
  ['shares', [/(^|total |post )shares?$|^การแชร์$|^แชร์$|จำนวนแชร์|share count/]],
  ['saves', [/saves?$|บันทึก|favou?rites?|บุ๊กมาร์ก/]],
  ['clicks', [/total clicks|^clicks?$|คลิกทั้งหมด|^คลิก$|post clicks/]],
  ['profileVisits', [/profile (visit|view)|เยี่ยมชมโปรไฟล์|เข้าชมโปรไฟล์/]],
  ['newFollowers', [/new follow|follows$|followers gained|ผู้ติดตามใหม่|การติดตาม/]]
];
function csvGuess(headers, nz) {
  const map = {}, used = new Set(); const H = headers.map(h => String(h).trim().toLowerCase());
  CSV_GUESS.forEach(([f, res, not]) => {
    for (const re of res) {
      const i = H.findIndex((h, j) => !used.has(j) && (!nz || nz.has(j)) && re.test(h) && !(not && not.test(h)) && !(f !== 'caption' && / and |และ/.test(h)));
      if (i >= 0) { map[f] = i; used.add(i); break; }
    }
  });
  return map;
}
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  // ไฟล์จาก Meta Business Suite ขึ้นต้นด้วยบรรทัด sep=, เพื่อบอกตัวคั่น
  let delim = null; const sm = text.match(/^sep=(.)\r?\n/i); if (sm) { delim = sm[1]; text = text.slice(sm[0].length); }
  if (!delim) { const lines = text.split(/\r?\n/).slice(0, 6); delim = [',', ';', '\t'].map(d => [d, Math.max(...lines.map(l => l.split(d).length))]).sort((a, b) => b[1] - a[1])[0][0]; }
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true; else if (ch === delim) { row.push(f); f = ''; }
    else if (ch === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (ch !== '\r') f += ch;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ''));
}
function decodeFile(buf) {
  const b = new Uint8Array(buf);
  if (b[0] === 0xFF && b[1] === 0xFE) return new TextDecoder('utf-16le').decode(buf);
  if (b[0] === 0xFE && b[1] === 0xFF) return new TextDecoder('utf-16be').decode(buf);
  const t = new TextDecoder('utf-8').decode(buf);
  if (t.includes('\uFFFD')) { try { return new TextDecoder('windows-874').decode(buf); } catch (_) {} }
  return t;
}
const toNum = v => { const s = String(v == null ? '' : v).replace(/[,\s฿]/g, '').replace(/%$/, ''); if (s === '' || s === '-' || /^n\/?a$/i.test(s)) return null; const n = parseFloat(s); return isFinite(n) ? n : null; };
const toSec = v => { const s = String(v == null ? '' : v).trim(); if (s.includes(':')) { const p = s.split(':').map(Number); if (p.some(x => !isFinite(x))) return null; return p.reduce((a, x) => a * 60 + x, 0); } return toNum(s); };
const toPct = v => { const n = toNum(v); if (n == null) return null; return /%/.test(String(v)) || n > 1 ? n / 100 : n; };
function parseDateStr(v, fmt) {
  v = String(v || '').trim(); if (!v) return null;
  if (/^\d{10}$/.test(v)) return +v * 1000; if (/^\d{13}$/.test(v)) return +v;
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) { let y = +m[1]; if (y > 2400) y -= 543; return new Date(y, m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)).getTime(); }
  m = v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM|am|pm)?)?/);
  if (m) {
    const a = +m[1], b = +m[2]; let y = +m[3]; if (y < 100) y += 2000; if (y > 2400) y -= 543;
    let mo, d; if (a > 12) { d = a; mo = b; } else if (b > 12) { mo = a; d = b; } else if (fmt === 'dmy') { d = a; mo = b; } else { mo = a; d = b; }
    let h = +(m[4] || 0); const mi = +(m[5] || 0); if (m[6]) { if (/pm/i.test(m[6]) && h < 12) h += 12; if (/am/i.test(m[6]) && h === 12) h = 0; }
    const t = new Date(y, mo - 1, d, h, mi).getTime(); return isFinite(t) ? t : null;
  }
  const t = Date.parse(v); return isFinite(t) ? t : null;
}
function mapType(v, platform, link) {
  const s = String(v || '').toLowerCase().trim();
  if (/\/reel(s)?\//i.test(link || '')) return 'Reel';
  if (!s) return null;
  const exact = TYPES.find(t => t.toLowerCase() === s); if (exact) return exact;
  if (/reel/.test(s)) return 'Reel'; if (/live|ถ่ายทอดสด|ไลฟ์/.test(s)) return 'Live'; if (/stor|สตอรี่/.test(s)) return 'Story';
  if (/album|carousel|อัลบั้ม|หลายภาพ/.test(s)) return 'Album'; if (/link|ลิงก์/.test(s)) return 'Link Post';
  if (/video|วิดีโอ|คลิป/.test(s)) return platform === 'tt' ? 'Short Video' : platform === 'ig' ? 'Reel' : 'Long Video';
  if (/photo|image|รูป|ภาพ/.test(s)) return 'Photo'; if (/status|text|ข้อความ/.test(s)) return 'Announcement';
  return null;
}
const detectPl = l => /facebook\.com|fb\.watch|fb\.com/i.test(l) ? 'fb' : /instagram\.com/i.test(l) ? 'ig' : /tiktok\.com/i.test(l) ? 'tt' : null;
function csvBuild() {
  const c = S.csv; const ap = allowedP();
  const idx = f => (c.map[f] == null || c.map[f] === '' ? -1 : +c.map[f]); const get = (r, f) => { const i = idx(f); return i < 0 ? '' : (r[i] == null ? '' : r[i]); };
  const z = v => (c.skipZero && v === 0 ? null : v);
  return c.rows.map(r => {
    const link = String(get(r, 'link')).trim();
    const platform = c.platform === 'auto' ? (detectPl(link) || c.fallback) : c.platform;
    const at = parseDateStr(get(r, 'at'), c.dateFmt);
    const mapped = mapType(get(r, 'type'), platform, link);
    const type = mapped || c.defType || (PTYPES[platform] || PTYPES.fb)[0];
    const m = {}; ['reach', 'impressions', 'reactions', 'comments', 'shares', 'saves', 'clicks', 'profileVisits', 'newFollowers', 'linkClicks'].forEach(k => m[k] = idx(k) < 0 ? null : z(toNum(get(r, k))));
    let v = null;
    if (VIDEO.has(type)) {
      const vv = { videoViews: z(toNum(get(r, 'videoViews'))), s3: z(toNum(get(r, 's3'))), avgWatch: z(toSec(get(r, 'avgWatch'))), totalWatch: z(toSec(get(r, 'totalWatch'))), duration: z(toSec(get(r, 'duration'))), completion: z(toPct(get(r, 'completion'))) };
      if (vv.videoViews == null) vv.videoViews = m.impressions != null ? m.impressions : vv.s3; if (vv.s3 == null) vv.s3 = vv.videoViews;
      if (c.retention) { const curve = c.retention.map(i => toNum(r[i])).filter(x => x != null && x > 0); if (curve.length > 4 && vv.videoViews) { const n = curve.length - 1, at = f => Math.round(curve[Math.round(n * f)] * vv.videoViews); vv.p25 = at(.25); vv.p50 = at(.5); vv.p75 = at(.75); vv.p100 = at(1); if (vv.completion == null) vv.completion = curve[n]; } }
      if (Object.values(vv).some(x => x != null)) v = vv;
    }
    const err = !/^https?:\/\/\S+\.\S+/.test(link) ? 'ไม่มีลิงก์โพสต์' : !at ? 'อ่านวันที่ไม่ได้' : !ap.includes(platform) ? 'ไม่มีสิทธิ์แพลตฟอร์มนี้' : null;
    const caption = (String(get(r, 'caption')).trim() || String(get(r, 'title')).trim()).slice(0, 2000);
    const cat = c.defCat === 'auto' ? autoCategory(caption) : c.defCat;
    return { err, post: { platform, at, type, typeFromFile: !!mapped, cat, recat: !!c.recat, caption, link, m, v } };
  });
}
function csvView() {
  const c = S.csv;
  if ((!c || !c.rows) && S.pimp) return `<div class="stack">${pageView()}${S.pimp.result ? '' : addMoreZone()}</div>`;
  if (!c || !c.rows) {
    return `<div class="stack" data-stagger><label class="dropzone" for="csv-file" id="csv-drop">
      <span class="dz-ic">${ic('file', 28)}</span><b>ลากไฟล์ CSV มาวาง หรือคลิกเพื่อเลือก (เลือกหลายไฟล์พร้อมกันได้)</b>
      <span class="note">ระบบแยกชนิดไฟล์ให้เอง: ไฟล์รายโพสต์ (คอนเทนต์) · ไฟล์ข้อมูลเพจรายวัน เช่น ยอดดู ผู้ชม การโต้ตอบ การคลิกลิงก์ การเข้าชม การติดตาม · ไฟล์กลุ่มเป้าหมาย (อายุ เพศ ประเทศ เมือง)</span></label>
      <input type="file" id="csv-file" accept=".csv,text/csv,text/plain" class="sr" data-change="csv-file" multiple>
      <div class="grid-3">${[['1', 'Export ไฟล์', 'Meta Business Suite → ข้อมูลเชิงลึก → กดปุ่ม “ส่งออก” ที่แต่ละกราฟ หรือ เนื้อหา → ส่งออกข้อมูล'], ['2', 'ตรวจการจับคู่คอลัมน์', 'ระบบจับคู่หัวคอลัมน์ภาษาไทย/อังกฤษให้อัตโนมัติ แก้ได้ก่อนนำเข้า'], ['3', 'บันทึกลงฐานข้อมูล', 'ลิงก์ที่มีอยู่แล้วจะอัปเดตตัวเลข ไม่สร้างโพสต์ซ้ำ']].map(([n, t, d]) => `<div class="howto"><span class="ob-n">${n}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div></div>`;
  }
  if (c.result) {
    const r = c.result;
    return `${S.pimp ? `<div class="stack">${pageView()}` : ''}<section class="panel result-card soft"><div class="badge-ic ok">${ic('check', 30)}</div><h2>นำเข้าคอนเทนต์รายโพสต์เรียบร้อย</h2><p class="muted">${esc(c.name)}</p>
     ${r.aud ? `<p class="note" style="margin:0">${ic('audience', 13)} บันทึกเพศ อายุ และประเทศของผู้ชมวิดีโอเป็นข้อมูลผู้ติดตาม ${PL[r.aud].name} แล้ว</p>` : ''}
     <div class="stat-list" style="grid-template-columns:repeat(3,minmax(0,1fr));width:100%;max-width:520px"><div class="stat"><small>เพิ่มใหม่</small><b>${fnum(r.added)}</b></div><div class="stat"><small>อัปเดตตัวเลข</small><b>${fnum(r.updated)}</b></div><div class="stat"><small>ข้าม</small><b>${fnum(r.skipped)}</b></div></div>
     <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="btn" data-act="csv-reset">นำเข้าไฟล์อื่น</button><button class="btn primary" data-act="csv-done">ดูในคลังโพสต์ ${ic('arrow', 14)}</button></div></section>${S.pimp ? '</div>' : ''}`;
  }
  const built = csvBuild(); const ok = built.filter(b => !b.err); const bad = built.length - ok.length;
  const opts = sel => `<option value="">— ไม่ใช้ —</option>` + c.headers.map((h, i) => c.nz.has(i) ? `<option value="${i}" ${String(sel) === String(i) ? 'selected' : ''}>${esc(h)}</option>` : '').join('');
  const catCount = {}; ok.forEach(b => catCount[b.post.cat] = (catCount[b.post.cat] || 0) + 1);
  const ap = allowedP();
  return `<div class="stack">${S.pimp ? pageView() + `<h3 class="sec-title">${ic('file', 15)} คอนเทนต์รายโพสต์</h3>` : ''}
   <section class="form-sec"><h3><span class="n">1</span>ไฟล์และค่าเริ่มต้น</h3><p>${ic('file', 13)} <b>${esc(c.name)}</b> · ${fnum(c.rows.length)} แถว · มีข้อมูล ${c.nz.size} จาก ${c.headers.length} คอลัมน์ (ซ่อนคอลัมน์ที่ว่างหรือเป็น 0 ทั้งหมด)${c.retention ? ' · พบกราฟการรับชมวิดีโอ' : ''} <button class="linkbtn sm" data-act="csv-reset" type="button">เปลี่ยนไฟล์</button></p>
    <div class="fgrid">
     <div class="field"><label for="csv-pl">แพลตฟอร์ม</label><select class="input" id="csv-pl" data-change="csv-opt" data-k="platform"><option value="auto" ${c.platform === 'auto' ? 'selected' : ''}>ตรวจจากลิงก์อัตโนมัติ</option>${ap.map(p => `<option value="${p}" ${c.platform === p ? 'selected' : ''}>${PL[p].name}</option>`).join('')}</select></div>
     ${c.platform === 'auto' ? `<div class="field"><label for="csv-fb">ถ้าตรวจไม่ได้ ใช้</label><select class="input" id="csv-fb" data-change="csv-opt" data-k="fallback">${ap.map(p => `<option value="${p}" ${c.fallback === p ? 'selected' : ''}>${PL[p].name}</option>`).join('')}</select></div>` : ''}
     <div class="field"><label for="csv-df">รูปแบบวันที่</label><select class="input" id="csv-df" data-change="csv-opt" data-k="dateFmt"><option value="mdy" ${c.dateFmt === 'mdy' ? 'selected' : ''}>เดือน/วัน/ปี (Meta, TikTok)</option><option value="dmy" ${c.dateFmt === 'dmy' ? 'selected' : ''}>วัน/เดือน/ปี</option></select></div>
     <div class="field"><label for="csv-dt">ประเภทโพสต์ (ถ้าไฟล์ไม่ระบุ)</label><select class="input" id="csv-dt" data-change="csv-opt" data-k="defType"><option value="">ตามแพลตฟอร์ม</option>${TYPES.map(t => `<option ${c.defType === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
     <div class="field"><label for="csv-dc">หมวดหมู่คอนเทนต์</label><select class="input" id="csv-dc" data-change="csv-opt" data-k="defCat"><option value="auto" ${c.defCat === 'auto' ? 'selected' : ''}>จัดหมวดอัตโนมัติจากข้อความ (แนะนำ)</option>${CATS.map(x => `<option value="${x.k}" ${c.defCat === x.k ? 'selected' : ''}>ทุกโพสต์เป็น: ${x.t}</option>`).join('')}</select><span class="hint">แก้หมวดรายโพสต์ภายหลังได้</span></div>
    </div>
    <div class="perm-grid" style="margin-top:12px">
     <label><input type="checkbox" data-change="csv-flag" data-k="skipZero" ${c.skipZero ? 'checked' : ''}> ไม่นำค่าที่เป็น 0 เข้าระบบ (แสดงเป็น “ไม่มีข้อมูล”)</label>
     <label><input type="checkbox" data-change="csv-flag" data-k="recat" ${c.recat ? 'checked' : ''}> จัดหมวดโพสต์ที่มีในระบบแล้วใหม่ด้วย</label>
     ${c.demo.length ? `<label><input type="checkbox" data-change="csv-flag" data-k="audFromVideo" ${c.audFromVideo ? 'checked' : ''}> บันทึกเพศ อายุ และประเทศของผู้ชมวิดีโอเป็นข้อมูลผู้ติดตาม</label>` : ''}
    </div></section>
   <section class="form-sec"><h3><span class="n">2</span>จับคู่คอลัมน์</h3><p>ระบบจับคู่ให้อัตโนมัติ ${Object.keys(c.map).length} ช่อง · ช่องที่มีดาวจำเป็นต้องมี</p>
    <div class="map-grid">${CSV_FIELDS.map(([f, l, req]) => `<div class="field"><label for="mp-${f}">${l}${req ? ' <span style="color:var(--bad)">*</span>' : ''}</label><select class="input${c.map[f] != null && c.map[f] !== '' ? ' mapped' : ''}" id="mp-${f}" data-change="csv-map" data-f="${f}">${opts(c.map[f])}</select></div>`).join('')}</div></section>
   <section class="form-sec"><h3><span class="n">3</span>ตรวจก่อนนำเข้า</h3><p><span class="status active">พร้อมนำเข้า ${fnum(ok.length)} แถว</span>${bad ? ` · <span class="status suspended">ข้าม ${fnum(bad)} แถว</span>` : ''}</p>
    <div class="filters" style="margin-bottom:12px">${CATS.filter(x => catCount[x.k]).sort((x, y) => catCount[y.k] - catCount[x.k]).map(x => `${catChip(x.k).replace('</span>', ` · ${catCount[x.k]}</span>`)}`).join('')}</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>แพลตฟอร์ม</th><th>วันที่</th><th>ประเภท</th><th>หมวดหมู่</th><th>โพสต์</th><th class="r">Reach</th><th class="r">Views</th><th class="r">Reactions</th><th class="r">Comments</th><th class="r">Shares</th></tr></thead><tbody>
    ${built.slice(0, 8).map(b => `<tr class="${b.err ? 'row-bad' : ''}"><td>${b.err ? `<span class="status suspended" title="${esc(b.err)}">${esc(b.err)}</span>` : `<span class="status active">พร้อม</span>`}</td><td>${PL[b.post.platform] ? platChip(b.post.platform) : '—'}</td><td style="white-space:nowrap">${b.post.at ? fdt(b.post.at) : '—'}</td><td>${esc(b.post.type)}</td><td>${catChip(b.post.cat)}</td><td style="max-width:260px;white-space:normal"><span class="clamp2">${esc(b.post.caption || b.post.link || '—')}</span></td><td class="r num">${fk(b.post.m.reach)}</td><td class="r num">${fk(b.post.m.impressions)}</td><td class="r num">${fk(b.post.m.reactions)}</td><td class="r num">${fk(b.post.m.comments)}</td><td class="r num">${fk(b.post.m.shares)}</td></tr>`).join('')}
    </tbody></table></div>${built.length > 8 ? `<p class="note" style="margin:8px 0 0">แสดง 8 แถวแรกจาก ${fnum(built.length)} แถว</p>` : ''}
   </section>
   <div class="form-actions"><button class="btn" type="button" data-act="csv-reset">ยกเลิก</button><button class="btn primary lg" type="button" data-act="csv-import" ${ok.length ? '' : 'disabled'}>${ic('upload', 16)} นำเข้า ${fnum(ok.length)} โพสต์</button></div>
  </div>`;
}
function addMoreZone() { return `<label class="dropzone sm" for="csv-file" id="csv-drop">${ic('add', 18)}<b>เพิ่มไฟล์อื่น</b><span class="note">ลากไฟล์ CSV มาวางเพิ่มได้ ระบบจะรวมเป็นชุดเดียว</span></label><input type="file" id="csv-file" accept=".csv,text/csv,text/plain" class="sr" data-change="csv-file" multiple>`; }
function renderCsv(anim) { const a = $('#csv-area'); if (!a) return; a.innerHTML = csvView(); if (anim) { a.classList.remove('soft'); void a.offsetWidth; a.classList.add('soft'); } stagger(a); }
const readCsvFile = f => readFiles([f]);
/** อ่านหลายไฟล์พร้อมกัน แล้วแยกชนิดให้อัตโนมัติ: รายโพสต์ / ข้อมูลเพจรายวัน / กลุ่มเป้าหมาย */
async function readFiles(files) {
  const postFiles = []; const P = S.pimp && !S.pimp.result ? S.pimp : { files: [], platform: allowedP()[0], followers: '', result: null };
  let pageN = 0; const seen = new Set(), dupNames = [];
  for (const f of files) {
    if (!/\.(csv|txt|tsv)$/i.test(f.name) && !/csv|text/.test(f.type)) { toast(`ข้าม ${f.name} — ต้องเป็นไฟล์ .csv (Excel ให้บันทึกเป็น CSV UTF-8 ก่อน)`, 'error'); continue; }
    let rows, hash;
    try { const buf = await f.arrayBuffer(); hash = await fileHash(buf); rows = parseCSV(decodeFile(buf)); } catch (e) { toast(`อ่าน ${f.name} ไม่สำเร็จ: ${e.message}`, 'error'); continue; }
    if (seen.has(hash) || P.files.some(x => x.hash === hash) || (S.csv && S.csv.hash === hash && !S.csv.result)) { dupNames.push(f.name); continue; }
    seen.add(hash);
    const pf = parsePageFile(f.name, rows);
    if (pf && pf.length) { pf.forEach(x => { x.hash = hash; P.files = P.files.filter(y => y.id !== x.id); P.files.push(x); }); pageN += pf.length; }
    else postFiles.push({ name: f.name, rows, hash });
  }
  if (P.files.length) { P.files.sort((a, b) => (a.kind === 'aud') - (b.kind === 'aud') || PAGE_M.findIndex(m => m.k === a.metric) - PAGE_M.findIndex(m => m.k === b.metric)); S.pimp = P; }
  if (postFiles.length) { loadPostRows(postFiles[0].name, postFiles[0].rows, !pageN); if (S.csv) S.csv.hash = postFiles[0].hash; if (postFiles.length > 1) toast(`ไฟล์รายโพสต์นำเข้าได้ทีละไฟล์ — ใช้ ${postFiles[0].name} ก่อน`, 'info'); }
  if (pageN) { renderCsv(true); toast(`อ่านข้อมูลเพจแล้ว ${pageN} ไฟล์`, 'info'); }
  if (dupNames.length) toast(`ข้ามไฟล์ซ้ำ ${dupNames.length} ไฟล์ (เนื้อหาเหมือนไฟล์ที่เลือกไว้แล้ว): ${dupNames.slice(0, 3).join(', ')}`, 'error');
}
/** ลายนิ้วมือของไฟล์ (SHA-256) ใช้ตรวจว่าไฟล์เดิมถูกเลือกซ้ำหรือเคยนำเข้าแล้ว */
async function fileHash(buf) {
  try { if (window.crypto && crypto.subtle) { const h = await crypto.subtle.digest('SHA-256', buf); return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''); } } catch (_) {}
  const b = new Uint8Array(buf); let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < b.length; i++) { h1 = Math.imul(h1 ^ b[i], 16777619); h2 = Math.imul(h2 + b[i], 2654435761); }
  return 'f' + (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16) + b.length.toString(16);
}
function loadPostRows(name, rows, announce) {
  try {
    if (rows.length < 2) { toast(`ไม่พบข้อมูลใน ${name} ตรวจว่าแถวแรกเป็นหัวคอลัมน์`, 'error'); return; }
    let hi = 0; for (let i = 0; i < Math.min(5, rows.length); i++) { if (rows[i].filter(x => String(x).trim()).length >= Math.max(3, rows[0].length * .6)) { hi = i; break; } }
    const headers = rows[hi].map(h => String(h).trim()); const body = rows.slice(hi + 1).filter(r => r.length > 1);
    const ap = allowedP();
    const nz = new Set(); headers.forEach((h, j) => { if (body.some(r => { const v = String(r[j] == null ? '' : r[j]).trim(); return v !== '' && v !== '0' && v !== '0.0' && !/^n\/?a$/i.test(v); })) nz.add(j); });
    const retention = headers.map((h, j) => [h, j]).filter(([h, j]) => nz.has(j) && /(เปอร์เซ็นต์การรับชมทั้งหมดในช่วงเวลา|percentage of total views at interval|retention.*interval)\s*(\d+)/i.test(h)).sort((a, b) => +a[0].match(/(\d+)\s*$/)[1] - +b[0].match(/(\d+)\s*$/)[1]).map(x => x[1]);
    const demo = headers.map((h, j) => [h, j]).filter(([h, j]) => nz.has(j) && /\((F|M|U), ?(\d{2}-\d{2}|\d{2}\+)\)|\(([^()]+) \(([A-Z]{2})\)\)\s*$/.test(h));
    S.csv = { name, headers, rows: body, nz, map: csvGuess(headers, nz), platform: 'auto', fallback: ap[0], dateFmt: 'mdy', defType: '', defCat: 'auto', skipZero: true, recat: false, retention: retention.length > 4 ? retention : null, demo, audFromVideo: demo.length > 0 && !(S.pimp && S.pimp.files.some(f => f.kind === 'aud')), result: null };
    renderCsv(true); if (announce !== false) toast(`อ่านไฟล์แล้ว ${fnum(body.length)} แถว`, 'info');
  } catch (e) { toast('อ่านไฟล์ไม่สำเร็จ: ' + e.message, 'error'); }
}

/* ---------- ไฟล์ข้อมูลเพจ (Meta Business Suite → ข้อมูลเชิงลึก → ส่งออก) ---------- */
const oneCell = r => r.filter(c => String(c).trim()).length === 1;
const AUD_SEC = { country: /ประเทศยอดนิยม|top countries|^countries$|^ประเทศ$/i, ageGender: /อายุและเพศ|age\s*(and|&)\s*gender/i, city: /เมืองยอดนิยม|top cities|towns?\/cities|^cities$|^เมือง$/i };
const plOfText = t => /instagram/i.test(t) ? 'ig' : /tiktok/i.test(t) ? 'tt' : /facebook/i.test(t) ? 'fb' : null;
function parsePageFile(name, rows) {
  const txt = r => String(r[0] || '').trim();
  if (rows.some(r => oneCell(r) && Object.values(AUD_SEC).some(re => re.test(txt(r))))) { const a = parseAudFile(name, rows); return a ? [a] : null; }
  const hi = rows.findIndex(r => r.length >= 2 && /^(วันที่|date)$/i.test(String(r[0] || '').trim()));
  if (hi < 0 || hi > 3) return null;
  const title = rows.slice(0, hi).filter(oneCell).map(txt).join(' ');
  const head = rows[hi].map(h => String(h).trim());
  const body = rows.slice(hi + 1).filter(r => parseDateStr(r[0], 'mdy'));
  if (!body.length) return null;
  let cols = head.map((h, j) => ({ h, j })).slice(1).filter(x => !/previous|ก่อนหน้า|comparison|เปรียบเทียบ/i.test(x.h));
  if (cols.some(x => /^primary$/i.test(x.h))) cols = cols.filter(x => /^primary$/i.test(x.h));
  const out = cols.map(({ h, j }) => {
    const label = !h || /^primary$/i.test(h) ? title : (title ? title + ' · ' + h : h);
    const all = body.map(r => ({ date: iso(parseDateStr(r[0], 'mdy')), v: toNum(r[j]) })).filter(x => x.v != null);
    const byD = new Map(); all.forEach(x => byD.set(x.date, x)); const pts = [...byD.values()].sort((a, b) => a.date < b.date ? -1 : 1);
    return { kind: 'daily', dupDates: all.length - pts.length, id: name + '#' + j, name, title: label || name, metric: guessPageMetric(label) || guessPageMetric(h), platform: plOfText(label), pts };
  }).filter(x => x.pts.length);
  return out.length ? out : null;
}
const TH_PROV = 'กรุงเทพมหานคร กระบี่ กาญจนบุรี กาฬสินธุ์ กำแพงเพชร ขอนแก่น จันทบุรี ฉะเชิงเทรา ชลบุรี ชัยนาท ชัยภูมิ ชุมพร เชียงราย เชียงใหม่ ตรัง ตราด ตาก นครนายก นครปฐม นครพนม นครราชสีมา นครศรีธรรมราช นครสวรรค์ นนทบุรี นราธิวาส น่าน บึงกาฬ บุรีรัมย์ ปทุมธานี ประจวบคีรีขันธ์ ปราจีนบุรี ปัตตานี พระนครศรีอยุธยา พะเยา พังงา พัทลุง พิจิตร พิษณุโลก เพชรบุรี เพชรบูรณ์ แพร่ ภูเก็ต มหาสารคาม มุกดาหาร แม่ฮ่องสอน ยโสธร ยะลา ร้อยเอ็ด ระนอง ระยอง ราชบุรี ลพบุรี ลำปาง ลำพูน เลย ศรีสะเกษ สกลนคร สงขลา สตูล สมุทรปราการ สมุทรสงคราม สมุทรสาคร สระแก้ว สระบุรี สิงห์บุรี สุโขทัย สุพรรณบุรี สุราษฎร์ธานี สุรินทร์ หนองคาย หนองบัวลำภู อ่างทอง อำนาจเจริญ อุดรธานี อุตรดิตถ์ อุทัยธานี อุบลราชธานี'.split(' ');
const PROV_EN = { 'bangkok': 'กรุงเทพมหานคร', 'chiang mai': 'เชียงใหม่', 'chiang rai': 'เชียงราย', 'lamphun': 'ลำพูน', 'lampang': 'ลำปาง', 'phayao': 'พะเยา', 'phrae': 'แพร่', 'nan': 'น่าน', 'mae hong son': 'แม่ฮ่องสอน', 'tak': 'ตาก', 'uttaradit': 'อุตรดิตถ์', 'sukhothai': 'สุโขทัย', 'phitsanulok': 'พิษณุโลก', 'kamphaeng phet': 'กำแพงเพชร', 'nakhon sawan': 'นครสวรรค์', 'phetchabun': 'เพชรบูรณ์', 'nonthaburi': 'นนทบุรี', 'pathum thani': 'ปทุมธานี', 'samut prakan': 'สมุทรปราการ', 'nakhon pathom': 'นครปฐม', 'chon buri': 'ชลบุรี', 'chonburi': 'ชลบุรี', 'rayong': 'ระยอง', 'khon kaen': 'ขอนแก่น', 'udon thani': 'อุดรธานี', 'nakhon ratchasima': 'นครราชสีมา', 'ubon ratchathani': 'อุบลราชธานี', 'songkhla': 'สงขลา', 'phuket': 'ภูเก็ต', 'surat thani': 'สุราษฎร์ธานี', 'nakhon si thammarat': 'นครศรีธรรมราช', 'phra nakhon si ayutthaya': 'พระนครศรีอยุธยา', 'loei': 'เลย' };
function provinceOf(c) {
  const isP = x => TH_PROV.includes(x) ? x : null;
  let m = c.match(/จังหวัด\s*([^,]+)/); if (m) return isP(m[1].trim()) || m[1].trim();
  if (/กรุงเทพ|bangkok/i.test(c)) return 'กรุงเทพมหานคร';
  const parts = c.split(',').map(x => x.trim()); const last = parts[parts.length - 1];
  if (parts.length > 1) { const e = last.toLowerCase().replace(/\s+province$/, ''); if (PROV_EN[e]) return PROV_EN[e]; if (isP(last)) return last; }
  m = c.match(/^เทศบาล(?:นคร|เมือง)\s*([^,]+)$/); if (m && isP(m[1].trim())) return m[1].trim();
  return PROV_EN[c.toLowerCase()] || isP(c);
}
function parseAudFile(name, rows) {
  const secs = {}; let cur = null;
  rows.forEach(r => { const hit = oneCell(r) && Object.entries(AUD_SEC).find(([, re]) => re.test(String(r[0] || '').trim())); if (hit) { cur = hit[0]; secs[cur] = []; } else if (cur) secs[cur].push(r); });
  const pairs = sec => { if (!sec || sec.length < 2) return null; const o = {}; sec[0].forEach((k, i) => { const v = toNum(sec[1][i]); k = String(k).trim(); if (k && v) o[k] = v / 100; }); return Object.keys(o).length ? o : null; };
  const country = pairs(secs.country), city = pairs(secs.city);
  let ageGender = null, gender = null, age = null;
  if (secs.ageGender && secs.ageGender.length > 1) {
    const gk = secs.ageGender[0].map(x => { x = String(x).trim(); return !x ? null : /หญิง|female|women/i.test(x) ? 'หญิง' : /ชาย|male|men/i.test(x) ? 'ชาย' : 'ไม่ระบุ'; });
    ageGender = {}; gender = {}; age = {};
    secs.ageGender.slice(1).forEach(r => { const ak = String(r[0] || '').trim().replace(/\s*-\s*/, '–'); if (!ak) return; r.forEach((v, i) => { const g = gk[i], n = i ? toNum(v) : null; if (!g || !n) return; (ageGender[ak] = ageGender[ak] || {})[g] = n / 100; gender[g] = (gender[g] || 0) + n / 100; age[ak] = (age[ak] || 0) + n / 100; }); });
    if (!Object.keys(gender).length) ageGender = gender = age = null;
  }
  let province = null;
  if (city) { province = {}; Object.entries(city).forEach(([c, v]) => { const p = provinceOf(c); if (p) province[p] = (province[p] || 0) + v; }); if (!Object.keys(province).length) province = null; }
  if (!country && !city && !gender) return null;
  return { kind: 'aud', id: name + '#aud', name, title: 'กลุ่มเป้าหมาย (ผู้ติดตาม)', platform: plOfText(rows.map(r => r.join(' ')).join(' ')), gender, age, ageGender, country, city, province };
}
function pageRows(P) {
  const by = {}; const dup = new Set();
  P.files.filter(f => f.kind === 'daily' && f.metric).forEach(f => {
    const pl = f.platform || P.platform;
    f.pts.forEach(x => { if (!x.v) return; const key = pl + '|' + x.date; const o = by[key] || (by[key] = { pl, row: { date: x.date } }); if (o.row[f.metric] != null) dup.add(f.metric); o.row[f.metric] = x.v; });
  });
  const out = {}; Object.values(by).forEach(({ pl, row }) => (out[pl] = out[pl] || []).push(row));
  Object.values(out).forEach(l => l.sort((a, b) => a.date < b.date ? -1 : 1));
  return { byPl: out, dup };
}
function pageView() {
  const P = S.pimp; const ap = allowedP();
  if (P.result) {
    const r = P.result;
    return `<section class="panel result-card soft"><div class="badge-ic ok">${ic('check', 30)}</div><h2>นำเข้าข้อมูลเพจเรียบร้อย</h2><p class="muted">${r.metrics.map(k => PM[k].t).join(' · ')}${r.aud ? `${r.metrics.length ? ' · ' : ''}กลุ่มเป้าหมาย` : ''}</p>
      <div class="stat-list" style="grid-template-columns:repeat(3,minmax(0,1fr));width:100%;max-width:520px"><div class="stat"><small>วันใหม่</small><b>${fnum(r.added)}</b></div><div class="stat"><small>อัปเดตวันเดิม</small><b>${fnum(r.updated)}</b></div><div class="stat"><small>ตัวชี้วัด</small><b>${fnum(r.metrics.length)}</b></div></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="btn" data-act="page-reset">นำเข้าไฟล์อื่น</button><button class="btn primary" data-act="page-done">ดูภาพรวมเพจ ${ic('arrow', 14)}</button></div></section>`;
  }
  const daily = P.files.filter(f => f.kind === 'daily'), aud = P.files.find(f => f.kind === 'aud');
  const { byPl, dup } = pageRows(P); const nDays = Object.values(byPl).reduce((s, l) => s + l.length, 0);
  const noPl = P.files.some(f => !f.platform);
  const top = (o, n = 3) => o ? Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n) : [];
  const dCard = f => {
    const nz = f.pts.filter(x => x.v), zeros = f.pts.length - nz.length; const tot = nz.reduce((s, x) => s + x.v, 0);
    const a = f.pts[0].date, b = f.pts[f.pts.length - 1].date; const m = f.metric && PM[f.metric];
    return `<article class="pf-card${f.metric ? '' : ' warn'}"><header><span class="pf-ic">${ic(m ? m.ic : 'file', 16)}</span><div><b>${esc(m ? m.t : f.title)}</b><small>${(() => { const t = f.title.replace(/\s*(บน)?\s*(Facebook|Instagram|TikTok)\s*/gi, ' ').trim(); const pl = f.platform ? PL[f.platform].name : ''; return m && t === m.t ? (pl || 'ไฟล์ ' + esc(f.name)) : esc(f.title) + (pl && !f.title.includes(pl) ? ' · ' + pl : ''); })()}</small></div><button class="icon-btn sm" data-act="page-rm" data-id="${esc(f.id)}" aria-label="เอาไฟล์นี้ออก" title="เอาไฟล์นี้ออก">${ic('x', 14)}</button></header>
      <div class="pf-mid"><div><div class="pf-big">${fk(tot)}</div><div class="note">${fds(parseISO(a))} – ${fdate(parseISO(b))} · ${nz.length} วัน${zeros ? ` · ข้ามค่า 0 ${zeros} วัน` : ''}</div></div>${spark(f.pts.map(x => x.v), 'var(--accent)', 110, 34)}</div>
      <div class="field"><label class="sr" for="pm-${esc(f.id)}">ตัวชี้วัด</label><select class="input sm${f.metric ? ' mapped' : ''}" id="pm-${esc(f.id)}" data-change="page-metric" data-id="${esc(f.id)}"><option value="">— เลือกว่าไฟล์นี้คือค่าอะไร —</option>${PAGE_M.map(x => `<option value="${x.k}" ${f.metric === x.k ? 'selected' : ''}>${x.t} (${x.en})</option>`).join('')}</select></div></article>`;
  };
  const aCard = f => `<article class="pf-card aud"><header><span class="pf-ic">${ic('audience', 16)}</span><div><b>กลุ่มเป้าหมาย</b><small>${esc(f.name)}</small></div><button class="icon-btn sm" data-act="page-rm" data-id="${esc(f.id)}" aria-label="เอาไฟล์นี้ออก">${ic('x', 14)}</button></header>
      ${f.gender ? split(f.gender['หญิง'] / ((f.gender['หญิง'] || 0) + (f.gender['ชาย'] || 0) || 1), 'ผู้หญิง', 'ผู้ชาย') : ''}
      <div class="pf-facts">${f.age ? `<div><small>อายุหลัก</small><b>${top(f.age, 2).map(([k, v]) => `${esc(k)} ปี ${pct(v, 0)}`).join(' · ')}</b></div>` : ''}${f.country ? `<div><small>ประเทศ</small><b>${top(f.country, 2).map(([k, v]) => `${esc(k)} ${pct(v, 1)}`).join(' · ')}</b></div>` : ''}${f.province ? `<div><small>จังหวัด (จากเมืองยอดนิยม)</small><b>${top(f.province, 2).map(([k, v]) => `${esc(k)} ${pct(v, 1)}`).join(' · ')}</b></div>` : ''}${f.city ? `<div><small>เมือง</small><b>${Object.keys(f.city).length} เมืองยอดนิยม</b></div>` : ''}</div>
      <div class="field"><label for="pg-fol">ยอดผู้ติดตามปัจจุบัน <span class="muted">(ไม่อยู่ในไฟล์ — ใส่หรือเว้นว่างได้)</span></label><input class="input sm" id="pg-fol" type="number" min="0" inputmode="numeric" placeholder="เช่น 56543" value="${esc(P.followers)}" data-input="page-fol"></div></article>`;
  return `<section class="form-sec page-imp"><h3><span class="n">${ic('sheet', 14)}</span>ข้อมูลระดับเพจ <small class="muted" style="font-weight:400">Page insights</small></h3>
    <p>พบ ${daily.length ? `ข้อมูลรายวัน ${daily.length} ไฟล์ (${nDays} วัน)` : ''}${daily.length && aud ? ' และ' : ''}${aud ? 'ข้อมูลกลุ่มเป้าหมาย' : ''} · วันที่เป็น 0 จะไม่ถูกนำเข้า · วันที่มีอยู่แล้วจะอัปเดตตัวเลข ไม่สร้างซ้ำ</p>
    ${noPl ? `<div class="fgrid" style="margin-bottom:12px"><div class="field"><label for="pg-pl">แพลตฟอร์มของไฟล์ที่ไม่ระบุ</label><select class="input" id="pg-pl" data-change="page-pl">${ap.map(p => `<option value="${p}" ${P.platform === p ? 'selected' : ''}>${PL[p].name}</option>`).join('')}</select></div></div>` : ''}
    ${dup.size ? `<div class="callout warn" style="margin-bottom:12px">${ic('clock', 16)}<div>มีไฟล์ตัวชี้วัดเดียวกันซ้ำ (${[...dup].map(k => PM[k].t).join(', ')}) — ระบบจะใช้ค่าจากไฟล์ที่อยู่หลังสุด</div></div>` : ''}
    <div class="pf-grid" data-stagger>${daily.map(dCard).join('')}${aud ? aCard(aud) : ''}</div>
    <div class="form-actions"><button class="btn" type="button" data-act="page-reset">ยกเลิก</button><button class="btn primary lg" type="button" data-act="page-import" ${nDays || aud ? '' : 'disabled'}>${ic('upload', 16)} นำเข้าข้อมูลเพจ${nDays ? ` ${fnum(nDays)} วัน` : ''}${aud ? `${nDays ? ' +' : ''} กลุ่มเป้าหมาย` : ''}</button></div></section>`;
}
const COUNTRY_TH = { TH: 'ไทย', LA: 'ลาว', MM: 'เมียนมา', KH: 'กัมพูชา', VN: 'เวียดนาม', MY: 'มาเลเซีย', SG: 'สิงคโปร์', CN: 'จีน', JP: 'ญี่ปุ่น', KR: 'เกาหลีใต้', US: 'สหรัฐอเมริกา', GB: 'สหราชอาณาจักร', IN: 'อินเดีย', ID: 'อินโดนีเซีย', PH: 'ฟิลิปปินส์', TW: 'ไต้หวัน', HK: 'ฮ่องกง', AU: 'ออสเตรเลีย', DE: 'เยอรมนี', FR: 'ฝรั่งเศส' };
function csvAudience() {
  const c = S.csv; const g = {}, a = {}, co = {};
  c.demo.forEach(([h, j]) => {
    const sum = c.rows.reduce((s, r) => s + n0(toNum(r[j])), 0); if (!sum) return;
    let m = h.match(/\((F|M|U), ?(\d{2}-\d{2}|\d{2}\+)\)/);
    if (m) { const gk = { F: 'หญิง', M: 'ชาย', U: 'ไม่ระบุ' }[m[1]]; g[gk] = (g[gk] || 0) + sum; let ak = m[2].replace('-', '–'); if (/^(55|65)/.test(ak)) ak = '55+'; if (/^13/.test(ak)) ak = '13–17'; a[ak] = (a[ak] || 0) + sum; return; }
    m = h.match(/\(([^()]+) \(([A-Z]{2})\)\)\s*$/); if (m) { const k = COUNTRY_TH[m[2]] || m[1]; co[k] = (co[k] || 0) + sum; }
  });
  const norm = o => { const t = Object.values(o).reduce((s, x) => s + x, 0); if (!t) return null; const e = Object.entries(o).sort((x, y) => y[1] - x[1]); const out = {}; e.forEach(([k, v], i) => { if (i < 6) out[k] = v / t; else out['อื่นๆ'] = (out['อื่นๆ'] || 0) + v / t; }); return out; };
  const pl = c.platform === 'auto' ? (csvBuild().map(b => b.post.platform).find(Boolean) || c.fallback) : c.platform;
  const res = { platform: pl, asOf: Date.now(), source: 'csv', gender: norm(g), age: norm(a), country: norm(co) };
  return res.gender || res.age || res.country ? res : null;
}

/* ================= หน้าต่างป๊อปอัป + ขั้นตอนนำเข้า ================= */
const MODAL = { locked: false };
function modalOpen(html, o = {}) {
  let m = $('#modal'); if (!m) { m = document.createElement('div'); m.id = 'modal'; document.body.appendChild(m); }
  m.className = 'modal-wrap'; m.innerHTML = `<div class="modal-bd" data-act="modal-close"></div><div class="modal${o.wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-body" id="modal-body">${html}</div></div>`;
  modalLock(!!o.locked); document.body.classList.add('modal-open'); void m.offsetWidth; m.classList.add('on');
  setTimeout(() => { const f = $('#modal .modal [data-focus]') || $('#modal .modal button'); if (f) f.focus(); }, 60);
}
function modalSet(html) { const b = $('#modal-body'); if (!b) return; b.innerHTML = html; b.classList.remove('swap'); void b.offsetWidth; b.classList.add('swap'); }
function modalLock(v) { MODAL.locked = v; const m = $('#modal'); if (m) m.classList.toggle('locked', v); }
function modalClose(force) { if (MODAL.locked && !force) { const m = $('#modal .modal'); if (m) { m.classList.remove('nudge'); void m.offsetWidth; m.classList.add('nudge'); } return; } modalLock(false); const m = $('#modal'); if (!m) return; m.classList.remove('on'); document.body.classList.remove('modal-open'); setTimeout(() => { if (!m.classList.contains('on')) m.innerHTML = ''; }, 320); }
const mHead = (icon, title, sub, tone = '') => `<div class="m-head"><span class="m-ic ${tone}">${icon}</span><div><h2 id="modal-title">${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div></div>`;
const spinner = '<span class="m-spin" aria-hidden="true"></span>';
function progView(title, sub, steps) {
  return `${mHead(spinner, title, sub, 'busy')}
   <div class="m-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="ip"><div class="m-pct"><b id="ip-n">0</b><span>%</span></div><div class="m-bar"><span id="ip-bar"></span></div><p class="m-step" id="ip-step">กำลังเริ่ม…</p></div>
   ${steps ? `<ol class="m-steps" id="ip-steps">${steps.map((t, i) => `<li data-i="${i}"><i></i><span>${t}</span></li>`).join('')}</ol>` : ''}
   <p class="m-lock">${ic('lock', 13)} กรุณาอย่าปิดหรือรีเฟรชหน้านี้ ระบบกำลังทำงาน</p>`;
}
/** แถบเปอร์เซ็นต์ที่ขยับนุ่มๆ ระหว่างรอฐานข้อมูลตอบ (ไม่หยุดนิ่งจนดูเหมือนค้าง) */
function progress() {
  let shown = 0, floor = 0, ceil = 0, raf = 0, alive = true;
  const paint = () => { const n = $('#ip-n'), b = $('#ip-bar'), w = $('#ip'); if (n) n.textContent = Math.floor(shown); if (b) b.style.width = shown.toFixed(2) + '%'; if (w) w.setAttribute('aria-valuenow', Math.floor(shown)); };
  const tick = () => { if (!alive) return; if (shown < floor) shown = Math.min(floor, shown + Math.max(.6, (floor - shown) * .18)); else if (shown < ceil) shown += Math.max(.015, (ceil - shown) * .006); paint(); raf = requestAnimationFrame(tick); };
  tick();
  return {
    at(p, next) { floor = Math.max(floor, Math.min(100, p)); ceil = Math.max(floor, Math.min(99.4, next == null ? p : p + (next - p) * .92)); },
    text(t) { const e = $('#ip-step'); if (e) e.textContent = t; },
    step(i, state) { const l = $(`#ip-steps li[data-i="${i}"]`); if (l) { l.className = state; } },
    done() { floor = ceil = 100; shown = 100; paint(); alive = false; cancelAnimationFrame(raf); },
    stop() { alive = false; cancelAnimationFrame(raf); }
  };
}
const normLink = l => { l = String(l || '').trim(); if (!/story_fbid|fbid=|[?&]v=/.test(l)) l = l.split(/[?#]/)[0]; return l.replace(/^https?:\/\/(www\.|m\.|web\.)?/i, '').replace(/\/+$/, '').toLowerCase(); };
const sameNum = (a, b) => a == null || (b != null && Math.abs(Number(a) - Number(b)) < 1e-9);
const IMP = { kind: null, plan: null, done: 0, res: null };
async function withRetry(fn, label, pr) {
  for (let a = 0; ; a++) {
    try { return await fn(); }
    catch (e) { if (a >= 2 || !['network', 'timeout', 'bad_response', 'server'].includes(e.code)) throw e; pr.text(`${label} — การเชื่อมต่อสะดุด กำลังลองใหม่ (${a + 1}/2)…`); await wait(1500 * (a + 1)); }
  }
}
/** ขั้นที่ 1: ตรวจข้อมูลก่อนนำเข้า (ซ้ำในไฟล์ / ซ้ำกับฐานข้อมูล / เคยนำเข้าไฟล์นี้แล้ว) */
async function startImport(kind) {
  IMP.kind = kind; IMP.plan = null; IMP.done = 0; IMP.res = null;
  const steps = ['อ่านและตรวจความถูกต้องของไฟล์', 'ดึงข้อมูลล่าสุดจากฐานข้อมูล', 'ตรวจประวัติการนำเข้าไฟล์', 'เปรียบเทียบหาข้อมูลซ้ำ'];
  modalOpen(progView('กำลังตรวจสอบข้อมูล', 'ตรวจอย่างละเอียดก่อนบันทึก เพื่อไม่ให้มีข้อมูลซ้ำในฐานข้อมูล', steps), { locked: true });
  const pr = progress();
  try {
    pr.step(0, 'run'); pr.at(2, 20); pr.text('กำลังอ่านไฟล์…'); await wait(350);
    const files = kind === 'page' ? S.pimp.files : [{ name: S.csv.name, hash: S.csv.hash, kind: 'posts' }];
    pr.step(0, 'ok'); pr.step(1, 'run'); pr.at(20, 60); pr.text('กำลังดึงข้อมูลล่าสุดจากฐานข้อมูล (อาจมีคนอื่นเพิ่มข้อมูลไว้แล้ว)…');
    const fresh = await withRetry(() => API.bootstrap(), 'ดึงข้อมูลล่าสุด', pr); load(fresh);
    pr.step(1, 'ok'); pr.step(2, 'run'); pr.at(60, 82); pr.text('กำลังตรวจว่าไฟล์เหล่านี้เคยนำเข้าแล้วหรือยัง…');
    const hashes = [...new Set(files.map(f => f.hash).filter(Boolean))];
    let hist = []; try { hist = (await API.importCheck(hashes)).found || []; } catch (e) { console.warn(e); }
    pr.step(2, 'ok'); pr.step(3, 'run'); pr.at(82, 98); pr.text('กำลังเปรียบเทียบทีละรายการกับข้อมูลในฐานข้อมูล…'); await wait(300);
    IMP.plan = kind === 'page' ? planPage(hist) : planPosts(hist);
    pr.step(3, 'ok'); pr.done(); await wait(350);
    modalLock(false); modalSet(reportView());
  } catch (e) { pr.stop(); modalLock(false); modalSet(errorView(e, false)); }
}
function audIsSame(pl, a) {
  const cur = DB.audience[pl] || {}; const r2 = o => JSON.stringify(o ? Object.fromEntries(Object.entries(o).sort().map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * 1000) : v])) : null);
  return ['gender', 'age', 'country', 'city', 'province'].every(k => !a[k] || r2(a[k]) === r2(cur[k]));
}
function planPage(hist) {
  const P = S.pimp; const { byPl, dup } = pageRows(P); const jobs = []; const st = { add: 0, upd: 0, same: 0, withinDup: 0 };
  P.files.forEach(f => st.withinDup += f.dupDates || 0);
  Object.entries(byPl).forEach(([pl, rows]) => {
    const ex = {}; DB.daily.filter(d => d.platform === pl).forEach(d => ex[d.date] = d);
    const send = []; rows.forEach(r => { const e = ex[r.date]; if (!e) { st.add++; send.push(r); return; } if (Object.keys(r).some(k => k !== 'date' && !sameNum(r[k], e[k]))) { st.upd++; send.push(r); } else st.same++; });
    for (let i = 0; i < send.length; i += 90) jobs.push({ type: 'daily', pl, rows: send.slice(i, i + 90) });
  });
  const aud = P.files.find(f => f.kind === 'aud'); let audJob = null, audSame = false;
  if (aud) {
    const pl = aud.platform || P.platform; const body = { platform: pl, asOf: Date.now(), source: 'csv' };
    ['gender', 'age', 'ageGender', 'country', 'city', 'province'].forEach(k => { if (aud[k]) body[k] = aud[k]; });
    const fol = Number(P.followers) > 0 ? Number(P.followers) : null; if (fol) body.followers = fol;
    audSame = audIsSame(pl, aud) && (!fol || fol === folAt(pl, Date.now()));
    if (!audSame) audJob = { type: 'aud', pl, body };
  }
  if (audJob) jobs.push(audJob);
  const warns = [];
  const hmap = Object.fromEntries(hist.map(h => [h.hash, h]));
  [...new Map(P.files.map(f => [f.hash, f])).values()].forEach(f => { const h = hmap[f.hash]; if (h) warns.push(`<b>${esc(f.name)}</b> เคยนำเข้าแล้วเมื่อ ${fdt(h.at)} โดย ${esc(h.email)}`); });
  if (dup.size) warns.push(`มีไฟล์ตัวชี้วัดเดียวกันมากกว่า 1 ไฟล์ (${[...dup].map(k => PM[k].t).join(', ')}) — ใช้ค่าจากไฟล์หลังสุด`);
  if (st.withinDup) warns.push(`พบวันที่ซ้ำกันภายในไฟล์ ${st.withinDup} แถว — ใช้แถวล่าสุดของวันนั้น`);
  const noMetric = P.files.filter(f => f.kind === 'daily' && !f.metric); if (noMetric.length) warns.push(`${noMetric.length} ไฟล์ยังไม่ได้เลือกตัวชี้วัด จะไม่ถูกนำเข้า`);
  return { kind: 'page', jobs, st, aud: !!aud, audSame, warns, rows: jobs.reduce((s, j) => s + (j.rows ? j.rows.length : 0), 0), hasAud: !!audJob, total: jobs.length ? jobs.reduce((s, j) => s + (j.rows ? j.rows.length : 0), 0) || 1 : 0, unit: 'วัน' };
}
function planPosts(hist) {
  const built = csvBuild(); const bad = built.filter(b => b.err).length; const ok = built.filter(b => !b.err).map(b => b.post);
  const byLink = new Map(); ok.forEach(p => byLink.set(p.platform + '|' + normLink(p.link), p)); const withinDup = ok.length - byLink.size;
  const ex = new Map(); DB.posts.forEach(p => ex.set(p.platform + '|' + normLink(p.link), p));
  const st = { add: 0, upd: 0, same: 0, withinDup, bad }; const send = [];
  byLink.forEach((p, k) => {
    const e = ex.get(k); if (!e) { st.add++; send.push(p); return; }
    const mDiff = Object.keys(p.m || {}).some(x => !sameNum(p.m[x], e.m && e.m[x]));
    const vDiff = p.v && Object.keys(p.v).some(x => !sameNum(p.v[x], e.v && e.v[x]));
    const other = (p.recat && p.cat !== e.cat) || (p.caption && !e.caption) || (p.at && Math.abs(p.at - e.at) > 6e4);
    if (mDiff || vDiff || other) { st.upd++; send.push(p); } else st.same++;
  });
  const jobs = []; for (let i = 0; i < send.length; i += 40) jobs.push({ type: 'posts', rows: send.slice(i, i + 40) });
  const c = S.csv; if (c.audFromVideo && c.demo.length) { const aud = csvAudience(); if (aud && !audIsSame(aud.platform, aud)) jobs.push({ type: 'aud', pl: aud.platform, body: aud }); }
  const warns = []; const h = hist.find(x => x.hash === c.hash); if (h) warns.push(`<b>${esc(c.name)}</b> เคยนำเข้าแล้วเมื่อ ${fdt(h.at)} โดย ${esc(h.email)}`);
  if (withinDup) warns.push(`พบลิงก์โพสต์ซ้ำกันภายในไฟล์ ${withinDup} แถว — ใช้แถวล่าสุด`);
  if (bad) warns.push(`${bad} แถวข้อมูลไม่ครบ (ไม่มีลิงก์ / วันที่ / ไม่มีสิทธิ์แพลตฟอร์ม) จะถูกข้าม`);
  const rows = jobs.reduce((s, j) => s + (j.rows ? j.rows.length : 0), 0); return { kind: 'posts', jobs, st, warns, rows, hasAud: jobs.some(j => j.type === 'aud'), total: rows || (jobs.length ? 1 : 0), unit: 'โพสต์' };
}
function reportView() {
  const P = IMP.plan, st = P.st; const n = P.total;
  const box = (cls, v, t, d) => `<div class="m-stat ${cls}"><b>${fnum(v)}</b><span>${t}</span><small>${d}</small></div>`;
  return `${mHead(ic(n ? 'check' : 'sheet', 22), n ? 'ตรวจสอบเสร็จแล้ว พร้อมนำเข้า' : 'ไม่มีข้อมูลใหม่ให้นำเข้า', n ? 'ระบบจะบันทึกเฉพาะข้อมูลใหม่และข้อมูลที่ตัวเลขเปลี่ยน ข้อมูลที่เหมือนเดิมจะข้ามให้อัตโนมัติ' : 'ข้อมูลทั้งหมดในไฟล์นี้มีอยู่ในฐานข้อมูลแล้ว และตัวเลขตรงกันทุกค่า', n ? 'ok' : 'info')}
   <div class="m-stats">${box('add', st.add, 'ข้อมูลใหม่', 'เพิ่มเข้าฐานข้อมูล')}${box('upd', st.upd, 'อัปเดต', 'มีอยู่แล้ว ตัวเลขเปลี่ยน')}${box('same', st.same, 'ซ้ำ · ข้าม', 'เหมือนในฐานข้อมูลทุกค่า')}</div>
   ${P.kind === 'page' && P.aud ? `<p class="m-note">${ic('audience', 14)} กลุ่มเป้าหมาย: ${P.audSame ? 'เหมือนข้อมูลล่าสุดในฐานข้อมูล · ข้าม' : 'จะบันทึกเป็นข้อมูลล่าสุด'}</p>` : ''}
   ${P.warns.length ? `<div class="m-warn">${ic('clock', 16)}<ul>${P.warns.map(w => `<li>${w}</li>`).join('')}</ul></div>` : `<p class="m-note ok">${ic('check', 14)} ไม่พบไฟล์ซ้ำหรือแถวซ้ำภายในไฟล์</p>`}
   <div class="m-actions"><button class="btn" data-act="modal-close">${n ? 'ยกเลิก' : 'ปิด'}</button>${n ? `<button class="btn primary lg" data-act="imp-go" data-focus>${ic('upload', 16)} บันทึก${P.rows ? ` ${fnum(P.rows)} ${P.unit}` : ''}${P.hasAud ? (P.rows ? ' + กลุ่มเป้าหมาย' : 'ข้อมูลกลุ่มเป้าหมาย') : ''}</button>` : ''}</div>`;
}
/** ขั้นที่ 2: บันทึกลงฐานข้อมูลทีละชุด พร้อมเปอร์เซ็นต์ — ปิดหน้าต่างไม่ได้จนกว่าจะเสร็จ */
async function runImportPlan(resume) {
  const P = IMP.plan; if (!P) return;
  if (!resume) { IMP.done = 0; IMP.res = { added: 0, updated: 0, skipped: P.st.same, aud: null }; }
  const R = IMP.res;
  const weight = j => j.type === 'aud' ? 3 : j.rows.length; const total = P.jobs.reduce((s, j) => s + weight(j), 0) || 1;
  modalSet(progView('กำลังบันทึกลงฐานข้อมูล', `${P.rows ? fnum(P.rows) + ' ' + P.unit : 'ข้อมูลกลุ่มเป้าหมาย'} · แบ่งส่งเป็น ${P.jobs.length} ชุดเพื่อความเสถียร`)); modalLock(true);
  const pr = progress(); let doneW = P.jobs.slice(0, IMP.done).reduce((s, j) => s + weight(j), 0); let rowsDone = P.jobs.slice(0, IMP.done).reduce((s, j) => s + (j.rows ? j.rows.length : 0), 0);
  pr.at(doneW / total * 100);
  try {
    for (let i = IMP.done; i < P.jobs.length; i++) {
      const j = P.jobs[i]; const from = doneW / total * 100, to = (doneW + weight(j)) / total * 100; pr.at(from, to);
      if (j.type === 'daily') {
        pr.text(`บันทึกข้อมูลรายวัน ${PL[j.pl].name} · ${fnum(rowsDone + j.rows.length)} / ${fnum(P.rows)} วัน (ชุดที่ ${i + 1}/${P.jobs.length})`);
        const r = await withRetry(() => API.importPage(j.pl, j.rows), 'บันทึกข้อมูลรายวัน', pr); R.added += r.added; R.updated += r.updated;
        DB.daily = DB.daily.filter(d => d.platform !== j.pl).concat((r.daily || []).map(withT));
      } else if (j.type === 'posts') {
        pr.text(`บันทึกโพสต์ ${fnum(rowsDone + j.rows.length)} / ${fnum(P.rows)} (ชุดที่ ${i + 1}/${P.jobs.length})`);
        const r = await withRetry(() => API.importPosts(j.rows), 'บันทึกโพสต์', pr); R.added += r.added; R.updated += r.updated; R.skipped += r.skipped;
        (r.posts || []).forEach(p => { const ex = DB.posts.find(x => x.id === p.id); if (ex) Object.assign(ex, p, { comments: ex.comments }); else DB.posts.push(Object.assign(p, { comments: p.comments || [] })); });
      } else {
        pr.text('บันทึกข้อมูลกลุ่มเป้าหมาย…');
        const r = await withRetry(() => API.saveAudience(j.body), 'บันทึกกลุ่มเป้าหมาย', pr); DB.audience[j.pl] = r.audience; if (r.follower) { DB.followers.push(r.follower); buildFIdx(); } R.aud = j.pl;
      }
      doneW += weight(j); rowsDone += j.rows ? j.rows.length : 0; IMP.done = i + 1; pr.at(doneW / total * 100, doneW / total * 100);
    }
    pr.text('บันทึกประวัติการนำเข้า…');
    const files = IMP.kind === 'page' ? [...new Map(S.pimp.files.map(f => [f.hash, f])).values()].map(f => ({ name: f.name, hash: f.hash, kind: f.kind === 'aud' ? 'audience' : 'daily:' + (f.metric || '?'), rows: f.pts ? f.pts.length : 1 }))
      : [{ name: S.csv.name, hash: S.csv.hash, kind: 'posts', rows: S.csv.rows.length }];
    files.forEach(f => { f.added = R.added; f.updated = R.updated; f.skipped = R.skipped; });
    try { await API.importLog(files); } catch (e) { console.warn(e); }
    pr.done(); await wait(450);
    if (IMP.kind === 'page') { S.pimp.result = { added: R.added, updated: R.updated, metrics: [...new Set(S.pimp.files.filter(f => f.kind === 'daily' && f.metric).map(f => f.metric))], aud: R.aud }; localLog(`นำเข้าข้อมูลเพจ ${R.added + R.updated} วัน`); }
    else { S.csv.result = { added: R.added, updated: R.updated, skipped: R.skipped + P.st.bad, aud: R.aud }; localLog(`นำเข้า CSV เพิ่ม ${R.added} อัปเดต ${R.updated}`); }
    modalLock(false); modalSet(doneView()); renderSide(); renderCsv(false);
  } catch (e) { pr.stop(); modalLock(false); modalSet(errorView(e, true)); }
}
function doneView() {
  const R = IMP.res, P = IMP.plan;
  return `${mHead(ic('check', 24), 'บันทึกลงฐานข้อมูลเรียบร้อย', 'ข้อมูลพร้อมแสดงในภาพรวมแล้ว', 'ok')}
   <div class="m-done"><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div>
   <div class="m-stats">${[['add', R.added, 'เพิ่มใหม่'], ['upd', R.updated, 'อัปเดต'], ['same', R.skipped, 'ข้าม (ซ้ำ)']].map(([c, v, t]) => `<div class="m-stat ${c}"><b>${fnum(v)}</b><span>${t}</span></div>`).join('')}</div>
   ${R.aud ? `<p class="m-note ok">${ic('audience', 14)} บันทึกข้อมูลกลุ่มเป้าหมาย ${PL[R.aud].name} แล้ว</p>` : ''}
   <div class="m-actions"><button class="btn" data-act="modal-close">ปิด</button><button class="btn primary" data-act="imp-view" data-focus>${P.kind === 'page' ? 'ดูภาพรวมเพจ' : 'ดูในคลังโพสต์'} ${ic('arrow', 14)}</button></div>`;
}
function errorView(e, canResume) {
  const P = IMP.plan; const left = P ? P.jobs.length - IMP.done : 0;
  return `${mHead(ic('x', 22), canResume ? 'บันทึกไม่สำเร็จบางส่วน' : 'ตรวจสอบไม่สำเร็จ', esc(e && e.message || 'เกิดข้อผิดพลาด'), 'bad')}
   ${canResume ? `<p class="m-note">${ic('check', 14)} บันทึกไปแล้ว ${IMP.done} จาก ${P.jobs.length} ชุด ข้อมูลส่วนนั้นอยู่ในฐานข้อมูลแล้ว กด “ลองต่อ” เพื่อบันทึกอีก ${left} ชุดที่เหลือ (ไม่เกิดข้อมูลซ้ำ)</p>` : ''}
   <div class="m-actions"><button class="btn" data-act="modal-close">ปิด</button>${canResume ? `<button class="btn primary" data-act="imp-retry" data-focus>${ic('refresh', 15)} ลองต่อ</button>` : `<button class="btn primary" data-act="${IMP.kind === 'page' ? 'page-import' : 'csv-import'}" data-focus>${ic('refresh', 15)} ลองใหม่</button>`}</div>`;
}

/* ---------- ปุ่มตรวจข้อมูลซ้ำในฐานข้อมูล ---------- */
let DUP = null;
const DUP_CATS = [['posts', 'โพสต์ (ลิงก์เดียวกัน)', 'posts'], ['daily', 'ข้อมูลเพจรายวัน (วันเดียวกัน)', 'sheet'], ['comments', 'ความคิดเห็น (ข้อความเดียวกันในโพสต์เดียวกัน)', 'comments'], ['followers', 'ยอดผู้ติดตาม (บันทึกซ้ำในวันเดียวกัน)', 'audience'], ['users', 'ผู้ใช้ (อีเมลซ้ำ)', 'admin']];
async function runDupScan() {
  modalOpen(progView('กำลังตรวจหาข้อมูลซ้ำ', 'ตรวจทุกแท็บในฐานข้อมูล: โพสต์ ข้อมูลรายวัน ความคิดเห็น ผู้ติดตาม และผู้ใช้', DUP_CATS.map(c => c[1])), { locked: true });
  const pr = progress(); pr.at(3, 88); pr.text('กำลังอ่านข้อมูลทั้งหมดจากฐานข้อมูล…');
  let k = 0; const tk = setInterval(() => { if (k < DUP_CATS.length - 1) { pr.step(k, 'ok'); k++; pr.step(k, 'run'); } }, 700); pr.step(0, 'run');
  try {
    DUP = await withRetry(() => API.dupScan(), 'ตรวจข้อมูลซ้ำ', pr); clearInterval(tk); DUP_CATS.forEach((c, i) => pr.step(i, 'ok')); pr.done(); await wait(400);
    modalLock(false); modalSet(dupView());
  } catch (e) { clearInterval(tk); pr.stop(); modalLock(false); modalSet(`${mHead(ic('x', 22), 'ตรวจไม่สำเร็จ', esc(e.message), 'bad')}<div class="m-actions"><button class="btn" data-act="modal-close">ปิด</button><button class="btn primary" data-act="dupscan">ลองใหม่</button></div>`); }
}
function dupView() {
  const d = DUP; const extra = DUP_CATS.reduce((s, [k]) => s + n0(d[k] && d[k].extra), 0); const fixable = ['posts', 'daily', 'comments', 'followers'].reduce((s, k) => s + n0(d[k] && d[k].extra), 0);
  const admin = can('admin');
  return `${mHead(ic(extra ? 'search' : 'check', 22), extra ? `พบข้อมูลซ้ำ ${fnum(extra)} รายการ` : 'ไม่พบข้อมูลซ้ำ', `ตรวจเมื่อ ${fdt(d.scannedAt)}`, extra ? 'warn' : 'ok')}
   <div class="dup-list">${DUP_CATS.map(([k, t, icon]) => { const x = d[k] || { groups: 0, extra: 0, sample: [] }; return `<div class="dup-row${x.extra ? ' has' : ''}"><span class="dup-ic">${ic(icon, 15)}</span><div class="dup-t"><b>${t}</b>${x.extra ? `<small>${x.groups} กลุ่ม · เกินมา ${fnum(x.extra)} แถว</small><ul>${x.sample.map(s2 => `<li>${s2.platform && PL[s2.platform] ? `<i class="dot" style="background:${PL[s2.platform].c}"></i>` : ''}${esc(/^\d{4}-\d{2}-\d{2}$/.test(s2.label) ? fdate(parseISO(s2.label)) : s2.label)} <span class="muted">×${s2.n}</span></li>`).join('')}</ul>` : '<small>ไม่พบรายการซ้ำ</small>'}</div><span class="dup-n">${x.extra ? fnum(x.extra) : ic('check', 16)}</span></div>`; }).join('')}</div>
   ${fixable ? (admin ? `<p class="m-note">${ic('spark', 14)} การรวมรายการซ้ำจะเก็บแถวที่อัปเดตล่าสุด เติมช่องที่ว่างจากแถวอื่น ย้ายความคิดเห็นมาไว้ที่โพสต์ที่เก็บไว้ แล้วลบแถวที่เกิน</p>` : `<p class="m-note">${ic('lock', 14)} แจ้งผู้ดูแลระบบ (Super Admin) ให้กดรวมรายการซ้ำ</p>`) : ''}
   ${d.users && d.users.extra ? `<p class="m-note">${ic('admin', 14)} อีเมลผู้ใช้ซ้ำต้องแก้ที่เมนู “ทีมและสิทธิ์” (ระบบไม่ลบให้อัตโนมัติ)</p>` : ''}
   <div class="m-actions"><button class="btn" data-act="modal-close">ปิด</button><button class="btn" data-act="dupscan">${ic('refresh', 15)} ตรวจอีกครั้ง</button>${fixable && admin ? `<button class="btn primary" data-act="dedupe-ask" data-focus>รวมรายการซ้ำ ${fnum(fixable)} แถว</button>` : ''}</div>`;
}
function dedupeAsk() {
  const fixable = ['posts', 'daily', 'comments', 'followers'].reduce((s, k) => s + n0(DUP[k] && DUP[k].extra), 0);
  modalSet(`${mHead(ic('x', 22), 'ยืนยันการรวมรายการซ้ำ', `จะลบแถวที่เกิน ${fnum(fixable)} แถวออกจากฐานข้อมูล หลังรวมข้อมูลเข้าแถวที่เก็บไว้แล้ว`, 'warn')}
   <p class="m-note">${ic('lock', 14)} ระหว่างรวมข้อมูลจะปิดหน้าต่างไม่ได้ ใช้เวลาประมาณ 10–60 วินาทีตามขนาดข้อมูล</p>
   <div class="m-actions"><button class="btn" data-act="dupscan">ย้อนกลับ</button><button class="btn danger" data-act="dedupe-go" data-focus>ยืนยัน รวมรายการซ้ำ</button></div>`);
}
async function runDedupe() {
  modalSet(progView('กำลังรวมรายการซ้ำ', 'เก็บแถวล่าสุด เติมข้อมูลที่ขาด แล้วลบแถวที่เกิน', ['รวมโพสต์และย้ายความคิดเห็น', 'รวมความคิดเห็น', 'รวมข้อมูลเพจรายวัน', 'รวมยอดผู้ติดตาม', 'โหลดข้อมูลใหม่']));
  modalLock(true); const pr = progress(); pr.at(2, 85); pr.step(0, 'run'); pr.text('กำลังรวมข้อมูลในฐานข้อมูล…');
  let k = 0; const tk = setInterval(() => { if (k < 3) { pr.step(k, 'ok'); k++; pr.step(k, 'run'); } }, 900);
  try {
    const r = await API.dedupe(); clearInterval(tk); [0, 1, 2, 3].forEach(i => pr.step(i, 'ok')); pr.step(4, 'run'); pr.at(88, 99); pr.text('กำลังโหลดข้อมูลใหม่…');
    load(await API.bootstrap()); pr.step(4, 'ok'); pr.done(); await wait(400);
    modalLock(false);
    modalSet(`${mHead(ic('check', 24), 'รวมรายการซ้ำเรียบร้อย', 'ข้อมูลในฐานข้อมูลไม่ซ้ำแล้ว', 'ok')}<div class="m-stats">${[['upd', r.posts, 'โพสต์'], ['upd', r.daily, 'ข้อมูลรายวัน'], ['upd', r.comments, 'ความคิดเห็น'], ['upd', r.followers, 'ผู้ติดตาม']].map(([c, v, t]) => `<div class="m-stat ${c}"><b>${fnum(v)}</b><span>${t}</span><small>แถวที่รวมแล้ว</small></div>`).join('')}</div><div class="m-actions"><button class="btn primary" data-act="modal-close" data-focus>เสร็จแล้ว</button></div>`);
    renderSide(); renderTop(); renderView('soft');
  } catch (e) { clearInterval(tk); pr.stop(); modalLock(false); modalSet(`${mHead(ic('x', 22), 'รวมรายการซ้ำไม่สำเร็จ', esc(e.message), 'bad')}<div class="m-actions"><button class="btn" data-act="modal-close">ปิด</button><button class="btn primary" data-act="dupscan">ตรวจใหม่</button></div>`); }
}

/* ================= setup (ยังไม่ได้ตั้งค่า API_URL) ================= */
function showSetup() {
  root().innerHTML = `<div class="auth" id="auth">
    <section class="auth-art" aria-hidden="true"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="grain"></div>
      <div class="auth-brand">${brandMark()}<b>${esc(APP_NAME)}</b></div>
      <div class="auth-copy"><span class="eyebrow">ตั้งค่าครั้งแรก</span><h1>เชื่อมต่อฐานเก็บข้อมูลเพื่อเริ่มใช้งาน</h1><p>ข้อมูลโพสต์ ความคิดเห็น ผู้ชม และสิทธิ์ผู้ใช้ทั้งหมดจะถูกบันทึกลงฐานข้อมูลของหน่วยงาน</p></div>
      <div class="float-cards"><div class="fc">ฐานเก็บข้อมูล<b>บันทึกทุกอย่าง</b></div><div class="fc">ระบบหลังบ้าน<b>ตรวจสิทธิ์</b></div><div class="fc">หน้าเว็บ<b>ใช้ได้ทุกที่</b></div></div>
    </section>
    <section class="auth-panel"><div class="auth-card">
      <div class="step enter"><span class="eyebrow-sm">${ic('plug', 13)} ยังไม่ได้เชื่อมต่อ</span><h2>ตั้งค่าการเชื่อมต่อ</h2>
       <p class="lead">ไฟล์ <span class="mono">config.js</span> ยังไม่มี URL ของระบบหลังบ้าน ทำตามขั้นตอนใน README.md แล้ววาง URL เพื่อทดสอบที่นี่</p>
       <ol class="setup-steps"><li><b>สร้างฐานข้อมูล</b> ตามคู่มือ แล้ววางโค้ด Code.gs</li><li><b>Run ฟังก์ชัน setup</b> และอนุญาตสิทธิ์</li><li><b>Deploy → Web app</b> · Execute as: Me · Access: Anyone</li><li><b>วาง URL</b> ที่ลงท้ายด้วย /exec ด้านล่าง</li></ol>
       <form id="f-setup" class="stack" style="gap:12px" novalidate><div class="field"><label for="su-url">Web App URL</label><input class="input" id="su-url" placeholder="https://script.google.com/macros/s/…/exec" autocomplete="off" spellcheck="false"></div>
        <span class="err-msg" id="su-err" hidden></span><button class="btn primary lg" type="submit" id="su-go">${ic('plug', 16)} ทดสอบการเชื่อมต่อ</button></form>
       <div id="su-ok"></div></div>
      <div class="auth-foot">${ic('lock', 15)}<span>URL นี้ไม่ใช่รหัสลับ ทุกคำสั่งยังต้องเข้าสู่ระบบด้วยอีเมล <b class="mono">@${esc(DOMAIN)}</b></span></div>
    </div></section></div>`;
}
async function testSetup() {
  const url = $('#su-url').value.trim(), err = $('#su-err'), btn = $('#su-go');
  const bad = m => { err.textContent = m; err.hidden = false; const i = $('#su-url'); i.classList.remove('shake'); void i.offsetWidth; i.classList.add('err', 'shake'); };
  if (!/^https:\/\/script\.google(usercontent)?\.com\/.+\/exec$/.test(url)) return bad('URL ต้องขึ้นต้นด้วย https://script.google.com/macros/s/ และลงท้ายด้วย /exec');
  err.hidden = true; btn.classList.add('loading'); btn.disabled = true;
  try {
    const r = await fetch(url, { method: 'GET', redirect: 'follow' }); const j = await r.json();
    if (!j.ok) throw new Error('ตอบกลับไม่ถูกต้อง');
    $('#su-ok').innerHTML = `<div class="setup-ok soft"><div class="badge-ic ok" style="width:48px;height:48px;border-radius:14px">${ic('check', 24)}</div><div><b>เชื่อมต่อสำเร็จ</b><p class="muted" style="margin:2px 0 10px">คัดลอกบรรทัดนี้ไปแทนใน <span class="mono">config.js</span> บน GitHub แล้วรอ 1–2 นาที</p>
      <div class="code"><span id="su-code">API_URL: '${esc(url)}',</span><button class="btn sm" type="button" data-act="copy-code">${ic('copy', 14)} คัดลอก</button></div></div></div>`;
  } catch (e) { bad('เชื่อมต่อไม่ได้ ตรวจว่า Deploy เป็น Web app และตั้ง Who has access เป็น “Anyone” แล้ว'); }
  finally { btn.classList.remove('loading'); btn.disabled = false; }
}

/* ================= smart fetch (วางลิงก์แล้วดึงข้อมูล) ================= */
const conn = p => ((DB.connections || {})[p] || {});
const canSync = p => can('add') && conn(p.platform).connected && !!(p.link || p.externalId);
function connPill(p) { const c = conn(p); return `<span class="conn-pill${c.connected ? ' on' : ''}"><span class="pl-badge xs" style="background:${PL[p].c}">${PL[p].short}</span>${PL[p].name}<em>${c.connected ? esc(c.name || 'เชื่อมต่อแล้ว') : 'ยังไม่เชื่อมต่อ · กรอกเองได้'}</em></span>`; }
const FX_METRICS = [['reactions', 'ถูกใจ / ความรู้สึก'], ['comments', 'ความคิดเห็น'], ['shares', 'แชร์'], ['saves', 'บันทึก'], ['reach', 'การเข้าถึง'], ['impressions', 'การมองเห็น'], ['clicks', 'คลิก'], ['profileVisits', 'เข้าชมโปรไฟล์'], ['newFollowers', 'ผู้ติดตามใหม่']];
function linkView() {
  const ap = allowedP();
  if (!S.recentPl || !ap.includes(S.recentPl)) S.recentPl = ap.find(p => conn(p).connected) || ap[0];
  return `<div class="stack" data-stagger>
   <section class="fetch-hero"><span class="eyebrow-sm">${ic('link', 13)} Smart fetch</span><h2>วางลิงก์โพสต์ แล้วให้ระบบดึงข้อมูลให้</h2>
    <p>ยอดความรู้สึกแยกตามอิโมจิ การแชร์ ความคิดเห็นทั้งหมด และตัวชี้วัดที่แพลตฟอร์มเปิดให้ · กดอัปเดตภายหลังเพื่อดึงตัวเลขล่าสุดได้ทุกเมื่อ</p>
    <form id="f-fetch" class="fetch-bar" novalidate><span class="fx-pl" id="fx-pl">${fxPlIcon(S.fx.link)}</span><input id="fx-link" type="url" inputmode="url" placeholder="https://www.facebook.com/…  ·  instagram.com/p/…  ·  tiktok.com/@…/video/…" value="${esc(S.fx.link || '')}" autocomplete="off" data-input="fx-link" aria-label="ลิงก์โพสต์"><button class="btn primary lg" id="fx-go" type="submit">${ic('refresh', 16)} ดึงข้อมูล</button></form>
    <div class="conn-row">${ap.map(connPill).join('')}</div>
   </section>
   <div id="fx-result">${fxResult()}</div>
   <section class="panel"><div class="panel-head"><div><h2>หรือเลือกจากโพสต์ล่าสุดของบัญชี</h2><p>ไม่ต้องคัดลอกลิงก์ เลือกโพสต์แล้วระบบดึงข้อมูลให้ทันที</p></div>
    <div class="seg" role="group" aria-label="แพลตฟอร์ม">${ap.map(p => `<button data-act="recent" data-v="${p}" aria-pressed="${S.recentPl === p}"><i class="dot" style="background:${PL[p].c}"></i>${PL[p].name}</button>`).join('')}</div></div>
    <div id="recent-list">${recentView()}</div></section>
  </div>`;
}
function fxPlIcon(link) { const p = detectPl(link || ''); return p ? `<span class="pl-badge" style="background:${PL[p].c}">${PL[p].short}</span>` : ic('link', 18); }
function fxResult() {
  const f = S.fx;
  if (f.loading) return `<section class="panel fx-card"><div class="fx-top"><div class="sk" style="width:150px;height:112px;border-radius:12px"></div><div class="stack" style="gap:10px;flex:1"><div class="sk" style="height:14px;width:40%"></div><div class="sk" style="height:18px;width:85%"></div><div class="sk" style="height:18px;width:60%"></div></div></div><p class="note" style="margin:14px 0 0">${ic('refresh', 13)} กำลังดึงข้อมูลจาก ${esc(PL[f.platform] ? PL[f.platform].name : 'แพลตฟอร์ม')}… ความคิดเห็นจำนวนมากอาจใช้เวลาสักครู่</p></section>`;
  if (f.error) {
    const nc = f.errorCode === 'not_connected';
    return `<div class="callout ${nc ? '' : 'warn'} soft">${ic(nc ? 'plug' : 'clock', 18)}<div><b>${nc ? 'ยังดึงข้อมูลอัตโนมัติไม่ได้' : 'ดึงข้อมูลไม่สำเร็จ'}</b> — ${esc(f.error)}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn sm primary" data-act="fx-manual">${ic('edit', 14)} กรอกข้อมูลเอง</button>${nc && can('connect') ? `<button class="btn sm" data-act="nav" data-v="connect">${ic('plug', 14)} ไปที่เชื่อมต่อบัญชี</button>` : ''}</div></div></div>`;
  }
  const pv = f.preview; if (!pv) return '';
  const af = pv.apiFields || [];
  const got = FX_METRICS.filter(([k]) => pv.m && pv.m[k] != null);
  const miss = FX_METRICS.filter(([k]) => !(pv.m && pv.m[k] != null)).map(x => x[1]);
  const rb = pv.reactionsBreakdown; const rbTot = rb ? REACTIONS.reduce((s, x) => s + n0(rb[x.k]), 0) : 0;
  const vv = pv.v || {};
  return `<section class="panel fx-card soft">
    <div class="fx-top">${pv.img ? `<img class="fx-img" src="${esc(pv.img)}" alt="" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">` : `<div class="fx-img ph">${PL[pv.platform].short}</div>`}
     <div class="fx-info"><div class="chips">${platChip(pv.platform)}${typeChip(pv.type)}<span class="src api">${ic('refresh', 11)} ดึงเมื่อสักครู่</span></div>
      <p>${esc(pv.caption || '(ไม่มีข้อความ)')}</p><span class="note">โพสต์เมื่อ ${pv.at ? fdt(pv.at) : '—'}</span>
      <a class="pd-link" href="${esc(pv.link)}" target="_blank" rel="noopener noreferrer">${ic('link', 13)} ${esc(pv.link)}</a></div></div>
    <div class="fx-metrics">${got.map(([k, t]) => `<div><small>${t}</small><b>${fnum(pv.m[k])}</b></div>`).join('')}${vv.videoViews != null ? `<div><small>ยอดดูวิดีโอ</small><b>${fnum(vv.videoViews)}</b></div>` : ''}${vv.avgWatch != null ? `<div><small>เวลาดูเฉลี่ย</small><b>${fdur(vv.avgWatch)}</b></div>` : ''}</div>
    ${rb && rbTot ? `<div class="react-row compact">${REACTIONS.filter(x => rb[x.k]).map(x => `<div class="react"><span class="re">${x.e}</span><b>${fk(rb[x.k])}</b></div>`).join('')}</div>` : ''}
    <div class="fx-notes">
     <span>${ic('comments', 14)} ${pv.commentCount == null ? 'TikTok ไม่เปิดให้ดึงรายการความคิดเห็น — เพิ่มเองได้หลังบันทึก' : `ดึงความคิดเห็นได้ <b>${fnum(pv.commentCount)}</b> รายการ · เพจตอบแล้ว ${fnum(pv.repliedCount)}`}</span>
     ${miss.length ? `<span>${ic('edit', 14)} แพลตฟอร์มไม่ให้ข้อมูล: ${miss.join(', ')} — กรอกเพิ่มเองได้หลังบันทึก</span>` : ''}
    </div>
    <div class="fx-foot"><div class="field"><label for="fx-cat">หมวดหมู่คอนเทนต์ <span class="muted">(ระบบแนะนำจากข้อความ)</span></label><select class="input" id="fx-cat">${CATS.map(c => `<option value="${c.k}" ${f.cat === c.k ? 'selected' : ''}>${c.t}</option>`).join('')}</select></div>
     ${f.existingId ? `<span class="note">${ic('check', 13)} โพสต์นี้มีในระบบแล้ว การบันทึกจะอัปเดตตัวเลขและความคิดเห็นล่าสุด (หมวดหมู่เดิมไม่เปลี่ยน)</span>` : '<span></span>'}
     <button class="btn primary lg" data-act="fx-save">${ic('check', 16)} ${f.existingId ? 'อัปเดตข้อมูลในระบบ' : 'บันทึกลงระบบ'}</button></div>
   </section>`;
}
function recentView() {
  const p = S.recentPl; if (!p) return emptyState('ยังไม่มีแพลตฟอร์ม', 'บัญชีของคุณยังไม่ได้รับสิทธิ์แพลตฟอร์มใด');
  if (!conn(p).connected) return emptyState(`${PL[p].name} ยังไม่ได้เชื่อมต่อ`, 'เชื่อมต่อบัญชีเพื่อเลือกโพสต์ล่าสุดได้ทันที หรือเพิ่มคอนเทนต์ด้วยการกรอกเอง / นำเข้า CSV', can('connect') ? `<button class="btn sm" data-act="nav" data-v="connect">${ic('plug', 14)} เชื่อมต่อบัญชี</button>` : '');
  const r = S.recent[p];
  if (!r || r.loading) return `<div class="recent-grid">${[1, 2, 3, 4].map(() => '<div class="sk" style="height:190px;border-radius:14px"></div>').join('')}</div>`;
  if (r.error) return `<div class="callout warn">${ic('clock', 18)}<div>${esc(r.error)} <button class="linkbtn" data-act="recent" data-v="${p}" data-force="1">ลองอีกครั้ง</button></div></div>`;
  if (!r.items.length) return emptyState('ไม่พบโพสต์ล่าสุด', 'บัญชีนี้ยังไม่มีโพสต์ที่ดึงได้');
  return `<div class="recent-grid" data-stagger>${r.items.map(x => `<button class="recent-card" data-act="fx-pick" data-pl="${p}" data-ext="${esc(x.externalId)}" data-link="${esc(x.link)}">${x.img ? `<img src="${esc(x.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.visibility='hidden'">` : `<div class="rc-ph" style="--tp:${PL[p].c}">${PL[p].short}</div>`}<div class="rc-body"><span class="note">${x.at ? fdate(x.at) : ''}</span><p>${esc(x.caption || '(ไม่มีข้อความ)')}</p>${x.existingId ? `<span class="src api">${ic('check', 11)} มีในระบบแล้ว · กดเพื่ออัปเดต</span>` : `<span class="src man">${ic('add', 11)} เพิ่มเข้าระบบ</span>`}</div></button>`).join('')}</div>`;
}
async function loadRecent(p, force) {
  if (!p || !conn(p).connected) return;
  if (S.recent[p] && !force && !S.recent[p].error) return;
  S.recent[p] = { loading: true };
  const el = $('#recent-list'); if (el) el.innerHTML = recentView();
  try { S.recent[p] = { items: await API.recentPosts(p) }; } catch (e) { S.recent[p] = { error: e.message }; }
  const el2 = $('#recent-list'); if (el2 && S.recentPl === p) { el2.innerHTML = recentView(); el2.classList.remove('anim'); void el2.offsetWidth; el2.classList.add('anim'); stagger(el2); }
}
function renderFx() { const el = $('#fx-result'); if (el) { el.innerHTML = fxResult(); stagger(el); } }
async function fxFetch(req) {
  const platform = req.platform || detectPl(req.link || '');
  S.fx = Object.assign({ link: req.link || S.fx.link, cat: S.fx.cat || 'news' }, { loading: true, platform, req });
  renderFx(); const btn = $('#fx-go'); if (btn) { btn.classList.add('loading'); btn.disabled = true; }
  try {
    const r = await API.fetchPost(Object.assign({}, req, { save: false }));
    S.fx = Object.assign(S.fx, { loading: false, preview: r.preview, existingId: r.existingId, error: null, cat: autoCategory(r.preview && r.preview.caption) });
    if (r.preview && r.preview.link) S.fx.link = r.preview.link;
  } catch (e) {
    if (e.code === 'unauthorized') return handleErr(e);
    S.fx = Object.assign(S.fx, { loading: false, preview: null, error: e.message, errorCode: e.code });
  } finally { if (btn) { btn.classList.remove('loading'); btn.disabled = false; } }
  renderFx(); const i = $('#fx-link'); if (i && S.fx.link) i.value = S.fx.link;
}
async function fxSave(btn) {
  const f = S.fx; if (!f.preview) return;
  const cat = ($('#fx-cat') || {}).value || 'news';
  try {
    const saved = await busy(btn, () => API.fetchPost({ platform: f.preview.platform, externalId: f.preview.externalId, link: f.preview.link, cat, save: true }));
    upsertLocal(saved);
    const rc = S.recent[f.preview.platform]; if (rc && rc.items) rc.items.forEach(x => { if (x.externalId === f.preview.externalId) x.existingId = saved.id; });
    localLog(`${f.existingId ? 'อัปเดต' : 'ดึง'}โพสต์ ${PL[saved.platform].name} จากลิงก์`);
    S.fx = { link: '', cat };
    renderSide(); go('posts'); setTimeout(() => openPost(saved.id), 380);
    toast(`${f.existingId ? 'อัปเดต' : 'บันทึก'}โพสต์แล้ว · ความคิดเห็น ${fnum(saved.comments.length)} รายการ`);
  } catch (_) {}
}
function upsertLocal(p) {
  p.comments = p.comments || []; p.m = p.m || {};
  const i = DB.posts.findIndex(x => x.id === p.id); if (i >= 0) DB.posts[i] = p; else DB.posts.push(p);
}
async function syncPostIds(ids, btn, label) {
  if (!ids.length) { toast('ไม่มีโพสต์ที่อัปเดตจากแพลตฟอร์มได้ในรายการนี้', 'info'); return; }
  const orig = btn ? btn.innerHTML : ''; let done = 0, fails = [];
  if (btn) { btn.disabled = true; btn.classList.add('busy'); }
  try {
    for (let i = 0; i < ids.length; i += 8) {
      const chunk = ids.slice(i, i + 8);
      if (btn) btn.innerHTML = `${ic('refresh', 15)} ${label || 'กำลังอัปเดต'} ${done}/${ids.length}`;
      const r = await API.syncPosts(chunk);
      (r.posts || []).forEach(upsertLocal); fails = fails.concat(r.errors || []); done += chunk.length;
    }
    renderSide();
    if (fails.length) toast(`อัปเดตแล้ว ${ids.length - fails.length} โพสต์ · ไม่สำเร็จ ${fails.length}: ${fails[0].error}`, 'error');
    else toast(`อัปเดตข้อมูลล่าสุดแล้ว ${ids.length} โพสต์`);
  } catch (e) { handleErr(e); }
  finally { if (btn && document.body.contains(btn)) { btn.disabled = false; btn.classList.remove('busy'); btn.innerHTML = orig; } }
}
async function refreshAll(btn) {
  try {
    await busy(btn, async () => {
      if (PKEYS.some(p => conn(p).connected)) { try { await API.syncFollowers(); } catch (e) { if (e.code === 'unauthorized') throw e; } }
      load(await API.bootstrap());
    });
    renderSide(); renderTop(); renderView('soft'); toast('อัปเดตข้อมูลล่าสุดแล้ว', 'info');
  } catch (_) {}
}

/* ================= integrations ================= */
const CAPS_TXT = {
  fb: { ok: ['ยอดความรู้สึกแยก 7 อิโมจิ', 'จำนวนแชร์', 'ความคิดเห็นทั้งหมด พร้อมการตอบกลับของเพจ', 'การมองเห็น การเข้าถึง และคลิก (เท่าที่ Meta ยังเปิดให้)', 'ยอดผู้ติดตามเพจ'], no: ['จำนวนบันทึก (Saves)', 'ข้อมูลผู้ชมเพจ (Meta ปิดแล้ว)'] },
  ig: { ok: ['ยอดถูกใจ และความคิดเห็นทั้งหมด', 'Reach, Views, Saves, Shares', 'เข้าชมโปรไฟล์ และผู้ติดตามใหม่', 'เวลาดู Reels', 'ผู้ติดตาม + เพศ อายุ ประเทศ เมือง'], no: ['แยกอิโมจิ (Instagram มีแค่ถูกใจ)', 'จังหวัด และภาษา'] },
  tt: { ok: ['ยอดวิว ถูกใจ ความคิดเห็น แชร์', 'ความยาววิดีโอ', 'ยอดผู้ติดตาม'], no: ['รายการความคิดเห็น', 'Reach และเวลาดู (นำเข้า CSV จาก TikTok Studio ได้)'] }
};
/* ---------- เข้าสู่ระบบด้วย Facebook (OAuth) ---------- */
let FBW = null, FBPOLL = null;
function fbLoginView() {
  const L = S.fbLogin; if (!L) return '';
  if (L.phase === 'wait') return `<div class="fb-wait soft"><span class="m-spin"></span><div><b>รอการอนุญาตในหน้าต่าง Facebook…</b><p>เข้าสู่ระบบด้วยบัญชีที่เป็นผู้ดูแลเพจ → กด “ดำเนินการต่อ” → เลือกเพจของหน่วยงาน (และบัญชี Instagram) → กดบันทึก ระบบจะรับข้อมูลและปิดหน้าต่างให้เอง</p>
    <div class="fb-wait-actions"><button class="btn sm" type="button" data-act="fb-reopen">${ic('ext', 14)} เปิดหน้าต่าง Facebook อีกครั้ง</button><button class="btn sm ghost" type="button" data-act="fb-cancel">ยกเลิก</button></div></div></div>`;
  if (L.phase === 'choose') return `<div class="fb-choose soft"><b>บัญชีนี้ดูแล ${L.pages.length} เพจ · เลือกเพจของหน่วยงาน</b><div class="fb-pages">${L.pages.map(p => `<label class="fb-page${L.pick === p.id ? ' on' : ''}"><input type="radio" name="fbpage" value="${esc(p.id)}" data-change="fb-pick" ${L.pick === p.id ? 'checked' : ''}>${p.picture ? `<img src="${esc(p.picture)}" alt="" onerror="this.remove()">` : `<span class="fb-pic">${esc((p.name || '?').replace(/^[เแโใไ]/, '').slice(0, 1))}</span>`}<span><b>${esc(p.name)}</b><small>${p.ig ? 'Instagram @' + esc(p.ig) : 'ไม่มี Instagram ที่ผูกไว้'}</small></span></label>`).join('')}</div>
    <div class="fb-wait-actions"><button class="btn primary" type="button" data-act="fb-pick-go">${ic('check', 15)} เชื่อมต่อเพจนี้</button><button class="btn ghost" type="button" data-act="fb-cancel">ยกเลิก</button></div></div>`;
  return `<div class="callout warn soft" style="margin-top:12px">${ic('clock', 16)}<div><b>เชื่อมต่อไม่สำเร็จ</b><br>${esc(L.msg)}<div style="margin-top:8px"><button class="btn sm" type="button" data-act="fb-cancel">ปิดข้อความนี้</button></div></div></div>`;
}
function renderFbLogin() { const el = $('#fb-login'); if (el) { el.innerHTML = fbLoginView(); stagger(el); } }
function fbStopPoll() { clearTimeout(FBPOLL); FBPOLL = null; }
function fbPopup(url) {
  const w = 620, h = 760, x = Math.max(0, (window.screenX || 0) + (window.outerWidth - w) / 2), y = Math.max(0, (window.screenY || 0) + (window.outerHeight - h) / 2);
  return window.open(url || '', 'fb_login', `width=${w},height=${h},left=${x},top=${y}`);
}
async function fbLoginStart() {
  const err = $('#fb-err'); err.hidden = true; const ma = (DB.connections || {}).metaApp || {};
  const appId = $('#mt-app').value.trim(), appSecret = $('#mt-sec').value.trim(), configId = $('#mt-cfg') ? $('#mt-cfg').value.trim() : '', withIg = $('#mt-ig').checked;
  const bad = !appId && !ma.appId ? 'ใส่ App ID ของ Meta App' : !appSecret && !ma.hasSecret ? 'ใส่ App Secret ของ Meta App' : appId && !/^\d{5,20}$/.test(appId) ? 'App ID ต้องเป็นตัวเลขเท่านั้น' : '';
  if (bad) { err.textContent = bad; err.hidden = false; return; }
  // เปิดหน้าต่างทันทีตอนกด (กันเบราว์เซอร์บล็อกป๊อปอัป) แล้วค่อยใส่ลิงก์ Facebook
  FBW = API.demo ? null : fbPopup('');
  try { if (FBW) FBW.document.write('<p style="font-family:Tahoma,sans-serif;padding:60px 20px;text-align:center;color:#554f60">กำลังเปิดหน้าเข้าสู่ระบบ Facebook…</p>'); } catch (_) {}
  try {
    const r = await busy($('#fb-go'), () => API.metaStart({ appId, appSecret, configId, withIg }));
    if (!API.demo) { if (FBW && !FBW.closed) FBW.location.href = r.authUrl; else FBW = fbPopup(r.authUrl); if (!FBW) toast('เบราว์เซอร์บล็อกหน้าต่าง กด “เปิดหน้าต่าง Facebook อีกครั้ง”', 'error'); }
    DB.connections.metaApp = { appId: appId || ma.appId, hasSecret: true, configId };
    S.fbLogin = { phase: 'wait', since: r.since || 0, url: r.authUrl, t0: Date.now() }; renderFbLogin(); fbPoll();
  } catch (e) { if (FBW && !FBW.closed) FBW.close(); err.textContent = e.message; err.hidden = false; }
}
function fbPoll() {
  fbStopPoll();
  FBPOLL = setTimeout(async () => {
    const L = S.fbLogin; if (!L || L.phase !== 'wait') return;
    if (Date.now() - L.t0 > 15 * 60e3) { S.fbLogin = { phase: 'error', msg: 'หมดเวลารอการอนุญาต กด “เข้าสู่ระบบด้วย Facebook” อีกครั้ง' }; renderFbLogin(); return; }
    try {
      const c = await API.connStatus(); if (!S.fbLogin || S.fbLogin.phase !== 'wait') return;
      if (c.fb && c.fb.connected && (c.fb.connectedAt || 0) !== (L.since || 0)) return fbDone(c);
      if (c.metaPending && c.metaPending.length) { if (FBW && !FBW.closed) FBW.close(); S.fbLogin = { phase: 'choose', pages: c.metaPending, pick: c.metaPending[0].id }; renderFbLogin(); return; }
      if (c.metaError) { if (FBW && !FBW.closed) FBW.close(); S.fbLogin = { phase: 'error', msg: c.metaError }; renderFbLogin(); return; }
    } catch (e) { console.warn(e); }
    fbPoll();
  }, 2500);
}
async function fbDone(c) {
  fbStopPoll(); if (FBW && !FBW.closed) FBW.close();
  S.fbLogin = null; S.connForm = null; DB.connections = c; renderSide(); renderView('none');
  toast(`เชื่อมต่อ ${c.fb.name || 'Facebook'}${c.ig && c.ig.connected ? ' และ ' + c.ig.name : ''} แล้ว`);
  try { mergeFollowers(await API.syncFollowers()); renderView('none'); } catch (_) {}
}
VIEWS.connect = function () {
  const cs = DB.connections || {};
  const card = p => {
    const c = cs[p] || {}; const fm = folMeta(p); const cap = CAPS_TXT[p];
    return `<article class="conn-card${c.connected ? ' on' : ''}" style="--pc:${PL[p].c}">
      <header><span class="pl-badge lg" style="background:${PL[p].c}">${PL[p].short}</span><div><b>${PL[p].name}</b><small>${c.connected ? esc(c.name || 'เชื่อมต่อแล้ว') : 'ยังไม่เชื่อมต่อ'}</small></div>
       <span class="status ${c.connected ? (c.error ? 'pending' : 'active') : 'suspended'}">${c.connected ? (c.error ? 'มีปัญหา' : 'เชื่อมต่อแล้ว') : 'ใช้การกรอกเอง'}</span></header>
      ${c.connected ? `<div class="conn-meta"><div><small>ผู้ติดตามล่าสุด</small><b>${fm ? fk(fm.v) : '—'}</b></div><div><small>ดึงข้อมูลล่าสุด</small><b>${c.lastSync ? ago(c.lastSync) : 'ยังไม่เคย'}</b></div></div>` : ''}
      ${c.error ? `<div class="callout warn" style="font-size:12.5px">${ic('clock', 15)}<div>${esc(c.error)}</div></div>` : ''}
      <ul class="caps">${cap.ok.map(t => `<li class="ok">${ic('check', 13)} ${t}</li>`).join('')}${cap.no.map(t => `<li class="no">${ic('edit', 13)} ${t} — กรอกเอง</li>`).join('')}</ul>
      <footer>${c.connected ? `<button class="btn sm" data-act="sync-fol">${ic('refresh', 14)} ดึงข้อมูลตอนนี้</button>${p === 'fb' ? `<button class="btn sm ghost" data-act="conn-form" data-v="meta">${ic('plug', 14)} เปลี่ยนเพจ</button>` : ''}${S.confirmDisc === p ? `<button class="btn sm danger" data-act="disc-yes" data-v="${p}">ยืนยันยกเลิก</button><button class="btn sm ghost" data-act="disc-no">ไม่ใช่</button>` : `<button class="btn sm ghost" data-act="disc" data-v="${p}">ยกเลิกการเชื่อมต่อ</button>`}`
        : `<button class="btn sm primary" data-act="conn-form" data-v="${p === 'tt' ? 'tt' : 'meta'}">${ic('plug', 14)} เชื่อมต่อ</button>`}</footer>
     </article>`;
  };
  const mc = S.metaChoose;
  return `<div class="stack" data-stagger>
    <div class="callout">${ic('lock', 18)}<div><b>ดึงข้อมูลได้เฉพาะบัญชีของหน่วยงานที่เชื่อมต่อ</b> ผ่าน API ทางการของ Meta และ TikTok สิทธิ์เข้าถึงเก็บไว้ที่ระบบหลังบ้าน ไม่แสดงบนหน้าเว็บ ส่วนที่แพลตฟอร์มไม่เปิดให้ ระบบจะใช้ข้อมูลที่กรอกเองหรือนำเข้า CSV และแสดงเวลาอัปเดตล่าสุดทุกจุด</div></div>
    <div class="grid-3">${PKEYS.map(card).join('')}</div>
    <section class="panel auto-row"><div><h2>อัปเดตอัตโนมัติ</h2><p class="note" style="margin:2px 0 0">ดึงยอดผู้ติดตาม และตัวเลขของโพสต์ 30 วันล่าสุด ทุกชั่วโมง${cs.lastAuto ? ` · ทำงานล่าสุด ${ago(cs.lastAuto)}` : ''}</p></div>
      <label class="switch"><input type="checkbox" id="auto-sync" data-change="autosync" ${cs.autoSync ? 'checked' : ''}><span></span><em>${cs.autoSync ? 'เปิดอยู่' : 'ปิดอยู่'}</em></label></section>
    <section class="panel meta-conn" id="meta-form"${S.connForm === 'meta' ? '' : ' hidden'}><div class="panel-head"><div><h2>${ic('plug', 16)} เชื่อมต่อ Facebook และ Instagram</h2><p>กดเข้าสู่ระบบด้วยบัญชี Facebook ที่เป็นผู้ดูแลเพจ ระบบจะได้สิทธิ์แบบไม่หมดอายุให้เอง ไม่ต้องคัดลอกโทเคน</p></div></div>
      <ol class="conn-steps"><li><b>1</b><span>ตั้งค่า Meta App<small>ทำครั้งเดียว</small></span></li><li><b>2</b><span>ใส่ App ID + Secret<small>จากหน้า App settings</small></span></li><li><b>3</b><span>เข้าสู่ระบบด้วย Facebook<small>เลือกเพจ แล้วกดอนุญาต</small></span></li></ol>
      <details class="help"${(cs.metaApp || {}).appId ? '' : ' open'}><summary>ขั้นที่ 1 · ตั้งค่า Meta App ครั้งแรก (ประมาณ 5 นาที)</summary><ol>
       <li>ไปที่ <b>developers.facebook.com</b> → My Apps → Create App → เลือก use case <b>“Manage everything on your Page”</b> (หรือใช้แอปเดิมของหน่วยงานที่มี Facebook Login)</li>
       <li>เมนู <b>Facebook Login → Settings</b> วางลิงก์ด้านล่างในช่อง <b>Valid OAuth Redirect URIs</b> แล้วกด Save</li>
       <li>ถ้าจะดึง Instagram ด้วย: เพิ่ม use case / Product <b>Instagram</b> (แบบ Facebook Login) และบัญชี Instagram ต้องเป็น Business หรือ Creator ที่ผูกกับเพจ</li>
       <li>แอปที่ยังเป็นโหมด <b>Development</b> ใช้ได้ทันทีโดยไม่ต้องส่ง App Review แต่คนที่กดเข้าสู่ระบบต้องมีบทบาทในแอป (App roles → Admin/Developer/Tester)</li></ol>
       <div class="code"><span id="meta-redirect">${esc(cs.redirectUri || 'ต้อง Deploy ระบบหลังบ้านก่อน')}</span><button class="btn sm" type="button" data-act="copy-el" data-v="meta-redirect">${ic('copy', 14)} คัดลอก</button></div></details>
      <form id="f-meta-login" class="stack" style="gap:12px;margin-top:14px" novalidate><div class="fgrid">
       <div class="field"><label for="mt-app">App ID</label><input class="input" id="mt-app" autocomplete="off" inputmode="numeric" placeholder="เช่น 1234567890123456" value="${esc((cs.metaApp || {}).appId || '')}"></div>
       <div class="field"><label for="mt-sec">App Secret</label><input class="input" id="mt-sec" type="password" autocomplete="off" placeholder="${(cs.metaApp || {}).hasSecret ? 'บันทึกไว้แล้ว — เว้นว่างได้' : 'กด Show ที่ App settings → Basic'}"></div>
      </div>
       <label class="check-row"><input type="checkbox" id="mt-ig" checked> ขอสิทธิ์ Instagram ด้วย <span class="muted">(ถ้าหน้า Facebook ขึ้น “Invalid Scopes” ให้เอาติ๊กออก)</span></label>
       <details class="help sm"><summary>ตั้งค่าขั้นสูง (Facebook Login for Business)</summary><div class="field" style="margin-top:10px"><label for="mt-cfg">Configuration ID</label><input class="input" id="mt-cfg" autocomplete="off" value="${esc((cs.metaApp || {}).configId || '')}" placeholder="เว้นว่างได้"><span class="hint">ใช้เมื่อแอปเป็นแบบ Business ที่ใช้ Facebook Login for Business เท่านั้น</span></div></details>
       <span class="err-msg" id="fb-err" hidden></span>
       <div class="fb-row"><button class="btn fb-btn lg" type="submit" id="fb-go"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg> เข้าสู่ระบบด้วย Facebook</button><button class="btn ghost" type="button" data-act="conn-form" data-v="">ยกเลิก</button></div>
      </form>
      <div id="fb-login">${fbLoginView()}</div>
      <details class="help alt"><summary>วิธีสำรอง: วาง Access Token เอง</summary>
       <p class="note" style="margin:8px 0 10px">ใช้เมื่อเข้าสู่ระบบด้วยปุ่มด้านบนไม่ได้ · ใน Graph API Explorer ต้องเลือก Meta App ให้ตรงกับ App ID ด้านบน และวางโทเคนทันทีหลังสร้าง (โทเคนแบบสั้นหมดอายุใน 1 ชั่วโมง ระบบจะแลกเป็นแบบถาวรให้)</p>
       <form id="f-meta" class="stack" style="gap:12px" novalidate><div class="fgrid">
        <div class="field wide"><label for="mt-tok">User หรือ Page Access Token</label><input class="input" id="mt-tok" type="password" autocomplete="off"></div>
        ${mc ? `<div class="field wide"><label for="mt-page">เลือกเพจของหน่วยงาน</label><select class="input" id="mt-page">${mc.map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('')}</select></div>` : ''}
       </div><span class="err-msg" id="mt-err" hidden></span><div><button class="btn" type="submit" id="mt-go">${ic('plug', 15)} ${mc ? 'เชื่อมต่อเพจที่เลือก' : 'ตรวจสอบและเชื่อมต่อ'}</button></div></form></details></section>
    <section class="panel" id="tt-form"${S.connForm === 'tt' ? '' : ' hidden'}><div class="panel-head"><div><h2>${ic('plug', 16)} เชื่อมต่อ TikTok</h2><p>ใช้ TikTok for Developers · Login Kit + scope user.info.basic, user.info.stats, video.list</p></div></div>
      <details class="help"><summary>ขั้นตอนตั้งค่าแอป TikTok</summary><ol>
       <li>ไปที่ developers.tiktok.com → Manage apps → Connect an app</li>
       <li>เพิ่ม Products: Login Kit และ Display API · ขอ scope ตามด้านบน</li>
       <li>ใส่ Redirect URI ด้านล่างในช่อง Login Kit → Redirect URI</li>
       <li>คัดลอก Client Key และ Client Secret มาวาง แล้วกด “ไปหน้าอนุญาตของ TikTok” และเข้าสู่ระบบด้วยบัญชี TikTok ของหน่วยงาน</li></ol></details>
      <div class="code" style="margin-bottom:12px"><span id="tt-redirect">${esc(cs.redirectUri || 'ต้อง Deploy ระบบหลังบ้านก่อน')}</span><button class="btn sm" type="button" data-act="copy-el" data-v="tt-redirect">${ic('copy', 14)} คัดลอก</button></div>
      <form id="f-tt" class="stack" style="gap:12px" novalidate><div class="fgrid">
       <div class="field"><label for="tt-key">Client Key</label><input class="input" id="tt-key" autocomplete="off"></div>
       <div class="field"><label for="tt-sec">Client Secret</label><input class="input" id="tt-sec" type="password" autocomplete="off"></div></div>
       <span class="err-msg" id="tt-err" hidden></span>
       <div id="tt-auth">${S.ttAuth ? `<div class="setup-ok soft"><div><b>ขั้นสุดท้าย</b><p class="muted" style="margin:2px 0 10px">เปิดหน้าอนุญาต เข้าสู่ระบบ TikTok ของหน่วยงาน แล้วกลับมากด “ตรวจสอบสถานะ”</p><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn primary" href="${esc(S.ttAuth)}" target="_blank" rel="noopener">${ic('ext', 15)} ไปหน้าอนุญาตของ TikTok</a><button class="btn" type="button" data-act="conn-check">${ic('refresh', 15)} ตรวจสอบสถานะ</button></div></div></div>` : `<button class="btn primary" type="submit" id="tt-go">${ic('plug', 15)} บันทึกและขอสิทธิ์</button> <button class="btn ghost" type="button" data-act="conn-form" data-v="">ยกเลิก</button>`}</div>
      </form></section>
  </div>`;
};

/* ================= admin ================= */
VIEWS.admin = function () {
  const actives = DB.users.filter(u => u.status !== 'pending'), pend = DB.users.filter(u => u.status === 'pending');
  return `<div class="stack" data-stagger>
   <div class="grid-2">
    <section class="panel"><div class="panel-head"><div><h2>นโยบายการเข้าใช้งาน</h2><p>บังคับใช้ที่เซิร์ฟเวอร์ทุกครั้งที่เข้าสู่ระบบและเรียกข้อมูล</p></div>${DB.sheetUrl ? `<a class="btn sm" href="${esc(DB.sheetUrl)}" target="_blank" rel="noopener noreferrer">${ic('sheet', 14)} เปิดฐานข้อมูล</a>` : ''}</div>
     <div class="stack" style="gap:10px;font-size:13.5px">
      <div style="display:flex;justify-content:space-between;gap:10px"><span>โดเมนอีเมลที่อนุญาต</span><b class="mono">@${esc(DOMAIN)}</b></div>
      <div style="display:flex;justify-content:space-between;gap:10px"><span>ยืนยันตัวตน</span><span>รหัส OTP 6 หลักทางอีเมล (หมดอายุ 10 นาที)</span></div>
      <div style="display:flex;justify-content:space-between;gap:10px"><span>อีเมลใหม่ต้องได้รับอนุมัติ</span><span class="status active">เปิดใช้งาน</span></div>
      <div style="display:flex;justify-content:space-between;gap:10px"><span>อายุการเข้าสู่ระบบ</span><span>7 วัน</span></div>
     </div></section>
    <section class="panel"><div class="panel-head"><div><h2>เพิ่มผู้ใช้</h2><p>ผู้ใช้เข้าได้ทันทีหลังยืนยันรหัสทางอีเมล</p></div></div>
     <form id="add-user" class="stack" style="gap:10px" novalidate>
      <div class="fgrid"><div class="field"><label for="nu-email">อีเมล</label><input class="input" id="nu-email" type="email" placeholder="name.s@${esc(DOMAIN)}" autocomplete="off"></div>
      <div class="field"><label for="nu-role">บทบาท</label><select class="input" id="nu-role">${Object.keys(ROLES).map(r => `<option ${r === 'Analyst' ? 'selected' : ''}>${r}</option>`).join('')}</select></div></div>
      <span class="err-msg" id="nu-err" hidden></span>
      <div><button class="btn primary" type="submit" id="nu-go">${ic('add', 15)} เพิ่มผู้ใช้</button></div>
     </form></section>
   </div>
   ${pend.length ? `<section class="panel"><div class="panel-head"><div><h2>คำขอเข้าใช้งาน (${pend.length})</h2><p>ผู้ที่ยืนยันอีเมล @${esc(DOMAIN)} แล้ว แต่ยังไม่มีสิทธิ์</p></div></div>
    ${pend.map(u => `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 0;border-top:1px solid var(--line)"><span class="avatar">${initials(u.name)}</span><div style="min-width:0;flex:1"><b>${esc(u.email)}</b><div class="note">${u.requested ? 'ขอสิทธิ์เมื่อ ' + fdt(u.requested) : 'รอการอนุมัติ'}</div></div>
     <select class="input" style="width:auto" id="ap-${esc(u.email)}" aria-label="บทบาท">${Object.keys(ROLES).map(r => `<option ${r === 'Viewer' ? 'selected' : ''}>${r}</option>`).join('')}</select>
     <button class="btn primary sm" data-act="approve" data-v="${esc(u.email)}">อนุมัติ</button><button class="btn sm danger" data-act="reject" data-v="${esc(u.email)}">ปฏิเสธ</button></div>`).join('')}</section>` : ''}
   <section><div class="panel-head"><div><h2>ผู้ใช้ทั้งหมด (${actives.length})</h2><p>คลิก “กำหนดสิทธิ์” เพื่อเลือกเมนูและแพลตฟอร์มที่แต่ละอีเมลเข้าถึงได้ · บันทึกลงฐานข้อมูลทันที</p></div></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>ผู้ใช้</th><th>บทบาท</th><th>เมนูที่เข้าถึงได้</th><th>แพลตฟอร์ม</th><th>สถานะ</th><th>ใช้งานล่าสุด</th><th></th></tr></thead><tbody>
    ${actives.map(u => { const self = u.email === ME.email; return `<tr><td><div class="me-row"><span class="avatar">${initials(u.name)}</span><div><b>${esc(u.name)}</b><span>${esc(u.email)}</span></div></div></td><td style="white-space:nowrap">${esc(u.role)}</td>
     <td><div class="perm-chips">${u.menus.length === MENUS.length ? '<span class="chip">ทุกเมนู</span>' : MENUS.filter(m => u.menus.includes(m.k)).map(m => `<span class="chip">${m.t}</span>`).join('')}</div></td>
     <td><div class="perm-chips">${u.platforms.map(p => `<span class="chip plat"><i class="dot" style="background:${PL[p].c}"></i>${PL[p].short}</span>`).join('')}</div></td>
     <td><span class="status ${esc(u.status)}">${{ active: 'ใช้งาน', suspended: 'ระงับ' }[u.status] || esc(u.status)}</span></td><td style="white-space:nowrap" class="note">${u.last ? fdt(u.last) : '—'}</td>
     <td style="white-space:nowrap"><button class="btn sm" data-act="perm" data-v="${esc(u.email)}" aria-expanded="${S.adminEdit === u.email}">กำหนดสิทธิ์</button>${!self && u.status === 'active' ? ` <button class="icon-btn" data-act="act-as" data-v="${esc(u.email)}" title="ดูตัวอย่างมุมมองของผู้ใช้นี้" aria-label="ดูตัวอย่างมุมมองของ ${esc(u.email)}">${ic('eye', 16)}</button>` : ''}</td></tr>
     ${S.adminEdit === u.email ? `<tr class="edit-row"><td colspan="7"><div class="edit-box">
      <div class="field"><span class="lbl">บทบาท</span><div class="seg" role="group">${[...Object.keys(ROLES), 'กำหนดเอง'].map(r => `<button type="button" data-act="setrole" data-u="${esc(u.email)}" data-v="${r}" aria-pressed="${u.role === r}" ${self || r === 'กำหนดเอง' ? 'disabled' : ''}>${r}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">เมนูที่เข้าถึงได้</span><div class="perm-grid">${MENUS.map(m => `<label><input type="checkbox" data-change="pmenu" data-u="${esc(u.email)}" data-v="${m.k}" ${u.menus.includes(m.k) ? 'checked' : ''} ${self && m.k === 'admin' ? 'disabled' : ''}> ${m.t} <span class="muted">${m.sub}</span></label>`).join('')}</div>${self ? '<span class="hint">ไม่สามารถถอดสิทธิ์ผู้ดูแลของบัญชีตัวเองได้</span>' : ''}</div>
      <div class="field"><span class="lbl">แพลตฟอร์มที่เห็นข้อมูล</span><div class="perm-grid">${PKEYS.map(p => `<label><input type="checkbox" data-change="pplat" data-u="${esc(u.email)}" data-v="${p}" ${u.platforms.includes(p) ? 'checked' : ''}> <i class="dot" style="background:${PL[p].c}"></i> ${PL[p].name}</label>`).join('')}</div></div>
      ${self ? '' : `<div style="display:flex;gap:8px;flex-wrap:wrap">${u.status === 'active' ? `<button class="btn sm" data-act="suspend" data-v="${esc(u.email)}">ระงับการใช้งาน</button>` : `<button class="btn sm" data-act="unsuspend" data-v="${esc(u.email)}">เปิดใช้งานอีกครั้ง</button>`}
       ${S.confirmDel === u.email ? `<button class="btn sm danger" data-act="del-user-yes" data-v="${esc(u.email)}">ยืนยันลบ ${esc(u.email)}</button><button class="btn sm" data-act="del-user-no">ยกเลิก</button>` : `<button class="btn sm danger" data-act="del-user" data-v="${esc(u.email)}">ลบผู้ใช้</button>`}</div>`}
     </div></td></tr>` : ''}`; }).join('')}
    </tbody></table></div></section>
   <section class="panel"><div class="panel-head"><div><h2>ประวัติการใช้งาน</h2><p>บันทึกการเข้าสู่ระบบ การเพิ่มข้อมูล และการเปลี่ยนสิทธิ์ (เก็บในฐานข้อมูล)</p></div></div>
    <div class="log">${DB.logs.slice(0, 15).map(l => `<div><time>${fdt(l.at)}</time><span><b>${esc(l.who)}</b> · ${esc(l.what)}</span></div>`).join('') || '<span class="note">ยังไม่มีประวัติ</span>'}</div></section>
  </div>`;
};
async function saveUserPerm(u, patch, btn) {
  const next = Object.assign({}, u, patch);
  try { const saved = await busy(btn, () => API.saveUser({ email: next.email, role: next.role, menus: next.menus, platforms: next.platforms, status: next.status, name: next.name })); Object.assign(u, saved); localLog(`ปรับสิทธิ์ ${u.email}`); toast('บันทึกสิทธิ์แล้ว'); }
  catch (_) { /* แจ้งเตือนแล้ว */ }
  renderView('none'); renderSide();
}

/* ================= events ================= */
document.addEventListener('click', async e => {
  const au = e.target.closest('[data-auth]');
  if (au) {
    const a = au.dataset.auth;
    if (a === 'demo') { const inp = $('#au-email'); inp.value = au.dataset.v; inp.dispatchEvent(new Event('input')); submitEmail(au.dataset.v); }
    if (a === 'fill' && A.demoCode) fillOtp(A.demoCode);
    if (a === 'back') { clearInterval(A.timer); setStep(1, stepEmail()); }
    if (a === 'restart') { A.email = ''; setStep(1, stepEmail()); }
    if (a === 'resend') { au.disabled = true; try { const r = await API.requestOtp(A.email); A.demoCode = r.demoCode || null; A.resendAt = Date.now() + (r.resendIn || 60) * 1000; setStep(2, stepOtp()); toast('ส่งรหัสใหม่แล้ว', 'info'); } catch (err) { au.disabled = false; toast(err.message, 'error'); } }
    return;
  }
  const el = e.target.closest('[data-act]'); if (!el) return; const act = el.dataset.act, v = el.dataset.v;
  if (el.tagName === 'A') e.preventDefault();
  switch (act) {
    case 'nav': go(v); break;
    case 'go-aud': go('add', 'aud'); break;
    case 'go-csv': go('add', 'csv'); break;
    case 'pdm': S.pdm = v; $$('[data-act="pdm"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); mountPageChart('soft'); break;
    case 'pd-range': { const ps = shownP(); const ts = DB.daily.filter(d => ps.includes(d.platform)).map(d => d._t); if (ts.length) { S.f.period = 'custom'; S.f.from = iso(Math.min(...ts)); S.f.to = iso(Math.max(...ts)); refilter(); } break; }
    case 'page-reset': S.pimp = null; renderCsv(true); break;
    case 'page-done': S.pimp = null; S.csv = null; S.f.period = 'custom'; { const ts = DB.daily.map(d => d._t); if (ts.length) { S.f.from = iso(Math.min(...ts)); S.f.to = iso(Math.max(...ts)); } } go('dashboard'); break;
    case 'page-rm': S.pimp.files = S.pimp.files.filter(f => f.id !== el.dataset.id); if (!S.pimp.files.length) S.pimp = null; renderCsv(false); break;
    case 'page-import': startImport('page'); break;
    case 'modal-close': modalClose(); break;
    case 'imp-go': runImportPlan(); break;
    case 'imp-retry': runImportPlan(true); break;
    case 'imp-view': modalClose(true); if (IMP.kind === 'page') { S.pimp = null; S.csv = S.csv && S.csv.result ? null : S.csv; S.f.period = 'custom'; const ts = DB.daily.map(d => d._t); if (ts.length) { S.f.from = iso(Math.min(...ts)); S.f.to = iso(Math.max(...ts)); } go('dashboard'); } else { S.csv = null; S.f.period = 'all'; S.pf.sort = 'new'; go('posts'); } break;
    case 'dupscan': runDupScan(); break;
    case 'dedupe-ask': dedupeAsk(); break;
    case 'dedupe-go': runDedupe(); break;
    case 'go-link': go('add', 'link'); break;
    case 'go-connect': go('connect'); break;
    case 'recent': { S.recentPl = v; $$('[data-act="recent"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); const l = $('#recent-list'); if (l) l.innerHTML = recentView(); loadRecent(v, !!el.dataset.force); break; }
    case 'fx-pick': { const lk = el.dataset.link; S.fx.link = lk; const i = $('#fx-link'); if (i) { i.value = lk; $('#fx-pl').innerHTML = fxPlIcon(lk); } window.scrollTo({ top: 0, behavior: 'smooth' }); fxFetch({ platform: el.dataset.pl, externalId: el.dataset.ext, link: lk }); break; }
    case 'fx-save': fxSave(el); break;
    case 'fx-manual': S.prefill = { link: S.fx.link, platform: detectPl(S.fx.link || '') || S.fx.platform }; S.addTab = 'post'; renderView('fade'); break;
    case 'sync-post': { const id = el.dataset.id; await syncPostIds([id], el, 'กำลังดึง'); renderDrawer(false); if (S.page === 'posts') renderPostList(false); break; }
    case 'sync-all': { const ids = filteredPosts().filter(canSync).map(p => p.id); await syncPostIds(ids, el); renderView('soft'); break; }
    case 'sync-fol': { try { const r = await busy(el, () => API.syncFollowers()); mergeFollowers(r); renderSide(); renderView('none'); toast('ดึงยอดผู้ติดตามล่าสุดแล้ว'); } catch (_) {} break; }
    case 'fb-reopen': if (S.fbLogin && S.fbLogin.url && !API.demo) { FBW = fbPopup(S.fbLogin.url); } break;
    case 'fb-cancel': fbStopPoll(); if (FBW && !FBW.closed) FBW.close(); S.fbLogin = null; renderFbLogin(); break;
    case 'fb-pick-go': { const L = S.fbLogin; if (!L || !L.pick) break; try { const c = await busy(el, () => API.metaPick(L.pick)); await fbDone(c); } catch (e2) { S.fbLogin = { phase: 'error', msg: e2.message }; renderFbLogin(); } break; }
    case 'conn-form': fbStopPoll(); S.fbLogin = null; S.connForm = v || null; S.metaChoose = null; S.ttAuth = null; renderView('none'); if (v) setTimeout(() => { const f = $('#' + (v === 'tt' ? 'tt' : 'meta') + '-form'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); break;
    case 'conn-check': { try { DB.connections = await busy(el, () => API.connStatus()); if (conn('tt').connected) { S.connForm = null; S.ttAuth = null; toast('เชื่อมต่อ TikTok แล้ว'); try { mergeFollowers(await API.syncFollowers()); } catch (_) {} } else toast('ยังไม่พบการอนุญาตจาก TikTok ลองอีกครั้งหลังกดยืนยันในหน้า TikTok', 'info'); renderSide(); renderView('none'); } catch (_) {} break; }
    case 'disc': S.confirmDisc = v; renderView('none'); break;
    case 'disc-no': S.confirmDisc = null; renderView('none'); break;
    case 'disc-yes': { try { DB.connections = await busy(el, () => API.disconnect(v)); S.confirmDisc = null; renderSide(); renderView('none'); toast('ยกเลิกการเชื่อมต่อ ' + PL[v].name + ' แล้ว'); } catch (_) {} break; }
    case 'copy-el': { const n = $('#' + v); const t = n ? n.textContent : ''; try { await navigator.clipboard.writeText(t); toast('คัดลอกแล้ว'); } catch (_) { const r = document.createRange(); r.selectNodeContents(n); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('เลือกข้อความแล้ว กด Ctrl+C เพื่อคัดลอก', 'info'); } break; }
    case 'go-admin': go('admin'); break;
    case 'reply-open': S.replyOpen = el.dataset.id; rerenderCmt(el.dataset.id); break;
    case 'reply-cancel': { const id = S.replyOpen; S.replyOpen = null; if (id) rerenderCmt(id); break; }
    case 'csv-reset': S.csv = null; if (S.pimp && S.pimp.result) S.pimp = null; renderCsv(true); break;
    case 'csv-done': S.csv = null; S.f.period = 'all'; S.pf.sort = 'new'; go('posts'); break;
    case 'csv-import': startImport('posts'); break;
    case 'copy-code': { const t = $('#su-code').textContent; try { await navigator.clipboard.writeText(t); toast('คัดลอกแล้ว'); } catch (_) { const r = document.createRange(); r.selectNodeContents($('#su-code')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('เลือกข้อความแล้ว กด Ctrl+C เพื่อคัดลอก', 'info'); } break; }
    case 'fp': S.f.platform = v; refilter(); break;
    case 'per': S.f.period = v; refilter(); break;
    case 'trend': S.trend = v; $$('[data-act="trend"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); AFTER.dashboard('soft'); break;
    case 'pview': S.pf.view = v; $$('[data-act="pview"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); renderPostList(true); break;
    case 'open': openPost(el.dataset.id); break;
    case 'close-drawer': closeDrawer(); break;
    case 'dcat': S.drawerCat = v; renderDrawer(false); break;
    case 'ctab': S.ct = v; S.person = null; renderView('soft'); break;
    case 'cpsort': S.cpSort = v; renderView('none'); break;
    case 'ppsort': S.ppSort = v; renderView('none'); break;
    case 'person': S.person = S.person === v ? null : v; renderView('none'); break;
    case 'ccat': S.cf.cat = v; $$('[data-act="ccat"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === v)); renderFeed(); break;
    case 'goto-unreplied': S.ct = 'feed'; S.cf = { cat: '', unreplied: true, q: '' }; go('comments'); break;
    case 'refresh': refreshAll(el); break;
    case 'addtab': S.addTab = v; renderView('soft'); break;
    case 'parse': {
      const lines = $('#a-cmts').value.split('\n').map(s => s.trim()).filter(Boolean);
      S.parsed = lines.map(l => { const i = l.search(/[:：]/); const has = i > 0 && i < 40; const text = has ? l.slice(i + 1).trim() : l; return { author: has ? l.slice(0, i).trim() : 'ไม่ระบุชื่อ', text, cat: autoCat(text), replied: false }; });
      $('#parsed').innerHTML = parsedTable(); $('#parsed-n').textContent = S.parsed.length ? `${S.parsed.length} รายการพร้อมบันทึก` : '';
      toast(S.parsed.length ? `จัดหมวด ${S.parsed.length} ความคิดเห็นแล้ว ตรวจสอบก่อนบันทึก` : 'ยังไม่มีความคิดเห็นให้จัดหมวด', S.parsed.length ? 'info' : 'error'); break;
    }
    case 'edit-post': S.editing = el.dataset.id; S.parsed = []; S.img = null; S.addTab = 'post'; closeDrawer(); S.page = 'add'; $$('#side .nav button').forEach(b => b.dataset.v === 'add' ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')); renderTop(); renderView('fade'); window.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'cancel-edit': S.editing = null; go('posts'); break;
    case 'del-post': S.delPost = true; renderDrawer(false); break;
    case 'del-post-no': S.delPost = false; renderDrawer(false); break;
    case 'del-post-yes': {
      const id = el.dataset.id;
      try { await busy(el, () => API.deletePost(id)); const i = DB.posts.findIndex(p => p.id === id); if (i >= 0) DB.posts.splice(i, 1); localLog('ลบโพสต์'); closeDrawer(); renderSide(); renderView('soft'); toast('ลบโพสต์แล้ว'); } catch (_) {}
      break;
    }
    case 'perm': S.adminEdit = S.adminEdit === v ? null : v; S.confirmDel = null; renderView('none'); break;
    case 'setrole': { const u = DB.users.find(x => x.email === el.dataset.u); if (!ROLES[v]) break; saveUserPerm(u, { role: v, menus: ROLES[v].menus.slice(), platforms: ROLES[v].platforms.slice() }, el); break; }
    case 'suspend': case 'unsuspend': { const u = DB.users.find(x => x.email === v); saveUserPerm(u, { status: act === 'suspend' ? 'suspended' : 'active' }, el); break; }
    case 'del-user': S.confirmDel = v; renderView('none'); break;
    case 'del-user-no': S.confirmDel = null; renderView('none'); break;
    case 'del-user-yes': {
      try { await busy(el, () => API.deleteUser(v)); DB.users = DB.users.filter(u => u.email !== v); localLog('ลบผู้ใช้ ' + v); S.adminEdit = null; S.confirmDel = null; renderView('none'); toast('ลบผู้ใช้แล้ว'); } catch (_) {}
      break;
    }
    case 'approve': {
      const role = $('#ap-' + CSS.escape(v)).value;
      try { const u = await busy(el, () => API.approve(v, role)); const i = DB.users.findIndex(x => x.email === v); DB.users[i] = Object.assign(DB.users[i], u); localLog(`อนุมัติ ${v} เป็น ${role}`); renderSide(); renderView('soft'); toast(`อนุมัติ ${v} แล้ว`); } catch (_) {}
      break;
    }
    case 'reject': {
      try { await busy(el, () => API.reject(v)); DB.users = DB.users.filter(u => u.email !== v); localLog('ปฏิเสธคำขอของ ' + v); renderSide(); renderView('soft'); toast('ปฏิเสธคำขอแล้ว'); } catch (_) {}
      break;
    }
    case 'act-as': S.acting = v; S.adminEdit = null; S.page = 'dashboard'; renderSide(); renderTop(); renderView('fade'); window.scrollTo({ top: 0, behavior: 'smooth' }); toast('กำลังดูตัวอย่างมุมมองของ ' + v, 'info'); break;
    case 'stop-acting': S.acting = null; S.page = 'admin'; renderSide(); renderTop(); renderView('fade'); break;
    case 'theme': { const next = isDark() ? 'light' : 'dark'; document.documentElement.setAttribute('data-theme', next); store.set('psi_theme', next); renderSide(); charts.forEach(c => lineChart(c.el, c.cfg, false)); break; }
    case 'logout': { el.classList.add('loading'); await API.logout(); showAuth(); break; }
  }
});
document.addEventListener('change', async e => {
  if (e.target.id === 'a-cat') S.catTouched = true;
  const t = e.target, k = t.dataset.change; if (!k) return;
  switch (k) {
    case 'from': S.f.from = t.value; refilter(); break;
    case 'to': S.f.to = t.value; refilter(); break;
    case 'ptype': S.pf.type = t.value; renderPostList(true); break;
    case 'pcat': S.pf.cat = t.value; renderPostList(true); break;
    case 'psort': S.pf.sort = t.value; renderPostList(true); break;
    case 'cunr': S.cf.unreplied = t.checked; renderFeed(); break;
    case 'recat': {
      let c = null; for (const p of DB.posts) { c = p.comments.find(x => x.id === t.dataset.id); if (c) break; }
      if (!c) break; const old = c.cat, oldAuto = c.auto; c.cat = t.value; c.auto = false; t.style.borderColor = SE[t.value].c;
      try { await API.recat(c.id, t.value); toast('เปลี่ยนหมวดเป็น ' + SE[t.value].t); const row = t.closest('.cmt'); if (row) { row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash'); const tag = row.querySelector('.tag-auto'); if (tag) tag.textContent = 'แก้หมวดแล้ว'; } renderSide(); }
      catch (err) { c.cat = old; c.auto = oldAuto; t.value = old; t.style.borderColor = SE[old].c; handleErr(err); }
      break;
    }
    case 'atype': $('#vid-sec').classList.toggle('closed', !VIDEO.has(t.value)); break;
    case 'aplat': { const ty = $('#a-type'); if (!PTYPES[t.value].includes(ty.value)) { ty.value = PTYPES[t.value][0]; $('#vid-sec').classList.toggle('closed', !VIDEO.has(ty.value)); } break; }
    case 'aimg': { const f = t.files && t.files[0]; if (f) readImage(f); break; }
    case 'csv-file': { const fs = Array.from(t.files || []); if (fs.length) readFiles(fs); t.value = ''; break; }
    case 'page-metric': { const f = S.pimp.files.find(x => x.id === t.dataset.id); if (f) f.metric = t.value || null; renderCsv(false); break; }
    case 'page-pl': S.pimp.platform = t.value; renderCsv(false); break;
    case 'fb-pick': if (S.fbLogin) { S.fbLogin.pick = t.value; $$('.fb-page').forEach(l => l.classList.toggle('on', l.querySelector('input').checked)); } break;
    case 'csv-opt': S.csv[t.dataset.k] = t.value; renderCsv(false); break;
    case 'csv-flag': S.csv[t.dataset.k] = t.checked; renderCsv(false); break;
    case 'csv-map': S.csv.map[t.dataset.f] = t.value === '' ? '' : +t.value; renderCsv(false); break;
    case 'pcat-row': S.parsed[+t.dataset.i].cat = t.value; t.style.borderColor = SE[t.value].c; break;
    case 'prep': S.parsed[+t.dataset.i].replied = t.checked; break;
    case 'autosync': { t.disabled = true; try { DB.connections = await API.setAutoSync(t.checked); toast(t.checked ? 'เปิดอัปเดตอัตโนมัติทุกชั่วโมงแล้ว' : 'ปิดอัปเดตอัตโนมัติแล้ว'); } catch (err) { t.checked = !t.checked; handleErr(err); } t.disabled = false; renderView('none'); break; }
    case 'uplat': $('#u-fields').innerHTML = audFields(t.value); $('#u-fol').value = folAt(t.value, Date.now()) || ''; break;
    case 'pmenu': case 'pplat': {
      const u = DB.users.find(x => x.email === t.dataset.u); const key = k === 'pmenu' ? 'menus' : 'platforms';
      const arr = u[key].filter(x => x !== t.dataset.v); if (t.checked) arr.push(t.dataset.v);
      if (!arr.length) { t.checked = true; toast(k === 'pmenu' ? 'ต้องเหลืออย่างน้อย 1 เมนู' : 'ต้องเหลืออย่างน้อย 1 แพลตฟอร์ม', 'error'); break; }
      const order = k === 'pmenu' ? MENUS.map(m => m.k) : PKEYS; arr.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      t.disabled = true; saveUserPerm(u, { [key]: arr, role: 'กำหนดเอง' }); break;
    }
  }
});
function mergeFollowers(r) {
  (r.followers || []).forEach(f => { const d = sod(f.date); DB.followers = DB.followers.filter(x => !(x.platform === f.platform && x.source === 'api' && sod(x.date) === d)); DB.followers.push(f); });
  Object.keys(r.audience || {}).forEach(p => { DB.audience[p] = r.audience[p]; });
  if (r.connections) DB.connections = r.connections;
  buildFIdx();
}
function readImage(f) {
  if (!f.type.startsWith('image/')) { toast('เลือกไฟล์ภาพ JPG, PNG หรือ WEBP', 'error'); return; }
  const rd = new FileReader();
  rd.onload = () => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); const s = Math.min(1, 1200 / Math.max(img.width, img.height)); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); S.img = c.toDataURL('image/jpeg', .84); const drop = $('#drop'); if (drop) { drop.innerHTML = `<img src="${S.img}" alt="ภาพโพสต์ที่เลือก"><div><b>เปลี่ยนภาพ</b><div class="note">${esc(f.name)}</div></div>`; } toast('แนบภาพแล้ว'); }; img.src = rd.result; };
  rd.readAsDataURL(f);
}
const dropTarget = e => e.target.closest && e.target.closest('#drop, #csv-drop');
document.addEventListener('dragover', e => { const d = dropTarget(e); if (d) { e.preventDefault(); d.classList.add('drag'); } });
document.addEventListener('dragleave', e => { const d = dropTarget(e); if (d) d.classList.remove('drag'); });
document.addEventListener('drop', e => { const d = dropTarget(e); if (d) { e.preventDefault(); d.classList.remove('drag'); const fl = Array.from((e.dataTransfer && e.dataTransfer.files) || []); if (fl.length) { if (d.id === 'csv-drop') readFiles(fl); else readImage(fl[0]); } } });
let qt;
document.addEventListener('input', e => {
  const t = e.target, k = t.dataset.input; if (!k) return;
  if (k === 'page-fol' && S.pimp) S.pimp.followers = t.value;
  if (k === 'pq') { S.pf.q = t.value; clearTimeout(qt); qt = setTimeout(() => renderPostList(false), 120); }
  if (k === 'cq') { S.cf.q = t.value; clearTimeout(qt); qt = setTimeout(renderFeed, 150); }
  if (k === 'acap' && !S.editing && !S.catTouched) { const c = autoCategory(t.value); const sel = $('#a-cat'); if (sel && t.value.trim().length > 8) { sel.value = c; const h = $('#cat-hint'); if (h) h.textContent = 'ระบบแนะนำหมวด “' + CAT[c].t + '” จากข้อความ เปลี่ยนเองได้'; } }
  if (k === 'fx-link') { S.fx.link = t.value; const pl = $('#fx-pl'); if (pl) pl.innerHTML = fxPlIcon(t.value); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#modal.on')) { e.preventDefault(); modalClose(); return; } if (S.openPost) closeDrawer(); } });
window.addEventListener('beforeunload', e => { if (MODAL.locked) { e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target;
  if (f.id === 'f-email') return submitEmail($('#au-email').value);
  if (f.id === 'f-setup') return testSetup();
  if (f.id === 'f-fetch') {
    const link = $('#fx-link').value.trim();
    if (!/^https?:\/\/\S+\.\S+/.test(link) || !detectPl(link)) { const i = $('#fx-link').closest('.fetch-bar'); i.classList.remove('shake'); void i.offsetWidth; i.classList.add('shake'); toast('วางลิงก์โพสต์ Facebook, Instagram หรือ TikTok ที่ขึ้นต้นด้วย https://', 'error'); return; }
    return fxFetch({ link });
  }
  if (f.id === 'f-meta-login') { fbLoginStart(); return; }
  if (f.id === 'f-meta') {
    const err = $('#mt-err'); err.hidden = true;
    const payload = { appId: $('#mt-app').value.trim(), appSecret: $('#mt-sec').value.trim(), token: $('#mt-tok').value.trim(), pageId: $('#mt-page') ? $('#mt-page').value : undefined };
    if (!payload.token) { err.textContent = 'วาง Access Token จาก Graph API Explorer'; err.hidden = false; return; }
    if (!payload.appId && !((DB.connections || {}).metaApp || {}).appId) { err.textContent = 'ใส่ App ID และ App Secret ด้านบนด้วย เพื่อให้ระบบแลกเป็นโทเคนแบบไม่หมดอายุ'; err.hidden = false; return; }
    try {
      const r = await busy($('#mt-go'), () => API.connectMeta(payload));
      if (r.choose) { S.metaChoose = r.choose; const keep = { app: payload.appId, sec: payload.appSecret, tok: payload.token }; renderView('none'); $('#mt-app').value = keep.app; $('#mt-sec').value = keep.sec; $('#mt-tok').value = keep.tok; const alt = $('#meta-form details.alt'); if (alt) alt.open = true; toast('บัญชีนี้ดูแลหลายเพจ เลือกเพจของหน่วยงาน', 'info'); return; }
      DB.connections = r; S.connForm = null; S.metaChoose = null; renderSide(); renderView('none');
      toast(`เชื่อมต่อ ${r.fb.name || 'Facebook'}${r.ig.connected ? ' และ ' + r.ig.name : ''} แล้ว`);
      try { mergeFollowers(await API.syncFollowers()); renderView('none'); } catch (_) {}
    } catch (e2) { err.textContent = e2.message; err.hidden = false; }
    return;
  }
  if (f.id === 'f-tt') {
    const err = $('#tt-err'); err.hidden = true;
    const key = $('#tt-key').value.trim(), sec = $('#tt-sec').value.trim();
    if (!key || !sec) { err.textContent = 'ใส่ Client Key และ Client Secret'; err.hidden = false; return; }
    try { const r = await busy($('#tt-go'), () => API.connectTikTok({ clientKey: key, clientSecret: sec })); S.ttAuth = r.authUrl; renderView('none'); } catch (e2) { err.textContent = e2.message; err.hidden = false; }
    return;
  }
  if (f.classList.contains('reply-form')) {
    const id = f.dataset.id, text = ($('#rp-' + CSS.escape(id)) || {}).value || '';
    const fc = findComment(id); if (!fc) return;
    try { const c = await busy(f.querySelector('.btn.primary'), () => API.reply(id, text.trim())); fc.c.thread = c.thread; S.replyOpen = null; rerenderCmt(id); renderSide(); toast('บันทึกการตอบกลับแล้ว'); } catch (_) {}
    return;
  }
  if (f.id === 'f-otp') return submitOtp();
  if (f.id === 'add-user') {
    const em = $('#nu-email').value.trim().toLowerCase(), role = $('#nu-role').value, err = $('#nu-err');
    const bad = m => { err.textContent = m; err.hidden = false; const i = $('#nu-email'); i.classList.remove('shake'); void i.offsetWidth; i.classList.add('err', 'shake'); };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return bad('ใส่อีเมลให้ถูกรูปแบบ เช่น name.s@' + DOMAIN);
    if (!em.endsWith('@' + DOMAIN)) return bad(`เพิ่มได้เฉพาะอีเมล @${DOMAIN}`);
    if (DB.users.some(u => u.email === em)) return bad('อีเมลนี้มีอยู่ในระบบแล้ว');
    try { const u = await busy($('#nu-go'), () => API.addUser(em, role)); DB.users.push(u); localLog(`เพิ่มผู้ใช้ ${em} (${role})`); S.adminEdit = em; renderView('none'); toast('เพิ่ม ' + em + ' แล้ว'); } catch (_) {}
    return;
  }
  if (f.id === 'aud-form') {
    const p = $('#u-plat').value; const g = id => { const x = parseFloat($('#' + id).value); return isFinite(x) ? x / 100 : null; };
    const payload = { platform: p, asOf: parseISO($('#u-date').value || iso(TODAY)), followers: parseInt($('#u-fol').value, 10) || 0 };
    const gf = g('g-f'), gm = g('g-m'); if (gf != null && gm != null) payload.gender = { 'หญิง': gf, 'ชาย': gm, 'ไม่ระบุ': Math.max(0, +(1 - gf - gm).toFixed(4)) };
    const age = {}; AGES.forEach((k, i) => { const x = g('age-' + i); if (x != null) age[k] = x; }); if (Object.keys(age).length) payload.age = age;
    payload.newAud = g('u-new'); payload.followersShare = g('u-fo');
    [['country', 'm-country'], ['province', 'm-province'], ['city', 'm-city'], ['lang', 'm-lang']].forEach(([k, id]) => { const m = linesToMap($('#' + id).value); if (Object.keys(m).length) payload[k] = m; });
    try {
      const r = await busy($('#save-aud'), () => API.saveAudience(payload));
      DB.audience[p] = r.audience; if (r.follower) { DB.followers.push(r.follower); buildFIdx(); }
      localLog('บันทึกข้อมูลผู้ชม ' + PL[p].name); toast(`บันทึกข้อมูลผู้ชม ${PL[p].name} แล้ว`);
    } catch (_) {}
    return;
  }
  if (f.id === 'post-form') {
    const link = $('#a-link').value.trim(), cap = $('#a-cap').value.trim();
    const okLink = /^https?:\/\/\S+\.\S+/.test(link);
    $('#err-link').hidden = okLink; $('#a-link').classList.toggle('err', !okLink);
    $('#err-cap').hidden = !!cap; $('#a-cap').classList.toggle('err', !cap);
    if (!okLink || !cap) { const bad = okLink ? $('#a-cap') : $('#a-link'); bad.focus(); bad.classList.remove('shake'); void bad.offsetWidth; bad.classList.add('shake'); toast('กรอกข้อมูลที่จำเป็นให้ครบก่อนบันทึก', 'error'); return; }
    const num = id => { const el = $('#' + id); if (!el) return null; const x = parseFloat(el.value); return isFinite(x) ? x : null; };
    const type = $('#a-type').value, platform = $('#a-plat').value;
    const at = new Date($('#a-date').value).getTime() || Date.now();
    const m = {}; MROWS.forEach(([k]) => { const x = num('m-' + k); m[k] = x == null ? null : Math.round(x); });
    let v = null;
    if (VIDEO.has(type)) {
      const vv = {}; ['duration', 'videoViews', 'avgWatch', 'totalWatch', 's3', 's5', 's10', 'p25', 'p50', 'p75', 'p100'].forEach(k => vv[k] = num('v-' + k));
      if (vv.s3 == null) vv.s3 = vv.videoViews; if (vv.videoViews == null) vv.videoViews = vv.s3;
      if (vv.totalWatch == null && vv.videoViews != null && vv.avgWatch != null) vv.totalWatch = Math.round(vv.videoViews * vv.avgWatch);
      const cr = num('v-completion'); vv.completion = cr != null ? cr / 100 : (vv.s3 && vv.p100 != null ? vv.p100 / vv.s3 : null);
      if (Object.values(vv).some(x => x != null)) v = vv;
    }
    const post = { id: S.editing || undefined, platform, at, type, cat: $('#a-cat').value, caption: cap, link, m, v };
    const newComments = S.parsed.map(c => ({ author: c.author, text: c.text, cat: c.cat, auto: c.cat === autoCat(c.text), replied: c.replied }));
    try {
      const saved = await busy($('#save-post'), () => API.savePost({ post, newComments, image: S.img ? { dataUrl: S.img } : null }));
      saved.comments = saved.comments || []; saved.m = saved.m || {};
      const i = DB.posts.findIndex(p => p.id === saved.id); if (i >= 0) DB.posts[i] = saved; else DB.posts.push(saved);
      const was = !!S.editing; S.editing = null; S.parsed = []; S.img = null;
      localLog(`${was ? 'แก้ไข' : 'เพิ่ม'}โพสต์ ${PL[platform].name} · ${type}`);
      if (saved.at < range().from) S.f.period = 'all';
      S.pf = Object.assign(S.pf, { q: '', type: '', cat: '', sort: 'new' });
      go('posts'); setTimeout(() => openPost(saved.id), 350); toast(was ? 'บันทึกการแก้ไขลงฐานข้อมูลแล้ว' : (API.demo ? 'บันทึกโพสต์แล้ว (โหมดสาธิต)' : 'บันทึกโพสต์ลงฐานข้อมูลแล้ว'));
    } catch (_) {}
  }
});

/* ================= boot ================= */
async function boot() {
  applyTheme();
  if (!window.API) { showSetup(); return; }
  if (API.hasToken()) {
    renderSkeleton();
    try { const d = await API.bootstrap(); load(d); startApp(); }
    catch (e) {
      if (e.code === 'unauthorized' || e.code === 'forbidden') { showAuth(); return; }
      root().innerHTML = `<div class="fatal"><div class="fatal-card"><h2>เชื่อมต่อข้อมูลไม่สำเร็จ</h2><p class="muted">${esc(e.message)}</p><div style="display:flex;gap:8px"><button class="btn primary" onclick="location.reload()">ลองอีกครั้ง</button><button class="btn" id="to-login">เข้าสู่ระบบใหม่</button></div></div></div>`;
      $('#to-login').onclick = () => { try { localStorage.removeItem('psi_token'); } catch (_) {} showAuth(); };
    }
  } else showAuth();
}
boot();
})();
