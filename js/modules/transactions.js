import { db, todayStr, ymFromDate } from '../db.js';
import { openModal, toast, escape, buildForm, formToObject, confirm, yuan, pad2 } from '../ui.js';

const CATEGORIES_IN = ['工资','红包','理财','其他收入'];
const CATEGORIES_OUT = ['餐饮','购物','交通','居家','娱乐','医疗','学习','通讯','其他支出'];

const FIELDS = [
  { name:'kind', label:'类型', type:'select', options:[{value:'expense',label:'支出'},{value:'income',label:'收入'}], default:'expense' },
  { name:'amount', label:'金额', type:'number', step:'0.01' },
  { name:'category', label:'分类', type:'select', options: CATEGORIES_OUT.map(v=>({value:v,label:v})), default:'餐饮' },
  { name:'tx_date', label:'日期', type:'date', default: todayStr() },
  { name:'note', label:'备注' },
];

const CAT_COLORS = {
  '餐饮':'#E89A6B','购物':'#C76F5C','交通':'#7BA4D4','居家':'#A2B47A','娱乐':'#D4A25A',
  '医疗':'#C75A5A','学习':'#6E8C52','通讯':'#9C8ACB','其他支出':'#7F8F65',
  '工资':'#6E8C52','红包':'#D4A25A','理财':'#4E7A8C','其他收入':'#9BB57A',
};

export async function render(root){
  let filterMonth = todayStr().slice(0,7);
  let filterCat = 'all';

  async function refresh(){
    const all = await db.transactions.list();
    const monthList = all.filter(t => ymFromDate(t.tx_date) === filterMonth);
    const income = monthList.filter(t => t.kind==='income').reduce((a,b)=>a+Number(b.amount||0),0);
    const expense = monthList.filter(t => t.kind==='expense').reduce((a,b)=>a+Number(b.amount||0),0);
    const balance = income - expense;

    // 分类占比
    const expByCat = {};
    monthList.filter(t => t.kind==='expense').forEach(t => expByCat[t.category||'其他'] = (expByCat[t.category||'其他']||0)+Number(t.amount||0));
    const cats = Object.entries(expByCat).sort((a,b)=>b[1]-a[1]);
    const totalExp = expense || 1;

    const months = [...new Set(all.map(t => ymFromDate(t.tx_date)))].filter(Boolean).sort().reverse();

    root.innerHTML = `
      <div class="page-header">
        <div class="page-title">收支记账 <small>本月结余</small></div>
        <button class="btn sm" id="add">+ 新增</button>
      </div>

      <div class="card tip">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center">
          <div><div style="font-size:11px;color:var(--text-soft)">收入</div><div style="font-size:18px;font-weight:700;color:var(--primary)">${yuan(income)}</div></div>
          <div><div style="font-size:11px;color:var(--text-soft)">支出</div><div style="font-size:18px;font-weight:700;color:var(--danger)">${yuan(expense)}</div></div>
          <div><div style="font-size:11px;color:var(--text-soft)">结余</div><div style="font-size:18px;font-weight:700;color:${balance>=0?'var(--primary)':'var(--danger)'}">${yuan(balance)}</div></div>
        </div>
      </div>

      <div class="card">
        <div class="field"><label>月份筛选</label><select class="select" id="mSel">${months.length?months.map(m=>`<option value="${m}" ${m===filterMonth?'selected':''}>${m}</option>`).join(''):`<option value="${filterMonth}">${filterMonth}</option>`}</select></div>
        ${cats.length?`
          <div class="card-title" style="margin-top:6px">分类占比</div>
          ${cats.map(([c,v])=>{
            const p = Math.round(v/totalExp*100);
            return `<div style="margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;font-size:13px"><span>${escape(c)}</span><span style="color:var(--text-soft)">${yuan(v)} · ${p}%</span></div>
              <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-top:3px"><div style="width:${p}%;height:100%;background:${CAT_COLORS[c]||'var(--primary)'};transition:.4s"></div></div>
            </div>`;
          }).join('')}
        `:''}
      </div>

      <div class="card">
        <div class="card-title">明细 <small style="color:var(--text-soft);font-size:12px;font-weight:400">${monthList.length}条</small></div>
        <div class="field"><label>按分类筛选</label><select class="select" id="cSel"><option value="all">全部</option>${[...new Set(all.map(t=>t.category).filter(Boolean))].map(c=>`<option value="${c}" ${c===filterCat?'selected':''}>${escape(c)}</option>`).join('')}</select></div>
        ${monthList.length===0?'<div class="empty"><div class="icon">💰</div>本月暂无记账</div>':
          monthList.filter(t=>filterCat==='all'||t.category===filterCat).sort((a,b)=>(b.tx_date+b.id).localeCompare(a.tx_date+a.id)).map(t => `
          <div class="list-item">
            <div style="width:38px;height:38px;border-radius:50%;background:${t.kind==='income'?'var(--tip)':'var(--danger-bg)'};color:${t.kind==='income'?'var(--primary)':'var(--danger)'};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700">
              ${t.kind==='income'?'+':'−'}
            </div>
            <div class="body">
              <div class="t">${escape(t.category||'未分类')} ${escape(t.note||'')}</div>
              <div class="m">${t.tx_date}</div>
            </div>
            <div class="meta" style="color:${t.kind==='income'?'var(--primary)':'var(--danger)'};font-weight:700">${yuan(t.kind==='income'?t.amount:-t.amount)}</div>
            <button class="btn ghost sm" data-edit="${t.id}">编辑</button>
            <button class="btn danger sm" data-del="${t.id}">删除</button>
          </div>`).join('')}
      </div>
    `;

    root.querySelector('#add').addEventListener('click', () => editTx(null, refresh));
    root.querySelector('#mSel').addEventListener('change', e => { filterMonth = e.target.value; refresh(); });
    root.querySelector('#cSel').addEventListener('change', e => { filterCat = e.target.value; refresh(); });
    root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => editTx(b.dataset.edit, refresh)));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
      if(await confirm({ title:'删除记录', message:'确定删除这条记录？', danger:true })){
        await db.transactions.remove(b.dataset.del); toast('已删除'); refresh();
      }
    }));
  }

  async function editTx(id, cb){
    let model = id ? await db.transactions.get(id) : { kind:'expense', category:'餐饮', tx_date: todayStr() };
    const form = buildForm(FIELDS, model);
    // 分类选项随类型切换
    const kindSel = form.querySelector('[name=kind]');
    const catSel = form.querySelector('[name=category]');
    function refreshCats(){
      const cats = kindSel.value==='income' ? CATEGORIES_IN : CATEGORIES_OUT;
      catSel.innerHTML = cats.map(c => `<option value="${c}" ${c===model.category?'selected':''}>${c}</option>`).join('');
    }
    kindSel.addEventListener('change', refreshCats);
    const ok = document.createElement('button'); ok.className='btn'; ok.textContent='保存';
    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='取消';
    const m = openModal({ title: id?'编辑记录':'新增记录', body:form, footer:[cancel, ok] });
    ok.addEventListener('click', async () => {
      const data = formToObject(form);
      try{
        if(id) await db.transactions.update(id, data); else await db.transactions.insert(data);
        toast('保存成功'); m._close(); cb();
      }catch(e){ toast('保存失败', true); }
    });
    cancel.addEventListener('click', m._close);
  }

  refresh();
}
