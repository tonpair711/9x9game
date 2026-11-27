/* 把「介面」上的 emoji 換成同一套線條 SVG（2026-11-27）。
   為什麼用執行時替換：這些 emoji 散在 index.html、battle.html、common.js 組出來的字串裡，
   逐個改要動幾百處而且容易漏；這支只換下面表列的介面符號，裝備與怪物圖示（也是 emoji）不在表內，不受影響。
   換掉的文字節點外面包 <span class="ico">，樣式在 skin2.css。出錯就整支停手，頁面維持原樣。 */
(function () {
  "use strict";
  var S = {
    "🎮": '<path d="M6 9h12a4 4 0 014 4v2a3 3 0 01-5.200 2L15 15H9l-1.800 2A3 3 0 012 15v-2a4 4 0 014-4z"/><path d="M8 11.500v3M6.500 13h3M16 12.500h.01M18 14.500h.01"/>',
    "🔑": '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>',
    "✨": '<path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 16l.8 2.200L22 19l-2.200.8L19 22l-.8-2.200L16 19l2.200-.8z"/>',
    "📖": '<path d="M12 6.500C10 5 7 4.500 4 5v13c3-.5 6 0 8 1.500 2-1.500 5-2 8-1.500V5c-3-.5-6 0-8 1.500zM12 6.500v13"/>',
    "🎒": '<path d="M8 7V6a4 4 0 018 0v1M6 7h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2zM4 13h16M10 13v2h4v-2"/>',
    "⚔": '<path d="M5 4l10 10M20 4L10 14M12 16l-3 3M16 12l3 3M7 14l-2 2"/>',
    "📊": '<path d="M5 20V10M12 20V4M19 20v-7"/>',
    "🔒": '<path d="M6 11h12v9H6zM8 11V8a4 4 0 018 0v3"/>',
    "🏠": '<path d="M4 11l8-7 8 7M6 10v10h12V10M10 20v-5h4v5"/>',
    "➕": '<path d="M12 5v14M5 12h14"/>',
    "📜": '<path d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7M7 4a2 2 0 00-2 2v1h3M7 4v16M10 9h6M10 13h6"/>',
    "💰": '<circle cx="12" cy="13" r="7"/><path d="M12 9.500v7M14 11h-3a1.500 1.500 0 000 3h2a1.500 1.500 0 010 3h-3"/>',
    "⚠": '<path d="M12 4l9 16H3zM12 10v4.500M12 17.500h.01"/>',
    "✕": '<path d="M6 6l12 12M18 6L6 18"/>',
    "⚙": '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M18.400 5.600l-2.100 2.100M7.700 16.300l-2.100 2.100"/>',
    "👉": '<path d="M4 12h14M13 7l5 5-5 5"/>',
    "👆": '<path d="M12 20V6M7 11l5-5 5 5"/>',
    "⬆": '<path d="M12 20V6M7 11l5-5 5 5"/>',
    "🛒": '<path d="M3 4h3l2 11h10l2-8H7"/><circle cx="9" cy="19" r="1.300"/><circle cx="17" cy="19" r="1.300"/>',
    "✅": '<circle cx="12" cy="12" r="9"/><path d="M8 12.500l3 3 5-6"/>',
    "❌": '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
    "⏳": '<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>',
    "👋": ""
  };
  var RE = /(🎮|🔑|✨|📖|🎒|⚔️?|📊|🔒|🏠|👋|➕|📜|💰|⚠️?|✕|⚙️?|👉|👆|⬆️?|🛒|✅|❌|⏳)\s?/g;
  var busy = false;

  function svg(ch) {
    var key = ch.replace(/️/g, "").trim();
    return S[key] === "" ? "" : '<span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24">' + S[key] + "</svg></span>";
  }
  var PICT = /(\p{Extended_Pictographic}️?)/gu;
  function tintSkill(t) {   // 技能按鈕上的彩色 emoji：包起來，由 skin2.css 統一調成金色單色
    var s = t.nodeValue;
    if (!/\p{Extended_Pictographic}/u.test(s)) return false;
    var frag = document.createDocumentFragment();
    s.split(PICT).forEach(function (part) {
      if (!part) return;
      if (/^\p{Extended_Pictographic}/u.test(part)) { var e = document.createElement("span"); e.className = "emj"; e.textContent = part; frag.appendChild(e); }
      else frag.appendChild(document.createTextNode(part));
    });
    t.parentNode.replaceChild(frag, t);
    return true;
  }
  function swapNode(t) {
    var s = t.nodeValue;
    if (t.parentNode && t.parentNode.closest && t.parentNode.closest('.skill, .slot .ic, .gearwin .ic, .gearwin .nm, .drop .ic, .drop b, #bag .ic, .shopItem .ic')) { if (!t.parentNode.classList.contains('emj')) tintSkill(t); return; }
    RE.lastIndex = 0;
    if (!RE.test(s)) return;
    RE.lastIndex = 0;
    var frag = document.createDocumentFragment(), last = 0, m;
    while ((m = RE.exec(s))) {
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      var h = svg(m[1]);
      if (h) { var w = document.createElement("span"); w.innerHTML = h; frag.appendChild(w.firstChild); frag.appendChild(document.createTextNode(" ")); }
      last = m.index + m[0].length;
    }
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    t.parentNode.replaceChild(frag, t);
  }
  function walk(root) {
    if (!root || root.nodeType === 8) return;
    if (root.nodeType === 3) { var pp = root.parentNode; if (pp && !(pp.closest && pp.closest(".ico, .qbox, .ans, .topbar .mname"))) swapNode(root); return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA|INPUT|SVG)$/i.test(root.nodeName) || root.classList.contains("ico")) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        return p && !/^(SCRIPT|STYLE|TEXTAREA)$/i.test(p.nodeName) && !(p.closest && p.closest(".ico, .qbox, .ans, .topbar .mname")) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var list = [], n;
    while ((n = w.nextNode())) list.push(n);
    list.forEach(swapNode);
  }
  function run(root) {
    if (busy) return;
    busy = true;
    try { walk(root); } finally { busy = false; }
  }
  try {
    run(document.body);
    new MutationObserver(function (ms) {
      if (busy) return;
      busy = true;
      try { ms.forEach(function (m) { m.addedNodes.forEach(walk); if (m.type === "characterData") walk(m.target); }); } finally { busy = false; }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  } catch (e) { /* 換不成就維持 emoji，不影響遊戲 */ }
})();
