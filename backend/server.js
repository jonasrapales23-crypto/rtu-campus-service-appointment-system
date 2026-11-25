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

// 1. FETCH ALL APPOINTMENTS FOR STUDENT TICKET & HISTORY (Normalized 3NF JOIN)
app.get("/api/appointments", async (req, res) => {
  try {
    const [appointments] = await db.query(`
      SELECT 
        a.id,
        a.controlNumber,
        a.appointment_date,
        a.time_slot,
        a.status,
        a.queue,
        o.office_code AS officeCode,
        s.service_name AS service,
        s.fee_text AS feeText,
        u.name AS student_name,
        u.student_id_number AS student_program
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN offices o ON s.office_id = o.id
      LEFT JOIN users u ON a.student_id = u.id
      ORDER BY a.id DESC
    `);
    res.json(appointments);
  } catch (err) {
    console.error("Fetch Appointments Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 2. FETCH ALL APPOINTMENTS FOR ADMIN DASHBOARDS (Normalized 3NF JOIN)
app.get("/api/admin/appointments", async (req, res) => {
  try {
    const [appointments] = await db.query(`
      SELECT 
        a.id,
        a.controlNumber,
        a.appointment_date AS date,
        a.time_slot AS time,
        a.status,
        a.queue,
        a.receiverName,
        o.office_code AS officeCode,
        s.service_name AS service,
        u.name AS student,
        u.student_id_number AS number,
        u.student_id_number AS program
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN offices o ON s.office_id = o.id
      LEFT JOIN users u ON a.student_id = u.id
      ORDER BY a.id DESC
    `);
    res.json(appointments);
  } catch (err) {
    console.error("Admin Fetch Error Exception:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. UPDATE APPOINTMENT STATUS FROM ADMIN DASHBOARDS
app.put("/api/admin/appointments/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, adminName = "Office Admin" } = req.body;

  let dbStatus = String(status).toLowerCase();
  if (dbStatus === "served") {
    dbStatus = "claimed";
  }

  try {
    await db.query("START TRANSACTION");

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
    const [logs] = await db.query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
    const [users] = await db.query("SELECT * FROM users");

    const formattedLogs = logs.map((log) => {
      const actor = users.find((u) => u.id === log.user_id) || {};
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
      `SELECT COUNT(*) as count FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       LEFT JOIN offices o ON s.office_id = o.id
       WHERE o.office_code = ? AND a.appointment_date = ? AND a.time_slot = ? AND a.status != 'cancelled'`,
      [officeCode, date, time]
    );
    res.json({ count: rows?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 6. CREATE BOOKING: Relational lookup mapping and transaction handling
app.post("/api/appointments", async (req, res) => {
  const { controlNumber, officeCode, service, date, time, student, feeText, receiverName } = req.body;

  try {
    await db.query("START TRANSACTION");

    // Standardize input values to remove tracking space variances
    const studentProgram = String(student?.program || req.body.studentProgram || "BSIT").trim();
    const studentName = String(student?.name || req.body.studentName || "Juan Dela Cruz").trim();
    const studentEmail = student?.email || req.body.studentEmail || null;

    const cleanOffice = officeCode || req.body.officeCode || req.body.department || "GENERAL";
    const cleanService = service || req.body.service || req.body.config?.service || "Books";

    const cleanDate = date || req.body.appointment_date || req.body.appointmentDate || "2026-11-23";
    const cleanTime = time || req.body.time_slot || req.body.timeSlot || "09:00 AM";

    const nameParts = studentName.split(" ");
    const firstName = nameParts[0] || "Juan";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "Dela Cruz";

    let aiVerdict = "ok";
    let aiReasons = [];

    // Optional Python machine learning service loop connection checker
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
        // Fallback silently if the external Python NLP engine is offline
      }
    }

    // Resolve or generate user record configurations cleanly
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
      userId = targetUser?.id || users?.id || 1;
    }

    // 3NF COMPLIANT RESOLUTION: Map text names to services lookup table primary IDs
    const [serviceRows] = await db.query("SELECT id FROM services WHERE service_name = ?", [cleanService]);
    const resolvedServiceId = serviceRows.length > 0 ? serviceRows[0].id : 1;

    // Resolve current day totals to manage sequence queues safely
    const [queueCheck] = await db.query(
      "SELECT COUNT(*) as count FROM appointments WHERE service_id = ? AND appointment_date = ?",
      [resolvedServiceId, cleanDate]
    );
    const rawCount = queueCheck?.[0]?.count || 0;
    const nextQueue = rawCount + 1;
     // Construct structurally isolated reference control strings
    let generatedControlNo = controlNumber;
    if (!generatedControlNo && cleanDate) {
      let dateString = "2026-11-23";
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
      const day = parts[2] || "23";
      
      const officeLetter = cleanOffice === "HSU" ? "H" : cleanOffice === "SRAU" ? "R" : cleanOffice === "BAU" ? "B" : cleanOffice === "MISU" ? "M" : "G";
      const queueStr = String(nextQueue).padStart(3, "0");
      const svcCode = cleanService.substring(0, 3).toUpperCase();
      generatedControlNo = `${month}-${day}-${officeLetter}-${queueStr}-${svcCode}-10${Date.now().toString().slice(-4)}`;
    }

    const appointmentStatusValue = (req.body.status && String(req.body.status).trim() !== "") ? req.body.status : "Submitted";

    // Core table insert transaction writing reference foreign keys instead of text strings
    const [result] = await db.query(
      `INSERT INTO appointments 
       (student_id, service_id, appointment_date, time_slot, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, resolvedServiceId, cleanDate, cleanTime, appointmentStatusValue]
    );

    const insertedId = result.insertId;

    // Synchronize optional tracking columns safely using dynamic fallback catch blocks
    try {
      await db.query("UPDATE appointments SET controlNumber = ? WHERE id = ?", [generatedControlNo, insertedId]);
    } catch (e) {}

    try {
      await db.query("UPDATE appointments SET queue = ? WHERE id = ?", [nextQueue, insertedId]);
    } catch (e) {}

    try {
      await db.query("UPDATE appointments SET receiverName = ? WHERE id = ?", [receiverName || null, insertedId]);
    } catch (e) {}

    const aiLogSuffix = aiReasons.length > 0 ? ` | [AI Flags: ${aiReasons.join(", ")}]` : " | [AI Verdict: CLEAR]";
    const logDetails = `Student ${studentName} (${studentProgram}) booked service ID ${resolvedServiceId}.${aiLogSuffix}`;

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

// 7. ACCOUNT AUTHENTICATION GATEWAY
app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const cleanUser = String(username).trim();

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

// 8. ACCOUNT REGISTRATION GATEWAY
app.post("/auth/register", async (req, res) => {
  const { studentNumber, fullName, email, password } = req.body;

  const cleanNumber = String(studentNumber).trim();
  const cleanName = String(fullName).trim();
  const cleanEmail = String(email).trim();

  const studentPattern = /^20\d{2}-\d{5,6}$/;
  if (!studentPattern.test(cleanNumber)) {
    return res.status(400).json({ error: "Invalid format. Student ID must match the 20xx-xxxxxx pattern." });
  }

  try {
    await db.query("START TRANSACTION");

    const [existingUsers] = await db.query("SELECT * FROM users WHERE student_id_number = ?", [cleanNumber]);
    if (existingUsers && existingUsers.length > 0) {
      await db.query("ROLLBACK");
      return res.status(400).json({ error: "This Student ID number is already registered." });
    }

    const [result] = await db.query(
      'INSERT INTO users (student_id_number, name, email, password, role) VALUES (?, ?, ?, ?, "student")',
      [cleanNumber, cleanName, cleanEmail, password || "12345678"]
    );

    const newUserId = result.insertId;

    await db.query(
      'INSERT INTO audit_logs (action, details, ip_address) VALUES ("STUDENT_REGISTRATION", ?, ?)',
      [`Student ${cleanName} (${cleanNumber}) created a fresh system account profile.`, req.ip]
    );

    await db.query("COMMIT");

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
    await db.query("ROLLBACK");
    console.error("Registration Error Exception:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 9. CANCEL LOGIC
app.put("/api/appointments/:id/cancel", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("START TRANSACTION");
    await db.query('UPDATE appointments SET status = "cancelled" WHERE id = ?', [id]);
    await db.query('INSERT INTO audit_logs (action, details, ip_address) VALUES ("CANCEL_APPOINTMENT", ?, ?)', [`Appointment ID ${id} was marked as Cancelled.`, req.ip]);
    await db.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await db.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});

// 10. RESCHEDULE LOGIC
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

// FETCH CURRENT SERVICES WITH LIVE FEES BY OFFICE CODE
app.get("/api/admin/services/:officeCode", async (req, res) => {
  const { officeCode } = req.params;
  try {
    // 1. Primary Query: Try to locate rows explicitly by joining the offices table mapping keys
    const [rows] = await db.query(
      `SELECT s.id, s.service_name, s.fee_text 
       FROM services s
       JOIN offices o ON s.office_id = o.id
       WHERE o.office_code = ?`,
      [officeCode.toUpperCase()]
    );

    // 2. Fail-safe Fallback: If no records match that office code relationship, return all rows
    if (!rows || rows.length === 0) {
      const [allServices] = await db.query("SELECT id, service_name, fee_text FROM services");
      return res.json(allServices);
    }

    res.json(rows);
  } catch (err) {
    console.error("Fetch Office Services Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE SERVICE FEES DYNAMICALLY IN THE LOOKUP MATRIX
app.put("/api/admin/services/:serviceId/fee", async (req, res) => {
  const { serviceId } = req.params;
  const { feeText, adminName = "Office Admin" } = req.body;
  try {
    await db.query("START TRANSACTION");

    // Attempts to update both fee_text and fee fields to prevent column mismatch crashes
    try {
      await db.query("UPDATE services SET fee_text = ? WHERE id = ?", [feeText, serviceId]);
    } catch (e) {
      // Fallback silently if fee_text does not exist in this database version
    }

    try {
      await db.query("UPDATE services SET fee = ? WHERE id = ?", [feeText, serviceId]);
    } catch (e) {
      // Fallback silently if fee does not exist in this database version
    }

    // Record the operation in the audit trail
    await db.query(
      'INSERT INTO audit_logs (action, details, ip_address) VALUES ("UPDATE_PRICING", ?, ?)',
      [`${adminName} modified service ID ${serviceId} pricing fee to: ${feeText}`, req.ip]
    );

    await db.query("COMMIT");
    res.json({ success: true, serviceId, feeText });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Update Pricing Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});