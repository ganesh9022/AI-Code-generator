import ast
import logging
import os
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from rapidfuzz import fuzz

app = FastAPI()
logger = logging.getLogger(__name__)  # Create a logger instance

class FunctionRequest(BaseModel):
    function_name: str

# Set the repository path here
repo_path = "/home/pst-asus-a555l/Desktop/costoryautomation/costory-automation"

# Step 1: Scan Repository and Extract Functions with Logging
def extract_functions_from_repo(repo_path):
    functions = {}
    for root, _, files in os.walk(repo_path):
        for file in files:
            if file.endswith(".py"):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r") as f:
                        source = f.read()
                    tree = ast.parse(source)
                    for node in ast.walk(tree):
                        if isinstance(node, ast.FunctionDef):
                            functions[node.name] = ast.get_source_segment(source, node)
                            logger.debug("Found function: %s", node.name)  # Log each function name
                except Exception as e:
                    logger.error("Error parsing file %s: %s", file_path, e)  # Log any errors
    return functions

# Step 2: Find Best Matching Function with Logging
def find_best_matching_function(target_name, functions):
    best_match = None
    best_score = 0
    for name, code in functions.items():
        score = fuzz.ratio(target_name, name)
        if score > best_score:
            best_score = score
            best_match = (name, code)
    return best_match

# Load functions at startup for use in requests
repo_functions = extract_functions_from_repo(repo_path)

# Step 3: FastAPI Endpoint with Logging
@app.post("/find-function/")
async def find_function(request: FunctionRequest):
    print("Searching for function: %s", request.function_name)
    logger.info("Searching for function: %s", request.function_name)  # Log request function name
    matched_function = find_best_matching_function(request.function_name, repo_functions)

    if matched_function:
        logger.info("Match found: %s", matched_function[0])  # Log matched function name
        return {matched_function[1]}
    else:
        logger.warning("No matching function found for %s", request.function_name)  # Log no match
        return {"code": request.function_name, "repo": repo_path, "error": "No matching function found"}
