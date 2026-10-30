const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "Le serveur fonctionne !" });
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { id: "asc" } });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { customer, items } = req.body;

    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({ error: "Nom, téléphone et adresse sont obligatoires." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Le panier est vide." });
    }

    const ids = items.map((i) => Number(i.id));
    const products = await prisma.product.findMany({ where: { id: { in: ids } } });

    const lines = [];
    for (const item of items) {
      const product = products.find((p) => p.id === Number(item.id));
      const quantity = Number(item.quantity);
      if (!product || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ error: "Article invalide dans le panier." });
      }
      lines.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
      });
    }

    const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

    const order = await prisma.order.create({
      data: {
        customerName: String(customer.name).trim(),
        phone: String(customer.phone).trim(),
        address: String(customer.address).trim(),
        total,
        items: { create: lines },
      },
      include: { items: true },
    });

    console.log("Nouvelle commande :", order.id);
    res.status(201).json({
      id: order.id,
      customer: { name: order.customerName, phone: order.phone, address: order.address },
      items: order.items,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

const adminRouter = require("./admin")(prisma);
app.use("/api/admin", adminRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));
