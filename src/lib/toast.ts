// Simple toast notification utility
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Remove existing toast if any
    const existing = document.getElementById('custom-toast');
    if (existing) {
        existing.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.textContent = message;

    // Style based on type
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-[9999] animate-fade-in`;

    // Add to body
    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('animate-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function showConfirm(message: string, onConfirm: () => void) {
    // Use native confirm for now
    if (confirm(message)) {
        onConfirm();
    }
}
