import { db, todayStr } from '../db.js';
import { openModal, closeModal, toast, escape, buildForm, formToObject, confirm, progressBar } from '../ui.js';

export async function render(root){
  let selectedDate = todayStr();

  const fields = [
    { name:'plan_date', label:'日期', type:'date', default:selectedDate },
    { name:'title', label:'标题' },
    { name:'detail', label:'详细备注', type:'textarea' },
    { name:'is_done', label:'已完成', type:'checkbox' },
    { name:'review', label:'完成复盘', type:'textarea' },
  ];

  async function refresh(){
    const all = await db.plans.list();
    const list = all.filter(p => p.plan_date === selectedDate);
    const monthList = all.filter(p => (p.plan_date||'').slice(0,7) === selectedDate.slice(0,7));
    const doneM = monthList.filter(p => p.is_done).length;
    const pctM = monthList.length ? Math.round(doneM/monthList.length*100) : 0;

    root.innerHTML = `
      <div class="page-header"><div class="page-title">每日计划 <small>${selectedDate}</small></div>
        <button class="btn sm" id="add">+ 新增</button>
      </div>

      <div class="card">
        <div class="field"><label>选择日期</label><input class="input" type="date" id="selDate" value="${selectedDate}"/></div>
        <div style="font-size:12px;color:var(--text-soft)">当月完成率</div>
        ${progressBar(pctM)}
        <small style="color:var(--text-soft)">${doneM}/${monthList.length} (${pctM}%)</small>
      </div>

      <div class="card">
        <div class="card-title">当日计划 (${list.length})</div>
        ${list.length===0 ? '<div class="empty"><div class="icon">📝</div>该日期没有计划</div>' : list.map(p => `
          <div class="list-item">
            <input type="checkbox" data-id="${p.id}" ${p.is_done?'checked':''}/>
            <div class="body">
              <div class="t" style="${p.is_done?'text-decoration:line-through;color:var(--text-soft)':''}">${escape(p.title)}</div>
              <div class="m">${escape(p.detail||'')}${p.review?' · 复盘: '+escape(p.review):''}</div>
            </div>
            <button class="btn ghost sm" data-edit="${p.id}">编辑</button>
            <button class="btn danger sm" data-del="${p.id}">删除</button>
          </div>`).join('')}
      </div>
    `;

    root.querySelector('#selDate').addEventListener('change', e => { selectedDate = e.target.value; refresh(); });
    root.querySelector('#add').addEventListener('click', () => openEditModal(null, selectedDate, refresh));
    root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openEditModal(b.dataset.edit, null, refresh)));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if(await confirm({ title:'删除计划', message:'确定要删除这条计划吗？', danger:true })){
        await db.plans.remove(b.dataset.del); toast('已删除'); refresh();
      }
    }));
    root.querySelectorAll('input[type=checkbox][data-id]').forEach(cb => cb.addEventListener('change', async () => {
      await db.plans.update(cb.dataset.id, { is_done: cb.checked });
      refresh();
    }));
  }

  async function openEditModal(id, date, cb){
    let model = {};
    if(id){ model = await db.plans.get(id); }
    else { model.plan_date = date; }
    const form = buildForm(fields, model);
    const ok = document.createElement('button'); ok.className='btn'; ok.textContent='保存';
    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='取消';
    const m = openModal({ title: id?'编辑计划':'新增计划', body:form, footer:[cancel, ok] });
    ok.addEventListener('click', async () => {
      const data = formToObject(form);
      try{
        if(id) await db.plans.update(id, data); else await db.plans.insert(data);
        toast('保存成功');
        m._close(); cb();
      }catch(e){ toast('保存失败：'+e.message, true); }
    });
    cancel.addEventListener('click', m._close);
  }

  refresh();
}
