/**
 * Story Weaver Enhanced - Complete TavernHelper Version
 * GitHub Pages Compatible - Full Feature Implementation
 * URL: https://dghiffjd7.github.io/StoryDirector/tavern-helper-version/story-weaver-full.js
 */

console.log('[SW] 📖 Loading Story Weaver Enhanced v2.0...');

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

// ========================= SPIRIT BALL =========================

function createSpiritBall() {
  console.log('[SW] Creating floating spirit ball...');
  
  // Remove existing elements
  $('.sw-spirit-ball').remove();
  $('#sw-spirit-styles').remove();
  
  // Inject styles
  const styles = `
    <style id="sw-spirit-styles">
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
      
      .sw-spirit-ball.visible {
        opacity: 1;
        transform: scale(1);
      }
      
      .sw-spirit-ball.dragging {
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
        font-size: 28px;
        animation: float 3s ease-in-out infinite;
      }
      
      .sw-spirit-ball:hover .sw-spirit-inner {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
        animation: none;
      }
      
      .sw-spirit-ball:active .sw-spirit-inner {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        animation: active-glow 0.6s ease-out;
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes active-glow {
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
        .sw-spirit-inner {
          font-size: 24px;
        }
      }
    </style>
  `;
  
  // Spirit ball HTML
  const spiritHtml = `
    <div id="sw-spirit-ball" class="sw-spirit-ball">
      <div class="sw-spirit-inner">📖</div>
    </div>
  `;
  
  // Inject into page using jQuery (same method as working examples)
  if (typeof $ !== 'undefined') {
    $('head').append(styles);
    $('body').append(spiritHtml);
    
    // Make interactive
    setTimeout(() => {
      makeSpiritBallInteractive();
      
      // Show with animation
      setTimeout(() => {
        $('#sw-spirit-ball').addClass('visible');
        console.log('[SW] ✅ Spirit ball is now visible!');
        showWelcomeNotification();
      }, 100);
    }, 50);
  } else {
    console.error('[SW] ❌ jQuery not available');
  }
}

function makeSpiritBallInteractive() {
  const $spiritBall = $('#sw-spirit-ball');
  if ($spiritBall.length === 0) return;

  let isDragging = false;
  let hasMoved = false;
  let startPos = { x: 0, y: 0 };

  // Click handler
  $spiritBall.on('click', function(e) {
    if (!hasMoved) {
      console.log('[SW] Spirit ball clicked!');
      openStoryWeaverInterface();
    }
  });

  // Dragging functionality
  $spiritBall.on('mousedown', function(e) {
    isDragging = true;
    hasMoved = false;
    startPos = { x: e.clientX, y: e.clientY };
    $(this).addClass('dragging');
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
      $spiritBall.removeClass('dragging');
      
      setTimeout(() => {
        hasMoved = false;
      }, 100);
    }
  });
}

function showWelcomeNotification() {
  const notificationHtml = `
    <div id="sw-welcome-notification" style="
      position: fixed;
      top: 20px;
      right: -400px;
      width: 350px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      transition: transform 0.5s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 5px;">
        📖 Story Weaver Enhanced
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        故事大纲生成器已就绪！点击精灵球开始使用
      </div>
    </div>
  `;

  if (typeof $ !== 'undefined') {
    $('body').append(notificationHtml);

    setTimeout(() => {
      $('#sw-welcome-notification').css('transform', 'translateX(-420px)');
    }, 500);

    setTimeout(() => {
      $('#sw-welcome-notification').css('transform', 'translateX(100%)');
      setTimeout(() => {
        $('#sw-welcome-notification').remove();
      }, 500);
    }, 4000);
  }
}

// ========================= INTERFACE =========================

function openStoryWeaverInterface() {
  console.log('[SW] Opening Story Weaver interface...');
  
  if (typeof TavernHelper !== 'undefined' && TavernHelper.showWindow) {
    const settings = loadSettings();
    const interfaceHTML = buildCompleteInterface(settings);
    
    TavernHelper.showWindow({
      title: 'Story Weaver Enhanced - 故事大纲生成器',
      content: interfaceHTML,
      width: 800,
      height: 700,
      resizable: true
    });
    
    showNotification('Story Weaver Enhanced 已打开', 'success');
  } else {
    console.error('[SW] TavernHelper not available');
    alert('Story Weaver需要在TavernHelper环境中运行');
  }
}

function buildCompleteInterface(settings) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      line-height: 1.6;
    }
    
    .container {
      max-width: 100%;
      padding: 20px;
      background: white;
      min-height: 100vh;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    
    .title {
      font-size: 28px;
      color: #667eea;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .subtitle {
      color: #666;
      font-size: 14px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #555;
      font-size: 14px;
    }
    
    .input, .textarea, .select {
      width: 100%;
      padding: 12px;
      border: 2px solid #e1e5e9;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s ease;
      font-family: inherit;
    }
    
    .input:focus, .textarea:focus, .select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .textarea {
      resize: vertical;
      min-height: 80px;
    }
    
    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-top: 10px;
    }
    
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .checkbox {
      width: 18px;
      height: 18px;
    }
    
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      text-align: center;
    }
    
    .btn:hover {
      background: #5a6fd8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    .btn:active {
      transform: translateY(0);
    }
    
    .btn-secondary {
      background: #6c757d;
    }
    
    .btn-secondary:hover {
      background: #5a6268;
    }
    
    .btn-success {
      background: #28a745;
    }
    
    .btn-success:hover {
      background: #218838;
    }
    
    .btn-group {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    
    .btn-group .btn {
      flex: 1;
    }
    
    .output-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
    }
    
    .output-content {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      min-height: 150px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    
    .stats {
      display: flex;
      gap: 20px;
      margin-top: 15px;
      font-size: 12px;
      color: #666;
    }
    
    .row {
      display: flex;
      gap: 20px;
    }
    
    .col {
      flex: 1;
    }
    
    @media (max-width: 600px) {
      .row {
        flex-direction: column;
        gap: 0;
      }
      
      .btn-group {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">📖 Story Weaver Enhanced</h1>
      <p class="subtitle">AI驱动的故事大纲生成器 - 让创意无限延展</p>
    </div>
    
    <div class="row">
      <div class="col">
        <div class="form-group">
          <label class="label">故事主题 / 核心冲突：</label>
          <textarea id="story-theme" class="textarea" rows="3" placeholder="描述您想要的故事主题、核心冲突或者想要探讨的问题...">${settings.storyTheme || ''}</textarea>
        </div>
      </div>
      <div class="col">
        <div class="form-group">
          <label class="label">特殊要求：</label>
          <textarea id="special-requirements" class="textarea" rows="3" placeholder="任何特殊的剧情要求、角色设定或者风格偏好...">${settings.specialRequirements || ''}</textarea>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col">
        <div class="form-group">
          <label class="label">故事类型：</label>
          <select id="story-type" class="select">
            ${Object.entries(STORY_TYPES).map(([key, label]) => 
              `<option value="${key}" ${key === settings.storyType ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="col">
        <div class="form-group">
          <label class="label">叙述风格：</label>
          <select id="story-style" class="select">
            ${Object.entries(STORY_STYLES).map(([key, label]) => 
              `<option value="${key}" ${key === settings.storyStyle ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col">
        <div class="form-group">
          <label class="label">章节数量：</label>
          <input type="number" id="chapter-count" class="input" value="${settings.chapterCount || 5}" min="3" max="20">
        </div>
      </div>
      <div class="col">
        <div class="form-group">
          <label class="label">详细程度：</label>
          <select id="detail-level" class="select">
            ${Object.entries(DETAIL_LEVELS).map(([key, label]) => 
              `<option value="${key}" ${key === settings.detailLevel ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label class="label">上下文长度 (对话历史)：</label>
      <input type="number" id="context-length" class="input" value="${settings.contextLength || 10}" min="0" max="50">
    </div>
    
    <div class="form-group">
      <label class="label">包含选项：</label>
      <div class="checkbox-group">
        <div class="checkbox-item">
          <input type="checkbox" id="include-summary" class="checkbox" ${settings.includeSummary ? 'checked' : ''}>
          <label for="include-summary">故事摘要</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="include-characters" class="checkbox" ${settings.includeCharacters ? 'checked' : ''}>
          <label for="include-characters">角色分析</label>
        </div>
        <div class="checkbox-item">
          <input type="checkbox" id="include-themes" class="checkbox" ${settings.includeThemes ? 'checked' : ''}>
          <label for="include-themes">主题探讨</label>
        </div>
      </div>
    </div>
    
    <div class="btn-group">
      <button id="generate-outline" class="btn" onclick="handleGenerate()">
        <span id="btn-text">🎯 生成故事大纲</span>
        <span id="btn-loading" style="display: none;">⏳ 生成中...</span>
      </button>
      <button class="btn btn-secondary" onclick="saveSettings()">💾 保存设置</button>
      <button class="btn btn-success" onclick="refreshData()">🔄 刷新数据</button>
    </div>
    
    <div class="output-section">
      <label class="label">生成结果：</label>
      <div id="output-content" class="output-content">
        <div id="output-placeholder" style="color: #999; font-style: italic;">
          点击"生成故事大纲"开始创作您的故事...
        </div>
      </div>
      
      <div class="stats">
        <span id="word-count">字数: 0</span>
        <span id="generation-time">用时: 0秒</span>
        <span id="actual-chapters">章节: 0</span>
      </div>
      
      <div class="btn-group">
        <button class="btn btn-secondary" onclick="copyResult()">📋 复制结果</button>
        <button class="btn btn-secondary" onclick="saveResult()">💾 保存文件</button>
        <button class="btn btn-success" onclick="sendToChat()">💬 发送到聊天</button>
      </div>
    </div>
  </div>
  
  <script>
    let currentResult = '';
    
    async function handleGenerate() {
      const startTime = Date.now();
      const btnText = document.getElementById('btn-text');
      const btnLoading = document.getElementById('btn-loading');
      const outputContent = document.getElementById('output-content');
      const outputPlaceholder = document.getElementById('output-placeholder');
      
      // Show loading state
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      
      // Hide placeholder
      if (outputPlaceholder) {
        outputPlaceholder.style.display = 'none';
      }
      
      try {
        // Collect settings
        const settings = {
          storyTheme: document.getElementById('story-theme').value,
          storyType: document.getElementById('story-type').value,
          storyStyle: document.getElementById('story-style').value,
          chapterCount: document.getElementById('chapter-count').value,
          detailLevel: document.getElementById('detail-level').value,
          contextLength: document.getElementById('context-length').value,
          specialRequirements: document.getElementById('special-requirements').value,
          includeSummary: document.getElementById('include-summary').checked,
          includeCharacters: document.getElementById('include-characters').checked,
          includeThemes: document.getElementById('include-themes').checked
        };
        
        // Save settings
        localStorage.setItem('storyWeaverSettings', JSON.stringify(settings));
        
        // Build prompt
        const prompt = buildPrompt(settings);
        console.log('[SW] Generating with prompt:', prompt);
        
        // Generate using TavernHelper
        if (typeof window.TavernHelper !== 'undefined' && window.TavernHelper.generateRaw) {
          const result = await window.TavernHelper.generateRaw(prompt, {
            temperature: 0.8,
            max_tokens: 4000,
            top_p: 0.9
          });
          
          if (result && result.trim()) {
            currentResult = result;
            outputContent.textContent = result;
            updateStats(result, Date.now() - startTime);
            console.log('[SW] ✅ Generation successful');
          } else {
            throw new Error('生成结果为空');
          }
        } else {
          throw new Error('TavernHelper.generateRaw 不可用');
        }
        
      } catch (error) {
        console.error('[SW] Generation failed:', error);
        outputContent.textContent = \`生成失败: \${error.message\}\`;
      } finally {
        // Restore button state
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    }
    
    function buildPrompt(settings) {
      let prompt = \`请为我生成一个\${STORY_TYPES[settings.storyType\] || settings.storyType\}类型的故事大纲。\`;
      
      if (settings.storyTheme) {
        prompt += \`\\n\\n故事主题: \${settings.storyTheme\}\`;
      }
      
      prompt += \`\\n\\n要求:
1. 包含\${settings.chapterCount\}个章节
2. 每章有明确的情节发展和冲突
3. 结构完整，逻辑清晰
4. 符合\${STORY_STYLES[settings.storyStyle\] || settings.storyStyle\}的叙述风格
5. 详细程度: \${DETAIL_LEVELS[settings.detailLevel\] || settings.detailLevel\}\`;

      if (settings.specialRequirements) {
        prompt += \`\\n6. 特殊要求: \${settings.specialRequirements\}\`;
      }
      
      if (settings.includeSummary) {
        prompt += \`\\n\\n请在大纲前提供故事摘要。\`;
      }
      
      if (settings.includeCharacters) {
        prompt += \`\\n\\n请包含主要角色的性格特点和发展弧线。\`;
      }
      
      if (settings.includeThemes) {
        prompt += \`\\n\\n请说明故事要探讨的核心主题。\`;
      }
      
      // Add context if available
      try {
        if (typeof window.TavernHelper !== 'undefined') {
          const contextLength = parseInt(settings.contextLength) || 0;
          if (contextLength > 0) {
            const chatHistory = window.TavernHelper.getChatHistory(contextLength);
            const characterData = window.TavernHelper.getCharacterData();
            const worldbookEntries = window.TavernHelper.getWorldbookEntries();
            
            if (characterData && characterData.name) {
              prompt += \`\\n\\n当前角色: \${characterData.name\}\`;
              if (characterData.personality) {
                prompt += \`\\n角色性格: \${characterData.personality\}\`;
              }
            }
            
            if (worldbookEntries && worldbookEntries.length > 0) {
              prompt += \`\\n\\n世界设定:\`;
              worldbookEntries.slice(0, 5).forEach(entry => {
                const key = entry.key || (entry.keys && entry.keys[0]) || '';
                const content = entry.content || entry.description || '';
                if (key && content) {
                  prompt += \`\\n- \${key\}: \${content.substring(0, 100\)\}...\`;
                }
              });
            }
            
            if (chatHistory && chatHistory.length > 0) {
              prompt += \`\\n\\n最近对话:\`;
              chatHistory.slice(-3).forEach(msg => {
                const name = msg.name || msg.user || '';
                const content = (msg.mes || msg.message || '').substring(0, 100);
                if (name && content) {
                  prompt += \`\\n[\${name\}]: \${content\}...\`;
                }
              });
            }
          }
        }
      } catch (e) {
        console.log('[SW] Context integration failed:', e);
      }
      
      prompt += \`\\n\\n请生成结构完整、逻辑清晰的故事大纲。\`;
      
      return prompt;
    }
    
    function updateStats(result, generationTime) {
      const wordCount = result.length;
      const chapterMatches = result.match(/第[一二三四五六七八九十\\d]+章|Chapter \\d+|章节 \\d+/gi) || [];
      const actualChapters = chapterMatches.length;
      
      document.getElementById('word-count').textContent = \`字数: \${wordCount\}\`;
      document.getElementById('generation-time').textContent = \`用时: \${Math.round(generationTime / 1000\)\}秒\`;
      document.getElementById('actual-chapters').textContent = \`章节: \${actualChapters\}\`;
    }
    
    function copyResult() {
      if (currentResult) {
        navigator.clipboard.writeText(currentResult).then(() => {
          alert('结果已复制到剪贴板！');
        }).catch(err => {
          console.error('复制失败:', err);
          alert('复制失败，请手动选择文本复制');
        });
      } else {
        alert('没有可复制的内容');
      }
    }
    
    function saveResult() {
      if (currentResult) {
        const blob = new Blob([currentResult], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`story-outline-\${new Date().getTime()\}.txt\`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('文件已保存！');
      } else {
        alert('没有可保存的内容');
      }
    }
    
    function sendToChat() {
      if (currentResult && typeof window.TavernHelper !== 'undefined') {
        const message = \`## 📖 Story Outline Generated\\n\\n\${currentResult\}\`;
        window.TavernHelper.sendMessage(message);
        alert('结果已发送到聊天！');
      } else {
        alert('无法发送到聊天');
      }
    }
    
    function saveSettings() {
      const settings = {
        storyTheme: document.getElementById('story-theme').value,
        storyType: document.getElementById('story-type').value,
        storyStyle: document.getElementById('story-style').value,
        chapterCount: document.getElementById('chapter-count').value,
        detailLevel: document.getElementById('detail-level').value,
        contextLength: document.getElementById('context-length').value,
        specialRequirements: document.getElementById('special-requirements').value,
        includeSummary: document.getElementById('include-summary').checked,
        includeCharacters: document.getElementById('include-characters').checked,
        includeThemes: document.getElementById('include-themes').checked
      };
      
      localStorage.setItem('storyWeaverSettings', JSON.stringify(settings));
      alert('设置已保存！');
    }
    
    function refreshData() {
      console.log('[SW] Refreshing data...');
      alert('数据已刷新！');
    }
  </script>
</body>
</html>
  `;
}

// ========================= SETTINGS =========================

function loadSettings() {
  try {
    const saved = localStorage.getItem('storyWeaverSettings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('[SW] Failed to load settings:', error);
  }
  
  return {
    storyType: 'adventure',
    storyStyle: 'narrative',
    storyTheme: '',
    chapterCount: 5,
    detailLevel: 'medium',
    contextLength: 10,
    specialRequirements: '',
    includeSummary: true,
    includeCharacters: true,
    includeThemes: false
  };
}

function saveSettings(settings) {
  try {
    localStorage.setItem('storyWeaverSettings', JSON.stringify(settings));
    console.log('[SW] Settings saved');
  } catch (error) {
    console.error('[SW] Failed to save settings:', error);
  }
}

// ========================= UTILITIES =========================

function showNotification(message, type = 'info') {
  try {
    if (typeof TavernHelper !== 'undefined' && TavernHelper.showNotification) {
      TavernHelper.showNotification(message, {
        type: type,
        duration: 3000
      });
    } else {
      console.log(`[SW] Notification (${type}):`, message);
    }
  } catch (error) {
    console.log(`[SW] Notification (${type}):`, message);
  }
}

// ========================= SLASH COMMANDS =========================

function registerSlashCommands() {
  if (typeof SlashCommandsAPI === 'undefined') {
    console.log('[SW] SlashCommandsAPI not available');
    return;
  }
  
  try {
    SlashCommandsAPI.registerSlashCommand({
      name: 'sw',
      description: 'Open Story Weaver interface - 打开故事大纲生成器',
      callback: openStoryWeaverInterface,
      helpString: 'Opens the Story Weaver Enhanced interface'
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

    console.log('[SW] ✅ Slash commands registered');
  } catch (error) {
    console.error('[SW] Failed to register slash commands:', error);
  }
}

async function handleQuickGeneration(args) {
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

  try {
    const prompt = buildQuickPrompt(quickSettings);
    const result = await TavernHelper.generateRaw(prompt);
    TavernHelper.sendMessage(`## 📖 Quick Story Outline\n\n${result}`);
    console.log('[SW] ✅ Quick generation completed');
  } catch (error) {
    console.error('[SW] Quick generation failed:', error);
    showNotification('快速生成失败', 'error');
  }
}

function buildQuickPrompt(settings) {
  return `请生成一个${STORY_TYPES[settings.storyType]}类型的故事大纲，包含${settings.chapterCount}个章节。

要求：
1. 结构完整，逻辑清晰
2. 每章有明确的情节发展
3. 符合${STORY_TYPES[settings.storyType]}的特点
4. 详细程度：${DETAIL_LEVELS[settings.detailLevel]}

请生成故事大纲。`;
}

// ========================= DEBUG FUNCTIONS =========================

function debugEnvironment() {
  console.log('[SW] === Environment Debug Info ===');
  console.log('[SW] jQuery available:', typeof $ !== 'undefined');
  console.log('[SW] TavernHelper available:', typeof TavernHelper !== 'undefined');
  console.log('[SW] SlashCommandsAPI available:', typeof SlashCommandsAPI !== 'undefined');
  console.log('[SW] Spirit ball exists:', $('#sw-spirit-ball').length > 0);
  console.log('[SW] Spirit ball visible:', $('#sw-spirit-ball').is(':visible'));
  console.log('[SW] Settings:', loadSettings());
  console.log('[SW] === End Debug Info ===');
}

function forceCreateSpiritBall() {
  console.log('[SW] Force creating spirit ball...');
  createSpiritBall();
  
  setTimeout(() => {
    if ($('#sw-spirit-ball').length > 0) {
      console.log('[SW] ✅ Spirit ball created successfully');
    } else {
      console.error('[SW] ❌ Spirit ball creation failed');
    }
  }, 1000);
}

// ========================= INITIALIZATION =========================

function init() {
  console.log('[SW] Initializing Story Weaver Enhanced...');
  
  // Register slash commands if available
  if (typeof SlashCommandsAPI !== 'undefined') {
    registerSlashCommands();
  } else {
    console.log('[SW] Running on main page - slash commands not available');
  }
  
  // Create spirit ball
  createSpiritBall();
  
  console.log('[SW] ✅ Story Weaver Enhanced v2.0 initialized!');
}

// ========================= GLOBAL EXPORT =========================

// Export functions globally for console access
window.StoryWeaver = {
  version: '2.0',
  init,
  createSpiritBall,
  forceCreateSpiritBall,
  openStoryWeaverInterface,
  debugEnvironment,
  loadSettings,
  saveSettings,
  showNotification
};

// Try to expose to top window if possible
try {
  if (window.top && window.top !== window) {
    window.top.StoryWeaver = window.StoryWeaver;
    console.log('[SW] Exposed to top window');
  }
} catch (e) {
  console.log('[SW] Could not expose to top window');
}

// Auto-initialize when document ready
$(document).ready(() => {
  console.log('[SW] Document ready, initializing...');
  init();
});

console.log('[SW] ✅ Story Weaver Enhanced loaded successfully!');
console.log('[SW] Available functions:', Object.keys(window.StoryWeaver));