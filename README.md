# Intelligent Code Completion Tool

## Project Overview

The Intelligent Code Completion Tool provides real-time, context-aware code suggestions and completions based on the context of the code being written, leveraging AI models trained on vast code repositories across multiple programming languages, helping developers write efficient code more quickly and accurately.

## Technologies Used

- **Frontend**: React
- **Backend**: Python (for AI models and code analysis)
- **Database**: PostgreSQL
- **Python Models**: ollama,GROQ Cloud
- **AUTH**: Clerk
- **API Communication**: Flask
- **Testing**: Python, Playwright, Cucumber

## Getting Started

### 1. Clone the project
   - Use below commands to clone the project repository
      ```bash
      git clone <repository-url>
      cd AI-Code-generator-tool
      ```

### 2. Frontend Setup
   - Ensure you have nvm installed with Node.js version >= 18.18.0 .
   - Install Yarn globally (if not already installed):
      ```bash
      npm install -g yarn
      ```
   - Install frontend dependencies
      ```bash
      cd front
      yarn install
      ```

### 2. Backend Setup

   - Install pipx (if not already installed):
      - For macOS:
         ```bash
         brew install pipx
         ```
      - For Linux:
         ```bash
         sudo apt install pipx
         ```
   - Install Poetry using pipx:
      ```bash
      pipx install poetry
      ```
   - Verify Poetry Installation:
      ```bash
      poetry --version
      ```
   -  Navigate to the backend directory:
      ```bash
      cd backend
      ```
   - Set up the backend environment:
      Installs all dependencies specified in the `pyproject.toml` file:
      ```bash
      make setup
      ```
   - Run the backend:
      Runs the backend server using the main.py entry point:
      ```bash
      make run
      ```
   - Run the unit test:
      ```bash
      make test
      ```
   - Update the project:
      ```bash
      make update
      ```
   - Add new dependency:
      ```bash
      poetry add <dependency-name>
      ```
   - Add a Dependency with a Specific Version:
      ```bash
      poetry add <package-name>@<package-version>
      ```
      Example: poetry add flask@2.3.3

   - Remove dependency:
      ```bash
      poetry remove <dependency-name>
      ```
   - Formatting the code:

      - Format all files in the project using black:
         ```bash
         make format
         ```
      - Format the specific file using black:
         ```bash
         make format-file file=<file-name>
         ```
         Example: make format-file file=main.py

### 3. Database Setup
   - For Ubuntu
      1. Install PostgreSQL:
         ```bash
         sudo apt install postgresql
         ```
      2. Start PostgreSQL Service:
         ```bash
         sudo service postgresql start
         ```
      3. Switch to PostgreSQL user and connect:
         ```bash
         sudo -i -u postgres
         psql -U postgres
         ```

   - For Mac-OS
      1. Install PostgreSQL using Homebrew :
         ```bash
         brew install postgresql
         ```

      2. Start PostgreSQL service :
         ``` bash
         brew services start postgresql
         ```

      3. Switch to the 'postgres' user :
         ```bash
         psql postgres
         ```

   - Common Steps for Both Operating Systems:

      4. Create the Database and User:
         ```sql
         CREATE DATABASE codedb;
         CREATE USER codedb WITH PASSWORD 'codedb' SUPERUSER;
         GRANT ALL PRIVILEGES ON DATABASE codedb TO codedb;
         ```

      5. Connect to the New Database:
         ```bash
         \c codedb
         ```

### 4. Environment Variables
   - To run this project, you will need to set up the following environment variables in a `backend/.env` file in the root of your project directory.
   #### Example `backend/.env` File
   ```
    GROQ_API_KEY=dummygroqapikey12345
   ```
### 5. Ollama Setup
   - Install ollama from https://ollama.com/
   - Run below command on new terminal
      ```bash
      ollama run granite-code:3b-instruct-128k-q2_K
      ```
   - Start Backend server

### 6. Run the Backend Server
   - Use below commands to run the server
      ```bash
      python main.py
      ```

### 7. Run the Development Server:
   - Use below commands to run the development server
      ```bash
      yarn dev

### 8. Run the Unit test:
   - Use below commands to run unit test
      ```bash
         python3 -m pytest backend/tests/unit
      ```
