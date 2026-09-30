/* PR Social Insight — หน้าเว็บหลัก */
(function () {
"use strict";
const CFG = window.APP_CONFIG || {}, DOMAIN = CFG.DOMAIN || 'cmu.ac.th', API = window.API || {};
const APP_NAME = CFG.APP_NAME || 'PR Social Insight';
/* การเคลื่อนไหว: เปิดเสมอ (แม้ Windows/มือถือตั้ง “ลดภาพเคลื่อนไหว”) — ผู้ใช้ปิดเองได้จากปุ่มในแถบเมนู */
const RM = () => document.documentElement.classList.contains('rm');
(function () { let v = null; try { v = localStorage.getItem('psi_rm'); } catch (_) {} document.documentElement.classList.toggle('rm', v === '1'); })();
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
const PL = { fb: { name: 'Facebook', short: 'FB', c: 'var(--fb)' }, ig: { name: 'Instagram', short: 'IG', c: 'var(--ig)' }, tt: { name: 'TikTok', short: 'TT', c: 'var(--tt)' }, line: { name: 'LINE OA', short: 'LN', c: 'var(--lineoa)' }, x: { name: 'X', short: 'X', c: 'var(--xpl)' } };
const PKEYS = ['fb', 'ig', 'tt', 'line', 'x'];
const TYPES = ['Photo', 'Album', 'Reel', 'Short Video', 'Long Video', 'Story', 'Infographic', 'Announcement', 'Live', 'Link Post', 'Broadcast', 'Rich Message', 'Card Message', 'Text Post', 'Thread'];
/* ชื่อตัวชี้วัดตามแพลตฟอร์ม (LINE และ X นับคนละแบบกับ Facebook) */
const ML_BASE = { reach: 'Reach', impressions: 'Impressions / Views', reactions: 'Likes / Reactions', comments: 'Comments', shares: 'Shares', saves: 'Saves', clicks: 'Clicks', profileVisits: 'Profile Visits', newFollowers: 'New Followers', linkClicks: 'Link Clicks' };
const ML_PL = {
  line: { reach: 'ส่งถึง (Delivered)', impressions: 'เปิดอ่าน (Unique opens)', clicks: 'คนที่คลิก (Unique clicks)', linkClicks: 'คลิกลิงก์ทั้งหมด', newFollowers: 'เพื่อนใหม่จากข้อความนี้' },
  x: { impressions: 'Impressions', reactions: 'Likes', comments: 'Replies', shares: 'Reposts + Quotes', saves: 'Bookmarks', profileVisits: 'Profile clicks', linkClicks: 'Link clicks' }
};
// ตัวชี้วัดที่แพลตฟอร์มนั้นมีจริง (ใช้บอกว่า “ไม่มีข้อมูล” เฉพาะช่องที่เกี่ยวข้อง)
const MREL = { line: ['reach', 'impressions', 'clicks', 'linkClicks', 'newFollowers'], x: ['impressions', 'reactions', 'comments', 'shares', 'saves', 'linkClicks', 'profileVisits'] };
const ML = (p, k) => (ML_PL[p] && ML_PL[p][k]) || ML_BASE[k] || k;
const VIDEO = new Set(['Reel', 'Short Video', 'Long Video', 'Story', 'Live']);
const PTYPES = { fb: ['Photo', 'Album', 'Reel', 'Long Video', 'Story', 'Infographic', 'Announcement', 'Live', 'Link Post'], ig: ['Photo', 'Album', 'Reel', 'Story', 'Infographic', 'Announcement', 'Live'], tt: ['Short Video', 'Long Video', 'Photo', 'Story', 'Live'], line: ['Broadcast', 'Rich Message', 'Card Message', 'Photo', 'Short Video', 'Link Post', 'Announcement'], x: ['Text Post', 'Photo', 'Album', 'Short Video', 'Long Video', 'Thread', 'Link Post', 'Live'] };
const CATS = [{ k: 'news', t: 'ข่าวประชาสัมพันธ์', c: '#3d5a80' }, { k: 'knowledge', t: 'Knowledge', c: '#2f7d6d' }, { k: 'ent', t: 'Entertainment', c: '#b0476e' }, { k: 'promo', t: 'Promotion', c: '#b8621c' }, { k: 'event', t: 'Event', c: '#6a4c93' }, { k: 'bts', t: 'Behind the scenes', c: '#4f5d75' }, { k: 'ugc', t: 'User Generated Content', c: '#6f7d2f' }, { k: 'engage', t: 'Engagement Post', c: '#b8473a' }, { k: 'edu', t: 'Educational', c: '#1f6f9c' }];
const CAT = Object.fromEntries(CATS.map(c => [c.k, c]));
const SENT = [{ k: 'pos', t: 'Positive', th: 'เชิงบวก', c: 'var(--s-pos)' }, { k: 'neu', t: 'Neutral', th: 'ทั่วไป', c: 'var(--s-neu)' }, { k: 'neg', t: 'Negative', th: 'เชิงลบ', c: 'var(--s-neg)' }, { k: 'q', t: 'Question', th: 'คำถาม', c: 'var(--s-q)' }, { k: 'cmp', t: 'Complaint', th: 'ร้องเรียน', c: 'var(--s-cmp)' }, { k: 'int', t: 'Interested', th: 'สนใจ', c: 'var(--s-int)' }, { k: 'buy', t: 'Purchase intent', th: 'ตั้งใจซื้อ', c: 'var(--s-buy)' }];
const SE = Object.fromEntries(SENT.map(s => [s.k, s]));
const MENUS = [{ k: 'dashboard', t: 'ภาพรวม', sub: 'Overview' }, { k: 'posts', t: 'คอนเทนต์', sub: 'Content' }, { k: 'comments', t: 'ความคิดเห็น', sub: 'Conversations' }, { k: 'audience', t: 'ผู้ติดตาม', sub: 'Audience' }, { k: 'strategy', t: 'วิเคราะห์เชิงกลยุทธ์', sub: 'Strategic insight' }, { k: 'add', t: 'เพิ่มคอนเทนต์', sub: 'Add content' }, { k: 'admin', t: 'ทีมและสิทธิ์', sub: 'Team & access' }];
const PAGES = MENUS.concat([{ k: 'connect', t: 'เชื่อมต่อบัญชี', sub: 'Integrations' }]);
const NAV_GROUPS = [['วิเคราะห์', ['dashboard', 'posts', 'comments', 'audience', 'strategy']], ['จัดการ', ['add', 'connect', 'admin']]];
const ROLES = { 'Super Admin': { menus: MENUS.map(m => m.k), platforms: PKEYS }, 'Editor': { menus: ['dashboard', 'posts', 'comments', 'audience', 'strategy', 'add'], platforms: PKEYS }, 'Analyst': { menus: ['dashboard', 'posts', 'comments', 'audience', 'strategy'], platforms: PKEYS }, 'Viewer': { menus: ['dashboard'], platforms: PKEYS } };
const AGES = ['13–17', '18–24', '25–34', '35–44', '45–54', '55+'];

const ICON = {
  alert: '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  snow: '<path d="M12 2v20M4.9 6l14.2 12M4.9 18 19.1 6"/><path d="m9.5 3.5 2.5 2 2.5-2M9.5 20.5l2.5-2 2.5 2M3.3 9.6l3.1.8-.9 3M20.7 14.4l-3.1-.8.9-3M3.3 14.4l3.1-.8-.9-3M20.7 9.6l-3.1.8.9 3"/>',
  strategy: '<path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6a6 6 0 1 0 6 6"/><circle cx="12" cy="12" r="2"/><path d="m13.5 10.5 7-7M17 3.5h3.5V7"/>',
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
  fx: { link: '', cat: 'news' }, fbLogin: null, xLogin: null, pimp: null, pdm: 'views', recent: {}, recentPl: null, connForm: null, metaChoose: null, ttAuth: null, confirmDisc: null, prefill: null
};
const root = () => $('#root');
const me = () => (S.acting ? DB.users.find(u => u.email === S.acting) : ME) || ME;
const can = m => { const u = me(); if (!u) return false; if (m === 'connect') return u.menus.includes('admin'); return u.menus.includes(m); };
const allowedP = () => { const u = me(); return u ? PKEYS.filter(p => u.platforms.includes(p) && (!ME || ME.platforms.includes(p))) : []; };
const activeP = () => { const a = allowedP(); return S.f.platform === 'all' ? a : a.filter(p => p === S.f.platform); };
const localLog = what => DB.logs.unshift({ at: Date.now(), who: ME.email, what });

function load(d) {
  ME = d.user;
  DB = { posts: d.posts || [], audience: d.audience || {}, followers: d.followers || [], daily: (d.daily || []).map(withT), users: d.users || [], logs: d.logs || [], sheetUrl: d.sheetUrl || '', connections: d.connections || {}, settings: d.settings || {}, loadedAt: Date.now() };
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
  // เลือกปีปฏิทิน / เดือนปฏิทิน จากแถบด้านล่างตัวกรอง — ช่วงก่อนหน้าคือปี/เดือนก่อนหน้า (ยาวเท่ากัน ถ้าเป็นปี/เดือนปัจจุบันเทียบถึงวันเดียวกัน)
  const pk = S.f.pick;
  if (pk && ((p === 'year' && pk.y != null && pk.m == null) || (p === 'month' && pk.y != null && pk.m != null))) {
    const Y = pk.y, M = pk.m;
    from = p === 'year' ? new Date(Y, 0, 1).getTime() : new Date(Y, M, 1).getTime();
    const full = p === 'year' ? new Date(Y + 1, 0, 1).getTime() : new Date(Y, M + 1, 1).getTime();
    to = Math.min(full, end); if (to <= from) to = from + DAY;
    const pf = p === 'year' ? new Date(Y - 1, 0, 1).getTime() : new Date(Y, M - 1, 1).getTime();
    return { from, to, pf, pt: Math.min(from, pf + (to - from)), hasPrev: true, cal: p };
  }
  const len = to - from; return { from, to, pf: from - len, pt: from, hasPrev: p !== 'all' };
}
function rangeText(r) { const a = fdate(r.from), b = fdate(r.to - 1); return a === b ? a : `${fds(r.from)} – ${b}`; }
const postsOf = ps => DB.posts.filter(x => ps.includes(x.platform));
const postsIn = (from, to, ps = activeP()) => DB.posts.filter(x => ps.includes(x.platform) && x.at >= from && x.at < to);
const eng = m => n0(m.reactions) + n0(m.comments) + n0(m.shares) + n0(m.saves);
// LINE OA ไม่มีถูกใจ/แชร์ ใช้จำนวนคนที่คลิกเป็นการมีส่วนร่วมแทน
const engP = p => p.platform === 'line' ? n0(p.m.clicks) : eng(p.m);
function agg(list) {
  const a = { n: list.length, reach: 0, impressions: 0, reactions: 0, comments: 0, shares: 0, saves: 0, clicks: 0, profileVisits: 0, newFollowers: 0, linkClicks: 0, videoViews: 0, eng: 0 };
  list.forEach(p => { for (const k in p.m) if (k in a) a[k] += n0(p.m[k]); a.eng += engP(p); if (p.v) a.videoViews += n0(p.v.videoViews); });
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
  const shape = 'L' + cfg.labels.length + '/' + cfg.series.length + '/' + W, mo = TWEEN && el._shape === shape && !!el.querySelector('svg');
  if (mo) animate = false; else if (TWEEN) animate = 'soft';
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
  const html = `<svg width="${W}" height="${H}" role="img" aria-label="${esc(cfg.aria || 'กราฟแนวโน้ม')}"><defs>${defs}</defs>${g}</svg><div class="tip"></div>`;
  if (mo) { morph(el, html); el.classList.remove('mx-tw'); void el.offsetWidth; el.classList.add('mx-tw'); } else el.innerHTML = html; el._shape = shape;
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), xh = svg.querySelector('.xh'); let hit = svg.querySelector('.hit'); if (mo) { const h2 = hit.cloneNode(true); hit.replaceWith(h2); hit = h2; }
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
function mountChart(id, cfg, animate) {
  const el = document.getElementById(id); if (!el) return;
  const old = charts.find(c => c.el === el), sig = JSON.stringify(cfg);
  if (SILENT) { if (old && old.sig === sig && el.firstChild) return; animate = false; }
  else if (TWEEN && old && old.sig === sig && el.firstChild) return;
  charts = charts.filter(c => c.el !== el); charts.push({ el, cfg, sig }); drawChart(el, cfg, animate);
}
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
  return `<div class="empty-state"><div class="es-art" aria-hidden="true"><span class="es-snow s1">❄</span><span class="es-snow s2">❄</span><span class="es-mound"></span>${peng('es-peng', 84)}</div><b>${title}</b><p>${text}</p>${action ? `<div class="btns">${action}</div>` : ''}</div>`;
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
  const shape = 'B' + cfg.labels.length + '/' + cfg.series.length + '/' + W, mo = TWEEN && el._shape === shape && !!el.querySelector('svg');
  if (mo) animate = false; else if (TWEEN) animate = 'soft';
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
  const html = `<svg width="${W}" height="${H}" role="img" aria-label="${esc(cfg.aria || 'กราฟแท่ง')}">${g}</svg><div class="tip"></div>`;
  if (mo) { morph(el, html); el.classList.remove('mx-tw'); void el.offsetWidth; el.classList.add('mx-tw'); } else el.innerHTML = html; el._shape = shape;
  const svg = el.querySelector('svg'), tip = el.querySelector('.tip'), hl = svg.querySelector('.vhl'); let hit = svg.querySelector('.hit'); if (mo) { const h2 = hit.cloneNode(true); hit.replaceWith(h2); hit = h2; }
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
  list.forEach(p => { const d = new Date(p.at); const di = (d.getDay() + 6) % 7, h = d.getHours(); const bi = blocks.findIndex(b => h >= b[0] && h < b[1]); if (bi < 0) return; const c = cell[di][bi]; c.n++; c.e += engP(p); c.r += n0(p.m.reach); });
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
/* ตัวเลขวิ่งจาก 0 ขึ้นไปยังค่าจริงทุกครั้งที่ตัวเลขถูกแสดงใหม่ — เร็วตอนต้น แล้วค่อยๆ ชะลอเมื่อใกล้ถึง */
const NUM_SEL = '.bv, .donut-legend b, .plat-stats b, .pc-n, .tc-stats span, .stat b, .m-stat b, .pf-big, .conn-meta b, .react small, .ct-n, td.num, .metric-grid b, .pc-mid .big, .num-cu, .pf-mid .pf-big';
const CU_SKIP = '.m-prog, #dp, input, select, textarea, [contenteditable], .no-cu';
const cuEase = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k) * (1 - k * .15);   // ease-out แบบเอ็กซ์โพเนนเชียล ชะลอนุ่มช่วงท้าย
function countUp(scope) {
  if (!scope || !scope.isConnected) return;
  if (RM()) return;
  const fmt = (el, v) => { const f = el.dataset.fmt; return f === 'pct' ? pct(v, +el.dataset.dec || 0) : f === 'n' ? fnum(v) : fk(v); };
  const pickAll = sel => { const l = $$(sel, scope); if (scope.matches && scope.matches(sel)) l.unshift(scope); return l.filter(el => !el._cu && !el.closest(CU_SKIP)); };
  const items = pickAll('[data-count]').map(el => ({ el, b: +el.dataset.count, f: v => fmt(el, v) })).filter(x => isFinite(x.b) && x.b !== 0);
  // ตัวเลขที่เป็นข้อความธรรมดา: ดึงตัวเลขตัวแรกออกมาวิ่ง แล้วคงหน่วย / ทศนิยม / คอมมาเดิมไว้
  pickAll(NUM_SEL).slice(0, 500).forEach(el => {
    if (el.querySelector('[data-count]') || el.children.length > 2 || el.closest('[data-count]')) return;
    const node = [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue)); if (!node) return;
    const txt = node.nodeValue, m = txt.match(/-?\d[\d,]*(\.\d+)?/); if (!m) return;
    const b = parseFloat(m[0].replace(/,/g, '')); if (!isFinite(b) || b === 0) return;
    if (/\d{1,2}:\d{2}|[ก-ฮ]\.[ก-ฮ]\./.test(txt)) return; // ข้ามเวลาและวันที่
    const dec = m[1] ? m[1].length - 1 : 0, comma = /,/.test(m[0]) || (b >= 1000 && dec === 0);
    const pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length);
    const f = v => pre + (comma ? v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v.toFixed(dec)) + post;
    items.push({ el, node, b, f, text: true, fin: txt });
  });
  if (!items.length) return;
  const tok = {}; const set = (x, v) => { const s2 = x.f(v); if (x.text) x.node.nodeValue = s2; else x.el.textContent = s2; };
  items.forEach(x => { x.el._cu = tok; set(x, 0); x.el.classList.add('cu'); x.el.classList.remove('cu-done'); });
  const D = Math.min(1900, 1150 + Math.log10(1 + Math.max(...items.map(x => Math.abs(x.b)))) * 90);
  const t0 = performance.now();
  const tick = t => {
    const k = Math.min(1, (t - t0) / D), e = cuEase(k); let alive = false;
    items.forEach(x => { if (x.el._cu !== tok) return; alive = true; set(x, x.b * e); });
    if (k < 1 && alive) requestAnimationFrame(tick);
    else items.forEach(x => { if (x.el._cu !== tok) return; if (x.text) x.node.nodeValue = x.fin; else set(x, x.b); x.el._cu = null; x.el.classList.remove('cu'); void x.el.offsetWidth; x.el.classList.add('cu-done'); });
  };
  requestAnimationFrame(tick);
}
/* เฝ้าดูทุกครั้งที่มีตัวเลขใหม่ถูกวาดบนหน้า (สลับหน้า ตัวกรอง แท็บ ลิ้นชักโพสต์ ป๊อปอัป) แล้วเล่นแอนิเมชันให้อัตโนมัติ */
const CU_Q = { set: new Set(), raf: 0 };
const cuObs = new MutationObserver(ms => {
  ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1 && !n._silent) CU_Q.set.add(n); }));
  if (!CU_Q.raf && CU_Q.set.size) CU_Q.raf = requestAnimationFrame(() => { CU_Q.raf = 0; const list = [...CU_Q.set]; CU_Q.set.clear(); list.filter(n => !list.some(o => o !== n && o.contains(n))).forEach(n => countUp(n)); });
});
if (document.body) cuObs.observe(document.body, { childList: true, subtree: true });
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
  if (e && e.code === 'replaced') { if (ME) sessKicked({}); return; }
  if (e && e.code === 'idle') { if (ME) lockIdle(idleLast()); return; }
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
  closeDrawer(); ME = null; S.acting = null; clearInterval(SESS.timer); clearInterval(LIVE.timer); clearInterval(AD.tick); AD.lk = null;
  const r = root();
  const card = `<section class="auth-card al-card" id="al-card">${PENG_PEEK}
      <div class="al-brand">${brandMark()}<div><b>${esc(APP_NAME)}</b><small>${esc(CFG.ORG_NAME || 'Public Relations')} · Social Analytics</small></div></div>
      <ol class="stepper" aria-label="ขั้นตอนเข้าสู่ระบบ"><li data-s="1"><span>1</span><em class="lbl">อีเมล</em></li><li class="bar" data-b="1" aria-hidden="true"></li><li data-s="2"><span>2</span><em class="lbl">ยืนยันรหัส</em></li><li class="bar" data-b="2" aria-hidden="true"></li><li data-s="3"><span>3</span><em class="lbl">ตรวจสอบสิทธิ์</em></li></ol>
      <div id="step-host" aria-live="polite"></div>
      <div class="auth-foot">${ic('lock', 15)}<span>ใช้ได้เฉพาะอีเมล <b class="mono">@${esc(DOMAIN)}</b> · ผู้ใช้ใหม่จะถูกส่งคำขอสิทธิ์ถึงแอดมินโดยอัตโนมัติ</span></div>
    </section>`;
  const scene = $('#ad');
  // มาจากหน้า Access Denied: ฉากหิมะและฝูงเพนกวินวิ่งต่อเนื่อง เปลี่ยนแค่เนื้อหาตรงกลางเป็นกรอบเข้าสู่ระบบ
  if (scene && AD.cv && AD.cv.isConnected) {
    const old = $$('.ad-top, .ad-card', scene); old.forEach(x => x.classList.add('ad-out'));
    setTimeout(() => { old.forEach(x => x.remove()); scene.classList.add('ad-login'); scene.setAttribute('aria-label', 'เข้าสู่ระบบ'); AD.cv.insertAdjacentHTML('afterend', card); const f = $('.ad-flock', scene); if (f) f.innerHTML = adFlockTxt(); setStep(1, stepEmail()); }, 360);
    return;
  }
  const paint = () => {
    adStop();
    r.innerHTML = `<div class="ad ad-login" id="ad" aria-label="เข้าสู่ระบบ">${adStars()}<canvas class="ad-cv" id="ad-cv" aria-label="ฝูงเพนกวินเล่นหิมะ แตะเพื่อให้วิ่งหนี"></canvas>${card}<p class="ad-flock">${adFlockTxt()}</p></div>`;
    adScene(Date.now() - 20000);
    setStep(1, stepEmail());
  };
  const app = $('.app', r);
  if (app) { app.style.transition = 'opacity .3s'; app.style.opacity = 0; setTimeout(paint, 280); } else paint();
}
const adFlockTxt = () => `${peng('', 20)} เพนกวินมารอต้อนรับ <b id="ad-n">${AD.ps.length || 0}</b> ตัว <small>· แตะแล้วน้องจะวิ่งหนี</small>`;
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
  const nt = A.notice; A.notice = '';
  return `${nt ? `<div class="callout ${A.noticeWarn ? 'warn' : ''} auth-notice" role="alert">${ic('lock', 16)}<div>${esc(nt)}</div></div>` : ''}<h2>ขอสิทธิ์เข้าใช้งาน</h2>
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
   <ul class="checks">${[['ck1', `อีเมลอยู่ในโดเมน @${DOMAIN}`], ['ck2', 'ยืนยันรหัส OTP'], ['ck3', 'ตรวจสอบสิทธิ์การเข้าใช้งาน']].map(([id, t]) => `<li id="${id}"><span class="ci"></span>${t}</li>`).join('')}</ul>`;
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
    mark('ck3', 'ok');
    const st3 = $('.stepper li[data-s="3"]'); if (st3) { st3.classList.remove('on'); st3.classList.add('done'); st3.querySelector('span').innerHTML = ic('check', 13); }
    await wait(750);
    // ผ่านการตรวจสิทธิ์แล้ว → เปิดหน้าต่างโหลดข้อมูลเต็มจอ แล้วค่อยเข้าแดชบอร์ด
    const L = loaderShow(); L.at(4, 88);
    let d; try { d = await API.bootstrap(); } catch (e) { L.fail(); verifying = false; handleErr(e); setStep(1, stepEmail()); return; }
    L.at(92, 97); load(d); await L.done(2600);
    verifying = false; S.page = 'dashboard'; startApp(); L.close();
    toast(`เข้าสู่ระบบแล้ว · ${ME.email}`);
  } catch (e) { verifying = false; handleErr(e); }
}

/* =====================================================================
   APP SHELL
   ===================================================================== */
/* ================= ตรวจการเข้าสู่ระบบซ้อน (ทุก 5 วินาที) =================
   บัญชีเดียวใช้ได้ทีละอุปกรณ์/เบราว์เซอร์ — ถ้ามีการเข้าสู่ระบบจากที่อื่น แจ้งเตือนแบบป๊อปอัป นับถอยหลัง 10 วินาที แล้วออกจากระบบ */
const SESS = { timer: 0, shown: false, cd: 0 };
function sessStart() { clearInterval(SESS.timer); SESS.shown = false; if (API && API.sessionCheck) SESS.timer = setInterval(sessTick, 5000); }
async function sessTick() {
  if (!ME || SESS.shown || !API.sessionCheck) return;
  try { const r = await API.sessionCheck(idleActive()); if (r && r.status === 'replaced' && ME) sessKicked(r); else if (r && r.status === 'idle' && ME) lockIdle(r.last || idleLast()); }
  catch (e) { if (e && e.code === 'replaced') sessKicked({}); else if (e && e.code === 'idle' && ME) lockIdle(idleLast()); }
}
function sessKicked(info) {
  if (SESS.shown) return; SESS.shown = true; clearInterval(SESS.timer); clearInterval(LIVE.timer);
  dpClose(); if (KPOP.key) kpopClose(); if (S.openPost) closeDrawer();
  const at = info && info.at ? new Date(info.at) : new Date(), N = 10;
  MODAL.kick = true;
  modalOpen(`<div class="kick" style="--n:${N}s">
    <div class="kick-top">${peng('kick-peng', 76)}<div class="kick-ring" role="timer" aria-live="off"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" class="kr-bg"/><circle cx="32" cy="32" r="28" class="kr-fg" pathLength="100"/></svg><b id="kick-n">${N}</b><small>วินาที</small></div></div>
    <span class="kick-tag">${ic('lock', 13)} แจ้งเตือนความปลอดภัย</span>
    <h2 id="modal-title">มีการลงชื่อเข้าใช้งานใหม่<br>ในอุปกรณ์หรือ Browser อื่น</h2>
    <p class="kick-txt">จำเป็นต้องนำท่านออกจากระบบ หากท่านไม่ได้ดำเนินการ โปรดติดต่อ Admin เพื่อป้องกันข้อมูลสำคัญของหน่วยงาน</p>
    <div class="kick-dev">${ic('eye', 14)}<span>อุปกรณ์ใหม่: <b>${esc(info && info.device || 'อุปกรณ์หรือเบราว์เซอร์อื่น')}</b> · <span style="white-space:nowrap">${at.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</span></span></div>
    <p class="kick-count" aria-live="polite">ระบบจะออกจากระบบอัตโนมัติใน <b id="kick-s">${N}</b> วินาที</p>
    <div class="kick-bar"><span></span></div>
    <div class="kick-acts"><button class="btn" data-act="kick-report">${ic('alert', 15)} ไม่ใช่ฉัน — แจ้ง Admin</button><button class="btn primary" data-act="kick-ok" data-focus>${ic('check', 15)} ใช่, ฉันเข้าสู่ระบบเอง</button></div>
  </div>`, { locked: true });
  let left = N;
  SESS.cd = setInterval(() => { left--; const a = $('#kick-n'), b = $('#kick-s'); if (a) a.textContent = Math.max(0, left); if (b) b.textContent = Math.max(0, left); if (left <= 0) kickOut('auto'); }, 1000);
}
async function kickOut(why, btn) {
  if (!SESS.shown) return; clearInterval(SESS.cd);
  if (btn) { btn.classList.add('loading'); $$('.kick-acts .btn').forEach(b => b.disabled = true); }
  if (why === 'report') { try { await API.sessionReport(); } catch (_) {} }
  try { await API.logout(); } catch (_) {}
  MODAL.kick = false; modalClose(true); SESS.shown = false;
  A.notice = why === 'report' ? 'แจ้ง Admin เรียบร้อยแล้ว — ออกจากระบบแล้ว เพื่อความปลอดภัยแนะนำให้เข้าสู่ระบบใหม่ทันที (ระบบจะตัดการใช้งานจากอุปกรณ์อื่นออก) และติดต่อ Admin'
    : 'ออกจากระบบแล้ว เนื่องจากบัญชีนี้เข้าสู่ระบบจากอุปกรณ์หรือ Browser อื่น';
  A.noticeWarn = why === 'report';
  showAuth();
}
/* ================= ไม่มีการใช้งานเกิน 30 นาที → ออกจากระบบ + หน้า Access Denied =================
   นับการขยับเมาส์ / แตะ / พิมพ์ / เลื่อนหน้า (ใช้ร่วมกันทุกแท็บของเบราว์เซอร์เดียวกัน) ตรวจทุก 5 วินาที และตรวจทันทีเมื่อกลับมาที่แท็บ */
const IDLE = { last: Date.now(), timer: 0, ping: 0 };
/** นาทีที่ตั้งไว้: ค่าที่แอดมินตั้งในเมนู “ทีมและสิทธิ์” (เก็บในฐานข้อมูล) > config.js > 30 นาที · 0 = ปิด */
function idleMin() { const st = DB && DB.settings; const v = st && st.idleMinutes != null ? +st.idleMinutes : CFG.IDLE_MINUTES != null ? +CFG.IDLE_MINUTES : 30; return isFinite(v) && v > 0 ? v : 0; }
const idleMsNow = () => { const m = idleMin(); return m ? Math.max(.05, m) * 60e3 : 0; };
const idleGet = k => { try { return localStorage.getItem(k); } catch (_) { return null; } };
const idleSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (_) {} };
function idleMark() { const n = Date.now(); if (n - IDLE.last > 1500) { IDLE.last = n; idleSet('psi_act', String(n)); } }
['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(ev => window.addEventListener(ev, idleMark, { passive: true, capture: true }));
function idleLast() { return Math.max(IDLE.last, +idleGet('psi_act') || 0); }
function idleStart() { IDLE.last = Date.now(); idleSet('psi_act', String(IDLE.last)); IDLE.ping = IDLE.last; clearInterval(IDLE.timer); IDLE.timer = setInterval(idleCheck, 5000); }
function idleCheck() {
  if (!ME || !idleMsNow()) return;
  if (MODAL.locked && !MODAL.kick) { idleMark(); return; }               // กำลังนำเข้าไฟล์อยู่ ไม่นับว่าไม่ได้ใช้งาน
  const last = idleLast(); if (Date.now() - last >= idleMsNow()) lockIdle(last);
}
/** มีการใช้งานตั้งแต่ส่งสัญญาณครั้งก่อนไหม (ส่งให้ระบบหลังบ้านบันทึก lastActive) */
function idleActive() { const l = idleLast(), a = l > IDLE.ping; if (a) IDLE.ping = l; return a; }
document.addEventListener('visibilitychange', () => { if (!document.hidden) idleCheck(); });
window.addEventListener('storage', e => { if (e.key === 'psi_locked' && e.newValue && ME) { try { lockIdle(JSON.parse(e.newValue).at, true); } catch (_) {} } });
async function lockIdle(last, fromOther) {
  if (!ME && !fromOther) return;
  const email = ME ? ME.email : '';
  clearInterval(IDLE.timer); clearInterval(SESS.timer); clearInterval(LIVE.timer); clearInterval(SESS.cd); SESS.shown = false;
  dpClose(); if (KPOP.key) kpopClose(); if (S.openPost) closeDrawer(); MODAL.kick = false; modalClose(true);
  const lk = { at: last || Date.now() - idleMsNow(), email, lockedAt: Date.now(), min: idleMin() || 30 };
  if (!fromOther) idleSet('psi_locked', JSON.stringify(lk));
  ME = null; S.acting = null;
  showDenied(lk);
  try { await API.logout(); } catch (_) {}
}
const AD_ART = `<svg class="ad-art" viewBox="0 0 560 250" aria-hidden="true" focusable="false">
  <defs><radialGradient id="ad-moon" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e9e3ff"/></radialGradient>
  <linearGradient id="ad-mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1680"/><stop offset="1" stop-color="#26095c"/></linearGradient></defs>
  <circle class="ad-glow" cx="282" cy="92" r="104" fill="#b99cff" opacity=".16"/>
  <circle cx="282" cy="92" r="84" fill="url(#ad-moon)"/>
  <g class="ad-cl c1" fill="#5b2bb0" opacity=".7"><ellipse cx="110" cy="190" rx="60" ry="16"/><circle cx="92" cy="182" r="18"/><circle cx="122" cy="176" r="24"/></g>
  <path d="M60 222 L128 96 L160 150 L182 124 L246 222Z" fill="url(#ad-mt)" stroke="#6d3fd0" stroke-width="1.4"/>
  <path d="M128 96 L110 130 L122 124 L132 136 L142 118 Z" fill="#fff"/>
  <path d="M300 222 L386 108 L470 222Z" fill="url(#ad-mt)" stroke="#6d3fd0" stroke-width="1.4"/>
  <path d="M386 108 L366 136 L378 132 L388 144 L398 132 L406 136Z" fill="#fff"/>
  <path d="M170 230 L282 72 L394 230Z" fill="#2c0d6b" stroke="#7a4be0" stroke-width="1.6"/>
  <path d="M234 140 L282 72 L330 140 L306 128 L282 146 L258 128Z" fill="#fff"/>
  <path d="M234 140 L258 128 L282 146 L306 128 L330 140" fill="none" stroke="#e8699a" stroke-width="3" stroke-linejoin="round"/>
  <g class="ad-cl c2" fill="#6a36c9" opacity=".85"><ellipse cx="300" cy="228" rx="120" ry="18"/><circle cx="240" cy="218" r="22"/><circle cx="286" cy="206" r="30"/><circle cx="340" cy="214" r="24"/></g>
  <g class="ad-cl c3" fill="#5b2bb0" opacity=".7"><ellipse cx="470" cy="196" rx="64" ry="15"/><circle cx="452" cy="188" r="18"/><circle cx="484" cy="182" r="22"/></g>
  <g class="ad-fl" fill="#fff"><path d="M60 60l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" opacity=".8"/><path d="M500 50l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" opacity=".7"/><path d="M430 26l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" opacity=".6"/></g>
</svg>`;
/* ---------------- หน้า Access Denied: วาดทั้งฉากบน canvas เดียว (ลื่น 60fps ไม่ขึ้นกับการตั้งค่าลดภาพเคลื่อนไหวของเครื่อง) ----------------
   ฉาก: ดวงจันทร์/ภูเขา (DOM) · เนินหิมะ 3 ชั้นมีต้นสนและประกายระยิบ · หิมะ 3 ระดับความลึก (นุ่ม ไม่แข็ง) · ฝูงเพนกวินที่ใช้ชีวิตเอง */
const AD = { raf: 0, ps: [], fx: [], snow: [], W: 0, H: 0, gTop: 0, gH: 0, dpr: 1, ctx: null, cv: null, ground: null, flake: [], last: 0, spawnT: 0, lk: null, tick: 0, max: 40, kinds: {}, img: {}, ready: false, ft: [], q: 1, glints: [] };
function adSprites() {
  if (AD.ready || AD.loading) return; AD.loading = true;
  const base = PENG_G.replace(/<ellipse class="pg-sh"[^>]*\/>/, '');
  const flip = (g, a, b) => g.replace(/(<path class="pg-fl pg-fl-l"[^>]*\/>)/, `<g transform="rotate(${a} 21 42)">$1</g>`).replace(/(<path class="pg-fl pg-fl-r"[^>]*\/>)/, `<g transform="rotate(${b} 59 42)">$1</g>`);
  const blink = g => g.replace(/<g class="pg-eyes">[\s\S]*?<\/g>/, '<g><path d="M31.4 30.2q2.6 2 5.2 0M43.4 30.2q2.6 2 5.2 0" fill="none" stroke="#1b1530" stroke-width="1.6" stroke-linecap="round"/></g>');
  const wide = g => g.replace(/rx="2.6" ry="2.9"/g, 'rx="3.2" ry="3.6"');
  const F = { n: base, b: blink(base), w: flip(base, 0, -120), w2: flip(base, 0, -80), u: wide(flip(base, 105, -105)), u2: wide(flip(base, 70, -70)) };
  let left = Object.keys(F).length;
  Object.entries(F).forEach(([k, g]) => { const im = new Image(); im.onload = () => { if (--left === 0) AD.ready = true; }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="200" height="200">${g}</svg>`); AD.img[k] = im; });
  // เกล็ดหิมะแบบฟุ้งนุ่ม (วาดครั้งเดียวแล้วใช้ซ้ำ)
  AD.flake = [6, 10, 16].map(sz => { const c = document.createElement('canvas'); c.width = c.height = sz * 2; const x = c.getContext('2d'), g = x.createRadialGradient(sz, sz, 0, sz, sz, sz); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, sz * 2, sz * 2); return c; });
}
const adHill = (x, k) => { const W = AD.W || 1, t = AD.gTop, h = AD.gH; return k === 0 ? t - h * .16 + Math.sin(x / W * 5.2 + 1.3) * h * .07 + Math.sin(x / W * 11 + .4) * h * .025 : k === 1 ? t + Math.sin(x / W * 3.4 + 2.2) * h * .06 + Math.sin(x / W * 9 + 1) * h * .02 : t + h * .38 + Math.sin(x / W * 2.6 + .5) * h * .05; };
function adGround() {
  const W = AD.W, H = AD.H, c = document.createElement('canvas'); c.width = W * AD.dpr; c.height = H * AD.dpr; const x = c.getContext('2d'); x.scale(AD.dpr, AD.dpr);
  const layer = (k, c0, c1, rim) => {
    x.beginPath(); x.moveTo(0, H); for (let i = 0; i <= W; i += 8) x.lineTo(i, adHill(i, k)); x.lineTo(W, H); x.closePath();
    const top = adHill(W / 2, k) - AD.gH * .1, g = x.createLinearGradient(0, top, 0, H); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fill();
    x.save(); x.clip(); const sh = x.createLinearGradient(0, top, 0, top + 40); sh.addColorStop(0, 'rgba(255,255,255,.55)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = sh; x.fillRect(0, top, W, 60); x.restore();
    x.beginPath(); for (let i = 0; i <= W; i += 8) i ? x.lineTo(i, adHill(i, k)) : x.moveTo(i, adHill(i, k)); x.strokeStyle = rim; x.lineWidth = 2.2; x.stroke();
  };
  // ต้นสนหิมะบนเนินไกล
  layer(0, '#a996e6', '#d2c7f6', 'rgba(255,255,255,.55)');
  for (let i = 0; i < Math.max(6, W / 120); i++) { const tx = (i + .5) * (W / Math.max(6, W / 120)) + Math.sin(i * 7.3) * 30, s = 16 + (Math.sin(i * 3.1) + 1) * 10, ty = adHill(tx, 0) + 4;
    x.fillStyle = '#8f7ad8'; [0, 1, 2].forEach(j => { const w = s * (1 - j * .25), yy = ty - s * j * .55; x.beginPath(); x.moveTo(tx - w * .6, yy); x.lineTo(tx, yy - s * .9); x.lineTo(tx + w * .6, yy); x.closePath(); x.fill(); });
    x.fillStyle = 'rgba(255,255,255,.85)'; [0, 1, 2].forEach(j => { const w = s * (1 - j * .25), yy = ty - s * j * .55; x.beginPath(); x.moveTo(tx - w * .25, yy - s * .55); x.lineTo(tx, yy - s * .9); x.lineTo(tx + w * .25, yy - s * .55); x.quadraticCurveTo(tx, yy - s * .48, tx - w * .25, yy - s * .55); x.fill(); }); }
  layer(1, '#e2dafb', '#f3f0ff', 'rgba(255,255,255,.9)');
  layer(2, '#f7f5ff', '#ffffff', 'rgba(255,255,255,1)');
  // เงาอ่อนใต้ขอบเนินหน้า
  AD.ground = c;
  AD.glints = Array.from({ length: Math.round(W / 30) }, () => { const gx = Math.random() * W, k = 1 + (Math.random() < .5 ? 1 : 0); return { x: gx, y: adHill(gx, k) + 8 + Math.random() * AD.gH * .45, p: Math.random() * 6.28, s: 1 + Math.random() * 1.6 }; });
}
const adStars = () => `<div class="ad-stars" aria-hidden="true">${Array.from({ length: 46 }, (_, i) => { const r = n => (Math.sin(i * 71.7 + n) + 1) / 2; return `<i style="left:${(r(1) * 100).toFixed(1)}%;top:${(r(2) * 55).toFixed(1)}%;--d:${(2 + r(3) * 4).toFixed(1)}s;--dl:-${(r(4) * 5).toFixed(1)}s;--z:${(1 + r(5) * 2.2).toFixed(1)}px"></i>`; }).join('')}</div>`;
/** เริ่มฉากหิมะ + ฝูงเพนกวินบน canvas #ad-cv (ใช้ทั้งหน้าเข้าสู่ระบบและหน้า Access Denied) */
function adScene(since) {
  AD.cv = $('#ad-cv'); AD.ctx = AD.cv.getContext('2d');
  adSprites(); adResize(); window.addEventListener('resize', adResize);
  AD.max = innerWidth < 640 ? 18 : innerWidth < 1100 ? 30 : 44;
  const start = Math.min(AD.max, 6 + Math.floor((Date.now() - (since || Date.now())) / 10000));
  ['build', 'walk', 'skate', 'ball', 'run', 'slide'].concat(Array.from({ length: Math.max(0, start - 6) }, () => adPick())).slice(0, start).forEach(k => adSpawn(k, true));
  AD.spawnT = performance.now(); AD.last = performance.now(); AD.raf = requestAnimationFrame(adLoop);
  AD.cv.addEventListener('pointerdown', adPoke);
}
function showDenied(lk) {
  adStop(); AD.lk = lk;
  document.body.classList.remove('modal-open');
  const min = fmtMin(lk.min || 30);
  root().innerHTML = `<div class="ad" id="ad" role="main">
    ${adStars()}
    <div class="ad-top">${AD_ART}</div>
    <canvas class="ad-cv" id="ad-cv" aria-label="ฝูงเพนกวินเล่นหิมะ แตะเพื่อให้วิ่งหนี"></canvas>
    <section class="ad-card">
      <span class="ad-lock" aria-hidden="true">${ic('lock', 22)}</span>
      <h1 class="ad-title" aria-label="Access denied">${'ACCESS DENIED'.split('').map((c, i) => `<span style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join('')}</h1>
      <p class="ad-sub"><span>ไม่มีการใช้งานเกิน ${min} ระบบจึงออกจากระบบให้อัตโนมัติ</span><span>เพื่อปกป้องข้อมูลสำคัญของหน่วยงาน</span>${lk.email ? `<small>${esc(lk.email)}</small>` : ''}</p>
      <div class="ad-timer" role="timer" aria-live="off" aria-label="ระยะเวลาที่ไม่ได้ใช้งาน">
        <span class="ad-tl">${ic('clock', 14)} ละเว้นจากการใช้งานระบบ</span>
        <div class="ad-digits">${[['h', 'ชั่วโมง'], ['m', 'นาที'], ['s', 'วินาที']].map(([k, t], i) => `${i ? '<i class="ad-colon">:</i>' : ''}<div class="ad-seg"><div class="ad-box">${[0, 1].map(j => `<span class="ad-dg" id="ad-${k}${j}"><span class="ad-strip">${'01234567890'.split('').map(d => `<b>${d}</b>`).join('')}</span></span>`).join('')}</div><small>${t}</small></div>`).join('')}</div>
      </div>
      <button class="ad-btn" data-act="ad-back">${ic('arrow', 17)} <span>${lk.preview ? 'ปิดตัวอย่าง กลับหน้าตั้งค่า' : 'กลับเข้าสู่ระบบอีกครั้ง'}</span></button>
    </section>
    <p class="ad-flock">${peng('', 20)} ฝูงเพนกวินที่มารอคุณ <b id="ad-n">0</b> ตัว <small>· แตะเพนกวินแล้วน้องจะวิ่งหนี</small></p>
  </div>`;
  adScene(lk.lockedAt || Date.now());
  adClock(true); AD.tick = setInterval(() => adClock(false), 1000);
}
function adStop() { cancelAnimationFrame(AD.raf); AD.raf = 0; clearInterval(AD.tick); window.removeEventListener('resize', adResize); AD.ps = []; AD.fx = []; AD.kinds = {}; }
function adResize() {
  const cv = AD.cv; if (!cv || !cv.isConnected) return;
  const W = innerWidth, H = innerHeight; AD.W = W; AD.H = H; AD.dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * AD.dpr); cv.height = Math.round(H * AD.dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
  AD.gH = Math.max(140, Math.min(280, H * (W < 640 ? .27 : .25))); AD.gTop = H - AD.gH;
  adGround();
  const n = Math.round((W < 640 ? 90 : 190) * AD.q);
  while (AD.snow.length < n) AD.snow.push(adFlake(true)); AD.snow.length = n;
  AD.ps.forEach(p => { p.y = adLaneY(p.lane); });
}
function adFlake(anyY) { const z = Math.random(); return { x: Math.random() * AD.W, y: anyY ? Math.random() * AD.H : -20, z, r: 1.2 + z * 3.8 + Math.random() * 1.2, vy: 14 + z * 46 + Math.random() * 10, amp: 8 + Math.random() * 22, ph: Math.random() * 6.28, fr: .4 + Math.random() * .9, a: .45 + z * .5 }; }
const adLaneY = lane => AD.gTop + AD.gH * (.16 + lane * .72);
/* ---------- ตัวจับเวลาแบบม้วนตัวเลข (ไม่มีตัวเลขซ้อน) ---------- */
function adClock(first) {
  const lk = AD.lk; if (!lk) return; const t = Math.max(0, Math.floor((Date.now() - lk.at) / 1000));
  const v = { h: String(Math.min(99, Math.floor(t / 3600))).padStart(2, '0'), m: String(Math.floor(t / 60) % 60).padStart(2, '0'), s: String(t % 60).padStart(2, '0') };
  Object.entries(v).forEach(([k, str]) => [0, 1].forEach(i => adDigit($('#ad-' + k + i), +str[i], first)));
}
function adDigit(el, d, first) {
  if (!el) return; const st = el.firstElementChild, prev = el._d;
  if (prev === d) return; el._d = d;
  const go = (idx, anim) => { st.style.transition = anim ? '' : 'none'; st.style.transform = `translateY(${-idx * 10 / 11 * 100 / 10}%)`; if (!anim) void st.offsetWidth; };
  if (first || prev == null) { go(d, false); return; }
  if (d === 0 && prev > 0) { go(10, true); clearTimeout(el._t); el._t = setTimeout(() => go(0, false), 620); }   // หมุนต่อไปยัง 0 ด้านล่าง แล้วแอบกลับขึ้นบน
  else go(d, true);
  el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
}
/* ---------- เพนกวิน ---------- */
const AD_W = { walk: 5, run: 2.2, skate: 2.6, ball: 2, slide: 2, sled: 1.6, spin: 1.6, build: 1 };
function adPick() {
  const tot = Object.values(AD_W).reduce((a, b) => a + b, 0); let r = Math.random() * tot;
  for (const [k, w] of Object.entries(AD_W)) { r -= w; if (r <= 0) return k === 'build' && (AD.kinds.build || 0) >= 3 ? 'walk' : k; }
  return 'walk';
}
function adSpawn(kind, first) {
  const lane = Math.random(), mob = AD.W < 640, s = (mob ? 36 : 42) + lane * (mob ? 48 : 76);
  const dir = Math.random() < .5 ? 1 : -1;
  const base = { walk: 42, run: 95, skate: 140, ball: 30, slide: 175, sled: 190, spin: 0, build: 0 }[kind];
  const p = { kind, lane, s, dir, face: dir, y: adLaneY(lane), sp: base * (.75 + lane * .5) * (.85 + Math.random() * .3), x: 0, ph: Math.random() * 6.28, st: 'move', stT: 0, next: 1.5 + Math.random() * 4, jz: 0, jv: 0, rot: 0, spin: 0, frame: 'n', blinkT: 2 + Math.random() * 4, r: 6, ang: 0, bt: Math.random() * 16, flee: 0, wave: 0, board: 0 };
  p.x = first || kind === 'build' || kind === 'spin' ? s + Math.random() * Math.max(1, AD.W - s * 2) : dir > 0 ? -s * 1.5 : AD.W + s * 1.5;
  p.home = p.x; if (!first) adPuff(p.x, p.y, 6, .6);
  AD.ps.push(p); AD.kinds[kind] = (AD.kinds[kind] || 0) + 1;
  const n = $('#ad-n'); if (n) { n.textContent = AD.ps.length; n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
}
function adPuff(x, y, n, sc = 1) { for (let i = 0; i < n; i++) AD.fx.push({ t: 'puff', x: x + (Math.random() - .5) * 20 * sc, y: y - Math.random() * 6, vx: (Math.random() - .5) * 60 * sc, vy: -20 - Math.random() * 50 * sc, r: (4 + Math.random() * 7) * sc, life: .7 + Math.random() * .5, age: 0 }); }
function adUpdate(p, dt) {
  const s = p.s, spd = p.flee > 0 ? Math.max(p.sp * 2.6, 230 * (.7 + p.lane * .6)) : p.sp;
  // เวลากะพริบตา
  p.blinkT -= dt; if (p.blinkT < -.14) p.blinkT = 2 + Math.random() * 4;
  // กระโดด/ฟิสิกส์แกนตั้ง
  if (p.jz > 0 || p.jv > 0) { p.jv -= 1500 * dt * (s / 90); p.jz += p.jv * dt; if (p.jz <= 0) { p.jz = 0; p.jv = 0; p.squash = .22; if (p.spin) { p.spin = 0; p.rot = 0; } adPuff(p.x, p.y, 3, s / 90); } }
  if (p.squash) p.squash = Math.max(0, p.squash - dt * 1.6);
  if (p.spin) p.rot += dt * 12.5 * p.dir;
  p.face += (p.dir - p.face) * Math.min(1, dt * 9);
  if (p.flee > 0) { p.flee -= dt; if (Math.random() < dt * 6) AD.fx.push({ t: 'drop', x: p.x - p.dir * s * .25, y: p.y - s * .8 - p.jz, vx: -p.dir * 40, vy: -60, life: .6, age: 0, r: 2 + s / 50 }); if (p.flee <= 0) { p.st = p.kind === 'build' ? 'home' : 'move'; p.next = 1 + Math.random() * 3; } }
  const edgeTurn = () => { if (p.x < s * .6 && p.dir < 0) p.dir = 1; else if (p.x > AD.W - s * .6 && p.dir > 0) p.dir = -1; };
  const exitTurn = () => { if (p.x < -s * 1.4 && p.dir < 0) p.dir = 1; else if (p.x > AD.W + s * 1.4 && p.dir > 0) p.dir = -1; };
  p.next -= dt;
  switch (p.kind) {
    case 'build': {
      if (p.st === 'home' || (p.flee > 0)) { if (p.flee <= 0) { const dx = p.home - p.x; if (Math.abs(dx) < 4) { p.st = 'build'; p.dir = 1; } else { p.dir = Math.sign(dx); p.x += p.dir * 90 * dt; p.ph += dt * 14; } } else { p.x += p.dir * spd * dt; p.ph += dt * 22; exitTurn(); } break; }
      p.bt = (p.bt + dt) % 16; p.dir = 1; const b = p.bt;
      p.ph += dt * 6; if ([1.2, 3.2, 5.2, 7, 8.6].some(k => b > k && b - dt <= k)) { p.jv = 260 * (s / 90); adPuff(p.x + s * .7, p.y, 4, s / 90); }
      if (b > 11 && b - dt <= 11) { p.jv = 420 * (s / 90); p.spin = 1; }
      p.wave = b > 11.5 && b < 14 ? 1 : 0; break;
    }
    case 'spin': {
      p.ph += dt * 7; if (p.next <= 0) { p.jv = 380 * (s / 90); p.spin = 1; p.next = 1.8 + Math.random() * 2.6; if (Math.random() < .4) p.dir *= -1; }
      if (p.flee > 0) { p.x += p.dir * spd * dt; p.ph += dt * 20; exitTurn(); } else if (p.x < -s || p.x > AD.W + s) { p.dir = p.x < 0 ? 1 : -1; p.x += p.dir * 60 * dt; }
      break;
    }
    case 'skate': case 'sled': case 'slide': {
      p.x += p.dir * spd * dt; p.ph += dt * (p.kind === 'sled' ? 16 : 3); exitTurn();
      if (p.kind === 'skate' && p.jz === 0 && p.next <= 0) { p.jv = 430 * (s / 90); p.board = .001; p.next = 2 + Math.random() * 4; }
      if (p.kind === 'skate' && p.board) { p.board += dt * 2.2; if (p.board >= 1) p.board = 0; }
      if (p.kind === 'slide' && Math.random() < dt * 22) AD.fx.push({ t: 'puff', x: p.x - p.dir * s * .45, y: p.y - 2, vx: -p.dir * (30 + Math.random() * 40), vy: -10 - Math.random() * 30, r: 2 + Math.random() * 4 * (s / 90), life: .45, age: 0 });
      if (p.kind === 'sled' && p.jz === 0 && p.next <= 0) { p.jv = 220 * (s / 90); p.next = .8 + Math.random() * 2; }
      break;
    }
    default: { // walk / run / ball
      if (p.st === 'stop') {
        p.stT -= dt; p.ph += dt * 2.2;
        if (p.stT <= 0) { p.st = 'move'; p.wave = 0; p.next = 2 + Math.random() * 5; }
        break;
      }
      p.x += p.dir * spd * dt; p.ph += dt * (p.flee > 0 ? 24 : p.kind === 'run' ? 17 : 10) * (p.kind === 'ball' ? .8 : 1);
      if (p.flee > 0) { exitTurn(); if (p.x < -s * 1.3 || p.x > AD.W + s * 1.3) { p.flee = 0; p.st = 'move'; } }
      else edgeTurn();
      if (p.kind === 'ball') {
        p.r = Math.min(s * .52, p.r + dt * (1.4 + p.lane)); p.ang += spd * dt / Math.max(4, p.r) * p.dir;
        if (p.r >= s * .52) { adPuff(p.x + p.dir * (s * .42 + p.r), p.y - p.r, 14, s / 70); p.r = 5; }
      }
      if (p.next <= 0 && p.flee <= 0) {
        const r = Math.random(); p.next = 2 + Math.random() * 5;
        if (p.kind === 'ball') { if (r < .3) p.dir *= -1; break; }
        if (r < .28) { p.st = 'stop'; p.stT = 1 + Math.random() * 2; }
        else if (r < .46) { p.st = 'stop'; p.stT = 1.8; p.wave = 1; }
        else if (r < .66) { p.jv = 400 * (s / 90); p.spin = 1; }
        else if (r < .82) p.dir *= -1;
        else if (r < .92) { p.st = 'stop'; p.stT = 1.1; adThrow(p); }
        else p.jv = 300 * (s / 90);
      }
    }
  }
}
function adThrow(p) { AD.fx.push({ t: 'ball', x: p.x + p.dir * p.s * .3, y: p.y - p.s * .7, vx: p.dir * (160 + Math.random() * 140) * (p.s / 90), vy: -(220 + Math.random() * 120) * (p.s / 90), g: 700 * (p.s / 90), floor: p.y, r: 2.5 + p.s / 30, life: 3, age: 0 }); }
function adDrawP(c, p, t) {
  const s = p.s, flee = p.flee > 0, im = AD.img;
  let frame = flee ? (Math.sin(p.ph * .5) > 0 ? 'u' : 'u2') : p.wave ? (Math.sin(t / 110) > 0 ? 'w' : 'w2') : p.blinkT < 0 ? 'b' : 'n';
  const walking = p.kind === 'walk' || p.kind === 'run' || p.kind === 'ball' || flee || p.st === 'home';
  const moving = walking && p.st !== 'stop';
  let rot = p.rot, bob = 0, sx = 1, sy = 1;
  if (moving) { rot += Math.sin(p.ph) * (flee ? .2 : .14); bob = Math.abs(Math.sin(p.ph)) * s * .05; }
  else if (p.st === 'stop' && !p.wave) rot += Math.sin(p.ph) * .08;
  if (p.kind === 'build' && !flee) rot += Math.sin(p.ph * 2) * .06;
  if (p.kind === 'skate' && !flee) rot += Math.sin(t / 700 + p.ph) * .07 - p.dir * .05;
  if (p.kind === 'sled') bob = Math.abs(Math.sin(p.ph)) * s * .02;
  if (p.squash) { sy = 1 - p.squash * .6; sx = 1 + p.squash * .5; }
  const lift = p.kind === 'skate' ? s * .13 : p.kind === 'sled' ? s * .17 : 0;
  const alpha = .72 + p.lane * .28;
  c.save(); c.globalAlpha = alpha; c.translate(p.x, p.y);
  // เงา
  const sh = 1 / (1 + p.jz / (s * .5)); c.fillStyle = `rgba(60,40,120,${.16 * sh})`; c.beginPath(); c.ellipse(0, 0, s * .34 * sh, s * .07 * sh, 0, 0, 6.2832); c.fill();
  // ของเล่นใต้/หน้าเพนกวิน
  if (p.kind === 'ball' && !flee) { const bx = p.dir * (s * .42 + p.r), by = -p.r; c.save(); c.translate(bx, by); c.rotate(p.ang); const g = c.createRadialGradient(-p.r * .35, -p.r * .4, p.r * .1, 0, 0, p.r); g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#eef1fc'); g.addColorStop(1, '#c5ccef'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, p.r, 0, 6.2832); c.fill(); c.strokeStyle = 'rgba(140,150,210,.5)'; c.lineWidth = 1.2; c.setLineDash([3, 3]); c.beginPath(); c.arc(0, 0, p.r * .62, 0, 6.2832); c.stroke(); c.setLineDash([]); c.restore(); }
  if (p.kind === 'build') adSnowman(c, p);
  c.translate(0, -p.jz - bob);
  if (p.kind === 'skate' && !flee) { c.save(); c.translate(0, -s * .05); if (p.board) c.rotate(p.board * 6.2832 * p.dir); const bw = s * .72; c.fillStyle = '#c44a7f'; c.beginPath(); c.roundRect ? c.roundRect(-bw / 2, -s * .05, bw, s * .07, s * .035) : c.rect(-bw / 2, -s * .05, bw, s * .07); c.fill(); c.fillStyle = '#f07aa8'; c.fillRect(-bw / 2 + 3, -s * .05, bw - 6, s * .03); [-.3, .3].forEach(k => { c.save(); c.translate(bw * k, s * .03); c.rotate(p.x / (s * .06)); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, s * .045, 0, 6.2832); c.fill(); c.fillStyle = '#5b2bb0'; c.fillRect(-s * .01, -s * .045, s * .02, s * .09); c.restore(); }); c.restore(); }
  if (p.kind === 'sled' && !flee) { c.save(); c.scale(p.face, 1); c.fillStyle = '#c44a7f'; c.beginPath(); c.roundRect ? c.roundRect(-s * .5, -s * .16, s * 1, s * .12, [s * .05, s * .12, s * .03, s * .03]) : c.rect(-s * .5, -s * .16, s, s * .12); c.fill(); c.strokeStyle = '#ffd1e2'; c.lineWidth = Math.max(2, s * .03); c.beginPath(); c.moveTo(-s * .5, -s * .01); c.lineTo(s * .45, -s * .01); c.quadraticCurveTo(s * .62, -s * .01, s * .6, -s * .14); c.stroke(); c.restore(); }
  c.translate(0, -lift);
  if (p.kind === 'slide' && !flee) { rot = p.dir * 1.35 + Math.sin(p.ph * 4) * .03; }
  c.rotate(rot); c.scale(p.face * sx, sy);
  const img = im[frame] || im.n; if (img && img.complete) c.drawImage(img, -s / 2, p.kind === 'slide' && !flee ? -s * .62 : -s * .95, s, s);
  c.restore();
  if (flee && p.bang > 0) { p.bang -= 1 / 60; c.save(); c.globalAlpha = Math.min(1, p.bang * 2); c.font = `800 ${Math.round(12 + s * .22)}px ${getComputedStyle(document.body).fontFamily}`; c.fillStyle = '#ffd24d'; c.textAlign = 'center'; c.fillText('!', p.x, p.y - s * 1.12 - p.jz); c.restore(); }
}
function adSnowman(c, p) {
  const s = p.s, b = p.bt, ox = s * .78, e = (t0, d = .5) => { const k = Math.max(0, Math.min(1, (b - t0) / d)); return k <= 0 ? 0 : 1 + Math.sin(k * Math.PI) * .18 * (1 - k) - (1 - k) * (1 - k) * 0; };
  const melt = b > 14.5 ? Math.max(0, 1 - (b - 14.5) / 1.4) : 1;
  const ball = (y, r, k) => { if (!k) return; c.save(); c.translate(ox, y); c.scale(k, k * melt); const g = c.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r); g.addColorStop(0, '#fff'); g.addColorStop(.62, '#edf0fc'); g.addColorStop(1, '#c7cfef'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.fill(); c.restore(); };
  const r1 = s * .34, r2 = s * .25, r3 = s * .18, k1 = e(1), k2 = e(3), k3 = e(5);
  ball(-r1 * melt, r1, k1); ball(-(r1 * 2 + r2 * .8) * melt, r2, k2); ball(-(r1 * 2 + r2 * 1.6 + r3 * .8) * melt, r3, k3);
  const hy = -(r1 * 2 + r2 * 1.6 + r3 * .8) * melt;
  if (e(7) && melt > .5) { c.fillStyle = '#1b1530'; [-.35, .35].forEach(k => { c.beginPath(); c.arc(ox + r3 * k, hy - r3 * .15, r3 * .12, 0, 6.2832); c.fill(); }); c.fillStyle = '#f5a524'; c.beginPath(); c.moveTo(ox, hy + r3 * .05); c.lineTo(ox + r3 * .75, hy + r3 * .18); c.lineTo(ox, hy + r3 * .3); c.fill(); }
  if (e(8.6) && melt > .5) { c.fillStyle = '#231a3a'; const hw = r3 * 1.1; c.fillRect(ox - hw / 2, hy - r3 * 1.75, hw, r3 * .9); c.fillRect(ox - hw * .8, hy - r3 * .9, hw * 1.6, r3 * .16); c.fillStyle = '#e0679a'; c.fillRect(ox - hw / 2, hy - r3 * 1.05, hw, r3 * .16); }
  if (e(7.8) && melt > .5) { c.strokeStyle = '#8a5a3b'; c.lineWidth = Math.max(1.5, s * .025); c.lineCap = 'round'; const ay = -(r1 * 2 + r2 * .8) * melt; c.beginPath(); c.moveTo(ox - r2 * .9, ay); c.lineTo(ox - r2 * 1.9, ay - r2 * .7); c.moveTo(ox + r2 * .9, ay); c.lineTo(ox + r2 * 1.9, ay - r2 * .8); c.stroke(); }
}
function adLoop(t) {
  if (!AD.cv || !AD.cv.isConnected) { adStop(); return; }
  const dt = Math.min(.05, (t - AD.last) / 1000 || .016); AD.last = t;
  // ปรับคุณภาพอัตโนมัติถ้าเครื่องช้า
  AD.ft.push(dt); if (AD.ft.length > 90) { const avg = AD.ft.reduce((a, b) => a + b, 0) / AD.ft.length; AD.ft = []; if (avg > .026 && AD.q > .45) { AD.q -= .2; AD.snow.length = Math.round(AD.snow.length * .75); AD.max = Math.max(10, Math.round(AD.max * .8)); } }
  if (AD.ps.length < AD.max && t - AD.spawnT > 10000) { AD.spawnT = t; adSpawn(adPick()); }
  const c = AD.ctx, W = AD.W, H = AD.H; c.setTransform(AD.dpr, 0, 0, AD.dpr, 0, 0); c.clearRect(0, 0, W, H);
  const wind = Math.sin(t / 5200) * 16 + Math.sin(t / 1900) * 6;
  const flake = f => { f.y += f.vy * dt; f.ph += dt * f.fr; const x = f.x + Math.sin(f.ph) * f.amp; f.x += wind * dt * (.4 + f.z); const lim = f.z < .5 ? adHill(x, 1) + AD.gH * f.z * .5 : H + 10;
    if (f.y > lim) { Object.assign(f, adFlake(false)); return; } if (f.x > W + 30) f.x = -30; else if (f.x < -30) f.x = W + 30;
    const fade = f.z < .5 ? Math.min(1, (lim - f.y) / 40) : 1, spr = AD.flake[f.r < 2.4 ? 0 : f.r < 4 ? 1 : 2], d = f.r * 2.6; c.globalAlpha = f.a * fade; c.drawImage(spr, x - d / 2, f.y - d / 2, d, d); };
  AD.snow.forEach(f => { if (f.z < .5) flake(f); }); c.globalAlpha = 1;
  if (AD.ground) c.drawImage(AD.ground, 0, 0, W, H);
  AD.glints.forEach(g => { const a = Math.max(0, Math.sin(t / 700 + g.p)); if (a < .2) return; c.globalAlpha = a * .9; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(g.x, g.y - g.s * 3); c.lineTo(g.x + g.s * .6, g.y); c.lineTo(g.x, g.y + g.s * 3); c.lineTo(g.x - g.s * .6, g.y); c.fill(); c.fillRect(g.x - g.s * 3, g.y - .5, g.s * 6, 1); }); c.globalAlpha = 1;
  if (AD.ready) { AD.ps.forEach(p => adUpdate(p, dt)); AD.ps.slice().sort((a, b) => a.y - b.y).forEach(p => adDrawP(c, p, t)); }
  // เอฟเฟกต์: ฝุ่นหิมะ ก้อนหิมะที่ขว้าง หยดเหงื่อ
  AD.fx = AD.fx.filter(f => { f.age += dt; if (f.age > f.life) return false; const k = f.age / f.life;
    if (f.t === 'puff') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 60 * dt; c.globalAlpha = (1 - k) * .9; c.fillStyle = '#fff'; c.beginPath(); c.arc(f.x, f.y, f.r * (.6 + k * .8), 0, 6.2832); c.fill(); }
    else if (f.t === 'drop') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; c.globalAlpha = 1 - k; c.fillStyle = '#9fd3ff'; c.beginPath(); c.ellipse(f.x, f.y, f.r * .7, f.r, 0, 0, 6.2832); c.fill(); }
    else if (f.t === 'ball') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += f.g * dt; if (f.y >= f.floor && f.vy > 0) { adPuff(f.x, f.floor, 8, f.r / 5); return false; } c.globalAlpha = 1; c.fillStyle = '#fff'; c.beginPath(); c.arc(f.x, f.y, f.r, 0, 6.2832); c.fill(); }
    return true; });
  c.globalAlpha = 1;
  AD.snow.forEach(f => { if (f.z >= .5) flake(f); }); c.globalAlpha = 1;
  AD.raf = requestAnimationFrame(adLoop);
}
/* แตะเพนกวิน → สะดุ้ง กระโดด แล้ววิ่งหนี (ตัวข้างๆ ตกใจวิ่งตามด้วย) · แตะพื้นหิมะ → หิมะฟุ้ง ตัวที่อยู่ใกล้วิ่งหนี */
function adPoke(e) {
  const r = AD.cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
  const hit = AD.ps.slice().sort((a, b) => b.y - a.y).find(p => Math.abs(px - p.x) < p.s * .42 && py < p.y + 6 && py > p.y - p.s * 1.05 - p.jz);
  const scare = (p, delay, big) => setTimeout(() => { if (!AD.ps.includes(p)) return; p.dir = p.x >= px ? 1 : -1; p.flee = 1.6 + Math.random() * 1.2 + (big ? .8 : 0); p.st = 'flee'; p.wave = 0; p.bang = big ? 1.1 : .7; if (p.jz === 0) p.jv = (big ? 520 : 330) * (p.s / 90); if (big) adPuff(p.x, p.y, 8, p.s / 80); }, delay);
  if (hit) scare(hit, 0, true); else adPuff(px, Math.max(py, AD.gTop), 12, 1);
  AD.ps.forEach(p => { if (p === hit) return; const d = Math.hypot(p.x - px, (p.y - py) * 1.6); if (d < (hit ? 190 : 150)) scare(p, 80 + d * 1.5, false); });
}
function leaveDenied() {
  const lk = AD.lk || {}; if (!lk.preview) idleSet('psi_locked', null); clearInterval(AD.tick);
  if (lk.preview) { adStop(); startApp(); go('admin'); return; }
  A.notice = 'ออกจากระบบอัตโนมัติ เนื่องจากไม่มีการใช้งานเกิน ' + fmtMin(lk.min || 30) + ' กรุณาเข้าสู่ระบบอีกครั้ง'; A.noticeWarn = false;
  if (lk.email) A.email = lk.email;
  showAuth();
}
/** ใช้ดูตัวอย่างหน้า Access Denied ในโหมดสาธิต (พิมพ์ใน Console) */
const fmtMin = m => m >= 60 && m % 60 === 0 ? (m / 60) + ' ชั่วโมง' : m > 60 ? Math.floor(m / 60) + ' ชั่วโมง ' + (m % 60) + ' นาที' : m + ' นาที';
if (window.API && API.demo) window.__psiAD = AD;
if (window.API && API.demo) window.psiPreviewIdle = () => lockIdle(Date.now() - idleMsNow() - 60e3);
/** ดูตัวอย่างหน้า Access Denied จากหน้าตั้งค่า (ไม่ออกจากระบบจริง) */
function previewDenied() { const m = idleMin() || 30; showDenied({ at: Date.now() - m * 60e3 - 7000, email: ME.email, lockedAt: Date.now(), min: m, preview: true }); }
/* ---------------- แผงตั้งค่าในเมนู “ทีมและสิทธิ์” ---------------- */
const IDLE_PRESETS = [5, 10, 15, 30, 60, 120];
function idlePanel() {
  const cur = idleMin(), d = S.idleDraft || (S.idleDraft = { on: cur > 0, min: cur || 30 }), dirty = (d.on ? d.min : 0) !== cur;
  return `<section class="panel idle-panel" id="idle-panel"><div class="panel-head"><div><h2>${ic('clock', 17)} ออกจากระบบอัตโนมัติเมื่อไม่มีการใช้งาน</h2><p>ไม่ขยับเมาส์ ไม่แตะจอ ไม่พิมพ์ และไม่เลื่อนหน้า ครบเวลาที่ตั้ง ระบบจะออกจากระบบและแสดงหน้า Access Denied · มีผลกับผู้ใช้ทุกคนภายในไม่กี่วินาที</p></div>
    <label class="sw" title="เปิด/ปิด"><input type="checkbox" data-change="idle-on" ${d.on ? 'checked' : ''}><span></span><b>${d.on ? 'เปิดใช้งาน' : 'ปิดอยู่'}</b></label></div>
   <div class="idle-body${d.on ? '' : ' off'}">
    <div class="idle-now"><small>ตั้งเวลาไว้</small><b>${d.on ? fmtMin(d.min) : 'ไม่ออกจากระบบอัตโนมัติ'}</b></div>
    <div class="idle-ctl">
     <div class="seg seg-x" role="group" aria-label="เลือกระยะเวลา" data-seg="idle"><span class="seg-thumb" aria-hidden="true"></span>${IDLE_PRESETS.map(m => `<button data-act="idle-pick" data-v="${m}" aria-pressed="${d.on && d.min === m}" ${d.on ? '' : 'disabled'}>${m >= 60 ? m / 60 + ' ชม.' : m + ' นาที'}</button>`).join('')}</div>
     <label class="idle-custom">กำหนดเอง <input class="input" type="number" min="1" max="480" step="1" value="${d.min}" data-input="idle-min" aria-label="จำนวนนาที" ${d.on ? '' : 'disabled'}> นาที</label>
    </div>
   </div>
   <div class="idle-foot"><span class="note">${dirty ? `${ic('alert', 13)} ยังไม่บันทึก — ค่าที่ใช้อยู่ตอนนี้: ${cur ? fmtMin(cur) : 'ปิด'}` : `${ic('check', 13)} ใช้งานอยู่: ${cur ? fmtMin(cur) : 'ปิด'}`}</span>
    <div class="idle-btns"><button class="btn" data-act="idle-preview">${ic('eye', 15)} ดูตัวอย่างหน้า Access Denied</button><button class="btn primary" data-act="idle-save" ${dirty ? '' : 'disabled'}>${ic('check', 15)} บันทึกการตั้งค่า</button></div></div>
  </section>`;
}
function idlePanelPaint() { const el = $('#idle-panel'); if (!el) return; const t = document.createElement('div'); t.innerHTML = idlePanel(); el.replaceWith(t.firstElementChild); syncThumbs($('#idle-panel'), true); }
/* หิมะโปรยเบาๆ ด้านหลังเนื้อหา (ปิดได้จากปุ่มเกล็ดหิมะที่แถบเมนู · ผู้ที่ตั้งค่าลดการเคลื่อนไหวจะไม่เห็น) */
const snowOn = () => { try { return localStorage.getItem('psi_snow') !== '0'; } catch (_) { return true; } };
function snowInit() {
  let w = $('#snowfall'); if (!w) { w = document.createElement('div'); w.id = 'snowfall'; w.setAttribute('aria-hidden', 'true'); document.body.prepend(w);
    w.innerHTML = Array.from({ length: 34 }, (_, i) => { const r = (n => (Math.sin(i * 97.13 + n) + 1) / 2); return `<i style="--x:${(r(1) * 100).toFixed(2)}vw;--s:${(3 + r(2) * 6).toFixed(1)}px;--d:${(11 + r(3) * 14).toFixed(1)}s;--dl:-${(r(4) * 25).toFixed(1)}s;--sw:${(10 + r(5) * 40).toFixed(0)}px;--o:${(.35 + r(6) * .55).toFixed(2)}"></i>`; }).join(''); }
  document.body.classList.toggle('no-snow', !snowOn());
}
/* ================= รีเฟรชข้อมูลเบื้องหลังแบบเงียบ =================
   ทุก 3 วินาที ถามฐานข้อมูลว่า “เวอร์ชันข้อมูล” เปลี่ยนไหม (คำขอเล็กมาก) — ไม่เปลี่ยนก็ไม่ทำอะไร
   ถ้าเปลี่ยน โหลดข้อมูลใหม่ แล้วแก้ DOM เฉพาะจุดที่ต่าง ไม่มีหน้าโหลด ไม่กระพริบ ไม่เลื่อนหน้า และไม่รบกวนคนที่กำลังพิมพ์ */
const LIVE = { v: null, busy: false, timer: 0, fails: 0, next: 0, sig: '' };
const liveSig = d => { try { return JSON.stringify([d.posts, d.audience, d.followers, d.daily, d.users, d.connections, d.user, d.settings]); } catch (_) { return String(Math.random()); } };
function liveBusy() {
  const a = document.activeElement;
  if (MODAL.locked || $('#modal.on') || $('#loader') || DP.open) return true;
  if (a && a !== document.body && a.matches && a.matches('input, textarea, select, [contenteditable]') && !a.closest('#kpop')) return true;
  return false;
}
async function liveTick() {
  if (!ME || !API || !API.version || LIVE.busy || document.hidden || Date.now() < LIVE.next) return;
  LIVE.busy = true;
  try {
    const r = await API.version(); const v = r && r.v != null ? String(r.v) : null;
    if (v == null) return;
    if (LIVE.v == null) { LIVE.v = v; return; }
    if (v === LIVE.v) return;
    if (liveBusy()) return;                                   // ไว้รอบถัดไปเมื่อผู้ใช้ว่าง
    const d = await API.bootstrap();
    if (liveBusy() || !ME) return;
    LIVE.v = v; LIVE.fails = 0;
    const sig = liveSig(d); if (sig === LIVE.sig) return; LIVE.sig = sig;
    applySilent(d);
  } catch (e) {
    LIVE.fails++; LIVE.next = Date.now() + Math.min(60000, 3000 * Math.pow(2, Math.min(LIVE.fails, 5)));   // เงียบไว้ แล้วค่อยลองใหม่ห่างขึ้น
    if (e && e.code === 'unauthorized') LIVE.next = Date.now() + 3600e3;
  } finally { LIVE.busy = false; }
}
function applySilent(d) {
  const page0 = S.page, openP = S.openPost, loadedAt = DB.loadedAt;
  load(d); DB.loadedAt = loadedAt;
  SILENT = true;
  try {
    renderSide();
    if (S.page !== page0) { SILENT = false; renderTop(); renderView('fade'); return; }
    renderTop(); renderFab();
    if (!['add', 'connect'].includes(S.page)) renderView('silent');
    if (openP) { if (DB.posts.some(p => p.id === openP)) renderDrawer(false); else closeDrawer(); }
    if (KPOP.key) kpopRefresh();
  } catch (e) { console.warn('silent refresh', e); }
  finally { SILENT = false; }
}
function liveStart() {
  clearInterval(LIVE.timer); LIVE.v = null; LIVE.fails = 0; LIVE.next = 0;
  LIVE.sig = liveSig({ settings: DB.settings, posts: DB.posts, audience: DB.audience, followers: DB.followers, daily: (DB.daily || []).map(x => { const y = Object.assign({}, x); delete y._t; return y; }), users: DB.users, connections: DB.connections, user: ME });
  LIVE.timer = setInterval(liveTick, 3000); liveTick();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && ME) { LIVE.next = 0; liveTick(); } });
function startApp() {
  snowInit(); liveStart(); sessStart(); idleStart();
  root().innerHTML = `<div class="app"><aside class="side" id="side"></aside><main><div class="topbar" id="topbar"></div><div id="view" class="view"></div></main><div id="fab-slot"></div></div>`;
  renderSide(); renderTop(); renderView('enter');
}
/* ================= มาสคอตเพนกวิน (วาดใหม่เป็นเวกเตอร์ของระบบเอง: หมวกไหมพรมม่วง ผ้าพันคอชมพู) ================= */
const PENG_G = `<g class="pg">
  <ellipse class="pg-sh" cx="40" cy="76" rx="17" ry="2.6"/>
  <ellipse cx="32" cy="73.2" rx="6.2" ry="2.8" fill="#f5a524"/><ellipse cx="48" cy="73.2" rx="6.2" ry="2.8" fill="#f5a524"/>
  <path class="pg-fl pg-fl-l" d="M21 41c-6.5 3.5-10 11-9.4 17.6 4.6-.6 9.6-5.6 11-12z" fill="#2a2248"/>
  <path class="pg-fl pg-fl-r" d="M59 41c6.5 3.5 10 11 9.4 17.6-4.6-.6-9.6-5.6-11-12z" fill="#2a2248"/>
  <path class="pg-body" d="M40 13.5c-14 0-22 12-22 28.5v13.5c0 11 9 18 22 18s22-7 22-18V42c0-16.5-8-28.5-22-28.5z" fill="#2a2248"/>
  <path d="M40 31c-8.6 0-13.6 7.6-13.6 16.4v7.6c0 7.6 5.8 12.6 13.6 12.6s13.6-5 13.6-12.6v-7.6C53.6 38.6 48.6 31 40 31z" fill="#fff"/>
  <path d="M40 24.6c-3-3.6-7.8-4.6-11.6-2.4-4 2.8-4.2 8.8-1.2 12.6 3 3 8 4.2 12.8 3 4.8 1.2 9.8 0 12.8-3 3-3.8 2.8-9.8-1.2-12.6-3.8-2.2-8.6-1.2-11.6 2.4z" fill="#fff"/>
  <g class="pg-eyes"><ellipse cx="34" cy="29.6" rx="2.6" ry="2.9" fill="#1b1530"/><ellipse cx="46" cy="29.6" rx="2.6" ry="2.9" fill="#1b1530"/><circle cx="35" cy="28.5" r=".9" fill="#fff"/><circle cx="47" cy="28.5" r=".9" fill="#fff"/></g>
  <ellipse cx="29.2" cy="34.6" rx="3" ry="1.7" fill="#f59bbd" opacity=".8"/><ellipse cx="50.8" cy="34.6" rx="3" ry="1.7" fill="#f59bbd" opacity=".8"/>
  <path d="M36.6 33.8h6.8l-3.4 4.1z" fill="#f5a524" stroke="#f5a524" stroke-width="1.3" stroke-linejoin="round"/>
  <path d="M23.4 44.6c10.4 4.2 22.8 4.2 33.2 0l.4 5.4c-10.6 4.4-23.4 4.4-34 0z" fill="#e0679a"/>
  <path d="M24 47.4c10.2 3.8 21.8 3.8 32 0" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="3 2.4"/>
  <path class="pg-tail" d="M49.5 49.5l4.6 11.2-6.4-.6-2.4-9.4z" fill="#c9508a"/>
  <path d="M23.6 22.4c2-9.2 8.8-13.6 16.4-13.6s14.4 4.4 16.4 13.6c-10.6-3.2-22.2-3.2-32.8 0z" fill="#7b47bf"/>
  <path d="M23 22.8c10.8-3.6 23.2-3.6 34 0l-.9 3.6c-10.4-3.2-21.8-3.2-32.2 0z" fill="#a47ae6"/>
  <circle class="pg-pom" cx="40" cy="8.2" r="3.8" fill="#fff"/><circle cx="41.2" cy="9.2" r="2" fill="#e9e3f5"/>
</g>`;
const peng = (cls = '', size = 56) => `<svg class="peng ${cls}" viewBox="0 0 80 80" width="${size}" height="${size}" aria-hidden="true" focusable="false">${PENG_G}</svg>`;
const PENG_PEEK = `<div class="pop-peng" aria-hidden="true">${peng('wave', 58)}</div>`;
/* ================= หน้าต่างโหลดข้อมูลเต็มจอ (หนังสือ + มือถือ + ไอคอนโซเชียล) ================= */
const LD_MSG = ['กำลังโหลดข้อมูลจากฐานลึกลับ…', 'กำลังเปิดสมุดบันทึกของเพจ…', 'กำลังนับหัวใจทีละดวง…', 'กำลังเรียงโพสต์ตามวันเวลา…', 'กำลังรวบรวมความคิดเห็น…', 'กำลังคำนวณการมีส่วนร่วม…', 'กำลังจัดหน้าให้สวยที่สุด…'];
function graphemes(t) {
  try { if (window.Intl && Intl.Segmenter) return [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(t)].map(x => x.segment); } catch (_) {}
  const out = []; Array.from(t).forEach(ch => { if (out.length && /[ัิ-ฺ็-๎̀-ͯ]/.test(ch)) out[out.length - 1] += ch; else out.push(ch); }); return out;
}
/* ฉากโหลดแบบเวกเตอร์ (ถอดแบบจากงานออกแบบ Soft Wave) — ทุกชิ้นแยกเลเยอร์เพื่อขยับได้อิสระ
   ใช้เทคนิค translate(cx cy) → animate → translate(-cx -cy) ให้หมุน/ย่อรอบจุดศูนย์กลางของชิ้นนั้นได้แม่นยำทุกเบราว์เซอร์ */
const WV_STAR = 'M0-9C1-2.2 2.2-1 9 0 2.2 1 1 2.2 0 9-1 2.2-2.2 1-9 0-2.2-1-1-2.2 0-9z';
const WV_HEART = 'M0 7c-6-4.4-9.6-7.6-9.6-11.2 0-2.9 2.2-5 4.8-5 2 0 3.6 1.2 4.8 2.9 1.2-1.7 2.8-2.9 4.8-2.9 2.6 0 4.8 2.1 4.8 5C9.6-.6 6 2.6 0 7z';
const wvAt = (x, y, cls, inner, st = '') => `<g transform="translate(${x} ${y})"><g class="${cls}"${st ? ` style="${st}"` : ''}><g transform="translate(${-x} ${-y})">${inner}</g></g></g>`;
const wvLayer = (d, inner) => `<g class="wv-p" style="--d:${d}">${inner}</g>`;
const WV_PAGE_R = 'M372 293Q428 281 483 287L495 361Q433 355 372 364Z', WV_PAGE_L = 'M372 293Q316 281 261 287L249 361Q311 355 372 364Z';
const wvLines = side => [301, 315, 329, 343].map((y, i) => side < 0 ? `<path d="M${266 - i * 3} ${y - 1}Q316 ${y - 5} 364 ${y + 1}"/>` : `<path d="M380 ${y + 1}Q428 ${y - 5} ${478 + i * 3} ${y - 1}"/>`).join('');
const LOADER_ART = `<svg class="wv-art" viewBox="176 46 392 338" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="wv-glow" cx="50%" cy="46%" r="50%"><stop offset="0" stop-color="#b58be0" stop-opacity=".30"/><stop offset=".55" stop-color="#d9c6ef" stop-opacity=".14"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="wv-scr" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="#9a6bdc"/><stop offset=".55" stop-color="#6b3aa8"/><stop offset="1" stop-color="#4a2180"/></linearGradient>
    <linearGradient id="wv-cov" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8455c8"/><stop offset="1" stop-color="#5b2c98"/></linearGradient>
    <linearGradient id="wv-pgr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ece5f4"/><stop offset=".18" stop-color="#fbf9fd"/><stop offset="1" stop-color="#fff"/></linearGradient>
    <linearGradient id="wv-pgl" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#ece5f4"/><stop offset=".18" stop-color="#fbf9fd"/><stop offset="1" stop-color="#fff"/></linearGradient>
    <linearGradient id="wv-sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="wv-clip"><rect x="330.5" y="93.5" width="85" height="163" rx="13"/></clipPath>
    <filter id="wv-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="wv-drop" x="-40%" y="-20%" width="180%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#3b1a66" flood-opacity=".28"/></filter>
    <filter id="wv-dot" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  ${wvLayer(3, `<circle class="wv-glow" cx="372" cy="200" r="168" fill="url(#wv-glow)"/>`)}
  ${wvLayer(6, `<g class="wv-book">
    <path d="M252 281H492L512 368H232Z" fill="url(#wv-cov)" stroke="#6f40b3" stroke-width="9" stroke-linejoin="round"/>
    <path d="M234 366H510L506 376Q372 382 238 376Z" fill="#4c2383"/>
    <path d="${WV_PAGE_L}" fill="url(#wv-pgl)"/><path d="${WV_PAGE_R}" fill="url(#wv-pgr)"/>
    <g class="wv-lines">${wvLines(-1)}${wvLines(1)}</g>
    <path d="M372 293V364" stroke="#d9cde8" stroke-width="1.4"/>
    ${[0, 1, 2].map(i => wvAt(372, 0, 'wv-flip f' + i, `<path d="${WV_PAGE_R}" class="wv-fp"/><g class="wv-lines">${wvLines(1)}</g>`)).join('')}
  </g>`)}
  ${wvLayer(10, wvAt(372, 228, 'wv-orbit', `<circle class="wv-ring" cx="372" cy="228" r="150"/>
    <circle cx="372" cy="78" r="7" fill="#7b47bf" filter="url(#wv-dot)" class="wv-dot"/>
    <circle cx="222" cy="228" r="7" fill="#e7a83a" filter="url(#wv-dot)" class="wv-dot d2"/>
    <circle cx="468" cy="343" r="6" fill="#e8699a" filter="url(#wv-dot)" class="wv-dot d3"/>
    <circle cx="478" cy="122" r="3.2" fill="#b894e2" class="wv-dot d4"/>`))}
  ${wvLayer(12, wvAt(372, 292, 'wv-shadow', `<ellipse cx="372" cy="292" rx="56" ry="8" fill="#3b1a66" opacity=".28" filter="url(#wv-soft)"/>`))}
  ${wvLayer(16, wvAt(373, 175, 'wv-phone', `<g filter="url(#wv-drop)"><rect x="325" y="88" width="96" height="174" rx="18" fill="#28202f"/></g>
    <rect x="326.2" y="89.2" width="93.6" height="171.6" rx="17" fill="none" stroke="#4a3f58" stroke-width="1.2"/>
    <rect x="330.5" y="93.5" width="85" height="163" rx="13" fill="url(#wv-scr)"/>
    <g clip-path="url(#wv-clip)">
      <rect x="359" y="97" width="28" height="7" rx="3.5" fill="#241b2c"/>
      <circle cx="345" cy="118" r="7" fill="#fff"/>
      ${wvAt(357, 115, 'wv-ln', '<rect x="357" y="113" width="52" height="4.2" rx="2.1" fill="#fff" opacity=".92"/>')}
      ${wvAt(357, 123, 'wv-ln l2', '<rect x="357" y="121" width="31" height="3.6" rx="1.8" fill="#fff" opacity=".55"/>')}
      ${[['#fff', 344], ['#e8ab3c', 360], ['#cfc0e6', 376], ['#ee8db3', 392]].map(([c, x], i) => wvAt(x + 5.5, 212, 'wv-bar b' + i, `<rect x="${x}" y="156" width="11" height="56" rx="3" fill="${c}"/>`)).join('')}
      <rect x="338" y="221" width="70" height="22" rx="8" fill="#fff" opacity=".17"/>
      ${wvAt(350, 232, 'wv-heart', `<path d="${WV_HEART}" transform="translate(350 232) scale(.52)" fill="#fff"/>`)}
      ${wvAt(363, 232, 'wv-ln l3', '<rect x="363" y="230" width="36" height="4" rx="2" fill="#fff" opacity=".72"/>')}
      <g transform="rotate(18 372 175)"><rect class="wv-sheen" x="300" y="70" width="46" height="220" fill="url(#wv-sheen)"/></g>
    </g>`))}
  ${wvLayer(20, [['#ee6a9b', 'heart', 430, 142, 0, 12], ['#8a55c9', 'cmt', 312, 176, 1.1, -14], ['#e8ab3c', 'star', 432, 214, 2.2, 16]].map(([c, k, x, y, d, dx]) => wvAt(x, y, 'wv-rx', `<circle cx="${x}" cy="${y}" r="10.5" fill="${c}"/><circle cx="${x - 3}" cy="${y - 4}" r="4" fill="#fff" opacity=".35"/>` + (k === 'heart' ? `<path d="${WV_HEART}" transform="translate(${x} ${y + .6}) scale(.46)" fill="#fff"/>` : k === 'star' ? `<path d="${WV_STAR}" transform="translate(${x} ${y}) scale(.62)" fill="#fff"/>` : `<rect x="${x - 5.5}" y="${y - 4.5}" width="11" height="8" rx="2.4" fill="#fff"/><path d="M${x - 2.5} ${y + 3}l-1.5 3.4 4.2-3.4z" fill="#fff"/>`), `animation-delay:${d}s;--dx:${dx}px`)).join(''))}
  ${wvLayer(14, `<g transform="translate(180 326) scale(.56)"><g class="wv-peng">${PENG_G}</g></g>`)}
  ${wvLayer(24, [[231, 128, 1, '#e8ab3c', 0], [522, 106, .72, '#7b47bf', .7], [508, 258, .9, '#e8ab3c', 1.4], [258, 266, .55, '#e8699a', 2.0], [300, 72, .42, '#b894e2', 1.1], [452, 64, .5, '#e8ab3c', 2.5]].map(([x, y, sc, c, d]) => wvAt(x, y, 'wv-spk', `<path d="${WV_STAR}" transform="translate(${x} ${y}) scale(${sc})" fill="${c}"/>`, `animation-delay:${d}s`)).join(''))}
</svg>`;
function loaderShow(title) {
  let el = $('#loader'); if (!el) { el = document.createElement('div'); el.id = 'loader'; document.body.appendChild(el); }
  const name = CFG.LOADER_TITLE || 'CMUL PR Social Insight', sub = CFG.LOADER_SUB || 'หน่วยสื่อสารองค์กร';
  const reduce = RM();
  let li = 0;
  const title3 = name.split(/\s+/).filter(Boolean).map(w => `<span class="ld-word">${graphemes(w).map(g => `<span class="ld-ch" style="--i:${li++}">${esc(g)}</span>`).join('')}</span>`).join('<span class="ld-sp"> </span>');
  el.className = 'ld-wrap'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
  el.innerHTML = `<div class="ld-bd"></div><div class="ld-card">
    <div class="ld-stage">${LOADER_ART}</div>
    <h1 class="ld-name" aria-label="${esc(name)}">${title3}</h1>
    <p class="ld-org">${esc(sub)}</p>
    <div class="ld-meter"><div class="ld-pct"><b id="ld-n">0</b><span>%</span></div><div class="ld-bar"><span id="ld-bar"></span></div><p class="ld-msg" id="ld-msg">${esc(title || LD_MSG[0])}</p></div>
  </div>`;
  document.body.classList.add('modal-open'); void el.offsetWidth; el.classList.add('on');
  const h1 = $('.ld-name', el), letters = $$('.ld-ch', el);
  // ไล่สีต่อเนื่องทั้งชื่อ (แต่ละตัวอักษรถือพื้นหลังชิ้นเดียวกันแต่เลื่อนตำแหน่ง) — ขยับตัวอักษรได้โดยสีไม่ขาด
  const paintGrad = () => { if (!letters.length) return; const x0 = Math.min(...letters.map(s => s.offsetLeft)), x1 = Math.max(...letters.map(s => s.offsetLeft + s.offsetWidth)), w = Math.max(1, x1 - x0);
    letters.forEach(s => { s.style.backgroundSize = w + 'px 100%'; s.style.backgroundPosition = (x0 - s.offsetLeft) + 'px 0'; }); };
  paintGrad(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintGrad); window.addEventListener('resize', paintGrad);
  // Soft Wave: คลื่นไหลทีละตัว (เร็ว 980ms, ห่างกัน 46ms) → หยุดนิ่ง 2 วินาที → วนใหม่จนหน้าต่างปิด
  if (!reduce && letters[0] && letters[0].animate) {
    const small = innerWidth <= 520, speed = 980, gap = small ? 38 : 46, pause = 2000, rise = small ? 8 : 12;
    const cyc = speed + gap * (letters.length - 1) + pause, w = speed / cyc, E = 'cubic-bezier(.22,1,.36,1)';
    const K = (o, y, r, sc, br) => ({ offset: o * w, translate: `0 ${y}px`, rotate: r + 'deg', scale: String(sc), filter: `brightness(${br})`, easing: E });
    const frames = [K(0, 0, 0, 1, 1), K(.3, -rise, -1.2, 1.018, 1.08), K(.52, 2, .7, .995, 1.02), K(.72, -2, -.25, 1.004, 1), K(1, 0, 0, 1, 1), { offset: 1, translate: '0 0', rotate: '0deg', scale: '1', filter: 'brightness(1)' }];
    const start = 700 + letters.length * 32;
    letters.forEach((sp, i) => sp.animate(frames, { duration: cyc, delay: start + i * gap, iterations: Infinity }));
  }
  // พารัลแลกซ์: เลื่อนเมาส์/นิ้ว แต่ละเลเยอร์ขยับไม่เท่ากัน ให้ฉากดูมีความลึก
  const art = $('.wv-art', el);
  const onMove = ev => { if (!art) return; const r = art.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; const pt = ev.touches ? ev.touches[0] : ev;
    art.style.setProperty('--mx', Math.max(-1, Math.min(1, (pt.clientX - cx) / (innerWidth / 2))).toFixed(3)); art.style.setProperty('--my', Math.max(-1, Math.min(1, (pt.clientY - cy) / (innerHeight / 2))).toFixed(3)); };
  if (!reduce) { el.addEventListener('pointermove', onMove); el.addEventListener('touchmove', onMove, { passive: true }); }
  let shown = 0, floor = 0, ceil = 0, raf = 0, alive = true, mi = 0;
  const paint = () => { const n = $('#ld-n'), b = $('#ld-bar'); if (n) n.textContent = Math.floor(shown); if (b) b.style.width = shown.toFixed(2) + '%'; if (art) art.style.setProperty('--pct', (shown / 100).toFixed(3)); };
  const tick = () => { if (!alive) return; if (shown < floor) shown = Math.min(floor, shown + Math.max(.8, (floor - shown) * .16)); else if (shown < ceil) shown += Math.max(.02, (ceil - shown) * .012); paint(); raf = requestAnimationFrame(tick); };
  tick();
  const msgT = setInterval(() => { const m = $('#ld-msg'); if (!m) return; mi = (mi + 1) % LD_MSG.length; m.classList.remove('in'); void m.offsetWidth; m.textContent = LD_MSG[mi]; m.classList.add('in'); }, 2300);
  const t0 = Date.now();
  const stop = () => { alive = false; cancelAnimationFrame(raf); clearInterval(msgT); window.removeEventListener('resize', paintGrad); };
  return {
    at(p, next) { floor = Math.max(floor, p); ceil = Math.max(floor, Math.min(97, next == null ? p : p + (next - p) * .95)); },
    text(t) { clearInterval(msgT); const m = $('#ld-msg'); if (m) { m.classList.remove('in'); void m.offsetWidth; m.textContent = t; m.classList.add('in'); } },
    async done(minMs = 1500) {
      const left = minMs - (Date.now() - t0); if (left > 0) { this.at(floor, 97); await wait(left); }
      floor = ceil = 100; await new Promise(r => { const chk = () => shown >= 99.9 ? r() : setTimeout(chk, 30); chk(); });
      clearInterval(msgT); const m = $('#ld-msg'); if (m) { m.textContent = 'พร้อมแล้ว!'; m.classList.add('ok'); } el.classList.add('ready');
      await wait(420); alive = false; cancelAnimationFrame(raf);
    },
    close() { stop(); el.classList.add('leaving'); el.classList.remove('on'); document.body.classList.remove('modal-open'); setTimeout(() => { if (!el.classList.contains('on')) el.remove(); }, 650); },
    fail() { stop(); el.remove(); document.body.classList.remove('modal-open'); }
  };
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
  paint($('#side'), `
   <div class="brand">${brandMark()}<div><b>${esc(APP_NAME)}</b><small>${esc(CFG.ORG_NAME || 'Social Analytics')}</small></div></div>
   <nav class="nav" aria-label="เมนูหลัก">${NAV_GROUPS.map(([g, keys]) => { const items = keys.filter(k => can(k)); if (!items.length) return ''; return `<div class="nav-label">${g}</div>` + items.map(k => { const m = PAGES.find(x => x.k === k); const warn = k === 'connect' && PKEYS.some(p => conn(p).error); return `<button data-act="nav" data-v="${k}" ${S.page === k ? 'aria-current="page"' : ''}>${ic(k)}<span>${m.t}</span>${k === 'admin' && pending ? `<span class="count">${pending}</span>` : ''}${k === 'comments' && needs ? `<span class="count" title="คำถาม ร้องเรียน หรือสนใจซื้อ ที่ยังไม่ได้ตอบ">${needs}</span>` : ''}${warn ? '<span class="count" title="การเชื่อมต่อมีปัญหา">!</span>' : ''}</button>`; }).join(''); }).join('')}
   </nav>
   <div class="me"><span class="me-peng" aria-hidden="true">${peng('sit wave', 46)}</span>
    <span class="mode-pill" title="${API.demo ? 'ยังไม่ได้ตั้งค่า API_URL ใน config.js' : 'บันทึกข้อมูลลงฐานข้อมูลของหน่วยงาน'}">${ic(API.demo ? 'spark' : 'sheet', 12)} ${API.demo ? 'โหมดสาธิต' : 'เชื่อมต่อฐานเก็บข้อมูลแล้ว'}</span>
    <div class="me-row"><span class="avatar">${initials(ME.name)}</span><div><b>${esc(ME.name)}</b><span>${esc(ME.email)} · ${esc(ME.role)}</span></div></div>
    <div class="me-actions"><button class="btn sm ghost icon-only${RM() ? '' : ' on'}" data-act="motion" aria-pressed="${!RM()}" title="${RM() ? 'เปิด' : 'ลด'}ภาพเคลื่อนไหว" aria-label="ภาพเคลื่อนไหว">${ic('spark', 15)}</button><button class="btn sm ghost icon-only${snowOn() ? ' on' : ''}" data-act="snow" aria-pressed="${snowOn()}" title="${snowOn() ? 'ปิด' : 'เปิด'}หิมะตก" aria-label="หิมะตก">${ic('snow', 15)}</button><button class="btn sm ghost" data-act="theme" aria-label="สลับธีมสว่าง/มืด">${ic(isDark() ? 'sun' : 'moon', 15)} ${isDark() ? 'ธีมสว่าง' : 'ธีมมืด'}</button><button class="btn sm ghost" data-act="logout">${ic('out', 15)} ออกจากระบบ</button></div>
   </div>`);
}
function renderFab() { const f = $('#fab-slot'); if (f) paint(f, can('add') ? `<button class="fab${S.page === 'add' ? ' raised' : ''}" data-act="dupscan" title="ตรวจหาข้อมูลซ้ำในฐานข้อมูล">${ic('search', 17)}<span>ตรวจข้อมูลซ้ำ</span></button>` : ''); }
function renderTop() {
  const u = me();
  paint($('#topbar'), `
   ${S.acting ? `<div class="impersonate">${ic('eye', 16)} กำลังดูตัวอย่างมุมมองของ <b>${esc(u.email)}</b> (${esc(u.role)}) — เมนูและแพลตฟอร์มแสดงตามสิทธิ์ของผู้ใช้นี้<button class="btn sm" data-act="stop-acting">กลับเป็นมุมมองของฉัน</button></div>` : ''}
   <div class="title-row"><div><span class="eyebrow-sm">${ic(S.page, 13)} ${esc((PAGES.find(m => m.k === S.page) || {}).sub || '')}</span><h1>${pageTitle()}</h1><p>${pageSub()}</p></div>
    <div class="filters">${['dashboard', 'posts', 'comments', 'audience', 'strategy'].includes(S.page) ? `<button class="btn ghost upd" data-act="refresh" title="ดึงยอดผู้ติดตามล่าสุดและโหลดข้อมูลล่าสุดจากฐานข้อมูล">${ic('refresh', 15)} <span>อัปเดตล่าสุด ${DB.loadedAt ? new Date(DB.loadedAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.' : ''}</span></button>` : ''}${S.page === 'posts' && can('add') ? `${PKEYS.some(p => conn(p).connected) ? `<button class="btn" data-act="sync-all">${ic('refresh', 16)} อัปเดตจากแพลตฟอร์ม</button>` : ''}<button class="btn primary" data-act="go-link">${ic('add', 16)} เพิ่มคอนเทนต์</button>` : ''}</div></div>
   ${['dashboard', 'posts', 'comments', 'audience', 'strategy'].includes(S.page) ? filtersBar() : ''}`);
  syncThumbs($('#topbar'), !SILENT); PB.anim = false;
}
function greet() { const h = new Date().getHours(); return h < 12 ? 'สวัสดีตอนเช้า' : h < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น'; }
function dashInsight() {
  const r = range(); const a = agg(postsIn(r.from, r.to)), b = agg(postsIn(r.pf, r.pt)); const d = r.hasPrev ? delta(a.reach, b.reach) : null;
  const day = new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  if (!DB.posts.length) return day + ' · เริ่มเพิ่มคอนเทนต์เพื่อดูภาพรวมทุกแพลตฟอร์ม';
  return day + ' · ' + (d != null ? `การเข้าถึงช่วงนี้${d >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${Math.abs(d * 100).toFixed(0)}% จากช่วงก่อนหน้า (${a.n} โพสต์)` : `${a.n} โพสต์ในช่วงที่เลือก`);
}
function pageTitle() { return { dashboard: `${greet()}, ${esc(((ME && ME.name) || '').split(/\s+/)[0])}`, posts: 'คอนเทนต์ทั้งหมด', comments: 'ความคิดเห็น', audience: 'ผู้ติดตาม', strategy: 'วิเคราะห์เชิงกลยุทธ์', add: S.editing ? 'แก้ไขคอนเทนต์' : 'เพิ่มคอนเทนต์', connect: 'เชื่อมต่อบัญชี', admin: 'ทีมและสิทธิ์การใช้งาน' }[S.page]; }
function pageSub() { return { strategy: 'ใช้สูตร KPI มาตรฐานด้าน Social & Content กับข้อมูลในฐานข้อมูล พร้อมสรุประดับผู้บริหาร ช่องทาง คอนเทนต์ และโพสต์', dashboard: dashInsight(), posts: 'ผลลัพธ์รายโพสต์จาก Facebook, Instagram และ TikTok เรียงจากล่าสุดไปเก่าสุด', comments: 'ฟังเสียงผู้ติดตาม จัดหมวดความรู้สึก และติดตามการตอบกลับ', audience: 'ใครติดตามเรา อยู่ที่ไหน และเติบโตแค่ไหน', add: 'วางลิงก์ให้ระบบดึงข้อมูล กรอกเอง หรือนำเข้าไฟล์ CSV', connect: 'เชื่อมต่อเพจและบัญชีของหน่วยงาน เพื่อดึงยอดและความคิดเห็นอัตโนมัติ', admin: `อนุญาตเฉพาะอีเมล @${DOMAIN} · กำหนดเมนูและแพลตฟอร์มที่แต่ละคนเข้าถึงได้` }[S.page]; }
function filtersBar() {
  const a = allowedP(), r = range(), showPeriod = S.page !== 'audience';
  const days = Math.round((r.to - r.from) / DAY);
  return `<div class="filters fbar">
   <div class="seg seg-x" role="group" aria-label="แพลตฟอร์ม" data-seg="pl"><span class="seg-thumb" aria-hidden="true"></span>${a.length > 1 ? `<button data-act="fp" data-v="all" aria-pressed="${S.f.platform === 'all'}"><span class="pl-all" aria-hidden="true">${a.map(p => `<i style="background:${PL[p].c}"></i>`).join('')}</span>ทั้งหมด</button>` : ''}${a.map(p => `<button data-act="fp" data-v="${p}" data-c="${PL[p].c}" aria-pressed="${S.f.platform === p || a.length === 1}"><span class="pl-ico" style="--pc:${PL[p].c}">${PL[p].short}</span>${PL[p].name}</button>`).join('')}</div>
   ${showPeriod ? `<div class="seg seg-x" role="group" aria-label="ช่วงเวลา" data-seg="per"><span class="seg-thumb" aria-hidden="true"></span>${PERIODS.filter(([k]) => k !== 'custom').map(([k, t]) => `<button data-act="per" data-v="${k}" aria-pressed="${S.f.period === k}">${t}</button>`).join('')}</div>
   <button class="date-btn${S.f.period === 'custom' ? ' on' : ''}${DP.open ? ' open' : ''}" data-act="dp-open" aria-haspopup="dialog" aria-expanded="${DP.open}" title="เลือกช่วงวันที่เอง">${ic('cal', 16)}<span class="db-t"><b>${rangeText(r)}</b><small>${S.f.period === 'custom' ? 'กำหนดเอง · ' : r.cal === 'year' ? 'ปี พ.ศ. ' + (new Date(r.from).getFullYear() + 543) + ' · ' : r.cal === 'month' ? 'เดือน' + TH_MON[new Date(r.from).getMonth()] + ' · ' : ''}${days} วัน</small></span><svg class="db-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>${pickBar()}` : ''}
  </div>`;
}
/* ---------- แถบเลือกปี / เดือน (แสดงเมื่อเลือก “รายปี” หรือ “รายเดือน”) ---------- */
const PB = { anim: false, viewY: new Date().getFullYear() };
const TH_MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function pbCounts() {
  const ps = activeP(), c = {};
  DB.posts.forEach(x => { if (!ps.includes(x.platform)) return; const d = new Date(x.at), k = d.getFullYear() + '-' + d.getMonth(); c[k] = (c[k] || 0) + 1; c[d.getFullYear()] = (c[d.getFullYear()] || 0) + 1; });
  return c;
}
function pickBar() {
  const per = S.f.period; if (per !== 'year' && per !== 'month') return '';
  const c = pbCounts(), now = new Date(TODAY), cy = now.getFullYear(), cm = now.getMonth(), pk = S.f.pick;
  const yrs = Object.keys(c).filter(k => /^\d{4}$/.test(k)).map(Number);
  const y0 = Math.min(cy - 2, ...(yrs.length ? yrs : [cy])), anim = PB.anim ? ' in' : '';
  const bar = (n, mx) => `<i class="pb-lvl" style="--h:${mx ? Math.max(n ? .12 : 0, n / mx) : 0}"></i>`;
  if (per === 'year') {
    const list = []; for (let y = cy; y >= y0; y--) list.push(y);
    const mx = Math.max(1, ...list.map(y => c[y] || 0));
    return `<div class="pickbar${anim}" id="pickbar"><span class="pb-lab">${ic('cal', 14)} เลือกปี</span>
      <div class="seg seg-x pb-seg" role="group" aria-label="เลือกปี" data-seg="pby"><span class="seg-thumb" aria-hidden="true"></span>
      <button data-act="pick-y" data-v="" aria-pressed="${!pk}"><span class="pb-t">12 เดือนล่าสุด</span><small>ย้อนหลัง 365 วัน</small></button>
      ${list.map(y => `<button data-act="pick-y" data-v="${y}" aria-pressed="${!!pk && pk.y === y}"${c[y] ? '' : ' class="pb-empty"'}><span class="pb-t">${y + 543}</span><small>${c[y] ? fnum(c[y]) + ' โพสต์' : 'ไม่มีโพสต์'}</small>${bar(c[y] || 0, mx)}</button>`).join('')}</div></div>`;
  }
  const vy = PB.viewY = Math.min(cy, Math.max(y0, PB.viewY));
  const mx = Math.max(1, ...TH_MS.map((_, m) => c[vy + '-' + m] || 0));
  return `<div class="pickbar${anim}" id="pickbar"><span class="pb-lab">${ic('cal', 14)} เลือกเดือน</span>
    <div class="pb-year"><button class="pb-arr" data-act="pick-vy" data-v="-1" ${vy <= y0 ? 'disabled' : ''} aria-label="ปีก่อนหน้า">‹</button><b>พ.ศ. ${vy + 543}</b><button class="pb-arr" data-act="pick-vy" data-v="1" ${vy >= cy ? 'disabled' : ''} aria-label="ปีถัดไป">›</button></div>
    <div class="seg seg-x pb-seg pb-months" role="group" aria-label="เลือกเดือน" data-seg="pbm"><span class="seg-thumb" aria-hidden="true"></span>
    <button data-act="pick-m" data-v="" aria-pressed="${!pk}" class="pb-roll"><span class="pb-t">30 วันล่าสุด</span></button>
    ${TH_MS.map((t, m) => { const fut = vy === cy && m > cm, n = c[vy + '-' + m] || 0; return `<button data-act="pick-m" data-v="${m}" aria-pressed="${!!pk && pk.y === vy && pk.m === m}" ${fut ? 'disabled' : ''}${n ? '' : ' class="pb-empty"'} title="${TH_MON[m]} ${vy + 543}${n ? ' · ' + fnum(n) + ' โพสต์' : ''}"><span class="pb-t">${t}</span>${bar(n, mx)}</button>`; }).join('')}</div></div>`;
}
/* ---------- แถบเลือกแบบเลื่อน (ไฮไลต์ไหลไปยังปุ่มที่เลือก) ---------- */
const THUMB = {};
function syncThumbs(root = document, animate = true) {
  $$('.seg[data-seg]', root).forEach(seg => {
    const th = seg.querySelector('.seg-thumb'); if (!th) return;
    const b = seg.querySelector('button[aria-pressed="true"]'); const id = seg.dataset.seg;
    if (!b) { th.style.opacity = 0; delete THUMB[id]; return; }
    const g = { x: b.offsetLeft, y: b.offsetTop, w: b.offsetWidth, h: b.offsetHeight }; const old = THUMB[id];
    const set = q => { th.style.transform = `translate(${q.x}px,${q.y}px)`; th.style.width = q.w + 'px'; th.style.height = q.h + 'px'; };
    th.style.setProperty('--tc', b.dataset.c || 'transparent');
    if (old && animate) { th.style.transition = 'none'; set(old); th.style.opacity = 1; void th.offsetWidth; th.style.transition = ''; set(g); }
    else { th.style.transition = 'none'; set(g); th.style.opacity = 1; void th.offsetWidth; th.style.transition = ''; }
    THUMB[id] = g;
  });
}
window.addEventListener('resize', () => { syncThumbs(document, false); if (DP.open) dpPlace(); });

/* ---------- ปฏิทินเลือกช่วงวันที่ ---------- */
const TH_MON = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_WD = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const DP = { open: false, a: null, b: null, hover: null, view: null, marks: null, anchor: null };
const addMon = (ms, n) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth() + n, 1).getTime(); };
const fmtIn = ms => { if (ms == null) return ''; const d = new Date(ms); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + (d.getFullYear() + 543); };
function parseIn(v) {
  const ok = t => t != null && new Date(t).getFullYear() >= 2000 ? t : null;
  v = String(v || '').trim(); let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/), d, mo, y;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else { m = v.match(/^(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})$/) || v.replace(/\D/g, '').match(/^(\d{2})(\d{2})(\d{4})$/); if (!m) return null; d = +m[1]; mo = +m[2]; y = +m[3]; }
  if (y < 100) y = y >= 50 ? 2500 + y : 2000 + y;
  if (y > 2400) y -= 543;
  const t = new Date(y, mo - 1, d); if (t.getFullYear() !== y || t.getMonth() !== mo - 1 || t.getDate() !== d) return null;
  return ok(t.getTime());
}
const dpTwo = () => window.innerWidth >= 760;
function dpMarks() {
  const ps = activeP(), m = new Set();
  DB.posts.forEach(x => { if (ps.includes(x.platform)) m.add(sod(x.at)); });
  (DB.daily || []).forEach(x => { if (ps.includes(x.platform)) m.add(x._t); });
  return m;
}
const PRESETS = [['day', 'วันนี้'], ['week', '7 วันล่าสุด'], ['month', '30 วันล่าสุด'], ['d90', '90 วันล่าสุด'], ['thism', 'เดือนนี้'], ['lastm', 'เดือนที่แล้ว'], ['thisy', 'ปีนี้'], ['year', '365 วันล่าสุด'], ['all', 'ทั้งหมด']];
function presetRange(k) {
  const d = new Date(TODAY);
  if (k === 'd90') return [TODAY - 89 * DAY, TODAY];
  if (k === 'thism') return [new Date(d.getFullYear(), d.getMonth(), 1).getTime(), TODAY];
  if (k === 'lastm') return [new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime(), new Date(d.getFullYear(), d.getMonth(), 0).getTime()];
  if (k === 'thisy') return [new Date(d.getFullYear(), 0, 1).getTime(), TODAY];
  return null;
}
function dpOpen(anchor) {
  const r = range(); DP.a = r.from; DP.b = Math.min(r.to - DAY, TODAY); DP.hover = null; DP.anchor = anchor; DP.marks = dpMarks();
  DP.view = dpTwo() ? addMon(DP.b, -1) : addMon(DP.b, 0); if (dpTwo() && new Date(DP.a).getMonth() === new Date(DP.b).getMonth() && new Date(DP.a).getFullYear() === new Date(DP.b).getFullYear()) DP.view = addMon(DP.b, -1);
  let el = $('#dp'); if (!el) { el = document.createElement('div'); el.id = 'dp'; document.body.appendChild(el); }
  el.className = 'dp-wrap'; el.innerHTML = dpHtml(); DP.open = true; dpPlace(); void el.offsetWidth; el.classList.add('on');
  const b = $('.date-btn'); if (b) { b.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
  setTimeout(() => { const f = $('#dp .dp-day.start') || $('#dp .dp-day:not([disabled])'); if (f && window.innerWidth > 640) f.focus({ preventScroll: true }); }, 80);
}
function dpClose() {
  if (!DP.open) return; DP.open = false; const el = $('#dp'); if (el) { el.classList.remove('on'); setTimeout(() => { if (!DP.open) el.innerHTML = ''; }, 220); }
  const b = $('.date-btn'); if (b) { b.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }
}
function dpPlace() {
  const el = $('#dp'), pop = $('#dp .dp-pop'), an = $('.date-btn'); if (!el || !pop) return;
  if (window.innerWidth <= 640 || !an) { el.classList.add('sheet'); pop.style.left = pop.style.top = ''; return; }
  el.classList.remove('sheet'); const r = an.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let left = Math.min(r.right - w, window.innerWidth - w - 16); left = Math.max(16, left);
  let top = r.bottom + 10; if (top + h > window.innerHeight - 12 && r.top - h - 10 > 12) top = r.top - h - 10;
  pop.style.left = left + 'px'; pop.style.top = Math.max(12, top) + 'px';
}
function dpMonth(ms, pos) {
  const d = new Date(ms), y = d.getFullYear(), m = d.getMonth(), first = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate();
  const lo = DP.a, hi = DP.b != null ? DP.b : (DP.hover != null ? DP.hover : null);
  const [ra, rb] = hi == null ? [lo, lo] : [Math.min(lo, hi), Math.max(lo, hi)];
  let cells = ''; for (let i = 0; i < first; i++) cells += '<span class="dp-pad"></span>';
  for (let k = 1; k <= n; k++) {
    const t = new Date(y, m, k).getTime(), dis = t > TODAY;
    const cls = ['dp-day', t === ra ? 'start' : '', t === rb ? 'end' : '', t > ra && t < rb ? 'in' : '', t === TODAY ? 'today' : '', DP.marks && DP.marks.has(t) ? 'mk' : '', DP.b == null && DP.hover != null && t >= ra && t <= rb ? 'preview' : ''].filter(Boolean).join(' ');
    cells += `<button type="button" class="${cls}" data-act="dp-day" data-v="${t}" ${dis ? 'disabled' : ''} aria-label="${k} ${TH_MON[m]} ${y + 543}" aria-pressed="${t === ra || t === rb}">${k}</button>`;
  }
  const canNext = addMon(ms, pos === 'l' && dpTwo() ? 2 : 1) <= TODAY;
  return `<div class="dp-month"><div class="dp-mhead">${pos !== 'r' ? `<span class="dp-navs"><button type="button" class="dp-nav" data-act="dp-nav" data-v="-12" aria-label="ปีก่อนหน้า">«</button><button type="button" class="dp-nav" data-act="dp-nav" data-v="-1" aria-label="เดือนก่อนหน้า">‹</button></span>` : '<span></span>'}<b>${TH_MON[m]} ${y + 543}</b>${pos !== 'l' || !dpTwo() ? `<span class="dp-navs"><button type="button" class="dp-nav" data-act="dp-nav" data-v="1" aria-label="เดือนถัดไป" ${canNext ? '' : 'disabled'}>›</button><button type="button" class="dp-nav" data-act="dp-nav" data-v="12" aria-label="ปีถัดไป" ${addMon(ms, 12) <= TODAY ? '' : 'disabled'}>»</button></span>` : '<span></span>'}</div>
    <div class="dp-grid">${TH_WD.map(w => `<span class="dp-wd">${w}</span>`).join('')}${cells}</div></div>`;
}
function dpCal() { return `<div class="dp-months">${dpMonth(DP.view, dpTwo() ? 'l' : 'one')}${dpTwo() ? dpMonth(addMon(DP.view, 1), 'r') : ''}</div>`; }
function dpSum() {
  if (DP.a == null) return 'เลือกวันเริ่มต้น';
  if (DP.b == null) return `<b>${fdate(DP.a)}</b> → เลือกวันสิ้นสุด`;
  const n = Math.round((DP.b - DP.a) / DAY) + 1; return `<b>${DP.a === DP.b ? fdate(DP.a) : `${fds(DP.a)} – ${fdate(DP.b)}`}</b> · ${fnum(n)} วัน`;
}
function dpHtml() {
  return `<div class="dp-bd" data-act="dp-close"></div><div class="dp-pop" role="dialog" aria-modal="false" aria-label="เลือกช่วงวันที่">
   <aside class="dp-presets"><span class="dp-cap">เลือกเร็ว</span>${PRESETS.map(([k, t]) => `<button type="button" data-act="dp-preset" data-v="${k}" class="${S.f.period === k ? 'on' : ''}">${t}</button>`).join('')}</aside>
   <div class="dp-main">
    <div class="dp-inputs"><label class="dp-in"><span>วันเริ่มต้น</span><input id="dp-a" inputmode="numeric" autocomplete="off" placeholder="วว/ดด/ปปปป" value="${fmtIn(DP.a)}" data-input="dp-a" aria-describedby="dp-hint"></label><span class="dp-arrow">${ic('arrow', 16)}</span><label class="dp-in"><span>วันสิ้นสุด</span><input id="dp-b" inputmode="numeric" autocomplete="off" placeholder="วว/ดด/ปปปป" value="${fmtIn(DP.b)}" data-input="dp-b" aria-describedby="dp-hint"></label></div>
    <p class="dp-hint" id="dp-hint">พิมพ์ตัวเลขต่อกันได้เลย เช่น 01092569 · ใช้ปี พ.ศ. หรือ ค.ศ. ก็ได้ · จุดใต้วันที่ = มีโพสต์หรือข้อมูล</p>
    <div id="dp-cal">${dpCal()}</div>
    <div class="dp-foot"><span id="dp-sum">${dpSum()}</span><div class="dp-btns"><button type="button" class="btn ghost" data-act="dp-close">ยกเลิก</button><button type="button" class="btn primary" data-act="dp-apply" ${DP.a == null ? 'disabled' : ''}>ใช้ช่วงวันที่นี้</button></div></div>
   </div></div>`;
}
function dpRefresh(inputsToo) {
  const c = $('#dp-cal'); if (c) c.innerHTML = dpCal(); const sm = $('#dp-sum'); if (sm) sm.innerHTML = dpSum();
  const ap = $('#dp [data-act="dp-apply"]'); if (ap) ap.disabled = DP.a == null;
  if (inputsToo) { const a = $('#dp-a'), b = $('#dp-b'); if (a && document.activeElement !== a) { a.value = fmtIn(DP.a); a.classList.remove('bad'); } if (b && document.activeElement !== b) { b.value = fmtIn(DP.b); b.classList.remove('bad'); } }
}
function dpPick(t) {
  if (DP.a == null || DP.b != null) { DP.a = t; DP.b = null; }
  else if (t < DP.a) { DP.b = DP.a; DP.a = t; }
  else DP.b = t;
  DP.hover = null; dpRefresh(true);
}
function dpTyped(which, el, inputType) {
  if (/\/{2,}/.test(el.value)) el.value = el.value.replace(/\/{2,}/g, '/');
  const v0 = el.value, digits = v0.replace(/\D/g, '');
  // พิมพ์ตัวเลขต่อกัน ระบบใส่ / ให้เอง (ถ้าพิมพ์ / เองหรือกำลังลบ จะไม่ไปแก้ให้)
  const auto = [...v0].every((c, i) => /\d/.test(c) || (c === '/' && (i === 2 || i === 5)));
  if (auto && !/^delete/.test(inputType || '') && digits.length <= 8) {
    const f = digits.slice(0, 2) + (digits.length >= 2 && (digits.length > 2 || /\d$/.test(v0)) ? '/' : '') + digits.slice(2, 4) + (digits.length >= 4 ? '/' : '') + digits.slice(4, 8);
    const g = f.replace(/\/$/, digits.length === 2 || digits.length === 4 ? '/' : '');
    if (g !== v0) el.value = g;
  }
  // ระหว่างพิมพ์ รับเฉพาะปี 4 หลัก (กันปีครึ่งๆ กลางๆ เช่น 20 หรือ 202)
  const yr = (el.value.match(/(\d+)\D*$/) || [])[1] || ''; const full = /\D/.test(el.value.replace(/^\d+/, '')) ? yr.length >= 4 : digits.length >= 8;
  const t = full ? parseIn(el.value) : null;
  el.classList.toggle('bad', full && (!t || t > TODAY)); el.classList.toggle('ok', !!t && t <= TODAY);
  if (!t || t > TODAY) return;
  if (which === 'a') { DP.a = t; if (DP.b != null && DP.b < t) { DP.b = t; const b = $('#dp-b'); if (b) b.value = fmtIn(t); } }
  else { DP.b = t; if (DP.a == null || DP.a > t) { DP.a = t; const a = $('#dp-a'); if (a) a.value = fmtIn(t); } }
  const v = which === 'a' ? DP.a : DP.b; if (v < DP.view || v >= addMon(DP.view, dpTwo() ? 2 : 1)) DP.view = dpTwo() && which === 'b' ? addMon(v, -1) : addMon(v, 0);
  dpRefresh(false);
}
function dpApply() {
  if (DP.a == null) return; const b = DP.b == null ? DP.a : DP.b;
  S.f.period = 'custom'; S.f.from = iso(DP.a); S.f.to = iso(b); dpClose(); refilter();
}
document.addEventListener('mousedown', e => { if (DP.open && !e.target.closest('#dp .dp-pop') && !e.target.closest('.date-btn')) dpClose(); });
document.addEventListener('mouseover', e => { if (!DP.open || DP.a == null || DP.b != null) return; const d = e.target.closest && e.target.closest('#dp .dp-day'); if (!d || d.disabled) return; const t = +d.dataset.v; if (t !== DP.hover) { DP.hover = t; const c = $('#dp-cal'); if (c) c.innerHTML = dpCal(); } });
window.addEventListener('scroll', () => { if (DP.open) dpPlace(); }, { passive: true });
/* ---------- วาดหน้าใหม่แบบเงียบ: เทียบ DOM เดิมกับของใหม่ แล้วแก้เฉพาะจุดที่ต่าง (ไม่กระพริบ ไม่เลื่อนหน้า ไม่เล่นแอนิเมชัน) ---------- */
let SILENT = false, TWEEN = false;
function paint(el, html) { if (!el) return; if ((SILENT || TWEEN) && el.childNodes.length) morph(el, html); else el.innerHTML = html; }
/* ---------- ตัวเลขวิ่งจากค่าเดิม → ค่าใหม่ (ขึ้นหรือลง) เมื่อเปลี่ยนช่วงเวลา/แพลตฟอร์ม ---------- */
const TW = { q: [], raf: 0 };
const TW_CARD = '.kcard, .sa-k, .pf-card, .plat-card, .metric-grid > div, .kp-stats > div, .pm-tile, .stat';
const TW_OK = NUM_SEL + ', .num-cu, .pill, [data-count]';
function twPulse(el, up) {
  if (!el) return; el.classList.remove('mx-up', 'mx-down'); void el.offsetWidth; el.classList.add(up ? 'mx-up' : 'mx-down');
  const c = el.closest(TW_CARD); if (c) { c.classList.remove('mx-chg'); void c.offsetWidth; c.classList.add('mx-chg'); }
}
function twRun(item) {
  item.t0 = performance.now(); TW.q = TW.q.filter(x => x.key !== item.key); TW.q.push(item);
  if (!TW.raf) TW.raf = requestAnimationFrame(function step(t) {
    TW.q = TW.q.filter(x => { const k = Math.max(0, Math.min(1, (t - x.t0) / x.D)), e = 1 - Math.pow(1 - k, 3.2); if (k >= 1) { x.done(); return false; } x.set(x.a + (x.b - x.a) * e); return true; });
    TW.raf = TW.q.length ? requestAnimationFrame(step) : 0;
  });
}
function twCount(el, a, b, fin) {
  const f = el.dataset.fmt, dec = +el.dataset.dec || 0, fmt = v => f === 'pct' ? pct(v, dec) : f === 'n' ? fnum(v) : fk(v);
  el._cu = null; twPulse(el, b >= a);
  twRun({ key: el, a, b, D: 1150, set: v => { el.textContent = fmt(v); }, done: () => { el.textContent = fin; } });
}
function twText(node, nt) {
  const p = node.parentElement, ot = node.nodeValue;
  if (!p || !p.closest(TW_OK) || p.closest(CU_SKIP) || /\d{1,2}:\d{2}|[ก-ฮ]\.[ก-ฮ]\./.test(ot + nt)) return false;
  const P = t => { const m = t.match(/(-?\d[\d,]*(?:\.\d+)?)\s*([KMB](?![a-z]))?/); if (!m) return null; return { v: parseFloat(m[1].replace(/,/g, '')) * ({ K: 1e3, M: 1e6, B: 1e9 }[m[2]] || 1), i: m.index, len: m[0].length, dec: (m[1].split('.')[1] || '').length, comma: /,/.test(m[1]), suf: m[2] || '' }; };
  const a = P(ot), b = P(nt); if (!a || !b || a.v === b.v || !isFinite(a.v) || !isFinite(b.v)) return false;
  const pre = nt.slice(0, b.i), post = nt.slice(b.i + b.len), kfmt = !!(a.suf || b.suf);
  const fmt = v => (v < 0 && pre.endsWith('+') ? pre.slice(0, -1) : pre) + (kfmt ? fk(v) : b.comma ? v.toLocaleString('en-US', { minimumFractionDigits: b.dec, maximumFractionDigits: b.dec }) : v.toFixed(b.dec)) + post;
  twPulse(p, b.v >= a.v);
  twRun({ key: node, a: a.v, b: b.v, D: 1150, set: v => { node.nodeValue = fmt(v); }, done: () => { node.nodeValue = nt; } });
  return true;
}
function morph(live, html) { const t = document.createElement('template'); t.innerHTML = html; mChildren(live, t.content); }
const mKey = n => n.nodeType === 1 ? (n.getAttribute('data-act') || '') + '|' + (n.getAttribute('data-id') || '') + '|' + (n.id || '') + '|' + (n.getAttribute('data-v') || '') + '|' + (n.getAttribute('data-key') || '') : '';
function mNew(tn) { const n = tn.cloneNode(true); if (n.nodeType === 1) { if (SILENT) n._silent = true; else if (TWEEN) n.classList.add('mx-in'); } return n; }
function mChildren(L, T) {
  const tk = Array.from(T.childNodes); let i = 0;
  for (const tn of tk) {
    let ln = L.childNodes[i];
    if (ln && tn.nodeType === 1 && (ln.nodeType !== 1 || mKey(ln) !== mKey(tn))) {
      const k = mKey(tn); const found = k !== '||||' ? Array.from(L.childNodes).slice(i + 1).find(n => n.nodeType === 1 && mKey(n) === k && n.tagName === tn.tagName) : null;
      if (found) { L.insertBefore(found, ln); ln = found; }
    }
    if (!ln) L.appendChild(mNew(tn));
    else if (ln.nodeType !== tn.nodeType || ln.nodeName !== tn.nodeName) L.replaceChild(mNew(tn), ln);
    else mNode(ln, tn);
    i++;
  }
  while (L.childNodes.length > tk.length) L.removeChild(L.lastChild);
}
function mNode(L, T) {
  if (L.nodeType !== 1) { if (L.nodeValue !== T.nodeValue) { const tq = TW.q.find(x => x.key === L); if (tq && tq.done) TW.q = TW.q.filter(x => x !== tq); if (!(TWEEN && twText(L, T.nodeValue))) L.nodeValue = T.nodeValue; } return; }
  const oldC = TWEEN && L.hasAttribute('data-count') ? +L.getAttribute('data-count') : null;
  const keep = L.tagName === 'DETAILS' ? ['open'] : [];
  Array.from(L.attributes).forEach(a => { if (!T.hasAttribute(a.name) && !keep.includes(a.name)) L.removeAttribute(a.name); });
  Array.from(T.attributes).forEach(a => { if (L.getAttribute(a.name) !== a.value) L.setAttribute(a.name, a.value); });
  if (L.tagName === 'INPUT' || L.tagName === 'TEXTAREA') { if (document.activeElement !== L) { if (L.type === 'checkbox' || L.type === 'radio') L.checked = T.hasAttribute('checked'); else if (T.hasAttribute('value') && L.value !== T.getAttribute('value')) L.value = T.getAttribute('value'); } return; }
  if (L.tagName === 'OPTION') L.selected = T.hasAttribute('selected');
  if (oldC != null && T.hasAttribute('data-count')) { const nv = +T.getAttribute('data-count'); if (isFinite(oldC) && isFinite(nv) && oldC !== nv && !L.children.length) { twCount(L, oldC, nv, T.textContent); return; } }
  // กล่องที่ถูกเติมภายหลัง (กราฟ รายการโพสต์) ในแม่แบบจะว่าง — คงของเดิมไว้ แล้วให้ตัววาดของกล่องนั้นอัปเดตเอง
  if (!T.childNodes.length && L.id && L.childNodes.length) return;
  mChildren(L, T);
}
const VIEWS = {};
const AFTER = {};
let viewSeq = 0;
function renderView(mode = 'fade') {
  const v = $('#view'); if (!v) return;
  const my = ++viewSeq;
  if (mode === 'silent') { paint(v, VIEWS[S.page]()); stagger(v); if (AFTER[S.page]) AFTER[S.page](false); return; }
  // เปลี่ยนตัวกรองในหน้าเดิม: จางลงแวบหนึ่ง → แก้เฉพาะจุดที่ต่าง ตัวเลขวิ่งจากค่าเดิมไปค่าใหม่ กราฟค่อยๆ เปลี่ยนรูป → คืนความคมชัด
  if (mode === 'soft' && v.childElementCount && !RM()) {
    clearTimeout(v._mx); v.classList.remove('leaving', 'anim', 'soft', 'dim'); v.classList.add('mx-out');
    setTimeout(() => {
      if (my !== viewSeq) return;
      v.classList.add('mx-run'); TWEEN = true;
      try { paint(v, VIEWS[S.page]()); stagger(v); if (AFTER[S.page]) AFTER[S.page]('soft'); } catch (e) { console.warn(e); } finally { TWEEN = false; }
      requestAnimationFrame(() => v.classList.remove('mx-out'));
      v._mx = setTimeout(() => { v.classList.remove('mx-run'); $$('.mx-in', v).forEach(x => x.classList.remove('mx-in')); }, 1100);
    }, 140);
    return;
  }
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
    if (mode !== 'none') setTimeout(() => { if (my === viewSeq) v.classList.remove('anim', 'soft'); }, 1600);
  };
  if (mode === 'fade' && v.childElementCount) { v.classList.add('leaving'); setTimeout(doRender, 150); }
  else if (mode === 'soft' && v.childElementCount) { v.classList.add('dim'); setTimeout(doRender, 210); }
  else doRender();
}
function go(page, tab) {
  if (!can(page)) return;
  if (page === 'add' && (S.page !== 'add' || tab)) { S.catTouched = false; S.editing = null; S.parsed = []; S.img = null; S.addTab = tab || 'link'; if (tab !== 'post') S.prefill = null; }
  S.page = page; S.person = null; closeDrawer(); dpClose();
  $$('#side .nav button').forEach(b => b.dataset.v === page ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  renderTop(); renderView('fade'); renderFab(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
function refilter() { TWEEN = true; try { renderTop(); } finally { TWEEN = false; } renderView('soft'); }

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
  { k: 'unfollows', t: 'การเลิกติดตาม', en: 'Unfollows', ic: 'x' },
  { k: 'targetedReaches', t: 'กลุ่มเป้าหมายที่ส่งถึงได้', en: 'Targeted reaches (LINE)', ic: 'target', last: true },
  { k: 'delivered', t: 'ข้อความที่ส่งออก', en: 'Messages delivered (LINE)', ic: 'mail' },
  { k: 'blocks', t: 'จำนวนที่บล็อก (สะสม)', en: 'Blocks (LINE)', ic: 'lock', last: true }
];
const PM = Object.fromEntries(PAGE_M.map(m => [m.k, m]));
const PAGE_GUESS = [['unfollows', /เลิกติดตาม|unfollow/i], ['follows', /ติดตาม|follow/i], ['linkClicks', /คลิกลิงก์|link.?click/i], ['visits', /เข้าชม|visit/i], ['interactions', /โต้ตอบ|interaction|engagement|มีส่วนร่วม/i], ['viewers', /ผู้ชม|viewer|reach|เข้าถึง/i], ['views', /ยอดดู|view|impression|การดู/i]];
const guessPageMetric = t => (PAGE_GUESS.find(([, re]) => re.test(t || '')) || [null])[0];
const dailyIn = (from, to, ps) => DB.daily.filter(d => ps.includes(d.platform) && d._t >= from && d._t < to);
const dsum = (l, k) => l.some(d => d[k] != null) ? l.reduce((s, d) => s + n0(d[k]), 0) : null;
// ค่าสะสม (เช่น กลุ่มเป้าหมาย LINE, จำนวนบล็อก) ใช้ค่าล่าสุดในช่วง ไม่รวมทุกวัน
const dval = (l, k) => { if (!(PM[k] && PM[k].last)) return dsum(l, k); const by = {}; l.forEach(d => { if (d[k] != null && (!by[d.platform] || by[d.platform]._t < d._t)) by[d.platform] = d; }); const v = Object.values(by); return v.length ? v.reduce((s, d) => s + d[k], 0) : null; };
function pageSection(r, ps, fol) {
  const all = DB.daily.filter(d => ps.includes(d.platform)); if (!all.length) return '';
  const have = PAGE_M.filter(m => all.some(d => d[m.k] != null)); if (!have.length) return '';
  if (!have.some(m => m.k === S.pdm)) S.pdm = have[0].k;
  const cur = dailyIn(r.from, r.to, ps), prev = r.hasPrev ? dailyIn(r.pf, r.pt, ps) : [];
  const minT = Math.min(...all.map(d => d._t)), maxT = Math.max(...all.map(d => d._t));
  const days = [...new Set(cur.map(d => d.date))].length;
  const tiles = have.map(m => { const v = dval(cur, m.k), pv = dval(prev, m.k); const d = v != null && pv != null ? delta(v, pv) : null;
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
  const series = ps.map(p => ({ name: `${m.t} · ${PL[p].name}`, color: ps.length > 1 ? PL[p].c : 'var(--accent)', values: B.b.map(b => n0(dval(dailyIn(b.s, b.e, [p]), k))) }));
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
    eng: per(l => l.reduce((s, x) => s + engP(x), 0)), er: per(l => agg(l).er || 0), rep: per(l => n0(cstats(l).replyRate))
  };
  const k = (key, icon, label, en, val, d, sub, series) => `<article class="kcard"><div class="kc-top"><span class="kc-ic">${ic(icon, 16)}</span><span class="k-label">${label}<small>${en}</small></span>${r.hasPrev ? dpill(d) : ''}</div><div class="k-val">${val}</div><div class="kc-foot"><span class="k-sub">${sub || ''}</span>${spark(series, 'var(--accent)', 92, 30)}</div></article>`;
  const LN = ps.length === 1 && ps[0] === 'line';
  const tiles = [
    fNow != null && k('kpi-fol', 'audience', 'ผู้ติดตามทั้งหมด', 'Followers', cnt(fNow, 'k', null, 'kpi-fol'), delta(gain, gainPrev), gain ? `+${fk(gain)} ในช่วงนี้` : 'ยอดล่าสุด', sp.fol),
    A_.reach > 0 && k('kpi-reach', 'target', LN ? 'ส่งถึง' : 'การเข้าถึง', LN ? 'Delivered' : 'Reach', cnt(A_.reach, 'k', null, 'kpi-reach'), delta(A_.reach, B.reach), `จาก ${A_.n} โพสต์`, sp.reach),
    A_.impressions > 0 && k('kpi-imp', 'eye', LN ? 'เปิดอ่าน' : 'การมองเห็น', LN ? 'Unique opens' : 'Views', cnt(A_.impressions, 'k', null, 'kpi-imp'), delta(A_.impressions, B.impressions), r.hasPrev ? 'เทียบช่วงก่อนหน้า' : 'ทั้งหมด', sp.imp),
    A_.eng > 0 && k('kpi-eng', 'heart', LN ? 'คนที่คลิก' : 'การมีส่วนร่วม', LN ? 'Unique clicks' : 'Engagement', cnt(A_.eng, 'k', null, 'kpi-eng'), delta(A_.eng, B.eng), LN ? 'คลิกลิงก์หรือปุ่มในข้อความ' : ps.includes('line') ? 'ถูกใจ ความคิดเห็น แชร์ บันทึก (LINE นับคลิก)' : 'ถูกใจ ความคิดเห็น แชร์ บันทึก', sp.eng),
    A_.er > 0 && k('kpi-er', 'percent', LN ? 'อัตราคลิก' : 'อัตราการมีส่วนร่วม', LN ? 'Click rate' : 'Engagement rate', cnt(A_.er, 'pct', 2, 'kpi-er'), delta(A_.er, B.er), 'ต่อการเข้าถึง', sp.er),
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
  const hasEngParts = cur.some(x => ENG_PARTS.some(e2 => n0(x.m[e2.k]) > 0));
  const row2 = !hasEngParts && !C.total ? '' : `<div class="${C.total && hasEngParts ? 'grid-main' : 'stack'}" data-stagger>
    ${hasEngParts ? `<section class="panel"><div class="panel-head"><div><h2>องค์ประกอบของการมีส่วนร่วม</h2><p>ถูกใจ ความคิดเห็น แชร์ และบันทึก ในแต่ละช่วงเวลา</p></div></div>
      <div class="chart" id="ch-eng"></div><div class="legend">${ENG_PARTS.map(x => `<span><i style="background:${x.c}"></i>${x.t}</span>`).join('')}</div></section>` : ''}
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

  const top = [...cur].sort((a, b) => engP(b) - engP(a)).slice(0, 5);
  const topRow = `<section class="panel"><div class="panel-head"><div><h2>โพสต์ที่โดดเด่น</h2><p>5 อันดับตามการมีส่วนร่วมในช่วงที่เลือก</p></div>${can('posts') ? `<button class="btn sm" data-act="nav" data-v="posts">ดูคอนเทนต์ทั้งหมด</button>` : ''}</div>
    ${top.length ? `<div class="top-grid" data-stagger>${top.map((p, i) => `<button class="top-card" data-act="open" data-id="${p.id}"><span class="rank">${i + 1}</span>${thumb(p)}<div class="tc-body"><div class="tc-meta"><i class="dot" style="background:${PL[p.platform].c}"></i>${PL[p.platform].name} · ${fds(p.at)}</div><p>${esc(p.caption)}</p><div class="tc-stats"><span>${ic('heart', 12)} ${fk(engP(p))}</span><span>${ic('target', 12)} ${fk(p.m.reach)}</span><span>${p.m.reach ? pct(engP(p) / p.m.reach, 1) : '—'}</span></div></div></button>`).join('')}</div>` : emptyState('ยังไม่มีโพสต์ในช่วงนี้', 'ลองเปลี่ยนช่วงเวลาด้านบน หรือเพิ่มคอนเทนต์ใหม่')}
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
    const l = postsIn(b.s, b.e, [p]); return k === 'eng' ? l.reduce((s, x) => s + engP(x), 0) : l.reduce((s, x) => s + n0(x.m[k]), 0);
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
  const s = { new: (a, b) => b.at - a.at, old: (a, b) => a.at - b.at, reach: (a, b) => n0(b.m.reach) - n0(a.m.reach), eng: (a, b) => engP(b) - engP(a), cmt: (a, b) => n0(b.m.comments) - n0(a.m.comments) }[pf.sort];
  return l.sort(s);
}
function renderPostList(animate) {
  const el = $('#post-list'); if (!el) return; const l = filteredPosts();
  $('#pcount').textContent = `พบ ${l.length} โพสต์ · ${rangeText(range())}`;
  if (!SILENT) { el.classList.remove('anim'); if (animate) { void el.offsetWidth; el.classList.add('anim'); } }
  if (!l.length) {
    paint(el, DB.posts.length ? `<div class="panel">${emptyState('ไม่พบโพสต์ตามตัวกรองนี้', 'ลองเปลี่ยนช่วงเวลาเป็น “ทั้งหมด” หรือล้างคำค้นและตัวกรอง', `<button class="btn" data-act="per" data-v="all">ดูทุกช่วงเวลา</button>`)}</div>`
      : `<div class="panel">${emptyState('ยังไม่มีโพสต์ในระบบ', 'เพิ่มโพสต์ทีละรายการ หรือนำเข้าไฟล์ CSV ที่ Export จาก Meta Business Suite / TikTok Studio', can('add') ? `<button class="btn" data-act="go-csv">${ic('file', 15)} นำเข้า CSV</button><button class="btn primary" data-act="nav" data-v="add">${ic('add', 15)} เพิ่มโพสต์</button>` : '')}</div>`);
    return;
  }
  if (S.pf.view === 'grid') {
    paint(el, `<div class="post-grid" data-stagger>${l.map(p => `<button class="post-card" data-act="open" data-id="${p.id}"><div class="thumb-wrap">${thumb(p)}</div><div class="pc-body"><div class="pc-meta">${platChip(p.platform)}${catChip(p.cat)}<span class="pc-date">${fdate(p.at)}</span></div><p>${esc(p.caption)}</p>
      <div class="pc-metrics"><div><small>Reach</small><b>${fk(p.m.reach)}</b></div><div><small>${p.v ? 'Views' : 'Impr.'}</small><b>${fk(p.v ? p.v.videoViews : p.m.impressions)}</b></div><div><small>Eng.</small><b>${fk(engP(p))}</b></div><div><small>คอมเมนต์</small><b>${fk(p.m.comments)}</b></div></div>${postSrc(p)}</div></button>`).join('')}</div>`);
  } else {
    paint(el, `<div class="tbl-wrap post-list"><table class="tbl"><thead><tr><th>โพสต์</th><th>แพลตฟอร์ม</th><th>ประเภท</th><th>หมวดหมู่</th><th>วันที่</th><th class="r">Reach</th><th class="r">Impr./Views</th><th class="r">Reactions</th><th class="r">Comments</th><th class="r">Shares</th><th class="r">Saves</th><th class="r">ER</th></tr></thead><tbody data-stagger>
    ${l.map(p => `<tr class="click" data-act="open" data-id="${p.id}"><td><div class="cell-post">${thumb(p, 1)}<p style="white-space:normal">${esc(p.caption)}</p></div></td><td>${platChip(p.platform)}</td><td>${esc(p.type)}</td><td>${catChip(p.cat)}</td><td>${fdt(p.at)}</td><td class="r num">${fk(p.m.reach)}</td><td class="r num">${fk(p.v ? p.v.videoViews : p.m.impressions)}</td><td class="r num">${fk(p.m.reactions)}</td><td class="r num">${fk(p.m.comments)}</td><td class="r num">${fk(p.m.shares)}</td><td class="r num">${fk(p.m.saves)}</td><td class="r num">${p.m.reach ? pct(engP(p) / p.m.reach, 2) : '—'}</td></tr>`).join('')}
    </tbody></table></div>`);
  }
  stagger(el);
}

function postSrc(p, long) {
  if (p.source === 'api') return `<span class="src api${p.syncError ? ' err' : ''}" title="${esc(p.syncError || ('อัปเดตล่าสุด ' + (p.syncedAt ? fdt(p.syncedAt) : '')))}">${ic('refresh', 11)} ${long ? 'ดึงจาก ' + PL[p.platform].name + ' · ' : ''}${p.syncError ? 'อัปเดตไม่สำเร็จ' : 'อัปเดต ' + ago(p.syncedAt)}</span>`;
  return `<span class="src man">${ic(p.source === 'csv' ? 'file' : 'edit', 11)} ${p.source === 'csv' ? 'นำเข้า CSV' : 'กรอกเอง'}</span>`;
}
/* ================= post drawer ================= */
const LINK_PH = { fb: 'https://www.facebook.com/…', ig: 'https://www.instagram.com/p/…', tt: 'https://www.tiktok.com/@…/video/…', line: 'เว้นว่างได้ — หรือวางลิงก์ LINE VOOM / ลิงก์ในข้อความ', x: 'https://x.com/บัญชี/status/…' };
function plNote(p) {
  return p === 'line' ? 'LINE OA: ดูตัวเลขได้ที่ LINE OA Manager → วิเคราะห์ → ข้อความ · ช่อง “ส่งถึง” “เปิดอ่าน” “คลิก” คือหลักของ LINE ส่วนถูกใจ/แชร์/บันทึก ไม่มีใน LINE ให้เว้นว่าง'
    : p === 'x' ? 'X: ดูได้ที่ Post analytics ของแต่ละโพสต์ · Reposts + Quotes รวมกันในช่อง Shares · Bookmarks ใส่ช่อง Saves' : '';
}
const MROWS = [['reach', 'Reach'], ['impressions', 'Impressions / Views'], ['reactions', 'Likes / Reactions'], ['comments', 'Comments'], ['shares', 'Shares'], ['saves', 'Saves'], ['clicks', 'Clicks'], ['profileVisits', 'Profile Visits'], ['newFollowers', 'New Followers'], ['linkClicks', 'Link Clicks']];
function openPost(id) {
  S.openPost = id; S.drawerCat = ''; S.delPost = false;
  const d = $('#drawer'); d.setAttribute('aria-hidden', 'false'); d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-labelledby', 'drawer-title'); d.innerHTML = ''; renderDrawer(true);
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => { d.classList.add('on'); $('#backdrop').classList.add('on'); });
  setTimeout(() => { const b = $('#drawer .pop-x'); if (b) b.focus(); }, 80);
}
function closeDrawer() { const was = S.openPost; S.openPost = null; const d = $('#drawer'); if (!d) return; d.classList.remove('on'); $('#backdrop').classList.remove('on'); d.setAttribute('aria-hidden', 'true'); if (was && !$('#kpop.on') && !$('#modal.on')) document.body.classList.remove('modal-open'); }
function renderDrawer(animate) {
  const p = DB.posts.find(x => x.id === S.openPost); const d = $('#drawer'); if (!p) { closeDrawer(); return; }
  const scB = $('#drawer .pop-body'), sc0 = scB ? scB.scrollTop : 0;
  const C = cstats([p]); const v = p.v;
  const af = p.apiFields || []; const apiTag = k => af.includes(k) ? '<i class="api-dot" title="ดึงจาก API"></i>' : '';
  const mRows = MROWS.filter(([k]) => p.m[k] != null && p.m[k] !== 0);
  const vRows = v ? [['Video Views', v.videoViews, fnum], ['Average Watch Time', v.avgWatch, fdur], ['Total Watch Time', v.totalWatch, fdur], ['Completion Rate', v.completion, x => pct(x, 1)]].filter(([, x]) => x != null && x !== 0) : [];
  const missing = MROWS.filter(([k]) => (!MREL[p.platform] || MREL[p.platform].includes(k)) && !(p.m[k] != null && p.m[k] !== 0)).map(([k]) => ML(p.platform, k));
  const mg = mRows.map(([k]) => `<div><small>${ML(p.platform, k)}${apiTag(k)}</small><b>${fnum(p.m[k])}</b></div>`).join('') +
    (p.platform === 'line' ? (p.m.reach && p.m.impressions ? `<div><small>อัตราเปิดอ่าน</small><b>${pct(p.m.impressions / p.m.reach, 1)}</b></div>` : '') + (p.m.impressions && p.m.clicks ? `<div><small>อัตราคลิก (CTR)</small><b>${pct(p.m.clicks / p.m.impressions, 1)}</b></div>` : '')
      : p.m.reach ? (engP(p) > p.m.reach ? `<div class="mg-warn" title="Engagement มากกว่า Reach — ค่า Reach อาจกรอกผิดหรือไฟล์ไม่มีค่า Reach"><small>Engagement rate ${ic('alert', 12)}</small><b>${pct(engP(p) / p.m.reach, 2)}</b><em>Reach (${fnum(p.m.reach)}) น้อยกว่า Engagement (${fnum(engP(p))}) — ตรวจค่า Reach</em></div>` : `<div><small>Engagement rate</small><b>${pct(engP(p) / p.m.reach, 2)}</b></div>`) : p.platform === 'x' && p.m.impressions ? `<div><small>Engagement rate</small><b>${pct(engP(p) / p.m.impressions, 2)}</b></div>` : '') +
    vRows.map(([t, x, f]) => `<div><small>${t}</small><b>${f(x)}</b></div>`).join('');
  const base = v && Math.max(n0(v.s3), n0(v.videoViews));
  const ret = v && base ? [['3-second views', v.s3], ['5-second views', v.s5], ['10-second views', v.s10], ['ดูถึง 25%', v.p25], ['ดูถึง 50%', v.p50], ['ดูถึง 75%', v.p75], ['ดูจบ 100%', v.p100]].filter(([, x]) => x != null).map(([l, x]) => ({ l, v: x, ext: pct(x / base, 0) })) : null;
  const list = p.comments.filter(c => !S.drawerCat || c.cat === S.drawerCat);
  const canEdit = can('add');
  paint(d, `${PENG_PEEK}<div class="pop-card"><div class="pop-head drawer-head"><span class="pop-ic" style="--gc:${PL[p.platform].c}">${PL[p.platform].short}</span><div class="pop-ttl"><small>${PL[p.platform].name} · ${esc(p.type)} · ${fdate(p.at)}</small><h2 id="drawer-title">${esc(p.caption)}</h2></div><div class="pop-acts">
    ${canEdit ? `<button class="btn sm" data-act="edit-post" data-id="${p.id}">${ic('edit', 14)} แก้ไข</button>${S.delPost ? `<button class="btn sm danger" data-act="del-post-yes" data-id="${p.id}">ยืนยันลบ</button><button class="btn sm" data-act="del-post-no">ยกเลิก</button>` : `<button class="btn sm danger" data-act="del-post">ลบ</button>`}` : ''}</div><button class="pop-x" data-act="close-drawer" aria-label="ปิดหน้าต่าง">${ic('x', 20)}</button></div>
   <div class="pop-body drawer-body${animate && !SILENT ? ' anim' : ''}" data-stagger>
    <div class="pd-top">${thumb(p)}<div class="pd-info"><div style="display:flex;gap:6px;flex-wrap:wrap">${platChip(p.platform)}${typeChip(p.type)}${catChip(p.cat)}</div>
      <p>${esc(p.caption)}</p><span class="note">โพสต์เมื่อ ${fdt(p.at)}${v && v.duration ? ` · ความยาว ${fdur(v.duration)}` : ''}${p.createdBy ? ` · บันทึกโดย ${esc(p.createdBy)}` : ''}</span>
      <a class="pd-link" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">${ic('link', 14)} ${esc(p.link)}</a></div></div>
    <div class="syncbar${p.source === 'api' ? ' api' : ''}"><div>${p.source === 'api' ? `<b>${ic('refresh', 14)} ดึงข้อมูลจาก ${PL[p.platform].name}</b><span>อัปเดตล่าสุด ${p.syncedAt ? fdt(p.syncedAt) + ' น. (' + ago(p.syncedAt) + ')' : '—'}</span>` : `<b>${ic(p.source === 'csv' ? 'file' : 'edit', 14)} ${p.source === 'csv' ? 'นำเข้าจากไฟล์ CSV' : 'กรอกข้อมูลเอง'}</b><span>${conn(p.platform).connected ? 'กดดึงข้อมูลเพื่อให้ระบบอัปเดตตัวเลขและความคิดเห็นจากแพลตฟอร์ม' : (p.source === 'csv' ? 'ตัวเลขชุดนี้มาจากไฟล์ CSV ที่นำเข้า' + (p.importedAt ? ' เมื่อ ' + fdt(p.importedAt) : '') + ' · เชื่อมต่อ ' + PL[p.platform].name + ' เพื่อให้อัปเดตอัตโนมัติ' : PL[p.platform].name + ' ยังไม่ได้เชื่อมต่อ — ตัวเลขชุดนี้มาจากการกรอกเอง')}</span>`}${p.syncError ? `<span class="warn-t">อัปเดตครั้งล่าสุดไม่สำเร็จ: ${esc(p.syncError)}</span>` : ''}</div>
     ${canSync(p) ? `<button class="btn sm primary" data-act="sync-post" data-id="${p.id}">${ic('refresh', 14)} ${p.source === 'api' ? 'อัปเดตข้อมูล' : 'ดึงข้อมูลจากลิงก์'}</button>` : ''}</div>
    <section><div class="panel-head"><div><h2>ตัวชี้วัดของโพสต์</h2>${af.length ? `<p><i class="api-dot"></i> ดึงจาก API · ช่องที่เหลือมาจากการกรอกเอง</p>` : ''}</div></div><div class="metric-grid">${mg}</div>${missing.length ? `<p class="note" style="margin:8px 0 0">ไม่มีข้อมูล: ${missing.join(', ')}</p>` : ''}</section>
    ${p.reactionsBreakdown ? (() => { const rb = p.reactionsBreakdown, tot = REACTIONS.reduce((s, x) => s + n0(rb[x.k]), 0); return tot ? `<section class="panel"><div class="panel-head"><div><h2>ความรู้สึกที่ผู้ติดตามกด</h2><p>${fnum(tot)} ครั้ง แยกตามอิโมจิ</p></div></div><div class="react-row">${REACTIONS.map(x => `<div class="react"><span class="re">${x.e}</span><b>${fnum(rb[x.k])}</b><small>${x.t} · ${pct(n0(rb[x.k]) / tot, 0)}</small></div>`).join('')}</div></section>` : ''; })() : ''}
    ${ret ? `<section class="panel"><div class="panel-head"><div><h2>การรับชมวิดีโอ (Retention)</h2><p>สัดส่วนเทียบกับยอดรับชมทั้งหมด</p></div></div>${barList(ret, { c: PL[p.platform].c, fmt: fnum })}</section>` : ''}
    ${p.platform === 'line' ? `<div class="callout">${ic('comments', 16)}<div>LINE OA เป็นข้อความส่งถึงเพื่อนแบบตัวต่อตัว ไม่มีความคิดเห็นสาธารณะ · ดูการตอบกลับได้ที่แชทใน LINE OA Manager</div></div>` : `<section class="panel"><div class="panel-head"><div><h2>ความคิดเห็นของโพสต์นี้</h2><p>${C.total} ความคิดเห็นหลัก · ตอบกลับ ${pct(C.replyRate, 0)} · บทสนทนาต่อเนื่อง ${pct(C.convoRate, 0)} · ตอบเฉลี่ยใน ${fmins(C.avgRT)}</p></div></div>
     ${stack100(C.by)}
     <div class="filters" style="margin-top:16px"><button class="chip" data-act="dcat" data-v="" aria-pressed="${!S.drawerCat}">ทั้งหมด ${p.comments.length}</button>${SENT.filter(s => C.by[s.k]).map(s => `<button class="chip" data-act="dcat" data-v="${s.k}" aria-pressed="${S.drawerCat === s.k}"><i class="dot" style="background:${s.c}"></i>${s.t} ${C.by[s.k]}</button>`).join('')}</div>
     <div style="margin-top:6px" id="dlist">${list.map(c => cmtItem(c)).join('') || emptyState(p.comments.length ? 'ไม่มีความคิดเห็นในหมวดนี้' : 'ยังไม่มีความคิดเห็น', p.comments.length ? 'เลือกหมวดอื่นด้านบน' : p.platform === 'tt' && p.source === 'api' ? 'TikTok ไม่เปิดให้ดึงรายการความคิดเห็น เพิ่มเองได้จากปุ่ม “แก้ไข”' : canSync(p) ? 'กด “ดึงข้อมูล” ด้านบนเพื่อดึงความคิดเห็นทั้งหมด หรือเพิ่มเองจากปุ่ม “แก้ไข”' : 'เพิ่มความคิดเห็นได้จากปุ่ม “แก้ไข” แล้ววางข้อความทีละบรรทัด')}</div>
    </section>`}
   </div></div>`);
  stagger(d); if (!animate) { const b2 = $('#drawer .pop-body'); if (b2) b2.scrollTop = sc0; }
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
  paint(el, `<span class="note">${l.length} รายการ${l.length > 80 ? ' · แสดง 80 รายการล่าสุด' : ''}</span>${l.slice(0, 80).map(c => cmtItem(c.ref, c.post)).join('') || '<div class="empty" style="margin-top:10px">ไม่พบความคิดเห็นตามตัวกรองนี้</div>'}`);
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
   ${(() => { const co = mergeAud(ps, 'country'), la = mergeAud(ps, 'lang');
     const P = [co && `<section class="panel"><div class="panel-head"><div><h2>ประเทศ</h2></div></div>${audBars(co, 'var(--accent-2)')}${nm('country')}</section>`,
      prov && `<section class="panel"><div class="panel-head"><div><h2>จังหวัด</h2>${ps.some(p => audOf(p).source === 'csv' && audOf(p).city) ? '<p>รวมจากเมืองยอดนิยมในไฟล์</p>' : ''}</div></div>${audBars(prov, 'var(--accent-2)')}${nm('province')}</section>`,
      city && `<section class="panel"><div class="panel-head"><div><h2>เมือง / อำเภอ</h2></div></div>${audBars(city, 'var(--accent-2)')}${nm('city')}</section>`,
      la && `<section class="panel"><div class="panel-head"><div><h2>ภาษา</h2></div></div>${audBars(la, 'var(--accent-2)')}${nm('lang')}</section>`,
      newA != null && `<section class="panel"><div class="panel-head"><div><h2>ผู้ชมใหม่ / ผู้ชมเดิม</h2><p>New vs Returning audience</p></div></div>${split(newA, 'ผู้ชมใหม่', 'กลับมาดูซ้ำ')}</section>`,
      fo != null && `<section class="panel"><div class="panel-head"><div><h2>ผู้ติดตาม / ไม่ใช่ผู้ติดตาม</h2><p>สัดส่วนของ Reach</p></div></div>${split(fo, 'ผู้ติดตาม', 'ไม่ใช่ผู้ติดตาม')}</section>`].filter(Boolean);
     const miss = [!co && 'ประเทศ', !prov && 'จังหวัด', !city && 'เมือง', !la && 'ภาษา', newA == null && 'ผู้ชมใหม่/เดิม', fo == null && 'สัดส่วนผู้ติดตามใน Reach'].filter(Boolean);
     let out = ''; for (let q = 0; q < P.length; q += 3) { const g = P.slice(q, q + 3); out += `<div class="${g.length === 3 ? 'grid-3' : g.length === 2 ? 'grid-2' : 'stack'}">${g.join('')}</div>`; }
     return out + (miss.length && hasAny ? `<p class="note" style="margin:0">ยังไม่มีข้อมูล: ${miss.join(' · ')} — แพลตฟอร์มไม่เปิดเผย หรือยังไม่ได้บันทึก</p>` : ''); })()}
   ${(() => { const at = mergeAud(ps, 'appType'), tn = mergeAud(ps, 'tenure'); if (!at && !tn) return ''; const order = ['ไม่ถึง 7 วัน', '7–30 วัน', '1–3 เดือน', '3–6 เดือน', '6–12 เดือน', 'มากกว่า 1 ปี', 'ไม่ทราบ'];
     const tnList = tn ? order.filter(k => tn[k] != null).map(k => ({ l: k, v: tn[k], c: 'var(--lineoa)' })) : [];
     return `<div class="grid-2"><section class="panel"><div class="panel-head"><div><h2>ระบบปฏิบัติการ</h2><p>LINE OA · สัดส่วนเพื่อนที่ใช้ iOS / Android</p></div></div>${at ? audBars(at, 'var(--lineoa)') : '<div class="empty">ไม่มีข้อมูล</div>'}</section>
      <section class="panel"><div class="panel-head"><div><h2>ระยะเวลาที่เป็นเพื่อน</h2><p>LINE OA · ช่วยดูว่าเพื่อนใหม่หรือเพื่อนเก่าเป็นกลุ่มหลัก</p></div></div>${tnList.length ? barList(tnList, { fmt: v => pct(v, 1) }) : '<div class="empty">ไม่มีข้อมูล</div>'}</section></div>`; })()}
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
     <div class="field wide"><label for="a-link">${pl === 'line' ? 'ลิงก์ (ไม่บังคับสำหรับ LINE OA)' : 'ลิงก์โพสต์'}</label><input class="input" type="url" id="a-link" placeholder="${LINK_PH[pl] || 'https://'}" value="${esc(e ? e.link : pf ? pf.link : '')}"><span class="err-msg" id="err-link" hidden>ใส่ลิงก์ที่ขึ้นต้นด้วย https:// เช่น ลิงก์ที่คัดลอกจากปุ่มแชร์ของโพสต์</span></div>
     <div class="field wide"><label for="a-cap">ข้อความโพสต์ / ชื่อโพสต์</label><input class="input" id="a-cap" data-input="acap" placeholder="เช่น Open House 2026 เปิดบ้านให้น้อง ม.ปลาย" value="${esc(e ? e.caption : '')}"><span class="err-msg" id="err-cap" hidden>ใส่ชื่อหรือข้อความโพสต์เพื่อใช้ค้นหาภายหลัง</span></div>
     <div class="field wide"><span class="lbl">ภาพโพสต์</span><label class="upload" for="a-img" id="drop">${img ? `<img src="${esc(img)}" alt="ภาพโพสต์ที่เลือก" referrerpolicy="no-referrer">` : ic('upload', 28)}<div><b>${img ? 'เปลี่ยนภาพ' : 'อัปโหลดภาพหรือภาพหน้าปกวิดีโอ'}</b><div class="note">JPG, PNG หรือ WEBP · ลากไฟล์มาวางหรือคลิกเพื่อเลือก${API.demo ? '' : ' · เก็บไว้ใน Google Drive'}</div></div></label><input type="file" id="a-img" accept="image/*" data-change="aimg" class="sr"></div>
    </div></section>
   <section class="form-sec"><h3><span class="n">2</span>ตัวชี้วัดของโพสต์</h3><p>คัดลอกจาก Meta Business Suite หรือ TikTok Studio · เว้นว่างได้หากแพลตฟอร์มไม่มีข้อมูล</p>
    <div class="fgrid">${MROWS.map(([k]) => num('m-' + k, `<span data-ml="${k}">${ML(pl, k)}</span>`, val(k), k === 'comments' && pl !== 'line' ? 'เว้นว่างเพื่อนับจากความคิดเห็นที่บันทึก' : '').replace('<div class="field">', `<div class="field" data-mk="${k}"${MREL[pl] && !MREL[pl].includes(k) && !val(k) ? ' hidden' : ''}>`)).join('')}</div>
    <p class="note" id="pl-note" style="margin:10px 0 0">${plNote(pl)}</p></section>
   <div class="collapse${isV ? '' : ' closed'}" id="vid-sec"><div><section class="form-sec"><h3><span class="n">3</span>ตัวชี้วัดวิดีโอ</h3><p>แสดงเมื่อเลือกประเภท Reel, Short Video, Long Video, Story หรือ Live</p>
    <div class="fgrid">${num('v-duration', 'ความยาววิดีโอ (วินาที)', vv('duration'))}${num('v-videoViews', 'Video Views', vv('videoViews'))}${num('v-avgWatch', 'Average Watch Time (วินาที)', vv('avgWatch'))}${num('v-totalWatch', 'Total Watch Time (วินาที)', vv('totalWatch'), 'เว้นว่างเพื่อคำนวณ Views × Avg')}${num('v-completion', 'Completion Rate (%)', e && e.v && e.v.completion != null ? (e.v.completion * 100).toFixed(1) : '', 'เว้นว่างเพื่อคำนวณจาก 100% ÷ 3 วินาที')}
     ${num('v-s3', '3-second views', vv('s3'))}${num('v-s5', '5-second views', vv('s5'))}${num('v-s10', '10-second views', vv('s10'))}${num('v-p25', 'ดูถึง 25%', vv('p25'))}${num('v-p50', 'ดูถึง 50%', vv('p50'))}${num('v-p75', 'ดูถึง 75%', vv('p75'))}${num('v-p100', 'ดูจบ 100%', vv('p100'))}</div></section></div></div>
   <section class="form-sec" id="cmt-sec"${pl === 'line' ? ' hidden' : ''}><h3><span class="n">${isV ? 4 : 3}</span>ความคิดเห็น</h3><p>วางความคิดเห็นทีละบรรทัดในรูปแบบ <span class="kbd">ชื่อ: ข้อความ</span> ระบบจะจัดหมวดให้อัตโนมัติ แล้วแก้หมวดเองได้ก่อนบันทึก${e ? ` · โพสต์นี้มี ${e.comments.length} ความคิดเห็นอยู่แล้ว รายการใหม่จะเพิ่มต่อท้าย` : ''}</p>
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
  ['at', [/วันที่ส่ง|เวลาที่ส่ง|sent (date|time|at)|delivery date|publish(ed)? ?(time|date)|เวลา(ที่)?เผยแพร่|วันที่เผยแพร่|วันที่โพสต์|เวลาโพสต์|post(ed)? ?(time|date|on)|create(d| time)/, /^date|^วันที่|time$/]],
  ['caption', [/post text|tweet text|^ข้อความ$|ชื่อข้อความ|message title|^description$|caption|message|^คำอธิบาย$|^คำบรรยาย$|^ข้อความโพสต์$/]],
  ['title', [/^title$|^ชื่อ$|^ชื่อโพสต์$|video title|^ชื่อวิดีโอ$/]],
  ['type', [/post type|content type|media type|^ประเภทโพสต์$/, /^type$|^ประเภท$/]],
  ['reach', [/delivered|ส่งถึง|ส่งสำเร็จ|จำนวนผู้รับ|recipients?/, /reach|การเข้าถึง|เข้าถึง/]],
  ['impressions', [/unique impressions?|เปิดอ่าน|ผู้เปิด|^opened$|^opens?$/, /impression|การแสดงผล|ยอดดู|ยอดวิว|(^|total |post )views?$|^views|การดู$/]],
  ['reactions', [/reaction|likes?$|ถูกใจ|รีแอค|ความรู้สึก|^likes/]],
  ['comments', [/^replies$|(^|total |post )comments?$|^ความคิดเห็น$|จำนวนความคิดเห็น|comment count/]],
  ['shares', [/(^|total |post )shares?$|^การแชร์$|^แชร์$|จำนวนแชร์|share count/, /reposts?$|retweets?$|รีโพสต์/]],
  ['saves', [/saves?$|bookmarks?$|บันทึก|favou?rites?|บุ๊กมาร์ก/]],
  ['clicks', [/unique clicks?|ผู้ใช้ที่คลิก|คนที่คลิก|total clicks|^clicks?$|คลิกทั้งหมด|^คลิก$|post clicks/]],
  ['profileVisits', [/profile (visit|view|click)|เยี่ยมชมโปรไฟล์|เข้าชมโปรไฟล์/]],
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
const detectPl = l => /facebook\.com|fb\.watch|fb\.com/i.test(l) ? 'fb' : /instagram\.com/i.test(l) ? 'ig' : /tiktok\.com/i.test(l) ? 'tt' : /\/\/(www\.|mobile\.)?(x|twitter)\.com\//i.test(l) ? 'x' : /manager\.line\.biz|lin\.ee|line\.me/i.test(l) ? 'line' : null;
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
    const err = !/^https?:\/\/\S+\.\S+/.test(link) && !(platform === 'line' && link === '') ? 'ไม่มีลิงก์โพสต์' : !at ? 'อ่านวันที่ไม่ได้' : !ap.includes(platform) ? 'ไม่มีสิทธิ์แพลตฟอร์มนี้' : null;
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
const plOfText = t => /instagram/i.test(t) ? 'ig' : /tiktok/i.test(t) ? 'tt' : /facebook/i.test(t) ? 'fb' : /\bline\b|ไลน์/i.test(t) ? 'line' : /\bX\b|twitter/.test(t) ? 'x' : null;
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
const canSync = p => can('add') && conn(p.platform).connected && (p.platform === 'line' ? !!p.externalId : !!(p.link || p.externalId));
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
  const L = loaderShow('อัปเดตข้อมูลล่าสุด'); L.at(3, 45);
  try {
    if (PKEYS.some(p => conn(p).connected)) { L.text('กำลังดึงยอดผู้ติดตามล่าสุดจากแพลตฟอร์ม…'); try { await API.syncFollowers(); } catch (e) { if (e.code === 'unauthorized') throw e; } }
    L.at(50, 92); L.text('กำลังโหลดข้อมูลจากฐานลึกลับ…');
    load(await API.bootstrap());
    await L.done(1200); renderSide(); renderTop(); renderView('soft'); L.close(); toast('อัปเดตข้อมูลล่าสุดแล้ว', 'info');
  } catch (e) { L.fail(); handleErr(e); }
}

/* ================= integrations ================= */
const CAPS_TXT = {
  fb: { ok: ['ยอดความรู้สึกแยก 7 อิโมจิ', 'จำนวนแชร์', 'ความคิดเห็นทั้งหมด พร้อมการตอบกลับของเพจ', 'การมองเห็น การเข้าถึง และคลิก (เท่าที่ Meta ยังเปิดให้)', 'ยอดผู้ติดตามเพจ'], no: ['จำนวนบันทึก (Saves)', 'ข้อมูลผู้ชมเพจ (Meta ปิดแล้ว)'] },
  ig: { ok: ['ยอดถูกใจ และความคิดเห็นทั้งหมด', 'Reach, Views, Saves, Shares', 'เข้าชมโปรไฟล์ และผู้ติดตามใหม่', 'เวลาดู Reels', 'ผู้ติดตาม + เพศ อายุ ประเทศ เมือง'], no: ['แยกอิโมจิ (Instagram มีแค่ถูกใจ)', 'จังหวัด และภาษา'] },
  tt: { ok: ['ยอดวิว ถูกใจ ความคิดเห็น แชร์', 'ความยาววิดีโอ', 'ยอดผู้ติดตาม'], no: ['รายการความคิดเห็น', 'Reach และเวลาดู (นำเข้า CSV จาก TikTok Studio ได้)'] },
  line: { ok: ['จำนวนเพื่อน รายวัน (ย้อนหลังได้)', 'กลุ่มเป้าหมายที่ส่งถึงได้ และจำนวนบล็อก', 'จำนวนข้อความที่ส่งออก รายวัน', 'เพศ อายุ จังหวัด iOS/Android และระยะเวลาที่เป็นเพื่อน', 'ส่งถึง เปิดอ่าน คลิก ของข้อความที่ส่งผ่าน API'], no: ['สถิติข้อความที่ส่งจาก LINE OA Manager (นำเข้า CSV)', 'ถูกใจ / แชร์ / ความคิดเห็น (LINE ไม่มี)', 'LINE VOOM'] },
  x: { ok: ['Impressions, Likes, Replies, Reposts, Quotes, Bookmarks', 'คลิกลิงก์ และคลิกโปรไฟล์ (โพสต์ไม่เกิน 30 วัน)', 'ยอดดูวิดีโอ และการดูถึง 25/50/75/100%', 'ยอดผู้ติดตาม'], no: ['ข้อมูลผู้ชม เพศ อายุ (X ไม่เปิด API)', 'รายการความคิดเห็น (มีค่าใช้จ่ายสูง)'] }
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
/* ---------- เข้าสู่ระบบด้วย X (OAuth 2.0) ---------- */
let XW = null, XPOLL = null;
function xLoginView() {
  const L = S.xLogin; if (!L) return '';
  if (L.phase === 'wait') return `<div class="fb-wait soft x"><span class="m-spin"></span><div><b>รอการอนุญาตในหน้าต่าง X…</b><p>เข้าสู่ระบบด้วยบัญชี X ของหน่วยงาน แล้วกด “Authorize app” ระบบจะรับข้อมูลและปิดหน้าต่างให้เอง</p><div class="fb-wait-actions"><button class="btn sm" type="button" data-act="x-reopen">${ic('ext', 14)} เปิดหน้าต่าง X อีกครั้ง</button><button class="btn sm ghost" type="button" data-act="x-cancel">ยกเลิก</button></div></div></div>`;
  return `<div class="callout warn soft" style="margin-top:12px">${ic('clock', 16)}<div><b>เชื่อมต่อไม่สำเร็จ</b><br>${esc(L.msg)}<div style="margin-top:8px"><button class="btn sm" type="button" data-act="x-cancel">ปิดข้อความนี้</button></div></div></div>`;
}
function renderXLogin() { const el = $('#x-login'); if (el) el.innerHTML = xLoginView(); }
async function xLoginStart() {
  const err = $('#x-err'); err.hidden = true; const cx = (DB.connections || {}).x || {};
  const clientId = $('#x-id').value.trim(), clientSecret = $('#x-sec').value.trim();
  if (!clientId && !cx.clientId) { err.textContent = 'ใส่ OAuth 2.0 Client ID ของแอป X'; err.hidden = false; return; }
  XW = API.demo ? null : fbPopup('');
  try { if (XW) XW.document.write('<p style="font-family:Tahoma,sans-serif;padding:60px 20px;text-align:center;color:#554f60">กำลังเปิดหน้าเข้าสู่ระบบ X…</p>'); } catch (_) {}
  try {
    const r = await busy($('#x-go'), () => API.connectX({ clientId, clientSecret }));
    if (!API.demo) { if (XW && !XW.closed) XW.location.href = r.authUrl; else XW = fbPopup(r.authUrl); }
    S.xLogin = { phase: 'wait', since: r.since || 0, url: r.authUrl, t0: Date.now() }; renderXLogin(); xPoll();
  } catch (e) { if (XW && !XW.closed) XW.close(); err.textContent = e.message; err.hidden = false; }
}
function xPoll() {
  clearTimeout(XPOLL);
  XPOLL = setTimeout(async () => {
    const L = S.xLogin; if (!L || L.phase !== 'wait') return;
    if (Date.now() - L.t0 > 15 * 60e3) { S.xLogin = { phase: 'error', msg: 'หมดเวลารอการอนุญาต ลองใหม่อีกครั้ง' }; renderXLogin(); return; }
    try {
      const c = await API.connStatus(); const x = c.x || {};
      if (x.connected && (x.connectedAt || 0) !== (L.since || 0)) { if (XW && !XW.closed) XW.close(); S.xLogin = null; S.connForm = null; DB.connections = c; renderSide(); renderView('none'); toast(`เชื่อมต่อ X ${x.name} แล้ว`); try { mergeFollowers(await API.syncFollowers()); renderView('none'); } catch (_) {} return; }
      if (x.loginError) { if (XW && !XW.closed) XW.close(); S.xLogin = { phase: 'error', msg: x.loginError }; renderXLogin(); return; }
    } catch (e) { console.warn(e); }
    xPoll();
  }, 2500);
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
        : `<button class="btn sm primary" data-act="conn-form" data-v="${p === 'fb' || p === 'ig' ? 'meta' : p}">${ic('plug', 14)} เชื่อมต่อ</button>`}</footer>
     </article>`;
  };
  const mc = S.metaChoose;
  return `<div class="stack" data-stagger>
    <div class="callout">${ic('lock', 18)}<div><b>ดึงข้อมูลได้เฉพาะบัญชีของหน่วยงานที่เชื่อมต่อ</b> ผ่าน API ทางการของ Meta, TikTok, LINE และ X สิทธิ์เข้าถึงเก็บไว้ที่ระบบหลังบ้าน ไม่แสดงบนหน้าเว็บ ส่วนที่แพลตฟอร์มไม่เปิดให้ ระบบจะใช้ข้อมูลที่กรอกเองหรือนำเข้า CSV และแสดงเวลาอัปเดตล่าสุดทุกจุด</div></div>
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
    <section class="panel" id="line-form"${S.connForm === 'line' ? '' : ' hidden'}><div class="panel-head"><div><h2>${ic('plug', 16)} เชื่อมต่อ LINE Official Account</h2><p>ใช้ Messaging API ของบัญชี LINE OA · วางโทเคนครั้งเดียว ใช้ได้ไม่หมดอายุ</p></div></div>
      <details class="help" open><summary>วิธีรับ Channel access token (ประมาณ 3 นาที)</summary><ol>
       <li>LINE OA Manager → <b>ตั้งค่า → Messaging API</b> → กด <b>“เปิดใช้งาน Messaging API”</b> (เลือก/สร้าง Provider)</li>
       <li>ไปที่ <b>developers.line.biz</b> → เลือก Provider → Channel ของบัญชี → แท็บ <b>Messaging API</b></li>
       <li>เลื่อนลงล่างสุด ที่ <b>Channel access token (long-lived)</b> กด <b>Issue</b> แล้วคัดลอกมาวางด้านล่าง</li>
       <li>ระบบจะดึงจำนวนเพื่อนย้อนหลัง 30 วัน และข้อมูลประชากรของเพื่อนให้ทันที (ข้อมูลประชากรต้องมีเพื่อนที่ส่งข้อความถึงได้ 20 คนขึ้นไป)</li></ol></details>
      <form id="f-line" class="stack" style="gap:12px" novalidate><div class="field"><label for="ln-tok">Channel access token (long-lived)</label><input class="input" id="ln-tok" type="password" autocomplete="off" placeholder="วางโทเคนยาวประมาณ 170 ตัวอักษร"></div>
       <span class="err-msg" id="ln-err" hidden></span><div class="fb-row"><button class="btn primary" type="submit" id="ln-go" style="background:#06c755;border-color:#06c755">${ic('plug', 15)} ตรวจสอบและเชื่อมต่อ LINE OA</button><button class="btn ghost" type="button" data-act="conn-form" data-v="">ยกเลิก</button></div></form></section>
    <section class="panel" id="x-form"${S.connForm === 'x' ? '' : ' hidden'}><div class="panel-head"><div><h2>${ic('plug', 16)} เชื่อมต่อ X</h2><p>เข้าสู่ระบบด้วยบัญชี X ของหน่วยงาน (OAuth 2.0) · X คิดค่าใช้จ่ายตามการใช้งาน ต้องมีเครดิตในบัญชีนักพัฒนา</p></div></div>
      <div class="callout warn" style="margin-bottom:14px">${ic('clock', 16)}<div><b>ค่าใช้จ่ายของ X API</b> — ตั้งแต่ ก.พ. 2569 X ใช้ระบบจ่ายตามการใช้งาน การอ่านโพสต์ของบัญชีตัวเองประมาณ 0.001 USD ต่อโพสต์ต่อวัน (โพสต์เดิมที่อ่านซ้ำในวันเดียวกันคิดครั้งเดียว) · 30 โพสต์ อัปเดตทุกวัน ≈ 1 USD/เดือน</div></div>
      <details class="help"${(cs.x || {}).clientId ? '' : ' open'}><summary>ตั้งค่าแอป X ครั้งแรก (ประมาณ 5 นาที)</summary><ol>
       <li>ไปที่ <b>console.x.com</b> (X Developer Console) → สร้าง Project / App และเติมเครดิต</li>
       <li>ที่แอป → <b>User authentication settings</b> → เปิด OAuth 2.0 · App type: <b>Web App (Confidential client)</b> · สิทธิ์ Read</li>
       <li>ช่อง <b>Callback URI / Redirect URL</b> วางลิงก์ด้านล่าง · Website URL ใส่เว็บของหน่วยงาน</li>
       <li>คัดลอก <b>OAuth 2.0 Client ID</b> และ <b>Client Secret</b> มาวาง แล้วกด “เข้าสู่ระบบด้วย X”</li></ol>
       <div class="code"><span id="x-redirect">${esc(cs.redirectUri || 'ต้อง Deploy ระบบหลังบ้านก่อน')}</span><button class="btn sm" type="button" data-act="copy-el" data-v="x-redirect">${ic('copy', 14)} คัดลอก</button></div></details>
      <form id="f-x" class="stack" style="gap:12px;margin-top:14px" novalidate><div class="fgrid">
       <div class="field"><label for="x-id">OAuth 2.0 Client ID</label><input class="input" id="x-id" autocomplete="off" value="${esc((cs.x || {}).clientId || '')}"></div>
       <div class="field"><label for="x-sec">Client Secret</label><input class="input" id="x-sec" type="password" autocomplete="off" placeholder="${(cs.x || {}).hasApp ? 'บันทึกไว้แล้ว — เว้นว่างได้' : ''}"></div></div>
       <span class="err-msg" id="x-err" hidden></span>
       <div class="fb-row"><button class="btn x-btn lg" type="submit" id="x-go"><b aria-hidden="true" style="font-size:17px">𝕏</b> เข้าสู่ระบบด้วย X</button><button class="btn ghost" type="button" data-act="conn-form" data-v="">ยกเลิก</button></div></form>
      <div id="x-login">${xLoginView()}</div></section>
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
   ${idlePanel()}
   <div class="grid-2">
    <section class="panel"><div class="panel-head"><div><h2>นโยบายการเข้าใช้งาน</h2><p>บังคับใช้ที่เซิร์ฟเวอร์ทุกครั้งที่เข้าสู่ระบบและเรียกข้อมูล</p></div>${DB.sheetUrl ? `<a class="btn sm" href="${esc(DB.sheetUrl)}" target="_blank" rel="noopener noreferrer">${ic('sheet', 14)} เปิดฐานข้อมูล</a>` : ''}</div>
     <div class="stack" style="gap:10px;font-size:13.5px">
      <div style="display:flex;justify-content:space-between;gap:10px"><span>โดเมนอีเมลที่อนุญาต</span><b class="mono">@${esc(DOMAIN)}</b></div>
      <div style="display:flex;justify-content:space-between;gap:10px"><span>ยืนยันตัวตน</span><span>รหัส OTP 6 หลักทางอีเมล (หมดอายุ 10 นาที)</span></div>
      <div style="display:flex;justify-content:space-between;gap:10px"><span>อีเมลใหม่ต้องได้รับอนุมัติ</span><span class="status active">เปิดใช้งาน</span></div>
      <div style="display:flex;justify-content:space-between;gap:10px"><span>อายุการเข้าสู่ระบบ</span><span>7 วัน</span></div>
      <div style="display:flex;justify-content:space-between;gap:10px"><span>ออกจากระบบเมื่อไม่มีการใช้งาน</span><span>${idleMin() ? fmtMin(idleMin()) : 'ปิด'}</span></div>
      <div style="display:flex;justify-content:space-between;gap:10px"><span>ใช้งานได้ทีละอุปกรณ์</span><span class="status active">เปิดใช้งาน</span></div>
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
    case 'x-reopen': if (S.xLogin && S.xLogin.url && !API.demo) XW = fbPopup(S.xLogin.url); break;
    case 'x-cancel': clearTimeout(XPOLL); if (XW && !XW.closed) XW.close(); S.xLogin = null; renderXLogin(); break;
    case 'fb-reopen': if (S.fbLogin && S.fbLogin.url && !API.demo) { FBW = fbPopup(S.fbLogin.url); } break;
    case 'fb-cancel': fbStopPoll(); if (FBW && !FBW.closed) FBW.close(); S.fbLogin = null; renderFbLogin(); break;
    case 'fb-pick-go': { const L = S.fbLogin; if (!L || !L.pick) break; try { const c = await busy(el, () => API.metaPick(L.pick)); await fbDone(c); } catch (e2) { S.fbLogin = { phase: 'error', msg: e2.message }; renderFbLogin(); } break; }
    case 'conn-form': fbStopPoll(); clearTimeout(XPOLL); S.xLogin = null; S.fbLogin = null; S.connForm = v || null; S.metaChoose = null; S.ttAuth = null; renderView('none'); if (v) setTimeout(() => { const f = $('#' + (v === 'tt' ? 'tt' : 'meta') + '-form'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); break;
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
    case 'per': S.f.period = v; S.f.pick = null; PB.anim = ['year', 'month'].includes(v); if (PB.anim) PB.viewY = new Date(TODAY).getFullYear(); refilter(); break;
    case 'pick-y': S.f.pick = v === '' ? null : { y: +v, m: null }; refilter(); break;
    case 'pick-m': S.f.pick = v === '' ? null : { y: PB.viewY, m: +v }; refilter(); break;
    case 'pick-vy': { PB.viewY += +v; const bar = $('#pickbar'); if (bar) { bar.outerHTML = pickBar(); syncThumbs($('#topbar'), false); } break; }
    case 'sa-er': S.sa.er = v; renderView('soft'); break;
    case 'sa-obj': S.sa.obj = v; renderView('soft'); break;
    case 'sa-kpi': kpopOpen(v); break;
    case 'kick-ok': kickOut('self', el); break;
    case 'ad-back': leaveDenied(); break;
    case 'idle-pick': { const d = S.idleDraft || (S.idleDraft = { on: true, min: 30 }); d.min = +v; d.on = true; idlePanelPaint(); break; }
    case 'idle-preview': previewDenied(); break;
    case 'idle-save': { const d = S.idleDraft; if (!d) break; const m = d.on ? Math.round(d.min) : 0; if (d.on && !(m >= 1 && m <= 480)) { toast('ตั้งเวลาได้ 1–480 นาที', 'error'); break; }
      try { DB.settings = await busy(el, () => API.saveSettings({ idleMinutes: m })); localLog(m ? 'ตั้งค่าออกจากระบบอัตโนมัติ ' + m + ' นาที' : 'ปิดการออกจากระบบอัตโนมัติ'); S.idleDraft = null; idleMark(); renderView('soft'); toast(m ? 'บันทึกแล้ว · ไม่มีการใช้งาน ' + fmtMin(m) + ' จะออกจากระบบอัตโนมัติ' : 'ปิดการออกจากระบบอัตโนมัติแล้ว'); } catch (_) {}
      break; }
    case 'kick-report': kickOut('report', el); break;
    case 'motion': { const on = RM(); try { localStorage.setItem('psi_rm', on ? '0' : '1'); } catch (_) {} document.documentElement.classList.toggle('rm', !on); renderSide(); toast(on ? 'เปิดภาพเคลื่อนไหวแล้ว ✨' : 'ลดภาพเคลื่อนไหวแล้ว', 'info'); break; }
    case 'snow': { const on = !snowOn(); try { localStorage.setItem('psi_snow', on ? '1' : '0'); } catch (_) {} document.body.classList.toggle('no-snow', !on); renderSide(); toast(on ? 'เปิดหิมะตกแล้ว ❄' : 'ปิดหิมะตกแล้ว', 'info'); break; }
    case 'kpop-close': kpopClose(); break;
    case 'kpop-fx': kpopFx(el); break;
    case 'sa-catalog': modalOpen(saCatalogView(), { wide: true }); break;
    case 'sa-copy': { const t = S.saText || ''; try { await navigator.clipboard.writeText(t); toast('คัดลอกสรุปแล้ว วางในอีเมลหรือแชทได้เลย'); } catch (_) { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('คัดลอกสรุปแล้ว'); } catch (__) { toast('คัดลอกไม่สำเร็จ', 'error'); } ta.remove(); } break; }
    case 'dp-open': if (DP.open) dpClose(); else dpOpen(el); break;
    case 'dp-close': dpClose(); break;
    case 'dp-apply': dpApply(); break;
    case 'dp-day': dpPick(+v); break;
    case 'dp-nav': { const n = +v; let nv = addMon(DP.view, n); const lastView = addMon(TODAY, dpTwo() ? -1 : 0); if (nv > lastView) nv = lastView; DP.view = nv; dpRefresh(false); break; }
    case 'dp-preset': { const pr = presetRange(v); dpClose(); if (pr) { S.f.period = 'custom'; S.f.from = iso(pr[0]); S.f.to = iso(pr[1]); } else S.f.period = v; refilter(); break; }
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
    case 'idle-on': { const d = S.idleDraft || (S.idleDraft = { on: true, min: idleMin() || 30 }); d.on = t.checked; idlePanelPaint(); break; }
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
    case 'aplat': { $$('[data-ml]').forEach(l => l.textContent = ML(t.value, l.dataset.ml)); $$('[data-mk]').forEach(f => { f.hidden = !!(MREL[t.value] && !MREL[t.value].includes(f.dataset.mk)); }); const cs2 = $('#cmt-sec'); if (cs2) cs2.hidden = t.value === 'line'; const pn = $('#pl-note'); if (pn) pn.textContent = plNote(t.value); const lk = $('#a-link'); if (lk) { lk.placeholder = LINK_PH[t.value] || 'https://'; const lb = $('label[for="a-link"]'); if (lb) lb.textContent = t.value === 'line' ? 'ลิงก์ (ไม่บังคับสำหรับ LINE OA)' : 'ลิงก์โพสต์'; } const ty = $('#a-type'); if (!PTYPES[t.value].includes(ty.value)) { ty.value = PTYPES[t.value][0]; $('#vid-sec').classList.toggle('closed', !VIDEO.has(ty.value)); } break; }
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
  if (k === 'dp-a' || k === 'dp-b') dpTyped(k.slice(3), t, e.inputType);
  if (k === 'idle-min') { const d = S.idleDraft || (S.idleDraft = { on: true, min: 30 }); const m = Math.round(+t.value); if (m >= 1 && m <= 480) { d.min = m; const p = $('#idle-panel'); if (p) { $('.idle-now b', p).textContent = fmtMin(m); $$('[data-act="idle-pick"]', p).forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.v === m))); syncThumbs(p, true); const sv = $('[data-act="idle-save"]', p); if (sv) sv.disabled = m === idleMin(); } } }
  if (k === 'pq') { S.pf.q = t.value; clearTimeout(qt); qt = setTimeout(() => renderPostList(false), 120); }
  if (k === 'cq') { S.cf.q = t.value; clearTimeout(qt); qt = setTimeout(renderFeed, 150); }
  if (k === 'acap' && !S.editing && !S.catTouched) { const c = autoCategory(t.value); const sel = $('#a-cat'); if (sel && t.value.trim().length > 8) { sel.value = c; const h = $('#cat-hint'); if (h) h.textContent = 'ระบบแนะนำหมวด “' + CAT[c].t + '” จากข้อความ เปลี่ยนเองได้'; } }
  if (k === 'fx-link') { S.fx.link = t.value; const pl = $('#fx-pl'); if (pl) pl.innerHTML = fxPlIcon(t.value); }
});
document.addEventListener('keydown', e => { if (DP.open && e.key === 'Enter' && e.target.closest && e.target.closest('#dp input')) { e.preventDefault(); dpApply(); return; } if (e.key === 'Escape') { if (DP.open) { dpClose(); const b = $('.date-btn'); if (b) b.focus(); return; } if ($('#modal.on')) { e.preventDefault(); modalClose(); return; } if (KPOP.key) { kpopClose(); return; } if (S.openPost) closeDrawer(); } });
window.addEventListener('beforeunload', e => { if (MODAL.locked && !MODAL.kick) { e.preventDefault(); e.returnValue = ''; } });
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
  if (f.id === 'f-x') { xLoginStart(); return; }
  if (f.id === 'f-line') {
    const err = $('#ln-err'); err.hidden = true; const token = $('#ln-tok').value.trim();
    if (token.length < 40) { err.textContent = 'วาง Channel access token (long-lived) ให้ครบ — ยาวประมาณ 170 ตัวอักษร'; err.hidden = false; return; }
    try { const c = await busy($('#ln-go'), () => API.connectLine(token)); DB.connections = c; S.connForm = null; renderSide(); renderView('none'); toast(`เชื่อมต่อ LINE OA ${c.line.name || ''} แล้ว · ดึงข้อมูลย้อนหลัง 30 วัน`); try { load(await API.bootstrap()); renderView('none'); } catch (_) {} }
    catch (e2) { err.textContent = e2.message; err.hidden = false; }
    return;
  }
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
    const okLink = /^https?:\/\/\S+\.\S+/.test(link) || ($('#a-plat').value === 'line' && !link);
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
  // ถูกล็อกเพราะไม่มีการใช้งาน → เปิดหน้าใหม่ก็ยังอยู่หน้า Access Denied จนกว่าจะกด “กลับเข้าสู่ระบบอีกครั้ง”
  const lkRaw = idleGet('psi_locked'); if (lkRaw) { try { const lk = JSON.parse(lkRaw); if (API.hasToken()) API.logout().catch(() => {}); showDenied(lk); return; } catch (_) { idleSet('psi_locked', null); } }
  if (API.hasToken()) {
    renderSkeleton();
    const L = loaderShow(); L.at(4, 88);
    try { const d = await API.bootstrap(); L.at(92, 97); load(d); await L.done(); startApp(); L.close(); }
    catch (e) {
      L.fail();
      if (e.code === 'unauthorized' || e.code === 'forbidden') { showAuth(); return; }
      root().innerHTML = `<div class="fatal"><div class="fatal-card"><h2>เชื่อมต่อข้อมูลไม่สำเร็จ</h2><p class="muted">${esc(e.message)}</p><div style="display:flex;gap:8px"><button class="btn primary" onclick="location.reload()">ลองอีกครั้ง</button><button class="btn" id="to-login">เข้าสู่ระบบใหม่</button></div></div></div>`;
      $('#to-login').onclick = () => { try { localStorage.removeItem('psi_token'); } catch (_) {} showAuth(); };
    }
  } else showAuth();
}
/* ================= วิเคราะห์เชิงกลยุทธ์ (Strategic insight) ================= */
/* ใช้สูตร KPI ด้าน Social / Content Marketing กับข้อมูลที่ระบบมีจริง และบอกชัดว่าสูตรไหนยังใช้ไม่ได้เพราะขาดข้อมูลอะไร */
const SA_DOW = ['วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'];
const SA_SLOT = [[6, 9, '06:00–09:00'], [9, 12, '09:00–12:00'], [12, 15, '12:00–15:00'], [15, 18, '15:00–18:00'], [18, 21, '18:00–21:00'], [21, 24, '21:00–24:00'], [0, 6, '00:00–06:00']];
const saDiv = (a, b) => a != null && b ? a / b : null;
const saSum = (l, f) => { let s = 0, any = false; l.forEach(x => { const v = f(x); if (v != null && isFinite(v)) { s += v; any = true; } }); return any ? s : null; };
const saMean = l => { const v = l.filter(x => x != null && isFinite(x)); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
const saMedian = l => { const v = l.filter(x => x != null && isFinite(x)).sort((a, b) => a - b); if (!v.length) return null; const m = v.length >> 1; return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
const saGrowth = (cur, prev) => cur != null && prev ? (cur - prev) / prev : null;
const f2 = (v, d = 2) => v == null || !isFinite(v) ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const pp = (v, d = 1) => v == null || !isFinite(v) ? '—' : (v * 100).toFixed(d) + '%';
const sgn = v => v == null ? '' : (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + '%';

/** อัตราต่างๆ ของโพสต์เดียว (ไม่มีข้อมูล = null ไม่ใช่ 0) */
function saRates(p) {
  const m = p.m || {}, v = p.v || {}, R = m.reach || null, I = m.impressions || null, E = engP(p);
  const starts = v.s3 || v.videoViews || null;
  return {
    R, I, E,
    freq: p.platform === 'line' ? null : saDiv(I, R),
    erR: R ? E / R : null, erI: I ? E / I : null,
    likeR: saDiv(m.reactions, R || I), cmtR: saDiv(m.comments, R || I), shareR: saDiv(m.shares, R || I), saveR: saDiv(m.saves, R || I),
    clickR: saDiv(m.clicks, R), ctr: saDiv(m.clicks != null ? m.clicks : m.linkClicks, I), linkCtr: saDiv(m.linkClicks, I),
    pvR: saDiv(m.profileVisits, R || I), folR: saDiv(m.newFollowers, R || I),
    viewRate: VIDEO.has(p.type) || p.v ? saDiv(v.videoViews, I) : null,
    completion: v.completion != null ? v.completion : saDiv(v.p100, starts),
    avgWatch: v.avgWatch != null ? v.avgWatch : saDiv(v.totalWatch, v.videoViews),
    ret: starts ? { s3: 1, s10: saDiv(v.s10, starts), p25: saDiv(v.p25, starts), p50: saDiv(v.p50, starts), p75: saDiv(v.p75, starts), p100: saDiv(v.p100, starts) } : null
  };
}
/** รวมตัวเลขของกลุ่มโพสต์ (อัตรารวมคิดจากผลรวม = ถ่วงน้ำหนักตามขนาด) */
function saAgg(list) {
  const s = k => saSum(list, p => p.m && p.m[k]);
  const reach = s('reach'), imp = s('impressions'), eng = saSum(list, p => engP(p)), clicks = s('clicks'), link = s('linkClicks');
  const vids = list.filter(p => p.v && (p.v.videoViews || p.v.s3));
  const vv = saSum(vids, p => p.v.videoViews), vImp = saSum(vids, p => p.m.impressions);
  const starts = saSum(vids, p => p.v.s3 || p.v.videoViews), done = saSum(vids, p => p.v.p100);
  const reachOf = l => saSum(l, p => p.m.reach);
  const withReach = list.filter(p => p.m.reach), wImp = list.filter(p => p.m.impressions);
  const rateBy = (k, base) => { const l = list.filter(p => p.m[k] != null && p.m[base]); return l.length ? saSum(l, p => p.m[k]) / saSum(l, p => p.m[base]) : null; };
  return {
    n: list.length, reach, imp, eng, clicks, link, shares: s('shares'), saves: s('saves'), comments: s('comments'), reactions: s('reactions'), pv: s('profileVisits'), fol: s('newFollowers'),
    freq: (() => { const l = list.filter(p => p.platform !== 'line' && p.m.reach && p.m.impressions); return l.length ? saSum(l, p => p.m.impressions) / saSum(l, p => p.m.reach) : null; })(),
    erR: withReach.length ? saSum(withReach, p => engP(p)) / reachOf(withReach) : null,
    erI: wImp.length ? saSum(wImp, p => engP(p)) / saSum(wImp, p => p.m.impressions) : null,
    likeR: rateBy('reactions', 'reach'), cmtR: rateBy('comments', 'reach'), shareR: rateBy('shares', 'reach'), saveR: rateBy('saves', 'reach'), clickR: rateBy('clicks', 'reach'),
    ctr: rateBy('clicks', 'impressions') != null ? rateBy('clicks', 'impressions') : rateBy('linkClicks', 'impressions'), linkCtr: rateBy('linkClicks', 'impressions'),
    viewRate: vv != null && vImp ? vv / vImp : null, completion: starts && done != null ? done / starts : null,
    avgWatch: (() => { const l = vids.filter(p => p.v.totalWatch && p.v.videoViews); return l.length ? saSum(l, p => p.v.totalWatch) / saSum(l, p => p.v.videoViews) : saMean(vids.map(p => p.v.avgWatch)); })(),
    vids: vids.length, vv, starts,
    meanER: saMean(list.map(p => saRates(p).erR != null ? saRates(p).erR : saRates(p).erI))
  };
}
/** คะแนนโพสต์: แปลงแต่ละอัตราเป็นเปอร์เซ็นไทล์ (0–100) เทียบกับโพสต์ในแพลตฟอร์มเดียวกัน แล้วถ่วงน้ำหนักตามวัตถุประสงค์ */
const SA_OBJ = {
  overall: { t: 'Post Performance Score', th: 'คะแนนรวม', w: { likeR: 10, cmtR: 20, shareR: 25, saveR: 20, clickR: 25 }, f: 'Like 10% + Comment 20% + Share 25% + Save 20% + Click 25%' },
  awareness: { t: 'Awareness Score', th: 'การรับรู้', w: { reachIdx: 40, viewRate: 30, shareR: 30 }, f: 'Reach เทียบค่ากลาง 40% + View Rate 30% + Share Rate 30%' },
  engagement: { t: 'Engagement Score', th: 'การมีส่วนร่วม', w: { likeR: 20, cmtR: 25, shareR: 30, saveR: 25 }, f: 'Like 20% + Comment 25% + Share 30% + Save 25%' },
  action: { t: 'Action Score', th: 'การพาไปต่อ', w: { ctr: 40, linkCtr: 30, pvR: 15, folR: 15 }, f: 'CTR 40% + Link CTR 30% + Profile visit 15% + New follower 15% (ใช้แทน Conversion Score)' }
};
function saScores(list) {
  const out = new Map(); const byPl = {};
  list.forEach(p => (byPl[p.platform] = byPl[p.platform] || []).push(p));
  Object.values(byPl).forEach(group => {
    const rates = group.map(p => Object.assign(saRates(p), { p }));
    const med = saMedian(rates.map(r => r.R || r.I));
    rates.forEach(r => { r.reachIdx = med ? (r.R || r.I) / med : null; });
    const keys = ['likeR', 'cmtR', 'shareR', 'saveR', 'clickR', 'reachIdx', 'viewRate', 'ctr', 'linkCtr', 'pvR', 'folR'];
    const sorted = {}; keys.forEach(k => { sorted[k] = rates.map(r => r[k]).filter(x => x != null && isFinite(x)).sort((a, b) => a - b); });
    const pr = (k, v) => { const a = sorted[k]; if (v == null || !a.length) return null; if (a.length === 1) return 60; let lo = 0; while (lo < a.length && a[lo] < v) lo++; let hi = lo; while (hi < a.length && a[hi] === v) hi++; return ((lo + hi) / 2) / a.length * 100; };
    rates.forEach(r => {
      const sc = {};
      Object.entries(SA_OBJ).forEach(([ok, o]) => { let tw = 0, ts = 0; Object.entries(o.w).forEach(([k, w]) => { const x = pr(k, r[k]); if (x != null) { tw += w; ts += w * x; } }); sc[ok] = tw >= 30 ? ts / tw : null; sc[ok + '_cov'] = tw; });
      out.set(r.p.id, { rates: r, sc });
    });
  });
  return out;
}
/** คะแนนสุขภาพโซเชียล (0–100): เทียบกับช่วงก่อนหน้าที่ยาวเท่ากัน — เท่ากับช่วงก่อน = 70 คะแนน */
function saHealth(A, B, C, D, folG, folGPrev, ps) {
  const fromRatio = (c, p) => c == null || !p ? null : Math.max(0, Math.min(100, 70 * c / p));
  const parts = [
    { k: 'awareness', t: 'การรับรู้ (Awareness)', w: 25, v: fromRatio(A.reach || A.imp, B.reach || B.imp), why: 'Reach รวม เทียบช่วงก่อนหน้า' },
    { k: 'engagement', t: 'การมีส่วนร่วม (Engagement)', w: 25, v: fromRatio(A.erR != null ? A.erR : A.erI, B.erR != null ? B.erR : B.erI), why: 'ER by Reach เทียบช่วงก่อนหน้า' },
    { k: 'action', t: 'การพาไปต่อ (Action)', w: 20, v: fromRatio(A.ctr, B.ctr), why: 'CTR เทียบช่วงก่อนหน้า' },
    { k: 'community', t: 'ชุมชน & ความรู้สึก', w: 15, v: C.total ? Math.round(((((C.by.pos || 0) - (C.by.neg || 0) - (C.by.cmp || 0)) / C.total + 1) / 2 * 100 + n0(C.replyRate) * 100) / 2) : null, why: 'Sentiment Score + อัตราการตอบกลับ' },
    { k: 'growth', t: 'การเติบโต (Growth)', w: 15, v: folG == null ? null : folGPrev ? fromRatio(Math.max(0, folG), Math.max(1e-9, folGPrev)) : Math.max(0, Math.min(100, 50 + folG * 2500)), why: 'Follower Growth Rate เทียบช่วงก่อนหน้า' }
  ];
  const have = parts.filter(x => x.v != null); const tw = have.reduce((s, x) => s + x.w, 0);
  return { score: tw ? have.reduce((s, x) => s + x.v * x.w, 0) / tw : null, parts };
}
const saLevel = v => v == null ? ['—', 'var(--ink-3)'] : v >= 80 ? ['ดีมาก', 'var(--good)'] : v >= 65 ? ['ดี', '#3b8f5a'] : v >= 50 ? ['พอใช้', 'var(--warn)'] : ['ต้องปรับปรุง', 'var(--bad)'];

/* ----- แคตตาล็อกสูตร: ใช้ได้กับฐานข้อมูลนี้หรือไม่ ----- */
const SA_CATALOG = [
  ['Awareness', [['Reach', 'จำนวนบัญชีที่เห็นโพสต์อย่างน้อย 1 ครั้ง', 'ok'], ['Impressions', 'จำนวนครั้งที่แสดงทั้งหมด', 'ok'], ['Frequency', 'Impressions ÷ Reach', 'ok'], ['Reach Growth', '(Reach ช่วงนี้ − ช่วงก่อน) ÷ ช่วงก่อน × 100', 'ok']]],
  ['Engagement', [['Total Engagement', 'Like + Comment + Share + Save (LINE ใช้คลิก)', 'ok'], ['ER by Reach', 'Engagement ÷ Reach × 100', 'ok'], ['ER by Impression', 'Engagement ÷ Impressions × 100', 'ok'], ['Comment Rate', 'Comments ÷ Reach × 100', 'ok'], ['Share Rate', 'Shares ÷ Reach × 100', 'ok'], ['Save Rate', 'Saves ÷ Reach × 100', 'ok'], ['Click Rate', 'Clicks ÷ Reach × 100', 'ok']]],
  ['Traffic', [['CTR', 'Clicks ÷ Impressions × 100', 'ok'], ['Landing Page Rate', 'Landing Page Views ÷ Link Clicks × 100', 'no', 'ต้องมีข้อมูล Google Analytics / Pixel'], ['Bounce Rate', 'Sessions ที่ออกทันที ÷ Sessions × 100', 'no', 'ต้องมีข้อมูลเว็บไซต์']]],
  ['Video', [['View Rate', 'Video Views ÷ Impressions × 100', 'ok'], ['Completion Rate', 'ดูจบ ÷ Video Starts × 100', 'ok'], ['Avg. Watch Time', 'Watch Time รวม ÷ Views', 'ok'], ['Retention 3s/10s/25–100%', 'ผู้ชม ณ จุดนั้น ÷ Video Starts × 100', 'ok']]],
  ['Brand & Community', [['Follower Growth Rate', 'ผู้ติดตามที่เพิ่ม ÷ ผู้ติดตามต้นงวด × 100', 'ok'], ['Sentiment Score', '(Positive − Negative) ÷ ความคิดเห็นทั้งหมด × 100', 'part', 'ใช้ความคิดเห็นบนโพสต์ของเราแทน Mention ทั้งตลาด'], ['Response Rate', 'ความคิดเห็นที่เพจตอบ ÷ ความคิดเห็นทั้งหมด × 100', 'ok'], ['Share of Voice', 'Mention ของเรา ÷ Mention ทั้งตลาด × 100', 'no', 'ต้องมีเครื่องมือ Social Listening']]],
  ['คะแนนและรูปแบบ', [['Post Performance Score', 'Like 10% + Comment 20% + Share 25% + Save 20% + Click 25%', 'ok'], ['Awareness / Engagement Score', 'ถ่วงน้ำหนักตามวัตถุประสงค์', 'ok'], ['Conversion Score', 'CTR + Conversion + CPA + Revenue', 'part', 'ใช้ Action Score (CTR, Link CTR, Profile visit, New follower) แทน'], ['Average ER by Content Type', 'ΣER ÷ จำนวนโพสต์ แยกหมวด/รูปแบบ', 'ok'], ['Best Posting Pattern', 'ค่าเฉลี่ย ER / CTR / Reach ตามวัน × ช่วงเวลา', 'ok'], ['WoW / MoM / YoY', '(ช่วงนี้ − ช่วงก่อน) ÷ ช่วงก่อน × 100', 'ok'], ['Moving Average 7/30 วัน', 'ค่าเฉลี่ยเคลื่อนที่ของ Engagement รายวัน', 'ok'], ['Funnel', 'Impression → Reach → Engagement → Click → Link click → Follow', 'part', 'ขั้นหลังคลิก (Visit / Lead / Purchase) ต้องมีข้อมูลเว็บและยอดขาย'], ['Social Health Score', 'Awareness 25% + Engagement 25% + Action 20% + Community 15% + Growth 15%', 'part', 'ปรับจาก Marketing Health Score ให้ใช้ข้อมูลโซเชียลแทนรายได้']]],
  ['Lead & Sales', [['Lead Conversion Rate', 'Leads ÷ Visitors × 100', 'no'], ['CPL', 'ค่าโฆษณา ÷ Leads', 'no'], ['Conversion Rate', 'Orders ÷ Visitors × 100', 'no'], ['CPA / CAC', 'ต้นทุน ÷ Conversion / ลูกค้าใหม่', 'no'], ['AOV / Revenue per Visitor', 'Revenue ÷ Orders / Visitors', 'no']]],
  ['Profitability & Customer', [['ROAS / ROI / MER', 'Revenue ÷ Ad spend / (กำไร − ต้นทุน) ÷ ต้นทุน', 'no'], ['Repeat / Retention / Churn', 'ลูกค้าซื้อซ้ำ / คงอยู่ / หาย ÷ ลูกค้าต้นงวด', 'no'], ['CLV / LTV:CAC', 'AOV × Frequency × Lifespan ÷ CAC', 'no'], ['RFM / Cohort / Attribution / Customer 360°', 'ต้องมี Customer ID และคำสั่งซื้อ', 'no']]]
];
const SA_NEED = 'ต้องมีข้อมูลค่าใช้จ่ายโฆษณา ผู้เข้าชมเว็บไซต์ ลีด ยอดขาย หรือรหัสลูกค้า — ระบบนี้เก็บเฉพาะข้อมูลโซเชียล จึงยังคำนวณไม่ได้';
function saCatalogView() {
  const tot = SA_CATALOG.reduce((s, [, l]) => s + l.length, 0), ok = SA_CATALOG.reduce((s, [, l]) => s + l.filter(x => x[2] === 'ok').length, 0), part = SA_CATALOG.reduce((s, [, l]) => s + l.filter(x => x[2] === 'part').length, 0);
  const tag = st => st === 'ok' ? `<span class="sa-tag ok">${ic('check', 12)} ใช้ได้</span>` : st === 'part' ? `<span class="sa-tag part">◐ ปรับใช้</span>` : `<span class="sa-tag no">${ic('lock', 11)} ต้องมีข้อมูลเพิ่ม</span>`;
  return `${mHead(ic('strategy', 22), 'สูตรที่ใช้ได้กับฐานข้อมูลของเรา', `ใช้ได้ทันที ${ok} สูตร · ปรับใช้ ${part} สูตร · ต้องมีข้อมูลเพิ่ม ${tot - ok - part} สูตร`)}
   <div class="sa-cat">${SA_CATALOG.map(([g, l]) => `<section><h3>${g}</h3>${l.map(([n, f, st, why]) => `<div class="sa-cat-row ${st}"><div><b>${n}</b><code>${esc(f)}</code>${why || st === 'no' ? `<small>${esc(why || SA_NEED)}</small>` : ''}</div>${tag(st)}</div>`).join('')}</section>`).join('')}</div>
   <div class="m-actions"><button class="btn primary" data-act="modal-close" data-focus>ปิด</button></div>`;
}

/* ----- หน้าจอ ----- */
/* ----- KPI: นิยามสูตร + ตัวคำนวณชุดเดียว ใช้ร่วมกันทั้งการ์ด ป๊อปอัป และตารางแทนค่า ----- */
const saRB = (l, k, base) => { const x = l.filter(p => p.m[k] != null && p.m[base]); if (!x.length) return null; const num = saSum(x, p => p.m[k]), den = saSum(x, p => p.m[base]); return den ? { v: num / den, num, den, n: x.length } : null; };
const saRatio = (x, fnum_, fden) => { if (!x.length) return null; const num = saSum(x, fnum_), den = saSum(x, fden); return num != null && den ? { v: num / den, num, den, n: x.length } : null; };
const saReach = l => { const r = saSum(l, p => p.m.reach); return r != null ? r : saSum(l, p => p.m.impressions); };
const SA_G = { Awareness: { ic: 'target', c: '#8b5cf6', th: 'การรับรู้' }, Engagement: { ic: 'heart', c: '#e0679a', th: 'การมีส่วนร่วม' }, Traffic: { ic: 'link', c: '#3b82f6', th: 'การพาไปต่อ' }, Video: { ic: 'play', c: '#f59e0b', th: 'วิดีโอ' }, 'Brand & Community': { ic: 'audience', c: '#10b981', th: 'แบรนด์และชุมชน' } };
const SA_K = [
  { k: 'reach', g: 'Awareness', t: c => c.ln ? 'ส่งถึง (Reach)' : 'Reach', kind: 'sum', num: 'Reach', sub: c => 'จำนวนบัญชีที่เห็นโพสต์',
    long: 'จำนวนบัญชีที่เห็นโพสต์อย่างน้อย 1 ครั้ง รวมทุกโพสต์ในช่วงที่เลือก (คนเดียวกันเห็นหลายโพสต์จะถูกนับซ้ำตามจำนวนโพสต์)', read: 'สูงขึ้น = คอนเทนต์ไปถึงคนได้กว้างขึ้น ดูคู่กับ Frequency ว่าเป็นคนใหม่หรือคนเดิม',
    calc: c => { const v = saReach(c.l); return v == null ? null : { v, num: v, n: c.l.length }; } },
  { k: 'imp', g: 'Awareness', t: c => c.ln ? 'เปิดอ่าน (Impressions)' : 'Impressions', kind: 'sum', num: 'Impressions', sub: () => 'จำนวนครั้งที่แสดงทั้งหมด',
    long: 'จำนวนครั้งที่โพสต์ถูกแสดงบนหน้าจอ นับซ้ำได้ถ้าคนเดิมเห็นหลายครั้ง', read: 'ยิ่งมากยิ่งถูกมองเห็นบ่อย แต่ถ้าสูงกว่า Reach มากเกินไปอาจแปลว่าวนเห็นแต่คนเดิม',
    calc: c => { const v = saSum(c.l, p => p.m.impressions); return v == null ? null : { v, num: v, n: c.l.filter(p => p.m.impressions != null).length }; } },
  { k: 'freq', g: 'Awareness', t: () => 'Frequency', kind: 'x', num: 'Impressions', den: 'Reach', sub: () => 'คนเดิมเห็นซ้ำเฉลี่ยกี่ครั้ง',
    long: 'จำนวนครั้งเฉลี่ยที่แต่ละคนเห็นโพสต์ของเรา คิดเฉพาะโพสต์ที่มีทั้ง Impressions และ Reach (ไม่รวม LINE OA)', read: 'ราว 1.5–3 ครั้งกำลังดี ต่ำไปคนอาจจำไม่ได้ สูงไปเสี่ยงให้คนเบื่อ',
    calc: c => saRatio(c.l.filter(p => p.platform !== 'line' && p.m.reach && p.m.impressions), p => p.m.impressions, p => p.m.reach) },
  { k: 'reachG', g: 'Awareness', t: () => 'Reach Growth', kind: 'growth', num: 'Reach ช่วงนี้', den: 'Reach ช่วงก่อน', prev: true, sub: () => 'เทียบช่วงก่อนหน้าที่ยาวเท่ากัน',
    long: 'การเปลี่ยนแปลงของ Reach รวม เทียบกับช่วงก่อนหน้าที่ยาวเท่ากัน (ในตารางรายช่วง แต่ละช่วงเทียบกับช่วงก่อนหน้าของมันเอง)', read: 'บวก = เข้าถึงคนได้มากขึ้น ถ้าจำนวนโพสต์เพิ่มด้วยให้ดู Reach ต่อโพสต์ประกอบ',
    calc: c => { if (!c.pl) return null; const a = saReach(c.l), b = saReach(c.pl); return a != null && b ? { v: (a - b) / b, num: a, den: b } : null; } },
  { k: 'eng', g: 'Engagement', t: () => 'Total Engagement', kind: 'sum', num: 'Engagement', sub: c => c.ln ? 'คลิกในข้อความ LINE' : 'Like + Comment + Share + Save',
    long: 'ผลรวมการมีส่วนร่วมทุกแบบ: ถูกใจ/ความรู้สึก + ความคิดเห็น + แชร์ + บันทึก (LINE OA ใช้จำนวนคลิกแทน เพราะไม่มีถูกใจ/แชร์)', read: 'ใช้ดูปริมาณ ส่วนคุณภาพให้ดู ER ด้านข้าง',
    calc: c => { const v = saSum(c.l, p => engP(p)); if (v == null) return null; const s = k => n0(saSum(c.l.filter(p => p.platform !== 'line'), p => p.m[k])); return { v, num: v, n: c.l.length, parts: [['Like', s('reactions')], ['Comment', s('comments')], ['Share', s('shares')], ['Save', s('saves')], ['คลิก LINE', n0(saSum(c.l.filter(p => p.platform === 'line'), p => p.m.clicks))]].filter(x => x[1] || x[0] !== 'คลิก LINE') }; } },
  { k: 'erR', g: 'Engagement', t: () => 'ER by Reach', kind: 'pct', dec: 2, num: 'Engagement', den: 'Reach', mul: true, sub: () => 'คนที่เห็นแล้วสนใจจริง',
    long: 'สัดส่วนคนที่เห็นแล้วลงมือมีส่วนร่วม คิดจากผลรวม Engagement ÷ ผลรวม Reach ของโพสต์ที่มี Reach', read: 'Facebook ทั่วไป 1–5% ถือว่าดี · Instagram/TikTok มักสูงกว่า — เทียบกับช่วงก่อนหน้าของตัวเองแม่นที่สุด',
    calc: c => saRatio(c.l.filter(p => p.m.reach), p => engP(p), p => p.m.reach) },
  { k: 'erI', g: 'Engagement', t: () => 'ER by Impression', kind: 'pct', dec: 2, num: 'Engagement', den: 'Impressions', mul: true, sub: () => 'ประสิทธิภาพต่อการแสดงผล',
    long: 'Engagement ÷ Impressions ใช้เทียบข้ามแพลตฟอร์มที่ไม่มี Reach (เช่น X) หรือเมื่อคนเห็นซ้ำหลายครั้ง', read: 'มักต่ำกว่า ER by Reach เสมอ ถ้าสองค่าห่างกันมาก แปลว่าคนเห็นซ้ำเยอะ',
    calc: c => saRatio(c.l.filter(p => p.m.impressions), p => engP(p), p => p.m.impressions) },
  { k: 'cmtR', g: 'Engagement', t: () => 'Comment Rate', kind: 'pct', dec: 2, num: 'Comments', den: 'Reach', mul: true, sub: () => 'กระตุ้นบทสนทนา', long: 'ความคิดเห็น ÷ Reach ของโพสต์ที่มีข้อมูลทั้งสองช่อง', read: 'สูง = คอนเทนต์ชวนคุย ถามคำถาม หรือมีประเด็นให้แสดงความเห็น', calc: c => saRB(c.l, 'comments', 'reach') },
  { k: 'shareR', g: 'Engagement', t: () => 'Share Rate', kind: 'pct', dec: 2, num: 'Shares', den: 'Reach', mul: true, sub: () => 'ความอยากบอกต่อ', long: 'แชร์ ÷ Reach — ตัวชี้วัดว่าคนอยากส่งต่อให้คนอื่นแค่ไหน', read: 'แชร์คือการเข้าถึงฟรี ยิ่งสูงยิ่งช่วยให้โพสต์ไปไกล', calc: c => saRB(c.l, 'shares', 'reach') },
  { k: 'saveR', g: 'Engagement', t: () => 'Save Rate', kind: 'pct', dec: 2, num: 'Saves', den: 'Reach', mul: true, sub: () => 'คุณค่าจนต้องเก็บไว้', long: 'บันทึก ÷ Reach — คนเห็นว่ามีประโยชน์จนอยากกลับมาดูอีก', read: 'เหมาะวัดคอนเทนต์ความรู้ อินโฟกราฟิก และคู่มือ', calc: c => saRB(c.l, 'saves', 'reach') },
  { k: 'clickR', g: 'Engagement', t: () => 'Click Rate', kind: 'pct', dec: 2, num: 'Clicks', den: 'Reach', mul: true, sub: () => 'ดึงคนไปขั้นถัดไป', long: 'คลิกทั้งหมดบนโพสต์ (รวมคลิกดูรูป อ่านเพิ่ม ลิงก์) ÷ Reach', read: 'Meta นับคลิกทุกชนิด จึงสูงกว่า Link CTR มาก — ดู Link CTR ถ้าต้องการคนออกไปเว็บ', calc: c => saRB(c.l, 'clicks', 'reach') },
  { k: 'ctr', g: 'Traffic', t: () => 'CTR', kind: 'pct', dec: 2, num: 'Clicks', den: 'Impressions', mul: true, sub: () => 'กระตุ้นการคลิกดีไหม', long: 'คลิก ÷ Impressions (ถ้าไม่มีคลิกทั้งหมด ใช้ Link clicks แทน)', read: 'สูง = ภาพ/พาดหัวชวนให้กดดูต่อ',
    calc: c => saRB(c.l, 'clicks', 'impressions') || Object.assign(saRB(c.l, 'linkClicks', 'impressions') || {}, { alt: true }) },
  { k: 'linkCtr', g: 'Traffic', t: () => 'Link CTR', kind: 'pct', dec: 2, num: 'Link clicks', den: 'Impressions', mul: true, sub: () => 'คลิกลิงก์ออกไปภายนอก', long: 'คลิกลิงก์ ÷ Impressions — วัดว่าคนออกไปยังเว็บไซต์หรือแบบฟอร์มจริงเท่าไร', read: 'โพสต์ประชาสัมพันธ์ที่มีลิงก์ลงทะเบียนควรดูตัวนี้เป็นหลัก', calc: c => saRB(c.l, 'linkClicks', 'impressions') },
  { k: 'viewRate', g: 'Video', t: () => 'View Rate', kind: 'pct', dec: 1, num: 'Video views', den: 'Impressions', mul: true, sub: c => `${c.nv || 0} วิดีโอ · Hook/ภาพปกดึงดูดไหม`, long: 'ยอดรับชมวิดีโอ ÷ Impressions ของโพสต์วิดีโอ', read: 'เกิน 100% ได้ เพราะบางแพลตฟอร์มนับการดูซ้ำ/เล่นอัตโนมัติเป็นยอดดู',
    calc: c => { const x = c.l.filter(p => p.v && (p.v.videoViews || p.v.s3) && p.m.impressions); return saRatio(x, p => p.v.videoViews, p => p.m.impressions); } },
  { k: 'completion', g: 'Video', t: () => 'Completion Rate', kind: 'pct', dec: 1, num: 'ดูจบ 100%', den: 'Video starts', mul: true, sub: () => 'รักษาความสนใจได้ไหม', long: 'จำนวนที่ดูจบ ÷ จำนวนที่เริ่มดู (ใช้ยอดดู 3 วินาทีเป็นจุดเริ่ม ถ้ามี)', read: 'วิดีโอสั้นควรเกิน 15–20% ถ้าต่ำ ลองตัดให้สั้นลงและใส่ประเด็นใน 3 วินาทีแรก',
    calc: c => { const x = c.l.filter(p => p.v && p.v.p100 != null && (p.v.s3 || p.v.videoViews)); return saRatio(x, p => p.v.p100, p => p.v.s3 || p.v.videoViews); } },
  { k: 'avgWatch', g: 'Video', t: () => 'Avg. Watch Time', kind: 'dur', num: 'Watch time รวม', den: 'Views', sub: () => 'คนดูนานเท่าไร', long: 'เวลาดูรวม ÷ ยอดดู (ถ้าไม่มีเวลาดูรวม ใช้ค่าเฉลี่ยที่แพลตฟอร์มรายงาน)', read: 'เทียบกับความยาววิดีโอ ถ้าดูได้เกินครึ่งถือว่าดี',
    calc: c => { const v = c.l.filter(p => p.v && p.v.totalWatch && p.v.videoViews); if (v.length) return saRatio(v, p => p.v.totalWatch, p => p.v.videoViews); const m = saMean(c.l.filter(p => p.v).map(p => p.v.avgWatch)); return m == null ? null : { v: m, mean: true, n: c.l.filter(p => p.v && p.v.avgWatch != null).length }; } },
  { k: 'folG', g: 'Brand & Community', t: () => 'Follower Growth Rate', kind: 'growth', num: 'ผู้ติดตามปลายช่วง', den: 'ผู้ติดตามต้นช่วง', sub: c => c.fd != null ? `${c.fd >= 0 ? '+' : ''}${fnum(c.fd)} คน` : 'การเติบโตของผู้ติดตาม',
    long: 'ผู้ติดตามรวมทุกช่องทางที่เลือก ณ ปลายช่วง เทียบกับวันก่อนเริ่มช่วง', read: 'บวกต่อเนื่อง = แบรนด์โตขึ้น ถ้าติดลบให้ดูว่าช่วงนั้นโพสต์น้อยหรือมีประเด็นเชิงลบ',
    calc: c => { const a = sumFol(c.ps, Math.min(c.to - 1, Date.now())), b = sumFol(c.ps, c.from - DAY); return a != null && b ? { v: (a - b) / b, num: a, den: b } : null; } },
  { k: 'sent', g: 'Brand & Community', t: () => 'Sentiment Score', kind: 'score', num: 'บวก − ลบ − ร้องเรียน', den: 'ความคิดเห็นทั้งหมด', mul: true, sub: () => 'ช่วง −100 ถึง +100', long: 'ความรู้สึกสุทธิของความคิดเห็น: (เชิงบวก − เชิงลบ − ร้องเรียน) ÷ ทั้งหมด × 100', read: 'มากกว่า 0 = คำชมมากกว่าคำติ · ติดลบ ควรเร่งตอบและแก้ประเด็น',
    calc: c => { const C = cstats(c.l); if (!C.total) return null; const pos = C.by.pos || 0, neg = (C.by.neg || 0) + (C.by.cmp || 0); return { v: (pos - neg) / C.total * 100, num: pos - neg, den: C.total, pos, neg }; } },
  { k: 'resp', g: 'Brand & Community', t: () => 'Response Rate', kind: 'pct', dec: 0, num: 'ความคิดเห็นที่ตอบแล้ว', den: 'ความคิดเห็นทั้งหมด', mul: true, sub: c => c.rt != null ? `ตอบเฉลี่ยใน ${fmins(c.rt)}` : 'การตอบกลับของเพจ', long: 'ความคิดเห็นหลักที่เพจตอบกลับแล้ว ÷ ความคิดเห็นหลักทั้งหมด', read: 'ควรใกล้ 100% สำหรับคำถาม ข้อร้องเรียน และผู้สนใจ',
    calc: c => { const C = cstats(c.l); if (!C.total) return null; const done = Math.round(C.replyRate * C.total); return { v: C.replyRate, num: done, den: C.total }; } }
];
const SA_KM = Object.fromEntries(SA_K.map(x => [x.k, x]));
const saFmt = (sp, v) => v == null || !isFinite(v) ? '—' : sp.kind === 'sum' ? fk(v) : sp.kind === 'pct' ? pp(v, sp.dec) : sp.kind === 'x' ? f2(v) : sp.kind === 'growth' ? sgn(v) : sp.kind === 'dur' ? fdur(v) : f2(v, 0);
const saFmtN = (sp, v) => sp.kind === 'dur' ? fdur(v) : fnum(v);
const SA_UNIT = { hour: 'รายชั่วโมง', day: 'รายวัน', week: 'รายสัปดาห์', month: 'รายเดือน' };
/** คำนวณทุก KPI ของช่วงปัจจุบัน ช่วงก่อนหน้า และแยกตามช่วงย่อย (ชั่วโมง/วัน/สัปดาห์/เดือน ตามความยาวช่วงที่เลือก) */
function saKpiAll(r, ps) {
  const cur = postsIn(r.from, r.to, ps), prev = r.hasPrev ? postsIn(r.pf, r.pt, ps) : [];
  const ln = ps.length === 1 && ps[0] === 'line';
  const C0 = cstats(cur), f0 = sumFol(ps, Math.min(r.to - 1, Date.now())), f1 = sumFol(ps, r.from - DAY);
  const ctx = (l, pl, from, to, pps = ps) => ({ l, pl, from, to, ps: pps, ln, nv: l.filter(p => p.v && (p.v.videoViews || p.v.s3)).length });
  const base = Object.assign(ctx(cur, r.hasPrev ? prev : null, r.from, r.to), { rt: C0.avgRT, fd: f0 != null && f1 != null ? f0 - f1 : null });
  const pb = r.hasPrev ? ctx(prev, postsIn(r.pf - (r.pt - r.pf), r.pf, ps), r.pf, r.pt) : null;
  const B = buckets(r.from, r.to);
  const bc = B.b.map(b => ctx(postsIn(b.s, b.e, ps), postsIn(b.s - (b.e - b.s), b.s, ps), b.s, b.e));
  const out = {};
  SA_K.forEach(sp => {
    const X = sp.calc(base), P = pb ? sp.calc(pb) : null;
    out[sp.k] = { sp, X: X && X.v != null && isFinite(X.v) ? X : null, P: P && P.v != null && isFinite(P.v) ? P : null, rows: B.b.map((b, i) => { const x = sp.calc(bc[i]); return { b, n: bc[i].l.length, x: x && x.v != null && isFinite(x.v) ? x : null }; }) };
  });
  return { r, ps, B, ctx: base, cur, prev, out };
}
function saTile(K, key) {
  const o = K.out[key]; if (!o || !o.X) return '';
  const sp = o.sp, g = SA_G[sp.g], d = sp.prev ? null : (o.P ? delta(o.X.v, o.P.v) : null);
  const vals = o.rows.map(x => x.x ? x.x.v : null).filter(v => v != null);
  return `<button class="sa-k" data-act="sa-kpi" data-v="${key}" style="--gc:${g.c}" aria-haspopup="dialog" aria-label="${esc(sp.t(K.ctx))} ${esc(saFmt(sp, o.X.v))} — กดดูรายละเอียด">
    <span class="sa-k-top"><span class="sa-k-ic">${ic(g.ic, 14)}</span><span class="sa-k-n">${esc(sp.t(K.ctx))}</span>${d != null && K.r.hasPrev ? dpill(d) : ''}</span>
    <b class="${sp.kind === 'sum' ? '' : 'num-cu'}">${sp.kind === 'sum' ? cnt(o.X.v, 'k', null, 'sk-' + key) : saFmt(sp, o.X.v)}</b>
    <small>${esc(sp.sub(K.ctx))}</small>
    <span class="sa-k-foot">${vals.length > 1 ? spark(vals, g.c, 132, 30) : '<span></span>'}<span class="sa-k-more">รายละเอียด ${ic('arrow', 12)}</span></span>
  </button>`;
}
/* ----- ป๊อปอัปรายละเอียด KPI + สูตรคำนวณแบบแทนค่า ----- */
const fxFrac = (a, b) => `<span class="fx-frac"><span>${a}</span><span>${b}</span></span>`;
function saSubst(sp, x, big) {
  if (!x) return '<span class="muted">ไม่มีข้อมูลพอคำนวณ</span>';
  const res = `<span class="fx-eq">=</span><b class="fx-res${big ? ' big' : ''}">${saFmt(sp, x.v)}</b>`;
  if (sp.kind === 'sum') return x.parts && x.parts.length > 1 ? `<span class="fx-sum">${x.parts.map(([t, v]) => `<span class="fx-term"><b>${fnum(v)}</b><small>${t}</small></span>`).join('<span class="fx-op">+</span>')}</span>${res}` : `<span class="fx-term"><b>Σ</b><small>${x.n != null ? fnum(x.n) + ' โพสต์' : ''}</small></span>${res.replace(saFmt(sp, x.v), fnum(x.v))}`;
  if (sp.kind === 'growth') return `${fxFrac(`${fnum(x.num)} − ${fnum(x.den)}`, fnum(x.den))}<span class="fx-op">× 100</span>${res}`;
  if (x.mean) return `<span class="fx-term"><b>ค่าเฉลี่ย</b><small>${x.n} วิดีโอ</small></span>${res}`;
  if (sp.k === 'sent') return `${fxFrac(`${fnum(x.pos)} − ${fnum(x.neg)}`, fnum(x.den))}<span class="fx-op">× 100</span>${res}`;
  return `${fxFrac(saFmtN(sp, x.num), saFmtN(sp, x.den))}${sp.mul ? '<span class="fx-op">× 100</span>' : ''}${res}`;
}
function saGeneric(sp) {
  if (sp.kind === 'sum') return sp.k === 'eng' ? `<span class="fx-sum">${['Like', 'Comment', 'Share', 'Save'].map(t => `<span class="fx-term"><b>${t}</b></span>`).join('<span class="fx-op">+</span>')}</span><span class="fx-eq">=</span><b class="fx-res">${sp.t({})}</b>` : `<span class="fx-term"><b>Σ ${sp.num}</b><small>ทุกโพสต์ในช่วง</small></span><span class="fx-eq">=</span><b class="fx-res">${sp.t({})}</b>`;
  if (sp.kind === 'growth') return `${fxFrac(`${sp.num} − ${sp.den}`, sp.den)}<span class="fx-op">× 100</span><span class="fx-eq">=</span><b class="fx-res">${sp.t({})}</b>`;
  return `${fxFrac(sp.num, sp.den)}${sp.mul ? '<span class="fx-op">× 100</span>' : ''}<span class="fx-eq">=</span><b class="fx-res">${sp.t({})}</b>`;
}
function saPeriodLabel(r) {
  if (r.cal === 'year') return 'รายปี · ปี พ.ศ. ' + (new Date(r.from).getFullYear() + 543);
  if (r.cal === 'month') { const d = new Date(r.from); return 'รายเดือน · ' + TH_MON[d.getMonth()] + ' ' + (d.getFullYear() + 543); }
  const p = S.f.period; return p === 'custom' ? 'กำหนดเอง' : p === 'month' ? '30 วันล่าสุด' : p === 'year' ? '12 เดือนล่าสุด' : p === 'week' ? '7 วันล่าสุด' : p === 'day' ? 'วันนี้' : 'ทั้งหมด';
}
function saBars(o) {
  const rows = o.rows, vals = rows.map(x => x.x ? x.x.v : null), pos = Math.max(0, ...vals.filter(v => v != null)), neg = Math.max(0, ...vals.filter(v => v != null).map(v => -v));
  const tot = pos + neg || 1, z = pos / tot, every = Math.max(1, Math.ceil(rows.length / (innerWidth < 640 ? 6 : 12))), mxI = vals.indexOf(pos || null);
  return `<div class="kb" style="--z:${z.toFixed(4)}">${rows.map((x, i) => { const v = vals[i], h = v == null ? 0 : Math.abs(v) / tot; const tip = `${o.B.u === 'day' ? fdate(x.b.s) : o.B.u === 'week' ? fds(x.b.s) + ' – ' + fdate(x.b.e - 1) : x.b.l} · ${v == null ? 'ไม่มีข้อมูล' : saFmt(o.sp, v)}${x.n ? ` · ${x.n} โพสต์` : ''}`;
    return `<div class="kb-c${v == null ? ' na' : v < 0 ? ' neg' : ''}${i === mxI && v ? ' top' : ''}" style="--h:${h.toFixed(4)};--i:${Math.min(i, 40)}" data-tip="${esc(tip)}" tabindex="0"><i></i><span>${i % every === 0 ? esc(x.b.l) : ''}</span></div>`; }).join('')}</div>`;
}
function kpopHtml(key) {
  const K = saKpiAll(range(), shownP()), o = K.out[key]; if (!o) return '';
  const sp = o.sp, g = SA_G[sp.g], r = K.r, name = sp.t(K.ctx), unit = SA_UNIT[K.B.u] || '';
  o.B = K.B;
  const have = o.rows.filter(x => x.x);
  const hi = have.length ? have.reduce((a, b) => b.x.v > a.x.v ? b : a) : null, lo = have.length ? have.reduce((a, b) => b.x.v < a.x.v ? b : a) : null;
  const avg = saMean(have.map(x => x.x.v)), d = !sp.prev && o.P && o.X ? delta(o.X.v, o.P.v) : null;
  const bl = x => K.B.u === 'day' ? fdate(x.b.s) : K.B.u === 'week' ? `${fds(x.b.s)} – ${fdate(x.b.e - 1)}` : K.B.u === 'hour' ? x.b.l + ' น.' : x.b.l;
  const byPl = K.ps.length > 1 ? K.ps.map(p => { const cx = { l: K.cur.filter(x => x.platform === p), pl: r.hasPrev ? K.prev.filter(x => x.platform === p) : null, from: r.from, to: r.to, ps: [p], ln: p === 'line' }; const x = sp.calc(cx); return { p, x: x && x.v != null && isFinite(x.v) ? x : null }; }).filter(x => x.x) : [];
  const plMax = Math.max(1e-9, ...byPl.map(x => Math.abs(x.x.v)));
  const odd = key === 'erR' || key === 'erI' ? K.cur.filter(p => { const b = key === 'erR' ? p.m.reach : p.m.impressions; return b && engP(p) > b; }).length : 0;
  const colHead = sp.kind === 'sum' ? '<th class="r">โพสต์</th><th class="r">' + esc(sp.num) + '</th>' : sp.kind === 'growth' ? `<th class="r">${esc(sp.num)}</th><th class="r">${esc(sp.den)}</th>` : `<th class="r">${esc(sp.num)}</th><th class="r">${esc(sp.den || '')}</th>`;
  const colRow = x => sp.kind === 'sum' ? `<td class="r">${fnum(x.n)}</td><td class="r">${x.x ? fnum(x.x.v) : '—'}</td>` : x.x && !x.x.mean ? `<td class="r">${sp.k === 'sent' ? `${fnum(x.x.pos)} − ${fnum(x.x.neg)}` : saFmtN(sp, x.x.num)}</td><td class="r">${saFmtN(sp, x.x.den)}</td>` : '<td class="r">—</td><td class="r">—</td>';
  return `<div class="pop-head"><span class="pop-ic" style="--gc:${g.c}">${ic(g.ic, 18)}</span><div class="pop-ttl"><small>${esc(sp.g)} · ${esc(g.th)}</small><h2 id="kpop-title">${esc(name)}</h2></div><button class="pop-x" data-act="kpop-close" aria-label="ปิดหน้าต่าง">${ic('x', 20)}</button></div>
  <div class="pop-body" style="--gc:${g.c}">
    <div class="kp-hero" style="--gc:${g.c}"><div class="kp-val"><b class="${sp.kind === 'sum' ? '' : 'num-cu'}">${sp.kind === 'sum' ? cnt(o.X ? o.X.v : null, 'n') : saFmt(sp, o.X && o.X.v)}</b>${d != null ? dpill(d) : ''}</div>
      <div class="kp-meta"><span class="kp-per">${ic('cal', 13)} ${esc(saPeriodLabel(r))}</span><span>${rangeText(r)}</span><span>${K.ps.map(p => PL[p].name).join(' · ')}</span>${r.hasPrev && o.P ? `<span>ช่วงก่อนหน้า ${fds(r.pf)} – ${fdate(r.pt - 1)}: <b>${saFmt(sp, o.P.v)}</b></span>` : ''}</div>
      <p class="kp-long">${esc(sp.long)}</p><p class="kp-read">${ic('spark', 13)} ${esc(sp.read)}</p></div>
    <section class="kp-sec"><div class="kp-sh"><h3>แยก${unit}</h3><small>${have.length} จาก ${o.rows.length} ช่วงมีข้อมูล · แตะแท่งเพื่อดูค่า</small></div>${saBars(o)}
      <div class="kp-stats"><div><small>สูงสุด</small><b>${hi ? saFmt(sp, hi.x.v) : '—'}</b><span>${hi ? esc(bl(hi)) : ''}</span></div><div><small>ต่ำสุด</small><b>${lo ? saFmt(sp, lo.x.v) : '—'}</b><span>${lo ? esc(bl(lo)) : ''}</span></div><div><small>เฉลี่ยต่อช่วง</small><b>${saFmt(sp, avg)}</b><span>${unit}</span></div><div><small>ทั้งช่วงที่เลือก</small><b>${saFmt(sp, o.X && o.X.v)}</b><span>${sp.kind === 'sum' ? 'ผลรวม' : 'คิดจากผลรวม'}</span></div></div></section>
    ${byPl.length > 1 ? `<section class="kp-sec"><div class="kp-sh"><h3>แยกตามช่องทาง</h3></div><div class="kp-pl">${byPl.map(x => `<div class="kp-pl-r"><span>${platChip(x.p)}</span><div class="kp-pl-b"><i style="width:${(Math.abs(x.x.v) / plMax * 100).toFixed(1)}%;background:${PL[x.p].c}"></i></div><b>${saFmt(sp, x.x.v)}</b></div>`).join('')}</div></section>` : ''}
    ${odd ? `<div class="callout warn">${ic('alert', 16)}<div>มี <b>${odd} โพสต์</b> ที่ Engagement มากกว่า${key === 'erR' ? ' Reach' : ' Impressions'} (ER เกิน 100%) — มักเกิดจากกรอก Reach ผิดหรือไฟล์ไม่มีค่า Reach ควรตรวจและแก้ไขโพสต์เหล่านั้น</div></div>` : ''}
    <div class="kx-btn-row"><button class="btn kx-btn" data-act="kpop-fx" aria-expanded="false" aria-controls="kx">${ic('strategy', 15)} <span>สูตรคำนวณ</span> <svg class="kx-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>
    <div class="kx-wrap" id="kx"><div class="kx-in"><div class="kx">
      <div class="kx-step"><span class="kx-n">1</span><div><h4>สูตร</h4><div class="fx">${saGeneric(sp)}</div></div></div>
      <div class="kx-step"><span class="kx-n">2</span><div><h4>แทนค่า · ${esc(saPeriodLabel(r))} (${rangeText(r)})</h4><div class="fx">${saSubst(sp, o.X, true)}</div>${o.X && o.X.alt ? '<p class="note">ไม่มีข้อมูลคลิกทั้งหมด จึงใช้ Link clicks แทน</p>' : ''}</div></div>
      ${r.hasPrev ? `<div class="kx-step"><span class="kx-n">3</span><div><h4>ช่วงก่อนหน้า (${fds(r.pf)} – ${fdate(r.pt - 1)})</h4><div class="fx">${saSubst(sp, o.P)}</div>${o.X && o.P && !sp.prev ? `<p class="note">เปลี่ยนแปลง (${saFmt(sp, o.X.v)} − ${saFmt(sp, o.P.v)}) ÷ ${saFmt(sp, o.P.v)} = <b>${sgn(delta(o.X.v, o.P.v))}</b></p>` : ''}</div></div>` : ''}
      <div class="kx-step"><span class="kx-n">${r.hasPrev ? 4 : 3}</span><div style="min-width:0;flex:1"><h4>แทนค่าแยก${unit}</h4>
        <div class="tbl-wrap kx-tbl"><table class="tbl"><thead><tr><th>ช่วง</th>${colHead}<th class="r">ผลลัพธ์</th></tr></thead><tbody>${have.map(x => `<tr><td>${esc(bl(x))}</td>${colRow(x)}<td class="r"><b>${saFmt(sp, x.x.v)}</b></td></tr>`).join('') || '<tr><td colspan="4" class="muted">ไม่มีข้อมูล</td></tr>'}</tbody></table></div></div></div>
      <p class="note kx-note">${sp.kind === 'sum' ? 'ผลรวมของทุกโพสต์ที่โพสต์ในช่วงนั้น' : sp.kind === 'growth' ? 'แต่ละช่วงย่อยเทียบกับช่วงก่อนหน้าที่ยาวเท่ากันของตัวเอง' : 'อัตราของทั้งช่วงคิดจาก “ผลรวมตัวตั้ง ÷ ผลรวมตัวหาร” ของโพสต์ที่มีข้อมูลครบทั้งสองช่อง (ถ่วงน้ำหนักตามขนาด) จึงไม่เท่ากับค่าเฉลี่ยของแต่ละช่วงย่อย · โพสต์ที่ไม่มีข้อมูลช่องใดช่องหนึ่งจะไม่ถูกนับ'}</p>
    </div></div></div>
  </div>`;
}
const KPOP = { key: null };
function kpopOpen(key) {
  KPOP.key = key; let w = $('#kpop'); if (!w) { w = document.createElement('div'); w.id = 'kpop'; document.body.appendChild(w); }
  w.className = 'pop-wrap'; w.innerHTML = `<div class="pop-bd" data-act="kpop-close"></div><div class="pop kpop" role="dialog" aria-modal="true" aria-labelledby="kpop-title">${PENG_PEEK}<div class="pop-card" id="kpop-card">${kpopHtml(key)}</div></div>`;
  document.body.classList.add('modal-open'); void w.offsetWidth; w.classList.add('on');
  setTimeout(() => { const b = $('#kpop .pop-x'); if (b) b.focus(); }, 60);
}
function kpopRefresh() { if (!KPOP.key) return; const c = $('#kpop-card'); if (!c) return; const open = $('#kx', c) && $('#kx', c).classList.contains('on'); const sc = $('.pop-body', c) ? $('.pop-body', c).scrollTop : 0; paint(c, kpopHtml(KPOP.key)); if (open) { $('#kx', c).classList.add('on'); const b = $('[data-act="kpop-fx"]', c); if (b) { b.setAttribute('aria-expanded', 'true'); b.querySelector('span').textContent = 'ซ่อนสูตรคำนวณ'; } } const bd = $('.pop-body', c); if (bd) bd.scrollTop = sc; }
function kpopClose() { KPOP.key = null; const w = $('#kpop'); if (!w) return; w.classList.remove('on'); w.classList.add('off'); if (!$('#drawer.on') && !$('#modal.on')) document.body.classList.remove('modal-open'); setTimeout(() => { if (!w.classList.contains('on')) w.remove(); }, 420); }
function kpopFx(btn) { const x = $('#kx'); if (!x) return; const on = !x.classList.contains('on'); x.classList.toggle('on', on); btn.setAttribute('aria-expanded', String(on)); btn.querySelector('span').textContent = on ? 'ซ่อนสูตรคำนวณ' : 'สูตรคำนวณ'; if (on) setTimeout(() => { const b = $('#kpop .pop-body'); if (b) b.scrollTo({ top: b.scrollTop + Math.min(320, x.getBoundingClientRect().top - b.getBoundingClientRect().top - 60), behavior: 'smooth' }); }, 120); }
VIEWS.strategy = function () {
  const r = range(), ps = shownP(), cur = postsIn(r.from, r.to, ps), prev = r.hasPrev ? postsIn(r.pf, r.pt, ps) : [];
  const A = saAgg(cur), B = saAgg(prev), C = cstats(cur), D = cstats(prev);
  const sa = S.sa || (S.sa = { er: 'reach', obj: 'overall' });
  const endMs = Math.min(r.to - 1, Date.now());
  const fNow = sumFol(ps, endMs), fStart = sumFol(ps, r.from - DAY), fPrevStart = sumFol(ps, r.pf - DAY);
  const folG = fNow != null && fStart ? (fNow - fStart) / fStart : null, folGPrev = r.hasPrev && fStart != null && fPrevStart ? (fStart - fPrevStart) / fPrevStart : null;
  const H = saHealth(A, B, C, D, folG, folGPrev, ps);
  if (!cur.length) return `<div class="stack">${emptyState('ยังไม่มีโพสต์ในช่วงที่เลือก', 'เลือกช่วงเวลาหรือแพลตฟอร์มอื่นด้านบน แล้วระบบจะคำนวณสูตรให้ทันที', `<button class="btn" data-act="per" data-v="all">ดูทุกช่วงเวลา</button>`)}</div>`;
  const SC = saScores(cur); const ER = sa.er === 'reach' ? 'erR' : 'erI';
  const LN = ps.length === 1 && ps[0] === 'line';

  // ---------- ระดับผู้บริหาร ----------
  const [lvT, lvC] = saLevel(H.score);
  const gauge = v => { const R = 54, Cc = 2 * Math.PI * R, a = v == null ? 0 : v / 100; return `<svg viewBox="0 0 140 140" class="sa-gauge"><circle cx="70" cy="70" r="${R}" class="g-bg"/><circle cx="70" cy="70" r="${R}" class="g-fg" style="stroke:${lvC};stroke-dasharray:${(Cc * a).toFixed(1)} ${Cc.toFixed(1)}"/></svg><div class="sa-gauge-c"><b>${v == null ? '—' : cnt(v, 'n', null, 'sa-h')}</b><span style="color:${lvC}">${lvT}</span></div>`; };
  const plStats = ps.map(p => ({ p, a: saAgg(cur.filter(x => x.platform === p)), c: cstats(cur.filter(x => x.platform === p)) })).filter(x => x.a.n);
  const pillar = CATS.map(c => { const l = cur.filter(x => x.cat === c.k); return { k: c.k, t: c.t, c: c.c, n: l.length, a: saAgg(l) }; }).filter(x => x.n);
  const fmt = TYPES.map(t => { const l = cur.filter(x => x.type === t); return { t, n: l.length, a: saAgg(l) }; }).filter(x => x.n);
  const best = (list, key, min = 2) => list.filter(x => x.n >= min && x.a[key] != null).sort((a, b) => b.a[key] - a.a[key])[0];
  const worst = (list, key, min = 2) => list.filter(x => x.n >= min && x.a[key] != null).sort((a, b) => a.a[key] - b.a[key])[0];
  // ช่วงเวลาที่ดีที่สุด (แยกตามวัตถุประสงค์)
  const slots = {}; cur.forEach(p => { const d = new Date(p.at), di = (d.getDay() + 6) % 7, h = d.getHours(), bi = SA_SLOT.findIndex(b => h >= b[0] && h < b[1]); const k = di + '-' + bi; const sr = SC.get(p.id); (slots[k] = slots[k] || { di, bi, l: [] }).l.push({ er: sr.rates[ER] != null ? sr.rates[ER] : sr.rates.erI, ctr: sr.rates.ctr, idx: sr.rates.reachIdx }); });
  const slotBest = key => Object.values(slots).map(s => ({ s, v: saMean(s.l.map(x => x[key])), n: s.l.filter(x => x[key] != null).length })).filter(x => x.v != null && x.n >= 2).sort((a, b) => b.v - a.v)[0];
  const bE = slotBest('er'), bC = slotBest('ctr'), bR = slotBest('idx');
  const slotTxt = x => x ? `${SA_DOW[x.s.di]} ${SA_SLOT[x.s.bi][2]} น.` : '—';
  const needs = C.needs.length;
  const g = (a, b) => saGrowth(a, b);
  const bestPl = plStats.length > 1 ? [...plStats].filter(x => x.a[ER] != null).sort((a, b) => b.a[ER] - a.a[ER])[0] : null;
  const topReachPl = plStats.length > 1 ? [...plStats].sort((a, b) => n0(b.a.reach || b.a.imp) - n0(a.a.reach || a.a.imp))[0] : null;
  const bp = best(pillar, 'meanER'), wp = worst(pillar, 'meanER'), bSave = best(pillar, 'saveR'), bShare = best(pillar, 'shareR'), bf = best(fmt, 'meanER');
  const exec = [
    H.score != null && `สุขภาพโซเชียลโดยรวม <b>${Math.round(H.score)} คะแนน (${lvT})</b>${r.hasPrev ? ' เทียบกับช่วงก่อนหน้าที่ยาวเท่ากัน' : ''}`,
    (A.reach || A.imp) && `${LN ? 'ส่งถึง' : 'เข้าถึง'} <b>${fk(A.reach || A.imp)}</b>${r.hasPrev && g(A.reach || A.imp, B.reach || B.imp) != null ? ` (${sgn(g(A.reach || A.imp, B.reach || B.imp))} จากช่วงก่อน)` : ''} จาก ${fnum(A.n)} โพสต์ · ${sa.er === 'reach' ? 'ER by Reach' : 'ER by Impression'} <b>${pp(A[ER], 2)}</b>${r.hasPrev && B[ER] ? ` (${sgn(g(A[ER], B[ER]))})` : ''}`,
    bestPl && `ช่องทางที่ผู้ชมมีส่วนร่วมดีที่สุดคือ <b>${PL[bestPl.p].name}</b> (${pp(bestPl.a[ER], 2)})${topReachPl && topReachPl.p !== bestPl.p ? ` ขณะที่ <b>${PL[topReachPl.p].name}</b> เข้าถึงคนมากที่สุด` : ''}`,
    bp && `คอนเทนต์หมวด <b>${bp.t}</b> ได้ ER เฉลี่ยสูงสุด (${pp(bp.a.meanER, 2)})${bSave && bSave.k !== bp.k ? ` · หมวด <b>${bSave.t}</b> ถูกบันทึกเก็บมากที่สุด (Save ${pp(bSave.a.saveR, 2)})` : ''}`,
    bE && `ช่วงเวลาที่ได้ Engagement ดีที่สุดคือ <b>${slotTxt(bE)}</b>${bC && (bC.s.di !== bE.s.di || bC.s.bi !== bE.s.bi) ? ` แต่ช่วงที่คนคลิกมากที่สุดคือ <b>${slotTxt(bC)}</b>` : ''}`,
    C.total && `ความรู้สึกสุทธิ (Sentiment Score) <b>${f2(((C.by.pos || 0) - (C.by.neg || 0) - (C.by.cmp || 0)) / C.total * 100, 0)}</b> · ตอบกลับ ${pp(C.replyRate, 0)}${needs ? ` · <b style="color:var(--bad)">ค้างตอบ ${needs} รายการ</b>` : ''}`
  ].filter(Boolean);
  const acts = [
    bf && fmt.length > 1 && `เพิ่มสัดส่วนรูปแบบ <b>${bf.t}</b> ซึ่งได้ ER เฉลี่ยสูงสุด (${pp(bf.a.meanER, 2)}, ${bf.n} โพสต์)`,
    bE && `ตั้งเวลาโพสต์หลักไว้ช่วง <b>${slotTxt(bE)}</b>${bC && (bC.s.di !== bE.s.di || bC.s.bi !== bE.s.bi) ? ` และโพสต์ที่ต้องการให้คลิกลิงก์ไว้ช่วง <b>${slotTxt(bC)}</b>` : ''}`,
    wp && wp.k !== (bp && bp.k) && `หมวด <b>${wp.t}</b> มี ER ต่ำสุด (${pp(wp.a.meanER, 2)}) — ลองเปลี่ยน Hook ภาพปก หรือรูปแบบเป็น ${bf ? bf.t : 'วิดีโอสั้น'}`,
    bShare && `ใช้แนวทางของหมวด <b>${bShare.t}</b> เมื่ออยากให้คนบอกต่อ (Share Rate ${pp(bShare.a.shareR, 2)})`,
    needs && `ตอบคำถาม/ข้อร้องเรียน/ผู้สนใจที่ยังค้าง <b>${needs} รายการ</b> เพื่อรักษาความรู้สึกเชิงบวก`,
    A.completion != null && A.completion < .15 && `วิดีโอดูจบเฉลี่ยเพียง ${pp(A.completion, 1)} — ใส่ประเด็นสำคัญใน 3 วินาทีแรกและตัดให้สั้นลง`,
    folG != null && folG <= 0 && 'ผู้ติดตามไม่เพิ่มในช่วงนี้ — เพิ่มคอนเทนต์ที่ชวนติดตาม (ซีรีส์ / Engagement Post) และใส่ CTA ให้กดติดตาม'
  ].filter(Boolean).slice(0, 5);
  const summaryText = [`สรุปวิเคราะห์เชิงกลยุทธ์ · ${rangeText(r)} · ${ps.map(p => PL[p].name).join(', ')}`, ...exec.map(x => '• ' + x.replace(/<[^>]+>/g, '')), 'สิ่งที่ควรทำต่อ:', ...acts.map((x, i) => `${i + 1}. ${x.replace(/<[^>]+>/g, '')}`)].join('\n');
  S.saText = summaryText;
  const execSec = `<section class="panel sa-exec"><div class="panel-head"><div><span class="sa-lv">ระดับผู้บริหาร</span><h2>สรุปภาพรวมเชิงกลยุทธ์</h2><p>${rangeText(r)} · ${ps.map(p => PL[p].name).join(' · ')} · เทียบกับช่วงก่อนหน้าที่ยาวเท่ากัน</p></div><div class="sa-head-btns"><button class="btn sm" data-act="sa-copy">${ic('copy', 14)} คัดลอกสรุป</button><button class="btn sm" data-act="sa-catalog">${ic('strategy', 14)} สูตรทั้งหมด</button></div></div>
    <div class="sa-exec-grid"><div class="sa-health"><div class="sa-gauge-w">${gauge(H.score)}</div><p class="note" style="text-align:center;margin:6px 0 0">Social Health Score<br><small>70 = เท่ากับช่วงก่อนหน้า</small></p>
      <div class="sa-parts">${H.parts.map(x => `<div class="sa-part${x.v == null ? ' na' : ''}" title="${esc(x.why)}"><span>${x.t}<small>${x.w}%</small></span><div class="sa-pbar"><i style="width:${x.v == null ? 0 : x.v}%;background:${saLevel(x.v)[1]}"></i></div><b>${x.v == null ? 'ไม่มีข้อมูล' : Math.round(x.v)}</b></div>`).join('')}</div></div>
     <div class="sa-exec-txt"><h3>${ic('spark', 15)} ข้อค้นพบสำคัญ</h3><ul class="sa-list">${exec.map(x => `<li>${x}</li>`).join('')}</ul>
      ${acts.length ? `<h3>${ic('arrow', 15)} สิ่งที่ควรทำต่อ</h3><ol class="sa-acts">${acts.map(x => `<li><span>${x}</span></li>`).join('')}</ol>` : ''}</div></div></section>`;

  // ---------- ตัวชี้วัดตามสูตร: การ์ดสรุป กดแล้วเปิดป๊อปอัปพร้อมสูตรแทนค่า ----------
  const K = saKpiAll(r, ps);
  const order = { Awareness: ['reach', 'imp', 'freq', 'reachG'], Engagement: ['eng', sa.er === 'reach' ? 'erR' : 'erI', sa.er === 'reach' ? 'erI' : 'erR', 'cmtR', 'shareR', 'saveR', 'clickR'], Traffic: ['ctr', 'linkCtr'], Video: A.vids ? ['viewRate', 'completion', 'avgWatch'] : [], 'Brand & Community': ['folG', 'sent', 'resp'] };
  const groups = Object.entries(order).map(([t, keys]) => [t, SA_G[t].ic, keys.map(k => saTile(K, k)).filter(Boolean)]).filter(x => x[2].length);
  const kpiSec = `<section class="panel"><div class="panel-head"><div><span class="sa-lv">ตัวชี้วัดตามสูตร</span><h2>KPI ที่คำนวณได้จากข้อมูลของเรา</h2><p>${esc(saPeriodLabel(r))} · กดการ์ดเพื่อดูรายละเอียดแยก${SA_UNIT[K.B.u] || ''} และสูตรคำนวณแบบแทนค่า · ป้ายสีเทียบกับช่วงก่อนหน้า</p></div>
    <div class="seg" role="group" aria-label="ฐานของ Engagement Rate"><button data-act="sa-er" data-v="reach" aria-pressed="${sa.er === 'reach'}">ER by Reach</button><button data-act="sa-er" data-v="imp" aria-pressed="${sa.er === 'imp'}">ER by Impression</button></div></div>
    ${groups.map(([t, icon, l]) => `<div class="sa-group" style="--gc:${SA_G[t].c}"><h3><span class="sa-g-ic">${ic(icon, 14)}</span> ${t}<small>${SA_G[t].th}</small></h3><div class="sa-kgrid">${l.join('')}</div></div>`).join('')}
    <p class="note" style="margin:10px 0 0">ข้อแนะนำ: อย่าใช้ Engagement Rate สูตรเดียวทั้งองค์กร — Facebook, Instagram, TikTok, LINE และ X นับต่างกัน จึงให้เลือกดูทั้ง ER by Reach และ ER by Impression</p></section>`;

  // ---------- ระดับช่องทาง ----------
  const avgOf = k => saMean(plStats.map(x => x.a[k]));
  const plRows = plStats.map(({ p, a, c }) => {
    const pf = sumFol([p], endMs), ps0 = sumFol([p], r.from - DAY);
    const strong = [['erR', 'ER by Reach'], ['shareR', 'Share Rate'], ['saveR', 'Save Rate'], ['ctr', 'CTR'], ['viewRate', 'View Rate'], ['completion', 'ดูวิดีโอจบ']].filter(([k]) => a[k] != null && plStats.length > 1 && avgOf(k) && a[k] > avgOf(k) * 1.15).map(([, t]) => t);
    const weak = [['erR', 'ER'], ['shareR', 'การแชร์'], ['ctr', 'การคลิก'], ['completion', 'การดูจบ']].filter(([k]) => a[k] != null && plStats.length > 1 && avgOf(k) && a[k] < avgOf(k) * .8).map(([, t]) => t);
    const note = LN && p === 'line' ? `อัตราเปิดอ่าน ${pp(saDiv(a.imp, a.reach), 1)} · อัตราคลิก ${pp(saDiv(a.clicks, a.imp), 1)}` : `${strong.length ? 'จุดแข็ง: ' + strong.join(', ') : ''}${strong.length && weak.length ? ' · ' : ''}${weak.length ? 'ควรปรับ: ' + weak.join(', ') : ''}` || 'ใกล้เคียงค่าเฉลี่ยของทุกช่องทาง';
    return `<tr><td class="sa-pl">${platChip(p)}<small>${note}</small></td><td class="num">${fnum(a.n)}</td><td class="num">${fk(a.reach || a.imp)}</td><td class="num">${f2(a.freq)}</td><td class="num">${pp(a.erR, 2)}</td><td class="num">${pp(a.erI, 2)}</td><td class="num">${pp(a.shareR, 2)}</td><td class="num">${pp(a.saveR, 2)}</td><td class="num">${pp(a.ctr, 2)}</td><td class="num">${pp(a.viewRate, 1)}</td><td class="num">${pp(a.completion, 1)}</td><td class="num">${pf != null && ps0 ? sgn((pf - ps0) / ps0) : '—'}</td><td class="num">${c.total ? f2(((c.by.pos || 0) - (c.by.neg || 0) - (c.by.cmp || 0)) / c.total * 100, 0) : '—'}</td><td class="num"><b>${a.n ? fk(n0(a.eng) / a.n) : '—'}</b></td></tr>`;
  }).join('');
  const plSec = `<section class="panel"><div class="panel-head"><div><span class="sa-lv">ระดับช่องทาง</span><h2>เปรียบเทียบแต่ละโซเชียล</h2><p>อย่าดูแค่ช่องทางไหนได้คนเยอะ — ดูคุณภาพการมีส่วนร่วมของแต่ละช่องทางด้วย · เลือกดูทีละช่องทางได้จากแถบด้านบน</p></div></div>
    <div class="tbl-wrap"><table class="tbl sa-tbl"><thead><tr><th>ช่องทาง</th><th class="r">โพสต์</th><th class="r">Reach</th><th class="r">Frequency</th><th class="r">ER Reach</th><th class="r">ER Impr.</th><th class="r">Share</th><th class="r">Save</th><th class="r">CTR</th><th class="r">View</th><th class="r">ดูจบ</th><th class="r">Follower</th><th class="r">Sentiment</th><th class="r">Engagement/โพสต์</th></tr></thead><tbody>${plRows}</tbody></table></div></section>`;

  // ---------- Funnel ----------
  const fsteps = [['Impressions', A.imp], ['Reach', A.reach], ['Engagement', A.eng], ['Clicks', A.clicks], ['Link clicks', A.link], ['New followers', A.fol]].filter(([, v]) => v);
  const fmax = Math.max(...fsteps.map(x => x[1]), 1);
  const funnelSec = fsteps.length >= 3 ? `<section class="panel"><div class="panel-head"><div><span class="sa-lv">Customer journey (ช่วงโซเชียล)</span><h2>Funnel: คนหายไปที่ขั้นไหน</h2><p>ขั้นหลังคลิก (เข้าเว็บ → ลงทะเบียน/ซื้อ) ต้องเชื่อมข้อมูลเว็บไซต์หรือระบบลงทะเบียนก่อน</p></div></div>
    <div class="sa-funnel">${fsteps.map(([t, v], i) => `<div class="sa-f-row"><span class="sa-f-l">${t}</span><div class="sa-f-bar"><i style="width:${Math.max(2, v / fmax * 100)}%;--i:${i}"></i></div><b>${fk(v)}</b><small>${i ? `${pp(v / fsteps[i - 1][1], 1)} ของขั้นก่อน` : '100%'}</small></div>`).join('')}</div></section>` : '';

  // ---------- ระดับคอนเทนต์ ----------
  const ctTable = (rows, label) => `<div class="tbl-wrap"><table class="tbl sa-tbl"><thead><tr><th>${label}</th><th class="r">โพสต์</th><th class="r">Avg ER</th><th class="r">Share</th><th class="r">Save</th><th class="r">CTR</th><th class="r">View</th><th class="r">Post Score</th></tr></thead><tbody>
    ${rows.sort((a, b) => n0(b.a.meanER) - n0(a.a.meanER)).map(x => { const l = cur.filter(p => label === 'หมวด (Pillar)' ? p.cat === x.k : p.type === x.t); const sc = saMean(l.map(p => SC.get(p.id).sc.overall)); return `<tr><td>${x.c ? `<i class="dot" style="background:${x.c}"></i> ` : ''}${esc(x.t)}</td><td class="num">${x.n}</td><td class="num"><b>${pp(x.a.meanER, 2)}</b></td><td class="num">${pp(x.a.shareR, 2)}</td><td class="num">${pp(x.a.saveR, 2)}</td><td class="num">${pp(x.a.ctr, 2)}</td><td class="num">${pp(x.a.viewRate, 1)}</td><td class="num">${sc != null ? Math.round(sc) : '—'}</td></tr>`; }).join('')}</tbody></table></div>`;
  const ctIns = [bp && `<b>${bp.t}</b> ได้ ER เฉลี่ยสูงสุด ${pp(bp.a.meanER, 2)}`, bSave && `<b>${bSave.t}</b> มีคุณค่าจนถูกบันทึกมากที่สุด (Save ${pp(bSave.a.saveR, 2)})`, bShare && `<b>${bShare.t}</b> ถูกบอกต่อมากที่สุด (Share ${pp(bShare.a.shareR, 2)})`, best(pillar, 'ctr') && `<b>${best(pillar, 'ctr').t}</b> พาคนคลิกได้ดีที่สุด (CTR ${pp(best(pillar, 'ctr').a.ctr, 2)})`, bf && `รูปแบบ <b>${bf.t}</b> ทำผลงานดีที่สุด (ER ${pp(bf.a.meanER, 2)})`].filter(Boolean);
  const contentSec = `<section class="panel"><div class="panel-head"><div><span class="sa-lv">ระดับคอนเทนต์</span><h2>คอนเทนต์แบบไหนทำงานดีที่สุด</h2><p>Average ER = ΣER ของแต่ละโพสต์ ÷ จำนวนโพสต์ · แยกตามหมวด (Content Pillar) และรูปแบบ (Format)</p></div></div>
    ${ctIns.length ? `<ul class="sa-list sa-ins">${ctIns.map(x => `<li>${x}</li>`).join('')}</ul>` : ''}
    <div class="grid-2">${ctTable(pillar.map(x => Object.assign({}, x)), 'หมวด (Pillar)')}${ctTable(fmt.map(x => Object.assign({}, x)), 'รูปแบบ (Format)')}</div></section>`;

  // ---------- ระดับโพสต์ ----------
  const ob = SA_OBJ[sa.obj];
  const ranked = cur.map(p => ({ p, s: SC.get(p.id) })).filter(x => x.s.sc[sa.obj] != null).sort((a, b) => b.s.sc[sa.obj] - a.s.sc[sa.obj]);
  const why = (x, bad) => { const w = ob.w; const r2 = x.s.rates; const lab = { likeR: 'Like', cmtR: 'Comment', shareR: 'Share', saveR: 'Save', clickR: 'Click', reachIdx: 'Reach', viewRate: 'View', ctr: 'CTR', linkCtr: 'Link CTR', pvR: 'Profile visit', folR: 'Follow' }; const ks = Object.keys(w).filter(k => r2[k] != null); if (!ks.length) return ''; const k = ks.sort((a, b2) => bad ? (r2[a] || 0) * w[a] - (r2[b2] || 0) * w[b2] : (r2[b2] || 0) * w[b2] - (r2[a] || 0) * w[a])[0]; return `${bad ? 'ต่ำสุดที่' : 'เด่นที่'} ${lab[k]} ${k === 'reachIdx' ? f2(r2[k], 1) + '× ค่ากลาง' : pp(r2[k], 2)}`; };
  const pRow = (x, i, bad) => `<button class="sa-post" data-act="open" data-id="${x.p.id}"><span class="sa-rank${bad ? ' bad' : ''}">${i + 1}</span><span class="sa-pt"><b>${esc(x.p.caption || x.p.type)}</b><small>${platChip(x.p.platform)} ${esc(x.p.type)} · ${fds(x.p.at)} · ${why(x, bad)}</small></span><span class="sa-sc"><i style="width:${x.s.sc[sa.obj]}%;background:${saLevel(x.s.sc[sa.obj])[1]}"></i><b>${Math.round(x.s.sc[sa.obj])}</b></span></button>`;
  const postSec = `<section class="panel"><div class="panel-head"><div><span class="sa-lv">ระดับโพสต์</span><h2>${ob.t}</h2><p>${ob.f} · แต่ละอัตราแปลงเป็นเปอร์เซ็นไทล์ (0–100) เทียบกับโพสต์ในแพลตฟอร์มเดียวกัน</p></div>
    <div class="seg" role="group" aria-label="วัตถุประสงค์">${Object.entries(SA_OBJ).map(([k, o]) => `<button data-act="sa-obj" data-v="${k}" aria-pressed="${sa.obj === k}">${o.th}</button>`).join('')}</div></div>
    ${ranked.length ? `<div class="grid-2"><div><h3 class="sa-sub">${ic('spark', 14)} ดีที่สุด 5 อันดับ</h3>${ranked.slice(0, 5).map((x, i) => pRow(x, i)).join('')}</div><div><h3 class="sa-sub">${ic('clock', 14)} ควรทบทวน</h3>${ranked.length > 5 ? ranked.slice(-Math.min(5, ranked.length - 5)).reverse().map((x, i) => pRow(x, ranked.length - 1 - i - (i ? 0 : 0) > 0 ? i : i, true)).join('') : '<div class="empty">มีโพสต์น้อยกว่า 6 โพสต์ ยังจัดอันดับล่างไม่ได้</div>'}</div></div>` : `<div class="empty">ข้อมูลโพสต์ยังไม่พอคำนวณคะแนนแบบนี้ (ต้องมีตัวชี้วัดอย่างน้อย 30% ของน้ำหนัก)</div>`}
    ${sa.obj === 'action' ? `<p class="note" style="margin:10px 0 0">Conversion Score ในเอกสารต้องใช้ยอดขาย/CPA ซึ่งระบบยังไม่มี จึงใช้ Action Score ที่วัดการพาคนไปขั้นถัดไปแทน</p>` : ''}</section>`;

  // ---------- Best posting pattern ----------
  const slotRows = [['Engagement สูงสุด', bE, x => pp(x.v, 2) + ' ER'], ['คลิกมากที่สุด (CTR)', bC, x => pp(x.v, 2) + ' CTR'], ['เข้าถึงมากที่สุด', bR, x => f2(x.v, 1) + '× ของค่ากลาง']];
  const timeSec = `<section class="panel"><div class="panel-head"><div><span class="sa-lv">Best posting pattern</span><h2>ช่วงเวลาที่ควรโพสต์ แยกตามเป้าหมาย</h2><p>ค่าเฉลี่ยตามวัน × ช่วงเวลา (ต้องมีอย่างน้อย 2 โพสต์ต่อช่อง) · ช่วงที่ได้ Engagement กับช่วงที่คนคลิกอาจไม่ตรงกัน</p></div></div>
    <div class="sa-slots">${slotRows.map(([t, x, fv]) => `<div class="sa-slot${x ? '' : ' na'}"><small>${t}</small><b>${x ? slotTxt(x) : 'ข้อมูลยังไม่พอ'}</b>${x ? `<span>${fv(x)} · ${x.n} โพสต์</span>` : ''}</div>`).join('')}</div>
    <div style="margin-top:14px">${heatmap(cur)}</div></section>`;

  // ---------- Trend ----------
  const allP = postsOf(ps);
  const win = (days, off) => { const to = TODAY + DAY - off * days * DAY, from = to - days * DAY; return saAgg(allP.filter(p => p.at >= from && p.at < to)); };
  const tr = [['WoW', 'สัปดาห์นี้ vs สัปดาห์ก่อน', 7], ['MoM', '30 วันนี้ vs 30 วันก่อน', 30], ['YoY', '365 วันนี้ vs ปีก่อน', 365]].map(([k, t, d]) => { const a = win(d, 0), b = win(d, 1); return { k, t, a, b }; });
  const trendSec = `<section class="panel"><div class="panel-head"><div><span class="sa-lv">Trend</span><h2>WoW · MoM · YoY และค่าเฉลี่ยเคลื่อนที่</h2><p>(ช่วงนี้ − ช่วงก่อน) ÷ ช่วงก่อน × 100 · นับจากวันนี้ ไม่ขึ้นกับช่วงเวลาที่เลือก · เส้นค่าเฉลี่ย 7/30 วัน ช่วยไม่ให้เข้าใจผิดจากโพสต์ไวรัลโพสต์เดียว</p></div></div>
    <div class="tbl-wrap"><table class="tbl sa-tbl"><thead><tr><th>ช่วงเทียบ</th><th class="r">โพสต์</th><th class="r">Reach</th><th class="r">Engagement</th><th class="r">${sa.er === 'reach' ? 'ER Reach' : 'ER Impr.'}</th><th class="r">CTR</th></tr></thead><tbody>
    ${tr.map(x => `<tr><td><b>${x.k}</b> <small class="muted">${x.t}</small></td>${[['n', fnum], ['reach', fk], ['eng', fk], [ER, v => pp(v, 2)], ['ctr', v => pp(v, 2)]].map(([k, f]) => { const d = g(x.a[k], x.b[k]); return `<td class="num">${f(x.a[k])} <span class="sa-d ${d == null ? '' : d >= 0 ? 'up' : 'down'}">${d == null ? '' : sgn(d)}</span></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="chart" id="ch-sa-ma" style="margin-top:14px"></div><div class="legend"><span><i style="background:var(--line-2)"></i>Engagement รายวัน</span><span><i style="background:var(--accent)"></i>ค่าเฉลี่ย 7 วัน</span><span><i style="background:var(--gold)"></i>ค่าเฉลี่ย 30 วัน</span></div></section>`;

  // ---------- สูตรที่ยังใช้ไม่ได้ ----------
  const naSec = `<section class="panel sa-na"><div class="panel-head"><div><span class="sa-lv">ยังคำนวณไม่ได้</span><h2>สูตรที่ต้องมีข้อมูลเพิ่ม</h2><p>${SA_NEED}</p></div><button class="btn sm" data-act="sa-catalog">ดูรายการสูตรทั้งหมด</button></div>
    <div class="sa-na-grid">${[['Traffic หลังคลิก', 'Landing Page Rate, Bounce Rate', 'Google Analytics 4 / Meta Pixel'], ['Lead & Sales', 'Lead Conversion, CPL, Conversion Rate, CPA, CAC, AOV', 'ระบบลงทะเบียน / สมัคร / ยอดขาย'], ['Profitability', 'ROAS, ROI, MER, Contribution Margin', 'ค่าโฆษณาและรายได้'], ['Customer', 'Repeat, Retention, Churn, CLV, LTV:CAC, RFM, Cohort', 'รหัสผู้ใช้ / ลูกค้า (CRM)'], ['Attribution', 'First / Last touch, Linear, Position based', 'UTM + รหัสผู้ใช้ข้ามช่องทาง'], ['Share of Voice', 'Mention ของเรา ÷ Mention ทั้งตลาด', 'เครื่องมือ Social Listening']].map(([t, l, need]) => `<div class="sa-na-card"><b>${t}</b><span>${l}</span><small>${ic('plug', 12)} ต้องเชื่อม: ${need}</small></div>`).join('')}</div></section>`;

  return `<div class="stack" data-stagger>${execSec}${kpiSec}${plSec}${funnelSec}${contentSec}${postSec}${timeSec}${trendSec}${naSec}</div>`;
};
AFTER.strategy = function (animate) {
  const el = $('#ch-sa-ma'); if (!el) return;
  const r = range(), ps = shownP(); let from = r.from; const to = Math.min(r.to, TODAY + DAY);
  if ((to - from) / DAY < 60) from = to - 90 * DAY;
  const days = []; for (let t = sod(from); t < to; t += DAY) days.push(t);
  const byDay = {}; postsOf(ps).forEach(p => { const d = sod(p.at); if (d >= from && d < to) byDay[d] = (byDay[d] || 0) + engP(p); });
  const raw = days.map(d => byDay[d] || 0);
  const ma = n => raw.map((_, i) => i + 1 < Math.min(n, 3) ? null : saMean(raw.slice(Math.max(0, i - n + 1), i + 1)));
  const m7 = ma(7).map(v => v == null ? 0 : v), m30 = ma(30).map(v => v == null ? 0 : v);
  mountChart('ch-sa-ma', { labels: days.map(d => fds(d)), tips: days.map(d => fdate(d)), series: [{ name: 'Engagement รายวัน', color: 'var(--line-2)', values: raw }, { name: 'เฉลี่ย 7 วัน', color: 'var(--accent)', values: m7 }, { name: 'เฉลี่ย 30 วัน', color: 'var(--gold)', values: m30 }], aria: 'กราฟค่าเฉลี่ยเคลื่อนที่ของ Engagement', h: 240 }, animate);
};

boot();
})();
