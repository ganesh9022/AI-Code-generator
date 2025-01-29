from gradio_client import Client
import os

# Instantiate the client to interact with Hugging Face Space

def get_multi_layer_model_result(currentLine: str, language: str) -> str:
    """
    Query the deployed multi-layer operation predictor model on Hugging Face Space.
    
    Args:
        currentLine (str): The operation description or function name
        language (str): Programming language (python/javascript/typescript/php/java)
    
    Returns:
        str: The predicted operation definition or error message.
    """
    try:
        # Making the API call to Hugging Face Space
        client = Client(os.getenv('HUGGING_FACE_SPACE_URL'))
        result = client.predict(
            input_text=currentLine,
            language=language,
            api_name="/predict"
        )
        return result
    except Exception as e:
        return f"Error querying the model: {str(e)}"
