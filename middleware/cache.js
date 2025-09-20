// Simple in-memory cache middleware
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache middleware
const cacheMiddleware = (duration = CACHE_DURATION) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `${req.originalUrl}_${req.user?.id || 'anonymous'}`;
        const cached = cache.get(key);

        if (cached && Date.now() - cached.timestamp < duration) {
            console.log(`Cache hit for ${key}`);
            return res.json(cached.data);
        }

        // Store original res.json
        const originalJson = res.json.bind(res);

        // Override res.json to cache the response
        res.json = function(data) {
            // Cache the response
            cache.set(key, {
                data: data,
                timestamp: Date.now()
            });

            // Call original res.json
            originalJson(data);
        };

        next();
    };
};

// Clear cache for specific pattern
const clearCache = (pattern) => {
    const keysToDelete = [];
    
    for (const key of cache.keys()) {
        if (key.includes(pattern)) {
            keysToDelete.push(key);
        }
    }
    
    keysToDelete.forEach(key => cache.delete(key));
    console.log(`Cleared ${keysToDelete.length} cache entries for pattern: ${pattern}`);
};

// Clear all cache
const clearAllCache = () => {
    cache.clear();
    console.log('All cache cleared');
};

// Get cache statistics
const getCacheStats = () => {
    return {
        size: cache.size,
        keys: Array.from(cache.keys()),
        memoryUsage: process.memoryUsage()
    };
};

// Cleanup expired cache entries
const cleanupExpiredCache = () => {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
            keysToDelete.push(key);
        }
    }
    
    keysToDelete.forEach(key => cache.delete(key));
    
    if (keysToDelete.length > 0) {
        console.log(`Cleaned up ${keysToDelete.length} expired cache entries`);
    }
};

// Run cleanup every 10 minutes
setInterval(cleanupExpiredCache, 10 * 60 * 1000);

module.exports = {
    cacheMiddleware,
    clearCache,
    clearAllCache,
    getCacheStats
};
