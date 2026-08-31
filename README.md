\# 🚀 CareerCraft AI



\### AI-Powered Career Intelligence Platform



> \*\*CareerCraft AI\*\* is a full-stack AI-powered career platform designed to help job seekers build stronger resumes, understand job descriptions, match their skills to opportunities, prepare for interviews, and manage their applications — all from one place.



<p align="center">



!\[CareerCraft AI](https://img.shields.io/badge/CareerCraft-AI-7C3AED?style=for-the-badge\\\&logo=ai\\\&logoColor=white)

!\[React](https://img.shields.io/badge/React-18%2B-61DAFB?style=for-the-badge\\\&logo=react\\\&logoColor=black)

!\[TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6?style=for-the-badge\\\&logo=typescript\\\&logoColor=white)

!\[Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge\\\&logo=node.js\\\&logoColor=white)

!\[Express](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge\\\&logo=express\\\&logoColor=white)

!\[MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge\\\&logo=mongodb\\\&logoColor=white)

!\[Vite](https://img.shields.io/badge/Vite-Fast%20Build-646CFF?style=for-the-badge\\\&logo=vite\\\&logoColor=white)



</p>



\---



\## ✨ Overview



Finding a job often means jumping between multiple tools:



\*\*Resume builders → Job descriptions → Skill matching → Resume tailoring → Interview preparation → Application tracking\*\*



CareerCraft AI brings these workflows together into a unified career assistant.



The platform combines a modern React frontend with a TypeScript/Node.js backend and AI-powered services to help users move from \*\*job discovery to interview preparation\*\* more efficiently.



\---



\## 🎯 What CareerCraft AI Does



CareerCraft AI focuses on the complete job-search workflow:



| Module                      | Purpose                                            |

| --------------------------- | -------------------------------------------------- |

| 📄 Resume Management        | Upload, parse, analyze and manage resumes          |

| 🔎 Job Description Analysis | Understand job requirements and expectations       |

| 🎯 Resume–JD Matching       | Compare resumes against job descriptions           |

| ✨ Resume Tailoring          | Generate targeted resume improvements              |

| 🎤 Interview Preparation    | Prepare for interviews using AI-powered assistance |

| 📋 Application Tracking     | Organize and monitor job applications              |

| 👤 Profile Management       | Manage user career information                     |

| 🔐 Authentication           | Secure user authentication and protected routes    |



\---



\## 🖥️ Dashboard Preview



> Add your latest CareerCraft AI dashboard screenshot here.



<p align="center">

&#x20; <img src="./frontend/src/assets/hero.png" alt="CareerCraft AI Dashboard" width="900"/>

</p>



\### 3D UI Concept



The CareerCraft AI interface is designed around a modern, dark, AI-focused visual language with:



\* Glassmorphism-inspired cards

\* Rounded dashboard components

\* AI-focused visual hierarchy

\* Responsive layouts

\* Clear career workflow navigation

\* Modern data visualization patterns



\---



\# 🧩 Core Features



\## 📄 AI Resume Management



Upload and process resumes to extract useful career information.



\*\*Capabilities include:\*\*



\* Resume upload

\* Resume parsing

\* Resume data management

\* Resume analysis

\* Structured profile information



\---



\## 🎯 Resume–Job Matching



Compare a candidate's resume against a job description.



The matching workflow can help identify:



\* Relevant skills

\* Missing skills

\* Job requirements

\* Candidate strengths

\* Potential improvement areas



\---



\## ✨ AI Resume Tailoring



Generate targeted improvements based on a specific job description.



The goal is to transform a generic resume into a more \*\*job-specific and relevant application\*\*.



\---



\## 🔎 Job Description Intelligence



Analyze job descriptions and extract useful information such as:



\* Required skills

\* Responsibilities

\* Qualifications

\* Relevant technologies

\* Candidate expectations



\---



\## 🎤 Interview Preparation



CareerCraft AI includes an interview preparation workflow designed to help users practice for job interviews.



Possible preparation areas include:



\* Technical questions

\* Behavioral questions

\* Role-specific questions

\* AI-assisted preparation



\---



\## 📋 Application Tracking



Keep job applications organized in one place.



Track information such as:



```text

Company

&#x20;     ↓

Position

&#x20;     ↓

Application

&#x20;     ↓

Interview

&#x20;     ↓

Result

```



\---



\# 🏗️ System Architecture



CareerCraft AI follows a \*\*full-stack client/server architecture\*\*.



```text

&#x20;                   ┌──────────────────────────┐

&#x20;                   │        User              │

&#x20;                   │     Web Browser           │

&#x20;                   └────────────┬─────────────┘

&#x20;                                │

&#x20;                                ▼

&#x20;                   ┌──────────────────────────┐

&#x20;                   │      React Frontend      │

&#x20;                   │       TypeScript         │

&#x20;                   │          Vite             │

&#x20;                   └────────────┬─────────────┘

&#x20;                                │

&#x20;                         REST API Requests

&#x20;                                │

&#x20;                                ▼

&#x20;                   ┌──────────────────────────┐

&#x20;                   │    Node.js + Express     │

&#x20;                   │       TypeScript         │

&#x20;                   └────────────┬─────────────┘

&#x20;                                │

&#x20;             ┌──────────────────┼──────────────────┐

&#x20;             │                  │                  │

&#x20;             ▼                  ▼                  ▼

&#x20;      ┌────────────┐     ┌────────────┐     ┌────────────┐

&#x20;      │ Controllers│     │ Services   │     │ Middleware │

&#x20;      └─────┬──────┘     └─────┬──────┘     └────────────┘

&#x20;            │                  │

&#x20;            │                  ├──────────────► AI Services

&#x20;            │                  │

&#x20;            ▼                  ▼

&#x20;      ┌────────────┐     ┌────────────┐

&#x20;      │   Models   │     │  MongoDB   │

&#x20;      └────────────┘     └────────────┘

```



\---



\# 📁 Project Structure



```text

CareerCraft-AI/

│

├── backend/

│   │

│   ├── src/

│   │   ├── config/

│   │   │   └── db.ts

│   │   │

│   │   ├── controllers/

│   │   │   ├── applicationController.ts

│   │   │   ├── authController.ts

│   │   │   ├── jdController.ts

│   │   │   ├── matchingController.ts

│   │   │   ├── profileController.ts

│   │   │   ├── resumeController.ts

│   │   │   └── tailoringController.ts

│   │   │

│   │   ├── middleware/

│   │   │   ├── authMiddleware.ts

│   │   │   └── uploadMiddleware.ts

│   │   │

│   │   ├── models/

│   │   │   ├── Application.ts

│   │   │   ├── Resume.ts

│   │   │   ├── TailoredResume.js

│   │   │   └── User.ts

│   │   │

│   │   ├── routes/

│   │   │   ├── applicationRoutes.ts

│   │   │   ├── authRoutes.ts

│   │   │   ├── interviewRoutes.ts

│   │   │   ├── jdRoutes.ts

│   │   │   ├── matchingRoutes.ts

│   │   │   ├── profileRoutes.ts

│   │   │   ├── resumeRoutes.ts

│   │   │   └── tailoringRoutes.ts

│   │   │

│   │   ├── services/

│   │   │   ├── interviewService.ts

│   │   │   ├── jdService.ts

│   │   │   ├── matchingService.ts

│   │   │   ├── openaiService.ts

│   │   │   └── tailoringService.ts

│   │   │

│   │   ├── utils/

│   │   │   └── resumeParser.ts

│   │   │

│   │   └── server.ts

│   │

│   ├── .env.example

│   ├── package.json

│   ├── package-lock.json

│   └── tsconfig.json

│

├── frontend/

│   │

│   ├── src/

│   │   ├── pages/

│   │   │   ├── ApplicationsPage.tsx

│   │   │   ├── DashboardPage.tsx

│   │   │   ├── HomePage.tsx

│   │   │   ├── InterviewPrepPage.tsx

│   │   │   ├── JDPage.tsx

│   │   │   ├── LoginPage.tsx

│   │   │   ├── MatchingPage.tsx

│   │   │   ├── ResumePage.tsx

│   │   │   ├── ResumeJDMatchingPage.tsx

│   │   │   └── ResumeTailoringPage.tsx

│   │   │

│   │   ├── routes/

│   │   │   └── AppRoutes.tsx

│   │   │

│   │   ├── App.tsx

│   │   ├── index.css

│   │   └── main.tsx

│   │

│   ├── public/

│   ├── package.json

│   └── vite.config.ts

│

├── .gitignore

├── README.md

└── project-files.txt

```



\---



\# 🛠️ Tech Stack



\### Frontend



\* \*\*React\*\*

\* \*\*TypeScript\*\*

\* \*\*Vite\*\*

\* \*\*CSS\*\*

\* \*\*React Router\*\*



\### Backend



\* \*\*Node.js\*\*

\* \*\*Express.js\*\*

\* \*\*TypeScript\*\*



\### Database



\* \*\*MongoDB\*\*



\### AI \& Processing



\* AI service integrations

\* Resume parsing

\* Job description analysis

\* AI-assisted matching

\* AI-assisted resume tailoring

\* Interview preparation



\### Development



\* Git

\* GitHub

\* npm

\* ESLint



\---



\# ⚙️ Getting Started



\## Prerequisites



Make sure you have installed:



\* Node.js

\* npm

\* MongoDB

\* Git



Verify Node.js:



```bash

node --version

```



Verify npm:



```bash

npm --version

```



\---



\# 📥 Installation



\## 1. Clone the repository



```bash

git clone https://github.com/YOUR\_USERNAME/careercraft-ai.git

```



```bash

cd careercraft-ai

```



\---



\## 2. Setup Backend



```bash

cd backend

npm install

```



Create your environment file:



```bash

cp .env.example .env

```



\### Windows PowerShell



```powershell

Copy-Item .env.example .env

```



Then configure the required environment variables in `.env`.



\---



\## 3. Setup Frontend



Open a second terminal:



```bash

cd frontend

npm install

```



\---



\# 🔐 Environment Variables



Create:



```text

backend/.env

```



Never commit this file to GitHub.



The repository includes:



```text

backend/.env.example

```



as a safe configuration template.



Example:



```env

PORT=5000

MONGODB\_URI=your\_mongodb\_connection\_string



OPENAI\_API\_KEY=your\_api\_key

GOOGLE\_API\_KEY=your\_api\_key



JWT\_SECRET=your\_jwt\_secret

```



> \*\*Important:\*\* The exact variables required by your current backend should be taken from your `.env.example`. Never publish real API keys, database credentials, JWT secrets, or other sensitive values.



\---



\# ▶️ Running the Application



\## Start the Backend



From:



```text

CareerCraft-AI/backend

```



run:



```bash

npm run dev

```



The backend will start on the configured server port.



\---



\## Start the Frontend



From:



```text

CareerCraft-AI/frontend

```



run:



```bash

npm run dev

```



Vite will provide the local development URL in your terminal.



\---



\# 🔄 Application Flow



```text

&#x20;                USER

&#x20;                 │

&#x20;                 ▼

&#x20;         ┌───────────────┐

&#x20;         │    Login      │

&#x20;         └───────┬───────┘

&#x20;                 │

&#x20;                 ▼

&#x20;         ┌───────────────┐

&#x20;         │   Dashboard   │

&#x20;         └───────┬───────┘

&#x20;                 │

&#x20;       ┌─────────┼──────────┐

&#x20;       ▼         ▼          ▼

&#x20;    Resume      Job       Profile

&#x20;    Analysis     JD       Management

&#x20;       │         │

&#x20;       └────┬────┘

&#x20;            ▼

&#x20;     Resume–JD Matching

&#x20;            │

&#x20;            ▼

&#x20;      AI Resume Tailoring

&#x20;            │

&#x20;            ▼

&#x20;     Interview Preparation

&#x20;            │

&#x20;            ▼

&#x20;     Application Tracking

```



\---



\# 🧠 AI Workflow



CareerCraft AI is designed around a career intelligence pipeline:



```text

Resume

&#x20;  │

&#x20;  ▼

Resume Parser

&#x20;  │

&#x20;  ▼

Structured Candidate Data

&#x20;  │

&#x20;  ├───────────────┐

&#x20;  │               │

&#x20;  ▼               ▼

Job Description   Profile

&#x20;  │

&#x20;  ▼

Requirement Extraction

&#x20;  │

&#x20;  ▼

Resume ↔ JD Matching

&#x20;  │

&#x20;  ▼

Gap Identification

&#x20;  │

&#x20;  ▼

AI Resume Tailoring

&#x20;  │

&#x20;  ▼

Interview Preparation

```



\---



\# 📊 Key Engineering Concepts



The project demonstrates practical full-stack development concepts including:



\* REST API architecture

\* Authentication middleware

\* Controller/service separation

\* Database models

\* File upload handling

\* Resume parsing

\* AI service integration

\* Frontend routing

\* TypeScript-based development

\* Environment-based configuration

\* Modular backend architecture

\* React component architecture



\---



\# 🔒 Security



Sensitive configuration is intentionally excluded from version control.



The project ignores:



```text

.env

.env.local

node\_modules/

dist/

build/

```



API credentials and database secrets should always remain in local environment variables.



\---



\# 🚧 Project Status



\*\*Active Development\*\*



CareerCraft AI is being developed as a full-stack AI career platform and portfolio project.



Future improvements may include:



\* Advanced career analytics

\* More AI career recommendations

\* Improved resume scoring

\* Job recommendation engine

\* Interview performance analytics

\* Enhanced dashboard visualizations

\* Production deployment

\* Automated testing

\* CI/CD



\---



\# 🗺️ Roadmap



\### Phase 1 — Foundation



\* \[x] React frontend

\* \[x] Node.js backend

\* \[x] TypeScript

\* \[x] Authentication

\* \[x] Database integration



\### Phase 2 — Career Intelligence



\* \[x] Resume processing

\* \[x] Job description analysis

\* \[x] Resume–JD matching

\* \[x] Resume tailoring

\* \[x] Interview preparation



\### Phase 3 — Career Dashboard



\* \[x] Dashboard

\* \[x] Application tracking

\* \[x] Profile management

\* \[ ] Advanced analytics



\### Phase 4 — Production



\* \[ ] Automated testing

\* \[ ] CI/CD

\* \[ ] Production deployment

\* \[ ] Monitoring

\* \[ ] Performance optimization



\---



\# 📸 Screenshots



Add your actual application screenshots here as the project UI evolves.



\### Dashboard



```text

docs/screenshots/dashboard.png

```



```markdown

!\[CareerCraft AI Dashboard](docs/screenshots/dashboard.png)

```



\### Resume Analysis



```markdown

!\[Resume Analysis](docs/screenshots/resume-analysis.png)

```



\### Job Matching



```markdown

!\[Job Matching](docs/screenshots/job-matching.png)

```



\### Interview Preparation



```markdown

!\[Interview Preparation](docs/screenshots/interview-prep.png)

```



> \*\*Tip:\*\* Create a `docs/screenshots/` directory and place your real screenshots there. This keeps the repository organized and makes the README presentation much cleaner.



\---



\# 💡 Why CareerCraft AI?



Traditional job searching often requires several disconnected tools.



CareerCraft AI aims to create a single intelligent workspace where users can:



\*\*Understand → Improve → Match → Prepare → Apply → Track\*\*



The project demonstrates how AI can be integrated into practical career workflows rather than functioning as a standalone chatbot.



\---



\# 👨‍💻 Portfolio Highlight



CareerCraft AI demonstrates experience with:



```text

Frontend Engineering

&#x20;       +

Backend Engineering

&#x20;       +

Database Design

&#x20;       +

REST APIs

&#x20;       +

Authentication

&#x20;       +

AI Integration

&#x20;       +

File Processing

&#x20;       +

Modern UI/UX

```



It is built as a practical full-stack application with a focus on modular architecture, AI-assisted workflows, and real-world user experience.



\---



\# 🤝 Contributing



Contributions, ideas, and improvements are welcome.



1\. Fork the repository

2\. Create a feature branch



```bash

git checkout -b feature/your-feature

```



3\. Commit your changes



```bash

git commit -m "Add your feature"

```



4\. Push the branch



```bash

git push origin feature/your-feature

```



5\. Open a Pull Request



\---



\# 📄 License



This project is currently intended as a portfolio/development project.



Add an appropriate open-source license if you decide to distribute the project under specific reuse terms.



\---



\# ⭐ Support



If you find CareerCraft AI interesting, consider giving the repository a ⭐ on GitHub.



\---



<p align="center">



\### Built with ❤️ and AI



\*\*CareerCraft AI — Build a Better Career\*\*



</p>



