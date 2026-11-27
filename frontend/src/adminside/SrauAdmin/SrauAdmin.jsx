import { useEffect, useMemo, useState } from "react";
import { createAppointment, fetchAdminAppointments, updateAdminStatus, fetchOfficeServices, updateServiceFee } from "../../services/appointments.js";
import Navbar from "../../navbar/Navbar.jsx";
import CalendarSlotManagement from "../CalendarSlotManagement/CalendarSlotManagement.jsx";
import VerifyAtCounterModal from "../components/VerifyAtCounterModal.jsx";
import useDailySlots from "../CalendarSlotManagement/useDailySlots.js";
import "../MisuAdmin/MisuAdmin.css";
import "./SrauAdmin.css";

const seedServices = [
  { id: 4, name: "Transcript of Records", available: true, requirements: "Clearance form, 2x2 picture", duration: "5-7 working days", fee: "0.00" },
  { id: 5, name: "Certificates", available: true, requirements: "Student ID copy", duration: "2-3 working days", fee: "0.00" },
  { id: 6, name: "Diploma", available: true, requirements: "Graduation clearance", duration: "10-15 working days", fee: "0.00" },
  { id: 15, name: "CTC / Authentication", available: true, requirements: "Original document", duration: "1-2 working days", fee: "0.00" }
];

const closedStatuses = ["Served", "No-show", "Claimed", "Cancelled"];
const badgeClass = (s) => String(s || "").toLowerCase().replaceAll(" ", "-");
const initialSlots = [
  { time: "8:00 AM", capacity: 15, booked: 0, closed: false },
  { time: "9:00 AM", capacity: 15, booked: 15, closed: false },
  { time: "10:00 AM", capacity: 15, booked: 2, closed: false },
  { time: "11:00 AM", capacity: 15, booked: 0, closed: false },
  { time: "1:00 PM", capacity: 15, booked: 8, closed: false },
  { time: "2:00 PM", capacity: 15, booked: 15, closed: false },
  { time: "3:00 PM", capacity: 0, booked: 0, closed: true }
];

export default function SrauAdmin() {
  const [section, setSection] = useState("Dashboard");
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState(seedServices);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  /* Synchronizes operational logs and handles structural 3NF service pricing mappings */
  function refreshData() {
    fetchAdminAppointments("SRAU").then((liveData) => {
      if (liveData && Array.isArray(liveData)) {
        setRows(liveData);
        if (liveData.length > 0 && !liveData.some((r) => r.date === selectedDate)) {
          setSelectedDate(liveData[0].date);
        }
      }
    }).catch(() => setRows([]));

    fetchOfficeServices("SRAU").then((dbServices) => {
      if (dbServices && Array.isArray(dbServices) && dbServices.length > 0) {
        setServices((oldServices) =>
          oldServices.map((s, index) => {
            const dbMatch = dbServices.find(
              (x) => String(x.service_name || "").toLowerCase().replace(/[^a-z0-9]/g, "") ===
                     String(s.name || "").toLowerCase().replace(/[^a-z0-9]/g, "")
            );
            
            const fallbackDbRow = dbServices[index] || {};
            const resolvedId = dbMatch ? dbMatch.id : (fallbackDbRow.id || (index + 4));
            const liveFee = dbMatch ? (dbMatch.fee_text ?? dbMatch.fee) : (fallbackDbRow.fee_text ?? fallbackDbRow.fee ?? s.fee);
            
            const cleanNumericFee = String(liveFee).replace(/[^0-9.]/g, "");
            const parsedFee = parseFloat(cleanNumericFee);
            const standardizedFee = !isNaN(parsedFee) ? parsedFee.toFixed(2) : "0.00";

            return {
              ...s,
              id: resolvedId,
              fee: standardizedFee
            };
          })
        );
      }
    }).catch((err) => console.error("Database tracking lookup failure:", err));
  }

  useEffect(() => {
    refreshData();
  }, []);

  const { slots, setSlots, dayStatus } = useDailySlots({ template: initialSlots, rows, selectedDate });
  const [query, setQuery] = useState("");
  const [recordQuery, setRecordQuery] = useState("");
  const [expandedStudent, setExpandedStudent] = useState("");
  const [queueFilters, setQueueFilters] = useState({ service: "All services", status: "All statuses", type: "All types" });
  const [bookingFilters, setBookingFilters] = useState({ date: "All dates", status: "All statuses", service: "All services", type: "All types" });
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [walkIn, setWalkIn] = useState({ student: "", number: "", program: "BSIT", service: seedServices[0].name });
  const [slotDraft, setSlotDraft] = useState({ time: "8:00 AM", capacity: "15" });

  const latestDate = rows.map(r => r.date).sort().at(-1) || selectedDate;
  const today = rows.filter(r => r.date === selectedDate);
  const weekStart = new Date(`${selectedDate}T00:00:00`); weekStart.setDate(weekStart.getDate() - 6); const weekStartText = weekStart.toISOString().slice(0, 10);
  const weekRows = rows.filter(r => r.date >= weekStartText && r.date <= selectedDate);
  const filtered = useMemo(() => rows.filter(r => `${r.id} ${r.student} ${r.number} ${r.service}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const activeQueue = today.filter(r => !closedStatuses.includes(r.status));
  const hours = Array.of(8, 9, 10, 11, 13, 14, 15, 16).map(hour => ({ hour, count: weekRows.filter(r => { const m = r.time.match(/(\d{1,2}):\d{2}\s*(AM|PM)/i); if (!m) return false; let h = Number(m[1]) % 12; if (m[2].toUpperCase() === "PM") h += 12; return h === hour; }).length }));
  const maxHour = Math.max(1, ...hours.map(h => h.count));
   /* Validates and sanitizes fee change parameters to maintain numerical consistency */
  function handleFeeChange(index, value) {
    let cleanVal = value.replace(/[^0-9.]/g, "");
    const parts = cleanVal.split(".");
    if (parts.length > 2) {
      cleanVal = `${parts[0]}.${parts[1]}`;
    }
    setServices((old) =>
      old.map((s, i) => (i === index ? { ...s, fee: cleanVal } : s))
    );
  }

  /* Automatically rounds input configurations to two decimal places upon input blurring focus loss */
  function handleFeeBlur(index) {
    setServices((old) =>
      old.map((s, i) => {
        if (i === index) {
          const parsed = parseFloat(s.fee);
          return {
            ...s,
            fee: !isNaN(parsed) ? parsed.toFixed(2) : "0.00"
          };
        }
        return s;
      })
    );
  }

  /* Explicitly triggers network PUT requests to persist all locally edited fees into MySQL */
  async function handleSaveAllFees() {
    setIsSaving(true);
    setNotice("");
    try {
      /* Sequentially update each modified record entity via REST endpoints */
      for (let i = 0; i < services.length; i++) {
        const item = services[i];
        const targetId = item.id;
        if (targetId) {
          await updateServiceFee(targetId, item.fee, "SRAU Admin");
        }
      }
      setNotice("Registrar service configurations synchronized successfully. Data is now live.");
      refreshData();
    } catch (err) {
      setNotice("Data synchronization failure detected: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(id, status) {
    const target = rows.find((r) => r.id === id);
    if (target?.dbId) {
      await updateAdminStatus(target.dbId, status, "SRAU Admin");
    }
    setRows((old) => old.map((r) => (r.id === id ? { ...r, status } : r)));
    setNotice(`${id} marked ${status.toLowerCase()}.`);
    setModal(null);
    refreshData();
  }

  function openStudent(r) {
    setRecordQuery(r.number && r.number !== "Not provided" ? r.number : r.student);
    setExpandedStudent(r.number && r.number !== "Not provided" ? r.number : r.student);
    setSection("Records");
    setQuery("");
  }

  async function addWalkin(e) {
    e.preventDefault();
    if (!walkIn.student.trim() || !walkIn.number.trim()) {
      setNotice("Enter the student's name and student number first.");
      return;
    }

    try {
      await createAppointment({
        officeCode: "SRAU",
        service: walkIn.service,
        date: selectedDate,
        time: "Walk-in",
        student: { name: walkIn.student.trim(), program: walkIn.program },
        feeText: "0.00",
      });

      setWalkIn({ student: "", number: "", program: "BSIT", service: services[0]?.name || "Transcript of Records" });
      setModal(null);
      setSection("Queue");
      setNotice("Walk-in added to today's queue and saved to database.");
      refreshData();
    } catch (err) {
      setNotice("Failed to save walk-in: " + err.message);
    }
  }

  function exportCSV() {
    const csv = ["Control number,Student,Student number,Program,Service,Date,Time,Type,Status", ...rows.map(r => [r.id, r.student, r.number, r.program, r.service, r.date, r.time, r.type, r.status].map(v => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "srau-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Report exported as CSV.");
  }

  function table(list, actions = false) {
    return (
      <div className="misu-table-wrap">
        <table className="misu-table">
          <thead>
            <tr>
              <th>Control no.</th>
              <th>Student</th>
              <th>Service</th>
              <th>Date / time</th>
              <th>Type</th>
              <th>Status</th>
              {actions &&<th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>
                  <button className="misu-student-link" onClick={() => openStudent(r)}>{r.student}</button>
                  <small>{r.number} · {r.program}</small>
                </td>
                <td>{r.service}</td>
                <td>{r.date}<small>{r.time}</small></td>
                <td>{r.type}</td>
                <td><span className={`misu-badge ${badgeClass(r.status)}`}>{r.status}</span></td>
                {actions && (
                  <td>
                    <div className="misu-row-actions">
                      {!closedStatuses.includes(r.status) && <button className="misu-btn small" onClick={() => setModal({ type: "verify", row: r })}>Verify / mark served</button>}
                      {!closedStatuses.includes(r.status) && <button className="misu-btn small outline" onClick={() => updateStatus(r.id, "No-show")}>No-show</button>}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="bau-empty">No appointments match these filters.</p>}
      </div>
    );
  }
   return (
   <div className="misu-shell rtu-shell srau-shell">
     <Navbar accountType="srau-admin" adminSection={section === "Records" ? "Reports" : section} onAdminNavigate={item => { setSection(item); setNotice(""); setQuery(""); }} />
     
     <main className="misu-main">
       <header className="misu-heading">
         <div>
           <p className="misu-eyebrow">REGISTRAR UNIT · SRAU</p>
           <h1>{section === "Queue" ? "Today's queue" : section === "Requests" ? "Online requests" : section === "Services" ? "Services" : section === "Slots" ? "Slot management" : section === "Records" ? "Student records" : section}</h1>
           <p className="muted">Manage document processing, student records, window queue lines, and daily booking slots.</p>
         </div>
         <label className="bau-date">Working date<input type="date" value={selectedDate} onChange={e => e.target.value && setSelectedDate(e.target.value)} /></label>
       </header>

       {notice && <div className="misu-notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}

       {section === "Dashboard" && (
         <>
           <div className="misu-stats">
             <button onClick={() => setSection("Queue")}><strong>{today.length}</strong><span>Appointments today · View queue ↗</span></button>
             <button className="green" onClick={() => { setSection("Requests"); setBookingFilters({ ...bookingFilters, date: selectedDate, status: "Served" }); }}><strong>{today.filter(r => r.status === "Served" || r.status === "Claimed").length}</strong><span>Served today · View bookings ↗</span></button>
             <button className="red" onClick={() => { setSection("Requests"); setBookingFilters({ ...bookingFilters, date: selectedDate, status: "No-show" }); }}><strong>{today.filter(r => r.status === "No-show").length}</strong><span>No-shows · Review records ↗</span></button>
           </div>
           <div className="misu-columns">
             <section className="misu-panel">
               <h2>Needs attention</h2>
               <button className="misu-attention" onClick={() => { setSection("Requests"); setBookingFilters({ ...bookingFilters, date: selectedDate, status: "All statuses", type: "Booked" }); }}><b>{today.filter(r => r.type === "Booked" && !closedStatuses.includes(r.status)).length} students booked for today</b><span>Review today's appointment list</span></button>
               <button className="misu-attention" onClick={() => { setSection("Queue"); setQueueFilters({ ...queueFilters, type: "Walk-in" }); }}><b>{today.filter(r => r.type === "Walk-in" && !closedStatuses.includes(r.status)).length} walk-ins waiting</b><span>Added by staff · View queue</span></button>
               <button className="misu-attention" onClick={() => setSection("Slots")}><b>{slots.filter(s => !s.closed && s.capacity > 0 && s.booked >= s.capacity).length} slots are full</b><span>Manage today's capacity</span></button>
             </section>
             <section className="misu-panel">
               <h2>Today's bookings by time</h2>
               <div className="misu-table-wrap">
                 <table className="misu-table">
                   <thead><tr><th>Time</th><th>Booked</th><th>Capacity</th></tr></thead>
                   <tbody>{slots.slice(0, 5).map(s => <tr key={s.time}><td>{s.time}</td><td>{s.booked}</td><td>{s.closed ? "Closed" : s.capacity}</td></tr>)}</tbody>
                 </table>
               </div>
             </section>
           </div>
           <section className="misu-panel">
             <div className="bau-section-head">
               <h2>Today's active queue</h2>
               <button className="misu-btn" onClick={() => setModal({ type: "walkin" })}>+ Add walk-in</button>
             </div>
             {table(activeQueue, true)}
           </section>
         </>
       )}
          {section === "Queue" && (
         <>
           <div className="misu-toolbar misu-filters">
             <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search control number, student or student number" />
             <select value={queueFilters.service} onChange={e => setQueueFilters({ ...queueFilters, service: e.target.value })}><option>All services</option>{services.map(s => <option key={s.name}>{s.name}</option>)}</select>
             <select value={queueFilters.status} onChange={e => setQueueFilters({ ...queueFilters, status: e.target.value })}><option>All statuses</option>{["Booked", "Waiting", "Submitted", "Processing", "Ready for pickup", "Served", "No-show", "Cancelled"].map(s => <option key={s}>{s}</option>)}</select>
             <select value={queueFilters.type} onChange={e => setQueueFilters({ ...queueFilters, type: e.target.value })}><option>All types</option><option>Booked</option><option>Walk-in</option></select>
             <button className="misu-btn" onClick={() => setModal({ type: "walkin" })}>+ Add walk-in</button>
           </div>
           <p className="muted">No-shows and served appointments are excluded by default from the active queue.</p>
           {table(filtered.filter(r => r.date === selectedDate && !closedStatuses.includes(r.status) && (queueFilters.service === "All services" || r.service === queueFilters.service) && (queueFilters.status === "All statuses" || r.status === queueFilters.status) && (queueFilters.type === "All types" || r.type === queueFilters.type)), true)}
         </>
       )}

       {section === "Requests" && (
         <>
           <div className="misu-toolbar misu-filters">
             <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search control number or student" />
             <select value={bookingFilters.date} onChange={e => setBookingFilters({ ...bookingFilters, date: e.target.value })}><option>All dates</option>{[...new Set([...rows.map(r => r.date), selectedDate])].sort().map(d => <option key={d}>{d}</option>)}</select>
             <select value={bookingFilters.status} onChange={e => setBookingFilters({ ...bookingFilters, status: e.target.value })}><option>All statuses</option>{[...new Set([...rows.map(r => r.status), "Cancelled"])].sort().map(s => <option key={s}>{s}</option>)}</select>
             <select value={bookingFilters.service} onChange={e => setBookingFilters({ ...bookingFilters, service: e.target.value })}><option>All services</option>{services.map(s => <option key={s.name}>{s.name}</option>)}</select>
             <select value={bookingFilters.type} onChange={e => setBookingFilters({ ...bookingFilters, type: e.target.value })}><option>All types</option><option>Booked</option><option>Walk-in</option></select>
           </div>
           {table(filtered.filter(r => (bookingFilters.date === "All dates" || r.date === bookingFilters.date) && (bookingFilters.status === "All statuses" || r.status === bookingFilters.status) && (bookingFilters.service === "All services" || r.service === bookingFilters.service) && (bookingFilters.type === "All types" || r.type === bookingFilters.type)), true)}
         </>
       )}

       {section === "Records" && (
         <>
           <section className="misu-panel bau-records-back"><button className="misu-btn outline" onClick={() => setSection("Reports")}>← Back to reports</button><p className="muted">Student records are accessed through Reports.</p></section>
           <div className="misu-toolbar"><input value={recordQuery} onChange={e => { setRecordQuery(e.target.value); setExpandedStudent(""); }} placeholder="Search student name or student number" /></div>
           {[...new Map(rows.filter(r => `${r.student} ${r.number}`.toLowerCase().includes(recordQuery.toLowerCase())).map(r => [`${r.number}-${r.student}`, r])).values()].map(r => {
             const key = r.number && r.number !== "Not provided" ? r.number : r.student;
             const history = rows.filter(x => x.number === r.number && x.student === r.student).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
             return <section className="misu-panel misu-record" key={`${r.number}-${r.student}`}><button className="misu-record-title" onClick={() => setExpandedStudent(expandedStudent === key ? "" : key)}><span><h2>{r.student}</h2><p>{r.number} · {r.program}</p></span><span>{expandedStudent === key || recordQuery.trim() ? "Hide history ↑" : "View appointment history ↓"}</span></button>{(expandedStudent === key || recordQuery.trim()) && <><h3>SRAU document transaction history</h3><div className="misu-table-wrap"><table className="misu-table"><thead><tr><th>Date</th><th>Service</th><th>Type</th><th>Control no.</th><th>Status</th></tr></thead><tbody>{history.map(x => <tr key={x.id}><td>{x.date}</td><td>{x.service}</td><td>{x.type}</td><td>{x.id}</td><td><span className={`misu-badge ${badgeClass(x.status)}`}>{x.status}</span></td></tr>)}</tbody></table></div></>}</section>;
           })}
           {!rows.some(r => `${r.student} ${r.number}`.toLowerCase().includes(recordQuery.toLowerCase())) && <section className="misu-panel"><p>No student records match that search.</p></section>}
         </>
       )}

       {section === "Slots" && <CalendarSlotManagement officeName="SRAU" slots={slots} setSlots={setSlots} selectedDate={selectedDate} setSelectedDate={setSelectedDate} getDayStatus={dayStatus} note="Registrar booking windows open up to 7 days ahead. Daily capacities are calculated securely based on active window personnel constraints." onNotice={setNotice} />}

         {section === "Services" && (
         <section className="misu-panel">
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
             <h2 style={{ margin: 0 }}>Services and fees</h2>
             <button className="misu-btn" type="button" disabled={isSaving} onClick={handleSaveAllFees} style={{ background: "#2442c5", padding: "8px 16px" }}>{isSaving ? "Synchronizing..." : "Save Changes"}</button>
           </div>
           <div className="misu-table-wrap">
             <table className="misu-table">
               <thead><tr><th>Document Service</th><th>Available</th><th>Fee Config</th><th>Requirements</th><th>Processing Time</th></tr></thead>
               <tbody>
                 {services.map((s, i) => (
                   <tr key={s.name}>
                     <td><b>{s.name}</b></td>
                     <td><button className={`misu-toggle ${s.available ? "on" : ""}`} onClick={() => setServices(old => old.map((x, j) => i === j ? { ...x, available: !x.available } : x))}>{s.available ? "On" : "Off"}</button></td>
                     <td>
                       <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                         <span style={{ fontWeight: "bold", color: "#14213d", fontSize: "14px" }}>₱</span>
                         <input className="misu-inline" type="text" placeholder="0.00" value={s.fee} style={{ width: "90px", textAlign: "right" }} onChange={(e) => handleFeeChange(i, e.target.value)} onBlur={() => handleFeeBlur(i)} />
                       </div>
                     </td>
                     <td><input className="misu-inline" value={s.requirements} onChange={e => setServices(old => old.map((x, j) => i === j ? { ...x, requirements: e.target.value } : x))} /></td>
                     <td><input className="misu-inline" value={s.duration} onChange={e => setServices(old => old.map((x, j) => i === j ? { ...x, duration: e.target.value } : x))} /></td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           {/* UPGRADED HELP LABEL INTEGRATION */}
           <p className="muted" style={{ marginTop: "15px" }}>
             * Note: For the Transcript of Records, the fee configured here acts as the mandatory Document Stamp Fee. 
             The total amount displayed to students automatically adds this stamp value to the specific program level price (Undergraduate/Graduate).
           </p>
         </section>
       )}
        {section === "Reports" && (
         <>
           <section className="misu-panel bau-records-access"><div><h2>Student records</h2><p className="muted">Search students and review their historical document transactions data.</p></div><button className="misu-btn" onClick={() => { setSection("Records"); setRecordQuery(""); setExpandedStudent(""); }}>Open student records</button></section>
           <div className="misu-stats"><div><strong>{weekRows.length}</strong><span>Appointments this week</span></div><div className="green"><strong>{weekRows.filter(r => ["Served", "Ready for pickup", "Claimed", "Done"].includes(r.status)).length}</strong><span>Completed</span></div><div className="red"><strong>{weekRows.filter(r => r.status === "No-show").length}</strong><span>No-shows</span></div></div>
           <div className="misu-columns">
             <section className="misu-panel"><h2>Busiest hours</h2>{hours.map(({ hour, count }) => <div className="misu-bar-row" key={hour}><span>{hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"} <small>({count})</small></span><div><i style={{ width: `${count / maxHour * 100}%` }} /></div></div>)}</section>
             <section className="misu-panel"><h2>Most requested documents</h2>{services.map(s => <div className="misu-product-row" key={s.name}><span>{s.name}</span><b>{weekRows.filter(r => r.service === s.name).length} requests</b></div>)}<button className="misu-btn" onClick={exportCSV}>Export CSV</button></section>
           </div>
           <section className="misu-panel"><h2>All appointments</h2><div className="misu-toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search report log records..." /></div>{table(filtered, false)}</section>
         </>
       )}
     </main>

     {modal && modal.type === "walkin" && (
       <div className="misu-overlay">
         <section className="misu-modal" role="dialog" aria-modal="true">
           <button className="misu-close" onClick={() => setModal(null)} aria-label="Close">×</button>
           <h2>Add walk-in transaction</h2>
           <p className="muted">No online request ticket is created. The transaction is logged inside the queue sequence matrix natively.</p>
           <form className="misu-form" onSubmit={addWalkin}>
             <label>Student name<input required value={walkIn.student} onChange={e => setWalkIn({ ...walkIn, student: e.target.value })} /></label>
             <label>Student number<input required value={walkIn.number} onChange={e => setWalkIn({ ...walkIn, number: e.target.value })} /></label>
             <label>Program Block<select value={walkIn.program} onChange={e => setWalkIn({ ...walkIn, program: e.target.value })}>{["BSIT", "BSCS", "BSBA", "BSED", "BEED", "Other"].map(p => <option key={p}>{p}</option>)}</select></label>
             <label>Document Service<select value={walkIn.service} onChange={e => setWalkIn({ ...walkIn, service: e.target.value })}>{services.filter(s => s.available).map(s => <option key={s.name}>{s.name}</option>)}</select></label>
             <button className="misu-btn">Save walk-in</button>
           </form>
         </section>
       </div>
     )}

     {modal && modal.type === "slot" && <div className="misu-overlay"><section className="misu-modal" role="dialog" aria-modal="true"><button className="misu-close" onClick={() => setModal(null)}>×</button><h2>Add appointment slot</h2><form className="misu-form" onSubmit={e => { e.preventDefault(); setSlots(old => [...old, { time: slotDraft.time, capacity: Number(slotDraft.capacity) || 15, booked: 0, closed: false }]); setModal(null); setNotice("Appointment slot added."); }}><label>Time<input required value={slotDraft.time} onChange={e => setSlotDraft({ ...slotDraft, time: e.target.value })} /></label><label>Capacity<input type="number" min="1" required value={slotDraft.capacity} onChange={e => setSlotDraft({ ...slotDraft, capacity: e.target.value })} /></label><button className="misu-btn">Save slot</button></form></section></div>}
     {modal && modal.type === "capacity" && <div className="misu-overlay"><section className="misu-modal" role="dialog" aria-modal="true"><button className="misu-close" onClick={() => setModal(null)}>×</button><h2>Change slot capacity</h2><form className="misu-form" onSubmit={e => { e.preventDefault(); setSlots(old => old.map((s, i) => i === modal.index ? { ...s, capacity: Math.max(s.booked, Number(slotDraft.capacity) || s.capacity), closed: false } : s)); setModal(null); setNotice("Slot capacity updated."); }}><label>New capacity<input type="number" min="1" value={slotDraft.capacity} onChange={e => setSlotDraft({ ...slotDraft, capacity: e.target.value })} /></label><button className="misu-btn">Save capacity</button></form></section></div>}
     {modal && modal.type === "verify" && <VerifyAtCounterModal item={modal.row} fields={[{ label: "Name", value: modal.row.student }, { label: "Student number", value: modal.row.number }, { label: "Document", value: modal.row.service }]} officeLabel="SRAU · Student Records and Admission" onClose={() => setModal(null)} onComplete={status => updateStatus(modal.row.id, status)} />}
 </div>
    
 );
}