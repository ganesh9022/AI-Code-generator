from flask import jsonify
import ollama
import json
from typing import Optional
from ollama import generate,create
# olllma.create.code_generator("ollama")
import os
from .system_prompt import ollama_instructions
def get_absolute_path(relative_path) -> str:
    abs_path=os.path.dirname(os.path.abspath(__file__))
    return os.path.join(abs_path, relative_path)


def generate_code(
    prompt: str,
    suffix: Optional[str] = None,
    prefix: Optional[str] = None,
    language: str = '',
) -> str:
    """
    Args:
        prompt (str): The text prompt to guide the generation.
        suffix (Optional[str]): A suffix to guide the code generation, if applicable.
        prefix (Optional[str]): A prefix to guide the code generation, if applicable.
        language (str): The programming language for the code generation.

    Returns:
        str: The response generated code as a formatted string.
    """
    try:
        # Load configuration from JSON file
        with open(get_absolute_path('ollama.config.json'), "r") as config_file:
            config = json.load(config_file)

        response = ollama.chat(
            model=config["model"],
            messages=[
                ollama_instructions(language),
                {"role": "user", "content": prompt},
                {"role": "user", "content": suffix},
                {"role":"user","content":prefix}
            ],
        )
        return response['message']['content']
    except Exception as e:
        return {"next_line": f"An error occurred: {str(e)}"}

def ask_question(question: str):
    if not question:
        return jsonify({"error": "'question' parameter is required."}), 400

    try:
        with open(get_absolute_path('chat_ollama.config.json'), "r") as config_file:
            config = json.load(config_file)

        system_message = {
            'role': 'system',
            'content': config.get('system')
        }
        user_message = {
            'role': 'user',
            'content': question
        }
        messages = [system_message, user_message]

        model_options = config.get("options", {})

        response = ollama.chat(
            model=config["model"],
            messages=messages,
            options=model_options,
        )

        answer = response.message.content if response.message else "No response from the model."

        return jsonify({"answer": answer})

    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

