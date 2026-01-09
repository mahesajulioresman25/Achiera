'use client';

import React, { useEffect, useState } from 'react';
import {
    Users,
    Star,
    Gift,
    TrendingUp,
    Award,
    RefreshCw,
    Search,
    Crown
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getLoyaltyMembers,
    getLoyaltyStats,
    getLoyaltyRewards,
    createLoyaltyReward
} from '@/lib/actions/rasa-ibu/businessIntelligence';

interface LoyaltyProgramDashboardProps {
    brandId: string;
    onClose?: () => void;
}

export default function LoyaltyProgramDashboard({ brandId, onClose }: LoyaltyProgramDashboardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [rewards, setRewards] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'rewards'>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [tierFilter, setTierFilter] = useState<string>('ALL');

    const loadData = async () => {
        setIsLoading(true);
        const [statsRes, membersRes, rewardsRes] = await Promise.all([
            getLoyaltyStats(brandId),
            getLoyaltyMembers(brandId),
            getLoyaltyRewards(brandId)
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (membersRes.success) setMembers(membersRes.data || []);
        if (rewardsRes.success) setRewards(rewardsRes.data || []);

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [brandId]);

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'PLATINUM': return 'bg-purple-100 text-purple-700 border-purple-300';
            case 'GOLD': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            case 'SILVER': return 'bg-gray-100 text-gray-700 border-gray-300';
            default: return 'bg-orange-100 text-orange-700 border-orange-300';
        }
    };

    const getTierIcon = (tier: string) => {
        switch (tier) {
            case 'PLATINUM': return '💎';
            case 'GOLD': return '🏆';
            case 'SILVER': return '🥈';
            default: return '🥉';
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.customerPhone.includes(searchQuery);
        const matchesTier = tierFilter === 'ALL' || m.tier === tierFilter;
        return matchesSearch && matchesTier;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Loyalty Program Hub</h2>
                        <p className="text-sm text-gray-500">Manage members, tiers & rewards</p>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500 rounded-lg">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-900">{stats.totalMembers}</div>
                                <div className="text-xs text-purple-700 font-semibold">Total Members</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-900">{stats.activeMembers}</div>
                                <div className="text-xs text-green-700 font-semibold">Active Members</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border border-amber-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500 rounded-lg">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-amber-900">{(stats.totalPointsIssued || 0).toLocaleString()}</div>
                                <div className="text-xs text-amber-700 font-semibold">Points Issued</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                                <Gift className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-900">{(stats.totalPointsAvailable || 0).toLocaleString()}</div>
                                <div className="text-xs text-blue-700 font-semibold">Points Available</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tier Distribution */}
            {stats && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tier Distribution</h3>
                    <div className="grid grid-cols-4 gap-4">
                        {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map(tier => (
                            <div key={tier} className={`p-4 rounded-lg border-2 ${getTierColor(tier)}`}>
                                <div className="text-center">
                                    <div className="text-3xl mb-2">{getTierIcon(tier)}</div>
                                    <div className="text-2xl font-bold">{stats.tierCounts[tier] || 0}</div>
                                    <div className="text-xs font-semibold uppercase">{tier}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg w-fit">
                {[
                    { id: 'overview', label: 'Overview', icon: Star },
                    { id: 'members', label: 'Members', icon: Users },
                    { id: 'rewards', label: 'Rewards', icon: Gift }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {activeTab === 'overview' && (
                    <div className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-800">Program Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <h4 className="font-bold text-purple-900 mb-2">Point System</h4>
                                <ul className="text-sm text-purple-700 space-y-1">
                                    <li>✓ 1 point per Rp 10,000 spent</li>
                                    <li>✓ Tier multipliers (up to 2x)</li>
                                    <li>✓ Birthday date (exact): 2x points</li>
                                    <li>✓ Points valid for 1 year</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg">
                                <h4 className="font-bold text-amber-900 mb-2">Tier Benefits</h4>
                                <ul className="text-sm text-amber-700 space-y-1">
                                    <li>🥉 Bronze: 1x points</li>
                                    <li>🥈 Silver: 1.25x points (Rp 1M)</li>
                                    <li>🏆 Gold: 1.5x points (Rp 5M)</li>
                                    <li>💎 Platinum: 2x points (Rp 10M)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <select
                                value={tierFilter}
                                onChange={(e) => setTierFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg font-medium"
                            >
                                <option value="ALL">All Tiers</option>
                                <option value="PLATINUM">Platinum</option>
                                <option value="GOLD">Gold</option>
                                <option value="SILVER">Silver</option>
                                <option value="BRONZE">Bronze</option>
                            </select>
                        </div>

                        {filteredMembers.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No members found</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredMembers.slice(0, 20).map((member) => (
                                    <div key={member.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="text-2xl">{getTierIcon(member.tier)}</div>
                                                <div>
                                                    <div className="font-bold text-gray-800">{member.customerName}</div>
                                                    <div className="text-sm text-gray-500">{member.customerPhone}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-purple-600">{(member.availablePoints || 0).toLocaleString()} pts</div>
                                                <div className="text-xs text-gray-500">{member.totalOrders} orders • {formatCurrency(Number(member.totalSpent))}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'rewards' && (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Reward Catalog</h3>
                        {rewards.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No rewards configured yet</p>
                                <p className="text-sm mt-2">Create rewards to encourage redemptions!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rewards.map((reward) => (
                                    <div key={reward.id} className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-purple-900">{reward.name}</h4>
                                                <p className="text-sm text-purple-700 mt-1">{reward.description}</p>
                                            </div>
                                            <div className="ml-4 text-right">
                                                <div className="text-2xl font-bold text-purple-600">{reward.pointsCost}</div>
                                                <div className="text-xs text-purple-700">points</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between text-xs text-purple-600">
                                            <span>Redeemed: {reward.timesRedeemed}x</span>
                                            <span className="px-2 py-1 bg-purple-200 rounded font-bold">{reward.rewardType}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
