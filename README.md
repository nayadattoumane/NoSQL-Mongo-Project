\# School Fees Management System - NoSQL MongoDB Project



\*\*Student: Nayad Attoumane\*\*

\*\*Database: schoolFeesDB (MongoDB Compass Local)\*\*



\## Midsem Case

School Fees System based on midsem submission. Manages students, courses, payments, and teachers with relationships.



\## Collections (4)

1\. \*\*students\*\*: studentId, name, gender, email, courseId, totalFees, guardian{ name, phone }

2\. \*\*courses\*\*: courseId, courseName, durationMonths, feePerTerm, teacherId

3\. \*\*payments\*\*: paymentId, studentId, amount, date, method, receiptNo

4\. \*\*teachers\*\*: teacherId, name, email, subject, phone



Example: S002 Nayad Attoumane - C002 English - P002 500000 Bank deposit



\## Tech Stack

\- Backend: Node.js, Express, Mongoose, MongoDB Compass (localhost:27017)

\- Frontend: HTML, CSS, JavaScript (Fetch API)

\- Database: schoolFeesDB local



\## How to Run (Windows \& Mac)

1\. Install MongoDB Compass and create database schoolFeesDB

2\. Clone: git clone <your-repo-url>

3\. cd NoSQL-Mongo-Project

4\. npm install

5\. Check .env: MONGO\_URI=mongodb://localhost:27017/schoolFeesDB  PORT=3000

6\. node server.js

7\. Open http://localhost:3000

8\. Test CRUD on 4 tabs - changes reflect instantly in Compass



\## CRUD Demo

\- Create: Fill form -> Add/Update

\- Read: Tables auto-load

\- Update: Click Edit -> form fills -> Update

\- Delete: Click Delete



All operations use REST APIs: /api/students, /api/courses, /api/payments, /api/teachers

