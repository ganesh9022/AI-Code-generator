import base64
from flask import request

def make_key():
    """Generate a cache key from request data"""
    user_data = request.get_json()
    sorted_items = sorted(user_data.items())
    endpoint = request.endpoint
    return f"{endpoint}:{','.join([f'{k}={v}' for k, v in sorted_items])}"

def decode_code(encoded_data: str) -> str:
    """Decode base64 encoded data"""
    try:
        return base64.b64decode(encoded_data).decode('utf-8')
    except Exception as e:
        raise ValueError("Invalid encoded code") 
