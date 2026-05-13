-- Insert Roles
INSERT INTO roles (role_name, role_description, access_level) VALUES
('Administrator', 'Full system access', 10),
('Supply Chain Manager', 'Manage suppliers and procurement', 7),
('Procurement Officer', 'Create and manage purchase orders', 5),
('Quality Inspector', 'Perform quality inspections', 5),
('Quality Manager', 'Approve quality reports', 7),
('Warehouse Manager', 'Manage inventory and warehouse', 6),
('Equipment Engineer', 'Manage IoT devices', 4),
('Auditor', 'Read-only access for audits', 3);

-- Insert Users (password: 'password123' hashed with bcrypt)
INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, department) VALUES
('admin', 'admin@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 'User', 1, 'IT'),
('jsmith', 'john.smith@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'John', 'Smith', 3, 'Procurement'),
('rjohnson', 'robert.johnson@aeronetb.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Robert', 'Johnson', 5, 'Quality');

-- Insert Sample Suppliers
INSERT INTO suppliers (supplier_name, supplier_type, country, contact_email, status, performance_rating) VALUES
('Precision Aerospace Inc.', 'Tier 1', 'United States', 'contact@precisionaero.com', 'Active', 4.7),
('TitaniumTech GmbH', 'Tier 1', 'Germany', 'info@titaniumtech.de', 'Active', 4.5),
('Global Parts Ltd', 'Tier 2', 'United Kingdom', 'sales@globalparts.co.uk', 'Active', 4.2);

-- Insert Sample Parts
INSERT INTO parts (part_number, part_name, part_category, criticality_level, unit_cost) VALUES
('AeroNetB-WB-Ti-25-001', 'Wing Attachment Bolt - Titanium', 'Wing', 'Critical', 12.50),
('AeroNetB-FS-AL-100-045', 'Fuselage Panel - Aluminum', 'Fuselage', 'High', 450.00),
('AeroNetB-AV-EC-200-012', 'Avionics Control Unit', 'Avionics', 'Critical', 2500.00);

-- Insert Sample Warehouses
INSERT INTO warehouses (warehouse_name, location_city, location_country, warehouse_type) VALUES
('Seattle Distribution Center', 'Seattle', 'United States', 'Central'),
('Everett Manufacturing Facility', 'Everett', 'United States', 'Central'),
('Frankfurt Regional Hub', 'Frankfurt', 'Germany', 'Regional');
