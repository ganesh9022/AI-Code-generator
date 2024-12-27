from typing import Optional
from flask import jsonify
from groq import Groq
import os
from groqclould.system_prompt import SYSTEM_PROMPT
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("API key for Groq is not set in the environment variables.")

client = Groq(api_key=api_key)
MODEL = "llama3-70b-8192"


def get_groq_response(prompt_content):
    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt_content},
            ],
            max_tokens=256,
            temperature=0.5,
        )
        return response.choices[0].message.content
    except Exception as e:
        return str(e)


def generate_code_suggestion(
    prompt: str,
    suffix: Optional[str] = None,
) -> dict:
    print(f"prompt={prompt}, suffix={suffix}")
    if not prompt or not suffix:
        return (
            jsonify({"error": "Both 'prompt' and 'suffix' parameters are required."}),
            400,
        )

    input_prompt = f"{SYSTEM_PROMPT}\n\n**Code Context**:\nSurrounding Code:\n{prompt}\n\n### Current Line\n{suffix}"
    generated_code = get_groq_response(input_prompt)

    return jsonify(
        {
            "suggested_code": (
                generated_code if generated_code else "No suggestion available."
            )
        }
    )


def answer_user_query(question: str) -> str:
    if not question:
        return jsonify({"error": "'question' parameter is required."}), 400

    input_prompt = f"Answer the following question:\n{question}"
    answer = get_groq_response(input_prompt)

    return jsonify({"answer": answer if answer else "No answer available."})
