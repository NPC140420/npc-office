/* NPC办事处 - Supabase 配置与客户端封装 */
(function(){
  // ⬇️ 部署时把这两个值改成你自己的 Supabase 项目地址
  const SUPABASE_URL = 'https://kuynwwizcrjveimrniqz.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_m2wZSwPmFoeAAl7yMtg1NA_7f-Ik8Ch';

  const ready = (typeof window !== 'undefined' && window.supabase)
    ? Promise.resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY))
    : loadSupabase();

  function loadSupabase(){
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = () => resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
      s.onerror = () => reject(new Error('Supabase JS 加载失败,请检查网络或更换 CDN'));
      document.head.appendChild(s);
    });
  }

  window.NPC_SUPABASE = function(){ return ready; };
})();
