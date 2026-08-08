/* =============================================================
   通用 UI：弹窗 / Toast / 工具函数 / 底部导航 / 渲染
   ============================================================= */

// ---------- 弹窗 ----------
export function openModal({ title, body, footer, onClose }){
  closeModal();
  const back = document.createElement('div');
  back.className = 'modal-backdrop';
  back.innerHTML = `<div class="modal"><div class="modal-head"><h3>${escape(title)}</h3><button class="modal-close" aria-label="关闭">✕</button></div><div class="modal-body"></div><div class="modal-foot" style="display:${footer?'flex':'none'}"></div></div>`;
  const bodyEl = back.querySelector('.modal-body');
  if(typeof body === 'string') bodyEl.innerHTML = body;
  else if(body instanceof Node) bodyEl.appendChild(body);
  const footEl = back.querySelector('.modal-foot');
  if(footer){
    if(Array.isArray(footer)){ footer.forEach(b => footEl.appendChild(b)); }
    else if(footer instanceof Node){ footEl.appendChild(footer); }
    else footEl.innerHTML = footer;
  }
  function close(){
    back.remove();
    document.body.style.overflow = '';
    onClose && onClose();
  }
  back.addEventListener('click', e => { if(e.target===back) close(); });
  back.querySelector('.modal-close').addEventListener('click', close);
  document.body.style.overflow = 'hidden';
  document.body.appendChild(back);
  back._close = close;
  return back;
}
export function closeModal(){ document.querySelectorAll('.modal-backdrop').forEach(e=>e.remove()); document.body.style.overflow=''; }

// 二次确认弹窗
export function confirm({ title='确认操作', message, okText='确定', cancelText='取消', danger=false }={}){
  return new Promise(res => {
    const okBtn = document.createElement('button');
    okBtn.className = `btn ${danger?'danger':''}`;
    okBtn.textContent = okText;
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn ghost';
    cancelBtn.textContent = cancelText;
    const m = openModal({
      title,
      body: `<div style="padding:6px 0;color:var(--text-soft);font-size:14px;white-space:pre-line">${escape(message||'')}</div>`,
      footer:[cancelBtn, okBtn],
      onClose: () => res(false)
    });
    okBtn.addEventListener('click', () => { m._close(); res(true); });
    cancelBtn.addEventListener('click', () => { m._close(); res(false); });
  });
}

// ---------- Toast ----------
let toastTimer;
export function toast(msg, isError=false){
  clearTimeout(toastTimer);
  let el = document.querySelector('.toast');
  if(!el){ el = document.createElement('div'); el.className='toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.style.background = isError ? 'var(--danger-bg)' : 'var(--card)';
  el.style.color = isError ? 'var(--danger)' : 'var(--text)';
  requestAnimationFrame(()=>el.classList.add('show'));
  toastTimer = setTimeout(()=>{ el.classList.remove('show'); }, 1800);
}

// ---------- 底部导航 ----------
export const NAV_ITEMS = [
  { key:'overview',     icon:'🏠', label:'总览' },
  { key:'plans',        icon:'📝', label:'计划' },
  { key:'todos',        icon:'✅', label:'待办' },
  { key:'events',       icon:'📅', label:'日程' },
  { key:'transactions', icon:'💰', label:'记账' },
  { key:'savings',      icon:'🏦', label:'储蓄' },
  { key:'body',         icon:'🩺', label:'健康' },
  { key:'fitness',      icon:'💪', label:'健身' },
  { key:'notes',        icon:'📔', label:'日记' },
  { key:'settings',     icon:'⚙️', label:'设置' },
];

export function renderNav(activeKey){
  const nav = document.getElementById('bottom-nav');
  if(!nav) return;
  nav.innerHTML = NAV_ITEMS.map(n => `
    <div class="nav-item ${n.key===activeKey?'active':''}" data-key="${n.key}">
      <div class="ico">${n.icon}</div>
      <div>${n.label}</div>
    </div>`).join('');
  nav.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.key));
  });
}

export function navigate(key){
  location.hash = '#/' + key;
}

// ---------- 工具 ----------
export function escape(s){ return String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
export function yuan(n){ const v = Number(n||0); return (v<0?'-':'') + '¥' + Math.abs(v).toFixed(2); }
export function pad2(n){ return String(n).padStart(2,'0'); }

// 时段问候
export function greeting(){
  const h = new Date().getHours();
  if(h<11) return '早上好';
  if(h<18) return '下午好';
  return '晚上好';
}

// 简易进度条
export function progressBar(percent, color){
  const p = Math.max(0, Math.min(100, Number(percent||0)));
  return `<div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden">
    <div style="width:${p}%;height:100%;background:${color||'var(--primary)'};transition:.4s"></div>
  </div>`;
}

// 表单构造：用一个对象快速生成表单
export function buildForm(fields, model={}){
  const form = document.createElement('form');
  form.innerHTML = fields.map(f => {
    const v = model[f.name] ?? f.default ?? '';
    if(f.type==='textarea'){
      return `<div class="field"><label>${escape(f.label)}</label><textarea class="textarea" name="${f.name}" placeholder="${escape(f.placeholder||'')}">${escape(v)}</textarea></div>`;
    }
    if(f.type==='select'){
      return `<div class="field"><label>${escape(f.label)}</label><select class="select" name="${f.name}">${f.options.map(o => `<option value="${o.value}" ${String(o.value)===String(v)?'selected':''}>${escape(o.label)}</option>`).join('')}</select></div>`;
    }
    if(f.type==='checkbox'){
      return `<label class="field" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" name="${f.name}" ${v?'checked':''}/><span>${escape(f.label)}</span></label>`;
    }
    return `<div class="field"><label>${escape(f.label)}</label><input class="input" type="${f.type||'text'}" name="${f.name}" value="${escape(v)}" placeholder="${escape(f.placeholder||'')}" ${f.step?'step="'+f.step+'"':''}/></div>`;
  }).join('');
  return form;
}

export function formToObject(form){
  const o = {};
  [...form.elements].forEach(el => {
    if(!el.name) return;
    if(el.type==='checkbox') o[el.name] = el.checked;
    else if(el.type==='number') o[el.name] = el.value===''?null:Number(el.value);
    else o[el.name] = el.value;
  });
  return o;
}
