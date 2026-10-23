import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Srau from "./pages/offices/Srau.jsx";
import Hsu from "./pages/offices/Hsu.jsx";
import Misu from "./pages/offices/Misu.jsx";
import Bau from "./pages/offices/Bau.jsx";
import MyAppointments from "./pages/MyAppointments.jsx";
import Verify from "./pages/Verify.jsx";
import Ticket from "./pages/Ticket.jsx";
import Search from "./pages/Search.jsx";

export default function App() {
  const path = window.location.pathname;

  if (path === "/register") {
    return <Register />;
  }

  if (path === "/verify") {
    return <Verify />;
  }

  if (path === "/ticket") {
    return <Ticket />;
  }

  if (path === "/search") {
    return <Search />;
  }

  if (path === "/home") {
    return <Home />;
  }

  if (path === "/srau") {
    return <Srau />;
  }

  if (path === "/hsu") {
    return <Hsu />;
  }

  if (path === "/misu") {
    return <Misu />;
  }

  if (path === "/bau") {
    return <Bau />;
  }

  if (path === "/appointments") {
    return <MyAppointments />;
  }

  return <Login />;
}
