import os
import json

def load_cache_config():
    """Load cache configuration from JSON file"""
    config_path = os.path.join(os.path.dirname(__file__), 'flask.cache.config.json')
    with open(config_path, 'r') as config_file:
        return json.load(config_file)

# Cache configuration loader
def get_cache_config():
    """Get cache configuration settings"""
    cache_config = load_cache_config()
    return cache_config