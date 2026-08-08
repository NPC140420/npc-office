import { db, todayStr } from '../db.js';
import { openModal, toast, escape, buildForm, formToObject, confirm, pad2 } from '../ui.js';

const MOOD_OPTIONS = [
  { value:'happy', label:'😊 开心' },
  { value:'calm',  label:'🍃 平静' },
  { value:'sad',   label:'🌧️ 难过' },
  { value:'angry', label:'🔥 烦躁' },
  { value:'tired', label:'😴 疲倦' },
  { value:'love',  label:'💗 幸福' },
];

const FIELDS = [
  { name:'note_date', label:'日记日期', type:'date', default: todayStr() },
  { name:'title', label:'标题' },
  { name:'mood', label:'心情', type:'select', options: MOOD_OPTIONS, default:'calm' },
  { name:'content', label:'正文', type:'textarea' },
];

const MOOD_EMOJI = { happy:'😊', calm:'🍃', sad:'🌧️', angry:'🔥', tired:'😴', love:'💗' };

export async function render(root){
  let cursorMonth = todayStr().slice(0,7);

  async function refresh(){
    const all = await db.notes.list();
    all.sort((a,b) => (b.note_date||'').localeCompare(a.note_date||''));
    const monthList = all.filter(n => (n.note_date||'').slice(0,7) === cursorMonth);
    const months = [...new Set(all.map(n => (n.note_date||'').slice(0,7)))].filter(Boolean).sort().reverse();

    root.innerHTML = `
      <div class="page-header">
        <div class="page-title">随笔日记 <small>${all.length} 篇</small></div>
        <button class="btn sm" id="add">+ 新增</button>
      </div>

      <div class="card">
        <div class="field" style="margin-bottom:0"><label>月份</label>
          <select class="select" id="mSel">${months.length?months.map(m=>`<option ${m===cursorMonth?'selected':''} value="${m}">${m}</option>`).join(''):`<option value="${cursorMonth}">${cursorMonth}</option>`}</select>
        </div>
      </div>

      ${monthList.length===0 ? '<div class="card empty"><div class="icon">📔</div>本月暂无日记</div>' :
        monthList.map(n => `
        <div class="card" data-id="${n.id}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:15px;font-weight:600">${escape(n.title||'无标题')}</div>
              <div style="font-size:12px;color:var(--text-soft)">${n.note_date} · ${MOOD_EMOJI[n.mood]||'🍃'} ${escape(n.mood||'')}</div>
            </div>
            <div style="display:flex;gap:6px">
              <button class="btn ghost sm" data-edit="${n.id}">编辑</button>
              <button class="btn danger sm" data-del="${n.id}">删除</button>
            </div>
          </div>
          <div style="margin-top:8px;color:var(--text);white-space:pre-wrap;font-size:14px;line-height:1.6">${escape(n.content||'')}</div>
        </div>`).join('')}
    `;

    root.querySelector('#add').addEventListener('click', () => edit(null, refresh));
    root.querySelector('#mSel').addEventListener('change', e => { cursorMonth = e.target.value; refresh(); });
    root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => edit(b.dataset.edit, refresh)));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if(await confirm({ title:'删除日记', message:'确定删除该条日记？', danger:true })){
        await db.notes.remove(b.dataset.del); toast('已删除'); refresh();
      }
    }));
  }

  async function edit(id, cb){
    let model = id ? await db.notes.get(id) : { note_date: todayStr(), mood:'calm' };
    const form = buildForm(FIELDS, model);
    const ok = document.createElement('button'); ok.className='btn'; ok.textContent='保存';
    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='取消';
    const m = openModal({ title: id?'编辑日记':'新增日记', body:form, footer:[cancel, ok] });
    ok.addEventListener('click', async () => {
      const data = formToObject(form);
      try{ if(id) await db.notes.update(id, data); else await db.notes.insert(data);
        toast('保存成功'); m._close(); cb(); }catch(e){ toast('保存失败', true); }
    });
    cancel.addEventListener('click', m._close);
  }

  refresh();
}
