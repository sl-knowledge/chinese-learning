// Auto-refresh functionality for development
function setupDevMode() {
    if (window.location.hostname === 'localhost') {
        const ws = new WebSocket('ws://localhost:8082');
        
        ws.onmessage = event => {
            if (event.data === 'refresh') window.location.reload();
        };

        ws.onclose = () => setTimeout(setupDevMode, 1000);
        ws.onerror = () => setTimeout(setupDevMode, 1000);
    }
}

// Character learning functionality
class CharacterLearning {
    constructor() {
        this.setupEventListeners();
        this.loadQuizData();
        this.setupVoiceSelection();
    }

    setupVoiceSelection() {
        // Create and populate voice selector
        const voiceSelect = document.getElementById('voice-select');
        if (!voiceSelect) return;

        // Update voices when they are available
        speechSynthesis.addEventListener('voiceschanged', () => {
            this.updateVoiceList(voiceSelect);
        });

        // Initial population
        this.updateVoiceList(voiceSelect);
    }

    updateVoiceList(voiceSelect) {
        // Get all available voices
        const voices = speechSynthesis.getVoices();
        
        // Clear existing options
        voiceSelect.innerHTML = '';
        
        // Filter for Chinese voices and sort them
        const chineseVoices = voices.filter(voice => 
            voice.lang.includes('zh') || voice.lang.includes('cmn')
        ).sort((a, b) => {
            // Put Microsoft voices first
            const aIsMicrosoft = a.name.toLowerCase().includes('microsoft');
            const bIsMicrosoft = b.name.toLowerCase().includes('microsoft');
            if (aIsMicrosoft && !bIsMicrosoft) return -1;
            if (!aIsMicrosoft && bIsMicrosoft) return 1;
            return a.name.localeCompare(b.name);
        });

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

    speakText(text) {
        if (!text) {
            console.log('No text to speak');
            return;
        }

        console.log('Attempting to speak:', text);
        const voiceSelect = document.getElementById('voice-select');
        const voices = speechSynthesis.getVoices();
        const selectedVoice = voices.find(voice => voice.name === voiceSelect.value);
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            console.log('Using voice:', selectedVoice.name);
        } else {
            console.log('No voice selected, using default');
        }
        
        utterance.rate = 0.8;
        utterance.pitch = 1;
        
        // Add event listeners for debugging
        utterance.onstart = () => console.log('Speech started');
        utterance.onend = () => console.log('Speech ended');
        utterance.onerror = (e) => console.log('Speech error:', e);
        
        speechSynthesis.speak(utterance);
    }

    setupEventListeners() {
        // Toggle examples
        document.querySelectorAll('.usage-card').forEach(card => {
            card.addEventListener('click', () => {
                const example = card.querySelector('.example');
                const translation = card.querySelector('.translation');
                
                if (example.classList.contains('hidden')) {
                    // First click: Show Chinese text
                    example.classList.remove('hidden');
                    example.classList.add('fade-in');
                    // Make sure translation stays hidden
                    if (translation) translation.classList.add('hidden');
                } else if (translation && translation.classList.contains('hidden')) {
                    // Second click: Show translation
                    translation.classList.remove('hidden');
                    translation.classList.add('fade-in');
                } else {
                    // Third click: Hide everything
                    example.classList.add('hidden');
                    if (translation) translation.classList.add('hidden');
                }
            });
        });

        // Fix speech button functionality
        document.querySelectorAll('.chinese-text').forEach(chineseText => {
            // Remove existing button if any
            const existingButton = chineseText.querySelector('.speak-button');
            if (existingButton) {
                existingButton.remove();
            }

            // Add new button with better icon
            const speakButton = document.createElement('button');
            speakButton.className = 'speak-button';
            speakButton.innerHTML = '<i class="fas fa-volume-up"></i>'; // Font Awesome icon
            speakButton.title = 'Read aloud';
            
            // Improved event handler with better text extraction
            speakButton.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                // Get text content more reliably
                const textContent = Array.from(chineseText.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeName === 'B' || node.nodeName === 'SPAN')
                    .map(node => node.textContent)
                    .join('')
                    .trim();
                
                console.log('Speaking:', textContent); // Debug log
                
                // Cancel any ongoing speech
                speechSynthesis.cancel();
                
                // Speak with slight delay
                setTimeout(() => this.speakText(textContent), 100);
            });

            chineseText.appendChild(speakButton);
        });
    }

    loadQuizData() {
        const quizContainer = document.querySelector('.quiz');
        if (!quizContainer) return;

        const character = quizContainer.dataset.character;
        fetch(`../data/quizzes/${character}.json`)
            .then(response => response.json())
            .then(data => this.renderQuiz(data))
            .catch(err => console.log('Quiz data not available'));
    }

    renderQuiz(quizData) {
        // Implement quiz rendering logic
    }

    checkAnswer(answer, correct) {
        const result = document.getElementById('result');
        result.classList.remove('hidden');
        result.classList.add('fade-in');
        
        if (answer === correct) {
            result.innerHTML = "Correct! " + this.getExplanation(correct);
            result.style.color = 'green';
        } else {
            result.innerHTML = "Try again! Think about the usage.";
            result.style.color = 'red';
        }
    }

    getExplanation(answer) {
        // Implement explanation logic
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupDevMode();
    new CharacterLearning();
}); 