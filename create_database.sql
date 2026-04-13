-- ============================================================
--  IDOL BLESSINGS HUB — MySQL Database Setup
--  Run this in phpMyAdmin or MySQL CLI before starting server
-- ============================================================

CREATE DATABASE IF NOT EXISTS `idol_blessings_hub`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `idol_blessings_hub`;

-- Sequelize will auto-create all tables via sync({ alter: true })
-- Just create the DB here; tables are managed by models/index.js

-- Verify
SELECT 'idol_blessings_hub database created successfully!' AS status;
