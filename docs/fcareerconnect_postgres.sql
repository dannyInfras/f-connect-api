
-- ROLES
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- SKILL
CREATE TABLE skill (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE category (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USERS
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- CANDIDATE_PROFILE
CREATE TABLE candidate_profile (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    description TEXT,
	education TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- CANDIDATE_SKILL
CREATE TABLE candidate_skill (
    id BIGSERIAL PRIMARY KEY,
    candidate_profile_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    proficiency_level VARCHAR(50), -- Optional: e.g., 'Beginner', 'Intermediate', 'Expert'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (candidate_profile_id, skill_id), -- Prevent duplicate skill assignments
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profile(id),
    FOREIGN KEY (skill_id) REFERENCES skill(id)
);

-- COMPANY
CREATE TABLE company (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    tax_code VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(100),
    description TEXT,
    logo_url VARCHAR(255),
    address VARCHAR(255),
    business_license_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- EXPERIENCE
CREATE TABLE experience (
    id BIGSERIAL PRIMARY KEY,
    candidate_profile_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    position VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE, -- Nullable for ongoing roles
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profile(id),
    FOREIGN KEY (company_id) REFERENCES company(id)
);

-- JOB
CREATE TABLE job (
    id BIGSERIAL PRIMARY KEY,
	category_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    salary_min DECIMAL(15,2),
    salary_max DECIMAL(15,2),
    experience_years INT,
    status VARCHAR(10) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    is_vip BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company(id),
	FOREIGN KEY (category_id) REFERENCES category(id) 
);


-- JOB_SKILL
CREATE TABLE job_skill (
    job_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    PRIMARY KEY (job_id, skill_id),
    FOREIGN KEY (job_id) REFERENCES job(id),
    FOREIGN KEY (skill_id) REFERENCES skill(id)
);

-- CV
CREATE TABLE cv (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    pdf_url VARCHAR(255),
    share_link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- CV_SKILL
CREATE TABLE cv_skill (
    cv_id BIGINT NOT NULL,
    skill_id BIGINT NOT NULL,
    proficiency_level VARCHAR(20) DEFAULT 'BEGINNER' CHECK (proficiency_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
    PRIMARY KEY (cv_id, skill_id),
    FOREIGN KEY (cv_id) REFERENCES cv(id),
    FOREIGN KEY (skill_id) REFERENCES skill(id)
);

-- JOB_APPLICATION
CREATE TABLE job_application (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_id BIGINT NOT NULL,
    cv_id BIGINT NULL,
    status VARCHAR(20) DEFAULT 'APPLIED' CHECK (status IN ('APPLIED', 'INTERVIEW', 'HIRED', 'REJECTED')),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES job(id),
    FOREIGN KEY (cv_id) REFERENCES cv(id)
);

-- POTENTIAL_CANDIDATE
CREATE TABLE candidate_bookmark (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    candidate_profile_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, candidate_profile_id),
    FOREIGN KEY (company_id) REFERENCES company(id),
    FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profile(id)
);

--Manager_CANDIDATE
CREATE TABLE hired_candidate (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
	position VARCHAR(20),
    hired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'LEFT')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES job(id),
    FOREIGN KEY (company_id) REFERENCES company(id)
);


-- WORKSPACE
CREATE TABLE workspace (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    privacy VARCHAR(10) NOT NULL DEFAULT 'private' CHECK (privacy IN ('public', 'private')),
    max_members INT DEFAULT 50,
    image_url VARCHAR(255),
    category VARCHAR(100),
    status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('active', 'ban', 'pending')),
    invite_link VARCHAR(255),
    owner_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- WORKSPACE_CHAT
CREATE TABLE workspace_chat (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    sender_id BIGINT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspace(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- TASK
CREATE TABLE task (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspace(id)
);

-- BACKGROUND
CREATE TABLE background (
    id BIGSERIAL PRIMARY KEY,
	workspace_id BIGINT NOT NULL,
    user_create_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL, -- Consider adding a categories table if needed
    path VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_create_id) REFERENCES users(id),
	FOREIGN KEY (workspace_id) REFERENCES workspace(id)
);

-- MUSIC
CREATE TABLE music (
    id BIGSERIAL PRIMARY KEY,
	workspace_id BIGINT NOT NULL,
    user_create_id BIGINT NOT NULL,
    category_id BIGINT NOT NULL, -- Consider adding a categories table if needed
    path VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_create_id) REFERENCES users(id), 
	FOREIGN KEY (workspace_id) REFERENCES workspace(id)
);

-- CALENDAR
CREATE TABLE calendar (
    id BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspace(id)
);

-- PACKAGE
CREATE TABLE package (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_days INT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('USER_VIP', 'COMPANY_VIP')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- COUPON
CREATE TABLE coupon (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL,
    valid_until DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAYMENT
CREATE TABLE payment (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    coupon_id BIGINT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(10) NOT NULL CHECK (payment_method IN ('VISA', 'MOMO', 'VNPAY', 'PAYOS')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ,
    FOREIGN KEY (package_id) REFERENCES package(id),
    FOREIGN KEY (coupon_id) REFERENCES coupon(id)
);

-- NOTIFICATION
CREATE TABLE notification (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);