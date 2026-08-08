# 📘 教程二:前端部署到云端(10 分钟)

> 把网页版托管到任意静态服务器,**手机、平板、电脑** 都能同步使用同一个 Supabase 账号。

我们以 **Vercel**(免费、零配置、秒级部署)为示例。也提供 **GitHub Pages** 方案。

---

## 方案 A:用 Vercel 部署(最简单 ✅)

### 第 1 步:把项目推到 GitHub

1. 注册 GitHub 账号(已有跳过)
2. 在本地把你电脑上的 `npc-office/` 文件夹初始化并上传 GitHub:
   ```bash
   cd npc-office
   git init
   git add .
   git commit -m "init"
   # 在 GitHub 新建一个仓库 npc-office,然后:
   git remote add origin https://github.com/你的用户名/npc-office.git
   git branch -M main
   git push -u origin main
   ```

### 第 2 步:在 Vercel 导入项目

1. 打开 https://vercel.com,用 GitHub 账号登录
2. 点 **Add New Project**
3. 选中你刚 push 的 `npc-office` 仓库 → 点 **Import**
4. 配置页面:
   - **Framework Preset**: 选 `Other`(因为是纯 HTML,不需要构建)
   - **Output Directory**: 留空
   - **Build Command**: 留空(我们不需要构建)
5. 直接点 **Deploy**
6. 30 秒后部署完成,Vercel 会给你一个 `xxx.vercel.app` 的网址 ✅

---

## 第 2.5 步:**关键**:填入 Supabase 密钥

⚠️ **这一步非常重要!** 如果不填,App 是不能用的。

有 **两种方式**(任选一种):

### 方式一(推荐):直接在 Vercel 里配置环境变量

1. 项目里 → **Settings** → **Environment Variables**
2. 添加两个变量:
   - Name: `SUPABASE_URL`,Value: 你的 URL
   - Name: `SUPABASE_ANON_KEY`,Value: 你的 anon key
3. 点 **Save**,然后到 **Deployments** 页签 → 找到最新那次部署 → 三个点菜单 → **Redeploy**
4. ⚠️ 但是这套配置需要改动 `supabase-client.js` 让它从环境变量读取,对于纯 HTML 版本,**直接用方式二**更省事。

### 方式二(对纯 HTML 最简单):直接在代码里写死

1. 用 GitHub 网页直接编辑 → 打开 `supabase-client.js` → 笔图标 Edit
2. 替换这两行:
   ```js
   const SUPABASE_URL = 'https://abcdefgh.supabase.co';        // ← 你的
   const SUPABASE_ANON_KEY = 'eyJhZGRyZXNzIjo...';            // ← 你的
   ```
3. 点 **Commit changes**,Vercel 会自动重新部署
4. 30 秒后,在新页面刷新 → 浏览器上你应该看到登录页了 🎉

⚠️ **Anon key 是公开的,可以放心放在前端**。Supabase 已经用 RLS 限制权限。

---

## 第 3 步:验证

1. 浏览器打开你的 Vercel 网址(PC 或手机都行)
2. 注册一个新账号(邮箱 + 密码)
3. 在「设置」页随便写点资料保存,刷新后数据还在 → ✅
4. 用手机浏览器打开同一个网址,登录同一账号 → 数据同步 ✅

---

## 方案 B:用 GitHub Pages 部署(完全免费)

1. Settings → Pages
2. **Source**: 选 `Deploy from a branch`
3. **Branch**: 选 `main` 根目录
4. 点保存 → GitHub 给你一个 `https://你的用户名.github.io/npc-office/` 网址
5. 注意修改 `manifest.json` 的 `start_url` 加前缀 `npc-office/`

---

## 方案 C:自托管服务器

把 `npc-office/` 整个目录传到你的服务器,配置 Nginx:

```nginx
server {
  listen 80;
  server_name npc.your-domain.com;
  root /var/www/npc-office;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

然后用 Certbot 给域名上 HTTPS(必须!Supabase Auth 强制 HTTPS)。

---

## 📱 PWA 安装到桌面

网页部署后,**无论 PC 还是手机浏览器**,都可以点地址栏的「安装」按钮把网站变成 App 图标:

### iOS Safari
1. 打开网址
2. 点底部分享按钮 → **添加到主屏幕**
3. 桌面上会出现 NPC办事处 App 图标

### Android Chrome
1. 打开网址
2. 右上角菜单 → **添加到主屏幕**
3. 安装后桌面出现图标,点击直接启动,全屏体验

---

## ✅ 部署完毕!

- 网页版:在你的 Vercel/自托管域名上运行 ✅
- PWA 安装:手机/电脑可以像 App 一样使用 ✅
- 数据同步:同一个账号多端自动同步 ✅

---

## 🆘 常见问题

**Q:打开网页白屏**
A:打开浏览器 Console 看错误。如果报 `Failed to load supabase` 是网络问题;如果报 `Invalid API key` 是密钥错了。

**Q:登录后跳不到主页**
A:打开 Supabase → Authentication → URL Configuration,把 `Site URL` 设成你部署的网址。

**Q:怎样清掉本地的旧数据**
A:浏览器设置 → 站点数据 → 找到你的域名 → 清掉。

**Q:不同设备怎么登录**
A:同一 Supabase 项目、所有设备登录同一邮箱密码即可同步。
