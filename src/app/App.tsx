import "./App.css";
import { Outlet } from "react-router";
import Nav from "../shared/components/Nav.tsx";

function App() {
  return (
    <>
      <div className="main-wrapper">
        <Outlet />
      </div>
      <Nav />
    </>
  );
}

export default App;
