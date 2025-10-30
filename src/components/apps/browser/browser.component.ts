import { ChangeDetectionStrategy, Component, ElementRef, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WINDOW_CONTEXT } from '../../../injection-tokens';

declare const window: any;

@Component({
  selector: 'app-browser',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './browser.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowserComponent implements AfterViewInit {
  private elementRef = inject(ElementRef);
  private context = inject(WINDOW_CONTEXT, { optional: true });

  private browserScript = `
function initBrowser(windowElement, initialUrl) {
    console.log('Enhanced Browser Initialized');
    
    let iframe = windowElement.querySelector('#browser-iframe');
    let urlInput = windowElement.querySelector('#url-input');
    
    let backBtn = windowElement.querySelector('#browser-back');
    let forwardBtn = windowElement.querySelector('#browser-forward');
    let reloadBtn = windowElement.querySelector('#browser-reload');
    let goBtn = windowElement.querySelector('#browser-go');
    
    let homeBtn, bookmarkBtn, historyBtn, downloadBtn, menuBtn, newTabBtn, closeTabBtn, tabsContainer, progressBar, statusDiv;

    let tabs = [];
    let currentTabIndex = 0;
    let bookmarks = JSON.parse(localStorage.getItem('browser-bookmarks') || '[]');
    let history = JSON.parse(localStorage.getItem('browser-history') || '[]');
    let downloads = JSON.parse(localStorage.getItem('browser-downloads') || '[]');
    
    initBrowserUI();
    createNewTab(initialUrl || 'https://www.google.com', 'Google');

    if (backBtn) backBtn.addEventListener('click', goBack);
    if (forwardBtn) forwardBtn.addEventListener('click', goForward);
    if (reloadBtn) reloadBtn.addEventListener('click', reload);
    if (goBtn) goBtn.addEventListener('click', navigate);
    if (urlInput) {
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') navigate();
        });
    }

    function initBrowserUI() {
        const browserControls = windowElement.querySelector('#browser-controls');
        
        if (browserControls) {
            const enhancedControlsHTML = \`
                <div class="flex items-center space-x-1">
                    <button id="browser-home" class="p-2 hover:bg-gray-600 rounded" title="Home"><i class="fas fa-home"></i></button>
                    <button id="browser-bookmark" class="p-2 hover:bg-gray-600 rounded" title="Bookmark"><i class="far fa-bookmark"></i></button>
                    <button id="browser-history" class="p-2 hover:bg-gray-600 rounded" title="History"><i class="fas fa-history"></i></button>
                    <button id="browser-download" class="p-2 hover:bg-gray-600 rounded" title="Downloads"><i class="fas fa-download"></i></button>
                    <button id="browser-menu" class="p-2 hover:bg-gray-600 rounded" title="Menu"><i class="fas fa-ellipsis-v"></i></button>
                </div>
            \`;
            browserControls.insertAdjacentHTML('beforeend', enhancedControlsHTML);
            
            homeBtn = windowElement.querySelector('#browser-home');
            bookmarkBtn = windowElement.querySelector('#browser-bookmark');
            historyBtn = windowElement.querySelector('#browser-history');
            downloadBtn = windowElement.querySelector('#browser-download');
            menuBtn = windowElement.querySelector('#browser-menu');
            
            if (homeBtn) homeBtn.addEventListener('click', goHome);
            if (bookmarkBtn) bookmarkBtn.addEventListener('click', toggleBookmark);
            if (historyBtn) historyBtn.addEventListener('click', showHistory);
            if (downloadBtn) downloadBtn.addEventListener('click', showDownloads);
            if (menuBtn) menuBtn.addEventListener('click', showBrowserMenu);
        }
        
        const contentArea = windowElement.querySelector('.browser-content-area');
        if (contentArea) {
            const tabsHTML = \`
                <div class="flex items-center bg-gray-900 px-2 py-1 border-b border-gray-700">
                    <div id="browser-tabs" class="flex-1 flex overflow-x-auto"></div>
                    <button id="browser-new-tab" class="p-1 ml-1 hover:bg-gray-700 rounded" title="New Tab"><i class="fas fa-plus"></i></button>
                </div>
                <div id="browser-progress" class="h-1 bg-blue-500 w-0 transition-all duration-300"></div>
                <div id="browser-status" class="text-xs px-2 py-1 bg-gray-800 hidden"></div>
            \`;
            contentArea.insertAdjacentHTML('beforebegin', tabsHTML);
            
            tabsContainer = windowElement.querySelector('#browser-tabs');
            progressBar = windowElement.querySelector('#browser-progress');
            statusDiv = windowElement.querySelector('#browser-status');
            newTabBtn = windowElement.querySelector('#browser-new-tab');
            
            if (newTabBtn) newTabBtn.addEventListener('click', () => createNewTab('https://www.google.com', 'New Tab'));
        }
    }

    function createNewTab(url, title = 'New Tab') {
        if (!tabsContainer) return null;
        const tabId = 'tab-' + Date.now();
        const tab = { id: tabId, url: url, title: title, favicon: '🌐', history: [], historyIndex: -1 };
        tabs.push(tab);
        currentTabIndex = tabs.length - 1;

        const tabElement = document.createElement('div');
        tabElement.className = 'flex items-center bg-gray-700 px-3 py-1 mx-1 rounded-t cursor-pointer border-b-2 border-transparent';
        tabElement.innerHTML = \`
            <span class="favicon mr-2">\${tab.favicon}</span>
            <span class="title text-sm truncate max-w-24">\${tab.title}</span>
            <button class="tab-close ml-2 hover:bg-gray-600 rounded-full w-4 h-4 flex items-center justify-center text-xs"><i class="fas fa-times"></i></button>
        \`;
        tabElement.querySelector('.tab-close').addEventListener('click', (e) => { e.stopPropagation(); closeTab(tabId); });
        tabElement.addEventListener('click', () => switchTab(tabId));
        
        tabsContainer.appendChild(tabElement);
        updateTabDisplay();
        loadUrl(url);
        return tabId;
    }

    function switchTab(tabId) {
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        if (tabIndex !== -1) {
            currentTabIndex = tabIndex;
            updateTabDisplay();
            loadUrl(tabs[currentTabIndex].url);
        }
    }

    function closeTab(tabId) {
        if (tabs.length <= 1) { 
            createNewTab('https://www.google.com');
            const oldTab = tabs.find(t => t.id === tabId);
            const oldTabIndex = tabs.indexOf(oldTab);
            if(oldTabIndex > -1) {
              tabs.splice(oldTabIndex, 1);
              if (tabsContainer.children[oldTabIndex]) tabsContainer.children[oldTabIndex].remove();
            }
            return;
        }
        const tabIndex = tabs.findIndex(t => t.id === tabId);
        if (tabIndex !== -1) {
            tabs.splice(tabIndex, 1);
            if (tabsContainer.children[tabIndex]) tabsContainer.children[tabIndex].remove();
            if (currentTabIndex >= tabIndex) currentTabIndex = Math.max(0, currentTabIndex - 1);
            updateTabDisplay();
            if (tabs[currentTabIndex]) loadUrl(tabs[currentTabIndex].url);
        }
    }

    function updateTabDisplay() {
        if (!tabsContainer) return;
        const tabElements = Array.from(tabsContainer.children);
        tabElements.forEach((tabEl, index) => {
            if (index === currentTabIndex) {
                tabEl.classList.add('bg-gray-800', 'border-blue-500');
                tabEl.classList.remove('bg-gray-700', 'border-transparent');
            } else {
                tabEl.classList.add('bg-gray-700', 'border-transparent');
                tabEl.classList.remove('bg-gray-800', 'border-blue-500');
            }
        });
        updateNavigationButtons();
    }

    function loadUrl(url) {
        if (!url || !iframe) return;
        let finalUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            finalUrl = url.includes('.') && !url.includes(' ') ? 'https://' + url : 'https://www.google.com/search?q=' + encodeURIComponent(url);
        }
        
        if (finalUrl.startsWith('https://www.google.com')) {
            finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'igu=1';
        }

        if (progressBar) progressBar.style.width = '30%';
        if (statusDiv) { statusDiv.textContent = 'Loading...'; statusDiv.classList.remove('hidden'); }

        const currentTab = tabs[currentTabIndex];
        if (currentTab) {
            if (currentTab.history[currentTab.historyIndex] !== finalUrl) {
                currentTab.history = currentTab.history.slice(0, currentTab.historyIndex + 1);
                currentTab.history.push(finalUrl);
                currentTab.historyIndex = currentTab.history.length - 1;
                addToHistory(finalUrl, 'Visited page');
            }
            currentTab.url = finalUrl;
            if (urlInput) urlInput.value = finalUrl;
            iframe.src = finalUrl;
            updateNavigationButtons();
            updateSecurityIcon(finalUrl);
        }
    }

    function navigate() { if (urlInput) loadUrl(urlInput.value.trim()); }
    function goBack() {
        const tab = tabs[currentTabIndex];
        if (tab && tab.historyIndex > 0) {
            tab.historyIndex--;
            loadUrl(tab.history[tab.historyIndex]);
        }
    }
    function goForward() {
        const tab = tabs[currentTabIndex];
        if (tab && tab.historyIndex < tab.history.length - 1) {
            tab.historyIndex++;
            loadUrl(tab.history[tab.historyIndex]);
        }
    }
    function reload() { if (iframe) iframe.src = iframe.src; }
    function goHome() { loadUrl('https://www.google.com'); }

    function toggleBookmark() {
        const tab = tabs[currentTabIndex];
        if (!tab) return;
        const index = bookmarks.findIndex(bm => bm.url === tab.url);
        if (index !== -1) {
            bookmarks.splice(index, 1);
            if (bookmarkBtn) bookmarkBtn.innerHTML = '<i class="far fa-bookmark"></i>';
            showNotification('Bookmark removed');
        } else {
            bookmarks.push({ url: tab.url, title: tab.title, favicon: '⭐', date: new Date().toISOString() });
            if (bookmarkBtn) bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
            showNotification('Bookmark added');
        }
        localStorage.setItem('browser-bookmarks', JSON.stringify(bookmarks));
    }
    
    function addToHistory(url, action) {
        history.unshift({ url, title: getDomainFromUrl(url), action, timestamp: new Date().toISOString() });
        if (history.length > 100) history.length = 100;
        localStorage.setItem('browser-history', JSON.stringify(history));
    }
    function getDomainFromUrl(url) { try { return new URL(url).hostname.replace('www.', ''); } catch { return url; } }
    
    function showHistory() {
        const historyHTML = \`<div class="absolute top-12 right-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"><div class="p-3 border-b border-gray-700"><h3 class="font-bold flex justify-between items-center"><span>History</span><button onclick="clearHistory()" class="text-xs text-red-400 hover:text-red-300">Clear All</button></h3></div><div class="max-h-64 overflow-y-auto">\${history.length > 0 ? history.slice(0, 15).map(item => \`<div class="p-2 hover:bg-gray-700 cursor-pointer flex items-center border-b border-gray-700" onclick="loadHistoryUrl('\${item.url}')"><span class="mr-2">🕒</span><div class="flex-1 min-w-0"><div class="text-sm truncate">\${item.title}</div><div class="text-xs text-gray-400">\${new Date(item.timestamp).toLocaleString()}</div></div></div>\`).join('') : '<div class="p-4 text-center text-gray-400"><i class="fas fa-history text-2xl mb-2"></i><p>No browsing history</p></div>'}</div></div>\`;
        showPopup(historyHTML, historyBtn);
    }
    function clearHistory() { history = []; localStorage.setItem('browser-history', JSON.stringify(history)); showNotification('History cleared'); const p = windowElement.querySelector('.browser-popup'); if (p) p.remove(); showHistory(); }
    
    function showDownloads() {
        const downloadsHTML = \`<div class="absolute top-12 right-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"><div class="p-3 border-b border-gray-700"><h3 class="font-bold flex justify-between items-center"><span>Downloads</span><button onclick="clearDownloads()" class="text-xs text-red-400 hover:text-red-300">Clear All</button></h3></div><div class="max-h-64 overflow-y-auto">\${downloads.length > 0 ? downloads.slice(0, 10).map(d => \`<div class="p-2 hover:bg-gray-700 flex items-center border-b border-gray-700"><span class="mr-2">📥</span><div class="flex-1 min-w-0"><div class="text-sm truncate">\${d.name}</div><div class="text-xs text-gray-400">\${d.status} • \${new Date(d.timestamp).toLocaleString()}</div></div>\${d.status === 'Completed' ? '<i class="fas fa-check text-green-400 ml-2"></i>' : '<i class="fas fa-sync-alt text-yellow-400 ml-2"></i>'}</div>\`).join('') : '<div class="p-4 text-center text-gray-400"><i class="fas fa-download text-2xl mb-2"></i><p>No downloads yet</p></div>'}</div><div class="p-2 border-t border-gray-700"><button onclick="startDemoDownload()" class="w-full text-center text-blue-400 hover:text-blue-300 text-sm"><i class="fas fa-plus mr-1"></i> Demo Download</button></div></div>\`;
        showPopup(downloadsHTML, downloadBtn);
    }
    function startDemoDownload() { downloads.unshift({ name: 'demo-file-' + Date.now() + '.txt', size: '1.2 MB', status: 'Completed', timestamp: new Date().toISOString() }); localStorage.setItem('browser-downloads', JSON.stringify(downloads)); showNotification('Demo download completed'); const p = windowElement.querySelector('.browser-popup'); if (p) p.remove(); showDownloads(); }
    function clearDownloads() { downloads = []; localStorage.setItem('browser-downloads', JSON.stringify(downloads)); showNotification('Downloads cleared'); const p = windowElement.querySelector('.browser-popup'); if (p) p.remove(); showDownloads(); }
    
    function showBrowserMenu() {
        const menuHTML = \`<div class="absolute top-12 right-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"><div class="py-1"><button class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center" onclick="showBrowserSettings()"><i class="fas fa-cog mr-2"></i><span>Settings</span></button><button class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center" onclick="showBookmarksManager()"><i class="fas fa-bookmark mr-2"></i><span>Bookmarks</span></button><button class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center" onclick="showDownloads()"><i class="fas fa-download mr-2"></i><span>Downloads</span></button><button class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center" onclick="showHistory()"><i class="fas fa-history mr-2"></i><span>History</span></button><div class="border-t border-gray-700 my-1"></div><button class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center" onclick="showBrowserInfo()"><i class="fas fa-info-circle mr-2"></i><span>About</span></button><button class="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center" onclick="clearBrowserData()"><i class="fas fa-trash mr-2 text-red-400"></i><span class="text-red-400">Clear Data</span></button></div></div>\`;
        showPopup(menuHTML, menuBtn);
    }
    
    function showBrowserSettings() { showPopup('<div class="absolute top-12 right-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"><div class="p-3 border-b border-gray-700"><h3 class="font-bold">Settings</h3></div><div class="p-4 space-y-4"><div><label class="flex items-center"><input type="checkbox" checked class="mr-2">Safe Browsing</label></div><div><label class="flex items-center"><input type="checkbox" checked class="mr-2">JavaScript Enabled</label></div><div><label class="block text-sm mb-1">Search Engine</label><select class="w-full bg-gray-700 p-2 rounded"><option>Google</option><option>Bing</option></select></div></div></div>', menuBtn); }
    function showBookmarksManager() { const bmHTML = \`<div class="absolute top-12 right-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"><div class="p-3 border-b border-gray-700"><h3 class="font-bold flex justify-between items-center"><span>Bookmarks</span><button onclick="addDemoBookmark()" class="text-xs text-blue-400">Add Demo</button></h3></div><div class="max-h-64 overflow-y-auto">\${bookmarks.length > 0 ? bookmarks.map(bm => \`<div class="p-2 hover:bg-gray-700 cursor-pointer flex items-center" onclick="loadBookmarkUrl('\${bm.url}')"><span class="mr-2">\${bm.favicon}</span><div class="flex-1 min-w-0"><div class="text-sm truncate">\${bm.title}</div></div><button onclick="event.stopPropagation(); removeBookmark('\${bm.url}')" class="text-red-400 ml-2 p-1"><i class="fas fa-times"></i></button></div>\`).join('') : '<div class="p-4 text-center text-gray-400"><p>No bookmarks</p></div>'}</div></div>\`; showPopup(bmHTML, menuBtn); }
    function addDemoBookmark() { bookmarks.push({ url: 'https://github.com', title: 'GitHub', favicon: '🐙', date: new Date().toISOString() }); localStorage.setItem('browser-bookmarks', JSON.stringify(bookmarks)); showNotification('Demo bookmark added'); const p = windowElement.querySelector('.browser-popup'); if (p) p.remove(); showBookmarksManager(); }
    function removeBookmark(url) { bookmarks = bookmarks.filter(bm => bm.url !== url); localStorage.setItem('browser-bookmarks', JSON.stringify(bookmarks)); showNotification('Bookmark removed'); const p = windowElement.querySelector('.browser-popup'); if (p) p.remove(); showBookmarksManager(); }
    function showBrowserInfo() { showPopup('<div class="absolute top-12 right-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50"><div class="p-3 border-b"><h3 class="font-bold">About Browser</h3></div><div class="p-4 space-y-2"><p>Version: 🍌Banana Browser 1.0</p><p>Engine: WebKit/Chromium</p></div></div>', menuBtn); }
    function clearBrowserData() { if (confirm('Clear all browser data?')) { history = []; downloads = []; bookmarks = []; localStorage.removeItem('browser-history'); localStorage.removeItem('browser-downloads'); localStorage.removeItem('browser-bookmarks'); showNotification('All browser data cleared'); } }

    function showPopup(content, anchorElement) {
        const existing = windowElement.querySelector('.browser-popup');
        if (existing) existing.remove();
        const popup = document.createElement('div');
        popup.className = 'browser-popup';
        popup.innerHTML = content;
        windowElement.appendChild(popup);
        const closePopup = (e) => {
            if (!popup.contains(e.target) && !anchorElement.contains(e.target)) {
                popup.remove();
                document.removeEventListener('click', closePopup);
            }
        };
        setTimeout(() => document.addEventListener('click', closePopup), 100);
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'absolute bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        notification.textContent = message;
        windowElement.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    function updateNavigationButtons() {
        const tab = tabs[currentTabIndex];
        if (backBtn && tab) backBtn.disabled = !(tab.historyIndex > 0);
        if (forwardBtn && tab) forwardBtn.disabled = !(tab.historyIndex < tab.history.length - 1);
    }
    
    function updateSecurityIcon(url) {
        const securityIconEl = windowElement.querySelector('#browser-security-icon i');
        if (!securityIconEl) return;
        try {
            const urlObj = new URL(url);
            if (urlObj.protocol === 'https:') {
                securityIconEl.className = 'fas fa-lock text-green-400';
            } else {
                securityIconEl.className = 'fas fa-lock-open text-yellow-400';
            }
        } catch (e) {
            securityIconEl.className = 'fas fa-globe text-gray-400';
        }
    }

    if (iframe) {
        iframe.addEventListener('load', () => {
            if (progressBar) { progressBar.style.width = '100%'; setTimeout(() => { progressBar.style.width = '0'; if (statusDiv) statusDiv.classList.add('hidden'); }, 500); }
            try {
                const title = iframe.contentDocument?.title || getDomainFromUrl(iframe.src) || 'Untitled';
                if (tabs[currentTabIndex]) { tabs[currentTabIndex].title = title; updateTabTitles(); }
                updateSecurityIcon(iframe.src);
            } catch (e) { /* Cross-origin */ if (tabs[currentTabIndex]) { tabs[currentTabIndex].title = getDomainFromUrl(iframe.src); updateTabTitles(); } updateSecurityIcon(iframe.src); }
        });
        iframe.addEventListener('error', () => {
            if(progressBar) progressBar.style.width = '0';
            if(statusDiv) { statusDiv.textContent = 'Failed to load page'; statusDiv.classList.remove('hidden'); }
        });
    }

    function updateTabTitles() {
        if (!tabsContainer) return;
        const tabElements = Array.from(tabsContainer.children);
        tabElements.forEach((tabEl, index) => {
            const titleEl = tabEl.querySelector('.title');
            if (titleEl && tabs[index]) titleEl.textContent = tabs[index].title;
        });
    }

    window.clearHistory = clearHistory;
    window.clearDownloads = clearDownloads;
    window.startDemoDownload = startDemoDownload;
    window.showBrowserSettings = showBrowserSettings;
    window.showBookmarksManager = showBookmarksManager;
    window.showDownloads = showDownloads;
    window.showHistory = showHistory;
    window.showBrowserInfo = showBrowserInfo;
    window.clearBrowserData = clearBrowserData;
    window.addDemoBookmark = addDemoBookmark;
    window.removeBookmark = removeBookmark;
    window.loadHistoryUrl = (url) => loadUrl(url);
    window.loadBookmarkUrl = (url) => loadUrl(url);
}
if (typeof window.initBrowser !== 'function') {
  window.initBrowser = initBrowser;
}
  `;

  ngAfterViewInit() {
    if (!document.getElementById('browser-logic-script')) {
      const script = document.createElement('script');
      script.id = 'browser-logic-script';
      script.textContent = this.browserScript;
      document.body.appendChild(script);
    }

    const hostElement = this.elementRef.nativeElement;
    if (window.initBrowser && !hostElement.hasAttribute('data-browser-initialized')) {
      const initialUrl = this.context?.url;
      window.initBrowser(hostElement, initialUrl);
      hostElement.setAttribute('data-browser-initialized', 'true');
    }
  }
}
