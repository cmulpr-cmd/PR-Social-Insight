/* ตัวเชื่อมต่อข้อมูล: ระบบหลังบ้าน (Google Apps Script) หรือโหมดสาธิต */
(function () {
  "use strict";
  const CFG = window.APP_CONFIG || {};
  const DOMAIN = CFG.DOMAIN || 'cmu.ac.th';
  const TOKEN_KEY = 'psi_token';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} }
  };
  class ApiError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
  const clone = o => JSON.parse(JSON.stringify(o));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const DAYMS = 864e5;

  /* ---------- Google Apps Script ---------- */
  const Remote = {
    demo: false,
    hasToken: () => !!store.get(TOKEN_KEY),
    async call(action, payload) {
      let res;
      // จำกัดเวลารอ 5 นาที (ระบบหลังบ้านทำงานได้ไม่เกิน 6 นาทีต่อคำขอ) เพื่อไม่ให้หน้าเว็บค้างไม่รู้จบ
      const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const tm = ctl ? setTimeout(() => ctl.abort(), 300000) : null;
      try {
        res = await fetch(CFG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // ไม่ต้อง preflight (CORS)
          body: JSON.stringify({ action, token: store.get(TOKEN_KEY), payload: payload || {} }),
          redirect: 'follow', signal: ctl ? ctl.signal : undefined
        });
      } catch (e) {
        if (tm) clearTimeout(tm);
        if (e && e.name === 'AbortError') throw new ApiError('timeout', 'ฐานข้อมูลตอบกลับช้าเกินไป ลองอีกครั้ง (ข้อมูลที่บันทึกไปแล้วไม่หาย)');
        throw new ApiError('network', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง');
      }
      if (tm) clearTimeout(tm);
      let j;
      try { j = await res.json(); }
      catch (e) { throw new ApiError('bad_response', 'ฐานข้อมูลตอบกลับไม่ถูกต้อง แจ้งผู้ดูแลระบบให้ตรวจการ Deploy ระบบหลังบ้าน (Web App, Anyone)'); }
      if (!j.ok) {
        if (j.code === 'unauthorized') store.del(TOKEN_KEY);
        throw new ApiError(j.code, j.error);
      }
      return j.data;
    },
    requestOtp(email) { return this.call('auth.request', { email }); },
    async verifyOtp(email, code) {
      const d = await this.call('auth.verify', { email, code });
      if (d.status === 'active' && d.token) store.set(TOKEN_KEY, d.token);
      return d;
    },
    async logout() { try { await this.call('auth.logout'); } catch (_) {} store.del(TOKEN_KEY); },
    bootstrap() { return this.call('data.bootstrap'); },
    savePost(payload) { return this.call('post.save', payload); },
    deletePost(id) { return this.call('post.delete', { id }); },
    recat(id, cat) { return this.call('comment.recat', { id, cat }); },
    reply(id, text) { return this.call('comment.reply', { id, text }); },
    importPosts(posts) { return this.call('post.import', { posts }); },
    fetchPost(p) { return this.call('post.fetch', p); },
    recentPosts(platform) { return this.call('post.recent', { platform }); },
    syncPosts(ids) { return this.call('post.sync', { ids }); },
    syncFollowers() { return this.call('followers.sync'); },
    connStatus() { return this.call('connect.status'); },
    connectMeta(p) { return this.call('connect.meta', p); },
    connectTikTok(p) { return this.call('connect.tiktok', p); },
    disconnect(platform) { return this.call('connect.disconnect', { platform }); },
    setAutoSync(on) { return this.call('connect.autosync', { on }); },
    saveAudience(p) { return this.call('audience.save', p); },
    importPage(platform, rows) { return this.call('page.import', { platform, rows }); },
    importCheck(hashes) { return this.call('import.check', { hashes }); },
    importLog(files) { return this.call('import.log', { files }); },
    dupScan() { return this.call('data.dupscan'); },
    dedupe() { return this.call('data.dedupe'); },
    addUser(email, role) { return this.call('users.add', { email, role }); },
    saveUser(u) { return this.call('users.save', u); },
    deleteUser(email) { return this.call('users.delete', { email }); },
    approve(email, role) { return this.call('users.approve', { email, role }); },
    reject(email) { return this.call('users.reject', { email }); }
  };

  /* ---------- โหมดสาธิต (ข้อมูลอยู่ในเบราว์เซอร์ หายเมื่อรีเฟรช) ---------- */
  const ROLES = {
    'Super Admin': ['dashboard', 'posts', 'comments', 'audience', 'add', 'admin'],
    'Editor': ['dashboard', 'posts', 'comments', 'audience', 'add'],
    'Analyst': ['dashboard', 'posts', 'comments', 'audience'],
    'Viewer': ['dashboard']
  };
  let D = null;
  const otp = {};
  const db = () => (D || (D = window.makeDemoDB()));
  const me = () => { const t = store.get(TOKEN_KEY) || ''; const e = t.startsWith('demo:') ? t.slice(5) : ''; return db().users.find(u => u.email === e && u.status === 'active'); };
  const need = (menu) => { const u = me(); if (!u) throw new ApiError('unauthorized', 'กรุณาเข้าสู่ระบบ'); if (menu && !u.menus.includes(menu)) throw new ApiError('forbidden', 'คุณไม่มีสิทธิ์ใช้งานส่วนนี้'); return u; };
  const log = (who, what) => db().logs.unshift({ at: Date.now(), who, what });
  const checkEmail = (email) => {
    email = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('invalid_email', 'รูปแบบอีเมลไม่ถูกต้อง');
    if (!email.endsWith('@' + DOMAIN)) throw new ApiError('domain', 'ระบบนี้อนุญาตเฉพาะอีเมล @' + DOMAIN);
    return email;
  };
  const Demo = {
    demo: true,
    hasToken: () => !!store.get(TOKEN_KEY) && String(store.get(TOKEN_KEY)).startsWith('demo:'),
    async requestOtp(email) {
      await wait(650);
      email = checkEmail(email);
      const u = db().users.find(x => x.email === email);
      if (u && u.status === 'suspended') throw new ApiError('suspended', 'บัญชีนี้ถูกระงับการใช้งาน ติดต่อแอดมินฝ่ายประชาสัมพันธ์');
      const code = String(Math.floor(100000 + Math.random() * 900000));
      otp[email] = { code, n: 0, exp: Date.now() + 10 * 60e3 };
      const [a, d] = email.split('@');
      return { sentTo: a.slice(0, 2) + '•••' + (a.length > 4 ? a.slice(-1) : '') + '@' + d, resendIn: 30, expiresIn: 600, demoCode: code };
    },
    async verifyOtp(email, code) {
      await wait(500);
      email = checkEmail(email);
      const o = otp[email];
      if (!o || o.exp < Date.now()) throw new ApiError('otp_expired', 'รหัสหมดอายุแล้ว กด “ส่งรหัสใหม่” เพื่อรับรหัสอีกครั้ง');
      if (o.n >= 5) { delete otp[email]; throw new ApiError('otp_locked', 'กรอกรหัสผิดเกินกำหนด กด “ส่งรหัสใหม่”'); }
      if (String(code) !== o.code) { o.n++; throw new ApiError('otp_wrong', 'รหัสไม่ถูกต้อง เหลือโอกาสอีก ' + (5 - o.n) + ' ครั้ง'); }
      delete otp[email];
      let u = db().users.find(x => x.email === email);
      if (!u) {
        u = { email, name: email.split('@')[0], role: 'Viewer', menus: ['dashboard'], platforms: ['fb', 'ig', 'tt'], status: 'pending', last: null, requested: Date.now() };
        db().users.push(u); log(email, 'ขอสิทธิ์เข้าใช้งาน (รอการอนุมัติ)');
      }
      if (u.status !== 'active') return { status: u.status, email };
      u.last = Date.now(); store.set(TOKEN_KEY, 'demo:' + email); log(email, 'เข้าสู่ระบบ');
      return { status: 'active', token: 'demo', user: clone(u) };
    },
    async logout() { store.del(TOKEN_KEY); },
    async bootstrap() {
      await wait(700);
      const u = need();
      const posts = db().posts.filter(p => u.platforms.includes(p.platform));
      const aud = {}; u.platforms.forEach(p => { if (db().audience[p]) aud[p] = db().audience[p]; });
      const out = { user: u, posts, audience: aud, followers: db().followers.filter(f => u.platforms.includes(f.platform)), daily: (db().daily || []).filter(d => u.platforms.includes(d.platform)), connections: this._conn() };
      if (u.menus.includes('admin')) { out.users = db().users; out.logs = db().logs; out.sheetUrl = ''; }
      return clone(out);
    },
    async savePost({ post, newComments, image }) {
      await wait(600);
      const u = need('add');
      let p = post.id ? db().posts.find(x => x.id === post.id) : null;
      const cm = (newComments || []).map((c, i) => ({ id: 'c' + Date.now() + i, author: c.author, text: c.text, cat: c.cat, auto: !!c.auto, at: post.at + (i + 1) * 6e4, thread: c.replied ? [{ from: 'page', text: '(บันทึกว่าเพจตอบกลับแล้ว)', at: post.at + (i + 2) * 6e4 }] : [] }));
      if (p) Object.assign(p, { platform: post.platform, at: post.at, type: post.type, cat: post.cat, caption: post.caption, link: post.link, m: post.m, v: post.v });
      else { p = { ...post, id: 'p' + Date.now(), comments: [], createdBy: u.email }; db().posts.push(p); }
      if (image && image.dataUrl) p.img = image.dataUrl;
      p.comments.push(...cm);
      if (p.m.comments == null) p.m.comments = p.comments.reduce((s, c) => s + 1 + c.thread.length, 0);
      log(u.email, (post.id ? 'แก้ไข' : 'เพิ่ม') + 'โพสต์ ' + post.type);
      return clone(p);
    },
    async deletePost(id) { await wait(400); const u = need('add'); const i = db().posts.findIndex(p => p.id === id); if (i < 0) throw new ApiError('not_found', 'ไม่พบโพสต์นี้'); db().posts.splice(i, 1); log(u.email, 'ลบโพสต์'); return { id }; },
    async recat(id, cat) { await wait(250); const u = need('comments'); for (const p of db().posts) { const c = p.comments.find(x => x.id === id); if (c) { c.cat = cat; c.auto = false; log(u.email, 'แก้หมวดความคิดเห็น'); return clone(c); } } throw new ApiError('not_found', 'ไม่พบความคิดเห็นนี้'); },
    async reply(id, text) { await wait(300); const u = need('comments'); for (const p of db().posts) { const c = p.comments.find(x => x.id === id); if (c) { c.thread.push({ from: 'page', text: text || 'ตอบกลับแล้ว', at: Date.now(), by: u.email }); return clone(c); } } throw new ApiError('not_found', 'ไม่พบความคิดเห็นนี้'); },
    // ---- ดึงข้อมูลจากแพลตฟอร์ม (จำลองในโหมดสาธิต) ----
    _conn() { const d = db(); if (!d.conn) d.conn = { fb: { connected: true, name: 'เพจตัวอย่าง', lastSync: Date.now() - 36e5, error: '' }, ig: { connected: true, name: '@example.page', lastSync: Date.now() - 36e5, error: '' }, tt: { connected: false, name: '', hasApp: false, lastSync: null, error: '' }, autoSync: true, lastAuto: Date.now() - 20 * 6e4, redirectUri: 'https://script.google.com/macros/s/…/exec' }; return d.conn; },
    _fake(platform, key) {
      let h = 0; for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const r = n => { h = (h * 1103515245 + 12345) >>> 0; return h % n; };
      const reach = 8000 + r(60000), reacts = Math.round(reach * (.02 + r(50) / 1000));
      const rb = platform === 'fb' ? { like: Math.round(reacts * .72), love: Math.round(reacts * .16), care: Math.round(reacts * .03), haha: Math.round(reacts * .04), wow: Math.round(reacts * .03), sad: Math.round(reacts * .01), angry: Math.round(reacts * .01) } : null;
      const names = ['ศิริพร ท.', 'Kittipat J.', 'ปวีณา ม.', 'Mint Chanida', 'ธนกร ว.', 'Ploy Wannisa'], texts = ['สวยมากค่ะ', 'จัดที่ไหนครับ', 'อยากไปมากก', 'ราคาเท่าไหร่คะ', 'ภูมิใจมากค่ะ', 'เว็บสมัครล่มค่ะ'];
      const n = platform === 'tt' ? 0 : 3 + r(5);
      const comments = platform === 'tt' ? null : Array.from({ length: n }, (_, i) => ({ externalId: key + '_c' + i, author: (platform === 'ig' ? '@' : '') + names[(i + r(6)) % 6], text: texts[(i + r(6)) % 6], at: Date.now() - (n - i) * 36e5, thread: i % 2 ? [{ from: 'page', text: 'ขอบคุณค่ะ', at: Date.now() - (n - i) * 36e5 + 6e5 }] : [] }));
      const type = platform === 'tt' ? 'Short Video' : r(3) === 0 ? 'Reel' : 'Photo';
      return { platform, externalId: String(key), at: Date.now() - (1 + r(20)) * DAYMS, caption: ['Open House 2026 เปิดบ้านให้น้อง ม.ปลาย', 'ภาพหมอกยามเช้าที่ดอยสุเทพ', 'POV: เย็นวันศุกร์ที่อ่างแก้ว', 'ประกาศวันหยุดชดเชย'][r(4)], img: null, type,
        m: { reactions: reacts, comments: comments ? comments.length : 40 + r(120), shares: Math.round(reach * .006), saves: platform === 'ig' ? Math.round(reach * .01) : null, reach: platform === 'tt' ? null : reach, impressions: Math.round(reach * 1.5), clicks: platform === 'fb' ? Math.round(reach * .03) : null, profileVisits: platform === 'ig' ? Math.round(reach * .006) : null, newFollowers: platform === 'ig' ? Math.round(reach * .001) : null, linkClicks: null },
        v: type === 'Photo' ? null : { videoViews: Math.round(reach * 1.3), s3: Math.round(reach * 1.3), avgWatch: 6 + r(10), totalWatch: Math.round(reach * 12), duration: 15 + r(45) }, reactionsBreakdown: rb, comments };
    },
    async fetchPost(p) {
      await wait(p.save ? 700 : 1100); const u = need('add');
      const platform = p.platform || (/facebook|fb\./i.test(p.link) ? 'fb' : /instagram/i.test(p.link) ? 'ig' : /tiktok/i.test(p.link) ? 'tt' : null);
      if (!platform) throw new ApiError('invalid', 'ลิงก์นี้ไม่ใช่ Facebook, Instagram หรือ TikTok');
      if (!this._conn()[platform].connected) throw new ApiError('not_connected', { fb: 'Facebook', ig: 'Instagram', tt: 'TikTok' }[platform] + ' ยังไม่ได้เชื่อมต่อ — กรอกข้อมูลเองได้ หรือให้แอดมินเชื่อมต่อที่เมนู “เชื่อมต่อบัญชี”');
      const key = p.externalId || String(p.link).replace(/[?#].*$/, '');
      const d = this._fake(platform, key); d.link = p.link || ('https://example.com/' + key);
      const ex = db().posts.find(x => x.externalId === d.externalId || String(x.link).replace(/[?#].*$/, '') === String(d.link).replace(/[?#].*$/, ''));
      const af = Object.keys(d.m).filter(k => d.m[k] != null).concat(d.comments ? ['commentList'] : []);
      if (!p.save) return clone({ preview: Object.assign({}, d, { apiFields: af, commentCount: d.comments ? d.comments.length : null, repliedCount: d.comments ? d.comments.filter(c => c.thread.length).length : 0, comments: undefined }), existingId: ex ? ex.id : null });
      const post = ex || { id: 'p' + Date.now(), cat: p.cat || 'news', comments: [], createdBy: u.email };
      Object.assign(post, { platform, externalId: d.externalId, link: d.link, at: ex ? post.at : d.at, caption: d.caption, type: d.type, img: post.img || d.img, m: Object.assign({}, post.m || {}, Object.fromEntries(Object.entries(d.m).filter(([, v]) => v != null))), v: d.v || post.v || null, reactionsBreakdown: d.reactionsBreakdown, source: 'api', syncedAt: Date.now(), syncError: '', apiFields: af });
      (d.comments || []).forEach(c => { if (!post.comments.some(x => x.externalId === c.externalId)) post.comments.push({ id: 'c' + Math.random().toString(36).slice(2, 9), externalId: c.externalId, author: c.author, text: c.text, cat: /ไหน|เท่าไหร่/.test(c.text) ? (/ราคา/.test(c.text) ? 'buy' : 'q') : /ล่ม/.test(c.text) ? 'cmp' : /อยาก/.test(c.text) ? 'int' : 'pos', auto: true, at: c.at, thread: c.thread }); });
      if (!ex) db().posts.push(post);
      this._conn()[platform].lastSync = Date.now();
      return clone(post);
    },
    async recentPosts(platform) {
      await wait(800); need('add'); if (!this._conn()[platform].connected) throw new ApiError('not_connected', 'ยังไม่ได้เชื่อมต่อ');
      const mine = db().posts.filter(p => p.platform === platform).sort((a, b) => b.at - a.at).slice(0, 5);
      const extra = [1, 2, 3].map(i => { const d = this._fake(platform, platform + '_new_' + i); return { externalId: d.externalId, link: platform === 'fb' ? 'https://www.facebook.com/example.page/posts/' + (9000 + i) : 'https://www.instagram.com/p/NEW' + i + '/', at: Date.now() - i * 36e5 * 5, caption: d.caption, img: null, existingId: null }; });
      return clone(extra.concat(mine.map(p => ({ externalId: p.externalId || p.id, link: p.link, at: p.at, caption: p.caption, img: p.img, existingId: p.id }))));
    },
    async syncPosts(ids) {
      await wait(600 + ids.length * 120); const u = need('add'); const out = [], errors = [];
      ids.forEach(id => { const p = db().posts.find(x => x.id === id); if (!p) return errors.push({ id, error: 'ไม่พบโพสต์' }); if (!this._conn()[p.platform].connected) return errors.push({ id, error: 'ยังไม่ได้เชื่อมต่อ' });
        const k = x => { if (p.m[x] != null) p.m[x] = Math.round(p.m[x] * (1 + Math.random() * .06)); }; ['reach', 'impressions', 'reactions', 'shares', 'clicks'].forEach(k);
        if (p.platform === 'fb' && !p.reactionsBreakdown) { const t = p.m.reactions || 0; p.reactionsBreakdown = { like: Math.round(t * .72), love: Math.round(t * .16), care: Math.round(t * .03), haha: Math.round(t * .04), wow: Math.round(t * .03), sad: Math.round(t * .01), angry: Math.round(t * .01) }; }
        p.source = 'api'; p.syncedAt = Date.now(); p.syncError = ''; p.apiFields = ['reach', 'impressions', 'reactions', 'comments', 'shares', 'commentList']; out.push(clone(p)); });
      log(u.email, 'อัปเดตโพสต์จากแพลตฟอร์ม ' + out.length + ' รายการ'); return { posts: out, errors };
    },
    async syncFollowers() {
      await wait(700); need(); const c = this._conn(); const out = [];
      ['fb', 'ig', 'tt'].forEach(p => { if (!c[p].connected) return; const last = db().followers.filter(f => f.platform === p).sort((a, b) => a.date - b.date).pop(); const f = { date: Date.now(), platform: p, followers: (last ? last.followers : 1000) + Math.round(Math.random() * 40), source: 'api' }; db().followers.push(f); out.push(f); c[p].lastSync = Date.now(); });
      return clone({ followers: out, audience: {}, connections: c });
    },
    async connStatus() { await wait(300); return clone(this._conn()); },
    async connectMeta(p) { await wait(900); need('admin'); if (!p.token || p.token.length < 8) throw new ApiError('api', 'โทเคนไม่ถูกต้องหรือหมดอายุ ลองสร้างใหม่จาก Graph API Explorer'); const c = this._conn(); c.fb = { connected: true, name: 'เพจตัวอย่าง', lastSync: null, error: '' }; c.ig = { connected: true, name: '@example.page', lastSync: null, error: '' }; return clone(c); },
    async connectTikTok(p) { await wait(500); need('admin'); this._conn().tt.hasApp = true; this._ttPending = true; return { authUrl: 'https://www.tiktok.com/v2/auth/authorize/', redirectUri: this._conn().redirectUri }; },
    async disconnect(platform) { await wait(400); need('admin'); const c = this._conn(); c[platform] = { connected: false, name: '', lastSync: null, error: '' }; if (platform === 'fb') c.ig = { connected: false, name: '', lastSync: null, error: '' }; return clone(c); },
    async setAutoSync(on) { await wait(400); need('admin'); const c = this._conn(); c.autoSync = !!on; return clone(c); },
    async importPosts(list) {
      await wait(700); const u = need('add'); let added = 0, updated = 0, skipped = 0; const out = [];
      const key = l => String(l || '').split(/[?#]/)[0].replace(/^https?:\/\/(www\.|m\.)?/i, '').replace(/\/+$/, '').toLowerCase();
      list.forEach(post => {
        if (!u.platforms.includes(post.platform) || !/^https?:\/\//.test(post.link || '')) { skipped++; return; }
        let p = db().posts.find(x => key(x.link) === key(post.link));
        if (p) { Object.keys(post.m || {}).forEach(k => { if (post.m[k] != null) p.m[k] = post.m[k]; }); if (post.v) p.v = Object.assign(p.v || {}, post.v); if (post.caption) p.caption = post.caption; if (post.at) p.at = post.at; updated++; }
        else { p = { id: 'p' + Date.now() + out.length, platform: post.platform, at: post.at || Date.now(), type: post.type || 'Photo', cat: post.cat || 'news', caption: post.caption || post.type, link: post.link, img: null, m: post.m || {}, v: post.v || null, comments: [], createdBy: u.email }; db().posts.push(p); added++; }
        out.push(p);
      });
      log(u.email, 'นำเข้าโพสต์จากไฟล์ CSV'); return clone({ added, updated, skipped, posts: out });
    },
    async saveAudience(p) {
      await wait(500); const u = need('add');
      const prev = db().audience[p.platform] || {};
      const a = { ...prev, platform: p.platform, asOf: p.asOf };
      ['gender', 'age', 'country', 'province', 'city', 'lang', 'ageGender'].forEach(k => { if (p[k] && Object.keys(p[k]).length) a[k] = p[k]; });
      if (p.newAud != null) a.newAud = p.newAud; if (p.followersShare != null) a.followers = p.followersShare; a.source = p.source || 'manual';
      db().audience[p.platform] = a;
      let follower = null;
      if (p.followers > 0) { follower = { date: p.asOf, platform: p.platform, followers: p.followers, source: p.source === 'csv' ? 'csv' : 'manual' }; db().followers.push(follower); }
      log(u.email, 'บันทึกข้อมูลผู้ชม');
      return clone({ audience: a, follower });
    },
    async importPage(platform, rows) {
      await wait(600); const u = need('add'); if (!u.platforms.includes(platform)) throw new ApiError('forbidden', 'คุณไม่มีสิทธิ์บันทึกข้อมูลแพลตฟอร์มนี้');
      const d = db(); d.daily = d.daily || []; let added = 0, updated = 0;
      rows.forEach(r => { let x = d.daily.find(y => y.platform === platform && y.date === r.date); if (!x) { x = { date: r.date, platform, source: 'csv' }; d.daily.push(x); added++; } else updated++; Object.keys(r).forEach(k => { if (k !== 'date' && r[k] != null && r[k] !== 0) x[k] = r[k]; }); });
      d.daily.sort((a, b) => a.date < b.date ? -1 : 1); log(u.email, 'นำเข้าข้อมูลเพจรายวัน ' + rows.length + ' วัน');
      return clone({ added, updated, daily: d.daily.filter(x => x.platform === platform) });
    },
    async importCheck(hashes) { await wait(500); need('add'); const h = db().imports || []; const found = {}; h.forEach(x => { if (hashes.includes(x.hash) && (!found[x.hash] || found[x.hash].at < x.at)) found[x.hash] = x; }); return clone({ found: Object.values(found) }); },
    async importLog(files) { await wait(200); const u = need('add'); const d = db(); d.imports = (d.imports || []).concat(files.map(f => Object.assign({ at: Date.now(), email: u.email, fileName: f.name }, f))); return { ok: true }; },
    async dupScan() {
      await wait(1400); need('add'); const d = db(); const key = l => String(l || '').split(/[?#]/)[0].replace(/^https?:\/\/(www\.|m\.)?/i, '').replace(/\/+$/, '').toLowerCase();
      const grp = (list, f) => { const g = {}; list.forEach(x => { const k = f(x); if (k) (g[k] = g[k] || []).push(x); }); return Object.values(g).filter(x => x.length > 1); };
      const P = grp(d.posts, p => p.platform + '|' + key(p.link)), D = grp(d.daily || [], x => x.platform + '|' + x.date), C = grp(d.posts.flatMap(p => p.comments.map(c => Object.assign({ pid: p.id }, c))), c => c.pid + '|' + c.author + '|' + c.text);
      const sum = (g, lab) => ({ groups: g.length, extra: g.reduce((s, x) => s + x.length - 1, 0), sample: g.slice(0, 5).map(x => ({ n: x.length, label: lab(x[0]), platform: x[0].platform })) });
      return clone({ scannedAt: Date.now(), posts: sum(P, p => String(p.caption).slice(0, 90)), daily: sum(D, x => x.date), comments: sum(C, c => c.author + ': ' + c.text), followers: sum([], x => ''), users: sum([], x => '') });
    },
    async dedupe() {
      await wait(1600); const u = need('admin'); const d = db(); const key = l => String(l || '').split(/[?#]/)[0].replace(/^https?:\/\/(www\.|m\.)?/i, '').replace(/\/+$/, '').toLowerCase();
      const seen = {}; let posts = 0, comments = 0, daily = 0;
      d.posts = d.posts.filter(p => { const k = p.platform + '|' + key(p.link); if (seen[k]) { seen[k].comments.push(...p.comments); posts++; return false; } seen[k] = p; return true; });
      d.posts.forEach(p => { const s2 = {}; p.comments = p.comments.filter(c => { const k = c.author + '|' + c.text; if (s2[k]) { comments++; return false; } s2[k] = 1; return true; }); });
      const sd = {}; d.daily = (d.daily || []).filter(x => { const k = x.platform + '|' + x.date; if (sd[k]) { Object.assign(sd[k], x); daily++; return false; } sd[k] = x; return true; });
      log(u.email, 'รวมรายการซ้ำในฐานข้อมูล'); return { posts, daily, comments, followers: 0 };
    },
    async addUser(email, role) {
      await wait(450); const a = need('admin'); email = checkEmail(email);
      if (db().users.some(u => u.email === email)) throw new ApiError('exists', 'อีเมลนี้มีอยู่ในระบบแล้ว');
      const u = { email, name: email.split('@')[0], role, menus: ROLES[role].slice(), platforms: ['fb', 'ig', 'tt'], status: 'active', last: null };
      db().users.push(u); log(a.email, 'เพิ่มผู้ใช้ ' + email); return clone(u);
    },
    async saveUser(p) {
      await wait(300); const a = need('admin');
      const u = db().users.find(x => x.email === p.email); if (!u) throw new ApiError('not_found', 'ไม่พบผู้ใช้นี้');
      if (!p.menus.length || !p.platforms.length) throw new ApiError('invalid', 'ต้องเลือกอย่างน้อย 1 เมนู และ 1 แพลตฟอร์ม');
      if (p.email === a.email && (!p.menus.includes('admin') || p.status !== 'active')) throw new ApiError('invalid', 'ไม่สามารถถอดสิทธิ์ผู้ดูแลหรือระงับบัญชีของตัวเองได้');
      Object.assign(u, { role: p.role, menus: p.menus.slice(), platforms: p.platforms.slice(), status: p.status });
      log(a.email, 'ปรับสิทธิ์ ' + u.email); return clone(u);
    },
    async deleteUser(email) { await wait(350); const a = need('admin'); if (email === a.email) throw new ApiError('invalid', 'ไม่สามารถลบบัญชีของตัวเองได้'); const i = db().users.findIndex(u => u.email === email); db().users.splice(i, 1); log(a.email, 'ลบผู้ใช้ ' + email); return { email }; },
    async approve(email, role) { await wait(400); const a = need('admin'); const u = db().users.find(x => x.email === email); Object.assign(u, { status: 'active', role, menus: ROLES[role].slice(), platforms: ['fb', 'ig', 'tt'] }); log(a.email, 'อนุมัติ ' + email + ' เป็น ' + role); return clone(u); },
    async reject(email) { await wait(350); const a = need('admin'); const i = db().users.findIndex(u => u.email === email); db().users.splice(i, 1); log(a.email, 'ปฏิเสธคำขอของ ' + email); return { email }; }
  };

  // ใช้งานจริงเมื่อมี API_URL · โหมดสาธิตเปิดได้เฉพาะเมื่อตั้ง DEMO: true และมีไฟล์ demo.js
  window.API = CFG.API_URL ? Remote : (CFG.DEMO && window.makeDemoDB ? Demo : null);
  window.ApiError = ApiError;
})();
