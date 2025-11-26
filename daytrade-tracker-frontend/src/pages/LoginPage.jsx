import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  console.log("🚀 ~ LoginPage ~ form:", form)
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Adjust to your backend response
      const res = await axiosClient.post("login_verification/", form);
      const { token, user } = res.data;
      login(token, user);
      navigate("/trade");
    } catch (err) {
      console.error(err);
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h2>Login to Trading Journal</h2>
        {error && <div style={styles.error}>{error}</div>}
        <label style={styles.label}>
          Username
          <input
            style={styles.input}
            type="username"
            name="username"
            value={form.email}
            onChange={handleChange}
            required
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
          />
        </label>
        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
  },
  card: {
    maxWidth: "400px",
    width: "100%",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    background: "white",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  label: { fontSize: "0.9rem", display: "flex", flexDirection: "column" },
  input: {
    padding: "8px",
    marginTop: "4px",
    borderRadius: "4px",
    border: "1px solid #d1d5db",
  },
  button: {
    marginTop: "10px",
    padding: "10px",
    background: "#2563eb",
    border: "none",
    borderRadius: "4px",
    color: "white",
    cursor: "pointer",
  },
  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "6px 10px",
    borderRadius: "4px",
    fontSize: "0.85rem",
  },
};

export default LoginPage;