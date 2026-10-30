const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// CONNECT TO THE schoolFeesDB in Compass
mongoose.connect('mongodb+srv://nayad:Nayad124@cluster0.ywhqcei.mongodb.net/bugemaDB?retryWrites=true&w=majority')
.then(()=> console.log('Connected to schoolFeesDB'))
.catch(err => console.log(err));

// STUDENT SCHEMA
const studentSchema = new mongoose.Schema({
  name: String,
  gender: String,
  email: String,
  course: String
});
const Student = mongoose.model('students', studentSchema);

// CRUD APIS
// READ - Get all students
app.get('/api/students', async (req,res)=>{
  const students = await Student.find();
  res.json(students);
});

// CREATE - Add student
app.post('/api/students', async (req,res)=>{
  const newStudent = new Student(req.body);
  await newStudent.save();
  res.json(newStudent);
});

// UPDATE - Edit student
app.put('/api/students/:id', async (req,res)=>{
  const updated = await Student.findByIdAndUpdate(req.params.id, req.body, {new:true});
  res.json(updated);
});

// DELETE
app.delete('/api/students/:id', async (req,res)=>{
  await Student.findByIdAndDelete(req.params.id);
  res.json({message: 'Deleted'});
});

app.listen(3000, ()=> console.log('Server running on http://localhost:3000'));