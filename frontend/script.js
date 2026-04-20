const textInput = document.getElementById("textInput");
const speakBtn = document.getElementById("speakBtn");
const audioPlayer = document.getElementById("audioPlayer");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorMessage = document.getElementById("errorMessage");

// STT Elements
const recordBtn = document.getElementById("recordBtn");
const recordIcon = document.getElementById("recordIcon");
const recordText = document.getElementById("recordText");
const recordingIndicator = document.getElementById("recordingIndicator");
const transcriptionText = document.getElementById("transcriptionText");

// Change to local server to avoid Render CORS errors
// Using relative URLs so this works both locally AND when deployed (no code change needed!)
const TTS_API_URL = "/speak";
const STT_API_URL = "/transcribe";


function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  loadingIndicator.style.display = "none";
  audioPlayer.style.display = "none";
}

function hideError() {
  errorMessage.style.display = "none";
}

async function generateSpeech() {
  const text = textInput.value.trim();

  if (!text) {
    showError("Please enter some text to convert to speech.");
    return;
  }

  loadingIndicator.style.display = "block";
  audioPlayer.style.display = "none";
  hideError();
  speakBtn.disabled = true;

  try {
    const response = await fetch(TTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error occurred" }));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    audioPlayer.src = audioUrl;
    audioPlayer.style.display = "block";

    audioPlayer.play().catch((err) => {
      console.warn("Autoplay prevented:", err);
    });

    audioPlayer.addEventListener(
      "ended",
      () => {
        URL.revokeObjectURL(audioUrl);
      },
      { once: true }
    );
  } catch (error) {
    console.error("Error generating speech:", error);
    showError(
      `Failed to generate speech: ${error.message}. Make sure the Flask server is running.`
    );
  } finally {
    loadingIndicator.style.display = "none";
    speakBtn.disabled = false;
  }
}

speakBtn.addEventListener("click", generateSpeech);

textInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    generateSpeech();
  }
});

// --- Speech to Text (Real-time Transcription) Logic ---

let mediaRecorder;
let audioChunks = [];
let isRecording = false;

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", (event) => {
      audioChunks.push(event.data);
    });

    mediaRecorder.addEventListener("stop", async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      await sendAudioForTranscription(audioBlob);
    });

    mediaRecorder.start();
    isRecording = true;
    
    // Update UI
    recordBtn.classList.add("recording");
    recordIcon.textContent = "⏹";
    recordText.textContent = "Stop Recording";
    recordingIndicator.style.display = "flex";
    transcriptionText.value = "Listening...";
    hideError();

  } catch (err) {
    console.error("Error accessing microphone:", err);
    showError("Could not access microphone. Please ensure you have granted permission.");
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    isRecording = false;
    
    // Stop all tracks to release the microphone
    mediaRecorder.stream.getTracks().forEach(track => track.stop());

    // Update UI
    recordBtn.classList.remove("recording");
    recordIcon.textContent = "⏺";
    recordText.textContent = "Start Recording";
    recordingIndicator.style.display = "none";
    transcriptionText.value = "Transcribing... Please wait.";
  }
}

async function sendAudioForTranscription(audioBlob) {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");

    const response = await fetch(STT_API_URL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    transcriptionText.value = data.text;
    
    if (data.language) {
      transcriptionText.value += `\n\n[Detected Language: ${data.language}]`;
    }
  } catch (error) {
    console.error("Error transcribing audio:", error);
    transcriptionText.value = "Error: Failed to transcribe.";
    showError(`Failed to transcribe: ${error.message}. Is the backend running?`);
  }
}

recordBtn.addEventListener("click", () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});
