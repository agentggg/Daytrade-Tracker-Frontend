// src/pages/BacktestAnalyticsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const OUTCOME_COLORS = {
  successful: "#22c55e", // green
  failed: "#ef4444",     // red
  partial: "#f97316",    // orange
};

const BacktestAnalyticsPage = () => {
  const [backtests, setBacktests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBacktests = async () => {
      setLoading(true);
      try {
        // Adjust endpoint if needed
        const res = await axiosClient.get("/backtests");
        setBacktests(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBacktests();
  }, []);

  const stats = useMemo(() => {
    if (!backtests.length) return null;

    const total = backtests.length;

    const successes = backtests.filter((b) => b.outcome === "successful");
    const fails = backtests.filter((b) => b.outcome === "failed");
    const partials = backtests.filter((b) => b.outcome === "partial");

    const successRate = (successes.length / total) * 100;
    const failRate = (fails.length / total) * 100;
    const partialRate = (partials.length / total) * 100;

    const modified = backtests.filter((b) => b.strategy_modification);
    const modifiedCount = modified.length;

    const modifiedWins = successes.filter((b) => b.strategy_modification);
    const modifiedFails = fails.filter((b) => b.strategy_modification);

    const unmodifiedWins = successes.filter((b) => !b.strategy_modification);
    const unmodifiedFails = fails.filter((b) => !b.strategy_modification);

    const modifiedSuccessRate =
      modified.length > 0 ? (modifiedWins.length / modified.length) * 100 : 0;

    const unmodifiedSuccessRate =
      unmodifiedWins.length + unmodifiedFails.length > 0
        ? (unmodifiedWins.length /
            (unmodifiedWins.length + unmodifiedFails.length)) *
          100
        : 0;

    // "Could've been modified to get the W" = losses where strategy_modification === false
    const couldHaveModifiedCount = unmodifiedFails.length;

    // Per ICT setup stats
    const setupMap = {};
    backtests.forEach((b) => {
      const key = b.ict_setup || "Unspecified";
      if (!setupMap[key]) {
        setupMap[key] = {
          ict_setup: key,
          total: 0,
          successful: 0,
          failed: 0,
          partial: 0,
          modifiedCount: 0,
          modifiedWins: 0,
        };
      }
      const item = setupMap[key];
      item.total += 1;
      if (b.outcome === "successful") item.successful += 1;
      else if (b.outcome === "failed") item.failed += 1;
      else if (b.outcome === "partial") item.partial += 1;

      if (b.strategy_modification) {
        item.modifiedCount += 1;
        if (b.outcome === "successful") item.modifiedWins += 1;
      }
    });

    const setupArray = Object.values(setupMap).map((s) => ({
      ...s,
      successRate: s.total ? (s.successful / s.total) * 100 : 0,
      modifiedWinRate: s.modifiedCount
        ? (s.modifiedWins / s.modifiedCount) * 100
        : 0,
    }));

    // Sort setups by total backtests desc
    setupArray.sort((a, b) => b.total - a.total);

    return {
      total,
      successes: successes.length,
      fails: fails.length,
      partials: partials.length,
      successRate,
      failRate,
      partialRate,
      modifiedCount,
      modifiedWins: modifiedWins.length,
      modifiedFails: modifiedFails.length,
      unmodifiedWins: unmodifiedWins.length,
      unmodifiedFails: unmodifiedFails.length,
      modifiedSuccessRate,
      unmodifiedSuccessRate,
      couldHaveModifiedCount,
      setupArray,
    };
  }, [backtests]);

  if (loading) return <p>Loading backtest analytics...</p>;
  if (!backtests.length)
    return <p>No backtests recorded yet. Add some in the Backtest Notes page first.</p>;

  const outcomePieData = [
    { name: "Successful", value: stats.successes, key: "successful" },
    { name: "Failed", value: stats.fails, key: "failed" },
    { name: "Partial", value: stats.partials, key: "partial" },
  ];

  const modificationBarData = [
    {
      label: "Modified",
      successful: stats.modifiedWins,
      failed: stats.modifiedFails,
    },
    {
      label: "Unmodified",
      successful: stats.unmodifiedWins,
      failed: stats.unmodifiedFails,
    },
  ];

  return (
    <div>
      <h2>Backtest Analytics (ICT Models)</h2>
      <p style={{ fontSize: "0.9rem", marginBottom: "10px" }}>
        This page analyzes your <strong>TradingView backtests</strong>: success / failure
        rates, how often the model needed modification, and which ICT setups are
        performing best.
      </p>

      {/* Summary cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.card}>
          <h4>Overall Results</h4>
          <p>Total Backtests: {stats.total}</p>
          <p>Successful: {stats.successes}</p>
          <p>Failed: {stats.fails}</p>
          <p>Partial: {stats.partials}</p>
          <p>Success Rate: {stats.successRate.toFixed(1)}%</p>
          <p>Fail Rate: {stats.failRate.toFixed(1)}%</p>
          <p>Partial Rate: {stats.partialRate.toFixed(1)}%</p>
        </div>

        <div style={styles.card}>
          <h4>Strategy Modifications</h4>
          <p>Backtests with modification: {stats.modifiedCount}</p>
          <p>Wins with modification: {stats.modifiedWins}</p>
          <p>Losses with modification: {stats.modifiedFails}</p>
          <p>
            Success rate when modified:{" "}
            {stats.modifiedSuccessRate.toFixed(1)}%
          </p>
          <p>
            Success rate when NOT modified:{" "}
            {stats.unmodifiedSuccessRate.toFixed(1)}%
          </p>
          <p style={{ fontSize: "0.8rem" }}>
            This tells you if applying tweaks to the core ICT model is actually
            improving performance or not.
          </p>
        </div>

        <div style={styles.card}>
          <h4>"Could've Been Modified" (Potential Tweaks)</h4>
          <p>
            Losses where no modification was applied:{" "}
            <strong>{stats.couldHaveModifiedCount}</strong>
          </p>
          <p style={{ fontSize: "0.85rem" }}>
            Each of these is a{" "}
            <strong>missed opportunity to refine your rules</strong>. Go back to
            those backtests and ask: “What rule or filter would have kept me out
            of this losing BB / ICT setup?”
          </p>
        </div>
      </div>

      {/* Charts row */}
      <div style={styles.chartRow}>
        <div style={styles.chartCard}>
          <h4>Outcome Distribution</h4>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={outcomePieData}
                dataKey="value"
                nameKey="name"
                label
                outerRadius={90}
              >
                {outcomePieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={OUTCOME_COLORS[entry.key] || "#9ca3af"}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h4>Modified vs Unmodified — Wins & Losses</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={modificationBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="successful" name="Successful" />
              <Bar dataKey="failed" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per strategy table */}
      <div style={styles.card}>
        <h4>Performance by ICT Strategy / Model</h4>
        <p style={{ fontSize: "0.85rem", marginBottom: "6px" }}>
          See how each model (e.g. BB, IFVG reversal, Liquidity sweep) performs
          in backtesting, plus how often you had to tweak it to get consistent wins.
        </p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>ICT Setup</th>
              <th>Total</th>
              <th>Successful</th>
              <th>Failed</th>
              <th>Partial</th>
              <th>Success Rate</th>
              <th># Modified</th>
              <th>Win Rate (Modified)</th>
            </tr>
          </thead>
          <tbody>
            {stats.setupArray.map((s) => (
              <tr key={s.ict_setup}>
                <td>{s.ict_setup}</td>
                <td>{s.total}</td>
                <td>{s.successful}</td>
                <td>{s.failed}</td>
                <td>{s.partial}</td>
                <td>{s.successRate.toFixed(1)}%</td>
                <td>{s.modifiedCount}</td>
                <td>
                  {s.modifiedCount
                    ? `${s.modifiedWinRate.toFixed(1)}%`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent backtests snapshot */}
      <div style={styles.card}>
        <h4>Recent Backtests (Last 10)</h4>
        <p style={{ fontSize: "0.8rem" }}>
          Quick view of your latest runs: date, time, setup, outcome, and whether
          you modified the strategy or not.
        </p>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Symbol</th>
              <th>Timeframe</th>
              <th>ICT Setup</th>
              <th>Outcome</th>
              <th>Modified?</th>
            </tr>
          </thead>
          <tbody>
            {backtests
              .slice()
              .reverse()
              .slice(0, 10)
              .map((b, idx) => (
                <tr key={idx}>
                  <td>{b.date || "-"}</td>
                  <td>{b.time || "-"}</td>
                  <td>{b.symbol || "-"}</td>
                  <td>{b.timeframe || "-"}</td>
                  <td>{b.ict_setup || "Unspecified"}</td>
                  <td
                    style={{
                      color:
                        b.outcome === "successful"
                          ? "green"
                          : b.outcome === "failed"
                          ? "red"
                          : "#f97316",
                    }}
                  >
                    {b.outcome}
                  </td>
                  <td>{b.strategy_modification ? "Yes" : "No"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: "10px", fontSize: "0.85rem" }}>
        🔍 Use this page in your weekly review to ask:
        <br />
        • “Is my BB / ICT model actually working in the data — or just in my head?”
        <br />
        • “When I tweak the rules, do the results objectively improve?”
      </p>
    </div>
  );
};

const styles = {
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  card: {
    padding: "12px",
    borderRadius: "8px",
    background: "white",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    fontSize: "0.9rem",
    marginBottom: "16px",
  },
  chartRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  chartCard: {
    padding: "12px",
    borderRadius: "8px",
    background: "white",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.85rem",
  },
};

export default BacktestAnalyticsPage;