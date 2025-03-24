import { createApp, ref, computed } from 'vue';
import { config } from './config.js';
import * as XLSX from 'xlsx';
import { setupSharing } from './sharing.js';
import { createMatchService } from './match-service.js';
import { createStateManager } from './state-manager.js';
import { createExportService } from './export-service.js';
import { createCacheManager } from './cache-manager.js';

createApp({
    setup() {
        const matchService = createMatchService();
        const stateManager = createStateManager(matchService);
        const exportService = createExportService(matchService);
        const cacheManager = createCacheManager();
        
        // State
        const selectedDate = ref(new Date().toISOString().split('T')[0]);
        const tables = ref(Array(config.tables).fill(null));
        const selectedMatch = ref(null);
        const selectedTable = ref(null);
        const selectedHour = ref(null);
        const showMoveDialog = ref(false);
        const moveDetails = ref({
            date: null,
            hour: null,
            table: null
        });
        const newMatch = ref({
            category: config.categories[0],
            teamA: '',
            teamB: ''
        });
        const notification = ref({
            show: false,
            message: '',
            type: 'info'
        });
        const userRole = ref('player'); 
        const showLoginDialog = ref(false);
        const adminPassword = ref('');
        const showHelpDialog = ref(false);
        const headerLogo = ref(config.defaultHeaderLogo);
        const tableBackgroundImage = ref(config.defaultTableBackground);
        const showImageSettingsDialog = ref(false);
        const showAdditionalHours = ref(false);
        const displayHours = ref([...config.hours]);
        const sharing = setupSharing();
        
        // Initialize state from URL parameters if present
        stateManager.initializeFromURL(selectedDate);

        // Methods
        function loadSavedImages() {
            const savedLogo = localStorage.getItem('headerLogo');
            if (savedLogo) {
                headerLogo.value = savedLogo;
            }
            
            const savedTableBackground = localStorage.getItem('tableBackground');
            if (savedTableBackground) {
                tableBackgroundImage.value = savedTableBackground;
            }
        }
        
        function loadSavedTeams(force = false) {
            if (force) {
                const savedTeams = localStorage.getItem('savedTeams');
                if (savedTeams) {
                    config.teams = JSON.parse(savedTeams);
                }
                return;
            }
            
            const freshTeams = cacheManager.getFreshData('savedTeams');
            if (freshTeams) {
                config.teams = freshTeams;
                return;
            }
            
            const savedTeams = localStorage.getItem('savedTeams');
            if (savedTeams) {
                config.teams = JSON.parse(savedTeams);
            }
        }
        
        function saveTeams() {
            cacheManager.saveWithTimestamp('savedTeams', config.teams);
        }
        
        function setToday() {
            selectedDate.value = new Date().toISOString().split('T')[0];
            updateCalendar();
        }
        
        function updateCalendar() {
            clearSelection();
            // Update URL when calendar changes
            stateManager.updateURLWithDate(selectedDate.value);
        }
        
        function getTableStatus(hour, tableIndex) {
            const isOccupied = matchService.getMatch(selectedDate.value, hour, tableIndex) !== undefined;
            
            const isSelected = selectedTable.value === tableIndex && 
                              selectedHour.value === parseInt(hour);
            
            return {
                'occupied': isOccupied,
                'available': !isOccupied,
                'selected': isSelected
            };
        }
        
        function getMatch(hour, tableIndex) {
            return matchService.getMatch(selectedDate.value, hour, tableIndex);
        }
        
        function selectTable(hour, tableIndex) {
            selectedHour.value = parseInt(hour);
            selectedTable.value = tableIndex;
            
            const match = getMatch(hour, tableIndex);
            if (match) {
                selectedMatch.value = match;
                moveDetails.value = {
                    date: match.date,
                    hour: match.hour,
                    table: match.table
                };
            } else {
                selectedMatch.value = null;
            }
        }
        
        function clearSelection() {
            selectedMatch.value = null;
            selectedTable.value = null;
            selectedHour.value = null;
            newMatch.value = {
                category: config.categories[0],
                teamA: '',
                teamB: ''
            };
        }
        
        function assignMatch() {
            if (!newMatch.value.teamA || !newMatch.value.teamB) {
                showNotification('Debes seleccionar ambos equipos', 'error');
                return;
            }
            
            if (newMatch.value.teamA === newMatch.value.teamB) {
                showNotification('No puedes seleccionar el mismo equipo', 'error');
                return;
            }
            
            const matchData = {
                category: newMatch.value.category,
                teamA: newMatch.value.teamA,
                teamB: newMatch.value.teamB,
                date: selectedDate.value,
                hour: selectedHour.value,
                table: selectedTable.value
            };
            
            matchService.addMatch(matchData);
            
            showNotification('Partido asignado correctamente', 'success');
            clearSelection();
        }
        
        function cancelMatch() {
            if (!selectedMatch.value) return;
            
            if (matchService.removeMatch(selectedMatch.value.id)) {
                showNotification('Partido cancelado correctamente', 'success');
                clearSelection();
            }
        }
        
        function moveMatch() {
            if (!selectedMatch.value || !moveDetails.value.date || 
                moveDetails.value.hour === null || moveDetails.value.table === null) return;
            
            if (!isAvailable(moveDetails.value.date, moveDetails.value.hour, moveDetails.value.table)) {
                showNotification('La mesa seleccionada no está disponible en ese horario', 'error');
                return;
            }
            
            const updated = matchService.updateMatch(selectedMatch.value.id, {
                date: moveDetails.value.date,
                hour: moveDetails.value.hour,
                table: moveDetails.value.table
            });
            
            if (updated) {
                showNotification('Partido movido correctamente', 'success');
                showMoveDialog.value = false;
                clearSelection();
                
                if (moveDetails.value.date === selectedDate.value) {
                    updateCalendar();
                }
            }
        }
        
        function isAvailable(date, hour, table) {
            return matchService.isTableAvailable(
                date, 
                hour, 
                table, 
                selectedMatch.value ? selectedMatch.value.id : null
            );
        }
        
        function importCSV(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const lines = content.split('\n');
                    const headers = lines[0].split(',');
                    
                    const idIndex = headers.indexOf('id');
                    const categoryIndex = headers.indexOf('category');
                    const teamAIndex = headers.indexOf('teamA');
                    const teamBIndex = headers.indexOf('teamB');
                    const dateIndex = headers.indexOf('date');
                    const hourIndex = headers.indexOf('hour');
                    const tableIndex = headers.indexOf('table');
                    
                    if (categoryIndex === -1 || teamAIndex === -1 || teamBIndex === -1 || 
                        dateIndex === -1 || hourIndex === -1 || tableIndex === -1) {
                        throw new Error('Formato de CSV incorrecto');
                    }
                    
                    const importedMatches = [];
                    const teamsToAdd = {};
                    
                    for (let i = 1; i < lines.length; i++) {
                        if (!lines[i].trim()) continue;
                        
                        const parts = lines[i].split(',');
                        const id = idIndex !== -1 ? parseInt(parts[idIndex]) : Math.random() * 10000;
                        const category = parts[categoryIndex];
                        const teamA = parts[teamAIndex];
                        const teamB = parts[teamBIndex];
                        
                        // Check if teams exist in the category
                        if (category && config.teams[category]) {
                            if (!teamsToAdd[category]) teamsToAdd[category] = [];
                            
                            if (teamA && !config.teams[category].includes(teamA) && 
                                !teamsToAdd[category].includes(teamA)) {
                                teamsToAdd[category].push(teamA);
                            }
                            
                            if (teamB && !config.teams[category].includes(teamB) && 
                                !teamsToAdd[category].includes(teamB)) {
                                teamsToAdd[category].push(teamB);
                            }
                        }
                        
                        importedMatches.push({
                            id,
                            category,
                            teamA,
                            teamB,
                            date: parts[dateIndex],
                            hour: parseInt(parts[hourIndex]),
                            table: parseInt(parts[tableIndex])
                        });
                    }
                    
                    // Add new teams to categories
                    for (const category in teamsToAdd) {
                        if (teamsToAdd[category].length > 0) {
                            config.teams[category] = [
                                ...config.teams[category],
                                ...teamsToAdd[category]
                            ];
                        }
                    }
                    
                    // Save updated teams to localStorage
                    saveTeams();
                    
                    // Use the new importMatches function
                    matchService.importMatches(importedMatches);
                    
                    showNotification('Datos importados correctamente', 'success');
                    updateCalendar();
                    
                } catch (error) {
                    showNotification('Error al importar el archivo: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        }
        
        function exportCSV() {
            const headers = ['id', 'category', 'teamA', 'teamB', 'date', 'hour', 'table'];
            let csvContent = headers.join(',') + '\n';
            
            matchService.matches.value.forEach(match => {
                const row = [
                    match.id,
                    match.category,
                    match.teamA,
                    match.teamB,
                    match.date,
                    match.hour,
                    match.table
                ];
                csvContent += row.join(',') + '\n';
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'liga981_calendario.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Datos exportados correctamente', 'success');
        }
        
        function showNotification(message, type = 'info') {
            notification.value = {
                show: true,
                message,
                type
            };
            
            setTimeout(() => {
                notification.value.show = false;
            }, 3000);
        }
        
        function getTeamsForCategory(category) {
            return config.teams[category] || [];
        }
        
        function formatDate(dateString) {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            }).format(date);
        }
        
        function formatDateLong(dateString) {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            }).format(date);
        }
        
        function toggleHelpDialog() {
            showHelpDialog.value = !showHelpDialog.value;
        }
        
        function toggleAdminMode() {
            showLoginDialog.value = true;
            adminPassword.value = '';
        }
        
        function checkAdminPassword() {
            if (adminPassword.value === config.adminPassword) {
                userRole.value = 'admin';
                showLoginDialog.value = false;
                showNotification('Modo administrador activado', 'success');
            } else {
                showNotification('Contraseña incorrecta', 'error');
            }
        }
        
        function logoutAdmin() {
            userRole.value = 'player';
            showNotification('Modo jugador activado', 'info');
        }
        
        function isAdmin() {
            return userRole.value === 'admin';
        }
        
        function uploadHeaderLogo(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                headerLogo.value = e.target.result;
                localStorage.setItem('headerLogo', headerLogo.value);
            };
            reader.readAsDataURL(file);
        }
        
        function uploadTableBackground(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                tableBackgroundImage.value = e.target.result;
                localStorage.setItem('tableBackground', tableBackgroundImage.value);
            };
            reader.readAsDataURL(file);
        }
        
        function resetHeaderLogo() {
            headerLogo.value = null;
            localStorage.removeItem('headerLogo');
        }
        
        function resetTableBackground() {
            tableBackgroundImage.value = null;
            localStorage.removeItem('tableBackground');
        }
        
        function toggleImageSettingsDialog() {
            showImageSettingsDialog.value = !showImageSettingsDialog.value;
        }
        
        function getCategoryColor(category) {
            return config.categoryColors[category] || '#3498db';
        }
        
        function toggleAdditionalHours() {
            showAdditionalHours.value = !showAdditionalHours.value;
            if (showAdditionalHours.value) {
                displayHours.value = [...config.additionalHours, ...config.hours].sort((a, b) => a - b);
            } else {
                displayHours.value = [...config.hours];
            }
        }
        
        function exportTeams() {
            const headers = ['category', 'team'];
            let csvContent = headers.join(',') + '\n';
            
            for (const category in config.teams) {
                config.teams[category].forEach(team => {
                    const row = [category, team];
                    csvContent += row.join(',') + '\n';
                });
            }
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'liga981_equipos.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Equipos exportados correctamente', 'success');
        }
        
        function importTeams(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const lines = content.split('\n');
                    const headers = lines[0].split(',');
                    
                    const categoryIndex = headers.indexOf('category');
                    const teamIndex = headers.indexOf('team');
                    
                    if (categoryIndex === -1 || teamIndex === -1) {
                        throw new Error('Formato de CSV incorrecto');
                    }
                    
                    // Create a temporary teams object
                    const newTeams = {};
                    
                    for (let i = 1; i < lines.length; i++) {
                        if (!lines[i].trim()) continue;
                        
                        const parts = lines[i].split(',');
                        const category = parts[categoryIndex];
                        const team = parts[teamIndex];
                        
                        if (!category || !team) continue;
                        
                        if (!newTeams[category]) {
                            newTeams[category] = [];
                        }
                        
                        newTeams[category].push(team);
                    }
                    
                    // Update config teams with new data
                    for (const category in newTeams) {
                        config.teams[category] = newTeams[category];
                    }
                    
                    // Save teams to localStorage for persistence
                    saveTeams();
                    
                    showNotification('Equipos importados correctamente', 'success');
                    
                } catch (error) {
                    showNotification('Error al importar el archivo: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        }
        
        function shareLink() {
            // Update URL before sharing
            stateManager.updateURLWithDate(selectedDate.value);
            sharing.copyCurrentURL();
        }
        
        function exportAllData() {
            const message = exportService.exportAllData();
            showNotification(message, 'success');
        }
        
        function refreshData() {
            matchService.forceReloadMatches();
            loadSavedTeams(true);
            loadSavedImages();
            showNotification('Datos actualizados correctamente', 'success');
        }
        
        function clearCache() {
            cacheManager.clearAllCache();
            location.reload();
        }
        
        // Initial setup
        loadSavedImages();
        loadSavedTeams();
        matchService.loadSavedMatches();
        
        // Listen for share events
        document.addEventListener('share-success', (e) => {
            showNotification(e.detail.message, 'success');
        });
        
        document.addEventListener('share-error', (e) => {
            showNotification(e.detail.message, 'error');
        });
        
        // Check for stale cache on app load
        window.addEventListener('online', () => {
            refreshData();
        });
        
        // Add visibilitychange event to refresh data when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                refreshData();
            }
        });
        
        // Return all needed methods and values to the template
        return {
            config,
            selectedDate,
            tables,
            matches: matchService.matches,
            selectedMatch,
            selectedTable,
            selectedHour,
            showMoveDialog,
            moveDetails,
            newMatch,
            notification,
            userRole,
            showLoginDialog,
            adminPassword,
            showHelpDialog,
            headerLogo,
            tableBackgroundImage,
            showImageSettingsDialog,
            showAdditionalHours,
            displayHours,
            sharing,
            
            // Methods
            setToday,
            updateCalendar,
            getTableStatus,
            getMatch,
            selectTable,
            clearSelection,
            assignMatch,
            cancelMatch,
            moveMatch,
            isAvailable,
            importCSV,
            exportCSV,
            showNotification,
            getTeamsForCategory,
            formatDate,
            formatDateLong,
            toggleHelpDialog,
            toggleAdminMode,
            checkAdminPassword,
            logoutAdmin,
            isAdmin,
            uploadHeaderLogo,
            uploadTableBackground,
            resetHeaderLogo,
            resetTableBackground,
            toggleImageSettingsDialog,
            getCategoryColor,
            toggleAdditionalHours,
            exportTeams,
            importTeams,
            saveTeams,
            shareLink,
            exportAllData,
            refreshData,
            clearCache
        };
    }
}).mount('#app');