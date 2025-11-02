# Multilingual Text-to-Speech Web Application

A complete web application that converts multilingual text (English + Hindi) into speech using Python Flask backend and HTML/CSS/JavaScript frontend.

## Features

- ✅ **Multilingual Support**: Handles English and Hindi text input (with proper Hindi pronunciation!)
- ✅ **Modern UI**: Clean, responsive interface with gradient design
- ✅ **Voice Controls**: Adjustable speech speed and pitch
- ✅ **Auto-detect Language**: Automatically detects Hindi vs English text
- ✅ **Smart TTS Engine**: Uses **gTTS** (primary, excellent Hindi) → Coqui TTS → pyttsx3 (fallback)
- ✅ **Real-time Audio**: Generates and plays speech audio instantly
- ✅ **Mixed Language Support**: Handles mixed English+Hindi text seamlessly

## Project Structure

```
Text_to_Speech/
├── frontend/
│   ├── index.html      # Main HTML interface
│   ├── style.css       # Styling
│   └── script.js       # Frontend logic
├── backend/
│   ├── app.py          # Flask server with TTS logic
│   └── requirements.txt # Python dependencies
└── README.md           # This file
```

## Prerequisites

- **Python 3.8+** (for Coqui TTS) or **Python 3.6+** (for pyttsx3 only)
- **pip** (Python package manager)
- A modern web browser (Chrome, Firefox, Edge)

## Setup Instructions

### Step 1: Set Up Python Virtual Environment

1. **Open terminal/command prompt** in the project root directory (`Text_to_Speech`)

2. **Create a virtual environment**:
   ```bash
   # Windows
   python -m venv venv

   # macOS/Linux
   python3 -m venv venv
   ```

3. **Activate the virtual environment**:
   ```bash
   # Windows
   venv\Scripts\activate

   # macOS/Linux
   source venv/bin/activate
   ```

   You should see `(venv)` prefix in your terminal prompt.

### Step 2: Install Dependencies

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install required packages**:
   ```bash
   pip install -r requirements.txt
   ```

   This will install:
   - Flask (web framework)
   - flask-cors (CORS support)
   - **gTTS** (Google Text-to-Speech - **excellent Hindi support**) 🎯
   - pydub (audio processing)
   - pyttsx3 (fallback TTS engine)

   **Important for gTTS (MP3 to WAV conversion)**:
   - Install **ffmpeg** for audio format conversion:
     - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) or use `choco install ffmpeg`
     - **macOS**: `brew install ffmpeg`
     - **Linux**: `sudo apt-get install ffmpeg`
   - If ffmpeg is not installed, the app will still work but return MP3 format instead of WAV

3. **Optional: Install Coqui TTS** (alternative engine):
   ```bash
   pip install TTS
   ```
   
   **Note**: 
   - Coqui TTS requires Python 3.8+ and may download large model files (~500MB) on first use
   - gTTS is the **recommended** engine for Hindi support (works out of the box)
   - If gTTS installation fails, the app will automatically fall back to Coqui TTS or pyttsx3

### Step 3: Run the Backend Server

1. **Make sure you're in the backend directory** and virtual environment is activated

2. **Start the Flask server**:
   ```bash
   python app.py
   ```

   You should see output like:
   ```
   ==================================================
   Multilingual Text-to-Speech Server
   ==================================================
   Engine: pyttsx3 (or Coqui TTS if installed)
   Server running on http://localhost:5000
   ==================================================
   ```

3. **Keep this terminal window open** - the server needs to stay running

### Step 4: Open the Frontend

1. **Open a new terminal window** (keep the backend running)

2. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

3. **Open `index.html` in your web browser**:
   - **Option 1**: Double-click `index.html` in your file explorer
   - **Option 2**: Right-click `index.html` → "Open with" → Choose your browser
   - **Option 3**: Drag and drop `index.html` into your browser window

   **Note**: If you encounter CORS issues, you can also serve the frontend with a simple HTTP server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Then open http://localhost:8000 in browser
   ```

## Usage

1. **Enter text** in the textarea (supports English and Hindi mixed)
   - Example: `Hello नमस्ते! How are you? क्या हाल है?`

2. **Adjust voice controls** (optional):
   - **Speed**: Controls speech rate (0.5x to 2.0x)
   - **Pitch**: Controls voice pitch (0.5x to 2.0x)

3. **Click "Speak" button** to generate speech

4. **Audio player** will appear and play the generated speech automatically

5. **Use Ctrl+Enter** (or Cmd+Enter on Mac) in the textarea for quick speech generation

## How Multilingual Text is Handled

### Language Detection
The application automatically detects if the text contains Hindi characters (Devanagari script, Unicode range U+0900 to U+097F).

### TTS Engine Differences

#### gTTS (Google Text-to-Speech) - **PRIMARY ENGINE** 🎯
- **Excellent Hindi support**: Native Hindi pronunciation with proper Devanagari handling
- **Mixed language**: Handles English + Hindi text seamlessly
- **High quality**: Cloud-based TTS with natural voices
- **Requires internet**: Needs active internet connection
- **Free and open-source**: No API keys required

#### Coqui TTS (alternative)
- **Better quality**: Neural network-based, more natural sounding
- **Multilingual support**: XTTS v2 model supports Hindi (`'hi'` language code)
- **Offline**: Works without internet after model download
- **Large models**: ~500MB download required

#### pyttsx3 (fallback)
- **Widely compatible**: Works on Windows, macOS, and Linux
- **System voices**: Uses system-installed TTS voices
- **Language support**: Depends on available system voices
  - **Windows**: May need to install Hindi language pack
  - **macOS**: May need to add Hindi voice in System Preferences
  - **Linux**: Requires `festival` or `espeak` with Hindi support

### Hindi Support Status

✅ **gTTS**: Full Hindi support - **recommended for Hindi text**
✅ **Coqui TTS XTTS v2**: Full Hindi support (uses `'hi'` language code)
⚠️ **pyttsx3**: Hindi support depends on system voices (may not work out of the box)

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError` when running `app.py`
- **Solution**: Make sure virtual environment is activated and dependencies are installed

**Problem**: gTTS requires internet connection
- **Solution**: The app needs an active internet connection for gTTS. If offline, it will try Coqui TTS or pyttsx3.

**Problem**: Coqui TTS installation fails
- **Solution**: The app will automatically fall back to pyttsx3. gTTS is the recommended engine anyway.

**Problem**: "ffmpeg not found" error
- **Solution**: Install ffmpeg (see Setup Instructions). The app will still work but return MP3 instead of WAV.

**Problem**: `pyttsx3` voice not working on Linux
- **Solution**: Install system TTS: `sudo apt-get install espeak` or `sudo apt-get install festival`

**Problem**: Port 5000 already in use
- **Solution**: Change port in `app.py` (last line): `app.run(..., port=5001)`

### Frontend Issues

**Problem**: "Failed to generate speech" error
- **Solution**: 
  - Ensure Flask server is running on `http://localhost:5000`
  - Check browser console (F12) for detailed errors
  - Verify CORS is enabled (should be automatic)

**Problem**: CORS errors in browser console
- **Solution**: The Flask app includes `flask-cors`. If issues persist, check that `CORS(app)` is in `app.py`

**Problem**: Audio doesn't play automatically
- **Solution**: Some browsers block autoplay. Click the play button manually.

## API Endpoint

### POST `/speak`

Converts text to speech.

**Request Body**:
```json
{
  "text": "Hello नमस्ते",
  "speed": 1.0,
  "pitch": 1.0
}
```



**Example using curl**:
```bash
curl -X POST http://localhost:5000/speak \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","speed":1.0,"pitch":1.0}' \
  --output speech.wav
```

### GET `/health`

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "engine": "pyttsx3",
  "multilingual_support": "partial"
}
```

## Development Notes

### Code Structure

- **Frontend**: Pure JavaScript (no frameworks), communicates with backend via Fetch API
- **Backend**: Flask REST API, generates audio files temporarily, sends them to frontend
- **TTS Engine**: Dynamic selection based on availability (Coqui TTS → pyttsx3)

### Key Files Explained

- **`app.py`**: 
  - Imports TTS libraries with try/except for graceful fallback
  - `/speak` endpoint handles text processing and audio generation
  - Language detection function identifies Hindi characters
  - Temporary files are cleaned up after sending

- **`script.js`**:
  - Sends POST request to Flask backend with text and voice parameters
  - Handles audio playback using HTML5 Audio API
  - Updates UI based on loading/error states

- **`index.html`**:
  - Semantic HTML structure with accessibility considerations
  - Includes voice control sliders (bonus feature)
  - Responsive design for mobile devices

## Future Enhancements

- [ ] Add more language support
- [ ] Voice selection dropdown
- [ ] Download audio file option
- [ ] Text preview with language highlighting
- [ ] Support for more audio formats (MP3)
- [ ] Batch text processing
- [ ] Cloud deployment instructions

## License

This project is provided as-is for educational purposes.

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Verify all dependencies are installed correctly
3. Check browser console and server logs for error messages

---

**Happy Speech Generation! 🎤**

