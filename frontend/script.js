const textInput = document.getElementById('textInput');
const speakBtn = document.getElementById('speakBtn');
const audioPlayer = document.getElementById('audioPlayer');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');

const API_URL = 'http://localhost:5000/speak';

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    loadingIndicator.style.display = 'none';
    audioPlayer.style.display = 'none';
}

function hideError() {
    errorMessage.style.display = 'none';
}

async function generateSpeech() {
    const text = textInput.value.trim();
    
    if (!text) {
        showError('Please enter some text to convert to speech.');
        return;
    }

    loadingIndicator.style.display = 'block';
    audioPlayer.style.display = 'none';
    hideError();
    speakBtn.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audioPlayer.src = audioUrl;
        audioPlayer.style.display = 'block';
        
        audioPlayer.play().catch(err => {
            console.warn('Autoplay prevented:', err);
        });

        audioPlayer.addEventListener('ended', () => {
            URL.revokeObjectURL(audioUrl);
        }, { once: true });

    } catch (error) {
        console.error('Error generating speech:', error);
        showError(`Failed to generate speech: ${error.message}. Make sure the Flask server is running.`);
    } finally {
        loadingIndicator.style.display = 'none';
        speakBtn.disabled = false;
    }
}

speakBtn.addEventListener('click', generateSpeech);

textInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        generateSpeech();
    }
});

