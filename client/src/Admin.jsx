import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const STATUSES = ["nouvelle", "en préparation", "livrée", "annulée"];
const format = (n) => n.toLocaleString("fr-FR") + " FCFA";

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem("adminToken") || "");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const logout = () => {
    sessionStorage.removeItem("adminToken");
    setToken("");
    setOrders([]);
  };

  const loadOrders = async (t) => {
    const res = await fetch(`${API_URL}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.status === 401) return logout();
    setOrders(await res.json());
  };

  useEffect(() => {
    if (token) loadOrders(token);
  }, [token]);

  const login = async (e) => {
    e.preventDefault();
    setError("");
    const res = await fetch(`${API_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Erreur.");
    sessionStorage.setItem("adminToken", data.token);
    setPassword("");
    setToken(data.token);
  };

  const changeStatus = async (id, status) => {
    const res = await fetch(`${API_URL}/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    }
  };

  if (!token) {
    return (
      <form onSubmit={login} style={{ maxWidth: 320, margin: "80px auto", padding: 20 }}>
        <h1>Administration</h1>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 10, boxSizing: "border-box" }}
        />
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button type="submit" style={{ width: "100%", padding: 10 }}>Se connecter</button>
      </form>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Commandes</h1>
        <button onClick={logout}>Déconnexion</button>
      </div>
      {orders.length === 0 && <p>Aucune commande pour le moment.</p>}
      {orders.map((o) => (
        <div key={o.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <strong>Commande n°{o.id}</strong>
            <span>{new Date(o.createdAt).toLocaleString("fr-FR")}</span>
          </div>
          <p style={{ margin: "8px 0" }}>
            {o.customerName} · {o.phone}<br />
            {o.address}
          </p>
          <ul style={{ margin: "8px 0" }}>
            {o.items.map((i) => (
              <li key={i.id}>{i.quantity} × {i.name} ({format(i.price)})</li>
            ))}
          </ul>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Total : {format(o.total)}</strong>
            <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}