// Match management service
import { ref, reactive } from 'vue';
import { createCacheManager } from './cache-manager.js';

export function createMatchService() {
    const matches = ref([]);
    const cacheManager = createCacheManager();
    
    // Save matches to localStorage with timestamp
    function saveMatches() {
        cacheManager.saveWithTimestamp('savedMatches', matches.value);
    }
    
    // Load matches from localStorage
    function loadMatches() {
        const freshData = cacheManager.getFreshData('savedMatches');
        if (freshData) {
            matches.value = freshData;
            return true;
        }
        
        const savedMatches = localStorage.getItem('savedMatches');
        if (savedMatches) {
            matches.value = JSON.parse(savedMatches);
            // Immediately save with updated timestamp
            saveMatches();
            return true;
        }
        return false;
    }
    
    function addMatch(match) {
        const newId = Math.max(0, ...matches.value.map(m => m.id || 0)) + 1;
        const newMatch = {
            id: newId,
            ...match
        };
        matches.value.push(newMatch);
        saveMatches();
        return newMatch;
    }
    
    function removeMatch(matchId) {
        const index = matches.value.findIndex(m => m.id === matchId);
        if (index !== -1) {
            matches.value.splice(index, 1);
            saveMatches();
            return true;
        }
        return false;
    }
    
    function updateMatch(matchId, updates) {
        const index = matches.value.findIndex(m => m.id === matchId);
        if (index !== -1) {
            matches.value[index] = {
                ...matches.value[index],
                ...updates
            };
            saveMatches();
            return matches.value[index];
        }
        return null;
    }
    
    function getMatch(date, hour, tableIndex) {
        return matches.value.find(match => 
            match.date === date && 
            match.hour === parseInt(hour) && 
            match.table === tableIndex
        );
    }
    
    function isTableAvailable(date, hour, table, excludeMatchId = null) {
        const hasConflict = matches.value.some(match => 
            match.date === date && 
            match.hour === parseInt(hour) && 
            match.table === parseInt(table) && 
            (!excludeMatchId || match.id !== excludeMatchId)
        );
        
        return !hasConflict;
    }
    
    // Renamed function to be more explicit
    function loadSavedMatches() {
        if (!loadMatches()) {
            loadSampleData();
        }
    }
    
    function loadSampleData() {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        
        matches.value = [
            {
                id: 1,
                category: 'Primera Division',
                teamA: 'Equipo A',
                teamB: 'Equipo B',
                date: today,
                hour: 21,
                table: 0
            },
            {
                id: 2,
                category: 'Segunda Division',
                teamA: 'Equipo C',
                teamB: 'Equipo D',
                date: today,
                hour: 21,
                table: 1
            },
            {
                id: 3,
                category: 'Tercera Division',
                teamA: 'Equipo E',
                teamB: 'Equipo F',
                date: today,
                hour: 22,
                table: 0
            },
            {
                id: 4,
                category: 'Cuarta Division',
                teamA: 'Equipo G',
                teamB: 'Equipo H',
                date: tomorrow,
                hour: 21,
                table: 0
            }
        ];
        saveMatches();
    }
    
    // New function to replace all matches with imported data
    function importMatches(importedMatches) {
        matches.value = importedMatches;
        saveMatches();
    }
    
    // Get all matches for a specific date
    function getMatchesByDate(date) {
        return matches.value.filter(match => match.date === date);
    }
    
    // Get all matches
    function getAllMatches() {
        return matches.value;
    }
    
    // Force reload matches from localStorage
    function forceReloadMatches() {
        const savedMatches = localStorage.getItem('savedMatches');
        if (savedMatches) {
            matches.value = JSON.parse(savedMatches);
            saveMatches();
            return true;
        }
        return false;
    }
    
    return {
        matches,
        addMatch,
        removeMatch,
        updateMatch,
        getMatch,
        isTableAvailable,
        loadSampleData,
        loadSavedMatches,
        saveMatches,
        loadMatches,
        importMatches,
        getMatchesByDate,
        getAllMatches,
        forceReloadMatches
    };
}