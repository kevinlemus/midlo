// src/App.tsx
import React from "react";
import "./styles/theme.css";
import "./styles/globals.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/Home";
import PlaceDetailsPage from "./pages/PlaceDetails";
import MidpointShare from "./pages/share/MidpointShare";
import PlaceShare from "./pages/share/PlaceShare";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Share preview pages */}
        <Route path="/share/midpoint" element={<MidpointShare />} />
        <Route path="/share/place/:placeId" element={<PlaceShare />} />

        {/* Normal app pages */}
        <Route path="/p/:placeId" element={<PlaceDetailsPage />} />

        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
