import { db, todayStr } from '../db.js';
import { openModal, toast, escape, buildForm, formToObject, confirm, pad2 } from '../ui.js';

const FIELDS = [
  { name:'check_date', label:'打卡日期', type:'date', default: todayStr() },
  { name:'weight', label:'晨起体重 (kg)', type:'number', step:'0.1' },
  { name:'height', label:'身高 (cm)', type:'number', step:'0.1' },
  { name:'waist', label:'腰围 (cm)', type:'number', step:'0.1' },
  { name:'belly', label:'腹围 (cm)', type:'number', step:'0.1' },
  { name:'water_ml', label:'饮水量 (ml)', type:'number' },
  { name:'sleep_hours', label:'睡眠时长 (h)', type:'number', step:'0.1' },
  { name:'steps', label:'步数', type:'number' },
  { name:'food_note', label:'饮食备注', type:'textarea' },
  { name:'body_feeling', label:'身体感受', type:'textarea' },
];

export async function render(root){
  let cursorMonth = todayStr().slice(0,7);

  async function refresh(){
    const all = await db.body.list();
    const list = all.sort((a,b)=>(b.check_date||'').localeCompare(a.check_date||''));
    const today = todayStr();
    const todayRecord = list.find(b => b.check_date === today);
    const profileArr = await db.profiles.list().catch(()=>[]);
    const prof = profileArr[0] || {};
    const targetWeight = prof?.target_weight;

    // 近 30 天体重曲线
    const sortedByDate = [...list].sort((a,b)=> (a.check_date||'').localeCompare(b.check_date||''));
    const recent = sortedByDate.filter(b => (b.check_date||'') >= (()=>{const d=new Date();d.setDate(d.getDate()-30);return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;})());
    const wPoints = recent.filter(b => b.weight!=null).map(b => ({d:b.check_date, w:Number(b.weight)}));
    let chartSVG = '';
    if(wPoints.length>1){
      const W=600, H=140, P=20;
      const min = Math.min(...wPoints.map(p=>p.w))-1, max = Math.max(...wPoints.map(p=>p.w))+1;
      const xs = wPoints.map((p,i)=> P + (W-2*P) * (i/(wPoints.length-1)));
      const ys = wPoints.map(p => H-P - (p.w - min)/(max-min||1) * (H-2*P));
      const path = wPoints.map((p,i) => `${i?'L':'M'}${xs[i]},${ys[i]}`).join(' ');
      const area = path + ` L${xs[xs.length-1]},${H-P} L${xs[0]},${H-P} Z`;
      chartSVG = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:120px;background:#fff;border-radius:8px">
        <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E8C52" stop-opacity=".3"/><stop offset="1" stop-color="#6E8C52" stop-opacity="0"/></linearGradient></defs>
        <text x="${P}" y="${P-4}" font-size="11" fill="#7F8F65">${min.toFixed(1)}kg</text>
        <text x="${P}" y="${H-4}" font-size="11" fill="#7F8F65">${max.toFixed(1)}kg</text>
        <path d="${area}" fill="url(#g)"/>
        <path d="${path}" stroke="#6E8C52" stroke-width="2" fill="none"/>
        ${wPoints.map((p,i)=>`<circle cx="${xs[i]}" cy="${ys[i]}" r="3" fill="#D4A25A"/>`).join('')}
      </svg>`;
    } else {
      chartSVG = '<div class="empty" style="padding:14px">体重记录不足 2 条，无法绘制曲线</div>';
    }

    const monthList = list.filter(b => (b.check_date||'').slice(0,7) === cursorMonth);

    root.innerHTML = `
      <div class="page-header"><div class="page-title">身体健康 <small>今日打卡</small></div>
        <button class="btn sm" id="add">${todayRecord?'修改今日':'+ 打卡'}</button></div>

      ${todayRecord ? `
      <div class="card tip">
        <div style="font-size:14px;font-weight:600">今日已打卡 ✓</div>
        <div style="font-size:12px;color:var(--text-soft);margin-top:4px">
          体重 ${todayRecord.weight||'-'} kg · 饮水 ${todayRecord.water_ml||0} ml · 睡眠 ${todayRecord.sleep_hours||'-'} h · 步数 ${todayRecord.steps||0}
          ${targetWeight? ` · 距离目标 ${targetWeight} kg 差 ${(Number(todayRecord.weight)-Number(targetWeight)).toFixed(1)} kg`:''}
        </div>
      </div>` : `
      <div class="card"><div class="empty"><div class="icon">🩺</div>今日还未打卡，点击右上角记录健康数据</div></div>
      `}

      <div class="card">
        <div class="card-title">近 30 天体重曲线</div>
        ${chartSVG}
      </div>

      <div class="card">
        <div class="card-title">${cursorMonth} 打卡记录 (${monthList.length})</div>
        <div class="field" style="margin-bottom:8px"><input class="input" type="month" id="mSel" value="${cursorMonth}"/></div>
        ${monthList.length===0?'<div class="empty">本月暂无打卡</div>':
          monthList.map(b => `
          <div class="list-item">
            <div style="font-size:22px">📋</div>
            <div class="body">
              <div class="t">${b.check_date} · ${b.weight?b.weight+'kg':''}</div>
              <div class="m">饮水 ${b.water_ml||0}ml · 睡眠 ${b.sleep_hours||'-'}h · 步数 ${b.steps||0} ${b.body_feeling?' · '+escape(b.body_feeling):''}</div>
            </div>
            <button class="btn ghost sm" data-edit="${b.id}">编辑</button>
            <button class="btn danger sm" data-del="${b.id}">删除</button>
          </div>`).join('')}
      </div>
    `;

    root.querySelector('#add').addEventListener('click', () => edit(todayRecord?.id, refresh, today));
    root.querySelector('#mSel').addEventListener('change', e => { cursorMonth = e.target.value; refresh(); });
    root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => edit(b.dataset.edit, refresh)));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if(await confirm({ title:'删除打卡', message:'确定删除该条打卡记录？', danger:true })){
        await db.body.remove(b.dataset.del); toast('已删除'); refresh();
      }
    }));
  }

  async function edit(id, cb, defaultDate){
    let model = id ? await db.body.get(id) : { check_date: defaultDate || todayStr() };
    const form = buildForm(FIELDS, model);
    const ok = document.createElement('button'); ok.className='btn'; ok.textContent='保存';
    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='取消';
    const m = openModal({ title: id?'编辑打卡':'今日打卡', body:form, footer:[cancel, ok] });
    ok.addEventListener('click', async () => {
      const data = formToObject(form);
      try{
        if(id) await db.body.update(id, data); else {
          // 避免同日重复
          const ex = (await db.body.list()).find(b => b.check_date === data.check_date);
          if(ex){ await db.body.update(ex.id, data); }
          else { await db.body.insert(data); }
        }
        toast('保存成功'); m._close(); cb();
      }catch(e){ toast('保存失败：'+e.message, true); }
    });
    cancel.addEventListener('click', m._close);
  }

  refresh();
}
