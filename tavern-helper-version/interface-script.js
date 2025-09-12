/**
 * Story Weaver - Interface JavaScript for TavernHelper
 * 故事大纲生成器 - TavernHelper界面脚本
 */

function getInterfaceJavaScript() {
  return `
// ===== Interface JavaScript for Story Weaver =====
(function() {
    'use strict';
    
    // Interface state
    let isGenerating = false;
    let currentSettings = {};
    
    // Initialize interface
    function initInterface() {
        console.log('[Story Weaver UI] Initializing interface');
        
        // Bind event handlers
        bindEventHandlers();
        
        // Load current settings
        loadCurrentSettings();
        
        console.log('[Story Weaver UI] Interface initialized');
    }
    
    // Bind all event handlers
    function bindEventHandlers() {
        // Generation button
        const generateBtn = document.getElementById('generate-outline');
        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerate);
        }
        
        // Data preview buttons
        const previewDataBtn = document.getElementById('preview-data');
        if (previewDataBtn) {
            previewDataBtn.addEventListener('click', handlePreviewData);
        }
        
        const refreshDataBtn = document.getElementById('refresh-data');
        if (refreshDataBtn) {
            refreshDataBtn.addEventListener('click', handleRefreshData);
        }
        
        // Result action buttons
        const copyBtn = document.getElementById('copy-result');
        if (copyBtn) {
            copyBtn.addEventListener('click', handleCopyResult);
        }
        
        const saveBtn = document.getElementById('save-result');
        if (saveBtn) {
            saveBtn.addEventListener('click', handleSaveResult);
        }
        
        const sendToChatBtn = document.getElementById('send-to-chat');
        if (sendToChatBtn) {
            sendToChatBtn.addEventListener('click', handleSendToChat);
        }
        
        // Settings change handlers
        bindSettingsHandlers();
    }
    
    // Bind settings change handlers
    function bindSettingsHandlers() {
        const settingsElements = [
            'context-length',
            'story-type',
            'story-style', 
            'story-theme',
            'chapter-count',
            'detail-level',
            'special-requirements',
            'include-summary',
            'include-characters',
            'include-themes'
        ];
        
        settingsElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', handleSettingsChange);
            }
        });
    }
    
    // Load current settings into interface
    function loadCurrentSettings() {
        // Settings are already loaded into the HTML template
        // This function could be used for real-time updates
        handleSettingsChange();
    }
    
    // Handle settings changes
    function handleSettingsChange() {
        currentSettings = {
            contextLength: parseInt(document.getElementById('context-length')?.value || 100),
            storyType: document.getElementById('story-type')?.value || 'fantasy',
            storyStyle: document.getElementById('story-style')?.value || 'detailed',
            storyTheme: document.getElementById('story-theme')?.value || '',
            chapterCount: parseInt(document.getElementById('chapter-count')?.value || 5),
            detailLevel: document.getElementById('detail-level')?.value || 'detailed',
            specialRequirements: document.getElementById('special-requirements')?.value || '',
            includeSummary: document.getElementById('include-summary')?.checked || false,
            includeCharacters: document.getElementById('include-characters')?.checked || false,
            includeThemes: document.getElementById('include-themes')?.checked || false
        };
        
        // Update context status
        updateContextStatus();
        
        // Auto-save settings (communicate back to parent script)
        if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
                type: 'sw-settings-changed',
                settings: currentSettings
            }, '*');
        }
    }
    
    // Update context status display
    function updateContextStatus() {
        const statusElement = document.getElementById('context-status');
        if (!statusElement) return;
        
        const contextLength = currentSettings.contextLength;
        let statusText = '';
        
        if (contextLength === 0) {
            statusText = '不读取对话历史，仅基于世界书设定生成';
        } else {
            statusText = \`将读取最近 \${contextLength} 条消息作为上下文\`;
        }
        
        statusElement.textContent = statusText;
    }
    
    // Handle generate button click
    async function handleGenerate() {
        if (isGenerating) return;
        
        try {
            setGeneratingState(true);
            showNotification('开始生成故事大纲...', 'info');
            
            const startTime = Date.now();
            
            // Send generation request to parent script
            const result = await sendMessageToParent({
                type: 'sw-generate',
                settings: currentSettings
            });
            
            const endTime = Date.now();
            const generationTime = ((endTime - startTime) / 1000).toFixed(1);
            
            if (result.success) {
                displayResult(result.outline, generationTime);
                showNotification('故事大纲生成成功！', 'success');
            } else {
                throw new Error(result.error || '生成失败');
            }
            
        } catch (error) {
            console.error('[Story Weaver UI] Generation error:', error);
            showNotification(\`生成失败：\${error.message}\`, 'error');
        } finally {
            setGeneratingState(false);
        }
    }
    
    // Handle preview data
    async function handlePreviewData() {
        try {
            showNotification('正在获取数据预览...', 'info');
            
            const result = await sendMessageToParent({
                type: 'sw-preview-data',
                settings: currentSettings
            });
            
            if (result.success) {
                // Display preview in a modal or separate section
                displayDataPreview(result.data);
                showNotification('数据预览获取成功', 'success');
            } else {
                throw new Error(result.error || '获取预览失败');
            }
            
        } catch (error) {
            console.error('[Story Weaver UI] Preview error:', error);
            showNotification(\`获取预览失败：\${error.message}\`, 'error');
        }
    }
    
    // Handle refresh data
    async function handleRefreshData() {
        try {
            showNotification('正在刷新数据...', 'info');
            
            const result = await sendMessageToParent({
                type: 'sw-refresh-data'
            });
            
            if (result.success) {
                showNotification('数据刷新成功', 'success');
            } else {
                throw new Error(result.error || '刷新失败');
            }
            
        } catch (error) {
            console.error('[Story Weaver UI] Refresh error:', error);
            showNotification(\`刷新失败：\${error.message}\`, 'error');
        }
    }
    
    // Handle copy result
    async function handleCopyResult() {
        const resultElement = document.getElementById('output-result');
        if (!resultElement || resultElement.classList.contains('hidden')) {
            showNotification('没有可复制的内容', 'warning');
            return;
        }
        
        try {
            const text = resultElement.textContent;
            await navigator.clipboard.writeText(text);
            showNotification('已复制到剪贴板', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = resultElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('已复制到剪贴板', 'success');
        }
    }
    
    // Handle save result
    async function handleSaveResult() {
        const resultElement = document.getElementById('output-result');
        if (!resultElement || resultElement.classList.contains('hidden')) {
            showNotification('没有可保存的内容', 'warning');
            return;
        }
        
        try {
            const content = resultElement.textContent;
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = \`故事大纲_\${timestamp}.md\`;
            
            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showNotification('文件保存成功', 'success');
        } catch (error) {
            console.error('[Story Weaver UI] Save error:', error);
            showNotification(\`保存失败：\${error.message}\`, 'error');
        }
    }
    
    // Handle send to chat
    async function handleSendToChat() {
        const resultElement = document.getElementById('output-result');
        if (!resultElement || resultElement.classList.contains('hidden')) {
            showNotification('没有可发送的内容', 'warning');
            return;
        }
        
        try {
            const content = resultElement.textContent;
            
            const result = await sendMessageToParent({
                type: 'sw-send-to-chat',
                content: content
            });
            
            if (result.success) {
                showNotification('已发送到聊天', 'success');
            } else {
                throw new Error(result.error || '发送失败');
            }
            
        } catch (error) {
            console.error('[Story Weaver UI] Send to chat error:', error);
            showNotification(\`发送失败：\${error.message}\`, 'error');
        }
    }
    
    // Display generation result
    function displayResult(outline, generationTime) {
        const placeholderElement = document.getElementById('output-placeholder');
        const resultElement = document.getElementById('output-result');
        const statsElement = document.getElementById('output-stats');
        
        if (placeholderElement) {
            placeholderElement.classList.add('hidden');
        }
        
        if (resultElement) {
            resultElement.textContent = outline;
            resultElement.classList.remove('hidden');
        }
        
        if (statsElement) {
            const wordCount = outline.length;
            const chapterCount = (outline.match(/#+\\s/g) || []).length;
            
            document.getElementById('word-count').textContent = wordCount;
            document.getElementById('generation-time').textContent = \`\${generationTime}s\`;
            document.getElementById('actual-chapters').textContent = chapterCount;
            
            statsElement.classList.remove('hidden');
        }
    }
    
    // Display data preview
    function displayDataPreview(data) {
        // For now, show in console - could be enhanced with modal
        console.log('[Story Weaver UI] Data Preview:', data);
        
        // Could create a modal here to show the preview
        alert(\`数据预览：\\n\\n世界书条目：\${data.worldbookEntries?.length || 0}\\n角色信息：\${data.characterData ? '已获取' : '未获取'}\\n对话历史：\${data.chatHistory ? '已获取' : '未获取'}\`);
    }
    
    // Set generating state
    function setGeneratingState(generating) {
        isGenerating = generating;
        
        const generateBtn = document.getElementById('generate-outline');
        const loadingOverlay = document.getElementById('loading-overlay');
        const btnText = generateBtn?.querySelector('.sw-btn-text');
        const btnLoading = generateBtn?.querySelector('.sw-btn-loading');
        
        if (generateBtn) {
            generateBtn.disabled = generating;
        }
        
        if (loadingOverlay) {
            loadingOverlay.classList.toggle('hidden', !generating);
        }
        
        if (btnText && btnLoading) {
            btnText.classList.toggle('hidden', generating);
            btnLoading.classList.toggle('hidden', !generating);
        }
    }
    
    // Send message to parent script
    function sendMessageToParent(message) {
        return new Promise((resolve, reject) => {
            if (!window.parent || !window.parent.postMessage) {
                reject(new Error('无法与父脚本通信'));
                return;
            }
            
            const messageId = Date.now() + Math.random();
            message.messageId = messageId;
            
            const timeout = setTimeout(() => {
                reject(new Error('通信超时'));
            }, 30000);
            
            const handler = (event) => {
                if (event.data.messageId === messageId) {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handler);
                    resolve(event.data);
                }
            };
            
            window.addEventListener('message', handler);
            window.parent.postMessage(message, '*');
        });
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = \`sw-notification \${type}\`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInterface);
    } else {
        initInterface();
    }
})();
`;
}