// Utility service for exporting data
export function createExportService(matchService) {
    
    // Export all data tables: matches and teams
    function exportAllData() {
        const data = {
            matches: matchService.matches.value,
            teams: JSON.parse(localStorage.getItem('savedTeams') || '{}')
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'liga981_all_data.json');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return 'Todos los datos exportados correctamente';
    }
    
    return {
        exportAllData
    };
}