/* =============================================================
   Supabase 配置 · 部署时填入自己的项目 URL 和 anon key
   注意：anon key 是公开的，安全性由 RLS 策略保障。
   ============================================================= */
export const SUPABASE_URL  = 'https://budefwbtlhadzlqczquu.supabase.co';
export const SUPABASE_ANON = 'sb_publishable_S_NcpmYStabIpTuMg8T9GQ_f7xx2oor';

// 通过 CDN 引入 supabase-js（UMD 全局变量）
// 在 index.html 里通过 <script src="https://unpkg.com/@supabase/supabase-js@2"> 加载
// 这里导出全局客户端
let _client = null;

export async function getClient(){
  if(_client) return _client;
  if(!window.supabase){
    throw new Error('Supabase SDK 未加载，请检查网络');
  }
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
  });
  return _client;
}