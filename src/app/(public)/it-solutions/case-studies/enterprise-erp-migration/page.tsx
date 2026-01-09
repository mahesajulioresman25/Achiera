import React from 'react';
import CaseStudyLayout from '@/components/CaseStudyLayout';

export default function EnterpriseERPMigrationPage() {
    return (
        <CaseStudyLayout
            title="Enterprise ERP Migration"
            subtitle="Seamless transition to Odoo for a manufacturing giant, integrating finance, inventory, and production lines."
            meta={{
                industry: "Manufacturing",
                scope: "ERP Migration, System Integration",
                duration: "6 months"
            }}
            context="A large-scale manufacturing company was relying on legacy on-premise software that was slow, disconnected, and expensive to maintain. They needed a modern, cloud-based ERP to unify their operations across 3 factories and 5 distribution centers."
            challenges={[
                "Data silos between finance, production, and sales departments",
                "Legacy system downtime causing production delays",
                "Lack of real-time reporting for executive decision making",
                "Complex data migration from 15-year-old database"
            ]}
            solution={{
                overview: "We architected and executed a full migration to Odoo Enterprise, customizing modules for Manufacturing (MRP), Inventory, and Accounting. The solution included a custom middleware to sync data from legacy machines to the new ERP.",
                features: [
                    "Full Data Migration: Secure transfer of 10+ years of historical data",
                    "Custom MRP Module: Tailored workflows for their specific production line",
                    "Real-time Analytics: Power BI integration for executive dashboards",
                    "Multi-warehouse Management: Centralized control over all distribution centers"
                ]
            }}
            results={[
                "30% Increase in operational efficiency",
                "Real-time visibility across all 3 factories",
                "Reduced IT maintenance costs by 60%",
                "Zero downtime during the final switchover"
            ]}
            techStack={[
                "Odoo Enterprise",
                "Python",
                "PostgreSQL",
                "Docker",
                "AWS",
                "Power BI"
            ]}
        />
    );
}
