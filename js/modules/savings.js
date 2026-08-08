import { db } from '../db.js';
import { openModal, toast, escape, buildForm, formToObject, confirm, yuan, progressBar } from '../ui.js';

const FIELDS = [
  { name:'name', label:'目标名称' },
  { name:'target_amount', label:'目标总额', type:'number' },
  { name:'saved_amount', label:'已存金额', type:'number', default:0 },
  { name:'deadline', label:'截止日期', type:'date' },
  { name:'note', label:'备注', type:'textarea' },
];

export async function render(root){
  async function refresh(){
    const list = await db.savings.list();
    list.sort((a,b) => (b.created_at||'').localeCompare(a.created_at||''));
    const totalSaved = list.reduce((a,s)=>a+Number(s.saved_amount||0),0);
    const totalTarget = list.reduce((a,s)=>a+Number(s.target_amount||0),0);
    const pctTotal = totalTarget ? Math.round(totalSaved/totalTarget*100) : 0;

    root.innerHTML = `
      <div class="page-header"><div class="page-title">储蓄目标 <small>${list.length} 项</small></div>
        <button class="btn sm" id="add">+ 新增</button></div>

      <div class="card tip">
        <div style="display:flex;justify-content:space-between"><div>
          <div style="font-size:11px;color:var(--text-soft)">总进度</div>
          <div style="font-size:20px;font-weight:700">${yuan(totalSaved)} / ${yuan(totalTarget)}</div>
        </div>
        <div style="font-size:24px;font-weight:700;color:var(--primary)">${pctTotal}%</div></div>
        ${progressBar(pctTotal)}
      </div>

      ${list.length === 0 ? '<div class="card empty"><div class="icon">🏦</div>暂无储蓄目标，添加一个吧</div>' : list.map(s => {
        const pct = s.target_amount ? Math.round(Number(s.saved_amount)/Number(s.target_amount)*100) : 0;
        return `<div class="card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="flex:1">
              <div style="font-size:16px;font-weight:600">${escape(s.name)}</div>
              <div style="font-size:12px;color:var(--text-soft);margin-top:2px">${s.deadline?('截止 '+s.deadline):'不限截止'} ${s.note?'· '+escape(s.note):''}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:16px;font-weight:700;color:var(--primary)">${pct}%</div>
              <div style="font-size:12px;color:var(--text-soft)">${yuan(s.saved_amount)} / ${yuan(s.target_amount)}</div>
            </div>
          </div>
          <div style="margin-top:10px">${progressBar(pct,'var(--accent)')}</div>
          <div style="display:flex;gap:6px;margin-top:10px;justify-content:flex-end">
            <button class="btn ghost sm" data-deposit="${s.id}">+ 存入</button>
            <button class="btn ghost sm" data-edit="${s.id}">编辑</button>
            <button class="btn danger sm" data-del="${s.id}">删除</button>
          </div>
        </div>`;
      }).join('')}
    `;

    root.querySelector('#add').addEventListener('click', () => edit(null, refresh));
    root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => edit(b.dataset.edit, refresh)));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if(await confirm({ title:'删除目标', message:'确定删除该储蓄目标？', danger:true })){
        await db.savings.remove(b.dataset.del); toast('已删除'); refresh();
      }
    }));
    root.querySelectorAll('[data-deposit]').forEach(b => b.addEventListener('click', async () => {
      const s = await db.savings.get(b.dataset.deposit);
      const v = prompt(`存入金额（当前已存：${yuan(s.saved_amount)}）`, '100');
      if(v===null) return;
      const n = Number(v);
      if(isNaN(n) || n<=0){ toast('请输入正数', true); return; }
      await db.savings.update(b.dataset.deposit, { saved_amount: Number(s.saved_amount||0)+n });
      toast('已存入'); refresh();
    }));
  }

  async function edit(id, cb){
    let model = id ? await db.savings.get(id) : { saved_amount:0 };
    const form = buildForm(FIELDS, model);
    const ok = document.createElement('button'); ok.className='btn'; ok.textContent='保存';
    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='取消';
    const m = openModal({ title: id?'编辑目标':'新增储蓄目标', body:form, footer:[cancel, ok] });
    ok.addEventListener('click', async () => {
      const data = formToObject(form);
      try{ if(id) await db.savings.update(id, data); else await db.savings.insert(data);
        toast('保存成功'); m._close(); cb(); }catch(e){ toast('保存失败', true); }
    });
    cancel.addEventListener('click', m._close);
  }

  refresh();
}
