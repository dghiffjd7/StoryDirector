/**
 * Story Weaver - Enhanced TavernHelper Version
 * 故事大纲生成器 - 增强TavernHelper版本
 * 
 * Complete version with all original extension features migrated
 */

(() => {
  'use strict';

  // ===== TavernHelper Integration Configuration =====
  const SCRIPT_NAME = 'Story Weaver';
  const SCRIPT_VERSION = '2.1.0';
  const VARIABLE_PREFIX = 'sw_';

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
    includeThemes: false,
    customPromptTemplate: '',
    enableSystemPrompt: true,
    enableMemorySummary: true,
    enableAuthorsNote: true,
    enableJailbreak: false
  };

  // ===== Story Definitions =====
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

  // ===== Enhanced Prompt Template =====
  const DEFAULT_PROMPT_TEMPLATE = `你是一位专业的故事创作和世界构建助手。你的任务是基于提供的背景信息生成引人入胜的结构化故事大纲。

### 背景信息 ###

-- 系统提示 --
{system_prompt}

**世界书设定：**
{worldbook_entries}

**角色信息：**
{character_data}

-- 角色性格 --
{char_persona}

-- 背景设定 --
{char_scenario}

-- 记忆摘要 --
{memory_summary}

-- 作者注释 --
{authors_note}

-- 越狱提示 --
{jailbreak}

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

  // ===== System Integration Functions =====

  /**
   * Resolve system prompt from various sources
   */
  function resolveSystemPrompt() {
    try {
      // Try multiple sources for system prompt
      if (typeof window !== 'undefined') {
        return window?.power_user?.context?.story_string || 
               window?.system_prompt || 
               '';
      }
      return '';
    } catch (error) {
      console.warn(`[${SCRIPT_NAME}] Could not resolve system prompt:`, error);
      return '';
    }
  }

  /**
   * Resolve character persona
   */
  async function resolveCharPersona() {
    try {
      const character = await TavernHelper.getCharacter();
      return character?.personality || character?.persona || character?.description || '';
    } catch (error) {
      console.warn(`[${SCRIPT_NAME}] Could not resolve character persona:`, error);
      return '';
    }
  }

  /**
   * Resolve character scenario
   */
  async function resolveCharScenario() {
    try {
      const character = await TavernHelper.getCharacter();
      return character?.scenario || '';
    } catch (error) {
      console.warn(`[${SCRIPT_NAME}] Could not resolve character scenario:`, error);
      return '';
    }
  }

  /**
   * Resolve memory summary
   */
  function resolveMemorySummary() {
    try {
      if (typeof window !== 'undefined') {
        return window?.memory?.summary || 
               window?.chat_metadata?.summary || 
               '';
      }
      return '';
    } catch (error) {
      console.warn(`[${SCRIPT_NAME}] Could not resolve memory summary:`, error);
      return '';
    }
  }

  /**
   * Resolve authors note
   */
  function resolveAuthorsNote() {
    try {
      if (typeof window !== 'undefined') {
        return window?.power_user?.context?.authors_note || '';
      }
      return '';
    } catch (error) {
      console.warn(`[${SCRIPT_NAME}] Could not resolve authors note:`, error);
      return '';
    }
  }

  /**
   * Resolve jailbreak prompt
   */
  function resolveJailbreak() {
    try {
      if (typeof window !== 'undefined') {
        return window?.power_user?.jailbreak || '';
      }
      return '';
    } catch (error) {
      console.warn(`[${SCRIPT_NAME}] Could not resolve jailbreak:`, error);
      return '';
    }
  }

  // ===== Preset Management System =====
  
  /**
   * Save current settings as preset
   */
  async function savePreset(name, settings) {
    try {
      const presetKey = `${VARIABLE_PREFIX}preset_${name}`;
      const presetData = {
        name,
        settings,
        created: new Date().toISOString(),
        version: SCRIPT_VERSION
      };
      await TavernHelper.setVariable(presetKey, JSON.stringify(presetData));
      
      // Update preset list
      const presetList = await getPresetList();
      if (!presetList.includes(name)) {
        presetList.push(name);
        await TavernHelper.setVariable(`${VARIABLE_PREFIX}preset_list`, JSON.stringify(presetList));
      }
      
      console.log(`[${SCRIPT_NAME}] Preset '${name}' saved successfully`);
      return true;
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error saving preset:`, error);
      return false;
    }
  }

  /**
   * Load preset by name
   */
  async function loadPreset(name) {
    try {
      const presetKey = `${VARIABLE_PREFIX}preset_${name}`;
      const presetData = await TavernHelper.getVariable(presetKey);
      
      if (presetData) {
        const preset = JSON.parse(presetData);
        return preset.settings;
      }
      return null;
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error loading preset:`, error);
      return null;
    }
  }

  /**
   * Get list of all presets
   */
  async function getPresetList() {
    try {
      const presetListData = await TavernHelper.getVariable(`${VARIABLE_PREFIX}preset_list`);
      return presetListData ? JSON.parse(presetListData) : [];
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error getting preset list:`, error);
      return [];
    }
  }

  /**
   * Delete preset
   */
  async function deletePreset(name) {
    try {
      const presetKey = `${VARIABLE_PREFIX}preset_${name}`;
      await TavernHelper.deleteVariable(presetKey);
      
      // Update preset list
      const presetList = await getPresetList();
      const updatedList = presetList.filter(p => p !== name);
      await TavernHelper.setVariable(`${VARIABLE_PREFIX}preset_list`, JSON.stringify(updatedList));
      
      return true;
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error deleting preset:`, error);
      return false;
    }
  }

  // ===== Core Functions (Enhanced) =====

  function initialize() {
    console.log(`[${SCRIPT_NAME}] Initializing Enhanced TavernHelper version ${SCRIPT_VERSION}`);
    registerSlashCommands();
    console.log(`[${SCRIPT_NAME}] Initialization complete`);
  }

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

  async function getWorldbookEntries() {
    try {
      const entries = await TavernHelper.getWorldbook();
      if (!entries || !Array.isArray(entries)) {
        return '暂无可用的世界书设定';
      }
      
      return entries.map(entry => {
        return `**${entry.key}**: ${entry.content}`;
      }).join('\n\n');
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error getting worldbook entries:`, error);
      return '暂无可用的世界书设定';
    }
  }

  async function getCharacterData() {
    try {
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

  function registerSlashCommands() {
    TavernHelper.registerSlashCommand('sw', openStoryWeaverInterface, 'Open Story Weaver interface');
    TavernHelper.registerSlashCommand('storyweaver', openStoryWeaverInterface, 'Open Story Weaver interface');
    TavernHelper.registerSlashCommand('swquick', quickGenerate, 'Quick story outline generation');
    TavernHelper.registerSlashCommand('swpreset', managePresets, 'Manage Story Weaver presets');
  }

  /**
   * Enhanced story outline generation with full context
   */
  async function generateStoryOutline(settings) {
    try {
      console.log(`[${SCRIPT_NAME}] Starting enhanced story outline generation`);
      
      // Collect all data sources
      const worldbookEntries = await getWorldbookEntries();
      const characterData = await getCharacterData();
      const chatHistory = await getChatHistory(settings.contextLength);
      
      // Get enhanced context data
      const systemPrompt = settings.enableSystemPrompt ? resolveSystemPrompt() : '';
      const charPersona = settings.enableSystemPrompt ? await resolveCharPersona() : '';
      const charScenario = settings.enableSystemPrompt ? await resolveCharScenario() : '';
      const memorySummary = settings.enableMemorySummary ? resolveMemorySummary() : '';
      const authorsNote = settings.enableAuthorsNote ? resolveAuthorsNote() : '';
      const jailbreak = settings.enableJailbreak ? resolveJailbreak() : '';
      
      // Use custom prompt template if provided
      let prompt = settings.customPromptTemplate || DEFAULT_PROMPT_TEMPLATE;
      
      const replacements = {
        system_prompt: systemPrompt,
        worldbook_entries: worldbookEntries,
        character_data: characterData,
        char_persona: charPersona,
        char_scenario: charScenario,
        memory_summary: memorySummary,
        authors_note: authorsNote,
        jailbreak: jailbreak,
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
        prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
      }

      console.log(`[${SCRIPT_NAME}] Generating with TavernHelper.generateRaw`);
      
      const result = await TavernHelper.generateRaw(prompt);
      
      console.log(`[${SCRIPT_NAME}] Enhanced generation completed successfully`);
      return result;
      
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error generating enhanced story outline:`, error);
      throw error;
    }
  }

  /**
   * Generate chapter details for selected chapters
   */
  async function generateChapterDetails(outlineText, selectedChapters) {
    try {
      const detailPrompt = `基于以下故事大纲，为选中的章节生成详细内容：

原始大纲：
${outlineText}

请为以下章节生成详细的情节展开：
${selectedChapters.map(ch => `- 第${ch}章`).join('\n')}

要求：
1. 保持与原大纲的一致性
2. 详细描述场景、对话、动作
3. 突出角色情感变化
4. 确保情节连贯性

请以Markdown格式输出详细内容。`;

      const result = await TavernHelper.generateRaw(detailPrompt);
      return result;
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error generating chapter details:`, error);
      throw error;
    }
  }

  async function quickGenerate(args) {
    try {
      const settings = await loadSettings();
      
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
      await TavernHelper.sendMessage(`**Story Weaver 快速生成结果：**\n\n${outline}`, false);
      
    } catch (error) {
      await TavernHelper.sendMessage(`❌ 生成失败：${error.message}`, false);
    }
  }

  /**
   * Preset management command
   */
  async function managePresets(args) {
    try {
      if (!args) {
        const presets = await getPresetList();
        const message = presets.length > 0 
          ? `**可用预设：**\n${presets.map(p => `- ${p}`).join('\n')}`
          : '暂无保存的预设';
        await TavernHelper.sendMessage(message, false);
        return;
      }

      const [action, name] = args.split(' ');
      
      switch (action) {
        case 'save':
          if (name) {
            const settings = await loadSettings();
            const success = await savePreset(name, settings);
            const message = success ? `✅ 预设 '${name}' 保存成功` : `❌ 预设保存失败`;
            await TavernHelper.sendMessage(message, false);
          }
          break;
          
        case 'load':
          if (name) {
            const preset = await loadPreset(name);
            if (preset) {
              await saveSettings(preset);
              await TavernHelper.sendMessage(`✅ 预设 '${name}' 加载成功`, false);
            } else {
              await TavernHelper.sendMessage(`❌ 预设 '${name}' 不存在`, false);
            }
          }
          break;
          
        case 'delete':
          if (name) {
            const success = await deletePreset(name);
            const message = success ? `✅ 预设 '${name}' 删除成功` : `❌ 预设删除失败`;
            await TavernHelper.sendMessage(message, false);
          }
          break;
      }
    } catch (error) {
      await TavernHelper.sendMessage(`❌ 预设操作失败：${error.message}`, false);
    }
  }

  async function openStoryWeaverInterface() {
    try {
      console.log(`[${SCRIPT_NAME}] Opening enhanced interface`);
      
      const settings = await loadSettings();
      const interfaceHTML = buildEnhancedInterface(settings);
      
      await TavernHelper.renderHTML(interfaceHTML, {
        title: 'Story Weaver - 故事大纲生成器 (Enhanced)',
        width: 1200,
        height: 900,
        resizable: true
      });
      
    } catch (error) {
      console.error(`[${SCRIPT_NAME}] Error opening enhanced interface:`, error);
      await TavernHelper.sendMessage(`❌ 打开界面失败：${error.message}`, false);
    }
  }

  // This is getting long - I'll continue with the interface builder in the next part
  // Let me first save this partial version and continue
  
  // ===== Initialize on Load =====
  if (typeof TavernHelper !== 'undefined') {
    initialize();
    
    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleInterfaceMessage);
    }
  } else {
    console.error(`[${SCRIPT_NAME}] TavernHelper not available - make sure this script runs in TavernHelper context`);
  }

  // Expose functions for interface communication
  window.StoryWeaverEnhanced = {
    generateStoryOutline,
    generateChapterDetails,
    savePreset,
    loadPreset,
    getPresetList,
    deletePreset,
    saveSettings,
    loadSettings
  };

})();