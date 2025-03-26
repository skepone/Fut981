// New file for handling data persistence
import { config } from './config.js';

export const Storage = {
    // Keys for localStorage
    KEYS: {
        MATCHES: 'liga981_matches',
        TEAMS: 'liga981_teams',
        HEADER_LOGO: 'headerLogo',
        TABLE_BACKGROUND: 'tableBackground',
        SHOW_ADDITIONAL_HOURS: 'showAdditionalHours'
    },
    
    // Save matches to localStorage
    saveMatches(matches) {
        localStorage.setItem(this.KEYS.MATCHES, JSON.stringify(matches));
    },
    
    // Load matches from localStorage
    loadMatches() {
        const saved = localStorage.getItem(this.KEYS.MATCHES);
        return saved ? JSON.parse(saved) : null;
    },
    
    // Save teams to localStorage
    saveTeams(teams) {
        localStorage.setItem(this.KEYS.TEAMS, JSON.stringify(teams));
    },
    
    // Load teams from localStorage
    loadTeams() {
        const saved = localStorage.getItem(this.KEYS.TEAMS);
        return saved ? JSON.parse(saved) : null;
    },
    
    // Save UI preferences
    saveUIPreference(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    // Load UI preference
    loadUIPreference(key, defaultValue) {
        const saved = localStorage.getItem(key);
        return saved !== null ? JSON.parse(saved) : defaultValue;
    }
};