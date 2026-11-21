import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// STUDENT & ADMIN APPOINTMENT ENDPOINTS
// ==========================================

// 1. FETCH ALL APPOINTMENTS FOR STUDENT TICKET & HISTORY
app.get("/api/appointments", async (req, res) => {
  try {
    const [appointments] = await db.query("SELECT * FROM appointments ORDER BY id DESC");
    const [users] = await db.query("SELECT * FROM users");

    const combined = appointments.map((a) => {
      const student = users.find((u) => u.id === a.student_id) || {};
      return {
        ...a,
        officeCode: a.department || "HSU",
        date: a.appointment_date,
        time: a.time_slot,
        student_name: student.name || "Juan Dela Cruz",
        student_program: student.student_id_number || "BSIT",
      };
    });

    res.json(combined);
  } catch (err) {
    console.error("Fetch Appointments Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. FETCH ALL APPOINTMENTS FOR ADMIN DASHBOARDS
app.get("/api/admin/appointments", async (req, res) => {
  try {
    const [appointments] = await db.query("SELECT * FROM appointments ORDER BY id DESC");
    const [users] = await db.query("SELECT * FROM users");

    const combined = appointments.map((a) => {
      const student = users.find((u) => u.id === a.student_id) || {};
      return {
        id: a.id,
        controlNumber: a.controlNumber || null,
        officeCode: a.department || "HSU",
        service: a.service || null,
        date: a.appointment_date,
        time: a.time_slot,
        status: a.status || "Submitted",
        student: student.name || "Juan Dela Cruz",
        number: student.student_id_number || "2023-00123",
        program: student.student_id_number || "BSIT",
        receiverName: a.receiverName || null,
        queue: a.queue || 1,
      };
    });

    res.json(combined);
  } catch (err) {
    console.error("Admin Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. UPDATE APPOINTMENT STATUS FROM ADMIN DASHBOARDS
app.put("/api/admin/appointments/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, adminName = "Office Admin" } = req.body;

  // Force status values to lowercase to match your MySQL table schema constraints perfectly
  let dbStatus = String(status).toLowerCase();
  if (dbStatus === "served") {
    dbStatus = "claimed";
  }

  try {
    await db.query("START TRANSACTION");

    // Update the core table with the clean lowercase status string
    await db.query("UPDATE appointments SET status = ? WHERE id = ?", [dbStatus, id]);

    await db.query(
      'INSERT INTO audit_logs (action, details, ip_address) VALUES ("UPDATE_STATUS", ?, ?)',
      [`${adminName} marked appointment #${id} as ${status}`, req.ip]
    );

    await db.query("COMMIT");
    res.json({ success: true, id, status: dbStatus });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Status Update Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. FETCH LIVE AUDIT LOGS FOR SUPER ADMIN
app.get("/api/admin/audit-logs", async (req, res) => {
  try {
    // Select the raw log records array dynamically to bypass explicit column naming clashing constraints
    const [logs] = await db.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
    const [users] = await db.query("SELECT * FROM users");

    const formattedLogs = logs.map((log) => {
      // Find matching user row pointers gracefully if present
      const actor = users.find((u) => u.id === log.user_id) || {};
      
      // Fallback variables gracefully check for whatever primary key tracking layout column exists natively
      const resolvedLogId = log.id || log.log_id || log.id_log || Math.random();

      return {
        id: resolvedLogId,
        created_at: log.created_at,
        action: log.action || "SYSTEM_EVENT",
        details: log.details || "Administrative operation logged.",
        user: actor.name || "System / Admin"
      };
    });

    res.json(formattedLogs);
  } catch (err) {
    console.error("Audit Log Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 5. COUNT SLOTS
app.get("/api/appointments/count", async (req, res) => {
  const { officeCode, date, time } = req.query;
  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM appointments WHERE department = ? AND appointment_date = ? AND time_slot = ? AND status != "Cancelled"',
      [officeCode, date, time]
    );
    res.json({ count: rows?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/appointments", async (req, res) => {
  const { controlNumber, officeCode, service, date, time, student, feeText, receiverName } = req.body;

  try {
    await db.query("START TRANSACTION");

    const studentProgram = String(student?.program || req.body.studentProgram || "BSIT").trim();
    const studentName = String(student?.name || req.body.studentName || "Juan Dela Cruz").trim();
    const studentEmail = student?.email || req.body.studentEmail || null;

    const cleanOffice = officeCode || req.body.officeCode || req.body.department || "GENERAL";
    const cleanService = service || req.body.service || req.body.config?.service || "Books";

    const cleanDate = date || req.body.appointment_date || req.body.appointmentDate || "2026-11-17";
    const cleanTime = time || req.body.time_slot || req.body.timeSlot || "09:00 AM";

    const nameParts = studentName.split(" ");
    const firstName = nameParts[0] || "Juan";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "Dela Cruz";

    let aiVerdict = "ok";
    let aiReasons = [];

    if (studentEmail) {
      try {
        const aiResponse = await fetch("http://127.0.0", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: studentEmail,
            first_name: firstName,
            last_name: lastName,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiVerdict = aiData.verdict || "ok";
          aiReasons = aiData.reasons || [];
        }
      } catch (aiErr) {
        // Fallback silently if NLP service is offline
      }
    }

    const [users] = await db.query("SELECT * FROM users WHERE student_id_number = ?", [studentProgram]);
    let userId;

    if (!users || users.length === 0) {
      const uniqueSuffix = `${Date.now().toString().slice(-4)}_${Math.floor(Math.random() * 1000)}`;
      const uniqueEmail = studentEmail || `student_${uniqueSuffix}@rtu.edu.ph`;

      const [newStudent] = await db.query(
        'INSERT INTO users (student_id_number, name, email, password, role) VALUES (?, ?, ?, "hashed_pass", "student")',
        [studentProgram, studentName, uniqueEmail]
      );
      userId = newStudent.insertId;
    } else {
      const targetUser = Array.isArray(users) ? users[0] : users;
      userId = targetUser?.id || 1;
    }

    const [queueCheck] = await db.query(
      "SELECT COUNT(*) as count FROM appointments WHERE department = ? AND appointment_date = ?",
      [cleanOffice, cleanDate]
    );
    const rawCount = queueCheck[0]?.count || 0;
    const nextQueue = rawCount + 1;

    let generatedControlNo = controlNumber;
    if (!generatedControlNo && cleanDate) {
      let dateString = "2026-11-17";
      
      if (cleanDate instanceof Date) {
        const y = cleanDate.getFullYear();
        const m = String(cleanDate.getMonth() + 1).padStart(2, "0");
        const d = String(cleanDate.getDate()).padStart(2, "0");
        dateString = `${y}-${m}-${d}`;
      } else if (typeof cleanDate === "string") {
        dateString = cleanDate.slice(0, 10);
      }

      const parts = dateString.split("-");
      const month = parts[1] || "11";
      const day = parts[2] || "17";
      
      const officeLetter = cleanOffice === "HSU" ? "H" : cleanOffice === "SRAU" ? "R" : cleanOffice === "BAU" ? "B" : cleanOffice === "MISU" ? "M" : "G";
      const queueStr = String(nextQueue).padStart(3, "0");
      const svcCode = cleanService.substring(0, 3).toUpperCase();
      generatedControlNo = `${month}-${day}-${officeLetter}-${queueStr}-${svcCode}-10${Date.now().toString().slice(-4)}`;
    }

       // Guarantee the status is never a blank string before inserting
    const appointmentStatusValue = (req.body.status && String(req.body.status).trim() !== "") ? req.body.status : "Submitted";

    const [result] = await db.query(
      `INSERT INTO appointments 
       (student_id, department, appointment_date, time_slot, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, cleanOffice, cleanDate, cleanTime, appointmentStatusValue]
    );

    const insertedId = result.insertId;

    try {
      await db.query("UPDATE appointments SET controlNumber = ? WHERE id = ?", [generatedControlNo, insertedId]);
    } catch (e) {}

    try {
      await db.query("UPDATE appointments SET queue = ? WHERE id = ?", [nextQueue, insertedId]);
    } catch (e) {}

    try {
      await db.query("UPDATE appointments SET service = ? WHERE id = ?", [cleanService, insertedId]);
    } catch (e) {}

    try {
      await db.query("UPDATE appointments SET feeText = ? WHERE id = ?", [feeText || "No fee", insertedId]);
    } catch (e) {}

    try {
      await db.query("UPDATE appointments SET receiverName = ? WHERE id = ?", [receiverName || null, insertedId]);
    } catch (e) {}

    const aiLogSuffix = aiReasons.length > 0 ? ` | [AI Flags: ${aiReasons.join(", ")}]` : " | [AI Verdict: CLEAR]";
    const logDetails = `Student ${studentName} (${studentProgram}) booked ${cleanService} at ${cleanOffice}.${aiLogSuffix}`;

    await db.query(
      'INSERT INTO audit_logs (action, details, ip_address) VALUES ("BOOK_APPOINTMENT", ?, ?)',
      [logDetails, req.ip]
    );

    await db.query("COMMIT");

    res.status(201).json({
      id: String(insertedId),
      controlNumber: generatedControlNo,
      status: "Submitted",
      queue: nextQueue,
      feeText: feeText || "No fee",
      aiVerdict: aiVerdict,
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Server Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

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

app.listen(PORT, () => console.log(`Backend Server running on port ${PORT}`));
// ==========================================
// ACCOUNT AUTHENTICATION GATEWAY
// ==========================================

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const cleanUser = String(username).trim();

  // 1. Specific Office Admin Testing Verification Bounds
  const adminAccounts = {
    "SrauAdmin": { role: "srau-admin", officeCode: "SRAU", name: "Registrar Records Head" },
    "MisuAdmin": { role: "misu-admin", officeCode: "MISU", name: "MIS Tech Window Administrator" },
    "HsuAdmin":  { role: "hsu-admin", officeCode: "HSU",  name: "Health Clinic Staff Lead" },
    "BauAdmin":  { role: "bau-admin", officeCode: "BAU",  name: "Business Affairs Supervisor" },
    "SuperAdmin": { role: "super-admin", officeCode: "SUPER", name: "System Super Admin" }
  };

  if (adminAccounts[cleanUser]) {
    if (password === "Admin") {
      return res.json({
        role: adminAccounts[cleanUser].role,
        officeCode: adminAccounts[cleanUser].officeCode,
        user: { name: adminAccounts[cleanUser].name, studentNumber: "" }
      });
    } else {
      return res.status(401).json({ error: "Invalid password for administrative clearance." });
    }
  }

  // 2. Structural Student Account Validation Matching 20xx-xxxxxx Layout Parameters
  const studentPattern = /^20\d{2}-\d{5,6}$/;
  if (studentPattern.test(cleanUser)) {
    if (password === "12345678") {
      return res.json({
        role: "student",
        officeCode: null,
        user: { name: "Juan Dela Cruz", studentNumber: cleanUser }
      });
    } else {
      return res.status(401).json({ error: "Incorrect student portal account password." });
    }
  }

  return res.status(404).json({ error: "Account username or tracking ID not recognized." });
});

// Handles new student profile creation and inserts records into the database
app.post("/auth/register", async (req, res) => {
  const { studentNumber, fullName, email, password } = req.body;

  // Sanitize input values to remove leading or trailing spaces
  const cleanNumber = String(studentNumber).trim();
  const cleanName = String(fullName).trim();
  const cleanEmail = String(email).trim();

  // Validate student number structural format layout parameters (20xx-xxxxxx)
  const studentPattern = /^20\d{2}-\d{5,6}$/;
  if (!studentPattern.test(cleanNumber)) {
    return res.status(400).json({ error: "Invalid format. Student ID must match the 20xx-xxxxxx pattern." });
  }

  try {
    // Start database transaction block for safety
    await db.query("START TRANSACTION");

    // Check if the Student ID number already exists in the users table
    const [existingUsers] = await db.query("SELECT * FROM users WHERE student_id_number = ?", [cleanNumber]);
    if (existingUsers && existingUsers.length > 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ error: "This Student ID number is already registered." });
    }

    // Insert the clean profile record natively into the users table matrix
    const [result] = await db.query(
      'INSERT INTO users (student_id_number, name, email, password, role) VALUES (?, ?, ?, ?, "student")',
      [cleanNumber, cleanName, cleanEmail, password || "12345678"]
    );

    const newUserId = result.insertId;

    // Log the registration event cleanly inside the system audit logs table
    await db.query(
      'INSERT INTO audit_logs (action, details, ip_address) VALUES ("STUDENT_REGISTRATION", ?, ?)',
      [`Student ${cleanName} (${cleanNumber}) created a fresh system account profile.`, req.ip]
    );

    // Commit changes safely to the database
    await db.query("COMMIT");

    // Return session tracking fields matching the login endpoint format
    res.status(201).json({
      success: true,
      role: "student",
      officeCode: null,
      user: {
        id: newUserId,
        name: cleanName,
        studentNumber: cleanNumber,
        email: cleanEmail
      }
    });
  } catch (err) {
    // Rollback transaction to maintain data integrity if an exception occurs
    await db.query("ROLLBACK");
    console.error("Registration Error Exception:", err.message);
    res.status(500).json({ error: err.message });
  }
});