import { unisolatedPrisma as prisma } from '@/lib/prisma';

interface HistoricalSalesData {
    date: Date;
    quantity: number;
}

interface ForecastResult {
    forecastDate: Date;
    predictedDemand: number;
    confidence: number;
    historicalAvg: number;
    trendFactor: number;
    seasonalFactor: number;
}

export class DemandForecastEngine {
    /**
     * Generate demand forecast for a specific variant
     */
    async generateForecast(
        brandId: string,
        variantId: string,
        daysAhead: number = 7
    ): Promise<ForecastResult[]> {
        // Get historical sales data (last 90 days)
        const historicalData = await this.getHistoricalSales(variantId, 90);

        if (historicalData.length < 7) {
            throw new Error('Insufficient historical data (minimum 7 days required)');
        }

        const forecasts: ForecastResult[] = [];
        const today = new Date();

        for (let i = 1; i <= daysAhead; i++) {
            const forecastDate = new Date(today);
            forecastDate.setDate(today.getDate() + i);

            const forecast = this.calculateForecast(historicalData, forecastDate);
            forecasts.push(forecast);

            // Save to database
            await (prisma as any).demandForecast.upsert({
                where: {
                    brandId_variantId_forecastDate: {
                        brandId,
                        variantId,
                        forecastDate
                    }
                },
                create: {
                    brandId,
                    variantId,
                    ...forecast
                },
                update: {
                    ...forecast
                }
            });
        }

        return forecasts;
    }

    /**
     * Calculate forecast for a specific date
     */
    private calculateForecast(
        historicalData: HistoricalSalesData[],
        forecastDate: Date
    ): ForecastResult {
        // Calculate historical average
        const totalQty = historicalData.reduce((sum, d) => sum + d.quantity, 0);
        const historicalAvg = Math.round(totalQty / historicalData.length);

        // Calculate trend factor (recent vs older data)
        const trendFactor = this.calculateTrendFactor(historicalData);

        // Calculate seasonal factor (day of week pattern)
        const seasonalFactor = this.calculateSeasonalFactor(historicalData, forecastDate);

        // Final prediction
        const predictedDemand = Math.max(0, Math.round(
            historicalAvg * trendFactor * seasonalFactor
        ));

        // Confidence based on data consistency
        const confidence = this.calculateConfidence(historicalData);

        return {
            forecastDate,
            predictedDemand,
            confidence,
            historicalAvg,
            trendFactor,
            seasonalFactor
        };
    }

    /**
     * Calculate trend factor (upward/downward trend)
     */
    private calculateTrendFactor(data: HistoricalSalesData[]): number {
        if (data.length < 14) return 1.0;

        // Compare recent 7 days vs previous 7 days
        const recent = data.slice(-7);
        const previous = data.slice(-14, -7);

        const recentAvg = recent.reduce((sum, d) => sum + d.quantity, 0) / 7;
        const previousAvg = previous.reduce((sum, d) => sum + d.quantity, 0) / 7;

        if (previousAvg === 0) return 1.0;

        const trend = recentAvg / previousAvg;

        // Cap trend between 0.5 and 2.0 to avoid extreme predictions
        return Math.max(0.5, Math.min(2.0, trend));
    }

    /**
     * Calculate seasonal factor (day of week pattern)
     */
    private calculateSeasonalFactor(
        data: HistoricalSalesData[],
        forecastDate: Date
    ): number {
        const dayOfWeek = forecastDate.getDay(); // 0 = Sunday, 6 = Saturday

        // Group data by day of week
        const dayGroups: { [key: number]: number[] } = {};
        data.forEach(d => {
            const day = d.date.getDay();
            if (!dayGroups[day]) dayGroups[day] = [];
            dayGroups[day].push(d.quantity);
        });

        // Calculate average for this day of week
        const dayData = dayGroups[dayOfWeek];
        if (!dayData || dayData.length === 0) return 1.0;

        const dayAvg = dayData.reduce((sum, q) => sum + q, 0) / dayData.length;
        const overallAvg = data.reduce((sum, d) => sum + d.quantity, 0) / data.length;

        if (overallAvg === 0) return 1.0;

        const seasonal = dayAvg / overallAvg;

        // Cap seasonal between 0.5 and 1.5
        return Math.max(0.5, Math.min(1.5, seasonal));
    }

    /**
     * Calculate confidence level based on data consistency
     */
    private calculateConfidence(data: HistoricalSalesData[]): number {
        if (data.length < 7) return 50;

        const quantities = data.map(d => d.quantity);
        const avg = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;

        // Calculate standard deviation
        const variance = quantities.reduce((sum, q) => sum + Math.pow(q - avg, 2), 0) / quantities.length;
        const stdDev = Math.sqrt(variance);

        // Coefficient of variation
        const cv = avg > 0 ? stdDev / avg : 1;

        // Convert to confidence (lower CV = higher confidence)
        // CV of 0 = 100% confidence, CV of 1 = 50% confidence
        const confidence = Math.max(50, Math.min(100, 100 - (cv * 50)));

        return Math.round(confidence);
    }

    /**
     * Get historical sales data for a variant
     */
    private async getHistoricalSales(
        variantId: string,
        days: number
    ): Promise<HistoricalSalesData[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const orders = await (prisma as any).orderItem.findMany({
            where: {
                variantId,
                order: {
                    status: { in: ['DIBAYAR', 'SELESAI'] },
                    createdAt: { gte: startDate }
                }
            },
            include: {
                order: {
                    select: { createdAt: true }
                }
            }
        });

        // Group by date
        const dailySales: { [key: string]: number } = {};
        orders.forEach((item: any) => {
            const dateKey = item.order.createdAt.toISOString().split('T')[0];
            dailySales[dateKey] = (dailySales[dateKey] || 0) + item.quantity;
        });

        // Convert to array
        return Object.entries(dailySales).map(([dateStr, quantity]) => ({
            date: new Date(dateStr),
            quantity
        })).sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    /**
     * Generate stock alerts based on forecasts
     */
    async generateStockAlerts(brandId: string): Promise<void> {
        // Get all variants with their current stock
        const variants = await (prisma as any).frozenVariant.findMany({
            where: {
                product: { category: { brandId: brandId } }
            },
            include: {
                product: { select: { name: true } }
            }
        });

        for (const variant of variants) {
            // Get 7-day forecast
            const forecasts = await (prisma as any).demandForecast.findMany({
                where: {
                    variantId: variant.id,
                    forecastDate: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                }
            });

            if (forecasts.length === 0) continue;

            const totalPredictedDemand = (forecasts as any[]).reduce((sum: number, f: any) => sum + (f.predictedDemand || 0), 0);
            const currentStock = variant.stockOnHand || 0;

            // Determine alert type and severity
            let alertType: string | null = null;
            let severity: string | null = null;
            let recommendedAction = '';
            let suggestedOrderQty: number | null = null;

            if (currentStock < totalPredictedDemand * 0.3) {
                // Critical: Stock < 30% of 7-day demand
                alertType = 'LOW_STOCK';
                severity = 'CRITICAL';
                suggestedOrderQty = Math.ceil(totalPredictedDemand * 1.5 - currentStock);
                recommendedAction = `URGENT: Order ${suggestedOrderQty} units immediately. Current stock will run out in ~${Math.floor((currentStock / totalPredictedDemand) * 7)} days.`;
            } else if (currentStock < totalPredictedDemand * 0.5) {
                // High: Stock < 50% of 7-day demand
                alertType = 'REORDER_NEEDED';
                severity = 'HIGH';
                suggestedOrderQty = Math.ceil(totalPredictedDemand * 1.5 - currentStock);
                recommendedAction = `Reorder ${suggestedOrderQty} units soon. Stock running low.`;
            } else if (currentStock > totalPredictedDemand * 3) {
                // Overstock: Stock > 300% of 7-day demand
                alertType = 'OVERSTOCK';
                severity = 'MEDIUM';
                recommendedAction = `Consider promotional pricing to move excess inventory. Current stock will last ~${Math.floor((currentStock / totalPredictedDemand) * 7)} days.`;
            }

            // Create alert if needed
            if (alertType) {
                // Check if similar alert already exists
                const existingAlert = await (prisma as any).stockAlert.findFirst({
                    where: {
                        brandId,
                        variantId: variant.id,
                        alertType,
                        status: 'OPEN'
                    }
                });

                if (!existingAlert) {
                    await (prisma as any).stockAlert.create({
                        data: {
                            brandId,
                            variantId: variant.id,
                            alertType,
                            severity: severity!,
                            currentStock,
                            recommendedAction,
                            suggestedOrderQty
                        }
                    });
                }
            }
        }
    }

    /**
     * Update actual demand and calculate accuracy
     */
    async updateActualDemand(variantId: string, date: Date): Promise<void> {
        const dateKey = date.toISOString().split('T')[0];
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        // Get actual sales for this date
        const orders = await (prisma as any).orderItem.findMany({
            where: {
                variantId,
                order: {
                    status: { in: ['DIBAYAR', 'SELESAI'] },
                    createdAt: {
                        gte: new Date(dateKey),
                        lt: nextDay
                    }
                }
            }
        });

        const actualDemand = (orders as any[]).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

        // Update forecast with actual data
        const forecast = await (prisma as any).demandForecast.findFirst({
            where: {
                variantId,
                forecastDate: new Date(dateKey)
            }
        });

        if (forecast) {
            let accuracy = 0;
            if (forecast.predictedDemand === 0) {
                accuracy = actualDemand === 0 ? 100 : 0;
            } else {
                const errorRate = Math.abs(actualDemand - forecast.predictedDemand) / forecast.predictedDemand;
                accuracy = Math.round((1 - errorRate) * 100);
            }

            await (prisma as any).demandForecast.update({
                where: { id: forecast.id },
                data: {
                    actualDemand,
                    accuracy: Math.max(0, Math.min(100, accuracy))
                }
            });
        }
    }
}

export const demandForecastEngine = new DemandForecastEngine();
