import { useMemo, useState } from "react";
import Navbar from "../../navbar/Navbar.jsx";
import "./SuperAdmin.css";

const initialOffices = [
  { name: "HSU", booked: 12, done: 5, noShow: 1, status: "Open", booking: "5 working days ahead", capacity: "60–100 / day", noShowRule: "Rebook", walkIns: "Yes", managedBy: "Staff" },
  { name: "SRAU", booked: 9, done: 4, noShow: 0, status: "Open", booking: "5 working days ahead", capacity: "75–100 / day", noShowRule: "Rebook", walkIns: "Yes", managedBy: "Head or staff" },
  { name: "MISU", booked: 4, done: 2, noShow: 0, status: "Open", booking: "As students arrive", capacity: "60+ / day", noShowRule: "Remove from log", walkIns: "Yes", managedBy: "Staff at window" },
  { name: "BAU", booked: 15, done: 6, noShow: 2, status: "Closed", booking: "5 working days ahead", capacity: "Books 350; uniforms 250; Sablay 200; grad pictorial 200", noShowRule: "Rebook", walkIns: "Yes", managedBy: "Head or staff" },
];
const initialAccounts = [
  { id: 1, name: "Ana Reyes", email: "ana.reyes@rtu.edu.ph", role: "Office admin", office: "HSU", active: true },
  { id: 2, name: "Ben Cruz", email: "ben.cruz@rtu.edu.ph", role: "Office admin", office: "BAU", active: true },
  { id: 3, name: "Carla Lim", email: "carla.lim@rtu.edu.ph", role: "Office admin", office: "SRAU", active: false },
];
const initialServices = [
  { office: "SRAU", service: "Transcript of Records (TOR)", fee: "Pending survey", processing: "5 working days", pickup: "Yes" },
  { office: "SRAU", service: "Certified True Copy (CTC)", fee: "Pending survey", processing: "Set by office", pickup: "Yes" },
  { office: "MISU", service: "Registration form", fee: "Pending survey", processing: "Set by office", pickup: "Yes" },
];
const initialAudit = [
  { time: "9:02 AM", user: "SRAU staff", action: "Closed slot 10:00 AM" },
  { time: "8:40 AM", user: "Super Admin", action: "Changed MISU no-show rule" },
  { time: "Yesterday", user: "BAU admin", action: "Updated product availability" },
];
const sections = ["Overview", "Offices", "Accounts", "Forecast", "Audit log"];

export default function SuperAdmin() {
  const [section, setSection] = useState("Overview");
  const [offices, setOffices] = useState(initialOffices);
  const [accounts, setAccounts] = useState(initialAccounts);
  const [services, setServices] = useState(initialServices);
  const [audit, setAudit] = useState(initialAudit);
  const [accountSearch, setAccountSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [officeFilter, setOfficeFilter] = useState("All offices");
  const [accountModal, setAccountModal] = useState(null);
  const [notice, setNotice] = useState("");
  const [forecastOffice, setForecastOffice] = useState("SRAU");

  function logAction(action, user = "Super Admin") {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    setAudit(prev => [{ time, user, action }, ...prev]);
  }
  function go(item) { setSection(item); setNotice(""); }
  function toggleOffice(name) {
    setOffices(prev => prev.map(o => o.name === name ? { ...o, status: o.status === "Open" ? "Closed" : "Open" } : o));
    const next = offices.find(o => o.name === name)?.status === "Open" ? "Closed" : "Open";
    logAction(`${name} office status changed to ${next}`);
    setNotice(`${name} is now ${next.toLowerCase()}.`);
  }
  function saveAccount(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = { id: accountModal?.id ?? Date.now(), name: String(form.get("name")).trim(), email: String(form.get("email")).trim(), role: String(form.get("role")), office: String(form.get("office")), active: accountModal?.active ?? true };
    if (!item.name || !item.email) return;
    setAccounts(prev => accountModal?.id ? prev.map(a => a.id === accountModal.id ? { ...a, ...item } : a) : [...prev, item]);
    logAction(`${accountModal?.id ? "Edited" : "Added"} staff account: ${item.name}`);
    setNotice(`Staff account ${accountModal?.id ? "updated" : "added"}.`);
    setAccountModal(null);
  }
  function toggleAccount(account) {
    const active = !account.active;
    setAccounts(prev => prev.map(a => a.id === account.id ? { ...a, active } : a));
    logAction(`${active ? "Activated" : "Deactivated"} staff account: ${account.name}`);
    setNotice(`${account.name}'s account is now ${active ? "active" : "inactive"}.`);
  }
  function updateService(index, key, value) {
    setServices(prev => prev.map((s, i) => i === index ? { ...s, [key]: value } : s));
  }

  const filteredAccounts = useMemo(() => accounts.filter(a => `${a.name} ${a.email} ${a.role} ${a.office}`.toLowerCase().includes(accountSearch.toLowerCase())), [accounts, accountSearch]);
  const filteredAudit = useMemo(() => audit.filter(a => `${a.time} ${a.user} ${a.action}`.toLowerCase().includes(auditSearch.toLowerCase())), [audit, auditSearch]);
  const officeRows = officeFilter === "All offices" ? offices : offices.filter(o => o.name === officeFilter);

  return <div className="super-admin-shell">
    <Navbar accountType="super-admin" adminSection={section} onAdminNavigate={go} />
    <main className="super-admin-main">
      <header className="sa-page-heading"><div><p className="sa-eyebrow">RTU-CCSAS · SYSTEM MANAGEMENT</p><h1>{section === "Audit log" ? "Audit log" : section === "Forecast" ? "Traffic forecast" : section === "Accounts" ? "Accounts and roles" : section === "Offices" ? "Office management" : "Super Admin overview"}</h1><p>Monitor campus service offices, staff access, capacity, and system activity.</p></div><span className="sa-role-pill">Super Admin</span></header>
      {notice && <div className="sa-notice" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}

      {section === "Overview" && <>
        <div className="sa-stat-grid">
          <article className="sa-stat sa-blue"><span>Appointments today</span><strong>{offices.reduce((n, o) => n + o.booked, 0)}</strong><small>Across all offices</small></article>
          <article className="sa-stat sa-green"><span>Completed today</span><strong>{offices.reduce((n, o) => n + o.done, 0)}</strong><small>Marked as done</small></article>
          <article className="sa-stat sa-red"><span>No-shows today</span><strong>{offices.reduce((n, o) => n + o.noShow, 0)}</strong><small>Across all offices</small></article>
          <article className="sa-stat sa-neutral"><span>Open offices</span><strong>{offices.filter(o => o.status === "Open").length}<em> / {offices.length}</em></strong><small>Office availability</small></article>
        </div>
        <section className="sa-panel"><div className="sa-panel-heading"><div><h2>Appointments today by office</h2><p>Quick overview of workload and availability.</p></div><button className="sa-button sa-button-light" onClick={() => go("Offices")}>Manage offices</button></div>
          <div className="sa-table-wrap"><table><thead><tr><th>Office</th><th>Booked</th><th>Done</th><th>No-show</th><th>Status</th><th>Action</th></tr></thead><tbody>{offices.map(o => <tr key={o.name}><td><strong>{o.name}</strong></td><td>{o.booked}</td><td>{o.done}</td><td>{o.noShow}</td><td><span className={`sa-status ${o.status === "Open" ? "is-open" : "is-closed"}`}>{o.status}</span></td><td><button className="sa-text-button" onClick={() => { setOfficeFilter(o.name); go("Offices"); }}>View office</button></td></tr>)}</tbody></table></div>
        </section>
        <div className="sa-two-grid"><section className="sa-panel"><div className="sa-panel-heading"><div><h2>Busiest hours</h2><p>Sample appointments by hour.</p></div></div><div className="sa-mini-chart">{[{t:"8 AM",v:38},{t:"9 AM",v:72},{t:"10 AM",v:88},{t:"11 AM",v:56},{t:"12 PM",v:32},{t:"1 PM",v:68},{t:"2 PM",v:47}].map(x=><div className="sa-bar-col" key={x.t}><div className="sa-bar" style={{height:`${x.v}%`}} title={`${x.v} appointments`} /><small>{x.t}</small></div>)}</div></section>
          <section className="sa-panel"><div className="sa-panel-heading"><div><h2>Most requested services</h2><p>Illustrative service demand.</p></div></div><div className="sa-service-rank"><div><span className="sa-rank">01</span><span>Registration form</span><b>High</b></div><div><span className="sa-rank">02</span><span>Transcript of Records</span><b>High</b></div><div><span className="sa-rank">03</span><span>Dental consultation</span><b>Medium</b></div></div></section></div>
      </>}

      {section === "Offices" && <>
        <section className="sa-panel"><div className="sa-panel-heading"><div><h2>Office status and rules</h2><p>Review each office's booking policy, capacity, no-show rule, and walk-in availability.</p></div><label className="sa-filter-label">Office<select value={officeFilter} onChange={e => setOfficeFilter(e.target.value)}><option>All offices</option>{offices.map(o => <option key={o.name}>{o.name}</option>)}</select></label></div>
          <div className="sa-table-wrap"><table><thead><tr><th>Office</th><th>Booking</th><th>Capacity (reported)</th><th>No-show</th><th>Walk-ins</th><th>Slots managed by</th><th>Status</th><th>Action</th></tr></thead><tbody>{officeRows.map(o=><tr key={o.name}><td><strong>{o.name}</strong></td><td>{o.booking}</td><td className="sa-capacity-cell">{o.capacity}</td><td>{o.noShowRule}</td><td>{o.walkIns}</td><td>{o.managedBy}</td><td><span className={`sa-status ${o.status === "Open" ? "is-open" : "is-closed"}`}>{o.status}</span></td><td><button className="sa-button sa-button-small" onClick={() => toggleOffice(o.name)}>{o.status === "Open" ? "Close office" : "Open office"}</button></td></tr>)}</tbody></table></div>
        </section>
        <section className="sa-panel"><div className="sa-panel-heading"><div><h2>Verification fields by office</h2><p>Reference fields shown to staff at the counter.</p></div></div><div className="sa-table-wrap"><table><thead><tr><th>Office</th><th>Fields shown to staff</th></tr></thead><tbody><tr><td><strong>SRAU</strong></td><td>Name, student number, program, dates of attendance</td></tr><tr><td><strong>MISU</strong></td><td>Name</td></tr><tr><td><strong>HSU</strong></td><td>Name, student number</td></tr><tr><td><strong>BAU</strong></td><td>Name, student number, specific product</td></tr></tbody></table></div></section>
        <section className="sa-panel"><div className="sa-panel-heading"><div><h2>Services, fees, and processing</h2><p>Amounts are pending the fee survey, as indicated in the design plan.</p></div></div><div className="sa-table-wrap"><table><thead><tr><th>Office</th><th>Service</th><th>Fee</th><th>Processing</th><th>Pickup</th></tr></thead><tbody>{services.map((s,i)=><tr key={`${s.office}-${s.service}`}><td>{s.office}</td><td><input className="sa-inline-input" value={s.service} onChange={e=>updateService(i,"service",e.target.value)} aria-label={`${s.office} service`} /></td><td><input className="sa-inline-input sa-fee-input" value={s.fee} onChange={e=>updateService(i,"fee",e.target.value)} aria-label={`${s.service} fee`} /></td><td><input className="sa-inline-input" value={s.processing} onChange={e=>updateService(i,"processing",e.target.value)} aria-label={`${s.service} processing time`} /></td><td>{s.pickup}</td></tr>)}</tbody></table></div><p className="sa-callout">Fees should appear to students and on their ticket. Payment is made at the counter; final amounts must come from the fee survey.</p><div className="sa-panel-footer"><button className="sa-button" onClick={() => { logAction("Updated services, fees, or processing details"); setNotice("Service settings updated locally."); }}>Save service settings</button></div></section>
      </>}

      {section === "Accounts" && <section className="sa-panel"><div className="sa-panel-heading"><div><h2>Staff accounts and roles</h2><p>Search, add, edit, and activate or deactivate office staff accounts.</p></div><button className="sa-button" onClick={() => setAccountModal({})}>+ Add staff</button></div>
        <div className="sa-toolbar"><input value={accountSearch} onChange={e=>setAccountSearch(e.target.value)} placeholder="Search name, email, role, or office" aria-label="Search staff accounts" /><span>{filteredAccounts.length} account{filteredAccounts.length===1?"":"s"}</span></div>
        <div className="sa-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Office</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredAccounts.map(a=><tr key={a.id}><td><strong>{a.name}</strong></td><td>{a.email}</td><td>{a.role}</td><td>{a.office}</td><td><span className={`sa-status ${a.active?"is-open":"is-closed"}`}>{a.active?"Active":"Inactive"}</span></td><td><div className="sa-actions"><button className="sa-text-button" onClick={()=>setAccountModal(a)}>Edit</button><button className="sa-text-button" onClick={()=>toggleAccount(a)}>{a.active?"Deactivate":"Activate"}</button></div></td></tr>)}</tbody></table>{filteredAccounts.length===0&&<p className="sa-empty">No staff accounts match that search.</p>}</div>
      </section>}

      {section === "Forecast" && <>
        <section className="sa-panel"><div className="sa-panel-heading"><div><h2>Traffic forecast</h2><p>Compare this week's appointments with an illustrative forecast for next week.</p></div><label className="sa-filter-label">Office<select value={forecastOffice} onChange={e=>setForecastOffice(e.target.value)}>{offices.map(o=><option key={o.name}>{o.name}</option>)}</select></label></div>
          <div className="sa-legend"><span><i className="sa-legend-current"/> This week</span><span><i className="sa-legend-forecast"/> Forecast next week</span></div>
          <div className="sa-forecast-chart">{[{d:"Mon",a:62,b:72},{d:"Tue",a:70,b:80},{d:"Wed",a:66,b:76},{d:"Thu",a:78,b:90},{d:"Fri",a:85,b:92}].map(x=><div className="sa-forecast-day" key={x.d}><div className="sa-forecast-bars"><div className="sa-forecast-bar current" style={{height:`${x.a}%`}}/><div className="sa-forecast-bar forecast" style={{height:`${x.b}%`}}/></div><span>{x.d}</span></div>)}</div>
        </section>
        <section className="sa-panel"><div className="sa-panel-heading"><div><h2>Expected next week vs capacity</h2><p>Planning estimates from the HTML design reference.</p></div></div><div className="sa-table-wrap"><table><thead><tr><th>Office</th><th>Expected</th><th>Capacity</th><th>Status</th></tr></thead><tbody><tr><td><strong>SRAU</strong></td><td>410</td><td>375–500</td><td><span className="sa-status is-warning">Near limit</span></td></tr><tr><td><strong>MISU</strong></td><td>190</td><td>300+</td><td><span className="sa-status is-open">OK</span></td></tr><tr><td><strong>HSU</strong></td><td>260</td><td>300–500</td><td><span className="sa-status is-open">OK</span></td></tr><tr><td><strong>BAU</strong></td><td>520</td><td>Per product</td><td><span className="sa-status is-closed">Peak Wednesday</span></td></tr></tbody></table></div><p className="sa-callout">Most searched this week: registration form, Transcript of Records, and dental consultation. Forecasts use past appointment counts; these figures are sample data.</p></section>
      </>}

      {section === "Audit log" && <section className="sa-panel"><div className="sa-panel-heading"><div><h2>System audit log</h2><p>Review recorded administrative actions in this session.</p></div></div><div className="sa-toolbar"><input value={auditSearch} onChange={e=>setAuditSearch(e.target.value)} placeholder="Search time, user, or action" aria-label="Search audit log"/><span>{filteredAudit.length} entries</span></div><div className="sa-table-wrap"><table><thead><tr><th>Time</th><th>User</th><th>Action</th></tr></thead><tbody>{filteredAudit.map((a,i)=><tr key={`${a.time}-${a.user}-${i}`}><td>{a.time}</td><td>{a.user}</td><td>{a.action}</td></tr>)}</tbody></table>{filteredAudit.length===0&&<p className="sa-empty">No audit entries match that search.</p>}</div></section>}
      <p className="sa-data-note">Prototype data only. Updates are held in frontend state and are not persisted to a server or database.</p>
    </main>
    {accountModal && <div className="sa-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setAccountModal(null);}}><section className="sa-modal" role="dialog" aria-modal="true" aria-labelledby="sa-account-modal-title"><button className="sa-modal-close" onClick={()=>setAccountModal(null)} aria-label="Close dialog">×</button><h2 id="sa-account-modal-title">{accountModal.id?"Edit staff account":"Add staff account"}</h2><p>Assign a staff role and office access.</p><form onSubmit={saveAccount}><label>Full name<input name="name" defaultValue={accountModal.name??""} required /></label><label>Email address<input name="email" type="email" defaultValue={accountModal.email??""} required /></label><label>Role<select name="role" defaultValue={accountModal.role??"Office admin"}><option>Office admin</option><option>Office staff</option><option>Office head</option></select></label><label>Office<select name="office" defaultValue={accountModal.office??"HSU"}><option>HSU</option><option>SRAU</option><option>MISU</option><option>BAU</option></select></label><div className="sa-modal-actions"><button type="button" className="sa-button sa-button-light" onClick={()=>setAccountModal(null)}>Cancel</button><button className="sa-button" type="submit">Save account</button></div></form></section></div>}
  </div>;
}
