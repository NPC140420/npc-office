# 📘 教程三:用 Capacitor 打包安卓 APK(20-30 分钟)

> 把网页版打包成一个真正的安卓安装包,直接装到手机/平板。
> 整个 APK 只是个「网页壳」,业务数据继续走 Supabase,同一账号多端完全同步。

---

## 第 1 步:准备开发环境(10 分钟)

### Windows 用户

1. 安装 **Node.js 22+**: https://nodejs.org/zh-cn
2. 安装 **Java JDK 17**(必须 17,过高过低都不行):
   - 推荐用 [Eclipse Temurin 17](https://adoptium.net/?variant=openjdk17)
   - 安装后**设置环境变量**:
     - `JAVA_HOME` → 你的 Java 安装路径,例如 `C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot`
     - `Path` → 添加 `%JAVA_HOME%\bin`
3. 安装 **Android Studio**(已装跳过): https://developer.android.com/studio
   - 默认安装会装好 Android SDK、Android SDK Platform-Tools、Android Virtual Device
4. **设置 Android SDK 环境变量**:
   - `ANDROID_HOME` → 你的 Android SDK 路径,默认是
     `C:\Users\<你的用户名>\AppData\Local\Android\Sdk`
   - `Path` → 添加 `%ANDROID_HOME%\platform-tools` 和 `%ANDROID_HOME%\tools\bin`

### macOS 用户

```bash
# 安装 Homebrew(已装跳过)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 装 Node、Java、CommandLineTools
brew install node@22
brew install --cask temurin@17

# 装 Android Studio
brew install --cask android-studio
```

装好后在 Android Studio 里:
- 首次启动会提示安装 SDK,一路默认 Next
- Settings → SDK → 确保勾选 Android 13/14/15 SDK Platform

### Linux 用户

```bash
# Node
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Java 17
sudo apt install -y openjdk-17-jdk

# Android 命令行工具
sudo apt install -y android-sdk  # 或下载 commandlinetools 手动配置
```

---

## 第 2 步:验证环境(2 分钟)

打开终端/命令行,挨个运行:

```bash
node -v          # 应该 v22.x.x
npm -v           # 应该 ≥10
java -version    # 应该 17.x.x
javac -version   # 应该 17.x.x
adb version      # 应该有输出
```

只要有一个错,回头检查环境变量。

---

## 第 3 步:创建 Capacitor 工程(5 分钟)

> 把现有网页项目接到 Capacitor 上。

### 3.1 准备一个 web 构建版本

Capacitor 默认从 `dist/` 目录读取网页。我们的项目根目录就是 web 根目录,需要让 Capacitor 指向它。

```bash
cd npc-office

# 修改 capacitor.config.json(我们项目根目录就有这个文件)里的 webDir
# 见"附录"部分
```

### 3.2 安装 Capacitor

```bash
cd npc-office
npm install @capacitor/core @capacitor/cli @capacitor/android
```

如果项目根目录**没有 package.json**,先:
```bash
cd npc-office
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 3.3 初始化 Capacitor 配置

本仓库已经预置了 `capacitor.config.json`(见项目根目录的 `capacitor/` 子目录)。
我们把它复制到工程根:

```bash
cp capacitor/capacitor.config.json ./capacitor.config.json
```

打开 `capacitor.config.json`,确认里面:
```json
{
  "appId": "io.npc.office",
  "appName": "NPC办事处",
  "webDir": ".",
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "allowMixedContent": false,
    "captureInput": true,
    "webContentsDebuggingEnabled": false
  }
}
```

> 如果你想真正从 `dist/` 复制一份构建产物,可以先在工程根建一个 `web/` 子目录,把除了 `capacitor/` 之外的全部文件移进去,然后 `webDir` 指向 `web`。

### 3.4 添加 Android 平台

```bash
npx cap add android
```

执行完毕后会生成 `android/` 目录。

---

## 第 4 步:配置 Android 端(5 分钟)

### 4.1 应用图标替换

把 `assets/img/app-icon.jpg` 复制到 Android 标准尺寸:

```bash
# 用 Capacitor 的资源工具自动生成(推荐)
npx @capacitor/assets generate --android \
  --iconBackgroundColor "#F7E9CCFF" \
  --iconAsset assets/img/app-icon.jpg
```

如果上面命令找不到,改用手动方案:

```bash
# 把图标放进 Android 标准目录
cp assets/img/app-icon.jpg android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp assets/img/app-icon.jpg android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
cp assets/img/app-icon.jpg android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp assets/img/app-icon.jpg android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp assets/img/app-icon.jpg android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp assets/img/app-icon.jpg android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
```

> 实际上,推荐用 https://www.appicon.co/ 自动生成全尺寸图标(支持 Android/iOS)。

### 4.2 修改应用名(可选)

`android/app/src/main/res/values/strings.xml`:

```xml
<resources>
  <string name="app_name">NPC办事处</string>
  <string name="title_activity_main">NPC办事处</string>
  <string name="package_name">io.npc.office</string>
  <string name="custom_url_scheme">io.npc.office</string>
</resources>
```

### 4.3 配置权限

`android/app/src/main/AndroidManifest.xml`,确保有:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

(默认就有,不用改)

### 4.4 配置启动屏背景(可选)

`android/app/src/main/res/values/styles.xml`:

```xml
<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.NoActionBar">
  <item name="windowBackground">@drawable/splash</item>
</style>
```

`android/app/src/main/res/drawable/splash.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
  <item android:drawable="@color/cream_bg"/>
</layer-list>
```

`android/app/src/main/res/values/colors.xml`:

```xml
<resources>
  <color name="cream_bg">#F7E9CC</color>
</resources>
```

### 4.5 设置最低/目标 SDK 版本

`android/variables.gradle`:

```gradle
minSdkVersion = 22        // Android 5.1 已足够覆盖 99% 设备
targetSdkVersion = 34     // Android 14
compileSdkVersion = 34
```

---

## 第 5 步:同步并构建(5 分钟)

```bash
npx cap sync android
```

会复制网页资源到 `android/app/src/main/assets/public/`,并更新插件。

---

## 第 6 步:在 Android Studio 里构建 APK(10 分钟)

### 方式 A:用 Android Studio 图形界面

1. 打开 Android Studio → **File** → **Open** → 选择 `npc-office/android/` 目录
2. Gradle 首次同步需要几分钟(下载依赖,静静等)
3. 顶部菜单 **Build** → **Generate Signed Bundle / APK...**
4. 选 **APK** → Next
5. **Create new...** 创建一个 keystore(签名凭证,用于更新应用):
   - 路径:例如 `npckeystore.jks`
   - Password:任意两个密码都设置并**妥善保存**(以后更新 APK 需要同一个)
   - Validity:25 年(够用)
   - 填好名字/组织/城市,随便写
6. 用刚创建的 keystore 继续 → Next
7. 选:
   - **Build Variants**: release
   - 勾选 **V1 + V2 signature**(否则有些设备装不上)
8. 点 **Create** → 等待构建完成(1-3 分钟)
9. 完成后弹出窗口 → 点 **locate** → 找到 APK 文件路径
   - 通常在 `android/app/release/app-release.apk`

### 方式 B:命令行(更直接)

```bash
cd android
./gradlew assembleRelease
# 完成后路径: android/app/build/outputs/apk/release/app-release.apk
```

---

## 第 7 步:安装到手机/平板测试

### 7.1 直接用 ADB 装到连着电脑的手机

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 7.2 拷贝到手机本地安装

1. 把 APK 文件发到手机(微信/网盘/USB 都可以)
2. 手机上点开 APK,系统会问「是否允许来自此来源安装」→ 允许
3. 装好后桌面出现 **NPC办事处** 图标 ✅
4. ⚠️ **必须接受一个重要提示**:在「设置→应用→NPC办事处」开启「允许全部应用权限」才能正常访问网络

---

## 第 8 步:适配安卓 10-15 ✅

我们的 `minSdkVersion=22,targetSdkVersion=34` 已经覆盖 Android 5.1 到 14 主流机型。

**Android 14/15 重要说明**:从 Android 13 起,通知权限需要用户单独授权;如果你的 APK 里没用到推送就完全不影响。

**Android 11/12 网关提示**:Android 11 引入了 Package Visibility 限制,我们没有读取设备其他应用,所以无须额外权限。

**Android 15**:从 Android 15 起,targetSdk 必须 ≥ 35 才能上架 Google Play。我们的 34 对个人完全够用;如果以后想上架:

```gradle
targetSdkVersion = 35
compileSdkVersion = 35
```

---

## 🐛 调试技巧

### 真机调试(看 console)

```bash
# Chrome 浏览器地址栏输入 chrome://inspect/#devices
# 确保手机用 USB 连电脑并开了 USB 调试
```

### 模拟器调试

Android Studio → Tools → Device Manager → 创建一台 Pixel → 启动,直接 Run 即可。

### 看 logcat

```bash
adb logcat | grep -i "capacitor\|chromium"
```

---

## ⚠️ 关键说明

### Q:APK 和网页版账号是否通用?
A:✅ **完全通用**。同一个 Supabase 项目,同一份代码,登录同一个邮箱密码,数据自动双向同步。

### Q:APK 需要科学上网吗?
A:不需要。代码里的 Supabase CDN(`cdn.jsdelivr.net`)在中国大陆访问可能略慢但可用。如果你部署在国内服务器,把页面放自己服务器就行,完全不经任何被墙的地址。

### Q:数据安全吗?
A:✅ 所有数据存在你自己 Supabase 账号里,RLS 行级安全开启,不同账号完全隔离,只有你自己能读写。

### Q:更新了网页代码,要重装 APK 吗?
A:**不需要**!因为 APK 只是个网页壳,你只需要把更新的网页 push 到 Vercel,下次打开 App 会自动加载最新版。

### Q:怎么强制让 App 每次都拉最新?
A:在 `index.html` 里加一个 `<meta http-equiv="Cache-Control" content="no-cache">`。
Capacitor 默认会在 `www/` 里缓存,实际不会。

### Q:发布到应用商店?
A:Google Play 需 Google 开发者账号($25 一次性);华为/小米/OPPO/vivo 应用商店审核个人项目可以申请。本 APK 默认配置就是符合上架要求的。

---

## ✅ 完成!

你现在拥有了:
- ✅ 网页版 → Vercel/GitHub Pages 网址
- ✅ Android APK → 桌面图标,像原生 App
- ✅ 数据云同步 → 手机/平板/PC 同账号自动同步
- ✅ 完全独立,无广告,数据隔离
