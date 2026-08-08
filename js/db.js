/* =============================================================
   通用 CRUD 封装：每张表都有 list/get/insert/update/remove
   ============================================================= */
import { getClient } from './supabase.js';

const TABLES = ['plans','todos','events','transactions','savings','body','fitness','fitness_favorites','notes','profiles'];

function table(name){
  return {
    async list(orderBy = 'created_at', asc = false){
      const sb = await getClient();
      const { data, error } = await sb.from(name).select('*').order(orderBy, { ascending: asc });
      if(error) throw error;
      return data || [];
    },
    async listWhere(col, val){
      const sb = await getClient();
      const { data, error } = await sb.from(name).select('*').eq(col, val);
      if(error) throw error;
      return data || [];
    },
    async get(id){
      const sb = await getClient();
      const { data, error } = await sb.from(name).select('*').eq('id', id).maybeSingle();
      if(error) throw error;
      return data;
    },
    async insert(row){
      const sb = await getClient();
      const { data: { user } } = await sb.auth.getUser();
      const payload = name === 'profiles' ? row : { ...row, user_id: user.id };
      const { data, error } = await sb.from(name).insert(payload).select().single();
      if(error) throw error;
      return data;
    },
    async update(id, patch){
      const sb = await getClient();
      const { data, error } = await sb.from(name).update(patch).eq('id', id).select().single();
      if(error) throw error;
      return data;
    },
    async remove(id){
      const sb = await getClient();
      const { error } = await sb.from(name).delete().eq('id', id);
      if(error) throw error;
      return true;
    },
    async removeAll(){
      const sb = await getClient();
      const { data: { user } } = await sb.auth.getUser();
      if(!user) throw new Error('未登录');
      const { error } = await sb.from(name).delete().eq('user_id', user.id);
      if(error) throw error;
      return true;
    },
  };
}

// 暴露所有表
export const db = {};
for(const t of TABLES){ db[t] = table(t); }

// 导出当前用户
export async function currentUser(){
  const sb = await getClient();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

// 工具：日期 YYYY-MM-DD
export function todayStr(){
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}
export function monthStr(){
  const d = new Date();
  const m = String(d.getMonth()+1).padStart(2,'0');
  return `${d.getFullYear()}-${m}`;
}
export function ymFromDate(s){
  return (s||'').slice(0,7);
}
