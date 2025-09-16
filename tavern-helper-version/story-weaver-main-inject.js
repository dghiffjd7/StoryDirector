/**
 * Story Weaver - TavernHelper Version with Main Page Injection
 * Properly injects spirit ball into main SillyTavern page using jQuery
 * Based on successful pattern from 手机流式.html
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

// ========================= MAIN PAGE SPIRIT BALL INJECTION =========================

/**
 * Create and inject the floating spirit ball directly into main ST page
 */
function createMainPageSpiritBall() {
  console.log('[SW] Creating spirit ball on main ST page...');
  
  // Remove existing spirit ball if present
  if (typeof $ !== 'undefined') {
    $('.sw-spirit-ball').remove();
    $('#story-weaver-spirit-styles').remove();
    console.log('[SW] Removed existing spirit ball elements');
  }

  // Create spirit ball HTML
  const spiritHtml = `
    <div id="story-weaver-spirit" class="sw-spirit-ball">
      <div class="sw-spirit-inner">
        <div class="sw-spirit-icon">📖</div>
        <div class="sw-spirit-glow"></div>
        <div class="sw-spirit-pulse"></div>
      </div>
      <div class="sw-spirit-tooltip">Story Weaver<br>故事大纲生成器</div>
    </div>
  `;

  // Create styles
  const styleHtml = `
    <style id="story-weaver-spirit-styles">
      .sw-spirit-ball {
        position: fixed;
        width: 60px;
        height: 60px;
        bottom: 30px;
        right: 30px;
        z-index: 9999;
        cursor: pointer;
        user-select: none;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }

      .sw-spirit-ball.sw-spirit-visible {
        opacity: 1;
        transform: scale(1);
      }

      .sw-spirit-ball.sw-spirit-dragging {
        transform: scale(1.1);
        filter: brightness(1.2);
      }

      .sw-spirit-inner {
        position: relative;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 
          0 4px 15px rgba(102, 126, 234, 0.3),
          0 2px 8px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .sw-spirit-ball:hover .sw-spirit-inner {
        transform: scale(1.05);
        box-shadow: 
          0 6px 20px rgba(102, 126, 234, 0.4),
          0 4px 12px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }

      .sw-spirit-icon {
        font-size: 28px;
        z-index: 3;
        position: relative;
        animation: sw-spirit-float 3s ease-in-out infinite;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
      }

      @keyframes sw-spirit-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-2px); }
      }

      .sw-spirit-glow {
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
        animation: sw-spirit-glow-pulse 2s ease-in-out infinite;
        z-index: 1;
      }

      @keyframes sw-spirit-glow-pulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }

      .sw-spirit-pulse {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 50%;
        border: 2px solid rgba(102, 126, 234, 0.5);
        animation: sw-spirit-ripple 2s linear infinite;
        z-index: 2;
      }

      @keyframes sw-spirit-ripple {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }

      .sw-spirit-tooltip {
        position: absolute;
        bottom: 75px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        text-align: center;
        line-height: 1.3;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        pointer-events: none;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .sw-spirit-tooltip:after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: rgba(0, 0, 0, 0.9);
      }

      .sw-spirit-ball:hover .sw-spirit-tooltip {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(-5px);
      }

      .sw-spirit-ball.sw-spirit-active .sw-spirit-inner {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        animation: sw-spirit-active-glow 0.6s ease-out;
      }

      @keyframes sw-spirit-active-glow {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); filter: brightness(1.3); }
        100% { transform: scale(1); }
      }

      @media (max-width: 768px) {
        .sw-spirit-ball {
          width: 50px;
          height: 50px;
          bottom: 20px;
          right: 20px;
        }
        
        .sw-spirit-icon {
          font-size: 24px;
        }
        
        .sw-spirit-tooltip {
          font-size: 11px;
          padding: 6px 10px;
        }
      }
    </style>
  `;

  // Inject directly into main SillyTavern page
  if (typeof $ !== 'undefined') {
    console.log('[SW] Injecting spirit ball into main page...');
    
    $('head').append(styleHtml);
    $('body').append(spiritHtml);
    console.log('[SW] Spirit ball injected successfully');
    
    // Make it interactive
    setTimeout(() => {
      makeSpiritBallInteractive();
      
      // Show with animation
      setTimeout(() => {
        $('#story-weaver-spirit').addClass('sw-spirit-visible');
        console.log('[SW] ✅ Spirit ball is now visible on main page!');
        showWelcomeNotification();
      }, 100);
    }, 50);
    
  } else {
    console.error('[SW] ❌ jQuery not available, cannot inject into main page');
  }
}

/**
 * Make spirit ball interactive
 */
function makeSpiritBallInteractive() {
  const $spiritBall = $('#story-weaver-spirit');
  if ($spiritBall.length === 0) return;

  let isDragging = false;
  let hasMoved = false;
  let startPos = { x: 0, y: 0 };

  console.log('[SW] Making spirit ball interactive...');

  // Click handler
  $spiritBall.on('click', function(e) {
    if (!hasMoved) {
      console.log('[SW] Spirit ball clicked!');
      
      // Add click effect
      $(this).addClass('sw-spirit-active');
      setTimeout(() => {
        $(this).removeClass('sw-spirit-active');
      }, 600);
      
      // Open Story Weaver interface
      openStoryWeaverInterface();
    }
  });

  // Make draggable
  $spiritBall.on('mousedown', function(e) {
    isDragging = true;
    hasMoved = false;
    startPos = { x: e.clientX, y: e.clientY };
    $(this).addClass('sw-spirit-dragging');
    e.preventDefault();
  });

  $(document).on('mousemove', function(e) {
    if (!isDragging) return;
    
    const deltaX = Math.abs(e.clientX - startPos.x);
    const deltaY = Math.abs(e.clientY - startPos.y);
    
    if (deltaX > 5 || deltaY > 5) {
      hasMoved = true;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - 30));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - 30));
      
      $spiritBall.css({
        left: newX + 'px',
        top: newY + 'px',
        right: 'auto',
        bottom: 'auto'
      });
    }
  });

  $(document).on('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      $spiritBall.removeClass('sw-spirit-dragging');
      
      setTimeout(() => {
        hasMoved = false;
      }, 100);
    }
  });

  console.log('[SW] Spirit ball interaction handlers attached');
}

/**
 * Show welcome notification
 */
function showWelcomeNotification() {
  const notificationHtml = `
    <div id="sw-welcome-notification" style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transform: translateX(100%);
      transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    ">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">📖</div>
        <div>
          <div style="font-size: 14px; font-weight: 600;">Story Weaver Enhanced</div>
          <div style="font-size: 12px; opacity: 0.9;">Click the spirit ball to open</div>
        </div>
      </div>
    </div>
  `;

  if (typeof $ !== 'undefined') {
    $('body').append(notificationHtml);
    
    setTimeout(() => {
      $('#sw-welcome-notification').css('transform', 'translateX(0)');
    }, 500);
    
    setTimeout(() => {
      $('#sw-welcome-notification').css('transform', 'translateX(100%)');
      setTimeout(() => {
        $('#sw-welcome-notification').remove();
      }, 500);
    }, 4000);
  }
}

// ========================= TAVERN HELPER INTEGRATION =========================

/**
 * Initialize Story Weaver
 */
function init() {
  console.log('[SW] Initializing Story Weaver Enhanced...');
  
  // Register slash commands
  registerSlashCommands();
  
  // Initialize settings
  initializeGlobalVariables();
  
  // Create spirit ball on main page
  createMainPageSpiritBall();
  
  console.log('[SW] Story Weaver Enhanced v2.0 initialized!');
}

/**
 * Register slash commands
 */
function registerSlashCommands() {
  try {
    SlashCommandsAPI.registerSlashCommand({
      name: 'sw',
      description: 'Open Story Weaver interface - 打开故事大纲生成器',
      callback: openStoryWeaverInterface,
      helpString: 'Opens the enhanced Story Weaver interface'
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
      helpString: 'Usage: /swquick [type] [chapters]'
    });

    SlashCommandsAPI.registerSlashCommand({
      name: 'swspirit',
      description: 'Toggle spirit ball - 切换精灵球显示',
      callback: toggleSpiritBall,
      helpString: 'Show/hide the floating spirit ball'
    });

    console.log('[SW] Slash commands registered successfully');
  } catch (error) {
    console.error('[SW] Failed to register slash commands:', error);
  }
}

/**
 * Toggle spirit ball visibility
 */
function toggleSpiritBall() {
  if (typeof $ !== 'undefined') {
    const $spiritBall = $('#story-weaver-spirit');
    if ($spiritBall.length > 0) {
      if ($spiritBall.is(':visible')) {
        $spiritBall.removeClass('sw-spirit-visible');
        setTimeout(() => $spiritBall.hide(), 300);
        showNotification('精灵球已隐藏', 'info');
        console.log('[SW] Spirit ball hidden');
      } else {
        $spiritBall.show();
        setTimeout(() => $spiritBall.addClass('sw-spirit-visible'), 50);
        showNotification('精灵球已显示', 'success');
        console.log('[SW] Spirit ball shown');
      }
    } else {
      createMainPageSpiritBall();
      showNotification('精灵球已创建', 'success');
      console.log('[SW] Spirit ball recreated');
    }
  }
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

/**
 * Open Story Weaver interface
 */
function openStoryWeaverInterface() {
  const settings = loadSettings();
  const interfaceHTML = buildSimpleInterface(settings);
  
  TavernHelper.showWindow({
    title: 'Story Weaver Enhanced - 故事大纲生成器',
    content: interfaceHTML,
    width: 800,
    height: 600,
    resizable: true
  });
  
  showNotification('Story Weaver Enhanced 已打开', 'success');
  console.log('[SW] Interface opened');
}

/**
 * Handle quick generation
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
 * Generate story outline
 */
async function generateStoryOutline(settings) {
  try {
    console.log('[SW] Starting story generation...');
    showNotification('开始生成故事大纲...', 'info');
    
    const template = settings.customPromptTemplate || getDefaultPromptTemplate();
    const prompt = processPromptTemplate(template, settings);
    
    console.log('[SW] Calling TavernHelper.generateRaw...');
    const response = await TavernHelper.generateRaw(prompt, {
      temperature: 0.8,
      max_tokens: 4000,
      top_p: 0.9
    });
    
    if (response && response.trim()) {
      console.log('[SW] Generation successful, result length:', response.length);
      TavernHelper.sendMessage(`## 📖 Story Outline Generated\n\n${response}`);
      showNotification('故事大纲生成完成！', 'success');
      return response;
    } else {
      throw new Error('生成结果为空');
    }
  } catch (error) {
    console.error('[SW] Story generation failed:', error);
    showNotification(`生成失败: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Get default prompt template
 */
function getDefaultPromptTemplate() {
  return `你是一位专业的故事编剧和大纲设计师。请基于以下信息生成一个详细的故事大纲：

**世界观设定：**
{worldbook_entries}

**角色信息：**
{character_data}

**对话历史：**
{chat_history}

**创作要求：**
- 故事类型：{story_type}
- 叙事风格：{story_style}  
- 故事主题：{story_theme}
- 章节数量：{chapter_count}
- 详细程度：{detail_level}
- 特殊要求：{special_requirements}

请生成一个结构完整、逻辑清晰的故事大纲。确保每章都有明确的目标、冲突和发展。`;
}

/**
 * Process prompt template
 */
function processPromptTemplate(template, settings) {
  const contextLength = parseInt(settings.contextLength || '10');
  
  try {
    const worldbookEntries = formatWorldbookEntries(TavernHelper.getWorldbookEntries());
    const characterData = formatCharacterData(TavernHelper.getCharacterData());
    const chatHistory = formatChatHistory(TavernHelper.getChatHistory(contextLength));
    
    return template
      .replace(/\{worldbook_entries\}/g, worldbookEntries)
      .replace(/\{character_data\}/g, characterData.combined)
      .replace(/\{chat_history\}/g, chatHistory)
      .replace(/\{story_type\}/g, STORY_TYPES[settings.storyType] || settings.storyType)
      .replace(/\{story_theme\}/g, settings.storyTheme || '')
      .replace(/\{story_style\}/g, STORY_STYLES[settings.storyStyle] || settings.storyStyle)
      .replace(/\{chapter_count\}/g, settings.chapterCount || '5')
      .replace(/\{detail_level\}/g, DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel)
      .replace(/\{special_requirements\}/g, settings.specialRequirements || '');
  } catch (error) {
    console.warn('[SW] Template processing failed:', error);
    return template;
  }
}

/**
 * Format worldbook entries
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
 * Format character data
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
 * Format chat history
 */
function formatChatHistory(history) {
  if (!history || history.length === 0) return '暂无对话历史';
  
  return history.map(msg => {
    const name = msg.name || msg.user || '未知';
    const content = msg.mes || msg.message || '';
    return `[${name}]: ${content}`;
  }).slice(-10).join('\n');
}

/**
 * Load settings
 */
function loadSettings() {
  const saved = TavernHelper.getGlobalVariable('storyWeaverSettings');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('[SW] Failed to load settings:', error);
      return getDefaultSettings();
    }
  }
  return getDefaultSettings();
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
    includeThemes: false
  };
}

/**
 * Build simple interface
 */
function buildSimpleInterface(settings) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Story Weaver Enhanced</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 32px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .title {
            text-align: center;
            font-size: 24px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 24px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .label {
            display: block;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 8px;
        }
        .input, .select, .textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
        }
        .input:focus, .select:focus, .textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin-top: 16px;
        }
        .btn:hover {
            transform: translateY(-2px);
            transition: transform 0.3s ease;
        }
        .output {
            margin-top: 24px;
            padding: 20px;
            background: #f7fafc;
            border-radius: 8px;
            min-height: 200px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">📖 Story Weaver Enhanced</h1>
        
        <div class="form-group">
            <label class="label">故事主题：</label>
            <textarea id="story-theme" class="textarea" rows="3" placeholder="描述您想要的故事主题...">${settings.storyTheme}</textarea>
        </div>
        
        <div class="form-group">
            <label class="label">故事类型：</label>
            <select id="story-type" class="select">
                ${Object.entries(STORY_TYPES).map(([key, label]) => 
                  `<option value="${key}" ${key === settings.storyType ? 'selected' : ''}>${label}</option>`
                ).join('')}
            </select>
        </div>
        
        <div class="form-group">
            <label class="label">章节数量：</label>
            <input type="number" id="chapter-count" class="input" value="${settings.chapterCount}" min="3" max="20">
        </div>
        
        <button id="generate-btn" class="btn">🎭 生成故事大纲</button>
        
        <div id="output" class="output">
            <h3>生成结果：</h3>
            <div id="result-content"></div>
        </div>
    </div>
    
    <script>
        document.getElementById('generate-btn').addEventListener('click', async function() {
            const theme = document.getElementById('story-theme').value;
            const type = document.getElementById('story-type').value;
            const chapters = document.getElementById('chapter-count').value;
            
            if (!theme.trim()) {
                alert('请填写故事主题');
                return;
            }
            
            this.textContent = '生成中...';
            this.disabled = true;
            
            try {
                const settings = {
                    storyTheme: theme,
                    storyType: type,
                    chapterCount: chapters,
                    contextLength: '10',
                    storyStyle: 'narrative',
                    detailLevel: 'medium',
                    specialRequirements: '',
                    includeSummary: true,
                    includeCharacters: true,
                    includeThemes: false
                };
                
                // Call parent function
                const response = await parent.generateStoryOutline(settings);
                
                document.getElementById('result-content').innerHTML = 
                    response.replace(/\\n/g, '<br>').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
                document.getElementById('output').style.display = 'block';
                
            } catch (error) {
                alert('生成失败: ' + error.message);
            } finally {
                this.textContent = '🎭 生成故事大纲';
                this.disabled = false;
            }
        });
    </script>
</body>
</html>`;
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  try {
    TavernHelper.showNotification(message, {
      type: type,
      duration: 3000
    });
  } catch (error) {
    console.log('[SW] Notification:', message);
  }
}

// ========================= DEBUG FUNCTIONS =========================

/**
 * Debug environment
 */
function debugEnvironment() {
  console.log('[SW] === Environment Debug Info ===');
  console.log('[SW] jQuery available:', typeof $ !== 'undefined');
  console.log('[SW] TavernHelper available:', typeof TavernHelper !== 'undefined');
  console.log('[SW] Spirit ball exists:', $('#story-weaver-spirit').length > 0);
  console.log('[SW] Spirit ball visible:', $('#story-weaver-spirit').is(':visible'));
  console.log('[SW] Window size:', window.innerWidth + 'x' + window.innerHeight);
  
  if ($('#story-weaver-spirit').length > 0) {
    const $ball = $('#story-weaver-spirit');
    console.log('[SW] Spirit ball position:', {
      top: $ball.css('top'),
      left: $ball.css('left'),
      right: $ball.css('right'),
      bottom: $ball.css('bottom')
    });
    console.log('[SW] Spirit ball classes:', $ball.attr('class'));
  }
  console.log('[SW] === End Debug Info ===');
}

/**
 * Force create spirit ball
 */
function forceCreateSpiritBall() {
  console.log('[SW] Force creating spirit ball...');
  createMainPageSpiritBall();
  
  setTimeout(() => {
    if ($('#story-weaver-spirit').length > 0) {
      console.log('[SW] ✅ Spirit ball created successfully');
    } else {
      console.error('[SW] ❌ Spirit ball creation failed');
    }
  }, 1000);
}

// ========================= INITIALIZATION =========================

// Initialize using jQuery ready - same pattern as 手机流式.html
$(document).ready(() => {
  console.log('[SW] Document ready, initializing Story Weaver...');
  if (typeof TavernHelper !== 'undefined') {
    init();
  } else {
    console.warn('[SW] TavernHelper not available, retrying...');
    setTimeout(() => {
      if (typeof TavernHelper !== 'undefined') {
        init();
      } else {
        console.error('[SW] TavernHelper still not available after retry');
      }
    }, 2000);
  }
});

// Export functions globally for console access
window.StoryWeaver = {
  init,
  createMainPageSpiritBall,
  forceCreateSpiritBall,
  toggleSpiritBall,
  debugEnvironment,
  openStoryWeaverInterface,
  generateStoryOutline
};

// Try to expose to main window if possible
try {
  if (window.top && window.top !== window) {
    window.top.StoryWeaver = window.StoryWeaver;
    console.log('[SW] Exposed to top window');
  }
} catch (e) {
  console.log('[SW] Could not expose to top window');
}

console.log('[SW] Story Weaver Enhanced loaded with main page injection!');
console.log('[SW] Available functions:', Object.keys(window.StoryWeaver));