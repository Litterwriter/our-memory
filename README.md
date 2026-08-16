# 我们的纪念册

一个自包含的情侣纪念网站，内置 11 张照片。所有页面文字、日期、相册内容都在 `config.js` 中集中配置。

## 密码门

打开页面会先要求输入密码，密码以哈希形式保存在 `config.js` 的 `gate.hash` 和 `gate.fallbackHash` 中，不存明文。解锁状态只保存在当前浏览器会话里，关闭浏览器后需要重新输入。

改密码需要重新计算 SHA-256 和 djb2 哈希，可以直接让 Codex 帮你改。

## 本地运行

```powershell
cd love-site
python -m http.server 8000
```

然后打开 `http://localhost:8000`。

也可以直接双击 `index.html` 打开。建议使用本地服务器，这样留言板的本地存储功能在所有浏览器下都稳定可用。

注意：`http.server` 会把当前目录当作网站根目录。如果打开后看到的是文件目录列表而不是纪念网站，说明是在别的目录启动的，请先 `cd love-site` 再启动。

## 如何修改内容

编辑 `config.js`：

- `siteName`、`heroTitle`、`heroSubtitle`：网站标题和首页文案。
- `startDate`：在一起的起点，用于自动计算在一起的天数。
- `anniversary`：每年纪念日的月份和日期。
- `milestones`：时光轴事件；`photo` 填 `photos` 数组的下标（从 0 开始）可挂一张照片。
- `photos`：相册图片、标签和时间；想换照片就替换 `assets/pictures` 里对应的 `photo-XX.jpg`。
- `letters`：页面里的两封信。

## 部署上线

这是纯静态项目，整个 `love-site` 目录就是全部内容，可以整体上传到任意静态托管。

### 最快方式：Netlify Drop（无需命令行）

1. 打开 <https://app.netlify.com/drop>
2. 把整个 `love-site` 文件夹（或打包好的 `love-site-online.zip`）拖进页面
3. 上传完成后会得到一个 `https://xxxx.netlify.app` 网址，可直接发给别人

### GitHub Pages

1. 在 GitHub 新建一个仓库
2. 把 `love-site` 里的文件提交并推送到仓库
3. 在仓库 Settings → Pages 里选择分支部署，稍等几分钟即可访问

### 国内可用的托管

- 腾讯云 COS：开启静态网站托管，绑定域名后即可访问
- 阿里云 OSS：上传文件并开启静态网站托管
- Gitee Pages：如果已有 Gitee 账号，也可以直接部署静态页面

注意：上线后照片和文字是公开的，任何拿到链接的人都能看到。
