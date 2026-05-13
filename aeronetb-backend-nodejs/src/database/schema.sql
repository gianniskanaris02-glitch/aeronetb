-- Create this file in your project: database/schema.sql

-- 1. ROLES TABLE
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) UNIQUE NOT NULL,
    role_description TEXT,
    access_level INTEGER NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (access_level BETWEEN 1 AND 10)
);

-- 2. USERS TABLE
CREATE TABLE users (
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
);

-- 3. SUPPLIERS TABLE
CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(200) UNIQUE NOT NULL,
    supplier_type VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    certification_level VARCHAR(100),
    contact_email VARCHAR(150) UNIQUE NOT NULL,
    contact_phone VARCHAR(50),
    address TEXT,
    registration_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Active',
    performance_rating DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (supplier_type IN ('Tier 1', 'Tier 2', 'Tier 3')),
    CHECK (status IN ('Active', 'Suspended', 'Under Review')),
    CHECK (performance_rating BETWEEN 0 AND 5)
);

-- 4. PARTS TABLE
CREATE TABLE parts (
    part_id SERIAL PRIMARY KEY,
    part_number VARCHAR(100) UNIQUE NOT NULL,
    part_name VARCHAR(200) NOT NULL,
    part_category VARCHAR(100) NOT NULL,
    description TEXT,
    material_type VARCHAR(100),
    weight_kg DECIMAL(10,3),
    dimensions VARCHAR(100),
    unit_cost DECIMAL(12,2),
    lead_time_days INTEGER,
    criticality_level VARCHAR(50) NOT NULL,
    revision_number VARCHAR(50),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (part_category IN ('Fuselage', 'Wing', 'Engine', 'Avionics', 'Landing Gear', 'Other')),
    CHECK (criticality_level IN ('Critical', 'High', 'Medium', 'Low'))
);

-- 5. WAREHOUSES TABLE
CREATE TABLE warehouses (
    warehouse_id SERIAL PRIMARY KEY,
    warehouse_name VARCHAR(150) NOT NULL,
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    warehouse_type VARCHAR(50) NOT NULL,
    capacity_sqm DECIMAL(10,2),
    manager_name VARCHAR(150),
    contact_number VARCHAR(50),
    operating_hours VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (warehouse_type IN ('Central', 'Regional', 'Supplier-Managed'))
);

-- 6. PURCHASE_ORDERS TABLE
CREATE TABLE purchase_orders (
    po_id SERIAL PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(supplier_id),
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    po_status VARCHAR(50) DEFAULT 'Draft',
    total_amount DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'USD',
    payment_terms VARCHAR(100),
    shipping_method VARCHAR(100),
    delivery_location VARCHAR(200),
    created_by INTEGER REFERENCES users(user_id),
    approved_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (po_status IN ('Draft', 'Approved', 'In Transit', 'Delivered', 'Cancelled', 'On Hold'))
);

-- 7. ORDER_LINE_ITEMS TABLE
CREATE TABLE order_line_items (
    line_item_id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES purchase_orders(po_id),
    part_id INTEGER REFERENCES parts(part_id),
    quantity_ordered INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    line_total DECIMAL(15,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
    quality_acceptance_criteria TEXT,
    delivery_schedule DATE
);

-- 8. INVENTORY TABLE
CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    part_id INTEGER REFERENCES parts(part_id),
    warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
    quantity_on_hand INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    reorder_level INTEGER,
    maximum_stock_level INTEGER,
    last_stock_count_date DATE,
    location_bin VARCHAR(50),
    batch_number VARCHAR(100),
    receiving_date DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(part_id, warehouse_id, batch_number)
);

-- 9. QUALITY_INSPECTIONS TABLE
CREATE TABLE quality_inspections (
    inspection_id SERIAL PRIMARY KEY,
    part_id INTEGER REFERENCES parts(part_id),
    po_id INTEGER REFERENCES purchase_orders(po_id),
    inspector_id INTEGER REFERENCES users(user_id),
    inspection_date DATE DEFAULT CURRENT_DATE,
    inspection_type VARCHAR(50) NOT NULL,
    inspection_status VARCHAR(50) DEFAULT 'Pending',
    defect_count INTEGER DEFAULT 0,
    conformance_percentage DECIMAL(5,2),
    inspection_notes TEXT,
    corrective_action_required BOOLEAN DEFAULT FALSE,
    reinspection_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (inspection_type IN ('Incoming', 'In-Process', 'Final', 'Audit')),
    CHECK (inspection_status IN ('Pass', 'Fail', 'Conditional Pass', 'Pending'))
);

