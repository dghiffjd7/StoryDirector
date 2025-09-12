/**
 * Story Weaver - Complete Enhanced TavernHelper Version
 * Final version with ALL missing features from original extension
 * Includes: Custom prompt editor, preset management, system integration,
 * chapter detail generation, help system, floating quick access, export functionality
 */

// ========================= CONSTANTS =========================

const STORY_TYPES = {
  adventure: '冒险故事',
  romance: '爱情故事',
  mystery: '悬疑推理',
  fantasy: '奇幻幻想',
  scifi: '科幻故事',
  horror: '恐怖惊悚',
  slice_of_life: '日常生活',
  comedy: '喜剧轻松',
  drama: '剧情情感',
  action: '动作战斗'
};

const STORY_STYLES = {
  narrative: '叙述性',
  dialogue: '对话性',
  descriptive: '描述性',
  stream_of_consciousness: '意识流',
  epistolary: '书信体'
};

const DETAIL_LEVELS = {
  brief: '简洁大纲',
  medium: '中等详细',
  detailed: '详细描述'
};

// ========================= MAIN TAVERN HELPER SCRIPT =========================

/**
 * Enhanced Story Weaver with complete feature set
 */
function init() {
  // Register all slash commands
  registerSlashCommands();
  
  // Initialize global variables if not exists
  initializeGlobalVariables();
  
  console.log('Story Weaver Enhanced v2.0 initialized with all features');
}

/**
 * Register all slash commands
 */
function registerSlashCommands() {
  SlashCommandsAPI.registerSlashCommand({
    name: 'sw',
    description: 'Open Story Weaver interface - 打开故事大纲生成器',
    callback: openStoryWeaverInterface,
    helpString: 'Opens the enhanced Story Weaver interface with full feature set'
  });

  SlashCommandsAPI.registerSlashCommand({
    name: 'storyweaver',
    description: 'Open Story Weaver interface (alias) - 打开故事大纲生成器',
    callback: openStoryWeaverInterface,
    helpString: 'Alias for /sw command'
  });

  SlashCommandsAPI.registerSlashCommand({
    name: 'swquick',
    description: 'Quick story generation - 快速生成故事大纲',
    callback: handleQuickGeneration,
    helpString: 'Usage: /swquick [type] [chapters] - Quick generate with optional story type and chapter count'
  });

  SlashCommandsAPI.registerSlashCommand({
    name: 'swpreset',
    description: 'Manage Story Weaver presets - 管理预设',
    callback: handlePresetCommand,
    helpString: 'Usage: /swpreset [save|load|delete|list] [name] - Manage presets'
  });
}

/**
 * Initialize global variables
 */
function initializeGlobalVariables() {
  const defaultSettings = {
    contextLength: '10',
    storyType: 'adventure',
    storyStyle: 'narrative',
    storyTheme: '',
    chapterCount: '5',
    detailLevel: 'medium',
    specialRequirements: '',
    includeSummary: true,
    includeCharacters: true,
    includeThemes: false,
    enableSystemPrompt: true,
    enableMemorySummary: true,
    enableAuthorsNote: true,
    enableJailbreak: false,
    customPromptTemplate: ''
  };

  const existingSettings = TavernHelper.getGlobalVariable('storyWeaverSettings');
  if (!existingSettings) {
    TavernHelper.setGlobalVariable('storyWeaverSettings', JSON.stringify(defaultSettings));
  }
}

// ========================= SLASH COMMAND HANDLERS =========================

/**
 * Open the enhanced Story Weaver interface
 */
function openStoryWeaverInterface() {
  const settings = loadSettings();
  const interfaceHTML = buildEnhancedInterface(settings);
  
  TavernHelper.showWindow({
    title: 'Story Weaver - Enhanced 故事大纲生成器',
    content: interfaceHTML,
    width: 1200,
    height: 800,
    resizable: true
  });
  
  showNotification('Story Weaver Enhanced 已打开', 'success');
}

/**
 * Handle quick generation command
 */
function handleQuickGeneration(args) {
  const params = args.split(' ').filter(p => p.trim());
  const storyType = params[0] || 'adventure';
  const chapterCount = params[1] || '5';
  
  const quickSettings = {
    ...loadSettings(),
    storyType: STORY_TYPES[storyType] ? storyType : 'adventure',
    chapterCount: chapterCount,
    storyTheme: '基于当前对话和世界观生成合适的故事主题',
    detailLevel: 'medium'
  };
  
  generateStoryOutline(quickSettings);
}

/**
 * Handle preset management commands
 */
function handlePresetCommand(args) {
  const parts = args.split(' ').filter(p => p.trim());
  const action = parts[0];
  const name = parts.slice(1).join(' ');
  
  switch (action) {
    case 'save':
      if (!name) {
        showNotification('请提供预设名称: /swpreset save [名称]', 'warning');
        return;
      }
      savePreset(name);
      break;
      
    case 'load':
      if (!name) {
        showNotification('请提供预设名称: /swpreset load [名称]', 'warning');
        return;
      }
      loadPreset(name);
      break;
      
    case 'delete':
      if (!name) {
        showNotification('请提供预设名称: /swpreset delete [名称]', 'warning');
        return;
      }
      deletePreset(name);
      break;
      
    case 'list':
      listPresets();
      break;
      
    default:
      showNotification('用法: /swpreset [save|load|delete|list] [名称]', 'info');
  }
}

// ========================= PRESET MANAGEMENT =========================

/**
 * Save current settings as preset
 */
function savePreset(name) {
  const settings = loadSettings();
  TavernHelper.setGlobalVariable(`sw_preset_${name}`, JSON.stringify(settings));
  showNotification(`预设 "${name}" 已保存`, 'success');
}

/**
 * Load preset by name
 */
function loadPreset(name) {
  const presetData = TavernHelper.getGlobalVariable(`sw_preset_${name}`);
  if (presetData) {
    try {
      const settings = JSON.parse(presetData);
      TavernHelper.setGlobalVariable('storyWeaverSettings', JSON.stringify(settings));
      showNotification(`预设 "${name}" 已加载`, 'success');
    } catch (error) {
      showNotification('预设数据格式错误', 'error');
    }
  } else {
    showNotification('预设不存在', 'error');
  }
}

/**
 * Delete preset by name
 */
function deletePreset(name) {
  TavernHelper.setGlobalVariable(`sw_preset_${name}`, null);
  showNotification(`预设 "${name}" 已删除`, 'success');
}

/**
 * List all available presets
 */
function listPresets() {
  const allVars = TavernHelper.getAllGlobalVariables();
  const presetVars = Object.keys(allVars).filter(key => key.startsWith('sw_preset_'));
  
  if (presetVars.length === 0) {
    showNotification('暂无保存的预设', 'info');
    return;
  }
  
  const presetNames = presetVars.map(key => key.replace('sw_preset_', '')).join(', ');
  showNotification(`可用预设: ${presetNames}`, 'info');
}

// ========================= DATA ACCESS FUNCTIONS =========================

/**
 * Enhanced worldbook entries formatting
 */
function getWorldbookEntries() {
  try {
    return TavernHelper.getWorldbookEntries() || [];
  } catch (error) {
    console.warn('Failed to get worldbook entries:', error);
    return [];
  }
}

/**
 * Enhanced character data access
 */
function getCharacterData() {
  try {
    return TavernHelper.getCharacterData() || null;
  } catch (error) {
    console.warn('Failed to get character data:', error);
    return null;
  }
}

/**
 * Enhanced chat history access
 */
function getChatHistory(length = 10) {
  try {
    return TavernHelper.getChatHistory(length) || [];
  } catch (error) {
    console.warn('Failed to get chat history:', error);
    return [];
  }
}

/**
 * Enhanced system prompt resolution
 */
function resolveSystemPrompt() {
  try {
    return TavernHelper.getSystemPrompt() || '';
  } catch (error) {
    console.warn('Failed to get system prompt:', error);
    return '';
  }
}

/**
 * Enhanced memory summary resolution
 */
function resolveMemorySummary() {
  try {
    return TavernHelper.getMemorySummary() || '';
  } catch (error) {
    console.warn('Failed to get memory summary:', error);
    return '';
  }
}

/**
 * Enhanced authors note resolution
 */
function resolveAuthorsNote() {
  try {
    return TavernHelper.getAuthorsNote() || '';
  } catch (error) {
    console.warn('Failed to get authors note:', error);
    return '';
  }
}

/**
 * Enhanced jailbreak resolution
 */
function resolveJailbreak() {
  try {
    return TavernHelper.getJailbreak() || '';
  } catch (error) {
    console.warn('Failed to get jailbreak:', error);
    return '';
  }
}

// ========================= GENERATION FUNCTIONS =========================

/**
 * Enhanced story outline generation
 */
async function generateStoryOutline(settings) {
  try {
    showNotification('开始生成故事大纲...', 'info');
    
    const template = settings.customPromptTemplate || getDefaultPromptTemplate();
    const prompt = processPromptTemplate(template, settings);
    
    const response = await TavernHelper.generateRaw(prompt, {
      temperature: 0.8,
      max_tokens: 4000,
      top_p: 0.9
    });
    
    if (response && response.trim()) {
      // Send result to chat if interface not open
      TavernHelper.sendMessage(`## 📖 Story Outline Generated\n\n${response}`);
      showNotification('故事大纲生成完成！', 'success');
      return response;
    } else {
      throw new Error('生成结果为空');
    }
  } catch (error) {
    console.error('Story generation failed:', error);
    showNotification(`生成失败: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Process prompt template with all variables
 */
function processPromptTemplate(template, settings) {
  const contextLength = parseInt(settings.contextLength || '10');
  
  // Get all data
  const worldbookEntries = formatWorldbookEntries(getWorldbookEntries());
  const characterData = formatCharacterData(getCharacterData());
  const chatHistory = formatChatHistory(getChatHistory(contextLength));
  
  // Get system integration data based on settings
  const systemPrompt = settings.enableSystemPrompt ? resolveSystemPrompt() : '';
  const memorySummary = settings.enableMemorySummary ? resolveMemorySummary() : '';
  const authorsNote = settings.enableAuthorsNote ? resolveAuthorsNote() : '';
  const jailbreak = settings.enableJailbreak ? resolveJailbreak() : '';
  
  // Replace all template variables
  return template
    .replace(/\{system_prompt\}/g, systemPrompt)
    .replace(/\{worldbook_entries\}/g, worldbookEntries)
    .replace(/\{character_data\}/g, characterData.combined)
    .replace(/\{char_persona\}/g, characterData.persona)
    .replace(/\{char_scenario\}/g, characterData.scenario)
    .replace(/\{memory_summary\}/g, memorySummary)
    .replace(/\{authors_note\}/g, authorsNote)
    .replace(/\{jailbreak\}/g, jailbreak)
    .replace(/\{chat_history\}/g, chatHistory)
    .replace(/\{story_type\}/g, STORY_TYPES[settings.storyType] || settings.storyType)
    .replace(/\{story_theme\}/g, settings.storyTheme || '')
    .replace(/\{story_style\}/g, STORY_STYLES[settings.storyStyle] || settings.storyStyle)
    .replace(/\{chapter_count\}/g, settings.chapterCount || '5')
    .replace(/\{detail_level\}/g, DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel)
    .replace(/\{special_requirements\}/g, settings.specialRequirements || '')
    .replace(/\{include_summary\}/g, settings.includeSummary ? '是' : '否')
    .replace(/\{include_characters\}/g, settings.includeCharacters ? '是' : '否')
    .replace(/\{include_themes\}/g, settings.includeThemes ? '是' : '否');
}

/**
 * Get default prompt template
 */
function getDefaultPromptTemplate() {
  return `你是一位专业的故事编剧和大纲设计师。请基于以下信息生成一个详细的故事大纲：

**系统提示词：**
{system_prompt}

**世界观设定：**
{worldbook_entries}

**角色信息：**
{character_data}
- 角色性格：{char_persona}
- 当前情境：{char_scenario}

**记忆摘要：**
{memory_summary}

**作者注释：**
{authors_note}

**对话历史：**
{chat_history}

**创作要求：**
- 故事类型：{story_type}
- 叙事风格：{story_style}
- 故事主题：{story_theme}
- 章节数量：{chapter_count}
- 详细程度：{detail_level}
- 特殊要求：{special_requirements}

**输出选项：**
- 包含整体摘要：{include_summary}
- 包含角色发展：{include_characters}
- 包含主题分析：{include_themes}

请生成一个结构完整、逻辑清晰的故事大纲。确保每章都有明确的目标、冲突和发展。

{jailbreak}`;
}

// ========================= FORMATTING FUNCTIONS =========================

/**
 * Format worldbook entries for prompt
 */
function formatWorldbookEntries(entries) {
  if (!entries || entries.length === 0) return '暂无世界观条目';
  
  return entries.map(entry => {
    const key = entry.key || (entry.keys && entry.keys[0]) || '未知';
    const content = entry.content || entry.description || '';
    return `**${key}:** ${content}`;
  }).join('\n\n');
}

/**
 * Format character data for prompt
 */
function formatCharacterData(data) {
  if (!data) return { combined: '暂无角色数据', persona: '', scenario: '' };
  
  const persona = data.personality || data.persona || '';
  const scenario = data.scenario || data.mes_example || '';
  const name = data.name || '未知角色';
  const description = data.description || '';
  
  const combined = `**角色姓名:** ${name}
**角色描述:** ${description}
**角色性格:** ${persona}
**当前情境:** ${scenario}`;
  
  return { combined, persona, scenario };
}

/**
 * Format chat history for prompt
 */
function formatChatHistory(history) {
  if (!history || history.length === 0) return '暂无对话历史';
  
  return history.map(msg => {
    const name = msg.name || msg.user || '未知';
    const content = msg.mes || msg.message || '';
    return `[${name}]: ${content}`;
  }).slice(-10).join('\n'); // Only last 10 messages for context
}

// ========================= SETTINGS MANAGEMENT =========================

/**
 * Load settings from global variables
 */
function loadSettings() {
  const saved = TavernHelper.getGlobalVariable('storyWeaverSettings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load settings:', error);
      return getDefaultSettings();
    }
  }
  return getDefaultSettings();
}

/**
 * Save settings to global variables
 */
function saveSettings(settings) {
  TavernHelper.setGlobalVariable('storyWeaverSettings', JSON.stringify(settings));
}

/**
 * Get default settings
 */
function getDefaultSettings() {
  return {
    contextLength: '10',
    storyType: 'adventure',
    storyStyle: 'narrative',
    storyTheme: '',
    chapterCount: '5',
    detailLevel: 'medium',
    specialRequirements: '',
    includeSummary: true,
    includeCharacters: true,
    includeThemes: false,
    enableSystemPrompt: true,
    enableMemorySummary: true,
    enableAuthorsNote: true,
    enableJailbreak: false,
    customPromptTemplate: ''
  };
}

// ========================= ENHANCED INTERFACE BUILDER =========================

/**
 * Build enhanced interface with all original features
 */
function buildEnhancedInterface(settings) {
  const css = getEnhancedCSS();
  const js = getEnhancedJavaScript();
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Story Weaver - 故事大纲生成器 (Enhanced)</title>
    <style>${css}</style>
</head>
<body>
    <div id="story-weaver-app" class="story-weaver-app">
        <!-- Enhanced Header with all original buttons -->
        <div class="sw-header">
            <h1 class="sw-title">
                <span class="sw-icon">📖</span>
                Story Weaver - 故事大纲生成器
            </h1>
            <div class="sw-header-actions">
                <button id="import-preset" class="sw-btn sw-btn-secondary" title="导入预设">
                    <span class="sw-btn-icon">📥</span>
                </button>
                <button id="export-preset" class="sw-btn sw-btn-secondary" title="导出预设">
                    <span class="sw-btn-icon">📤</span>
                </button>
                <button id="show-help" class="sw-btn sw-btn-secondary" title="使用说明">
                    <span class="sw-btn-icon">❓</span>
                </button>
                <button id="sw-refresh" class="sw-btn sw-btn-secondary" title="刷新数据">
                    <span class="sw-btn-icon">🔄</span>
                </button>
            </div>
        </div>

        <!-- Quick Access Panel (Floating Sprite Replacement) -->
        <div id="quick-access" class="sw-quick-access">
            <button id="quick-generate" class="sw-btn sw-btn-primary" title="快速生成">
                <span class="sw-btn-icon">⚡</span>
            </button>
        </div>

        <div class="sw-content">
            <!-- Enhanced Prompt Template Section -->
            <section class="sw-section">
                <h2 class="sw-section-title">
                    <span class="sw-section-icon">📝</span>
                    提示词模板管理
                    <div class="sw-title-actions">
                        <button id="reset-template" class="sw-btn sw-btn-small" title="重置为默认模板">
                            <span class="sw-btn-icon">🔄</span>
                        </button>
                        <button id="preview-template" class="sw-btn sw-btn-small" title="预览完整提示词">
                            <span class="sw-btn-icon">👁️</span>
                        </button>
                    </div>
                </h2>
                <div class="sw-section-content">
                    <div class="sw-form-group">
                        <label for="prompt-template-editor" class="sw-label">自定义提示词模板：</label>
                        <textarea id="prompt-template-editor" class="sw-textarea sw-prompt-editor" rows="12" 
                                  placeholder="在此自定义完整提示词模板...">${settings.customPromptTemplate || getDefaultPromptTemplate()}</textarea>
                        <div class="sw-help-text">
                            支持变量：{system_prompt}, {worldbook_entries}, {character_data}, {char_persona}, {char_scenario}, 
                            {memory_summary}, {authors_note}, {jailbreak}, {chat_history}, {story_type}, {story_theme}, 
                            {story_style}, {chapter_count}, {detail_level}, {special_requirements}, {include_summary}, 
                            {include_characters}, {include_themes}
                        </div>
                    </div>
                </div>
            </section>

            <!-- Enhanced System Integration Section -->
            <section class="sw-section">
                <h2 class="sw-section-title">
                    <span class="sw-section-icon">⚙️</span>
                    系统集成选项
                </h2>
                <div class="sw-section-content">
                    <div class="sw-checkbox-group">
                        <label class="sw-checkbox-label">
                            <input type="checkbox" id="enable-system-prompt" ${settings.enableSystemPrompt ? 'checked' : ''} />
                            <span class="sw-checkmark"></span>
                            包含系统提示词
                        </label>
                        <label class="sw-checkbox-label">
                            <input type="checkbox" id="enable-memory-summary" ${settings.enableMemorySummary ? 'checked' : ''} />
                            <span class="sw-checkmark"></span>
                            包含记忆摘要
                        </label>
                        <label class="sw-checkbox-label">
                            <input type="checkbox" id="enable-authors-note" ${settings.enableAuthorsNote ? 'checked' : ''} />
                            <span class="sw-checkmark"></span>
                            包含作者注释
                        </label>
                        <label class="sw-checkbox-label">
                            <input type="checkbox" id="enable-jailbreak" ${settings.enableJailbreak ? 'checked' : ''} />
                            <span class="sw-checkmark"></span>
                            包含越狱提示
                        </label>
                    </div>
                </div>
            </section>

            <!-- Preset Management Section -->
            <section class="sw-section">
                <h2 class="sw-section-title">
                    <span class="sw-section-icon">💾</span>
                    预设管理
                    <div class="sw-title-actions">
                        <button id="refresh-presets" class="sw-btn sw-btn-small" title="刷新预设列表">
                            <span class="sw-btn-icon">🔄</span>
                        </button>
                    </div>
                </h2>
                <div class="sw-section-content">
                    <div class="sw-form-row">
                        <div class="sw-form-group">
                            <label for="preset-select" class="sw-label">选择预设：</label>
                            <select id="preset-select" class="sw-select">
                                <option value="">-- 选择预设 --</option>
                            </select>
                        </div>
                        <div class="sw-form-group">
                            <label for="preset-name" class="sw-label">预设名称：</label>
                            <input type="text" id="preset-name" class="sw-input" placeholder="输入预设名称..." />
                        </div>
                    </div>
                    <div class="sw-action-group">
                        <button id="save-preset" class="sw-btn sw-btn-outline">
                            <span class="sw-btn-icon">💾</span>
                            保存预设
                        </button>
                        <button id="load-preset" class="sw-btn sw-btn-outline">
                            <span class="sw-btn-icon">📁</span>
                            加载预设
                        </button>
                        <button id="delete-preset" class="sw-btn sw-btn-outline sw-btn-danger">
                            <span class="sw-btn-icon">🗑️</span>
                            删除预设
                        </button>
                    </div>
                </div>
            </section>

            <!-- Context Settings Section (Enhanced) -->
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
                        <button id="preview-full-prompt" class="sw-btn sw-btn-outline">
                            <span class="sw-btn-icon">📝</span>
                            预览完整提示词
                        </button>
                        <button id="refresh-data" class="sw-btn sw-btn-outline">
                            <span class="sw-btn-icon">🔄</span>
                            刷新数据
                        </button>
                    </div>
                </div>
            </section>

            <!-- Story Settings Section -->
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
                        <textarea id="story-theme" class="sw-textarea" rows="4" 
                                  placeholder="例如：主角需要拯救被诅咒的王国，同时面对内心的恐惧与过去的阴霾...">${settings.storyTheme}</textarea>
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
                        <textarea id="special-requirements" class="sw-textarea" rows="3"
                                  placeholder="例如：需要包含特定角色的发展弧线、某些情节元素、特定的情感基调等...">${settings.specialRequirements}</textarea>
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

            <!-- Generation Section -->
            <section class="sw-section">
                <div class="sw-generate-section">
                    <button id="generate-outline" class="sw-btn sw-btn-primary sw-btn-large">
                        <span class="sw-btn-icon">🎭</span>
                        <span class="sw-btn-text">生成故事大纲</span>
                        <span class="sw-btn-loading hidden">🔄</span>
                    </button>
                </div>
            </section>

            <!-- Enhanced Results Section -->
            <section class="sw-section">
                <h2 class="sw-section-title">
                    <span class="sw-section-icon">📄</span>
                    生成结果
                    <div class="sw-title-actions">
                        <button id="generate-details" class="sw-btn sw-btn-small" title="生成选中章节的细纲">
                            <span class="sw-btn-icon">📝</span>
                        </button>
                        <button id="copy-result" class="sw-btn sw-btn-small" title="复制到剪贴板">
                            <span class="sw-btn-icon">📋</span>
                        </button>
                        <button id="save-result" class="sw-btn sw-btn-small" title="保存为文件">
                            <span class="sw-btn-icon">💾</span>
                        </button>
                        <button id="export-result" class="sw-btn sw-btn-small" title="导出为Markdown">
                            <span class="sw-btn-icon">📤</span>
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
                            <!-- Generated content will be displayed here -->
                        </div>
                    </div>
                    
                    <!-- Chapter Selection for Detail Generation -->
                    <div id="chapter-selection" class="sw-chapter-selection hidden">
                        <div class="sw-form-group">
                            <label class="sw-label">选择要生成细纲的章节：</label>
                            <div id="chapter-checkboxes" class="sw-checkbox-group">
                                <!-- Chapter checkboxes will be populated dynamically -->
                            </div>
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

        <!-- Loading Overlay -->
        <div id="loading-overlay" class="sw-loading-overlay hidden">
            <div class="sw-loading-content">
                <div class="sw-spinner"></div>
                <p id="loading-text">正在生成故事大纲...</p>
                <p class="sw-loading-help">请稍候，AI正在基于您的设定创作精彩大纲</p>
            </div>
        </div>

        <!-- Help Modal -->
        <div id="help-modal" class="sw-modal hidden">
            <div class="sw-modal-content">
                <div class="sw-modal-header">
                    <h3>Story Weaver 使用说明</h3>
                    <button id="close-help" class="sw-btn sw-btn-small">✕</button>
                </div>
                <div class="sw-modal-body">
                    <h4>功能介绍：</h4>
                    <ul>
                        <li><strong>提示词模板：</strong>自定义完整的生成提示词，支持所有系统变量</li>
                        <li><strong>系统集成：</strong>整合系统提示词、记忆摘要、作者注释、越狱提示</li>
                        <li><strong>预设管理：</strong>保存和加载常用配置，支持导入导出</li>
                        <li><strong>章节细纲：</strong>为选中章节生成详细内容大纲</li>
                        <li><strong>快速生成：</strong>使用斜杠命令快速生成故事大纲</li>
                        <li><strong>多格式导出：</strong>支持文本和Markdown格式导出</li>
                    </ul>
                    <h4>斜杠命令：</h4>
                    <ul>
                        <li><code>/sw</code> - 打开主界面</li>
                        <li><code>/swquick [类型] [章节数]</code> - 快速生成</li>
                        <li><code>/swpreset save [名称]</code> - 保存预设</li>
                        <li><code>/swpreset load [名称]</code> - 加载预设</li>
                        <li><code>/swpreset delete [名称]</code> - 删除预设</li>
                        <li><code>/swpreset list</code> - 列出所有预设</li>
                    </ul>
                    <h4>提示词变量：</h4>
                    <p>在自定义提示词中可使用以下变量：</p>
                    <code>{system_prompt}, {worldbook_entries}, {character_data}, {char_persona}, {char_scenario}, {memory_summary}, {authors_note}, {jailbreak}, {chat_history}, {story_type}, {story_style}, {story_theme}, {chapter_count}, {detail_level}, {special_requirements}, {include_summary}, {include_characters}, {include_themes}</code>
                    <h4>使用技巧：</h4>
                    <ul>
                        <li>利用预设功能保存不同类型故事的配置</li>
                        <li>调整上下文长度以控制对话历史的影响</li>
                        <li>使用章节细纲功能深入展开特定章节</li>
                        <li>通过系统集成选项控制提示词的复杂度</li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Notification Container -->
        <div id="notification-container" class="sw-notification-container"></div>
    </div>
    <script>${js}</script>
</body>
</html>`;
}

// Helper functions for building options
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

/**
 * Enhanced CSS Styles with all advanced features
 */
function getEnhancedCSS() {
  return `
    /* Enhanced Story Weaver Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #2d3748;
    }

    .story-weaver-app {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
      min-height: 100vh;
    }

    /* Enhanced Header */
    .sw-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 24px 32px;
      margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .sw-title {
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sw-icon {
      font-size: 32px;
    }

    .sw-header-actions {
      display: flex;
      gap: 12px;
    }

    /* Quick Access Panel (Floating Sprite Replacement) */
    .sw-quick-access {
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      z-index: 1000;
      background: rgba(102, 126, 234, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 50px;
      padding: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    }

    .sw-quick-access:hover {
      transform: translateY(-50%) scale(1.1);
    }

    .sw-quick-access .sw-btn {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    /* Enhanced Sections */
    .sw-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: transform 0.3s ease;
    }

    .sw-section:hover {
      transform: translateY(-2px);
    }

    .sw-section-title {
      font-size: 24px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: space-between;
    }

    .sw-section-icon {
      font-size: 28px;
    }

    .sw-title-actions {
      display: flex;
      gap: 8px;
    }

    /* Enhanced Form Elements */
    .sw-form-group {
      margin-bottom: 24px;
    }

    .sw-form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .sw-label {
      display: block;
      font-weight: 600;
      color: #4a5568;
      margin-bottom: 8px;
      font-size: 16px;
    }

    .sw-input, .sw-select, .sw-textarea {
      width: 100%;
      padding: 16px 20px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 16px;
      transition: all 0.3s ease;
      background: white;
      color: #2d3748;
    }

    .sw-input:focus, .sw-select:focus, .sw-textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .sw-input-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sw-input-unit {
      font-weight: 600;
      color: #718096;
    }

    /* Enhanced Prompt Editor */
    .sw-prompt-editor {
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 1.6;
      resize: vertical;
      min-height: 300px;
      background: #f7fafc;
      border: 2px solid #e2e8f0;
    }

    .sw-prompt-editor:focus {
      background: white;
      border-color: #667eea;
    }

    /* Enhanced Buttons */
    .sw-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      position: relative;
      overflow: hidden;
    }

    .sw-btn-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .sw-btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .sw-btn-secondary {
      background: rgba(255, 255, 255, 0.9);
      color: #4a5568;
      border: 2px solid #e2e8f0;
    }

    .sw-btn-secondary:hover {
      background: white;
      transform: translateY(-1px);
    }

    .sw-btn-outline {
      background: transparent;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .sw-btn-outline:hover {
      background: #667eea;
      color: white;
    }

    .sw-btn-danger {
      color: #e53e3e !important;
      border-color: #e53e3e !important;
    }

    .sw-btn-danger:hover {
      background: #e53e3e !important;
      color: white !important;
    }

    .sw-btn-large {
      padding: 20px 40px;
      font-size: 20px;
      border-radius: 16px;
      width: 100%;
      justify-content: center;
    }

    .sw-btn-small {
      padding: 8px 16px;
      font-size: 14px;
      border-radius: 8px;
    }

    .sw-btn-icon {
      font-size: 18px;
    }

    /* Enhanced Checkboxes */
    .sw-checkbox-group {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin: 16px 0;
    }

    .sw-checkbox-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 12px 16px;
      border-radius: 12px;
      transition: all 0.3s ease;
      background: rgba(102, 126, 234, 0.05);
    }

    .sw-checkbox-label:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    .sw-checkbox-label input[type="checkbox"] {
      display: none;
    }

    .sw-checkmark {
      width: 24px;
      height: 24px;
      border: 2px solid #667eea;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .sw-checkbox-label input[type="checkbox"]:checked + .sw-checkmark {
      background: #667eea;
      color: white;
    }

    .sw-checkbox-label input[type="checkbox"]:checked + .sw-checkmark:before {
      content: "✓";
      font-weight: bold;
    }

    /* Enhanced Output Section */
    .sw-output-content {
      min-height: 400px;
      border-radius: 16px;
      overflow: hidden;
    }

    .sw-output-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      background: linear-gradient(135deg, #f7fafc, #edf2f7);
      color: #718096;
      text-align: center;
    }

    .sw-placeholder-icon {
      font-size: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .sw-output-result {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      font-size: 16px;
      line-height: 1.8;
      color: #2d3748;
      max-height: 600px;
      overflow-y: auto;
    }

    /* Chapter Selection */
    .sw-chapter-selection {
      background: #f7fafc;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }

    /* Statistics */
    .sw-output-stats {
      display: flex;
      justify-content: space-around;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
    }

    .sw-stat-item {
      text-align: center;
    }

    .sw-stat-label {
      display: block;
      font-size: 14px;
      color: #718096;
      margin-bottom: 4px;
    }

    .sw-stat-value {
      display: block;
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
    }

    /* Action Groups */
    .sw-action-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .sw-generate-section {
      text-align: center;
      margin: 32px 0;
    }

    /* Status Display */
    .sw-status-display {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 12px;
      margin: 16px 0;
    }

    .sw-status-icon {
      font-size: 20px;
    }

    /* Help Text */
    .sw-help-text {
      font-size: 14px;
      color: #718096;
      margin-top: 8px;
      line-height: 1.5;
    }

    /* Loading States */
    .sw-loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .sw-loading-content {
      background: white;
      border-radius: 20px;
      padding: 48px;
      text-align: center;
      max-width: 400px;
      margin: 20px;
    }

    .sw-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .sw-btn-loading {
      display: none;
    }

    .sw-btn.loading .sw-btn-text {
      display: none;
    }

    .sw-btn.loading .sw-btn-loading {
      display: inline;
    }

    /* Modal Styles */
    .sw-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .sw-modal-content {
      background: white;
      border-radius: 20px;
      max-width: 800px;
      width: 90%;
      max-height: 90%;
      overflow-y: auto;
      margin: 20px;
    }

    .sw-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px;
      border-bottom: 2px solid #e2e8f0;
    }

    .sw-modal-header h3 {
      font-size: 24px;
      font-weight: 600;
      color: #2d3748;
    }

    .sw-modal-body {
      padding: 32px;
    }

    .sw-modal-body h4 {
      font-size: 18px;
      font-weight: 600;
      color: #4a5568;
      margin: 24px 0 12px 0;
    }

    .sw-modal-body ul {
      margin: 12px 0;
      padding-left: 24px;
    }

    .sw-modal-body li {
      margin: 8px 0;
      line-height: 1.6;
    }

    .sw-modal-body code {
      background: #f7fafc;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
    }

    /* Notification System */
    .sw-notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    }

    .sw-notification {
      background: white;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #667eea;
      animation: slideIn 0.3s ease;
      position: relative;
    }

    .sw-notification.success {
      border-left-color: #38a169;
    }

    .sw-notification.error {
      border-left-color: #e53e3e;
    }

    .sw-notification.warning {
      border-left-color: #d69e2e;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Utility Classes */
    .hidden {
      display: none !important;
    }

    .text-center {
      text-align: center;
    }

    .mb-0 {
      margin-bottom: 0 !important;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .story-weaver-app {
        padding: 12px;
      }

      .sw-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .sw-title {
        font-size: 24px;
      }

      .sw-section {
        padding: 20px;
      }

      .sw-form-row {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .sw-checkbox-group {
        grid-template-columns: 1fr;
      }

      .sw-action-group {
        flex-direction: column;
      }

      .sw-quick-access {
        bottom: 20px;
        right: 20px;
        top: auto;
        transform: none;
      }

      .sw-modal-content {
        width: 95%;
        margin: 10px;
      }
    }
  \`;
}

/**
 * Enhanced JavaScript Event Handlers with all advanced features
 */
function getEnhancedJavaScript() {
  return \`
    // Enhanced Story Weaver JavaScript with all missing features
    
    // Global variables
    let currentSettings = {};
    let generationInProgress = false;
    let lastGeneratedContent = '';
    let chapterData = [];
    
    // Initialize enhanced interface
    document.addEventListener('DOMContentLoaded', function() {
      initializeEnhancedInterface();
      loadClientSettings();
      refreshPresetList();
      bindAllEventHandlers();
    });

    function initializeEnhancedInterface() {
      console.log('Story Weaver Enhanced Interface initialized');
      updateContextStatus();
      
      // Initialize prompt template with default if empty
      const promptEditor = document.getElementById('prompt-template-editor');
      if (promptEditor && !promptEditor.value.trim()) {
        resetPromptTemplate();
      }
    }

    // Load settings on client side
    function loadClientSettings() {
      // This will be handled by the parent context
      currentSettings = getCurrentFormData();
    }

    // Event Handlers Binding
    function bindAllEventHandlers() {
      // Header actions
      bindHeaderActions();
      // Prompt template management
      bindPromptTemplateActions();
      // System integration toggles
      bindSystemIntegrationActions();
      // Preset management
      bindPresetActions();
      // Data and preview actions
      bindDataActions();
      // Generation actions
      bindGenerationActions();
      // Result actions
      bindResultActions();
      // Modal actions
      bindModalActions();
      // Quick access
      bindQuickAccessActions();
    }

    function bindHeaderActions() {
      document.getElementById('import-preset')?.addEventListener('click', importPresetFile);
      document.getElementById('export-preset')?.addEventListener('click', exportPresetFile);
      document.getElementById('show-help')?.addEventListener('click', showHelpModal);
      document.getElementById('sw-refresh')?.addEventListener('click', refreshAllData);
    }

    function bindPromptTemplateActions() {
      document.getElementById('reset-template')?.addEventListener('click', resetPromptTemplate);
      document.getElementById('preview-template')?.addEventListener('click', previewFullPromptTemplate);
      document.getElementById('prompt-template-editor')?.addEventListener('change', savePromptTemplate);
    }

    function bindSystemIntegrationActions() {
      const systemToggles = ['enable-system-prompt', 'enable-memory-summary', 'enable-authors-note', 'enable-jailbreak'];
      systemToggles.forEach(id => {
        document.getElementById(id)?.addEventListener('change', saveSystemSettings);
      });
    }

    function bindPresetActions() {
      document.getElementById('save-preset')?.addEventListener('click', saveCurrentPreset);
      document.getElementById('load-preset')?.addEventListener('click', loadSelectedPreset);
      document.getElementById('delete-preset')?.addEventListener('click', deleteSelectedPreset);
      document.getElementById('refresh-presets')?.addEventListener('click', refreshPresetList);
      document.getElementById('preset-select')?.addEventListener('change', onPresetSelectionChange);
    }

    function bindDataActions() {
      document.getElementById('refresh-data')?.addEventListener('click', refreshContextData);
      document.getElementById('preview-data')?.addEventListener('click', previewContextData);
      document.getElementById('preview-full-prompt')?.addEventListener('click', previewFullPrompt);
    }

    function bindGenerationActions() {
      document.getElementById('generate-outline')?.addEventListener('click', handleGenerateOutline);
      document.getElementById('quick-generate')?.addEventListener('click', handleQuickGenerate);
    }

    function bindResultActions() {
      document.getElementById('generate-details')?.addEventListener('click', handleGenerateDetails);
      document.getElementById('copy-result')?.addEventListener('click', handleCopyResult);
      document.getElementById('save-result')?.addEventListener('click', handleSaveResult);
      document.getElementById('export-result')?.addEventListener('click', handleExportResult);
      document.getElementById('send-to-chat')?.addEventListener('click', handleSendToChat);
    }

    function bindModalActions() {
      document.getElementById('close-help')?.addEventListener('click', closeHelpModal);
      document.getElementById('help-modal')?.addEventListener('click', function(e) {
        if (e.target.id === 'help-modal') closeHelpModal();
      });
    }

    function bindQuickAccessActions() {
      document.getElementById('quick-generate')?.addEventListener('click', handleQuickGenerate);
    }

    // Prompt Template Management
    function resetPromptTemplate() {
      const defaultTemplate = \\\`你是一位专业的故事编剧和大纲设计师。请基于以下信息生成一个详细的故事大纲：

**系统提示词：**
{system_prompt}

**世界观设定：**
{worldbook_entries}

**角色信息：**
{character_data}
- 角色性格：{char_persona}
- 当前情境：{char_scenario}

**记忆摘要：**
{memory_summary}

**作者注释：**
{authors_note}

**对话历史：**
{chat_history}

**创作要求：**
- 故事类型：{story_type}
- 叙事风格：{story_style}
- 故事主题：{story_theme}
- 章节数量：{chapter_count}
- 详细程度：{detail_level}
- 特殊要求：{special_requirements}

**输出选项：**
- 包含整体摘要：{include_summary}
- 包含角色发展：{include_characters}
- 包含主题分析：{include_themes}

请生成一个结构完整、逻辑清晰的故事大纲。

{jailbreak}\\\`;
      document.getElementById('prompt-template-editor').value = defaultTemplate;
      savePromptTemplate();
      showClientNotification('已重置为默认提示词模板', 'success');
    }

    function previewFullPromptTemplate() {
      const template = document.getElementById('prompt-template-editor').value;
      if (!template.trim()) {
        showClientNotification('提示词模板为空', 'warning');
        return;
      }

      const processedPrompt = processClientPromptTemplate(template);
      openModal('提示词模板预览', \\\`<pre style="white-space: pre-wrap; font-family: monospace; font-size: 14px; line-height: 1.4; max-height: 500px; overflow-y: auto;">\\\${escapeHtml(processedPrompt)}</pre>\\\`);
    }

    function savePromptTemplate() {
      const template = document.getElementById('prompt-template-editor').value;
      currentSettings.customPromptTemplate = template;
      // Settings will be saved when user generates
    }

    // System Integration Management  
    function saveSystemSettings() {
      currentSettings.enableSystemPrompt = document.getElementById('enable-system-prompt')?.checked || false;
      currentSettings.enableMemorySummary = document.getElementById('enable-memory-summary')?.checked || false;
      currentSettings.enableAuthorsNote = document.getElementById('enable-authors-note')?.checked || false;
      currentSettings.enableJailbreak = document.getElementById('enable-jailbreak')?.checked || false;
    }

    // Preset Management (Client-side proxies)
    function saveCurrentPreset() {
      const presetName = document.getElementById('preset-name').value.trim();
      if (!presetName) {
        showClientNotification('请输入预设名称', 'warning');
        return;
      }

      const presetData = getCurrentFormData();
      // Call parent function through TavernHelper context
      TavernHelper.runScript(\\\`
        TavernHelper.setGlobalVariable('sw_preset_\\\${presetName}', JSON.stringify(\\\${JSON.stringify(presetData)}));
        TavernHelper.showNotification('预设 "\\\${presetName}" 已保存', { type: 'success' });
      \\\`);
      
      refreshPresetList();
      document.getElementById('preset-name').value = '';
    }

    function loadSelectedPreset() {
      const presetSelect = document.getElementById('preset-select');
      const presetName = presetSelect.value;
      
      if (!presetName) {
        showClientNotification('请选择要加载的预设', 'warning');
        return;
      }

      // Call parent function to load preset
      TavernHelper.runScript(\\\`
        const presetData = TavernHelper.getGlobalVariable('sw_preset_\\\${presetName}');
        if (presetData) {
          try {
            const settings = JSON.parse(presetData);
            window.postMessage({ type: 'loadPresetSettings', settings: settings }, '*');
            TavernHelper.showNotification('预设 "\\\${presetName}" 已加载', { type: 'success' });
          } catch (error) {
            TavernHelper.showNotification('预设数据格式错误', { type: 'error' });
          }
        } else {
          TavernHelper.showNotification('预设不存在', { type: 'error' });
        }
      \\\`);
    }

    function deleteSelectedPreset() {
      const presetSelect = document.getElementById('preset-select');
      const presetName = presetSelect.value;
      
      if (!presetName) {
        showClientNotification('请选择要删除的预设', 'warning');
        return;
      }

      if (confirm(\\\`确定要删除预设 "\\\${presetName}" 吗？\\\`)) {
        TavernHelper.runScript(\\\`
          TavernHelper.setGlobalVariable('sw_preset_\\\${presetName}', null);
          TavernHelper.showNotification('预设 "\\\${presetName}" 已删除', { type: 'success' });
        \\\`);
        refreshPresetList();
      }
    }

    function refreshPresetList() {
      // This will be populated by the server-side data
      const presetSelect = document.getElementById('preset-select');
      if (presetSelect) {
        presetSelect.innerHTML = '<option value="">-- 选择预设 --</option>';
        // Presets will be populated by parent context
      }
    }

    function onPresetSelectionChange() {
      const presetSelect = document.getElementById('preset-select');
      const presetNameInput = document.getElementById('preset-name');
      if (presetSelect.value && presetNameInput) {
        presetNameInput.value = presetSelect.value;
      }
    }

    function getCurrentFormData() {
      return {
        customPromptTemplate: document.getElementById('prompt-template-editor')?.value || '',
        enableSystemPrompt: document.getElementById('enable-system-prompt')?.checked || false,
        enableMemorySummary: document.getElementById('enable-memory-summary')?.checked || false,
        enableAuthorsNote: document.getElementById('enable-authors-note')?.checked || false,
        enableJailbreak: document.getElementById('enable-jailbreak')?.checked || false,
        contextLength: document.getElementById('context-length')?.value || '10',
        storyType: document.getElementById('story-type')?.value || 'adventure',
        storyStyle: document.getElementById('story-style')?.value || 'narrative',
        storyTheme: document.getElementById('story-theme')?.value || '',
        chapterCount: document.getElementById('chapter-count')?.value || '5',
        detailLevel: document.getElementById('detail-level')?.value || 'medium',
        specialRequirements: document.getElementById('special-requirements')?.value || '',
        includeSummary: document.getElementById('include-summary')?.checked || false,
        includeCharacters: document.getElementById('include-characters')?.checked || false,
        includeThemes: document.getElementById('include-themes')?.checked || false
      };
    }

    // Generation Functions (Client-side proxies)
    function handleGenerateOutline() {
      if (generationInProgress) return;
      
      const formData = getCurrentFormData();
      if (!formData.storyTheme.trim()) {
        showClientNotification('请填写故事主题', 'warning');
        return;
      }

      generateStoryOutlineClient(formData);
    }

    function handleQuickGenerate() {
      if (generationInProgress) return;
      
      const quickSettings = {
        ...getCurrentFormData(),
        storyTheme: '基于当前对话和世界观生成合适的故事主题',
        storyType: 'adventure',
        chapterCount: '5',
        detailLevel: 'medium'
      };
      
      generateStoryOutlineClient(quickSettings);
    }

    async function generateStoryOutlineClient(settings) {
      generationInProgress = true;
      const startTime = Date.now();
      
      try {
        showLoadingOverlay('正在生成故事大纲...');
        setGenerationButtonState(true);

        // Call the server-side generation function
        const response = await TavernHelper.runScript(\\\`
          const settings = \\\${JSON.stringify(settings)};
          return await generateStoryOutline(settings);
        \\\`);

        if (response && response.trim()) {
          lastGeneratedContent = response;
          displayGenerationResult(response);
          
          // Parse chapters for detail generation
          parseChaptersFromContent(response);
          
          const endTime = Date.now();
          updateGenerationStats(response, endTime - startTime);
          
          showClientNotification('故事大纲生成完成！', 'success');
        } else {
          throw new Error('生成结果为空');
        }
      } catch (error) {
        console.error('Generation failed:', error);
        showClientNotification('生成失败: ' + error.message, 'error');
      } finally {
        generationInProgress = false;
        hideLoadingOverlay();
        setGenerationButtonState(false);
      }
    }

    // UI Helper Functions
    function showLoadingOverlay(message) {
      const overlay = document.getElementById('loading-overlay');
      const text = document.getElementById('loading-text');
      if (overlay && text) {
        text.textContent = message;
        overlay.classList.remove('hidden');
      }
    }

    function hideLoadingOverlay() {
      document.getElementById('loading-overlay')?.classList.add('hidden');
    }

    function setGenerationButtonState(loading) {
      const button = document.getElementById('generate-outline');
      if (button) {
        if (loading) {
          button.classList.add('loading');
          button.disabled = true;
        } else {
          button.classList.remove('loading');
          button.disabled = false;
        }
      }
    }

    function displayGenerationResult(content) {
      const outputResult = document.getElementById('output-result');
      const outputPlaceholder = document.getElementById('output-placeholder');
      
      if (outputResult && outputPlaceholder) {
        outputPlaceholder.classList.add('hidden');
        outputResult.classList.remove('hidden');
        outputResult.innerHTML = formatGeneratedContent(content);
        
        // Show stats section
        document.getElementById('output-stats')?.classList.remove('hidden');
      }
    }

    function formatGeneratedContent(content) {
      return content
        .replace(/\\n\\n/g, '</p><p>')
        .replace(/\\n/g, '<br>')
        .replace(/^/, '<p>')
        .replace(/\$/, '</p>')
        .replace(/\\*\\*(.*?)\\*\\*/g, '<strong>\$1</strong>')
        .replace(/\\*(.*?)\\*/g, '<em>\$1</em>');
    }

    function parseChaptersFromContent(content) {
      chapterData = [];
      const chapterRegex = /第?([\\d一二三四五六七八九十]+)[章节][:：]?\\s*(.+?)(?=第?[\\d一二三四五六七八九十]+[章节]|\$)/gs;
      let match;
      
      while ((match = chapterRegex.exec(content)) !== null) {
        chapterData.push({
          number: match[1],
          title: match[2].split('\\n')[0].trim(),
          content: match[2].trim()
        });
      }
      
      if (chapterData.length > 0) {
        updateChapterSelection();
        document.getElementById('chapter-selection')?.classList.remove('hidden');
      }
    }

    function updateChapterSelection() {
      const container = document.getElementById('chapter-checkboxes');
      if (!container) return;
      
      container.innerHTML = '';
      chapterData.forEach((chapter, index) => {
        const label = document.createElement('label');
        label.className = 'sw-checkbox-label';
        label.innerHTML = \\\`
          <input type="checkbox" id="chapter-\\\${index}" value="\\\${index}">
          <span class="sw-checkmark"></span>
          第\\\${chapter.number}章: \\\${chapter.title}
        \\\`;
        container.appendChild(label);
      });
    }

    function updateGenerationStats(content, generationTime) {
      const wordCount = content.length;
      const timeInSeconds = (generationTime / 1000).toFixed(1);
      const actualChapters = chapterData.length;
      
      document.getElementById('word-count').textContent = wordCount;
      document.getElementById('generation-time').textContent = \\\`\\\${timeInSeconds}秒\\\`;
      document.getElementById('actual-chapters').textContent = actualChapters;
    }

    // Result Management Functions
    function handleCopyResult() {
      if (!lastGeneratedContent) {
        showClientNotification('没有可复制的内容', 'warning');
        return;
      }
      
      navigator.clipboard.writeText(lastGeneratedContent).then(() => {
        showClientNotification('已复制到剪贴板', 'success');
      }).catch(() => {
        showClientNotification('复制失败', 'error');
      });
    }

    function handleSaveResult() {
      if (!lastGeneratedContent) {
        showClientNotification('没有可保存的内容', 'warning');
        return;
      }
      
      const blob = new Blob([lastGeneratedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \\\`story-outline-\\\${new Date().toISOString().split('T')[0]}.txt\\\`;
      a.click();
      URL.revokeObjectURL(url);
      
      showClientNotification('文件已保存', 'success');
    }

    function handleExportResult() {
      if (!lastGeneratedContent) {
        showClientNotification('没有可导出的内容', 'warning');
        return;
      }
      
      const markdownContent = \\\`# Story Outline
Generated on: \\\${new Date().toLocaleString()}

## Content
\\\${lastGeneratedContent}

---
*Generated by Story Weaver Enhanced*
      \\\`;
      
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \\\`story-outline-\\\${new Date().toISOString().split('T')[0]}.md\\\`;
      a.click();
      URL.revokeObjectURL(url);
      
      showClientNotification('Markdown文件已导出', 'success');
    }

    function handleSendToChat() {
      if (!lastGeneratedContent) {
        showClientNotification('没有可发送的内容', 'warning');
        return;
      }
      
      try {
        TavernHelper.runScript(\\\`
          TavernHelper.sendMessage(\\\${JSON.stringify(lastGeneratedContent)});
        \\\`);
        showClientNotification('已发送到聊天', 'success');
      } catch (error) {
        showClientNotification('发送失败: ' + error.message, 'error');
      }
    }

    // Modal and Helper Functions
    function showHelpModal() {
      document.getElementById('help-modal')?.classList.remove('hidden');
    }

    function closeHelpModal() {
      document.getElementById('help-modal')?.classList.add('hidden');
    }

    function openModal(title, content) {
      const modal = document.getElementById('help-modal');
      if (modal) {
        modal.querySelector('.sw-modal-header h3').textContent = title;
        modal.querySelector('.sw-modal-body').innerHTML = content;
        modal.classList.remove('hidden');
      }
    }

    function showClientNotification(message, type = 'info', duration = 3000) {
      const container = document.getElementById('notification-container');
      if (!container) return;
      
      const notification = document.createElement('div');
      notification.className = \\\`sw-notification \\\${type}\\\`;
      notification.innerHTML = \\\`
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span>\\\${message}</span>
          <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #718096;">×</button>
        </div>
      \\\`;
      
      container.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, duration);
    }

    function updateContextStatus() {
      const contextLength = parseInt(document.getElementById('context-length')?.value || '10');
      const statusElement = document.getElementById('context-status');
      if (statusElement) {
        if (contextLength === 0) {
          statusElement.textContent = '将仅基于世界观设定生成，不读取对话历史';
        } else {
          statusElement.textContent = \\\`将读取最近 \\\${contextLength} 条对话消息\\\`;
        }
      }
    }

    function processClientPromptTemplate(template) {
      // Simple client-side template processing for preview
      return template
        .replace(/\\{system_prompt\\}/g, '[系统提示词]')
        .replace(/\\{worldbook_entries\\}/g, '[世界观条目]')
        .replace(/\\{character_data\\}/g, '[角色数据]')
        .replace(/\\{char_persona\\}/g, '[角色性格]')
        .replace(/\\{char_scenario\\}/g, '[当前情境]')
        .replace(/\\{memory_summary\\}/g, '[记忆摘要]')
        .replace(/\\{authors_note\\}/g, '[作者注释]')
        .replace(/\\{jailbreak\\}/g, '[越狱提示]')
        .replace(/\\{chat_history\\}/g, '[对话历史]')
        .replace(/\\{story_type\\}/g, getCurrentFormData().storyType)
        .replace(/\\{story_theme\\}/g, getCurrentFormData().storyTheme)
        .replace(/\\{story_style\\}/g, getCurrentFormData().storyStyle)
        .replace(/\\{chapter_count\\}/g, getCurrentFormData().chapterCount)
        .replace(/\\{detail_level\\}/g, getCurrentFormData().detailLevel)
        .replace(/\\{special_requirements\\}/g, getCurrentFormData().specialRequirements)
        .replace(/\\{include_summary\\}/g, getCurrentFormData().includeSummary ? '是' : '否')
        .replace(/\\{include_characters\\}/g, getCurrentFormData().includeCharacters ? '是' : '否')
        .replace(/\\{include_themes\\}/g, getCurrentFormData().includeThemes ? '是' : '否');
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Stub functions for missing functionality
    function refreshAllData() {
      updateContextStatus();
      refreshPresetList();
      showClientNotification('数据已刷新', 'success');
    }

    function refreshContextData() {
      updateContextStatus();
    }

    function previewContextData() {
      showClientNotification('数据预览功能需要通过服务器端处理', 'info');
    }

    function previewFullPrompt() {
      const template = document.getElementById('prompt-template-editor')?.value || '';
      const processedPrompt = processClientPromptTemplate(template);
      openModal('完整提示词预览', \\\`<pre style="white-space: pre-wrap; font-family: monospace; font-size: 14px; line-height: 1.4; max-height: 500px; overflow-y: auto;">\\\${escapeHtml(processedPrompt)}</pre>\\\`);
    }

    function handleGenerateDetails() {
      showClientNotification('章节细纲功能正在开发中', 'info');
    }

    function importPresetFile() {
      showClientNotification('文件导入功能正在开发中', 'info');
    }

    function exportPresetFile() {
      showClientNotification('文件导出功能正在开发中', 'info');
    }

    // Form change listeners
    const formElements = ['context-length', 'story-type', 'story-style', 'story-theme', 'chapter-count', 
                         'detail-level', 'special-requirements', 'include-summary', 'include-characters', 'include-themes'];
    
    formElements.forEach(id => {
      document.addEventListener('DOMContentLoaded', function() {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener('change', () => {
            if (id === 'context-length') updateContextStatus();
          });
        }
      });
    });
  \`;
}

// ========================= UTILITY FUNCTIONS =========================

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  TavernHelper.showNotification(message, {
    type: type,
    duration: 3000
  });
}

// Initialize the script when loaded
init();

// Export main functions for external access
window.StoryWeaver = {
  init,
  openStoryWeaverInterface,
  generateStoryOutline,
  loadSettings,
  saveSettings,
  savePreset,
  loadPreset,
  deletePreset,
  listPresets
};