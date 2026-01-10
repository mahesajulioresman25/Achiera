
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { MonthlyData } from '@/lib/services/MonthlyReportService';
import { AIAnalysis } from '@/lib/ai/monthly-report-analyzer';

// Register standard fonts
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqQ69kmzWw.ttf' }, // Normal
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqQ69kmzWw.ttf', fontWeight: 'bold' } // Bold (fallback)
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff'
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10
    },
    brandName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a'
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 4
    },
    section: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f8f9fa',
        borderRadius: 8
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#2c3e50',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 4
    },
    text: {
        fontSize: 10,
        lineHeight: 1.6,
        color: '#4a5568',
        marginBottom: 4
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10
    },
    card: {
        flex: 1,
        padding: 10,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 4
    },
    cardTitle: {
        fontSize: 10,
        color: '#718096',
        marginBottom: 4
    },
    cardValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2d3748'
    },
    cardSub: {
        fontSize: 9,
        marginTop: 2
    },
    badge: {
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 4,
        fontSize: 8,
        alignSelf: 'flex-start'
    }
});

interface Props {
    data: MonthlyData;
    analysis: AIAnalysis;
}

export const MonthlyReportPDF = ({ data, analysis }: Props) => {
    const monthName = data.period.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.brandName}>Rasa Ibu</Text>
                    <Text style={styles.subtitle}>Laporan Kinerja Bisnis Bulanan - {monthName}</Text>
                </View>

                {/* Executive Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ringkasan Eksekutif</Text>
                    <Text style={styles.text}>{analysis.executiveSummary}</Text>
                </View>

                {/* Financial Snapshot */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.sectionTitle}>Kinerja Keuangan</Text>
                    <View style={styles.grid}>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Total Omset</Text>
                            <Text style={styles.cardValue}>Rp {data.financial.revenue.toLocaleString('id-ID')}</Text>
                            <Text style={{ ...styles.cardSub, color: data.financial.growthRevenue >= 0 ? 'green' : 'red' }}>
                                {data.financial.growthRevenue >= 0 ? '+' : '-'} {Math.abs(data.financial.growthRevenue).toFixed(1)}% vs lalu
                            </Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Omset Bersih (Setelah Biaya Apps)</Text>
                            <Text style={styles.cardValue}>Rp {data.marketplace.netRevenue.toLocaleString('id-ID')}</Text>
                            <Text style={styles.cardSub}>Potongan Apps: Rp {data.marketplace.totalFees.toLocaleString('id-ID')}</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Keuntungan Bersih</Text>
                            <Text style={styles.cardValue}>Rp {data.financial.profit.toLocaleString('id-ID')}</Text>
                            <Text style={styles.cardSub}>Margin {data.financial.margin.toFixed(1)}%</Text>
                        </View>
                    </View>
                </View>

                {/* Top Products & Loyal Customers */}
                <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
                    <View style={{ ...styles.section, flex: 1, marginBottom: 0 }}>
                        <Text style={styles.sectionTitle}>Produk Terlaris</Text>
                        {data.sales.topProducts
                            .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i) // Deduplicate by name
                            .slice(0, 5)
                            .map((p, i) => (
                                <View key={i} style={styles.row}>
                                    <Text style={{ ...styles.text, flex: 3 }}>{i + 1}. {p.name}</Text>
                                    <Text style={{ ...styles.text, flex: 1, textAlign: 'right' }}>{p.quantity}</Text>
                                </View>
                            ))}
                    </View>
                    <View style={{ ...styles.section, flex: 1, marginBottom: 0 }}>
                        <Text style={styles.sectionTitle}>Beban Operasional</Text>
                        {data.financial.expenseBreakdown
                            .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i) // Deduplicate by name
                            .slice(0, 5)
                            .map((exp, i) => (
                                <View key={i} style={styles.row}>
                                    <Text style={{ ...styles.text, flex: 3 }}>{i + 1}. {exp.name}</Text>
                                    <Text style={{ ...styles.text, flex: 2, textAlign: 'right' }}>Rp {exp.amount.toLocaleString('id-ID')}</Text>
                                </View>
                            ))}
                    </View>
                </View>

                {/* Loyal Customers */}
                <View style={{ ...styles.section, marginBottom: 20 }}>
                    <Text style={styles.sectionTitle}>Pelanggan Loyal</Text>
                    <View style={styles.grid}>
                        {data.loyalty.topCustomers.slice(0, 3).map((c, i) => (
                            <View key={i} style={{ ...styles.card, flex: 1 }}>
                                <Text style={styles.cardSub}>TOP {i + 1}</Text>
                                <Text style={{ ...styles.text, fontWeight: 'bold' }}>{c.name}</Text>
                                <Text style={styles.text}>{c.count} Pesanan</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* AI Insights & Recommendations */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Analisis Mendalam & Strategi</Text>

                    <Text style={{ ...styles.text, fontWeight: 'bold', marginBottom: 2 }}>Insight Utama:</Text>
                    {analysis.insights.map((insight, i) => (
                        <Text key={i} style={styles.text}>• {insight}</Text>
                    ))}

                    <Text style={{ ...styles.text, fontWeight: 'bold', marginTop: 10, marginBottom: 2 }}>Rekomendasi Aksi:</Text>
                    {analysis.recommendations.map((rec, i) => (
                        <Text key={i} style={styles.text}>• {rec}</Text>
                    ))}
                </View>

                {/* Footer */}
                <View style={{ marginTop: 'auto', paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' }}>
                    <Text style={{ fontSize: 8, color: '#999', textAlign: 'center' }}>
                        Generated automatically by Achiera Intelligence System • {new Date().toLocaleDateString('id-ID')}
                    </Text>
                </View>
            </Page>
        </Document>
    );
};
