/* ============================================================
   宝宝的一万天 · 交互逻辑
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const DAY = 86400000;
  const birth = new Date(BIRTH_DATE);

  function dayOf(dateStr) { return Math.round((new Date(dateStr) - birth) / DAY); }
  function pctOf(day) { return day / TOTAL_DAYS * 100; }
  function fmtDate(str) { return str.replace(/-/g, '.'); }
  function rand(arr) { return arr[Math.random() * arr.length | 0]; }
  const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  function weekdayOf(dateStr) { return WEEK[new Date(dateStr + 'T00:00:00').getDay()]; }
  function todayISO() { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; }

  // 预处理
  NODES.forEach(n => {
    if (n.date) {
      n.day = dayOf(n.date);
      n.pct = pctOf(n.day);
    }
    n.storyText = (n.story || '').replace(/\{\{day\}\}/g, (n.day != null ? n.day.toLocaleString() : ''));
  });

  const N = NODES.length;
  const finaleIndex = NODES.findIndex(n => n.special === 'finale');
  const firstFutureIndex = NODES.findIndex(n => n.type === 'future');
  const togetherIndex = NODES.findIndex(n => n.id === 'together');

  let focus = 0, maxReached = 0;
  let playing = false, playTimer = null;
  const PLAY_SPEEDS = [0.5, 1, 1.5, 2];  // 倍速档位
  let speedIdx = 1;                       // 默认 1x
  function playInterval() { return Math.round(2600 / PLAY_SPEEDS[speedIdx]); }
  let GAP = 480, PAD = 0;
  let xs = [], ys = [];
  let dragging = false, dragBase = 0, dragCur = 0, moved = false;

  const world = $('#world'), stationsEl = $('#stations'), svg = $('#pathSvg');
  const pathBase = $('#pathBase'), pathFill = $('#pathFill'), stage = $('#stage');

  // ---------- 布局 ----------
  function gapFactor(i) { return NODES[i].type === 'branch' ? 0.6 : 1.0; }
  function baselineY() { return stage.clientHeight * 0.52; }
  function nodeY(i) { return baselineY() + Math.sin(i * 0.7) * Math.min(70, stage.clientHeight * 0.11); }

  function computeLayout() {
    const vw = stage.clientWidth;
    GAP = Math.min(560, Math.max(300, vw * 0.7));
    PAD = vw / 2;

    xs = [PAD]; ys = [nodeY(0)];
    for (let i = 1; i < N; i++) {
      let g = GAP * (gapFactor(i - 1) + gapFactor(i)) / 2;
      if (i === firstFutureIndex) g = GAP * 1.5; // 未来区前留白
      xs[i] = xs[i - 1] + g;
      ys[i] = nodeY(i);
    }
    const worldW = xs[N - 1] + PAD;
    world.style.width = worldW + 'px';

    svg.setAttribute('width', worldW);
    svg.setAttribute('height', stage.clientHeight);
    svg.setAttribute('viewBox', `0 0 ${worldW} ${stage.clientHeight}`);
    buildPath();

    $$('.station').forEach((el, i) => { el.style.left = xs[i] + 'px'; el.style.top = ys[i] + 'px'; });

    const fd = $('.future-divider');
    if (fd && firstFutureIndex > 0) fd.style.left = ((xs[firstFutureIndex - 1] + xs[firstFutureIndex]) / 2) + 'px';

    const ld = $('.love-divider');
    if (ld && togetherIndex > 0) ld.style.left = ((xs[togetherIndex - 1] + xs[togetherIndex]) / 2) + 'px';

    positionBanner();
    updateCamera(false);
    updatePathFill();
  }

  function buildPath() {
    let d = `M ${xs[0]} ${ys[0]}`;
    for (let i = 1; i < N; i++) {
      const cx = (xs[i - 1] + xs[i]) / 2;
      d += ` C ${cx} ${ys[i - 1]}, ${cx} ${ys[i]}, ${xs[i]} ${ys[i]}`;
    }
    pathBase.setAttribute('d', d);
    pathFill.setAttribute('d', d);
    ensureGrad();
    const len = pathFill.getTotalLength();
    pathFill.style.strokeDasharray = len;
    pathFill.dataset.len = len;
    updatePathFill();
  }

  function ensureGrad() {
    if ($('#grad')) return;
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    const g = document.createElementNS(ns, 'linearGradient');
    g.id = 'grad';
    [['0%', '#ffd6a5'], ['50%', '#ff8fb1'], ['100%', '#ff6f97']].forEach(([o, c]) => {
      const s = document.createElementNS(ns, 'stop');
      s.setAttribute('offset', o); s.setAttribute('stop-color', c);
      g.appendChild(s);
    });
    defs.appendChild(g);
    svg.insertBefore(defs, svg.firstChild);
  }

  function updatePathFill() {
    const len = parseFloat(pathFill.dataset.len || 0);
    // 进度只填到“第一万天”为止，未来部分是虚线梦想
    const cap = finaleIndex > 0 ? finaleIndex : N - 1;
    const frac = Math.min(maxReached, cap) / (cap || 1);
    pathFill.style.strokeDashoffset = len * (1 - frac);
  }

  // ---------- 相机 ----------
  function updateCamera(animate = true) {
    world.classList.toggle('dragging', !animate);
    const x = (PAD - xs[focus]) + (dragging ? dragCur - dragBase : 0);
    world.style.transform = `translateX(${x}px)`;
  }

  // ---------- 渲染站点 ----------
  function buildStations() {
    stationsEl.innerHTML = '';
    NODES.forEach((n, i) => {
      const el = document.createElement('div');
      el.className = 'station ' + n.type + (i % 2 ? ' up' : '') + (n.special === 'prologue' ? ' prologue' : '')
        + (togetherIndex >= 0 && i >= togetherIndex && n.type !== 'future' ? ' love-era' : '');
      el.style.setProperty('--nc', n.color);
      el.dataset.i = i;

      let dayLine, pctLine;
      if (n.type === 'future') {
        dayLine = '梦想中'; pctLine = '未来可期 ✨';
      } else if (n.pct < 0) {
        dayLine = `第 ${n.day} 天 · ${fmtDate(n.date)}`; pctLine = `出生前 ${Math.abs(n.day)} 天`;
      } else {
        dayLine = `第 ${n.day.toLocaleString()} 天 · ${fmtDate(n.date)}`;
        pctLine = `${n.pct.toFixed(2)}%`;
      }

      const branchTag = n.type === 'branch' ? '<div class="lb-branch-tag">支线</div>' : '';
      const wkBadge = n.date ? `<span class="wk-badge">${weekdayOf(n.date)}</span>` : '';
      el.innerHTML = `
        <div class="pin">${n.icon}${wkBadge}</div>
        <div class="label">
          <div class="lb-title">${n.title}</div>
          <div class="lb-day">${dayLine}</div>
          <div class="lb-pct">${pctLine}</div>
          ${branchTag}
          <div class="lb-more">👆 点我看故事</div>
        </div>`;

      if (n.special === 'finale') el.appendChild(buildFinale());

      const open = e => { e.stopPropagation(); if (!moved) openDetail(n.id); };
      el.querySelector('.pin').addEventListener('click', open);
      el.querySelector('.label').addEventListener('click', open);
      stationsEl.appendChild(el);
    });

    // 未来分隔线
    if (firstFutureIndex > 0) {
      const fd = document.createElement('div');
      fd.className = 'future-divider';
      fd.innerHTML = '<div class="fd-label">🔮 憧憬未来</div>';
      stationsEl.appendChild(fd);
    }

    // “在一起之后”分隔线
    if (togetherIndex > 0) {
      const ld = document.createElement('div');
      ld.className = 'love-divider';
      ld.innerHTML = '<div class="ld-label">💕 在一起之后</div>';
      stationsEl.appendChild(ld);
    }
  }

  function buildFinale() {
    const wrap = document.createElement('div');
    wrap.className = 'finale-scene';
    wrap.innerHTML = `
      <div class="hotpot">
        <div class="divider"></div>
        <div class="steam s1"></div><div class="steam s2"></div><div class="steam s3"></div>
      </div>
      <div class="hotpot-logo">🍲 海底捞 · Hi</div>
      <button class="finale-btn" id="finaleBtn">🎉 出发去吃海底捞！</button>`;
    return wrap;
  }

  function positionBanner() {
    if ($('.banner-wrap')) return;
    const finaleStation = $(`.station[data-i="${finaleIndex}"]`);
    if (!finaleStation) return;
    const banner = document.createElement('div');
    banner.className = 'banner-wrap';
    banner.innerHTML = `
      <div class="banner-pole left"></div>
      <div class="banner-pole right"></div>
      <div class="banner">
        热烈祝贺宝宝来到世界第10000天
        <div class="b-sub">1999.03.03 → 2026.07.19 · 一万天快乐 ❤️</div>
      </div>`;
    finaleStation.appendChild(banner);
  }

  // ---------- 聚焦 ----------
  function reveal(i) {
    for (let k = 0; k <= i; k++) { const el = $(`.station[data-i="${k}"]`); if (el) el.classList.add('revealed'); }
  }

  function focusNode(i, { animate = true } = {}) {
    i = Math.max(0, Math.min(N - 1, i));
    focus = i;
    if (i > maxReached) maxReached = i;
    reveal(maxReached);

    $$('.station').forEach(el => el.classList.toggle('active', +el.dataset.i === i));
    $$('.nl-item').forEach(el => el.classList.toggle('active', +el.dataset.i === i));

    updateCamera(animate);
    updatePathFill();
    updateReadout(NODES[i]);

    // 一旦离开起点，就把底部提示条藏起来——避免和星座角标 / 海底捞按钮重叠
    if (i !== 0) { const tip = $('#scrollTip'); if (tip) tip.classList.add('hidden'); }

    if (NODES[i].special === 'finale') triggerFinale();

    const active = $('.nl-item.active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }

  // ---------- 进度读数 ----------
  let readoutRAF = null;
  function updateReadout(n) {
    const track = $('.progress-track');
    const fill = $('#progressFill'), heart = $('#progressHeart');

    if (n.type === 'future') {
      if (readoutRAF) cancelAnimationFrame(readoutRAF);
      $('#dayCount').textContent = '∞';
      $('#pctCount').textContent = '未来';
      $('#nodeDate').textContent = '梦想中 · 未完待续';
      fill.style.setProperty('--p', 1); heart.style.setProperty('--p', 1);
      track.classList.add('future-mode');
      return;
    }
    track.classList.remove('future-mode');
    const p = Math.max(0, n.pct) / 100;
    fill.style.setProperty('--p', p); heart.style.setProperty('--p', p);
    $('#pctCount').textContent = (n.pct < 0 ? '出生前' : n.pct.toFixed(2) + '%');
    $('#nodeDate').textContent = fmtDate(n.date);

    const target = n.day;
    let cur = parseInt(($('#dayCount').textContent || '0').replace(/[^\d-]/g, '')) || 0;
    if (readoutRAF) cancelAnimationFrame(readoutRAF);
    const t0 = performance.now(), dur = 700;
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur);
      const val = Math.round(cur + (target - cur) * (1 - Math.pow(1 - k, 3)));
      $('#dayCount').textContent = val.toLocaleString();
      if (k < 1) readoutRAF = requestAnimationFrame(step);
    })(t0);
  }

  // ---------- 节点列表 ----------
  function buildNodeList() {
    const list = $('#nodeList');
    list.innerHTML = '';
    NODES.forEach((n, i) => {
      if (i === togetherIndex) {
        const div = document.createElement('div');
        div.className = 'nl-divider nl-divider-love';
        div.innerHTML = '💕 在一起之后';
        list.appendChild(div);
      }
      if (i === firstFutureIndex) {
        const div = document.createElement('div');
        div.className = 'nl-divider nl-divider-future';
        div.innerHTML = '🔮 憧憬未来';
        list.appendChild(div);
      }
      const item = document.createElement('div');
      item.className = 'nl-item nl-' + n.type; item.dataset.i = i;
      let pct = n.type === 'future' ? '未来' : (n.pct < 0 ? '序章' : n.pct.toFixed(1) + '%');
      item.innerHTML = `<span class="nl-ico">${n.icon}</span>
        <span class="nl-name">${n.title}</span>
        <span class="nl-pct">${pct}</span>`;
      item.addEventListener('click', () => { stopPlay(); focusNode(i); });
      list.appendChild(item);
    });
  }

  // ---------- 详情页 ----------
  let detailIndex = -1;              // 当前详情对应的节点下标（-1 = 未打开）
  let iconClicks = 0, iconTimer = null;

  function openDetail(id) {
    const i = NODES.findIndex(x => x.id === id);
    if (i >= 0) showDetail(i);
  }

  function showDetail(i) {
    i = Math.max(0, Math.min(N - 1, i));
    const n = NODES[i];
    detailIndex = i;
    const detail = $('#detail'), card = $('#detailCard');

    card.className = 'detail-card ' + n.type;
    $('#detailIcon').textContent = n.icon;
    $('#detailTitle').textContent = n.title;
    $('#detailStory').textContent = n.storyText;

    const dayWrap = $('#detailDayWrap'), meta = $('.detail-meta');
    if (n.type === 'future') {
      dayWrap.innerHTML = '🔮 未来 · 梦想中';
      meta.style.display = 'none';
    } else {
      meta.style.display = '';
      dayWrap.innerHTML = '宝宝出生第 <span id="detailDay"></span> 天';
      $('#detailDay').textContent = n.day.toLocaleString();
      $('#detailDate').textContent = fmtDate(n.date);
      $('#detailPct').textContent = n.pct < 0 ? ('出生前 ' + Math.abs(n.day) + ' 天') : (n.pct.toFixed(2) + '%');
    }

    renderPhoto(n);

    // 重置彩蛋
    iconClicks = 0;
    $('#secretBubble').classList.add('hidden');

    detail.classList.remove('hidden');
    card.scrollTop = 0;

    // 背景镜头同步到当前事件——这样点“返回旅程”后就停在切换后的事件上
    focusNode(i);
  }

  // 左右切换到相邻事件
  function detailNav(dir) {
    if (detailIndex < 0) return;
    const i = Math.max(0, Math.min(N - 1, detailIndex + dir));
    if (i === detailIndex) return;
    showDetail(i);
    const card = $('#detailCard');
    card.classList.remove('slide-l', 'slide-r');
    void card.offsetWidth;               // 触发重排以重放动画
    card.classList.add(dir > 0 ? 'slide-l' : 'slide-r');
  }

  function closeDetail() {
    $('#detail').classList.add('hidden');
    detailIndex = -1;
  }

  // ---------- 照片：预置 + 本地上传 ----------
  function photoKey(id) { return 'bb_photo_' + id; }
  let currentPhotoNode = null;

  function renderPhoto(n) {
    currentPhotoNode = n;
    const box = $('#detailPhoto'), actions = $('#photoActions');
    box.innerHTML = '';

    // 不再提供上传功能：统一隐藏操作按钮，保证手机 / 桌面端完全一致
    if (actions) actions.style.display = 'none';

    // 无图节点，或没有预置图片的节点，都不显示图位
    if (n.noPhoto || !n.photo) { box.style.display = 'none'; return; }

    box.style.display = '';
    const img = new Image();
    img.onerror = () => { box.textContent = '📷 图片待放入 photos/' + n.photo; };
    img.onload = () => { box.innerHTML = ''; box.appendChild(img); };
    img.src = 'photos/' + n.photo;
  }

  function handleUpload(file) {
    if (!file || !currentPhotoNode) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        // 压缩到最大宽 1000，节省本地存储
        const max = 1000, scale = Math.min(1, max / img.width);
        const cw = Math.round(img.width * scale), ch = Math.round(img.height * scale);
        const c = document.createElement('canvas'); c.width = cw; c.height = ch;
        c.getContext('2d').drawImage(img, 0, 0, cw, ch);
        const data = c.toDataURL('image/jpeg', 0.85);
        try {
          localStorage.setItem(photoKey(currentPhotoNode.id), data);
          renderPhoto(currentPhotoNode);
          heartsBurst();
        } catch (err) {
          alert('本地存储空间不足啦，换张小一点的图片试试～');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // ---------- 彩蛋：详情头像连点 5 次 ----------
  function bindEasterEgg() {
    $('#detailIcon').addEventListener('click', () => {
      iconClicks++;
      $('#detailIcon').style.transform = 'scale(1.25)';
      setTimeout(() => $('#detailIcon').style.transform = '', 120);
      clearTimeout(iconTimer);
      iconTimer = setTimeout(() => iconClicks = 0, 1500);
      if (iconClicks >= 5) {
        iconClicks = 0;
        const n = currentPhotoNode;
        const msg = (n && n.secret) ? n.secret : rand(SECRET_POOL);
        const bubble = $('#secretBubble');
        bubble.textContent = msg;
        bubble.classList.remove('hidden');
        heartsBurst();
      }
    });
  }

  // ---------- 自动巡航 ----------
  function startPlay() {
    if (focus >= N - 1) focusNode(0);
    playing = true; $('#playBtn').textContent = '⏸';
    clearInterval(playTimer);
    playTimer = setInterval(() => {
      if (focus >= N - 1) { stopPlay(); return; }
      focusNode(focus + 1);
    }, playInterval());
  }
  function stopPlay() { playing = false; $('#playBtn').textContent = '▶'; clearInterval(playTimer); }
  function togglePlay() { playing ? stopPlay() : startPlay(); }
  function cycleSpeed() {
    speedIdx = (speedIdx + 1) % PLAY_SPEEDS.length;
    $('#speedBtn').textContent = PLAY_SPEEDS[speedIdx] + 'x';
    if (playing) startPlay();  // 立即以新速度重启
  }

  // ---------- 终点庆祝 ----------
  let finaleDone = false;
  function triggerFinale() {
    stopPlay();
    if (finaleDone) return;
    finaleDone = true;
    confetti(2400);
    const btn = $('#finaleBtn');
    if (btn) btn.addEventListener('click', () => { confetti(1800); heartsBurst(); });
  }

  // ---------- 粒子 ----------
  const EMOJIS = ['💖', '💕', '✨', '🌸', '🎀', '💗', '⭐', '🩷'];
  function confetti(duration = 2000) {
    const layer = $('#particles'); const t0 = Date.now();
    const timer = setInterval(() => {
      for (let i = 0; i < 3; i++) spawnParticle(layer);
      if (Date.now() - t0 > duration) clearInterval(timer);
    }, 120);
  }
  function spawnParticle(layer) {
    const p = document.createElement('div');
    p.className = 'particle'; p.textContent = rand(EMOJIS);
    p.style.left = Math.random() * 100 + '%';
    p.style.fontSize = (14 + Math.random() * 20) + 'px';
    p.style.animationDuration = (2.5 + Math.random() * 2.5) + 's';
    layer.appendChild(p);
    setTimeout(() => p.remove(), 5200);
  }
  function heartsBurst() { for (let i = 0; i < 26; i++) setTimeout(() => spawnParticle($('#particles')), i * 40); }
  function ambientHearts() { setInterval(() => { if (Math.random() < .5) spawnParticle($('#particles')); }, 1500); }

  function buildStars() {
    const box = $('#stars');
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('i'); s.textContent = '✦';
      s.style.left = Math.random() * 100 + '%';
      s.style.top = Math.random() * 60 + '%';
      s.style.animationDelay = (Math.random() * 2.5) + 's';
      s.style.fontSize = (8 + Math.random() * 10) + 'px';
      box.appendChild(s);
    }
  }

  // ---------- 主题 ----------
  const THEMES = [
    { id: 'sweet', name: '粉色少女', emoji: '🌸', c: '#ff8fb1' },
    { id: 'starry', name: '星空浪漫', emoji: '🌌', c: '#2a1f5c' },
    { id: 'mint', name: '清新薄荷', emoji: '🍃', c: '#4ecdc4' },
    { id: 'peach', name: '蜜桃甜橙', emoji: '🍑', c: '#ff9a76' },
    { id: 'lavender', name: '梦幻紫', emoji: '💜', c: '#b085f5' }
  ];
  function applyTheme(id) {
    if (id === 'sweet') document.body.removeAttribute('data-theme');
    else document.body.setAttribute('data-theme', id);
    localStorage.setItem('bb_theme', id);
    renderThemePop();
    if (id === 'starry') startMeteors(); else stopMeteors();
  }
  function renderThemePop() {
    const pop = $('#themePop'); const cur = localStorage.getItem('bb_theme') || 'sweet';
    pop.innerHTML = '';
    THEMES.forEach(t => {
      const chip = document.createElement('div');
      chip.className = 'theme-chip' + (t.id === cur ? ' on' : '');
      chip.style.background = t.c; chip.textContent = t.emoji; chip.title = t.name;
      chip.addEventListener('click', () => { applyTheme(t.id); pop.classList.add('hidden'); });
      pop.appendChild(chip);
    });
  }
  function bindTheme() {
    applyTheme(localStorage.getItem('bb_theme') || 'sweet');
    $('#themeBtn').addEventListener('click', () => $('#themePop').classList.toggle('hidden'));
  }

  // ---------- 星座角标 ----------
  function bindZodiac() {
    $('#zodiacCorner').addEventListener('click', () => {
      let tip = $('.zodiac-tip');
      if (tip) { tip.remove(); return; }
      tip = document.createElement('div');
      tip.className = 'zodiac-tip';
      tip.innerHTML = '宝宝是温柔又浪漫的 <b>双鱼座 ♓</b>，生肖属 <b>兔 🐰</b>——<br>小兔子，白又白，两只耳朵竖起来~';
      $('#stage').appendChild(tip);
      setTimeout(() => { if (tip) tip.remove(); }, 6000);
    });
  }

  // ---------- 流星雨（星空主题：偶尔划过流星并许愿） ----------
  let meteorTimer = null;
  function startMeteors() {
    stopMeteors();
    meteorTimer = setInterval(() => {
      if (document.body.getAttribute('data-theme') !== 'starry') return;
      const n = 1 + (Math.random() < .35 ? 1 : 0);
      for (let i = 0; i < n; i++) setTimeout(spawnMeteor, i * 260);
      if (Math.random() < .28) showWish();
    }, 2400);
  }
  function stopMeteors() { if (meteorTimer) { clearInterval(meteorTimer); meteorTimer = null; } }
  function spawnMeteor() {
    const layer = $('#meteors'); if (!layer) return;
    const m = document.createElement('div');
    m.className = 'meteor';
    m.style.left = (25 + Math.random() * 65) + '%';
    m.style.top = (Math.random() * 35) + '%';
    layer.appendChild(m);
    setTimeout(() => m.remove(), 1500);
  }
  function showWish() {
    const stg = $('#stage'); if (!stg || $('.wish-bubble')) return;
    const b = document.createElement('div');
    b.className = 'wish-bubble';
    b.textContent = rand(WISH_POOL);
    b.style.left = (22 + Math.random() * 38) + '%';
    b.style.top = (22 + Math.random() * 28) + '%';
    stg.appendChild(b);
    setTimeout(() => b.remove(), 4000);
  }

  // ---------- 时光机：任意日期是宝宝出生第几天 ----------
  function bindTimeMachine() {
    const modal = $('#timeMachine');
    const open = () => { modal.classList.remove('hidden'); if (!$('#tmDate').value) $('#tmDate').value = todayISO(); };
    $('#timeMachineBtn').addEventListener('click', open);
    $('#tmClose').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
    $('#tmGo').addEventListener('click', () => {
      const v = $('#tmDate').value, res = $('#tmResult');
      res.classList.remove('hidden');
      if (!v) { res.innerHTML = '先选一个日期呀～'; return; }
      const d = dayOf(v), dateTxt = fmtDate(v);
      if (d < 0) {
        res.innerHTML = `${dateTxt} 那天，宝宝还没出生呢～<br>距离出生还有 <b>${Math.abs(d)}</b> 天`;
      } else {
        const pct = (d / TOTAL_DAYS * 100).toFixed(2);
        res.innerHTML = `${dateTxt} 是<br>宝宝出生第 <b>${d.toLocaleString()}</b> 天<br>
          <span style="font-size:13px;color:var(--purple)">走过一万天的 ${pct}% · ${WEEK[new Date(v + 'T00:00:00').getDay()]}</span>`;
      }
      heartsBurst();
    });
  }

  // ---------- 分享海报：一键生成一张精美图 ----------
  function roundRect(x, l, t, w, h, r) {
    x.beginPath();
    x.moveTo(l + r, t);
    x.arcTo(l + w, t, l + w, t + h, r);
    x.arcTo(l + w, t + h, l, t + h, r);
    x.arcTo(l, t + h, l, t, r);
    x.arcTo(l, t, l + w, t, r);
    x.closePath();
  }
  function makePoster() {
    const W = 750, H = 1150;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ffd9e8'); g.addColorStop(.55, '#ffeaf3'); g.addColorStop(1, '#e6f7ff');
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    // 飘散小心心
    const hs = ['💗', '💕', '✨', '🎀', '🌸', '⭐'];
    x.globalAlpha = .45;
    for (let i = 0; i < 30; i++) {
      x.font = (18 + Math.random() * 34) + 'px serif';
      x.fillText(hs[i % hs.length], Math.random() * W, Math.random() * H);
    }
    x.globalAlpha = 1;

    // 内卡片
    roundRect(x, 48, 90, W - 96, H - 175, 38);
    x.fillStyle = 'rgba(255,255,255,.74)'; x.fill();

    x.textAlign = 'center';
    x.fillStyle = '#ff6f97';
    x.font = 'bold 40px "PingFang SC","Microsoft YaHei",sans-serif';
    x.fillText('💌 宝宝的一万天 💌', W / 2, 195);

    const td = dayOf(todayISO());
    const done = td >= TOTAL_DAYS;
    const bigNum = done ? '10000' : td.toLocaleString();

    x.fillStyle = '#6b4a5a';
    x.font = '25px "PingFang SC","Microsoft YaHei",sans-serif';
    x.fillText(done ? '我们一起抵达了' : '宝宝已经来到这世界', W / 2, 300);

    x.fillStyle = '#e63946';
    x.font = 'bold 150px "Baloo 2",Georgia,sans-serif';
    x.fillText(bigNum, W / 2, 445);

    x.fillStyle = '#6b4a5a';
    x.font = '30px "PingFang SC","Microsoft YaHei",sans-serif';
    x.fillText('天　啦', W / 2, 500);

    // 分隔
    x.strokeStyle = '#ffb3c6'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(180, 545); x.lineTo(W - 180, 545); x.stroke();
    x.fillStyle = '#ff8fb1'; x.font = '26px serif'; x.fillText('❀', W / 2, 555);

    // 倒计时 / 达成
    x.fillStyle = '#a07d8c';
    x.font = '24px "PingFang SC","Microsoft YaHei",sans-serif';
    if (done) x.fillText('🍲 一万天快乐 · 一起去吃海底捞！', W / 2, 620);
    else x.fillText(`距离第 10000 天，还剩 ${TOTAL_DAYS - td} 天`, W / 2, 620);

    // 浪漫句子
    const lines = ['从 1999.03.03 到 2026.07.19', '一万天里最好的事，', '是遇见你，然后爱上你。', '肖娅，', '我爱你'];
    x.fillStyle = '#6b4a5a';
    x.font = '27px "PingFang SC","Microsoft YaHei",sans-serif';
    lines.forEach((ln, i) => x.fillText(ln, W / 2, 700 + i * 52));

    x.fillStyle = '#ff6f97';
    x.font = 'bold 26px "PingFang SC","Microsoft YaHei",sans-serif';
    x.fillText('💖 to my baby · 致我最爱的你 💖', W / 2, H - 130);

    x.fillStyle = '#b39ddb';
    x.font = '20px "PingFang SC","Microsoft YaHei",sans-serif';
    x.fillText('♓ 双鱼座 · 🐰 兔宝宝', W / 2, H - 95);

    return c.toDataURL('image/png');
  }
  function bindShare() {
    const modal = $('#shareModal');
    $('#shareBtn').addEventListener('click', () => {
      const data = makePoster();
      const box = $('#sharePreview'); box.innerHTML = '';
      const img = new Image(); img.src = data; box.appendChild(img);
      $('#shareDownload').onclick = () => {
        const a = document.createElement('a');
        a.href = data; a.download = '宝宝的一万天.png'; a.click();
      };
      modal.classList.remove('hidden');
      confetti(1200);
    });
    $('#shareClose').addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
  }

  // ---------- 拖拽 / 滚轮 / 键盘 ----------
  function bindDrag() {
    let startX = 0;
    const down = e => {
      dragging = true; moved = false;
      startX = dragCur = dragBase = (e.touches ? e.touches[0].clientX : e.clientX);
      stopPlay();
    };
    const move = e => {
      if (!dragging) return;
      dragCur = (e.touches ? e.touches[0].clientX : e.clientX);
      if (Math.abs(dragCur - startX) > 6) moved = true;
      world.classList.add('dragging');
      world.style.transform = `translateX(${(PAD - xs[focus]) + (dragCur - dragBase)}px)`;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      const delta = dragCur - dragBase;
      let best;
      if (Math.abs(delta) < 8) {
        best = focus;                          // 位移极小 → 视为点击，不移动
      } else {
        // 先按落点找最近站
        const targetWorldX = xs[focus] - delta;
        best = 0; let bd = Infinity;
        for (let i = 0; i < N; i++) { const d = Math.abs(xs[i] - targetWorldX); if (d < bd) { bd = d; best = i; } }
        // 轻扫也能翻页：只要方向明确、位移超过 30px，就至少前进 / 后退一站
        if (best === focus && Math.abs(delta) > 30) best = focus + (delta < 0 ? 1 : -1);
      }
      focusNode(Math.max(0, Math.min(N - 1, best)));
      setTimeout(() => moved = false, 50);
    };
    stage.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    stage.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);

    let wheelLock = false;
    stage.addEventListener('wheel', e => {
      e.preventDefault();
      if (wheelLock) return; wheelLock = true;
      const d = (e.deltaY || e.deltaX) > 0 ? 1 : -1;
      stopPlay(); focusNode(focus + d);
      setTimeout(() => wheelLock = false, 420);
    }, { passive: false });
  }

  function bindKeys() {
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const tm = $('#timeMachine'), sm = $('#shareModal');
        if (tm && !tm.classList.contains('hidden')) { tm.classList.add('hidden'); return; }
        if (sm && !sm.classList.contains('hidden')) { sm.classList.add('hidden'); return; }
      }
      if (!$('#detail').classList.contains('hidden')) {
        if (e.key === 'Escape') closeDetail();
        else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') detailNav(1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') detailNav(-1);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { stopPlay(); focusNode(focus + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { stopPlay(); focusNode(focus - 1); }
      else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    });
  }

  function bindMusic() {
    const bgm = $('#bgm'), btn = $('#musicBtn');
    btn.addEventListener('click', () => {
      if (bgm.paused) {
        bgm.volume = .5;
        bgm.play().then(() => btn.textContent = '🔊')
          .catch(() => { btn.textContent = '🔈'; alert('把背景音乐放到 assets/bgm.mp3 就能播放啦～'); });
      } else { bgm.pause(); btn.textContent = '🔈'; }
    });
  }

  // ---------- 详情页左右滑动切换 ----------
  function bindDetailSwipe() {
    const card = $('#detailCard');
    let sx = 0, sy = 0, tracking = false, dx = 0, horiz = false, decided = false;

    const start = e => {
      tracking = true; horiz = false; decided = false; dx = 0;
      const t = e.touches ? e.touches[0] : e;
      sx = t.clientX; sy = t.clientY;
    };
    const move = e => {
      if (!tracking) return;
      const t = e.touches ? e.touches[0] : e;
      dx = t.clientX - sx;
      const dy = t.clientY - sy;
      // 首次移动就锁定方向：横向手势才切换，纵向手势保持正常滚动
      if (!decided && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        decided = true;
        horiz = Math.abs(dx) > Math.abs(dy);
      }
      if (horiz) {
        if (e.cancelable) e.preventDefault();   // 阻止页面纵向滚动，滑动才跟手
        card.style.transition = 'none';
        card.style.transform = `translateX(${dx}px)`;
      }
    };
    const end = () => {
      if (!tracking) return;
      tracking = false;
      card.style.transition = '';
      card.style.transform = '';
      if (horiz && Math.abs(dx) > 45) detailNav(dx < 0 ? 1 : -1);
      dx = 0; horiz = false; decided = false;
    };

    card.addEventListener('touchstart', start, { passive: true });
    card.addEventListener('touchmove', move, { passive: false });
    card.addEventListener('touchend', end);
    card.addEventListener('touchcancel', end);
    card.addEventListener('mousedown', start);
    window.addEventListener('mousemove', e => { if (tracking) move(e); });
    window.addEventListener('mouseup', end);
  }

  // ---------- 进度条拖动 / 点击 → 定位到最近的事件 ----------
  function bindProgressDrag() {
    const track = $('.progress-track');
    if (!track) return;
    let dragging = false;

    const pick = e => {
      const t = e.touches ? e.touches[0] : e;
      const r = track.getBoundingClientRect();
      const horizontal = r.width > r.height;      // 手机上是横向进度条，桌面是纵向
      let f = horizontal ? (t.clientX - r.left) / r.width : (t.clientY - r.top) / r.height;
      f = Math.max(0, Math.min(1, f));
      const targetPct = f * 100;
      // 找 pct 最接近的事件（跳过没有百分比的“未来”节点）
      let best = 0, bd = Infinity;
      NODES.forEach((n, i) => {
        if (n.type === 'future') return;
        const d = Math.abs((n.pct || 0) - targetPct);
        if (d < bd) { bd = d; best = i; }
      });
      stopPlay();
      focusNode(best);
    };
    const down = e => { dragging = true; track.classList.add('dragging'); pick(e); if (e.cancelable) e.preventDefault(); };
    const move = e => { if (dragging) pick(e); };
    const upFn = () => { dragging = false; track.classList.remove('dragging'); };

    track.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', upFn);
    track.addEventListener('touchstart', down, { passive: false });
    track.addEventListener('touchmove', move, { passive: false });
    track.addEventListener('touchend', upFn);
  }

  // ---------- 初始化 ----------
  function boot() {
    buildStations();
    buildNodeList();
    buildStars();
    // 进度条未来帽
    const cap = document.createElement('div'); cap.className = 'future-cap'; cap.textContent = '未来 ∞';
    $('.progress-track').appendChild(cap);

    computeLayout();
    focusNode(0, { animate: false });
    reveal(0);
    ambientHearts();

    bindDrag(); bindKeys(); bindMusic(); bindTheme(); bindZodiac(); bindEasterEgg();
    bindTimeMachine(); bindShare(); bindDetailSwipe(); bindProgressDrag();

    $('#prevBtn').addEventListener('click', () => { stopPlay(); focusNode(focus - 1); });
    $('#nextBtn').addEventListener('click', () => { stopPlay(); focusNode(focus + 1); });
    $('#playBtn').addEventListener('click', togglePlay);
    $('#speedBtn').addEventListener('click', cycleSpeed);
    $('#speedBtn').textContent = PLAY_SPEEDS[speedIdx] + 'x';
    $('#restartBtn').addEventListener('click', () => { stopPlay(); focusNode(0); });
    $('#detailBack').addEventListener('click', closeDetail);
    $('#detailPrev').addEventListener('click', () => detailNav(-1));
    $('#detailNext').addEventListener('click', () => detailNav(1));
    $('#detail').addEventListener('click', e => { if (e.target.id === 'detail') closeDetail(); });
    $('#uploadBtn').addEventListener('click', () => $('#photoInput').click());
    $('#photoInput').addEventListener('change', e => handleUpload(e.target.files[0]));
    $('#removePhotoBtn').addEventListener('click', () => {
      if (currentPhotoNode) { localStorage.removeItem(photoKey(currentPhotoNode.id)); renderPhoto(currentPhotoNode); }
    });

    window.addEventListener('resize', computeLayout);
  }

  $('#startBtn').addEventListener('click', () => {
    $('#intro').classList.add('hidden');
    $('#app').classList.remove('hidden');
    boot();
    confetti(1500);
    const bgm = $('#bgm'); bgm.volume = .5;
    bgm.play().then(() => $('#musicBtn').textContent = '🔊').catch(() => {});
  });
})();
