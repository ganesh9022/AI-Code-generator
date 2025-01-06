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
   - Create a virtual environment
      ```bash
      cd backend
      python -m venv venv
      source venv/bin/activate
      ```
   -  Install the dependencies listed in the `requirements.txt` file:
      ```bash
      pip install -r requirements.txt
      ```
   - If dependencies are not installed, then manually install each of them from `requirements.txt` file using below command:
      ```bash
      pip install <module_name>
      ```
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
      ollama run codellama:7b-code
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
      ```
