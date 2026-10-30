const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany();
  await prisma.product.createMany({
    data: [
      { name: "T-shirt noir", price: 8000, description: "Coton, coupe classique" },
      { name: "Casquette", price: 5000, description: "Réglable, plusieurs couleurs" },
      { name: "Sac à dos", price: 15000, description: "Résistant et léger" },
    ],
  });
  console.log("Produits insérés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
