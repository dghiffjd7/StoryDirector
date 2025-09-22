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
    injection_position: 0,
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
    injection_position: 0,
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
    injection_position: 0,
  },
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

// ========================= GLOBAL CONTEXT BUILDERS (SAFE) =========================

// Some features (like preview) run outside the native popup script block.
// Provide a safe, global implementation so it is always available.
if (typeof window.buildStoryContextForNative !== 'function') {
  function buildStoryContextForNative(settings) {
    let context = `请为我生成一个${STORY_TYPES[settings.storyType] || settings.storyType}类型的故事大纲。`;

    if (settings.storyTheme) {
      context += `\n\n故事主题: ${settings.storyTheme}`;
    }

    context += `\n\n要求:
1. 包含${settings.chapterCount}个章节
2. 每章有明确的情节发展和冲突
3. 结构完整，逻辑清晰
4. 符合${STORY_STYLES[settings.storyStyle] || settings.storyStyle}的叙述风格
5. 详细程度: ${DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel}`;

    if (settings.specialRequirements) {
      context += `\n6. 特殊要求: ${settings.specialRequirements}`;
    }

    if (settings.includeSummary) {
      context += `\n\n请在大纲前提供故事摘要。`;
    }

    if (settings.includeCharacters) {
      context += `\n\n请包含主要角色的性格特点和发展弧线。`;
    }

    if (settings.includeThemes) {
      context += `\n\n请说明故事要探讨的核心主题。`;
    }

    return context;
  }
  window.buildStoryContextForNative = buildStoryContextForNative;
}

// Basic HTML escape for safe UI rendering (do not use for prompt building)
function escapeHtml(text) {
  try {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  } catch (_) {
    return '';
  }
}

// Helper: copy text in preview dialogs
if (typeof window.copyPreviewContent !== 'function') {
  window.copyPreviewContent = function (text) {
    try {
      navigator.clipboard
        .writeText(text)
        .then(() => showNotification('已复制到剪贴板', 'success'))
        .catch(() => showNotification('复制失败', 'error'));
    } catch (e) {
      showNotification('复制失败', 'error');
    }
  };
}

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

  // Create popup HTML without inline <style>
  const popupHTML = `
    <div id="sw-popup-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10005;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div id="sw-popup-window" class="sw-draggable-window" style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        width: 900px;
        height: 600px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        animation: popupFadeIn 0.25s ease-out;
      ">
        <div class="sw-window-header" style="
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          cursor: move;
          user-select: none;
        ">
          <span>📖 Story Weaver Enhanced - 故事大纲生成器4</span>
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
  `;

  // Ensure keyframes style exists in <head>
  if (!document.getElementById('sw-popup-keyframes')) {
    const style = document.createElement('style');
    style.id = 'sw-popup-keyframes';
    style.textContent = `@keyframes popupFadeIn { from { opacity: 0; transform: scale(0.9) translateY(-20px); } to { opacity: 1; transform: scale(1) translateY(0); } }`;
    document.head.appendChild(style);
  }

  // Inject popup
  $('body').append(popupHTML);

  // After insertion, set textarea values safely
  try {
    if (settings && typeof settings === 'object') {
      if (settings.storyTheme) {
        $('#sw-theme').val(String(settings.storyTheme));
      }
      if (settings.specialRequirements) {
        $('#special-requirements').val(String(settings.specialRequirements));
      }
    }
  } catch (e) {}

  // Close button handler
  $('#sw-close-btn').click(() => {
    console.log('[SW][POPUP] close button clicked');
    // If dragging effects are active, reset them first
    const $win = $('#sw-popup-window');
    $win.removeClass('sw-dragging').css({ boxShadow: '', transform: '', cursor: '', filter: '' });
    $('#sw-popup-overlay').fadeOut(200, function () {
      $(this).remove();
    });
  });

  // Settings button handler
  setupSettingsMenu();

  // Click outside to close (but not when prompt panel is open)
  $('#sw-popup-overlay').click(e => {
    if (e.target.id === 'sw-popup-overlay') {
      // Don't close if prompt panel is open
      if ($('#sw-prompt-panel').hasClass('sw-panel-open')) {
        return;
      }
      $('#sw-popup-overlay').fadeOut(200, function () {
        $(this).remove();
      });
    }
  });

  // Make main window draggable
  makeElementDraggable('#sw-popup-window', '.sw-window-header');

  // Normalize starting position for dragging
  const wndRect = $('#sw-popup-window')[0].getBoundingClientRect();
  $('#sw-popup-window').css({ position: 'fixed', right: 'auto', left: wndRect.left + 'px', top: wndRect.top + 'px' });

  console.log('[SW] ✅ Native popup opened');
}

function buildSimpleInterface(settings) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h2 style="color: #667eea; margin-bottom: 20px; text-align: center;">📖 Story Weaver Enhanced</h2>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">故事主题：</label>
        <textarea id="sw-theme" placeholder="描述您想要的故事主题..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;"></textarea>
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
          <input type="number" id="sw-chapter-count" value="${
            settings.chapterCount || 5
          }" min="3" max="20" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;" />
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
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">特殊要求：</label>
        <textarea id="special-requirements" placeholder="任何特殊的剧情要求、角色设定或者风格偏好..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;"></textarea>
      </div>
      
      <button id="sw-preview-btn" onclick="handleNativePreview()" style="
        width: 100%;
        padding: 10px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        border: none;
        color: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 16px;
        box-shadow: 0 6px 18px rgba(102, 126, 234, 0.4);
        margin-bottom: 15px;
      ">预览完整提示词</button>
      
      <div id="sw-output-section" style="display: none;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">生成结果：</label>
        <pre id="sw-output-content" style="
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px;
          min-height: 120px;
          white-space: pre-wrap;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        "></pre>
        
        <div id="sw-output-controls" style="display: none; margin-top: 10px; text-align: center;">
          <button onclick="copyNativeResult()" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">📋 复制</button>
          <button onclick="saveNativeResult()" style="padding: 8px 15px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">💾 保存</button>
        </div>
      </div>
      
      <script>
        window.swNativeResult = window.swNativeResult || '';
        
        function collectNativeSettingsForPreview() {
          return {
            storyTheme: document.getElementById('sw-theme').value,
            storyType: document.getElementById('sw-type').value,
            storyStyle: document.getElementById('sw-style').value,
            chapterCount: parseInt(document.getElementById('sw-chapter-count').value) || 5,
            detailLevel: document.getElementById('sw-detail').value,
            specialRequirements: document.getElementById('special-requirements').value,
            contextLength: 10,
            includeSummary: true,
            includeCharacters: false,
            includeThemes: false,
          };
        }

        function handleNativePreview() {
          try {
            const settings = collectNativeSettingsForPreview();
            const previewData = buildPromptForPreview(settings);
            showPromptPreviewDialog(previewData, settings);
          } catch (err) {
            console.error('[SW] Preview failed:', err);
            alert('预览失败: ' + err.message);
          }
        }

        function copyNativeResult() {
          if (window.swNativeResult) {
            navigator.clipboard.writeText(window.swNativeResult).then(() => {
              alert('结果已复制到剪贴板！');
            }).catch(() => {
              alert('复制失败，请手动选择文本复制');
            });
          }
        }
        
        function saveNativeResult() {
          if (window.swNativeResult) {
            const blob = new Blob([window.swNativeResult], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'story-outline-' + Date.now() + '.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('文件已保存！');
          }
        }
      </script>
    </div>
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
    .filter(prompt => prompt && prompt.enabled !== false);

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
  const promptPanel = $('#sw-prompt-panel');

  if (promptPanel.length === 0) {
    // First time opening - create the panel
    createPromptManagerPanel();
  }

  // Show the panel with slide animation
  $('#sw-prompt-panel').addClass('sw-panel-open');
  console.log('[SW] Prompt manager panel opened');
}

function createPromptManagerPanel() {
  const panelHTML = `
    <div id="sw-prompt-panel" class="sw-draggable-panel" style="
      position: fixed;
      top: 100px;
      right: -450px;
      width: 420px;
      height: 600px;
      background: white;
      border-radius: 12px 0 0 12px;
      box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
      z-index: 10005;
      display: flex;
      flex-direction: column;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid #e1e5e9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div class="sw-panel-header" style="
        padding: 16px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px 0 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        user-select: none;
      ">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 18px;">📝</span>
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">提示词管理器</h3>
        </div>
        <button id="sw-prompt-panel-close" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        " onmouseover="this.style.background='rgba(255,255,255,0.3)'"
           onmouseout="this.style.background='rgba(255,255,255,0.2)'">✕</button>
      </div>

      <div class="sw-panel-content" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      ">
        ${buildPromptManagerContent()}
      </div>
    </div>

    <style>
      .sw-panel-open {
        right: 0 !important;
      }

      .sw-draggable-panel {
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .sw-draggable-panel.sw-dragging {
        box-shadow: -8px 0 35px rgba(0, 0, 0, 0.25);
        transform: scale(1.02);
        z-index: 10001;
        right: auto !important; /* allow free dragging even if panel-open sets right:0 */
      }

      .sw-draggable-window.sw-dragging {
        box-shadow: 0 25px 70px rgba(0, 0, 0, 0.4);
        transform: scale(1.02);
        z-index: 10001;
      }

      .sw-panel-header:hover {
        background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      }

      .sw-window-header:hover {
        background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      }

      .sw-panel-content::-webkit-scrollbar {
        width: 6px;
      }

      .sw-panel-content::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .sw-panel-content::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }

      .sw-panel-content::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    </style>
  `;

  $('body').append(panelHTML);

  // Bind panel events
  $('#sw-prompt-panel-close').click(() => {
    console.log('[SW][PM] close button clicked');
    closePromptManager();
  });

  // Make panel draggable
  makeElementDraggable('#sw-prompt-panel', '.sw-panel-header');

  // Ensure events are bound immediately after panel creation
  setTimeout(() => {
    setupPromptManagerEvents();
    console.log('[SW] Panel events bound after creation');
  }, 100);

  console.log('[SW] Prompt manager panel created');
}

function closePromptManager() {
  const $panel = $('#sw-prompt-panel');
  if ($panel.length === 0) return;
  // Remove immediately to avoid overlaying invisible layer
  $panel.remove();
  console.log('[SW] Prompt manager panel closed');
}

function makeElementDraggable(elementSelector, handleSelector) {
  // Remove any existing drag handlers to avoid conflicts
  $(document).off('mousedown.drag' + elementSelector.replace('#', ''));
  $(document).off('mousemove.drag' + elementSelector.replace('#', ''));
  $(document).off('mouseup.drag' + elementSelector.replace('#', ''));
  $(window).off('mousemove.drag' + elementSelector.replace('#', ''));
  $(window).off('mouseup.drag' + elementSelector.replace('#', ''));

  let isDragging = false;
  let startX, startY, startLeft, startTop;
  let currentDeltaX = 0,
    currentDeltaY = 0;
  let commitLeft = 0,
    commitTop = 0;
  let dragNamespace = '.drag' + elementSelector.replace('#', '');
  const handleTarget = elementSelector + ' ' + handleSelector;

  // Debug: ensure handle exists
  try {
    const handleCount = $(handleTarget).length;
    console.log('[SW] Bind draggable → element:', elementSelector, 'handle:', handleSelector, 'count:', handleCount);
  } catch (err) {}

  // Bind directly to handle with pointer events (clean & robust)
  $(handleTarget)
    .off(dragNamespace)
    .on('pointerdown' + dragNamespace, function (e) {
      // Left mouse or touch/pen only
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      // Don't start drag from interactive controls inside header
      if ($(e.target).closest('button, a, input, textarea, select, [data-no-drag]').length) {
        return;
      }

      const element = $(elementSelector);
      if (element.length === 0) return;

      const rect = element[0].getBoundingClientRect();

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      currentDeltaX = 0;
      currentDeltaY = 0;
      commitLeft = startLeft;
      commitTop = startTop;

      // Prepare for potential drag (apply styles after threshold)
      element.css({ 'user-select': 'none' });
      try {
        e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
      } catch (_) {}

      // Prevent text selection and event propagation
      e.preventDefault();
      e.stopPropagation();

      const logRect = { left: startLeft, top: startTop };
    })
    .on('pointermove' + dragNamespace, function (e) {
      if (!isDragging) return;

      const element = $(elementSelector);
      if (element.length === 0) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      currentDeltaX = deltaX;
      currentDeltaY = deltaY;
      commitLeft = startLeft + deltaX;
      commitTop = startTop + deltaY;

      if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3 && !element.hasClass('sw-dragging')) {
        return; // not yet dragging
      }

      if (!element.hasClass('sw-dragging')) {
        // start drag: set fixed position baseline
        element.addClass('sw-dragging');
        // If it's the side panel, detach from slide-in state
        if (element.is('#sw-prompt-panel')) {
          element.removeClass('sw-panel-open');
        }
        element.css({
          transition: 'none',
          right: 'auto',
          position: 'fixed',
          left: startLeft + 'px',
          top: startTop + 'px',
        });
      }

      element.css({
        willChange: 'transform',
        transform: `translate3d(${deltaX}px, ${deltaY}px, 0)`,
        boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
        cursor: 'grabbing',
        filter: 'brightness(0.98)',
      });
      if (Math.abs(deltaX) % 40 === 0 || Math.abs(deltaY) % 40 === 0) {
        const cur = element[0].getBoundingClientRect();
      }
    })
    .on('pointerup' + dragNamespace + ' pointercancel' + dragNamespace, function (e) {
      if (!isDragging) return;

      const element = $(elementSelector);
      isDragging = false;

      if (element.hasClass('sw-dragging')) {
        // Commit based on the live visual rect to avoid zoom/scroll delta drift
        const rectNow = element[0].getBoundingClientRect();
        const width = rectNow.width || element.outerWidth();
        const height = rectNow.height || element.outerHeight();

        // Robust viewport detection to avoid 0 width/height in iframes
        function getViewport() {
          let ws = [
            typeof window !== 'undefined' ? window.innerWidth : 0,
            document && document.documentElement ? document.documentElement.clientWidth : 0,
          ];
          let hs = [
            typeof window !== 'undefined' ? window.innerHeight : 0,
            document && document.documentElement ? document.documentElement.clientHeight : 0,
          ];
          if (window && window.visualViewport) {
            ws.push(window.visualViewport.width);
            hs.push(window.visualViewport.height);
          }
          try {
            if (window.top && window.top !== window) {
              ws.push(window.top.innerWidth || 0);
              hs.push(window.top.innerHeight || 0);
            }
          } catch (e) {}
          const w = Math.max.apply(
            null,
            ws.filter(n => n && n > 0),
          );
          const h = Math.max.apply(
            null,
            hs.filter(n => n && n > 0),
          );
          return { w: w || 0, h: h || 0 };
        }

        const vp = getViewport();
        const padding = 8; // minimal padding away from edges
        let newLeft = commitLeft;
        let newTop = commitTop;

        if (vp.w > 0 && vp.h > 0) {
          const maxLeft = vp.w - width - padding;
          const maxTop = vp.h - height - padding;
          newLeft = Math.max(padding, Math.min(newLeft, maxLeft));
          newTop = Math.max(padding, Math.min(newTop, maxTop));
        } else {
        }

        // Commit instantly at drop point without any animation/flicker
        element.css({
          transition: 'none',
          transform: 'none',
          left: newLeft + 'px',
          top: newTop + 'px',
          right: 'auto',
        });

        const suppress = ev => {
          ev.stopPropagation();
          ev.preventDefault();
          window.removeEventListener('click', suppress, true);
        };
        window.addEventListener('click', suppress, true);
        setTimeout(() => window.removeEventListener('click', suppress, true), 100);
      }

      setTimeout(() => {
        element.css({
          transition: '',
          'user-select': 'auto',
          filter: '',
          cursor: '',
          willChange: '',
          boxShadow: '',
        });
        element.removeClass('sw-dragging');
      }, 0);

      try {
        e.target.releasePointerCapture && e.target.releasePointerCapture(e.pointerId);
      } catch (_) {}

      const after =
        element[0] && element[0].getBoundingClientRect ? element[0].getBoundingClientRect() : { left: null, top: null };
    });
  // Note: we bind directly on header; no delegated re-trigger to avoid double-start

  const moveHandler = function (e) {
    if (!isDragging) return;

    const element = $(elementSelector);
    if (element.length === 0) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    currentDeltaX = deltaX;
    currentDeltaY = deltaY;

    // If direct pointer handlers handled active drag, skip fallback
    if ($(elementSelector).hasClass('sw-dragging')) return;

    // Fallback path (should rarely run). Compute absolute left/top directly.
    const newLeft = startLeft + deltaX;
    const newTop = startTop + deltaY;
    element.css({ right: 'auto', position: 'fixed', left: newLeft + 'px', top: newTop + 'px' });
  };
}

function openPromptManagerTH() {
  // For TavernHelper interface, create similar modal but adapted
  openPromptManager(); // For now, use the same implementation
}

function buildPromptManagerContent() {
  const prompts = storyWeaverPromptOrder.map(id => storyWeaverPrompts.get(id)).filter(Boolean);

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: #333;">提示词列表</h3>
        <div style="display:flex; flex-wrap: wrap; gap: 10px;">
          <button id="sw-add-prompt-btn" style="
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 0;
          ">➕ 添加提示词</button>
          <button id="sw-import-prompts-btn" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 0;
          ">📥 导入</button>
          <button id="sw-export-prompts-btn" style="
            background: #17a2b8;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 0;
          ">📤 导出</button>
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

      <div style="margin-top: 20px; text-align: center;">
        <button id="sw-preview-final-prompt-btn" style="
          background: #6f42c1;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
        ">👁️ 预览最终提示词</button>
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
      cursor: default;
      position: relative;
      transition: all 0.2s ease;
    ">
      <div class="sw-prompt-drag-handle" style="
        width: 20px;
        height: 20px;
        color: #999;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        margin-right: 5px;
      " title="拖拽排序">⋮⋮</div>

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

      <div style="flex: 1; min-width: 0;">
        <div style="font-weight: 600; margin-bottom: 5px;">${escapeHtml(prompt.name)}</div>
        <div style="font-size: 12px; color: #666;">
          角色: ${escapeHtml(prompt.role)} | 顺序: ${prompt.injection_order} | 深度: ${prompt.injection_depth}
        </div>
        <div style="font-size: 12px; color: #888; margin-top: 5px; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escapeHtml(prompt.content)}
        </div>
      </div>

      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="sw-prompt-edit" data-identifier="${prompt.identifier}" style="
          background: #17a2b8;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        ">编辑</button>
        <button class="sw-prompt-copy" data-identifier="${prompt.identifier}" style="
          background: #28a745;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        ">复制</button>
        ${
          !prompt.system_prompt
            ? `
        <button class="sw-prompt-delete" data-identifier="${prompt.identifier}" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        ">删除</button>
        `
            : ''
        }
      </div>
    </div>
  `;
}

function setupPromptManagerEvents() {
  console.log('[SW] Setting up prompt manager events...');

  const $panel = $('#sw-prompt-panel');
  if ($panel.length === 0) {
    console.log('[SW] Prompt panel not found; defer binding until panel is created.');
    return;
  }

  // Clear any existing event handlers on the panel to prevent duplicates
  $panel.off('.swpromptevents');

  // Add a generic click handler for all buttons in the prompt panel for debugging
  $panel.on('click.swpromptevents', 'button', function (e) {
    console.log('[SW] Button clicked in prompt panel:', this.id, this.className);
    // Don't prevent default here, let specific handlers handle it
  });

  // Toggle prompt enabled/disabled
  $panel.on('click.swpromptevents', '.sw-prompt-toggle', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SW] Toggle clicked for:', $(this).data('identifier'));
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
  $panel.on('click.swpromptevents', '.sw-prompt-edit', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SW] Edit clicked for:', $(this).data('identifier'));
    const identifier = $(this).data('identifier');
    showPromptEditor(identifier);
  });

  // Copy prompt
  $panel.on('click.swpromptevents', '.sw-prompt-copy', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SW] Copy clicked for:', $(this).data('identifier'));
    const identifier = $(this).data('identifier');
    copyPromptToClipboard(identifier);
  });

  // Delete prompt
  $panel.on('click.swpromptevents', '.sw-prompt-delete', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SW] Delete clicked for:', $(this).data('identifier'));
    const identifier = $(this).data('identifier');
    deletePrompt(identifier);
  });

  // Add new prompt
  $panel.on('click.swpromptevents', '#sw-add-prompt-btn', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SW] Add prompt clicked');
    showPromptEditor('new');
  });

  // Reset prompts
  $panel.on('click.swpromptevents', '#sw-reset-prompts-btn', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SW] Reset prompts clicked');
    if (confirm('确定要重置所有提示词为默认设置吗？此操作不可撤销。')) {
      resetToDefaultPrompts();
    }
  });

  // Import prompts
  $panel.on('click.swpromptevents', '#sw-import-prompts-btn', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SW] Import prompts clicked');
    importPrompts();
  });

  // Export prompts
  $panel.on('click.swpromptevents', '#sw-export-prompts-btn', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SW] Export prompts clicked');
    exportPrompts();
  });

  // Preview final prompt
  $panel.on('click.swpromptevents', '#sw-preview-final-prompt-btn', function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SW] Preview prompt clicked');
    previewFinalPrompt();
  });

  // Test if elements exist
  setTimeout(() => {
    console.log('[SW] Panel elements check:');
    console.log('  - Add button exists:', $('#sw-add-prompt-btn').length > 0);
    console.log('  - Import button exists:', $('#sw-import-prompts-btn').length > 0);
    console.log('  - Export button exists:', $('#sw-export-prompts-btn').length > 0);
    console.log('  - Reset button exists:', $('#sw-reset-prompts-btn').length > 0);
    console.log('  - Preview button exists:', $('#sw-preview-final-prompt-btn').length > 0);
    console.log('  - Toggle buttons exist:', $('.sw-prompt-toggle').length);
    console.log('  - Edit buttons exist:', $('.sw-prompt-edit').length);
  }, 50);

  console.log('[SW] All prompt manager events bound successfully');
}

function setupPromptDragAndDrop() {
  const promptList = $('#sw-prompt-list')[0];
  if (!promptList) return;

  let draggedElement = null;
  let draggedIndex = -1;
  let placeholderElement = null;

  // Create placeholder element
  function createPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      height: 2px;
      background: #667eea;
      margin: 5px 0;
      border-radius: 1px;
      opacity: 0.8;
      transition: all 0.2s ease;
    `;
    placeholder.className = 'sw-prompt-placeholder';
    return placeholder;
  }

  // Handle drag start
  $(promptList)
    .off('mousedown.promptdrag')
    .on('mousedown.promptdrag', '.sw-prompt-drag-handle', function (e) {
      e.preventDefault();
      const promptItem = $(this).closest('.sw-prompt-item')[0];

      draggedElement = promptItem;
      draggedIndex = Array.from(promptList.children).indexOf(promptItem);

      // Add dragging styles
      $(draggedElement).addClass('sw-dragging').css({
        opacity: '0.7',
        transform: 'scale(0.98)',
        zIndex: '1000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      });

      // Create and insert placeholder
      placeholderElement = createPlaceholder();
      promptItem.parentNode.insertBefore(placeholderElement, promptItem.nextSibling);

      // Bind mouse events
      $(document).on('mousemove.promptdrag', handleDragMove);
      $(document).on('mouseup.promptdrag', handleDragEnd);

      console.log('[SW] Drag started for prompt:', $(promptItem).data('identifier'));
    });

  function handleDragMove(e) {
    if (!draggedElement || !placeholderElement) return;

    const mouseY = e.clientY;
    const items = Array.from(promptList.children).filter(
      child => !child.classList.contains('sw-dragging') && !child.classList.contains('sw-prompt-placeholder'),
    );

    let targetIndex = -1;
    let insertPosition = 'after';

    // Find the best insertion point
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rect = item.getBoundingClientRect();
      const itemCenterY = rect.top + rect.height / 2;

      if (mouseY < itemCenterY) {
        targetIndex = i;
        insertPosition = 'before';
        break;
      } else if (i === items.length - 1) {
        targetIndex = i;
        insertPosition = 'after';
      }
    }

    // Move placeholder to the correct position
    if (targetIndex !== -1) {
      const targetItem = items[targetIndex];
      if (insertPosition === 'before') {
        promptList.insertBefore(placeholderElement, targetItem);
      } else {
        promptList.insertBefore(placeholderElement, targetItem.nextSibling);
      }
    }
  }

  function handleDragEnd() {
    if (!draggedElement || !placeholderElement) return;

    // Remove dragging styles
    $(draggedElement).removeClass('sw-dragging').css({
      opacity: '',
      transform: '',
      zIndex: '',
      boxShadow: '',
    });

    // Insert dragged element at placeholder position
    promptList.insertBefore(draggedElement, placeholderElement);
    placeholderElement.remove();

    // Update prompt order
    updatePromptOrder();

    // Clean up
    draggedElement = null;
    draggedIndex = -1;
    placeholderElement = null;

    $(document).off('mousemove.promptdrag mouseup.promptdrag');

    console.log('[SW] Drag ended, order updated');
  }

  function updatePromptOrder() {
    const newOrder = Array.from(promptList.children).map((item, index) => {
      const identifier = $(item).data('identifier');
      const prompt = storyWeaverPrompts.get(identifier);
      if (prompt) {
        prompt.injection_order = index + 1;
      }
      return identifier;
    });

    // Update global order
    storyWeaverPromptOrder = newOrder;

    // Save settings
    savePromptSettings();

    // Refresh to show updated order numbers
    setTimeout(() => {
      refreshPromptManager();
      showNotification('提示词顺序已更新', 'success');
    }, 100);
  }
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
      injection_position: 0,
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
      z-index: 10006;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div id="sw-prompt-editor-dialog" class="sw-draggable-window" style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        width: 700px;
        overflow: hidden;
      ">
        <div class="sw-editor-header" style="
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          cursor: move;
          user-select: none;
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

  // Make editor dialog draggable via its header
  makeElementDraggable('#sw-prompt-editor-dialog', '.sw-editor-header');
  const edRect = $('#sw-prompt-editor-dialog')[0].getBoundingClientRect();
  $('#sw-prompt-editor-dialog').css({
    position: 'fixed',
    right: 'auto',
    left: edRect.left + 'px',
    top: edRect.top + 'px',
  });

  // Set up form values
  $('#sw-editor-name').val(prompt.name || '');
  $('#sw-editor-description').val(prompt.description || '');
  $('#sw-editor-role').val(prompt.role || 'user');
  $('#sw-editor-content').val(prompt.content || '');
  $('#sw-editor-injection-order').val(prompt.injection_order || 1);
  $('#sw-editor-injection-depth').val(prompt.injection_depth || 0);
  $('#sw-editor-injection-position').val(prompt.injection_position || 0);
  $('#sw-editor-enabled').prop('checked', prompt.enabled !== false);

  // Character counter
  function updateCharCount() {
    const content = $('#sw-editor-content').val();
    $('#sw-editor-char-count').text(`字符数: ${content.length}`);
  }
  updateCharCount();

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

  // Enhanced event handlers
  $('#sw-editor-content').on('input', updateCharCount);

  $('#sw-editor-insert-placeholder').click(() => {
    showPlaceholderMenu();
  });

  $('#sw-editor-preview-content').click(() => {
    previewPromptContent();
  });

  $('#sw-editor-test-btn').click(() => {
    testPrompt();
  });
}

function buildPromptEditorForm(prompt) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- Basic Information -->
      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">基本信息</h4>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">名称：</label>
          <input type="text" id="sw-editor-name" style="
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          " placeholder="为提示词命名，例如：系统角色设定">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">
            描述 <span style="color: #999; font-weight: normal;">(可选)</span>：
          </label>
          <input type="text" id="sw-editor-description" style="
            width: 100%;
            padding: 10px 12px;
            border: 2px solid #e1e5e9;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s;
          " placeholder="简短描述这个提示词的作用">
        </div>

        <div style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">角色类型：</label>
            <select id="sw-editor-role" style="
              width: 100%;
              padding: 10px 12px;
              border: 2px solid #e1e5e9;
              border-radius: 6px;
              font-size: 14px;
              background: white;
            ">
              <option value="system">System - 系统角色设定</option>
              <option value="user">User - 用户输入</option>
              <option value="assistant">Assistant - 助手响应</option>
            </select>
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">
              启用状态：
            </label>
            <label style="display: flex; align-items: center; gap: 8px; padding: 10px; border: 2px solid #e1e5e9; border-radius: 6px; background: white;">
              <input type="checkbox" id="sw-editor-enabled" checked>
              <span>启用此提示词</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Advanced Settings -->
      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px;">高级设置</h4>

        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">注入顺序：</label>
            <input type="number" id="sw-editor-injection-order" min="1" max="999" style="
              width: 100%;
              padding: 10px 12px;
              border: 2px solid #e1e5e9;
              border-radius: 6px;
              font-size: 14px;
            ">
            <small style="color: #666; font-size: 12px;">数字越小优先级越高</small>
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">注入深度：</label>
            <input type="number" id="sw-editor-injection-depth" min="0" max="999" style="
              width: 100%;
              padding: 10px 12px;
              border: 2px solid #e1e5e9;
              border-radius: 6px;
              font-size: 14px;
            ">
            <small style="color: #666; font-size: 12px;">控制注入的深度位置</small>
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">位置模式：</label>
            <select id="sw-editor-injection-position" style="
              width: 100%;
              padding: 10px 12px;
              border: 2px solid #e1e5e9;
              border-radius: 6px;
              font-size: 14px;
              background: white;
            ">
              <option value="0">相对位置</option>
              <option value="1">绝对深度</option>
            </select>
            <small style="color: #666; font-size: 12px;">注入位置计算方式</small>
          </div>
        </div>
      </div>

      <!-- Content Editor -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label style="font-weight: 600; color: #333;">提示词内容：</label>
          <div style="display: flex; gap: 8px;">
            <button type="button" id="sw-editor-insert-placeholder" style="
              background: #17a2b8;
              color: white;
              border: none;
              padding: 4px 8px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 12px;
            ">插入占位符</button>
            <button type="button" id="sw-editor-preview-content" style="
              background: #6f42c1;
              color: white;
              border: none;
              padding: 4px 8px;
              border-radius: 3px;
              cursor: pointer;
              font-size: 12px;
            ">预览</button>
          </div>
        </div>

        <textarea id="sw-editor-content" style="
          width: 100%;
          height: 250px;
          padding: 15px;
          border: 2px solid #e1e5e9;
          border-radius: 6px;
          resize: vertical;
          font-family: 'Courier New', 'Monaco', monospace;
          font-size: 13px;
          line-height: 1.5;
          transition: border-color 0.2s;
        " placeholder="请输入提示词内容...

可用占位符：
{{STORY_CONTEXT}} - 故事上下文信息
{{USER_INPUT}} - 用户输入内容
{{CHARACTER_NAME}} - 角色名称"></textarea>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <small style="color: #666;">
            💡 支持占位符变量，在使用时会自动替换为实际内容
          </small>
          <small id="sw-editor-char-count" style="color: #999;">
            字符数: 0
          </small>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #eee;">
        <div>
          <button id="sw-editor-test-btn" style="
            background: #ffc107;
            color: #212529;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
          ">🧪 测试</button>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="sw-editor-cancel-btn" style="
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
          ">取消</button>
          <button id="sw-editor-save-btn" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
          ">💾 保存</button>
        </div>
      </div>
    </div>

    <style>
      #sw-editor-name:focus,
      #sw-editor-description:focus,
      #sw-editor-role:focus,
      #sw-editor-injection-order:focus,
      #sw-editor-injection-depth:focus,
      #sw-editor-injection-position:focus,
      #sw-editor-content:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    </style>
  `;
}

function savePromptEditor(originalIdentifier, isNew) {
  const name = $('#sw-editor-name').val().trim();
  const description = $('#sw-editor-description').val().trim();
  const role = $('#sw-editor-role').val();
  const content = $('#sw-editor-content').val().trim();
  const enabled = $('#sw-editor-enabled').prop('checked');
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
    description: description,
    role: role,
    content: content,
    enabled: enabled,
    system_prompt: false,
    injection_order: injectionOrder,
    injection_depth: injectionDepth,
    injection_position: injectionPosition,
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

// Enhanced editor functions
function showPlaceholderMenu() {
  const placeholders = [
    { key: '{{STORY_CONTEXT}}', desc: '故事上下文信息' },
    { key: '{{USER_INPUT}}', desc: '用户输入内容' },
    { key: '{{CHARACTER_NAME}}', desc: '角色名称' },
    { key: '{{STORY_TYPE}}', desc: '故事类型' },
    { key: '{{STORY_THEME}}', desc: '故事主题' },
    { key: '{{CHAPTER_COUNT}}', desc: '章节数量' },
  ];

  const menu = $(`
    <div style="
      position: absolute;
      background: white;
      border: 1px solid #ddd;
      border-radius: 5px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 10006;
      min-width: 200px;
    ">
      ${placeholders
        .map(
          p => `
        <div class="placeholder-item" data-placeholder="${p.key}" style="
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
          transition: background 0.2s;
        ">
          <div style="font-weight: 600; font-size: 12px; font-family: monospace;">${p.key}</div>
          <div style="font-size: 11px; color: #666;">${p.desc}</div>
        </div>
      `,
        )
        .join('')}
    </div>
  `);

  // Position menu near the button
  const button = $('#sw-editor-insert-placeholder');
  const offset = button.offset();
  menu.css({
    position: 'absolute',
    top: offset.top + button.outerHeight() + 5,
    left: offset.left,
  });

  $('body').append(menu);

  // Handle clicks
  menu.find('.placeholder-item').click(function () {
    const placeholder = $(this).data('placeholder');
    const textarea = $('#sw-editor-content')[0];
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    textarea.value = text.substring(0, start) + placeholder + text.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);

    menu.remove();
  });

  // Style hover effects
  menu.find('.placeholder-item').hover(
    function () {
      $(this).css('background', '#f5f5f5');
    },
    function () {
      $(this).css('background', 'white');
    },
  );

  // Close on outside click
  setTimeout(() => {
    $(document).one('click', () => menu.remove());
  }, 100);
}

function previewPromptContent() {
  const content = $('#sw-editor-content').val();
  if (!content.trim()) {
    alert('请先输入提示词内容');
    return;
  }

  // Create preview with sample data
  const sampleData = {
    STORY_CONTEXT: '一个年轻的探险家寻找失落的古代宝藏...',
    USER_INPUT: '用户的输入内容',
    CHARACTER_NAME: '艾丽克斯',
    STORY_TYPE: '冒险故事',
    STORY_THEME: '探险与成长',
    CHAPTER_COUNT: '5',
  };

  let previewContent = content;
  Object.entries(sampleData).forEach(([key, value]) => {
    previewContent = previewContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });

  alert(`预览效果：\n\n${previewContent}`);
}

function testPrompt() {
  const name = $('#sw-editor-name').val().trim();
  const content = $('#sw-editor-content').val().trim();

  if (!name || !content) {
    alert('请先填写名称和内容');
    return;
  }

  alert(`测试功能：\n\n提示词名称: ${name}\n内容长度: ${content.length} 字符\n\n✅ 基本验证通过`);
}

function copyPromptToClipboard(identifier) {
  const prompt = storyWeaverPrompts.get(identifier);
  if (!prompt) return;

  navigator.clipboard
    .writeText(prompt.content)
    .then(() => {
      showNotification('提示词内容已复制到剪贴板', 'success');
    })
    .catch(() => {
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
  $('#sw-prompt-panel .sw-panel-content').html(content);
  // Don't call setupPromptManagerEvents() here as events are globally bound
  setupPromptDragAndDrop(); // Only re-setup drag and drop for new elements
}

function savePromptSettings() {
  try {
    const promptsData = {
      prompts: Array.from(storyWeaverPrompts.values()),
      order: storyWeaverPromptOrder,
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

// ========================= IMPORT/EXPORT =========================

function exportPrompts() {
  try {
    // Create export data
    const exportData = {
      version: '2.0',
      type: 'story_weaver_prompts',
      timestamp: new Date().toISOString(),
      prompts: Array.from(storyWeaverPrompts.values()),
      order: storyWeaverPromptOrder,
      metadata: {
        count: storyWeaverPrompts.size,
        exported_by: 'Story Weaver Enhanced v2.0',
      },
    };

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `SW_Prompts_Export_${timestamp}.json`;

    // Create and download file
    const jsonContent = JSON.stringify(exportData, null, 2);
    downloadFile(jsonContent, filename, 'application/json');

    showNotification(`提示词已导出: ${filename}`, 'success');
    console.log('[SW] Prompts exported:', filename);
  } catch (error) {
    console.error('[SW] Export failed:', error);
    showNotification('导出失败: ' + error.message, 'error');
  }
}

function importPrompts() {
  // Create file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';

  fileInput.onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const importData = JSON.parse(e.target.result);
        processImportData(importData);
      } catch (error) {
        console.error('[SW] Import failed:', error);
        showNotification('导入失败: 文件格式错误', 'error');
      }
    };
    reader.readAsText(file);
  };

  document.body.appendChild(fileInput);
  fileInput.click();
  document.body.removeChild(fileInput);
}

function processImportData(data) {
  try {
    // Validate import data
    if (!data || typeof data !== 'object') {
      throw new Error('无效的文件格式');
    }

    let prompts = [];
    let order = [];

    // Handle different import formats
    if (data.type === 'story_weaver_prompts') {
      // Native SW format
      prompts = data.prompts || [];
      order = data.order || [];
    } else if (Array.isArray(data.prompts)) {
      // Generic prompts array
      prompts = data.prompts;
    } else if (Array.isArray(data)) {
      // Direct array of prompts
      prompts = data;
    } else {
      throw new Error('不支持的文件格式');
    }

    if (!Array.isArray(prompts) || prompts.length === 0) {
      throw new Error('文件中没有找到有效的提示词');
    }

    // Strictly extract ordering and enabled states from prompt_order/promptOrder
    if (Array.isArray(data.prompt_order) || Array.isArray(data.promptOrder)) {
      // Helper to detect current character id
      function getCurrentCharacterIdSafe() {
        try {
          const ch =
            window.TavernHelper && window.TavernHelper.getCharacterData && window.TavernHelper.getCharacterData();
          const cands = [
            ch && ch.character_id,
            ch && ch.id,
            ch && ch.charId,
            ch && ch.avatar_id,
            ch && ch.avatar && ch.avatar.id,
          ];
          for (const v of cands) {
            if (typeof v === 'number' && isFinite(v)) return Number(v);
            if (typeof v === 'string' && v.trim()) {
              const n = Number(v);
              if (!isNaN(n)) return n;
            }
          }
        } catch (e) {}
        return null;
      }
      const promptOrderArray = Array.isArray(data.prompt_order) ? data.prompt_order : data.promptOrder;
      // Select the group with the largest order length (maximum coverage)
      let entry = null;
      let maxLen = -1;
      promptOrderArray.forEach(po => {
        const len = Array.isArray(po && po.order) ? po.order.length : 0;
        if (len > maxLen) {
          maxLen = len;
          entry = po;
        }
      });
      if (!entry || !Array.isArray(entry.order) || entry.order.length === 0) {
        throw new Error('缺少 prompt_order 对应条目或其 order 为空');
      }
      order = entry.order; // array of {identifier, enabled}
    } else {
      throw new Error('缺少 prompt_order/promptOrder，无法确定顺序与启用状态');
    }

    // Show import confirmation dialog
    showImportConfirmationDialog(prompts, order);
  } catch (error) {
    console.error('[SW] Import processing failed:', error);
    showNotification('导入失败: ' + error.message, 'error');
  }
}

function showImportConfirmationDialog(prompts, order) {
  // Remove existing dialog
  $('#sw-import-dialog').remove();

  const dialog = $(`
    <div id="sw-import-dialog" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10004;
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
        width: 600px;
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
          <span>📥 导入提示词确认</span>
          <button id="sw-import-close-btn" style="
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
          <div style="margin-bottom: 15px;">
            <p style="margin: 0 0 10px 0; color: #333;">
              找到 <strong>${prompts.length}</strong> 个提示词，确定要导入吗？
            </p>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ddd; border-radius: 5px; padding: 10px; background: #f8f9fa;">
              ${prompts
                .map(
                  p =>
                    `<div style="margin-bottom: 5px;">• ${p.name || p.identifier || 'Unnamed'} (${
                      p.role || 'unknown'
                    })</div>`,
                )
                .join('')}
            </div>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="radio" name="import-mode" value="replace" checked>
              <span>替换所有现有提示词</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
              <input type="radio" name="import-mode" value="merge">
              <span>合并到现有提示词（保留现有的）</span>
            </label>
          </div>

          <div style="text-align: right;">
            <button id="sw-import-cancel-btn" style="
              background: #6c757d;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              margin-right: 10px;
            ">取消</button>
            <button id="sw-import-confirm-btn" style="
              background: #28a745;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
            ">确定导入</button>
          </div>
        </div>
      </div>
    </div>
  `);

  $('body').append(dialog);

  // Event handlers
  $('#sw-import-close-btn, #sw-import-cancel-btn').click(() => {
    $('#sw-import-dialog').remove();
  });

  $('#sw-import-confirm-btn').click(() => {
    const mode = $('input[name="import-mode"]:checked').val();
    performImport(prompts, order, mode);
    $('#sw-import-dialog').remove();
  });
}

function performImport(prompts, order, mode) {
  try {
    let importedCount = 0;

    if (mode === 'replace') {
      // Clear existing prompts
      storyWeaverPrompts.clear();
      storyWeaverPromptOrder = [];
    }

    // Helper: role mapping
    function mapRole(rawRole) {
      if (!rawRole) return 'user';
      const val = String(rawRole).toLowerCase();
      if (val.includes('system')) return 'system';
      if (val.includes('assistant')) return 'assistant';
      if (val === 'user' || val.includes('user')) return 'user';
      return 'user';
    }

    // Helper: normalize a single prompt object
    function normalizeImportedPrompt(raw, index) {
      const normalized = {};
      // identifier
      normalized.identifier =
        (typeof raw.identifier === 'string' && raw.identifier.trim()) ||
        (typeof raw.id === 'string' && raw.id.trim()) ||
        `imported_${Date.now()}_${index}`;
      // name
      normalized.name =
        (typeof raw.name === 'string' && raw.name.trim()) ||
        (typeof raw.title === 'string' && raw.title.trim()) ||
        (typeof raw.label === 'string' && raw.label.trim()) ||
        `导入的提示词 ${index + 1}`;
      // content
      const content =
        (typeof raw.content === 'string' && raw.content) ||
        (typeof raw.text === 'string' && raw.text) ||
        (typeof raw.prompt === 'string' && raw.prompt) ||
        '';
      normalized.content = String(content);
      // role
      normalized.role = mapRole(raw.role || raw.type || (raw.system_prompt ? 'system' : 'user'));
      // enabled
      if (typeof raw.enabled === 'boolean') normalized.enabled = raw.enabled;
      else if (typeof raw.disabled === 'boolean') normalized.enabled = !raw.disabled;
      else if (typeof raw.active === 'boolean') normalized.enabled = raw.active;
      else normalized.enabled = true;
      // system_prompt
      normalized.system_prompt = !!(raw.system_prompt || normalized.role === 'system');
      // injection_order
      const orderCandidates = [raw.injection_order, raw.order, raw.position, raw.index];
      let ord = orderCandidates.find(v => typeof v === 'number' && Number.isFinite(v));
      if (typeof ord !== 'number') ord = storyWeaverPrompts.size + 1;
      normalized.injection_order = ord;
      // injection_depth
      const depthCandidates = [raw.injection_depth, raw.depth];
      let dep = depthCandidates.find(v => typeof v === 'number' && Number.isFinite(v));
      if (typeof dep !== 'number') dep = 0;
      normalized.injection_depth = dep;
      // injection_position
      const posCandidates = [raw.injection_position, raw.insertion_position, raw.anchor_position];
      let pos = posCandidates.find(v => typeof v === 'number' && Number.isFinite(v));
      if (typeof pos !== 'number') pos = 0;
      normalized.injection_position = pos;
      return normalized;
    }

    // Normalize order info: must be objects {identifier, enabled}
    const orderItems = Array.isArray(order)
      ? order
          .map(item => {
            if (item && typeof item === 'object') {
              const ident = item.identifier || item.id;
              if (typeof ident === 'string') return { identifier: ident, enabled: item.enabled };
            }
            return null;
          })
          .filter(Boolean)
      : [];
    const orderEnabledMap = new Map(
      orderItems.map(o => [o.identifier, o.hasOwnProperty('enabled') ? o.enabled === true : undefined]),
    );
    const allowedIds = orderItems.map(o => o.identifier);

    // Import prompts strictly based on orderItems only
    const importedIds = [];
    // Build a map for quick lookup by identifier
    const byId = new Map();
    prompts.forEach((rawPrompt, index) => {
      const tmp = normalizeImportedPrompt(rawPrompt, index);
      byId.set(tmp.identifier, tmp);
    });

    orderItems.forEach((ord, index) => {
      const base = byId.get(ord.identifier);
      if (!base) return; // skip unknown id
      let promptData = { ...base };

      // Apply enabled state exactly from order
      if (orderEnabledMap.has(promptData.identifier)) {
        promptData.enabled = orderEnabledMap.get(promptData.identifier) === true;
      }
      // Apply strict ordering index as injection_order if missing
      if (typeof promptData.injection_order !== 'number') {
        promptData.injection_order = index + 1;
      }

      // In merge mode, overwrite existing entries by same identifier
      storyWeaverPrompts.set(promptData.identifier, promptData);
      storyWeaverPromptOrder.push(promptData.identifier);
      importedIds.push(promptData.identifier);
      importedCount++;
    });

    // Use provided order if available and in replace mode; otherwise sort by injection_order
    if (orderItems.length > 0) {
      const validOrder = orderItems.map(o => o.identifier).filter(id => storyWeaverPrompts.has(id));
      if (validOrder.length > 0) {
        storyWeaverPromptOrder = validOrder;
      }
    }

    // Save and refresh
    savePromptSettings();
    refreshPromptManager();

    showNotification(`成功导入 ${importedCount} 个提示词`, 'success');
    console.log(`[SW] Imported ${importedCount} prompts in ${mode} mode`);
  } catch (error) {
    console.error('[SW] Import execution failed:', error);
    showNotification('导入失败: ' + error.message, 'error');
  }
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function previewFinalPrompt() {
  try {
    // Build a sample context for preview
    const sampleSettings = {
      storyType: 'adventure',
      storyTheme: '一个年轻的探险家寻找失落的古代宝藏',
      chapterCount: 5,
      storyStyle: 'narrative',
      detailLevel: 'medium',
      specialRequirements: '包含神秘元素和友情主题',
      includeSummary: true,
      includeCharacters: true,
      includeThemes: false,
    };

    // Build final prompt using current settings
    const finalPrompt = buildPromptForPreview(sampleSettings);

    // Show preview dialog
    showPromptPreviewDialog(finalPrompt, sampleSettings);
  } catch (error) {
    console.error('[SW] Preview failed:', error);
    showNotification('预览失败: ' + error.message, 'error');
  }
}

function buildPromptForPreview(settings) {
  // Build context data first (reuse existing function)
  const contextData = buildStoryContextForNative(settings);
  const worldInfoText = (typeof buildWorldInfoText === 'function' && buildWorldInfoText()) || '';

  // Build final prompt from enabled prompts using prompt manager
  let finalPrompt = '';
  let promptSections = [];

  // Get enabled prompts in order
  const enabledPrompts = storyWeaverPromptOrder
    .map(identifier => storyWeaverPrompts.get(identifier))
    .filter(prompt => prompt && prompt.enabled !== false);

  // Process each prompt and collect them
  enabledPrompts.forEach((prompt, index) => {
    const safeContent = prompt && typeof prompt.content === 'string' ? prompt.content : '';
    const safeRole = prompt && prompt.role ? prompt.role : 'user';
    const safeOrder = prompt && typeof prompt.injection_order === 'number' ? prompt.injection_order : index + 1;
    let processedContent = safeContent;

    // Replace placeholders
    processedContent = processedContent.replace(/\{\{STORY_CONTEXT\}\}/g, contextData);
    if (worldInfoText) {
      processedContent = processedContent.replace(/\{\{WORLD_INFO\}\}/g, worldInfoText);
    }

    promptSections.push({
      name: prompt && prompt.name ? prompt.name : `未命名提示词 ${index + 1}`,
      role: safeRole,
      content: processedContent,
      order: safeOrder,
    });

    // Build final prompt
    if (safeRole === 'user') {
      finalPrompt += processedContent + '\n\n';
    } else if (safeRole === 'system') {
      finalPrompt = processedContent + '\n\n' + finalPrompt;
    } else if (safeRole === 'assistant') {
      finalPrompt += '[Assistant]: ' + processedContent + '\n\n';
    }
  });

  return {
    final: finalPrompt.trim(),
    sections: promptSections,
    context: contextData,
  };
}

function showPromptPreviewDialog(promptData, sampleSettings) {
  // Remove existing dialog
  $('#sw-preview-dialog').remove();

  const dialog = $(`
    <div id="sw-preview-dialog" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10006;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div id="sw-preview-dialog-window" class="sw-draggable-window" style="
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 95vw;
        max-height: 95vh;
        width: 1000px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      ">
        <div class="sw-preview-header" style="
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 15px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          flex-shrink: 0;
          cursor: move;
          user-select: none;
        ">
          <span>👁️ 最终提示词预览</span>
          <button id="sw-preview-close-btn" style="
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
          ">✕</button>
        </div>

        <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column;">
          <!-- Tabs -->
          <div style="border-bottom: 1px solid #ddd; display: flex; background: #f8f9fa;">
            <button class="preview-tab active" data-tab="final" style="
              padding: 12px 20px;
              border: none;
              background: white;
              cursor: pointer;
              border-bottom: 2px solid #667eea;
              font-weight: 600;
            ">最终提示词</button>
            <button class="preview-tab" data-tab="sections" style="
              padding: 12px 20px;
              border: none;
              background: transparent;
              cursor: pointer;
              border-bottom: 2px solid transparent;
            ">分段预览</button>
            <button class="preview-tab" data-tab="settings" style="
              padding: 12px 20px;
              border: none;
              background: transparent;
              cursor: pointer;
              border-bottom: 2px solid transparent;
            ">示例设置</button>
          </div>

          <!-- Tab Contents -->
          <div style="flex: 1; overflow: auto; padding: 20px;">
            <!-- Final Prompt Tab -->
            <div class="preview-content" data-content="final">
              <div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #333;">组装后的完整提示词：</h4>
                <div style="
                  background: #f8f9fa;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  padding: 15px;
                  font-family: 'Courier New', monospace;
                  font-size: 13px;
                  line-height: 1.5;
                  white-space: pre-wrap;
                  max-height: 400px;
                  overflow-y: auto;
                ">${promptData.final}</div>
              </div>
              <div style="display: flex; gap: 10px;">
                <button onclick="copyPreviewContent('${promptData.final.replace(/'/g, "\\'")}', 'final')" style="
                  background: #28a745;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 5px;
                  cursor: pointer;
                ">📋 复制完整提示词</button>
                <span style="color: #666; font-size: 12px; align-self: center;">
                  字符数: ${promptData.final.length} | 启用的提示词: ${promptData.sections.length}
                </span>
              </div>
            </div>

            <!-- Sections Tab -->
            <div class="preview-content" data-content="sections" style="display: none;">
              <h4 style="margin: 0 0 15px 0; color: #333;">提示词分段详情：</h4>
              ${promptData.sections
                .map(
                  (section, index) => `
                <div style="
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  margin-bottom: 15px;
                  overflow: hidden;
                ">
                  <div style="
                    background: #f8f9fa;
                    padding: 10px 15px;
                    border-bottom: 1px solid #ddd;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                  ">
                    <span style="font-weight: 600;">${section.name}</span>
                    <div style="display: flex; gap: 10px; font-size: 12px; color: #666;">
                      <span>角色: ${section.role}</span>
                      <span>顺序: ${section.order}</span>
                    </div>
                  </div>
                  <div style="
                    padding: 15px;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    line-height: 1.4;
                    white-space: pre-wrap;
                    max-height: 200px;
                    overflow-y: auto;
                  ">${section.content}</div>
                </div>
              `,
                )
                .join('')}
            </div>

            <!-- Settings Tab -->
            <div class="preview-content" data-content="settings" style="display: none;">
              <h4 style="margin: 0 0 15px 0; color: #333;">用于预览的示例设置：</h4>
              <div style="
                background: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.5;
              ">${JSON.stringify(sampleSettings, null, 2)}</div>
              <p style="margin-top: 10px; color: #666; font-size: 14px;">
                💡 这是用于预览的示例设置。实际使用时，提示词会根据你在主界面中的具体设置进行动态替换。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);

  $('body').append(dialog);

  // Tab switching
  $('.preview-tab').click(function () {
    const tab = $(this).data('tab');

    // Update tab styles
    $('.preview-tab').css({
      background: 'transparent',
      borderBottom: '2px solid transparent',
      fontWeight: 'normal',
    });
    $(this).css({
      background: 'white',
      borderBottom: '2px solid #667eea',
      fontWeight: '600',
    });

    // Show/hide content
    $('.preview-content').hide();
    $(`.preview-content[data-content="${tab}"]`).show();
  });

  // Close handler
  $('#sw-preview-close-btn').click(() => {
    $('#sw-preview-dialog').remove();
  });

  // Make preview window draggable
  makeElementDraggable('#sw-preview-dialog-window', '.sw-preview-header');
  const pvRect = $('#sw-preview-dialog-window')[0].getBoundingClientRect();
  $('#sw-preview-dialog-window').css({
    position: 'fixed',
    right: 'auto',
    left: pvRect.left + 'px',
    top: pvRect.top + 'px',
  });
}

// Global function for copying preview content
window.copyPreviewContent = function (content, type) {
  navigator.clipboard
    .writeText(content)
    .then(() => {
      showNotification('内容已复制到剪贴板', 'success');
    })
    .catch(() => {
      showNotification('复制失败', 'error');
    });
};

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
        <a href="#" id="sw-menu-worldbook" style="
          display: block;
          padding: 12px 16px;
          text-decoration: none;
          color: #333;
          border-bottom: 1px solid #eee;
          transition: background 0.2s;
        ">
          📚 世界书管理
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
  $('#sw-settings-btn').click(function (e) {
    e.preventDefault();
    e.stopPropagation();
    const dropdown = $('#sw-settings-dropdown');
    if (dropdown.is(':visible')) {
      dropdown.hide();
    } else {
      dropdown.show();
    }
  });

  // Menu item handlers
  $('#sw-menu-prompt-manager').click(function (e) {
    e.preventDefault();
    e.stopPropagation();
    $('#sw-settings-dropdown').hide();
    openPromptManager();
  });

  $('#sw-menu-worldbook').click(function (e) {
    e.preventDefault();
    e.stopPropagation();
    $('#sw-settings-dropdown').hide();
    openWorldbookManager();
  });

  $('#sw-menu-settings').click(function (e) {
    e.preventDefault();
    $('#sw-settings-dropdown').hide();
    alert('系统设置功能即将推出');
  });

  $('#sw-menu-about').click(function (e) {
    e.preventDefault();
    $('#sw-settings-dropdown').hide();
    showAboutDialog();
  });

  // Close dropdown when clicking outside
  $(document).click(function () {
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
        <a href="#" id="sw-menu-worldbook-th" style="
          display: block;
          padding: 12px 16px;
          text-decoration: none;
          color: #333;
          border-bottom: 1px solid #eee;
          transition: background 0.2s;
        ">
          📚 世界书管理
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
  $('#sw-settings-btn-th').click(function (e) {
    e.stopPropagation();
    const dropdown = $('#sw-settings-dropdown-th');
    if (dropdown.is(':visible')) {
      dropdown.hide();
    } else {
      dropdown.show();
    }
  });

  $('#sw-menu-prompt-manager-th').click(function (e) {
    e.preventDefault();
    $('#sw-settings-dropdown-th').hide();
    openPromptManagerTH();
  });

  $('#sw-menu-worldbook-th').click(function (e) {
    e.preventDefault();
    $('#sw-settings-dropdown-th').hide();
    openWorldbookManagerTH();
  });

  $('#sw-menu-settings-th').click(function (e) {
    e.preventDefault();
    $('#sw-settings-dropdown-th').hide();
    alert('系统设置功能即将推出');
  });

  $('#sw-menu-about-th').click(function (e) {
    e.preventDefault();
    $('#sw-settings-dropdown-th').hide();
    showAboutDialogTH();
  });

  $(document).click(function () {
    $('#sw-settings-dropdown-th').hide();
  });
}

function openWorldbookManager() {
  $('#sw-worldbook-panel').remove();
  const panel = $(`
    <div id="sw-worldbook-panel" class="sw-draggable-panel" style="
      position: fixed; top: 100px; right: 20px; width: 520px; max-height: 80vh;
      background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 10005; display: flex; flex-direction: column; overflow: hidden;">
      <div class="sw-panel-header" style="
        background: linear-gradient(135deg, #667eea, #764ba2); color: white;
        padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
        cursor: move; user-select: none;">
        <span>📚 世界书管理</span>
        <button id="sw-worldbook-close" class="sw-themed-close-btn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 6px; cursor: pointer;">✕</button>
      </div>
      <div class="sw-panel-body" style="padding: 12px; overflow: auto;">
        <div id="sw-worldbook-list" style="display: grid; grid-template-columns: 1fr; gap: 10px;"></div>
      </div>
    </div>
  `);
  $('body').append(panel);
  makeElementDraggable('#sw-worldbook-panel', '.sw-panel-header');
  $('#sw-worldbook-close').on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    $('#sw-worldbook-panel').remove();
  });
  renderWorldbookList('#sw-worldbook-list');
}

function openWorldbookManagerTH() {
  openWorldbookManager();
}

// Worldbook retrieval — single method via TavernHelper only
function getWorldbookEntriesFromTavernHelper() {
  try {
    if (typeof window.TavernHelper === 'undefined') return [];
    if (typeof window.TavernHelper.getCharWorldbookNames !== 'function') return [];

    const names = window.TavernHelper.getCharWorldbookNames('current') || [];
    if (!Array.isArray(names) || names.length === 0) return [];

    const collected = [];
    names.forEach(name => {
      if (!name) return;
      if (typeof window.TavernHelper.getLorebookEntries !== 'function') return;
      const entries = window.TavernHelper.getLorebookEntries(name) || [];
      if (!Array.isArray(entries) || entries.length === 0) return;

      entries.forEach(e => {
        const isEnabled = e && e.enabled !== false && e.disabled !== true;
        if (!isEnabled) return;
        const key = e && (e.key || (e.keys && e.keys[0]) || e.name || e.title || '');
        const content = e && (e.content || e.entry || e.description || e.text || '');
        if ((key || content) && typeof (content || '') === 'string') {
          collected.push({ key: key || '', content: content || '' });
        }
      });
    });

    return collected;
  } catch (err) {
    return [];
  }
}

function buildWorldInfoText() {
  const entries = getWorldbookEntriesFromTavernHelper();
  if (!entries.length) return '';
  return entries.map(e => (e.key ? `${e.key}: ${e.content}` : e.content)).join('\n\n');
}

function renderWorldbookList(containerSelector) {
  try {
    const list = $(containerSelector);
    list.empty();
    const entries = getWorldbookEntriesFromTavernHelper();
    if (!entries || entries.length === 0) {
      list.append('<div style="color:#666">未获取到世界书条目。</div>');
      return;
    }
    entries.forEach((entry, idx) => {
      const key = entry.key || '';
      const content = entry.content || '';
      const item = $(`
        <div style="border:1px solid #eee; border-radius:8px; overflow:hidden;">
          <div style="background:#f8f9fa; padding:8px 10px; font-weight:600; display:flex; justify-content:space-between; align-items:center;">
            <span>${$('<div/>').text(key).html()}</span>
            <span style="color:#999; font-size:12px;">#${idx + 1}</span>
          </div>
          <div style="padding:10px; font-family:'Courier New', monospace; white-space:pre-wrap; font-size:13px;">${$(
            '<div/>',
          )
            .text(content)
            .html()}</div>
        </div>
      `);
      list.append(item);
    });
  } catch (err) {
    $(containerSelector).append('<div style="color:#c00">世界书渲染失败。</div>');
  }
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

  // Initialize prompt manager events globally
  setupPromptManagerEvents();
  console.log('[SW] Global prompt manager events initialized');
});

console.log('[SW] ✅ Story Weaver Enhanced loaded successfully!');
console.log('[SW] Available functions:', Object.keys(window.StoryWeaver));

// === Worldbook responder installed at top window ===
(function installWorldbookResponder() {
  try {
    if (window.__SW_WB_TOP_RESPONDER__) return;
    window.__SW_WB_TOP_RESPONDER__ = true;
    window.addEventListener(
      'message',
      async ev => {
        const data = ev && ev.data;
        if (!data || data.type !== 'SW_REQUEST_WORLDINFO') return;
        const token = data.token;
        const reply = payload => {
          try {
            ev && ev.source && ev.source.postMessage({ type: 'SW_RESPONSE_WORLDINFO', token, ...payload }, '*');
          } catch (_) {}
        };
        try {
          console.log('[SW][WB][RESP] request received on top');
          const out = [];
          if (typeof getWorldInfoPrompt === 'function' && typeof getContext === 'function') {
            const ctx = getContext();
            const chat = Array.isArray(ctx && ctx.chat) ? ctx.chat : [];
            const formatted = chat
              .map(m => (typeof m === 'string' ? m : (m && (m.mes || m.content || m.message)) || JSON.stringify(m)))
              .filter(Boolean);
            const res = await getWorldInfoPrompt(formatted, 131072, true);
            if (res) {
              if (res.worldInfoString && String(res.worldInfoString).trim()) out.push(String(res.worldInfoString));
              if (res.worldInfoBefore && String(res.worldInfoBefore).trim()) out.push(String(res.worldInfoBefore));
              if (res.worldInfoAfter && String(res.worldInfoAfter).trim()) out.push(String(res.worldInfoAfter));
              if (Array.isArray(res.worldInfoDepth)) {
                res.worldInfoDepth.forEach(d => {
                  if (Array.isArray(d.entries)) {
                    const s = d.entries.join('\n\n').trim();
                    if (s) out.push(s);
                  }
                });
              }
              if (Array.isArray(res.worldInfoExamples)) {
                res.worldInfoExamples.forEach(e => {
                  const s = (e && (e.content || e.entry || e.text)) || '';
                  if (s && String(s).trim()) out.push(String(s));
                });
              }
            }
            console.log('[SW][WB][RESP] top APIs used, sections =', out.length);
          } else if (Array.isArray(window.world_info)) {
            window.world_info.forEach(w => {
              const s = (w && (w.content || w.entry || w.description)) || '';
              if (s && String(s).trim()) out.push(String(s));
            });
            console.log('[SW][WB][RESP] window.world_info used, sections =', out.length);
          } else {
            console.warn('[SW][WB][RESP] no APIs available on top');
          }
          reply({ sections: out });
        } catch (err) {
          console.error('[SW][WB][RESP] error:', err);
          reply({ error: String(err && err.message), sections: [] });
        }
      },
      false,
    );
    console.log('[SW][WB][RESP] top responder installed');
  } catch (e) {
    console.error('[SW][WB][RESP] install failed:', e);
  }
})();
