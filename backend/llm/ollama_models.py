import ollama
import json
from typing import Optional
from ollama import generate
import os

def get_absolute_path(relative_path) -> str:
    abs_path=os.path.dirname(os.path.abspath(__file__))
    return os.path.join(abs_path, relative_path)


def generate_code(
    prompt: str,
    suffix: Optional[str] = None,
    language: str = '',
) -> str:
    """
    Args:
        prompt (str): The text prompt to guide the generation.
        suffix (Optional[str]): Text appended after the generation.
        language (str): The programming language for the code generation.

    Returns:
        str: The response generated code as a formatted string.
    """
    try:
        # Load configuration from JSON file
        with open(get_absolute_path('ollama.config.json'), "r") as config_file:
            config = json.load(config_file)

        enhanced_prompt = f"Write a program in {language} for :\n{prompt}"
        response = generate(
            model=config["model"],
            prompt=enhanced_prompt,
            suffix=suffix,
            options=config.get("options"),
        )
        return response['response']
    except Exception as e:
        return {"next_line": f"An error occurred: {str(e)}"}

def ask_question(question: str) -> str:
    with open(get_absolute_path('ollama.config.json'), "r") as config_file:
        config = json.load(config_file)
    response = ollama.chat(model=config["model"], messages=[
        {
            'role': 'user',
            'content': question,
        },
    ])
    return response['message']['content']

