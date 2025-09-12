/**
 * Story Weaver - CSS Styles for TavernHelper
 * 故事大纲生成器 - TavernHelper样式
 */

function getInterfaceCSS() {
  return `
/* ===== Story Weaver TavernHelper Styles ===== */
:root {
  /* Color Variables */
  --sw-primary: #4f46e5;
  --sw-primary-hover: #4338ca;
  --sw-primary-light: #e0e7ff;
  --sw-secondary: #6b7280;
  --sw-secondary-hover: #4b5563;
  --sw-success: #10b981;
  --sw-danger: #ef4444;
  --sw-warning: #f59e0b;
  
  /* Background Colors */
  --sw-bg-primary: #ffffff;
  --sw-bg-secondary: #f9fafb;
  --sw-bg-tertiary: #f3f4f6;
  --sw-bg-dark: #1f2937;
  --sw-bg-darker: #111827;
  
  /* Text Colors */
  --sw-text-primary: #111827;
  --sw-text-secondary: #6b7280;
  --sw-text-muted: #9ca3af;
  --sw-text-light: #ffffff;
  
  /* Border Colors */
  --sw-border: #e5e7eb;
  --sw-border-light: #f3f4f6;
  --sw-border-focus: #4f46e5;
  
  /* Shadows */
  --sw-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --sw-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --sw-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --sw-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  
  /* Transitions */
  --sw-transition: all 0.15s ease-in-out;
  --sw-transition-slow: all 0.3s ease-in-out;
  
  /* Border Radius */
  --sw-radius: 8px;
  --sw-radius-lg: 12px;
  --sw-radius-xl: 16px;
  
  /* Spacing */
  --sw-spacing-xs: 4px;
  --sw-spacing-sm: 8px;
  --sw-spacing: 16px;
  --sw-spacing-lg: 24px;
  --sw-spacing-xl: 32px;
}

/* Base Styles */
.story-weaver-app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--sw-bg-secondary);
  min-height: 100vh;
  color: var(--sw-text-primary);
  line-height: 1.6;
}

.story-weaver-app * {
  box-sizing: border-box;
}

/* Header Styles */
.sw-header {
  background: var(--sw-bg-primary);
  border-bottom: 1px solid var(--sw-border);
  padding: var(--sw-spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--sw-shadow-sm);
}

.sw-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--sw-text-primary);
  display: flex;
  align-items: center;
  gap: var(--sw-spacing-sm);
}

.sw-icon {
  font-size: 1.8rem;
}

.sw-header-actions {
  display: flex;
  gap: var(--sw-spacing-sm);
}

/* Content Layout */
.sw-content {
  padding: var(--sw-spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

/* Section Styles */
.sw-section {
  background: var(--sw-bg-primary);
  border-radius: var(--sw-radius-lg);
  box-shadow: var(--sw-shadow);
  margin-bottom: var(--sw-spacing-lg);
  overflow: hidden;
}

.sw-section-title {
  margin: 0;
  padding: var(--sw-spacing) var(--sw-spacing-lg);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--sw-text-primary);
  background: var(--sw-bg-tertiary);
  border-bottom: 1px solid var(--sw-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sw-spacing-sm);
}

.sw-section-icon {
  font-size: 1.2rem;
}

.sw-section-content {
  padding: var(--sw-spacing-lg);
}

.sw-title-actions {
  display: flex;
  gap: var(--sw-spacing-xs);
}

/* Form Styles */
.sw-form-group {
  margin-bottom: var(--sw-spacing);
}

.sw-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sw-spacing);
  margin-bottom: var(--sw-spacing);
}

.sw-label {
  display: block;
  font-weight: 500;
  color: var(--sw-text-primary);
  margin-bottom: var(--sw-spacing-xs);
}

.sw-input,
.sw-select,
.sw-textarea {
  width: 100%;
  padding: var(--sw-spacing-sm) var(--sw-spacing);
  border: 1px solid var(--sw-border);
  border-radius: var(--sw-radius);
  font-size: 0.9rem;
  transition: var(--sw-transition);
  background: var(--sw-bg-primary);
  color: var(--sw-text-primary);
}

.sw-input:focus,
.sw-select:focus,
.sw-textarea:focus {
  outline: none;
  border-color: var(--sw-border-focus);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.sw-textarea {
  resize: vertical;
  min-height: 80px;
}

.sw-input-group {
  display: flex;
  align-items: center;
  gap: var(--sw-spacing-sm);
}

.sw-input-unit {
  font-size: 0.85rem;
  color: var(--sw-text-secondary);
  white-space: nowrap;
}

.sw-help-text {
  font-size: 0.8rem;
  color: var(--sw-text-secondary);
  margin-top: var(--sw-spacing-xs);
}

/* Button Styles */
.sw-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sw-spacing-xs);
  padding: var(--sw-spacing-sm) var(--sw-spacing);
  border: 1px solid transparent;
  border-radius: var(--sw-radius);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--sw-transition);
  text-decoration: none;
  background: transparent;
  position: relative;
  overflow: hidden;
}

.sw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sw-btn-primary {
  background: var(--sw-primary);
  color: var(--sw-text-light);
}

.sw-btn-primary:hover:not(:disabled) {
  background: var(--sw-primary-hover);
}

.sw-btn-secondary {
  background: var(--sw-secondary);
  color: var(--sw-text-light);
}

.sw-btn-secondary:hover:not(:disabled) {
  background: var(--sw-secondary-hover);
}

.sw-btn-outline {
  border-color: var(--sw-border);
  color: var(--sw-text-primary);
}

.sw-btn-outline:hover:not(:disabled) {
  background: var(--sw-bg-tertiary);
}

.sw-btn-small {
  padding: var(--sw-spacing-xs) var(--sw-spacing-sm);
  font-size: 0.8rem;
}

.sw-btn-large {
  padding: var(--sw-spacing) var(--sw-spacing-lg);
  font-size: 1.1rem;
  font-weight: 600;
}

.sw-btn-icon {
  font-size: 1em;
}

.sw-btn-loading {
  animation: spin 1s linear infinite;
}

/* Checkbox Styles */
.sw-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sw-spacing);
  margin-top: var(--sw-spacing);
}

.sw-checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--sw-spacing-sm);
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--sw-text-primary);
}

.sw-checkbox-label input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.sw-checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid var(--sw-border);
  border-radius: var(--sw-spacing-xs);
  position: relative;
  transition: var(--sw-transition);
}

.sw-checkbox-label input[type="checkbox"]:checked + .sw-checkmark {
  background: var(--sw-primary);
  border-color: var(--sw-primary);
}

.sw-checkbox-label input[type="checkbox"]:checked + .sw-checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

/* Status Display */
.sw-status-display {
  display: flex;
  align-items: center;
  gap: var(--sw-spacing-sm);
  padding: var(--sw-spacing-sm) var(--sw-spacing);
  background: var(--sw-primary-light);
  border-radius: var(--sw-radius);
  font-size: 0.85rem;
  color: var(--sw-primary);
  margin-bottom: var(--sw-spacing);
}

.sw-status-icon {
  font-size: 1em;
}

/* Action Group */
.sw-action-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sw-spacing-sm);
  margin-top: var(--sw-spacing);
}

/* Generate Section */
.sw-generate-section {
  text-align: center;
  padding: var(--sw-spacing-xl);
}

/* Output Styles */
.sw-output-content {
  min-height: 200px;
  border: 1px solid var(--sw-border);
  border-radius: var(--sw-radius);
  background: var(--sw-bg-secondary);
}

.sw-output-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--sw-spacing-xl);
  color: var(--sw-text-secondary);
  text-align: center;
}

.sw-placeholder-icon {
  font-size: 3rem;
  margin-bottom: var(--sw-spacing);
  opacity: 0.5;
}

.sw-placeholder-help {
  font-size: 0.85rem;
  opacity: 0.7;
}

.sw-output-result {
  padding: var(--sw-spacing-lg);
  white-space: pre-wrap;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9rem;
  line-height: 1.6;
}

.sw-output-stats {
  display: flex;
  justify-content: space-around;
  padding: var(--sw-spacing);
  background: var(--sw-bg-tertiary);
  border-top: 1px solid var(--sw-border);
  font-size: 0.8rem;
}

.sw-stat-item {
  text-align: center;
}

.sw-stat-label {
  color: var(--sw-text-secondary);
}

.sw-stat-value {
  font-weight: 600;
  color: var(--sw-text-primary);
}

/* Loading Styles */
.sw-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.sw-loading-content {
  text-align: center;
  padding: var(--sw-spacing-xl);
}

.sw-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--sw-border-light);
  border-top: 4px solid var(--sw-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--sw-spacing);
}

.sw-loading-help {
  font-size: 0.85rem;
  color: var(--sw-text-secondary);
  margin-top: var(--sw-spacing-xs);
}

/* Notification Styles */
.sw-notification-container {
  position: fixed;
  top: var(--sw-spacing);
  right: var(--sw-spacing);
  z-index: 1100;
}

.sw-notification {
  background: var(--sw-bg-primary);
  border: 1px solid var(--sw-border);
  border-radius: var(--sw-radius);
  box-shadow: var(--sw-shadow-lg);
  padding: var(--sw-spacing);
  margin-bottom: var(--sw-spacing-sm);
  max-width: 350px;
  animation: slideIn 0.3s ease-out;
}

.sw-notification.success {
  border-left: 4px solid var(--sw-success);
}

.sw-notification.error {
  border-left: 4px solid var(--sw-danger);
}

.sw-notification.warning {
  border-left: 4px solid var(--sw-warning);
}

/* Utility Classes */
.hidden {
  display: none !important;
}

.text-center {
  text-align: center;
}

.text-muted {
  color: var(--sw-text-secondary);
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .sw-content {
    padding: var(--sw-spacing);
  }
  
  .sw-form-row {
    grid-template-columns: 1fr;
  }
  
  .sw-checkbox-group {
    flex-direction: column;
    gap: var(--sw-spacing-sm);
  }
  
  .sw-header {
    padding: var(--sw-spacing);
  }
  
  .sw-title {
    font-size: 1.25rem;
  }
}
`;
}