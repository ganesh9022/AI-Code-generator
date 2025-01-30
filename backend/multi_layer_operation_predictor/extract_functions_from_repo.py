import ast
import csv
import json
from github import Github
import base64
import os
import re
import logging
from typing import List
from langchain_core.documents import Document
from datetime import datetime
from sqlalchemy.orm import Session
from db.sqlalchemy_orm import ExtractedFile
from db.database import SessionLocal

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


class FunctionExtractor:
    SUPPORTED_LANGUAGES = {
        "javascript": {"ext": "js", "label": "JavaScript"},
        "typescript": {"ext": "ts", "label": "TypeScript"},
        "python": {"ext": "py", "label": "Python"},
        "php": {"ext": "php", "label": "PHP"},
        "java": {"ext": "java", "label": "Java"},
    }

    def __init__(self, repo_url, access_token=None):
        self.repo_url = repo_url
        self.functions_by_language = {lang: {} for lang in self.SUPPORTED_LANGUAGES}
        self.owner, self.repo_name = self._parse_github_url(repo_url)
        self.github = Github(access_token) if access_token else Github()
        self.log = logging.getLogger(__name__)
        self.files_data = []

    def _parse_github_url(self, url):
        parts = url.rstrip("/").split("/")
        return parts[-2], parts[-1]

    def get_absolute_path(self, relative_path):
        abs_path = os.path.dirname(os.path.abspath(__file__))
        return os.path.join(abs_path, relative_path)

    def ensure_directory_exists(self, directory):
        if not os.path.exists(directory):
            os.makedirs(directory)

    def detect_language(self, file_extension):
        """Map file extension to supported language"""
        for lang, info in self.SUPPORTED_LANGUAGES.items():
            if file_extension == info["ext"]:
                return lang
        return None

    def extract_function_info(self, content, language):
        """Extract functions based on language"""
        if language == "python":
            return self._extract_python_functions(content)
        elif language == "java":
            return self._extract_java_functions(content)
        elif language in ["javascript", "typescript"]:
            return self._extract_js_ts_functions(content)
        elif language == "php":
            return self._extract_php_functions(content)
        return {}

    def _extract_python_functions(self, content):
        functions = {}
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    function_code = ast.get_source_segment(content, node)
                    functions[node.name] = function_code
        except Exception as e:
            self.log.error(f"Error parsing Python content: {str(e)}")
        return functions

    def _extract_java_functions(self, content):
        functions = {}
        pattern = r"((?:public|private|protected)?\s*(?:static)?\s*\w+\s+\w+\s*\([^)]*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})"
        matches = re.finditer(pattern, content)
        for match in matches:
            func_code = match.group(1)
            name_pattern = r"\w+\s+(\w+)\s*\("
            name_match = re.search(name_pattern, func_code)
            if name_match:
                func_name = name_match.group(1)
                functions[func_name] = func_code
        return functions

    def _extract_js_ts_functions(self, content):
        functions = {}
        patterns = [
            r"function\s+(\w+)\s*\([^)]*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}",  # Regular function
            r"(?:const|let|var)\s+(\w+)\s*=\s*function\s*\([^)]*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}",  # Function expression
            r"(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}",  # Arrow function
            r"(?:const|let|var)\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*(?:[^;{\n]+)",  # Single-line arrow function
            r"(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}",  # Class method arrow function
        ]

        for pattern in patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                func_name = match.group(1)
                func_code = match.group(0)
                functions[func_name] = func_code
        return functions

    def _extract_php_functions(self, content):
        functions = {}
        pattern = r"(?:public|private|protected)?\s*function\s+(\w+)\s*\([^)]*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}"
        matches = re.finditer(pattern, content)
        for match in matches:
            func_code = match.group(0)
            name_pattern = r"function\s+(\w+)\s*\("
            name_match = re.search(name_pattern, func_code)
            if name_match:
                func_name = name_match.group(1)
                functions[func_name] = func_code
        return functions

    def fetch_repository(self):
        """Fetch files from GitHub and process them"""
        self.log.info(f"Fetching repository: {self.repo_url}")
        try:
            repo = self.github.get_repo(f"{self.owner}/{self.repo_name}")
            contents = repo.get_contents("")

            while contents:
                file_content = contents.pop(0)
                if file_content.type == "dir":
                    contents.extend(repo.get_contents(file_content.path))
                else:
                    extension = file_content.path.split(".")[-1].lower()
                    language = self.detect_language(extension)

                    if language:
                        try:
                            content = base64.b64decode(file_content.content).decode("utf-8")
                            functions = self.extract_function_info(content, language)
                            if functions:
                                self.functions_by_language[language].update(functions)
                                # Store file data
                                self.files_data.append({
                                    "file_name": file_content.path,
                                    "functions": functions
                                })

                        except Exception as e:
                            self.log.error(f"Error processing {file_content.path}: {str(e)}")

            return True

        except Exception as e:
            self.log.error(f"Error fetching repository: {str(e)}")
            return False

    def save_functions_to_database(self) -> int:
        """Save extracted files to the database"""
        total_functions = 0
        db = SessionLocal()
        try:
            # Save files data
            for file_data in self.files_data:
                functions = file_data["functions"]
                if functions:  # Only save if file has functions
                    print(f"\nSaving file: {file_data['file_name']}")
                    print(f"Functions type: {type(functions)}")
                    print(f"Functions content: {functions}")
                    print(f"Number of functions: {len(functions)}")
                    
                    extracted_file = ExtractedFile(
                        file_name=file_data["file_name"],
                        file_data=functions,
                        repository_url=self.repo_url
                    )
                    db.add(extracted_file)
                    total_functions += len(functions)
                    self.log.info(f"Successfully saved file {file_data['file_name']} with {len(functions)} functions")

            db.commit()
            return total_functions
        except Exception as e:
            db.rollback()
            self.log.error(f"Error saving to database: {str(e)}")
            raise
        finally:
            db.close()

    def save_functions_to_csv(self):
        """
        Save all extracted functions to a single CSV file.

        The CSV will contain no headers or quotes, and each row will contain one raw function definition.
        """
        data_dir = "files"
        self.ensure_directory_exists(data_dir)
        output_file = os.path.join(data_dir, "functions.csv")

        # Collect only the raw function code
        all_functions = [func_code.strip() for functions in self.functions_by_language.values() for func_code in functions.values()]

        # Save to CSV
        try:
            with open(output_file, "w", encoding="utf-8", newline="") as csvfile:
                for func_code in all_functions:
                    csvfile.write(func_code + "\n\n")  # Write each function directly, followed by a newline
            self.log.info(f"Successfully saved raw function code to {output_file}")
            return output_file
        except Exception as e:
            self.log.error(f"Error saving raw function code to CSV: {str(e)}")
            return None

    def get_functions_as_documents(self) -> List[Document]:
        """Get extracted functions as Document objects for direct embedding."""
        documents = []
        
        for language, functions in self.functions_by_language.items():
            for func_name, func_code in functions.items():
                # Create a document with the function content and metadata
                doc = Document(
                    page_content=func_code,
                    metadata={
                        "source": f"{language}_functions",
                        "function_name": func_name,
                        "language": language,
                        "type": "function"
                    }
                )
                documents.append(doc)
                
        return documents
