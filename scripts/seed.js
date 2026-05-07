/*
  Seed script — populates an empty Kopahi DB with demo users, categories,
  products, coupons and blog posts.
  Usage: npm run seed
*/
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const BlogPost = require("../models/BlogPost");

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

const coupons = [
  {
    code: "WELCOME10",
    description: "10% off your first order",
    percentDiscount: 10,
    minSubtotal: 0,
    maxDiscount: 200,
    active: true,
  },
  {
    code: "ASSAM15",
    description: "15% off any Assam region order",
    percentDiscount: 15,
    minSubtotal: 499,
    maxDiscount: 500,
    active: true,
  },
  {
    code: "FESTIVE25",
    description: "25% off — limited festive offer",
    percentDiscount: 25,
    minSubtotal: 999,
    maxDiscount: 750,
    usageLimit: 100,
    active: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
];

const blogPosts = [
  {
    title: "Why GI tags matter for North-East Indian farmers",
    excerpt:
      "GI tags aren't bureaucracy — they're how a farmer in Assam keeps the value of their tea or rice on home soil.",
    content:
      "<p>Geographical Indication (GI) tags are protected names tied to a place. " +
      "When 'Assam Tea' or 'Tezpur Litchi' is GI-tagged, only producers from that region " +
      "can use the name. For farmers, that means premium pricing, brand protection, and " +
      "global recognition. Kopahi works directly with GI-tagged producers and surfaces " +
      "the certification on every product page.</p>",
    coverImage: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=1200&q=80",
    tags: ["GI Tag", "Farmers", "Assam"],
  },
  {
    title: "Lakadong turmeric: the science behind the gold",
    excerpt:
      "What makes Lakadong turmeric special isn't marketing — it's curcumin levels that no other variety matches.",
    content:
      "<p>Lakadong turmeric, grown in the Jaintia Hills of Meghalaya, contains curcumin " +
      "levels of 7–9% — nearly triple the global average of 2–3%. That's why it commands " +
      "premium pricing globally, why Ayurveda practitioners specifically request it, and " +
      "why the Government of India granted it GI status in 2022.</p>",
    coverImage: "https://images.unsplash.com/photo-1615485290449-bd1d3ba66bf3?w=1200&q=80",
    tags: ["Spices", "Lakadong", "Health"],
  },
  {
    title: "How black rice from Manipur is changing global menus",
    excerpt:
      "Once forbidden to commoners, black rice is now on tasting menus from Tokyo to New York. Manipur's farmers grew it long before the wellness trend.",
    content:
      "<p>Chak-hao, the indigenous black rice of Manipur, has been cultivated for centuries. " +
      "It's high in anthocyanins, the same antioxidants found in blueberries. International chefs " +
      "have caught on, and Manipuri farmer collectives now export to over 20 countries — " +
      "carrying both grain and a story.</p>",
    coverImage: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1200&q=80",
    tags: ["Rice", "Manipur", "Sustainability"],
  },
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
    Coupon.deleteMany({}),
    BlogPost.deleteMany({}),
  ]);

  // Strong default password (still labelled 'demo' for clarity, but meets policy).
  const DEMO_PASSWORD = process.env.SEED_PASSWORD || "DemoPass!2026";
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const insertedUsers = await User.insertMany([
    { name: "Kopahi Admin", email: "admin@kopahi.com", password, role: "admin", emailVerified: true },
    { name: "Demo Vendor", email: "vendor@kopahi.com", password, role: "vendor", businessName: "Brahmaputra Tea Co.", emailVerified: true },
    { name: "Demo Customer", email: "customer@kopahi.com", password, role: "user", emailVerified: true },
  ]);

  const vendor = insertedUsers.find((u) => u.role === "vendor");

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
      vendor: vendor?._id,
      rating: 4.5 + Math.random() * 0.5,
      numReviews: Math.floor(50 + Math.random() * 200),
    }))
  );

  await Coupon.insertMany(coupons);

  await BlogPost.insertMany(
    blogPosts.map((b) => ({
      ...b,
      slug: slugify(b.title),
      published: true,
      publishedAt: new Date(),
    }))
  );

  console.log("Seeded users, categories, products, coupons, blog posts.");
  console.log(`Demo logins (password: ${DEMO_PASSWORD}):`);
  console.log("  admin@kopahi.com  ·  vendor@kopahi.com  ·  customer@kopahi.com");

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
