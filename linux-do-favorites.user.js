// ==UserScript==
// @name         LinuxDo 收藏夹
// @namespace    https://linux.do/
// @version      1.0.2
// @description  L站的收藏夹功能，新添加展开动画，在书签页加入收藏按钮
// @author       eamooooon
// @match        https://linux.do/*
// @match        https://linux.do/t/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'linux_do_favorites';
    const FOLDERS_KEY = 'linux_do_folders';
    const THEME_KEY = 'linux_do_theme';
    const MODE_KEY = 'linux_do_mode';
    const GITHUB_TOKEN_KEY = 'linux_do_github_token';
    const GIST_ID_KEY = 'linux_do_gist_id';

    const defaultFolders = ['默认收藏'];

    const themes = {
        'orange': { name: '橙红色', color: '#e5573c' },
        'blue': { name: '蓝色', color: '#3b82f6' },
        'green': { name: '绿色', color: '#22c55e' },
        'purple': { name: '紫色', color: '#a855f7' },
        'pink': { name: '粉色', color: '#ec4899' },
        'teal': { name: '青色', color: '#14b8a6' }
    };

    function getTheme() {
        return GM_getValue(THEME_KEY, 'orange');
    }

    function saveTheme(theme) {
        GM_setValue(THEME_KEY, theme);
    }

    function getMode() {
        return GM_getValue(MODE_KEY, 'default');
    }

    function saveMode(mode) {
        GM_setValue(MODE_KEY, mode);
    }

    function getGithubToken() {
        return GM_getValue(GITHUB_TOKEN_KEY, '');
    }

    function saveGithubToken(token) {
        GM_setValue(GITHUB_TOKEN_KEY, token);
    }

    function getGistId() {
        return GM_getValue(GIST_ID_KEY, '');
    }

    function saveGistId(gistId) {
        GM_setValue(GIST_ID_KEY, gistId);
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function applyTheme(theme) {
        const themeColor = themes[theme]?.color || themes.orange.color;
        document.documentElement.style.setProperty('--ld-theme-color', themeColor);
        document.documentElement.style.setProperty('--ld-theme-bg-light', hexToRgba(themeColor, 0.1));
        document.documentElement.style.setProperty('--ld-theme-bg-dark', hexToRgba(themeColor, 0.2));
    }

    function getFolders() {
        const saved = GM_getValue(FOLDERS_KEY, null);
        let folders = saved ? JSON.parse(saved) : [...defaultFolders];
        if (!folders.includes('默认收藏')) {
            folders.unshift('默认收藏');
        }
        return folders;
    }

    function saveFolders(folders) {
        GM_setValue(FOLDERS_KEY, JSON.stringify(folders));
    }

    function getFavorites() {
        const saved = GM_getValue(STORAGE_KEY, null);
        return saved ? JSON.parse(saved) : {};
    }

    function saveFavorites(favorites) {
        GM_setValue(STORAGE_KEY, JSON.stringify(favorites));
    }

    function getTopicId() {
        const match = window.location.pathname.match(/\/t\/.*?\/(\d+)/);
        return match ? match[1] : null;
    }

    function getPostId(postElement) {
        if (!postElement) return null;
        const postId = postElement.getAttribute('data-post-id');
        const postNumber = postElement.getAttribute('data-post-number');
        return postId ? { id: postId, number: postNumber } : null;
    }

    function getTopicInfo() {
        const topicId = getTopicId();
        if (!topicId) return null;

        const titleEl = document.querySelector('.header-title .topic-link span span') ||
                        document.querySelector('#topic-title h1 .topic-link') ||
                        document.querySelector('.fancy-title') ||
                        document.querySelector('.header-title');
        const title = titleEl ? titleEl.textContent.trim() : document.title;

        const categoryEl = document.querySelector('.badge-category__name') ||
                          document.querySelector('.category-name');
        const category = categoryEl ? categoryEl.textContent.trim() : '未分类';

        const tagsEls = document.querySelectorAll('.discourse-tag.box, .tag');
        const tags = [...new Set(Array.from(tagsEls).map(t => t.textContent.trim()))];

        return {
            id: topicId,
            title: title,
            url: window.location.href.split('?')[0],
            category: category,
            tags: tags,
            addedAt: Date.now()
        };
    }

    function getPostInfo(postElement) {
        const topicId = getTopicId();
        if (!topicId || !postElement) return null;

        const postInfo = getPostId(postElement);
        if (!postInfo) return null;

        const titleEl = document.querySelector('.header-title .topic-link span span') ||
                        document.querySelector('#topic-title h1 .topic-link') ||
                        document.querySelector('.fancy-title') ||
                        document.querySelector('.header-title');
        const topicTitle = titleEl ? titleEl.textContent.trim() : document.title;

        const categoryEl = document.querySelector('.badge-category__name') ||
                          document.querySelector('.category-name');
        const category = categoryEl ? categoryEl.textContent.trim() : '未分类';

        const tagsEls = document.querySelectorAll('.discourse-tag.box, .tag');
        const tags = [...new Set(Array.from(tagsEls).map(t => t.textContent.trim()))];

        const cookedEl = postElement.querySelector('.cooked');
        const postContent = cookedEl ? cookedEl.textContent.trim().substring(0, 50) : '';

        const uniqueId = `${topicId}_${postInfo.id}`;

        let postNumber = postInfo.number;
        if (!postNumber) {
            const floorButton = postElement.querySelector('#floor-button');
            if (floorButton) {
                const floorText = floorButton.querySelector('.floor-text');
                if (floorText) {
                    postNumber = floorText.textContent.replace('#', '');
                }
            }
        }

        const isFloor1 = postNumber === '1' || postNumber === 1;

        return {
            id: uniqueId,
            topicId: topicId,
            postId: postInfo.id,
            postNumber: postNumber,
            title: isFloor1 ? topicTitle : `${topicTitle} - #${postNumber}`,
            url: isFloor1 ? window.location.pathname.split('?')[0] : `${window.location.pathname}/${postNumber}`,
            category: category,
            tags: tags,
            addedAt: Date.now(),
            isPost: true
        };
    }

    GM_addStyle(`
        .ld-fav-post-btn.btn {
            background: none !important;
            border: none !important;
            cursor: pointer !important;
            padding: 8px !important;
            color: var(--primary-high, #333) !important;
            font-size: 24px !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 4px !important;
            opacity: 0.7 !important;
            transition: opacity 0.2s !important;
        }
        .ld-fav-post-btn.btn:hover {
            opacity: 1 !important;
            color: var(--ld-theme-color, #e5573c) !important;
        }
        .ld-fav-post-btn.btn.favorited {
            color: var(--ld-theme-color, #e5573c) !important;
            opacity: 1 !important;
        }
        .ld-fav-post-btn.btn svg {
            width: 1.3em;
            height: 1.3em;
        }
        #ld-fav-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            justify-content: center;
            align-items: center;
        }
        #ld-fav-modal.show {
            display: flex;
        }
        .ld-fav-content {
            background: var(--secondary, #fff);
            color: var(--primary, #333);
            border-radius: 12px;
            width: 500px;
            max-height: 80vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .ld-fav-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--primary-low, #eee);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .ld-fav-header h3 {
            margin: 0;
            font-size: 18px;
        }
        .ld-fav-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--primary, #333);
        }
        .ld-fav-tabs {
            display: flex;
            border-bottom: 1px solid var(--primary-low, #eee);
            overflow-x: auto;
        }
        .ld-fav-tab {
            padding: 10px 16px;
            cursor: pointer;
            white-space: nowrap;
            border-bottom: 2px solid transparent;
            font-size: 14px;
            color: var(--primary-medium, #666);
        }
        .ld-fav-tab.active {
            color: var(--ld-theme-color, #e5573c);
            border-bottom-color: var(--ld-theme-color, #e5573c);
        }
        .ld-fav-tab:hover {
            background: var(--highlight-low, #f5f5f5);
        }
        .ld-fav-body {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
        }
        .ld-fav-item {
            padding: 10px 12px;
            border-radius: 8px;
            margin-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--primary-low, #f8f8f8);
        }
        .ld-fav-item:hover {
            background: var(--highlight-low, #f0f0f0);
        }
        .ld-fav-item a {
            color: var(--primary, #333);
            text-decoration: none;
            flex: 1;
            font-size: 14px;
            line-height: 1.4;
        }
        .ld-fav-item a:hover {
            color: var(--ld-theme-color, #e5573c);
        }
        .ld-fav-item-meta {
            font-size: 12px;
            color: var(--primary-medium, #888);
            margin-top: 4px;
        }
        .ld-fav-remove {
            background: none;
            border: none;
            color: var(--danger, var(--ld-theme-color, #e5573c));
            cursor: pointer;
            font-size: 16px;
            padding: 4px 8px;
            border-radius: 4px;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .ld-fav-item:hover .ld-fav-remove {
            opacity: 1;
        }
        .ld-fav-footer {
            padding: 12px 16px;
            border-top: 1px solid var(--primary-low, #eee);
            display: flex;
            gap: 8px;
        }
        .ld-fav-footer button {
            padding: 8px 16px;
            border-radius: 6px;
            border: 1px solid var(--primary-low, #ddd);
            background: var(--secondary, #fff);
            color: var(--primary, #333);
            cursor: pointer;
            font-size: 13px;
        }
        .ld-fav-footer button:hover {
            background: var(--highlight-low, #f0f0f0);
        }
        .ld-fav-empty {
            text-align: center;
            padding: 40px 20px;
            color: var(--primary-medium, #888);
        }
        .ld-fav-dialog {
            position: absolute;
            background: var(--secondary, #fff);
            padding: 0 12px;
            border-radius: 8px;
            z-index: 10001;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            min-width: 200px;
            max-height: 0;
            overflow-y: auto;
            border: 2px solid transparent;
            pointer-events: none;
            opacity: 0;
            transition: max-height 0.25s ease, padding 0.25s ease, border-color 0.25s ease, opacity 0.15s ease 0.15s;
        }
        .ld-fav-dialog.show {
            pointer-events: auto;
            opacity: 1;
            max-height: 300px;
            padding: 12px;
            border-color: var(--primary-low, #ddd);
            transition: max-height 0.25s ease, padding 0.25s ease, border-color 0.25s ease, opacity 0.15s ease;
        }
        .ld-fav-folder-item {
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--primary, #333);
            font-size: 14px;
        }
        .ld-fav-folder-item:hover {
            background: var(--highlight-low, #f0f0f0);
        }
        .ld-fav-folder-item.selected {
            background: var(--highlight-low, #e8e8e8);
            color: var(--ld-theme-color, #e5573c);
        }
        .ld-fav-new-folder {
            padding: 8px 12px;
            cursor: pointer;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--primary-medium, #888);
            font-size: 14px;
            border-top: 1px solid var(--primary-low, #eee);
            margin-top: 4px;
        }
        .ld-fav-new-folder:hover {
            background: var(--highlight-low, #f0f0f0);
            color: var(--primary, #333);
        }
        .ld-fav-dialog h4 {
            margin: 0 0 16px 0;
            font-size: 16px;
        }
        .ld-fav-dialog input, .ld-fav-dialog select {
            width: 100%;
            padding: 10px;
            border: 1px solid var(--primary-low, #ddd);
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 12px;
            background: var(--secondary, #fff);
            color: var(--primary, #333);
            box-sizing: border-box;
        }
        .ld-fav-dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }
        .ld-fav-dialog-actions button {
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 13px;
        }
        .ld-fav-btn-primary {
            background: var(--ld-theme-color, #e5573c);
            color: white;
        }
        .ld-fav-btn-secondary {
            background: var(--primary-low, #eee);
            color: var(--primary, #333);
        }
        .ld-fav-inline-btn {
            background: none;
            border: 1px dashed var(--primary-low, #ccc);
            color: var(--primary-medium, #888);
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
            margin-top: 4px;
        }
        .ld-fav-inline-btn:hover {
            border-color: var(--ld-theme-color, #e5573c);
            color: var(--ld-theme-color, #e5573c);
        }
        #ld-fav-panel {
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0);
            z-index: 10002;
            justify-content: center;
            align-items: center;
            pointer-events: none;
            opacity: 0;
            transition: background 0.3s ease, opacity 0.3s ease;
        }
        #ld-fav-panel.show {
            pointer-events: auto;
            opacity: 1;
            background: rgba(0,0,0,0.5);
        }
        #ld-fav-panel.show .ld-fav-panel-body {
            transform: scale(1) translateY(0);
            opacity: 1;
        }
        .ld-fav-panel-close {
            position: absolute;
            top: 16px;
            right: 16px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--primary-medium, #888);
            padding: 8px;
            line-height: 1;
            z-index: 1;
        }
        .ld-fav-panel-close:hover {
            color: var(--primary, #333);
        }
        .ld-fav-panel-body {
            display: flex;
            flex: 1;
            overflow: hidden;
            background: var(--secondary, #fff);
            border-radius: 12px;
            width: 80%;
            max-width: 1000px;
            height: 80vh;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            flex-direction: row;
            transform: scale(0.92) translateY(20px);
            opacity: 0;
            transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        }
        .ld-fav-panel-sidebar {
            width: 200px;
            min-width: 200px;
            border-right: 1px solid var(--primary-low, #eee);
            overflow-y: auto;
            padding: 8px 0;
            background: var(--primary-low, #f0f0f0);
        }
        .ld-fav-panel-sidebar::-webkit-scrollbar {
            width: 6px;
        }
        .ld-fav-panel-sidebar::-webkit-scrollbar-track {
            background: transparent;
        }
        .ld-fav-panel-sidebar::-webkit-scrollbar-thumb {
            background: var(--primary-low, #ccc);
            border-radius: 3px;
        }
        .ld-fav-panel-sidebar::-webkit-scrollbar-thumb:hover {
            background: var(--primary-medium, #999);
        }
        .ld-fav-panel-folder {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 16px;
            cursor: pointer;
            color: var(--primary, #333);
            font-size: 14px;
            position: relative;
        }
        .ld-fav-panel-folder:hover {
            background: var(--highlight-low, #f0f0f0);
        }
        .ld-fav-panel-folder.active {
            background: var(--secondary, #fff);
            color: var(--ld-theme-color, #e5573c);
            font-weight: 600;
        }
        .ld-fav-panel-folder-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .ld-fav-panel-folder-count {
            background: var(--primary-low, #eee);
            color: var(--primary-medium, #888);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 12px;
            margin-left: 8px;
        }
        .ld-fav-panel-folder-actions {
            display: none;
            gap: 4px;
            margin-left: 8px;
        }
        .ld-fav-panel-folder:hover .ld-fav-panel-folder-actions {
            display: flex;
        }
        .ld-fav-panel-folder-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px 4px;
            color: var(--primary-medium, #888);
            font-size: 12px;
            border-radius: 3px;
        }
        .ld-fav-panel-folder-btn:hover {
            background: var(--primary-low, #eee);
            color: var(--primary, #333);
        }
        .ld-fav-panel-folder-btn.delete:hover {
            color: var(--ld-theme-color, #e5573c);
        }
        .ld-fav-panel-folder-drag-handle {
            cursor: grab;
            color: var(--primary-medium, #888);
            margin-right: 8px;
            font-size: 12px;
        }
        .ld-fav-panel-folder.dragging {
            opacity: 0.5;
            background: var(--highlight-low, #f0f0f0);
        }
        .ld-fav-panel-folder.drag-over {
            border-top: 2px solid var(--ld-theme-color, #e5573c);
        }
        .ld-fav-panel-add-folder {
            padding: 10px 16px;
            cursor: pointer;
            color: var(--primary-medium, #888);
            font-size: 14px;
            border-top: 1px solid var(--primary-low, #eee);
            margin-top: 8px;
        }
        .ld-fav-panel-add-folder:hover {
            background: var(--highlight-low, #f0f0f0);
            color: var(--primary, #333);
        }
        .ld-fav-panel-settings {
            padding: 10px 16px;
            cursor: pointer;
            color: var(--primary-medium, #888);
            font-size: 14px;
            border-top: 1px solid var(--primary-low, #eee);
            margin-top: auto;
        }
        .ld-fav-panel-settings:hover {
            background: var(--highlight-low, #f0f0f0);
            color: var(--primary, #333);
        }
        .ld-fav-settings-panel {
            display: none;
            padding: 12px 16px;
            border-top: 1px solid var(--primary-low, #eee);
            background: var(--primary-low, #f0f0f0);
        }
        .ld-fav-settings-panel.show {
            display: block;
        }
        .ld-fav-settings-title {
            font-size: 13px;
            color: var(--primary-medium, #888);
            margin-bottom: 10px;
        }
        .ld-fav-mode-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 4px;
        }
        .ld-fav-mode-option {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: var(--primary, #333);
            cursor: pointer;
        }
        .ld-fav-mode-option input[type="radio"] {
            accent-color: var(--ld-theme-color, #e5573c);
        }
        .ld-fav-theme-options {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .ld-fav-theme-option {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid transparent;
            transition: transform 0.2s;
        }
        .ld-fav-theme-option:hover {
            transform: scale(1.1);
        }
        .ld-fav-theme-option.active {
            border-color: var(--primary, #333);
            box-shadow: 0 0 0 2px var(--secondary, #fff);
        }
        .ld-fav-settings-content {
            padding: 20px;
            max-width: 600px;
        }
        .ld-fav-settings-header {
            font-size: 20px;
            font-weight: 600;
            color: var(--primary, #333);
            margin: 0 0 24px 0;
            padding-bottom: 12px;
            border-bottom: 2px solid var(--ld-theme-color, #e5573c);
        }
        .ld-fav-settings-section {
            margin-bottom: 28px;
            padding: 16px;
            background: var(--primary-low, #f5f5f5);
            border-radius: 8px;
        }
        .ld-fav-settings-content .ld-fav-settings-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--primary, #333);
            margin-bottom: 12px;
        }
        .ld-fav-settings-desc {
            font-size: 13px;
            color: var(--primary-medium, #888);
            margin-bottom: 16px;
        }
        .ld-fav-settings-field {
            margin-bottom: 16px;
        }
        .ld-fav-settings-advanced {
            margin-top: 12px;
        }
        .ld-fav-settings-advanced summary {
            font-size: 13px;
            color: var(--primary-medium, #888);
            cursor: pointer;
            user-select: none;
        }
        .ld-fav-settings-advanced summary:hover {
            color: var(--primary, #333);
        }
        .ld-fav-settings-advanced[open] summary {
            margin-bottom: 12px;
        }
        .ld-fav-settings-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: var(--primary, #333);
            margin-bottom: 6px;
        }
        .ld-fav-settings-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--primary-low, #ddd);
            border-radius: 6px;
            font-size: 14px;
            background: var(--secondary, #fff);
            color: var(--primary, #333);
            box-sizing: border-box;
            transition: border-color 0.2s;
        }
        .ld-fav-settings-input:focus {
            outline: none;
            border-color: var(--ld-theme-color, #e5573c);
        }
        .ld-fav-settings-hint {
            font-size: 12px;
            color: var(--primary-medium, #888);
            margin-top: 6px;
        }
        .ld-fav-settings-hint a {
            color: var(--ld-theme-color, #e5573c);
            text-decoration: none;
        }
        .ld-fav-settings-hint a:hover {
            text-decoration: underline;
        }
        .ld-fav-settings-actions {
            display: flex;
            gap: 10px;
            margin-top: 16px;
        }
        .ld-fav-settings-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            background: var(--ld-theme-color, #e5573c);
            color: white;
            transition: opacity 0.2s;
        }
        .ld-fav-settings-btn:hover {
            opacity: 0.9;
        }
        .ld-fav-settings-btn.secondary {
            background: var(--primary-low, #eee);
            color: var(--primary, #333);
        }
        .ld-fav-settings-btn.secondary:hover {
            background: var(--primary-low, #ddd);
        }
        .ld-fav-settings-status {
            margin-top: 12px;
            padding: 10px;
            border-radius: 6px;
            font-size: 13px;
            display: none;
        }
        .ld-fav-settings-status.success {
            display: block;
            background: #d4edda;
            color: #155724;
        }
        .ld-fav-settings-status.error {
            display: block;
            background: #f8d7da;
            color: #721c24;
        }
        .ld-fav-settings-status.info {
            display: block;
            background: #d1ecf1;
            color: #0c5460;
        }
        .ld-fav-panel-rename-input {
            width: 100%;
            padding: 4px 8px;
            border: 1px solid var(--ld-theme-color, #e5573c);
            border-radius: 4px;
            font-size: 14px;
            background: var(--secondary, #fff);
            color: var(--primary, #333);
        }
        .ld-fav-inline-dialog {
            position: absolute;
            background: var(--secondary, #fff);
            border: 2px solid var(--primary-low, #ddd);
            border-radius: 8px;
            padding: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10002;
            min-width: 200px;
            pointer-events: none;
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
            transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .ld-fav-inline-dialog.show {
            pointer-events: auto;
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        .ld-fav-inline-dialog-title {
            font-size: 14px;
            color: var(--primary, #333);
            margin-bottom: 10px;
        }
        .ld-fav-inline-dialog-input {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--primary-low, #ddd);
            border-radius: 4px;
            font-size: 14px;
            margin-bottom: 10px;
            box-sizing: border-box;
        }
        .ld-fav-inline-dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }
        .ld-fav-inline-dialog-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        .ld-fav-inline-dialog-btn.confirm {
            background: var(--ld-theme-color, #e5573c);
            color: white;
        }
        .ld-fav-inline-dialog-btn.cancel {
            background: var(--primary-low, #eee);
            color: var(--primary, #333);
        }
        .ld-fav-panel-content {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
        }
        .ld-fav-panel-content::-webkit-scrollbar {
            width: 6px;
        }
        .ld-fav-panel-content::-webkit-scrollbar-track {
            background: transparent;
        }
        .ld-fav-panel-content::-webkit-scrollbar-thumb {
            background: var(--primary-low, #ccc);
            border-radius: 3px;
        }
        .ld-fav-panel-content::-webkit-scrollbar-thumb:hover {
            background: var(--primary-medium, #999);
        }
        .ld-fav-panel-search {
            margin-bottom: 12px;
        }
        .ld-fav-panel-search input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--primary-low, #ddd);
            border-radius: 6px;
            font-size: 14px;
            background: var(--secondary, #fff);
            color: var(--primary, #333);
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.2s;
        }
        .ld-fav-panel-search input:focus {
            border-color: var(--ld-theme-color, #e5573c);
        }
        .ld-fav-panel-search input::placeholder {
            color: var(--primary-medium, #999);
        }
        .ld-fav-panel-empty {
            text-align: center;
            padding: 40px 20px;
            color: var(--primary-medium, #888);
        }
        .ld-fav-panel-item {
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--primary-low, #f8f8f8);
            position: relative;
            gap: 12px;
        }
        .ld-fav-panel-item:hover {
            background: var(--highlight-low, #f0f0f0);
        }
        .ld-fav-panel-item-content {
            flex: 1;
            min-width: 0;
        }
        .ld-fav-panel-item-title {
            color: var(--primary, #333);
            text-decoration: none;
            font-size: 14px;
            line-height: 1.4;
            display: block;
            margin-bottom: 6px;
        }
        .ld-fav-panel-item-title:visited {
            color: var(--primary, #333);
        }
        .ld-fav-panel-item-title:hover {
            color: var(--ld-theme-color, #e5573c);
        }
        .ld-fav-panel-item-meta {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
        }
        .ld-fav-panel-item-category {
            font-size: 12px;
            color: var(--primary, #333);
            background: var(--primary-low, #eee);
            padding: 2px 8px;
            border-radius: 4px;
            border: 1px solid var(--primary-low, #ddd);
        }
        .ld-fav-panel-item-tags {
            font-size: 12px;
            color: var(--primary-medium, #888);
            background: var(--primary-low, #eee);
            padding: 2px 8px;
            border-radius: 4px;
        }
        .ld-fav-panel-item-folder {
            font-size: 12px;
            color: var(--ld-theme-color, #e5573c);
            background: var(--ld-theme-bg-light, rgba(229, 87, 60, 0.1));
            padding: 2px 8px;
            border-radius: 4px;
        }
        .ld-fav-panel-item-date {
            font-size: 12px;
            color: var(--primary-medium, #888);
        }
        .ld-fav-panel-item-remove {
            background: none;
            border: none;
            color: var(--danger, var(--ld-theme-color, #e5573c));
            cursor: pointer;
            font-size: 18px;
            padding: 4px 8px;
            border-radius: 4px;
            opacity: 0;
            transition: opacity 0.2s;
            margin-left: 8px;
        }
        .ld-fav-panel-item:hover .ld-fav-panel-item-remove {
            opacity: 1;
        }
        .ld-fav-panel-item.dragging {
            opacity: 0.5;
            background: var(--highlight-low, #f0f0f0);
        }
        .ld-fav-panel-folder.drag-over {
            background: var(--ld-theme-bg-dark, rgba(229, 87, 60, 0.2));
            border: 2px dashed var(--ld-theme-color, #e5573c);
        }
        .ld-fav-bookmark-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px 6px;
            color: var(--primary-medium, #888);
            font-size: 24px;
            line-height: 1;
            opacity: 0.6;
            transition: opacity 0.2s, color 0.2s;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            vertical-align: middle;
            height: 100%;
        }
        tr.bookmark-list-item td:last-child {
            vertical-align: middle !important;
        }
        .ld-fav-bookmark-btn:hover {
            opacity: 1;
            color: var(--ld-theme-color, #e5573c);
        }
        .ld-fav-bookmark-btn.favorited {
            color: var(--ld-theme-color, #e5573c);
            opacity: 1;
        }
    `);

    function createModal() {
        const modal = document.createElement('div');
        modal.id = 'ld-fav-modal';
        modal.innerHTML = `
            <div class="ld-fav-content">
                <div class="ld-fav-header">
                    <h3>LinuxDo 收藏夹</h3>
                    <button class="ld-fav-close" id="ld-fav-close">&times;</button>
                </div>
                <div class="ld-fav-tabs" id="ld-fav-tabs"></div>
                <div class="ld-fav-body" id="ld-fav-body"></div>
                <div class="ld-fav-footer">
                    <button id="ld-fav-add-folder">+ 新建收藏夹</button>
                    <button id="ld-fav-manage">管理收藏夹</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const addDialog = document.createElement('div');
        addDialog.id = 'ld-fav-add-dialog';
        addDialog.className = 'ld-fav-dialog';
        addDialog.innerHTML = `
            <div id="ld-fav-folder-list"></div>
            <div class="ld-fav-new-folder" id="ld-fav-new-folder-btn">+ 新建收藏夹</div>
        `;
        document.body.appendChild(addDialog);

        const newFolderDialog = document.createElement('div');
        newFolderDialog.id = 'ld-fav-new-folder-dialog';
        newFolderDialog.className = 'ld-fav-dialog';
        newFolderDialog.innerHTML = `
            <input type="text" id="ld-fav-new-folder-name" placeholder="收藏夹名称" style="width:100%;padding:8px;border:1px solid var(--primary-low,#ddd);border-radius:4px;margin-bottom:8px;font-size:14px;">
            <div style="display:flex;gap:8px;">
                <button class="ld-fav-btn-secondary" id="ld-fav-new-folder-cancel" style="flex:1;padding:6px 12px;border:1px solid var(--primary-low,#ddd);background:var(--secondary,#fff);border-radius:4px;cursor:pointer;">取消</button>
                <button class="ld-fav-btn-primary" id="ld-fav-new-folder-confirm" style="flex:1;padding:6px 12px;border:none;background:var(--ld-theme-color,#e5573c);color:white;border-radius:4px;cursor:pointer;">创建</button>
            </div>
        `;
        document.body.appendChild(newFolderDialog);

        const manageDialog = document.createElement('div');
        manageDialog.id = 'ld-fav-manage-dialog';
        manageDialog.className = 'ld-fav-dialog';
        manageDialog.innerHTML = `
            <h4>管理收藏夹</h4>
            <div id="ld-fav-manage-list"></div>
            <div class="ld-fav-dialog-actions">
                <button class="ld-fav-btn-primary" id="ld-fav-manage-close">完成</button>
            </div>
        `;
        document.body.appendChild(manageDialog);

        createFavoritesPanel();

        return modal;
    }

    let currentTab = '全部';
    let currentPanelFolder = '全部';
    let pendingFavorite = null;
    let isHoverDialog = false;

    function renderTabs() {
        const tabs = document.getElementById('ld-fav-tabs');
        const folders = getFolders();
        const allTabs = ['全部', '未分类', ...folders];

        tabs.innerHTML = allTabs.map(tab => `
            <div class="ld-fav-tab ${tab === currentTab ? 'active' : ''}" data-tab="${tab}">
                ${tab}
            </div>
        `).join('');

        tabs.querySelectorAll('.ld-fav-tab').forEach(el => {
            el.addEventListener('click', () => {
                currentTab = el.dataset.tab;
                renderTabs();
                renderFavorites();
            });
        });
    }

    function renderFavorites() {
        const body = document.getElementById('ld-fav-body');
        const favorites = getFavorites();
        const items = Object.values(favorites);

        let filtered = items;
        if (currentTab === '未分类') {
            filtered = items.filter(i => !i.folder || i.folder === '未分类');
        } else if (currentTab !== '全部') {
            filtered = items.filter(i => i.folder === currentTab);
        }

        filtered.sort((a, b) => b.addedAt - a.addedAt);

        if (filtered.length === 0) {
            body.innerHTML = `<div class="ld-fav-empty">暂无收藏</div>`;
            return;
        }

        body.innerHTML = filtered.map(item => `
            <div class="ld-fav-item">
                <div>
                    <a href="${item.url}" title="${item.title}">${item.title}</a>
                    <div class="ld-fav-item-meta">
                        ${item.folder ? `<span style="color:var(--ld-theme-color,#e5573c)">[${item.folder}]</span> ` : ''}
                        ${item.category || ''}
                        ${item.tags && item.tags.length ? ' · ' + [...new Set(item.tags)].join(', ') : ''}
                    </div>
                </div>
                <button class="ld-fav-remove" data-id="${item.id}" title="取消收藏">✕</button>
            </div>
        `).join('');

        body.querySelectorAll('.ld-fav-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const favs = getFavorites();
                delete favs[id];
                saveFavorites(favs);
                renderFavorites();
                insertPostFavButtons();
                insertBookmarkFavButtons();
            });
        });
    }

    function showModal() {
        const modal = document.getElementById('ld-fav-modal');
        modal.classList.add('show');
        renderTabs();
        renderFavorites();
    }

    function hideModal() {
        document.getElementById('ld-fav-modal').classList.remove('show');
    }

    function showAddDialog(topicInfo, referenceElement) {
        pendingFavorite = topicInfo;
        isHoverDialog = false;
        const dialog = document.getElementById('ld-fav-add-dialog');
        const btn = referenceElement;
        const folderList = document.getElementById('ld-fav-folder-list');
        let folders = getFolders();
        const mode = getMode();

        let defaultFolder = '默认收藏';
        if (mode === 'auto' && topicInfo.category) {
            const matchFolder = folders.find(f =>
                f.includes(topicInfo.category) || topicInfo.category.includes(f)
            );
            if (matchFolder) {
                defaultFolder = matchFolder;
            } else {
                folders.push(topicInfo.category);
                saveFolders(folders);
                defaultFolder = topicInfo.category;
            }
        }

        folderList.innerHTML = folders.map(f => `
            <div class="ld-fav-folder-item ${f === defaultFolder ? 'selected' : ''}" data-folder="${f}">
                <span>${f}</span>
            </div>
        `).join('');

        folderList.querySelectorAll('.ld-fav-folder-item').forEach(item => {
            item.addEventListener('click', () => {
                const folder = item.dataset.folder;
                const { _triggerBtn, ...cleanInfo } = topicInfo;
                const favorites = getFavorites();
                favorites[cleanInfo.id] = {
                    ...cleanInfo,
                    folder: folder
                };
                saveFavorites(favorites);
                if (_triggerBtn) updateBookmarkBtnState(_triggerBtn, cleanInfo.topicId || cleanInfo.id.split('_')[0]);
                pendingFavorite = null;
                hideAddDialog();
                insertPostFavButtons();
                insertBookmarkFavButtons();
            });
        });

        document.getElementById('ld-fav-new-folder-btn').addEventListener('click', () => {
            hideAddDialog(true);
            showNewFolderDialog();
        });

        if (btn) {
            const rect = btn.getBoundingClientRect();
            dialog.style.position = 'fixed';
            dialog.style.top = (rect.bottom + 5) + 'px';
            dialog.style.right = (window.innerWidth - rect.right) + 'px';
            dialog.style.left = 'auto';
        }

        dialog.classList.add('show');
    }

    function hideAddDialog(skipAutoSave) {
        const dialog = document.getElementById('ld-fav-add-dialog');
        if (!skipAutoSave && !isHoverDialog && dialog.classList.contains('show') && pendingFavorite) {
            const mode = getMode();
            let folder = '默认收藏';
            if (mode === 'auto' && pendingFavorite.category) {
                const folders = getFolders();
                const matchFolder = folders.find(f =>
                    f.includes(pendingFavorite.category) || pendingFavorite.category.includes(f)
                );
                if (matchFolder) {
                    folder = matchFolder;
                } else {
                    folders.push(pendingFavorite.category);
                    saveFolders(folders);
                    folder = pendingFavorite.category;
                }
            }

            const triggerBtn = pendingFavorite._triggerBtn;
            const tid = pendingFavorite.topicId || pendingFavorite.id.split('_')[0];
            const { _triggerBtn, ...cleanFav } = pendingFavorite;
            const favorites = getFavorites();
            favorites[cleanFav.id] = {
                ...cleanFav,
                folder: folder
            };
            saveFavorites(favorites);
            insertPostFavButtons();
            insertBookmarkFavButtons();
            if (triggerBtn) updateBookmarkBtnState(triggerBtn, tid);
            pendingFavorite = null;
        }

        dialog.classList.remove('show');
        if (!skipAutoSave) pendingFavorite = null;
        isHoverDialog = false;
    }

    function showChangeFolderDialog(favItem, referenceElement) {
        isHoverDialog = true;
        const dialog = document.getElementById('ld-fav-add-dialog');
        const btn = referenceElement;
        const folderList = document.getElementById('ld-fav-folder-list');
        const folders = getFolders();

        folderList.innerHTML = folders.map(f => `
            <div class="ld-fav-folder-item ${f === favItem.folder ? 'selected' : ''}" data-folder="${f}">
                <span>${f}</span>
            </div>
        `).join('');

        folderList.querySelectorAll('.ld-fav-folder-item').forEach(item => {
            item.addEventListener('click', () => {
                const folder = item.dataset.folder;
                const favorites = getFavorites();
                if (favorites[favItem.id]) {
                    favorites[favItem.id].folder = folder;
                    saveFavorites(favorites);
                    hideAddDialog(true);
                    insertPostFavButtons();
                    insertBookmarkFavButtons();
                }
            });
        });

        if (btn) {
            const rect = btn.getBoundingClientRect();
            dialog.style.position = 'fixed';
            dialog.style.top = (rect.bottom + 5) + 'px';
            dialog.style.right = (window.innerWidth - rect.right) + 'px';
            dialog.style.left = 'auto';
        }

        dialog.classList.add('show');
    }

    function showNewFolderDialog() {
        const dialog = document.getElementById('ld-fav-new-folder-dialog');
        const input = document.getElementById('ld-fav-new-folder-name');
        input.value = '';

        dialog.style.position = 'fixed';
        dialog.style.top = '50%';
        dialog.style.left = '50%';
        dialog.style.transform = 'translate(-50%, -50%)';

        dialog.classList.add('show');
        input.focus();

        input.onkeydown = (e) => {
            if (e.key === 'Enter') { e.preventDefault(); createNewFolder(); }
            if (e.key === 'Escape') { e.preventDefault(); hideNewFolderDialog(); }
        };
    }

    function hideNewFolderDialog() {
        document.getElementById('ld-fav-new-folder-dialog').classList.remove('show');
    }

    function createNewFolder() {
        const input = document.getElementById('ld-fav-new-folder-name');
        const name = input.value.trim();
        if (!name) return;

        const folders = getFolders();
        if (folders.includes(name)) {
            alert('收藏夹已存在');
            return;
        }

        folders.push(name);
        saveFolders(folders);
        hideNewFolderDialog();

        if (pendingFavorite) {
            const triggerBtn = pendingFavorite._triggerBtn;
            const tid = pendingFavorite.topicId || pendingFavorite.id.split('_')[0];
            const { _triggerBtn, ...cleanFav } = pendingFavorite;
            const favorites = getFavorites();
            favorites[cleanFav.id] = {
                ...cleanFav,
                folder: name
            };
            saveFavorites(favorites);
            if (triggerBtn) updateBookmarkBtnState(triggerBtn, tid);
            pendingFavorite = null;
            insertPostFavButtons();
            insertBookmarkFavButtons();
        }

        renderTabs();
    }

    function showManageDialog() {
        const dialog = document.getElementById('ld-fav-manage-dialog');
        const list = document.getElementById('ld-fav-manage-list');
        const folders = getFolders();
        const favorites = getFavorites();

        list.innerHTML = folders.map(f => {
            const count = Object.values(favorites).filter(i => i.folder === f).length;
            const isDefault = defaultFolders.includes(f);
            return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid var(--primary-low,#eee)">
                    <span>${f} <small style="color:var(--primary-medium,#888)">(${count})</small></span>
                    ${isDefault ? '' : `<button class="ld-fav-remove" data-folder="${f}">删除</button>`}
                </div>
            `;
        }).join('');

        list.querySelectorAll('.ld-fav-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const folder = e.target.dataset.folder;
                if (confirm(`确定删除收藏夹"${folder}"？其中的帖子将移到未分类。`)) {
                    const allFolders = getFolders().filter(f => f !== folder);
                    saveFolders(allFolders);

                    const favs = getFavorites();
                    Object.values(favs).forEach(fav => {
                        if (fav.folder === folder) fav.folder = '';
                    });
                    saveFavorites(favs);

                    showManageDialog();
                    renderTabs();
                }
            });
        });

        dialog.classList.add('show');
    }

    function hideManageDialog() {
        document.getElementById('ld-fav-manage-dialog').classList.remove('show');
    }

    function showConfirmDialog(title, onConfirm) {
        const dialog = document.getElementById('ld-fav-confirm-dialog');
        const titleEl = document.getElementById('ld-fav-confirm-title');
        const cancelBtn = document.getElementById('ld-fav-confirm-cancel');
        const okBtn = document.getElementById('ld-fav-confirm-ok');
        
        titleEl.textContent = title;
        dialog.classList.add('show');
        
        const hideDialog = () => {
            dialog.classList.remove('show');
            cancelBtn.removeEventListener('click', hideDialog);
            okBtn.removeEventListener('click', handleConfirm);
        };
        
        const handleConfirm = () => {
            hideDialog();
            onConfirm();
        };
        
        cancelBtn.addEventListener('click', hideDialog);
        okBtn.addEventListener('click', handleConfirm);
    }

    function showInputDialog(title, defaultValue, onConfirm) {
        const dialog = document.getElementById('ld-fav-input-dialog');
        const titleEl = document.getElementById('ld-fav-input-title');
        const input = document.getElementById('ld-fav-input-field');
        const cancelBtn = document.getElementById('ld-fav-input-cancel');
        const okBtn = document.getElementById('ld-fav-input-ok');
        
        titleEl.textContent = title;
        input.value = defaultValue || '';
        dialog.classList.add('show');
        input.focus();
        input.select();
        
        const hideDialog = () => {
            dialog.classList.remove('show');
            cancelBtn.removeEventListener('click', hideDialog);
            okBtn.removeEventListener('click', handleConfirm);
            input.removeEventListener('keydown', handleKeydown);
        };
        
        const handleConfirm = () => {
            const value = input.value.trim();
            if (value) {
                hideDialog();
                onConfirm(value);
            }
        };
        
        const handleKeydown = (e) => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') hideDialog();
        };
        
        cancelBtn.addEventListener('click', hideDialog);
        okBtn.addEventListener('click', handleConfirm);
        input.addEventListener('keydown', handleKeydown);
    }

    function createFavoritesPanel() {
        const panel = document.createElement('div');
        panel.id = 'ld-fav-panel';
        panel.innerHTML = `
            <button class="ld-fav-panel-close" id="ld-fav-panel-close">&times;</button>
            <div class="ld-fav-panel-body">
                <div class="ld-fav-panel-sidebar" id="ld-fav-panel-sidebar"></div>
                <div class="ld-fav-panel-content" id="ld-fav-panel-content"></div>
            </div>
            <div class="ld-fav-inline-dialog" id="ld-fav-confirm-dialog">
                <div class="ld-fav-inline-dialog-title" id="ld-fav-confirm-title"></div>
                <div class="ld-fav-inline-dialog-actions">
                    <button class="ld-fav-inline-dialog-btn cancel" id="ld-fav-confirm-cancel">取消</button>
                    <button class="ld-fav-inline-dialog-btn confirm" id="ld-fav-confirm-ok">确定</button>
                </div>
            </div>
            <div class="ld-fav-inline-dialog" id="ld-fav-input-dialog">
                <div class="ld-fav-inline-dialog-title" id="ld-fav-input-title"></div>
                <input class="ld-fav-inline-dialog-input" id="ld-fav-input-field" type="text">
                <div class="ld-fav-inline-dialog-actions">
                    <button class="ld-fav-inline-dialog-btn cancel" id="ld-fav-input-cancel">取消</button>
                    <button class="ld-fav-inline-dialog-btn confirm" id="ld-fav-input-ok">确定</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('ld-fav-panel-close').addEventListener('click', hideFavoritesPanel);
        panel.addEventListener('click', (e) => {
            if (e.target === panel) hideFavoritesPanel();
        });

        return panel;
    }

    function renderPanelSidebar(activeFolder) {
        const sidebar = document.getElementById('ld-fav-panel-sidebar');
        const folders = getFolders();
        const favorites = getFavorites();

        const allCount = Object.keys(favorites).length;
        const selected = activeFolder || currentPanelFolder || '全部';

        let html = `
            <div class="ld-fav-panel-folder ${selected === '全部' ? 'active' : ''}" data-folder="全部" draggable="false">
                <span class="ld-fav-panel-folder-name">全部</span>
                <span class="ld-fav-panel-folder-count">${allCount}</span>
            </div>
        `;

        folders.forEach((folder) => {
            const count = Object.values(favorites).filter(f => f.folder === folder).length;
            const isDefault = defaultFolders.includes(folder);
            html += `
                <div class="ld-fav-panel-folder ${folder === selected ? 'active' : ''}" data-folder="${folder}" draggable="true">
                    <span class="ld-fav-panel-folder-drag-handle">⠿</span>
                    <span class="ld-fav-panel-folder-name">${folder}</span>
                    <span class="ld-fav-panel-folder-count">${count}</span>
                    <div class="ld-fav-panel-folder-actions">
                        <button class="ld-fav-panel-folder-btn rename" data-folder="${folder}" title="重命名">&#9998;</button>
                        ${!isDefault ? `<button class="ld-fav-panel-folder-btn delete" data-folder="${folder}" title="删除">&times;</button>` : ''}
                    </div>
                </div>
            `;
        });

        html += `
            <div class="ld-fav-panel-add-folder" id="ld-fav-panel-add-folder">+ 新建收藏夹</div>
            <div class="ld-fav-panel-settings" id="ld-fav-panel-settings">⚙ 设置</div>
        `;

        sidebar.innerHTML = html;

        sidebar.querySelectorAll('.ld-fav-panel-folder').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.ld-fav-panel-folder-btn')) return;
                sidebar.querySelectorAll('.ld-fav-panel-folder').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentPanelFolder = item.dataset.folder;
                const content = document.getElementById('ld-fav-panel-content');
                content.innerHTML = '';
                renderPanelContent(currentPanelFolder, '');
            });
        });

        const folderItems = sidebar.querySelectorAll('.ld-fav-panel-folder[draggable="true"]');
        let draggedItem = null;

        folderItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedItem = null;
                folderItems.forEach(i => i.classList.remove('drag-over'));
                
                const newOrder = Array.from(sidebar.querySelectorAll('.ld-fav-panel-folder[draggable="true"]'))
                    .map(i => i.dataset.folder);
                saveFolders(newOrder);
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.classList.add('drag-over');
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                
                const favId = e.dataTransfer.getData('text/plain');
                if (favId) {
                    const favorites = getFavorites();
                    if (favorites[favId]) {
                        favorites[favId].folder = item.dataset.folder;
                        saveFavorites(favorites);
                        const activeFolder = currentPanelFolder || '全部';
                        renderPanelSidebar(activeFolder);
                        renderPanelContent(activeFolder);
                    }
                    return;
                }
                
                if (draggedItem && draggedItem !== item) {
                    const allItems = Array.from(sidebar.querySelectorAll('.ld-fav-panel-folder[draggable="true"]'));
                    const draggedIndex = allItems.indexOf(draggedItem);
                    const targetIndex = allItems.indexOf(item);
                    
                    if (draggedIndex < targetIndex) {
                        item.after(draggedItem);
                    } else {
                        item.before(draggedItem);
                    }
                }
            });
        });

        sidebar.querySelectorAll('.ld-fav-panel-folder-btn.rename').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folder = btn.dataset.folder;
                const folderItem = btn.closest('.ld-fav-panel-folder');
                const nameSpan = folderItem.querySelector('.ld-fav-panel-folder-name');
                
                const input = document.createElement('input');
                input.className = 'ld-fav-panel-rename-input';
                input.value = folder;
                nameSpan.replaceWith(input);
                input.focus();
                input.select();
                
                const saveRename = () => {
                    const newName = input.value.trim();
                    if (newName && newName !== folder) {
                        const folders = getFolders();
                        const index = folders.indexOf(folder);
                        if (index !== -1) {
                            folders[index] = newName;
                            saveFolders(folders);

                            const favs = getFavorites();
                            Object.values(favs).forEach(fav => {
                                if (fav.folder === folder) fav.folder = newName;
                            });
                            saveFavorites(favs);
                            if (currentPanelFolder === folder) currentPanelFolder = newName;
                        }
                    }
                    renderPanelSidebar(currentPanelFolder);
                    renderPanelContent(currentPanelFolder || '全部');
                };

                input.addEventListener('blur', saveRename);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveRename();
                    if (e.key === 'Escape') renderPanelSidebar(currentPanelFolder);
                });
            });
        });

        sidebar.querySelectorAll('.ld-fav-panel-folder-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const folder = btn.dataset.folder;
                const folderItem = btn.closest('.ld-fav-panel-folder');
                const rect = folderItem.getBoundingClientRect();
                
                const dialog = document.getElementById('ld-fav-confirm-dialog');
                dialog.style.top = (rect.bottom + 5) + 'px';
                dialog.style.left = rect.left + 'px';
                
                showConfirmDialog(`确定删除收藏夹"${folder}"？`, () => {
                    const folders = getFolders().filter(f => f !== folder);
                    saveFolders(folders);

                    const favs = getFavorites();
                    Object.values(favs).forEach(fav => {
                        if (fav.folder === folder) fav.folder = '默认收藏';
                    });
                    saveFavorites(favs);

                    if (currentPanelFolder === folder) currentPanelFolder = '全部';
                    renderPanelSidebar(currentPanelFolder);
                    const content = document.getElementById('ld-fav-panel-content');
                    content.innerHTML = '';
                    renderPanelContent(currentPanelFolder, '');
                });
            });
        });

        document.getElementById('ld-fav-panel-add-folder').addEventListener('click', (e) => {
            const rect = e.target.getBoundingClientRect();
            
            const dialog = document.getElementById('ld-fav-input-dialog');
            dialog.style.top = (rect.bottom + 5) + 'px';
            dialog.style.left = rect.left + 'px';
            
            showInputDialog('请输入收藏夹名称：', '', (name) => {
                const folders = getFolders();
                if (folders.includes(name)) {
                    alert('收藏夹已存在');
                    return;
                }
                folders.push(name);
                saveFolders(folders);
                renderPanelSidebar(currentPanelFolder);
            });
        });

        const settingsBtn = document.getElementById('ld-fav-panel-settings');

        settingsBtn.addEventListener('click', () => {
            sidebar.querySelectorAll('.ld-fav-panel-folder').forEach(i => i.classList.remove('active'));
            renderSettingsContent();
        });
    }

    function renderSettingsContent() {
        const content = document.getElementById('ld-fav-panel-content');
        const currentTheme = getTheme();
        const currentMode = getMode();
        const githubToken = getGithubToken();
        const gistId = getGistId();

        let html = `
            <div class="ld-fav-settings-content">
                <h2 class="ld-fav-settings-header">设置</h2>
                
                <div class="ld-fav-settings-section">
                    <div class="ld-fav-settings-title">收藏模式</div>
                    <div class="ld-fav-mode-options" id="ld-fav-mode-options">
                        <label class="ld-fav-mode-option">
                            <input type="radio" name="ld-fav-mode" value="default" ${currentMode === 'default' ? 'checked' : ''}>
                            <span>默认文件夹</span>
                        </label>
                        <label class="ld-fav-mode-option">
                            <input type="radio" name="ld-fav-mode" value="auto" ${currentMode === 'auto' ? 'checked' : ''}>
                            <span>按分类自动归类</span>
                        </label>
                    </div>
                </div>

                <div class="ld-fav-settings-section">
                    <div class="ld-fav-settings-title">主题颜色</div>
                    <div class="ld-fav-theme-options" id="ld-fav-theme-options">
                        ${Object.entries(themes).map(([key, theme]) => `
                            <div class="ld-fav-theme-option ${key === currentTheme ? 'active' : ''}" 
                                 data-theme="${key}" 
                                 style="background-color: ${theme.color}"
                                 title="${theme.name}">
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="ld-fav-settings-section">
                    <div class="ld-fav-settings-title">GitHub Gist 同步</div>
                    <div class="ld-fav-settings-desc">使用 GitHub Gist 在多设备间同步收藏数据，只需填入 Token 即可自动管理</div>
                    <div class="ld-fav-settings-field">
                        <label class="ld-fav-settings-label">Personal Access Token</label>
                        <input type="password" class="ld-fav-settings-input" id="ld-fav-github-token" 
                               placeholder="ghp_xxxxxxxxxxxx" value="${githubToken}">
                        <div class="ld-fav-settings-hint">
                            需要 gist 权限。<a href="https://github.com/settings/tokens/new?scopes=gist" target="_blank">创建 Token</a>
                        </div>
                    </div>
                    <div class="ld-fav-settings-field">
                        <details class="ld-fav-settings-advanced">
                            <summary>高级设置</summary>
                            <label class="ld-fav-settings-label">Gist ID (可选)</label>
                            <input type="text" class="ld-fav-settings-input" id="ld-fav-gist-id" 
                                   placeholder="留空将自动查找/创建" value="${gistId}">
                            <div class="ld-fav-settings-hint">正常情况无需填写，系统会自动查找你的同步 Gist</div>
                        </details>
                    </div>
                    <div class="ld-fav-settings-actions">
                        <button class="ld-fav-settings-btn" id="ld-fav-save-token">保存设置</button>
                        <button class="ld-fav-settings-btn secondary" id="ld-fav-test-sync">测试连接</button>
                    </div>
                </div>

                <div class="ld-fav-settings-section">
                    <div class="ld-fav-settings-title">数据同步</div>
                    <div class="ld-fav-settings-actions">
                        <button class="ld-fav-settings-btn" id="ld-fav-upload-data">上传到 Gist</button>
                        <button class="ld-fav-settings-btn secondary" id="ld-fav-download-data">从 Gist 下载</button>
                    </div>
                    <div class="ld-fav-settings-status" id="ld-fav-sync-status"></div>
                </div>
            </div>
        `;

        content.innerHTML = html;
        bindSettingsEvents();
    }

    function bindSettingsEvents() {
        const themeOptions = document.getElementById('ld-fav-theme-options');
        const modeOptions = document.querySelectorAll('#ld-fav-mode-options input[type="radio"]');

        themeOptions.querySelectorAll('.ld-fav-theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                saveTheme(theme);
                applyTheme(theme);
                themeOptions.querySelectorAll('.ld-fav-theme-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
            });
        });

        modeOptions.forEach(option => {
            option.addEventListener('change', () => {
                saveMode(option.value);
            });
        });

        document.getElementById('ld-fav-save-token').addEventListener('click', () => {
            const token = document.getElementById('ld-fav-github-token').value.trim();
            const gistId = document.getElementById('ld-fav-gist-id').value.trim();
            saveGithubToken(token);
            saveGistId(gistId);
            showSyncStatus('设置已保存', 'success');
        });

        document.getElementById('ld-fav-test-sync').addEventListener('click', async () => {
            const token = document.getElementById('ld-fav-github-token').value.trim();
            if (!token) {
                showSyncStatus('请先填写 Token', 'error');
                return;
            }
            showSyncStatus('测试中...', 'info');
            try {
                const response = await fetch('https://api.github.com/user', {
                    headers: { 'Authorization': `token ${token}` }
                });
                if (response.ok) {
                    const user = await response.json();
                    showSyncStatus(`连接成功: ${user.login}`, 'success');
                } else {
                    showSyncStatus('Token 无效或已过期', 'error');
                }
            } catch (e) {
                showSyncStatus('网络错误', 'error');
            }
        });

        document.getElementById('ld-fav-upload-data').addEventListener('click', uploadToGist);
        document.getElementById('ld-fav-download-data').addEventListener('click', downloadFromGist);
    }

    function showSyncStatus(message, type) {
        const status = document.getElementById('ld-fav-sync-status');
        if (status) {
            status.textContent = message;
            status.className = `ld-fav-settings-status ${type}`;
        }
    }

    const GIST_DESCRIPTION = 'LinuxDo-Favorites-Sync';

    async function findGistByDescription(token) {
        try {
            const response = await fetch('https://api.github.com/gists?per_page=100', {
                headers: { 'Authorization': `token ${token}` }
            });
            
            if (response.ok) {
                const gists = await response.json();
                const found = gists.find(g => g.description === GIST_DESCRIPTION);
                return found ? found.id : null;
            }
        } catch (e) {
            console.error('查找 Gist 失败:', e);
        }
        return null;
    }

    async function getOrCreateGistId(token) {
        let gistId = getGistId();
        if (gistId) return gistId;
        
        gistId = await findGistByDescription(token);
        if (gistId) {
            saveGistId(gistId);
            const gistIdInput = document.getElementById('ld-fav-gist-id');
            if (gistIdInput) gistIdInput.value = gistId;
        }
        return gistId;
    }

    async function uploadToGist() {
        const token = getGithubToken();
        if (!token) {
            showSyncStatus('请先填写 GitHub Token', 'error');
            return;
        }

        showSyncStatus('上传中...', 'info');

        const data = {
            favorites: getFavorites(),
            folders: getFolders(),
            theme: getTheme(),
            mode: getMode(),
            updatedAt: new Date().toISOString()
        };

        const gistId = await getOrCreateGistId(token);
        const body = {
            description: GIST_DESCRIPTION,
            public: false,
            files: {
                'linux-do-favorites.json': {
                    content: JSON.stringify(data, null, 2)
                }
            }
        };

        try {
            const url = gistId 
                ? `https://api.github.com/gists/${gistId}`
                : 'https://api.github.com/gists';
            const method = gistId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const result = await response.json();
                if (!gistId) {
                    saveGistId(result.id);
                    const gistIdInput = document.getElementById('ld-fav-gist-id');
                    if (gistIdInput) gistIdInput.value = result.id;
                }
                showSyncStatus(`上传成功! Gist ID: ${result.id}`, 'success');
            } else {
                const error = await response.json();
                showSyncStatus(`上传失败: ${error.message || '未知错误'}`, 'error');
            }
        } catch (e) {
            showSyncStatus(`网络错误: ${e.message}`, 'error');
        }
    }

    async function downloadFromGist() {
        const token = getGithubToken();

        if (!token) {
            showSyncStatus('请先填写 GitHub Token', 'error');
            return;
        }

        showSyncStatus('下载中...', 'info');

        const gistId = await getOrCreateGistId(token);

        if (!gistId) {
            showSyncStatus('未找到同步数据，请先上传', 'error');
            return;
        }

        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: { 'Authorization': `token ${token}` }
            });

            if (response.ok) {
                const gist = await response.json();
                const file = gist.files['linux-do-favorites.json'];
                
                if (file) {
                    const data = JSON.parse(file.content);
                    
                    if (data.favorites) saveFavorites(data.favorites);
                    if (data.folders) saveFolders(data.folders);
                    if (data.theme) {
                        saveTheme(data.theme);
                        applyTheme(data.theme);
                    }
                    if (data.mode) saveMode(data.mode);

                    showSyncStatus('下载成功! 数据已同步', 'success');

                    currentPanelFolder = '全部';
                    renderPanelSidebar('全部');
                    renderPanelContent('全部');
                } else {
                    showSyncStatus('Gist 中未找到数据文件', 'error');
                }
            } else {
                showSyncStatus('下载失败: Gist 不存在或无权访问', 'error');
            }
        } catch (e) {
            showSyncStatus(`网络错误: ${e.message}`, 'error');
        }
    }

    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function renderPanelContent(folder, searchQuery) {
        const content = document.getElementById('ld-fav-panel-content');
        const searchInput = document.getElementById('ld-fav-search-input');
        const currentQuery = searchQuery !== undefined ? searchQuery : (searchInput ? searchInput.value : '');
        
        const favorites = getFavorites();
        let items = Object.values(favorites);

        if (folder !== '全部') {
            items = items.filter(f => f.folder === folder);
        }

        if (currentQuery) {
            const query = currentQuery.toLowerCase();
            items = items.filter(item => 
                item.title.toLowerCase().includes(query) ||
                (item.category && item.category.toLowerCase().includes(query)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(query)))
            );
        }

        items.sort((a, b) => b.addedAt - a.addedAt);

        if (!searchInput) {
            let html = `
                <div class="ld-fav-panel-search">
                    <input type="text" id="ld-fav-search-input" placeholder="搜索收藏..." value="${currentQuery || ''}">
                </div>
                <div id="ld-fav-panel-list"></div>
            `;
            content.innerHTML = html;
            bindSearchEvent(folder);
            document.getElementById('ld-fav-search-input').focus();
        }

        const listContainer = document.getElementById('ld-fav-panel-list');
        
        if (items.length === 0) {
            listContainer.innerHTML = `<div class="ld-fav-panel-empty">${currentQuery ? '没有找到匹配的收藏' : '暂无收藏'}</div>`;
            return;
        }

        listContainer.innerHTML = items.map(item => `
            <div class="ld-fav-panel-item" draggable="true" data-id="${item.id}">
                <div class="ld-fav-panel-item-content">
                    <a href="${item.url}" class="ld-fav-panel-item-title" ${item.isPost ? 'data-post-id="' + item.postId + '"' : ''}>${item.title}</a>
                    <div class="ld-fav-panel-item-meta">
                        <span class="ld-fav-panel-item-folder">${item.folder || '默认收藏'}</span>
                        <span class="ld-fav-panel-item-category">${item.category || '未分类'}</span>
                        ${item.tags && item.tags.length > 0 ? `<span class="ld-fav-panel-item-tags">${[...new Set(item.tags)].join(', ')}</span>` : ''}
                    </div>
                </div>
                <span class="ld-fav-panel-item-date">${formatDate(item.addedAt)}</span>
                <button class="ld-fav-panel-item-remove" data-id="${item.id}" title="取消收藏">&times;</button>
            </div>
        `).join('');

        const contentItems = content.querySelectorAll('.ld-fav-panel-item');
        let draggedItem = null;

        contentItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.setData('text/plain', item.dataset.id);
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedItem = null;
            });
        });

        content.querySelectorAll('.ld-fav-panel-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = btn.dataset.id;
                const favorites = getFavorites();
                delete favorites[id];
                saveFavorites(favorites);
                const activeFolder = currentPanelFolder || '全部';
                renderPanelSidebar(activeFolder);
                renderPanelContent(activeFolder);
                insertPostFavButtons();
                insertBookmarkFavButtons();
            });
        });
        
        content.querySelectorAll('.ld-fav-panel-item-title').forEach(link => {
            link.addEventListener('click', (e) => {
                const postId = link.getAttribute('data-post-id');
                if (postId) {
                    e.preventDefault();
                    hideFavoritesPanel();
                    const postElement = document.querySelector(`article[data-post-id="${postId}"]`);
                    if (postElement) {
                        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        postElement.style.transition = 'background-color 0.3s';
                        postElement.style.backgroundColor = 'var(--ld-theme-bg-light, rgba(229, 87, 60, 0.1))';
                        setTimeout(() => {
                            postElement.style.backgroundColor = '';
                        }, 2000);
                    } else {
                        window.location.href = link.href;
                    }
                }
            });
        });
    }

    function bindSearchEvent(folder) {
        const searchInput = document.getElementById('ld-fav-search-input');
        if (!searchInput) return;
        
        let searchTimer = null;
        searchInput.addEventListener('input', () => {
            if (searchTimer) clearTimeout(searchTimer);
            searchTimer = setTimeout(() => {
                renderPanelContent(folder);
            }, 300);
        });
    }

    function showFavoritesPanel() {
        const panel = document.getElementById('ld-fav-panel');
        if (!panel) return;
        const content = document.getElementById('ld-fav-panel-content');
        content.innerHTML = '';
        currentPanelFolder = '全部';
        renderPanelSidebar('全部');
        renderPanelContent('全部', '');
        panel.classList.add('show');
    }

    function hideFavoritesPanel() {
        const panel = document.getElementById('ld-fav-panel');
        if (panel) panel.classList.remove('show');
    }

    function insertSidebarButton() {
        const existingBtn = document.getElementById('ld-fav-sidebar-btn');
        if (existingBtn) return;

        const sidebarList = document.querySelector('#sidebar-section-content-community');
        if (!sidebarList) return;

        const li = document.createElement('li');
        li.className = 'sidebar-section-link-wrapper';
        li.setAttribute('data-list-item-name', 'favorites');
        li.innerHTML = `
            <a id="ld-fav-sidebar-btn" class="sidebar-section-link sidebar-row" title="我的收藏" data-link-name="favorites" href="javascript:void(0)">
                <span class="sidebar-section-link-prefix icon">
                    <svg class="fa d-icon d-icon-star svg-icon fa-width-auto prefix-icon svg-string" width="1em" height="1em" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#star"></use></svg>
                </span>
                <span class="sidebar-section-link-content-text">
                    收藏
                </span>
            </a>
        `;

        const moreBtn = sidebarList.querySelector('.sidebar-more-section-trigger');
        if (moreBtn) {
            sidebarList.insertBefore(li, moreBtn.parentElement);
        } else {
            sidebarList.appendChild(li);
        }

        li.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            showFavoritesPanel();
        });
    }

    function insertPostFavButtons() {
        const posts = document.querySelectorAll('.topic-post, article[data-post-id]');
        
        posts.forEach(post => {
            const postId = post.getAttribute('data-post-id');
            if (!postId) return;
            
            const existingBtn = post.querySelector('.ld-fav-post-btn');
            if (existingBtn) {
                updatePostBtnState(existingBtn, postId);
                return;
            }
            
            const floorButton = post.querySelector('#floor-button');
            if (!floorButton) return;
            
            const btn = document.createElement('button');
            btn.className = 'btn no-text btn-icon btn-flat ld-fav-post-btn';
            btn.setAttribute('data-post-id', postId);
            btn.type = 'button';
            
            updatePostBtnState(btn, postId);
            
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (hoverTimer) {
                    clearTimeout(hoverTimer);
                    hoverTimer = null;
                }
                
                const topicId = getTopicId();
                const uniqueId = `${topicId}_${postId}`;
                const favorites = getFavorites();
                
                if (favorites[uniqueId]) {
                    delete favorites[uniqueId];
                    saveFavorites(favorites);
                    updatePostBtnState(btn, postId);
                    hideAddDialog(true);
                } else {
                    const postInfo = getPostInfo(post);
                    if (postInfo) {
                        showAddDialog(postInfo, btn);
                    }
                }
            });

            let hoverTimer = null;
            
            btn.addEventListener('mouseenter', () => {
                const topicId = getTopicId();
                const uniqueId = `${topicId}_${postId}`;
                const favorites = getFavorites();
                if (!favorites[uniqueId]) return;
                
                if (btn._hideTimer) {
                    clearTimeout(btn._hideTimer);
                    btn._hideTimer = null;
                }
                
                hoverTimer = setTimeout(() => {
                    showChangeFolderDialog(favorites[uniqueId], btn);
                }, 300);
            });

            btn.addEventListener('mouseleave', () => {
                if (hoverTimer) {
                    clearTimeout(hoverTimer);
                    hoverTimer = null;
                }
                
                btn._hideTimer = setTimeout(() => {
                    const dialog = document.getElementById('ld-fav-add-dialog');
                    if (!dialog.matches(':hover')) {
                        hideAddDialog(isHoverDialog);
                    }
                }, 100);
            });
            
            floorButton.parentNode.insertBefore(btn, floorButton.nextSibling);
        });
    }

    function updateBookmarkBtnState(btn, topicId) {
        const uniqueId = `${topicId}_${topicId}`;
        const favorites = getFavorites();
        if (favorites[uniqueId]) {
            btn.classList.add('favorited');
            btn.innerHTML = '★';
            btn.title = '取消收藏';
        } else {
            btn.classList.remove('favorited');
            btn.innerHTML = '☆';
            btn.title = '收藏此话题';
        }
    }

    function insertBookmarkFavButtons() {
        if (!window.location.pathname.includes('/activity/bookmarks')) return;

        const rows = document.querySelectorAll('tr.bookmark-list-item');
        rows.forEach(row => {
            const titleLink = row.querySelector('a.title');
            if (!titleLink) return;

            const topicId = titleLink.getAttribute('data-topic-id');
            if (!topicId) return;

            let btn = row.querySelector('.ld-fav-bookmark-btn');
            if (btn) {
                updateBookmarkBtnState(btn, topicId);
                return;
            }

            const categoryEl = row.querySelector('.badge-category__name');
            const category = categoryEl ? categoryEl.textContent.trim() : '';
            const tagsEls = row.querySelectorAll('.discourse-tag');
            const tags = [...new Set(Array.from(tagsEls).map(t => t.textContent.trim()))];

            btn = document.createElement('button');
            btn.className = 'ld-fav-bookmark-btn';
            btn.type = 'button';
            updateBookmarkBtnState(btn, topicId);

            const uniqueId = `${topicId}_${topicId}`;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const favs = getFavorites();
                if (favs[uniqueId]) {
                    showChangeFolderDialog(favs[uniqueId], btn);
                } else {
                    const topicInfo = {
                        id: uniqueId,
                        topicId: topicId,
                        title: titleLink.textContent.trim(),
                        url: titleLink.getAttribute('href').split('?')[0],
                        category: category,
                        tags: tags,
                        addedAt: Date.now(),
                        _triggerBtn: btn
                    };
                    showAddDialog(topicInfo, btn);
                }
            });

            let bmLeaveTimer = null;
            let bmHoverTimer = null;
            btn.addEventListener('mouseenter', () => {
                if (bmLeaveTimer) { clearTimeout(bmLeaveTimer); bmLeaveTimer = null; }
                const favs = getFavorites();
                if (!favs[uniqueId]) return;
                bmHoverTimer = setTimeout(() => {
                    showChangeFolderDialog(favs[uniqueId], btn);
                }, 300);
            });
            btn.addEventListener('mouseleave', () => {
                if (bmHoverTimer) { clearTimeout(bmHoverTimer); bmHoverTimer = null; }
                bmLeaveTimer = setTimeout(() => {
                    const dialog = document.getElementById('ld-fav-add-dialog');
                    if (!dialog.matches(':hover')) {
                        hideAddDialog(isHoverDialog);
                    }
                }, 200);
            });

            const actionsTd = row.querySelector('td:last-child');
            if (actionsTd) {
                const details = actionsTd.querySelector('details');
                if (details) {
                    actionsTd.insertBefore(btn, details);
                } else {
                    actionsTd.insertBefore(btn, actionsTd.firstChild);
                }
            }
        });
    }

    function updatePostBtnState(btn, postId) {
        const topicId = getTopicId();
        const uniqueId = `${topicId}_${postId}`;
        const favorites = getFavorites();
        
        if (favorites[uniqueId]) {
            btn.classList.add('favorited');
            btn.innerHTML = '★';
            btn.title = '取消收藏此回复';
            btn.setAttribute('aria-label', '取消收藏此回复');
        } else {
            btn.classList.remove('favorited');
            btn.innerHTML = '☆';
            btn.title = '收藏此回复';
            btn.setAttribute('aria-label', '收藏此回复');
        }
    }

    function init() {
        const modal = createModal();
        insertSidebarButton();
        insertPostFavButtons();
        insertBookmarkFavButtons();
        applyTheme(getTheme());

        document.getElementById('ld-fav-close').addEventListener('click', hideModal);
        document.getElementById('ld-fav-add-folder').addEventListener('click', showNewFolderDialog);
        document.getElementById('ld-fav-manage').addEventListener('click', showManageDialog);
        document.getElementById('ld-fav-new-folder-cancel').addEventListener('click', hideNewFolderDialog);
        document.getElementById('ld-fav-new-folder-confirm').addEventListener('click', createNewFolder);
        document.getElementById('ld-fav-manage-close').addEventListener('click', hideManageDialog);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal();
        });

        document.addEventListener('click', (e) => {
            const addDialog = document.getElementById('ld-fav-add-dialog');
            const newFolderDialog = document.getElementById('ld-fav-new-folder-dialog');
            const isPostFavBtn = e.target.closest('.ld-fav-post-btn');
            
            if (!addDialog.contains(e.target) && !newFolderDialog.contains(e.target) && !isPostFavBtn) {
                hideAddDialog();
                hideNewFolderDialog();
            }
        });

        window.addEventListener('scroll', () => {
            const addDialog = document.getElementById('ld-fav-add-dialog');
            if (addDialog.classList.contains('show')) {
                hideAddDialog();
            }
        });

        const addDialog = document.getElementById('ld-fav-add-dialog');
        addDialog.addEventListener('mouseenter', () => {
            const hoveredBtn = document.querySelector('.ld-fav-post-btn:hover, .ld-fav-bookmark-btn:hover');
            if (hoveredBtn && hoveredBtn._hideTimer) {
                clearTimeout(hoveredBtn._hideTimer);
                hoveredBtn._hideTimer = null;
            }
        });

        addDialog.addEventListener('mouseleave', () => {
            const hoveredBtn = document.querySelector('.ld-fav-post-btn:hover, .ld-fav-bookmark-btn:hover');
            if (hoveredBtn) {
                hoveredBtn._hideTimer = setTimeout(() => {
                    hideAddDialog(isHoverDialog);
                }, 200);
            } else {
                hideAddDialog(isHoverDialog);
            }
        });

        insertPostFavButtons();

        let lastUrl = '';
        const observer = new MutationObserver(() => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                setTimeout(insertSidebarButton, 500);
                setTimeout(insertPostFavButtons, 500);
                setTimeout(insertBookmarkFavButtons, 500);
            } else {
                setTimeout(insertPostFavButtons, 100);
                setTimeout(insertBookmarkFavButtons, 100);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
