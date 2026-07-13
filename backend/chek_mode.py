import google.generativeai as genai
import os
from dotenv import load_dotenv

# .env එක load කිරීම
load_dotenv()

# API Key එක configure කිරීම
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ලබා ගත හැකි සියලුම මාදිලි පෙන්වීම
print("Available Models:")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"- {m.name}")