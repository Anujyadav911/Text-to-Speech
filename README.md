# 🎤 Multilingual Real-time Speech-to-Text & Text-to-Speech Web App

A full-stack web application that fulfills the assignment requirement of a **real-time, multilingual Speech-to-Text (STT)** service with an additional **Text-to-Speech (TTS)** feature. Supports mixed **Hindi + English** audio transcription and text conversion using **100% open-source, self-hosted AI models**.

---

## 📌 Assignment Requirement Fulfilled

> *"Create a web application 'Speech to Text' service where the user would speak a sentence in real-time which could be multilingual in nature (e.g., Hindi & English) & the system would transcribe those words in real-time. Use any self deployed open source service for this speech to text service."*

✅ **Speech-to-Text** → Uses **OpenAI Whisper** (`faster-whisper`) — fully open-source, self-deployed on your local machine, no API key, no internet required.

✅ **Multilingual** → Whisper natively supports Hindi, English, and Hinglish (mixed).

✅ **Text-to-Speech (Bonus)** → Uses **gTTS** (Google TTS) as primary, falls back to **pyttsx3** (fully offline).

---

## 🤔 Are There Any API Limits? Is It Free?

This is one of the most important things to understand about this project.

### Speech-to-Text (Whisper via `faster-whisper`) — ✅ 100% FREE & UNLIMITED

| Property | Detail |
|---|---|
| **License** | MIT (Open-Source — completely free) |
| **Runs on** | Your own computer (locally) |
| **Internet required?** | Only once, to download the model file (~75MB) |
| **API Key required?** | ❌ No |
| **Rate Limits** | ❌ None. You can transcribe as much as you want |
| **Cost** | ₹0 — Free forever |

**Why?** Because `faster-whisper` is simply a Python library that runs entirely on your CPU. It's not a cloud service. Once the model file is downloaded and cached on your disk, it works 100% offline. There is no server, no account, and no usage meter.

### Text-to-Speech (gTTS) — ⚠️ Free but Has Soft Rate Limits

| Property | Detail |
|---|---|
| **License** | MIT (Open-Source wrapper) |
| **Runs on** | Calls Google Translate's TTS servers |
| **Internet required?** | ✅ Yes, always |
| **API Key required?** | ❌ No |
| **Rate Limits** | ⚠️ Soft limits (may block if too many requests in a short time) |
| **Cost** | Free for normal use |

**Why did the Render deployment fail?** Because gTTS sends requests to Google's servers. When deployed on Render's free tier (shared IP), many apps using gTTS from the same IP can cause Google to temporarily block requests — causing a `500 Internal Server Error`. Running it locally avoids this completely.

### Text-to-Speech (pyttsx3) — ✅ 100% FREE, OFFLINE & UNLIMITED (Fallback)

| Property | Detail |
|---|---|
| **Runs on** | Your computer using built-in Windows/macOS/Linux voices |
| **Internet required?** | ❌ No |
| **Rate Limits** | ❌ None |
| **Hindi Support** | ⚠️ Depends on system voices installed |

---

## 🏗️ Project Architecture

```
Text-to-Speech/
├── frontend/                  # UI Layer (pure HTML/CSS/JS)
│   ├── index.html             # Main app page with both STT and TTS sections
│   ├── style.css              # Styling with animations and glassmorphism
│   └── script.js              # MediaRecorder API for mic capture + Fetch API
│
├── backend/                   # Server Layer (Python + Flask)
│   ├── app.py                 # Flask REST API with STT and TTS endpoints
│   └── requirements.txt       # All Python dependencies
│
├── venv/                      # Python virtual environment (do NOT commit to git)
├── runtime.txt                # Python version for deployment
└── README.md                  # This file
```

### How Data Flows

```
[User's Microphone]
        ↓  (MediaRecorder API captures audio as .webm blob)
[Browser (script.js)]
        ↓  (HTTP POST /transcribe with audio file as FormData)
[Flask Backend (app.py)]
        ↓  (Saves audio file temporarily, passes to Whisper)
[faster-whisper model]  ← runs on your CPU, no internet
        ↓  (Returns transcribed text + detected language)
[Flask Backend]
        ↓  (Returns JSON response)
[Browser]
        ↓  (Displays transcribed text in the textarea)
[User sees the text]
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript | UI, microphone access, audio recording |
| Backend | Python 3.10, Flask | REST API server |
| STT Engine | `faster-whisper` (Whisper `tiny` model) | Speech-to-Text, multilingual |
| TTS Engine | `gTTS` (primary) / `pyttsx3` (fallback) | Text-to-Speech |
| CORS | `flask-cors` | Allow browser to call backend API |

---

## ⚙️ Setup & Installation

### Prerequisites

- **Python 3.8+** installed
- **VS Code** with the **Live Server** extension
- A working **microphone**
- Internet connection (only for the first run, to download the Whisper model)

---

### Step 1: Clone / Open the Project

Open a terminal (PowerShell or Command Prompt) and navigate to your project:

```bash
cd C:\Users\YourName\Desktop\Text-to-Speech
```

---

### Step 2: Create & Activate Virtual Environment

```bash
# Create the virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# You will see (venv) prefix in your terminal — this is correct!
```

---

### Step 3: Install All Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This installs:
- `Flask` — the web server
- `flask-cors` — so the browser can talk to Flask
- `faster-whisper` — the open-source Speech-to-Text AI model
- `gTTS` — Google Text-to-Speech
- `pydub` — audio processing
- `pyttsx3` — offline fallback TTS

**⚠️ This step may take 2-5 minutes** as it downloads several packages including `faster-whisper`.

---

### Step 4: Start the Backend Server

Make sure you are inside the `backend/` folder with the virtual environment active:

```bash
# From the project root
cd backend
..\venv\Scripts\activate   # activate venv
python app.py              # start Flask server
```

You should see this output:

```
Initializing TTS engine...
✓ gTTS initialized successfully (excellent Hindi support)
Initializing STT engine (faster-whisper)...
✓ faster-whisper initialized successfully

==================================================
Multilingual Speech-to-Text & Text-to-Speech Server
==================================================
STT Engine: faster-whisper
TTS Engine: gTTS (excellent Hindi support)
Server running on http://localhost:5000
==================================================
```

> **📌 IMPORTANT:** Keep this terminal open! The Flask server must stay running while you use the app.

> **📌 First-time Whisper download:** On the very first request to `/transcribe`, `faster-whisper` will automatically download the Whisper `tiny` model (~75MB) from HuggingFace and cache it on your disk. This happens only once.

---

### Step 5: Start the Frontend

1. Open the project folder in **VS Code**
2. Open `frontend/index.html`
3. Click **"Go Live"** at the bottom-right of VS Code (Live Server extension)
4. Your browser will open: `http://127.0.0.1:5500/frontend/index.html`

> **Why Live Server and not just double-clicking the file?**
> The `MediaRecorder` microphone API requires the page to be served over `http://` or `https://`. Opening a file directly with `file://` will block microphone access.

---

## 🎯 How to Use the App

### Feature 1: Real-time Speech-to-Text (Main Assignment Feature)

1. Open the app at `http://127.0.0.1:5500/frontend/index.html`
2. In the **"Real-time Transcription"** card, click the red **"⏺ Start Recording"** button
3. Grant microphone permission if the browser asks
4. **Speak clearly** — you can use English, Hindi, or mix both:
   - *"Hello, mera naam Anuj hai. I am testing this application."*
   - *"आज का मौसम बहुत अच्छा है, isn't it?"*
5. Click **"⏹ Stop Recording"** when done
6. Wait a few seconds — your transcribed text will appear in the box!
7. The detected language will also be shown (e.g., `[Detected Language: hi]`)

### Feature 2: Text-to-Speech (Bonus Feature)

1. Scroll down to the **"Text-to-Speech"** card
2. Type any text (English, Hindi, or mixed) in the text box
   - Example: `Hello! नमस्ते दोस्त, how are you? आप कैसे हैं?`
3. Click the **"🔊 Speak"** button
4. Wait for the audio player to appear and the speech to play

---

## 🔌 API Endpoints Reference

### `POST /transcribe` — Speech to Text
Receives an audio file and returns the transcribed text.

**Request:** `multipart/form-data` with a field named `audio` containing the audio file.

**Response:**
```json
{
  "text": "Hello, mera naam Anuj hai.",
  "language": "hi",
  "language_probability": 0.92
}
```

---

### `POST /speak` — Text to Speech
Receives text and returns an audio file.

**Request Body:**
```json
{
  "text": "Hello नमस्ते",
  "speed": 1.0,
  "pitch": 1.0
}
```

**Response:** Audio file (`.mp3` or `.wav`)

---

### `GET /health` — Health Check
Check if the server and its engines are running correctly.

**Response:**
```json
{
  "status": "healthy",
  "engine": "gTTS",
  "multilingual_support": "full",
  "hindi_support": "yes"
}
```

---

## 🐛 Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `STT engine not initialized` | `faster-whisper` failed to load | Restart `python app.py`. Check it prints `✓ faster-whisper initialized` |
| `Failed to fetch` / CORS error | Backend is not running | Make sure `python app.py` is running in your terminal |
| `Could not access microphone` | Browser blocked mic | Open browser settings → Site Settings → Allow microphone for `localhost` |
| `Transcribing... Please wait` (stuck forever) | Whisper model is still downloading | Wait for the first download (~75MB) to complete |
| `500 Internal Server Error` on TTS | gTTS rate limit hit | Wait 1-2 minutes and try again, or use pyttsx3 (offline) |
| Port 5000 already in use | Another app is using port 5000 | Change port in `app.py` last line: `app.run(port=5001)` and update `script.js` URLs to `5001` |

---

## 🧠 How Whisper Handles Hindi + English

OpenAI's Whisper model was trained on 680,000 hours of multilingual audio from the internet, including a massive amount of Indian English, Hindi, and Hinglish content.

- It **auto-detects the language** — you don't need to tell it you're speaking Hindi.
- It handles **code-switching** (mixing languages mid-sentence) well.
- The `tiny` model (75MB) is fast. The `base` model (140MB) is slightly more accurate. You can change this in `app.py`.

---

## 🚀 Summary

| What | How |
|---|---|
| Speech → Text | `faster-whisper` (Whisper `tiny`) on CPU, local, offline |
| Text → Speech | `gTTS` (Google TTS, needs internet) → fallback `pyttsx3` (offline) |
| API Limits | **STT: NONE** (runs locally). TTS: Soft limit on gTTS (free) |
| Cost | **₹0 — Completely Free** |
| Internet needed | Only for: 1st model download & gTTS calls |

---

*Built for the Real-time Multilingual Transcription Assignment — Using Open-Source AI (Whisper) + Flask + Vanilla JS*
