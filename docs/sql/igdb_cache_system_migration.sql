-- IGDB Cache System Database Tables
-- Run this in Supabase SQL editor to add caching layer for rate limit handling

-- 1. IGDB Cache Table - Stores API responses for intelligent caching
CREATE TABLE IF NOT EXISTS igdb_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  endpoint TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  original_query TEXT NOT NULL,
  response_data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  response_size INTEGER DEFAULT 0,
  
  -- Metadata for optimization
  is_popular BOOLEAN DEFAULT false,
  search_terms TEXT[], -- For search optimization
  game_ids INTEGER[] -- For quick game lookups
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_igdb_cache_key ON igdb_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_igdb_cache_expires ON igdb_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_igdb_cache_endpoint ON igdb_cache(endpoint);
CREATE INDEX IF NOT EXISTS idx_igdb_cache_popular ON igdb_cache(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_igdb_cache_last_accessed ON igdb_cache(last_accessed DESC);
CREATE INDEX IF NOT EXISTS idx_igdb_cache_search_terms ON igdb_cache USING GIN(search_terms);
CREATE INDEX IF NOT EXISTS idx_igdb_cache_game_ids ON igdb_cache USING GIN(game_ids);

-- 3. Cache Statistics Table - Track cache performance
CREATE TABLE IF NOT EXISTS igdb_cache_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  cache_misses INTEGER DEFAULT 0,
  api_calls_saved INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  popular_queries TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(date)
);

-- 4. Rate Limiting Tracker - Monitor API usage
CREATE TABLE IF NOT EXISTS igdb_rate_limit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  queue_size INTEGER DEFAULT 0,
  wait_time_ms INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

-- 5. Update Triggers for Cache Management
CREATE OR REPLACE FUNCTION update_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed = NOW();
    NEW.hit_count = NEW.hit_count + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cache_access
    BEFORE UPDATE ON igdb_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_cache_access();

-- 6. Cache Cleanup Function - Remove expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM igdb_cache 
    WHERE expires_at < NOW() AND is_popular = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO igdb_cache_stats (date, total_requests)
    VALUES (CURRENT_DATE, 0)
    ON CONFLICT (date) DO NOTHING;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Cache Hit Rate Function - Analytics
CREATE OR REPLACE FUNCTION get_cache_hit_rate(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    date DATE,
    total_requests INTEGER,
    cache_hits INTEGER,
    hit_rate NUMERIC,
    api_calls_saved INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.date,
        s.total_requests,
        s.cache_hits,
        CASE 
            WHEN s.total_requests > 0 THEN 
                ROUND((s.cache_hits::NUMERIC / s.total_requests::NUMERIC) * 100, 2)
            ELSE 0 
        END as hit_rate,
        s.api_calls_saved
    FROM igdb_cache_stats s
    WHERE s.date >= CURRENT_DATE - INTERVAL '%d days' % days_back
    ORDER BY s.date DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Popular Content Identification Function
CREATE OR REPLACE FUNCTION mark_popular_content()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Mark frequently accessed content as popular
    WITH popular_cache AS (
        SELECT id
        FROM igdb_cache
        WHERE hit_count >= 10 
        OR last_accessed >= NOW() - INTERVAL '24 hours'
        AND hit_count >= 3
    )
    UPDATE igdb_cache 
    SET is_popular = true,
        expires_at = GREATEST(expires_at, NOW() + INTERVAL '7 days')
    WHERE id IN (SELECT id FROM popular_cache)
    AND is_popular = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- 9. Cache Key Generation Function
CREATE OR REPLACE FUNCTION generate_cache_key(
    endpoint_name TEXT,
    query_body TEXT,
    params JSONB DEFAULT '{}'::jsonb
) RETURNS TEXT AS $$
BEGIN
    RETURN MD5(
        endpoint_name || 
        COALESCE(query_body, '') || 
        COALESCE(params::text, '{}')
    );
END;
$$ LANGUAGE plpgsql;

-- 10. RLS Policies for Cache Tables
ALTER TABLE igdb_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE igdb_cache_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE igdb_rate_limit_log ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage cache (for Edge Functions)
CREATE POLICY "Service role can manage igdb_cache" ON igdb_cache
    FOR ALL USING (true);

CREATE POLICY "Service role can manage cache_stats" ON igdb_cache_stats
    FOR ALL USING (true);

CREATE POLICY "Service role can manage rate_limit_log" ON igdb_rate_limit_log
    FOR ALL USING (true);

-- 11. Scheduled Cache Maintenance (Optional - setup via pg_cron if available)
-- SELECT cron.schedule('cleanup-igdb-cache', '0 2 * * *', 'SELECT cleanup_expired_cache();');
-- SELECT cron.schedule('mark-popular-content', '0 3 * * *', 'SELECT mark_popular_content();');

-- 12. Initial Cache Statistics Entry
INSERT INTO igdb_cache_stats (date, total_requests, cache_hits, cache_misses)
VALUES (CURRENT_DATE, 0, 0, 0)
ON CONFLICT (date) DO NOTHING;

-- 13. Cache Performance View
CREATE OR REPLACE VIEW igdb_cache_performance AS
SELECT 
    COUNT(*) as total_entries,
    COUNT(*) FILTER (WHERE is_popular) as popular_entries,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as active_entries,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_entries,
    AVG(hit_count) as avg_hit_count,
    SUM(hit_count) as total_hits,
    AVG(response_size) as avg_response_size,
    MAX(last_accessed) as latest_access,
    COUNT(DISTINCT endpoint) as unique_endpoints
FROM igdb_cache;

COMMENT ON TABLE igdb_cache IS 'Caches IGDB API responses to handle rate limits and improve performance';
COMMENT ON TABLE igdb_cache_stats IS 'Daily statistics for cache performance monitoring';
COMMENT ON TABLE igdb_rate_limit_log IS 'Logs rate limiting events and API usage patterns';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'IGDB Cache System successfully created!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Update Edge Function to use database caching';
    RAISE NOTICE '2. Deploy updated igdb-proxy function';
    RAISE NOTICE '3. Monitor cache performance with igdb_cache_performance view';
END $$;