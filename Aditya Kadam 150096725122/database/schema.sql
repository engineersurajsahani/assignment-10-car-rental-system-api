-- Car Rental System Database Schema for Supabase (PostgreSQL)

-- Vehicles Table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('sedan', 'suv', 'hatchback', 'luxury', 'sports', 'van', 'pickup')),
    daily_rate DECIMAL(10, 2) NOT NULL CHECK (daily_rate > 0),
    fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'cng')),
    seating_capacity INTEGER NOT NULL CHECK (seating_capacity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rentals Table
CREATE TABLE rentals (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL CHECK (total_cost > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Indexes for better query performance
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_category ON vehicles(category);
CREATE INDEX idx_rentals_user_id ON rentals(user_id);
CREATE INDEX idx_rentals_vehicle_id ON rentals(vehicle_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_dates ON rentals(vehicle_id, start_date, end_date);

-- Row Level Security (RLS) Policies
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;

-- Vehicles: Public read for all authenticated users
CREATE POLICY "Vehicles are viewable by all authenticated users"
    ON vehicles FOR SELECT
    TO authenticated
    USING (true);

-- Vehicles: Insert/Update/Delete only by authenticated users (add admin check if needed)
CREATE POLICY "Authenticated users can insert vehicles"
    ON vehicles FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
    ON vehicles FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicles"
    ON vehicles FOR DELETE
    TO authenticated
    USING (true);

-- Rentals: Users can only see their own bookings
CREATE POLICY "Users can view their own rentals"
    ON rentals FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Rentals: Users can create their own bookings
CREATE POLICY "Users can create their own rentals"
    ON rentals FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Rentals: Users can update their own bookings
CREATE POLICY "Users can update their own rentals"
    ON rentals FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Trigger to update vehicle status when rental is created
CREATE OR REPLACE FUNCTION update_vehicle_status_on_rental()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('booked', 'active') THEN
        UPDATE vehicles SET status = 'rented' WHERE id = NEW.vehicle_id;
    ELSIF NEW.status = 'cancelled' THEN
        UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
    ELSIF NEW.status = 'completed' THEN
        UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rental_status_trigger
    AFTER INSERT OR UPDATE ON rentals
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_status_on_rental();

-- Sample Data Insert
INSERT INTO vehicles (brand, model, year, category, daily_rate, fuel_type, seating_capacity, status) VALUES
('Toyota', 'Camry', 2023, 'sedan', 50.00, 'hybrid', 5, 'available'),
('Honda', 'CR-V', 2023, 'suv', 70.00, 'petrol', 5, 'available'),
('Mercedes', 'E-Class', 2024, 'luxury', 150.00, 'petrol', 5, 'available'),
('Ford', 'F-150', 2023, 'pickup', 85.00, 'diesel', 5, 'available'),
('Tesla', 'Model 3', 2024, 'sedan', 90.00, 'electric', 5, 'available'),
('BMW', 'X5', 2023, 'suv', 130.00, 'hybrid', 5, 'available'),
('Chevrolet', 'Tahoe', 2024, 'suv', 110.00, 'petrol', 7, 'available'),
('Toyota', 'Sienna', 2023, 'van', 80.00, 'hybrid', 8, 'available'),
('Porsche', '911', 2024, 'sports', 300.00, 'petrol', 2, 'available'),
('Volkswagen', 'Golf', 2023, 'hatchback', 45.00, 'petrol', 5, 'available');
