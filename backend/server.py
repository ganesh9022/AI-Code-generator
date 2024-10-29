import ast
import logging
import os
import re
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional
from rapidfuzz import fuzz

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FunctionRequest(BaseModel):
    function_name: str

repo_path = "/home/pst/Syncup"

language_patterns = {
    'javascript': (r"function\s+(\w+)\s*\(", "Found JavaScript function: {}"),
    'java': (r"(public|private|protected)?\s*(static)?\s*(\w+)\s+(\w+)\s*\(.*?\)\s*{", "Found Java function: {}"),
    'cpp': (r"(\w+)\s+(\w+)\s*\(.*?\)\s*{", "Found C++ function: {}"),
    'go': (r"func\s+(\w+)\s*\(.*?\)\s*{", "Found Go function: {}"),
}

def extract_functions(file_path: str, language: str) -> Dict[str, str]:
    functions = {}

    try:
        with open(file_path, "r") as f:
            source = f.read()

        if language in language_patterns:
            pattern, log_message = language_patterns[language]
            matches = re.finditer(pattern, source)
            for match in matches:
                function_name = match.group(1) if language != 'java' else match.group(4)
                functions[function_name] = source[match.start():]
                logger.debug(log_message.format(function_name))
        else:
            logger.warning("Unsupported language specified: %s", language)

    except Exception as e:
        logger.error("Error parsing %s file %s: %s", language.capitalize(), file_path, e)

    return functions

def extract_functions_from_repo(repo_path: str) -> Dict[str, str]:
    functions = {}
    for root, _, files in os.walk(repo_path):
        for file in files:
            file_path = os.path.join(root, file)
            if file.endswith(".py"):
                try:
                    with open(file_path, "r") as f:
                        source = f.read()
                    tree = ast.parse(source)
                    for node in ast.walk(tree):
                        if isinstance(node, ast.FunctionDef):
                            functions[node.name] = ast.get_source_segment(source, node)
                            logger.debug("Found Python function: %s", node.name)
                except Exception as e:
                    logger.error("Error parsing Python file %s: %s", file_path, e)
            elif file.endswith(".js"):
                functions.update(extract_functions(file_path, 'javascript'))
            elif file.endswith(".java"):
                functions.update(extract_functions(file_path, 'java'))
            elif file.endswith(".cpp"):
                functions.update(extract_functions(file_path, 'cpp'))
            elif file.endswith(".go"):
                functions.update(extract_functions(file_path, 'go'))
            else:
                logger.warning("Unsupported file type: %s", file)

    return functions

def find_best_matching_function(target_name: str, functions: Dict[str, str]) -> Optional[tuple]:
    best_match = None
    best_score = 0
    for name, code in functions.items():
        score = fuzz.ratio(target_name, name)
        if score > best_score:
            best_score = score
            best_match = (name, code)
    return best_match

repo_functions = extract_functions_from_repo(repo_path)

@app.post("/find-function/")
async def find_function(request: FunctionRequest):
    logger.info("Received request to find function: %s", request.function_name)

    matched_function = find_best_matching_function(request.function_name, repo_functions)

    if matched_function:
        function_name, function_code = matched_function
        logger.info("Function '%s' matched successfully.", function_name)
        return {
            "function_name": function_name,
            "code": function_code,
        }
    else:
        logger.warning("No matching function found for '%s'", request.function_name)
        raise HTTPException(status_code=404, detail="No matching function found.")
