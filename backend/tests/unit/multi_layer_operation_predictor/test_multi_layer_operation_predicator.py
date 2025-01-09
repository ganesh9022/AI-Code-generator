import unittest
from unittest.mock import mock_open, patch, MagicMock
import json
from sklearn.neighbors import KNeighborsClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from multi_layer_operation_predictor.operation_predictor import (
    MatchMethod, 
    clean_function_name, 
    preprocess_text, 
    load_functions, 
    find_closest_operation_fuzzy, 
    find_closest_operation_substring, 
    train_ml_model, 
    load_ml_model, 
    predict_operation_name_ml, 
    get_operation_definition
)

MOCKED_OPERATIONS = {
    "operation1": "description1",
    "operation2": "description2",
    "add_numbers": "Adds two numbers.",
    "substract_numbers": "Subtracts two numbers.",
    "multiply_numbers": "Multiplies two numbers.",
}

MOCKED_TFIDF_TRANSFORM = MagicMock()
MOCKED_KNN_MODEL = MagicMock()
MOCKED_VECTORIZER = MagicMock()
language = "Python"

class TestOperationFunctions(unittest.TestCase):

    @patch('builtins.open', mock_open(read_data=json.dumps(MOCKED_OPERATIONS)))
    def test_load_functions(self):
        # Positive test case: Testing function loading correctly
        result = load_functions(language)
        self.assertEqual(result, MOCKED_OPERATIONS)

    def test_clean_function_name(self):
        # Test with function name containing multiple keywords
        self.assertEqual(clean_function_name("def addition_numbers  "), "addition_numbers")

        # Test with function name that starts with a keyword
        self.assertEqual(clean_function_name("  async addition_numbers  "), "addition_numbers")

        # Test with function name that contains no keywords
        self.assertEqual(clean_function_name("addition_numbers"), "addition_numbers")

        # Test with function name that contains one keyword
        self.assertEqual(clean_function_name("def multiply_numbers"), "multiply_numbers")

        # Test with a function name containing only keywords
        self.assertEqual(clean_function_name("def  async  "), "")

        # Test with a function name that has multiple spaces and keywords
        self.assertEqual(clean_function_name("def  async  addition_numbers  "), "addition_numbers")

    @patch('fuzzywuzzy.fuzz.ratio', return_value=80)
    def test_find_closest_operation_fuzzy(self, mock_fuzz):
        # Positive test case: Fuzzy matching with high similarity
        mock_fuzz.return_value = 90  # Set high similarity score
        result, method = find_closest_operation_fuzzy("operation", MOCKED_OPERATIONS)
        self.assertEqual(result, "operation1")
        self.assertEqual(method, MatchMethod.FUZZY)

        # Negative test case: No close match found (low similarity)
        mock_fuzz.return_value = 30  # Set low similarity score
        result, method = find_closest_operation_fuzzy("unknown", MOCKED_OPERATIONS)
        self.assertIsNone(result)
        self.assertEqual(method, MatchMethod.FUZZY)

    def test_find_closest_operation_substring(self):
        # Positive test case: Substring match found
        result, method = find_closest_operation_substring("oper", MOCKED_OPERATIONS)
        self.assertEqual(result, "operation1")
        self.assertEqual(method, MatchMethod.SUBSTRING)

        # Negative test case: No substring match found
        result, method = find_closest_operation_substring("xyz", MOCKED_OPERATIONS)
        self.assertIsNone(result)
        self.assertEqual(method, MatchMethod.SUBSTRING)

    @patch('joblib.dump')
    @patch('sklearn.feature_extraction.text.TfidfVectorizer.fit_transform')
    @patch('sklearn.neighbors.KNeighborsClassifier.fit')
    def test_train_ml_model(self, _, __, mock_joblib_dump):
        # Positive test case: Training ML model
        knn_model, vectorizer = train_ml_model(MOCKED_OPERATIONS, language)
        self.assertIsInstance(knn_model, KNeighborsClassifier)
        self.assertIsInstance(vectorizer, TfidfVectorizer)
        mock_joblib_dump.assert_called_once()

    @patch('os.path.exists', return_value=True)
    @patch('joblib.load')
    def test_load_ml_model_positive(self, mock_load, _):
        mock_model = MagicMock()
        mock_vectorizer = MagicMock()
        mock_load.return_value = (mock_model, mock_vectorizer)

        knn_model, vectorizer = load_ml_model(language)
        self.assertEqual(knn_model, mock_model)
        self.assertEqual(vectorizer, mock_vectorizer)

    @patch('os.path.exists', return_value=False)
    def test_load_ml_model_negative(self, _):
        knn_model, vectorizer = load_ml_model(language)
        self.assertIsNone(knn_model)
        self.assertIsNone(vectorizer)

    def test_predict_operation_name_ml(self):
        mock_knn = MagicMock()
        mock_vectorizer = MagicMock()
        mock_knn.predict_proba.return_value = [[0.8, 0.2]]
        mock_knn.predict.return_value = ["operation1"]
        result, method = predict_operation_name_ml("test_input", mock_knn, mock_vectorizer)
        self.assertEqual(result, "operation1")
        self.assertEqual(method, MatchMethod.ML)

    @patch('multi_layer_operation_predictor.operation_predictor.load_functions', return_value=MOCKED_OPERATIONS)
    @patch('multi_layer_operation_predictor.operation_predictor.find_closest_operation_substring', return_value=("operation1", MatchMethod.SUBSTRING))
    @patch('multi_layer_operation_predictor.operation_predictor.find_closest_operation_fuzzy', return_value=("operation2", MatchMethod.FUZZY))
    @patch('multi_layer_operation_predictor.operation_predictor.predict_operation_name_ml', return_value=("operation3", MatchMethod.ML))
    def test_get_operation_definition(self, mock_ml_predict, mock_fuzzy, mock_substring, _):
        # Positive test case: Successfully finding operation
        result = get_operation_definition("operation", language)
        self.assertEqual(result, "description1")

        # Negative test case: Input not matching any operation
        mock_substring.return_value = (None, MatchMethod.SUBSTRING)
        mock_fuzzy.return_value = (None, MatchMethod.FUZZY)
        mock_ml_predict.return_value = ("", MatchMethod.ML)
        result = get_operation_definition("unknown", language)
        self.assertEqual(result, "")

    @patch('nltk.stem.WordNetLemmatizer')
    def test_text_preprocessing(self, MockWordNetLemmatizer):
        mock_lemmatizer = MockWordNetLemmatizer.return_value
        mock_lemmatizer.lemmatize.side_effect = lambda word, pos=None: 'run' if word == 'running' else word

        # Regular sentence
        result = preprocess_text("I am running fast")
        self.assertEqual(result, "i am running fast")

        # Single word case
        result = preprocess_text("Running")
        self.assertEqual(result, "running")

        # Mixed case sentence
        result = preprocess_text("The QUICK brown fox")
        self.assertEqual(result, "the quick brown fox")

        # Edge case with empty string
        result = preprocess_text("")
        self.assertEqual(result, "")

        # Special characters (should remain unchanged except for lemmatization)
        result = preprocess_text("Hello, I am running 123 times!")
        self.assertEqual(result, "hello, i am running 123 times!")

    @patch('multi_layer_operation_predictor.operation_predictor.load_functions', return_value=MOCKED_OPERATIONS)
    @patch('multi_layer_operation_predictor.operation_predictor.load_ml_model')
    @patch('multi_layer_operation_predictor.operation_predictor.find_closest_operation_substring')
    @patch('multi_layer_operation_predictor.operation_predictor.find_closest_operation_fuzzy')
    def test_ml_error(self, mock_find_fuzzy, mock_find_substring, mock_load_ml_model, _):
        mock_load_ml_model.return_value = (None, None)
        mock_find_substring.return_value = (None, MatchMethod.SUBSTRING)
        mock_find_fuzzy.return_value = (None, MatchMethod.FUZZY)

        user_input = "multiply"
        result = get_operation_definition(user_input, language)
        self.assertEqual(result, "")

    @patch('multi_layer_operation_predictor.operation_predictor.load_functions', return_value=MOCKED_OPERATIONS)
    def test_rare_input(self, _):
        user_input = "add!numbers"
        result = get_operation_definition(user_input, language)
        self.assertEqual(result, MOCKED_OPERATIONS["add_numbers"])

    @patch('multi_layer_operation_predictor.operation_predictor.load_functions', return_value=MOCKED_OPERATIONS)
    def test_input_with_spaces(self, _):
        user_input = "  substract_numbers   "
        result = get_operation_definition(user_input, language)
        self.assertEqual(result, MOCKED_OPERATIONS["substract_numbers"])

if __name__ == '__main__':
    unittest.main() 