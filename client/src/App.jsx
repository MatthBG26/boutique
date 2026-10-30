import { useEffect, useState } from "react";

const API_URL = "http://localhost:4000";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const changeQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const format = (n) => n.toLocaleString("fr-FR") + " FCFA";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submitOrder = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items: cart.map((i) => ({ id: i.id, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
      } else {
        setConfirmation(data);
        setCart([]);
        setForm({ name: "", phone: "", address: "" });
      }
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: 8,
    marginBottom: 10,
    boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h1>Ma boutique</h1>

      {confirmation && (
        <div
          style={{
            background: "#e8f8ec",
            border: "1px solid #8fd19e",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <strong>Merci {confirmation.customer.name} !</strong>
          <p style={{ margin: "8px 0 0" }}>
            Votre commande n°{confirmation.id} de {format(confirmation.total)} a bien été
            enregistrée. Nous vous contacterons au {confirmation.customer.phone}.
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "2 1 400px", display: "grid", gap: 16 }}>
          {products.map((p) => (
            <div key={p.id} style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
              <h3 style={{ margin: "0 0 8px" }}>{p.name}</h3>
              <p style={{ margin: "0 0 8px" }}>{p.description}</p>
              <strong>{format(p.price)}</strong>
              <div>
                <button
                  onClick={() => addToCart(p)}
                  style={{ marginTop: 12, padding: "8px 14px", cursor: "pointer" }}
                >
                  Ajouter au panier
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: "1 1 260px", border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Panier</h2>
          {cart.length === 0 && <p>Votre panier est vide.</p>}
          {cart.map((item) => (
            <div key={item.id} style={{ marginBottom: 12 }}>
              <div>{item.name}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => changeQuantity(item.id, -1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => changeQuantity(item.id, 1)}>+</button>
                <span style={{ marginLeft: "auto" }}>{format(item.price * item.quantity)}</span>
              </div>
            </div>
          ))}

          {cart.length > 0 && (
            <>
              <h3 style={{ borderTop: "1px solid #ccc", paddingTop: 12 }}>
                Total : {format(total)}
              </h3>

              <form onSubmit={submitOrder}>
                <input
                  style={inputStyle}
                  name="name"
                  placeholder="Nom complet"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <input
                  style={inputStyle}
                  name="phone"
                  placeholder="Téléphone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
                <input
                  style={inputStyle}
                  name="address"
                  placeholder="Adresse de livraison"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
                {error && <p style={{ color: "crimson", margin: "0 0 10px" }}>{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", padding: 10, cursor: "pointer" }}
                >
                  {loading ? "Envoi..." : "Commander (paiement à la livraison)"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
