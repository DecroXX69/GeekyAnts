# Engineering Resource Management System

A full-stack application for managing engineering project assignments, team capacity, and skill tracking. Built as part of a 2-day assignment challenge.

---

## 🚀 Features

- Role-based authentication (Manager & Engineer)
- Engineer profiles with skills, seniority, and max capacity
- Project management with required skills and timeline
- Assignment system with allocation validation and overlap checks
- Team utilization analytics and skill gap analysis
- Responsive, dashboard-style UI using **ShadCN UI + Tailwind CSS**
- AI-assisted development using **ChatGPT** and **Claude**

---

## 🛠️ Tech Stack

**Frontend:**
- React (Vite)
- ShadCN UI (Radix + Tailwind CSS)
- React Router
- React Hook Form

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication

---

## 🧩 Folder Structure

.
├── backend
│ ├── models/
│ ├── controllers/
│ ├── routes/
│ ├── services/
│ ├── seed/seedData.js
│ └── server.js
└── frontend
├── src/
│ ├── pages/
│ ├── components/
│ ├── context/
│ ├── api/
│ └── hooks/

yaml
Copy
Edit

---

## ⚙️ Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/engineering-resource-management.git
cd engineering-resource-management
2. Configure Environment
Create a .env file inside the /backend directory:

ini
Copy
Edit
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
PORT=5000
3. Install Dependencies
Backend:
bash
Copy
Edit
cd backend
npm install
Frontend:
bash
Copy
Edit
cd ../frontend
npm install
4. Run the Application
Backend:
bash
Copy
Edit
cd backend
npm start
Frontend:
bash
Copy
Edit
cd frontend
npm run dev
5. 🌱 Seed the Database
To load sample data (manager, engineers, projects, and assignments):

bash
Copy
Edit
cd backend/seed
node seedData.js
👤 Demo Users
Role	Email	Password
Manager	manager@example.com	Password123
Engineer	alice@example.com	Password123
Engineer	bob@example.com	Password123

🤖 AI Tools Used
Throughout development, I extensively used ChatGPT and Claude to accelerate development and maintain best practices:

✅ ChatGPT
Designed backend API architecture and REST endpoints

Generated initial models, controllers, and service logic

Debugged complex Mongoose and Express issues

Advised on Tailwind vs ShadCN integration

✅ Claude
Focused primarily on frontend components

Built React pages using ShadCN UI kit and Vite

Implemented routing logic and dashboard views

Provided real-time improvements to component structure

🧪 AI Development Strategy
Every AI-generated code block was reviewed and modified to match project needs

Validation and refactoring were performed for edge cases and performance

Prompts were iteratively refined to get Claude and ChatGPT to produce precise, maintainable logic

All final logic was debugged and tested manually across routes and components

📊 Success Criteria
 Engineer capacity accurately calculated

 Assignments are capacity-bound and conflict-free

 UI is responsive and clean for both roles

 Dashboard views show analytics and availability

 Seed data includes projects, engineers, and assignments

📁 Bonus Features (partially implemented)
Skill gap analysis with project-level insights

Engineer availability timeline using charts

Utilization breakdown by engineer

📬 Contact
Developer: Rushikesh Palav
Email: rushikeshpalav23@gmail.com
