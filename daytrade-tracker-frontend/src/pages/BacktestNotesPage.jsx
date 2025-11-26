// src/pages/BacktestNotesPage.jsx
import React, { useState } from "react";
import axiosClient from "../api/axiosClient";

// You can DRY this up by importing from a shared file if you want
const TIMEFRAME_OPTIONS = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1H",
  "2H",
  "4H",
  "Daily",
];

const ICT_SETUP_OPTIONS = [
  "Breaker Block Model (BB)",
  "OB + FVG continuation",
  "OB + Displacement + Retracement",
  "IFVG reversal after MSS",
  "FVG continuation in HTF bias",
  "Liquidity sweep into OB",
  "Mitigation Block continuation",
  "Killzone (NYO / LDN) scalp",
  "Other / Custom",
];

const BacktestNotesPage = () => {
  const [form, setForm] = useState({
    date: "",
    time: "",
    symbol: "",
    timeframe: "1m",
    ict_setup: "Breaker Block Model (BB)",
    session: "",
    outcome: "successful", // successful / failed / partial
    what_happened: "",
    why_outcome: "",
    notes: "",
    strategy_modification: false,
    modification_details: "",
    screenshot_link: "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      // Adjust endpoint name if you prefer /ict-backtests or something else
      await axiosClient.post("/backtests", form);
      setMessage("Backtest note saved.");
      // Keep the same ICT setup default so you can log multiple BB backtests quickly
      setForm((prev) => ({
        ...prev,
        date: "",
        time: "",
        symbol: "",
        timeframe: prev.timeframe,
        session: prev.session,
        outcome: "successful",
        what_happened: "",
        why_outcome: "",
        notes: "",
        strategy_modification: false,
        modification_details: "",
        screenshot_link: "",
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to save backtest note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>ICT Backtest Notes</h2>
      <p style={{ fontSize: "0.9rem", marginBottom: "10px" }}>
        Use this page only for{" "}
        <strong>TradingView backtesting / bar replay</strong> — not live trades.
        Capture how the ICT model actually behaved, including failures and any
        strategy tweaks.
      </p>

      {message && <p style={{ color: "green", fontSize: "0.9rem" }}>{message}</p>}
      {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.grid}>
        {/* Core context */}
        <section style={styles.section}>
          <h3>Context</h3>
          <div style={styles.row}>
            <label style={styles.label}>
              Date (backtest)
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </label>
            <label style={styles.label}>
              Time of execution
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                style={styles.input}
              />
            </label>
          </div>

          <div style={styles.row}>
            <label style={styles.label}>
              Symbol
              <input
                type="text"
                name="symbol"
                value={form.symbol}
                onChange={handleChange}
                placeholder="e.g. MNQ, ES, NAS100"
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              Timeframe
              <select
                name="timeframe"
                value={form.timeframe}
                onChange={handleChange}
                style={styles.input}
              >
                {TIMEFRAME_OPTIONS.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={styles.row}>
            <label style={styles.label}>
              Session (optional)
              <select
                name="session"
                value={form.session}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Select</option>
                <option value="asia">Asia</option>
                <option value="london">London</option>
                <option value="newyork">New York</option>
              </select>
            </label>
          </div>
        </section>

        {/* Strategy + outcome */}
        <section style={styles.section}>
          <h3>Strategy & Outcome</h3>

          <label style={styles.label}>
            ICT Strategy / Model
            <select
              name="ict_setup"
              value={form.ict_setup}
              onChange={handleChange}
              style={styles.input}
            >
              {ICT_SETUP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          <div style={styles.row}>
            <label style={styles.label}>
              Outcome
              <select
                name="outcome"
                value={form.outcome}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="successful">Successful</option>
                <option value="failed">Failed</option>
                <option value="partial">Partial / mixed</option>
              </select>
            </label>
          </div>

          <label style={styles.label}>
            What happened? (short summary)
            <textarea
              name="what_happened"
              value={form.what_happened}
              onChange={handleChange}
              rows={3}
              style={{ ...styles.input, resize: "vertical" }}
              placeholder="e.g. BB formed after sweep, displacement in my direction, price respected BB and reached target..."
            />
          </label>

          <label style={styles.label}>
            Why did it succeed or fail? (root cause)
            <textarea
              name="why_outcome"
              value={form.why_outcome}
              onChange={handleChange}
              rows={3}
              style={{ ...styles.input, resize: "vertical" }}
              placeholder="e.g. Failed because I forced BB in a counter-HTF context; liquidity was actually resting above..."
            />
          </label>
        </section>

        {/* Strategy modification + notes */}
        <section style={styles.section}>
          <h3>Strategy Modifications & Notes</h3>

          <div style={styles.checkboxRow}>
            <label>
              <input
                type="checkbox"
                name="strategy_modification"
                checked={form.strategy_modification}
                onChange={handleChange}
              />{" "}
              Strategy modification applied?
            </label>
          </div>

          {form.strategy_modification && (
            <label style={styles.label}>
              Describe the modification
              <textarea
                name="modification_details"
                value={form.modification_details}
                onChange={handleChange}
                rows={3}
                style={{ ...styles.input, resize: "vertical" }}
                placeholder="e.g. Only take BB if HTF is aligned and there's a clear liquidity pool above; added filter to require MSS first..."
              />
            </label>
          )}

          <label style={styles.label}>
            Additional notes (pattern, management ideas, rules update)
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={5}
              style={{ ...styles.input, resize: "vertical" }}
              placeholder="Any extra observations that help refine your ICT BB or other models."
            />
          </label>

          <label style={styles.label}>
            Screenshot / TradingView link (optional)
            <input
              type="url"
              name="screenshot_link"
              value={form.screenshot_link}
              onChange={handleChange}
              style={styles.input}
              placeholder="https://www.tradingview.com/..."
            />
          </label>
        </section>

        <button type="submit" style={styles.submitBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Backtest Note"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
    marginTop: "10px",
  },
  section: {
    padding: "15px",
    borderRadius: "8px",
    background: "white",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  row: {
    display: "flex",
    gap: "10px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.85rem",
    flex: 1,
  },
  input: {
    padding: "6px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
    marginTop: "4px",
  },
  checkboxRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    fontSize: "0.85rem",
  },
  submitBtn: {
    gridColumn: "1 / -1",
    padding: "10px",
    marginTop: "10px",
    background: "#6366f1",
    border: "none",
    borderRadius: "6px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default BacktestNotesPage;