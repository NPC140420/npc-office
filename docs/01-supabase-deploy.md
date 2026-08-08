# 📘 教程一:Supabase 数据库部署(10 分钟)

> 整个 App 的所有业务数据都保存在 Supabase 云端。
> 本步骤只需要做 **一次**,后续网页/APK 都共用同一个数据库。

---

## 第 1 步:注册 Supabase(2 分钟)

1. 打开官网:https://supabase.com
2. 点 **Start your project** / 登录,推荐用 **GitHub 账号**登录
3. 创建一个新组织(Organization),名称随意,例如 `npc-personal`

---

## 第 2 步:新建项目(1 分钟)

1. 点 **New Project** → 创建一个新项目
2. 填写:
   - **Name**: `npc-office`(随便起,只在本控制台看)
   - **Database Password**: 设置一个**强密码**,请务必**保存好**(后续无法找回,但生产端不需要)
   - **Region**: 选 `Singapore`(亚太地区延迟最低)或 `Tokyo`
   - **Plan**: 选 `Free`(免费额度对个人完全够用)
3. 点 **Create new project**,等待 1-2 分钟初始化完成

---

## 第 3 步:跑建表 SQL(3 分钟)

1. 项目初始化完成后,左侧菜单点 **SQL Editor**
2. 点 **New query**
3. 把项目里的 `supabase/schema.sql` 整个文件内容**完整复制**进来
4. 点右下角 **Run**(运行),等待几秒钟
5. 如果看到 `Success. No rows returned`,说明执行成功 ✅

**验证**:左侧菜单点 **Table Editor** → 应该看到 9 张表:`plans / todos / events / transactions / savings / body / fitness / notes / profile`

---

## 第 4 步:获取 API 密钥(2 分钟)

1. 左侧菜单点 **Project Settings**(齿轮图标) → **API**
2. 复制这两个值(后面要填到前端代码里):
   - **Project URL**(类似 `https://abcdefgh.supabase.co`)
   - **anon public key**(很长的一串字符串,以 `eyJ` 开头)

⚠️ **重要区分**:`anon` key 是公开的,可以放在前端代码里。Supabase 已经配置好了 RLS 权限,前端代码无法直接读写别人的数据。

---

## 第 5 步:配置邮箱密码登录(2 分钟)

1. 左侧菜单点 **Authentication** → **Providers**
2. 找到 **Email** → 默认是**开启**状态 ✅
3. 滚动到下面 **Auth Providers** 配置 → **Email**:
   - `Enable Email provider`: ✅ 勾选
   - `Confirm email`: 
     - 如果开发期想立即使用,**关掉**(设为 OFF)
     - 如果是正式发布,推荐开启(用户注册后会收到验证邮件,点击链接后才能登录)
4. 点 **Save**

---

## 第 6 步:(可选)开启邮箱找回密码

默认配置下,`supabase.auth.resetPasswordForEmail()` 已经可用。如果你修改了邮件模板:

1. **Authentication** → **Email Templates**
2. 找到 **Reset Password** → 点开,修改文案后保存

---

## ✅ 至此,Supabase 端配置完毕

接下来你只需要把两个密钥填到前端的 `supabase-client.js`:

```js
const SUPABASE_URL = 'https://abcdefgh.supabase.co';        // ← 第 4 步复制的
const SUPABASE_ANON_KEY = 'eyJhZGRyZXNzIjo...';              // ← 第 4 步复制的
```

然后就可以直接部署前端了(见 `02-web-deploy.md`)。

---

## 🆘 常见问题

**Q:注册后报"Email not confirmed"**
A:第 5 步把 `Confirm email` 关掉,或者去你邮箱点链接验证。

**Q:SQL 报错"permission denied for table users"**
A:这是 Supabase 的安全限制,本脚本不写 auth.users 表,只读引用,正常应该不会报。如报错,把 schema.sql 里所有 `references auth.users(id)` 检查一遍,确认连的是 `auth` schema 而不是 `public`。

**Q:想清空某用户的全部数据做测试**
A:Table Editor 里,选中记录 → Delete;或者用管理员 Token 调用 SQL:
```sql
delete from public.plans where user_id = '粘贴用户 UUID';
```

**Q:免费额度够用吗**
A:500MB 数据库,5GB 带宽,50,000 月活,完全够一个人用。

**Q:如何重置数据库**
A:Project Settings → Database → Reset database,会清空所有表。
