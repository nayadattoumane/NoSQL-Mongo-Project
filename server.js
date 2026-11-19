// Load secrets from .env file (MONGO_URI and PORT)
require('dotenv').config();

// Import tools we need
const express = require('express'); // Web framework to make routes like /api/students
const mongoose = require('mongoose'); // Tool to talk to MongoDB easily
const cors = require('cors'); // Allows frontend to call backend
const path = require('path'); // Helps find frontend folder on Windows and Mac

// Create the Express app (our backend server)
const app = express();

// Allow frontend to call backend
app.use(cors());

// Read JSON sent from frontend. Without this, req.body would be empty
app.use(express.json());

// Serve frontend files (index.html, style.css, script.js) from frontend folder
app.use(express.static(path.join(__dirname, 'frontend')));

// Connect to MongoDB using MONGO_URI from .env file
mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log('Connected to MongoDB')) // Show this if connection works
.catch(err => console.log(err)); // Show error if connection fails

// ========== SCHEMAS - Blueprint for each collection ==========
// Schema = tells MongoDB what fields to expect and their type

// STUDENTS collection
const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true }, // No two students can have same ID
  name: String, gender: String, email: String,
  courseId: String, totalFees: Number,
  // Guardian is inside student - this is NoSQL embedding, no separate table needed
  guardian: { name: String, phone: String, relationship: String }
});
// Model = tool to do CRUD. 'students' is the collection name in MongoDB
const Student = mongoose.model('students', studentSchema);

// COURSES collection
const courseSchema = new mongoose.Schema({
  courseId: { type: String, unique: true }, // No two courses can have same ID
  courseName: String, durationMonths: Number, feePerTerm: Number, teacherId: String
  // teacherId links this course to a teacher
});
const Course = mongoose.model('courses', courseSchema);

// PAYMENTS collection
const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true }, // No two payments can have same ID
  studentId: String, amount: Number, date: String, method: String, receiptNo: String
  // studentId links this payment to a student
});
const Payment = mongoose.model('payments', paymentSchema);

// TEACHERS collection
const teacherSchema = new mongoose.Schema({
  teacherId: { type: String, unique: true }, // No two teachers can have same ID
  name: String, email: String, subject: String, phone: String
});
const Teacher = mongoose.model('teachers', teacherSchema);

// ========== HELPER - Turn MongoDB error into friendly message ==========
// err.code 11000 = Duplicate Key Error from MongoDB (unique index blocked it)
function getFriendlyError(err, idField) {
  if (err.code === 11000) {
    // err.keyValue looks like { studentId: 'S001' }
    const field = Object.keys(err.keyValue || {})[0] || idField;
    const value = err.keyValue ? err.keyValue[field] : '';
    const msg = `${field} '${value}' already exists. Please use a different ${field}.`;
    return msg;
  }
  // Any other error - show real reason, not just "ID already exists"
  return err.message || 'Something went wrong. Please try again.';
}

// ========== NEW HELPER - Check if a linked ID really exists ==========
// This is the PERMANENT FIX for orphans.
// Example: checkExists(Course, 'courseId', 'C008') -> false if C008 does not exist
// We use this BEFORE saving, so we never save a student with a fake courseId.
async function checkExists(Model, field, value) {
  // If value is empty, let the other validation handle it - return true so we don't show wrong message here
  if (!value) return true;
  // findOne returns the document if found, null if not found
  const found = await Model.findOne({ [field]: value });
  // !! turns it into true/false: found = true, null = false
  return !!found;
}

// ========== NEW HELPER - Check all links for one collection ==========
// Returns an error message string if a link is broken, or null if all links are OK
// body = what user typed in the form, e.g. { studentId: 'S010', courseId: 'C008' }
// name = which collection we are saving to: 'students', 'courses', 'payments', 'teachers'
async function checkLinks(name, body) {
  // STUDENTS: courseId must exist in Courses
  if (name === 'students') {
    // Ask MongoDB: Does course C008 exist?
    const ok = await checkExists(Course, 'courseId', body.courseId);
    // If NOT, return friendly message to show in red box
    if (!ok) return `Course '${body.courseId}' does not exist. Please add the course first or use a valid CourseId.`;
  }

  // COURSES: teacherId must exist in Teachers
  if (name === 'courses') {
    // Ask MongoDB: Does teacher T999 exist?
    const ok = await checkExists(Teacher, 'teacherId', body.teacherId);
    if (!ok) return `Teacher '${body.teacherId}' does not exist. Please add the teacher first or use a valid TeacherId.`;
  }

  // PAYMENTS: studentId must exist in Students
  if (name === 'payments') {
    // Ask MongoDB: Does student S999 exist?
    const ok = await checkExists(Student, 'studentId', body.studentId);
    if (!ok) return `Student '${body.studentId}' does not exist. Please add the student first or use a valid StudentId.`;
  }

  // TEACHERS: points to nobody, so no check needed
  // If we reach here, all links are OK (or no links to check)
  return null;
}

// ========== CRUD - One function makes all routes ==========
// Instead of writing 16 routes, we write 1 function and reuse it 4 times

function makeCRUD(model, name, idField) {
  // READ ALL - Example: GET /api/students -> returns all students
  app.get(`/api/${name}`, async (req,res)=>{ res.json(await model.find()); });

  // CREATE - Example: POST /api/students -> saves new student from req.body
  // try/catch = if ID already exists, send error instead of crashing
  app.post(`/api/${name}`, async (req,res)=>{ 
    try { 
      // NEW: PERMANENT FIX - Check links BEFORE saving
      // If user typed C008 which doesn't exist, linkError will be a message, not null
      const linkError = await checkLinks(name, req.body);
      // If linkError exists, BLOCK the save and send 400 + friendly message
      // Frontend will show this in the red box, and will NOT clear the form
      if (linkError) return res.status(400).json({ message: linkError, error: linkError });
      // If linkError is null, all links are OK, save normally
      const doc = new model(req.body); 
      await doc.save(); 
      res.json(doc); 
    }
    catch(err){ 
      const msg = getFriendlyError(err, idField);
      // Send BOTH message and error so old frontend and new frontend both work
      res.status(400).json({ message: msg, error: msg }); 
    }
  });

  // UPDATE - Example: PUT /api/students/123 -> updates student with _id 123
  // {new:true} means return the updated version, not the old one
  app.put(`/api/${name}/:id`, async (req,res)=>{ 
    try { 
      // NEW: PERMANENT FIX AGAIN - Must check in PUT too!
      // Otherwise user can ADD with a good course, then EDIT it to a fake course C008
      const linkError = await checkLinks(name, req.body);
      if (linkError) return res.status(400).json({ message: linkError, error: linkError });
      const updated = await model.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true}); 
      res.json(updated); 
    }
    catch(err){ 
      const msg = getFriendlyError(err, idField);
      res.status(400).json({ message: msg, error: msg }); 
    }
  });

  // DELETE - Example: DELETE /api/students/123 -> deletes student with _id 123
  app.delete(`/api/${name}/:id`, async (req,res)=>{ await model.findByIdAndDelete(req.params.id); res.json({message: 'Deleted'}); });
}

// Create CRUD routes for all 4 collections
// 3rd parameter tells the error message which ID to show: studentId, courseId, etc.
makeCRUD(Student, 'students', 'studentId');
makeCRUD(Course, 'courses', 'courseId');
makeCRUD(Payment, 'payments', 'paymentId');
makeCRUD(Teacher, 'teachers', 'teacherId');

// When user opens localhost:3000, send index.html
app.get('/', (req,res)=>{ res.sendFile(path.join(__dirname, 'frontend', 'index.html')); });

// Start server on PORT from .env file (3000)
app.listen(process.env.PORT, ()=> console.log('Server running on http://localhost:'+process.env.PORT));