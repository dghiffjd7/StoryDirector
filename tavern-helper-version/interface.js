/**
 * Story Weaver - Interface Builder for TavernHelper
 * 故事大纲生成器 - TavernHelper界面构建器
 */

/**
 * Build the main Story Weaver interface HTML
 */
async function buildInterface(settings) {
  const css = await getInterfaceCSS();
  
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Story Weaver - 故事大纲生成器</title>
    <style>${css}</style>
</head>
<body>
    <div id="story-weaver-app" class="story-weaver-app">
        <!-- Header -->
        <div class="sw-header">
            <h1 class="sw-title">
                <span class="sw-icon">📖</span>
                Story Weaver - 故事大纲生成器
            </h1>
            <div class="sw-header-actions">
                <button id="sw-refresh" class="sw-btn sw-btn-secondary" title="刷新数据">
                    <span class="sw-btn-icon">🔄</span>
                </button>
                <button id="sw-settings" class="sw-btn sw-btn-secondary" title="设置">
                    <span class="sw-btn-icon">⚙️</span>
                </button>
            </div>
        </div>

        <!-- Main Content -->
        <div class="sw-content">
            <!-- Context Settings Section -->
            <section class="sw-section">
                <h2 class="sw-section-title">
                    <span class="sw-section-icon">📖</span>
                    剧情上下文设定
                </h2>
                <div class="sw-section-content">
                    <div class="sw-form-group">
                        <label for="context-length" class="sw-label">读取对话历史长度：</label>
                        <div class="sw-input-group">
                            <input type="number" id="context-length" class="sw-input" 
                                   value="${settings.contextLength}" min="0" max="500" />
                            <span class="sw-input-unit">条消息</span>
                        </div>
                        <div class="sw-help-text">设置为0则不读取对话历史，仅基于世界观生成</div>
                    </div>
                    
                    <div class="sw-status-display">
                        <span class="sw-status-icon">ℹ️</span>
                        <span id="context-status">将根据设定自动读取最近的对话内容</span>
                    </div>
                    
                    <div class="sw-action-group">
                        <button id="preview-data" class="sw-btn sw-btn-outline">
                            <span class="sw-btn-icon">👁️</span>
                            预览数据
                        </button>
                        <button id="refresh-data" class="sw-btn sw-btn-outline">
                            <span class="sw-btn-icon">🔄</span>
                            刷新数据
                        </button>
                    </div>
                </div>
            </section>

            <!-- Story Settings Section -->
            <section class="sw-section">
                <h2 class="sw-section-title">
                    <span class="sw-section-icon">✨</span>
                    创作需求设定
                </h2>
                <div class="sw-section-content">
                    <div class="sw-form-row">
                        <div class="sw-form-group">
                            <label for="story-type" class="sw-label">故事类型：</label>
                            <select id="story-type" class="sw-select">
                                ${buildStoryTypeOptions(settings.storyType)}
                            </select>
                        </div>
                        <div class="sw-form-group">
                            <label for="story-style" class="sw-label">叙事风格：</label>
                            <select id="story-style" class="sw-select">
                                ${buildStoryStyleOptions(settings.storyStyle)}
                            </select>
                        </div>
                    </div>

                    <div class="sw-form-group">
                        <label for="story-theme" class="sw-label">故事主题/核心冲突：</label>
                        <textarea id="story-theme" class="sw-textarea" rows="4" 
                                  placeholder="例如：主角需要拯救被诅咒的王国，同时面对内心的恐惧与过去的阴霾...">${settings.storyTheme}</textarea>
                        <div class="sw-help-text">详细描述您希望故事围绕的核心主题、冲突或目标</div>
                    </div>

                    <div class="sw-form-row">
                        <div class="sw-form-group">
                            <label for="chapter-count" class="sw-label">期望章节数：</label>
                            <input type="number" id="chapter-count" class="sw-input" 
                                   value="${settings.chapterCount}" min="3" max="20" />
                        </div>
                        <div class="sw-form-group">
                            <label for="detail-level" class="sw-label">大纲详细程度：</label>
                            <select id="detail-level" class="sw-select">
                                ${buildDetailLevelOptions(settings.detailLevel)}
                            </select>
                        </div>
                    </div>

                    <div class="sw-form-group">
                        <label for="special-requirements" class="sw-label">特殊要求（可选）：</label>
                        <textarea id="special-requirements" class="sw-textarea" rows="3"
                                  placeholder="例如：需要包含特定角色的发展弧线、某些情节元素、特定的情感基调等...">${settings.specialRequirements}</textarea>
                    </div>

                    <div class="sw-checkbox-group">
                        <label class="sw-checkbox-label">
                            <input type="checkbox" id="include-summary" ${settings.includeSummary ? 'checked' : ''} />
                            <span class="sw-checkmark"></span>
                            包含整体摘要
                        </label>
                        <label class="sw-checkbox-label">
                            <input type="checkbox" id="include-characters" ${settings.includeCharacters ? 'checked' : ''} />
                            <span class="sw-checkmark"></span>
                            包含角色发展
                        </label>
                        <label class="sw-checkbox-label">
                            <input type="checkbox" id="include-themes" ${settings.includeThemes ? 'checked' : ''} />
                            <span class="sw-checkmark"></span>
                            包含主题分析
                        </label>
                    </div>
                </div>
            </section>

            <!-- Generation Section -->
            <section class="sw-section">
                <div class="sw-generate-section">
                    <button id="generate-outline" class="sw-btn sw-btn-primary sw-btn-large">
                        <span class="sw-btn-icon">🎭</span>
                        <span class="sw-btn-text">生成故事大纲</span>
                        <span class="sw-btn-loading hidden">🔄</span>
                    </button>
                </div>
            </section>

            <!-- Results Section -->
            <section class="sw-section">
                <h2 class="sw-section-title">
                    <span class="sw-section-icon">📄</span>
                    生成结果
                    <div class="sw-title-actions">
                        <button id="copy-result" class="sw-btn sw-btn-small" title="复制到剪贴板">
                            <span class="sw-btn-icon">📋</span>
                        </button>
                        <button id="save-result" class="sw-btn sw-btn-small" title="保存为文件">
                            <span class="sw-btn-icon">💾</span>
                        </button>
                        <button id="send-to-chat" class="sw-btn sw-btn-small" title="发送到聊天">
                            <span class="sw-btn-icon">💬</span>
                        </button>
                    </div>
                </h2>
                <div class="sw-section-content">
                    <div id="output-content" class="sw-output-content">
                        <div id="output-placeholder" class="sw-output-placeholder">
                            <span class="sw-placeholder-icon">📝</span>
                            <p>故事大纲将在这里显示...</p>
                            <p class="sw-placeholder-help">填写上方信息后点击"生成故事大纲"开始创作</p>
                        </div>
                        <div id="output-result" class="sw-output-result hidden">
                            <!-- Generated content will be displayed here -->
                        </div>
                    </div>
                    <div id="output-stats" class="sw-output-stats hidden">
                        <div class="sw-stat-item">
                            <span class="sw-stat-label">字数统计：</span>
                            <span id="word-count" class="sw-stat-value">0</span>
                        </div>
                        <div class="sw-stat-item">
                            <span class="sw-stat-label">生成时间：</span>
                            <span id="generation-time" class="sw-stat-value">--</span>
                        </div>
                        <div class="sw-stat-item">
                            <span class="sw-stat-label">章节数量：</span>
                            <span id="actual-chapters" class="sw-stat-value">0</span>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- Loading Overlay -->
        <div id="loading-overlay" class="sw-loading-overlay hidden">
            <div class="sw-loading-content">
                <div class="sw-spinner"></div>
                <p>正在生成故事大纲...</p>
                <p class="sw-loading-help">请稍候，AI正在基于您的设定创作精彩大纲</p>
            </div>
        </div>

        <!-- Notification Container -->
        <div id="notification-container" class="sw-notification-container"></div>
    </div>

    <script>
        ${getInterfaceJavaScript()}
    </script>
</body>
</html>`;
}

/**
 * Build story type select options
 */
function buildStoryTypeOptions(selectedType) {
  return Object.entries(STORY_TYPES).map(([key, label]) => 
    `<option value="${key}" ${key === selectedType ? 'selected' : ''}>${label}</option>`
  ).join('');
}

/**
 * Build story style select options  
 */
function buildStoryStyleOptions(selectedStyle) {
  return Object.entries(STORY_STYLES).map(([key, label]) =>
    `<option value="${key}" ${key === selectedStyle ? 'selected' : ''}>${label}</option>`
  ).join('');
}

/**
 * Build detail level select options
 */
function buildDetailLevelOptions(selectedLevel) {
  return Object.entries(DETAIL_LEVELS).map(([key, label]) =>
    `<option value="${key}" ${key === selectedLevel ? 'selected' : ''}>${label}</option>`
  ).join('');
}