# 🚀 CareerCraft AI

> **An AI-powered career assistant that helps you build better resumes, understand job descriptions, prepare for interviews, and improve your chances of landing your next opportunity.**

CareerCraft AI is a full-stack career management platform designed to bring essential job-search and career-development tools into one place.

From **resume analysis and ATS scoring** to **job-description analysis, resume matching, application tracking, and AI-powered interview preparation**, CareerCraft AI helps users make smarter career decisions with the support of AI.

---

## ✨ Features

### 📄 Resume Management

* Upload PDF resumes
* View uploaded resumes
* Manage multiple resumes
* Delete resumes
* Extract and display resume information
* Automatically identify:

  * Name
  * Email
  * Phone
  * Location
  * Professional headline
  * Summary
  * Skills
  * Education
  * Experience
  * Projects
  * Certifications

### 🤖 AI Resume Analysis

Analyze your resume using AI-powered evaluation.

The resume analyzer provides:

* **Overall ATS Score**
* Contact score
* Structure score
* Skills score
* Experience score
* Projects score
* Education score
* Keywords score
* Formatting score

It also identifies:

* ✅ Resume strengths
* ⚠️ Resume weaknesses
* 💡 Improvement suggestions

### 📊 Resume Statistics

CareerCraft AI provides useful resume statistics, including:

* Number of skills
* Education entries
* Experience entries
* Projects
* Certifications

This gives users a quick overview of the information contained in their resume.

### 🎯 Job Description Analyzer

Analyze a job description to identify:

* Required skills
* Important qualifications
* Relevant keywords
* Job requirements
* Important areas employers are looking for

This helps users understand what a company is actually looking for before applying.

### 🔗 Resume ↔ Job Description Matching

Compare your resume against a specific job description.

The matching system helps identify:

* Overall match score
* Matching skills
* Missing skills
* Relevant keywords
* Potential gaps between the resume and job requirements

This allows users to understand how well their resume fits a particular position.

### 📝 Application Tracking

Keep track of your job applications from one dashboard.

Users can organize and monitor their applications and their current status.

### 🎤 AI Interview Preparation

Practice interviews with an AI-powered interviewer.

The interview preparation feature is designed to help users:

* Practice realistic interview questions
* Improve interview confidence
* Simulate interview scenarios
* Prepare for job-specific questions
* Receive AI-powered feedback

---

# 🎨 UI & Design

CareerCraft AI uses a modern dashboard-oriented interface designed to keep career tools organized and easy to access.

The interface includes:

* Responsive layouts
* Dashboard navigation
* Interactive cards
* Resume management interface
* ATS analysis dashboard
* Score visualizations
* Progress indicators
* Clear action buttons
* Modern color contrast
* Subtle depth and 3D-inspired UI elements

The goal is to provide a professional experience similar to modern productivity and AI applications.

---

# 🧠 How CareerCraft AI Works

The platform follows a simple workflow:

```text
                 ┌─────────────────┐
                 │      User       │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   CareerCraft   │
                 │       AI        │
                 └────────┬────────┘
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
      Resume          Job Description   Interview
      Analysis           Analysis          Prep
          │               │                │
          └───────────────┼────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ AI Evaluation │
                  └───────┬───────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Recommendations │
                 │ & Insights      │
                 └─────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* **React**
* **TypeScript**
* **React Router**
* **Tailwind CSS**
* Modern responsive UI

## Backend

* **Node.js**
* **Express.js**
* REST API architecture
* JWT-based authentication

## Database

* **MongoDB**

## AI

* AI-powered resume analysis
* AI-powered job description analysis
* AI-powered resume matching
* AI-powered interview preparation

---

# 📁 Project Structure

A typical project structure looks like:

```text
CareerCraft-AI/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   └── ResumePage.tsx
│   │   │
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   └── package.json
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── services/
│   └── server.js
│
└── README.md
```

> Your actual folder structure may differ depending on how you've organized the project.

---

# 🔐 Authentication

CareerCraft AI uses token-based authentication.

Users can:

* Register/login
* Authenticate API requests
* Access protected career resources
* Manage their resumes securely

Authentication tokens are stored on the client and sent with protected API requests.

---

# ⚙️ Installation

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/CareerCraft-AI.git
```

```bash
cd CareerCraft-AI
```

---

## 2. Install frontend dependencies

```bash
cd frontend
npm install
```

---

## 3. Install backend dependencies

```bash
cd ../backend
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GEMINI_API_KEY=your_gemini_api_key
```

> Never commit your `.env` file or API keys to GitHub.

Add this to `.gitignore`:

```gitignore
.env
node_modules/
dist/
build/
```

---

# ▶️ Running the Project

Start the backend:

```bash
cd backend
npm run dev
```

The API will run on:

```text
http://localhost:5000
```

Then start the frontend:

```bash
cd frontend
npm run dev
```

Open the development URL provided by Vite in your browser.

---

# 🔌 API Overview

CareerCraft AI exposes REST API endpoints for the major career features.

### Authentication

```text
POST /api/auth/login
```

### Resumes

```text
GET    /api/resumes
POST   /api/resumes
GET    /api/resumes/:id
DELETE /api/resumes/:id
```

### Resume Analysis

```text
GET /api/resumes/:id/analyze
```

Additional endpoints are used for job-description analysis, resume matching, applications, and interview preparation.

---

# 📊 ATS Resume Analysis

One of the core features of CareerCraft AI is its resume scoring system.

The ATS analysis evaluates several categories:

| Category   | Purpose                              |
| ---------- | ------------------------------------ |
| Contact    | Checks important contact information |
| Structure  | Evaluates resume organization        |
| Skills     | Evaluates relevant skills            |
| Experience | Reviews professional experience      |
| Projects   | Evaluates project information        |
| Education  | Reviews education details            |
| Keywords   | Checks relevant keywords             |
| Formatting | Evaluates resume formatting          |

The platform combines these results into an overall ATS score.

---

# 🎯 Why CareerCraft AI?

Job searching can involve many different tools:

```text
Resume Builder
      +
Job Search
      +
Job Description Analysis
      +
ATS Checking
      +
Application Tracking
      +
Interview Preparation
```

CareerCraft AI brings these workflows together into a single platform.

Instead of switching between multiple tools, users can manage their career preparation from one dashboard.

---

# 🖥️ Main Dashboard

The CareerCraft AI dashboard provides quick access to:

* 📄 My Resumes
* 🎯 Job Description Analyzer
* 🔗 Resume ↔ JD Matching
* 📝 Applications
* 🎤 AI Interview Prep

The dashboard is designed to act as the central workspace for the user's career journey.

---

# 🔮 Future Improvements

Planned improvements can include:

* 📈 Career growth recommendations
* 👤 Advanced profile management
* 📄 AI resume rewriting
* ✨ AI resume builder
* 🔍 Job recommendation system
* 📊 Advanced career analytics
* 🎯 Personalized skill-gap analysis
* 🗺️ Personalized career roadmap
* 📬 Automated application insights
* 🤝 LinkedIn profile optimization
* 📱 Improved mobile experience

---

# 🔒 Security Considerations

CareerCraft AI is designed with protected API access and authentication in mind.

Important security practices include:

* Never exposing API keys in frontend code
* Storing secrets in environment variables
* Protecting authenticated API routes
* Validating uploaded files
* Restricting resume uploads to supported formats
* Using authentication tokens for protected resources

---

# 🧪 Development

During development, make sure both the frontend and backend servers are running.

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm run dev
```

Before pushing changes to GitHub, verify:

```bash
npm run build
```

and make sure no secrets or `.env` files are committed.

---

# 🚀 Future Vision

CareerCraft AI aims to become an **AI-powered personal career companion**.

The long-term vision is to help users throughout the complete career journey:

```text
Discover Career
       ↓
Analyze Skills
       ↓
Build Resume
       ↓
Analyze Job
       ↓
Match Resume
       ↓
Apply
       ↓
Prepare for Interview
       ↓
Improve
       ↓
Grow Career
```

---

# 👨‍💻 Author

**Ayanangshu Goswami**

Built with ❤️ using React, TypeScript, Node.js, Express, MongoDB.

---

# ⭐ Support

If you find CareerCraft AI useful or interesting, consider giving the repository a ⭐ on GitHub.

---

## 📜 License

This project is intended for educational and portfolio purposes.

Add an appropriate license here if you plan to distribute the project publicly.
