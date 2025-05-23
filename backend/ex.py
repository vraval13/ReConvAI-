import os
import re
import tempfile
from io import BytesIO
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pyttsx3
import google.generativeai as genai
from pptx import Presentation
from langchain_community.document_loaders import PyPDFLoader
from werkzeug.utils import secure_filename
import traceback

import torch
from diffusers import StableDiffusionPipeline
import textwrap
import math
# from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips
from PIL import Image, ImageDraw, ImageFont
from gradio_client import Client, handle_file

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Configure Gemini
genai.configure(api_key="AIzaSyB8CJIJvb64z3Z_4FKHgmvZXMscx1-yeEs")  # Replace with your Gemini API key
model = genai.GenerativeModel("gemini-1.5-flash")

# Constants
level_prompts = {
    "Beginner": "Summarize this research paper section for a high school student in 4-6 concise bullet points:",
    "Student": "Create a structured summary of this section for undergraduate students in 4-6 points:",
    "Expert": "Generate a detailed summary of this section for researchers in 5-7 well-formed bullet points:"
}

creativity_levels = {
    "Formal": "Keep the conversation strictly professional and formal.",
    "Balanced": "Maintain a balance between professional and conversational tone.",
    "Creative": "Make the conversation more creative and engaging with some informal elements."
}

podcast_lengths = {
    "Short (2-3 mins)": "Generate a short podcast with 2-3 questions and concise answers.",
    "Medium (5-7 mins)": "Generate a medium-length podcast with 4-5 questions and detailed answers.",
    "Long (10+ mins)": "Generate a long podcast with 6-8 questions and in-depth discussion."
}

template_options = {
    "Template 1": "templates/theme_template_1.pptx",
    "Template 2": "templates/theme_template_2.pptx",
    "Template 3": "templates/theme_template_3.pptx"
}

def get_avatar_html(active_speaker):
    """Generate HTML for avatars with active speaker highlighting."""
    return f"""
    <div class="avatar-container">
        <div class="avatar-card {'active-speaker' if active_speaker == 'Alex' else ''}">
            <div class="speaking-indicator"></div>
            <img src="https://img.icons8.com/color/144/000000/circled-user-female-skin-type-5.png" 
                 class="avatar-img">
            <div class="avatar-name">Alex</div>
        </div>
        <div class="avatar-card {'active-speaker' if active_speaker == 'Dr. Smith' else ''}">
            <div class="speaking-indicator"></div>
            <img src="https://img.icons8.com/color/144/000000/circled-user-male-skin-type-7.png" 
                 class="avatar-img">
            <div class="avatar-name">Dr. Smith</div>
        </div>
    </div>
    """

def generate_content_from_heading(heading):
    """Generate research paper-like content from a heading using Gemini."""
    prompt = f"""You are a research paper writer. Based on the following heading, generate a detailed research paper-like content with the following structure:
1. Introduction
2. Methodology
3. Results
4. Discussion
5. Conclusion

Heading: {heading}

Ensure the content is well-structured, informative, and suitable for academic purposes.
"""
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Error generating content: {e}")

def extract_and_summarize_sections(text, summary_level):
    """Extract sections and generate summaries using Gemini."""
    prompt = f"""Analyze the following research paper and:
1. Identify all major sections.
2. For each section, generate a summary using the following guidelines:
   - {level_prompts[summary_level]}
3. Format the response as:
   ## Section Name
   - Bullet point 1
   - Bullet point 2
   - Bullet point 3

Paper content:
{text}
"""
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Error processing document: {e}")

def generate_podcast_script(summary_text, creativity_level, podcast_length):
    """Generate a conversational podcast script using Gemini."""
    prompt = f"""Create a conversational podcast script between host Alex and researcher Dr. Smith discussing the research paper. Follow these rules:
1. Alex should ask curious, layperson-friendly questions.
2. Dr. Smith should provide expert answers based on the paper.
3. Always prefix lines with either "Alex:" or "Dr. Smith:".
4. Keep responses conversational but informative.
5. Cover key findings, methodology, and implications.
6. {creativity_levels[creativity_level]}
7. {podcast_lengths[podcast_length]}

Paper summary:
{summary_text}
"""
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Error generating podcast script: {e}")

def create_ppt_from_summary(summary_text, template_path):
    """Create PowerPoint from section-wise summaries using the selected template."""
    prs = Presentation(template_path)

    # Generate a title for the presentation using Gemini
    title_prompt = f"""Analyze the following text and generate a concise, professional title for a PowerPoint presentation (maximum 10-12 words):
    {summary_text[:5000]}  # Use the first 5000 characters for title generation
    """
    try:
        title_response = model.generate_content(title_prompt)
        title = title_response.text.strip()
    except Exception as e:
        title = "Research Summary"  

    max_title_length = 80  
    if len(title) > max_title_length:
        words = title.split()
        line1 = ""
        line2 = ""
        for word in words:
            if len(line1) + len(word) + 1 <= max_title_length:
                line1 += word + " "
            else:
                line2 += word + " "
        title = f"{line1.strip()}\n{line2.strip()}"

    # Add a title slide
    title_slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(title_slide_layout)
    slide.shapes.title.text = title
    slide.placeholders[1].text = "Generated by AI Podcast Generator"

    slide_layout = prs.slide_layouts[1]

    sections = {}
    current_section = "Introduction"
    for line in summary_text.split('\n'):
        if line.startswith("## "):
            current_section = line[3:].strip()
            sections[current_section] = []
        elif line.startswith("- "):
            sections[current_section].append(line[2:])

    for section, bullets in sections.items():
        slides_per_section = min((len(bullets) // 6) + 1, 5)
        chunk_size = max(len(bullets) // slides_per_section, 1)
        
        for i in range(0, len(bullets), chunk_size):
            slide = prs.slides.add_slide(slide_layout)
            title = slide.shapes.title
            title.text = section if i == 0 else f"{section} (Cont.)"
            
            content_box = slide.shapes.placeholders[1]
            tf = content_box.text_frame
            tf.word_wrap = True
            
            for bullet in bullets[i:i+chunk_size]:
                p = tf.add_paragraph()
                p.text = bullet
                p.level = 0
                p.space_after = 0
    
    pptx_stream = BytesIO()
    prs.save(pptx_stream)
    pptx_stream.seek(0)
    return pptx_stream

def generate_podcast_audio(podcast_script, rate=150):
    """Generate TTS audio with distinct voices for host and researcher."""
    try:
        temp_dir = tempfile.mkdtemp()
        output_file = os.path.join(temp_dir, "podcast_audio.wav")
        
        engine = pyttsx3.init()
        engine.setProperty('rate', rate)
        voices = engine.getProperty('voices')
        male_voice = voices[0].id
        female_voice = voices[1].id

        # Create a temporary file to store the combined audio
        combined_audio = BytesIO()

        # Process each line of the podcast script
        for line in podcast_script.split('\n'):
            line = line.strip()
            if not line:
                continue

            if line.startswith("Alex:"):
                engine.setProperty('voice', female_voice)
                text = line.replace("Alex:", "").strip()
            elif line.startswith("Dr. Smith:"):
                engine.setProperty('voice', male_voice)
                text = line.replace("Dr. Smith:", "").strip()
            else:
                continue

            # Generate audio for the line and append it to the combined audio
            temp_line_audio = os.path.join(temp_dir, "temp_line_audio.wav")
            engine.save_to_file(text, temp_line_audio)
            engine.runAndWait()

            # Append the generated audio to the combined audio
            with open(temp_line_audio, 'rb') as f:
                combined_audio.write(f.read())
            os.remove(temp_line_audio)

        # Save the combined audio to the output file
        with open(output_file, 'wb') as f:
            f.write(combined_audio.getvalue())

        return output_file
    except Exception as e:
        raise Exception(f"Error generating audio: {e}")
        
@app.route('/process-input', methods=['POST'])
def handle_process_input():
    try:
        data = request.json
        input_type = data.get('input_type')
        input_content = data.get('input_content')
        summary_level = data.get('summary_level', 'Student')
        creativity_level = data.get('creativity_level', 'Balanced')
        podcast_length = data.get('podcast_length', 'Medium (5-7 mins)')
        template_name = data.get('template_name', 'Template 1')

        if not input_type or not input_content:
            return jsonify({'error': 'input_type and input_content are required'}), 400

        # Process based on input type
        if input_type == "PDF":
            # For PDF processing, the frontend should first upload the PDF via /upload-pdf
            # and then send the extracted text here
            text_content = input_content
        else:  # Text input
            generated_content = generate_content_from_heading(input_content)
            text_content = generated_content

        # Generate summary
        summary_text = extract_and_summarize_sections(text_content, summary_level)
        
        # Generate podcast script
        podcast_script = generate_podcast_script(summary_text, creativity_level, podcast_length)
        
        # Generate PPT
        template_path = template_options.get(template_name)
        if not template_path:
            return jsonify({'error': 'Invalid template name'}), 400
        pptx_stream = create_ppt_from_summary(summary_text, template_path)
        
        # Prepare response
        response_data = {
            'summary': summary_text,
            'podcast_script': podcast_script,
            'ppt_file': pptx_stream.getvalue().decode('latin1')  # Encoding for JSON
        }
        
        return jsonify(response_data), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Internal server error: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

@app.route('/generate-summary', methods=['POST'])
def generate_summary():
    try:
        data = request.json
        text = data.get('text')
        summary_level = data.get('summary_level')

        # Validate input
        if not text or not summary_level:
            return jsonify({'error': 'Invalid input. "text" and "summary_level" are required.'}), 400

        # Call your existing summary generation function
        summary_text = extract_and_summarize_sections(text, summary_level)

        if not summary_text:
            return jsonify({'error': 'Failed to generate summary.'}), 500

        # Split the summary into an array of lines
        summary_lines = [line for line in summary_text.split('\n') if line.strip()]
        
        return jsonify({
            'summary': summary_lines,
            'summary_text': summary_text  # Also return the full text for other uses
        }), 200
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500    
@app.route('/generate-podcast', methods=['POST'])
def generate_podcast():
    try:
        data = request.json
        summary_text = data.get('summary_text')
        creativity_level = data.get('creativity_level')
        podcast_length = data.get('podcast_length')

        if not summary_text or not creativity_level or not podcast_length:
            return jsonify({'error': 'Missing required parameters'}), 400

        # Map frontend values to backend constants
        creativity_map = {
            'formal': 'Formal',
            'balanced': 'Balanced',
            'creative': 'Creative'
        }
        
        length_map = {
            'short': 'Short (2-3 mins)',
            'medium': 'Medium (5-7 mins)',
            'long': 'Long (10+ mins)'
        }

        try:
            mapped_creativity = creativity_map[creativity_level.lower()]
            mapped_length = length_map[podcast_length.lower()]
        except KeyError:
            return jsonify({'error': 'Invalid parameter values'}), 400
        
        # Call your existing podcast generation function
        podcast_script = generate_podcast_script(summary_text, mapped_creativity, mapped_length)
        
        return jsonify({
            'podcast_script': podcast_script,
            'status': 'success'
        }), 200
    except Exception as e:
        return jsonify({
            'error': f'Error generating podcast: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500
                
@app.route('/generate-ppt', methods=['POST'])
def generate_ppt():
    try:
        data = request.json
        summary_text = data.get('summary_text')
        template_name = data.get('template_name')

        if not summary_text or not template_name:
            return jsonify({'error': 'Missing required parameters'}), 400

        template_path = template_options.get(template_name)
        if not template_path or not os.path.exists(template_path):
            return jsonify({'error': 'Invalid template name'}), 400

        pptx_stream = create_ppt_from_summary(summary_text, template_path)
        
        # Return as binary file
        return send_file(
            pptx_stream,
            mimetype='application/vnd.openxmlformats-officedocument.presentationml.presentation',
            as_attachment=True,
            download_name='presentation.pptx'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/generate-audio', methods=['POST'])
def handle_generate_audio():
    try:
        data = request.json
        podcast_script = data.get('podcast_script')

        if not podcast_script:
            return jsonify({'error': 'podcast_script is required'}), 400

        print(f"Generating audio for podcast script: {podcast_script[:100]}...")  # Log the first 100 characters
        try:
            # Generate audio file
            audio_file = generate_podcast_audio(podcast_script)
            
            # Check if file was created
            if not os.path.exists(audio_file):
                return jsonify({'error': 'Audio file generation failed'}), 500

            # Create a BytesIO buffer to send the file
            with open(audio_file, 'rb') as f:
                audio_bytes = BytesIO(f.read())
            
            # Clean up the temporary file
            os.remove(audio_file)
            
            # Return the audio file
            return send_file(
                audio_bytes,
                mimetype="audio/wav",
                as_attachment=True,
                download_name="podcast_audio.wav"
            )
            
        except Exception as e:
            print(f"Error generating audio: {e}")
            return jsonify({
                'error': f'Audio generation error: {str(e)}',
                'traceback': traceback.format_exc()
            }), 500
            
    except Exception as e:
        print(f"Error in /generate-audio: {e}")
        return jsonify({
            'error': f'Internal server error: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500
                
@app.route('/')
def index():
    return jsonify({'message': 'Backend is running'})

@app.route('/upload-pdf', methods=['POST'])
def handle_upload_pdf():
    try:
        if 'pdf' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['pdf']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Invalid file type. Only PDFs are allowed.'}), 400

        temp_dir = tempfile.mkdtemp()
        temp_pdf_path = os.path.join(temp_dir, secure_filename(file.filename))
        
        try:
            file.save(temp_pdf_path)
            
            if not os.path.exists(temp_pdf_path):
                return jsonify({'error': 'Failed to save uploaded file'}), 500

            loader = PyPDFLoader(temp_pdf_path)
            documents = loader.load()
            pdf_text = "\n".join([doc.page_content for doc in documents])
            
            return jsonify({
                'message': 'PDF uploaded successfully',
                'content': pdf_text,
                'filename': file.filename
            }), 200
            
        finally:
            if os.path.exists(temp_pdf_path):
                try:
                    os.remove(temp_pdf_path)
                except:
                    pass
                
    except Exception as e:
        return jsonify({
            'error': f'Internal server error: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

# Add these imports at the top of ex.py
import torch
from diffusers import StableDiffusionPipeline
import textwrap
import math
from PIL import Image, ImageDraw, ImageFont
from gradio_client import Client, handle_file

# Add this configuration after other constants
comic_config = {
    "default_prompt": "Two professionals in deep discussion at a sleek, high-tech conference table. Holographic displays show AI models, real-time data, and futuristic UI. Neon lighting reflects off glass surfaces, creating a dynamic, focused atmosphere that highlights AI-driven decision-making.",
    "panel_size": (512, 512),
    "bubble_padding": 40,
    "text_width": 20,
    "font_size": 48
}

# Initialize the Gradio client (add this after other initializations)
comic_client = Client("gabrielchua/open-notebooklm")

# Initialize Stable Diffusion (add this after other initializations)
try:
    comic_pipe = StableDiffusionPipeline.from_pretrained(
        "stabilityai/stable-diffusion-2", 
        torch_dtype=torch.float32
    )
    comic_pipe.to("cpu")  # Change to 'cuda' if you have GPU support
except Exception as e:
    print(f"Warning: Could not load Stable Diffusion model: {str(e)}")
    comic_pipe = None

# Add these helper functions to ex.py
def get_best_font(size=48):
    """Select the best available font for comic text"""
    possible_fonts = ["ComicSansMS-Bold.ttf", "comicbd.ttf", "arialbd.ttf"]
    for font in possible_fonts:
        try:
            return ImageFont.truetype(font, size)
        except:
            continue
    return ImageFont.load_default()

def generate_comic_image(prompt):
    """Generate a single comic panel image using Stable Diffusion"""
    if not comic_pipe:
        raise Exception("Stable Diffusion model not loaded")
    
    image = comic_pipe(prompt).images[0]
    return image.resize(comic_config["panel_size"])

def add_speech_bubble(img, text, position):
    """Add speech bubble with text to an image"""
    draw = ImageDraw.Draw(img)
    font = get_best_font(size=comic_config["font_size"])
    wrapped_text = textwrap.fill(text, width=comic_config["text_width"])
    
    # Calculate bubble size
    text_bbox = draw.textbbox((0, 0), wrapped_text, font=font)
    bubble_width = text_bbox[2] - text_bbox[0] + comic_config["bubble_padding"]
    bubble_height = text_bbox[3] - text_bbox[1] + comic_config["bubble_padding"]
    
    # Draw bubble
    x, y = position
    draw.rounded_rectangle(
        (x, y, x + bubble_width, y + bubble_height),
        radius=20,
        fill=(255, 255, 255),
        outline="black",
        width=4
    )
    
    # Add text
    draw.text((x + 20, y + 20), wrapped_text, font=font, fill=(0, 0, 0))
    return img

def process_podcast_transcript(file_path):
    """Process podcast audio file to extract dialogues"""
    try:
        result = comic_client.predict(
            files=[handle_file(file_path)],
            url="",
            question="",
            tone="Fun",
            length="Medium (3-5 min)",
            language="English",
            use_advanced_audio=True,
            api_name="/generate_podcast"
        )
        audio_path, transcript_text = result
        dialogues = []
        
        for line in transcript_text.split("\n\n"):
            if ":" in line:
                speaker, text = line.split(": ", 1)
                dialogues.append((speaker.strip(), text.strip()))
        
        return dialogues
    except Exception as e:
        raise Exception(f"Podcast processing failed: {str(e)}")

def generate_comic_from_dialogues(dialogues):
    """Generate comic strip from list of dialogues"""
    if not comic_pipe:
        raise Exception("Stable Diffusion model not loaded")
    
    comic_panels = []
    for char, dialogue in dialogues:
        img = generate_comic_image(comic_config["default_prompt"])
        img = add_speech_bubble(img, dialogue, (20, 20))
        comic_panels.append(img)
    
    # Create comic grid
    num_panels = len(comic_panels)
    cols = min(math.ceil(math.sqrt(num_panels)), 4)
    rows = math.ceil(num_panels / cols)
    
    grid_width = cols * comic_config["panel_size"][0]
    grid_height = rows * comic_config["panel_size"][1]
    comic_grid = Image.new("RGB", (grid_width, grid_height), "white")
    
    for i, panel in enumerate(comic_panels):
        x_offset = (i % cols) * comic_config["panel_size"][0]
        y_offset = (i // cols) * comic_config["panel_size"][1]
        comic_grid.paste(panel, (x_offset, y_offset))
    
    # Save to temporary file
    temp_dir = tempfile.mkdtemp()
    comic_path = os.path.join(temp_dir, "comic.png")
    comic_grid.save(comic_path)
    
    return comic_path

# changed version from static text content into the dynamic text content for each attached pdf 
# this is little bit good
# @app.route('/generate-comic', methods=['POST'])
# def handle_generate_comic():
#     try:
#         # 1. Extract text from PDF
#         if 'pdf' not in request.files:
#             return jsonify({'error': 'No PDF file provided'}), 400
            
#         file = request.files['pdf']
#         if file.filename == '':
#             return jsonify({'error': 'Empty filename'}), 400
            
#         if not file.filename.lower().endswith('.pdf'):
#             return jsonify({'error': 'Only PDF files allowed'}), 400

#         with tempfile.NamedTemporaryFile(delete=False) as temp_pdf:
#             file.save(temp_pdf.name)
#             temp_pdf_path = temp_pdf.name
#         try:
#             loader = PyPDFLoader(temp_pdf_path)
#             documents = loader.load()
#             text_content = "\n".join([doc.page_content for doc in documents])
#         finally:
#             if os.path.exists(temp_pdf_path):
#                 try:
#                     os.remove(temp_pdf_path)
#                 except Exception as e:
#                     print(f"Warning: Could not delete temp file: {e}")

#         # 2. Generate natural conversation flow
#         dialogue_prompt = f"""
# Create a comic-style conversation between two researchers (Alex and Jordan) discussing this research content.
# Follow this natural flow:
# 1. Casual greeting and small talk (2-3 exchanges)
# 2. Transition to research topic ("What are you working on?")
# 3. Problem statement discussion (2 exchanges)
# 4. Methodology analysis (3 exchanges)
# 5. Key findings (2 exchanges)
# 6. Implications and next steps (2 exchanges)
# 7. Closing remarks

# Rules:
# - Keep exchanges 15-25 words each
# - Maintain technical accuracy but make it conversational
# - Use natural transitions between topics
# - Show enthusiasm and curiosity
# - Total 10-12 dialogue exchanges

# Research content:
# {text_content[:5000]}
# """
#         try:
#             response = model.generate_content(dialogue_prompt)
#             dialogue_script = response.text.strip()
#             # Clean and validate script
#             dialogue_lines = []
#             for line in dialogue_script.split('\n'):
#                 if ':' in line and len(line.split(':', 1)[1].strip()) > 5:
#                     speaker, content = line.split(':', 1)
#                     speaker = "Alex" if "Alex" in speaker else "Jordan"  # Normalize names
#                     dialogue_lines.append(f"{speaker}: {content.strip()}")
            
#             # Ensure we have enough lines
#             if len(dialogue_lines) < 8:
#                 dialogue_lines = [
#                     "Alex: Hey Jordan! How's your research going?",
#                     "Jordan: Pretty good! Just analyzing some network security data. You?",
#                     "Alex: Interesting! I'm looking at healthcare system vulnerabilities.",
#                     "Jordan: That's timely - what specific issues are you finding?",
#                     "Alex: We're seeing unencrypted patient data transfers in 60% of cases.",
#                     "Jordan: Wow, that's concerning. What protocols are they using?",
#                     "Alex: Mostly legacy HTTP systems with no encryption layer.",
#                     "Jordan: We should document these risks and propose solutions.",
#                     "Alex: Exactly. I'm drafting mitigation strategies now.",
#                     "Jordan: Let's collaborate on this - security is everyone's concern!"
#                 ]
#         except Exception as e:
#             print(f"Error generating dialogue: {str(e)}")
#             dialogue_lines = [
#                 "Alex: Hi Jordan! Ready to dive into this research?",
#                 "Jordan: Absolutely! I've been reviewing the initial findings.",
#                 "Alex: What stands out to you about the methodology?",
#                 "Jordan: The attack simulation approach seems particularly thorough.",
#                 "Alex: Yes, and the results show clear vulnerability patterns.",
#                 "Jordan: We should highlight the encryption gaps in our report.",
#                 "Alex: Good point. Let's include specific remediation steps too.",
#                 "Jordan: Agreed. This could really improve healthcare security."
#             ]

#                 # 3. Generate comic panels with realistic avatar conversations
#         panel_images = []
#         base_width, base_height = 512, 512  # Square panels for grid

#         for i, line in enumerate(dialogue_lines):
#             speaker, content = line.split(':', 1)
#             speaker = speaker.strip()
#             content = content.strip()

#             # Determine avatar characteristics based on speaker
#             if speaker == "Alex":
#                 avatar_desc = "a professional male researcher with glasses, wearing a lab coat"
#             else:
#                 avatar_desc = "a professional female researcher with curly hair, wearing smart casual attire"

#             # --- Generate a unique AI image with realistic avatars ---
#             img_prompt = f"""
#             High-quality photograph of two researchers in a modern laboratory:
#             - {avatar_desc} speaking enthusiastically
#             - Their colleague listening attentively
#             - Background shows high-tech equipment, computer screens with data visualizations
#             - Warm, professional lighting
#             - Ultra-realistic details, 8k resolution
#             - Current dialogue: "{content[:50]}"
#             - Natural body language and facial expressions
#             - Photorealistic style
#             """
            
#             negative_prompt = """
#             cartoon, anime, sketch, drawing, painting, 
#             unrealistic, blurry, deformed, distorted, 
#             extra limbs, bad anatomy, text, watermark
#             """
            
#             try:
#                 if comic_pipe:
#                     ai_image = comic_pipe(
#                         prompt=img_prompt,
#                         negative_prompt=negative_prompt,
#                         height=base_height,
#                         width=base_width,
#                         guidance_scale=7.5,
#                         num_inference_steps=50,
#                         generator=torch.Generator(device="cuda").manual_seed(i)  # For consistency
#                     ).images[0]
                    
#                     # Enhance image quality
#                     # ai_image = ai_image.filter(ImageFilter.SHARPEN)
#                 else:
#                     # Fallback blank image
#                     ai_image = Image.new('RGB', (base_width, base_height), (240, 240, 245))
#                     draw = ImageDraw.Draw(ai_image)
#                     # Draw placeholder avatar silhouettes
#                     draw.ellipse([100, 100, 300, 300], fill=(200, 220, 240), outline=(0, 100, 200))
#                     draw.ellipse([250, 150, 450, 350], fill=(220, 200, 240), outline=(100, 0, 200))
#             except Exception as e:
#                 print(f"Error generating image: {str(e)}")
#                 ai_image = Image.new('RGB', (base_width, base_height), (240, 240, 245))

#             # Create panel with speech bubble
#             panel = Image.new('RGB', (base_width, base_height), (255, 255, 255))
#             panel.paste(ai_image, (0, 0))
            
#             draw = ImageDraw.Draw(panel)
#             try:
#                 font = ImageFont.truetype("arial.ttf", 18)
#             except:
#                 font = ImageFont.load_default()

#             # Modern speech bubble design
#             bubble_margin = 20
#             bubble_width = base_width - 2 * bubble_margin
#             bubble_height = 90
#             bubble_y = base_height - bubble_height - bubble_margin

#             # Draw bubble with subtle shadow
#             draw.rounded_rectangle(
#                 [bubble_margin+2, bubble_y+2, bubble_margin + bubble_width+2, bubble_y + bubble_height+2],
#                 radius=15, fill="#888888"
#             )
#             draw.rounded_rectangle(
#                 [bubble_margin, bubble_y, bubble_margin + bubble_width, bubble_y + bubble_height],
#                 radius=15, fill="white", outline="#0066cc", width=2
#             )

#             # Bubble tail pointing to speaker
#             tail_x = bubble_margin + 50 if speaker == "Alex" else base_width - bubble_margin - 50
#             draw.polygon([
#                 (tail_x, bubble_y),
#                 (tail_x - 15, bubble_y - 15),
#                 (tail_x + 15, bubble_y - 15)
#             ], fill="white", outline="#0066cc", width=2)

#             # Speaker name with colored tag
#             tag_color = "#3a7ca5" if speaker == "Alex" else "#8a4f7d"
#             draw.rounded_rectangle(
#                 [bubble_margin + 10, bubble_y + 8, bubble_margin + 20 + font.getlength(speaker), bubble_y + 28],
#                 radius=4, fill=tag_color
#             )
#             draw.text((bubble_margin + 15, bubble_y + 10), speaker, fill="white", font=font)

#             # Content text with better formatting
#             wrapped_text = textwrap.fill(content, width=40)
#             draw.text((bubble_margin + 15, bubble_y + 35), wrapped_text, fill="#333333", font=font)

#             panel_images.append(panel)

#         # 4. Create comic page layout
#         page_width = 1200
#         current_x, current_y = 20, 20
#         row_height = 0
        
#         # Calculate total height needed
#         total_height = sum(img.height + 20 for img in panel_images)
#         composite = Image.new('RGB', (page_width, total_height), (245, 245, 245))
        
#         # Arrange panels with gutters
#         for img in panel_images:
#             if current_x + img.width > page_width - 20:
#                 current_x = 20
#                 current_y += row_height + 20
#                 row_height = 0
                
#             composite.paste(img, (current_x, current_y))
#             current_x += img.width + 20
#             row_height = max(row_height, img.height)
        
#         # Final crop
#         final_height = current_y + row_height + 20
#         composite = composite.crop((0, 0, page_width, final_height))

#         # 5. Return final comic
#         img_io = BytesIO()
#         composite.save(img_io, 'PNG', quality=90)
#         img_io.seek(0)
        
#         return send_file(
#             img_io,
#             mimetype='image/png',
#             as_attachment=True,
#             download_name='research_comic.png'
#         )

#     except Exception as e:
#         return jsonify({
#             'error': f"Failed to generate comic: {str(e)}",
#             'traceback': traceback.format_exc()
#         }), 500
                    

##code snippet got from the claude
@app.route('/generate-comic', methods=['POST'])
def handle_generate_comic():
    try:
        # 1. Extract text from PDF
        if 'pdf' not in request.files:
            return jsonify({'error': 'No PDF file provided'}), 400
            
        file = request.files['pdf']
        if file.filename == '':
            return jsonify({'error': 'Empty filename'}), 400
            
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'Only PDF files allowed'}), 400

        with tempfile.NamedTemporaryFile(delete=False) as temp_pdf:
            file.save(temp_pdf.name)
            temp_pdf_path = temp_pdf.name
        try:
            loader = PyPDFLoader(temp_pdf_path)
            documents = loader.load()
            text_content = "\n".join([doc.page_content for doc in documents])
        finally:
            if os.path.exists(temp_pdf_path):
                try:
                    os.remove(temp_pdf_path)
                except Exception as e:
                    print(f"Warning: Could not delete temp file: {e}")

        # 2. Generate natural conversation flow
        dialogue_prompt = f"""
Create a comic-style conversation between two researchers (Alex and Jamie) discussing this research content.
Alex is male and Jamie is female.
Follow this natural flow:
1. Casual greeting and small talk (2-3 exchanges)
2. Transition to research topic ("What are you working on?")
3. Problem statement discussion (2 exchanges)
4. Methodology analysis (3 exchanges)
5. Key findings (2 exchanges)
6. Implications and next steps (2 exchanges)
7. Closing remarks

Rules:
- Keep exchanges 15-25 words each
- Maintain technical accuracy but make it conversational
- Use natural transitions between topics
- Show enthusiasm and curiosity
- Total 10-12 dialogue exchanges

Research content:
{text_content[:5000]}
"""
        try:
            response = model.generate_content(dialogue_prompt)
            dialogue_script = response.text.strip()
            # Clean and validate script
            dialogue_lines = []
            for line in dialogue_script.split('\n'):
                if ':' in line and len(line.split(':', 1)[1].strip()) > 5:
                    speaker, content = line.split(':', 1)
                    speaker = speaker.strip()
                    # Normalize names
                    if "Alex" in speaker:
                        speaker = "Alex"
                        gender = "male"
                    else:
                        speaker = "Jamie"
                        gender = "female"
                    dialogue_lines.append({
                        "speaker": speaker,
                        "content": content.strip(),
                        "gender": gender
                    })
            
            # Ensure we have enough lines
            if len(dialogue_lines) < 8:
                dialogue_lines = [
                    {"speaker": "Alex", "content": "Hey Jamie! How's your research going?", "gender": "male"},
                    {"speaker": "Jamie", "content": "Pretty good! Just analyzing some network security data. You?", "gender": "female"},
                    {"speaker": "Alex", "content": "Interesting! I'm looking at healthcare system vulnerabilities.", "gender": "male"},
                    {"speaker": "Jamie", "content": "That's timely - what specific issues are you finding?", "gender": "female"},
                    {"speaker": "Alex", "content": "We're seeing unencrypted patient data transfers in 60% of cases.", "gender": "male"},
                    {"speaker": "Jamie", "content": "Wow, that's concerning. What protocols are they using?", "gender": "female"},
                    {"speaker": "Alex", "content": "Mostly legacy HTTP systems with no encryption layer.", "gender": "male"},
                    {"speaker": "Jamie", "content": "We should document these risks and propose solutions.", "gender": "female"},
                    {"speaker": "Alex", "content": "Exactly. I'm drafting mitigation strategies now.", "gender": "male"},
                    {"speaker": "Jamie", "content": "Let's collaborate on this - security is everyone's concern!", "gender": "female"}
                ]
        except Exception as e:
            print(f"Error generating dialogue: {str(e)}")
            dialogue_lines = [
                {"speaker": "Alex", "content": "Hi Jamie! Ready to dive into this research?", "gender": "male"},
                {"speaker": "Jamie", "content": "Absolutely! I've been reviewing the initial findings.", "gender": "female"},
                {"speaker": "Alex", "content": "What stands out to you about the methodology?", "gender": "male"},
                {"speaker": "Jamie", "content": "The attack simulation approach seems particularly thorough.", "gender": "female"},
                {"speaker": "Alex", "content": "Yes, and the results show clear vulnerability patterns.", "gender": "male"},
                {"speaker": "Jamie", "content": "We should highlight the encryption gaps in our report.", "gender": "female"},
                {"speaker": "Alex", "content": "Good point. Let's include specific remediation steps too.", "gender": "male"},
                {"speaker": "Jamie", "content": "Agreed. This could really improve healthcare security.", "gender": "female"}
            ]

        # 3. Generate avatar images for each character
        # Pre-define avatar characteristics to maintain consistency
        avatar_characteristics = {
            "Alex": {
                "gender": "male",
                "features": "professional male researcher with short brown hair and glasses, wearing a lab coat",
                "emotion_map": {
                    "greeting": "smiling friendly",
                    "question": "curious expression",
                    "concern": "concerned expression",
                    "excited": "excited expression",
                    "thoughtful": "thoughtful expression"
                }
            },
            "Jamie": {
                "gender": "female",
                "features": "professional female researcher with shoulder-length blonde hair, wearing a blue blouse",
                "emotion_map": {
                    "greeting": "warm smile",
                    "question": "inquisitive expression",
                    "concern": "worried expression",
                    "excited": "enthusiastic expression",
                    "thoughtful": "contemplative expression"
                }
            }
        }

        # 3. Generate comic panels with human conversations and tech backgrounds
        panel_images = []
        base_width, base_height = 512, 512  # Square panels for grid

        # First, generate and cache all avatar images for consistency
        avatar_cache = {}
        for character in ["Alex", "Jamie"]:
            char_info = avatar_characteristics[character]
            for emotion, expression in char_info["emotion_map"].items():
                cache_key = f"{character}_{emotion}"
                
                # Define the avatar prompt for stable diffusion
                avatar_prompt = f"""
                Portrait of a {char_info['features']}, with {expression}, 
                highly detailed realistic face, professional lighting, 
                high quality, photorealistic, 8k, portrait photography
                """
                
                try:
                    if comic_pipe:  # If Stable Diffusion is available
                        avatar_image = comic_pipe(
                            prompt=avatar_prompt,
                            negative_prompt="deformed, ugly, cartoon, anime, blurry, low quality, disfigured",
                            height=base_height,
                            width=base_width,
                            guidance_scale=7.5,
                            num_inference_steps=50
                        ).images[0]
                    else:
                        # Fallback image generation using another method
                        # This would be where you'd implement alternative avatar generation
                        # For now, create a placeholder
                        avatar_image = create_placeholder_avatar(character, emotion, base_width, base_height)
                except Exception as e:
                    print(f"Error generating avatar for {cache_key}: {str(e)}")
                    avatar_image = create_placeholder_avatar(character, emotion, base_width, base_height)
                
                avatar_cache[cache_key] = avatar_image

        # Create conversation scene backgrounds
        background_settings = [
            "modern research laboratory with holographic displays",
            "clean white office with large computer monitors",
            "university hallway with research posters",
            "campus coffee shop with laptops and research papers",
            "dimly lit server room with blinking lights",
            "university library with bookshelves and study areas",
            "team meeting room with whiteboard full of diagrams",
            "cybersecurity operations center with multiple screens"
        ]
        
        background_cache = {}
        for i, setting in enumerate(background_settings):
            background_prompt = f"""
            A {setting}, wide angle view, no people, 
            realistic style, professional photography, 
            detailed environment, high quality, 8k
            """
            
            try:
                if comic_pipe:
                    bg_image = comic_pipe(
                        prompt=background_prompt,
                        negative_prompt="low quality, cartoon, anime, people, humans, faces",
                        height=base_height,
                        width=base_width,
                        guidance_scale=7.5,
                        num_inference_steps=40
                    ).images[0]
                else:
                    bg_image = create_placeholder_background(setting, base_width, base_height)
            except Exception as e:
                print(f"Error generating background {i}: {str(e)}")
                bg_image = create_placeholder_background(setting, base_width, base_height)
                
            background_cache[i % len(background_settings)] = bg_image

        # For each dialogue line, create a panel
        for i, line_data in enumerate(dialogue_lines):
            speaker = line_data["speaker"]
            content = line_data["content"]
            gender = line_data["gender"]
            
            # Determine emotion from content
            emotion = "greeting"
            if "?" in content:
                emotion = "question"
            elif any(word in content.lower() for word in ["concern", "problem", "issue", "worry"]):
                emotion = "concern"
            elif any(word in content.lower() for word in ["great", "excellent", "amazing", "exciting"]):
                emotion = "excited"
            else:
                emotion = "thoughtful"
                
            # Get avatar from cache
            avatar_key = f"{speaker}_{emotion}"
            if avatar_key in avatar_cache:
                avatar = avatar_cache[avatar_key]
            else:
                # Fallback to any emotion we have for this character
                for key in avatar_cache:
                    if key.startswith(speaker):
                        avatar = avatar_cache[key]
                        break
                else:
                    avatar = create_placeholder_avatar(speaker, "neutral", base_width, base_height)
            
            # Get background from cache
            background = background_cache[i % len(background_settings)]
            
            # Create panel with both background and avatar
            panel = Image.new('RGB', (base_width, base_height), (255, 255, 255))
            
            # Paste background first
            panel.paste(background, (0, 0))
            
            # Crop avatar to focus on face and upper body (top 60%)
            avatar_crop = avatar.crop((0, 0, avatar.width, int(avatar.height * 0.6)))
            
            # Resize avatar to fit in panel
            avatar_width = int(base_width * 0.6)
            avatar_height = int(avatar_width * avatar_crop.height / avatar_crop.width)
            avatar_resized = avatar_crop.resize((avatar_width, avatar_height), Image.LANCZOS)
            
            # Position avatar at bottom of panel
            avatar_x = int((base_width - avatar_width) / 2)
            avatar_y = base_height - avatar_height
            
            # Create avatar mask for smooth blending
            mask = Image.new('L', (avatar_width, avatar_height), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.ellipse((0, 0, avatar_width, avatar_height * 2), fill=255)
            
            # Paste avatar onto panel with mask
            panel.paste(avatar_resized, (avatar_x, avatar_y), mask)
            
            # Draw speech bubble
            draw = ImageDraw.Draw(panel)
            try:
                font = ImageFont.truetype("arial.ttf", 18)
                title_font = ImageFont.truetype("arial.ttf", 22)
            except:
                font = ImageFont.load_default()
                title_font = ImageFont.load_default()

            # Speech bubble at top
            bubble_margin = 20
            bubble_width = base_width - 2 * bubble_margin
            bubble_height = 120
            bubble_y = bubble_margin

            # Draw bubble with color based on speaker
            bubble_color = "#3377cc" if speaker == "Alex" else "#cc3377"
            
            draw.rounded_rectangle(
                [bubble_margin, bubble_y, bubble_margin + bubble_width, bubble_y + bubble_height],
                radius=15, fill="white", outline=bubble_color, width=3
            )

            # Bubble tail pointing to speaker
            tail_x = base_width // 2
            draw.polygon([
                (tail_x - 15, bubble_y + bubble_height),
                (tail_x + 15, bubble_y + bubble_height),
                (tail_x, bubble_y + bubble_height + 15)
            ], fill="white", outline=bubble_color, width=3)

            # Speaker name in color
            draw.text((bubble_margin + 15, bubble_y + 10), speaker, fill=bubble_color, font=title_font)

            # Content text
            wrapped_text = textwrap.fill(content, width=32)
            draw.text((bubble_margin + 15, bubble_y + 40), wrapped_text, fill="black", font=font)

            panel_images.append(panel)

        # 4. Create comic page layout
        page_width = 1100
        page_margins = 50
        panel_margin = 20
        panels_per_row = 2
        panel_width = (page_width - 2 * page_margins - (panels_per_row - 1) * panel_margin) // panels_per_row
        
        # Calculate height needed for each panel (maintaining aspect ratio)
        panel_height = panel_width
        
        # Calculate total height needed
        rows = math.ceil(len(panel_images) / panels_per_row)
        page_height = 2 * page_margins + rows * panel_height + (rows - 1) * panel_margin
        
        # Create the comic page
        comic_page = Image.new('RGB', (page_width, page_height), (240, 240, 240))
        
        # Place each panel on the page
        for i, panel in enumerate(panel_images):
            row = i // panels_per_row
            col = i % panels_per_row
            
            x = page_margins + col * (panel_width + panel_margin)
            y = page_margins + row * (panel_height + panel_margin)
            
            # Resize panel to fit layout
            resized_panel = panel.resize((panel_width, panel_height), Image.LANCZOS)
            comic_page.paste(resized_panel, (x, y))
            
            # Add panel border
            draw = ImageDraw.Draw(comic_page)
            draw.rectangle([x, y, x + panel_width, y + panel_height], outline=(0, 0, 0), width=2)

        # Add title at the top
        draw = ImageDraw.Draw(comic_page)
        try:
            title_font = ImageFont.truetype("arial.ttf", 36)
        except:
            title_font = ImageFont.load_default()
            
        title = "Research Discussion Comic"
        title_width, title_height = draw.textsize(title, font=title_font) if hasattr(draw, 'textsize') else (300, 40)
        draw.text(((page_width - title_width) // 2, page_margins // 2), title, fill=(0, 0, 0), font=title_font)

        # Save final comic
        img_io = BytesIO()
        comic_page.save(img_io, 'PNG', quality=95)
        img_io.seek(0)
        
        return send_file(
            img_io,
            mimetype='image/png',
            as_attachment=True,
            download_name='research_comic.png'
        )

    except Exception as e:
        return jsonify({
            'error': f"Failed to generate comic: {str(e)}",
            'traceback': traceback.format_exc()
        }), 500

def create_placeholder_avatar(character, emotion, width, height):
    """Create a placeholder avatar when image generation fails"""
    avatar = Image.new('RGB', (width, height), (200, 200, 220))
    draw = ImageDraw.Draw(avatar)
    
    # Draw face outline
    face_color = (255, 220, 200)
    draw.ellipse([width//4, height//4, width*3//4, height*3//4], fill=face_color)
    
    # Draw eyes
    eye_color = (50, 100, 150) if character == "Alex" else (100, 50, 150)
    draw.ellipse([width//3, height*2//5, width*2//5, height//2], fill=(255, 255, 255), outline=(0, 0, 0))
    draw.ellipse([width*3//5, height*2//5, width*2//3, height//2], fill=(255, 255, 255), outline=(0, 0, 0))
    draw.ellipse([width//3+5, height*2//5+5, width*2//5-5, height//2-5], fill=eye_color)
    draw.ellipse([width*3//5+5, height*2//5+5, width*2//3-5, height//2-5], fill=eye_color)
    
    # Draw mouth (vary by emotion)
    if emotion in ["greeting", "excited"]:
        # Smile
        draw.arc([width//3, height//2, width*2//3, height*2//3], 0, 180, fill=(0, 0, 0), width=3)
    elif emotion == "concern":
        # Frown
        draw.arc([width//3, height*7//12, width*2//3, height*5//6], 180, 360, fill=(0, 0, 0), width=3)
    elif emotion == "question":
        # Slightly open mouth
        draw.ellipse([width*2//5, height*3//5, width*3//5, height*2//3], fill=(150, 50, 50), outline=(0, 0, 0))
    else:
        # Neutral
        draw.line([width//3, height*3//5, width*2//3, height*3//5], fill=(0, 0, 0), width=3)
    
    # Add hair
    hair_color = (100, 70, 40) if character == "Alex" else (220, 190, 140)
    if character == "Alex":  # Short hair
        draw.rectangle([width//4, height//5, width*3//4, height*2//5], fill=hair_color)
        # Draw glasses
        draw.rectangle([width//3-5, height*2//5, width*2//5+5, height//2], outline=(0, 0, 0), width=2)
        draw.rectangle([width*3//5-5, height*2//5, width*2//3+5, height//2], outline=(0, 0, 0), width=2)
        draw.line([width*2//5+5, height*9//20, width*3//5-5, height*9//20], fill=(0, 0, 0), width=2)
    else:  # Jamie - longer hair
        draw.rectangle([width//5, height//5, width*4//5, height*2//5], fill=hair_color)
        draw.rectangle([width//6, height*2//5, width//4, height*3//5], fill=hair_color)
        draw.rectangle([width*3//4, height*2//5, width*5//6, height*3//5], fill=hair_color)
    
    # Add character name
    try:
        font = ImageFont.truetype("arial.ttf", 24)
    except:
        font = ImageFont.load_default()
    draw.text((width//2, height*4//5), character, fill=(0, 0, 0), font=font, anchor="mm")
    
    return avatar

def create_placeholder_background(setting, width, height):
    """Create a placeholder background when image generation fails"""
    colors = {
        "laboratory": (220, 230, 250),
        "office": (240, 240, 240),
        "hallway": (230, 225, 200),
        "coffee": (210, 190, 170),
        "server": (50, 60, 80),
        "library": (210, 200, 180),
        "meeting": (230, 230, 240),
        "center": (60, 70, 90)
    }
    
    # Determine color based on setting keyword
    bg_color = (220, 220, 220)  # default
    for keyword, color in colors.items():
        if keyword in setting.lower():
            bg_color = color
            break
    
    background = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(background)
    
    # Add simple elements based on setting
    if "laboratory" in setting or "research" in setting:
        # Draw lab equipment outlines
        for i in range(5):
            x = width // 5 * i + width // 10
            y = height // 3
            draw.rectangle([x-30, y-30, x+30, y+30], outline=(100, 100, 100), width=2)
            draw.line([x, y-30, x, y+30], fill=(100, 100, 100), width=2)
    
    elif "office" in setting or "computer" in setting:
        # Draw computer monitors
        for i in range(3):
            x = width // 4 * (i+1)
            y = height // 3
            draw.rectangle([x-40, y-30, x+40, y+30], outline=(80, 80, 80), width=3)
            draw.rectangle([x-10, y+30, x+10, y+40], outline=(80, 80, 80), width=2)
            draw.rectangle([x-20, y+40, x+20, y+45], fill=(80, 80, 80))
    
    elif "server" in setting:
        # Draw server racks
        for i in range(5):
            x = width // 6 * (i+1)
            draw.rectangle([x-30, height//5, x+30, height*4//5], fill=(40, 40, 40), outline=(30, 30, 30))
            for j in range(10):
                y = height//5 + j * height//20
                draw.line([x-25, y, x+25, y], fill=(60, 60, 60), width=1)
                draw.rectangle([x+15, y+2, x+20, y+5], fill=(0, 255, 0))  # Green LED
    
    else:
        # Generic background with grid
        for i in range(0, width, 40):
            draw.line([i, 0, i, height], fill=(max(bg_color[0]-30, 0), max(bg_color[1]-30, 0), max(bg_color[2]-30, 0)), width=1)
        for i in range(0, height, 40):
            draw.line([0, i, width, i], fill=(max(bg_color[0]-30, 0), max(bg_color[1]-30, 0), max(bg_color[2]-30, 0)), width=1)
    
    # Add text label at bottom
    try:
        font = ImageFont.truetype("arial.ttf", 16)
    except:
        font = ImageFont.load_default()
    
    setting_short = setting[:20] + "..." if len(setting) > 20 else setting
    draw.rectangle([0, height-25, width, height], fill=(0, 0, 0, 128))
    draw.text((width//2, height-12), setting_short, fill=(255, 255, 255), font=font, anchor="mm")
    
    return background

## little bit working, but the text content is static not dynamic for each attached pdf 
# @app.route('/generate-comic', methods=['POST'])
# def handle_generate_comic():
#     try:
#         # 1. Get text content (simplified for this example)
#         text_content = """
#         Researcher1: Healthcare systems are vulnerable to cyber attacks.
#         Researcher2: Yes, we analyzed networks using Wireshark.
#         Researcher1: What did you find?
#         Researcher2: Many security holes in packet transmissions!
#         Researcher1: That's dangerous for patient data.
#         Researcher2: Exactly! We need better protection.
#         Researcher1: How can hospitals improve security?
#         Researcher2: Regular network monitoring is essential.
#         Researcher1: What tools do you recommend?
#         Researcher2: Wireshark helps detect intrusions.
#         Researcher1: Let's publish these findings!
#         Researcher2: Agreed, awareness is crucial.
#         """
        
#         # 2. Split into conversation lines
#         panels_text = [line.strip() for line in text_content.split('\n') if line.strip()]
#         panels_text = panels_text[:12]  # Limit to 12 panels max

#         # 3. Generate smaller comic panel images (300x300) with simple dialogues
#         panel_images = []
#         for panel_text in panels_text:
#             # Generate simpler AI image prompt based on content
#             prompt = "Digital healthcare security, comic book style: " + panel_text.split(':')[1][:30]
            
#             # Create smaller image (300x300)
#             if comic_pipe:
#                 img = comic_pipe(prompt).images[0].resize((300, 300))
#             else:
#                 img = Image.new('RGB', (300, 300), color=(245,245,245))
                
#             # Add simpler speech bubble at bottom
#             draw = ImageDraw.Draw(img)
#             try:
#                 font = ImageFont.truetype("arial.ttf", 16)
#             except:
#                 font = ImageFont.load_default()
                
#             # Speech bubble dimensions
#             bubble_w = 280
#             bubble_h = 60
#             bubble_x = 10
#             bubble_y = 230
            
#             # Draw bubble and text
#             draw.rounded_rectangle(
#                 [bubble_x, bubble_y, bubble_x+bubble_w, bubble_y+bubble_h],
#                 radius=10, fill="white", outline="black", width=2
#             )
            
#             # Split speaker and dialogue
#             parts = panel_text.split(':')
#             speaker = parts[0]
#             dialogue = ':'.join(parts[1:])
            
#             # Add speaker tag
#             draw.text((bubble_x+10, bubble_y+5), speaker, fill="blue", font=font)
            
#             # Add wrapped dialogue
#             wrapped = textwrap.fill(dialogue, width=35)
#             draw.text((bubble_x+10, bubble_y+25), wrapped, fill="black", font=font)
            
#             panel_images.append(img)

#         # 4. Arrange panels into a grid (4x3 max)
#         cols = min(4, len(panel_images))
#         rows = (len(panel_images) + cols - 1) // cols
#         grid_w = cols * 300
#         grid_h = rows * 300
#         grid_img = Image.new('RGB', (grid_w, grid_h), color=(255,255,255))
        
#         for idx, panel in enumerate(panel_images):
#             x = (idx % cols) * 300
#             y = (idx // cols) * 300
#             grid_img.paste(panel, (x, y))

#         # 5. Return the image
#         img_io = BytesIO()
#         grid_img.save(img_io, 'PNG')
#         img_io.seek(0)

#         return send_file(
#             img_io,
#             mimetype='image/png',
#             as_attachment=True,
#             download_name='healthcare-security-comic.png'
#         )
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

# @app.route('/generate-comic', methods=['POST'])
# def handle_generate_comic():
#     try:
#         # 1. Get text content from PDF or text input
#         if 'pdf' in request.files:
#             file = request.files['pdf']
#             if file.filename == '':
#                 return jsonify({'error': 'No selected file'}), 400
#             if not file.filename.lower().endswith('.pdf'):
#                 return jsonify({'error': 'Only PDF files are allowed'}), 400

#             temp_dir = tempfile.mkdtemp()
#             temp_pdf_path = os.path.join(temp_dir, secure_filename(file.filename))
#             file.save(temp_pdf_path)

#             try:
#                 loader = PyPDFLoader(temp_pdf_path)
#                 documents = loader.load()
#                 text_content = "\n".join([doc.page_content for doc in documents])
#             finally:
#                 if os.path.exists(temp_pdf_path):
#                     try:
#                         os.remove(temp_pdf_path)
#                     except:
#                         pass
#         else:
#             text_content = request.form.get('content')
#             if not text_content:
#                 return jsonify({'error': 'Content is required'}), 400

#         # 2. Split content into 8-12 key sentences for comic panels
#         import re
#         sentences = re.split(r'(?<=[.!?])\s+', text_content.strip())
#         panels_text = [s for s in sentences if len(s) > 30][:12]  # Only take longer, meaningful sentences

#         if len(panels_text) < 8:
#             # If not enough sentences, split by lines or use shorter ones
#             panels_text = text_content.strip().split('\n')
#             panels_text = [s for s in panels_text if len(s) > 10][:12]

#         if not panels_text:
#             panels_text = [text_content[:100]]

#         # 3. Generate comic panel images and overlay speech bubbles
#         panel_images = []
#         for panel_text in panels_text:
#             # Generate AI image for each panel
#             prompt = f"Comic book style illustration: {panel_text[:100]}"
#             if comic_pipe:
#                 img = comic_pipe(prompt).images[0].resize((512, 512))
#             else:
#                 img = Image.new('RGB', (512, 512), color=(255,255,255))
#             # Add speech bubble
#             draw = ImageDraw.Draw(img)
#             try:
#                 font = ImageFont.truetype("arial.ttf", 28)
#             except:
#                 font = ImageFont.load_default()
#             bubble_w = 480
#             bubble_h = 80
#             draw.rectangle([16, 16, 16+bubble_w, 16+bubble_h], fill=(255,255,255,220), outline="black", width=3)
#             wrapped = textwrap.fill(panel_text, width=40)
#             draw.text((28, 28), wrapped, fill=(0,0,0), font=font)
#             panel_images.append(img)

#         # 4. Arrange panels into a grid (e.g., 3x4)
#         cols = 4
#         rows = (len(panel_images) + cols - 1) // cols
#         grid_w = cols * 512
#         grid_h = rows * 512
#         grid_img = Image.new('RGB', (grid_w, grid_h), color=(255,255,255))
#         for idx, panel in enumerate(panel_images):
#             x = (idx % cols) * 512
#             y = (idx // cols) * 512
#             grid_img.paste(panel, (x, y))

#         # 5. Return the image as a response
#         img_io = BytesIO()
#         grid_img.save(img_io, 'PNG')
#         img_io.seek(0)

#         return send_file(
#             img_io,
#             mimetype='image/png',
#             as_attachment=True,
#             download_name='comic.png'
#         )
#     except Exception as e:
#         return jsonify({
#             'error': f'Error generating comic: {str(e)}',
#             'traceback': traceback.format_exc()
#         }), 500

# @app.route('/generate-comic', methods=['POST'])
# def handle_generate_comic():
#     try:
#         # 1. Get text content from PDF or text input
#         if 'pdf' in request.files:
#             file = request.files['pdf']
#             if file.filename == '':
#                 return jsonify({'error': 'No selected file'}), 400
#             if not file.filename.lower().endswith('.pdf'):
#                 return jsonify({'error': 'Only PDF files are allowed'}), 400

#             temp_dir = tempfile.mkdtemp()
#             temp_pdf_path = os.path.join(temp_dir, secure_filename(file.filename))
#             file.save(temp_pdf_path)

#             try:
#                 loader = PyPDFLoader(temp_pdf_path)
#                 documents = loader.load()
#                 text_content = "\n".join([doc.page_content for doc in documents])
#             finally:
#                 if os.path.exists(temp_pdf_path):
#                     try:
#                         os.remove(temp_pdf_path)
#                     except:
#                         pass
#         else:
#             text_content = request.form.get('content')
#             if not text_content:
#                 return jsonify({'error': 'Content is required'}), 400

#         # 2. Summarize or extract a main idea for the comic prompt
#         prompt = f"Comic book style illustration summarizing: {text_content[:300]}"

#         # 3. Generate image using Stable Diffusion if available
#         if comic_pipe:
#             image = comic_pipe(prompt).images[0]
#             image = image.resize((800, 600))
#         else:
#             # Fallback: plain white image
#             from PIL import Image
#             image = Image.new('RGB', (800, 600), color=(255, 255, 255))

#         # 4. Overlay a comic title or speech bubble
#         from PIL import ImageDraw, ImageFont
#         draw = ImageDraw.Draw(image)
#         try:
#             font = ImageFont.truetype("arial.ttf", 40)
#         except:
#             font = ImageFont.load_default()
#         # Draw a simple speech bubble or title at the top
#         title = "AI Comic"
#         draw.rectangle([30, 30, 770, 110], fill=(255,255,255,200), outline="black", width=3)
#         draw.text((50, 50), title, fill=(0,0,0), font=font)

#         # Optionally, add a short summary at the bottom
#         summary = text_content[:80] + ("..." if len(text_content) > 80 else "")
#         draw.rectangle([30, 500, 770, 580], fill=(255,255,255,200), outline="black", width=3)
#         draw.text((50, 520), summary, fill=(0,0,0), font=font)

#         # 5. Return the image as a response
#         img_io = BytesIO()
#         image.save(img_io, 'PNG')
#         img_io.seek(0)

#         return send_file(
#             img_io,
#             mimetype='image/png',
#             as_attachment=True,
#             download_name='comic.png'
#         )
#     except Exception as e:
#         return jsonify({
#             'error': f'Error generating comic: {str(e)}',
#             'traceback': traceback.format_exc()
#         }), 500

# @app.route('/generate-comic', methods=['POST'])
# def handle_generate_comic():
#     try:
#         # If PDF is uploaded
#         if 'pdf' in request.files:
#             file = request.files['pdf']
#             if file.filename == '':
#                 return jsonify({'error': 'No selected file'}), 400
#             if not file.filename.lower().endswith('.pdf'):
#                 return jsonify({'error': 'Only PDF files are allowed'}), 400

#             temp_dir = tempfile.mkdtemp()
#             temp_pdf_path = os.path.join(temp_dir, secure_filename(file.filename))
#             file.save(temp_pdf_path)

#             try:
#                 loader = PyPDFLoader(temp_pdf_path)
#                 documents = loader.load()
#                 text_content = "\n".join([doc.page_content for doc in documents])
#             finally:
#                 if os.path.exists(temp_pdf_path):
#                     try:
#                         os.remove(temp_pdf_path)
#                     except:
#                         pass
#         else:
#             # If text content is provided
#             text_content = request.form.get('content')
#             if not text_content:
#                 return jsonify({'error': 'Content is required'}), 400

#         # Now, generate a comic image from text_content
#         # For demonstration, create a simple comic image with PIL
#         from PIL import Image, ImageDraw, ImageFont
#         import io

#         img = Image.new('RGB', (800, 600), color=(255, 255, 255))
#         d = ImageDraw.Draw(img)
#         try:
#             font = ImageFont.truetype("arial.ttf", 40)
#         except:
#             font = ImageFont.load_default()
#         d.text((50, 50), "Generated Comic", fill=(0, 0, 0), font=font)
#         d.text((50, 150), text_content[:200] + "...", fill=(0, 0, 0), font=font)

#         img_io = io.BytesIO()
#         img.save(img_io, 'PNG')
#         img_io.seek(0)

#         return send_file(
#             img_io,
#             mimetype='image/png',
#             as_attachment=True,
#             download_name='comic.png'
#         )
#     except Exception as e:
#         return jsonify({
#             'error': f'Error generating comic: {str(e)}',
#             'traceback': traceback.format_exc()
#         }), 500

# @app.route('/generate-comic', methods=['POST'])
# def generate_comic():
#     try:
#         # Check if request contains file upload
#         if 'pdf' in request.files:
#             file = request.files['pdf']
#             if file.filename == '':
#                 return jsonify({'error': 'No selected file'}), 400
            
#             if not file.filename.lower().endswith('.pdf'):
#                 return jsonify({'error': 'Only PDF files are allowed'}), 400
                
#             # Process PDF file
#             temp_dir = tempfile.mkdtemp()
#             temp_pdf_path = os.path.join(temp_dir, secure_filename(file.filename))
#             file.save(temp_pdf_path)
            
#             try:
#                 loader = PyPDFLoader(temp_pdf_path)
#                 documents = loader.load()
#                 text_content = "\n".join([doc.page_content for doc in documents])
#             finally:
#                 if os.path.exists(temp_pdf_path):
#                     try:
#                         os.remove(temp_pdf_path)
#                     except:
#                         pass
#         else:
#             # Process text content
#             text_content = request.form.get('content')
#             if not text_content:
#                 return jsonify({'error': 'Content is required'}), 400

#         # Generate comic from text_content using your AI model
#         # Replace this with your actual comic generation logic
#         # For now, we'll just return a placeholder
        
#         # Create a simple image with PIL for demonstration
#         from PIL import Image, ImageDraw, ImageFont
#         import io
        
#         img = Image.new('RGB', (800, 600), color=(255, 255, 255))
#         d = ImageDraw.Draw(img)
        
#         try:
#             font = ImageFont.truetype("arial.ttf", 40)
#         except:
#             font = ImageFont.load_default()
            
#         d.text((50, 50), "Generated Comic", fill=(0, 0, 0), font=font)
#         d.text((50, 150), text_content[:100] + "...", fill=(0, 0, 0), font=font)
        
#         img_io = io.BytesIO()
#         img.save(img_io, 'PNG')
#         img_io.seek(0)
        
#         return send_file(
#             img_io,
#             mimetype='image/png',
#             as_attachment=True,
#             download_name='comic.png'
#         )
        
#     except Exception as e:
#         return jsonify({
#             'error': f'Internal server error: {str(e)}',
#             'traceback': traceback.format_exc()
#         }), 500

## a bit good approach for video
@app.route('/generate-video', methods=['POST'])
def generate_video():
    try:
        # Get the summary text from the request
        data = request.get_json()
        if not data or 'summary_text' not in data:
            return jsonify({'error': 'No summary text provided'}), 400
        
        summary_text = data['summary_text']
        
        # Optional parameters with defaults
        video_style = data.get('video_style', 'modern')
        resolution = data.get('resolution', '720p')
        
        # Create a temporary directory for the video generation
        temp_dir = tempfile.mkdtemp()
        frames_dir = os.path.join(temp_dir, "frames")
        os.makedirs(frames_dir, exist_ok=True)
        output_path = os.path.join(temp_dir, "summary_video.mp4")
        
        try:
            # Create slides from the summary text
            slides = []
            sections = re.split(r'\n\s*##\s+', summary_text)
            
            # Process first section (might not have a title)
            if not sections[0].strip().startswith('# '):
                # If first section doesn't start with a heading
                intro_text = sections[0].strip()
                if intro_text:
                    slides.append({
                        'title': 'Introduction',
                        'content': intro_text
                    })
                sections = sections[1:]  # Remove the first section
            
            # Process remaining sections
            for section in sections:
                lines = section.strip().split('\n')
                if not lines:
                    continue
                    
                title = lines[0].strip()
                content = '\n'.join(lines[1:]).strip()
                
                slides.append({
                    'title': title,
                    'content': content
                })
            
            # Generate frames using PIL instead of MoviePy
            from PIL import Image, ImageDraw, ImageFont
            import textwrap
            
            # Set resolution
            if resolution == '720p':
                width, height = 1280, 720
            elif resolution == '1080p':
                width, height = 1920, 1080
            else:
                width, height = 1280, 720  # Default
            
            # Try to load fonts, fallback to default if not available
            try:
                title_font = ImageFont.truetype("arial.ttf", 60)
                content_font = ImageFont.truetype("arial.ttf", 30)
            except IOError:
                # Fallback to default font
                title_font = ImageFont.load_default()
                content_font = ImageFont.load_default()
            
            # Define styles
            if video_style == 'modern':
                bg_color = (25, 25, 112)  # Dark blue
                title_color = (255, 255, 255)  # White
                content_bg = (240, 240, 240)  # Light gray
                content_color = (0, 0, 0)  # Black
            else:  # Default style
                bg_color = (0, 0, 128)  # Navy
                title_color = (255, 255, 255)  # White
                content_bg = (255, 255, 255)  # White
                content_color = (0, 0, 0)  # Black
            
            # Create title slide
            title_img = Image.new('RGB', (width, height), bg_color)
            draw = ImageDraw.Draw(title_img)
            
            main_title = "Video-Generated Summary"
            title_w, title_h = draw.textsize(main_title, font=title_font) if hasattr(draw, 'textsize') else (width//2, 60)
            draw.text(((width-title_w)//2, height//2 - title_h//2), main_title, fill=title_color, font=title_font)
            
            # Save frames for each second (assuming 24fps)
            for i in range(24 * 3):  # 3 seconds for title
                title_img.save(os.path.join(frames_dir, f"frame_{i:05d}.jpg"), quality=95)
            
            frame_count = 24 * 3  # Start from after title frames
            
            # Create a frame for each slide
            for slide_idx, slide in enumerate(slides):
                # Create new image
                img = Image.new('RGB', (width, height), bg_color)
                draw = ImageDraw.Draw(img)
                
                # Draw title
                draw.rectangle([(0, 0), (width, 120)], fill=bg_color)
                title_w, title_h = draw.textsize(slide['title'], font=title_font) if hasattr(draw, 'textsize') else (width//2, 60)
                draw.text(((width-title_w)//2, 30), slide['title'], fill=title_color, font=title_font)
                
                # Draw content in a box
                draw.rectangle([(40, 140), (width-40, height-40)], fill=content_bg)
                
                # Wrap and draw content text
                content = slide['content']
                if len(content) > 500:  # Truncate if too long
                    content = content[:497] + "..."
                
                # Break content into manageable lines
                wrapper = textwrap.TextWrapper(width=70)
                lines = wrapper.wrap(content)
                
                y_position = 160
                for line in lines:
                    draw.text((60, y_position), line, fill=content_color, font=content_font)
                    y_position += 40
                
                # Calculate duration based on content length (1 second per 10 chars, min 5, max 15)
                duration = max(5, min(len(content) // 10, 15))
                
                # Save each frame for this slide
                for i in range(24 * duration):  # 24fps * duration in seconds
                    img.save(os.path.join(frames_dir, f"frame_{frame_count + i:05d}.jpg"), quality=95)
                
                frame_count += 24 * duration
            
            # Use FFMPEG directly via subprocess to create video from frames
            import subprocess
            
            # Construct ffmpeg command
            ffmpeg_cmd = [
                'ffmpeg',
                '-y',  # Overwrite output file if it exists
                '-framerate', '24',
                '-i', os.path.join(frames_dir, 'frame_%05d.jpg'),
                '-c:v', 'libx264',
                '-profile:v', 'high',
                '-crf', '20',  # Quality (lower is better)
                '-pix_fmt', 'yuv420p',
                output_path
            ]
            
            # Run ffmpeg
            subprocess.run(ffmpeg_cmd, check=True)
            
            # Check if the video was created
            if not os.path.exists(output_path):
                return jsonify({'error': 'Failed to create video file'}), 500
            
            # Return the video file
            return send_file(output_path, as_attachment=True, 
                            download_name='summary_video.mp4',
                            mimetype='video/mp4')
            
        finally:
            # Clean up temporary files
            import shutil
            try:
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Error cleaning up: {e}")
                
    except Exception as e:
        return jsonify({
            'error': f'Error generating video: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500
                                        
if __name__ == '__main__':
    os.makedirs('templates', exist_ok=True)
    app.run(debug=True, port=5000)
        