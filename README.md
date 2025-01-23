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
      yarn install:frontend
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

### 3.Alternatively install Frontend and backend dependencies:
   - Use below command 
     ```bash
       yarn install:all
     ```     
### 4. Database Setup
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

### 5. Environment Variables
   You'll need to set up environment variables in two locations:

   #### Frontend Environment Variables (`front/.env`)
   ```env
   # Backend API URL (e.g., http://localhost:5000)
   VITE_SERVER_URL=

   # Clerk authentication publishable key
   VITE_CLERK_PUBLISHABLE_KEY=

   # GitHub OAuth App Client ID
   VITE_OAUTH_APP_CLIENT_ID=
   ```

   #### Backend Environment Variables (`backend/.env`)
   ```env
   # GROQ API key for AI model access
   GROQ_API_KEY=

   # PostgreSQL database connection URL (format: postgresql://user:password@host:port/dbname)
   DATABASE_URL=

   # GitHub OAuth credentials
   OAUTH_APP_CLIENT_ID=
   OAUTH_APP_CLIENT_SECRET=

   # Security key for encryption (generate a strong random key)
   ENCRYPTION_KEY=

   # Token expiration time in minutes (e.g., 60)
   TOKEN_EXPIRATION_MINUTES=

   # Clerk authentication configuration
   CLERK_ISSUER=
   CLERK_JWT_AUDIENCE=
   ```
### 6. Ollama Setup
   - Install ollama from https://ollama.com/
   - Run below command on new terminal
      ```bash
      ollama run granite-code:3b-instruct-128k-q2_K
      ```
   - Start Backend server

### 7. Run the Backend Server
   - Use below commands to run the server
      ```bash
      yarn start:backend
      ```

### 8. Run the Development Server:
   - Use below commands to run the development server
      ```bash
       yarn start:frontend
       ```

### 9. Alternatively run both the frontend and backend servers concurrently:
   - Use below command
      ```bash
          yarn start
      ```
### 10. Run the Unit test:
   - Use below commands to run unit test
      ```bash
         python3 -m pytest backend/tests/unit
      ```
