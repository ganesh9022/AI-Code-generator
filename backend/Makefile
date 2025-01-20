setup:
	@echo "Setting up the project using Poetry..."
	poetry install
	@echo "Setup completed....."

run: setup
	@echo "Running Backend......"
	poetry run python main.py

test:
	@echo "Running Tests......"
	poetry run pytest tests/unit

update:
	poetry update
	@echo "Updated Poetry and installed all dependencies......"

format:
	poetry run black .
	@echo "Formatted all files in the project using black:......"

format-file:
	poetry run black $(file)
	@echo "Formatted code......"

migrate:
	@echo "Running database migrations..."
	poetry run python db/migrations/run_migrations.py
