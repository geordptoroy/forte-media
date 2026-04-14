-- FORTE MEDIA Database Initialization
-- MySQL 8.0 Schema
-- Reset Completo: Mantendo apenas autenticação e usuários

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
CREATE INDEX `users_email_idx` ON `users` (`email`);
