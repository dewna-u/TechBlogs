import React from "react";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function Layout({ toggleTheme }) {
  return (
    <>
      <Navbar toggleTheme={toggleTheme} />
      <Outlet /> {/* This is where the routed page content will render */}
    </>
  );
}
