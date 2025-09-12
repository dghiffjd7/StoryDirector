/**
 * Story Weaver - Complete TavernHelper Version
 * 故事大纲生成器 - 完整TavernHelper版本
 * 
 * A powerful story outline generator that integrates with SillyTavern's lorebook system
 * through TavernHelper's advanced APIs.
 * 
 * Usage:
 * - /sw or /storyweaver - Open the main interface
 * - /swquick [type] [chapters] - Quick generation
 */

(() => {
  'use strict';

  // ===== TavernHelper Integration Configuration =====
  const SCRIPT_NAME = 'Story Weaver';
  const SCRIPT_VERSION = '2.0.0';
  const VARIABLE_PREFIX = 'sw_'; // Prefix for TavernHelper variables

  // ===== Default Settings =====
  const DEFAULT_SETTINGS = {
    contextLength: 100,
    storyType: 'fantasy',
    storyTheme: '',
    storyStyle: 'detailed',
    chapterCount: 5,
    detailLevel: 'detailed',
    specialRequirements: '',
    includeSummary: true,
    includeCharacters: true,
    includeThemes: false
  };

  // ===== Story Type Definitions =====
  const STORY_TYPES = {
    fantasy: '🏰 奇幻冒险',
    romance: '💖 浪漫爱情',
    mystery: '🔍 悬疑推理',
    scifi: '🚀 科幻未来',
    'slice-of-life': '🌸 日常生活',
    action: '⚔️ 动作冒险',
    drama: '🎭 情感剧情',
    horror: '👻 恐怖惊悚',
    comedy: '😄 轻松喜剧',
    custom: '🎨 自定义'
  };

  const STORY_STYLES = {
    descriptive: '📝 详细描述型',
    dialogue: '💬 对话推进型',
    action: '⚡ 快节奏动作型',
    introspective: '🤔 内心独白型',
    episodic: '📚 章节式结构'
  };

  const DETAIL_LEVELS = {
    brief: '简要大纲',
    detailed: '详细大纲',
    comprehensive: '全面大纲'
  };

  // ===== Default Prompt Template =====
  const DEFAULT_PROMPT_TEMPLATE = `你是一位专业的故事创作和世界构建助手。你的任务是基于提供的背景信息生成引人入胜的结构化故事大纲。

### 背景信息 ###

**世界书设定：**
{worldbook_entries}

**角色信息：**
{character_data}

**对话历史：**
{chat_history}

### 用户需求 ###

基于以上背景信息，生成满足以下用户需求的故事大纲：

* **故事类型：** {story_type}
* **核心主题/冲突：** {story_theme}
* **叙事风格：** {story_style}
* **预期章节数：** {chapter_count}
* **大纲详细程度：** {detail_level}
* **特殊要求：** {special_requirements}
* **输出选项：**
  * 包含整体摘要: {include_summary}
  * 包含角色发展: {include_characters}
  * 包含主题分析: {include_themes}

### 任务说明 ###

请生成一个分为 {chapter_count} 章节的故事大纲。大纲应该富有创意、逻辑连贯，并严格遵循上述所有用户需求。输出格式应为清晰、结构良好的中文Markdown格式。

请确保：
1. 每个章节都有明确的目标和冲突
2. 角色发展弧线贯穿整个故事
3. 情节推进自然流畅
4. 符合指定的故事类型和叙事风格`;

  // ===== Core Functions =====

  /**
   * Initialize the Story Weaver TavernHelper script
   */
  function initialize() {
    console.log(`[${SCRIPT_NAME}] Initializing TavernHelper version ${SCRIPT_VERSION}`);
    
    // Register slash commands
    registerSlashCommands();
    
    console.log(`[${SCRIPT_NAME}] Initialization complete`);
  }

  /**
   * Load settings from TavernHelper variables
   */
  async function loadSettings() {
    try {
      const settings = {};
      for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
        const variableName = `${VARIABLE_PREFIX}${key}`;
        const value = await TavernHelper.getVariable(variableName);
        settings[key] = value !== undefined ? value : defaultValue;
      }
      return settings;
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error loading settings:`, error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save settings to TavernHelper variables
   */
  async function saveSettings(settings) {
    try {
      for (const [key, value] of Object.entries(settings)) {
        const variableName = `${VARIABLE_PREFIX}${key}`;
        await TavernHelper.setVariable(variableName, value);
      }
      console.log(`[${SCRIPT_NAME}] Settings saved successfully`);
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error saving settings:`, error);
    }
  }

  /**
   * Get worldbook entries using TavernHelper
   */
  async function getWorldbookEntries() {
    try {
      const entries = await TavernHelper.getWorldbook();
      if (!entries || !Array.isArray(entries)) {
        return '暂无可用的世界书设定';
      }
      
      // Format entries for the prompt
      return entries.map(entry => {
        return `**${entry.key}**: ${entry.content}`;
      }).join('\n\n');
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error getting worldbook entries:`, error);
      return '暂无可用的世界书设定';
    }
  }

  /**
   * Get character data using TavernHelper
   */
  async function getCharacterData() {
    try {
      // Get current character information
      const character = await TavernHelper.getCharacter();
      if (!character) {
        return '暂无角色信息';
      }

      let characterInfo = '';
      if (character.name) {
        characterInfo += `**角色名称**: ${character.name}\n`;
      }
      if (character.description) {
        characterInfo += `**角色描述**: ${character.description}\n`;
      }
      if (character.personality) {
        characterInfo += `**性格特征**: ${character.personality}\n`;
      }
      if (character.scenario) {
        characterInfo += `**背景设定**: ${character.scenario}\n`;
      }

      return characterInfo || '暂无详细角色信息';
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error getting character data:`, error);
      return '角色信息获取失败';
    }
  }

  /**
   * Get chat history using TavernHelper
   */
  async function getChatHistory(messageCount = 10) {
    try {
      if (messageCount === 0) {
        return '未读取对话历史';
      }

      const history = await TavernHelper.getChatHistory(messageCount);
      if (!history || !Array.isArray(history)) {
        return '暂无对话历史';
      }

      return history.map(msg => {
        const speaker = msg.is_user ? '用户' : '助手';
        return `**${speaker}**: ${msg.mes}`;
      }).join('\n\n');
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error getting chat history:`, error);
      return '对话历史获取失败';
    }
  }

  /**
   * Register slash commands for easy access
   */
  function registerSlashCommands() {
    // Register main command to open Story Weaver interface
    TavernHelper.registerSlashCommand('sw', openStoryWeaverInterface, 'Open Story Weaver interface');
    TavernHelper.registerSlashCommand('storyweaver', openStoryWeaverInterface, 'Open Story Weaver interface');
    
    // Register quick generation command
    TavernHelper.registerSlashCommand('swquick', quickGenerate, 'Quick story outline generation');
  }

  /**
   * Generate story outline with given settings
   */
  async function generateStoryOutline(settings) {
    try {
      console.log(`[${SCRIPT_NAME}] Starting story outline generation`);
      
      // Collect data
      const worldbookEntries = await getWorldbookEntries();
      const characterData = await getCharacterData();
      const chatHistory = await getChatHistory(settings.contextLength);
      
      // Build prompt
      let prompt = DEFAULT_PROMPT_TEMPLATE;
      const replacements = {
        worldbook_entries: worldbookEntries,
        character_data: characterData,
        chat_history: chatHistory,
        story_type: STORY_TYPES[settings.storyType] || settings.storyType,
        story_theme: settings.storyTheme || '请基于现有背景信息创作',
        story_style: STORY_STYLES[settings.storyStyle] || settings.storyStyle,
        chapter_count: settings.chapterCount,
        detail_level: DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel,
        special_requirements: settings.specialRequirements || '无特殊要求',
        include_summary: settings.includeSummary ? '是' : '否',
        include_characters: settings.includeCharacters ? '是' : '否',
        include_themes: settings.includeThemes ? '是' : '否'
      };

      // Replace placeholders
      for (const [key, value] of Object.entries(replacements)) {
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
      }

      console.log(`[${SCRIPT_NAME}] Generating with TavernHelper.generateRaw`);
      
      // Generate using TavernHelper
      const result = await TavernHelper.generateRaw(prompt);
      
      console.log(`[${SCRIPT_NAME}] Generation completed successfully`);
      return result;
      
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error generating story outline:`, error);
      throw error;
    }
  }

  /**
   * Quick generation function for slash command
   */
  async function quickGenerate(args) {
    try {
      const settings = await loadSettings();
      
      // Parse simple arguments if provided
      if (args) {
        const parts = args.split(' ');
        if (parts[0] && STORY_TYPES[parts[0]]) {
          settings.storyType = parts[0];
        }
        if (parts[1] && !isNaN(parseInt(parts[1]))) {
          settings.chapterCount = parseInt(parts[1]);
        }
      }
      
      const outline = await generateStoryOutline(settings);
      
      // Display result in chat
      await TavernHelper.sendMessage(`**Story Weaver 快速生成结果：**\n\n${outline}`, false);
      
    } catch (error) {
      await TavernHelper.sendMessage(`❌ 生成失败：${error.message}`, false);
    }
  }

  /**
   * Open the main Story Weaver interface
   */
  async function openStoryWeaverInterface() {
    try {
      console.log(`[${SCRIPT_NAME}] Opening interface`);
      
      const settings = await loadSettings();
      const interfaceHTML = buildInterface(settings);
      
      // Render the interface using TavernHelper
      await TavernHelper.renderHTML(interfaceHTML, {
        title: 'Story Weaver - 故事大纲生成器',
        width: 1000,
        height: 800,
        resizable: true
      });
      
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error opening interface:`, error);
      await TavernHelper.sendMessage(`❌ 打开界面失败：${error.message}`, false);
    }
  }

  // ===== Interface Building Functions =====

  /**
   * Build the main Story Weaver interface HTML
   */
  function buildInterface(settings) {
    const css = getInterfaceCSS();
    const js = getInterfaceJavaScript();
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Story Weaver - 故事大纲生成器</title>
    <style>${css}</style>
</head>
<body>
    <div id="story-weaver-app" class="story-weaver-app">
        <div class="sw-header">
            <h1 class="sw-title">
                <span class="sw-icon">📖</span>
                Story Weaver - 故事大纲生成器
            </h1>
            <div class="sw-header-actions">
                <button id="sw-refresh" class="sw-btn sw-btn-secondary" title="刷新数据">
                    <span class="sw-btn-icon">🔄</span>
                </button>
            </div>
        </div>
        <div class="sw-content">
            <section class="sw-section">
                <h2 class="sw-section-title">
                    <span class="sw-section-icon">📖</span>
                    剧情上下文设定
                </h2>
                <div class="sw-section-content">
                    <div class="sw-form-group">
                        <label for="context-length" class="sw-label">读取对话历史长度：</label>
                        <div class="sw-input-group">
                            <input type="number" id="context-length" class="sw-input" value="${settings.contextLength}" min="0" max="500" />
                            <span class="sw-input-unit">条消息</span>
                        </div>
                        <div class="sw-help-text">设置为0则不读取对话历史，仅基于世界观生成</div>
                    </div>
                    <div class="sw-status-display">
                        <span class="sw-status-icon">ℹ️</span>
                        <span id="context-status">将根据设定自动读取最近的对话内容</span>
                    </div>
                    <div class="sw-action-group">
                        <button id="preview-data" class="sw-btn sw-btn-outline">
                            <span class="sw-btn-icon">👁️</span>
                            预览数据
                        </button>
                        <button id="refresh-data" class="sw-btn sw-btn-outline">
                            <span class="sw-btn-icon">🔄</span>
                            刷新数据
                        </button>
                    </div>
                </div>
            </section>
            <section class="sw-section">
                <h2 class="sw-section-title">
                    <span class="sw-section-icon">✨</span>
                    创作需求设定
                </h2>
                <div class="sw-section-content">
                    <div class="sw-form-row">
                        <div class="sw-form-group">
                            <label for="story-type" class="sw-label">故事类型：</label>
                            <select id="story-type" class="sw-select">
                                ${buildStoryTypeOptions(settings.storyType)}
                            </select>
                        </div>
                        <div class="sw-form-group">
                            <label for="story-style" class="sw-label">叙事风格：</label>
                            <select id="story-style" class="sw-select">
                                ${buildStoryStyleOptions(settings.storyStyle)}
                            </select>
                        </div>
                    </div>
                    <div class="sw-form-group">
                        <label for="story-theme" class="sw-label">故事主题/核心冲突：</label>
                        <textarea id="story-theme" class="sw-textarea" rows="4" placeholder="例如：主角需要拯救被诅咒的王国，同时面对内心的恐惧与过去的阴霾...">${settings.storyTheme}</textarea>
                        <div class="sw-help-text">详细描述您希望故事围绕的核心主题、冲突或目标</div>
                    </div>
                    <div class="sw-form-row">
                        <div class="sw-form-group">
                            <label for="chapter-count" class="sw-label">期望章节数：</label>
                            <input type="number" id="chapter-count" class="sw-input" value="${settings.chapterCount}" min="3" max="20" />
                        </div>
                        <div class="sw-form-group">
                            <label for="detail-level" class="sw-label">大纲详细程度：</label>
                            <select id="detail-level" class="sw-select">
                                ${buildDetailLevelOptions(settings.detailLevel)}
                            </select>
                        </div>
                    </div>
                    <div class="sw-form-group">
                        <label for="special-requirements" class="sw-label">特殊要求（可选）：</label>
                        <textarea id="special-requirements" class="sw-textarea" rows="3" placeholder="例如：需要包含特定角色的发展弧线、某些情节元素、特定的情感基调等...">${settings.specialRequirements}</textarea>
                    </div>
                    <div class="sw-checkbox-group">
                        <label class="sw-checkbox-label">
                            <input type="checkbox" id="include-summary" ${settings.includeSummary ? 'checked' : ''} />
                            <span class="sw-checkmark"></span>
                            包含整体摘要
                        </label>
                        <label class="sw-checkbox-label">
                            <input type="checkbox" id="include-characters" ${settings.includeCharacters ? 'checked' : ''} />
                            <span class="sw-checkmark"></span>
                            包含角色发展
                        </label>
                        <label class="sw-checkbox-label">
                            <input type="checkbox" id="include-themes" ${settings.includeThemes ? 'checked' : ''} />
                            <span class="sw-checkmark"></span>
                            包含主题分析
                        </label>
                    </div>
                </div>
            </section>
            <section class="sw-section">
                <div class="sw-generate-section">
                    <button id="generate-outline" class="sw-btn sw-btn-primary sw-btn-large">
                        <span class="sw-btn-icon">🎭</span>
                        <span class="sw-btn-text">生成故事大纲</span>
                        <span class="sw-btn-loading hidden">🔄</span>
                    </button>
                </div>
            </section>
            <section class="sw-section">
                <h2 class="sw-section-title">
                    <span class="sw-section-icon">📄</span>
                    生成结果
                    <div class="sw-title-actions">
                        <button id="copy-result" class="sw-btn sw-btn-small" title="复制到剪贴板">
                            <span class="sw-btn-icon">📋</span>
                        </button>
                        <button id="save-result" class="sw-btn sw-btn-small" title="保存为文件">
                            <span class="sw-btn-icon">💾</span>
                        </button>
                        <button id="send-to-chat" class="sw-btn sw-btn-small" title="发送到聊天">
                            <span class="sw-btn-icon">💬</span>
                        </button>
                    </div>
                </h2>
                <div class="sw-section-content">
                    <div id="output-content" class="sw-output-content">
                        <div id="output-placeholder" class="sw-output-placeholder">
                            <span class="sw-placeholder-icon">📝</span>
                            <p>故事大纲将在这里显示...</p>
                            <p class="sw-placeholder-help">填写上方信息后点击"生成故事大纲"开始创作</p>
                        </div>
                        <div id="output-result" class="sw-output-result hidden">
                        </div>
                    </div>
                    <div id="output-stats" class="sw-output-stats hidden">
                        <div class="sw-stat-item">
                            <span class="sw-stat-label">字数统计：</span>
                            <span id="word-count" class="sw-stat-value">0</span>
                        </div>
                        <div class="sw-stat-item">
                            <span class="sw-stat-label">生成时间：</span>
                            <span id="generation-time" class="sw-stat-value">--</span>
                        </div>
                        <div class="sw-stat-item">
                            <span class="sw-stat-label">章节数量：</span>
                            <span id="actual-chapters" class="sw-stat-value">0</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>
        <div id="loading-overlay" class="sw-loading-overlay hidden">
            <div class="sw-loading-content">
                <div class="sw-spinner"></div>
                <p>正在生成故事大纲...</p>
                <p class="sw-loading-help">请稍候，AI正在基于您的设定创作精彩大纲</p>
            </div>
        </div>
        <div id="notification-container" class="sw-notification-container"></div>
    </div>
    <script>${js}</script>
</body>
</html>`;
  }

  // Helper functions for building select options
  function buildStoryTypeOptions(selectedType) {
    return Object.entries(STORY_TYPES).map(([key, label]) => 
      `<option value="${key}" ${key === selectedType ? 'selected' : ''}>${label}</option>`
    ).join('');
  }

  function buildStoryStyleOptions(selectedStyle) {
    return Object.entries(STORY_STYLES).map(([key, label]) =>
      `<option value="${key}" ${key === selectedStyle ? 'selected' : ''}>${label}</option>`
    ).join('');
  }

  function buildDetailLevelOptions(selectedLevel) {
    return Object.entries(DETAIL_LEVELS).map(([key, label]) =>
      `<option value="${key}" ${key === selectedLevel ? 'selected' : ''}>${label}</option>`
    ).join('');
  }

  // ===== CSS Styles =====
  function getInterfaceCSS() {
    return `:root {
  --sw-primary: #4f46e5;
  --sw-primary-hover: #4338ca;
  --sw-primary-light: #e0e7ff;
  --sw-secondary: #6b7280;
  --sw-secondary-hover: #4b5563;
  --sw-success: #10b981;
  --sw-danger: #ef4444;
  --sw-warning: #f59e0b;
  --sw-bg-primary: #ffffff;
  --sw-bg-secondary: #f9fafb;
  --sw-bg-tertiary: #f3f4f6;
  --sw-text-primary: #111827;
  --sw-text-secondary: #6b7280;
  --sw-text-muted: #9ca3af;
  --sw-text-light: #ffffff;
  --sw-border: #e5e7eb;
  --sw-border-light: #f3f4f6;
  --sw-border-focus: #4f46e5;
  --sw-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --sw-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --sw-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --sw-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --sw-transition: all 0.15s ease-in-out;
  --sw-radius: 8px;
  --sw-radius-lg: 12px;
  --sw-spacing-xs: 4px;
  --sw-spacing-sm: 8px;
  --sw-spacing: 16px;
  --sw-spacing-lg: 24px;
  --sw-spacing-xl: 32px;
}

.story-weaver-app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--sw-bg-secondary);
  min-height: 100vh;
  color: var(--sw-text-primary);
  line-height: 1.6;
}

.story-weaver-app * {
  box-sizing: border-box;
}

.sw-header {
  background: var(--sw-bg-primary);
  border-bottom: 1px solid var(--sw-border);
  padding: var(--sw-spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--sw-shadow-sm);
}

.sw-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--sw-text-primary);
  display: flex;
  align-items: center;
  gap: var(--sw-spacing-sm);
}

.sw-icon {
  font-size: 1.8rem;
}

.sw-header-actions {
  display: flex;
  gap: var(--sw-spacing-sm);
}

.sw-content {
  padding: var(--sw-spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

.sw-section {
  background: var(--sw-bg-primary);
  border-radius: var(--sw-radius-lg);
  box-shadow: var(--sw-shadow);
  margin-bottom: var(--sw-spacing-lg);
  overflow: hidden;
}

.sw-section-title {
  margin: 0;
  padding: var(--sw-spacing) var(--sw-spacing-lg);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--sw-text-primary);
  background: var(--sw-bg-tertiary);
  border-bottom: 1px solid var(--sw-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sw-spacing-sm);
}

.sw-section-icon {
  font-size: 1.2rem;
}

.sw-section-content {
  padding: var(--sw-spacing-lg);
}

.sw-title-actions {
  display: flex;
  gap: var(--sw-spacing-xs);
}

.sw-form-group {
  margin-bottom: var(--sw-spacing);
}

.sw-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sw-spacing);
  margin-bottom: var(--sw-spacing);
}

.sw-label {
  display: block;
  font-weight: 500;
  color: var(--sw-text-primary);
  margin-bottom: var(--sw-spacing-xs);
}

.sw-input,
.sw-select,
.sw-textarea {
  width: 100%;
  padding: var(--sw-spacing-sm) var(--sw-spacing);
  border: 1px solid var(--sw-border);
  border-radius: var(--sw-radius);
  font-size: 0.9rem;
  transition: var(--sw-transition);
  background: var(--sw-bg-primary);
  color: var(--sw-text-primary);
}

.sw-input:focus,
.sw-select:focus,
.sw-textarea:focus {
  outline: none;
  border-color: var(--sw-border-focus);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.sw-textarea {
  resize: vertical;
  min-height: 80px;
}

.sw-input-group {
  display: flex;
  align-items: center;
  gap: var(--sw-spacing-sm);
}

.sw-input-unit {
  font-size: 0.85rem;
  color: var(--sw-text-secondary);
  white-space: nowrap;
}

.sw-help-text {
  font-size: 0.8rem;
  color: var(--sw-text-secondary);
  margin-top: var(--sw-spacing-xs);
}

.sw-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sw-spacing-xs);
  padding: var(--sw-spacing-sm) var(--sw-spacing);
  border: 1px solid transparent;
  border-radius: var(--sw-radius);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--sw-transition);
  text-decoration: none;
  background: transparent;
  position: relative;
  overflow: hidden;
}

.sw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sw-btn-primary {
  background: var(--sw-primary);
  color: var(--sw-text-light);
}

.sw-btn-primary:hover:not(:disabled) {
  background: var(--sw-primary-hover);
}

.sw-btn-secondary {
  background: var(--sw-secondary);
  color: var(--sw-text-light);
}

.sw-btn-secondary:hover:not(:disabled) {
  background: var(--sw-secondary-hover);
}

.sw-btn-outline {
  border-color: var(--sw-border);
  color: var(--sw-text-primary);
}

.sw-btn-outline:hover:not(:disabled) {
  background: var(--sw-bg-tertiary);
}

.sw-btn-small {
  padding: var(--sw-spacing-xs) var(--sw-spacing-sm);
  font-size: 0.8rem;
}

.sw-btn-large {
  padding: var(--sw-spacing) var(--sw-spacing-lg);
  font-size: 1.1rem;
  font-weight: 600;
}

.sw-btn-icon {
  font-size: 1em;
}

.sw-btn-loading {
  animation: spin 1s linear infinite;
}

.sw-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sw-spacing);
  margin-top: var(--sw-spacing);
}

.sw-checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--sw-spacing-sm);
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--sw-text-primary);
}

.sw-checkbox-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.sw-checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--sw-border);
  border-radius: var(--sw-spacing-xs);
  position: relative;
  transition: var(--sw-transition);
}

.sw-checkbox-label input[type="checkbox"]:checked + .sw-checkmark {
  background: var(--sw-primary);
  border-color: var(--sw-primary);
}

.sw-checkbox-label input[type="checkbox"]:checked + .sw-checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.sw-status-display {
  display: flex;
  align-items: center;
  gap: var(--sw-spacing-sm);
  padding: var(--sw-spacing-sm) var(--sw-spacing);
  background: var(--sw-primary-light);
  border-radius: var(--sw-radius);
  font-size: 0.85rem;
  color: var(--sw-primary);
  margin-bottom: var(--sw-spacing);
}

.sw-status-icon {
  font-size: 1em;
}

.sw-action-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sw-spacing-sm);
  margin-top: var(--sw-spacing);
}

.sw-generate-section {
  text-align: center;
  padding: var(--sw-spacing-xl);
}

.sw-output-content {
  min-height: 200px;
  border: 1px solid var(--sw-border);
  border-radius: var(--sw-radius);
  background: var(--sw-bg-secondary);
}

.sw-output-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--sw-spacing-xl);
  color: var(--sw-text-secondary);
  text-align: center;
}

.sw-placeholder-icon {
  font-size: 3rem;
  margin-bottom: var(--sw-spacing);
  opacity: 0.5;
}

.sw-placeholder-help {
  font-size: 0.85rem;
  opacity: 0.7;
}

.sw-output-result {
  padding: var(--sw-spacing-lg);
  white-space: pre-wrap;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9rem;
  line-height: 1.6;
}

.sw-output-stats {
  display: flex;
  justify-content: space-around;
  padding: var(--sw-spacing);
  background: var(--sw-bg-tertiary);
  border-top: 1px solid var(--sw-border);
  font-size: 0.8rem;
}

.sw-stat-item {
  text-align: center;
}

.sw-stat-label {
  color: var(--sw-text-secondary);
}

.sw-stat-value {
  font-weight: 600;
  color: var(--sw-text-primary);
}

.sw-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.sw-loading-content {
  text-align: center;
  padding: var(--sw-spacing-xl);
}

.sw-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--sw-border-light);
  border-top: 4px solid var(--sw-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--sw-spacing);
}

.sw-loading-help {
  font-size: 0.85rem;
  color: var(--sw-text-secondary);
  margin-top: var(--sw-spacing-xs);
}

.sw-notification-container {
  position: fixed;
  top: var(--sw-spacing);
  right: var(--sw-spacing);
  z-index: 1100;
}

.sw-notification {
  background: var(--sw-bg-primary);
  border: 1px solid var(--sw-border);
  border-radius: var(--sw-radius);
  box-shadow: var(--sw-shadow-lg);
  padding: var(--sw-spacing);
  margin-bottom: var(--sw-spacing-sm);
  max-width: 350px;
  animation: slideIn 0.3s ease-out;
}

.sw-notification.success {
  border-left: 4px solid var(--sw-success);
}

.sw-notification.error {
  border-left: 4px solid var(--sw-danger);
}

.sw-notification.warning {
  border-left: 4px solid var(--sw-warning);
}

.hidden {
  display: none !important;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@media (max-width: 768px) {
  .sw-content { padding: var(--sw-spacing); }
  .sw-form-row { grid-template-columns: 1fr; }
  .sw-checkbox-group { flex-direction: column; gap: var(--sw-spacing-sm); }
  .sw-header { padding: var(--sw-spacing); }
  .sw-title { font-size: 1.25rem; }
}`;
  }

  // ===== Interface JavaScript =====
  function getInterfaceJavaScript() {
    return `(function() {
    'use strict';
    
    let isGenerating = false;
    let currentSettings = {};
    
    function initInterface() {
        console.log('[Story Weaver UI] Initializing interface');
        bindEventHandlers();
        loadCurrentSettings();
        console.log('[Story Weaver UI] Interface initialized');
    }
    
    function bindEventHandlers() {
        const generateBtn = document.getElementById('generate-outline');
        if (generateBtn) generateBtn.addEventListener('click', handleGenerate);
        
        const previewDataBtn = document.getElementById('preview-data');
        if (previewDataBtn) previewDataBtn.addEventListener('click', handlePreviewData);
        
        const refreshDataBtn = document.getElementById('refresh-data');
        if (refreshDataBtn) refreshDataBtn.addEventListener('click', handleRefreshData);
        
        const copyBtn = document.getElementById('copy-result');
        if (copyBtn) copyBtn.addEventListener('click', handleCopyResult);
        
        const saveBtn = document.getElementById('save-result');
        if (saveBtn) saveBtn.addEventListener('click', handleSaveResult);
        
        const sendToChatBtn = document.getElementById('send-to-chat');
        if (sendToChatBtn) sendToChatBtn.addEventListener('click', handleSendToChat);
        
        bindSettingsHandlers();
    }
    
    function bindSettingsHandlers() {
        const settingsElements = [
            'context-length', 'story-type', 'story-style', 'story-theme',
            'chapter-count', 'detail-level', 'special-requirements',
            'include-summary', 'include-characters', 'include-themes'
        ];
        
        settingsElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('change', handleSettingsChange);
        });
    }
    
    function loadCurrentSettings() {
        handleSettingsChange();
    }
    
    function handleSettingsChange() {
        currentSettings = {
            contextLength: parseInt(document.getElementById('context-length')?.value || 100),
            storyType: document.getElementById('story-type')?.value || 'fantasy',
            storyStyle: document.getElementById('story-style')?.value || 'detailed',
            storyTheme: document.getElementById('story-theme')?.value || '',
            chapterCount: parseInt(document.getElementById('chapter-count')?.value || 5),
            detailLevel: document.getElementById('detail-level')?.value || 'detailed',
            specialRequirements: document.getElementById('special-requirements')?.value || '',
            includeSummary: document.getElementById('include-summary')?.checked || false,
            includeCharacters: document.getElementById('include-characters')?.checked || false,
            includeThemes: document.getElementById('include-themes')?.checked || false
        };
        
        updateContextStatus();
        
        if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
                type: 'sw-settings-changed',
                settings: currentSettings
            }, '*');
        }
    }
    
    function updateContextStatus() {
        const statusElement = document.getElementById('context-status');
        if (!statusElement) return;
        
        const contextLength = currentSettings.contextLength;
        let statusText = '';
        
        if (contextLength === 0) {
            statusText = '不读取对话历史，仅基于世界书设定生成';
        } else {
            statusText = \`将读取最近 \${contextLength} 条消息作为上下文\`;
        }
        
        statusElement.textContent = statusText;
    }
    
    async function handleGenerate() {
        if (isGenerating) return;
        
        try {
            setGeneratingState(true);
            showNotification('开始生成故事大纲...', 'info');
            
            const startTime = Date.now();
            
            const result = await sendMessageToParent({
                type: 'sw-generate',
                settings: currentSettings
            });
            
            const endTime = Date.now();
            const generationTime = ((endTime - startTime) / 1000).toFixed(1);
            
            if (result.success) {
                displayResult(result.outline, generationTime);
                showNotification('故事大纲生成成功！', 'success');
            } else {
                throw new Error(result.error || '生成失败');
            }
            
        } catch (error) {
            console.error('[Story Weaver UI] Generation error:', error);
            showNotification(\`生成失败：\${error.message}\`, 'error');
        } finally {
            setGeneratingState(false);
        }
    }
    
    async function handlePreviewData() {
        try {
            showNotification('正在获取数据预览...', 'info');
            
            const result = await sendMessageToParent({
                type: 'sw-preview-data',
                settings: currentSettings
            });
            
            if (result.success) {
                displayDataPreview(result.data);
                showNotification('数据预览获取成功', 'success');
            } else {
                throw new Error(result.error || '获取预览失败');
            }
            
        } catch (error) {
            console.error('[Story Weaver UI] Preview error:', error);
            showNotification(\`获取预览失败：\${error.message}\`, 'error');
        }
    }
    
    async function handleRefreshData() {
        try {
            showNotification('正在刷新数据...', 'info');
            
            const result = await sendMessageToParent({
                type: 'sw-refresh-data'
            });
            
            if (result.success) {
                showNotification('数据刷新成功', 'success');
            } else {
                throw new Error(result.error || '刷新失败');
            }
            
        } catch (error) {
            console.error('[Story Weaver UI] Refresh error:', error);
            showNotification(\`刷新失败：\${error.message}\`, 'error');
        }
    }
    
    async function handleCopyResult() {
        const resultElement = document.getElementById('output-result');
        if (!resultElement || resultElement.classList.contains('hidden')) {
            showNotification('没有可复制的内容', 'warning');
            return;
        }
        
        try {
            const text = resultElement.textContent;
            await navigator.clipboard.writeText(text);
            showNotification('已复制到剪贴板', 'success');
        } catch (error) {
            const textArea = document.createElement('textarea');
            textArea.value = resultElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('已复制到剪贴板', 'success');
        }
    }
    
    async function handleSaveResult() {
        const resultElement = document.getElementById('output-result');
        if (!resultElement || resultElement.classList.contains('hidden')) {
            showNotification('没有可保存的内容', 'warning');
            return;
        }
        
        try {
            const content = resultElement.textContent;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = \`故事大纲_\${timestamp}.md\`;
            
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('文件保存成功', 'success');
        } catch (error) {
            console.error('[Story Weaver UI] Save error:', error);
            showNotification(\`保存失败：\${error.message}\`, 'error');
        }
    }
    
    async function handleSendToChat() {
        const resultElement = document.getElementById('output-result');
        if (!resultElement || resultElement.classList.contains('hidden')) {
            showNotification('没有可发送的内容', 'warning');
            return;
        }
        
        try {
            const content = resultElement.textContent;
            
            const result = await sendMessageToParent({
                type: 'sw-send-to-chat',
                content: content
            });
            
            if (result.success) {
                showNotification('已发送到聊天', 'success');
            } else {
                throw new Error(result.error || '发送失败');
            }
            
        } catch (error) {
            console.error('[Story Weaver UI] Send to chat error:', error);
            showNotification(\`发送失败：\${error.message}\`, 'error');
        }
    }
    
    function displayResult(outline, generationTime) {
        const placeholderElement = document.getElementById('output-placeholder');
        const resultElement = document.getElementById('output-result');
        const statsElement = document.getElementById('output-stats');
        
        if (placeholderElement) placeholderElement.classList.add('hidden');
        
        if (resultElement) {
            resultElement.textContent = outline;
            resultElement.classList.remove('hidden');
        }
        
        if (statsElement) {
            const wordCount = outline.length;
            const chapterCount = (outline.match(/#+\\s/g) || []).length;
            
            document.getElementById('word-count').textContent = wordCount;
            document.getElementById('generation-time').textContent = \`\${generationTime}s\`;
            document.getElementById('actual-chapters').textContent = chapterCount;
            
            statsElement.classList.remove('hidden');
        }
    }
    
    function displayDataPreview(data) {
        console.log('[Story Weaver UI] Data Preview:', data);
        alert(\`数据预览：\\n\\n世界书条目：\${data.worldbookEntries || 0}\\n角色信息：\${data.characterData ? '已获取' : '未获取'}\\n对话历史：\${data.chatHistory ? '已获取' : '未获取'}\`);
    }
    
    function setGeneratingState(generating) {
        isGenerating = generating;
        
        const generateBtn = document.getElementById('generate-outline');
        const loadingOverlay = document.getElementById('loading-overlay');
        const btnText = generateBtn?.querySelector('.sw-btn-text');
        const btnLoading = generateBtn?.querySelector('.sw-btn-loading');
        
        if (generateBtn) generateBtn.disabled = generating;
        if (loadingOverlay) loadingOverlay.classList.toggle('hidden', !generating);
        if (btnText && btnLoading) {
            btnText.classList.toggle('hidden', generating);
            btnLoading.classList.toggle('hidden', !generating);
        }
    }
    
    function sendMessageToParent(message) {
        return new Promise((resolve, reject) => {
            if (!window.parent || !window.parent.postMessage) {
                reject(new Error('无法与父脚本通信'));
                return;
            }
            
            const messageId = Date.now() + Math.random();
            message.messageId = messageId;
            
            const timeout = setTimeout(() => {
                reject(new Error('通信超时'));
            }, 30000);
            
            const handler = (event) => {
                if (event.data.messageId === messageId) {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handler);
                    resolve(event.data);
                }
            };
            
            window.addEventListener('message', handler);
            window.parent.postMessage(message, '*');
        });
    }
    
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = \`sw-notification \${type}\`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInterface);
    } else {
        initInterface();
    }
})();`;
  }

  /**
   * Handle messages from the interface
   */
  async function handleInterfaceMessage(event) {
    const { type, messageId, settings, content } = event.data;
    
    try {
      let result = { success: false, messageId };
      
      switch (type) {
        case 'sw-generate':
          result.outline = await generateStoryOutline(settings);
          result.success = true;
          break;
          
        case 'sw-preview-data':
          result.data = await getPreviewData(settings);
          result.success = true;
          break;
          
        case 'sw-refresh-data':
          result.success = true;
          break;
          
        case 'sw-send-to-chat':
          await TavernHelper.sendMessage(`**Story Weaver 生成结果：**\n\n${content}`, false);
          result.success = true;
          break;
          
        case 'sw-settings-changed':
          await saveSettings(settings);
          result.success = true;
          break;
          
        default:
          throw new Error(`Unknown message type: ${type}`);
      }
      
      if (event.source && event.source.postMessage) {
        event.source.postMessage(result, '*');
      }
      
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error handling interface message:`, error);
      
      if (event.source && event.source.postMessage) {
        event.source.postMessage({
          success: false,
          messageId,
          error: error.message
        }, '*');
      }
    }
  }

  /**
   * Get preview data for the interface
   */
  async function getPreviewData(settings) {
    const worldbookEntries = await getWorldbookEntries();
    const characterData = await getCharacterData();
    const chatHistory = await getChatHistory(settings.contextLength);
    
    return {
      worldbookEntries: worldbookEntries.split('\n\n').length,
      characterData: characterData.length > 0,
      chatHistory: chatHistory.length > 0,
      preview: {
        worldbook: worldbookEntries.substring(0, 200) + (worldbookEntries.length > 200 ? '...' : ''),
        character: characterData.substring(0, 200) + (characterData.length > 200 ? '...' : ''),
        chat: chatHistory.substring(0, 200) + (chatHistory.length > 200 ? '...' : '')
      }
    };
  }

  // ===== Initialize on Load =====
  if (typeof TavernHelper !== 'undefined') {
    initialize();
    
    // Set up message listener for interface communication
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleInterfaceMessage);
    }
  } else {
    console.error(`[${SCRIPT_NAME}] TavernHelper not available - make sure this script runs in TavernHelper context`);
  }

})();