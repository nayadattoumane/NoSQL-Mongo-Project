require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log('Connected to MongoDB'))
.catch(err => console.log(err));

// SCHEMAS
const studentSchema = new mongoose.Schema({
  studentId: String, name: String, gender: String, email: String,
  courseId: String, totalFees: Number,
  guardian: { name: String, phone: String, relationship: String }
});
const Student = mongoose.model('students', studentSchema);

const courseSchema = new mongoose.Schema({
  courseId: String, courseName: String, durationMonths: Number, feePerTerm: Number, teacherId: String
});
const Course = mongoose.model('courses', courseSchema);

const paymentSchema = new mongoose.Schema({
  paymentId: String, studentId: String, amount: Number, date: String, method: String, receiptNo: String
});
const Payment = mongoose.model('payments', paymentSchema);

const teacherSchema = new mongoose.Schema({
  teacherId: String, name: String, email: String, subject: String, phone: String
});
const Teacher = mongoose.model('teachers', teacherSchema);

function makeCRUD(model, name) {
  app.get(`/api/${name}`, async (req,res)=>{ res.json(await model.find()); });
  app.post(`/api/${name}`, async (req,res)=>{ const doc = new model(req.body); await doc.save(); res.json(doc); });
  app.put(`/api/${name}/:id`, async (req,res)=>{ res.json(await model.findByIdAndUpdate(req.params.id, req.body, {new:true})); });
  app.delete(`/api/${name}/:id`, async (req,res)=>{ await model.findByIdAndDelete(req.params.id); res.json({message: 'Deleted'}); });
}
makeCRUD(Student, 'students');
makeCRUD(Course, 'courses');
makeCRUD(Payment, 'payments');
makeCRUD(Teacher, 'teachers');

app.get('/', (req,res)=>{ res.sendFile(path.join(__dirname, 'frontend', 'index.html')); });
app.listen(process.env.PORT, ()=> console.log('Server running on http://localhost:'+process.env.PORT));