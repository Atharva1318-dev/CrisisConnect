# app.py - Main Flask Application
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from PIL import Image
import io
import base64

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configure Gemini API
genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))

# Task C: Trigger words for severity classification
TRIGGER_WORDS = ['explosion', 'collapse', 'trapped', 'bomb', 'fire', 'blast',
                 'vispot', 'धमाका', 'आग', 'फंसे']


# =============================================================================
# TASK A: THE TRIAGE AGENT (Text Analysis)
# =============================================================================

@app.route('/analyze-text', methods=['POST'])
def analyze_text():
    """
    Analyzes voice transcript to extract:
    - Category (Fire/Flood/Medical)
    - Severity (High/Medium/Low)
    - Translated description
    - Original language
    """
    try:
        data = request.get_json()
        transcript = data.get('transcript', '')

        if not transcript:
            return jsonify({'error': 'No transcript provided'}), 400

        # Task C: Check for trigger words FIRST (Safety Guardrail)
        has_trigger_word = any(word in transcript.lower() for word in TRIGGER_WORDS)

        # Configure Gemini for text analysis
        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        # Strict system prompt for structured extraction
        prompt = f"""You are a crisis analyzer for emergency services. Analyze this incident report.

INPUT TEXT: "{transcript}"

Extract the following in STRICT JSON format:
{{
  "category": "<Fire/Flood/Medical/Accident/Other>",
  "severity": "<High/Medium/Low>",
  "translated_desc": "<Brief English description>",
  "original_lang": "<Detected language>",
  "location_mention": "<Any location mentioned or 'Not specified'>"
}}

RULES:
- Category MUST be one of: Fire, Flood, Medical, Accident, Other
- Severity: High (life-threatening), Medium (urgent), Low (non-urgent)
- Translate to English if in Hindi/Marathi/other language
- Keep translated_desc under 100 characters
- Return ONLY valid JSON, no markdown or explanation"""

        response = model.generate_content(prompt)

        # Parse AI response
        try:
            import json
            # Remove markdown code blocks if present
            response_text = response.text.strip()
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]

            ai_result = json.loads(response_text.strip())
        except:
            # Fallback if JSON parsing fails
            ai_result = {
                "category": "Other",
                "severity": "Medium",
                "translated_desc": transcript[:100],
                "original_lang": "Unknown"
            }

        # Task C: OVERRIDE SEVERITY if trigger word detected
        if has_trigger_word:
            ai_result['severity'] = 'High'
            ai_result['trigger_word_override'] = True
        else:
            ai_result['trigger_word_override'] = False

        # Add metadata
        ai_result['original_transcript'] = transcript
        ai_result['processing_time'] = 'real-time'

        return jsonify(ai_result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================================================
# TASK B: THE VISION AGENT (Image Analysis)
# =============================================================================

@app.route('/analyze-image', methods=['POST'])
def analyze_image():
    """
    Analyzes crisis image to extract:
    - People count (crowd estimation)
    - Hazard detection (smoke, fire, water, debris)
    - Crowd density
    - Visibility assessment
    """
    try:
        # Handle image upload
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        image_file = request.files['image']

        # Read and process image
        image_data = image_file.read()
        image = Image.open(io.BytesIO(image_data))

        # Configure Gemini Vision model
        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        # Vision analysis prompt
        prompt = """You are analyzing a crisis situation image. Provide detailed analysis in JSON format:

{{
  "people_count": <estimated number of people visible>,
  "hazard_detected": "<Primary hazard: Smoke/Fire/Water/Debris/None>",
  "crowd_density": "<High/Medium/Low/None>",
  "visibility": "<Good/Moderate/Poor>",
  "hazard_severity": "<Critical/Moderate/Mild/None>",
  "recommended_action": "<Brief action recommendation>",
  "additional_hazards": ["<list any secondary hazards>"]
}}

ANALYSIS GUIDELINES:
- Count visible people carefully
- Identify most prominent hazard
- Assess crowd density based on spacing
- Visibility based on image clarity/smoke/weather
- Recommend immediate action based on hazards
- Return ONLY valid JSON"""

        response = model.generate_content([prompt, image])

        # Parse response
        try:
            import json
            response_text = response.text.strip()
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]

            vision_result = json.loads(response_text.strip())
        except:
            # Fallback
            vision_result = {
                "people_count": 0,
                "hazard_detected": "Unknown",
                "crowd_density": "Unknown",
                "visibility": "Moderate",
                "recommended_action": "Assess situation carefully"
            }

        # Add confidence score (you can enhance this with actual ML confidence)
        vision_result['confidence'] = 0.85
        vision_result['analysis_timestamp'] = 'real-time'

        return jsonify(vision_result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================================================
# TASK C: SEVERITY CLASSIFIER (Integrated in Task A)
# =============================================================================
# The severity classifier is embedded in the /analyze-text endpoint
# It checks for trigger words BEFORE AI analysis and overrides severity to High


# =============================================================================
# HEALTH CHECK ENDPOINT
# =============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check for the microservice"""
    return jsonify({
        'status': 'healthy',
        'service': 'Crisis AI Microservice',
        'endpoints': {
            'text_analysis': '/analyze-text',
            'vision_analysis': '/analyze-image'
        },
        'tasks': {
            'task_a': 'Triage Agent (Text)',
            'task_b': 'Vision Agent (Image)',
            'task_c': 'Severity Classifier (Embedded)'
        }
    }), 200


# =============================================================================
# BATCH PROCESSING ENDPOINT (BONUS)
# =============================================================================

@app.route('/analyze-batch', methods=['POST'])
def analyze_batch():
    """
    Process multiple incidents at once
    Useful for handling multiple SOS calls simultaneously
    """
    try:
        data = request.get_json()
        incidents = data.get('incidents', [])

        results = []
        for incident in incidents:
            # Quick analysis for each
            has_trigger = any(word in incident.lower() for word in TRIGGER_WORDS)
            results.append({
                'transcript': incident,
                'has_trigger_word': has_trigger,
                'preliminary_severity': 'High' if has_trigger else 'Pending'
            })

        return jsonify({
            'total_processed': len(results),
            'results': results
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)