class CharacterLearning {
    constructor() {
        this.uiLang = 'en';
        this.translationLang = localStorage.getItem('translationLanguage') || 'en';
        this.translations = {};
        this.characterData = {};
        
        // 添加初始化状态跟踪
        this.initialized = false;
        console.log('Starting initialization...');
        
        // 确保DOM加载完成后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        if (this.initialized) {
            console.log('Already initialized');
            return;
        }

        try {
            // 1. 先加载字符数据
            console.log('Loading character data first...');
            await this.loadCharacterData();
            
            // 2. 更新内容
            console.log('Updating content with character data...');
            this.updatePageContent();
            
            // 3. 然后加载UI翻译
            console.log('Loading UI translations...');
            await this.loadTranslations();
            
            // 4. 设置UI和更新UI翻译
            this.setupEventListeners();
            this.setupVoiceSelection();
            this.setupLanguageSelector();
            this.updatePageLanguage();
            
            this.initialized = true;
            console.log('Initialization complete');
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async loadTranslations() {
        try {
            console.log('Loading translations...');
            // Use relative path for both local and production
            const basePath = window.location.hostname === 'localhost' ? '.' : '/chinese-learning';
            const response = await fetch(`${basePath}/data/i18n/translations.json`);
            this.translations = await response.json();
            console.log('Translations loaded:', this.translations);
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    async loadCharacterData() {
        try {
            console.log('Loading character data...');
            // Use relative path for both local and production
            const basePath = window.location.hostname === 'localhost' ? '.' : '/chinese-learning';
            const response = await fetch(`${basePath}/data/characters/zhe.json`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            this.characterData = JSON.parse(text);
            console.log('Character data loaded:', this.characterData);
        } catch (error) {
            console.error('Error loading character data:', error);
        }
    }

    setupVoiceSelection() {
        console.log('Setting up voice selection...');
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect) {
            console.error('Voice select element not found');
            return;
        }

        // Update voices when they are available
        speechSynthesis.addEventListener('voiceschanged', () => {
            this.updateVoiceList(voiceSelect);
        });

        // Initial population
        this.updateVoiceList(voiceSelect);
    }

    updateVoiceList(voiceSelect) {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices);
        
        // Clear existing options
        voiceSelect.innerHTML = '';
        
        // Filter for Chinese voices and sort them
        const chineseVoices = voices.filter(voice => 
            voice.lang.includes('zh') || voice.lang.includes('cmn')
        ).sort((a, b) => {
            const aIsMicrosoft = a.name.toLowerCase().includes('microsoft');
            const bIsMicrosoft = b.name.toLowerCase().includes('microsoft');
            if (aIsMicrosoft && !bIsMicrosoft) return -1;
            if (!aIsMicrosoft && bIsMicrosoft) return 1;
            return a.name.localeCompare(b.name);
        });

        console.log('Filtered Chinese voices:', chineseVoices);

        // Add voices to selector
        chineseVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
            
            // Select Microsoft voice by default if available
            if (voice.name.toLowerCase().includes('microsoft')) {
                voiceSelect.value = voice.name;
            }
        });
    }

    setupLanguageSelector() {
        const langSelect = document.getElementById('translation-select');
        if (!langSelect) {
            console.error('Language select element not found');
            return;
        }

        // 移除旧的事件监听器
        langSelect.replaceWith(langSelect.cloneNode(true));
        const newLangSelect = document.getElementById('translation-select');
        
        // 设置当前语言
        newLangSelect.value = this.translationLang;
        
        // 添加新的事件监听器
        newLangSelect.addEventListener('change', (e) => {
            this.translationLang = e.target.value;
            localStorage.setItem('translationLanguage', this.translationLang);
            this.updatePageLanguage();
            this.updatePageContent();
            console.log('Language changed to:', this.translationLang);
        });

        // 设置区域按钮
        this.setupRegionButtons(newLangSelect);
    }

    setupRegionButtons(langSelect) {
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                document.querySelectorAll('.region-btn').forEach(b => 
                    b.classList.remove('active'));
                btn.classList.add('active');

                // Show/hide language options
                const range = btn.dataset.region;
                Array.from(langSelect.options).slice(1).forEach(option => {
                    const languageName = option.text.split('-')[0].trim();
                    const firstLetter = languageName.charAt(0).toUpperCase();
                    option.style.display = this.isInRange(firstLetter, range) ? '' : 'none';
                });
            });
        });

        // Set initial state
        const defaultBtn = document.querySelector('[data-region="a-h"]');
        if (defaultBtn) defaultBtn.click();
    }

    isInRange(letter, range) {
        switch(range) {
            case 'a-h': return letter >= 'A' && letter <= 'H';
            case 'i-p': return letter >= 'I' && letter <= 'P';
            case 'q-z': return letter >= 'Q' && letter <= 'Z';
            default: return false;
        }
    }

    verifyLanguageFormat() {
        const langSelect = document.getElementById('translation-select');
        if (!langSelect) return;

        const options = Array.from(langSelect.options);
        
        // Skip English (Default)
        options.slice(1).forEach(option => {
            const text = option.text;
            
            // Verify format: "English - Native"
            if (!text.includes(' - ')) {
                console.error(`Invalid format for ${text}. Should be "English - Native"`);
            }

            // Verify alphabetical order
            const englishName = text.split(' - ')[0];
            const firstLetter = englishName.charAt(0).toUpperCase();

            // Verify range grouping
            const range = option.parentElement?.label;
            if (range) {
                if (firstLetter >= 'A' && firstLetter <= 'F' && !option.style.display) {
                    console.error(`${englishName} should be visible in A-F range`);
                }
                // ... similar checks for other ranges
            }
        });
    }

    setupEventListeners() {
        // Toggle examples
        document.querySelectorAll('.usage-card').forEach(card => {
            card.addEventListener('click', () => {
                const example = card.querySelector('.example');
                const translation = card.querySelector('.translation');
                
                if (example.classList.contains('hidden')) {
                    example.classList.remove('hidden');
                    example.classList.add('fade-in');
                    if (translation) translation.classList.add('hidden');
                } else if (translation && translation.classList.contains('hidden')) {
                    translation.classList.remove('hidden');
                    translation.classList.add('fade-in');
                } else {
                    example.classList.add('hidden');
                    if (translation) translation.classList.add('hidden');
                }
            });
        });

        // Add speak buttons
        document.querySelectorAll('.chinese-text').forEach(chineseText => {
            if (!chineseText.querySelector('.speak-button')) {
                const speakButton = document.createElement('button');
                speakButton.className = 'speak-button';
                speakButton.innerHTML = '<i class="fas fa-volume-up"></i>';
                speakButton.title = 'Read aloud';
                
                speakButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Simplified text extraction
                    const textContent = chineseText.textContent.replace(/\s+/g, '');
                    console.log('Extracted text to speak:', textContent);
                    
                    if (textContent) {
                        this.speakText(textContent);
                    }
                });

                chineseText.appendChild(speakButton);
            }
        });
    }

    speakText(text) {
        if (!text) {
            console.error('No text to speak');
            return;
        }

        console.log('Speaking text:', text);
        const voiceSelect = document.getElementById('voice-select');
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.name === voiceSelect.value);
        
        speechSynthesis.cancel(); // Cancel any ongoing speech
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('Using voice:', selectedVoice.name);
        } else {
            console.log('No voice selected, using default');
        }
        
        utterance.rate = 0.8;
        utterance.pitch = 1;
        
        speechSynthesis.speak(utterance);
    }

    updatePageLanguage() {
        console.log('Updating page language to:', this.translationLang);
        document.querySelectorAll('[data-i18n]').forEach(element => {
            if (!element.closest('.usage-card')) {  // 不更新用法卡片内的内容
                const key = element.getAttribute('data-i18n');
                if (this.translations[this.translationLang] && this.translations[this.translationLang][key]) {
                    element.textContent = this.translations[this.translationLang][key];
                } else {
                    console.warn(`Translation missing for key: ${key} in language: ${this.translationLang}`);
                    element.textContent = this.translations.en[key] || key;
                }
            }
        });
    }

    updatePageContent() {
        console.log('Updating page content with character data...');
        if (!this.characterData) {
            console.error('No character data available');
            return;
        }

        // 只更新用法部分，不更新UI元素
        this.characterData.usages.forEach((usage, index) => {
            const card = document.querySelector(`[data-usage-id="${index + 1}"]`);
            if (card) {
                const title = card.querySelector('h3');
                const meaning = card.querySelector('.meaning');
                
                // 只在元素存在且内容为空或显示key时更新
                if (title && usage.title) {
                    const currentTitle = title.textContent;
                    // 检查是否需要更新（是否显示的是key而不是翻译）
                    if (currentTitle.includes('examples.') || currentTitle.trim() === '') {
                        const translatedTitle = usage.title[this.translationLang] || usage.title.en;
                        title.textContent = `${translatedTitle} ${usage.chinese_title ? `(${usage.chinese_title})` : ''}`;
                    }
                }
                
                if (meaning && usage.meaning) {
                    const currentMeaning = meaning.textContent;
                    // 检查是否需要更新
                    if (currentMeaning.includes('examples.') || currentMeaning.trim() === '') {
                        const translatedMeaning = usage.meaning[this.translationLang] || usage.meaning.en;
                        meaning.textContent = translatedMeaning;
                    }
                }
            }
        });

        // 更新其他特定于字符的内容
        if (this.characterData.pronunciation_note) {
            const pronNote = document.querySelector('.pronunciation-note small');
            if (pronNote) {
                pronNote.textContent = this.characterData.pronunciation_note[this.translationLang] || 
                                     this.characterData.pronunciation_note.en;
            }
        }

        // Quiz部分的更新保持不变
        // ...其他代码保持不变...
    }

    checkAnswer(answer) {
        console.log('Checking answer with language:', this.translationLang);
        const result = document.getElementById('result');
        result.classList.remove('hidden');
        
        const quiz = this.characterData.quiz;
        if (answer === quiz.correct) {
            // 确保使用当前选择的语言
            const explanation = quiz.explanation[this.translationLang] || quiz.explanation.en;
            console.log('Using explanation for language:', this.translationLang);
            result.innerHTML = explanation;
            result.style.color = 'green';
        } else {
            // 确保使用当前选择的语言
            const tryAgainMsg = this.translations[this.translationLang]?.tryAgain || 
                              this.translations.en.tryAgain;
            result.innerHTML = tryAgainMsg;
            result.style.color = 'red';
        }
    }
} 