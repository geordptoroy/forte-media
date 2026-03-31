CREATE TABLE `campaign_metrics_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaign_id` int NOT NULL,
	`spend` decimal(12,2) NOT NULL,
	`impressions` int NOT NULL,
	`clicks` int NOT NULL,
	`conversions` int,
	`conversion_value` decimal(12,2),
	`roas` decimal(5,2),
	`ctr` decimal(5,2),
	`cpc` decimal(8,2),
	`cpm` decimal(8,2),
	`recorded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campaign_metrics_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorite_ads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`ad_id` varchar(64) NOT NULL,
	`page_id` varchar(64) NOT NULL,
	`page_name` text,
	`ad_body` text,
	`ad_snapshot_url` text,
	`spend` decimal(12,2),
	`impressions` int,
	`currency` varchar(3),
	`delivery_start_time` timestamp,
	`delivery_stop_time` timestamp,
	`meta_data` json,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `favorite_ads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monitored_ads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`ad_id` varchar(64) NOT NULL,
	`page_id` varchar(64) NOT NULL,
	`page_name` text,
	`monitoring_status` enum('active','paused','completed') NOT NULL DEFAULT 'active',
	`last_checked_at` timestamp,
	`is_still_active` boolean NOT NULL DEFAULT true,
	`last_known_spend` decimal(12,2),
	`last_known_impressions` int,
	`spend_history` json,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitored_ads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_campaigns` (
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
	`start_date` timestamp,
	`end_date` timestamp,
	`last_synced_at` timestamp,
	`meta_data` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_meta_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`encrypted_access_token` text NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`permissions` json NOT NULL,
	`is_valid` boolean NOT NULL DEFAULT true,
	`last_validated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_meta_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `hist_campaign_id_idx` ON `campaign_metrics_history` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `hist_recorded_at_idx` ON `campaign_metrics_history` (`recorded_at`);--> statement-breakpoint
CREATE INDEX `fav_user_id_idx` ON `favorite_ads` (`user_id`);--> statement-breakpoint
CREATE INDEX `fav_ad_id_idx` ON `favorite_ads` (`ad_id`);--> statement-breakpoint
CREATE INDEX `mon_user_id_idx` ON `monitored_ads` (`user_id`);--> statement-breakpoint
CREATE INDEX `mon_ad_id_idx` ON `monitored_ads` (`ad_id`);--> statement-breakpoint
CREATE INDEX `camp_user_id_idx` ON `user_campaigns` (`user_id`);--> statement-breakpoint
CREATE INDEX `camp_campaign_id_idx` ON `user_campaigns` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `user_meta_credentials` (`user_id`);