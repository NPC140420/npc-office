import { db, currentUser, todayStr, ymFromDate } from '../db.js';
import { signOut, deleteAccount } from '../auth.js';
import { openModal, toast, escape, buildForm, formToObject, confirm, navigate } from '../ui.js';

const THEMES = [
  { key:'cream',   label:'奶油绿', desc:'默认治愈主题' },
  { key:'minimal', label:'浅色极简' },
  { key:'pink',    label:'温柔粉' },
  { key:'dark',    label:'暗夜深色' },
];

const LAYOUT_OPTS = [
  { key:'show_today_todos', label:'今日待办列表' },
  { key:'show_today_events', label:'今日日程清单' },
  { key:'show_monthly_stats', label:'月度综合统计卡' },
  { key:'show_savings_progress', label:'储蓄进度卡' },
  { key:'show_quick_actions', label:'首页快捷操作区' },
];

const REMINDER_OPTS = [
  { key:'plan', label:'计划提醒' },
  { key:'todo', label:'待办到期提醒' },
  { key:'event', label:'日程提醒' },
  { key:'water', label:'饮水打卡提醒' },
  { key:'sleep', label:'睡眠打卡提醒' },
  { key:'fitness', label:'健身提醒' },
  { key:'finance', label:'记账提醒' },
];

const PROFILE_FIELDS = [
  { name:'nickname', label:'昵称' },
  { name:'avatar_url', label:'头像 URL（可填图片链接）' },
  { name:'height', label:'身高 (cm)', type:'number' },
  { name:'initial_weight', label:'初始体重 (kg)', type:'number', step:'0.1' },
  { name:'target_weight', label:'目标体重 (kg)', type:'number', step:'0.1' },
  { name:'daily_water_target', label:'每日饮水目标 (ml)', type:'number' },
  { name:'daily_sleep_target', label:'每日睡眠目标 (h)', type:'number', step:'0.1' },
];

const PREF_FIELDS = [
  { name:'date_format', label:'日期格式', type:'select', options:[
    {value:'YYYY-MM-DD',label:'YYYY-MM-DD'},{value:'DD/MM/YYYY',label:'DD/MM/YYYY'},{value:'MM/DD/YYYY',label:'MM/DD/YYYY'}
  ]},
  { name:'hour_format', label:'时间制', type:'select', options:[{value:'24',label:'24小时'},{value:'12',label:'12小时'}] },
  { name:'currency', label:'货币单位' },
  { name:'weight_unit', label:'体重单位', type:'select', options:[{value:'kg',label:'kg'},{value:'lb',label:'lb'}] },
];

export async function render(root){
  const me = await currentUser();
  let profile = await db.profiles.get(me.id) || {};

  function applyTheme(t){
    document.body.classList.remove('theme-cream','theme-minimal','theme-pink','theme-dark');
    document.body.classList.add(`theme-${t||'cream'}`);
  }
  applyTheme(profile.theme);

  async function refresh(){
    profile = (await db.profiles.get(me.id)) || {};
    applyTheme(profile.theme);
    const layout = profile.layout_options || {};
    const reminder = profile.reminder_options || {};
    const pref = profile.preferences || {};

    root.innerHTML = `
      <div class="page-header"><div class="page-title">设置 <small>管理个人偏好与数据</small></div></div>

      <!-- 1. 个人资料 -->
      <div class="card">
        <div class="card-title">👤 个人资料</div>
        <div style="display:flex;gap:12px;align-items:center">
          <img src="${escape(profile.avatar_url||'')}" onerror="this.style.background='var(--tip)';this.src=''" style="width:56px;height:56px;border-radius:50%;background:var(--tip);object-fit:cover;border:1px solid var(--border)"/>
          <div>
            <div style="font-weight:600">${escape(profile.nickname||'未设置昵称')}</div>
            <div style="font-size:12px;color:var(--text-soft)">${me.email}</div>
          </div>
        </div>
        <button class="btn block" id="editProfile" style="margin-top:10px">编辑资料</button>
      </div>

      <!-- 2. 外观主题 -->
      <div class="card">
        <div class="card-title">🎨 外观主题</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px" id="themeGrid">
          ${THEMES.map(t => `<button data-theme="${t.key}" class="btn ${profile.theme===t.key?'':'ghost'}">${t.label}${t.desc?'<br><small style="font-size:10px;opacity:.8">'+t.desc+'</small>':''}</button>`).join('')}
        </div>
      </div>

      <!-- 3. 首页布局 -->
      <div class="card">
        <div class="card-title">🧱 首页布局自定义</div>
        ${LAYOUT_OPTS.map(o => `<label style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border)"><span>${o.label}</span><input type="checkbox" data-layout="${o.key}" ${layout[o.key]!==false?'checked':''}/></label>`).join('')}
      </div>

      <!-- 4. 提醒开关 -->
      <div class="card">
        <div class="card-title">🔔 提醒开关</div>
        ${REMINDER_OPTS.map(o => `<label style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed var(--border)"><span>${o.label}</span><input type="checkbox" data-rem="${o.key}" ${reminder[o.key]!==false?'checked':''}/></label>`).join('')}
      </div>

      <!-- 5. 通用偏好 -->
      <div class="card">
        <div class="card-title">⚙️ 通用偏好</div>
        <button class="btn block" id="editPref">日期格式 / 时间制 / 货币 / 体重单位</button>
      </div>

      <!-- 6. 数据管理（重点） -->
      <div class="card tip">
        <div class="card-title">🗄️ 数据管理</div>

        <button class="btn block" id="exportAll" style="margin-bottom:8px">📤 导出全部数据 (JSON)</button>

        <label class="btn block ghost" style="cursor:pointer">
          📥 导入备份（选择本地 JSON 文件）
          <input type="file" id="importFile" accept="application/json" style="display:none"/>
        </label>

        <div style="margin:10px 0 6px;font-size:12px;color:var(--text-soft)">分项清空：</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <button class="btn ghost" data-clear="month">清空本月记录</button>
          <button class="btn ghost" data-clear="transactions">清空记账记录</button>
          <button class="btn ghost" data-clear="fitness">清空健身打卡</button>
          <button class="btn ghost" data-clear="notes">清空日记</button>
        </div>

        <div style="border-top:1px dashed var(--border);margin:14px 0"></div>

        <button class="btn block" data-reset="all" style="margin-bottom:8px">⚠️ 全部重置（保留账号）</button>
        <button class="btn block ghost" id="clearCache">🔄 清除本地缓存，重新拉取云端</button>

        <div style="border-top:1px dashed var(--border);margin:14px 0"></div>

        <button class="btn block danger" id="logoutBtn">退出登录</button>
        <button class="btn block danger" id="delAccount" style="margin-top:8px">💀 永久注销账号（不可恢复）</button>
      </div>

      <div style="text-align:center;color:var(--text-soft);font-size:11px;padding:14px">NPC办事处 · PWA · 私人工作台</div>
    `;

    // 主题
    root.querySelectorAll('[data-theme]').forEach(b => b.addEventListener('click', async () => {
      const t = b.dataset.theme;
      applyTheme(t);
      await db.profiles.update(me.id, { theme: t });
      profile.theme = t;
      refresh();
    }));

    // 布局
    root.querySelectorAll('[data-layout]').forEach(cb => cb.addEventListener('change', async () => {
      const next = { ...(profile.layout_options||{}) };
      next[cb.dataset.layout] = cb.checked;
      await db.profiles.update(me.id, { layout_options: next });
      profile.layout_options = next;
      toast('已保存');
    }));

    // 提醒
    root.querySelectorAll('[data-rem]').forEach(cb => cb.addEventListener('change', async () => {
      const next = { ...(profile.reminder_options||{}) };
      next[cb.dataset.rem] = cb.checked;
      await db.profiles.update(me.id, { reminder_options: next });
      profile.reminder_options = next;
      toast('已保存');
    }));

    // 资料编辑
    root.querySelector('#editProfile').addEventListener('click', () => editFields('编辑个人资料', PROFILE_FIELDS, profile, async (data) => {
      await db.profiles.update(me.id, data); profile = { ...profile, ...data }; toast('已保存'); refresh();
    }));

    root.querySelector('#editPref').addEventListener('click', () => editFields('通用偏好', PREF_FIELDS, pref, async (data) => {
      const next = { ...(profile.preferences||{}), ...data };
      await db.profiles.update(me.id, { preferences: next });
      profile.preferences = next; toast('已保存'); refresh();
    }));

    // 导出
    root.querySelector('#exportAll').addEventListener('click', async () => {
      const tables = ['plans','todos','events','transactions','savings','body','fitness','fitness_favorites','notes'];
      const out = { exported_at: new Date().toISOString(), user: me.email, profile };
      for(const t of tables){ out[t] = await db[t].list(); }
      const blob = new Blob([JSON.stringify(out, null, 2)], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `npc-office-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('已导出全部数据');
    });

    // 导入
    root.querySelector('#importFile').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if(!file) return;
      const ok = await confirm({
        title:'导入备份',
        message:'导入会合并或覆盖现有记录，确定要继续吗？\n\n建议先导出当前数据作为备份。',
        okText:'导入', danger:true
      });
      if(!ok) return;
      try{
        const text = await file.text();
        const data = JSON.parse(text);
        // 简单策略：profiles 不动，业务表逐条 upsert
        for(const t of ['plans','todos','events','transactions','savings','body','fitness','fitness_favorites','notes']){
          const arr = data[t] || [];
          for(const row of arr){ const { id, created_at, updated_at, user_id, ...rest } = row; try{ await db[t].insert(rest); }catch(_){} }
        }
        toast('导入完成'); refresh();
      }catch(err){ toast('文件解析失败：'+err.message, true); }
    });

    // 分项清空
    root.querySelectorAll('[data-clear]').forEach(b => b.addEventListener('click', async () => {
      const k = b.dataset.clear;
      const MAP = {
        month: { tables: ['plans','todos','events','body','fitness','notes'], filter: r => ymFromDate(r.plan_date||r.due_date||r.start_date||r.check_date||r.train_date||r.note_date) === todayStr().slice(0,7) },
        transactions: { tables:['transactions'] },
        fitness: { tables:['fitness','fitness_favorites'] },
        notes: { tables:['notes'] },
      };
      const spec = MAP[k];
      if(!spec) return;
      if(!(await confirm({ title:'清空确认', message:'该操作不可撤销，确定要清空吗？', danger:true }))) return;
      for(const t of spec.tables){
        const list = await db[t].list();
        for(const r of list){
          if(spec.filter && !spec.filter(r)) continue;
          await db[t].remove(r.id);
        }
      }
      toast('已清空'); refresh();
    }));

    // 全部重置
    root.querySelector('[data-reset="all"]').addEventListener('click', async () => {
      if(!(await confirm({ title:'全部重置', message:'将清空当前账号下所有业务记录（账号本身保留）。\n\n是否继续？', danger:true, okText:'我明白，继续' }))) return;
      if(!(await confirm({ title:'二次确认', message:'再次确认：所有业务数据将被永久删除，无法恢复。', danger:true, okText:'确认重置' }))) return;
      for(const t of ['plans','todos','events','transactions','savings','body','fitness','fitness_favorites','notes']){
        await db[t].removeAll();
      }
      toast('已重置'); refresh();
    });

    // 清除本地缓存
    root.querySelector('#clearCache').addEventListener('click', async () => {
      try{ localStorage.clear(); sessionStorage.clear(); toast('本地缓存已清除，下次刷新会从云端拉取最新数据'); }
      catch(e){ toast('清理失败', true); }
    });

    // 退出登录
    root.querySelector('#logoutBtn').addEventListener('click', async () => {
      if(!(await confirm({ title:'退出登录', message:'确定要退出登录吗？' }))) return;
      await signOut(); location.hash = '#/login';
    });

    // 注销账号
    root.querySelector('#delAccount').addEventListener('click', async () => {
      if(!(await confirm({ title:'注销账号 ⚠️', message:'永久删除账号及其下所有数据，不可恢复。\n\n如未导出，请先在「数据管理」中导出备份。', danger:true, okText:'我已备份，继续' }))) return;
      if(!(await confirm({ title:'最终确认', message:'这是最后确认。\n输入"注销"在下一个弹窗中以继续。', danger:true, okText:'下一步' }))) return;
      const txt = prompt('请输入"注销"以确认');
      if(txt !== '注销'){ toast('已取消'); return; }
      try{
        await deleteAccount();
        toast('账号已注销');
        location.hash = '#/login';
      }catch(e){
        toast('注销失败：需要先在 Supabase 控制台创建 delete_my_account 函数（见部署文档）', true);
      }
    });
  }

  function editFields(title, fields, model, onSave){
    const form = buildForm(fields, model||{});
    const ok = document.createElement('button'); ok.className='btn'; ok.textContent='保存';
    const cancel = document.createElement('button'); cancel.className='btn ghost'; cancel.textContent='取消';
    const m = openModal({ title, body:form, footer:[cancel, ok] });
    ok.addEventListener('click', async () => {
      try{ await onSave(formToObject(form)); m._close(); }catch(e){ toast('保存失败', true); }
    });
    cancel.addEventListener('click', m._close);
  }

  refresh();
}
