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
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <h2 style="color: #667eea; margin-bottom: 20px; text-align: center;">📖 Story Weaver Enhanced</h2>
      
      <!-- 上下文设定区域 -->
      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="color: #495057; margin-bottom: 15px; font-size: 16px;">📖 剧情上下文设定</h3>
        
        <div style="display: flex; gap: 15px; margin-bottom: 15px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 13px;">对话历史长度：</label>
            <input type="number" id="sw-context-length" value="${settings.contextLength || 10}" min="0" max="50" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            <div style="font-size: 11px; color: #666; margin-top: 3px;">设置为0则不读取对话历史</div>
          </div>
          <div style="flex: 2;">
            <div style="display: flex; gap: 8px;">
              <button id="sw-refresh-data" onclick="refreshContextData()" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;" title="重新读取世界书和聊天历史数据">🔄 刷新数据</button>
              <button id="sw-preview-data" onclick="previewContextData()" style="padding: 8px 12px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;" title="查看当前可访问的上下文数据">👁️ 预览数据</button>
            </div>
            <div id="sw-context-status" style="font-size: 11px; color: #666; margin-top: 5px;">将根据设定自动读取最近的对话内容</div>
          </div>
        </div>
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">故事主题 / 核心冲突：</label>
        <textarea id="sw-theme" placeholder="例如：主角需要拯救被诅咒的王国，同时面对内心的恐惧与过去的阴霾..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;">${settings.storyTheme || ''}</textarea>
      </div>
      
      <div style="display: flex; gap: 15px; margin-bottom: 15px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">故事类型：</label>
          <select id="sw-type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
${Object.entries(STORY_TYPES).map(([k,v]) =>
              `<option value="${k}" ${k === settings.storyType ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">叙述风格：</label>
          <select id="sw-style" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
${Object.entries(STORY_STYLES).map(([k,v]) =>
              `<option value="${k}" ${k === settings.storyStyle ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div style="display: flex; gap: 15px; margin-bottom: 15px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">章节数量：</label>
          <input type="number" id="sw-chapters" value="${settings.chapterCount || 5}" min="3" max="20" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">详细程度：</label>
          <select id="sw-detail" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
${Object.entries(DETAIL_LEVELS).map(([k,v]) =>
              `<option value="${k}" ${k === settings.detailLevel ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">特殊要求：</label>
        <textarea id="sw-requirements" placeholder="任何特殊的剧情要求或风格偏好..." style="width: 100%; height: 60px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;">${settings.specialRequirements || ''}</textarea>
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
      
      <!-- 预设管理区域 -->
      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="color: #495057; margin-bottom: 15px; font-size: 16px;">💾 预设管理</h3>
        
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <select id="sw-preset-select" style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px;">
            <option value="">选择预设...</option>
          </select>
          <button onclick="loadSelectedPreset()" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">📁 加载</button>
          <button onclick="showSavePresetDialog()" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">💾 保存</button>
          <button onclick="showPresetManager()" style="padding: 8px 12px; background: #6f42c1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">⚙️ 管理</button>
        </div>
        
        <div style="font-size: 11px; color: #666;">
          预设包含所有故事设定、选项配置等完整信息
        </div>
      </div>
      
      <!-- 导入导出区域 -->
      <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <h3 style="color: #495057; margin-bottom: 15px; font-size: 16px;">📁 导入导出管理</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div style="text-align: center;">
            <input type="file" id="sw-import-file" accept=".json,.txt,.md" style="display: none;">
            <button onclick="document.getElementById('sw-import-file').click()" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;">📥 导入文件</button>
            <div style="font-size: 11px; color: #666; margin-top: 3px;">支持 JSON、TXT、MD 格式</div>
          </div>
          <div style="text-align: center;">
            <button onclick="showImportExportManager()" style="width: 100%; padding: 10px; background: #6f42c1; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 13px;">🔧 管理中心</button>
            <div style="font-size: 11px; color: #666; margin-top: 3px;">批量导入导出操作</div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 5px;">
          <button onclick="exportCurrentSettings()" style="padding: 6px 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">💾 导出设置</button>
          <button onclick="exportStoryOutline('txt')" style="padding: 6px 8px; background: #17a2b8; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">📄 导出TXT</button>
          <button onclick="exportStoryOutline('md')" style="padding: 6px 8px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">📝 导出MD</button>
          <button onclick="exportStoryOutline('json')" style="padding: 6px 8px; background: #fd7e14; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">🔧 导出JSON</button>
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
        <button onclick="copyNativeResult()" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">📋 复制</button>
        <button onclick="saveNativeResult()" style="padding: 8px 15px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">💾 保存</button>
        <button onclick="showExportOptions()" style="padding: 8px 15px; background: #6f42c1; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">📤 导出</button>
        <button onclick="generateChapterDetails()" style="padding: 8px 15px; background: #fd7e14; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">📝 章节细纲</button>
        <button onclick="showHelpModal()" style="padding: 8px 15px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">❓ 帮助</button>
      </div>
      
      <!-- 章节细纲区域 -->
      <div id="sw-chapter-details-section" style="display: none; margin-top: 20px; padding-top: 15px; border-top: 2px solid #e9ecef;">
        <h4 style="color: #495057; margin-bottom: 15px;">📝 章节细纲生成</h4>
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 13px;">选择章节:</label>
          <select id="sw-chapter-select" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;">
            <option value="">请先生成故事大纲...</option>
          </select>
          <button onclick="generateSelectedChapterDetail()" style="width: 100%; padding: 10px; background: #fd7e14; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">生成选中章节的细纲</button>
        </div>
        <div id="sw-chapter-detail-output" style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; min-height: 100px; font-family: 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; display: none;">
        </div>
        <div id="sw-chapter-detail-controls" style="display: none; margin-top: 10px; text-align: center;">
          <button onclick="copyChapterDetail()" style="padding: 8px 15px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">📋 复制细纲</button>
          <button onclick="saveChapterDetail()" style="padding: 8px 15px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">💾 保存细纲</button>
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
  return buildSimpleInterface(settings);
}

