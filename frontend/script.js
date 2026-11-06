// ========== HELPER FUNCTIONS - Used by everything ==========

// Show one tab and hide the others (Students / Courses / Payments / Teachers)
function showTab(name) {
    // Remove blue color from all tab buttons
    document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
    // Hide all sections
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    // Show only the clicked section
    document.getElementById(name).classList.add('active');
    // Add blue color to the clicked tab button
    document.querySelectorAll('.tab').forEach(b=>{if(b.textContent.toLowerCase().includes(name)) b.classList.add('active')});
    // Reload all tables so data is fresh
    loadAll();
}

// Shortcut to talk to backend - fetch + get JSON in one line
// Used ONLY for GET and DELETE (reading / deleting - no error message needed)
async function fetchJSON(url,opts) {
    const r=await fetch(url,opts);return r.json();
}

// NEW: Show a message in the red box under the form
// Example: showError('s_error', "studentId 'S001' already exists...")
function showError(errorId, msg, isSuccess) {
    // Find the red div by its id, e.g. 's_error'
    const box = document.getElementById(errorId);
    // If box not found, do nothing (safety check)
    if(!box) return;
    // Put the message text inside the box
    box.textContent = msg;
    // If isSuccess is true, make text green, otherwise keep it red
    if(isSuccess) box.classList.add('success');
    else box.classList.remove('success');
}

// NEW: Clear the red box - call this when save succeeds or user starts typing again
// Example: clearError('s_error')
function clearError(errorId) {
    // Find the box
    const box = document.getElementById(errorId);
    // If found, empty its text so it becomes hidden again
    if(box) box.textContent = '';
}

// NEW: For POST / PUT - checks if backend said error, shows it in red box, returns true/false
// errorId tells it which red box to use, e.g. 's_error' for students
async function saveJSON(url, method, body, errorId) {
    // Clear old error before trying again, so user sees fresh result
    clearError(errorId);
    // Send data to backend
    const r = await fetch(url, {method: method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
    // Get backend answer as JSON
    const data = await r.json();
    // If backend said error (400), show its message in red box
    if (!r.ok) {
        // data.message is the friendly message from server.js, e.g. "studentId 'S001' already exists..."
        showError(errorId, data.message || data.error || 'Something went wrong', false);
        // Return false = Tell caller: DO NOT clear form
        return false;
    }
    // If success, show green "Saved!" message for 2 seconds, then clear it
    showError(errorId, 'Saved successfully!', true);
    // After 2 seconds, hide the green message again
    setTimeout(()=>clearError(errorId), 2000);
    // Return true = Tell caller: OK, you can clear form
    return true;
}

// Get value from an input box by its id. Example: val('s_name') = what user typed in Name
function val(id) {
        return document.getElementById(id).value
}

// Put a value into an input box. Example: set('s_name','Nayad')
function set(id,v) {
    document.getElementById(id).value=v||''
}

// ========== STUDENTS - CRUD ==========

// READ: Get all students from backend and show them in the table
async function loadStudents() {
    const data=await fetchJSON('/api/students');
    // Loop through each student and make a table row. ||'' means show empty if no value
    document.getElementById('studentsTable').innerHTML=data.map(d=>`<tr><td>${d.studentId||''}</td><td>${d.name||''}</td><td>${d.gender||''}</td><td>${d.email||''}</td><td>${d.courseId||''}</td><td>${d.totalFees||''}</td><td>${d.guardian? (d.guardian.name||'')+' '+(d.guardian.phone||''):''}</td><td><button class="btn-edit" onclick="editStudent('${d._id}')">Edit</button> <button class="btn-del" onclick="del('students','${d._id}')">Delete</button></td></tr>`).join('');
    // Save students so Edit button can find them later without fetching again
    window._students=data;
}

// CREATE or UPDATE: Called when Add / Update button is clicked
async function addStudent() {
    // Collect all inputs into one object to send to backend
    const body={studentId:val('s_studentId'),name:val('s_name'),gender:val('s_gender'),email:val('s_email'),courseId:val('s_courseId'),totalFees:Number(val('s_totalFees')),guardian:{name:val('s_guardianName'),phone:val('s_guardianPhone')}};
    // Check hidden box - if it has an id, we are editing, if empty we are adding new
    const id=val('s_editId');
    let ok;
    // Send to backend, tell saveJSON to show errors in 's_error' red box
    if(id){ ok = await saveJSON('/api/students/'+id, 'PUT', body, 's_error'); }else{ ok = await saveJSON('/api/students', 'POST', body, 's_error'); }
    if(!ok) return; // Duplicate! saveJSON already showed red message, DON'T clear form
    // Clear the form after saving - only if it actually saved
    ['s_studentId','s_name','s_email','s_courseId','s_totalFees','s_guardianName','s_guardianPhone','s_editId'].forEach(i=>set(i,''));loadStudents();
}

// EDIT: Fill the form with the student's old data so user can change it
function editStudent(id) {
    // Clear old error when user clicks Edit, so old message doesn't confuse them
    clearError('s_error');
    const d=window._students.find(x=>x._id==id);set('s_studentId',d.studentId);set('s_name',d.name);set('s_gender',d.gender);set('s_email',d.email);set('s_courseId',d.courseId);set('s_totalFees',d.totalFees);set('s_guardianName',d.guardian?.name);set('s_guardianPhone',d.guardian?.phone);set('s_editId',d._id);
}

// ========== COURSES - CRUD ==========

// READ: Get all courses and show them
async function loadCourses() {
    const data=await fetchJSON('/api/courses');
    document.getElementById('coursesTable').innerHTML=data.map(d=>`<tr><td>${d.courseId}</td><td>${d.courseName}</td><td>${d.durationMonths}</td><td>${d.feePerTerm}</td><td>${d.teacherId}</td><td><button class="btn-edit" onclick="editCourse('${d._id}')">Edit</button> <button class="btn-del" onclick="del('courses','${d._id}')">Delete</button></td></tr>`).join('');
    window._courses=data;
}

// CREATE or UPDATE: Add new course or update existing one
async function addCourse() {
    const body={courseId:val('c_courseId'),courseName:val('c_courseName'),durationMonths:Number(val('c_durationMonths')),feePerTerm:Number(val('c_feePerTerm')),teacherId:val('c_teacherId')};
    const id=val('c_editId');
    let ok;
    // Show course errors in 'c_error' red box
    if(id){ ok = await saveJSON('/api/courses/'+id, 'PUT', body, 'c_error'); }else{ ok = await saveJSON('/api/courses', 'POST', body, 'c_error'); }
    if(!ok) return; // Duplicate, don't clear form
    ['c_courseId','c_courseName','c_durationMonths','c_feePerTerm','c_teacherId','c_editId'].forEach(i=>set(i,''));loadCourses();
}

// EDIT: Fill course form with old data
function editCourse(id) {
    // Clear old course error when editing
    clearError('c_error');
    const d=window._courses.find(x=>x._id==id);set('c_courseId',d.courseId);set('c_courseName',d.courseName);set('c_durationMonths',d.durationMonths);set('c_feePerTerm',d.feePerTerm);set('c_teacherId',d.teacherId);set('c_editId',d._id);
}

// ========== PAYMENTS - CRUD ==========

// READ: Get all payments and show them
async function loadPayments() {
    const data=await fetchJSON('/api/payments');
    document.getElementById('paymentsTable').innerHTML=data.map(d=>`<tr><td>${d.paymentId}</td><td>${d.studentId}</td><td>${d.amount}</td><td>${d.date}</td><td>${d.method}</td><td>${d.receiptNo}</td><td><button class="btn-edit" onclick="editPayment('${d._id}')">Edit</button> <button class="btn-del" onclick="del('payments','${d._id}')">Delete</button></td></tr>`).join('');
    window._payments=data;
}

// CREATE or UPDATE: Add new payment or update existing one
async function addPayment() {
    const body={paymentId:val('p_paymentId'),studentId:val('p_studentId'),amount:Number(val('p_amount')),date:val('p_date'),method:val('p_method'),receiptNo:val('p_receiptNo')};
    const id=val('p_editId');
    let ok;
    // Show payment errors in 'p_error' red box
    if(id){ ok = await saveJSON('/api/payments/'+id, 'PUT', body, 'p_error'); }else{ ok = await saveJSON('/api/payments', 'POST', body, 'p_error'); }
    if(!ok) return; // Duplicate, don't clear form
    ['p_paymentId','p_studentId','p_amount','p_date','p_receiptNo','p_editId'].forEach(i=>set(i,''));loadPayments();
}

// EDIT: Fill payment form with old data
function editPayment(id) {
    // Clear old payment error when editing
    clearError('p_error');
    const d=window._payments.find(x=>x._id==id);set('p_paymentId',d.paymentId);set('p_studentId',d.studentId);set('p_amount',d.amount);set('p_date',d.date);set('p_method',d.method);set('p_receiptNo',d.receiptNo);set('p_editId',d._id);
}

// ========== TEACHERS - CRUD ==========

// READ: Get all teachers and show them
async function loadTeachers() {
    const data=await fetchJSON('/api/teachers');
    document.getElementById('teachersTable').innerHTML=data.map(d=>`<tr><td>${d.teacherId}</td><td>${d.name}</td><td>${d.email}</td><td>${d.subject}</td><td>${d.phone}</td><td><button class="btn-edit" onclick="editTeacher('${d._id}')">Edit</button> <button class="btn-del" onclick="del('teachers','${d._id}')">Delete</button></td></tr>`).join('');
    window._teachers=data;
}

// CREATE or UPDATE: Add new teacher or update existing one
async function addTeacher() {
    const body={teacherId:val('t_teacherId'),name:val('t_name'),email:val('t_email'),subject:val('t_subject'),phone:val('t_phone')};
    const id=val('t_editId');
    let ok;
    // Show teacher errors in 't_error' red box
    if(id){ ok = await saveJSON('/api/teachers/'+id, 'PUT', body, 't_error'); }else{ ok = await saveJSON('/api/teachers', 'POST', body, 't_error'); }
    if(!ok) return; // Duplicate, don't clear form
    ['t_teacherId','t_name','t_email','t_subject','t_phone','t_editId'].forEach(i=>set(i,''));loadTeachers();
}

// EDIT: Fill teacher form with old data
function editTeacher(id) {
    // Clear old teacher error when editing
    clearError('t_error');
    const d=window._teachers.find(x=>x._id==id);set('t_teacherId',d.teacherId);set('t_name',d.name);set('t_email',d.email);set('t_subject',d.subject);set('t_phone',d.phone);set('t_editId',d._id);
}

// ========== DELETE + STARTUP ==========

// DELETE: Works for all 4 collections. Asks "Are you sure?" first
async function del(col,id) {
    if(!confirm('Delete?'))return;await fetchJSON('/api/'+col+'/'+id,{method:'DELETE'});loadAll();
}

// Load all 4 tables at once
function loadAll() {
    loadStudents();loadCourses();loadPayments();loadTeachers();
}

// Run when page first opens
loadAll();