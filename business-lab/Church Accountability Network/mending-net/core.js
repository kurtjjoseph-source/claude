/* ══════════════════════════════════════════════════════════════════════════
   MENDING NET — a church accountability network
   Every rule that produces a flag carries a citation to the section of the
   Book of Church Order that creates it. Rules the network adds on its own
   authority are labelled "network practice" and never dressed up as polity.
   ══════════════════════════════════════════════════════════════════════════ */

const KEY = 'mendingnet.v1';

/* ── the seven Practical Commitments (headings + the aim each one states) ── */
const COMMITMENTS = [
  {n:'I',   k:'spiritual',  t:'Spiritual Example',    aim:'Spiritual disciplines practised; loyalty to God and commitment to the church; stewardship of time, gifts and money.'},
  {n:'II',  k:'purity',     t:'Moral Purity',         aim:'Conduct, and what is read, watched and listened to, kept consistent with a holy life.'},
  {n:'III', k:'integrity',  t:'Personal Integrity',   aim:'A life that inspires trust and confidence — fruit of the Spirit, the character of Christ, a person of their word.'},
  {n:'IV',  k:'family',     t:'Family Responsibility',aim:'Family responsibilities given priority; the sanctity of marriage preserved; order kept in the home.'},
  {n:'V',   k:'temperance', t:'Behavioural Temperance',aim:'Self-control practised; abstention from what enslaves or gives needless offence.'},
  {n:'VI',  k:'modesty',    t:'Modest Appearance',    aim:'Appearance and dress that enhance the testimony rather than display pride or sensuality.'},
  {n:'VII', k:'social',     t:'Social Obligation',    aim:'Obligations to society met — good citizenship, correcting injustice, protecting the sanctity of life.'}
];
const RATINGS = ['Strong','Steady','Strained','Slipping'];

/* ── the concern pathway (Matthew 18 → S31 trial procedure → appeal) ────── */
const STAGES = [
  {k:'private',  t:'Private approach',              cite:'Matthew 18:15',
   d:'The one with the concern goes directly and privately to the minister. Most concerns end here, and they are meant to.'},
  {k:'witness',  t:'Taken with one or two others',  cite:'Matthew 18:16',
   d:'If the private approach is refused, the concern is repeated in the presence of one or two others who can witness what was said.'},
  {k:'charge',   t:'Written, signed charge filed',  cite:'S31 I.B.1',
   d:'A charge against a minister must be in writing and signed by the person bringing it, and presented to the overseer of the state where the alleged offence occurred. The burden of proof rests on the one bringing the charge.'},
  {k:'meeting',  t:'Moderated face-to-face meeting',cite:'S31 I.B.1',
   d:'Before any formal trial, the overseer arranges — where possible — a face-to-face meeting between accused and accuser, moderated by the overseer or their appointee.'},
  {k:'board',    t:'Trial board convened',          cite:'S31 I.B.2–3',
   d:'The overseer appoints the board: not fewer than three ordained bishops, and where prudent not fewer than two ordained female ministers with more than seven years of credentialed service. Conflicts of interest are declared and replaced. The defendant is notified of charges, time and place at least seven days beforehand.'},
  {k:'hearing',  t:'Hearing held and recorded',     cite:'S31 I.B.6',
   d:'A secretary of record is appointed. Witness lists are exchanged beforehand. Prosecution witnesses testify, then the defendant faces each one and answers; defence witnesses follow. No legal counsel is present — each party may invite one credentialed minister for personal support only.'},
  {k:'decision', t:'Decision issued and filed',     cite:'S31 I.B.7',
   d:'The board renders its decision in writing, signed by each member, to the overseer, who notifies both parties. The decision becomes part of the permanent record at the state office and is filed at International Offices. A finding of guilt must align with the rulings under S30.'},
  {k:'appeal',   t:'Appeal window (10 days)',       cite:'S31 II',
   d:'An appeal must be presented to the general overseer in writing and signed within ten days of written notification. Grounds: improper conduct of the trial, new evidence, conflict of interest, or where the International Executive Committee deems it advisable.'},
  {k:'closed',   t:'Closed',                        cite:'S30 Intro',
   d:'The matter is concluded. Where discipline was imposed, the church confirms its love for the disciplined brother or sister — the aim of the whole process is restoration and reconciliation, not removal.'}
];

/* ── restoration classes and their minimum periods ─────────────────────── */
const RCLASS = {
  explicit:{t:'Explicit heterosexual misconduct', months:24, cite:'S30 III.A.1',
    note:'Minimum two years suspension/revocation, and entry into the prescribed programme of restoration through the Center for Ministerial Care. Limited, supervised ministry may be permitted in the second year at the discretion of the state overseer and council.'},
  other:{t:'Other heterosexual misconduct', months:12, cite:'S30 III.B.1',
    note:'Minimum one year suspension. Limited, supervised ministry may be permitted after the first six months at the discretion of the state overseer and council.'},
  unbecoming:{t:'Unbecoming ministerial conduct', months:12, cite:'S30 III.C.1–5',
    note:'Defined as violations of personal integrity, of doctrinal fidelity, or of leadership accountability. Options run from official reprimand, restitution, censure, remedial action, re-examination and restrictions through to suspension. Where credentials are suspended, the restoration programme runs a minimum of one year; any violation of doctrinal fidelity requires re-examination.'}
};
const RTEAM = [
  {k:'advocate', t:'Ministerial advocate'},
  {k:'bishop',   t:'Administrative bishop'},
  {k:'cmc',      t:'Center for Ministerial Care representative'},
  {k:'mentor',   t:'Mentoring pastor'},
  {k:'counsel',  t:'Christian counsellor'}
];
const REVIDENCE = [
  {k:'confession', t:'Confession of the shame and ramifications of the offence'},
  {k:'blame',      t:'Acceptance of personal blame and responsibility'},
  {k:'submission', t:'Submission to the authority of the church in its disciplinary and restorative processes'}
];

/* ── triad check-in questions ──────────────────────────────────────────── */
const TRIAD_Q = [
  'Where has your own devotional life actually been this week — not what you preached, what you practised?',
  'Is there anything in what you have watched, read or written online this week you would not want this triad to see?',
  'How did your family experience you this week?',
  'Is there any money, gift or promise in your ministry right now that has not been recorded openly?',
  'Is there a conversation you are avoiding? Who is it with?'
];


/* ══════════════════ demonstration seed ══════════════════════════════════ */
function seed(){ /* returns a fresh demonstration network */
  const M = (id,name,rank,church,district,last,reaff,bg,triad,status)=>
    ({id,name,rank,church,district,lastReport:last,reaffirmed:reaff,bgCheck:bg,triad,status:status||'active',reports:[]});
  return {
    period:'2026-08',
    region:'Region 7 (demonstration)',
    ministers:[
      M('m1','R. Okonkwo','Ordained Bishop','Grace Tabernacle','North','2026-07','2025-09','2024-03','A'),
      M('m2','M. Alvarez','Ordained Minister','Cornerstone COG','North','2026-07','2025-09','2023-11','A'),
      M('m3','D. Whitfield','Ordained Minister','Ridgeview COG','East','2026-04','2023-09','2022-01','A'),
      M('m4','S. Boateng','Exhorter','New Hope Chapel','East','2026-07','2025-09','2025-06','B'),
      M('m5','J. Lindqvist','Ordained Minister','Harbour COG','West','2026-03','2025-09','','B'),
      M('m6','T. Nakamura','Ordained Bishop','First COG Eastvale','East','2026-07','2025-09','2024-08','B'),
      M('m7','A. Duarte','Exhorter','Westgate church plant','West','2026-06','2025-09','2026-02','C'),
      M('m8','K. Mensah','Ordained Minister','Living Word COG','South','2026-07','2025-09','2021-05','C'),
      M('m9','P. Vogel','Ordained Minister','(no appointment)','South','','2025-09','2024-05','C','restoration'),
      M('m10','L. Rahman','Exhorter','Northfield COG (MIP)','North','2026-07','2025-09','2026-01','C'),
      M('m11','E. Ferreira','Ordained Minister','Mount Zion COG','South','2026-07','2024-08','2025-10','D'),
      M('m12','B. Nyathi','Ordained Bishop','Regional evangelist','West','2026-05','2025-09','2024-01','D')
    ],
    triads:[
      {id:'A',name:'Triad A — North/East',members:['m1','m2','m3'],checkins:['2026-07-28','2026-08-04']},
      {id:'B',name:'Triad B — East/West',members:['m4','m5','m6'],checkins:['2026-07-21']},
      {id:'C',name:'Triad C — West/South',members:['m7','m8','m10'],checkins:['2026-07-28','2026-08-04']},
      {id:'D',name:'Triad D — South/West',members:['m11','m12'],checkins:[]}
    ],
    reviews:[
      {id:'r1',minister:'m1',period:'2026 Q2',scores:{spiritual:'Strong',purity:'Strong',integrity:'Strong',family:'Steady',temperance:'Strong',modesty:'Strong',social:'Steady'},note:'Sabbath discipline recovered after the building programme.',peer:'m2',confirmed:true},
      {id:'r2',minister:'m2',period:'2026 Q2',scores:{spiritual:'Steady',purity:'Strong',integrity:'Strong',family:'Strained',temperance:'Steady',modesty:'Strong',social:'Steady'},note:'Two evenings a week ring-fenced for family from September.',peer:'m1',confirmed:true},
      {id:'r3',minister:'m8',period:'2026 Q2',scores:{spiritual:'Steady',purity:'Strong',integrity:'Strained',family:'Steady',temperance:'Steady',modesty:'Strong',social:'Strong'},note:'Building-fund records were kept informally for four months. Now reconciled and countersigned.',peer:'m7',confirmed:false}
    ],
    concerns:[
      {id:'C-101',subject:'m3',by:'Local church treasurer',category:'Financial transparency — leadership accountability',opened:'2026-06-14',stage:'private',
       log:[{d:'2026-06-14',t:'Concern raised privately with the minister, in person, by the treasurer.'}],
       guards:{},closed:false},
      {id:'C-102',subject:'m8',by:'S. Boateng (Exhorter)',category:'Unbecoming conduct — leadership accountability',opened:'2026-05-02',stage:'meeting',
       log:[{d:'2026-05-02',t:'Private approach made; response declined.'},
            {d:'2026-05-19',t:'Concern repeated with two witnesses present.'},
            {d:'2026-06-08',t:'Written charge signed and filed with the administrative bishop.'},
            {d:'2026-07-01',t:'Face-to-face meeting scheduled, moderated by the administrative bishop.'}],
       guards:{written:true,signed:true,rightsGiven:true},closed:false},
      {id:'C-103',subject:'m2',by:'Congregation member',category:'Pastoral manner',opened:'2026-03-11',stage:'closed',
       log:[{d:'2026-03-11',t:'Concern raised privately.'},{d:'2026-03-25',t:'Matter acknowledged, apology made and received. Reconciled at step one.'}],
       guards:{},closed:true}
    ],
    churches: seedChurches(),
    restorations:[
      {id:'RT-01',minister:'m9',rclass:'unbecoming',suspendedOn:'2026-02-10',enteredOn:'2026-03-02',
       team:{advocate:'Ministerial advocate — assigned',bishop:'Regional administrative bishop',cmc:'Center for Ministerial Care — case opened',mentor:'R. Okonkwo (mentoring pastor)',counsel:''},
       evid:{confession:true,blame:true,submission:false},
       log:[{d:'2026-02-10',t:'Credentials suspended following trial board decision.'},
            {d:'2026-03-02',t:'Entered the restoration programme in writing to the Center for Ministerial Care — within the three-month window.'},
            {d:'2026-05-06',t:'Mentoring pastor assigned; monthly contact begins.'}]}
    ]
  };
}

/* Twelve months of filed church reports, generated deterministically so the
   demonstration is stable across reloads (no Math.random — it would drift). */
function chHistory(k, base, tithePer, growth){
  const out = []; let i = 2026*12+6 - 11;          // Aug 2025 .. Jul 2026
  for(let j=0;j<12;j++){
    const y = Math.floor(i/12), mo = i%12+1, p = y+'-'+String(mo).padStart(2,'0');
    const wob = ((k*7 + j*13) % 11) - 5;
    const att = Math.max(8, Math.round(base*(1+growth*j/12) + wob));
    const t = Math.max(0, Math.round(att*tithePer + wob*25));
    out.push({period:p, attendance:att, conversions:Math.max(0, Math.round(att*0.011) + ((k+j)%3===0?1:0)),
      baptisms:(j%4===0?1:0), spirit:(j%5===0?1:0), added:(j%3===0?2:0),
      tithes:t, intl:Math.round(t*0.05), state:Math.round(t*0.05), remitted:!((k===5)&&(j>8))});
    i++;
  }
  return out;
}
function seedChurches(){
  const pi = p => { const [y,m]=p.split('-').map(Number); return y*12+(m-1); };
  const C = (id,name,district,pastor,membership,lastReport,council,treasurer,fin,conf,owed,bg,books,pr,out,dis,unr,k,base,tp,gr)=>
    ({id,name,district,pastor,membership,lastReport,council,treasurer,financeCttee:fin,lastConference:conf,
      delinquentFunds:owed,bgComplete:bg,bookkeeping:books,prayer:pr,outreach:out,discipleship:dis,unreached:unr,
      reports:chHistory(k,base,tp,gr).filter(r=>pi(r.period)<=pi(lastReport||'2000-01'))});
  return [
    C('ch1','Grace Tabernacle','North','m1',240,'2026-07',7,'H. Osei',2,'2026-03',0,true,true,true,true,true,'Fulbe of the Sahel',1,205,26,0.06),
    C('ch2','Cornerstone COG','North','m2',118,'2026-07',4,'D. Sant',2,'2025-11',0,true,true,true,false,true,'',2,96,24,0.03),
    C('ch3','Ridgeview COG','East','m3',86,'2026-05',3,'',1,'2025-06',4180,false,false,false,false,false,'',3,61,21,-0.05),
    C('ch4','New Hope Chapel','East','m4',54,'2026-07',3,'A. Brill',2,'2026-04',0,true,true,true,true,true,'',4,47,22,0.09),
    C('ch5','Harbour COG','West','m5',132,'2026-03',5,'N. Aaltonen',2,'2025-09',9640,false,true,true,false,false,'',5,104,23,-0.02),
    C('ch6','First COG Eastvale','East','m6',410,'2026-07',9,'V. Prasad',2,'2026-01',0,true,true,true,true,true,'Deaf communities, West Africa',6,356,27,0.05),
    C('ch7','Westgate church plant','West','m7',28,'2026-06',3,'C. Duarte',2,'2026-05',0,true,true,true,true,true,'',7,34,19,0.22),
    C('ch8','Living Word COG','South','m8',175,'2026-07',5,'J. Mireku',2,'2026-02',1250,true,true,true,true,false,'',8,148,25,0.04),
    C('ch9','Mount Zion COG','South','m11',96,'2026-07',3,'P. Adeyemi',2,'2025-10',0,true,true,true,true,true,'',9,88,23,0.01),
    C('ch10','Northfield COG','North','m10',62,'2026-07',3,'S. Lund',2,'2026-06',0,true,true,true,false,true,'',10,58,21,0.11)
  ];
}


/* ══════════════════ state ═══════════════════════════════════════════════ */
let S = load(); if(S && !S._n){ normalise(S); S._n=1; }
function load(){ try{ const r=localStorage.getItem(KEY); if(r) return migrate(JSON.parse(r)); }catch(e){} return seed(); }
/* Saved state from an earlier version of this app is missing whole collections.
   Fill the gaps from the seed rather than throwing away what the user entered. */
function migrate(st){
  if(!st || typeof st!=='object') return seed();
  const base = seed();
  ['ministers','triads','reviews','concerns','restorations','churches'].forEach(k=>{
    if(!Array.isArray(st[k])) st[k] = base[k];
  });
  if(!st.period) st.period = base.period;
  if(!st.region) st.region = base.region;
  return normalise(st);
}
/* The two intranets keep more about a minister and a congregation than the
   console ever needed. Fill the fields in rather than reseeding — a church that
   has been filing reports for six months should not lose them to a schema. */
function normalise(st){
  st.ministers.forEach(m=>{
    m.reports        = m.reports        || [];
    m.reaffirmations = m.reaffirmations || (m.reaffirmed?[{period:m.reaffirmed, name:m.name, on:m.reaffirmed}]:[]);
    m.acks           = m.acks           || {};
    m.study          = m.study          || {bible:0, polity:0, doctrine:0};
    m.mip            = m.mip            || {status:'none', route:'', started:''};
    if(m.bgConsent === undefined) m.bgConsent = !!m.bgCheck;
    m.bgProvider     = m.bgProvider     || (m.bgCheck?'State/regional office':'');
    if(m.tithing === undefined) m.tithing = m.status==='active';
    m.ministryYears  = m.ministryYears  === undefined ? ({'Exhorter':2,'Ordained Minister':7,'Ordained Bishop':14})[m.rank] : m.ministryYears;
  });
  st.churches.forEach(c=>{
    c.reports        = c.reports        || [];
    c.councilMembers = c.councilMembers || Array.from({length:c.council}, (_,i)=>({name:'Councillor '+(i+1), ok:true}));
    c.councilElected = c.councilElected || '2025-02';
    c.trustees       = c.trustees       || [{name:'Trustee 1'},{name:'Trustee 2'},{name:'Trustee 3'}];
    c.financeMembers = c.financeMembers || Array.from({length:c.financeCttee}, (_,i)=>({name:'Finance member '+(i+1)}));
    c.assistants     = c.assistants     || [];
    if(c.majorDisbursement === undefined) c.majorDisbursement = 0;
    c.conferences    = c.conferences    || (c.lastConference?[{period:c.lastConference, kind:'Regular', note:'Financial status reported to the church.'}]:[]);
    c.roster         = c.roster         || defaultRoster(c);
    if(c.propertyInsured === undefined) c.propertyInsured = true;
    if(c.taxExempt === undefined) c.taxExempt = true;
    if(c.reformationOffering === undefined) c.reformationOffering = false;
  });
  return st;
}
function defaultRoster(c){
  const roles = ['Youth leader','Children\u2019s ministry','Worship leader','Sunday school teacher','Van driver'];
  return roles.slice(0, c.membership>150?5:3).map((r,i)=>({
    name: r, role:r, bg: c.bgComplete ? '2025-0'+((i%8)+1) : (i===0?'2024-05':'')
  }));
}
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
let view = {role:'overseer', who:'m3', church:'ch3', tab:'overview'};


/* ══════════════════ period + rule helpers ═══════════════════════════════ */
const pIdx = p => { const [y,m]=p.split('-').map(Number); return y*12+(m-1); };
const pLabel = p => { if(!p) return '—'; const [y,m]=p.split('-').map(Number);
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]+' '+y; };
const periods = (n=14) => { const out=[]; let i=pIdx('2026-08'); for(let k=0;k<n;k++){ const y=Math.floor(i/12), m=i%12+1; out.push(y+'-'+String(m).padStart(2,'0')); i--; } return out; };

/* S28 III — ministerial reporting. Delinquency is counted in unfiled due periods. */
function delinquency(m){
  if(m.status==='restoration'||m.status==='revoked') return null;   // not reporting while suspended
  if(!m.lastReport) return 99;
  return Math.max(0, pIdx(S.period) - pIdx(m.lastReport) - 1);
}
function reportFlag(m){
  const d = delinquency(m);
  if(d===null) return {level:0,label:'Suspended — not reporting',cls:'',cite:'S30 II.A'};
  if(d>=4)  return {level:3,label:'Revocation exposure — '+d+' months',cls:'bad',
    cite:'S28 III.2', action:'Written notice already required: failure to report for four months makes the licence subject to revocation, after due disciplinary process.'};
  if(d===3) return {level:2,label:'Admonition due — 3 months',cls:'bad',
    cite:'S28 III.1', action:'The state overseer must urgently admonish this minister to bring reports up to date.'};
  if(d===2) return {level:1,label:'Watch — 2 months behind',cls:'warn',
    cite:'S28 III.1', action:'One further missed period triggers the required admonition. Contact now.'};
  if(d===1) return {level:0,label:'1 month behind',cls:'warn',cite:'S28 I'};
  return {level:0,label:'Current',cls:'ok',cite:'S28 I'};
}
/* S29 I.9 — biennial reaffirmation, submitted with the September ministerial report. */
function reaffFlag(m){
  if(!m.reaffirmed) return {ok:false,label:'Never recorded',cls:'bad'};
  const due = pIdx('2025-09');
  if(pIdx(m.reaffirmed) < due) return {ok:false,label:'Overdue since Sep 2025',cls:'bad'};
  return {ok:true,label:pLabel(m.reaffirmed),cls:'ok'};
}
/* S29 I.11 — criminal background check for anyone placed in a ministry position. */
function bgFlag(m){
  if(!m.bgCheck) return {ok:false,label:'None on file',cls:'bad',why:'polity'};
  const age = pIdx(S.period) - pIdx(m.bgCheck);
  if(age > 60) return {ok:false,label:pLabel(m.bgCheck)+' — over 5 yrs',cls:'warn',why:'practice'};
  return {ok:true,label:pLabel(m.bgCheck),cls:'ok'};
}
const mById  = id => S.ministers.find(m=>m.id===id) || {name:'—'};
const stageIdx = k => STAGES.findIndex(s=>s.k===k);
function lastReview(id){ return S.reviews.filter(r=>r.minister===id).sort((a,b)=>a.period<b.period?1:-1)[0]; }
function triadOf(id){ return S.triads.find(t=>t.members.includes(id)); }
function restorationOf(id){ return S.restorations.find(r=>r.minister===id); }
function monthsBetween(iso, endPeriod){
  const [y,m] = iso.split('-'); return pIdx(endPeriod) - pIdx(y+'-'+m);
}


/* ══════════════════ the action queue — the product's spine ══════════════ */
function actionQueue(){
  const out = [];
  S.ministers.forEach(m=>{
    const f = reportFlag(m);
    if(f.level>=1) out.push({p:f.level>=2?1:2, who:m.name, what:f.action||f.label, tag:'Reporting', cite:f.cite, go:['standing',m.id]});
    const r = reaffFlag(m);
    if(!r.ok && m.status!=='revoked') out.push({p:2, who:m.name,
      what:'Doctrinal reaffirmation not on file. Every credentialed minister reaffirms fidelity to the Declaration of Faith, Doctrinal Commitments and Practical Commitments biennially, submitted with the September ministerial report.',
      tag:'Credential', cite:'S29 I.9', go:['standing',m.id]});
    const b = bgFlag(m);
    if(!b.ok && b.why==='polity') out.push({p:1, who:m.name,
      what:'No criminal background check on file for someone holding a ministry position.',
      tag:'Safeguarding', cite:'S29 I.11', go:['safeguard',null]});
    else if(!b.ok) out.push({p:3, who:m.name, what:'Background check is more than five years old.', tag:'Safeguarding', cite:'network practice', go:['safeguard',null]});
  });
  S.concerns.filter(c=>!c.closed).forEach(c=>{
    const st = STAGES[stageIdx(c.stage)];
    out.push({p:c.stage==='board'||c.stage==='hearing'?1:2, who:mById(c.subject).name,
      what:c.id+' is at "'+st.t+'". '+nextMove(c), tag:'Concern', cite:st.cite, go:['concerns',c.id]});
  });
  S.restorations.forEach(rt=>{
    const missing = RTEAM.filter(r=>!rt.team[r.k]);
    if(missing.length) out.push({p:1, who:mById(rt.minister).name,
      what:'Restoration team incomplete — still to appoint: '+missing.map(x=>x.t).join(', ')+'.',
      tag:'Restoration', cite:'S30 IV.A', go:['restoration',rt.id]});
    const ev = REVIDENCE.filter(e=>!rt.evid[e.k]);
    if(ev.length) out.push({p:3, who:mById(rt.minister).name,
      what:'Evidence of healing and renewal not yet demonstrated on '+ev.length+' of 3 counts.',
      tag:'Restoration', cite:'S30 IV.D', go:['restoration',rt.id]});
  });
  S.churches.forEach(ch=>{
    const l = chLadder(ch);
    if(l.months>=1) out.push({p:l.months>=2?1:2, who:ch.name,
      what:l.months+' month'+(l.months===1?'':'s')+' behind on the church report and funds. '+l.d,
      tag:'Church report', cite:l.cite, go:['congregations',ch.id]});
    if(ch.delinquentFunds) out.push({p:1, who:ch.name,
      what:'€'+ch.delinquentFunds.toLocaleString('en-GB')+' of ministry money outstanding. There is no provision for forgiveness of ministry money owed — agree a route within twelve months.',
      tag:'Church funds', cite:'S55 III.B', go:['congregations',ch.id]});
    chChecks(ch).filter(c=>!c.ok && c.why==='polity' && c.k!=='report' && c.k!=='tithe').forEach(c=>
      out.push({p:c.k==='bg'?1:3, who:ch.name, what:c.label+' — '+c.value+'. '+c.fix,
        tag:'Church governance', cite:c.cite, go:['congregations',ch.id]}));
  });
  S.triads.forEach(t=>{
    if(t.members.length<3) out.push({p:3, who:t.name, what:'Group is below three. Pair accountability is not accountability — appoint a third.', tag:'Triad', cite:'network practice', go:['triads',t.id]});
    const last = t.checkins[t.checkins.length-1];
    if(!last) out.push({p:2, who:t.name, what:'No check-in on record at all.', tag:'Triad', cite:'network practice', go:['triads',t.id]});
  });
  return out.sort((a,b)=>a.p-b.p);
}
function nextMove(c){
  switch(c.stage){
    case 'private': return 'Awaiting the outcome of the private approach. It stays here unless it is refused.';
    case 'witness': return 'Awaiting the outcome of the second approach with witnesses.';
    case 'charge':  return 'Written charge on file. Arrange the moderated face-to-face meeting before anything formal proceeds.';
    case 'meeting': return 'Moderated meeting is the current step. If it resolves, close it here.';
    case 'board':   return 'Board appointed. Confirm conflicts declared, seven days notice given, secretary of record appointed.';
    case 'hearing': return 'Hearing under way. Both parties keep their full rights; no legal counsel present.';
    case 'decision':return 'Decision issued. Notify both parties, file to state and International, and start the ten-day appeal clock.';
    case 'appeal':  return 'Appeal window open — ten days from written notification.';
    default: return '';
  }
}


/* ══════════════════════════════════════════════════════════════════════════
   THE CONGREGATION SURFACE
   The local church is an accountable body in its own right, with its own
   reporting obligation, its own delinquency ladder, its own governance
   requirements, and its own way of raising a concern. None of that is the
   minister's record — so it gets its own view, which the church itself holds.
   ══════════════════════════════════════════════════════════════════════════ */

/* S52 II — the Church and Pastor's Council is sized by membership. */
function councilRequired(membership){
  if(membership >= 501) return 12;
  if(membership >= 351) return 9;
  if(membership >= 226) return 7;
  if(membership >= 101) return 5;
  return 3;
}
const chById = id => S.churches.find(c=>c.id===id) || S.churches[0];
const churchOfPastor = mid => S.churches.find(c=>c.pastor===mid);

/* S53 III.6 — the treasurer sends the monthly report to the secretary general
   and the state overseer by the fifth of each month. */
function chDelinquency(ch){
  if(!ch.lastReport) return 99;
  return Math.max(0, pIdx(S.period) - pIdx(ch.lastReport) - 1);
}
/* S55 III.A — the recommended procedure where a church is delinquent in
   reporting (reports and/or finances). Recommended, not mandated — the text
   says so, and so does this. */
const CH_LADDER = [
  {at:0, t:'Current',                    cls:'ok',   d:'Report and funds filed on time — by the fifth of the month, one copy to the secretary general, one to the state overseer.', cite:'S53 III.6'},
  {at:1, t:'1 month behind',             cls:'warn', d:'Nothing is triggered yet. This is the month to fix it quietly.', cite:'S53 III.6'},
  {at:2, t:'2 months — overseer meets the pastor', cls:'bad',
   d:'Where a church is two months delinquent in reporting, the recommended procedure is that the state overseer meets personally with the pastor to correct the matter.', cite:'S55 III.A.1'},
  {at:3, t:'3 months — board of inquiry', cls:'bad',
   d:'At three months delinquent, the recommended procedure is that a board of inquiry is appointed to investigate and make recommendations.', cite:'S55 III.A.2'},
  {at:4, t:'4+ months — charges and credentials', cls:'bad',
   d:'Should the delinquency continue, a state board is appointed to consider filing appropriate charges. Where fault is proven on the pastor, he or she is not considered for any appointment or position until proper disposition is made for payment of the delinquent funds; a pastor found at fault who has failed to send church reports for four months or more is subject to disciplinary action from the administrative bishop, up to revocation of credentials, with case-by-case exceptions approved by the presiding bishop.', cite:'S55 III.A.3–5'}
];
function chLadder(ch){
  const d = chDelinquency(ch);
  return Object.assign({months:d}, CH_LADDER[Math.min(d, 4)]);
}

/* Everything the network checks on a congregation, with its origin. */
function chChecks(ch){
  const req = councilRequired(ch.membership);
  const confAge = ch.lastConference ? pIdx(S.period) - pIdx(ch.lastConference) : 99;
  const l = chLadder(ch);
  return [
    {k:'report',  ok:l.months===0, label:'Monthly report and funds', value:l.months===0?'Filed to '+pLabel(ch.lastReport):l.months+' month'+(l.months===1?'':'s')+' behind',
     cite:'S53 III.6', why:'polity', fix:'File the report for every unfiled period, with the tithe of tithes for each.'},
    {k:'tithe',   ok:ch.delinquentFunds===0, label:'Ministry money owed', value:ch.delinquentFunds===0?'Nothing outstanding':'€'+ch.delinquentFunds.toLocaleString('en-GB'),
     cite:'S55 III.B', why:'polity', fix:'There is no provision for forgiveness of ministry money owed. Agree one of the four routes with the overseer — immediate payment, a payment plan, partial payment with partial assistance, or full assistance once the others are exhausted — within twelve months.'},
    {k:'council', ok:ch.council >= req, label:'Church and Pastor’s Council', value:ch.council+' of '+req+' seats for '+ch.membership+' members',
     cite:'S52 II', why:'polity', fix:'Elect to the required number by ballot, from loyal members. The council is elected biennially; the pastor chairs it.'},
    {k:'treas',   ok:!!ch.treasurer, label:'Church treasurer', value:ch.treasurer || 'Not appointed',
     cite:'S53 I.1', why:'polity', fix:'Appointed by the pastor and confirmed by the council and/or the church body, and provided with a copy of the current Minutes.'},
    {k:'fin',     ok:ch.financeCttee >= 2, label:'Finance Committee', value:ch.treasurer?('treasurer + '+ch.financeCttee+' of 2'):'no treasurer',
     cite:'S55 I.A', why:'polity', fix:'The committee is the treasurer plus two members, appointed by the pastor and confirmed by the council and/or the members. They receive and count all monies and prepare funds for deposit.'},
    {k:'conf',    ok:confAge <= 12, label:'Church conference', value:ch.lastConference?(confAge+' months ago'):'none recorded',
     cite:'S50 II.4', why:'polity', fix:'At least one conference a year is to be held in each local church. A regular conference is announced at least ten days beforehand and its purpose is to inform the church of its financial status.'},
    {k:'bg',      ok:ch.bgComplete, label:'Background checks — ministry positions', value:ch.bgComplete?'Complete':'Incomplete',
     cite:'S29 I.11', why:'polity', fix:'Any person placed, appointed or hired for a ministry position in this congregation should have a criminal background check.'},
    {k:'books',   ok:ch.bookkeeping, label:'Bookkeeping system', value:ch.bookkeeping?'In use':'Not confirmed',
     cite:'S53 I.3', why:'polity', fix:'An adequate bookkeeping system is to be used in all churches, and the treasurer holds a copy of the current Minutes.'},
    {k:'prayer',  ok:ch.prayer, label:'A house of prayer', value:ch.prayer?'Declared':'Not declared',
     cite:'Commitment 1', why:'goal', fix:'Every local church becoming a house of prayer for all nations, with leadership modelling an active prayer life.'},
    {k:'outreach',ok:ch.outreach, label:'Outreach ministry to the disadvantaged', value:ch.outreach?'Established':'None established',
     cite:'Commitment 6', why:'goal', fix:'Establishing in each local church some type of outreach ministry that demonstrates concern and love for the disadvantaged or oppressed.'},
    {k:'disc',    ok:ch.discipleship, label:'Discipleship prioritised in every ministry', value:ch.discipleship?'Declared':'Not declared',
     cite:'Commitment 9', why:'goal', fix:'Every church asked to prioritise discipleship in every facet of its ministry, with a framework by which growth can happen.'},
    {k:'unreach', ok:!!ch.unreached, label:'Unreached people group adopted', value:ch.unreached || 'None adopted',
     cite:'Commitment 3', why:'goal', fix:'Local churches encouraged to adopt and intercede for an unreached people group; materials provided by the Ministry of World Missions.'}
  ];
}

/* Growth against the stated commitment of a minimum 10% annual increase
   through conversion growth. A goal in the text, not a rule — shown as one. */
function chGrowth(ch){
  const h = ch.reports || [];
  const last12 = h.slice(-12), prev12 = h.slice(-24,-12);
  const sum = (a,k)=>a.reduce((n,r)=>n+(r[k]||0),0);
  const attNow = last12.length? Math.round(sum(last12,'attendance')/last12.length) : 0;
  const attPrev= prev12.length? Math.round(sum(prev12,'attendance')/prev12.length) : 0;
  return {
    conversions12: sum(last12,'conversions'),
    baptisms12: sum(last12,'baptisms'),
    spirit12: sum(last12,'spirit'),
    tithes12: sum(last12,'tithes'),
    remitted12: sum(last12,'intl') + sum(last12,'state'),
    attNow, attPrev,
    attDelta: attPrev? Math.round((attNow-attPrev)/attPrev*1000)/10 : null,
    convGoal: Math.ceil(ch.membership*0.10),
    months: last12.length
  };
}


function chTodo(ch){
  const out = [], l = chLadder(ch);
  if(l.months>0) out.push({p:l.months>=2?1:2, t:'File '+l.months+' outstanding monthly report'+(l.months===1?'':'s'),
    d:'Each one carries its tithe of tithes: 5% to the International Office and an equal 5% to the state/regional office, with the remainder for the support of the pastor.', cite:'S53 III.6 · S55 II.1', go:'churchreport'});
  chChecks(ch).filter(c=>!c.ok && c.k!=='report').forEach(c=>out.push({
    p:c.why==='polity'?(c.k==='tithe'||c.k==='bg'?1:2):3, t:c.label+' — '+c.value, d:c.fix,
    cite:c.why==='goal'?c.cite:c.cite, go:'governance'}));
  return out.sort((a,b)=>a.p-b.p);
}

function bars(rows, key, fmt){
  const max = Math.max(1, ...rows.map(r=>r[key]||0));
  return `<div class="bars">${rows.map(r=>`
    <div class="bar" title="${pLabel(r.period)}: ${(fmt||(v=>v))(r[key]||0)}">
      <div class="bstem"><div class="bfill" style="height:${Math.round((r[key]||0)/max*100)}%"></div></div>
      <div class="blab">${pLabel(r.period).slice(0,3)}</div>
    </div>`).join('')}</div>`;
}

/* ══════════════════ shared plumbing ═════════════════════════════════════ */
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

/* ══════════════════ drawer + plumbing ═══════════════════════════════════ */
function drawer(title, body){
  document.getElementById('drawerTitle').innerHTML = title;
  document.getElementById('drawerBody').innerHTML = body;
  document.getElementById('drawer').classList.add('on');
  document.getElementById('scrim').classList.add('on');
}
function closeDrawer(){
  document.getElementById('drawer').classList.remove('on');
  document.getElementById('scrim').classList.remove('on');
}
document.getElementById('drawerX').onclick = closeDrawer;
document.getElementById('scrim').onclick = closeDrawer;
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeDrawer(); });


document.getElementById('themebtn').onclick = ()=>{
  const r=document.documentElement;
  const cur = r.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
  r.setAttribute('data-theme', cur==='dark'?'light':'dark');
};

function wireGo(el){
  el.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{
    const t=b.dataset.go, id=b.dataset.goid;
    if(t==='standing' && id){ openMinister(id); return; }
    if(t==='gochurch'){ goChurch(id); return; }
    view.tab=t; view.goid=id||null; render(); window.scrollTo({top:0,behavior:'smooth'});
  });
}

/* Cross-surface navigation. The three surfaces share one origin, therefore one
   localStorage record — a report filed on the church intranet is visible on the
   bishop's console on the next load, with no server in between. */
const goMinister = id => location.href = 'minister.html?m=' + id;
const goChurch   = id => location.href = 'church.html?c=' + id;
function qs(k){ return new URLSearchParams(location.search).get(k); }

/* The dark/light control lives on every surface. */
function wireTheme(){
  const b = document.getElementById('themebtn'); if(!b) return;
  b.onclick = ()=>{
    const r = document.documentElement;
    const cur = r.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    r.setAttribute('data-theme', cur==='dark'?'light':'dark');
  };
}
function wireReset(){
  const b = document.getElementById('reset'); if(!b) return;
  b.onclick = ()=>{ if(confirm('Reset all demonstration data?')){ S=seed(); save(); location.reload(); } };
}
