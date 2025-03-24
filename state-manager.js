// State management and URL handling
export function createStateManager(matchService) {
    // Updates the URL with the current date selection
    function updateURLWithDate(date) {
        // Create a new URL based on the current URL
        const url = new URL(window.location.href);
        
        // Set the date parameter
        url.searchParams.set('date', date);
        
        // Update the browser history without reloading
        window.history.replaceState({}, '', url);
    }
    
    // Initialize state from URL parameters
    function initializeFromURL(selectedDateRef) {
        const urlParams = new URLSearchParams(window.location.search);
        const dateParam = urlParams.get('date');
        
        // Set selected date if provided in URL
        if (dateParam) {
            selectedDateRef.value = dateParam;
        }
        
        // Ensure matches are loaded from localStorage first
        matchService.loadSavedMatches();
    }
    
    return {
        updateURLWithDate,
        initializeFromURL
    };
}