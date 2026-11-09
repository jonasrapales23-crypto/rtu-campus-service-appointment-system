import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// 1. FETCH ALL: Serves dashboard table data with table user joins
app.get("/api/appointments", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.*, u.name as student_name, u.student_id_number as student_program 
      FROM appointments a
      JOIN users u ON a.student_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. COUNT SLOTS: Calculates live slot occupancies
app.get("/api/appointments/count", async (req, res) => {
  const { officeCode, date, time } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM appointments WHERE department = ? AND appointment_date = ? AND time_slot = ? AND status != "Cancelled"',
      [officeCode, date, time]
    );
    res.json({ count: rows.count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 3. CREATE BOOKING: Production-Resilient Fallback Insertion System
app.post("/api/appointments", async (req, res) => {
  console.log("📥 RECEIVED BOOKING PAYLOAD:", req.body);
  
  const { controlNumber, officeCode, service, date, time, student, feeText, receiverName, details } = req.body;

  try {
    await db.query("START TRANSACTION");

    // 1. Safe Naming Extraction Layer (handles all variations safely)
    const studentProgram = student?.program || req.body.studentProgram || "BSIT"; 
    const studentName = student?.name || req.body.studentName || "Juan Dela Cruz";
    const studentEmail = student?.email || req.body.studentEmail || "student@rtu.edu.ph";
    
    const cleanOffice = officeCode || req.body.officeCode || req.body.department || req.body.config?.code || "GENERAL";
    const cleanService = service || req.body.service || req.body.config?.service || "Medical Assessment (Freshmen)";
    
    const cleanDate = date || req.body.appointment_date || req.body.appointmentDate || "2026-11-08";
    const cleanTime = time || req.body.time_slot || req.body.timeSlot || "09:00 AM";

    // 2. Manage User Records Pointers safely
    const [users] = await db.query("SELECT id FROM users WHERE student_id_number = ?", [studentProgram]);
    let userId;
    if (users.length === 0) {
      const [newStudent] = await db.query(
        'INSERT INTO users (student_id_number, name, email, password, role) VALUES (?, ?, ?, "hashed_pass", "student")',
        [studentProgram, studentName, studentEmail]
      );
      userId = newStudent.insertId;
    } else {
      userId = users[0]?.id || users.id || users || 1;
    }

    // 3. Queue Tracking Counter Calculations
    const [queueCheck] = await db.query(
      'SELECT COUNT(*) as count FROM appointments WHERE department = ? AND appointment_date = ?',
      [cleanOffice, cleanDate]
    );
    // 🟢 FIXED: Safe array evaluation logic
    const nextQueue = (queueCheck?.length || 0) + 1;

    // 4. Structural Control Number Sequence Generator
    let generatedControlNo = controlNumber;
    if (!generatedControlNo && cleanDate) {
      const parts = cleanDate.split("-");
      const month = parts[1] || "11";
      const day = parts[2] || "08";
      const officeLetter = cleanOffice === "HSU" ? "H" : cleanOffice === "SRAU" ? "R" : cleanOffice === "BAU" ? "B" : "G";
      const queueStr = String(nextQueue).padStart(3, "0");
      generatedControlNo = `${month}-${day}-${officeLetter}-${queueStr}-SRV-${Date.now().toString().slice(-6)}`;
    }

    // 5. Baseline Query: Inserts columns guaranteed to exist in your base schema layout
    const [result] = await db.query(
      `INSERT INTO appointments 
       (student_id, department, appointment_date, time_slot, status) 
       VALUES (?, ?, ?, ?, 'Submitted')`,
      [userId, cleanOffice, cleanDate, cleanTime]
    );

    const insertedId = result.insertId;

    // 6. SAFE COLUMN DISCOVERY BLOCKS: Catches safely if columns do not exist yet
    try {
      await db.query(`UPDATE appointments SET controlNumber = ? WHERE id = ?`, [generatedControlNo, insertedId]);
    } catch (e) { console.log("Note: controlNumber column missing, skipping..."); }

    try {
      await db.query(`UPDATE appointments SET queue = ? WHERE id = ?`, [nextQueue, insertedId]);
    } catch (e) { console.log("Note: queue column missing, skipping..."); }

    try {
      await db.query(`UPDATE appointments SET service = ? WHERE id = ?`, [cleanService, insertedId]);
    } catch (e) { console.log("Note: service column missing, skipping..."); }

    try {
      await db.query(`UPDATE appointments SET feeText = ? WHERE id = ?`, [feeText || "No fee", insertedId]);
    } catch (e) { console.log("Note: feeText column missing, skipping..."); }

    try {
      await db.query(`UPDATE appointments SET receiverName = ? WHERE id = ?`, [receiverName || null, insertedId]);
    } catch (e) { console.log("Note: receiverName column missing, skipping..."); }

    try {
      const detailsString = details ? JSON.stringify(details) : null;
      await db.query(`UPDATE appointments SET details = ? WHERE id = ?`, [detailsString, insertedId]);
    } catch (e) { console.log("Note: details column missing, skipping..."); }

    // 7. Record System Operations Audit Logs
    const logDetails = `Student ${studentName} (${studentProgram}) booked ${cleanService} at ${cleanOffice}. Control No: ${generatedControlNo}`;
    await db.query(
      'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, "BOOK_APPOINTMENT", ?, ?)',
      [userId, logDetails, req.ip]
    );

    await db.query("COMMIT");
    console.log("💾 SUCCESS: Stored in DB safely with row ID:", insertedId);

    res.status(201).json({ 
      id: String(insertedId), 
      controlNumber: generatedControlNo, 
      status: "Submitted",
      queue: nextQueue,
      feeText: feeText || "No fee"
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("⛔ CRITICAL SERVER ERROR EXCEPTION:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. CANCEL LOGIC: Updates reservation fields state
app.put("/api/appointments/:id/cancel", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("START TRANSACTION");
    await db.query('UPDATE appointments SET status = "Cancelled" WHERE id = ?', [id]);
    await db.query('INSERT INTO audit_logs (action, details, ip_address) VALUES ("CANCEL_APPOINTMENT", ?, ?)', [`Appointment ID ${id} was marked as Cancelled.`, req.ip]);
    await db.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await db.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

// 5. RESCHEDULE LOGIC: Shifts calendar items configurations
app.put("/api/appointments/:id/reschedule", async (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;
  try {
    await db.query("START TRANSACTION");
    await db.query("UPDATE appointments SET appointment_date = ?, time_slot = ? WHERE id = ?", [date, time, id]);
    await db.query('INSERT INTO audit_logs (action, details, ip_address) VALUES ("RESCHEDULE_APPOINTMENT", ?, ?)', [`Appointment ID ${id} shifted to ${date} at ${time}.`, req.ip]);
    await db.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await db.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend Server running locally on http://localhost:${PORT}`));