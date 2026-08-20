const UI_PASSCODE = "3699"; // UI-only gate: all static assets remain public by design.
const app = document.querySelector("#app");
const gate = document.querySelector("#gate");
const form = document.querySelector("#gate-form");
const input = document.querySelector("#passcode");
const error = document.querySelector("#gate-error");

const wasUnlocked=()=>{try{return sessionStorage.getItem("m100-ui-unlocked")==="1"}catch{return false}};
const rememberUnlock=()=>{try{sessionStorage.setItem("m100-ui-unlocked","1")}catch{}};

const pct = (n) => n == null ? "—" : `${n >= 0 ? "+" : ""}${Number(n).toFixed(1)}%`;
const money = (n) => n == null ? "—" : `${n >= 0 ? "+" : ""}${(Number(n) / 1e6).toFixed(1)}M`;
const tone = (n) => Number(n) >= 0 ? "positive" : "negative";
const escape = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function header(data, active) {
  return `<header class="nav"><a class="brand" href="#/">M100</a><nav><a class="${active === "home" ? "active" : ""}" href="#/">今日戰情</a><a class="${active === "groups" ? "active" : ""}" href="#/groups">主力群</a></nav><span class="asof">交易 ${data.transaction_data_through} · 價格 ${data.price_data_through}</span></header>`;
}
function home(data) {
  const watch = data.watchlist || [], groups = data.main_force_groups || [], alerts = data.exit_alerts || [];
  const fresh = watch.filter(x => ["NEW_BUILD","RECENT_BUILD"].includes(x.position_phase)).length;
  const cards = watch.slice(0, 8).map((x, i) => `<article class="card"><div class="card-top"><small>#${String(i+1).padStart(2,"0")} · ${escape(x.anchor_broker_name)}主力群</small><span class="tag risk">${escape(x.operation_stage)}</span></div><h3>${escape(x.stock_name)} <small>${escape(x.symbol)}</small></h3><span class="tag">${escape(x.position_phase)}</span><div class="metrics"><div><small>目前報酬</small><b class="${tone(x.current_return_pct)}">${pct(x.current_return_pct)}</b></div><div><small>近 5 日</small><b class="${tone(x.net_amount_5d)}">${money(x.net_amount_5d)}</b></div><div><small>分點數</small><b>${x.participant_count ?? "—"}</b></div></div></article>`).join("");
  return `${header(data,"home")}<section class="hero"><div class="hero-grid"><div><p class="eyebrow">TODAY'S MAIN FORCE SIGNALS</p><h1>今天，哪一群<br>主力還在買？</h1><p class="lede">公開版儀表板提供主力群觀察、資金變化與撤退警示。資料僅供研究與整理，不構成投資建議。</p></div><div class="stats"><div><strong>${watch.length}</strong><span>今日優先觀察</span></div><div><strong>${alerts.length}</strong><span>降溫／撤退警示</span></div><div><strong>${fresh}</strong><span>新／近期建倉</span></div><div><strong>${groups.length}</strong><span>主力群</span></div></div></div></section><section class="notice"><p><b>資料口徑：</b>券商交易至 ${data.transaction_data_through}，價格估值至 ${data.price_data_through}。資料公開，介面通關碼不具安全性。</p></section><section class="section"><div class="section-head"><div><p class="eyebrow">01 / TODAY'S BATTLEFIELD</p><h2>今日主力觀察榜</h2></div><p>將資金方向、價格位置與追價風險分開呈現；高分不等於買進建議。</p></div><div class="summary"><div><small>新／近期建倉</small><span class="metric">${fresh}</span></div><div><small>降溫／撤退警示</small><span class="metric">${alerts.length}</span></div><div><small>主力群</small><span class="metric">${groups.length}</span></div></div><div class="cards">${cards || '<p class="empty">目前沒有觀察資料。</p>'}</div></section>${footer()}`;
}
function groups(data, selected) {
  const list = [...(data.main_force_groups || [])].sort((a,b) => b.confidence_score-a.confidence_score);
  if (selected) { const g=list.find(x=>x.group_id===selected); if(!g) return groups(data); const holdings=(g.holdings||[]).map(x=>`<article class="card"><small>${escape(x.symbol)}</small><h3>${escape(x.stock_name)}</h3><div class="metrics"><div><small>目前報酬</small><b class="${tone(x.current_return_pct)}">${pct(x.current_return_pct)}</b></div><div><small>近 5 日</small><b class="${tone(x.net_amount_5d)}">${money(x.net_amount_5d)}</b></div><div><small>庫存保留</small><b>${x.inventory_retention_ratio == null ? '—' : (x.inventory_retention_ratio*100).toFixed(0)+'%'}</b></div></div></article>`).join(""); return `${header(data,"groups")}<section class="hero"><p class="eyebrow">GROUP PROFILE</p><h1>${escape(g.anchor_broker_name)}<br>主力群</h1><p class="lede">信心度 ${g.confidence_score} · ${g.holding_count} 檔持股 · 中位報酬 ${pct(g.median_holding_return_pct)}</p></section><section class="section"><p><a href="#/groups">← 返回主力群排行</a></p><div class="cards">${holdings || '<p class="empty">沒有公開持股資料。</p>'}</div></section>${footer()}`; }
  const rows=list.map((g,i)=>`<article class="group" data-group="${escape(g.group_id)}"><span class="rank">#${String(i+1).padStart(2,"0")}</span><div><small>${escape(g.main_force_grade || "主力群")}</small><h3>${escape(g.anchor_broker_name)}</h3><p>${g.members?.length ? g.members.length-1 : 0} 個協同分點 · ${g.holding_count} 檔持股 · 中位報酬 ${pct(g.median_holding_return_pct)}</p></div><div class="score"><small>主力群信心度</small><span class="metric">${g.confidence_score}</span></div></article>`).join("");
  return `${header(data,"groups")}<section class="hero"><p class="eyebrow">MAIN FORCE GROUP DATABASE</p><h1>主力群<br>實力排行</h1><p class="lede">依信心度排列。點選主力群可查看公開持股摘要。</p></section><section class="section"><div class="section-head"><div><p class="eyebrow">RANKING</p><h2>完整主力群</h2></div><p>公開資料版不包含策略規則、原始交易明細或內部研究檔案。</p></div><div class="groups">${rows || '<p class="empty">目前沒有主力群資料。</p>'}</div></section>${footer()}`;
}
const footer=()=>'<footer><strong>M100</strong><span>公開靜態資料版 · 僅供研究整理</span></footer>';
function render(data){const route=location.hash.replace(/^#\/?/,"") || "/";const parts=route.split("/");app.innerHTML=parts[0]==="groups"?groups(data,parts[1]):home(data);document.querySelectorAll("[data-group]").forEach(el=>el.onclick=()=>location.hash=`/groups/${el.dataset.group}`)}
async function start(){gate.hidden=true;app.hidden=false;app.innerHTML='<section class="section"><p class="eyebrow">M100</p><h1>資料載入中…</h1></section>';try{const response=await fetch("data/broker-wave-summary.json",{cache:"no-store"});if(!response.ok)throw new Error("snapshot unavailable");const data=await response.json();if(data.generated_on==="pending-verification"){app.innerHTML='<section class="section"><p class="eyebrow">M100</p><h1>等待今日資料驗證</h1><p>本機更新完成五項日期檢核後，網站會自動同步最新快照。</p></section>';return}render(data);addEventListener("hashchange",()=>render(data))}catch{app.innerHTML='<section class="section"><p class="eyebrow">M100</p><h1>資料暫時無法載入</h1><p>請重新整理頁面後再試。</p></section>'}}
form.addEventListener("submit",e=>{e.preventDefault();if(input.value.trim()===UI_PASSCODE){error.hidden=true;rememberUnlock();start()}else{error.hidden=false;input.select()}});
if(wasUnlocked()) start();
