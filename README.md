# Story Weaver - 故事大纲生成器

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![SillyTavern](https://img.shields.io/badge/SillyTavern-Extension-purple.svg)

一个为 SillyTavern 设计的AI驱动故事大纲生成器扩展，具有先进的聚焦系统和卫星详细块功能。

An AI-powered story outline generator extension for SillyTavern with advanced focus system and satellite detail blocks.

## ✨ 核心特性

### 🌍 智能数据读取
- **世界书集成**：自动读取并分析当前启用的世界书条目
- **角色卡解析**：提取角色设定和背景信息
- **对话历史**：可配置读取最近对话内容作为上下文

### 🎭 灵活创作配置
- **多种故事类型**：奇幻、爱情、悬疑、科幻等10+种预设类型
- **自定义主题**：支持详细的故事主题和核心冲突设定
- **叙事风格选择**：描述型、对话型、动作型等多种风格
- **可调参数**：章节数量、详细程度、特殊要求等

### 📖 专业大纲生成
- **结构化输出**：清晰的章节划分和情节安排
- **角色发展弧线**：包含主要角色的成长轨迹
- **主题深度分析**：可选的主题和象征意义解读
- **多格式导出**：支持文本、Markdown等格式

### 🛡️ 独立运行设计
- **非侵入性**：在独立UI面板中运行，不干预聊天对话
- **后台处理**：使用独立API请求，不影响当前角色扮演
- **沉浸感保护**：确保角色扮演的连续性和一致性

## 📋 系统要求

- **SillyTavern**：最新版本（推荐 1.10.0+）
- **浏览器**：Chrome 90+, Firefox 88+, Safari 14+
- **后端支持**：KoboldCPP, Oobabooga, OpenAI API 等

## 📦 安装方法 Installation

### 方法一：手动安装 Manual Installation

1. **下载扩展文件**
   - 下载本扩展的所有文件到本地
   - 或使用 Git 克隆：`git clone <repository-url>`

2. **复制到扩展目录**
   将 `story-weaver` 文件夹复制到 SillyTavern 的第三方扩展目录：
   ```
   SillyTavern/public/scripts/extensions/third-party/story-weaver/
   ```

3. **确保文件结构正确**
   ```
   SillyTavern/public/scripts/extensions/third-party/story-weaver/
   ├── manifest.json
   ├── extension.js
   ├── style.css
   └── README.md
   ```

4. **重启 SillyTavern**
   重启 SillyTavern 服务器以加载新扩展。

5. **启用扩展**
   在 SillyTavern 的扩展管理界面中找到并启用 "Story Weaver - 故事大纲生成器" 扩展。

### 方法二：Git 子模块 Git Submodule (推荐)

如果你想要更容易地更新扩展：

```bash
cd SillyTavern/public/scripts/extensions/third-party/
git submodule add <repository-url> story-weaver
```

### 验证安装 Verify Installation

安装成功后，你应该能看到：
- 扩展管理页面中显示 "Story Weaver - 故事大纲生成器"
- 聊天界面右侧出现扩展面板
- 可以使用 `/story-weaver` 或 `/sw` 斜杠命令

## 📖 使用指南

### 基础使用流程

1. **打开插件面板**
   - 点击主界面的 "📖 Story Weaver" 按钮

2. **读取世界观数据**
   - 点击 "读取当前启用的世界书" 获取设定信息
   - 可选择读取角色卡和对话历史

3. **配置创作需求**
   - 选择故事类型和叙事风格
   - 填写故事主题和核心冲突
   - 设定章节数量和详细程度

4. **生成故事大纲**
   - 点击 "🎭 生成故事大纲" 按钮
   - 等待AI处理并返回结果

5. **使用生成结果**
   - 复制大纲到剪贴板
   - 保存为文件或导出为Markdown

### 高级功能

#### 自定义Prompt模板
```javascript
// 在 script.js 中自定义生成模板
const customPrompt = `
基于以下世界观设定：{worldbook}
角色信息：{characters}
当前剧情：{context}
用户需求：{requirements}

请生成一个包含{chapters}章的{type}类型故事大纲...
`;
```

#### 批量处理
- 支持同时为多个角色生成不同视角的大纲
- 可保存常用的创作模板配置

## 🔧 开发说明

### 主要文件
- `script.js` - 扩展主逻辑
- `manifest.json` - 扩展配置
- `index.html` - 用户界面
- `style.css` - 样式文件

### 技术特性
- **智能读取**：自动解析SillyTavern世界书和角色卡数据
- **结构化生成**：生成清晰的章节大纲和故事结构
- **多种导出**：支持文本和Markdown格式导出
- **响应式UI**：适配不同屏幕尺寸

### 开发与贡献

如需修改或贡献代码：
1. Fork本项目
2. 创建功能分支
3. 提交更改并创建Pull Request

详细开发指南请参考 `DEVELOPMENT.md`

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 📞 支持

如有问题请通过 [GitHub Issues](https://github.com/your-username/story-weaver-plugin/issues) 反馈。

---

**Story Weaver** - 让每个故事都有完美的开始 ✨

*如果这个项目对您有帮助，请考虑给我们一个 ⭐ Star！*
