/* NPC办事处 - 路由 + 9 大业务模块 + 设置页 */
(function(){

const NAV = [
  { key:'overview', label:'总览', icon:'assets/icons/overview.jpg' },
  { key:'plans', label:'计划', icon:'assets/icons/plans.jpg' },
  { key:'todos', label:'待办', icon:'assets/icons/todos.jpg' },
  { key:'events', label:'日程', icon:'assets/icons/events.jpg' },
  { key:'transactions', label:'记账', icon:'assets/icons/transactions.jpg' },
  { key:'savings', label:'储蓄', icon:'assets/icons/savings.jpg' },
  { key:'body', label:'健康', icon:'assets/icons/body.jpg' },
  { key:'fitness', label:'健身', icon:'assets/icons/fitness.jpg' },
  { key:'notes', label:'日记', icon:'assets/icons/notes.jpg' },
  { key:'settings', label:'设置', icon:'assets/icons/settings.jpg' },
];

/* ============================================================
   通用:CRUD 仓储
   ============================================================ */
function repo(table){
  return {
    async list(order='date desc'){
      const s = await getClient();
      const { data, error } = await s.from(table).select('*').order(order.split(' ')[0], { ascending: order.endsWith('asc') });
      if (error) throw error;
      return data || [];
    },
    async add(row){
      const s = await getClient();
      const { data, error } = await s.from(table).insert(row).select().single();
      if (error) throw error;
      return data;
    },
    async update(id, patch){
      const s = await getClient();
      const { data, error } = await s.from(table).update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    async remove(id){
      const s = await getClient();
      const { error } = await s.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    async clearWhere(col, val){
      const s = await getClient();
      let q = s.from(table).delete();
      if (col) q = q.eq(col, val);
      const { error } = await q;
      if (error) throw error;
    }
  };
}

async function getClient(){
  const fn = await window.NPC_SUPABASE();
  return fn;
}

/* ============================================================
   应用框架:Shell + Router
   ============================================================ */
const state = { route: 'overview', user: null };

function renderShell(){
  const theme = NPC.Pref.get('theme', 'cream');
  document.documentElement.setAttribute('data-theme',
    theme === 'cream' ? '' :
    theme === 'minimal' ? 'minimal' :
    theme === 'pink' ? 'pink' : 'dark');

  const isMobile = window.innerWidth < 768;
  const shell = NPC.el('div', { class:'app-shell' + (isMobile ? ' mobile' : '') });

  if (!isMobile) shell.append(renderSidebar());
  else shell.append(renderTopbar(), renderDrawer());

  const main = NPC.el('main', { class:'main', id:'main' });
  shell.append(main);
  document.getElementById('app').innerHTML = '';
  document.getElementById('app').append(shell);

  applyThemeFontScale();
  routeTo(state.route);
}

function renderSidebar(intoDrawer){
  const side = NPC.el('aside', { class: intoDrawer ? 'drawer-side' : 'sidebar' });
  side.append(
    NPC.el('div', { class:'brand' },
      NPC.el('img', { src:'assets/img/avatar-main.jpg', alt:'NPC' }),
      NPC.el('b', null, 'NPC办事处')
    )
  );
  NAV.forEach(n => {
    const item = NPC.el('div', { class:'nav-item' + (state.route===n.key ? ' active' : ''), onclick: () => {
      state.route = n.key; renderShell();
      closeDrawer();
    }},
      NPC.el('img', { src:n.icon, alt:n.label }),
      NPC.el('span', null, n.label)
    );
    side.append(item);
  });
  return side;
}

function renderTopbar(){
  const bar = NPC.el('div', { class:'topbar' },
    NPC.el('button', { class:'menu-btn', onclick: () => toggleDrawer(true) }, '☰'),
    NPC.el('h2', null, currentLabel()),
    NPC.el('img', { class:'avatar', src:'assets/img/avatar-main.jpg' })
  );
  return bar;
}

function renderDrawer(){
  const wrap = document.createElement('div');
  const mask = NPC.el('div', { class:'drawer-mask', onclick: () => toggleDrawer(false), id:'drawer-mask' });
  const side = renderSidebar(true);
  side.id = 'drawer-side';
  wrap.append(mask, side);
  return wrap;
}

function toggleDrawer(show){
  const dm = document.getElementById('drawer-mask');
  const ds = document.getElementById('drawer-side');
  if (!dm || !ds) return;
  dm.classList.toggle('show', show);
  ds.classList.toggle('show', show);
}
function closeDrawer(){ toggleDrawer(false); }

function currentLabel(){
  return (NAV.find(n => n.key === state.route) || {}).label || '';
}

function applyThemeFontScale(){
  const isMobile = window.innerWidth < 768;
  document.documentElement.style.fontSize = isMobile ? '14px' : '15px';
}

window.addEventListener('resize', () => {
  clearTimeout(window.__rt);
  window.__rt = setTimeout(renderShell, 200);
});

async function routeTo(key){
  state.route = key;
  const main = document.getElementById('main');
  main.innerHTML = '<div class="empty">加载中...</div>';
  try {
    const html = await renderPage(key);
    main.innerHTML = '';
    main.append(...(Array.isArray(html) ? html : [html]));
    bindPage(key);
  } catch(e){
    main.innerHTML = `<div class="empty"><div class="icon">⚠️</div>加载失败:${e.message||e}</div>`;
  }
}

async function renderPage(key){
  switch(key){
    case 'overview':    return renderOverview();
    case 'plans':       return renderPlans();
    case 'todos':       return renderTodos();
    case 'events':      return renderEvents();
    case 'transactions':return renderTransactions();
    case 'savings':     return renderSavings();
    case 'body':        return renderBody();
    case 'fitness':     return renderFitness();
    case 'notes':       return renderNotes();
    case 'settings':    return renderSettings();
  }
}
function bindPage(key){
  switch(key){
    case 'overview':    return bindOverview();
    case 'plans':       return bindPlans();
    case 'todos':       return bindTodos();
    case 'events':      return bindEvents();
    case 'transactions':return bindTransactions();
    case 'savings':     return bindSavings();
    case 'body':        return bindBody();
    case 'fitness':     return bindFitness();
    case 'notes':       return bindNotes();
    case 'settings':    return bindSettings();
  }
}

/* ============================================================
   总览页
   ============================================================ */
async function renderOverview(){
  const greet = NPC.el('div', { class:'page-header' },
    NPC.el('div', null,
      NPC.el('h1', null, NPC.greet() + ',办事员'),
      NPC.el('div', { class:'greet' }, NPC.fmtDate(new Date(), 'cn') + ' · 今天又是温柔的一天')
    ),
    NPC.el('div', { class:'header-right' },
      NPC.el('button', { class:'btn-primary', onclick: () => openQuickAdd() }, '＋ 新增记录')
    )
  );

  // 加载所有数据
  const [plans, todos, events, txns, savings, bodies, fits, notes] = await Promise.all([
    repo('plans').list(), repo('todos').list(), repo('events').list(),
    repo('transactions').list(), repo('savings').list(),
    repo('body').list('date desc'), repo('fitness').list(), repo('notes').list()
  ]);
  const cache = { plans, todos, events, txns, savings, bodies, fits, notes };

  const T = NPC.today();
  const monthK = NPC.monthKey(new Date());
  const todayPlans = plans.filter(p => p.date === T);
  const plansDone = todayPlans.filter(p => p.completed).length;
  const todayTodos = todos.filter(t => !t.completed);
  const todayEvents = events.filter(e => e.start_date === T);
  const todayBody = bodies.find(b => b.date === T);
  const monthTxns = txns.filter(t => NPC.monthKey(t.date) === monthK);
  const income = monthTxns.filter(t => t.type==='income').reduce((s,t)=>s+Number(t.amount||0),0);
  const expense= monthTxns.filter(t => t.type==='expense').reduce((s,t)=>s+Number(t.amount||0),0);
  const monthFits = fits.filter(f => NPC.monthKey(f.date) === monthK);

  // 速览
  const summary = NPC.el('div', { class:'card tip' },
    NPC.el('h2', null, '📌 今日状态速览'),
    NPC.el('div', { class:'grid cols-4' },
      stat('今日计划', `${plansDone}/${todayPlans.length}`, `${todayPlans.length?Math.round(plansDone/todayPlans.length*100):0}% 完成`),
      stat('待完成待办', todayTodos.length, '条'),
      stat('今日日程', todayEvents.length, '个'),
      stat('本月运动', monthFits.length, '次')
    ),
    NPC.el('div', { style:{marginTop:'10px', fontSize:'13px', color:'var(--mute)'} },
      `体重打卡 ${todayBody ? '✓' : '✗'} · 饮水打卡 ${todayBody?.water ? todayBody.water + 'ml' : '✗'} · 健身打卡 ${monthFits.find(f => f.date === T) ? '✓' : '✗'}`
    )
  );

  // 待办精简
  const todoList = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '✅ 今日待办 ', NPC.el('span',{class:'badge'}, todayTodos.length + ' 条')),
    todayTodos.length
      ? NPC.el('div', { id:'ov-todos' },
          ...todayTodos.slice(0,8).map(t => todoRow(t, () => routeTo('todos'))))
      : NPC.el('div', { class:'empty' }, '今日无待办,清闲的一天 🎉')
  );

  // 日程
  const evtList = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '📆 今日日程'),
    todayEvents.length
      ? NPC.el('div', null, ...todayEvents.map(e => NPC.el('div', { class:'list-item' },
          NPC.el('div', { style:{flex:'1'} },
            NPC.el('div', { class:'title' }, e.title),
            NPC.el('div', { class:'sub' }, `${e.start_time||''}${e.end_time ? ' ~ '+e.end_time : ''}${e.location ? ' · '+e.location : ''}`)
          )
        )))
      : NPC.el('div', { class:'empty' }, '今天没有安排好的行程')
  );

  // 月度统计
  const totalSaved = savings.reduce((s,x)=>s+Number(x.saved||0),0);
  const totalGoal  = savings.reduce((s,x)=>s+Number(x.target||0),0);
  const savingsPct = totalGoal ? Math.min(100, Math.round(totalSaved/totalGoal*100)) : 0;
  const recentWeights = bodies.slice(0,7).reverse().map(b => b.weight).filter(Boolean);
  const weightTrend = recentWeights.length
    ? (recentWeights[recentWeights.length-1] - recentWeights[0]).toFixed(1)
    : '0';

  const stats = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '📊 月度统计'),
    NPC.el('div', { class:'grid cols-4' },
      stat('待办完成率', (() => {
        const monthTodos = todos.filter(t => NPC.monthKey(t.created_at||t.date||T) === monthK);
        const done = monthTodos.filter(t => t.completed).length;
        return monthTodos.length ? Math.round(done/monthTodos.length*100)+'%' : '—';
      })(), '本月'),
      stat('本月运动', monthFits.length, '次'),
      stat('收支结余', '+' + (income-expense).toFixed(2), '本月'),
      stat('储蓄进度', savingsPct+'%', '总进度')
    ),
    NPC.el('div', { style:{marginTop:'14px'} },
      NPC.el('div', { style:{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--mute)', marginBottom:'6px'} },
        NPC.el('span', null, '本月支出'), NPC.el('span', null, '¥'+expense.toFixed(2))
      ),
      NPC.el('div', { class:'progress' }, NPC.el('div', { style:{width: Math.min(100, expense>0?expense/(income||1)*100:0)+'%'} }))
    ),
    NPC.el('div', { style:{marginTop:'10px', fontSize:'12px', color:'var(--mute)'} },
      '近 7 天体重变化: ' + (Number(weightTrend)>=0?'+':'') + weightTrend + ' kg'
    )
  );

  // 快捷操作
  const quick = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '⚡ 快捷操作'),
    NPC.el('div', { class:'grid cols-3' },
      quickBtn('📝', '新增计划', () => openPlanForm()),
      quickBtn('✅', '新增待办', () => openTodoForm()),
      quickBtn('📅', '新增日程', () => openEventForm()),
      quickBtn('💰', '新增记账', () => openTransactionForm()),
      quickBtn('⚖️', '健康打卡', () => openBodyForm()),
      quickBtn('🏋️', '训练记录', () => openFitnessForm())
    )
  );

  return [greet, summary, todoList, evtList, stats, quick];
}

function stat(num, lbl, sub){
  return NPC.el('div', { class:'stat' },
    NPC.el('div', { class:'num' }, num),
    NPC.el('div', { class:'lbl' }, lbl),
    sub ? NPC.el('div', { style:{fontSize:'11px', color:'var(--mute)', marginTop:'2px'} }, sub) : null
  );
}
function quickBtn(icon, label, click){
  return NPC.el('button', { class:'card', style:{padding:'14px 12px', textAlign:'center', cursor:'pointer', margin:0},
    onclick: click },
    NPC.el('div', { style:{fontSize:'24px'} }, icon),
    NPC.el('div', { style:{fontSize:'13px', marginTop:'4px', color:'var(--ink)'} }, label)
  );
}

function bindOverview(){
  // 待办勾选联动
  NPC.$$('#ov-todos .list-item').forEach(item => {
    item.querySelector('.check').addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = item.dataset.id;
      const t = (await repo('todos').list()).find(x => x.id === id);
      if (t){
        await repo('todos').update(id, { completed: !t.completed });
        NPC.toast(t.completed ? '已标记为未完成' : '已完成 ✓');
        renderShell();
      }
    });
  });
}

function openQuickAdd(){
  NPC.modal({
    title: '快速新增',
    body: `<p style="color:var(--mute); font-size:13px; line-height:1.8">点击想新增的类型:<br>
      <a href="javascript:;" onclick="document.getElementById('modal-mask')?.remove();window.dispatchEvent(new CustomEvent('npc-open',{detail:{kind:'plans'}}))">📝 计划</a> ·
      <a href="javascript:;" onclick="document.getElementById('modal-mask')?.remove();window.dispatchEvent(new CustomEvent('npc-open',{detail:{kind:'todos'}}))">✅ 待办</a> ·
      <a href="javascript:;" onclick="document.getElementById('modal-mask')?.remove();window.dispatchEvent(new CustomEvent('npc-open',{detail:{kind:'events'}}))">📅 日程</a> ·
      <a href="javascript:;" onclick="document.getElementById('modal-mask')?.remove();window.dispatchEvent(new CustomEvent('npc-open',{detail:{kind:'transactions'}}))">💰 记账</a> ·
      <a href="javascript:;" onclick="document.getElementById('modal-mask')?.remove();window.dispatchEvent(new CustomEvent('npc-open',{detail:{kind:'body'}}))">⚖️ 健康</a> ·
      <a href="javascript:;" onclick="document.getElementById('modal-mask')?.remove();window.dispatchEvent(new CustomEvent('npc-open',{detail:{kind:'fitness'}}))">🏋️ 健身</a>
    </p>`,
    onConfirm: ()=>{}, confirmText:'关闭', cancelText:''
  });
}

/* ============================================================
   计划 plans
   ============================================================ */
async function renderPlans(){
  const header = NPC.el('div', { class:'page-header' },
    NPC.el('div', null,
      NPC.el('h1', null, '📝 我的计划'),
      NPC.el('div', { class:'greet' }, '按日期整理今日与未来计划')
    ),
    NPC.el('button', { class:'btn-primary', id:'btn-add-plan' }, '＋ 新增计划')
  );

  const filter = NPC.el('div', { class:'segmented', id:'plan-filter', style:{marginBottom:'14px'} },
    NPC.el('button', { class:'today active', 'data-f':'today' }, '今日'),
    NPC.el('button', { 'data-f':'date' }, '指定日期'),
    NPC.el('button', { 'data-f':'all' }, '全部')
  );

  const cal = NPC.el('div', { class:'card', style:{marginBottom:'14px'} },
    NPC.el('h2', null, '日历选日'),
    NPC.el('input', { type:'date', id:'plan-date', value: NPC.today(), style:{padding:'10px', borderRadius:'12px', border:'1.5px solid var(--line)', background:'var(--bg)', color:'var(--ink)', width:'100%'} })
  );

  const list = NPC.el('div', { id:'plan-list' });

  return [header, cal, filter, list];
}

function bindPlans(){
  document.getElementById('btn-add-plan').addEventListener('click', () => openPlanForm());
  document.getElementById('plan-date').addEventListener('change', refreshPlanList);
  NPC.$$('#plan-filter button').forEach(b =>
    b.addEventListener('click', () => {
      NPC.$$('#plan-filter button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      refreshPlanList();
    })
  );
  refreshPlanList();
}

async function refreshPlanList(){
  const all = await repo('plans').list('date desc');
  const target = document.getElementById('plan-list');
  target.innerHTML = '';
  const f = NPC.$$('#plan-filter button').find(b => b.classList.contains('active'))?.dataset?.f || 'today';
  const selDate = document.getElementById('plan-date').value || NPC.today();
  let data = all;
  if (f === 'today') data = all.filter(x => x.date === NPC.today());
  else if (f === 'date') data = all.filter(x => x.date === selDate);
  // 月统计
  const monthK = NPC.monthKey(new Date());
  const monthP = all.filter(x => NPC.monthKey(x.date||'') === monthK);
  const done = monthP.filter(x => x.completed).length;
  target.append(NPC.el('div', { class:'card tip' },
    NPC.el('h2', null, '本月完成率'),
    NPC.el('div', { style:{display:'flex', alignItems:'center', gap:'12px'} },
      NPC.el('div', { style:{flex:'1'} }, NPC.el('div', { class:'progress' }, NPC.el('div', { style:{width: (monthP.length?done/monthP.length*100:0)+'%'} }))),
      NPC.el('div', null, `${done}/${monthP.length} · ${monthP.length?Math.round(done/monthP.length*100):0}%`)
    )
  ));

  if (data.length === 0){
    target.append(NPC.el('div', { class:'empty' }, NPC.el('div', { class:'icon' }, '📝'), '还没有计划,新增一个吧'));
  } else {
    const card = NPC.el('div', { class:'card' }, NPC.el('h2', null, `计划列表 (${data.length})`));
    const wrap = NPC.el('div');
    data.forEach(p => wrap.append(planRow(p)));
    card.append(wrap);
    target.append(card);
  }
}

function planRow(p){
  return NPC.el('div', { class:'list-item' + (p.completed ? ' done' : ''), 'data-id':p.id },
    NPC.el('div', { class:'check', 'data-act':'toggle' }),
    NPC.el('div', { style:{flex:'1'} },
      NPC.el('div', { class:'title' }, p.title),
      NPC.el('div', { class:'sub' }, `${NPC.fmtDate(p.date,'md')} · ${p.note||'无备注'}${p.completed && p.review ? ' · 复盘:'+p.review : ''}`)
    ),
    NPC.el('div', { class:'row-actions' },
      NPC.el('button', { onclick: () => openPlanForm(p) }, '编辑'),
      NPC.el('button', { class:'del', onclick: () => delPlan(p) }, '删除')
    )
  );
}

function bindPlanRowToggle(){
  NPC.$$('#plan-list .list-item').forEach(item => {
    item.querySelector('[data-act=toggle]').addEventListener('click', async () => {
      const id = item.dataset.id;
      const list = await repo('plans').list();
      const p = list.find(x => x.id === id);
      if (p){
        if (!p.completed && !p.review) {
          // 弹出复盘
          NPC.modal({
            title: '完成复盘',
            body: `<p style="font-size:13px;color:var(--mute);margin-bottom:8px">给这次完成加点想法吧(可空)</p>
              <div class="form-field"><textarea id="rv"></textarea></div>`,
            onConfirm: async (box) => {
              const review = box.querySelector('#rv').value.trim();
              await repo('plans').update(id, { completed: true, review });
              NPC.toast('已完成 ✓');
              refreshPlanList();
            },
            confirmText: '标记完成'
          });
        } else {
          await repo('plans').update(id, { completed: !p.completed });
          refreshPlanList();
        }
      }
    });
  });
}

function openPlanForm(p){
  NPC.modal({
    title: p ? '编辑计划' : '新增计划',
    body: `
      <div class="form-field"><label>日期</label><input type="date" id="f-date" value="${p?.date||NPC.today()}"/></div>
      <div class="form-field"><label>标题</label><input type="text" id="f-title" value="${p?.title||''}" maxlength="60"/></div>
      <div class="form-field"><label>详细备注</label><textarea id="f-note">${p?.note||''}</textarea></div>
      ${p ? `<div class="form-field"><label>完成复盘</label><textarea id="f-review">${p?.review||''}</textarea></div>` : ''}
      ${p ? `<div class="form-field check-row"><input type="checkbox" id="f-done" ${p.completed?'checked':''}/><label for="f-done" style="margin:0">标记已完成</label></div>` : ''}
    `,
    onConfirm: async (box) => {
      const date = box.querySelector('#f-date').value;
      const title = box.querySelector('#f-title').value.trim();
      const note = box.querySelector('#f-note').value.trim();
      if (!title) return NPC.toast('请填标题');
      const patch = { date, title, note };
      if (p){
        if (p) patch.review = box.querySelector('#f-review')?.value || '';
        if (p) patch.completed = box.querySelector('#f-done')?.checked || false;
        await repo('plans').update(p.id, patch);
      } else {
        await repo('plans').add({ ...patch, completed: false });
      }
      NPC.toast('已保存');
      NPC.closeModal();
      refreshPlanList();
    }
  });
}

function delPlan(p){
  NPC.confirmDialog('删除计划', `确定删除「${p.title}」吗?`, async () => {
    await repo('plans').remove(p.id);
    NPC.toast('已删除');
    refreshPlanList();
  });
}

/* ============================================================
   待办 todos
   ============================================================ */
async function renderTodos(){
  const header = NPC.el('div', { class:'page-header' },
    NPC.el('div', null,
      NPC.el('h1', null, '✅ 待办清单'),
      NPC.el('div', { class:'greet' }, '把所有琐事一网打尽')
    ),
    NPC.el('button', { class:'btn-primary', id:'btn-add-todo' }, '＋ 新增待办')
  );
  const seg = NPC.el('div', { class:'segmented', id:'todo-seg', style:{marginBottom:'14px'} },
    NPC.el('button', { class:'active', 'data-f':'all' }, '全部'),
    NPC.el('button', { 'data-f':'pending' }, '待完成'),
    NPC.el('button', { 'data-f':'done' }, '已完成')
  );
  const list = NPC.el('div', { id:'todo-list' });
  return [header, seg, list];
}

function bindTodos(){
  document.getElementById('btn-add-todo').addEventListener('click', () => openTodoForm());
  NPC.$$('#todo-seg button').forEach(b =>
    b.addEventListener('click', () => {
      NPC.$$('#todo-seg button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      refreshTodoList();
    })
  );
  refreshTodoList();
}

async function refreshTodoList(){
  const all = await repo('todos').list();
  const target = document.getElementById('todo-list');
  target.innerHTML = '';
  const f = NPC.$$('#todo-seg button').find(b => b.classList.contains('active'))?.dataset?.f || 'all';
  const today = NPC.today();
  let data = all;
  if (f === 'pending') data = all.filter(x => !x.completed);
  else if (f === 'done') data = all.filter(x => x.completed);
  // 逾期
  const overdue = all.filter(x => !x.completed && x.due_date && x.due_date < today);
  if (overdue.length){
    target.append(NPC.el('div', { class:'card', style:{borderColor:'var(--danger)'} },
      NPC.el('h2', null, '⚠️ 逾期 ', NPC.el('span',{class:'badge', style:{background:'var(--danger)'}}, overdue.length)),
      ...overdue.map(t => todoRow(t))
    ));
  }
  if (data.length === 0){
    target.append(NPC.el('div', { class:'empty' }, '🥳', '这里空空如也'));
  } else {
    const wrap = NPC.el('div', { class:'card' },
      NPC.el('h2', null, `${f==='pending'?'待完成':f==='done'?'已完成':'全部'} (${data.length})`)
    );
    const inner = NPC.el('div');
    data.forEach(t => inner.append(todoRow(t)));
    wrap.append(inner);
    target.append(wrap);
  }
}

function todoRow(t, onClick){
  const overdue = !t.completed && t.due_date && t.due_date < NPC.today();
  const item = NPC.el('div', { class:'list-item' + (t.completed?' done':''), 'data-id':t.id },
    NPC.el('div', { class:'check' }),
    NPC.el('div', { style:{flex:'1'} },
      NPC.el('div', { class:'title' },
        NPC.el('span', { class: t.priority==='high'?'priority-high':t.priority==='mid'?'priority-mid':'priority-low', style:{marginRight:'6px'} }, t.priority==='high'?'●':t.priority==='mid'?'●':'○'),
        t.title
      ),
      NPC.el('div', { class:'sub' },
        (t.note ? t.note + ' · ' : '') +
        (t.due_date ? `截止 ${t.fmt||NPC.fmtDate(t.due_date,'md')}` : '') +
        (overdue ? ' · 已逾期' : '')
      )
    ),
    NPC.el('div', { class:'row-actions' },
      NPC.el('button', { onclick: () => openTodoForm(t) }, '编辑'),
      NPC.el('button', { class:'del', onclick: () => delTodo(t) }, '删除')
    )
  );
  if (overdue) item.style.borderLeft = '3px solid var(--danger)';
  return item;
}

function bindTodoToggles(){
  NPC.$$('#todo-list .list-item .check').forEach(c => {
    c.addEventListener('click', async () => {
      const item = c.closest('.list-item');
      const id = item.dataset.id;
      const t = (await repo('todos').list()).find(x => x.id === id);
      if (t){
        await repo('todos').update(id, { completed: !t.completed });
        NPC.toast(t.completed ? '已标为未完成' : '已完成 ✓');
        refreshTodoList();
      }
    });
  });
}

function openTodoForm(t){
  NPC.modal({
    title: t ? '编辑待办' : '新增待办',
    body: `
      <div class="form-field"><label>标题</label><input type="text" id="f-title" value="${t?.title||''}" maxlength="80"/></div>
      <div class="form-field"><label>备注</label><textarea id="f-note">${t?.note||''}</textarea></div>
      <div class="form-field"><label>优先级</label><select id="f-prio"><option value="high" ${t?.priority==='high'?'selected':''}>高</option><option value="mid" ${t?.priority==='mid'||!t?'selected':''}>中</option><option value="low" ${t?.priority==='low'?'selected':''}>低</option></select></div>
      <div class="form-field"><label>截止日期(可选)</label><input type="date" id="f-due" value="${t?.due_date||''}"/></div>
    `,
    onConfirm: async (box) => {
      const title = box.querySelector('#f-title').value.trim();
      if (!title) return NPC.toast('请填标题');
      const payload = {
        title,
        note: box.querySelector('#f-note').value.trim(),
        priority: box.querySelector('#f-prio').value,
        due_date: box.querySelector('#f-due').value || null
      };
      if (t) await repo('todos').update(t.id, payload);
      else await repo('todos').add({ ...payload, completed: false });
      NPC.toast('已保存');
      NPC.closeModal();
      refreshTodoList();
    }
  });
}

function delTodo(t){
  NPC.confirmDialog('删除待办', `确定删除「${t.title}」吗?`, async () => {
    await repo('todos').remove(t.id);
    NPC.toast('已删除');
    refreshTodoList();
  });
}

/* ============================================================
   日程 events
   ============================================================ */
async function renderEvents(){
  const header = NPC.el('div', { class:'page-header' },
    NPC.el('div', null,
      NPC.el('h1', null, '📅 日程'),
      NPC.el('div', { class:'greet' }, '管理每一天的安排')
    ),
    NPC.el('button', { class:'btn-primary', id:'btn-add-event' }, '＋ 新增日程')
  );
  const cal = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '日历视图'),
    NPC.el('input', { type:'date', id:'ev-date', value: NPC.today(), style:{padding:'10px', borderRadius:'12px', border:'1.5px solid var(--line)', background:'var(--bg)', color:'var(--ink)', width:'100%'} })
  );
  const list = NPC.el('div', { id:'event-list' });
  return [header, cal, list];
}

function bindEvents(){
  document.getElementById('btn-add-event').addEventListener('click', () => openEventForm());
  document.getElementById('ev-date').addEventListener('change', refreshEventList);
  refreshEventList();
}

async function refreshEventList(){
  const all = await repo('events').list('start_date desc,start_time');
  const target = document.getElementById('event-list');
  target.innerHTML = '';
  const sel = document.getElementById('ev-date').value || NPC.today();
  const day = all.filter(e => e.start_date === sel).sort((a,b) => (a.start_time||'').localeCompare(b.start_time||''));
  const monthK = NPC.monthKey(new Date());
  const monthEvs = all.filter(e => NPC.monthKey(e.start_date||'') === monthK);
  target.append(NPC.el('div', { class:'card tip' },
    NPC.el('h2', null, `${NPC.fmtDate(sel,'cn')}`),
    NPC.el('div', { class:'greet' }, `本月共 ${monthEvs.length} 个日程 · 今天 ${day.length} 个`)
  ));
  if (!day.length){
    target.append(NPC.el('div', { class:'empty' }, '📅 这天还没有安排'));
  } else {
    const wrap = NPC.el('div', { class:'card' },
      NPC.el('h2', null, '当天日程'));
    const inner = NPC.el('div');
    day.forEach(e => inner.append(eventRow(e)));
    wrap.append(inner);
    target.append(wrap);
  }
}

function eventRow(e){
  return NPC.el('div', { class:'list-item', 'data-id':e.id },
    NPC.el('div', { style:{fontSize:'20px'} }, e.all_day ? '🗓️' : '⏰'),
    NPC.el('div', { style:{flex:'1'} },
      NPC.el('div', { class:'title' }, e.title),
      NPC.el('div', { class:'sub' },
        (e.all_day ? '全天' : `${e.start_time||''}${e.end_time?' ~ '+e.end_time:''}`) +
        (e.location ? ' · ' + e.location : '') +
        (e.note ? ' · ' + e.note : '')
      )
    ),
    NPC.el('div', { class:'row-actions' },
      NPC.el('button', { onclick: () => openEventForm(e) }, '编辑'),
      NPC.el('button', { class:'del', onclick: () => delEvent(e) }, '删除')
    )
  );
}

function openEventForm(e){
  NPC.modal({
    title: e ? '编辑日程' : '新增日程',
    body: `
      <div class="form-field"><label>标题</label><input type="text" id="f-title" value="${e?.title||''}" maxlength="80"/></div>
      <div class="form-field"><label>开始日期</label><input type="date" id="f-date" value="${e?.start_date||NPC.today()}"/></div>
      <div class="form-field check-row"><input type="checkbox" id="f-all" ${e?.all_day?'checked':''}/><label for="f-all" style="margin:0">全天事件</label></div>
      <div class="form-field" style="display:flex;gap:8px"><div style="flex:1"><label>开始</label><input type="time" id="f-start" value="${e?.start_time||''}"/></div><div style="flex:1"><label>结束</label><input type="time" id="f-end" value="${e?.end_time||''}"/></div></div>
      <div class="form-field"><label>地点</label><input type="text" id="f-loc" value="${e?.location||''}"/></div>
      <div class="form-field"><label>备注</label><textarea id="f-note">${e?.note||''}</textarea></div>
    `,
    onConfirm: async (box) => {
      const title = box.querySelector('#f-title').value.trim();
      if (!title) return NPC.toast('请填标题');
      const payload = {
        title,
        start_date: box.querySelector('#f-date').value,
        all_day: box.querySelector('#f-all').checked,
        start_time: box.querySelector('#f-all').checked ? null : (box.querySelector('#f-start').value || null),
        end_time: box.querySelector('#f-all').checked ? null : (box.querySelector('#f-end').value || null),
        location: box.querySelector('#f-loc').value.trim(),
        note: box.querySelector('#f-note').value.trim()
      };
      if (e) await repo('events').update(e.id, payload);
      else await repo('events').add(payload);
      NPC.toast('已保存');
      NPC.closeModal();
      refreshEventList();
    }
  });
}

function delEvent(e){
  NPC.confirmDialog('删除日程', `确定删除「${e.title}」吗?`, async () => {
    await repo('events').remove(e.id);
    NPC.toast('已删除');
    refreshEventList();
  });
}

/* ============================================================
   记账 transactions
   ============================================================ */
const CATEGORIES = ['餐饮','交通','购物','居家','娱乐','医疗','教育','工资','红包','投资','其他'];
async function renderTransactions(){
  const header = NPC.el('div', { class:'page-header' },
    NPC.el('div', null,
      NPC.el('h1', null, '💰 收支记账'),
      NPC.el('div', { class:'greet' }, '看清每一分钱的去向')
    ),
    NPC.el('div', { class:'header-right' },
      NPC.el('button', { class:'btn-ghost', onclick: () => openTransactionForm(null,'income') }, '＋ 记一笔收入'),
      NPC.el('button', { class:'btn-primary', id:'btn-add-tx' }, '＋ 记一笔支出')
    )
  );
  const filters = NPC.el('div', { class:'card' },
    NPC.el('div', { style:{display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'10px'} },
      NPC.el('div', { class:'segmented', id:'tx-month' },
        ...['', NPC.monthKey(new Date())].map((m,i) =>
          NPC.el('button', { class: i===1?'active':'', 'data-m':m }, i===0?'全部':m)
        )
      ),
      NPC.el('select', { id:'tx-cat', style:{padding:'8px 12px', borderRadius:'10px', border:'1.5px solid var(--line)', background:'var(--bg)'} },
        NPC.el('option', { value:'' }, '全部分类'),
        ...CATEGORIES.map(c => NPC.el('option', { value:c }, c))
      )
    )
  );
  const stats = NPC.el('div', { class:'card tip', id:'tx-stats' });
  const list = NPC.el('div', { id:'tx-list' });
  return [header, filters, stats, list];
}

function bindTransactions(){
  document.getElementById('btn-add-tx').addEventListener('click', () => openTransactionForm(null,'expense'));
  document.getElementById('tx-month').addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON'){
      NPC.$$('#tx-month button').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      refreshTxList();
    }
  });
  document.getElementById('tx-cat').addEventListener('change', refreshTxList);
  refreshTxList();
}

async function refreshTxList(){
  const all = await repo('transactions').list('date desc');
  const target = document.getElementById('tx-list');
  target.innerHTML = '';
  const mk = NPC.$$('#tx-month button').find(b => b.classList.contains('active'))?.dataset?.m || '';
  const cat = document.getElementById('tx-cat').value;
  let data = all;
  if (mk) data = data.filter(x => NPC.monthKey(x.date||'') === mk);
  if (cat) data = data.filter(x => x.category === cat);
  // 统计
  const m = mk ? data : data.filter(x => NPC.monthKey(x.date||'') === NPC.monthKey(new Date()));
  const income = m.filter(t => t.type==='income').reduce((s,t)=>s+Number(t.amount||0),0);
  const expense= m.filter(t => t.type==='expense').reduce((s,t)=>s+Number(t.amount||0),0);
  const stats = document.getElementById('tx-stats');
  stats.innerHTML = '';
  stats.append(
    NPC.el('h2', null, '月度统计(' + (mk||NPC.monthKey(new Date())) + ')'),
    NPC.el('div', { class:'grid cols-3' },
      stat('收入', '¥'+income.toFixed(2), ''),
      stat('支出', '¥'+expense.toFixed(2), ''),
      stat('结余', '+¥' + (income-expense).toFixed(2), '')
    )
  );
  // 分类占比
  const catMap = {};
  m.filter(t => t.type==='expense').forEach(t => {
    catMap[t.category] = (catMap[t.category]||0) + Number(t.amount||0);
  });
  const cats = Object.entries(catMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  if (cats.length){
    const max = cats[0][1];
    stats.append(NPC.el('div', { style:{marginTop:'12px', fontSize:'13px'} },
      NPC.el('div', { style:{fontWeight:'600', marginBottom:'6px'} }, '分类支出 Top'),
      ...cats.map(([c,v]) => NPC.el('div', { style:{display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px'} },
        NPC.el('div', { style:{width:'60px', color:'var(--mute)'} }, c),
        NPC.el('div', { style:{flex:'1', height:'8px', background:'var(--bg)', borderRadius:'4px'} },
          NPC.el('div', { style:{width:(v/max*100)+'%', height:'100%', background:'var(--accent)', borderRadius:'4px'} })
        ),
        NPC.el('div', { style:{fontSize:'12px', color:'var(--ink)', minWidth:'50px', textAlign:'right'} }, '¥'+v.toFixed(0))
      ))
    ));
  }
  if (!data.length){
    target.append(NPC.el('div', { class:'empty' }, '💰', '还没有记账,记一笔吧'));
  } else {
    const wrap = NPC.el('div', { class:'card' },
      NPC.el('h2', null, `明细 (${data.length})`));
    const inner = NPC.el('div');
    data.forEach(t => inner.append(txRow(t)));
    wrap.append(inner);
    target.append(wrap);
  }
}

function txRow(t){
  return NPC.el('div', { class:'list-item', 'data-id':t.id },
    NPC.el('div', { style:{fontSize:'20px'} }, t.type==='income'?'💵':'💸'),
    NPC.el('div', { style:{flex:'1'} },
      NPC.el('div', { class:'title' }, (t.category||'其他') + (t.note?' · '+t.note:'')),
      NPC.el('div', { class:'sub' }, NPC.fmtDate(t.date,'md'))
    ),
    NPC.el('div', { class:'meta', style:{fontWeight:700, color: t.type==='income'?'var(--accent)':'var(--danger)'} },
      (t.type==='income'?'+':'−') + '¥' + Number(t.amount).toFixed(2)),
    NPC.el('div', { class:'row-actions' },
      NPC.el('button', { onclick: () => openTransactionForm(t) }, '编辑'),
      NPC.el('button', { class:'del', onclick: () => delTx(t) }, '删除')
    )
  );
}

function openTransactionForm(t, defaultType){
  const initType = t?.type || defaultType || 'expense';
  NPC.modal({
    title: t ? '编辑记账' : '新增记账',
    body: `
      <div class="form-field"><label>类型</label><select id="f-type"><option value="expense" ${initType==='expense'?'selected':''}>支出</option><option value="income" ${initType==='income'?'selected':''}>收入</option></select></div>
      <div class="form-field"><label>金额</label><input type="number" id="f-amount" value="${t?.amount||''}" min="0" step="0.01"/></div>
      <div class="form-field"><label>分类</label><select id="f-cat">${CATEGORIES.map(c => `<option ${t?.category===c?'selected':''} value="${c}">${c}</option>`).join('')}</select></div>
      <div class="form-field"><label>日期</label><input type="date" id="f-date" value="${t?.date||NPC.today()}"/></div>
      <div class="form-field"><label>备注/标签</label><input type="text" id="f-note" value="${t?.note||''}" maxlength="60"/></div>
    `,
    onConfirm: async (box) => {
      const amount = parseFloat(box.querySelector('#f-amount').value);
      if (!amount || amount <= 0) return NPC.toast('请填金额');
      const payload = {
        type: box.querySelector('#f-type').value,
        amount,
        category: box.querySelector('#f-cat').value,
        date: box.querySelector('#f-date').value,
        note: box.querySelector('#f-note').value.trim()
      };
      if (t) await repo('transactions').update(t.id, payload);
      else await repo('transactions').add(payload);
      NPC.toast('已保存');
      NPC.closeModal();
      refreshTxList();
    }
  });
}

function delTx(t){
  NPC.confirmDialog('删除记录', `确定删除「${t.category} ¥${t.amount}」吗?`, async () => {
    await repo('transactions').remove(t.id);
    NPC.toast('已删除');
    refreshTxList();
  });
}

/* ============================================================
   储蓄 savings
   ============================================================ */
async function renderSavings(){
  const header = NPC.el('div', { class:'page-header' },
    NPC.el('div', null,
      NPC.el('h1', null, '🐷 储蓄目标'),
      NPC.el('div', { class:'greet' }, '每一笔小钱,通往大目标')
    ),
    NPC.el('button', { class:'btn-primary', id:'btn-add-save' }, '＋ 新建目标')
  );
  const summary = NPC.el('div', { class:'card tip', id:'save-summary' });
  const list = NPC.el('div', { id:'save-list' });
  return [header, summary, list];
}
function bindSavings(){
  document.getElementById('btn-add-save').addEventListener('click', () => openSaveForm());
  refreshSaveList();
}
async function refreshSaveList(){
  const all = await repo('savings').list();
  const list = document.getElementById('save-list');
  const summary = document.getElementById('save-summary');
  list.innerHTML = ''; summary.innerHTML = '';
  const totalSave = all.reduce((s,x)=>s+Number(x.saved||0),0);
  const totalGoal = all.reduce((s,x)=>s+Number(x.target||0),0);
  const pct = totalGoal ? Math.min(100, Math.round(totalSave/totalGoal*100)) : 0;
  summary.append(
    NPC.el('h2', null, '总体进度'),
    NPC.el('div', { style:{display:'flex', alignItems:'center', gap:'12px'} },
      NPC.el('div', { style:{flex:'1'} }, NPC.el('div', { class:'progress' }, NPC.el('div', { style:{width:pct+'%'} }))),
      NPC.el('div', null, pct + '%')
    ),
    NPC.el('div', { class:'greet', style:{marginTop:'6px'} }, `已存 ¥${totalSave.toFixed(2)} / 目标 ¥${totalGoal.toFixed(2)}`)
  );
  if (!all.length){
    list.append(NPC.el('div', { class:'empty' }, '💰', '还没有储蓄目标,新建一个吧'));
    return;
  }
  const wrap = NPC.el('div', { class:'card' },
    NPC.el('h2', null, `目标列表 (${all.length})`));
  const inner = NPC.el('div');
  all.forEach(s => inner.append(saveRow(s)));
  wrap.append(inner);
  list.append(wrap);
}

function saveRow(s){
  const pct = s.target ? Math.min(100, Math.round(Number(s.saved||0)/Number(s.target)*100)) : 0;
  return NPC.el('div', { class:'list-item', 'data-id':s.id, style:{flexDirection:'column', alignItems:'stretch', gap:'6px'} },
    NPC.el('div', { style:{display:'flex', alignItems:'center', width:'100%'} },
      NPC.el('div', { style:{fontSize:'20px', marginRight:'8px'} }, '🐖'),
      NPC.el('div', { style:{flex:'1'} },
        NPC.el('div', { class:'title' }, s.name),
        NPC.el('div', { class:'sub' }, `截止 ${NPC.fmtDate(s.deadline||'','md')} · ¥${Number(s.saved||0).toFixed(2)} / ¥${Number(s.target||0).toFixed(2)}`)
      ),
      NPC.el('div', { class:'row-actions' },
        NPC.el('button', { onclick: () => openSaveForm(s) }, '编辑'),
        NPC.el('button', { onclick: () => addToSave(s) }, '存钱'),
        NPC.el('button', { class:'del', onclick: () => delSave(s) }, '删除')
      )
    ),
    NPC.el('div', { class:'progress' }, NPC.el('div', { style:{width:pct+'%'} })),
    NPC.el('div', { style:{fontSize:'11px', color:'var(--mute)', marginTop:'-2px'} }, pct + '% 完成')
  );
}
function openSaveForm(s){
  NPC.modal({
    title: s ? '编辑目标' : '新建储蓄目标',
    body: `
      <div class="form-field"><label>目标名称</label><input type="text" id="f-name" value="${s?.name||''}" maxlength="40"/></div>
      <div class="form-field"><label>目标总额(¥)</label><input type="number" id="f-target" value="${s?.target||''}" min="0" step="0.01"/></div>
      <div class="form-field"><label>已存金额(¥)</label><input type="number" id="f-saved" value="${s?.saved??0}" min="0" step="0.01"/></div>
      <div class="form-field"><label>截止日期</label><input type="date" id="f-deadline" value="${s?.deadline||''}"/></div>
      <div class="form-field"><label>备注</label><textarea id="f-note">${s?.note||''}</textarea></div>
    `,
    onConfirm: async (box) => {
      const name = box.querySelector('#f-name').value.trim();
      if (!name) return NPC.toast('请填目标名称');
      const payload = {
        name,
        target: parseFloat(box.querySelector('#f-target').value)||0,
        saved: parseFloat(box.querySelector('#f-saved').value)||0,
        deadline: box.querySelector('#f-deadline').value || null,
        note: box.querySelector('#f-note').value.trim()
      };
      if (s) await repo('savings').update(s.id, payload);
      else await repo('savings').add(payload);
      NPC.toast('已保存');
      NPC.closeModal();
      refreshSaveList();
    }
  });
}
function addToSave(s){
  NPC.modal({
    title: '存入金额 - ' + s.name,
    body: `
      <p style="font-size:13px;color:var(--mute)">目标:¥${Number(s.target).toFixed(2)} · 已存:¥${Number(s.saved||0).toFixed(2)}</p>
      <div class="form-field"><label>本次存入</label><input type="number" id="f-add" min="0" step="0.01"/></div>
    `,
    onConfirm: async (box) => {
      const v = parseFloat(box.querySelector('#f-add').value);
      if (!v || v<=0) return NPC.toast('请输入金额');
      await repo('savings').update(s.id, { saved: Number(s.saved||0) + v });
      NPC.toast('已存入 ✓');
      NPC.closeModal();
      refreshSaveList();
    },
    confirmText: '存入'
  });
}
function delSave(s){
  NPC.confirmDialog('删除目标', `确定删除「${s.name}」吗?`, async () => {
    await repo('savings').remove(s.id);
    NPC.toast('已删除');
    refreshSaveList();
  });
}

/* ============================================================
   健康 body
   ============================================================ */
async function renderBody(){
  const header = NPC.el('div', { class:'page-header' },
    NPC.el('div', null,
      NPC.el('h1', null, '⚖️ 身体健康打卡'),
      NPC.el('div', { class:'greet' }, '记录每天身体的小变化')
    ),
    NPC.el('button', { class:'btn-primary', id:'btn-add-body' }, '＋ 今日打卡')
  );
  const chart = NPC.el('div', { class:'card tip', id:'weight-chart' });
  const list = NPC.el('div', { id:'body-list' });
  return [header, chart, list];
}
function bindBody(){
  document.getElementById('btn-add-body').addEventListener('click', () => openBodyForm());
  refreshBodyList();
}
async function refreshBodyList(){
  const all = await repo('body').list('date desc');
  const list = document.getElementById('body-list');
  const chart = document.getElementById('weight-chart');
  list.innerHTML = ''; chart.innerHTML = '';
  // 体重曲线
  chart.append(NPC.el('h2', null, '📈 体重趋势(近 14 天)'));
  const recent = all.slice(0,14).reverse();
  if (recent.length){
    const ws = recent.map(b => Number(b.weight)).filter(Boolean);
    const min = Math.min(...ws), max = Math.max(...ws);
    const range = max - min || 1;
    const W = 280, H = 70;
    chart.append(NPC.el('div', { style:{overflow:'auto'} },
      NPC.el('svg', { width: Math.max(W, recent.length*30), height: H+24, viewBox:`0 0 ${Math.max(W, recent.length*30)} ${H+24}`, xmlns:'http://www.w3.org/2000/svg', style:{display:'block'} },
        ...(() => {
          const step = Math.max(W, recent.length*30) / Math.max(recent.length-1, 1);
          const pts = recent.map((b, i) => `${i*step},${H - (Number(b.weight)-min)/range*H}`);
          return [
            NPC.el('polyline', { points: pts.join(' '), fill:'none', stroke:'var(--accent)', 'stroke-width':'2' }),
            ...recent.map((b,i) => NPC.el('circle', { cx: i*step, cy: H - (Number(b.weight)-min)/range*H, r:'3', fill:'var(--accent)' }))
          ];
        })()
      )
    ));
    chart.append(NPC.el('div', { class:'greet', style:{marginTop:'6px'} }, `最低 ${min}kg · 最高 ${max}kg · 最近 ${ws.length>0 ? ws[ws.length-1] : '—'}kg`));
  } else {
    chart.append(NPC.el('div', { class:'empty' }, '📈', '还没有体重数据'));
  }

  if (!all.length){
    list.append(NPC.el('div', { class:'empty' }, '🌿', '开始今天的第一条打卡吧'));
  } else {
    const wrap = NPC.el('div', { class:'card' },
      NPC.el('h2', null, `打卡记录 (${all.length})`));
    const inner = NPC.el('div');
    all.forEach(b => inner.append(bodyRow(b)));
    wrap.append(inner);
    list.append(wrap);
  }
}

function bodyRow(b){
  return NPC.el('div', { class:'list-item', 'data-id':b.id },
    NPC.el('div', { style:{fontSize:'20px'} }, '🌿'),
    NPC.el('div', { style:{flex:'1'} },
      NPC.el('div', { class:'title' }, `${NPC.fmtDate(b.date,'md')} · ${b.weight||'?'}kg`),
      NPC.el('div', { class:'sub' },
        `${b.height?b.height+'cm ':''}${b.waist?b.waist+'cm腰 ':''}${b.belly?b.belly+'cm腹 ':''}${b.water?b.water+'ml水 ':''}${b.sleep?'睡'+b.sleep+'h ':''}${b.steps?'步数'+b.steps+' ':''}${b.feeling?'· 感觉:'+b.feeling:''}` + (b.diet ? ' · 饮食:'+b.diet : '')
      )
    ),
    NPC.el('div', { class:'row-actions' },
      NPC.el('button', { onclick: () => openBodyForm(b) }, '编辑'),
      NPC.el('button', { class:'del', onclick: () => delBody(b) }, '删除')
    )
  );
}

function openBodyForm(b){
  NPC.modal({
    title: b ? '编辑打卡' : '今日打卡',
    body: `
      <div class="form-field"><label>日期</label><input type="date" id="f-date" value="${b?.date||NPC.today()}"/></div>
      <div class="form-field"><label>晨起体重(kg)</label><input type="number" id="f-weight" value="${b?.weight||''}" min="0" step="0.1"/></div>
      <div class="form-field" style="display:flex;gap:8px"><div style="flex:1"><label>身高(cm)</label><input type="number" id="f-height" value="${b?.height||''}"/></div><div style="flex:1"><label>腰围(cm)</label><input type="number" id="f-waist" value="${b?.waist||''}"/></div><div style="flex:1"><label>腹围(cm)</label><input type="number" id="f-belly" value="${b?.belly||''}"/></div></div>
      <div class="form-field" style="display:flex;gap:8px"><div style="flex:1"><label>饮水量(ml)</label><input type="number" id="f-water" value="${b?.water||''}"/></div><div style="flex:1"><label>睡眠(h)</label><input type="number" id="f-sleep" value="${b?.sleep||''}" step="0.1"/></div><div style="flex:1"><label>步数</label><input type="number" id="f-steps" value="${b?.steps||''}"/></div></div>
      <div class="form-field"><label>身体感受</label><input type="text" id="f-feel" value="${b?.feeling||''}" maxlength="60"/></div>
      <div class="form-field"><label>饮食备注</label><textarea id="f-diet">${b?.diet||''}</textarea></div>
    `,
    onConfirm: async (box) => {
      const payload = {
        date: box.querySelector('#f-date').value,
        weight: parseFloat(box.querySelector('#f-weight').value) || null,
        height: parseFloat(box.querySelector('#f-height').value) || null,
        waist:  parseFloat(box.querySelector('#f-waist').value)  || null,
        belly:  parseFloat(box.querySelector('#f-belly').value)  || null,
        water:  parseFloat(box.querySelector('#f-water').value)  || null,
        sleep:  parseFloat(box.querySelector('#f-sleep').value)  || null,
        steps:  parseInt(box.querySelector('#f-steps').value)   || null,
        feeling: box.querySelector('#f-feel').value.trim(),
        diet:   box.querySelector('#f-diet').value.trim()
      };
      if (b) await repo('body').update(b.id, payload);
      else await repo('body').add(payload);
      NPC.toast('已保存');
      NPC.closeModal();
      refreshBodyList();
    }
  });
}
function delBody(b){
  NPC.confirmDialog('删除打卡', `删除 ${NPC.fmtDate(b.date,'md')} 的打卡?`, async () => {
    await repo('body').remove(b.id);
    NPC.toast('已删除');
    refreshBodyList();
  });
}

/* ============================================================
   健身 fitness
   ============================================================ */
async function renderFitness(){
  const header = NPC.el('div', { class:'page-header' },
    NPC.el('div', null,
      NPC.el('h1', null, '🏋️ 健身训练'),
      NPC.el('div', { class:'greet' }, '记录每一次挥洒的汗水')
    ),
    NPC.el('button', { class:'btn-primary', id:'btn-add-fit' }, '＋ 新增训练')
  );
  const monthStat = NPC.el('div', { class:'card tip', id:'fit-stat' });
  const favs = NPC.el('div', { class:'card', id:'fit-favs' });
  const list = NPC.el('div', { id:'fit-list' });
  return [header, monthStat, favs, list];
}
function bindFitness(){
  document.getElementById('btn-add-fit').addEventListener('click', () => openFitForm());
  refreshFitList();
}
async function refreshFitList(){
  const all = await repo('fitness').list('date desc');
  const monthK = NPC.monthKey(new Date());
  const monthF = all.filter(f => NPC.monthKey(f.date||'') === monthK);
  const done = monthF.filter(f => f.completed).length;
  document.getElementById('fit-stat').innerHTML = '';
  document.getElementById('fit-stat').append(
    NPC.el('h2', null, '本月训练'),
    NPC.el('div', { style:{display:'flex', alignItems:'center', gap:'14px'} },
      NPC.el('div', { style:{fontSize:'28px', fontWeight:700, color:'var(--accent)'} }, monthF.length+' 次'),
      NPC.el('div', { style:{fontSize:'12px', color:'var(--mute)'} }, `完成 ${done} 次 · 总时长约 ${monthF.reduce((s,f)=>s+Number(f.duration||0),0)} 分钟`)
    )
  );
  // 常用项目
  const favCard = document.getElementById('fit-favs');
  favCard.innerHTML = '';
  const projects = [...new Set(all.map(f => f.project).filter(Boolean))].slice(0,8);
  favCard.append(NPC.el('h2', null, '⭐ 常用项目(快速填入)'));
  if (projects.length){
    favCard.append(NPC.el('div', null,
      ...projects.map(p => NPC.el('button', { class:'btn-ghost', style:{marginRight:'6px', marginBottom:'6px'}, onclick: () => openFitForm({ project: p }) }, p))
    ));
  } else {
    favCard.append(NPC.el('div', { class:'greet' }, '还没有常用项目,新增训练后会自动出现在这里'));
  }

  const list = document.getElementById('fit-list');
  list.innerHTML = '';
  if (!all.length){
    list.append(NPC.el('div', { class:'empty' }, '🏋️', '开始今天的第一组训练'));
  } else {
    const wrap = NPC.el('div', { class:'card' },
      NPC.el('h2', null, `训练记录 (${all.length})`));
    const inner = NPC.el('div');
    all.forEach(f => inner.append(fitRow(f)));
    wrap.append(inner);
    list.append(wrap);
  }
}

function fitRow(f){
  return NPC.el('div', { class:'list-item' + (f.completed?' done':''), 'data-id':f.id },
    NPC.el('div', { style:{fontSize:'20px'} }, '🏋️'),
    NPC.el('div', { style:{flex:'1'} },
      NPC.el('div', { class:'title' }, f.project||'未命名项目'),
      NPC.el('div', { class:'sub' }, `${NPC.fmtDate(f.date,'md')} · ${f.sets||0)}组 · 共${(f.reps||0)*(f.sets||0)}次 · ${f.weight?f.weight+'kg · ':''}${f.duration?f.duration+'分钟':''}${f.feeling?' · '+f.feeling:''}`)
    ),
    NPC.el('div', { class:'row-actions' },
      NPC.el('button', { onclick: () => openFitForm(f) }, '编辑'),
      NPC.el('button', { class:'del', onclick: () => delFit(f) }, '删除')
    )
  );
}

function openFitForm(f){
  NPC.modal({
    title: f?.id ? '编辑训练' : '新增训练',
    body: `
      <div class="form-field"><label>训练日期</label><input type="date" id="f-date" value="${f?.date||NPC.today()}"/></div>
      <div class="form-field"><label>项目名称</label><input type="text" id="f-proj" value="${f?.project||''}" maxlength="40"/></div>
      <div class="form-field" style="display:flex;gap:8px"><div style="flex:1"><label>组数</label><input type="number" id="f-sets" value="${f?.sets||''}" min="0"/></div><div style="flex:1"><label>每组次数</label><input type="number" id="f-reps" value="${f?.reps||''}" min="0"/></div><div style="flex:1"><label>负重(kg)</label><input type="number" id="f-weight" value="${f?.weight||''}" step="0.5"/></div></div>
      <div class="form-field"><label>训练时长(分钟)</label><input type="number" id="f-dur" value="${f?.duration||''}" min="0"/></div>
      <div class="form-field check-row"><input type="checkbox" id="f-done" ${f?.completed?'checked':''}/><label for="f-done" style="margin:0">已完成</label></div>
      <div class="form-field"><label>训练感受</label><textarea id="f-feel">${f?.feeling||''}</textarea></div>
    `,
    onConfirm: async (box) => {
      const project = box.querySelector('#f-proj').value.trim();
      if (!project) return NPC.toast('请填项目名称');
      const payload = {
        date: box.querySelector('#f-date').value,
        project,
        sets: parseInt(box.querySelector('#f-sets').value)||0,
        reps: parseInt(box.querySelector('#f-reps').value)||0,
        weight: parseFloat(box.querySelector('#f-weight').value)||0,
        duration: parseInt(box.querySelector('#f-dur').value)||0,
        completed: box.querySelector('#f-done').checked,
        feeling: box.querySelector('#f-feel').value.trim()
      };
      if (f?.id) await repo('fitness').update(f.id, payload);
      else await repo('fitness').add(payload);
      NPC.toast('已保存');
      NPC.closeModal();
      refreshFitList();
    }
  });
}
function delFit(f){
  NPC.confirmDialog('删除训练', `确定删除「${f.project}」吗?`, async () => {
    await repo('fitness').remove(f.id);
    NPC.toast('已删除');
    refreshFitList();
  });
}

/* ============================================================
   日记 notes
   ============================================================ */
async function renderNotes(){
  const header = NPC.el('div', { class:'page-header' },
    NPC.el('div', null,
      NPC.el('h1', null, '📔 随笔日记'),
      NPC.el('div', { class:'greet' }, '把每个珍贵的今天都留下来')
    ),
    NPC.el('button', { class:'btn-primary', id:'btn-add-note' }, '＋ 写一篇')
  );
  const nav = NPC.el('div', { style:{display:'flex', gap:'8px', marginBottom:'14px'} },
    NPC.el('button', { class:'btn-ghost', id:'note-prev' }, '← 前一天'),
    NPC.el('input', { type:'date', id:'note-date', value: NPC.today(), style:{padding:'8px', borderRadius:'10px', border:'1.5px solid var(--line)', background:'var(--bg)', flex:'1'} }),
    NPC.el('button', { class:'btn-ghost', id:'note-next' }, '后一天 →')
  );
  const list = NPC.el('div', { id:'note-list' });
  return [header, nav, list];
}
function bindNotes(){
  document.getElementById('btn-add-note').addEventListener('click', () => openNoteForm());
  document.getElementById('note-date').addEventListener('change', refreshNoteList);
  document.getElementById('note-prev').addEventListener('click', () => shiftDate(-1));
  document.getElementById('note-next').addEventListener('click', () => shiftDate(1));
  refreshNoteList();
}
function shiftDate(d){
  const el = document.getElementById('note-date');
  const dt = new Date(el.value);
  dt.setDate(dt.getDate() + d);
  el.value = NPC.fmtDate(dt,'ymd');
  refreshNoteList();
}
async function refreshNoteList(){
  const all = await repo('notes').list('date desc');
  const target = document.getElementById('note-list');
  target.innerHTML = '';
  const sel = document.getElementById('note-date').value;
  const day = all.filter(n => n.date === sel);
  const moodEmoji = {happy:'😊',sad:'😢',calm:'😌',angry:'😠',love:'🥰',tired:'😴'};
  if (day.length){
    const wrap = NPC.el('div', { class:'card' },
      NPC.el('h2', null, NPC.fmtDate(sel,'cn')));
    day.forEach(n => {
      wrap.append(NPC.el('div', { class:'card tip', style:{marginBottom:'10px'} },
        NPC.el('div', { style:{display:'flex', justifyContent:'space-between'} },
          NPC.el('div', { class:'title' }, n.title||'(无标题)'),
          NPC.el('div', { style:{fontSize:'20px'} }, moodEmoji[n.mood] || '🌿')
        ),
        NPC.el('div', { style:{marginTop:'6px', whiteSpace:'pre-wrap', fontSize:'13px'} }, n.content),
        NPC.el('div', { class:'row-actions', style:{marginTop:'10px'} },
          NPC.el('button', { onclick: () => openNoteForm(n) }, '编辑'),
          NPC.el('button', { class:'del', onclick: () => delNote(n) }, '删除')
        )
      ));
    });
    target.append(wrap);
  } else {
    target.append(NPC.el('div', { class:'empty' }, '📔', '这天还没有日记'));
  }
  // 历史最近几条
  const recent = all.filter(n => n.date !== sel).slice(0,5);
  if (recent.length){
    const wrap = NPC.el('div', { class:'card' },
      NPC.el('h2', null, '📚 最近日记'));
    recent.forEach(n => {
      wrap.append(NPC.el('div', { class:'list-item', onclick: () => { document.getElementById('note-date').value=n.date; refreshNoteList(); }, style:{cursor:'pointer'} },
        NPC.el('div', { style:{fontSize:'18px'} }, moodEmoji[n.mood] || '📔'),
        NPC.el('div', { style:{flex:'1'} },
          NPC.el('div', { class:'title' }, n.title||'(无标题)'),
          NPC.el('div', { class:'sub' }, NPC.fmtDate(n.date,'md') + ' · ' + (n.content||'').slice(0,40) + (n.content && n.content.length>40 ? '...' : ''))
        )
      ));
    });
    target.append(wrap);
  }
}

function openNoteForm(n){
  NPC.modal({
    title: n ? '编辑日记' : '写一篇新日记',
    body: `
      <div class="form-field"><label>日期</label><input type="date" id="f-date" value="${n?.date||NPC.today()}"/></div>
      <div class="form-field"><label>标题</label><input type="text" id="f-title" value="${n?.title||''}" maxlength="60"/></div>
      <div class="form-field"><label>心情</label><select id="f-mood">
        <option value="happy" ${n?.mood==='happy'?'selected':''}>😊 开心</option>
        <option value="calm" ${n?.mood==='calm'?'selected':''}>😌 平静</option>
        <option value="love" ${n?.mood==='love'?'selected':''}>🥰 幸福</option>
        <option value="tired" ${n?.mood==='tired'?'selected':''}>😴 疲惫</option>
        <option value="sad" ${n?.mood==='sad'?'selected':''}>😢 难过</option>
        <option value="angry" ${n?.mood==='angry'?'selected':''}>😠 烦躁</option>
      </select></div>
      <div class="form-field"><label>正文</label><textarea id="f-content" rows="8" style="min-height:160px">${n?.content||''}</textarea></div>
    `,
    onConfirm: async (box) => {
      const title = box.querySelector('#f-title').value.trim();
      const content = box.querySelector('#f-content').value.trim();
      if (!content) return NPC.toast('写点什么吧');
      const payload = {
        date: box.querySelector('#f-date').value,
        title,
        content,
        mood: box.querySelector('#f-mood').value
      };
      if (n) await repo('notes').update(n.id, payload);
      else await repo('notes').add(payload);
      NPC.toast('已保存');
      NPC.closeModal();
      refreshNoteList();
    }
  });
}
function delNote(n){
  NPC.confirmDialog('删除日记', '确定删除这篇日记吗?', async () => {
    await repo('notes').remove(n.id);
    NPC.toast('已删除');
    refreshNoteList();
  });
}

/* ============================================================
   设置页 settings
   ============================================================ */
async function renderSettings(){
  const header = NPC.el('div', { class:'page-header' },
    NPC.el('h1', null, '⚙️ 设置'),
  );
  const profile = await getProfile();
  const prefs = NPC.Pref;
  // 1. 个人资料
  const sec1 = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '👤 个人资料'),
    NPC.el('div', { class:'form-field' }, NPC.el('label', null, '昵称'),
      NPC.el('input', { id:'st-nick', type:'text', value: profile.nickname||'', placeholder:'给自己起个名字吧' })
    ),
    NPC.el('div', { class:'form-field', style:'display:flex;gap:8px' },
      NPC.el('div', { style:'flex:1' }, NPC.el('label', null, '身高 (cm)'),
        NPC.el('input', { id:'st-h', type:'number', value: profile.height||'', step:'0.1' })),
      NPC.el('div', { style:'flex:1' }, NPC.el('label', null, '初始体重 (kg)'),
        NPC.el('input', { id:'st-iw', type:'number', value: profile.initial_weight||'', step:'0.1' })),
      NPC.el('div', { style:'flex:1' }, NPC.el('label', null, '目标体重 (kg)'),
        NPC.el('input', { id:'st-tw', type:'number', value: profile.target_weight||'', step:'0.1' }))
    ),
    NPC.el('div', { class:'form-field', style:'display:flex;gap:8px' },
      NPC.el('div', { style:'flex:1' }, NPC.el('label', null, '每日饮水目标 (ml)'),
        NPC.el('input', { id:'st-water', type:'number', value: profile.water_goal||2000 })),
      NPC.el('div', { style:'flex:1' }, NPC.el('label', null, '每日睡眠目标 (h)'),
        NPC.el('input', { id:'st-sleep', type:'number', value: profile.sleep_goal||8, step:'0.1' }))
    ),
    NPC.el('button', { class:'btn-primary', onclick: saveProfile }, '保存资料')
  );

  // 2. 主题
  const themes = [['cream','默认奶油绿'],['minimal','浅色极简'],['pink','温柔粉'],['dark','暗夜深色']];
  const sec2 = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '🎨 外观主题'),
    NPC.el('div', { style:'display:flex; gap:10px; flex-wrap:wrap' },
      ...themes.map(([k,v]) => NPC.el('button', {
        class: prefs.get('theme','cream')===k ? 'btn-primary' : 'btn-ghost',
        onclick: () => { prefs.set('theme', k); renderShell(); }
      }, v))
    )
  );

  // 3. 首页布局
  const layout = prefs.get('homeLayout', {todayTodos:true, todayEvents:true, monthStats:true, savings:true});
  function toggleLayout(key){
    layout[key] = !layout[key];
    prefs.set('homeLayout', layout);
    NPC.toast('已切换');
  }
  const sec3 = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '🏠 首页布局自定义'),
    NPC.el('div', { class:'greet', style:{marginBottom:'10px'} }, '勾选决定总览页显示哪些卡片:'),
    ...[
      ['todayTodos','今日待办卡片'],
      ['todayEvents','今日日程卡片'],
      ['monthStats','月度统计卡片'],
      ['savings','储蓄进度区域']
    ].map(([k,v]) => NPC.el('div', { class:'field-row', style:{padding:'8px 0'} },
      NPC.el('div', { style:{flex:'1'} }, v),
      NPC.el('div', { class:'switch' + (layout[k]?' on':''), onclick(e){ toggleLayout(k); e.currentTarget.classList.toggle('on'); } })
    ))
  );

  // 4. 提醒开关(本地保存,展示用)
  const reminders = prefs.get('reminders', {plan:false, todo:true, event:true, water:false, sleep:false, fitness:false, tx:false});
  function updRem(k){ reminders[k] = !reminders[k]; prefs.set('reminders', reminders); }
  const sec4 = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '🔔 提醒开关'),
    NPC.el('div', { class:'greet', style:{marginBottom:'10px'} }, '默认浏览器通知;真机建议配合第三方通知 App 使用。'),
    ...[['plan','计划提醒'],['todo','待办到期'],['event','日程提醒'],['water','饮水打卡'],['sleep','睡眠打卡'],['fitness','健身提醒'],['tx','记账提醒']].map(([k,v]) => NPC.el('div', { class:'field-row', style:{padding:'8px 0'} },
      NPC.el('div', { style:{flex:'1'} }, v),
      NPC.el('div', { class:'switch' + (reminders[k]?' on':''), onclick(e){ updRem(k); e.currentTarget.classList.toggle('on'); } })
    ))
  );

  // 5. 数据管理(重点)
  const sec5 = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '💾 数据管理'),
    NPC.el('div', { style:'display:flex', gap:'10px', flexWrap:'wrap', marginBottom:'14px' },
      NPC.el('button', { class:'btn-primary', onclick: doExport }, '📤 导出全部数据(JSON)'),
      NPC.el('button', { class:'btn-ghost', onclick: () => document.getElementById('imp-file').click() }, '📥 导入备份'),
      NPC.el('input', { type:'file', accept:'.json', id:'imp-file', style:{display:'none'}, onchange: doImport })
    ),
    NPC.el('div', { style:'display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'14px' },
      NPC.el('button', { class:'btn-ghost', onclick: () => doClearMonth('plans') }, '清空本月计划'),
      NPC.el('button', { class:'btn-ghost', onclick: () => doClearMonth('transactions') }, '清空本月记账'),
      NPC.el('button', { class:'btn-ghost', onclick: () => doClearMonth('fitness') }, '清空本月健身'),
      NPC.el('button', { class:'btn-ghost', onclick: () => doClearMonth('notes') }, '清空本月日记')
    ),
    NPC.el('div', { style:'display:flex; gap:'10px'; flex-wrap:wrap', marginBottom:'14px' },
      NPC.el('button', { class:'btn-ghost', onclick: () => doClearAll('transactions') }, '清空所有记账'),
      NPC.el('button', { class:'btn-ghost', onclick: () => doClearAll('fitness') }, '清空所有健身'),
      NPC.el('button', { class:'btn-ghost', onclick: () => doClearAll('notes') }, '清空所有日记')
    ),
    NPC.el('div', { style:'display:flex; gap:'10px'; flexWrap:'wrap', marginBottom:'14px' },
      NPC.el('button', { class:'btn-ghost', onclick: doRefreshCache }, '🔄 清除本地缓存并重拉'),
      NPC.el('button', { class:'btn-danger', onclick: doResetAll }, '⚠️ 全部重置(清空所有业务数据)'),
      NPC.el('button', { class:'btn-danger', onclick: doDeleteAccount }, '🗑 永久注销账号(不可恢复)')
    )
  );

  // 6. 通用偏好
  const p = NPC.Pref.get('prefs', { dateFmt:'cn', timeFmt:'24', currency:'¥', weight:'kg' });
  const sec6 = NPC.el('div', { class:'card' },
    NPC.el('h2', null, '🔧 通用偏好'),
    NPC.el('div', { class:'form-field' }, NPC.el('label', null, '日期格式'),
      NPC.el('select', { id:'pf-date' },
        NPC.el('option', { value:'cn', selected: p.dateFmt==='cn' }, '2026年08月08日'),
        NPC.el('option', { value:'ymd', selected: p.dateFmt==='ymd' }, '2026-08-08'),
        NPC.el('option', { value:'md', selected: p.dateFmt==='md' }, '08/08')
      )
    ),
    NPC.el('div', { class:'form-field' }, NPC.el('label', null, '时间'),
      NPC.el('select', { id:'pf-time' },
        NPC.el('option', { value:'24', selected: p.timeFmt==='24' }, '24 小时制'),
        NPC.el('option', { value:'12', selected: p.timeFmt==='12' }, '12 小时制')
      )
    ),
    NPC.el('div', { class:'form-field' }, NPC.el('label', null, '货币单位'),
      NPC.el('select', { id:'pf-cur' },
        NPC.el('option', { selected: p.currency==='¥' }, '¥ CNY 人民币'),
        NPC.el('option', { selected: p.currency==='$' }, '$ USD 美元'),
        NPC.el('option', { selected: p.currency==='€' }, '€ EUR 欧元'),
        NPC.el('option', { selected: p.currency==='£' }, '£ GBP 英镑')
      )
    ),
    NPC.el('div', { class:'form-field' }, NPC.el('label', null, '体重单位'),
      NPC.el('select', { id:'pf-w' },
        NPC.el('option', { selected: p.weight==='kg' }, 'kg 公斤'),
        NPC.el('option', { selected: p.weight==='lb' }, 'lb 磅')
      )
    ),
    NPC.el('div', { class:'greet' }, '🔒 隐私说明:所有数据只保存在你自己的 Supabase 账号下,不同账号严格隔离,开发者无法读取。')
  );

  // 7. 登出
  const sec7 = NPC.el('div', { class:'card' },
    NPC.el('button', { class:'btn-ghost', onclick: doLogout }, '🚪 退出登录')
  );

  return [header, sec1, sec2, sec3, sec4, sec5, sec6, sec7];
}

async function getProfile(){
  const s = await getClient();
  const { data } = await s.from('profile').select('*').maybeSingle();
  return data || {};
}
async function saveProfile(){
  const nick = document.getElementById('st-nick').value.trim();
  const payload = {
    nickname: nick,
    height:    parseFloat(document.getElementById('st-h').value) || null,
    initial_weight: parseFloat(document.getElementById('st-iw').value) || null,
    target_weight:  parseFloat(document.getElementById('st-tw').value) || null,
    water_goal: parseFloat(document.getElementById('st-water').value) || 2000,
    sleep_goal: parseFloat(document.getElementById('st-sleep').value) || 8
  };
  const s = await getClient();
  const { data: u } = await s.auth.getUser();
  if (u?.user?.id) payload.user_id = u.user.id;
  const { error } = await s.from('profile').upsert(payload, { onConflict: 'user_id' });
  if (error) NPC.toast('保存失败:' + error.message);
  else NPC.toast('资料已保存 ✓');
}

function bindSettings(){
  // 保存偏好
  ['pf-date','pf-time','pf-cur','pf-w'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      const prefs = NPC.Pref.get('prefs', {});
      prefs.dateFmt = document.getElementById('pf-date').value;
      prefs.timeFmt = document.getElementById('pf-time').value;
      prefs.currency = document.getElementById('pf-cur').value;
      prefs.weight = document.getElementById('pf-w').value;
      NPC.Pref.set('prefs', prefs);
      NPC.toast('已保存偏好');
    });
  });
}

/* 数据管理 actions */
async function doExport(){
  try {
    const s = await getClient();
    const tables = ['plans','todos','events','transactions','savings','body','fitness','notes','profile'];
    const dump = { _exportedAt: new Date().toISOString() };
    for (const t of tables){
      const { data } = await s.from(t).select('*');
      dump[t] = data || [];
    }
    NPC.download(`npc-backup-${NPC.today()}.json`, JSON.stringify(dump, null, 2));
    NPC.toast('导出成功 ✓');
  } catch(e){
    NPC.toast('导出失败:' + e.message);
  }
}

async function doImport(ev){
  const file = ev.target.files[0];
  if (!file) return;
  NPC.confirmDialog('导入备份', '导入会写入(可能覆盖)现有记录,确定继续吗?', async () => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const s = await getClient();
      const tables = ['plans','todos','events','transactions','savings','body','fitness','notes','profile'];
      const { data: u } = await s.auth.getUser();
      const uid = u?.user?.id;
      for (const t of tables){
        if (!data[t] || !data[t].length) continue;
        const rows = data[t].map(r => ({ ...r, user_id: uid }));
        // 删后插
        await s.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (rows.length) await s.from(t).insert(rows);
      }
      NPC.toast('导入成功 ✓');
      renderShell();
    } catch(e){
      NPC.toast('导入失败:' + e.message);
    }
  }, { okText: '开始导入' });
}

async function doClearMonth(t){
  const label = {plans:'本月计划',transactions:'本月记账',fitness:'本月健身',notes:'本月日记'}[t];
  NPC.confirmDialog(`清空${label}`, `确定清空${label}吗?此操作不可恢复。`, async () => {
    const s = await getClient();
    const first = NPC.firstOfMonth();
    const last  = NPC.lastOfMonth();
    const { data: u } = await s.auth.getUser();
    const uid = u?.user?.id;
    const dateCol = t==='transactions' ? 'date' : t==='plans' ? 'date' : t==='fitness' ? 'date' : 'date';
    const { error } = await s.from(t).delete().eq('user_id', uid).gte(dateCol, NPC.fmtDate(first,'ymd')).lte(dateCol, NPC.fmtDate(last,'ymd'));
    if (error) NPC.toast('清空失败:' + error.message);
    else { NPC.toast('已清空 ✓'); renderShell(); }
  }, { okText: '清空' });
}

async function doClearAll(t){
  const label = {transactions:'所有记账',fitness:'所有健身',notes:'所有日记'}[t];
  NPC.confirmDialog(`清空${label}`, `确定清空账号下所有${label}吗?此操作不可恢复。`, async () => {
    const { error } = await repo(t).clearWhere('user_id');
    if (error) NPC.toast('清空失败:' + error.message);
    else { NPC.toast('已清空 ✓'); renderShell(); }
  }, { okText: '清空全部' });
}

async function doRefreshCache(){
  NPC.Pref.del('cache');
  Object.keys(localStorage).filter(k => k.startsWith('npc.cache.')).forEach(k => localStorage.removeItem(k));
  NPC.toast('本地缓存已清除,刷新页面重新拉取数据');
}

async function doResetAll(){
  NPC.confirmDialog('全部重置', '将清空账号下所有业务记录(保留账号本身),此操作不可恢复!', async () => {
    const tables = ['plans','todos','events','transactions','savings','body','fitness','notes'];
    for (const t of tables){
      try { await repo(t).clearWhere('user_id'); } catch(e){}
    }
    NPC.toast('已重置 ✓');
    renderShell();
  }, { okText: '确认重置' });
}

async function doDeleteAccount(){
  NPC.confirmDialog('注销账号',
    '此操作将永久删除账号及所有数据,无法恢复!你需要重新注册才能使用。',
    async () => {
      try {
        const s = await getClient();
        // 先删业务数据(防止残留)
        const tables = ['plans','todos','events','transactions','savings','body','fitness','notes','profile'];
        for (const t of tables){
          try { await s.from(t).delete().neq('user_id', '__noop__'); } catch(e){}
        }
        // 调用 signOut 至少把会话清掉
        await s.auth.signOut();
        // 真实删除账号需要 edge function 或后端,见部署文档
        NPC.toast('会话已退出,如需彻底删除请联系管理员');
      } finally {
        window.location.reload();
      }
    },
    { okText: '我已了解风险,确认注销' }
  );
}

async function doLogout(){
  const s = await getClient();
  await s.auth.signOut();
  window.location.reload();
}

/* ============================================================
   全局事件
   ============================================================ */
window.addEventListener('npc-open', e => {
  const k = e.detail.kind;
  if (k === 'plans') openPlanForm();
  if (k === 'todos') openTodoForm();
  if (k === 'events') openEventForm();
  if (k === 'transactions') openTransactionForm(null,'expense');
  if (k === 'body') openBodyForm();
  if (k === 'fitness') openFitForm();
});

// 弹窗中下拉列表后，需要重新绑定 todo toggle
document.addEventListener('npc-todo-rebind', bindTodoToggles);

window.NPC_APP = { renderShell, bindTodoToggles, bindPlanRowToggle };

})();
