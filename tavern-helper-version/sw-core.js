// Story Weaver Core - Spirit Ball + Module Loader
console.log('[SW] Loading Core Module...');

// Core constants
const SW_CONSTANTS = {
  STORY_TYPES: {
    adventure: '冒险故事', romance: '爱情故事', mystery: '悬疑推理',
    fantasy: '奇幻幻想', scifi: '科幻故事', horror: '恐怖惊悚',
    slice_of_life: '日常生活', comedy: '喜剧轻松', drama: '剧情情感', action: '动作战斗'
  },
  STORY_STYLES: {
    narrative: '叙述性', dialogue: '对话性', descriptive: '描述性',
    stream_of_consciousness: '意识流', epistolary: '书信体'
  },
  DETAIL_LEVELS: {
    brief: '简洁大纲', medium: '中等详细', detailed: '详细描述'
  }
};

// Core StoryWeaver object
window.StoryWeaver = {
  version: '2.0',
  modules: {},
  settings: {},
  
  // Core functions
  init() {
    console.log('[SW] Initializing Story Weaver v2.0...');
    this.loadSettings();
    this.createSpiritBall();
    this.loadModules();
  },
  
  createSpiritBall() {
    $('.sw-spirit').remove();
    $('body').append(`
      <div id="sw-spirit" class="sw-spirit" style="
        position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px;
        background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%;
        cursor: pointer; z-index: 9999; display: flex; align-items: center;
        justify-content: center; font-size: 28px; box-shadow: 0 4px 15px rgba(102,126,234,0.3);
        transition: all 0.3s ease; opacity: 0; transform: scale(0.8);
      ">📖</div>
    `);
    
    setTimeout(() => {
      $('#sw-spirit').css({opacity: 1, transform: 'scale(1)'});
    }, 100);
    
    $('#sw-spirit').click(() => this.openInterface());
    console.log('[SW] ✅ Spirit ball created');
  },
  
  openInterface() {
    if (!this.modules.interface) {
      this.showBasicInterface();
    } else {
      this.modules.interface.open();
    }
  },
  
  showBasicInterface() {
    if (typeof TavernHelper !== 'undefined') {
      TavernHelper.showWindow({
        title: 'Story Weaver Enhanced - 故事大纲生成器',
        content: this.buildBasicInterface(),
        width: 600,
        height: 500
      });
    }
  },
  
  buildBasicInterface() {
    return `
      <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h1 style="color: #667eea; margin-bottom: 20px;">📖 Story Weaver Enhanced</h1>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">故事主题：</label>
          <textarea id="sw-theme" placeholder="描述您想要的故事主题..." style="width: 100%; height: 80px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical;"></textarea>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">故事类型：</label>
          <select id="sw-type" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            ${Object.entries(SW_CONSTANTS.STORY_TYPES).map(([k,v]) => 
              `<option value="${k}">${v}</option>`).join('')}
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">章节数量：</label>
          <input type="number" id="sw-chapters" value="5" min="3" max="20" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
        </div>
        
        <button onclick="StoryWeaver.generate()" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-bottom: 10px;">生成故事大纲</button>
        
        <div style="display: flex; gap: 10px;">
          <button onclick="StoryWeaver.loadModule('interface')" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">加载完整界面</button>
          <button onclick="StoryWeaver.loadModule('presets')" style="flex: 1; padding: 8px; background: #17a2b8; color: white; border: none; border-radius: 5px; cursor: pointer;">加载预设管理</button>
        </div>
      </div>
    `;
  },
  
  async generate() {
    const theme = document.getElementById('sw-theme')?.value || '神秘的冒险故事';
    const type = document.getElementById('sw-type')?.value || 'adventure';
    const chapters = document.getElementById('sw-chapters')?.value || '5';
    
    try {
      const prompt = `请为我生成一个${SW_CONSTANTS.STORY_TYPES[type]}类型的故事大纲，主题是：${theme}

要求：
1. 包含${chapters}个章节
2. 每章有明确的情节发展和冲突
3. 结构完整，逻辑清晰
4. 符合${SW_CONSTANTS.STORY_TYPES[type]}的特点

请生成详细的章节大纲。`;

      console.log('[SW] Generating story...');
      const result = await TavernHelper.generateRaw(prompt);
      TavernHelper.sendMessage(`## 📖 Story Outline Generated\n\n${result}`);
      console.log('[SW] ✅ Story generated successfully');
    } catch (error) {
      console.error('[SW] Generation failed:', error);
    }
  },
  
  async loadModule(moduleName) {
    console.log(`[SW] Loading module: ${moduleName}`);
    // Placeholder for dynamic module loading
    alert(`模块 ${moduleName} 正在开发中，请稍后...`);
  },
  
  loadSettings() {
    const saved = localStorage.getItem('storyWeaverSettings');
    this.settings = saved ? JSON.parse(saved) : {
      storyType: 'adventure',
      storyStyle: 'narrative', 
      chapterCount: 5,
      detailLevel: 'medium'
    };
  },
  
  saveSettings() {
    localStorage.setItem('storyWeaverSettings', JSON.stringify(this.settings));
  },
  
  debug() {
    console.log('[SW] === Debug Info ===');
    console.log('Version:', this.version);
    console.log('Modules loaded:', Object.keys(this.modules));
    console.log('Settings:', this.settings);
    console.log('Spirit ball exists:', $('#sw-spirit').length > 0);
    console.log('===================');
  }
};

// Auto-initialize
$(document).ready(() => {
  StoryWeaver.init();
});

console.log('[SW] ✅ Core module loaded successfully!');