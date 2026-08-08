/* =============================================================
   主入口 · 路由 + 鉴权 + 启动
   ============================================================= */
import { getSession, onAuthChange } from './auth.js';
import { renderNav, toast, escape } from './ui.js';
import { render as renderOverview }     from './modules/overview.js';
import { render as renderPlans }        from './modules/plans.js';
import { render as renderTodos }        from './modules/todos.js';
import { render as renderEvents }       from './modules/events.js';
import { render as renderTransactions } from './modules/transactions.js';
import { render as renderSavings }      from './modules/savings.js';
import { render as renderBody }         from './modules/body.js';
import { render as renderFitness }      from './modules/fitness.js';
import { render as renderNotes }        from './modules/notes.js';
import { render as renderSettings }     from './modules/settings.js';
import { signIn, signUp } from './auth.js';

const ROUTES = {
  '':           renderOverview,
  'overview':   renderOverview,
  'plans':      renderPlans,
  'todos':      renderTodos,
  'events':     renderEvents,
  'transactions': renderTransactions,
  'savings':    renderSavings,
  'body':       renderBody,
  'fitness':    renderFitness,
  'notes':      renderNotes,
  'settings':   renderSettings,
};

const root = document.getElementById('view');
const nav  = document.getElementById('bottom-nav');

function parseHash(){
  const h = location.hash.replace(/^#\/?/, '');
  return h || 'overview';
}

async function route(){
  const key = parseHash();
  if(key === 'login'){ showLogin(); return; }
  const sess = await getSession();
  if(!sess){ showLogin(); return; }
  renderNav(key);
  const view = ROUTES[key] || ROUTES['overview'];
  root.innerHTML = '<div class="empty">加载中...</div>';
  try{ await view(root); }
  catch(e){
    console.error(e);
    root.innerHTML = `<div class="card empty"><div class="icon">⚠️</div>${escape(e.message||'加载失败')}<br><br><button class="btn" onclick="location.reload()">刷新</button></div>`;
    toast('加载失败：'+e.message, true);
  }
}

function showLogin(){
  renderNav(null);
  nav.innerHTML = '';
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <h1>🌿 NPC办事处</h1>
        <div class="sub">私人综合生活管理工作台</div>
        <div class="auth-tabs">
          <button class="active" data-tab="login">登录</button>
          <button data-tab="signup">注册</button>
        </div>
        <form id="authForm">
          <div class="field"><label>邮箱</label><input class="input" type="email" name="email" required/></div>
          <div class="field"><label>密码（至少 6 位）</label><input class="input" type="password" name="password" required minlength="6"/></div>
          <button type="submit" class="btn block" id="submitBtn">登录</button>
        </form>
        <div style="text-align:center;font-size:11px;color:var(--text-soft);margin-top:14px">登录即代表同意《隐私说明》：所有数据严格隔离，仅本人可见。</div>
      </div>
    </div>`;

  let mode = 'login';
  root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.tab;
    root.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x===b));
    root.querySelector('#submitBtn').textContent = mode==='login'?'登录':'注册并登录';
  }));

  root.querySelector('#authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get('email'); const password = fd.get('password');
    try{
      if(mode==='login') await signIn(email, password);
      else await signUp(email, password);
      toast(mode==='login'?'欢迎回来':'注册成功 🎉');
      location.hash = '#/overview';
    }catch(_){ /* toast已提示 */ }
  });
}

window.addEventListener('hashchange', route);
onAuthChange((sess) => { route(); });

route();
