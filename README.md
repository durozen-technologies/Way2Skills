# Way2Skills E-Learning Platform

A modern, responsive e-learning and career development web platform for **Way2Skills** (powered by Durozen Technologies). The platform showcases industry-aligned training programs, hands-on full-stack development courses, internship opportunities, student admissions, and direct mentor/student portal access.

---

## 🌟 Key Features

- **Cinematic 3D Interactive Hero**: Built using Three.js and React Three Fiber featuring an interactive particle globe and smooth animations.
- **Course Catalog & Syllabus**: Detailed curriculum breakdowns, learning outcomes, and technical domains (e.g., Full Stack Web Development).
- **Internship & Career Guidance**: Structured internship timelines, practical project exposure, stipend eligibility details, and industry-recognized certifications.
- **Integrated Admissions & Enquiries**: Client-validated multi-step admission and contact forms with automated notifications.
- **Secure Serverless Form Backend**: Custom Google Apps Script integration providing rate-limiting, deduplication, email confirmations, and cross-origin `postMessage` delivery without requiring dedicated backend infrastructure.
- **Student & Mentor Portal**: Dedicated authentication and sign-in interface for accessing course materials, live sessions, and mentor updates.
- **Responsive & Accessible Design**: Crafted with Tailwind CSS v4, supporting mobile layouts, keyboard navigation, and reduced-motion preferences.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript
- **Frontend UI & State**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **3D Graphics & Animations**: [Three.js](https://threejs.org/), [@react-three/fiber](https://r3f.docs.pmnd.rs/), [@react-three/drei](https://github.com/pmndrs/drei)
- **Icons**: [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/)
- **Backend / Notifications**: [Google Apps Script](https://developers.google.com/apps-script) (`Code.gs`)

---

## 📁 Project Structure

```text
Way2Skills_Elearning/
├── .env.example                  # Environment variables template
├── README.md                     # Project overview and documentation
└── frontend/                     # Next.js web application
    ├── .env.example              # Frontend environment variables template
    ├── public/                   # Static assets (logos, icons, vector graphics)
    ├── src/
    │   ├── app/                  # Next.js App Router pages and routes
    │   │   ├── page.tsx          # Homepage (Hero, Featured Courses, Testimonials, FAQ)
    │   │   ├── admissions/       # Admissions enquiry page and form
    │   │   ├── courses/          # Course details (Full Stack Development, etc.)
    │   │   ├── internship/       # Internship opportunities and roadmap
    │   │   ├── contact/          # Contact page and general enquiry form
    │   │   ├── login/            # Student & Mentor login page
    │   │   ├── privacy-policy/   # Privacy policy page
    │   │   ├── terms-and-conditions/ # Terms and conditions page
    │   │   ├── Code.gs           # Google Apps Script handler for form submissions
    │   │   ├── globals.css       # Global styles and custom theme rules
    │   │   └── layout.tsx        # Root layout with fonts, metadata, and nav/footer wrapper
    │   ├── components/           # Modular UI components
    │   │   ├── home/             # Homepage components (3D Hero, Features, FAQ, etc.)
    │   │   ├── layout/           # Shared layout (Navbar, Footer, ScrollReveal)
    │   │   ├── admission/        # Admission form component and handlers
    │   │   ├── contact/          # Contact form component
    │   │   ├── internship/       # Internship timeline and details component
    │   │   └── auth/             # Login and authentication components
    │   └── lib/                  # Utilities, form validation, and submission API clients
    ├── package.json              # Project dependencies and npm scripts
    ├── tsconfig.json             # TypeScript configuration
    └── next.config.ts            # Next.js configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.18+ or 20+ recommended)
- `npm`, `pnpm`, or `yarn`

### 1. Installation

Navigate to the `frontend` directory and install dependencies:

```bash
cd frontend
npm install
```

### 2. Environment Variables

Copy the provided template to create `.env.local` inside the `frontend/` directory:

```bash
cp .env.example .env.local
```

Then configure the Google Apps Script Web App URL:

```env
NEXT_PUBLIC_WAY2SKILLS_APPS_SCRIPT_WEB_APP_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 4. Production Build

To build the project for production and start the optimized server:

```bash
npm run build
npm run start
```

---

## ⚙️ Google Apps Script Backend (`Code.gs`)

The application includes a serverless Google Apps Script backend located at `frontend/src/app/Code.gs` to handle contact and admission form submissions with built-in email notifications:

### Setup Steps:
1. Open [Google Apps Script](https://script.google.com/) and create a new project.
2. Paste the contents of `frontend/src/app/Code.gs` into the script editor.
3. Configure the following **Script Properties** under **Project Settings**:
   - `COMPANY_EMAIL`: The recipient inbox for incoming admission and contact requests.
   - `ALLOWED_RESPONSE_ORIGINS`: Comma-separated list of allowed origins (e.g., `http://localhost:3000, https://yourdomain.com`).
4. Click **Deploy** > **New deployment** > Select **Web app**.
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Copy the deployed Web App URL and set it as `NEXT_PUBLIC_WAY2SKILLS_APPS_SCRIPT_WEB_APP_URL` in your frontend environment.

---

## 📜 Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Builds the production-ready bundle |
| `npm run start` | Serves the production build |
| `npm run lint` | Runs ESLint across the codebase |

---

## 📄 License

Proprietary — All rights reserved by Way2Skills & Durozen Technologies.
