import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const format = (n) => n.toLocaleString("fr-FR") + " FCFA";
const empty = { name: "", description: "", price: "", imageUrl: "" };

export default function AdminProducts() {
  const token = sessionStorage.getItem("adminToken") || "";
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = async () => {
    const res = await fetch(`${API_URL}/api/admin/products`, { headers });
    if (res.status === 401) {
      sessionStorage.removeItem("adminToken");
      window.location.href = "/admin";
      return;
    }
    setProducts(await res.json());
  };

  useEffect(() => {
    if (token) load();
  }, []);

  if (!token) {
    return (
      <p style={{ padding: 20 }}>
        Connecte-toi d'abord sur <a href="/admin">/admin</a>.
      </p>
    );
  }

  const save = async (e) => {
    e.preventDefault();
    setError("");
    const url = editingId
      ? `${API_URL}/api/admin/products/${editingId}`
      : `${API_URL}/api/admin/products`;
    const res = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers,
      body: JSON.stringify({ ...form, price: Number(form.price) }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Erreur.");
    setForm(empty);
    setEditingId(null);
    load();
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      imageUrl: p.imageUrl || "",
    });
    window.scrollTo(0, 0);
  };

  const toggle = async (p) => {
    await fetch(`${API_URL}/api/admin/products/${p.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        active: !p.active,
      }),
    });
    load();
  };

  const input = { width: "100%", padding: 8, marginBottom: 10, boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Produits</h1>
        <a href="/admin">← Commandes</a>
      </div>

      <form onSubmit={save} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? "Modifier le produit" : "Ajouter un produit"}</h3>
        <input style={input} placeholder="Nom" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input style={input} placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input style={input} type="number" min="0" placeholder="Prix en FCFA" value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        <input style={input} placeholder="Lien de l'image (optionnel, pour plus tard)" value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button type="submit" style={{ padding: "8px 14px" }}>
          {editingId ? "Enregistrer" : "Ajouter"}
        </button>
        {editingId && (
          <button type="button" style={{ marginLeft: 8, padding: "8px 14px" }}
            onClick={() => { setEditingId(null); setForm(empty); }}>
            Annuler
          </button>
        )}
      </form>

      {products.map((p) => (
        <div key={p.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 12,
          display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
          opacity: p.active ? 1 : 0.5 }}>
          <div>
            <strong>{p.name}</strong> · {format(p.price)}
            {!p.active && " (masqué)"}
            <div>{p.description}</div>
          </div>
          <div>
            <button onClick={() => edit(p)}>Modifier</button>{" "}
            <button onClick={() => toggle(p)}>{p.active ? "Masquer" : "Réafficher"}</button>
          </div>
        </div>
      ))}
    </div>
  );
}