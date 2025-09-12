/**
 * Story Weaver - TavernHelper Version
 * 故事大纲生成器 - TavernHelper版本
 * 
 * A powerful story outline generator that integrates with SillyTavern's lorebook system
 * through TavernHelper's advanced APIs.
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

  // ===== Core Functions =====

  /**
   * Initialize the Story Weaver TavernHelper script
   */
  function initialize() {
    console.log(`[${SCRIPT_NAME}] Initializing TavernHelper version ${SCRIPT_VERSION}`);
    
    // Load saved settings
    loadSettings();
    
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
        return [];
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
   * Load external interface components
   */
  async function loadInterfaceComponents() {
    // In a real TavernHelper environment, these would be loaded from separate files
    // For now, we'll include them inline in the next update
    return {
      buildInterface,
      getInterfaceCSS,
      getInterfaceJavaScript
    };
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
          // Force refresh of cached data
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
      
      // Send response back to interface
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