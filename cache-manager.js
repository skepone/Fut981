// Cache management service for Liga 981
export function createCacheManager() {
    // Validate if cached data is fresh
    function isDataFresh(key) {
        const timestamp = localStorage.getItem(`${key}_timestamp`);
        if (!timestamp) return false;
        
        // Consider data stale after 30 seconds (adjust as needed)
        const STALE_TIME = 30 * 1000; // 30 seconds
        return (Date.now() - parseInt(timestamp)) < STALE_TIME;
    }
    
    // Save data with timestamp
    function saveWithTimestamp(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
        localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    }
    
    // Get data if fresh, otherwise return null
    function getFreshData(key) {
        if (!isDataFresh(key)) {
            return null;
        }
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
    
    // Clear all cache for the app
    function clearAllCache() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.includes('_timestamp') || 
                key === 'savedMatches' || 
                key === 'savedTeams' ||
                key === 'headerLogo' ||
                key === 'tableBackground') {
                localStorage.removeItem(key);
            }
        }
    }
    
    return {
        isDataFresh,
        saveWithTimestamp,
        getFreshData,
        clearAllCache
    };
}