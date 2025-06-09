console.log('scripts.js starting to execute');

// Fullscreen mode
function toggleFullscreen() {
    const gameWrapper = document.querySelector('.game-wrapper');
    if (!document.fullscreenElement) {
        gameWrapper.requestFullscreen().catch(err => {
            console.log(`Fullscreen error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Share functionality
function shareGame() {
    if (navigator.share) {
        navigator.share({
            title: 'Count Masters: Stickman Games',
            text: 'Come play this awesome stickman game!',
            url: window.location.href
        }).catch(err => {
            console.log('Share failed:', err);
        });
    } else {
        alert('Link copied successfully! Share it with your friends!');
    }
}

// Bookmark functionality
function toggleFavorite() {
    if (window.sidebar && window.sidebar.addPanel) { // Firefox < 23
        window.sidebar.addPanel(document.title, window.location.href, '');
    } else if (window.external && ('AddFavorite' in window.external)) { // IE
        window.external.AddFavorite(window.location.href, document.title);
    } else { // Modern browsers
        alert('Press ' + (navigator.userAgent.toLowerCase().indexOf('mac') != -1 ? 'Command/Cmd' : 'CTRL') + ' + D to bookmark this page.');
    }
}

// Comment functionality
function submitComment() {
    const textarea = document.querySelector('.comment-form textarea');
    const commentText = textarea.value.trim();
    
    if (commentText) {
        const commentList = document.querySelector('.comment-list');
        const newComment = document.createElement('div');
        newComment.className = 'comment-item';
        newComment.innerHTML = `
            <div class="comment-header">
                <span class="comment-user">Guest</span>
                <span class="comment-time">${new Date().toLocaleString()}</span>
            </div>
            <div class="comment-content">${commentText}</div>
        `;
        commentList.insertBefore(newComment, commentList.firstChild);
        textarea.value = '';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Fullscreen button
    document.querySelector('.fullscreen-btn').addEventListener('click', toggleFullscreen);

    // Share button
    document.querySelector('.share-btn').addEventListener('click', shareGame);

    // Bookmark button
    document.querySelector('.favorite-btn').addEventListener('click', toggleFavorite);

    // Comment submission
    document.querySelector('.submit-comment').addEventListener('click', submitComment);
});

// Add keyboard control tips
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    const validKeys = ['arrowleft', 'arrowright', 'space'];
    
    if (validKeys.includes(key)) {
        const keyElement = document.querySelector(`[data-key="${key}"]`);
        if (keyElement) {
            keyElement.classList.add('pressed');
            setTimeout(() => keyElement.classList.remove('pressed'), 200);
        }
    }
});

// Language handling
let currentLang = 'en';
let translations = {};

// Get user's browser language
function getBrowserLanguage() {
    const lang = navigator.language || navigator.userLanguage;
    console.log('Browser language detected:', lang);
    const shortLang = lang.split('-')[0];
    const supportedLanguages = ['en', 'zh-CN', 'hi', 'es', 'fr', 'ar', 'bn', 'pt', 'ur', 'id', 'ko'];
    
    if (lang === 'zh-CN' || lang === 'zh-TW' || lang === 'zh') {
        return 'zh-CN';
    }
    
    return supportedLanguages.includes(shortLang) ? shortLang : 'en';
}

// Load language file
async function loadLanguage(lang) {
    console.log('Attempting to load language:', lang);
    try {
        // First try relative path
        let response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            // If relative path fails, try absolute path
            console.log('Relative path failed, trying absolute path');
            const fullPath = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + `/locales/${lang}.json`;
            console.log('Trying full path:', fullPath);
            response = await fetch(fullPath);
        }
        
        if (!response.ok) throw new Error(`Language file not found: ${response.status}`);
        
        const text = await response.text();
        console.log('Received response text:', text.substring(0, 100) + '...');
        translations = JSON.parse(text);
        
        currentLang = lang;
        console.log('Successfully loaded language:', lang);
        console.log('Translations:', translations);
        
        updatePageLanguage();
        localStorage.setItem('preferred-language', lang);
        
        // Update language button text
        const currentLangElement = document.querySelector('.current-lang');
        const selectedLang = document.querySelector(`[data-lang="${lang}"]`);
        if (currentLangElement && selectedLang) {
            currentLangElement.textContent = selectedLang.textContent;
        }

        // Handle RTL languages
        document.documentElement.setAttribute('dir', ['ar', 'ur'].includes(lang) ? 'rtl' : 'ltr');
    } catch (error) {
        console.error('Error loading language:', error);
        console.error('Error details:', {
            lang,
            error: error.message,
            stack: error.stack
        });
        if (lang !== 'en') {
            console.log('Falling back to English');
            loadLanguage('en');
        }
    }
}

// Update page content with selected language
function updatePageLanguage() {
    console.log('Updating page content with translations');
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        console.log('Processing element:', element.tagName, 'with key:', key);
        
        const keys = key.split('.');
        let value = translations;
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                console.log('Translation not found for key:', key);
                value = null;
                break;
            }
        }

        if (value) {
            console.log('Setting translation for', key, 'to:', value);
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = value;
            } else {
                element.textContent = value;
            }
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing language system');
    
    const languageBtn = document.getElementById('languageBtn');
    const languageDropdown = document.getElementById('languageDropdown');

    if (!languageBtn || !languageDropdown) {
        console.error('Language selector elements not found!');
        return;
    }

    // Toggle dropdown
    languageBtn.addEventListener('click', (e) => {
        console.log('Language button clicked');
        e.stopPropagation();
        languageBtn.classList.toggle('active');
        languageDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!languageBtn.contains(e.target)) {
            languageBtn.classList.remove('active');
            languageDropdown.classList.remove('show');
        }
    });

    // Language selection
    languageDropdown.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const lang = e.target.getAttribute('data-lang');
            console.log('Language selected:', lang);
            loadLanguage(lang);
            languageBtn.classList.remove('active');
            languageDropdown.classList.remove('show');
        }
    });

    // Initialize language
    const savedLang = localStorage.getItem('preferred-language');
    const browserLang = getBrowserLanguage();
    console.log('Saved language:', savedLang);
    console.log('Browser language:', browserLang);
    loadLanguage(savedLang || browserLang);
});

console.log('scripts.js finished loading'); 