// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tourTab, setTourTab] = useState("overview"); // "overview" | "daily" | "ict"

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axiosClient.post("login_verification/", form);
      const { token, username, active } = res.data;
      if (active){
        login(token, username);
        navigate("/trade");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const renderTourContent = () => {
    if (tourTab === "daily") {
      return (
        <>
          <p style={styles.tourText}>
            Use the journal after every session to lock in what happened:
            <br />
            <strong>• What setup you traded</strong>,{" "}
            <strong>• How you felt</strong>, and{" "}
            <strong>• What you’d do differently.</strong>
          </p>
          <div style={styles.tourCardRow}>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Today&apos;s Win Rate</div>
              <div style={styles.kpiValueGood}>62%</div>
              <div style={styles.kpiSmall}>3 wins · 2 losses</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>Emotional Trades</div>
              <div style={styles.kpiValueWarning}>2</div>
              <div style={styles.kpiSmall}>Goal: 0 per day</div>
            </div>
          </div>
          <div style={styles.miniChart}>
            <div style={styles.miniChartHeader}>
              <span style={styles.miniChartTitle}>Sample Equity Curve</span>
              <span style={styles.miniChartTag}>Daily</span>
            </div>
            <div style={styles.miniChartBody}>
              <div style={{ ...styles.miniLine, width: "75%" }} />
            </div>
            <div style={styles.miniChartFooter}>
              <span style={styles.miniChartFooterText}>Session start</span>
              <span style={styles.miniChartFooterText}>Session end</span>
            </div>
          </div>
        </>
      );
    }

    if (tourTab === "ict") {
      return (
        <>
          <p style={styles.tourText}>
            Tag each trade with your{" "}
            <strong>ICT model (OB, IFVG, BB, Liquidity sweep)</strong> and
            review which one actually pays you.
          </p>
          <div style={styles.tourCardRow}>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>OB Model Win Rate</div>
              <div style={styles.kpiValueGood}>68%</div>
              <div style={styles.kpiSmall}>Best model this month</div>
            </div>
            <div style={styles.kpiCard}>
              <div style={styles.kpiLabel}>IFVG Reversals</div>
              <div style={styles.kpiValueBad}>41%</div>
              <div style={styles.kpiSmall}>
                Needs work — review entries & timing
              </div>
            </div>
          </div>
          <div style={styles.miniChart}>
            <div style={styles.miniChartHeader}>
              <span style={styles.miniChartTitle}>Sample PnL by ICT Setup</span>
              <span style={styles.miniChartTag}>Last 30 days</span>
            </div>
            <div style={styles.miniBarRow}>
              <div style={styles.miniBarLabel}>OB</div>
              <div style={styles.miniBarTrack}>
                <div style={{ ...styles.miniBar, width: "80%" }} />
              </div>
            </div>
            <div style={styles.miniBarRow}>
              <div style={styles.miniBarLabel}>IFVG</div>
              <div style={styles.miniBarTrack}>
                <div
                  style={{ ...styles.miniBar, width: "45%", background: "#f97316" }}
                />
              </div>
            </div>
            <div style={styles.miniBarRow}>
              <div style={styles.miniBarLabel}>Breaker</div>
              <div style={styles.miniBarTrack}>
                <div style={{ ...styles.miniBar, width: "60%" }} />
              </div>
            </div>
          </div>
        </>
      );
    }

    // overview
    return (
      <>
        <p style={styles.tourText}>
          This journal is built for <strong>ICT-style trading</strong> and{" "}
          <strong>Topstep / futures evaluation</strong>:
        </p>
        <ul style={styles.tourList}>
          <li>
            ✍️ <strong>Log every trade</strong> with date, time, SL/TP ladder,
            and ICT context.
          </li>
          <li>
            📊 <strong>Review analytics</strong>: win-rate, PnL trends, emotional
            trades, and ICT model stats.
          </li>
          <li>
            🧠 <strong>Track psychology</strong> so you can cut revenge & FOMO
            trades over time.
          </li>
        </ul>
        <div style={styles.sampleSummaryCard}>
          <div style={styles.sampleSummaryTopRow}>
            <div>
              <div style={styles.sampleSummaryLabel}>Sample Performance</div>
              <div style={styles.sampleSummaryValue}>+8.4% this month</div>
            </div>
            <div style={styles.samplePillGood}>Profitable</div>
          </div>
          <div style={styles.sampleSummaryGrid}>
            <div>
              <div style={styles.sampleSummaryMiniLabel}>Win Rate</div>
              <div style={styles.sampleSummaryMiniValue}>59.7%</div>
            </div>
            <div>
              <div style={styles.sampleSummaryMiniLabel}>Loss Rate</div>
              <div style={styles.sampleSummaryMiniValue}>40.3%</div>
            </div>
            <div>
              <div style={styles.sampleSummaryMiniLabel}>Emotional trades</div>
              <div style={styles.sampleSummaryMiniValueWarning}>39.1%</div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* LEFT: Intro / Interactive tour */}
        <div style={styles.introColumn}>
          <div style={styles.brandBadge}>ICT Trading Journal · Beta</div>
          <h1 style={styles.title}>Turn your trades into a real edge 📈</h1>
          <p style={styles.subtitle}>
            Log your trades, track psychology, and see which ICT setups actually
            pay you over time.
          </p>

          {/* Tour Tabs */}
          <div style={styles.tourTabs}>
            <button
              type="button"
              style={{
                ...styles.tourTabButton,
                ...(tourTab === "overview" ? styles.tourTabButtonActive : {}),
              }}
              onClick={() => setTourTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              style={{
                ...styles.tourTabButton,
                ...(tourTab === "daily" ? styles.tourTabButtonActive : {}),
              }}
              onClick={() => setTourTab("daily")}
            >
              Daily Review
            </button>
            <button
              type="button"
              style={{
                ...styles.tourTabButton,
                ...(tourTab === "ict" ? styles.tourTabButtonActive : {}),
              }}
              onClick={() => setTourTab("ict")}
            >
              ICT Strategy
            </button>
          </div>

          <div style={styles.tourPanel}>{renderTourContent()}</div>
        </div>

        {/* RIGHT: Login card */}
        <div style={styles.formColumn}>
          <form onSubmit={handleSubmit} style={styles.card}>
            <h2 style={styles.cardTitle}>Login to your journal</h2>
            <p style={styles.cardSubtitle}>
              Your trades, notes, and backtests are saved securely to your
              account.
            </p>
            {error && <div style={styles.error}>{error}</div>}

            <label style={styles.label}>
              Username
              <input
                style={styles.input}
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                placeholder="e.g. cisco"
              />
            </label>

            <label style={styles.label}>
              Password
              <input
                style={styles.input}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </label>

            <button style={styles.button} type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <p style={styles.helperText}>
              💡 After logging in, start on the <strong>Submit Trade</strong>{" "}
              page, then review your stats in <strong>Analytics</strong> and{" "}
              <strong>Backtest</strong>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #111827 0, #020617 55%)",
    padding: "16px",
    color: "#e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: "1100px",
    display: "flex",
    flexDirection: "row",
    gap: "18px",
    alignItems: "stretch",
  },
  introColumn: {
    flex: 1.4,
    padding: "16px",
    borderRadius: "16px",
    background:
      "linear-gradient(145deg, rgba(30,64,175,0.95), rgba(8,47,73,0.98))",
    boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  formColumn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
  },
  brandBadge: {
    alignSelf: "flex-start",
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(15,23,42,0.6)",
    fontSize: "0.75rem",
    border: "1px solid rgba(148,163,184,0.4)",
  },
  title: {
    fontSize: "1.6rem",
    fontWeight: 700,
    margin: "4px 0",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "#e5e7eb",
    opacity: 0.9,
    marginBottom: "6px",
  },
  tourTabs: {
    display: "flex",
    gap: "6px",
    marginTop: "4px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  tourTabButton: {
    flex: 1,
    minWidth: "0",
    padding: "6px 8px",
    fontSize: "0.8rem",
    borderRadius: "999px",
    border: "1px solid rgba(148,163,184,0.5)",
    background: "rgba(15,23,42,0.6)",
    color: "#e5e7eb",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  tourTabButtonActive: {
    background: "#22c55e",
    borderColor: "#22c55e",
    color: "#022c22",
    fontWeight: 600,
  },
  tourPanel: {
    marginTop: "2px",
    padding: "10px",
    borderRadius: "12px",
    background: "rgba(15,23,42,0.85)",
    border: "1px solid rgba(51,65,85,0.8)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  tourText: {
    fontSize: "0.85rem",
    lineHeight: 1.4,
  },
  tourList: {
    fontSize: "0.85rem",
    paddingLeft: "16px",
    margin: "4px 0 8px 0",
  },
  tourCardRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  kpiCard: {
    flex: 1,
    minWidth: "120px",
    background: "rgba(15,23,42,0.85)",
    borderRadius: "10px",
    padding: "8px 10px",
    border: "1px solid rgba(75,85,99,0.7)",
  },
  kpiLabel: {
    fontSize: "0.75rem",
    color: "#9ca3af",
  },
  kpiValueGood: {
    marginTop: "2px",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#4ade80",
  },
  kpiValueBad: {
    marginTop: "2px",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#f97373",
  },
  kpiValueWarning: {
    marginTop: "2px",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#fbbf24",
  },
  kpiSmall: {
    marginTop: "2px",
    fontSize: "0.7rem",
    color: "#9ca3af",
  },
  miniChart: {
    marginTop: "4px",
    padding: "8px",
    borderRadius: "10px",
    background: "rgba(15,23,42,0.9)",
    border: "1px dashed rgba(75,85,99,0.9)",
  },
  miniChartHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
    alignItems: "center",
  },
  miniChartTitle: {
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  miniChartTag: {
    fontSize: "0.7rem",
    padding: "2px 6px",
    borderRadius: "999px",
    background: "rgba(37,99,235,0.15)",
    color: "#bfdbfe",
  },
  miniChartBody: {
    height: "40px",
    display: "flex",
    alignItems: "center",
  },
  miniLine: {
    height: "2px",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, #f97316 0%, #22c55e 35%, #22c55e 70%, #22c55e 100%)",
  },
  miniChartFooter: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "4px",
  },
  miniChartFooterText: {
    fontSize: "0.7rem",
    color: "#9ca3af",
  },
  miniBarRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "4px",
  },
  miniBarLabel: {
    width: "52px",
    fontSize: "0.75rem",
  },
  miniBarTrack: {
    flex: 1,
    height: "6px",
    borderRadius: "999px",
    background: "#020617",
  },
  miniBar: {
    height: "100%",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, #22c55e 0%, #4ade80 50%, #bbf7d0 100%)",
  },
  sampleSummaryCard: {
    marginTop: "6px",
    padding: "8px 10px",
    borderRadius: "12px",
    background: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(55,65,81,0.9)",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  sampleSummaryTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sampleSummaryLabel: {
    fontSize: "0.75rem",
    color: "#9ca3af",
  },
  sampleSummaryValue: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#4ade80",
  },
  samplePillGood: {
    fontSize: "0.7rem",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "rgba(16,185,129,0.15)",
    color: "#6ee7b7",
    border: "1px solid rgba(45,212,191,0.8)",
  },
  sampleSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "4px",
    marginTop: "2px",
  },
  sampleSummaryMiniLabel: {
    fontSize: "0.7rem",
    color: "#9ca3af",
  },
  sampleSummaryMiniValue: {
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  sampleSummaryMiniValueWarning: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#fbbf24",
  },

  // Login card
  card: {
    width: "100%",
    maxWidth: "380px",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 18px 40px rgba(0,0,0,0.6)",
    background: "rgba(15,23,42,0.98)",
    border: "1px solid rgba(51,65,85,0.9)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
  },
  cardSubtitle: {
    fontSize: "0.8rem",
    color: "#9ca3af",
    marginTop: "-4px",
    marginBottom: "4px",
  },
  label: {
    fontSize: "0.85rem",
    display: "flex",
    flexDirection: "column",
    color: "#e5e7eb",
  },
  input: {
    padding: "8px",
    marginTop: "4px",
    borderRadius: "8px",
    border: "1px solid #4b5563",
    background: "#020617",
    color: "#e5e7eb",
    fontSize: "0.85rem",
  },
  button: {
    marginTop: "6px",
    padding: "10px",
    background:
      "linear-gradient(135deg, #22c55e 0%, #16a34a 40%, #15803d 100%)",
    border: "none",
    borderRadius: "999px",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "0.8rem",
  },
  helperText: {
    marginTop: "4px",
    fontSize: "0.75rem",
    color: "#9ca3af",
  },

  // Responsive
  "@media (max-width: 768px)": {}, // not used directly, but layout below is mobile-first
};

// Make layout stack on small screens via inline style tweak using JS
// (If you want pure CSS, move to a CSS/SCSS file instead.)
if (window.innerWidth <= 768) {
  styles.container.flexDirection = "column";
  styles.formColumn.marginTop = "14px";
}

export default LoginPage;