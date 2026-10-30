const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const STATUSES = ["nouvelle", "en préparation", "livrée", "annulée"];

module.exports = (prisma) => {
  const router = express.Router();

  const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();

  router.post("/login", (req, res) => {
    const { password } = req.body || {};
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected || !password || !crypto.timingSafeEqual(sha(password), sha(expected))) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token });
  });

  const requireAdmin = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      res.status(401).json({ error: "Non autorisé." });
    }
  };

  router.get("/orders", requireAdmin, async (req, res) => {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
    res.json(orders);
  });

  router.patch("/orders/:id/status", requireAdmin, async (req, res) => {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: "Statut invalide." });
    }
    try {
      const order = await prisma.order.update({
        where: { id: Number(req.params.id) },
        data: { status },
        include: { items: true },
      });
      res.json(order);
    } catch {
      res.status(404).json({ error: "Commande introuvable." });
    }
  });
  const parseProduct = (b) => {
    const name = String(b.name || "").trim();
    const description = String(b.description || "").trim();
    const price = Number(b.price);
    const imageUrl = b.imageUrl ? String(b.imageUrl).trim() : null;
    if (!name || !Number.isInteger(price) || price < 0) return null;
    return { name, description, price, imageUrl };
  };

  router.get("/products", requireAdmin, async (req, res) => {
    res.json(await prisma.product.findMany({ orderBy: { id: "asc" } }));
  });

  router.post("/products", requireAdmin, async (req, res) => {
    const data = parseProduct(req.body || {});
    if (!data) return res.status(400).json({ error: "Nom et prix valides obligatoires." });
    res.status(201).json(await prisma.product.create({ data }));
  });

  router.put("/products/:id", requireAdmin, async (req, res) => {
    const body = req.body || {};
    const data = parseProduct(body);
    if (!data) return res.status(400).json({ error: "Nom et prix valides obligatoires." });
    if (typeof body.active === "boolean") data.active = body.active;
    try {
      res.json(await prisma.product.update({ where: { id: Number(req.params.id) }, data }));
    } catch {
      res.status(404).json({ error: "Produit introuvable." });
    }
  });
  return router;
};
