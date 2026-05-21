const express = require('express');
const router = express.Router();
const { getPool } = require('../database/postgresql');

// ============================================
// POSTGRESQL SETUP ROUTE
// GET /api/setup/init
// ============================================
router.get('/init', async (req, res) => {
  const pool = getPool();
  const client = await pool.connect();
  const results = [];

  try {
    await client.query(`CREATE TABLE IF NOT EXISTS roles (role_id SERIAL PRIMARY KEY, role_name VARCHAR(100) UNIQUE NOT NULL, role_description TEXT, access_level INTEGER NOT NULL CHECK (access_level BETWEEN 1 AND 10), created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    results.push('✅ roles table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS users (user_id SERIAL PRIMARY KEY, username VARCHAR(100) UNIQUE NOT NULL, email VARCHAR(150) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, first_name VARCHAR(100), last_name VARCHAR(100), role_id INTEGER REFERENCES roles(role_id), department VARCHAR(100), phone_number VARCHAR(50), hire_date DATE, is_active BOOLEAN DEFAULT TRUE, last_login TIMESTAMP, created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    results.push('✅ users table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS suppliers (supplier_id SERIAL PRIMARY KEY, supplier_name VARCHAR(200) UNIQUE NOT NULL, supplier_type VARCHAR(50) NOT NULL CHECK (supplier_type IN ('Tier 1', 'Tier 2', 'Tier 3')), country VARCHAR(100) NOT NULL, certification_level VARCHAR(100), contact_email VARCHAR(150) UNIQUE NOT NULL, contact_phone VARCHAR(50), address TEXT, registration_date DATE DEFAULT CURRENT_DATE, status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Under Review')), performance_rating DECIMAL(3,2) CHECK (performance_rating BETWEEN 0 AND 5), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    results.push('✅ suppliers table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS parts (part_id SERIAL PRIMARY KEY, part_number VARCHAR(100) UNIQUE NOT NULL, part_name VARCHAR(200) NOT NULL, part_category VARCHAR(100) NOT NULL CHECK (part_category IN ('Fuselage', 'Wing', 'Engine', 'Avionics', 'Landing Gear', 'Other')), description TEXT, material_type VARCHAR(100), weight_kg DECIMAL(10,3), dimensions VARCHAR(100), unit_cost DECIMAL(12,2), lead_time_days INTEGER, criticality_level VARCHAR(50) NOT NULL CHECK (criticality_level IN ('Critical', 'High', 'Medium', 'Low')), revision_number VARCHAR(50), created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    results.push('✅ parts table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS warehouses (warehouse_id SERIAL PRIMARY KEY, warehouse_name VARCHAR(150) NOT NULL, location_city VARCHAR(100), location_country VARCHAR(100), warehouse_type VARCHAR(50) NOT NULL CHECK (warehouse_type IN ('Central', 'Regional', 'Supplier-Managed')), capacity_sqm DECIMAL(10,2), manager_name VARCHAR(150), contact_number VARCHAR(50), operating_hours VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    results.push('✅ warehouses table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS purchase_orders (po_id SERIAL PRIMARY KEY, po_number VARCHAR(100) UNIQUE NOT NULL, supplier_id INTEGER REFERENCES suppliers(supplier_id), order_date DATE DEFAULT CURRENT_DATE, expected_delivery_date DATE, actual_delivery_date DATE, po_status VARCHAR(50) DEFAULT 'Draft' CHECK (po_status IN ('Draft', 'Approved', 'In Transit', 'Delivered', 'Cancelled', 'On Hold')), total_amount DECIMAL(15,2), currency VARCHAR(10) DEFAULT 'USD', payment_terms VARCHAR(100), shipping_method VARCHAR(100), delivery_location VARCHAR(200), created_by INTEGER REFERENCES users(user_id), approved_by INTEGER REFERENCES users(user_id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    results.push('✅ purchase_orders table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS order_line_items (line_item_id SERIAL PRIMARY KEY, po_id INTEGER REFERENCES purchase_orders(po_id) ON DELETE CASCADE, part_id INTEGER REFERENCES parts(part_id), quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0), unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0), line_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED, delivery_schedule DATE)`);
    results.push('✅ order_line_items table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS inventory (inventory_id SERIAL PRIMARY KEY, part_id INTEGER REFERENCES parts(part_id), warehouse_id INTEGER REFERENCES warehouses(warehouse_id), quantity_on_hand INTEGER DEFAULT 0 CHECK (quantity_on_hand >= 0), quantity_reserved INTEGER DEFAULT 0 CHECK (quantity_reserved >= 0), quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED, reorder_level INTEGER DEFAULT 100, maximum_stock_level INTEGER DEFAULT 1000, last_stock_count_date DATE, location_bin VARCHAR(50), batch_number VARCHAR(100), receiving_date DATE, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(part_id, warehouse_id, batch_number))`);
    results.push('✅ inventory table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS quality_inspections (inspection_id SERIAL PRIMARY KEY, part_id INTEGER REFERENCES parts(part_id), po_id INTEGER REFERENCES purchase_orders(po_id), inspector_id INTEGER REFERENCES users(user_id), inspection_date DATE DEFAULT CURRENT_DATE, inspection_type VARCHAR(50) NOT NULL CHECK (inspection_type IN ('Incoming', 'In-Process', 'Final', 'Audit')), inspection_status VARCHAR(50) DEFAULT 'Pending' CHECK (inspection_status IN ('Pass', 'Fail', 'Conditional Pass', 'Pending')), defect_count INTEGER DEFAULT 0, conformance_percentage DECIMAL(5,2), inspection_notes TEXT, corrective_action_required BOOLEAN DEFAULT FALSE, approved_by INTEGER REFERENCES users(user_id), approved_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    results.push('✅ quality_inspections table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS defects (defect_id SERIAL PRIMARY KEY, inspection_id INTEGER REFERENCES quality_inspections(inspection_id), defect_type VARCHAR(100) NOT NULL, defect_severity VARCHAR(50) NOT NULL CHECK (defect_severity IN ('Critical', 'Major', 'Minor')), defect_description TEXT, quantity_affected INTEGER, corrective_action TEXT, status VARCHAR(50) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')), reported_date DATE DEFAULT CURRENT_DATE)`);
    results.push('✅ defects table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS certifications (certification_id SERIAL PRIMARY KEY, certification_name VARCHAR(200) NOT NULL, certification_body VARCHAR(200), certification_standard VARCHAR(100), description TEXT, is_immutable BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    results.push('✅ certifications table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS supplier_certifications (supplier_cert_id SERIAL PRIMARY KEY, supplier_id INTEGER REFERENCES suppliers(supplier_id), certification_id INTEGER REFERENCES certifications(certification_id), issue_date DATE NOT NULL, expiry_date DATE, certification_status VARCHAR(50) DEFAULT 'Active', certificate_number VARCHAR(100), auditor_name VARCHAR(150), UNIQUE(supplier_id, certification_id, certificate_number))`);
    results.push('✅ supplier_certifications table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS supplier_parts (supplier_part_id SERIAL PRIMARY KEY, supplier_id INTEGER REFERENCES suppliers(supplier_id), part_id INTEGER REFERENCES parts(part_id), supplier_part_number VARCHAR(100), unit_price DECIMAL(12,2), lead_time_days INTEGER, minimum_order_quantity INTEGER DEFAULT 1, is_preferred_supplier BOOLEAN DEFAULT FALSE, UNIQUE(supplier_id, part_id))`);
    results.push('✅ supplier_parts table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS shipments (shipment_id SERIAL PRIMARY KEY, po_id INTEGER REFERENCES purchase_orders(po_id), shipment_number VARCHAR(100) UNIQUE NOT NULL, carrier_name VARCHAR(150), tracking_number VARCHAR(200), shipment_date DATE, estimated_arrival_date DATE, actual_arrival_date DATE, shipment_status VARCHAR(50) DEFAULT 'Pending', destination_warehouse_id INTEGER REFERENCES warehouses(warehouse_id), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
    results.push('✅ shipments table ready');
    await client.query(`CREATE TABLE IF NOT EXISTS supplier_performance (performance_id SERIAL PRIMARY KEY, supplier_id INTEGER REFERENCES suppliers(supplier_id), evaluation_date DATE DEFAULT CURRENT_DATE, on_time_delivery_rate DECIMAL(5,2), quality_rating DECIMAL(3,2), responsiveness_rating DECIMAL(3,2), overall_rating DECIMAL(3,2), evaluator_id INTEGER REFERENCES users(user_id), notes TEXT)`);
    results.push('✅ supplier_performance table ready');

    // Seed data
    const hash = '$2a$10$Z8La0lYrwvt324dOLQVoOuk991SfuE6x76Z8TUJZmciEDtMxUk2sq';
    await client.query(`INSERT INTO roles (role_name, role_description, access_level) VALUES ('Administrator','Full system access',10),('Supply Chain Manager','Manage suppliers and procurement',7),('Procurement Officer','Create and manage purchase orders',5),('Quality Inspector','Perform quality inspections',5),('Quality Manager','Approve quality reports',7),('Warehouse Manager','Manage inventory and warehouse',6),('Equipment Engineer','Manage IoT devices',4),('Auditor','Read-only access',3) ON CONFLICT (role_name) DO NOTHING`);
    results.push('✅ Roles seeded');
    await client.query(`INSERT INTO users (username,email,password_hash,first_name,last_name,role_id,department) VALUES ('admin','admin@aeronetb.com',$1,'Admin','User',1,'IT'),('scmanager','sc.manager@aeronetb.com',$1,'Sarah','Chen',2,'Supply Chain'),('jsmith','john.smith@aeronetb.com',$1,'John','Smith',3,'Procurement'),('ainspector','alice.inspector@aeronetb.com',$1,'Alice','Johnson',4,'Quality'),('rjohnson','robert.johnson@aeronetb.com',$1,'Robert','Johnson',5,'Quality'),('wmanager','warehouse.mgr@aeronetb.com',$1,'Michael','Davis',6,'Warehouse'),('eengineer','equipment.eng@aeronetb.com',$1,'David','Martinez',7,'Engineering'),('auditor','auditor@aeronetb.com',$1,'Emily','Wilson',8,'Compliance') ON CONFLICT (username) DO NOTHING`,[hash]);
    results.push('✅ Users seeded (password: password123)');
    await client.query(`INSERT INTO suppliers (supplier_name,supplier_type,country,contact_email,contact_phone,status,performance_rating,certification_level) VALUES ('Precision Aerospace Components Inc.','Tier 1','United States','contact@precisionaero.com','+1-425-555-1001','Active',4.7,'AS9100D'),('TitaniumTech GmbH','Tier 1','Germany','info@titaniumtech.de','+49-89-555-2001','Active',4.5,'AS9100D'),('Global Parts Distribution Ltd','Tier 2','United Kingdom','sales@globalparts.co.uk','+44-20-555-3001','Active',4.2,'ISO 9001:2015'),('Asian Manufacturing Solutions','Tier 2','Japan','contact@asianmfg.jp','+81-3-555-4001','Active',4.3,'AS9100D'),('MetalWorks Industries','Tier 3','Canada','info@metalworks.ca','+1-604-555-5001','Active',4.0,'ISO 9001:2015'),('Composite Materials Corp','Tier 1','United States','sales@compositematerials.com','+1-310-555-6001','Active',4.6,'AS9100D'),('Euro Aviation Supply','Tier 2','France','contact@euroaviation.fr','+33-1-555-7001','Active',4.1,'EN 9100'),('Pacific Fasteners Ltd','Tier 3','China','sales@pacificfasteners.cn','+86-21-555-8001','Under Review',3.8,'ISO 9001:2015') ON CONFLICT (supplier_name) DO NOTHING`);
    results.push('✅ Suppliers seeded');
    await client.query(`INSERT INTO parts (part_number,part_name,part_category,material_type,weight_kg,unit_cost,lead_time_days,criticality_level) VALUES ('AeroNetB-WB-Ti-25-001','Wing Attachment Bolt - Titanium','Wing','Titanium Alloy',0.0045,12.50,45,'Critical'),('AeroNetB-FS-AL-100-045','Fuselage Panel - Aluminum','Fuselage','Aluminum Alloy',2.350,450.00,60,'High'),('AeroNetB-AV-EC-200-012','Flight Control Avionics Unit','Avionics','Electronic Components',3.500,2500.00,90,'Critical'),('AeroNetB-LG-ST-50-078','Landing Gear Strut Assembly','Landing Gear','Steel Alloy',45.000,8500.00,120,'Critical'),('AeroNetB-WG-CP-300-023','Wing Composite Panel','Wing','Carbon Fiber Composite',5.200,3200.00,75,'High'),('AeroNetB-EN-TB-400-056','Turbine Blade Set','Engine','Nickel Superalloy',8.900,15000.00,150,'Critical'),('AeroNetB-FS-RM-150-089','Fuselage Reinforcement Rib','Fuselage','Titanium Alloy',1.800,680.00,50,'High'),('AeroNetB-AV-DS-75-034','Digital Display Screen','Avionics','LCD Display',0.850,1200.00,60,'Medium'),('AeroNetB-HY-PM-200-045','Hydraulic Pump Assembly','Other','Steel/Aluminum',12.500,4500.00,90,'High'),('AeroNetB-EL-WH-500-067','Electrical Wiring Harness','Other','Copper/Polymer',3.200,850.00,45,'Medium') ON CONFLICT (part_number) DO NOTHING`);
    results.push('✅ Parts seeded');
    await client.query(`INSERT INTO warehouses (warehouse_name,location_city,location_country,warehouse_type,capacity_sqm,manager_name) VALUES ('Seattle Distribution Center','Seattle','United States','Central',15000.00,'Michael Davis'),('Everett Manufacturing Facility','Everett','United States','Central',25000.00,'Jennifer Lee'),('Frankfurt Regional Hub','Frankfurt','Germany','Regional',8000.00,'Klaus Schmidt'),('Tokyo Parts Center','Tokyo','Japan','Regional',6000.00,'Yuki Tanaka'),('London Distribution','London','United Kingdom','Regional',5000.00,'James Williams')`);
    results.push('✅ Warehouses seeded');
    await client.query(`INSERT INTO purchase_orders (po_number,supplier_id,order_date,expected_delivery_date,po_status,total_amount,payment_terms,created_by,approved_by) VALUES ('PO-2026-0001',1,'2026-03-01','2026-04-15','Approved',12500.00,'Net 30',3,2),('PO-2026-0002',2,'2026-03-05','2026-05-05','Approved',68000.00,'Net 45',3,2),('PO-2026-0003',3,'2026-03-10','2026-06-10','In Transit',50000.00,'Net 30',3,2),('PO-2026-0004',1,'2026-03-15','2026-04-30','Approved',22500.00,'Net 30',3,2),('PO-2026-0005',6,'2026-03-20','2026-06-05','Draft',64000.00,'Net 30',3,NULL) ON CONFLICT (po_number) DO NOTHING`);
    results.push('✅ Purchase orders seeded');
    await client.query(`INSERT INTO inventory (part_id,warehouse_id,quantity_on_hand,quantity_reserved,reorder_level,batch_number,receiving_date) VALUES (1,1,2500,500,1000,'2026-01-001','2026-01-15'),(2,1,150,30,50,'2026-01-002','2026-01-20'),(3,1,45,10,20,'2026-02-003','2026-02-15'),(4,2,8,2,5,'2026-01-004','2026-01-25'),(5,1,60,15,30,'2026-02-005','2026-02-20')`);
    results.push('✅ Inventory seeded');
    await client.query(`INSERT INTO quality_inspections (part_id,po_id,inspector_id,inspection_date,inspection_type,inspection_status,conformance_percentage) VALUES (1,1,4,'2026-04-16','Incoming','Pass',100.00),(2,4,4,'2026-05-01','Incoming','Pass',100.00),(3,3,4,'2026-06-11','Incoming','Conditional Pass',98.50)`);
    results.push('✅ Quality inspections seeded');

    results.push('');
    results.push('🎉 DATABASE SETUP COMPLETE!');
    results.push('Login: admin / password123');

    res.json({ success: true, message: 'Setup complete!', results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Setup failed', error: error.message, results });
  } finally {
    client.release();
  }
});

// Fix passwords
router.get('/fix-passwords', async (req, res) => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('password123', 10);
    await client.query(`UPDATE users SET password_hash = $1 WHERE username IN ('admin','scmanager','jsmith','ainspector','rjohnson','wmanager','eengineer','auditor')`, [hash]);
    const result = await client.query('SELECT username, role_id FROM users ORDER BY user_id');
    res.json({ success: true, message: 'Passwords fixed! Use: password123', users: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// ============================================
// MONGODB SETUP ROUTE
// GET /api/setup/mongodb
// ============================================
router.get('/mongodb', async (req, res) => {
  const results = [];
  try {
    const { getDB } = require('../database/mongodb');
    const db = getDB();

    // ── sensor_readings ──────────────────────────────────────────
    await db.collection('sensor_readings').createIndex({ timestamp: -1 });
    await db.collection('sensor_readings').createIndex({ device_id: 1, timestamp: -1 });
    await db.collection('sensor_readings').createIndex({ warehouse_id: 1, timestamp: -1 });
    await db.collection('sensor_readings').createIndex({ alert_triggered: 1, timestamp: -1 });
    await db.collection('sensor_readings').createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
    results.push('✅ sensor_readings indexes created');

    const now = new Date();
    const expire = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    await db.collection('sensor_readings').insertMany([
      {
        device_id: 'IOT-TEMP-001', device_type: 'temperature_monitor',
        warehouse_id: 1, facility_plant: 'Seattle Distribution Center', zone: 'Cold Storage - Section A',
        timestamp: new Date('2026-05-21T14:23:45Z'),
        reading_type: 'temperature', reading_value: 4.5, unit_of_measure: 'celsius',
        thresholds: { min: 2.0, max: 8.0, critical_min: 0.0, critical_max: 10.0 },
        alert_triggered: false, alert_severity: null,
        firmware_version: 'v2.4.1', battery_level: 87, signal_strength: -45,
        expireAt: expire
      },
      {
        device_id: 'IOT-VIB-042', device_type: 'vibration_sensor',
        warehouse_id: 2, facility_plant: 'Everett Manufacturing Facility', zone: 'CNC Machining - Bay 5',
        timestamp: new Date('2026-05-21T14:25:12Z'),
        reading_type: 'vibration', reading_value: 3.8, unit_of_measure: 'g_force',
        thresholds: { min: 0.0, max: 2.5, critical_min: 0.0, critical_max: 4.0 },
        alert_triggered: true, alert_severity: 'high',
        equipment_id: 78,
        vibration_data: { x_axis: 1.2, y_axis: 2.1, z_axis: 3.8, frequency_hz: 125.5 },
        firmware_version: 'v3.1.0', battery_level: 92, signal_strength: -38,
        expireAt: expire
      },
      {
        device_id: 'IOT-GPS-127', device_type: 'container_tracker',
        warehouse_id: null, facility_plant: null, zone: 'In Transit',
        timestamp: new Date('2026-05-21T14:30:00Z'),
        reading_type: 'gps_position', reading_value: null, unit_of_measure: 'coordinates',
        alert_triggered: false, alert_severity: null,
        shipment_id: 5023,
        gps_position: { latitude: 47.6062, longitude: -122.3321, altitude: 15.0, accuracy_meters: 5.2 },
        firmware_version: 'v1.8.2', battery_level: 78, signal_strength: -52,
        expireAt: expire
      },
      {
        device_id: 'IOT-TEMP-015', device_type: 'temperature_monitor',
        warehouse_id: 2, facility_plant: 'Everett Manufacturing Facility', zone: 'Engine Parts - Zone C',
        timestamp: new Date('2026-05-21T14:35:00Z'),
        reading_type: 'temperature', reading_value: 22.1, unit_of_measure: 'celsius',
        thresholds: { min: 15.0, max: 28.0, critical_min: 10.0, critical_max: 35.0 },
        alert_triggered: false, alert_severity: null,
        firmware_version: 'v2.4.1', battery_level: 65, signal_strength: -42,
        expireAt: expire
      },
      {
        device_id: 'IOT-TEMP-022', device_type: 'temperature_monitor',
        warehouse_id: 1, facility_plant: 'Seattle Distribution Center', zone: 'Chemical Storage - Section B',
        timestamp: new Date('2026-05-21T14:40:00Z'),
        reading_type: 'temperature', reading_value: 32.8, unit_of_measure: 'celsius',
        thresholds: { min: 15.0, max: 30.0, critical_min: 10.0, critical_max: 35.0 },
        alert_triggered: true, alert_severity: 'warning',
        firmware_version: 'v2.4.1', battery_level: 45, signal_strength: -58,
        expireAt: expire
      },
    ]);
    results.push('✅ sensor_readings: 5 documents inserted');

    // ── iot_devices ──────────────────────────────────────────────
    await db.collection('iot_devices').createIndex({ device_id: 1 }, { unique: true });
    await db.collection('iot_devices').createIndex({ 'warehouse.warehouse_id': 1 });
    await db.collection('iot_devices').createIndex({ status: 1 });

    await db.collection('iot_devices').insertMany([
      {
        device_id: 'IOT-TEMP-001', device_name: 'Cold Storage Temp Monitor - Section A',
        device_type: 'temperature_monitor', manufacturer: 'SensorTech Industries',
        model_number: 'ST-TEMP-5000', serial_number: 'SN-2025-TMP-00142',
        warehouse: { warehouse_id: 1, warehouse_name: 'Seattle Distribution Center', facility_plant: 'Seattle - Main', zone: 'Cold Storage - Section A', coordinates: { latitude: 47.6062, longitude: -122.3321 } },
        assigned_to_type: 'warehouse', assigned_to_id: 1, status: 'active',
        installation_date: new Date('2025-06-15'), last_maintenance_date: new Date('2026-02-10'),
        next_maintenance_due: new Date('2026-08-10'),
        specifications: { firmware_version: 'v2.4.1', hardware_version: 'H1.2', power_source: 'Battery', battery_life_months: 24, communication_protocol: 'LoRaWAN', sampling_rate_seconds: 300 },
        sensor_config: { reading_type: 'temperature', unit_of_measure: 'celsius', precision: 0.1, accuracy: '±0.2°C', range: { min: -40.0, max: 85.0 }, thresholds: { warning_min: 2.0, warning_max: 8.0, critical_min: 0.0, critical_max: 10.0 } },
        monitoring: { enabled: true, alert_emails: ['warehouse.manager@aeronetb.com'], escalation_threshold_minutes: 30, auto_acknowledge: false },
        network: { ip_address: '10.50.12.45', signal_strength_dbm: -45, last_online: new Date('2026-05-21T14:23:00Z'), uptime_percentage: 99.87 },
        maintenance_history: [{ maintenance_id: 'MAINT-2026-0042', date: new Date('2026-02-10'), type: 'Calibration', technician_name: 'Mike Johnson', description: 'Annual calibration and battery replacement', cost: 125.00, next_maintenance_due: new Date('2027-02-10') }],
        created_at: new Date('2025-06-14'), updated_at: new Date('2026-02-10')
      },
      {
        device_id: 'IOT-VIB-042', device_name: 'CNC Mill Vibration Monitor - Bay 5',
        device_type: 'vibration_sensor', manufacturer: 'Industrial IoT Solutions',
        model_number: 'IIS-VIB-300X', serial_number: 'SN-2024-VIB-00891',
        warehouse: { warehouse_id: 2, warehouse_name: 'Everett Manufacturing Facility', facility_plant: 'Everett - Production', zone: 'CNC Machining - Bay 5', coordinates: { latitude: 47.9790, longitude: -122.2021 } },
        assigned_to_type: 'equipment', assigned_to_id: 78, status: 'active',
        installation_date: new Date('2024-11-20'), last_maintenance_date: new Date('2026-01-15'),
        next_maintenance_due: new Date('2026-07-15'),
        specifications: { firmware_version: 'v3.1.0', hardware_version: 'H2.0', power_source: 'AC', communication_protocol: 'WiFi', sampling_rate_seconds: 1 },
        sensor_config: { reading_type: 'vibration', unit_of_measure: 'g_force', precision: 0.01, accuracy: '±0.05g', range: { min: 0.0, max: 16.0 }, thresholds: { warning_min: 0.0, warning_max: 2.5, critical_min: 0.0, critical_max: 4.0 } },
        monitoring: { enabled: true, alert_emails: ['production.manager@aeronetb.com'], escalation_threshold_minutes: 15, auto_acknowledge: false },
        network: { ip_address: '10.75.8.142', signal_strength_dbm: -38, last_online: new Date('2026-05-21T14:25:00Z'), uptime_percentage: 99.95 },
        maintenance_history: [{ maintenance_id: 'MAINT-2026-0018', date: new Date('2026-01-15'), type: 'Calibration', technician_name: 'David Martinez', description: 'Semi-annual calibration', cost: 175.00, next_maintenance_due: new Date('2026-07-15') }],
        created_at: new Date('2024-11-19'), updated_at: new Date('2026-01-15')
      },
      {
        device_id: 'IOT-GPS-127', device_name: 'Container Tracker - Shipment #5023',
        device_type: 'container_tracker', manufacturer: 'GlobalTrack Systems',
        model_number: 'GT-PRO-2000', serial_number: 'SN-2026-GPS-01127',
        warehouse: null, assigned_to_type: 'shipment', assigned_to_id: 5023, status: 'active',
        installation_date: new Date('2026-03-10'),
        specifications: { firmware_version: 'v1.8.2', power_source: 'Battery', battery_life_months: 6, communication_protocol: 'Cellular', sampling_rate_seconds: 1800 },
        sensor_config: { reading_type: 'gps_position', unit_of_measure: 'coordinates', accuracy: '±5 meters' },
        monitoring: { enabled: true, alert_emails: ['logistics@aeronetb.com'], escalation_threshold_minutes: 120, auto_acknowledge: false },
        network: { signal_strength_dbm: -52, last_online: new Date('2026-05-21T14:30:00Z'), uptime_percentage: 98.5 },
        maintenance_history: [],
        created_at: new Date('2026-03-09'), updated_at: new Date('2026-05-21')
      },
      {
        device_id: 'IOT-TEMP-015', device_name: 'Engine Parts Storage Monitor',
        device_type: 'temperature_monitor', manufacturer: 'SensorTech Industries',
        model_number: 'ST-TEMP-5000', serial_number: 'SN-2025-TMP-00158',
        warehouse: { warehouse_id: 2, warehouse_name: 'Everett Manufacturing Facility', zone: 'Engine Parts - Zone C' },
        assigned_to_type: 'warehouse', assigned_to_id: 2, status: 'active',
        installation_date: new Date('2025-08-01'),
        specifications: { firmware_version: 'v2.4.1', power_source: 'Battery', communication_protocol: 'LoRaWAN', sampling_rate_seconds: 300 },
        sensor_config: { reading_type: 'temperature', unit_of_measure: 'celsius', thresholds: { warning_min: 15.0, warning_max: 28.0, critical_min: 10.0, critical_max: 35.0 } },
        monitoring: { enabled: true, alert_emails: ['engineering@aeronetb.com'] },
        network: { signal_strength_dbm: -42, last_online: new Date('2026-05-21T14:35:00Z'), uptime_percentage: 99.1 },
        maintenance_history: [],
        created_at: new Date('2025-07-30'), updated_at: new Date('2026-05-21')
      },
      {
        device_id: 'IOT-TEMP-022', device_name: 'Chemical Storage Monitor',
        device_type: 'temperature_monitor', manufacturer: 'SensorTech Industries',
        model_number: 'ST-TEMP-5000', serial_number: 'SN-2025-TMP-00201',
        warehouse: { warehouse_id: 1, warehouse_name: 'Seattle Distribution Center', zone: 'Chemical Storage - Section B' },
        assigned_to_type: 'warehouse', assigned_to_id: 1, status: 'active',
        installation_date: new Date('2025-09-15'),
        specifications: { firmware_version: 'v2.4.1', power_source: 'Battery', communication_protocol: 'LoRaWAN', sampling_rate_seconds: 180 },
        sensor_config: { reading_type: 'temperature', unit_of_measure: 'celsius', thresholds: { warning_min: 15.0, warning_max: 30.0, critical_min: 10.0, critical_max: 35.0 } },
        monitoring: { enabled: true, alert_emails: ['safety@aeronetb.com', 'warehouse.manager@aeronetb.com'] },
        network: { signal_strength_dbm: -58, last_online: new Date('2026-05-21T14:40:00Z'), uptime_percentage: 97.3 },
        maintenance_history: [],
        created_at: new Date('2025-09-14'), updated_at: new Date('2026-05-21')
      },
    ]);
    results.push('✅ iot_devices: 5 documents inserted');

    // ── part_specifications ──────────────────────────────────────
    await db.collection('part_specifications').createIndex({ part_id: 1 }, { unique: true });
    await db.collection('part_specifications').createIndex({ part_number: 1 });
    await db.collection('part_specifications').createIndex({ status: 1 });

    await db.collection('part_specifications').insertMany([
      {
        part_id: 1, part_number: 'AeroNetB-WB-Ti-25-001',
        part_name: 'Wing Attachment Bolt - Titanium Ti-6Al-4V',
        current_version: '2.1', status: 'active',
        versions: [{
          version_number: '2.1', effective_date: new Date('2026-01-15'), status: 'active',
          specifications: {
            material: { primary: 'Titanium Alloy (Ti-6Al-4V)', coating: 'Anodized Type II (MIL-A-8625)', hardness: 'HRC 36-42' },
            dimensions: { length_mm: 25.0, diameter_mm: 8.0, tolerance: '±0.05mm', weight_kg: 0.0045 },
            mechanical_properties: { tensile_strength_mpa: 950.0, yield_strength_mpa: 880.0, elongation_percent: 14.0, fatigue_life_cycles: 1000000 },
            environmental: { operating_temp_min_c: -55, operating_temp_max_c: 120, salt_spray_resistance: '1000 hours per ASTM B117' }
          },
          compliance: { regulatory: ['FAA AC 25.571', 'EASA CS-25.571'], industry_standards: ['AS9100D', 'ISO 9001:2015'], material_standards: ['AMS 4911', 'ASTM B348'] },
          testing: {
            incoming_inspection: [{ test_name: 'Dimensional Verification', test_method: 'CMM per AS9102', acceptance_criteria: 'All dimensions within ±0.05mm', frequency: 'Every lot' }],
            non_destructive_testing: [{ ndt_method: 'X-ray Radiography', coverage: '100% of parts', acceptance_standard: 'No indications >0.5mm per AMS 2630' }]
          },
          change_reason: 'Updated anodizing specification to Type II for improved corrosion resistance',
          approved_by: 'Robert Johnson', approval_date: new Date('2026-01-12')
        }],
        supplier_requirements: [{ supplier_id: 1, supplier_name: 'Precision Aerospace Components Inc.', additional_requirements: { lead_time_days: 45, min_order_quantity: 500, special_instructions: 'Certificate of Conformance required with each shipment' } }],
        created_at: new Date('2025-01-10'), updated_at: new Date('2026-01-15')
      },
      {
        part_id: 3, part_number: 'AeroNetB-AV-EC-200-012',
        part_name: 'Flight Control Avionics Unit',
        current_version: '1.5', status: 'active',
        versions: [{
          version_number: '1.5', effective_date: new Date('2025-09-01'), status: 'active',
          specifications: {
            material: { primary: 'Aluminium Housing with Electronic Components', coating: 'Conformal Coating IPC-CC-830' },
            dimensions: { length_mm: 320.0, width_mm: 200.0, height_mm: 85.0, weight_kg: 3.5 },
            environmental: { operating_temp_min_c: -40, operating_temp_max_c: 85, altitude_max_ft: 50000, humidity_max_percent: 95 },
            electrical: { voltage_range: '28V DC ±2V', current_max_a: 12.0, power_rating_w: 336.0 }
          },
          compliance: { regulatory: ['FAA DO-178C', 'EASA CS-25 Avionics'], industry_standards: ['DO-254', 'RTCA DO-160G'] },
          testing: { functional_testing: [{ test_name: 'Environmental Stress Screening', acceptance_criteria: 'Full functional performance after 100hr thermal cycling', test_standard: 'RTCA DO-160G' }] },
          change_reason: 'Software version update to v1.5 firmware',
          approved_by: 'Engineering Director', approval_date: new Date('2025-08-28')
        }],
        created_at: new Date('2024-06-01'), updated_at: new Date('2025-09-01')
      },
      {
        part_id: 6, part_number: 'AeroNetB-EN-TB-400-056',
        part_name: 'Turbine Blade Set',
        current_version: '3.0', status: 'active',
        versions: [{
          version_number: '3.0', effective_date: new Date('2026-02-01'), status: 'active',
          specifications: {
            material: { primary: 'Nickel Superalloy (IN-718)', coating: 'Thermal Barrier Coating (TBC)', hardness: 'HRC 38-44' },
            dimensions: { length_mm: 180.0, weight_kg: 0.743 },
            mechanical_properties: { tensile_strength_mpa: 1380.0, yield_strength_mpa: 1180.0, fatigue_life_cycles: 5000000 },
            environmental: { operating_temp_min_c: -55, operating_temp_max_c: 980, altitude_max_ft: 43000 }
          },
          compliance: { regulatory: ['FAA AC 33.70', 'EASA CS-E'], material_standards: ['AMS 5664', 'ASTM B637'] },
          testing: { non_destructive_testing: [{ ndt_method: 'Fluorescent Penetrant Inspection', coverage: '100%', acceptance_standard: 'No linear indications per AMS 2644' }] },
          change_reason: 'TBC thickness increased for higher operating temperature tolerance',
          approved_by: 'Chief Engineer', approval_date: new Date('2026-01-28')
        }],
        created_at: new Date('2023-11-15'), updated_at: new Date('2026-02-01')
      },
    ]);
    results.push('✅ part_specifications: 3 documents inserted');

    // ── audit_logs ───────────────────────────────────────────────
    await db.collection('audit_logs').createIndex({ timestamp: -1 });
    await db.collection('audit_logs').createIndex({ 'user.user_id': 1, timestamp: -1 });
    await db.collection('audit_logs').createIndex({ 'entity.entity_type': 1 });
    await db.collection('audit_logs').createIndex({ 'security.anomaly_detected': 1 });

    const sevenYears = new Date();
    sevenYears.setFullYear(sevenYears.getFullYear() + 7);

    await db.collection('audit_logs').insertMany([
      {
        timestamp: new Date('2026-05-21T14:23:45Z'), action_type: 'CREATE',
        user: { user_id: 3, username: 'jsmith', email: 'john.smith@aeronetb.com', full_name: 'John Smith', role: 'Procurement Officer', department: 'Procurement' },
        session: { ip_address: '10.50.45.123', browser: 'Chrome 122', device_type: 'desktop', location: { country: 'Greece', city: 'Athens' } },
        entity: { entity_type: 'purchase_order', entity_id: 5, entity_name: 'PO-2026-0005', table_name: 'purchase_orders' },
        changes: [],
        snapshot: { before: null, after: { po_id: 5, po_number: 'PO-2026-0005', supplier_id: 6, po_status: 'Draft', total_amount: 64000.00 } },
        compliance: { requires_approval: true, compliance_level: 'SOX', retention_period_days: 2555, data_classification: 'internal' },
        security: { authentication_method: 'password', authorization_result: 'granted', risk_score: 12.5, anomaly_detected: false },
        expireAt: sevenYears
      },
      {
        timestamp: new Date('2026-05-21T14:44:00Z'), action_type: 'APPROVE',
        user: { user_id: 5, username: 'rjohnson', email: 'robert.johnson@aeronetb.com', full_name: 'Robert Johnson', role: 'Quality Manager', department: 'Quality' },
        session: { ip_address: '10.50.48.67', browser: 'Chrome 122', device_type: 'desktop', location: { country: 'Greece', city: 'Athens' } },
        entity: { entity_type: 'quality_inspection', entity_id: 1, entity_name: 'INS-0001', table_name: 'quality_inspections' },
        changes: [{ field: 'inspection_status', old_value: 'Pending', new_value: 'Pass', data_type: 'string' }, { field: 'approved_by', old_value: null, new_value: 5, data_type: 'number' }],
        snapshot: { before: { inspection_id: 1, inspection_status: 'Pending', approved_by: null }, after: { inspection_id: 1, inspection_status: 'Pass', approved_by: 5 } },
        compliance: { requires_approval: true, compliance_level: 'aerospace_regulatory', retention_period_days: 9125, data_classification: 'confidential' },
        security: { authentication_method: 'password', authorization_result: 'granted', risk_score: 8.2, anomaly_detected: false },
        expireAt: sevenYears
      },
      {
        timestamp: new Date('2026-05-21T15:05:00Z'), action_type: 'LOGIN',
        user: { user_id: 1, username: 'admin', email: 'admin@aeronetb.com', full_name: 'Admin User', role: 'Administrator', department: 'IT' },
        session: { ip_address: '10.50.10.1', browser: 'Chrome 122', device_type: 'desktop', location: { country: 'Greece', city: 'Athens' } },
        entity: { entity_type: 'session', entity_id: 1, entity_name: 'admin-login', table_name: 'users' },
        changes: [],
        snapshot: { before: null, after: null },
        compliance: { compliance_level: 'security_event', retention_period_days: 2555, data_classification: 'internal' },
        security: { authentication_method: 'password', authorization_result: 'granted', risk_score: 5.0, anomaly_detected: false },
        expireAt: sevenYears
      },
    ]);
    results.push('✅ audit_logs: 3 documents inserted');

    // ── alerts ───────────────────────────────────────────────────
    await db.collection('alerts').createIndex({ status: 1, timestamp: -1 });
    await db.collection('alerts').createIndex({ severity: 1 });
    await db.collection('alerts').createIndex({ 'source.device_id': 1 });

    await db.collection('alerts').insertMany([
      {
        alert_id: 'ALT-2026-05-0001', alert_type: 'sensor_threshold_exceeded', severity: 'high', status: 'active',
        created_at: new Date('2026-05-21T14:25:12Z'),
        source: { device_id: 'IOT-VIB-042', warehouse_id: 2, warehouse_name: 'Everett Manufacturing Facility', zone: 'CNC Machining - Bay 5' },
        details: { title: 'Excessive Vibration Detected on CNC Mill', description: 'CNC Mill vibration exceeded warning threshold. Z-axis reading: 3.8g (threshold: 2.5g)', current_value: 3.8, threshold_value: 2.5, unit: 'g_force' },
        risk: { risk_level: 'high', potential_impact: 'Equipment damage, part quality degradation, production stoppage', recommended_action: 'Inspect CNC machine bearings and spindle balance' },
        acknowledged_by: null, acknowledged_at: null, resolved_by: null, resolved_at: null
      },
      {
        alert_id: 'ALT-2026-05-0002', alert_type: 'sensor_threshold_exceeded', severity: 'warning', status: 'active',
        created_at: new Date('2026-05-21T14:40:00Z'),
        source: { device_id: 'IOT-TEMP-022', warehouse_id: 1, warehouse_name: 'Seattle Distribution Center', zone: 'Chemical Storage - Section B' },
        details: { title: 'Temperature Warning - Chemical Storage', description: 'Temperature approaching upper warning threshold. Current: 32.8°C (warning max: 30.0°C)', current_value: 32.8, threshold_value: 30.0, unit: 'celsius' },
        risk: { risk_level: 'medium', potential_impact: 'Chemical degradation, safety risk', recommended_action: 'Check HVAC system and increase ventilation in Section B' },
        acknowledged_by: null, acknowledged_at: null, resolved_by: null, resolved_at: null
      },
      {
        alert_id: 'ALT-2026-05-0003', alert_type: 'low_battery', severity: 'low', status: 'resolved',
        created_at: new Date('2026-05-20T08:00:00Z'),
        source: { device_id: 'IOT-TEMP-022', warehouse_id: 1, warehouse_name: 'Seattle Distribution Center' },
        details: { title: 'Low Battery Warning', description: 'Device battery at 45%. Replacement recommended within 30 days.', current_value: 45, threshold_value: 50, unit: 'percent' },
        risk: { risk_level: 'low', potential_impact: 'Data loss if battery depletes', recommended_action: 'Schedule battery replacement' },
        acknowledged_by: 'Michael Davis', acknowledged_at: new Date('2026-05-20T09:15:00Z'),
        resolved_by: 'David Martinez', resolved_at: new Date('2026-05-20T14:30:00Z')
      },
    ]);
    results.push('✅ alerts: 3 documents inserted');

    results.push('');
    results.push('🎉 MONGODB SETUP COMPLETE!');
    results.push('Collections: sensor_readings, iot_devices, part_specifications, audit_logs, alerts');

    res.json({ success: true, message: 'MongoDB setup complete!', results });

  } catch (error) {
    console.error('MongoDB setup error:', error);
    res.status(500).json({ success: false, message: 'MongoDB setup failed', error: error.message, results });
  }
});

module.exports = router;
