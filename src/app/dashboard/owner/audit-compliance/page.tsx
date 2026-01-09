'use client';

import React, { useState } from 'react';
import { AuditTrailViewer } from '@/components/dashboard/owner/AuditTrailViewer';
import { ComplianceDashboard } from '@/components/dashboard/owner/ComplianceDashboard';
import { ActivityMonitor } from '@/components/dashboard/owner/ActivityMonitor';
import { Shield, FileText, Activity } from 'lucide-react';

export default function AuditCompliancePage() {
    const [activeTab, setActiveTab] = useState<'compliance' | 'audit' | 'activity'>('compliance');

    const tabs = [
        { id: 'compliance' as const, label: 'Compliance Dashboard', icon: Shield },
        { id: 'audit' as const, label: 'Audit Trail', icon: FileText },
        { id: 'activity' as const, label: 'Live Activity', icon: Activity }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
                <h1 className="text-3xl font-black tracking-tight mb-2">Audit & Compliance Center</h1>
                <p className="text-indigo-100">Complete transparency and governance across all operations</p>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-bold transition-all ${activeTab === tab.id
                                        ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <Icon size={20} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="p-6">
                    {activeTab === 'compliance' && <ComplianceDashboard />}
                    {activeTab === 'audit' && <AuditTrailViewer />}
                    {activeTab === 'activity' && <ActivityMonitor autoRefresh={true} refreshInterval={10} />}
                </div>
            </div>
        </div>
    );
}
