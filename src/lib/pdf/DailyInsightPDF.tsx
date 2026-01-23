
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { DailyData } from '@/lib/services/DailyInsightsService';
import { DailyAIAnalysis } from '@/lib/ai/daily-insights-generator';

const styles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
    header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
    brandName: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a' },
    subtitle: { fontSize: 12, color: '#666', marginTop: 4 },
    section: { marginBottom: 20, padding: 15, backgroundColor: '#f8f9fa', borderRadius: 8 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#2c3e50', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
    text: { fontSize: 10, lineHeight: 1.6, color: '#4a5568', marginBottom: 4 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    card: { flex: 1, padding: 10, backgroundColor: 'white', borderAppearance: 'none', borderWidth: 1, borderColor: '#eee', borderRadius: 4 },
    cardTitle: { fontSize: 10, color: '#718096', marginBottom: 4 },
    cardValue: { fontSize: 16, fontWeight: 'bold', color: '#2d3748' },
    cardSub: { fontSize: 9, marginTop: 2 },
    footer: { marginTop: 'auto', paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' }
});

interface Props {
    data: DailyData;
    analysis: DailyAIAnalysis;
}

export const DailyInsightPDF = ({ data, analysis }: Props) => {
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.brandName}>Rasa Ibu</Text>
                    <Text style={styles.subtitle}>Daily Business Insights - {dateStr}</Text>
                </View>

                <View style={styles.grid}>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Omset Hari Ini</Text>
                        <Text style={styles.cardValue}>Rp {data.today.revenue.toLocaleString('id-ID')}</Text>
                        <Text style={{ ...styles.cardSub, color: data.revenueChange >= 0 ? 'green' : 'red' }}>
                            {data.revenueChange >= 0 ? '+' : ''}{data.revenueChange.toFixed(1)}% vs Kemarin
                        </Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Total Pesanan</Text>
                        <Text style={styles.cardValue}>{data.today.orders}</Text>
                        <Text style={{ ...styles.cardSub, color: data.ordersChange >= 0 ? 'green' : 'red' }}>
                            {data.ordersChange >= 0 ? '+' : ''}{data.ordersChange.toFixed(1)}% vs Kemarin
                        </Text>
                    </View>
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Pengeluaran</Text>
                        <Text style={styles.cardValue}>Rp {data.today.expenses.toLocaleString('id-ID')}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Analisis AI</Text>
                    <Text style={styles.text}>{analysis.analysis}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Produk Terlaris (Hari Ini)</Text>
                    {data.today.topProducts.map((p, i) => (
                        <View key={i} style={styles.row}>
                            <Text style={styles.text}>{i + 1}. {p.name}</Text>
                            <Text style={styles.text}>{p.quantity} terjual</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rekomendasi Strategis</Text>
                    {Array.isArray(analysis.recommendations) && analysis.recommendations.length > 0 ? (
                        analysis.recommendations.map((rec, i) => (
                            <Text key={i} style={styles.text}>• {rec}</Text>
                        ))
                    ) : (
                        <Text style={styles.text}>Tidak ada rekomendasi spesifik hari ini.</Text>
                    )}
                </View>

                {data.today.inventory.length > 0 && (
                    <View style={styles.section}>
                        <Text style={{ ...styles.sectionTitle, color: '#e53e3e' }}>⚠️ Stok Kritis</Text>
                        {data.today.inventory.map((inv, i) => (
                            <View key={i} style={styles.row}>
                                <Text style={styles.text}>{inv.name}</Text>
                                <Text style={styles.text}>Sisa {inv.stock} (Min {inv.minStock})</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.footer}>
                    <Text style={{ fontSize: 8, color: '#999', textAlign: 'center' }}>
                        Generated automatically by Achiera Intelligence System • {dateStr}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};
