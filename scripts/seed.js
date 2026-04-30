/*
  Seed script — populates an empty Kopahi DB with demo users, categories and products.
  Usage: npm run seed
*/
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");

const slugify = (n) =>
  n.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const categories = [
  { name: "Tea", image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80" },
  { name: "Honey", image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=600&q=80" },
  { name: "Spices", image: "https://images.unsplash.com/photo-1615485290449-bd1d3ba66bf3?w=600&q=80" },
  { name: "Rice", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80" },
];

const products = [
  { name: "Assam Premium Tea", category: "Tea", price: 499, originalPrice: 599, stock: 100, featured: true,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80",
    description: "Hand-picked premium black tea from the rolling estates of Assam." },
  { name: "Wild Forest Honey", category: "Honey", price: 599, originalPrice: 749, stock: 60, featured: true,
    image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=800&q=80",
    description: "100% raw, unfiltered honey gathered from forests of North-East India." },
  { name: "Lakadong Turmeric", category: "Spices", price: 299, stock: 80, featured: true,
    image: "https://images.unsplash.com/photo-1615485290449-bd1d3ba66bf3?w=800&q=80",
    description: "GI-tagged Lakadong turmeric — exceptional curcumin content." },
  { name: "Organic Black Rice", category: "Rice", price: 699, stock: 50, featured: true,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80",
    description: "Aromatic black rice grown without chemicals in Manipur." },
  { name: "Bhut Jolokia Chilli", category: "Spices", price: 399, stock: 40,
    image: "https://images.unsplash.com/photo-1583664063-dc7a31c12e21?w=800&q=80",
    description: "One of the world's hottest chillies. Use sparingly." },
  { name: "Joha Aromatic Rice", category: "Rice", price: 549, originalPrice: 649, stock: 70,
    image: "https://images.unsplash.com/photo-1604908554007-fcb6c43c0a5d?w=800&q=80",
    description: "Fragrant short-grain rice native to Assam." },
  { name: "Mustard Wild Honey", category: "Honey", price: 749, stock: 0,
    image: "https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?w=800&q=80",
    description: "Mustard-bloom honey with a delicate floral note." },
  { name: "Darjeeling Green Tea", category: "Tea", price: 449, stock: 90,
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800&q=80",
    description: "First-flush Darjeeling green tea — bright, smooth and clean." },
];

(async () => {
  if (!process.env.MONGO_URI || process.env.MONGO_URI === "your_mongodb_url") {
    console.error("MONGO_URI is not set in .env — aborting seed.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to", mongoose.connection.name);

  await Promise.all([
    User.deleteMany({ email: { $in: ["admin@kopahi.com", "vendor@kopahi.com", "customer@kopahi.com"] } }),
    Category.deleteMany({}),
    Product.deleteMany({}),
  ]);

  const password = await bcrypt.hash("demo1234", 10);
  await User.insertMany([
    { name: "Kopahi Admin", email: "admin@kopahi.com", password, role: "admin" },
    { name: "Demo Vendor", email: "vendor@kopahi.com", password, role: "vendor", businessName: "Brahmaputra Tea Co." },
    { name: "Demo Customer", email: "customer@kopahi.com", password, role: "user" },
  ]);

  await Category.insertMany(categories.map((c) => ({ ...c, slug: slugify(c.name) })));

  await Product.insertMany(
    products.map((p) => ({
      name: p.name,
      slug: `${slugify(p.name)}-${Math.random().toString(36).slice(2, 7)}`,
      description: p.description,
      shortDescription: p.description.slice(0, 80),
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice || 0,
      stock: p.stock,
      images: [p.image],
      featured: !!p.featured,
      isActive: true,
      rating: 4.5 + Math.random() * 0.5,
      numReviews: Math.floor(50 + Math.random() * 200),
    }))
  );

  console.log("Seeded users, categories and products.");
  console.log("Demo logins (password: demo1234):");
  console.log("  admin@kopahi.com  · vendor@kopahi.com  · customer@kopahi.com");

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
