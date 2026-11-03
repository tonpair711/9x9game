/* 擴充題型（2026-11-03 Steve：還有什麼學習可以放進來，全都做）
   除法／比大小與數列／認時鐘／錢幣／倍數因數／分數比大小／英文單字／英文數字顏色星期／國字認注音。
   做法：每個題型是一個「出一題」的函式，註冊在 ExtraQ 上，common.js 的 makeQOnce() 查得到就用它。
   出題袋（隨機洗牌／依序）共用 common.js 的 bagPick()，所以每題都考得到、也能按順序。
   一題的格式跟 common.js 一樣 {a,b,op,ans,text,key,weak,kind}，另外多幾個欄位：
     html    畫面直接放這段（沒有就照 a op b = ? 的算式畫法）
     after   html 放好之後呼叫，用來畫時鐘
     opts    固定的選項（沒有就由 makeOptions 湊）；fixed:true 表示不洗牌
     speak／lang／speakAns  用瀏覽器內建語音唸題目／正解（不用預錄音檔）
     langq   語文題：「只唸注音字母」那一段也要唸
   這支檔案要放在 common.js 之後載入。 */
(function(){
  const shuf = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = (Math.random()*(i+1))|0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rnd = n => (Math.random()*n)|0;
  const seq = () => Order.get() === 'seq';
  /* 從 pool 裡挑 n 個「不等於 ans」的當混淆項 */
  const others = (pool, ans, n) => shuf(pool.filter(x => x !== ans)).slice(0, n);
  const mk = (o) => Object.assign({a:null, b:null, op:'', weak:false}, o);

  /* ---------- 版面用的 CSS（跟題型一起放，不另外開檔） ---------- */
  const st = document.createElement('style');
  st.textContent = `
  .qbox .q.rich{font-size:clamp(26px,6.4vw,42px);line-height:1.2}
  .qbox .q .big{font-size:clamp(54px,15vw,84px);line-height:1}
  .qbox .q .qh{display:block;font-size:13px;font-weight:700;color:#ffd0a8;margin-top:4px;letter-spacing:1px}
  .qbox .q .clk{width:112px;height:112px;display:block;margin:0 auto}
  .qbox .q .coins{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:90%;margin:0 auto}
  .mcoin{display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:50%;
    font-size:15px;font-weight:900;color:#4a3000;background:radial-gradient(circle at 35% 30%,#fff3b0,#e0a516);
    border:2px solid #b07a00;box-shadow:0 2px 0 #7a5200}
  .mcoin.c1{background:radial-gradient(circle at 35% 30%,#fff,#bfc4cc);border-color:#8a9099;color:#333;width:34px;height:34px;box-shadow:0 2px 0 #5d636b}
  .mcoin.c5{background:radial-gradient(circle at 35% 30%,#fff,#cfd3da);border-color:#8a9099;color:#333;width:38px;height:38px;box-shadow:0 2px 0 #5d636b}
  .frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.1;margin:0 4px}
  .frac b{font-weight:900;padding:0 6px;border-bottom:3px solid currentColor}
  .frac i{font-style:normal;font-weight:900;padding:0 6px}
  .ans.txt button{font-size:clamp(20px,5.2vw,30px);letter-spacing:0}
  .ans.three button:last-child{grid-column:1 / -1}
  `;
  document.head.appendChild(st);

  const Q = {};
  window.ExtraQ = Q;

  /* ---------- 除法：九九乘法反過來 ---------- */
  Q.div = () => {
    const [b, c] = bagPick('div', pairsOf('div', () => {
      const l = []; for(let x = 2; x <= 9; x++) for(let y = 2; y <= 9; y++) l.push([x, y]); return l; }));
    const a = b * c;
    return mk({a, b, op:'÷', ans:c, text: a + ' ÷ ' + b, key: a + '÷' + b, kind:'div',
      speak: a + ' 除以 ' + b + ' 等於多少', lang:'zh-TW'});
  };

  /* ---------- 比大小／數列／幾個十（數感） ---------- */
  const CMP = ['＞', '＜', '＝'];
  const cmpQ = (a, b, kind, key, html) => {
    const ans = a > b ? '＞' : a < b ? '＜' : '＝';
    return mk({ans, text: key, key, kind, html, opts: CMP, fixed:true, txt:true,
      speak: html.replace(/<[^>]+>/g, ' ') + ' 哪個比較大', lang:'zh-TW'});
  };
  const numCmp = () => {
    const r = Range.get();
    let [a, b] = bagPick('cmp' + r, pairsOf('cmp' + r, () => {
      const l = []; for(let x = 1; x <= r; x++) for(let y = 1; y <= r; y++) if(x !== y) l.push([x, y]); return l; }));
    if(!seq() && Math.random() < .12) b = a;                     // 偶爾出相等的，才會用到「＝」
    return cmpQ(a, b, 'cmp', a + '比' + b, a + ' <em>○</em> ' + b);
  };
  const numSeq = () => {
    const r = Math.max(Range.get(), 20);
    const [s0, step, dir] = bagPick('seq' + r, pairsOf('seq' + r, () => {
      const l = [];
      for(const st of [1, 2, 3, 4, 5, 10]){
        for(let s = 1; s + 4*st <= Math.min(r, 60); s++) l.push([s, st, 1]);
        for(let s = 4*st + 1; s <= Math.min(r, 60); s++) l.push([s, st, -1]);
      }
      return l; }));
    const terms = [0, 1, 2, 3, 4].map(i => s0 + dir * step * i);
    const miss = seq() ? 4 : rnd(5);
    const ans = terms[miss];
    const html = terms.map((v, i) => i === miss ? '<em>？</em>' : v).join('，');
    return mk({ans, text:'數列 ' + terms.join(','), key:'數列' + terms[0] + (dir > 0 ? '+' : '-') + step, kind:'seq', html,
      speak:'找出數列缺的那一個數', lang:'zh-TW'});
  };
  const numPlace = () => {
    const [n, form] = bagPick('place', pairsOf('place', () => {
      const l = []; for(let x = 11; x <= 99; x++){ l.push([x, 0]); l.push([x, 1]); } return l; }));
    const t = (n / 10) | 0, o = n % 10;
    if(form === 0){
      return mk({ans:n, text:t + '個十' + o + '個一', key:'幾個十' + n, kind:'place',
        html: t + ' 個十和 ' + o + ' 個一，<em>是多少？</em>', speak: t + ' 個十和 ' + o + ' 個一，是多少', lang:'zh-TW'});
    }
    return mk({ans:t, text:n + '有幾個十', key:'幾個十' + n, kind:'place',
      html: n + ' 裡面有 <em>幾個十？</em>', speak: n + ' 裡面有幾個十', lang:'zh-TW'});
  };
  let rot1 = 0;
  Q.numsense = () => {
    const k = seq() ? (rot1++) % 3 : rnd(3);
    return [numCmp, numSeq, numPlace][k]();
  };

  /* ---------- 認時鐘 ---------- */
  const drawClock = (cv, h, m) => {
    if(!cv) return;
    const c = cv.getContext('2d'), R = cv.width / 2, cx = R, cy = R;
    c.clearRect(0, 0, cv.width, cv.height);
    c.beginPath(); c.arc(cx, cy, R - 4, 0, 7); c.fillStyle = '#fffdf3'; c.fill();
    c.lineWidth = 6; c.strokeStyle = '#e0a516'; c.stroke();
    c.fillStyle = '#3a2560'; c.font = 'bold ' + Math.round(R * .22) + 'px sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for(let i = 1; i <= 12; i++){
      const an = i / 12 * Math.PI * 2 - Math.PI / 2;
      c.fillText(i, cx + Math.cos(an) * R * .74, cy + Math.sin(an) * R * .74);
    }
    const hand = (an, len, w, col) => {
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(an) * len, cy + Math.sin(an) * len);
      c.lineWidth = w; c.lineCap = 'round'; c.strokeStyle = col; c.stroke();
    };
    hand(((h % 12) + m / 60) / 12 * Math.PI * 2 - Math.PI / 2, R * .46, 8, '#3a2560');   // 時針又粗又短
    hand(m / 60 * Math.PI * 2 - Math.PI / 2, R * .68, 5, '#d9363e');                      // 分針又細又長
    c.beginPath(); c.arc(cx, cy, 6, 0, 7); c.fillStyle = '#3a2560'; c.fill();
  };
  const tstr = (h, m) => h + ':' + String(m).padStart(2, '0');
  Q.clock = () => {
    const [h, m] = bagPick('clock', pairsOf('clock', () => {
      const l = []; for(let x = 1; x <= 12; x++) for(const y of [0, 30, 15, 45]) l.push([x, y]); return l; }));
    const ans = tstr(h, m);
    const cand = new Set();
    for(const y of [0, 15, 30, 45]) if(y !== m) cand.add(tstr(h, y));              // 同一小時、不同分鐘
    cand.add(tstr(h % 12 + 1, m)); cand.add(tstr((h + 10) % 12 + 1, m));          // 差一小時
    if(m % 15 === 0 && m !== 0 && m !== 30) cand.add(tstr(m / 5 || 12, h * 5 % 60)); // 時針分針看反
    const opts = [ans, ...others([...cand], ans, 3)];
    return mk({ans, text:'看時鐘', key:'時鐘' + ans, kind:'clock', opts, txt:true,
      html:'<canvas class="clk" width="240" height="240"></canvas><span class="qh">現在是幾點？</span>',
      after: el => drawClock(el.querySelector('canvas'), h, m),
      speak:'現在是幾點幾分', lang:'zh-TW'});
  };

  /* ---------- 錢幣與找錢 ---------- */
  const THINGS = ['🍬', '🍪', '🍎', '✏️', '🎈', '🧃', '🍙', '📒'];
  Q.money = () => {
    const [kind, v] = bagPick('money', pairsOf('money', () => {
      const l = [];
      for(let a = 0; a <= 1; a++) for(let b = 0; b <= 4; b++) for(let c = 0; c <= 1; c++) for(let d = 0; d <= 4; d++)
        if(a + b + c + d) l.push(['c', [a, b, c, d]]);
      for(let p = 5; p <= 95; p++) l.push(['p', p]);
      return l; }));
    if(kind === 'c'){
      const [a, b, c, d] = v, sum = a * 50 + b * 10 + c * 5 + d;
      const chip = (n, k) => Array.from({length:k}, () => '<span class="mcoin c' + n + '">' + n + '</span>').join('');
      return mk({ans:sum, text:'數錢幣', key:'數錢幣' + sum, kind:'money',
        html:'<div class="coins">' + chip(50, a) + chip(10, b) + chip(5, c) + chip(1, d) + '</div><span class="qh">全部共幾元？</span>',
        speak:'這些錢幣全部共幾元', lang:'zh-TW'});
    }
    const th = THINGS[rnd(THINGS.length)];
    return mk({ans:100 - v, text:'100 元買 ' + v + ' 元', key:'找錢100-' + v, kind:'money',
      html:'有 100 元，買 ' + th + ' <em>' + v + '</em> 元，<em>找回幾元？</em>',
      speak:'有一百元，買' + v + '元的東西，要找回幾元', lang:'zh-TW'});
  };

  /* ---------- 倍數與因數（高年級） ---------- */
  Q.factor = () => {
    const [kind, n] = bagPick('factor', pairsOf('factor', () => {
      const l = []; for(let x = 2; x <= 9; x++) l.push(['m', x]);
      for(const x of [6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 30, 36]) l.push(['f', x]);
      return l; }));
    if(kind === 'm'){
      const ans = n * (2 + rnd(8));
      const pool = []; for(let x = Math.max(2, ans - 12); x <= ans + 12; x++) if(x % n !== 0) pool.push(x);
      return mk({ans, text:n + '的倍數', key:n + '的倍數', kind:'factor', opts:[ans, ...shuf(pool).slice(0, 3)],
        html:'<em>' + n + '</em> 的倍數是哪一個？', speak: n + ' 的倍數是哪一個', lang:'zh-TW'});
    }
    const divs = []; for(let x = 2; x < n; x++) if(n % x === 0) divs.push(x);
    const ans = divs[rnd(divs.length)];
    const pool = []; for(let x = 2; x <= n; x++) if(n % x !== 0) pool.push(x);
    return mk({ans, text:n + '的因數', key:n + '的因數', kind:'factor', opts:[ans, ...shuf(pool).slice(0, 3)],
      html:'<em>' + n + '</em> 的因數是哪一個？', speak: n + ' 的因數是哪一個', lang:'zh-TW'});
  };

  /* ---------- 分數比大小（高年級） ---------- */
  const frac = (n, d) => '<span class="frac"><b>' + n + '</b><i>' + d + '</i></span>';
  Q.fraction = () => {
    const [n1, d1, n2, d2] = bagPick('frac', pairsOf('frac', () => {
      const l = [];
      for(let d = 3; d <= 8; d++) for(let a = 1; a < d; a++) for(let b = 1; b < d; b++) if(a !== b) l.push([a, d, b, d]);
      for(let n = 1; n <= 3; n++) for(let x = 4; x <= 8; x++) for(let y = 4; y <= 8; y++) if(x !== y && n < x && n < y) l.push([n, x, n, y]);
      for(const [a, b, c, d] of [[1,2,2,4],[1,2,3,6],[1,3,2,6],[2,3,4,6],[1,4,2,8],[3,4,6,8],[1,2,4,8]]){ l.push([a, b, c, d]); l.push([c, d, a, b]); }
      return l; }));
    const L = n1 * d2, Rr = n2 * d1;
    return cmpQ(L, Rr, 'fraction', n1 + '/' + d1 + '比' + n2 + '/' + d2,
      frac(n1, d1) + ' <em>○</em> ' + frac(n2, d2));
  };

  /* ---------- 英文單字（看圖選字） ---------- */
  const WORDS = [
    ['🍎','apple'],['🍌','banana'],['🍇','grapes'],['🍓','strawberry'],['🍊','orange'],['🍉','watermelon'],
    ['🥕','carrot'],['🍞','bread'],['🥛','milk'],['🥚','egg'],['🍚','rice'],['🍰','cake'],
    ['🐱','cat'],['🐶','dog'],['🐭','mouse'],['🐰','rabbit'],['🐻','bear'],['🐷','pig'],['🐮','cow'],['🐴','horse'],
    ['🐑','sheep'],['🐔','chicken'],['🦆','duck'],['🐟','fish'],['🐦','bird'],['🐢','turtle'],['🐘','elephant'],
    ['🦁','lion'],['🐵','monkey'],['🐯','tiger'],['🐸','frog'],['🐝','bee'],['🦋','butterfly'],
    ['🚗','car'],['🚌','bus'],['🚲','bike'],['🚂','train'],['✈️','plane'],['🚢','ship'],
    ['🏠','house'],['🌳','tree'],['🌸','flower'],['☀️','sun'],['🌙','moon'],['⭐','star'],['☁️','cloud'],
    ['🌧️','rain'],['📖','book'],['✏️','pencil'],['🎒','bag'],['🪑','chair'],['⚽','ball'],['🎈','balloon'],
    ['👕','shirt'],['👟','shoes'],['🎩','hat'],['☂️','umbrella'],['🔑','key'],['⏰','clock'],['📞','phone'],
    ['🛏️','bed'],['🚪','door'],['🌈','rainbow'],['🔥','fire'],['💧','water']
  ];
  const WORD_POOL = WORDS.map(w => w[1]);
  Q.word = () => {
    const i = bagPick('word', WORDS.map((_, k) => k)), [e, w] = WORDS[i];
    return mk({ans:w, text:e, key:e + w, kind:'word', langq:true, txt:true,
      opts:[w, ...others(WORD_POOL, w, 3)],
      html:'<span class="big">' + e + '</span>', speak:w, lang:'en-US', speakAns:w});
  };

  /* ---------- 英文數字、顏色、星期 ---------- */
  const NUMS = ['one','two','three','four','five','six','seven','eight','nine','ten'];
  const COLORS = [['🔴','red'],['🟠','orange'],['🟡','yellow'],['🟢','green'],['🔵','blue'],['🟣','purple'],
                  ['⚫','black'],['⚪','white'],['🟤','brown'],['🩷','pink']];
  const DAYS = [['星期一','Monday'],['星期二','Tuesday'],['星期三','Wednesday'],['星期四','Thursday'],
                ['星期五','Friday'],['星期六','Saturday'],['星期日','Sunday']];
  Q.engbasic = () => {
    const [kind, i] = bagPick('engbasic', pairsOf('engbasic', () => {
      const l = [];
      NUMS.forEach((_, k) => l.push(['n', k])); COLORS.forEach((_, k) => l.push(['c', k])); DAYS.forEach((_, k) => l.push(['d', k]));
      return l; }));
    let show, ans, pool;
    if(kind === 'n'){ show = String(i + 1); ans = NUMS[i]; pool = NUMS; }
    else if(kind === 'c'){ show = COLORS[i][0]; ans = COLORS[i][1]; pool = COLORS.map(c => c[1]); }
    else { show = DAYS[i][0]; ans = DAYS[i][1]; pool = DAYS.map(d => d[1]); }
    return mk({ans, text:show, key:show + ans, kind:'engbasic', langq:true, txt:true,
      opts:[ans, ...others(pool, ans, 3)],
      html:'<span class="big">' + show + '</span>', speak:ans, lang:'en-US', speakAns:ans});
  };

  /* ---------- 國字認注音 ---------- */
  const ZI = [
    ['人','ㄖㄣˊ'],['大','ㄉㄚˋ'],['小','ㄒㄧㄠˇ'],['山','ㄕㄢ'],['水','ㄕㄨㄟˇ'],['火','ㄏㄨㄛˇ'],['日','ㄖˋ'],['月','ㄩㄝˋ'],
    ['木','ㄇㄨˋ'],['口','ㄎㄡˇ'],['手','ㄕㄡˇ'],['足','ㄗㄨˊ'],['目','ㄇㄨˋ'],['耳','ㄦˇ'],['天','ㄊㄧㄢ'],['地','ㄉㄧˋ'],
    ['上','ㄕㄤˋ'],['下','ㄒㄧㄚˋ'],['中','ㄓㄨㄥ'],['左','ㄗㄨㄛˇ'],['右','ㄧㄡˋ'],['田','ㄊㄧㄢˊ'],['雨','ㄩˇ'],['風','ㄈㄥ'],
    ['雲','ㄩㄣˊ'],['花','ㄏㄨㄚ'],['草','ㄘㄠˇ'],['鳥','ㄋㄧㄠˇ'],['魚','ㄩˊ'],['牛','ㄋㄧㄡˊ'],['羊','ㄧㄤˊ'],['馬','ㄇㄚˇ'],
    ['狗','ㄍㄡˇ'],['貓','ㄇㄠ'],['雞','ㄐㄧ'],['石','ㄕˊ'],['土','ㄊㄨˇ'],['金','ㄐㄧㄣ'],['心','ㄒㄧㄣ'],['父','ㄈㄨˋ'],
    ['母','ㄇㄨˇ'],['哥','ㄍㄜ'],['姊','ㄐㄧㄝˇ'],['弟','ㄉㄧˋ'],['妹','ㄇㄟˋ'],['家','ㄐㄧㄚ'],['門','ㄇㄣˊ'],['車','ㄔㄜ'],
    ['書','ㄕㄨ'],['學','ㄒㄩㄝˊ'],['校','ㄒㄧㄠˋ'],['老','ㄌㄠˇ'],['師','ㄕ'],['好','ㄏㄠˇ'],['我','ㄨㄛˇ'],['你','ㄋㄧˇ'],
    ['他','ㄊㄚ'],['一','ㄧ'],['二','ㄦˋ'],['三','ㄙㄢ'],['四','ㄙˋ'],['五','ㄨˇ'],['六','ㄌㄧㄡˋ'],['七','ㄑㄧ'],
    ['八','ㄅㄚ'],['九','ㄐㄧㄡˇ'],['十','ㄕˊ']
  ];
  /* 兩個字注音相同（目、木）時，混淆項不能放到另一個一樣的，不然會有兩個正確答案；others() 用字串去重已處理 */
  const ZI_POOL = [...new Set(ZI.map(z => z[1]))];
  Q.zi = () => {
    const i = bagPick('zi', ZI.map((_, k) => k)), [ch, zy] = ZI[i];
    return mk({ans:zy, text:ch, key:ch, kind:'zi', langq:true, txt:true,
      opts:[zy, ...others(ZI_POOL, zy, 3)],
      html:'<span class="big">' + ch + '</span><span class="qh">這個字怎麼念？</span>',
      speak:ch, lang:'zh-TW', speakAns:ch});
  };
})();
