import json
import numpy as np
import os
import joblib
from fuzzywuzzy import process
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import make_pipeline
from sklearn.utils import shuffle
import time

def operation(currentLine: str):

    data = load_data()
    if os.path.exists("operation_predictor/operation_predictor_model.h5"):
        model = load_model("operation_predictor/operation_predictor_model.h5")
    else:
        model = train_model(data)

    input_examples = []
    for item in data:
        for example in item["input_examples"]:
            input_examples.append(example)

    predicted_function = predict_operation(currentLine, model, input_examples, data)

    return predicted_function

def get_absolute_path(relative_path):
    abs_path=os.path.dirname(os.path.abspath(__file__))
    return os.path.join(abs_path, relative_path)

# Function to load data from a JSON file
def load_data():
    with open(get_absolute_path('operations_data.json'), 'r') as f:
        return json.load(f)

# Function to save model to an .h5 file
def save_model(model, filename):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    # Now save the model
    joblib.dump(model, filename)

# Function to load model from an .h5 file
def load_model(filename):
    return joblib.load(filename)

# Function to train the model
def train_model(data):
    # Prepare the input data: create lists for input examples and corresponding operations
    input_examples = []
    operations = []
    functions = []

    print("Starting the data preparation process.")

    # Flatten the data structure to have each input_example associated with its operation
    for item in data:
        for example in item['input_examples']:
            input_examples.append(example)
            operations.append(item['operation'])
            functions.append(item['function'])

    print(f"Data preparation completed. Total input examples: {len(input_examples)}")

    # Preprocessing: Define a pipeline with TF-IDF and Random Forest Classifier
    pipeline = make_pipeline(TfidfVectorizer(), RandomForestClassifier(n_estimators=100))

    # Split the data into training and test sets
    X_train, X_test, y_train, y_test = train_test_split(input_examples, operations, test_size=0.2, random_state=42)

    print(f"Data split into training and test sets. Training size: {len(X_train)}, Test size: {len(X_test)}")

    # Shuffle the training data for better performance
    X_train, y_train = shuffle(X_train, y_train, random_state=42)

    # Train the model and track progress
    print("Training the model.")
    num_batches = 10  # For example, we split the training into 10 batches
    batch_size = len(X_train) // num_batches

    for batch in range(num_batches):
        start_index = batch * batch_size
        end_index = start_index + batch_size if batch != num_batches - 1 else len(X_train)
        batch_X = X_train[start_index:end_index]
        batch_y = y_train[start_index:end_index]

        # Train on the current batch
        pipeline.fit(batch_X, batch_y)

        # Calculate the progress percentage
        progress = ((batch + 1) / num_batches) * 100
        print(f"Training progress: {progress:.2f}%")

        # Simulate processing time for each batch
        time.sleep(1)  # Optional: to slow down for visibility

    print("Model training completed.")

    # Save the trained model to an H5 file
    save_model(pipeline, 'operation_predictor/operation_predictor_model.h5')
    print('Trained model has been saved to operation_predictor/operation_predictor_model.h5.')

    return pipeline

# Fuzzy matching helper function to find the best match
def get_best_match(user_input, choices):
    return process.extractOne(user_input, choices)[0]

# Predict function
def predict_operation(user_input, model, input_examples, data):
    # Use fuzzy matching to improve prediction for misspelled inputs
    best_match = get_best_match(user_input, input_examples)
    
    # Predict the operation using the trained model
    predicted_operation = model.predict([best_match])[0]
    
    # Get the probability of the prediction
    predicted_probabilities = model.predict_proba([best_match])[0]
    
    # Retrieve the corresponding function for the predicted operation
    for item in data:
        if item['operation'] == predicted_operation:
            return item['function']
    
    return "No matching operation found"
