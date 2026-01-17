
export type SeasonType = 'IMLEK' | 'RAMADAN' | 'LEBARAN' | 'INDEPENDENCE' | 'CHRISTMAS' | 'NEW_YEAR' | 'HARI_IBU' | 'WAISAK' | 'NYEPI' | 'KARTINI' | 'NONE';

interface SeasonConfig {
    type: SeasonType;
    name: string;
    colors: {
        primary: string; // Background/Accent
        secondary: string; // Decoration
        text: string;
    };
    iconTheme: 'LANTERN' | 'KETUPAT' | 'FLAG' | 'BELL' | 'HEART' | 'LOTUS' | 'OGOH' | 'KEBAYA' | 'NONE';
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
    HARI_IBU: {
        type: 'HARI_IBU',
        name: 'Hari Ibu',
        colors: { primary: '#AA336A', secondary: '#FFB6C1', text: '#FDFBF7' },
        iconTheme: 'HEART'
    },
    WAISAK: {
        type: 'WAISAK',
        name: 'Hari Raya Waisak',
        colors: { primary: '#FF6B35', secondary: '#F7931E', text: '#FDFBF7' },
        iconTheme: 'LOTUS'
    },
    NYEPI: {
        type: 'NYEPI',
        name: 'Hari Raya Nyepi',
        colors: { primary: '#4A148C', secondary: '#FFD700', text: '#FDFBF7' },
        iconTheme: 'OGOH'
    },
    KARTINI: {
        type: 'KARTINI',
        name: 'Hari Kartini',
        colors: { primary: '#DC143C', secondary: '#FFFFFF', text: '#FDFBF7' },
        iconTheme: 'KEBAYA'
    },
    NONE: {
        type: 'NONE',
        name: 'Default',
        colors: { primary: 'transparent', secondary: 'transparent', text: 'inherit' },
        iconTheme: 'NONE'
    }
};

// Moving Holiday Registry (Calculated/Lookup for 2024-2030)
// Ensure these match the start of the "festive season" (usually a few days before/during)
const MOVING_HOLIDAYS: Record<number, {
    imlek: { month: number, day: number },
    ramadan: { month: number, day: number },
    lebaran: { month: number, day: number }
}> = {
    2024: {
        imlek: { month: 1, day: 10 },    // Feb 10
        ramadan: { month: 2, day: 10 }, // March 10
        lebaran: { month: 3, day: 10 }, // April 10
    },
    2025: {
        imlek: { month: 0, day: 29 },    // Jan 29
        ramadan: { month: 1, day: 28 }, // Feb 28
        lebaran: { month: 2, day: 30 }, // March 30
    },
    2026: {
        imlek: { month: 1, day: 17 },    // Feb 17
        ramadan: { month: 1, day: 18 }, // Feb 18 (Ramadan begins)
        lebaran: { month: 2, day: 20 }, // March 20 (Eid)
    },
    2027: {
        imlek: { month: 1, day: 6 },     // Feb 6
        ramadan: { month: 1, day: 7 },     // Feb 7
        lebaran: { month: 2, day: 9 },     // March 9
    },
    2028: {
        imlek: { month: 0, day: 26 },    // Jan 26
        ramadan: { month: 0, day: 27 },    // Jan 27
        lebaran: { month: 1, day: 26 },    // Feb 26
    },
    2029: {
        imlek: { month: 1, day: 13 },    // Feb 13
        ramadan: { month: 0, day: 15 },    // Jan 15
        lebaran: { month: 1, day: 14 },    // Feb 14
    },
    2030: {
        imlek: { month: 1, day: 3 },     // Feb 3
        ramadan: { month: 0, day: 5 },     // Jan 5
        lebaran: { month: 1, day: 4 },     // Feb 4
    }
};

export function getCurrentSeason(date: Date = new Date()): SeasonConfig {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    const day = date.getDate();

    // 1. New Year (Jan 1 - Jan 7)
    if (month === 0 && day <= 7) return SEASONAL_THEMES.NEW_YEAR;

    // Moving Holidays Logic
    const holidays = MOVING_HOLIDAYS[year];
    if (holidays) {
        // Imlek (Range: H-7 to H+3)
        const imlekDate = new Date(year, holidays.imlek.month, holidays.imlek.day);
        const diffImlek = (date.getTime() - imlekDate.getTime()) / (1000 * 3600 * 24);
        if (diffImlek >= -7 && diffImlek <= 3) return SEASONAL_THEMES.IMLEK;

        // Ramadan (Start to Eid-1)
        const ramadanStart = new Date(year, holidays.ramadan.month, holidays.ramadan.day);
        const lebaranStart = new Date(year, holidays.lebaran.month, holidays.lebaran.day);

        if (date >= ramadanStart && date < lebaranStart) return SEASONAL_THEMES.RAMADAN;

        // Lebaran (Range: H to H+7)
        const diffLebaran = (date.getTime() - lebaranStart.getTime()) / (1000 * 3600 * 24);
        if (diffLebaran >= 0 && diffLebaran <= 7) return SEASONAL_THEMES.LEBARAN;
    }

    // 2. Independence Day (Aug 10 - Aug 20)
    if (month === 7 && day >= 10 && day <= 20) return SEASONAL_THEMES.INDEPENDENCE;

    // 3. Hari Kartini (Apr 20 - Apr 22)
    if (month === 3 && day >= 20 && day <= 22) return SEASONAL_THEMES.KARTINI;

    // 4. Waisak (Usually mid-May, varies by lunar calendar - using May 12-18 as range)
    if (month === 4 && day >= 12 && day <= 18) return SEASONAL_THEMES.WAISAK;

    // 5. Nyepi (Usually March, varies by Balinese calendar - using March 10-16 as range)
    if (month === 2 && day >= 10 && day <= 16) return SEASONAL_THEMES.NYEPI;

    // 6. Hari Ibu (Dec 20 - Dec 23)
    if (month === 11 && day >= 20 && day <= 23) return SEASONAL_THEMES.HARI_IBU;

    // 7. Christmas (Dec 15 - Dec 26)
    if (month === 11 && day >= 15 && day <= 26) return SEASONAL_THEMES.CHRISTMAS;

    // 8. Pre-New Year
    if (month === 11 && day >= 27) return SEASONAL_THEMES.NEW_YEAR;

    return SEASONAL_THEMES.NONE;
}
