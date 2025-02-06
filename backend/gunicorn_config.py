import multiprocessing
import os

# Worker configuration
workers = 2  # Keep this low for Render's free tier
threads = 2
worker_class = 'gthread'  # Use threads
worker_connections = 100

# Timeouts
timeout = 120
keepalive = 5
graceful_timeout = 30

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Bind
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"

# Limit the maximum number of requests a worker will process before restarting
max_requests = 1000
max_requests_jitter = 50

# Reduce memory usage
preload_app = True 