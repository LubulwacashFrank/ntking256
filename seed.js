require("dotenv").config();
const { connectMongo } = require("./server/db/connectMongo");
const { ensureAdminUser } = require("./server/services/adminBootstrap");
const Product = require("./server/models/Product");
const { User } = require("./server/models/User");

async function seedProducts() {
  try {
    await connectMongo();
    await ensureAdminUser();

    // Get all users
    let users = await User.find();
    if (users.length === 0) {
      console.log('No users found, creating a test farmer...');
      const testFarmer = new User({
        name: 'Test Farmer',
        email: 'farmer@example.com',
        passwordHash: 'password123',
        role: 'farmer'
      });
      await testFarmer.save();
      users = [testFarmer];
    }

    // Check if products already exist
    const existingProducts = await Product.find();
    if (existingProducts.length > 0) {
      console.log('Products already exist, skipping seed');
      process.exit(0);
      return;
    }

    const farmerUser = users.find(u => u.role === 'farmer') || users[0];
    const farmerId = farmerUser._id;

    const products = [
      { name: "Cassava - Fresh", category: "Tubers & Roots", district: "Jinja", price: 1200, unit: "kg", stock: "500kg available", farmer: "Sarah Ema", farmerId, verified: true, featured: false, fresh: true, image: "linear-gradient(135deg, #FFE0B2, #FFCC80)", badges: ["verified", "fresh"] },
      { name: "Maize - Dried", category: "Grains & Cereals", district: "Mukono", price: 1500, unit: "kg", stock: "2 tons available", farmer: "John Okello", farmerId, verified: true, featured: true, fresh: false, image: "linear-gradient(135deg, #FFF9C4, #FFF176)", badges: ["verified", "featured"] },
      { name: "Matooke - Kisansa", category: "Fruits", district: "Mukono", price: 1500, unit: "bunch", stock: "15 bunches", farmer: "Mary Nakamya", farmerId, verified: true, featured: true, fresh: true, image: "linear-gradient(135deg, #FFCCBC, #FFAB91)", badges: ["verified", "featured", "fresh"] },
      { name: "Tomatoes - Fresh", category: "Vegetables", district: "Wakiso", price: 2000, unit: "kg", stock: "200kg available", farmer: "David Mugisha", farmerId, verified: true, featured: false, fresh: true, image: "linear-gradient(135deg, #C8E6C9, #A5D6A7)", badges: ["verified", "fresh"] },
      { name: "Beans - Kanyebwa", category: "Legumes & Pulses", district: "Mbale", price: 2800, unit: "kg", stock: "800kg available", farmer: "Grace Robert", farmerId, verified: true, featured: false, fresh: false, image: "linear-gradient(135deg, #DCEDC8, #C5E1A5)", badges: ["verified"] },
      { name: "Cabbage - Fresh", category: "Vegetables", district: "Kabale", price: 800, unit: "head", stock: "150 heads", farmer: "Peter Tumusiime", farmerId, verified: true, featured: false, fresh: true, image: "linear-gradient(135deg, #E8F5E9, #C8E6C9)", badges: ["verified", "fresh"] },
      { name: "Sweet Potatoes", category: "Tubers & Roots", district: "Soroti", price: 1800, unit: "kg", stock: "1 ton available", farmer: "Samuel Ongom", farmerId, verified: true, featured: false, fresh: false, image: "linear-gradient(135deg, #D7CCC8, #BCAAA4)", badges: ["verified"] },
      { name: "Coffee - Robusta", category: "Coffee & Others", district: "Bugisu", price: 8500, unit: "kg", stock: "500kg available", farmer: "Joseph Mwanga", farmerId, verified: true, featured: true, fresh: false, image: "linear-gradient(135deg, #EFEBE9, #D7CCC8)", badges: ["verified", "featured"] }
    ];

    const result = await Product.insertMany(products);
    console.log(`Seeded ${result.length} products successfully`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();