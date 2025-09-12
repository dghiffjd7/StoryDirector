# Story Weaver TavernHelper - 安装指南
## Installation Guide

## 📋 安装前准备 | Prerequisites

### 必需组件 | Required Components
1. **SillyTavern** - 1.10.0+ (推荐最新版本 | Latest version recommended)
2. **TavernHelper (JS-Slash-Runner)** - 必须已安装并运行 | Must be installed and running
3. **支持的浏览器 | Supported Browsers:**
   - Chrome 90+
   - Firefox 88+ 
   - Safari 14+
   - Edge 90+

### 验证TavernHelper | Verify TavernHelper
在SillyTavern聊天中输入以下命令验证TavernHelper是否正常工作：
Type the following command in SillyTavern chat to verify TavernHelper is working:

```
/jsr
```

如果看到TavernHelper的帮助信息，说明安装正确。
If you see TavernHelper help information, the installation is correct.

## 🚀 安装步骤 | Installation Steps

### 方法一：直接安装 | Method 1: Direct Installation

1. **下载脚本文件 | Download Script File**
   - 下载 `story-weaver-complete.js` 文件
   - Download the `story-weaver-complete.js` file

2. **打开TavernHelper脚本管理器 | Open TavernHelper Script Manager**
   - 在SillyTavern中输入：`/jsr script`
   - Type in SillyTavern: `/jsr script`

3. **创建新脚本 | Create New Script**
   - 点击 "新建脚本" 或 "Create New Script"
   - 输入脚本名称：`Story Weaver`
   - Enter script name: `Story Weaver`

4. **粘贴代码 | Paste Code**
   - 复制 `story-weaver-complete.js` 的完整内容
   - 粘贴到脚本编辑器中
   - Copy the complete contents of `story-weaver-complete.js`
   - Paste into the script editor

5. **保存并激活 | Save and Activate**
   - 保存脚本
   - 确保脚本已激活（开关为开启状态）
   - Save the script
   - Ensure the script is activated (toggle is on)

### 方法二：通过文件导入 | Method 2: File Import

1. **准备文件 | Prepare File**
   - 将 `story-weaver-complete.js` 保存到本地
   - Save `story-weaver-complete.js` locally

2. **使用TavernHelper导入功能 | Use TavernHelper Import**
   - 在TavernHelper中查找导入功能
   - 选择并导入JavaScript文件
   - Look for import function in TavernHelper
   - Select and import the JavaScript file

## ✅ 安装验证 | Installation Verification

### 测试基本功能 | Test Basic Functionality

1. **测试斜杠命令 | Test Slash Commands**
   ```
   /sw
   ```
   应该打开Story Weaver界面
   Should open the Story Weaver interface

2. **测试快速生成 | Test Quick Generation**
   ```
   /swquick fantasy 5
   ```
   应该直接在聊天中生成5章奇幻故事大纲
   Should generate a 5-chapter fantasy outline directly in chat

3. **检查控制台日志 | Check Console Logs**
   - 打开浏览器开发者工具 (F12)
   - 查看控制台是否有 `[Story Weaver] Initialization complete` 消息
   - Open browser developer tools (F12)
   - Look for `[Story Weaver] Initialization complete` message in console

## 🔧 配置设置 | Configuration Settings

### 首次使用配置 | First-Time Setup

1. **打开主界面 | Open Main Interface**
   ```
   /sw
   ```

2. **设置基本参数 | Set Basic Parameters**
   - **对话历史长度 | Chat History Length:** 建议50-200条 | Recommended 50-200 messages
   - **故事类型 | Story Type:** 选择您喜欢的类型 | Choose your preferred genre  
   - **详细程度 | Detail Level:** 建议选择"详细大纲" | Recommend "detailed outline"

3. **测试数据访问 | Test Data Access**
   - 点击 "预览数据" 按钮
   - 确认可以看到世界书条目和角色信息
   - Click "Preview Data" button
   - Confirm you can see worldbook entries and character info

## 🛠️ 故障排除 | Troubleshooting

### 常见问题 | Common Issues

#### 问题1：命令无响应 | Issue 1: Commands Not Responding
**症状 | Symptoms:** `/sw` 命令没有反应 | `/sw` command shows no response

**解决方案 | Solutions:**
1. 检查TavernHelper是否正常运行：`/jsr`
2. 重新加载脚本：在脚本管理器中禁用然后重新启用
3. 检查浏览器控制台是否有错误信息
4. 重启SillyTavern

1. Check if TavernHelper is running: `/jsr`
2. Reload script: Disable and re-enable in script manager
3. Check browser console for error messages
4. Restart SillyTavern

#### 问题2：界面无法打开 | Issue 2: Interface Won't Open
**症状 | Symptoms:** `/sw` 命令执行但界面不显示 | `/sw` command executes but interface doesn't show

**解决方案 | Solutions:**
1. 检查浏览器是否阻止了弹窗
2. 确认TavernHelper的HTML渲染功能正常
3. 尝试刷新页面后重试
4. 检查是否有JavaScript错误

1. Check if browser is blocking popups
2. Confirm TavernHelper HTML rendering works
3. Try refreshing page and retry
4. Check for JavaScript errors

#### 问题3：无法访问世界书 | Issue 3: Cannot Access Worldbook
**症状 | Symptoms:** 提示"暂无可用的世界书设定" | Shows "No worldbook settings available"

**解决方案 | Solutions:**
1. 确认当前角色有关联的世界书条目
2. 检查世界书条目是否已启用
3. 尝试点击"刷新数据"按钮
4. 确认TavernHelper有访问世界书的权限

1. Confirm current character has associated worldbook entries
2. Check if worldbook entries are enabled
3. Try clicking "Refresh Data" button
4. Confirm TavernHelper has worldbook access permissions

#### 问题4：生成失败 | Issue 4: Generation Fails
**症状 | Symptoms:** 点击生成后显示错误信息 | Shows error message after clicking generate

**解决方案 | Solutions:**
1. 检查AI后端连接是否正常
2. 确认有足够的API配额/令牌
3. 检查网络连接稳定性
4. 尝试减少上下文长度设置

1. Check if AI backend connection is stable
2. Confirm sufficient API quota/tokens available
3. Check network connection stability
4. Try reducing context length setting

### 高级故障排除 | Advanced Troubleshooting

#### 启用调试模式 | Enable Debug Mode

1. **打开浏览器控制台 | Open Browser Console**
   - 按 F12 或右键 → 检查 → 控制台
   - Press F12 or Right-click → Inspect → Console

2. **查看详细日志 | View Detailed Logs**
   - 寻找以 `[Story Weaver]` 开头的消息
   - 寻找以 `[Story Weaver UI]` 开头的UI相关消息
   - Look for messages starting with `[Story Weaver]`
   - Look for UI-related messages starting with `[Story Weaver UI]`

3. **常见错误信息 | Common Error Messages**
   ```
   [Story Weaver] TavernHelper not available
   → TavernHelper未正确安装或未运行
   → TavernHelper not properly installed or running
   
   [Story Weaver] Error getting worldbook entries
   → 世界书访问权限问题
   → Worldbook access permission issue
   
   [Story Weaver UI] Communication timeout
   → 界面通信问题，尝试重新打开
   → Interface communication issue, try reopening
   ```

#### 重置配置 | Reset Configuration

如果遇到持续问题，可以重置所有设置：
If experiencing persistent issues, reset all settings:

1. **清除保存的变量 | Clear Saved Variables**
   ```javascript
   // 在TavernHelper脚本控制台中执行 | Execute in TavernHelper script console
   TavernHelper.deleteVariable('sw_contextLength');
   TavernHelper.deleteVariable('sw_storyType');
   TavernHelper.deleteVariable('sw_storyStyle');
   // ... 清除其他变量 | ... clear other variables
   ```

2. **重新安装脚本 | Reinstall Script**
   - 删除现有的Story Weaver脚本
   - 重新按照安装步骤安装
   - Delete existing Story Weaver script
   - Reinstall following installation steps

## 📞 获取帮助 | Getting Help

### 支持渠道 | Support Channels

1. **检查文档 | Check Documentation**
   - 阅读 `README.md` 了解功能详情
   - 查看错误信息和解决方案
   - Read `README.md` for feature details
   - Review error messages and solutions

2. **社区支持 | Community Support**
   - SillyTavern官方社区
   - TavernHelper相关论坛
   - GitHub Issues (if available)
   - SillyTavern official community
   - TavernHelper related forums
   - GitHub Issues (if available)

3. **日志收集 | Log Collection**
   在报告问题时，请提供：
   When reporting issues, please provide:
   - 浏览器控制台日志 | Browser console logs
   - SillyTavern版本信息 | SillyTavern version info
   - TavernHelper版本信息 | TavernHelper version info
   - 详细的问题重现步骤 | Detailed reproduction steps

## 🔄 更新升级 | Updates and Upgrades

### 检查更新 | Check for Updates
定期检查是否有新版本的Story Weaver TavernHelper版本发布
Regularly check for new releases of Story Weaver TavernHelper version

### 升级步骤 | Upgrade Steps
1. 备份当前设置（导出配置）| Backup current settings (export config)
2. 下载新版本脚本 | Download new version script
3. 替换旧脚本内容 | Replace old script content
4. 测试功能是否正常 | Test functionality
5. 恢复个人设置（如需要）| Restore personal settings (if needed)

---

**安装完成后，使用 `/sw` 命令开始创作您的精彩故事大纲！**
**After installation, use `/sw` command to start creating amazing story outlines!** 🎭✨