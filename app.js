import { createApp } from 'vue';
import { config } from './config.js';
import * as XLSX from 'xlsx';
import { Storage } from './storage.js';

createApp({
    data() {
        return {
            config,
            selectedDate: new Date().toISOString().split('T')[0],
            tables: Array(config.tables).fill(null),
            matches: [],
            selectedMatch: null,
            selectedTable: null,
            selectedHour: null,
            showMoveDialog: false,
            moveDetails: {
                date: null,
                hour: null,
                table: null
            },
            newMatch: {
                category: config.categories[0],
                teamA: '',
                teamB: ''
            },
            notification: {
                show: false,
                message: '',
                type: 'info'
            },
            userRole: 'player', 
            showLoginDialog: false,
            adminPassword: '',
            showHelpDialog: false,
            headerLogo: config.defaultHeaderLogo,
            tableBackgroundImage: config.defaultTableBackground,
            showImageSettingsDialog: false,
            showAdditionalHours: false,
            displayHours: [...config.hours]
        };
    },
    mounted() {
        this.loadSavedData();
        this.updateCalendar();
    },
    methods: {
        loadSavedData() {
            const savedMatches = Storage.loadMatches();
            if (savedMatches && savedMatches.length > 0) {
                this.matches = savedMatches;
            } else {
                this.loadSampleData();
            }
            
            const savedTeams = Storage.loadTeams();
            if (savedTeams) {
                this.config.teams = savedTeams;
            }
            
            this.loadSavedImages();
            this.showAdditionalHours = Storage.loadUIPreference(Storage.KEYS.SHOW_ADDITIONAL_HOURS, false);
            if (this.showAdditionalHours) {
                this.displayHours = [...config.additionalHours, ...config.hours].sort((a, b) => a - b);
            } else {
                this.displayHours = [...config.hours];
            }
        },
        
        loadSampleData() {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
            
            this.matches = [
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
        },
        
        setToday() {
            this.selectedDate = new Date().toISOString().split('T')[0];
            this.updateCalendar();
        },
        updateCalendar() {
            this.clearSelection();
        },
        getTableStatus(hour, tableIndex) {
            const isOccupied = this.matches.some(match => 
                match.date === this.selectedDate && 
                match.hour === parseInt(hour) && 
                match.table === tableIndex
            );
            
            const isSelected = this.selectedTable === tableIndex && 
                              this.selectedHour === parseInt(hour);
            
            return {
                'occupied': isOccupied,
                'available': !isOccupied,
                'selected': isSelected
            };
        },
        getMatch(hour, tableIndex) {
            return this.matches.find(match => 
                match.date === this.selectedDate && 
                match.hour === parseInt(hour) && 
                match.table === tableIndex
            );
        },
        selectTable(hour, tableIndex) {
            this.selectedHour = parseInt(hour);
            this.selectedTable = tableIndex;
            
            const match = this.getMatch(hour, tableIndex);
            if (match) {
                this.selectedMatch = match;
                this.moveDetails = {
                    date: match.date,
                    hour: match.hour,
                    table: match.table
                };
            } else {
                this.selectedMatch = null;
            }
        },
        clearSelection() {
            this.selectedMatch = null;
            this.selectedTable = null;
            this.selectedHour = null;
            this.newMatch = {
                category: this.config.categories[0],
                teamA: '',
                teamB: ''
            };
        },
        assignMatch() {
            if (!this.newMatch.teamA || !this.newMatch.teamB) {
                this.showNotification('Debes seleccionar ambos equipos', 'error');
                return;
            }
            
            if (this.newMatch.teamA === this.newMatch.teamB) {
                this.showNotification('No puedes seleccionar el mismo equipo', 'error');
                return;
            }
            
            const newId = Math.max(0, ...this.matches.map(m => m.id)) + 1;
            
            this.matches.push({
                id: newId,
                category: this.newMatch.category,
                teamA: this.newMatch.teamA,
                teamB: this.newMatch.teamB,
                date: this.selectedDate,
                hour: this.selectedHour,
                table: this.selectedTable
            });
            
            Storage.saveMatches(this.matches);
            
            this.showNotification('Partido asignado correctamente', 'success');
            this.clearSelection();
        },
        cancelMatch() {
            if (!this.selectedMatch) return;
            
            const index = this.matches.findIndex(m => m.id === this.selectedMatch.id);
            if (index !== -1) {
                this.matches.splice(index, 1);
                
                Storage.saveMatches(this.matches);
                
                this.showNotification('Partido cancelado correctamente', 'success');
                this.clearSelection();
            }
        },
        moveMatch() {
            if (!this.selectedMatch || !this.moveDetails.date || 
                this.moveDetails.hour === null || this.moveDetails.table === null) return;
            
            if (!this.isAvailable(this.moveDetails.date, this.moveDetails.hour, this.moveDetails.table)) {
                this.showNotification('La mesa seleccionada no está disponible en ese horario', 'error');
                return;
            }
            
            const index = this.matches.findIndex(m => m.id === this.selectedMatch.id);
            if (index !== -1) {
                this.matches[index] = {
                    ...this.matches[index],
                    date: this.moveDetails.date,
                    hour: this.moveDetails.hour,
                    table: this.moveDetails.table
                };
                
                Storage.saveMatches(this.matches);
                
                this.showNotification('Partido movido correctamente', 'success');
                this.showMoveDialog = false;
                this.clearSelection();
                
                if (this.moveDetails.date === this.selectedDate) {
                    this.updateCalendar();
                }
            }
        },
        isAvailable(date, hour, table) {
            const hasConflict = this.matches.some(match => 
                match.date === date && 
                match.hour === parseInt(hour) && 
                match.table === parseInt(table) && 
                (!this.selectedMatch || match.id !== this.selectedMatch.id)
            );
            
            return !hasConflict;
        },
        importCSV(event) {
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
                        
                        if (category && this.config.teams[category]) {
                            if (!teamsToAdd[category]) teamsToAdd[category] = [];
                            
                            if (teamA && !this.config.teams[category].includes(teamA) && 
                                !teamsToAdd[category].includes(teamA)) {
                                teamsToAdd[category].push(teamA);
                            }
                            
                            if (teamB && !this.config.teams[category].includes(teamB) && 
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
                    
                    for (const category in teamsToAdd) {
                        if (teamsToAdd[category].length > 0) {
                            this.config.teams[category] = [
                                ...this.config.teams[category],
                                ...teamsToAdd[category]
                            ];
                        }
                    }
                    
                    this.matches = importedMatches;
                    
                    Storage.saveMatches(this.matches);
                    Storage.saveTeams(this.config.teams);
                    
                    this.showNotification('Datos importados correctamente', 'success');
                    this.updateCalendar();
                    
                } catch (error) {
                    this.showNotification('Error al importar el archivo: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        },
        exportCSV() {
            const headers = ['id', 'category', 'teamA', 'teamB', 'date', 'hour', 'table'];
            let csvContent = headers.join(',') + '\n';
            
            this.matches.forEach(match => {
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
            
            this.showNotification('Datos exportados correctamente', 'success');
        },
        showNotification(message, type = 'info') {
            this.notification = {
                show: true,
                message,
                type
            };
            
            setTimeout(() => {
                this.notification.show = false;
            }, 3000);
        },
        getTeamsForCategory(category) {
            return this.config.teams[category] || [];
        },
        formatDate(dateString) {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('es-ES', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
            }).format(date);
        },
        formatDateLong(dateString) {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('es-ES', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            }).format(date);
        },
        toggleHelpDialog() {
            this.showHelpDialog = !this.showHelpDialog;
        },
        toggleAdminMode() {
            this.showLoginDialog = true;
            this.adminPassword = '';
        },
        checkAdminPassword() {
            if (this.adminPassword === this.config.adminPassword) {
                this.userRole = 'admin';
                this.showLoginDialog = false;
                this.showNotification('Modo administrador activado', 'success');
            } else {
                this.showNotification('Contraseña incorrecta', 'error');
            }
        },
        logoutAdmin() {
            this.userRole = 'player';
            this.showNotification('Modo jugador activado', 'info');
        },
        isAdmin() {
            return this.userRole === 'admin';
        },
        loadSavedImages() {
            const savedLogo = localStorage.getItem(Storage.KEYS.HEADER_LOGO);
            if (savedLogo) {
                this.headerLogo = savedLogo;
            }
            
            const savedTableBackground = localStorage.getItem(Storage.KEYS.TABLE_BACKGROUND);
            if (savedTableBackground) {
                this.tableBackgroundImage = savedTableBackground;
            }
        },
        
        uploadHeaderLogo(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.headerLogo = e.target.result;
                localStorage.setItem(Storage.KEYS.HEADER_LOGO, this.headerLogo);
            };
            reader.readAsDataURL(file);
        },
        
        uploadTableBackground(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.tableBackgroundImage = e.target.result;
                localStorage.setItem(Storage.KEYS.TABLE_BACKGROUND, this.tableBackgroundImage);
            };
            reader.readAsDataURL(file);
        },
        
        resetHeaderLogo() {
            this.headerLogo = null;
            localStorage.removeItem(Storage.KEYS.HEADER_LOGO);
        },
        
        resetTableBackground() {
            this.tableBackgroundImage = null;
            localStorage.removeItem(Storage.KEYS.TABLE_BACKGROUND);
        },
        
        toggleImageSettingsDialog() {
            this.showImageSettingsDialog = !this.showImageSettingsDialog;
        },
        
        getCategoryColor(category) {
            return this.config.categoryColors[category] || '#3498db';
        },
        toggleAdditionalHours() {
            this.showAdditionalHours = !this.showAdditionalHours;
            
            Storage.saveUIPreference(Storage.KEYS.SHOW_ADDITIONAL_HOURS, this.showAdditionalHours);
            
            if (this.showAdditionalHours) {
                this.displayHours = [...config.additionalHours, ...config.hours].sort((a, b) => a - b);
            } else {
                this.displayHours = [...config.hours];
            }
        },
        exportTeams() {
            const headers = ['category', 'team'];
            let csvContent = headers.join(',') + '\n';
            
            for (const category in this.config.teams) {
                this.config.teams[category].forEach(team => {
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
            
            this.showNotification('Equipos exportados correctamente', 'success');
        },
        
        importTeams(event) {
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
                    
                    for (const category in newTeams) {
                        this.config.teams[category] = newTeams[category];
                    }
                    
                    Storage.saveTeams(this.config.teams);
                    
                    this.showNotification('Equipos importados correctamente', 'success');
                    
                } catch (error) {
                    this.showNotification('Error al importar el archivo: ' + error.message, 'error');
                }
            };
            
            reader.readAsText(file);
        },
    }
}).mount('#app');