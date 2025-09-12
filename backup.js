/**
 * Story Weaver - SillyTavern Extension
 * Generates story outlines using world info and chat context
 */

import {
  eventSource,
  event_types,
  extension_prompt_roles,
  extension_prompt_types,
  extension_prompts,
  getRequestHeaders,
  name1,
  setExtensionPrompt,
  substituteParams,
} from '../../../script.js';
import { INJECTION_POSITION, Prompt, PromptCollection } from '../../../scripts/PromptManager.js';
import { download, parseJsonFile } from '../../../scripts/utils.js';
import { getSortedEntries, getWorldInfoPrompt } from '../../../scripts/world-info.js';
import { extension_settings, getContext } from '../../extensions.js';

// Extension name for settings
const extensionName = 'story-weaver';

// Flag to prevent duplicate loading
let presetsAlreadyLoaded = false;

// Default settings
const defaultSettings = {
  enabled: true,
  contextLength: 100,
  storyType: 'fantasy',
  detailLevel: 'detailed',
  chapterCount: 5,
  includeCharacters: true,
  includeSummary: true,
  includeThemes: false,
  // Plugin-scoped regex rules (do not affect SillyTavern core)
  // Each rule: { pattern: string, flags: string, replacement: string, target: 'prompt'|'result'|'both', enabled: boolean }
  regexRules: [],
  regexEnabled: true,
  // Complete prompt presets management (包含提示词+设置+状态)
  promptPresets: {
    default: {
      name: '默认预设',
      description: '系统默认的提示词配置',
      prompts: [], // Will be initialized from storyWeaverDefaultPrompts
      promptOrder: [], // Will be initialized from storyWeaverDefaultPromptOrder
      settings: {
        contextLength: 100,
        storyType: 'fantasy',
        detailLevel: 'detailed',
        chapterCount: 5,
        includeCharacters: true,
        includeSummary: true,
        includeThemes: false,
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
  },
  currentPromptPreset: 'default',
};

// Load settings
let settings = extension_settings[extensionName] || defaultSettings;

// ===== 版本管理系统 =====
/**
 * 版本管理器 - 管理大纲和细纲的版本历史
 */
class OutlineVersionManager {
  constructor() {
    this.currentOutlineId = null;
    this.outlines = new Map(); // 存储所有大纲和细纲
    this.history = []; // 最近5个大纲ID的历史记录
    this.maxHistorySize = 5;
    this.hotkeys = {
      enabled: true,
      annotationMode: false,
    };
    this.loadFromLocalStorage();
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return `outline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建新大纲版本
   */
  createOutline(title, content, settings = {}) {
    const id = this.generateId();
    const outline = {
      id,
      type: 'outline',
      parentId: null,
      chapterIndex: null,
      title: title || '新生成的大纲',
      content,
      timestamp: Date.now(),
      version: 1,
      settings: { ...settings },
      detailOutlines: [], // 存储关联的细纲ID
    };

    this.outlines.set(id, outline);
    this.currentOutlineId = id;

    // 更新历史记录
    this.addToHistory(id);
    this.saveToLocalStorage();

    console.log('[Version Manager] Created new outline:', id);
    return outline;
  }

  /**
   * 创建细纲版本
   */
  createDetailOutline(parentId, chapterIndex, title, content, settings = {}) {
    const parentOutline = this.outlines.get(parentId);
    if (!parentOutline) {
      throw new Error(`Parent outline ${parentId} not found`);
    }

    const id = this.generateId();
    const detailOutline = {
      id,
      type: 'detail',
      parentId,
      chapterIndex,
      title: title || `第${chapterIndex + 1}章细纲`,
      content,
      timestamp: Date.now(),
      version: 1,
      settings: { ...settings },
    };

    this.outlines.set(id, detailOutline);

    // 添加到父大纲的细纲列表
    if (!parentOutline.detailOutlines) {
      parentOutline.detailOutlines = [];
    }
    parentOutline.detailOutlines.push(id);

    this.saveToLocalStorage();

    console.log('[Version Manager] Created detail outline:', id, 'for parent:', parentId);
    return detailOutline;
  }

  /**
   * 获取大纲
   */
  getOutline(id) {
    return this.outlines.get(id);
  }

  /**
   * 获取当前大纲
   */
  getCurrentOutline() {
    return this.currentOutlineId ? this.outlines.get(this.currentOutlineId) : null;
  }

  /**
   * 删除指定版本的大纲
   */
  deleteVersion(id) {
    if (!id || !this.outlines.has(id)) return false;

    const outline = this.outlines.get(id);

    // 删除关联的细纲
    if (outline.detailOutlines) {
      outline.detailOutlines.forEach(detailId => {
        this.outlines.delete(detailId);
      });
    }

    // 从大纲集合中删除
    this.outlines.delete(id);

    // 从历史记录中移除
    this.history = this.history.filter(historyId => historyId !== id);

    // 如果删除的是当前大纲，切换到最新的历史版本
    if (this.currentOutlineId === id) {
      this.currentOutlineId = this.history.length > 0 ? this.history[0] : null;
    }

    this.saveToLocalStorage();
    console.log('[Version Manager] Deleted outline version:', id);
    return true;
  }

  /**
   * 添加到历史记录
   */
  addToHistory(id) {
    // 移除已存在的相同ID
    this.history = this.history.filter(historyId => historyId !== id);

    // 添加到开头
    this.history.unshift(id);

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      const removedIds = this.history.splice(this.maxHistorySize);
      // 清理被移除的大纲
      removedIds.forEach(removedId => {
        this.cleanupOutline(removedId);
      });
    }
  }

  /**
   * 切换到历史版本
   */
  switchToHistoryVersion(direction) {
    if (this.history.length === 0) return null;

    const currentIndex = this.history.indexOf(this.currentOutlineId);
    let newIndex;

    if (direction === 'prev') {
      newIndex = currentIndex < this.history.length - 1 ? currentIndex + 1 : 0;
    } else {
      // 'next'
      newIndex = currentIndex > 0 ? currentIndex - 1 : this.history.length - 1;
    }

    const newId = this.history[newIndex];
    const outline = this.outlines.get(newId);

    if (outline) {
      this.currentOutlineId = newId;
      this.saveToLocalStorage();
      console.log('[Version Manager] Switched to version:', newId);
      return outline;
    }

    return null;
  }

  /**
   * 清理大纲及其关联的细纲
   */
  cleanupOutline(id) {
    const outline = this.outlines.get(id);
    if (outline && outline.detailOutlines) {
      // 清理所有关联的细纲
      outline.detailOutlines.forEach(detailId => {
        this.outlines.delete(detailId);
      });
    }
    this.outlines.delete(id);
    console.log('[Version Manager] Cleaned up outline:', id);
  }

  /**
   * 获取某大纲的所有细纲
   */
  getDetailOutlines(parentId) {
    const parentOutline = this.outlines.get(parentId);
    if (!parentOutline || !parentOutline.detailOutlines) {
      return [];
    }

    return parentOutline.detailOutlines.map(id => this.outlines.get(id)).filter(outline => outline); // 过滤掉不存在的
  }

  /**
   * 保存到本地存储
   */
  saveToLocalStorage() {
    try {
      const data = {
        currentOutlineId: this.currentOutlineId,
        outlines: Object.fromEntries(this.outlines),
        history: this.history,
        hotkeys: this.hotkeys,
        timestamp: Date.now(),
      };

      localStorage.setItem('storyWeaver_versions', JSON.stringify(data));
      console.log('[Version Manager] Saved to localStorage');
    } catch (error) {
      console.error('[Version Manager] Failed to save to localStorage:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('storyWeaver_versions');
      if (stored) {
        const data = JSON.parse(stored);
        this.currentOutlineId = data.currentOutlineId;
        this.outlines = new Map(Object.entries(data.outlines || {}));
        this.history = data.history || [];
        this.hotkeys = { ...this.hotkeys, ...data.hotkeys };

        console.log('[Version Manager] Loaded from localStorage:', this.outlines.size, 'outlines');
      }
    } catch (error) {
      console.error('[Version Manager] Failed to load from localStorage:', error);
    }
  }

  /**
   * 导出所有数据到JSON
   */
  exportToJSON() {
    return {
      version: '1.0.0',
      type: 'story_weaver_versions',
      timestamp: Date.now(),
      data: {
        currentOutlineId: this.currentOutlineId,
        outlines: Object.fromEntries(this.outlines),
        history: this.history,
        hotkeys: this.hotkeys,
      },
    };
  }

  /**
   * 从JSON导入数据
   */
  importFromJSON(jsonData) {
    try {
      if (jsonData.type !== 'story_weaver_versions') {
        throw new Error('Invalid import format');
      }

      const data = jsonData.data;
      this.currentOutlineId = data.currentOutlineId;
      this.outlines = new Map(Object.entries(data.outlines || {}));
      this.history = data.history || [];
      this.hotkeys = { ...this.hotkeys, ...data.hotkeys };

      this.saveToLocalStorage();
      console.log('[Version Manager] Imported data successfully');
      return true;
    } catch (error) {
      console.error('[Version Manager] Failed to import data:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   */
  clear() {
    this.currentOutlineId = null;
    this.outlines.clear();
    this.history = [];
    this.saveToLocalStorage();
    console.log('[Version Manager] Cleared all data');
  }
}

// 创建全局版本管理器实例
const versionManager = new OutlineVersionManager();

// ===== 生成请求状态管理 =====
let isGenerating = false;

// ===== 热键系统 =====
/**
 * 热键管理器 - 处理键盘快捷键
 */
class HotkeyManager {
  constructor(versionManager) {
    this.versionManager = versionManager;
    this.isEnabled = true;
    this.init();
  }

  init() {
    // 绑定全局键盘事件
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    console.log('[Hotkey Manager] Initialized');
  }

  /**
   * 处理按键事件
   */
  handleKeyDown(event) {
    if (!this.isEnabled) return;

    // 检查是否在Story Weaver面板中 - 修复显示检查逻辑
    const storyWeaverPanel = document.getElementById('story-weaver-panel');
    if (!storyWeaverPanel || storyWeaverPanel.style.display === 'none') {
      return; // 面板未打开时不响应热键
    }

    console.log(
      '[Hotkey Manager] Key pressed:',
      event.code,
      'Alt:',
      event.altKey,
      'Panel visible:',
      storyWeaverPanel.style.display !== 'none',
    );

    // 处理版本切换热键 (Alt + ArrowUp/ArrowDown)
    if (event.altKey) {
      if (event.code === 'ArrowUp') {
        event.preventDefault();
        console.log('[Hotkey Manager] Switching to previous version');
        this.switchToPreviousVersion();
        return;
      } else if (event.code === 'ArrowDown') {
        event.preventDefault();
        console.log('[Hotkey Manager] Switching to next version');
        this.switchToNextVersion();
        return;
      }
    }

    // 处理备注模式切换 (Alt + A)
    if (event.altKey && event.code === 'KeyA') {
      event.preventDefault();
      console.log('[Hotkey Manager] Toggling annotation mode');
      this.toggleAnnotationMode();
      return;
    }

    // 处理编辑模式 (Ctrl/Cmd + E)
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyE') {
      event.preventDefault();
      console.log('[Hotkey Manager] Toggling edit mode');
      this.toggleEditMode();
      return;
    }
  }

  /**
   * 检查是否按下了Fn键
   * 由于浏览器限制，Fn键检测需要组合其他键
   * 已移除，直接在handleKeyDown中检查event.altKey
   */
  isFnKeyPressed(event) {
    // 已废弃，直接使用event.altKey
    return event.altKey;
  }

  /**
   * 切换到上一个版本
   */
  switchToPreviousVersion() {
    const previousOutline = this.versionManager.switchToHistoryVersion('prev');
    if (previousOutline) {
      this.displayOutline(previousOutline);
      this.showVersionSwitchNotification('上一个版本', previousOutline);
    } else {
      this.showNotification('没有更多的历史版本了', 'warning');
    }
  }

  /**
   * 切换到下一个版本
   */
  switchToNextVersion() {
    const nextOutline = this.versionManager.switchToHistoryVersion('next');
    if (nextOutline) {
      this.displayOutline(nextOutline);
      this.showVersionSwitchNotification('下一个版本', nextOutline);
    } else {
      this.showNotification('没有更多的历史版本了', 'warning');
    }
  }

  /**
   * 切换备注模式
   */
  toggleAnnotationMode() {
    this.versionManager.hotkeys.annotationMode = !this.versionManager.hotkeys.annotationMode;
    this.versionManager.saveToLocalStorage();

    const mode = this.versionManager.hotkeys.annotationMode ? '开启' : '关闭';
    this.showNotification(`备注模式已${mode}`, 'info');

    // 更新UI显示
    this.updateAnnotationModeUI();
  }

  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    const outputContent = document.getElementById('output-content');
    if (outputContent) {
      const isEditable = outputContent.contentEditable === 'true';
      outputContent.contentEditable = !isEditable;

      if (!isEditable) {
        outputContent.focus();
        outputContent.style.backgroundColor = '#2a2a2a';
        outputContent.style.border = '2px solid #667eea';
        this.showNotification('编辑模式已开启 (Ctrl/Cmd+E 退出)', 'info');
      } else {
        outputContent.style.backgroundColor = '';
        outputContent.style.border = '';
        this.showNotification('编辑模式已关闭', 'info');
      }
    }
  }

  /**
   * 显示大纲内容
   */
  displayOutline(outline) {
    const outputContent = document.getElementById('output-content');
    const outputPlaceholder = document.getElementById('output-placeholder');
    const outputStats = document.getElementById('output-stats');

    if (outputPlaceholder) outputPlaceholder.style.display = 'none';
    if (outputStats) outputStats.classList.remove('hidden');

    // 清理内容中的HTML标签（如果存在历史HTML数据）
    const cleanContent = cleanHTMLContent(outline.content);

    // 使用专门的显示函数来正确渲染段落结构
    displayResults(cleanContent, outline);

    // 更新统计信息
    this.updateOutlineStats(outline);

    // 更新版本信息显示
    this.updateVersionInfo(outline);
  }

  /**
   * 更新大纲统计信息
   */
  updateOutlineStats(outline) {
    const wordCount = document.getElementById('word-count');
    const generationTime = document.getElementById('generation-time');
    const actualChapters = document.getElementById('actual-chapters');

    if (wordCount) {
      wordCount.textContent = outline.content.replace(/<[^>]*>/g, '').length;
    }

    if (generationTime) {
      const time = new Date(outline.timestamp);
      generationTime.textContent = time.toLocaleString();
    }

    if (actualChapters) {
      const chapters = (outline.content.match(/第.*章/g) || []).length;
      actualChapters.textContent = chapters || outline.settings.chapterCount || 0;
    }
  }

  /**
   * 更新版本信息显示
   */
  updateVersionInfo(outline) {
    // 如果版本信息面板不存在，创建它
    let versionInfo = document.getElementById('version-info');
    if (!versionInfo) {
      versionInfo = document.createElement('div');
      versionInfo.id = 'version-info';
      versionInfo.className = 'version-info';

      const outputSection = document.getElementById('output-section');
      if (outputSection) {
        const sectionTitle = outputSection.querySelector('.section-title');
        if (sectionTitle) {
          sectionTitle.appendChild(versionInfo);
        }
      }
    }

    const historyIndex = this.versionManager.history.indexOf(outline.id);
    const historyLength = this.versionManager.history.length;

    versionInfo.innerHTML = `
      <span class="version-badge" title="当前版本: ${outline.id}">
        📜 ${historyIndex + 1}/${historyLength}
      </span>
    `;
  }

  /**
   * 更新备注模式UI
   */
  updateAnnotationModeUI() {
    const annotationIndicator =
      document.getElementById('annotation-mode-indicator') || this.createAnnotationIndicator();

    if (this.versionManager.hotkeys.annotationMode) {
      annotationIndicator.style.display = 'block';
      annotationIndicator.textContent = '✏️ 备注模式';
      annotationIndicator.title = '当前处于备注模式，编辑内容将被引号包裹并重新提交给AI';
    } else {
      annotationIndicator.style.display = 'none';
    }
  }

  /**
   * 创建备注模式指示器
   */
  createAnnotationIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'annotation-mode-indicator';
    indicator.className = 'annotation-mode-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #667eea;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      z-index: 10000;
      display: none;
    `;

    document.body.appendChild(indicator);
    return indicator;
  }

  /**
   * 显示版本切换通知
   */
  showVersionSwitchNotification(direction, outline) {
    const historyIndex = this.versionManager.history.indexOf(outline.id);
    const time = new Date(outline.timestamp).toLocaleString();

    this.showNotification(
      `${direction}: ${outline.title} (${historyIndex + 1}/${this.versionManager.history.length}) - ${time}`,
      'success',
      3000,
    );
  }

  /**
   * 显示通知
   */
  showNotification(message, type = 'info', duration = 2000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `hotkey-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : '#2196F3'};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 10001;
      max-width: 400px;
      text-align: center;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(notification);

    // 自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, duration);
  }

  /**
   * 启用/禁用热键
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log('[Hotkey Manager] Hotkeys', enabled ? 'enabled' : 'disabled');
  }
}

// 创建全局热键管理器实例
const hotkeyManager = new HotkeyManager(versionManager);

// ===== 编辑功能系统 =====
/**
 * 编辑管理器 - 处理大纲和细纲的编辑功能
 */
class EditManager {
  constructor(versionManager, hotkeyManager) {
    this.versionManager = versionManager;
    this.hotkeyManager = hotkeyManager;
    this.isEditMode = false;
    this.editableElements = new Set();
    this.originalContent = new Map();
    this.annotationSelections = new Map(); // 存储备注模式的选择
    this.init();
  }

  init() {
    // 监听输出内容的变化，自动添加编辑功能
    this.observeOutputChanges();
    console.log('[Edit Manager] Initialized');
  }

  /**
   * 观察输出内容的变化
   */
  observeOutputChanges() {
    const outputSection = document.getElementById('output-section');
    if (outputSection) {
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            // 检查是否有新的段落内容需要添加编辑功能
            const outlineParagraphs = document.getElementById('outline-paragraphs');
            if (outlineParagraphs && !outlineParagraphs.classList.contains('hidden')) {
              this.setupEditableContent();
            }
          }
        });
      });

      observer.observe(outputSection, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * 设置可编辑内容
   */
  setupEditableContent() {
    const outlineParagraphs = document.getElementById('outline-paragraphs');
    if (!outlineParagraphs) return;

    // 查找所有段落、标题等可编辑元素
    const editableSelectors = [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'div[class*="chapter"]',
      'div[class*="section"]',
      'li',
      'blockquote',
      '.paragraph-content',
    ];

    editableSelectors.forEach(selector => {
      const elements = outlineParagraphs.querySelectorAll(selector);
      elements.forEach(element => {
        if (!this.editableElements.has(element)) {
          this.addEditFeatures(element);
        }
      });
    });
  }

  /**
   * 为元素添加编辑功能
   */
  addEditFeatures(element) {
    this.editableElements.add(element);

    // 双击编辑由原有系统处理，此处不再添加

    // 添加编辑提示
    element.style.cursor = 'pointer';
    element.title = '双击编辑 (Alt+上/下 切换版本, Alt+A 切换备注模式)';
  }

  /**
   * 复制元素内容
   */
  async copyElementContent(element) {
    const content = element.textContent || element.innerText || '';

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(content);
      } else {
        // 兼容性处理
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      this.hotkeyManager.showNotification('内容已复制到剪贴板', 'success');
    } catch (error) {
      console.error('[Edit Manager] Copy failed:', error);
      this.hotkeyManager.showNotification('复制失败', 'error');
    }
  }

  /**
   * 为单个段落生成细纲
   */
  async generateDetailForParagraph(element) {
    const currentOutline = this.versionManager.getCurrentOutline();
    if (!currentOutline) {
      this.hotkeyManager.showNotification('请先生成主要大纲', 'warning');
      return;
    }

    const content = element.textContent || element.innerText || '';
    if (content.length < 10) {
      this.hotkeyManager.showNotification('段落内容太短，无法生成细纲', 'warning');
      return;
    }

    try {
      this.hotkeyManager.showNotification('正在为此段落生成细纲...', 'info', 3000);

      // 构建细纲生成提示词
      const detailPrompt = `
请基于以下故事大纲中的特定段落，生成详细的细纲：

【整体故事大纲】
${currentOutline.content}

【目标段落】
${content}

【任务要求】
1. 仔细理解目标段落在整体故事中的作用和位置
2. 为这个段落生成详细的细纲，包含：
   - 具体的情节发展
   - 关键场景描述
   - 角色行动和对话要点
   - 情感变化和氛围营造
   - 与前后情节的衔接

【输出格式】
请以详细的段落形式输出细纲，包含具体的场景描述和情节点。

【注意事项】
- 确保细纲与整体大纲和目标段落保持一致
- 提供足够的细节以指导具体的写作
- 保持故事的连贯性和逻辑性

请开始生成细纲：
      `;

      // 调用AI生成细纲
      let result = '';
      if (window.TavernHelper?.generateRaw) {
        result = await window.TavernHelper.generateRaw({
          ordered_prompts: [
            { role: 'system', content: '你是一个专业的故事策划师，擅长创作详细的段落细纲。' },
            { role: 'user', content: detailPrompt },
          ],
          max_chat_history: 0,
          should_stream: false,
        });
      } else if (typeof window.generateRaw === 'function') {
        result = await window.generateRaw({
          ordered_prompts: [
            { role: 'system', content: '你是一个专业的故事策划师，擅长创作详细的段落细纲。' },
            { role: 'user', content: detailPrompt },
          ],
          max_chat_history: 0,
          should_stream: false,
        });
      } else {
        throw new Error('未找到可用的生成接口');
      }

      if (!result || result.trim().length < 20) {
        throw new Error('生成的细纲内容过短');
      }

      // 显示生成结果
      this.showParagraphDetailResult(content.substring(0, 50), result.trim());
      this.hotkeyManager.showNotification('段落细纲生成完成', 'success');
    } catch (error) {
      console.error('[Edit Manager] Paragraph detail generation failed:', error);
      this.hotkeyManager.showNotification('细纲生成失败: ' + error.message, 'error');
    }
  }

  /**
   * 显示段落细纲结果
   */
  showParagraphDetailResult(paragraphPreview, detailContent) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #1a1a1a;
      border-radius: 12px;
      padding: 24px;
      max-width: 700px;
      width: 95%;
      max-height: 80%;
      overflow-y: auto;
      color: #e0e0e0;
    `;

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #FF9800; font-size: 20px;">
        📝 段落细纲
      </h3>
      
      <div style="background: #2a2a2a; padding: 12px; border-radius: 6px; margin-bottom: 16px; border-left: 4px solid #FF9800;">
        <strong style="color: #FF9800;">原段落：</strong>
        <div style="margin-top: 8px; font-size: 14px; color: #ccc;">${paragraphPreview}...</div>
      </div>

      <div style="background: #2a2a2a; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <strong style="color: #4CAF50; display: block; margin-bottom: 12px;">生成的细纲：</strong>
        <div style="white-space: pre-wrap; line-height: 1.6; font-size: 14px;">
          ${detailContent}
        </div>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="copy-paragraph-detail" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          复制细纲
        </button>
        <button id="send-paragraph-detail" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          发送到聊天
        </button>
        <button id="close-paragraph-detail" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          关闭
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 绑定按钮事件
    modal.querySelector('#copy-paragraph-detail').addEventListener('click', async () => {
      await this.copyTextToClipboard(detailContent);
      this.hotkeyManager.showNotification('细纲已复制到剪贴板', 'success');
    });

    modal.querySelector('#send-paragraph-detail').addEventListener('click', () => {
      const formattedContent = `📝 段落细纲\n\n原段落：${paragraphPreview}...\n\n细纲内容：\n${detailContent}`;
      // 这里需要引用dragManager，但为了避免循环依赖，我们直接调用其方法
      if (window.dragManager) {
        window.dragManager.sendToChat(formattedContent);
      }
      modal.remove();
    });

    modal.querySelector('#close-paragraph-detail').addEventListener('click', () => {
      modal.remove();
    });

    // 点击背景关闭
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * 删除元素
   */
  deleteElement(element) {
    if (confirm('确定要删除这个段落吗？此操作无法撤销。')) {
      element.style.transition = 'all 0.3s ease';
      element.style.opacity = '0';
      element.style.transform = 'scale(0.8)';

      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);

          // 更新大纲内容
          this.updateOutlineContent(element, '');
          this.hotkeyManager.showNotification('段落已删除', 'success');
        }
      }, 300);
    }
  }

  /**
   * 复制文本到剪贴板
   */
  async copyTextToClipboard(text) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * 开始编辑元素
   */
  startEditing(element) {
    if (this.isElementBeingEdited(element)) return;

    console.log('[Edit Manager] Starting edit for element:', element);

    // 保存原始内容
    this.originalContent.set(element, element.innerHTML);

    // 设置为可编辑
    element.contentEditable = true;
    element.focus();

    // 添加编辑样式
    element.style.backgroundColor = '#2a2a2a';
    element.style.border = '2px solid #667eea';
    element.style.padding = '8px';
    element.style.outline = 'none';

    // 选中所有文本
    this.selectAllText(element);

    // 创建编辑控制按钮
    this.createEditControls(element);

    // 监听按键事件
    this.setupEditKeyHandlers(element);

    this.isEditMode = true;
  }

  /**
   * 选中元素中的所有文本
   */
  selectAllText(element) {
    if (window.getSelection) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  /**
   * 创建编辑控制按钮
   */
  createEditControls(element) {
    const controlsId = 'edit-controls-' + Date.now();
    const controls = document.createElement('div');
    controls.id = controlsId;
    controls.className = 'edit-controls';
    controls.style.cssText = `
      position: absolute;
      background: #333;
      border-radius: 6px;
      padding: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      display: flex;
      gap: 6px;
    `;

    // 保存按钮
    const saveBtn = this.createControlButton('✓', 'green', '保存更改', () => {
      this.saveEdit(element);
    });

    // 取消按钮
    const cancelBtn = this.createControlButton('✗', 'red', '取消编辑', () => {
      this.cancelEdit(element);
    });

    // 备注模式按钮
    const annotationBtn = this.createControlButton('📝', 'blue', '提交给AI修改', () => {
      this.submitToAIForModification(element);
    });

    controls.appendChild(saveBtn);
    controls.appendChild(cancelBtn);
    controls.appendChild(annotationBtn);

    // 定位控制面板
    const rect = element.getBoundingClientRect();
    controls.style.left = rect.left + 'px';
    controls.style.top = rect.bottom + 10 + 'px';

    document.body.appendChild(controls);

    // 存储控制面板引用
    element.dataset.controlsId = controlsId;
  }

  /**
   * 创建控制按钮
   */
  createControlButton(text, color, title, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.title = title;
    btn.style.cssText = `
      background: ${color === 'green' ? '#4CAF50' : color === 'red' ? '#f44336' : '#2196F3'};
      color: white;
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
    `;

    btn.addEventListener('click', onClick);
    return btn;
  }

  /**
   * 设置编辑时的按键处理
   */
  setupEditKeyHandlers(element) {
    const keyHandler = e => {
      // Enter键保存
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.saveEdit(element);
        return;
      }

      // Escape键取消
      if (e.key === 'Escape') {
        e.preventDefault();
        this.cancelEdit(element);
        return;
      }
    };

    element.addEventListener('keydown', keyHandler);
    element.dataset.keyHandler = 'attached';
  }

  /**
   * 保存编辑
   */
  saveEdit(element) {
    console.log('[Edit Manager] Saving edit for element:', element);

    const newContent = element.innerHTML;
    const originalContent = this.originalContent.get(element);

    if (newContent !== originalContent) {
      // 更新当前大纲的内容
      this.updateOutlineContent(element, newContent);
      this.hotkeyManager.showNotification('内容已保存', 'success');
    }

    this.finishEditing(element);
  }

  /**
   * 取消编辑
   */
  cancelEdit(element) {
    console.log('[Edit Manager] Canceling edit for element:', element);

    const originalContent = this.originalContent.get(element);
    if (originalContent) {
      element.innerHTML = originalContent;
    }

    this.finishEditing(element);
    this.hotkeyManager.showNotification('已取消编辑', 'info');
  }

  /**
   * 提交给AI修改
   */
  async submitToAIForModification(element) {
    const currentContent = element.innerHTML.replace(/<[^>]*>/g, ''); // 去除HTML标签
    const originalContent = this.originalContent.get(element);

    // 构建修改提示
    let modificationPrompt = '';
    if (this.versionManager.hotkeys.annotationMode) {
      modificationPrompt = `请根据以下修改指示来调整内容：

原始内容：
${originalContent.replace(/<[^>]*>/g, '')}

修改后的内容：
"${currentContent}"

请理解引号中的内容，并据此对原始内容进行适当的修改和优化。保持原有的文本格式和结构。`;
    } else {
      modificationPrompt = `请优化以下内容，使其更加完善：

${currentContent}

请保持原有的文本格式和结构，只进行内容的优化和完善。`;
    }

    try {
      this.hotkeyManager.showNotification('正在提交给AI修改...', 'info', 3000);

      // 调用AI API进行修改
      const modifiedContent = await this.callAIForModification(modificationPrompt);

      if (modifiedContent) {
        // 将修改后的内容应用到元素
        element.innerHTML = modifiedContent;
        this.hotkeyManager.showNotification('AI修改完成', 'success');
      } else {
        this.hotkeyManager.showNotification('AI修改失败，请重试', 'warning');
      }
    } catch (error) {
      console.error('[Edit Manager] AI modification failed:', error);
      this.hotkeyManager.showNotification('AI修改过程中出现错误', 'warning');
    }
  }

  /**
   * 调用AI进行内容修改
   */
  async callAIForModification(prompt) {
    // 这里需要调用现有的AI生成函数
    // 复用generateStoryOutline中的API调用逻辑
    try {
      // 简化的API调用，实际应该复用现有的生成逻辑
      const response = await fetch('/api/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getRequestHeaders(),
        },
        body: JSON.stringify({
          prompt: prompt,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.text || data.content;
      }
    } catch (error) {
      console.error('[Edit Manager] API call failed:', error);
    }

    return null;
  }

  /**
   * 完成编辑
   */
  finishEditing(element) {
    // 移除编辑样式
    element.contentEditable = false;
    element.style.backgroundColor = '';
    element.style.border = '';
    element.style.padding = '';
    element.style.outline = '';

    // 移除控制面板
    const controlsId = element.dataset.controlsId;
    if (controlsId) {
      const controls = document.getElementById(controlsId);
      if (controls) {
        controls.remove();
      }
      delete element.dataset.controlsId;
    }

    // 清理存储的内容
    this.originalContent.delete(element);

    this.isEditMode = false;
  }

  /**
   * 更新大纲内容
   */
  updateOutlineContent(element, newContent) {
    const currentOutline = this.versionManager.getCurrentOutline();
    if (currentOutline) {
      // 使用重建函数获取纯文本内容，避免保存HTML标签
      const outlineContent = reconstructOutlineContent();
      if (outlineContent) {
        currentOutline.content = outlineContent;
        this.versionManager.saveToLocalStorage();
        console.log('[Edit Manager] Updated outline content');
      }

      // 实时保存并检查是否需要删除空大纲
      updateCurrentOutlineInVersionManager();

      // 更新版本显示
      updateVersionDisplayIfNeeded();
    }
  }

  /**
   * 检查元素是否正在编辑
   */
  isElementBeingEdited(element) {
    return element.contentEditable === 'true';
  }

  /**
   * 清理所有编辑状态
   */
  cleanup() {
    this.editableElements.forEach(element => {
      if (this.isElementBeingEdited(element)) {
        this.cancelEdit(element);
      }
    });

    this.editableElements.clear();
    this.originalContent.clear();
    this.annotationSelections.clear();
    this.isEditMode = false;
  }
}

// 创建全局编辑管理器实例
const editManager = new EditManager(versionManager, hotkeyManager);

// ===== 拖拽功能系统 =====
/**
 * 拖拽管理器 - 处理内容拖拽到聊天区域
 */
class DragManager {
  constructor(versionManager, hotkeyManager) {
    this.versionManager = versionManager;
    this.hotkeyManager = hotkeyManager;
    this.isDragging = false;
    this.dragElement = null;
    this.dragPreview = null;
    this.draggableElements = new Set();
    this.dropZone = null;
    this.init();
  }

  init() {
    this.createDropZone();
    this.setupGlobalDragEvents();
    console.log('[Drag Manager] Initialized');
  }

  /**
   * 创建放置区域指示器
   */
  createDropZone() {
    this.dropZone = document.createElement('div');
    this.dropZone.id = 'story-weaver-drop-zone';
    this.dropZone.className = 'story-weaver-drop-zone';
    this.dropZone.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(102, 126, 234, 0.1);
      backdrop-filter: blur(2px);
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    `;

    const dropMessage = document.createElement('div');
    dropMessage.style.cssText = `
      background: #667eea;
      color: white;
      padding: 20px 40px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: bold;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      text-align: center;
    `;
    dropMessage.innerHTML = `
      📤 拖拽到此处发送到聊天<br>
      <small style="font-weight: normal; opacity: 0.9;">松开鼠标即可将内容添加到当前对话</small>
    `;

    this.dropZone.appendChild(dropMessage);
    document.body.appendChild(this.dropZone);
  }

  /**
   * 设置全局拖拽事件
   */
  setupGlobalDragEvents() {
    document.addEventListener('dragstart', this.handleDragStart.bind(this));
    document.addEventListener('dragend', this.handleDragEnd.bind(this));
    document.addEventListener('dragover', this.handleDragOver.bind(this));
    document.addEventListener('drop', this.handleDrop.bind(this));
  }

  /**
   * 为元素添加拖拽功能
   */
  makeDraggable(element) {
    if (this.draggableElements.has(element)) return;

    this.draggableElements.add(element);
    element.draggable = true;
    element.dataset.draggableContent = 'true';

    // 添加拖拽手柄
    this.addDragHandle(element);

    // 添加拖拽相关样式
    element.style.position = 'relative';
  }

  /**
   * 添加拖拽手柄
   */
  addDragHandle(element) {
    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.innerHTML = '⋮⋮';
    handle.title = '拖拽此内容到聊天区域';
    handle.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      width: 20px;
      height: 20px;
      background: rgba(102, 126, 234, 0.8);
      color: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: move;
      font-size: 12px;
      line-height: 1;
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: 100;
    `;

    // 悬浮显示拖拽手柄
    element.addEventListener('mouseenter', () => {
      handle.style.opacity = '1';
    });

    element.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        handle.style.opacity = '0';
      }
    });

    // 防止拖拽手柄上的双击事件冒泡到编辑功能
    handle.addEventListener('dblclick', e => {
      e.stopPropagation();
    });

    element.appendChild(handle);
  }

  /**
   * 处理拖拽开始
   */
  handleDragStart(event) {
    const element = event.target.closest('[data-draggable-content="true"]');
    if (!element) return;

    this.isDragging = true;
    this.dragElement = element;

    // 获取元素内容（去除HTML标签）
    const content = this.getElementTextContent(element);

    // 设置拖拽数据
    event.dataTransfer.setData('text/plain', content);
    event.dataTransfer.setData('text/html', element.innerHTML);
    event.dataTransfer.setData(
      'application/story-weaver',
      JSON.stringify({
        content: content,
        html: element.innerHTML,
        timestamp: Date.now(),
        outlineId: this.versionManager.currentOutlineId,
      }),
    );

    // 创建拖拽预览
    this.createDragPreview(element, content);

    // 设置拖拽效果
    event.dataTransfer.effectAllowed = 'copy';

    // 添加拖拽状态样式
    element.classList.add('dragging');

    console.log('[Drag Manager] Drag started:', content.substring(0, 50) + '...');
  }

  /**
   * 创建拖拽预览
   */
  createDragPreview(element, content) {
    this.dragPreview = document.createElement('div');
    this.dragPreview.style.cssText = `
      position: absolute;
      top: -1000px;
      left: -1000px;
      max-width: 300px;
      background: #333;
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
    `;

    this.dragPreview.textContent = content.substring(0, 100) + (content.length > 100 ? '...' : '');
    document.body.appendChild(this.dragPreview);

    // 设置为拖拽图像
    event.dataTransfer.setDragImage(this.dragPreview, 10, 10);
  }

  /**
   * 处理拖拽结束
   */
  handleDragEnd(event) {
    if (this.dragElement) {
      this.dragElement.classList.remove('dragging');
      this.dragElement = null;
    }

    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }

    this.dropZone.style.display = 'none';
    this.isDragging = false;

    console.log('[Drag Manager] Drag ended');
  }

  /**
   * 处理拖拽悬浮
   */
  handleDragOver(event) {
    if (!this.isDragging) return;

    event.preventDefault();

    // 检查是否拖拽到插件窗口外部
    const storyWeaverPanel = document.getElementById('story-weaver-panel');
    if (storyWeaverPanel) {
      const panelRect = storyWeaverPanel.getBoundingClientRect();
      const isOutsidePanel =
        event.clientX < panelRect.left ||
        event.clientX > panelRect.right ||
        event.clientY < panelRect.top ||
        event.clientY > panelRect.bottom;

      if (isOutsidePanel) {
        this.dropZone.style.display = 'flex';
        event.dataTransfer.dropEffect = 'copy';
      } else {
        this.dropZone.style.display = 'none';
        event.dataTransfer.dropEffect = 'none';
      }
    }
  }

  /**
   * 处理放置
   */
  handleDrop(event) {
    if (!this.isDragging) return;

    event.preventDefault();

    // 检查是否放置在插件窗口外部
    const storyWeaverPanel = document.getElementById('story-weaver-panel');
    if (storyWeaverPanel) {
      const panelRect = storyWeaverPanel.getBoundingClientRect();
      const isOutsidePanel =
        event.clientX < panelRect.left ||
        event.clientX > panelRect.right ||
        event.clientY < panelRect.top ||
        event.clientY > panelRect.bottom;

      if (isOutsidePanel) {
        // 获取拖拽的内容
        const content = event.dataTransfer.getData('text/plain');
        const storyWeaverData = event.dataTransfer.getData('application/story-weaver');

        if (content) {
          this.sendToChat(content, storyWeaverData);
        }
      }
    }

    this.dropZone.style.display = 'none';
  }

  /**
   * 发送内容到聊天
   */
  sendToChat(content, storyWeaverData = null) {
    try {
      // 尝试获取SillyTavern的聊天输入框
      const chatInput =
        document.querySelector('#send_textarea') ||
        document.querySelector('textarea[placeholder*="输入"]') ||
        document.querySelector('textarea[placeholder*="Type"]');

      if (chatInput) {
        // 格式化内容
        let formattedContent = content;

        if (storyWeaverData) {
          try {
            const data = JSON.parse(storyWeaverData);
            formattedContent = `📖 来自Story Weaver的大纲内容：\n\n${content}`;
          } catch (e) {
            // 忽略JSON解析错误
          }
        }

        // 设置到聊天输入框
        chatInput.value = formattedContent;
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';

        // 触发输入事件以更新SillyTavern的状态
        chatInput.dispatchEvent(new Event('input', { bubbles: true }));
        chatInput.focus();

        // 显示成功通知
        this.hotkeyManager.showNotification('内容已添加到聊天框', 'success');

        console.log('[Drag Manager] Content sent to chat:', content.substring(0, 50) + '...');
      } else {
        // 如果找不到聊天输入框，尝试其他方法
        this.fallbackSendToChat(content);
      }
    } catch (error) {
      console.error('[Drag Manager] Failed to send to chat:', error);
      this.hotkeyManager.showNotification('发送到聊天失败', 'warning');
    }
  }

  /**
   * 备用发送到聊天的方法
   */
  fallbackSendToChat(content) {
    // 复制到剪贴板作为备用方案
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        this.hotkeyManager.showNotification('内容已复制到剪贴板，请手动粘贴到聊天框', 'info', 4000);
      });
    } else {
      // 更老的浏览器的兼容方法
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      this.hotkeyManager.showNotification('内容已复制到剪贴板，请手动粘贴到聊天框', 'info', 4000);
    }
  }

  /**
   * 获取元素的纯文本内容
   */
  getElementTextContent(element) {
    // 创建临时元素来获取纯文本
    const temp = document.createElement('div');
    temp.innerHTML = element.innerHTML;

    // 处理换行和格式
    const textContent = temp.textContent || temp.innerText || '';

    // 清理多余的空白字符
    return textContent.replace(/\s+/g, ' ').trim();
  }

  /**
   * 为输出内容设置拖拽功能
   */
  setupDraggableOutput() {
    const outlineParagraphs = document.getElementById('outline-paragraphs');
    if (!outlineParagraphs) return;

    // 为整个大纲容器添加拖拽功能
    this.makeDraggable(outlineParagraphs);

    // 为个别段落添加拖拽功能
    const draggableSelectors = [
      'p',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'div[class*="chapter"]',
      'div[class*="section"]',
      'li',
      'blockquote',
    ];

    draggableSelectors.forEach(selector => {
      const elements = outlineParagraphs.querySelectorAll(selector);
      elements.forEach(element => {
        // 只对有实质内容的元素添加拖拽功能
        if (element.textContent.trim().length > 10) {
          this.makeDraggable(element);
        }
      });
    });
  }

  /**
   * 清理拖拽功能
   */
  cleanup() {
    this.draggableElements.forEach(element => {
      element.draggable = false;
      delete element.dataset.draggableContent;

      // 移除拖拽手柄
      const handle = element.querySelector('.drag-handle');
      if (handle) {
        handle.remove();
      }
    });

    this.draggableElements.clear();
    this.isDragging = false;
    this.dragElement = null;
  }
}

// 创建全局拖拽管理器实例
const dragManager = new DragManager(versionManager, hotkeyManager);
window.dragManager = dragManager; // 提供全局访问

// ===== 细纲生成系统 =====
/**
 * 细纲生成管理器 - 处理章节细纲的生成和管理
 */
class DetailOutlineManager {
  constructor(versionManager, hotkeyManager) {
    this.versionManager = versionManager;
    this.hotkeyManager = hotkeyManager;
    this.selectedChapters = new Set();
    this.isGenerating = false;
    this.init();
  }

  init() {
    this.setupUI();
    console.log('[Detail Outline Manager] Initialized');
  }

  /**
   * 设置用户界面
   */
  setupUI() {
    // 绑定细纲生成按钮
    document.addEventListener('DOMContentLoaded', () => {
      const generateDetailsBtn = document.getElementById('generate-details');
      if (generateDetailsBtn) {
        generateDetailsBtn.addEventListener('click', () => {
          this.showChapterSelectionDialog();
        });
      }
    });
  }

  /**
   * 显示章节选择对话框
   */
  showChapterSelectionDialog() {
    const currentOutline = this.versionManager.getCurrentOutline();
    if (!currentOutline) {
      this.hotkeyManager.showNotification('请先生成大纲', 'warning');
      return;
    }

    // 分析大纲内容，提取章节
    const chapters = this.extractChaptersFromOutline(currentOutline.content);
    if (chapters.length === 0) {
      this.hotkeyManager.showNotification('在大纲中未找到章节，请确保大纲包含章节标题', 'warning');
      return;
    }

    // 创建章节选择对话框
    this.createChapterSelectionModal(chapters);
  }

  /**
   * 从大纲内容中提取章节
   */
  extractChaptersFromOutline(content) {
    const chapters = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // 查找章节标题的多种模式
    const chapterPatterns = [
      /第[一二三四五六七八九十\d]+章[：:：]\s*(.*?)$/gm,
      /章节[一二三四五六七八九十\d]+[：:：]\s*(.*?)$/gm,
      /第[一二三四五六七八九十\d]+部分[：:：]\s*(.*?)$/gm,
      /<h[1-6][^>]*>(.*?第[一二三四五六七八九十\d]+章.*?)<\/h[1-6]>/gi,
      /<h[1-6][^>]*>(.*?章节.*?)<\/h[1-6]>/gi,
    ];

    let chapterIndex = 0;
    const textContent = tempDiv.textContent || content;

    chapterPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(textContent)) !== null) {
        const title = match[1] ? match[1].trim() : match[0].trim();
        if (title && !chapters.some(ch => ch.title === title)) {
          chapters.push({
            index: chapterIndex++,
            title: title,
            fullMatch: match[0],
            selected: false,
          });
        }
      }
    });

    // 如果没找到标准格式的章节，尝试寻找其他标题格式
    if (chapters.length === 0) {
      const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach((heading, index) => {
        const title = heading.textContent.trim();
        if (title.length > 5 && title.length < 100) {
          chapters.push({
            index: index,
            title: title,
            fullMatch: title,
            selected: false,
          });
        }
      });
    }

    return chapters;
  }

  /**
   * 创建章节选择模态框
   */
  createChapterSelectionModal(chapters) {
    // 移除已存在的模态框
    const existingModal = document.getElementById('chapter-selection-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 创建模态框
    const modal = document.createElement('div');
    modal.id = 'chapter-selection-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #1a1a1a;
      border-radius: 12px;
      padding: 24px;
      max-width: 600px;
      width: 90%;
      max-height: 80%;
      overflow-y: auto;
      color: #e0e0e0;
    `;

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #667eea; font-size: 20px;">
        📝 选择要生成细纲的章节
      </h3>
      <div style="margin-bottom: 20px; font-size: 14px; color: #aaa;">
        检测到 ${chapters.length} 个章节，请选择需要生成细纲的章节：
      </div>
      <div id="chapter-list" style="margin-bottom: 20px;">
        ${chapters
          .map(
            (chapter, index) => `
          <label style="display: block; margin-bottom: 12px; cursor: pointer; padding: 12px; border-radius: 6px; background: #333; transition: background 0.3s;">
            <input type="checkbox" value="${index}" style="margin-right: 12px;">
            <span style="font-weight: bold;">第${index + 1}章：</span>
            <span>${chapter.title}</span>
          </label>
        `,
          )
          .join('')}
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="select-all-chapters" style="background: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          全选
        </button>
        <button id="clear-all-chapters" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          清空
        </button>
        <button id="generate-selected-details" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          生成细纲
        </button>
        <button id="cancel-chapter-selection" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          取消
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 绑定事件
    this.bindChapterSelectionEvents(modal, chapters);
  }

  /**
   * 绑定章节选择事件
   */
  bindChapterSelectionEvents(modal, chapters) {
    // 全选按钮
    modal.querySelector('#select-all-chapters').addEventListener('click', () => {
      const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => (cb.checked = true));
    });

    // 清空按钮
    modal.querySelector('#clear-all-chapters').addEventListener('click', () => {
      const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => (cb.checked = false));
    });

    // 生成细纲按钮
    modal.querySelector('#generate-selected-details').addEventListener('click', () => {
      const selectedIndexes = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked')).map(cb =>
        parseInt(cb.value),
      );

      if (selectedIndexes.length === 0) {
        this.hotkeyManager.showNotification('请至少选择一个章节', 'warning');
        return;
      }

      const selectedChapters = selectedIndexes.map(index => chapters[index]);
      modal.remove();
      this.generateDetailOutlines(selectedChapters);
    });

    // 取消按钮
    modal.querySelector('#cancel-chapter-selection').addEventListener('click', () => {
      modal.remove();
    });

    // 点击背景关闭
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * 生成选中章节的细纲
   */
  async generateDetailOutlines(selectedChapters) {
    const currentOutline = this.versionManager.getCurrentOutline();
    if (!currentOutline) {
      this.hotkeyManager.showNotification('找不到当前大纲', 'error');
      return;
    }

    this.isGenerating = true;
    this.hotkeyManager.showNotification(`开始生成 ${selectedChapters.length} 个章节的细纲...`, 'info', 3000);

    try {
      for (const chapter of selectedChapters) {
        await this.generateSingleChapterDetail(currentOutline, chapter);
        // 添加延迟以避免API速率限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      this.hotkeyManager.showNotification('所有章节细纲生成完成', 'success');
      this.showDetailOutlineResults(currentOutline.id);
    } catch (error) {
      console.error('[Detail Outline Manager] Generation failed:', error);
      this.hotkeyManager.showNotification('细纲生成失败: ' + error.message, 'error');
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * 生成单个章节的细纲
   */
  async generateSingleChapterDetail(parentOutline, chapter) {
    console.log('[Detail Outline Manager] Generating detail for chapter:', chapter.title);

    // 构建细纲生成提示词
    const detailPrompt = this.buildDetailPrompt(parentOutline, chapter);

    try {
      // 使用与主大纲生成相同的API
      let result = '';
      if (window.TavernHelper?.generateRaw) {
        result = await window.TavernHelper.generateRaw({
          ordered_prompts: [
            { role: 'system', content: '你是一个专业的故事策划师，擅长创作详细的章节大纲。' },
            { role: 'user', content: detailPrompt },
          ],
          max_chat_history: 0,
          should_stream: false,
        });
      } else if (typeof window.generateRaw === 'function') {
        result = await window.generateRaw({
          ordered_prompts: [
            { role: 'system', content: '你是一个专业的故事策划师，擅长创作详细的章节大纲。' },
            { role: 'user', content: detailPrompt },
          ],
          max_chat_history: 0,
          should_stream: false,
        });
      } else {
        throw new Error('未找到可用的生成接口');
      }

      if (!result || result.trim().length < 20) {
        throw new Error(`章节 "${chapter.title}" 生成的细纲内容过短`);
      }

      // 创建细纲版本
      const detailOutline = this.versionManager.createDetailOutline(
        parentOutline.id,
        chapter.index,
        `${chapter.title} - 细纲`,
        result.trim(),
        { ...parentOutline.settings, chapterTitle: chapter.title },
      );

      console.log('[Detail Outline Manager] Detail outline created:', detailOutline.id);
      return detailOutline;
    } catch (error) {
      console.error(`[Detail Outline Manager] Failed to generate detail for chapter "${chapter.title}":`, error);
      throw error;
    }
  }

  /**
   * 构建细纲生成提示词
   */
  buildDetailPrompt(parentOutline, chapter) {
    return `
请基于以下故事大纲，为指定章节生成详细的细纲：

【整体故事大纲】
${parentOutline.content}

【目标章节】
${chapter.title}

【任务要求】
1. 仔细阅读整体故事大纲，理解故事的整体脉络、角色关系和情节发展
2. 针对指定章节"${chapter.title}"，生成详细的细纲
3. 细纲应该包含：
   - 章节的主要情节发展
   - 关键场景和转折点
   - 角色的行动和对话要点
   - 情感基调和氛围描述
   - 与前后章节的衔接关系

【输出格式】
请以清晰的段落形式输出细纲，包含具体的情节点和场景描述。

【注意事项】
- 确保细纲与整体大纲保持一致性
- 细纲应该比原章节概述更加详细和具体
- 包含足够的细节以指导具体的写作
- 保持故事的连贯性和逻辑性

请开始生成细纲：
    `;
  }

  /**
   * 显示细纲结果
   */
  showDetailOutlineResults(parentOutlineId) {
    const detailOutlines = this.versionManager.getDetailOutlines(parentOutlineId);
    if (detailOutlines.length === 0) {
      this.hotkeyManager.showNotification('没有找到细纲', 'warning');
      return;
    }

    // 创建细纲显示模态框
    this.createDetailResultsModal(detailOutlines);
  }

  /**
   * 创建细纲结果显示模态框
   */
  createDetailResultsModal(detailOutlines) {
    const existingModal = document.getElementById('detail-results-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'detail-results-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #1a1a1a;
      border-radius: 12px;
      padding: 24px;
      max-width: 800px;
      width: 95%;
      max-height: 90%;
      overflow-y: auto;
      color: #e0e0e0;
    `;

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #667eea; font-size: 20px;">
        📚 章节细纲 (共${detailOutlines.length}个)
      </h3>
      <div id="detail-outlines-container">
        ${detailOutlines
          .map(
            detail => `
          <div class="detail-outline-item" style="margin-bottom: 24px; border: 1px solid #333; border-radius: 8px; padding: 16px;">
            <h4 style="margin: 0 0 12px 0; color: #4CAF50; display: flex; justify-content: space-between; align-items: center;">
              ${detail.title}
              <div>
                <button class="copy-detail-btn" data-detail-id="${
                  detail.id
                }" style="background: #2196F3; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;" title="复制细纲">
                  📋
                </button>
                <button class="send-detail-btn" data-detail-id="${
                  detail.id
                }" style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;" title="发送到聊天">
                  💬
                </button>
              </div>
            </h4>
            <div class="detail-content" style="white-space: pre-wrap; line-height: 1.6; font-size: 14px;">
              ${detail.content}
            </div>
            <div style="margin-top: 12px; font-size: 12px; color: #888; text-align: right;">
              生成时间: ${new Date(detail.timestamp).toLocaleString()}
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px;">
        <button id="export-all-details" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          导出全部细纲
        </button>
        <button id="close-detail-results" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          关闭
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 绑定事件
    this.bindDetailResultsEvents(modal, detailOutlines);
  }

  /**
   * 绑定细纲结果事件
   */
  bindDetailResultsEvents(modal, detailOutlines) {
    // 复制细纲按钮
    modal.querySelectorAll('.copy-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const detailId = btn.dataset.detailId;
        const detail = detailOutlines.find(d => d.id === detailId);
        if (detail) {
          this.copyToClipboard(detail.content);
          this.hotkeyManager.showNotification('细纲已复制到剪贴板', 'success');
        }
      });
    });

    // 发送到聊天按钮
    modal.querySelectorAll('.send-detail-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const detailId = btn.dataset.detailId;
        const detail = detailOutlines.find(d => d.id === detailId);
        if (detail) {
          const formattedContent = `📝 ${detail.title}\n\n${detail.content}`;
          dragManager.sendToChat(formattedContent);
        }
      });
    });

    // 导出全部细纲
    modal.querySelector('#export-all-details').addEventListener('click', () => {
      this.exportAllDetails(detailOutlines);
    });

    // 关闭按钮
    modal.querySelector('#close-detail-results').addEventListener('click', () => {
      modal.remove();
    });

    // 点击背景关闭
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * 复制到剪贴板
   */
  async copyToClipboard(text) {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * 导出所有细纲
   */
  exportAllDetails(detailOutlines) {
    const content = detailOutlines
      .map(
        detail => `
# ${detail.title}

${detail.content}

---
生成时间: ${new Date(detail.timestamp).toLocaleString()}

`,
      )
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `细纲合集_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.hotkeyManager.showNotification('细纲已导出', 'success');
  }

  /**
   * 清理资源
   */
  cleanup() {
    this.selectedChapters.clear();
    this.isGenerating = false;
  }
}

// 创建全局细纲管理器实例
const detailOutlineManager = new DetailOutlineManager(versionManager, hotkeyManager);

// ===== 导入导出功能系统 =====
/**
 * 版本数据导入导出管理器
 */
class ImportExportManager {
  constructor(versionManager, hotkeyManager) {
    this.versionManager = versionManager;
    this.hotkeyManager = hotkeyManager;
    this.init();
  }

  init() {
    this.setupUI();
    console.log('[Import Export Manager] Initialized');
  }

  /**
   * 设置用户界面
   */
  setupUI() {
    // 修改现有的导入导出按钮行为
    document.addEventListener('DOMContentLoaded', () => {
      this.overrideExportButton();
      this.overrideImportButton();
      this.addVersionExportOptions();
    });
  }

  /**
   * 重写导出按钮行为
   */
  overrideExportButton() {
    const exportBtn = document.getElementById('export-preset');
    if (exportBtn) {
      // 移除现有事件监听器
      exportBtn.removeEventListener('click', exportPreset);

      // 添加新的事件监听器
      exportBtn.addEventListener('click', e => {
        e.preventDefault();
        this.showExportOptions();
      });
    }
  }

  /**
   * 重写导入按钮行为
   */
  overrideImportButton() {
    const importBtn = document.getElementById('import-preset');
    if (importBtn) {
      // 移除现有事件监听器
      importBtn.removeEventListener('click', importPreset);

      // 添加新的事件监听器
      importBtn.addEventListener('click', e => {
        e.preventDefault();
        this.showImportOptions();
      });
    }
  }

  /**
   * 添加版本导出选项到结果区域
   */
  addVersionExportOptions() {
    const exportResultBtn = document.getElementById('export-result');
    if (exportResultBtn) {
      exportResultBtn.addEventListener('click', e => {
        e.preventDefault();
        this.exportCurrentVersions();
      });
    }
  }

  /**
   * 显示导出选项对话框
   */
  showExportOptions() {
    const modal = document.createElement('div');
    modal.id = 'export-options-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #1a1a1a;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      color: #e0e0e0;
    `;

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #667eea; font-size: 20px;">
        📤 选择导出类型
      </h3>
      <div style="margin-bottom: 24px; font-size: 14px; color: #aaa;">
        请选择要导出的内容类型：
      </div>
      
      <div class="export-option" style="margin-bottom: 16px; padding: 16px; background: #333; border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: all 0.3s;" data-type="settings">
        <div style="font-weight: bold; color: #4CAF50; margin-bottom: 8px;">🔧 插件设置预设</div>
        <div style="font-size: 13px; color: #ccc;">导出当前的插件配置、提示词设置等（原有功能）</div>
      </div>

      <div class="export-option" style="margin-bottom: 16px; padding: 16px; background: #333; border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: all 0.3s;" data-type="versions">
        <div style="font-weight: bold; color: #2196F3; margin-bottom: 8px;">📚 版本历史数据</div>
        <div style="font-size: 13px; color: #ccc;">导出所有大纲版本和细纲数据（支持备份和迁移）</div>
      </div>

      <div class="export-option" style="margin-bottom: 24px; padding: 16px; background: #333; border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: all 0.3s;" data-type="complete">
        <div style="font-weight: bold; color: #FF9800; margin-bottom: 8px;">📦 完整数据包</div>
        <div style="font-size: 13px; color: #ccc;">导出插件设置和版本数据的完整备份</div>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-export" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          取消
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 绑定事件
    this.bindExportOptionsEvents(modal);
  }

  /**
   * 绑定导出选项事件
   */
  bindExportOptionsEvents(modal) {
    // 导出选项点击事件
    modal.querySelectorAll('.export-option').forEach(option => {
      option.addEventListener('mouseenter', () => {
        option.style.border = '1px solid #667eea';
        option.style.background = '#3a3a3a';
      });

      option.addEventListener('mouseleave', () => {
        option.style.border = '1px solid transparent';
        option.style.background = '#333';
      });

      option.addEventListener('click', () => {
        const type = option.dataset.type;
        modal.remove();
        this.handleExport(type);
      });
    });

    // 取消按钮
    modal.querySelector('#cancel-export').addEventListener('click', () => {
      modal.remove();
    });

    // 点击背景关闭
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * 处理不同类型的导出
   */
  async handleExport(type) {
    try {
      let data, filename;

      switch (type) {
        case 'settings':
          data = await this.exportSettings();
          filename = `StoryWeaver_Settings_${new Date().toISOString().split('T')[0]}.json`;
          break;

        case 'versions':
          data = await this.exportVersions();
          filename = `StoryWeaver_Versions_${new Date().toISOString().split('T')[0]}.json`;
          break;

        case 'complete':
          data = await this.exportComplete();
          filename = `StoryWeaver_Complete_${new Date().toISOString().split('T')[0]}.json`;
          break;

        default:
          throw new Error('未知的导出类型');
      }

      this.downloadJSON(data, filename);
      this.hotkeyManager.showNotification('导出成功', 'success');
    } catch (error) {
      console.error('[Import Export Manager] Export failed:', error);
      this.hotkeyManager.showNotification('导出失败: ' + error.message, 'error');
    }
  }

  /**
   * 导出设置数据
   */
  async exportSettings() {
    // 使用原有的设置导出逻辑
    return createPresetFromSettings();
  }

  /**
   * 导出版本数据
   */
  async exportVersions() {
    return this.versionManager.exportToJSON();
  }

  /**
   * 导出完整数据
   */
  async exportComplete() {
    const settings = await this.exportSettings();
    const versions = await this.exportVersions();

    return {
      version: '1.0.0',
      type: 'story_weaver_complete',
      timestamp: Date.now(),
      data: {
        settings,
        versions,
      },
    };
  }

  /**
   * 显示导入选项对话框
   */
  showImportOptions() {
    const modal = document.createElement('div');
    modal.id = 'import-options-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #1a1a1a;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      color: #e0e0e0;
    `;

    modalContent.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #667eea; font-size: 20px;">
        📥 选择导入类型
      </h3>
      <div style="margin-bottom: 24px; font-size: 14px; color: #aaa;">
        请选择要导入的文件类型，系统会自动识别并处理：
      </div>
      
      <div class="import-option" style="margin-bottom: 16px; padding: 16px; background: #333; border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: all 0.3s;" data-type="settings">
        <div style="font-weight: bold; color: #4CAF50; margin-bottom: 8px;">🔧 导入设置预设</div>
        <div style="font-size: 13px; color: #ccc;">导入插件配置和提示词设置</div>
      </div>

      <div class="import-option" style="margin-bottom: 16px; padding: 16px; background: #333; border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: all 0.3s;" data-type="versions">
        <div style="font-weight: bold; color: #2196F3; margin-bottom: 8px;">📚 导入版本数据</div>
        <div style="font-size: 13px; color: #ccc;">导入大纲版本和细纲历史数据</div>
      </div>

      <div class="import-option" style="margin-bottom: 24px; padding: 16px; background: #333; border-radius: 8px; cursor: pointer; border: 1px solid transparent; transition: all 0.3s;" data-type="auto">
        <div style="font-weight: bold; color: #FF9800; margin-bottom: 8px;">🤖 自动识别导入</div>
        <div style="font-size: 13px; color: #ccc;">自动识别文件类型并导入（推荐）</div>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-import" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          取消
        </button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 绑定事件
    this.bindImportOptionsEvents(modal);
  }

  /**
   * 绑定导入选项事件
   */
  bindImportOptionsEvents(modal) {
    // 导入选项点击事件
    modal.querySelectorAll('.import-option').forEach(option => {
      option.addEventListener('mouseenter', () => {
        option.style.border = '1px solid #667eea';
        option.style.background = '#3a3a3a';
      });

      option.addEventListener('mouseleave', () => {
        option.style.border = '1px solid transparent';
        option.style.background = '#333';
      });

      option.addEventListener('click', () => {
        const type = option.dataset.type;
        modal.remove();
        this.selectFileForImport(type);
      });
    });

    // 取消按钮
    modal.querySelector('#cancel-import').addEventListener('click', () => {
      modal.remove();
    });

    // 点击背景关闭
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * 选择导入文件
   */
  selectFileForImport(type) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        await this.handleImport(file, type);
      } catch (error) {
        console.error('[Import Export Manager] Import failed:', error);
        this.hotkeyManager.showNotification('导入失败: ' + error.message, 'error');
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  /**
   * 处理导入
   */
  async handleImport(file, type) {
    console.log('[Import Export Manager] Importing file:', file.name, 'type:', type);

    const text = await this.readFileAsText(file);
    const data = JSON.parse(text);

    if (type === 'auto') {
      // 自动识别文件类型
      type = this.detectFileType(data);
      console.log('[Import Export Manager] Auto detected type:', type);
    }

    switch (type) {
      case 'settings':
        await this.importSettings(data);
        break;

      case 'versions':
        await this.importVersions(data);
        break;

      case 'complete':
        await this.importComplete(data);
        break;

      default:
        throw new Error(`未知的导入类型: ${type}`);
    }

    this.hotkeyManager.showNotification('导入成功', 'success');
  }

  /**
   * 检测文件类型
   */
  detectFileType(data) {
    if (data.type === 'story_weaver_complete') {
      return 'complete';
    } else if (data.type === 'story_weaver_versions') {
      return 'versions';
    } else if (data.type === 'story_weaver' || data.settings) {
      return 'settings';
    }

    throw new Error('无法识别的文件格式');
  }

  /**
   * 导入设置
   */
  async importSettings(data) {
    // 使用原有的设置导入逻辑
    // 这里需要调用原有的 importPreset 逻辑
    console.log('[Import Export Manager] Importing settings...');

    // 验证和应用设置...
    // 由于原有的导入逻辑比较复杂，这里简化处理
    if (data.settings) {
      // 更新设置
      Object.assign(settings, data.settings);
      extension_settings[extensionName] = settings;

      // 触发UI更新
      window.location.reload();
    }
  }

  /**
   * 导入版本数据
   */
  async importVersions(data) {
    console.log('[Import Export Manager] Importing versions...');

    const success = this.versionManager.importFromJSON(data);
    if (!success) {
      throw new Error('版本数据导入失败');
    }
  }

  /**
   * 导入完整数据
   */
  async importComplete(data) {
    console.log('[Import Export Manager] Importing complete data...');

    if (data.data.settings) {
      await this.importSettings(data.data.settings);
    }

    if (data.data.versions) {
      await this.importVersions(data.data.versions);
    }
  }

  /**
   * 导出当前版本数据
   */
  exportCurrentVersions() {
    const data = this.versionManager.exportToJSON();
    const filename = `StoryWeaver_CurrentVersions_${new Date().toISOString().split('T')[0]}.json`;
    this.downloadJSON(data, filename);
    this.hotkeyManager.showNotification('当前版本数据已导出', 'success');
  }

  /**
   * 下载JSON文件
   */
  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 读取文件内容
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }
}

// 创建全局导入导出管理器实例
const importExportManager = new ImportExportManager(versionManager, hotkeyManager);

// ===== 帮助系统 =====
/**
 * 帮助和使用说明管理器
 */
class HelpManager {
  constructor(versionManager, hotkeyManager) {
    this.versionManager = versionManager;
    this.hotkeyManager = hotkeyManager;
    this.init();
  }

  init() {
    this.setupUI();
    this.createHotkeyHints();
    console.log('[Help Manager] Initialized');
  }

  /**
   * 设置用户界面
   */
  setupUI() {
    document.addEventListener('DOMContentLoaded', () => {
      const helpBtn = document.getElementById('show-help');
      if (helpBtn) {
        helpBtn.addEventListener('click', () => {
          this.showHelpModal();
        });
      }
    });
  }

  /**
   * 创建热键提示
   */
  createHotkeyHints() {
    // 创建浮动热键提示面板
    const hintPanel = document.createElement('div');
    hintPanel.id = 'hotkey-hints-panel';
    hintPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.6;
      z-index: 9999;
      min-width: 200px;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
      pointer-events: none;
      border: 1px solid rgba(102, 126, 234, 0.5);
    `;

    hintPanel.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #667eea;">⌨️ 快捷键</div>
      <div><strong>Alt + ↑/↓</strong> - 切换版本</div>
      <div><strong>Alt + A</strong> - 切换备注模式</div>
      <div><strong>双击</strong> - 编辑段落</div>
      <div><strong>悬浮段落</strong> - 显示操作按钮</div>
      <div><strong>拖拽</strong> - 发送到聊天</div>
      <div style="font-size: 10px; margin-top: 6px; opacity: 0.7;">按住 Shift 显示提示</div>
    `;

    document.body.appendChild(hintPanel);

    // 监听Shift键显示/隐藏提示
    let shiftPressed = false;
    document.addEventListener('keydown', e => {
      if (e.key === 'Shift' && !shiftPressed) {
        shiftPressed = true;
        this.showHotkeyHints(hintPanel);
      }
    });

    document.addEventListener('keyup', e => {
      if (e.key === 'Shift' && shiftPressed) {
        shiftPressed = false;
        this.hideHotkeyHints(hintPanel);
      }
    });
  }

  /**
   * 显示热键提示
   */
  showHotkeyHints(panel) {
    // 只在Story Weaver面板打开时显示
    const storyWeaverPanel = document.getElementById('story-weaver-panel');
    if (storyWeaverPanel && storyWeaverPanel.style.display !== 'none') {
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
    }
  }

  /**
   * 隐藏热键提示
   */
  hideHotkeyHints(panel) {
    panel.style.opacity = '0';
    panel.style.transform = 'translateY(10px)';
  }

  /**
   * 显示帮助模态框
   */
  showHelpModal() {
    const modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #1a1a1a;
      border-radius: 12px;
      padding: 0;
      max-width: 800px;
      width: 95%;
      max-height: 90%;
      overflow: hidden;
      color: #e0e0e0;
      display: flex;
      flex-direction: column;
    `;

    modalContent.innerHTML = `
      <div style="background: #667eea; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; font-size: 24px;">📖 Story Weaver 使用指南</h2>
        <button id="close-help" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer;">✕</button>
      </div>
      
      <div style="padding: 0; overflow-y: auto; flex: 1;">
        <div style="padding: 24px;">
          
          <div class="help-section" style="margin-bottom: 32px;">
            <h3 style="color: #667eea; margin-bottom: 16px; font-size: 20px;">🎯 核心功能</h3>
            
            <div style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
              
              <div style="background: #2a2a2a; padding: 16px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                <h4 style="margin: 0 0 8px 0; color: #4CAF50;">📝 版本管理</h4>
                <p style="margin: 0; font-size: 14px; line-height: 1.5;">每次生成的大纲都会自动保存为新版本，支持最多5个历史版本的快速切换。使用 <code>Alt + ↑/↓</code> 在版本间切换。</p>
              </div>
              
              <div style="background: #2a2a2a; padding: 16px; border-radius: 8px; border-left: 4px solid #2196F3;">
                <h4 style="margin: 0 0 8px 0; color: #2196F3;">✏️ 双击编辑</h4>
                <p style="margin: 0; font-size: 14px; line-height: 1.5;">双击任何段落可直接编辑内容。支持保存、取消或提交给AI进行智能修改。按 <code>Alt + A</code> 开启备注模式。</p>
              </div>
              
              <div style="background: #2a2a2a; padding: 16px; border-radius: 8px; border-left: 4px solid #FF9800;">
                <h4 style="margin: 0 0 8px 0; color: #FF9800;">🚀 拖拽发送</h4>
                <p style="margin: 0; font-size: 14px; line-height: 1.5;">将任意内容拖拽到插件窗口外即可自动添加到聊天输入框。鼠标悬浮时会显示拖拽手柄。</p>
              </div>
              
              <div style="background: #2a2a2a; padding: 16px; border-radius: 8px; border-left: 4px solid #9C27B0;">
                <h4 style="margin: 0 0 8px 0; color: #9C27B0;">📚 细纲生成</h4>
                <p style="margin: 0; font-size: 14px; line-height: 1.5;">点击生成结果区域的 📝 按钮，可为选中的章节生成详细细纲。细纲会绑定到对应的大纲版本。</p>
              </div>
              
            </div>
          </div>

          <div class="help-section" style="margin-bottom: 32px;">
            <h3 style="color: #667eea; margin-bottom: 16px; font-size: 20px;">⌨️ 快捷键大全</h3>
            
            <div style="background: #2a2a2a; padding: 20px; border-radius: 8px;">
              <div style="display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                
                <div>
                  <strong style="color: #4CAF50;">版本控制</strong>
                  <div style="margin-left: 12px; font-size: 14px; margin-top: 4px;">
                    <div><code>Alt + ↑</code> - 上一个版本</div>
                    <div><code>Alt + ↓</code> - 下一个版本</div>
                  </div>
                </div>
                
                <div>
                  <strong style="color: #2196F3;">编辑模式</strong>
                  <div style="margin-left: 12px; font-size: 14px; margin-top: 4px;">
                    <div><code>双击</code> - 开始编辑</div>
                    <div><code>Ctrl/Cmd + E</code> - 切换编辑</div>
                    <div><code>Alt + A</code> - 备注模式</div>
                  </div>
                </div>
                
                <div>
                  <strong style="color: #FF9800;">编辑操作</strong>
                  <div style="margin-left: 12px; font-size: 14px; margin-top: 4px;">
                    <div><code>Ctrl/Cmd + Enter</code> - 保存编辑</div>
                    <div><code>Escape</code> - 取消编辑</div>
                  </div>
                </div>
                
                <div>
                  <strong style="color: #9C27B0;">界面操作</strong>
                  <div style="margin-left: 12px; font-size: 14px; margin-top: 4px;">
                    <div><code>按住 Shift</code> - 显示热键提示</div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>

          <div class="help-section" style="margin-bottom: 32px;">
            <h3 style="color: #667eea; margin-bottom: 16px; font-size: 20px;">🔄 使用流程</h3>
            
            <div style="display: flex; flex-direction: column; gap: 16px;">
              
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">1</div>
                <div>
                  <strong>配置创作需求</strong>
                  <p style="margin: 4px 0 0 0; color: #ccc; font-size: 14px;">填写故事类型、主题、风格等基本信息</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">2</div>
                <div>
                  <strong>生成故事大纲</strong>
                  <p style="margin: 4px 0 0 0; color: #ccc; font-size: 14px;">点击生成按钮，系统会自动创建版本并显示</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">3</div>
                <div>
                  <strong>编辑和调整</strong>
                  <p style="margin: 4px 0 0 0; color: #ccc; font-size: 14px;">双击任意段落进行编辑，或使用备注模式让AI修改</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">4</div>
                <div>
                  <strong>生成章节细纲</strong>
                  <p style="margin: 4px 0 0 0; color: #ccc; font-size: 14px;">点击📝按钮选择章节生成详细细纲</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 16px;">
                <div style="background: #667eea; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0;">5</div>
                <div>
                  <strong>导出或发送到聊天</strong>
                  <p style="margin: 4px 0 0 0; color: #ccc; font-size: 14px;">拖拽内容到聊天框或使用导出功能保存</p>
                </div>
              </div>
              
            </div>
          </div>

          <div class="help-section" style="margin-bottom: 16px;">
            <h3 style="color: #667eea; margin-bottom: 16px; font-size: 20px;">💾 数据管理</h3>
            
            <div style="background: #2a2a2a; padding: 20px; border-radius: 8px;">
              <div style="margin-bottom: 16px;">
                <strong style="color: #4CAF50;">导入导出</strong>
                <ul style="margin: 8px 0 0 20px; color: #ccc; font-size: 14px;">
                  <li><strong>📤 导出</strong>：支持导出设置预设、版本数据或完整备份</li>
                  <li><strong>📥 导入</strong>：自动识别文件类型并导入相应数据</li>
                  <li><strong>🔄 本地存储</strong>：版本数据自动保存到浏览器本地存储</li>
                </ul>
              </div>
              
              <div style="background: #333; padding: 12px; border-radius: 4px; border-left: 4px solid #FF9800;">
                <strong style="color: #FF9800;">⚠️ 注意事项</strong>
                <div style="font-size: 14px; margin-top: 8px; color: #ccc;">
                  • 版本历史最多保存5个版本，超出会自动清理最旧的<br>
                  • 细纲会绑定到对应的大纲版本<br>
                  • 备注模式下的编辑会被引号包裹重新提交给AI
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 绑定关闭事件
    modal.querySelector('#close-help').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  /**
   * 显示功能介绍提示
   */
  showFeatureIntroduction() {
    // 检查是否已经显示过介绍
    if (localStorage.getItem('storyWeaver_introShown') === 'true') {
      return;
    }

    setTimeout(() => {
      const introModal = document.createElement('div');
      introModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
      `;

      introModal.innerHTML = `
        <div style="background: #1a1a1a; border-radius: 12px; padding: 24px; max-width: 500px; width: 90%; color: #e0e0e0; text-align: center;">
          <h3 style="color: #667eea; margin-bottom: 16px; font-size: 22px;">🎉 欢迎使用 Story Weaver</h3>
          <p style="margin-bottom: 20px; line-height: 1.6;">
            这个版本新增了强大的功能：版本管理、智能编辑、拖拽发送和细纲生成。
          </p>
          <div style="background: #2a2a2a; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: left;">
            <div style="margin-bottom: 8px;"><strong>🔄 Alt + ↑/↓</strong> - 切换版本</div>
            <div style="margin-bottom: 8px;"><strong>✏️ 双击段落</strong> - 智能编辑</div>
            <div style="margin-bottom: 8px;"><strong>🚀 拖拽内容</strong> - 发送到聊天</div>
            <div><strong>📚 点击 📝</strong> - 生成章节细纲</div>
          </div>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button id="show-help-from-intro" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
              查看详细说明
            </button>
            <button id="close-intro" style="background: #666; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
              开始使用
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(introModal);

      introModal.querySelector('#show-help-from-intro').addEventListener('click', () => {
        introModal.remove();
        this.showHelpModal();
      });

      introModal.querySelector('#close-intro').addEventListener('click', () => {
        introModal.remove();
        localStorage.setItem('storyWeaver_introShown', 'true');
      });

      // 点击背景关闭
      introModal.addEventListener('click', e => {
        if (e.target === introModal) {
          introModal.remove();
          localStorage.setItem('storyWeaver_introShown', 'true');
        }
      });
    }, 1000); // 延迟1秒显示
  }

  /**
   * 清理资源
   */
  cleanup() {
    const hintPanel = document.getElementById('hotkey-hints-panel');
    if (hintPanel) {
      hintPanel.remove();
    }
  }
}

// 创建全局帮助管理器实例
const helpManager = new HelpManager(versionManager, hotkeyManager);

// Story Weaver Preset Structure
const PRESET_VERSION = '1.0.0';
const PRESET_TYPE = 'story_weaver';

/**
 * Create a preset object from current settings
 * @returns {Object} Preset object
 */
function createPresetFromSettings() {
  return {
    version: PRESET_VERSION,
    type: PRESET_TYPE,
    name: `Story Weaver Preset - ${new Date().toLocaleString()}`,
    description: 'Story Weaver plugin configuration preset',
    timestamp: Date.now(),
    settings: {
      // Basic settings
      enabled: settings.enabled,
      contextLength: settings.contextLength,
      storyType: settings.storyType,
      detailLevel: settings.detailLevel,
      chapterCount: settings.chapterCount,
      includeCharacters: settings.includeCharacters,
      includeSummary: settings.includeSummary,
      includeThemes: settings.includeThemes,

      // Prompt system - Export SillyTavern native format
      prompts: getStoryWeaverPrompts().map(p => ({ ...p })),
      prompt_order: [...getStoryWeaverPromptOrder()],
    },
    metadata: {
      created: new Date().toISOString(),
      creator: 'Story Weaver Extension',
      version: PRESET_VERSION,
    },
  };
}

/**
 * Validate a preset object
 * @param {Object} preset - Preset object to validate
 * @returns {Object} Validation result with success status and errors
 */
function validatePreset(preset) {
  const errors = [];

  if (!preset || typeof preset !== 'object') {
    return { success: false, errors: ['Invalid preset format'] };
  }

  if (preset.type !== PRESET_TYPE) {
    errors.push(`Invalid preset type: ${preset.type}. Expected: ${PRESET_TYPE}`);
  }

  if (!preset.version) {
    errors.push('Missing preset version');
  }

  if (!preset.settings || typeof preset.settings !== 'object') {
    errors.push('Missing or invalid settings object');
  } else {
    // Validate required settings
    const requiredSettings = ['enabled', 'contextLength', 'storyType', 'detailLevel', 'chapterCount'];
    for (const setting of requiredSettings) {
      if (preset.settings[setting] === undefined) {
        errors.push(`Missing required setting: ${setting}`);
      }
    }

    // Validate prompts array
    if (preset.settings.prompts && !Array.isArray(preset.settings.prompts)) {
      errors.push('Prompts must be an array');
    }
  }

  return {
    success: errors.length === 0,
    errors: errors,
  };
}

/**
 * Apply a preset to current settings
 * @param {Object} preset - Preset object to apply
 * @returns {boolean} Success status
 */
function applyPreset(preset) {
  const validation = validatePreset(preset);
  if (!validation.success) {
    console.error('[Story Weaver] Preset validation failed:', validation.errors);
    showNotification('预设验证失败: ' + validation.errors.join(', '), 'error');
    return false;
  }

  try {
    // Apply basic settings
    const presetSettings = preset.settings;

    settings.enabled = presetSettings.enabled ?? settings.enabled;
    settings.contextLength = presetSettings.contextLength ?? settings.contextLength;
    settings.storyType = presetSettings.storyType ?? settings.storyType;
    settings.detailLevel = presetSettings.detailLevel ?? settings.detailLevel;
    settings.chapterCount = presetSettings.chapterCount ?? settings.chapterCount;
    settings.includeCharacters = presetSettings.includeCharacters ?? settings.includeCharacters;
    settings.includeSummary = presetSettings.includeSummary ?? settings.includeSummary;
    settings.includeThemes = presetSettings.includeThemes ?? settings.includeThemes;

    // Apply prompt settings if available
    if (presetSettings.prompts && Array.isArray(presetSettings.prompts)) {
      settings.prompts = [...presetSettings.prompts];
    }

    if (presetSettings.promptOrder && Array.isArray(presetSettings.promptOrder)) {
      settings.promptOrder = [...presetSettings.promptOrder];
    }

    // Save updated settings
    extension_settings[extensionName] = settings;
    saveSettings();

    console.log('[Story Weaver] Preset applied successfully:', preset.name);
    showNotification(`预设已应用: ${preset.name}`, 'success');

    // Update UI
    renderPromptManager();
    updateSettingsUI();

    return true;
  } catch (error) {
    console.error('[Story Weaver] Error applying preset:', error);
    showNotification('应用预设时发生错误: ' + error.message, 'error');
    return false;
  }
}

/**
 * Export current settings as a preset file
 */
async function exportPreset() {
  try {
    const preset = createPresetFromSettings();

    // Show dialog to customize preset name and description
    const themeInfo = getThemeInfo('body');

    const modal = $(`
      <div class="sw-prompt-editor-modal sw-themed-modal">
        <div class="sw-prompt-editor-content sw-themed-content" 
             style="background: ${themeInfo.modalBg}; border: 1px solid ${themeInfo.borderColor}; color: ${themeInfo.textColor};">
          <div class="sw-prompt-editor-header sw-themed-header" 
               style="background: ${themeInfo.headerBg}; border-bottom: 1px solid ${themeInfo.borderColor};">
            <h3 class="sw-prompt-editor-title" 
                style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">
              📤 导出预设
            </h3>
            <button class="close-btn sw-themed-close-btn" id="close-export-modal" title="关闭"
                    style="color: ${themeInfo.textColor};">
              <span>✕</span>
            </button>
          </div>
          <div class="sw-prompt-editor-body sw-themed-body">
            <div class="form-group">
              <label for="preset-export-name" class="form-label sw-themed-label" 
                     style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">预设名称</label>
              <input type="text" id="preset-export-name" class="form-input sw-themed-input" 
                     value="${preset.name}"
                     style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor}; color: ${themeInfo.textColor};" />
            </div>
            
            <div class="form-group">
              <label for="preset-export-description" class="form-label sw-themed-label"
                     style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">预设描述</label>
              <textarea id="preset-export-description" class="form-textarea sw-themed-textarea" rows="3" 
                        placeholder="输入预设描述..."
                        style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor}; color: ${themeInfo.textColor};">${preset.description}</textarea>
            </div>
            
            <div class="form-help sw-themed-help" 
                 style="color: ${themeInfo.mutedColor}; font-size: 12px;">
              💡 预设将保存为 JSON 文件，包含所有当前设置和提示词配置
            </div>
          </div>
          <div class="sw-prompt-editor-footer sw-themed-footer" 
               style="background: ${themeInfo.headerBg}; border-top: 1px solid ${themeInfo.borderColor};">
            <button class="secondary-btn sw-themed-secondary-btn" id="cancel-export"
                    style="background: ${themeInfo.secondaryBtnBg}; border: 1px solid ${themeInfo.borderColor}; color: ${themeInfo.textColor};">
              取消
            </button>
            <button class="primary-btn sw-themed-primary-btn" id="confirm-export"
                    style="background: ${themeInfo.primaryBtnBg}; border: 1px solid ${themeInfo.primaryBtnBorder}; color: ${themeInfo.primaryBtnColor}; font-weight: ${themeInfo.boldWeight};">
              📤 导出
            </button>
          </div>
        </div>
      </div>
    `);

    $('body').append(modal);

    // Event handlers
    modal.find('#close-export-modal, #cancel-export').on('click', () => {
      modal.addClass('closing');
      setTimeout(() => modal.remove(), 200);
    });

    modal.find('#confirm-export').on('click', () => {
      const customName = $('#preset-export-name').val() || preset.name;
      const customDescription = $('#preset-export-description').val() || preset.description;

      // Update preset with custom values
      preset.name = customName;
      preset.description = customDescription;

      // Generate filename
      const sanitizedName = customName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const fileName = `${sanitizedName}_${Date.now()}.json`;

      // Export file
      const jsonContent = JSON.stringify(preset, null, 2);
      download(jsonContent, fileName, 'application/json');

      console.log('[Story Weaver] Preset exported:', fileName);
      showNotification(`预设已导出: ${fileName}`, 'success');

      modal.addClass('closing');
      setTimeout(() => modal.remove(), 200);
    });

    // Close on backdrop click
    modal.on('click', function (e) {
      if (e.target === this) {
        modal.addClass('closing');
        setTimeout(() => modal.remove(), 200);
      }
    });
  } catch (error) {
    console.error('[Story Weaver] Export error:', error);
    showNotification('导出预设时发生错误: ' + error.message, 'error');
  }
}

/**
 * Import preset from file
 */
async function importPreset() {
  try {
    // Create file input element
    const fileInput = $('<input type="file" accept=".json" style="display: none;">');
    $('body').append(fileInput);

    fileInput.on('change', async e => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        console.log('[Story Weaver] Importing preset from file:', file.name);

        // Parse JSON file
        const preset = await parseJsonFile(file);

        // Validate preset
        const validation = validatePreset(preset);
        if (!validation.success) {
          showNotification('无效的预设文件: ' + validation.errors.join(', '), 'error');
          return;
        }

        // Show confirmation dialog
        const confirmed = await showImportConfirmDialog(preset);
        if (confirmed) {
          const success = applyPreset(preset);
          if (success) {
            showNotification(`预设导入成功: ${preset.name}`, 'success');
          }
        }
      } catch (error) {
        console.error('[Story Weaver] Import error:', error);
        showNotification('导入预设失败: ' + error.message, 'error');
      } finally {
        fileInput.remove();
      }
    });

    // Trigger file selection
    fileInput.trigger('click');
  } catch (error) {
    console.error('[Story Weaver] Import initialization error:', error);
    showNotification('初始化导入功能失败: ' + error.message, 'error');
  }
}

/**
 * Show import confirmation dialog
 * @param {Object} preset - Preset to import
 * @returns {Promise<boolean>} User confirmation
 */
async function showImportConfirmDialog(preset) {
  return new Promise(resolve => {
    const themeInfo = getThemeInfo('body');

    const modal = $(`
      <div class="sw-prompt-editor-modal sw-themed-modal">
        <div class="sw-prompt-editor-content sw-themed-content" 
             style="background: ${themeInfo.modalBg}; border: 1px solid ${themeInfo.borderColor}; color: ${
      themeInfo.textColor
    };">
          <div class="sw-prompt-editor-header sw-themed-header" 
               style="background: ${themeInfo.headerBg}; border-bottom: 1px solid ${themeInfo.borderColor};">
            <h3 class="sw-prompt-editor-title" 
                style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">
              📥 导入预设确认
            </h3>
            <button class="close-btn sw-themed-close-btn" id="close-import-modal" title="关闭"
                    style="color: ${themeInfo.textColor};">
              <span>✕</span>
            </button>
          </div>
          <div class="sw-prompt-editor-body sw-themed-body">
            <div style="margin-bottom: 20px;">
              <h4 style="color: ${themeInfo.headingColor}; margin-bottom: 10px;">预设信息</h4>
              <div style="background: ${themeInfo.contentBg}; padding: 15px; border-radius: 6px; border: 1px solid ${
      themeInfo.borderColor
    };">
                <p><strong style="color: ${themeInfo.boldTextColor}; font-weight: ${
      themeInfo.boldWeight
    };">名称:</strong> ${preset.name}</p>
                <p><strong style="color: ${themeInfo.boldTextColor}; font-weight: ${
      themeInfo.boldWeight
    };">描述:</strong> ${preset.description}</p>
                <p><strong style="color: ${themeInfo.boldTextColor}; font-weight: ${
      themeInfo.boldWeight
    };">版本:</strong> ${preset.version}</p>
                <p><strong style="color: ${themeInfo.boldTextColor}; font-weight: ${
      themeInfo.boldWeight
    };">创建时间:</strong> ${preset.metadata?.created || '未知'}</p>
                ${
                  preset.settings.prompts
                    ? `<p><strong style="color: ${themeInfo.boldTextColor}; font-weight: ${themeInfo.boldWeight};">提示词数量:</strong> ${preset.settings.prompts.length}</p>`
                    : ''
                }
              </div>
            </div>
            
            <div class="form-help sw-themed-help" 
                 style="color: ${
                   themeInfo.mutedColor
                 }; background: rgba(255, 165, 0, 0.1); border-left: 3px solid orange; padding: 10px;">
              ⚠️ 导入此预设将覆盖当前的所有设置和提示词配置。请确保您已备份当前配置。
            </div>
          </div>
          <div class="sw-prompt-editor-footer sw-themed-footer" 
               style="background: ${themeInfo.headerBg}; border-top: 1px solid ${themeInfo.borderColor};">
            <button class="secondary-btn sw-themed-secondary-btn" id="cancel-import"
                    style="background: ${themeInfo.secondaryBtnBg}; border: 1px solid ${
      themeInfo.borderColor
    }; color: ${themeInfo.textColor};">
              取消
            </button>
            <button class="primary-btn sw-themed-primary-btn" id="confirm-import"
                    style="background: ${themeInfo.primaryBtnBg}; border: 1px solid ${
      themeInfo.primaryBtnBorder
    }; color: ${themeInfo.primaryBtnColor}; font-weight: ${themeInfo.boldWeight};">
              📥 确认导入
            </button>
          </div>
        </div>
      </div>
    `);

    $('body').append(modal);

    // Event handlers
    modal.find('#close-import-modal, #cancel-import').on('click', () => {
      modal.addClass('closing');
      setTimeout(() => {
        modal.remove();
        resolve(false);
      }, 200);
    });

    modal.find('#confirm-import').on('click', () => {
      modal.addClass('closing');
      setTimeout(() => {
        modal.remove();
        resolve(true);
      }, 200);
    });

    // Close on backdrop click
    modal.on('click', function (e) {
      if (e.target === this) {
        modal.addClass('closing');
        setTimeout(() => {
          modal.remove();
          resolve(false);
        }, 200);
      }
    });
  });
}

/**
 * Export only prompt settings as a preset file
 */
async function exportPromptPreset() {
  try {
    // Create SillyTavern native prompt collection preset
    const promptPreset = {
      name: `Story Weaver 提示词预设 - ${new Date().toLocaleString()}`,
      description: 'Story Weaver 提示词配置预设 (SillyTavern 原生格式)',
      timestamp: Date.now(),
      prompts: getStoryWeaverPrompts().map(p => ({ ...p })), // Export as ST native format
      prompt_order: [...getStoryWeaverPromptOrder()], // Use ST native property name
      metadata: {
        created: new Date().toISOString(),
        creator: 'Story Weaver Extension',
        version: PRESET_VERSION,
        format: 'SillyTavern_PromptCollection',
      },
    };

    // Show dialog to customize preset name and description
    const themeInfo = getThemeInfo('body');

    const modal = $(`
      <div class="sw-prompt-editor-modal sw-themed-modal">
        <div class="sw-prompt-editor-content sw-themed-content" 
             style="background: ${themeInfo.modalBg}; border: 1px solid ${themeInfo.borderColor}; color: ${themeInfo.textColor};">
          <div class="sw-prompt-editor-header sw-themed-header" 
               style="background: ${themeInfo.headerBg}; border-bottom: 1px solid ${themeInfo.borderColor};">
            <h3 class="sw-prompt-editor-title" 
                style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">
              📤 导出提示词预设
            </h3>
            <button class="close-btn sw-themed-close-btn" id="close-prompt-export-modal" title="关闭"
                    style="color: ${themeInfo.textColor};">
              <span>✕</span>
            </button>
          </div>
          <div class="sw-prompt-editor-body sw-themed-body">
            <div class="form-group">
              <label for="prompt-preset-export-name" class="form-label sw-themed-label" 
                     style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">预设名称</label>
              <input type="text" id="prompt-preset-export-name" class="form-input sw-themed-input" 
                     value="${promptPreset.name}"
                     style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor}; color: ${themeInfo.textColor};" />
            </div>
            
            <div class="form-group">
              <label for="prompt-preset-export-description" class="form-label sw-themed-label"
                     style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">预设描述</label>
              <textarea id="prompt-preset-export-description" class="form-textarea sw-themed-textarea" rows="3" 
                        placeholder="输入提示词预设描述..."
                        style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor}; color: ${themeInfo.textColor};">${promptPreset.description}</textarea>
            </div>
            
            <div style="background: ${themeInfo.contentBg}; padding: 15px; border-radius: 6px; border: 1px solid ${themeInfo.borderColor}; margin-bottom: 15px;">
              <h4 style="color: ${themeInfo.headingColor}; margin: 0 0 10px 0;">包含的内容</h4>
              <p style="color: ${themeInfo.textColor}; margin: 5px 0;"><strong>提示词数量:</strong> ${promptPreset.prompts.length}</p>
              <p style="color: ${themeInfo.textColor}; margin: 5px 0;"><strong>排序配置:</strong> ${promptPreset.promptOrder.length} 项</p>
            </div>
            
            <div class="form-help sw-themed-help" 
                 style="color: ${themeInfo.mutedColor}; font-size: 12px;">
              💡 此预设只包含提示词和排序配置，不包含其他插件设置
            </div>
          </div>
          <div class="sw-prompt-editor-footer sw-themed-footer" 
               style="background: ${themeInfo.headerBg}; border-top: 1px solid ${themeInfo.borderColor};">
            <button class="secondary-btn sw-themed-secondary-btn" id="cancel-prompt-export"
                    style="background: ${themeInfo.secondaryBtnBg}; border: 1px solid ${themeInfo.borderColor}; color: ${themeInfo.textColor};">
              取消
            </button>
            <button class="primary-btn sw-themed-primary-btn" id="confirm-prompt-export"
                    style="background: ${themeInfo.primaryBtnBg}; border: 1px solid ${themeInfo.primaryBtnBorder}; color: ${themeInfo.primaryBtnColor}; font-weight: ${themeInfo.boldWeight};">
              📤 导出提示词
            </button>
          </div>
        </div>
      </div>
    `);

    $('body').append(modal);

    // Event handlers
    modal.find('#close-prompt-export-modal, #cancel-prompt-export').on('click', () => {
      modal.addClass('closing');
      setTimeout(() => modal.remove(), 200);
    });

    modal.find('#confirm-prompt-export').on('click', () => {
      const customName = $('#prompt-preset-export-name').val() || promptPreset.name;
      const customDescription = $('#prompt-preset-export-description').val() || promptPreset.description;

      // Update preset with custom values
      promptPreset.name = customName;
      promptPreset.description = customDescription;

      // Generate filename
      const sanitizedName = customName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
      const fileName = `SW_Prompts_${sanitizedName}_${Date.now()}.json`;

      // Export file
      const jsonContent = JSON.stringify(promptPreset, null, 2);
      download(jsonContent, fileName, 'application/json');

      console.log('[Story Weaver] Prompt preset exported:', fileName);
      showNotification(`提示词预设已导出: ${fileName}`, 'success');

      modal.addClass('closing');
      setTimeout(() => modal.remove(), 200);
    });

    // Close on backdrop click
    modal.on('click', function (e) {
      if (e.target === this) {
        modal.addClass('closing');
        setTimeout(() => modal.remove(), 200);
      }
    });
  } catch (error) {
    console.error('[Story Weaver] Prompt export error:', error);
    showNotification('导出提示词预设时发生错误: ' + error.message, 'error');
  }
}

/**
 * Import prompt preset from file
 */
async function importPromptPreset() {
  try {
    // Create file input element
    const fileInput = $('<input type="file" accept=".json" style="display: none;">');
    $('body').append(fileInput);

    fileInput.on('change', async e => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        console.log('[Story Weaver] Importing prompt preset from file:', file.name);

        // Parse JSON file
        const preset = await parseJsonFile(file);

        // Validate prompt preset
        const validation = validatePromptPreset(preset);
        if (!validation.success) {
          showNotification('无效的提示词预设文件: ' + validation.errors.join(', '), 'error');
          return;
        }

        // Show confirmation dialog
        const confirmed = await showPromptImportConfirmDialog(preset);
        if (confirmed) {
          const success = applyImportedPromptPreset(preset);
          if (success) {
            showNotification(`提示词预设导入成功: ${preset.name}`, 'success');
          }
        }
      } catch (error) {
        console.error('[Story Weaver] Prompt import error:', error);
        showNotification('导入提示词预设失败: ' + error.message, 'error');
      } finally {
        fileInput.remove();
      }
    });

    // Trigger file selection
    fileInput.trigger('click');
  } catch (error) {
    console.error('[Story Weaver] Prompt import initialization error:', error);
    showNotification('初始化提示词导入功能失败: ' + error.message, 'error');
  }
}

/**
 * Validate any SillyTavern compatible preset format
 * @param {Object} preset - Preset object to validate
 * @returns {Object} Validation result with success status and errors
 */
function validatePromptPreset(preset) {
  const errors = [];

  if (!preset || typeof preset !== 'object') {
    return { success: false, errors: ['Invalid preset format: not an object'] };
  }

  console.log('[Story Weaver] Validating preset:', preset);

  // Check for SillyTavern character-specific prompt collection format
  if (preset.prompts && Array.isArray(preset.prompts) && preset.prompt_order && Array.isArray(preset.prompt_order)) {
    // Check if this has character-specific configurations
    const characterConfig = preset.prompt_order.find(order => order.character_id === 100001);
    if (characterConfig) {
      console.log('[Story Weaver] Detected SillyTavern character-specific prompt collection');
      return {
        success: true,
        errors: [],
        detectedType: 'character_prompt_collection',
        data: {
          prompts: preset.prompts,
          order: characterConfig.order,
        },
      };
    }
  }

  // Check for standard SillyTavern prompt collection format
  if (preset.prompts && Array.isArray(preset.prompts)) {
    console.log('[Story Weaver] Detected SillyTavern prompt collection');
    return { success: true, errors: [], detectedType: 'prompt_collection', data: preset };
  }

  // Check for single prompt format
  if (preset.identifier || preset.content || preset.role) {
    console.log('[Story Weaver] Detected single prompt');
    return { success: true, errors: [], detectedType: 'single_prompt', data: preset };
  }

  // Check for SillyTavern Instruct preset format
  if (isInstructPreset(preset)) {
    console.log('[Story Weaver] Detected SillyTavern Instruct preset');
    return { success: true, errors: [], detectedType: 'instruct', data: preset };
  }

  // Check for SillyTavern Context preset format
  if (isContextPreset(preset)) {
    console.log('[Story Weaver] Detected SillyTavern Context preset');
    return { success: true, errors: [], detectedType: 'context', data: preset };
  }

  // Check for SillyTavern System Prompt format
  if (isSystemPromptPreset(preset)) {
    console.log('[Story Weaver] Detected SillyTavern System Prompt preset');
    return { success: true, errors: [], detectedType: 'system_prompt', data: preset };
  }

  // Accept any JSON object as generic preset
  if (Object.keys(preset).length > 0) {
    console.log('[Story Weaver] Accepting as generic preset');
    return { success: true, errors: [], detectedType: 'generic', data: preset };
  }

  // If nothing matches, it's an error
  errors.push('Empty or unrecognized preset format.');

  return {
    success: false,
    errors: errors,
  };
}

/**
 * Validate Story Weaver specific preset format
 */
function validateStoryWeaverPreset(preset) {
  const errors = [];

  if (!preset.version) {
    console.warn('[Story Weaver] Missing version, but accepting preset');
  }

  // For prompt-only presets, check direct properties
  if (preset.type === 'story_weaver_prompts') {
    if (!preset.prompts || !Array.isArray(preset.prompts)) {
      errors.push('Missing or invalid prompts array in Story Weaver prompt preset');
    }
  }
  // For full presets, check settings object
  else if (preset.settings) {
    if (preset.settings.prompts && !Array.isArray(preset.settings.prompts)) {
      errors.push('Prompts must be an array in Story Weaver full preset');
    }
  } else {
    console.warn('[Story Weaver] Missing settings in Story Weaver preset, but accepting');
  }

  return {
    success: errors.length === 0,
    errors: errors,
    detectedType: 'story_weaver',
  };
}

/**
 * Check if preset is SillyTavern Instruct format
 */
function isInstructPreset(preset) {
  // Instruct presets typically have these properties
  const instructKeys = [
    'input_sequence',
    'output_sequence',
    'system_sequence',
    'system_prefix',
    'system_suffix',
    'wrap',
    'macro',
  ];

  return instructKeys.some(key => preset.hasOwnProperty(key));
}

/**
 * Check if preset is SillyTavern Context format
 */
function isContextPreset(preset) {
  // Context presets typically have these properties
  const contextKeys = ['story_string', 'example_separator', 'chat_start', 'tokenizer', 'context_template'];

  return contextKeys.some(key => preset.hasOwnProperty(key));
}

/**
 * Check if preset is SillyTavern System Prompt format
 */
function isSystemPromptPreset(preset) {
  // System prompt presets are usually simple with content/prompt
  return preset.hasOwnProperty('content') || preset.hasOwnProperty('prompt') || preset.hasOwnProperty('system_prompt');
}

/**
 * Apply a prompt preset directly (no conversion, SillyTavern native)
 * @param {Object} preset - Prompt preset object to apply
 * @returns {boolean} Success status
 */
function applyImportedPromptPreset(preset) {
  const validation = validatePromptPreset(preset);
  if (!validation.success) {
    console.error('[Story Weaver] Prompt preset validation failed:', validation.errors);
    showNotification('提示词预设验证失败: ' + validation.errors.join(', '), 'error');
    return false;
  }

  try {
    console.log('[Story Weaver] Applying preset with detected type:', validation.detectedType);

    const { detectedType, data } = validation;

    switch (detectedType) {
      case 'character_prompt_collection':
        // Character-specific SillyTavern prompt collection
        applyPromptCollection(data);
        break;

      case 'prompt_collection':
        // Direct import of SillyTavern prompt collection
        applyPromptCollection(data);
        break;

      case 'single_prompt':
        // Import single prompt
        applySinglePrompt(data);
        break;

      case 'instruct':
      case 'context':
      case 'system_prompt':
      case 'generic':
        // Create a prompt from other formats
        applyGenericPreset(data, detectedType);
        break;

      default:
        throw new Error(`Unsupported preset type: ${detectedType}`);
    }

    // Save updated settings
    extension_settings[extensionName] = settings;
    saveSettings();

    console.log('[Story Weaver] Prompt preset applied successfully:', data.name);
    showNotification(`提示词预设已应用: ${data.name || '未命名预设'} (${detectedType})`, 'success');

    // Update prompt manager UI
    renderPromptManager();

    return true;
  } catch (error) {
    console.error('[Story Weaver] Error applying prompt preset:', error);
    showNotification('应用提示词预设时发生错误: ' + error.message, 'error');
    return false;
  }
}

/**
 * Apply SillyTavern prompt collection format
 */
function applyPromptCollection(data) {
  // COMPLETE OVERRIDE: Clear existing prompts AND settings
  storyWeaverPrompts = new PromptCollection();
  storyWeaverPromptOrder = [];

  console.log('[Story Weaver] Applying prompt collection, data structure:', {
    hasPrompts: !!data.prompts,
    promptsCount: data.prompts?.length,
    hasOrder: !!data.order,
    orderCount: data.order?.length,
    hasPromptOrder: !!data.promptOrder,
    promptOrderCount: data.promptOrder?.length,
  });

  // Check if we have order array first - this determines what prompts to import
  if (data.order && Array.isArray(data.order)) {
    console.log('[Story Weaver] Using data.order array for ordering and enabled states');

    // ONLY add prompts that are in the order array
    data.order.forEach(orderItem => {
      const identifier = orderItem.identifier || orderItem;
      const promptData = data.prompts?.find(p => p.identifier === identifier);

      if (promptData) {
        // Add this prompt to collection
        addPromptToStoryWeaver(promptData);

        // Set enabled state from order array
        const prompt = storyWeaverPrompts.get(identifier);
        if (prompt && typeof orderItem === 'object') {
          // Preserve EXACT enabled state from JSON
          prompt.enabled = orderItem.enabled === true;
          console.log(`[Story Weaver] Added prompt "${identifier}" enabled: ${prompt.enabled}`);
        }
      } else {
        console.warn(
          `[Story Weaver] Prompt with identifier "${identifier}" found in order array but not in prompts array`,
        );
      }
    });

    // Set exact order from JSON order array
    storyWeaverPromptOrder = data.order.map(orderItem => orderItem.identifier || orderItem);
  }
  // Fallback to promptOrder (Story Weaver format)
  else if (data.promptOrder && Array.isArray(data.promptOrder)) {
    console.log('[Story Weaver] Using data.promptOrder array for ordering and enabled states');

    // ONLY add prompts that are in the promptOrder array
    data.promptOrder.forEach(orderItem => {
      const identifier = typeof orderItem === 'string' ? orderItem : orderItem.identifier;
      const promptData = data.prompts?.find(p => p.identifier === identifier);

      if (promptData) {
        // Add this prompt to collection
        addPromptToStoryWeaver(promptData);

        // Set enabled state from promptOrder array
        const prompt = storyWeaverPrompts.get(identifier);
        if (prompt && typeof orderItem === 'object') {
          // Preserve EXACT enabled state from JSON
          prompt.enabled = orderItem.enabled === true;
          console.log(`[Story Weaver] Added prompt "${identifier}" enabled: ${prompt.enabled}`);
        }
      } else {
        console.warn(
          `[Story Weaver] Prompt with identifier "${identifier}" found in promptOrder array but not in prompts array`,
        );
      }
    });

    // Set exact order from promptOrder array
    storyWeaverPromptOrder = data.promptOrder.map(orderItem =>
      typeof orderItem === 'string' ? orderItem : orderItem.identifier,
    );
  }
  // Last fallback: use prompts array order with injection_order
  else if (data.prompts && Array.isArray(data.prompts)) {
    console.log('[Story Weaver] Fallback: Using prompts array sorted by injection_order');

    // Sort prompts by injection_order to maintain some order
    const sortedPrompts = [...data.prompts].sort((a, b) => (a.injection_order || 0) - (b.injection_order || 0));
    storyWeaverPromptOrder = sortedPrompts.map(p => p.identifier);

    // Apply enabled states from prompts directly
    data.prompts.forEach(promptData => {
      const prompt = storyWeaverPrompts.get(promptData.identifier);
      if (prompt && promptData.hasOwnProperty('enabled')) {
        prompt.enabled = promptData.enabled === true;
        console.log(`[Story Weaver] Set prompt "${promptData.identifier}" enabled: ${prompt.enabled}`);
      }
    });
  }

  // COMPLETE SETTINGS OVERRIDE: Apply all settings from imported preset
  if (data.settings || data.contextLength !== undefined || data.storyType !== undefined) {
    const importedSettings = data.settings || data;

    // Override ALL settings completely
    settings.contextLength = importedSettings.contextLength || 100;
    settings.storyType = importedSettings.storyType || 'fantasy';
    settings.detailLevel = importedSettings.detailLevel || 'detailed';
    settings.chapterCount = importedSettings.chapterCount || 5;
    settings.includeCharacters = importedSettings.includeCharacters !== false;
    settings.includeSummary = importedSettings.includeSummary !== false;
    settings.includeThemes = importedSettings.includeThemes === true;

    // Update UI to reflect new settings
    $('#context-length').val(settings.contextLength);
    $('#story-type').val(settings.storyType);
    $('#detail-level').val(settings.detailLevel);
    $('#chapter-count').val(settings.chapterCount);
    $('#include-characters').prop('checked', settings.includeCharacters);
    $('#include-summary').prop('checked', settings.includeSummary);
    $('#include-themes').prop('checked', settings.includeThemes);

    console.log('[Story Weaver] Applied complete settings override:', importedSettings);
  }

  // Update settings for compatibility
  settings.prompts = getStoryWeaverPrompts().map(p => ({ ...p }));
  settings.promptOrder = getStoryWeaverPromptOrder().map(identifier => ({
    identifier,
    enabled: storyWeaverPrompts.get(identifier)?.enabled !== false,
  }));

  console.log(
    '[Story Weaver] Applied complete preset override with',
    getStoryWeaverPrompts().length,
    'prompts and all settings',
  );
}

/**
 * Apply single prompt
 */
function applySinglePrompt(data) {
  // Clear existing and add single prompt
  storyWeaverPrompts = new PromptCollection();
  storyWeaverPromptOrder = [];

  addPromptToStoryWeaver(data);

  // Update settings for compatibility
  settings.prompts = getStoryWeaverPrompts().map(p => ({ ...p }));
  settings.promptOrder = getStoryWeaverPromptOrder().map(identifier => ({
    identifier,
    enabled: storyWeaverPrompts.get(identifier)?.enabled !== false,
  }));

  console.log('[Story Weaver] Applied single prompt:', storyWeaverPrompts.get(data.identifier)?.name);
}

/**
 * Apply generic preset (convert to prompt)
 */
function applyGenericPreset(data, type) {
  // Clear existing and create generic prompt
  storyWeaverPrompts = new PromptCollection();
  storyWeaverPromptOrder = [];

  const content = extractContentFromPreset(data, type);
  const promptData = {
    identifier: `${type}_${Date.now()}`,
    name: data.name || `Imported ${type} preset`,
    role: 'system',
    content: content,
    system_prompt: true,
    injection_position: INJECTION_POSITION.RELATIVE,
    injection_depth: 0,
    injection_order: 100,
    forbid_overrides: false,
  };

  addPromptToStoryWeaver(promptData);

  // Update settings for compatibility
  settings.prompts = getStoryWeaverPrompts().map(p => ({ ...p }));
  settings.promptOrder = getStoryWeaverPromptOrder().map(identifier => ({
    identifier,
    enabled: storyWeaverPrompts.get(identifier)?.enabled !== false,
  }));

  console.log('[Story Weaver] Applied generic preset as prompt:', promptData.name);
}

/**
 * Extract content from various preset types
 */
function extractContentFromPreset(data, type) {
  switch (type) {
    case 'instruct':
      return (
        `# Instruct预设: ${data.name || '未命名'}\n\n` +
        (data.system_sequence ? `系统序列: ${data.system_sequence}\n` : '') +
        (data.input_sequence ? `输入序列: ${data.input_sequence}\n` : '') +
        (data.output_sequence ? `输出序列: ${data.output_sequence}\n` : '') +
        '\n这是从SillyTavern Instruct预设导入的配置。'
      );

    case 'context':
      return (
        `# Context预设: ${data.name || '未命名'}\n\n` +
        (data.story_string ? `故事字符串:\n${data.story_string}\n\n` : '') +
        (data.chat_start ? `对话开始:\n${data.chat_start}\n\n` : '') +
        '\n这是从SillyTavern Context预设导入的配置。'
      );

    case 'system_prompt':
      return data.content || data.prompt || data.system_prompt || '系统提示词';

    case 'generic':
    default:
      // Try to extract meaningful content
      const contentFields = ['content', 'text', 'prompt', 'message', 'description'];
      for (const field of contentFields) {
        if (data[field] && typeof data[field] === 'string' && data[field].trim()) {
          return data[field];
        }
      }

      // Fallback to object summary
      return (
        `# 通用预设: ${data.name || '未命名'}\n\n` +
        Object.entries(data)
          .filter(([key, value]) => typeof value === 'string' || typeof value === 'number')
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n')
      );
  }
}

/**
 * Convert various preset formats to Story Weaver prompt format
 * @param {Object} preset - The original preset
 * @param {string} detectedType - The detected preset type
 * @returns {Array} Array of Story Weaver prompt objects
 */
function convertPresetToStoryWeaverFormat(preset, detectedType) {
  const prompts = [];
  const timestamp = Date.now();

  switch (detectedType) {
    case 'story_weaver':
      // Handle Story Weaver specific formats
      if (preset.type === 'story_weaver_prompts') {
        return preset.prompts || [];
      } else if (preset.settings && preset.settings.prompts) {
        return preset.settings.prompts;
      }
      break;

    case 'instruct':
      // Convert SillyTavern Instruct preset to prompts
      prompts.push({
        identifier: `imported_instruct_${timestamp}`,
        name: `${preset.name || '导入的Instruct预设'}`,
        role: 'system',
        content: buildInstructPromptContent(preset),
        system_prompt: false,
        position: 'instruct',
        injection_position: 0,
        injection_depth: 0,
        injection_order: 10,
        forbid_overrides: false,
      });
      break;

    case 'context':
      // Convert SillyTavern Context preset to prompts
      prompts.push({
        identifier: `imported_context_${timestamp}`,
        name: `${preset.name || '导入的Context预设'}`,
        role: 'system',
        content: buildContextPromptContent(preset),
        system_prompt: false,
        position: 'context',
        injection_position: 0,
        injection_depth: 0,
        injection_order: 20,
        forbid_overrides: false,
      });
      break;

    case 'system_prompt':
      // Convert System Prompt to Story Weaver format
      prompts.push({
        identifier: `imported_system_${timestamp}`,
        name: `${preset.name || '导入的系统提示词'}`,
        role: 'system',
        content: preset.content || preset.prompt || preset.system_prompt || '',
        system_prompt: true,
        position: 'system',
        injection_position: 0,
        injection_depth: 0,
        injection_order: 5,
        forbid_overrides: false,
      });
      break;

    case 'generic':
      // Convert generic JSON preset
      const content = extractContentFromGenericPreset(preset);
      if (content) {
        prompts.push({
          identifier: `imported_generic_${timestamp}`,
          name: `${preset.name || '导入的通用预设'}`,
          role: 'user',
          content: content,
          system_prompt: false,
          position: 'generic',
          injection_position: 0,
          injection_depth: 0,
          injection_order: 50,
          forbid_overrides: false,
        });
      }
      break;

    default:
      console.warn('[Story Weaver] Unknown preset type, attempting generic conversion');
      const genericContent = extractContentFromGenericPreset(preset);
      if (genericContent) {
        prompts.push({
          identifier: `imported_unknown_${timestamp}`,
          name: `${preset.name || '未知格式预设'}`,
          role: 'user',
          content: genericContent,
          system_prompt: false,
          position: 'unknown',
          injection_position: 0,
          injection_depth: 0,
          injection_order: 99,
          forbid_overrides: false,
        });
      }
      break;
  }

  return prompts;
}

/**
 * Build prompt content from SillyTavern Instruct preset
 */
function buildInstructPromptContent(preset) {
  let content = `# Instruct模板: ${preset.name || '未命名'}\n\n`;

  if (preset.system_sequence) {
    content += `系统序列: ${preset.system_sequence}\n`;
  }
  if (preset.input_sequence) {
    content += `输入序列: ${preset.input_sequence}\n`;
  }
  if (preset.output_sequence) {
    content += `输出序列: ${preset.output_sequence}\n`;
  }
  if (preset.system_suffix) {
    content += `系统后缀: ${preset.system_suffix}\n`;
  }

  content += '\n这是从SillyTavern Instruct预设导入的配置。';

  return content;
}

/**
 * Build prompt content from SillyTavern Context preset
 */
function buildContextPromptContent(preset) {
  let content = `# Context模板: ${preset.name || '未命名'}\n\n`;

  if (preset.story_string) {
    content += `故事字符串:\n${preset.story_string}\n\n`;
  }
  if (preset.chat_start) {
    content += `对话开始:\n${preset.chat_start}\n\n`;
  }
  if (preset.example_separator) {
    content += `示例分隔符: ${preset.example_separator}\n`;
  }

  content += '\n这是从SillyTavern Context预设导入的配置。';

  return content;
}

/**
 * Extract content from generic preset
 */
function extractContentFromGenericPreset(preset) {
  // Try to find text content in various common properties
  const contentFields = ['content', 'text', 'prompt', 'message', 'description', 'system_prompt'];

  for (const field of contentFields) {
    if (preset[field] && typeof preset[field] === 'string' && preset[field].trim()) {
      return preset[field];
    }
  }

  // If no direct text found, create a summary of the preset
  let content = `# 通用预设: ${preset.name || '未命名'}\n\n`;
  content += '预设内容:\n';

  for (const [key, value] of Object.entries(preset)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      content += `${key}: ${value}\n`;
    }
  }

  return content;
}

/**
 * Show prompt import confirmation dialog
 * @param {Object} preset - Prompt preset to import
 * @returns {Promise<boolean>} User confirmation
 */
async function showPromptImportConfirmDialog(preset) {
  return new Promise(resolve => {
    const themeInfo = getThemeInfo('body');

    // Detect preset type for display
    const validation = validatePromptPreset(preset);
    const presetType = validation.detectedType || 'unknown';
    const typeDisplayNames = {
      story_weaver: 'Story Weaver预设',
      instruct: 'SillyTavern Instruct预设',
      context: 'SillyTavern Context预设',
      system_prompt: 'SillyTavern 系统提示词',
      generic: '通用JSON预设',
      unknown: '未知格式预设',
    };

    // Get preset data for display
    let promptsInfo = '';
    if (presetType === 'story_weaver') {
      const prompts = preset.prompts || preset.settings?.prompts || [];
      promptsInfo = `将导入 ${prompts.length} 个提示词`;
    } else {
      promptsInfo = '将转换为Story Weaver提示词格式';
    }

    const modal = $(`
      <div class="sw-prompt-editor-modal sw-themed-modal">
        <div class="sw-prompt-editor-content sw-themed-content" 
             style="background: ${themeInfo.modalBg}; border: 1px solid ${themeInfo.borderColor}; color: ${
      themeInfo.textColor
    };">
          <div class="sw-prompt-editor-header sw-themed-header" 
               style="background: ${themeInfo.headerBg}; border-bottom: 1px solid ${themeInfo.borderColor};">
            <h3 class="sw-prompt-editor-title" 
                style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">
              📥 导入提示词预设确认
            </h3>
            <button class="close-btn sw-themed-close-btn" id="close-prompt-import-modal" title="关闭"
                    style="color: ${themeInfo.textColor};">
              <span>✕</span>
            </button>
          </div>
          <div class="sw-prompt-editor-body sw-themed-body">
            <div style="margin-bottom: 20px;">
              <h4 style="color: ${themeInfo.headingColor}; margin-bottom: 10px;">预设信息</h4>
              <div style="background: ${themeInfo.contentBg}; padding: 15px; border-radius: 6px; border: 1px solid ${
      themeInfo.borderColor
    };">
                <p><strong style="color: ${themeInfo.boldTextColor}; font-weight: ${
      themeInfo.boldWeight
    };">名称:</strong> ${preset.name || '未命名预设'}</p>
                <p><strong style="color: ${themeInfo.boldTextColor}; font-weight: ${
      themeInfo.boldWeight
    };">预设类型:</strong> ${typeDisplayNames[presetType]}</p>
                <p><strong style="color: ${themeInfo.boldTextColor}; font-weight: ${
      themeInfo.boldWeight
    };">描述:</strong> ${preset.description || promptsInfo}</p>
                ${
                  preset.version
                    ? `<p><strong style="color: ${themeInfo.boldTextColor}; font-weight: ${themeInfo.boldWeight};">版本:</strong> ${preset.version}</p>`
                    : ''
                }
                ${
                  preset.metadata?.created
                    ? `<p><strong style="color: ${themeInfo.boldTextColor}; font-weight: ${themeInfo.boldWeight};">创建时间:</strong> ${preset.metadata.created}</p>`
                    : ''
                }
              </div>
            </div>
            
            <div class="form-help sw-themed-help" 
                 style="color: ${
                   themeInfo.mutedColor
                 }; background: rgba(255, 165, 0, 0.1); border-left: 3px solid orange; padding: 10px;">
              ⚠️ 导入此预设将替换当前的所有提示词配置。${
                presetType !== 'story_weaver' ? ' 非Story Weaver预设将被自动转换为适合的格式。' : ''
              } 请确保您已备份当前配置。
            </div>
          </div>
          <div class="sw-prompt-editor-footer sw-themed-footer" 
               style="background: ${themeInfo.headerBg}; border-top: 1px solid ${themeInfo.borderColor};">
            <button class="secondary-btn sw-themed-secondary-btn" id="cancel-prompt-import"
                    style="background: ${themeInfo.secondaryBtnBg}; border: 1px solid ${
      themeInfo.borderColor
    }; color: ${themeInfo.textColor};">
              取消
            </button>
            <button class="primary-btn sw-themed-primary-btn" id="confirm-prompt-import"
                    style="background: ${themeInfo.primaryBtnBg}; border: 1px solid ${
      themeInfo.primaryBtnBorder
    }; color: ${themeInfo.primaryBtnColor}; font-weight: ${themeInfo.boldWeight};">
              📥 确认导入提示词
            </button>
          </div>
        </div>
      </div>
    `);

    $('body').append(modal);

    // Event handlers
    modal.find('#close-prompt-import-modal, #cancel-prompt-import').on('click', () => {
      modal.addClass('closing');
      setTimeout(() => {
        modal.remove();
        resolve(false);
      }, 200);
    });

    modal.find('#confirm-prompt-import').on('click', () => {
      modal.addClass('closing');
      setTimeout(() => {
        modal.remove();
        resolve(true);
      }, 200);
    });

    // Close on backdrop click
    modal.on('click', function (e) {
      if (e.target === this) {
        modal.addClass('closing');
        setTimeout(() => {
          modal.remove();
          resolve(false);
        }, 200);
      }
    });
  });
}

/**
 * Update settings UI to reflect current settings
 */
function updateSettingsUI() {
  try {
    // Update form elements with current settings
    $('#context-length').val(settings.contextLength || 100);
    $('#story-type').val(settings.storyType || 'fantasy');
    $('#detail-level').val(settings.detailLevel || 'detailed');
    $('#chapter-count').val(settings.chapterCount || 5);

    // Update checkbox settings if they exist
    if ($('#include-characters').length) {
      $('#include-characters').prop('checked', settings.includeCharacters !== false);
    }
    if ($('#include-summary').length) {
      $('#include-summary').prop('checked', settings.includeSummary !== false);
    }
    if ($('#include-themes').length) {
      $('#include-themes').prop('checked', settings.includeThemes === true);
    }

    console.log('[Story Weaver] Settings UI updated');
  } catch (error) {
    console.error('[Story Weaver] Error updating settings UI:', error);
  }
}

/**
 * Open a simple Regex Manager modal for plugin-scoped rules
 */
function openRegexManager() {
  try {
    const theme = getThemeInfo('body');
    const rules = Array.isArray(settings.regexRules) ? settings.regexRules : [];
    const enabled = settings.regexEnabled !== false;

    const rows = rules
      .map(
        (r, idx) => `
        <tr data-index="${idx}">
          <td><input type="checkbox" class="rgx-enabled" ${r.enabled === false ? '' : 'checked'} /></td>
          <td><input type="text" class="rgx-pattern" value="${$('<div/>')
            .text(r.pattern || '')
            .html()}" placeholder="正则表达式" /></td>
          <td><input type="text" class="rgx-flags" value="${$('<div/>')
            .text(r.flags || 'g')
            .html()}" placeholder="gmi" /></td>
          <td><input type="text" class="rgx-repl" value="${$('<div/>')
            .text(r.replacement || '')
            .html()}" placeholder="替换为" /></td>
          <td>
            <select class="rgx-target">
              <option value="both" ${r.target === 'both' || !r.target ? 'selected' : ''}>提示词与结果</option>
              <option value="prompt" ${r.target === 'prompt' ? 'selected' : ''}>仅提示词</option>
              <option value="result" ${r.target === 'result' ? 'selected' : ''}>仅结果</option>
            </select>
          </td>
          <td><button class="rgx-delete">🗑️</button></td>
        </tr>`,
      )
      .join('');

    const html = `
      <div class="sw-prompt-editor-modal sw-themed-modal" style="z-index:10001;">
        <div class="sw-prompt-editor-content sw-themed-content" style="background:${theme.modalBg}; border:1px solid ${
      theme.borderColor
    }; color:${theme.textColor}; min-width:720px;">
          <div class="sw-prompt-editor-header sw-themed-header" style="background:${
            theme.headerBg
          }; border-bottom:1px solid ${
      theme.borderColor
    }; display:flex; align-items:center; justify-content:space-between;">
            <h3 class="sw-prompt-editor-title" style="color:${theme.textColor}; font-weight:${
      theme.boldWeight
    }; margin:0;">🧩 正则规则（仅作用于本插件）</h3>
            <div>
              <label style="font-size:12px; margin-right:12px;">
                <input type="checkbox" id="rgx-master-enabled" ${enabled ? 'checked' : ''}/> 启用正则
              </label>
              <button class="close-btn sw-themed-close-btn" id="rgx-close" title="关闭" style="color:${
                theme.textColor
              };"><span>✕</span></button>
            </div>
          </div>
          <div class="sw-prompt-editor-body sw-themed-body" style="padding:12px;">
            <div class="form-help" style="margin-bottom:8px; color:${
              theme.mutedColor
            };">提示：规则按从上到下依次应用。仅影响本插件发送的提示词与显示的结果，不会影响聊天楼层。</div>
            <table class="rgx-table" style="width:100%; border-collapse:collapse; font-size:12px;">
              <thead>
                <tr>
                  <th style="text-align:left; padding:6px; border-bottom:1px solid ${theme.borderColor};">启用</th>
                  <th style="text-align:left; padding:6px; border-bottom:1px solid ${theme.borderColor};">正则</th>
                  <th style="text-align:left; padding:6px; border-bottom:1px solid ${theme.borderColor};">标志</th>
                  <th style="text-align:left; padding:6px; border-bottom:1px solid ${theme.borderColor};">替换</th>
                  <th style="text-align:left; padding:6px; border-bottom:1px solid ${theme.borderColor};">作用范围</th>
                  <th style="text-align:left; padding:6px; border-bottom:1px solid ${theme.borderColor};">操作</th>
                </tr>
              </thead>
              <tbody id="rgx-rows">
                ${rows || ''}
              </tbody>
            </table>
            <div style="margin-top:10px; display:flex; gap:8px;">
              <button id="rgx-add" class="preview-btn">➕ 新增规则</button>
              <button id="rgx-move-up" class="preview-btn">⬆️ 上移</button>
              <button id="rgx-move-down" class="preview-btn">⬇️ 下移</button>
              <button id="rgx-save" class="preview-btn">💾 保存</button>
              <button id="rgx-test-prompt" class="preview-btn">🧪 测试提示词</button>
              <button id="rgx-test-result" class="preview-btn">🧪 测试结果</button>
            </div>
          </div>
        </div>
      </div>`;

    const $modal = $(html);
    $('body').append($modal);

    function collectRules() {
      const out = [];
      $('#rgx-rows tr').each(function () {
        out.push({
          enabled: $(this).find('.rgx-enabled').prop('checked'),
          pattern: $(this).find('.rgx-pattern').val() || '',
          flags: $(this).find('.rgx-flags').val() || 'g',
          replacement: $(this).find('.rgx-repl').val() || '',
          target: $(this).find('.rgx-target').val() || 'both',
        });
      });
      return out;
    }

    $modal.on('click', '#rgx-close', () => $modal.remove());
    $modal.on('click', '#rgx-add', () => {
      $('#rgx-rows').append(`
        <tr data-index="${$('#rgx-rows tr').length}">
          <td><input type="checkbox" class="rgx-enabled" checked /></td>
          <td><input type="text" class="rgx-pattern" placeholder="正则表达式" /></td>
          <td><input type="text" class="rgx-flags" value="g" placeholder="gmi" /></td>
          <td><input type="text" class="rgx-repl" placeholder="替换为" /></td>
          <td>
            <select class="rgx-target">
              <option value="both" selected>提示词与结果</option>
              <option value="prompt">仅提示词</option>
              <option value="result">仅结果</option>
            </select>
          </td>
          <td><button class="rgx-delete">🗑️</button></td>
        </tr>`);
    });

    $modal.on('click', '.rgx-delete', function () {
      $(this).closest('tr').remove();
    });

    $modal.on('click', '#rgx-move-up', function () {
      const $sel = $('#rgx-rows tr.selected').first();
      if ($sel.length) $sel.prev().before($sel);
    });
    $modal.on('click', '#rgx-move-down', function () {
      const $sel = $('#rgx-rows tr.selected').first();
      if ($sel.length) $sel.next().after($sel);
    });
    $modal.on('click', '#rgx-rows tr', function () {
      $('#rgx-rows tr').removeClass('selected');
      $(this).addClass('selected');
    });

    $modal.on('click', '#rgx-save', function () {
      settings.regexEnabled = $('#rgx-master-enabled').prop('checked');
      settings.regexRules = collectRules();
      saveSettings();
      showNotification('正则规则已保存（仅作用于本插件）', 'success');
      $modal.remove();
    });

    $modal.on('click', '#rgx-test-prompt', function () {
      const tmp = collectRules();
      const sample = (window.StoryWeaverLastPrompt || '').toString();
      const backup = { regexRules: settings.regexRules, regexEnabled: settings.regexEnabled };
      settings.regexRules = tmp;
      settings.regexEnabled = true;
      const out = applyPluginRegex(sample, 'prompt');
      settings.regexRules = backup.regexRules;
      settings.regexEnabled = backup.regexEnabled;
      navigator.clipboard?.writeText(out);
      showNotification('已将测试后的提示词复制到剪贴板', 'success');
    });

    $modal.on('click', '#rgx-test-result', function () {
      const tmp = collectRules();
      const sample = ($('#output-content').text() || '').toString();
      const backup = { regexRules: settings.regexRules, regexEnabled: settings.regexEnabled };
      settings.regexRules = tmp;
      settings.regexEnabled = true;
      const out = applyPluginRegex(sample, 'result');
      settings.regexRules = backup.regexRules;
      settings.regexEnabled = backup.regexEnabled;
      navigator.clipboard?.writeText(out);
      showNotification('已将测试后的结果复制到剪贴板', 'success');
    });
  } catch (e) {
    console.error('[Story Weaver] openRegexManager failed:', e);
  }
}

// Story Weaver Native Prompt System (SillyTavern compatible)
const storyWeaverDefaultPrompts = {
  prompts: [
    {
      identifier: 'sw_system',
      name: '故事编剧系统提示词',
      role: 'system',
      content: '你是一个专业的故事策划师和编剧。你需要根据提供的信息生成详细、连贯的故事大纲。',
      system_prompt: true,
      injection_position: INJECTION_POSITION.RELATIVE,
      injection_depth: 0,
      injection_order: 10,
      forbid_overrides: false,
      enabled: true,
    },
    {
      identifier: 'worldInfoBefore',
      name: 'World Info (before)',
      role: 'system',
      content: '',
      system_prompt: true,
      injection_position: INJECTION_POSITION.RELATIVE,
      injection_depth: 1,
      injection_order: 15,
      forbid_overrides: false,
      enabled: true,
      marker: true,
    },
    {
      identifier: 'sw_worldbook',
      name: '世界观设定 (备用)',
      role: 'system',
      content: '## 世界观设定\n注意：现在使用原生World Info marker系统，此条目仅作备用。',
      system_prompt: true,
      injection_position: INJECTION_POSITION.RELATIVE,
      injection_depth: 2,
      injection_order: 20,
      forbid_overrides: false,
      enabled: false, // Disabled by default since we use native markers
    },
    {
      identifier: 'sw_character',
      name: '角色信息',
      role: 'system',
      content: '## 角色信息\n{character}',
      system_prompt: true,
      injection_position: INJECTION_POSITION.RELATIVE,
      injection_depth: 2,
      injection_order: 30,
      forbid_overrides: false,
      enabled: true,
    },
    {
      identifier: 'chatHistory',
      name: 'Chat History (World Info integration point)',
      role: 'system',
      content: '',
      system_prompt: true,
      injection_position: INJECTION_POSITION.RELATIVE,
      injection_depth: 2,
      injection_order: 38,
      forbid_overrides: false,
      enabled: true,
      marker: true,
    },
    {
      identifier: 'sw_chat_context',
      name: '对话历史背景',
      role: 'system',
      content: '## 对话历史背景\n{chat_context}',
      system_prompt: true,
      injection_position: INJECTION_POSITION.RELATIVE,
      injection_depth: 1,
      injection_order: 40,
      forbid_overrides: false,
      enabled: true,
    },
    {
      identifier: 'worldInfoAfter',
      name: 'World Info (after)',
      role: 'system',
      content: '',
      system_prompt: true,
      injection_position: INJECTION_POSITION.RELATIVE,
      injection_depth: 1,
      injection_order: 45,
      forbid_overrides: false,
      enabled: true,
      marker: true,
    },
    {
      identifier: 'worldInfoDepth',
      name: 'World Info (depth-based)',
      role: 'system',
      content: '',
      system_prompt: true,
      injection_position: INJECTION_POSITION.ABSOLUTE,
      injection_depth: 4,
      injection_order: 35,
      forbid_overrides: false,
      enabled: true,
      marker: true,
    },
    {
      identifier: 'sw_requirements',
      name: '创作需求指导',
      role: 'user',
      content: '## 创作需求\n{requirements}\n\n请基于以上信息生成详细的故事大纲。',
      system_prompt: false,
      injection_position: INJECTION_POSITION.RELATIVE,
      injection_depth: 0,
      injection_order: 50,
      forbid_overrides: false,
      enabled: true,
    },
  ],
};

// Default prompt order for Story Weaver (SillyTavern format)
const storyWeaverDefaultPromptOrder = [
  { identifier: 'sw_system', enabled: true },
  { identifier: 'worldInfoBefore', enabled: true },
  { identifier: 'sw_worldbook', enabled: false }, // Disabled by default since we use native markers
  { identifier: 'sw_character', enabled: true },
  { identifier: 'worldInfoDepth', enabled: true },
  { identifier: 'chatHistory', enabled: true },
  { identifier: 'sw_chat_context', enabled: true },
  { identifier: 'worldInfoAfter', enabled: true },
  { identifier: 'sw_requirements', enabled: true },
];

// Initialize Story Weaver Prompt Collection
let storyWeaverPrompts = new PromptCollection();
let storyWeaverPromptOrder = []; // Track prompt order separately

/**
 * Helper functions for PromptCollection integration
 */
function getStoryWeaverPrompts() {
  return storyWeaverPrompts.collection;
}

function getStoryWeaverPromptOrder() {
  return storyWeaverPromptOrder;
}

function addPromptToStoryWeaver(promptData) {
  // Ensure enabled property is set correctly
  const enhancedPromptData = {
    ...promptData,
    enabled: promptData.enabled !== false, // Default to true unless explicitly false
  };

  const prompt = new Prompt(enhancedPromptData);
  storyWeaverPrompts.add(prompt);

  // Add to order if not exists
  if (!storyWeaverPromptOrder.includes(prompt.identifier)) {
    storyWeaverPromptOrder.push(prompt.identifier);
  }

  // Register with SillyTavern if enabled (async, but don't wait)
  if (prompt.enabled) {
    registerStoryWeaverPrompt(prompt).catch(error => {
      console.error(`[Story Weaver] Failed to register prompt ${prompt.identifier}:`, error);
    });
  }

  return prompt;
}

function removePromptFromStoryWeaver(identifier) {
  const index = storyWeaverPrompts.index(identifier);
  if (index !== -1) {
    storyWeaverPrompts.collection.splice(index, 1);
  }

  // Remove from order
  const orderIndex = storyWeaverPromptOrder.indexOf(identifier);
  if (orderIndex !== -1) {
    storyWeaverPromptOrder.splice(orderIndex, 1);
  }

  // Remove from SillyTavern extension prompts
  unregisterStoryWeaverPrompt(identifier);
}

/**
 * Story Weaver Extension Prompt Integration System
 * This system registers Story Weaver prompts with SillyTavern's native prompt system
 * so they are actually sent to the AI model during generation.
 */

// Track registered prompts to avoid duplicates
let registeredPrompts = new Set();

/**
 * Convert Story Weaver prompt position to SillyTavern extension prompt type
 */
function getSillyTavernPromptPosition(storyWeaverPosition) {
  switch (storyWeaverPosition) {
    case 'before':
      return extension_prompt_types.BEFORE_PROMPT;
    case 'after':
    case 'in_prompt':
      return extension_prompt_types.IN_PROMPT;
    case 'in_chat':
      return extension_prompt_types.IN_CHAT;
    default:
      return extension_prompt_types.IN_PROMPT;
  }
}

/**
 * Convert Story Weaver prompt role to SillyTavern extension prompt role
 */
function getSillyTavernPromptRole(storyWeaverRole) {
  switch (storyWeaverRole) {
    case 'system':
      return extension_prompt_roles.SYSTEM;
    case 'user':
      return extension_prompt_roles.USER;
    case 'assistant':
      return extension_prompt_roles.ASSISTANT;
    default:
      return extension_prompt_roles.SYSTEM;
  }
}

/**
 * Process prompt content with all variables and markers - used for both preview and actual sending
 */
async function processStoryWeaverPromptContent(prompt) {
  if (!prompt || !prompt.content) {
    return '';
  }

  let content = prompt.content;

  try {
    // Process Story Weaver specific placeholders first
    const characterData = getCharacterData();
    const contextLength = parseInt($('#context-length').val()) || 0;
    const chatContext = getChatContext(contextLength);
    const requirementsText = buildRequirementsText();

    // Handle world info markers if this prompt contains them
    if (content.includes('{world_info}') || content.includes('{worldinfo}')) {
      const worldInfoResult = await processWorldInfoMarkers();
      content = content.replace(/{world_info}/g, worldInfoResult || '').replace(/{worldinfo}/g, worldInfoResult || '');
    }

    // Replace Story Weaver placeholders
    content = content
      .replace(/{character}/g, characterData || '')
      .replace(/{chat_context}/g, chatContext || '')
      .replace(/{requirements}/g, requirementsText || '');

    // Apply SillyTavern's variable substitution (for {{user}}, {{char}}, etc.)
    if (typeof substituteParams === 'function') {
      content = substituteParams(content);
    }
  } catch (error) {
    console.error(`[Story Weaver] Error processing prompt content for ${prompt.identifier}:`, error);
  }

  return content.trim();
}

/**
 * Register a single Story Weaver prompt with SillyTavern's extension prompt system
 */
async function registerStoryWeaverPrompt(prompt) {
  if (!prompt || !prompt.enabled) {
    return false;
  }

  try {
    const extensionKey = `story_weaver_${prompt.identifier}`;
    const position = getSillyTavernPromptPosition(prompt.position);
    const role = getSillyTavernPromptRole(prompt.role);
    const depth = prompt.injection_depth || 4;

    // Process content with all variables and markers (same as preview)
    const processedContent = await processStoryWeaverPromptContent(prompt);

    // For system marker prompts, allow empty content - SillyTavern will fill them
    const isSystemMarker = [
      'personaDescription',
      'charDescription',
      'charPersonality',
      'scenario',
      'worldInfoAfter',
      'dialogueExamples',
      'chatHistory',
    ].includes(prompt.identifier);

    if (!processedContent.trim() && !isSystemMarker && (!prompt.content || !prompt.content.trim())) {
      console.warn(`[Story Weaver] Skipping empty prompt: ${prompt.name} (${prompt.identifier})`);
      return false;
    }

    // Use SillyTavern's setExtensionPrompt function
    // For system markers, pass original content; for custom prompts, pass processed content
    const contentToRegister = isSystemMarker ? prompt.content || '' : processedContent;

    setExtensionPrompt(
      extensionKey,
      contentToRegister,
      position,
      depth,
      false, // scan - don't include in world info scanning
      role,
      null, // no filter function
    );

    registeredPrompts.add(extensionKey);
    console.log(
      `[Story Weaver] Registered prompt: ${prompt.name} (${extensionKey}) at position ${position} with role ${role}`,
    );
    console.log(
      `[Story Weaver] Content length: ${contentToRegister.length} chars${
        isSystemMarker ? ' (system marker)' : ' (processed)'
      }`,
    );
    return true;
  } catch (error) {
    console.error(`[Story Weaver] Error registering prompt ${prompt.identifier}:`, error);
    return false;
  }
}

/**
 * Unregister a Story Weaver prompt from SillyTavern's extension prompt system
 */
function unregisterStoryWeaverPrompt(identifier) {
  const extensionKey = `story_weaver_${identifier}`;

  if (registeredPrompts.has(extensionKey)) {
    // Remove from extension_prompts
    delete extension_prompts[extensionKey];
    registeredPrompts.delete(extensionKey);
    console.log(`[Story Weaver] Unregistered prompt: ${extensionKey}`);
    return true;
  }
  return false;
}

/**
 * Register all enabled Story Weaver prompts with SillyTavern
 */
async function registerAllStoryWeaverPrompts() {
  // Clear all previously registered prompts
  clearAllStoryWeaverPrompts();

  let registeredCount = 0;

  // Register prompts in the order specified by storyWeaverPromptOrder
  for (const identifier of storyWeaverPromptOrder) {
    const prompt = storyWeaverPrompts.get(identifier);
    if (prompt && (await registerStoryWeaverPrompt(prompt))) {
      registeredCount++;
    }
  }

  console.log(`[Story Weaver] Registered ${registeredCount} prompts with SillyTavern`);
  return registeredCount;
}

/**
 * Clear all Story Weaver prompts from SillyTavern's extension prompt system
 */
function clearAllStoryWeaverPrompts() {
  const keysToRemove = Array.from(registeredPrompts);
  keysToRemove.forEach(key => {
    delete extension_prompts[key];
  });
  registeredPrompts.clear();
  console.log(`[Story Weaver] Cleared ${keysToRemove.length} registered prompts`);
}

/**
 * Update Story Weaver prompt registrations when prompts change
 */
async function updateStoryWeaverPromptRegistrations() {
  // Re-register all prompts to reflect current state
  await registerAllStoryWeaverPrompts();

  // Trigger a refresh of the prompt system if needed
  eventSource.emit(event_types.EXTENSION_PROMPTS_UPDATED);
}

/**
 * Toggle prompt enabled state and update registrations
 */
async function toggleStoryWeaverPrompt(identifier, enabled) {
  const prompt = storyWeaverPrompts.get(identifier);
  if (!prompt) return false;

  prompt.enabled = enabled;

  if (enabled) {
    await registerStoryWeaverPrompt(prompt);
  } else {
    unregisterStoryWeaverPrompt(identifier);
  }

  // Save settings and update UI
  saveSettings();
  renderPromptManager();

  console.log(`[Story Weaver] Toggled prompt "${prompt.name}" to ${enabled ? 'enabled' : 'disabled'}`);
  return true;
}

/**
 * Cleanup function for extension unload (if needed)
 */
function cleanupStoryWeaverPrompts() {
  clearAllStoryWeaverPrompts();
  console.log('[Story Weaver] Cleaned up all prompt registrations');
}

/**
 * Debug function to check prompt registration status
 */
function debugStoryWeaverPrompts() {
  console.log('=== Story Weaver Prompt Debug Info ===');
  console.log('Story Weaver prompts:', storyWeaverPrompts.size);
  console.log('Prompt order:', storyWeaverPromptOrder);
  console.log('Registered prompts:', Array.from(registeredPrompts));

  storyWeaverPromptOrder.forEach(identifier => {
    const prompt = storyWeaverPrompts.get(identifier);
    const extensionKey = `story_weaver_${identifier}`;
    const registered = registeredPrompts.has(extensionKey);
    const isSystemMarker = [
      'personaDescription',
      'charDescription',
      'charPersonality',
      'scenario',
      'worldInfoAfter',
      'dialogueExamples',
      'chatHistory',
    ].includes(identifier);
    console.log(
      `Prompt "${identifier}": enabled=${prompt?.enabled}, registered=${registered}, content length=${
        prompt?.content?.length || 0
      }${isSystemMarker ? ' (system marker)' : ''}`,
    );
  });

  console.log(
    'SillyTavern extension_prompts keys:',
    Object.keys(extension_prompts).filter(key => key.startsWith('story_weaver_')),
  );
  console.log('=======================================');
}

// Make debug function globally accessible for console testing
window.debugStoryWeaverPrompts = debugStoryWeaverPrompts;

/**
 * Save extension settings
 */
function saveSettings() {
  extension_settings[extensionName] = settings;
  // Use SillyTavern's settings save function
  if (typeof window.saveSettingsDebounced === 'function') {
    window.saveSettingsDebounced();
  } else if (typeof window.saveSettings === 'function') {
    window.saveSettings();
  }

  console.log('[Story Weaver] Settings saved:', settings);
}

/**
 * Apply plugin-scoped regex transformations
 * @param {string} text
 * @param {'prompt'|'result'} phase - which phase the text is for
 * @returns {string}
 */
function applyPluginRegex(text, phase) {
  try {
    if (!settings.regexEnabled || !Array.isArray(settings.regexRules) || !text) return text;

    let output = String(text);
    for (const rule of settings.regexRules) {
      if (!rule || rule.enabled === false) continue;
      const target = rule.target || 'both';
      if (!(target === 'both' || target === phase)) continue;

      try {
        const re = new RegExp(rule.pattern, rule.flags || 'g');
        output = output.replace(re, rule.replacement ?? '');
      } catch (e) {
        console.warn('[Story Weaver] Invalid regex rule skipped:', rule, e);
      }
    }
    return output;
  } catch (e) {
    console.error('[Story Weaver] applyPluginRegex failed:', e);
    return text;
  }
}

/**
 * Save all presets to file system
 * @deprecated This function is no longer used. Individual presets are saved via savePresetToFile()
 */
async function savePresetsToFile() {
  console.warn('[Story Weaver] savePresetsToFile() is deprecated and should not be called');
  return; // Early return to prevent execution
}

/**
 * Load individual preset from file system
 */
async function loadPresetFromFile(fileName) {
  try {
    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: `public/scripts/extensions/Director/presets/${fileName}`,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.settings) {
        // Convert file-based preset back to internal format
        const presetId = fileName.replace('.json', '');
        const preset = {
          name: data.name,
          description: data.description || '用户自定义预设',
          prompts: data.settings.prompts || [],
          promptOrder: data.settings.prompt_order || [],
          settings: {
            contextLength: data.settings.contextLength || 100,
            storyType: data.settings.storyType || 'fantasy',
            detailLevel: data.settings.detailLevel || 'detailed',
            chapterCount: data.settings.chapterCount || 5,
            includeCharacters: data.settings.includeCharacters !== false,
            includeSummary: data.settings.includeSummary !== false,
            includeThemes: data.settings.includeThemes === true,
          },
          created: data.metadata?.created || new Date().toISOString(),
          modified: data.metadata?.modified || new Date().toISOString(),
        };

        return { presetId, preset };
      }
    }
  } catch (error) {
    console.warn(`[Story Weaver] Could not load preset ${fileName}:`, error);
  }
  return null;
}

/**
 * Load presets from SillyTavern context directory
 */
async function loadPresetsFromContextDirectory() {
  try {
    console.log('[Story Weaver] Loading presets from SillyTavern context directory...');

    // Clear existing promptPresets to start fresh
    settings.promptPresets = {};

    // First attempt: Try to discover story-weaver files using brute force scanning
    const discoveredFiles = await discoverStoryWeaverFiles();

    if (discoveredFiles.length > 0) {
      console.log(`[Story Weaver] Discovered ${discoveredFiles.length} story-weaver files`);

      // Load each discovered file
      for (const fileInfo of discoveredFiles) {
        try {
          await loadSinglePresetFromContext(fileInfo.fileName, fileInfo.presetId);
          console.log(`[Story Weaver] Successfully loaded: ${fileInfo.fileName}`);
        } catch (error) {
          console.warn(`[Story Weaver] Failed to load ${fileInfo.fileName}:`, error);
        }
      }

      // Update the preset index with discovered files
      settings.presetFileIndex = discoveredFiles;
    } else {
      // Fallback: Use existing index if no files discovered
      console.log('[Story Weaver] No files discovered, falling back to existing index');
      const presetIndex = settings.presetFileIndex || [];

      for (const presetInfo of presetIndex) {
        try {
          await loadSinglePresetFromContext(presetInfo.fileName, presetInfo.presetId);
        } catch (error) {
          console.warn(`[Story Weaver] Failed to load preset ${presetInfo.fileName}:`, error);
        }
      }
    }

    console.log(`[Story Weaver] Loaded ${Object.keys(settings.promptPresets).length} presets from context directory`);
  } catch (error) {
    console.error('[Story Weaver] Error loading presets from context directory:', error);
  }
}

/**
 * Load Story Weaver presets by directly scanning context files
 */
async function loadStoryWeaverPresets() {
  // Prevent duplicate loading
  if (presetsAlreadyLoaded) {
    console.log('[Story Weaver] Presets already loaded, skipping...');
    return;
  }

  try {
    console.log('[Story Weaver] Loading story-weaver presets from context directory...');

    // Clear existing promptPresets to start fresh but keep default
    const defaultPreset = settings.promptPresets.default;
    settings.promptPresets = {};

    // Ensure we always have a default preset
    if (!defaultPreset) {
      settings.promptPresets.default = {
        name: '默认预设',
        description: '系统默认的提示词配置',
        prompts: [],
        promptOrder: [],
        settings: { ...defaultSettings },
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };
    } else {
      settings.promptPresets.default = defaultPreset;
    }

    // Load presets directly from file system using SillyTavern's file API
    await loadStoryWeaverPresetsFromFileSystem();

    // Update UI after loading
    loadPromptPresetsUI();

    // Load last used preset
    loadLastUsedPreset();

    // Mark as loaded
    presetsAlreadyLoaded = true;
  } catch (error) {
    console.error('[Story Weaver] Error loading story-weaver presets:', error);
  }
}

/**
 * Load presets directly from file system using context template API with enhanced name generation
 */
async function loadStoryWeaverPresetsFromFileSystem() {
  try {
    console.log('[Story Weaver] Loading story-weaver presets from SillyTavern context system...');

    // Use SillyTavern's settings API to get already loaded context presets
    const response = await fetch('/api/settings/get', {
      method: 'POST',
      headers: getRequestHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Settings API failed: ${response.status}`);
    }

    const allSettings = await response.json();
    console.log(`[Story Weaver] Retrieved settings, found ${allSettings.context?.length || 0} context presets`);

    // Clear existing story-weaver presets
    const existingKeys = Object.keys(settings.promptPresets).filter(key => key.startsWith('custom_'));
    existingKeys.forEach(key => delete settings.promptPresets[key]);

    // Look for context presets that contain story-weaver content
    const contextPresets = allSettings.context || [];
    const storyWeaverPresets = contextPresets.filter(preset => {
      if (!preset || typeof preset !== 'object') return false;

      // Check if the preset has characteristics of a story-weaver preset
      return (
        (preset.prompts && Array.isArray(preset.prompts) && preset.prompts.length > 5) ||
        (preset.name && preset.name.includes('story-weaver'))
      );
    });

    console.log(`[Story Weaver] Found ${storyWeaverPresets.length} story-weaver context presets`);

    if (storyWeaverPresets.length === 0) {
      console.log('[Story Weaver] No story-weaver presets found, using default preset only');
      return;
    }

    // Create proper presets from found context presets using stored name
    storyWeaverPresets.forEach((contextPreset, index) => {
      const presetId = `custom_${Date.now() + index}`;
      // Use the name stored in the JSON file, or fallback to generated name
      const presetName = contextPreset.name || generateMeaningfulPresetName(contextPreset, index);

      const preset = {
        name: presetName,
        description: '从SillyTavern context加载的预设',
        prompts: contextPreset.prompts || [],
        promptOrder:
          contextPreset.prompts?.map(p => ({
            identifier: p.identifier,
            enabled: p.enabled !== false,
          })) || [],
        settings: {
          enabled: true,
          contextLength: 100,
          storyType: 'fantasy',
          detailLevel: 'detailed',
          chapterCount: 5,
          includeCharacters: true,
          includeSummary: true,
          includeThemes: false,
          ...contextPreset.settings,
        },
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      settings.promptPresets[presetId] = preset;
      console.log(
        `[Story Weaver] Created preset: ${presetName} (ID: ${presetId}) with ${preset.prompts.length} prompts`,
      );
    });

    console.log(`[Story Weaver] Successfully loaded ${storyWeaverPresets.length} real presets from context`);
  } catch (error) {
    console.error('[Story Weaver] Error loading from context system:', error);
    console.log('[Story Weaver] Using default preset only');
  }
}

/**
 * Generate a meaningful preset name by analyzing the preset content
 */
function generateMeaningfulPresetName(contextPreset, index) {
  // Try to find clues about the preset name from the content

  // Look for a distinctive prompt name that might indicate the preset type
  if (contextPreset.prompts && Array.isArray(contextPreset.prompts)) {
    const firstFewPrompts = contextPreset.prompts.slice(0, 3);

    // Look for specific patterns in prompt names
    for (const prompt of firstFewPrompts) {
      if (prompt.name) {
        const name = prompt.name.toString().toLowerCase();

        // Look for distinctive names that might indicate preset origin
        if (name.includes('noa') || name.includes('history')) {
          return 'Noa 历史记录器';
        }
        if (name.includes('dreammini') || name.includes('dream')) {
          return 'DreamMini';
        }
        if (name.includes('免责') || name.includes('黑森森')) {
          return '黑森森预设';
        }
      }
    }

    // If we find many prompts with Chinese content, it might be a Chinese preset
    const chinesePrompts = contextPreset.prompts.filter(p => p.content && /[\u4e00-\u9fff]/.test(p.content));

    if (chinesePrompts.length > 5) {
      return `中文预设 ${index + 1}`;
    }

    // If we find system-related prompts, it might be a system preset
    const systemPrompts = contextPreset.prompts.filter(
      p => p.name && (p.name.includes('system') || p.name.includes('System')),
    );

    if (systemPrompts.length > 2) {
      return `系统预设 ${index + 1}`;
    }
  }

  // Fallback to generic naming with better pattern
  return `Story Weaver 预设 ${index + 1}`;
}

/**
 * Save last used preset to extension settings
 */
function saveLastUsedPreset(presetId) {
  if (!extension_settings[extensionName]) {
    extension_settings[extensionName] = {};
  }
  extension_settings[extensionName].lastUsedPreset = presetId;

  // Use SillyTavern's settings save function
  if (typeof window.saveSettingsDebounced === 'function') {
    window.saveSettingsDebounced();
  } else if (typeof window.saveSettings === 'function') {
    window.saveSettings();
  }

  console.log(`[Story Weaver] Saved last used preset: ${presetId}`);
}

/**
 * Load last used preset from extension settings
 */
function loadLastUsedPreset() {
  try {
    const lastUsed = extension_settings[extensionName]?.lastUsedPreset;
    if (lastUsed && settings.promptPresets[lastUsed]) {
      console.log(`[Story Weaver] Loading last used preset: ${lastUsed}`);

      // Set as current and apply
      settings.currentPromptPreset = lastUsed;
      $('#sw-prompt-preset-selector').val(lastUsed);

      // Apply the preset
      applyPromptPreset(lastUsed);

      console.log(`[Story Weaver] Auto-loaded last used preset: ${settings.promptPresets[lastUsed].name}`);
    } else {
      console.log('[Story Weaver] No valid last used preset found');
    }
  } catch (error) {
    console.error('[Story Weaver] Error loading last used preset:', error);
  }
}

/**
 * Discover story-weaver files in the context directory
 * Since there's no direct file listing API, we use multiple strategies
 */
async function discoverStoryWeaverFiles() {
  const discoveredFiles = [];

  try {
    // Strategy 1: Use SillyTavern's file system API if available
    try {
      const listResponse = await fetch('/api/files/list', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({
          path: 'data/default-user/context/',
        }),
      });

      if (listResponse.ok) {
        const fileList = await listResponse.json();
        if (fileList && fileList.files && Array.isArray(fileList.files)) {
          const storyWeaverFiles = fileList.files.filter(
            fileName => fileName.startsWith('story-weaver-') && fileName.endsWith('.json'),
          );

          for (const fileName of storyWeaverFiles) {
            const presetId = extractPresetIdFromFileName(fileName);
            if (presetId) {
              discoveredFiles.push({
                fileName: fileName,
                presetId: presetId,
              });
            }
          }

          console.log(`[Story Weaver] Discovered ${discoveredFiles.length} files using file list API`);
          return discoveredFiles;
        }
      }
    } catch (error) {
      console.log('[Story Weaver] File list API not available, trying alternative methods');
    }

    // Strategy 2: Try to read known file patterns
    // This is a fallback when file listing is not available
    const knownPatterns = [
      'story-weaver-Noa--the-history-recorder-custom_1756014480543.json',
      // We can add more known patterns here or scan based on common patterns
    ];

    for (const fileName of knownPatterns) {
      try {
        const response = await fetch('/api/files/read', {
          method: 'POST',
          headers: getRequestHeaders(),
          body: JSON.stringify({
            path: `data/default-user/context/${fileName}`,
          }),
        });

        if (response.ok) {
          const presetId = extractPresetIdFromFileName(fileName);
          if (presetId) {
            discoveredFiles.push({
              fileName: fileName,
              presetId: presetId,
            });
            console.log(`[Story Weaver] Found file: ${fileName}`);
          }
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }
  } catch (error) {
    console.error('[Story Weaver] Error discovering story-weaver files:', error);
  }

  return discoveredFiles;
}

/**
 * Extract preset ID from filename
 */
function extractPresetIdFromFileName(fileName) {
  // Extract ID from patterns like: story-weaver-Name-custom_1234567890.json
  const match = fileName.match(/story-weaver-.*?-(custom_\d+)\.json$/);
  if (match) {
    return match[1];
  }

  // Fallback: If no custom_ pattern found, generate ID from timestamp in filename
  const timestampMatch = fileName.match(/(\d+)\.json$/);
  if (timestampMatch) {
    return 'custom_' + timestampMatch[1];
  }

  // Last fallback: Generate ID from filename hash
  return 'imported_' + fileName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
}

/**
 * Extract preset name from filename
 */
function extractPresetNameFromFileName(fileName) {
  // Remove .json extension
  let name = fileName.replace('.json', '');

  // Remove story-weaver- prefix
  name = name.replace(/^story-weaver-/, '');

  // Remove custom_timestamp suffix
  name = name.replace(/-custom_\d+$/, '');

  // Convert dashes to spaces and clean up
  name = name.replace(/--/g, ' - ').replace(/-/g, ' ');

  // Clean up multiple spaces
  name = name.replace(/\s+/g, ' ').trim();

  return name || '未命名预设';
}

/**
 * Load a single preset from SillyTavern context directory
 */
async function loadSinglePresetFromContext(fileName, presetId) {
  try {
    // Use SillyTavern's file read API to load the preset
    const response = await fetch('/api/files/read', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify({
        path: `data/default-user/context/${fileName}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to read preset file: ${response.statusText}`);
    }

    const fileData = await response.json();
    if (fileData && typeof fileData === 'object') {
      // The file data IS the preset data (saved by SillyTavern preset API)
      const presetName = extractPresetNameFromFileName(fileName);
      const preset = {
        name: presetName,
        description: fileData.description || '从文件加载的预设',
        prompts: fileData.prompts || [],
        promptOrder: fileData.promptOrder || [],
        settings: fileData.settings || {},
        created: fileData.created || new Date().toISOString(),
        modified: fileData.modified || new Date().toISOString(),
      };

      // Add to promptPresets
      settings.promptPresets[presetId] = preset;
      console.log(`[Story Weaver] Loaded preset from context: ${preset.name}`);
      return preset;
    }
  } catch (error) {
    console.error(`[Story Weaver] Error loading preset ${fileName}:`, error);
    throw error;
  }
}

/**
 * Load extension settings
 */
async function loadSettings() {
  settings = { ...defaultSettings, ...extension_settings[extensionName] };

  // Note: Preset loading is now handled via SETTINGS_LOADED_AFTER event
  // This allows us to use SillyTavern's built-in context preset loading mechanism

  // Initialize PromptCollection from stored settings or defaults
  storyWeaverPrompts = new PromptCollection();

  if (settings.prompts && Array.isArray(settings.prompts)) {
    // Load prompts from settings
    settings.prompts.forEach(promptData => {
      addPromptToStoryWeaver(promptData);
    });

    // Set prompt order and enabled states if available
    if (settings.promptOrder && Array.isArray(settings.promptOrder)) {
      storyWeaverPromptOrder = settings.promptOrder.map(orderItem => orderItem.identifier);

      // Apply enabled states from promptOrder
      settings.promptOrder.forEach(orderItem => {
        const prompt = storyWeaverPrompts.get(orderItem.identifier);
        if (prompt) {
          prompt.enabled = orderItem.enabled !== false;
        }
      });
    }
  } else {
    // Initialize with default prompts
    storyWeaverDefaultPrompts.prompts.forEach(promptData => {
      addPromptToStoryWeaver(promptData);
    });

    // Update settings with defaults
    settings.prompts = getStoryWeaverPrompts().map(p => ({ ...p }));
    settings.promptOrder = getStoryWeaverPromptOrder().map(identifier => ({
      identifier,
      enabled: storyWeaverPrompts.get(identifier)?.enabled !== false,
    }));
  }

  // Update UI elements with delay to ensure DOM is ready
  setTimeout(() => {
    $('#story-type').val(settings.storyType || 'fantasy');
    $('#detail-level').val(settings.detailLevel || 'detailed');
    $('#chapter-count').val(settings.chapterCount || 5);
    $('#context-length').val(settings.contextLength || 100);
    $('#include-summary').prop('checked', settings.includeSummary !== false);
    $('#include-characters').prop('checked', settings.includeCharacters !== false);
    $('#include-themes').prop('checked', settings.includeThemes === true);

    // Render prompt manager
    renderPromptManager();

    // Load saved paragraphs
    loadOutlineParagraphs();

    // Initialize and load complete prompt presets
    initializeDefaultPromptPreset();
    loadPromptPresetsUI();

    // Auto-load last used preset
    const currentPreset = settings.currentPromptPreset || 'default';
    if (currentPreset && settings.promptPresets?.[currentPreset]) {
      console.log('[Story Weaver] Auto-loading last used preset:', currentPreset);
      applyPromptPreset(currentPreset);
    }
  }, 100);

  // Try to load story-weaver presets immediately (fallback if event hasn't fired)
  setTimeout(() => {
    loadStoryWeaverPresets();
  }, 500);
}

// ===== Complete Prompt Preset Management =====

/**
 * Initialize default prompt preset
 */
function initializeDefaultPromptPreset() {
  if (!settings.promptPresets) {
    settings.promptPresets = {};
  }

  if (
    !settings.promptPresets['default'] ||
    !settings.promptPresets['default'].prompts ||
    settings.promptPresets['default'].prompts.length === 0
  ) {
    // Initialize default preset from current prompts and settings
    settings.promptPresets['default'] = {
      name: '默认预设',
      description: '系统默认的提示词配置',
      prompts: storyWeaverDefaultPrompts.prompts.map(p => ({ ...p })),
      promptOrder: storyWeaverDefaultPromptOrder.map(o => ({ ...o })),
      settings: {
        contextLength: settings.contextLength || 100,
        storyType: settings.storyType || 'fantasy',
        detailLevel: settings.detailLevel || 'detailed',
        chapterCount: settings.chapterCount || 5,
        includeCharacters: settings.includeCharacters !== false,
        includeSummary: settings.includeSummary !== false,
        includeThemes: settings.includeThemes === true,
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };
    saveSettings();
  }
}

/**
 * Create current state snapshot for saving as preset
 */
function createCurrentStateSnapshot() {
  return {
    prompts: getStoryWeaverPrompts().map(p => ({ ...p })),
    promptOrder: getStoryWeaverPromptOrder().map(identifier => ({
      identifier,
      enabled: storyWeaverPrompts.get(identifier)?.enabled !== false,
    })),
    settings: {
      contextLength: parseInt($('#context-length').val()) || settings.contextLength || 100,
      storyType: $('#story-type').val() || settings.storyType || 'fantasy',
      detailLevel: $('#detail-level').val() || settings.detailLevel || 'detailed',
      chapterCount: parseInt($('#chapter-count').val()) || settings.chapterCount || 5,
      includeCharacters: $('#include-characters').prop('checked'),
      includeSummary: $('#include-summary').prop('checked'),
      includeThemes: $('#include-themes').prop('checked'),
    },
  };
}

/**
 * Load prompt presets into UI selector
 */
function loadPromptPresetsUI() {
  const presetSelect = $('#sw-prompt-preset-selector');
  const currentPreset = settings.currentPromptPreset || 'default';

  // Clear existing options
  presetSelect.empty();
  presetSelect.append('<option value="">选择预设...</option>');

  // Add preset options
  Object.keys(settings.promptPresets || {}).forEach(presetId => {
    const preset = settings.promptPresets[presetId];
    const selected = presetId === currentPreset ? 'selected' : '';
    presetSelect.append(`<option value="${presetId}" ${selected}>${preset.name}</option>`);
  });
}

/**
 * Apply a complete prompt preset
 */
function applyPromptPreset(presetId) {
  const preset = settings.promptPresets?.[presetId];
  if (!preset) {
    console.error('[Story Weaver] Preset not found:', presetId);
    return false;
  }

  console.log('[Story Weaver] Applying preset:', preset.name);
  console.log('[Story Weaver] Preset data:', preset);

  try {
    // Clear current prompts
    storyWeaverPrompts = new PromptCollection();
    storyWeaverPromptOrder = [];

    // Apply prompts
    if (preset.prompts && Array.isArray(preset.prompts)) {
      console.log(`[Story Weaver] Adding ${preset.prompts.length} prompts`);
      preset.prompts.forEach(promptData => {
        console.log('[Story Weaver] Adding prompt:', promptData.name || promptData.identifier);
        addPromptToStoryWeaver(promptData);
      });
    } else {
      console.warn('[Story Weaver] No prompts found in preset or prompts is not an array');
    }

    // Apply prompt order and enabled states
    if (preset.promptOrder && Array.isArray(preset.promptOrder)) {
      preset.promptOrder.forEach(orderItem => {
        // Handle both string identifiers and objects with identifier property
        const identifier = typeof orderItem === 'string' ? orderItem : orderItem.identifier;
        const enabled = typeof orderItem === 'object' ? orderItem.enabled : true;

        if (!storyWeaverPromptOrder.includes(identifier)) {
          storyWeaverPromptOrder.push(identifier);
        }

        const prompt = storyWeaverPrompts.get(identifier);
        if (prompt) {
          prompt.enabled = enabled !== false;
        }
      });
    }

    // Apply settings to UI
    const presetSettings = preset.settings || {};
    console.log('[Story Weaver] Applying settings:', presetSettings);

    $('#context-length').val(presetSettings.contextLength || 100);
    $('#story-type').val(presetSettings.storyType || 'fantasy');
    $('#detail-level').val(presetSettings.detailLevel || 'detailed');
    $('#chapter-count').val(presetSettings.chapterCount || 5);
    $('#include-characters').prop('checked', presetSettings.includeCharacters !== false);
    $('#include-summary').prop('checked', presetSettings.includeSummary !== false);
    $('#include-themes').prop('checked', presetSettings.includeThemes === true);

    // Update current settings
    Object.assign(settings, presetSettings);
    settings.currentPromptPreset = presetId;

    console.log('[Story Weaver] Current prompt collection size:', storyWeaverPrompts.size);
    console.log('[Story Weaver] Prompt order:', storyWeaverPromptOrder);

    // Save and refresh
    saveSettings();
    renderPromptManager();

    // Note: Prompts are no longer auto-registered after applying preset
    // They will be registered only during generation

    console.log('[Story Weaver] Successfully applied prompt preset:', preset.name);
    showNotification(`已应用预设: ${preset.name}`, 'success');

    return true;
  } catch (error) {
    console.error('[Story Weaver] Error applying prompt preset:', error);
    showNotification(`应用预设失败: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Save current prompt configuration as preset
 */
/**
 * Save current preset (overwrite existing)
 */
async function saveCurrentPromptPreset() {
  try {
    const currentPresetId = settings.currentPromptPreset;
    console.log('[Story Weaver] Save current preset - currentPresetId:', currentPresetId);
    console.log('[Story Weaver] Available presets:', Object.keys(settings.promptPresets || {}));

    if (!currentPresetId || currentPresetId === 'default') {
      // If no preset is selected or it's the default preset, save as new instead
      console.log('[Story Weaver] No preset selected or default preset, saving as new...');
      await saveAsNewPreset();
      return;
    }

    const currentPreset = settings.promptPresets[currentPresetId];
    if (!currentPreset) {
      console.log('[Story Weaver] Current preset not found in settings, saving as new...');
      await saveAsNewPreset();
      return;
    }

    console.log('[Story Weaver] Found current preset, proceeding with overwrite:', currentPreset.name);

    // Create snapshot of current state
    const snapshot = createCurrentStateSnapshot();

    // Update existing preset
    currentPreset.prompts = snapshot.prompts;
    currentPreset.promptOrder = snapshot.promptOrder;
    currentPreset.settings = snapshot.settings;
    currentPreset.modified = new Date().toISOString();

    // Save to presets folder
    await savePresetToFile(currentPreset, currentPresetId);

    // Save settings
    settings.currentPromptPreset = currentPresetId;
    saveLastUsedPreset(currentPresetId);
    saveSettings();

    showNotification(`预设已保存到presets文件夹: ${currentPreset.name}`, 'success');
    console.log(`[Story Weaver] Preset overwritten in presets folder: ${currentPreset.name}`);
  } catch (error) {
    console.error('[Story Weaver] Error saving preset to presets folder:', error);
    showNotification(`保存预设到presets文件夹失败: ${error.message}`, 'error');
  }
}

/**
 * Save as new preset (create new file)
 */
async function saveAsNewPreset() {
  const presetName = prompt('请输入预设名称:', '我的预设 ' + new Date().toLocaleDateString());
  if (!presetName || presetName.trim() === '') return;

  try {
    // Generate unique ID
    const presetId = 'custom_' + Date.now();

    // Create snapshot of current state
    const snapshot = createCurrentStateSnapshot();

    // Create new preset
    const newPreset = {
      name: presetName.trim(),
      description: '用户自定义预设',
      prompts: snapshot.prompts,
      promptOrder: snapshot.promptOrder,
      settings: snapshot.settings,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    };

    settings.promptPresets[presetId] = newPreset;
    settings.currentPromptPreset = presetId;

    // Save to presets folder
    await savePresetToFile(newPreset, presetId);

    // Save settings
    saveLastUsedPreset(presetId);
    saveSettings();

    // Update UI
    loadPromptPresetsUI();

    showNotification(`预设已另存为presets文件夹: ${presetName}`, 'success');
    console.log(`[Story Weaver] New preset saved to presets folder: ${presetName}`);
  } catch (error) {
    console.error('[Story Weaver] Error saving new preset to presets folder:', error);
    showNotification(`另存为预设到presets文件夹失败: ${error.message}`, 'error');
  }
}

/**
 * Save preset to presets folder
 */
async function savePresetToFile(preset, presetId) {
  try {
    // Create the preset data in SillyTavern's standard format with user-provided name
    const presetData = {
      name: preset.name, // Add user-provided name to the JSON file
      prompts: preset.prompts,
      promptOrder: preset.promptOrder,
      settings: preset.settings,
      description: preset.description || '用户自定义预设',
      created: preset.created,
      modified: preset.modified,
    };

    // Create safe preset name for filename (prefix + user name only, no ID)
    const safePresetName = `story-weaver-${preset.name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-')}`;

    // Save using SillyTavern's preset API with context apiId (for custom templates)
    const response = await fetch('/api/presets/save', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify({
        preset: presetData,
        name: safePresetName,
        apiId: 'context',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save preset: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[Story Weaver] Preset saved successfully using SillyTavern preset API:`, result);

    // Update preset index to track this file
    if (!settings.presetFileIndex) {
      settings.presetFileIndex = [];
    }

    const fileName = `${safePresetName}.json`;
    const existingIndex = settings.presetFileIndex.findIndex(p => p.presetId === presetId);

    if (existingIndex !== -1) {
      // Update existing entry
      settings.presetFileIndex[existingIndex].fileName = fileName;
    } else {
      // Add new entry
      settings.presetFileIndex.push({
        presetId: presetId,
        fileName: fileName,
      });
    }

    return true;
  } catch (error) {
    console.error('[Story Weaver] Error saving preset using SillyTavern preset API:', error);
    throw new Error(`无法保存预设到presets文件夹: ${error.message}`);
  }
}

/**
 * Extract filename from preset description
 */
function extractFileNameFromPreset(preset) {
  if (!preset || !preset.description) return null;

  // Look for filename pattern in description
  const match = preset.description.match(/\(([^)]*\.json)\)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Load preset from JSON file in context directory
 */
async function loadPresetFromContextFile(presetId, fileName) {
  try {
    console.log(`[Story Weaver] Loading preset from context file: ${fileName}`);

    // Use SillyTavern's settings API to get already loaded context presets
    const response = await fetch('/api/settings/get', {
      method: 'POST',
      headers: getRequestHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Settings API failed: ${response.status}`);
    }

    const allSettings = await response.json();
    console.log(`[Story Weaver] Retrieved settings from SillyTavern`);

    // Look for context presets
    const contextPresets = allSettings.context || [];
    console.log(`[Story Weaver] Found ${contextPresets.length} context presets total`);

    // Since SillyTavern's readAndParseFromDirectory doesn't add filename as name,
    // we need to analyze preset content to find story-weaver presets
    console.log(`[Story Weaver] Sample context preset:`, contextPresets[0]);

    // Look for story-weaver presets by analyzing content
    const storyWeaverPresets = contextPresets.filter(preset => {
      if (!preset || typeof preset !== 'object') return false;

      // Check if the preset has characteristics of a story-weaver preset
      const hasStoryWeaverIndicators =
        // Has prompts array (typical for story-weaver presets)
        (preset.prompts && Array.isArray(preset.prompts) && preset.prompts.length > 0) ||
        // Has name property that includes story-weaver
        (preset.name && preset.name.includes('story-weaver')) ||
        // Check if any prompt suggests it's story-weaver related
        (preset.prompts &&
          preset.prompts.some(
            p =>
              (p.name && (p.name.includes('story') || p.name.includes('weaver') || p.name.includes('context'))) ||
              (p.content && p.content.includes('story')) ||
              (p.identifier && p.identifier.includes('story')),
          ));

      return hasStoryWeaverIndicators;
    });

    console.log(`[Story Weaver] Found ${storyWeaverPresets.length} potential story-weaver presets`);

    if (storyWeaverPresets.length > 0) {
      console.log(`[Story Weaver] Available story-weaver presets found:`, storyWeaverPresets.length);

      // Try to match by presetId first
      const targetPreset = settings.promptPresets[presetId];
      console.log(`[Story Weaver] Target preset info:`, {
        id: presetId,
        name: targetPreset?.name,
        fileName: fileName,
      });

      // Find the matching preset - for now use index-based matching
      // Since we created presets in order, try to match by index
      const presetIndex = Object.keys(settings.promptPresets).indexOf(presetId);
      console.log(`[Story Weaver] Preset index in settings:`, presetIndex);

      let selectedPreset = null;

      if (presetIndex >= 0 && presetIndex < storyWeaverPresets.length) {
        selectedPreset = storyWeaverPresets[presetIndex];
      } else {
        // Fallback to first story-weaver preset
        selectedPreset = storyWeaverPresets[0];
      }

      console.log(`[Story Weaver] Selected preset with ${selectedPreset.prompts?.length || 0} prompts`);
      console.log(`[Story Weaver] Selected preset sample:`, {
        hasPrompts: !!selectedPreset.prompts,
        promptCount: selectedPreset.prompts?.length,
        firstPrompt: selectedPreset.prompts?.[0]?.name || selectedPreset.prompts?.[0]?.identifier,
      });

      return await applyFileDataToPreset(presetId, selectedPreset, fileName);
    }

    // Fallback: Use any context preset if available
    if (contextPresets.length > 0) {
      console.log(`[Story Weaver] No story-weaver presets found, using first available context preset`);
      const fallbackPreset = contextPresets[0];
      return await applyFileDataToPreset(presetId, fallbackPreset, fileName);
    }

    throw new Error(`No context presets available to load`);
  } catch (error) {
    console.error('[Story Weaver] Error loading preset from file:', error);
    return false;
  }
}

/**
 * Apply loaded file data to preset
 */
async function applyFileDataToPreset(presetId, fileData, fileName) {
  try {
    console.log(`[Story Weaver] Applying file data from ${fileName}:`, fileData);

    // Create a proper preset structure from the loaded JSON
    const loadedPreset = {
      name: extractPresetNameFromFileName(fileName),
      description: `从context文件 ${fileName} 加载的预设`,
      prompts: fileData.prompts || [],
      promptOrder:
        fileData.promptOrder ||
        fileData.prompts?.map(p => ({
          identifier: p.identifier,
          enabled: p.enabled !== false,
        })) ||
        [],
      settings: fileData.settings || {
        enabled: true,
        contextLength: 100,
        storyType: 'fantasy',
        detailLevel: 'detailed',
        chapterCount: 5,
        includeCharacters: true,
        includeSummary: true,
        includeThemes: false,
      },
      created: fileData.created || new Date().toISOString(),
      modified: new Date().toISOString(),
    };

    // Update the preset in settings
    settings.promptPresets[presetId] = loadedPreset;

    // Apply the preset
    const success = applyPromptPreset(presetId);

    console.log(`[Story Weaver] Successfully loaded and applied preset from file: ${fileName}`);
    return success;
  } catch (error) {
    console.error('[Story Weaver] Error applying file data to preset:', error);
    return false;
  }
}

/**
 * Switch to selected prompt preset
 */
async function switchPromptPreset() {
  const presetId = $('#sw-prompt-preset-selector').val();
  console.log('[Story Weaver] Switch preset called with ID:', presetId);

  if (!presetId || presetId === '') {
    console.log('[Story Weaver] No preset ID selected');
    return;
  }

  const preset = settings.promptPresets?.[presetId];
  if (!preset) {
    console.error('[Story Weaver] Preset not found in settings:', presetId);
    console.log('[Story Weaver] Available presets:', Object.keys(settings.promptPresets || {}));
    return;
  }

  console.log('[Story Weaver] Found preset:', preset.name);

  if (confirm('切换预设将会覆盖当前的所有设置，确认继续吗？')) {
    console.log('[Story Weaver] User confirmed, loading preset from file...');

    // Get the original filename from the preset description
    const fileName = extractFileNameFromPreset(preset);
    if (fileName) {
      console.log('[Story Weaver] Loading preset from file:', fileName);
      const success = await loadPresetFromContextFile(presetId, fileName);
      if (success) {
        settings.currentPromptPreset = presetId; // Ensure current preset is set
        saveLastUsedPreset(presetId);
        loadPromptPresetsUI();
        showNotification(`已从文件加载预设: ${preset.name}`, 'success');
      } else {
        showNotification(`从文件加载预设失败: ${preset.name}`, 'error');
      }
    } else {
      // Fallback to existing preset data
      console.log('[Story Weaver] No file found, using cached preset data');
      const success = applyPromptPreset(presetId);
      if (success) {
        settings.currentPromptPreset = presetId; // Ensure current preset is set
        saveLastUsedPreset(presetId);
        loadPromptPresetsUI();
      }
    }
  } else {
    // Reset selector to current preset if user cancels
    const currentPreset = settings.currentPromptPreset || 'default';
    $('#sw-prompt-preset-selector').val(currentPreset);
  }
}

/**
 * Show preset management menu
 */
async function showPresetMenu() {
  const currentPresetId = settings.currentPromptPreset || 'default';
  const currentPreset = settings.promptPresets?.[currentPresetId];

  if (!currentPreset) return;

  const menuOptions = ['重命名当前预设', '删除当前预设', '导出当前预设', '查看预设详情'];

  const choice = prompt(
    `当前预设: ${currentPreset.name}\n\n请选择操作:\n${menuOptions
      .map((opt, i) => `${i + 1}. ${opt}`)
      .join('\n')}\n\n输入数字 (1-${menuOptions.length}):`,
  );

  if (!choice) return;

  const choiceNum = parseInt(choice);
  switch (choiceNum) {
    case 1:
      await renamePromptPreset(currentPresetId);
      break;
    case 2:
      await deletePromptPreset(currentPresetId);
      break;
    case 3:
      exportSinglePreset(currentPresetId);
      break;
    case 4:
      showPresetDetails(currentPresetId);
      break;
    default:
      showNotification('无效选择', 'error');
  }
}

/**
 * Rename a prompt preset
 */
async function renamePromptPreset(presetId) {
  const preset = settings.promptPresets[presetId];
  if (!preset) return;

  const oldName = preset.name;
  const newName = prompt('请输入新的预设名称:', preset.name);
  if (!newName || newName.trim() === '') return;

  try {
    // Create old and new safe preset names for file operations
    const oldSafePresetName = `story-weaver-${oldName.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-')}-${presetId}`;
    const newSafePresetName = `story-weaver-${newName.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-')}-${presetId}`;

    // Update preset in memory
    preset.name = newName.trim();
    preset.modified = new Date().toISOString();

    // Delete old file
    try {
      const deleteResponse = await fetch('/api/presets/delete', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({
          name: oldSafePresetName,
          apiId: 'context',
        }),
      });

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        console.warn(`[Story Weaver] Failed to delete old preset file: ${oldSafePresetName}`);
      }
    } catch (deleteError) {
      console.warn('[Story Weaver] Error deleting old preset file:', deleteError);
    }

    // Save with new name
    await savePresetToFile(preset, presetId);

    // Save settings
    saveSettings();
    loadPromptPresetsUI();
    showNotification(`已重命名预设: ${newName}`, 'success');
  } catch (error) {
    console.error('[Story Weaver] Error renaming preset:', error);
    showNotification(`重命名预设失败: ${error.message}`, 'error');

    // Restore original name on error
    preset.name = oldName;
  }
}

/**
 * Delete a prompt preset
 */
async function deletePromptPreset(presetId) {
  if (presetId === 'default') {
    showNotification('无法删除默认预设', 'error');
    return;
  }

  const preset = settings.promptPresets[presetId];
  if (!preset) return;

  if (!confirm(`确定要删除预设 "${preset.name}" 吗？此操作无法撤销。`)) return;

  try {
    // First try to get the actual filename from presetFileIndex
    let actualFileName = null;
    if (settings.presetFileIndex) {
      const indexEntry = settings.presetFileIndex.find(p => p.presetId === presetId);
      if (indexEntry) {
        actualFileName = indexEntry.fileName.replace('.json', ''); // Remove .json extension for API
      }
    }

    // Fallback: generate filename using current format (for new files)
    const fallbackFileName = `story-weaver-${preset.name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-')}`;

    // Use actual filename if found, otherwise use fallback
    const fileNameToDelete = actualFileName || fallbackFileName;

    console.log(`[Story Weaver] Attempting to delete preset file: ${fileNameToDelete}`);

    // Delete the preset file using SillyTavern's preset API
    const response = await fetch('/api/presets/delete', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify({
        name: fileNameToDelete,
        apiId: 'context',
      }),
    });

    if (!response.ok && response.status !== 404) {
      // 404 is OK, means file doesn't exist
      const errorText = await response.text();
      console.warn(
        `[Story Weaver] Failed to delete preset file: ${response.status} ${response.statusText} - ${errorText}`,
      );
      showNotification('预设文件删除失败，但将从界面中移除', 'warning');
    } else {
      console.log(`[Story Weaver] Preset file deleted successfully: ${safePresetName}`);
    }

    // Remove from settings regardless of file deletion result
    delete settings.promptPresets[presetId];

    // Remove from preset index
    if (settings.presetFileIndex) {
      const index = settings.presetFileIndex.findIndex(p => p.presetId === presetId);
      if (index !== -1) {
        settings.presetFileIndex.splice(index, 1);
        console.log(`[Story Weaver] Removed preset from index: ${presetId}`);
      }
    }

    // Switch to default if current preset is deleted
    if (settings.currentPromptPreset === presetId) {
      settings.currentPromptPreset = 'default';
      applyPromptPreset('default');
    }

    saveSettings();

    // Reset the loaded flag and reload story-weaver presets to reflect changes
    presetsAlreadyLoaded = false;
    await loadStoryWeaverPresets();

    loadPromptPresetsUI();
    showNotification(`预设 "${preset.name}" 已删除`, 'success');
  } catch (error) {
    console.error('[Story Weaver] Error deleting preset:', error);
    showNotification(`删除预设时出错: ${error.message}`, 'error');
  }
}

/**
 * Export single preset
 */
function exportSinglePreset(presetId) {
  const preset = settings.promptPresets[presetId];
  if (!preset) return;

  const exportData = {
    name: `Story Weaver Preset - ${preset.name}`,
    description: preset.description || '用户导出的预设',
    version: PRESET_VERSION,
    type: 'story-weaver-preset',
    settings: {
      ...preset.settings,
      prompts: preset.prompts,
      promptOrder: preset.promptOrder,
    },
    metadata: {
      created: preset.created,
      modified: preset.modified,
      exported: new Date().toISOString(),
    },
  };

  const jsonData = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `story-weaver-preset-${preset.name.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showNotification(`预设已导出: ${preset.name}`, 'success');
}

/**
 * Show preset details
 */
function showPresetDetails(presetId) {
  const preset = settings.promptPresets[presetId];
  if (!preset) return;

  const details = `
预设名称: ${preset.name}
描述: ${preset.description || '无'}
创建时间: ${new Date(preset.created).toLocaleString()}
修改时间: ${new Date(preset.modified).toLocaleString()}
包含提示词: ${preset.prompts?.length || 0} 个
故事类型: ${preset.settings?.storyType || '未设置'}
详细程度: ${preset.settings?.detailLevel || '未设置'}
章节数量: ${preset.settings?.chapterCount || '未设置'}
  `.trim();

  alert(details);
}

/**
 * Get world info data using SillyTavern's native API with position support
 */
async function getWorldInfoData(position = null) {
  try {
    console.log('[Story Weaver] Getting world info via getWorldInfoPrompt...');

    // Use SillyTavern's native world info API to get position-specific data
    if (typeof getWorldInfoPrompt === 'function') {
      // Get current chat context for world info processing
      const context = getContext();
      const chat = context.chat || [];
      const maxContext = 131072; // Increased world info budget for more entries

      // Convert chat messages to proper string format for getWorldInfoPrompt
      const formattedMessages = chat
        .map(message => {
          if (typeof message === 'string') {
            return message;
          } else if (message && typeof message === 'object') {
            // Handle message objects - extract text content
            if (message.mes) return String(message.mes);
            if (message.content) return String(message.content);
            if (message.message) return String(message.message);
            // Fallback: stringify the object
            return JSON.stringify(message);
          }
          // Fallback for any other type
          return String(message || '');
        })
        .filter(msg => msg.trim().length > 0); // Remove empty messages

      console.log(`[Story Weaver] Formatted ${formattedMessages.length} messages for world info processing`);

      const worldInfoResult = await getWorldInfoPrompt(formattedMessages, maxContext, true);

      console.log('[Story Weaver] Raw worldInfoResult:', {
        type: typeof worldInfoResult,
        keys: worldInfoResult ? Object.keys(worldInfoResult) : null,
        worldInfoBefore: worldInfoResult?.worldInfoBefore,
        worldInfoAfter: worldInfoResult?.worldInfoAfter,
        worldInfoDepth: worldInfoResult?.worldInfoDepth,
        worldInfoString: worldInfoResult?.worldInfoString,
        fullResult: worldInfoResult,
      });

      // Check if the API result is incomplete due to budget limitations
      const hasLimitedContent =
        worldInfoResult &&
        (worldInfoResult.worldInfoDepth?.length === 1 ||
          (worldInfoResult.worldInfoDepth?.[0]?.entries?.length === 1 &&
            !worldInfoResult.worldInfoBefore &&
            !worldInfoResult.worldInfoAfter));

      if (hasLimitedContent) {
        console.warn(
          '[Story Weaver] Detected limited world info content due to budget constraints, switching to fallback method',
        );
        // Force fallback to getSortedEntries to get all entries
        throw new Error('Budget limited result, using fallback');
      }

      if (worldInfoResult) {
        // Return position-specific world info
        switch (position) {
          case 'before':
            return worldInfoResult.worldInfoBefore || '';
          case 'after':
            return worldInfoResult.worldInfoAfter || '';
          case 'depth':
            // Format depth entries as a single string
            if (worldInfoResult.worldInfoDepth && Array.isArray(worldInfoResult.worldInfoDepth)) {
              return worldInfoResult.worldInfoDepth
                .map(depthEntry => depthEntry.entries?.join('\n\n') || '')
                .filter(content => content.trim())
                .join('\n\n');
            }
            return '';
          case 'examples':
            // Format example entries
            if (worldInfoResult.worldInfoExamples && Array.isArray(worldInfoResult.worldInfoExamples)) {
              return worldInfoResult.worldInfoExamples
                .map(entry => entry.content || '')
                .filter(content => content.trim())
                .join('\n\n');
            }
            return '';
          default:
            // Return combined world info if no specific position requested
            let combinedContent = worldInfoResult.worldInfoString || '';

            // If worldInfoString is empty, try to extract content from other sources
            if (!combinedContent.trim()) {
              const allContent = [];

              // Add worldInfoBefore content
              if (worldInfoResult.worldInfoBefore) {
                allContent.push('=== Before Content ===\n' + worldInfoResult.worldInfoBefore);
              }

              // Add worldInfoAfter content
              if (worldInfoResult.worldInfoAfter) {
                allContent.push('=== After Content ===\n' + worldInfoResult.worldInfoAfter);
              }

              // Extract content from worldInfoDepth array
              if (worldInfoResult.worldInfoDepth && Array.isArray(worldInfoResult.worldInfoDepth)) {
                worldInfoResult.worldInfoDepth.forEach((depthGroup, index) => {
                  if (depthGroup.entries && Array.isArray(depthGroup.entries)) {
                    const depthContent = depthGroup.entries.join('\n\n');
                    if (depthContent.trim()) {
                      allContent.push(`=== Depth ${depthGroup.depth || index + 1} Content ===\n${depthContent}`);
                    }
                  }
                });
              }

              // Add worldInfoExamples content
              if (worldInfoResult.worldInfoExamples && Array.isArray(worldInfoResult.worldInfoExamples)) {
                const exampleContent = worldInfoResult.worldInfoExamples
                  .map(entry => entry.content || '')
                  .filter(content => content.trim())
                  .join('\n\n');
                if (exampleContent) {
                  allContent.push('=== Examples Content ===\n' + exampleContent);
                }
              }

              combinedContent = allContent.join('\n\n---\n\n');
              console.log('[Story Weaver] Extracted combined content from depth/before/after:', {
                sections: allContent.length,
                totalLength: combinedContent.length,
              });
            }

            return combinedContent;
        }
      }
    }

    // Fallback to old method if native API fails or is budget-limited
    console.log('[Story Weaver] Falling back to getSortedEntries...');
    const entries = getSortedEntries(); // Note: getSortedEntries is synchronous, not async

    if (!entries || entries.length === 0) {
      console.log('[Story Weaver] No world info entries found');
      return '';
    }

    console.log(`[Story Weaver] Found ${entries.length} world info entries`);

    const formattedEntries = entries
      .filter(entry => !entry.disable && entry.content?.trim())
      .slice(0, 20) // Limit to prevent context overflow
      .map(entry => {
        const title = entry.comment || (Array.isArray(entry.key) ? entry.key[0] : entry.key) || 'Entry';
        const world = entry.world ? ` (${entry.world})` : '';

        // Replace user placeholders in world info content using SillyTavern's API
        let content = entry.content;
        if (typeof substituteParams === 'function') {
          content = substituteParams(content);
        } else {
          // Fallback manual replacement
          content = content
            .replace(/\{\{user\}\}/g, getUserName())
            .replace(/<user>/g, getUserName())
            .replace(/<\/user>/g, '');
        }

        return `**${title}${world}**\n${content}`;
      })
      .join('\n\n');

    return formattedEntries;
  } catch (error) {
    console.error('[Story Weaver] Error getting world info:', error);
    return '';
  }
}

/**
 * Process world info markers and inject position-specific content
 */
async function processWorldInfoMarkers() {
  try {
    console.log('[Story Weaver] Processing World Info markers with position-specific content...');

    // Get marker references at function start to avoid scope issues
    const beforeMarker = storyWeaverPrompts.get('worldInfoBefore');
    const afterMarker = storyWeaverPrompts.get('worldInfoAfter');
    const depthMarker = storyWeaverPrompts.get('worldInfoDepth');
    const chatHistoryMarker = storyWeaverPrompts.get('chatHistory');

    // Use SillyTavern's native world info API to get position-specific data
    if (typeof getWorldInfoPrompt === 'function') {
      // Get current chat context for world info processing
      const context = getContext();
      const chat = context.chat || [];
      const maxContext = 131072; // Increased world info budget for more entries

      // Convert chat messages to proper string format for getWorldInfoPrompt
      const formattedMessages = chat
        .map(message => {
          if (typeof message === 'string') {
            return message;
          } else if (message && typeof message === 'object') {
            // Handle message objects - extract text content
            if (message.mes) return String(message.mes);
            if (message.content) return String(message.content);
            if (message.message) return String(message.message);
            // Fallback: stringify the object
            return JSON.stringify(message);
          }
          // Fallback for any other type
          return String(message || '');
        })
        .filter(msg => msg.trim().length > 0); // Remove empty messages

      console.log(`[Story Weaver] Formatted ${formattedMessages.length} messages for markers processing`);

      const worldInfoResult = await getWorldInfoPrompt(formattedMessages, maxContext, false);

      if (worldInfoResult) {
        console.log('[Story Weaver] World Info API result structure:', {
          worldInfoBefore: worldInfoResult.worldInfoBefore?.length || 0,
          worldInfoAfter: worldInfoResult.worldInfoAfter?.length || 0,
          worldInfoDepth: Array.isArray(worldInfoResult.worldInfoDepth) ? worldInfoResult.worldInfoDepth.length : 0,
          worldInfoString: worldInfoResult.worldInfoString?.length || 0,
        });

        // Update worldInfoBefore marker
        if (beforeMarker) {
          beforeMarker.content = worldInfoResult.worldInfoBefore || '';
          console.log('[Story Weaver] Updated worldInfoBefore with', beforeMarker.content.length, 'characters');
        }

        // Update worldInfoAfter marker
        if (afterMarker) {
          afterMarker.content = worldInfoResult.worldInfoAfter || '';
          console.log('[Story Weaver] Updated worldInfoAfter with', afterMarker.content.length, 'characters');
        }

        // Update global world info marker (aggregated global lore)
        const globalMarker = storyWeaverPrompts.get('worldInfoGlobal');
        if (globalMarker) {
          let globalContent = '';
          if (worldInfoResult.worldInfoString && worldInfoResult.worldInfoString.trim()) {
            globalContent = worldInfoResult.worldInfoString;
          } else {
            const parts = [];
            if (worldInfoResult.worldInfoBefore) parts.push(worldInfoResult.worldInfoBefore);
            if (worldInfoResult.worldInfoAfter) parts.push(worldInfoResult.worldInfoAfter);
            globalContent = parts.join('\n\n');
          }
          if (globalContent && globalContent.trim()) {
            globalMarker.content = globalContent;
            console.log('[Story Weaver] Updated worldInfoGlobal with', globalMarker.content.length, 'characters');
          } else {
            console.log('[Story Weaver] worldInfoGlobal via API is empty, will try to enrich from getSortedEntries');
          }
        }

        // Process depth-based entries and assign to appropriate markers by depth
        if (worldInfoResult.worldInfoDepth && Array.isArray(worldInfoResult.worldInfoDepth)) {
          // Clear existing content in depth-related markers
          if (chatHistoryMarker) chatHistoryMarker.content = '';
          if (depthMarker) depthMarker.content = '';

          // Process each depth group and assign to markers based on depth
          worldInfoResult.worldInfoDepth.forEach(depthGroup => {
            if (depthGroup.entries && Array.isArray(depthGroup.entries) && depthGroup.entries.length > 0) {
              const depth = depthGroup.depth || 4; // Default depth
              const role = depthGroup.role || 'system'; // Default role

              // Format content for this depth group
              const rolePrefix = role === 'user' ? '[用户]' : '[系统]';
              const depthInfo = ` (深度: ${depth})`;
              const depthContent = `${rolePrefix}${depthInfo}\n${depthGroup.entries.join('\n\n')}`;

              // Determine which marker to use based on depth
              let targetMarker;
              let markerName;

              if (depth <= 2) {
                // Shallow depths (1-2) go to chatHistory - these are closer to current conversation
                targetMarker = chatHistoryMarker;
                markerName = 'chatHistory';
              } else {
                // Medium to deep depths (3+) go to worldInfoDepth
                targetMarker = depthMarker;
                markerName = 'worldInfoDepth';
              }

              if (targetMarker) {
                // Append to existing content or set new content
                if (targetMarker.content && targetMarker.content.trim()) {
                  targetMarker.content += '\n\n---\n\n' + depthContent;
                } else {
                  targetMarker.content = depthContent;
                }
                console.log(
                  `[Story Weaver] Assigned depth ${depth} (${depthGroup.entries.length} entries) to ${markerName} marker`,
                );
              }
            }
          });

          console.log('[Story Weaver] Depth processing complete:', {
            chatHistoryContent: chatHistoryMarker?.content?.length || 0,
            worldInfoDepthContent: depthMarker?.content?.length || 0,
            totalDepthGroups: worldInfoResult.worldInfoDepth.length,
          });
        }

        // Also merge precise Global entries from getSortedEntries into markers (same placement rules)
        if (typeof getSortedEntries === 'function') {
          const all = (() => {
            try {
              const res = getSortedEntries();
              return Array.isArray(res) ? res : [];
            } catch (e) {
              console.warn('[Story Weaver] getSortedEntries threw:', e);
              return [];
            }
          })();
          const globals = all.filter(
            e => !e?.disable && !e?.character && !e?.chat && typeof e?.content === 'string' && e.content.trim(),
          );

          if (globals.length) {
            const mapContent = e => (typeof substituteParams === 'function' ? substituteParams(e.content) : e.content);

            const gBefore = globals
              .filter(e => e.position === 0 || e.position === 'before')
              .map(mapContent)
              .join('\n\n');
            const gAfter = globals
              .filter(e => e.position === 1 || e.position === 'after')
              .map(mapContent)
              .join('\n\n');

            const gShallow = globals
              .filter(e => (e.depth ?? 4) <= 2)
              .map(mapContent)
              .join('\n\n');
            const gDeep = globals
              .filter(e => (e.depth ?? 4) >= 3)
              .map(mapContent)
              .join('\n\n');

            // Append using same placement as角色分层
            const globalMarker = storyWeaverPrompts.get('worldInfoGlobal');

            if (beforeMarker && gBefore) {
              beforeMarker.content = [beforeMarker.content, gBefore].filter(Boolean).join('\n\n---\n\n');
            }
            if (afterMarker && gAfter) {
              afterMarker.content = [afterMarker.content, gAfter].filter(Boolean).join('\n\n---\n\n');
            }
            if (chatHistoryMarker && gShallow) {
              chatHistoryMarker.content = [chatHistoryMarker.content, gShallow].filter(Boolean).join('\n\n---\n\n');
            }
            if (depthMarker && gDeep) {
              depthMarker.content = [depthMarker.content, gDeep].filter(Boolean).join('\n\n---\n\n');
            }
            if (globalMarker) {
              const agg = [gBefore, gAfter, gShallow, gDeep].filter(Boolean).join('\n\n');
              if (agg) globalMarker.content = [globalMarker.content, agg].filter(Boolean).join('\n\n---\n\n');
            }

            console.log('[Story Weaver] Global enrichment from getSortedEntries:', {
              globals_total: globals.length,
              before_len: gBefore.length,
              after_len: gAfter.length,
              shallow_len: gShallow.length,
              deep_len: gDeep.length,
            });
          }
        }

        return {
          before: worldInfoResult.worldInfoBefore || '',
          after: worldInfoResult.worldInfoAfter || '',
          depth: depthMarker?.content || '',
          chatHistory: chatHistoryMarker?.content || '',
          totalString: worldInfoResult.worldInfoString || '',
        };
      }
    }

    // Fallback: if native API fails, use getSortedEntries as backup
    console.warn('[Story Weaver] Native World Info API not available, using getSortedEntries fallback');

    try {
      // Use getSortedEntries to get world info data
      const sortedEntries = getSortedEntries();
      console.log(`[Story Weaver] Fallback: Found ${sortedEntries?.length || 0} world info entries`);

      if (sortedEntries && sortedEntries.length > 0) {
        // Separate entries by depth/position for marker assignment
        const beforeEntries = [];
        const afterEntries = [];
        const depthEntries = [];
        const chatHistoryEntries = [];

        let enabledCount = 0;
        let disabledCount = 0;

        sortedEntries.forEach(entry => {
          if (entry.disable) {
            disabledCount++;
            return; // Skip disabled entries
          }

          enabledCount++;

          // Format entry content with more detail
          const worldName = entry.world || 'Unknown World';
          const entryTitle = entry.comment || entry.key || 'Unknown Entry';
          const position =
            entry.position === 0
              ? 'Before'
              : entry.position === 1
              ? 'After'
              : entry.position === 2
              ? "Author's Note"
              : 'Depth';
          const depth = entry.depth || 'N/A';

          const formattedContent = `[${worldName}] ${entryTitle}
Position: ${position}${position === 'Depth' ? ` (Depth: ${depth})` : ''}
${entry.constant ? '[CONSTANT] ' : ''}${
            entry.key ? `Keys: ${Array.isArray(entry.key) ? entry.key.join(', ') : entry.key}` : ''
          }
Content:
${entry.content}`;

          // Categorize by position/depth
          if (entry.position === 0) {
            // Before entries
            beforeEntries.push(formattedContent);
          } else if (entry.position === 1) {
            // After entries
            afterEntries.push(formattedContent);
          } else if (entry.position === 2) {
            // Author's Note
            // Skip author's note entries for now
          } else if (entry.depth <= 2) {
            // Shallow depth - assign to chatHistory
            chatHistoryEntries.push(formattedContent);
          } else {
            // Medium to deep depth - assign to worldInfoDepth
            depthEntries.push(formattedContent);
          }
        });

        console.log(
          `[Story Weaver] Fallback categorization: ${enabledCount} enabled entries (${disabledCount} disabled)`,
          {
            before: beforeEntries.length,
            after: afterEntries.length,
            chatHistory: chatHistoryEntries.length,
            depth: depthEntries.length,
          },
        );

        // Update markers with fallback content

        if (beforeMarker) {
          beforeMarker.content = beforeEntries.length > 0 ? beforeEntries.join('\n\n---\n\n') : '';
          console.log(`[Story Weaver] Fallback: Updated worldInfoBefore with ${beforeEntries.length} entries`);
        }

        if (afterMarker) {
          afterMarker.content = afterEntries.length > 0 ? afterEntries.join('\n\n---\n\n') : '';
          console.log(`[Story Weaver] Fallback: Updated worldInfoAfter with ${afterEntries.length} entries`);
        }

        if (depthMarker) {
          depthMarker.content = depthEntries.length > 0 ? depthEntries.join('\n\n---\n\n') : '';
          console.log(`[Story Weaver] Fallback: Updated worldInfoDepth with ${depthEntries.length} entries`);
        }

        if (chatHistoryMarker) {
          chatHistoryMarker.content = chatHistoryEntries.length > 0 ? chatHistoryEntries.join('\n\n---\n\n') : '';
          console.log(`[Story Weaver] Fallback: Updated chatHistory with ${chatHistoryEntries.length} entries`);
        }

        // Create combined content for totalString
        const allContent = [...beforeEntries, ...afterEntries, ...depthEntries, ...chatHistoryEntries];
        const totalString = allContent.join('\n\n---\n\n');

        return {
          before: beforeMarker?.content || '',
          after: afterMarker?.content || '',
          depth: depthMarker?.content || '',
          chatHistory: chatHistoryMarker?.content || '',
          totalString: totalString,
        };
      } else {
        console.log('[Story Weaver] Fallback: No world info entries found, using empty markers');
      }
    } catch (fallbackError) {
      console.error('[Story Weaver] Fallback getSortedEntries also failed:', fallbackError);
    }

    // Final fallback: empty content
    if (beforeMarker) beforeMarker.content = '';
    if (afterMarker) afterMarker.content = '';
    if (depthMarker) depthMarker.content = '';
    if (chatHistoryMarker) chatHistoryMarker.content = '';

    return {
      before: '',
      after: '',
      depth: '',
      chatHistory: '',
      totalString: '',
    };
  } catch (error) {
    console.error('[Story Weaver] Error processing world info markers:', error);
    return {
      before: '',
      after: '',
      depth: '',
      chatHistory: '',
      totalString: '',
    };
  }
}

/**
 * Get user name using SillyTavern's imported variable
 */
function getUserName() {
  try {
    // Use SillyTavern's imported user name variable
    if (typeof name1 !== 'undefined' && name1) {
      return name1;
    }

    // Fallback to window global
    if (typeof window.name1 !== 'undefined' && window.name1) {
      return window.name1;
    }

    // Final fallback to default
    return 'User';
  } catch (error) {
    console.error('[Story Weaver] Error getting user name:', error);
    return 'User';
  }
}

/**
 * Get character data using SillyTavern's context
 */
function getCharacterData() {
  try {
    const context = getContext();
    const characterId = context.characterId;
    const characters = context.characters;

    if (characterId !== undefined && characters && characters[characterId]) {
      const character = characters[characterId];

      let characterInfo = `**角色名称**: ${character.name || 'Unknown'}\n\n`;

      if (character.description) {
        characterInfo += `**角色描述**:\n${character.description}\n\n`;
      }

      if (character.personality) {
        characterInfo += `**角色性格**:\n${character.personality}\n\n`;
      }

      if (character.scenario) {
        characterInfo += `**场景设定**:\n${character.scenario}\n\n`;
      }

      if (character.first_mes) {
        characterInfo += `**初始消息**:\n${character.first_mes}\n\n`;
      }

      if (character.mes_example) {
        characterInfo += `**对话示例**:\n${character.mes_example}\n\n`;
      }

      console.log('[Story Weaver] Character data loaded:', character.name);
      return characterInfo.trim();
    }

    console.log('[Story Weaver] No character data found');
    return '';
  } catch (error) {
    console.error('[Story Weaver] Error getting character data:', error);
    return '';
  }
}

/**
 * Get chat context
 */
function getChatContext(maxLength = 100) {
  try {
    const context = getContext();
    const chat = context.chat || [];

    if (maxLength === 0 || chat.length === 0) {
      return '';
    }

    const recentMessages = chat
      .slice(-maxLength)
      .filter(msg => msg && msg.mes && msg.mes.trim())
      .map(msg => {
        const sender = msg.is_user ? '用户' : msg.name || '角色';
        return `${sender}: ${msg.mes}`;
      });

    console.log(`[Story Weaver] Chat context: ${recentMessages.length} messages`);
    return recentMessages.join('\n\n');
  } catch (error) {
    console.error('[Story Weaver] Error getting chat context:', error);
    return '';
  }
}

/**
 * Build requirements text from form data
 */
function buildRequirementsText() {
  const storyType = $('#story-type').val();
  const storyStyle = $('#story-style').val();
  const storyTheme = $('#story-theme').val();
  const chapterCount = $('#chapter-count').val();
  const detailLevel = $('#detail-level').val();
  const specialReqs = $('#special-requirements').val();

  let requirements = `**故事类型**: ${getStoryTypeName(storyType)}\n`;
  requirements += `**叙事风格**: ${getStoryStyleName(storyStyle)}\n`;
  requirements += `**期望章节数**: ${chapterCount}章\n`;
  requirements += `**大纲详细程度**: ${getDetailLevelName(detailLevel)}\n\n`;

  if (storyTheme && storyTheme.trim()) {
    requirements += `**故事主题/核心冲突**:\n${storyTheme.trim()}\n\n`;
  }

  if (specialReqs && specialReqs.trim()) {
    requirements += `**特殊要求**:\n${specialReqs.trim()}\n\n`;
  }

  // Add generation options
  const includeOptions = [];
  if ($('#include-summary').is(':checked')) includeOptions.push('整体摘要');
  if ($('#include-characters').is(':checked')) includeOptions.push('角色发展');
  if ($('#include-themes').is(':checked')) includeOptions.push('主题分析');

  if (includeOptions.length > 0) {
    requirements += `**包含内容**: ${includeOptions.join('、')}\n`;
  }

  return requirements;
}

/**
 * 设置生成按钮为加载状态（但保持可点击用于取消）
 */
function setGenerateButtonToLoading() {
  const generateBtn = $('#generate-outline');
  const btnText = generateBtn.find('.btn-text');
  const btnLoading = generateBtn.find('.btn-loading');

  btnText.addClass('hidden');
  btnLoading.removeClass('hidden');

  // 更改按钮文字提示，表示可以取消
  generateBtn.attr('title', '点击取消生成');
}

/**
 * 重置生成按钮为正常状态
 */
function resetGenerateButton() {
  const generateBtn = $('#generate-outline');
  const btnText = generateBtn.find('.btn-text');
  const btnLoading = generateBtn.find('.btn-loading');

  btnText.removeClass('hidden');
  btnLoading.addClass('hidden');

  // 恢复正常提示文字
  generateBtn.attr('title', '生成故事大纲');

  // 清除生成状态
  isGenerating = false;
}

/**
 * 取消当前的生成请求（使用 SillyTavern 原生机制）
 */
function cancelGeneration() {
  if (isGenerating) {
    // 使用 SillyTavern 的原生停止机制
    if (typeof window.stopGeneration === 'function') {
      const stopped = window.stopGeneration();
      if (stopped) {
        console.log('[Story Weaver] Generation request cancelled using SillyTavern stopGeneration');
        showNotification('生成已取消', 'info');
      } else {
        console.warn('[Story Weaver] SillyTavern stopGeneration did not stop anything');
      }
    } else {
      console.warn('[Story Weaver] SillyTavern stopGeneration function not available');
      showNotification('取消失败：无法访问停止功能', 'error');
    }
    resetGenerateButton();
  }
}

/**
 * Generate story outline using TavernHelper.generateRaw
 */
async function generateStoryOutline() {
  // 检查是否已经在生成中，如果是则取消
  if (isGenerating) {
    cancelGeneration();
    return;
  }

  try {
    console.log('[Story Weaver] Starting story outline generation...');

    // 设置生成状态
    isGenerating = true;

    // Temporarily register prompts for this generation
    console.log('[Story Weaver] Temporarily registering prompts for generation...');
    await updateStoryWeaverPromptRegistrations();

    // Show loading state (keep button clickable for cancellation)
    setGenerateButtonToLoading();

    // Process world info markers first to inject position-specific content
    const worldInfoResult = await processWorldInfoMarkers();
    console.log('[Story Weaver] World info markers processed:', worldInfoResult);

    // Get context data (no need for worldInfoData since we use markers now)
    const characterData = getCharacterData();
    const contextLength = parseInt($('#context-length').val()) || 0;
    const chatContext = getChatContext(contextLength);
    const requirementsText = buildRequirementsText();

    // Build final prompt from enabled prompts using new prompt manager system
    // Also prepare ordered prompts list to send exactly like preview (no debug)
    let finalPrompt = '';
    const orderedPrompts = [];

    // Get enabled prompts in the correct order (using storyWeaverPromptOrder, not injection_order)
    let allPrompts = [];

    if (storyWeaverPromptOrder && storyWeaverPromptOrder.length > 0) {
      // Use the explicitly set prompt order (from import or manual arrangement)
      allPrompts = storyWeaverPromptOrder
        .map(identifier => storyWeaverPrompts.get(identifier))
        .filter(prompt => prompt !== undefined); // Filter out any missing prompts

      // Add any prompts not in the order list at the end (fallback)
      const orderedIdentifiers = new Set(storyWeaverPromptOrder);
      const unorderedPrompts = [...storyWeaverPrompts.collection].filter(
        prompt => !orderedIdentifiers.has(prompt.identifier),
      );
      allPrompts.push(...unorderedPrompts);
    } else {
      // Fallback to injection_order sorting if no explicit order is set
      allPrompts = [...storyWeaverPrompts.collection].sort((a, b) => a.injection_order - b.injection_order);
    }

    // Filter to only enabled prompts
    const enabledPrompts = allPrompts.filter(prompt => prompt.enabled !== false);

    // Process enabled prompts using the same logic as extension prompt registration
    for (const prompt of enabledPrompts) {
      try {
        // Use the same content processing as extension prompt registration
        const processedContent = await processStoryWeaverPromptContent(prompt);

        // For system marker prompts, use SillyTavern's substituteParams directly on original content
        const isSystemMarker = [
          'personaDescription',
          'charDescription',
          'charPersonality',
          'scenario',
          'worldInfoAfter',
          'dialogueExamples',
          'chatHistory',
        ].includes(prompt.identifier);

        let finalContent;
        if (isSystemMarker) {
          // For system markers, apply SillyTavern's variable substitution to original content
          finalContent = substituteParams(prompt.content || '');
          console.log(`[Story Weaver] System marker "${prompt.identifier}" processed: ${finalContent.length} chars`);
        } else {
          // For custom prompts, use fully processed content
          finalContent = processedContent;
          console.log(`[Story Weaver] Custom prompt "${prompt.identifier}" processed: ${finalContent.length} chars`);
        }

        if (finalContent && finalContent.trim()) {
          const finalForPromptPhase = applyPluginRegex(finalContent, 'prompt');
          finalPrompt += finalForPromptPhase + '\n\n';
          const role = (prompt.role || 'system').toLowerCase();
          orderedPrompts.push({ role, content: finalForPromptPhase });
        } else if (isSystemMarker) {
          console.log(`[Story Weaver] System marker "${prompt.identifier}" is empty, but keeping for ST integration`);
          // Even empty system markers might be filled by SillyTavern later
          finalPrompt += '\n\n';
        }
      } catch (error) {
        console.error(`[Story Weaver] Error processing prompt ${prompt.identifier}:`, error);
      }
    }

    console.log('[Story Weaver] Legacy prompt construction complete. Length:', finalPrompt.length);
    console.log('[Story Weaver] Sending exactly the preview prompts via ordered_prompts.');

    // Store the final prompt for audit (no debug) and add on-demand viewer button
    window.StoryWeaverOrderedPrompts = orderedPrompts.slice();
    window.StoryWeaverLastPrompt = orderedPrompts.map(p => `[${p.role}]\n${p.content}`).join('\n\n');
    window.StoryWeaverExtensionPrompts = Object.keys(extension_prompts).filter(k => k.startsWith('story_weaver_'));
    try {
      if (!document.getElementById('sw-last-prompt-btn')) {
        const btn = document.createElement('button');
        btn.id = 'sw-last-prompt-btn';
        btn.className = 'action-btn';
        btn.title = '查看本次发送给AI的真实提示词';
        btn.innerHTML = '<span class="btn-icon">🧾</span>';
        const actions = document.querySelector('#output-section .title-actions');
        if (actions) actions.appendChild(btn);
        btn.addEventListener('click', () => showLastSentPrompt());
      }
    } catch (_) {}

    // Send using ordered_prompts so that the model receives exactly our constructed prompt
    window.StoryWeaverSendMode = 'ordered_prompts';
    window.StoryWeaverUsedNativeGeneration = false;
    let result = '';
    if (window.TavernHelper?.generateRaw) {
      // Preferred path: TavernHelper with ordered_prompts (abort handled by SillyTavern)
      result = await window.TavernHelper.generateRaw({
        ordered_prompts: orderedPrompts,
        max_chat_history: 0,
        should_stream: false,
      });
    } else if (typeof window.generateRaw === 'function') {
      // Fallback: core generateRaw also supports ordered_prompts object (abort handled by SillyTavern)
      result = await window.generateRaw({
        ordered_prompts: orderedPrompts,
        max_chat_history: 0,
        should_stream: false,
      });
    } else {
      throw new Error('未找到可用的 RAW 生成接口');
    }

    if (!result || result.trim().length < 10) {
      throw new Error('生成的内容过短或为空');
    }

    // Display results (apply regex for result phase only to our output)
    const processedResult = applyPluginRegex(result.trim(), 'result');

    // ===== 版本管理系统集成 =====
    // 收集当前设置用于版本管理
    const currentSettings = {
      contextLength: parseInt($('#context-length').val()) || 0,
      storyType: $('#story-type').val(),
      storyTheme: $('#story-theme').val(),
      storyStyle: $('#story-style').val(),
      chapterCount: parseInt($('#chapter-count').val()) || 5,
      detailLevel: $('#detail-level').val(),
      specialRequirements: $('#special-requirements').val(),
      includeCharacters: $('#include-characters').is(':checked'),
      includeSummary: $('#include-summary').is(':checked'),
      includeThemes: $('#include-themes').is(':checked'),
      timestamp: Date.now(),
    };

    // 创建新的大纲版本
    const outlineTitle = `故事大纲 - ${$('#story-type option:selected').text()} - ${new Date().toLocaleString()}`;
    const outline = versionManager.createOutline(outlineTitle, processedResult, currentSettings);

    console.log('[Version Manager] Created new outline version:', outline.id);

    // 显示结果（现在包含版本管理功能）
    displayResults(processedResult, outline);

    console.log('[Story Weaver] Story outline generated successfully');
  } catch (error) {
    // 检查是否是用户取消的请求（SillyTavern 可能抛出不同的错误）
    if (
      error.name === 'AbortError' ||
      error.message?.includes('aborted') ||
      error.message?.includes('cancelled') ||
      error.message?.includes('stopped') ||
      error.message === 'Clicked stop button'
    ) {
      console.log('[Story Weaver] Generation was cancelled by user:', error.message);
      // 取消时不显示错误通知，这是正常的用户操作
      return;
    }

    console.error('[Story Weaver] Generation failed:', error);
    showNotification('故事大纲生成失败: ' + error.message, 'error');
  } finally {
    // Clear registered prompts after generation
    console.log('[Story Weaver] Clearing temporary prompt registrations...');
    clearAllStoryWeaverPrompts();

    // Reset button state to normal
    resetGenerateButton();
  }
}

/**
 * Display generation results
 */
function displayResults(content, outline = null) {
  const outputContent = $('#output-content');
  const outputStats = $('#output-stats');

  // Clear placeholder
  outputContent.find('.output-placeholder').remove();

  console.log('[Story Weaver] Displaying results with new paragraph system');

  // Use the new paragraph system to display content
  displayGeneratedOutline(content);

  // Update stats
  updateContentStats(content);

  outputStats.removeClass('hidden');

  // ===== 集成新功能系统 =====
  if (outline) {
    // 延迟执行以确保DOM已更新
    setTimeout(() => {
      try {
        // 设置编辑功能
        editManager.setupEditableContent();

        // 设置拖拽功能
        dragManager.setupDraggableOutput();

        // 更新版本信息显示
        hotkeyManager.updateVersionInfo(outline);

        console.log('[Feature Integration] Edit, drag, and version features setup complete');
      } catch (error) {
        console.error('[Feature Integration] Failed to setup features:', error);
      }
    }, 500);
  }
}

/**
 * Show the last sent prompt in a modal for audit/debugging
 */
function showLastSentPrompt() {
  try {
    const last = window.StoryWeaverLastPrompt || '';
    const extensionPrompts = window.StoryWeaverExtensionPrompts || [];
    const themeInfo = getThemeInfo('body');

    // Build extension prompt information
    let extensionPromptInfo = '\n=== ACTIVE EXTENSION PROMPTS ===\n';
    extensionPromptInfo += `Registered extension prompts: ${extensionPrompts.length}\n`;
    extensionPrompts.forEach(key => {
      const prompt = extension_prompts[key];
      if (prompt) {
        extensionPromptInfo += `- ${key}: position=${prompt.position}, role=${prompt.role}, depth=${
          prompt.depth
        }, content=${prompt.value?.length || 0} chars\n`;
      }
    });
    extensionPromptInfo += '\n注意：以上Extension Prompts会被SillyTavern自动集成到最终发送给AI的提示词中\n';
    extensionPromptInfo += '=================================\n\n';

    const finalContent = extensionPromptInfo + (last || '(无)');
    const html = `
      <div class="story-weaver-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: ${themeInfo.modalBg}; color: ${themeInfo.textColor}; border: 1px solid ${
      themeInfo.borderColor
    }; border-radius: 8px; max-width: 90%; max-height: 90%; overflow: hidden; position: relative;">
          <div style="display:flex; align-items:center; justify-content: space-between; gap:12px; padding: 12px 16px; border-bottom: 1px solid ${
            themeInfo.borderColor
          }; background: ${themeInfo.headerBg};">
            <h3 style="margin:0;">🧾 Extension Prompts 状态 (实际发送给AI)</h3>
            <div>
              <button id="sw-copy-last-prompt" class="action-btn" title="复制"><span class="btn-icon">📋</span></button>
              <button id="sw-close-last-prompt" class="action-btn" title="关闭"><span class="btn-icon">✕</span></button>
            </div>
          </div>
          <div style="padding: 12px; max-height: 70vh; overflow: auto;">
            <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px;">${$('<div/>')
              .text(finalContent)
              .html()}</pre>
          </div>
          <div style="padding: 8px 12px; font-size: 12px; color: ${themeInfo.mutedColor}; border-top: 1px solid ${
      themeInfo.borderColor
    };">Extension Prompts: ${extensionPrompts.length} | 总内容长度: ${finalContent.length}</div>
        </div>
      </div>`;

    const $modal = $(html);
    $('body').append($modal);
    $modal.on('click', e => {
      if (e.target === $modal[0]) $modal.remove();
    });
    $modal.find('#sw-close-last-prompt').on('click', () => $modal.remove());
    $modal.find('#sw-copy-last-prompt').on('click', () => {
      navigator.clipboard
        ?.writeText(finalContent)
        .then(() => showNotification('已复制Extension Prompts信息', 'success'));
    });
  } catch (e) {
    console.error('[Story Weaver] Failed to show last prompt:', e);
  }
}

/**
 * Get background brightness value
 */
function getBackgroundBrightness(element) {
  const $el = $(element);
  let bgColor = $el.css('background-color');

  // If transparent, check parent elements
  if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
    let parent = $el.parent();
    while (parent.length && (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent')) {
      bgColor = parent.css('background-color');
      parent = parent.parent();
    }
  }

  // Convert RGB to brightness
  const rgb = bgColor.match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    return Math.round((parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000);
  }

  return null;
}

/**
 * Detect theme type and get contrast colors
 */
function getThemeInfo(baseElement = 'body') {
  let brightness = getBackgroundBrightness(baseElement);

  // Fallback methods if direct detection fails
  if (brightness === null) {
    // Check for theme classes
    if ($('body').hasClass('light') || $('html').hasClass('light')) {
      brightness = 240; // Force light
    } else if ($('body').hasClass('dark') || $('html').hasClass('dark')) {
      brightness = 20; // Force dark
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      brightness = 200;
    } else {
      brightness = 50; // Default to dark
    }
  }

  const isLight = brightness > 128;

  return {
    isLight,
    brightness,
    textColor: isLight ? '#000000' : '#ffffff',
    boldTextColor: isLight ? '#000000' : '#ffffff',
    boldWeight: isLight ? '800' : '700',
    normalWeight: isLight ? '600' : '400',
    headingColor: isLight ? '#d17800' : '#ffa500',
    mutedColor: isLight ? '#666666' : '#aaaaaa',
    bgColor: isLight ? '#f8f9fa' : '#2a2a2a',
    borderColor: isLight ? '#dee2e6' : '#444444',
    // Modal specific colors
    modalBg: isLight ? '#ffffff' : '#1e1e1e',
    headerBg: isLight ? '#f8f9fa' : '#2a2a2a',
    contentBg: isLight ? '#ffffff' : '#242424',
    inputBg: isLight ? '#ffffff' : '#2a2a2a',
    // Button colors
    primaryBtnBg: isLight ? '#007bff' : '#0056b3',
    primaryBtnColor: '#ffffff',
    primaryBtnBorder: isLight ? '#007bff' : '#0056b3',
    secondaryBtnBg: isLight ? '#f8f9fa' : '#3a3a3a',
    secondaryBtnColor: isLight ? '#495057' : '#ffffff',
    // Focus and hover colors
    focusColor: isLight ? '#007bff' : '#66b3ff',
    hoverBg: isLight ? '#e9ecef' : '#3a3a3a',
  };
}

/**
 * Get appropriate content styles based on theme
 */
function getContentStyles(themeInfo) {
  return `color: ${themeInfo.textColor} !important; font-weight: ${themeInfo.normalWeight};`;
}

/**
 * Enhance content contrast for better readability
 */
function enhanceContentContrast(content, themeInfo) {
  // Apply consistent styling regardless of theme
  return (
    content
      // Bold text with maximum contrast
      .replace(
        /\*\*(.*?)\*\*/g,
        `<strong style="color: ${themeInfo.boldTextColor}; font-weight: ${themeInfo.boldWeight};">$1</strong>`,
      )
      // Headings with accent color and bold weight
      .replace(/^(#{1,6}\s+.*)$/gm, match => {
        const level = match.match(/^#+/)[0].length;
        const text = match.replace(/^#+\s+/, '');
        return `<h${level} style="color: ${themeInfo.headingColor}; font-weight: ${themeInfo.boldWeight}; margin: 16px 0 8px 0;">${text}</h${level}>`;
      })
      // Numbered lists with enhanced contrast
      .replace(
        /^(\d+\.\s+.*?)$/gm,
        `<div style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.normalWeight}; margin: 8px 0;">$1</div>`,
      )
      // Bullet points with enhanced contrast
      .replace(
        /^(\s*[-*]\s+.*?)$/gm,
        `<div style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.normalWeight}; margin: 4px 0;">$1</div>`,
      )
  );
}

/**
 * Update content statistics
 */
function updateContentStats(content) {
  const wordCount = content.length;
  const chapterMatches = content.match(/章节|第.*章|Chapter/gi) || [];
  const actualChapters = chapterMatches.length;

  $('#word-count').text(wordCount);
  $('#actual-chapters').text(actualChapters);
  $('#generation-time').text(new Date().toLocaleTimeString());
}

/**
 * Escape HTML characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Use SillyTavern's notification system if available
  if (window.toastr) {
    window.toastr[type](message);
  } else {
    console.log(`[Story Weaver] ${type.toUpperCase()}: ${message}`);
  }
}

/**
 * Test world info marker functionality (debug function)
 */
async function testWorldInfoMarkers() {
  try {
    console.log('[Story Weaver] Testing world info marker functionality...');

    // Test getting world info data by position
    const beforeData = await getWorldInfoData('before');
    const afterData = await getWorldInfoData('after');
    const depthData = await getWorldInfoData('depth');
    const combinedData = await getWorldInfoData();

    console.log('[Story Weaver] World Info Test Results:', {
      before: beforeData ? `${beforeData.length} chars` : 'empty',
      after: afterData ? `${afterData.length} chars` : 'empty',
      depth: depthData ? `${depthData.length} chars` : 'empty',
      combined: combinedData ? `${combinedData.length} chars` : 'empty',
    });

    // Test marker processing
    const markerResult = await processWorldInfoMarkers();
    console.log('[Story Weaver] Marker processing result:', markerResult);

    // Check if markers were updated
    const beforeMarker = storyWeaverPrompts.get('worldInfoBefore');
    const afterMarker = storyWeaverPrompts.get('worldInfoAfter');
    const depthMarker = storyWeaverPrompts.get('worldInfoDepth');

    console.log('[Story Weaver] Marker content check:', {
      beforeMarkerExists: !!beforeMarker,
      beforeMarkerContent: beforeMarker?.content?.length || 0,
      afterMarkerExists: !!afterMarker,
      afterMarkerContent: afterMarker?.content?.length || 0,
      depthMarkerExists: !!depthMarker,
      depthMarkerContent: depthMarker?.content?.length || 0,
    });

    showNotification('世界书标记测试完成，请查看控制台日志', 'info');
  } catch (error) {
    console.error('[Story Weaver] World info marker test failed:', error);
    showNotification('世界书标记测试失败: ' + error.message, 'error');
  }
}

/**
 * Helper functions for UI text
 */
function getStoryTypeName(type) {
  const types = {
    fantasy: '🏰 奇幻冒险',
    romance: '💖 浪漫爱情',
    mystery: '🔍 悬疑推理',
    scifi: '🚀 科幻未来',
    'slice-of-life': '🌸 日常生活',
    action: '⚔️ 动作冒险',
    drama: '🎭 情感剧情',
    horror: '👻 恐怖惊悚',
    comedy: '😄 轻松喜剧',
    custom: '🎨 自定义',
  };
  return types[type] || type;
}

function getStoryStyleName(style) {
  const styles = {
    descriptive: '📝 详细描述型',
    dialogue: '💬 对话推进型',
    action: '⚡ 快节奏动作型',
    introspective: '🤔 内心独白型',
    episodic: '📚 章节式结构',
  };
  return styles[style] || style;
}

function getDetailLevelName(level) {
  const levels = {
    brief: '简要大纲',
    detailed: '详细大纲',
    comprehensive: '全面大纲',
  };
  return levels[level] || level;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Generate button
  $(document).off('click', '#generate-outline').on('click', '#generate-outline', generateStoryOutline);

  // Close panel button
  $(document).off('click', '#close-story-weaver').on('click', '#close-story-weaver', hideStoryWeaverPanel);

  // Minimize panel button
  $(document).off('click', '#minimize-story-weaver').on('click', '#minimize-story-weaver', toggleMinimizePanel);

  // Regex manager open button
  $(document).off('click', '#open-regex-manager').on('click', '#open-regex-manager', openRegexManager);

  // Setup drag functionality
  setupDragFunctionality();

  // Preview buttons
  $(document).off('click', '#preview-world-info').on('click', '#preview-world-info', showWorldInfoPreview);
  $(document).off('click', '#preview-complete-prompt').on('click', '#preview-complete-prompt', previewCompletePrompt);

  // Import/Export preset buttons (main header)
  $(document).off('click', '#import-preset').on('click', '#import-preset', importPreset);
  $(document).off('click', '#export-preset').on('click', '#export-preset', exportPreset);

  // Import/Export prompts buttons (prompt manager)
  $(document).off('click', '#sw-import-prompts').on('click', '#sw-import-prompts', importPromptPreset);
  $(document).off('click', '#sw-export-prompts').on('click', '#sw-export-prompts', exportPromptPreset);

  // Complete prompt preset management events
  $(document).off('click', '#sw-save-preset').on('click', '#sw-save-preset', saveCurrentPromptPreset);
  $(document).off('click', '#sw-save-as-preset').on('click', '#sw-save-as-preset', saveAsNewPreset);
  $(document)
    .off('change', '#sw-prompt-preset-selector')
    .on('change', '#sw-prompt-preset-selector', switchPromptPreset);
  $(document).off('click', '#sw-preset-menu').on('click', '#sw-preset-menu', showPresetMenu);
  $(document)
    .off('click', '#refresh-data')
    .on('click', '#refresh-data', async () => {
      const btn = $('#refresh-data');
      try {
        btn.prop('disabled', true).text('刷新中...');
        await refreshDataAndUpdateStatus();
      } finally {
        btn.prop('disabled', false).html('<span class="btn-icon">🔄</span>手动刷新数据');
      }
    });

  // Settings change handlers
  $(document)
    .off('change', '#story-type, #detail-level, #chapter-count, #context-length')
    .on('change', '#story-type, #detail-level, #chapter-count, #context-length', function () {
      const settingKey = this.id.replace(/-/g, '_');
      settings[settingKey] = this.value;
      saveSettings();
    });

  $(document)
    .off('change', '#include-summary, #include-characters, #include-themes')
    .on('change', '#include-summary, #include-characters, #include-themes', function () {
      const settingKey = this.id.replace(/-/g, '_');
      settings[settingKey] = this.checked;
      saveSettings();
    });

  // Copy, save, export buttons
  $(document)
    .off('click', '#copy-result')
    .on('click', '#copy-result', () => {
      let text = '';
      const $bubbles = $('#outline-paragraphs .paragraph-content');
      if ($bubbles.length) {
        text = $bubbles
          .toArray()
          .map(el => (el.innerText || '').trim())
          .filter(Boolean)
          .join('\n\n');
      } else {
        text = $('#output-content .generated-content').text();
      }

      if (!text) return;
      navigator.clipboard
        .writeText(text)
        .then(() => {
          showNotification('内容已复制到剪贴板', 'success');
        })
        .catch(err => {
          console.error('[Story Weaver] Copy failed:', err);
          showNotification('复制失败', 'error');
        });
    });

  // Prompt manager event handlers
  setupPromptManagerEvents();

  console.log('[Story Weaver] Event listeners setup complete');

  // 取消强制fit-content宽度，改为固定最大宽度由CSS控制
}

/**
 * Refresh and confirm data availability (worldbook, character, chat)
 */
async function refreshDataAndUpdateStatus() {
  try {
    const worldInfo = await getWorldInfoData();
    const character = getCharacterData();
    const chat = getChatContext(50);

    const hasWI = !!(worldInfo && worldInfo.trim());
    const hasChar = !!(character && character.trim());
    const hasChat = !!(chat && chat.trim());

    const status = `世界书: ${hasWI ? '已加载' : '未找到'} | 角色: ${hasChar ? '已加载' : '未找到'} | 对话: ${
      hasChat ? '有数据' : '无数据'
    }`;

    $('#context-status').html(`<span class="status-icon">${hasWI ? '✅' : 'ℹ️'}</span>${status}`);
  } catch (e) {
    $('#context-status').html(`<span class="status-icon">❌</span> 刷新失败: ${e?.message || e}`);
  }
}

/**
 * Create Story Weaver panel HTML
 */
function createStoryWeaverPanel() {
  return `
        <div id="story-weaver-panel" class="story-weaver-panel" style="display: none;">
            <!-- 面板头部 -->
            <div class="story-weaver-header" id="story-weaver-header">
                <h2 class="panel-title">
                    <span class="title-icon">📖</span>
                    Story Weaver - 故事大纲生成器
                </h2>
                <div class="header-controls">
                    <button id="minimize-story-weaver" class="minimize-btn" title="最小化为精灵球">
                        <span>⚪</span>
                    </button>
                <button id="close-story-weaver" class="close-btn" title="关闭面板">
                    <span>✕</span>
                </button>
                </div>
            </div>

            <!-- 面板内容区域 -->
            <div class="story-weaver-content">
                <!-- 剧情上下文设定区 -->
                <section class="content-section">
                    <h3 class="section-title">
                        <span class="section-icon">📖</span>
                        剧情上下文设定
                    </h3>
                    <div class="section-content">
                        <div class="form-group">
                            <label for="context-length" class="form-label"> 读取对话历史长度： </label>
                            <div class="input-with-unit">
                                <input type="number" id="context-length" value="100" min="0" max="500" class="form-input" />
                                <span class="input-unit">条消息</span>
                            </div>
                            <div class="form-help">设置为0则不读取对话历史，仅基于世界观生成</div>
                        </div>
                        <div id="context-status" class="status-display">
                            <span class="status-icon">ℹ️</span>
                            将根据设定自动读取最近的对话内容
                        </div>
                        <div class="form-group" style="margin-top:8px;">
                            <button id="refresh-data" class="preview-btn">
                                <span class="btn-icon">🔄</span>
                                手动刷新数据
                            </button>
                        </div>
                    </div>
                </section>

                <!-- 创作需求设定区 -->
                <section class="content-section">
                    <h3 class="section-title">
                        <span class="section-icon">✨</span>
                        创作需求设定
                    </h3>
                    <div class="section-content">
                        <div class="form-group">
                            <label for="story-type" class="form-label">故事类型：</label>
                            <select id="story-type" class="form-select">
                                <option value="fantasy">🏰 奇幻冒险</option>
                                <option value="romance">💖 浪漫爱情</option>
                                <option value="mystery">🔍 悬疑推理</option>
                                <option value="scifi">🚀 科幻未来</option>
                                <option value="slice-of-life">🌸 日常生活</option>
                                <option value="action">⚔️ 动作冒险</option>
                                <option value="drama">🎭 情感剧情</option>
                                <option value="horror">👻 恐怖惊悚</option>
                                <option value="comedy">😄 轻松喜剧</option>
                                <option value="custom">🎨 自定义</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="story-theme" class="form-label"> 故事主题/核心冲突： </label>
                            <textarea
                                id="story-theme"
                                class="form-textarea"
                                placeholder="例如：主角需要拯救被诅咒的王国，同时面对内心的恐惧与过去的阴霾。在这个过程中，主角将遇到值得信赖的伙伴，也会面临艰难的道德选择..."
                                rows="4"
                            ></textarea>
                            <div class="form-help">详细描述您希望故事围绕的核心主题、冲突或目标</div>
                        </div>

                        <div class="form-group">
                            <label for="story-style" class="form-label">叙事风格：</label>
                            <select id="story-style" class="form-select">
                                <option value="descriptive">📝 详细描述型</option>
                                <option value="dialogue">💬 对话推进型</option>
                                <option value="action">⚡ 快节奏动作型</option>
                                <option value="introspective">🤔 内心独白型</option>
                                <option value="episodic">📚 章节式结构</option>
                            </select>
                        </div>

                        <div class="form-row">
                            <div class="form-group flex-1">
                                <label for="chapter-count" class="form-label"> 期望章节数： </label>
                                <input type="number" id="chapter-count" value="5" min="3" max="20" class="form-input" />
                            </div>
                            <div class="form-group flex-1">
                                <label for="detail-level" class="form-label"> 大纲详细程度： </label>
                                <select id="detail-level" class="form-select">
                                    <option value="brief">简要大纲</option>
                                    <option value="detailed" selected>详细大纲</option>
                                    <option value="comprehensive">全面大纲</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="special-requirements" class="form-label"> 特殊要求（可选）： </label>
                            <textarea
                                id="special-requirements"
                                class="form-textarea"
                                placeholder="例如：需要包含特定角色的发展弧线、某些情节元素、特定的情感基调等..."
                                rows="3"
                            ></textarea>
                        </div>
                    </div>
                </section>

                <!-- 提示词管理器区 -->
                <section class="content-section">
                    <details id="prompt-manager-container">
                        <summary class="section-title prompt-summary">
                            <span class="section-icon">🧠</span>
                            提示词管理器 (Prompt Manager)
                            <span class="summary-arrow">▶</span>
                        </summary>
                        <div class="section-content">
                            <div class="form-help" style="margin-bottom: 16px;">
                                管理用于生成故事大纲的提示词。您可以启用/禁用、重新排序、编辑每个提示词部分。
                            </div>
                            
                            <!-- 提示词管理器头部 -->
                            <div class="sw-prompt-manager-header">
                                <div class="sw-prompt-manager-header-advanced">
                                    <span>提示词列表</span>
                                </div>
                                <div class="sw-prompt-manager-actions">
                                    <button id="sw-add-prompt" class="action-btn" title="添加新提示词">
                                        <span class="btn-icon">➕</span>
                                    </button>
                                    <!-- 完整预设管理 -->
                                    <div class="prompt-preset-controls">
                                        <select id="sw-prompt-preset-selector" class="preset-selector" title="选择提示词预设">
                                            <option value="">选择预设...</option>
                                        </select>
                                        <button id="sw-save-preset" class="action-btn preset-save-btn" title="保存当前预设">
                                            <span class="btn-icon">💾</span>
                                        </button>
                                        <button id="sw-save-as-preset" class="action-btn preset-save-as-btn" title="另存为新预设">
                                            <span class="btn-icon">💾+</span>
                                        </button>
                                        <button id="sw-preset-menu" class="action-btn" title="预设管理菜单">
                                            <span class="btn-icon">⚙️</span>
                                        </button>
                                    </div>
                                    <button id="sw-import-prompts" class="action-btn" title="导入提示词预设">
                                        <span class="btn-icon">📥</span>
                                    </button>
                                    <button id="sw-export-prompts" class="action-btn" title="导出提示词预设">
                                        <span class="btn-icon">📤</span>
                                    </button>
                                    <button id="sw-reset-prompts" class="action-btn" title="重置为默认">
                                        <span class="btn-icon">🔄</span>
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 提示词列表 -->
                            <ul id="sw-prompt-list" class="sw-prompt-list"></ul>
                            
                            <!-- 提示词预览 -->
                            <div class="sw-prompt-preview">
                                <button id="preview-final-prompt" class="preview-btn">
                                    <span class="btn-icon">👁️</span>
                                    预览最终提示词
                                </button>
                                <button id="open-regex-manager" class="preview-btn" title="管理仅对本插件生效的正则规则">
                                    <span class="btn-icon">🧩</span>
                                    正则规则
                                </button>
                            </div>
                        </div>
                    </details>
                </section>

                <!-- 生成控制区 -->
                <section class="content-section">
                    <div class="generate-section">
                        <button id="generate-outline" class="generate-btn">
                            <span class="btn-icon">🎭</span>
                            <span class="btn-text">生成故事大纲</span>
                            <span class="btn-loading hidden">🔄</span>
                        </button>
                        <div class="generate-options">
                            <label class="checkbox-label">
                                <input type="checkbox" id="include-summary" checked />
                                <span class="checkmark"></span>
                                包含整体摘要
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="include-characters" checked />
                                <span class="checkmark"></span>
                                包含角色发展
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="include-themes" />
                                <span class="checkmark"></span>
                                包含主题分析
                            </label>
                        </div>
                        <div class="preview-buttons">
                            <button id="preview-world-info" class="preview-btn">
                                <span class="btn-icon">📚</span>
                                预览世界书内容
                            </button>
                            <button id="preview-complete-prompt" class="preview-btn">
                                <span class="btn-icon">🔍</span>
                                预览完整提示词
                            </button>
                        </div>
                    </div>
                </section>

                <!-- 生成结果区 -->
                <section id="output-section" class="content-section">
                    <h3 class="section-title">
                        <span class="section-icon">📄</span>
                        生成结果
                        <div class="title-actions">
                            <button id="copy-result" class="action-btn" title="复制到剪贴板">
                                <span class="btn-icon">📋</span>
                            </button>
                            <button id="save-result" class="action-btn" title="保存为文件">
                                <span class="btn-icon">💾</span>
                            </button>
                            <button id="export-result" class="action-btn" title="导出为Markdown">
                                <span class="btn-icon">📤</span>
                            </button>
                        </div>
                    </h3>
                    <div class="section-content">
                        <div id="output-content" class="output-content">
                            <div class="output-placeholder">
                                <span class="placeholder-icon">📝</span>
                                <p>故事大纲将在这里显示...</p>
                                <p class="placeholder-help">填写上方信息后点击\"生成故事大纲\"开始创作</p>
                            </div>
                        </div>
                        <div id="output-stats" class="output-stats hidden">
                            <div class="stat-item">
                                <span class="stat-label">字数统计：</span>
                                <span id="word-count" class="stat-value">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">生成时间：</span>
                                <span id="generation-time" class="stat-value">--</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">章节数量：</span>
                                <span id="actual-chapters" class="stat-value">0</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
        
        <!-- 悬浮小精灵 -->
        <div id="story-weaver-sprite" class="story-weaver-sprite" title="打开Story Weaver">
            <span>📖</span>
        </div>
    `;
}

/**
 * Add Story Weaver to SillyTavern's extension menu
 */
function addExtensionUI() {
  // Add to extensions dropdown or create floating button
  const extensionsMenu = $('#extensions_menu2, #extensionsMenu, .extensions_menu');

  if (extensionsMenu.length > 0) {
    // Add to extensions menu
    const storyWeaverMenuItem = $(`
            <div id="story_weaver_button" class="list-group-item flex-container flexGap5" title="打开Story Weaver故事大纲生成器">
                <div class="fa-solid fa-book extensionsMenuExtensionButton" title="Story Weaver"></div>
                <span>Story Weaver</span>
            </div>
        `);

    extensionsMenu.append(storyWeaverMenuItem);

    // Add click handler
    storyWeaverMenuItem.on('click', showStoryWeaverPanel);
  }

  // Also add the panel HTML to body
  $('body').append(createStoryWeaverPanel());

  // Add floating sprite if no menu found
  if (extensionsMenu.length === 0) {
    $('#story-weaver-sprite').show();
    $('#story-weaver-sprite').on('click', showStoryWeaverPanel);
  }

  console.log('[Story Weaver] UI added to SillyTavern');
}

/**
 * Add a minimal drawer entry under the Extensions settings page so users can open the panel
 */
function addSettingsDrawer() {
  const container = $('#extensions_settings');
  if (container.length === 0) {
    setTimeout(addSettingsDrawer, 1000);
    return;
  }

  if ($('#story_weaver_settings_drawer').length) return;

  const settingsHtml = `
        <div id="story_weaver_settings_drawer" class="story-weaver-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>📖 Story Weaver</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="storyweaver_controls" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
                        <input id="story_weaver_open_panel" class="menu_button" type="submit" value="📖 打开 Story Weaver 面板" />
                    </div>
                </div>
            </div>
        </div>`;

  container.append(settingsHtml);
  $('#story_weaver_open_panel').off('click').on('click', showStoryWeaverPanel);
}

/**
 * Show Story Weaver panel
 */
function showStoryWeaverPanel() {
  const panel = $('#story-weaver-panel');
  if (panel.length > 0) {
    panel.show();
    console.log('[Story Weaver] Panel shown');
  }
}

/**
 * Hide Story Weaver panel
 */
function hideStoryWeaverPanel() {
  const panel = $('#story-weaver-panel');
  if (panel.length > 0) {
    panel.hide();
    console.log('[Story Weaver] Panel hidden');
  }
}

/**
 * Show world info preview
 */
async function showWorldInfoPreview() {
  try {
    console.log('[Story Weaver] Starting world info preview...');
    const combined = await getWorldInfoData();
    const before = await getWorldInfoData('before');
    const after = await getWorldInfoData('after');
    const depth = await getWorldInfoData('depth');

    // 从标记读取我们已填充的内容（包括全局）
    const mBefore = storyWeaverPrompts.get('worldInfoBefore')?.content || '';
    const mAfter = storyWeaverPrompts.get('worldInfoAfter')?.content || '';
    const mDepth = storyWeaverPrompts.get('worldInfoDepth')?.content || '';
    const mChat = storyWeaverPrompts.get('chatHistory')?.content || '';
    const mGlobal = storyWeaverPrompts.get('worldInfoGlobal')?.content || '';

    console.log('[Story Weaver] World info preview breakdown:', {
      api: {
        combined_len: combined?.length || 0,
        before_len: before?.length || 0,
        after_len: after?.length || 0,
        depth_len: depth?.length || 0,
      },
      markers: {
        before_len: mBefore.length,
        after_len: mAfter.length,
        depth_len: mDepth.length,
        chat_len: mChat.length,
        global_len: mGlobal.length,
      },
    });

    const themeInfo = getThemeInfo('body');

    const previewContent = `
            <div style="max-height: 400px; overflow-y: auto; padding: 10px; font-family: monospace; font-size: 12px; white-space: pre-wrap; background: ${
              themeInfo.bgColor
            }; border: 1px solid ${themeInfo.borderColor}; color: ${themeInfo.textColor}; font-weight: ${
      themeInfo.normalWeight
    };">
API Combined (len=${combined?.length || 0})\n----------------------------------------\n${
      combined || '(empty)'
    }\n\n=== API Before (len=${before?.length || 0}) ===\n${before || '(empty)'}\n\n=== API After (len=${
      after?.length || 0
    }) ===\n${after || '(empty)'}\n\n=== API Depth (len=${depth?.length || 0}) — distinct (deduped for preview) ===\n${
      Array.from(new Set((depth || '').split('\n\n'))).join('\n\n') || '(empty)'
    }\n\n=== MARKERS (final prompt uses these; upstream de-duplicates) ===\n[worldInfoGlobal] (len=${
      mGlobal.length
    })\n${mGlobal || '(empty)'}\n\n[worldInfoBefore] (len=${mBefore.length})\n${
      mBefore || '(empty)'
    }\n\n[worldInfoAfter] (len=${mAfter.length})\n${mAfter || '(empty)'}\n\n[chatHistory] (len=${mChat.length})\n${
      mChat || '(empty)'
    }\n\n[worldInfoDepth] (len=${mDepth.length})\n${mDepth || '(empty)'}
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: ${themeInfo.mutedColor}; font-weight: ${
      themeInfo.normalWeight
    };">
                Combined chars: ${combined?.length || 0}
            </div>
        `;

    // Create modal dialog
    const modal = $(`
            <div class="story-weaver-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; border-radius: 8px; padding: 20px; max-width: 80%; max-height: 80%; overflow: hidden; position: relative;">
                    <h3 style="margin: 0 0 15px 0;">📚 世界书内容预览</h3>
                    ${previewContent}
                    <button class="close-modal" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 20px; cursor: pointer;">✕</button>
                </div>
            </div>
        `);

    $('body').append(modal);
    modal.find('.close-modal').on('click', () => modal.remove());
    modal.on('click', e => {
      if (e.target === modal[0]) modal.remove();
    });
  } catch (error) {
    console.error('[Story Weaver] Preview failed:', error);
    showNotification('预览失败: ' + error.message, 'error');
  }
}

/**
 * Toggle panel minimize state
 */
function toggleMinimizePanel() {
  const panel = $('#story-weaver-panel');

  // Instead of minimizing the panel, hide it and show pokeball
  hideStoryWeaverPanel();
  showPokeball();

  // Show notification about the pokeball
  showNotification('故事大纲生成器已最小化为精灵球，点击精灵球可重新打开面板', 'info');
}

/**
 * Setup drag functionality for the panel
 */
function setupDragFunctionality() {
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panelStartX = 0;
  let panelStartY = 0;

  // Mouse events
  $(document)
    .off('mousedown', '#story-weaver-header')
    .on('mousedown', '#story-weaver-header', function (e) {
      if (e.target.closest('.header-controls')) return; // Don't drag when clicking buttons

      isDragging = true;
      const panel = $('#story-weaver-panel');
      const panelRect = panel[0].getBoundingClientRect();

      dragStartX = e.clientX;
      dragStartY = e.clientY;
      panelStartX = panelRect.left;
      panelStartY = panelRect.top;

      panel.addClass('dragging');
      $(document).on('mousemove.storyweaver', handleDragMove);
      $(document).on('mouseup.storyweaver', handleDragEnd);

      e.preventDefault();
    });

  function handleDragMove(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    const newX = panelStartX + deltaX;
    const newY = panelStartY + deltaY;

    const panel = $('#story-weaver-panel');
    panel.css({
      left: newX + 'px',
      top: newY + 'px',
      transform: 'none',
    });
  }

  function handleDragEnd() {
    if (!isDragging) return;

    isDragging = false;
    $('#story-weaver-panel').removeClass('dragging');
    $(document).off('mousemove.storyweaver');
    $(document).off('mouseup.storyweaver');
  }

  // Touch events for mobile
  $(document)
    .off('touchstart', '#story-weaver-header')
    .on('touchstart', '#story-weaver-header', function (e) {
      if (e.target.closest('.header-controls')) return;

      const touch = e.originalEvent.touches[0];
      isDragging = true;
      const panel = $('#story-weaver-panel');
      const panelRect = panel[0].getBoundingClientRect();

      dragStartX = touch.clientX;
      dragStartY = touch.clientY;
      panelStartX = panelRect.left;
      panelStartY = panelRect.top;

      panel.addClass('dragging');
      $(document).on('touchmove.storyweaver', handleTouchMove);
      $(document).on('touchend.storyweaver', handleTouchEnd);

      e.preventDefault();
    });

  function handleTouchMove(e) {
    if (!isDragging) return;

    const touch = e.originalEvent.touches[0];
    const deltaX = touch.clientX - dragStartX;
    const deltaY = touch.clientY - dragStartY;
    const newX = panelStartX + deltaX;
    const newY = panelStartY + deltaY;

    const panel = $('#story-weaver-panel');
    panel.css({
      left: newX + 'px',
      top: newY + 'px',
      transform: 'none',
    });
  }

  function handleTouchEnd() {
    if (!isDragging) return;

    isDragging = false;
    $('#story-weaver-panel').removeClass('dragging');
    $(document).off('touchmove.storyweaver');
    $(document).off('touchend.storyweaver');
  }
}

/**
 * Setup content editing functionality
 */
function setupContentEditing() {
  let isEditing = false;
  let autoSaveTimer = null;
  let originalContent = '';

  // Toggle edit mode
  $(document)
    .off('click', '#toggle-edit-mode')
    .on('click', '#toggle-edit-mode', function () {
      const editableContent = $('#editable-content');
      const toggleBtn = $('#toggle-edit-mode');
      const saveBtn = $('#save-content');
      const statusSpan = $('#edit-status');

      if (!isEditing) {
        // Enter edit mode
        isEditing = true;
        originalContent = editableContent.text();

        editableContent.attr('contenteditable', 'true');
        editableContent.addClass('editing-mode');

        toggleBtn.find('.btn-text').text('只读');
        toggleBtn.find('.btn-icon').text('👁️');
        toggleBtn.attr('title', '切换到只读模式');

        saveBtn.prop('disabled', false);
        statusSpan.text('编辑模式').addClass('editing');

        // Focus and setup auto-save
        editableContent.focus();
        setupAutoSave();

        showNotification('已进入编辑模式，内容将自动保存', 'info');
      } else {
        // Exit edit mode
        exitEditMode();
      }
    });

  // Save content manually
  $(document)
    .off('click', '#save-content')
    .on('click', '#save-content', function () {
      if (isEditing) {
        saveCurrentContent();
      }
    });

  function setupAutoSave() {
    const editableContent = $('#editable-content');

    // Auto-save on content change (debounced)
    editableContent.off('input.autosave').on('input.autosave', function () {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(() => {
        saveCurrentContent(true); // true for auto-save
      }, 2000); // 2 seconds delay

      // Update stats in real-time
      const currentContent = editableContent.text();
      updateContentStats(currentContent);

      // Ensure contrast is maintained during editing
      applyEditingContrast(editableContent);
    });

    // Apply contrast on focus
    editableContent.off('focus.contrast').on('focus.contrast', function () {
      applyEditingContrast($(this));
    });

    // Handle paste events to clean up formatting
    editableContent.off('paste.cleanup').on('paste.cleanup', function (e) {
      e.preventDefault();
      const text = (e.originalEvent.clipboardData || window.clipboardData).getData('text');
      document.execCommand('insertText', false, text);
    });

    // Prevent unwanted formatting
    editableContent.off('keydown.preventformat').on('keydown.preventformat', function (e) {
      // Prevent Ctrl+B, Ctrl+I, Ctrl+U etc.
      if (e.ctrlKey && (e.key === 'b' || e.key === 'i' || e.key === 'u')) {
        e.preventDefault();
      }
    });
  }

  function saveCurrentContent(isAutoSave = false) {
    const editableContent = $('#editable-content');
    const currentContent = editableContent.text();

    // Save to extension settings
    if (!settings.savedContent) {
      settings.savedContent = {};
    }

    settings.savedContent.lastGenerated = currentContent;
    settings.savedContent.lastSaved = new Date().toISOString();
    saveSettings();

    if (!isAutoSave) {
      showNotification('内容已保存', 'success');
    } else {
      // Show a subtle auto-save indicator
      const statusSpan = $('#edit-status');
      const originalText = statusSpan.text();
      statusSpan.text('已自动保存');
      setTimeout(() => {
        if (isEditing) {
          statusSpan.text('编辑模式');
        }
      }, 1000);
    }

    console.log('[Story Weaver] Content saved:', currentContent.length, 'characters');
  }

  function exitEditMode() {
    isEditing = false;
    clearTimeout(autoSaveTimer);

    const editableContent = $('#editable-content');
    const toggleBtn = $('#toggle-edit-mode');
    const saveBtn = $('#save-content');
    const statusSpan = $('#edit-status');

    editableContent.attr('contenteditable', 'false');
    editableContent.removeClass('editing-mode');
    editableContent.off('input.autosave paste.cleanup keydown.preventformat');

    toggleBtn.find('.btn-text').text('编辑');
    toggleBtn.find('.btn-icon').text('✏️');
    toggleBtn.attr('title', '编辑模式');

    saveBtn.prop('disabled', true);
    statusSpan.text('只读模式').removeClass('editing');

    // Final save before exiting
    saveCurrentContent();

    showNotification('已退出编辑模式', 'info');
  }

  /**
   * Apply appropriate contrast styles during editing
   */
  function applyEditingContrast(element) {
    try {
      const themeInfoStr = element.attr('data-theme-info');
      if (themeInfoStr) {
        const themeInfo = JSON.parse(themeInfoStr);
        element.css({
          color: themeInfo.textColor + ' !important',
          'font-weight': themeInfo.normalWeight,
        });

        // Apply styles to child elements as well
        element.find('*').css({
          color: 'inherit',
          'font-weight': 'inherit',
        });

        // Ensure strong elements have proper bold weight
        element.find('strong').css({
          color: themeInfo.boldTextColor + ' !important',
          'font-weight': themeInfo.boldWeight + ' !important',
        });

        // Ensure headings have proper styling
        element.find('h1, h2, h3, h4, h5, h6').css({
          color: themeInfo.headingColor + ' !important',
          'font-weight': themeInfo.boldWeight + ' !important',
        });
      }
    } catch (error) {
      console.warn('[Story Weaver] Failed to apply editing contrast:', error);
    }
  }
}

/**
 * Render prompt manager
 */
function renderPromptManager() {
  const promptList = $('#sw-prompt-list');
  promptList.empty();

  // Get prompts in the correct order (using storyWeaverPromptOrder, not injection_order)
  let sortedPrompts = [];

  if (storyWeaverPromptOrder && storyWeaverPromptOrder.length > 0) {
    // Use the explicitly set prompt order (from import or manual arrangement)
    console.log('[Story Weaver] Using explicit prompt order:', storyWeaverPromptOrder);
    sortedPrompts = storyWeaverPromptOrder
      .map(identifier => storyWeaverPrompts.get(identifier))
      .filter(prompt => prompt !== undefined); // Filter out any missing prompts

    // Add any prompts not in the order list at the end (fallback)
    const orderedIdentifiers = new Set(storyWeaverPromptOrder);
    const unorderedPrompts = [...storyWeaverPrompts.collection].filter(
      prompt => !orderedIdentifiers.has(prompt.identifier),
    );
    sortedPrompts.push(...unorderedPrompts);
  } else {
    // Fallback to injection_order sorting if no explicit order is set
    console.log('[Story Weaver] Fallback: Using injection_order for prompt sorting');
    sortedPrompts = [...storyWeaverPrompts.collection].sort((a, b) => a.injection_order - b.injection_order);
  }

  // Render prompts in order
  sortedPrompts.forEach((prompt, index) => {
    const isEnabled = prompt.enabled !== false;
    const promptItem = $(`
      <li class="sw-prompt-item" data-identifier="${prompt.identifier}" data-index="${index}">
        <div class="sw-prompt-toggle ${isEnabled ? 'enabled' : ''}" 
             data-identifier="${prompt.identifier}" 
             title="${isEnabled ? '禁用此提示词' : '启用此提示词'}">
        </div>
        <div class="sw-prompt-info">
          <div class="sw-prompt-name">${prompt.name}</div>
          <div class="sw-prompt-meta">
            <span class="sw-prompt-role ${prompt.role}">${prompt.role}</span>
            <span>Order: ${prompt.injection_order}</span>
            <span>Depth: ${prompt.injection_depth}</span>
            <span>Position: ${
              prompt.injection_position === INJECTION_POSITION.RELATIVE ? 'Relative' : 'Absolute'
            }</span>
          </div>
        </div>
        <div class="sw-prompt-actions">
          <button class="sw-prompt-action" data-action="edit" data-identifier="${prompt.identifier}" title="编辑">
            ✏️
          </button>
          <button class="sw-prompt-action" data-action="copy" data-identifier="${prompt.identifier}" title="复制">
            📋
          </button>
          ${
            !prompt.system_prompt
              ? `
          <button class="sw-prompt-action" data-action="delete" data-identifier="${prompt.identifier}" title="删除">
            🗑️
          </button>`
              : ''
          }
        </div>
      </li>
    `);

    promptList.append(promptItem);
  });

  // Setup sortable functionality
  setupPromptSortable();
}

/**
 * Setup sortable functionality for prompts
 */
function setupPromptSortable() {
  const promptList = $('#sw-prompt-list')[0];

  if (promptList.sortable) {
    promptList.sortable.destroy();
  }

  // Simple drag and drop implementation
  let draggedElement = null;
  let draggedIndex = null;

  $(promptList)
    .off('mousedown.sortable')
    .on('mousedown.sortable', '.sw-prompt-item', function (e) {
      if ($(e.target).closest('.sw-prompt-actions, .sw-prompt-toggle').length) return;

      draggedElement = this;
      draggedIndex = parseInt($(this).data('index'));
      $(this).addClass('dragging');

      $(document).on('mousemove.sortable', handleDragMove);
      $(document).on('mouseup.sortable', handleDragEnd);

      e.preventDefault();
    });

  function handleDragMove(e) {
    if (!draggedElement) return;

    const items = Array.from(promptList.children);
    const mouseY = e.clientY;

    let targetIndex = -1;
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      if (mouseY > rect.top && mouseY < rect.bottom) {
        targetIndex = index;
      }
    });

    if (targetIndex !== -1 && targetIndex !== draggedIndex) {
      const targetElement = items[targetIndex];
      if (mouseY < targetElement.getBoundingClientRect().top + targetElement.offsetHeight / 2) {
        promptList.insertBefore(draggedElement, targetElement);
      } else {
        promptList.insertBefore(draggedElement, targetElement.nextSibling);
      }
    }
  }

  function handleDragEnd() {
    if (!draggedElement) return;

    $(draggedElement).removeClass('dragging');

    // Update prompt order in PromptCollection
    const newOrder = Array.from(promptList.children).map((item, index) => {
      const identifier = $(item).data('identifier');
      const prompt = storyWeaverPrompts.get(identifier);
      if (prompt) {
        prompt.injection_order = index + 1; // Update injection order based on new position
      }
      return identifier;
    });

    // Update the prompt order
    storyWeaverPromptOrder = newOrder;

    // Update settings to maintain compatibility
    settings.prompts = getStoryWeaverPrompts().map(p => ({ ...p }));
    settings.promptOrder = newOrder.map((identifier, index) => ({
      identifier,
      enabled: storyWeaverPrompts.get(identifier)?.enabled !== false,
    }));

    saveSettings();
    renderPromptManager();

    draggedElement = null;
    draggedIndex = null;

    $(document).off('mousemove.sortable mouseup.sortable');

    showNotification('提示词顺序已更新', 'success');
  }
}

/**
 * Setup prompt manager event handlers
 */
function setupPromptManagerEvents() {
  // Toggle prompt enabled/disabled
  $(document)
    .off('click', '.sw-prompt-toggle')
    .on('click', '.sw-prompt-toggle', function (e) {
      e.stopPropagation();
      const identifier = $(this).data('identifier');
      const prompt = storyWeaverPrompts.get(identifier);

      if (prompt) {
        // Toggle enabled state using new integration function
        const newEnabledState = !prompt.enabled;
        const success = toggleStoryWeaverPrompt(identifier, newEnabledState);

        if (success) {
          // Update settings for compatibility
          settings.prompts = getStoryWeaverPrompts().map(p => ({ ...p }));
          const orderIndex = settings.promptOrder.findIndex(o => o.identifier === identifier);
          if (orderIndex !== -1) {
            settings.promptOrder[orderIndex].enabled = prompt.enabled;
          }

          showNotification(prompt.enabled ? '提示词已启用' : '提示词已禁用', 'info');
        }
      }
    });

  // Prompt actions
  $(document)
    .off('click', '.sw-prompt-action')
    .on('click', '.sw-prompt-action', function (e) {
      e.stopPropagation();
      const action = $(this).data('action');
      const identifier = $(this).data('identifier');

      switch (action) {
        case 'edit':
          showPromptEditor(identifier);
          break;
        case 'copy':
          copyPromptToClipboard(identifier);
          break;
        case 'delete':
          deletePrompt(identifier);
          break;
      }
    });

  // Reset prompts to default
  $(document)
    .off('click', '#sw-reset-prompts')
    .on('click', '#sw-reset-prompts', function () {
      if (confirm('确定要重置所有提示词为默认设置吗？此操作不可撤销。')) {
        // Reset to default Story Weaver prompts
        storyWeaverPrompts = new PromptCollection();
        storyWeaverPromptOrder = [];
        storyWeaverDefaultPrompts.prompts.forEach(promptData => {
          addPromptToStoryWeaver(promptData);
        });

        // Update settings for compatibility
        settings.prompts = getStoryWeaverPrompts().map(p => ({ ...p }));
        settings.promptOrder = getStoryWeaverPromptOrder().map(identifier => ({
          identifier,
          enabled: storyWeaverPrompts.get(identifier)?.enabled !== false,
        }));

        saveSettings();
        renderPromptManager();
        showNotification('提示词已重置为默认设置', 'success');
      }
    });

  // Add new prompt
  $(document)
    .off('click', '#sw-add-prompt')
    .on('click', '#sw-add-prompt', function () {
      showPromptEditor('new');
    });

  // Preview final prompt
  $(document).off('click', '#preview-final-prompt').on('click', '#preview-final-prompt', previewFinalPrompt);
}

/**
 * Show prompt editor modal
 */
function showPromptEditor(identifier) {
  let prompt = null;
  let isNew = false;

  if (identifier === 'new') {
    isNew = true;
    prompt = {
      identifier: `sw_custom_${Date.now()}`,
      name: '新建提示词',
      role: 'user',
      content: '',
      system_prompt: false,
      position: 'custom',
      injection_position: 0,
      injection_depth: 0,
      injection_order: 100,
      forbid_overrides: false,
    };
  } else {
    prompt = storyWeaverPrompts.get(identifier);
    if (!prompt) {
      showNotification('找不到指定的提示词', 'error');
      return;
    }
    // Create a copy for editing
    prompt = { ...prompt };
  }

  // Get dynamic theme information
  const themeInfo = getThemeInfo('body');

  const modal = $(`
    <div class="sw-prompt-editor-modal sw-themed-modal">
      <div class="sw-prompt-editor-content sw-themed-content" 
           style="background: ${themeInfo.modalBg}; border: 1px solid ${themeInfo.borderColor}; color: ${
    themeInfo.textColor
  };">
        <div class="sw-prompt-editor-header sw-themed-header" 
             style="background: ${themeInfo.headerBg}; border-bottom: 1px solid ${themeInfo.borderColor};">
          <h3 class="sw-prompt-editor-title" 
              style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">
            ${isNew ? '✨ 新建提示词' : '✏️ 编辑提示词'}
          </h3>
          <button class="close-btn sw-themed-close-btn" id="close-prompt-editor" title="关闭"
                  style="color: ${themeInfo.textColor};">
            <span>✕</span>
          </button>
        </div>
        <div class="sw-prompt-editor-body sw-themed-body">
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="prompt-editor-name" class="form-label sw-themed-label" 
                     style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">名称</label>
              <input type="text" id="prompt-editor-name" class="form-input sw-themed-input" 
                     value="${prompt.name}"
                     style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor}; color: ${
    themeInfo.textColor
  };" />
            </div>
            <div class="form-group flex-1">
              <label for="prompt-editor-role" class="form-label sw-themed-label"
                     style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">角色</label>
              <select id="prompt-editor-role" class="form-select sw-themed-select"
                      style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor}; color: ${
    themeInfo.textColor
  };">
                <option value="system" ${prompt.role === 'system' ? 'selected' : ''}>System</option>
                <option value="user" ${prompt.role === 'user' ? 'selected' : ''}>User</option>
                <option value="assistant" ${prompt.role === 'assistant' ? 'selected' : ''}>Assistant</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group flex-1">
              <label for="prompt-editor-injection-position" class="form-label sw-themed-label"
                     style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">位置模式</label>
              <select id="prompt-editor-injection-position" class="form-select sw-themed-select"
                      style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor}; color: ${
    themeInfo.textColor
  };">
                <option value="0" ${prompt.injection_position === 0 ? 'selected' : ''}>相对位置</option>
                <option value="1" ${prompt.injection_position === 1 ? 'selected' : ''}>绝对深度</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label for="prompt-editor-injection-depth" class="form-label sw-themed-label"
                     style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">深度</label>
              <input type="number" id="prompt-editor-injection-depth" class="form-input sw-themed-input" 
                     value="${prompt.injection_depth}" min="0" max="9999"
                     style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor}; color: ${
    themeInfo.textColor
  };" />
            </div>
            <div class="form-group flex-1">
              <label for="prompt-editor-injection-order" class="form-label sw-themed-label"
                     style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">顺序</label>
              <input type="number" id="prompt-editor-injection-order" class="form-input sw-themed-input" 
                     value="${prompt.injection_order}" min="0" max="9999"
                     style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor}; color: ${
    themeInfo.textColor
  };" />
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label sw-themed-checkbox-label" 
                   style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">
              <input type="checkbox" id="prompt-editor-forbid-overrides" ${prompt.forbid_overrides ? 'checked' : ''} 
                     class="sw-themed-checkbox" />
              <span class="checkmark sw-themed-checkmark" 
                    style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor};"></span>
              禁止覆盖
            </label>
          </div>
          
          <div class="form-group">
            <label for="prompt-editor-content" class="form-label sw-themed-label"
                   style="color: ${themeInfo.textColor}; font-weight: ${themeInfo.boldWeight};">内容</label>
            <textarea id="prompt-editor-content" class="form-textarea sw-themed-textarea" rows="10" 
                      placeholder="输入提示词内容..."
                      style="background: ${themeInfo.inputBg}; border: 1px solid ${themeInfo.borderColor}; color: ${
    themeInfo.textColor
  };">${prompt.content}</textarea>
            <div class="form-help sw-themed-help" 
                 style="color: ${themeInfo.mutedColor}; font-size: 12px;">
              💡 可以使用占位符：{worldbook}, {character}, {chat_context}, {requirements} 等
            </div>
          </div>
        </div>
        <div class="sw-prompt-editor-footer sw-themed-footer" 
             style="background: ${themeInfo.headerBg}; border-top: 1px solid ${themeInfo.borderColor};">
          <button class="secondary-btn sw-themed-secondary-btn" id="cancel-prompt-edit"
                  style="background: ${themeInfo.secondaryBtnBg}; border: 1px solid ${themeInfo.borderColor}; color: ${
    themeInfo.textColor
  };">
            取消
          </button>
          <button class="primary-btn sw-themed-primary-btn" id="save-prompt-edit"
                  style="background: ${themeInfo.primaryBtnBg}; border: 1px solid ${
    themeInfo.primaryBtnBorder
  }; color: ${themeInfo.primaryBtnColor}; font-weight: ${themeInfo.boldWeight};">
            💾 保存
          </button>
        </div>
      </div>
    </div>
  `);

  $('body').append(modal);

  // Enhanced event handlers with animations
  modal.find('#close-prompt-editor, #cancel-prompt-edit').on('click', () => {
    modal.addClass('closing');
    setTimeout(() => modal.remove(), 200);
  });

  modal.find('#save-prompt-edit').on('click', () => {
    const updatedPrompt = {
      identifier: prompt.identifier,
      name: $('#prompt-editor-name').val(),
      role: $('#prompt-editor-role').val(),
      content: $('#prompt-editor-content').val(),
      system_prompt: prompt.system_prompt,
      position: prompt.position,
      injection_position: parseInt($('#prompt-editor-injection-position').val()),
      injection_depth: parseInt($('#prompt-editor-injection-depth').val()),
      injection_order: parseInt($('#prompt-editor-injection-order').val()),
      forbid_overrides: $('#prompt-editor-forbid-overrides').is(':checked'),
    };

    if (isNew) {
      addPromptToStoryWeaver(updatedPrompt);
    } else {
      // Update existing prompt in PromptCollection
      const existingPrompt = storyWeaverPrompts.get(prompt.identifier);
      if (existingPrompt) {
        Object.assign(existingPrompt, updatedPrompt);
      }
    }

    // Update settings for compatibility
    settings.prompts = getStoryWeaverPrompts().map(p => ({ ...p }));
    settings.promptOrder = getStoryWeaverPromptOrder().map(identifier => ({
      identifier,
      enabled: storyWeaverPrompts.get(identifier)?.enabled !== false,
    }));

    saveSettings();
    renderPromptManager();
    modal.remove();
    showNotification(isNew ? '提示词已添加' : '提示词已更新', 'success');
  });

  // Close on backdrop click
  modal.on('click', function (e) {
    if (e.target === this) {
      modal.remove();
    }
  });
}

/**
 * Copy prompt content to clipboard
 */
function copyPromptToClipboard(identifier) {
  const prompt = storyWeaverPrompts.get(identifier);
  if (!prompt) return;

  navigator.clipboard
    .writeText(prompt.content)
    .then(() => {
      showNotification('提示词内容已复制到剪贴板', 'success');
    })
    .catch(err => {
      console.error('[Story Weaver] Copy failed:', err);
      showNotification('复制失败', 'error');
    });
}

/**
 * Delete prompt
 */
function deletePrompt(identifier) {
  const prompt = storyWeaverPrompts.get(identifier);
  if (!prompt || prompt.system_prompt) return;

  if (confirm(`确定要删除提示词"${prompt.name}"吗？`)) {
    // Remove from PromptCollection using helper
    removePromptFromStoryWeaver(identifier);

    // Update settings for compatibility
    settings.prompts = getStoryWeaverPrompts().map(p => ({ ...p }));
    settings.promptOrder = getStoryWeaverPromptOrder().map(identifier => ({
      identifier,
      enabled: storyWeaverPrompts.get(identifier)?.enabled !== false,
    }));

    saveSettings();
    renderPromptManager();
    showNotification('提示词已删除', 'success');
  }
}

/**
 * Preview final assembled prompt
 */
async function previewFinalPrompt() {
  try {
    // Process world info markers first
    const worldInfoResult = await processWorldInfoMarkers();

    const characterData = getCharacterData();
    const contextLength = parseInt($('#context-length').val()) || 0;
    const chatContext = getChatContext(contextLength);
    const requirementsText = buildRequirementsText();

    // Build final prompt from enabled prompts
    let finalPrompt = '';

    // Get all prompts in the correct order (using storyWeaverPromptOrder, not injection_order)
    let allPrompts = [];

    if (storyWeaverPromptOrder && storyWeaverPromptOrder.length > 0) {
      // Use the explicitly set prompt order (from import or manual arrangement)
      allPrompts = storyWeaverPromptOrder
        .map(identifier => storyWeaverPrompts.get(identifier))
        .filter(prompt => prompt !== undefined); // Filter out any missing prompts

      // Add any prompts not in the order list at the end (fallback)
      const orderedIdentifiers = new Set(storyWeaverPromptOrder);
      const unorderedPrompts = [...storyWeaverPrompts.collection].filter(
        prompt => !orderedIdentifiers.has(prompt.identifier),
      );
      allPrompts.push(...unorderedPrompts);
    } else {
      // Fallback to injection_order sorting if no explicit order is set
      allPrompts = [...storyWeaverPrompts.collection].sort((a, b) => a.injection_order - b.injection_order);
    }

    // Separate enabled and disabled prompts
    const enabledPrompts = allPrompts.filter(prompt => prompt.enabled !== false);
    const disabledPrompts = allPrompts.filter(prompt => prompt.enabled === false);

    // Build enabled prompts content
    enabledPrompts.forEach(prompt => {
      // Ensure all required properties exist
      if (!prompt || !prompt.content) {
        console.warn('[Story Weaver] Skipping prompt with missing content:', prompt);
        return;
      }

      let content = (prompt.content || '')
        .replace(/{character}/g, characterData || '无')
        .replace(/{chat_context}/g, chatContext || '无')
        .replace(/{requirements}/g, requirementsText || '无');

      // Use SillyTavern's substituteParams for proper {{user}} replacement
      if (typeof substituteParams === 'function') {
        content = substituteParams(content);
      } else {
        // Fallback manual replacement
        content = content
          .replace(/\{\{user\}\}/g, getUserName())
          .replace(/<user>/g, getUserName())
          .replace(/<\/user>/g, '');
      }

      const role = (prompt.role || 'system').toUpperCase();
      const name = prompt.name || '未命名提示词';

      finalPrompt += `[${role}] ${name}:\n${content}\n\n`;
    });

    // Build status summary
    let statusSummary = `启用的提示词: ${enabledPrompts.length}`;
    if (disabledPrompts.length > 0) {
      statusSummary += ` | 禁用的提示词: ${disabledPrompts.length} (${disabledPrompts.map(p => p.name).join(', ')})`;
    }

    const themeInfo = getThemeInfo('body');

    const previewContent = `
      <div style="margin-bottom: 12px; font-size: 12px; color: ${themeInfo.textColor}; font-weight: ${
      themeInfo.normalWeight
    };">
        ${statusSummary}
      </div>
      <pre style="max-height: 500px; overflow-y: auto; padding: 16px; font-family: monospace; font-size: 12px; white-space: pre-wrap; background: ${
        themeInfo.bgColor
      }; border: 1px solid ${themeInfo.borderColor}; border-radius: var(--sw-border-radius); color: ${
      themeInfo.textColor
    }; font-weight: ${themeInfo.normalWeight}; margin: 0;">${escapeHtml(finalPrompt)}</pre>
      <div style="margin-top: 12px; font-size: 11px; color: ${themeInfo.mutedColor}; font-weight: ${
      themeInfo.normalWeight
    };">
        总字符数: ${finalPrompt.length}
      </div>
    `;

    const modal = $(`
      <div class="story-weaver-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: var(--sw-bg-primary); border-radius: var(--sw-border-radius-large); padding: 24px; max-width: 90%; max-height: 90%; overflow: hidden; position: relative;">
          <h3 style="margin: 0 0 16px 0; color: var(--sw-text-primary);">📋 最终提示词预览</h3>
          ${previewContent}
          <button class="close-modal" style="position: absolute; top: 16px; right: 20px; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--sw-text-secondary);">✕</button>
        </div>
      </div>
    `);

    $('body').append(modal);
    modal.find('.close-modal').on('click', () => modal.remove());
    modal.on('click', e => {
      if (e.target === modal[0]) modal.remove();
    });
  } catch (error) {
    console.error('[Story Weaver] Preview failed:', error);
    showNotification('预览失败: ' + error.message, 'error');
  }
}

/**
 * Preview complete prompt (final prompt + world info content)
 */
async function previewCompletePrompt() {
  try {
    // Process world info markers first
    const worldInfoResult = await processWorldInfoMarkers();

    const characterData = getCharacterData();
    const contextLength = parseInt($('#context-length').val()) || 0;
    const chatContext = getChatContext(contextLength);
    const requirementsText = buildRequirementsText();

    // Build final prompt from enabled prompts
    let finalPrompt = '';

    // Get all prompts in the correct order (using storyWeaverPromptOrder, not injection_order)
    let allPrompts = [];

    if (storyWeaverPromptOrder && storyWeaverPromptOrder.length > 0) {
      // Use the explicitly set prompt order (from import or manual arrangement)
      allPrompts = storyWeaverPromptOrder
        .map(identifier => storyWeaverPrompts.get(identifier))
        .filter(prompt => prompt !== undefined); // Filter out any missing prompts

      // Add any prompts not in the order list at the end (fallback)
      const orderedIdentifiers = new Set(storyWeaverPromptOrder);
      const unorderedPrompts = [...storyWeaverPrompts.collection].filter(
        prompt => !orderedIdentifiers.has(prompt.identifier),
      );
      allPrompts.push(...unorderedPrompts);
    } else {
      // Fallback to injection_order sorting if no explicit order is set
      allPrompts = [...storyWeaverPrompts.collection].sort((a, b) => a.injection_order - b.injection_order);
    }

    // Separate enabled and disabled prompts
    const enabledPrompts = allPrompts.filter(prompt => prompt.enabled !== false);
    const disabledPrompts = allPrompts.filter(prompt => prompt.enabled === false);

    // Build enabled prompts content using the same processing as actual sending
    for (const prompt of enabledPrompts) {
      if (!prompt || !prompt.content) {
        console.warn('[Story Weaver] Skipping prompt with missing content:', prompt);
        continue;
      }

      try {
        // Use the same content processing as actual sending
        const processedContent = await processStoryWeaverPromptContent(prompt);

        if (!processedContent.trim()) {
          console.warn('[Story Weaver] Skipping empty processed prompt:', prompt.name);
          continue;
        }

        const role = (prompt.role || 'system').toUpperCase();
        const name = prompt.name || '未命名提示词';

        // Show exactly what would be sent to AI
        finalPrompt += `[${role}] ${name} (Extension Prompt: story_weaver_${prompt.identifier}):\n${processedContent}\n\n`;
      } catch (error) {
        console.error('[Story Weaver] Error processing prompt for preview:', prompt.identifier, error);
        finalPrompt += `[ERROR] ${prompt.name}: Failed to process content\n\n`;
      }
    }

    // World info is now included in markers, no need to add separately
    let completePrompt = finalPrompt;

    // Add debug info about registered extension prompts
    const registeredExtensionPrompts = Object.keys(extension_prompts).filter(key => key.startsWith('story_weaver_'));
    completePrompt += `\n=== EXTENSION PROMPT DEBUG INFO ===\n`;
    completePrompt += `Registered extension prompts: ${registeredExtensionPrompts.length}\n`;
    registeredExtensionPrompts.forEach(key => {
      const prompt = extension_prompts[key];
      completePrompt += `- ${key}: position=${prompt.position}, role=${prompt.role}, depth=${
        prompt.depth
      }, content length=${prompt.value?.length || 0}\n`;
    });
    completePrompt += `=======================================\n\n`;

    // Build status summary
    let statusSummary = `启用的提示词: ${enabledPrompts.length} | 已注册到SillyTavern: ${registeredExtensionPrompts.length}`;
    if (disabledPrompts.length > 0) {
      statusSummary += ` | 禁用的提示词: ${disabledPrompts.length} (${disabledPrompts.map(p => p.name).join(', ')})`;
    }
    // Check if world info markers have content
    const beforeMarker = storyWeaverPrompts.get('worldInfoBefore');
    const afterMarker = storyWeaverPrompts.get('worldInfoAfter');
    const depthMarker = storyWeaverPrompts.get('worldInfoDepth');
    const chatHistoryMarker = storyWeaverPrompts.get('chatHistory');
    const hasWorldInfo =
      (beforeMarker?.content && beforeMarker.content.trim()) ||
      (afterMarker?.content && afterMarker.content.trim()) ||
      (depthMarker?.content && depthMarker.content.trim()) ||
      (chatHistoryMarker?.content && chatHistoryMarker.content.trim());
    statusSummary += ` | 包含世界书内容: ${hasWorldInfo ? '是' : '否'}`;
    const themeInfo = getThemeInfo('body');

    const previewContent = `
      <div style="margin-bottom: 12px; font-size: 12px; color: ${themeInfo.textColor}; font-weight: ${
      themeInfo.normalWeight
    };">
        ${statusSummary}
            </div>
      <pre style="max-height: 500px; overflow-y: auto; padding: 16px; font-family: monospace; font-size: 12px; white-space: pre-wrap; background: ${
        themeInfo.bgColor
      }; border: 1px solid ${themeInfo.borderColor}; border-radius: var(--sw-border-radius); color: ${
      themeInfo.textColor
    }; font-weight: ${themeInfo.normalWeight}; margin: 0;">${escapeHtml(completePrompt)}</pre>
      <div style="margin-top: 12px; font-size: 11px; color: ${themeInfo.mutedColor}; font-weight: ${
      themeInfo.normalWeight
    };">
        总字符数: ${completePrompt.length} | 最终提示词: ${finalPrompt.length} | 世界书内容: ${
      (beforeMarker?.content?.length || 0) +
      (afterMarker?.content?.length || 0) +
      (depthMarker?.content?.length || 0) +
      (chatHistoryMarker?.content?.length || 0)
    }
            </div>
        `;

    const modal = $(`
      <div class="story-weaver-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center;">
        <div style="background: var(--sw-bg-primary); border-radius: var(--sw-border-radius-large); padding: 24px; max-width: 90%; max-height: 90%; overflow: hidden; position: relative;">
          <h3 style="margin: 0 0 16px 0; color: var(--sw-text-primary);">🔍 完整提示词预览 (包含世界书)</h3>
                    ${previewContent}
          <button class="close-modal" style="position: absolute; top: 16px; right: 20px; background: none; border: none; font-size: 20px; cursor: pointer; color: var(--sw-text-secondary);">✕</button>
                </div>
            </div>
        `);

    $('body').append(modal);
    modal.find('.close-modal').on('click', () => modal.remove());
    modal.on('click', e => {
      if (e.target === modal[0]) modal.remove();
    });
  } catch (error) {
    console.error('[Story Weaver] Complete prompt preview failed:', error);
    showNotification('完整提示词预览失败: ' + error.message, 'error');
  }
}

/**
 * Test various preset formats
 */
function testVariousPresetFormats() {
  console.log('[Story Weaver] Testing various preset formats...');

  // Test different preset formats
  const testPresets = [
    // SillyTavern Instruct preset
    {
      name: 'Test Instruct',
      input_sequence: '### Input:',
      output_sequence: '### Response:',
      system_sequence: '### System:',
      wrap: true,
      macro: false,
    },

    // SillyTavern Context preset
    {
      name: 'Test Context',
      story_string: 'This is a story context template.',
      chat_start: 'The conversation begins:',
      example_separator: '***',
    },

    // System Prompt preset
    {
      name: 'Test System Prompt',
      content: 'You are a helpful assistant.',
    },

    // Generic preset
    {
      name: 'Generic Test',
      text: 'Some generic content',
      setting1: 'value1',
      setting2: 42,
    },
  ];

  testPresets.forEach((preset, index) => {
    console.log(`[Story Weaver] Testing preset ${index + 1}:`, preset);

    const validation = validatePromptPreset(preset);
    console.log(`[Story Weaver] Validation result:`, validation);

    if (validation.success) {
      const converted = convertPresetToStoryWeaverFormat(preset, validation.detectedType);
      console.log(`[Story Weaver] Converted prompts:`, converted);
    }
  });

  console.log('[Story Weaver] ✅ Preset format testing completed');
}

/**
 * Test prompt preset import/export functionality
 */
function testPromptPresetSystem() {
  console.log('[Story Weaver] Testing prompt preset system...');

  try {
    // Test prompt preset creation
    const testPromptPreset = {
      version: PRESET_VERSION,
      type: 'story_weaver_prompts',
      name: 'Test Prompt Preset',
      description: 'Test prompt preset for validation',
      timestamp: Date.now(),
      prompts: getStoryWeaverPrompts().map(p => ({ ...p })),
      prompt_order: [...getStoryWeaverPromptOrder()],
      metadata: {
        created: new Date().toISOString(),
        creator: 'Story Weaver Extension - Test',
        version: PRESET_VERSION,
        type: 'prompts_only',
      },
    };
    console.log('[Story Weaver] Test prompt preset created:', testPromptPreset);

    // Test prompt preset validation
    const validation = validatePromptPreset(testPromptPreset);
    console.log('[Story Weaver] Test prompt preset validation:', validation);

    if (validation.success) {
      console.log('[Story Weaver] ✅ Prompt preset system test passed');
    } else {
      console.error('[Story Weaver] ❌ Prompt preset system test failed:', validation.errors);
    }

    return validation.success;
  } catch (error) {
    console.error('[Story Weaver] ❌ Prompt preset system test error:', error);
    return false;
  }
}

/**
 * Test preset import/export functionality
 */
function testPresetSystem() {
  console.log('[Story Weaver] Testing preset system...');

  try {
    // Test preset creation
    const testPreset = createPresetFromSettings();
    console.log('[Story Weaver] Test preset created:', testPreset);

    // Test preset validation
    const validation = validatePreset(testPreset);
    console.log('[Story Weaver] Test preset validation:', validation);

    if (validation.success) {
      console.log('[Story Weaver] ✅ Preset system test passed');
    } else {
      console.error('[Story Weaver] ❌ Preset system test failed:', validation.errors);
    }

    return validation.success;
  } catch (error) {
    console.error('[Story Weaver] ❌ Preset system test error:', error);
    return false;
  }
}

/**
 * ===== 段落系统功能 =====
 */

// 段落数据存储
let outlineParagraphs = [];

/**
 * 格式化段落内容，优化显示效果
 */
function formatParagraphContent(content) {
  if (!content || typeof content !== 'string') {
    return '<p class="empty-paragraph">内容为空</p>';
  }

  // 清理内容，移除多余空白
  let cleanContent = content.trim();

  // 处理标题（# ## ### 或数字标题）
  cleanContent = cleanContent.replace(/^(#{1,6}\s*(.+))$/gm, (match, fullTitle, title) => {
    const level = (match.match(/#/g) || []).length;
    return `<h${Math.min(level + 2, 6)} class="paragraph-title">${title.trim()}</h${Math.min(level + 2, 6)}>`;
  });

  // 处理章节标题
  cleanContent = cleanContent.replace(
    /^(第[一二三四五六七八九十百千\d]+章[：:\s]*(.*))/gm,
    '<h3 class="chapter-title">$1</h3>',
  );

  // 处理英文章节标题
  cleanContent = cleanContent.replace(/^(Chapter\s+\d+[：:\s]*(.*))/gim, '<h3 class="chapter-title">$1</h3>');

  // 处理列表项
  cleanContent = cleanContent.replace(/^[\s]*[-*+•]\s*(.+)$/gm, '<li class="outline-item">$1</li>');

  // 处理数字列表
  cleanContent = cleanContent.replace(/^[\s]*\d+[.、]\s*(.+)$/gm, '<li class="numbered-item">$1</li>');

  // 处理强调文本
  cleanContent = cleanContent.replace(/\*\*(.+?)\*\*/g, '<strong class="emphasis">$1</strong>');

  // 处理斜体
  cleanContent = cleanContent.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

  // 特殊处理：确保标题后有换行符分隔
  cleanContent = cleanContent.replace(/(<\/h[3-6]>)([^\n])/g, '$1\n\n$2');

  // 先处理多余的换行符，然后分割段落
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n'); // 将多个换行符压缩为两个
  const paragraphs = cleanContent.split(/\n\s*\n/);

  let formattedParagraphs = paragraphs
    .map(para => {
      para = para.trim();
      if (!para) return '';

      // 如果已经是HTML标签，直接返回
      if (para.startsWith('<h') || para.startsWith('<li')) {
        return para;
      }

      // 处理包含标题和内容的混合段落
      if (para.includes('<h3') || para.includes('<h4') || para.includes('<h5') || para.includes('<h6')) {
        // 分离标题和内容
        const titleMatch = para.match(/^(<h[3-6][^>]*>.*?<\/h[3-6]>)(.*)$/s);
        if (titleMatch) {
          const [, title, content] = titleMatch;
          const formattedContent = content.trim()
            ? `<p class="paragraph-text">${content.trim().replace(/\n/g, '<br>')}</p>`
            : '';
          return title + (formattedContent ? '\n' + formattedContent : '');
        }
        return para;
      }

      // 处理包含列表项的段落
      if (para.includes('<li')) {
        const lines = para.split('\n');
        let result = '';
        let inList = false;
        let listType = '';

        for (const line of lines) {
          if (line.includes('<li class="outline-item">')) {
            if (!inList) {
              result += '<ul class="outline-list">';
              inList = true;
              listType = 'ul';
            }
            result += line;
          } else if (line.includes('<li class="numbered-item">')) {
            if (!inList || listType !== 'ol') {
              if (inList) result += `</${listType}>`;
              result += '<ol class="numbered-list">';
              inList = true;
              listType = 'ol';
            }
            result += line;
          } else {
            if (inList) {
              result += `</${listType}>`;
              inList = false;
            }
            if (line.trim()) {
              result += `<p class="paragraph-text">${line.replace(/\n/g, '<br>')}</p>`;
            }
          }
        }

        if (inList) {
          result += `</${listType}>`;
        }

        return result;
      }

      // 普通段落处理
      return `<p class="paragraph-text">${para.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(p => p);

  // 如果没有格式化的内容，返回原始内容
  if (formattedParagraphs.length === 0) {
    return `<p class="paragraph-text">${$('<div/>').text(content).html().replace(/\n/g, '<br>')}</p>`;
  }

  // 用换行符连接段落，确保标题和内容间有适当分隔
  return formattedParagraphs.join('\n');
}

/**
 * 解析生成的大纲内容为段落
 */
function parseOutlineIntoParagraphs(content) {
  if (!content || typeof content !== 'string') {
    console.warn('[Story Weaver] Invalid content for paragraph parsing:', content);
    return [];
  }

  // 优先按章节标题分割（第一章/第二章...、第1章、第十章、Chapter 1/2/.../One）
  // 若未匹配到章节，则回退为按空行分割
  const chapterRegex =
    /(^|\n)(\s*(第[一二三四五六七八九十百千0-9]+章|Chapter\s+\d+|Chapter\s+[A-Za-z]+|CHAPTER\s+\d+|CHAPTER\s+[A-Za-z]+)\b[\s\S]*?)(?=(\n\s*(第[一二三四五六七八九十百千0-9]+章|Chapter\s+\d+|Chapter\s+[A-Za-z]+|CHAPTER\s+\d+|CHAPTER\s+[A-Za-z]+)\b)|$)/g;

  let chunks = [];
  let match;
  while ((match = chapterRegex.exec(content)) !== null) {
    const block = (match[2] || '').trim();
    if (block) chunks.push(block);
  }

  if (chunks.length === 0) {
    chunks = content.split(/\n\s*\n/);
  }

  const paragraphs = chunks
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0) // 过滤空段落
    .map((paragraph, index) => ({
      id: `paragraph_${Date.now()}_${index}`,
      order: index + 1,
      content: paragraph,
      wordCount: paragraph.length,
      createdAt: new Date().toISOString(),
    }));

  console.log('[Story Weaver] Parsed outline into', paragraphs.length, 'paragraphs');
  return paragraphs;
}

/**
 * 渲染段落到UI
 */
function renderOutlineParagraphs() {
  const outputContent = $('#output-content');
  const placeholder = outputContent.find('.output-placeholder');

  // 如果没有段落容器，创建一个
  let container = outputContent.find('#outline-paragraphs');
  if (container.length === 0) {
    container = $('<div id="outline-paragraphs" class="outline-paragraphs"></div>');
    outputContent.append(container);
  }

  if (!outlineParagraphs || outlineParagraphs.length === 0) {
    // 如果没有段落，显示完整内容作为备选方案
    console.log('[Story Weaver] No paragraphs found, falling back to full content display');
    container.addClass('hidden empty');
    placeholder.removeClass('hidden');
    return;
  }

  placeholder.addClass('hidden');
  container.removeClass('hidden empty');
  container.empty();

  // 首先添加批量管理工具栏
  if (outlineParagraphs.length > 1) {
    const batchToolbar = $(`
      <div class="batch-management-toolbar">
        <div class="batch-selection-controls">
          <label class="batch-checkbox">
            <input type="checkbox" id="select-all-paragraphs">
            <span>全选</span>
          </label>
          <span class="selected-count">已选择: <span id="selected-paragraph-count">0</span> 个段落</span>
        </div>
        <div class="batch-actions">
          <button id="batch-copy" class="batch-action-btn" title="复制选中段落" disabled>
            <span class="btn-icon">📋</span>
            复制选中
          </button>
          <button id="batch-delete" class="batch-action-btn danger" title="删除选中段落" disabled>
            <span class="btn-icon">🗑️</span>
            删除选中
          </button>
          <button id="batch-merge" class="batch-action-btn" title="合并选中段落" disabled>
            <span class="btn-icon">🔗</span>
            合并
          </button>
        </div>
      </div>
    `);
    container.append(batchToolbar);
  }

  outlineParagraphs.forEach((paragraph, index) => {
    const paragraphElement = $(`
      <div class="outline-paragraph" data-paragraph-id="${paragraph.id}" data-order="${paragraph.order}">
        <div class="paragraph-selection">
          <input type="checkbox" class="paragraph-checkbox" data-paragraph-id="${paragraph.id}">
        </div>
        
        <div class="paragraph-number">${paragraph.order}</div>
        
        <div class="paragraph-main">
          <div class="paragraph-drag-handle">⋮⋮</div>
          
          <div class="paragraph-content" contenteditable="false" data-paragraph-id="${paragraph.id}"></div>
          
          <div class="paragraph-actions">
            <button class="paragraph-action" data-action="duplicate" title="复制段落">📋</button>
            <button class="paragraph-action" data-action="generate-details" title="生成细纲">📝</button>
            <button class="paragraph-action" data-action="delete" title="删除段落">🗑️</button>
          </div>
          
          <div class="paragraph-stats">
            <span class="word-count">${paragraph.wordCount}</span> 字符
          </div>
        </div>
      </div>`);

    container.append(paragraphElement);

    // 优化段落内容格式化，提供更好的阅读体验
    const $content = paragraphElement.find('.paragraph-content');
    const formattedContent = formatParagraphContent(paragraph.content);
    $content.html(formattedContent);
  });

  // 设置拖拽功能
  setupParagraphDragging();

  // 设置编辑功能
  setupParagraphEditing();

  // 设置批量管理功能
  setupBatchManagement();

  // 更新统计
  updateOutlineStats();
}

/**
 * 设置段落拖拽功能
 */
function setupParagraphDragging() {
  const container = $('#outline-paragraphs')[0];
  let draggedElement = null;
  let draggedIndex = -1;

  // 处理拖拽开始
  $(container)
    .off('mousedown.paragraphs')
    .on('mousedown.paragraphs', '.outline-paragraph', function (e) {
      // 如果点击的是编辑区域，不启动拖拽
      if ($(e.target).hasClass('paragraph-content')) return;
      if ($(e.target).closest('.paragraph-actions').length) return;

      draggedElement = this;
      draggedIndex = $(this).index();
      $(this).addClass('dragging');

      $(document).on('mousemove.paragraphs', handleParagraphDragMove);
      $(document).on('mouseup.paragraphs', handleParagraphDragEnd);

      e.preventDefault();
    });

  function handleParagraphDragMove(e) {
    if (!draggedElement) return;

    const container = $('#outline-paragraphs')[0];
    const items = Array.from(container.children);
    const mouseY = e.clientY;

    let targetIndex = -1;
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      if (mouseY > rect.top && mouseY < rect.bottom) {
        targetIndex = index;
      }
    });

    if (targetIndex !== -1 && targetIndex !== draggedIndex) {
      const targetElement = items[targetIndex];
      if (mouseY < targetElement.getBoundingClientRect().top + targetElement.offsetHeight / 2) {
        container.insertBefore(draggedElement, targetElement);
      } else {
        container.insertBefore(draggedElement, targetElement.nextSibling);
      }
    }
  }

  function handleParagraphDragEnd() {
    if (!draggedElement) return;

    $(draggedElement).removeClass('dragging');

    // 更新段落顺序
    const newOrder = Array.from($('#outline-paragraphs')[0].children)
      .map((element, index) => {
        const paragraphId = $(element).data('paragraph-id');
        const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
        if (paragraph) {
          paragraph.order = index + 1;
          // 更新显示的序号
          $(element)
            .find('.paragraph-number')
            .text(index + 1);
          $(element).attr('data-order', index + 1);
        }
        return paragraph;
      })
      .filter(p => p);

    outlineParagraphs = newOrder;

    draggedElement = null;
    draggedIndex = -1;

    $(document).off('mousemove.paragraphs mouseup.paragraphs');

    saveOutlineParagraphs();
  }
}

/**
 * 设置段落编辑功能
 */
function setupParagraphEditing() {
  // 双击进入编辑模式
  $(document)
    .off('dblclick.paragraphs')
    .on('dblclick.paragraphs', '.paragraph-content', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const $content = $(this);
      const $main = $content.closest('.paragraph-main');

      // 如果已经在编辑状态，不需要再次启动
      if ($content.attr('contenteditable') === 'true') return;

      // 启用编辑模式
      $content.attr('contenteditable', 'true');
      $main.addClass('editing');
      $content.focus();

      // 将光标置于点击位置
      const range = document.createRange();
      const selection = window.getSelection();
      range.setStart($content[0], 0);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);

      console.log('[Story Weaver] Editing enabled for paragraph:', $content.data('paragraph-id'));
    });

  // 内容编辑事件（输入时）
  $(document)
    .off('input.paragraphs')
    .on('input.paragraphs', '.paragraph-content[contenteditable="true"]', function () {
      const paragraphId = $(this).data('paragraph-id');
      const newContent = $(this).text().trim();
      const paragraph = outlineParagraphs.find(p => p.id === paragraphId);

      if (paragraph) {
        paragraph.content = newContent;
        paragraph.wordCount = newContent.length;

        // 更新统计显示
        $(this).closest('.paragraph-main').find('.paragraph-stats').text(`${newContent.length} 字符`);

        // 让高度由内容自然决定，不做JS强行设置

        // 防抖保存
        clearTimeout(paragraph.saveTimeout);
        paragraph.saveTimeout = setTimeout(() => {
          saveOutlineParagraphs();
        }, 1000);
      }
    });

  // 编辑状态管理
  $(document)
    .off('focus.paragraphs blur.paragraphs keydown.paragraphs')
    .on('focus.paragraphs', '.paragraph-content[contenteditable="true"]', function () {
      $(this).closest('.paragraph-main').addClass('editing');
    })
    .on('blur.paragraphs', '.paragraph-content[contenteditable="true"]', function () {
      const $content = $(this);
      const $main = $content.closest('.paragraph-main');

      // 延迟结束编辑，以防用户快速重新聚焦
      setTimeout(() => {
        if (!$content.is(':focus')) {
          $content.attr('contenteditable', 'false');
          $main.removeClass('editing');
          console.log('[Story Weaver] Editing disabled for paragraph:', $content.data('paragraph-id'));
        }
      }, 200);
    })
    .on('keydown.paragraphs', '.paragraph-content[contenteditable="true"]', function (e) {
      // Enter键结束编辑（可选）
      if (e.key === 'Escape') {
        $(this).blur();
        e.preventDefault();
      }

      // Enter键创建新行而不结束编辑
      if (e.key === 'Enter' && !e.shiftKey) {
        // 允许正常换行
        return true;
      }
    });

  // 段落操作按钮
  $(document)
    .off('click.paragraphs')
    .on('click.paragraphs', '.paragraph-action', function (e) {
      e.stopPropagation();
      const action = $(this).data('action');
      const paragraphElement = $(this).closest('.outline-paragraph');
      const paragraphId = paragraphElement.data('paragraph-id');

      switch (action) {
        case 'duplicate':
          duplicateParagraph(paragraphId);
          break;
        case 'generate-details':
          generateDetailsForParagraph(paragraphId);
          break;
        case 'delete':
          deleteParagraph(paragraphId);
          break;
      }
    });
}

/**
 * 复制段落
 */
function duplicateParagraph(paragraphId) {
  const originalParagraph = outlineParagraphs.find(p => p.id === paragraphId);
  if (!originalParagraph) return;

  const duplicatedParagraph = {
    ...originalParagraph,
    id: `paragraph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    order: originalParagraph.order + 1,
    content: originalParagraph.content + ' (副本)',
    createdAt: new Date().toISOString(),
  };

  // 调整后续段落序号
  outlineParagraphs.forEach(p => {
    if (p.order > originalParagraph.order) {
      p.order++;
    }
  });

  outlineParagraphs.push(duplicatedParagraph);
  outlineParagraphs.sort((a, b) => a.order - b.order);

  renderOutlineParagraphs();
  saveOutlineParagraphs();
  showNotification('段落已复制', 'success');
}

/**
 * 删除段落
 */
function deleteParagraph(paragraphId) {
  const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
  if (!paragraph) return;

  if (confirm(`确定要删除第${paragraph.order}段吗？此操作不可撤销。`)) {
    const deletedOrder = paragraph.order;

    // 删除段落
    outlineParagraphs = outlineParagraphs.filter(p => p.id !== paragraphId);

    // 调整后续段落序号
    outlineParagraphs.forEach(p => {
      if (p.order > deletedOrder) {
        p.order--;
      }
    });

    renderOutlineParagraphs();
    saveOutlineParagraphs();

    // 实时保存到版本管理系统并检查是否需要删除空大纲
    updateCurrentOutlineInVersionManager();

    // 更新版本显示
    updateVersionDisplayIfNeeded();

    showNotification('段落已删除', 'success');
  }
}

/**
 * 更新版本管理系统中的当前大纲
 */
function updateCurrentOutlineInVersionManager() {
  const currentOutline = versionManager.getCurrentOutline();
  if (currentOutline) {
    // 将段落数组转换为完整的大纲内容
    const outlineContent = reconstructOutlineContent();
    currentOutline.content = outlineContent;

    // 检查是否所有段落都被删除了
    if (outlineParagraphs.length === 0) {
      // 如果没有段落了，删除整个大纲版本
      versionManager.deleteVersion(currentOutline.id);
      console.log('[Story Weaver] Deleted empty outline version:', currentOutline.id);

      // 清空输出显示
      clearOutputDisplay();

      // 触发版本显示更新
      updateVersionDisplayIfNeeded();
    } else {
      // 否则更新大纲内容
      versionManager.saveToLocalStorage();
      console.log('[Story Weaver] Updated current outline in version manager');
    }
  }
}

/**
 * 重新构建大纲内容字符串
 */
function reconstructOutlineContent() {
  if (!outlineParagraphs || outlineParagraphs.length === 0) {
    return '';
  }

  // 按顺序排列段落并重新构建大纲内容
  const sortedParagraphs = outlineParagraphs
    .sort((a, b) => a.order - b.order)
    .map(p => p.content)
    .join('\n\n');

  return sortedParagraphs;
}

/**
 * 清空输出显示
 */
function clearOutputDisplay() {
  // 清空段落容器
  $('#outline-paragraphs').empty().addClass('hidden');

  // 显示占位符
  $('#output-placeholder').removeClass('hidden');

  // 隐藏统计信息
  $('#output-stats').addClass('hidden');

  console.log('[Story Weaver] Cleared output display');
}

/**
 * 更新版本显示（如果有剩余版本）
 */
function updateVersionDisplayIfNeeded() {
  // 获取剩余的版本
  const remainingOutlines = versionManager.history;

  if (remainingOutlines.length > 0) {
    // 如果还有版本，切换到最新版本
    const latestOutlineId = remainingOutlines[0];
    const latestOutline = versionManager.outlines.get(latestOutlineId);

    if (latestOutline) {
      // 切换到最新版本
      versionManager.currentOutlineId = latestOutlineId;

      // 显示最新版本的内容
      if (hotkeyManager) {
        hotkeyManager.displayOutline(latestOutline);
      }

      console.log('[Story Weaver] Switched to latest remaining version:', latestOutlineId);
    }
  } else {
    // 如果没有版本了，完全清空
    versionManager.currentOutlineId = null;
    clearOutputDisplay();

    // 移除版本信息显示
    const versionInfo = document.getElementById('version-info');
    if (versionInfo) {
      versionInfo.remove();
    }

    console.log('[Story Weaver] No versions remaining, cleared all displays');
  }
}

/**
 * 为段落生成细纲
 */
async function generateDetailsForParagraph(paragraphId) {
  const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
  if (!paragraph) return;

  const currentOutline = versionManager.getCurrentOutline();
  if (!currentOutline) {
    showNotification('请先生成主要大纲', 'warning');
    return;
  }

  if (paragraph.content.length < 10) {
    showNotification('段落内容太短，无法生成细纲', 'warning');
    return;
  }

  try {
    showNotification('正在为段落生成细纲...', 'info');

    // 构建细纲生成提示词
    const prompt = `基于以下故事大纲中的段落，生成详细的细纲：

**原段落内容：**
${paragraph.content}

**整体故事背景：**
${currentOutline.content.substring(0, 500)}...

**要求：**
1. 保持与原段落内容的一致性
2. 提供更详细的情节发展
3. 包含具体的场景描述和对话提示
4. 保持适当的篇幅（3-5个子要点）
5. 确保逻辑清晰、衔接自然

请直接返回细纲内容，不需要额外说明：`;

    // 发送API请求
    const response = await fetch('/api/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 800,
        temperature: 0.7,
        stop: null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const detailContent = data.choices?.[0]?.text?.trim() || data.content?.trim();

    if (detailContent) {
      // 在新窗口或模态框中显示细纲
      showDetailModal(paragraph, detailContent);
      showNotification('段落细纲生成完成', 'success');
    } else {
      throw new Error('未收到有效的细纲内容');
    }
  } catch (error) {
    console.error('[Story Weaver] Detail generation failed:', error);
    showNotification('细纲生成失败：' + error.message, 'error');
  }
}

/**
 * 显示细纲详情模态框
 */
function showDetailModal(paragraph, detailContent) {
  const themeInfo = getThemeInfo('body');

  const modal = $(`
    <div class="story-weaver-modal" style="position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center;">
      <div style="background: ${themeInfo.modalBg}; color: ${themeInfo.textColor}; border: 1px solid ${
    themeInfo.borderColor
  }; border-radius: 8px; max-width: 80%; max-height: 80%; overflow: hidden; position: relative;">
        <div style="display:flex; align-items:center; justify-content: space-between; gap:12px; padding: 12px 16px; border-bottom: 1px solid ${
          themeInfo.borderColor
        }; background: ${themeInfo.headerBg};">
          <h3 style="margin:0;">📝 段落细纲 - 第${paragraph.order}段</h3>
          <div>
            <button id="copy-detail-content" class="action-btn" title="复制细纲"><span class="btn-icon">📋</span></button>
            <button id="send-to-chat" class="action-btn" title="发送到聊天"><span class="btn-icon">💬</span></button>
            <button id="close-detail-modal" class="action-btn" title="关闭"><span class="btn-icon">✕</span></button>
          </div>
        </div>
        <div style="padding: 16px; max-height: 60vh; overflow: auto;">
          <div style="margin-bottom: 16px; padding: 12px; background: rgba(102, 126, 234, 0.1); border-radius: 6px; border-left: 4px solid #667EEA;">
            <h4 style="margin: 0 0 8px 0; color: #667EEA;">原段落内容：</h4>
            <div style="font-size: 14px; line-height: 1.6;">${$('<div/>').text(paragraph.content).html()}</div>
          </div>
          <div>
            <h4 style="margin: 0 0 12px 0; color: ${themeInfo.textColor};">详细细纲：</h4>
            <div id="detail-content" style="font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${$('<div/>')
              .text(detailContent)
              .html()}</div>
          </div>
        </div>
      </div>
    </div>
  `);

  $('body').append(modal);

  // 事件处理
  modal.on('click', e => {
    if (e.target === modal[0]) modal.remove();
  });

  modal.find('#close-detail-modal').on('click', () => modal.remove());

  modal.find('#copy-detail-content').on('click', () => {
    navigator.clipboard?.writeText(detailContent).then(() => showNotification('细纲已复制到剪贴板', 'success'));
  });

  modal.find('#send-to-chat').on('click', () => {
    // 发送到聊天区域
    if (typeof sendSystemMessage === 'function') {
      sendSystemMessage(`【段落${paragraph.order}细纲】\n\n${detailContent}`);
      showNotification('细纲已发送到聊天', 'success');
      modal.remove();
    } else {
      // 备用方案：复制到剪贴板
      navigator.clipboard
        ?.writeText(`【段落${paragraph.order}细纲】\n\n${detailContent}`)
        .then(() => showNotification('细纲已复制，请手动粘贴到聊天', 'info'));
    }
  });
}

/**
 * 更新大纲统计
 */
function updateOutlineStats() {
  const totalWords = outlineParagraphs.reduce((sum, p) => sum + p.wordCount, 0);
  const paragraphCount = outlineParagraphs.length;

  $('#word-count').text(totalWords);
  $('#chapter-count').text(paragraphCount);

  // 更新输出统计区域
  const outputStats = $('#output-stats');
  if (paragraphCount > 0) {
    outputStats.removeClass('hidden');
    outputStats.find('.stat-item').eq(2).find('.stat-value').text(paragraphCount);
  }
}

/**
 * 保存段落数据
 */
function saveOutlineParagraphs() {
  if (!settings.savedContent) {
    settings.savedContent = {};
  }

  settings.savedContent.paragraphs = outlineParagraphs;
  settings.savedContent.lastModified = new Date().toISOString();

  saveSettings();
}

/**
 * 加载保存的段落数据
 */
function loadOutlineParagraphs() {
  if (settings.savedContent && settings.savedContent.paragraphs) {
    outlineParagraphs = settings.savedContent.paragraphs || [];
    renderOutlineParagraphs();
  }
}

/**
 * 设置批量管理功能
 */
function setupBatchManagement() {
  // 全选/取消全选
  $(document)
    .off('change', '#select-all-paragraphs')
    .on('change', '#select-all-paragraphs', function () {
      const isChecked = $(this).prop('checked');
      $('.paragraph-checkbox').prop('checked', isChecked);
      updateBatchSelectionUI();
    });

  // 单个段落选择
  $(document)
    .off('change', '.paragraph-checkbox')
    .on('change', '.paragraph-checkbox', function () {
      updateBatchSelectionUI();

      // 检查是否所有段落都被选中，更新全选状态
      const totalCheckboxes = $('.paragraph-checkbox').length;
      const checkedCheckboxes = $('.paragraph-checkbox:checked').length;

      $('#select-all-paragraphs').prop('checked', totalCheckboxes === checkedCheckboxes);
    });

  // 批量复制
  $(document).off('click', '#batch-copy').on('click', '#batch-copy', batchCopyParagraphs);

  // 批量删除
  $(document).off('click', '#batch-delete').on('click', '#batch-delete', batchDeleteParagraphs);

  // 批量合并
  $(document).off('click', '#batch-merge').on('click', '#batch-merge', batchMergeParagraphs);
}

/**
 * 更新批量选择UI状态
 */
function updateBatchSelectionUI() {
  const selectedCount = $('.paragraph-checkbox:checked').length;
  $('#selected-paragraph-count').text(selectedCount);

  const hasSeletions = selectedCount > 0;
  $('#batch-copy, #batch-delete').prop('disabled', !hasSeletions);
  $('#batch-merge').prop('disabled', selectedCount < 2);
}

/**
 * 批量复制段落
 */
function batchCopyParagraphs() {
  const selectedParagraphs = [];
  $('.paragraph-checkbox:checked').each(function () {
    const paragraphId = $(this).data('paragraph-id');
    const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
    if (paragraph) {
      selectedParagraphs.push(paragraph.content);
    }
  });

  if (selectedParagraphs.length === 0) {
    showNotification('请先选择要复制的段落', 'warning');
    return;
  }

  const combinedContent = selectedParagraphs.join('\n\n');

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(combinedContent)
      .then(() => {
        showNotification(`已复制 ${selectedParagraphs.length} 个段落到剪贴板`, 'success');
      })
      .catch(() => {
        showNotification('复制失败，请手动复制', 'error');
      });
  } else {
    // 备选方案：创建临时文本区域
    const textarea = $('<textarea>').val(combinedContent).appendTo('body').select();
    document.execCommand('copy');
    textarea.remove();
    showNotification(`已复制 ${selectedParagraphs.length} 个段落到剪贴板`, 'success');
  }
}

/**
 * 批量删除段落
 */
function batchDeleteParagraphs() {
  const selectedIds = [];
  $('.paragraph-checkbox:checked').each(function () {
    selectedIds.push($(this).data('paragraph-id'));
  });

  if (selectedIds.length === 0) {
    showNotification('请先选择要删除的段落', 'warning');
    return;
  }

  if (!confirm(`确定要删除选中的 ${selectedIds.length} 个段落吗？此操作无法撤销。`)) {
    return;
  }

  // 删除选中的段落
  outlineParagraphs = outlineParagraphs.filter(p => !selectedIds.includes(p.id));

  // 重新分配序号
  outlineParagraphs.forEach((paragraph, index) => {
    paragraph.order = index + 1;
  });

  // 重新渲染
  renderOutlineParagraphs();
  saveOutlineParagraphs();

  // 实时保存到版本管理系统并检查是否需要删除空大纲
  updateCurrentOutlineInVersionManager();

  // 更新版本显示
  updateVersionDisplayIfNeeded();

  showNotification(`已删除 ${selectedIds.length} 个段落`, 'success');
}

/**
 * 批量合并段落
 */
function batchMergeParagraphs() {
  const selectedParagraphs = [];
  $('.paragraph-checkbox:checked').each(function () {
    const paragraphId = $(this).data('paragraph-id');
    const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
    if (paragraph) {
      selectedParagraphs.push(paragraph);
    }
  });

  if (selectedParagraphs.length < 2) {
    showNotification('请至少选择两个段落进行合并', 'warning');
    return;
  }

  // 按序号排序
  selectedParagraphs.sort((a, b) => a.order - b.order);

  // 合并内容
  const mergedContent = selectedParagraphs.map(p => p.content).join('\n\n');
  const firstParagraph = selectedParagraphs[0];

  // 更新第一个段落
  firstParagraph.content = mergedContent;
  firstParagraph.wordCount = mergedContent.length;
  firstParagraph.modified = new Date().toISOString();

  // 删除其他段落
  const idsToRemove = selectedParagraphs.slice(1).map(p => p.id);
  outlineParagraphs = outlineParagraphs.filter(p => !idsToRemove.includes(p.id));

  // 重新分配序号
  outlineParagraphs.forEach((paragraph, index) => {
    paragraph.order = index + 1;
  });

  // 重新渲染
  renderOutlineParagraphs();
  saveOutlineParagraphs();

  // 实时保存到版本管理系统并检查是否需要删除空大纲
  updateCurrentOutlineInVersionManager();

  // 更新版本显示
  updateVersionDisplayIfNeeded();

  showNotification(`已合并 ${selectedParagraphs.length} 个段落`, 'success');
}

/**
 * 取消JS高度干预，改用纯CSS自适应
 */

/**
 * 添加批量管理相关的CSS样式
 */
function addBatchManagementStyles() {
  if ($('#batch-management-styles').length > 0) return; // 避免重复添加

  const batchStyles = `
    <style id="batch-management-styles">
    /* 批量管理工具栏 */
    .batch-management-toolbar {
      background: var(--SmartThemeBodyColor, #222);
      border: 1px solid var(--SmartThemeBorderColor, #444);
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .batch-selection-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .batch-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--SmartThemeQuoteColor, #ccc);
      font-size: 14px;
    }

    .batch-checkbox input[type="checkbox"] {
      margin: 0;
      transform: scale(1.1);
    }

    .selected-count {
      font-size: 13px;
      color: var(--SmartThemeQuoteColor, #999);
      margin-left: 8px;
    }

    .batch-actions {
      display: flex;
      gap: 8px;
    }

    .batch-action-btn {
      background: var(--SmartThemeBodyColor, #333);
      border: 1px solid var(--SmartThemeBorderColor, #555);
      color: var(--SmartThemeQuoteColor, #ddd);
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .batch-action-btn:hover:not(:disabled) {
      background: var(--SmartThemeQuoteColor, #444);
      border-color: var(--SmartThemeQuoteColor, #666);
      transform: translateY(-1px);
    }

    .batch-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .batch-action-btn.danger:hover:not(:disabled) {
      background: #dc3545;
      border-color: #dc3545;
      color: white;
    }

    /* 段落选择框 - 现代设计 */
    .paragraph-selection {
      margin-top: 4px;
      flex-shrink: 0;
      z-index: 10;
    }

    .paragraph-checkbox {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 2px solid var(--SmartThemeBorderColor, #666);
      background: var(--SmartThemeBodyColor, #2a2a2a);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .paragraph-checkbox:checked {
      background: var(--SmartThemeQuoteColor, #007bff);
      border-color: var(--SmartThemeQuoteColor, #007bff);
    }

    /* 段落容器 - 现代气泡式设计 */
    .outline-paragraph {
      position: relative;
      margin: 12px 0;
      padding: 0 !important; /* 覆盖全局旧样式，避免外围额外留白 */
      display: flex;
      align-items: flex-start;
      gap: 10px;
      max-width: 100%;
      min-height: 0 !important;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* 段落编号 - 现代徽章设计 */
    .paragraph-number {
      background: linear-gradient(135deg, var(--SmartThemeQuoteColor, #007bff), var(--SmartThemeQuoteColor, #0056b3));
      color: white;
      border-radius: 12px;
      min-width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
      margin-top: 4px;
    }

    /* 气泡式内容区域 */
    .paragraph-main {
      position: relative;
      display: block;
      width: min(80ch, calc(100% - 140px));
      background: var(--SmartThemeBubbleBg, rgba(255, 255, 255, 0.06));
      border: 1px solid var(--SmartThemeBorderColor, #3a3a3a);
      border-radius: 14px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: visible;
      min-height: 0 !important;
      backdrop-filter: blur(8px);
    }

    .paragraph-main:hover {
      border-color: var(--SmartThemeQuoteColor, #5aa7ff);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.22);
      transform: translateY(-1px);
    }

    .paragraph-main.editing {
      border-color: var(--SmartThemeQuoteColor, #5aa7ff);
      box-shadow: 0 0 0 2px rgba(90, 167, 255, 0.35), 0 8px 24px rgba(0, 0, 0, 0.25);
      background: var(--SmartThemeBubbleBg, rgba(255, 255, 255, 0.08));
    }

    /* 段落内容 - 优化文字显示 */
    .paragraph-content {
      display: block;
      width: 100%;
      max-width: 100%;
      padding: 12px 16px;
      margin: 0;
      border: none;
      outline: none;
      background: transparent;
      color: var(--SmartThemeTextColor, #e6e6e6);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      letter-spacing: 0.01em;
      overflow-wrap: anywhere;
      cursor: text;
      box-sizing: border-box;
      white-space: pre-wrap;
      min-height: 0 !important;
    }

    /* 取消段落标签的默认外边距，避免单行时上下空白过大 */
    .paragraph-content p { margin: 0 !important; }
    .paragraph-content p + p { margin-top: 0.4em !important; }
    .paragraph-content > :first-child { margin-top: 0 !important; }
    .paragraph-content > :last-child { margin-bottom: 0 !important; }
    .paragraph-content ul, .paragraph-content ol { margin: 0.4em 0 0.4em 1.2em; }

    .paragraph-content:focus,
    .paragraph-content[contenteditable="true"]:focus {
      background: transparent !important;
      color: var(--SmartThemeQuoteColor, #e8e8e8) !important;
      outline: none !important;
      box-shadow: none !important;
    }

    .paragraph-content::placeholder {
      color: var(--SmartThemeQuoteColor, #888);
      opacity: 0.6;
    }

    /* 操作按钮 - 现代浮动设计 */
    .paragraph-actions {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      display: none;
      align-items: center;
      gap: 6px;
      background: var(--SmartThemeBodyColor, #1a1a1a);
      border: 1px solid var(--SmartThemeBorderColor, #404040);
      border-radius: 12px;
      padding: 6px 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      z-index: 20;
    }

    .paragraph-main:hover .paragraph-actions,
    .outline-paragraph.show-actions .paragraph-actions {
      display: flex;
      animation: slideInFromRight 0.2s ease-out;
    }

    @keyframes slideInFromRight {
      from {
        opacity: 0;
        transform: translateY(-50%) translateX(10px);
      }
      to {
        opacity: 1;
        transform: translateY(-50%) translateX(0);
      }
    }

    .paragraph-action {
      background: transparent;
      border: none;
      color: var(--SmartThemeQuoteColor, #ccc);
      padding: 6px 8px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
    }

    .paragraph-action:hover {
      background: var(--SmartThemeQuoteColor, #404040);
      color: white;
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .paragraph-action:active {
      transform: scale(0.95);
    }

    /* 拖拽手柄 - 现代设计 */
    .paragraph-drag-handle {
      position: absolute;
      left: -24px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--SmartThemeQuoteColor, #666);
      cursor: grab;
      font-size: 16px;
      opacity: 0;
      transition: all 0.2s ease;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--SmartThemeBodyColor, #404040);
    }

    .outline-paragraph:hover .paragraph-drag-handle {
      opacity: 0.7;
    }

    .paragraph-drag-handle:hover {
      opacity: 1;
      background: var(--SmartThemeQuoteColor, #555);
    }

    .paragraph-drag-handle:active {
      cursor: grabbing;
      transform: translateY(-50%) scale(1.1);
    }

    /* 统计信息 - 现代标签设计 */
    .paragraph-stats {
      position: absolute;
      bottom: -28px;
      right: 12px;
      font-size: 11px;
      color: var(--SmartThemeQuoteColor, #999);
      background: var(--SmartThemeBodyColor, #333);
      padding: 4px 8px;
      border-radius: 8px;
      border: 1px solid var(--SmartThemeBorderColor, #555);
      opacity: 0;
      transition: all 0.2s ease;
      font-weight: 500;
      letter-spacing: 0.02em;
    }

    .paragraph-main:hover .paragraph-stats {
      opacity: 1;
      transform: translateY(-2px);
    }

    /* 隐藏原来的段落头部 */

    /* 响应式调整 */
    @media (max-width: 768px) {
      .outline-paragraph { margin: 10px 0; gap: 8px; }
      .paragraph-main { width: min(80ch, calc(100% - 100px)); display: block; }
      .paragraph-content { padding: 10px 14px; font-size: 14px; }
      
      .paragraph-actions {
        right: 8px;
        padding: 4px 6px;
      }
      
      .paragraph-action {
        min-width: 28px;
        height: 28px;
        font-size: 12px;
      }
    }
    </style>
  `;

  $('head').append(batchStyles);
}

/**
 * 处理AI生成的大纲结果
 */
function displayGeneratedOutline(content) {
  console.log('[Story Weaver] Displaying generated outline with paragraph system');

  // 在章节分隔之前再次应用插件正则规则
  const preprocessedContent = applyPluginRegex(content, 'result');
  console.log('[Story Weaver] Applied plugin regex before chapter separation');

  // 解析内容为段落
  outlineParagraphs = parseOutlineIntoParagraphs(preprocessedContent);

  // 如果段落解析失败或段落数量太少，使用备选方案
  if (!outlineParagraphs || outlineParagraphs.length === 0) {
    console.log('[Story Weaver] Paragraph parsing failed, using fallback display method');
    displayFullContentFallback(preprocessedContent);
    return;
  }

  // 渲染段落
  renderOutlineParagraphs();

  // 保存到设置
  saveOutlineParagraphs();

  // 显示成功消息
  showNotification(`大纲已生成，共 ${outlineParagraphs.length} 个段落`, 'success');
}

/**
 * 备选方案：直接显示完整内容
 */
function displayFullContentFallback(content) {
  console.log('[Story Weaver] Using fallback method to display full content');

  const outputContent = $('#output-content');
  const placeholder = outputContent.find('.output-placeholder');

  // 隐藏占位符
  placeholder.addClass('hidden');

  // 创建格式化的内容显示区域
  const formattedContent = formatParagraphContent(content);
  const contentDisplay = $(`
    <div class="generated-content fallback-content">
      <div class="content-wrapper">
        ${formattedContent}
      </div>
    </div>
  `);

  // 清理旧内容并添加新内容
  outputContent.find('.generated-content').remove();
  outputContent.append(contentDisplay);

  showNotification('大纲已生成并显示', 'success');
}

/**
 * Create and manage the minimized pokeball
 */
let pokeballElement = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function createPokeball() {
  if (pokeballElement) return pokeballElement;

  pokeballElement = $(`
    <div class="story-weaver-pokeball" id="sw-pokeball">
      <div class="pokeball-design">
        <div class="pokeball-center"></div>
      </div>
      <div class="pokeball-badge" id="pokeball-badge">!</div>
    </div>
  `);

  $('body').append(pokeballElement);
  pokeballElement.hide(); // Initially hidden
  setupPokeballEvents();
  return pokeballElement;
}

function setupPokeballEvents() {
  if (!pokeballElement) return;

  // Click to expand panel
  pokeballElement.on('click', e => {
    if (!isDragging) {
      showStoryWeaverPanel();
      hidePokeball();
    }
  });

  // Mouse down - start drag
  pokeballElement.on('mousedown', e => {
    isDragging = false;
    const rect = pokeballElement[0].getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;

    pokeballElement.addClass('dragging');

    // Prevent text selection during drag
    e.preventDefault();
  });

  // Mouse move - drag pokeball
  $(document).on('mousemove', e => {
    if (!pokeballElement.hasClass('dragging')) return;

    isDragging = true;

    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;

    // Keep pokeball within viewport bounds
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 60;

    const constrainedX = Math.max(0, Math.min(x, maxX));
    const constrainedY = Math.max(0, Math.min(y, maxY));

    pokeballElement.css({
      left: constrainedX + 'px',
      top: constrainedY + 'px',
      right: 'auto',
      bottom: 'auto',
    });
  });

  // Mouse up - end drag
  $(document).on('mouseup', () => {
    if (pokeballElement && pokeballElement.hasClass('dragging')) {
      pokeballElement.removeClass('dragging');

      // Short delay to distinguish between click and drag
      setTimeout(() => {
        isDragging = false;
      }, 100);
    }
  });
}

function showPokeball() {
  if (!pokeballElement) {
    createPokeball();
  }
  pokeballElement.show();
}

function hidePokeball() {
  if (pokeballElement) {
    pokeballElement.hide();
  }
}

function updatePokeballBadge(show = false, text = '!') {
  if (!pokeballElement) return;

  const badge = pokeballElement.find('.pokeball-badge');
  if (show) {
    badge.text(text).addClass('visible');
  } else {
    badge.removeClass('visible');
  }
}

/**
 * 自动加载上次的大纲
 */
function autoLoadLastOutline() {
  try {
    const currentOutline = versionManager.getCurrentOutline();
    if (currentOutline) {
      console.log('[Story Weaver] Auto-loading last outline:', currentOutline.title);

      // 清理内容中的HTML标签（如果存在历史HTML数据）
      const cleanContent = cleanHTMLContent(currentOutline.content);
      currentOutline.content = cleanContent;

      // 使用hotkeyManager来显示大纲，确保正确的显示流程
      hotkeyManager.displayOutline(currentOutline);

      // 显示自动加载的通知
      setTimeout(() => {
        showNotification(`已自动加载大纲: ${currentOutline.title}`, 'success', 3000);
      }, 500);
    } else {
      console.log('[Story Weaver] No previous outline found to auto-load');
    }
  } catch (error) {
    console.error('[Story Weaver] Failed to auto-load outline:', error);
  }
}

/**
 * 清理HTML内容，提取纯文本
 */
function cleanHTMLContent(content) {
  if (!content || typeof content !== 'string') return '';

  // 如果内容包含HTML标签，提取纯文本
  if (content.includes('<div') || content.includes('<p') || content.includes('<span')) {
    try {
      // 创建临时DOM元素来解析HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // 提取所有段落内容的文本
      const paragraphElements = tempDiv.querySelectorAll('.paragraph-content');
      if (paragraphElements.length > 0) {
        return Array.from(paragraphElements)
          .map(el => el.textContent || el.innerText || '')
          .filter(text => text.trim())
          .join('\n\n');
      } else {
        // 如果没有找到段落结构，直接提取所有文本
        return tempDiv.textContent || tempDiv.innerText || content;
      }
    } catch (error) {
      console.warn('[Story Weaver] Failed to clean HTML content:', error);
      return content;
    }
  }

  return content;
}

/**
 * Extension initialization
 */
jQuery(async function () {
  console.log('[Story Weaver] Extension initializing...');

  try {
    // Add UI to SillyTavern
    addExtensionUI();
    addSettingsDrawer();

    // Load settings
    await loadSettings();

    // Setup event listeners
    setupEventListeners();

    // Auto-load last outline if available
    setTimeout(() => {
      autoLoadLastOutline();
    }, 1500);

    // Listen for world info updates
    eventSource.on(event_types.WORLDINFO_ENTRIES_LOADED, () => {
      console.log('[Story Weaver] World info entries updated');
      // Update status badge in panel if open
      refreshDataAndUpdateStatus();
    });

    // Listen for settings loaded to get context presets
    eventSource.on(event_types.SETTINGS_LOADED, () => {
      console.log('[Story Weaver] Settings loaded, checking for story-weaver presets...');
      setTimeout(async () => {
        loadStoryWeaverPresets();
        // Note: No auto-registration of prompts, they are only registered during generation
      }, 1000);
    });

    // Note: We no longer auto-register prompts on character/chat changes
    // Prompts are only registered temporarily during Story Weaver generation

    console.log('[Story Weaver] Extension initialized successfully');

    // Clear any previously registered prompts to ensure clean state
    clearAllStoryWeaverPrompts();
    console.log('[Story Weaver] Cleared any existing prompt registrations');

    // Note: Prompts are not pre-registered, they will be registered only during generation

    // Add batch management styles
    addBatchManagementStyles();

    // Create pokeball for minimized state
    createPokeball();

    // Test preset systems
    setTimeout(() => {
      testPresetSystem();
      testPromptPresetSystem();
      testVariousPresetFormats();
    }, 1000);
  } catch (error) {
    console.error('[Story Weaver] Extension initialization failed:', error);
  }
});
