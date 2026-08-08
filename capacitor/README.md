# Capacitor 官方图标配置说明

## 需要的图标资源(在 app 图标位置生效)

Capacitor 6 推荐使用 `@capacitor/assets` 一键生成全套尺寸:

```bash
# 安装
npm install -D @capacitor/assets

# 生成(必须把 app-icon.jpg 替换成你自己的 1024x1024 jpg/png)
npx capacitor-assets generate \
  --android \
  --iconBackgroundColor "#F7E9CCFF" \
  --iconAsset assets/img/app-icon.jpg \
  --splashBackgroundColor "#F7E9CCFF" \
  --splashAsset assets/img/avatar-main.jpg
```

## 自动生成的位置

执行命令后会自动覆盖到 `android/app/src/main/res/` 下:
- mipmap-mdpi/ic_launcher.png (48x48)
- mipmap-hdpi/ic_launcher.png (72x72)
- mipmap-xhdpi/ic_launcher.png (96x96)
- mipmap-xxhdpi/ic_launcher.png (144x144)
- mipmap-xxxhdpi/ic_launcher.png (192x192)

并且对应的 round 版本也会生成。

## 提示

如果你的原始图标不是正方形或不是 1024x1024,建议先用 Photoshop 或在线工具
(https://www.appicon.co/)裁剪到正方形再生成,否则圆角图标可能变形。
