from typing import Optional
from flask import jsonify
from groq import Groq
import os
from groqclould.system_prompt import instructions,chatInstructions
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("API key for Groq is not set in the environment variables.")

client = Groq(api_key=api_key)
MODEL = "llama3-70b-8192"


def get_groq_response(prefix: str, currentLine: str, suffix: str, language: str) -> str:
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                instructions(language),
                {"role": "user", "content": prefix, "name": "prefix"},
                {"role": "user", "content": currentLine, "name": "currentLine"},
                {"role": "user", "content": suffix, "name": "suffix"},
            ],
            max_tokens=256,
            temperature=0.5,
        )
        return response.choices[0].message.content
    except Exception as e:
        return str(e)


def answer_user_query(question: str) -> str:
    if not question:
        return jsonify({"error": "'question' parameter is required."}), 400

    try:
        chat_completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                chatInstructions(),
                {
                    "role": "system",
                    "content": "You are a helpful assistant."
                },
                {
                    "role": "user",
                    "content": question,
                }
            ],
            temperature=0.5,
            max_tokens=1024,
        )
        answer = chat_completion.choices[0].message.content.strip() if chat_completion.choices else None
        return jsonify({"answer": answer if answer else "No answer available."})
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

