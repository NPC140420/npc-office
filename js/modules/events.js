import { db } from '../db.js';
import { openModal, toast, escape, buildForm, formToObject, confirm, pad2 } from '../ui.js';

const DAYS = ['日','一','二','三','四','五','六'];

const FIELDS = [
  { name:'title', label:'标题' },
  { name:'start_date', label:'开始日期', type:'date' },
  { name:'is_all_day', label:'全天事件', type:'checkbox', default:true },
  { name:'start_time', label:'开始时间', type:'time' },
  { name:'end_time', label:'结束时间', type:'time' },
  { name:'location', label:'地点' },
  { name:'note', label:'备注', type:'textarea' },
];

export async function render(root){
  let cursor = new Date();
  cursor.setDate(1);

  async function refresh(){
    const all = await db.events.list();
    // 当月
    const ym = `${cursor.getFullYear()}-${pad2(cursor.getMonth()+1)}`;
    const monthEvents = all.filter(e => (e.start_date||'').slice(0,7) === ym);

    // 当月日历
    const firstWeekday = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth()+1, 0).getDate();
    const cells = [];
    for(let i=0;i<firstWeekday;i++) cells.push('');
    for(let d=1; d<=daysInMonth; d++) cells.push(d);
    while(cells.length%7) cells.push('');

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad2(today.getMonth()+1)}-${pad2(today.getDate())}`;

    const eventsByDay = {};
    monthEvents.forEach(e => {
      (eventsByDay[e.start_date] = eventsByDay[e.start_date] || []).push(e);
    });

    root.innerHTML = `
      <div class="page-header">
        <div class="page-title">日程 <small>${cursor.getFullYear()}年${cursor.getMonth()+1}月</small></div>
        <button class="btn sm" id="add">+ 新增</button>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <button class="btn ghost sm" id="prev">‹</button>
          <div>${ym}</div>
          <button class="btn ghost sm" id="next">›</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;font-size:12px">
          ${DAYS.map(d=>`<div style="text-align:center;color:var(--text-soft)">${d}</div>`).join('')}
          ${cells.map(d => {
            if(!d) return '<div></div>';
            const ds = `${ym}-${pad2(d)}`;
            const list = eventsByDay[ds] || [];
            const isToday = ds === todayStr;
            return `<button data-day="${ds}" style="position:relative;border-radius:10px;padding:8px 4px;background:${isToday?'var(--tip)':'#fff'};border:1px solid ${isToday?'var(--primary)':'var(--border)'};cursor:pointer">
              <div style="font-weight:${isToday?'700':'500'}">${d}</div>
              ${list.length?`<div style="font-size:10px;color:var(--primary);margin-top:2px">📌${list.length}</div>`:''}
            </button>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">${escape(ym)} · 全部日程 (${monthEvents.length})</div>
        ${monthEvents.length === 0 ? '<div class="empty"><div class="icon">📅</div>本月暂无日程</div>' :
          monthEvents.sort((a,b)=>(a.start_date+a.start_time).localeCompare(b.start_date+b.start_time)).map(e => `
          <div class="list-item">
            <div style="font-size:14px">${e.is_all_day?'📌':'⏰'}</div>
            <div class="body">
              <div class="t">${escape(e.title)}</div>
              <div class="m">${e.start_date}${e.is_all_day?'':(' '+(e.start_time||'')+(e.end_time?'~'+e.end_time:''))} · ${escape(e.location||'')}</div>
            </div>
            <button class="btn ghost sm" data-edit="${e.id}">编辑</button>
            <button class="btn danger sm" data-del="${e.id}">删除</button>
          </div>`).join('')}
      </div>
    `;

    root.querySelector('#prev').addEventListener('click', () => { cursor.setMonth(cursor.getMonth()-1); refresh(); });
    root.querySelector('#next').addEventListener('click', () => { cursor.setMonth(cursor.getMonth()+1); refresh(); });
    root.querySelector('#add').addEventListener('click', () => editEvent(null, refresh));
    root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editEvent(b.dataset.edit, refresh)));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if(await confirm({ title:'删除日程', message:'确定删除这条日程？', danger:true })){
        await db.events.remove(b.dataset.del); toast('已删除'); refresh();
      }
    }));
    root.querySelectorAll('[data-day]').forEach(b => b.addEventListener('click', () => editEvent(null, refresh, b.dataset.day)));
  }

  async function editEvent(id, cb, defaultDate){
    let model = id ? await db.events.get(id) : { is_all_day:true };
    if(!id && defaultDate){ model.start_date = defaultDate; }
    const form = buildForm(FIELDS, model);
    const ok = document.createElement('button'); ok.className='btn'; ok.textContent='保存';
    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='取消';
    const m = openModal({ title: id?'编辑日程':'新增日程', body:form, footer:[cancel, ok] });
    ok.addEventListener('click', async () => {
      const data = formToObject(form);
      try{
        if(id) await db.events.update(id, data); else await db.events.insert(data);
        toast('保存成功'); m._close(); cb();
      }catch(e){ toast('保存失败', true); }
    });
    cancel.addEventListener('click', m._close);
  }

  refresh();
}
