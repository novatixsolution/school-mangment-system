-- Simplified Demo Data for School Management System
-- Only using columns that actually exist in the database

-- ============================================
-- CLASSES
-- ============================================
INSERT INTO classes (name) VALUES
('KG'),
('Class 1'),
('Class 2'),
('Class 3'),
('Class 4'),
('Class 5'),
('Class 6'),
('Class 7'),
('Class 8'),
('Class 9'),
('Class 10')
ON CONFLICT DO NOTHING;

-- ============================================
-- SECTIONS
-- ============================================
DO $$
DECLARE
    class_rec RECORD;
BEGIN
    FOR class_rec IN SELECT id, name FROM classes LOOP
        INSERT INTO sections (class_id, name) VALUES
        (class_rec.id, 'A'),
        (class_rec.id, 'B')
        ON CONFLICT DO NOTHING;
        
        IF class_rec.name IN ('Class 5', 'Class 6', 'Class 8') THEN
            INSERT INTO sections (class_id, name) VALUES
            (class_rec.id, 'C')
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- FEE STRUCTURES
-- ============================================
DO $$
DECLARE
    class_rec RECORD;
    base_fee INTEGER;
BEGIN
    FOR class_rec IN SELECT id, name FROM classes LOOP
        base_fee := CASE
            WHEN class_rec.name = 'KG' THEN 2000
            WHEN class_rec.name LIKE 'Class 1%' THEN 2500
            WHEN class_rec.name LIKE 'Class 2%' THEN 2500
            WHEN class_rec.name LIKE 'Class 3%' THEN 3000
            WHEN class_rec.name LIKE 'Class 4%' THEN 3000
            WHEN class_rec.name LIKE 'Class 5%' THEN 3500
            WHEN class_rec.name LIKE 'Class 6%' THEN 4000
            WHEN class_rec.name LIKE 'Class 7%' THEN 4000
            WHEN class_rec.name LIKE 'Class 8%' THEN 4500
            WHEN class_rec.name LIKE 'Class 9%' THEN 5000
            ELSE 5500
        END;
        
        INSERT INTO fee_structures (class_id, title, amount, frequency) VALUES
        (class_rec.id, 'Monthly Tuition', base_fee, 'monthly');
    END LOOP;
END $$;

-- ============================================
-- SIBLING GROUPS
-- ============================================
INSERT INTO sibling_groups (family_name, primary_parent_name, primary_parent_cnic, primary_parent_phone) VALUES
('Khan Family', 'Ahmed Khan', '12345-1234567-1', '03001234567'),
('Ali Family', 'Hassan Ali', '23456-2345678-2', '03112345678'),
('Malik Family', 'Usman Malik', '34567-3456789-3', '03223456789');

-- ============================================
-- STUDENTS
-- ============================================
DO $$
DECLARE
    kg_id BIGINT;
    c1_id BIGINT;
    c2_id BIGINT;
    c3_id BIGINT;
    c5_id BIGINT;
    c6_id BIGINT;
    c8_id BIGINT;
    khan_fam UUID;
    ali_fam UUID;
    malik_fam UUID;
BEGIN
    SELECT id INTO kg_id FROM classes WHERE name = 'KG';
    SELECT id INTO c1_id FROM classes WHERE name = 'Class 1';
    SELECT id INTO c2_id FROM classes WHERE name = 'Class 2';
    SELECT id INTO c3_id FROM classes WHERE name = 'Class 3';
    SELECT id INTO c5_id FROM classes WHERE name = 'Class 5';
    SELECT id INTO c6_id FROM classes WHERE name = 'Class 6';
    SELECT id INTO c8_id FROM classes WHERE name = 'Class 8';
    
    SELECT id INTO khan_fam FROM sibling_groups WHERE family_name = 'Khan Family';
    SELECT id INTO ali_fam FROM sibling_groups WHERE family_name = 'Ali Family';
    SELECT id INTO malik_fam FROM sibling_groups WHERE family_name = 'Malik Family';
    
    -- Khan Family (3 siblings)
    INSERT INTO students (name, roll_number, admission_number, gender, date_of_birth, class_id, section_id, father_name, father_cnic, father_phone, email, address, admission_date, status, sibling_group_id) VALUES
    ('Ali Khan', '001', '2025-0001', 'male', '2015-03-15', c5_id, (SELECT id FROM sections WHERE class_id = c5_id AND name = 'A' LIMIT 1), 'Ahmed Khan', '12345-1234567-1', '03001234567', 'ahmed.khan@email.com', 'House 123, Model Town, Lahore', '2020-01-15', 'active', khan_fam),
    ('Fatima Khan', '002', '2025-0002', 'female', '2017-07-22', c3_id, (SELECT id FROM sections WHERE class_id = c3_id AND name = 'A' LIMIT 1), 'Ahmed Khan', '12345-1234567-1', '03001234567', 'ahmed.khan@email.com', 'House 123, Model Town, Lahore', '2022-01-15', 'active', khan_fam),
    ('Hamza Khan', '003', '2025-0003', 'male', '2019-11-10', c1_id, (SELECT id FROM sections WHERE class_id = c1_id AND name = 'A' LIMIT 1), 'Ahmed Khan', '12345-1234567-1', '03001234567', 'ahmed.khan@email.com', 'House 123, Model Town, Lahore', '2024-01-15', 'active', khan_fam);
    
    -- Ali Family (2 siblings)
    INSERT INTO students (name, roll_number, admission_number, gender, date_of_birth, class_id, section_id, father_name, father_cnic, father_phone, email, address, admission_date, status, sibling_group_id) VALUES
    ('Sara Ali', '004', '2025-0004', 'female', '2013-05-20', c8_id, (SELECT id FROM sections WHERE class_id = c8_id AND name = 'A' LIMIT 1), 'Hassan Ali', '23456-2345678-2', '03112345678', 'hassan.ali@email.com', 'Johar Town, Lahore', '2018-02-01', 'active', ali_fam),
    ('Usman Ali', '005', '2025-0005', 'male', '2015-09-12', c6_id, (SELECT id FROM sections WHERE class_id = c6_id AND name = 'B' LIMIT 1), 'Hassan Ali', '23456-2345678-2', '03112345678', 'hassan.ali@email.com', 'Johar Town, Lahore', '2020-02-01', 'active', ali_fam);
    
    -- Malik Family (2 siblings)
    INSERT INTO students (name, roll_number, admission_number, gender, date_of_birth, class_id, section_id, father_name, father_cnic, father_phone, email, address, admission_date, status, sibling_group_id) VALUES
    ('Aisha Malik', '006', '2025-0006', 'female', '2016-12-03', c5_id, (SELECT id FROM sections WHERE class_id = c5_id AND name = 'B' LIMIT 1), 'Usman Malik', '34567-3456789-3', '03223456789', 'usman.malik@email.com', 'Garden Town, Lahore', '2021-03-10', 'active', malik_fam),
    ('Bilal Malik', '007', '2025-0007', 'male', '2018-06-18', c2_id, (SELECT id FROM sections WHERE class_id = c2_id AND name = 'A' LIMIT 1), 'Usman Malik', '34567-3456789-3', '03223456789', 'usman.malik@email.com', 'Garden Town, Lahore', '2023-03-10', 'active', malik_fam);
    
    -- Individual students (no siblings)
    INSERT INTO students (name, roll_number, admission_number, gender, date_of_birth, class_id, section_id, father_name, father_cnic, father_phone, email, address, admission_date, status) VALUES
    ('Zainab Ahmed', '008', '2025-0008', 'female', '2014-08-25', c6_id, (SELECT id FROM sections WHERE class_id = c6_id AND name = 'A' LIMIT 1), 'Ahmed Raza', '12121-1212121-1', '03009876543', 'ahmed.raza@email.com', 'DHA Phase 5, Lahore', '2019-04-20', 'active'),
    ('Omar Farooq', '009', '2025-0009', 'male', '2015-02-14', c5_id, (SELECT id FROM sections WHERE class_id = c5_id AND name = 'A' LIMIT 1), 'Farooq Khan', '23232-2323232-2', '03118765432', 'farooq.khan@email.com', 'Gulberg III, Lahore', '2020-05-15', 'active'),
    ('Mariam Siddique', '010', '2025-0010', 'female', '2016-10-30', c5_id, (SELECT id FROM sections WHERE class_id = c5_id AND name = 'B' LIMIT 1), 'Siddique Ali', '34343-3434343-3', '03227654321', 'siddique.ali@email.com', 'Cavalry Ground, Lahore', '2021-06-01', 'active'),
    ('Hassan Raza', '011', '2025-0011', 'male', '2017-04-08', c3_id, (SELECT id FROM sections WHERE class_id = c3_id AND name = 'B' LIMIT 1), 'Raza Ahmed', '45454-4545454-4', '03336543210', 'raza.ahmed@email.com', 'Faisal Town, Lahore', '2022-07-10', 'active'),
    ('Ayesha Butt', '012', '2025-0012', 'female', '2018-11-22', c2_id, (SELECT id FROM sections WHERE class_id = c2_id AND name = 'B' LIMIT 1), 'Imran Butt', '56565-5656565-5', '03445432109', 'imran.butt@email.com', 'Bahria Town, Lahore', '2023-08-15', 'active'),
    ('Abdullah Tariq', '013', '2025-0013', 'male', '2019-01-16', c1_id, (SELECT id FROM sections WHERE class_id = c1_id AND name = 'B' LIMIT 1), 'Tariq Mahmood', '67676-6767676-6', '03009998887', 'tariq.mahmood@email.com', 'Wapda Town, Lahore', '2024-09-01', 'active'),
    ('Hira Nawaz', '014', '2025-0014', 'female', '2020-05-05', kg_id, (SELECT id FROM sections WHERE class_id = kg_id AND name = 'A' LIMIT 1), 'Nawaz Sharif', '78787-7878787-7', '03118887776', 'nawaz.sharif@email.com', 'EME Society, Lahore', '2024-01-10', 'active'),
    ('Ibrahim Khan', '015', '2025-0015', 'male', '2020-08-19', kg_id, (SELECT id FROM sections WHERE class_id = kg_id AND name = 'B' LIMIT 1), 'Khan Sahib', '89898-8989898-8', '03227776665', 'khan.sahib@email.com', 'Valencia Town, Lahore', '2024-02-05', 'active');

END $$;

-- Success message
DO $$
DECLARE
    total_students INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_students FROM students;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Demo Data Created Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Classes: 11 (KG to Class 10)';
    RAISE NOTICE 'Sections: ~25';
    RAISE NOTICE 'Fee Structures: 11';
    RAISE NOTICE 'Students: %', total_students;
    RAISE NOTICE 'Sibling Groups: 3 families';
    RAISE NOTICE '========================================';
END $$;
