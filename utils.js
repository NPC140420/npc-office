/* NPC办事处 - 通用工具库 */
(function(){

  const $  = (sel, root) => (root||document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root||document).querySelectorAll(sel));

  function el(tag, attrs, ...children){
    const e = document.createElement(tag);
    if (attrs){
      for (const k in attrs){
        if (k === 'class') e.className = attrs[k];
        else if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
        else if (k.startsWith('on') && typeof attrs[k] === 'function')
          e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k]);
      }
    }
    children.flat().forEach(c => {
      if (c == null || c === false) return;
      e.append(c instanceof Node ? c : document.createTextNode(String(c)));
    });
    return e;
  }

  function uid(){ return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2); }

  function fmtDate(d, kind){
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt)) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const day = String(dt.getDate()).padStart(2,'0');
    if (kind === 'ymd') return `${y}-${m}-${day}`;
    if (kind === 'md') return `${parseInt(m)}月${parseInt(day)}日`;
    if (kind === 'cn') return `${y}年${parseInt(m)}月${parseInt(day)}日`;
    if (kind === 'short') return `${m}/${day}`;
    return `${y}-${m}-${day}`;
  }

  function today(){ return fmtDate(new Date(), 'ymd'); }
  function monthKey(d){
    const dt = d instanceof Date ? d : new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
  }
  function firstOfMonth(){ const d=new Date(); return new Date(d.getFullYear(),d.getMonth(),1); }
  function lastOfMonth(){ const d=new Date(); return new Date(d.getFullYear(),d.getMonth()+1,0); }

  function greet(){
    const h = new Date().getHours();
    if (h < 11) return '早上好';
    if (h < 18) return '下午好';
    return '晚上好';
  }

  function toast(msg){
    let t = $('#toast');
    if (!t){
      t = el('div', { id:'toast', class:'toast' });
      document.body.append(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(()=>t.classList.remove('show'), 1800);
  }

  function modal({ title, body, onConfirm, confirmText='保存', cancelText='取消', danger=false, confirmDanger=false }){
    closeModal();
    const m = el('div', { class:'modal-mask show', id:'modal-mask' });
    const box = el('div', { class:'modal' });
    box.innerHTML = `<h3>${title||''}</h3>`;
    if (typeof body === 'string') box.innerHTML += body;
    else if (body instanceof Node) box.querySelector('h3').after(body);

    const actions = el('div', { class:'form-actions' });
    const cancel = el('button', { class:'btn-ghost', onclick: closeModal }, cancelText);
    const ok = el('button', { class: confirmDanger ? 'btn-danger' : 'btn-primary', onclick: async () => {
      try { await onConfirm && onConfirm(box); }
      catch(e){ console.error(e); }
    } }, confirmText);
    actions.append(cancel, ok);
    box.append(actions);
    m.append(box);
    document.body.append(m);
    m.addEventListener('click', e => { if (e.target === m) closeModal(); });
  }

  function closeModal(){
    const m = $('#modal-mask');
    if (m) m.remove();
  }

  function confirmDialog(title, message, onOk, opts={}){
    modal({
      title, danger: true, confirmDanger: true,
      body: `<p style="color:var(--ink); line-height:1.6">${message}</p>`,
      onConfirm: async () => { await onOk(); closeModal(); },
      confirmText: opts.okText || '确定删除',
      cancelText: '取消'
    });
  }

  function download(filename, data){
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: filename });
    document.body.append(a); a.click();
    setTimeout(()=>{ a.remove(); URL.revokeObjectURL(url); }, 500);
  }

  // localStorage 工具(只存偏好,不存业务数据)
  const Pref = {
    get(k, def){
      try { return JSON.parse(localStorage.getItem('npc.'+k)) ?? def; }
      catch { return def; }
    },
    set(k, v){ localStorage.setItem('npc.'+k, JSON.stringify(v)); },
    del(k){ localStorage.removeItem('npc.'+k); }
  };

  window.NPC = { $, $$, el, uid, fmtDate, today, monthKey, firstOfMonth, lastOfMonth, greet, toast, modal, closeModal, confirmDialog, download, Pref };
})();
