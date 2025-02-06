import os

# Worker configuration - Minimal for Render free tier
workers = 1  # Single worker to minimize memory usage
threads = 2  # Minimal threads
worker_class = 'sync'  # Use sync worker to avoid thread issues
worker_connections = 50

# Timeouts
timeout = 120
keepalive = 2
graceful_timeout = 30

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Bind
bind = f"0.0.0.0:{os.getenv('PORT', '10000')}"

# Memory optimization
max_requests = 500
max_requests_jitter = 50
worker_tmp_dir = '/dev/shm'  # Use RAM-based tmp directory
preload_app = True

# Thread and process naming
proc_name = 'aicg-backend'
default_proc_name = 'aicg-backend'

def on_starting(server):
    """Called just before the master process is initialized."""
    server.log.info("Server is starting up...")

def on_exit(server):
    """Called just before the master process exits."""
    server.log.info("Server is shutting down...") 