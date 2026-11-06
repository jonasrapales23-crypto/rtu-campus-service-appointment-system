import OfficeBookingPage from "./OfficeBookingPage.jsx";
import { officeBookings } from "../../data/officeBookings.js";

export default function Srau() {
  return <OfficeBookingPage config={officeBookings.srau} />;
}
