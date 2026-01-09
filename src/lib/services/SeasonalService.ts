
export type SeasonType = 'IMLEK' | 'RAMADAN' | 'LEBARAN' | 'INDEPENDENCE' | 'CHRISTMAS' | 'NEW_YEAR' | 'NONE';

interface SeasonConfig {
    type: SeasonType;
    name: string;
    colors: {
        primary: string; // Background/Accent
        secondary: string; // Decoration
        text: string;
    };
    iconTheme: 'LANTERN' | 'KETUPAT' | 'FLAG' | 'BELL' | 'NONE';
}

export const SEASONAL_THEMES: Record<SeasonType, SeasonConfig> = {
    IMLEK: {
        type: 'IMLEK',
        name: 'Chinese New Year',
        colors: { primary: '#9E1C1C', secondary: '#FFD700', text: '#FDFBF7' },
        iconTheme: 'LANTERN'
    },
    RAMADAN: {
        type: 'RAMADAN',
        name: 'Ramadan Kareem',
        colors: { primary: '#1A4D2E', secondary: '#D4AF37', text: '#FDFBF7' },
        iconTheme: 'KETUPAT'
    },
    LEBARAN: {
        type: 'LEBARAN',
        name: 'Idul Fitri',
        colors: { primary: '#0F3D3E', secondary: '#E2DCC8', text: '#FDFBF7' },
        iconTheme: 'KETUPAT'
    },
    INDEPENDENCE: {
        type: 'INDEPENDENCE',
        name: 'HUT RI',
        colors: { primary: '#CE1126', secondary: '#FFFFFF', text: '#000000' },
        iconTheme: 'FLAG'
    },
    CHRISTMAS: {
        type: 'CHRISTMAS',
        name: 'Christmas',
        colors: { primary: '#165B33', secondary: '#BB2528', text: '#FDFBF7' },
        iconTheme: 'BELL'
    },
    NEW_YEAR: {
        type: 'NEW_YEAR',
        name: 'New Year',
        colors: { primary: '#1A1A1A', secondary: '#D4AF37', text: '#FDFBF7' },
        iconTheme: 'BELL'
    },
    NONE: {
        type: 'NONE',
        name: 'Default',
        colors: { primary: 'transparent', secondary: 'transparent', text: 'inherit' },
        iconTheme: 'NONE'
    }
};

export function getCurrentSeason(date: Date = new Date()): SeasonConfig {
    const month = date.getMonth(); // 0-11
    const day = date.getDate();

    // 1. New Year (Jan 1 - Jan 7)
    if (month === 0 && day <= 7) return SEASONAL_THEMES.NEW_YEAR;

    // 2. Imlek (Approx Feb) - Hardcoded for 2026/Generic
    // In 2026, Imlek is Feb 17. Range: Feb 10 - Feb 20.
    if (month === 1 && day >= 10 && day <= 24) return SEASONAL_THEMES.IMLEK;

    // 3. Ramadan/Lebaran (Approx for 2026)
    // 2026: Ramadan starts ~Feb 18, Eid ~Mar 20.
    // Overlapping Imlek? Let's prioritize Imlek until Feb 20, then Ramadan.
    if (month === 1 && day > 24) return SEASONAL_THEMES.RAMADAN; // Late Feb
    if (month === 2 && day <= 19) return SEASONAL_THEMES.RAMADAN; // Early March
    if (month === 2 && day >= 20 && day <= 27) return SEASONAL_THEMES.LEBARAN; // Eid Week

    // 4. Independence Day (Aug)
    if (month === 7 && day >= 10 && day <= 20) return SEASONAL_THEMES.INDEPENDENCE;

    // 5. Christmas (Dec)
    if (month === 11 && day >= 15 && day <= 26) return SEASONAL_THEMES.CHRISTMAS;

    // 6. Pre-New Year
    if (month === 11 && day >= 27) return SEASONAL_THEMES.NEW_YEAR;

    return SEASONAL_THEMES.NONE;
}
