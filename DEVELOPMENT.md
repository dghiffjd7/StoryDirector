# Story Weaver - 开发指南

## 🔧 开发环境设置

### 1. 项目结构
```
story-weaver/
├── index.js           # SillyTavern扩展主文件
├── script.js          # 独立插件文件（兼容版本）
├── index.html         # UI结构定义
├── style.css          # 样式文件
├── manifest.json      # 扩展配置文件
├── test.html          # 开发测试页面
├── README.md          # 项目说明
└── DEVELOPMENT.md     # 开发指南（本文件）
```

### 2. 两种开发模式

#### 扩展模式 (推荐)
- **文件**: `index.js` + `manifest.json`
- **特点**: 
  - 符合SillyTavern扩展标准
  - 可访问真实的世界书和角色数据
  - 设置持久化保存
  - 通过扩展菜单访问

#### 独立模式
- **文件**: `script.js`
- **特点**:
  - 直接注入页面按钮
  - 独立运行，便于调试
  - 适合开发和测试

## 🧪 本地测试

### 1. 使用测试页面
```bash
# 在项目目录下
# 直接用浏览器打开 test.html
open test.html
```

### 2. 测试功能
- 选择测试模式（扩展模式/独立模式）
- 点击"🧪 测试插件功能"
- 观察控制台日志输出
- 测试UI交互功能

### 3. 在SillyTavern中测试
```bash
# 复制到SillyTavern扩展目录
cp -r . /path/to/SillyTavern/public/extensions/story-weaver/

# 重启SillyTavern
# 在扩展面板中启用Story Weaver
```

## 📝 代码说明

### 主要文件功能

#### `index.js` - SillyTavern扩展
- 注册扩展菜单项
- 读取真实的世界书和角色数据
- 使用SillyTavern的设置系统
- 符合扩展标准API

#### `script.js` - 独立插件
- 直接DOM操作
- 模拟数据处理
- 独立UI面板管理
- 便于开发调试

#### `index.html` - UI模板
- 完整的用户界面结构
- 响应式设计
- 可被两种模式复用

#### `style.css` - 样式系统
- CSS变量定义
- 现代化设计
- 响应式布局
- 与SillyTavern主题协调

### 关键API

#### SillyTavern扩展API
```javascript
// 获取上下文数据
const context = getContext();

// 访问世界书
context.worldInfoData.entries

// 访问角色数据
context.characters[context.characterId]

// 注册扩展菜单
$('#extensions_list').append(extensionButton);
```

#### 数据处理
```javascript
// 世界书条目过滤
const activeEntries = entries.filter(entry => !entry.disable);

// 角色信息提取
const character = context.characters[context.characterId];

// 生成大纲
const outline = generateMockOutline(formData);
```

## 🚀 部署发布

### 1. GitHub发布
```bash
# 确保所有文件已提交
git add .
git commit -m "Release v1.0.0"
git tag v1.0.0
git push origin main --tags
```

### 2. SillyTavern安装
用户可通过以下URL安装：
```
https://github.com/your-username/story-weaver-plugin
```

### 3. 版本更新
更新`manifest.json`中的版本号：
```json
{
  "version": "1.1.0",
  "auto_update": true
}
```

## 🔍 调试技巧

### 1. 浏览器开发者工具
- F12打开开发者工具
- 查看Console标签页
- 搜索"Story Weaver"相关日志

### 2. 常见问题
- **按钮不显示**: 检查脚本加载和DOM元素选择器
- **数据读取失败**: 确认SillyTavern API可用性
- **样式异常**: 检查CSS文件加载和选择器冲突

### 3. 日志输出
```javascript
console.log('[Story Weaver] 调试信息');
```

## 📚 扩展开发

### 1. 添加新功能
- 在相应的处理函数中添加逻辑
- 更新UI模板和样式
- 添加相应的事件绑定

### 2. API集成
目前使用模拟数据，可扩展为：
- 真实的AI API调用
- 更复杂的Prompt构造
- 多模型支持

### 3. 设置系统
```javascript
// 保存设置
extension_settings[extensionName] = settings;
saveSettingsDebounced();

// 读取设置
const settings = extension_settings[extensionName] || defaultSettings;
```

## 🤝 贡献指南

### 1. 代码规范
- 使用2空格缩进
- 函数和变量使用驼峰命名
- 添加适当的注释

### 2. 提交流程
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

### 3. 测试要求
- 本地测试通过
- 在SillyTavern中验证
- 确保不破坏现有功能

## 📞 支持

- **Issues**: [GitHub Issues](https://github.com/your-username/story-weaver-plugin/issues)
- **讨论**: [GitHub Discussions](https://github.com/your-username/story-weaver-plugin/discussions)
- **文档**: [项目Wiki](https://github.com/your-username/story-weaver-plugin/wiki)

---

Happy Coding! 🚀
