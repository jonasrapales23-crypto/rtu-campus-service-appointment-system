import { useEffect, useState } from "react";
import { createAppointment, fetchAdminAppointments, updateAdminStatus, fetchOfficeServices, updateServiceFee } from "../../services/appointments.js";
import Navbar from "../../navbar/Navbar.jsx";
import ConfirmItemReadyModal from "../components/ConfirmItemReadyModal.jsx";
import VerifyAtCounterModal from "../components/VerifyAtCounterModal.jsx";
import "./MisuAdmin.css";

const sections = ["Dashboard", "Queue", "Requests", "Records", "Services", "Reports"];
const doneStatuses = ["Served", "Claimed", "Done", "No-show"];
const badgeClass = (s) => String(s || "").toLowerCase().replaceAll(" ", "-");

const defaultServices = Array.of(
  { id: 1, name: "Receipt", available: true, fee: "0.00", processing: "1–2 minutes" },
  { id: 2, name: "Grade Slip", available: true, fee: "0.00", processing: "1–2 minutes" },
  { id: 3, name: "Registration Form", available: true, fee: "0.00", processing: "1–2 minutes" },
  { id: 9, name: "Student ID", available: true, fee: "0.00", processing: "Set by office" }
);

export default function MisuAdmin() {
  const [section, setSection] = useState("Dashboard");
  const [rows, setRows] = useState([]);
  const [services, setServices] = useState(defaultServices);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [recordQuery, setRecordQuery] = useState("");
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [checks, setChecks] = useState(false);
  const [appointmentFilters, setAppointmentFilters] = useState({ date: "All dates", status: "All statuses", service: "All services", type: "All types" });
  const [queueFilters, setQueueFilters] = useState({ status: "All statuses", service: "All services", type: "All types" });
  const [selectedStudentNumber, setSelectedStudentNumber] = useState("");
  const [draft, setDraft] = useState({ student: "", number: "", program: "BSIT", service: "Registration Form" });

  /* Synchronizes operational logs and handles positional service pricing mappings */
  function refreshData() {
    fetchAdminAppointments("MISU").then((liveData) => {
      if (liveData && Array.isArray(liveData)) {
        const formatted = liveData.map((r) => ({
          ...r,
          type: String(r.time || "").toLowerCase() === "walk-in" ? "Walk-in" : "Online request",
        }));
        setRows(formatted);
      }
    }).catch(() => setRows([]));

   /* Fetch live office service configurations from database lookup rows */
    fetchOfficeServices("MISU").then((dbServices) => {
      if (dbServices && Array.isArray(dbServices) && dbServices.length > 0) {
        setServices((oldServices) =>
          oldServices.map((s, index) => {
            const dbMatch = dbServices.find(
              (x) =>
                String(x.service_name || "").toLowerCase().replace(/[^a-z0-9]/g, "") ===
                String(s.name || "").toLowerCase().replace(/[^a-z0-9]/g, "")
            );
            
            const fallbackDbRow = dbServices[index] || {};
            
            /* Flexible property fallbacks to handle either fee_text or fee database column schemas */
            const dbMatchFee = dbMatch ? (dbMatch.fee_text ?? dbMatch.fee) : undefined;
            const fallbackFee = fallbackDbRow.fee_text ?? fallbackDbRow.fee;
            const liveFee = dbMatchFee ?? (fallbackFee ?? s.fee);
            
            /* Sanitize the extracted string structure down to pure clean numeric characters */
            const cleanNumericFee = String(liveFee).replace(/[^0-9.]/g, "");
            const parsedFee = parseFloat(cleanNumericFee);
            const standardizedFee = !isNaN(parsedFee) ? parsedFee.toFixed(2) : "0.00";

            return {
              ...s,
              id: dbMatch ? dbMatch.id : (fallbackDbRow.id || (index + 1)),
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
        const targetId = item.id || (i + 1);
        await updateServiceFee(targetId, item.fee, "MISU Admin");
      }
      setNotice("Service configurations synchronized successfully. Data is now live across the platform.");
      refreshData();
    } catch (err) {
      setNotice("Data synchronization failure detected: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  /* Handles state processing modifications */
  async function update(id, status) {
    const target = rows.find((r) => r.id === id);
    if (target?.dbId) {
      await updateAdminStatus(target.dbId, status, "MISU Admin");
    }
    setRows((old) => old.map((r) => (r.id === id ? { ...r, status } : r)));
    setNotice(`${id} updated to ${status}.`);
    setModal(null);
    setChecks(false);
    refreshData();
  }

  /* Stores counter walk-ins straight inside the relational tables */
  async function addWalkin(e) {
    e.preventDefault();
    if (!draft.student.trim()) {
      setNotice("Enter the student's name first.");
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    try {
      await createAppointment({
        officeCode: "MISU",
        service: draft.service || "Registration Form",
        date: todayStr,
        time: "Walk-in",
        student: { name: draft.student.trim(), program: draft.program },
        feeText: "0.00",
      });

      setDraft({ student: "", number: "", program: "BSIT", service: "Registration Form" });
      setModal(null);
      setSection("Queue");
      setNotice("Walk-in added to the queue and saved to database.");
      refreshData();
    } catch (err) {
      setNotice("Failed to save walk-in: " + err.message);
    }
  }

  function action(r) {
    if (r.status === "Waiting" || r.status === "Submitted") {
      update(r.id, "Processing");
      return;
    }
    if (r.status === "Processing") {
      setModal({ type: "ready", row: r });
      return;
    }
    if (r.status === "Ready for pickup") {
      setModal({ type: "verify", row: r });
      return;
    }
  }

  function openStudent(r) {
    setRecordQuery(r.number && r.number !== "Not provided" ? r.number : r.student);
    setSelectedStudentNumber(r.number && r.number !== "Not provided" ? r.number : r.student);
    setSection("Records");
  }

  function table(list, withAction = false) {
    return (
      <div className="misu-table-wrap">
        <table className="misu-table">
          <thead>
            <tr>
              <th>Control no.</th>
              <th>Student</th>
              <th>Service</th>
              <th>Type / Time</th>
              <th>Status</th>
              {withAction && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>
                  <button className="misu-student-link" type="button" onClick={() => openStudent(r)}>
                    {r.student}
                  </button>
                  <small>{r.number}</small>
                </td>
                <td>{r.service}</td>
                <td>
                  {r.type}
                  <small>{r.time}</small>
                </td>
                <td>
                  <span className={`misu-badge ${badgeClass(r.status)}`}>{r.status}</span>
                </td>
                {withAction && (
                  <td className="misu-row-actions">
                    {section === "Requests" && (
                      <button className="misu-btn small outline" type="button" onClick={() => setModal({ type: "details", row: r })}>
                        Details
                      </button>
                    )}
                    {!doneStatuses.includes(r.status) && (
                      <button className="misu-btn small" type="button" onClick={() => action(r)}>
                        {r.status === "Waiting" ? "Mark served" : r.status === "Submitted" ? "Start" : r.status === "Processing" ? "Mark ready" : r.status === "Ready for pickup" ? "Verify" : "—"}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const latestDate = rows.map(r => r.date).sort().at(-1) || "2026-11-25";
  const weekStartDate = new Date(`${latestDate}T00:00:00`);
  weekStartDate.setDate(weekStartDate.getDate() - 6);
  const weekStart = weekStartDate.toISOString().slice(0, 10);
  const weekRows = rows.filter(r => r.date >= weekStart && r.date <= latestDate);
  const today = rows.filter(r => r.date === latestDate);
  const active = today.filter(r => !doneStatuses.includes(r.status));
  const pending = rows.filter(r => ["Submitted", "Processing"].includes(r.status));
  const hourList = Array.of(8, 9, 10, 11, 13, 14, 15, 16);
  const hourCounts = hourList.map(h => ({
    hour: h,
    count: weekRows.filter(r => {
      const m = r.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!m) return false;
      let n = Number(m[1]) % 12;
      if (m[3].toUpperCase() === "PM") n += 12;
      return n === h;
    }).length
  }));
  const maxHourCount = Math.max(1, ...hourCounts.map(x => x.count));
  const filtered = rows.filter(r => `${r.id} ${r.student} ${r.number} ${r.service}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="misu-shell">
      <Navbar accountType="misu-admin" adminSection={section} onAdminNavigate={setSection} />
      
      <main className="misu-main">
        <div className="misu-heading">
          <div>
            <p className="misu-eyebrow">OFFICE ADMIN · MISU</p>
            <h1>MISU · {section}</h1>
            <p className="muted">Management Information Unit</p>
          </div>
          {section === "Queue" && (
            <div className="misu-heading-actions">
              <button className="misu-btn outline" type="button" onClick={() => setSection("All appointments")}>All appointments</button>
              <button className="misu-btn" type="button" onClick={() => setModal({ type: "walkin" })}>+ Add walk-in</button>
            </div>
          )}
          {section === "All appointments" && (
            <button className="misu-btn outline" type="button" onClick={() => setSection("Queue")}>← Back to Queue</button>
          )}
          {section === "Requests" && (
            <button className="misu-btn outline" type="button" onClick={() => setSection("Counter verification")}>Verify at counter</button>
          )}
          {section === "Counter verification" && (
            <button className="misu-btn outline" type="button" onClick={() => setSection("Requests")}>← Back to Requests</button>
          )}
        </div>

        {notice && (
          <div className="misu-notice">
            {notice}
            <button type="button" onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {section === "Dashboard" && (
          <>
            <div className="misu-stats">
              <button type="button" onClick={() => setSection("Queue")}>
                <strong>{today.length}</strong>
                <span>Appointments today</span>
              </button>
              <button className="green" type="button" onClick={() => setSection("Reports")}>
                <strong>{rows.filter((r) => ["Served", "Claimed", "Done"].includes(r.status)).length}</strong>
                <span>Done / served</span>
              </button>
              <button className="red" type="button" onClick={() => setSection("Reports")}>
                <strong>{rows.filter((r) => r.status === "No-show").length}</strong>
                <span>No-show</span>
              </button>
            </div>
            <div className="misu-columns">
              <section className="misu-panel">
                <h2>Needs attention</h2>
                <button className="misu-attention" type="button" onClick={() => setSection("Queue")}>
                  <b>{active.filter((r) => r.status === "Waiting").length} students waiting at the window</b>
                  <span>Served in order of arrival · View queue →</span>
                </button>
                <button className="misu-attention" type="button" onClick={() => setSection("Requests")}>
                  <b>{pending.length} online requests to process</b>
                  <span>Registration form and grade slip · View requests →</span>
                </button>
                <button className="misu-attention" type="button" onClick={() => setSection("Reports")}>
                  <b>{rows.filter((r) => r.status === "No-show").length} no-shows in records</b>
                  <span>Review historical records →</span>
                </button>
              </section>
              <section className="misu-panel">
                <h2>Today by service</h2>
                {services.map((s) => (
                  <div className="misu-service-row" key={s.name}>
                    <span>{s.name}</span>
                    <b>{today.filter((r) => r.service === s.name && doneStatuses.includes(r.status)).length} served</b>
                    <span>{today.filter((r) => r.service === s.name && r.status === "Waiting").length} waiting</span>
                  </div>
                ))}
              </section>
            </div>
          </>
        )}

        {section === "Queue" && (
          <>
            <div className="misu-toolbar misu-filters">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search control number or student" />
              <select aria-label="Filter queue by service" value={queueFilters.service} onChange={(e) => setQueueFilters({ ...queueFilters, service: e.target.value })}>
                <option>All services</option>
                {services.map((v) => (
                  <option key={v.id || v.name}>{v.name}</option>
                ))}
              </select>
              <select aria-label="Filter queue by status" value={queueFilters.status} onChange={(e) => setQueueFilters({ ...queueFilters, status: e.target.value })}>
                <option>All statuses</option>
                {[...new Set(rows.map((r) => r.status))].sort().map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select aria-label="Filter queue by type" value={queueFilters.type} onChange={(e) => setQueueFilters({ ...queueFilters, type: e.target.value })}>
                <option>All types</option>
                <option>Walk-in</option>
                <option>Online request</option>
              </select>
              <span className="muted">Walk-ins are served in arrival order.</span>
            </div>
            {table(filtered.filter((r) => r.date === latestDate && (queueFilters.service === "All services" || r.service === queueFilters.service) && (queueFilters.status === "All statuses" || r.status === queueFilters.status) && (queueFilters.type === "All types" || r.type === queueFilters.type)), true)}
          </>
        )}

        {section === "All appointments" && (
          <>
            <div className="misu-toolbar misu-filters">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Control number or student" />
              <select value={appointmentFilters.date} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, date: e.target.value })}>
                <option>All dates</option>
                {[...new Set(rows.map((r) => r.date))].sort().map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              <select value={appointmentFilters.status} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, status: e.target.value })}>
                <option>All statuses</option>
                {[...new Set(rows.map((r) => r.status))].sort().map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <select value={appointmentFilters.service} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, service: e.target.value })}>
                <option>All services</option>
                {services.map((v) => (
                  <option key={v.id || v.name}>{v.name}</option>
                ))}
              </select>
              <select value={appointmentFilters.type} onChange={(e) => setAppointmentFilters({ ...appointmentFilters, type: e.target.value })}>
                <option>All types</option>
                <option>Walk-in</option>
                <option>Online request</option>
              </select>
            </div>
            {table(filtered.filter((r) => (appointmentFilters.date === "All dates" || r.date === appointmentFilters.date) && (appointmentFilters.status === "All statuses" || r.status === appointmentFilters.status) && (appointmentFilters.service === "All services" || r.service === appointmentFilters.service) && (appointmentFilters.type === "All types" || r.type === appointmentFilters.type)), false)}
          </>
        )}

        {section === "Requests" && (
          <>
            <div className="misu-toolbar">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search requests" />
              <span className="muted">Only prepared items can be verified at pickup.</span>
            </div>
            {table(filtered.filter((r) => r.type === "Online request"), true)}
          </>
        )}
{section === "Counter verification" && (
          <>
            <div className="misu-toolbar">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Control number or student name" />
              <span className="muted">A control number does not replace ID verification.</span>
            </div>
            {table(filtered.filter((r) => r.status === "Ready for pickup"), false)}
            {filtered.filter((r) => r.status === "Ready for pickup").map((r) => (
              <section className="misu-panel" key={`verify-${r.id}`}>
                <h2>{r.service} <span className={`misu-badge ${badgeClass(r.status)}`}>{r.status}</span></h2>
                <p>{r.type} · Pickup: {r.date} · Receiver: {r.receiver || r.student}</p>
                <button className="misu-btn" type="button" onClick={() => setModal({ type: "verify", row: r })}>Verify receiver and complete</button>
              </section>
            ))}
          </>
        )}

        {section === "Records" && (
          <>
            <div className="misu-toolbar">
              <input value={recordQuery} onChange={(e) => { setRecordQuery(e.target.value); setSelectedStudentNumber(""); }} placeholder="Search student name or number" />
            </div>
            {[...new Map(rows.filter((r) => `${r.student} ${r.number}`.toLowerCase().includes(recordQuery.toLowerCase())).map((r) => [`${r.number}-${r.student}`, r])).values()].map((r) => {
              const history = rows.filter((x) => x.number === r.number && x.student === r.student).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
              return (
                <section className="misu-panel misu-record" key={`${r.number}-${r.student}`}>
                  <button className="misu-record-title" type="button" onClick={() => setSelectedStudentNumber(selectedStudentNumber === r.number ? "" : r.number)}>
                    <span>
                      <h2>{r.student}</h2>
                      <p>{r.number} · {r.program} · Enrolled</p>
                    </span>
                    <span>{selectedStudentNumber === r.number ? "Hide history ↑" : "View transaction history ↓"}</span>
                  </button>
                  {(selectedStudentNumber === r.number || recordQuery.trim()) && (
                    <>
                      <h3>Transactions at MISU</h3>
                      <div className="misu-table-wrap">
                        <table className="misu-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Service</th>
                              <th>Type</th>
                              <th>Control no.</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.map((x) => (
                              <tr key={x.id}>
                                <td>{x.date}</td>
                                <td>{x.service}</td>
                                <td>{x.type}</td>
                                <td>{x.id}</td>
                                <td><span className={`misu-badge ${badgeClass(x.status)}`}>{x.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </section>
              );
            })}
            {!rows.some((r) => `${r.student} ${r.number}`.toLowerCase().includes(recordQuery.toLowerCase())) && (
              <section className="misu-panel">
                <p>No student records match that search.</p>
              </section>
            )}
          </>
        )}

        {section === "Services" && (
          <section className="misu-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>Services and fees</h2>
              <button 
                className="misu-btn" 
                type="button" 
                disabled={isSaving}
                onClick={handleSaveAllFees}
                style={{ background: "#2442c5", padding: "8px 16px" }}
              >
                {isSaving ? "Synchronizing..." : "Save Changes"}
              </button>
            </div>

            <div className="misu-table-wrap">
              <table className="misu-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Available</th>
                    <th>Fee</th>
                    <th>Processing</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s, i) => (
                    <tr key={s.name}>
                      <td><b>{s.name}</b></td>
                      <td>
                        <button 
                          type="button"
                          className={`misu-toggle ${s.available ? "on" : ""}`} 
                          onClick={() => setServices(old => old.map((x, j) => i === j ? { ...x, available: !x.available } : x))}
                        >
                          {s.available ? "On" : "Off"}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: "bold", color: "#14213d", fontSize: "14px" }}>₱</span>
                          <input 
                            className="misu-inline" 
                            type="text"
                            placeholder="0.00"
                            value={s.fee} 
                            style={{ width: "90px", textAlign: "right" }}
                            onChange={(e) => handleFeeChange(i, e.target.value)}
                            onBlur={() => handleFeeBlur(i)}
                          />
                        </div>
                      </td>
                      <td>
                        <input 
                          className="misu-inline" 
                          value={s.processing} 
                          onChange={(e) => setServices(old => old.map((x, j) => i === j ? { ...x, processing: e.target.value } : x))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ marginTop: "15px" }}>Booking: as students arrive · Capacity: 60+ per day · No-show: removed from active queue but retained in historical reports · Slots managed by staff at the window · Verification: name only. Fees and processing times can be updated by office staff. Office-wide rules are set by the Super Admin.</p>
          </section>
        )}
          {section === "Reports" && (
          <>
            <div className="misu-stats">
              <div><strong>{weekRows.length}</strong><span>Appointments this week</span></div>
              <div className="green"><strong>{weekRows.filter((r) => ["Served", "Claimed", "Done"].includes(r.status)).length}</strong><span>Completed</span></div>
              <div className="red"><strong>{weekRows.filter((r) => r.status === "No-show").length}</strong><span>No-shows</span></div>
            </div>
            <div className="misu-columns">
              <section className="misu-panel">
                <h2>Busiest hours</h2>
                {hourCounts.map(({ hour, count }) => (
                  <div className="misu-bar-row" key={hour}>
                    <span>{hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"} <small>({count})</small></span>
                    <div><i style={{ width: `${(count / maxHourCount) * 100}%` }} /></div>
                  </div>
                ))}
              </section>
              <section className="misu-panel">
                <h2>Most requested services</h2>
                {services.map((s) => (
                  <div className="misu-service-row" key={s.id || s.name}>
                    <span>{s.name}</span>
                    <b>{weekRows.filter((r) => r.service === s.name).length} requests</b>
                  </div>
                ))}
                <button className="misu-btn" type="button" onClick={() => { const csv = "Control no.,Student,Student number,Service,Date,Type,Status\n" + rows.map((r) => [r.id, r.student, r.number, r.service, r.date, r.type, r.status].map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(',')).join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); const a = document.createElement('a'); a.href = url; a.download = 'misu-records.csv'; a.click(); URL.revokeObjectURL(url); }}>Export CSV</button>
              </section>
            </div>
            <section className="misu-panel">
              <h2>All transactions</h2>
              {table(filtered, false)}
            </section>
          </>
        )}
      </main>

      {modal && modal.type !== "ready" && modal.type !== "verify" && (
        <div className="misu-overlay" role="presentation">
          <section className="misu-modal" role="dialog" aria-modal="true">
            <button className="misu-close" type="button" onClick={() => setModal(null)} aria-label="Close">×</button>
            {modal.type === "walkin" ? (
              <>
                <h2>Add Counter Walk-In</h2>
                <p className="muted">No online request ticket is created. The student is added directly to today's database query.</p>
                <form onSubmit={addWalkin} className="misu-form">
                  <label>Student name<input required value={draft.student} onChange={(e) => setDraft({ ...draft, student: e.target.value })} /></label>
                  <label>Student number (optional)<input value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} /></label>
                  <label>Program<select value={draft.program} onChange={(e) => setDraft({ ...draft, program: e.target.value })}><option>BSIT</option><option>BSCS</option><option>BSBA</option><option>BSED</option></select></label>
                  <label>Service<select value={draft.service} onChange={(e) => setDraft({ ...draft, service: e.target.value })}>{services.map((s) => <option key={s.id || s.name} value={s.name}>{s.name}</option>)}</select></label>
                  <button className="misu-btn" type="submit">Save walk-in</button>
                </form>
              </>
            ) : modal.type === "details" ? (
              <>
                <h2>Request details</h2>
                <p className="misu-request-summary"><b>{modal.row.student} · {modal.row.number} · {modal.row.program} · {modal.row.service}</b><br /><span className="muted">Pickup: {modal.row.date} · Receiver: {modal.row.receiver || modal.row.student}</span></p>
                <h3>Uploaded files</h3>
                <div className="misu-upload-list">
                  <div>📄 <b>Valid ID</b><span>Accepted at submission</span></div>
                  <div>📄 <b>Required document</b><span>Accepted at submission</span></div>
                </div>
                <p className="muted" style={{ marginTop: "10px" }}>Staff must verify the receiver's ID at pickup window counter lines.</p>
                <div className="misu-modal-actions">
                  <button className="misu-btn outline" type="button" onClick={() => setModal(null)}>Back</button>
                  {modal.row.status === "Processing" && <button className="misu-btn" type="button" onClick={() => setModal({ type: "ready", row: modal.row })}>Mark ready for pickup</button>}
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}

      {modal?.type === "ready" && (
        <ConfirmItemReadyModal item={modal.row} officeLabel="MISU · Management Information Unit" onClose={() => setModal(null)} onConfirm={() => update(modal.row.id, "Ready for pickup")} />
      )}
      
      {modal?.type === "verify" && (
        <VerifyAtCounterModal item={modal.row} fields={[{ label: "Name", value: modal.row.receiver || modal.row.student }]} officeLabel="MISU · Management Information Unit" onClose={() => setModal(null)} onComplete={(status) => update(modal.row.id, status)} />
      )}
    </div>
  );
}