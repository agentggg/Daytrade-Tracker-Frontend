// src/pages/TradeFormPage.jsx
import React, { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";

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
  "None / Not specified",
  "OB + FVG continuation",
  "OB + Displacement + Retracement",
  "IFVG reversal after MSS",
  "FVG continuation in HTF bias",
  "Liquidity sweep into OB",
  "Breaker Block reversal",
  "Mitigation Block continuation",
  "Killzone (NYO / LDN) scalp",
];

const TICK_OPTIONS = [
  {
    label: "Nasdaq-100 (NQ) — Standard NQ: $20 per point",
    value: "20",
    code: "NQ",
  },
  {
    label: "Micro Nasdaq-100 (MNQ) — Micro MNQ: $2 per point",
    value: "2",
    code: "MNQ",
  },
  {
    label: "S&P 500 (ES) — Standard ES: $50 per point",
    value: "50",
    code: "ES",
  },
  {
    label: "Micro S&P 500 (MES) — Micro MES: $5 per point",
    value: "5",
    code: "MES",
  },
  {
    label: "Gold (GC) — Standard GC: $100 per point",
    value: "100",
    code: "GC",
  },
  {
    label: "Micro Gold (MGC) — Micro MGC: $10 per point",
    value: "10",
    code: "MGC",
  },
];

const FIELD_DEFS = {
  date: {
    label: "Date",
    casual:
      "The trading day this trade happened. Basically the calendar date on your chart.",
    formal:
      "The calendar date on which the trade was executed, based on your broker or platform time.",
  },
  time: {
    label: "Time",
    casual:
      "The time you actually entered the trade. Think: candle you pulled the trigger on.",
    formal:
      "The approximate execution time of the trade entry, typically aligned to the opening time of the entry candle.",
  },
  symbol: {
    label: "Symbol",
    casual: "What you’re trading: MNQ, NQ, ES, NAS100, etc.",
    formal:
      "The instrument or market symbol being traded (e.g., MNQ, NQ, ES, MES, GC, EURUSD).",
  },
  direction: {
    label: "Direction",
    casual: "Did you go long (buy) or short (sell)?",
    formal:
      "The trade direction: long (buy to profit from rising prices) or short (sell to profit from falling prices).",
  },
  session: {
    label: "Session",
    casual: "Which session was it? Asia, London, or New York.",
    formal:
      "The primary trading session during which the trade was executed (e.g., Asian, London, or New York session).",
  },
  timeframe: {
    label: "Timeframe",
    casual: "Chart timeframe you used for the setup/entry (like 1m, 5m).",
    formal:
      "The chart timeframe used for trade execution or primary setup context (e.g., 1 minute, 5 minutes, 15 minutes).",
  },
  risk_percent: {
    label: "Risk %",
    casual:
      "How much of your account you risked on this trade, in percent. Most people stick to 0.5–1%.",
    formal:
      "The percentage of total account equity risked on this trade (Risk Amount ÷ Account Balance × 100).",
  },
  entry_price: {
    label: "Entry Price",
    casual: "The price where you actually got filled.",
    formal:
      "The price at which the position was opened or the average entry price if scaled in.",
  },
  stop_price: {
    label: "Stop Loss Price",
    casual: "Where your account taps out if you’re wrong for that level.",
    formal:
      "The price level at which the position is automatically exited to limit losses.",
  },
  stop_reason: {
    label: "Stop Loss Reason",
    casual: "Why you parked your stop there (below OB, under swing low, etc.).",
    formal:
      "The rationale behind choosing that specific stop loss level (e.g., below a structural low, below an order block, or under a liquidity pool).",
  },
  tp_price: {
    label: "Take Profit Price",
    casual: "Your money target for that level.",
    formal:
      "The price level at which profits are realized by closing part or all of the position.",
  },
  tp_reason: {
    label: "Take Profit Reason",
    casual: "Why that target made sense (e.g., old high, FVG edge).",
    formal:
      "The rationale behind choosing that specific take profit level (e.g., prior high/low, HTF fair value gap, or liquidity pool target).",
  },
  exit_price: {
    label: "Exit Price",
    casual:
      "The actual price where the trade closed. Should match a SL or TP level.",
    formal:
      "The final execution price where the trade was closed, either due to stop loss, take profit, or manual exit.",
  },
  pnl: {
    label: "PnL ($)",
    casual: "How much you made or lost in dollars for this trade.",
    formal:
      "The profit or loss from this trade in currency units (e.g., USD).",
  },
  r_multiple: {
    label: "R-Multiple",
    casual:
      "How many ‘R’ you made. 1R = your initial risk. So +2R = double your risk reward.",
    formal: "The trade result expressed in multiples of the initial risk.",
  },
  ict_setup: {
    label: "ICT Setup",
    casual: "Which ICT idea you were actually trading (BB, IFVG, OB+FVG, etc.).",
    formal:
      "The primary ICT-based model or setup governing the trade (e.g., Breaker Block model, IFVG reversal, liquidity sweep into OB).",
  },
  higher_tf_bias: {
    label: "Higher Timeframe Bias",
    casual:
      "What the bigger picture was doing (e.g., bearish on 4H, bullish on 1H).",
    formal:
      "The directional bias derived from higher timeframe structure and context, guiding the trade direction.",
  },
  pre_trade_emotion: {
    label: "Pre-trade Emotion",
    casual: "How you felt right before you clicked buy/sell.",
    formal:
      "The dominant emotional state before trade execution (e.g., calm, fearful, greedy, revengeful).",
  },
  post_trade_emotion: {
    label: "Post-trade Emotion",
    casual: "How you felt right after the trade closed.",
    formal:
      "The dominant emotional state after the trade outcome was realized (e.g., satisfied, regretful, tilted, neutral).",
  },
  trade_grade: {
    label: "Trade Grade",
    casual:
      "How you score the trade quality (not the result) — A+ means you followed plan and rules cleanly.",
    formal:
      "A qualitative rating of how well the trade followed the trading plan and rules, independent of PnL.",
  },
  notes: {
    label: "Notes",
    casual:
      "Dump your brain here: ICT logic, what you saw, what you’d change next time.",
    formal:
      "A detailed narrative capturing trade context, reasoning, ICT concepts applied, execution notes, and post-trade reflections.",
  },
  account_balance: {
    label: "Account Balance",
    casual: "Your account size so we can figure out what % you actually risked.",
    formal:
      "Total live or evaluation account equity at the time of the trade, used to compute risk percentage.",
  },
  contracts: {
    label: "Contracts",
    casual: "How many contracts you traded (1 MNQ, 2 MES, etc.).",
    formal:
      "The number of futures contracts (or equivalent position size units) used in the trade.",
  },
  tick_value: {
    label: "Tick Value ($ per point)",
    casual:
      "How much each point move is worth in dollars for whatever you’re trading (MNQ, ES, GC, etc.).",
    formal:
      "The monetary value per full point of price movement for the selected instrument (e.g., $2 per point for MNQ).",
  },
};

const initialForm = {
  date: "",
  time: "",
  symbol: "",
  direction: "long",
  session: "",
  timeframe: "1m",
  risk_percent: "",
  entry_price: "",
  exit_price: "",
  result: "pending",
  pnl: "",
  r_multiple: "",
  ict_setup: "None / Not specified",
  higher_tf_bias: "1H",
  ifvg_used: false,
  ob_used: false,
  breaker_used: false,
  liquidity_sweep_used: false,
  mitigation_block_used: false,
  // psychology / behavior
  pre_trade_emotion: "",
  post_trade_emotion: "",
  trade_grade: "",
  followed_plan: true,
  emotional_trade: false,
  took_profit_early: false,
  missed_trade: false,
  moved_stop_loss: false,
  moved_take_profit: false,
  revenge_trade: false,
  notes: "",
  // multi-level stops / TPs
  stop_levels: [{ price: "", reason: "" }],
  take_profit_levels: [{ price: "", reason: "" }],
};

// ---- PnL helper (hoisted & reusable) ----
function computePnl({ entry_price, exit_price, direction }, riskHelper) {
  const entry = parseFloat(entry_price);
  const exit = parseFloat(exit_price);
  const contracts = parseFloat(riskHelper.contracts);
  const tick = parseFloat(riskHelper.tick_value || "0");

  if (
    isNaN(entry) ||
    isNaN(exit) ||
    isNaN(contracts) ||
    isNaN(tick) ||
    contracts <= 0 ||
    tick <= 0
  ) {
    return null; // not enough info to compute
  }

  const directionFactor = direction === "short" ? -1 : 1;
  const priceMove = exit - entry;
  const pnl = priceMove * directionFactor * tick * contracts;
  return Number(pnl.toFixed(2));
}

const TradeFormPage = () => {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // TopstepX raw import
  const [rawImport, setRawImport] = useState("");
  const [parseError, setParseError] = useState("");

  // Risk helper state
  const [riskHelper, setRiskHelper] = useState({
    account_balance: "",
    contracts: "",
    tick_value: "",
    tick_label: "",
  });

  // Tooltip & modal
  const [tooltipField, setTooltipField] = useState(null);
  const [modalField, setModalField] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tradeFormState_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setForm(parsed.form);
        if (parsed.riskHelper) setRiskHelper(parsed.riskHelper);
        if (parsed.rawImport) setRawImport(parsed.rawImport);
      }
    } catch (e) {
      console.warn("Failed to load saved trade form from localStorage", e);
    }
  }, []);

  // Save to localStorage whenever form / helper / rawImport changes
  useEffect(() => {
    const data = {
      form,
      riskHelper,
      rawImport,
    };
    try {
      localStorage.setItem("tradeFormState_v1", JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to save trade form to localStorage", e);
    }
  }, [form, riskHelper, rawImport]);

  // Auto-calc PnL when key fields change
  useEffect(() => {
    const newPnl = computePnl(form, riskHelper);
    if (newPnl === null) return;

    setForm((prev) => {
      if (prev.pnl === newPnl) return prev;
      return { ...prev, pnl: newPnl };
    });
  }, [
    form.entry_price,
    form.exit_price,
    form.direction,
    riskHelper.contracts,
    riskHelper.tick_value,
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStopLevelChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.stop_levels];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, stop_levels: updated };
    });
  };

  const handleTakeProfitLevelChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.take_profit_levels];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, take_profit_levels: updated };
    });
  };

  const addStopLevel = () => {
    setForm((prev) => ({
      ...prev,
      stop_levels: [...prev.stop_levels, { price: "", reason: "" }],
    }));
  };

  const removeStopLevel = (index) => {
    setForm((prev) => {
      const updated = prev.stop_levels.filter((_, i) => i !== index);
      return {
        ...prev,
        stop_levels: updated.length ? updated : [{ price: "", reason: "" }],
      };
    });
  };

  const addTakeProfitLevel = () => {
    setForm((prev) => ({
      ...prev,
      take_profit_levels: [...prev.take_profit_levels, { price: "", reason: "" }],
    }));
  };

  const removeTakeProfitLevel = (index) => {
    setForm((prev) => {
      const updated = prev.take_profit_levels.filter((_, i) => i !== index);
      return {
        ...prev,
        take_profit_levels: updated.length
          ? updated
          : [{ price: "", reason: "" }],
      };
    });
  };

  const handleRiskHelperChange = (e) => {
    const { name, value } = e.target;
    setRiskHelper((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRiskTickChange = (e) => {
    const { value } = e.target;
    const opt = TICK_OPTIONS.find((o) => o.value === value);
    setRiskHelper((prev) => ({
      ...prev,
      tick_value: value,
      tick_label: opt ? opt.label : "",
    }));
  };

  const handleCalculateRiskPercent = () => {
    setMessage("");
    setMessageType("success");
    const entry = parseFloat(form.entry_price);
    const firstSL = parseFloat(form.stop_levels[0]?.price);
    const balance = parseFloat(riskHelper.account_balance);
    const contracts = parseFloat(riskHelper.contracts);
    const tick = parseFloat(riskHelper.tick_value);

    if (
      isNaN(entry) ||
      isNaN(firstSL) ||
      isNaN(balance) ||
      isNaN(contracts) ||
      isNaN(tick) ||
      balance <= 0
    ) {
      setMessageType("error");
      setMessage(
        "Risk helper: Entry, first Stop, Account Balance, Contracts, and Tick Value are all required to calculate Risk %."
      );
      return;
    }

    const priceDistance = Math.abs(entry - firstSL);
    const riskAmount = priceDistance * tick * contracts;
    const riskPercent = (riskAmount / balance) * 100;

    setForm((prev) => ({
      ...prev,
      risk_percent: Number(riskPercent.toFixed(2)),
    }));

    setMessageType("success");
    setMessage(
      `Calculated risk: ~$${riskAmount.toFixed(
        2
      )} (${riskPercent.toFixed(2)}% of account). Risk % field updated.`
    );
  };

  const validateForm = (f) => {
    const errors = [];

    const requiredText = (value, label) => {
      if (!value || String(value).trim() === "") {
        errors.push(`${label} is required.`);
      }
    };

    requiredText(f.date, "Date");
    requiredText(f.time, "Time");
    requiredText(f.symbol, "Symbol");
    requiredText(f.direction, "Direction");
    requiredText(f.session, "Session");
    requiredText(f.timeframe, "Timeframe");
    requiredText(f.risk_percent, "Risk %");
    requiredText(f.entry_price, "Entry Price");
    requiredText(f.exit_price, "Exit Price");
    requiredText(f.pnl, "PnL ($)");
    requiredText(f.r_multiple, "R-Multiple");
    requiredText(f.ict_setup, "ICT Setup");
    requiredText(f.higher_tf_bias, "Higher Timeframe Bias");
    requiredText(f.pre_trade_emotion, "Pre-trade Emotion");
    requiredText(f.post_trade_emotion, "Post-trade Emotion");
    requiredText(f.trade_grade, "Trade Grade");
    requiredText(f.notes, "Notes");

    if (!f.stop_levels.length || !f.stop_levels[0].price) {
      errors.push("At least one Stop Loss price is required.");
    }
    if (!f.stop_levels.length || !f.stop_levels[0].reason) {
      errors.push("A reason for the first Stop Loss is required.");
    }
    if (!f.take_profit_levels.length || !f.take_profit_levels[0].price) {
      errors.push("At least one Take Profit price is required.");
    }
    if (!f.take_profit_levels.length || !f.take_profit_levels[0].reason) {
      errors.push("A reason for the first Take Profit is required.");
    }

    const exitPrice = parseFloat(f.exit_price);
    if (!isNaN(exitPrice)) {
      const stopMatch = f.stop_levels.some(
        (sl) => parseFloat(sl.price) === exitPrice
      );
      const tpMatch = f.take_profit_levels.some(
        (tp) => parseFloat(tp.price) === exitPrice
      );
      if (!stopMatch && !tpMatch) {
        errors.push(
          "Exit Price must match at least one Stop Loss or Take Profit level, since your exit always occurs at a SL or TP."
        );
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setParseError("");
    setMessage("");

    const errors = validateForm(form);
    if (errors.length) {
      setMessageType("error");
      setMessage(errors.join(" "));
      return;
    }

    setSaving(true);
    try {
      await axiosClient.post("/trades", form);
      setMessageType("success");
      setMessage("Trade saved successfully.");
      setForm(initialForm);
      setRiskHelper({
        account_balance: "",
        contracts: "",
        tick_value: "",
        tick_label: "",
      });
      setRawImport("");
      localStorage.removeItem("tradeFormState_v1");
    } catch (err) {
      console.error(err);
      let errorMsg = "Failed to save trade.";
      if (err.response) {
        const data = err.response.data;
        if (data && typeof data === "object" && data.detail) {
          errorMsg += ` Reason: ${data.detail}`;
        } else if (typeof data === "string") {
          errorMsg += ` Reason: ${data}`;
        } else {
          errorMsg += ` Status: ${err.response.status}.`;
        }
      } else if (err.message) {
        errorMsg += ` Reason: ${err.message}`;
      }
      setMessageType("error");
      setMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Helper: "November 25 2025 @ 9:59:53 am" -> { date: "2025-11-25", time: "09:59" }
  const parseTopstepDateTime = (line) => {
    if (!line) return null;
    let cleaned = line.replace("@", "").trim();
    cleaned = cleaned.replace(/\s+am/i, " AM").replace(/\s+pm/i, " PM");

    const d = new Date(cleaned);
    if (isNaN(d)) return null;

    const pad = (n) => String(n).padStart(2, "0");
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  };

  const handleParseTopstep = () => {
    setParseError("");
    setMessage("");

    const lines = rawImport
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 11) {
      setParseError(
        "This doesn't look like a full TopstepX block. I expected around 11–12 lines."
      );
      return;
    }

    const tradeId = lines[0];
    const rawSymbol = lines[1] || "";
    const size = lines[2] || "";
    const entryDTLine = lines[3];
    const exitDTLine = lines[4];
    const entryPriceLine = lines[6];
    const exitPriceLine = lines[7];
    const pnlLine = lines[8];
    const commissionLine = lines[9] || "";
    const extraMetricLine = lines[10] || "";
    const directionLine = lines[11] || "";

    const entryDT = parseTopstepDateTime(entryDTLine);
    const exitDT = parseTopstepDateTime(exitDTLine);
    void exitDT;

    const cleanNumber = (str) => {
      if (!str) return NaN;
      return parseFloat(str.replace(/\$/g, "").replace(/,/g, ""));
    };

    const entryPrice = cleanNumber(entryPriceLine);
    const exitPrice = cleanNumber(exitPriceLine);
    const pnlVal = cleanNumber(pnlLine);

    const direction =
      directionLine.toLowerCase().includes("long")
        ? "long"
        : directionLine.toLowerCase().includes("short")
        ? "short"
        : "long";

    let result = "pending";
    if (!isNaN(pnlVal)) {
      if (pnlVal > 0) result = "win";
      else if (pnlVal < 0) result = "loss";
      else result = "breakeven";
    }

    const symbolClean = rawSymbol.replace(/^\//, "").trim() || "unknown symbol";

    const topstepSentence =
      `TopstepX copy output: Trade ID ${tradeId}, size ${size} contract(s) on ${symbolClean}, ` +
      `entered around "${entryDTLine}" and exited around "${exitDTLine}". ` +
      `Entry price was ${entryPriceLine}, exit price was ${exitPriceLine}, realized PnL was ${pnlLine}, ` +
      `commissions were ${commissionLine || "$0"}, and the extra metric reported was ` +
      `${extraMetricLine || "not provided"}.`;

    setForm((prev) => ({
      ...prev,
      date: entryDT?.date || prev.date,
      time: entryDT?.time || prev.time,
      symbol: symbolClean || prev.symbol,
      direction,
      entry_price: isNaN(entryPrice) ? prev.entry_price : entryPrice,
      exit_price: isNaN(exitPrice) ? prev.exit_price : exitPrice,
      pnl: isNaN(pnlVal) ? prev.pnl : pnlVal,
      result,
      notes: prev.notes ? `${prev.notes}\n\n${topstepSentence}` : topstepSentence,
      username: "cisco",
    }));

    setMessageType("success");
    setMessage(
      "TopstepX block parsed. Fields populated — review ICT details, psychology, and SL/TP levels."
    );
  };

  const renderHelp = (fieldKey) => {
    const def = FIELD_DEFS[fieldKey];
    return (
      <>
        {tooltipField === fieldKey && def?.casual && (
          <span style={styles.tooltipBubble}>{def.casual}</span>
        )}
        {def && (
          <button
            type="button"
            style={styles.learnMoreLink}
            onClick={() => setModalField(fieldKey)}
          >
            Learn more
          </button>
        )}
      </>
    );
  };

  return (
    <div style={styles.pageWrapper}>
      <h2 style={styles.pageTitle}>Submit Trade</h2>
      {message && (
        <p
          style={{
            color: messageType === "error" ? "red" : "green",
            fontSize: "0.9rem",
            marginBottom: 10,
          }}
        >
          {message}
        </p>
      )}

      {/* Quick Import from TopstepX */}
      <div style={styles.importCard}>
        <h3 style={styles.sectionTitle}>Quick Import from TopstepX</h3>
        <p style={{ fontSize: "0.85rem", marginBottom: "6px" }}>
          Paste the raw text block from TopstepX (one line per field) and click{" "}
          <strong>Parse &amp; Fill</strong>. You can edit everything after.
        </p>
        {parseError && (
          <p style={{ color: "red", fontSize: "0.85rem" }}>{parseError}</p>
        )}
        <textarea
          value={rawImport}
          onChange={(e) => setRawImport(e.target.value)}
          rows={6}
          placeholder={`Example:\n1692251887\n/MNQ\n1\nNovember 25 2025 @ 9:59:53 am\nNovember 25 2025 @ 11:45:17 am\n01:45:23\n24,816.75\n24,855.25\n$77.00\n$0\n$-0.74\nLong`}
          style={styles.importTextarea}
        />
        <button
          type="button"
          style={styles.importButton}
          onClick={handleParseTopstep}
        >
          Parse &amp; Fill from TopstepX
        </button>
      </div>

      {/* Risk helper */}
      <div style={styles.importCard}>
        <h3 style={styles.sectionTitle}>
          Risk % Helper{" "}
          <span
            style={styles.infoIcon}
            onClick={() => setTooltipField("risk_percent")}
          >
            ?
          </span>
        </h3>
        {renderHelp("risk_percent")}
        <p style={{ fontSize: "0.85rem", marginBottom: "6px" }}>
          Uses <strong>Entry Price</strong> and your <strong>first Stop Loss</strong> level plus
          Account Balance, Contracts, and Tick Value to calculate Risk % and auto-fill it.
        </p>
        <div style={styles.row}>
          <label style={styles.label}>
            Account Balance ($)
            <span
              style={styles.infoIcon}
              onClick={() => setTooltipField("account_balance")}
            >
              ?
            </span>
            <input
              type="number"
              step="0.01"
              name="account_balance"
              value={riskHelper.account_balance}
              onChange={handleRiskHelperChange}
              style={styles.input}
            />
            {renderHelp("account_balance")}
          </label>
          <label style={styles.label}>
            Contracts
            <span
              style={styles.infoIcon}
              onClick={() => setTooltipField("contracts")}
            >
              ?
            </span>
            <input
              type="number"
              step="1"
              name="contracts"
              value={riskHelper.contracts}
              onChange={handleRiskHelperChange}
              style={styles.input}
            />
            {renderHelp("contracts")}
          </label>
          <label style={styles.label}>
            Tick Value ($ per point)
            <span
              style={styles.infoIcon}
              onClick={() => setTooltipField("tick_value")}
            >
              ?
            </span>
            <select
              name="tick_value"
              value={riskHelper.tick_value}
              onChange={handleRiskTickChange}
              style={styles.input}
            >
              <option value="">Select instrument</option>
              {TICK_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {renderHelp("tick_value")}
          </label>
        </div>
        <button
          type="button"
          style={styles.smallSecondaryButton}
          onClick={handleCalculateRiskPercent}
        >
          Calculate Risk % from Entry &amp; First SL
        </button>
      </div>

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} style={styles.formStack}>
        {/* Core info */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Core Details</h3>
          <div style={styles.row}>
            <label style={styles.label}>
              Date
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("date")}
              >
                ?
              </span>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                style={styles.input}
                required
              />
              {renderHelp("date")}
            </label>
            <label style={styles.label}>
              Time
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("time")}
              >
                ?
              </span>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                style={styles.input}
                required
              />
              {renderHelp("time")}
            </label>
          </div>
          <div style={styles.row}>
            <label style={styles.label}>
              Symbol
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("symbol")}
              >
                ?
              </span>
              <input
                type="text"
                name="symbol"
                value={form.symbol}
                onChange={handleChange}
                placeholder="NAS100, ES, MNQ, EURUSD"
                style={styles.input}
                required
              />
              {renderHelp("symbol")}
            </label>
            <label style={styles.label}>
              Direction
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("direction")}
              >
                ?
              </span>
              <select
                name="direction"
                value={form.direction}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
              {renderHelp("direction")}
            </label>
          </div>
          <div style={styles.row}>
            <label style={styles.label}>
              Session
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("session")}
              >
                ?
              </span>
              <select
                name="session"
                value={form.session}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="">Select</option>
                <option value="asia">Asia</option>
                <option value="london">London</option>
                <option value="newyork">New York</option>
              </select>
              {renderHelp("session")}
            </label>
            <label style={styles.label}>
              Timeframe
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("timeframe")}
              >
                ?
              </span>
              <select
                name="timeframe"
                value={form.timeframe}
                onChange={handleChange}
                style={styles.input}
                required
              >
                {TIMEFRAME_OPTIONS.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
              {renderHelp("timeframe")}
            </label>
          </div>
        </section>

        {/* Risk & levels */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Risk & Levels</h3>

          <div style={styles.row}>
            <label style={styles.label}>
              Risk (% of account)
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("risk_percent")}
              >
                ?
              </span>
              <input
                type="number"
                step="0.01"
                name="risk_percent"
                value={form.risk_percent}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. 1"
                required
              />
              {renderHelp("risk_percent")}
            </label>
            <label style={styles.label}>
              Entry Price
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("entry_price")}
              >
                ?
              </span>
              <input
                type="number"
                step="0.01"
                name="entry_price"
                value={form.entry_price}
                onChange={handleChange}
                style={styles.input}
                required
              />
              {renderHelp("entry_price")}
            </label>
          </div>

          <h4 style={styles.subTitle}>Stop Loss Levels</h4>
          {form.stop_levels.map((sl, idx) => (
            <div key={idx} style={styles.row}>
              <label style={styles.label}>
                Stop #{idx + 1} Price
                <span
                  style={styles.infoIcon}
                  onClick={() => setTooltipField("stop_price")}
                >
                  ?
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={sl.price}
                  onChange={(e) =>
                    handleStopLevelChange(idx, "price", e.target.value)
                  }
                  style={styles.input}
                  required={idx === 0}
                />
                {renderHelp("stop_price")}
              </label>
              <label style={styles.label}>
                Reason for this SL
                <span
                  style={styles.infoIcon}
                  onClick={() => setTooltipField("stop_reason")}
                >
                  ?
                </span>
                <input
                  type="text"
                  value={sl.reason}
                  onChange={(e) =>
                    handleStopLevelChange(idx, "reason", e.target.value)
                  }
                  style={styles.input}
                  placeholder="Why did you place/move this SL?"
                  required={idx === 0}
                />
                {renderHelp("stop_reason")}
              </label>
              {form.stop_levels.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeStopLevel(idx)}
                  style={styles.smallDangerButton}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addStopLevel}
            style={styles.smallSecondaryButton}
          >
            + Add Stop Level
          </button>

          <h4 style={styles.subTitle}>Take Profit Levels</h4>
          {form.take_profit_levels.map((tp, idx) => (
            <div key={idx} style={styles.row}>
              <label style={styles.label}>
                Take Profit #{idx + 1} Price
                <span
                  style={styles.infoIcon}
                  onClick={() => setTooltipField("tp_price")}
                >
                  ?
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={tp.price}
                  onChange={(e) =>
                    handleTakeProfitLevelChange(idx, "price", e.target.value)
                  }
                  style={styles.input}
                  required={idx === 0}
                />
                {renderHelp("tp_price")}
              </label>
              <label style={styles.label}>
                Reason for this TP
                <span
                  style={styles.infoIcon}
                  onClick={() => setTooltipField("tp_reason")}
                >
                  ?
                </span>
                <input
                  type="text"
                  value={tp.reason}
                  onChange={(e) =>
                    handleTakeProfitLevelChange(idx, "reason", e.target.value)
                  }
                  style={styles.input}
                  placeholder="Why this target? HTF level, old high, gap, etc."
                  required={idx === 0}
                />
                {renderHelp("tp_reason")}
              </label>
              {form.take_profit_levels.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTakeProfitLevel(idx)}
                  style={styles.smallDangerButton}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addTakeProfitLevel}
            style={styles.smallSecondaryButton}
          >
            + Add Take Profit Level
          </button>

          <div style={styles.row}>
            <label style={styles.label}>
              Exit Price
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("exit_price")}
              >
                ?
              </span>
              <input
                type="number"
                step="0.01"
                name="exit_price"
                value={form.exit_price}
                onChange={handleChange}
                style={styles.input}
                required
              />
              {renderHelp("exit_price")}
            </label>
            <label style={styles.label}>
              PnL ($)
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("pnl")}
              >
                ?
              </span>
              <input
                type="number"
                step="0.01"
                name="pnl"
                value={form.pnl}
                style={styles.input}
                readOnly
              />
              {renderHelp("pnl")}
            </label>
          </div>

          <div style={styles.row}>
            <label style={styles.label}>
              Result
              <select
                name="result"
                value={form.result}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="pending">Pending</option>
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="breakeven">Breakeven</option>
              </select>
            </label>
            <label style={styles.label}>
              R-Multiple
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("r_multiple")}
              >
                ?
              </span>
              <input
                type="number"
                step="0.01"
                name="r_multiple"
                value={form.r_multiple}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g. 2.5 for +2.5R"
                required
              />
              {renderHelp("r_multiple")}
            </label>
          </div>
        </section>

        {/* ICT Strategy */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>ICT Strategy Detail</h3>
          <label style={styles.label}>
            ICT Setup
            <span
              style={styles.infoIcon}
              onClick={() => setTooltipField("ict_setup")}
            >
              ?
            </span>
            <select
              name="ict_setup"
              value={form.ict_setup}
              onChange={handleChange}
              style={styles.input}
              required
            >
              {ICT_SETUP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {renderHelp("ict_setup")}
          </label>
          <label style={styles.label}>
            Higher Timeframe Bias
            <span
              style={styles.infoIcon}
              onClick={() => setTooltipField("higher_tf_bias")}
            >
              ?
            </span>
            <select
              name="higher_tf_bias"
              value={form.higher_tf_bias}
              onChange={handleChange}
              style={styles.input}
              required
            >
              {TIMEFRAME_OPTIONS.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
            {renderHelp("higher_tf_bias")}
          </label>
          <div style={styles.checkboxRow}>
            <label>
              <input
                type="checkbox"
                name="ifvg_used"
                checked={form.ifvg_used}
                onChange={handleChange}
              />{" "}
              IFVG used
            </label>
            <label>
              <input
                type="checkbox"
                name="ob_used"
                checked={form.ob_used}
                onChange={handleChange}
              />{" "}
              Order Block
            </label>
            <label>
              <input
                type="checkbox"
                name="breaker_used"
                checked={form.breaker_used}
                onChange={handleChange}
              />{" "}
              Breaker Block
            </label>
          </div>
          <div style={styles.checkboxRow}>
            <label>
              <input
                type="checkbox"
                name="liquidity_sweep_used"
                checked={form.liquidity_sweep_used}
                onChange={handleChange}
              />{" "}
              Liquidity Sweep
            </label>
            <label>
              <input
                type="checkbox"
                name="mitigation_block_used"
                checked={form.mitigation_block_used}
                onChange={handleChange}
              />{" "}
              Mitigation Block
            </label>
          </div>
        </section>

        {/* Psychology */}
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Psychology & Behavior</h3>
          <div style={styles.row}>
            <label style={styles.label}>
              Pre-trade Emotion
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("pre_trade_emotion")}
              >
                ?
              </span>
              <select
                name="pre_trade_emotion"
                value={form.pre_trade_emotion}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="">Select</option>
                <option value="calm">Calm</option>
                <option value="fear">Fear</option>
                <option value="greed">Greed</option>
                <option value="fomo">FOMO</option>
                <option value="revenge">Revenge</option>
              </select>
              {renderHelp("pre_trade_emotion")}
            </label>
            <label style={styles.label}>
              Post-trade Emotion
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("post_trade_emotion")}
              >
                ?
              </span>
              <select
                name="post_trade_emotion"
                value={form.post_trade_emotion}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="">Select</option>
                <option value="satisfied">Satisfied</option>
                <option value="regret">Regret</option>
                <option value="tilt">Tilt</option>
                <option value="neutral">Neutral</option>
              </select>
              {renderHelp("post_trade_emotion")}
            </label>
          </div>
          <div style={styles.row}>
            <label style={styles.label}>
              Trade Grade
              <span
                style={styles.infoIcon}
                onClick={() => setTooltipField("trade_grade")}
              >
                ?
              </span>
              <select
                name="trade_grade"
                value={form.trade_grade}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
              {renderHelp("trade_grade")}
            </label>
          </div>
          <div style={styles.checkboxColumn}>
            <label>
              <input
                type="checkbox"
                name="followed_plan"
                checked={form.followed_plan}
                onChange={handleChange}
              />{" "}
              Followed trading plan
            </label>
            <label>
              <input
                type="checkbox"
                name="emotional_trade"
                checked={form.emotional_trade}
                onChange={handleChange}
              />{" "}
              Emotional trade
            </label>
            <label>
              <input
                type="checkbox"
                name="took_profit_early"
                checked={form.took_profit_early}
                onChange={handleChange}
              />{" "}
              Took profit early
            </label>
            <label>
              <input
                type="checkbox"
                name="missed_trade"
                checked={form.missed_trade}
                onChange={handleChange}
              />{" "}
              Missed trade
            </label>
            <label>
              <input
                type="checkbox"
                name="moved_stop_loss"
                checked={form.moved_stop_loss}
                onChange={handleChange}
              />{" "}
              Moved stop loss
            </label>
            <label>
              <input
                type="checkbox"
                name="moved_take_profit"
                checked={form.moved_take_profit}
                onChange={handleChange}
              />{" "}
              Moved take profit
            </label>
            <label>
              <input
                type="checkbox"
                name="revenge_trade"
                checked={form.revenge_trade}
                onChange={handleChange}
              />{" "}
              Revenge trade
            </label>
          </div>
          <label style={styles.label}>
            Notes (ICT reasoning, context, hindsight review)
            <span
              style={styles.infoIcon}
              onClick={() => setTooltipField("notes")}
            >
              ?
            </span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={5}
              style={{ ...styles.input, resize: "vertical" }}
              placeholder="Why did you take this trade? OB/FVG/IFVG logic, liquidity, session, news, what you would change, etc."
              required
            />
            {renderHelp("notes")}
          </label>
        </section>

        <button type="submit" style={styles.submitBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Trade"}
        </button>
      </form>

      {/* Learn-more modal */}
      {modalField && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h4>{FIELD_DEFS[modalField]?.label || "Details"}</h4>
            <p style={{ fontSize: "0.9rem" }}>
              {FIELD_DEFS[modalField]?.formal ||
                "More detailed explanation not provided yet."}
            </p>
            <button
              type="button"
              style={styles.smallSecondaryButton}
              onClick={() => setModalField(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pageWrapper: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "12px 12px 40px",
    boxSizing: "border-box",
  },
  pageTitle: {
    fontSize: "1.4rem",
    fontWeight: 600,
    marginBottom: 12,
  },
  importCard: {
    padding: "12px",
    marginBottom: "16px",
    borderRadius: "10px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  sectionTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: 6,
  },
  subTitle: {
    marginTop: 10,
    marginBottom: 4,
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  importTextarea: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontFamily: "monospace",
    fontSize: "0.85rem",
    marginBottom: "8px",
    boxSizing: "border-box",
  },
  importButton: {
    padding: "10px 14px",
    background: "#4b5563",
    color: "white",
    borderRadius: "999px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
    width: "100%",
  },
  formStack: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  section: {
    padding: "14px",
    borderRadius: "12px",
    background: "white",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  row: {
    display: "flex",
    flexDirection: "column", // mobile-first: always stacked
    gap: "10px",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.9rem",
    flex: 1,
  },
  input: {
    padding: "10px 9px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    marginTop: "4px",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  },
  checkboxRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    fontSize: "0.85rem",
  },
  checkboxColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "0.85rem",
    marginTop: "6px",
  },
  submitBtn: {
    padding: "12px",
    marginTop: "4px",
    background: "#10b981",
    border: "none",
    borderRadius: "999px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "1rem",
    width: "100%",
  },
  smallSecondaryButton: {
    marginTop: "8px",
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid #9ca3af",
    background: "#f3f4f6",
    fontSize: "0.85rem",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  smallDangerButton: {
    marginTop: "8px",
    padding: "6px 10px",
    borderRadius: "999px",
    border: "none",
    background: "#ef4444",
    color: "white",
    fontSize: "0.8rem",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  infoIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "4px",
    width: "18px",
    height: "18px",
    borderRadius: "999px",
    border: "1px solid #9ca3af",
    fontSize: "0.75rem",
    cursor: "pointer",
    color: "#4b5563",
  },
  tooltipBubble: {
    display: "block",
    marginTop: "4px",
    background: "#111827",
    color: "white",
    fontSize: "0.75rem",
    padding: "4px 6px",
    borderRadius: "4px",
    maxWidth: "280px",
  },
  learnMoreLink: {
    marginTop: "2px",
    padding: 0,
    border: "none",
    background: "none",
    color: "#2563eb",
    fontSize: "0.75rem",
    textDecoration: "underline",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "white",
    padding: "16px",
    borderRadius: "12px",
    maxWidth: "420px",
    width: "90%",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    boxSizing: "border-box",
  },
};

export default TradeFormPage;