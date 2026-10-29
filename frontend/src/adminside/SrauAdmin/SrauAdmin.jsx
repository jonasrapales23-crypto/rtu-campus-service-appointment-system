import { useMemo, useState } from "react";
import "./SrauAdmin.css";
import Navbar from "../../navbar/Navbar.jsx";
import StatusBadge from "./components/StatusBadge.jsx";
import SectionHeading from "./components/SectionHeading.jsx";
import SearchInput from "./components/SearchInput.jsx";
import AppointmentTable from "./components/AppointmentTable.jsx";
import AdminModal from "./components/AdminModal.jsx";
import ConfirmItemReadyModal from "../components/ConfirmItemReadyModal.jsx";
import VerifyAtCounterModal from "../components/VerifyAtCounterModal.jsx";
import { initialAppointments, initialServices, times } from "./data/appointments.js";
import { isHandled, isPendingRequest, normalizeStatus } from "./utils/status.js";



export default function SrauAdmin() {
  const [section, setSection] = useState("Dashboard");
  const [reportsView, setReportsView] = useState("Reports");
  const [appointments, setAppointments] = useState(initialAppointments);
  const [services, setServices] = useState(initialServices);
  const [slots, setSlots] = useState(times.map((time, i) => ({ time, capacity: i === 5 ? 12 : i === 6 ? 0 : 12, booked: [0, 12, 3, 6, 12, 1, 0][i], closed: i === 6 })));
  const [selectedDate, setSelectedDate] = useState("2026-10-27");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [modal, setModal] = useState("");
  const [readyCandidate, setReadyCandidate] = useState(null);
  const [notice, setNotice] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(initialAppointments[0]);
  const [walkIn, setWalkIn] = useState({ student: "", number: "", program: "", service: "CTC / Authentication" });
  const [verifyChecks, setVerifyChecks] = useState([false, false, false, false]);
  const [verifyQuery, setVerifyQuery] = useState("10-19-R-014-TOR-482913");
  const [serviceDraft, setServiceDraft] = useState(null);
  const [serviceOriginalName, setServiceOriginalName] = useState(null);
  const [slotCapacity, setSlotCapacity] = useState("12");

  const filteredAppointments = useMemo(() => appointments.filter((item) => {
    const haystack = `${item.id} ${item.short} ${item.student} ${item.number} ${item.service}`.toLowerCase();
    const status = normalizeStatus(item.status);
    const matchesStatus = statusFilter === "All"
      || (statusFilter === "Done" ? ["served", "claimed", "done"].includes(status)
        : statusFilter === "Needs processing" ? ["submitted", "needs processing"].includes(status)
        : status === normalizeStatus(statusFilter));
    return haystack.includes(query.toLowerCase()) && matchesStatus && (serviceFilter === "All" || item.service === serviceFilter);
  }), [appointments, query, statusFilter, serviceFilter]);

  // Queue and online requests are active-work views; completed/closed records are history only.
  const activeQueueAppointments = filteredAppointments.filter((item) => !isHandled(item));
  const activeOnlineRequests = filteredAppointments.filter((item) => item.type === "Booked" && !isHandled(item));
  const todayAppointments = appointments.filter((a) => a.date === selectedDate);
  const requestsToProcess = appointments.filter(isPendingRequest);
  const readyForPickupToday = appointments.filter((a) => a.date === selectedDate && a.status === "Ready for pickup");
  const fullSlots = slots.filter((slot) => !slot.closed && slot.capacity > 0 && slot.booked >= slot.capacity);

  function announce(message) { setNotice(message); }
  function updateStatus(id, status) {
    setAppointments((old) => old.map((item) => item.id === id ? { ...item, status } : item));
    setSelectedAppointment((old) => old?.id === id ? { ...old, status } : old);
    announce(`${id.startsWith("WALK-IN") ? "Walk-in" : "Appointment"} marked ${status.toLowerCase()}. `);
  }
  function addWalkIn(event) {
    event.preventDefault();
    if (!walkIn.student.trim() || !walkIn.number.trim() || !walkIn.program || !walkIn.service) {
      announce("Complete the student name, student number, program, and service first."); return;
    }
    const id = `WALK-IN-${String(appointments.filter((a) => a.type === "Walk-in").length + 1).padStart(3, "0")}`;
    setAppointments((old) => [{ id, short: "—", student: walkIn.student.trim(), number: walkIn.number.trim(), program: walkIn.program, service: walkIn.service, date: selectedDate, time: "Walk-in", type: "Walk-in", status: "Processing" }, ...old]);
    setWalkIn({ student: "", number: "", program: "", service: "CTC / Authentication" }); setModal(""); setSection("Queue"); announce("Walk-in added to today's queue. No ticket was created.");
  }
  function showAppointment(item) {
    if (normalizeStatus(item.status) !== "ready for pickup") {
      announce("This request can only be reviewed after it has been marked Ready for pickup.");
      return;
    }
    setSelectedAppointment(item); setVerifyQuery(item.id); setVerifyChecks([false, false, false, false]); setModal("verify-counter");
  }
  function requestMarkReady(item) { setReadyCandidate(item); setModal("confirm-ready"); }
  function confirmMarkReady() {
    if (!readyCandidate) return;
    const candidate = readyCandidate;
    updateStatus(candidate.id, "Ready for pickup");
    setModal(""); setReadyCandidate(null);
    announce(`${candidate.student}'s request is now Ready for pickup.`);
  }
  function completeReview(status) {
    if (normalizeStatus(selectedAppointment?.status) !== "ready for pickup") { announce("Only requests marked Ready for pickup can be reviewed at the counter."); return; }
    updateStatus(selectedAppointment.id, status);
    setModal("");
    setNotice(`${selectedAppointment.student}'s appointment marked ${status.toLowerCase()}. Returned to the previous section.`);
  }
  function openServiceEditor(service = null) {
    setServiceOriginalName(service?.name ?? null);
    setServiceDraft(service ? { ...service } : { name: "", available: true, fee: "₱ ___", processing: "Set by office", pickup: true, eligibility: "All students", requirements: "", notes: "" });
    setModal("service");
  }
  function saveService(event) {
    event.preventDefault();
    if (!serviceDraft?.name.trim()) { announce("Enter a service name before saving."); return; }
    setServices((old) => {
      const withoutOriginal = serviceOriginalName ? old.filter((s) => s.name !== serviceOriginalName) : old;
      const alreadyExists = withoutOriginal.some((s) => s.name === serviceDraft.name);
      return alreadyExists
        ? withoutOriginal.map((s) => s.name === serviceDraft.name ? serviceDraft : s)
        : [...withoutOriginal, serviceDraft];
    });
    setModal(""); announce("Service saved.");
  }
  function exportReport() {
    const csv = ["Control number,Student,Service,Date,Time,Type,Status", ...appointments.map((a) => [a.id, a.student, a.service, a.date, a.time, a.type, a.status].map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a"); link.href = url; link.download = "srau-report.csv"; link.click(); URL.revokeObjectURL(url); announce("Report exported as CSV.");
  }

  return <div className="srau-admin-shell">
    <Navbar accountType="srau-admin" adminSection={section} onAdminNavigate={(item) => {
      setSection(item); setNotice("");
      if (item === "Reports") { setReportsView("Reports"); setStatusFilter("All"); setServiceFilter("All"); setQuery(""); }
      if (item === "Queue" || item === "Requests") { setStatusFilter("All"); setQuery(""); }
    }} />
    <main className="srau-admin-main">
        <div className="srau-page-title"><div><p className="srau-eyebrow">UNIVERSITY REGISTRAR'S OFFICE</p><h1>{section === "Verify at counter" ? "Verify at the counter" : section === "Appointments" ? "All appointments" : section === "Slots" ? "Slot management" : section === "Requests" ? "Online requests" : section === "Queue" ? "Today's queue" : section}</h1><p className="srau-subtitle">Manage student requests and counter operations for SRAU.</p></div><div className="srau-date-control"><label htmlFor="srau-date">Working date</label><input id="srau-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></div></div>
        {notice && <div className="srau-notice" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice("")}>×</button></div>}

        {section === "Dashboard" && <>
          <div className="srau-stat-grid">
            <button type="button" className="srau-stat-card blue clickable" onClick={() => { setSection("Queue"); setStatusFilter("All"); setQuery(""); }}>
              <span>Appointments today</span><strong>{todayAppointments.length}</strong><small>Scheduled and walk-ins · View today's queue ↗</small>
            </button>
            <button type="button" className="srau-stat-card green clickable" onClick={() => { setSection("Reports"); setReportsView("Appointments"); setStatusFilter("Done"); setQuery(""); }}>
              <span>Done</span><strong>{todayAppointments.filter((a) => ["Served", "Claimed", "Done"].includes(a.status)).length}</strong><small>Served or claimed · View completed ↗</small>
            </button>
            <button type="button" className="srau-stat-card red clickable" onClick={() => { setSection("Reports"); setReportsView("Appointments"); setStatusFilter("No-show"); setQuery(""); }}>
              <span>No-show</span><strong>{todayAppointments.filter((a) => a.status === "No-show").length}</strong><small>Closed appointments · Review no-shows ↗</small>
            </button>
            <button type="button" className="srau-stat-card yellow clickable" onClick={() => { setSection("Requests"); setStatusFilter("Needs processing"); setQuery(""); }}>
              <span>Requests to process</span><strong>{requestsToProcess.length}</strong><small>Needs staff action · Review requests ↗</small>
            </button>
          </div>
          <div className="srau-content-grid">
            <section className="srau-panel">
              <SectionHeading title="Needs attention"><span className="srau-pill">Current totals</span></SectionHeading>
              <button className="srau-attention-row" onClick={() => { setSection("Requests"); setStatusFilter("Needs processing"); setQuery(""); }}>
                <span className="srau-attention-icon">↗</span>
                <span><b>New requests to process</b><small>Review submitted student requests</small></span>
                <span className={`srau-attention-count ${requestsToProcess.length > 0 ? "has-items" : "zero-items"}`}>{requestsToProcess.length}</span><span className="srau-arrow">›</span>
              </button>
              <button className="srau-attention-row" onClick={() => { setSection("Queue"); setStatusFilter("Ready for pickup"); setQuery(""); }}>
                <span className="srau-attention-icon">✓</span>
                <span><b>Requests ready for pickup today</b><small>Confirm identity at the counter</small></span>
                <span className={`srau-attention-count ${readyForPickupToday.length > 0 ? "has-items" : "zero-items"}`}>{readyForPickupToday.length}</span><span className="srau-arrow">›</span>
              </button>
              {fullSlots.length > 0 ? fullSlots.map((slot) => <button className="srau-attention-row" key={slot.time} onClick={() => setSection("Slots")}>
                <span className="srau-attention-icon urgent">◷</span>
                <span><b>{slot.time} slot is <em className="srau-urgent-label">FULL</em></b><small>{slot.booked} of {slot.capacity} bookings · Review capacity</small></span>
                <span className="srau-attention-count urgent-count">!</span><span className="srau-arrow">›</span>
              </button>) : <button className="srau-attention-row" onClick={() => setSection("Slots")}>
                <span className="srau-attention-icon">◷</span><span><b>No full time slots</b><small>All open slots currently have capacity</small></span><span className="srau-attention-count zero-items">0</span><span className="srau-arrow">›</span>
              </button>}
            </section>
            <section className="srau-panel"><SectionHeading title="Today's time slots"><button className="srau-text-button" onClick={() => setSection("Slots")}>Manage slots →</button></SectionHeading><div className="srau-simple-table"><table><thead><tr><th>Time</th><th>Booked</th><th>Capacity</th><th>Status</th></tr></thead><tbody>{slots.slice(0, 5).map((slot) => <tr key={slot.time}><td>{slot.time}</td><td>{slot.booked}</td><td>{slot.capacity}</td><td><StatusBadge status={slot.closed ? "Closed" : slot.booked >= slot.capacity ? "Full" : "Open"} /></td></tr>)}</tbody></table></div></section>
          </div>
        </>}

        {section === "Queue" && <><div className="srau-stat-grid compact"><article className="srau-stat-card"><span>Appointments today</span><strong>{activeQueueAppointments.filter((a) => a.date === selectedDate).length}</strong></article><article className="srau-stat-card green"><span>Served</span><strong>{appointments.filter((a) => a.date === selectedDate && a.status === "Served").length}</strong></article><article className="srau-stat-card red"><span>No-shows</span><strong>{appointments.filter((a) => a.date === selectedDate && a.status === "No-show").length}</strong></article></div><section className="srau-panel"><SectionHeading title="Queue list"><button className="srau-button srau-button-primary" onClick={() => setModal("walkin")}>＋ Add walk-in</button></SectionHeading><div className="srau-toolbar"><SearchInput value={query} onChange={setQuery} placeholder="Look up control number or student" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status"><option>All</option>{["Submitted", "Needs processing", "Processing", "Ready for pickup"].map((s) => <option key={s}>{s}</option>)}</select></div><AppointmentTable rows={activeQueueAppointments.filter((a) => a.date === selectedDate)} onVerify={showAppointment} onStatus={updateStatus} onMarkReady={requestMarkReady} reviewOnly /></section><section className="srau-panel srau-policy"><b>No-show policy</b><p>Rebook; the missed appointment is closed and the student books again. The missed appointment is closed and the student must book again.</p></section></>}


        {section === "Verify at counter" && <div className="srau-content-grid verify-grid"><section className="srau-panel"><SectionHeading title="Find appointment" /><form className="srau-lookup-form" onSubmit={(e) => { e.preventDefault(); const found = appointments.find((a) => a.id.toLowerCase() === verifyQuery.toLowerCase() || a.short.toLowerCase() === verifyQuery.toLowerCase() || a.student.toLowerCase() === verifyQuery.toLowerCase()); if (found && normalizeStatus(found.status) === "ready for pickup") { setSelectedAppointment(found); setVerifyChecks([false, false, false, false]); announce(`Loaded ${found.student}'s ready-for-pickup request.`); } else if (found) announce("This request cannot be reviewed yet. It must be marked Ready for pickup first."); else announce("No matching appointment found. Try a full control number or student name."); }}><input value={verifyQuery} onChange={(e) => setVerifyQuery(e.target.value)} placeholder="Control number or student name" aria-label="Control number or student name" /><button className="srau-button srau-button-primary">Look up</button></form><div className="srau-request-summary"><span className="srau-eyebrow">SELECTED REQUEST</span><h3>{selectedAppointment.service}</h3><p>{selectedAppointment.student} · {selectedAppointment.number} · {selectedAppointment.program}</p><div className="srau-summary-line"><span>Control number</span><b>{selectedAppointment.id}</b></div><div className="srau-summary-line"><span>Pickup schedule</span><b>{selectedAppointment.date} · {selectedAppointment.time}</b></div><div className="srau-summary-line"><span>Current status</span><StatusBadge status={selectedAppointment.status} /></div></div></section><section className="srau-panel"><SectionHeading title="Student verification" /><p className="srau-help-text">Confirm these details with the student. A control number does not replace identity verification.</p>{["Name", "Student number", "Program", "Dates of attendance"].map((label, i) => <label className="srau-check-row" key={label}><input type="checkbox" checked={verifyChecks[i]} onChange={(e) => setVerifyChecks((old) => old.map((v, n) => n === i ? e.target.checked : v))} /><span><b>{label}</b><small>{[selectedAppointment.student, selectedAppointment.number, selectedAppointment.program, "2023–2027"][i]}</small></span></label>)}<div className="srau-button-row"><button className="srau-button srau-button-primary" onClick={() => completeReview("Served")}>Mark served</button><button className="srau-button srau-button-danger-outline" onClick={() => completeReview("No-show")}>No-show</button></div></section></div>}

        {section === "Requests" && <section className="srau-panel"><SectionHeading title="Online requests"><span className="srau-pill">Accepted uploads only</span></SectionHeading><div className="srau-toolbar"><SearchInput value={query} onChange={setQuery} placeholder="Search control number or student" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter requests"><option>All</option>{["Submitted", "Needs processing", "Processing", "Ready for pickup"].map((s) => <option key={s}>{s}</option>)}</select></div><div className="srau-request-list">{activeOnlineRequests.map((item) => <article className="srau-request-card" key={item.id}><div><span className="srau-eyebrow">{item.short}</span><h3>{item.student}</h3><p>{item.service} · {item.time}</p><StatusBadge status={item.status} /></div><div className="srau-request-actions">{normalizeStatus(item.status) === "processing" && <button className="srau-button srau-button-primary" onClick={() => requestMarkReady(item)}>Mark ready</button>}{normalizeStatus(item.status) === "ready for pickup" && <button className="srau-button srau-button-outline" onClick={() => showAppointment(item)}>Review</button>}{["submitted", "needs processing"].includes(normalizeStatus(item.status)) && <button className="srau-button srau-button-outline" onClick={() => updateStatus(item.id, "Processing")}>Start processing</button>}</div></article>)}</div><p className="srau-help-text">Marking a request Ready for pickup updates its status.</p></section>}

        {section === "Slots" && <><section className="srau-panel"><SectionHeading title="Slot management"><button className="srau-button srau-button-primary" onClick={() => setModal("slot")}>＋ Add slot</button></SectionHeading><p className="srau-help-text">Select a working date above. Slot changes are local to this browser session and do not affect real bookings.</p><div className="srau-slot-list">{slots.map((slot) => <div className="srau-slot-row" key={slot.time}><div className="srau-slot-time"><b>{slot.time}</b><small>{slot.closed ? "Unavailable" : slot.booked >= slot.capacity ? "At capacity" : "Accepting bookings"}</small></div><label>Capacity<input type="number" min="0" max="99" value={slot.capacity} onChange={(e) => setSlots((old) => old.map((s) => s.time === slot.time ? { ...s, capacity: Number(e.target.value), closed: Number(e.target.value) === 0 } : s))} /></label><div className="srau-slot-booked"><span>Booked</span><b>{slot.booked}</b></div><StatusBadge status={slot.closed ? "Closed" : slot.booked >= slot.capacity ? "Full" : "Open"} /><button className="srau-button srau-button-small srau-button-outline" onClick={() => setSlots((old) => old.map((s) => s.time === slot.time ? { ...s, closed: !s.closed, capacity: s.closed && s.capacity === 0 ? 12 : s.capacity } : s))}>{slot.closed ? "Reopen" : "Block"}</button></div>)}</div><div className="srau-button-row"><button className="srau-button srau-button-outline" onClick={() => { setSlots((old) => old.map((s) => ({ ...s, capacity: 12, closed: false }))); announce("All slots reset to a capacity of 12."); }}>Reset capacities</button><button className="srau-button srau-button-outline" onClick={() => { setSlots((old) => old.map((s) => ({ ...s, closed: true }))); announce("All slots blocked for the selected date."); }}>Block all slots</button></div></section></>}

        {section === "Services" && <section className="srau-panel"><SectionHeading title="Services"><button className="srau-button srau-button-primary" onClick={() => openServiceEditor()}>＋ Add service</button></SectionHeading><div className="srau-toolbar"><SearchInput value={query} onChange={setQuery} placeholder="Search services" /></div><div className="srau-service-list">{services.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())).map((service) => <article className="srau-service-card" key={service.name}><div className="srau-service-main"><h3>{service.name}</h3><div className="srau-service-meta"><span>Fee <b>{service.fee}</b></span><span>Processing <b>{service.processing}</b></span><span>Eligibility <b>{service.eligibility}</b></span></div><p><b>Requirements:</b> {service.requirements || "Not specified"}</p><p><b>Student note:</b> {service.notes || "None"}</p></div><div className="srau-service-actions"><StatusBadge status={service.available ? "Available" : "Unavailable"} /><button className="srau-button srau-button-outline" onClick={() => openServiceEditor(service)}>Edit</button><button className="srau-button srau-button-small srau-button-outline" onClick={() => { setServices((old) => old.map((s) => s.name === service.name ? { ...s, available: !s.available } : s)); announce(`${service.name} availability updated.`); }}>{service.available ? "Turn off" : "Turn on"}</button></div></article>)}</div><p className="srau-help-text">Confirm official fees, processing times and eligibility with the office.</p></section>}

        {section === "Reports" && <>
          <div className="srau-report-tabs" role="tablist" aria-label="Reports sections">
            <button type="button" role="tab" aria-selected={reportsView === "Reports"} className={reportsView === "Reports" ? "active" : ""} onClick={() => setReportsView("Reports")}>Reports</button>
            <button type="button" role="tab" aria-selected={reportsView === "Appointments"} className={reportsView === "Appointments" ? "active" : ""} onClick={() => { setReportsView("Appointments"); setStatusFilter("All"); setServiceFilter("All"); setQuery(""); }}>Appointments</button>
          </div>
          {reportsView === "Reports" ? <>
            <div className="srau-stat-grid"><article className="srau-stat-card"><span>Appointments this week</span><strong>{appointments.length + 43}</strong><small>Current reporting period</small></article><article className="srau-stat-card green"><span>Completed</span><strong>{appointments.filter((a) => ["Served", "Claimed", "Done"].includes(a.status)).length + 36}</strong><small>Served or claimed</small></article><article className="srau-stat-card red"><span>No-shows</span><strong>{appointments.filter((a) => a.status === "No-show").length + 2}</strong><small>Marked no-show</small></article></div>
            <div className="srau-content-grid"><section className="srau-panel"><SectionHeading title="Busiest hours" /><div className="srau-bars">{[{ label: "8 AM", value: 55 }, { label: "9 AM", value: 92 }, { label: "10 AM", value: 78 }, { label: "11 AM", value: 46 }, { label: "1 PM", value: 62 }, { label: "2 PM", value: 34 }, { label: "3 PM", value: 20 }].map((bar) => <div className="srau-bar-column" key={bar.label}><span>{bar.value}</span><div className="srau-bar-track"><i style={{ height: `${bar.value}%` }} /></div><small>{bar.label}</small></div>)}</div></section><section className="srau-panel"><SectionHeading title="Most requested services" /><div className="srau-simple-table"><table><thead><tr><th>Service</th><th>Requests</th></tr></thead><tbody>{[["Transcript of Records", 22], ["CTC / Authentication", 14], ["Certificates", 9], ["Diploma", 3]].map(([name, count]) => <tr key={name}><td>{name}</td><td>{count}</td></tr>)}</tbody></table></div></section></div>
            <section className="srau-panel"><SectionHeading title="Export report"><p className="srau-help-text">Download the appointment list as a CSV file.</p></SectionHeading><button className="srau-button srau-button-primary" onClick={exportReport}>Download CSV report</button></section>
          </> : <section className="srau-panel"><SectionHeading title="Appointments"><button className="srau-button srau-button-outline" onClick={exportReport}>Export CSV</button></SectionHeading><div className="srau-toolbar"><SearchInput value={query} onChange={setQuery} placeholder="Control number or student" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status"><option>All</option>{["Submitted", "Needs processing", "Processing", "Ready for pickup", "Served", "Claimed", "No-show", "Done"].map((s) => <option key={s}>{s}</option>)}</select><select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} aria-label="Filter by service"><option>All</option>{services.map((s) => <option key={s.name}>{s.name}</option>)}</select><input aria-label="Filter date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></div><AppointmentTable rows={[...filteredAppointments].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))} onVerify={showAppointment} onStatus={updateStatus} reviewOnly hideActions /><p className="srau-table-foot">Showing {filteredAppointments.length} records · Newest records appear first. Filters apply immediately.</p></section>}
        </>}
    </main>

    {modal === "confirm-ready" && readyCandidate && <ConfirmItemReadyModal item={readyCandidate} officeLabel="SRAU · University Registrar's Office" onClose={() => { setModal(""); setReadyCandidate(null); }} onConfirm={confirmMarkReady} />}
    {modal === "verify-counter" && selectedAppointment && <VerifyAtCounterModal item={selectedAppointment} officeLabel="SRAU · University Registrar's Office" onClose={() => setModal("")} onComplete={completeReview} /> }
    {modal === "walkin" && <AdminModal title="Add walk-in student" onClose={() => setModal("")}><form className="srau-modal-form" onSubmit={addWalkIn}><label>Student name<input autoFocus value={walkIn.student} onChange={(e) => setWalkIn({ ...walkIn, student: e.target.value })} placeholder="Full name" /></label><label>Student number<input value={walkIn.number} onChange={(e) => setWalkIn({ ...walkIn, number: e.target.value })} placeholder="e.g. 2023-00123" /></label><label>Program<select value={walkIn.program} onChange={(e) => setWalkIn({ ...walkIn, program: e.target.value })}><option value="">Select program</option>{["BSIT", "BSCS", "BSBA", "BSED", "BEED", "Other"].map((p) => <option key={p}>{p}</option>)}</select></label><label>Service<select value={walkIn.service} onChange={(e) => setWalkIn({ ...walkIn, service: e.target.value })}>{services.map((s) => <option key={s.name}>{s.name}</option>)}</select></label><p className="srau-help-text">No ticket is created. This records the student in today's queue.</p><div className="srau-button-row"><button type="button" className="srau-button srau-button-outline" onClick={() => setModal("")}>Cancel</button><button className="srau-button srau-button-primary">Save walk-in</button></div></form></AdminModal>}
    {modal === "slot" && <AdminModal title="Add a time slot" onClose={() => setModal("")}><form className="srau-modal-form" onSubmit={(e) => { e.preventDefault(); const time = e.currentTarget.elements.slotTime.value; if (slots.some((s) => s.time === time)) { announce("That time slot already exists."); return; } setSlots((old) => [...old, { time, capacity: Number(slotCapacity), booked: 0, closed: Number(slotCapacity) === 0 }]); setModal(""); announce(`${time} added to the schedule.`); }}><label>Time<input name="slotTime" type="time" required /></label><label>Capacity<input type="number" min="0" max="99" value={slotCapacity} onChange={(e) => setSlotCapacity(e.target.value)} required /></label><div className="srau-button-row"><button type="button" className="srau-button srau-button-outline" onClick={() => setModal("")}>Cancel</button><button className="srau-button srau-button-primary">Add slot</button></div></form></AdminModal>}
    {modal === "service" && serviceDraft && <AdminModal title={services.some((s) => s.name === serviceDraft.name) ? "Edit service" : "Add service"} onClose={() => setModal("")}><form className="srau-modal-form" onSubmit={saveService}><label>Service name<input value={serviceDraft.name} onChange={(e) => setServiceDraft({ ...serviceDraft, name: e.target.value })} required /></label><label>Fee<input value={serviceDraft.fee} onChange={(e) => setServiceDraft({ ...serviceDraft, fee: e.target.value })} /></label><label>Processing time<input value={serviceDraft.processing} onChange={(e) => setServiceDraft({ ...serviceDraft, processing: e.target.value })} /></label><label>Eligibility<select value={serviceDraft.eligibility} onChange={(e) => setServiceDraft({ ...serviceDraft, eligibility: e.target.value })}>{["All students", "Graduates", "Currently enrolled", "Other"].map((x) => <option key={x}>{x}</option>)}</select></label><label>Requirements<textarea value={serviceDraft.requirements} onChange={(e) => setServiceDraft({ ...serviceDraft, requirements: e.target.value })} rows="2" /></label><label>Notes shown to students<textarea value={serviceDraft.notes} onChange={(e) => setServiceDraft({ ...serviceDraft, notes: e.target.value })} rows="2" /></label><label className="srau-inline-check"><input type="checkbox" checked={serviceDraft.available} onChange={(e) => setServiceDraft({ ...serviceDraft, available: e.target.checked })} /> Service is available</label><div className="srau-button-row"><button type="button" className="srau-button srau-button-outline" onClick={() => setModal("")}>Cancel</button><button className="srau-button srau-button-primary">Save service</button></div></form></AdminModal>}
  </div>;
}

