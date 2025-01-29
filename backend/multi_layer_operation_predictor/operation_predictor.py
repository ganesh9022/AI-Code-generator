from functools import lru_cache
import json
from enum import Enum
import os
import re
from fuzzywuzzy import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import KNeighborsClassifier
import joblib
from nltk.stem import WordNetLemmatizer
import nltk
from db.sqlalchemy_orm import ExtractedFile
from db.database import SessionLocal
from multi_layer_operation_predictor.extract_functions_from_repo import FunctionExtractor

nltk.download('wordnet')

class MatchMethod(Enum):
    FUZZY = "fuzzy"
    SUBSTRING = "substring"
    ML = "ml"
    ML_ERROR = "ml_error"

def get_absolute_path(relative_path):
    abs_path=os.path.dirname(os.path.abspath(__file__))
    return os.path.join(abs_path, relative_path)

def get_model_path(language):
    """Returns the path to the KNN model file based on language."""
    return get_absolute_path(f'model/{language}_knn_model.h5')

def load_functions(language):
    """
    Load functions from database based on language.
    
    Args:
        language: The programming language to load functions for.
    Returns:
        Dictionary of function names and their code.
    """
    # Language mapping for standardization
    language_mapping = {
        "py": "python",
        "js": "javascript",
        "ts": "typescript",
        "php": "php",
        "java": "java"
    }

    db = SessionLocal()
    try:
        # Standardize language name
        language = language.lower()
        language = language_mapping.get(language, language)
        print(f"Loading functions for language: {language}")

        # Get the file extension for the language
        language_ext = None
        for lang, info in FunctionExtractor.SUPPORTED_LANGUAGES.items():
            if lang == language:
                language_ext = info["ext"]
                break
        
        if not language_ext:
            raise ValueError(f"Unsupported language: {language}")

        print(f"Using file extension: .{language_ext}")

        # Query files with matching extension
        files = db.query(ExtractedFile).filter(
            ExtractedFile.file_name.endswith(f".{language_ext}")
        ).all()

        print(f"Found {len(files)} files with extension .{language_ext}")

        # Combine all functions from matching files
        all_functions = {}
        for file in files:
            # print(f"\nProcessing file: {file.file_name}")
            # print(f"File data type: {type(file.file_data)}")
            # print(f"File data content: {file.file_data}")
            
            if isinstance(file.file_data, dict):
                print(f"Number of functions in file: {len(file.file_data)}")
                all_functions.update(file.file_data)
            elif isinstance(file.file_data, list):
                print(f"Number of items in list: {len(file.file_data)}")
                for func in file.file_data:
                    if isinstance(func, dict):
                        all_functions.update(func)

        print(f"\nTotal functions loaded: {len(all_functions)}")
        print(f"Function names: {list(all_functions.keys())}")

        if not all_functions:
            print(f"No functions found for language: {language}")
            return {}

        return all_functions
    except Exception as e:
        print(f"Error loading functions from database: {str(e)}")
        return {}
    finally:
        db.close()

def clean_function_name(function_name, language):
    """
    Removes language-specific keywords and strips leading/trailing whitespace using regex.
    
    Args:
        function_name: The original function name.
        language: The programming language of the function.
    Returns:
        The cleaned function name.
    """
    keywords_dict = {
        "python": r"\b(def|class|async|await|for|while|if|else|try|except|finally)\b",
        "javascript": r"\b(function|class|async|await|const|let|var|if|else|for|while)\b",
        "typescript": r"\b(function|class|async|await|const|let|var|interface|type|enum|if|else|for|while)\b",
        "php": r"\b(function|class|public|private|protected|if|else|foreach|while|try|catch|finally)\b",
        "java": r"\b(class|public|private|protected|static|final|if|else|for|while|try|catch|finally)\b"
    }
    pattern = keywords_dict.get(language)
    if pattern:
        # Remove all language-specific keywords using regex
        function_name = re.sub(pattern, "", function_name)
    return function_name.strip()

@lru_cache(maxsize=1000)
def preprocess_text(text):
    """Preprocesses the text by converting to lowercase and lemmatizing."""
    lemmatizer = WordNetLemmatizer()
    words = text.lower().split()
    lemmatized_words = [lemmatizer.lemmatize(word) for word in words]
    return " ".join(lemmatized_words)

def find_closest_operation_fuzzy(user_input, operations):
    """Finds the closest operation name using fuzzy matching."""
    best_match = None
    best_score = 0
    for operation_name in operations:
        score = fuzz.ratio(user_input, operation_name)
        if score > best_score:
            best_score = score
            best_match = operation_name
    return best_match if best_score >= 70 else None, MatchMethod.FUZZY

def find_closest_operation_substring(user_input, operations):
    """Finds the closest operation name using substring matching."""
    for operation_name in operations:
        if user_input in operation_name:
            return operation_name, MatchMethod.SUBSTRING
    return None, MatchMethod.SUBSTRING

def train_ml_model(operations, language):
    """Trains a KNN model on operation names."""
    operation_names = list(operations.keys())
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(operation_names)
    knn_model = KNeighborsClassifier(n_neighbors=3)
    knn_model.fit(X, operation_names)
    model_path = get_model_path(language)
    joblib.dump((knn_model, vectorizer), model_path)
    return knn_model, vectorizer

def load_ml_model(language):
    """Loads the trained KNN model and vectorizer."""
    model_path = get_model_path(language)
    if os.path.exists(model_path):
        return joblib.load(model_path)
    else:
        return None, None

def predict_operation_name_ml(user_input, knn_model, vectorizer):
    """Predicts the operation name using the trained KNN model."""
    input_vector = vectorizer.transform([user_input])
    probabilities = knn_model.predict_proba(input_vector)[0]
    max_prob = max(probabilities)
    """If the maximum probability is less than 0.5, return an empty string."""
    if max_prob < 0.5:
        return "", MatchMethod.ML
    return knn_model.predict(input_vector)[0], MatchMethod.ML

def get_operation_definition(user_input, language):
    operations = load_functions(language)
    cleaned_input = clean_function_name(user_input,language)
    preprocessed_input = preprocess_text(cleaned_input)

    # First, try exact match
    closest_match, method = find_closest_operation_substring(preprocessed_input, operations)
    if closest_match:
        return operations[closest_match]
        
    # Next, try fuzzy matching
    closest_match, method = find_closest_operation_fuzzy(preprocessed_input, operations)
    if closest_match:
        return operations[closest_match]
    # Finally, try ML model
    knn_model, vectorizer = load_ml_model(language)
    if not knn_model:
        knn_model, vectorizer = train_ml_model(operations, language)

    try:
        closest_match, method = predict_operation_name_ml(preprocessed_input, knn_model, vectorizer)
        if closest_match:
            return operations[closest_match]
    except Exception as e:
        return ""
    
    return ""
