/**
 * Story Weaver Plugin for SillyTavern
 * 世界观故事大纲生成器
 *
 * 描述：一个独立的 Silly Tavern 插件，能够读取世界书设定，
 * 结合用户需求智能生成结构化的故事大纲，辅助角色扮演和小说创作。
 *
 * 注意：本插件在独立UI面板中运行，不会干预聊天对话。
 */

(function () {
  'use strict';

  const MODULE_NAME = 'story-weaver';
  const PLUGIN_NAME = 'Story Weaver';

  // 全局变量
  let worldbookContent = '';
  let isPluginLoaded = false;
  let pluginButton = null;
  let pluginPanel = null;

  /**
   * 插件初始化函数
   */
  function initPlugin() {
    console.log(`${PLUGIN_NAME}: 插件初始化开始`);

    // 创建主界面按钮
    createMainButton();

    // 加载插件UI
    loadPluginUI();

    isPluginLoaded = true;
    console.log(`${PLUGIN_NAME}: 插件初始化完成`);
  }

  /**
   * 在 Silly Tavern 主界面创建功能按钮
   */
  function createMainButton() {
    // 查找合适的位置插入按钮
    const topBar =
      document.querySelector('#top-bar') ||
      document.querySelector('.top-bar') ||
      document.querySelector('#send_form') ||
      document.querySelector('body');

    if (!topBar) {
      console.error(`${PLUGIN_NAME}: 无法找到合适的位置插入按钮`);
      return;
    }

    // 创建按钮元素
    pluginButton = document.createElement('button');
    pluginButton.id = 'story-weaver-btn';
    pluginButton.className = 'story-weaver-main-btn';
    pluginButton.textContent = '📖 Story Weaver';
    pluginButton.title = '打开故事大纲生成器';

    // 添加按钮样式
    pluginButton.style.cssText = `
            margin: 5px;
            padding: 8px 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

    // 按钮悬停效果
    pluginButton.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-1px)';
      this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    });

    pluginButton.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    // 按钮点击事件
    pluginButton.addEventListener('click', togglePluginPanel);

    // 插入按钮到页面
    topBar.appendChild(pluginButton);

    console.log(`${PLUGIN_NAME}: 主界面按钮创建成功`);
  }

  /**
   * 切换插件面板显示/隐藏
   */
  function togglePluginPanel() {
    console.log(`${PLUGIN_NAME}: 按钮被点击`);

    if (!pluginPanel) {
      console.log(`${PLUGIN_NAME}: 首次打开面板，开始加载UI`);
      showPluginPanel();
    } else {
      if (pluginPanel.style.display === 'none') {
        pluginPanel.style.display = 'block';
        console.log(`${PLUGIN_NAME}: 面板已显示`);
      } else {
        pluginPanel.style.display = 'none';
        console.log(`${PLUGIN_NAME}: 面板已隐藏`);
      }
    }
  }

  /**
   * 显示插件面板
   */
  function showPluginPanel() {
    if (pluginPanel) {
      pluginPanel.style.display = 'block';
      return;
    }

    // 创建面板容器
    createPluginPanel();
  }

  /**
   * 创建插件面板
   */
  function createPluginPanel() {
    // 创建主容器
    pluginPanel = document.createElement('div');
    pluginPanel.id = 'story-weaver-panel';
    pluginPanel.className = 'story-weaver-panel';

    // 基础样式
    pluginPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            background: #1a1a1a;
            border: 2px solid #444;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            z-index: 10000;
            overflow-y: auto;
            padding: 20px;
        `;

    // 加载HTML内容
    loadPanelHTML();

    // 添加到页面
    document.body.appendChild(pluginPanel);

    console.log(`${PLUGIN_NAME}: 插件面板创建成功`);
  }

  /**
   * 加载面板HTML内容
   */
  async function loadPanelHTML() {
    try {
      // 尝试加载外部HTML文件
      const response = await fetch(`extensions/${MODULE_NAME}/index.html`);
      if (response.ok) {
        const htmlContent = await response.text();
        // 解析HTML并提取body内容
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const panelContent = doc.querySelector('.story-weaver-panel');
        if (panelContent) {
          pluginPanel.innerHTML = panelContent.innerHTML;
          console.log(`${PLUGIN_NAME}: 成功加载外部HTML文件`);
        } else {
          throw new Error('HTML文件格式错误');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn(`${PLUGIN_NAME}: 无法加载外部HTML文件 (${error.message})，使用内嵌HTML`);
      // 回退到内嵌HTML
      loadInlineHTML();
    }

    // 绑定事件
    bindPanelEvents();
  }

  /**
   * 加载内嵌HTML内容（备用方案）
   */
  function loadInlineHTML() {
    pluginPanel.innerHTML = `
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

                <!-- 剧情上下文设定区 -->
                <section class="content-section">
                    <h3 class="section-title">
                        <span class="section-icon">📖</span>
                        剧情上下文设定
                    </h3>
                    <div class="section-content">
                        <div class="form-group">
                            <label for="context-length" class="form-label">
                                读取对话历史长度：
                            </label>
                            <div class="input-with-unit">
                                <input type="number" id="context-length" value="100" min="0" max="500" class="form-input">
                                <span class="input-unit">条消息</span>
                            </div>
                            <div class="form-help">
                                设置为0则不读取对话历史，仅基于世界观生成
                            </div>
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
                            <label for="story-theme" class="form-label">
                                故事主题/核心冲突：
                            </label>
                            <textarea 
                                id="story-theme" 
                                class="form-textarea"
                                placeholder="例如：主角需要拯救被诅咒的王国，同时面对内心的恐惧与过去的阴霾。在这个过程中，主角将遇到值得信赖的伙伴，也会面临艰难的道德选择..."
                                rows="4"
                            ></textarea>
                            <div class="form-help">
                                详细描述您希望故事围绕的核心主题、冲突或目标
                            </div>
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
                                <label for="chapter-count" class="form-label">
                                    期望章节数：
                                </label>
                                <input 
                                    type="number" 
                                    id="chapter-count" 
                                    value="5" 
                                    min="3" 
                                    max="20" 
                                    class="form-input"
                                >
                            </div>
                            <div class="form-group flex-1">
                                <label for="detail-level" class="form-label">
                                    大纲详细程度：
                                </label>
                                <select id="detail-level" class="form-select">
                                    <option value="brief">简要大纲</option>
                                    <option value="detailed" selected>详细大纲</option>
                                    <option value="comprehensive">全面大纲</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="special-requirements" class="form-label">
                                特殊要求（可选）：
                            </label>
                            <textarea 
                                id="special-requirements" 
                                class="form-textarea"
                                placeholder="例如：需要包含特定角色的发展弧线、某些情节元素、特定的情感基调等..."
                                rows="3"
                            ></textarea>
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
                        <div class="generate-options">
                            <label class="checkbox-label">
                                <input type="checkbox" id="include-summary" checked>
                                <span class="checkmark"></span>
                                包含整体摘要
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="include-characters" checked>
                                <span class="checkmark"></span>
                                包含角色发展
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" id="include-themes">
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

            <!-- 加载指示器 -->
            <div id="loading-overlay" class="loading-overlay hidden">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <p>正在生成故事大纲...</p>
                </div>
            </div>
        `;
  }

  /**
   * 绑定面板事件
   */
  function bindPanelEvents() {
    // 关闭按钮
    const closeBtn = document.getElementById('close-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        pluginPanel.style.display = 'none';
      });
    }

    // 读取世界书按钮
    const readLorebooksBtn = document.getElementById('read-lorebooks');
    if (readLorebooksBtn) {
      readLorebooksBtn.addEventListener('click', handleReadLorebooks);
    }

    // 读取角色卡按钮
    const readCharacterBtn = document.getElementById('read-character');
    if (readCharacterBtn) {
      readCharacterBtn.addEventListener('click', handleReadCharacter);
    }

    // 生成大纲按钮
    const generateBtn = document.getElementById('generate-outline');
    if (generateBtn) {
      generateBtn.addEventListener('click', handleGenerateOutline);
    }

    // 复制结果按钮
    const copyBtn = document.getElementById('copy-result');
    if (copyBtn) {
      copyBtn.addEventListener('click', handleCopyResult);
    }

    // 保存结果按钮
    const saveBtn = document.getElementById('save-result');
    if (saveBtn) {
      saveBtn.addEventListener('click', handleSaveResult);
    }

    // 导出结果按钮
    const exportBtn = document.getElementById('export-result');
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExportResult);
    }

    // 上下文长度变化事件
    const contextLengthInput = document.getElementById('context-length');
    if (contextLengthInput) {
      contextLengthInput.addEventListener('change', handleContextLengthChange);
    }

    // 故事类型变化事件
    const storyTypeSelect = document.getElementById('story-type');
    if (storyTypeSelect) {
      storyTypeSelect.addEventListener('change', handleStoryTypeChange);
    }

    console.log(`${PLUGIN_NAME}: 事件绑定完成`);
  }

  /**
   * 处理读取世界书功能
   */
  function handleReadLorebooks() {
    console.log(`${PLUGIN_NAME}: 开始读取世界书`);

    const statusDiv = document.getElementById('lorebook-status');
    const previewDiv = document.getElementById('data-preview');
    const previewContent = document.getElementById('preview-content');

    updateStatus(statusDiv, '正在读取世界书...', 'loading');

    // 模拟读取过程（后续会实现真实的读取逻辑）
    setTimeout(() => {
      // 模拟世界书数据
      const mockWorldbook = [
        { keys: ['王国', '艾尔达'], content: '艾尔达王国是一个古老的魔法王国，拥有悠久的历史和强大的魔法师议会。' },
        { keys: ['主角', '亚历克斯'], content: '亚历克斯是一位年轻的冒险者，拥有神秘的血统和潜在的魔法力量。' },
        { keys: ['邪恶势力', '暗影军团'], content: '暗影军团是威胁世界和平的邪恶势力，由强大的黑暗领主统领。' },
      ];

      worldbookContent = mockWorldbook
        .map(entry => `关键词: ${entry.keys.join(', ')}\n内容: ${entry.content}`)
        .join('\n\n');

      updateStatus(statusDiv, `✅ 世界书读取成功！共读取到 ${mockWorldbook.length} 个条目。`, 'success');

      // 显示预览
      previewContent.textContent = worldbookContent.substring(0, 200) + '...';
      previewDiv.classList.remove('hidden');

      console.log(`${PLUGIN_NAME}: 世界书读取完成`);
    }, 1000);
  }

  /**
   * 处理读取角色卡功能
   */
  function handleReadCharacter() {
    console.log(`${PLUGIN_NAME}: 开始读取角色卡`);

    const statusDiv = document.getElementById('lorebook-status');
    const previewDiv = document.getElementById('data-preview');
    const previewContent = document.getElementById('preview-content');

    updateStatus(statusDiv, '正在读取当前角色卡信息...', 'loading');

    // 模拟读取过程
    setTimeout(() => {
      const mockCharacter = {
        name: '艾莉娅',
        description: '一位勇敢的精灵战士，擅长弓箭和自然魔法。她有着银色的长发和翡翠色的眼睛。',
        personality: '善良、勇敢、有时会显得固执，对朋友非常忠诚。',
        background: '来自古老的精灵森林，为了保护家园而踏上冒险之路。',
      };

      const characterContent =
        `角色姓名: ${mockCharacter.name}\n` +
        `角色描述: ${mockCharacter.description}\n` +
        `性格特点: ${mockCharacter.personality}\n` +
        `背景故事: ${mockCharacter.background}`;

      // 合并角色信息到现有内容
      if (worldbookContent) {
        worldbookContent += '\n\n=== 角色信息 ===\n' + characterContent;
      } else {
        worldbookContent = '=== 角色信息 ===\n' + characterContent;
      }

      updateStatus(statusDiv, '✅ 角色卡读取成功！角色信息已合并到世界观数据中。', 'success');

      // 更新预览
      previewContent.textContent = worldbookContent.substring(0, 300) + '...';
      previewDiv.classList.remove('hidden');

      console.log(`${PLUGIN_NAME}: 角色卡读取完成`);
    }, 800);
  }

  /**
   * 处理上下文长度变化
   */
  function handleContextLengthChange(event) {
    const length = event.target.value;
    const contextStatus = document.getElementById('context-status');

    if (length == 0) {
      updateStatus(contextStatus, '⚠️ 已设为不读取对话历史，将仅基于世界观生成大纲', 'warning');
    } else {
      updateStatus(contextStatus, `📖 将读取最近 ${length} 条对话消息作为剧情上下文`, 'info');
    }

    console.log(`${PLUGIN_NAME}: 上下文长度设置为 ${length}`);
  }

  /**
   * 处理故事类型变化
   */
  function handleStoryTypeChange(event) {
    const storyType = event.target.value;
    const themeTextarea = document.getElementById('story-theme');

    // 根据故事类型提供建议的主题模板
    const themeTemplates = {
      fantasy: '主角踏上史诗般的冒险旅程，需要获得古老的力量来对抗威胁世界的邪恶势力...',
      romance: '两个来自不同背景的人相遇，在重重困难中发展出深厚的感情...',
      mystery: '一连串神秘事件的发生，主角需要抽丝剥茧找出真相...',
      scifi: '在遥远的未来或外星世界，主角面临科技与人性的冲突...',
      'slice-of-life': '平凡日常中的温馨故事，关注角色的成长和人际关系...',
      action: '紧张刺激的冒险，主角需要运用智慧和勇气克服重重难关...',
      drama: '深刻的人性探讨，角色面临重要的人生选择和情感挑战...',
      horror: '恐怖的氛围中，主角需要面对未知的威胁和内心的恐惧...',
      comedy: '轻松幽默的故事，在欢声笑语中传达温暖的信息...',
    };

    if (themeTemplates[storyType] && !themeTextarea.value.trim()) {
      themeTextarea.placeholder = themeTemplates[storyType];
    }

    console.log(`${PLUGIN_NAME}: 故事类型切换为 ${storyType}`);
  }

  /**
   * 更新状态显示
   */
  function updateStatus(statusElement, message, type = 'info') {
    if (!statusElement) return;

    const statusIcon = statusElement.querySelector('.status-icon');
    const colors = {
      info: '#aaaaaa',
      success: '#4a7c59',
      warning: '#ffa500',
      error: '#e74c3c',
      loading: '#667eea',
    };

    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      loading: '🔄',
    };

    if (statusIcon) {
      statusIcon.textContent = icons[type] || 'ℹ️';
    }

    statusElement.style.color = colors[type] || colors.info;

    // 更新文本内容（保留图标）
    const textContent = statusElement.textContent.replace(/^[^\s]+\s/, '');
    statusElement.innerHTML = `<span class="status-icon">${icons[type] || 'ℹ️'}</span>${message}`;
  }

  /**
   * 处理生成大纲功能
   */
  function handleGenerateOutline() {
    console.log(`${PLUGIN_NAME}: 开始生成故事大纲`);

    const generateBtn = document.getElementById('generate-outline');
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    const outputDiv = document.getElementById('output-content');
    const outputStats = document.getElementById('output-stats');
    const loadingOverlay = document.getElementById('loading-overlay');

    // 获取用户输入
    const formData = collectFormData();

    // 验证必要数据
    if (!worldbookContent && !formData.storyTheme) {
      showNotification('❌ 请先读取世界观数据或填写故事主题！', 'error');
      return;
    }

    const startTime = Date.now();

    // 更新UI状态
    if (btnText) btnText.classList.add('hidden');
    if (btnLoading) btnLoading.classList.remove('hidden');
    generateBtn.disabled = true;

    // 显示加载状态
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');

    // 清空输出区域
    outputDiv.innerHTML = '<div class="generating-indicator">🎭 正在基于世界观和需求生成故事大纲...</div>';

    // 模拟生成过程（后续会实现真实的API调用）
    setTimeout(() => {
      const generatedOutline = generateMockOutline(formData);
      const endTime = Date.now();
      const generationTime = ((endTime - startTime) / 1000).toFixed(1);

      // 更新输出内容
      outputDiv.innerHTML = generatedOutline;

      // 更新统计信息
      updateOutputStats(generatedOutline, generationTime, formData.chapterCount);
      if (outputStats) outputStats.classList.remove('hidden');

      // 恢复按钮状态
      if (btnText) btnText.classList.remove('hidden');
      if (btnLoading) btnLoading.classList.add('hidden');
      generateBtn.disabled = false;

      // 隐藏加载状态
      if (loadingOverlay) loadingOverlay.classList.add('hidden');

      showNotification('✅ 故事大纲生成完成！', 'success');
      console.log(`${PLUGIN_NAME}: 故事大纲生成完成，耗时 ${generationTime}s`);
    }, 2500);
  }

  /**
   * 收集表单数据
   */
  function collectFormData() {
    return {
      storyType: document.getElementById('story-type')?.value || 'fantasy',
      storyTheme: document.getElementById('story-theme')?.value || '',
      storyStyle: document.getElementById('story-style')?.value || 'descriptive',
      chapterCount: parseInt(document.getElementById('chapter-count')?.value || '5'),
      detailLevel: document.getElementById('detail-level')?.value || 'detailed',
      specialRequirements: document.getElementById('special-requirements')?.value || '',
      contextLength: parseInt(document.getElementById('context-length')?.value || '100'),
      includeSummary: document.getElementById('include-summary')?.checked || false,
      includeCharacters: document.getElementById('include-characters')?.checked || false,
      includeThemes: document.getElementById('include-themes')?.checked || false,
    };
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
      horror: '👻',
      comedy: '😄',
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
      horror: '恐怖惊悚',
      comedy: '轻松喜剧',
      custom: '自定义',
    };

    let outline = `<div class="outline-header">
            <h2>${typeEmojis[formData.storyType]} ${typeNames[formData.storyType]}故事大纲</h2>
            <div class="outline-meta">
                <span class="meta-item">📅 生成时间：${new Date().toLocaleString()}</span>
                <span class="meta-item">📖 章节数：${formData.chapterCount}</span>
                <span class="meta-item">📝 详细程度：${formData.detailLevel}</span>
            </div>
        </div>`;

    if (formData.includeSummary) {
      outline += `\n<div class="outline-section">
                <h3>🎯 故事概述</h3>
                <div class="section-content">
                    <p><strong>核心主题：</strong>${formData.storyTheme || '基于世界观背景展开的冒险故事'}</p>
                    <p><strong>叙事风格：</strong>${
                      document.querySelector('#story-style option:checked')?.textContent || '详细描述型'
                    }</p>
                    ${
                      formData.specialRequirements
                        ? `<p><strong>特殊要求：</strong>${formData.specialRequirements}</p>`
                        : ''
                    }
                </div>
            </div>`;
    }

    // 生成章节大纲
    outline += '\n<div class="outline-section"><h3>📚 章节大纲</h3><div class="chapters-container">';

    for (let i = 1; i <= formData.chapterCount; i++) {
      const chapterTitle = generateChapterTitle(i, formData.chapterCount, formData.storyType);
      const chapterContent = generateChapterContent(i, formData.chapterCount, formData.detailLevel);

      outline += `
                <div class="chapter-item">
                    <h4>第${i}章：${chapterTitle}</h4>
                    <div class="chapter-content">
                        ${chapterContent}
                    </div>
                </div>`;
    }

    outline += '</div></div>';

    if (formData.includeCharacters) {
      outline += `\n<div class="outline-section">
                <h3>👥 角色发展弧线</h3>
                <div class="section-content">
                    <p><strong>主角发展：</strong>从初始状态逐步成长，面临挑战并获得成长，最终达成目标。</p>
                    <p><strong>配角作用：</strong>提供支持、制造冲突或推动剧情发展。</p>
                    <p><strong>反派角色：</strong>代表主要冲突和障碍，推动主角成长。</p>
                </div>
            </div>`;
    }

    if (formData.includeThemes) {
      outline += `\n<div class="outline-section">
                <h3>💭 主题分析</h3>
                <div class="section-content">
                    <p><strong>核心价值：</strong>勇气、友谊、成长、希望</p>
                    <p><strong>冲突类型：</strong>内在冲突与外在挑战的结合</p>
                    <p><strong>情感基调：</strong>积极向上，富有感染力</p>
                </div>
            </div>`;
    }

    return outline;
  }

  /**
   * 生成章节标题
   */
  function generateChapterTitle(chapterNum, totalChapters, storyType) {
    const titles = {
      1: ['序章', '开端', '起始', '初遇', '觉醒'],
      middle: ['挑战', '冒险', '探索', '发现', '考验', '成长', '危机', '转折'],
      final: ['决战', '终章', '归来', '尾声', '新生'],
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
   * 生成章节内容
   */
  function generateChapterContent(chapterNum, totalChapters, detailLevel) {
    const progress = chapterNum / totalChapters;
    let content = '';

    if (progress <= 0.25) {
      content = '• 建立世界观和角色背景\n• 引入初始冲突或问题\n• 展示主角的日常生活状态';
    } else if (progress <= 0.5) {
      content = '• 冲突升级，主角被迫行动\n• 遇到重要的盟友或敌人\n• 揭示更深层的背景信息';
    } else if (progress <= 0.75) {
      content = '• 面临重大挑战或转折点\n• 角色关系发生重要变化\n• 推进主要情节线发展';
    } else {
      content = '• 迎来最终对决或高潮\n• 解决核心冲突\n• 角色完成成长弧线';
    }

    if (detailLevel === 'comprehensive') {
      content += '\n• 详细的场景描述和对话设计\n• 深入的角色心理刻画\n• 与整体主题的呼应';
    }

    return content
      .split('\n')
      .map(line => `<p>${line}</p>`)
      .join('');
  }

  /**
   * 更新输出统计信息
   */
  function updateOutputStats(content, generationTime, chapterCount) {
    const wordCount = content.replace(/<[^>]*>/g, '').length;

    const wordCountEl = document.getElementById('word-count');
    const generationTimeEl = document.getElementById('generation-time');
    const actualChaptersEl = document.getElementById('actual-chapters');

    if (wordCountEl) wordCountEl.textContent = wordCount;
    if (generationTimeEl) generationTimeEl.textContent = `${generationTime}s`;
    if (actualChaptersEl) actualChaptersEl.textContent = chapterCount;
  }

  /**
   * 处理复制结果功能
   */
  function handleCopyResult() {
    const outputDiv = document.getElementById('output-content');

    // 检查是否有内容
    if (!outputDiv || outputDiv.querySelector('.output-placeholder')) {
      showNotification('❌ 没有可复制的内容！', 'error');
      return;
    }

    // 提取纯文本内容
    const content = outputDiv.innerText || outputDiv.textContent;

    if (!content.trim()) {
      showNotification('❌ 内容为空，无法复制！', 'error');
      return;
    }

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(content)
        .then(() => {
          showNotification('✅ 大纲已复制到剪贴板！', 'success');
        })
        .catch(() => {
          fallbackCopy(content);
        });
    } else {
      fallbackCopy(content);
    }
  }

  /**
   * 备用复制方法
   */
  function fallbackCopy(content) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, 99999);

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        showNotification('✅ 大纲已复制到剪贴板！', 'success');
      } else {
        showNotification('❌ 复制失败，请手动复制！', 'error');
      }
    } catch (err) {
      showNotification('❌ 复制功能不可用，请手动复制！', 'error');
    }
  }

  /**
   * 处理保存结果功能
   */
  function handleSaveResult() {
    const outputDiv = document.getElementById('output-content');

    if (!outputDiv || outputDiv.querySelector('.output-placeholder')) {
      showNotification('❌ 没有可保存的内容！', 'error');
      return;
    }

    const content = outputDiv.innerText || outputDiv.textContent;
    const formData = collectFormData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `story-outline-${formData.storyType}-${timestamp}.txt`;

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
   * 处理导出结果功能
   */
  function handleExportResult() {
    const outputDiv = document.getElementById('output-content');

    if (!outputDiv || outputDiv.querySelector('.output-placeholder')) {
      showNotification('❌ 没有可导出的内容！', 'error');
      return;
    }

    const formData = collectFormData();
    const markdownContent = convertToMarkdown(outputDiv, formData);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `story-outline-${formData.storyType}-${timestamp}.md`;

    try {
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
      showNotification(`✅ 大纲已导出为 Markdown: ${filename}`, 'success');
    } catch (error) {
      console.error('导出失败:', error);
      showNotification('❌ 导出失败，请检查浏览器权限！', 'error');
    }
  }

  /**
   * 转换为Markdown格式
   */
  function convertToMarkdown(outputDiv, formData) {
    let markdown = `# ${formData.storyType.toUpperCase()} 故事大纲\n\n`;
    markdown += `**生成时间:** ${new Date().toLocaleString()}\n`;
    markdown += `**故事类型:** ${formData.storyType}\n`;
    markdown += `**章节数量:** ${formData.chapterCount}\n`;
    markdown += `**详细程度:** ${formData.detailLevel}\n\n`;

    if (formData.storyTheme) {
      markdown += `## 🎯 故事主题\n\n${formData.storyTheme}\n\n`;
    }

    if (formData.specialRequirements) {
      markdown += `## 📝 特殊要求\n\n${formData.specialRequirements}\n\n`;
    }

    // 提取章节信息
    const chapters = outputDiv.querySelectorAll('.chapter-item');
    if (chapters.length > 0) {
      markdown += `## 📚 章节大纲\n\n`;
      chapters.forEach((chapter, index) => {
        const title = chapter.querySelector('h4')?.textContent || `第${index + 1}章`;
        const content = chapter.querySelector('.chapter-content')?.innerText || '';

        markdown += `### ${title}\n\n`;
        if (content) {
          markdown += `${content}\n\n`;
        }
      });
    }

    // 添加其他部分
    const sections = outputDiv.querySelectorAll('.outline-section');
    sections.forEach(section => {
      const title = section.querySelector('h3')?.textContent || '';
      const content = section.querySelector('.section-content')?.innerText || '';

      if (title && content && !title.includes('章节大纲')) {
        markdown += `## ${title}\n\n${content}\n\n`;
      }
    });

    markdown += `---\n*生成器: Story Weaver Plugin for SillyTavern*\n`;

    return markdown;
  }

  /**
   * 显示通知消息
   */
  function showNotification(message, type = 'success') {
    // 查找或创建通知容器
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    // 设置图标
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };

    notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-text">${message}</span>
        `;

    // 添加到容器
    container.appendChild(notification);

    // 自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            container.removeChild(notification);
          }
        }, 300);
      }
    }, 3000);

    console.log(`${PLUGIN_NAME}: ${message}`);
  }

  /**
   * 加载插件UI（预留用于加载外部HTML文件）
   */
  function loadPluginUI() {
    console.log(`${PLUGIN_NAME}: UI加载完成`);
  }

  /**
   * 插件入口点
   */
  function main() {
    // 等待页面加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPlugin);
    } else {
      initPlugin();
    }

    console.log(`${PLUGIN_NAME}: Hello, Story Weaver!`);
  }

  // 启动插件
  main();
})();
