-- PRIMA AI Database Indexes
-- Optimized for AI agent function calls and analytics

-- Venues table indexes
CREATE INDEX idx_venues_active_rating ON venues (active, rating DESC);
CREATE INDEX idx_venues_cuisine_price ON venues (cuisine_type, price_range);
CREATE INDEX idx_venues_location ON venues (city, neighborhood);
CREATE INDEX idx_venues_search ON venues (name, description, cuisine_type);
CREATE INDEX idx_venues_capacity ON venues (total_capacity, active);

-- Availability table indexes (critical for real-time availability checks)
CREATE INDEX idx_availability_venue_date_time ON availability (venue_id, date, time);
CREATE INDEX idx_availability_date_capacity ON availability (date, available_capacity);
CREATE INDEX idx_availability_future ON availability (date) WHERE date >= CURDATE();
CREATE INDEX idx_availability_venue_future ON availability (venue_id, date) WHERE date >= CURDATE();

-- Bookings table indexes (for analytics and user history)
CREATE INDEX idx_bookings_venue_date ON bookings (venue_id, date);
CREATE INDEX idx_bookings_guest_email ON bookings (guest_email);
CREATE INDEX idx_bookings_status_date ON bookings (status, date);
CREATE INDEX idx_bookings_date_range ON bookings (date, created_at);
CREATE INDEX idx_bookings_analytics ON bookings (venue_id, date, status, party_size);

-- Reviews table indexes (for rating calculations)
CREATE INDEX idx_reviews_venue_recent ON reviews (venue_id, created_at DESC);
CREATE INDEX idx_reviews_rating_date ON reviews (rating, created_at);

-- Users table indexes
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_created ON users (created_at);

-- Composite indexes for AI queries
CREATE INDEX idx_venues_ai_search ON venues (active, rating DESC, cuisine_type, price_range, city);
CREATE INDEX idx_availability_ai_check ON availability (venue_id, date, time, available_capacity) 
    WHERE date >= CURDATE();

-- Full-text search indexes for natural language queries
ALTER TABLE venues ADD FULLTEXT(name, description, cuisine_type);
ALTER TABLE venues ADD FULLTEXT(amenities, dietary_options);

-- Specialized indexes for analytics views
CREATE INDEX idx_bookings_time_analysis ON bookings (date, time, status, party_size, venue_id);
CREATE INDEX idx_bookings_revenue ON bookings (venue_id, date, status, total_amount, party_size);

-- Partial indexes for performance
CREATE INDEX idx_confirmed_bookings ON bookings (venue_id, date, party_size) 
    WHERE status = 'confirmed';
CREATE INDEX idx_active_venues_rating ON venues (rating DESC, id) 
    WHERE active = 1;

-- JSON column indexes (MySQL 8.0+)
-- CREATE INDEX idx_venue_opening_hours ON venues ((CAST(opening_hours AS JSON)));
-- CREATE INDEX idx_venue_amenities ON venues ((CAST(amenities AS JSON)));

-- Covering indexes for common AI queries
CREATE INDEX idx_venues_search_covering ON venues (
    active, cuisine_type, price_range, city, rating DESC
) INCLUDE (id, name, neighborhood, address, amenities);

CREATE INDEX idx_availability_covering ON availability (
    venue_id, date, time, available_capacity
) INCLUDE (table_type, price_modifier);

-- Performance monitoring query
-- Use this to monitor index usage:
/*
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    SEQ_IN_INDEX,
    COLUMN_NAME,
    CARDINALITY,
    INDEX_TYPE
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'prima_ai' 
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
*/
