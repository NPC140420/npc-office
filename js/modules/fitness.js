import { db, todayStr, ymFromDate } from '../db.js';
import { openModal, toast, escape, buildForm, formToObject, confirm } from '../ui.js';

const FIELDS = [
  { name:'train_date', label:'训练日期', type:'date', default: todayStr() },
  { name:'name', label:'项目名称' },
  { name:'sets', label:'组数', type:'number' },
  { name:'reps', label:'每组次数', type:'number' },
  { name:'weight', label:'负重 (kg)', type:'number', step:'0.5' },
  { name:'duration_min', label:'训练时长 (分钟)', type:'number' },
  { name:'is_done', label:'已完成', type:'checkbox' },
  { name:'feeling', label:'训练感受', type:'textarea' },
];

export async function render(root){
  async function refresh(){
    const [list, favs] = await Promise.all([db.fitness.list(), db.fitness_favorites.list()]);
    list.sort((a,b)=>(b.train_date+b.created_at).localeCompare(a.train_date+a.created_at));
    const today = todayStr();
    const ym = today.slice(0,7);
    const monthCount = list.filter(f => ymFromDate(f.train_date) === ym).length;
    const todayList = list.filter(f => f.train_date === today);

    root.innerHTML = `
      <div class="page-header">
        <div class="page-title">健身训练 <small>本月 ${monthCount} 次</small></div>
        <button class="btn sm" id="add">+ 新增</button>
      </div>

      <div class="card tip">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:11px;color:var(--text-soft)">本月运动次数</div>
            <div style="font-size:26px;font-weight:700;color:var(--primary)">${monthCount}</div>
            <div style="font-size:12px;color:var(--text-soft)">今日训练 ${todayList.length} 条</div>
          </div>
          <div style="font-size:50px">💪</div>
        </div>
      </div>

      ${favs.length?`
      <div class="card">
        <div class="card-title">常用项目快速填入</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${favs.map(f => `<button class="btn ghost sm" data-fav="${f.id}">⚡ ${escape(f.name)} (${f.default_sets||'-'}×${f.default_reps||'-'})</button>`).join('')}
        </div>
      </div>`:''}

      <div class="card">
        <div class="card-title">全部训练记录</div>
        ${list.length===0?'<div class="empty"><div class="icon">🏋️</div>暂无训练记录</div>':
          list.map(f => `
          <div class="list-item">
            <div style="font-size:22px">${f.is_done?'✅':'⏳'}</div>
            <div class="body">
              <div class="t">${escape(f.name)} <small style="color:var(--text-soft);font-weight:400">${f.train_date}</small></div>
              <div class="m">${f.sets||0}组 × ${f.reps||0}次${f.weight?' · '+f.weight+'kg':''}${f.duration_min?' · '+f.duration_min+'分钟':''} ${f.feeling?' · '+escape(f.feeling):''}</div>
            </div>
            <button class="btn ghost sm" data-edit="${f.id}">编辑</button>
            <button class="btn danger sm" data-del="${f.id}">删除</button>
          </div>`).join('')}
      </div>
    `;

    root.querySelector('#add').addEventListener('click', () => edit(null, refresh));
    root.querySelectorAll('[data-fav]').forEach(b => b.addEventListener('click', async () => {
      const f = favs.find(x => x.id === b.dataset.fav);
      await db.fitness.insert({
        train_date: todayStr(), name:f.name, sets:f.default_sets, reps:f.default_reps, weight:f.default_weight, is_done:false, feeling:''
      });
      toast('已添加训练记录'); refresh();
    }));
    root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => edit(b.dataset.edit, refresh)));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if(await confirm({ title:'删除训练', message:'确定删除该条训练记录？', danger:true })){
        await db.fitness.remove(b.dataset.del); toast('已删除'); refresh();
      }
    }));
  }

  async function edit(id, cb){
    let model = id ? await db.fitness.get(id) : { train_date: todayStr(), is_done:false };
    const form = buildForm(FIELDS, model);
    const ok = document.createElement('button'); ok.className='btn'; ok.textContent='保存';
    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='取消';
    const saveFav = document.createElement('button'); saveFav.className='btn ghost'; saveFav.textContent='⭐ 收藏此项目';
    const m = openModal({ title: id?'编辑训练':'新增训练', body:form, footer:[cancel, ok, saveFav] });
    ok.addEventListener('click', async () => {
      const data = formToObject(form);
      try{ if(id) await db.fitness.update(id, data); else await db.fitness.insert(data);
        toast('保存成功'); m._close(); cb(); }catch(e){ toast('保存失败', true); }
    });
    cancel.addEventListener('click', m._close);
    saveFav.addEventListener('click', async () => {
      const data = formToObject(form);
      if(!data.name){ toast('请先输入项目名称', true); return; }
      await db.fitness_favorites.insert({
        name: data.name, default_sets: data.sets, default_reps: data.reps, default_weight: data.weight
      });
      toast('已收藏到常用项目');
    });
  }

  refresh();
}
