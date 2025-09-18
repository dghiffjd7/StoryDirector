/**
 * Story Weaver Enhanced - Complete TavernHelper Version
 * GitHub Pages Compatible - Full Feature Implementation
 * URL: https://dghiffjd7.github.io/StoryDirector/tavern-helper-version/story-weaver-full.js
 */

console.log('[SW] 📖 Loading Story Weaver Enhanced v2.0...');

// ========================= CONSTANTS =========================

// Prompt Management
let storyWeaverPrompts = new Map();
let storyWeaverPromptOrder = [];

const DEFAULT_PROMPTS = [
  {
    identifier: 'sw_system_core',
    name: '核心系统提示',
    role: 'system',
    content: '你是一个专业的故事创作助手。请根据用户的要求创作精彩的故事大纲。',
    enabled: true,
    system_prompt: true,
    injection_order: 1,
    injection_depth: 0,
    injection_position: 0
  },
  {
    identifier: 'sw_user_context',
    name: '用户上下文',
    role: 'user',
    content: '请基于以下信息创作故事大纲：\n{{STORY_CONTEXT}}',
    enabled: true,
    system_prompt: false,
    injection_order: 2,
    injection_depth: 1,
    injection_position: 0
  },
  {
    identifier: 'sw_format_guide',
    name: '格式指导',
    role: 'system',
    content: '请按照以下格式输出故事大纲：\n1. 故事摘要\n2. 主要角色\n3. 章节大纲\n4. 主题探讨',
    enabled: true,
    system_prompt: false,
    injection_order: 3,
    injection_depth: 0,
    injection_position: 0
  }
];

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
  action: '动作战斗',
};

const STORY_STYLES = {
  narrative: '叙述性',
  dialogue: '对话性',
  descriptive: '描述性',
  stream_of_consciousness: '意识流',
  epistolary: '书信体',
};

const DETAIL_LEVELS = {
  brief: '简洁大纲',
  medium: '中等详细',
  detailed: '详细描述',
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
  $spiritBall.on('click', function (e) {
    if (!hasMoved) {
      console.log('[SW] Spirit ball clicked!');
      openStoryWeaverInterface();
    }
  });

  // Dragging functionality
  $spiritBall.on('mousedown', function (e) {
    isDragging = true;
    hasMoved = false;
    startPos = { x: e.clientX, y: e.clientY };
    $(this).addClass('dragging');
    e.preventDefault();
  });

  $(document).on('mousemove', function (e) {
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
        bottom: 'auto',
      });
    }
  });

  $(document).on('mouseup', function () {
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

  // Try TavernHelper first (if in TavernHelper iframe)
  if (typeof TavernHelper !== 'undefined' && TavernHelper.showWindow) {
    const settings = loadSettings();
    const interfaceHTML = buildCompleteInterface(settings);

    TavernHelper.showWindow({
      title: 'Story Weaver Enhanced - 故事大纲生成器',
      content: interfaceHTML,
      width: 800,
      height: 700,
      resizable: true,
    });

    showNotification('Story Weaver Enhanced 已打开', 'success');
  } else {
    // Fallback: Create native popup on main ST page
    console.log('[SW] Using native popup for main ST page');
    createNativePopup();
  }
}

function createNativePopup() {
  // Remove existing popup
  $('#sw-popup-overlay').remove();

  const settings = loadSettings();

  // Create overlay and popup
  const popupHTML = `
    <div id="sw-popup-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
    ">
      <div id="sw-popup-window" style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        width: 800px;
        height: 700px;
        overflow: hidden;
        position: relative;
        animation: popupFadeIn 0.3s ease-out;
      ">
        <div style="
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        ">
          <span>📖 Story Weaver Enhanced - 故事大纲生成器</span>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button id="sw-settings-btn" style="
              background: rgba(255, 255, 255, 0.2);
              border: none;
              color: white;
              padding: 5px 10px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              position: relative;
            " title="设置">⚙</button>
            <button id="sw-close-btn" style="
              background: rgba(255, 255, 255, 0.2);
              border: none;
              color: white;
              padding: 5px 10px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            ">✕</button>
          </div>
        </div>
        <div id="sw-popup-content" style="
          height: calc(100% - 60px);
          overflow: auto;
          padding: 20px;
        ">
          ${buildSimpleInterface(settings)}
        </div>
      </div>
    </div>
    
    <style>
      @keyframes popupFadeIn {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
    </style>
  `;

  // Inject popup
  $('body').append(popupHTML);

  // Close button handler
  $('#sw-close-btn').click(() => {
    $('#sw-popup-overlay').fadeOut(300, function () {
      $(this).remove();
    });
  });

  // Settings button handler
  setupSettingsMenu();

  // Click outside to close
  $('#sw-popup-overlay').click(e => {
    if (e.target.id === 'sw-popup-overlay') {
      $('#sw-popup-overlay').fadeOut(300, function () {
        $(this).remove();
      });
    }
  });

  console.log('[SW] ✅ Native popup opened');
}

function buildSimpleInterface(settings) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h2 style="color: #667eea; margin-bottom: 20px; text-align: center;">📖 Story Weaver Enhanced</h2>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">故事主题：</label>
        <textarea id="sw-theme" placeholder="描述您想要的故事主题..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;">${
          settings.storyTheme || ''
        }</textarea>
      </div>
      
      <div style="display: flex; gap: 15px; margin-bottom: 15px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">故事类型：</label>
          <select id="sw-type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            ${Object.entries(STORY_TYPES)
              .map(([k, v]) => `<option value="${k}" ${k === settings.storyType ? 'selected' : ''}>${v}</option>`)
              .join('')}
          </select>
        </div>
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">叙述风格：</label>
          <select id="sw-style" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            ${Object.entries(STORY_STYLES)
              .map(([k, v]) => `<option value="${k}" ${k === settings.storyStyle ? 'selected' : ''}>${v}</option>`)
              .join('')}
          </select>
        </div>
      </div>
      
      <div style="display: flex; gap: 15px; margin-bottom: 15px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">章节数量：</label>
          <input type="number" id="sw-chapters" value="${
            settings.chapterCount || 5
          }" min="3" max="20" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">详细程度：</label>
          <select id="sw-detail" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            ${Object.entries(DETAIL_LEVELS)
              .map(([k, v]) => `<option value="${k}" ${k === settings.detailLevel ? 'selected' : ''}>${v}</option>`)
              .join('')}
          </select>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">特殊要求：</label>
        <textarea id="sw-requirements" placeholder="任何特殊的剧情要求或风格偏好..." style="width: 100%; height: 60px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;">${
          settings.specialRequirements || ''
        }</textarea>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">包含选项：</label>
        <div style="display: flex; gap: 20px;">
          <label style="display: flex; align-items: center; gap: 5px;">
            <input type="checkbox" id="sw-summary" ${settings.includeSummary ? 'checked' : ''}>
            故事摘要
          </label>
          <label style="display: flex; align-items: center; gap: 5px;">
            <input type="checkbox" id="sw-characters" ${settings.includeCharacters ? 'checked' : ''}>
            角色分析
          </label>
          <label style="display: flex; align-items: center; gap: 5px;">
            <input type="checkbox" id="sw-themes" ${settings.includeThemes ? 'checked' : ''}>
            主题探讨
          </label>
        </div>
      </div>
      
      <button id="sw-generate-btn" onclick="handleNativeGenerate()" style="
        width: 100%;
        padding: 12px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 15px;
      ">🎯 生成故事大纲</button>
      
      <div id="sw-output-section" style="
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 5px;
        padding: 15px;
        min-height: 150px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        white-space: pre-wrap;
        display: none;
      ">
        <div id="sw-output-content"></div>
      </div>
      
      <div id="sw-output-controls" style="display: none; margin-top: 10px; text-align: center;">
        <button onclick="copyNativeResult()" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">📋 复制</button>
        <button onclick="saveNativeResult()" style="padding: 8px 15px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">💾 保存</button>
      </div>
    </div>
    
    <script>
      let nativeResult = '';
      
      async function handleNativeGenerate() {
        const btn = document.getElementById('sw-generate-btn');
        const outputSection = document.getElementById('sw-output-section');
        const outputContent = document.getElementById('sw-output-content');
        const outputControls = document.getElementById('sw-output-controls');
        
        btn.textContent = '⏳ 生成中...';
        btn.disabled = true;
        
        try {
          const settings = {
            storyTheme: document.getElementById('sw-theme').value,
            storyType: document.getElementById('sw-type').value,
            storyStyle: document.getElementById('sw-style').value,
            chapterCount: document.getElementById('sw-chapters').value,
            detailLevel: document.getElementById('sw-detail').value,
            specialRequirements: document.getElementById('sw-requirements').value,
            includeSummary: document.getElementById('sw-summary').checked,
            includeCharacters: document.getElementById('sw-characters').checked,
            includeThemes: document.getElementById('sw-themes').checked
          };
          
          const prompt = buildNativePrompt(settings);
          console.log('[SW] Generating story with prompt:', prompt);
          
          // Try to use ST's native generation
          let result;
          if (typeof generate !== 'undefined') {
            // Use SillyTavern's generate function
            result = await generate(prompt);
          } else if (typeof getGenerateUrl !== 'undefined' && typeof generateRaw !== 'undefined') {
            // Alternative ST generation method
            result = await generateRaw(prompt);
          } else {
            throw new Error('SillyTavern生成功能不可用，请在角色聊天页面使用');
          }
          
          if (result && result.trim()) {
            nativeResult = result;
            outputContent.textContent = result;
            outputSection.style.display = 'block';
            outputControls.style.display = 'block';
            console.log('[SW] ✅ Generation successful');
          } else {
            throw new Error('生成结果为空');
          }
          
        } catch (error) {
          console.error('[SW] Generation failed:', error);
          outputContent.textContent = \`生成失败: \${error.message\}\n\n提示：请确保您在SillyTavern的角色聊天页面，并且已连接到AI服务。\`;
          outputSection.style.display = 'block';
        } finally {
          btn.textContent = '🎯 生成故事大纲';
          btn.disabled = false;
        }
      }
      
      function buildNativePrompt(settings) {
        // Use the same prompt building logic as TavernHelper version
        return buildPromptForNative(settings);
      }

      function buildPromptForNative(settings) {
        // Build context data first
        const contextData = buildStoryContextForNative(settings);

        // Build final prompt from enabled prompts using prompt manager
        let finalPrompt = '';

        // Get enabled prompts in order
        const enabledPrompts = storyWeaverPromptOrder
          .map(identifier => storyWeaverPrompts.get(identifier))
          .filter(prompt => prompt && prompt.enabled !== false)
          .sort((a, b) => a.injection_order - b.injection_order);

        // Process each prompt
        enabledPrompts.forEach(prompt => {
          let processedContent = prompt.content;

          // Replace placeholders
          processedContent = processedContent.replace(/\{\{STORY_CONTEXT\}\}/g, contextData);

          // Add role prefix for non-system prompts
          if (prompt.role === 'user') {
            finalPrompt += processedContent + '\\n\\n';
          } else if (prompt.role === 'system') {
            finalPrompt = processedContent + '\\n\\n' + finalPrompt;
          } else if (prompt.role === 'assistant') {
            finalPrompt += '[Assistant]: ' + processedContent + '\\n\\n';
          }
        });

        // Fallback: if no prompts are enabled, use basic prompt
        if (!finalPrompt.trim()) {
          finalPrompt = buildBasicNativePrompt(settings);
        }

        return finalPrompt.trim();
      }

      function buildStoryContextForNative(settings) {
        let context = \`请为我生成一个\${STORY_TYPES[settings.storyType] || settings.storyType\}类型的故事大纲。\`;

        if (settings.storyTheme) {
          context += \`\\n\\n故事主题: \${settings.storyTheme\}\`;
        }

        context += \`\\n\\n要求:
1. 包含\${settings.chapterCount\}个章节
2. 每章有明确的情节发展和冲突
3. 结构完整，逻辑清晰
4. 符合\${STORY_STYLES[settings.storyStyle] || settings.storyStyle\}的叙述风格
5. 详细程度: \${DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel\}\`;

        if (settings.specialRequirements) {
          context += \`\\n6. 特殊要求: \${settings.specialRequirements\}\`;
        }

        if (settings.includeSummary) {
          context += \`\\n\\n请在大纲前提供故事摘要。\`;
        }

        if (settings.includeCharacters) {
          context += \`\\n\\n请包含主要角色的性格特点和发展弧线。\`;
        }

        if (settings.includeThemes) {
          context += \`\\n\\n请说明故事要探讨的核心主题。\`;
        }

        return context;
      }

      function buildBasicNativePrompt(settings) {
        const context = buildStoryContextForNative(settings);
        return context + '\\n\\n请生成结构完整、逻辑清晰的故事大纲。';
      }
      
      function copyNativeResult() {
        if (nativeResult) {
          navigator.clipboard.writeText(nativeResult).then(() => {
            alert('结果已复制到剪贴板！');
          }).catch(() => {
            alert('复制失败，请手动选择文本复制');
          });
        }
      }
      
      function saveNativeResult() {
        if (nativeResult) {
          const blob = new Blob([nativeResult], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = \`story-outline-\${new Date().getTime()\}.txt\`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('文件已保存！');
        }
      }
    </script>
  `;
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h1 class="title">📖 Story Weaver Enhanced</h1>
          <p class="subtitle">AI驱动的故事大纲生成器 - 让创意无限延展</p>
        </div>
        <button id="sw-settings-btn-th" style="
          background: rgba(102, 126, 234, 0.1);
          border: 2px solid #667eea;
          color: #667eea;
          padding: 10px 15px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          position: relative;
        " title="设置">⚙</button>
      </div>
    </div>
    
    <div class="row">
      <div class="col">
        <div class="form-group">
          <label class="label">故事主题 / 核心冲突：</label>
          <textarea id="story-theme" class="textarea" rows="3" placeholder="描述您想要的故事主题、核心冲突或者想要探讨的问题...">${
            settings.storyTheme || ''
          }</textarea>
        </div>
      </div>
      <div class="col">
        <div class="form-group">
          <label class="label">特殊要求：</label>
          <textarea id="special-requirements" class="textarea" rows="3" placeholder="任何特殊的剧情要求、角色设定或者风格偏好...">${
            settings.specialRequirements || ''
          }</textarea>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col">
        <div class="form-group">
          <label class="label">故事类型：</label>
          <select id="story-type" class="select">
            ${Object.entries(STORY_TYPES)
              .map(
                ([key, label]) =>
                  `<option value="${key}" ${key === settings.storyType ? 'selected' : ''}>${label}</option>`,
              )
              .join('')}
          </select>
        </div>
      </div>
      <div class="col">
        <div class="form-group">
          <label class="label">叙述风格：</label>
          <select id="story-style" class="select">
            ${Object.entries(STORY_STYLES)
              .map(
                ([key, label]) =>
                  `<option value="${key}" ${key === settings.storyStyle ? 'selected' : ''}>${label}</option>`,
              )
              .join('')}
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
            ${Object.entries(DETAIL_LEVELS)
              .map(
                ([key, label]) =>
                  `<option value="${key}" ${key === settings.detailLevel ? 'selected' : ''}>${label}</option>`,
              )
              .join('')}
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
          <input type="checkbox" id="include-characters" class="checkbox" ${
            settings.includeCharacters ? 'checked' : ''
          }>
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
      // Build context data first
      const contextData = buildStoryContext(settings);

      // Build final prompt from enabled prompts using prompt manager
      let finalPrompt = '';

      // Get enabled prompts in order
      const enabledPrompts = storyWeaverPromptOrder
        .map(identifier => storyWeaverPrompts.get(identifier))
        .filter(prompt => prompt && prompt.enabled !== false)
        .sort((a, b) => a.injection_order - b.injection_order);

      // Process each prompt
      enabledPrompts.forEach(prompt => {
        let processedContent = prompt.content;

        // Replace placeholders
        processedContent = processedContent.replace(/\{\{STORY_CONTEXT\}\}/g, contextData);

        // Add role prefix for non-system prompts
        if (prompt.role === 'user') {
          finalPrompt += processedContent + '\\n\\n';
        } else if (prompt.role === 'system') {
          finalPrompt = processedContent + '\\n\\n' + finalPrompt;
        } else if (prompt.role === 'assistant') {
          finalPrompt += '[Assistant]: ' + processedContent + '\\n\\n';
        }
      });

      // Fallback: if no prompts are enabled, use basic prompt
      if (!finalPrompt.trim()) {
        finalPrompt = buildBasicPrompt(settings);
      }

      return finalPrompt.trim();
    }

    function buildStoryContext(settings) {
      let context = \`请为我生成一个\${STORY_TYPES[settings.storyType] || settings.storyType\}类型的故事大纲。\`;

      if (settings.storyTheme) {
        context += \`\\n\\n故事主题: \${settings.storyTheme\}\`;
      }

      context += \`\\n\\n要求:
1. 包含\${settings.chapterCount\}个章节
2. 每章有明确的情节发展和冲突
3. 结构完整，逻辑清晰
4. 符合\${STORY_STYLES[settings.storyStyle] || settings.storyStyle\}的叙述风格
5. 详细程度: \${DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel\}\`;

      if (settings.specialRequirements) {
        context += \`\\n6. 特殊要求: \${settings.specialRequirements\}\`;
      }

      if (settings.includeSummary) {
        context += \`\\n\\n请在大纲前提供故事摘要。\`;
      }

      if (settings.includeCharacters) {
        context += \`\\n\\n请包含主要角色的性格特点和发展弧线。\`;
      }

      if (settings.includeThemes) {
        context += \`\\n\\n请说明故事要探讨的核心主题。\`;
      }

      // Add TavernHelper context if available
      try {
        if (typeof window.TavernHelper !== 'undefined') {
          const contextLength = parseInt(settings.contextLength) || 0;
          if (contextLength > 0) {
            const chatHistory = window.TavernHelper.getChatHistory(contextLength);
            const characterData = window.TavernHelper.getCharacterData();
            const worldbookEntries = window.TavernHelper.getWorldbookEntries();

            if (characterData && characterData.name) {
              context += \`\\n\\n当前角色: \${characterData.name\}\`;
              if (characterData.personality) {
                context += \`\\n角色性格: \${characterData.personality\}\`;
              }
            }

            if (worldbookEntries && worldbookEntries.length > 0) {
              context += \`\\n\\n世界设定:\`;
              worldbookEntries.slice(0, 5).forEach(entry => {
                const key = entry.key || (entry.keys && entry.keys[0]) || '';
                const content = entry.content || entry.description || '';
                if (key && content) {
                  context += \`\\n- \${key\}: \${content.substring(0, 100)\}...\`;
                }
              });
            }

            if (chatHistory && chatHistory.length > 0) {
              context += \`\\n\\n最近对话:\`;
              chatHistory.slice(-3).forEach(msg => {
                const name = msg.name || msg.user || '';
                const content = (msg.mes || msg.message || '').substring(0, 100);
                if (name && content) {
                  context += \`\\n[\${name\}]: \${content\}...\`;
                }
              });
            }
          }
        }
      } catch (e) {
        console.log('[SW] Context integration failed:', e);
      }

      return context;
    }

    function buildBasicPrompt(settings) {
      const context = buildStoryContext(settings);
      return context + '\\n\\n请生成结构完整、逻辑清晰的故事大纲。';
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

    // Setup settings menu for TavernHelper interface
    setupSettingsMenuTH();
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
    includeThemes: false,
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

// ========================= PROMPT MANAGEMENT =========================

function initializePrompts() {
  // Load default prompts if none exist
  if (storyWeaverPrompts.size === 0) {
    DEFAULT_PROMPTS.forEach(prompt => {
      storyWeaverPrompts.set(prompt.identifier, { ...prompt });
      storyWeaverPromptOrder.push(prompt.identifier);
    });
  }
}

function openPromptManager() {
  // Remove existing modal
  $('#sw-prompt-manager-modal').remove();

  const modal = $(`
    <div id="sw-prompt-manager-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10002;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(5px);
    ">
      <div style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        width: 900px;
        height: 600px;
        overflow: hidden;
        position: relative;
      ">
        <div style="
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        ">
          <span>📝 提示词管理器</span>
          <button id="sw-prompt-close-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          ">✕</button>
        </div>
        <div style="
          height: calc(100% - 60px);
          overflow: auto;
          padding: 20px;
        ">
          ${buildPromptManagerContent()}
        </div>
      </div>
    </div>
  `);

  $('body').append(modal);

  // Event handlers
  $('#sw-prompt-close-btn').click(() => {
    $('#sw-prompt-manager-modal').remove();
  });

  $('#sw-prompt-manager-modal').click(e => {
    if (e.target.id === 'sw-prompt-manager-modal') {
      $('#sw-prompt-manager-modal').remove();
    }
  });

  setupPromptManagerEvents();
}

function openPromptManagerTH() {
  // For TavernHelper interface, create similar modal but adapted
  openPromptManager(); // For now, use the same implementation
}

function buildPromptManagerContent() {
  const prompts = Array.from(storyWeaverPrompts.values()).sort((a, b) => a.injection_order - b.injection_order);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #333;">提示词列表</h3>
        <div>
          <button id="sw-add-prompt-btn" style="
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
          ">➕ 添加提示词</button>
          <button id="sw-reset-prompts-btn" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
          ">🔄 重置默认</button>
        </div>
      </div>

      <div id="sw-prompt-list" style="
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
      ">
        ${prompts.map(prompt => buildPromptItem(prompt)).join('')}
      </div>
    </div>
  `;
}

function buildPromptItem(prompt) {
  const isEnabled = prompt.enabled !== false;
  return `
    <div class="sw-prompt-item" data-identifier="${prompt.identifier}" style="
      border-bottom: 1px solid #eee;
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
      background: ${isEnabled ? 'white' : '#f8f9fa'};
    ">
      <div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${isEnabled ? '#28a745' : '#6c757d'};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
      " class="sw-prompt-toggle" data-identifier="${prompt.identifier}">
        ${isEnabled ? '✓' : '✕'}
      </div>

      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 5px;">${prompt.name}</div>
        <div style="font-size: 12px; color: #666;">
          角色: ${prompt.role} | 顺序: ${prompt.injection_order} | 深度: ${prompt.injection_depth}
        </div>
        <div style="font-size: 12px; color: #888; margin-top: 5px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${prompt.content}
        </div>
      </div>

      <div style="display: flex; gap: 5px;">
        <button class="sw-prompt-edit" data-identifier="${prompt.identifier}" style="
          background: #17a2b8;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        ">编辑</button>
        <button class="sw-prompt-copy" data-identifier="${prompt.identifier}" style="
          background: #28a745;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        ">复制</button>
        ${!prompt.system_prompt ? `
        <button class="sw-prompt-delete" data-identifier="${prompt.identifier}" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        ">删除</button>
        ` : ''}
      </div>
    </div>
  `;
}

function setupPromptManagerEvents() {
  // Toggle prompt enabled/disabled
  $(document).off('click', '.sw-prompt-toggle').on('click', '.sw-prompt-toggle', function() {
    const identifier = $(this).data('identifier');
    const prompt = storyWeaverPrompts.get(identifier);
    if (prompt) {
      prompt.enabled = !prompt.enabled;
      savePromptSettings();
      refreshPromptManager();
      showNotification(prompt.enabled ? '提示词已启用' : '提示词已禁用', 'info');
    }
  });

  // Edit prompt
  $(document).off('click', '.sw-prompt-edit').on('click', '.sw-prompt-edit', function() {
    const identifier = $(this).data('identifier');
    showPromptEditor(identifier);
  });

  // Copy prompt
  $(document).off('click', '.sw-prompt-copy').on('click', '.sw-prompt-copy', function() {
    const identifier = $(this).data('identifier');
    copyPromptToClipboard(identifier);
  });

  // Delete prompt
  $(document).off('click', '.sw-prompt-delete').on('click', '.sw-prompt-delete', function() {
    const identifier = $(this).data('identifier');
    deletePrompt(identifier);
  });

  // Add new prompt
  $(document).off('click', '#sw-add-prompt-btn').on('click', '#sw-add-prompt-btn', function() {
    showPromptEditor('new');
  });

  // Reset prompts
  $(document).off('click', '#sw-reset-prompts-btn').on('click', '#sw-reset-prompts-btn', function() {
    if (confirm('确定要重置所有提示词为默认设置吗？此操作不可撤销。')) {
      resetToDefaultPrompts();
    }
  });
}

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
      enabled: true,
      system_prompt: false,
      injection_order: storyWeaverPrompts.size + 1,
      injection_depth: 0,
      injection_position: 0
    };
  } else {
    prompt = storyWeaverPrompts.get(identifier);
    if (!prompt) {
      showNotification('找不到指定的提示词', 'error');
      return;
    }
    prompt = { ...prompt }; // Create a copy for editing
  }

  // Remove existing editor
  $('#sw-prompt-editor-modal').remove();

  const editorModal = $(`
    <div id="sw-prompt-editor-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10003;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        width: 700px;
        overflow: hidden;
      ">
        <div style="
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
        ">
          <span>${isNew ? '✨ 新建提示词' : '✏️ 编辑提示词'}</span>
          <button id="sw-editor-close-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          ">✕</button>
        </div>
        <div style="padding: 20px;">
          ${buildPromptEditorForm(prompt)}
        </div>
      </div>
    </div>
  `);

  $('body').append(editorModal);

  // Set up form values
  $('#sw-editor-name').val(prompt.name);
  $('#sw-editor-role').val(prompt.role);
  $('#sw-editor-content').val(prompt.content);
  $('#sw-editor-injection-order').val(prompt.injection_order);
  $('#sw-editor-injection-depth').val(prompt.injection_depth);
  $('#sw-editor-injection-position').val(prompt.injection_position);

  // Event handlers
  $('#sw-editor-close-btn').click(() => {
    $('#sw-prompt-editor-modal').remove();
  });

  $('#sw-editor-save-btn').click(() => {
    savePromptEditor(prompt.identifier, isNew);
  });

  $('#sw-editor-cancel-btn').click(() => {
    $('#sw-prompt-editor-modal').remove();
  });
}

function buildPromptEditorForm(prompt) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">名称：</label>
        <input type="text" id="sw-editor-name" style="
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 5px;
        ">
      </div>

      <div style="display: flex; gap: 15px; margin-bottom: 15px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">角色：</label>
          <select id="sw-editor-role" style="
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
          ">
            <option value="system">System</option>
            <option value="user">User</option>
            <option value="assistant">Assistant</option>
          </select>
        </div>
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">注入顺序：</label>
          <input type="number" id="sw-editor-injection-order" min="1" max="999" style="
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
          ">
        </div>
      </div>

      <div style="display: flex; gap: 15px; margin-bottom: 15px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">注入深度：</label>
          <input type="number" id="sw-editor-injection-depth" min="0" max="999" style="
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
          ">
        </div>
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">位置模式：</label>
          <select id="sw-editor-injection-position" style="
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
          ">
            <option value="0">相对位置</option>
            <option value="1">绝对深度</option>
          </select>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">内容：</label>
        <textarea id="sw-editor-content" style="
          width: 100%;
          height: 200px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 5px;
          resize: vertical;
          font-family: 'Courier New', monospace;
        " placeholder="请输入提示词内容..."></textarea>
      </div>

      <div style="text-align: right;">
        <button id="sw-editor-cancel-btn" style="
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-right: 10px;
        ">取消</button>
        <button id="sw-editor-save-btn" style="
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        ">保存</button>
      </div>
    </div>
  `;
}

function savePromptEditor(originalIdentifier, isNew) {
  const name = $('#sw-editor-name').val().trim();
  const role = $('#sw-editor-role').val();
  const content = $('#sw-editor-content').val().trim();
  const injectionOrder = parseInt($('#sw-editor-injection-order').val()) || 1;
  const injectionDepth = parseInt($('#sw-editor-injection-depth').val()) || 0;
  const injectionPosition = parseInt($('#sw-editor-injection-position').val()) || 0;

  if (!name || !content) {
    alert('请填写名称和内容');
    return;
  }

  const promptData = {
    identifier: originalIdentifier,
    name: name,
    role: role,
    content: content,
    enabled: true,
    system_prompt: false,
    injection_order: injectionOrder,
    injection_depth: injectionDepth,
    injection_position: injectionPosition
  };

  if (isNew) {
    storyWeaverPrompts.set(promptData.identifier, promptData);
    storyWeaverPromptOrder.push(promptData.identifier);
  } else {
    storyWeaverPrompts.set(originalIdentifier, promptData);
  }

  savePromptSettings();
  refreshPromptManager();
  $('#sw-prompt-editor-modal').remove();
  showNotification(isNew ? '提示词已添加' : '提示词已更新', 'success');
}

function copyPromptToClipboard(identifier) {
  const prompt = storyWeaverPrompts.get(identifier);
  if (!prompt) return;

  navigator.clipboard.writeText(prompt.content).then(() => {
    showNotification('提示词内容已复制到剪贴板', 'success');
  }).catch(() => {
    showNotification('复制失败', 'error');
  });
}

function deletePrompt(identifier) {
  const prompt = storyWeaverPrompts.get(identifier);
  if (!prompt || prompt.system_prompt) return;

  if (confirm(`确定要删除提示词"${prompt.name}"吗？`)) {
    storyWeaverPrompts.delete(identifier);
    storyWeaverPromptOrder = storyWeaverPromptOrder.filter(id => id !== identifier);
    savePromptSettings();
    refreshPromptManager();
    showNotification('提示词已删除', 'success');
  }
}

function resetToDefaultPrompts() {
  storyWeaverPrompts.clear();
  storyWeaverPromptOrder = [];

  DEFAULT_PROMPTS.forEach(prompt => {
    storyWeaverPrompts.set(prompt.identifier, { ...prompt });
    storyWeaverPromptOrder.push(prompt.identifier);
  });

  savePromptSettings();
  refreshPromptManager();
  showNotification('提示词已重置为默认设置', 'success');
}

function refreshPromptManager() {
  const content = buildPromptManagerContent();
  $('#sw-prompt-manager-modal').find('[style*="padding: 20px"]').html(content);
  setupPromptManagerEvents();
}

function savePromptSettings() {
  try {
    const promptsData = {
      prompts: Array.from(storyWeaverPrompts.values()),
      order: storyWeaverPromptOrder
    };
    localStorage.setItem('storyWeaverPrompts', JSON.stringify(promptsData));
  } catch (error) {
    console.error('[SW] Failed to save prompt settings:', error);
  }
}

function loadPromptSettings() {
  try {
    const saved = localStorage.getItem('storyWeaverPrompts');
    if (saved) {
      const data = JSON.parse(saved);
      storyWeaverPrompts.clear();
      storyWeaverPromptOrder = [];

      if (data.prompts && Array.isArray(data.prompts)) {
        data.prompts.forEach(prompt => {
          storyWeaverPrompts.set(prompt.identifier, prompt);
        });
      }

      if (data.order && Array.isArray(data.order)) {
        storyWeaverPromptOrder = data.order;
      }

      return true;
    }
  } catch (error) {
    console.error('[SW] Failed to load prompt settings:', error);
  }
  return false;
}

// ========================= SETTINGS MENU =========================

function setupSettingsMenu() {
  // Create settings dropdown HTML
  const settingsDropdown = `
    <div id="sw-settings-dropdown" style="
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      min-width: 200px;
      z-index: 10001;
      display: none;
      animation: fadeIn 0.2s ease;
    ">
      <div style="padding: 8px 0;">
        <a href="#" id="sw-menu-prompt-manager" style="
          display: block;
          padding: 12px 16px;
          text-decoration: none;
          color: #333;
          border-bottom: 1px solid #eee;
          transition: background 0.2s;
        ">
          📝 提示词管理器
        </a>
        <a href="#" id="sw-menu-settings" style="
          display: block;
          padding: 12px 16px;
          text-decoration: none;
          color: #333;
          border-bottom: 1px solid #eee;
          transition: background 0.2s;
        ">
          ⚙️ 系统设置
        </a>
        <a href="#" id="sw-menu-about" style="
          display: block;
          padding: 12px 16px;
          text-decoration: none;
          color: #333;
          transition: background 0.2s;
        ">
          ℹ️ 关于
        </a>
      </div>
    </div>
    <style>
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #sw-settings-dropdown a:hover {
        background: #f5f5f5 !important;
      }
    </style>
  `;

  // Add dropdown to settings button container
  $('#sw-settings-btn').parent().css('position', 'relative').append(settingsDropdown);

  // Settings button click handler
  $('#sw-settings-btn').click(function(e) {
    e.stopPropagation();
    const dropdown = $('#sw-settings-dropdown');
    if (dropdown.is(':visible')) {
      dropdown.hide();
    } else {
      dropdown.show();
    }
  });

  // Menu item handlers
  $('#sw-menu-prompt-manager').click(function(e) {
    e.preventDefault();
    $('#sw-settings-dropdown').hide();
    openPromptManager();
  });

  $('#sw-menu-settings').click(function(e) {
    e.preventDefault();
    $('#sw-settings-dropdown').hide();
    alert('系统设置功能即将推出');
  });

  $('#sw-menu-about').click(function(e) {
    e.preventDefault();
    $('#sw-settings-dropdown').hide();
    showAboutDialog();
  });

  // Close dropdown when clicking outside
  $(document).click(function() {
    $('#sw-settings-dropdown').hide();
  });
}

function setupSettingsMenuTH() {
  // Create settings dropdown HTML for TavernHelper interface
  const settingsDropdown = `
    <div id="sw-settings-dropdown-th" style="
      position: absolute;
      top: 100%;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      min-width: 200px;
      z-index: 10001;
      display: none;
      animation: fadeIn 0.2s ease;
    ">
      <div style="padding: 8px 0;">
        <a href="#" id="sw-menu-prompt-manager-th" style="
          display: block;
          padding: 12px 16px;
          text-decoration: none;
          color: #333;
          border-bottom: 1px solid #eee;
          transition: background 0.2s;
        ">
          📝 提示词管理器
        </a>
        <a href="#" id="sw-menu-settings-th" style="
          display: block;
          padding: 12px 16px;
          text-decoration: none;
          color: #333;
          border-bottom: 1px solid #eee;
          transition: background 0.2s;
        ">
          ⚙️ 系统设置
        </a>
        <a href="#" id="sw-menu-about-th" style="
          display: block;
          padding: 12px 16px;
          text-decoration: none;
          color: #333;
          transition: background 0.2s;
        ">
          ℹ️ 关于
        </a>
      </div>
    </div>
  `;

  // Add dropdown to settings button container
  $('#sw-settings-btn-th').parent().css('position', 'relative').append(settingsDropdown);

  // Event handlers
  $('#sw-settings-btn-th').click(function(e) {
    e.stopPropagation();
    const dropdown = $('#sw-settings-dropdown-th');
    if (dropdown.is(':visible')) {
      dropdown.hide();
    } else {
      dropdown.show();
    }
  });

  $('#sw-menu-prompt-manager-th').click(function(e) {
    e.preventDefault();
    $('#sw-settings-dropdown-th').hide();
    openPromptManagerTH();
  });

  $('#sw-menu-settings-th').click(function(e) {
    e.preventDefault();
    $('#sw-settings-dropdown-th').hide();
    alert('系统设置功能即将推出');
  });

  $('#sw-menu-about-th').click(function(e) {
    e.preventDefault();
    $('#sw-settings-dropdown-th').hide();
    showAboutDialogTH();
  });

  $(document).click(function() {
    $('#sw-settings-dropdown-th').hide();
  });
}

function showAboutDialog() {
  alert('Story Weaver Enhanced v2.0\n\n一个强大的AI故事大纲生成器\n支持多种故事类型和风格\n\n作者：Story Weaver Team');
}

function showAboutDialogTH() {
  alert('Story Weaver Enhanced v2.0\n\n一个强大的AI故事大纲生成器\n支持多种故事类型和风格\n\n作者：Story Weaver Team');
}

// ========================= UTILITIES =========================

function showNotification(message, type = 'info') {
  try {
    if (typeof TavernHelper !== 'undefined' && TavernHelper.showNotification) {
      TavernHelper.showNotification(message, {
        type: type,
        duration: 3000,
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
      helpString: 'Opens the Story Weaver Enhanced interface',
    });

    SlashCommandsAPI.registerSlashCommand({
      name: 'storyweaver',
      description: 'Open Story Weaver interface (alias) - 打开故事大纲生成器',
      callback: openStoryWeaverInterface,
      helpString: 'Alias for /sw command',
    });

    SlashCommandsAPI.registerSlashCommand({
      name: 'swquick',
      description: 'Quick story generation - 快速生成故事大纲',
      callback: handleQuickGeneration,
      helpString: 'Usage: /swquick [type] [chapters]',
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
    detailLevel: 'medium',
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

  // Load prompt settings or initialize with defaults
  if (!loadPromptSettings()) {
    initializePrompts();
  }

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
  showNotification,
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
