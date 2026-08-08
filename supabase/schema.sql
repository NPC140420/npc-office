-- =================================================================
-- NPC办事处 · Supabase 数据库全量建表脚本
-- 在 Supabase 项目控制台 → SQL Editor → 粘贴并运行此完整脚本
-- =================================================================

-- 启用 UUID 生成
create extension if not exists "uuid-ossp";

-- 公共触发器函数:自动维护 createdAt / updatedAt
create or replace function public.set_timestamps()
returns trigger as $$
begin
  new."updatedAt" = now();
  if (TG_OP = 'INSERT') then
    if new."createdAt" is null then new."createdAt" = now(); end if;
  elsif (TG_OP = 'UPDATE') then
    new."createdAt" = old."createdAt";
  end if;
  return new;
end;
$$ language plpgsql;

-- 公共函数:取出当前登录用户的 user_id(RLS 策略里使用)
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
as $$
  select auth.uid();
$$;

-- =================================================================
-- 1. plans  每日计划
-- =================================================================
create table if not exists public.plans (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  title         text not null,
  note          text,
  completed     boolean default false,
  review        text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index if not exists idx_plans_user_date on public.plans(user_id, date);
create trigger trg_plans_ts before insert or update on public.plans
  for each row execute procedure public.set_timestamps();
alter table public.plans enable row level security;
create policy "plans_select_own" on public.plans for select using (user_id = public.current_user_id());
create policy "plans_insert_own" on public.plans for insert with check (user_id = public.current_user_id());
create policy "plans_update_own" on public.plans for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy "plans_delete_own" on public.plans for delete using (user_id = public.current_user_id());

-- =================================================================
-- 2. todos  待办清单
-- =================================================================
create table if not exists public.todos (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  note          text,
  priority      text check (priority in ('high','mid','low')) default 'mid',
  due_date      date,
  completed     boolean default false,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index if not exists idx_todos_user on public.todos(user_id);
create index if not exists idx_todos_user_due on public.todos(user_id, due_date);
create trigger trg_todos_ts before insert or update on public.todos
  for each row execute procedure public.set_timestamps();
alter table public.todos enable row level security;
create policy "todos_select_own" on public.todos for select using (user_id = public.current_user_id());
create policy "todos_insert_own" on public.todos for insert with check (user_id = public.current_user_id());
create policy "todos_update_own" on public.todos for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy "todos_delete_own" on public.todos for delete using (user_id = public.current_user_id());

-- =================================================================
-- 3. events  日程
-- =================================================================
create table if not exists public.events (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  start_date    date not null,
  start_time    time,
  end_time      time,
  all_day       boolean default false,
  location      text,
  note          text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index if not exists idx_events_user_date on public.events(user_id, start_date);
create trigger trg_events_ts before insert or update on public.events
  for each row execute procedure public.set_timestamps();
alter table public.events enable row level security;
create policy "events_select_own" on public.events for select using (user_id = public.current_user_id());
create policy "events_insert_own" on public.events for insert with check (user_id = public.current_user_id());
create policy "events_update_own" on public.events for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy "events_delete_own" on public.events for delete using (user_id = public.current_user_id());

-- =================================================================
-- 4. transactions  收支记账
-- =================================================================
create table if not exists public.transactions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  type          text check (type in ('income','expense')) not null,
  amount        numeric(12,2) not null,
  category      text not null,
  date          date not null,
  note          text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index if not exists idx_tx_user_date on public.transactions(user_id, date);
create index if not exists idx_tx_user_cat  on public.transactions(user_id, category);
create trigger trg_tx_ts before insert or update on public.transactions
  for each row execute procedure public.set_timestamps();
alter table public.transactions enable row level security;
create policy "tx_select_own" on public.transactions for select using (user_id = public.current_user_id());
create policy "tx_insert_own" on public.transactions for insert with check (user_id = public.current_user_id());
create policy "tx_update_own" on public.transactions for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy "tx_delete_own" on public.transactions for delete using (user_id = public.current_user_id());

-- =================================================================
-- 5. savings  储蓄目标
-- =================================================================
create table if not exists public.savings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  target        numeric(12,2) default 0,
  saved         numeric(12,2) default 0,
  deadline      date,
  note          text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index if not exists idx_savings_user on public.savings(user_id);
create trigger trg_savings_ts before insert or update on public.savings
  for each row execute procedure public.set_timestamps();
alter table public.savings enable row level security;
create policy "sv_select_own" on public.savings for select using (user_id = public.current_user_id());
create policy "sv_insert_own" on public.savings for insert with check (user_id = public.current_user_id());
create policy "sv_update_own" on public.savings for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy "sv_delete_own" on public.savings for delete using (user_id = public.current_user_id());

-- =================================================================
-- 6. body  身体健康打卡
-- =================================================================
create table if not exists public.body (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  weight        numeric(6,2),
  height        numeric(6,2),
  waist         numeric(6,2),
  belly         numeric(6,2),
  water         integer,
  sleep         numeric(4,1),
  steps         integer,
  feeling       text,
  diet          text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now(),
  unique(user_id, date)   -- 每天只允许一条打卡
);
create index if not exists idx_body_user_date on public.body(user_id, date);
create trigger trg_body_ts before insert or update on public.body
  for each row execute procedure public.set_timestamps();
alter table public.body enable row level security;
create policy "body_select_own" on public.body for select using (user_id = public.current_user_id());
create policy "body_insert_own" on public.body for insert with check (user_id = public.current_user_id());
create policy "body_update_own" on public.body for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy "body_delete_own" on public.body for delete using (user_id = public.current_user_id());

-- =================================================================
-- 7. fitness  健身训练
-- =================================================================
create table if not exists public.fitness (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  project       text not null,
  sets          integer default 0,
  reps          integer default 0,
  weight        numeric(6,2) default 0,
  duration      integer default 0,
  completed     boolean default false,
  feeling       text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index if not exists idx_fit_user_date on public.fitness(user_id, date);
create trigger trg_fit_ts before insert or update on public.fitness
  for each row execute procedure public.set_timestamps();
alter table public.fitness enable row level security;
create policy "fit_select_own" on public.fitness for select using (user_id = public.current_user_id());
create policy "fit_insert_own" on public.fitness for insert with check (user_id = public.current_user_id());
create policy "fit_update_own" on public.fitness for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy "fit_delete_own" on public.fitness for delete using (user_id = public.current_user_id());

-- =================================================================
-- 8. notes  日记
-- =================================================================
create table if not exists public.notes (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  title         text,
  content       text not null,
  mood          text,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create index if not exists idx_notes_user_date on public.notes(user_id, date);
create trigger trg_notes_ts before insert or update on public.notes
  for each row execute procedure public.set_timestamps();
alter table public.notes enable row level security;
create policy "notes_select_own" on public.notes for select using (user_id = public.current_user_id());
create policy "notes_insert_own" on public.notes for insert with check (user_id = public.current_user_id());
create policy "notes_update_own" on public.notes for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy "notes_delete_own" on public.notes for delete using (user_id = public.current_user_id());

-- =================================================================
-- 9. profile  个人资料(每用户一行)
-- =================================================================
create table if not exists public.profile (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  nickname      text,
  avatar_url    text,
  height        numeric(6,2),
  initial_weight numeric(6,2),
  target_weight  numeric(6,2),
  water_goal    integer default 2000,
  sleep_goal    numeric(4,1) default 8,
  "createdAt"   timestamptz not null default now(),
  "updatedAt"   timestamptz not null default now()
);
create trigger trg_profile_ts before insert or update on public.profile
  for each row execute procedure public.set_timestamps();
alter table public.profile enable row level security;
create policy "profile_select_own" on public.profile for select using (user_id = public.current_user_id());
create policy "profile_insert_own" on public.profile for insert with check (user_id = public.current_user_id());
create policy "profile_update_own" on public.profile for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());
create policy "profile_delete_own" on public.profile for delete using (user_id = public.current_user_id());

-- =================================================================
-- 账号注销时自动清理(已通过 on delete cascade 外键约束保证,以下是双保险)
-- =================================================================
-- 删除 auth.users 中某用户 → 上面 9 张表的 user_id 外键 on delete cascade 会自动级联删除
-- 你也可以在 Supabase Edge Function 中调用 supabaseAdmin.deleteUser() 实现真正的账号注销

-- =================================================================
-- 验证
-- =================================================================
-- 执行以下查询确认所有表创建成功:
select tablename from pg_tables where schemaname='public' order by tablename;
