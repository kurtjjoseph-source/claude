/* The administrative bishop's console — the region-wide view.
   Ministers and congregations each have their own intranet; this reads across
   both and is the only surface that sees discipline files. */
/* ══════════════════ rendering ═══════════════════════════════════════════ */
const LABELS = {
  overview:'Overview', standing:'Ministers', congregations:'Congregations', report:'Monthly report',
  covenant:'Covenant review', triads:'Triads', concerns:'Concerns', restoration:'Restoration',
  safeguard:'Safeguarding', sources:'Sources',
  churchhome:'Our church', churchreport:'Monthly report', governance:'Governance', progress:'Progress'
};
const TABSETS = {
  overseer:['overview','standing','congregations','triads','concerns','restoration','safeguard','sources'],
  minister:['overview','report','covenant','triads','concerns','sources'],
  church:  ['churchhome','churchreport','governance','progress','concerns','sources']
};
const MINISTER_LABELS = {overview:'My standing', triads:'My triad', concerns:'Concerns'};
const CHURCH_LABELS = {concerns:'Raising a concern'};

function renderTabs(){
  const q = actionQueue();
  const ch = chById(view.church);
  const counts = {
    overview: q.filter(a=>a.p===1).length,
    concerns: S.concerns.filter(c=>!c.closed).length,
    standing: S.ministers.filter(m=>reportFlag(m).level>=2).length,
    congregations: S.churches.filter(c=>chLadder(c).months>=2 || c.delinquentFunds).length,
    restoration: S.restorations.length
  };
  const set = TABSETS.overseer;
  if(!set.includes(view.tab)) view.tab = set[0];
  document.getElementById('tabs').innerHTML = set.map(k=>{
    const n = counts[k];
    const t = (view.role==='minister' && MINISTER_LABELS[k]) || (view.role==='church' && CHURCH_LABELS[k]) || LABELS[k];
    return `<button type="button" data-tab="${k}" aria-current="${view.tab===k}">${t}${n?`<span class="n">${n}</span>`:''}</button>`;
  }).join('');
  document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{ view.tab=b.dataset.tab; render(); window.scrollTo({top:0,behavior:'smooth'}); });
}

function render(){
  renderTabs();
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on'));
  const pane = document.getElementById('p-'+view.tab);
  pane.classList.add('on');
  ({overview:vOverview, standing:vStanding, report:vReport, covenant:vCovenant, triads:vTriads,
    concerns:vConcerns, restoration:vRestoration, safeguard:vSafeguard, sources:vSources,
    congregations:vCongregations, churchhome:vChurchHome, churchreport:vChurchReport,
    governance:vGovernance, progress:vProgress})[view.tab](pane);
  save();
}


/* ── Overview ──────────────────────────────────────────────────────────── */
function vOverview(el){
  if(view.role==='minister') return vMinisterHome(el);
  const q = actionQueue();
  const active = S.ministers.filter(m=>m.status==='active');
  const current = active.filter(m=>delinquency(m)===0).length;
  const pct = Math.round(current/active.length*100);
  const behind3 = active.filter(m=>delinquency(m)>=3).length;
  const reaffBad = S.ministers.filter(m=>!reaffFlag(m).ok).length;
  const bgBad = S.ministers.filter(m=>!bgFlag(m).ok && bgFlag(m).why==='polity').length;
  const openC = S.concerns.filter(c=>!c.closed).length;
  const chBehind = S.churches.filter(c=>chLadder(c).months>=2).length;
  const owed = S.churches.reduce((n,c)=>n+c.delinquentFunds,0);

  el.innerHTML = `
  <h2 class="dh">${esc(S.region)} — network state, ${pLabel(S.period)}</h2>
  <p class="sub">Most of what is counted below is already required by the Minutes; a few checks the network adds on its own authority, and those are labelled as such throughout. Nothing here is an opinion about anyone's ministry — it is what the record does and does not currently show.</p>

  <div class="grid g4">
    <div class="kpi"><div class="v">${S.ministers.length}</div><div class="k">Credentialed ministers</div></div>
    <div class="kpi ${pct<80?'warnk':''}"><div class="v">${pct}%</div><div class="k">Reporting current</div></div>
    <div class="kpi ${behind3?'alert':''}"><div class="v">${behind3}</div><div class="k">At 3+ months behind</div></div>
    <div class="kpi ${openC?'warnk':''}"><div class="v">${openC}</div><div class="k">Open concerns</div></div>
    <div class="kpi ${reaffBad?'warnk':''}"><div class="v">${reaffBad}</div><div class="k">Reaffirmation overdue</div></div>
    <div class="kpi ${bgBad?'alert':''}"><div class="v">${bgBad}</div><div class="k">No background check</div></div>
    <div class="kpi"><div class="v">${S.restorations.length}</div><div class="k">In restoration</div></div>
    <div class="kpi"><div class="v">${S.churches.length}</div><div class="k">Congregations</div></div>
    <div class="kpi ${chBehind?'alert':''}"><div class="v">${chBehind}</div><div class="k">Churches 2+ months behind</div></div>
    <div class="kpi ${owed?'alert':''}"><div class="v">€${owed.toLocaleString('en-GB')}</div><div class="k">Ministry money owed</div></div>
  </div>

  <p class="shead">Action queue — ${q.length} item${q.length===1?'':'s'}, most urgent first</p>
  <div class="aq">${q.map(a=>`
    <div class="act p${a.p}">
      <div style="flex:1">
        <div class="who">${esc(a.who)}</div>
        <div class="what">${esc(a.what)}</div>
        <div class="meta">
          <span class="chip">${esc(a.tag)}</span>
          ${a.cite==='network practice' ? `<span class="prac">network practice</span>` : `<span class="cite">${esc(a.cite)}</span>`}
        </div>
      </div>
      <button class="b ghost sm" data-go="${a.go[0]}" data-goid="${a.go[1]||''}" type="button">Open</button>
    </div>`).join('')}
  </div>

  <p class="shead">How the network is put together</p>
  <div class="grid g2">
    <div class="card"><h3>It tracks obligations that already exist</h3>
      <p>Monthly reporting, biennial doctrinal reaffirmation, background checks, the discipline and restoration process — none of this is invented here. Each flag names the section that creates it, so an administrative bishop can defend every prompt the system makes.</p>
      <p><span class="cite">S28</span> <span class="cite">S29</span> <span class="cite">S30</span> <span class="cite">S31</span></p></div>
    <div class="card"><h3>It puts a relationship before a process</h3>
      <p>Triads and the quarterly covenant review sit <em>in front of</em> the concern pathway on purpose. A network whose only mechanism is a trial board has one setting. Most of what breaks a ministry is visible long before a charge is written.</p>
      <p><span class="prac">network practice</span> <span class="cite">Interdependence commitment</span></p></div>
    <div class="card"><h3>It refuses to skip Matthew 18</h3>
      <p>A concern cannot be filed as a charge in this system until the private approach has been recorded. The pathway is ordered — private, then with witnesses, then in writing and signed — because the governing text orders it that way and because skipping it is how ordinary friction becomes a trial.</p>
      <p><span class="cite">Matthew 18:15–17</span> <span class="cite">S31 I.B.1</span></p></div>
    <div class="card"><h3>It keeps two ledgers, not one</h3>
      <p>A minister's standing and a congregation's standing are separate obligations with separate ladders, and conflating them is how a four-month church deficit hides behind a pastor who is personally up to date. Each congregation holds its own record, sees its own ladder position, and files its own report.</p>
      <p><span class="cite">S28 III</span> <span class="cite">S53 III.6</span> <span class="cite">S55 III.A</span></p></div>
    <div class="card"><h3>It aims at restoration, not removal</h3>
      <p>Discipline in this tradition exists "for the purpose of restoration and maintaining accountability and integrity" — so a suspension in Mending Net opens a restoration track with a named five-person team, a clock, and three evidences to be demonstrated, rather than simply closing a file.</p>
      <p><span class="cite">S30 Introduction</span> <span class="cite">S30 IV</span></p></div>
  </div>`;
  wireGo(el);
}

function vMinisterHome(el){
  const m = mById(view.who), f = reportFlag(m), r = reaffFlag(m), b = bgFlag(m);
  const t = triadOf(m.id), rv = lastReview(m.id), rt = restorationOf(m.id);
  const mine = S.concerns.filter(c=>c.subject===m.id && !c.closed);
  el.innerHTML = `
  <h2 class="dh">${esc(m.name)}</h2>
  <p class="sub">${esc(m.rank)} · ${esc(m.church)} · ${esc(m.district)} district. This is what the network can currently see about your standing — the same view your administrative bishop has, which is the point.</p>
  <div class="grid g3">
    <div class="kpi ${f.cls==='bad'?'alert':f.cls==='warn'?'warnk':''}"><div class="v" style="font-size:22px">${esc(f.label)}</div><div class="k">Monthly reporting · ${esc(f.cite)}</div></div>
    <div class="kpi ${r.ok?'':'warnk'}"><div class="v" style="font-size:22px">${esc(r.label)}</div><div class="k">Doctrinal reaffirmation · S29 I.9</div></div>
    <div class="kpi ${b.ok?'':(b.cls==='bad'?'alert':'warnk')}"><div class="v" style="font-size:22px">${esc(b.label)}</div><div class="k">Background check · S29 I.11</div></div>
  </div>
  ${f.action?`<div class="warnbox" style="margin-top:var(--s3)"><b>Required next step.</b> ${esc(f.action)} <span class="cite">${esc(f.cite)}</span></div>`:''}
  <p class="shead">Where you stand with people, not just with paperwork</p>
  <div class="grid g2">
    <div class="card"><h3>Your triad</h3>
      ${t?`<p>${esc(t.name)} — with ${t.members.filter(x=>x!==m.id).map(x=>esc(mById(x).name)).join(' and ')}. ${t.checkins.length} check-in${t.checkins.length===1?'':'s'} recorded, last ${t.checkins.length?esc(t.checkins[t.checkins.length-1]):'never'}.</p>`:`<p>You are not in a triad. That is the first gap to close.</p>`}
      <button class="b ghost sm" data-go="triads" data-goid="${t?t.id:''}" type="button">Open triad</button></div>
    <div class="card"><h3>Covenant review</h3>
      ${rv?`<p>Last completed ${esc(rv.period)}${rv.confirmed?', confirmed by '+esc(mById(rv.peer).name):' — <b>not yet confirmed by your triad partner</b>'}. ${Object.values(rv.scores).filter(v=>v==='Strained'||v==='Slipping').length} of 7 areas marked strained or slipping.</p>`:`<p>No covenant review on file. The seven Practical Commitments are the thing you actually reaffirm biennially — this reviews them quarterly, in your own words.</p>`}
      <button class="b ghost sm" data-go="covenant" type="button">Open review</button></div>
    ${mine.length?`<div class="card"><h3>Open concern${mine.length===1?'':'s'}</h3>${mine.map(c=>`<p><b>${esc(c.id)}</b> — ${esc(c.category)}, at "${esc(STAGES[stageIdx(c.stage)].t)}". You have the full set of rights attaching to the person charged, and you may invite one credentialed minister to be present with you for personal support. <span class="cite">S31 I.B.5</span></p>`).join('')}<button class="b ghost sm" data-go="concerns" data-goid="${mine[0].id}" type="button">Open</button></div>`:''}
    ${churchOfPastor(m.id)?`<div class="card"><h3>The church you pastor</h3>
      <p>${esc(churchOfPastor(m.id).name)} — ${esc(chLadder(churchOfPastor(m.id)).t.toLowerCase())} on its own monthly report. That obligation belongs to the congregation and its treasurer, not to you personally — but your eligibility for election or appointment depends on <em>both</em> being current. <span class="cite">S29 I.9</span></p>
      <button class="b ghost sm" data-go="gochurch" data-goid="${churchOfPastor(m.id).id}" type="button">Open the church record</button></div>`:''}
    ${rt?`<div class="card"><h3>Restoration track ${esc(rt.id)}</h3><p>${esc(RCLASS[rt.rclass].t)} · entered ${esc(rt.enteredOn)} · month ${monthsBetween(rt.enteredOn,S.period)} of a minimum ${RCLASS[rt.rclass].months}.</p><button class="b ghost sm" data-go="restoration" data-goid="${rt.id}" type="button">Open track</button></div>`:''}
  </div>`;
  wireGo(el);
}

/* ── Standing ──────────────────────────────────────────────────────────── */
function vStanding(el){
  el.innerHTML = `
  <h2 class="dh">Standing</h2>
  <p class="sub">One row per credentialed minister in the region. "Behind" counts unfiled monthly reports, which is the single obligation that quietly ends more credentials than any moral failure does — a licence becomes subject to revocation at four months. <span class="cite">S28 III</span></p>
  <div class="tw"><table>
    <thead><tr><th>Minister</th><th>Rank</th><th>Charge</th><th>Last report</th><th>Behind</th><th>Reporting</th><th>Reaffirmed</th><th>Background</th><th>Triad</th></tr></thead>
    <tbody>${S.ministers.map(m=>{
      const f=reportFlag(m), r=reaffFlag(m), b=bgFlag(m), d=delinquency(m);
      return `<tr class="click" data-m="${m.id}">
        <td class="nm">${esc(m.name)}${m.status!=='active'?` <span class="chip warn">${esc(m.status)}</span>`:''}</td>
        <td>${esc(m.rank)}</td><td>${esc(m.church)}</td>
        <td>${pLabel(m.lastReport)}</td>
        <td style="font-variant-numeric:tabular-nums">${d===null?'—':d}</td>
        <td><span class="chip ${f.cls}">${esc(f.label)}</span></td>
        <td><span class="chip ${r.cls}">${esc(r.label)}</span></td>
        <td><span class="chip ${b.cls}">${esc(b.label)}</span></td>
        <td>${m.triad?esc(m.triad):'<span class="chip bad">none</span>'}</td></tr>`;
    }).join('')}</tbody></table></div>
  <p class="shead">The reporting ladder, as written</p>
  <div class="grid g4">
    <div class="card"><h3>0–1 months</h3><p>Current. Reports go to state and International headquarters on the first of each month.</p><p><span class="cite">S28 I</span></p></div>
    <div class="card"><h3>2 months</h3><p>Watch. Nothing is required yet — which is exactly why the network surfaces it now rather than next month.</p><p><span class="prac">network practice</span></p></div>
    <div class="card"><h3>3 months</h3><p>The state overseer <b>shall urgently admonish</b> the minister to bring reports up to date.</p><p><span class="cite">S28 III.1</span></p></div>
    <div class="card"><h3>4 months</h3><p>Written notice that the licence is <b>subject to revocation</b>, after due disciplinary process.</p><p><span class="cite">S28 III.2</span></p></div>
  </div>`;
  el.querySelectorAll('tr.click').forEach(tr=>tr.onclick=()=>openMinister(tr.dataset.m));
}

function openMinister(id){
  const m = mById(id), f=reportFlag(m), r=reaffFlag(m), b=bgFlag(m), t=triadOf(id), rv=lastReview(id), rt=restorationOf(id);
  const cs = S.concerns.filter(c=>c.subject===id);
  drawer(`<div><div style="font-family:var(--display);font-size:21px">${esc(m.name)}</div>
    <div style="font-size:12.5px;color:var(--ink-soft)">${esc(m.rank)} · ${esc(m.church)}</div></div>`, `
    <dl class="kv">
      <dt>District</dt><dd>${esc(m.district)}</dd>
      <dt>Status</dt><dd>${esc(m.status)}</dd>
      <dt>Last report</dt><dd>${pLabel(m.lastReport)} — <span class="chip ${f.cls}">${esc(f.label)}</span></dd>
      <dt>Reaffirmed</dt><dd><span class="chip ${r.cls}">${esc(r.label)}</span> <span class="cite">S29 I.9</span></dd>
      <dt>Background</dt><dd><span class="chip ${b.cls}">${esc(b.label)}</span> <span class="cite">S29 I.11</span></dd>
      <dt>Triad</dt><dd>${t?esc(t.name):'—'}</dd>
      <dt>Last review</dt><dd>${rv?esc(rv.period)+(rv.confirmed?' (confirmed)':' (unconfirmed)'):'none on file'}</dd>
    </dl>
    ${f.action?`<div class="warnbox" style="margin-top:var(--s4)"><b>Required.</b> ${esc(f.action)} <span class="cite">${esc(f.cite)}</span></div>`:''}
    ${rt?`<hr class="sep"><p class="shead" style="margin-top:0">Restoration</p><p style="font-size:13.5px;color:var(--ink-soft)">${esc(RCLASS[rt.rclass].t)} — month ${monthsBetween(rt.enteredOn,S.period)} of minimum ${RCLASS[rt.rclass].months}.</p>`:''}
    ${cs.length?`<hr class="sep"><p class="shead" style="margin-top:0">Concerns on record</p>
      ${cs.map(c=>`<p style="font-size:13.5px;color:var(--ink-soft)"><b>${esc(c.id)}</b> — ${esc(c.category)} · ${c.closed?'closed':'at '+esc(STAGES[stageIdx(c.stage)].t)}</p>`).join('')}
      <p class="note">The disciplinary record of a minister is cumulative, and the whole record is considered in any disciplinary action. <span class="cite">S30 V.1</span></p>`:''}
    <hr class="sep">
    <div class="row">
      <button class="b sm" id="dFile" type="button">File this month's report</button>
      <button class="b ghost sm" id="dReaff" type="button">Record reaffirmation</button>
      <button class="b quiet sm" id="dView" type="button">Open their intranet</button>
    </div>`);
  document.getElementById('dView').onclick = ()=>goMinister(id);
  document.getElementById('dFile').onclick = ()=>{ fileReport(id, S.period); closeDrawer(); render(); };
  document.getElementById('dReaff').onclick = ()=>{ m.reaffirmed = S.period; save(); closeDrawer(); render(); };
}

/* ── Monthly report ────────────────────────────────────────────────────── */
function fileReport(id, period){
  const m = mById(id);
  if(!m.reports) m.reports=[];
  const prev = pIdx(m.lastReport||'2000-01');
  // filing catches the record up to the filed period
  if(pIdx(period) > prev) m.lastReport = period;
  m.reports.push({period, filed:S.period});
  save();
}
function vReport(el){
  const m = view.role==='minister' ? mById(view.who) : mById(view.who);
  const f = reportFlag(m);
  const missing = [];
  if(m.lastReport){ for(let i=pIdx(m.lastReport)+1;i<pIdx(S.period);i++){ const y=Math.floor(i/12),mm=i%12+1; missing.push(y+'-'+String(mm).padStart(2,'0')); } }
  el.innerHTML = `
  <h2 class="dh">Monthly ministerial report</h2>
  <p class="sub">The report is the heartbeat of the whole system: it is what keeps a credential in good standing, what makes a minister eligible for election or appointment, and what the escalation ladder counts. Reports go to state and International headquarters on the first of each month. <span class="cite">S28 I</span> <span class="cite">S29 I.9</span></p>
  <div class="ctx" style="margin:0 0 var(--s4)">
    <div><label class="f" for="rWho">Filing for</label><select id="rWho">${S.ministers.map(x=>`<option value="${x.id}" ${x.id===m.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div>
    <div><label class="f" for="rPeriod">Period</label><select id="rPeriod">${periods(14).map(p=>`<option value="${p}" ${p===(missing[0]||S.period)?'selected':''}>${pLabel(p)}</option>`).join('')}</select></div>
  </div>
  <div class="grid g2">
    <div class="card">
      <h3>Standing right now</h3>
      <p><span class="chip ${f.cls}">${esc(f.label)}</span> — last report ${pLabel(m.lastReport)}.</p>
      ${missing.length?`<p><b>Unfiled periods:</b> ${missing.map(pLabel).join(', ')}.</p>`:`<p>Nothing outstanding.</p>`}
      ${f.action?`<div class="warnbox">${esc(f.action)} <span class="cite">${esc(f.cite)}</span></div>`:''}
    </div>
    <div class="card">
      <h3>This period</h3>
      <div class="field"><label class="f" for="rServ">Services / preaching engagements</label><input id="rServ" type="number" min="0" value="8" style="width:100%"></div>
      <div class="field"><label class="f" for="rConv">Conversions</label><input id="rConv" type="number" min="0" value="2" style="width:100%"></div>
      <div class="field"><label class="f" for="rBap">Baptisms</label><input id="rBap" type="number" min="0" value="0" style="width:100%"></div>
      <label class="cb"><input type="checkbox" id="rTithe" checked> Tithe of tithes remitted for the period</label>
      <div class="field"><label class="f" for="rNote">Notes to the administrative bishop</label><textarea id="rNote" placeholder="Anything the office should know before it becomes a surprise."></textarea></div>
      <button class="b" id="rFile" type="button">File report</button>
    </div>
  </div>
  <p class="shead">Why this one obligation carries so much weight</p>
  <div class="grid g3">
    <div class="card"><h3>It gates eligibility</h3><p>A minister must be current on personal reports — and on local church reports with required finances where they pastor — to be eligible for election or appointment at international or state level.</p><p><span class="cite">S29 I.9</span></p></div>
    <div class="card"><h3>It carries the reaffirmation</h3><p>The biennial affirmation of fidelity to the Declaration of Faith, Doctrinal Commitments and Practical Commitments is submitted <em>with the September report</em>. Miss the report, miss the affirmation.</p><p><span class="cite">S29 I.9</span></p></div>
    <div class="card"><h3>Inactivity itself is a cause</h3><p>Ministers not reporting, or not actively engaged in ministerial work, for as much as six months — where that is not caused by illness or age — have historically had their ministry revoked.</p><p><span class="cite">S30 V.10</span></p></div>
  </div>`;
  document.getElementById('rWho').onchange = e=>{ view.who=e.target.value; render(); };
  document.getElementById('rFile').onclick = ()=>{
    fileReport(document.getElementById('rWho').value, document.getElementById('rPeriod').value);
    render();
  };
}

/* ── Covenant review ───────────────────────────────────────────────────── */
function vCovenant(el){
  const m = mById(view.who);
  const existing = lastReview(m.id);
  const draft = (vCovenant._d && vCovenant._d.who===m.id) ? vCovenant._d : (vCovenant._d = {who:m.id, scores:{}, note:''});
  el.innerHTML = `
  <h2 class="dh">Covenant review — the seven Practical Commitments</h2>
  <p class="sub">Every credentialed minister reaffirms fidelity to the Practical Commitments once every two years, in a single signature. This reviews the same seven areas every quarter, in the minister's own words, and asks a triad partner to confirm it. The headings and the aim of each commitment are the church's; the ratings and the cadence are the network's. <span class="cite">Practical Commitments I–VII</span> <span class="prac">quarterly cadence: network practice</span></p>
  <div class="ctx" style="margin:0 0 var(--s4)"><div><label class="f" for="cWho">Reviewing</label>
    <select id="cWho">${S.ministers.map(x=>`<option value="${x.id}" ${x.id===m.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></div></div>
  ${existing?`<div class="note" style="margin-bottom:var(--s4)"><b>Last review ${esc(existing.period)}.</b> ${existing.confirmed?'Confirmed by '+esc(mById(existing.peer).name)+'.':'Recorded but <b>not yet confirmed</b> by '+esc(mById(existing.peer).name)+' — an unconfirmed self-assessment is a diary entry, not accountability.'} ${existing.note?'“'+esc(existing.note)+'”':''}</div>`:''}
  <div class="grid" style="gap:var(--s2)">
    ${COMMITMENTS.map(c=>{
      const cur = draft.scores[c.k] || (existing && existing.scores[c.k]) || '';
      return `<div class="cmt">
        <h4><var>${c.n}</var> ${esc(c.t)}</h4>
        <p>${esc(c.aim)}</p>
        <div class="rate" data-k="${c.k}">${RATINGS.map(r=>`<button type="button" data-r="${r}" aria-pressed="${cur===r}">${r}</button>`).join('')}</div>
      </div>`;
    }).join('')}
  </div>
  <div class="card" style="margin-top:var(--s4)">
    <h3>The part that matters</h3>
    <div class="field"><label class="f" for="cNote">Where is the strain, and what are you doing about it?</label>
      <textarea id="cNote" placeholder="Specific. Datable. Something a triad partner could ask you about in six weeks.">${esc(draft.note)}</textarea></div>
    <div class="field"><label class="f" for="cPeer">Triad partner who will confirm this</label>
      <select id="cPeer">${(triadOf(m.id)?triadOf(m.id).members.filter(x=>x!==m.id):S.ministers.map(x=>x.id)).map(x=>`<option value="${x}">${esc(mById(x).name)}</option>`).join('')}</select></div>
    <button class="b" id="cSave" type="button">Record review</button>
  </div>`;
  document.getElementById('cWho').onchange = e=>{ view.who=e.target.value; vCovenant._d=null; render(); };
  el.querySelectorAll('.rate').forEach(r=>r.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    draft.scores[r.dataset.k]=b.dataset.r; draft.note=document.getElementById('cNote').value; render();
  }));
  document.getElementById('cSave').onclick = ()=>{
    const q = 'Q'+(Math.floor((pIdx(S.period)%12)/3)+1);
    S.reviews.push({id:'r'+Date.now(), minister:m.id, period:S.period.slice(0,4)+' '+q,
      scores:Object.assign({}, existing?existing.scores:{}, draft.scores),
      note:document.getElementById('cNote').value, peer:document.getElementById('cPeer').value, confirmed:false});
    vCovenant._d=null; render();
  };
}

/* ── Triads ────────────────────────────────────────────────────────────── */
function vTriads(el){
  el.innerHTML = `
  <h2 class="dh">Accountability triads</h2>
  <p class="sub">Three ministers, meeting weekly, asking each other five questions no report form asks. This is the network's own addition — but it sits directly on the church's stated commitment to interdependence: involving clergy in mentoring, coaching and consulting across every level "to increase the level of trust and support among ministers", and on the instruction to bear one another's burdens. <span class="cite">Commitment 7 — Interdependence</span> <span class="cite">Galatians 6:2</span></p>
  <div class="grid g2">
    ${S.triads.map(t=>{
      const stale = !t.checkins.length;
      return `<div class="card">
        <h3>${esc(t.name)} ${t.members.length<3?'<span class="chip bad">below three</span>':''}</h3>
        <p>${t.members.map(x=>esc(mById(x).name)).join(' · ')}</p>
        <p><span class="chip ${stale?'bad':'ok'}">${t.checkins.length} check-in${t.checkins.length===1?'':'s'}</span>
           ${t.checkins.length?`<span class="chip">last ${esc(t.checkins[t.checkins.length-1])}</span>`:''}</p>
        <button class="b ghost sm" data-ci="${t.id}" type="button">Record check-in</button>
      </div>`;
    }).join('')}
  </div>
  <p class="shead">The five questions</p>
  <div class="card">
    <ul class="ck">${TRIAD_Q.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>
    <p style="margin-top:var(--s3)">Then, always last, and asked of the one who asked all the others: <b>“In anything you have just told us, have you lied to us?”</b></p>
  </div>
  <div class="note" style="margin-top:var(--s4)"><b>What a triad is not.</b> It is not a disciplinary body, it has no standing to receive a charge, and nothing said in it is a substitute for the Matthew 18 pathway or for mandatory reporting. If something disclosed in a triad is a crime or a safeguarding matter, it leaves the triad the same day.</div>`;
  el.querySelectorAll('[data-ci]').forEach(b=>b.onclick=()=>{
    const t = S.triads.find(x=>x.id===b.dataset.ci);
    const d = new Date(); const iso = S.period+'-'+String(d.getDate()).padStart(2,'0');
    t.checkins.push(iso); render();
  });
}

/* ── Concerns ──────────────────────────────────────────────────────────── */
function vConcerns(el){
  if(view.role==='church') return vConcernsChurch(el);
  const mine = view.role==='minister';
  const cases = mine ? S.concerns.filter(c=>c.subject===view.who) : S.concerns;
  el.innerHTML = `
  <h2 class="dh">Concern pathway</h2>
  <p class="sub">Ordered, one step at a time, from a private conversation to an appeal — because the governing text orders it that way, and because a system that lets someone jump straight to a charge turns every disagreement into a trial. A charge cannot be raised here until the private approach is on the record.${mine?' You see only what names you; the rest of the region\'s cases are not yours to read.':''}</p>
  <div class="warnbox" style="margin-bottom:var(--s4)"><b>This pathway is not for suspected crime.</b> Allegations of child sexual abuse or sexual exploitation of a minor, or any suspected felonious act, go immediately to civil authorities under applicable mandatory-reporting law. A minister's professional confidentiality does not preempt reporting law and may not be used to conceal a felonious act. Confession to, or conviction of, sexual abuse of a child carries permanent revocation of membership and credentials. <span class="cite">S29 I.8</span> <span class="cite">S30 III.A.5</span></div>

  <p class="shead">${mine?'Concerns naming you':'Open and recent concerns'}</p>
  ${mine&&!cases.length?'<div class="note">Nothing on record naming you. You would be notified of a charge in writing, with the name of the person bringing it, before anything proceeded — that is your right, not a courtesy. <span class="cite">S31 I.B.5.b</span></div>':''}
  <div class="grid g2">${cases.map(c=>{
    const i = stageIdx(c.stage);
    return `<div class="card">
      <h3>${esc(c.id)} — ${esc(mById(c.subject).name)} ${c.closed?'<span class="chip ok">closed</span>':`<span class="chip warn">step ${i+1} of 9</span>`}</h3>
      <p>${esc(c.category)}</p>
      <p style="font-size:12.5px">Raised by ${esc(c.by)} · opened ${esc(c.opened)}</p>
      <button class="b ghost sm" data-c="${c.id}" type="button">Open pathway</button>
    </div>`;}).join('')}
    <div class="card"><h3>Raise a new concern</h3>
      <div class="field"><label class="f" for="nSub">About</label><select id="nSub">${S.ministers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>
      <div class="field"><label class="f" for="nCat">Nature of the concern</label><input id="nCat" style="width:100%" placeholder="e.g. leadership accountability, doctrinal fidelity, personal integrity"></div>
      <label class="cb"><input type="checkbox" id="nPriv"> I have already gone directly and privately to this minister <span class="cite">Matthew 18:15</span></label>
      <button class="b" id="nGo" type="button">Open concern at step one</button>
      <p style="margin-top:var(--s2);font-size:12.5px">Opening a concern records the private approach as step one. Nothing escalates automatically — every step forward is a deliberate act by a named person.</p>
    </div>
  </div>`;
  el.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>openConcern(b.dataset.c));
  document.getElementById('nGo').onclick = ()=>{
    if(!document.getElementById('nPriv').checked){ alert('The private approach comes first. Make it, then record the concern here.'); return; }
    const id = 'C-'+(101+S.concerns.length);
    S.concerns.push({id, subject:document.getElementById('nSub').value, by:'(recorded by the office)',
      category:document.getElementById('nCat').value||'Unspecified', opened:S.period+'-01', stage:'private',
      log:[{d:S.period+'-01',t:'Concern opened. Private approach recorded as made.'}], guards:{}, closed:false});
    render(); openConcern(id);
  };
  if(view.goid){ const g=view.goid; view.goid=null; if(S.concerns.some(c=>c.id===g)) openConcern(g); }
}

function openConcern(id){
  const c = S.concerns.find(x=>x.id===id); if(!c) return;
  const cur = stageIdx(c.stage);
  drawer(`<div><div style="font-family:var(--display);font-size:21px">${esc(c.id)}</div>
    <div style="font-size:12.5px;color:var(--ink-soft)">${esc(mById(c.subject).name)} · ${esc(c.category)}</div></div>`, `
    <div class="steps">${STAGES.map((s,i)=>`
      <div class="step ${i<cur?'done':i===cur?'now':'pend'}">
        <div class="dot"><i>${i+1}</i><u></u></div>
        <div class="body"><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p><span class="cite">${esc(s.cite)}</span></div>
      </div>`).join('')}
    </div>
    ${c.stage==='board'||c.stage==='hearing'?`
      <hr class="sep"><p class="shead" style="margin-top:0">Guardrails to confirm before proceeding</p>
      <ul class="ck">
        <li>Board is <b>not fewer than three ordained bishops</b>; where prudent, not fewer than two ordained female ministers with 7+ years of credentialed service <span class="cite">S31 I.B.2.c</span></li>
        <li>Conflicts of interest declared — relatives, those who have taken sides, anyone whose involvement would cast a shadow on the fairness of the process <span class="cite">S31 I.B.2.d–g</span></li>
        <li>Defendant notified of charges, time and place <b>at least seven days</b> beforehand, by certified mail where possible <span class="cite">S31 I.B.3</span></li>
        <li>Secretary of record appointed; witness lists exchanged in advance <span class="cite">S31 I.B.6.a–b</span></li>
        <li>Each party may invite one credentialed minister for personal support only. Alleged victims and witnesses in abuse matters have the same option. No legal counsel present. <span class="cite">S31 I</span></li>
        <li>No defendant avoids trial by confessing to a lesser charge <span class="cite">S31 I.B.5.i</span></li>
      </ul>`:''}
    <hr class="sep">
    <p class="shead" style="margin-top:0">Rights held by both parties</p>
    <div class="grid" style="gap:var(--s2)">
      <div class="card"><h3 style="font-size:14px">The one bringing the charge</h3><ul class="ck tick">
        <li>Fair and courteous treatment</li><li>To be instructed in every procedure</li>
        <li>To produce witnesses, corroborating testimony and evidence</li>
        <li>Notification of the trial, the procedures and the right of appeal</li>
        <li>To appeal any conflict of interest</li>
        <li>To be heard, to face the one charged, and to face those hearing the charge</li></ul>
        <p style="margin-top:var(--s2)"><span class="cite">S31 I.B.4</span></p></div>
      <div class="card"><h3 style="font-size:14px">The one charged</h3><ul class="ck tick">
        <li>Presumed innocent until proven guilty</li>
        <li>To know the charge and who brought it, in writing</li>
        <li>Fair and courteous treatment, and instruction in every procedure</li>
        <li>To plead, to refute, to produce witnesses and evidence</li>
        <li>To face the accuser and to be present while evidence is heard</li>
        <li>To appeal any conflict of interest</li></ul>
        <p style="margin-top:var(--s2)"><span class="cite">S31 I.B.5</span></p></div>
    </div>
    <hr class="sep">
    <p class="shead" style="margin-top:0">Record</p>
    <div class="log">${c.log.map(l=>`<div><b>${esc(l.d)}</b> — ${esc(l.t)}</div>`).join('')}</div>
    ${c.closed?'':`
    <hr class="sep">
    <div class="field"><label class="f" for="cxNote">What happened at this step?</label><textarea id="cxNote" placeholder="Dated, factual, in the words of the person recording it."></textarea></div>
    <div class="row">
      <button class="b sm" id="cxAdv" type="button">Record and advance to “${esc(STAGES[Math.min(cur+1,STAGES.length-1)].t)}”</button>
      <button class="b quiet sm" id="cxHold" type="button">Record without advancing</button>
      <button class="b ghost sm" id="cxClose" type="button">Resolve and close</button>
    </div>
    <p style="margin-top:var(--s3);font-size:12.5px;color:var(--ink-faint)">Advancing from step two to step three means a charge is being put in writing and signed. From that point the record is permanent and is filed at both state and International offices. <span class="cite">S31 I.B.7.b</span></p>`}`);
  if(c.closed) return;
  const note = ()=>document.getElementById('cxNote').value.trim();
  document.getElementById('cxHold').onclick = ()=>{ if(!note()) return; c.log.push({d:S.period+'-15',t:note()}); closeDrawer(); render(); };
  document.getElementById('cxAdv').onclick = ()=>{
    c.log.push({d:S.period+'-15',t:note()||('Advanced to '+STAGES[Math.min(cur+1,STAGES.length-1)].t+'.')});
    c.stage = STAGES[Math.min(cur+1,STAGES.length-1)].k;
    if(c.stage==='charge'){ c.guards.written=true; c.guards.signed=true; }
    if(c.stage==='closed') c.closed=true;
    closeDrawer(); render();
  };
  document.getElementById('cxClose').onclick = ()=>{
    c.log.push({d:S.period+'-15',t:note()||'Resolved and closed. The church confirms its love for the parties and comforts them.'});
    c.stage='closed'; c.closed=true; closeDrawer(); render();
  };
}

/* The congregation's view of the concern routes — guidance, never a case list.
   A church's officers do not hold, open or read ministerial discipline files. */
function vConcernsChurch(el){
  const ch = chById(view.church);
  el.innerHTML = `
  <h2 class="dh">Raising a concern</h2>
  <p class="sub">There are two different routes, and using the wrong one is the most common way a legitimate concern gets nowhere. ${esc(ch.name)} holds no ministerial discipline record — no case files appear on this surface, and its officers cannot open a charge on a member's behalf. What follows is the map.</p>

  <div class="warnbox" style="margin-bottom:var(--s4)"><b>Neither route is for suspected crime.</b> Allegations of child sexual abuse or sexual exploitation of a minor, or any suspected felonious act, go immediately to civil authorities under applicable mandatory-reporting law. A minister's professional confidentiality does not preempt reporting law and may not be used to conceal a felonious act. <span class="cite">S29 I.8</span></div>

  <div class="grid g2">
    <div class="card"><h3>A concern about the welfare of this church</h3>
      <p>Loyal, tithing members have the right and privilege to contact the state overseer about a legitimate concern relating to the welfare of their church — <b>after</b> contacting their pastor and their district overseer, in that order.</p>
      <ul class="ck">
        <li>Speak to the pastor first</li>
        <li>Then the district overseer</li>
        <li>Then the state overseer</li>
        <li>Preferably in writing, <b>not as part of a petition</b></li>
        <li>Concerns are communicated back to the pastor and district overseer <em>with the names of those raising them</em></li>
      </ul>
      <p style="margin-top:var(--s2)"><span class="cite">S51 III</span></p>
      <p style="font-size:12.5px;color:var(--ink-faint)">A named letter from three members carries further here than a hundred anonymous signatures. That is a deliberate feature of the text, not an oversight.</p></div>

    <div class="card"><h3>A concern about a minister's conduct</h3>
      <p>A different route entirely, and it starts with a conversation rather than a form.</p>
      <div class="steps" style="margin-top:var(--s2)">${STAGES.slice(0,4).map((st,i)=>`
        <div class="step pend"><div class="dot"><i>${i+1}</i><u></u></div>
        <div class="body"><h4>${esc(st.t)}</h4><p>${esc(st.d)}</p><span class="cite">${esc(st.cite)}</span></div></div>`).join('')}</div>
      <p>From there it may reach a trial board, a decision filed at state and international offices, and a ten-day appeal. Every one of those steps has named rights attached for both the person charged and the person bringing the charge.</p>
      <p><span class="cite">S31</span></p></div>

    <div class="card"><h3>What this congregation does hold</h3>
      <p>Its own reporting record, its own funds position, its governance offices, and its twelve-month progress. Nothing about any minister's personal standing, covenant review, triad or disciplinary history is visible here — including its own pastor's.</p>
      <p><button class="b ghost sm" data-go="churchhome" type="button">Our church</button> <button class="b ghost sm" data-go="governance" type="button">Governance</button></p></div>

    <div class="card"><h3>Pastoral preference is not a concern channel</h3>
      <p>The appointment of a pastor is vested in the state overseer. Members are given an opportunity to express a preference, and the overseer may call for an expression from members aged sixteen and over where there is an apparent decline in the spiritual health of the church. The ballot requires a signature.</p>
      <p>It is a periodic, moderated instrument — not a route for an urgent concern, and not a substitute for either of the two above.</p>
      <p><span class="cite">S51 I.3–5</span></p></div>
  </div>`;
  wireGo(el);
}

/* ── Restoration ───────────────────────────────────────────────────────── */
function vRestoration(el){
  el.innerHTML = `
  <h2 class="dh">Restoration</h2>
  <p class="sub">The governing text is explicit that discipline exists for the purpose of restoration, and that a disciplined minister has the opportunity to be restored. Restoration is described there as the mending of the net — that which is torn being put back into service. It is also described as conditional: it has a team, a clock, and things that must actually be demonstrated. <span class="cite">S30 Introduction</span> <span class="cite">S30 I.B</span></p>

  <div class="grid g2">${S.restorations.map(rt=>{
    const cls = RCLASS[rt.rclass];
    const elapsed = monthsBetween(rt.enteredOn, S.period);
    const pct = Math.min(100, Math.round(elapsed/cls.months*100));
    const teamMissing = RTEAM.filter(r=>!rt.team[r.k]);
    const evidDone = REVIDENCE.filter(e=>rt.evid[e.k]).length;
    return `<div class="card">
      <h3>${esc(rt.id)} — ${esc(mById(rt.minister).name)}</h3>
      <p>${esc(cls.t)} <span class="cite">${esc(cls.cite)}</span></p>
      <p>Month <b>${elapsed}</b> of a minimum <b>${cls.months}</b> · ${pct}%</p>
      <div style="height:7px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin:var(--s2) 0"><div style="height:100%;width:${pct}%;background:var(--c)"></div></div>
      <p><span class="chip ${teamMissing.length?'bad':'ok'}">team ${RTEAM.length-teamMissing.length}/${RTEAM.length}</span>
         <span class="chip ${evidDone===3?'ok':'warn'}">evidence ${evidDone}/3</span></p>
      <button class="b ghost sm" data-rt="${rt.id}" type="button">Open track</button>
    </div>`;}).join('')}
    <div class="card"><h3>Open a restoration track</h3>
      <div class="field"><label class="f" for="rtWho">Minister</label><select id="rtWho">${S.ministers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>
      <div class="field"><label class="f" for="rtCls">Class</label><select id="rtCls">${Object.entries(RCLASS).map(([k,v])=>`<option value="${k}">${esc(v.t)} — min ${v.months} months</option>`).join('')}</select></div>
      <button class="b" id="rtGo" type="button">Open track</button>
      <p style="margin-top:var(--s2);font-size:12.5px">A track opens the three-month clock: if the minister does not voluntarily enter the programme within three months of being advised of the disciplinary action, credentials are revoked. <span class="cite">S30 IV.C.3</span></p>
    </div>
  </div>

  <p class="shead">How a track is constituted</p>
  <div class="grid g3">
    <div class="card"><h3>The team</h3><ul class="ck">${RTEAM.map(r=>`<li>${esc(r.t)}</li>`).join('')}</ul>
      <p style="margin-top:var(--s2)">Coordinated by the Center for Ministerial Care in a facilitative and consultative role; supervised by the International Executive Council. <span class="cite">S30 IV.A–B</span></p></div>
    <div class="card"><h3>The clock</h3><ul class="ck">
      <li>Up to <b>three months</b> may be allowed, on request, for emotional, vocational and family adjustments before entering — provided the limits on ministerial activity are observed</li>
      <li>Failure to enter within <b>three months</b> of being advised results in revocation</li>
      <li>Limited, supervised ministry may be permitted late in the period, at the discretion of the state overseer and council</li></ul>
      <p style="margin-top:var(--s2)"><span class="cite">S30 IV.C</span></p></div>
    <div class="card"><h3>What must be demonstrated</h3><ul class="ck">${REVIDENCE.map(e=>`<li>${esc(e.t)}</li>`).join('')}</ul>
      <p style="margin-top:var(--s2)">Evidence of healing and renewal of strength against the temptations that provoked the failure. <span class="cite">S30 IV.D</span></p></div>
  </div>

  <div class="warnbox" style="margin-top:var(--s4)"><b>Where restoration does not apply.</b> Some findings carry permanent revocation and, in the case of abuse of a child, permanent revocation of membership as well, together with a prohibition on any involvement with churches the victims attend or have attended. The network will not open a restoration track for those classes. <span class="cite">S30 III.A.4–5</span> <span class="cite">S30 V.9</span></div>`;
  el.querySelectorAll('[data-rt]').forEach(b=>b.onclick=()=>openTrack(b.dataset.rt));
  document.getElementById('rtGo').onclick = ()=>{
    const id = 'RT-'+String(S.restorations.length+1).padStart(2,'0');
    S.restorations.push({id, minister:document.getElementById('rtWho').value, rclass:document.getElementById('rtCls').value,
      suspendedOn:S.period+'-01', enteredOn:S.period+'-01', team:{}, evid:{},
      log:[{d:S.period+'-01',t:'Track opened. Three-month window to enter the programme begins.'}]});
    const m = mById(S.restorations[S.restorations.length-1].minister); m.status='restoration';
    render(); openTrack(id);
  };
  if(view.goid){ const g=view.goid; view.goid=null; if(S.restorations.some(r=>r.id===g)) openTrack(g); }
}

function openTrack(id){
  const rt = S.restorations.find(x=>x.id===id); if(!rt) return;
  const cls = RCLASS[rt.rclass];
  drawer(`<div><div style="font-family:var(--display);font-size:21px">${esc(rt.id)}</div>
    <div style="font-size:12.5px;color:var(--ink-soft)">${esc(mById(rt.minister).name)} · ${esc(cls.t)}</div></div>`, `
    <p class="note">${esc(cls.note)} <span class="cite">${esc(cls.cite)}</span></p>
    <p class="shead">Ministry team <span class="cite">S30 IV.A</span></p>
    ${RTEAM.map(r=>`<div class="field"><label class="f" for="tm_${r.k}">${esc(r.t)}</label>
      <input id="tm_${r.k}" style="width:100%" value="${esc(rt.team[r.k]||'')}" placeholder="Name / office"></div>`).join('')}
    <p class="shead">Evidence of healing and renewal <span class="cite">S30 IV.D</span></p>
    ${REVIDENCE.map(e=>`<label class="cb ${rt.evid[e.k]?'on':''}"><input type="checkbox" data-ev="${e.k}" ${rt.evid[e.k]?'checked':''}> ${esc(e.t)}</label>`).join('')}
    <p class="shead">Record</p>
    <div class="log">${rt.log.map(l=>`<div><b>${esc(l.d)}</b> — ${esc(l.t)}</div>`).join('')}</div>
    <div class="field" style="margin-top:var(--s4)"><label class="f" for="tNote">Add to the record</label><textarea id="tNote"></textarea></div>
    <div class="row"><button class="b sm" id="tSave" type="button">Save track</button></div>
    <p style="margin-top:var(--s3);font-size:12.5px;color:var(--ink-faint)">At the conclusion of the period, on successful completion and with the recommendation of the state overseer, reinstatement and the level of credential are decided by the International Executive Council. This tool records progress; it does not reinstate anyone. <span class="cite">S30 III.A.3</span></p>`);
  document.getElementById('tSave').onclick = ()=>{
    RTEAM.forEach(r=>{ rt.team[r.k] = document.getElementById('tm_'+r.k).value.trim(); });
    document.querySelectorAll('[data-ev]').forEach(cb=>{ rt.evid[cb.dataset.ev]=cb.checked; });
    const n = document.getElementById('tNote').value.trim();
    if(n) rt.log.push({d:S.period+'-15',t:n});
    closeDrawer(); render();
  };
}

/* ── Safeguarding ──────────────────────────────────────────────────────── */
function vSafeguard(el){
  const gaps = S.ministers.filter(m=>!bgFlag(m).ok);
  el.innerHTML = `
  <h2 class="dh">Safeguarding</h2>
  <p class="sub">The parts of the polity that are not negotiable, not restorable, and not subject to a pastoral judgement call — plus the one check that is easy to skip and impossible to defend having skipped.</p>

  <div class="warnbox"><b>Reporting overrides confidence.</b> No minister is required to violate a confidence entrusted in the course of their duties — except with the express permission of the person who confided, or in order to prevent a crime. That provision does not preempt any applicable reporting law, and may not be used to conceal a felonious act toward another individual. <span class="cite">S29 I.8</span></div>

  <p class="shead">Background checks <span class="cite">S29 I.11</span></p>
  <p class="sub">Any person placed, appointed or hired for a ministry position in a local congregation should have a criminal background check. ${gaps.length?`<b>${gaps.length} in this region do not have a current one on file.</b>`:'All current.'}</p>
  <div class="tw"><table><thead><tr><th>Minister</th><th>Charge</th><th>On file</th><th>Status</th><th>Basis</th></tr></thead><tbody>
    ${S.ministers.map(m=>{ const b=bgFlag(m); return `<tr><td class="nm">${esc(m.name)}</td><td>${esc(m.church)}</td>
      <td>${m.bgCheck?pLabel(m.bgCheck):'—'}</td><td><span class="chip ${b.cls}">${esc(b.label)}</span></td>
      <td>${b.why==='practice'?'<span class="prac">5-yr renewal — network practice</span>':'<span class="cite">S29 I.11</span>'}</td></tr>`;}).join('')}
  </tbody></table></div>

  <p class="shead">Permanent outcomes</p>
  <div class="grid g2">
    <div class="card"><h3>Sexual abuse or exploitation of a minor</h3>
      <p>Confession to, or conviction of, sexual abuse of a child or sexual exploitation of a minor carries permanent revocation of both membership and credentials.</p>
      <p>Where a minister has been found guilty of the sexual abuse of a child, the guilty party is prohibited from attending, participating in, or having any involvement with any activities of the local church or churches the victims presently attend or have attended.</p>
      <p><span class="cite">S30 III.A.5</span> <span class="cite">S30 V.9</span></p></div>
    <div class="card"><h3>Second sexual offence</h3>
      <p>A second offence involving adultery, fornication or any other sexual misconduct — or any combination of these — carries permanent revocation of credentials and disfellowshipping from the church, with reconciliation and restoration <em>to church membership</em> considered in appropriate cases in future.</p>
      <p><span class="cite">S30 III.A.4</span></p></div>
    <div class="card"><h3>Resignation does not evade a charge</h3>
      <p>Ministers who resign to evade charges instituted, or being instituted, against them as a result of alleged offending conduct are considered guilty. A resignation in the middle of an open concern is therefore recorded, not accepted as a closure.</p>
      <p><span class="cite">S30 V.4</span></p></div>
    <div class="card"><h3>The record is cumulative</h3>
      <p>The disciplinary record of every minister is cumulative and the entire record is considered in all disciplinary actions. Where a minister engaged in ministerial activity is not credentialed at all, the same suspension and revocation policies apply.</p>
      <p><span class="cite">S30 V.1–2</span></p></div>
  </div>

  <p class="shead">Standing checks this network runs on every minister, every month</p>
  <div class="card"><ul class="ck">
    <li><b>Reporting</b> — unfiled periods counted, ladder applied at 3 and 4 months <span class="cite">S28 III</span></li>
    <li><b>Doctrinal reaffirmation</b> — biennial, with the September report <span class="cite">S29 I.9</span></li>
    <li><b>Background check</b> — present, and under five years old <span class="cite">S29 I.11</span> <span class="prac">age: network practice</span></li>
    <li><b>Triad membership</b> — every minister in a group of three <span class="prac">network practice</span></li>
    <li><b>Covenant review</b> — quarterly, confirmed by a peer <span class="prac">network practice</span></li>
    <li><b>Open concerns</b> — stage, age, and whether the guardrails for that stage have been confirmed <span class="cite">S31</span></li>
    <li><b>Restoration tracks</b> — team complete, clock running, evidence demonstrated <span class="cite">S30 IV</span></li>
  </ul></div>`;
}

/* ── Sources ───────────────────────────────────────────────────────────── */
function vSources(el){
  el.innerHTML = `
  <h2 class="dh">Where every rule in this system comes from</h2>
  <p class="sub">Two documents were the input: the Church of God <i>Ordained Minister — Ministerial Licensure Study Guide</i> (2025), which carries the <i>Book of Church Order, Governance, and Discipline</i>, the <i>Declaration of Faith</i> and the <i>Practical Commitments</i> in full; and the <i>Exhorter</i> study material for the first of the three credential ranks. Mending Net implements process from those documents. It does not reproduce them.</p>

  <div class="tw"><table><thead><tr><th>What the network does</th><th>Authority</th><th>Kind</th></tr></thead><tbody>
    ${[
      ['Counts unfiled monthly reports; escalates at 3 months (urgent admonition) and 4 months (licence subject to revocation)','S28 — Ministerial Reporting, III','polity'],
      ['Gates eligibility for election or appointment on being current with personal and church reports','S29 — Instructions for Ministers, I.9','polity'],
      ['Tracks the biennial reaffirmation of the Declaration of Faith, Doctrinal Commitments and Practical Commitments, filed with the September report','S29 I.9','polity'],
      ['Requires a criminal background check for anyone in a ministry position','S29 I.11','polity'],
      ['Holds confidentiality subordinate to mandatory reporting; never lets it conceal a felonious act','S29 I.8','polity'],
      ['Orders the concern pathway private → with witnesses → written and signed charge','Matthew 18:15–17 · S31 I.B.1','polity'],
      ['Puts the burden of proof on the one bringing the charge, and refutation on the one charged','S31 I.B.1.a–b','polity'],
      ['Arranges a moderated face-to-face meeting before any formal trial','S31 I.B.1','polity'],
      ['Composes and conflict-checks the trial board; enforces 7 days notice and a secretary of record','S31 I.B.2–3, I.B.6','polity'],
      ["Publishes both parties' rights, and the support-minister / no-legal-counsel rule",'S31 I, I.B.4–5','polity'],
      ['Runs the 10-day appeal window and its four grounds','S31 II','polity'],
      ['Classifies discipline and applies minimum periods of 24 and 12 months','S30 III.A–C','polity'],
      ['Constitutes the five-person restoration team and its coordination','S30 IV.A–B','polity'],
      ['Runs the 3-month window to enter the restoration programme','S30 IV.C.3','polity'],
      ['Requires the three evidences of healing and renewal','S30 IV.D','polity'],
      ['Blocks restoration tracks for permanent-revocation classes; enforces the no-contact rule','S30 III.A.4–5 · S30 V.9','polity'],
      ['Treats resignation during an open matter as non-exculpatory','S30 V.4','polity'],
      ['Treats the disciplinary record as cumulative','S30 V.1','polity'],
      ['Counts a congregation\u2019s unfiled monthly reports separately from its pastor\u2019s','S53 III.6','polity'],
      ['Applies the recommended church delinquency ladder at 2, 3 and 4+ months','S55 III.A.1\u20135','polity'],
      ['Computes the tithe of tithes at 5% to International and 5% to state with every report','S55 II.1','polity'],
      ['Treats ministry money owed as non-forgivable and offers the four resolution routes','S55 III.B','polity'],
      ['Sizes the Church and Pastor\u2019s Council by membership band','S52 II','polity'],
      ['Requires an appointed treasurer, a Finance Committee of treasurer plus two, and a bookkeeping system','S53 I.1, I.3 \u00b7 S55 I.A','polity'],
      ['Requires at least one church conference a year, announced ten days ahead','S50 II.4, III.2','polity'],
      ['Routes a member\u2019s concern about their church: pastor, then district overseer, then state overseer \u2014 named, in writing, not a petition','S51 III','polity'],
      ['Shows the ten percent annual conversion-growth commitment as a goal, never as a trigger','Commitment 3','goal'],
      ['Tracks the house-of-prayer, outreach-ministry and discipleship commitments a church declares','Commitments 1, 6, 9','goal'],
      ['Reviews the seven areas of the Practical Commitments','Practical Commitments I–VII','polity'],
      ['Grounds peer triads in the commitment to interdependence and mentoring across levels','Commitments to Our Mission and Vision, 7','polity'],
      ['Reviews the commitments <i>quarterly</i>, with peer confirmation','—','practice'],
      ['Groups ministers in threes with a weekly five-question check-in','—','practice'],
      ['Flags a background check older than five years','—','practice'],
      ['Surfaces a 2-month reporting gap as a watch item before polity requires anything','—','practice']
    ].map(([w,a,k])=>`<tr><td>${w}</td><td>${a==='—'?'<span class="prac">network practice</span>':`<span class="cite">${esc(a)}</span>`}</td><td>${k==='polity'?'Required by the Minutes':k==='goal'?'A stated commitment \u2014 a goal, not a rule':'Added by the network'}</td></tr>`).join('')}
  </tbody></table></div>

  <p class="shead">The credential path this network sits on</p>
  <div class="grid g3">
    <div class="card"><h3>Exhorter</h3><p>The first of three credential ranks. Where authorised by the state and district overseer, an exhorter may pastor a church, baptise, and receive members. Everything in this network — reporting, covenant review, triad, the concern pathway — applies from this rank forward.</p></div>
    <div class="card"><h3>Ordained Minister</h3><p>The second rank. Reached by holding the exhorter credential, completing the Ministerial Internship Program or its equivalent, and being approved by the state overseer to pursue ordination. Carries full right to preach, evangelise, pastor, baptise, receive members, administer the sacraments, solemnise marriage and establish churches; sits in the International General Council without vote.</p></div>
    <div class="card"><h3>Ordained Bishop</h3><p>The third rank. Trial boards are constituted from ordained bishops — which is why rank is a field in this system rather than a decoration.</p></div>
  </div>

  <hr class="sep">
  <div class="note"><b>On reproduction.</b> The <i>Book of Church Order, Governance, and Discipline</i>, the <i>Declaration of Faith</i> and the <i>Practical Commitments</i> are copyright Church of God Ministerial Development, Cleveland, Tennessee, and are not reproduced here. This system cites them by section so that a user can turn to the authoritative text, and paraphrases only what is necessary to explain what the software is doing and why. Where this tool and the Minutes ever differ, the Minutes govern — and a bug in a tracker has never yet suspended anyone's credentials.</div>`;
}


/* ── the church's own home: status and what it owes next ───────────────── */
function vChurchHome(el){
  const ch = chById(view.church), l = chLadder(ch), g = chGrowth(ch);
  const checks = chChecks(ch), open = checks.filter(c=>!c.ok);
  const polityGaps = open.filter(c=>c.why==='polity'), goalGaps = open.filter(c=>c.why==='goal');
  const p = mById(ch.pastor);
  el.innerHTML = `
  <h2 class="dh">${esc(ch.name)}</h2>
  <p class="sub">${esc(ch.district)} district · ${ch.membership} members · pastored by ${esc(p.name)} (${esc(p.rank)}). This is the congregation's own record — what the state and international offices can currently see, what is outstanding, and what this church owes before the fifth of next month. It is the same view the administrative bishop has of you, which is the point: nothing here should ever be a surprise.</p>

  <div class="grid g4">
    <div class="kpi ${l.months===0?'':(l.months>=2?'alert':'warnk')}"><div class="v" style="font-size:22px">${l.months===0?'Current':l.months+' mo behind'}</div><div class="k">Monthly report · S53 III.6</div></div>
    <div class="kpi ${ch.delinquentFunds?'alert':''}"><div class="v" style="font-size:22px">${ch.delinquentFunds?'€'+ch.delinquentFunds.toLocaleString('en-GB'):'Clear'}</div><div class="k">Ministry money owed</div></div>
    <div class="kpi ${polityGaps.length?'warnk':''}"><div class="v">${polityGaps.length}</div><div class="k">Required items open</div></div>
    <div class="kpi"><div class="v">${goalGaps.length}</div><div class="k">Commitments not yet met</div></div>
  </div>

  <div class="${l.months===0?'note':'warnbox'}" style="margin-top:var(--s3)">
    <b>${esc(l.t)}.</b> ${esc(l.d)} <span class="cite">${esc(l.cite)}</span>
  </div>

  <p class="shead">Where this church sits on the reporting ladder</p>
  <div class="steps">${CH_LADDER.map((s,i)=>`
    <div class="step ${l.months>s.at?'done':l.months===s.at||(s.at===4&&l.months>4)?'now':'pend'}">
      <div class="dot"><i>${s.at===0?'✓':s.at}</i><u></u></div>
      <div class="body"><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p><span class="cite">${esc(s.cite)}</span></div>
    </div>`).join('')}
  </div>
  <p class="note">The whole ladder above is described in the Minutes as a <b>recommended</b> procedure, not an automatic penalty — with one exception: the four-month clause, where a pastor found at fault is subject to disciplinary action up to revocation. Mending Net shows the recommendation and the section; it does not decide anything. <span class="cite">S55 III.A</span></p>

  <p class="shead">What this church owes next</p>
  <div class="aq">
    ${chTodo(ch).map(t=>`<div class="act p${t.p}">
      <div style="flex:1"><div class="who">${esc(t.t)}</div><div class="what">${esc(t.d)}</div>
      <div class="meta">${t.cite==='—'?'<span class="prac">network practice</span>':`<span class="cite">${esc(t.cite)}</span>`}</div></div>
      <button class="b ghost sm" data-go="${t.go}" type="button">Open</button></div>`).join('') || '<div class="note">Nothing outstanding. File the report by the fifth and keep the conference date in view.</div>'}
  </div>

  <p class="shead">Twelve-month picture</p>
  <div class="grid g4">
    <div class="kpi"><div class="v">${g.attNow}</div><div class="k">Average attendance${g.attDelta!==null?` · ${g.attDelta>0?'+':''}${g.attDelta}% yr/yr`:''}</div></div>
    <div class="kpi"><div class="v">${g.conversions12}</div><div class="k">Conversions · goal ${g.convGoal}</div></div>
    <div class="kpi"><div class="v">${g.baptisms12}</div><div class="k">Water baptisms</div></div>
    <div class="kpi"><div class="v">€${g.remitted12.toLocaleString('en-GB')}</div><div class="k">Remitted to Intl + State</div></div>
  </div>
  <p style="margin-top:var(--s3)"><button class="b ghost sm" data-go="progress" type="button">See the full progress record</button>
     <button class="b sm" data-go="churchreport" type="button">File the monthly report</button></p>`;
  wireGo(el);
}

/* The concrete to-do list a church can act on. */

/* ── the monthly church report ─────────────────────────────────────────── */
function vChurchReport(el){
  const ch = chById(view.church);
  const missing = [];
  if(ch.lastReport){ for(let i=pIdx(ch.lastReport)+1;i<pIdx(S.period);i++){ const y=Math.floor(i/12),m=i%12+1; missing.push(y+'-'+String(m).padStart(2,'0')); } }
  const last = (ch.reports||[]).slice(-1)[0] || {attendance:ch.membership, conversions:1, tithes:ch.membership*24};
  el.innerHTML = `
  <h2 class="dh">Monthly church report</h2>
  <p class="sub">Prepared by the treasurer and sent <b>by the fifth of each month</b> — one copy to the secretary general, one to the state overseer, on the forms provided by the secretary general's office. The tithe of tithes goes with it. <span class="cite">S53 III.6</span> <span class="cite">S55 II.1</span></p>
  <div class="grid g2">
    <div class="card">
      <h3>Outstanding</h3>
      ${missing.length?`<p><b>${missing.length} unfiled period${missing.length===1?'':'s'}:</b> ${missing.map(pLabel).join(', ')}.</p>
        <p>File the oldest first. Each period carries its own remittance — a later report does not clear an earlier one.</p>`
       :`<p>Nothing outstanding. Last report filed for ${pLabel(ch.lastReport)}.</p>`}
      <hr class="sep">
      <h3>The split, as set by the Assembly</h3>
      <p>Since 1 September 2014, the local church treasurer sends <b>5% of tithes received to the International Office</b> (secretary general) and an equal <b>5% to the state/regional office</b>, with their monthly report. The remainder is for the support of the pastor. <span class="cite">S55 II.1</span></p>
      <p>Surplus tithes are for the benefit of the ministry as decided by the state overseer, pastor and local church — churches with surplus are encouraged to sponsor a work in a new field. <span class="cite">S55 II.2</span></p>
    </div>
    <div class="card">
      <h3>Report for ${pLabel(missing[0] || S.period)}</h3>
      <div class="grid g2" style="gap:var(--s2)">
        <div class="field"><label class="f" for="hAtt">Average attendance</label><input id="hAtt" type="number" min="0" value="${last.attendance}" style="width:100%"></div>
        <div class="field"><label class="f" for="hConv">Conversions</label><input id="hConv" type="number" min="0" value="${last.conversions}" style="width:100%"></div>
        <div class="field"><label class="f" for="hBap">Water baptisms</label><input id="hBap" type="number" min="0" value="0" style="width:100%"></div>
        <div class="field"><label class="f" for="hSpirit">Baptised in the Holy Ghost</label><input id="hSpirit" type="number" min="0" value="0" style="width:100%"></div>
        <div class="field"><label class="f" for="hAdd">Members received</label><input id="hAdd" type="number" min="0" value="0" style="width:100%"></div>
        <div class="field"><label class="f" for="hTithes">Tithes received (€)</label><input id="hTithes" type="number" min="0" value="${last.tithes}" style="width:100%"></div>
      </div>
      <div class="note" id="splitBox"></div>
      <div class="field" style="margin-top:var(--s3)"><label class="f" for="hNote">Note to the state office</label><textarea id="hNote" placeholder="Anything the office should know before it becomes a surprise."></textarea></div>
      <label class="cb"><input type="checkbox" id="hRemit" checked> Tithe of tithes remitted with this report <span class="cite">S55 II.1</span></label>
      <div class="field"><label class="f" for="hPeriod">Period</label><select id="hPeriod">${periods(14).map(p=>`<option value="${p}" ${p===(missing[0]||S.period)?'selected':''}>${pLabel(p)}</option>`).join('')}</select></div>
      <button class="b" id="hFile" type="button">File church report</button>
    </div>
  </div>

  <p class="shead">Where a church report ends up mattering to a person</p>
  <div class="grid g3">
    <div class="card"><h3>The pastor's own eligibility</h3><p>A minister must be current on <em>both</em> personal ministerial reports and the local church reports, with required finances, to be eligible for election or appointment at state or international level.</p><p><span class="cite">S29 I.9</span></p></div>
    <div class="card"><h3>The overseer preference vote</h3><p>Ministers appointed as pastors must be current, or in covenant agreement, with state and international monthly church reports including appropriate monies, to take part in the administrative bishop preference and evaluation process.</p><p><span class="cite">S32 I.2</span></p></div>
    <div class="card"><h3>The next pastor</h3><p>The state overseer is required to fully inform any pastoral candidate of the current financial condition of a prospective church before their appointment is finalised. An unpaid balance follows the building, not the person who left.</p><p><span class="cite">S55 III.B</span></p></div>
  </div>`;
  const paint = ()=>{
    const t = Number(document.getElementById('hTithes').value||0);
    const cut = Math.round(t*0.05);
    document.getElementById('splitBox').innerHTML =
      `On €${t.toLocaleString('en-GB')} of tithes: <b>€${cut.toLocaleString('en-GB')}</b> to the International Office, <b>€${cut.toLocaleString('en-GB')}</b> to the state/regional office, <b>€${(t-2*cut).toLocaleString('en-GB')}</b> remaining for the support of the pastor. <span class="cite">S55 II.1</span>`;
  };
  document.getElementById('hTithes').oninput = paint; paint();
  document.getElementById('hFile').onclick = ()=>{
    const n = id => Number(document.getElementById(id).value||0);
    const period = document.getElementById('hPeriod').value;
    const t = n('hTithes');
    ch.reports = ch.reports || [];
    ch.reports.push({period, attendance:n('hAtt'), conversions:n('hConv'), baptisms:n('hBap'), spirit:n('hSpirit'),
      added:n('hAdd'), tithes:t, intl:Math.round(t*0.05), state:Math.round(t*0.05),
      remitted:document.getElementById('hRemit').checked, note:document.getElementById('hNote').value});
    ch.reports.sort((a,b)=>pIdx(a.period)-pIdx(b.period));
    if(pIdx(period) > pIdx(ch.lastReport||'2000-01')) ch.lastReport = period;
    render();
  };
}

/* ── governance: what the church maintains about itself ────────────────── */
function vGovernance(el){
  const ch = chById(view.church), req = councilRequired(ch.membership);
  const checks = chChecks(ch);
  el.innerHTML = `
  <h2 class="dh">Governance</h2>
  <p class="sub">The offices, committees and meetings a local Church of God congregation is required to keep — and the four commitments to the movement's mission that a church declares for itself. The congregation maintains this record; the state office reads it.</p>

  <div class="tw"><table><thead><tr><th>Item</th><th>Now</th><th>Status</th><th>Basis</th></tr></thead><tbody>
    ${checks.map(c=>`<tr><td class="nm">${esc(c.label)}</td><td>${esc(c.value)}</td>
      <td><span class="chip ${c.ok?'ok':(c.why==='goal'?'warn':'bad')}">${c.ok?'in place':(c.why==='goal'?'not yet':'open')}</span></td>
      <td>${c.why==='goal'?`<span class="cite">${esc(c.cite)}</span> <span class="prac">goal, not a rule</span>`:`<span class="cite">${esc(c.cite)}</span>`}</td></tr>`).join('')}
  </tbody></table></div>

  <p class="shead">Update the record</p>
  <div class="grid g2">
    <div class="card"><h3>Offices and committees</h3>
      <div class="field"><label class="f" for="gCouncil">Council seats filled (${req} required at ${ch.membership} members)</label><input id="gCouncil" type="number" min="0" max="20" value="${ch.council}" style="width:100%"></div>
      <div class="field"><label class="f" for="gTreas">Church treasurer</label><input id="gTreas" value="${esc(ch.treasurer)}" placeholder="Name — appointed by the pastor, confirmed by the council" style="width:100%"></div>
      <div class="field"><label class="f" for="gFin">Finance Committee members besides the treasurer</label><input id="gFin" type="number" min="0" max="4" value="${ch.financeCttee}" style="width:100%"></div>
      <div class="field"><label class="f" for="gConf">Last church conference</label><select id="gConf">${periods(26).map(p=>`<option value="${p}" ${p===ch.lastConference?'selected':''}>${pLabel(p)}</option>`).join('')}</select></div>
      <label class="cb"><input type="checkbox" id="gBooks" ${ch.bookkeeping?'checked':''}> An adequate bookkeeping system is in use and the treasurer holds a current copy of the Minutes <span class="cite">S53 I.3</span></label>
      <label class="cb"><input type="checkbox" id="gBg" ${ch.bgComplete?'checked':''}> Every person in a ministry position here has a criminal background check on file <span class="cite">S29 I.11</span></label>
    </div>
    <div class="card"><h3>Commitments to the mission</h3>
      <p>These are the movement's stated commitments, not disciplinary requirements. A church declares them for itself and the network holds it to its own word.</p>
      <label class="cb"><input type="checkbox" id="gPrayer" ${ch.prayer?'checked':''}> This congregation is a house of prayer for all nations, and its leadership models an active prayer life <span class="cite">Commitment 1</span></label>
      <label class="cb"><input type="checkbox" id="gOut" ${ch.outreach?'checked':''}> An outreach ministry to the disadvantaged or oppressed is established here <span class="cite">Commitment 6</span></label>
      <label class="cb"><input type="checkbox" id="gDisc" ${ch.discipleship?'checked':''}> Discipleship is prioritised in every facet of our ministry <span class="cite">Commitment 9</span></label>
      <div class="field" style="margin-top:var(--s2)"><label class="f" for="gUnr">Unreached people group adopted and interceded for <span class="cite">Commitment 3</span></label><input id="gUnr" value="${esc(ch.unreached||'')}" placeholder="Name the group, or leave blank" style="width:100%"></div>
      <div class="field"><label class="f" for="gOwed">Ministry money owed (€)</label><input id="gOwed" type="number" min="0" value="${ch.delinquentFunds}" style="width:100%"></div>
      <button class="b" id="gSave" type="button">Save governance record</button>
    </div>
  </div>

  <p class="shead">How this congregation raises a concern</p>
  <div class="grid g2">
    <div class="card"><h3>A member with a concern about the church</h3>
      <p>Loyal, tithing members with a legitimate concern relating to the welfare of their church have the right to contact the state overseer — <b>after</b> they have contacted their pastor and their district overseer. Concerns are communicated to the pastor and district overseer <em>with the names of those raising them</em>, and should preferably be in writing.</p>
      <p><b>Not as part of a petition.</b> The text is explicit. A named letter from three members carries further here than a hundred signatures.</p>
      <p><span class="cite">S51 III</span></p></div>
    <div class="card"><h3>A concern about the minister</h3>
      <p>That is a different route with a different order — private approach first, then with witnesses, then a written and signed charge to the administrative bishop. It does not run through the church's governance record, and this congregation's officers cannot open it on a member's behalf.</p>
      <p><button class="b ghost sm" data-go="concerns" type="button">See the concern pathway</button></p>
      <p><span class="cite">Matthew 18:15–17</span> <span class="cite">S31 I.B.1</span></p></div>
    <div class="card"><h3>Pastoral preference</h3>
      <p>The appointment of a pastor is vested in the state overseer, who appoints after consulting the district overseer and after giving members an opportunity to express their desire. The overseer may call for an expression from members aged 16 and over where there is an apparent decline in the spiritual health of the church. A signature is required on the uniform pastoral preference ballot.</p>
      <p><span class="cite">S51 I.1–5</span></p></div>
    <div class="card"><h3>What the church decides in conference</h3>
      <p>All major disbursements must be approved by the church in conference, and each congregation determines for itself what amount constitutes a major disbursement. The conference exists to inform the church of its financial status; ten days notice for a regular one; Robert's Rules of Order Newly Revised is the guide.</p>
      <p><span class="cite">S50 III</span> <span class="cite">S52 IV.2</span></p></div>
  </div>`;
  wireGo(el);
  document.getElementById('gSave').onclick = ()=>{
    ch.council = Number(document.getElementById('gCouncil').value||0);
    ch.treasurer = document.getElementById('gTreas').value.trim();
    ch.financeCttee = Number(document.getElementById('gFin').value||0);
    ch.lastConference = document.getElementById('gConf').value;
    ch.bookkeeping = document.getElementById('gBooks').checked;
    ch.bgComplete = document.getElementById('gBg').checked;
    ch.prayer = document.getElementById('gPrayer').checked;
    ch.outreach = document.getElementById('gOut').checked;
    ch.discipleship = document.getElementById('gDisc').checked;
    ch.unreached = document.getElementById('gUnr').value.trim();
    ch.delinquentFunds = Number(document.getElementById('gOwed').value||0);
    render();
  };
}

/* ── progress: the church's own record over time ───────────────────────── */
function vProgress(el){
  const ch = chById(view.church), g = chGrowth(ch);
  const h = (ch.reports||[]).slice(-12);
  const goalPct = g.convGoal? Math.min(100, Math.round(g.conversions12/g.convGoal*100)) : 0;
  const remitOk = h.filter(r=>r.remitted!==false).length;
  el.innerHTML = `
  <h2 class="dh">Progress</h2>
  <p class="sub">Twelve months of this congregation's own filed reports. Everything below is drawn from what the church itself sent to the secretary general and the state office — it is not an assessment, it is the church's own record read back to it.</p>

  <div class="grid g4">
    <div class="kpi"><div class="v">${g.attNow}</div><div class="k">Avg attendance ${g.attDelta!==null?`· ${g.attDelta>0?'+':''}${g.attDelta}% on prior yr`:''}</div></div>
    <div class="kpi"><div class="v">${g.conversions12}</div><div class="k">Conversions this year</div></div>
    <div class="kpi"><div class="v">${g.baptisms12} / ${g.spirit12}</div><div class="k">Water / Holy Ghost baptisms</div></div>
    <div class="kpi ${remitOk<h.length?'warnk':''}"><div class="v">${remitOk}/${h.length}</div><div class="k">Months remitted with report</div></div>
  </div>

  <p class="shead">Conversion growth against the stated commitment</p>
  <div class="card">
    <p>The movement's commitment to world evangelisation encourages <b>every local church to increase a minimum of ten percent per year through conversion growth</b>. At ${ch.membership} members that is ${g.convGoal} in a year. This congregation has recorded <b>${g.conversions12}</b>. <span class="cite">Commitment 3</span> <span class="prac">a goal in the text, not a rule</span></p>
    <div style="height:10px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin:var(--s3) 0">
      <div style="height:100%;width:${goalPct}%;background:${goalPct>=100?'var(--good)':'var(--c)'}"></div></div>
    <p style="font-size:12.5px;color:var(--ink-faint)">${goalPct}% of the ten percent goal. Nothing follows from missing it — no report is triggered, no board convenes. It is here because a church that never looks at this number cannot say whether it is growing or merely open.</p>
  </div>

  <p class="shead">Average attendance, last ${h.length} months</p>
  <div class="card">${bars(h,'attendance')}</div>

  <p class="shead">Conversions</p>
  <div class="card">${bars(h,'conversions')}</div>

  <p class="shead">Tithes received, and what went out with the report</p>
  <div class="card">${bars(h,'tithes',v=>'€'+v.toLocaleString('en-GB'))}
    <p style="margin-top:var(--s3)">Over twelve months this church received <b>€${g.tithes12.toLocaleString('en-GB')}</b> in tithes and remitted <b>€${g.remitted12.toLocaleString('en-GB')}</b> — 5% to the International Office and 5% to the state/regional office — leaving <b>€${(g.tithes12-g.remitted12).toLocaleString('en-GB')}</b> for the support of the pastor. <span class="cite">S55 II.1</span></p></div>

  <p class="shead">Filed reports</p>
  <div class="tw"><table><thead><tr><th>Period</th><th>Attendance</th><th>Conversions</th><th>Baptisms</th><th>Tithes</th><th>Intl 5%</th><th>State 5%</th><th>Remitted</th></tr></thead><tbody>
    ${h.slice().reverse().map(r=>`<tr><td class="nm">${pLabel(r.period)}</td><td>${r.attendance}</td><td>${r.conversions}</td>
      <td>${r.baptisms||0} / ${r.spirit||0}</td><td>€${(r.tithes||0).toLocaleString('en-GB')}</td>
      <td>€${(r.intl||0).toLocaleString('en-GB')}</td><td>€${(r.state||0).toLocaleString('en-GB')}</td>
      <td><span class="chip ${r.remitted===false?'bad':'ok'}">${r.remitted===false?'no':'yes'}</span></td></tr>`).join('')}
  </tbody></table></div>`;
}

/* ── the overseer's view of every congregation ─────────────────────────── */
function vCongregations(el){
  el.innerHTML = `
  <h2 class="dh">Congregations</h2>
  <p class="sub">The local church carries its own reporting obligation, separate from its pastor's. The treasurer sends the report and the tithe of tithes by the fifth of each month, and the delinquency ladder that follows is a different ladder with different consequences — it reaches the pastor's credentials only at the far end. <span class="cite">S53 III.6</span> <span class="cite">S55 III.A</span></p>
  <div class="tw"><table>
    <thead><tr><th>Congregation</th><th>Pastor</th><th>Members</th><th>Last report</th><th>Behind</th><th>Ladder position</th><th>Owed</th><th>Council</th><th>Open items</th></tr></thead>
    <tbody>${S.churches.map(ch=>{
      const l = chLadder(ch), req = councilRequired(ch.membership);
      const open = chChecks(ch).filter(c=>!c.ok && c.why==='polity').length;
      return `<tr class="click" data-ch="${ch.id}">
        <td class="nm">${esc(ch.name)}</td><td>${esc(mById(ch.pastor).name)}</td>
        <td style="font-variant-numeric:tabular-nums">${ch.membership}</td>
        <td>${pLabel(ch.lastReport)}</td>
        <td style="font-variant-numeric:tabular-nums">${l.months}</td>
        <td><span class="chip ${l.cls}">${esc(l.t)}</span></td>
        <td>${ch.delinquentFunds?`<span class="chip bad">€${ch.delinquentFunds.toLocaleString('en-GB')}</span>`:'<span class="chip ok">clear</span>'}</td>
        <td>${ch.council}/${req}</td>
        <td>${open?`<span class="chip bad">${open}</span>`:'<span class="chip ok">0</span>'}</td></tr>`;
    }).join('')}</tbody></table></div>

  <p class="shead">The church ladder, side by side with the minister's</p>
  <div class="grid g2">
    <div class="card"><h3>A church behind on reports</h3><ul class="ck">
      <li><b>2 months</b> — the state overseer meets personally with the pastor <span class="cite">S55 III.A.1</span></li>
      <li><b>3 months</b> — a board of inquiry is appointed to investigate and recommend <span class="cite">S55 III.A.2</span></li>
      <li><b>continuing</b> — a state board considers filing appropriate charges <span class="cite">S55 III.A.3</span></li>
      <li><b>fault found</b> — the pastor is not considered for any appointment or position until proper disposition is made for payment <span class="cite">S55 III.A.4</span></li>
      <li><b>4 months+</b> — disciplinary action from the administrative bishop, up to revocation of credentials, exceptions case by case with the presiding bishop's approval <span class="cite">S55 III.A.5</span></li></ul>
      <p style="margin-top:var(--s2)">Described in the text as a <b>recommended</b> procedure.</p></div>
    <div class="card"><h3>A minister behind on reports</h3><ul class="ck">
      <li><b>3 months</b> — the state overseer <b>shall</b> urgently admonish the minister <span class="cite">S28 III.1</span></li>
      <li><b>4 months</b> — written notice that the licence is subject to revocation, after due disciplinary process <span class="cite">S28 III.2</span></li>
      <li><b>6 months inactive</b> — where not caused by illness or age, ministry revoked <span class="cite">S30 V.10</span></li></ul>
      <p style="margin-top:var(--s2)">Two obligations, two ladders. A pastor can be personally current and still be running a church that is four months behind — which is exactly the case the paper record hides and this table does not.</p></div>
  </div>

  <p class="shead">Money owed does not expire</p>
  <div class="note">There is <b>no provision for forgiveness of ministry money owed</b>. Where a balance has accumulated that the present pastor did not cause, the routes are immediate payment, a payment plan, partial payment with partial assistance, or full assistance once the others are exhausted and the debt is beyond the local church's ability to satisfy within twelve months — funded by an individual, another local church, the state office, international headquarters, or any combination. And the state overseer must fully inform any pastoral candidate of a church's financial condition before finalising their appointment. <span class="cite">S55 III.B</span></div>`;
  el.querySelectorAll('tr.click').forEach(tr=>tr.onclick=()=>openChurch(tr.dataset.ch));
  if(view.goid){ const g=view.goid; view.goid=null; if(S.churches.some(c=>c.id===g)) openChurch(g); }
}

function openChurch(id){
  const ch = chById(id), l = chLadder(ch), g = chGrowth(ch), checks = chChecks(ch);
  drawer(`<div><div style="font-family:var(--display);font-size:21px">${esc(ch.name)}</div>
    <div style="font-size:12.5px;color:var(--ink-soft)">${esc(ch.district)} · ${ch.membership} members · ${esc(mById(ch.pastor).name)}</div></div>`, `
    <dl class="kv">
      <dt>Last report</dt><dd>${pLabel(ch.lastReport)} — <span class="chip ${l.cls}">${esc(l.t)}</span></dd>
      <dt>Owed</dt><dd>${ch.delinquentFunds?'€'+ch.delinquentFunds.toLocaleString('en-GB'):'nothing outstanding'}</dd>
      <dt>Council</dt><dd>${ch.council} of ${councilRequired(ch.membership)} required</dd>
      <dt>Treasurer</dt><dd>${esc(ch.treasurer||'not appointed')}</dd>
      <dt>Conference</dt><dd>${ch.lastConference?pLabel(ch.lastConference):'none recorded'}</dd>
      <dt>Attendance</dt><dd>${g.attNow} avg${g.attDelta!==null?` (${g.attDelta>0?'+':''}${g.attDelta}% yr/yr)`:''}</dd>
      <dt>Conversions</dt><dd>${g.conversions12} in 12 months, against a ${g.convGoal} goal</dd>
    </dl>
    ${l.months>=2?`<div class="warnbox" style="margin-top:var(--s4)"><b>${esc(l.t)}.</b> ${esc(l.d)} <span class="cite">${esc(l.cite)}</span></div>`:''}
    <hr class="sep">
    <p class="shead" style="margin-top:0">Open items</p>
    ${checks.filter(c=>!c.ok).length?`<ul class="ck cross">${checks.filter(c=>!c.ok).map(c=>`<li><b>${esc(c.label)}</b> — ${esc(c.value)} <span class="cite">${esc(c.cite)}</span></li>`).join('')}</ul>`:'<p style="font-size:13.5px;color:var(--ink-soft)">Nothing open.</p>'}
    <hr class="sep">
    <div class="row"><button class="b sm" id="chView" type="button">Open the church intranet</button></div>
    <p style="margin-top:var(--s3);font-size:12.5px;color:var(--ink-faint)">The congregation sees the same record you are looking at — its ladder position, its open items, its twelve-month progress. Nothing about its pastor's personal standing, covenant review or triad is visible to it.</p>`);
  document.getElementById('chView').onclick = ()=>goChurch(id);
}


view.role = 'overseer';
document.getElementById('period').onchange = e=>{ S.period=e.target.value; render(); };
wireTheme(); wireReset();
function boot(){
  document.getElementById('period').innerHTML = periods(14).map(p=>`<option value="${p}" ${p===S.period?'selected':''}>${pLabel(p)}</option>`).join('');
  render();
}
boot();
