/**
 * Story Weaver Enhanced - Complete TavernHelper Version
 * GitHub Pages Compatible - Full Feature Implementation
 * URL: https://dghiffjd7.github.io/StoryDirector/tavern-helper-version/story-weaver-full.js
 */

console.log('[SW] 📖 Loading Story Weaver Enhanced v2.0...');

// ========================= ERROR HANDLING SYSTEM =========================

/**
 * 统一的错误处理系统
 */
const StoryWeaverErrorHandler = {
  /**
   * 处理错误并返回用户友好的信息
   * @param {Error} error - 原始错误对象
   * @param {string} context - 错误发生的上下文
   * @param {Object} options - 处理选项
   * @returns {Object} 包含userMessage和technicalDetails的对象
   */
  handleError(error, context, options = {}) {
    const { allowRetry = false, retryAction = null } = options;

    console.error(`[SW] Error in ${context}:`, error);

    let userMessage = '发生未知错误';
    let technicalDetails = error.message || '无技术详情';

    // 根据错误类型提供不同的用户友好信息
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      userMessage = '网络连接失败，请检查网络设置';
    } else if (error.message.includes('generate')) {
      userMessage = '故事生成失败，请确保SillyTavern已连接AI服务';
    } else if (error.message.includes('permission')) {
      userMessage = '权限不足，请检查浏览器设置';
    } else if (error.message.includes('JSON')) {
      userMessage = '数据格式错误，请检查输入';
    } else if (error.message.includes('timeout')) {
      userMessage = '操作超时，请稍后重试';
    }

    const errorInfo = {
      userMessage,
      technicalDetails,
      context,
      timestamp: new Date().toISOString(),
      allowRetry,
      retryAction
    };

    return errorInfo;
  },

  /**
   * 显示错误通知
   * @param {string} message - 要显示的消息
   * @param {string} type - 通知类型 (error, warning, success, info)
   * @param {number} duration - 显示时长（毫秒）
   */
  showNotification(message, type = 'error', duration = 5000) {
    // 优先使用TavernHelper的通知系统
    if (typeof TavernHelper !== 'undefined' && TavernHelper.showNotification) {
      TavernHelper.showNotification(message, {
        type: type,
        timeout: duration
      });
      return;
    }

    // 降级到内置通知系统
    this._showBuiltinNotification(message, type, duration);
  },

  /**
   * 内置通知系统
   * @private
   */
  _showBuiltinNotification(message, type, duration) {
    const notification = document.createElement('div');
    notification.className = `sw-error-notification sw-notification-${type}`;
    notification.style.cssText =
      'position: fixed; top: 20px; right: 20px; z-index: 10001; ' +
      'padding: 12px 16px; border-radius: 6px; color: white; ' +
      'font-family: -apple-system, BlinkMacSystemFont, sans-serif; ' +
      'font-size: 14px; max-width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); ' +
      'animation: slideInRight 0.3s ease-out;';

    // 根据类型设置背景色
    const colors = {
      error: '#dc3545',
      warning: '#ffc107',
      success: '#28a745',
      info: '#17a2b8'
    };
    notification.style.backgroundColor = colors[type] || colors.error;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span>${this._getNotificationIcon(type)}</span>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none; border: none; color: white; cursor: pointer;
          font-size: 16px; padding: 0; margin-left: 8px;">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    // 自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);

    // 添加动画样式
    if (!document.getElementById('sw-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'sw-notification-styles';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  },

  /**
   * 获取通知图标
   * @private
   */
  _getNotificationIcon(type) {
    const icons = {
      error: '❌',
      warning: '⚠️',
      success: '✅',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }
};

// 为向后兼容，创建全局别名
const ErrorHandler = StoryWeaverErrorHandler;

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
  
  // Try TavernHelper first (if in TavernHelper iframe)
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
  
  // Initialize preset and import functionality
  setTimeout(() => {
    loadPresetList();
    initializeImportHandler();
  }, 100);

  // Close button handler
  $('#sw-close-btn').click(() => {
    $('#sw-popup-overlay').fadeOut(300, function() {
      $(this).remove();
    });
  });
  
  // Click outside to close
  $('#sw-popup-overlay').click((e) => {
    if (e.target.id === 'sw-popup-overlay') {
      $('#sw-popup-overlay').fadeOut(300, function() {
        $(this).remove();
      });
    }
  });
  
  console.log('[SW] ✅ Native popup opened');
}

function buildSimpleInterface(settings) {
  return `
    <style>
      .sw-interface {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 100%;
        background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
        min-height: 100vh;
        overflow-y: auto;
      }

      .sw-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        margin: -20px -20px 20px -20px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.15);
      }

      .sw-header h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .sw-section {
        background: white;
        border: 1px solid #e9ecef;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .sw-section:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }

      .sw-section-header {
        color: #495057;
        margin: 0 0 15px 0;
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 10px;
        border-bottom: 2px solid #f8f9fa;
      }

      .sw-form-group {
        margin-bottom: 16px;
      }

      .sw-form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }

      .sw-form-row.triple {
        grid-template-columns: 1fr 1fr 1fr;
      }

      .sw-label {
        display: block;
        margin-bottom: 6px;
        font-weight: 600;
        font-size: 13px;
        color: #495057;
      }

      .sw-input, .sw-select, .sw-textarea {
        width: 100%;
        padding: 10px 12px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 14px;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        background: #ffffff;
        box-sizing: border-box;
      }

      .sw-input:focus, .sw-select:focus, .sw-textarea:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .sw-textarea {
        resize: vertical;
        min-height: 80px;
      }

      .sw-btn {
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s ease;
        text-decoration: none;
        display: inline-block;
        text-align: center;
        line-height: 1.4;
      }

      .sw-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .sw-btn-primary { background: #667eea; color: white; }
      .sw-btn-success { background: #28a745; color: white; }
      .sw-btn-info { background: #17a2b8; color: white; }
      .sw-btn-warning { background: #ffc107; color: #212529; }
      .sw-btn-danger { background: #dc3545; color: white; }
      .sw-btn-purple { background: #6f42c1; color: white; }
      .sw-btn-orange { background: #fd7e14; color: white; }

      .sw-btn-group {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .sw-btn-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
      }

      .sw-generate-btn {
        width: 100%;
        padding: 16px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 20px;
        transition: all 0.3s ease;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      }

      .sw-generate-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      }

      .sw-output-section {
        background: #f8f9fa;
        border: 2px solid #e9ecef;
        border-radius: 12px;
        padding: 20px;
        min-height: 150px;
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
        font-size: 13px;
        white-space: pre-wrap;
        line-height: 1.6;
      }

      .sw-checkbox-group {
        display: flex;
        gap: 24px;
        flex-wrap: wrap;
      }

      .sw-checkbox-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
      }

      .sw-status-text {
        font-size: 11px;
        color: #6c757d;
        margin-top: 6px;
        font-style: italic;
      }

      .sw-context-controls {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }

      .sw-help-text {
        font-size: 11px;
        color: #6c757d;
        margin-top: 4px;
        line-height: 1.4;
      }

      @media (max-width: 768px) {
        .sw-form-row {
          grid-template-columns: 1fr;
        }
        .sw-form-row.triple {
          grid-template-columns: 1fr;
        }
        .sw-checkbox-group {
          flex-direction: column;
          gap: 12px;
        }
        .sw-btn-group {
          justify-content: center;
        }
      }
    </style>

    <div class="sw-interface">
      <div class="sw-header">
        <h2>📖 Story Weaver Enhanced</h2>
        <div style="font-size: 14px; opacity: 0.9; margin-top: 8px;">智能故事大纲生成器 v2.0</div>
      </div>
      
      <!-- 上下文设定区域 -->
      <div class="sw-section">
        <h3 class="sw-section-header">📖 剧情上下文设定</h3>

        <div class="sw-form-row">
          <div class="sw-form-group">
            <label class="sw-label">对话历史长度：</label>
            <input type="number" id="sw-context-length" class="sw-input" value="${settings.contextLength || 10}" min="0" max="50">
            <div class="sw-help-text">设置为0则不读取对话历史</div>
          </div>
          <div class="sw-form-group">
            <label class="sw-label">数据操作：</label>
            <div class="sw-btn-group">
              <button id="sw-refresh-data" onclick="refreshContextData()" class="sw-btn sw-btn-success" title="重新读取世界书和聊天历史数据">🔄 刷新数据</button>
              <button id="sw-preview-data" onclick="previewContextData()" class="sw-btn sw-btn-info" title="查看当前可访问的上下文数据">👁️ 预览数据</button>
            </div>
            <div id="sw-context-status" class="sw-status-text">将根据设定自动读取最近的对话内容</div>
          </div>
        </div>
      </div>
      
      <!-- 基本设定区域 -->
      <div class="sw-section">
        <h3 class="sw-section-header">🎯 基本设定</h3>

        <div class="sw-form-group">
          <label class="sw-label">故事主题 / 核心冲突：</label>
          <textarea id="sw-theme" class="sw-textarea" placeholder="例如：主角需要拯救被诅咒的王国，同时面对内心的恐惧与过去的阴霾...">${settings.storyTheme || ''}</textarea>
        </div>

        <div class="sw-form-row">
          <div class="sw-form-group">
            <label class="sw-label">故事类型：</label>
            <select id="sw-type" class="sw-select">
${Object.entries(STORY_TYPES).map(([k,v]) =>
              `<option value="${k}" ${k === settings.storyType ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </div>
          <div class="sw-form-group">
            <label class="sw-label">叙述风格：</label>
            <select id="sw-style" class="sw-select">
${Object.entries(STORY_STYLES).map(([k,v]) =>
              `<option value="${k}" ${k === settings.storyStyle ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="sw-form-row">
          <div class="sw-form-group">
            <label class="sw-label">章节数量：</label>
            <input type="number" id="sw-chapters" class="sw-input" value="${settings.chapterCount || 5}" min="3" max="20">
          </div>
          <div class="sw-form-group">
            <label class="sw-label">详细程度：</label>
            <select id="sw-detail" class="sw-select">
${Object.entries(DETAIL_LEVELS).map(([k,v]) =>
              `<option value="${k}" ${k === settings.detailLevel ? 'selected' : ''}>${v}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="sw-form-group">
          <label class="sw-label">特殊要求：</label>
          <textarea id="sw-requirements" class="sw-textarea" placeholder="任何特殊的剧情要求或风格偏好..." style="min-height: 60px;">${settings.specialRequirements || ''}</textarea>
        </div>

        <div class="sw-form-group">
          <label class="sw-label">包含选项：</label>
          <div class="sw-checkbox-group">
            <label class="sw-checkbox-item">
              <input type="checkbox" id="sw-summary" ${settings.includeSummary ? 'checked' : ''}>
              故事摘要
            </label>
            <label class="sw-checkbox-item">
              <input type="checkbox" id="sw-characters" ${settings.includeCharacters ? 'checked' : ''}>
              角色分析
            </label>
            <label class="sw-checkbox-item">
              <input type="checkbox" id="sw-themes" ${settings.includeThemes ? 'checked' : ''}>
              主题探讨
            </label>
          </div>
        </div>
      </div>
      
      <!-- 预设管理区域 -->
      <div class="sw-section">
        <h3 class="sw-section-header">💾 预设管理</h3>

        <div class="sw-form-group">
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 10px; align-items: center;">
            <select id="sw-preset-select" class="sw-select">
              <option value="">选择预设...</option>
            </select>
            <button onclick="loadSelectedPreset()" class="sw-btn sw-btn-primary">📁 加载</button>
            <button onclick="showSavePresetDialog()" class="sw-btn sw-btn-success">💾 保存</button>
            <button onclick="showPresetManager()" class="sw-btn sw-btn-purple">⚙️ 管理</button>
          </div>
          <div class="sw-help-text">
            预设包含所有故事设定、选项配置等完整信息
          </div>
        </div>
      </div>
      
      <!-- 导入导出区域 -->
      <div class="sw-section">
        <h3 class="sw-section-header">📁 导入导出管理</h3>

        <div class="sw-form-row" style="margin-bottom: 16px;">
          <div class="sw-form-group" style="text-align: center;">
            <input type="file" id="sw-import-file" accept=".json,.txt,.md" style="display: none;">
            <button onclick="document.getElementById('sw-import-file').click()" class="sw-btn sw-btn-primary" style="width: 100%; padding: 12px;">📥 导入文件</button>
            <div class="sw-help-text">支持 JSON、TXT、MD 格式</div>
          </div>
          <div class="sw-form-group" style="text-align: center;">
            <button onclick="showImportExportManager()" class="sw-btn sw-btn-purple" style="width: 100%; padding: 12px;">🔧 管理中心</button>
            <div class="sw-help-text">批量导入导出操作</div>
          </div>
        </div>

        <div class="sw-btn-grid">
          <button onclick="exportCurrentSettings()" class="sw-btn sw-btn-success">💾 导出设置</button>
          <button onclick="exportStoryOutline('txt')" class="sw-btn sw-btn-info">📄 导出TXT</button>
          <button onclick="exportStoryOutline('md')" class="sw-btn sw-btn-purple">📝 导出MD</button>
          <button onclick="exportStoryOutline('json')" class="sw-btn sw-btn-orange">🔧 导出JSON</button>
        </div>
      </div>

      <button id="sw-generate-btn" onclick="handleNativeGenerate()" class="sw-generate-btn">
        🎯 生成故事大纲
      </button>
      
      <!-- 输出区域 -->
      <div id="sw-output-section" class="sw-output-section" style="display: none;">
        <div id="sw-output-content"></div>
      </div>

      <div id="sw-output-controls" style="display: none; margin-top: 16px;">
        <div class="sw-btn-group" style="justify-content: center; flex-wrap: wrap;">
          <button onclick="copyNativeResult()" class="sw-btn sw-btn-success">📋 复制</button>
          <button onclick="saveNativeResult()" class="sw-btn sw-btn-info">💾 保存</button>
          <button onclick="showExportOptions()" class="sw-btn sw-btn-purple">📤 导出</button>
          <button onclick="generateChapterDetails()" class="sw-btn sw-btn-orange">📝 章节细纲</button>
          <button onclick="showHelpModal()" class="sw-btn sw-btn-primary">❓ 帮助</button>
        </div>
      </div>
      
      <!-- 章节细纲区域 -->
      <div id="sw-chapter-details-section" class="sw-section" style="display: none; margin-top: 20px;">
        <h3 class="sw-section-header">📝 章节细纲生成</h3>

        <div class="sw-form-group">
          <label class="sw-label">选择章节:</label>
          <select id="sw-chapter-select" class="sw-select" style="margin-bottom: 12px;">
            <option value="">请先生成故事大纲...</option>
          </select>
          <button onclick="generateSelectedChapterDetail()" class="sw-btn sw-btn-orange" style="width: 100%; padding: 12px; font-weight: 600;">
            生成选中章节的细纲
          </button>
        </div>

        <div id="sw-chapter-detail-output" class="sw-output-section" style="display: none; min-height: 120px;">
        </div>

        <div id="sw-chapter-detail-controls" style="display: none; margin-top: 12px;">
          <div class="sw-btn-group" style="justify-content: center;">
            <button onclick="copyChapterDetail()" class="sw-btn sw-btn-success">📋 复制细纲</button>
            <button onclick="saveChapterDetail()" class="sw-btn sw-btn-info">💾 保存细纲</button>
          </div>
        </div>
      </div>
    </div>
    
    <script>
      let nativeResult = '';
      let currentChapters = [];
      let selectedChapterDetail = '';
      
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
            contextLength: document.getElementById('sw-context-length').value || 10,
            includeSummary: document.getElementById('sw-summary').checked,
            includeCharacters: document.getElementById('sw-characters').checked,
            includeThemes: document.getElementById('sw-themes').checked
          };
          
          // Use enhanced prompt building
          const prompt = await buildEnhancedPrompt(settings);
          console.log('[SW] Generating story with enhanced prompt');
          console.log('[SW] Prompt length:', prompt.length);
          
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
            
            // Parse chapters from result
            parseChaptersFromResult(result);
            
            // Update statistics
            const endTime = Date.now();
            updateStats(result, endTime - startTime);
            
            console.log('[SW] ✅ Generation successful');
          } else {
            throw new Error('生成结果为空');
          }
          
        } catch (error) {
          const errorInfo = ErrorHandler.handleError(error, 'native story generation', {
            allowRetry: true,
            retryAction: () => handleNativeGenerate()
          });
          
          outputContent.textContent = '生成失败: ' + errorInfo.userMessage + '\n\n提示：请确保您在SillyTavern的角色聊天页面，并且已连接到AI服务。';
          outputSection.style.display = 'block';
          
          // Show notification
          ErrorHandler.showNotification(errorInfo.userMessage, 'error');
        } finally {
          btn.textContent = '🎯 生成故事大纲';
          btn.disabled = false;
        }
      }
      
      function buildNativePrompt(settings) {
        let prompt = '请为我生成一个' + (STORY_TYPES[settings.storyType] || settings.storyType) + '类型的故事大纲。';
        
        if (settings.storyTheme) {
          prompt += '\n\n故事主题: ' + settings.storyTheme;
        }

        prompt += '\n\n要求:' +
          '\n1. 包含' + settings.chapterCount + '个章节' +
          '\n2. 每章有明确的情节发展和冲突' +
          '\n3. 结构完整，逻辑清晰' +
          '\n4. 符合' + (STORY_STYLES[settings.storyStyle] || settings.storyStyle) + '的叙述风格' +
          '\n5. 详细程度: ' + (DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel);

        if (settings.specialRequirements) {
          prompt += '\n6. 特殊要求: ' + settings.specialRequirements;
        }

        if (settings.includeSummary) {
          prompt += '\n\n请在大纲前提供故事摘要。';
        }

        if (settings.includeCharacters) {
          prompt += '\n\n请包含主要角色的性格特点和发展弧线。';
        }

        if (settings.includeThemes) {
          prompt += '\n\n请说明故事要探讨的核心主题。';
        }

        prompt += '\n\n请生成结构完整、逻辑清晰的故事大纲。';
        
        return prompt;
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
          a.download = 'story-outline-' + new Date().getTime() + '.txt';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert('文件已保存！');
        }
      }
      
      // Context data functions
      async function refreshContextData() {
        const statusEl = document.getElementById('sw-context-status');
        statusEl.textContent = '正在刷新数据...';
        statusEl.style.color = '#007bff';
        
        try {
          // Force refresh data
          console.log('[SW] Refreshing context data...');
          
          // Get fresh data
          const worldInfo = await getWorldInfoData();
          const characterData = getCharacterData();
          const chatHistory = getChatHistory(10);
          
          // Update status
          const worldCount = worldInfo.includes('暂无') ? 0 : worldInfo.split('**').length - 1;
          const charName = characterData.name || '未知';
          const chatCount = chatHistory.length;
          
          statusEl.innerHTML = '✅ 数据已刷新: ' + worldCount + '个世界书条目, 角色: ' + charName + ', ' + chatCount + '条对话';
          statusEl.style.color = '#28a745';
          
          console.log('[SW] Context data refreshed successfully');
        } catch (error) {
          statusEl.textContent = '❌ 数据刷新失败';
          statusEl.style.color = '#dc3545';
          console.error('[SW] Context refresh failed:', error);
        }
      }
      
      async function previewContextData() {
        try {
          const contextLength = parseInt(document.getElementById('sw-context-length').value) || 10;
          
          // Get all context data
          const worldInfo = await getWorldInfoData();
          const characterData = getCharacterData();
          const chatHistory = getChatHistory(contextLength);
          const systemPrompt = resolveSystemPrompt();
          const memorySummary = resolveMemorySummary();
          const authorsNote = resolveAuthorsNote();
          
          // Build preview content
          const previewContent = '=== 上下文数据预览 ===' +
            '\n\n📖 世界书信息:\n' + worldInfo +
            '\n\n👤 角色信息:' +
            '\n姓名: ' + characterData.name +
            '\n性格: ' + (characterData.personality || '无设定') +
            '\n描述: ' + (characterData.description || '无描述') +
            '\n情境: ' + (characterData.scenario || '无情境') +
            '\n\n💭 系统提示词:\n' + (systemPrompt || '无系统提示词') +
            '\n\n📝 记忆摘要:\n' + (memorySummary || '无记忆摘要') +
            '\n\n✍️ 作者注释:\n' + (authorsNote || '无作者注释') +
            '\n\n💬 对话历史 (最近' + contextLength + '条):\n' + buildChatHistoryText(chatHistory, contextLength);

          // Show in new window or alert
          const newWindow = window.open('', '_blank', 'width=800,height=600');
          if (newWindow) {
            newWindow.document.write(
              '<html>' +
                '<head>' +
                  '<title>Story Weaver - 上下文数据预览</title>' +
                  '<style>' +
                    'body { font-family: monospace; padding: 20px; line-height: 1.6; }' +
                    'pre { white-space: pre-wrap; word-wrap: break-word; }' +
                  '</style>' +
                '</head>' +
                '<body>' +
                  '<h2>📖 Story Weaver - 上下文数据预览</h2>' +
                  '<pre>' + previewContent + '</pre>' +
                '</body>' +
              '</html>'
            );
            newWindow.document.close();
          } else {
            alert(previewContent);
          }
          
          console.log('[SW] Context data preview shown');
        } catch (error) {
          alert('预览失败: ' + error.message);
          console.error('[SW] Context preview failed:', error);
        }
      }
      
      // Preset Management Functions
      function loadPresetList() {
        const presetSelect = document.getElementById('sw-preset-select');
        const presets = PresetManager.getAllPresets();
        
        // Clear existing options except first
        presetSelect.innerHTML = '<option value="">选择预设...</option>';
        
        // Add preset options
        Object.keys(presets).forEach(name => {
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          presetSelect.appendChild(option);
        });
        
        console.log('[SW] Preset list loaded');
      }
      
      function loadSelectedPreset() {
        const presetSelect = document.getElementById('sw-preset-select');
        const selectedName = presetSelect.value;
        
        if (!selectedName) {
          alert('请先选择一个预设');
          return;
        }
        
        const preset = PresetManager.loadPreset(selectedName);
        if (preset) {
          // Load preset data into form
          document.getElementById('sw-theme').value = preset.storyTheme || '';
          document.getElementById('sw-type').value = preset.storyType || 'adventure';
          document.getElementById('sw-style').value = preset.storyStyle || 'narrative';
          document.getElementById('sw-chapters').value = preset.chapterCount || 5;
          document.getElementById('sw-detail').value = preset.detailLevel || 'medium';
          document.getElementById('sw-requirements').value = preset.specialRequirements || '';
          document.getElementById('sw-context-length').value = preset.contextLength || 10;
          document.getElementById('sw-summary').checked = preset.includeSummary !== false;
          document.getElementById('sw-characters').checked = preset.includeCharacters !== false;
          document.getElementById('sw-themes').checked = preset.includeThemes === true;
          
          alert('预设 "' + selectedName + '" 已加载！');
          console.log('[SW] Preset "' + selectedName + '" applied to form');
        } else {
          alert('加载预设失败');
        }
      }
      
      function getCurrentSettings() {
        return {
          storyTheme: document.getElementById('sw-theme').value,
          storyType: document.getElementById('sw-type').value,
          storyStyle: document.getElementById('sw-style').value,
          chapterCount: document.getElementById('sw-chapters').value,
          detailLevel: document.getElementById('sw-detail').value,
          specialRequirements: document.getElementById('sw-requirements').value,
          contextLength: document.getElementById('sw-context-length').value || 10,
          includeSummary: document.getElementById('sw-summary').checked,
          includeCharacters: document.getElementById('sw-characters').checked,
          includeThemes: document.getElementById('sw-themes').checked
        };
      }
      
      function showSavePresetDialog() {
        const name = prompt('请输入预设名称：', '我的预设_' + new Date().getTime());
        if (name && name.trim()) {
          const settings = getCurrentSettings();
          const success = PresetManager.savePreset(name.trim(), settings);
          
          if (success) {
            alert('预设 "' + name.trim() + '" 保存成功！');
            loadPresetList(); // Refresh preset list
            
            // Select the newly saved preset
            const presetSelect = document.getElementById('sw-preset-select');
            presetSelect.value = name.trim();
          } else {
            alert('保存预设失败');
          }
        }
      }
      
      function showPresetManager() {
        const presets = PresetManager.getAllPresets();
        const presetList = Object.keys(presets);
        
        if (presetList.length === 0) {
          alert('暂无已保存的预设');
          return;
        }
        
        let managerContent =
          '<div style="padding: 20px; font-family: -apple-system, sans-serif;">' +
            '<h2>💾 预设管理器</h2>' +
            '<div style="margin-bottom: 20px;">' +
              '<input type="file" id="preset-import-input" accept=".json" style="display: none;">' +
              '<button onclick="document.getElementById(\'preset-import-input\').click()" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 5px; margin-right: 10px;">📥 导入预设</button>' +
              '<button onclick="exportAllPresets()" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 5px;">📤 导出全部</button>' +
            '</div>' +
            '<table style="width: 100%; border-collapse: collapse;">' +
              '<thead>' +
                '<tr style="background: #f8f9fa;">' +
                  '<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">预设名称</th>' +
                  '<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">故事类型</th>' +
                  '<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">保存时间</th>' +
                  '<th style="padding: 10px; border: 1px solid #ddd; text-align: center;">操作</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>';
        
        presetList.forEach(name => {
          const preset = presets[name];
          const saveDate = new Date(preset.savedAt).toLocaleString();
          const storyType = STORY_TYPES[preset.storyType] || preset.storyType;
          
          managerContent +=
            '<tr>' +
              '<td style="padding: 10px; border: 1px solid #ddd;">' + name + '</td>' +
              '<td style="padding: 10px; border: 1px solid #ddd;">' + storyType + '</td>' +
              '<td style="padding: 10px; border: 1px solid #ddd;">' + saveDate + '</td>' +
              '<td style="padding: 10px; border: 1px solid #ddd; text-align: center;">' +
                '<button onclick="exportSinglePreset(\'' + name + '\')" style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 3px; margin-right: 5px;">导出</button>' +
                '<button onclick="deleteSinglePreset(\'' + name + '\')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px;">删除</button>' +
              '</td>' +
            '</tr>';
        });
        
        managerContent +=
              '</tbody>' +
            '</table>' +
          '</div>' +
          '<script>' +
            'document.getElementById("preset-import-input").addEventListener("change", function(e) {' +
              'const file = e.target.files[0];' +
              'if (file) {' +
                'const reader = new FileReader();' +
                'reader.onload = function(e) {' +
                  'const result = PresetManager.importPreset(e.target.result);' +
                  'if (result.success) {' +
                    'alert("预设导入成功：" + result.name);' +
                    'window.location.reload();' +
                  '} else {' +
                    'alert("导入失败：" + result.error);' +
                  '}' +
                '};' +
                'reader.readAsText(file);' +
              '}' +
            '});' +
            '' +
            'function exportSinglePreset(name) {' +
              'PresetManager.exportPreset(name);' +
            '}' +
            '' +
            'function deleteSinglePreset(name) {' +
              'if (confirm("确认删除预设 \\"" + name + "\\" 吗？")) {' +
                'if (PresetManager.deletePreset(name)) {' +
                  'alert("删除成功");' +
                  'window.location.reload();' +
                '} else {' +
                  'alert("删除失败");' +
                '}' +
              '}' +
            '}' +
            '' +
            'function exportAllPresets() {' +
              'const allPresets = PresetManager.getAllPresets();' +
              'const exportData = {' +
                'presets: allPresets,' +
                'exportedAt: Date.now(),' +
                'version: "2.0",' +
                'type: "StoryWeaverPresetsBundle"' +
              '};' +
              '' +
              'const blob = new Blob([JSON.stringify(exportData, null, 2)], {' +
                'type: "application/json"' +
              '});' +
              'const url = URL.createObjectURL(blob);' +
              '' +
              'const a = document.createElement("a");' +
              'a.href = url;' +
              'a.download = "story-weaver-presets-all-" + Date.now() + ".json";' +
              'document.body.appendChild(a);' +
              'a.click();' +
              'document.body.removeChild(a);' +
              'URL.revokeObjectURL(url);' +
            '}' +
          '</script>';
        
        const newWindow = window.open('', '_blank', 'width=900,height=600');
        if (newWindow) {
          newWindow.document.write(managerContent);
          newWindow.document.close();
        } else {
          alert('无法打开预设管理器窗口，请允许弹窗');
        }
      }
      
      // Initialize preset list on load
      setTimeout(() => {
        loadPresetList();
      }, 100);
    </script>
  `;
}


// ========================= DATA INTEGRATION SYSTEM =========================

/**
 * Get SillyTavern World Info Data with multiple fallback methods
 */
async function getWorldInfoData(chatHistory = '') {
  try {
    console.log('[SW] Starting world info access...');
    
    // Method 1: TavernHelper API (if available)
    if (typeof TavernHelper !== 'undefined' && TavernHelper.getWorldbookEntries) {
      try {
        const entries = TavernHelper.getWorldbookEntries();
        if (entries && entries.length > 0) {
          console.log('[SW] Found ' + entries.length + ' worldbook entries via TavernHelper');
          return formatWorldbookEntries(entries);
        }
      } catch (error) {
        console.log('[SW] TavernHelper worldbook access failed:', error);
      }
    }
    
    // Method 2: Parent Window Context API
    if (window.parent && window.parent !== window) {
      try {
        const parentContext = window.parent.getContext && window.parent.getContext();
        if (parentContext && parentContext.loadWorldInfo) {
          console.log('[SW] Using parent context loadWorldInfo...');
          
          const selectedWorlds = window.parent.selected_world_info || [];
          const allWorldData = [];
          
          for (const worldName of selectedWorlds) {
            try {
              const worldData = await parentContext.loadWorldInfo(worldName);
              if (worldData && worldData.entries) {
                const entries = Object.values(worldData.entries);
                allWorldData.push(...entries.map(entry => ({ ...entry, world: worldName })));
                console.log('[SW] Loaded ' + entries.length + ' entries from world: ' + worldName);
              }
            } catch (worldError) {
              console.log(`[SW] Failed to load world ${worldName}:`, worldError);
            }
          }
          
          if (allWorldData.length > 0) {
            return formatWorldInfoEntries(allWorldData);
          }
        }
      } catch (contextError) {
        console.log('[SW] Parent context access failed:', contextError);
      }
    }
    
    // Method 3: Direct Global Variables Access
    try {
      if (window.world_info && window.world_info.globalSelect) {
        const worldEntries = [];
        window.world_info.globalSelect.forEach(entry => {
          if (!entry.disable && entry.content?.trim()) {
            worldEntries.push(entry);
          }
        });
        
        if (worldEntries.length > 0) {
          console.log('[SW] Found ' + worldEntries.length + ' world info entries via global access');
          return formatWorldInfoEntries(worldEntries);
        }
      }
    } catch (globalError) {
      console.log('[SW] Global world info access failed:', globalError);
    }
    
    // Method 4: Main Window Direct Access
    try {
      if (window.top && window.top.world_info) {
        const worldEntries = [];
        if (window.top.world_info.globalSelect) {
          window.top.world_info.globalSelect.forEach(entry => {
            if (!entry.disable && entry.content?.trim()) {
              worldEntries.push(entry);
            }
          });
        }
        
        if (worldEntries.length > 0) {
          console.log('[SW] Found ' + worldEntries.length + ' world info entries via top window');
          return formatWorldInfoEntries(worldEntries);
        }
      }
    } catch (topError) {
      console.log('[SW] Top window world info access failed:', topError);
    }
    
    console.log('[SW] No world info data found through any method');
    return '暂无世界观设定';
    
  } catch (error) {
    console.error('[SW] World info access completely failed:', error);
    return '世界观数据访问失败';
  }
}

/**
 * Format worldbook entries into readable text
 */
function formatWorldInfoEntries(entries) {
  if (!entries || entries.length === 0) return '暂无世界观条目';
  
  return entries
    .filter(entry => !entry.disable && entry.content?.trim())
    .slice(0, 20) // Limit to 20 entries to avoid prompt bloat
    .map(entry => {
      const title = entry.comment || 
                   (Array.isArray(entry.key) ? entry.key[0] : entry.key) || 
                   (Array.isArray(entry.keys) ? entry.keys[0] : entry.keys) || 
                   'Entry';
      const world = entry.world ? ` (${entry.world})` : '';
      return '**' + title + world + '**\n' + entry.content;
    })
    .join('\n\n');
}

/**
 * Get SillyTavern Character Data
 */
function getCharacterData() {
  try {
    console.log('[SW] Getting character data...');
    
    // Method 1: TavernHelper API
    if (typeof TavernHelper !== 'undefined' && TavernHelper.getCharacterData) {
      try {
        const charData = TavernHelper.getCharacterData();
        if (charData) {
          console.log('[SW] Got character data via TavernHelper');
          return charData;
        }
      } catch (error) {
        console.log('[SW] TavernHelper character access failed:', error);
      }
    }
    
    // Method 2: Direct global access
    try {
      const idx = window.this_chid || window.parent?.this_chid || window.top?.this_chid;
      const characters = window.characters || window.parent?.characters || window.top?.characters;
      
      if (idx !== undefined && characters && characters[idx]) {
        const char = characters[idx];
        console.log('[SW] Got character data via global access');
        return {
          name: char.name || '未知角色',
          personality: char.personality || char.persona || '',
          description: char.description || '',
          scenario: char.scenario || '',
          first_mes: char.first_mes || '',
          mes_example: char.mes_example || ''
        };
      }
    } catch (error) {
      console.log('[SW] Global character access failed:', error);
    }
    
    console.log('[SW] No character data found');
    return { name: '未知角色', personality: '', description: '', scenario: '' };
    
  } catch (error) {
    console.error('[SW] Character data access completely failed:', error);
    return { name: '角色数据访问失败', personality: '', description: '', scenario: '' };
  }
}

/**
 * Get SillyTavern Chat History
 */
function getChatHistory(limit = 10) {
  try {
    console.log('[SW] Getting chat history...');
    
    // Method 1: TavernHelper API
    if (typeof TavernHelper !== 'undefined' && TavernHelper.getChatHistory) {
      try {
        const history = TavernHelper.getChatHistory(limit);
        if (history && history.length > 0) {
          console.log('[SW] Got ' + history.length + ' chat messages via TavernHelper');
          return history;
        }
      } catch (error) {
        console.log('[SW] TavernHelper chat history access failed:', error);
      }
    }
    
    // Method 2: Direct global access
    try {
      const chat = window.chat || window.parent?.chat || window.top?.chat;
      if (chat && Array.isArray(chat) && chat.length > 0) {
        const recentChat = chat.slice(-limit);
        console.log('[SW] Got ' + recentChat.length + ' chat messages via global access');
        return recentChat.map(msg => ({
          name: msg.name || msg.user || '未知',
          mes: msg.mes || msg.message || '',
          is_user: msg.is_user || false,
          send_date: msg.send_date || Date.now()
        }));
      }
    } catch (error) {
      console.log('[SW] Global chat access failed:', error);
    }
    
    console.log('[SW] No chat history found');
    return [];
    
  } catch (error) {
    console.error('[SW] Chat history access completely failed:', error);
    return [];
  }
}

/**
 * Build chat history text for prompt
 */
function buildChatHistoryText(history, limit = 10) {
  if (!history || history.length === 0) return '暂无对话历史';
  
  return history
    .slice(-limit)
    .map(msg => {
      const name = msg.name || msg.user || '未知';
      const content = (msg.mes || msg.message || '').substring(0, 200);
      const role = msg.is_user ? '[用户]' : '[AI]';
      return role + ' ' + name + ': ' + content;
    })
    .join('\n');
}

/**
 * System Prompt Resolution Functions
 */
function resolveSystemPrompt() {
  try {
    // Multiple fallback methods for system prompt
    const sources = [
      () => window?.power_user?.context?.story_string,
      () => window?.parent?.power_user?.context?.story_string,
      () => window?.top?.power_user?.context?.story_string,
      () => window?.system_prompt,
      () => window?.parent?.system_prompt,
      () => window?.top?.system_prompt
    ];
    
    for (const source of sources) {
      try {
        const result = source();
        if (result && typeof result === 'string' && result.trim()) {
          console.log('[SW] Found system prompt');
          return result;
        }
      } catch (e) {
        continue;
      }
    }
    
    return '';
  } catch (error) {
    console.log('[SW] System prompt resolution failed:', error);
    return '';
  }
}

function resolveMemorySummary() {
  try {
    const sources = [
      () => window?.memory?.summary,
      () => window?.parent?.memory?.summary,
      () => window?.top?.memory?.summary,
      () => window?.chat_metadata?.summary,
      () => window?.parent?.chat_metadata?.summary,
      () => window?.top?.chat_metadata?.summary
    ];
    
    for (const source of sources) {
      try {
        const result = source();
        if (result && typeof result === 'string' && result.trim()) {
          console.log('[SW] Found memory summary');
          return result;
        }
      } catch (e) {
        continue;
      }
    }
    
    return '';
  } catch (error) {
    console.log('[SW] Memory summary resolution failed:', error);
    return '';
  }
}

function resolveAuthorsNote() {
  try {
    const sources = [
      () => window?.power_user?.context?.authors_note,
      () => window?.parent?.power_user?.context?.authors_note,
      () => window?.top?.power_user?.context?.authors_note,
      () => window?.authors_note,
      () => window?.parent?.authors_note,
      () => window?.top?.authors_note
    ];
    
    for (const source of sources) {
      try {
        const result = source();
        if (result && typeof result === 'string' && result.trim()) {
          console.log('[SW] Found authors note');
          return result;
        }
      } catch (e) {
        continue;
      }
    }
    
    return '';
  } catch (error) {
    console.log('[SW] Authors note resolution failed:', error);
    return '';
  }
}

function resolveJailbreak() {
  try {
    const sources = [
      () => window?.power_user?.context?.jailbreak_prompt,
      () => window?.parent?.power_user?.context?.jailbreak_prompt,
      () => window?.top?.power_user?.context?.jailbreak_prompt,
      () => window?.jailbreak_prompt,
      () => window?.parent?.jailbreak_prompt,
      () => window?.top?.jailbreak_prompt
    ];
    
    for (const source of sources) {
      try {
        const result = source();
        if (result && typeof result === 'string' && result.trim()) {
          console.log('[SW] Found jailbreak prompt');
          return result;
        }
      } catch (e) {
        continue;
      }
    }
    
    return '';
  } catch (error) {
    console.log('[SW] Jailbreak resolution failed:', error);
    return '';
  }
}

/**
 * Build Enhanced Structured Prompt (like original buildStructuredPrompt)
 */
async function buildEnhancedPrompt(settings) {
  try {
    console.log('[SW] Building enhanced structured prompt...');
    
    // Get all data
    const worldInfo = await getWorldInfoData();
    const characterData = getCharacterData();
    const chatHistory = getChatHistory(parseInt(settings.contextLength) || 10);
    const systemPrompt = resolveSystemPrompt();
    const memorySummary = resolveMemorySummary();
    const authorsNote = resolveAuthorsNote();
    const jailbreak = resolveJailbreak();
    
    // Build enhanced template
    let enhancedPrompt = `You are an expert storyteller and world-building assistant. Your task is to generate a compelling and structured story outline.

### CONTEXT & LORE ###
-- System Prompt --
${systemPrompt || '无系统设定'}

Here is the established context, including world settings and character information.

**Worldbook Entries:**
${worldInfo}

**Character Information:**
${formatCharacterForPrompt(characterData)}

-- Memory Summary --
${memorySummary || '无记忆摘要'}

-- Author's Note --
${authorsNote || '无作者注释'}

-- Recent Chat History --
${buildChatHistoryText(chatHistory, 10)}

-- Jailbreak / Preset Prompt (if any) --
${jailbreak || '无特殊提示'}

### USER REQUIREMENTS ###
Based on the context above, generate a story outline that meets the following user requirements.

**故事类型**: ${STORY_TYPES[settings.storyType] || settings.storyType}
**叙述风格**: ${STORY_STYLES[settings.storyStyle] || settings.storyStyle}
**章节数量**: ${settings.chapterCount}
**详细程度**: ${DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel}`;

    if (settings.storyTheme) {
      enhancedPrompt += '\n**故事主题**: ' + settings.storyTheme;
    }
    
    if (settings.specialRequirements) {
      enhancedPrompt += '\n**特殊要求**: ' + settings.specialRequirements;
    }
    
    enhancedPrompt += `\n\n### GENERATION REQUIREMENTS ###
请基于以上所有信息生成故事大纲，要求：
1. 包含${settings.chapterCount}个章节
2. 每章有明确的情节发展和冲突
3. 结构完整，逻辑清晰
4. 符合${STORY_STYLES[settings.storyStyle] || settings.storyStyle}的叙述风格
5. 详细程度: ${DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel}`;

    if (settings.includeSummary) {
      enhancedPrompt += `\n\n请在大纲前提供故事摘要。`;
    }
    
    if (settings.includeCharacters) {
      enhancedPrompt += `\n\n请包含主要角色的性格特点和发展弧线。`;
    }
    
    if (settings.includeThemes) {
      enhancedPrompt += `\n\n请说明故事要探讨的核心主题。`;
    }
    
    enhancedPrompt += `\n\n请生成结构完整、逻辑清晰的故事大纲。`;
    
    console.log('[SW] Enhanced prompt built successfully');
    return enhancedPrompt;
    
  } catch (error) {
    console.error('[SW] Enhanced prompt building failed:', error);
    // Fallback to simple prompt
    return buildSimplePrompt(settings);
  }
}

function formatCharacterForPrompt(characterData) {
  return `**角色姓名**: ${characterData.name}
**角色描述**: ${characterData.description || '无描述'}
**角色性格**: ${characterData.personality || '无性格设定'}
**当前情境**: ${characterData.scenario || '无特定情境'}`;
}

function buildSimplePrompt(settings) {
  // Fallback simple prompt (current implementation)
  let prompt = `请为我生成一个${STORY_TYPES[settings.storyType] || settings.storyType}类型的故事大纲。`;
  
  if (settings.storyTheme) {
    prompt += '\n\n故事主题: ' + settings.storyTheme;
  }
  
  prompt += '\n\n要求:\n1. 包含' + settings.chapterCount + '个章节\n2. 每章有明确的情节发展和冲突\n3. 结构完整，逻辑清晰\n4. 符合' + (STORY_STYLES[settings.storyStyle] || settings.storyStyle) + '的叙述风格\n5. 详细程度: ' + (DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel);

  if (settings.specialRequirements) {
    prompt += '\n6. 特殊要求: ' + settings.specialRequirements;
  }
  
  if (settings.includeSummary) {
    prompt += `\n\n请在大纲前提供故事摘要。`;
  }
  
  if (settings.includeCharacters) {
    prompt += `\n\n请包含主要角色的性格特点和发展弧线。`;
  }
  
  if (settings.includeThemes) {
    prompt += `\n\n请说明故事要探讨的核心主题。`;
  }
  
  prompt += `\n\n请生成结构完整、逻辑清晰的故事大纲。`;
  
  return prompt;
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

// ========================= PRESET MANAGEMENT SYSTEM =========================

/**
 * Preset Management System - 完整的预设管理功能
 */
const PresetManager = {
  
  /**
   * Get all saved presets
   */
  getAllPresets() {
    try {
      const presets = localStorage.getItem('storyWeaverPresets');
      return presets ? JSON.parse(presets) : {};
    } catch (error) {
      console.error('[SW] Failed to get presets:', error);
      return {};
    }
  },
  
  /**
   * Save a preset
   */
  savePreset(name, settings) {
    try {
      const presets = this.getAllPresets();
      presets[name] = {
        ...settings,
        savedAt: Date.now(),
        version: '2.0'
      };
      localStorage.setItem('storyWeaverPresets', JSON.stringify(presets));
      console.log('[SW] Preset "' + name + '" saved successfully');
      return true;
    } catch (error) {
      console.error('[SW] Failed to save preset:', error);
      return false;
    }
  },
  
  /**
   * Load a preset
   */
  loadPreset(name) {
    try {
      const presets = this.getAllPresets();
      if (presets[name]) {
        console.log('[SW] Preset "' + name + '" loaded successfully');
        return presets[name];
      }
      return null;
    } catch (error) {
      console.error('[SW] Failed to load preset:', error);
      return null;
    }
  },
  
  /**
   * Delete a preset
   */
  deletePreset(name) {
    try {
      const presets = this.getAllPresets();
      if (presets[name]) {
        delete presets[name];
        localStorage.setItem('storyWeaverPresets', JSON.stringify(presets));
        console.log('[SW] Preset "' + name + '" deleted successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SW] Failed to delete preset:', error);
      return false;
    }
  },
  
  /**
   * Export preset to JSON file
   */
  exportPreset(name) {
    try {
      const preset = this.loadPreset(name);
      if (!preset) {
        throw new Error(`Preset "${name}" not found`);
      }
      
      const exportData = {
        name: name,
        preset: preset,
        exportedAt: Date.now(),
        version: '2.0',
        type: 'StoryWeaverPreset'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `story-weaver-preset-${name}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[SW] Preset "' + name + '" exported successfully');
      return true;
    } catch (error) {
      console.error('[SW] Failed to export preset:', error);
      return false;
    }
  },
  
  /**
   * Import preset from JSON file
   */
  importPreset(fileContent) {
    try {
      const importData = JSON.parse(fileContent);
      
      // Validate import data
      if (importData.type !== 'StoryWeaverPreset' || !importData.name || !importData.preset) {
        throw new Error('Invalid preset file format');
      }
      
      // Check if preset already exists
      const existingPresets = this.getAllPresets();
      let finalName = importData.name;
      let counter = 1;
      
      while (existingPresets[finalName]) {
        finalName = importData.name + '_' + counter;
        counter++;
      }
      
      // Save the preset
      const success = this.savePreset(finalName, importData.preset);
      if (success) {
        console.log('[SW] Preset imported as "' + finalName + '"');
        return { success: true, name: finalName };
      } else {
        throw new Error('Failed to save imported preset');
      }
    } catch (error) {
      console.error('[SW] Failed to import preset:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get preset list for UI
   */
  getPresetList() {
    const presets = this.getAllPresets();
    return Object.keys(presets).map(name => ({
      name: name,
      savedAt: presets[name].savedAt,
      storyType: presets[name].storyType,
      storyTheme: presets[name].storyTheme?.substring(0, 50) + '...'
    }));
  }
};

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
    TavernHelper.sendMessage('## 📖 Quick Story Outline\n\n' + result);
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
  showNotification,
  // Data integration functions
  getWorldInfoData,
  getChatHistory,
  getCharacterData,
  buildEnhancedPrompt,
  resolveSystemPrompt,
  resolveMemorySummary,
  resolveAuthorsNote,
  resolveJailbreak,
  buildChatHistoryText,
  // Preset management
  PresetManager
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
function buildCompleteInterface(settings) {
  // 为TavernHelper环境构建完整界面，包含所有功能区块
  const completeInterface = buildSimpleInterface(settings);

  // 确保预设管理区域在TavernHelper中也能正常工作
  setTimeout(() => {
    loadPresetList();
    initializeImportHandler();
  }, 100);

  return completeInterface;
}

// ========================= ENHANCED PROMPT SYSTEM =========================

/**
 * 构建增强的故事生成提示词
 * 整合上下文信息、角色数据和用户设置
 * @param {Object} settings - 用户设置
 * @returns {Promise<string>} 完整的提示词
 */
async function buildEnhancedPrompt(settings) {
  try {
    console.log('[SW] Building enhanced prompt with settings:', settings);

    let enhancedPrompt = '';

    // 基础提示词模板
    enhancedPrompt += '请为我生成一个详细的故事大纲，要求如下：\n\n';

    // 添加故事类型和风格
    if (settings.storyType && STORY_TYPES[settings.storyType]) {
      enhancedPrompt += `**故事类型**: ${STORY_TYPES[settings.storyType]}\n`;
    }

    if (settings.storyStyle && STORY_STYLES[settings.storyStyle]) {
      enhancedPrompt += `**叙述风格**: ${STORY_STYLES[settings.storyStyle]}\n`;
    }

    // 添加故事主题
    if (settings.storyTheme && settings.storyTheme.trim()) {
      enhancedPrompt += `**故事主题**: ${settings.storyTheme}\n`;
    }

    // 添加特殊要求
    if (settings.specialRequirements && settings.specialRequirements.trim()) {
      enhancedPrompt += `**特殊要求**: ${settings.specialRequirements}\n`;
    }

    // 尝试获取上下文信息
    try {
      const contextInfo = await gatherContextInformation(settings.contextLength || 10);
      if (contextInfo) {
        enhancedPrompt += '\n## 📚 背景信息参考\n\n';
        enhancedPrompt += contextInfo;
      }
    } catch (contextError) {
      console.warn('[SW] Failed to gather context information:', contextError);
      // 不阻塞主流程，继续生成基础提示词
    }

    // 添加生成要求
    enhancedPrompt += '\n## 📋 生成要求\n\n';
    enhancedPrompt += `1. 包含${settings.chapterCount || 5}个章节\n`;
    enhancedPrompt += '2. 每章有明确的情节发展和冲突点\n';
    enhancedPrompt += '3. 结构完整，逻辑清晰，前后呼应\n';

    if (settings.detailLevel && DETAIL_LEVELS[settings.detailLevel]) {
      enhancedPrompt += `4. 详细程度: ${DETAIL_LEVELS[settings.detailLevel]}\n`;
    }

    // 添加可选内容要求
    const optionalRequirements = [];
    if (settings.includeSummary) {
      optionalRequirements.push('故事摘要');
    }
    if (settings.includeCharacters) {
      optionalRequirements.push('主要角色分析');
    }
    if (settings.includeThemes) {
      optionalRequirements.push('主题探讨');
    }

    if (optionalRequirements.length > 0) {
      enhancedPrompt += `5. 额外包含: ${optionalRequirements.join('、')}\n`;
    }

    // 添加格式要求
    enhancedPrompt += '\n## 📝 输出格式\n\n';
    enhancedPrompt += '请按以下格式输出：\n';

    if (settings.includeSummary) {
      enhancedPrompt += '**故事摘要**\n[简要概述整个故事]\n\n';
    }

    enhancedPrompt += '**故事大纲**\n';
    for (let i = 1; i <= (settings.chapterCount || 5); i++) {
      enhancedPrompt += `第${i}章: [章节标题]\n[章节内容概要]\n\n`;
    }

    if (settings.includeCharacters) {
      enhancedPrompt += '**角色分析**\n[主要角色的性格特点和发展弧线]\n\n';
    }

    if (settings.includeThemes) {
      enhancedPrompt += '**主题探讨**\n[故事要探讨的核心主题]\n\n';
    }

    enhancedPrompt += '\n请确保生成的大纲具有引人入胜的情节和合理的发展逻辑。';

    console.log('[SW] Enhanced prompt built successfully, length:', enhancedPrompt.length);
    return enhancedPrompt;

  } catch (error) {
    console.error('[SW] Error building enhanced prompt:', error);
    // 降级到简单提示词
    return buildFallbackPrompt(settings);
  }
}

/**
 * 收集上下文信息（世界书、角色、对话历史等）
 * @param {number} contextLength - 上下文长度限制
 * @returns {Promise<string>} 格式化的上下文信息
 */
async function gatherContextInformation(contextLength = 10) {
  let contextInfo = '';

  try {
    // 获取世界书信息
    const worldInfo = await getWorldBookEntries();
    if (worldInfo && worldInfo.length > 0) {
      contextInfo += '### 🌍 世界设定\n\n';
      worldInfo.forEach(entry => {
        contextInfo += `**${entry.key}**: ${entry.content.substring(0, 200)}\n`;
      });
      contextInfo += '\n';
    }

    // 获取角色信息
    const characterInfo = await getCurrentCharacterInfo();
    if (characterInfo) {
      contextInfo += '### 👤 角色信息\n\n';
      contextInfo += `**角色名称**: ${characterInfo.name}\n`;
      if (characterInfo.personality) {
        contextInfo += `**性格特点**: ${characterInfo.personality.substring(0, 150)}\n`;
      }
      if (characterInfo.description) {
        contextInfo += `**角色描述**: ${characterInfo.description.substring(0, 150)}\n`;
      }
      contextInfo += '\n';
    }

    // 获取对话历史（如果启用）
    if (contextLength > 0) {
      const chatHistory = await getRecentChatHistory(contextLength);
      if (chatHistory && chatHistory.length > 0) {
        contextInfo += '### 💬 最近对话\n\n';
        chatHistory.forEach(msg => {
          const speaker = msg.is_user ? '用户' : (characterInfo?.name || '角色');
          contextInfo += `**${speaker}**: ${msg.mes.substring(0, 100)}\n`;
        });
        contextInfo += '\n';
      }
    }

  } catch (error) {
    console.warn('[SW] Error gathering context information:', error);
  }

  return contextInfo;
}

/**
 * 获取世界书条目
 * @returns {Promise<Array>} 世界书条目数组
 */
async function getWorldBookEntries() {
  try {
    // 尝试多种方式获取世界书信息
    if (typeof getSortedEntries === 'function') {
      // SillyTavern扩展环境
      return getSortedEntries();
    } else if (window.world_info && window.world_info.entries) {
      // 全局世界书访问
      return Object.values(window.world_info.entries);
    } else if (typeof TavernHelper !== 'undefined' && TavernHelper.getWorldInfo) {
      // TavernHelper环境
      return TavernHelper.getWorldInfo();
    }
  } catch (error) {
    console.warn('[SW] Failed to get world book entries:', error);
  }

  return [];
}

/**
 * 获取当前角色信息
 * @returns {Promise<Object>} 角色信息对象
 */
async function getCurrentCharacterInfo() {
  try {
    if (typeof getCharacterData === 'function') {
      return getCharacterData();
    } else if (window.characters && window.this_chid !== undefined) {
      return window.characters[window.this_chid];
    } else if (typeof TavernHelper !== 'undefined' && TavernHelper.getCurrentCharacter) {
      return TavernHelper.getCurrentCharacter();
    }
  } catch (error) {
    console.warn('[SW] Failed to get character info:', error);
  }

  return null;
}

/**
 * 获取最近的对话历史
 * @param {number} limit - 限制数量
 * @returns {Promise<Array>} 对话历史数组
 */
async function getRecentChatHistory(limit = 10) {
  try {
    if (typeof getChatHistory === 'function') {
      return getChatHistory(limit);
    } else if (window.chat && Array.isArray(window.chat)) {
      return window.chat.slice(-limit);
    } else if (typeof TavernHelper !== 'undefined' && TavernHelper.getChatHistory) {
      return TavernHelper.getChatHistory(limit);
    }
  } catch (error) {
    console.warn('[SW] Failed to get chat history:', error);
  }

  return [];
}

/**
 * 降级的简单提示词构建函数
 * @param {Object} settings - 用户设置
 * @returns {string} 基础提示词
 */
function buildFallbackPrompt(settings) {
  let prompt = '请为我生成一个';

  if (settings.storyType && STORY_TYPES[settings.storyType]) {
    prompt += STORY_TYPES[settings.storyType];
  } else {
    prompt += '故事';
  }

  prompt += '大纲。\n\n';

  if (settings.storyTheme) {
    prompt += `故事主题: ${settings.storyTheme}\n\n`;
  }

  prompt += '要求:\n';
  prompt += `1. 包含${settings.chapterCount || 5}个章节\n`;
  prompt += '2. 每章有明确的情节发展和冲突\n';
  prompt += '3. 结构完整，逻辑清晰\n';

  if (settings.storyStyle && STORY_STYLES[settings.storyStyle]) {
    prompt += `4. 符合${STORY_STYLES[settings.storyStyle]}的叙述风格\n`;
  }

  if (settings.detailLevel && DETAIL_LEVELS[settings.detailLevel]) {
    prompt += `5. 详细程度: ${DETAIL_LEVELS[settings.detailLevel]}\n`;
  }

  if (settings.specialRequirements) {
    prompt += `6. 特殊要求: ${settings.specialRequirements}\n`;
  }

  const optionalContent = [];
  if (settings.includeSummary) optionalContent.push('故事摘要');
  if (settings.includeCharacters) optionalContent.push('角色分析');
  if (settings.includeThemes) optionalContent.push('主题探讨');

  if (optionalContent.length > 0) {
    prompt += `7. 请包含: ${optionalContent.join('、')}\n`;
  }

  prompt += '\n请生成结构完整、逻辑清晰的故事大纲。';

  return prompt;
}

// ========================= GLOBAL UI FUNCTIONS =========================

/**
 * 处理生成故事大纲的主要函数
 */
async function handleStoryGeneration() {
  try {
    console.log('[SW] Starting story generation...');

    const settings = getFormSettings();
    if (!validateSettings(settings)) {
      StoryWeaverErrorHandler.showNotification('请检查设置参数', 'warning');
      return;
    }

    // 更新UI状态
    updateGenerationUI(true);

    // 构建提示词
    const prompt = await buildEnhancedPrompt(settings);

    // 调用生成函数
    let result = '';
    if (typeof generate !== 'undefined') {
      result = await generate(prompt);
    } else if (typeof generateRaw !== 'undefined') {
      result = await generateRaw(prompt);
    } else {
      throw new Error('SillyTavern生成功能不可用');
    }

    if (result && result.trim()) {
      displayGenerationResult(result);
      saveGenerationToHistory(result, settings);
      StoryWeaverErrorHandler.showNotification('故事大纲生成成功！', 'success');
    } else {
      throw new Error('生成结果为空');
    }

  } catch (error) {
    const errorInfo = StoryWeaverErrorHandler.handleError(error, 'story generation', {
      allowRetry: true,
      retryAction: () => handleStoryGeneration()
    });

    StoryWeaverErrorHandler.showNotification(errorInfo.userMessage, 'error');
    console.error('[SW] Generation failed:', error);

  } finally {
    updateGenerationUI(false);
  }
}

/**
 * 从表单获取当前设置
 * @returns {Object} 设置对象
 */
function getFormSettings() {
  return {
    storyTheme: document.getElementById('sw-theme')?.value || '',
    storyType: document.getElementById('sw-type')?.value || 'fantasy',
    storyStyle: document.getElementById('sw-style')?.value || 'narrative',
    chapterCount: parseInt(document.getElementById('sw-chapters')?.value) || 5,
    detailLevel: document.getElementById('sw-detail')?.value || 'medium',
    specialRequirements: document.getElementById('sw-requirements')?.value || '',
    contextLength: parseInt(document.getElementById('sw-context-length')?.value) || 10,
    includeSummary: document.getElementById('sw-summary')?.checked || false,
    includeCharacters: document.getElementById('sw-characters')?.checked || false,
    includeThemes: document.getElementById('sw-themes')?.checked || false
  };
}

/**
 * 验证设置参数
 * @param {Object} settings - 设置对象
 * @returns {boolean} 是否有效
 */
function validateSettings(settings) {
  if (!settings.storyTheme.trim()) {
    StoryWeaverErrorHandler.showNotification('请输入故事主题', 'warning');
    return false;
  }

  if (settings.chapterCount < 1 || settings.chapterCount > 20) {
    StoryWeaverErrorHandler.showNotification('章节数量应在1-20之间', 'warning');
    return false;
  }

  return true;
}

/**
 * 更新生成按钮的UI状态
 * @param {boolean} isGenerating - 是否正在生成
 */
function updateGenerationUI(isGenerating) {
  const button = document.getElementById('sw-generate-btn');
  if (button) {
    button.disabled = isGenerating;
    button.textContent = isGenerating ? '⏳ 生成中...' : '🎯 生成故事大纲';
  }
}

/**
 * 显示生成结果
 * @param {string} result - 生成的结果
 */
function displayGenerationResult(result) {
  const outputSection = document.getElementById('sw-output-section');
  const outputContent = document.getElementById('sw-output-content');
  const outputControls = document.getElementById('sw-output-controls');

  if (outputContent) {
    outputContent.textContent = result;
  }

  if (outputSection) {
    outputSection.style.display = 'block';
  }

  if (outputControls) {
    outputControls.style.display = 'block';
  }

  // 存储结果供其他功能使用
  window.storyWeaverLastResult = result;
}

/**
 * 将生成结果保存到历史记录
 * @param {string} result - 生成结果
 * @param {Object} settings - 使用的设置
 */
function saveGenerationToHistory(result, settings) {
  try {
    const history = JSON.parse(localStorage.getItem('storyWeaverHistory') || '[]');

    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      result: result,
      settings: settings,
      preview: result.substring(0, 100) + '...'
    };

    history.unshift(entry);

    // 限制历史记录数量
    if (history.length > 50) {
      history.splice(50);
    }

    localStorage.setItem('storyWeaverHistory', JSON.stringify(history));

  } catch (error) {
    console.warn('[SW] Failed to save to history:', error);
  }
}

/**
 * 刷新上下文数据
 */
async function refreshStoryWeaverContextData() {
  try {
    console.log('[SW] Refreshing context data...');

    const statusElement = document.getElementById('sw-context-status');
    if (statusElement) {
      statusElement.textContent = '🔄 正在刷新数据...';
    }

    // 重新收集上下文信息
    const contextLength = parseInt(document.getElementById('sw-context-length')?.value) || 10;
    const contextInfo = await gatherContextInformation(contextLength);

    if (statusElement) {
      if (contextInfo) {
        statusElement.textContent = '✅ 数据刷新成功，已获取最新上下文信息';
        statusElement.style.color = '#28a745';
      } else {
        statusElement.textContent = '⚠️ 未获取到上下文数据，将使用基础生成模式';
        statusElement.style.color = '#ffc107';
      }
    }

    StoryWeaverErrorHandler.showNotification('上下文数据已刷新', 'success', 3000);

  } catch (error) {
    console.error('[SW] Failed to refresh context data:', error);
    const statusElement = document.getElementById('sw-context-status');
    if (statusElement) {
      statusElement.textContent = '❌ 数据刷新失败';
      statusElement.style.color = '#dc3545';
    }
    StoryWeaverErrorHandler.showNotification('数据刷新失败', 'error');
  }
}

/**
 * 预览上下文数据
 */
async function previewStoryWeaverContextData() {
  try {
    console.log('[SW] Previewing context data...');

    const contextLength = parseInt(document.getElementById('sw-context-length')?.value) || 10;
    const contextInfo = await gatherContextInformation(contextLength);

    let previewContent = '';

    if (!contextInfo || contextInfo.trim() === '') {
      previewContent = '暂无可用的上下文数据。\n\n可能原因：\n- 当前没有活跃的角色对话\n- 世界书为空\n- 上下文长度设置为0';
    } else {
      previewContent = contextInfo;
    }

    // 创建预览窗口
    createContextPreviewModal(previewContent);

  } catch (error) {
    console.error('[SW] Failed to preview context data:', error);
    StoryWeaverErrorHandler.showNotification('预览失败: ' + error.message, 'error');
  }
}

/**
 * 创建上下文预览模态窗口
 * @param {string} content - 要显示的内容
 */
function createContextPreviewModal(content) {
  // 移除现有模态窗口
  const existingModal = document.getElementById('sw-context-preview-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'sw-context-preview-modal';
  modal.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; ' +
    'background: rgba(0, 0, 0, 0.7); z-index: 10002; ' +
    'display: flex; align-items: center; justify-content: center; ' +
    'backdrop-filter: blur(3px);';

  const modalContent = document.createElement('div');
  modalContent.style.cssText =
    'background: white; border-radius: 8px; padding: 0; ' +
    'max-width: 80vw; max-height: 80vh; overflow: hidden; ' +
    'display: flex; flex-direction: column; ' +
    'box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);';

  const modalHeader = document.createElement('div');
  modalHeader.style.cssText =
    'background: #17a2b8; color: white; padding: 15px 20px; ' +
    'display: flex; justify-content: space-between; align-items: center;';

  modalHeader.innerHTML = `
    <h3 style="margin: 0; font-size: 18px;">👁️ 上下文数据预览</h3>
    <button onclick="document.getElementById('sw-context-preview-modal').remove()"
            style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
  `;

  const modalBody = document.createElement('div');
  modalBody.style.cssText =
    'padding: 20px; overflow-y: auto; flex: 1; ' +
    'font-family: "Courier New", monospace; font-size: 14px; ' +
    'white-space: pre-wrap; line-height: 1.5;';

  modalBody.textContent = content;

  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  modal.appendChild(modalContent);

  // 点击外部关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
}

// 全局函数别名，供HTML onclick使用
window.handleNativeGenerate = handleStoryGeneration;
window.refreshContextData = refreshStoryWeaverContextData;
window.previewContextData = previewStoryWeaverContextData;

// 预设管理功能
window.loadSelectedPreset = function() {
  try {
    const presetSelect = document.getElementById('sw-preset-select');
    if (!presetSelect || !presetSelect.value) {
      StoryWeaverErrorHandler.showNotification('请先选择一个预设', 'warning');
      return;
    }

    const presetName = presetSelect.value;
    const savedPresets = JSON.parse(localStorage.getItem('story_weaver_presets') || '{}');

    if (savedPresets[presetName]) {
      loadPresetSettings(savedPresets[presetName]);
      StoryWeaverErrorHandler.showNotification(`预设 "${presetName}" 已加载`, 'success');
    } else {
      StoryWeaverErrorHandler.showNotification('预设不存在', 'error');
    }
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'loadSelectedPreset');
  }
};

window.showSavePresetDialog = function() {
  try {
    const presetName = prompt('请输入预设名称:');
    if (presetName && presetName.trim()) {
      saveCurrentPreset(presetName.trim());
    }
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'showSavePresetDialog');
  }
};

window.showPresetManager = function() {
  try {
    if (typeof showPresetManagerModal === 'function') {
      showPresetManagerModal();
    } else {
      StoryWeaverErrorHandler.showNotification('预设管理器暂不可用', 'warning');
    }
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'showPresetManager');
  }
};

// 导出功能
window.exportCurrentSettings = function() {
  try {
    const settings = getCurrentSettings();
    const exportData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      settings: settings
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-weaver-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    StoryWeaverErrorHandler.showNotification('设置已导出', 'success');
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'exportCurrentSettings');
  }
};

window.exportStoryOutline = function(format = 'txt') {
  try {
    const result = document.getElementById('sw-result');
    if (!result || !result.textContent.trim()) {
      StoryWeaverErrorHandler.showNotification('没有可导出的内容', 'warning');
      return;
    }

    const content = result.textContent;
    let mimeType, filename;

    switch (format) {
      case 'md':
        mimeType = 'text/markdown';
        filename = `story-outline-${new Date().toISOString().split('T')[0]}.md`;
        break;
      case 'json':
        const jsonData = {
          title: '故事大纲',
          content: content,
          timestamp: new Date().toISOString()
        };
        mimeType = 'application/json';
        filename = `story-outline-${new Date().toISOString().split('T')[0]}.json`;
        break;
      default:
        mimeType = 'text/plain';
        filename = `story-outline-${new Date().toISOString().split('T')[0]}.txt`;
    }

    const exportContent = format === 'json' ? JSON.stringify(jsonData, null, 2) : content;
    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    StoryWeaverErrorHandler.showNotification(`大纲已导出为 ${format.toUpperCase()}`, 'success');
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'exportStoryOutline');
  }
};

// 结果管理功能
window.copyNativeResult = function() {
  try {
    const result = document.getElementById('sw-result');
    if (!result || !result.textContent.trim()) {
      StoryWeaverErrorHandler.showNotification('没有可复制的内容', 'warning');
      return;
    }

    navigator.clipboard.writeText(result.textContent).then(() => {
      StoryWeaverErrorHandler.showNotification('内容已复制到剪贴板', 'success');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = result.textContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      StoryWeaverErrorHandler.showNotification('内容已复制到剪贴板', 'success');
    });
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'copyNativeResult');
  }
};

window.saveNativeResult = function() {
  try {
    const result = document.getElementById('sw-result');
    if (!result || !result.textContent.trim()) {
      StoryWeaverErrorHandler.showNotification('没有可保存的内容', 'warning');
      return;
    }

    const savedResults = JSON.parse(localStorage.getItem('story_weaver_results') || '[]');
    const newResult = {
      id: Date.now(),
      content: result.textContent,
      timestamp: new Date().toISOString(),
      title: `故事大纲 ${new Date().toLocaleString()}`
    };

    savedResults.unshift(newResult);
    if (savedResults.length > 50) savedResults.pop();

    localStorage.setItem('story_weaver_results', JSON.stringify(savedResults));
    StoryWeaverErrorHandler.showNotification('内容已保存到本地历史', 'success');
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'saveNativeResult');
  }
};

window.showExportOptions = function() {
  try {
    const modal = document.createElement('div');
    modal.id = 'export-options-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 10000;';

    modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 10px; max-width: 400px;">
        <h3>导出选项</h3>
        <button onclick="exportStoryOutline('txt')" style="width: 100%; margin: 5px 0; padding: 10px; background: #17a2b8; color: white; border: none; border-radius: 5px;">导出为 TXT</button>
        <button onclick="exportStoryOutline('md')" style="width: 100%; margin: 5px 0; padding: 10px; background: #6f42c1; color: white; border: none; border-radius: 5px;">导出为 Markdown</button>
        <button onclick="exportStoryOutline('json')" style="width: 100%; margin: 5px 0; padding: 10px; background: #fd7e14; color: white; border: none; border-radius: 5px;">导出为 JSON</button>
        <button onclick="exportCurrentSettings()" style="width: 100%; margin: 5px 0; padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px;">导出设置</button>
        <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; margin: 10px 0 0 0; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 5px;">取消</button>
      </div>
    `;

    document.body.appendChild(modal);
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'showExportOptions');
  }
};

// 章节细纲功能
window.generateChapterDetails = function() {
  try {
    const result = document.getElementById('sw-result');
    if (!result || !result.textContent.trim()) {
      StoryWeaverErrorHandler.showNotification('请先生成故事大纲', 'warning');
      return;
    }

    if (typeof showChapterDetailModal === 'function') {
      showChapterDetailModal();
    } else {
      StoryWeaverErrorHandler.showNotification('章节细纲功能暂不可用', 'warning');
    }
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'generateChapterDetails');
  }
};

window.generateSelectedChapterDetail = function() {
  try {
    StoryWeaverErrorHandler.showNotification('生成选中章节细纲功能开发中', 'info');
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'generateSelectedChapterDetail');
  }
};

window.copyChapterDetail = function() {
  try {
    const chapterResult = document.querySelector('.chapter-detail-result');
    if (!chapterResult || !chapterResult.textContent.trim()) {
      StoryWeaverErrorHandler.showNotification('没有可复制的章节细纲', 'warning');
      return;
    }

    navigator.clipboard.writeText(chapterResult.textContent).then(() => {
      StoryWeaverErrorHandler.showNotification('章节细纲已复制', 'success');
    });
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'copyChapterDetail');
  }
};

window.saveChapterDetail = function() {
  try {
    const chapterResult = document.querySelector('.chapter-detail-result');
    if (!chapterResult || !chapterResult.textContent.trim()) {
      StoryWeaverErrorHandler.showNotification('没有可保存的章节细纲', 'warning');
      return;
    }

    const savedDetails = JSON.parse(localStorage.getItem('story_weaver_chapter_details') || '[]');
    const newDetail = {
      id: Date.now(),
      content: chapterResult.textContent,
      timestamp: new Date().toISOString(),
      title: `章节细纲 ${new Date().toLocaleString()}`
    };

    savedDetails.unshift(newDetail);
    if (savedDetails.length > 30) savedDetails.pop();

    localStorage.setItem('story_weaver_chapter_details', JSON.stringify(savedDetails));
    StoryWeaverErrorHandler.showNotification('章节细纲已保存', 'success');
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'saveChapterDetail');
  }
};

// 导入导出管理
window.showImportExportManager = function() {
  try {
    StoryWeaverErrorHandler.showNotification('导入导出管理中心开发中', 'info');
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'showImportExportManager');
  }
};

// 预设导出功能
window.exportAllPresets = function() {
  try {
    const savedPresets = JSON.parse(localStorage.getItem('story_weaver_presets') || '{}');
    if (Object.keys(savedPresets).length === 0) {
      StoryWeaverErrorHandler.showNotification('没有可导出的预设', 'warning');
      return;
    }

    const exportData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      presets: savedPresets
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-weaver-presets-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    StoryWeaverErrorHandler.showNotification('所有预设已导出', 'success');
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'exportAllPresets');
  }
};

window.exportSinglePreset = function(presetName) {
  try {
    const savedPresets = JSON.parse(localStorage.getItem('story_weaver_presets') || '{}');
    if (!savedPresets[presetName]) {
      StoryWeaverErrorHandler.showNotification('预设不存在', 'error');
      return;
    }

    const exportData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      preset: {
        name: presetName,
        data: savedPresets[presetName]
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-weaver-preset-${presetName}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    StoryWeaverErrorHandler.showNotification(`预设 "${presetName}" 已导出`, 'success');
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'exportSinglePreset');
  }
};

window.deleteSinglePreset = function(presetName) {
  try {
    if (!confirm(`确定要删除预设 "${presetName}" 吗？此操作不可撤销。`)) {
      return;
    }

    const savedPresets = JSON.parse(localStorage.getItem('story_weaver_presets') || '{}');
    if (savedPresets[presetName]) {
      delete savedPresets[presetName];
      localStorage.setItem('story_weaver_presets', JSON.stringify(savedPresets));
      StoryWeaverErrorHandler.showNotification(`预设 "${presetName}" 已删除`, 'success');

      if (typeof refreshPresetManager === 'function') {
        refreshPresetManager();
      }
    } else {
      StoryWeaverErrorHandler.showNotification('预设不存在', 'error');
    }
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'deleteSinglePreset');
  }
};

// 帮助模态窗口
window.showHelpModal = function() {
  try {
    const modal = document.createElement('div');
    modal.id = 'help-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 10000; animation: fadeIn 0.3s ease-out;';

    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: white; width: 90%; max-width: 800px; max-height: 90%; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 10px 30px rgba(0,0,0,0.3); animation: slideIn 0.3s ease-out;';

    modalContent.innerHTML = `
      <div style="padding: 20px; border-bottom: 1px solid #eee; background: #f8f9fa;">
        <h2 style="margin: 0; color: #333;">📖 Story Weaver 使用帮助</h2>
      </div>
      <div style="padding: 20px; overflow-y: auto; flex-grow: 1;">
        <h3>🎯 功能概述</h3>
        <p>Story Weaver 是一个智能故事大纲生成工具，帮助您快速创建结构化的故事框架。</p>

        <h3>🔧 基本使用</h3>
        <ol>
          <li><strong>设置故事类型</strong>：选择您想要创作的故事类型（冒险、爱情、悬疑等）</li>
          <li><strong>配置参数</strong>：调整章节数量、详细程度、写作风格等设置</li>
          <li><strong>生成大纲</strong>：点击"开始生成"按钮创建故事大纲</li>
          <li><strong>导出保存</strong>：将生成的内容导出为不同格式或保存到本地</li>
        </ol>

        <h3>💾 预设管理</h3>
        <ul>
          <li>保存常用的参数配置为预设</li>
          <li>快速加载之前保存的设置</li>
          <li>导出和导入预设文件</li>
        </ul>

        <h3>📤 导出功能</h3>
        <ul>
          <li>支持 TXT、Markdown、JSON 格式导出</li>
          <li>可以导出故事大纲和设置参数</li>
          <li>自动保存历史记录到本地存储</li>
        </ul>

        <h3>🔄 数据刷新</h3>
        <p>点击"刷新数据"按钮可以重新读取 SillyTavern 的世界书和聊天历史，确保上下文信息是最新的。</p>
      </div>
      <div style="padding: 20px; border-top: 1px solid #eee; text-align: right; background: #f8f9fa;">
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">关闭</button>
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'showHelpModal');
  }
};

// ========================= 预设管理辅助功能 =========================

/**
 * 加载预设列表到下拉框
 */
function loadPresetList() {
  try {
    const presetSelect = document.getElementById('sw-preset-select');
    if (!presetSelect) return;

    const savedPresets = JSON.parse(localStorage.getItem('story_weaver_presets') || '{}');
    const presetNames = Object.keys(savedPresets);

    // 清空现有选项
    presetSelect.innerHTML = '<option value="">选择预设...</option>';

    // 添加预设选项
    presetNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      presetSelect.appendChild(option);
    });

    console.log('[SW] Loaded presets:', presetNames);
  } catch (error) {
    console.error('[SW] Failed to load preset list:', error);
  }
}

/**
 * 保存当前设置为预设
 */
function saveCurrentPreset(presetName) {
  try {
    const settings = getCurrentSettings();
    const savedPresets = JSON.parse(localStorage.getItem('story_weaver_presets') || '{}');

    savedPresets[presetName] = {
      ...settings,
      timestamp: new Date().toISOString(),
      version: '2.0'
    };

    localStorage.setItem('story_weaver_presets', JSON.stringify(savedPresets));
    loadPresetList(); // 刷新预设列表

    StoryWeaverErrorHandler.showNotification(`预设 "${presetName}" 已保存`, 'success');
  } catch (error) {
    StoryWeaverErrorHandler.handleError(error, 'saveCurrentPreset');
  }
}

/**
 * 加载预设设置到界面
 */
function loadPresetSettings(presetData) {
  try {
    // 加载基本设置
    if (presetData.storyType) {
      const typeSelect = document.getElementById('sw-type');
      if (typeSelect) typeSelect.value = presetData.storyType;
    }

    if (presetData.storyStyle) {
      const styleSelect = document.getElementById('sw-style');
      if (styleSelect) styleSelect.value = presetData.storyStyle;
    }

    if (presetData.detailLevel) {
      const detailSelect = document.getElementById('sw-detail');
      if (detailSelect) detailSelect.value = presetData.detailLevel;
    }

    if (presetData.chapterCount) {
      const chaptersInput = document.getElementById('sw-chapters');
      if (chaptersInput) chaptersInput.value = presetData.chapterCount;
    }

    if (presetData.contextLength !== undefined) {
      const contextInput = document.getElementById('sw-context-length');
      if (contextInput) contextInput.value = presetData.contextLength;
    }

    // 加载文本字段
    if (presetData.storyTheme) {
      const themeTextarea = document.getElementById('sw-theme');
      if (themeTextarea) themeTextarea.value = presetData.storyTheme;
    }

    if (presetData.specialRequirements) {
      const requirementsTextarea = document.getElementById('sw-requirements');
      if (requirementsTextarea) requirementsTextarea.value = presetData.specialRequirements;
    }

    // 加载复选框
    if (presetData.includeSummary !== undefined) {
      const summaryCheckbox = document.getElementById('sw-summary');
      if (summaryCheckbox) summaryCheckbox.checked = presetData.includeSummary;
    }

    if (presetData.includeCharacters !== undefined) {
      const charactersCheckbox = document.getElementById('sw-characters');
      if (charactersCheckbox) charactersCheckbox.checked = presetData.includeCharacters;
    }

    if (presetData.includeThemes !== undefined) {
      const themesCheckbox = document.getElementById('sw-themes');
      if (themesCheckbox) themesCheckbox.checked = presetData.includeThemes;
    }

    console.log('[SW] Preset settings loaded successfully');
  } catch (error) {
    console.error('[SW] Failed to load preset settings:', error);
    StoryWeaverErrorHandler.showNotification('预设加载失败', 'error');
  }
}

/**
 * 获取当前界面设置
 */
function getCurrentSettings() {
  const settings = {};

  try {
    // 获取选择框的值
    const typeSelect = document.getElementById('sw-type');
    if (typeSelect) settings.storyType = typeSelect.value;

    const styleSelect = document.getElementById('sw-style');
    if (styleSelect) settings.storyStyle = styleSelect.value;

    const detailSelect = document.getElementById('sw-detail');
    if (detailSelect) settings.detailLevel = detailSelect.value;

    // 获取数字输入
    const chaptersInput = document.getElementById('sw-chapters');
    if (chaptersInput) settings.chapterCount = parseInt(chaptersInput.value) || 5;

    const contextInput = document.getElementById('sw-context-length');
    if (contextInput) settings.contextLength = parseInt(contextInput.value) || 10;

    // 获取文本字段
    const themeTextarea = document.getElementById('sw-theme');
    if (themeTextarea) settings.storyTheme = themeTextarea.value;

    const requirementsTextarea = document.getElementById('sw-requirements');
    if (requirementsTextarea) settings.specialRequirements = requirementsTextarea.value;

    // 获取复选框
    const summaryCheckbox = document.getElementById('sw-summary');
    if (summaryCheckbox) settings.includeSummary = summaryCheckbox.checked;

    const charactersCheckbox = document.getElementById('sw-characters');
    if (charactersCheckbox) settings.includeCharacters = charactersCheckbox.checked;

    const themesCheckbox = document.getElementById('sw-themes');
    if (themesCheckbox) settings.includeThemes = themesCheckbox.checked;

    return settings;
  } catch (error) {
    console.error('[SW] Failed to get current settings:', error);
    return {};
  }
}

/**
 * 初始化导入处理器
 */
function initializeImportHandler() {
  try {
    const importInput = document.getElementById('sw-import-file');
    if (!importInput) return;

    importInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const content = e.target.result;

          if (file.name.endsWith('.json')) {
            const data = JSON.parse(content);

            if (data.settings) {
              // 导入设置
              loadPresetSettings(data.settings);
              StoryWeaverErrorHandler.showNotification('设置已导入', 'success');
            } else if (data.presets) {
              // 导入预设
              const savedPresets = JSON.parse(localStorage.getItem('story_weaver_presets') || '{}');
              Object.assign(savedPresets, data.presets);
              localStorage.setItem('story_weaver_presets', JSON.stringify(savedPresets));
              loadPresetList();
              StoryWeaverErrorHandler.showNotification('预设已导入', 'success');
            } else if (data.preset) {
              // 导入单个预设
              const savedPresets = JSON.parse(localStorage.getItem('story_weaver_presets') || '{}');
              savedPresets[data.preset.name] = data.preset.data;
              localStorage.setItem('story_weaver_presets', JSON.stringify(savedPresets));
              loadPresetList();
              StoryWeaverErrorHandler.showNotification(`预设 "${data.preset.name}" 已导入`, 'success');
            }
          } else {
            // 处理文本文件
            const themeTextarea = document.getElementById('sw-theme');
            if (themeTextarea) {
              themeTextarea.value = content;
              StoryWeaverErrorHandler.showNotification('文本内容已导入到故事主题', 'success');
            }
          }
        } catch (error) {
          StoryWeaverErrorHandler.handleError(error, 'importFile');
        }
      };

      if (file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }

      // 清空input
      e.target.value = '';
    });

    console.log('[SW] Import handler initialized');
  } catch (error) {
    console.error('[SW] Failed to initialize import handler:', error);
  }
}

