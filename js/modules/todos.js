import { db, todayStr } from '../db.js';
import { openModal, toast, escape, buildForm, formToObject, confirm } from '../ui.js';

const FIELDS = [
  { name:'title', label:'标题' },
  { name:'detail', label:'备注', type:'textarea' },
  { name:'priority', label:'优先级', type:'select', options:[{value:'high',label:'高'},{value:'medium',label:'中'},{value:'low',label:'低'}], default:'medium' },
  { name:'due_date', label:'截止日期', type:'date' },
  { name:'is_done', label:'已完成', type:'checkbox' },
];

function priorityBadge(p){
  return p==='high'?'<span style="color:var(--danger)">●高</span>' : p==='low'?'<span style="color:var(--text-soft)">●低</span>' : '<span style="color:var(--warning)">●中</span>';
}

export async function render(root){
  let filter = 'all'; // all / open / done
  const all = await db.todos.list();

  function refresh(){
    let list = all;
    if(filter==='open') list = list.filter(t => !t.is_done);
    if(filter==='done') list = list.filter(t => t.is_done);

    list.sort((a,b) => {
      // 逾期的置顶
      const overA = !a.is_done && a.due_date && a.due_date < todayStr();
      const overB = !b.is_done && b.due_date && b.due_date < todayStr();
      if(overA!==overB) return overA?-1:1;
      if((a.due_date||'') !== (b.due_date||'')) return (a.due_date||'9999').localeCompare(b.due_date||'');
      return (b.created_at||'').localeCompare(a.created_at||'');
    });

    const today = todayStr();
    root.innerHTML = `
      <div class="page-header">
        <div class="page-title">待办清单 <small>${all.filter(t=>!t.is_done).length} 待办</small></div>
        <button class="btn sm" id="add">+ 新增</button>
      </div>

      <div class="card" style="padding:6px">
        <div style="display:flex;gap:4px">
          ${[['all','全部'],['open','待完成'],['done','已完成']].map(([k,l])=>`<button class="btn sm ${filter===k?'':'ghost'}" data-f="${k}">${l}</button>`).join('')}
        </div>
      </div>

      <div class="card">
        ${list.length===0 ? '<div class="empty"><div class="icon">✅</div>暂无待办，太棒了</div>' : list.map(t => {
          const overdue = !t.is_done && t.due_date && t.due_date < today;
          return `<div class="list-item" style="${overdue?'background:var(--danger-bg);border-radius:8px;padding:8px;margin:2px 0;border:none':''}">
            <input type="checkbox" data-id="${t.id}" ${t.is_done?'checked':''}/>
            <div class="body">
              <div class="t" style="${t.is_done?'text-decoration:line-through;color:var(--text-soft)':''}">${escape(t.title)} ${priorityBadge(t.priority)}</div>
              <div class="m">${escape(t.detail||'')} ${t.due_date?' · 截止 '+t.due_date+(overdue?' (逾期)':''):''}</div>
            </div>
            <button class="btn ghost sm" data-edit="${t.id}">编辑</button>
            <button class="btn danger sm" data-del="${t.id}">删除</button>
          </div>`;
        }).join('')}
      </div>
    `;

    root.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => { filter = b.dataset.f; refresh(); }));
    root.querySelector('#add').addEventListener('click', () => editTodo(null, refresh));
    root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editTodo(b.dataset.edit, refresh)));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if(await confirm({ title:'删除待办', message:'确定删除这条待办？', danger:true })){
        await db.todos.remove(b.dataset.del); toast('已删除');
        const i = all.findIndex(t => t.id === b.dataset.del); if(i>-1) all.splice(i,1);
        refresh();
      }
    }));
    root.querySelectorAll('input[type=checkbox][data-id]').forEach(cb => cb.addEventListener('change', async () => {
      await db.todos.update(cb.dataset.id, { is_done: cb.checked });
      const item = all.find(t => t.id === cb.dataset.id); if(item) item.is_done = cb.checked;
      refresh();
    }));
  }

  async function editTodo(id, cb){
    let model = id ? await db.todos.get(id) : { priority:'medium' };
    const form = buildForm(FIELDS, model);
    const ok = document.createElement('button'); ok.className='btn'; ok.textContent='保存';
    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='取消';
    const m = openModal({ title: id?'编辑待办':'新增待办', body:form, footer:[cancel, ok] });
    ok.addEventListener('click', async () => {
      const data = formToObject(form);
      try{
        if(id) await db.todos.update(id, data); else await db.todos.insert(data);
        toast('保存成功'); m._close();
        const fresh = await db.todos.list();
        all.length = 0; all.push(...fresh);
        cb();
      }catch(e){ toast('保存失败', true); }
    });
    cancel.addEventListener('click', m._close);
  }

  refresh();
}
