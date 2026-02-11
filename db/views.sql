-- PRIMA AI Database Views
-- AI-optimized views for venue availability and analytics

-- AI Venue Availability View
CREATE OR REPLACE VIEW ai_venue_availability AS
SELECT 
    v.id as venue_id,
    v.name as venue_name,
    v.cuisine_type,
    v.price_range,
    v.rating,
    v.city,
    v.neighborhood,
    v.address,
    a.date,
    a.time,
    a.available_capacity,
    a.table_type,
    a.price_modifier,
    -- Calculate busy score (0-1 scale)
    CASE 
        WHEN a.available_capacity >= v.total_capacity * 0.7 THEN 0.2  -- Low demand
        WHEN a.available_capacity >= v.total_capacity * 0.4 THEN 0.5  -- Medium demand
        WHEN a.available_capacity >= v.total_capacity * 0.2 THEN 0.8  -- High demand
        ELSE 1.0  -- Very high demand
    END as busy_score,
    -- Opening hours for the day
    JSON_EXTRACT(v.opening_hours, CONCAT('$."', DAYNAME(a.date), '"')) as day_hours,
    -- Venue features for AI recommendations
    v.amenities,
    v.dietary_options,
    v.noise_level,
    v.dress_code,
    -- Booking metrics
    (
        SELECT COUNT(*) 
        FROM bookings b 
        WHERE b.venue_id = v.id 
        AND b.date = a.date 
        AND b.status = 'confirmed'
    ) as confirmed_bookings_today,
    -- Recent rating trend
    (
        SELECT AVG(rating) 
        FROM reviews r 
        WHERE r.venue_id = v.id 
        AND r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    ) as recent_rating
FROM venues v
JOIN availability a ON v.id = a.venue_id
WHERE v.active = 1
AND a.date >= CURDATE()
AND a.available_capacity > 0;

-- Analytics Summary View
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
    DATE(b.date) as booking_date,
    v.id as venue_id,
    v.name as venue_name,
    v.cuisine_type,
    v.price_range,
    v.city,
    -- Daily metrics
    COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
    COUNT(CASE WHEN b.status = 'no_show' THEN 1 END) as no_shows,
    SUM(CASE WHEN b.status = 'confirmed' THEN b.party_size ELSE 0 END) as total_guests,
    AVG(CASE WHEN b.status = 'confirmed' THEN b.party_size END) as avg_party_size,
    -- Revenue calculations
    SUM(CASE WHEN b.status = 'confirmed' THEN 
        COALESCE(b.total_amount, v.average_spend_per_person * b.party_size) 
        ELSE 0 END) as estimated_revenue,
    -- Time-based patterns
    AVG(CASE WHEN TIME(b.time) BETWEEN '12:00:00' AND '14:00:00' THEN 1 ELSE 0 END) as lunch_ratio,
    AVG(CASE WHEN TIME(b.time) BETWEEN '18:00:00' AND '22:00:00' THEN 1 ELSE 0 END) as dinner_ratio,
    -- Capacity utilization
    (SUM(CASE WHEN b.status = 'confirmed' THEN b.party_size ELSE 0 END) / 
     (v.total_capacity * v.operating_hours_per_day)) * 100 as capacity_utilization_pct
FROM bookings b
JOIN venues v ON b.venue_id = v.id
WHERE b.date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
GROUP BY DATE(b.date), v.id, v.name, v.cuisine_type, v.price_range, v.city, 
         v.total_capacity, v.operating_hours_per_day;

-- Popular Venues View (for AI recommendations)
CREATE OR REPLACE VIEW popular_venues AS
SELECT 
    v.id,
    v.name,
    v.cuisine_type,
    v.price_range,
    v.city,
    v.neighborhood,
    v.rating,
    -- Popularity metrics
    COUNT(b.id) as total_bookings_90d,
    AVG(b.party_size) as avg_party_size,
    COUNT(DISTINCT b.guest_email) as unique_customers,
    -- Customer satisfaction
    v.rating,
    COALESCE(AVG(r.rating), v.rating) as recent_review_rating,
    COUNT(r.id) as review_count_30d,
    -- Booking success rate
    (COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) * 100.0 / 
     NULLIF(COUNT(b.id), 0)) as booking_success_rate,
    -- Time popularity
    COUNT(CASE WHEN TIME(b.time) BETWEEN '12:00:00' AND '14:00:00' THEN 1 END) as lunch_bookings,
    COUNT(CASE WHEN TIME(b.time) BETWEEN '18:00:00' AND '22:00:00' THEN 1 END) as dinner_bookings,
    -- Seasonal trends
    COUNT(CASE WHEN MONTH(b.date) IN (12, 1, 2) THEN 1 END) as winter_bookings,
    COUNT(CASE WHEN MONTH(b.date) IN (3, 4, 5) THEN 1 END) as spring_bookings,
    COUNT(CASE WHEN MONTH(b.date) IN (6, 7, 8) THEN 1 END) as summer_bookings,
    COUNT(CASE WHEN MONTH(b.date) IN (9, 10, 11) THEN 1 END) as fall_bookings,
    -- AI recommendation score
    (v.rating * 0.3 + 
     LEAST((COUNT(b.id) / 30.0), 10) * 0.2 +  -- Booking frequency (capped at 10/day)
     (COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) * 100.0 / NULLIF(COUNT(b.id), 0)) * 0.01 + -- Success rate
     COALESCE(AVG(r.rating), 0) * 0.2 +  -- Recent reviews
     (COUNT(DISTINCT b.guest_email) / 100.0) * 0.1 -- Customer diversity
    ) as ai_recommendation_score
FROM venues v
LEFT JOIN bookings b ON v.id = b.venue_id 
    AND b.date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
LEFT JOIN reviews r ON v.id = r.venue_id 
    AND r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
WHERE v.active = 1
GROUP BY v.id, v.name, v.cuisine_type, v.price_range, v.city, 
         v.neighborhood, v.rating
HAVING total_bookings_90d > 0
ORDER BY ai_recommendation_score DESC;

-- User Preferences View (for personalized recommendations)
CREATE OR REPLACE VIEW user_preferences AS
SELECT 
    u.id as user_id,
    u.email,
    -- Dining preferences from booking history
    COUNT(b.id) as total_bookings,
    AVG(b.party_size) as avg_party_size,
    -- Cuisine preferences
    GROUP_CONCAT(DISTINCT v.cuisine_type ORDER BY cuisine_booking_count DESC LIMIT 3) as favorite_cuisines,
    -- Price preferences
    MODE() WITHIN GROUP (ORDER BY v.price_range) as preferred_price_range,
    -- Location preferences
    MODE() WITHIN GROUP (ORDER BY v.city) as preferred_city,
    MODE() WITHIN GROUP (ORDER BY v.neighborhood) as preferred_neighborhood,
    -- Time preferences
    AVG(HOUR(b.time)) as avg_booking_hour,
    COUNT(CASE WHEN TIME(b.time) BETWEEN '12:00:00' AND '14:00:00' THEN 1 END) as lunch_preference,
    COUNT(CASE WHEN TIME(b.time) BETWEEN '18:00:00' AND '22:00:00' THEN 1 END) as dinner_preference,
    -- Special requirements
    GROUP_CONCAT(DISTINCT b.special_requests) as common_special_requests,
    -- Booking patterns
    AVG(DATEDIFF(b.date, b.created_at)) as avg_advance_booking_days,
    COUNT(CASE WHEN DAYOFWEEK(b.date) IN (1, 7) THEN 1 END) as weekend_bookings,
    COUNT(CASE WHEN DAYOFWEEK(b.date) BETWEEN 2 AND 6 THEN 1 END) as weekday_bookings
FROM users u
JOIN bookings b ON u.email = b.guest_email
JOIN venues v ON b.venue_id = v.id
WHERE b.status = 'confirmed'
AND b.date >= DATE_SUB(CURDATE(), INTERVAL 365 DAY)
GROUP BY u.id, u.email
HAVING total_bookings >= 2;
