import { Info, Disc } from "lucide-react";

import { BrowserRouter, Routes, Route, NavLink } from "react-router";
import { TheForm } from "./TheForm";
import { About } from "./About";

function getBase() {
  const rawBase = import.meta.env.BASE_URL;

  return rawBase == "/" ? "" : rawBase;
}

function TopBar() {
  const base = getBase();

  return (
    <div className="flex justify-center pt-2 text-5xl pb-2 text-center h-20">
      <img src={`${base}/ps_down_left.svg`} className="hidden sm:block" />
      <img src={`${base}/ps_up_left.svg`} className="hidden sm:block" />

      <div className="mr-10 ml-10 text-yellow-300 font-bold"> PumpSync </div>

      <img src={`${base}/ps_up_right.svg`} className="hidden sm:block" />
      <img src={`${base}/ps_down_right.svg`} className="hidden sm:block" />
    </div>
  );
}

function BottomBar() {
  const base = getBase();

  return (
    <div className="flex justify-evenly border-t gap-5 py-2">
      <NavLink to={base}>
        <div className="flex flex-col items-center">
          <div>
            <Disc />
          </div>
          <div>Sync</div>
        </div>
      </NavLink>

      <NavLink to={`${base}/about`}>
        <div className="flex flex-col items-center">
          <div>
            <Info />
          </div>
          <div>About</div>
        </div>
      </NavLink>
    </div>
  );
}

function App() {
  const base = getBase();

  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col">
        <TopBar />

        <Routes>
          <Route path={base} element={<TheForm />} />
          <Route path={`${base}/about`} element={<About />} />
        </Routes>

        <BottomBar />
      </div>
    </BrowserRouter>
  );
}

export default App;
