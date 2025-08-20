// Story Weaver Extension for SillyTavern
// Simple implementation following ST extension standards

(() => {
  'use strict';

  const MODULE_NAME = 'story-weaver';

  // Default Prompt Template
  const DEFAULT_PROMPT_TEMPLATE = `You are an expert storyteller and world-building assistant. Your task is to generate a compelling and structured story outline for <user> ({{user}}).

### CONTEXT & LORE ###
Here is the established context, including world settings and character information.

**Worldbook Entries:**
{{lorebook}}

**Character Information:**
{{character}}

### USER REQUIREMENTS ###
Based on the context above, generate a story outline that meets the following user requirements.

* **Story Type:** {story_type}
* **Core Theme / Conflict:** {story_theme}
* **Narrative Style:** {story_style}
* **Expected Chapters:** {chapter_count}
* **Outline Detail Level:** {detail_level}
* **Special Requirements:** {special_requirements}
* **Output Options:**
    * Include Overall Summary: {include_summary}
    * Include Character Arcs: {include_characters}
    * Include Thematic Analysis: {include_themes}

### TASK ###
Generate a story outline divided into {chapter_count} chapters. The outline should be creative, coherent, and strictly adhere to all the user requirements provided above. The output should be in clean, well-structured Markdown format.`;

  // Settings
  let settings = {
    enabled: true,
  };

  // Extension state
  let isInitialized = false;

  // -----------------------------
  // Placeholder Engine (Custom)
  // -----------------------------
  const placeholderRegistry = new Map();

  function registerPlaceholder(name, handler) {
    placeholderRegistry.set(name, handler);
  }

  function applyCustomPlaceholders(inputText, env = {}) {
    if (!inputText) return '';
    // Match: {{ name [args...] }}  (args are free-form, space-separated)
    const pattern = /\{\{\s*([a-zA-Z0-9_.-]+)(?:\s+([^}]*?))?\s*\}\}/g;
    return inputText.replace(pattern, (full, key, argStr = '') => {
      const handler = placeholderRegistry.get(key) || placeholderRegistry.get(`sw.${key}`);
      if (!handler) return full; // unknown placeholder: keep for native pipeline
      const args = argStr ? argStr.trim().split(/\s+/) : [];
      try {
        const value = handler({ args, env });
        if (value == null) return full; // keep for native pipeline
        const str = String(value);
        return str.trim().length === 0 ? full : str;
      } catch (e) {
        console.warn(`[Story Weaver] Placeholder '${key}' failed:`, e);
        return full;
      }
    });
  }

  function getSTContext() {
    try {
      return typeof getContext === 'function' ? getContext() : {};
    } catch (_) {
      return {};
    }
  }

  function formatWorldbookFromContext() {
    const ctx = getSTContext();
    const entries = ctx?.worldInfoData?.entries || [];
    const active = entries.filter(e => !e.disable);
    // Try to respect an 'order' or 'position' property if present
    active.sort((a, b) => (a.order ?? a.position ?? 0) - (b.order ?? b.position ?? 0));
    return active
      .map(entry => {
        const keys = Array.isArray(entry.key) ? entry.key : [entry.key];
        return `- Keywords: ${keys.filter(Boolean).join(', ')}\n  Content: ${entry.content || ''}`;
      })
      .join('\n\n');
  }

  function formatCharacterFromContext() {
    const ctx = getSTContext();
    const char = ctx?.characters?.[ctx?.characterId];
    if (!char) return '';
    return `Name: ${char.name || ''}\nDescription: ${char.description || ''}\nPersonality: ${
      char.personality || ''
    }\nScenario: ${char.scenario || ''}`;
  }

  function formatContextMessages(limit) {
    const ctx = getSTContext();
    const messages = ctx?.chat || ctx?.messages || [];
    const slice = Number.isFinite(limit) ? messages.slice(-limit) : messages;
    return slice
      .map(m => {
        const who = m?.is_user ? 'User' : m?.is_system ? 'System' : 'Assistant';
        const text = m?.mes ?? m?.text ?? '';
        return `${who}: ${text}`;
      })
      .join('\n');
  }

  function getUserNameFromContext() {
    const ctx = getSTContext();
    // 尝试多种可能字段
    return ctx?.userName || ctx?.username || ctx?.profile?.name || ctx?.settings?.user_name || 'User';
  }

  // Default placeholders
  registerPlaceholder('sw.lorebook', () => formatWorldbookFromContext() || '');
  registerPlaceholder('lorebook', () => formatWorldbookFromContext() || '');
  registerPlaceholder('sw.character', () => formatCharacterFromContext() || '');
  registerPlaceholder('character', () => formatCharacterFromContext() || '');
  registerPlaceholder('sw.context', ({ args }) => {
    const n = parseInt(args?.[0] ?? '0', 10);
    return formatContextMessages(Number.isFinite(n) && n > 0 ? n : undefined);
  });
  registerPlaceholder('context', ({ args }) => {
    const n = parseInt(args?.[0] ?? '0', 10);
    return formatContextMessages(Number.isFinite(n) && n > 0 ? n : undefined);
  });
  registerPlaceholder('user', () => getUserNameFromContext());
  registerPlaceholder('sw.user', () => getUserNameFromContext());

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
        <button id="minimize-panel" class="minimize-btn" title="最小化">—</button>
        <button id="close-panel" class="close-btn" title="关闭面板">
          <span>✕</span>
        </button>
      </div>
      <div class="story-weaver-content">
        

        <!-- 剧情上下文设定区 -->
        <section class="content-section">
          <h3 class="section-title">
            <span class="section-icon">📖</span>
            剧情上下文设定
          </h3>
          <div class="section-content">
            <div class="form-group">
              <label for="context-length" class="form-label"> 读取对话历史长度： </label>
              <div class="input-with-unit">
                <input type="number" id="context-length" value="100" min="0" max="500" class="form-input" />
                <span class="input-unit">条消息</span>
              </div>
              <div class="form-help">设置为0则不读取对话历史，仅基于世界观生成</div>
            </div>
            <div id="context-status" class="status-display">
              <span class="status-icon">ℹ️</span>
              将根据设定自动读取最近的对话内容
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
                <option value="horror">👻 恐怖惊悚</option>
                <option value="comedy">😄 轻松喜剧</option>
                <option value="custom">🎨 自定义</option>
              </select>
            </div>

            <div class="form-group">
              <label for="story-theme" class="form-label"> 故事主题/核心冲突： </label>
              <textarea
                id="story-theme"
                class="form-textarea"
                placeholder="例如：主角需要拯救被诅咒的王国，同时面对内心的恐惧与过去的阴霾。在这个过程中，主角将遇到值得信赖的伙伴，也会面临艰难的道德选择..."
                rows="4"
              ></textarea>
              <div class="form-help">详细描述您希望故事围绕的核心主题、冲突或目标</div>
            </div>

            <div class="form-group">
              <label for="story-style" class="form-label">叙事风格：</label>
              <select id="story-style" class="form-select">
                <option value="descriptive">📝 详细描述型</option>
                <option value="dialogue">💬 对话推进型</option>
                <option value="action">⚡ 快节奏动作型</option>
                <option value="introspective">🤔 内心独白型</option>
                <option value="episodic">📚 章节式结构</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="chapter-count" class="form-label"> 期望章节数： </label>
                <input type="number" id="chapter-count" value="5" min="3" max="20" class="form-input" />
              </div>
              <div class="form-group flex-1">
                <label for="detail-level" class="form-label"> 大纲详细程度： </label>
                <select id="detail-level" class="form-select">
                  <option value="brief">简要大纲</option>
                  <option value="detailed" selected>详细大纲</option>
                  <option value="comprehensive">全面大纲</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="special-requirements" class="form-label"> 特殊要求（可选）： </label>
              <textarea
                id="special-requirements"
                class="form-textarea"
                placeholder="例如：需要包含特定角色的发展弧线、某些情节元素、特定的情感基调等..."
                rows="3"
              ></textarea>
            </div>
          </div>
        </section>

        <!-- Prompt模板编辑器区 -->
        <section class="content-section">
          <details id="prompt-editor-container">
            <summary class="section-title prompt-summary">
              <span class="section-icon">🧠</span>
              编辑底层提示词模板 (Prompt)
              <span class="summary-arrow">▶</span>
            </summary>
            <div class="section-content">
              <div class="form-group">
                <label for="prompt-template-editor" class="form-label">
                  您可以在此自定义用于生成大纲的完整提示词。插件会将 \`{worldbook}\`, \`{character}\`, \`{requirements}\` 等占位符替换为实际内容。
                </label>
                <textarea
                  id="prompt-template-editor"
                  class="form-textarea prompt-editor"
                  rows="15"
                ></textarea>
                <div class="form-help">
                  提示：修改后将立即生效。如需恢复默认设置，可刷新插件或重新加载。
                </div>
              </div>
            </div>
          </details>
        </section>

        <!-- 生成控制区 -->
        <section class="content-section">
          <div class="generate-section">
            <button id="generate-outline" class="generate-btn">
              <span class="btn-icon">🎭</span>
              <span class="btn-text">生成故事大纲</span>
              <span class="btn-loading hidden">🔄</span>
            </button>
            <div class="generate-options">
              <label class="checkbox-label">
                <input type="checkbox" id="include-summary" checked />
                <span class="checkmark"></span>
                包含整体摘要
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="include-characters" checked />
                <span class="checkmark"></span>
                包含角色发展
              </label>
              <label class="checkbox-label">
                <input type="checkbox" id="include-themes" />
                <span class="checkmark"></span>
                包含主题分析
              </label>
            </div>
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
              <button id="export-result" class="action-btn" title="导出为Markdown">
                <span class="btn-icon">📤</span>
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
            <div id="output-stats" class="output-stats hidden">
              <div class="stat-item">
                <span class="stat-label">字数统计：</span>
                <span id="word-count" class="stat-value">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">生成时间：</span>
                <span id="generation-time" class="stat-value">--</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">章节数量：</span>
                <span id="actual-chapters" class="stat-value">0</span>
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
    // Initialize Prompt Editor
    const promptEditor = panel.querySelector('#prompt-template-editor');
    if (promptEditor) {
      promptEditor.value = DEFAULT_PROMPT_TEMPLATE.trim();
    }

    // Close button
    const closeBtn = panel.querySelector('#close-panel');
    if (closeBtn) {
      closeBtn.onclick = () => (panel.style.display = 'none');
    }

    // Minimize to sprite
    const minimizeBtn = panel.querySelector('#minimize-panel');
    const sprite = document.getElementById('story-weaver-sprite') || createSprite();
    if (minimizeBtn) {
      minimizeBtn.onclick = () => {
        panel.style.display = 'none';
        sprite.style.display = 'flex';
      };
    }
    if (sprite) {
      sprite.onclick = () => {
        panel.style.display = 'block';
        sprite.style.display = 'none';
      };
    }

    // Drag move panel by header
    makeDraggable(panel, panel.querySelector('.story-weaver-header'));
    // Resizable by edges
    makeResizable(panel);

    // 已改用占位符，移除世界书/角色读取按钮绑定

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

  function createSprite() {
    const sprite = document.createElement('div');
    sprite.id = 'story-weaver-sprite';
    sprite.className = 'story-weaver-sprite';
    sprite.innerHTML = '<span>📖</span>';
    document.body.appendChild(sprite);
    return sprite;
  }

  function makeDraggable(target, handle) {
    if (!target || !handle) return;
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    handle.style.cursor = 'move';
    handle.addEventListener('mousedown', e => {
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = target.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', e => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      target.style.left = `${startLeft + dx}px`;
      target.style.top = `${startTop + dy}px`;
      target.style.transform = 'translate(0, 0)';
      target.style.position = 'fixed';
    });
    document.addEventListener('mouseup', () => {
      isDown = false;
      document.body.style.userSelect = '';
    });
  }

  function makeResizable(target) {
    if (!target) return;
    const resizer = document.createElement('div');
    resizer.style.position = 'absolute';
    resizer.style.right = '0';
    resizer.style.bottom = '0';
    resizer.style.width = '14px';
    resizer.style.height = '14px';
    resizer.style.cursor = 'se-resize';
    resizer.style.background = 'transparent';
    target.appendChild(resizer);

    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startW = 0;
    let startH = 0;

    resizer.addEventListener('mousedown', e => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = target.getBoundingClientRect();
      startW = rect.width;
      startH = rect.height;
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', e => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      target.style.width = `${Math.max(480, startW + dx)}px`;
      target.style.height = `${Math.max(360, startH + dy)}px`;
      target.style.maxWidth = 'none';
      target.style.maxHeight = 'none';
    });

    document.addEventListener('mouseup', () => {
      isResizing = false;
      document.body.style.userSelect = '';
    });
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
  // 已改用占位符策略，不再单独读取世界书

  /**
   * Handle read character
   */
  // 已改用占位符策略，不再单独读取角色

  /**
   * Constructs the final prompt by reading the template and injecting data.
   */
  function constructPrompt(panel) {
    // 1. 从UI获取当前的Prompt模板
    const template = panel.querySelector('#prompt-template-editor')?.value || DEFAULT_PROMPT_TEMPLATE;

    // 2. 收集所有需要的数据
    // 世界书和角色数据
    const worldbookData = window.storyWeaverData?.worldbookContent || 'N/A';
    const characterData = window.storyWeaverData?.characterContent || 'N/A';

    // 从UI收集用户需求
    const requirements = {
      story_type: panel.querySelector('#story-type')?.value || '',
      story_theme: panel.querySelector('#story-theme')?.value || '',
      story_style: panel.querySelector('#story-style')?.value || '',
      chapter_count: panel.querySelector('#chapter-count')?.value || '5',
      detail_level: panel.querySelector('#detail-level')?.value || '',
      special_requirements: panel.querySelector('#special-requirements')?.value || 'None',
      include_summary: panel.querySelector('#include-summary')?.checked ? 'Yes' : 'No',
      include_characters: panel.querySelector('#include-characters')?.checked ? 'Yes' : 'No',
      include_themes: panel.querySelector('#include-themes')?.checked ? 'Yes' : 'No',
    };

    // 3. 替换占位符（我们先用键值替换，再跑自建占位符，再尝试原生占位符）
    let finalPrompt = template;
    finalPrompt = finalPrompt.replace(/{worldbook}/g, worldbookData);
    finalPrompt = finalPrompt.replace(/{character}/g, characterData);
    for (const key in requirements) {
      const placeholder = new RegExp(`{${key}}`, 'g');
      finalPrompt = finalPrompt.replace(placeholder, requirements[key]);
    }
    // 自建占位符引擎
    finalPrompt = applyCustomPlaceholders(finalPrompt, { context: getSTContext() });

    // 4. 可选：尝试走 SillyTavern 原生占位符解析（若前端暴露该函数）
    finalPrompt = applyNativePlaceholdersIfAvailable(finalPrompt);

    console.log('[Story Weaver] Final prompt constructed:', finalPrompt);
    return finalPrompt;
  }

  /**
   * If SillyTavern exposes a placeholder applying function, use it to keep
   * compatibility with native macros/placeholders. Silently falls back.
   */
  function applyNativePlaceholdersIfAvailable(text) {
    try {
      const ctx = typeof getContext === 'function' ? getContext() : {};
      const candidates = [
        // Common possibilities in ST builds; all optional
        window?.replacePlaceholders,
        window?.applyPlaceholders,
        window?.formatPromptPlaceholders,
        window?.ST?.placeholders?.apply,
      ];
      for (const fn of candidates) {
        if (typeof fn === 'function') {
          // Many ST helpers accept (text, context). If only one arg is supported, ignore ctx.
          try {
            return fn.length >= 2 ? fn(text, ctx) : fn(text);
          } catch (_) {
            // try next
          }
        }
      }
    } catch (e) {
      console.warn('[Story Weaver] Native placeholder application failed:', e);
    }
    return text;
  }

  /**
   * Handle generate outline
   */
  async function handleGenerateOutline(panel) {
    console.log('[Story Weaver] Generating outline...');

    const generateBtn = panel.querySelector('#generate-outline');
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    const outputDiv = panel.querySelector('#output-content');

    if (!generateBtn || !outputDiv) return;

    // Validate data
    const storyTheme = panel.querySelector('#story-theme')?.value || '';
    const hasWorldbook = window.storyWeaverData?.worldbookContent;
    const hasCharacter = window.storyWeaverData?.characterContent;

    if (!hasWorldbook && !hasCharacter && !storyTheme.trim()) {
      showNotification('请先读取世界书/角色数据或填写故事主题', 'error');
      return;
    }

    // 构建最终的 Prompt
    const prompt = constructPrompt(panel);

    // Update UI
    generateBtn.disabled = true;
    if (btnText) btnText.classList.add('hidden');
    if (btnLoading) btnLoading.classList.remove('hidden');
    outputDiv.innerHTML = '<div class="generating-indicator">🔄 正在与AI沟通，请稍候...</div>';

    try {
      // === 真实API调用 ===
      const apiUrl = (window?.extension_settings?.api_base || window?.SillyTavern?.api_base || '') + '/api/v1/generate';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          mode: 'instruct', // 使用instruct模式而不是chat模式
          max_new_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9,
          top_k: 50,
          stop_sequence: [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      const resultText =
        data.results?.[0]?.text || data.choices?.[0]?.text || data.text || '生成失败，未获取到有效内容';

      // 显示结果
      const pre = document.createElement('pre');
      pre.textContent = resultText;
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.fontFamily = 'inherit';
      pre.style.fontSize = '14px';
      pre.style.lineHeight = '1.6';
      outputDiv.innerHTML = '';
      outputDiv.appendChild(pre);

      showNotification('故事大纲生成完成！', 'success');
    } catch (error) {
      console.error('[Story Weaver] Error generating outline:', error);

      // 如果API调用失败，回退到Mock生成
      console.log('[Story Weaver] Falling back to mock generation...');
      const mockOutline = generateMockOutline({
        storyType: panel.querySelector('#story-type')?.value || 'fantasy',
        storyTheme: storyTheme,
        chapterCount: parseInt(panel.querySelector('#chapter-count')?.value) || 5,
        worldbook: window.storyWeaverData?.worldbook || [],
        character: window.storyWeaverData?.character || null,
      });

      outputDiv.innerHTML = `
        <div class="output-placeholder warning">
          ⚠️ API调用失败，使用本地模拟生成
          <p style="font-size: 12px; color: #ffa500; margin-top: 8px;">错误: ${error.message}</p>
        </div>
        ${mockOutline}
      `;

      showNotification('API调用失败，已使用本地模拟生成', 'warning');
    } finally {
      // 恢复UI
      generateBtn.disabled = false;
      if (btnText) btnText.classList.remove('hidden');
      if (btnLoading) btnLoading.classList.add('hidden');
    }
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
