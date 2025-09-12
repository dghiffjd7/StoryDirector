/**
 * Story Weaver - SillyTavern Extension
 * AI-powered story outline generator with advanced focus system
 * Version: 1.0.0
 */

import {
  eventSource,
  event_types,
  extension_prompt_roles,
  extension_prompt_types,
  getRequestHeaders,
  name1,
  substituteParams,
  saveSettingsDebounced,
} from '../../../script.js';

import { 
  INJECTION_POSITION, 
  Prompt, 
  PromptCollection 
} from '../../../scripts/PromptManager.js';

import { 
  download, 
  parseJsonFile 
} from '../../../scripts/utils.js';

import { 
  getSortedEntries, 
  getWorldInfoPrompt 
} from '../../../scripts/world-info.js';

import { 
  extension_settings, 
  getContext,
  renderExtensionTemplate
} from '../../extensions.js';

import { 
  SlashCommandParser 
} from '../../../scripts/slash-commands/SlashCommandParser.js';

import { 
  ARGUMENT_TYPE, 
  SlashCommandArgument, 
  SlashCommandNamedArgument 
} from '../../../scripts/slash-commands/SlashCommandArgument.js';

// Extension constants
const extensionName = 'story-weaver';
const extensionFolderPath = `scripts/extensions/${extensionName}`;

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
  panelPosition: 'right', // 'left' or 'right'
  autoSave: true,
  // Prompt presets management
  promptPresets: {
    default: {
      name: '默认预设',
      description: '系统默认的提示词配置',
      prompts: [],
      promptOrder: [],
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

// Global extension state
let settings = {};
let isExtensionLoaded = false;
let extensionPanel = null;
let outlineParagraphs = [];
let versionManager = null;
let enhancedFocusSystem = null;

/**
 * Load extension settings
 */
function loadSettings() {
  settings = extension_settings[extensionName] || defaultSettings;
  
  // Ensure all default settings exist
  Object.keys(defaultSettings).forEach(key => {
    if (!(key in settings)) {
      settings[key] = defaultSettings[key];
    }
  });
  
  extension_settings[extensionName] = settings;
}

/**
 * Save extension settings
 */
function saveSettings() {
  extension_settings[extensionName] = settings;
  saveSettingsDebounced();
}

/**
 * Create extension panel HTML
 */
function createExtensionPanel() {
  return `
    <div id="story-weaver-extension" class="story-weaver-extension">
      <!-- Extension Header -->
      <div class="extension-header">
        <h3 class="extension-title">
          <span class="title-icon">📖</span>
          Story Weaver - 故事大纲生成器
        </h3>
        <div class="extension-controls">
          <button id="sw-minimize" class="control-btn" title="最小化">
            <span>➖</span>
          </button>
          <button id="sw-help" class="control-btn" title="使用说明">
            <span>❓</span>
          </button>
          <button id="sw-close" class="control-btn close" title="关闭">
            <span>✕</span>
          </button>
        </div>
      </div>

      <!-- Extension Content -->
      <div class="extension-content">
        <!-- Story Context Section -->
        <div class="story-section">
          <h4 class="section-title">
            <span class="section-icon">📖</span>
            剧情上下文设定
          </h4>
          <div class="form-group">
            <label for="sw-context-length">读取对话历史长度：</label>
            <input type="number" id="sw-context-length" value="${settings.contextLength}" min="0" max="500" class="form-control">
            <small>条消息（设置为0则仅基于世界观生成）</small>
          </div>
        </div>

        <!-- Story Requirements Section -->
        <div class="story-section">
          <h4 class="section-title">
            <span class="section-icon">✨</span>
            创作需求设定
          </h4>
          
          <div class="form-group">
            <label for="sw-story-type">故事类型：</label>
            <select id="sw-story-type" class="form-control">
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
            <label for="sw-story-theme">故事主题/核心冲突：</label>
            <textarea id="sw-story-theme" class="form-control" rows="3" placeholder="描述您希望故事围绕的核心主题、冲突或目标..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="sw-chapter-count">期望章节数：</label>
              <input type="number" id="sw-chapter-count" value="${settings.chapterCount}" min="3" max="20" class="form-control">
            </div>
            <div class="form-group">
              <label for="sw-detail-level">大纲详细程度：</label>
              <select id="sw-detail-level" class="form-control">
                <option value="brief">简要大纲</option>
                <option value="detailed" selected>详细大纲</option>
                <option value="comprehensive">全面大纲</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Generation Controls -->
        <div class="story-section">
          <div class="generation-controls">
            <button id="sw-generate-outline" class="generate-btn">
              <span class="btn-icon">🎭</span>
              <span class="btn-text">生成故事大纲</span>
              <span class="btn-loading hidden">🔄</span>
            </button>
            
            <div class="generation-options">
              <label class="checkbox-wrapper">
                <input type="checkbox" id="sw-include-summary" ${settings.includeSummary ? 'checked' : ''}>
                <span class="checkmark"></span>
                包含整体摘要
              </label>
              <label class="checkbox-wrapper">
                <input type="checkbox" id="sw-include-characters" ${settings.includeCharacters ? 'checked' : ''}>
                <span class="checkmark"></span>
                包含角色发展
              </label>
              <label class="checkbox-wrapper">
                <input type="checkbox" id="sw-include-themes" ${settings.includeThemes ? 'checked' : ''}>
                <span class="checkmark"></span>
                包含主题分析
              </label>
            </div>
          </div>
        </div>

        <!-- Results Section -->
        <div class="story-section">
          <h4 class="section-title">
            <span class="section-icon">📄</span>
            生成结果
            <div class="section-actions">
              <button id="sw-copy-result" class="action-btn" title="复制到剪贴板">📋</button>
              <button id="sw-save-result" class="action-btn" title="保存为文件">💾</button>
              <button id="sw-export-result" class="action-btn" title="导出为Markdown">📤</button>
            </div>
          </h4>
          
          <div id="sw-output-content" class="output-content">
            <div id="sw-output-placeholder" class="output-placeholder">
              <span class="placeholder-icon">📝</span>
              <p>故事大纲将在这里显示...</p>
              <p class="placeholder-help">填写上方信息后点击"生成故事大纲"开始创作</p>
            </div>
            
            <div id="sw-outline-paragraphs" class="outline-paragraphs hidden">
              <!-- Generated paragraphs will be inserted here -->
            </div>
          </div>

          <div id="sw-output-stats" class="output-stats hidden">
            <div class="stat-item">
              <span class="stat-label">字数统计：</span>
              <span id="sw-word-count" class="stat-value">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">生成时间：</span>
              <span id="sw-generation-time" class="stat-value">--</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">章节数量：</span>
              <span id="sw-actual-chapters" class="stat-value">0</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Focus overlay and DBlocks container for enhanced system -->
    <div id="sw-focus-overlay" class="story-weaver-focus-overlay"></div>
    <div id="sw-dblocks-container" class="dblocks-container"></div>
  `;
}

/**
 * Initialize extension panel
 */
function initExtensionPanel() {
  // Remove existing panel if it exists
  $('#story-weaver-extension').remove();
  $('#sw-focus-overlay').remove();
  $('#sw-dblocks-container').remove();
  
  // Create and inject the panel
  const panelHTML = createExtensionPanel();
  
  // Determine where to inject based on settings
  if (settings.panelPosition === 'left') {
    $('#leftSendForm').prepend(panelHTML);
  } else {
    $('#rightSendForm').append(panelHTML);
  }
  
  // Store panel reference
  extensionPanel = $('#story-weaver-extension');
  
  // Setup event listeners
  setupEventListeners();
  
  // Load saved values
  loadFormValues();
}

/**
 * Setup event listeners for the extension
 */
function setupEventListeners() {
  // Control buttons
  $('#sw-minimize').on('click', toggleMinimize);
  $('#sw-help').on('click', showHelp);
  $('#sw-close').on('click', closeExtension);
  
  // Form controls
  $('#sw-context-length').on('change', updateSettings);
  $('#sw-story-type').on('change', updateSettings);
  $('#sw-story-theme').on('input', updateSettings);
  $('#sw-chapter-count').on('change', updateSettings);
  $('#sw-detail-level').on('change', updateSettings);
  $('#sw-include-summary').on('change', updateSettings);
  $('#sw-include-characters').on('change', updateSettings);
  $('#sw-include-themes').on('change', updateSettings);
  
  // Generation button
  $('#sw-generate-outline').on('click', generateOutline);
  
  // Action buttons
  $('#sw-copy-result').on('click', copyResults);
  $('#sw-save-result').on('click', saveResults);
  $('#sw-export-result').on('click', exportResults);
}

/**
 * Load form values from settings
 */
function loadFormValues() {
  $('#sw-context-length').val(settings.contextLength);
  $('#sw-story-type').val(settings.storyType);
  $('#sw-chapter-count').val(settings.chapterCount);
  $('#sw-detail-level').val(settings.detailLevel);
  $('#sw-include-summary').prop('checked', settings.includeSummary);
  $('#sw-include-characters').prop('checked', settings.includeCharacters);
  $('#sw-include-themes').prop('checked', settings.includeThemes);
}

/**
 * Update settings from form values
 */
function updateSettings() {
  settings.contextLength = parseInt($('#sw-context-length').val()) || 100;
  settings.storyType = $('#sw-story-type').val();
  settings.chapterCount = parseInt($('#sw-chapter-count').val()) || 5;
  settings.detailLevel = $('#sw-detail-level').val();
  settings.includeSummary = $('#sw-include-summary').prop('checked');
  settings.includeCharacters = $('#sw-include-characters').prop('checked');
  settings.includeThemes = $('#sw-include-themes').prop('checked');
  
  saveSettings();
}

/**
 * Toggle extension panel minimized state
 */
function toggleMinimize() {
  extensionPanel.toggleClass('minimized');
  settings.minimized = extensionPanel.hasClass('minimized');
  saveSettings();
}

/**
 * Show help modal
 */
function showHelp() {
  const helpContent = `
    <h3>Story Weaver 使用说明</h3>
    <h4>基本功能：</h4>
    <ul>
      <li><strong>故事大纲生成：</strong>基于当前对话和世界观生成结构化故事大纲</li>
      <li><strong>智能分段：</strong>自动将大纲分解为可编辑的段落块</li>
      <li><strong>增强聚焦：</strong>长按段落块进入聚焦模式，可生成详细大纲</li>
    </ul>
    <h4>聚焦系统：</h4>
    <ul>
      <li><strong>长按段落：</strong>按住段落800ms进入聚焦模式</li>
      <li><strong>卫星系统：</strong>详细大纲以卫星形式环绕主段落</li>
      <li><strong>交互编辑：</strong>悬停暂停卫星，点击可编辑详细内容</li>
      <li><strong>ESC退出：</strong>按ESC键或点击背景退出聚焦模式</li>
    </ul>
    <h4>快捷键：</h4>
    <ul>
      <li><strong>ESC：</strong>退出聚焦模式</li>
      <li><strong>双击：</strong>编辑段落内容</li>
      <li><strong>悬停：</strong>显示操作按钮</li>
    </ul>
  `;
  
  // Use SillyTavern's modal system if available
  if (window.callPopup) {
    callPopup(helpContent, 'text');
  } else {
    alert('Story Weaver 使用说明\n\n基本功能：\n- 故事大纲生成：基于当前对话和世界观生成结构化故事大纲\n- 智能分段：自动将大纲分解为可编辑的段落块\n- 增强聚焦：长按段落块进入聚焦模式，可生成详细大纲');
  }
}

/**
 * Close extension panel
 */
function closeExtension() {
  extensionPanel.addClass('hidden');
  settings.closed = true;
  saveSettings();
}

/**
 * Generate story outline
 */
async function generateOutline() {
  const $button = $('#sw-generate-outline');
  const $loading = $button.find('.btn-loading');
  const $text = $button.find('.btn-text');
  
  // Show loading state
  $button.prop('disabled', true);
  $loading.removeClass('hidden');
  $text.text('正在生成...');
  
  try {
    const generationStart = Date.now();
    
    // Get form values
    const contextLength = parseInt($('#sw-context-length').val()) || 100;
    const storyType = $('#sw-story-type').val();
    const storyTheme = $('#sw-story-theme').val().trim();
    const chapterCount = parseInt($('#sw-chapter-count').val()) || 5;
    const detailLevel = $('#sw-detail-level').val();
    const includeSummary = $('#sw-include-summary').prop('checked');
    const includeCharacters = $('#sw-include-characters').prop('checked');
    const includeThemes = $('#sw-include-themes').prop('checked');
    
    // Build prompt for outline generation
    const prompt = buildOutlinePrompt({
      contextLength,
      storyType,
      storyTheme,
      chapterCount,
      detailLevel,
      includeSummary,
      includeCharacters,
      includeThemes
    });
    
    // Generate using SillyTavern's API
    const response = await generateAIResponse(prompt);
    const generationTime = Date.now() - generationStart;
    
    // Parse and display results
    await displayResults(response, generationTime);
    
  } catch (error) {
    console.error('[Story Weaver] Generation error:', error);
    showNotification('生成大纲时出错：' + error.message, 'error');
  } finally {
    // Reset button state
    $button.prop('disabled', false);
    $loading.addClass('hidden');
    $text.text('生成故事大纲');
  }
}

/**
 * Build outline generation prompt
 */
function buildOutlinePrompt(options) {
  let prompt = `请帮我生成一个${options.storyType === 'custom' ? '自定义' : getStoryTypeName(options.storyType)}类型的故事大纲。\n\n`;
  
  if (options.storyTheme) {
    prompt += `故事主题：${options.storyTheme}\n\n`;
  }
  
  prompt += `要求：\n`;
  prompt += `- 总共${options.chapterCount}个章节\n`;
  prompt += `- 详细程度：${getDetailLevelName(options.detailLevel)}\n`;
  
  if (options.includeSummary) {
    prompt += `- 包含整体故事摘要\n`;
  }
  
  if (options.includeCharacters) {
    prompt += `- 包含主要角色发展\n`;
  }
  
  if (options.includeThemes) {
    prompt += `- 包含主题分析\n`;
  }
  
  // Add context from current conversation if requested
  if (options.contextLength > 0) {
    const context = getConversationContext(options.contextLength);
    if (context) {
      prompt += `\n基于以下对话背景：\n${context}\n\n`;
    }
  }
  
  // Add world info context
  const worldInfo = getWorldInfoContext();
  if (worldInfo) {
    prompt += `世界观设定：\n${worldInfo}\n\n`;
  }
  
  prompt += `请用中文回应，并按章节清晰地组织大纲结构。`;
  
  return prompt;
}

/**
 * Get conversation context
 */
function getConversationContext(length) {
  try {
    const context = getContext();
    const chat = context.chat;
    
    if (!chat || chat.length === 0) return '';
    
    const recentMessages = chat.slice(-length);
    return recentMessages.map(msg => `${msg.name}: ${msg.mes}`).join('\n');
  } catch (error) {
    console.error('[Story Weaver] Error getting context:', error);
    return '';
  }
}

/**
 * Get world info context
 */
function getWorldInfoContext() {
  try {
    const worldInfo = getWorldInfoPrompt();
    return worldInfo || '';
  } catch (error) {
    console.error('[Story Weaver] Error getting world info:', error);
    return '';
  }
}

/**
 * Generate AI response using SillyTavern's generation system
 */
async function generateAIResponse(prompt) {
  // Use SillyTavern's generation API
  const context = getContext();
  
  const requestBody = {
    prompt: prompt,
    max_tokens: 2000,
    temperature: 0.8,
    top_p: 0.9,
    stop: [],
  };
  
  const response = await fetch('/api/v1/generate', {
    method: 'POST',
    headers: getRequestHeaders(),
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    throw new Error(`Generation failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.result || data.choices?.[0]?.text || '';
}

/**
 * Display generation results
 */
async function displayResults(content, generationTime) {
  if (!content || content.trim() === '') {
    showNotification('生成的内容为空', 'warning');
    return;
  }
  
  // Parse content into paragraphs
  outlineParagraphs = parseOutlineContent(content);
  
  // Update UI
  renderOutlineParagraphs();
  updateStats(content, generationTime);
  
  // Save results
  if (settings.autoSave) {
    saveOutlineParagraphs();
  }
  
  // Store in version manager
  if (versionManager) {
    versionManager.createOutline('AI生成大纲', content, {
      generationTime,
      storyType: settings.storyType,
      chapterCount: settings.chapterCount,
    });
  }
  
  showNotification('故事大纲生成完成！', 'success');
}

/**
 * Parse outline content into editable paragraphs
 */
function parseOutlineContent(content) {
  const paragraphs = [];
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  let currentParagraph = '';
  let order = 1;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Check if this is a chapter/section header
    if (trimmed.match(/^(第\d+章|Chapter \d+|章节 \d+|#{1,3})/i)) {
      // Save previous paragraph if exists
      if (currentParagraph.trim()) {
        paragraphs.push({
          id: `paragraph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          order: order++,
          content: currentParagraph.trim(),
          wordCount: currentParagraph.length,
          createdAt: new Date().toISOString(),
        });
      }
      
      // Start new paragraph with header
      currentParagraph = trimmed;
    } else {
      // Add line to current paragraph
      currentParagraph += (currentParagraph ? '\n' : '') + trimmed;
    }
  });
  
  // Add final paragraph
  if (currentParagraph.trim()) {
    paragraphs.push({
      id: `paragraph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: order++,
      content: currentParagraph.trim(),
      wordCount: currentParagraph.length,
      createdAt: new Date().toISOString(),
    });
  }
  
  return paragraphs;
}

/**
 * Render outline paragraphs to UI
 */
function renderOutlineParagraphs() {
  const $container = $('#sw-outline-paragraphs');
  const $placeholder = $('#sw-output-placeholder');
  
  if (!outlineParagraphs || outlineParagraphs.length === 0) {
    $container.addClass('hidden').empty();
    $placeholder.removeClass('hidden');
    return;
  }
  
  $placeholder.addClass('hidden');
  $container.removeClass('hidden').empty();
  
  // Add batch management toolbar if multiple paragraphs
  if (outlineParagraphs.length > 1) {
    const batchToolbar = $(`
      <div class="batch-management-toolbar">
        <div class="batch-selection-controls">
          <label class="batch-checkbox">
            <input type="checkbox" id="sw-select-all-paragraphs">
            <span>全选</span>
          </label>
          <span class="selected-count">已选择: <span id="sw-selected-count">0</span> 个段落</span>
        </div>
        <div class="batch-actions">
          <button id="sw-batch-copy" class="batch-action-btn" disabled>📋 复制选中</button>
          <button id="sw-batch-delete" class="batch-action-btn danger" disabled>🗑️ 删除选中</button>
          <button id="sw-batch-merge" class="batch-action-btn" disabled>🔗 合并</button>
        </div>
      </div>
    `);
    $container.append(batchToolbar);
  }

  outlineParagraphs.forEach((paragraph, index) => {
    const $paragraph = $(`
      <div class="outline-paragraph" data-paragraph-id="${paragraph.id}" data-order="${paragraph.order}">
        <div class="paragraph-selection">
          <input type="checkbox" class="paragraph-checkbox" data-paragraph-id="${paragraph.id}">
        </div>
        <div class="paragraph-number">${paragraph.order}</div>
        <div class="paragraph-main">
          <div class="paragraph-drag-handle">⋮⋮</div>
          <div class="paragraph-content" contenteditable="false" data-paragraph-id="${paragraph.id}">${formatParagraphContent(paragraph.content)}</div>
          <div class="paragraph-actions">
            <button class="paragraph-action" data-action="duplicate" title="复制段落">📋</button>
            <button class="paragraph-action" data-action="generate-details" title="生成细纲">📝</button>
            <button class="paragraph-action" data-action="delete" title="删除段落">🗑️</button>
          </div>
          <div class="paragraph-stats">
            <span class="word-count">${paragraph.wordCount}</span> 字符
          </div>
        </div>
      </div>
    `);
    
    $container.append($paragraph);
  });
  
  // Setup paragraph interactions
  setupParagraphInteractions();
  
  // Setup drag and drop functionality
  setupParagraphDragging();
  
  // Setup batch management
  setupBatchManagement();
  
  // Initialize enhanced focus system
  if (!enhancedFocusSystem) {
    enhancedFocusSystem = new EnhancedFocusSystem();
  }
}

/**
 * Format paragraph content for display
 */
function formatParagraphContent(content) {
  return content
    .replace(/^(第\d+章.*$)/gm, '<div class="chapter-title">$1</div>')
    .replace(/^(Chapter \d+.*$)/gm, '<div class="chapter-title">$1</div>')
    .replace(/\n/g, '<br>');
}

/**
 * Setup paragraph interactions
 */
function setupParagraphInteractions() {
  // Double-click to edit
  $(document).off('dblclick.sw').on('dblclick.sw', '.outline-paragraph .paragraph-content', function(e) {
    e.preventDefault();
    enableParagraphEditing($(this));
  });
  
  // Action button clicks
  $(document).off('click.sw-actions').on('click.sw-actions', '.paragraph-action', function(e) {
    e.stopPropagation();
    const action = $(this).data('action');
    const $paragraph = $(this).closest('.outline-paragraph');
    const paragraphId = $paragraph.data('paragraph-id');
    
    switch (action) {
      case 'duplicate':
        duplicateParagraph(paragraphId);
        break;
      case 'generate-details':
        if (enhancedFocusSystem) {
          enhancedFocusSystem.focusAndGenerateDetails(paragraphId);
        }
        break;
      case 'delete':
        deleteParagraph(paragraphId);
        break;
    }
  });
}

/**
 * Enable paragraph editing
 */
function enableParagraphEditing($content) {
  if ($content.attr('contenteditable') === 'true') return;
  
  const paragraphId = $content.closest('.outline-paragraph').data('paragraph-id');
  const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
  
  if (!paragraph) return;
  
  $content.attr('contenteditable', 'true');
  $content.addClass('editing');
  $content.text(paragraph.content); // Show plain text for editing
  $content.focus();
  
  // Save on blur
  $content.on('blur.sw-edit', function() {
    const newContent = $(this).text().trim();
    paragraph.content = newContent;
    paragraph.wordCount = newContent.length;
    
    // Update display
    $(this).html(formatParagraphContent(newContent));
    $(this).attr('contenteditable', 'false');
    $(this).removeClass('editing');
    $(this).off('blur.sw-edit keydown.sw-edit');
    
    // Update stats
    $content.closest('.paragraph-main').find('.word-count').text(newContent.length);
    
    // Save changes
    saveOutlineParagraphs();
    
    showNotification('段落已更新', 'success');
  });
  
  // Save on Enter
  $content.on('keydown.sw-edit', function(e) {
    if (e.key === 'Escape') {
      $(this).blur();
      e.preventDefault();
    }
  });
}

/**
 * Duplicate paragraph
 */
function duplicateParagraph(paragraphId) {
  const original = outlineParagraphs.find(p => p.id === paragraphId);
  if (!original) return;
  
  const duplicate = {
    ...original,
    id: `paragraph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    order: original.order + 1,
    content: original.content + ' (副本)',
    createdAt: new Date().toISOString(),
  };
  
  // Adjust order of subsequent paragraphs
  outlineParagraphs.forEach(p => {
    if (p.order > original.order) {
      p.order++;
    }
  });
  
  outlineParagraphs.push(duplicate);
  outlineParagraphs.sort((a, b) => a.order - b.order);
  
  renderOutlineParagraphs();
  saveOutlineParagraphs();
  showNotification('段落已复制', 'success');
}

/**
 * Delete paragraph
 */
function deleteParagraph(paragraphId) {
  const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
  if (!paragraph) return;
  
  if (confirm(`确定要删除第${paragraph.order}段吗？此操作不可撤销。`)) {
    const deletedOrder = paragraph.order;
    
    // Remove paragraph
    outlineParagraphs = outlineParagraphs.filter(p => p.id !== paragraphId);
    
    // Adjust order of subsequent paragraphs
    outlineParagraphs.forEach(p => {
      if (p.order > deletedOrder) {
        p.order--;
      }
    });
    
    renderOutlineParagraphs();
    saveOutlineParagraphs();
    showNotification('段落已删除', 'success');
  }
}

/**
 * Setup paragraph drag and drop functionality
 */
function setupParagraphDragging() {
  const $container = $('#sw-outline-paragraphs');
  let draggedElement = null;
  let draggedIndex = -1;

  // Handle drag start
  $container
    .off('mousedown.sw-drag')
    .on('mousedown.sw-drag', '.paragraph-drag-handle', function (e) {
      const $paragraph = $(this).closest('.outline-paragraph');
      draggedElement = $paragraph[0];
      draggedIndex = $paragraph.index();
      $paragraph.addClass('dragging');

      $(document).on('mousemove.sw-drag', handleDragMove);
      $(document).on('mouseup.sw-drag', handleDragEnd);
      
      e.preventDefault();
    });

  function handleDragMove(e) {
    if (!draggedElement) return;

    const mouseY = e.clientY;
    const $paragraphs = $container.find('.outline-paragraph');
    let targetIndex = -1;

    $paragraphs.each(function(index) {
      const rect = this.getBoundingClientRect();
      if (mouseY > rect.top && mouseY < rect.bottom) {
        targetIndex = index;
        return false;
      }
    });

    if (targetIndex !== -1 && targetIndex !== draggedIndex) {
      const $target = $paragraphs.eq(targetIndex);
      const $dragged = $(draggedElement);
      
      if (targetIndex < draggedIndex) {
        $target.before($dragged);
      } else {
        $target.after($dragged);
      }
      
      draggedIndex = targetIndex;
    }
  }

  function handleDragEnd() {
    if (draggedElement) {
      $(draggedElement).removeClass('dragging');
      
      // Update paragraph order
      const newOrder = [];
      $container.find('.outline-paragraph').each(function(index) {
        const paragraphId = $(this).data('paragraph-id');
        const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
        if (paragraph) {
          paragraph.order = index + 1;
          newOrder.push(paragraph);
        }
      });
      
      outlineParagraphs = newOrder.sort((a, b) => a.order - b.order);
      saveOutlineParagraphs();
      
      // Update display
      $container.find('.paragraph-number').each(function(index) {
        $(this).text(index + 1);
      });
    }
    
    draggedElement = null;
    draggedIndex = -1;
    $(document).off('mousemove.sw-drag mouseup.sw-drag');
  }
}

/**
 * Setup batch management functionality
 */
function setupBatchManagement() {
  // Select all functionality
  $('#sw-select-all-paragraphs').off('change.sw-batch').on('change.sw-batch', function() {
    const isChecked = $(this).prop('checked');
    $('.paragraph-checkbox').prop('checked', isChecked);
    updateBatchSelectionUI();
  });

  // Individual checkbox changes
  $(document).off('change.sw-batch', '.paragraph-checkbox').on('change.sw-batch', '.paragraph-checkbox', function() {
    updateBatchSelectionUI();
  });

  // Batch action buttons
  $('#sw-batch-copy').off('click.sw-batch').on('click.sw-batch', batchCopyParagraphs);
  $('#sw-batch-delete').off('click.sw-batch').on('click.sw-batch', batchDeleteParagraphs);
  $('#sw-batch-merge').off('click.sw-batch').on('click.sw-batch', batchMergeParagraphs);
}

/**
 * Update batch selection UI
 */
function updateBatchSelectionUI() {
  const totalParagraphs = $('.paragraph-checkbox').length;
  const selectedParagraphs = $('.paragraph-checkbox:checked').length;
  
  $('#sw-selected-count').text(selectedParagraphs);
  
  // Update select all checkbox
  const selectAllCheckbox = $('#sw-select-all-paragraphs')[0];
  if (selectAllCheckbox) {
    selectAllCheckbox.indeterminate = selectedParagraphs > 0 && selectedParagraphs < totalParagraphs;
    selectAllCheckbox.checked = selectedParagraphs === totalParagraphs && totalParagraphs > 0;
  }
  
  // Enable/disable batch action buttons
  const hasSelection = selectedParagraphs > 0;
  $('#sw-batch-copy, #sw-batch-delete, #sw-batch-merge').prop('disabled', !hasSelection);
}

/**
 * Batch copy paragraphs
 */
function batchCopyParagraphs() {
  const selectedContent = [];
  $('.paragraph-checkbox:checked').each(function() {
    const paragraphId = $(this).data('paragraph-id');
    const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
    if (paragraph) {
      selectedContent.push(paragraph.content);
    }
  });
  
  if (selectedContent.length > 0) {
    const content = selectedContent.join('\n\n');
    navigator.clipboard.writeText(content).then(() => {
      showNotification(`已复制${selectedContent.length}个段落`, 'success');
    }).catch(() => {
      showNotification('复制失败', 'error');
    });
  }
}

/**
 * Batch delete paragraphs
 */
function batchDeleteParagraphs() {
  const selectedIds = [];
  $('.paragraph-checkbox:checked').each(function() {
    selectedIds.push($(this).data('paragraph-id'));
  });
  
  if (selectedIds.length === 0) return;
  
  if (confirm(`确定要删除${selectedIds.length}个段落吗？此操作不可撤销。`)) {
    // Remove paragraphs
    outlineParagraphs = outlineParagraphs.filter(p => !selectedIds.includes(p.id));
    
    // Reorder remaining paragraphs
    outlineParagraphs.forEach((p, index) => {
      p.order = index + 1;
    });
    
    renderOutlineParagraphs();
    saveOutlineParagraphs();
    showNotification(`已删除${selectedIds.length}个段落`, 'success');
  }
}

/**
 * Batch merge paragraphs
 */
function batchMergeParagraphs() {
  const selectedParagraphs = [];
  $('.paragraph-checkbox:checked').each(function() {
    const paragraphId = $(this).data('paragraph-id');
    const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
    if (paragraph) {
      selectedParagraphs.push(paragraph);
    }
  });
  
  if (selectedParagraphs.length < 2) {
    showNotification('请至少选择2个段落进行合并', 'warning');
    return;
  }
  
  // Sort by order
  selectedParagraphs.sort((a, b) => a.order - b.order);
  
  // Create merged paragraph
  const firstParagraph = selectedParagraphs[0];
  const mergedContent = selectedParagraphs.map(p => p.content).join('\n\n');
  
  // Update first paragraph with merged content
  firstParagraph.content = mergedContent;
  firstParagraph.wordCount = mergedContent.length;
  
  // Remove other selected paragraphs
  const idsToRemove = selectedParagraphs.slice(1).map(p => p.id);
  outlineParagraphs = outlineParagraphs.filter(p => !idsToRemove.includes(p.id));
  
  // Reorder paragraphs
  outlineParagraphs.forEach((p, index) => {
    p.order = index + 1;
  });
  
  renderOutlineParagraphs();
  saveOutlineParagraphs();
  showNotification(`已合并${selectedParagraphs.length}个段落`, 'success');
}

/**
 * Update statistics display
 */
function updateStats(content, generationTime) {
  const wordCount = content.length;
  const chapterCount = outlineParagraphs.length;
  
  $('#sw-word-count').text(wordCount);
  $('#sw-generation-time').text(`${(generationTime / 1000).toFixed(1)}秒`);
  $('#sw-actual-chapters').text(chapterCount);
  
  $('#sw-output-stats').removeClass('hidden');
}

/**
 * Copy results to clipboard
 */
function copyResults() {
  const content = outlineParagraphs.map(p => p.content).join('\n\n');
  if (!content) {
    showNotification('没有可复制的内容', 'warning');
    return;
  }
  
  navigator.clipboard.writeText(content).then(() => {
    showNotification('大纲已复制到剪贴板', 'success');
  }).catch(err => {
    console.error('Failed to copy:', err);
    showNotification('复制失败', 'error');
  });
}

/**
 * Save results as file
 */
function saveResults() {
  const content = outlineParagraphs.map(p => p.content).join('\n\n');
  if (!content) {
    showNotification('没有可保存的内容', 'warning');
    return;
  }
  
  const filename = `故事大纲_${new Date().toISOString().split('T')[0]}.txt`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  
  // Use SillyTavern's download utility if available
  if (window.download) {
    download(blob, filename);
  } else {
    // Fallback download method
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  showNotification('大纲已保存', 'success');
}

/**
 * Export results as markdown
 */
function exportResults() {
  if (!outlineParagraphs.length) {
    showNotification('没有可导出的内容', 'warning');
    return;
  }
  
  let markdown = `# 故事大纲\n\n`;
  markdown += `生成时间：${new Date().toLocaleString()}\n\n`;
  
  outlineParagraphs.forEach(paragraph => {
    markdown += `## ${paragraph.content.split('\n')[0]}\n\n`;
    const contentLines = paragraph.content.split('\n').slice(1);
    if (contentLines.length > 0) {
      markdown += contentLines.join('\n') + '\n\n';
    }
  });
  
  const filename = `故事大纲_${new Date().toISOString().split('T')[0]}.md`;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  
  if (window.download) {
    download(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  showNotification('Markdown已导出', 'success');
}

/**
 * Save outline paragraphs
 */
function saveOutlineParagraphs() {
  if (!settings.savedContent) {
    settings.savedContent = {};
  }
  settings.savedContent.paragraphs = outlineParagraphs;
  saveSettings();
}

/**
 * Load outline paragraphs
 */
function loadOutlineParagraphs() {
  if (settings.savedContent && settings.savedContent.paragraphs) {
    outlineParagraphs = settings.savedContent.paragraphs || [];
    renderOutlineParagraphs();
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Use SillyTavern's notification system if available
  if (window.toastr) {
    toastr[type](message);
  } else {
    console.log(`[Story Weaver] ${type.toUpperCase()}: ${message}`);
  }
}

/**
 * Get story type display name
 */
function getStoryTypeName(type) {
  const names = {
    fantasy: '奇幻冒险',
    romance: '浪漫爱情',
    mystery: '悬疑推理',
    scifi: '科幻未来',
    'slice-of-life': '日常生活',
    action: '动作冒险',
    drama: '情感剧情',
    horror: '恐怖惊悚',
    comedy: '轻松喜剧',
    custom: '自定义'
  };
  return names[type] || '自定义';
}

/**
 * Get detail level display name
 */
function getDetailLevelName(level) {
  const names = {
    brief: '简要',
    detailed: '详细',
    comprehensive: '全面'
  };
  return names[level] || '详细';
}

/**
 * ===== CORE SYSTEM CLASSES =====
 */

/**
 * OutlineVersionManager - Manages outline and detail outline versions
 */
class OutlineVersionManager {
  constructor() {
    this.currentOutlineId = null;
    this.outlines = new Map();
    this.history = [];
    this.maxHistorySize = 5;
    this.hotkeys = {
      enabled: true,
      annotationMode: false,
    };
    this.loadFromLocalStorage();
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `outline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create new outline version
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
      detailOutlines: [],
    };

    this.outlines.set(id, outline);
    this.currentOutlineId = id;
    this.addToHistory(id);
    this.saveToLocalStorage();

    console.log('[Version Manager] Created new outline:', id);
    return outline;
  }

  /**
   * Create detail outline version
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

    if (!parentOutline.detailOutlines) {
      parentOutline.detailOutlines = [];
    }
    parentOutline.detailOutlines.push(id);

    this.saveToLocalStorage();
    console.log('[Version Manager] Created detail outline:', id, 'for parent:', parentId);
    return detailOutline;
  }

  /**
   * Get outline by ID
   */
  getOutline(id) {
    return this.outlines.get(id);
  }

  /**
   * Get current outline
   */
  getCurrentOutline() {
    return this.currentOutlineId ? this.outlines.get(this.currentOutlineId) : null;
  }

  /**
   * Get detail outlines for a parent
   */
  getDetailOutlines(parentId) {
    const parentOutline = this.outlines.get(parentId);
    if (!parentOutline || !parentOutline.detailOutlines) {
      return [];
    }
    return parentOutline.detailOutlines.map(id => this.outlines.get(id)).filter(outline => outline);
  }

  /**
   * Delete version
   */
  deleteVersion(id) {
    if (!id || !this.outlines.has(id)) return false;

    const outline = this.outlines.get(id);

    // Delete associated detail outlines
    if (outline.detailOutlines) {
      outline.detailOutlines.forEach(detailId => {
        this.outlines.delete(detailId);
      });
    }

    this.outlines.delete(id);
    this.history = this.history.filter(historyId => historyId !== id);

    if (this.currentOutlineId === id) {
      this.currentOutlineId = this.history.length > 0 ? this.history[0] : null;
    }

    this.saveToLocalStorage();
    console.log('[Version Manager] Deleted outline version:', id);
    return true;
  }

  /**
   * Add to history
   */
  addToHistory(id) {
    this.history = this.history.filter(historyId => historyId !== id);
    this.history.unshift(id);
    
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get version history
   */
  getVersionHistory() {
    return this.history.map(id => this.outlines.get(id)).filter(outline => outline);
  }

  /**
   * Switch to version
   */
  switchToVersion(id) {
    if (this.outlines.has(id)) {
      this.currentOutlineId = id;
      this.addToHistory(id);
      this.saveToLocalStorage();
      return this.outlines.get(id);
    }
    return null;
  }

  /**
   * Save to localStorage
   */
  saveToLocalStorage() {
    try {
      const data = {
        currentOutlineId: this.currentOutlineId,
        outlines: Array.from(this.outlines.entries()),
        history: this.history,
        hotkeys: this.hotkeys,
        timestamp: Date.now()
      };
      localStorage.setItem('story-weaver-versions', JSON.stringify(data));
    } catch (error) {
      console.error('[Version Manager] Failed to save to localStorage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('story-weaver-versions');
      if (stored) {
        const data = JSON.parse(stored);
        this.currentOutlineId = data.currentOutlineId || null;
        this.outlines = new Map(data.outlines || []);
        this.history = data.history || [];
        this.hotkeys = { ...this.hotkeys, ...data.hotkeys };
      }
    } catch (error) {
      console.error('[Version Manager] Failed to load from localStorage:', error);
      this.outlines = new Map();
      this.history = [];
    }
  }

  /**
   * Clear all versions
   */
  clearAllVersions() {
    this.outlines.clear();
    this.history = [];
    this.currentOutlineId = null;
    this.saveToLocalStorage();
    console.log('[Version Manager] Cleared all versions');
  }

  /**
   * Export version data
   */
  exportVersionData() {
    return {
      currentOutlineId: this.currentOutlineId,
      outlines: Array.from(this.outlines.entries()),
      history: this.history,
      timestamp: Date.now(),
      version: '1.0.0'
    };
  }

  /**
   * Import version data
   */
  importVersionData(data) {
    try {
      if (data.outlines) {
        this.outlines = new Map(data.outlines);
      }
      if (data.history) {
        this.history = data.history;
      }
      if (data.currentOutlineId) {
        this.currentOutlineId = data.currentOutlineId;
      }
      this.saveToLocalStorage();
      console.log('[Version Manager] Imported version data successfully');
      return true;
    } catch (error) {
      console.error('[Version Manager] Failed to import version data:', error);
      return false;
    }
  }
}

/**
 * DetailOutlineManager - Manages detail outline generation
 */
class DetailOutlineManager {
  constructor(versionManager) {
    this.versionManager = versionManager;
  }

  /**
   * Generate detail outlines for selected chapters
   */
  async generateDetailOutlines(selectedChapters) {
    if (!selectedChapters || selectedChapters.length === 0) {
      showNotification('请先选择要生成细纲的章节', 'warning');
      return;
    }

    const currentOutline = this.versionManager.getCurrentOutline();
    if (!currentOutline) {
      showNotification('请先生成主要大纲', 'warning');
      return;
    }

    console.log('[Detail Outline Manager] Starting detail generation for', selectedChapters.length, 'chapters');
    
    for (let i = 0; i < selectedChapters.length; i++) {
      const chapter = selectedChapters[i];
      try {
        await this.generateSingleChapterDetail(currentOutline, chapter, i);
      } catch (error) {
        console.error(`[Detail Outline Manager] Failed to generate detail for chapter "${chapter.title}":`, error);
        showNotification(`生成"${chapter.title}"细纲时出错`, 'error');
      }
    }

    showNotification(`成功生成${selectedChapters.length}个章节的细纲`, 'success');
  }

  /**
   * Generate detail for a single chapter
   */
  async generateSingleChapterDetail(parentOutline, chapter, chapterIndex) {
    const prompt = this.buildDetailPrompt(parentOutline, chapter);
    
    try {
      const response = await generateAIResponse(prompt);
      if (response && response.trim()) {
        const detailOutline = this.versionManager.createDetailOutline(
          parentOutline.id,
          chapterIndex,
          `${chapter.title} - 细纲`,
          response.trim(),
          { chapterTitle: chapter.title }
        );
        
        console.log('[Detail Outline Manager] Detail outline created:', detailOutline.id);
        return detailOutline;
      } else {
        throw new Error('生成的细纲内容为空');
      }
    } catch (error) {
      console.error('[Detail Outline Manager] Error generating detail:', error);
      throw error;
    }
  }

  /**
   * Build detail generation prompt
   */
  buildDetailPrompt(parentOutline, chapter) {
    return `基于以下主要大纲，请为指定章节生成详细的细纲：

主要大纲背景：
${parentOutline.content}

需要详细化的章节：
${chapter.title}
${chapter.content || ''}

要求：
1. 保持与主要大纲的一致性
2. 详细展开该章节的情节发展
3. 包含具体的场景描述
4. 明确角色的行动和对话要点
5. 确保情节的逻辑连贯性

请生成详细的章节细纲：`;
  }

  /**
   * Show details for a paragraph
   */
  async showDetailsForParagraph(paragraphId) {
    const currentOutline = this.versionManager.getCurrentOutline();
    if (!currentOutline) return;

    const detailOutlines = this.versionManager.getDetailOutlines(currentOutline.id);
    if (detailOutlines.length === 0) {
      showNotification('暂无细纲，请先生成细纲', 'info');
      return;
    }

    this.createDetailResultsModal(detailOutlines);
  }

  /**
   * Create detail results modal
   */
  createDetailResultsModal(detailOutlines) {
    const modal = $(`
      <div class="detail-modal-overlay">
        <div class="detail-modal">
          <div class="detail-header">
            <h3>📚 章节细纲 (共${detailOutlines.length}个)</h3>
            <button class="detail-close">&times;</button>
          </div>
          <div class="detail-content">
            ${detailOutlines.map(detail => `
              <div class="detail-item" data-detail-id="${detail.id}">
                <div class="detail-item-header">
                  <h4>${detail.title}</h4>
                  <div class="detail-actions">
                    <button class="detail-action" data-action="copy" title="复制">📋</button>
                    <button class="detail-action" data-action="edit" title="编辑">✏️</button>
                    <button class="detail-action" data-action="delete" title="删除">🗑️</button>
                  </div>
                </div>
                <div class="detail-item-content">${detail.content}</div>
              </div>
            `).join('')}
          </div>
          <div class="detail-footer">
            <button id="export-all-details" class="detail-btn">导出所有细纲</button>
          </div>
        </div>
      </div>
    `);

    $('body').append(modal);
    this.bindDetailResultsEvents(modal, detailOutlines);
  }

  /**
   * Bind detail results events
   */
  bindDetailResultsEvents(modal, detailOutlines) {
    modal.find('.detail-close').on('click', () => modal.remove());
    
    modal.find('.detail-action').on('click', function(e) {
      const action = $(this).data('action');
      const detailId = $(this).closest('.detail-item').data('detail-id');
      const detail = detailOutlines.find(d => d.id === detailId);
      
      switch (action) {
        case 'copy':
          navigator.clipboard.writeText(detail.content);
          showNotification('细纲已复制', 'success');
          break;
        case 'edit':
          // Edit functionality would be implemented here
          showNotification('编辑功能开发中', 'info');
          break;
        case 'delete':
          if (confirm('确定删除这个细纲？')) {
            // Delete detail outline
            showNotification('细纲已删除', 'success');
            $(e.target).closest('.detail-item').remove();
          }
          break;
      }
    });

    modal.find('#export-all-details').on('click', () => {
      this.exportAllDetails(detailOutlines);
    });

    // Click outside to close
    modal.on('click', function(e) {
      if (e.target === this) {
        modal.remove();
      }
    });
  }

  /**
   * Export all details
   */
  exportAllDetails(detailOutlines) {
    const content = detailOutlines
      .map(detail => `# ${detail.title}\n\n${detail.content}\n\n---\n`)
      .join('\n');
    
    const filename = `细纲导出_${new Date().toISOString().split('T')[0]}.md`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    
    if (window.download) {
      download(blob, filename);
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    showNotification('细纲已导出', 'success');
  }
}

/**
 * Enhanced Focus System with complete functionality
 */
class EnhancedFocusSystem {
  constructor() {
    this.currentFocusedParagraph = null;
    this.currentDBlocks = [];
    this.longPressTimer = null;
    this.longPressDelay = 800;
    this.focusOverlay = null;
    this.dblocksContainer = null;
    this.init();
  }

  init() {
    this.focusOverlay = document.getElementById('sw-focus-overlay');
    this.dblocksContainer = document.getElementById('sw-dblocks-container');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Long press for focus
    $(document)
      .off('mousedown.sw-focus')
      .on('mousedown.sw-focus', '.outline-paragraph', (e) => {
        if ($(e.target).closest('.paragraph-actions, .paragraph-content[contenteditable="true"]').length) {
          return;
        }
        this.handleParagraphPress(e);
      })
      .off('mouseup.sw-focus mouseleave.sw-focus')
      .on('mouseup.sw-focus mouseleave.sw-focus', '.outline-paragraph', (e) => {
        this.handleParagraphRelease(e);
      });

    // Focus overlay click
    if (this.focusOverlay) {
      $(this.focusOverlay).on('click', () => this.unfocusParagraph());
    }

    // Escape key
    $(document).on('keydown.sw-focus', (e) => {
      if (e.key === 'Escape' && this.currentFocusedParagraph) {
        this.unfocusParagraph();
      }
    });
  }

  handleParagraphPress(e) {
    const $paragraph = $(e.target).closest('.outline-paragraph');
    if (!$paragraph.length) return;

    const paragraphId = $paragraph.data('paragraph-id');
    
    this.clearLongPressTimer();
    
    this.longPressTimer = setTimeout(() => {
      this.focusParagraph(paragraphId);
      $paragraph.removeClass('long-pressing');
    }, this.longPressDelay);

    $paragraph.addClass('long-pressing');
  }

  handleParagraphRelease(e) {
    const $paragraph = $(e.target).closest('.outline-paragraph');
    $paragraph.removeClass('long-pressing');
    this.clearLongPressTimer();
  }

  clearLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  focusParagraph(paragraphId) {
    if (this.currentFocusedParagraph === paragraphId) return;

    if (this.currentFocusedParagraph) {
      this.unfocusParagraph();
    }

    const $paragraph = $(`.outline-paragraph[data-paragraph-id="${paragraphId}"]`);
    if (!$paragraph.length) return;

    this.currentFocusedParagraph = paragraphId;

    // Store original position
    const originalRect = $paragraph[0].getBoundingClientRect();
    $paragraph.data('original-position', {
      top: originalRect.top,
      left: originalRect.left,
      position: $paragraph.css('position'),
      transform: $paragraph.css('transform')
    });

    // Apply focus styling
    $paragraph.addClass('focused');
    
    // Center on screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const width = $paragraph.outerWidth();
    const height = $paragraph.outerHeight();
    
    $paragraph.css({
      top: centerY - height / 2,
      left: centerX - width / 2,
      position: 'fixed',
      zIndex: 1001
    });

    // Show overlay
    if (this.focusOverlay) {
      this.focusOverlay.classList.add('active');
    }

    showNotification('进入聚焦模式，点击背景或按ESC退出', 'info');
  }

  unfocusParagraph() {
    if (!this.currentFocusedParagraph) return;

    const $paragraph = $(`.outline-paragraph[data-paragraph-id="${this.currentFocusedParagraph}"]`);
    
    if ($paragraph.length) {
      const originalPos = $paragraph.data('original-position');
      if (originalPos) {
        $paragraph.css({
          position: originalPos.position || 'relative',
          top: 'auto',
          left: 'auto',
          transform: originalPos.transform || 'none',
          zIndex: 'auto'
        });
      }
      
      $paragraph.removeClass('focused');
    }

    if (this.focusOverlay) {
      this.focusOverlay.classList.remove('active');
    }

    this.clearDBlocks();
    this.currentFocusedParagraph = null;
  }

  async focusAndGenerateDetails(paragraphId) {
    this.focusParagraph(paragraphId);
    await this.generateDetailsForFocusedParagraph(paragraphId);
  }

  async generateDetailsForFocusedParagraph(paragraphId) {
    const paragraph = outlineParagraphs.find(p => p.id === paragraphId);
    if (!paragraph) return;

    const $paragraph = $(`.outline-paragraph[data-paragraph-id="${paragraphId}"]`);
    $paragraph.addClass('generating-details');

    try {
      console.log('[Enhanced Focus] Generating details for paragraph:', paragraphId);
      
      const currentOutline = versionManager.getCurrentOutline();
      if (!currentOutline) {
        showNotification('请先生成主要大纲', 'warning');
        return;
      }

      // Create chapter object from paragraph
      const chapter = {
        title: paragraph.content.split('\n')[0] || `段落 ${paragraph.order}`,
        content: paragraph.content
      };

      // Generate detail outline
      const prompt = this.buildDetailPrompt(currentOutline, chapter);
      const response = await generateAIResponse(prompt);
      
      if (response && response.trim()) {
        const detailOutline = versionManager.createDetailOutline(
          currentOutline.id,
          paragraph.order - 1,
          `${chapter.title} - 细纲`,
          response.trim(),
          { paragraphId: paragraphId }
        );
        
        // After generation, reload DBlocks
        await this.loadAndDisplayDBlocks(paragraphId);
        showNotification('细纲生成成功！', 'success');
      } else {
        throw new Error('生成的细纲内容为空');
      }
      
    } catch (error) {
      console.error('[Enhanced Focus] Error generating details:', error);
      showNotification('生成细纲时出错: ' + error.message, 'error');
    } finally {
      $paragraph.removeClass('generating-details');
    }
  }

  buildDetailPrompt(parentOutline, chapter) {
    return `基于以下主要大纲，请为指定段落生成详细的细纲：

主要大纲背景：
${parentOutline.content}

需要详细化的段落：
${chapter.title}
${chapter.content || ''}

要求：
1. 保持与主要大纲的一致性
2. 详细展开该段落的情节发展
3. 包含具体的场景描述和角色行动
4. 确保情节的逻辑连贯性
5. 生成3-5个具体的情节点

请生成详细的段落细纲：`;
  }

  clearDBlocks() {
    this.currentDBlocks.forEach(dblock => {
      if (dblock.parentNode) {
        dblock.parentNode.removeChild(dblock);
      }
    });
    this.currentDBlocks = [];
  }
}

/**
 * Register slash commands
 */
function registerSlashCommands() {
  SlashCommandParser.addCommandObject({
    name: 'story-weaver',
    callback: () => {
      if (extensionPanel && extensionPanel.hasClass('hidden')) {
        extensionPanel.removeClass('hidden');
        settings.closed = false;
        saveSettings();
      }
      return '已打开Story Weaver面板';
    },
    helpString: '打开Story Weaver故事大纲生成器面板',
    aliases: ['sw', '故事编织者']
  });

  SlashCommandParser.addCommandObject({
    name: 'sw-generate',
    callback: () => {
      generateOutline();
      return '开始生成故事大纲...';
    },
    helpString: '快速生成故事大纲',
  });
}

/**
 * Extension initialization function
 */
function initExtension() {
  console.log('[Story Weaver] Initializing extension...');
  
  // Load settings
  loadSettings();
  
  // Initialize complete version manager
  versionManager = new OutlineVersionManager();
  
  // Initialize detail outline manager
  const detailOutlineManager = new DetailOutlineManager(versionManager);
  
  // Initialize extension panel
  initExtensionPanel();
  
  // Load saved data
  loadOutlineParagraphs();
  
  // Register slash commands
  registerSlashCommands();
  
  // Mark as loaded
  isExtensionLoaded = true;
  
  console.log('[Story Weaver] Extension initialized successfully');
}

/**
 * Extension cleanup function
 */
function cleanupExtension() {
  // Remove event listeners
  $(document).off('.sw .sw-focus .sw-actions .sw-edit');
  
  // Clear timers
  if (enhancedFocusSystem) {
    enhancedFocusSystem.clearLongPressTimer();
  }
  
  // Remove UI elements
  $('#story-weaver-extension, #sw-focus-overlay, #sw-dblocks-container').remove();
  
  isExtensionLoaded = false;
  console.log('[Story Weaver] Extension cleanup completed');
}

// Extension event listeners
eventSource.on('extensionInit', initExtension);
eventSource.on('extensionCleanup', cleanupExtension);

// Initialize when DOM is ready
jQuery(document).ready(() => {
  // Wait for SillyTavern to be fully loaded
  if (typeof eventSource !== 'undefined') {
    initExtension();
  } else {
    // Fallback: wait and try again
    setTimeout(() => {
      if (typeof eventSource !== 'undefined') {
        initExtension();
      }
    }, 1000);
  }
});

console.log('[Story Weaver] Extension script loaded');