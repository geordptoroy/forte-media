import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Refactored for local authentication with email and password hash.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  /** User's full name */
  name: text("name"),
  /** User's unique email address used for login */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** BCrypt hashed password */
  passwordHash: text("password_hash"),
  /** For tracking purposes, can be 'local' or other if added later */
  loginMethod: varchar("loginMethod", { length: 64 }).default("local"),
  /** User role for permissions */
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Armazenamento seguro de credenciais Meta API por usuário.
 * Cada usuário agora fornece seu próprio Access Token.
 */
export const userMetaCredentials = mysqlTable(
  "user_meta_credentials",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull().unique(),
    
    // Meta Developer App Configuration (Optional if using User Token)
    metaAppId: varchar("meta_app_id", { length: 255 }),
    encryptedAppSecret: text("encrypted_app_secret"),
    
    // Access Token (User Token provided by the user in the UI)
    encryptedAccessToken: text("encrypted_access_token").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    
    // Ad Account Configuration (Optional, for campaign management)
    adAccountId: varchar("ad_account_id", { length: 64 }),
    accountName: varchar("account_name", { length: 255 }),
    
    // Permissions and Validation
    permissions: json("permissions").$type<string[]>().notNull().default([]),
    isValid: boolean("is_valid").default(true).notNull(),
    lastValidatedAt: timestamp("last_validated_at"),
    validationError: text("validation_error"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

export type UserMetaCredentials = typeof userMetaCredentials.$inferSelect;
export type InsertUserMetaCredentials = typeof userMetaCredentials.$inferInsert;

/**
 * Anúncios competitivos favoritos do usuário.
 * Refatorado para incluir todos os campos da API ads_archive da Meta.
 */
export const favoriteAds = mysqlTable(
  "favorite_ads",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    
    // Meta API Fields
    adId: varchar("ad_id", { length: 64 }).notNull(),
    pageId: varchar("page_id", { length: 64 }).notNull(),
    pageName: text("page_name"),
    adSnapshotUrl: text("ad_snapshot_url"),
    adDeliveryStartTime: timestamp("ad_delivery_start_time"),
    adDeliveryStopTime: timestamp("ad_delivery_stop_time"),
    publisherPlatforms: json("publisher_platforms").$type<string[]>().notNull().default([]),
    
    // Creative Content
    adCreativeBodies: json("ad_creative_bodies").$type<string[]>().notNull().default([]),
    adCreativeLinkTitles: json("ad_creative_link_titles").$type<string[]>().notNull().default([]),
    adCreativeLinkDescriptions: json("ad_creative_link_descriptions").$type<string[]>().notNull().default([]),
    
    // Performance Data (Limited for common ads in BR)
    currency: varchar("currency", { length: 3 }),
    spend: json("spend").$type<{ min?: number; max?: number; range?: string }>(),
    impressions: json("impressions").$type<{ min?: number; max?: number; range?: string }>(),
    
    // Demographic and Regional (Political/EU only)
    demographicDistribution: json("demographic_distribution"),
    regionDistribution: json("region_distribution"),
    
    // Internal Tracking
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("fav_user_id_idx").on(table.userId),
    adIdIdx: index("fav_ad_id_idx").on(table.adId),
  })
);

export type FavoriteAd = typeof favoriteAds.$inferSelect;
export type InsertFavoriteAd = typeof favoriteAds.$inferInsert;

/**
 * Monitoramento contínuo de anúncios competitivos.
 */
export const monitoredAds = mysqlTable(
  "monitored_ads",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    adId: varchar("ad_id", { length: 64 }).notNull(),
    pageId: varchar("page_id", { length: 64 }).notNull(),
    pageName: text("page_name"),
    monitoringStatus: mysqlEnum("monitoring_status", ["active", "paused", "completed"]).default("active").notNull(),
    lastCheckedAt: timestamp("last_checked_at"),
    isStillActive: boolean("is_still_active").default(true).notNull(),
    
    // Historical Data for analysis
    lastKnownSpend: json("last_known_spend"),
    lastKnownImpressions: json("last_known_impressions"),
    metricsHistory: json("metrics_history").$type<Array<{ 
      date: string; 
      spend?: any; 
      impressions?: any;
      isActive: boolean;
    }>>().notNull().default([]),
    
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("mon_user_id_idx").on(table.userId),
    adIdIdx: index("mon_ad_id_idx").on(table.adId),
  })
);

export type MonitoredAd = typeof monitoredAds.$inferSelect;
export type InsertMonitoredAd = typeof monitoredAds.$inferInsert;

/**
 * Campanhas do usuário para análise de performance.
 */
export const userCampaigns = mysqlTable(
  "user_campaigns",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    campaignId: varchar("campaign_id", { length: 64 }).notNull(),
    campaignName: text("campaign_name").notNull(),
    adAccountId: varchar("ad_account_id", { length: 64 }).notNull(),
    status: mysqlEnum("status", ["active", "paused", "completed", "archived"]).default("active").notNull(),
    objective: varchar("objective", { length: 64 }),
    totalSpend: decimal("total_spend", { precision: 12, scale: 2 }).default("0.00").notNull(),
    totalImpressions: int("total_impressions").default(0).notNull(),
    totalClicks: int("total_clicks").default(0).notNull(),
    totalConversions: int("total_conversions").default(0).notNull(),
    totalConversionValue: decimal("total_conversion_value", { precision: 12, scale: 2 }).default("0.00"),
    roas: decimal("roas", { precision: 5, scale: 2 }),
    ctr: decimal("ctr", { precision: 5, scale: 2 }),
    cpc: decimal("cpc", { precision: 8, scale: 2 }),
    cpm: decimal("cpm", { precision: 8, scale: 2 }),
    currency: varchar("currency", { length: 3 }),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    lastSyncedAt: timestamp("last_synced_at"),
    metaData: json("meta_data"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("camp_user_id_idx").on(table.userId),
    campaignIdIdx: index("camp_campaign_id_idx").on(table.campaignId),
  })
);

export type UserCampaign = typeof userCampaigns.$inferSelect;
export type InsertUserCampaign = typeof userCampaigns.$inferInsert;

/**
 * Histórico de métricas de campanhas para análise de tendências.
 */
export const campaignMetricsHistory = mysqlTable(
  "campaign_metrics_history",
  {
    id: int("id").autoincrement().primaryKey(),
    campaignId: int("campaign_id").notNull(),
    spend: decimal("spend", { precision: 12, scale: 2 }).notNull(),
    impressions: int("impressions").notNull(),
    clicks: int("clicks").notNull(),
    conversions: int("conversions"),
    conversionValue: decimal("conversion_value", { precision: 12, scale: 2 }),
    roas: decimal("roas", { precision: 5, scale: 2 }),
    ctr: decimal("ctr", { precision: 5, scale: 2 }),
    cpc: decimal("cpc", { precision: 8, scale: 2 }),
    cpm: decimal("cpm", { precision: 8, scale: 2 }),
    recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  },
  (table) => ({
    campaignIdIdx: index("hist_campaign_id_idx").on(table.campaignId),
    recordedAtIdx: index("hist_recorded_at_idx").on(table.recordedAt),
  })
);

export type CampaignMetricsHistory = typeof campaignMetricsHistory.$inferSelect;
export type InsertCampaignMetricsHistory = typeof campaignMetricsHistory.$inferInsert;
