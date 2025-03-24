export const config = {
    // Configuración básica
    tables: 3, // Número de futbolines disponibles
    hours: [21, 22, 23], // Horarios disponibles por defecto
    additionalHours: [18, 19, 20], // Horarios adicionales que pueden mostrarse/ocultarse
    days: ['Martes', 'Jueves', 'Viernes'], // Días de juego
    
    // Categorías
    categories: ['Primera Division', 'Segunda Division', 'Tercera Division', 'Cuarta Division'],
    
    // Equipos por categoría (15 equipos por cada categoría)
    teams: {
        'Primera Division': [
            'Equipo A', 'Equipo B', 'Equipo C', 'Equipo D', 'Equipo E',
            'Equipo F', 'Equipo G', 'Equipo H', 'Equipo I', 'Equipo J',
            'Equipo K', 'Equipo L', 'Equipo M', 'Equipo N', 'Equipo O'
        ],
        'Segunda Division': [
            'Equipo P', 'Equipo Q', 'Equipo R', 'Equipo S', 'Equipo T',
            'Equipo U', 'Equipo V', 'Equipo W', 'Equipo X', 'Equipo Y',
            'Equipo Z', 'Equipo AA', 'Equipo AB', 'Equipo AC', 'Equipo AD'
        ],
        'Tercera Division': [
            'Equipo AE', 'Equipo AF', 'Equipo AG', 'Equipo AH', 'Equipo AI',
            'Equipo AJ', 'Equipo AK', 'Equipo AL', 'Equipo AM', 'Equipo AN',
            'Equipo AO', 'Equipo AP', 'Equipo AQ', 'Equipo AR', 'Equipo AS'
        ],
        'Cuarta Division': [
            'Equipo AT', 'Equipo AU', 'Equipo AV', 'Equipo AW', 'Equipo AX',
            'Equipo AY', 'Equipo AZ', 'Equipo BA', 'Equipo BB', 'Equipo BC',
            'Equipo BD', 'Equipo BE', 'Equipo BF', 'Equipo BG', 'Equipo BH'
        ]
    },
    // Roles de usuario
    adminPassword: "AdminLiga981",
    
    // Colores de las categorías
    categoryColors: {
        'Primera Division': '#3498db',  // Azul
        'Segunda Division': '#2ecc71',  // Verde
        'Tercera Division': '#f39c12',  // Naranja
        'Cuarta Division': '#e74c3c'    // Rojo
    },
    
    // Imágenes por defecto
    defaultHeaderLogo: null,
    defaultTableBackground: null
};