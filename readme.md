# XM Cloud Certification Workspace

This repository provides a complete environment for generating XM Cloud study content, quizzes, and storing user quiz attempts.

## Table of Contents

- [Overview](#overview)
- [Repository Structure](#repository-structure)
- [Requirements](#requirements)
- [Setup](#setup)
  - [Environment Variables](#environment-variables)
  - [Backend Installation](#backend-installation)
  - [Frontend Installation](#frontend-installation)
- [Usage](#usage)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
- [CrewAI](#crewai)
  - [XMCloudTrainer](#xmcloudtrainer)
  - [XMCloudQuizCrew](#xmcloudquizcrew)
- [Supabase Integration](#supabase-integration)
- [Swagger API Documentation](#swagger-api-documentation)
- [Additional Notes](#additional-notes)

## Overview

The XM Cloud Certification Workspace consists of:
- **Backend (Flask)**
- **CrewAI Pipeline** for quiz generation and answer re-checking
- **Frontend (Next.js)**

This environment is designed to help you generate XM Cloud study content and manage quizzes effectively.

## Repository Structure

```plaintext
XM_CloudAI
├── app.py                      # Flask backend entry point
├── config/
│   ├── agents.yaml             # Agent configurations
│   ├── tasks.yaml              # Task configurations
│   └── ...                     # Other config files
├── generate_xmCloud_Quiz_crew.py
├── xm_clound_content_crew.py
├── frontend/
│   ├── app/
│   ├── components/
│   ├── data/
│   ├── lib/
│   ├── public/
│   ├── styles/
│   └── README.md               # Next.js README
├── main.py                    # Example usage for running crews
└── ...
```

## Requirements

- **Python:** 3.9+  
- **Node.js:** 16+  
- **Virtual Environment:** (Optional for Python)  
- **Supabase:** (Optional, for storing quiz attempts)

## Setup

### Environment Variables

Create a `.env` file in the root directory and add the following:

<details>
  <summary><strong>Click to view .env sample</strong></summary>

  ```env
  SERPER_API_KEY="..."
  GEMINI_API_KEY="..."
  GOOGLE_GEMINI_MODEL="gemini-2.0-flash-exp"
  ```
  
  Adjust keys and tokens as needed.
</details>

### Backend Installation

1. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

### Frontend Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Running the Backend

1. Activate the virtual environment:
   ```bash
   venv\Scripts\activate  # Windows
   # or
   source venv/bin/activate  # macOS/Linux
   ```

2. Start the backend server:
   ```bash
   python app.py
   ```

3. Access the API at http://localhost:5000.

### Running the Frontend

1. From the frontend directory, start the Next.js development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser.

## CrewAI

### XMCloudTrainer

Defined in `xm_clound_content_crew.py`, this module gathers and presents XM Cloud content in a single pass.

### XMCloudQuizCrew

Defined in `generate_xmCloud_Quiz_crew.py`, it includes:

- `generate_crew()`: Creates a 10-question multiple-choice quiz.
- `recheck_crew()`: Re-checks user answers.

Example usage is available in `main.py`.

## Supabase Integration

In `frontend/app/quiz/page.tsx`, user scores are saved to a `quiz_attempts` table via the Supabase client.
Update credentials and environment variables in `frontend/lib/supabaseClient.ts` as needed.

## Swagger API Documentation

API documentation is available in the `swagger/` folder (e.g., `generate_quiz.yml`, `recheck_quiz.yml`).
These files annotate endpoints such as:

- `/api/quiz/generate`
- `/api/quiz/recheck`

## Additional Notes

- **Frontend**: Uses Next.js with TypeScript and Tailwind CSS.
- **Backend**: Built with Flask, supporting CORS and Flasgger for API documentation.
- **Configuration**: Environment settings for CrewAI and LLM-based pipelines are managed via the `.env` file and configuration files in the `config/` directory.
