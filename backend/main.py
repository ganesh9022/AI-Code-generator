from flask import Flask, request
from flask_cors import CORS
from g4f.client import Client
from db.sqlalchemy_orm import get_user_details
from mappers.model_mapper import map_models

app = Flask(__name__)
CORS(app)

client = Client()

@app.route("/code-snippet", methods=["POST"])
def generate_code_snippet():
    data = request.json
    prefix = data.get("prefix")
    currentLine = data.get("currentLine")
    suffix = data.get("suffix")
    language = data.get("language")
    model = data.get("model")
    response = map_models(
        model,
        prefix,
        currentLine,
        suffix,
        language,
    )
    return response

@app.route("/saveUser", methods=["POST"])
def save_user():
    data = request.json
    user_id = data.get("userId")
    userName = data.get("userName")
    email = data.get("email")
    response = get_user_details(user_id, userName, email) 
    return response

if __name__ == "__main__":
    app.run(debug=True, port=8000)
