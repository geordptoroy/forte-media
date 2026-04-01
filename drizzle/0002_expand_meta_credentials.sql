-- Expansion of user_meta_credentials table to support full Meta Developer App configuration
-- This migration adds fields for App ID, App Secret (encrypted), and Ad Account ID

ALTER TABLE `user_meta_credentials` 
ADD COLUMN `meta_app_id` VARCHAR(255) NOT NULL DEFAULT '' AFTER `user_id`,
ADD COLUMN `encrypted_app_secret` TEXT AFTER `meta_app_id`,
ADD COLUMN `ad_account_id` VARCHAR(64) AFTER `encrypted_app_secret`,
ADD COLUMN `account_name` VARCHAR(255) AFTER `ad_account_id`,
ADD COLUMN `is_system_user` BOOLEAN DEFAULT FALSE AFTER `account_name`,
ADD COLUMN `system_user_id` VARCHAR(255) AFTER `is_system_user`,
ADD COLUMN `permissions` JSON DEFAULT NULL AFTER `system_user_id`,
ADD COLUMN `last_validated_at` TIMESTAMP NULL AFTER `permissions`,
ADD COLUMN `validation_error` TEXT AFTER `last_validated_at`,
ADD UNIQUE KEY `unique_app_account` (`user_id`, `meta_app_id`, `ad_account_id`);

-- Create index for faster lookups by meta_app_id
CREATE INDEX `idx_meta_app_id` ON `user_meta_credentials` (`meta_app_id`);

-- Create index for faster lookups by ad_account_id
CREATE INDEX `idx_ad_account_id` ON `user_meta_credentials` (`ad_account_id`);
