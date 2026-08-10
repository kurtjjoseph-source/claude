/* ══════════════════════════════════════════════════════════════════════════
   THE MINISTER INTRANET
   Not a status page. Every requirement a credentialed minister carries, with
   the thing that discharges it on the same screen — file the report, sign the
   reaffirmation, record the check, log the check-in, acknowledge the standing
   instruction. Nothing here is visible to a congregation; the administrative
   bishop sees the same record you do.
   ══════════════════════════════════════════════════════════════════════════ */

view.who = qs('m') || localStorage.getItem('mendingnet.me') || 'm3';
if(!S.ministers.some(m=>m.id===view.who)) view.who = S.ministers[0].id;
localStorage.setItem('mendingnet.me', view.who);
const me = () => mById(view.who);

/* ── the credential ladder, as the study guide sets it out ─────────────── */
const RANKS = {
  'Exhorter':{n:1, rights:[
      'Serve where appointed, and — where the state and district overseer authorise it — pastor a church, baptise, and receive members into the church'],
    cite:'S32 VII.19', next:'Ordained Minister'},
  'Ordained Minister':{n:2, rights:[
      'Preach, publish, teach and defend the gospel of Jesus Christ',
      'Do the work of an evangelist',
      'Serve as pastor of a church',
      'Baptise converts',
      'Receive believers into fellowship of church membership',
      'Administer Holy Sacraments (ordinances)',
      'Solemnise rites of matrimony',
      'Establish churches',
      'Sit in the International General Council, without voting privileges'],
    cite:'Study guide, General Information', next:'Ordained Bishop'},
  'Ordained Bishop':{n:3, rights:[
      'All of the above, and eligibility to serve on trial boards, examining boards and councils'],
    cite:'S31 I.B.2.c', next:null}
};

/* The eleven steps, and who owns each one. Copied as ownership, not as text. */
const ADVANCE = [
  {t:'Request advancement',        who:'You → your pastor and/or district overseer (if you are the pastor, to the district overseer)'},
  {t:'Application requested',      who:'Pastor / district overseer → state office'},
  {t:'Application completed',      who:'You → pastor / district overseer, who completes the Pastoral Recommendation'},
  {t:'District recommendation',    who:'District overseer recommends or declines, and forwards to the state overseer'},
  {t:'State review',               who:'State overseer reviews. A change in marital status routes to the marital status procedure'},
  {t:'Background check',           who:'State/regional office. Questions raised here must be answered before anything proceeds'},
  {t:'MIP or its equivalency',     who:'You, under supervision — see the four equivalency routes below'},
  {t:'Local church endorsement',   who:'Your congregation, in a regular or called church conference. The approval is recorded in the conference minutes and the endorsement form goes to the district overseer, then the state overseer'},
  {t:'Study guide and exam date',  who:'State office sends the order form for the study guide and schedules the written and oral examinations'},
  {t:'Written and oral exams',     who:'You'},
  {t:'Credential awarded',         who:'On passing both'}
];
const MIP_ROUTES = ['One year of pastoral ministry','One year of evangelism ministry',
  'One year of associate pastoral ministry','One year of specialised ministry listed on the ministerial report form'];

/* S21 IV — the general requirements every applicant carries, including those
   advancing in rank. These do not lapse once you hold a credential. */
const GENERAL_REQS = [
  {k:'holyghost', t:'Baptism in the Holy Ghost', cite:'S21 IV.1'},
  {k:'teachings', t:'Adherence to the Teachings and Doctrines as set forth by the International General Assembly', cite:'S21 IV.2'},
  {k:'tithing',   t:'Paying tithes — required to retain a licence', cite:'S21 IV.3'},
  {k:'exhorter',  t:'Served as an exhorter before applying for ordained minister', cite:'S21 IV.4'},
  {k:'active',    t:'Actively engaged in ministry', cite:'S21 IV.5'},
  {k:'bgconsent', t:'Consent given to the state/regional office to conduct criminal background checks', cite:'S21 IV.6'}
];

/* S29 I — the standing instructions. Acknowledged, dated, and on the record. */
const INSTRUCTIONS = [
  {k:'finance',  t:'I take care of my financial obligations promptly.',
   d:'Ministers who fail to maintain proper credit are warned by the state overseer; where no satisfactory disposition is made, the case is referred to a state board.', cite:'S29 I.1'},
  {k:'bounds',   t:'I remain within the decisions of the International General Assembly and teach nothing contrary to its authorised Teachings.', d:'', cite:'S29 I.2'},
  {k:'moving',   t:'If I move to another state without assignment I will notify both my former and present state overseers at once.',
   d:'And give the present overseer information about myself and my family, previous ministerial work, what I would like to do, and how long I plan to remain.', cite:'S29 I.3'},
  {k:'credentials', t:'I hold no ministerial credentials from another organisation or licensing association.', d:'', cite:'S29 I.4'},
  {k:'independent', t:'I do not pastor or assist independent congregations that do not subscribe to the doctrines, practices and government of the Church of God.', d:'', cite:'S29 I.6–7'},
  {k:'confidence', t:'I understand that confidence entrusted to me in the course of my duties is not to be violated — and that this does not preempt reporting law, and may not be used to conceal a felonious act.',
   d:'The exceptions are the express permission of the person who confided, or to prevent a crime.', cite:'S29 I.8'},
  {k:'social',   t:'My use of social media upholds the doctrine of the Church of God and does not breach professional confidentiality.',
   d:'Disclosing confidential, financial, administrative or ecclesiastical information presented in official meetings may result in disciplinary action.', cite:'S29 I.10'},
  {k:'reports',  t:'I understand my eligibility for election or appointment depends on being current with both my personal reports and, where I pastor, the local church reports with required finances.', d:'', cite:'S29 I.9'}
];

const STUDY = [
  {k:'bible',    t:'Part One — Bible', d:'Old Testament and New Testament survey, with the review questions at the end of each.'},
  {k:'polity',   t:'Part Two — Church of God History and Polity', d:'History, the General Assembly and General Council, organisational levels, and the Book of Church Order, Governance and Discipline.'},
  {k:'doctrine', t:'Part Three — Doctrine', d:'The Declaration of Faith, the Practical Commitments, and the scripture references behind them.'}
];

/* ── what I owe, computed ──────────────────────────────────────────────── */
function myTodo(){
  const m = me(), out = [];
  const f = reportFlag(m), r = reaffFlag(m), b = bgFlag(m);
  const d = delinquency(m);
  if(d && d>0) out.push({p:d>=3?1:2, t:'File '+d+' outstanding monthly report'+(d===1?'':'s'),
    d: d>=4 ? 'Your licence is already subject to revocation, after due disciplinary process. File everything outstanding now.'
      : d===3 ? 'Your state overseer is now required to urgently admonish you to bring your reports up to date. File before that conversation, not after it.'
      : d===2 ? 'One further missed period triggers the required admonition.'
      : 'Reports go to state and international headquarters on the first of each month.',
    cite:f.cite, go:'report'});
  if(!r.ok) out.push({p:2, t:'Reaffirm fidelity to the Declaration of Faith, Doctrinal Commitments and Practical Commitments',
    d:'Submitted biennially with the September ministerial report. Yours is '+r.label.toLowerCase()+'.', cite:'S29 I.9', go:'reaffirm'});
  if(!b.ok) out.push({p:b.cls==='bad'?1:3, t:'Criminal background check',
    d:b.cls==='bad'?'Nothing on file. Any person placed, appointed or hired for a ministry position should have one — and consent to a check is a general requirement of every applicant, including those advancing in rank.':'Yours is more than five years old.',
    cite:b.cls==='bad'?'S29 I.11':'—', go:'file'});
  if(!m.tithing) out.push({p:1, t:'Tithing', d:'All ministers are required to pay tithes to retain their licence.', cite:'S21 IV.3', go:'file'});
  const rv = lastReview(m.id);
  if(!rv) out.push({p:3, t:'Complete a covenant review', d:'The seven Practical Commitments, in your own words, confirmed by a triad partner.', cite:'Practical Commitments I–VII', go:'covenant'});
  else if(!rv.confirmed) out.push({p:3, t:'Covenant review awaiting confirmation',
    d:'Recorded for '+rv.period+' but not yet confirmed by '+mById(rv.peer).name+'. An unconfirmed self-assessment is a diary entry.', cite:'—', go:'covenant'});
  const t = triadOf(m.id);
  if(!t) out.push({p:2, t:'Join a triad', d:'You are not in an accountability group.', cite:'—', go:'triad'});
  else if(!t.checkins.length) out.push({p:3, t:'Record a triad check-in', d:'No check-in on record for '+t.name+'.', cite:'—', go:'triad'});
  const owed = INSTRUCTIONS.filter(i=>!m.acks[i.k]);
  if(owed.length) out.push({p:3, t:'Acknowledge '+owed.length+' standing instruction'+(owed.length===1?'':'s'),
    d:'The obligations that do not lapse: financial conduct, teaching within Assembly decisions, notification on moving, outside credentials, independent congregations, confidentiality and reporting, social media.', cite:'S29 I', go:'instructions'});
  const pend = S.reviews.filter(x=>x.peer===m.id && !x.confirmed);
  if(pend.length) out.push({p:2, t:'Confirm '+pend.length+' covenant review'+(pend.length===1?'':'s')+' as a triad partner',
    d:pend.map(x=>mById(x.minister).name).join(', ')+' asked you to confirm what they wrote. Confirming is not agreeing it is good — it is saying you have read it and will ask again.', cite:'—', go:'triad'});
  const ch = churchOfPastor(m.id);
  if(ch && chLadder(ch).months>0) out.push({p:2, t:'The church you pastor is '+chLadder(ch).months+' month(s) behind',
    d:ch.name+' owes its own monthly report and funds. That obligation belongs to the congregation and its treasurer — but your eligibility for election or appointment depends on both being current.', cite:'S29 I.9', go:'church:'+ch.id});
  return out.sort((a,b)=>a.p-b.p);
}

/* ── shell ─────────────────────────────────────────────────────────────── */
const MTABS = [['home','My standing'],['report','Monthly report'],['reaffirm','Reaffirmation'],
  ['covenant','Covenant review'],['triad','My triad'],['advance','Advancement'],
  ['instructions','Standing instructions'],['file','My file']];
if(!MTABS.some(t=>t[0]===view.tab)) view.tab = 'home';

function renderTabs(){
  const m = me(), todo = myTodo();
  const counts = {home: todo.filter(t=>t.p===1).length, report: delinquency(m)||0,
    reaffirm: reaffFlag(m).ok?0:1, instructions: INSTRUCTIONS.filter(i=>!m.acks[i.k]).length,
    triad: S.reviews.filter(x=>x.peer===m.id && !x.confirmed).length};
  document.getElementById('tabs').innerHTML = MTABS.map(([k,t])=>
    `<button type="button" data-tab="${k}" aria-current="${view.tab===k}">${t}${counts[k]?`<span class="n">${counts[k]}</span>`:''}</button>`).join('');
  document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{ view.tab=b.dataset.tab; render(); window.scrollTo({top:0,behavior:'smooth'}); });
}
function render(){
  const m = me();
  document.getElementById('whoName').textContent = m.name;
  document.getElementById('whoMeta').textContent = m.rank + ' · ' + m.church + ' · ' + m.district + ' district';
  renderTabs();
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on'));
  const pane = document.getElementById('p-'+view.tab); pane.classList.add('on');
  ({home:vHome, report:vMyReport, reaffirm:vReaffirm, covenant:vMyCovenant, triad:vMyTriad,
    advance:vAdvance, instructions:vInstructions, file:vMyFile})[view.tab](pane);
  save();
}
function goTab(el){
  el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{
    const g = b.dataset.go;
    if(g.startsWith('church:')) return goChurch(g.split(':')[1]);
    view.tab = g; render(); window.scrollTo({top:0,behavior:'smooth'});
  });
}

/* ── My standing ───────────────────────────────────────────────────────── */
function vHome(el){
  const m = me(), f = reportFlag(m), r = reaffFlag(m), b = bgFlag(m), todo = myTodo();
  const t = triadOf(m.id), rv = lastReview(m.id), rt = restorationOf(m.id);
  const mine = S.concerns.filter(c=>c.subject===m.id && !c.closed);
  el.innerHTML = `
  <h2 class="dh">What you owe, and what discharges it</h2>
  <p class="sub">Everything on this page is an obligation that already exists in the Minutes — this intranet just puts the thing that clears it next to the thing that says you owe it. Your administrative bishop sees the same record. No congregation sees any of it.</p>

  <div class="grid g4">
    <div class="kpi ${f.cls==='bad'?'alert':f.cls==='warn'?'warnk':''}"><div class="v" style="font-size:20px">${esc(f.label)}</div><div class="k">Monthly report · ${esc(f.cite)}</div></div>
    <div class="kpi ${r.ok?'':'warnk'}"><div class="v" style="font-size:20px">${esc(r.label)}</div><div class="k">Reaffirmation · S29 I.9</div></div>
    <div class="kpi ${b.ok?'':(b.cls==='bad'?'alert':'warnk')}"><div class="v" style="font-size:20px">${esc(b.label)}</div><div class="k">Background check · S29 I.11</div></div>
    <div class="kpi ${m.tithing?'':'alert'}"><div class="v" style="font-size:20px">${m.tithing?'Faithful':'Not current'}</div><div class="k">Tithing · S21 IV.3</div></div>
  </div>

  ${mine.length?`<div class="warnbox" style="margin-top:var(--s3)"><b>${mine.length} open concern${mine.length===1?'':'s'} names you.</b> You hold the full set of rights attaching to the person charged: to know the charge and who brought it in writing, to be presumed innocent, to refute it, to produce witnesses, to face your accuser, and to invite one credentialed minister to be present with you for personal support. <span class="cite">S31 I.B.5</span></div>`:''}
  ${rt?`<div class="note" style="margin-top:var(--s3)"><b>Restoration track ${esc(rt.id)}.</b> ${esc(RCLASS[rt.rclass].t)} — month ${monthsBetween(rt.enteredOn,S.period)} of a minimum ${RCLASS[rt.rclass].months}. The team, the clock and the three evidences are held by the Center for Ministerial Care, not here. <span class="cite">S30 IV</span></div>`:''}

  <p class="shead">Outstanding — ${todo.length} item${todo.length===1?'':'s'}</p>
  <div class="aq">${todo.map(x=>`
    <div class="act p${x.p}"><div style="flex:1">
      <div class="who">${esc(x.t)}</div><div class="what">${esc(x.d)}</div>
      <div class="meta">${x.cite==='—'?'<span class="prac">network practice</span>':`<span class="cite">${esc(x.cite)}</span>`}</div>
    </div><button class="b ghost sm" data-go="${x.go}" type="button">Do it</button></div>`).join('')
    || '<div class="note">Nothing outstanding. File on the first, and keep the September reaffirmation in view.</div>'}
  </div>

  <p class="shead">Where you stand with people, not just with paperwork</p>
  <div class="grid g3">
    <div class="card"><h3>Triad</h3>
      ${t?`<p>${esc(t.name)} — with ${t.members.filter(x=>x!==m.id).map(x=>esc(mById(x).name)).join(' and ')||'nobody yet'}. ${t.checkins.length} check-in${t.checkins.length===1?'':'s'} recorded.</p>`:'<p>You are not in a triad.</p>'}
      <button class="b ghost sm" data-go="triad" type="button">Open</button></div>
    <div class="card"><h3>Covenant review</h3>
      ${rv?`<p>${esc(rv.period)}${rv.confirmed?', confirmed by '+esc(mById(rv.peer).name):' — awaiting confirmation'}. ${Object.values(rv.scores).filter(v=>v==='Strained'||v==='Slipping').length} of 7 areas strained or slipping.</p>`:'<p>None on file.</p>'}
      <button class="b ghost sm" data-go="covenant" type="button">Open</button></div>
    <div class="card"><h3>Advancement</h3>
      <p>${esc(m.rank)}${RANKS[m.rank].next?` — the path to ${esc(RANKS[m.rank].next)} runs to eleven steps, and the first one is yours to take.`:' — the third and final rank.'}</p>
      <button class="b ghost sm" data-go="advance" type="button">Open</button></div>
  </div>`;
  goTab(el);
}

/* ── Monthly report ────────────────────────────────────────────────────── */
function missingPeriods(lastReport){
  const out = [];
  if(!lastReport) return out;
  for(let i=pIdx(lastReport)+1;i<pIdx(S.period);i++){ const y=Math.floor(i/12), m=i%12+1; out.push(y+'-'+String(m).padStart(2,'0')); }
  return out;
}
function vMyReport(el){
  const m = me(), f = reportFlag(m), miss = missingPeriods(m.lastReport);
  el.innerHTML = `
  <h2 class="dh">Monthly ministerial report</h2>
  <p class="sub">Filed on the first of each month to state and international headquarters. It is the single obligation that ends the most credentials, and the one that gates your eligibility for election or appointment. <span class="cite">S28 I</span> <span class="cite">S29 I.9</span></p>

  <div class="grid g2">
    <div class="card">
      <h3>Standing</h3>
      <p><span class="chip ${f.cls}">${esc(f.label)}</span> — last filed ${pLabel(m.lastReport)}.</p>
      ${miss.length?`<p><b>Unfiled:</b> ${miss.map(pLabel).join(', ')}.</p>
        <button class="b sm" id="catchup" type="button">File all ${miss.length} outstanding at once</button>
        <p style="margin-top:var(--s2);font-size:12.5px;color:var(--ink-faint)">Catching up files a nil-activity return for each missed period so the record is complete. Where a period had activity, file it individually below instead.</p>`
       :'<p>Nothing outstanding.</p>'}
      ${f.action?`<div class="warnbox" style="margin-top:var(--s3)">${esc(f.action)} <span class="cite">${esc(f.cite)}</span></div>`:''}
      <hr class="sep">
      <h3>The ladder</h3>
      <ul class="ck">
        <li><b>3 months</b> — the state overseer <b>shall</b> urgently admonish you to bring reports up to date <span class="cite">S28 III.1</span></li>
        <li><b>4 months</b> — written notice that your licence is subject to revocation, after due disciplinary process <span class="cite">S28 III.2</span></li>
        <li><b>6 months</b> not reporting or not actively engaged, where not caused by illness or age — ministry revoked <span class="cite">S30 V.10</span></li>
      </ul>
    </div>
    <div class="card">
      <h3>File a report</h3>
      <div class="field"><label class="f" for="rPeriod">Period</label><select id="rPeriod">${periods(14).map(p=>`<option value="${p}" ${p===(miss[0]||S.period)?'selected':''}>${pLabel(p)}</option>`).join('')}</select></div>
      <div class="grid g2" style="gap:var(--s2)">
        <div class="field"><label class="f" for="rServ">Services / engagements</label><input id="rServ" type="number" min="0" value="8" style="width:100%"></div>
        <div class="field"><label class="f" for="rConv">Conversions</label><input id="rConv" type="number" min="0" value="2" style="width:100%"></div>
        <div class="field"><label class="f" for="rBap">Baptisms</label><input id="rBap" type="number" min="0" value="0" style="width:100%"></div>
        <div class="field"><label class="f" for="rHome">Home / hospital visits</label><input id="rHome" type="number" min="0" value="6" style="width:100%"></div>
      </div>
      <label class="cb"><input type="checkbox" id="rTithe" ${m.tithing?'checked':''}> Tithes paid into the church where I am a member <span class="cite">S55 II.1</span> <span class="cite">S21 IV.3</span></label>
      <div class="field"><label class="f" for="rNote">Note to the administrative bishop</label><textarea id="rNote" placeholder="Anything the office should know before it becomes a surprise."></textarea></div>
      <button class="b" id="rFile" type="button">File report</button>
    </div>
  </div>

  <p class="shead">Filed history</p>
  ${m.reports.length?`<div class="tw"><table><thead><tr><th>Period</th><th>Services</th><th>Conversions</th><th>Baptisms</th><th>Visits</th><th>Tithed</th><th>Filed</th></tr></thead><tbody>
    ${m.reports.slice().reverse().map(r=>`<tr><td class="nm">${pLabel(r.period)}</td><td>${r.services||0}</td><td>${r.conversions||0}</td>
      <td>${r.baptisms||0}</td><td>${r.visits||0}</td><td><span class="chip ${r.tithed===false?'bad':'ok'}">${r.tithed===false?'no':'yes'}</span></td>
      <td>${esc(r.filedIn||'—')}</td></tr>`).join('')}
  </tbody></table></div>`:'<div class="note">No reports filed through this intranet yet. Historic filings live in the state office record.</div>'}`;

  const push = (period, body) => {
    m.reports.push(Object.assign({period, filedIn:pLabel(S.period)}, body));
    m.reports.sort((a,b)=>pIdx(a.period)-pIdx(b.period));
    if(pIdx(period) > pIdx(m.lastReport||'2000-01')) m.lastReport = period;
  };
  if(miss.length) document.getElementById('catchup').onclick = ()=>{
    miss.forEach(p=>push(p, {services:0, conversions:0, baptisms:0, visits:0, tithed:m.tithing, note:'Nil-activity catch-up return.'}));
    render();
  };
  document.getElementById('rFile').onclick = ()=>{
    const n = id => Number(document.getElementById(id).value||0);
    m.tithing = document.getElementById('rTithe').checked;
    push(document.getElementById('rPeriod').value, {services:n('rServ'), conversions:n('rConv'),
      baptisms:n('rBap'), visits:n('rHome'), tithed:m.tithing, note:document.getElementById('rNote').value});
    render();
  };
}

/* ── Reaffirmation ─────────────────────────────────────────────────────── */
const AFFIRMATIONS = [
  {k:'df',  t:'The Declaration of Faith', d:'The fourteen articles adopted by the International General Assembly.'},
  {k:'doc', t:'The Doctrinal Commitments', d:'The Church of God Teachings as set forth by the Assembly.'},
  {k:'pc',  t:'The Practical Commitments', d:'Spiritual Example, Moral Purity, Personal Integrity, Family Responsibility, Behavioural Temperance, Modest Appearance, Social Obligation.'}
];
function vReaffirm(el){
  const m = me(), r = reaffFlag(m);
  el.innerHTML = `
  <h2 class="dh">Biennial doctrinal reaffirmation</h2>
  <p class="sub">Every credentialed minister affirms fidelity to the Church of God by reaffirming their commitment to the Declaration of Faith, the Doctrinal Commitments and the Practical Commitments. It is submitted <b>biennially, with the September ministerial report</b>. <span class="cite">S29 I.9</span></p>

  <div class="${r.ok?'note':'warnbox'}"><b>Yours: ${esc(r.label)}.</b> ${r.ok?'Next due September 2027.':'The last cycle closed with the September 2025 report. Until this is on file it appears as an open item on the bishop’s console beside your name.'}</div>

  <div class="card" style="margin-top:var(--s4)">
    <h3>Affirmation</h3>
    ${AFFIRMATIONS.map(a=>`<label class="cb"><input type="checkbox" class="aff" data-a="${a.k}"> <span><b>${esc(a.t)}</b> — ${esc(a.d)}</span></label>`).join('')}
    <hr class="sep">
    <p style="font-size:13.5px;color:var(--ink-soft)">I reaffirm my commitment to the above, and my fidelity to the Church of God.</p>
    <div class="grid g2" style="gap:var(--s2)">
      <div class="field"><label class="f" for="afName">Signature — type your full name</label><input id="afName" style="width:100%" placeholder="${esc(m.name)}"></div>
      <div class="field"><label class="f" for="afPeriod">Submitted with the report for</label><select id="afPeriod">${periods(14).map(p=>`<option value="${p}" ${p===S.period?'selected':''}>${pLabel(p)}</option>`).join('')}</select></div>
    </div>
    <button class="b" id="afGo" type="button" disabled>Record reaffirmation</button>
    <p style="margin-top:var(--s2);font-size:12.5px;color:var(--ink-faint)">A typed name is not a legal signature and this tool is not the filing. The affirmation goes to the state office with your September report; this records that you made it, and when.</p>
  </div>

  ${m.reaffirmations.length?`<p class="shead">On record</p>
  <div class="tw"><table><thead><tr><th>Period</th><th>Signed</th><th>Affirmed</th></tr></thead><tbody>
    ${m.reaffirmations.slice().reverse().map(x=>`<tr><td class="nm">${pLabel(x.period)}</td><td>${esc(x.name||'—')}</td>
      <td>${x.items?esc(x.items):'Declaration of Faith · Doctrinal Commitments · Practical Commitments'}</td></tr>`).join('')}
  </tbody></table></div>`:''}

  <p class="shead">What else the September report carries</p>
  <div class="grid g3">
    <div class="card"><h3>Eligibility</h3><p>Being current on personal reports — and, where you pastor, on local church reports with the required finances — is what makes you eligible for election or appointment at state or international level.</p><p><span class="cite">S29 I.9</span></p></div>
    <div class="card"><h3>The preference process</h3><p>Taking part in the administrative bishop preference and evaluation vote requires being current, or in covenant agreement, with both state and international reports including monies, and being active in tithing and attendance in a local congregation in that region.</p><p><span class="cite">S32 I.2–3</span></p></div>
    <div class="card"><h3>Doctrinal fidelity is disciplinable</h3><p>Unbecoming ministerial conduct is defined to include violations of doctrinal fidelity, and any such violation requires re-examination at the appropriate level.</p><p><span class="cite">S30 III.C.2–3</span></p></div>
  </div>`;

  const boxes = [...el.querySelectorAll('.aff')], name = document.getElementById('afName'), btn = document.getElementById('afGo');
  const sync = ()=>{ btn.disabled = !(boxes.every(b=>b.checked) && name.value.trim().length>2); };
  boxes.forEach(b=>b.onchange=sync); name.oninput=sync;
  btn.onclick = ()=>{
    const p = document.getElementById('afPeriod').value;
    m.reaffirmations.push({period:p, name:name.value.trim(), on:p, items:'Declaration of Faith · Doctrinal Commitments · Practical Commitments'});
    m.reaffirmed = p; render();
  };
}

/* ── Covenant review ───────────────────────────────────────────────────── */
function vMyCovenant(el){
  const m = me(), existing = lastReview(m.id);
  const draft = vMyCovenant._d = vMyCovenant._d || {scores:{}, note:''};
  const t = triadOf(m.id);
  el.innerHTML = `
  <h2 class="dh">Covenant review</h2>
  <p class="sub">The seven Practical Commitments are what you reaffirm once every two years in a single signature. This walks the same seven every quarter, in your own words, and asks one triad partner to confirm they have read it. The headings and the aim of each are the church's; the quarterly cadence and the ratings are the network's. <span class="cite">Practical Commitments I–VII</span> <span class="prac">cadence: network practice</span></p>

  ${existing?`<div class="note" style="margin-bottom:var(--s4)"><b>Last: ${esc(existing.period)}.</b> ${existing.confirmed?'Confirmed by '+esc(mById(existing.peer).name)+'.':'<b>Not yet confirmed</b> by '+esc(mById(existing.peer).name)+'.'} ${existing.note?'“'+esc(existing.note)+'”':''}</div>`:''}

  <div class="grid" style="gap:var(--s2)">
    ${COMMITMENTS.map(c=>{
      const cur = draft.scores[c.k] || (existing && existing.scores[c.k]) || '';
      return `<div class="cmt"><h4><var>${c.n}</var> ${esc(c.t)}</h4><p>${esc(c.aim)}</p>
        <div class="rate" data-k="${c.k}">${RATINGS.map(r=>`<button type="button" data-r="${r}" aria-pressed="${cur===r}">${r}</button>`).join('')}</div></div>`;
    }).join('')}
  </div>

  <div class="card" style="margin-top:var(--s4)">
    <h3>The part that matters</h3>
    <div class="field"><label class="f" for="cNote">Where is the strain, and what are you doing about it?</label>
      <textarea id="cNote" placeholder="Specific. Datable. Something a triad partner could ask you about in six weeks.">${esc(draft.note)}</textarea></div>
    <div class="field"><label class="f" for="cPeer">Triad partner who will confirm this</label>
      <select id="cPeer">${(t?t.members.filter(x=>x!==m.id):S.ministers.filter(x=>x.id!==m.id).map(x=>x.id)).map(x=>`<option value="${x}">${esc(mById(x).name)}</option>`).join('')}</select></div>
    <button class="b" id="cSave" type="button">Record review</button>
  </div>`;
  el.querySelectorAll('.rate').forEach(r=>r.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    draft.scores[r.dataset.k]=b.dataset.r; draft.note=document.getElementById('cNote').value; render();
  }));
  document.getElementById('cSave').onclick = ()=>{
    const q = 'Q'+(Math.floor((pIdx(S.period)%12)/3)+1);
    S.reviews.push({id:'r'+S.reviews.length+'-'+m.id, minister:m.id, period:S.period.slice(0,4)+' '+q,
      scores:Object.assign({}, existing?existing.scores:{}, draft.scores),
      note:document.getElementById('cNote').value, peer:document.getElementById('cPeer').value, confirmed:false});
    vMyCovenant._d = null; render();
  };
}

/* ── Triad ─────────────────────────────────────────────────────────────── */
function vMyTriad(el){
  const m = me(), t = triadOf(m.id);
  const pend = S.reviews.filter(x=>x.peer===m.id && !x.confirmed);
  el.innerHTML = `
  <h2 class="dh">My triad</h2>
  <p class="sub">Three ministers, five questions, weekly. The network's own addition, resting on the movement's stated commitment to interdependence — involving clergy in mentoring, coaching and consulting across every level to increase the level of trust and support among ministers. <span class="cite">Commitment 7</span> <span class="cite">Galatians 6:2</span></p>

  ${t?`<div class="card"><h3>${esc(t.name)} ${t.members.length<3?'<span class="chip bad">below three</span>':''}</h3>
    <p>${t.members.map(x=>esc(mById(x).name)+(x===m.id?' (you)':'')).join(' · ')}</p>
    <p><span class="chip ${t.checkins.length?'ok':'bad'}">${t.checkins.length} check-in${t.checkins.length===1?'':'s'}</span>
       ${t.checkins.length?`<span class="chip">last ${esc(t.checkins[t.checkins.length-1])}</span>`:''}</p></div>`
   :`<div class="warnbox">You are not in a triad. Pair accountability is not accountability — ask your administrative bishop to place you in a group of three.</div>`}

  ${pend.length?`<p class="shead">Awaiting your confirmation</p>
  <div class="aq">${pend.map(x=>`<div class="act p2"><div style="flex:1">
    <div class="who">${esc(mById(x.minister).name)} — ${esc(x.period)}</div>
    <div class="what">${esc(x.note||'No note written.')}</div>
    <div class="meta">${Object.entries(x.scores).filter(([,v])=>v==='Strained'||v==='Slipping').map(([k,v])=>`<span class="chip warn">${esc((COMMITMENTS.find(c=>c.k===k)||{}).t||k)}: ${esc(v)}</span>`).join('') || '<span class="chip ok">nothing marked strained</span>'}</div>
  </div><button class="b sm" data-conf="${x.id}" type="button">Confirm read</button></div>`).join('')}</div>
  <p class="note" style="margin-top:var(--s3)">Confirming is not agreeing that everything is fine. It means you have read it and you will ask about it again.</p>`:''}

  <p class="shead">The five questions</p>
  <div class="card">
    <ul class="ck">${TRIAD_Q.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>
    <p style="margin-top:var(--s3)">Then, always last, asked of whoever asked all the others: <b>“In anything you have just told us, have you lied to us?”</b></p>
    ${t?`<hr class="sep">
    <div class="field"><label class="f" for="tkNote">What came out of this week's meeting?</label><textarea id="tkNote" placeholder="One line is enough. Who is carrying what."></textarea></div>
    <button class="b" id="tkGo" type="button">Record this week's check-in</button>`:''}
  </div>

  ${t && t.checkins.length?`<p class="shead">Check-ins</p><div class="log">${t.checkins.slice().reverse().map(c=>`<div><b>${esc(c)}</b></div>`).join('')}</div>`:''}

  <div class="note" style="margin-top:var(--s4)"><b>What a triad is not.</b> Not a disciplinary body, with no standing to receive a charge. If something disclosed in a triad is a crime or a safeguarding matter, it leaves the triad the same day and goes to civil authorities — confidentiality does not preempt reporting law. <span class="cite">S29 I.8</span></div>`;

  el.querySelectorAll('[data-conf]').forEach(b=>b.onclick=()=>{
    const rv = S.reviews.find(x=>x.id===b.dataset.conf); rv.confirmed = true; render();
  });
  if(t) document.getElementById('tkGo').onclick = ()=>{
    t.checkins.push(S.period+'-'+String(new Date().getDate()).padStart(2,'0') + (document.getElementById('tkNote').value.trim()?' — '+document.getElementById('tkNote').value.trim():''));
    render();
  };
}

/* ── Advancement ───────────────────────────────────────────────────────── */
function vAdvance(el){
  const m = me(), rank = RANKS[m.rank];
  const done = GENERAL_REQS.filter(r=>reqMet(m,r.k)).length;
  el.innerHTML = `
  <h2 class="dh">Advancement</h2>
  <p class="sub">You hold the <b>${esc(m.rank)}</b> credential — ${rank.n} of 3. ${rank.next?`Advancement to ${esc(rank.next)} is an eleven-step process, most of which other people own. The steps that are yours are marked.`:'There is no further rank.'}</p>

  <div class="grid g2">
    <div class="card"><h3>Rights and authorities at your rank</h3>
      <ul class="ck tick">${rank.rights.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>
      <p style="margin-top:var(--s2)"><span class="cite">${esc(rank.cite)}</span></p></div>
    <div class="card"><h3>General requirements — ${done} of ${GENERAL_REQS.length}</h3>
      <p>These apply to every applicant, <em>including those advancing in rank</em>. They do not lapse once a credential is held.</p>
      ${GENERAL_REQS.map(r=>`<label class="cb ${reqMet(m,r.k)?'on':''}"><input type="checkbox" data-req="${r.k}" ${reqMet(m,r.k)?'checked':''}> <span>${esc(r.t)} <span class="cite">${esc(r.cite)}</span></span></label>`).join('')}
    </div>
  </div>

  ${rank.next?`
  <p class="shead">The eleven steps to ${esc(rank.next)}</p>
  <div class="steps">${ADVANCE.map((st,i)=>`
    <div class="step ${i===0?'now':'pend'}"><div class="dot"><i>${i+1}</i><u></u></div>
      <div class="body"><h4>${esc(st.t)}</h4><p>${esc(st.who)}</p></div></div>`).join('')}
  </div>

  <p class="shead">The Ministerial Internship Program</p>
  <div class="grid g2">
    <div class="card"><h3>Who it is for</h3>
      <p>Every exhorter participates in the MIP, or its equivalent, before being promoted to the rank of ordained minister. Participants must be licensed at exhorter level, or in the licensing process having passed the examination and awaiting certification, before being eligible.</p>
      <p>The programme gives beginning ministers a structured internship under an experienced and competent pastor.</p>
      <p><span class="cite">S21 I–II</span></p></div>
    <div class="card"><h3>Your MIP status</h3>
      <div class="field"><label class="f" for="mipS">Status</label><select id="mipS">
        ${[['none','Not started'],['progress','In progress'],['done','Complete']].map(([v,t])=>`<option value="${v}" ${m.mip.status===v?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label class="f" for="mipR">Equivalency route, if not the programme itself</label>
        <select id="mipR"><option value="">— the MIP itself —</option>${MIP_ROUTES.map(r=>`<option value="${esc(r)}" ${m.mip.route===r?'selected':''}>${esc(r)}</option>`).join('')}</select></div>
      <p style="font-size:12.5px;color:var(--ink-faint)">Equivalency is the MIP reading requirement under the supervision of the state overseer, or one whom he appoints, <em>plus</em> one of the four routes. <span class="cite">S21 II.4</span></p>
      <button class="b sm" id="mipSave" type="button">Save</button></div>
  </div>`:''}

  <p class="shead">The examination</p>
  <div class="grid g3">
    <div class="card"><h3>Three sections, one sitting</h3><p>Bible; Church of God History and Polity; Doctrine. Issued from the state overseer's office, on a date and at a place he sets, monitored and collected by a person he appoints.</p></div>
    <div class="card"><h3>The thresholds</h3><ul class="ck">
      <li>Below <b>60%</b> on any one section — that section must be repeated before going to the board</li>
      <li>An average of <b>70%</b> across the whole examination is required to go before the board at all</li></ul></div>
    <div class="card"><h3>The oral board</h3><p>At least three ordained bishops appointed by the state overseer. They hold your written scores, and may examine you in any area of ministry and ministerial preparation appropriate to the rank you are applying for.</p></div>
  </div>

  <p class="shead">Study tracker</p>
  <div class="grid g3">${STUDY.map(s=>`
    <div class="card"><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>
      <div style="height:8px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin:var(--s2) 0">
        <div style="height:100%;width:${m.study[s.k]}%;background:var(--c)"></div></div>
      <div class="row"><input type="range" min="0" max="100" step="5" value="${m.study[s.k]}" data-study="${s.k}" style="flex:1">
        <span class="chip">${m.study[s.k]}%</span></div></div>`).join('')}
  </div>
  <p class="note" style="margin-top:var(--s3)">The study guide is your personal property and is meant to stay in your library for reference. This tracker is the network's, not the church's — nobody is graded on it. <span class="prac">network practice</span></p>

  ${m.rank==='Ordained Minister'?`
  <p class="shead">Ordination as bishop — the thresholds</p>
  <div class="card"><ul class="ck">
    <li><b>25 years of age</b> with at least <b>eight years</b> of active ministry, or</li>
    <li><b>25</b> with <b>three years</b> of active ministry accompanied by a ministry-related degree or equivalency from an accredited institution or one certified by the Division of Education, or</li>
    <li><b>30 years of age</b> with at least <b>five years</b> of active ministry, if otherwise qualified</li>
    <li>Exceptions to the age qualification can be made for verifiable prior ministerial experience, on the recommendation of your administrative bishop and with the approval of the Executive Council</li>
    <li>For military chaplains the International Executive Committee may waive age, time and performance minimums</li>
  </ul>
  <p style="margin-top:var(--s2)">You have <b>${m.ministryYears}</b> years of active ministry recorded. <span class="cite">Study guide, General Information</span></p>
  <p style="font-size:12.5px;color:var(--ink-faint)">The Minutes also record that female ministers are not eligible for ordination as bishop. The network states the rule as written; it does not apply it silently.</p></div>`:''}`;

  el.querySelectorAll('[data-req]').forEach(cb=>cb.onchange=()=>{ setReq(m, cb.dataset.req, cb.checked); render(); });
  el.querySelectorAll('[data-study]').forEach(r=>r.oninput=()=>{ m.study[r.dataset.study]=Number(r.value); render(); });
  const ms = document.getElementById('mipSave');
  if(ms) ms.onclick = ()=>{ m.mip.status=document.getElementById('mipS').value; m.mip.route=document.getElementById('mipR').value; render(); };
}
function reqMet(m,k){
  if(k==='tithing')   return !!m.tithing;
  if(k==='bgconsent') return !!m.bgConsent;
  return m.acks['req_'+k] ? true : false;
}
function setReq(m,k,v){
  if(k==='tithing')        m.tithing = v;
  else if(k==='bgconsent') m.bgConsent = v;
  else if(v)               m.acks['req_'+k] = S.period;
  else                     delete m.acks['req_'+k];
}

/* ── Standing instructions ─────────────────────────────────────────────── */
function vInstructions(el){
  const m = me(), open = INSTRUCTIONS.filter(i=>!m.acks[i.k]).length;
  el.innerHTML = `
  <h2 class="dh">Standing instructions</h2>
  <p class="sub">The obligations that sit on a credential permanently, rather than falling due monthly. ${open?`<b>${open} of ${INSTRUCTIONS.length}</b> are not yet acknowledged.`:'All acknowledged.'} Acknowledging is not a signature and it does not create an obligation — the obligation is already there. It records that you have read it, and when. <span class="cite">S29 I</span></p>

  <div class="grid" style="gap:var(--s2)">${INSTRUCTIONS.map(i=>{
    const on = m.acks[i.k];
    return `<div class="cmt">
      <h4>${esc(i.t)} ${on?`<span class="chip ok">acknowledged ${pLabel(on)}</span>`:'<span class="chip warn">not acknowledged</span>'}</h4>
      ${i.d?`<p>${esc(i.d)}</p>`:''}
      <div class="row"><span class="cite">${esc(i.cite)}</span>
        <button class="b ${on?'quiet':''} sm" data-ack="${i.k}" type="button">${on?'Withdraw':'Acknowledge'}</button></div></div>`;
  }).join('')}</div>

  <p class="shead">Two that are not optional in any circumstance</p>
  <div class="grid g2">
    <div class="warnbox"><b>Reporting overrides confidence.</b> You are not required to violate a confidence entrusted to you in the performance of your duties — except with the express permission of the person who confided, or to prevent a crime. That provision does not preempt any applicable reporting law and may not be used to conceal a felonious act toward another individual. <span class="cite">S29 I.8</span></div>
    <div class="warnbox"><b>Resignation does not evade a charge.</b> Ministers who resign to evade charges instituted, or being instituted, against them as a result of alleged offending conduct are considered guilty. And the disciplinary record of every minister is cumulative — the entire record is considered in any disciplinary action. <span class="cite">S30 V.4</span> <span class="cite">S30 V.1</span></div>
  </div>`;
  el.querySelectorAll('[data-ack]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.ack; if(m.acks[k]) delete m.acks[k]; else m.acks[k]=S.period; render();
  });
}

/* ── My file ───────────────────────────────────────────────────────────── */
function vMyFile(el){
  const m = me(), b = bgFlag(m), rt = restorationOf(m.id);
  const cs = S.concerns.filter(c=>c.subject===m.id);
  const ch = churchOfPastor(m.id);
  el.innerHTML = `
  <h2 class="dh">My file</h2>
  <p class="sub">What the record holds about you, and who can see it. The administrative bishop sees all of this. A congregation sees none of it — including the congregation you pastor.</p>

  <div class="grid g2">
    <div class="card"><h3>Credential</h3>
      <dl class="kv">
        <dt>Rank</dt><dd>${esc(m.rank)}</dd>
        <dt>Status</dt><dd>${esc(m.status)}</dd>
        <dt>Charge</dt><dd>${esc(m.church)}</dd>
        <dt>District</dt><dd>${esc(m.district)}</dd>
        <dt>Active years</dt><dd>${m.ministryYears}</dd>
        <dt>Reports filed</dt><dd>${m.reports.length} through this intranet · last period ${pLabel(m.lastReport)}</dd>
        <dt>Reaffirmed</dt><dd>${esc(reaffFlag(m).label)}</dd>
      </dl></div>
    <div class="card"><h3>Criminal background check</h3>
      <p><span class="chip ${b.cls}">${esc(b.label)}</span></p>
      <div class="field"><label class="f" for="bgDate">Date of check</label><select id="bgDate"><option value="">— none on file —</option>${periods(26).map(p=>`<option value="${p}" ${p===m.bgCheck?'selected':''}>${pLabel(p)}</option>`).join('')}</select></div>
      <div class="field"><label class="f" for="bgProv">Conducted by</label><input id="bgProv" value="${esc(m.bgProvider)}" placeholder="State/regional office" style="width:100%"></div>
      <label class="cb ${m.bgConsent?'on':''}"><input type="checkbox" id="bgCon" ${m.bgConsent?'checked':''}> I consent to the state/regional office conducting criminal background checks <span class="cite">S21 IV.6</span></label>
      <button class="b sm" id="bgSave" type="button">Save</button>
      <p style="margin-top:var(--s2);font-size:12.5px;color:var(--ink-faint)">Any person placed, appointed or hired for a ministry position in a local congregation should have one. The five-year renewal is the network's convention, not the Assembly's. <span class="cite">S29 I.11</span> <span class="prac">renewal: network practice</span></p></div>

    ${ch?`<div class="card"><h3>The church you pastor</h3>
      <p>${esc(ch.name)} — ${esc(chLadder(ch).t.toLowerCase())} on its own report. Its record is the congregation's, kept on the church intranet by the pastor and treasurer together.</p>
      <button class="b ghost sm" data-go="church:${ch.id}" type="button">Open the church intranet</button></div>`:''}

    ${cs.length?`<div class="card"><h3>Concerns naming you</h3>
      ${cs.map(c=>`<p><b>${esc(c.id)}</b> — ${esc(c.category)} · ${c.closed?'closed':'at '+esc(STAGES[stageIdx(c.stage)].t)}</p>`).join('')}
      <p style="font-size:12.5px">You have the right to know the charge and who brought it, in writing; to be presumed innocent; to refute it and produce witnesses; to face your accuser and be present while evidence is heard; and to invite one credentialed minister to be with you for personal support. No legal counsel is present in an ecclesiastical hearing. <span class="cite">S31 I.B.5</span></p></div>`
     :`<div class="card"><h3>Concerns</h3><p>Nothing on record names you. You would be notified of a charge in writing, with the name of the person bringing it, before anything proceeded. <span class="cite">S31 I.B.5.b</span></p></div>`}

    ${rt?`<div class="card"><h3>Restoration track ${esc(rt.id)}</h3>
      <p>${esc(RCLASS[rt.rclass].t)} — entered ${esc(rt.enteredOn)}, month ${monthsBetween(rt.enteredOn,S.period)} of a minimum ${RCLASS[rt.rclass].months}.</p>
      <p>${esc(RCLASS[rt.rclass].note)}</p>
      <p><span class="cite">${esc(RCLASS[rt.rclass].cite)}</span></p></div>`:''}
  </div>

  <p class="shead">Who sees what</p>
  <div class="tw"><table><thead><tr><th>Record</th><th>You</th><th>Your triad</th><th>Your congregation</th><th>Administrative bishop</th></tr></thead><tbody>
    ${[['Monthly reports','yes','no','no','yes'],
       ['Doctrinal reaffirmation','yes','no','no','yes'],
       ['Background check','yes','no','no','yes'],
       ['Covenant review','yes','the confirming partner only','no','yes'],
       ['Triad check-ins','yes','yes','no','count only'],
       ['Concerns and discipline','yes','no','no','yes'],
       ['Study tracker','yes','no','no','no']
      ].map(r=>`<tr><td class="nm">${r[0]}</td>${r.slice(1).map(c=>`<td><span class="chip ${c==='no'?'':'ok'}">${c}</span></td>`).join('')}</tr>`).join('')}
  </tbody></table></div>`;
  goTab(el);
  document.getElementById('bgSave').onclick = ()=>{
    m.bgCheck = document.getElementById('bgDate').value;
    m.bgProvider = document.getElementById('bgProv').value.trim();
    m.bgConsent = document.getElementById('bgCon').checked;
    render();
  };
}

/* ── boot ──────────────────────────────────────────────────────────────── */
const sel = document.getElementById('asWho');
sel.innerHTML = S.ministers.map(m=>`<option value="${m.id}">${esc(m.name)} — ${esc(m.rank)}</option>`).join('');
sel.value = view.who;
sel.onchange = e=>{ view.who=e.target.value; localStorage.setItem('mendingnet.me', view.who); vMyCovenant._d=null; render(); };
document.getElementById('period').innerHTML = periods(14).map(p=>`<option value="${p}" ${p===S.period?'selected':''}>${pLabel(p)}</option>`).join('');
document.getElementById('period').onchange = e=>{ S.period=e.target.value; render(); };
wireTheme(); wireReset();
render();
