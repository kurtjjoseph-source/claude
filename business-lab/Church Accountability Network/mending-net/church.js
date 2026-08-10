/* ══════════════════════════════════════════════════════════════════════════
   THE CHURCH INTRANET
   A congregation is an accountable body in its own right, with its own report,
   its own funds, its own offices and its own delinquency ladder. This is where
   a pastor and a treasurer discharge all of it together. It holds no
   ministerial discipline record — not even its own pastor's.
   ══════════════════════════════════════════════════════════════════════════ */

view.church = qs('c') || localStorage.getItem('mendingnet.ch') || 'ch3';
if(!S.churches.some(c=>c.id===view.church)) view.church = S.churches[0].id;
localStorage.setItem('mendingnet.ch', view.church);
const us = () => chById(view.church);

/* S52 III / S53 II / S55 I.B — the qualification lists, which are nearly the
   same list three times over. Stated once, applied where each one applies. */
const QUALS = [
  'A loyal member of the church, adhering to its teachings',
  'Baptised in the Holy Ghost',
  'Faithful in tithing',
  'A regular church attendant',
  'One who works in harmony with the local, state and general church programme'
];
const CONF_ORDER = [
  'Financial reports of the various departments of the church',
  'Other reports of committees',
  'Transfer of membership, if any',
  'Unfinished business from the previous meeting',
  'New business'
];
/* S48 I.B — what an applicant for membership is asked to affirm. Summarised. */
const MEMBER_CHARGE = [
  'That they know Jesus Christ as personal Saviour in the full pardon of their sins',
  'That they are willing to walk in the light of Scripture as it shines on their path',
  'That they will abide by and subscribe to the discipline of the Church of God as set out in the Minutes',
  'That they will support the church with their attendance and temporal means as the Lord prospers them',
  'That they will be subject to the counsel and admonition of those over them in the Lord',
  'And the congregation is given the opportunity to state any legal objection before fellowship is extended'
];

const CTABS = [['home','Our standing'],['report','Monthly report'],['officers','Officers & council'],
  ['conference','Conference'],['members','Membership'],['safeguard','Safeguarding'],
  ['progress','Progress'],['concern','Raising a concern']];
if(!CTABS.some(t=>t[0]===view.tab)) view.tab = 'home';

function renderTabs(){
  const ch = us();
  const counts = {home: chTodo(ch).filter(t=>t.p===1).length, report: chLadder(ch).months,
    officers: officerGaps(ch).length, conference: confAge(ch)>12?1:0,
    safeguard: (ch.roster||[]).filter(p=>!p.bg).length};
  document.getElementById('tabs').innerHTML = CTABS.map(([k,t])=>
    `<button type="button" data-tab="${k}" aria-current="${view.tab===k}">${t}${counts[k]?`<span class="n">${counts[k]}</span>`:''}</button>`).join('');
  document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{ view.tab=b.dataset.tab; render(); window.scrollTo({top:0,behavior:'smooth'}); });
}
function render(){
  const ch = us();
  document.getElementById('whoName').textContent = ch.name;
  document.getElementById('whoMeta').textContent = ch.district + ' district · ' + ch.membership + ' members · ' + mById(ch.pastor).name;
  renderTabs();
  document.querySelectorAll('.pane').forEach(p=>p.classList.remove('on'));
  const pane = document.getElementById('p-'+view.tab); pane.classList.add('on');
  ({home:vHome, report:vReport, officers:vOfficers, conference:vConference, members:vMembers,
    safeguard:vSafe, progress:vProg, concern:vConcern})[view.tab](pane);
  save();
}
function goTab(el){
  el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{
    const g = b.dataset.go;
    if(g.startsWith('minister:')) return goMinister(g.split(':')[1]);
    view.tab = g; render(); window.scrollTo({top:0,behavior:'smooth'});
  });
}
const confAge = ch => ch.lastConference ? pIdx(S.period)-pIdx(ch.lastConference) : 99;
function officerGaps(ch){
  const req = councilRequired(ch.membership), out = [];
  if(ch.councilMembers.length < req) out.push('council');
  if(!ch.treasurer) out.push('treasurer');
  if(ch.financeMembers.length < 2) out.push('finance');
  if(ch.trustees.length < 3) out.push('trustees');
  return out;
}

/* ── Our standing ──────────────────────────────────────────────────────── */
function vHome(el){
  const ch = us(), l = chLadder(ch), g = chGrowth(ch), todo = chTodo(ch);
  const checks = chChecks(ch), polity = checks.filter(c=>!c.ok && c.why==='polity');
  el.innerHTML = `
  <h2 class="dh">What this church owes, and what discharges it</h2>
  <p class="sub">The congregation's own record — what the state and international offices can currently see, and what is outstanding before the fifth of next month. It is the same view the administrative bishop has of you, which is the point: nothing here should ever be a surprise. Nothing about any minister's personal standing appears on this surface.</p>

  <div class="grid g4">
    <div class="kpi ${l.months===0?'':(l.months>=2?'alert':'warnk')}"><div class="v" style="font-size:20px">${l.months===0?'Current':l.months+' mo behind'}</div><div class="k">Monthly report · S53 III.6</div></div>
    <div class="kpi ${ch.delinquentFunds?'alert':''}"><div class="v" style="font-size:20px">${ch.delinquentFunds?'€'+ch.delinquentFunds.toLocaleString('en-GB'):'Clear'}</div><div class="k">Ministry money owed</div></div>
    <div class="kpi ${polity.length?'warnk':''}"><div class="v">${polity.length}</div><div class="k">Required items open</div></div>
    <div class="kpi ${confAge(ch)>12?'warnk':''}"><div class="v" style="font-size:20px">${ch.lastConference?confAge(ch)+' mo':'never'}</div><div class="k">Since last conference · S50 II.4</div></div>
  </div>

  <div class="${l.months===0?'note':'warnbox'}" style="margin-top:var(--s3)"><b>${esc(l.t)}.</b> ${esc(l.d)} <span class="cite">${esc(l.cite)}</span></div>

  <p class="shead">Where this church sits on the reporting ladder</p>
  <div class="steps">${CH_LADDER.map(s=>`
    <div class="step ${l.months>s.at?'done':(l.months===s.at||(s.at===4&&l.months>4))?'now':'pend'}">
      <div class="dot"><i>${s.at===0?'✓':s.at}</i><u></u></div>
      <div class="body"><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p><span class="cite">${esc(s.cite)}</span></div></div>`).join('')}
  </div>
  <p class="note">The first three rungs are described in the Minutes as a <b>recommended</b> procedure, not an automatic penalty. The fourth is not: a pastor found at fault who has failed to send church reports for four months or more is subject to disciplinary action up to revocation of credentials. This tool shows the recommendation and the section; it decides nothing. <span class="cite">S55 III.A</span></p>

  <p class="shead">Outstanding — ${todo.length} item${todo.length===1?'':'s'}</p>
  <div class="aq">${todo.map(t=>`<div class="act p${t.p}"><div style="flex:1">
    <div class="who">${esc(t.t)}</div><div class="what">${esc(t.d)}</div>
    <div class="meta">${t.cite==='—'?'<span class="prac">network practice</span>':`<span class="cite">${esc(t.cite)}</span>`}</div>
  </div><button class="b ghost sm" data-go="${routeFor(t)}" type="button">Do it</button></div>`).join('')
   || '<div class="note">Nothing outstanding. File by the fifth and keep the conference date in view.</div>'}
  </div>

  <p class="shead">Twelve-month picture</p>
  <div class="grid g4">
    <div class="kpi"><div class="v">${g.attNow}</div><div class="k">Average attendance${g.attDelta!==null?` · ${g.attDelta>0?'+':''}${g.attDelta}% yr/yr`:''}</div></div>
    <div class="kpi"><div class="v">${g.conversions12}</div><div class="k">Conversions · goal ${g.convGoal}</div></div>
    <div class="kpi"><div class="v">${g.baptisms12} / ${g.spirit12}</div><div class="k">Water / Holy Ghost baptisms</div></div>
    <div class="kpi"><div class="v">€${g.remitted12.toLocaleString('en-GB')}</div><div class="k">Remitted to Intl + State</div></div>
  </div>
  <p style="margin-top:var(--s3)" class="row">
    <button class="b sm" data-go="report" type="button">File the monthly report</button>
    <button class="b ghost sm" data-go="progress" type="button">Full progress record</button></p>`;
  goTab(el);
}
function routeFor(t){
  if(t.t.startsWith('File')) return 'report';
  if(/background/i.test(t.t)) return 'safeguard';
  if(/conference/i.test(t.t)) return 'conference';
  if(/council|treasurer|Finance|bookkeep/i.test(t.t)) return 'officers';
  return 'officers';
}

/* ── Monthly report ────────────────────────────────────────────────────── */
function chMissing(ch){
  const out = [];
  if(!ch.lastReport) return out;
  for(let i=pIdx(ch.lastReport)+1;i<pIdx(S.period);i++){ const y=Math.floor(i/12), m=i%12+1; out.push(y+'-'+String(m).padStart(2,'0')); }
  return out;
}
function vReport(el){
  const ch = us(), miss = chMissing(ch);
  const last = (ch.reports||[]).slice(-1)[0] || {attendance:ch.membership, conversions:1, tithes:ch.membership*24};
  el.innerHTML = `
  <h2 class="dh">Monthly church report</h2>
  <p class="sub">Prepared by the treasurer and sent <b>by the fifth of each month</b> — one copy to the secretary general, one to the state overseer, on the forms provided by the secretary general's office. The tithe of tithes goes with it, and a later report does not clear an earlier one. <span class="cite">S53 III.6</span> <span class="cite">S55 II.1</span></p>

  <div class="grid g2">
    <div class="card">
      <h3>Outstanding</h3>
      ${miss.length?`<p><b>${miss.length} unfiled period${miss.length===1?'':'s'}:</b> ${miss.map(pLabel).join(', ')}.</p>
        <button class="b sm" id="catchup" type="button">File all ${miss.length} outstanding</button>
        <p style="margin-top:var(--s2);font-size:12.5px;color:var(--ink-faint)">Catching up carries each period's own remittance at 10% of that period's tithes. Where a period's figures differ from the last filed month, file it individually instead.</p>`
       :`<p>Nothing outstanding. Last filed for ${pLabel(ch.lastReport)}.</p>`}
      <hr class="sep">
      <h3>The split, as set by the Assembly</h3>
      <p>Since 1 September 2014 the local church treasurer sends <b>5% of tithes received to the International Office</b> and an equal <b>5% to the state/regional office</b>, with the monthly report. The remainder is for the support of the pastor. <span class="cite">S55 II.1</span></p>
      <p>Surplus tithes are for the benefit of the ministry as decided by the state overseer, pastor and local church; churches with surplus are encouraged to sponsor a work in a new field, and to furnish a monthly report on that work's progress. <span class="cite">S55 II.2</span></p>
      <hr class="sep">
      <h3>Money owed</h3>
      <div class="field"><label class="f" for="owed">Accumulated delinquent funds (€)</label><input id="owed" type="number" min="0" value="${ch.delinquentFunds}" style="width:100%"></div>
      <button class="b quiet sm" id="owedSave" type="button">Update</button>
      <p style="margin-top:var(--s2);font-size:12.5px;color:var(--ink-faint)">There is no provision for forgiveness of ministry money owed. The four routes are immediate payment, a payment plan, partial payment with partial assistance, or full assistance once the others are exhausted and the debt is beyond this church's ability to satisfy within twelve months — funded by an individual, another local church, the state office, international headquarters, or a combination. <span class="cite">S55 III.B</span></p>
    </div>
    <div class="card">
      <h3>Report for ${pLabel(miss[0] || S.period)}</h3>
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
      <div class="field"><label class="f" for="hPeriod">Period</label><select id="hPeriod">${periods(14).map(p=>`<option value="${p}" ${p===(miss[0]||S.period)?'selected':''}>${pLabel(p)}</option>`).join('')}</select></div>
      <button class="b" id="hFile" type="button">File church report</button>
    </div>
  </div>

  <p class="shead">What the treasurer also owes, and when</p>
  <div class="grid g4">
    <div class="card"><h3>Weekly</h3><p>An itemised list of all receipts and disbursements furnished to the pastor.</p><p><span class="cite">S53 III.8</span></p></div>
    <div class="card"><h3>Monthly</h3><p>This report, by the fifth — plus the MAP return naming members who have moved away from this church to another area.</p><p><span class="cite">S53 III.3, III.6</span></p></div>
    <div class="card"><h3>Quarterly</h3><p>A financial report prepared for each quarterly conference.</p><p><span class="cite">S53 III.7</span></p></div>
    <div class="card"><h3>Always</h3><p>The pastor and treasurer sign all authorised cheques; money is disbursed under the direction of the pastor.</p><p><span class="cite">S53 III.9</span></p></div>
  </div>

  ${ch.reports.length?`<p class="shead">Filed history</p>
  <div class="tw"><table><thead><tr><th>Period</th><th>Attendance</th><th>Conversions</th><th>Baptisms</th><th>Tithes</th><th>Intl 5%</th><th>State 5%</th><th>Remitted</th></tr></thead><tbody>
    ${ch.reports.slice().reverse().slice(0,18).map(r=>`<tr><td class="nm">${pLabel(r.period)}</td><td>${r.attendance}</td><td>${r.conversions}</td>
      <td>${r.baptisms||0} / ${r.spirit||0}</td><td>€${(r.tithes||0).toLocaleString('en-GB')}</td><td>€${(r.intl||0).toLocaleString('en-GB')}</td>
      <td>€${(r.state||0).toLocaleString('en-GB')}</td><td><span class="chip ${r.remitted===false?'bad':'ok'}">${r.remitted===false?'no':'yes'}</span></td></tr>`).join('')}
  </tbody></table></div>`:''}`;

  const paint = ()=>{
    const t = Number(document.getElementById('hTithes').value||0), cut = Math.round(t*0.05);
    document.getElementById('splitBox').innerHTML =
      `On €${t.toLocaleString('en-GB')} of tithes: <b>€${cut.toLocaleString('en-GB')}</b> to the International Office, <b>€${cut.toLocaleString('en-GB')}</b> to the state/regional office, <b>€${(t-2*cut).toLocaleString('en-GB')}</b> remaining for the support of the pastor. <span class="cite">S55 II.1</span>`;
  };
  document.getElementById('hTithes').oninput = paint; paint();

  const push = (period, r) => {
    ch.reports.push(Object.assign({period}, r));
    ch.reports.sort((a,b)=>pIdx(a.period)-pIdx(b.period));
    if(pIdx(period) > pIdx(ch.lastReport||'2000-01')) ch.lastReport = period;
  };
  if(miss.length) document.getElementById('catchup').onclick = ()=>{
    miss.forEach(p=>{ const t = last.tithes;
      push(p, {attendance:last.attendance, conversions:0, baptisms:0, spirit:0, added:0,
        tithes:t, intl:Math.round(t*0.05), state:Math.round(t*0.05), remitted:true, note:'Catch-up filing.'});
    });
    render();
  };
  document.getElementById('owedSave').onclick = ()=>{ ch.delinquentFunds = Number(document.getElementById('owed').value||0); render(); };
  document.getElementById('hFile').onclick = ()=>{
    const n = id => Number(document.getElementById(id).value||0);
    const t = n('hTithes');
    push(document.getElementById('hPeriod').value, {attendance:n('hAtt'), conversions:n('hConv'), baptisms:n('hBap'),
      spirit:n('hSpirit'), added:n('hAdd'), tithes:t, intl:Math.round(t*0.05), state:Math.round(t*0.05),
      remitted:document.getElementById('hRemit').checked, note:document.getElementById('hNote').value});
    ch.membership += n('hAdd');
    render();
  };
}

/* ── Officers & council ────────────────────────────────────────────────── */
function roster(title, list, key, min, cite, note, addLabel){
  return `<div class="card"><h3>${esc(title)} ${list.length>=min?`<span class="chip ok">${list.length}</span>`:`<span class="chip bad">${list.length} of ${min}</span>`}</h3>
    <p>${note}</p>
    ${list.length?`<ul class="ck">${list.map((p,i)=>`<li><b>${esc(p.name)}</b> <button class="b danger sm" data-rm="${key}:${i}" type="button">remove</button></li>`).join('')}</ul>`:'<p><em>Nobody appointed.</em></p>'}
    <div class="row" style="margin-top:var(--s3)"><input id="add_${key}" placeholder="${esc(addLabel)}" style="flex:1">
      <button class="b sm" data-add="${key}" type="button">Add</button></div>
    <p style="margin-top:var(--s2)"><span class="cite">${esc(cite)}</span></p></div>`;
}
function vOfficers(el){
  const ch = us(), req = councilRequired(ch.membership);
  el.innerHTML = `
  <h2 class="dh">Officers &amp; council</h2>
  <p class="sub">The offices a local Church of God congregation keeps, the number required at this membership, and who currently holds each one. The council is elected biennially by ballot from the loyal members and the pastor chairs it; the treasurer is appointed by the pastor and confirmed by the council and/or the church body.</p>

  <div class="grid g2">
    ${roster('Church and Pastor’s Council', ch.councilMembers, 'councilMembers', req,
      'S52 I–II', `Not fewer than <b>${req}</b> councillors at ${ch.membership} members. Elected biennially and by ballot; a rotation system may be used. Last elected ${ch.councilElected?pLabel(ch.councilElected):'—'}.`, 'Name of councillor')}
    ${roster('Finance Committee', ch.financeMembers, 'financeMembers', 2,
      'S55 I.A', 'The treasurer plus <b>two</b> other members, appointed by the pastor and confirmed by the Church and Pastor’s Council and/or the members. They receive and count all monies and prepare funds for deposit.', 'Name of committee member')}
    ${roster('Local Board of Trustees', ch.trustees, 'trustees', 3,
      'S57 I–II', 'Every congregation that owns property appoints not fewer than <b>three</b> trustees, selected by the congregation in a business meeting. They hold title to and manage all local property for the sole and exclusive benefit of the Church of God.', 'Name of trustee')}
    ${roster('Assistant pastors', ch.assistants, 'assistants', 0,
      'S51 IV', 'Nominated by the local church and pastor, subject to the approval and appointment of the state overseer. Anyone in a ministry position here also needs a background check.', 'Name of assistant pastor')}
  </div>

  <div class="grid g2" style="margin-top:var(--s3)">
    <div class="card"><h3>Church treasurer</h3>
      <div class="field"><label class="f" for="tr">Appointed</label><input id="tr" value="${esc(ch.treasurer)}" placeholder="Name" style="width:100%"></div>
      <div class="field"><label class="f" for="cel">Council last elected</label><select id="cel">${periods(30).map(p=>`<option value="${p}" ${p===ch.councilElected?'selected':''}>${pLabel(p)}</option>`).join('')}</select></div>
      <label class="cb ${ch.bookkeeping?'on':''}"><input type="checkbox" id="bk" ${ch.bookkeeping?'checked':''}> An adequate bookkeeping system is in use and the treasurer holds a current copy of the Minutes <span class="cite">S53 I.3</span></label>
      <label class="cb ${ch.propertyInsured?'on':''}"><input type="checkbox" id="ins" ${ch.propertyInsured?'checked':''}> All church properties are properly insured <span class="cite">S52 IV.2</span></label>
      <label class="cb ${ch.taxExempt?'on':''}"><input type="checkbox" id="tax" ${ch.taxExempt?'checked':''}> Properties are tax-exempt where the secular government provides such exemption <span class="cite">S52 IV.2</span></label>
      <div class="field" style="margin-top:var(--s2)"><label class="f" for="maj">Amount this congregation treats as a major disbursement (€)</label><input id="maj" type="number" min="0" value="${ch.majorDisbursement}" style="width:100%"></div>
      <p style="font-size:12.5px;color:var(--ink-faint)">All major disbursements must be approved by the church in conference, and each congregation determines for itself what amount constitutes a major disbursement. <span class="cite">S52 IV.2</span></p>
      <button class="b" id="oSave" type="button">Save</button></div>
    <div class="card"><h3>Qualifications — the same list, three times over</h3>
      <p>A member serving on the Church and Pastor's Council, as treasurer, or on the Finance Committee must be:</p>
      <ul class="ck">${QUALS.map(q=>`<li>${esc(q)}</li>`).join('')}</ul>
      <p style="margin-top:var(--s2)">The treasurer additionally performs their duties under the supervision of the pastor and with their approval. Any exception to these qualifications must be approved by the state overseer. Trustees must be members in good standing.</p>
      <p><span class="cite">S52 III</span> <span class="cite">S53 II</span> <span class="cite">S55 I.B</span> <span class="cite">S57 III.4</span></p>
      <hr class="sep">
      <h3>Elders and deacons</h3>
      <p>The Assembly affirms the Scriptural pattern of elders and deacons, and every congregation, in consultation with the state or territorial overseer, is encouraged to implement it.</p>
      <p><span class="cite">S48 II</span></p></div>
  </div>

  <p class="shead">What the trustees cannot do alone</p>
  <div class="note">To buy, sell, exchange, transfer or convey local property, or to borrow against it, four conditions must all be met: the proposition is first presented to a regular or called conference of the local church; presided over by the state overseer or their appointee; approved by a <b>two-thirds majority</b> vote; and the board holds written certification from the state overseer that the proposition is not adverse to the interest of the Church of God. <span class="cite">S57 II.2</span></div>`;

  el.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{
    const k = b.dataset.add, v = document.getElementById('add_'+k).value.trim();
    if(!v) return; ch[k].push({name:v});
    if(k==='councilMembers') ch.council = ch.councilMembers.length;
    if(k==='financeMembers') ch.financeCttee = ch.financeMembers.length;
    render();
  });
  el.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{
    const [k,i] = b.dataset.rm.split(':'); ch[k].splice(Number(i),1);
    if(k==='councilMembers') ch.council = ch.councilMembers.length;
    if(k==='financeMembers') ch.financeCttee = ch.financeMembers.length;
    render();
  });
  document.getElementById('oSave').onclick = ()=>{
    ch.treasurer = document.getElementById('tr').value.trim();
    ch.councilElected = document.getElementById('cel').value;
    ch.bookkeeping = document.getElementById('bk').checked;
    ch.propertyInsured = document.getElementById('ins').checked;
    ch.taxExempt = document.getElementById('tax').checked;
    ch.majorDisbursement = Number(document.getElementById('maj').value||0);
    render();
  };
}

/* ── Conference ────────────────────────────────────────────────────────── */
function vConference(el){
  const ch = us(), age = confAge(ch);
  el.innerHTML = `
  <h2 class="dh">Church conference</h2>
  <p class="sub">A church conference is a business meeting for transacting any business necessary for the operation of the local church. The state and district overseers are to see that <b>at least one is held each year</b> in every local church, and no pastor holds one without permission from the district overseer. <span class="cite">S50 I–II</span></p>

  <div class="${age>12?'warnbox':'note'}"><b>${ch.lastConference?`Last conference ${pLabel(ch.lastConference)} — ${age} months ago.`:'No conference on record.'}</b> ${age>12?'That is past the annual expectation. It is also where major disbursements are approved and where an applicant for ministerial advancement is endorsed — so a church that has not conferenced in a year has quietly blocked several other things.':'Within the annual expectation.'}</div>

  <div class="grid g2" style="margin-top:var(--s4)">
    <div class="card"><h3>Record a conference</h3>
      <div class="field"><label class="f" for="cfP">Held</label><select id="cfP">${periods(26).map(p=>`<option value="${p}" ${p===S.period?'selected':''}>${pLabel(p)}</option>`).join('')}</select></div>
      <div class="field"><label class="f" for="cfK">Kind</label><select id="cfK"><option>Regular</option><option>Called</option></select></div>
      <label class="cb"><input type="checkbox" id="cfN" checked> Announced at least ten days beforehand (regular conferences) <span class="cite">S50 III.2</span></label>
      <label class="cb"><input type="checkbox" id="cfF" checked> The church was informed of its financial status <span class="cite">S50 III.1</span></label>
      <label class="cb"><input type="checkbox" id="cfD"> Permission obtained from the district overseer <span class="cite">S50 II.1</span></label>
      <div class="field"><label class="f" for="cfNote">Minute</label><textarea id="cfNote" placeholder="Business transacted, and anything approved."></textarea></div>
      <button class="b" id="cfGo" type="button">Record conference</button></div>
    <div class="card"><h3>The order of business</h3>
      <p>Robert's Rules of Order Newly Revised is the guide for conducting all business conferences. <span class="cite">S50 V</span></p>
      <ul class="ck">${CONF_ORDER.map((o,i)=>`<li>${i+1}. ${esc(o)}</li>`).join('')}</ul>
      <hr class="sep">
      <h3>What only a conference can do</h3>
      <ul class="ck">
        <li>Approve <b>all major disbursements</b>${ch.majorDisbursement?` — this congregation has set that at €${ch.majorDisbursement.toLocaleString('en-GB')}`:' — this congregation has not yet set its threshold'} <span class="cite">S52 IV.2</span></li>
        <li>Approve any purchase, sale, transfer or borrowing against local property, by two-thirds majority, presided over by the state overseer or appointee <span class="cite">S57 II.2</span></li>
        <li>Select the Local Board of Trustees, in a business meeting <span class="cite">S57 I</span></li>
        <li>Recommend an applicant for advancement in ministerial rank, with the approval recorded in the conference minutes and the endorsement form sent onward <span class="cite">Study guide, step 8</span></li>
      </ul>
      <p style="margin-top:var(--s2);font-size:12.5px;color:var(--ink-faint)">Where there are not enough active members to conduct a conference, the state or district overseer with two or more ministers of his selection makes full disposition of the matters needing attention. <span class="cite">S50 II.3</span></p></div>
  </div>

  ${ch.conferences.length?`<p class="shead">Conferences on record</p>
  <div class="tw"><table><thead><tr><th>Held</th><th>Kind</th><th>Notice</th><th>Financials</th><th>Minute</th></tr></thead><tbody>
    ${ch.conferences.slice().reverse().map(c=>`<tr><td class="nm">${pLabel(c.period)}</td><td>${esc(c.kind)}</td>
      <td><span class="chip ${c.notice===false?'warn':'ok'}">${c.notice===false?'short':'10 days'}</span></td>
      <td><span class="chip ${c.financials===false?'warn':'ok'}">${c.financials===false?'not reported':'reported'}</span></td>
      <td>${esc(c.note||'—')}</td></tr>`).join('')}
  </tbody></table></div>`:''}`;

  document.getElementById('cfGo').onclick = ()=>{
    const p = document.getElementById('cfP').value;
    ch.conferences.push({period:p, kind:document.getElementById('cfK').value,
      notice:document.getElementById('cfN').checked, financials:document.getElementById('cfF').checked,
      permission:document.getElementById('cfD').checked, note:document.getElementById('cfNote').value.trim()});
    if(pIdx(p) > pIdx(ch.lastConference||'2000-01')) ch.lastConference = p;
    render();
  };
}

/* ── Membership ────────────────────────────────────────────────────────── */
function vMembers(el){
  const ch = us(), g = chGrowth(ch);
  const received12 = (ch.reports||[]).slice(-12).reduce((n,r)=>n+(r.added||0),0);
  el.innerHTML = `
  <h2 class="dh">Membership</h2>
  <p class="sub">${ch.membership} members on the roll. ${received12} received in the last twelve months. The roll is the treasurer's to keep accurate, and it is what sizes the Church and Pastor's Council. <span class="cite">S53 III.2</span> <span class="cite">S52 II</span></p>

  <div class="grid g2">
    <div class="card"><h3>Before anyone is received</h3>
      <p>It is the <b>pastor's responsibility</b> to see that every person making themselves available for membership is fully informed of the doctrine, teachings, government and heritage of the Church of God — through one or more of:</p>
      <ul class="ck">
        <li>Private counsel with prospective members on the membership requirements and their responsibilities</li>
        <li>Special membership classes where the requirements are taught</li>
        <li>Reading and explaining the membership requirements in a public meeting</li>
      </ul>
      <p style="margin-top:var(--s2)"><span class="cite">S48 I.A</span></p></div>
    <div class="card"><h3>What an applicant affirms</h3>
      <p>Standing before the congregation, applicants are told they are assuming a solemn obligation, and are asked to affirm:</p>
      <ul class="ck">${MEMBER_CHARGE.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>
      <p style="margin-top:var(--s2)"><span class="cite">S48 I.B</span> — summarised; the charge itself is in the Minutes.</p></div>
    <div class="card"><h3>Adjust the roll</h3>
      <div class="grid g2" style="gap:var(--s2)">
        <div class="field"><label class="f" for="mIn">Received</label><input id="mIn" type="number" min="0" value="0" style="width:100%"></div>
        <div class="field"><label class="f" for="mOut">Transferred out</label><input id="mOut" type="number" min="0" value="0" style="width:100%"></div>
      </div>
      <label class="cb"><input type="checkbox" id="mMap" checked> Names and addresses of members moving away reported to the secretary general on MAP ministry forms <span class="cite">S53 III.3</span></label>
      <button class="b" id="mSave" type="button">Update roll</button>
      <p style="margin-top:var(--s2);font-size:12.5px;color:var(--ink-faint)">Council size is recomputed from the roll: ${ch.membership} members currently requires ${councilRequired(ch.membership)} councillors, and this congregation has ${ch.councilMembers.length}.</p></div>
    <div class="card"><h3>Transfers</h3>
      <p>When a member in good standing moves from the vicinity of one church to another, a letter of recommendation should be given <em>on request</em>. Pastors and leaders are asked to show care in assisting members who relocate, by making available information about the churches in the area they are moving to.</p>
      <p><b>A member's name remains on the roll until an official request for transfer is received.</b> Removing someone early is not tidiness; it is an error in the roll that sizes your council.</p>
      <p><span class="cite">S49 I.1–3</span></p></div>
  </div>

  <p class="shead">Growth on the roll</p>
  <div class="grid g4">
    <div class="kpi"><div class="v">${ch.membership}</div><div class="k">Members</div></div>
    <div class="kpi"><div class="v">${received12}</div><div class="k">Received, 12 months</div></div>
    <div class="kpi"><div class="v">${g.conversions12}</div><div class="k">Conversions · goal ${g.convGoal}</div></div>
    <div class="kpi"><div class="v">${councilRequired(ch.membership)}</div><div class="k">Councillors required</div></div>
  </div>

  <div class="note" style="margin-top:var(--s4)"><b>A local church cannot withdraw.</b> The Church of God has a centralised — legally, hierarchical — form of government. Churches officially registered become constituents of the International General Assembly, and the right of any local church as a whole to withdraw is not recognised and does not exist. Members who prove disloyal to its government and teachings, or who are otherwise disorderly, are dealt with as individuals. <span class="cite">S46 1</span> <span class="cite">S48 III.1</span></div>`;

  document.getElementById('mSave').onclick = ()=>{
    ch.membership = Math.max(0, ch.membership + Number(document.getElementById('mIn').value||0) - Number(document.getElementById('mOut').value||0));
    render();
  };
}

/* ── Safeguarding ──────────────────────────────────────────────────────── */
function vSafe(el){
  const ch = us(), gaps = ch.roster.filter(p=>!p.bg);
  el.innerHTML = `
  <h2 class="dh">Safeguarding</h2>
  <p class="sub">Any person placed, appointed or hired for a ministry position in a local congregation should have a criminal background check. That is every name below — paid or not, ordained or not. <span class="cite">S29 I.11</span></p>

  <div class="${gaps.length?'warnbox':'note'}"><b>${gaps.length?gaps.length+' of '+ch.roster.length+' have no check on file.':'All '+ch.roster.length+' positions have a check on file.'}</b> ${gaps.length?'Until they do, this congregation appears with an open safeguarding item on the administrative bishop’s console.':''}</div>

  <div class="tw" style="margin-top:var(--s4)"><table><thead><tr><th>Person / position</th><th>Check on file</th><th>Status</th><th></th></tr></thead><tbody>
    ${ch.roster.map((p,i)=>`<tr><td class="nm">${esc(p.name)}</td>
      <td><select data-bg="${i}" style="min-width:150px"><option value="">— none —</option>${periods(30).map(q=>`<option value="${q}" ${q===p.bg?'selected':''}>${pLabel(q)}</option>`).join('')}</select></td>
      <td><span class="chip ${p.bg?'ok':'bad'}">${p.bg?'on file':'missing'}</span></td>
      <td><button class="b danger sm" data-rmp="${i}" type="button">remove</button></td></tr>`).join('')}
  </tbody></table></div>
  <div class="row" style="margin-top:var(--s3)"><input id="addP" placeholder="Name or position to add" style="flex:1">
    <button class="b sm" id="addPGo" type="button">Add to the register</button></div>

  <p class="shead">The lines that do not move</p>
  <div class="grid g2">
    <div class="card"><h3>Suspected crime leaves the church</h3>
      <p>Allegations of child sexual abuse or sexual exploitation of a minor, or any suspected felonious act, go to civil authorities under applicable mandatory-reporting law. A minister's professional confidentiality does not preempt reporting law and may not be used to conceal a felonious act.</p>
      <p><span class="cite">S29 I.8</span></p></div>
    <div class="card"><h3>The no-contact rule</h3>
      <p>Where a minister has been found guilty of the sexual abuse of a child — an offence carrying permanent revocation of credentials and of membership — the guilty party is prohibited from attending, participating in, or having any involvement with any activities of the local church or churches the victims presently attend or have attended.</p>
      <p>That is this congregation's rule to enforce at its own doors.</p>
      <p><span class="cite">S30 III.A.5</span> <span class="cite">S30 V.9</span></p></div>
    <div class="card"><h3>A trial board decision binds this church</h3>
      <p>When a minister has been tried by a state board and their licence ordered revoked, and the local church where their membership is held is instructed to withdraw fellowship, the local church is required to carry out the decision.</p>
      <p><span class="cite">S30 V.9</span></p></div>
    <div class="card"><h3>Retired ministers</h3>
      <p>Each local church is asked to establish a programme to adopt a retired Church of God minister — recognising them on birthdays, anniversaries and hospitalisations, and assisting them financially when invited to speak.</p>
      <label class="cb ${ch.reformationOffering?'on':''}"><input type="checkbox" id="refOff" ${ch.reformationOffering?'checked':''}> Reformation Sunday offering set aside — the last Sunday in October, in honour of aged ministers, receipts to the secretary general <span class="cite">S51 V</span></label>
      <p><span class="cite">S48 V</span></p></div>
  </div>`;

  el.querySelectorAll('[data-bg]').forEach(s=>s.onchange=()=>{ ch.roster[Number(s.dataset.bg)].bg = s.value; syncBg(ch); render(); });
  el.querySelectorAll('[data-rmp]').forEach(b=>b.onclick=()=>{ ch.roster.splice(Number(b.dataset.rmp),1); syncBg(ch); render(); });
  document.getElementById('addPGo').onclick = ()=>{
    const v = document.getElementById('addP').value.trim(); if(!v) return;
    ch.roster.push({name:v, role:v, bg:''}); syncBg(ch); render();
  };
  document.getElementById('refOff').onchange = e=>{ ch.reformationOffering = e.target.checked; render(); };
}
function syncBg(ch){ ch.bgComplete = ch.roster.length>0 && ch.roster.every(p=>!!p.bg); }

/* ── Progress ──────────────────────────────────────────────────────────── */
function vProg(el){
  const ch = us(), g = chGrowth(ch), h = (ch.reports||[]).slice(-12);
  const goalPct = g.convGoal ? Math.min(100, Math.round(g.conversions12/g.convGoal*100)) : 0;
  const remitOk = h.filter(r=>r.remitted!==false).length;
  el.innerHTML = `
  <h2 class="dh">Progress</h2>
  <p class="sub">Twelve months of this congregation's own filed reports, read back to it. Not an assessment — the church's own numbers.</p>

  <div class="grid g4">
    <div class="kpi"><div class="v">${g.attNow}</div><div class="k">Avg attendance ${g.attDelta!==null?`· ${g.attDelta>0?'+':''}${g.attDelta}% on prior yr`:''}</div></div>
    <div class="kpi"><div class="v">${g.conversions12}</div><div class="k">Conversions this year</div></div>
    <div class="kpi"><div class="v">${g.baptisms12} / ${g.spirit12}</div><div class="k">Water / Holy Ghost baptisms</div></div>
    <div class="kpi ${remitOk<h.length?'warnk':''}"><div class="v">${remitOk}/${h.length}</div><div class="k">Months remitted with report</div></div>
  </div>

  <p class="shead">The four commitments this church declares for itself</p>
  <div class="grid g2">
    <div class="card"><h3>Declared</h3>
      <label class="cb ${ch.prayer?'on':''}"><input type="checkbox" id="gP" ${ch.prayer?'checked':''}> A house of prayer for all nations, with leadership modelling an active prayer life <span class="cite">Commitment 1</span></label>
      <label class="cb ${ch.outreach?'on':''}"><input type="checkbox" id="gO" ${ch.outreach?'checked':''}> An outreach ministry to the disadvantaged or oppressed is established here <span class="cite">Commitment 6</span></label>
      <label class="cb ${ch.discipleship?'on':''}"><input type="checkbox" id="gD" ${ch.discipleship?'checked':''}> Discipleship is prioritised in every facet of our ministry <span class="cite">Commitment 9</span></label>
      <div class="field" style="margin-top:var(--s2)"><label class="f" for="gU">Unreached people group adopted and interceded for <span class="cite">Commitment 3</span></label>
        <input id="gU" value="${esc(ch.unreached||'')}" placeholder="Name the group, or leave blank" style="width:100%"></div>
      <button class="b sm" id="gSave" type="button">Save</button>
      <p style="margin-top:var(--s2);font-size:12.5px;color:var(--ink-faint)">These are stated commitments of the movement, not disciplinary requirements. Nothing follows from leaving one unticked except that it is left unticked.</p></div>
    <div class="card"><h3>Conversion growth against the commitment</h3>
      <p>The commitment to world evangelisation encourages <b>every local church to increase a minimum of ten percent per year through conversion growth</b>. At ${ch.membership} members that is ${g.convGoal} in a year; this church has recorded <b>${g.conversions12}</b>.</p>
      <div style="height:10px;background:var(--surface-2);border-radius:999px;overflow:hidden;margin:var(--s3) 0">
        <div style="height:100%;width:${goalPct}%;background:${goalPct>=100?'var(--good)':'var(--c)'}"></div></div>
      <p style="font-size:12.5px;color:var(--ink-faint)">${goalPct}% of the goal. No report is triggered by missing it and no board convenes. It is here because a church that never looks at this number cannot say whether it is growing or merely open. <span class="cite">Commitment 3</span> <span class="prac">goal, not a rule</span></p></div>
  </div>

  <p class="shead">Average attendance, last ${h.length} months</p><div class="card">${bars(h,'attendance')}</div>
  <p class="shead">Conversions</p><div class="card">${bars(h,'conversions')}</div>
  <p class="shead">Tithes received, and what went out with the report</p>
  <div class="card">${bars(h,'tithes',v=>'€'+v.toLocaleString('en-GB'))}
    <p style="margin-top:var(--s3)">Over twelve months this church received <b>€${g.tithes12.toLocaleString('en-GB')}</b> in tithes and remitted <b>€${g.remitted12.toLocaleString('en-GB')}</b>, leaving <b>€${(g.tithes12-g.remitted12).toLocaleString('en-GB')}</b> for the support of the pastor. <span class="cite">S55 II.1</span></p></div>`;

  document.getElementById('gSave').onclick = ()=>{
    ch.prayer = document.getElementById('gP').checked;
    ch.outreach = document.getElementById('gO').checked;
    ch.discipleship = document.getElementById('gD').checked;
    ch.unreached = document.getElementById('gU').value.trim();
    render();
  };
}

/* ── Raising a concern ─────────────────────────────────────────────────── */
function vConcern(el){
  const ch = us();
  el.innerHTML = `
  <h2 class="dh">Raising a concern</h2>
  <p class="sub">Two different routes, and using the wrong one is the most common way a legitimate concern gets nowhere. ${esc(ch.name)} holds no ministerial discipline record — no case files appear on this surface and its officers cannot open a charge on a member's behalf. What follows is the map.</p>

  <div class="warnbox" style="margin-bottom:var(--s4)"><b>Neither route is for suspected crime.</b> Allegations of child sexual abuse or sexual exploitation of a minor, or any suspected felonious act, go immediately to civil authorities under applicable mandatory-reporting law. Confidentiality does not preempt reporting law and may not be used to conceal a felonious act. <span class="cite">S29 I.8</span></div>

  <div class="grid g2">
    <div class="card"><h3>A concern about the welfare of this church</h3>
      <p>Loyal, tithing members have the right and privilege to contact the state overseer about a legitimate concern relating to the welfare of their church — <b>after</b> contacting their pastor and their district overseer, in that order.</p>
      <ul class="ck"><li>Speak to the pastor first</li><li>Then the district overseer</li><li>Then the state overseer</li>
        <li>Preferably in writing, <b>not as part of a petition</b></li>
        <li>Concerns are communicated back to the pastor and district overseer <em>with the names of those raising them</em></li></ul>
      <p style="margin-top:var(--s2)"><span class="cite">S51 III</span></p>
      <p style="font-size:12.5px;color:var(--ink-faint)">A named letter from three members carries further here than a hundred anonymous signatures. That is deliberate in the text, not an oversight.</p></div>

    <div class="card"><h3>A concern about a minister's conduct</h3>
      <p>A different route, and it starts with a conversation rather than a form.</p>
      <div class="steps" style="margin-top:var(--s2)">${STAGES.slice(0,4).map((st,i)=>`
        <div class="step pend"><div class="dot"><i>${i+1}</i><u></u></div>
        <div class="body"><h4>${esc(st.t)}</h4><p>${esc(st.d)}</p><span class="cite">${esc(st.cite)}</span></div></div>`).join('')}</div>
      <p>From there it may reach a trial board, a decision filed at state and international offices, and a ten-day appeal — each with named rights for both parties.</p>
      <p><span class="cite">S31</span></p></div>

    <div class="card"><h3>Pastoral preference is not a concern channel</h3>
      <p>The appointment of a pastor is vested in the state overseer, who appoints after consulting the district overseer and after giving members an opportunity to express their desire. The overseer may call for an expression from members aged sixteen and over where there is an apparent decline in the spiritual health and well-being of the church, and the uniform ballot requires a signature.</p>
      <p>Local churches are to refrain from taking action on the selection of pastors until authorised by the state overseer.</p>
      <p><span class="cite">S51 I.1–5</span></p></div>

    <div class="card"><h3>What this congregation does hold</h3>
      <p>Its reporting record, its funds position, its offices and council, its conferences, its roll, its safeguarding register and its twelve-month progress. Nothing about any minister's personal standing, covenant review, triad or disciplinary history — including its own pastor's.</p>
      <p class="row"><button class="b ghost sm" data-go="home" type="button">Our standing</button>
        <button class="b ghost sm" data-go="officers" type="button">Officers</button>
        <button class="b ghost sm" data-go="minister:${ch.pastor}" type="button">The pastor's own intranet</button></p></div>
  </div>`;
  goTab(el);
}

/* ── boot ──────────────────────────────────────────────────────────────── */
const csel = document.getElementById('asCh');
csel.innerHTML = S.churches.map(c=>`<option value="${c.id}">${esc(c.name)} — ${esc(c.district)}</option>`).join('');
csel.value = view.church;
csel.onchange = e=>{ view.church=e.target.value; localStorage.setItem('mendingnet.ch', view.church); render(); };
document.getElementById('period').innerHTML = periods(14).map(p=>`<option value="${p}" ${p===S.period?'selected':''}>${pLabel(p)}</option>`).join('');
document.getElementById('period').onchange = e=>{ S.period=e.target.value; render(); };
wireTheme(); wireReset();
render();
