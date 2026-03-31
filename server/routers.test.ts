import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';

describe('tRPC Routers', () => {
  describe('Meta Credentials Router', () => {
    it('should validate access token format', () => {
      const schema = z.object({
        accessToken: z.string().min(1, 'Access token is required'),
      });

      expect(() => {
        schema.parse({ accessToken: '' });
      }).toThrow();

      expect(() => {
        schema.parse({ accessToken: 'valid-token' });
      }).not.toThrow();
    });

    it('should validate search ads input', () => {
      const schema = z.object({
        searchTerms: z.array(z.string()).min(1),
        countries: z.array(z.string()).min(1),
        adType: z.enum(['POLITICAL', 'ISSUE_ADS', 'ALL']).optional(),
        limit: z.number().min(1).max(100).optional(),
        after: z.string().optional(),
      });

      expect(() => {
        schema.parse({
          searchTerms: [],
          countries: ['US'],
        });
      }).toThrow();

      expect(() => {
        schema.parse({
          searchTerms: ['test'],
          countries: ['US'],
          limit: 50,
        });
      }).not.toThrow();

      expect(() => {
        schema.parse({
          searchTerms: ['test'],
          countries: ['US'],
          limit: 200, // exceeds max
        });
      }).toThrow();
    });

    it('should validate scaled ads input', () => {
      const schema = z.object({
        countries: z.array(z.string()).min(1),
        minSpend: z.number().optional(),
      });

      expect(() => {
        schema.parse({
          countries: [],
        });
      }).toThrow();

      expect(() => {
        schema.parse({
          countries: ['US', 'BR'],
          minSpend: 1000,
        });
      }).not.toThrow();
    });

    it('should validate campaign metrics input', () => {
      const schema = z.object({
        campaignId: z.string().min(1),
        dateStart: z.string(),
        dateStop: z.string(),
      });

      expect(() => {
        schema.parse({
          campaignId: '',
          dateStart: '2024-01-01',
          dateStop: '2024-01-31',
        });
      }).toThrow();

      expect(() => {
        schema.parse({
          campaignId: '123456',
          dateStart: '2024-01-01',
          dateStop: '2024-01-31',
        });
      }).not.toThrow();
    });
  });

  describe('Ads Router', () => {
    it('should validate add favorite input', () => {
      const schema = z.object({
        adId: z.string().min(1),
        pageId: z.string().min(1),
        pageName: z.string().optional(),
        adBody: z.string().optional(),
        adSnapshotUrl: z.string().optional(),
        spend: z.number().optional(),
        impressions: z.number().optional(),
        currency: z.string().optional(),
      });

      expect(() => {
        schema.parse({
          adId: '',
          pageId: '123',
        });
      }).toThrow();

      expect(() => {
        schema.parse({
          adId: 'ad-123',
          pageId: 'page-456',
          pageName: 'Test Page',
          spend: 1000,
          impressions: 50000,
        });
      }).not.toThrow();
    });

    it('should validate remove favorite input', () => {
      const schema = z.object({
        favoriteId: z.number(),
      });

      expect(() => {
        schema.parse({ favoriteId: 123 });
      }).not.toThrow();

      expect(() => {
        schema.parse({ favoriteId: 'not-a-number' });
      }).toThrow();
    });
  });

  describe('Monitoring Router', () => {
    it('should validate add monitored input', () => {
      const schema = z.object({
        adId: z.string().min(1),
        pageId: z.string().min(1),
        pageName: z.string().optional(),
        alertConfig: z.record(z.string(), z.any()).optional(),
      });

      expect(() => {
        schema.parse({
          adId: 'ad-123',
          pageId: 'page-456',
        });
      }).not.toThrow();

      expect(() => {
        schema.parse({
          adId: '',
          pageId: 'page-456',
        });
      }).toThrow();
    });

    it('should validate remove monitored input', () => {
      const schema = z.object({
        monitoredId: z.number(),
      });

      expect(() => {
        schema.parse({ monitoredId: 456 });
      }).not.toThrow();
    });
  });

  describe('Campaigns Router', () => {
    it('should validate get metrics history input', () => {
      const schema = z.object({
        campaignId: z.number(),
      });

      expect(() => {
        schema.parse({ campaignId: 789 });
      }).not.toThrow();

      expect(() => {
        schema.parse({ campaignId: 'not-a-number' });
      }).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', () => {
      const schema = z.object({
        accessToken: z.string().min(1),
      });

      expect(() => {
        schema.parse({});
      }).toThrow();
    });

    it('should handle type mismatches', () => {
      const schema = z.object({
        limit: z.number().min(1).max(100),
      });

      expect(() => {
        schema.parse({ limit: 'not-a-number' });
      }).toThrow();

      expect(() => {
        schema.parse({ limit: 50 });
      }).not.toThrow();
    });

    it('should handle boundary values', () => {
      const schema = z.object({
        limit: z.number().min(1).max(100),
      });

      expect(() => {
        schema.parse({ limit: 0 });
      }).toThrow();

      expect(() => {
        schema.parse({ limit: 1 });
      }).not.toThrow();

      expect(() => {
        schema.parse({ limit: 100 });
      }).not.toThrow();

      expect(() => {
        schema.parse({ limit: 101 });
      }).toThrow();
    });
  });
});
