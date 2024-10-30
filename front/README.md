# Intelligent Code Completion Tool

## Project Overview

The Intelligent Code Completion Tool provides real-time, context-aware code suggestions and completions based on the context of the code being written, leveraging AI models trained on vast code repositories across multiple programming languages, helping developers write efficient code more quickly and accurately.

## Technologies Used

- **Frontend**: Next.js, React
- **Backend**: Python (for AI models and code analysis)
- **Database**: PostgreSQL
- **Testing**: Python, Playwright, Cucumber

## Getting Started

1. **Clone the project**
   - Use below commands to clone the project repository
      ```bash
      git clone <repository-url>
      cd AI-Code-generator-tool
      ```

2. **Frontend Setup**
   - Ensure you have nvm installed with Node.js version >= 18.18.0 .
   - Install Yarn globally (if not already installed):
      ```bash
      npm install -g yarn
      ```
   - Install frontend dependencies and run the development server:
      ```bash
      cd front
      yarn install
      yarn dev
      ```

2. **Backend Setup**
   - Ensure pipenv is installed.
      ```bash
      cd backend
      make setup
      ```

   - If dependencies are not installed, then manually install each of them from `requirement.txt` file using below command:
      ```bash
      pip install <module_name>
      ```

4. **Run the Server**
   - Use below commands to run the server
      ```bash
      python server.py
      uvicorn server:app --reload --port 8000
      ```
