import OfficeBookingPage from "./OfficeBookingPage.jsx";
import { officeBookings } from "../../data/officeBookings.js";

export default function Bau() {
  return <OfficeBookingPage config={officeBookings.bau} />;
}
