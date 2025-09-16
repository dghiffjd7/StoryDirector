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
          
          outputContent.textContent = `生成失败: ${errorInfo.userMessage}\\n\\n提示：请确保您在SillyTavern的角色聊天页面，并且已连接到AI服务。`;
          outputSection.style.display = 'block';
          
          // Show notification
          ErrorHandler.showNotification(errorInfo.userMessage, 'error');
        } finally {
          btn.textContent = '🎯 生成故事大纲';
          btn.disabled = false;
        }
      }
      
      function buildNativePrompt(settings) {
        let prompt = `请为我生成一个${STORY_TYPES[settings.storyType] || settings.storyType}类型的故事大纲。`;
        
        if (settings.storyTheme) {
          prompt += `\n\n故事主题: ${settings.storyTheme}`;
        }
        
        prompt += `\n\n要求:
1. 包含${settings.chapterCount}个章节
2. 每章有明确的情节发展和冲突
3. 结构完整，逻辑清晰
4. 符合${STORY_STYLES[settings.storyStyle] || settings.storyStyle}的叙述风格
5. 详细程度: ${DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel}`;

        if (settings.specialRequirements) {
          prompt += `\n6. 特殊要求: ${settings.specialRequirements}`;
        }
        
        if (settings.includeSummary) {
          prompt += `\\n\\n请在大纲前提供故事摘要。`;
        }
        
        if (settings.includeCharacters) {
          prompt += `\\n\\n请包含主要角色的性格特点和发展弧线。`;
        }
        
        if (settings.includeThemes) {
          prompt += `\\n\\n请说明故事要探讨的核心主题。`;
        }
        
        prompt += `\\n\\n请生成结构完整、逻辑清晰的故事大纲。`;
        
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
          a.download = `story-outline-${new Date().getTime()\}.txt`;
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
          
          statusEl.innerHTML = `✅ 数据已刷新: ${worldCount}个世界书条目, 角色: ${charName\}, ${chatCount\}条对话`;
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
          const previewContent = `=== 上下文数据预览 ===
          
📖 世界书信息:
${worldInfo}

👤 角色信息:
姓名: ${characterData.name\}
性格: ${characterData.personality || '无设定'\}
描述: ${characterData.description || '无描述'\}
情境: ${characterData.scenario || '无情境'\}

💭 系统提示词:
${systemPrompt || '无系统提示词'\}

📝 记忆摘要:
${memorySummary || '无记忆摘要'\}

✍️ 作者注释:
${authorsNote || '无作者注释'\}

💬 对话历史 (最近${contextLength\}条):
${buildChatHistoryText(chatHistory, contextLength)\}`;

          // Show in new window or alert
          const newWindow = window.open('', '_blank', 'width=800,height=600');
          if (newWindow) {
            newWindow.document.write(`
              <html>
                <head>
                  <title>Story Weaver - 上下文数据预览</title>
                  <style>
                    body { font-family: monospace; padding: 20px; line-height: 1.6; }
                    pre { white-space: pre-wrap; word-wrap: break-word; }
                  </style>
                </head>
                <body>
                  <h2>📖 Story Weaver - 上下文数据预览</h2>
                  <pre>${previewContent\}</pre>
                </body>
              </html>
            `);
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
          
          alert(`预设 "${selectedName}" 已加载！`);
          console.log(`[SW] Preset "${selectedName}" applied to form`);
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
            alert(`预设 "${name.trim()}" 保存成功！`);
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
        
        let managerContent = `
          <div style="padding: 20px; font-family: -apple-system, sans-serif;">
            <h2>💾 预设管理器</h2>
            <div style="margin-bottom: 20px;">
              <input type="file" id="preset-import-input" accept=".json" style="display: none;">
              <button onclick="document.getElementById('preset-import-input').click()" style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 5px; margin-right: 10px;">📥 导入预设</button>
              <button onclick="exportAllPresets()" style="padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 5px;">📤 导出全部</button>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">预设名称</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">故事类型</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">保存时间</th>
                  <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">操作</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        presetList.forEach(name => {
          const preset = presets[name];
          const saveDate = new Date(preset.savedAt).toLocaleString();
          const storyType = STORY_TYPES[preset.storyType] || preset.storyType;
          
          managerContent += `
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;">${name}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${storyType}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${saveDate}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                <button onclick="exportSinglePreset('${name}')" style="padding: 4px 8px; background: #17a2b8; color: white; border: none; border-radius: 3px; margin-right: 5px;">导出</button>
                <button onclick="deleteSinglePreset('${name}')" style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px;">删除</button>
              </td>
            </tr>
          `;
        });
        
        managerContent += `
              </tbody>
            </table>
          </div>
          <script>
            document.getElementById('preset-import-input').addEventListener('change', function(e) {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                  const result = PresetManager.importPreset(e.target.result);
                  if (result.success) {
                    alert(`预设导入成功：${result.name}`);
                    window.location.reload();
                  } else {
                    alert('导入失败：' + result.error);
                  }
                };
                reader.readAsText(file);
              }
            });
            
            function exportSinglePreset(name) {
              PresetManager.exportPreset(name);
            }
            
            function deleteSinglePreset(name) {
              if (confirm(`确认删除预设 "${name}" 吗？`)) {
                if (PresetManager.deletePreset(name)) {
                  alert('删除成功');
                  window.location.reload();
                } else {
                  alert('删除失败');
                }
              }
            }
            
            function exportAllPresets() {
              const allPresets = PresetManager.getAllPresets();
              const exportData = {
                presets: allPresets,
                exportedAt: Date.now(),
                version: '2.0',
                type: 'StoryWeaverPresetsBundle'
              };
              
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                type: 'application/json' 
              });
              const url = URL.createObjectURL(blob);
              
              const a = document.createElement('a');
              a.href = url;
              a.download = `story-weaver-presets-all-${Date.now()}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          </script>
        `;
        
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
      <button class="btn btn-info" onclick="showHelpModal()">❓ 帮助</button>
      <button class="btn btn-success" onclick="refreshData()">🔄 刷新数据</button>
    </div>
    
    <div class="output-section">
      <label class="label">生成结果：</label>
      <div id="output-content" class="output-content">
        <div id="output-placeholder" style="color: #999; font-style: italic;">
          点击"生成故事大纲"开始创作您的故事...
        </div>
      </div>
      
      <div class="stats" id="output-stats" style="display: none;">
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 10px 0;">
          <div class="stat-item" style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 5px;">
            <div class="stat-label" style="font-size: 12px; color: #666; margin-bottom: 4px;">字数统计</div>
            <div id="word-count" class="stat-value" style="font-size: 16px; font-weight: bold; color: #007bff;">0</div>
          </div>
          <div class="stat-item" style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 5px;">
            <div class="stat-label" style="font-size: 12px; color: #666; margin-bottom: 4px;">生成时间</div>
            <div id="generation-time" class="stat-value" style="font-size: 16px; font-weight: bold; color: #28a745;">--</div>
          </div>
          <div class="stat-item" style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 5px;">
            <div class="stat-label" style="font-size: 12px; color: #666; margin-bottom: 4px;">章节数量</div>
            <div id="actual-chapters" class="stat-value" style="font-size: 16px; font-weight: bold; color: #fd7e14;">0</div>
          </div>
          <div class="stat-item" style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 5px;">
            <div class="stat-label" style="font-size: 12px; color: #666; margin-bottom: 4px;">平均章节长度</div>
            <div id="avg-chapter-length" class="stat-value" style="font-size: 16px; font-weight: bold; color: #6f42c1;">--</div>
          </div>
          <div class="stat-item" style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 5px;">
            <div class="stat-label" style="font-size: 12px; color: #666; margin-bottom: 4px;">创建时间</div>
            <div id="creation-time" class="stat-value" style="font-size: 16px; font-weight: bold; color: #17a2b8;">--</div>
          </div>
          <div class="stat-item" style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 5px;">
            <div class="stat-label" style="font-size: 12px; color: #666; margin-bottom: 4px;">故事类型</div>
            <div id="story-type-display" class="stat-value" style="font-size: 16px; font-weight: bold; color: #e83e8c;">--</div>
          </div>
        </div>
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
        const errorInfo = ErrorHandler.handleError(error, 'enhanced story generation', {
          allowRetry: true,
          retryAction: () => handleGenerate()
        });
        
        outputContent.textContent = `生成失败: ${errorInfo.userMessage}`;
        
        // Show notification
        ErrorHandler.showNotification(errorInfo.userMessage, 'error');
      } finally {
        // Restore button state
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
      }
    }
    
    function buildPrompt(settings) {
      let prompt = `请为我生成一个${STORY_TYPES[settings.storyType] || settings.storyType}类型的故事大纲。`;
      
      if (settings.storyTheme) {
        prompt += `\\n\\n故事主题: ${settings.storyTheme}`;
      }
      
      prompt += `\\n\\n要求:
1. 包含${settings.chapterCount}个章节
2. 每章有明确的情节发展和冲突
3. 结构完整，逻辑清晰
4. 符合${STORY_STYLES[settings.storyStyle] || settings.storyStyle}的叙述风格
5. 详细程度: ${DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel}`;

      if (settings.specialRequirements) {
        prompt += `\\n6. 特殊要求: ${settings.specialRequirements}`;
      }
      
      if (settings.includeSummary) {
        prompt += `\\n\\n请在大纲前提供故事摘要。`;
      }
      
      if (settings.includeCharacters) {
        prompt += `\\n\\n请包含主要角色的性格特点和发展弧线。`;
      }
      
      if (settings.includeThemes) {
        prompt += `\\n\\n请说明故事要探讨的核心主题。`;
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
              prompt += `\\n\\n当前角色: ${characterData.name}`;
              if (characterData.personality) {
                prompt += `\\n角色性格: ${characterData.personality}`;
              }
            }
            
            if (worldbookEntries && worldbookEntries.length > 0) {
              prompt += `\\n\\n世界设定:`;
              worldbookEntries.slice(0, 5).forEach(entry => {
                const key = entry.key || (entry.keys && entry.keys[0]) || '';
                const content = entry.content || entry.description || '';
                if (key && content) {
                  prompt += `\\n- ${key}: ${content.substring(0, 100)}...`;
                }
              });
            }
            
            if (chatHistory && chatHistory.length > 0) {
              prompt += `\\n\\n最近对话:`;
              chatHistory.slice(-3).forEach(msg => {
                const name = msg.name || msg.user || '';
                const content = (msg.mes || msg.message || '').substring(0, 100);
                if (name && content) {
                  prompt += `\\n[${name}]: ${content}...`;
                }
              });
            }
          }
        }
      } catch (e) {
        console.log('[SW] Context integration failed:', e);
      }
      
      prompt += `\\n\\n请生成结构完整、逻辑清晰的故事大纲。`;
      
      return prompt;
    }
    
    function updateStats(result, generationTime) {
      // Basic statistics
      const wordCount = result.length;
      const chapterMatches = result.match(/第[一二三四五六七八九十\\d]+章|Chapter \\d+|章节 \\d+/gi) || [];
      const actualChapters = chapterMatches.length;
      
      // Advanced statistics
      const avgChapterLength = actualChapters > 0 ? Math.round(wordCount / actualChapters) : 0;
      const creationTime = new Date().toLocaleString('zh-CN', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      // Get story type from form
      const storyTypeSelect = document.getElementById('story-type');
      const storyTypeText = storyTypeSelect ? storyTypeSelect.options[storyTypeSelect.selectedIndex].text : '--';
      
      // Update all statistics
      const elements = {
        'word-count': wordCount.toLocaleString(),
        'generation-time': `${Math.round(generationTime / 1000)}s`,
        'actual-chapters': actualChapters,
        'avg-chapter-length': avgChapterLength > 0 ? avgChapterLength.toLocaleString() : '--',
        'creation-time': creationTime,
        'story-type-display': storyTypeText.replace(/^[🏰💖🔍🚀🌸⚔️🎭👻😄🎨]\s*/, '')
      };
      
      // Update each element safely
      Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = value;
        }
      });
      
      // Show the statistics section
      const statsSection = document.getElementById('output-stats');
      if (statsSection) {
        statsSection.style.display = 'block';
      }
      
      console.log('[SW] Statistics updated:', {
        wordCount,
        actualChapters,
        avgChapterLength,
        generationTime: Math.round(generationTime / 1000)
      });
    }
    
    function copyResult() {
      if (currentResult) {
        navigator.clipboard.writeText(currentResult).then(() => {
          ErrorHandler.showNotification('结果已复制到剪贴板！', 'success', 3000);
        }).catch(err => {
          ErrorHandler.handleError(new StoryWeaverError('复制失败', 'CLIPBOARD_FAILED'), 'copy result');
        });
      } else {
        ErrorHandler.showNotification('没有可复制的内容', 'warning', 3000);
      }
    }
    
    function saveResult() {
      try {
        if (currentResult) {
          const blob = new Blob([currentResult], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `story-outline-${new Date().getTime()\}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          ErrorHandler.showNotification('文件已保存！', 'success', 3000);
        } else {
          ErrorHandler.showNotification('没有可保存的内容', 'warning', 3000);
        }
      } catch (error) {
        ErrorHandler.handleError(new StoryWeaverError('文件保存失败', 'EXPORT_FAILED'), 'save result');
      }
    }
    
    function sendToChat() {
      if (currentResult && typeof window.TavernHelper !== 'undefined') {
        const message = `## 📖 Story Outline Generated\\n\\n${currentResult\}`;
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
    
    // =================== CHAPTER DETAILS FUNCTIONS ===================
    
    function parseChaptersFromResult(result) {
      // Extract chapter titles from the generated outline
      const chapterRegex = /第[一二三四五六七八九十\d]+章[：:\s]*([^\n\r]+)|Chapter\s+(\d+)[：:\s]*([^\n\r]+)|章节\s*(\d+)[：:\s]*([^\n\r]+)/gi;
      const chapters = [];
      let match;
      
      while ((match = chapterRegex.exec(result)) !== null) {
        const chapterNumber = match[1] || match[2] || match[4] || chapters.length + 1;
        const chapterTitle = match[1] || match[3] || match[5] || '未命名章节';
        
        chapters.push({
          number: chapterNumber,
          title: chapterTitle.trim(),
          fullMatch: match[0]
        });
      }
      
      currentChapters = chapters;
      updateChapterSelect();
      console.log(`[SW] Parsed ${chapters.length} chapters from result`);
    }
    
    function updateChapterSelect() {
      const select = document.getElementById('sw-chapter-select');
      if (!select) return;
      
      select.innerHTML = '';
      
      if (currentChapters.length === 0) {
        select.innerHTML = '<option value="">未找到章节信息...</option>';
        return;
      }
      
      select.innerHTML = '<option value="">请选择章节...</option>';
      currentChapters.forEach((chapter, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `第${chapter.number}章: ${chapter.title}`;
        select.appendChild(option);
      });
    }
    
    function generateChapterDetails() {
      const detailsSection = document.getElementById('sw-chapter-details-section');
      if (detailsSection) {
        detailsSection.style.display = detailsSection.style.display === 'none' ? 'block' : 'none';
      }
    }
    
    async function generateSelectedChapterDetail() {
      const select = document.getElementById('sw-chapter-select');
      const output = document.getElementById('sw-chapter-detail-output');
      const controls = document.getElementById('sw-chapter-detail-controls');
      
      if (!select || !output || !controls) return;
      
      const selectedIndex = select.value;
      if (selectedIndex === '' || !currentChapters[selectedIndex]) {
        alert('请先选择一个章节');
        return;
      }
      
      const selectedChapter = currentChapters[selectedIndex];
      
      try {
        // Show loading state
        output.style.display = 'block';
        output.textContent = '正在生成章节细纲...';
        controls.style.display = 'none';
        
        // Build chapter detail prompt
        const chapterDetailPrompt = `
请为以下章节生成详细的细纲：

章节信息：第${selectedChapter.number}章: ${selectedChapter.title}

当前故事大纲上下文：
${nativeResult}

请生成这一章节的详细细纲，包括：
1. 章节概述
2. 主要情节点
3. 角色发展
4. 关键场景描述
5. 情感基调
6. 与整体故事的连接点

请确保细纲具体且可操作，适合作为写作指导。
        `;
        
        // Generate using TavernHelper
        let detailResult = '';
        if (typeof TavernHelper !== 'undefined' && TavernHelper.generateText) {
          detailResult = await TavernHelper.generateText(chapterDetailPrompt, { 
            max_tokens: 800,
            temperature: 0.8 
          });
        } else {
          // Fallback: simulate generation
          detailResult = `第${selectedChapter.number}章细纲：${selectedChapter.title}

章节概述：
这一章节将深入探索${selectedChapter.title}的核心内容，推进主线故事发展。

主要情节点：
• 开场：建立章节氛围和背景
• 发展：${selectedChapter.title}相关的关键事件
• 转折：出现新的挑战或发现
• 高潮：章节的情感或动作高点
• 结尾：为下一章节做铺垫

角色发展：
• 主角在本章节的成长和变化
• 重要配角的表现和作用
• 人物关系的演进

关键场景：
• 场景一：[具体场景描述]
• 场景二：[具体场景描述]
• 场景三：[具体场景描述]

情感基调：
本章节主要营造[具体情感氛围]的基调

与整体故事的连接：
• 承接上一章节的内容
• 为后续情节做准备
• 推进整体主题发展`;
        }
        
        selectedChapterDetail = detailResult;
        output.textContent = detailResult;
        controls.style.display = 'block';
        
      } catch (error) {
        const errorInfo = ErrorHandler.handleError(error, 'chapter detail generation', {
          allowRetry: true,
          retryAction: () => generateSelectedChapterDetail()
        });
        
        output.textContent = '章节细纲生成失败，请重试。';
        selectedChapterDetail = '';
        
        // Show notification
        ErrorHandler.showNotification(errorInfo.userMessage, 'error');
      }
    }
    
    function copyChapterDetail() {
      if (selectedChapterDetail) {
        navigator.clipboard.writeText(selectedChapterDetail).then(() => {
          ErrorHandler.showNotification('章节细纲已复制到剪贴板！', 'success', 3000);
        }).catch(err => {
          ErrorHandler.handleError(new StoryWeaverError('复制失败', 'CLIPBOARD_FAILED'), 'copy chapter detail');
        });
      } else {
        ErrorHandler.showNotification('没有可复制的章节细纲', 'warning', 3000);
      }
    }
    
    function saveChapterDetail() {
      try {
        if (selectedChapterDetail) {
          const select = document.getElementById('sw-chapter-select');
          const selectedIndex = select.value;
          const selectedChapter = currentChapters[selectedIndex];
          
          const blob = new Blob([selectedChapterDetail], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `chapter-${selectedChapter.number}-detail-${new Date().getTime()}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          ErrorHandler.showNotification('章节细纲已保存！', 'success', 3000);
        } else {
          ErrorHandler.showNotification('没有可保存的章节细纲', 'warning', 3000);
        }
      } catch (error) {
        ErrorHandler.handleError(new StoryWeaverError('章节细纲保存失败', 'EXPORT_FAILED'), 'save chapter detail');
      }
    }
    
    function exportToMarkdown() {
      if (nativeResult) {
        let markdownContent = `# Story Outline\\n\\n`;
        markdownContent += `**Generated at:** ${new Date().toLocaleString()}\\n\\n`;
        markdownContent += `## Main Outline\\n\\n${nativeResult}\\n\\n`;
        
        if (selectedChapterDetail) {
          markdownContent += `## Chapter Detail\\n\\n${selectedChapterDetail}\\n\\n`;
        }
        
        markdownContent += `---\\n*Generated by Story Weaver*`;
        
        const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `story-outline-${new Date().getTime()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Markdown文件已导出！');
      } else {
        alert('没有可导出的内容');
      }
    }
    
    // =================== ERROR HANDLING SYSTEM ===================
    
    class StoryWeaverError extends Error {
      constructor(message, code, details = null) {
        super(message);
        this.name = 'StoryWeaverError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
      }
    }
    
    const ErrorHandler = {
      // Error codes and user-friendly messages
      errorMessages: {
        'GENERATION_FAILED': '故事生成失败，请检查网络连接并重试',
        'CONTEXT_ACCESS_FAILED': '无法访问上下文数据，功能可能受限',
        'PRESET_SAVE_FAILED': '预设保存失败，请检查浏览器存储权限',
        'PRESET_LOAD_FAILED': '预设加载失败，文件可能已损坏',
        'CHAPTER_PARSE_FAILED': '章节解析失败，但大纲生成成功',
        'EXPORT_FAILED': '文件导出失败，请检查浏览器下载权限',
        'CLIPBOARD_FAILED': '复制到剪贴板失败，请手动选择文本复制',
        'TAVERNHELPER_NOT_AVAILABLE': 'TavernHelper不可用，请确保正确加载脚本',
        'SILLYTAVERN_NOT_READY': 'SillyTavern未就绪，请在角色聊天页面重试',
        'EMPTY_RESULT': '生成结果为空，请调整设置后重试',
        'INVALID_SETTINGS': '设置参数无效，请检查输入内容',
        'NETWORK_ERROR': '网络连接失败，请检查网络状态',
        'TIMEOUT_ERROR': '操作超时，请稍后重试',
        'UNKNOWN_ERROR': '发生未知错误，请稍后重试'
      },
      
      // Log error with context
      logError(error, context = '') {
        const errorInfo = {
          message: error.message,
          code: error.code || 'UNKNOWN_ERROR',
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        
        console.error('[SW] Error logged:', errorInfo);
        
        // Store error in localStorage for debugging
        try {
          const errors = JSON.parse(localStorage.getItem('storyWeaverErrors') || '[]');
          errors.push(errorInfo);
          // Keep only last 10 errors
          if (errors.length > 10) {
            errors.splice(0, errors.length - 10);
          }
          localStorage.setItem('storyWeaverErrors', JSON.stringify(errors));
        } catch (e) {
          console.warn('[SW] Failed to store error log:', e);
        }
        
        return errorInfo;
      },
      
      // Handle different types of errors
      handleError(error, context = '', options = {}) {
        const { showAlert = true, allowRetry = false, retryAction = null } = options;
        
        let errorCode = 'UNKNOWN_ERROR';
        let userMessage = this.errorMessages[errorCode];
        
        // Determine error type and appropriate message
        if (error instanceof StoryWeaverError) {
          errorCode = error.code;
          userMessage = this.errorMessages[errorCode] || error.message;
        } else if (error.message) {
          // Map common error patterns to our error codes
          const errorText = error.message.toLowerCase();
          if (errorText.includes('network') || errorText.includes('fetch')) {
            errorCode = 'NETWORK_ERROR';
          } else if (errorText.includes('timeout')) {
            errorCode = 'TIMEOUT_ERROR';
          } else if (errorText.includes('tavernhelper')) {
            errorCode = 'TAVERNHELPER_NOT_AVAILABLE';
          } else if (errorText.includes('clipboard')) {
            errorCode = 'CLIPBOARD_FAILED';
          } else if (errorText.includes('export') || errorText.includes('download')) {
            errorCode = 'EXPORT_FAILED';
          }
          userMessage = this.errorMessages[errorCode];
        }
        
        // Log the error
        this.logError(error, context);
        
        // Show user-friendly message
        if (showAlert) {
          if (allowRetry && retryAction && typeof retryAction === 'function') {
            const retry = confirm(`${userMessage}\\n\\n是否要重试？`);
            if (retry) {
              setTimeout(retryAction, 500);
              return;
            }
          } else {
            alert(userMessage);
          }
        }
        
        return { errorCode, userMessage };
      },
      
      // Wrap async functions with error handling
      async safeAsync(asyncFn, context = '', options = {}) {
        try {
          return await asyncFn();
        } catch (error) {
          this.handleError(error, context, options);
          throw error;
        }
      },
      
      // Create enhanced error notification system
      showNotification(message, type = 'error', duration = 5000) {
        const container = document.getElementById('notification-container') || this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `sw-notification sw-notification-${type}`;
        notification.innerHTML = `
          <div class="sw-notification-content">
            <span class="sw-notification-icon">${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
            <span class="sw-notification-message">${message}</span>
            <button class="sw-notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
          </div>
        `;
        
        // Add styles
        notification.style.cssText = `
          background: ${type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : type === 'success' ? '#d4edda' : '#d1ecf1'};
          border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : type === 'success' ? '#c3e6cb' : '#bee5eb'};
          color: ${type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : type === 'success' ? '#155724' : '#0c5460'};
          padding: 12px;
          margin: 5px 0;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: slideIn 0.3s ease-out;
          position: relative;
        `;
        
        container.appendChild(notification);
        
        // Auto remove after duration
        if (duration > 0) {
          setTimeout(() => {
            if (notification.parentElement) {
              notification.style.animation = 'slideOut 0.3s ease-in';
              setTimeout(() => notification.remove(), 300);
            }
          }, duration);
        }
        
        return notification;
      },
      
      createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          width: 350px;
          max-width: 90vw;
          z-index: 10000;
          pointer-events: none;
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
          .sw-notification { pointer-events: auto; }
          .sw-notification-close {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            padding: 0;
            margin-left: 10px;
          }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(container);
        return container;
      }
    };
    
    // =================== HELP SYSTEM ===================
    
    function showHelpModal() {
      const modal = document.createElement('div');
      modal.id = 'help-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white;
        width: 90%;
        max-width: 800px;
        max-height: 90%;
        border-radius: 10px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
      `;

      modalContent.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; font-size: 24px;">📖 Story Weaver 使用指南</h2>
          <button id="close-help" style="background: transparent; border: none; color: white; font-size: 24px; cursor: pointer; padding: 5px;">✕</button>
        </div>
        
        <div style="padding: 0; overflow-y: auto; flex: 1;">
          <div style="padding: 24px;">
            
            <div class="help-section" style="margin-bottom: 32px;">
              <h3 style="color: #667eea; margin-bottom: 16px; font-size: 20px;">🎯 核心功能</h3>
              
              <div style="display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #667eea;">
                  <h4 style="margin: 0 0 8px 0; color: #495057;">📝 智能故事生成</h4>
                  <p style="margin: 0; color: #666; font-size: 14px;">基于您的设定自动生成结构化故事大纲，支持多种类型和风格。</p>
                </div>
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #28a745;">
                  <h4 style="margin: 0 0 8px 0; color: #495057;">📚 章节细纲生成</h4>
                  <p style="margin: 0; color: #666; font-size: 14px;">为每个章节生成详细的细纲，包含情节点、角色发展等要素。</p>
                </div>
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #fd7e14;">
                  <h4 style="margin: 0 0 8px 0; color: #495057;">💾 预设管理</h4>
                  <p style="margin: 0; color: #666; font-size: 14px;">保存常用配置，支持导入导出，快速切换不同创作模式。</p>
                </div>
                <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #6f42c1;">
                  <h4 style="margin: 0 0 8px 0; color: #495057;">📊 智能统计</h4>
                  <p style="margin: 0; color: #666; font-size: 14px;">实时显示字数、章节数、平均长度等关键指标。</p>
                </div>
              </div>
            </div>

            <div class="help-section" style="margin-bottom: 32px;">
              <h3 style="color: #667eea; margin-bottom: 16px; font-size: 20px;">🔄 使用流程</h3>
              
              <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="display: flex; align-items: center; padding: 12px; background: #e3f2fd; border-radius: 8px;">
                  <div style="background: #2196f3; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">1</div>
                  <div><strong>设定故事类型和主题</strong> - 选择故事类型，描述核心冲突</div>
                </div>
                <div style="display: flex; align-items: center; padding: 12px; background: #e8f5e8; border-radius: 8px;">
                  <div style="background: #4caf50; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">2</div>
                  <div><strong>配置生成参数</strong> - 设置章节数、详细程度、叙事风格</div>
                </div>
                <div style="display: flex; align-items: center; padding: 12px; background: #fff3e0; border-radius: 8px;">
                  <div style="background: #ff9800; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">3</div>
                  <div><strong>点击生成按钮</strong> - 等待AI生成故事大纲</div>
                </div>
                <div style="display: flex; align-items: center; padding: 12px; background: #f3e5f5; border-radius: 8px;">
                  <div style="background: #9c27b0; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">4</div>
                  <div><strong>细化章节内容</strong> - 选择章节生成详细细纲</div>
                </div>
                <div style="display: flex; align-items: center; padding: 12px; background: #e0f2f1; border-radius: 8px;">
                  <div style="background: #009688; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px; font-weight: bold;">5</div>
                  <div><strong>导出和保存</strong> - 复制、保存文件或导出Markdown</div>
                </div>
              </div>
            </div>

            <div class="help-section" style="margin-bottom: 32px;">
              <h3 style="color: #667eea; margin-bottom: 16px; font-size: 20px;">💾 预设管理指南</h3>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h4 style="color: #495057; margin-bottom: 12px;">如何使用预设：</h4>
                <ul style="color: #666; margin: 0; padding-left: 20px;">
                  <li style="margin-bottom: 8px;"><strong>保存预设：</strong> 配置好所有参数后，点击"💾 保存"按钮，输入预设名称即可保存</li>
                  <li style="margin-bottom: 8px;"><strong>加载预设：</strong> 从下拉菜单选择预设，点击"📁 加载"立即应用配置</li>
                  <li style="margin-bottom: 8px;"><strong>预设管理：</strong> 点击"⚙️ 管理"可以重命名、删除、导入导出预设</li>
                  <li style="margin-bottom: 8px;"><strong>批量操作：</strong> 支持导出全部预设或批量导入预设包</li>
                </ul>
                
                <h4 style="color: #495057; margin: 16px 0 12px 0;">预设包含内容：</h4>
                <div style="background: #e9ecef; padding: 12px; border-radius: 6px; font-size: 13px; color: #495057;">
                  故事类型、主题设定、章节数量、详细程度、叙事风格、特殊要求、上下文长度、所有选项配置
                </div>
              </div>
            </div>

            <div class="help-section" style="margin-bottom: 32px;">
              <h3 style="color: #667eea; margin-bottom: 16px; font-size: 20px;">🔧 功能按钮说明</h3>
              
              <div style="display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                <div style="background: #28a745; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-align: center;">📋 复制 - 复制内容到剪贴板</div>
                <div style="background: #17a2b8; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-align: center;">💾 保存 - 下载为文本文件</div>
                <div style="background: #6f42c1; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-align: center;">📤 导出MD - 导出Markdown格式</div>
                <div style="background: #fd7e14; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-align: center;">📝 章节细纲 - 生成详细章节内容</div>
                <div style="background: #28a745; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-align: center;">🔄 刷新 - 重新读取上下文数据</div>
                <div style="background: #007bff; color: white; padding: 8px 12px; border-radius: 6px; font-size: 13px; text-align: center;">👁️ 预览 - 查看当前上下文数据</div>
              </div>
            </div>

            <div class="help-section" style="margin-bottom: 16px;">
              <h3 style="color: #667eea; margin-bottom: 16px; font-size: 20px;">⚠️ 注意事项</h3>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 16px; border-radius: 8px;">
                <ul style="margin: 0; padding-left: 20px; color: #856404;">
                  <li style="margin-bottom: 8px;">确保在SillyTavern的角色聊天页面使用，以获得最佳上下文集成</li>
                  <li style="margin-bottom: 8px;">生成过程可能需要一些时间，请耐心等待</li>
                  <li style="margin-bottom: 8px;">如遇到错误，可尝试刷新数据或重新生成</li>
                  <li style="margin-bottom: 8px;">预设数据保存在浏览器本地，清理浏览器数据时会丢失</li>
                  <li>建议定期导出重要预设进行备份</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Add animations
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);

      // Close event handlers
      modal.querySelector('#close-help').addEventListener('click', () => {
        modal.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => modal.remove(), 300);
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.animation = 'fadeOut 0.3s ease-in';
          setTimeout(() => modal.remove(), 300);
        }
      });

      // Add fadeOut animation
      const fadeOutStyle = document.createElement('style');
      fadeOutStyle.textContent = `
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `;
      document.head.appendChild(fadeOutStyle);
    }
    
    // =================== ADVANCED UI FUNCTIONS ===================
    
    async function refreshContextData() {
      const statusElement = document.getElementById('sw-context-status');
      const refreshBtn = document.getElementById('sw-refresh-data');
      
      if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = '🔄 刷新中...';
      }
      
      try {
        statusElement.textContent = '正在刷新数据...';
        statusElement.style.color = '#007bff';
        
        // Refresh world info data
        const worldInfo = await getWorldInfoData();
        const chatHistory = getChatHistory(10);
        const characterData = getCharacterData();
        
        let statusText = '数据已刷新：';
        let statusColor = '#28a745';
        
        if (worldInfo && worldInfo.length > 0) {
          statusText += ` 世界书(${worldInfo.length}条)`;
        } else {
          statusText += ' 世界书(无)';
          statusColor = '#ffc107';
        }
        
        if (chatHistory && chatHistory.length > 0) {
          statusText += ` 对话历史(${chatHistory.length}条)`;
        } else {
          statusText += ' 对话历史(无)';
        }
        
        if (characterData) {
          statusText += ' 角色数据(✓)';
        } else {
          statusText += ' 角色数据(无)';
          statusColor = '#ffc107';
        }
        
        statusElement.textContent = statusText;
        statusElement.style.color = statusColor;
        
        ErrorHandler.showNotification('上下文数据已刷新！', 'success', 3000);
        
      } catch (error) {
        statusElement.textContent = '数据刷新失败，请重试';
        statusElement.style.color = '#dc3545';
        ErrorHandler.handleError(error, 'refresh context data');
      } finally {
        if (refreshBtn) {
          refreshBtn.disabled = false;
          refreshBtn.textContent = '🔄 刷新数据';
        }
      }
    }
    
    async function previewContextData() {
      try {
        const contextLength = parseInt(document.getElementById('sw-context-length').value) || 10;
        
        // Collect all context data
        const worldInfo = await getWorldInfoData();
        const chatHistory = getChatHistory(contextLength);
        const characterData = getCharacterData();
        const systemPrompt = resolveSystemPrompt();
        
        // Create preview modal
        const modal = document.createElement('div');
        modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          animation: fadeIn 0.3s ease-out;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
          background: white;
          width: 90%;
          max-width: 900px;
          max-height: 90%;
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;
        
        modalContent.innerHTML = `
          <div style="background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0; font-size: 20px;">👁️ 上下文数据预览</h2>
            <button id="close-preview" style="background: transparent; border: none; color: white; font-size: 20px; cursor: pointer;">✕</button>
          </div>
          
          <div style="padding: 20px; overflow-y: auto; flex: 1;">
            <div style="margin-bottom: 20px;">
              <h3 style="color: #495057; margin-bottom: 10px;">📊 数据统计</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <div style="background: #e3f2fd; padding: 10px; border-radius: 5px; text-align: center;">
                  <div style="font-size: 18px; font-weight: bold; color: #1976d2;">${worldInfo ? worldInfo.length : 0}</div>
                  <div style="font-size: 12px; color: #666;">世界书条目</div>
                </div>
                <div style="background: #e8f5e8; padding: 10px; border-radius: 5px; text-align: center;">
                  <div style="font-size: 18px; font-weight: bold; color: #388e3c;">${chatHistory ? chatHistory.length : 0}</div>
                  <div style="font-size: 12px; color: #666;">对话历史</div>
                </div>
                <div style="background: #fff3e0; padding: 10px; border-radius: 5px; text-align: center;">
                  <div style="font-size: 18px; font-weight: bold; color: #f57c00;">${characterData ? '有' : '无'}</div>
                  <div style="font-size: 12px; color: #666;">角色数据</div>
                </div>
                <div style="background: #f3e5f5; padding: 10px; border-radius: 5px; text-align: center;">
                  <div style="font-size: 18px; font-weight: bold; color: #7b1fa2;">${systemPrompt ? '有' : '无'}</div>
                  <div style="font-size: 12px; color: #666;">系统提示词</div>
                </div>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #495057; margin-bottom: 10px;">🌍 世界书数据</h3>
              <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; max-height: 200px; overflow-y: auto;">
                ${worldInfo && worldInfo.length > 0 ? 
                  worldInfo.slice(0, 5).map(entry => (
                    '<div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 4px;">' +
                      '<strong style="color: #495057;">' + (entry.key || 'Unknown Key') + ':</strong>' +
                      '<div style="font-size: 13px; color: #666; margin-top: 4px;">' + ((entry.content || '').substring(0, 100)) + (entry.content && entry.content.length > 100 ? '...' : '') + '</div>' +
                    '</div>'
                  )).join('') + (worldInfo.length > 5 ? '<div style="text-align: center; color: #666; font-style: italic;">... 还有 ' + (worldInfo.length - 5) + ' 条数据</div>' : '')
                  : '<div style="color: #666; text-align: center; font-style: italic;">未检测到世界书数据</div>'
                }
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #495057; margin-bottom: 10px;">💬 对话历史</h3>
              <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px; max-height: 200px; overflow-y: auto;">
                ${chatHistory && chatHistory.length > 0 ? 
                  chatHistory.slice(-3).map(msg => (
                    '<div style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 4px;">' +
                      '<strong style="color: #495057;">' + (msg.name || msg.user || 'Unknown') + ':</strong>' +
                      '<div style="font-size: 13px; color: #666; margin-top: 4px;">' + ((msg.mes || msg.message || '').substring(0, 150)) + ((msg.mes || msg.message || '').length > 150 ? '...' : '') + '</div>' +
                    '</div>'
                  )).join('')
                  : '<div style="color: #666; text-align: center; font-style: italic;">未检测到对话历史</div>'
                }
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #495057; margin-bottom: 10px;">👤 角色数据</h3>
              <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 5px; padding: 15px;">
                ${characterData ? `
                  <div style="font-size: 13px; color: #495057;">
                    <strong>角色名称:</strong> ${characterData.name || '未知'}<br>
                    <strong>角色描述:</strong> ${(characterData.description || '').substring(0, 200)}${characterData.description && characterData.description.length > 200 ? '...' : ''}
                  </div>
                ` : '<div style="color: #666; text-align: center; font-style: italic;">未检测到角色数据</div>'}
              </div>
            </div>
          </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Close handlers
        modal.querySelector('#close-preview').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.remove();
        });
        
      } catch (error) {
        ErrorHandler.handleError(error, 'preview context data');
      }
    }
    
    // Enhanced form validation with real-time feedback
    function initializeFormValidation() {
      const storyTheme = document.getElementById('sw-story-theme');
      const chapterCount = document.getElementById('sw-chapter-count');
      
      if (storyTheme) {
        storyTheme.addEventListener('input', (e) => {
          const value = e.target.value.trim();
          let status = '';
          let color = '#666';
          
          if (value.length === 0) {
            status = '请输入故事主题以获得更好的生成效果';
            color = '#ffc107';
          } else if (value.length < 20) {
            status = '建议添加更多细节描述（当前 ' + value.length + ' 字）';
            color = '#17a2b8';
          } else if (value.length > 500) {
            status = '主题描述过长，建议精简（当前 ' + value.length + ' 字）';
            color = '#ffc107';
          } else {
            status = '主题描述良好（' + value.length + ' 字）';
            color = '#28a745';
          }
          
          // Update or create status element
          let statusEl = storyTheme.parentNode.querySelector('.theme-status');
          if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'theme-status';
            statusEl.style.cssText = 'font-size: 11px; margin-top: 4px;';
            storyTheme.parentNode.appendChild(statusEl);
          }
          statusEl.textContent = status;
          statusEl.style.color = color;
        });
      }
      
      if (chapterCount) {
        chapterCount.addEventListener('input', (e) => {
          const value = parseInt(e.target.value);
          let status = '';
          let color = '#666';
          
          if (value < 3) {
            status = '建议至少设置3个章节';
            color = '#ffc107';
          } else if (value > 15) {
            status = '章节过多可能影响生成质量';
            color = '#ffc107';
          } else {
            status = '章节数量合适';
            color = '#28a745';
          }
          
          // Update or create status element
          let statusEl = chapterCount.parentNode.querySelector('.chapter-status');
          if (!statusEl) {
            statusEl = document.createElement('div');
            statusEl.className = 'chapter-status';
            statusEl.style.cssText = 'font-size: 11px; margin-top: 4px;';
            chapterCount.parentNode.appendChild(statusEl);
          }
          statusEl.textContent = status;
          statusEl.style.color = color;
        });
      }
    }
    
    // Auto-save settings
    function setupAutoSave() {
      const formElements = [
        'sw-story-type', 'sw-story-theme', 'sw-story-style', 
        'sw-chapter-count', 'sw-detail-level', 'sw-special-requirements',
        'sw-context-length', 'sw-summary', 'sw-characters', 'sw-themes'
      ];
      
      formElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener('change', () => {
            setTimeout(() => {
              const settings = getCurrentSettings();
              localStorage.setItem('storyWeaverAutoSave', JSON.stringify(settings));
              
              // Show subtle feedback
              const feedback = document.createElement('div');
              feedback.textContent = '✓ 已自动保存';
              feedback.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(40, 167, 69, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 9999;
                animation: fadeInOut 2s ease-out;
              `;
              
              const style = document.createElement('style');
              style.textContent = `
                @keyframes fadeInOut {
                  0% { opacity: 0; transform: translateX(20px); }
                  20% { opacity: 1; transform: translateX(0); }
                  80% { opacity: 1; transform: translateX(0); }
                  100% { opacity: 0; transform: translateX(20px); }
                }
              `;
              document.head.appendChild(style);
              
              document.body.appendChild(feedback);
              setTimeout(() => feedback.remove(), 2000);
            }, 500);
          });
        }
      });
    }
    
    // Load auto-saved settings on startup
    function loadAutoSavedSettings() {
      try {
        const saved = localStorage.getItem('storyWeaverAutoSave');
        if (saved) {
          const settings = JSON.parse(saved);
          
          // Apply settings to form
          Object.entries(settings).forEach(([key, value]) => {
            const element = document.getElementById('sw-' + key.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (element) {
              if (element.type === 'checkbox') {
                element.checked = value;
              } else {
                element.value = value;
              }
            }
          });
          
          console.log('[SW] Auto-saved settings loaded');
        }
      } catch (error) {
        console.warn('[SW] Failed to load auto-saved settings:', error);
      }
    }
    
    // =================== IMPORT/EXPORT SYSTEM ===================
    
    function setupImportHandler() {
      const importInput = document.getElementById('sw-import-file');
      if (importInput) {
        importInput.addEventListener('change', handleFileImport);
      }
    }
    
    async function handleFileImport(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        const fileType = file.name.split('.').pop().toLowerCase();
        const content = await readFileContent(file);
        
        switch (fileType) {
          case 'json':
            await importJSONData(content, file.name);
            break;
          case 'txt':
            await importTextData(content, file.name);
            break;
          case 'md':
            await importMarkdownData(content, file.name);
            break;
          default:
            throw new Error('不支持的文件格式');
        }
        
        ErrorHandler.showNotification(`文件 "${file.name}" 导入成功！`, 'success');
        
      } catch (error) {
        ErrorHandler.handleError(error, 'file import');
      } finally {
        // Clear the input for next use
        event.target.value = '';
      }
    }
    
    function readFileContent(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsText(file);
      });
    }
    
    async function importJSONData(content, filename) {
      const data = JSON.parse(content);
      
      // Check data type and import accordingly
      if (data.type === 'StoryWeaverSettings') {
        // Import settings
        importSettings(data.settings);
        ErrorHandler.showNotification('设置配置已导入', 'success');
      } else if (data.type === 'StoryWeaverPreset' || data.presets) {
        // Import presets
        const importResult = PresetManager.importPreset(content);
        if (importResult.success) {
          loadPresetList();
          ErrorHandler.showNotification(`预设 "${importResult.name}" 已导入`, 'success');
        } else {
          throw new Error(importResult.error);
        }
      } else if (data.type === 'StoryWeaverProject') {
        // Import complete project
        importProject(data);
        ErrorHandler.showNotification('项目数据已导入', 'success');
      } else {
        throw new Error('无法识别的JSON格式');
      }
    }
    
    async function importTextData(content, filename) {
      // Import as story theme if it's short enough, otherwise show options
      if (content.length < 1000) {
        const themeInput = document.getElementById('sw-story-theme');
        if (themeInput) {
          themeInput.value = content.trim();
          ErrorHandler.showNotification('文本已导入为故事主题', 'success');
        }
      } else {
        // Show import options for longer text
        showTextImportOptions(content, filename);
      }
    }
    
    async function importMarkdownData(content, filename) {
      // Parse markdown and extract story data
      const sections = parseMarkdownContent(content);
      
      if (sections.title) {
        const themeInput = document.getElementById('sw-story-theme');
        if (themeInput && !themeInput.value.trim()) {
          themeInput.value = sections.title;
        }
      }
      
      if (sections.outline) {
        nativeResult = sections.outline;
        displayImportedStory(sections.outline);
        parseChaptersFromResult(sections.outline);
      }
      
      ErrorHandler.showNotification('Markdown文件已解析并导入', 'success');
    }
    
    function parseMarkdownContent(content) {
      const sections = {};
      
      // Extract title (first # heading)
      const titleMatch = content.match(/^#\s+(.+)/m);
      if (titleMatch) {
        sections.title = titleMatch[1].trim();
      }
      
      // Extract story outline (content between ## Story Outline or similar)
      const outlineMatch = content.match(/##\s*(?:Story Outline|故事大纲|Main Outline)\s*\n([\s\S]*?)(?=\n##|\n---|\n\*|$)/i);
      if (outlineMatch) {
        sections.outline = outlineMatch[1].trim();
      } else {
        // If no specific section found, use the whole content except title
        sections.outline = content.replace(/^#\s+.+\n?/m, '').trim();
      }
      
      return sections;
    }
    
    function displayImportedStory(content) {
      const outputContent = document.getElementById('sw-output-content');
      const outputSection = document.getElementById('sw-output-section');
      const outputControls = document.getElementById('sw-output-controls');
      
      if (outputContent) {
        outputContent.textContent = content;
        if (outputSection) outputSection.style.display = 'block';
        if (outputControls) outputControls.style.display = 'block';
        
        // Update statistics
        updateStats(content, 0);
      }
    }
    
    function showTextImportOptions(content, filename) {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center;
        z-index: 10000;
      `;
      
      modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; width: 90%;">
          <h3 style="margin-top: 0; color: #495057;">📥 文本导入选项</h3>
          <p style="color: #666; margin-bottom: 20px;">文件："${filename}" (${content.length} 字符)</p>
          
          <div style="margin-bottom: 15px;">
            <button onclick="importAsTheme('${btoa(content)}')" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; margin-bottom: 10px; cursor: pointer;">
              导入为故事主题
            </button>
            <button onclick="importAsStory('${btoa(content)}')" style="width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px; margin-bottom: 10px; cursor: pointer;">
              导入为故事大纲
            </button>
            <button onclick="importAsRequirements('${btoa(content)}')" style="width: 100%; padding: 10px; background: #fd7e14; color: white; border: none; border-radius: 5px; margin-bottom: 10px; cursor: pointer;">
              导入为特殊要求
            </button>
          </div>
          
          <button onclick="this.closest('.modal').remove()" style="width: 100%; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
            取消
          </button>
        </div>
      `;
      
      modal.className = 'modal';
      document.body.appendChild(modal);
      
      // Add global functions for import options
      window.importAsTheme = (encodedContent) => {
        const content = atob(encodedContent);
        const themeInput = document.getElementById('sw-story-theme');
        if (themeInput) themeInput.value = content.trim();
        modal.remove();
        ErrorHandler.showNotification('已导入为故事主题', 'success');
      };
      
      window.importAsStory = (encodedContent) => {
        const content = atob(encodedContent);
        displayImportedStory(content);
        modal.remove();
        ErrorHandler.showNotification('已导入为故事大纲', 'success');
      };
      
      window.importAsRequirements = (encodedContent) => {
        const content = atob(encodedContent);
        const reqInput = document.getElementById('sw-special-requirements');
        if (reqInput) reqInput.value = content.trim();
        modal.remove();
        ErrorHandler.showNotification('已导入为特殊要求', 'success');
      };
    }
    
    function exportCurrentSettings() {
      try {
        const settings = getCurrentSettings();
        const exportData = {
          type: 'StoryWeaverSettings',
          version: '2.0',
          exportedAt: new Date().toISOString(),
          settings: settings
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `story-weaver-settings-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        ErrorHandler.showNotification('设置已导出！', 'success');
      } catch (error) {
        ErrorHandler.handleError(error, 'export settings');
      }
    }
    
    function exportStoryOutline(format) {
      if (!nativeResult) {
        ErrorHandler.showNotification('没有可导出的故事内容', 'warning');
        return;
      }
      
      try {
        let content, filename, mimeType;
        
        switch (format) {
          case 'txt':
            content = nativeResult;
            filename = `story-outline-${Date.now()}.txt`;
            mimeType = 'text/plain';
            break;
            
          case 'md':
            content = generateMarkdownContent();
            filename = `story-outline-${Date.now()}.md`;
            mimeType = 'text/markdown';
            break;
            
          case 'json':
            content = JSON.stringify(generateProjectData(), null, 2);
            filename = `story-project-${Date.now()}.json`;
            mimeType = 'application/json';
            break;
            
          default:
            throw new Error('不支持的导出格式');
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        ErrorHandler.showNotification(`${format.toUpperCase()}文件已导出！`, 'success');
      } catch (error) {
        ErrorHandler.handleError(error, `export ${format}`);
      }
    }
    
    function generateMarkdownContent() {
      const settings = getCurrentSettings();
      let markdown = `# Story Outline\\n\\n`;
      
      markdown += `**Generated at:** ${new Date().toLocaleString()}\\n`;
      markdown += `**Story Type:** ${settings.storyType}\\n`;
      markdown += `**Chapters:** ${settings.chapterCount}\\n`;
      markdown += `**Detail Level:** ${settings.detailLevel}\\n\\n`;
      
      if (settings.storyTheme) {
        markdown += `## Story Theme\\n\\n${settings.storyTheme}\\n\\n`;
      }
      
      markdown += `## Main Outline\\n\\n${nativeResult}\\n\\n`;
      
      if (selectedChapterDetail) {
        markdown += `## Chapter Detail\\n\\n${selectedChapterDetail}\\n\\n`;
      }
      
      if (settings.specialRequirements) {
        markdown += `## Special Requirements\\n\\n${settings.specialRequirements}\\n\\n`;
      }
      
      markdown += `---\\n*Generated by Story Weaver*`;
      
      return markdown;
    }
    
    function generateProjectData() {
      const settings = getCurrentSettings();
      return {
        type: 'StoryWeaverProject',
        version: '2.0',
        exportedAt: new Date().toISOString(),
        settings: settings,
        storyOutline: nativeResult,
        chapterDetails: selectedChapterDetail,
        chapters: currentChapters,
        statistics: {
          wordCount: nativeResult ? nativeResult.length : 0,
          chapterCount: currentChapters.length,
          avgChapterLength: currentChapters.length > 0 ? Math.round((nativeResult?.length || 0) / currentChapters.length) : 0
        }
      };
    }
    
    function showExportOptions() {
      if (!nativeResult) {
        ErrorHandler.showNotification('没有可导出的内容', 'warning');
        return;
      }
      
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center;
        z-index: 10000;
      `;
      
      modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; max-width: 400px; width: 90%;">
          <h3 style="margin-top: 0; color: #495057;">📤 导出选项</h3>
          
          <div style="margin-bottom: 15px;">
            <button onclick="exportStoryOutline('txt'); this.closest('.modal').remove()" style="width: 100%; padding: 10px; background: #17a2b8; color: white; border: none; border-radius: 5px; margin-bottom: 8px; cursor: pointer;">
              📄 导出为TXT文件
            </button>
            <button onclick="exportStoryOutline('md'); this.closest('.modal').remove()" style="width: 100%; padding: 10px; background: #6f42c1; color: white; border: none; border-radius: 5px; margin-bottom: 8px; cursor: pointer;">
              📝 导出为Markdown
            </button>
            <button onclick="exportStoryOutline('json'); this.closest('.modal').remove()" style="width: 100%; padding: 10px; background: #fd7e14; color: white; border: none; border-radius: 5px; margin-bottom: 8px; cursor: pointer;">
              🔧 导出为JSON项目
            </button>
            <button onclick="exportCurrentSettings(); this.closest('.modal').remove()" style="width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px; margin-bottom: 8px; cursor: pointer;">
              💾 导出当前设置
            </button>
          </div>
          
          <button onclick="this.closest('.modal').remove()" style="width: 100%; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
            取消
          </button>
        </div>
      `;
      
      modal.className = 'modal';
      document.body.appendChild(modal);
    }
    
    function showImportExportManager() {
      // This opens a comprehensive import/export management window
      const managerContent = `
        <div style="padding: 20px; font-family: -apple-system, sans-serif;">
          <h2>📁 导入导出管理中心</h2>
          
          <div style="margin-bottom: 20px;">
            <h3>📥 批量导入</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <input type="file" id="batch-import" multiple accept=".json,.txt,.md" style="margin-bottom: 10px;">
              <button onclick="handleBatchImport()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 5px;">批量导入文件</button>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3>📤 批量导出</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
              <button onclick="exportEverything()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 5px; margin-right: 10px;">导出全部数据</button>
              <button onclick="exportAllPresets()" style="padding: 8px 16px; background: #6f42c1; color: white; border: none; border-radius: 5px;">导出所有预设</button>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3>🔧 数据管理</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
              <button onclick="clearAllData()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 5px; margin-right: 10px;">清除所有数据</button>
              <button onclick="resetToDefault()" style="padding: 8px 16px; background: #ffc107; color: black; border: none; border-radius: 5px;">重置为默认</button>
            </div>
          </div>
        </div>
      `;
      
      const newWindow = window.open('', '_blank', 'width=600,height=500');
      if (newWindow) {
        newWindow.document.write(managerContent);
        newWindow.document.close();
      } else {
        alert('无法打开管理窗口，请允许弹窗');
      }
    }
    
    function importSettings(settings) {
      Object.entries(settings).forEach(([key, value]) => {
        const element = document.getElementById('sw-' + key.replace(/([A-Z])/g, '-$1').toLowerCase());
        if (element) {
          if (element.type === 'checkbox') {
            element.checked = value;
          } else {
            element.value = value;
          }
        }
      });
    }
    
    function importProject(projectData) {
      // Import settings
      if (projectData.settings) {
        importSettings(projectData.settings);
      }
      
      // Import story outline
      if (projectData.storyOutline) {
        nativeResult = projectData.storyOutline;
        displayImportedStory(projectData.storyOutline);
      }
      
      // Import chapter details
      if (projectData.chapterDetails) {
        selectedChapterDetail = projectData.chapterDetails;
      }
      
      // Import chapters
      if (projectData.chapters) {
        currentChapters = projectData.chapters;
        updateChapterSelect();
      }
    }
    
    // =================== USER INTERACTION OPTIMIZATION ===================
    
    function setupKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        // Ctrl+Enter or Cmd+Enter to generate
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          const generateBtn = document.getElementById('sw-generate-btn');
          if (generateBtn && !generateBtn.disabled) {
            handleNativeGenerate();
          }
        }
        
        // Ctrl+S or Cmd+S to save settings
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          exportCurrentSettings();
        }
        
        // Ctrl+Shift+C to copy result
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
          e.preventDefault();
          if (nativeResult) {
            copyNativeResult();
          }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
          const modals = document.querySelectorAll('.modal, #help-modal');
          modals.forEach(modal => modal.remove());
        }
        
        // F1 to show help
        if (e.key === 'F1') {
          e.preventDefault();
          showHelpModal();
        }
      });
    }
    
    function setupProgressIndicators() {
      // Add progress indicator styles
      const style = document.createElement('style');
      style.textContent = `
        .sw-progress-bar {
          width: 100%;
          height: 4px;
          background: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
          margin: 10px 0;
        }
        
        .sw-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 2px;
          transition: width 0.3s ease;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .sw-loading-dots {
          display: inline-block;
        }
        
        .sw-loading-dots::after {
          content: '';
          animation: loadingDots 1.5s steps(4, end) infinite;
        }
        
        @keyframes loadingDots {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
        
        .sw-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .sw-bounce-in {
          animation: bounceIn 0.6s ease-out;
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .sw-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        
        .sw-slide-up {
          animation: slideUp 0.4s ease-out;
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .sw-tooltip {
          position: relative;
          cursor: help;
        }
        
        .sw-tooltip::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
          z-index: 1000;
        }
        
        .sw-tooltip:hover::after {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
    
    function enhanceButtons() {
      // Add hover effects and animations to all buttons
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
          button.style.transform = 'translateY(-1px)';
          button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
          button.style.transition = 'all 0.2s ease';
        });
        
        button.addEventListener('mouseleave', () => {
          button.style.transform = 'translateY(0)';
          button.style.boxShadow = 'none';
        });
        
        button.addEventListener('click', () => {
          button.style.transform = 'scale(0.95)';
          setTimeout(() => {
            button.style.transform = 'translateY(-1px)';
          }, 100);
        });
      });
    }
    
    function addContextualHelp() {
      // Add tooltips to key elements
      const tooltips = {
        'sw-story-type': '选择故事类型会影响生成的风格和内容方向',
        'sw-chapter-count': '推荐3-10章，章节过多可能影响整体连贯性',
        'sw-detail-level': '详细程度影响每章节的内容深度',
        'sw-context-length': '读取最近的对话历史，0为不读取',
        'sw-generate-btn': '快捷键：Ctrl+Enter',
        'sw-refresh-data': '重新读取世界书和聊天历史数据',
        'sw-preview-data': '查看当前可获取的上下文信息'
      };
      
      Object.entries(tooltips).forEach(([id, tooltip]) => {
        const element = document.getElementById(id);
        if (element) {
          element.setAttribute('data-tooltip', tooltip);
          element.classList.add('sw-tooltip');
        }
      });
    }
    
    function setupSmartWorkflow() {
      // Auto-focus on story theme when opening
      setTimeout(() => {
        const storyTheme = document.getElementById('sw-story-theme');
        if (storyTheme && !storyTheme.value.trim()) {
          storyTheme.focus();
        }
      }, 500);
      
      // Smart tab navigation
      const formElements = [
        'sw-story-type', 'sw-story-theme', 'sw-story-style',
        'sw-chapter-count', 'sw-detail-level', 'sw-special-requirements'
      ];
      
      formElements.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) {
          element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
              // Auto-advance workflow suggestions
              if (index === 1 && element.value.trim() && element.value.length > 50) {
                // If story theme is substantial, suggest proceeding
                setTimeout(() => {
                  showWorkflowSuggestion('主题描述很详细！现在可以设置章节数量或直接生成大纲。');
                }, 100);
              }
            }
          });
        }
      });
    }
    
    function showWorkflowSuggestion(message) {
      const suggestion = document.createElement('div');
      suggestion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        max-width: 300px;
        font-size: 13px;
        z-index: 9999;
        animation: slideIn 0.4s ease-out;
      `;
      
      suggestion.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="flex: 1; margin-right: 10px;">
            <div style="font-weight: bold; margin-bottom: 4px;">💡 智能建议</div>
            <div>${message}</div>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 16px; cursor: pointer; padding: 0; margin-left: 8px;">✕</button>
        </div>
      `;
      
      document.body.appendChild(suggestion);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (suggestion.parentElement) {
          suggestion.style.animation = 'slideOut 0.3s ease-in';
          setTimeout(() => suggestion.remove(), 300);
        }
      }, 8000);
    }
    
    function enhanceFormInteractions() {
      // Add character counter for text areas
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        const counter = document.createElement('div');
        counter.style.cssText = 'font-size: 11px; color: #666; text-align: right; margin-top: 2px;';
        textarea.parentNode.appendChild(counter);
        
        const updateCounter = () => {
          const length = textarea.value.length;
          const maxLength = textarea.getAttribute('maxlength') || 1000;
          counter.textContent = `${length}/${maxLength} 字符`;
          
          if (length > maxLength * 0.9) {
            counter.style.color = '#ffc107';
          } else if (length > maxLength * 0.95) {
            counter.style.color = '#dc3545';
          } else {
            counter.style.color = '#666';
          }
        };
        
        textarea.addEventListener('input', updateCounter);
        updateCounter();
      });
      
      // Add focus/blur animations
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          input.style.boxShadow = '0 0 0 2px rgba(102, 126, 234, 0.25)';
          input.style.borderColor = '#667eea';
          input.style.transition = 'all 0.2s ease';
        });
        
        input.addEventListener('blur', () => {
          input.style.boxShadow = 'none';
          input.style.borderColor = '#ddd';
        });
      });
    }
    
    function setupGenerationProgress() {
      // Enhanced generation progress tracking
      const originalGenerate = handleNativeGenerate;
      window.handleNativeGenerate = async function() {
        const btn = document.getElementById('sw-generate-btn');
        const outputSection = document.getElementById('sw-output-section');
        
        // Create progress indicator
        const progressContainer = document.createElement('div');
        progressContainer.id = 'sw-generation-progress';
        progressContainer.style.cssText = 'margin: 15px 0;';
        progressContainer.innerHTML = `
          <div style="text-align: center; margin-bottom: 10px;">
            <span class="sw-loading-dots">正在生成故事大纲</span>
          </div>
          <div class="sw-progress-bar">
            <div class="sw-progress-fill" style="width: 0%"></div>
          </div>
          <div style="font-size: 11px; color: #666; text-align: center; margin-top: 5px;">
            这可能需要几秒钟到几分钟时间，具体取决于复杂程度...
          </div>
        `;
        
        if (outputSection) {
          outputSection.parentNode.insertBefore(progressContainer, outputSection);
        }
        
        // Simulate progress updates
        const progressFill = progressContainer.querySelector('.sw-progress-fill');
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress > 90) progress = 90;
          progressFill.style.width = progress + '%';
        }, 500);
        
        try {
          await originalGenerate();
          
          // Complete progress
          clearInterval(progressInterval);
          progressFill.style.width = '100%';
          
          setTimeout(() => {
            if (progressContainer.parentElement) {
              progressContainer.style.animation = 'fadeOut 0.3s ease-in';
              setTimeout(() => progressContainer.remove(), 300);
            }
          }, 1000);
          
        } catch (error) {
          clearInterval(progressInterval);
          progressContainer.remove();
          throw error;
        }
      };
    }
    
    function addQuickActions() {
      // Add quick action floating panel
      const quickActions = document.createElement('div');
      quickActions.id = 'sw-quick-actions';
      quickActions.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 50px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        padding: 8px;
        display: flex;
        gap: 8px;
        z-index: 9998;
        transform: translateY(100px);
        transition: transform 0.3s ease;
      `;
      
      quickActions.innerHTML = `
        <button onclick="showHelpModal()" style="width: 40px; height: 40px; border: none; border-radius: 50%; background: #007bff; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="帮助 (F1)">❓</button>
        <button onclick="exportCurrentSettings()" style="width: 40px; height: 40px; border: none; border-radius: 50%; background: #28a745; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="快速导出设置 (Ctrl+S)">💾</button>
        <button onclick="refreshContextData()" style="width: 40px; height: 40px; border: none; border-radius: 50%; background: #17a2b8; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="刷新数据">🔄</button>
      `;
      
      document.body.appendChild(quickActions);
      
      // Show after delay
      setTimeout(() => {
        quickActions.style.transform = 'translateY(0)';
      }, 1000);
    }
    
    function setupAdvancedAnimations() {
      // Add entrance animations for sections
      const sections = document.querySelectorAll('[style*="background: #f8f9fa"]');
      sections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
          section.style.opacity = '1';
          section.style.transform = 'translateY(0)';
        }, index * 100 + 200);
      });
      
      // Add result display animation
      const originalUpdateStats = updateStats;
      window.updateStats = function(result, generationTime) {
        originalUpdateStats(result, generationTime);
        
        // Animate statistics cards
        const statsSection = document.getElementById('output-stats');
        if (statsSection) {
          statsSection.classList.add('sw-bounce-in');
        }
      };
    }
    
    // Initialize all UX optimizations
    setTimeout(() => {
      initializeFormValidation();
      setupAutoSave();
      loadAutoSavedSettings();
      setupImportHandler();
      setupKeyboardShortcuts();
      setupProgressIndicators();
      enhanceButtons();
      addContextualHelp();
      setupSmartWorkflow();
      enhanceFormInteractions();
      setupGenerationProgress();
      addQuickActions();
      setupAdvancedAnimations();
      refreshContextData();
      
      // Show welcome message for new users
      if (!localStorage.getItem('storyWeaverWelcomeShown')) {
        setTimeout(() => {
          showWorkflowSuggestion('欢迎使用 Story Weaver！按 F1 查看使用说明，Ctrl+Enter 快速生成。');
          localStorage.setItem('storyWeaverWelcomeShown', 'true');
        }, 2000);
      }
    }, 100);
  </script>
</body>
</html>
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
          console.log(`[SW] Found ${entries.length} worldbook entries via TavernHelper`);
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
                console.log(`[SW] Loaded ${entries.length} entries from world: ${worldName}`);
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
          console.log(`[SW] Found ${worldEntries.length} world info entries via global access`);
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
          console.log(`[SW] Found ${worldEntries.length} world info entries via top window`);
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
      return `**${title}${world}**\\n${entry.content}`;
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
          console.log(`[SW] Got ${history.length} chat messages via TavernHelper`);
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
        console.log(`[SW] Got ${recentChat.length} chat messages via global access`);
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
      return `${role} ${name}: ${content}`;
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
      enhancedPrompt += `\\n**故事主题**: ${settings.storyTheme}`;
    }
    
    if (settings.specialRequirements) {
      enhancedPrompt += `\\n**特殊要求**: ${settings.specialRequirements}`;
    }
    
    enhancedPrompt += `\n\n### GENERATION REQUIREMENTS ###
请基于以上所有信息生成故事大纲，要求：
1. 包含${settings.chapterCount}个章节
2. 每章有明确的情节发展和冲突
3. 结构完整，逻辑清晰
4. 符合${STORY_STYLES[settings.storyStyle] || settings.storyStyle}的叙述风格
5. 详细程度: ${DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel}`;

    if (settings.includeSummary) {
      enhancedPrompt += `\\n\\n请在大纲前提供故事摘要。`;
    }
    
    if (settings.includeCharacters) {
      enhancedPrompt += `\\n\\n请包含主要角色的性格特点和发展弧线。`;
    }
    
    if (settings.includeThemes) {
      enhancedPrompt += `\\n\\n请说明故事要探讨的核心主题。`;
    }
    
    enhancedPrompt += `\\n\\n请生成结构完整、逻辑清晰的故事大纲。`;
    
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
    prompt += `\\n\\n故事主题: ${settings.storyTheme}`;
  }
  
  prompt += `\\n\\n要求:\n1. 包含${settings.chapterCount}个章节\n2. 每章有明确的情节发展和冲突\n3. 结构完整，逻辑清晰\n4. 符合${STORY_STYLES[settings.storyStyle] || settings.storyStyle}的叙述风格\n5. 详细程度: ${DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel}`;

  if (settings.specialRequirements) {
    prompt += `\\n6. 特殊要求: ${settings.specialRequirements}`;
  }
  
  if (settings.includeSummary) {
    prompt += `\\n\\n请在大纲前提供故事摘要。`;
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
      console.log(`[SW] Preset "${name}" saved successfully`);
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
        console.log(`[SW] Preset "${name}" loaded successfully`);
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
        console.log(`[SW] Preset "${name}" deleted successfully`);
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
      
      console.log(`[SW] Preset "${name}" exported successfully`);
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
        finalName = `${importData.name}_${counter}`;
        counter++;
      }
      
      // Save the preset
      const success = this.savePreset(finalName, importData.preset);
      if (success) {
        console.log(`[SW] Preset imported as "${finalName}"`);
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
    TavernHelper.sendMessage(`## 📖 Quick Story Outline\\n\\n${result}`);
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