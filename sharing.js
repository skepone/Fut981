// Sharing functionality for Liga 981
export function setupSharing() {
    // Copy current URL to clipboard
    function copyCurrentURL() {
        // Get the current URL
        const currentURL = window.location.href;
        
        // Copy to clipboard
        navigator.clipboard.writeText(currentURL)
            .then(() => {
                // Show success message via the app's notification system
                const event = new CustomEvent('share-success', {
                    detail: { message: 'Enlace copiado al portapapeles' }
                });
                document.dispatchEvent(event);
            })
            .catch(err => {
                console.error('Error al copiar el enlace: ', err);
                const event = new CustomEvent('share-error', {
                    detail: { message: 'Error al copiar el enlace' }
                });
                document.dispatchEvent(event);
            });
    }
    
    return {
        copyCurrentURL
    };
}