/**
 * Story Weaver Extension for SillyTavern
 * 故事大纲生成器扩展
 *
 * 符合SillyTavern扩展标准的实现
 */

(function () {
  'use strict';

  const extensionName = 'story-weaver';
  const extensionFolderPath = `scripts/extensions/${extensionName}`;
  const defaultSettings = {
    enabled: true,
  };

  // 扩展状态
  let extensionSettings = {};
  let isExtensionEnabled = false;

  /**
   * 加载扩展设置
   */
  function loadSettings() {
    extensionSettings = extension_settings[extensionName] || defaultSettings;

    // 如果没有设置，则使用默认设置
    if (Object.keys(extensionSettings).length === 0) {
      extensionSettings = defaultSettings;
      saveSettings();
    }
  }

  /**
   * 保存扩展设置
   */
  function saveSettings() {
    extension_settings[extensionName] = extensionSettings;
    saveSettingsDebounced();
  }

  /**
   * 创建扩展UI面板
   */
  function createStoryWeaverPanel() {
    // 创建面板容器
    const panelContainer = document.createElement('div');
    panelContainer.id = 'story-weaver-panel';
    panelContainer.className = 'story-weaver-panel';
    panelContainer.style.display = 'none';

    // 加载面板HTML内容
    fetch(`${extensionFolderPath}/index.html`)
      .then(response => response.text())
      .then(html => {
        // 解析HTML并提取面板内容
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const panelContent = doc.querySelector('.story-weaver-panel');

        if (panelContent) {
          panelContainer.innerHTML = panelContent.innerHTML;
        } else {
          // 如果无法加载外部HTML，使用内嵌版本
          loadInlineHTML(panelContainer);
        }

        // 将面板添加到页面
        document.body.appendChild(panelContainer);

        // 绑定事件
        bindPanelEvents(panelContainer);

        console.log('[Story Weaver] 面板创建成功');
      })
      .catch(error => {
        console.warn('[Story Weaver] 无法加载外部HTML文件，使用内嵌版本:', error);
        loadInlineHTML(panelContainer);
        document.body.appendChild(panelContainer);
        bindPanelEvents(panelContainer);
      });

    return panelContainer;
  }

  /**
   * 加载内嵌HTML内容（备用方案）
   */
  function loadInlineHTML(container) {
    container.innerHTML = `
      <!-- 面板头部 -->
      <div class="story-weaver-header">
        <h2 class="panel-title">
          <span class="title-icon">📖</span>
          Story Weaver - 故事大纲生成器
        </h2>
        <button id="close-panel" class="close-btn" title="关闭面板">
          <span>✕</span>
        </button>
      </div>

      <!-- 面板内容区域 -->
      <div class="story-weaver-content">
        <!-- 世界观数据读取区 -->
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
            <div id="data-preview" class="data-preview hidden">
              <h4>数据预览：</h4>
              <div id="preview-content" class="preview-content"></div>
            </div>
          </div>
        </section>

        <!-- 创作需求设定区 -->
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
                <option value="slice-of-life">🌸 日常生活</option>
                <option value="action">⚔️ 动作冒险</option>
                <option value="drama">🎭 情感剧情</option>
                <option value="custom">🎨 自定义</option>
              </select>
            </div>

            <div class="form-group">
              <label for="story-theme" class="form-label">故事主题/核心冲突：</label>
              <textarea 
                id="story-theme" 
                class="form-textarea"
                placeholder="例如：主角需要拯救被诅咒的王国，同时面对内心的恐惧..."
                rows="4"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="chapter-count" class="form-label">期望章节数：</label>
                <input type="number" id="chapter-count" value="5" min="3" max="20" class="form-input">
              </div>
              <div class="form-group flex-1">
                <label for="detail-level" class="form-label">大纲详细程度：</label>
                <select id="detail-level" class="form-select">
                  <option value="brief">简要大纲</option>
                  <option value="detailed" selected>详细大纲</option>
                  <option value="comprehensive">全面大纲</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <!-- 生成控制区 -->
        <section class="content-section">
          <div class="generate-section">
            <button id="generate-outline" class="generate-btn">
              <span class="btn-icon">🎭</span>
              <span class="btn-text">生成故事大纲</span>
              <span class="btn-loading hidden">🔄</span>
            </button>
          </div>
        </section>

        <!-- 生成结果区 -->
        <section id="output-section" class="content-section">
          <h3 class="section-title">
            <span class="section-icon">📄</span>
            生成结果
            <div class="title-actions">
              <button id="copy-result" class="action-btn" title="复制到剪贴板">
                <span class="btn-icon">📋</span>
              </button>
              <button id="save-result" class="action-btn" title="保存为文件">
                <span class="btn-icon">💾</span>
              </button>
            </div>
          </h3>
          <div class="section-content">
            <div id="output-content" class="output-content">
              <div class="output-placeholder">
                <span class="placeholder-icon">📝</span>
                <p>故事大纲将在这里显示...</p>
                <p class="placeholder-help">填写上方信息后点击"生成故事大纲"开始创作</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  /**
   * 绑定面板事件
   */
  function bindPanelEvents(panel) {
    // 关闭按钮
    const closeBtn = panel.querySelector('#close-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        panel.style.display = 'none';
      });
    }

    // 读取世界书按钮
    const readLorebooksBtn = panel.querySelector('#read-lorebooks');
    if (readLorebooksBtn) {
      readLorebooksBtn.addEventListener('click', handleReadLorebooks);
    }

    // 读取角色卡按钮
    const readCharacterBtn = panel.querySelector('#read-character');
    if (readCharacterBtn) {
      readCharacterBtn.addEventListener('click', handleReadCharacter);
    }

    // 生成大纲按钮
    const generateBtn = panel.querySelector('#generate-outline');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => handleGenerateOutline(panel));
    }

    // 复制结果按钮
    const copyBtn = panel.querySelector('#copy-result');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => handleCopyResult(panel));
    }

    // 保存结果按钮
    const saveBtn = panel.querySelector('#save-result');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => handleSaveResult(panel));
    }
  }

  /**
   * 显示Story Weaver面板
   */
  function showStoryWeaverPanel() {
    let panel = document.getElementById('story-weaver-panel');

    if (!panel) {
      panel = createStoryWeaverPanel();
    } else {
      panel.style.display = 'block';
    }

    console.log('[Story Weaver] 面板已显示');
  }

  /**
   * 处理读取世界书功能
   */
  function handleReadLorebooks() {
    console.log('[Story Weaver] 开始读取世界书');

    try {
      // 获取SillyTavern的世界书数据
      const context = getContext();
      const worldInfoData = context.worldInfoData || {};
      const entries = worldInfoData.entries || [];

      // 过滤启用的条目
      const activeEntries = entries.filter(entry => !entry.disable);

      const statusDiv = document.getElementById('lorebook-status');
      const previewDiv = document.getElementById('data-preview');
      const previewContent = document.getElementById('preview-content');

      if (activeEntries.length === 0) {
        updateStatus(statusDiv, '❌ 未找到启用的世界书条目', 'warning');
        return;
      }

      // 构建世界书内容
      const worldbookContent = activeEntries
        .map(entry => {
          const keys = Array.isArray(entry.key) ? entry.key : [entry.key];
          return `关键词: ${keys.join(', ')}\n内容: ${entry.content}`;
        })
        .join('\n\n');

      // 存储到全局变量（用于后续生成）
      window.storyWeaverData = window.storyWeaverData || {};
      window.storyWeaverData.worldbookContent = worldbookContent;

      updateStatus(statusDiv, `✅ 世界书读取成功！共读取到 ${activeEntries.length} 个条目。`, 'success');

      // 显示预览
      if (previewContent) {
        previewContent.textContent = worldbookContent.substring(0, 200) + '...';
        previewDiv.classList.remove('hidden');
      }
    } catch (error) {
      console.error('[Story Weaver] 读取世界书失败:', error);
      const statusDiv = document.getElementById('lorebook-status');
      updateStatus(statusDiv, '❌ 读取世界书失败，请检查是否有启用的世界书', 'error');
    }
  }

  /**
   * 处理读取角色卡功能
   */
  function handleReadCharacter() {
    console.log('[Story Weaver] 开始读取角色卡');

    try {
      // 获取SillyTavern的角色数据
      const context = getContext();
      const character = context.characters[context.characterId];

      if (!character) {
        const statusDiv = document.getElementById('lorebook-status');
        updateStatus(statusDiv, '❌ 未找到当前角色', 'warning');
        return;
      }

      const characterContent =
        `角色姓名: ${character.name}\n` +
        `角色描述: ${character.description}\n` +
        `性格特点: ${character.personality || '未设定'}\n` +
        `背景故事: ${character.scenario || '未设定'}`;

      // 合并到世界书内容
      window.storyWeaverData = window.storyWeaverData || {};
      if (window.storyWeaverData.worldbookContent) {
        window.storyWeaverData.worldbookContent += '\n\n=== 角色信息 ===\n' + characterContent;
      } else {
        window.storyWeaverData.worldbookContent = '=== 角色信息 ===\n' + characterContent;
      }

      const statusDiv = document.getElementById('lorebook-status');
      const previewDiv = document.getElementById('data-preview');
      const previewContent = document.getElementById('preview-content');

      updateStatus(statusDiv, '✅ 角色卡读取成功！角色信息已合并到世界观数据中。', 'success');

      // 更新预览
      if (previewContent) {
        previewContent.textContent = window.storyWeaverData.worldbookContent.substring(0, 300) + '...';
        previewDiv.classList.remove('hidden');
      }
    } catch (error) {
      console.error('[Story Weaver] 读取角色卡失败:', error);
      const statusDiv = document.getElementById('lorebook-status');
      updateStatus(statusDiv, '❌ 读取角色卡失败', 'error');
    }
  }

  /**
   * 处理生成大纲功能（简化版）
   */
  function handleGenerateOutline(panel) {
    console.log('[Story Weaver] 开始生成故事大纲');

    const generateBtn = panel.querySelector('#generate-outline');
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    const outputDiv = panel.querySelector('#output-content');

    // 获取用户输入
    const storyType = panel.querySelector('#story-type').value;
    const storyTheme = panel.querySelector('#story-theme').value;
    const chapterCount = parseInt(panel.querySelector('#chapter-count').value);
    const detailLevel = panel.querySelector('#detail-level').value;

    // 验证必要数据
    const worldbookContent = window.storyWeaverData?.worldbookContent;
    if (!worldbookContent && !storyTheme) {
      showNotification('❌ 请先读取世界观数据或填写故事主题！', 'error');
      return;
    }

    // 更新UI状态
    if (btnText) btnText.classList.add('hidden');
    if (btnLoading) btnLoading.classList.remove('hidden');
    generateBtn.disabled = true;

    // 模拟生成过程
    setTimeout(() => {
      const mockOutline = generateMockOutline({
        storyType,
        storyTheme,
        chapterCount,
        detailLevel,
      });

      outputDiv.innerHTML = mockOutline;

      // 恢复按钮状态
      if (btnText) btnText.classList.remove('hidden');
      if (btnLoading) btnLoading.classList.add('hidden');
      generateBtn.disabled = false;

      showNotification('✅ 故事大纲生成完成！', 'success');
    }, 2000);
  }

  /**
   * 处理复制结果功能
   */
  function handleCopyResult(panel) {
    const outputDiv = panel.querySelector('#output-content');

    if (!outputDiv || outputDiv.querySelector('.output-placeholder')) {
      showNotification('❌ 没有可复制的内容！', 'error');
      return;
    }

    const content = outputDiv.innerText || outputDiv.textContent;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        showNotification('✅ 大纲已复制到剪贴板！', 'success');
      });
    } else {
      // 备用方法
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        showNotification('✅ 大纲已复制到剪贴板！', 'success');
      } catch (err) {
        showNotification('❌ 复制失败，请手动复制！', 'error');
      }

      document.body.removeChild(textArea);
    }
  }

  /**
   * 处理保存结果功能
   */
  function handleSaveResult(panel) {
    const outputDiv = panel.querySelector('#output-content');

    if (!outputDiv || outputDiv.querySelector('.output-placeholder')) {
      showNotification('❌ 没有可保存的内容！', 'error');
      return;
    }

    const content = outputDiv.innerText || outputDiv.textContent;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
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
      showNotification(`✅ 大纲已保存为 ${filename}`, 'success');
    } catch (error) {
      console.error('保存失败:', error);
      showNotification('❌ 保存失败，请检查浏览器权限！', 'error');
    }
  }

  /**
   * 生成模拟大纲
   */
  function generateMockOutline(formData) {
    const typeEmojis = {
      fantasy: '🏰',
      romance: '💖',
      mystery: '🔍',
      scifi: '🚀',
      'slice-of-life': '🌸',
      action: '⚔️',
      drama: '🎭',
      custom: '🎨',
    };

    const typeNames = {
      fantasy: '奇幻冒险',
      romance: '浪漫爱情',
      mystery: '悬疑推理',
      scifi: '科幻未来',
      'slice-of-life': '日常生活',
      action: '动作冒险',
      drama: '情感剧情',
      custom: '自定义',
    };

    let outline = `<div class="outline-header">
      <h2>${typeEmojis[formData.storyType]} ${typeNames[formData.storyType]}故事大纲</h2>
      <div class="outline-meta">
        <span class="meta-item">📅 生成时间：${new Date().toLocaleString()}</span>
        <span class="meta-item">📖 章节数：${formData.chapterCount}</span>
      </div>
    </div>`;

    outline += '<div class="outline-section"><h3>📚 章节大纲</h3><div class="chapters-container">';

    for (let i = 1; i <= formData.chapterCount; i++) {
      outline += `
        <div class="chapter-item">
          <h4>第${i}章：${generateChapterTitle(i, formData.chapterCount)}</h4>
          <div class="chapter-content">
            <p>• 章节主要内容和发展方向</p>
            <p>• 角色互动和情节推进</p>
            <p>• 为下一章做铺垫</p>
          </div>
        </div>`;
    }

    outline += '</div></div>';

    return outline;
  }

  /**
   * 生成章节标题
   */
  function generateChapterTitle(chapterNum, totalChapters) {
    const titles = {
      1: ['序章', '开端', '起始'],
      middle: ['挑战', '冒险', '探索', '发现'],
      final: ['决战', '终章', '归来'],
    };

    if (chapterNum === 1) {
      return titles[1][Math.floor(Math.random() * titles[1].length)];
    } else if (chapterNum === totalChapters) {
      return titles.final[Math.floor(Math.random() * titles.final.length)];
    } else {
      return titles.middle[Math.floor(Math.random() * titles.middle.length)];
    }
  }

  /**
   * 更新状态显示
   */
  function updateStatus(statusElement, message, type = 'info') {
    if (!statusElement) return;

    const colors = {
      info: '#aaaaaa',
      success: '#4a7c59',
      warning: '#ffa500',
      error: '#e74c3c',
    };

    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    };

    statusElement.style.color = colors[type] || colors.info;
    statusElement.innerHTML = `<span class="status-icon">${icons[type] || 'ℹ️'}</span>${message}`;
  }

  /**
   * 显示通知消息
   */
  function showNotification(message, type = 'success') {
    // 使用SillyTavern的通知系统（如果可用）
    if (typeof toastr !== 'undefined') {
      toastr[type](message);
    } else {
      // 备用通知方式
      console.log(`[Story Weaver] ${type}: ${message}`);
    }
  }

  /**
   * 初始化扩展设置UI
   */
  function setupExtensionUI() {
    // 创建设置HTML
    const settingsHtml = `
       <div class="story-weaver-settings">
         <div class="inline-drawer">
           <div class="inline-drawer-toggle inline-drawer-header">
             <b>📖 Story Weaver</b>
             <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
           </div>
           <div class="inline-drawer-content">
             <label class="checkbox_label">
               <input id="story_weaver_enabled" type="checkbox" checked>
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

    // 添加到扩展设置面板
    $('#extensions_settings').append(settingsHtml);

    // 绑定面板打开按钮事件
    $('#story_weaver_open_panel').on('click', showStoryWeaverPanel);

    // 绑定启用/禁用事件
    $('#story_weaver_enabled').on('change', function () {
      extensionSettings.enabled = this.checked;
      saveSettings();
      console.log('[Story Weaver] 扩展状态:', this.checked ? '启用' : '禁用');
    });
  }

  // 扩展初始化 - 使用SillyTavern标准方式
  $(document).ready(function () {
    // 等待扩展设置面板加载
    if (typeof extension_settings === 'undefined') {
      setTimeout(
        () =>
          $(document).ready(function () {
            initExtension();
          }),
        100,
      );
      return;
    }

    initExtension();
  });

  function initExtension() {
    // 加载设置
    loadSettings();

    // 设置UI
    setupExtensionUI();

    // 标记扩展为已启用
    isExtensionEnabled = true;

    console.log('[Story Weaver] 扩展初始化完成');
  }
})();
