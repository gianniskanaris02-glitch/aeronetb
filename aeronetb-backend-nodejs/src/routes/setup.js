const express = require('express');
const router = express.Router();
const { getPool } = require('../database/postgresql');

// ONE-TIME SETUP ROUTE
// Visit: https://aeronetb-backend.onrender.com/api/setup/init
// DELETE THIS FILE AFTER RUNNING!

router.get('/init', async (req, res) => {
  const pool = getPool();
  const client = await pool.connect();
  const results = [];

  try {
    // ============================================
    // CREATE TABLES
    // ============================================

    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        role_id SERIAL PRIMARY KEY,
        role_name VARCHAR(100) UNIQUE NOT NULL,
        role_description TEXT,
        access_level INTEGER NOT NULL CHECK (access_level BETWEEN 1 AND 10),
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('✅ roles table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role_id INTEGER REFERENCES roles(role_id),
        department VARCHAR(100),
        phone_number VARCHAR(50),
        hire_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('✅ users table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        supplier_id SERIAL PRIMARY KEY,
        supplier_name VARCHAR(200) UNIQUE NOT NULL,
        supplier_type VARCHAR(50) NOT NULL CHECK (supplier_type IN ('Tier 1', 'Tier 2', 'Tier 3')),
        country VARCHAR(100) NOT NULL,
        certification_level VARCHAR(100),
        contact_email VARCHAR(150) UNIQUE NOT NULL,
        contact_phone VARCHAR(50),
        address TEXT,
        registration_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Under Review')),
        performance_rating DECIMAL(3,2) CHECK (performance_rating BETWEEN 0 AND 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('✅ suppliers table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS parts (
        part_id SERIAL PRIMARY KEY,
        part_number VARCHAR(100) UNIQUE NOT NULL,
        part_name VARCHAR(200) NOT NULL,
        part_category VARCHAR(100) NOT NULL CHECK (part_category IN ('Fuselage', 'Wing', 'Engine', 'Avionics', 'Landing Gear', 'Other')),
        description TEXT,
        material_type VARCHAR(100),
        weight_kg DECIMAL(10,3),
        dimensions VARCHAR(100),
        unit_cost DECIMAL(12,2),
        lead_time_days INTEGER,
        criticality_level VARCHAR(50) NOT NULL CHECK (criticality_level IN ('Critical', 'High', 'Medium', 'Low')),
        revision_number VARCHAR(50),
        created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('✅ parts table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        warehouse_id SERIAL PRIMARY KEY,
        warehouse_name VARCHAR(150) NOT NULL,
        location_city VARCHAR(100),
        location_country VARCHAR(100),
        warehouse_type VARCHAR(50) NOT NULL CHECK (warehouse_type IN ('Central', 'Regional', 'Supplier-Managed')),
        capacity_sqm DECIMAL(10,2),
        manager_name VARCHAR(150),
        contact_number VARCHAR(50),
        operating_hours VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('✅ warehouses table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        po_id SERIAL PRIMARY KEY,
        po_number VARCHAR(100) UNIQUE NOT NULL,
        supplier_id INTEGER REFERENCES suppliers(supplier_id),
        order_date DATE DEFAULT CURRENT_DATE,
        expected_delivery_date DATE,
        actual_delivery_date DATE,
        po_status VARCHAR(50) DEFAULT 'Draft' CHECK (po_status IN ('Draft', 'Approved', 'In Transit', 'Delivered', 'Cancelled', 'On Hold')),
        total_amount DECIMAL(15,2),
        currency VARCHAR(10) DEFAULT 'USD',
        payment_terms VARCHAR(100),
        shipping_method VARCHAR(100),
        delivery_location VARCHAR(200),
        created_by INTEGER REFERENCES users(user_id),
        approved_by INTEGER REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('✅ purchase_orders table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_line_items (
        line_item_id SERIAL PRIMARY KEY,
        po_id INTEGER REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
        part_id INTEGER REFERENCES parts(part_id),
        quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
        unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
        line_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
        delivery_schedule DATE
      )
    `);
    results.push('✅ order_line_items table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        inventory_id SERIAL PRIMARY KEY,
        part_id INTEGER REFERENCES parts(part_id),
        warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
        quantity_on_hand INTEGER DEFAULT 0 CHECK (quantity_on_hand >= 0),
        quantity_reserved INTEGER DEFAULT 0 CHECK (quantity_reserved >= 0),
        quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
        reorder_level INTEGER DEFAULT 100,
        maximum_stock_level INTEGER DEFAULT 1000,
        last_stock_count_date DATE,
        location_bin VARCHAR(50),
        batch_number VARCHAR(100),
        receiving_date DATE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(part_id, warehouse_id, batch_number)
      )
    `);
    results.push('✅ inventory table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS quality_inspections (
        inspection_id SERIAL PRIMARY KEY,
        part_id INTEGER REFERENCES parts(part_id),
        po_id INTEGER REFERENCES purchase_orders(po_id),
        inspector_id INTEGER REFERENCES users(user_id),
        inspection_date DATE DEFAULT CURRENT_DATE,
        inspection_type VARCHAR(50) NOT NULL CHECK (inspection_type IN ('Incoming', 'In-Process', 'Final', 'Audit')),
        inspection_status VARCHAR(50) DEFAULT 'Pending' CHECK (inspection_status IN ('Pass', 'Fail', 'Conditional Pass', 'Pending')),
        defect_count INTEGER DEFAULT 0,
        conformance_percentage DECIMAL(5,2),
        inspection_notes TEXT,
        corrective_action_required BOOLEAN DEFAULT FALSE,
        approved_by INTEGER REFERENCES users(user_id),
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('✅ quality_inspections table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS defects (
        defect_id SERIAL PRIMARY KEY,
        inspection_id INTEGER REFERENCES quality_inspections(inspection_id),
        defect_type VARCHAR(100) NOT NULL,
        defect_severity VARCHAR(50) NOT NULL CHECK (defect_severity IN ('Critical', 'Major', 'Minor')),
        defect_description TEXT,
        quantity_affected INTEGER,
        corrective_action TEXT,
        status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
        reported_date DATE DEFAULT CURRENT_DATE
      )
    `);
    results.push('✅ defects table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS certifications (
        certification_id SERIAL PRIMARY KEY,
        certification_name VARCHAR(200) NOT NULL,
        certification_body VARCHAR(200),
        certification_standard VARCHAR(100),
        description TEXT,
        is_immutable BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('✅ certifications table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_certifications (
        supplier_cert_id SERIAL PRIMARY KEY,
        supplier_id INTEGER REFERENCES suppliers(supplier_id),
        certification_id INTEGER REFERENCES certifications(certification_id),
        issue_date DATE NOT NULL,
        expiry_date DATE,
        certification_status VARCHAR(50) DEFAULT 'Active',
        certificate_number VARCHAR(100),
        auditor_name VARCHAR(150),
        UNIQUE(supplier_id, certification_id, certificate_number)
      )
    `);
    results.push('✅ supplier_certifications table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_parts (
        supplier_part_id SERIAL PRIMARY KEY,
        supplier_id INTEGER REFERENCES suppliers(supplier_id),
        part_id INTEGER REFERENCES parts(part_id),
        supplier_part_number VARCHAR(100),
        unit_price DECIMAL(12,2),
        lead_time_days INTEGER,
        minimum_order_quantity INTEGER DEFAULT 1,
        is_preferred_supplier BOOLEAN DEFAULT FALSE,
        UNIQUE(supplier_id, part_id)
      )
    `);
    results.push('✅ supplier_parts table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        shipment_id SERIAL PRIMARY KEY,
        po_id INTEGER REFERENCES purchase_orders(po_id),
        shipment_number VARCHAR(100) UNIQUE NOT NULL,
        carrier_name VARCHAR(150),
        tracking_number VARCHAR(200),
        shipment_date DATE,
        estimated_arrival_date DATE,
        actual_arrival_date DATE,
        shipment_status VARCHAR(50) DEFAULT 'Pending',
        destination_warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    results.push('✅ shipments table ready');

    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_performance (
        performance_id SERIAL PRIMARY KEY,
        supplier_id INTEGER REFERENCES suppliers(supplier_id),
        evaluation_date DATE DEFAULT CURRENT_DATE,
        on_time_delivery_rate DECIMAL(5,2),
        quality_rating DECIMAL(3,2),
        responsiveness_rating DECIMAL(3,2),
        overall_rating DECIMAL(3,2),
        evaluator_id INTEGER REFERENCES users(user_id),
        notes TEXT
      )
    `);
    results.push('✅ supplier_performance table ready');

    // ============================================
    // INSERT SEED DATA
    // ============================================

    await client.query(`
      INSERT INTO roles (role_name, role_description, access_level) VALUES
      ('Administrator', 'Full system access', 10),
      ('Supply Chain Manager', 'Manage suppliers and procurement', 7),
      ('Procurement Officer', 'Create and manage purchase orders', 5),
      ('Quality Inspector', 'Perform quality inspections', 5),
      ('Quality Manager', 'Approve quality reports', 7),
      ('Warehouse Manager', 'Manage inventory and warehouse', 6),
      ('Equipment Engineer', 'Manage IoT devices', 4),
      ('Auditor', 'Read-only access', 3)
      ON CONFLICT (role_name) DO NOTHING
    `);
    results.push('✅ Roles seeded');

    await client.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, department) VALUES
      ('admin', 'admin@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'User', 1, 'IT'),
      ('scmanager', 'sc.manager@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sarah', 'Chen', 2, 'Supply Chain'),
      ('jsmith', 'john.smith@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John', 'Smith', 3, 'Procurement'),
      ('ainspector', 'alice.inspector@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Alice', 'Johnson', 4, 'Quality'),
      ('rjohnson', 'robert.johnson@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Robert', 'Johnson', 5, 'Quality'),
      ('wmanager', 'warehouse.mgr@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Michael', 'Davis', 6, 'Warehouse'),
      ('eengineer', 'equipment.eng@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'David', 'Martinez', 7, 'Engineering'),
      ('auditor', 'auditor@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Emily', 'Wilson', 8, 'Compliance')
      ON CONFLICT (username) DO NOTHING
    `);
    results.push('✅ Users seeded (password: password123)');

    await client.query(`
      INSERT INTO suppliers (supplier_name, supplier_type, country, contact_email, contact_phone, status, performance_rating, certification_level) VALUES
      ('Precision Aerospace Components Inc.', 'Tier 1', 'United States', 'contact@precisionaero.com', '+1-425-555-1001', 'Active', 4.7, 'AS9100D'),
      ('TitaniumTech GmbH', 'Tier 1', 'Germany', 'info@titaniumtech.de', '+49-89-555-2001', 'Active', 4.5, 'AS9100D'),
      ('Global Parts Distribution Ltd', 'Tier 2', 'United Kingdom', 'sales@globalparts.co.uk', '+44-20-555-3001', 'Active', 4.2, 'ISO 9001:2015'),
      ('Asian Manufacturing Solutions', 'Tier 2', 'Japan', 'contact@asianmfg.jp', '+81-3-555-4001', 'Active', 4.3, 'AS9100D'),
      ('MetalWorks Industries', 'Tier 3', 'Canada', 'info@metalworks.ca', '+1-604-555-5001', 'Active', 4.0, 'ISO 9001:2015'),
      ('Composite Materials Corp', 'Tier 1', 'United States', 'sales@compositematerials.com', '+1-310-555-6001', 'Active', 4.6, 'AS9100D'),
      ('Euro Aviation Supply', 'Tier 2', 'France', 'contact@euroaviation.fr', '+33-1-555-7001', 'Active', 4.1, 'EN 9100'),
      ('Pacific Fasteners Ltd', 'Tier 3', 'China', 'sales@pacificfasteners.cn', '+86-21-555-8001', 'Under Review', 3.8, 'ISO 9001:2015')
      ON CONFLICT (supplier_name) DO NOTHING
    `);
    results.push('✅ Suppliers seeded');

    await client.query(`
      INSERT INTO parts (part_number, part_name, part_category, material_type, weight_kg, unit_cost, lead_time_days, criticality_level) VALUES
      ('AeroNetB-WB-Ti-25-001', 'Wing Attachment Bolt - Titanium', 'Wing', 'Titanium Alloy', 0.0045, 12.50, 45, 'Critical'),
      ('AeroNetB-FS-AL-100-045', 'Fuselage Panel - Aluminum', 'Fuselage', 'Aluminum Alloy', 2.350, 450.00, 60, 'High'),
      ('AeroNetB-AV-EC-200-012', 'Flight Control Avionics Unit', 'Avionics', 'Electronic Components', 3.500, 2500.00, 90, 'Critical'),
      ('AeroNetB-LG-ST-50-078', 'Landing Gear Strut Assembly', 'Landing Gear', 'Steel Alloy', 45.000, 8500.00, 120, 'Critical'),
      ('AeroNetB-WG-CP-300-023', 'Wing Composite Panel', 'Wing', 'Carbon Fiber Composite', 5.200, 3200.00, 75, 'High'),
      ('AeroNetB-EN-TB-400-056', 'Turbine Blade Set', 'Engine', 'Nickel Superalloy', 8.900, 15000.00, 150, 'Critical'),
      ('AeroNetB-FS-RM-150-089', 'Fuselage Reinforcement Rib', 'Fuselage', 'Titanium Alloy', 1.800, 680.00, 50, 'High'),
      ('AeroNetB-AV-DS-75-034', 'Digital Display Screen', 'Avionics', 'LCD Display', 0.850, 1200.00, 60, 'Medium'),
      ('AeroNetB-HY-PM-200-045', 'Hydraulic Pump Assembly', 'Other', 'Steel/Aluminum', 12.500, 4500.00, 90, 'High'),
      ('AeroNetB-EL-WH-500-067', 'Electrical Wiring Harness', 'Other', 'Copper/Polymer', 3.200, 850.00, 45, 'Medium')
      ON CONFLICT (part_number) DO NOTHING
    `);
    results.push('✅ Parts seeded');

    await client.query(`
      INSERT INTO warehouses (warehouse_name, location_city, location_country, warehouse_type, capacity_sqm, manager_name) VALUES
      ('Seattle Distribution Center', 'Seattle', 'United States', 'Central', 15000.00, 'Michael Davis'),
      ('Everett Manufacturing Facility', 'Everett', 'United States', 'Central', 25000.00, 'Jennifer Lee'),
      ('Frankfurt Regional Hub', 'Frankfurt', 'Germany', 'Regional', 8000.00, 'Klaus Schmidt'),
      ('Tokyo Parts Center', 'Tokyo', 'Japan', 'Regional', 6000.00, 'Yuki Tanaka'),
      ('London Distribution', 'London', 'United Kingdom', 'Regional', 5000.00, 'James Williams')
    `);
    results.push('✅ Warehouses seeded');

    await client.query(`
      INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_delivery_date, po_status, total_amount, payment_terms, created_by, approved_by) VALUES
      ('PO-2026-0001', 1, '2026-03-01', '2026-04-15', 'Approved', 12500.00, 'Net 30', 3, 2),
      ('PO-2026-0002', 2, '2026-03-05', '2026-05-05', 'Approved', 68000.00, 'Net 45', 3, 2),
      ('PO-2026-0003', 3, '2026-03-10', '2026-06-10', 'In Transit', 50000.00, 'Net 30', 3, 2),
      ('PO-2026-0004', 1, '2026-03-15', '2026-04-30', 'Approved', 22500.00, 'Net 30', 3, 2),
      ('PO-2026-0005', 6, '2026-03-20', '2026-06-05', 'Draft', 64000.00, 'Net 30', 3, NULL)
      ON CONFLICT (po_number) DO NOTHING
    `);
    results.push('✅ Purchase orders seeded');

    await client.query(`
      INSERT INTO inventory (part_id, warehouse_id, quantity_on_hand, quantity_reserved, reorder_level, batch_number, receiving_date) VALUES
      (1, 1, 2500, 500, 1000, '2026-01-001', '2026-01-15'),
      (2, 1, 150, 30, 50, '2026-01-002', '2026-01-20'),
      (3, 1, 45, 10, 20, '2026-02-003', '2026-02-15'),
      (4, 2, 8, 2, 5, '2026-01-004', '2026-01-25'),
      (5, 1, 60, 15, 30, '2026-02-005', '2026-02-20')
    `);
    results.push('✅ Inventory seeded');

    await client.query(`
      INSERT INTO quality_inspections (part_id, po_id, inspector_id, inspection_date, inspection_type, inspection_status, conformance_percentage) VALUES
      (1, 1, 4, '2026-04-16', 'Incoming', 'Pass', 100.00),
      (2, 4, 4, '2026-05-01', 'Incoming', 'Pass', 100.00),
      (3, 3, 4, '2026-06-11', 'Incoming', 'Conditional Pass', 98.50)
    `);
    results.push('✅ Quality inspections seeded');

    results.push('');
    results.push('🎉 DATABASE SETUP COMPLETE!');
    results.push('Login: admin / password123');

    res.json({
      success: true,
      message: 'Database setup completed successfully!',
      results,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Setup failed',
      error: error.message,
      results,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
