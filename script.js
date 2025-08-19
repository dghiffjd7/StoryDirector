// Story Weaver Extension for SillyTavern
// Simple implementation following ST extension standards

(() => {
  'use strict';

  const MODULE_NAME = 'story-weaver';

  // Settings
  let settings = {
    enabled: true,
  };

  // Extension state
  let isInitialized = false;

  /**
   * Load extension settings
   */
  function loadSettings() {
    if (typeof extension_settings !== 'undefined' && extension_settings[MODULE_NAME]) {
      settings = { ...settings, ...extension_settings[MODULE_NAME] };
    }
  }

  /**
   * Save extension settings
   */
  function saveSettings() {
    if (typeof extension_settings !== 'undefined') {
      extension_settings[MODULE_NAME] = settings;
      if (typeof saveSettingsDebounced === 'function') {
        saveSettingsDebounced();
      }
    }
  }

  /**
   * Create Story Weaver panel
   */
  function createStoryWeaverPanel() {
    if (document.getElementById('story-weaver-panel')) {
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'story-weaver-panel';
    panel.className = 'story-weaver-panel';
    panel.style.display = 'none';

    // Load panel content from external HTML or use inline
    loadPanelContent(panel);

    document.body.appendChild(panel);
    bindPanelEvents(panel);

    console.log('[Story Weaver] Panel created');
  }

  /**
   * Load panel content
   */
  function loadPanelContent(panel) {
    // Try to load external HTML
    fetch(`/scripts/extensions/${MODULE_NAME}/index.html`)
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('.story-weaver-panel');
        if (content) {
          panel.innerHTML = content.innerHTML;
        } else {
          loadInlineContent(panel);
        }
        bindPanelEvents(panel);
      })
      .catch(() => {
        loadInlineContent(panel);
        bindPanelEvents(panel);
      });
  }

  /**
   * Load inline panel content
   */
  function loadInlineContent(panel) {
    panel.innerHTML = `
      <div class="story-weaver-header">
        <h2 class="panel-title">
          <span class="title-icon">📖</span>
          Story Weaver - 故事大纲生成器
        </h2>
        <button id="close-panel" class="close-btn" title="关闭面板">
          <span>✕</span>
        </button>
      </div>
      <div class="story-weaver-content">
        <section class="content-section">
          <h3 class="section-title">
            <span class="section-icon">🌍</span>
            世界观数据读取
          </h3>
          <div class="section-content">
            <div class="button-group">
              <button id="read-lorebooks" class="primary-btn">
                <span class="btn-icon">📚</span>
                读取当前启用的世界书
              </button>
              <button id="read-character" class="secondary-btn">
                <span class="btn-icon">👤</span>
                读取当前角色卡
              </button>
            </div>
            <div id="lorebook-status" class="status-display">
              <span class="status-icon">ℹ️</span>
              点击上方按钮读取世界观数据...
            </div>
          </div>
        </section>
        
        <section class="content-section">
          <h3 class="section-title">
            <span class="section-icon">✨</span>
            创作需求设定
          </h3>
          <div class="section-content">
            <div class="form-group">
              <label for="story-type" class="form-label">故事类型：</label>
              <select id="story-type" class="form-select">
                <option value="fantasy">🏰 奇幻冒险</option>
                <option value="romance">💖 浪漫爱情</option>
                <option value="mystery">🔍 悬疑推理</option>
                <option value="scifi">🚀 科幻未来</option>
                <option value="custom">🎨 自定义</option>
              </select>
            </div>
            <div class="form-group">
              <label for="story-theme" class="form-label">故事主题：</label>
              <textarea id="story-theme" class="form-textarea" rows="3" 
                placeholder="描述您想要的故事主题..."></textarea>
            </div>
            <div class="form-group">
              <label for="chapter-count" class="form-label">章节数：</label>
              <input type="number" id="chapter-count" value="5" min="3" max="15" class="form-input">
            </div>
          </div>
        </section>

        <section class="content-section">
          <div class="generate-section">
            <button id="generate-outline" class="generate-btn">
              <span class="btn-icon">🎭</span>
              <span class="btn-text">生成故事大纲</span>
              <span class="btn-loading hidden">🔄</span>
            </button>
          </div>
        </section>

        <section class="content-section">
          <h3 class="section-title">
            <span class="section-icon">📄</span>
            生成结果
            <div class="title-actions">
              <button id="copy-result" class="action-btn" title="复制">📋</button>
              <button id="save-result" class="action-btn" title="保存">💾</button>
            </div>
          </h3>
          <div class="section-content">
            <div id="output-content" class="output-content">
              <div class="output-placeholder">
                <span class="placeholder-icon">📝</span>
                <p>故事大纲将在这里显示...</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  /**
   * Bind panel events
   */
  function bindPanelEvents(panel) {
    // Close button
    const closeBtn = panel.querySelector('#close-panel');
    if (closeBtn) {
      closeBtn.onclick = () => (panel.style.display = 'none');
    }

    // Read lorebooks button
    const readBtn = panel.querySelector('#read-lorebooks');
    if (readBtn) {
      readBtn.onclick = handleReadLorebooks;
    }

    // Read character button
    const charBtn = panel.querySelector('#read-character');
    if (charBtn) {
      charBtn.onclick = handleReadCharacter;
    }

    // Generate button
    const genBtn = panel.querySelector('#generate-outline');
    if (genBtn) {
      genBtn.onclick = () => handleGenerateOutline(panel);
    }

    // Copy button
    const copyBtn = panel.querySelector('#copy-result');
    if (copyBtn) {
      copyBtn.onclick = () => handleCopyResult(panel);
    }

    // Save button
    const saveBtn = panel.querySelector('#save-result');
    if (saveBtn) {
      saveBtn.onclick = () => handleSaveResult(panel);
    }
  }

  /**
   * Show Story Weaver panel
   */
  function showStoryWeaverPanel() {
    let panel = document.getElementById('story-weaver-panel');
    if (!panel) {
      createStoryWeaverPanel();
      panel = document.getElementById('story-weaver-panel');
    }

    if (panel) {
      panel.style.display = 'block';
      console.log('[Story Weaver] Panel shown');
    }
  }

  /**
   * Handle read lorebooks
   */
  function handleReadLorebooks() {
    console.log('[Story Weaver] Reading lorebooks...');

    const statusDiv = document.getElementById('lorebook-status');
    if (!statusDiv) return;

    try {
      // Get SillyTavern context
      const context = typeof getContext === 'function' ? getContext() : null;

      if (!context || !context.worldInfoData) {
        updateStatus(statusDiv, '❌ 无法获取世界书数据', 'error');
        return;
      }

      const entries = context.worldInfoData.entries || [];
      const activeEntries = entries.filter(entry => !entry.disable);

      if (activeEntries.length === 0) {
        updateStatus(statusDiv, '⚠️ 未找到启用的世界书条目', 'warning');
        return;
      }

      // Store worldbook content
      window.storyWeaverData = window.storyWeaverData || {};
      window.storyWeaverData.worldbook = activeEntries.map(entry => ({
        keys: Array.isArray(entry.key) ? entry.key : [entry.key],
        content: entry.content,
      }));

      updateStatus(statusDiv, `✅ 成功读取 ${activeEntries.length} 个世界书条目`, 'success');
    } catch (error) {
      console.error('[Story Weaver] Error reading lorebooks:', error);
      updateStatus(statusDiv, '❌ 读取世界书失败', 'error');
    }
  }

  /**
   * Handle read character
   */
  function handleReadCharacter() {
    console.log('[Story Weaver] Reading character...');

    const statusDiv = document.getElementById('lorebook-status');
    if (!statusDiv) return;

    try {
      const context = typeof getContext === 'function' ? getContext() : null;

      if (!context || !context.characters || context.characterId === undefined) {
        updateStatus(statusDiv, '❌ 无法获取角色数据', 'error');
        return;
      }

      const character = context.characters[context.characterId];
      if (!character) {
        updateStatus(statusDiv, '❌ 未找到当前角色', 'warning');
        return;
      }

      // Store character data
      window.storyWeaverData = window.storyWeaverData || {};
      window.storyWeaverData.character = {
        name: character.name,
        description: character.description,
        personality: character.personality || '',
        scenario: character.scenario || '',
      };

      updateStatus(statusDiv, `✅ 成功读取角色: ${character.name}`, 'success');
    } catch (error) {
      console.error('[Story Weaver] Error reading character:', error);
      updateStatus(statusDiv, '❌ 读取角色失败', 'error');
    }
  }

  /**
   * Handle generate outline
   */
  function handleGenerateOutline(panel) {
    console.log('[Story Weaver] Generating outline...');

    const generateBtn = panel.querySelector('#generate-outline');
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    const outputDiv = panel.querySelector('#output-content');

    if (!generateBtn || !outputDiv) return;

    // Get form data
    const storyType = panel.querySelector('#story-type')?.value || 'fantasy';
    const storyTheme = panel.querySelector('#story-theme')?.value || '';
    const chapterCount = parseInt(panel.querySelector('#chapter-count')?.value) || 5;

    // Validate data
    const hasWorldbook = window.storyWeaverData?.worldbook?.length > 0;
    const hasCharacter = window.storyWeaverData?.character?.name;

    if (!hasWorldbook && !hasCharacter && !storyTheme.trim()) {
      showNotification('请先读取世界书/角色数据或填写故事主题', 'error');
      return;
    }

    // Update UI
    generateBtn.disabled = true;
    if (btnText) btnText.classList.add('hidden');
    if (btnLoading) btnLoading.classList.remove('hidden');

    // Simulate generation
    setTimeout(() => {
      const outline = generateMockOutline({
        storyType,
        storyTheme,
        chapterCount,
        worldbook: window.storyWeaverData?.worldbook || [],
        character: window.storyWeaverData?.character || null,
      });

      outputDiv.innerHTML = outline;

      // Restore UI
      generateBtn.disabled = false;
      if (btnText) btnText.classList.remove('hidden');
      if (btnLoading) btnLoading.classList.add('hidden');

      showNotification('故事大纲生成完成！', 'success');
    }, 2000);
  }

  /**
   * Handle copy result
   */
  function handleCopyResult(panel) {
    const outputDiv = panel.querySelector('#output-content');
    if (!outputDiv || outputDiv.querySelector('.output-placeholder')) {
      showNotification('没有可复制的内容', 'error');
      return;
    }

    const content = outputDiv.innerText || outputDiv.textContent;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        showNotification('已复制到剪贴板', 'success');
      });
    } else {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        showNotification('已复制到剪贴板', 'success');
      } catch (err) {
        showNotification('复制失败', 'error');
      }

      document.body.removeChild(textarea);
    }
  }

  /**
   * Handle save result
   */
  function handleSaveResult(panel) {
    const outputDiv = panel.querySelector('#output-content');
    if (!outputDiv || outputDiv.querySelector('.output-placeholder')) {
      showNotification('没有可保存的内容', 'error');
      return;
    }

    const content = outputDiv.innerText || outputDiv.textContent;
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '');
    const filename = `story-outline-${timestamp}.txt`;

    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
      showNotification(`已保存为 ${filename}`, 'success');
    } catch (error) {
      console.error('Save error:', error);
      showNotification('保存失败', 'error');
    }
  }

  /**
   * Generate mock outline
   */
  function generateMockOutline(data) {
    const { storyType, storyTheme, chapterCount, worldbook, character } = data;

    const typeEmojis = {
      fantasy: '🏰',
      romance: '💖',
      mystery: '🔍',
      scifi: '🚀',
      custom: '🎨',
    };

    const typeNames = {
      fantasy: '奇幻冒险',
      romance: '浪漫爱情',
      mystery: '悬疑推理',
      scifi: '科幻未来',
      custom: '自定义',
    };

    let outline = `
      <div class="outline-header">
        <h2>${typeEmojis[storyType]} ${typeNames[storyType]}故事大纲</h2>
        <div class="outline-meta">
          <span class="meta-item">📅 ${new Date().toLocaleString()}</span>
          <span class="meta-item">📖 ${chapterCount}章</span>
        </div>
      </div>
    `;

    if (storyTheme) {
      outline += `
        <div class="outline-section">
          <h3>🎯 故事主题</h3>
          <p>${storyTheme}</p>
        </div>
      `;
    }

    if (character) {
      outline += `
        <div class="outline-section">
          <h3>👤 主要角色</h3>
          <p><strong>${character.name}</strong>: ${character.description}</p>
        </div>
      `;
    }

    outline += '<div class="outline-section"><h3>📚 章节大纲</h3>';

    for (let i = 1; i <= chapterCount; i++) {
      const titles = ['序章', '起始', '发展', '转折', '高潮', '结局'];
      const title = titles[i - 1] || `第${i}章`;

      outline += `
        <div class="chapter-item">
          <h4>${title}</h4>
          <p>• 主要情节发展</p>
          <p>• 角色关系变化</p>
          <p>• 为下章做铺垫</p>
        </div>
      `;
    }

    outline += '</div>';

    return outline;
  }

  /**
   * Update status display
   */
  function updateStatus(element, message, type = 'info') {
    if (!element) return;

    const colors = {
      info: '#aaa',
      success: '#4a7c59',
      warning: '#ffa500',
      error: '#e74c3c',
    };

    element.style.color = colors[type];
    element.innerHTML = `<span class="status-icon">${message.charAt(0)}</span>${message}`;
  }

  /**
   * Show notification
   */
  function showNotification(message, type = 'info') {
    if (typeof toastr !== 'undefined') {
      toastr[type](message);
    } else {
      console.log(`[Story Weaver] ${type}: ${message}`);
    }
  }

  /**
   * Setup extension UI in settings
   */
  function setupExtensionUI() {
    if (!document.getElementById('extensions_settings')) {
      console.log('[Story Weaver] Extensions settings not found, retrying...');
      setTimeout(setupExtensionUI, 1000);
      return;
    }

    const settingsHtml = `
      <div class="story-weaver-settings">
        <div class="inline-drawer">
          <div class="inline-drawer-toggle inline-drawer-header">
            <b>📖 Story Weaver</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
          </div>
          <div class="inline-drawer-content">
            <label class="checkbox_label">
              <input id="story_weaver_enabled" type="checkbox" ${settings.enabled ? 'checked' : ''}>
              <span>启用Story Weaver扩展</span>
            </label>
            <small>故事大纲生成器 - 基于世界书和角色设定生成结构化故事大纲</small>
            <br><br>
            <div class="storyweaver_controls">
              <input id="story_weaver_open_panel" class="menu_button" type="submit" value="📖 打开Story Weaver面板" />
            </div>
          </div>
        </div>
      </div>
    `;

    $('#extensions_settings').append(settingsHtml);

    // Bind events
    $('#story_weaver_open_panel').on('click', showStoryWeaverPanel);

    $('#story_weaver_enabled').on('change', function () {
      settings.enabled = this.checked;
      saveSettings();
      console.log('[Story Weaver] Extension', this.checked ? 'enabled' : 'disabled');
    });

    console.log('[Story Weaver] Extension UI setup complete');
  }

  /**
   * Initialize extension
   */
  function initializeExtension() {
    if (isInitialized) return;

    loadSettings();
    setupExtensionUI();

    isInitialized = true;
    console.log('[Story Weaver] Extension initialized');
  }

  // Initialize when DOM is ready
  $(document).ready(() => {
    // Wait for SillyTavern to be ready
    if (typeof extension_settings === 'undefined') {
      setTimeout(initializeExtension, 1000);
    } else {
      initializeExtension();
    }
  });

  // Make showStoryWeaverPanel globally accessible for testing
  window.showStoryWeaverPanel = showStoryWeaverPanel;
})();
