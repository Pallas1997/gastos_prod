const CATS=[{id:'cafe',n:'Café',e:'☕',h:1},{id:'kiosco',n:'Kiosco',e:'🍫',h:1},{id:'delivery',n:'Delivery',e:'🛵',h:1},{id:'subs',n:'Suscripciones',e:'📺',h:1},{id:'salidas',n:'Salidas',e:'🍻',h:1},{id:'super',n:'Súper',e:'🛒',h:0},{id:'transp',n:'Transporte',e:'🚌',h:0},{id:'hogar',n:'Hogar',e:'🏠',h:0},{id:'servicios',n:'Servicios',e:'💡',h:0},{id:'salud',n:'Salud',e:'💊',h:0},{id:'ropa',n:'Ropa',e:'👕',h:0},{id:'ocio',n:'Ocio',e:'🎮',h:0},{id:'otros',n:'Otros',e:'📦',h:0}];
const $=s=>document.querySelector(s);
const fmtN=n=>{n=+n||0;const [i,d]=Math.abs(n).toFixed(2).split('.');return (n<0?'-':'')+i.replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+d};
const fmt=n=>'$'+fmtN(n);
function parseMoney(t){let s=String(t==null?'':t).replace(/[^\d.,-]/g,'');if(!s)return 0;
 const c=s.lastIndexOf(','),p=s.lastIndexOf('.');
 if(c>-1&&p>-1){if(c>p)s=s.replace(/\./g,'').replace(',','.');else s=s.replace(/,/g,'')}
 else if(c>-1){s=s.replace(/\./g,'');s=s.replace(',','.')}
 else if(p>-1){if(/^-?\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'')}
 const n=parseFloat(s);return isNaN(n)?0:n}
function maskStr(raw){let t=String(raw).replace(/[^\d,]/g,'');const k=t.indexOf(',');let i=k>-1?t.slice(0,k):t,d=k>-1?t.slice(k+1).replace(/,/g,'').slice(0,2):null;
 i=i.replace(/^0+(?=\d)/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.');return d===null?i:i+','+d}
document.addEventListener('input',e=>{const el=e.target;if(el.classList&&el.classList.contains('money')){el.value=maskStr(el.value)}});
document.addEventListener('paste',e=>{const el=e.target;if(el.classList&&el.classList.contains('money')){e.preventDefault();const n=parseMoney((e.clipboardData||window.clipboardData).getData('text'));el.value=n?fmtN(n).replace(/,00$/,''):'';el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}});
const mv=n=>n?fmtN(n).replace(/,00$/,''):'';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const p2=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())};
const DEFS=()=>({exp:[],budget:0,pct:30,bank:[],income:{},goal:0,goalM:0,fixed:[],lastPay:'dig',inc:[],goalP:0,bal:{}});
let S=DEFS(),M={cur:'p1',list:[{id:'p1',name:'Perfil 1'}],theme:''};let bankMsg='';
const pk=id=>'gastos-p-'+id;
const loadP=id=>{try{const r=localStorage.getItem(pk(id));return Object.assign(DEFS(),r?JSON.parse(r):{})}catch(e){return DEFS()}};
try{
 const m=localStorage.getItem('gastos-meta');
 if(m)M=JSON.parse(m);
 else{const old=localStorage.getItem('gastos-v1');if(old){localStorage.setItem(pk('p1'),old);try{M.theme=JSON.parse(old).theme||''}catch(e){}}}
}catch(e){}
S=loadP(M.cur);
const FXN={blue:'Blue',oficial:'Oficial',bolsa:'MEP',contadoconliqui:'CCL',tarjeta:'Tarjeta'};
const FX0={sel:'blue',manual:0,live:false,got:0,at:'2026-11-03T11:57:00.000Z',r:{blue:[1545,1565],oficial:[1515,1565],bolsa:[1556.2,1579.9],contadoconliqui:[1663.2,1670],tarjeta:[1969.5,2034.5]}};
M.fx=Object.assign({},FX0,M.fx||{});M.fx.r=Object.assign({},FX0.r,M.fx.r||{});M.fx.live=false;
const save=()=>{try{localStorage.setItem(pk(M.cur),JSON.stringify(S));localStorage.setItem('gastos-meta',JSON.stringify(M))}catch(e){}if(window.onSaved)window.onSaved()};
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
addEventListener('pagehide',()=>save());document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
let tab='home',cat='cafe';
const cat$=id=>CATS.find(c=>c.id===id)||CATS[CATS.length-1];
const monthExp=()=>{const m=today().slice(0,7);return S.exp.filter(e=>e.date.startsWith(m))};
const sum=a=>a.reduce((t,e)=>t+e.amt,0);

function go(t){tab=t;render()}
function dlg(o){return new Promise(res=>{
  const d=$('#dg');
  d.innerHTML=`<div class="dbox"><div style="font-weight:700;margin-bottom:8px">${esc(o.title||'')}</div>${o.msg?`<div class="sm" style="margin-bottom:10px;line-height:1.5;white-space:pre-line">${esc(o.msg)}</div>`:''}${o.input?`<input id="dgi" type="text" value="${esc(o.def||'')}" autocomplete="off">`:''}<div class="flt" style="margin:14px 0 0;justify-content:flex-end">${o.cancel===false?'':'<button class="chip" id="dgc">'+esc(typeof o.cancel==='string'?o.cancel:'Cancelar')+'</button>'}<button class="chip on" id="dgo">${esc(o.ok||'Aceptar')}</button></div></div>`;
  d.classList.add('o');
  const done=v=>{d.classList.remove('o');d.innerHTML='';res(v)};
  $('#dgo').onclick=()=>done(o.input?$('#dgi').value:true);
  const c=$('#dgc');if(c)c.onclick=()=>done(o.input?null:false);
  if(o.input){const i=$('#dgi');setTimeout(()=>{i.focus();i.select()},60);i.onkeydown=e=>{if(e.key==='Enter')done(i.value)}}
})}
function pfUI(){
  const b=$('#pf');if(!b)return;const c=M.list.find(p=>p.id===M.cur)||M.list[0];b.textContent='👤 '+c.name+' ▾';
  $('#pm').innerHTML=M.list.map(p=>`<div class="pr ${p.id===M.cur?'on':''}"><button class="nm" onclick="switchP('${p.id}')">${p.id===M.cur?'✓ ':''}${esc(p.name)}</button><button class="x" onclick="renameP('${p.id}')" aria-label="Renombrar">✎</button>${M.list.length>1?`<button class="x" onclick="delP('${p.id}')" aria-label="Borrar perfil">✕</button>`:''}</div>`).join('')+`<div class="pr" style="border:0"><button class="nm" onclick="addP()">＋ Agregar perfil</button></div>`;
}
document.addEventListener('click',e=>{const m=$('#pm');if(m&&m.classList.contains('o')&&!e.target.closest('#pm,#pf'))m.classList.remove('o')});
function togglePM(){$('#pm').classList.toggle('o')}
function switchP(id){if(id===M.cur){$('#pm').classList.remove('o');return}save();M.cur=id;S=loadP(id);save();$('#pm').classList.remove('o');lf='all';render()}
async function addP(){const n=await dlg({title:'Nombre del perfil nuevo',input:1,def:'Perfil '+(M.list.length+1),ok:'Crear'});if(n===null)return;
  save();const id='p'+Date.now();M.list.push({id,name:n.trim()||'Perfil '+(M.list.length+1)});M.cur=id;S=DEFS();save();$('#pm').classList.remove('o');lf='all';render()}
async function renameP(id){const p=M.list.find(x=>x.id===id);if(!p)return;const n=await dlg({title:'Nuevo nombre',input:1,def:p.name});if(n===null||!n.trim())return;p.name=n.trim();save();render()}
async function delP(id){const p=M.list.find(x=>x.id===id);if(!p||M.list.length<2)return;
  if(!await dlg({title:'¿Borrar "'+p.name+'"?',msg:'Se borran todos sus gastos. No se puede deshacer.',ok:'Borrar'}))return;
  try{localStorage.removeItem(pk(id))}catch(e){}
  M.list=M.list.filter(x=>x.id!==id);if(M.cur===id){M.cur=M.list[0].id;S=loadP(M.cur)}save();render()}
function render(){
  pfUI();
  ['home','inc','list','fix','sup'].forEach(k=>$('#t-'+k).classList.toggle('on',k===tab));
  $('#m').innerHTML=tab==='home'?home():tab==='inc'?incTab():tab==='sup'?superTab():tab==='fix'?fixedTab():list();
  if(tab==='list')ant2();
  window.scrollTo(0,0);
}
function home(){
  const ex=monthExp(),tot=sum(ex),hor=sum(ex.filter(e=>e.h));
  const now=new Date(),day=now.getDate(),dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const fx=sum(S.fixed),Bs=S.income[today().slice(0,7)]||0,xi=sum((S.inc||[]).filter(i=>i.date.startsWith(today().slice(0,7)))),B=Bs+xi,proj=tot/day*dim,used=B?(tot+fx)/B:0,uv=B>fx?tot/(B-fx):2,elapsed=day/dim;
  const ask=`<div class="card"><div style="font-weight:700;margin-bottom:8px">${Bs?'Sueldo del mes':'¿Cuánto cobraste este mes?'}</div><input class="money" type="text" inputmode="decimal" placeholder="$ 0" value="${mv(Bs)}" oninput="qIncome(this.value)" onchange="setIncome(this.value)">${Bs?'':'<div class="sm" style="margin-top:8px">Lo uso para ir restando tus gastos.</div>'}</div>`;
  let col='var(--ok)',msg='Cargá tus gastos para empezar';
  if(B&&ex.length){
    if(used>1){col='var(--bad)';msg='Te pasaste del presupuesto'}
    else if(uv>elapsed*1.15){col='var(--bad)';msg='Vas rápido: cuidado con el ritmo'}
    else if(uv>elapsed){col='var(--warn)';msg='Atención: vas un poco arriba'}
    else{col='var(--ok)';msg='Vas bien este mes'}
  }else if(!B&&ex.length){msg='Cargá tu sueldo para ver cuánto te queda'}
  const C=2*Math.PI*84,dash=C*Math.min(used,1);
  const center=B?`<div class="big">${fmt(Math.max(B-tot-fx,0))}</div><div class="sm">te quedan</div>`:`<div class="big">${fmt(tot)}</div><div class="sm">gastado en el mes</div>`;
  const save30=hor*S.pct/100;
  return `<h1>${now.toLocaleDateString('es-AR',{month:'long',year:'numeric'})}</h1>
  ${ask}<div class="card hero"><div class="ring"><svg width="200" height="200"><circle cx="100" cy="100" r="84" fill="none" stroke="var(--ring)" stroke-width="16"/><circle cx="100" cy="100" r="84" fill="none" stroke="${col}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${dash} ${C}"/></svg><div class="c">${center}</div></div>
  <div class="badge" style="color:${col}">${msg}</div></div>
  <div class="card"><div class="row"><span class="lbl">Gastado</span><span class="val">${fmt(tot)}</span></div>
  ${xi?`<div class="row"><span class="lbl">Ingresos extra</span><span class="val" style="color:var(--ok)">+${fmt(xi)}</span></div>`:''}
  ${fx?`<div class="row"><span class="lbl">Gastos fijos (Servicios)</span><span class="val">${fmt(fx)}</span></div>`:''}
  <div class="row"><span class="lbl">Proyección a fin de mes</span><span class="val">${fmt(proj)}</span></div></div>
  ${fxCard(B,tot,fx)}
  <div class="card" onclick="go('list')"><div class="row"><span class="lbl">🐜 Gastos hormiga</span><span class="val ant">${fmt(hor)}</span></div>
  <div class="row"><span class="lbl">${tot?Math.round(hor/tot*100):0}% de lo que gastaste</span><span class="sm">${hor?'Podrías ahorrar '+fmt(save30)+'/mes':''}</span></div></div>
  ${where(B,tot,fx)}
  ${recon()}
  ${plan(B)}`;
}
const fxRate=()=>M.fx.manual||(M.fx.r[M.fx.sel]||M.fx.r.blue)[1];
async function fetchFx(){
  try{const c=new AbortController(),t=setTimeout(()=>c.abort(),8000);
    const r=await fetch('https://dolarapi.com/v1/dolares',{signal:c.signal});clearTimeout(t);
    if(!r.ok)throw 0;const a=await r.json(),o={};let at='';
    a.forEach(x=>{if(FXN[x.casa]&&x.venta){o[x.casa]=[x.compra,x.venta];if(String(x.fechaActualizacion)>at)at=x.fechaActualizacion}});
    if(!o.blue)throw 0;
    M.fx.r=Object.assign(M.fx.r,o);M.fx.at=at||M.fx.at;M.fx.live=true;M.fx.got=Date.now();save();
    if(tab==='home'&&!(document.activeElement&&document.activeElement.closest&&document.activeElement.closest('.fxc')))keep(()=>{});
  }catch(e){M.fx.live=false}
}
function fxConv(f){const R=fxRate(),a=$('#fxp'),b=$('#fxu');if(!R||!a||!b)return;
  if(f==='p'){const v=parseMoney(a.value);b.value=v?fmtN(v/R).replace(/,00$/,''):''}
  else{const v=parseMoney(b.value);a.value=v?fmtN(v*R).replace(/,00$/,''):''}}
function setFx(k){M.fx.sel=k;M.fx.manual=0;save();keep(()=>{})}
function setFxM(v){M.fx.manual=parseMoney(v)||0;save();keep(()=>{})}
function fxCard(B,tot,fx){
  const R=fxRate(),u=n=>'US$ '+fmtN(n/R),sel=M.fx.manual?'manual':M.fx.sel;
  const d=new Date(M.fx.at),ds=isNaN(d)?'':d.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  const st=M.fx.live?`<span style="color:var(--ok)">● En vivo</span> · actualizada ${ds}`:`<span style="color:var(--warn)">● Sin conexión en vivo</span> · valor guardado del ${ds}`;
  const disp=B?B-tot-fx:0;
  return `<div class="card fxc"><div style="font-weight:700;margin-bottom:8px">💵 Dólar</div>
  <div class="flt" style="margin:0 0 10px">${Object.keys(FXN).map(k=>`<button class="chip ${sel===k?'on':''}" onclick="setFx('${k}')">${FXN[k]}</button>`).join('')}</div>
  <div class="row"><span class="lbl">1 USD =</span><span class="val">${fmt(R)}</span></div>
  <div class="sm" style="margin:2px 0 12px">${st}${M.fx.manual?' · valor manual':''}</div>
  <div class="row"><span class="lbl">Pesos</span><input id="fxp" class="money" type="text" inputmode="decimal" style="width:160px;text-align:right" placeholder="$ 0" oninput="fxConv('p')"></div>
  <div class="row"><span class="lbl">Dólares</span><input id="fxu" class="money" type="text" inputmode="decimal" style="width:160px;text-align:right" placeholder="US$ 0" oninput="fxConv('u')"></div>
  <div class="row" style="margin-top:8px"><span class="lbl">Usar otro valor</span><input class="money" type="text" inputmode="decimal" style="width:160px;text-align:right" value="${mv(M.fx.manual)}" placeholder="$ manual" onchange="setFxM(this.value)"></div>
  <div style="border-top:1px solid var(--line);margin-top:12px;padding-top:6px">
  ${B?`<div class="row"><span class="lbl">Te quedan</span><span class="val">≈ ${u(Math.max(disp,0))}</span></div><div class="row"><span class="lbl">Ingresos del mes</span><span class="val">≈ ${u(B)}</span></div>`:''}
  <div class="row"><span class="lbl">Gastado (con fijos)</span><span class="val">≈ ${u(tot+fx)}</span></div></div>
  <div class="sm" style="margin-top:8px">Cotización de venta. Fuente: DolarApi, que toma los mismos valores que muestran los sitios como dolarhoy.com.</div></div>`;
}
function qBal(k,v){const ym=today().slice(0,7);S.bal=S.bal||{};const o=S.bal[ym]=S.bal[ym]||{};o[k]=String(v).trim()===''?null:parseMoney(v);save()}
function setBal(k,v){qBal(k,v);keep(()=>{})}
async function adjBal(d){
  const ok=await dlg({title:d<0?'Cargar la fuga como gasto':'Cargar la diferencia como ingreso',msg:d<0?`Se carga un gasto de ${fmt(-d)} en "Otros", marcado para revisar, así las cuentas cuadran.`:`Se carga un ingreso extra de ${fmt(d)} para que las cuentas cuadren.`,ok:'Cargar'});
  if(!ok)return;
  if(d<0)S.exp.push({id:Date.now(),amt:-d,cat:'otros',note:'Ajuste: diferencia con el banco',date:today(),h:0,pay:'dig',rev:1});
  else S.inc.push({id:Date.now(),amt:d,note:'Ajuste: diferencia con el banco',date:today()});
  keep(()=>{});
}
function recon(){
  const ym=today().slice(0,7),day=new Date().getDate(),b=(S.bal||{})[ym]||{};
  const Bs=S.income[ym]||0,xi=sum(S.inc.filter(i=>i.date.startsWith(ym))),mx=monthExp();
  const gs=sum(mx.filter(e=>e.pay!=='efe')),ef=sum(mx.filter(e=>e.pay==='efe')),fx=sum(S.fixed.filter(x=>!x.day||x.day<=day));
  const ini=b.ini||0,exp=ini+Bs+xi-gs-fx,has=b.real!=null,diff=has?b.real-exp:0;
  let res='';
  if(has){
    if(Math.abs(diff)<1)res=`<div class="badge" style="color:var(--ok);margin-top:12px">✅ Las cuentas cuadran</div>`;
    else res=`<div style="margin-top:14px;padding:12px;border-radius:12px;background:color-mix(in srgb,${diff<0?'var(--bad)':'var(--ok)'} 14%,transparent)"><div class="sm">${diff<0?'Fuga: te falta plata':'Te sobra plata'}</div><div class="big" style="font-size:28px;color:${diff<0?'var(--bad)':'var(--ok)'}">${diff<0?'−':'+'}${fmt(Math.abs(diff))}</div><div class="sm" style="margin-top:4px">${diff<0?'Tenés menos de lo esperado: puede haber gastos sin cargar, o cargos del banco que no registraste.':'Tenés más de lo esperado: puede haber ingresos o devoluciones sin cargar, o gastos que cargaste de más.'}</div><button class="chip" style="margin-top:10px" onclick="adjBal(${diff})">${diff<0?'Cargar como gasto':'Cargar como ingreso'}</button></div>`;
  }
  return `<div class="card"><div style="font-weight:700;margin-bottom:4px">🏦 ¿Te cuadran las cuentas?</div>
  <div class="sm" style="margin-bottom:10px">Poné cuánto tenés hoy en el banco y lo comparo con lo que debería haber según lo que cargaste.</div>
  <div class="row"><span class="lbl">Plata al empezar el mes</span><input class="money" type="text" inputmode="decimal" style="width:150px;text-align:right" value="${mv(ini)}" placeholder="$ 0" oninput="qBal('ini',this.value)" onchange="setBal('ini',this.value)"></div>
  <div class="row"><span class="lbl">Ingresos del mes</span><span class="val">+${fmt(Bs+xi)}</span></div>
  <div class="row"><span class="lbl">Gastos digitales</span><span class="val">−${fmt(gs)}</span></div>
  <div class="row"><span class="lbl">Fijos ya vencidos</span><span class="val">−${fmt(fx)}</span></div>
  <div class="row"><b>Debería haber</b><span class="val">${exp<0?'−':''}${fmt(Math.abs(exp))}</span></div>
  <div class="row" style="margin-top:6px"><span class="lbl">Tengo hoy en el banco</span><input class="money" type="text" inputmode="decimal" style="width:150px;text-align:right" value="${mv(b.real)}" placeholder="$ 0" oninput="qBal('real',this.value)" onchange="setBal('real',this.value)"></div>
  ${res}${ef?`<div class="sm" style="margin-top:10px">Los gastos en efectivo (${fmt(ef)}) no se descuentan del banco.</div>`:''}</div>`;
}
function where(B,tot,fx){
  const by={};monthExp().forEach(e=>{by[e.cat]=(by[e.cat]||0)+e.amt});
  const it=Object.entries(by).map(([id,v])=>({n:cat$(id).e+' '+cat$(id).n,v}));
  if(fx)it.push({n:'📌 Gastos fijos',v:fx});
  if(!it.length)return '';
  it.sort((a,b)=>b.v-a.v);
  const disp=B?B-tot-fx:0,base=B?Math.max(B,tot+fx):tot+fx;
  if(disp>0)it.push({n:'✅ Te queda',v:disp,ok:1});
  const colr=(x,i)=>x.ok?'var(--ok)':`hsl(${(i*47+210)%360} 55% ${document.documentElement.dataset.theme==='dark'?'62%':'52%'})`;
  const pc=v=>{const p=v/base*100;return p>=10?Math.round(p)+'%':p.toFixed(1).replace('.',',')+'%'};
  return `<div class="card"><div style="font-weight:700;margin-bottom:4px">¿A dónde se va tu sueldo?</div>
  ${B?'':'<div class="sm" style="margin-bottom:8px">Porcentaje sobre lo que gastaste (cargá tu sueldo para verlo sobre tus ingresos).</div>'}
  <div style="display:flex;height:14px;border-radius:8px;overflow:hidden;margin:10px 0 14px;background:var(--ring)">${it.map((x,i)=>`<i style="width:${x.v/base*100}%;background:${colr(x,i)}"></i>`).join('')}</div>
  ${it.map((x,i)=>`<div class="row"><span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${colr(x,i)};margin-right:8px"></span>${x.n}</span><span class="val">${pc(x.v)} <span class="sm">· ${fmt(x.v)}</span></span></div>`).join('')}
  ${B&&tot+fx>B?`<div class="sm" style="margin-top:8px;color:var(--bad)">Gastaste más de lo que ingresó este mes.</div>`:''}</div>`;
}
function ant(){
  const ex=monthExp().filter(e=>e.h),tot=sum(ex),by={};
  ex.forEach(e=>{(by[e.cat]=by[e.cat]||{t:0,n:0}).t+=e.amt;by[e.cat].n++});
  const rows=Object.entries(by).sort((a,b)=>b[1].t-a[1].t);
  if(!rows.length)return `<h1>Gastos hormiga</h1><div class="card empty">Todavía no hay gastos hormiga este mes.<br>Marcá como hormiga los cafés, kioscos, delivery y suscripciones chicas.</div>`;
  const top=cat$(rows[0][0]),max=rows[0][1].t,ahorro=tot*S.pct/100;
  return `<h1>Gastos hormiga</h1>
  <div class="card"><div class="sm">Tu mayor fuga</div><div class="big" style="font-size:26px">${top.e} ${top.n}</div><div class="sm">${fmt(rows[0][1].t)} en ${rows[0][1].n} compras este mes</div></div>
  <div class="card">${rows.map(([id,v])=>{const c=cat$(id);return `<div style="margin-bottom:14px"><div class="row"><span>${c.e} ${c.n} <span class="sm">· ${v.n}x</span></span><span class="val">${fmt(v.t)}</span></div><div class="bar"><i style="width:${v.t/max*100}%"></i></div></div>`}).join('')}
  <div class="row"><span class="lbl">Total hormiga</span><span class="val ant">${fmt(tot)}</span></div></div>
  <div class="card"><div class="row"><span class="lbl">Si los reducís un</span><span class="val">${S.pct}%</span></div>
  <input type="range" min="10" max="80" step="5" value="${S.pct}" oninput="S.pct=+this.value;save();ant2()" style="margin-top:10px">
  <div id="sv" class="row" style="margin-top:14px"><span></span></div></div>`;
}
let antOpen=false;
let cur='ars';
function curChips(){
  let h=`<button class="chip ${cur==='ars'?'on':''}" onclick="cur='ars';curChips()">$ Pesos</button><button class="chip ${cur==='usd'?'on':''}" onclick="cur='usd';curChips()">US$ Dólares</button>`;
  if(cur==='usd')h+=Object.keys(FXN).map(k=>`<button class="chip ${!M.fx.manual&&M.fx.sel===k?'on':''}" onclick="M.fx.sel=k;M.fx.manual=0;save();curChips()">${FXN[k]}</button>`).join('');
  $('#cc').innerHTML=h;$('#a').placeholder=cur==='usd'?'US$ 0':'$ 0';prevU();
}
function prevU(){const el=$('#cv');if(!el)return;if(cur!=='usd'){el.textContent='';return}
  const R=fxRate(),v=parseMoney($('#a').value);
  el.innerHTML=`Dólar ${M.fx.manual?'manual':FXN[M.fx.sel]}: ${fmt(R)} · ${M.fx.live?'en vivo':'valor guardado'}<br><b style="color:var(--ink);font-size:15px">${v?'≈ '+fmt(v*R)+' en pesos':'Escribí el monto en dólares'}</b>`}
function openSuper(){openSheet();pick('super')}
const CART_PX=["RR................",".R................",".RMMMMMMMMMMMMMMMM","..MggloOyyrRgloyM.","..MsMsMsMsMsMsMsM.","..MMMMMMMMMMMMMMM.","...MsMsMsMsMsMsM..","...MMMMMMMMMMMMM..","....MsMsMsMsMsM...","....MMMMMMMMMMM...",".....M.......M....","....MMMMMMMMMMMM..",".....KK.....KK....",".....KK.....KK...."];
const CART_C={R:'#d83a3a',M:'#7d8a97',s:'#d5dde4',K:'#222',g:'#3fae4a',l:'#8fd16a',o:'#f08a24',O:'#d9661a',y:'#f5c518',r:'#e04848'};
function cartSvg(ratio){
  const W=18,H=CART_PX.length;let gr='',co='';
  CART_PX.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='.')return;
    gr+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${ch==='M'||ch==='R'||ch==='K'?'var(--mute)':'var(--ring)'}" opacity="${ch==='M'||ch==='R'||ch==='K'?.45:1}"/>`;
    co+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${CART_C[ch]}"/>`}));
  const r=Math.max(0,Math.min(1,ratio)),h=H*r;
  return `<svg viewBox="0 0 ${W} ${H}"><defs><clipPath id="cfill"><rect x="0" y="${H-h}" width="${W}" height="${h}"/></clipPath></defs><g>${gr}</g><g clip-path="url(#cfill)">${co}</g></svg>`;
}
const cartS=()=>{if(!S.cart)S.cart={goal:0,items:[]};return S.cart};
function cartAdd(){const n=$('#cn').value.trim(),p=parseMoney($('#cp').value),q=Math.max(1,parseInt($('#cq').value)||1);
  if(!p){$('#cp').focus();return}
  keep(()=>{cartS().items.push({id:Date.now(),n:n||'Producto',p,q})});
  setTimeout(()=>{const e=$('#cn');e&&e.focus()},50)}
function cartQ(id,d){keep(()=>{const c=cartS(),it=c.items.find(i=>i.id===id);if(!it)return;it.q+=d;if(it.q<1)c.items=c.items.filter(i=>i.id!==id)})}
function cartDel(id){keep(()=>{const c=cartS();c.items=c.items.filter(i=>i.id!==id)})}
async function cartClear(){if(!cartS().items.length)return;if(!await dlg({title:'¿Vaciar el carrito?',msg:'Se borran los productos cargados. No se guarda como gasto.',ok:'Vaciar'}))return;keep(()=>{S.cart.items=[]})}
async function cartDone(){const c=cartS(),t=sum(c.items.map(i=>({amt:i.p*i.q})));if(!t)return;
  if(!await dlg({title:'¿Terminar la compra?',msg:'Se guarda '+fmt(t)+' como gasto de Súper con fecha de hoy y se vacía el carrito.',ok:'Guardar gasto'}))return;
  keep(()=>{S.exp.push({id:Date.now(),amt:Math.round(t*100)/100,cat:'super',note:c.items.map(i=>(i.q>1?i.q+'× ':'')+i.n).join(', ').slice(0,200),date:today(),h:0,pay:S.lastPay||'dig',rev:0});c.items=[]})}
function cartGoal(){const v=parseMoney($('#cg').value);$('#cg').blur();keep(()=>{cartS().goal=v})}
function cartCard(){
  const c=cartS(),t=sum(c.items.map(i=>({amt:i.p*i.q}))),g=c.goal,r=g?t/g:0,left=g-t;
  const col=!g?'var(--mute)':r>1?'var(--bad)':r>=.85?'var(--warn)':'var(--ok)';
  const st=!g?'Poné cuánto querés gastar para ver cómo se llena':r>1?'Te pasaste por '+fmt(-left):r>=.85?'Casi llegás: te quedan '+fmt(left):'Te quedan '+fmt(left);
  return `<div class="card"><div style="font-weight:700;margin-bottom:8px">🛒 Estoy en el súper</div>
  <div class="lbl" style="margin-bottom:6px">Monto deseado para gastar</div>
  <div class="row" style="gap:8px"><input id="cg" class="money" type="text" inputmode="decimal" placeholder="$ 0" value="${mv(g)}" style="flex:1" onkeydown="if(event.key==='Enter')cartGoal()"><button class="btn s" onclick="cartGoal()">${g?'Actualizar':'Listo'}</button></div>
  <div class="cart" style="margin:16px 0 6px"><div class="${r>1?'over':''}">${cartSvg(r)}</div>
  <div class="pc" style="color:${col}">${g?Math.round(r*100)+'%':''}</div></div>
  <div style="text-align:center"><div class="sm">Total gastado</div><div class="big" style="color:${col}">${fmt(t)}</div><div class="badge" style="color:${col};margin-top:4px">${st}</div></div>
  <div style="border-top:1px solid var(--line);margin-top:14px;padding-top:12px">
  <input id="cn" placeholder="Producto (ej: galletitas)" autocomplete="off">
  <div class="row" style="margin-top:8px"><input id="cp" class="money" type="text" inputmode="decimal" placeholder="$ Precio c/u" style="flex:2" onkeydown="if(event.key==='Enter')cartAdd()"><input id="cq" type="number" inputmode="numeric" min="1" value="1" style="flex:1;text-align:center" aria-label="Cantidad"></div>
  <button class="btn" onclick="cartAdd()">+ Sumar al carrito</button></div>
  ${c.items.length?`<div style="margin-top:12px">${[...c.items].reverse().map(i=>`<div class="ci"><div class="grow"><b>${esc(i.n)}</b><span>${fmt(i.p)} c/u</span></div><button class="qb" onclick="cartQ(${i.id},-1)" aria-label="Uno menos">−</button><span class="q">${i.q}</span><button class="qb" onclick="cartQ(${i.id},1)" aria-label="Uno más">+</button><div class="val" style="min-width:86px;text-align:right">${fmt(i.p*i.q)}</div><button class="x" onclick="cartDel(${i.id})" aria-label="Quitar">✕</button></div>`).join('')}</div>
  <div class="row" style="margin-top:12px;gap:8px"><button class="btn s" style="flex:1;background:var(--ok);color:#fff" onclick="cartDone()">✓ Terminar compra</button><button class="btn s" style="background:var(--bg);color:var(--ink);border:1px solid var(--line)" onclick="cartClear()">Vaciar</button></div>`:''}
  </div>`;
}
function superTab(){
  const ym=today().slice(0,7),t=new Date(),dim=new Date(t.getFullYear(),t.getMonth()+1,0).getDate(),day=t.getDate();
  const Bs=S.income[ym]||0,xi=sum(S.inc.filter(i=>i.date.startsWith(ym))),B=Bs+xi,fx=sum(S.fixed),ex=monthExp(),tot=sum(ex);
  const sp=ex.filter(e=>e.cat==='super'),ss=sum(sp),disp=B-tot-fx;
  const head=`<h1>Supermercado</h1>`+cartCard();
  const list=`<div class="card"><div class="row" style="margin-bottom:6px"><b>Compras del mes</b><button class="chip" onclick="openSuper()">+ Cargar compra</button></div>${sp.length?[...sp].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).map(e=>`<div class="item"><div class="em">🛒</div><div class="grow"><b>${fd(e.date)}</b><span>${e.note?esc(e.note):'Sin comentario'}${e.pay?' · '+(e.pay==='dig'?'💳 Digital':'💵 Efectivo'):''}</span></div><div class="val">${fmt(e.amt)}</div><button class="x" onclick="del(${e.id})" aria-label="Borrar">✕</button></div>`).join(''):'<div class="empty" style="padding:14px">Todavía no cargaste compras de súper este mes.</div>'}</div>`;
  if(!B)return head+`<div class="card empty">Cargá tu sueldo en Inicio (o un ingreso en Ingresos) para que te recomiende cuánto gastar en el súper.</div>`+list;
  const need=sum(ex.filter(e=>['transp','hogar','salud','servicios'].includes(e.cat))),
   cap50=B*0.5-fx-need,
   poolSave=B-fx-(tot-ss)-B*0.2,
   rec=Math.max(0,B-fx-(tot-ss)-B*(S.supSave||0)/100),
   left=rec-ss,rest=dim-day+1,wk=Math.max(1,rest/7),
   col=disp<0?'var(--bad)':left<0?'var(--warn)':'var(--ok)';
  const msg=disp<0?'Ya gastaste más de lo que ingresó este mes':left<0?'Te pasaste de lo disponible para el súper':rec<=0?'Ya no queda margen este mes, cargá un ingreso o revisá los gastos':'Hay plata para el súper este mes';
  return head+`<div class="card hero"><div class="sm">Sueldo disponible</div><div class="big" style="color:${col}">${disp<0?'−':''}${fmt(Math.abs(disp))}</div><div class="sm">después de gastos y fijos</div><div class="badge" style="color:${col}">${msg}</div></div>
  <div class="card"><div style="font-weight:700;margin-bottom:8px">🛒 Recomendación para el súper</div>
  <div class="row"><span class="lbl">Disponible para el súper (todo el mes)</span><span class="val">${fmt(rec)}</span></div>
  <div class="row"><span class="lbl">Gastado en súper</span><span class="val">${fmt(ss)}</span></div>
  <div class="row"><b>${left>=0?'Te queda para el súper':'Te pasaste por'}</b><span class="val" style="color:${left>=0?'var(--ok)':'var(--bad)'}">${fmt(Math.abs(left))}</span></div>
  ${left>0?`<div class="row"><span class="lbl">Por semana (${rest} días que quedan)</span><span class="val">${fmt(left/wk)}</span></div><div class="row"><span class="lbl">Por día</span><span class="val">${fmt(left/rest)}</span></div>`:''}
  <div class="sm" style="margin-top:10px">El súper va primero: es lo que queda de tus ingresos después de los fijos y de los demás gastos. Si querés, reservá una parte para ahorrar:</div>
  <div class="flt" style="margin:10px 0 0">${[0,10,20].map(p=>`<button class="chip ${(S.supSave||0)===p?'on':''}" onclick="keep(()=>{S.supSave=${p}})">${p?'Ahorrar '+p+'%':'No ahorrar por ahora'}</button>`).join('')}</div></div>
  <div class="card"><div style="font-weight:700;margin-bottom:8px">Cómo se reparte tu mes</div><div class="sm" style="margin-bottom:6px">De referencia: 50% esenciales, 30% gustos, 20% ahorro. No es una obligación.</div>
  <div class="row"><span class="lbl">Esenciales (fijos + súper + otros)</span><span class="val">${Math.round((fx+ss+need)/B*100)}% <span class="sm">/ 50%</span></span></div>
  <div class="row"><span class="lbl">Gustos (el resto de lo gastado)</span><span class="val">${Math.round(Math.max(0,tot-ss-need)/B*100)}% <span class="sm">/ 30%</span></span></div>
  <div class="row"><span class="lbl">Ahorro (lo que queda)</span><span class="val" style="color:${disp>=B*0.2?'var(--ok)':'var(--warn)'}">${Math.round(Math.max(0,disp)/B*100)}% <span class="sm">/ 20%</span></span></div></div>
  <div class="card"><div style="font-weight:700;margin-bottom:8px">Para gastar menos en el súper</div>
  <div class="sm" style="line-height:1.6">• Armá la lista antes y andá con el presupuesto por semana.<br>• Hacé una compra grande por semana en vez de muchas chicas.<br>• Compará el precio por kilo o litro, no por paquete.<br>• Las marcas propias suelen salir bastante menos.<br>• Evitá ir con hambre.</div></div>`+list;
}
function incTab(){
  const ym=today().slice(0,7),Bs=S.income[ym]||0,xi=sum(S.inc.filter(i=>i.date.startsWith(ym))),ti=Bs+xi,gs=sum(monthExp())+sum(S.fixed),bal=ti-gs;
  const l=[...S.inc].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  return `<h1>Ingresos</h1>
  <div class="card"><div class="row"><span class="lbl">Sueldo del mes</span><span class="val">${fmt(Bs)}</span></div>
  <div class="row"><span class="lbl">Ingresos extra</span><span class="val" style="color:var(--ok)">${xi?'+':''}${fmt(xi)}</span></div>
  <div class="row"><span class="lbl">Total ingresos</span><span class="val">${fmt(ti)}</span></div>
  <div class="row"><span class="lbl">Gastos + fijos</span><span class="val">−${fmt(gs)}</span></div>
  <div class="row"><b>Balance del mes</b><span class="val" style="color:${bal>=0?'var(--ok)':'var(--bad)'}">${bal>=0?'+':'−'}${fmt(Math.abs(bal))}</span></div></div>
  <div class="card"><div class="lbl" style="margin-bottom:10px">Agregar ingreso extra</div>
  <input id="in" placeholder="Concepto (ej: service heladera)">
  <div class="row" style="margin-top:10px"><input id="ia" class="money" type="text" inputmode="decimal" placeholder="$ Monto"><input id="id" type="date" value="${today()}"></div>
  <button class="btn" onclick="addInc()">Agregar ingreso</button></div>
  <div class="card">${l.length?l.map(i=>`<div class="item"><div class="em">💰</div><div class="grow"><b>${esc(i.note||'Ingreso')}</b><span>${i.date.split('-').reverse().join('/')}</span></div><div class="val" style="color:var(--ok)">+${fmt(i.amt)}</div><button class="x" onclick="delInc(${i.id})" aria-label="Borrar">✕</button></div>`).join(''):'<div class="empty">Acá van los cobros extra: services, changas, devoluciones…</div>'}</div>`;
}
function addInc(){const amt=parseMoney($('#ia').value);if(!amt){$('#ia').focus();return}
  S.inc.push({id:Date.now(),amt,note:$('#in').value.trim(),date:$('#id').value||today()});save();render()}
function delInc(id){S.inc=S.inc.filter(i=>i.id!==id);save();render()}
function ant2(){
  const el=$('#sv');if(!el)return;
  const tot=sum(monthExp().filter(e=>e.h)),m=tot*S.pct/100;
  const pv=el.previousElementSibling.previousElementSibling;
  if(pv)pv.querySelector('.val').textContent=S.pct+'%';
  el.innerHTML=`<div><div class="sm">Ahorro por mes</div><div class="big ant" style="font-size:26px">${fmt(m)}</div></div><div style="text-align:right"><div class="sm">Ahorro por año</div><div class="big ant" style="font-size:26px">${fmt(m*12)}</div></div>`;
}
const eff=()=>M.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
function applyTheme(){document.documentElement.dataset.theme=eff();const b=$('#tg');if(b)b.textContent=eff()==='dark'?'☀️':'🌙'}
function toggleTheme(){M.theme=eff()==='dark'?'light':'dark';save();applyTheme()}
let pay='dig',lf='all';
const PAY={dig:'💳 Digital',efe:'💵 Efectivo'};
function payChips(){$('#pc').innerHTML=Object.keys(PAY).map(k=>`<button class="chip ${k===pay?'on':''}" onclick="pay='${k}';payChips()">${PAY[k]}</button>`).join('')}
function setLf(f){lf=f;keep(()=>{})}
function togRev(id){const e=S.exp.find(x=>x.id===id);if(e){e.rev=e.rev?0:1;keep(()=>{})}}
const fd=d=>d.split('-').reverse().join('/');
async function saveFile(name,data){
  let dl=null;try{dl=await claude.use('downloads')}catch(e){}
  if(!dl){dlg({title:'Descarga no disponible',msg:'La descarga no está disponible en esta vista.',cancel:false});return}
  try{await dl.save({filename:name,data})}catch(e){if(e&&e.code!=='declined')dlg({title:'No se pudo guardar el archivo',msg:'Código: '+((e&&e.code)||'error'),cancel:false})}
}
function expRows(){
  const g=[...S.exp].sort((a,b)=>a.date.localeCompare(b.date)).map(e=>({Fecha:fd(e.date),Categoría:cat$(e.cat).n,Comentario:e.note||'',Pago:e.pay==='dig'?'Digital':e.pay==='efe'?'Efectivo':'','USD original':e.usd||'','Cotización USD':e.rate||'',Hormiga:e.h?'Sí':'No','A revisar':e.rev?'Sí':'No',Monto:e.amt}));
  const i=[...S.inc].sort((a,b)=>a.date.localeCompare(b.date)).map(x=>({Fecha:fd(x.date),Concepto:x.note||'',Monto:x.amt}));
  const f=[...S.fixed].sort((a,b)=>(a.day||32)-(b.day||32)).map(x=>({Servicio:x.name,'Día de vencimiento':x.day||'',Comentario:x.note||'',Monto:x.amt}));
  const sl=Object.keys(S.income).sort().map(k=>({Mes:k,Sueldo:S.income[k]}));
  return {g,i,f,sl};
}
async function exportXlsx(){
  if(typeof XLSX==='undefined'){dlg({title:'Excel no disponible',msg:'No cargó el módulo de Excel. Revisá tu conexión y probá de nuevo, o usá CSV.',cancel:false});return}
  const {g,i,f,sl}=expRows(),wb=XLSX.utils.book_new(),add=(r,n,h)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(r.length?r:[h]),n);
  add(g,'Gastos',{Fecha:'',Categoría:'',Comentario:'',Pago:'',Hormiga:'',['A revisar']:'',Monto:''});
  add(i,'Ingresos',{Fecha:'',Concepto:'',Monto:''});
  add(f,'Servicios',{Servicio:'',['Día de vencimiento']:'',Comentario:'',Monto:''});
  add(sl,'Sueldos',{Mes:'',Sueldo:''});
  const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'});
  await saveFile('mis-gastos-'+today()+'.xlsx',buf);
}
async function exportCsv(){
  const {g,i,f}=expRows(),q=v=>{v=String(v);return /[";\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v},n=v=>String(v).replace('.',',');
  const L=[['Tipo','Fecha','Categoría / Concepto','Comentario','Pago','Hormiga','A revisar','Monto']];
  g.forEach(r=>L.push(['Gasto',r.Fecha,r.Categoría,r.Comentario,r.Pago,r.Hormiga,r['A revisar'],n(r.Monto)]));
  i.forEach(r=>L.push(['Ingreso',r.Fecha,r.Concepto,'','','','',n(r.Monto)]));
  f.forEach(r=>L.push(['Fijo mensual','',r.Servicio,r.Comentario,'','','',n(r.Monto)]));
  await saveFile('mis-gastos-'+today()+'.csv','\ufeff'+L.map(r=>r.map(q).join(';')).join('\r\n'));
}
async function exportBackup(){
  save();const profiles={};M.list.forEach(p=>{profiles[p.id]=p.id===M.cur?S:loadP(p.id)});
  await saveFile('mis-gastos-copia-'+today()+'.json',JSON.stringify({app:'mis-gastos',v:2,fecha:today(),meta:{cur:M.cur,list:M.list},profiles},null,1));
}
function importBackup(inp){
  const f=inp.files&&inp.files[0];inp.value='';if(!f)return;
  const r=new FileReader();
  r.onload=async()=>{try{
    const j=JSON.parse(String(r.result));
    if(j&&j.v===2&&j.profiles&&j.meta&&Array.isArray(j.meta.list)&&j.meta.list.length){
      if(!await dlg({title:'Cargar copia',msg:'Esto reemplaza TODOS los perfiles de este dispositivo por los de la copia ('+j.meta.list.map(p=>p.name).join(', ')+').',ok:'Reemplazar'}))return;
      M.list.forEach(p=>{try{localStorage.removeItem(pk(p.id))}catch(e){}});
      M={cur:j.meta.list.some(p=>p.id===j.meta.cur)?j.meta.cur:j.meta.list[0].id,list:j.meta.list,theme:M.theme,fx:M.fx};
      Object.keys(j.profiles).forEach(id=>{try{localStorage.setItem(pk(id),JSON.stringify(j.profiles[id]))}catch(e){}});
      S=loadP(M.cur);
    }else{
      const d=j&&j.app==='mis-gastos'?j.data:j;
      if(!d||!Array.isArray(d.exp))throw 0;
      if(!await dlg({title:'Cargar copia',msg:'Esto reemplaza los datos del perfil actual por los de la copia ('+d.exp.length+' gastos).',ok:'Reemplazar'}))return;
      S=Object.assign(DEFS(),d);
    }
    save();applyTheme();render();dlg({title:'Copia cargada',cancel:false});
  }catch(e){dlg({title:'No pude leer ese archivo',msg:'Tiene que ser una copia guardada desde esta app (.json).',cancel:false})}};
  r.readAsText(f);
}
const exportCard=()=>(window.syncCard?syncCard():'')+`<div class="card"><div class="lbl" style="margin-bottom:10px">Exportar mis datos</div><div class="flt" style="margin:0"><button class="chip" onclick="exportXlsx()">📊 Excel (.xlsx)</button><button class="chip" onclick="exportCsv()">📄 CSV</button></div>
<div class="lbl" style="margin:14px 0 10px">Copia de seguridad</div><div class="flt" style="margin:0"><button class="chip" onclick="exportBackup()">💾 Guardar copia</button><label class="chip" style="cursor:pointer">📥 Cargar copia<input type="file" accept=".json,application/json" onchange="importBackup(this)" style="display:none"></label></div>
<div class="sm" style="margin-top:8px">La copia guarda todos los perfiles (gastos, ingresos, servicios, sueldo y metas) para cargarlo en otro dispositivo o sesión.</div></div>`;
function list(){
  const ex=[...S.exp].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
  if(!ex.length)return `<h1>Gastos</h1><div class="card empty">Acá vas a ver tus gastos.<br>Tocá + para cargar el primero.</div>${exportCard()}`;
  const sd=sum(ex.filter(e=>e.pay==='dig')),se=sum(ex.filter(e=>e.pay==='efe')),nr=ex.filter(e=>e.rev).length;
  const F=[['all','Todos'],['dig','💳 Digital'],['efe','💵 Efectivo'],['rev','🚩 A revisar'+(nr?' ('+nr+')':'')]];
  const vis=ex.filter(e=>lf==='all'||(lf==='rev'?e.rev:e.pay===lf));
  const hd=`<h1>Gastos</h1><div class="card"><div class="row"><span class="lbl">💳 Digital</span><span class="val">${fmt(sd)}</span></div><div class="row"><span class="lbl">💵 Efectivo</span><span class="val">${fmt(se)}</span></div></div><div class="flt">${F.map(f=>`<button class="chip ${lf===f[0]?'on':''}" onclick="setLf('${f[0]}')">${f[1]}</button>`).join('')}</div>`;
  const aw=`<details class="dt" ${antOpen?'open':''} ontoggle="antOpen=this.open"><summary>🐜 Gastos hormiga · ${fmt(sum(monthExp().filter(e=>e.h)))} este mes</summary>${ant().replace('<h1>Gastos hormiga</h1>','')}</details>`;
  if(!vis.length)return hd+aw+`<div class="card empty">No hay gastos en este filtro.</div>`+exportCard();
  return hd+aw+`<div class="card">${vis.map(e=>{const c=cat$(e.cat);return `<div class="item${e.rev?' mark':''}"><div class="em">${c.e}</div><div class="grow"><b>${c.n}${e.h?' <span class="ant">🐜</span>':''}${e.pay?'<span class="pay">'+(e.pay==='dig'?'💳':'💵')+'</span>':''}</b><span>${e.date.split('-').reverse().join('/')}${e.usd?' · US$ '+fmtN(e.usd)+' a '+fmt(e.rate):''}${e.note?' · '+esc(e.note):''}</span></div><div class="val">${fmt(e.amt)}</div><button class="x rv${e.rev?' on':''}" onclick="togRev(${e.id})" aria-label="Marcar para revisar">🚩</button><button class="x" onclick="del(${e.id})" aria-label="Borrar">✕</button></div>`}).join('')}</div>${exportCard()}`;
}
function del(id){S.exp=S.exp.filter(e=>e.id!==id);save();render()}
function chips(){
  $('#ch').innerHTML=CATS.map(c=>`<button class="chip ${c.id===cat?'on':''}" onclick="pick('${c.id}')">${c.e} ${c.n}</button>`).join('');
}
function pick(id){cat=id;$('#h').checked=!!cat$(id).h;chips()}
function openSheet(){
  cat='cafe';$('#a').value='';$('#n').value='';$('#d').value=today();$('#h').checked=true;pay=S.lastPay||'dig';cur='ars';curChips();payChips();chips();
  $('#sh').classList.add('o');setTimeout(()=>$('#a').focus(),50);
}
function closeSheet(){$('#sh').classList.remove('o')}
function saveExp(){
  let amt=parseMoney($('#a').value);
  if(!amt||amt<=0){$('#a').focus();return}
  const fxo=cur==='usd'?{usd:amt,rate:fxRate()}:{};
  if(cur==='usd')amt=Math.round(amt*fxo.rate*100)/100;
  S.exp.push({...fxo,id:Date.now(),amt,cat,note:$('#n').value.trim(),date:$('#d').value||today(),h:$('#h').checked?1:0,pay,rev:0});S.lastPay=pay;
  save();closeSheet();render();
}
function parseCSV(t){
 const sm=t.split(/\r?\n/).slice(0,15);
 const dl=[';','\t',','].map(d=>[d,sm.reduce((n,l)=>n+l.split(d).length-1,0)]).sort((a,b)=>b[1]-a[1])[0][0];
 const rows=[];let r=[],c='',q=false;
 for(let i=0;i<t.length;i++){const ch=t[i];
  if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}
  else if(ch==='"')q=true;
  else if(ch===dl){r.push(c);c=''}
  else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);c='';rows.push(r);r=[]}
  else c+=ch}
 if(c||r.length){r.push(c);rows.push(r)}
 return rows}
function num(s){s=String(s||'').trim();if(!s)return 0;const neg=/^\s*-|^\(|-\s*$/.test(s);s=s.replace(/[^\d.,]/g,'');
 if(s.includes(',')&&s.includes('.')){s=s.lastIndexOf(',')>s.lastIndexOf('.')?s.replace(/\./g,'').replace(',','.'):s.replace(/,/g,'')}
 else if(s.includes(','))s=s.replace(',','.');
 else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
 const v=parseFloat(s)||0;return neg?-v:v}
function pdate(s){s=String(s||'').trim();let m=s.match(/(\d{4})-(\d{2})-(\d{2})/);if(m)return m[0];
 m=s.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);if(!m)return null;let y=+m[3];if(y<100)y+=2000;return y+'-'+p2(m[2])+'-'+p2(m[1])}
function toTx(rows){
 const hi=rows.findIndex(r=>r.some(c=>/fecha/i.test(c)));if(hi<0)return null;
 const H=rows[hi].map(c=>c.toLowerCase()),f=re=>H.findIndex(h=>re.test(h));
 const iD=f(/fecha/),iT=f(/descrip|concepto|detalle|movimiento|referencia|leyenda/),iDb=f(/d[eé]bito/),iA=f(/importe|monto/);
 if(iD<0||iT<0||(iDb<0&&iA<0))return null;
 const body=rows.slice(hi+1).map(r=>({d:pdate(r[iD]),t:(r[iT]||'').trim(),v:iDb>=0?Math.abs(num(r[iDb])):num(r[iA])})).filter(x=>x.d);
 const neg=iDb<0&&body.some(x=>x.v<0),out=[];
 body.forEach(x=>{const a=iDb>=0?x.v:neg?(x.v<0?-x.v:0):x.v;if(a>0)out.push({date:x.d,desc:x.t,amt:a})});
 return out}
const kx=x=>x.date+'|'+x.desc+'|'+x.amt;
const mk=d=>d.toUpperCase().replace(/[0-9\/\-\.\*#]+/g,' ').replace(/\s+/g,' ').trim().split(' ').slice(0,3).join(' ')||'SIN DETALLE';
const mlab=m=>new Date(m+'-01T12:00:00').toLocaleDateString('es-AR',{month:'short',year:'2-digit'});
function onFile(inp){const f=inp.files[0];if(!f)return;const isX=/\.xlsx?$/i.test(f.name),rd=new FileReader();
 rd.onload=()=>{try{let txt;
  if(isX){if(!window.XLSX)throw 0;const wb=XLSX.read(rd.result,{type:'array'});txt=XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]],{FS:';',dateNF:'dd/mm/yyyy'})}else txt=rd.result;
  const tx=toTx(parseCSV(txt));
  if(!tx||!tx.length){bankMsg='No pude leer movimientos en ese archivo. Necesito columnas de fecha, descripción e importe (o débito).';render();return}
  const have=new Set(S.bank.map(kx));let n=0;tx.forEach(x=>{if(!have.has(kx(x))){S.bank.push(x);have.add(kx(x));n++}});
  bankMsg='Listo: sumé '+n+' gastos nuevos.';save();render()}catch(e){bankMsg='No pude abrir el archivo. Probá exportarlo como CSV desde tu home banking.';render()}};
 isX?rd.readAsArrayBuffer(f):rd.readAsText(f)}
function bank(){
 const B=S.bank;
 const up=`<div class="card"><div class="lbl">Subí el resumen de tu banco (CSV o Excel)</div><label class="btn s" style="display:inline-block;margin-top:10px;background:var(--ok);color:#fff">Elegir archivo<input type="file" accept=".csv,.txt,.xls,.xlsx,text/csv" onchange="onFile(this)" style="display:none"></label><div class="sm" style="margin-top:10px">${bankMsg||'Se procesa en tu teléfono y no se sube a ningún lado.'}</div></div>`;
 if(!B.length)return `<h1>Resumen del banco</h1>`+up;
 const mon={},mer={};
 B.forEach(x=>{const m=x.date.slice(0,7);mon[m]=(mon[m]||0)+x.amt;const k=mk(x.desc),o=(mer[k]=mer[k]||{});const e=(o[m]=o[m]||{t:0,n:0});e.t+=x.amt;e.n++});
 const ms=Object.keys(mon).sort().slice(-4);
 const meses=ms.map((m,i)=>{const p=i?mon[ms[i-1]]:0,d=p?(mon[m]-p)/p*100:null;return `<div class="row"><span>${mlab(m)}</span><span class="val">${fmt(mon[m])} ${d===null?'':`<span style="font-size:12px;color:${d>5?'var(--bad)':d<-5?'var(--ok)':'var(--mute)'}">${d>0?'+':''}${Math.round(d)}%</span>`}</span></div>`}).join('');
 const aum=[];
 Object.entries(mer).forEach(([k,o])=>{const mm=Object.keys(o).sort();if(mm.length<2)return;const a=o[mm[mm.length-2]],b=o[mm[mm.length-1]],pa=a.t/a.n,pb=b.t/b.n;
  if(pb>pa*1.05&&pb-pa>=200)aum.push({k,pa,pb,pc:(pb/pa-1)*100,mm:mlab(mm[mm.length-1])})});
 aum.sort((x,y)=>y.pb-y.pa-(x.pb-x.pa));
 const am=B.map(x=>x.amt).sort((a,b)=>a-b),med=am[Math.floor(am.length/2)];
 const all=[...B].sort((a,b)=>b.amt-a.amt);
 let big=all.filter(x=>x.amt>=med*4).slice(0,8),bt='Gastos grandes';
 if(!big.length){big=all.slice(0,3);bt='Tus gastos más altos'}
 const it=(t,s,v,c)=>`<div class="item"><div class="grow"><b>${esc(t)}</b><span>${s}</span></div><div class="val" style="color:${c||'inherit'}">${v}</div></div>`;
 return `<h1>Resumen del banco</h1>
 <div class="card"><div class="lbl" style="margin-bottom:10px">Gasto por mes (el último puede estar incompleto)</div>${meses}</div>
 <div class="card"><div class="lbl">Aumentos detectados</div>${aum.length?aum.slice(0,8).map(a=>it(a.k,fmt(a.pa)+' → '+fmt(a.pb)+' por compra · '+a.mm,'+'+Math.round(a.pc)+'%','var(--bad)')).join(''):'<div class="sm" style="margin-top:8px">No vi aumentos en cargos que se repiten. Con más meses cargados detecto mejor.</div>'}</div>
 <div class="card"><div class="lbl">${bt}</div>${big.map(x=>it(x.desc||'Sin detalle',x.date.split('-').reverse().join('/'),fmt(x.amt))).join('')}</div>
 ${up}
 <button class="btn s" style="background:none;color:var(--mute);border:1px solid var(--line)" onclick="S.bank=[];bankMsg='';save();render()">Borrar resumen cargado</button>`}
function qIncome(v){S.income[today().slice(0,7)]=Math.max(0,parseMoney(v));save()}
function qGoalP(v){S.goalP=Math.min(100,Math.max(0,parseInt(String(v).replace(/\D/g,''))||0));save()}
function setGoalP(v){keep(()=>{S.goalP=Math.min(100,Math.max(0,parseInt(String(v).replace(/\D/g,''))||0))})}
function qGoal(v){S.goal=Math.max(0,parseMoney(v));save()}
function qGoalM(v){S.goalM=Math.max(0,parseMoney(v));save()}
function setIncome(v){S.income[today().slice(0,7)]=Math.max(0,parseMoney(v));save();render()}
function keep(fn){const y=window.scrollY;fn();save();render();window.scrollTo(0,y)}
function setGoal(v){keep(()=>{S.goal=Math.max(0,parseMoney(v))})}
function setGoalM(v){keep(()=>{S.goalM=Math.max(0,parseMoney(v))})}
function fixedTab(){
  const f=[...S.fixed].sort((a,b)=>(a.day||32)-(b.day||32)),tot=sum(f),B=S.income[today().slice(0,7)]||0,hoy=new Date().getDate();
  const due=x=>{if(!x.day)return '';const df=x.day-hoy;return 'Vence el día '+x.day+(df===0?' · hoy':df>0&&df<=7?' · en '+df+' días':'')};
  const items=f.length?f.map(x=>`<div class="item"><div class="em">📌</div><div class="grow"><b>${esc(x.name)}</b><span>${[due(x),x.note?esc(x.note):''].filter(Boolean).join(' · ')||'Sin vencimiento'}</span></div><div class="val">${fmt(x.amt)}</div><button class="x" onclick="editFixed(${x.id})" aria-label="Cambiar monto">✎</button><button class="x" onclick="delFixed(${x.id})" aria-label="Borrar">✕</button></div>`).join(''):'<div class="empty">Todavía no cargaste gastos fijos.<br>Alquiler, luz, internet, celular, suscripciones…</div>';
  return `<h1>Servicios y gastos fijos</h1>
  <div class="card"><div class="row"><span class="lbl">Total fijo por mes</span><span class="val">${fmt(tot)}</span></div>${B&&tot?`<div class="row"><span class="lbl">Del sueldo del mes</span><span class="val">${Math.round(tot/B*100)}%</span></div>`:''}${B&&tot?`<div class="row"><span class="lbl">Te queda para el resto</span><span class="val">${fmt(B-tot)}</span></div>`:''}</div>
  <div class="card"><div class="lbl" style="margin-bottom:10px">Agregar gasto fijo</div>
  <input id="fn" placeholder="Nombre (Alquiler, Luz, Internet…)">
  <div class="row" style="margin-top:10px"><input id="fa" class="money" type="text" inputmode="decimal" placeholder="$ Monto"><input id="fd" type="number" inputmode="numeric" min="1" max="31" placeholder="Día de vencimiento"></div>
  <input id="fc" placeholder="Comentario (opcional)" style="margin-top:10px">
  <button class="btn" onclick="addFixed()">Agregar</button></div>
  <div class="card">${items}</div>`;
}
function addFixed(){
  const name=$('#fn').value.trim(),amt=parseMoney($('#fa').value),day=Math.min(31,Math.max(0,parseInt($('#fd').value)||0));
  if(!name){$('#fn').focus();return}
  if(!amt||amt<=0){$('#fa').focus();return}
  S.fixed.push({id:Date.now(),name,amt,day,note:$('#fc').value.trim()});save();render();
}
function delFixed(id){S.fixed=S.fixed.filter(x=>x.id!==id);save();render()}
async function editFixed(id){
  const x=S.fixed.find(y=>y.id===id);if(!x)return;
  const v=await dlg({title:'Nuevo monto para '+x.name,input:1,def:mv(x.amt)});if(v===null)return;
  const n=parseMoney(v);if(n>0){x.amt=n;save();render()}
}
function plan(B){
  const P=S.goalP||0,ex=monthExp(),tot=sum(ex),fx=sum(S.fixed),n=new Date(),d=n.getDate(),dim=new Date(n.getFullYear(),n.getMonth()+1,0).getDate();
  const proj=tot/d*dim+fx,extra=sum(ex.filter(e=>e.h))/d*dim*S.pct/100;
  const chipsP=[5,10,20].map(p=>`<button class="chip ${P===p?'on':''}" onclick="keep(()=>{S.goalP=${p}})">${p}%</button>`).join('');
  let h=`<div class="card"><div style="font-weight:700;margin-bottom:10px">🎯 Meta de ahorro</div><div class="row"><span class="lbl">Quiero ahorrar un</span><span style="display:flex;align-items:center;gap:6px"><input type="text" inputmode="numeric" style="width:80px;text-align:right" value="${P||''}" placeholder="0" oninput="qGoalP(this.value)" onchange="setGoalP(this.value)"><b>%</b></span></div><div class="flt" style="margin:10px 0 0">${chipsP}</div><div class="sm" style="margin-top:8px">Porcentaje del sueldo que te va quedando.</div>`;
  if(P){
    if(!B){h+=`<div class="sm" style="margin-top:12px">Cargá tu sueldo para calcular cuánto ahorrar.</div>`}
    else{
      const disp=B-tot-fx,fin=B-proj;
      h+=`<div class="row" style="margin-top:14px"><span class="lbl">Hoy te quedan</span><span class="val">${fmt(Math.max(disp,0))}</span></div>`;
      if(disp>0)h+=`<div class="row"><span class="lbl">Guardá hoy (${P}%)</span><span class="val" style="color:var(--ok)">${fmt(disp*P/100)}</span></div><div class="row"><span class="lbl">Y gastá como máximo</span><span class="val">${fmt(disp*(1-P/100))}</span></div>`;
      else h+=`<div class="sm" style="margin-top:8px;color:var(--bad)">Hoy no te queda plata para ahorrar este mes.</div>`;
      if(ex.length){
        if(fin>0){h+=`<div class="row" style="margin-top:12px"><span class="lbl">A fin de mes, con tu ritmo, te sobrarían ${fmt(fin)}<br><b style="color:var(--ink)">Ahorro estimado (${P}%)</b></span><span class="val" style="color:var(--ok)">${fmt(fin*P/100)}</span></div>`;
          if(extra>0)h+=`<div class="row"><span class="lbl">Recortando hormiga un ${S.pct}%</span><span class="val" style="color:var(--ok)">${fmt((fin+extra)*P/100)}</span></div>`}
        else h+=`<div class="sm" style="margin-top:12px;color:var(--bad)">Con tu ritmo actual gastás más de lo que ingresa, así que a fin de mes no sobraría para ahorrar.</div>`;
        h+=`<div class="sm" style="margin-top:10px">Es una estimación: mejora a medida que cargás gastos.</div>`;
      }
    }
  }
  return h+'</div>';
}
applyTheme();render();
(()=>{let ok=0;try{ok=localStorage.getItem('gastos-ok')}catch(e){}
 if(!ok)dlg({title:'🔒 Tus datos son tuyos',msg:'Todo lo que cargás (gastos, sueldo, ingresos) se guarda solo en este dispositivo, dentro de tu navegador. Solo se sube a tu servidor si creás una cuenta en \"Mi cuenta\" para sincronizar.\n\nLa app únicamente consulta la cotización del dólar, sin enviar ningún dato tuyo.\n\nTip: usá "Guardar copia" de vez en cuando para tener un respaldo.',ok:'Aceptar y empezar',cancel:false}).then(()=>{try{localStorage.setItem('gastos-ok','1')}catch(e){}})})();
fetchFx();setInterval(fetchFx,300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)fetchFx()});
