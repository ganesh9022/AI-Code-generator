import json
from enum import Enum
import os
from fuzzywuzzy import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import KNeighborsClassifier
import joblib
from nltk.stem import WordNetLemmatizer
import nltk

nltk.download('wordnet')

class MatchMethod(Enum):
    FUZZY = "fuzzy"
    SUBSTRING = "substring"
    ML = "ml"
    ML_ERROR = "ml_error"

def get_absolute_path(relative_path):
    abs_path=os.path.dirname(os.path.abspath(__file__))
    return os.path.join(abs_path, relative_path)

MODEL_PATH = get_absolute_path(r'model/knn_model.h5')
DATA_PATH = get_absolute_path(r'data/function.json')

def clean_function_name(function_name):
  """
  Removes keywords like "def", "class", etc., and strips leading/trailing whitespace.

  Args:
      function_name: The original function name.

  Returns:
      The cleaned function name.
  """
  keywords = ["def", "class", "async", "await", "for", "while", "if", "else", "try", "except", "finally"]
  for keyword in keywords:
    function_name = function_name.replace(keyword, "")
  return function_name.strip()


def preprocess_text(text):
    """Preprocesses the text by converting to lowercase and lemmatizing."""
    lemmatizer = WordNetLemmatizer()
    words = text.lower().split()
    lemmatized_words = [lemmatizer.lemmatize(word) for word in words]
    return " ".join(lemmatized_words)

def load_functions():
    """Loads functions from a JSON file."""
    with open(DATA_PATH, 'r') as file:
        return json.load(file)

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

def train_ml_model(operations):
    """Trains a KNN model on operation names."""
    operation_names = list(operations.keys())
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(operation_names)
    knn_model = KNeighborsClassifier(n_neighbors=3)
    knn_model.fit(X, operation_names)
    joblib.dump((knn_model, vectorizer), MODEL_PATH)
    return knn_model, vectorizer

def load_ml_model():
    """Loads the trained KNN model and vectorizer."""
    if os.path.exists(MODEL_PATH):
        return joblib.load(MODEL_PATH)
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

def get_operation_definition(user_input):
    operations = load_functions()
    cleaned_input = clean_function_name(user_input)
    preprocessed_input = preprocess_text(cleaned_input)

    # First, try exact match
    closest_match, method = find_closest_operation_substring(preprocessed_input, operations)
    if closest_match:
        return operations[closest_match], method
        
    # Next, try fuzzy matching
    closest_match, method = find_closest_operation_fuzzy(preprocessed_input, operations)
    if closest_match:
        return operations[closest_match], method
    # Finally, try ML model
    knn_model, vectorizer = load_ml_model()
    if not knn_model:
        knn_model, vectorizer = train_ml_model(operations)

    try:
        closest_match, method = predict_operation_name_ml(preprocessed_input, knn_model, vectorizer)
        if closest_match:
            return operations[closest_match], method
    except Exception as e:
        print(f"Error during ML prediction: {e}")
        return None, MatchMethod.ML_ERROR
    
    return None, MatchMethod.ML_ERROR
