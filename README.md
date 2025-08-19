# Story Weaver - 故事大纲生成器

![Story Weaver Logo](https://img.shields.io/badge/Story%20Weaver-故事大纲生成器-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![SillyTavern](https://img.shields.io/badge/SillyTavern-Compatible-purple?style=flat-square)

一个为 SillyTavern 设计的智能故事大纲生成插件，能够读取世界书设定，结合用户创作需求，自动生成结构化的故事大纲，为角色扮演和小说创作提供强有力的辅助工具。

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

## 🚀 快速安装

### 方法一：直接通过SillyTavern安装（推荐）

1. **打开SillyTavern**
   启动您的SillyTavern应用

2. **进入扩展面板**
   - 点击顶部菜单栏的 "扩展" 按钮
   - 或点击右上角的扩展图标 🧩

3. **安装扩展**
   - 在扩展面板中，找到 "安装扩展" 选项
   - 输入以下GitHub仓库URL：
   ```
   https://github.com/your-username/story-weaver-plugin
   ```

4. **启用扩展**
   - 安装完成后，在扩展列表中找到 "Story Weaver"
   - 点击开关启用扩展

5. **访问插件**
   - 进入SillyTavern扩展设置（Extensions按钮）
   - 找到 "📖 Story Weaver" 扩展设置
   - 点击 "📖 打开Story Weaver面板" 按钮

### 方法二：手动安装

1. **下载插件文件**
   ```bash
   git clone https://github.com/your-username/story-weaver-plugin.git
   ```

2. **复制到SillyTavern扩展目录**
   ```
   将插件文件夹复制到：
   SillyTavern/public/extensions/story-weaver/
   ```

3. **重启SillyTavern**
   重新启动 SillyTavern 服务

4. **在扩展面板中启用**
   在扩展管理中找到并启用 "Story Weaver"

## 🔧 故障排除

### 扩展未显示在列表中

如果安装后没有看到 Story Weaver 扩展，请尝试：

1. **检查文件位置**
   ```
   确保文件位于：SillyTavern/public/extensions/story-weaver/
   ```

2. **重启SillyTavern**
   完全关闭并重新启动SillyTavern应用

3. **检查浏览器控制台**
   - 按F12打开开发者工具
   - 查看Console标签页是否有错误信息
   - 搜索"Story Weaver"相关日志

4. **手动验证文件**
   确保以下文件存在：
   - `manifest.json`
   - `script.js`  
   - `style.css`
   - `index.html`

5. **清除浏览器缓存**
   清除浏览器缓存后重新加载页面

### 扩展无法正常工作

1. **检查SillyTavern版本**
   确保使用SillyTavern 1.10.0+版本

2. **检查依赖**
   确保SillyTavern基础功能正常（世界书、角色管理等）

3. **重新安装**
   删除扩展文件夹，重新安装

如果问题仍然存在，请在[GitHub Issues](https://github.com/your-username/story-weaver-plugin/issues)中报告。

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

## ⚙️ 配置选项

### 数据读取设置
- `contextLength`: 对话历史读取长度（0-500条）
- `includeCharacter`: 是否包含角色卡信息
- `worldbookFilter`: 世界书条目过滤规则

### 生成参数
- `temperature`: 创作随机性（0.1-2.0）
- `maxTokens`: 最大生成长度
- `model`: 使用的AI模型

### 输出格式
- `includeStats`: 是否显示统计信息
- `exportFormat`: 默认导出格式
- `autoSave`: 自动保存生成结果

## 🔧 开发说明

### 项目结构
```
story-weaver/
├── index.js           # 扩展主文件（SillyTavern标准）
├── script.js          # 原始逻辑文件（兼容版本）
├── index.html         # UI结构定义
├── style.css          # 样式文件
├── manifest.json      # 扩展配置文件
├── README.md          # 说明文档
├── LICENSE            # 开源协议
└── assets/            # 资源文件
    ├── icons/         # 图标文件
    └── templates/     # 模板文件
```

### 技术架构
- **前端框架**：原生 JavaScript + HTML5 + CSS3
- **UI设计**：响应式设计，支持移动端
- **数据处理**：JSON格式的世界书和角色数据解析
- **API集成**：基于 SillyTavern 的后端API
- **扩展标准**：符合 SillyTavern 扩展规范

### 两种集成方式

#### 方式一：标准SillyTavern扩展（推荐）
- **文件**：`index.js` + `manifest.json`
- **访问**：通过扩展下拉菜单
- **优势**：完全集成，设置保存，自动更新
- **数据访问**：可读取真实的世界书和角色数据

#### 方式二：独立插件模式
- **文件**：`script.js`（原始实现）
- **访问**：直接在页面注入按钮
- **优势**：独立运行，便于调试
- **适用**：开发测试或独立部署

### 开发环境搭建
1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/story-weaver-plugin.git
   cd story-weaver-plugin
   ```

2. **安装依赖**
   ```bash
   # 无需额外依赖，直接使用原生技术
   ```

3. **测试环境**
   ```bash
   # 在本地SillyTavern中测试
   cp -r . /path/to/SillyTavern/public/extensions/story-weaver/
   ```

### 贡献指南
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 🐛 问题排查

### 常见问题

**Q: 插件按钮不显示**
A: 检查文件是否正确放置在 `SillyTavern/public/extensions/story-weaver/` 目录下，并重启SillyTavern。

**Q: 无法读取世界书**
A: 确保已在SillyTavern中启用世界书，并检查浏览器控制台是否有错误信息。

**Q: 生成大纲失败**
A: 检查后端API是否正常运行，确认网络连接，查看API密钥配置。

**Q: UI显示异常**
A: 清除浏览器缓存，检查是否有CSS冲突，尝试在不同浏览器中测试。

### 调试模式
在浏览器开发者工具中输入：
```javascript
// 启用调试模式
window.storyWeaverDebug = true;

// 查看插件状态
console.log(window.storyWeaverStatus);
```

## 🔒 隐私与安全

- **数据处理**：所有数据在本地处理，不会上传到第三方服务器
- **API安全**：使用HTTPS连接，支持API密钥加密
- **用户隐私**：不收集任何用户个人信息或聊天内容

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

## 🙏 致谢

- **SillyTavern 团队**：提供了优秀的角色扮演平台
- **JS-Slash-Runner**：参考了插件加载机制（仅限技术实现参考）
- **开源社区**：感谢所有贡献者的支持和反馈

## 📞 联系方式

- **GitHub Issues**：[问题反馈](https://github.com/your-username/story-weaver-plugin/issues)
- **Discord**：加入SillyTavern官方Discord讨论
- **Email**：your-email@example.com

## 🗺️ 发展路线

### 近期计划 (v1.1)
- [ ] 支持更多AI模型（Claude, GPT-4等）
- [ ] 增加大纲模板库
- [ ] 优化移动端体验
- [ ] 添加多语言支持

### 中期计划 (v1.5)
- [ ] 可视化大纲编辑器
- [ ] 角色关系图生成
- [ ] 情节分支预测
- [ ] 导出为思维导图

### 长期愿景 (v2.0)
- [ ] AI驱动的情节续写建议
- [ ] 多用户协作创作
- [ ] 小说出版格式支持
- [ ] 与其他创作工具集成

---

**Story Weaver** - 让每个故事都有完美的开始 ✨

*如果这个项目对您有帮助，请考虑给我们一个 ⭐ Star！*
