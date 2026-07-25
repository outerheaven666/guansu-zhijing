// ==UserScript==
// @name         观俗·执镜 直播礼物连接器（测试号专用）
// @namespace    guansu-zhijing
// @version      0.1
// @description  ⚠ 灰色路径，仅限测试号验证流程：监听抖音直播间页面聊天区的新礼物消息，POST 到本机直播服务（localhost:7210）。违反平台协议有封号风险，正式经营请改用抖音开放平台官方能力。
// @match        https://live.douyin.com/*
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  /** 本机直播服务地址（npm run live 启动） */
  const RELAY = 'http://localhost:7210/api/gift';

  /**
   * 礼物 → 抖币映射表。
   * 直播间出现表中不存在的礼物时，脚本会在控制台打印 [未映射] 日志，
   * 把它补进表里即可（抖币价值可在抖音充值页对照）。
   */
  const GIFT_TABLE = {
    小心心: 1, 玫瑰: 1, 点赞: 0, 啤酒: 2, 棒棒糖: 9, 捏捏小脸: 10,
    你真好看: 52, 炸酱面: 66, 墨镜: 99, 比心: 199,
    热气球: 520, 浪漫马车: 888, 火箭: 1000, 保时捷: 1200,
    嘉年华: 3000, 抖音一号: 10001,
  };

  let sent = 0;
  let connected = false;
  const recentHash = new Map(); // 简易去重（内容哈希 → 时间）

  function post(payload) {
    GM_xmlhttpRequest({
      method: 'POST',
      url: RELAY,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({ ...payload, source: 'douyin-userscript' }),
      onload: () => {
        connected = true;
        sent += 1;
        badge();
      },
      onerror: () => {
        connected = false;
        badge();
      },
    });
  }

  /** 从聊天文本中提取礼物事件："昵称：送出 墨镜 x2" / "昵称 送出了 火箭" 等形态 */
  function extract(text) {
    const m = text.match(/(.{1,24}?)[：:]?\s*送出了?\s*([一-龥A-Za-z·]{1,12})(?:\s*[x×]\s*(\d{1,3}))?/);
    if (!m) return null;
    const giftName = m[2];
    if (!(giftName in GIFT_TABLE)) {
      console.log('[观俗连接器] 未映射礼物，请补入 GIFT_TABLE：', giftName);
      return null;
    }
    const count = Math.max(1, Number(m[3]) || 1);
    return {
      nickname: m[1].trim(),
      giftName: count > 1 ? `${giftName}×${count}` : giftName,
      diamond: GIFT_TABLE[giftName] * count,
    };
  }

  function handleNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const text = (node.textContent || '').trim();
    if (!text || text.length > 200 || !text.includes('送出')) return;
    const gift = extract(text);
    if (!gift) return;
    const hash = `${gift.nickname}|${gift.giftName}|${gift.diamond}`;
    const now = Date.now();
    if (recentHash.has(hash) && now - recentHash.get(hash) < 1500) return; // 1.5s 内同内容视为重复
    recentHash.set(hash, now);
    post({ id: `dy-${now}-${Math.random().toString(36).slice(2, 8)}`, ...gift });
  }

  const observer = new MutationObserver((mutations) => {
    for (const mu of mutations) {
      mu.addedNodes.forEach(handleNode);
    }
  });

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
    el.textContent = `观俗连接器 ${connected ? '●' : '○'} 已转发 ${sent} 件礼物`;
    el.style.background = connected ? '#3d5a52' : '#9e2b25';
  }

  // 延迟启动，等直播间聊天区渲染完成
  setTimeout(() => {
    observer.observe(document.body, { childList: true, subtree: true });
    badge();
    console.log('[观俗连接器] 已启动（测试号专用）。礼物将转发到', RELAY);
  }, 3000);
})();
