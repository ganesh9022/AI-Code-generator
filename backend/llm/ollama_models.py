import ollama
import json
from typing import Optional
from ollama import generate
import os

def get_absolute_path(relative_path) -> str:
    abs_path=os.path.dirname(os.path.abspath(__file__))
    return os.path.join(abs_path, relative_path)

def ask_question(question: str) -> str:
    with open(get_absolute_path('ollama.config.json'), "r") as config_file:
            config = json.load(config_file)
    try:
        response = ollama.chat(model=config["model"], messages=[
            {
                'role': 'user',
                'content': question,
            },
        ])
        print(response)
        return response['message']['content']
    except Exception as e:
        return f"An error occurred: {str(e)}"
    


def generate_code(
    prompt: str,
    suffix: Optional[str] = None, 
) -> dict:
    """
    Args:
        prompt (str): The text prompt to guide the generation.
        suffix (Optional[str]): Text appended after the generation.
        template (str): Template or programming language for code generation (e.g., 'Python').

    Returns:
        dict: The response formatted as { "next_line": "Generated code" }.
    """
    try:
        # Load configuration from JSON file
        with open(get_absolute_path('ollama.config.json'), "r") as config_file:
            config = json.load(config_file)
        
        response = generate(
            model=config["model"],
            prompt=prompt,
            suffix=suffix,
            options=config.get("options"),
        )
        
        return {"next_line": response['response']} 
    except Exception as e:
        return {"next_line": f"An error occurred: {str(e)}"}
