// src/pages/AnalyticsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/axiosClient";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Brush,
} from "recharts";
import { useAuth } from "../context/AuthContext";

// ---------- helpers ----------
const COLORS_RESULT = {
  win: "#3b82f6", // blue
  loss: "#ef4444", // red
  breakeven: "#9ca3af", // gray
};

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  return `${sign}$${abs.toFixed(2)}`;
};

const formatCurrencyCompact = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  });
};

const formatDateKey = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const getDayOfWeek = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", { weekday: "short" }); // Mon, Tue...
};

const getDayKey = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getWeekKey = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const yyyy = d.getFullYear();
  const firstJan = new Date(yyyy, 0, 1);
  const days = Math.floor((d - firstJan) / (24 * 60 * 60 * 1000));
  const week = Math.floor((days + firstJan.getDay()) / 7) + 1;
  return `${yyyy}-W${week}`;
};

const getMonthKey = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
};

const getYearKey = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}`;
};

const gradeFromStats = (winRate, emotionalRate, totalPnL) => {
  const wr = winRate || 0;
  const er = emotionalRate || 0;
  const profitable = totalPnL > 0;

  if (wr >= 65 && er <= 20 && profitable) return "A";
  if (wr >= 55 && er <= 30 && profitable) return "B";
  if (wr >= 50 && er <= 40) return "C";
  if (wr >= 40) return "D";
  return "F";
};

const HELP_CONTENT = {
  overall: {
    title: "Overall Performance 📊",
    body: (
      <>
        <p>
          This card shows your big-picture stats for the current filter
          (Year/Month/Week/Day).
        </p>
        <ul style={{ paddingLeft: "18px", marginTop: 6 }}>
          <li>
            <strong>Win/Loss/Breakeven</strong> – based on trades with a final
            result.
          </li>
          <li>
            <strong>Total PnL</strong> – sum of all trade PnL in this period.
          </li>
          <li>
            <strong>Grade</strong> – mix of win rate, emotions, and whether
            you&apos;re actually profitable.
          </li>
        </ul>
      </>
    ),
  },
  psych: {
    title: "Psychology & Behavior 💭",
    body: (
      <>
        <p>
          This section tracks how much your feelings are sneaking into your
          trading.
        </p>
        <ul style={{ paddingLeft: "18px", marginTop: 6 }}>
          <li>
            <strong>Emotional trades</strong> – you flagged the trade as
            emotional.
          </li>
          <li>
            <strong>Took profit early</strong> – you bailed before target.
          </li>
          <li>
            <strong>Missed trades</strong> – setups you saw but didn&apos;t
            take.
          </li>
        </ul>
        <p style={{ marginTop: 6 }}>
          The lower these percentages are, the more in-control and consistent
          you are. 🚀
        </p>
      </>
    ),
  },
  ict: {
    title: "ICT Strategy Insights 📐",
    body: (
      <>
        <p>
          This area tells you which ICT setups you actually trade and how often
          they win.
        </p>
        <ul style={{ paddingLeft: "18px", marginTop: 6 }}>
          <li>
            <strong>Blue</strong> – Wins.
          </li>
          <li>
            <strong>Red</strong> – Losses.
          </li>
          <li>
            <strong>Gray</strong> – Breakeven (if shown).
          </li>
        </ul>
        <p style={{ marginTop: 6 }}>
          Use this to double-down on the entries that respect your model and
          actually pay you.
        </p>
      </>
    ),
  },
  weeklyPnL: {
    title: "Weekly PnL (Blue = Up, Red = Down)",
    body: (
      <>
        <p>
          Each bar is one week of trading. It sums all your trade PnL inside
          that week.
        </p>
        <ul style={{ paddingLeft: "18px", marginTop: 6 }}>
          <li>
            <span style={{ color: "#3b82f6", fontWeight: 600 }}>Blue bar</span>{" "}
            – net profitable week (PnL &gt; 0).
          </li>
          <li>
            <span style={{ color: "#ef4444", fontWeight: 600 }}>Red bar</span> –
            net losing week (PnL &lt; 0).
          </li>
        </ul>
        <p style={{ marginTop: 6 }}>
          Drag the scrollbar under the chart to zoom into specific weeks.
        </p>
      </>
    ),
  },
  equity: {
    title: "Equity Curve (Cumulative PnL) 📈",
    body: (
      <>
        <p>
          Shows how your account equity would move if you added up every
          trade&apos;s PnL over time.
        </p>
        <p style={{ marginTop: 6 }}>
          If the line trends up → your overall model is printing. If it
          flattens or bleeds down → time to review risk and setups.
        </p>
      </>
    ),
  },
  plByTf: {
    title: "P/L by Timeframe ⏱️",
    body: (
      <>
        <p>
          Use these tabs (Yearly / Monthly / Weekly / Daily) to slice your
          performance.
        </p>
        <ul style={{ paddingLeft: "18px", marginTop: 6 }}>
          <li>Click a row to see a breakdown above.</li>
          <li>
            Use it like a zoom: Yearly → click a year to see its months →
            click a month to see weeks → click a week to see days.
          </li>
        </ul>
      </>
    ),
  },
};

// ---------- main component ----------
const AnalyticsPage = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openHelp, setOpenHelp] = useState(null);
  const { user } = useAuth(); // <-- this gives you the logged-in user
  const [tfView, setTfView] = useState("monthly"); // yearly | monthly | weekly | daily
  const [selectedBucketKey, setSelectedBucketKey] = useState(null);
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  useEffect(() => {
    const fetchTrades = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/trades?username=${user}`);
        setTrades(res.data || []);
      } catch (err) {
        console.error("Failed to load trades", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrades();
  }, [user]);

  // normalize trades
  const normalizedTrades = useMemo(() => {
    if (!trades.length) return [];
    return trades
      .map((t) => {
        const dateObj = t.date ? new Date(t.date) : null;
        const numericPnL = Number(t.pnl);
        return {
          ...t,
          numericPnL: isNaN(numericPnL) ? 0 : numericPnL,
          _dateObj: dateObj,
          _dayKey: getDayKey(t.date),
          _weekKey: getWeekKey(t.date),
          _monthKey: getMonthKey(t.date),
          _yearKey: getYearKey(t.date),
        };
      })
      .filter((t) => t._dateObj instanceof Date && !isNaN(t._dateObj))
      .sort((a, b) => a._dateObj - b._dateObj); // oldest → newest for charts
  }, [trades]);

  // Overall stats (entire dataset)
  const overallStats = useMemo(() => {
    if (!normalizedTrades.length) return null;

    const finished = normalizedTrades.filter((t) =>
      ["win", "loss", "breakeven"].includes(t.result)
    );
    const wins = finished.filter((t) => t.result === "win");
    const losses = finished.filter((t) => t.result === "loss");
    const breakeven = finished.filter((t) => t.result === "breakeven");

    const totalPnL = finished.reduce(
      (sum, t) => sum + (t.numericPnL || 0),
      0
    );
    const emotionalTrades = finished.filter((t) => t.emotional_trade);
    const earlyTP = finished.filter((t) => t.took_profit_early);
    const missedTrades = normalizedTrades.filter((t) => t.missed_trade);

    const winRate = finished.length ? (wins.length / finished.length) * 100 : 0;
    const lossRate = finished.length
      ? (losses.length / finished.length) * 100
      : 0;
    const breakevenRate = finished.length
      ? (breakeven.length / finished.length) * 100
      : 0;
    const emotionalRate = finished.length
      ? (emotionalTrades.length / finished.length) * 100
      : 0;
    const earlyTPRate = finished.length
      ? (earlyTP.length / finished.length) * 100
      : 0;
    const missedRate = normalizedTrades.length
      ? (missedTrades.length / normalizedTrades.length) * 100
      : 0;

    const grade = gradeFromStats(winRate, emotionalRate, totalPnL);

    return {
      totalTrades: normalizedTrades.length,
      finishedTrades: finished.length,
      wins: wins.length,
      losses: losses.length,
      breakeven: breakeven.length,
      winRate,
      lossRate,
      breakevenRate,
      totalPnL,
      emotionalCount: emotionalTrades.length,
      emotionalRate,
      earlyTPCount: earlyTP.length,
      earlyTPRate,
      missedTradesCount: missedTrades.length,
      missedRate,
      grade,
      profitable: totalPnL > 0,
    };
  }, [normalizedTrades]);

  // group by week for Weekly PnL chart
  const weeklyPnLData = useMemo(() => {
    const map = {};
    normalizedTrades.forEach((t) => {
      const wk = t._weekKey;
      if (!wk) return;
      if (!map[wk]) {
        map[wk] = { weekKey: wk, pnl: 0 };
      }
      map[wk].pnl += t.numericPnL || 0;
    });
    return Object.values(map).sort((a, b) => a.weekKey.localeCompare(b.weekKey));
  }, [normalizedTrades]);

  // equity curve (daily cumulative PnL)
  const equityCurveData = useMemo(() => {
    const dayMap = {};
    normalizedTrades.forEach((t) => {
      if (!t._dayKey) return;
      if (!dayMap[t._dayKey]) {
        dayMap[t._dayKey] = 0;
      }
      dayMap[t._dayKey] += t.numericPnL || 0;
    });
    const orderedKeys = Object.keys(dayMap).sort();
    let running = 0;
    return orderedKeys.map((dayKey) => {
      running += dayMap[dayKey];
      return {
        dayKey,
        label: formatDateKey(dayKey),
        cumulativePnL: running,
      };
    });
  }, [normalizedTrades]);

  // ICT setup stats
  const ictWinRateData = useMemo(() => {
    const map = {};
    normalizedTrades.forEach((t) => {
      if (!t.ict_setup) return;
      if (!map[t.ict_setup]) {
        map[t.ict_setup] = {
          setup: t.ict_setup,
          wins: 0,
          losses: 0,
          breakeven: 0,
          total: 0,
        };
      }
      map[t.ict_setup].total += 1;
      if (t.result === "win") map[t.ict_setup].wins += 1;
      else if (t.result === "loss") map[t.ict_setup].losses += 1;
      else if (t.result === "breakeven") map[t.ict_setup].breakeven += 1;
    });

    return Object.values(map)
      .map((row) => ({
        ...row,
        winRate: row.total ? (row.wins / row.total) * 100 : 0,
        lossRate: row.total ? (row.losses / row.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [normalizedTrades]);

  // simple counts for ICT flags (ifvg_used, ob_used, etc.)
  const ictFlagStats = useMemo(() => {
    if (!normalizedTrades.length) return null;
    const total = normalizedTrades.length;
    const ifvg = normalizedTrades.filter((t) => t.ifvg_used).length;
    const ob = normalizedTrades.filter((t) => t.ob_used).length;
    const ls = normalizedTrades.filter((t) => t.liquidity_sweep_used).length;
    return {
      total,
      ifvg,
      ob,
      ls,
      ifvgRate: (ifvg / total) * 100,
      obRate: (ob / total) * 100,
      lsRate: (ls / total) * 100,
    };
  }, [normalizedTrades]);

  // generic aggregator for timeframe view
  const tfBuckets = useMemo(() => {
    const map = {};
    const keyGetter =
      tfView === "yearly"
        ? (t) => t._yearKey
        : tfView === "monthly"
        ? (t) => t._monthKey
        : tfView === "weekly"
        ? (t) => t._weekKey
        : (t) => t._dayKey;

    normalizedTrades.forEach((t) => {
      const key = keyGetter(t);
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          key,
          trades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          pnl: 0,
        };
      }
      map[key].trades += 1;
      if (t.result === "win") map[key].wins += 1;
      else if (t.result === "loss") map[key].losses += 1;
      else if (t.result === "breakeven") map[key].breakeven += 1;

      map[key].pnl += t.numericPnL || 0;
    });

    let arr = Object.values(map);
    arr.sort((a, b) => a.key.localeCompare(b.key)); // ascending for charts

    // create display labels
    arr = arr.map((row) => {
      let label = row.key;
      if (tfView === "daily") {
        label = formatDateKey(row.key);
      } else if (tfView === "monthly") {
        const [y, m] = row.key.split("-");
        label = `${m}/${y}`;
      } else if (tfView === "yearly") {
        label = row.key;
      } else if (tfView === "weekly") {
        label = row.key;
      }
      return { ...row, label };
    });

    return arr;
  }, [normalizedTrades, tfView]);

  // selected bucket stats & daily table (for drill-down)
  const selectedBucket = useMemo(() => {
    if (!selectedBucketKey || !tfBuckets.length) return null;
    return tfBuckets.find((b) => b.key === selectedBucketKey) || null;
  }, [selectedBucketKey, tfBuckets]);

  const last14Days = useMemo(() => {
    // daily breakdown – last 14 days with trades
    const dayMap = {};
    normalizedTrades.forEach((t) => {
      if (!t._dayKey) return;
      if (!dayMap[t._dayKey]) {
        dayMap[t._dayKey] = {
          key: t._dayKey,
          trades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          pnl: 0,
        };
      }
      const bucket = dayMap[t._dayKey];
      bucket.trades += 1;
      if (t.result === "win") bucket.wins += 1;
      else if (t.result === "loss") bucket.losses += 1;
      else if (t.result === "breakeven") bucket.breakeven += 1;
      bucket.pnl += t.numericPnL || 0;
    });

    const arr = Object.values(dayMap).sort((a, b) =>
      a.key.localeCompare(b.key)
    );
    const last14 = arr.slice(-14).reverse(); // newest → oldest for table
    return last14.map((row) => ({
      ...row,
      label: formatDateKey(row.key),
      dow: getDayOfWeek(row.key),
    }));
  }, [normalizedTrades]);

  const dayTrades = useMemo(() => {
    if (!selectedDayKey) return [];
    return normalizedTrades
      .filter((t) => t._dayKey === selectedDayKey)
      .sort((a, b) => b._dateObj - a._dateObj); // newest first in that day
  }, [normalizedTrades, selectedDayKey]);

  if (loading) return <p>Loading analytics...</p>;
  if (!normalizedTrades.length) return <p>No trades yet. Submit some first.</p>;

  const pieData = [
    { name: "Wins", value: overallStats.wins },
    { name: "Losses", value: overallStats.losses },
    { name: "Breakeven", value: overallStats.breakeven },
  ];

  const handleBucketClick = (bucketKey) => {
    setSelectedBucketKey(bucketKey);
  };

  const handleDayRowClick = (dayKey) => {
    setSelectedDayKey(dayKey);
    // scroll to top where charts are
    const topElement = document.getElementById("analytics-top");
    // if (topElement) {
    //   topElement.scrollIntoView({ behavior: "smooth", block: "start" });
    // }
  };

  const currentTfLabel =
    tfView === "yearly"
      ? "Yearly"
      : tfView === "monthly"
      ? "Monthly"
      : tfView === "weekly"
      ? "Weekly"
      : "Daily";

  // ---------- JSX ----------
  return (
    <div style={styles.page}>
      {/* floating help card */}
      {openHelp && (
        <div style={styles.helpOverlay} onClick={() => setOpenHelp(null)}>
          <div
            style={styles.helpCard}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ marginBottom: 6 }}>
              {HELP_CONTENT[openHelp]?.title}
            </h4>
            <div style={{ fontSize: "0.85rem", lineHeight: 1.4 }}>
              {HELP_CONTENT[openHelp]?.body}
            </div>
            <button
              type="button"
              style={styles.helpCloseBtn}
              onClick={() => setOpenHelp(null)}
            >
              Got it 👍
            </button>
          </div>
        </div>
      )}

      <div id="analytics-top" />

      {/* SUMMARY CARDS */}
      <section style={styles.summaryGrid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Overall Performance 📊</h3>
            <button
              type="button"
              style={styles.infoIcon}
              onClick={() => setOpenHelp("overall")}
            >
              ?
            </button>
          </div>
          <div style={styles.cardBody}>
            <div style={styles.badgeRow}>
              <span style={styles.badge}>{overallStats.profitable ? "✅ Profitable" : "📉 Not Profitable"}</span>
              <span style={styles.badge}>Grade: {overallStats.grade}</span>
            </div>
            <p style={styles.metricLine}>
              <strong>Total Trades:</strong> {overallStats.totalTrades}
            </p>
            <p style={styles.metricLine}>
              <strong>Finished Trades:</strong> {overallStats.finishedTrades}
            </p>
            <p style={styles.metricLine}>
              <strong>Wins:</strong> {overallStats.wins} (
              {overallStats.winRate.toFixed(1)}%)
            </p>
            <p style={styles.metricLine}>
              <strong>Losses:</strong> {overallStats.losses} (
              {overallStats.lossRate.toFixed(1)}%)
            </p>
            <p style={styles.metricLine}>
              <strong>Breakeven:</strong> {overallStats.breakeven} (
              {overallStats.breakevenRate.toFixed(1)}%)
            </p>
            <p style={styles.metricLine}>
              <strong>Total PnL:</strong>{" "}
              <span
                style={{
                  fontWeight: 700,
                  color: overallStats.totalPnL >= 0 ? "#22c55e" : "#ef4444",
                }}
              >
                {formatCurrency(overallStats.totalPnL)}
              </span>
            </p>
            <p style={{ fontSize: "0.8rem", marginTop: 6 }}>
              <span role="img" aria-label="sparkles">
                ✨
              </span>{" "}
              Aim for higher win-rate + lower emotional trades while staying
              net-profitable.
            </p>
          </div>
        </div>

        {/* Psychology */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>Psychology &amp; Behavior 💭</h3>
            <button
              type="button"
              style={styles.infoIcon}
              onClick={() => setOpenHelp("psych")}
            >
              ?
            </button>
          </div>
          <div style={styles.cardBody}>
            <p style={styles.metricLine}>
              <strong>Emotional Trades:</strong> {overallStats.emotionalCount} (
              {overallStats.emotionalRate.toFixed(1)}%)
            </p>
            <p style={styles.metricLine}>
              <strong>Took Profit Early:</strong> {overallStats.earlyTPCount} (
              {overallStats.earlyTPRate.toFixed(1)}%)
            </p>
            <p style={styles.metricLine}>
              <strong>Missed Trades:</strong> {overallStats.missedTradesCount} (
              {overallStats.missedRate.toFixed(1)}%)
            </p>
            <p style={{ fontSize: "0.8rem", marginTop: 6 }}>
              👀 <strong>Key focus:</strong>{" "}
              {overallStats.emotionalRate > 30
                ? "Too much emotion in the seat — tighten rules & journaling."
                : overallStats.earlyTPRate > 25
                ? "You’re getting paid but cutting winners early. Work on letting targets hit."
                : overallStats.missedRate > 20
                ? "Lots of missed plays. Review alerting, schedule, and hesitation."
                : "Nice! Emotions are somewhat under control. Keep refining entries, not chasing."}
            </p>
          </div>
        </div>

        {/* ICT setup summary */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>ICT Strategy Insights 📐</h3>
            <button
              type="button"
              style={styles.infoIcon}
              onClick={() => setOpenHelp("ict")}
            >
              ?
            </button>
          </div>
          <div style={styles.cardBody}>
            {ictFlagStats && (
              <>
                <p style={styles.metricLine}>
                  <strong>IFVG trades:</strong> {ictFlagStats.ifvg} (
                  {ictFlagStats.ifvgRate.toFixed(1)}%)
                </p>
                <p style={styles.metricLine}>
                  <strong>OB-based trades:</strong> {ictFlagStats.ob} (
                  {ictFlagStats.obRate.toFixed(1)}%)
                </p>
                <p style={styles.metricLine}>
                  <strong>Liquidity Sweep used:</strong> {ictFlagStats.ls} (
                  {ictFlagStats.lsRate.toFixed(1)}%)
                </p>
              </>
            )}
            <p style={{ fontSize: "0.8rem", marginTop: 6 }}>
              Below you’ll see <strong>win-rate per ICT setup</strong> so you
              can double-down on your best models and kill the weak ones. 🎯
            </p>
          </div>
        </div>
      </section>

      {/* PIE + EQUITY CURVE */}
      <section style={styles.section}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Win / Loss Distribution 🥧</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                label
                outerRadius={90}
              >
                {pieData.map((entry, index) => {
                  const key = entry.name.toLowerCase();
                  const color =
                    key === "wins"
                      ? COLORS_RESULT.win
                      : key === "losses"
                      ? COLORS_RESULT.loss
                      : COLORS_RESULT.breakeven;
                  return <Cell key={entry.name} fill={color} />;
                })}
              </Pie>
              <RTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <h3 style={styles.chartTitle}>Equity Curve (Cumulative PnL) 📈</h3>
            <button
              type="button"
              style={styles.infoIcon}
              onClick={() => setOpenHelp("equity")}
            >
              ?
            </button>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={equityCurveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis
                tickFormatter={formatCurrencyCompact}
                width={70}
              />
              <RTooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="cumulativePnL"
                name="Cumulative PnL"
                stroke="#3b82f6"
                dot={{ r: 2 }}
              />
              <Brush dataKey="label" height={18} stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* WEEKLY PNL */}
      <section style={styles.section}>
        <div style={styles.chartCardWide}>
          <div style={styles.cardHeader}>
            <h3 style={styles.chartTitle}>
              Weekly PnL (Blue = Up, Red = Down)
            </h3>
            <button
              type="button"
              style={styles.infoIcon}
              onClick={() => setOpenHelp("weeklyPnL")}
            >
              ?
            </button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyPnLData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="weekKey" />
              <YAxis tickFormatter={formatCurrencyCompact} />
              <RTooltip
                formatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => `Week: ${label}`}
              />
              <Legend formatter={() => "PnL"} />
              <Bar dataKey="pnl" name="PnL">
                {weeklyPnLData.map((row, idx) => (
                  <Cell
                    key={row.weekKey}
                    fill={row.pnl >= 0 ? COLORS_RESULT.win : COLORS_RESULT.loss}
                  />
                ))}
              </Bar>
              <Brush dataKey="weekKey" height={18} stroke="#6b7280" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ICT setup win-rate chart */}
      {ictWinRateData.length > 0 && (
        <section style={styles.section}>
          <div style={styles.chartCardWide}>
            <h3 style={styles.chartTitle}>Win-Rate per ICT Setup</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={ictWinRateData}
                layout="vertical"
                margin={{ left: 80 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="setup"
                  width={150}
                />
                <RTooltip
                  formatter={(value, name) =>
                    name === "winRate" || name === "lossRate"
                      ? `${value.toFixed(1)}%`
                      : value
                  }
                />
                <Legend
                  formatter={(value) =>
                    value === "winRate" ? "Win %" : "Loss %"
                  }
                />
                <Bar
                  dataKey="winRate"
                  name="winRate"
                  stackId="a"
                  fill={COLORS_RESULT.win}
                />
                <Bar
                  dataKey="lossRate"
                  name="lossRate"
                  stackId="a"
                  fill={COLORS_RESULT.loss}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* P/L by timeframe + drilldown */}
      <section style={styles.section}>
        <div style={styles.cardFull}>
          <div style={styles.cardHeader}>
            <h3 style={styles.chartTitle}>
              P/L by Timeframe ⏱️ ({currentTfLabel})
            </h3>
            <button
              type="button"
              style={styles.infoIcon}
              onClick={() => setOpenHelp("plByTf")}
            >
              ?
            </button>
          </div>

          {/* timeframe tabs */}
          <div style={styles.tabRow}>
            {["yearly", "monthly", "weekly", "daily"].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => {
                  setTfView(tf);
                  setSelectedBucketKey(null);
                }}
                style={{
                  ...styles.tabBtn,
                  ...(tfView === tf ? styles.tabBtnActive : {}),
                }}
              >
                {tf === "yearly"
                  ? "Yearly"
                  : tf === "monthly"
                  ? "Monthly"
                  : tf === "weekly"
                  ? "Weekly"
                  : "Daily"}
              </button>
            ))}
          </div>

          {/* chart for selected tf buckets */}
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={tfBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={formatCurrencyCompact} />
                <RTooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => label}
                />
                <Legend formatter={() => "PnL"} />
                <Bar
                  dataKey="pnl"
                  name="PnL"
                  onClick={(_, idx) =>
                    handleBucketClick(tfBuckets[idx].key)
                  }
                  cursor="pointer"
                >
                  {tfBuckets.map((row) => (
                    <Cell
                      key={row.key}
                      fill={
                        row.pnl >= 0 ? COLORS_RESULT.win : COLORS_RESULT.loss
                      }
                    />
                  ))}
                </Bar>
                <Brush dataKey="label" height={18} stroke="#6b7280" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* selected bucket summary */}
          {selectedBucket && (
            <div style={styles.bucketDetails}>
              <h4 style={{ marginBottom: 4 }}>
                {currentTfLabel} Snapshot:{" "}
                <span style={{ fontWeight: 600 }}>{selectedBucket.label}</span>
              </h4>
              <p style={styles.metricLine}>
                Trades: {selectedBucket.trades} | Wins: {selectedBucket.wins} |
                Losses: {selectedBucket.losses} | Breakeven:{" "}
                {selectedBucket.breakeven}
              </p>
              <p style={styles.metricLine}>
                PnL:{" "}
                <span
                  style={{
                    fontWeight: 700,
                    color:
                      selectedBucket.pnl >= 0 ? "#22c55e" : "#ef4444",
                  }}
                >
                  {formatCurrency(selectedBucket.pnl)}
                </span>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* DAILY BREAKDOWN last 14 days */}
      <section style={styles.section}>
        <div style={styles.cardFull}>
          <div style={styles.cardHeader}>
            <h3 style={styles.chartTitle}>Last 14 Days (Daily Breakdown)</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th># Trades</th>
                  <th>Wins</th>
                  <th>Losses</th>
                  <th>PnL</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {last14Days.map((d) => (
                  <tr key={d.key}>
                    <td>{d.label}</td>
                    <td>{d.dow}</td>
                    <td>{d.trades}</td>
                    <td>{d.wins}</td>
                    <td>{d.losses}</td>
                    <td
                      style={{
                        color: d.pnl >= 0 ? "#22c55e" : "#ef4444",
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(d.pnl)}
                    </td>
                    <td>
                      <button
                        type="button"
                        style={styles.smallLinkBtn}
                        onClick={() => handleDayRowClick(d.key)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* day trade details */}
          {selectedDayKey && (
            <div style={styles.dayDetails}>
              <h4 style={{ marginBottom: 4 }}>
                Trades for {formatDateKey(selectedDayKey)} (
                {getDayOfWeek(selectedDayKey)})
              </h4>
              {dayTrades.map((t) => {
                const isWin = t.result === "win";
                const isLoss = t.result === "loss";
                const badgeColor = isWin
                  ? "#dcfce7"
                  : isLoss
                  ? "#fee2e2"
                  : "#e5e7eb";
                const badgeTextColor = isWin
                  ? "#166534"
                  : isLoss
                  ? "#b91c1c"
                  : "#374151";

                return (
                  <div key={t.id} style={styles.tradeCard}>
                    <div style={styles.tradeCardHeader}>
                      <div>
                        <span style={styles.tradeSymbol}>{t.symbol}</span>
                        <span style={styles.tradeDir}>
                          {t.direction?.toUpperCase()}
                        </span>
                      </div>
                      <span
                        style={{
                          ...styles.resultBadge,
                          backgroundColor: badgeColor,
                          color: badgeTextColor,
                        }}
                      >
                        {t.result?.toUpperCase()} — {formatCurrency(t.numericPnL)}
                      </span>
                    </div>
                    <div style={styles.tradeMetaRow}>
                      <span>
                        ⏰ {t.time} — TF: {t.timeframe} — Session: {t.session}
                      </span>
                    </div>
                    <div style={styles.tradeMetaRow}>
                      <span>
                        Entry: {t.entry_price} | Exit: {t.exit_price}
                      </span>
                    </div>
                    <div style={styles.tradeMetaRow}>
                      <span>
                        ICT Setup:{" "}
                        <strong>{t.ict_setup || "Not specified"}</strong>
                      </span>
                    </div>
                    <div style={styles.tradeMetaRow}>
                      <span>
                        Emotions: pre <em>{t.pre_trade_emotion}</em> → post{" "}
                        <em>{t.post_trade_emotion}</em> | Grade:{" "}
                        <strong>{t.trade_grade}</strong>
                      </span>
                    </div>
                    {t.notes && (
                      <p style={styles.tradeNotes}>
                        🧠 Notes: <span>{t.notes}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <p style={styles.footerNote}>
        🗓️ Use this page every weekend to ask:{" "}
        <em>
          &quot;Did I follow my ICT plan? Where did emotions sneak in? Which
          setups actually pay me?&quot;
        </em>{" "}
        Then adjust one small thing for the next week.
      </p>
    </div>
  );
};

// ---------- styles ----------
const styles = {
  page: {
    padding: "10px",
    maxWidth: "100%",
    margin: "0 auto 40px",
    fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  },
  section: {
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 10,
    marginBottom: 10,
  },
  card: {
    background: "white",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 1px 4px rgba(15,23,42,0.07)",
    fontSize: "0.9rem",
  },
  cardFull: {
    background: "white",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 1px 4px rgba(15,23,42,0.07)",
    fontSize: "0.9rem",
    width: "100%",
  },
  chartCard: {
    background: "white",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 1px 4px rgba(15,23,42,0.07)",
    flex: 1,
  },
  chartCardWide: {
    background: "white",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 1px 4px rgba(15,23,42,0.07)",
    width: "100%",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  cardTitle: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 600,
  },
  chartTitle: {
    margin: 0,
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  cardBody: {
    marginTop: 4,
  },
  badgeRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 6,
  },
  badge: {
    fontSize: "0.75rem",
    padding: "2px 6px",
    borderRadius: 999,
    background: "#f1f5f9",
  },
  metricLine: {
    margin: "2px 0",
  },
  chartCardRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 10,
  },
  tabRow: {
    display: "flex",
    gap: 6,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  tabBtn: {
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    padding: "4px 10px",
    fontSize: "0.8rem",
    background: "#f9fafb",
    cursor: "pointer",
  },
  tabBtnActive: {
    background: "#3b82f6",
    color: "white",
    borderColor: "#2563eb",
  },
  bucketDetails: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    background: "#f9fafb",
    fontSize: "0.85rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.8rem",
  },
  dayDetails: {
    marginTop: 10,
  },
  tradeCard: {
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    padding: 8,
    marginTop: 6,
    background: "#f9fafb",
  },
  tradeCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tradeSymbol: {
    fontWeight: 700,
    marginRight: 6,
  },
  tradeDir: {
    fontSize: "0.75rem",
    padding: "2px 6px",
    borderRadius: 999,
    background: "#e0f2fe",
    color: "#0369a1",
  },
  resultBadge: {
    fontSize: "0.75rem",
    padding: "2px 6px",
    borderRadius: 999,
  },
  tradeMetaRow: {
    marginTop: 2,
    fontSize: "0.78rem",
    color: "#4b5563",
  },
  tradeNotes: {
    marginTop: 4,
    fontSize: "0.78rem",
    color: "#111827",
  },
  smallLinkBtn: {
    border: "none",
    background: "none",
    color: "#2563eb",
    textDecoration: "underline",
    fontSize: "0.78rem",
    cursor: "pointer",
  },
  infoIcon: {
    width: 18,
    height: 18,
    borderRadius: "999px",
    border: "1px solid #cbd5f5",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    background: "#eff6ff",
    color: "#1d4ed8",
    cursor: "pointer",
  },
  helpOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: "0 12px",
  },
  helpCard: {
    background: "white",
    borderRadius: 12,
    padding: 14,
    maxWidth: 360,
    width: "100%",
    boxShadow: "0 10px 25px rgba(15,23,42,0.35)",
  },
  helpCloseBtn: {
    marginTop: 8,
    width: "100%",
    padding: "6px 0",
    borderRadius: 999,
    border: "none",
    background: "#3b82f6",
    color: "white",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  footerNote: {
    marginTop: 20,
    fontSize: "0.8rem",
    color: "#4b5563",
  },
  horizontalScroll: {
    overflowX: "auto",
    overflowY: "hidden",
    WebkitOverflowScrolling: "touch",
    overscrollBehaviorX: "contain",
  },
};

export default AnalyticsPage;