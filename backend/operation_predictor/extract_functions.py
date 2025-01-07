import os
import ast
import re
import json
import subprocess
import shutil
from typing import List, Dict
from llm.ollama_models import get_absolute_path


def generate_input_examples(func_name: str) -> List[str]:
    """
    Generate input examples based on function name.
    Includes full name and half name.
    """
    # Generate half name (half of the function name)
    half_name = func_name[:len(func_name)//2]

    return [half_name, func_name]


def is_valid_python(file_path: str) -> bool:
    """
    Check if a file contains valid Python syntax.
    """
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
        compile(content, file_path, 'exec')
        return True
    except (SyntaxError, ValueError):
        return False


def extract_functions_from_file(file_path: str) -> List[Dict]:
    """
    Extract functions from a Python file and format them.
    """
    with open(file_path, "r", encoding="utf-8") as file:
        try:
            tree = ast.parse(file.read())
        except SyntaxError as e:
            print(f"Skipping file due to syntax error: {file_path}")
            print(f"Error: {e}")
            return []

    functions = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            func_name = node.name
            # Get the entire function definition as a single line
            func_code = " ".join(ast.unparse(node).splitlines())
            functions.append({
                "operation": func_name.capitalize(),
                "function": func_code,
                "input_examples": generate_input_examples(func_name),
            })
    return functions


def extract_functions_from_repo(repo_path: str) -> List[Dict]:
    """
    Walk through a repository and extract functions from all Python files.
    """
    extracted_functions = []
    for root, _, files in os.walk(repo_path):
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                if is_valid_python(file_path):  # Validate before parsing
                    extracted_functions.extend(extract_functions_from_file(file_path))
                else:
                    print(f"Skipping invalid Python file: {file_path}")
    return extracted_functions


def clone_repo(repo_url: str, temp_dir: str) -> str:
    """
    Clone the repository into a temporary directory.
    """
    print(f"Cloning the repository: {repo_url} into {temp_dir}")
    subprocess.run(["git", "clone", repo_url, temp_dir], check=True)
    return temp_dir


def delete_temp_repo(temp_dir: str):
    """
    Delete the cloned repository after processing.
    """
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)
        print(f"Deleted temporary repository at {temp_dir}")


if __name__ == "__main__":
    repo_url = 'git@github.com:positsource/airflow-dags.git'  # Replace with the actual repository URL
    temp_dir = '/tmp/temp_repo'  # Temporary directory for cloning

    # Clone the repository temporarily
    cloned_repo_path = clone_repo(repo_url, temp_dir)

    try:
        # Extract functions from the cloned repository
        functions = extract_functions_from_repo(cloned_repo_path)

        # Output file path
        output_file = get_absolute_path('operations_data.json')

        # Save to a JSON file
        with open(output_file, "w", encoding="utf-8") as json_file:
            json.dump(functions, json_file, indent=4, ensure_ascii=False)

        print(f"Extracted functions saved to {output_file}")
    finally:
        # Delete the cloned repository after processing
        delete_temp_repo(cloned_repo_path)