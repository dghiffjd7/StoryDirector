/**
 * Story Weaver - Enhanced TavernHelper Version with Floating Spirit Ball
 * Auto-loads floating spirit ball when imported, maintains original extension UX
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

// ========================= FLOATING SPIRIT BALL =========================

/**
 * Create and initialize the floating spirit ball
 */
function createFloatingSpiritBall() {
  console.log('[SW] Creating floating spirit ball...');
  
  // Check if document.body exists
  if (!document.body) {
    console.warn('[SW] document.body not ready, retrying in 100ms...');
    setTimeout(createFloatingSpiritBall, 100);
    return;
  }
  
  // Remove existing spirit ball if present
  const existing = document.getElementById('story-weaver-spirit');
  if (existing) {
    console.log('[SW] Removing existing spirit ball');
    existing.remove();
  }

  // Create spirit ball container
  const spiritBall = document.createElement('div');
  spiritBall.id = 'story-weaver-spirit';
  spiritBall.className = 'sw-spirit-ball';
  
  // Spirit ball HTML with animations
  spiritBall.innerHTML = `
    <div class="sw-spirit-inner">
      <div class="sw-spirit-icon">📖</div>
      <div class="sw-spirit-glow"></div>
      <div class="sw-spirit-pulse"></div>
    </div>
    <div class="sw-spirit-tooltip">Story Weaver<br>故事大纲生成器</div>
  `;

  // Add spirit ball styles
  const styles = document.createElement('style');
  styles.id = 'story-weaver-spirit-styles';
  styles.textContent = getSpiritBallCSS();
  
  // Remove existing styles first
  const existingStyles = document.getElementById('story-weaver-spirit-styles');
  if (existingStyles) {
    existingStyles.remove();
  }
  
  document.head.appendChild(styles);
  console.log('[SW] Spirit ball styles added');

  // Add to document body
  document.body.appendChild(spiritBall);
  console.log('[SW] Spirit ball added to DOM');

  // Make draggable and clickable
  makeSpiritBallInteractive(spiritBall);

  // Auto-position in bottom-right corner
  positionSpiritBall(spiritBall);

  // Add entrance animation
  setTimeout(() => {
    spiritBall.classList.add('sw-spirit-visible');
  }, 500);

  console.log('[SW] Spirit Ball created and ready!');
  showWelcomeNotification();
}

/**
 * CSS styles for the spirit ball
 */
function getSpiritBallCSS() {
  return `
    /* Story Weaver Spirit Ball Styles */
    .sw-spirit-ball {
      position: fixed;
      width: 60px;
      height: 60px;
      z-index: 9999;
      cursor: pointer;
      user-select: none;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      bottom: 30px;
      right: 30px;
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

    /* Tooltip */
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

    /* Minimized state */
    .sw-spirit-ball.sw-spirit-minimized {
      width: 45px;
      height: 45px;
      opacity: 0.7;
    }

    .sw-spirit-ball.sw-spirit-minimized:hover {
      opacity: 1;
    }

    /* Mobile responsiveness */
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

    /* Special effects */
    .sw-spirit-ball.sw-spirit-active .sw-spirit-inner {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      animation: sw-spirit-active-glow 0.6s ease-out;
    }

    @keyframes sw-spirit-active-glow {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); filter: brightness(1.3); }
      100% { transform: scale(1); }
    }
  `;
}

/**
 * Make spirit ball interactive (draggable and clickable)
 */
function makeSpiritBallInteractive(spiritBall) {
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let elementStart = { x: 0, y: 0 };
  let hasMoved = false;

  // Mouse events
  spiritBall.addEventListener('mousedown', handleDragStart);
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);

  // Touch events for mobile
  spiritBall.addEventListener('touchstart', handleTouchStart, { passive: false });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd);

  function handleDragStart(e) {
    isDragging = true;
    hasMoved = false;
    spiritBall.classList.add('sw-spirit-dragging');
    
    const rect = spiritBall.getBoundingClientRect();
    dragStart = {
      x: e.clientX,
      y: e.clientY
    };
    elementStart = {
      x: rect.left,
      y: rect.top
    };
    
    e.preventDefault();
  }

  function handleDragMove(e) {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Mark as moved if dragged more than 5px
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMoved = true;
    }

    const newX = elementStart.x + deltaX;
    const newY = elementStart.y + deltaY;

    // Keep within viewport bounds
    const maxX = window.innerWidth - spiritBall.offsetWidth;
    const maxY = window.innerHeight - spiritBall.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(maxX, newX));
    const boundedY = Math.max(0, Math.min(maxY, newY));

    spiritBall.style.left = boundedX + 'px';
    spiritBall.style.top = boundedY + 'px';
    spiritBall.style.right = 'auto';
    spiritBall.style.bottom = 'auto';
  }

  function handleDragEnd(e) {
    if (!isDragging) return;
    
    isDragging = false;
    spiritBall.classList.remove('sw-spirit-dragging');

    // If not moved significantly, treat as click
    if (!hasMoved) {
      handleSpiritClick(e);
    }

    // Snap to edges
    snapToEdge(spiritBall);
  }

  function handleTouchStart(e) {
    const touch = e.touches[0];
    handleDragStart({
      clientX: touch.clientX,
      clientY: touch.clientY,
      preventDefault: () => e.preventDefault()
    });
  }

  function handleTouchMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleDragMove({
      clientX: touch.clientX,
      clientY: touch.clientY
    });
  }

  function handleTouchEnd(e) {
    handleDragEnd(e);
  }
}

/**
 * Handle spirit ball click to open Story Weaver
 */
function handleSpiritClick(e) {
  const spiritBall = document.getElementById('story-weaver-spirit');
  
  // Add click effect
  spiritBall.classList.add('sw-spirit-active');
  setTimeout(() => {
    spiritBall.classList.remove('sw-spirit-active');
  }, 600);

  // Open Story Weaver interface
  openStoryWeaverInterface();
  
  // Haptic feedback on mobile
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
}

/**
 * Snap spirit ball to nearest edge
 */
function snapToEdge(spiritBall) {
  const rect = spiritBall.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  let targetX, targetY;
  
  // Determine which edge is closest
  const distanceToLeft = centerX;
  const distanceToRight = windowWidth - centerX;
  const distanceToTop = centerY;
  const distanceToBottom = windowHeight - centerY;
  
  const minDistance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);
  
  if (minDistance === distanceToLeft) {
    // Snap to left edge
    targetX = 20;
    targetY = Math.max(20, Math.min(windowHeight - spiritBall.offsetHeight - 20, rect.top));
  } else if (minDistance === distanceToRight) {
    // Snap to right edge
    targetX = windowWidth - spiritBall.offsetWidth - 20;
    targetY = Math.max(20, Math.min(windowHeight - spiritBall.offsetHeight - 20, rect.top));
  } else if (minDistance === distanceToTop) {
    // Snap to top edge
    targetX = Math.max(20, Math.min(windowWidth - spiritBall.offsetWidth - 20, rect.left));
    targetY = 20;
  } else {
    // Snap to bottom edge
    targetX = Math.max(20, Math.min(windowWidth - spiritBall.offsetWidth - 20, rect.left));
    targetY = windowHeight - spiritBall.offsetHeight - 20;
  }
  
  // Animate to target position
  spiritBall.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  spiritBall.style.left = targetX + 'px';
  spiritBall.style.top = targetY + 'px';
  
  // Remove transition after animation
  setTimeout(() => {
    spiritBall.style.transition = '';
  }, 300);
}

/**
 * Position spirit ball initially
 */
function positionSpiritBall(spiritBall) {
  // Try to load saved position
  const savedPos = localStorage.getItem('sw-spirit-position');
  if (savedPos) {
    try {
      const pos = JSON.parse(savedPos);
      spiritBall.style.left = pos.x + 'px';
      spiritBall.style.top = pos.y + 'px';
      spiritBall.style.right = 'auto';
      spiritBall.style.bottom = 'auto';
      return;
    } catch (e) {
      console.warn('[SW] Failed to load saved spirit position');
    }
  }
  
  // Default position: bottom-right corner
  // CSS handles this with bottom: 30px; right: 30px;
}

/**
 * Save spirit ball position
 */
function saveSpiritPosition() {
  const spiritBall = document.getElementById('story-weaver-spirit');
  if (!spiritBall) return;
  
  const rect = spiritBall.getBoundingClientRect();
  const position = {
    x: rect.left,
    y: rect.top
  };
  
  localStorage.setItem('sw-spirit-position', JSON.stringify(position));
}

/**
 * Show welcome notification when spirit ball is created
 */
function showWelcomeNotification() {
  // Create welcome notification
  const notification = document.createElement('div');
  notification.className = 'sw-welcome-notification';
  notification.innerHTML = `
    <div class="sw-welcome-content">
      <div class="sw-welcome-icon">📖</div>
      <div class="sw-welcome-text">
        <strong>Story Weaver Enhanced</strong><br>
        <small>Click the spirit ball to open</small>
      </div>
    </div>
  `;
  
  // Add welcome notification styles
  const welcomeStyles = document.createElement('style');
  welcomeStyles.textContent = `
    .sw-welcome-notification {
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
    }
    
    .sw-welcome-notification.show {
      transform: translateX(0);
    }
    
    .sw-welcome-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .sw-welcome-icon {
      font-size: 24px;
    }
    
    .sw-welcome-text strong {
      font-size: 14px;
      font-weight: 600;
    }
    
    .sw-welcome-text small {
      font-size: 12px;
      opacity: 0.9;
    }
  `;
  document.head.appendChild(welcomeStyles);
  
  document.body.appendChild(notification);
  
  // Show notification with animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 1000);
  
  // Auto-hide notification
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      notification.remove();
      welcomeStyles.remove();
    }, 500);
  }, 4000);
}

// ========================= MAIN TAVERN HELPER SCRIPT =========================

/**
 * Enhanced Story Weaver with complete feature set
 */
function init() {
  // Register all slash commands
  registerSlashCommands();
  
  // Initialize global variables if not exists
  initializeGlobalVariables();
  
  // Create floating spirit ball
  createFloatingSpiritBall();
  
  console.log('[SW] Story Weaver Enhanced v2.0 initialized with floating spirit ball');
}

/**
 * Register all slash commands
 */
function registerSlashCommands() {
  SlashCommandsAPI.registerSlashCommand({
    name: 'sw',
    description: 'Open Story Weaver interface - 打开故事大纲生成器',
    callback: openStoryWeaverInterface,
    helpString: 'Opens the enhanced Story Weaver interface with full feature set'
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
    helpString: 'Usage: /swquick [type] [chapters] - Quick generate with optional story type and chapter count'
  });

  SlashCommandsAPI.registerSlashCommand({
    name: 'swpreset',
    description: 'Manage Story Weaver presets - 管理预设',
    callback: handlePresetCommand,
    helpString: 'Usage: /swpreset [save|load|delete|list] [name] - Manage presets'
  });

  SlashCommandsAPI.registerSlashCommand({
    name: 'swspirit',
    description: 'Toggle Story Weaver spirit ball - 切换精灵球显示',
    callback: toggleSpiritBall,
    helpString: 'Show/hide the floating spirit ball'
  });
}

/**
 * Toggle spirit ball visibility
 */
function toggleSpiritBall() {
  const spiritBall = document.getElementById('story-weaver-spirit');
  if (spiritBall) {
    if (spiritBall.style.display === 'none') {
      spiritBall.style.display = 'block';
      setTimeout(() => spiritBall.classList.add('sw-spirit-visible'), 50);
      showNotification('精灵球已显示', 'success');
      console.log('[SW] Spirit ball shown');
    } else {
      spiritBall.classList.remove('sw-spirit-visible');
      setTimeout(() => spiritBall.style.display = 'none', 300);
      showNotification('精灵球已隐藏', 'info');
      console.log('[SW] Spirit ball hidden');
    }
  } else {
    createFloatingSpiritBall();
    showNotification('精灵球已创建', 'success');
    console.log('[SW] Spirit ball created via toggle command');
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

// ========================= SLASH COMMAND HANDLERS =========================

/**
 * Open the enhanced Story Weaver interface
 */
function openStoryWeaverInterface() {
  const settings = loadSettings();
  const interfaceHTML = buildEnhancedInterface(settings);
  
  TavernHelper.showWindow({
    title: 'Story Weaver Enhanced - 故事大纲生成器',
    content: interfaceHTML,
    width: 1200,
    height: 800,
    resizable: true,
    onClose: () => {
      // Save spirit position when interface closes
      saveSpiritPosition();
    }
  });
  
  showNotification('Story Weaver Enhanced 已打开', 'success');
  console.log('[SW] Interface opened successfully');
}

/**
 * Handle quick generation command
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
 * Handle preset management commands
 */
function handlePresetCommand(args) {
  const parts = args.split(' ').filter(p => p.trim());
  const action = parts[0];
  const name = parts.slice(1).join(' ');
  
  switch (action) {
    case 'save':
      if (!name) {
        showNotification('请提供预设名称: /swpreset save [名称]', 'warning');
        return;
      }
      savePreset(name);
      break;
      
    case 'load':
      if (!name) {
        showNotification('请提供预设名称: /swpreset load [名称]', 'warning');
        return;
      }
      loadPreset(name);
      break;
      
    case 'delete':
      if (!name) {
        showNotification('请提供预设名称: /swpreset delete [名称]', 'warning');
        return;
      }
      deletePreset(name);
      break;
      
    case 'list':
      listPresets();
      break;
      
    default:
      showNotification('用法: /swpreset [save|load|delete|list] [名称]', 'info');
  }
}

// ========================= PRESET MANAGEMENT =========================

/**
 * Save current settings as preset
 */
function savePreset(name) {
  const settings = loadSettings();
  TavernHelper.setGlobalVariable(`sw_preset_${name}`, JSON.stringify(settings));
  showNotification(`预设 "${name}" 已保存`, 'success');
}

/**
 * Load preset by name
 */
function loadPreset(name) {
  const presetData = TavernHelper.getGlobalVariable(`sw_preset_${name}`);
  if (presetData) {
    try {
      const settings = JSON.parse(presetData);
      TavernHelper.setGlobalVariable('storyWeaverSettings', JSON.stringify(settings));
      showNotification(`预设 "${name}" 已加载`, 'success');
    } catch (error) {
      showNotification('预设数据格式错误', 'error');
    }
  } else {
    showNotification('预设不存在', 'error');
  }
}

/**
 * Delete preset by name
 */
function deletePreset(name) {
  TavernHelper.setGlobalVariable(`sw_preset_${name}`, null);
  showNotification(`预设 "${name}" 已删除`, 'success');
}

/**
 * List all available presets
 */
function listPresets() {
  const allVars = TavernHelper.getAllGlobalVariables();
  const presetVars = Object.keys(allVars).filter(key => key.startsWith('sw_preset_'));
  
  if (presetVars.length === 0) {
    showNotification('暂无保存的预设', 'info');
    return;
  }
  
  const presetNames = presetVars.map(key => key.replace('sw_preset_', '')).join(', ');
  showNotification(`可用预设: ${presetNames}`, 'info');
}

// ========================= DATA ACCESS FUNCTIONS =========================

/**
 * Enhanced worldbook entries formatting
 */
function getWorldbookEntries() {
  try {
    return TavernHelper.getWorldbookEntries() || [];
  } catch (error) {
    console.warn('[SW] Failed to get worldbook entries:', error);
    return [];
  }
}

/**
 * Enhanced character data access
 */
function getCharacterData() {
  try {
    return TavernHelper.getCharacterData() || null;
  } catch (error) {
    console.warn('[SW] Failed to get character data:', error);
    return null;
  }
}

/**
 * Enhanced chat history access
 */
function getChatHistory(length = 10) {
  try {
    return TavernHelper.getChatHistory(length) || [];
  } catch (error) {
    console.warn('[SW] Failed to get chat history:', error);
    return [];
  }
}

/**
 * Enhanced system prompt resolution
 */
function resolveSystemPrompt() {
  try {
    return TavernHelper.getSystemPrompt() || '';
  } catch (error) {
    console.warn('[SW] Failed to get system prompt:', error);
    return '';
  }
}

/**
 * Enhanced memory summary resolution
 */
function resolveMemorySummary() {
  try {
    return TavernHelper.getMemorySummary() || '';
  } catch (error) {
    console.warn('[SW] Failed to get memory summary:', error);
    return '';
  }
}

/**
 * Enhanced authors note resolution
 */
function resolveAuthorsNote() {
  try {
    return TavernHelper.getAuthorsNote() || '';
  } catch (error) {
    console.warn('[SW] Failed to get authors note:', error);
    return '';
  }
}

/**
 * Enhanced jailbreak resolution
 */
function resolveJailbreak() {
  try {
    return TavernHelper.getJailbreak() || '';
  } catch (error) {
    console.warn('[SW] Failed to get jailbreak:', error);
    return '';
  }
}

// ========================= GENERATION FUNCTIONS =========================

/**
 * Enhanced story outline generation
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
      // Send result to chat if interface not open
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
 * Process prompt template with all variables
 */
function processPromptTemplate(template, settings) {
  const contextLength = parseInt(settings.contextLength || '10');
  
  // Get all data
  const worldbookEntries = formatWorldbookEntries(getWorldbookEntries());
  const characterData = formatCharacterData(getCharacterData());
  const chatHistory = formatChatHistory(getChatHistory(contextLength));
  
  // Get system integration data based on settings
  const systemPrompt = settings.enableSystemPrompt ? resolveSystemPrompt() : '';
  const memorySummary = settings.enableMemorySummary ? resolveMemorySummary() : '';
  const authorsNote = settings.enableAuthorsNote ? resolveAuthorsNote() : '';
  const jailbreak = settings.enableJailbreak ? resolveJailbreak() : '';
  
  // Replace all template variables
  return template
    .replace(/\{system_prompt\}/g, systemPrompt)
    .replace(/\{worldbook_entries\}/g, worldbookEntries)
    .replace(/\{character_data\}/g, characterData.combined)
    .replace(/\{char_persona\}/g, characterData.persona)
    .replace(/\{char_scenario\}/g, characterData.scenario)
    .replace(/\{memory_summary\}/g, memorySummary)
    .replace(/\{authors_note\}/g, authorsNote)
    .replace(/\{jailbreak\}/g, jailbreak)
    .replace(/\{chat_history\}/g, chatHistory)
    .replace(/\{story_type\}/g, STORY_TYPES[settings.storyType] || settings.storyType)
    .replace(/\{story_theme\}/g, settings.storyTheme || '')
    .replace(/\{story_style\}/g, STORY_STYLES[settings.storyStyle] || settings.storyStyle)
    .replace(/\{chapter_count\}/g, settings.chapterCount || '5')
    .replace(/\{detail_level\}/g, DETAIL_LEVELS[settings.detailLevel] || settings.detailLevel)
    .replace(/\{special_requirements\}/g, settings.specialRequirements || '')
    .replace(/\{include_summary\}/g, settings.includeSummary ? '是' : '否')
    .replace(/\{include_characters\}/g, settings.includeCharacters ? '是' : '否')
    .replace(/\{include_themes\}/g, settings.includeThemes ? '是' : '否');
}

/**
 * Get default prompt template
 */
function getDefaultPromptTemplate() {
  return `你是一位专业的故事编剧和大纲设计师。请基于以下信息生成一个详细的故事大纲：

**系统提示词：**
{system_prompt}

**世界观设定：**
{worldbook_entries}

**角色信息：**
{character_data}
- 角色性格：{char_persona}
- 当前情境：{char_scenario}

**记忆摘要：**
{memory_summary}

**作者注释：**
{authors_note}

**对话历史：**
{chat_history}

**创作要求：**
- 故事类型：{story_type}
- 叙事风格：{story_style}
- 故事主题：{story_theme}
- 章节数量：{chapter_count}
- 详细程度：{detail_level}
- 特殊要求：{special_requirements}

**输出选项：**
- 包含整体摘要：{include_summary}
- 包含角色发展：{include_characters}
- 包含主题分析：{include_themes}

请生成一个结构完整、逻辑清晰的故事大纲。确保每章都有明确的目标、冲突和发展。

{jailbreak}`;
}

// ========================= FORMATTING FUNCTIONS =========================

/**
 * Format worldbook entries for prompt
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
 * Format character data for prompt
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
 * Format chat history for prompt
 */
function formatChatHistory(history) {
  if (!history || history.length === 0) return '暂无对话历史';
  
  return history.map(msg => {
    const name = msg.name || msg.user || '未知';
    const content = msg.mes || msg.message || '';
    return `[${name}]: ${content}`;
  }).slice(-10).join('\n'); // Only last 10 messages for context
}

// ========================= SETTINGS MANAGEMENT =========================

/**
 * Load settings from global variables
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
 * Save settings to global variables
 */
function saveSettings(settings) {
  TavernHelper.setGlobalVariable('storyWeaverSettings', JSON.stringify(settings));
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
    includeThemes: false,
    enableSystemPrompt: true,
    enableMemorySummary: true,
    enableAuthorsNote: true,
    enableJailbreak: false,
    customPromptTemplate: ''
  };
}

// ========================= ENHANCED INTERFACE BUILDER =========================

/**
 * Build enhanced interface - simplified version for spirit ball usage
 */
function buildEnhancedInterface(settings) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Story Weaver Enhanced - 故事大纲生成器</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .sw-container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 32px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .sw-title {
            text-align: center;
            font-size: 24px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 24px;
        }
        .sw-form-group {
            margin-bottom: 20px;
        }
        .sw-label {
            display: block;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 8px;
        }
        .sw-input, .sw-select, .sw-textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }
        .sw-input:focus, .sw-select:focus, .sw-textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        .sw-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.3s ease;
            width: 100%;
        }
        .sw-btn:hover {
            transform: translateY(-2px);
        }
        .sw-output {
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
    <div class="sw-container">
        <h1 class="sw-title">📖 Story Weaver Enhanced</h1>
        
        <div class="sw-form-group">
            <label class="sw-label">故事主题：</label>
            <textarea id="story-theme" class="sw-textarea" rows="3" placeholder="描述您想要的故事主题...">${settings.storyTheme}</textarea>
        </div>
        
        <div class="sw-form-group">
            <label class="sw-label">故事类型：</label>
            <select id="story-type" class="sw-select">
                ${Object.entries(STORY_TYPES).map(([key, label]) => 
                  `<option value="${key}" ${key === settings.storyType ? 'selected' : ''}>${label}</option>`
                ).join('')}
            </select>
        </div>
        
        <div class="sw-form-group">
            <label class="sw-label">章节数量：</label>
            <input type="number" id="chapter-count" class="sw-input" value="${settings.chapterCount}" min="3" max="20">
        </div>
        
        <button id="generate-btn" class="sw-btn">🎭 生成故事大纲</button>
        
        <div id="output" class="sw-output">
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
                    includeThemes: false,
                    enableSystemPrompt: true,
                    enableMemorySummary: true,
                    enableAuthorsNote: true,
                    enableJailbreak: false
                };
                
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

// ========================= UTILITY FUNCTIONS =========================

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  TavernHelper.showNotification(message, {
    type: type,
    duration: 3000
  });
}

// ========================= AUTO-INITIALIZATION =========================

/**
 * Initialize the extension
 */
function initializeStoryWeaver() {
  console.log('[SW] Starting Story Weaver initialization...');
  
  try {
    // Check if TavernHelper is available
    if (typeof TavernHelper === 'undefined') {
      console.warn('[SW] TavernHelper not found, retrying in 1 second...');
      setTimeout(initializeStoryWeaver, 1000);
      return;
    }
    
    console.log('[SW] TavernHelper found, initializing...');
    
    // Initialize the extension
    init();
    
    console.log('[SW] Story Weaver initialized successfully!');
    
  } catch (error) {
    console.error('[SW] Initialization failed:', error);
    setTimeout(initializeStoryWeaver, 2000); // Retry after 2 seconds
  }
}

/**
 * Force create spirit ball (for debugging)
 */
function forceCreateSpiritBall() {
  console.log('[SW] Force creating spirit ball...');
  
  // Remove existing first
  const existing = document.getElementById('story-weaver-spirit');
  if (existing) {
    console.log('[SW] Removing existing spirit ball');
    existing.remove();
  }
  
  // Create new one
  createFloatingSpiritBall();
  console.log('[SW] Spirit ball creation attempted');
  
  // Check if it was created successfully
  setTimeout(() => {
    const created = document.getElementById('story-weaver-spirit');
    if (created) {
      console.log('[SW] ✅ Spirit ball successfully created and visible');
    } else {
      console.error('[SW] ❌ Spirit ball creation failed');
    }
  }, 1000);
}

/**
 * Debug function to check environment
 */
function debugEnvironment() {
  console.log('[SW] === Environment Debug Info ===');
  console.log('[SW] Document ready state:', document.readyState);
  console.log('[SW] Document body exists:', !!document.body);
  console.log('[SW] TavernHelper available:', typeof TavernHelper !== 'undefined');
  console.log('[SW] Spirit ball exists:', !!document.getElementById('story-weaver-spirit'));
  console.log('[SW] Window width:', window.innerWidth);
  console.log('[SW] Window height:', window.innerHeight);
  console.log('[SW] User agent:', navigator.userAgent);
  
  if (typeof TavernHelper !== 'undefined') {
    try {
      console.log('[SW] TavernHelper methods:', Object.keys(TavernHelper));
    } catch (e) {
      console.log('[SW] Could not enumerate TavernHelper methods');
    }
  }
  
  const existing = document.getElementById('story-weaver-spirit');
  if (existing) {
    console.log('[SW] Spirit ball computed style display:', window.getComputedStyle(existing).display);
    console.log('[SW] Spirit ball computed style visibility:', window.getComputedStyle(existing).visibility);
    console.log('[SW] Spirit ball computed style opacity:', window.getComputedStyle(existing).opacity);
    console.log('[SW] Spirit ball bounding rect:', existing.getBoundingClientRect());
  }
  
  console.log('[SW] === End Debug Info ===');
}

// Multiple initialization attempts for different scenarios
console.log('[SW] Script loaded, document state:', document.readyState);

// Method 1: Immediate initialization if DOM is ready
if (document.readyState === 'loading') {
  console.log('[SW] DOM still loading, waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', initializeStoryWeaver);
} else {
  console.log('[SW] DOM already loaded, initializing immediately...');
  initializeStoryWeaver();
}

// Method 2: Backup timer initialization
setTimeout(() => {
  console.log('[SW] Backup initialization attempt...');
  if (!document.getElementById('story-weaver-spirit')) {
    console.log('[SW] Spirit ball not found, attempting backup creation...');
    initializeStoryWeaver();
  }
}, 2000);

// Method 3: Window load backup
window.addEventListener('load', () => {
  console.log('[SW] Window loaded, checking spirit ball...');
  if (!document.getElementById('story-weaver-spirit')) {
    console.log('[SW] Spirit ball missing after window load, creating...');
    setTimeout(initializeStoryWeaver, 500);
  }
});

// Save spirit position on page unload
window.addEventListener('beforeunload', saveSpiritPosition);

// Export main functions for external access and debugging
window.StoryWeaver = {
  init,
  initializeStoryWeaver,
  openStoryWeaverInterface,
  generateStoryOutline,
  loadSettings,
  saveSettings,
  savePreset,
  loadPreset,
  deletePreset,
  listPresets,
  createFloatingSpiritBall,
  forceCreateSpiritBall,
  toggleSpiritBall,
  debugEnvironment
};

console.log('[SW] Story Weaver Enhanced with Floating Spirit Ball script loaded!');
console.log('[SW] Use StoryWeaver.forceCreateSpiritBall() if spirit ball is not visible');
console.log('[SW] Available debug functions:', Object.keys(window.StoryWeaver));