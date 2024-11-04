import ast
import logging
import os
import re
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List, Optional
from rapidfuzz import fuzz
from fastapi.responses import PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"], 
)

logger = logging.getLogger(__name__)  

class FunctionRequest(BaseModel):
    function_name: str
    repo_paths: Optional[List[str]] = None

default_repo_paths = [
   "/home/pst/Syncup"
]

def extract_python_functions(file_path: str, language: str) -> Dict[str, str]:
    functions = {}
    try:
        with open(file_path, "r") as f:
            source = f.read()
        tree = ast.parse(source)
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions[node.name] = ast.get_source_segment(source, node)
                logger.debug("Found %s function: %s", language, node.name)
    except Exception as e:
        logger.error("Error parsing %s file %s: %s", language, file_path, e)
    return functions

def extract_js_ts_functions(file_path: str, language: str) -> Dict[str, str]:
    functions = {}
    try:
        with open(file_path, "r") as f:
            source = f.read()
        matches = re.finditer(
            r"(export\s+(const|async\s+function|function)\s+|const\s+|let\s+)?(\w+)\s*=\s*(async\s*)?\(?[^\{]*?\)\s*=>\s*|\bfunction\s+(\w+)\s*\(.*?\)\s*{",
            source,
            re.DOTALL,
        )
        for match in matches:
            function_name = match.group(3) or match.group(5)
            function_code = match.group(0)
            start = match.start(0)
            open_brace_index = source.find('{', start)
            if open_brace_index != -1:
                brace_count = 1
                end_index = open_brace_index + 1
                while end_index < len(source) and brace_count > 0:
                    if source[end_index] == '{':
                        brace_count += 1
                    elif source[end_index] == '}':
                        brace_count -= 1
                    end_index += 1
                if brace_count == 0:
                    function_code = source[match.start():end_index]
                    if function_name:
                        functions[function_name] = function_code
                        logger.debug("Found %s function: %s", language, function_name)
    except Exception as e:
        logger.error("Error parsing %s file %s: %s", language, file_path, e)
    return functions

extractors = {
    ".py": (extract_python_functions, "Python"),
    ".js": (extract_js_ts_functions, "JavaScript"),
    ".jsx": (extract_js_ts_functions, "JavaScript"),
    ".ts": (extract_js_ts_functions, "TypeScript"),
    ".tsx": (extract_js_ts_functions, "TypeScript"),
}

def extract_functions_from_repo(repo_paths: List[str]) -> Dict[str, str]:
    all_functions = {}
    for repo_path in repo_paths:
        for root, _, files in os.walk(repo_path):
            for file in files:
                file_extension = os.path.splitext(file)[1]
                file_path = os.path.join(root, file)
                extractor, language = extractors.get(file_extension, (None, None))
                if extractor:
                    functions = extractor(file_path, language)
                    all_functions.update(functions)
    return all_functions

def find_best_matching_function(target_name, functions):
    best_match = None
    best_score = 0
    for name, code in functions.items():
        score = fuzz.ratio(target_name, name)
        if score > best_score:
            best_score = score
            best_match = (name, code)
    print(best_match)
    return best_match

@app.post("/find-function/")
async def find_function(request: FunctionRequest):
    repo_paths = request.repo_paths or default_repo_paths 
    logger.info("Searching for function: %s in repos: %s", request.function_name, repo_paths)  

    repo_functions = extract_functions_from_repo(repo_paths)
    matched_function = find_best_matching_function(request.function_name, repo_functions)

    if matched_function:
        logger.info("Match found: %s", matched_function[0])  
        return {
            "function_name": matched_function[0],
            "code": matched_function[1],
        }
    else:
        logger.warning("No matching function found for %s", request.function_name)  
        return PlainTextResponse(f"No matching function found for {request.function_name}", status_code=404)
