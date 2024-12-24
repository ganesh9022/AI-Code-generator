from flask import Flask, request, jsonify
from flask_cors import CORS
from g4f.client import Client
from operation_predictor.operation_predictor import load_data, train_model, load_model, predict_operation, get_absolute_path
import os

app = Flask(__name__)
CORS(app)

client = Client()

@app.route('/operation', methods=['GET'])
def operation():
    user_input = request.args.get('prompt')
    
    data = load_data()
    abs_path = get_absolute_path('operation_predictor/operation_predictor_model.h5')
    if os.path.exists('operation_predictor/operation_predictor_model.h5'):
        model = load_model('operation_predictor/operation_predictor_model.h5')
    else:
        model = train_model(data)
        
    input_examples = []
    for item in data:
        for example in item['input_examples']:
            input_examples.append(example)

    predicted_function = predict_operation(user_input, model, input_examples, data)

    return predicted_function

@app.route('/complete', methods=['POST'])
def code_completion():
    data = request.json
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "Prompt is required"}), 400

    try:
        response = client.chat.completions.create(
            model="gpt-4o",  
            messages=[{"role": "user", "content": prompt}],
        )
        completion = response.choices[0].message.content
        return jsonify({"completion": completion}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
