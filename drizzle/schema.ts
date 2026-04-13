import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, decimal, index, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash"),
  loginMethod: varchar("loginMethod", { length: 64 }).default("local"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("users_created_at_idx").on(table.createdAt),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Armazenamento seguro de credenciais Meta API por usuário.
 */
export const userMetaCredentials = mysqlTable(
  "user_meta_credentials",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull().unique(),
    metaAppId: varchar("meta_app_id", { length: 255 }),
    encryptedAppSecret: text("encrypted_app_secret"),
    encryptedAccessToken: text("encrypted_access_token").notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    adAccountId: varchar("ad_account_id", { length: 64 }),
    accountName: varchar("account_name", { length: 255 }),
    permissions: json("permissions").$type<string[]>().notNull().default([]),
    isValid: boolean("is_valid").default(true).notNull(),
    lastValidatedAt: timestamp("last_validated_at"),
    validationError: text("validation_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    isValidIdx: index("user_is_valid_idx").on(table.isValid),
  })
);

/**
 * Anúncios competitivos favoritos do usuário.
 */
export const favoriteAds = mysqlTable(
  "favorite_ads",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    adId: varchar("ad_id", { length: 64 }).notNull(),
    pageId: varchar("page_id", { length: 64 }).notNull(),
    pageName: text("page_name"),
    adSnapshotUrl: text("ad_snapshot_url"),
    adDeliveryStartTime: timestamp("ad_delivery_start_time"),
    adDeliveryStopTime: timestamp("ad_delivery_stop_time"),
    publisherPlatforms: json("publisher_platforms").$type<string[]>().notNull().default([]),
    adCreativeBodies: json("ad_creative_bodies").$type<string[]>().notNull().default([]),
    adCreativeLinkTitles: json("ad_creative_link_titles").$type<string[]>().notNull().default([]),
    adCreativeLinkDescriptions: json("ad_creative_link_descriptions").$type<string[]>().notNull().default([]),
    adCreativeLinkCaptions: json("ad_creative_link_captions").$type<string[]>().notNull().default([]),
    languages: json("languages").$type<string[]>().notNull().default([]),
    currency: varchar("currency", { length: 3 }),
    spend: json("spend").$type<{ lower_bound?: string; upper_bound?: string }>(),
    impressions: json("impressions").$type<{ lower_bound?: string; upper_bound?: string }>(),
    estimatedAudienceSize: json("estimated_audience_size").$type<{ lower_bound?: string; upper_bound?: string }>(),
    demographicDistribution: json("demographic_distribution").$type<Array<{ percentage: string; age: string; gender: string }>>(),
    deliveryByRegion: json("delivery_by_region").$type<Array<{ percentage: string; region: string }>>(),
    ageCountryGenderReachBreakdown: json("age_country_gender_reach_breakdown").$type<any>(),
    targetLocations: json("target_locations").$type<any>(),
    targetAges: json("target_ages").$type<string[]>(),
    targetGender: varchar("target_gender", { length: 32 }),
    cdnVideoUrl: text("cdn_video_url"),
    cdnImageUrl: text("cdn_image_url"),
    cdnThumbnailUrl: text("cdn_thumbnail_url"),
    mediaExtractedAt: timestamp("media_extracted_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    // Mantendo o nome exato do init.sql para evitar que o Drizzle tente renomear
    favUserAdUnique: uniqueIndex("fav_user_ad_unique").on(table.userId, table.adId),
    createdAtIdx: index("fav_created_at_idx").on(table.createdAt),
  })
);

/**
 * Tabela de Log de Mineração de Anúncios
 */
export const adMiningLog = mysqlTable(
  "ad_mining_log",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    searchTerms: text("search_terms"),
    countriesFilter: json("countries_filter").$type<string[]>().notNull().default([]),
    adTypeFilter: varchar("ad_type_filter", { length: 64 }),
    resultsCount: int("results_count").default(0),
    executedAt: timestamp("executed_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("mining_user_id_idx").on(table.userId),
    executedAtIdx: index("mining_executed_at_idx").on(table.executedAt),
  })
);

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
    monUserAdUnique: uniqueIndex("mon_user_ad_unique").on(table.userId, table.adId),
    userStatusIdx: index("mon_user_status_idx").on(table.userId, table.monitoringStatus),
    statusIdx: index("mon_status_idx").on(table.monitoringStatus),
  })
);

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
    campUserCampaignUnique: uniqueIndex("camp_user_campaign_unique").on(table.userId, table.campaignId),
    userStatusIdx: index("camp_user_status_idx").on(table.userId, table.status),
    statusIdx: index("camp_status_idx").on(table.status),
    createdAtIdx: index("camp_created_at_idx").on(table.createdAt),
  })
);

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
    campaignRecordedIdx: index("hist_campaign_recorded_idx").on(table.campaignId, table.recordedAt),
  })
);
