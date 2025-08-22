// Story Weaver Extension for SillyTavern
// 完全使用box.js风格的请求方式 - TavernHelper.generateRaw + structured prompts
// 集成SillyTavern World Info API和聊天历史访问

(() => {
  'use strict';

  const MODULE_NAME = 'story-weaver';

  // Default Prompt Template
  const DEFAULT_PROMPT_TEMPLATE = `You are an expert storyteller and world-building assistant. Your task is to generate a compelling and structured story outline.

### CONTEXT & LORE ###
-- System Prompt --
{system_prompt}

Here is the established context, including world settings and character information.

-- World Info (before chat) --
{worldInfoBefore}

**Worldbook Entries:**
{worldbook}

**Character Information:**
{character}

-- Character Persona --
{char_persona}

-- Scenario --
{char_scenario}

-- Memory Summary --
{memory_summary}

-- Author's Note --
{authors_note}

-- Jailbreak / Preset Prompt (if any) --
{jailbreak}

-- Recent Chat History --
{chat_history}

-- World Info (after chat) --
{worldInfoAfter}

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
Generate a story outline divided into {chapter_count} chapters. The outline should be creative, coherent, and strictly adhere to all the user requirements provided above. The output should be in clean, well-structured Markdown format, and in Simplified Chinese.`;

  // Settings
  let settings = {
    enabled: true,
    injectEnabled: false,
    position: 0,
    depth: 0,
    scan: false,
    role: 'system',
    template: '',
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
            <div class="form-group">
              <button id="refresh-data-btn" class="action-btn" type="button" style="margin-top: 10px;">
                <span class="btn-icon">🔄</span>
                手动刷新数据
              </button>
              <button id="preview-worldinfo-btn" class="action-btn" type="button" style="margin-top: 10px; margin-left: 10px;">
                <span class="btn-icon">👁️</span>
                预览世界书内容
              </button>
              <button id="preview-prompt-btn" class="action-btn" type="button" style="margin-top: 10px; margin-left: 10px;">
                <span class="btn-icon">📝</span>
                预览完整提示词
              </button>
              <div class="form-help">如果世界书或角色数据没有正确加载，可以点击此按钮手动刷新。点击预览按钮可以查看当前获取的数据和构建的完整提示词</div>
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

    // Refresh data button
    const refreshBtn = panel.querySelector('#refresh-data-btn');
    if (refreshBtn) {
      refreshBtn.onclick = async () => {
        try {
          refreshBtn.disabled = true;
          refreshBtn.innerHTML = '<span class="btn-icon">🔄</span> 刷新中...';
          
          const result = await refreshData();
          const statusDiv = panel.querySelector('#context-status');
          if (statusDiv) {
            updateStatus(
              statusDiv,
              `✅ 数据已刷新 - 世界书: ${result.worldbook.entries.length}条, 角色: ${
                result.character.character ? '已加载' : '未找到'
              }, 聊天: ${result.chatHistory.summary}`,
              'success',
            );
          }
          showNotification('数据刷新完成', 'success');
        } catch (error) {
          showNotification('数据刷新失败: ' + error.message, 'error');
        } finally {
          refreshBtn.disabled = false;
          refreshBtn.innerHTML = '<span class="btn-icon">🔄</span> 手动刷新数据';
        }
      };
    }

    // Preview world info button
    const previewBtn = panel.querySelector('#preview-worldinfo-btn');
    if (previewBtn) {
      previewBtn.onclick = async () => {
        try {
          previewBtn.disabled = true;
          previewBtn.innerHTML = '<span class="btn-icon">⏳</span> 加载中...';
          
          await showWorldInfoPreview();
        } catch (error) {
          showNotification('预览世界书失败: ' + error.message, 'error');
        } finally {
          previewBtn.disabled = false;
          previewBtn.innerHTML = '<span class="btn-icon">👁️</span> 预览世界书内容';
        }
      };
    }

    // Preview prompt button
    const previewPromptBtn = panel.querySelector('#preview-prompt-btn');
    if (previewPromptBtn) {
      previewPromptBtn.onclick = async () => {
        try {
          previewPromptBtn.disabled = true;
          previewPromptBtn.innerHTML = '<span class="btn-icon">⏳</span> 构建中...';
          
          await showPromptPreview(panel);
        } catch (error) {
          showNotification('预览提示词失败: ' + error.message, 'error');
        } finally {
          previewPromptBtn.disabled = false;
          previewPromptBtn.innerHTML = '<span class="btn-icon">📝</span> 预览完整提示词';
        }
      };
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
   * 获取世界书信息 - 使用SillyTavern标准方法
   */
  async function getWorldInfoData(chatHistory = '') {
    try {
      // Method 1: Try to call SillyTavern's global getSortedEntries function
      // This function should be available globally if world-info.js has loaded
      if (typeof window.getSortedEntries === 'function') {
        console.log('[Story Weaver] Using global getSortedEntries...');
        try {
          const entries = await window.getSortedEntries();
          if (entries && entries.length > 0) {
            const formattedEntries = entries
              .filter(entry => !entry.disable && entry.content?.trim())
              .slice(0, 20)
              .map(entry => {
                const title = entry.comment || (Array.isArray(entry.key) ? entry.key[0] : entry.key) || 'Entry';
                const world = entry.world ? ` (${entry.world})` : '';
                return `**${title}${world}**\n${entry.content}`;
              })
              .join('\n\n');
            
            console.log(`[Story Weaver] Found ${entries.length} world info entries using getSortedEntries`);
            return formattedEntries;
          }
        } catch (getSortedError) {
          console.log('[Story Weaver] getSortedEntries failed:', getSortedError);
        }
      }

      // Method 2: Try to access world info through the same method used by main chat
      // This mimics how SillyTavern generates prompts with world info
      if (typeof window.getWorldInfoPrompt === 'function') {
        console.log('[Story Weaver] Using getWorldInfoPrompt...');
        try {
          const chat = window.chat || [];
          const maxContext = 8192; // Use reasonable context size
          const isDryRun = true; // Don't trigger events, just get the data
          
          const worldInfoResult = await window.getWorldInfoPrompt(chat, maxContext, isDryRun);
          if (worldInfoResult && worldInfoResult.worldInfoString) {
            console.log(`[Story Weaver] Found world info via getWorldInfoPrompt: ${worldInfoResult.worldInfoString.length} characters`);
            return worldInfoResult.worldInfoString;
          }
        } catch (getWorldInfoError) {
          console.log('[Story Weaver] getWorldInfoPrompt failed:', getWorldInfoError);
        }
      }

      // Method 3: Try to directly access the individual lore functions if they're available
      console.log('[Story Weaver] Trying individual lore functions...');
      const allEntries = [];
      
      // These functions might be available in the global scope
      const loreGetters = [
        { name: 'getGlobalLore', fn: window.getGlobalLore },
        { name: 'getCharacterLore', fn: window.getCharacterLore },
        { name: 'getChatLore', fn: window.getChatLore },
        { name: 'getPersonaLore', fn: window.getPersonaLore }
      ];
      
      for (const { name, fn } of loreGetters) {
        if (typeof fn === 'function') {
          try {
            console.log(`[Story Weaver] Calling ${name}...`);
            const entries = await fn();
            if (entries && Array.isArray(entries) && entries.length > 0) {
              allEntries.push(...entries);
              console.log(`[Story Weaver] ${name} returned ${entries.length} entries`);
            }
          } catch (loreError) {
            console.log(`[Story Weaver] ${name} failed:`, loreError);
          }
        }
      }

      if (allEntries.length > 0) {
        const formattedEntries = allEntries
          .filter(entry => !entry.disable && entry.content && entry.content.trim())
          .slice(0, 20)
          .map(entry => {
            const title = entry.comment || (Array.isArray(entry.key) ? entry.key[0] : entry.key) || 'Entry';
            const world = entry.world ? ` (${entry.world})` : '';
            return `**${title}${world}**\n${entry.content}`;
          })
          .join('\n\n');
        
        console.log(`[Story Weaver] Found ${allEntries.length} total world info entries from individual functions`);
        return formattedEntries;
      }

      // Method 4: Try to access via event system - trigger world info loading
      if (window.eventSource && typeof window.eventSource.emit === 'function') {
        console.log('[Story Weaver] Trying to trigger world info loading via events...');
        try {
          // Create a promise that resolves when world info is loaded
          const worldInfoPromise = new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 3000); // 3 second timeout
            
            // Listen for world info loaded event
            if (window.eventSource && typeof window.eventSource.on === 'function') {
              window.eventSource.on('WORLDINFO_ENTRIES_LOADED', ({ globalLore, characterLore, chatLore, personaLore }) => {
                clearTimeout(timeout);
                const allLore = [...(globalLore || []), ...(characterLore || []), ...(chatLore || []), ...(personaLore || [])];
                console.log(`[Story Weaver] Event triggered, got ${allLore.length} entries`);
                resolve(allLore);
              });
            }
            
            // Try to trigger world info loading
            // This might trigger the loading process
            if (typeof window.checkWorldInfo === 'function') {
              window.checkWorldInfo(window.chat || [], 8192, true).then(() => {
                console.log('[Story Weaver] checkWorldInfo completed');
              }).catch(err => {
                console.log('[Story Weaver] checkWorldInfo failed:', err);
                clearTimeout(timeout);
                resolve(null);
              });
            } else {
              clearTimeout(timeout);
              resolve(null);
            }
          });
          
          const eventEntries = await worldInfoPromise;
          if (eventEntries && eventEntries.length > 0) {
            const formattedEntries = eventEntries
              .filter(entry => !entry.disable && entry.content && entry.content.trim())
              .slice(0, 20)
              .map(entry => {
                const title = entry.comment || (Array.isArray(entry.key) ? entry.key[0] : entry.key) || 'Entry';
                const world = entry.world ? ` (${entry.world})` : '';
                return `**${title}${world}**\n${entry.content}`;
              })
              .join('\n\n');
            
            console.log(`[Story Weaver] Found ${eventEntries.length} world info entries via events`);
            return formattedEntries;
          }
        } catch (eventError) {
          console.log('[Story Weaver] Event-based world info loading failed:', eventError);
        }
      }

      // Method 5: Last resort - manual scanning for any world info objects
      console.log('[Story Weaver] Scanning for any available world info objects...');
      
      // Try to find any world info related variables in the global scope
      const worldInfoVars = [
        'world_info',
        'selected_world_info',
        'world_info_data',
        'world_info_budget',
        'world_info_depth',
        'world_names'
      ];
      
      for (const varName of worldInfoVars) {
        const value = window[varName];
        console.log(`[Story Weaver] ${varName}:`, typeof value, Array.isArray(value) ? value.length : (value && typeof value === 'object') ? Object.keys(value).length : value);
      }

      // Try to access the global world_info object directly
      const worldInfo = window.world_info;
      if (worldInfo && typeof worldInfo === 'object') {
        console.log('[Story Weaver] Examining world_info object:', Object.keys(worldInfo));
        
        if (worldInfo.entries && typeof worldInfo.entries === 'object') {
          const entries = Object.values(worldInfo.entries);
          console.log(`[Story Weaver] Found ${entries.length} entries in world_info.entries`);
          
          if (entries.length > 0) {
            const formattedEntries = entries
              .filter(entry => entry && !entry.disable && entry.content && entry.content.trim())
              .slice(0, 10)
              .map(entry => {
                const title = entry.comment || (Array.isArray(entry.key) ? entry.key[0] : entry.key) || 'Entry';
                return `**${title}**\n${entry.content}`;
              })
              .join('\n\n');

            if (formattedEntries) {
              console.log(`[Story Weaver] Successfully formatted ${entries.length} world info entries`);
              return formattedEntries;
            }
          }
        }
      }

      console.log('[Story Weaver] No world info found through any method');
      return '';
    } catch (error) {
      console.error('[Story Weaver] Error getting world info:', error);
      return '';
    }
  }

  /**
   * 获取角色数据 - 使用SillyTavern标准方法
   */
  function getCharacterData() {
    try {
      // Get current character from SillyTavern context
      const ctx = getCurrentContext();
      const characterId = ctx.characterId || window.this_chid;
      const characters = ctx.characters || window.characters || [];
      
      if (characterId !== undefined && characters[characterId]) {
        const character = characters[characterId];
        
        let characterInfo = `**角色名称**: ${character.name || 'Unknown'}\n\n`;
        
        if (character.description) {
          characterInfo += `**角色描述**:\n${character.description}\n\n`;
        }
        
        if (character.personality) {
          characterInfo += `**角色性格**:\n${character.personality}\n\n`;
        }
        
        if (character.scenario) {
          characterInfo += `**场景设定**:\n${character.scenario}\n\n`;
        }
        
        if (character.first_mes) {
          characterInfo += `**初始消息**:\n${character.first_mes}\n\n`;
        }
        
        // Add example dialogue if available
        if (character.mes_example) {
          characterInfo += `**对话示例**:\n${character.mes_example}\n\n`;
        }
        
        console.log('[Story Weaver] Character data loaded:', character.name);
        return characterInfo.trim();
      }

      // Fallback: Extract from chat messages
      const chat = window.chat;
      if (chat && Array.isArray(chat) && chat.length > 0) {
        const characterMessages = chat.filter(msg => msg.is_system || (!msg.is_user && msg.name));

        if (characterMessages.length > 0) {
          const latestCharMsg = characterMessages[characterMessages.length - 1];
          const characterName = latestCharMsg.name || 'Character';

          const characterContent = `**角色名称**: ${characterName}

**基于对话历史的角色信息**: 根据最近的对话内容分析角色特征`;

          console.log('[Story Weaver] Character data extracted from chat:', characterName);
          return characterContent;
        }
      }

      console.log('[Story Weaver] No character data found');
      return '';
    } catch (error) {
      console.error('[Story Weaver] Error reading character:', error);
      return '';
    }
  }

  /**
   * 获取当前上下文
   */
  function getCurrentContext() {
    try {
      // 尝试多种方式获取上下文
      if (typeof window.getContext === 'function') {
        return window.getContext();
      }

      // 手动构建上下文
      return {
        chat: window.chat || [],
        characters: window.characters || [],
        characterId: window.this_chid,
        groupId: window.selected_group,
      };
    } catch (error) {
      console.error('[Story Weaver] Error getting context:', error);
      return {
        chat: [],
        characters: [],
        characterId: undefined,
        groupId: undefined,
      };
    }
  }

  // ============ 旧的构建简单用户输入函数 - 已注释掉，使用buildStructuredPrompt替代 ============
  /**
   * 构建简单的用户输入 - 让SillyTavern的generate函数自动处理预设包含 - 已被buildStructuredPrompt替代
   */
  // async function constructSimpleUserInput(panel) {
  //   // 从UI收集用户需求
  //   const requirements = {
  //     story_type: panel.querySelector('#story-type')?.value || '',
  //     story_theme: panel.querySelector('#story-theme')?.value || '',
  //     story_style: panel.querySelector('#story-style')?.value || '',
  //     chapter_count: panel.querySelector('#chapter-count')?.value || '5',
  //     detail_level: panel.querySelector('#detail-level')?.value || '',
  //     special_requirements: panel.querySelector('#special-requirements')?.value || 'None',
  //     include_summary: panel.querySelector('#include-summary')?.checked ? 'Yes' : 'No',
  //     include_characters: panel.querySelector('#include-characters')?.checked ? 'Yes' : 'No',
  //     include_themes: panel.querySelector('#include-themes')?.checked ? 'Yes' : 'No',
  //   };
  //
  //   // 构建简单清晰的用户指令 - 让ST自动加载预设和世界书
  //   const userInput = `请帮我生成一个故事大纲：
  //
  // **故事类型**: ${requirements.story_type}
  // **故事主题/核心冲突**: ${requirements.story_theme}
  // **叙事风格**: ${requirements.story_style}
  // **章节数量**: ${requirements.chapter_count}章
  // **详细程度**: ${requirements.detail_level}
  // **特殊要求**: ${requirements.special_requirements}
  //
  // **输出选项**:
  // - 包含整体摘要: ${requirements.include_summary}
  // - 包含角色发展: ${requirements.include_characters}  
  // - 包含主题分析: ${requirements.include_themes}
  //
  // 请基于当前的角色设定、世界观背景和聊天历史，生成一个结构化的故事大纲。大纲应该分为${requirements.chapter_count}个章节，每个章节包含详细的情节描述。请使用Markdown格式输出。`;
  //
  //   console.log('[Story Weaver] Simple user input constructed:', userInput.length, 'characters');
  //   return userInput;
  // }
  // ============ 旧函数结束 ============

  function buildChatHistoryText(limit) {
    if (!limit || limit <= 0) return '';

    try {
      const ctx = getCurrentContext();
      const chat = ctx.chat || window.chat || [];

      if (!Array.isArray(chat)) return '';

      // Get the most recent messages up to the limit
      const messages = chat.slice(Math.max(0, chat.length - limit));
      
      return messages
        .map(msg => {
          // Format each message with speaker name and content
          const speaker = msg.is_user ? (ctx.name1 || window.name1 || 'User') : (msg.name || ctx.name2 || window.name2 || 'Assistant');
          const content = msg.mes || '';
          
          if (!content.trim()) return '';
          
          return `**${speaker}**: ${content}`;
        })
        .filter(Boolean)
        .join('\n\n');
    } catch (error) {
      console.error('[Story Weaver] Error building chat history:', error);
      return '';
    }
  }

  /**
   * 获取增强的聊天历史信息
   */
  function getEnhancedChatHistory(limit = 50) {
    try {
      const ctx = getCurrentContext();
      const chat = ctx.chat || window.chat || [];
      
      if (!Array.isArray(chat) || chat.length === 0) {
        return {
          recentHistory: '',
          totalMessages: 0,
          userMessages: 0,
          assistantMessages: 0,
          summary: '没有可用的聊天历史'
        };
      }

      const messages = chat.slice(Math.max(0, chat.length - limit));
      const userMessages = chat.filter(msg => msg.is_user).length;
      const assistantMessages = chat.filter(msg => !msg.is_user && !msg.is_system).length;
      
      const recentHistory = messages
        .map(msg => {
          const speaker = msg.is_user ? (ctx.name1 || window.name1 || 'User') : (msg.name || ctx.name2 || window.name2 || 'Assistant');
          const content = msg.mes || '';
          
          if (!content.trim()) return '';
          
          // Add timestamp if available
          const timestamp = msg.send_date ? new Date(msg.send_date).toLocaleTimeString() : '';
          const timeStr = timestamp ? ` [${timestamp}]` : '';
          
          return `**${speaker}**${timeStr}: ${content}`;
        })
        .filter(Boolean)
        .join('\n\n');

      return {
        recentHistory,
        totalMessages: chat.length,
        userMessages,
        assistantMessages,
        summary: `总共 ${chat.length} 条消息 (用户: ${userMessages}, 角色: ${assistantMessages})`
      };
    } catch (error) {
      console.error('[Story Weaver] Error getting enhanced chat history:', error);
      return {
        recentHistory: '',
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
        summary: '读取聊天历史时出错'
      };
    }
  }

  // -------- Plan A: 构建包含全部原生段落的完整Prompt --------
  function getContextSafe() {
    try {
      return typeof getContext === 'function' ? getContext() : {};
    } catch (_) {
      return {};
    }
  }

  // ============ 旧的生成方法 - 已注释掉，完全使用box.js方式 ============
  // 解析可用的内部生成函数：优先window，其次getContext()注入
  // function resolveGenFns() {
  //   const ctx = getContextSafe();
  //   return {
  //     quiet:
  //       typeof window.generateQuietPrompt === 'function'
  //         ? window.generateQuietPrompt
  //         : typeof ctx.generateQuietPrompt === 'function'
  //         ? ctx.generateQuietPrompt
  //         : null,
  //     raw:
  //       typeof window.generateRaw === 'function'
  //         ? window.generateRaw
  //         : typeof ctx.generateRaw === 'function'
  //         ? ctx.generateRaw
  //         : null,
  //     webllm:
  //       typeof window.generateWebLlmChatPrompt === 'function'
  //         ? window.generateWebLlmChatPrompt
  //         : typeof ctx.generateWebLlmChatPrompt === 'function'
  //         ? ctx.generateWebLlmChatPrompt
  //         : null,
  //   };
  // }

  // async function waitForGenerationFns(timeoutMs = 6000, intervalMs = 100) {
  //   const start = Date.now();
  //   while (Date.now() - start < timeoutMs) {
  //     const fns = resolveGenFns();
  //     if (fns.quiet || fns.raw || fns.webllm) return fns;
  //     await new Promise(r => setTimeout(r, intervalMs));
  //   }
  //   return resolveGenFns();
  // }
  // ============ 旧的生成方法结束 ============

  function resolveSystemPrompt(ctx) {
    return (
      window?.power_user?.context?.story_string || ctx?.power_user?.context?.story_string || ctx?.system_prompt || ''
    );
  }

  function resolveCharPersona(ctx) {
    try {
      const idx = window?.this_chid ?? ctx?.characterId;
      const ch = (window?.characters || ctx?.characters || [])[idx] || {};
      return ch?.personality || ch?.persona || ch?.description || '';
    } catch (_) {
      return '';
    }
  }

  function resolveCharScenario(ctx) {
    try {
      const idx = window?.this_chid ?? ctx?.characterId;
      const ch = (window?.characters || ctx?.characters || [])[idx] || {};
      return ch?.scenario || '';
    } catch (_) {
      return '';
    }
  }

  function resolveMemorySummary(ctx) {
    return ctx?.memorySummary || window?.memory?.summary || window?.chat_metadata?.summary || '';
  }

  function resolveAuthorsNote(ctx) {
    return window?.power_user?.context?.authors_note || ctx?.authors_note || '';
  }

  function resolveJailbreak(ctx) {
    return window?.power_user?.jailbreak || ctx?.jailbreak || '';
  }

  function resolveWorldInfoFormatTemplate(ctx) {
    return ctx?.settings?.worldInfoFormatTemplate || ctx?.worldInfoFormatTemplate || '{0}';
  }

  function splitWorldInfoByPosition(entries) {
    const before = [];
    const after = [];
    for (const e of entries || []) {
      const pos = e?.position;
      if (pos === 1 || pos === 'after') after.push(e);
      else before.push(e);
    }
    return { before, after };
  }

  function formatWorldInfo(entries, template) {
    if (!entries?.length) return '';
    const wrap = content => (template && template.includes('{0}') ? template.replace('{0}', content) : content);
    return entries
      .map(e => wrap(e?.content || ''))
      .filter(Boolean)
      .join('\n\n');
  }

  function activateWorldInfo(entries, chatText) {
    if (!entries?.length) return [];
    const text = (chatText || '').toLowerCase();
    const activated = entries.filter(e => {
      if (e?.disable) return false;
      const keys = Array.isArray(e?.key) ? e.key : typeof e?.key === 'string' ? [e.key] : [];
      if (!keys.length) return false;
      return keys.some(k => String(k).toLowerCase() && text.includes(String(k).toLowerCase()));
    });
    return activated.sort((a, b) => (a.order ?? a.position ?? 0) - (b.order ?? b.position ?? 0));
  }

  function resolveNativeWorldInfoAPI() {
    const candidates = [window?.getWorldInfoPrompt, window?.checkWorldInfo, window?.ST?.worldInfo?.getWorldInfoPrompt];
    for (const fn of candidates) {
      if (typeof fn === 'function') {
        return (text, ctx) => {
          try {
            const res = fn.length >= 2 ? fn(text, ctx) : fn(ctx);
            if (res?.worldInfoBefore !== undefined || res?.worldInfoAfter !== undefined) return res;
            if (Array.isArray(res)) {
              const { before, after } = splitWorldInfoByPosition(res);
              const formatTemplate = resolveWorldInfoFormatTemplate(ctx);
              return {
                worldInfoBefore: formatWorldInfo(before, formatTemplate),
                worldInfoAfter: formatWorldInfo(after, formatTemplate),
              };
            }
          } catch (_) {}
          return null;
        };
      }
    }
    return null;
  }

  function buildWorldInfoSegmentsSmart(ctx, chatText) {
    try {
      const wiApi = resolveNativeWorldInfoAPI();
      if (wiApi) {
        const result = wiApi(chatText, ctx);
        if (result && (result.worldInfoBefore || result.worldInfoAfter)) {
          return { before: String(result.worldInfoBefore || ''), after: String(result.worldInfoAfter || '') };
        }
      }
    } catch (_) {}
    const entries = ctx?.worldInfoData?.entries || [];
    const active = activateWorldInfo(entries, chatText);
    const { before, after } = splitWorldInfoByPosition(active);
    const formatTemplate = resolveWorldInfoFormatTemplate(ctx);
    return { before: formatWorldInfo(before, formatTemplate), after: formatWorldInfo(after, formatTemplate) };
  }

  // 构建结构化提示词 - 让SillyTavern自动处理世界书集成
  async function buildStructuredPrompt(panel) {
    const ctx = getContextSafe();
    const chatLimit = parseInt(panel.querySelector('#context-length')?.value || '0');

    // 检查用户是否自定义了提示词模板
    const customPrompt = panel.querySelector('#prompt-template-editor')?.value?.trim();
    const isUsingCustomTemplate = customPrompt && customPrompt !== DEFAULT_PROMPT_TEMPLATE.trim();

    console.log(`[Story Weaver] Using custom template: ${isUsingCustomTemplate}`);

    if (isUsingCustomTemplate) {
      // 用户自定义了模板，使用旧的替换方式
      console.log('[Story Weaver] Using custom prompt template with placeholder replacement...');
      return await buildCustomPrompt(panel);
    } else {
      // 使用我们的结构化提示词
      console.log('[Story Weaver] Using structured prompts for better world info integration...');
      return await buildDefaultStructuredPrompt(panel);
    }
  }

  // 构建自定义提示词（用户修改了模板时使用）
  async function buildCustomPrompt(panel) {
    const ctx = getContextSafe();
    const chatLimit = parseInt(panel.querySelector('#context-length')?.value || '0');
    const chatText = buildChatHistoryText(chatLimit);
    const wi = buildWorldInfoSegmentsSmart(ctx, chatText);

    // Get enhanced data using the new integration functions
    const worldbookData = await getWorldInfoData(chatText);
    const characterData = getCharacterData();
    const chatHistoryData = getEnhancedChatHistory(chatLimit);

    // Collect user requirements
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

    let finalPrompt = panel.querySelector('#prompt-template-editor')?.value || DEFAULT_PROMPT_TEMPLATE;
    finalPrompt = finalPrompt.replace(/{system_prompt}/g, resolveSystemPrompt(ctx) || '');
    finalPrompt = finalPrompt.replace(/{char_persona}/g, resolveCharPersona(ctx) || '');
    finalPrompt = finalPrompt.replace(/{char_scenario}/g, resolveCharScenario(ctx) || '');
    finalPrompt = finalPrompt.replace(/{memory_summary}/g, resolveMemorySummary(ctx) || '');
    finalPrompt = finalPrompt.replace(/{authors_note}/g, resolveAuthorsNote(ctx) || '');
    finalPrompt = finalPrompt.replace(/{jailbreak}/g, resolveJailbreak(ctx) || '');
    finalPrompt = finalPrompt.replace(/{chat_history}/g, chatHistoryData.recentHistory || '');
    finalPrompt = finalPrompt.replace(/{worldInfoBefore}/g, wi.before || '');
    finalPrompt = finalPrompt.replace(/{worldInfoAfter}/g, wi.after || '');
    finalPrompt = finalPrompt.replace(/{worldbook}/g, worldbookData || 'No world info available');
    finalPrompt = finalPrompt.replace(/{character}/g, characterData || 'No character data available');
    
    // Replace user requirement placeholders
    Object.entries(requirements).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      finalPrompt = finalPrompt.replace(regex, value);
    });

    // 返回单条用户消息（自定义模板）
    return [{ role: 'user', content: finalPrompt }];
  }

  // 构建默认结构化提示词
  async function buildDefaultStructuredPrompt(panel) {
    const ctx = getContextSafe();
    const chatLimit = parseInt(panel.querySelector('#context-length')?.value || '0');

    // 获取基本上下文信息（SillyTavern会自动加载世界书）
    const characterData = getCharacterData();
    const chatHistoryData = getEnhancedChatHistory(chatLimit);

    // 收集用户需求
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

    // 构建系统提示词
    const systemPrompt = `你是一个专业的故事大纲生成助手。你擅长根据给定的背景信息、角色设定和世界观创建引人入胜的故事结构。

你的任务是根据用户提供的信息生成一个详细的故事大纲，包括：
- 故事概要
- 章节结构 
- 情节发展
- 角色发展弧线
- 主题分析（如需要）

你必须严格按照用户的要求来设计故事，确保内容符合指定的类型、风格和主题。请充分利用所有提供的世界观信息和角色设定。`;

    // 构建基础上下文提示词（不包含世界书，SillyTavern会自动处理）
    const contextPrompt = `### 基础信息 ###

**系统设定**: ${resolveSystemPrompt(ctx) || '无'}
**角色性格**: ${resolveCharPersona(ctx) || '无'}  
**场景设定**: ${resolveCharScenario(ctx) || '无'}
**记忆摘要**: ${resolveMemorySummary(ctx) || '无'}
**作者注释**: ${resolveAuthorsNote(ctx) || '无'}

${characterData ? `**当前角色信息**:\n${characterData}` : ''}

${chatHistoryData.recentHistory ? `**最近对话历史** (${chatHistoryData.summary}):\n${chatHistoryData.recentHistory}` : ''}`;

    // 构建任务提示词
    const taskPrompt = `请基于当前的世界观设定、角色信息和上下文，生成一个精彩的故事大纲：

**故事类型**: ${requirements.story_type}
**核心主题/冲突**: ${requirements.story_theme}
**叙事风格**: ${requirements.story_style}
**章节数量**: ${requirements.chapter_count}章
**详细程度**: ${requirements.detail_level}
**特殊要求**: ${requirements.special_requirements}

**输出要求**:
- 包含整体摘要: ${requirements.include_summary}
- 包含角色发展: ${requirements.include_characters}
- 包含主题分析: ${requirements.include_themes}

请充分利用世界观中的所有相关信息，确保大纲与已有设定完全吻合。用Markdown格式输出，使用简体中文。直接开始生成大纲，无需其他说明。`;

    return [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: contextPrompt },
      { role: 'user', content: taskPrompt }
    ];
  }

  // 使用TavernHelper.generateRaw生成内容 - 让SillyTavern正确处理世界书
  async function generateWithStructuredPrompt(orderedPrompts) {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        let result;
        
        // 只使用TavernHelper.generateRaw - 这样SillyTavern可以正确集成世界书
        if (typeof window.TavernHelper !== 'undefined' && window.TavernHelper.generateRaw) {
          console.log('[Story Weaver] Using TavernHelper.generateRaw with world info integration...');
          console.log('[Story Weaver] Sending prompts to TavernHelper:', orderedPrompts.length, 'prompts');
          
          const generateOptions = {
            ordered_prompts: orderedPrompts,
            // 关键修改：不设置max_chat_history为0，让SillyTavern处理上下文和世界书
            // max_chat_history: 0, // 这会阻止世界书集成
            should_stream: false, // 确保稳定性
          };
          
          console.log('[Story Weaver] Generate options:', generateOptions);
          result = await window.TavernHelper.generateRaw(generateOptions);
          console.log('[Story Weaver] TavernHelper returned result length:', result?.length || 0);
        } else {
          throw new Error('TavernHelper.generateRaw不可用，无法正确集成世界书');
        }

        // 检查生成结果是否有效
        if (result && result.trim().length > 10) {
          return result.trim();
        } else {
          throw new Error('生成的故事大纲过短或为空');
        }
      } catch (error) {
        retryCount++;
        console.error(`[Story Weaver] 故事大纲生成失败 (尝试 ${retryCount}/${maxRetries}):`, error);

        if (retryCount >= maxRetries) {
          // 所有重试都失败了，抛出错误
          throw new Error(`AI生成故事大纲失败，已重试${maxRetries}次: ${error.message}`);
        }

        // 等待一段时间再重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    return '';
  }

  // ============ 已注释的备用生成方法 ============
  // // 备用方案：使用全局generateRaw
  // else if (typeof window.generateRaw !== 'undefined') {
  //   console.log('[Story Weaver] Using global generateRaw with structured prompts...');
  //   result = await window.generateRaw({
  //     ordered_prompts: orderedPrompts,
  //     max_chat_history: 0,
  //     should_stream: false,
  //   });
  // }
  // // 最后备用：使用triggerSlash调用/gen命令
  // else if (typeof window.triggerSlash !== 'undefined') {
  //   console.log('[Story Weaver] Using triggerSlash /gen...');
  //   const userPrompt = orderedPrompts[orderedPrompts.length - 1].content;
  //   result = await window.triggerSlash(`/gen ${userPrompt}`);
  // }
  // ============ 备用方法结束 ============

  // ============ 旧的constructFullPrompt函数 - 已注释掉，使用buildStructuredPrompt替代 ============
  // 保留原函数作为备用 - 用于向后兼容 - 已被buildStructuredPrompt完全替代
  // async function constructFullPrompt(panel) {
  //   const ctx = getContextSafe();
  //   const chatLimit = parseInt(panel.querySelector('#context-length')?.value || '0');
  //   const chatText = buildChatHistoryText(chatLimit);
  //   const wi = buildWorldInfoSegmentsSmart(ctx, chatText);
  //
  //   // Get enhanced data using the new integration functions
  //   const worldbookData = await getWorldInfoData(chatText);
  //   const characterData = getCharacterData();
  //   const chatHistoryData = getEnhancedChatHistory(chatLimit);
  //
  //   // Collect user requirements
  //   const requirements = {
  //     story_type: panel.querySelector('#story-type')?.value || '',
  //     story_theme: panel.querySelector('#story-theme')?.value || '',
  //     story_style: panel.querySelector('#story-style')?.value || '',
  //     chapter_count: panel.querySelector('#chapter-count')?.value || '5',
  //     detail_level: panel.querySelector('#detail-level')?.value || '',
  //     special_requirements: panel.querySelector('#special-requirements')?.value || 'None',
  //     include_summary: panel.querySelector('#include-summary')?.checked ? 'Yes' : 'No',
  //     include_characters: panel.querySelector('#include-characters')?.checked ? 'Yes' : 'No',
  //     include_themes: panel.querySelector('#include-themes')?.checked ? 'Yes' : 'No',
  //   };
  //
  //   let finalPrompt = panel.querySelector('#prompt-template-editor')?.value || DEFAULT_PROMPT_TEMPLATE;
  //   finalPrompt = finalPrompt.replace(/{system_prompt}/g, resolveSystemPrompt(ctx) || '');
  //   finalPrompt = finalPrompt.replace(/{char_persona}/g, resolveCharPersona(ctx) || '');
  //   finalPrompt = finalPrompt.replace(/{char_scenario}/g, resolveCharScenario(ctx) || '');
  //   finalPrompt = finalPrompt.replace(/{memory_summary}/g, resolveMemorySummary(ctx) || '');
  //   finalPrompt = finalPrompt.replace(/{authors_note}/g, resolveAuthorsNote(ctx) || '');
  //   finalPrompt = finalPrompt.replace(/{jailbreak}/g, resolveJailbreak(ctx) || '');
  //   finalPrompt = finalPrompt.replace(/{chat_history}/g, chatHistoryData.recentHistory || '');
  //   finalPrompt = finalPrompt.replace(/{worldInfoBefore}/g, wi.before || '');
  //   finalPrompt = finalPrompt.replace(/{worldInfoAfter}/g, wi.after || '');
  //   finalPrompt = finalPrompt.replace(/{worldbook}/g, worldbookData || 'No world info available');
  //   finalPrompt = finalPrompt.replace(/{character}/g, characterData || 'No character data available');
  //   
  //   // Replace user requirement placeholders
  //   Object.entries(requirements).forEach(([key, value]) => {
  //     const regex = new RegExp(`{${key}}`, 'g');
  //     finalPrompt = finalPrompt.replace(regex, value);
  //   });
  //
  //   return finalPrompt;
  // }
  // ============ 旧函数结束 ============

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

    // 检查TavernHelper是否可用（唯一支持世界书集成的方法）
    if (typeof window.TavernHelper === 'undefined' || typeof window.TavernHelper.generateRaw !== 'function') {
      showNotification('请在聊天主界面打开扩展再试（需要TavernHelper支持世界书集成）', 'warning');
      return;
    }

    // Validate data - 只要有故事主题就可以生成
    const storyTheme = panel.querySelector('#story-theme')?.value || '';

    if (!storyTheme.trim()) {
      showNotification('请填写故事主题或核心冲突', 'error');
      return;
    }

    // 使用box.js风格的结构化提示词
    const structuredPrompt = await buildStructuredPrompt(panel);

    // Update UI
    generateBtn.disabled = true;
    if (btnText) btnText.classList.add('hidden');
    if (btnLoading) btnLoading.classList.remove('hidden');
    outputDiv.innerHTML = '<div class="generating-indicator">🔄 正在与AI沟通，请稍候...</div>';

    try {
      console.log('[Story Weaver] Generating outline with structured prompts...');
      console.log(`[Story Weaver] Prompt structure:`, structuredPrompt);
      console.log(`[Story Weaver] Total prompts: ${structuredPrompt.length}`);
      
      // 显示每个提示词的前100字符用于调试
      structuredPrompt.forEach((prompt, index) => {
        console.log(`[Story Weaver] Prompt ${index + 1} (${prompt.role}): ${prompt.content.substring(0, 100)}...`);
      });

      // 使用box.js完全相同的生成方式
      const resultText = await generateWithStructuredPrompt(structuredPrompt);
      
      if (!resultText || !resultText.trim()) {
        throw new Error('AI未返回有效内容');
      }

      // 显示结果 - 可编辑的文本域
      const textarea = document.createElement('textarea');
      textarea.value = resultText;
      textarea.style.width = '100%';
      textarea.style.minHeight = '300px';
      textarea.style.fontFamily = 'inherit';
      textarea.style.fontSize = '14px';
      textarea.style.lineHeight = '1.6';
      textarea.style.border = '1px solid #ddd';
      textarea.style.borderRadius = '4px';
      textarea.style.padding = '10px';
      textarea.style.resize = 'vertical';
      textarea.style.whiteSpace = 'pre-wrap';
      textarea.className = 'story-result-editor';

      outputDiv.innerHTML = '';
      outputDiv.appendChild(textarea);

      // 添加编辑提示
      const editHint = document.createElement('div');
      editHint.style.fontSize = '12px';
      editHint.style.color = '#666';
      editHint.style.marginTop = '8px';
      editHint.textContent = '✏️ 生成结果可直接编辑修改';
      outputDiv.appendChild(editHint);

      showNotification('故事大纲生成完成！', 'success');
    } catch (error) {
      console.error('[Story Weaver] Error generating outline:', error);

      outputDiv.innerHTML = `
        <div class="output-placeholder warning">
          ❌ 生成失败
          <p style="font-size: 12px; color: #ff4444; margin-top: 8px;">错误: ${error.message}</p>
          <p style="font-size: 12px; color: #666; margin-top: 8px;">请检查SillyTavern是否正确配置了AI后端</p>
        </div>
      `;

      showNotification('生成失败: ' + error.message, 'error');
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

    // 从可编辑的文本域获取内容
    const textarea = outputDiv.querySelector('.story-result-editor');
    const content = textarea ? textarea.value : outputDiv.innerText || outputDiv.textContent;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        showNotification('已复制到剪贴板', 'success');
      });
    } else {
      // Fallback
      const tempTextarea = document.createElement('textarea');
      tempTextarea.value = content;
      tempTextarea.style.position = 'fixed';
      tempTextarea.style.opacity = '0';
      document.body.appendChild(tempTextarea);
      tempTextarea.select();

      try {
        document.execCommand('copy');
        showNotification('已复制到剪贴板', 'success');
      } catch (err) {
        showNotification('复制失败', 'error');
      }

      document.body.removeChild(tempTextarea);
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

    // 从可编辑的文本域获取内容
    const textarea = outputDiv.querySelector('.story-result-editor');
    const content = textarea ? textarea.value : outputDiv.innerText || outputDiv.textContent;
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
   * 显示世界书预览弹窗
   */
  async function showWorldInfoPreview() {
    // 移除可能存在的旧弹窗
    const existingModal = document.getElementById('worldinfo-preview-modal');
    if (existingModal) {
      existingModal.remove();
    }

    console.log('[Story Weaver] Starting world info preview...');

    // 获取多种方式的世界书数据
    const previewData = {
      sortedEntries: null,
      globalLore: null,
      characterLore: null,
      chatLore: null,
      personaLore: null,
      customData: null
    };

    try {
      // 方法1: getSortedEntries
      if (typeof window.getSortedEntries === 'function') {
        console.log('[Story Weaver] Testing getSortedEntries...');
        previewData.sortedEntries = await window.getSortedEntries();
        console.log('[Story Weaver] getSortedEntries result:', previewData.sortedEntries?.length || 0, 'entries');
      }

      // 方法2: 分别获取各类世界书
      if (typeof window.getGlobalLore === 'function') {
        previewData.globalLore = await window.getGlobalLore();
        console.log('[Story Weaver] getGlobalLore result:', previewData.globalLore?.length || 0, 'entries');
      }
      
      if (typeof window.getCharacterLore === 'function') {
        previewData.characterLore = await window.getCharacterLore();
        console.log('[Story Weaver] getCharacterLore result:', previewData.characterLore?.length || 0, 'entries');
      }
      
      if (typeof window.getChatLore === 'function') {
        previewData.chatLore = await window.getChatLore();
        console.log('[Story Weaver] getChatLore result:', previewData.chatLore?.length || 0, 'entries');
      }
      
      if (typeof window.getPersonaLore === 'function') {
        previewData.personaLore = await window.getPersonaLore();
        console.log('[Story Weaver] getPersonaLore result:', previewData.personaLore?.length || 0, 'entries');
      }

      // 方法3: 我们的自定义函数
      previewData.customData = await getWorldInfoData('');
      console.log('[Story Weaver] Custom getWorldInfoData result:', previewData.customData?.length || 0, 'characters');

    } catch (error) {
      console.error('[Story Weaver] Error getting world info preview:', error);
    }

    // 构建预览内容
    let previewHtml = '';
    
    // 显示getSortedEntries结果
    if (previewData.sortedEntries && previewData.sortedEntries.length > 0) {
      previewHtml += `<h3>📚 getSortedEntries() - ${previewData.sortedEntries.length}条条目</h3>`;
      previewData.sortedEntries.slice(0, 5).forEach((entry, index) => {
        previewHtml += `<div style="border: 1px solid #ddd; margin: 5px 0; padding: 10px;">
          <strong>${entry.comment || entry.key || `条目${index + 1}`}</strong> 
          <span style="color: #666;">(world: ${entry.world || 'unknown'})</span>
          <div style="margin-top: 5px; font-size: 12px; color: #333;">${(entry.content || '').substring(0, 200)}...</div>
        </div>`;
      });
      if (previewData.sortedEntries.length > 5) {
        previewHtml += `<p style="color: #666;">...还有 ${previewData.sortedEntries.length - 5} 条条目</p>`;
      }
    }

    // 显示分类世界书结果
    const categories = [
      { name: 'Global Lore', data: previewData.globalLore },
      { name: 'Character Lore', data: previewData.characterLore },
      { name: 'Chat Lore', data: previewData.chatLore },
      { name: 'Persona Lore', data: previewData.personaLore }
    ];

    categories.forEach(category => {
      if (category.data && category.data.length > 0) {
        previewHtml += `<h3>🏷️ ${category.name} - ${category.data.length}条条目</h3>`;
        category.data.slice(0, 3).forEach((entry, index) => {
          previewHtml += `<div style="border: 1px solid #ddd; margin: 5px 0; padding: 10px;">
            <strong>${entry.comment || entry.key || `条目${index + 1}`}</strong>
            <div style="margin-top: 5px; font-size: 12px; color: #333;">${(entry.content || '').substring(0, 150)}...</div>
          </div>`;
        });
      }
    });

    // 显示自定义函数结果
    if (previewData.customData && previewData.customData.trim()) {
      previewHtml += `<h3>🔧 自定义getWorldInfoData()结果</h3>`;
      previewHtml += `<div style="border: 1px solid #ddd; margin: 5px 0; padding: 10px; font-size: 12px; color: #333; white-space: pre-wrap;">${previewData.customData.substring(0, 500)}...</div>`;
    }

    if (!previewHtml) {
      previewHtml = '<p style="color: #666;">❌ 未能获取到任何世界书数据</p>';
    }

    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'worldinfo-preview-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;

    modalContent.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h2 style="margin: 0;">🌍 世界书内容预览</h2>
        <button id="close-preview-modal" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">关闭</button>
      </div>
      <div style="max-height: 60vh; overflow-y: auto;">
        ${previewHtml}
      </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 绑定关闭事件
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    
    modalContent.querySelector('#close-preview-modal').addEventListener('click', () => {
      modal.remove();
    });
  }

  /**
   * 显示完整提示词预览
   */
  async function showPromptPreview(panel) {
    // 移除可能存在的旧弹窗
    const existingModal = document.getElementById('prompt-preview-modal');
    if (existingModal) {
      existingModal.remove();
    }

    console.log('[Story Weaver] Building prompt preview...');

    try {
      // 构建完整的结构化提示词
      const structuredPrompt = await buildStructuredPrompt(panel);
      
      // 获取世界书数据用于对比
      const worldInfoData = await getWorldInfoData('');
      
      // 构建预览内容
      let previewHtml = '';
      
      previewHtml += `<h3>📋 构建的结构化提示词 (${structuredPrompt.length}条)</h3>`;
      
      structuredPrompt.forEach((prompt, index) => {
        previewHtml += `
          <div style="border: 1px solid #ddd; margin: 10px 0; border-radius: 4px;">
            <div style="background: #f5f5f5; padding: 8px; font-weight: bold; border-bottom: 1px solid #ddd;">
              提示词 ${index + 1} - 角色: ${prompt.role}
            </div>
            <div style="padding: 10px; font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 300px; overflow-y: auto;">
${prompt.content}
            </div>
            <div style="background: #f9f9f9; padding: 5px 10px; font-size: 11px; color: #666;">
              字符数: ${prompt.content.length}
            </div>
          </div>
        `;
      });

      previewHtml += `<hr>`;
      previewHtml += `<h3>📚 我们获取的世界书数据</h3>`;
      if (worldInfoData && worldInfoData.trim()) {
        previewHtml += `
          <div style="border: 1px solid #ddd; margin: 10px 0; padding: 10px; font-family: monospace; font-size: 12px; white-space: pre-wrap; max-height: 400px; overflow-y: auto; background: #f9f9f9;">
${worldInfoData}
          </div>
          <div style="font-size: 11px; color: #666;">
            字符数: ${worldInfoData.length}
          </div>
        `;
      } else {
        previewHtml += `<p style="color: #f44336;">❌ 我们的函数没有获取到世界书数据</p>`;
      }

      // 创建弹窗
      const modal = document.createElement('div');
      modal.id = 'prompt-preview-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        justify-content: center;
        align-items: center;
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 90%;
        max-height: 90%;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      `;

      modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; position: sticky; top: 0; background: white; z-index: 1;">
          <h2 style="margin: 0;">📝 完整提示词预览</h2>
          <button id="close-prompt-modal" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">关闭</button>
        </div>
        <div>
          ${previewHtml}
        </div>
      `;

      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // 绑定关闭事件
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
      
      modalContent.querySelector('#close-prompt-modal').addEventListener('click', () => {
        modal.remove();
      });

    } catch (error) {
      console.error('[Story Weaver] Error building prompt preview:', error);
      showNotification('构建提示词预览失败: ' + error.message, 'error');
    }
  }

  // 查找原生发送控件（多选择器兼容）
  function findSendControls() {
    const textarea =
      document.querySelector('#send_textarea') ||
      document.querySelector('textarea.send-text') ||
      document.querySelector('textarea[name="send_textarea"]') ||
      document.querySelector('#user_input');

    const button =
      document.querySelector('#send_but') ||
      document.querySelector('button.send-button') ||
      document.querySelector('button[name="send_but"]') ||
      document.querySelector('#send_button');

    return { textarea, button };
  }

  // 自动切换到聊天标签页（若UI存在）
  function autoOpenChatTab() {
    const tabs = document.querySelectorAll('.menu_button, .tab-button, [data-tab]');
    for (const el of tabs) {
      const txt = (el.textContent || '').trim();
      if (/^chat$/i.test(txt) || /聊天|会话/.test(txt)) {
        el.click();
        break;
      }
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
              <span>启用 Story Weaver 扩展</span>
            </label>

            <div class="flex-container" style="gap:10px;margin:8px 0;">
              <label class="checkbox_label">
                <input id="story_weaver_inject" type="checkbox" ${settings.injectEnabled ? 'checked' : ''}>
                <span>将结果注入上下文（不创建楼层）</span>
              </label>
            </div>

            <div class="flex-container" style="gap:10px;margin:8px 0;align-items:center;">
              <div>
                <small>位置(position)</small>
                <input id="story_weaver_position" type="number" class="text_pole widthUnset" value="${
                  settings.position
                }" />
              </div>
              <div>
                <small>深度(depth)</small>
                <input id="story_weaver_depth" type="number" class="text_pole widthUnset" value="${settings.depth}" />
              </div>
              <div>
                <small>扫描(scan)</small>
                <input id="story_weaver_scan" type="checkbox" ${settings.scan ? 'checked' : ''} />
              </div>
              <div>
                <small>角色(role)</small>
                <input id="story_weaver_role" type="text" class="text_pole widthUnset" value="${settings.role}" />
              </div>
            </div>

            <div class="storyweaver_controls" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
              <input id="story_weaver_open_panel" class="menu_button" type="submit" value="📖 打开 Story Weaver 面板" />
              <input id="story_weaver_generate_now" class="menu_button" type="submit" value="⚡ 立即生成(不入楼层)" />
              <input id="story_weaver_inject_now" class="menu_button" type="submit" value="🧩 仅注入到上下文" />
            </div>
          </div>
        </div>
      </div>`;

    const container = document.getElementById('extensions_settings');
    container.insertAdjacentHTML('beforeend', settingsHtml);

    const openBtn = document.getElementById('story_weaver_open_panel');
    if (openBtn) openBtn.onclick = showStoryWeaverPanel;

    document.getElementById('story_weaver_enabled')?.addEventListener('change', e => {
      settings.enabled = e.target.checked;
      saveSettings();
    });
    document.getElementById('story_weaver_inject')?.addEventListener('change', e => {
      settings.injectEnabled = e.target.checked;
      saveSettings();
    });
    document.getElementById('story_weaver_position')?.addEventListener('change', e => {
      settings.position = parseInt(e.target.value || '0');
      saveSettings();
    });
    document.getElementById('story_weaver_depth')?.addEventListener('change', e => {
      settings.depth = parseInt(e.target.value || '0');
      saveSettings();
    });
    document.getElementById('story_weaver_scan')?.addEventListener('change', e => {
      settings.scan = e.target.checked;
      saveSettings();
    });
    document.getElementById('story_weaver_role')?.addEventListener('change', e => {
      settings.role = e.target.value || 'system';
      saveSettings();
    });

    // 下拉菜单中的立即生成与仅注入
    document.getElementById('story_weaver_generate_now')?.addEventListener('click', async () => {
      try {
        // 检查TavernHelper是否可用（唯一支持世界书集成的方法）
        if (typeof window.TavernHelper === 'undefined' || typeof window.TavernHelper.generateRaw !== 'function') {
          return showNotification('请在聊天主界面打开扩展再试（需要TavernHelper支持世界书集成）', 'warning');
        }
        const panel = document.getElementById('story-weaver-panel') || createStoryWeaverPanel();
        const structuredPrompt = await buildStructuredPrompt(panel);
        const result = await generateWithStructuredPrompt(structuredPrompt);
        if (!result?.trim()) return showNotification('生成失败', 'error');
        showNotification('已生成(不入楼层)', 'success');
        const outputDiv = panel.querySelector('#output-content');
        if (outputDiv) {
          outputDiv.innerText = result;
        }
      } catch (e) {
        showNotification('生成失败: ' + e.message, 'error');
      }
    });

    document.getElementById('story_weaver_inject_now')?.addEventListener('click', async () => {
      try {
        // 检查TavernHelper是否可用（唯一支持世界书集成的方法）
        if (typeof window.TavernHelper === 'undefined' || typeof window.TavernHelper.generateRaw !== 'function') {
          return showNotification('请在聊天主界面打开扩展再试（需要TavernHelper支持世界书集成）', 'warning');
        }
        const panel = document.getElementById('story-weaver-panel') || createStoryWeaverPanel();
        const structuredPrompt = await buildStructuredPrompt(panel);
        const result = await generateWithStructuredPrompt(structuredPrompt);
        if (!result?.trim()) return showNotification('生成失败', 'error');
        if (typeof window.setExtensionPrompt === 'function') {
          window.setExtensionPrompt(
            MODULE_NAME,
            result,
            settings.position ?? 0,
            settings.depth ?? 0,
            settings.scan ?? false,
            settings.role || 'system',
          );
          showNotification('已注入上下文(扩展提示)，不入楼层', 'success');
        } else {
          showNotification('未找到 setExtensionPrompt，无法注入上下文', 'warning');
        }
      } catch (e) {
        showNotification('注入失败: ' + e.message, 'error');
      }
    });
  }

  /**
   * 刷新数据状态
   */
  async function refreshData() {
    console.log('[Story Weaver] Refreshing data status...');

    const worldbookData = await getWorldInfoData();
    const characterData = getCharacterData();
    const chatHistory = getEnhancedChatHistory(50);

    const worldbookLoaded = worldbookData && worldbookData.trim() !== '';
    const characterLoaded = characterData && characterData.trim() !== '';

    console.log('[Story Weaver] Data status:', {
      worldbookLoaded,
      characterLoaded,
      chatHistoryLoaded: chatHistory.totalMessages > 0,
      totalMessages: chatHistory.totalMessages,
    });

    return {
      worldbook: { entries: worldbookLoaded ? ['Available'] : [] },
      character: { character: characterLoaded ? 'Available' : null },
      chatHistory: chatHistory,
    };
  }

  /**
   * Listen for SillyTavern World Info events
   */
  function setupWorldInfoEventListeners() {
    try {
      // Listen for World Info entries loaded event
      if (typeof window.eventSource !== 'undefined' && typeof window.event_types !== 'undefined') {
        window.eventSource.on(window.event_types.WORLDINFO_ENTRIES_LOADED, ({ globalLore, characterLore, chatLore, personaLore }) => {
          console.log('[Story Weaver] World Info entries loaded:', {
            global: globalLore?.length || 0,
            character: characterLore?.length || 0,
            chat: chatLore?.length || 0,
            persona: personaLore?.length || 0
          });
          
          // Update UI status if panel is open
          const panel = document.getElementById('story-weaver-panel');
          if (panel && panel.style.display !== 'none') {
            const statusDiv = panel.querySelector('#context-status');
            if (statusDiv) {
              const totalEntries = (globalLore?.length || 0) + (characterLore?.length || 0) + (chatLore?.length || 0) + (personaLore?.length || 0);
              updateStatus(statusDiv, `✅ 世界书数据已更新 - 总计 ${totalEntries} 条条目`, 'success');
            }
          }
        });
      }

      // Listen for character changes
      if (typeof window.eventSource !== 'undefined' && typeof window.event_types !== 'undefined') {
        window.eventSource.on(window.event_types.CHARACTER_EDITED, () => {
          console.log('[Story Weaver] Character data updated');
        });
        
        window.eventSource.on(window.event_types.CHAT_CHANGED, () => {
          console.log('[Story Weaver] Chat changed, updating data');
          // Auto-refresh data when chat changes
          const panel = document.getElementById('story-weaver-panel');
          if (panel && panel.style.display !== 'none') {
            setTimeout(async () => {
              const result = await refreshData();
              const statusDiv = panel.querySelector('#context-status');
              if (statusDiv) {
                updateStatus(statusDiv, `🔄 聊天数据已更新 - ${result.chatHistory.summary}`, 'info');
              }
            }, 500);
          }
        });
      }
    } catch (error) {
      console.error('[Story Weaver] Error setting up World Info event listeners:', error);
    }
  }

  /**
   * Initialize extension
   */
  function initializeExtension() {
    if (isInitialized) return;

    loadSettings();
    setupExtensionUI();
    setupWorldInfoEventListeners();

    // 添加全局函数
    window.storyWeaverRefreshData = refreshData;

    isInitialized = true;
    console.log('[Story Weaver] Extension initialized');
  }

  // Initialize when DOM is ready
  $(document).ready(() => {
    // Wait for SillyTavern to be ready - 尝试多次检测
    let initAttempts = 0;
    const maxAttempts = 10;

    function tryInitialize() {
      if (
        typeof extension_settings !== 'undefined' &&
        typeof jQuery !== 'undefined' &&
        document.getElementById('extensions_settings')
      ) {
        initializeExtension();
      } else if (initAttempts < maxAttempts) {
        initAttempts++;
        console.log(`[Story Weaver] Waiting for SillyTavern... attempt ${initAttempts}/${maxAttempts}`);
        setTimeout(tryInitialize, 1000);
      } else {
        console.warn('[Story Weaver] Failed to initialize after maximum attempts. SillyTavern may not be ready.');
        // 尝试强制初始化
        try {
          initializeExtension();
        } catch (error) {
          console.error('[Story Weaver] Force initialization failed:', error);
        }
      }
    }

    tryInitialize();
  });

  // Make functions globally accessible for testing and debugging
  window.showStoryWeaverPanel = showStoryWeaverPanel;
  window.storyWeaverDebug = async () => {
    console.log('=== Story Weaver Debug Info ===');
    console.log('Extension initialized:', isInitialized);

    // 检查可用的全局对象
    console.log('Global objects:', {
      SillyTavern: typeof window.SillyTavern,
      chat: Array.isArray(window.chat) ? `Array(${window.chat.length})` : typeof window.chat,
      characters: Array.isArray(window.characters) ? `Array(${window.characters.length})` : typeof window.characters,
      this_chid: window.this_chid,
      world_info: typeof window.world_info,
      worldInfoData: typeof window.worldInfoData,
      power_user: typeof window.power_user,
      TavernHelper: typeof window.TavernHelper,
    });

    // 检查预设相关信息
    try {
      const presetInfo = {
        power_user_context: window.power_user?.context ? 'Available' : 'Not found',
        system_prompt: window.power_user?.context?.system_prompt ? 'Found' : 'Not found',
        story_string: window.power_user?.context?.story_string ? 'Found' : 'Not found',
        current_character:
          window.this_chid !== undefined && window.characters?.[window.this_chid] ? 'Available' : 'Not found',
      };
      console.log('Preset information:', presetInfo);

      if (window.characters && window.this_chid !== undefined) {
        const currentChar = window.characters[window.this_chid];
        if (currentChar) {
          console.log('Current character info:', {
            name: currentChar.name,
            description: currentChar.description ? `${currentChar.description.substring(0, 100)}...` : 'Not found',
            personality: currentChar.personality ? `${currentChar.personality.substring(0, 100)}...` : 'Not found',
          });
        }
      }
    } catch (error) {
      console.error('Failed to check preset info:', error);
    }

    // 检查所有可能的全局变量
    const possibleGlobals = Object.keys(window).filter(
      key =>
        key.toLowerCase().includes('chat') ||
        key.toLowerCase().includes('character') ||
        key.toLowerCase().includes('world') ||
        key.toLowerCase().includes('generate') ||
        key.toLowerCase().includes('context'),
    );
    console.log('Possible relevant globals:', possibleGlobals);

    // 检查可用的函数 - 专注于box.js风格的生成方法
    const possibleFunctions = [
      'TavernHelper', // box.js主要使用的Helper
      'generateRaw', // box.js备用方法
      'triggerSlash', // box.js最后备用方法
      'getContext',
      'getWorldInfoPrompt',
      'getGlobalLore',
      'getChatLore',
      'getSortedEntries', // World Info主要方法
      'sendSystemMessage',
      'addOneMessage',
    ];

    const availableFunctions = {};
    possibleFunctions.forEach(fn => {
      if (fn === 'TavernHelper') {
        availableFunctions[fn] = typeof window[fn] !== 'undefined' ? 
          (typeof window[fn].generateRaw === 'function' ? 'Available with generateRaw' : 'Available but no generateRaw') : 
          'undefined';
      } else {
        availableFunctions[fn] = typeof window[fn];
      }
    });
    console.log('Available functions (box.js style):', availableFunctions);

    // 测试数据读取
    try {
      const worldbook = await getWorldInfoData();
      const character = getCharacterData();
      console.log('Test data:', {
        worldbookAvailable: worldbook !== 'N/A',
        characterAvailable: character !== 'N/A',
        worldbookPreview:
          worldbook !== 'N/A' && typeof worldbook === 'string' ? worldbook.substring(0, 100) + '...' : 'N/A',
        characterPreview:
          character !== 'N/A' && typeof character === 'string' ? character.substring(0, 100) + '...' : 'N/A',
      });
    } catch (error) {
      console.error('Test data read failed:', error);
    }

    // 检查box.js风格的生成能力
    console.log('Checking box.js style generation capability...');
    console.log('window.TavernHelper:', typeof window.TavernHelper);
    console.log('window.TavernHelper.generateRaw:', typeof window.TavernHelper?.generateRaw);
    console.log('window.generateRaw (fallback):', typeof window.generateRaw);
    console.log('window.triggerSlash (last resort):', typeof window.triggerSlash);
    console.log('Chat array available:', Array.isArray(window.chat));
    console.log('Chat length:', window.chat ? window.chat.length : 'N/A');
  };

  // ============ 旧的postMessage桥接和callMainApiWithPrompt - 已注释掉 ============
  // 父窗口（主页面）桥接：允许弹窗通过 postMessage 请求生成
  // try {
  //   if (typeof window !== 'undefined' && !window.__storyWeaverBridgeInstalled) {
  //     window.__storyWeaverBridgeInstalled = true;
  //     window.addEventListener('message', async ev => {
  //       try {
  //         const data = ev?.data || {};
  //         if (!data || (data.type !== 'SW_GENERATE' && data.type !== 'SW_INJECT')) return;
  //         const reqId = data.reqId;
  //         const prompt = data.prompt || '';
  //         const fns = await waitForGenerationFns();
  //         if (!fns.quiet && !fns.raw && !fns.webllm) {
  //           ev.source?.postMessage(
  //             { type: data.type + '_ERR', reqId, error: '生成函数不可用，请在聊天主界面再试' },
  //             '*',
  //           );
  //           return;
  //         }
  //         let resText = '';
  //         try {
  //           if (fns.quiet) {
  //             const r = await fns.quiet({ quietPrompt: prompt, skipWIAN: true });
  //             resText = typeof r === 'string' ? r : r?.text || r?.output_text || '';
  //           } else if (fns.raw) {
  //             const r = await fns.raw({ prompt });
  //             resText = typeof r === 'string' ? r : r?.text || r?.output_text || '';
  //           } else if (fns.webllm) {
  //             const r = await fns.webllm([{ role: 'user', content: prompt }], {});
  //             resText = typeof r === 'string' ? r : r?.text || r?.output_text || '';
  //           }
  //         } catch (e) {
  //           ev.source?.postMessage({ type: data.type + '_ERR', reqId, error: String(e?.message || e) }, '*');
  //           return;
  //         }
  //         ev.source?.postMessage({ type: data.type + '_OK', reqId, text: resText }, '*');
  //       } catch (_) {}
  //     });
  //   }
  // } catch (_) {}

  // 统一调用主API的函数：使用box.js相同的方式 - 已被generateWithStructuredPrompt替代
  // async function callMainApiWithPrompt(promptText) {
  //   let retryCount = 0;
  //   const maxRetries = 3;
  //
  //   while (retryCount < maxRetries) {
  //     try {
  //       let result;
  //       
  //       // 使用TavernHelper.generateRaw - 与box.js完全相同的方法
  //       if (typeof window.TavernHelper !== 'undefined' && window.TavernHelper.generateRaw) {
  //         console.log('[Story Weaver] Using TavernHelper.generateRaw...');
  //         result = await window.TavernHelper.generateRaw({
  //           ordered_prompts: [
  //             { role: 'user', content: promptText }
  //           ],
  //           max_chat_history: 0, // 不使用聊天历史
  //           should_stream: false, // 确保稳定性
  //         });
  //       }
  //       // 备用方案：使用全局generateRaw
  //       else if (typeof window.generateRaw !== 'undefined') {
  //         console.log('[Story Weaver] Using global generateRaw...');
  //         result = await window.generateRaw({
  //           ordered_prompts: [
  //             { role: 'user', content: promptText }
  //           ],
  //           max_chat_history: 0,
  //           should_stream: false,
  //         });
  //       }
  //       // 最后备用：使用triggerSlash调用/gen命令
  //       else if (typeof window.triggerSlash !== 'undefined') {
  //         console.log('[Story Weaver] Using triggerSlash /gen...');
  //         result = await window.triggerSlash(`/gen ${promptText}`);
  //       } else {
  //         throw new Error('没有可用的generateRaw函数');
  //       }
  //
  //       // 检查生成结果是否有效
  //       if (result && result.trim().length > 10) {
  //         return result.trim();
  //       } else {
  //         throw new Error('生成的内容过短或为空');
  //       }
  //     } catch (error) {
  //       retryCount++;
  //       console.error(`[Story Weaver] AI生成失败 (尝试 ${retryCount}/${maxRetries}):`, error);
  //
  //       if (retryCount >= maxRetries) {
  //         // 所有重试都失败了，抛出错误
  //         throw new Error(`AI生成失败，已重试${maxRetries}次: ${error.message}`);
  //       }
  //
  //       // 等待一段时间再重试
  //       await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
  //     }
  //   }
  //   
  //   return '';
  // }
  // ============ 旧的方法结束 ============
})();
