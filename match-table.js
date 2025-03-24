// New file for match listing table component
export function createMatchTable(matchService) {
    function formatDateTime(date, hour) {
        if (!date) return '';
        const dateObj = new Date(date);
        const formattedDate = new Intl.DateTimeFormat('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        }).format(dateObj);
        return `${formattedDate} ${hour}:00`;
    }
    
    function getAllMatches() {
        return matchService.getAllMatches();
    }
    
    function getMatchesByDate(date) {
        return matchService.getMatchesByDate(date);
    }
    
    return {
        formatDateTime,
        getAllMatches,
        getMatchesByDate
    };
}