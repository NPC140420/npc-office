/* =============================================================
   总览首页
   ============================================================= */
import { db, todayStr, ymFromDate, currentUser } from '../db.js';
import { escape, greeting, progressBar, toast, openModal, closeModal, yuan, buildForm, formToObject, navigate } from '../ui.js';

export async function render(root){
  const me = await currentUser();
  const profile = await db.profiles.get(me.id).catch(()=>({}));
  const layout = profile?.layout_options || {};

  const today = todayStr();
  const ym = today.slice(0,7);

  const [plans, todos, events, transactions, savings, body, fitness] = await Promise.all([
    db.plans.list(), db.todos.list(), db.events.list(),
    db.transactions.list(), db.savings.list(),
    db.body.list(), db.fitness.list(),
  ]);

  // 计算统计
  const plansToday = plans.filter(p => p.plan_date === today);
  const planDone = plansToday.filter(p => p.is_done).length;
  const planRate = plansToday.length ? Math.round(planDone/plansToday.length*100) : 0;

  const todoOpen = todos.filter(t => !t.is_done);
  const todoTodayOpen = todoOpen.filter(t => t.due_date === today);
  const todoDone = todos.filter(t => t.is_done).length;

  const eventsToday = events.filter(e => e.start_date === today).sort((a,b)=>(a.start_time||'0').localeCompare(b.start_time||'0'));

  // 月度统计
  const monthTx = transactions.filter(t => ymFromDate(t.tx_date) === ym);
  const incomeM = monthTx.filter(t => t.kind==='income').reduce((a,b)=>a+Number(b.amount||0),0);
  const expenseM = monthTx.filter(t => t.kind==='expense').reduce((a,b)=>a+Number(b.amount||0),0);
  const balance = incomeM - expenseM;
  const fitnessMonth = fitness.filter(f => ymFromDate(f.train_date) === ym).length;

  const bodyRecent = body.sort((a,b)=> (b.check_date||'').localeCompare(a.check_date||'')).slice(0,7);
  const body7 = bodyRecent[0]?.weight;
  const body7Prev = bodyRecent[6]?.weight;
  const weightDelta = (body7!=null && body7Prev!=null) ? (body7 - body7Prev).toFixed(1) : null;

  const bodyToday = body.find(b => b.check_date === today);
  const fitnessToday = fitness.some(f => f.train_date === today && f.is_done);

  // 储蓄总进度
  const savingsTotal = savings.reduce((a,s)=>a+Number(s.saved_amount||0),0);
  const savingsTarget = savings.reduce((a,s)=>a+Number(s.target_amount||0),0);
  const savingsPct = savingsTarget? Math.round(savingsTotal/savingsTarget*100) : 0;

  const nickname = profile?.nickname || '办事员';

  root.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">${greeting()}，${escape(nickname||'办事员')}</div>
        <small>${today} · NPC办事处</small>
      </div>
    </div>

    <div class="card tip">
      <div class="card-title">今日状态速览</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
        <div><div style="font-size:11px;color:var(--text-soft)">计划完成率</div><div style="font-size:20px;font-weight:700">${planRate}%</div><div>${planDone}/${plansToday.length}</div>${progressBar(planRate)}</div>
        <div><div style="font-size:11px;color:var(--text-soft)">待办已完成</div><div style="font-size:20px;font-weight:700">${todoDone}</div><div>剩余 ${todoOpen.length}</div></div>
        <div><div style="font-size:11px;color:var(--text-soft)">今日日程</div><div style="font-size:20px;font-weight:700">${eventsToday.length}</div><div>${eventsToday.length?'最近 '+(eventsToday[0].title):'无安排'}</div></div>
        <div><div style="font-size:11px;color:var(--text-soft)">健康打卡</div><div style="font-size:20px;font-weight:700">${bodyToday?'✅':'⏳'}</div><div>${bodyToday? '体重 '+(bodyToday.weight||'-')+'kg' : '今日未打卡'} · 健身 ${fitnessToday?'✅':'⏳'}</div></div>
      </div>
    </div>

    ${layout.show_today_todos !== false ? `
    <div class="card">
      <div class="card-title">今日待办<a class="more" href="#/todos">查看全部 ›</a></div>
      ${todoTodayOpen.length === 0 ? '<div class="empty"><div class="icon">🌿</div>今日没有待办，享受片刻轻松</div>' :
        todoTodayOpen.slice(0,6).map(t => `
          <div class="list-item" data-id="${t.id}">
            <input type="checkbox" ${t.is_done?'checked':''}/>
            <div class="body">
              <div class="t">${escape(t.title)}</div>
              <div class="m">${t.due_date||''} · ${t.priority==='high'?'高':t.priority==='low'?'低':'中'}</div>
            </div>
          </div>`).join('')}
    </div>` : ''}

    ${layout.show_today_events !== false ? `
    <div class="card">
      <div class="card-title">今日日程<a class="more" href="#/events">查看 ›</a></div>
      ${eventsToday.length === 0 ? '<div class="empty"><div class="icon">📅</div>今天没有日程安排</div>' :
        eventsToday.map(e => `<div class="list-item"><div class="body"><div class="t">${escape(e.title)}</div><div class="m">${e.location||''}${e.note?' · '+e.note:''}</div></div><div class="meta">${e.is_all_day?'全天':((e.start_time||'')+ (e.end_time?'~'+e.end_time:''))}</div></div>`).join('')}
    </div>` : ''}

    ${layout.show_monthly_stats !== false ? `
    <div class="card">
      <div class="card-title">本月综合统计<a class="more" href="#/settings">布局 ›</a></div>
      <div class="two-col" style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div><div style="font-size:11px;color:var(--text-soft)">待办完成率</div>${(()=>{
          const td = todos.filter(t=>t.due_date && ymFromDate(t.due_date)===ym);
          const dn = td.filter(t=>t.is_done).length;
          return progressBar(td.length?Math.round(dn/td.length*100):0);
        })()}<small style="color:var(--text-soft)">${todos.filter(t=>t.due_date&&ymFromDate(t.due_date)===ym).filter(t=>t.is_done).length}/${todos.filter(t=>t.due_date&&ymFromDate(t.due_date)===ym).length}</small></div>
        <div><div style="font-size:11px;color:var(--text-soft)">本月运动</div><div style="font-size:18px;font-weight:700">${fitnessMonth} 次</div></div>
        <div><div style="font-size:11px;color:var(--text-soft)">收支结余</div><div style="font-size:18px;font-weight:700;color:${balance>=0?'var(--primary)':'var(--danger)'}">${yuan(balance)}</div><small style="color:var(--text-soft)">收 ${yuan(incomeM)} / 支 ${yuan(expenseM)}</small></div>
        <div><div style="font-size:11px;color:var(--text-soft)">储蓄进度</div>${progressBar(savingsPct)}<small style="color:var(--text-soft)">${yuan(savingsTotal)} / ${yuan(savingsTarget)}</small></div>
        <div style="grid-column:span 2"><div style="font-size:11px;color:var(--text-soft)">近7天体重</div><div style="font-size:18px;font-weight:700">${body7!=null?body7+' kg':'暂无数据'} ${weightDelta!=null?`<span style="font-size:12px;color:${weightDelta>0?'var(--danger)':'var(--primary)'}">(${weightDelta>0?'+':''}${weightDelta})</span>`:''}</div></div>
      </div>
    </div>` : ''}

    ${layout.show_quick_actions !== false ? `
    <div class="card tip">
      <div class="card-title">快捷操作</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        ${[
          ['计划','plans'],['待办','todos'],['日程','events'],
          ['记账','transactions'],['健康','body'],['健身','fitness']
        ].map(([l,k])=>`<button class="btn ghost" data-go="${k}">+${l}</button>`).join('')}
      </div>
    </div>` : ''}
  `;

  // 事件绑定
  root.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => navigate(b.dataset.go)));
  root.querySelectorAll('.list-item input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', async () => {
      const id = cb.closest('.list-item').dataset.id;
      try{ await db.todos.update(id, { is_done: cb.checked }); toast(cb.checked?'已完成 ✓':'已恢复'); render(root); }catch(e){toast('更新失败',true);}
    });
  });
}
