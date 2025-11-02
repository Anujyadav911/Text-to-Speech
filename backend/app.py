from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import sys
import traceback
from io import BytesIO

app = Flask(__name__)
CORS(app)
USE_GTTS = False
USE_COQUI_TTS = False
tts_engine = None
coqui_tts = None
pyttsx3_engine = None

print("Initializing TTS engine...")

try:
    from gtts import gTTS
    USE_GTTS = True
    print("✓ gTTS initialized successfully (excellent Hindi support)")
except ImportError:
    print("gTTS not available, trying Coqui TTS...")
except Exception as e:
    print(f"gTTS initialization error: {e}, trying Coqui TTS...")

if not USE_GTTS:
    try:
        from TTS.api import TTS
        print("Coqui TTS found! Attempting to initialize...")
        
        try:
            coqui_tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2", 
                           gpu=False)
            USE_COQUI_TTS = True
            print("✓ Coqui TTS initialized successfully with XTTS v2 (supports Hindi)")
        except Exception as e:
            print(f"Warning: Failed to initialize XTTS v2: {e}")
            print("Falling back to pyttsx3...")
            raise
        
    except ImportError:
        print("Coqui TTS not available, using pyttsx3 fallback...")
    except Exception as e:
        print(f"Coqui TTS initialization error: {e}")
        print("Falling back to pyttsx3...")

if not USE_GTTS and not USE_COQUI_TTS:
    try:
        import pyttsx3
        pyttsx3_engine = pyttsx3.init()
        
        voices = pyttsx3_engine.getProperty('voices')
        hindi_voice_found = False
        for voice in voices:
            if 'hindi' in voice.name.lower() or 'hi-in' in str(voice.id).lower():
                pyttsx3_engine.setProperty('voice', voice.id)
                hindi_voice_found = True
                print(f"✓ Found Hindi voice: {voice.name}")
                break
        
        if not hindi_voice_found:
            print("⚠ Warning: Hindi voice not found. Hindi text may not be pronounced correctly.")
            print("   Available voices:")
            for voice in voices:
                print(f"   - {voice.name} ({voice.id})")
        
        print("✓ pyttsx3 initialized successfully")
    except Exception as e:
        print(f"Error initializing pyttsx3: {e}")
        sys.exit(1)


def detect_language(text):
    for char in text:
        if '\u0900' <= char <= '\u097F':
            return 'hi'
    return 'en'


def detect_mixed_language(text):
    has_hindi = False
    has_english = False
    
    for char in text:
        if '\u0900' <= char <= '\u097F':
            has_hindi = True
        elif char.isalpha() and ord(char) < 128:
            has_english = True
    
    if has_hindi and has_english:
        return (True, True, 'mixed')
    elif has_hindi:
        return (True, False, 'hi')
    else:
        return (False, True, 'en')


def generate_speech_gtts(text, speed=1.0, pitch=1.0):
    from gtts import gTTS
    
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
    temp_path = temp_file.name
    temp_file.close()
    
    try:
        has_hindi, has_english, primary_lang = detect_mixed_language(text)
        
        if has_hindi:
            lang_code = 'hi'
            print(f"Using Hindi TTS (gTTS handles mixed text)")
        else:
            lang_code = 'en'
            print(f"Using English TTS")
        
        tts = gTTS(text=text, lang=lang_code, slow=False)
        tts.save(temp_path)
        
        try:
            from pydub import AudioSegment
            audio = AudioSegment.from_mp3(temp_path)
            
            if speed != 1.0:
                audio = audio.speedup(playback_speed=speed, crossfade=25)
            
            wav_path = temp_path.replace('.mp3', '.wav')
            audio.export(wav_path, format="wav")
            
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            return wav_path
        except ImportError:
            print("Warning: pydub not available, returning MP3")
            return temp_path
        except Exception as e:
            print(f"Warning: Audio processing failed: {e}, returning MP3")
            return temp_path
        
    except Exception as e:
        print(f"Error in gTTS generation: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise


def generate_speech_coqui(text, speed=1.0, pitch=1.0):
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    temp_path = temp_file.name
    temp_file.close()
    
    detected_lang = detect_language(text)
    has_hindi, has_english, primary_lang = detect_mixed_language(text)
    
    if has_hindi:
        lang_code = 'hi'
        print(f"Using Hindi TTS with Coqui XTTS v2")
    else:
        lang_code = 'en'
        print(f"Using English TTS with Coqui XTTS v2")
    
    try:
        coqui_tts.tts_to_file(
            text=text,
            file_path=temp_path,
            language=lang_code,
            speaker_wav=None,
        )
        
        return temp_path
    except Exception as e:
        print(f"Error in Coqui TTS generation: {e}")
        raise


def generate_speech_pyttsx3(text, speed=1.0, pitch=1.0):
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    temp_path = temp_file.name
    temp_file.close()
    
    try:
        rate = pyttsx3_engine.getProperty('rate')
        pyttsx3_engine.setProperty('rate', int(rate * speed))
        
        pyttsx3_engine.save_to_file(text, temp_path)
        pyttsx3_engine.runAndWait()
        
        pyttsx3_engine.setProperty('rate', rate)
        
        return temp_path
    except Exception as e:
        print(f"Error in pyttsx3 generation: {e}")
        raise


@app.route('/speak', methods=['POST'])
def speak():
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing "text" field in request body'}), 400
        
        text = data['text'].strip()
        speed = float(data.get('speed', 1.0))
        pitch = float(data.get('pitch', 1.0))
        
        if not text:
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        speed = max(0.5, min(2.0, speed))
        pitch = max(0.5, min(2.0, pitch))
        
        print(f"Generating speech for text: {text[:50]}... (speed={speed}, pitch={pitch})")
        
        if USE_GTTS:
            audio_path = generate_speech_gtts(text, speed, pitch)
        elif USE_COQUI_TTS:
            audio_path = generate_speech_coqui(text, speed, pitch)
        else:
            audio_path = generate_speech_pyttsx3(text, speed, pitch)
        
        if audio_path.endswith('.mp3'):
            mimetype = 'audio/mpeg'
            download_name = 'speech.mp3'
        else:
            mimetype = 'audio/wav'
            download_name = 'speech.wav'
        
        return send_file(
            audio_path,
            mimetype=mimetype,
            as_attachment=False,
            download_name=download_name
        )
        
    except Exception as e:
        print(f"Error in /speak endpoint: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Failed to generate speech: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health():
    if USE_GTTS:
        engine_status = "gTTS"
        multilingual_support = "full"
    elif USE_COQUI_TTS:
        engine_status = "Coqui TTS"
        multilingual_support = "full"
    else:
        engine_status = "pyttsx3"
        multilingual_support = "partial"
    
    return jsonify({
        'status': 'healthy',
        'engine': engine_status,
        'multilingual_support': multilingual_support,
        'hindi_support': 'yes' if (USE_GTTS or USE_COQUI_TTS) else 'requires_system_voice'
    })


if __name__ == '__main__':
    print("\n" + "="*50)
    print("Multilingual Text-to-Speech Server")
    print("="*50)
    if USE_GTTS:
        print("Engine: gTTS (excellent Hindi support)")
    elif USE_COQUI_TTS:
        print("Engine: Coqui TTS XTTS v2 (Hindi support)")
    else:
        print("Engine: pyttsx3 (Hindi depends on system voices)")
    print("Server running on http://localhost:5000")
    print("="*50 + "\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)

