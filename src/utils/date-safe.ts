export function safeFormatDate(date: any, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
    if (!date) return '-';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('id-ID', options);
    } catch (e) {
        return '-';
    }
}

export function safeFormatTime(date: any, options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }): string {
    if (!date) return '-';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleTimeString('id-ID', options);
    } catch (e) {
        return '-';
    }
}
