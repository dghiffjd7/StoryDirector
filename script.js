// Story Weaver Extension for SillyTavern
// Simple implementation following ST extension standards

(() => {
  'use strict';

  const MODULE_NAME = 'story-weaver';

  // Default Prompt Template
  const DEFAULT_PROMPT_TEMPLATE = `You are an expert storyteller and world-building assistant. Your task is to generate a compelling and structured story outline.

### CONTEXT & LORE ###
Here is the established context, including world settings and character information.

-- World Info (before chat) --
{worldInfoBefore}

**Worldbook Entries:**
{worldbook}

**Character Information:**
{character}

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
Generate a story outline divided into {chapter_count} chapters. The outline should be creative, coherent, and strictly adhere to all the user requirements provided above. The output should be in clean, well-structured Markdown format.`;

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
              <div class="form-help">如果世界书或角色数据没有正确加载，可以点击此按钮手动刷新</div>
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
      refreshBtn.onclick = () => {
        const result = refreshData();
        const statusDiv = panel.querySelector('#context-status');
        if (statusDiv) {
          updateStatus(
            statusDiv,
            `✅ 数据已刷新 - 世界书: ${result.worldbook.entries.length}条, 角色: ${
              result.character.character ? '已加载' : '未找到'
            }`,
            'success',
          );
        }
        showNotification('数据刷新完成', 'success');
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
      // 直接访问世界书数据对象
      const worldInfo = window.world_info;
      if (worldInfo && worldInfo.entries) {
        const entries = Object.values(worldInfo.entries);
        if (entries.length > 0) {
          const formattedEntries = entries
            .filter(entry => !entry.disable && entry.content?.trim())
            .slice(0, 10)
            .map(entry => `**${entry.comment || entry.key?.[0] || 'Entry'}**\n${entry.content}`)
            .join('\n\n');

          console.log(`[Story Weaver] Found ${entries.length} world info entries from world_info object`);
          return formattedEntries;
        }
      }

      console.log('[Story Weaver] No world info found in world_info object');
      return 'N/A';
    } catch (error) {
      console.error('[Story Weaver] Error getting world info:', error);
      return 'N/A';
    }
  }

  /**
   * 获取角色数据 - 使用SillyTavern标准方法
   */
  function getCharacterData() {
    try {
      // 从chat对象获取角色信息
      const chat = window.chat;
      if (chat && Array.isArray(chat) && chat.length > 0) {
        // 寻找最近的系统消息或角色消息来提取角色信息
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

      console.log('[Story Weaver] No character data found in chat');
      return 'N/A';
    } catch (error) {
      console.error('[Story Weaver] Error reading character:', error);
      return 'N/A';
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

  /**
   * Constructs the final prompt by reading the template and injecting data.
   */
  async function constructPrompt(panel) {
    // 1. 从UI获取当前的Prompt模板
    const template = panel.querySelector('#prompt-template-editor')?.value || DEFAULT_PROMPT_TEMPLATE;

    // 2. 获取聊天历史
    const chatHistoryLimit = parseInt(panel.querySelector('#context-length')?.value || '0');
    const chatHistory = buildChatHistoryText(chatHistoryLimit);

    // 3. 使用ST标准方法获取数据
    const worldbookData = await getWorldInfoData(chatHistory);
    const characterData = getCharacterData();

    // 4. 从UI收集用户需求
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

    // 5. 替换占位符
    let finalPrompt = template;
    finalPrompt = finalPrompt.replace(/{worldbook}/g, worldbookData);
    finalPrompt = finalPrompt.replace(/{character}/g, characterData);
    finalPrompt = finalPrompt.replace(/{chat_history}/g, chatHistory || '');
    finalPrompt = finalPrompt.replace(/{worldInfoBefore}/g, worldbookData);
    finalPrompt = finalPrompt.replace(/{worldInfoAfter}/g, '');

    for (const key in requirements) {
      const placeholder = new RegExp(`{${key}}`, 'g');
      finalPrompt = finalPrompt.replace(placeholder, requirements[key]);
    }

    console.log('[Story Weaver] Final prompt constructed');
    return finalPrompt;
  }

  function buildChatHistoryText(limit) {
    if (!limit || limit <= 0) return '';

    try {
      const chat = window.chat || [];

      if (!Array.isArray(chat)) return '';

      const messages = chat.slice(Math.max(0, chat.length - limit));
      return messages
        .map(m => m.mes || '')
        .filter(Boolean)
        .join('\n');
    } catch (error) {
      console.error('[Story Weaver] Error building chat history:', error);
      return '';
    }
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

    // Validate data - 只要有故事主题就可以生成
    const storyTheme = panel.querySelector('#story-theme')?.value || '';

    if (!storyTheme.trim()) {
      showNotification('请填写故事主题或核心冲突', 'error');
      return;
    }

    // 构建最终的 Prompt
    const prompt = await constructPrompt(panel);

    // Update UI
    generateBtn.disabled = true;
    if (btnText) btnText.classList.add('hidden');
    if (btnLoading) btnLoading.classList.remove('hidden');
    outputDiv.innerHTML = '<div class="generating-indicator">🔄 正在与AI沟通，请稍候...</div>';

    try {
      // 使用SillyTavern的标准Generate函数
      let resultText = '';
      let apiSuccess = false;

      // 使用SillyTavern的消息系统来触发生成
      console.log('[Story Weaver] Using SillyTavern message system...');

      const originalChatLength = window.chat ? window.chat.length : 0;

      try {
        // 创建临时用户消息
        const tempUserMessage = {
          name: 'User',
          is_user: true,
          is_system: false,
          send_date: Date.now(),
          mes: prompt,
          extra: { isStoryWeaverPrompt: true },
        };

        // 尝试多种方式访问聊天数组
        let chatArray = window.chat || window.SillyTavern?.chat || [];
        
        if (Array.isArray(chatArray)) {
          chatArray.push(tempUserMessage);

          // 尝试触发ST的生成流程
          if (typeof window.Generate === 'function') {
            console.log('[Story Weaver] Triggering ST Generate...');
            await window.Generate('normal');

            // 检查是否生成了回复
            if (chatArray.length > originalChatLength + 1) {
              const assistantMessage = chatArray[chatArray.length - 1];
              if (assistantMessage && !assistantMessage.is_user) {
                resultText = assistantMessage.mes || '';
                apiSuccess = true;
                console.log('[Story Weaver] Generated via ST Generate function');
              }
            }
          } else {
            console.warn('[Story Weaver] ST Generate function not available');
          }
        } else {
          console.warn('[Story Weaver] Chat array not available, using basic template...');
          
          // 如果无法访问聊天数组，提供基本模板
          resultText = `# 故事大纲

基于您的设定，这里是一个基本的故事大纲：

## 故事主题
${panel.querySelector('#story-theme')?.value || '未指定主题'}

## 章节规划
`;
          
          const chapterCount = parseInt(panel.querySelector('#chapter-count')?.value || '5');
          for (let i = 1; i <= chapterCount; i++) {
            resultText += `### 第${i}章\n- 主要情节发展\n- 角色关系变化\n\n`;
          }
          
          resultText += `*注意：这是基本模板，建议确保SillyTavern正确配置AI后端以获得更好的生成效果。*`;
          
          apiSuccess = true;
          console.log('[Story Weaver] Used basic template generation');
        }
      } catch (error) {
        console.warn('[Story Weaver] ST message system error:', error.message);
      } finally {
        // 确保清理临时消息
        const chatArray = window.chat || window.SillyTavern?.chat || [];
        if (Array.isArray(chatArray) && chatArray.length > originalChatLength) {
          chatArray.splice(originalChatLength);
          console.log('[Story Weaver] Cleaned up temporary messages');
        }
      }

      if (!apiSuccess || !resultText) {
        throw new Error('所有API端点都无法生成内容。请确保SillyTavern已正确配置AI后端。');
      }

      if (!resultText) {
        throw new Error('生成失败，未获取到有效内容');
      }

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
   * 刷新数据状态
   */
  function refreshData() {
    console.log('[Story Weaver] Refreshing data status...');

    const worldbookData = getWorldInfoData();
    const characterData = getCharacterData();

    const worldbookLoaded = worldbookData !== 'N/A';
    const characterLoaded = characterData !== 'N/A';

    console.log('[Story Weaver] Data status:', {
      worldbookLoaded,
      characterLoaded,
    });

    return {
      worldbook: { entries: worldbookLoaded ? ['Available'] : [] },
      character: { character: characterLoaded ? 'Available' : null },
    };
  }

  /**
   * Initialize extension
   */
  function initializeExtension() {
    if (isInitialized) return;

    loadSettings();
    setupExtensionUI();

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
    });

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

    // 检查可用的函数
    const possibleFunctions = [
      'Generate',
      'generateRaw',
      'getContext',
      'getWorldInfoPrompt',
      'getGlobalLore',
      'getChatLore',
      'sendSystemMessage',
      'addOneMessage',
    ];

    const availableFunctions = {};
    possibleFunctions.forEach(fn => {
      availableFunctions[fn] = typeof window[fn];
    });
    console.log('Available functions:', availableFunctions);

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

    // 检查ST的生成能力
    console.log('Checking ST generation capability...');
    console.log('Generate function available:', typeof window.Generate);
    console.log('Chat array available:', Array.isArray(window.chat));
    console.log('Chat length:', window.chat ? window.chat.length : 'N/A');
  };
})();
