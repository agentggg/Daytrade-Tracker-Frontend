import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import TradeFormPage from "./pages/TradeFormPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import PrivateRoute from "./components/PrivateRoute";
import BacktestAnalyticsPage from "./pages/BacktestAnalyticsPage";
import BacktestNotesPage from "./pages/BacktestNotesPage";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav style={styles.nav}>
      <div style={styles.navLeft}>
        <span style={styles.logo}>ICT Journal</span>
        {isAuthenticated && (
          <>
            <Link to="/trade" style={styles.link}>Submit Trade</Link>
            <Link to="/analytics" style={styles.link}>Trade Analytics</Link>
            <Link to="/backtest" style={styles.link}>Backtest Notes</Link>
            <Link to="/backtest-analytics" style={styles.link}>Backtest Analytics</Link>
          </>
        )}
      </div>
      <div>
        {isAuthenticated ? (
          <></>
          // <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        ) : (
          <Link to="/login" style={styles.link}>Login</Link>
        )}
      </div>
    </nav>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div style={styles.pageWrapper}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/trade"
              element={
                <PrivateRoute>
                  <TradeFormPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <PrivateRoute>
                  <AnalyticsPage />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<LoginPage />} />
            <Route
              path="/backtest"
              element={
                <PrivateRoute>
                  <BacktestNotesPage />
                </PrivateRoute>
              }
            />
          <Route
            path="/backtest-analytics"
            element={
              <PrivateRoute>
                <BacktestAnalyticsPage />
              </PrivateRoute>
            }
          />
          </Routes>

        </div>
      </Router>
    </AuthProvider>
  );
};

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#0f172a",
    color: "#e5e7eb",
    alignItems: "center",
  },
  navLeft: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  logo: {
    fontWeight: "500",
    fontSize: "0.9rem",
  },
  link: {
    color: "#e5e7eb",
    textDecoration: "none",
    fontSize: "0.95rem",
  },
  logoutBtn: {
    background: "#ef4444",
    border: "none",
    padding: "6px 12px",
    color: "white",
    borderRadius: "4px",
    cursor: "pointer",
  },
  pageWrapper: {
    padding: "20px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
};

export default App;