import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Sidebar from '../Components/Sidebar';
import Header from '../Components/Header';
import Pagination from '../Components/Pagination';

import Dashboard from '../pages/Dashboard';
import Students from '../pages/Students';
import Course from '../pages/Course';
import Payments from '../pages/Payments';
import Schedule from '../pages/Schedule';
import Exam from '../pages/Exam';
import Report from '../pages/Report';
import Settings from '../pages/Settings';

import { ToastProvider } from '../modals/ToastProvider'; 

function Panel() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ToastProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <div
            style={{
              height: '10px',
              background: '#1F6978',
              width: '100%',
              position: 'fixed',
              top: 0,
              zIndex: 100,
            }}
          />
          <div style={{ display: 'flex', flex: 1, marginTop: '10px' }}>
            {!isMobile && (
              <div
                style={{
                  width: '275px',
                  height: 'calc(100vh - 10px)',
                  position: 'fixed',
                  top: '10px',
                  zIndex: 10,
                }}
              >
                <Sidebar />
              </div>
            )}
            {isMobile && drawerOpen && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    top: 10,
                    left: 0,
                    height: '100vh',
                    width: '275px',
                    backgroundColor: '#fff',
                    boxShadow: '2px 0 5px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                  }}
                >
                  <Sidebar onClose={() => setDrawerOpen(false)} />
                </div>
                <div
                  style={{
                    position: 'fixed',
                    top: 10,
                    left: '275px',
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    zIndex: 999,
                  }}
                  onClick={() => setDrawerOpen(false)}
                />
              </>
            )}
            <div
              style={{
                marginLeft: isMobile ? 0 : '275px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 10px)',
                overflow: 'hidden',
              }}
            >
              <Header onMenuClick={() => setDrawerOpen(true)} />
              <main
                style={{
                  flex: 1,
                  padding: '30px',
                  overflowY: 'auto',
                  backgroundColor: '#ffffff',
                }}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/students" element={<Students />} />
                  <Route path="/course" element={<Course />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path='/schedule' element={<Schedule/>}/>
                  <Route path="/exam" element={<Exam />} />
                  <Route path="/report" element={<Report />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>

                <Pagination
                  currentPage={1}
                  totalPages={5}
                  onPageChange={(page) => console.log('Go to page:', page)}
                />
              </main>
            </div>
          </div>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default Panel;
