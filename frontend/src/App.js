import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import Cases from "./components/Cases";
import Clients from "./components/Clients";
import CourtDates from "./components/CourtDates";
import Users from "./components/Users";
import Sidebar from "./components/Sidebar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // For demo purposes, set a default user
    setCurrentUser({
      id: "default-user",
      name: "John Smith",
      email: "john.smith@lawfirm.com",
      role: "attorney"
    });
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <div className="flex h-screen bg-gray-50">
          <Sidebar 
            isOpen={sidebarOpen} 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            currentUser={currentUser}
          />
          
          <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
            <main className="flex-1 overflow-y-auto p-6">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard currentUser={currentUser} />} />
                <Route path="/cases" element={<Cases currentUser={currentUser} />} />
                <Route path="/clients" element={<Clients currentUser={currentUser} />} />
                <Route path="/court-dates" element={<CourtDates currentUser={currentUser} />} />
                <Route path="/users" element={<Users currentUser={currentUser} />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
