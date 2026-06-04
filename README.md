# LinuxDo 收藏夹

为 [linux.do](https://linux.do) 制作的油猴脚本，提供自定义收藏夹管理功能，支持多文件夹分类、主题切换和跨设备同步。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/), [ScriptCat](https://scriptcat.org) 等用户脚本管理器扩展
2. 任选一种方式安装脚本：
   - **一键安装（推荐）**：打开 [ScriptCat 脚本页：LinuxDo 收藏夹](https://scriptcat.org/zh-CN/script-show-page/6125)，点击「安装脚本」按提示完成安装
   - **手动安装**：在管理器中新建脚本，将仓库内 `linux-do-favorites.user.js` 的内容粘贴保存
3. 访问 [linux.do](https://linux.do) 即可使用

## 功能

### 收藏管理

![论坛页面与收藏入口](docs/images/mainpage.png)

![收藏面板](docs/images/management.png)

- **帖子/回复收藏**：在帖子页面，每层楼的楼层号旁有收藏按钮（☆/★），点击即可收藏该回复
- **多文件夹分类**：收藏时可选择目标文件夹，支持创建、重命名、删除文件夹和拖拽排序
- **侧边栏入口**：在 LinuxDo 侧边栏添加「收藏」快捷入口，点击「收藏」打开管理面板
- **收藏面板**：全屏管理面板，左侧为文件夹列表，右侧为收藏内容
- **搜索功能**：可按标题、分类、标签搜索收藏内容
- **拖拽移动**：可将收藏项拖到左侧文件夹快速改分类
- **自动归类模式**：在设置中开启「按分类自动归类」后，收藏时会自动匹配与帖子分类同名的文件夹

### 书签页快捷收藏

![书签页快捷收藏](docs/images/bookmark.png)

- 在书签页面每个书签旁显示收藏按钮

### 文件夹选择浮窗

- 点击收藏按钮后弹出文件夹选择浮窗
- 支持在浮窗中直接新建收藏夹
- 重复名称时输入框变红并显示「收藏夹已存在」提示
- 鼠标移开浮窗后自动收藏到默认文件夹

### 设置

![设置与 Gist 同步](docs/images/settings.png)

在同一设置页可配置主题、自动归类与同步选项。

- 使用 GitHub Gist 在多设备间同步收藏数据
- 填入 Personal Access Token（需 gist 权限）即可使用
- 支持上传/下载数据，自动查找或创建同步用的 Gist
- 设置中可手动指定 Gist ID

## 文件说明

```
linux-do-favorites.user.js    # 油猴脚本主文件
README.md                     # 本文件
docs/images/                  # 文档配图
```

## 友情链接：
[LINUX DO](https://linux.do/)

## 数据安全

- 收藏数据默认保存在当前浏览器的用户脚本管理器本地存储中，不会上传到作者服务器。
- 换浏览器、重装脚本管理器、清理扩展数据前，请先在设置页导出 JSON 备份，或手动上传到 GitHub Gist。
- 设置页支持导入/导出 JSON 备份文件，备份数据包含 `schemaVersion`，便于后续版本迁移。
- 可选择开启每日自动同步到 Gist。该功能默认关闭，开启后会在打开 linux.do 页面时检查距离上次同步是否超过 24 小时，超过则自动上传一次。
