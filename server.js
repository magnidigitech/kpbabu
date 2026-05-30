import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Load Environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
// Parse incoming requests as JSON
app.use(express.json({ limit: '10mb' }));

// Database connection
const { Pool } = pg;
const isProduction = process.env.NODE_ENV === 'production';

// In Coolify/production we connect using DATABASE_URL. In development, we use DATABASE_URL or fallback to local postgres setup
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kpbabu';

// Internal Coolify connections do not use SSL. We should only enable SSL if connecting to external secure cloud DBs like Supabase or Neon.
const useSSL = connectionString.includes('sslmode=') || 
               connectionString.includes('supabase.co') || 
               connectionString.includes('neon.tech') || 
               connectionString.includes('aivencloud.com');

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : false
});

// Seed Data for Auto-Migration
const DEFAULT_SETTINGS = {
  storeName: "SRI KP BABU COMPUTER STATIONERYMART",
  tagline: "HP ASUS ACER AUTHORISED SHOW ROOM",
  established: "SINCE 1995",
  address: "H.O: Near Sai Baba Temple, 3/7 Brodipet, Opp. AXIS BANK, Guntur - 522 002.",
  phone: "+91 9597553232, 9951644777",
  email: "srikpbabucomputersm@gmail.com",
  gstin: "37ACHPB2370B1Z7",
  bankAccountNo: "924030067132830",
  bankIfsc: "UTIB0000070",
  bankName: "AXIS BANK, GUNTUR",
  terms: [
    "The above quoted price is Inclusive of GST 18%.",
    "100% Advance Payment on the date of Delivery.",
    "PRICE VALID FOR 4 DAYS ONLY"
  ],
  whatsappTemplate: `Hi {clientName},\n\nPlease find attached the quotation (Ref: {quotationNumber}) for the requested items/services.\n\n👉 View Quotation: {viewLink}\n\nHere is a quick summary of the details:\n\n💰 Total Amount: ₹{grandTotal}/- (Inclusive of 18% GST)\n\n📋 Payment Terms: 100% advance payment on the date of delivery.\n\n📅 Validity: Pricing is valid for 7 days.\n\nOur bank account details for the transfer are conveniently located at the bottom left of the attached document.\n\nPlease review the breakdown, and let me know if you would like to proceed with the order or if you have any questions!\n\nBest regards,\nKP Babu Computers\n\n📸 Instagram: https://www.instagram.com/sri_kp_babu_computers/\n🏪 Our Store: https://share.google/xlLdYEzLI2HYEzM9n`
};

const INITIAL_PRODUCTS = [];
const INITIAL_CUSTOMERS = [];
const INITIAL_QUOTATIONS = [];

// Self-healing database migration and seeding
async function runMigrations(client) {
  console.log("Running self-healing database migrations...");
  
  // 1. Settings Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      "id" VARCHAR(50) PRIMARY KEY,
      "storeName" VARCHAR(255) NOT NULL,
      "tagline" VARCHAR(255),
      "established" VARCHAR(50),
      "address" TEXT,
      "phone" VARCHAR(100),
      "email" VARCHAR(255),
      "gstin" VARCHAR(50),
      "bankAccountNo" VARCHAR(100),
      "bankIfsc" VARCHAR(50),
      "bankName" VARCHAR(100),
      "terms" JSONB,
      "whatsappTemplate" TEXT
    )
  `);

  // 2. Products Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
      "id" VARCHAR(50) PRIMARY KEY,
      "name" VARCHAR(255) NOT NULL,
      "sku" VARCHAR(100),
      "brand" VARCHAR(100),
      "category" VARCHAR(100),
      "price" NUMERIC(12, 2) DEFAULT 0.00,
      "gst" INTEGER DEFAULT 18,
      "stock" INTEGER DEFAULT 0,
      "warranty" VARCHAR(100)
    )
  `);

  // 3. Customers Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS customers (
      "id" VARCHAR(50) PRIMARY KEY,
      "name" VARCHAR(255) NOT NULL,
      "phone" VARCHAR(50),
      "email" VARCHAR(255),
      "address" TEXT,
      "gst" VARCHAR(50)
    )
  `);

  // 4. Quotations Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS quotations (
      "id" VARCHAR(50) PRIMARY KEY,
      "quotationNumber" VARCHAR(100) UNIQUE NOT NULL,
      "date" VARCHAR(50) NOT NULL,
      "expiryDate" VARCHAR(50),
      "customerId" VARCHAR(50) REFERENCES customers("id") ON DELETE SET NULL,
      "customerName" VARCHAR(255),
      "status" VARCHAR(50) DEFAULT 'Pending',
      "items" JSONB NOT NULL,
      "subtotal" NUMERIC(12, 2) NOT NULL,
      "gstTotal" NUMERIC(12, 2) NOT NULL,
      "discount" NUMERIC(12, 2) DEFAULT 0.00,
      "grandTotal" NUMERIC(12, 2) NOT NULL,
      "terms" JSONB,
      "bankDetails" JSONB,
      "shareHash" VARCHAR(255)
    )
  `);

  // Clear preloaded initial customer and quotation rows if they exist, so that the user gets a completely clean slate
  console.log("Cleaning up old preloaded seed data from database...");
  await client.query(`DELETE FROM quotations WHERE id IN ('q-1001', 'q-1002')`);
  await client.query(`DELETE FROM customers WHERE id IN ('c1', 'c2', 'c3')`);
  await client.query(`DELETE FROM products WHERE id IN ('p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15')`);

  console.log("Checking if seed data is needed...");

  // Seed Settings (Unconditional ON CONFLICT DO NOTHING)
  console.log("Seeding default settings if needed...");
  await client.query(`
    INSERT INTO settings (
      "id", "storeName", "tagline", "established", "address", "phone", "email", 
      "gstin", "bankAccountNo", "bankIfsc", "bankName", "terms", "whatsappTemplate"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (id) DO NOTHING
  `, [
    'default',
    DEFAULT_SETTINGS.storeName,
    DEFAULT_SETTINGS.tagline,
    DEFAULT_SETTINGS.established,
    DEFAULT_SETTINGS.address,
    DEFAULT_SETTINGS.phone,
    DEFAULT_SETTINGS.email,
    DEFAULT_SETTINGS.gstin,
    DEFAULT_SETTINGS.bankAccountNo,
    DEFAULT_SETTINGS.bankIfsc,
    DEFAULT_SETTINGS.bankName,
    JSON.stringify(DEFAULT_SETTINGS.terms),
    DEFAULT_SETTINGS.whatsappTemplate
  ]);

  // Seed Products (Unconditional ON CONFLICT DO NOTHING)
  console.log("Seeding initial products if needed...");
  for (const p of INITIAL_PRODUCTS) {
    await client.query(`
      INSERT INTO products ("id", "name", "sku", "brand", "category", "price", "gst", "stock", "warranty")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO NOTHING
    `, [p.id, p.name, p.sku, p.brand, p.category, p.price, p.gst, p.stock, p.warranty]);
  }

  // Seed Customers (Unconditional ON CONFLICT DO NOTHING - guarantees c1/c2 exist for quotations)
  console.log("Seeding initial customers if needed...");
  for (const c of INITIAL_CUSTOMERS) {
    await client.query(`
      INSERT INTO customers ("id", "name", "phone", "email", "address", "gst")
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING
    `, [c.id, c.name, c.phone, c.email, c.address, c.gst]);
  }

  // Seed Quotations (Only if quotations table is empty)
  const quotationsRes = await client.query('SELECT COUNT(*) FROM quotations');
  if (parseInt(quotationsRes.rows[0].count, 10) === 0) {
    console.log("Seeding initial quotations...");
    for (const q of INITIAL_QUOTATIONS) {
      await client.query(`
        INSERT INTO quotations (
          "id", "quotationNumber", "date", "expiryDate", "customerId", "customerName", 
          "status", "items", "subtotal", "gstTotal", "discount", "grandTotal", "terms", "bankDetails", "shareHash"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO NOTHING
      `, [
        q.id, q.quotationNumber, q.date, q.expiryDate, q.customerId, q.customerName,
        q.status, JSON.stringify(q.items), q.subtotal, q.gstTotal, q.discount, q.grandTotal,
        JSON.stringify(q.terms), JSON.stringify(q.bankDetails), q.shareHash
      ]);
    }
  }

  console.log("Migrations and seeding complete!");
}

async function initializeDatabaseWithRetry(retries = 15, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Connecting to database (Attempt ${i + 1}/${retries})...`);
      const client = await pool.connect();
      console.log("✅ Successfully established database connection!");
      
      try {
        await runMigrations(client);
      } finally {
        client.release();
      }
      return; // Success
    } catch (err) {
      console.error(`Database connection attempt ${i + 1} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error("❌ Could not connect to the database after maximum retries. Migrations skipped.");
}

// Run DB Setup with Retry loop
initializeDatabaseWithRetry();

// ==========================================
// API ENDPOINTS
// ==========================================

// Health check
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'KPBabu Fullstack Server is running smoothly!' });
});

// ------------------------------------------
// 1. Settings Endpoints
// ------------------------------------------
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE id = $1', ['default']);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const s = req.body;
    const query = `
      UPDATE settings SET
        "storeName" = $1, "tagline" = $2, "established" = $3, "address" = $4,
        "phone" = $5, "email" = $6, "gstin" = $7, "bankAccountNo" = $8,
        "bankIfsc" = $9, "bankName" = $10, "terms" = $11, "whatsappTemplate" = $12
      WHERE id = 'default'
      RETURNING *
    `;
    const result = await pool.query(query, [
      s.storeName, s.tagline, s.established, s.address,
      s.phone, s.email, s.gstin, s.bankAccountNo,
      s.bankIfsc, s.bankName, JSON.stringify(s.terms), s.whatsappTemplate
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ------------------------------------------
// 2. Products Endpoints (CRUD)
// ------------------------------------------
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const p = req.body;
    // Support bulk inserts (from Excel imports)
    if (Array.isArray(p)) {
      const inserted = [];
      for (const prod of p) {
        const result = await pool.query(`
          INSERT INTO products ("id", "name", "sku", "brand", "category", "price", "gst", "stock", "warranty")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `, [prod.id, prod.name, prod.sku, prod.brand, prod.category, prod.price, prod.gst, prod.stock, prod.warranty]);
        inserted.push(result.rows[0]);
      }
      return res.status(201).json(inserted);
    }

    // Single insert
    const result = await pool.query(`
      INSERT INTO products ("id", "name", "sku", "brand", "category", "price", "gst", "stock", "warranty")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [p.id, p.name, p.sku, p.brand, p.category, p.price, p.gst, p.stock, p.warranty]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    const result = await pool.query(`
      UPDATE products SET
        "name" = $1, "sku" = $2, "brand" = $3, "category" = $4,
        "price" = $5, "gst" = $6, "stock" = $7, "warranty" = $8
      WHERE "id" = $9
      RETURNING *
    `, [p.name, p.sku, p.brand, p.category, p.price, p.gst, p.stock, p.warranty, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE "id" = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully', product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ------------------------------------------
// 3. Customers Endpoints (CRUD)
// ------------------------------------------
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve customers' });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const c = req.body;
    const result = await pool.query(`
      INSERT INTO customers ("id", "name", "phone", "email", "address", "gst")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [c.id, c.name, c.phone, c.email, c.address, c.gst]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const c = req.body;
    const result = await pool.query(`
      UPDATE customers SET
        "name" = $1, "phone" = $2, "email" = $3, "address" = $4, "gst" = $5
      WHERE "id" = $6
      RETURNING *
    `, [c.name, c.phone, c.email, c.address, c.gst, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM customers WHERE "id" = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully', customer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ------------------------------------------
// 4. Quotations Endpoints (CRUD + Stock Trigger)
// ------------------------------------------
app.get('/api/quotations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quotations ORDER BY date DESC, "quotationNumber" DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve quotations' });
  }
});

app.post('/api/quotations', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const q = req.body;

    // Check if quotation already exists (for upserts)
    const exists = await client.query('SELECT status FROM quotations WHERE "id" = $1', [q.id]);
    
    let result;
    const isNew = exists.rows.length === 0;
    
    if (isNew) {
      // Insert new quotation
      result = await client.query(`
        INSERT INTO quotations (
          "id", "quotationNumber", "date", "expiryDate", "customerId", "customerName", 
          "status", "items", "subtotal", "gstTotal", "discount", "grandTotal", "terms", "bankDetails", "shareHash"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        q.id, q.quotationNumber, q.date, q.expiryDate, q.customerId, q.customerName,
        q.status || 'Pending', JSON.stringify(q.items), q.subtotal, q.gstTotal, q.discount, q.grandTotal,
        JSON.stringify(q.terms), JSON.stringify(q.bankDetails), q.shareHash
      ]);

      // Trigger: If quotation is created directly with "Approved" status, deduct stock levels
      if (q.status === 'Approved') {
        for (const item of q.items) {
          if (item.productId) {
            await client.query(`
              UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2
            `, [item.qty, item.productId]);
          }
        }
      }
    } else {
      // Update existing quotation
      const oldStatus = exists.rows[0].status;
      
      result = await client.query(`
        UPDATE quotations SET
          "quotationNumber" = $1, "date" = $2, "expiryDate" = $3, "customerId" = $4,
          "customerName" = $5, "status" = $6, "items" = $7, "subtotal" = $8,
          "gstTotal" = $9, "discount" = $10, "grandTotal" = $11, "terms" = $12,
          "bankDetails" = $13, "shareHash" = $14
        WHERE "id" = $15
        RETURNING *
      `, [
        q.quotationNumber, q.date, q.expiryDate, q.customerId, q.customerName,
        q.status, JSON.stringify(q.items), q.subtotal, q.gstTotal, q.discount, q.grandTotal,
        JSON.stringify(q.terms), JSON.stringify(q.bankDetails), q.shareHash, q.id
      ]);

      // Trigger: If status changed from something else to "Approved", deduct stock levels
      if (q.status === 'Approved' && oldStatus !== 'Approved') {
        for (const item of q.items) {
          if (item.productId) {
            await client.query(`
              UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2
            `, [item.qty, item.productId]);
          }
        }
      }
    }

    await client.query('COMMIT');
    res.status(isNew ? 201 : 200).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to save quotation record' });
  } finally {
    client.release();
  }
});

app.delete('/api/quotations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM quotations WHERE "id" = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation record not found' });
    }
    res.json({ message: 'Quotation deleted successfully', quotation: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete quotation record' });
  }
});

// ------------------------------------------
// 5. Public Viewing Endpoint (No Auth)
// ------------------------------------------
app.get('/api/public-quotation/:shareHash', async (req, res) => {
  try {
    const { shareHash } = req.params;
    
    // Fetch quotation matching hash
    const quoteRes = await pool.query('SELECT * FROM quotations WHERE "shareHash" = $1', [shareHash]);
    if (quoteRes.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation link invalid or expired' });
    }
    
    const quotation = quoteRes.rows[0];
    
    // Fetch settings to supply brand styling
    const settingsRes = await pool.query('SELECT * FROM settings WHERE id = $1', ['default']);
    const settings = settingsRes.rows[0] || null;

    // Fetch customer list or the single linked customer
    const customersRes = await pool.query('SELECT * FROM customers');
    
    res.json({
      quotation,
      settings,
      customers: customersRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compile public quotation view' });
  }
});

// ==========================================
// PRODUCTION FRONTEND SERVING
// ==========================================

if (isProduction) {
  // Serve the React build artifact 'dist' statically
  app.use(express.static(path.join(__dirname, 'dist')));

  // Support frontend deep-link direct routing via fallback
  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

// Start Listening
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 KPBabu Server running on port ${PORT}`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================`);
});
