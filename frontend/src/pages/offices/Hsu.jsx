import OfficeBookingPage from "./OfficeBookingPage.jsx";
import { officeBookings } from "../../data/officeBookings.js";

export default function Hsu() {
  return <OfficeBookingPage config={officeBookings.hsu} />;
}
