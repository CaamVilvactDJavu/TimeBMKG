import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Time from "../Time/Time";
import "./App.css";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Time />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
