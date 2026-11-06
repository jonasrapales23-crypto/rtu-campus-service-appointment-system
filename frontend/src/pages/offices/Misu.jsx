import OfficeBookingPage from "./OfficeBookingPage.jsx";
import { officeBookings } from "../../data/officeBookings.js";

export default function Misu() {
  return <OfficeBookingPage config={officeBookings.misu} />;
}
