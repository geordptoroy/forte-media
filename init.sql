-- FORTE MEDIA Database Initialization
-- MySQL 8.0 Schema

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `email` varchar(255) NOT NULL UNIQUE,
  `name` varchar(255) NOT NULL,
  `role` enum('admin', 'user') DEFAULT 'user',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_meta_credentials table
CREATE TABLE IF NOT EXISTS `user_meta_credentials` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `encrypted_access_token` longtext NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `permissions` json,
  `is_valid` boolean DEFAULT true,
  `last_validated_at` timestamp NULL,
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
  `ad_data` json,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
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
  `alert_config` json,
  `last_checked` timestamp NULL,
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
  `status` enum('active', 'paused', 'archived') DEFAULT 'active',
  `metadata` json,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_campaign_id` (`campaign_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create campaign_metrics_history table
CREATE TABLE IF NOT EXISTS `campaign_metrics_history` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` int NOT NULL,
  `date` date NOT NULL,
  `spend` decimal(12, 2),
  `impressions` int,
  `clicks` int,
  `conversions` int,
  `revenue` decimal(12, 2),
  `roas` decimal(5, 2),
  `cpc` decimal(8, 2),
  `ctr` decimal(5, 2),
  `metadata` json,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`campaign_id`) REFERENCES `user_campaigns`(`id`) ON DELETE CASCADE,
  INDEX `idx_campaign_id` (`campaign_id`),
  INDEX `idx_date` (`date`),
  UNIQUE KEY `unique_campaign_date` (`campaign_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS `saved_searches` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `search_params` json NOT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ads table
CREATE TABLE IF NOT EXISTS `ads` (
  `id` varchar(255) PRIMARY KEY,
  `page_id` varchar(255) NOT NULL,
  `page_name` varchar(255),
  `ad_creative_body` longtext,
  `ad_snapshot_url` varchar(500),
  `estimated_monthly_spend` json,
  `platforms` json,
  `media_type` varchar(50),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_page_id` (`page_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ad_snapshots table
CREATE TABLE IF NOT EXISTS `ad_snapshots` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `ad_id` varchar(255) NOT NULL,
  `snapshot_url` varchar(500),
  `snapshot_data` json,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ad_id`) REFERENCES `ads`(`id`) ON DELETE CASCADE,
  INDEX `idx_ad_id` (`ad_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
