-- FORTE MEDIA Database Initialization
-- MySQL 8.0 Schema
-- Simplificado: Removida lógica de anúncios escalados e score proprietário

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `forte_media`;

-- Ensure user exists and has permissions
GRANT ALL PRIVILEGES ON `forte_media`.* TO 'forte_user'@'%';
FLUSH PRIVILEGES;

-- Use the database
USE `forte_media`;

-- ============================================================
-- Tabela: users
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` text,
  `email` varchar(320) NOT NULL,
  `password_hash` text,
  `loginMethod` varchar(64) DEFAULT 'local',
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `users_id` PRIMARY KEY(`id`),
  CONSTRAINT `users_email_unique` UNIQUE(`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `users_created_at_idx` ON `users` (`createdAt`);

-- ============================================================
-- Tabela: user_meta_credentials
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_meta_credentials` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `meta_app_id` varchar(255),
  `encrypted_app_secret` text,
  `encrypted_access_token` text NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `ad_account_id` varchar(64),
  `account_name` varchar(255),
  `permissions` json NOT NULL,
  `is_valid` boolean NOT NULL DEFAULT true,
  `last_validated_at` timestamp NULL,
  `validation_error` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `user_meta_credentials_id` PRIMARY KEY(`id`),
  CONSTRAINT `user_meta_credentials_user_id_unique` UNIQUE(`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `user_is_valid_idx` ON `user_meta_credentials` (`is_valid`);

-- ============================================================
-- Tabela: favorite_ads
-- ============================================================
CREATE TABLE IF NOT EXISTS `favorite_ads` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `ad_id` varchar(64) NOT NULL,
  `page_id` varchar(64) NOT NULL,
  `page_name` text,
  `ad_snapshot_url` text,
  `ad_delivery_start_time` timestamp NULL,
  `ad_delivery_stop_time` timestamp NULL,
  `publisher_platforms` json NOT NULL,
  `ad_creative_bodies` json NOT NULL,
  `ad_creative_link_titles` json NOT NULL,
  `ad_creative_link_descriptions` json NOT NULL,
  `currency` varchar(3),
  `spend` json,
  `impressions` json,
  `demographic_distribution` json,
  `region_distribution` json,
  `cdn_video_url` text,
  `cdn_image_url` text,
  `cdn_thumbnail_url` text,
  `media_extracted_at` timestamp NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `favorite_ads_id` PRIMARY KEY(`id`),
  CONSTRAINT `fav_user_ad_unique` UNIQUE(`user_id`, `ad_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `fav_created_at_idx` ON `favorite_ads` (`created_at`);

-- ============================================================
-- Tabela: ad_mining_log
-- ============================================================
CREATE TABLE IF NOT EXISTS `ad_mining_log` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `search_terms` text,
  `countries_filter` json NOT NULL,
  `ad_type_filter` varchar(64),
  `results_count` int DEFAULT 0,
  `executed_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ad_mining_log_id` PRIMARY KEY(`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `mining_user_id_idx` ON `ad_mining_log` (`user_id`);
CREATE INDEX `mining_executed_at_idx` ON `ad_mining_log` (`executed_at`);

-- ============================================================
-- Tabela: monitored_ads
-- ============================================================
CREATE TABLE IF NOT EXISTS `monitored_ads` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `ad_id` varchar(64) NOT NULL,
  `page_id` varchar(64) NOT NULL,
  `page_name` text,
  `monitoring_status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
  `last_checked_at` timestamp NULL,
  `is_still_active` boolean NOT NULL DEFAULT true,
  `last_known_spend` json,
  `last_known_impressions` json,
  `metrics_history` json NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `monitored_ads_id` PRIMARY KEY(`id`),
  CONSTRAINT `mon_user_ad_unique` UNIQUE(`user_id`, `ad_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `mon_user_status_idx` ON `monitored_ads` (`user_id`, `monitoring_status`);
CREATE INDEX `mon_status_idx` ON `monitored_ads` (`monitoring_status`);

-- ============================================================
-- Tabela: user_campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_campaigns` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `campaign_id` varchar(64) NOT NULL,
  `campaign_name` text NOT NULL,
  `ad_account_id` varchar(64) NOT NULL,
  `status` enum('active','paused','completed','archived') NOT NULL DEFAULT 'active',
  `objective` varchar(64),
  `total_spend` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_impressions` int NOT NULL DEFAULT 0,
  `total_clicks` int NOT NULL DEFAULT 0,
  `total_conversions` int NOT NULL DEFAULT 0,
  `total_conversion_value` decimal(12,2) DEFAULT '0.00',
  `roas` decimal(5,2),
  `ctr` decimal(5,2),
  `cpc` decimal(8,2),
  `cpm` decimal(8,2),
  `currency` varchar(3),
  `start_date` timestamp NULL,
  `end_date` timestamp NULL,
  `last_synced_at` timestamp NULL,
  `meta_data` json,
  `created_at` timestamp NOT NULL DEFAULT (now()),
  `updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `user_campaigns_id` PRIMARY KEY(`id`),
  CONSTRAINT `camp_user_campaign_unique` UNIQUE(`user_id`, `campaign_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `camp_user_status_idx` ON `user_campaigns` (`user_id`, `status`);
CREATE INDEX `camp_status_idx` ON `user_campaigns` (`status`);
CREATE INDEX `camp_created_at_idx` ON `user_campaigns` (`created_at`);

-- ============================================================
-- Tabela: campaign_metrics_history
-- ============================================================
CREATE TABLE IF NOT EXISTS `campaign_metrics_history` (
  `id` int AUTO_INCREMENT NOT NULL,
  `campaign_id` int NOT NULL,
  `spend` decimal(12,2) NOT NULL,
  `impressions` int NOT NULL,
  `clicks` int NOT NULL,
  `conversions` int,
  `conversion_value` decimal(12,2),
  `roas?` decimal(5,2),
  `ctr` decimal(5,2),
  `cpc` decimal(8,2),
  `cpm` decimal(8,2),
  `recorded_at` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `campaign_metrics_history_id` PRIMARY KEY(`id`),
  FOREIGN KEY (`campaign_id`) REFERENCES `user_campaigns`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `hist_campaign_id_idx` ON `campaign_metrics_history` (`campaign_id`);
CREATE INDEX `hist_recorded_at_idx` ON `campaign_metrics_history` (`recorded_at`);
CREATE INDEX `hist_campaign_recorded_idx` ON `campaign_metrics_history` (`campaign_id`, `recorded_at`);
