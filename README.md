# School Fees Management System - NoSQL MongoDB Project

**Student:** Nayad Attoumane  
**Database:** schoolFeesDB (MongoDB Atlas - Cloud)  
**Live Project:** https://nosql-mongo-project.onrender.com  
**Repository:** https://github.com/attoumanenayad/nosql-mongo-project

## Project Overview
School Fees System based on midsem submission. Manages students, courses, payments, and teachers with relationships. The system allows a school to add students, record fees, view all students, update fees, and delete students.

## Collections (4)
1. **students:** studentId, name, gender, email, courseId, fees, guardian { name, phone }
2. **courses:** courseId, courseName, durationMonths, feePerTerm, teacherId
3. **payments:** paymentId, studentId, amount, date, method, receiptNo
4. **teachers:** teacherId, name, email, subject, phone

Example: S001 Nayad Attoumane - COO1 - 500000

## Tech Stack
- Backend: Node.js, Express, Mongoose
- Frontend: HTML, CSS, JavaScript (Fetch API)
- Database: MongoDB Atlas (Cloud) - viewed with MongoDB Compass
- Hosting: Render (Frontend + Backend)

## How to Run Locally
1. Clone: git clone https://github.com/attoumanenayad/nosql-mongo-project
2. cd nosql-mongo-project
3. npm install
4. Create .env file: MONGODB_URI=your-atlas-connection-string PORT=3000
5. node server.js
6. Open http://localhost:3000

## Live Demo
1. Open https://nosql-mongo-project.onrender.com
2. Open MongoDB Compass connected to Atlas -> schoolFeesDB -> students
3. Test CRUD on frontend - changes reflect instantly in Compass after Refresh

## CRUD Operations
- Create: Fill form -> Add
- Read: Tables auto-load from GET /api/students
- Update: Click Edit -> form fills -> Update
- Delete: Click Delete

All operations use REST APIs: /api/students, /api/courses, /api/payments, /api/teachers
