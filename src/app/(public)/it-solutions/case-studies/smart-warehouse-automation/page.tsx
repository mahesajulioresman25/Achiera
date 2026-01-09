import React from 'react';
import CaseStudyLayout from '@/components/CaseStudyLayout';

export default function SmartWarehouseAutomationPage() {
    return (
        <CaseStudyLayout
            title="Smart Warehouse Automation"
            subtitle="Real-time inventory tracking system with 99.9% accuracy for multi-zone warehouse operations."
            meta={{
                industry: "Distribution & Retail",
                scope: "IoT & Automation, System Integration",
                duration: "4 months"
            }}
            context="Our client, a leading logistics provider, was struggling with manual inventory tracking across their 10,000 sq ft warehouse. This led to frequent stock discrepancies, slow order fulfillment, and high operational costs due to human error."
            challenges={[
                "Manual data entry errors causing 15% inventory discrepancy",
                "Slow picking process due to inefficient routing",
                "Lack of real-time visibility into stock levels",
                "High labor costs for periodic stock counts"
            ]}
            solution={{
                overview: "We implemented a comprehensive IoT-based automation system using RFID tags and custom handheld readers, integrated directly with their existing ERP. The solution provides real-time tracking of every item entering and leaving the warehouse.",
                features: [
                    "RFID Implementation: Tagging system for pallet and item-level tracking",
                    "Custom Mobile App: Android app for warehouse staff to scan and verify stock",
                    "Real-time Dashboard: Live view of inventory levels and movement",
                    "ERP Integration: Seamless sync with Odoo for automated stock updates"
                ]
            }}
            results={[
                "99.9% Inventory Accuracy achieved within 2 months",
                "40% Reduction in picking time",
                "Eliminated need for manual stock counts",
                "ROI achieved in 8 months"
            ]}
            techStack={[
                "React Native",
                "Node.js",
                "PostgreSQL",
                "MQTT",
                "Odoo API",
                "Docker"
            ]}
        />
    );
}
