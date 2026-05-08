import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./Landing.jsx";
import Game from "./Game.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/play" element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}
