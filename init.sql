-- FORTE MEDIA Database Initialization
-- MySQL 8.0 Schema

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `forte_media`;

-- Ensure user exists and has permissions
-- Note: User creation is handled by Docker environment variables,
-- but we ensure permissions here just in case.
GRANT ALL PRIVILEGES ON `forte_media`.* TO 'forte_user'@'%';
FLUSH PRIVILEGES;

-- Use the database
USE `forte_media`;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(255) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `password_hash` text,
  `role` enum('admin', 'user') DEFAULT 'user',
  `loginMethod` varchar(64) DEFAULT 'local',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_signed_in` timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_meta_credentials table
CREATE TABLE IF NOT EXISTS `user_meta_credentials` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `meta_app_id` varchar(255) NOT NULL,
  `encrypted_app_secret` text,
  `ad_account_id` varchar(64),
  `account_name` varchar(255),
  `encrypted_access_token` longtext NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `is_system_user` boolean DEFAULT false,
  `system_user_id` varchar(255),
  `permissions` json,
  `is_valid` boolean DEFAULT true,
  `last_validated_at` timestamp NULL,
  `validation_error` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_is_valid` (`is_valid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create favorite_ads table
CREATE TABLE IF NOT EXISTS `favorite_ads` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `ad_id` varchar(255) NOT NULL,
  `page_id` varchar(255) NOT NULL,
  `page_name` varchar(255),
  `ad_body` text,
  `ad_snapshot_url` text,
  `spend` decimal(12, 2),
  `impressions` int,
  `currency` varchar(3),
  `delivery_start_time` timestamp NULL,
  `delivery_stop_time` timestamp NULL,
  `meta_data` json,
  `notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_ad_id` (`ad_id`),
  UNIQUE KEY `unique_user_ad` (`user_id`, `ad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create monitored_ads table
CREATE TABLE IF NOT EXISTS `monitored_ads` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `ad_id` varchar(255) NOT NULL,
  `page_id` varchar(255) NOT NULL,
  `page_name` varchar(255),
  `monitoring_status` enum('active', 'paused', 'completed') DEFAULT 'active',
  `last_checked_at` timestamp NULL,
  `is_still_active` boolean DEFAULT true,
  `last_known_spend` decimal(12, 2),
  `last_known_impressions` int,
  `spend_history` json,
  `notes` text,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_ad_id` (`ad_id`),
  UNIQUE KEY `unique_user_monitored` (`user_id`, `ad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_campaigns table
CREATE TABLE IF NOT EXISTS `user_campaigns` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `campaign_id` varchar(255) NOT NULL,
  `campaign_name` varchar(255) NOT NULL,
  `ad_account_id` varchar(64) NOT NULL,
  `status` enum('active', 'paused', 'completed', 'archived') DEFAULT 'active',
  `objective` varchar(64),
  `total_spend` decimal(12, 2) DEFAULT 0.00,
  `total_impressions` int DEFAULT 0,
  `total_clicks` int DEFAULT 0,
  `total_conversions` int DEFAULT 0,
  `total_conversion_value` decimal(12, 2) DEFAULT 0.00,
  `roas` decimal(5, 2),
  `ctr` decimal(5, 2),
  `cpc` decimal(8, 2),
  `cpm` decimal(8, 2),
  `currency` varchar(3),
  `start_date` timestamp NULL,
  `end_date` timestamp NULL,
  `last_synced_at` timestamp NULL,
  `meta_data` json,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_campaign_id` (`campaign_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create campaign_metrics_history table
CREATE TABLE IF NOT EXISTS `campaign_metrics_history` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` int NOT NULL,
  `spend` decimal(12, 2) NOT NULL,
  `impressions` int NOT NULL,
  `clicks` int NOT NULL,
  `conversions` int,
  `conversion_value` decimal(12, 2),
  `roas` decimal(5, 2),
  `ctr` decimal(5, 2),
  `cpc` decimal(8, 2),
  `cpm` decimal(8, 2),
  `recorded_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`campaign_id`) REFERENCES `user_campaigns`(`id`) ON DELETE CASCADE,
  INDEX `idx_campaign_id` (`campaign_id`),
  INDEX `idx_recorded_at` (`recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
