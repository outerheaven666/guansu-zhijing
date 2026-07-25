// ==UserScript==
// @name         观俗·执镜 直播礼物连接器（测试号专用）
// @namespace    guansu-zhijing
// @version      0.8
// @description  ⚠ 灰色路径，仅限测试号验证流程：监听抖音直播间页面聊天区的新礼物消息，POST 到本机直播服务（localhost:7210）。违反平台协议有封号风险，正式经营请改用抖音开放平台官方能力。
// @match        https://live.douyin.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      localhost
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const RELAY = 'http://localhost:7210/api/gift';
  const DEBUG = 'http://localhost:7210/api/debug';
  const HEALTH = 'http://localhost:7210/api/health';

  /**
   * 礼物 → 抖币映射表。
   * 直播间出现表中不存在的礼物时，角标会显示「未映射 N 种」，
   * 控制台打印 [未映射] 日志，把礼物名和抖币价值补进表里即可。
   */
  const GIFT_TABLE = {
    小心心: 1, 玫瑰: 1, 粉丝团灯牌: 1, 人气票: 1, 点赞: 0, 大啤酒: 2, 啤酒: 2,
    棒棒糖: 9, 捏捏小脸: 10, 你真好看: 52, 比心兔兔: 52, 炸酱面: 66,
    墨镜: 99, Thuglife: 99, 夏日风铃: 99, 名刀司命: 99, 比心: 199,
    热气球: 520, 浪漫马车: 888, 火箭: 1000, 跑车: 1200, 保时捷: 1200,
    嘉年华: 3000, 抖音一号: 10001,
  };

  let sent = 0;
  let connected = false;
  const unmapped = new Set();
  const recentHash = new Map();      // 内容哈希 → 时间（30s TTL，防重渲染重复）
  const recentGiftKey = new Map();   // 礼物名|数量 → 时间（3s TTL，防同一事件多容器重复上报）
  const processedEl = new WeakSet(); // 已处理过的元素（轮询去重）

  const LEARN_KEY = 'gzGiftSrcMap';
  let srcMap = {};
  try { srcMap = JSON.parse(GM_getValue(LEARN_KEY, '{}') || '{}'); } catch (e) { srcMap = {}; }

  // 启动清毒：历史版本曾把「出了」等错误名字学进映射表，只保留合法礼物名
  let purged = 0;
  for (const [k, v] of Object.entries(srcMap)) {
    if (!(v in GIFT_TABLE)) {
      delete srcMap[k];
      purged += 1;
    }
  }
  if (purged) {
    GM_setValue(LEARN_KEY, JSON.stringify(srcMap));
    console.log('[观俗连接器] 已清除', purged, '条错误学习记录');
  }

  let recentTextGift = null; // { nickname, giftName, ts }

  function srcKey(src) {
    if (!src) return '';
    return src.split('?')[0].split('/').pop() || '';
  }

  function learn(src, giftName) {
    const key = srcKey(src);
    if (!key || srcMap[key] || !(giftName in GIFT_TABLE)) return; // 只学合法礼物名
    srcMap[key] = giftName;
    GM_setValue(LEARN_KEY, JSON.stringify(srcMap));
    console.log('[观俗连接器] 学会新映射：', key, '→', giftName);
  }

  function gmPost(url, payload, onload) {
    GM_xmlhttpRequest({
      method: 'POST',
      url,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify(payload),
      onload: onload || (() => {}),
      onerror: () => { if (url === RELAY) { connected = false; badge(); } },
    });
  }

  let lastDebugAt = 0;
  function debugMirror(kind, node, text) {
    const now = Date.now();
    if (now - lastDebugAt < 250) return;
    lastDebugAt = now;
    gmPost(DEBUG, {
      kind,
      url: location.href,
      text: (text || '').slice(0, 200),
      html: (node && node.outerHTML || '').slice(0, 2000),
    });
  }

  function ping() {
    GM_xmlhttpRequest({
      method: 'GET', url: HEALTH, timeout: 3000,
      onload: () => { connected = true; badge(); },
      onerror: () => { connected = false; badge(); },
      ontimeout: () => { connected = false; badge(); },
    });
  }

  function giftLikeText(t) {
    return t.length > 0 && t.length < 200 && (/送/.test(t) || /[x×]\s*\d{1,3}/.test(t));
  }

  /** 从元素向上找礼物图（webcast 图片，排除等级徽章/头像） */
  function findGiftImg(node) {
    let scope = node;
    for (let i = 0; i < 5 && scope; i += 1) {
      if (scope.querySelectorAll) {
        const scopeText = (scope.textContent || '').trim();
        if (giftLikeText(scopeText)) {
          const imgs = scope.querySelectorAll('img');
          for (const img of imgs) {
            const src = img.src || '';
            if (!src.includes('/img/webcast/')) continue;
            if (/grade|level|avatar/i.test(src)) continue;
            return img;
          }
        }
      }
      scope = scope.parentElement;
    }
    return null;
  }

  function finish(nickname, giftName, count) {
    if (!(giftName in GIFT_TABLE)) {
      if (!unmapped.has(giftName)) {
        unmapped.add(giftName);
        console.log('[观俗连接器] 未映射礼物（请把它和抖币价值补进 GIFT_TABLE）：', giftName);
      }
      badge();
      return null;
    }
    return {
      nickname: (nickname || '观众').trim(),
      giftName: count > 1 ? `${giftName}×${count}` : giftName,
      diamond: GIFT_TABLE[giftName] * count,
    };
  }

  /** 形态 A：完整文字横幅 "xxx 送出 嘉年华 x 1" */
  function tryTextForm(node) {
    let scope = node;
    for (let i = 0; i < 4 && scope; i += 1) {
      const text = (scope.textContent || '').trim();
      if (text && text.length <= 200) {
        const m = text.match(/(.{1,24}?)[：:]?\s*送出了?\s*([一-龥A-Za-z·]{2,12})(?:\s*[x×]\s*(\d{1,3}))?/);
        if (m) {
          recentTextGift = { nickname: m[1].trim(), giftName: m[2], ts: Date.now() };
          return { nickname: m[1], giftName: m[2], count: Math.max(1, Number(m[3]) || 1) };
        }
      }
      scope = scope.parentElement;
    }
    return null;
  }

  function extract(node, text) {
    const a = tryTextForm(node);
    if (a) return finish(a.nickname, a.giftName, a.count);

    const img = findGiftImg(node);
    if (!img) return null;
    const src = img.src || '';
    let giftName = (img.alt || '').trim();

    // ① alt → ② 自学习映射 → ③ 连击形态文本直取（"送小心心"，(?!出) 防止吃掉「送出/送出了」）
    //    → ④ 跟最近横幅现学
    if (!giftName) giftName = srcMap[srcKey(src)] || '';
    if (!giftName) {
      const dm = text.match(/送(?!出了?)([一-龥A-Za-z·]{2,12}?)(?=\s*[x×]\s*\d|\s*$)/);
      if (dm && dm[1] !== '出了') {
        giftName = dm[1];
        learn(src, giftName);
      }
    }
    if (!giftName && recentTextGift && Date.now() - recentTextGift.ts < 3000) {
      const nm = text.match(/(.{1,24}?)[：:]?\s*送/);
      const nick = nm ? nm[1].trim() : '';
      if (!nick || nick === recentTextGift.nickname) {
        giftName = recentTextGift.giftName;
        learn(src, giftName);
      }
    }
    if (!giftName) {
      debugMirror('unknown-gift', node, text);
      return null;
    }

    const nm = text.match(/(.{1,24}?)[：:]?\s*送出了?/) || text.match(/^(.{1,24}?)\s*送[一-龥A-Za-z·]/);
    const nickname = nm ? nm[1] : '观众';
    const cm = text.match(/[x×]\s*(\d{1,3})/);
    return finish(nickname, giftName, cm ? Math.max(1, Number(cm[1])) : 1);
  }

  function processNode(node, via) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE || processedEl.has(node)) return;
    const text = (node.textContent || '').trim();
    if (!text || text.length > 200) return;
    const suspicious = text.includes('送')
      || (node.querySelector && node.querySelector('img[src*="/img/webcast/"]'));
    if (!suspicious) return;
    processedEl.add(node);
    debugMirror(`candidate-${via}`, node, text);
    const gift = extract(node, text);
    if (!gift) return;
    const now = Date.now();
    // 去重一：同内容 30s（防重渲染）
    const hash = `${gift.nickname}|${gift.giftName}|${gift.diamond}`;
    if (recentHash.has(hash) && now - recentHash.get(hash) < 30000) return;
    // 去重二：同礼物同数量 3s（同一事件会被连击动画/横幅/面板等多个容器各报一次，昵称解析不一）
    const giftKey = `${gift.giftName}|${gift.diamond}`;
    if (recentGiftKey.has(giftKey) && now - recentGiftKey.get(giftKey) < 3000) return;
    recentHash.set(hash, now);
    recentGiftKey.set(giftKey, now);
    gmPost(RELAY, { id: `dy-${now}-${Math.random().toString(36).slice(2, 8)}`, ...gift, source: 'douyin-userscript' }, () => {
      connected = true;
      sent += 1;
      badge();
    });
  }

  // 通道一：DOM 变化监听
  const observer = new MutationObserver((mutations) => {
    for (const mu of mutations) {
      mu.addedNodes.forEach((n) => processNode(n, 'observer'));
    }
  });

  // 通道二：轮询扫描（兜底——无论抖音怎么渲染，文字落定后必被扫到）
  function scan() {
    // 带 webcast 礼物图的容器（聊天礼物消息 / 连击动画）
    document.querySelectorAll('img[src*="/img/webcast/"]').forEach((img) => {
      const src = img.src || '';
      if (/grade|level|avatar/i.test(src)) return;
      let scope = img;
      for (let i = 0; i < 5 && scope; i += 1) {
        const t = (scope.textContent || '').trim();
        if (giftLikeText(t) && /送/.test(t)) {
          processNode(scope, 'poll');
          break;
        }
        scope = scope.parentElement;
      }
    });
    // 纯文字横幅（无图："xxx 送出 小心心 x 1"）
    document.querySelectorAll('div,span').forEach((el) => {
      if (el.children.length > 6) return; // 只看小容器，避免遍历大区块
      const t = (el.textContent || '').trim();
      if (t.length >= 6 && t.length < 120 && /送出了?\s*[一-龥A-Za-z·]{2,12}/.test(t)) {
        processNode(el, 'poll-text');
      }
    });
  }

  function badge() {
    let el = document.getElementById('gz-live-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'gz-live-badge';
      el.style.cssText =
        'position:fixed;right:12px;bottom:12px;z-index:99999;background:#9e2b25;color:#f6f1e5;' +
        'padding:6px 10px;border-radius:8px;font-size:12px;font-family:serif;opacity:.9';
      document.body.appendChild(el);
    }
    const extra = unmapped.size ? ` · 未映射 ${unmapped.size} 种` : '';
    el.textContent = `观俗连接器 ${connected ? '●' : '○'} 已转发 ${sent} 件礼物${extra}`;
    el.style.background = connected ? '#3d5a52' : '#9e2b25';
  }

  setTimeout(() => {
    observer.observe(document.body, { childList: true, subtree: true });
    setInterval(scan, 800);
    badge();
    ping();
    setInterval(ping, 15000);
    gmPost(DEBUG, { kind: 'startup', url: location.href, version: '0.7', purged });
    console.log('[观俗连接器] v0.8 已启动（监听+轮询双通道+双重去重）。已学会', Object.keys(srcMap).length, '种礼物图映射。');
  }, 3000);
})();
