import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from dotenv import load_dotenv

load_dotenv()
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

def get_fernet_key():
    """Generate a secure Fernet key using PBKDF2"""
    if not ENCRYPTION_KEY:
        raise ValueError("ENCRYPTION_KEY environment variable is not set")
    
    # Use a static salt - in production, this should be stored securely
    salt = b'github_token_salt'  # You can generate this once and store it securely
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=480000,  # High number of iterations for better security
    )
    
    key = base64.urlsafe_b64encode(kdf.derive(ENCRYPTION_KEY.encode()))
    return Fernet(key)

# Initialize Fernet cipher
fernet = get_fernet_key()

def encrypt_token(token: str) -> str:
    """Encrypt GitHub access token using Fernet"""
    try:
        # Encrypt the token
        encrypted_token = fernet.encrypt(token.encode())
        # Return base64 encoded string
        return encrypted_token.decode('utf-8')
    except Exception as e:
        raise ValueError("Failed to encrypt token")

def decrypt_token(encrypted_token: str) -> str:
    """Decrypt GitHub access token using Fernet"""
    try:
        # Convert string to bytes and decrypt
        if isinstance(encrypted_token, str):
            encrypted_token = encrypted_token.encode('utf-8')
        decrypted_token = fernet.decrypt(encrypted_token)
        # Convert decrypted bytes to string
        return decrypted_token.decode('utf-8')
    except Exception as e:
        raise ValueError("Failed to decrypt token") 
