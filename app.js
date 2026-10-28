'use strict';
const $=s=>document.querySelector(s),app=$('#app'),esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const DB=new Promise((ok,no)=>{const r=indexedDB.open('chinese-pocket',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const kv=async(k,v)=>{const d=await DB;return new Promise((ok,no)=>{const s=d.transaction('kv',v===undefined?'readonly':'readwrite').objectStore('kv'),q=v===undefined?s.get(k):s.put(v,k);q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})};
const DAY=864e5,VER=1,REQ=['hanzi','pinyin','meaning_vi'];
let S=[],M=new Map(),U,hide=false;
const blank=()=>({v:VER,fav:{},seen:{},flag:{},mem:{},groups:[],sess:{}});
const save=()=>kv('user',U);
function validate(arr){const ok=[],bad=[],ids=new Set();(Array.isArray(arr)?arr:[]).forEach((r,i)=>{const w='mục '+(i+1);
 if(!r||typeof r!=='object')return bad.push(w+': không phải đối tượng');
 if(!r.id)return bad.push(w+': thiếu id');if(ids.has(r.id))return bad.push(w+': ID trùng '+r.id);
 const m=REQ.filter(k=>!String(r[k]??'').trim());if(m.length)return bad.push(w+' ('+r.id+'): thiếu '+m.join(', '));
 ids.add(r.id);ok.push({id:r.id,hanzi:r.hanzi,han_viet:r.han_viet||'',pinyin:r.pinyin,meaning_vi:r.meaning_vi})});return{ok,bad}}
async function load(){let base=[];try{const r=await fetch('data/sentences.json');if(r.ok){const j=await r.json();if(Array.isArray(j))base=j}}catch{}
 const extra=await kv('extra')||[];
 S=[...new Map([...base,...extra].map(s=>[s.id,s])).values()].sort((a,b)=>a.id<b.id?-1:1);M=new Map(S.map(s=>[s.id,s]));
 U=Object.assign(blank(),await kv('user')||{})}
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const mark=id=>{if(!U.seen[id]){U.seen[id]=Date.now();save()}};
const toggle=(o,id)=>{o[id]?delete o[id]:o[id]=Date.now();save()};
function modal(html){const d=$('#dlg');d.innerHTML=html+'<button onclick="$(\'#dlg\').close()">Đóng</button>';d.showModal()}
function card(s){return`<div class="card" data-id="${s.id}"><div class="mut">${s.id}</div><div class="hz" lang="zh">${esc(s.hanzi)}</div><div class="py">${esc(s.pinyin)}</div><div class="hv">${esc(s.han_viet)}</div>
<div class="mean ${hide?'h':''}" onclick="this.classList.remove('h')">${esc(s.meaning_vi)}</div>
<div class="row"><button onclick="fav('${s.id}',this)" class="${U.fav[s.id]?'on':''}">${U.fav[s.id]?'♥':'♡'} Yêu thích</button><button onclick="flag('${s.id}',this)" class="${U.flag[s.id]?'on':''}">🚩 Xem lại</button><button onclick="pickGroup('${s.id}')">＋ Nhóm</button></div></div>`}
window.fav=(id,b)=>{toggle(U.fav,id);b.className=U.fav[id]?'on':'';b.textContent=(U.fav[id]?'♥':'♡')+' Yêu thích'};
window.flag=(id,b)=>{toggle(U.flag,id);b.className=U.flag[id]?'on':''};
window.pickGroup=id=>{if(!U.groups.length)return modal('<p>Chưa có nhóm. Hãy tạo nhóm ở mục "Nhóm của tôi".</p>');
 modal('<b>Thêm vào nhóm</b>'+U.groups.map(g=>`<button onclick="addG('${g.id}','${id}')">${g.ids.includes(id)?'✓ ':''}${esc(g.name)}</button>`).join(''))};
window.addG=(g,id)=>{const G=U.groups.find(x=>x.id===g);if(!G.ids.includes(id))G.ids.push(id);save();$('#dlg').close()};
const pct=(a,b)=>b?Math.round(a*100/b):0,bar=(a,b)=>`<div class="bar"><i style="width:${pct(a,b)}%"></i></div>`;
const tile=(t,s,f)=>`<button class="tile" onclick="${f}"><b>${t}</b><small>${s}</small></button>`;
/* HOME */
window.home=()=>{const seen=S.filter(s=>U.seen[s.id]).length,nf=Object.keys(U.fav).filter(i=>M.has(i)).length,cur=Object.entries(U.sess).filter(([,x])=>x.pos<x.order.length);
 if(!S.length){app.innerHTML=`<div class="card"><h3>Chưa có dữ liệu câu</h3><p>Thêm file Excel (STT, Tiếng Trung, Âm Hán Việt, Pinyin, Tiếng Việt) để bắt đầu học.</p><div class="row"><button class="p" onclick="syncSheet()">🔄 Cập nhật từ Google Sheet</button><button onclick="data()">📥 Thêm file</button></div></div>`;return}
 app.innerHTML=`<div class="grid">${tile('📚 Kho '+S.length+' câu',`Đã tiếp xúc ${seen}/${S.length}`,'browse()')}${tile('♥ Cá nhân',nf+' câu · bắt đầu học',"scope('fav')")}${tile('🗂 Nhóm của tôi',U.groups.length+' nhóm','groups()')}${tile('🎲 Học ngẫu nhiên','Không lặp trong một lượt',"start('all','random')")}${tile('🔁 Ôn tập','Yêu thích, cần xem lại, chưa nhớ…','review()')}${tile('📊 Thống kê','Tiến độ học','stats()')}${tile('⚙ Cài đặt & dữ liệu','Xuất · nhập','data()')}</div>
 ${cur.length?'<h3>Tiếp tục học</h3>'+cur.map(([k,x])=>`<div class="card">${esc(label(k))} — ${x.pos}/${x.order.length}${bar(x.pos,x.order.length)}<div class="row"><button class="p" onclick="resume('${k}')">Tiếp tục</button><button onclick="drop('${k}')">Bỏ lượt</button></div></div>`).join(''):''}`};
const label=k=>{const[,sc,mode]=k.match(/^(.*)\|(\w+)$/);const n=sc==='all'?'Kho':sc==='fav'?'Cá nhân':sc.startsWith('g:')?(U.groups.find(g=>g.id===sc.slice(2))||{name:'(nhóm đã xóa)'}).name:sc;return n+' · '+(mode==='random'?'ngẫu nhiên':'lần lượt')};
window.drop=k=>{delete U.sess[k];save();home()};
/* BROWSE */
let q={t:'',f:'all',p:0};const PS=30;
window.browse=()=>{app.innerHTML=`<input type="search" id="q" placeholder="Tìm chữ Hán, pinyin, nghĩa…" value="${esc(q.t)}"><select id="f"><option value="all">Tất cả</option><option value="fav">Yêu thích</option><option value="non">Chưa yêu thích</option></select><div id="list"></div>`;
 $('#f').value=q.f;$('#q').oninput=e=>{q.t=e.target.value;q.p=0;lst()};$('#f').onchange=e=>{q.f=e.target.value;q.p=0;lst()};lst()};
const fold=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
function lst(){const t=fold(q.t.trim());let r=S.filter(s=>(q.f==='all'||(q.f==='fav')===!!U.fav[s.id])&&(!t||s.hanzi.includes(q.t.trim())||fold(s.pinyin).includes(t)||fold(s.meaning_vi).includes(t)||fold(s.han_viet).includes(t)));
 const pg=Math.max(1,Math.ceil(r.length/PS));q.p=Math.min(q.p,pg-1);const a=q.p*PS;r.slice(a,a+PS).forEach(s=>mark(s.id));
 $('#list').innerHTML=`<p class="mut">${r.length?`${a+1}–${Math.min(a+PS,r.length)}`:0} / ${r.length} câu (kho: ${S.length})</p>`+r.slice(a,a+PS).map(card).join('')+`<div class="row"><button ${q.p?'':'disabled'} onclick="q.p--;lst();scrollTo(0,0)">← Trước</button><span class="n">${q.p+1}/${pg}</span><button ${q.p<pg-1?'':'disabled'} onclick="q.p++;lst();scrollTo(0,0)">Sau →</button></div>`}
window.q=q;window.lst=lst;
/* GROUPS */
window.groups=()=>{app.innerHTML=`<div class="row"><button class="p" onclick="newG()">＋ Tạo nhóm mới</button></div>`+(U.groups.map(g=>{const ids=g.ids.filter(i=>M.has(i)),s=ids.filter(i=>U.seen[i]).length;return`<div class="card"><b>${esc(g.name)}</b> <span class="mut">${ids.length} câu</span>${bar(s,ids.length)}<div class="row"><button onclick="start('g:${g.id}','order')">Học hết</button><button onclick="start('g:${g.id}','random')">Ngẫu nhiên</button><button onclick="viewG('${g.id}')">Xem</button><button onclick="renG('${g.id}')">Đổi tên</button><button onclick="delG('${g.id}')">Xóa</button></div></div>`}).join('')||'<p class="mut">Chưa có nhóm.</p>')};
window.newG=()=>{const n=prompt('Tên nhóm:');if(n&&n.trim()){U.groups.push({id:'G'+Date.now().toString(36),name:n.trim(),ids:[]});save();groups()}};
window.renG=id=>{const g=U.groups.find(x=>x.id===id),n=prompt('Tên mới:',g.name);if(n&&n.trim()){g.name=n.trim();save();groups()}};
window.delG=id=>{if(confirm('Xóa nhóm? Câu gốc, yêu thích và lịch sử học được giữ nguyên.')){U.groups=U.groups.filter(g=>g.id!==id);for(const k in U.sess)if(k.startsWith('g:'+id+'|'))delete U.sess[k];save();groups()}};
window.viewG=id=>{const g=U.groups.find(x=>x.id===id);app.innerHTML=`<h3>${esc(g.name)} (${g.ids.length})</h3><div class="row"><button onclick="groups()">← Nhóm</button><button onclick="addFavs('${id}')">Thêm tất cả câu Cá nhân</button></div>`+g.ids.filter(i=>M.has(i)).map(i=>card(M.get(i))+`<button onclick="rmG('${id}','${i}')">Xóa khỏi nhóm</button>`).join('')};
window.rmG=(g,i)=>{const G=U.groups.find(x=>x.id===g);G.ids=G.ids.filter(x=>x!==i);save();viewG(g)};
window.addFavs=id=>{const G=U.groups.find(x=>x.id===id);Object.keys(U.fav).forEach(i=>{if(M.has(i)&&!G.ids.includes(i))G.ids.push(i)});save();viewG(id)};
/* STUDY (lần lượt / ngẫu nhiên / ôn tập) */
const pool=sc=>sc==='all'?S.map(s=>s.id):sc==='fav'?Object.keys(U.fav):sc==='flag'?Object.keys(U.flag):sc==='no'?Object.keys(U.mem).filter(i=>U.mem[i].lv===0):sc==='old'?S.filter(s=>!U.mem[s.id]||Date.now()-U.mem[s.id].last>7*DAY).map(s=>s.id):sc.startsWith('g:')?(U.groups.find(g=>g.id===sc.slice(2))||{ids:[]}).ids:[];
window.scope=sc=>{pool(sc).length?modal(`<button onclick="$('#dlg').close();start('${sc}','order')">Học lần lượt</button><button onclick="$('#dlg').close();start('${sc}','random')">Học ngẫu nhiên</button>`):modal('<p>Danh sách trống.</p>')};
window.start=(sc,mode)=>{const k=sc+'|'+mode,ids=pool(sc).filter(i=>M.has(i));if(!ids.length)return modal('<p>Danh sách trống.</p>');
 const ex=U.sess[k];if(ex&&ex.pos<ex.order.length&&confirm('Đang có lượt học dở ('+ex.pos+'/'+ex.order.length+'). OK = tiếp tục, Hủy = bắt đầu lượt mới.'))return resume(k);
 U.sess[k]={order:mode==='random'?shuffle(ids):(sc==='all'||sc.startsWith('g:')?ids:ids.sort()),pos:0,round:(ex?.round||0)+1,started:Date.now()};save();resume(k)};
window.resume=k=>{cur=k;study()};let cur,shown=false;
function study(){const x=U.sess[cur],done=x.pos>=x.order.length;
 if(done){return app.innerHTML=`<div class="card"><h3>🎉 Hoàn thành lượt học!</h3><p>${x.order.length} câu — ${esc(label(cur))}</p><div class="row"><button class="p" onclick="delete U.sess['${cur}'];start(...'${cur}'.split('|'))">Lượt mới</button><button onclick="home()">Trang chủ</button></div></div>`}
 const s=M.get(x.order[x.pos]);mark(s.id);
 app.innerHTML=`<p class="mut">${esc(label(cur))} · Đã học ${x.pos+1}/${x.order.length} · còn ${x.order.length-x.pos-1}</p>${bar(x.pos+1,x.order.length)}${card(s)}
 <div class="row"><button onclick="rate('${s.id}',0)">😕 Chưa nhớ</button><button onclick="rate('${s.id}',1)">🤔 Chưa chắc</button><button onclick="rate('${s.id}',2)">✅ Đã nhớ</button></div>
 <div class="row"><button ${x.pos?'':'disabled'} onclick="go(-1)">← Trước</button><button onclick="go(1)">Bỏ qua</button><button class="p" onclick="go(1)">Tiếp →</button></div>`}
window.go=d=>{const x=U.sess[cur];x.pos=Math.max(0,Math.min(x.order.length,x.pos+d));save();study()};
window.rate=(id,lv)=>{const m=U.mem[id]||{hist:[],n:0};m.lv=lv;m.last=Date.now();m.n++;m.hist.push([m.last,lv]);U.mem[id]=m;go(1)};
/* REVIEW */
window.review=()=>{const due=S.filter(s=>{const m=U.mem[s.id];return m&&m.lv<2&&Date.now()-m.last>(m.lv?2:0)*DAY}).length;
 app.innerHTML=`<div class="grid">${tile('♥ Yêu thích',Object.keys(U.fav).length+' câu',"scope('fav')")}${tile('🚩 Cần xem lại',Object.keys(U.flag).length+' câu',"scope('flag')")}${tile('😕 Chưa nhớ',Object.values(U.mem).filter(m=>m.lv===0).length+' câu',"scope('no')")}${tile('⏳ Lâu chưa học','chưa ôn > 7 ngày',"scope('old')")}</div><h3>Theo nhóm</h3><div class="grid">${U.groups.map(g=>tile(esc(g.name),g.ids.length+' câu',`scope('g:${g.id}')`)).join('')||'<span class="mut">Chưa có nhóm</span>'}</div><p class="mut">Gợi ý lịch: câu "chưa nhớ" ôn ngay, "chưa chắc" sau 2 ngày — hiện ${due} câu đến hạn.</p>`};
/* STATS */
window.stats=()=>{const n=S.length,ids=new Set(S.map(s=>s.id)),c=o=>Object.keys(o).filter(i=>ids.has(i)).length,rev=c(U.mem),mem=Object.keys(U.mem).filter(i=>ids.has(i)&&U.mem[i].lv===2).length;
 const rows=[['Tổng số câu',n],['Đã tiếp xúc',c(U.seen)],['Yêu thích',c(U.fav)],['Cần xem lại',c(U.flag)],['Đã ôn',rev],['Đánh dấu đã nhớ',mem]];
 app.innerHTML=`<div class="card">${rows.map(([a,b])=>`<div class="row"><span>${a}</span><b class="n">${b}</b></div>`).join('')}${bar(mem,n)}<small class="mut">Đã nhớ ${pct(mem,n)}% kho (chỉ tính câu tự đánh giá "Đã nhớ")</small></div><h3>Nhóm</h3>${U.groups.map(g=>{const t=g.ids.filter(i=>ids.has(i)),m=t.filter(i=>U.mem[i]?.lv===2).length;return`<div class="card">${esc(g.name)}: nhớ ${m}/${t.length}${bar(m,t.length)}</div>`}).join('')||'<p class="mut">Chưa có nhóm.</p>'}<h3>Lượt học</h3>${Object.entries(U.sess).map(([k,x])=>`<div class="card">${esc(label(k))}: ${x.pos}/${x.order.length}, còn ${x.order.length-x.pos}${bar(x.pos,x.order.length)}</div>`).join('')||'<p class="mut">Không có lượt nào.</p>'}`};
/* DATA: sao lưu & nhập */
window.data=()=>{app.innerHTML=`<div class="card"><b>Sao lưu dữ liệu cá nhân</b><p class="mut">Chuyển thủ công giữa thiết bị (không tự đồng bộ).</p><div class="row"><button class="p" onclick="exp()">⬇ Xuất file</button><button onclick="$('#imp').click()">⬆ Nhập sao lưu</button></div><input type="file" id="imp" accept=".json" hidden onchange="imp(this.files[0])"></div>
<div class="card"><b>📥 Thêm file câu (Excel / CSV / JSON)</b><p class="mut">Cột: STT, Tiếng Trung, Âm Hán Việt, Pinyin, Tiếng Việt (dòng đầu là tiêu đề). ID = S + STT. Nhập lại file đã sửa/bổ sung: câu cùng ID được cập nhật nội dung, tiến độ học giữ nguyên.</p><button class="p" onclick="$('#sen').click()">Chọn file…</button><input type="file" id="sen" accept=".xlsx,.xls,.csv,.json" hidden onchange="impS(this.files[0]);this.value=''"><div class="row"><button onclick="clearS()">Xóa toàn bộ câu đã nhập</button></div></div><div id="sync"></div><div id="rep"></div>`;renderSync()};
window.exp=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({app:'chinese-pocket',version:VER,exported:new Date().toISOString(),user:U})],{type:'application/json'}));a.download='chinese-pocket-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click()};
window.imp=async f=>{if(!f)return;let b;try{b=JSON.parse(await f.text())}catch{return alert('File không phải JSON hợp lệ.')}
 if(b.app!=='chinese-pocket'||!b.user)return alert('Sai định dạng sao lưu.');if(b.version>VER)return alert('File từ phiên bản mới hơn ('+b.version+'). Hãy cập nhật ứng dụng.');
 const o=b.user;let conf=0,add=0;for(const t of['fav','seen','flag'])for(const i in o[t]||{}){if(!U[t][i])add++;U[t][i]=Math.min(U[t][i]||Infinity,o[t][i])}
 for(const i in o.mem||{}){const a=U.mem[i],n=o.mem[i];if(!a||n.last>a.last){if(a&&a.lv!==n.lv)conf++;U.mem[i]={...n,hist:[...(a?.hist||[]),...n.hist].filter((h,j,r)=>r.findIndex(z=>z[0]===h[0])===j).sort((x,y)=>x[0]-y[0])}}else a.hist=[...a.hist,...n.hist].filter((h,j,r)=>r.findIndex(z=>z[0]===h[0])===j)}
 for(const g of o.groups||[]){const e=U.groups.find(x=>x.id===g.id);if(!e)U.groups.push(g);else{if(e.name!==g.name)conf++;g.ids.forEach(i=>{if(!e.ids.includes(i))e.ids.push(i)})}}
 for(const k in o.sess||{})if(!U.sess[k])U.sess[k]=o.sess[k];else if(JSON.stringify(U.sess[k].order)!==JSON.stringify(o.sess[k].order))conf++;
 await save();$('#rep').innerHTML=`<div class="card">✅ Đã hợp nhất (không ghi đè). Xung đột giữ bản hiện có/mới nhất: <b>${conf}</b>.</div>`};
const nk=t=>fold(String(t??'').trim()).replace(/\s+/g,' ');
function fromRows(rows){const bad=[],out=[];let h=rows.findIndex(r=>r&&r.some(c=>nk(c)==='stt'));
 let col={stt:0,hanzi:1,han_viet:2,pinyin:3,meaning_vi:4};
 if(h>=0){const r=rows[h].map(nk),f=(...n)=>r.findIndex(x=>n.includes(x));const c={stt:f('stt'),hanzi:f('tieng trung','hanzi'),han_viet:f('am han viet','han viet'),pinyin:f('pinyin'),meaning_vi:f('tieng viet','nghia')};
  if(Object.values(c).some(v=>v<0))return{ok:[],bad:['Thiếu cột. Cần: STT, Tiếng Trung, Âm Hán Việt, Pinyin, Tiếng Việt. Tìm thấy: '+rows[h].join(' | ')]};col=c}else h=0;
 const ids=new Set(),g=(r,k)=>String(r[col[k]]??'').trim();
 rows.slice(h+1).forEach((r,i)=>{const n='dòng '+(h+i+2);if(!r||r.every(c=>c===''||c==null))return;
  const stt=parseInt(g(r,'stt'),10);if(!(stt>0))return bad.push(n+': STT không hợp lệ ("'+g(r,'stt')+'")');
  const id='S'+String(stt).padStart(6,'0');if(ids.has(id))return bad.push(n+': ID trùng '+id);
  const m=REQ.filter(k=>!g(r,k));if(m.length)return bad.push(n+' ('+id+'): thiếu '+m.map(k=>({hanzi:'Tiếng Trung',pinyin:'Pinyin',meaning_vi:'Tiếng Việt'}[k])).join(', '));
  ids.add(id);out.push({id,hanzi:g(r,'hanzi'),han_viet:g(r,'han_viet'),pinyin:g(r,'pinyin'),meaning_vi:g(r,'meaning_vi')})});
 return{ok:out,bad}}
window.impS=async f=>{if(!f)return;let res;try{
  if(/\.json$/i.test(f.name))res=validate(JSON.parse(await f.text()));
  else{if(!window.XLSX)return alert('Thư viện đọc Excel chưa tải.');const wb=XLSX.read(await f.arrayBuffer(),{type:'array'});res=fromRows(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:false,defval:''}))}
 }catch(e){return alert('Không đọc được file: '+e.message)}
 const{ok,bad}=res;let nw=0,up=0;if(ok.length){const ex=await kv('extra')||[],m=new Map(ex.map(s=>[s.id,s]));ok.forEach(s=>{const o=m.get(s.id);o?(JSON.stringify(o)!==JSON.stringify(s)&&up++):nw++;m.set(s.id,s)});await kv('extra',[...m.values()]);await load()}
 $('#rep').innerHTML=`<div class="card">File <b>${esc(f.name)}</b>: hợp lệ <b>${ok.length}</b> (mới ${nw}, cập nhật ${up}) · lỗi <b>${bad.length}</b> · kho hiện có <b>${S.length}</b> câu.${bad.length?'<ul>'+bad.slice(0,100).map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul>'+(bad.length>100?'…':''):''}${ok.length?'<div class="row"><button class="p" onclick="home()">Về trang chủ</button></div>':''}</div>`};
window.clearS=async()=>{if(confirm('Xóa toàn bộ câu đã nhập? Tiến độ, yêu thích và nhóm vẫn được giữ (theo ID), sẽ hiện lại khi nhập lại file.')){await kv('extra',[]);await load();data()}};

const DEF_URL='https://docs.google.com/spreadsheets/d/1NvX9gIOxMZ_oPOuPjwksPSPIJuIDOESUiQGiQwK9T8M/edit?gid=451397321#gid=451397321';
async function renderSync(){const cfg=await kv('cfg')||{},meta=await kv('meta'),url=cfg.url||DEF_URL;
 $('#sync').innerHTML=`<div class="card"><b>🔄 Cập nhật dữ liệu từ Google Sheet</b>${location.protocol==='file:'?'<p>⚠ Bạn đang mở file trực tiếp từ máy. Nên dùng link GitHub Pages để app chạy đầy đủ (cài đặt, offline).</p>':''}<p class="mut">Tải bản dữ liệu mới nhất do người quản lý cập nhật. Yêu thích, nhóm, tiến độ của bạn được giữ nguyên.</p><p>${meta?`Cập nhật gần nhất: <b>${new Date(meta.at).toLocaleString('vi-VN')}</b> · ${meta.count} câu`:'Chưa cập nhật lần nào.'}</p><div class="row"><button class="p" onclick="syncSheet()">🔄 Cập nhật ngay</button></div><details><summary class="mut">Nguồn dữ liệu</summary><input type="text" id="surl" value="${esc(url)}"><button onclick="saveUrl()">Lưu nguồn</button></details><div id="srep"></div></div>`}
window.saveUrl=async()=>{await kv('cfg',{url:$('#surl').value.trim()||DEF_URL});alert('Đã lưu nguồn.')};
function gviz(id,gid){return new Promise((ok,no)=>{const cb='__gv'+Date.now(),s=document.createElement('script');
 const fin=()=>{clearTimeout(t);s.remove();delete window[cb]},t=setTimeout(()=>{fin();no(Error('hết thời gian chờ, có thể sheet chưa chia sẻ công khai'))},15000);
 window[cb]=j=>{fin();if(j.status!=='ok')return no(Error((j.errors&&j.errors[0]&&(j.errors[0].detailed_message||j.errors[0].message))||'Google từ chối truy cập'));
  const T=j.table;ok([T.cols.map(c=>c.label||''),...T.rows.map(r=>(r.c||[]).map(c=>c&&c.v!=null?c.v:''))])};
 s.onerror=()=>{fin();no(Error('không kết nối được tới Google'))};
 s.src='https://docs.google.com/spreadsheets/d/'+id+'/gviz/tq?tqx=out:json;responseHandler:'+cb+'&headers=1&gid='+gid;document.head.appendChild(s)})}
window.syncSheet=async()=>{const say=h=>{const e=$('#srep');e?e.innerHTML=h:alert(h.replace(/<[^>]+>/g,''))};
 const cfg=await kv('cfg')||{},url=cfg.url||DEF_URL,id=(url.match(/\/d\/([\w-]+)/)||[])[1],gid=(url.match(/gid=(\d+)/)||[])[1]||'0';
 if(!id)return say('Link Google Sheet không hợp lệ.');
 if(!navigator.onLine)return say('Không có Internet. Bạn vẫn học bình thường bằng dữ liệu đã tải.');
 say('Đang tải dữ liệu… (tối đa ~15 giây)');const base='https://docs.google.com/spreadsheets/d/'+id;let rows,err;
 try{rows=await gviz(id,gid)}catch(e1){err=e1;try{const r=await fetch(base+'/export?format=csv&gid='+gid,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const t=await r.text();if(/^\s*<(!doctype|html)/i.test(t))throw Error('sheet chưa chia sẻ công khai');const wb=XLSX.read(t,{type:'string',raw:true});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,raw:false,defval:''})}catch(e2){err=e1}}
 if(!rows)return say(`❌ Không tải được (${esc(err?.message)}).<br>Kiểm tra: (1) có Internet; (2) Google Sheet đã chia sẻ "Bất kỳ ai có đường liên kết" → quyền "Người xem"; (3) đúng link/tab. Cách tạm thời: tải sheet về máy dạng .xlsx rồi bấm "Chọn file…" ở trên.`);
 const res=fromRows(rows);
 const{ok,bad}=res;if(!ok.length)return say('❌ Không có dòng hợp lệ, dữ liệu hiện tại được giữ nguyên.'+(bad[0]?'<br>'+esc(bad[0]):''));
 const ex=await kv('extra')||[];if(ex.length>20&&ok.length<ex.length*.5&&!confirm('Bản mới chỉ có '+ok.length+' câu, ít hơn nhiều so với hiện tại ('+ex.length+'). Vẫn cập nhật?'))return say('Đã hủy, dữ liệu giữ nguyên.');
 const old=new Map(ex.map(s=>[s.id,s])),nid=new Set(ok.map(s=>s.id));let nw=0,up=0;ok.forEach(s=>{const o=old.get(s.id);o?(JSON.stringify(o)!==JSON.stringify(s)&&up++):nw++});const rm=ex.filter(s=>!nid.has(s.id)).length;
 await kv('extra',ok);await kv('meta',{at:Date.now(),count:ok.length});await load();await renderSync();
 $('#srep').innerHTML=`✅ Kho hiện có <b>${ok.length}</b> câu (mới ${nw}, sửa ${up}, bỏ ${rm}).${bad.length?`<br>⚠ ${bad.length} dòng lỗi bị bỏ qua:<ul>`+bad.slice(0,30).map(b=>'<li>'+esc(b)+'</li>').join('')+'</ul>':''}<div class="row"><button class="p" onclick="home()">Về trang chủ</button></div>`};
$('#cfg').onclick=()=>data();$('#home').onclick=home;$('#hide').onchange=e=>{hide=e.target.checked;if(cur&&$('.card[data-id]')&&!$('#list')&&app.querySelector('.bar')&&U.sess[cur])study();else if($('#list'))lst()};
load().then(home).catch(e=>app.innerHTML='<p>Lỗi tải dữ liệu: '+esc(e.message)+'</p>');
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
