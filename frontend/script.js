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

// API URLs (relative — works locally and on Render without changes)
const TTS_API_URL = "/speak";

// ─────────────────────────────────────────────
//  TEXT-TO-SPEECH
// ─────────────────────────────────────────────
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
  if (!text) { showError("Please enter some text to convert to speech."); return; }

  loadingIndicator.style.display = "block";
  audioPlayer.style.display = "none";
  hideError();
  speakBtn.disabled = true;

  try {
    const response = await fetch(TTS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(err.error || `Server error: ${response.status}`);
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioUrl;
    audioPlayer.style.display = "block";
    audioPlayer.play().catch(() => {});
    audioPlayer.addEventListener("ended", () => URL.revokeObjectURL(audioUrl), { once: true });
  } catch (error) {
    showError(`Failed to generate speech: ${error.message}`);
  } finally {
    loadingIndicator.style.display = "none";
    speakBtn.disabled = false;
  }
}

speakBtn.addEventListener("click", generateSpeech);
textInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") generateSpeech();
});

// ─────────────────────────────────────────────
//  SPEECH-TO-TEXT  — Web Speech API (real-time)
//  Primary: browser-native (works deployed, truly real-time)
//  Falls back to backend Whisper if not supported
// ─────────────────────────────────────────────

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isRecognizing = false;
let finalTranscript = "";

function startWebSpeech() {
  recognition = new SpeechRecognition();
  recognition.continuous = true;        // keep listening until stopped
  recognition.interimResults = true;    // show words as they come in
  recognition.lang = "hi-IN";           // Hindi + English (Hinglish) — best for mixed speech

  recognition.onstart = () => {
    isRecognizing = true;
    finalTranscript = "";
    transcriptionText.value = "🎙️ Listening... speak now";
    recordBtn.classList.add("recording");
    recordIcon.textContent = "⏹";
    recordText.textContent = "Stop Recording";
    recordingIndicator.style.display = "flex";
    hideError();
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }
    // Show final text + dim interim text
    transcriptionText.value = finalTranscript + interimTranscript;
  };

  recognition.onerror = (event) => {
    console.warn("Web Speech API error:", event.error);
    if (event.error === "not-allowed") {
      showError("Microphone permission denied. Please allow microphone access.");
    } else if (event.error === "no-speech") {
      transcriptionText.value = finalTranscript || "No speech detected. Try again.";
    } else {
      showError(`Speech recognition error: ${event.error}`);
    }
    stopRecognition();
  };

  recognition.onend = () => {
    stopRecognition();
    if (finalTranscript.trim()) {
      transcriptionText.value = finalTranscript.trim();
    }
  };

  recognition.start();
}

function stopRecognition() {
  isRecognizing = false;
  recordBtn.classList.remove("recording");
  recordIcon.textContent = "⏺";
  recordText.textContent = "Start Recording";
  recordingIndicator.style.display = "none";
}

function stopWebSpeech() {
  if (recognition) {
    recognition.stop();
  }
  stopRecognition();
}

// ─────────── Fallback: MediaRecorder → backend Whisper ───────────
// Used only if Web Speech API is NOT available (e.g. Firefox)
let mediaRecorder;
let audioChunks = [];

async function startWhisperRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", (e) => audioChunks.push(e.data));
    mediaRecorder.addEventListener("stop", async () => {
      transcriptionText.value = "Transcribing with Whisper... please wait (~10s)";
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        const response = await fetch("/transcribe", { method: "POST", body: formData });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        transcriptionText.value = data.text + (data.language ? `\n\n[Detected: ${data.language}]` : "");
      } catch (err) {
        transcriptionText.value = "Error: transcription failed.";
        showError(`Whisper transcription failed: ${err.message}`);
      }
    });

    mediaRecorder.start();
    isRecognizing = true;
    recordBtn.classList.add("recording");
    recordIcon.textContent = "⏹";
    recordText.textContent = "Stop Recording";
    recordingIndicator.style.display = "flex";
    transcriptionText.value = "🎙️ Recording... click Stop when done";
    hideError();
  } catch (err) {
    showError("Could not access microphone: " + err.message);
  }
}

function stopWhisperRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((t) => t.stop());
  }
  stopRecognition();
  transcriptionText.value = "Transcribing... please wait.";
}

// ─────────── Unified button handler ───────────
recordBtn.addEventListener("click", () => {
  if (isRecognizing) {
    // Stop whatever is running
    if (SpeechRecognition) {
      stopWebSpeech();
    } else {
      stopWhisperRecording();
    }
  } else {
    if (SpeechRecognition) {
      // PRIMARY: Web Speech API — real-time, works on deployed app
      startWebSpeech();
    } else {
      // FALLBACK: backend Whisper (local only, for Firefox / non-Chrome)
      showError("ℹ️ Real-time speech recognition is not supported in this browser. Using Whisper fallback...");
      startWhisperRecording();
    }
  }
});
