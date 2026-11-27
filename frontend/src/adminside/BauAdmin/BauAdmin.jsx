import { useEffect, useMemo, useState } from "react";
import { createAppointment, fetchAdminAppointments, updateAdminStatus, fetchOfficeServices, updateServiceFee, fetchSubServices, createSubService, updateBatchSubServices } from "../../services/appointments.js";
import Navbar from "../../navbar/Navbar.jsx";
import CalendarSlotManagement from "../CalendarSlotManagement/CalendarSlotManagement.jsx";
import VerifyAtCounterModal from "../components/VerifyAtCounterModal.jsx";
import useDailySlots from "../CalendarSlotManagement/useDailySlots.js";
import "../MisuAdmin/MisuAdmin.css";
import "./BauAdmin.css";

const seedServices = [
  { id: 10, name: "Books", available: true, eligibility: "All students", capacity: 350, fee: "0.00" },
  { id: 11, name: "Uniforms", available: false, eligibility: "All students", capacity: 250, fee: "0.00" },
  { id: 12, name: "Sablay", available: true, eligibility: "Graduating students only", capacity: 200, fee: "0.00" },
  { id: 13, name: "Graduation pictorial", available: true, eligibility: "Graduating students only", capacity: 200, fee: "0.00" },
  { id: 14, name: "Concessionaires", available: true, eligibility: "Set by office", capacity: 0, fee: "0.00" }
];

const navSections = ["Dashboard", "Queue", "Requests", "Slots", "Products", "Reports"];
const closedStatuses = ["Served", "No-show", "Claimed", "Cancelled"];
const badgeClass = (s) => String(s || "").toLowerCase().replaceAll(" ", "-");
const initialSlots = [
  { time: "8:00 AM", capacity: 12, booked: 0, closed: false },
  { time: "8:30 AM", capacity: 12, booked: 12, closed: false },
  { time: "9:00 AM", capacity: 12, booked: 3, closed: false },
  { time: "10:00 AM", capacity: 12, booked: 12, closed: false },
  { time: "1:00 PM", capacity: 12, booked: 1, closed: false },
  { time: "1:30 PM", capacity: 0, booked: 0, closed: true }
];

export default function BauAdmin() {
  const [section, setSection] = useState("Dashboard");
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState(seedServices);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSaving, setIsSaving] = useState(false);

  /* Synchronizes operational logs and handles positional service pricing mappings */
  function refreshData() {
    fetchAdminAppointments("BAU").then((liveData) => {
      if (liveData && Array.isArray(liveData)) {
        setRows(liveData);
        if (liveData.length > 0 && !liveData.some((r) => r.date === selectedDate)) {
          setSelectedDate(liveData[0].date);
        }
      }
    }).catch(() => setRows([]));

    fetchOfficeServices("BAU").then((dbServices) => {
      if (dbServices && Array.isArray(dbServices) && dbServices.length > 0) {
        setProducts((oldProducts) =>
          oldProducts.map((p, index) => {
            const dbMatch = dbServices.find(
              (x) => String(x.service_name || "").toLowerCase().replace(/[^a-z0-9]/g, "") ===
                     String(p.name || "").toLowerCase().replace(/[^a-z0-9]/g, "")
            );
            
            const fallbackDbRow = dbServices[index] || {};
            const resolvedId = dbMatch ? dbMatch.id : (fallbackDbRow.id || (index + 10));
            const liveFee = dbMatch ? (dbMatch.fee_text ?? dbMatch.fee) : (fallbackDbRow.fee_text ?? fallbackDbRow.fee ?? p.fee);
            
            const cleanNumericFee = String(liveFee).replace(/[^0-9.]/g, "");
            const parsedFee = parseFloat(cleanNumericFee);
            const standardizedFee = !isNaN(parsedFee) ? parsedFee.toFixed(2) : "0.00";

            return {
              ...p,
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
  const [queueFilters, setQueueFilters] = useState({ product: "All products", status: "All statuses", type: "All types" });
  const [bookingFilters, setBookingFilters] = useState({ date: "All dates", status: "All statuses", product: "All products", type: "All types" });
  const [modal, setModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [walkIn, setWalkIn] = useState({ student: "", number: "", program: "BSIT", product: seedServices[0].name });
  const [slotDraft, setSlotDraft] = useState({ time: "8:00 AM", capacity: "12" });

  const latestDate = rows.map(r => r.date).sort().at(-1) || selectedDate;
  const today = rows.filter(r => r.date === selectedDate);
  const weekStart = new Date(`${selectedDate}T00:00:00`); weekStart.setDate(weekStart.getDate() - 6); const weekStartText = weekStart.toISOString().slice(0, 10);
  const weekRows = rows.filter(r => r.date >= weekStartText && r.date <= selectedDate);
  const filtered = useMemo(() => rows.filter(r => `${r.id} ${r.student} ${r.number} ${r.product}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
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
    setProducts((old) =>
      old.map((p, i) => (i === index ? { ...p, fee: cleanVal } : p))
    );
  }

  /* Automatically rounds input configurations to two decimal places upon input blurring focus loss */
  function handleFeeBlur(index) {
    setProducts((old) =>
      old.map((p, i) => {
        if (i === index) {
          const parsed = parseFloat(p.fee);
          return {
            ...p,
            fee: !isNaN(parsed) ? parsed.toFixed(2) : "0.00"
          };
        }
        return p;
      })
    );
  }

 /* Explicitly triggers network PUT requests to persist edited fees into MySQL */
  async function handleSaveAllFees() {
    setIsSaving(true);
    setNotice("");
    try {
      for (let i = 0; i < products.length; i++) {
        const item = products[i];
        /* Point fallback explicitly to base 10 to ensure zero crossover into MISU records */
        const targetId = item.id || (i + 10);
        await updateServiceFee(targetId, item.fee, "BAU Admin");
      }
      setNotice("Service configurations synchronized successfully. Data is now live across the platform.");
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
      await updateAdminStatus(target.dbId, status, "BAU Admin");
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
      const saved = await createAppointment({
        officeCode: "BAU",
        service: walkIn.product,
        date: selectedDate,
        time: "Walk-in",
        student: { name: walkIn.student.trim(), program: walkIn.program },
        feeText: "0.00",
      });

      setWalkIn({ student: "", number: "", program: "BSIT", product: products[0]?.name || "Books" });
      setModal(null);
      setSection("Queue");
      setNotice("Walk-in added to today's queue and saved to database.");
      refreshData();
    } catch (err) {
      setNotice("Failed to save walk-in: " + err.message);
    }
  }

  function exportCSV() {
    const csv = ["Control number,Student,Student number,Program,Service,Date,Time,Type,Status", ...rows.map(r => [r.id, r.student, r.number, r.program, r.product, r.date, r.time, r.type, r.status].map(v => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "bau-report.csv";
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
              {actions && <th>Action</th>}
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
                <td>{r.product}</td>
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
   <div className="misu-shell rtu-shell bau-shell">
     <Navbar accountType="bau-admin" adminSection={section === "Records" ? "Reports" : section} onAdminNavigate={item => { setSection(item); setNotice(""); setQuery(""); }} />
     
     <main className="misu-main">
       <header className="misu-heading">
         <div>
           <p className="misu-eyebrow">BUSINESS AFFAIRS UNIT</p>
           <h1>{section === "Queue" ? "Today's queue" : section === "Requests" ? "Online requests" : section === "Products" ? "Products" : section === "Slots" ? "Slot management" : section === "Records" ? "Student records" : section}</h1>
           <p className="muted">Manage BAU bookings, product requests, pickups, and daily capacity.</p>
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
             <select value={queueFilters.product} onChange={e => setQueueFilters({ ...queueFilters, product: e.target.value })}><option>All products</option>{products.map(s => <option key={s.name}>{s.name}</option>)}</select>
             <select value={queueFilters.status} onChange={e => setQueueFilters({ ...queueFilters, status: e.target.value })}><option>All statuses</option>{["Booked", "Waiting", "Submitted", "Processing", "Ready for pickup", "Served", "No-show", "Cancelled"].map(s => <option key={s}>{s}</option>)}</select>
             <select value={queueFilters.type} onChange={e => setQueueFilters({ ...queueFilters, type: e.target.value })}><option>All types</option><option>Booked</option><option>Walk-in</option></select>
             <button className="misu-btn" onClick={() => setModal({ type: "walkin" })}>+ Add walk-in</button>
           </div>
           <p className="muted">No-shows and served appointments are excluded by default from the active queue.</p>
           {table(filtered.filter(r => r.date === selectedDate && !closedStatuses.includes(r.status) && (queueFilters.product === "All products" || r.product === queueFilters.product) && (queueFilters.status === "All statuses" || r.status === queueFilters.status) && (queueFilters.type === "All types" || r.type === queueFilters.type)), true)}
         </>
       )}

       {section === "Requests" && (
         <>
           <div className="misu-toolbar misu-filters">
             <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search control number or student" />
             <select value={bookingFilters.date} onChange={e => setBookingFilters({ ...bookingFilters, date: e.target.value })}><option>All dates</option>{[...new Set([...rows.map(r => r.date), selectedDate])].sort().map(d => <option key={d}>{d}</option>)}</select>
             <select value={bookingFilters.status} onChange={e => setBookingFilters({ ...bookingFilters, status: e.target.value })}><option>All statuses</option>{[...new Set([...rows.map(r => r.status), "Cancelled"])].sort().map(s => <option key={s}>{s}</option>)}</select>
             <select value={bookingFilters.product} onChange={e => setBookingFilters({ ...bookingFilters, product: e.target.value })}><option>All products</option>{products.map(s => <option key={s.name}>{s.name}</option>)}</select>
             <select value={bookingFilters.type} onChange={e => setBookingFilters({ ...bookingFilters, type: e.target.value })}><option>All types</option><option>Booked</option><option>Walk-in</option></select>
           </div>
           {table(filtered.filter(r => (bookingFilters.date === "All dates" || r.date === bookingFilters.date) && (bookingFilters.status === "All statuses" || r.status === bookingFilters.status) && (bookingFilters.product === "All products" || r.product === bookingFilters.product) && (bookingFilters.type === "All types" || r.type === bookingFilters.type)), true)}
         </>
       )}

       {section === "Records" && (
         <>
           <section className="misu-panel bau-records-back"><button className="misu-btn outline" onClick={() => setSection("Reports")}>← Back to reports</button><p className="muted">Student records are accessed through Reports.</p></section>
           <div className="misu-toolbar"><input value={recordQuery} onChange={e => { setRecordQuery(e.target.value); setExpandedStudent(""); }} placeholder="Search student name or student number" /></div>
           {[...new Map(rows.filter(r => `${r.student} ${r.number}`.toLowerCase().includes(recordQuery.toLowerCase())).map(r => [`${r.number}-${r.student}`, r])).values()].map(r => {
             const key = r.number && r.number !== "Not provided" ? r.number : r.student;
             const history = rows.filter(x => x.number === r.number && x.student === r.student).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
             return <section className="misu-panel misu-record" key={`${r.number}-${r.student}`}><button className="misu-record-title" onClick={() => setExpandedStudent(expandedStudent === key ? "" : key)}><span><h2>{r.student}</h2><p>{r.number} · {r.program}</p></span><span>{expandedStudent === key || recordQuery.trim() ? "Hide history ↑" : "View appointment history ↓"}</span></button>{(expandedStudent === key || recordQuery.trim()) && <><h3>BAU appointment history</h3><div className="misu-table-wrap"><table className="misu-table"><thead><tr><th>Date</th><th>Service</th><th>Type</th><th>Control no.</th><th>Status</th></tr></thead><tbody>{history.map(x => <tr key={x.id}><td>{x.date}</td><td>{x.product}</td><td>{x.type}</td><td>{x.id}</td><td><span className={`misu-badge ${badgeClass(x.status)}`}>{x.status}</span></td></tr>)}</tbody></table></div></>}</section>;
           })}
           {!rows.some(r => `${r.student} ${r.number}`.toLowerCase().includes(recordQuery.toLowerCase())) && <section className="misu-panel"><p>No student records match that search.</p></section>}
         </>
       )}

       {section === "Slots" && <CalendarSlotManagement officeName="BAU" slots={slots} setSlots={setSlots} selectedDate={selectedDate} setSelectedDate={setSelectedDate} getDayStatus={dayStatus} note="BAU bookings are available 1 day ahead. Capacity is managed per product (Books 350 · Uniforms 250 · Sablay 200 · Graduation pictorial 200). Schedules are managed by BAU head/staff." onNotice={setNotice} />}

        {section === "Products" && (
          <>
            <section className="misu-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>Services and General Category Fees</h2>
                <button className="misu-btn" type="button" disabled={isSaving} onClick={handleSaveAllFees} style={{ background: "#2442c5", padding: "8px 16px" }}>
                  {isSaving ? "Synchronizing Matrix..." : "Save Base Category Fees"}
                </button>
              </div>

              <div className="misu-table-wrap">
                <table className="misu-table">
                  <thead>
                    <tr>
                      <th>Service Category</th>
                      <th>Status</th>
                      <th>Base Fee</th>
                      <th>Catalog Configuration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((s, i) => (
                      <tr key={s.name}>
                        <td><b>{s.name}</b></td>
                        <td>
                          <button className={`misu-toggle ${s.available ? "on" : ""}`} type="button" onClick={() => setProducts(old => old.map((x, j) => i === j ? { ...x, available: !x.available } : x))}>
                            {s.available ? "Active" : "Off"}
                          </button>
                        </td>
                        <td>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: "bold", color: "#14213d" }}>₱</span>
                            <input className="misu-inline" type="text" value={s.fee} style={{ width: "80px", textAlign: "right" }} onChange={(e) => handleFeeChange(i, e.target.value)} onBlur={() => handleFeeBlur(i)} />
                          </div>
                        </td>
                        <td>
                          {s.name === "Books" ? (
                            <button className="misu-btn small" type="button" onClick={async () => {
                              if (modal?.type === "show-books") {
                                setModal(null);
                              } else {
                                const list = await fetchSubServices(10);
                                setModal({ type: "show-books", items: list, draftName: "", draftFee: "0.00" });
                              }
                            }}>
                              {modal?.type === "show-books" ? "Hide Catalog ↑" : "Expand Books Catalog ↓"}
                            </button>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* COLLAPSIBLE CHILD CATALOG DROPDOWN WORKSPACE */}
            {modal?.type === "show-books" && (
              <section className="misu-panel" style={{ marginTop: "20px", borderLeft: "4px solid #2442c5", paddingLeft: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Specific Textbook Inventory Catalog</h3>
                    <p className="muted" style={{ margin: 0, fontSize: "12px" }}>Manage pricing metrics and toggle availability state parameters independently.</p>
                  </div>
                  <button className="misu-btn" type="button" style={{ background: "#10b981" }} onClick={async () => {
                    setIsSaving(true);
                    await updateBatchSubServices(modal.items, "BAU Head Staff");
                    setNotice("Textbook inventory modifications successfully synchronized with active lookup queries.");
                    setIsSaving(false);
                  }}>
                    Save Textbook Inventory Changes
                  </button>
                </div>

                <div className="misu-table-wrap" style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <table className="misu-table">
                    <thead>
                      <tr>
                        <th>Textbook Description (Code & Title)</th>
                        <th>Status</th>
                        <th>Price Config</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modal.items.map((book, subIdx) => (
                        <tr key={book.id} style={{ opacity: book.available ? 1 : 0.5 }}>
                          <td><b>{book.name}</b></td>
                          <td>
                            <button 
                              type="button"
                              className={`misu-toggle ${book.available ? "on" : ""}`} 
                              onClick={() => {
                                const updated = modal.items.map((b, bIdx) => subIdx === bIdx ? { ...b, available: !b.available } : b);
                                setModal({ ...modal, items: updated });
                              }}
                            >
                              {book.available ? "Available" : "Disabled"}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <strong>₱</strong>
                              <input 
                                className="misu-inline" 
                                type="text" 
                                value={book.fee} 
                                style={{ width: "80px", textAlign: "right" }}
                                onChange={(e) => {
                                  const updated = modal.items.map((b, bIdx) => subIdx === bIdx ? { ...b, fee: e.target.value.replace(/[^0-9.]/g, "") } : b);
                                  setModal({ ...modal, items: updated });
                                }}
                                onBlur={() => {
                                  const updated = modal.items.map((b, bIdx) => {
                                    if (subIdx === bIdx) {
                                      const parsed = parseFloat(b.fee);
                                      return { ...b, fee: !isNaN(parsed) ? parsed.toFixed(2) : "0.00" };
                                    }
                                    return b;
                                  });
                                  setModal({ ...modal, items: updated });
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ADD NEW BOOK INVENTORY SUB-FORM */}
                <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "6px", marginTop: "20px", border: "1px solid #e5e7eb" }}>
                  <h4 style={{ margin: "0 0 10px 0" }}>+ Append New Textbook Entry</h4>
                  <div style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}>
                    <label style={{ width: "140px", fontSize: "13px" }}>
                      Book Code *
                      <input 
                        type="text" 
                        placeholder="e.g., 6699" 
                        value={modal.draftCode || ""} 
                        style={{ width: "100%", padding: "6px", marginTop: "4px" }} 
                        onChange={(e) => setModal({ ...modal, draftCode: e.target.value.replace(/\D/g, "") })} 
                      />
                    </label>
                    <label style={{ flex: 1, fontSize: "13px" }}>
                      Textbook Title *
                      <input 
                        type="text" 
                        placeholder="e.g., Core Systems Engineering" 
                        value={modal.draftName || ""} 
                        style={{ width: "100%", padding: "6px", marginTop: "4px" }} 
                        onChange={(e) => setModal({ ...modal, draftName: e.target.value })} 
                      />
                    </label>
                    <label style={{ width: "120px", fontSize: "13px" }}>
                      Price (PHP)
                      <input 
                        type="text" 
                        placeholder="0.00" 
                        value={modal.draftFee || "0.00"} 
                        style={{ width: "100%", padding: "6px", marginTop: "4px", textAlign: "right" }} 
                        onChange={(e) => setModal({ ...modal, draftFee: e.target.value.replace(/[^0-9.]/g, "") })} 
                      />
                    </label>
                    <button className="misu-btn" type="button" style={{ height: "34px", padding: "0 15px" }} onClick={async () => {
                      if (!modal.draftCode || !modal.draftCode.trim()) return alert("Please specify a valid textbook catalog book code.");
                      if (!modal.draftName || !modal.draftName.trim()) return alert("Enter textbook name details first.");
                      
                      /* Standardize string concatenation layout cleanly with our structural em-dash delimiter */
                      const standardizedCombinedName = `${modal.draftCode.trim()} — ${modal.draftName.trim()}`;
                      
                      await createSubService(10, { name: standardizedCombinedName, fee: modal.draftFee });
                      const list = await fetchSubServices(10);
                      setModal({ ...modal, items: list, draftCode: "", draftName: "", draftFee: "0.00" });
                    }}>
                      Add Item
                    </button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
        {section === "Reports" && (
         <>
           <section className="misu-panel bau-records-access"><div><h2>Student records</h2><p className="muted">Search students and review their appointment history.</p></div><button className="misu-btn" onClick={() => { setSection("Records"); setRecordQuery(""); setExpandedStudent(""); }}>Open student records</button></section>
           <div className="misu-stats"><div><strong>{weekRows.length}</strong><span>Appointments this week</span></div><div className="green"><strong>{weekRows.filter(r => ["Served", "Ready for pickup", "Claimed", "Done"].includes(r.status)).length}</strong><span>Completed</span></div><div className="red"><strong>{weekRows.filter(r => r.status === "No-show").length}</strong><span>No-shows</span></div></div>
           <div className="misu-columns">
             <section className="misu-panel"><h2>Busiest hours</h2>{hours.map(({ hour, count }) => <div className="misu-bar-row" key={hour}><span>{hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? "PM" : "AM"} <small>({count})</small></span><div><i style={{ width: `${count / maxHour * 100}%` }} /></div></div>)}</section>
             <section className="misu-panel"><h2>Most booked products</h2>{products.map(s => <div className="misu-product-row" key={s.name}><span>{s.name}</span><b>{weekRows.filter(r => r.product === s.name).length} visits</b></div>)}<button className="misu-btn" onClick={exportCSV}>Export CSV</button></section>
           </div>
           <section className="misu-panel"><h2>All appointments</h2><div className="misu-toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search report by student or control number" /></div>{table(filtered, false)}</section>
         </>
       )}
     </main>

     {modal && modal.type === "walkin" && (
       <div className="misu-overlay">
         <section className="misu-modal" role="dialog" aria-modal="true">
           <button className="misu-close" onClick={() => setModal(null)} aria-label="Close">×</button>
           <h2>Add walk-in student</h2>
           <p className="muted">No ticket is created. The walk-in is recorded in the queue and reports.</p>
           <form className="misu-form" onSubmit={addWalkin}>
             <label>Student name<input required value={walkIn.student} onChange={e => setWalkIn({ ...walkIn, student: e.target.value })} /></label>
             <label>Student number<input required value={walkIn.number} onChange={e => setWalkIn({ ...walkIn, number: e.target.value })} /></label>
             <label>Program<select value={walkIn.program} onChange={e => setWalkIn({ ...walkIn, program: e.target.value })}>{["BSIT", "BSCS", "BSBA", "BSED", "BEED", "Other"].map(p => <option key={p}>{p}</option>)}</select></label>
             <label>Service<select value={walkIn.product} onChange={e => setWalkIn({ ...walkIn, product: e.target.value })}>{products.filter(s => s.available).map(s => <option key={s.name}>{s.name}</option>)}</select></label>
             <button className="misu-btn">Save walk-in</button>
           </form>
         </section>
       </div>
     )}

     {modal && modal.type === "slot" && <div className="misu-overlay"><section className="misu-modal" role="dialog" aria-modal="true"><button className="misu-close" onClick={() => setModal(null)}>×</button><h2>Add appointment slot</h2><form className="misu-form" onSubmit={e => { e.preventDefault(); setSlots(old => [...old, { time: slotDraft.time, capacity: Number(slotDraft.capacity) || 12, booked: 0, closed: false }]); setModal(null); setNotice("Appointment slot added."); }}><label>Time<input required value={slotDraft.time} onChange={e => setSlotDraft({ ...slotDraft, time: e.target.value })} /></label><label>Capacity<input type="number" min="1" required value={slotDraft.capacity} onChange={e => setSlotDraft({ ...slotDraft, capacity: e.target.value })} /></label><button className="misu-btn">Save slot</button></form></section></div>}
     {modal && modal.type === "capacity" && <div className="misu-overlay"><section className="misu-modal" role="dialog" aria-modal="true"><button className="misu-close" onClick={() => setModal(null)}>×</button><h2>Change slot capacity</h2><form className="misu-form" onSubmit={e => { e.preventDefault(); setSlots(old => old.map((s, i) => i === modal.index ? { ...s, capacity: Math.max(s.booked, Number(slotDraft.capacity) || s.capacity), closed: false } : s)); setModal(null); setNotice("Slot capacity updated."); }}><label>New capacity<input type="number" min="1" value={slotDraft.capacity} onChange={e => setSlotDraft({ ...slotDraft, capacity: e.target.value })} /></label><button className="misu-btn">Save capacity</button></form></section></div>}
     {modal && modal.type === "product" && <div className="misu-overlay"><section className="misu-modal" role="dialog" aria-modal="true"><button className="misu-close" onClick={() => setModal(null)}>×</button><h2>Edit product eligibility</h2><form className="misu-form" onSubmit={e => { e.preventDefault(); setProducts(old => old.map((s, i) => i === modal.index ? { ...s, eligibility: slotDraft.time.trim() || s.eligibility } : s)); setSlotDraft({ ...slotDraft, time: "8:00 AM" }); setModal(null); setNotice("Service eligibility updated."); }}><label>Eligibility<input value={slotDraft.time} onChange={e => setSlotDraft({ ...slotDraft, time: e.target.value })} placeholder="Eligibility" /></label><button className="misu-btn">Save changes</button></form></section></div>}
     {modal && modal.type === "verify" && <VerifyAtCounterModal item={modal.row} fields={[{ label: "Name", value: modal.row.student }, { label: "Student number", value: modal.row.number }, { label: "Product", value: modal.row.product }]} officeLabel="BAU · Business Affairs Unit" onClose={() => setModal(null)} onComplete={status => updateStatus(modal.row.id, status)} />}
   </div>
 );
}