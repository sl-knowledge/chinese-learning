class CharacterLearning {
    constructor() {
        this.uiLang = 'en';
        this.translationLang = localStorage.getItem('translationLanguage') || 'en';
        this.translations = {};
        this.characterData = {};
        
        // Debug logs
        console.log('Initializing CharacterLearning...');
        console.log('Initial translation language:', this.translationLang);
        
        this.init();
    }

    async init() {
        try {
            await Promise.all([
                this.loadTranslations(),
                this.loadCharacterData()
            ]);
            
            this.setupEventListeners();
            this.setupVoiceSelection();
            this.updatePageLanguage();
            this.updatePageContent();
            
            console.log('Initialization complete');
        } catch (error) {
            console.error('Initialization error:', error);
        }
    }

    async loadTranslations() {
        try {
            console.log('Loading translations...');
            const response = await fetch('./data/i18n/translations.json');
            this.translations = await response.json();
            console.log('Translations loaded:', this.translations);
        } catch (error) {
            console.error('Error loading translations:', error);
        }
    }

    async loadCharacterData() {
        try {
            console.log('Loading character data...');
            const response = await fetch('./data/characters/zhe.json');
            this.characterData = await response.json();
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
        console.log('Setting up language selector...');
        const langSelect = document.getElementById('translation-select');
        if (langSelect) {
            langSelect.value = this.translationLang;
            langSelect.addEventListener('change', (e) => {
                this.translationLang = e.target.value;
                localStorage.setItem('translationLanguage', this.translationLang);
                this.updatePageLanguage();
                this.updatePageContent();
                console.log('Language changed to:', this.translationLang);
            });
        }
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
        console.log('Updating page language...');
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.translations[this.translationLang]?.[key] || 
                              this.translations['en'][key] || 
                              key;
            element.textContent = translation;
        });
    }

    updatePageContent() {
        console.log('Updating page content with character data...');
        if (!this.characterData) {
            console.error('No character data available');
            return;
        }

        // Update pronunciation note
        const pronNote = document.querySelector('.pronunciation-note small');
        if (pronNote && this.characterData.pronunciation_note) {
            pronNote.textContent = this.characterData.pronunciation_note[this.translationLang] ||
                                 this.characterData.pronunciation_note.en;
        }

        // Update usages
        this.characterData.usages.forEach((usage, index) => {
            const card = document.querySelector(`[data-usage-id="${index + 1}"]`);
            if (card) {
                const title = card.querySelector('h3');
                const meaning = card.querySelector('.meaning');
                
                if (title && usage.title) {
                    const translatedTitle = usage.title[this.translationLang] || usage.title.en;
                    title.textContent = `${translatedTitle} ${usage.chinese_title ? `(${usage.chinese_title})` : ''}`;
                }
                
                if (meaning && usage.meaning) {
                    const translatedMeaning = usage.meaning[this.translationLang] || usage.meaning.en;
                    meaning.textContent = translatedMeaning;
                }
            }
        });
    }
} 