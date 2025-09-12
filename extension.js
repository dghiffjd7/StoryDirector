/**
 * Story Weaver - SillyTavern Extension
 * AI-powered story outline generator with advanced focus system
 * Version: 1.0.0
 */

jQuery(document).ready(function() {
  // Wait for SillyTavern to be fully loaded
  const extensionName = 'story-weaver';
  let isExtensionLoaded = false;
  
  console.log('[Story Weaver] Loading extension...');
  
  // Default settings
  const defaultSettings = {
    enableAutoRead: false,
    includeDialogueHistory: true,
    maxHistoryMessages: 10,
    defaultStoryType: 'fantasy',
    defaultNarrativeStyle: 'descriptive',
    defaultChapters: 10,
    defaultDetailLevel: 'medium',
    enableVersioning: true,
    enableDetailOutlines: true
  };

  // Initialize extension settings
  if (!window.extension_settings) {
    window.extension_settings = {};
  }
  
  if (!window.extension_settings[extensionName]) {
    window.extension_settings[extensionName] = { ...defaultSettings };
  }

  // Create main UI
  function createMainUI() {
    const html = `
      <div id="story-weaver-extension" class="story-weaver-extension" style="display:none;">
        <div class="story-weaver-header">
          <h3>📖 Story Weaver - 故事大纲生成器</h3>
          <button class="sw-close-btn">&times;</button>
        </div>
        <div class="story-weaver-content">
          <div class="sw-section">
            <h4>📚 数据源设置</h4>
            <button id="sw-read-worldbook" class="sw-btn">读取当前启用的世界书</button>
            <button id="sw-read-character" class="sw-btn">读取角色卡信息</button>
            <button id="sw-read-history" class="sw-btn">读取对话历史</button>
            <div id="sw-data-display" class="sw-data-display"></div>
          </div>
          
          <div class="sw-section">
            <h4>🎭 创作配置</h4>
            <div class="sw-form-group">
              <label>故事类型:</label>
              <select id="sw-story-type">
                <option value="fantasy">奇幻 Fantasy</option>
                <option value="romance">爱情 Romance</option>
                <option value="mystery">悬疑 Mystery</option>
                <option value="scifi">科幻 Sci-Fi</option>
                <option value="adventure">冒险 Adventure</option>
                <option value="drama">剧情 Drama</option>
                <option value="comedy">喜剧 Comedy</option>
                <option value="horror">恐怖 Horror</option>
                <option value="slice_of_life">日常 Slice of Life</option>
                <option value="custom">自定义 Custom</option>
              </select>
            </div>
            
            <div class="sw-form-group">
              <label>叙事风格:</label>
              <select id="sw-narrative-style">
                <option value="descriptive">描述型 Descriptive</option>
                <option value="dialogue">对话型 Dialogue-heavy</option>
                <option value="action">动作型 Action-packed</option>
                <option value="introspective">内省型 Introspective</option>
                <option value="cinematic">电影化 Cinematic</option>
              </select>
            </div>
            
            <div class="sw-form-group">
              <label>章节数量:</label>
              <input type="number" id="sw-chapters" min="3" max="50" value="10">
            </div>
            
            <div class="sw-form-group">
              <label>详细程度:</label>
              <select id="sw-detail-level">
                <option value="brief">简要 Brief</option>
                <option value="medium">中等 Medium</option>
                <option value="detailed">详细 Detailed</option>
                <option value="comprehensive">全面 Comprehensive</option>
              </select>
            </div>
            
            <div class="sw-form-group">
              <label>故事主题:</label>
              <textarea id="sw-theme" placeholder="描述故事的核心主题和主要冲突..."></textarea>
            </div>
            
            <div class="sw-form-group">
              <label>特殊要求:</label>
              <textarea id="sw-requirements" placeholder="任何特殊要求或限制..."></textarea>
            </div>
          </div>
          
          <div class="sw-section">
            <h4>🎯 生成操作</h4>
            <button id="sw-generate-outline" class="sw-btn sw-btn-primary">🎭 生成故事大纲</button>
            <div id="sw-progress" class="sw-progress" style="display:none;">
              <div class="sw-progress-bar"></div>
            </div>
          </div>
          
          <div class="sw-section">
            <h4>📄 生成结果</h4>
            <div id="sw-result-area" class="sw-result-area">
              <div class="sw-no-result">暂无生成结果</div>
            </div>
            <div class="sw-result-actions" style="display:none;">
              <button id="sw-copy-result" class="sw-btn">📋 复制</button>
              <button id="sw-save-result" class="sw-btn">💾 保存</button>
              <button id="sw-export-md" class="sw-btn">📝 导出Markdown</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    $('body').append(html);
  }

  // Create toolbar button
  function createToolbarButton() {
    const button = `
      <div id="sw-toolbar-btn" class="fa-solid fa-book-open right_menu_button menu_button" 
           title="Story Weaver - 故事大纲生成器">
      </div>
    `;
    $('#rightSendForm').prepend(button);
  }

  // Event handlers
  function bindEvents() {
    // Toggle main panel
    $(document).on('click', '#sw-toolbar-btn', function() {
      $('#story-weaver-extension').toggle();
    });
    
    // Close panel
    $(document).on('click', '.sw-close-btn', function() {
      $('#story-weaver-extension').hide();
    });
    
    // Generate outline
    $(document).on('click', '#sw-generate-outline', function() {
      generateOutline();
    });
    
    // Copy result
    $(document).on('click', '#sw-copy-result', function() {
      copyToClipboard();
    });
  }

  // Generate outline function
  async function generateOutline() {
    const resultArea = $('#sw-result-area');
    const progressBar = $('#sw-progress');
    
    try {
      progressBar.show();
      
      // Get form data
      const storyType = $('#sw-story-type').val();
      const narrativeStyle = $('#sw-narrative-style').val();
      const chapters = $('#sw-chapters').val();
      const detailLevel = $('#sw-detail-level').val();
      const theme = $('#sw-theme').val();
      const requirements = $('#sw-requirements').val();
      
      // Build prompt
      const prompt = buildGenerationPrompt(storyType, narrativeStyle, chapters, detailLevel, theme, requirements);
      
      // Send to AI
      const result = await sendToAI(prompt);
      
      // Display result
      displayResult(result);
      
    } catch (error) {
      console.error('[Story Weaver] Generation error:', error);
      resultArea.html(`<div class="sw-error">生成失败: ${error.message}</div>`);
    } finally {
      progressBar.hide();
    }
  }

  // Build generation prompt
  function buildGenerationPrompt(storyType, narrativeStyle, chapters, detailLevel, theme, requirements) {
    let prompt = `请为我创建一个${storyType}类型的故事大纲。

要求：
- 叙事风格：${narrativeStyle}
- 章节数量：${chapters}章
- 详细程度：${detailLevel}
- 主题：${theme || '根据设定自由发挥'}
- 特殊要求：${requirements || '无'}

请提供：
1. 故事概述
2. 主要角色介绍
3. 详细的章节大纲
4. 主要冲突和发展弧线
5. 结局安排

请用中文回答，格式清晰，便于阅读。`;

    return prompt;
  }

  // Send to AI (simplified version)
  async function sendToAI(prompt) {
    // This is a simplified implementation
    // In a real implementation, this would use SillyTavern's API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`# 故事大纲生成结果

## 故事概述
这是一个示例生成的故事大纲...

## 主要角色
- 主角：...
- 配角：...

## 章节大纲
### 第一章：开端
...

### 第二章：发展
...

（这是演示内容，实际使用时会连接到AI生成真实内容）`);
      }, 2000);
    });
  }

  // Display result
  function displayResult(result) {
    const resultArea = $('#sw-result-area');
    const actions = $('.sw-result-actions');
    
    resultArea.html(`<div class="sw-result-content">${result.replace(/\n/g, '<br>')}</div>`);
    actions.show();
  }

  // Copy to clipboard
  function copyToClipboard() {
    const text = $('#sw-result-area .sw-result-content').text();
    navigator.clipboard.writeText(text).then(() => {
      toastr.success('已复制到剪贴板');
    }).catch(() => {
      toastr.error('复制失败');
    });
  }

  // Initialize extension
  function initExtension() {
    if (isExtensionLoaded) return;
    
    console.log('[Story Weaver] Initializing extension...');
    
    createMainUI();
    createToolbarButton();
    bindEvents();
    
    isExtensionLoaded = true;
    console.log('[Story Weaver] Extension loaded successfully');
  }

  // Start initialization
  if (window.eventSource) {
    initExtension();
  } else {
    // Wait for SillyTavern to load
    setTimeout(initExtension, 1000);
  }
});

console.log('[Story Weaver] Extension script loaded');