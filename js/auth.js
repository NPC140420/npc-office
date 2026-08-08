/* =============================================================
   登录注册模块
   ============================================================= */
import { getClient } from './supabase.js';
import { toast } from './ui.js';

export async function getSession(){
  const sb = await getClient();
  const { data: { session } } = await sb.auth.getSession();
  return session;
}

export async function signIn(email, password){
  const sb = await getClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error){ toast(error.message, true); throw error; }
  return data;
}

export async function signUp(email, password){
  const sb = await getClient();
  const { data, error } = await sb.auth.signUp({ email, password });
  if(error){ toast(error.message, true); throw error; }
  return data;
}

export async function signOut(){
  const sb = await getClient();
  await sb.auth.signOut();
}

export async function deleteAccount(){
  // Supabase 无公开的 deleteUser；常用做法：
  // 1) 后端 service_role 删除 auth.users(级联清表)，2) 前端调 rpc
  // 这里我们暴露一个 rpc：delete_my_account
  const sb = await getClient();
  const { error } = await sb.rpc('delete_my_account');
  if(error) throw error;
  await sb.auth.signOut();
}

// 暴露 auth 状态变化监听
export function onAuthChange(cb){
  let sbResolve;
  getClient().then(sb => {
    sb.auth.onAuthStateChange((_evt, session) => cb(session));
  });
}
