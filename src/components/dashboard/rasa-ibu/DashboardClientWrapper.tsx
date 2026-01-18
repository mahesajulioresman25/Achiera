'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { LayoutGrid, LogOut, ChevronRight, X, Zap, BrainCircuit, TrendingUp, Star, Activity, ShieldCheck, ShoppingBasket, ChefHat, ArrowRightLeft, Printer, Globe, Megaphone, Calendar, User, Sparkles } from 'lucide-react';
import ManualOrderLedger from './ManualOrderLedger';
import WhatsAppActivityPulse from './WhatsAppActivityPulse';
import { getWhatsAppPulseAction } from '@/lib/actions/rasa-ibu/intelligence';
import PantryStockGrid from './PantryStockGrid';
import SmartIngestionPanel from './SmartIngestionPanel';
import OrderEntryModal from './OrderEntryModal';
import StockAuditHub from './StockAuditHub';
import CatalogManager from './CatalogManager';
import { getIbuCategories } from '@/lib/actions/rasa-ibu/catalog';
import FinancialReportsModal from './FinancialReportsModal';
import PaymentReconciliationModal from './PaymentReconciliationModal';
import WarehouseManager from './WarehouseManager';
import LedgerModal from './LedgerModal';
import IntelligenceHub from './IntelligenceHub';
import BIPulseWidget from './intelligence/BIPulseWidget';
import AccountManagerModal from './AccountManagerModal';
import FinancialInsight from './FinancialInsight';
import FinanceHub from './FinanceHub';
import ExpenseEntryModal from './ExpenseEntryModal';
import PlatformSettingsModal from './PlatformSettingsModal';
import SmartAdvisory from './intelligence/SmartAdvisory';
import ProductionHub from './production/ProductionHub';
import ProcurementAdvisor from './ProcurementAdvisor';
import DigitalReceipt from './DigitalReceipt';
import KitchenDisplay from './production/KitchenDisplay';
import BarcodeStockAudit from './BarcodeStockAudit';
import CRMIntelligence from './CRMIntelligence';
import SecurityPulse from './SecurityPulse';
import RawMaterialHub from './inventory/RawMaterialHub';
import QRISPaymentModal from './QRISPaymentModal';
import PaymentVerificationPanel from './PaymentVerificationPanel';
import dynamic from 'next/dynamic';
import TaxComplianceModal from './TaxComplianceModal';
const AutomationHub = dynamic(() => import('./intelligence/AutomationHub'), { ssr: false });
const EmailIntelligenceHub = dynamic(() => import('./intelligence/EmailIntelligenceHub'), { ssr: false });
const DemandForecastDashboard = dynamic(() => import('./intelligence/DemandForecastDashboard'), { ssr: false });
const SmartPricingDashboard = dynamic(() => import('./intelligence/SmartPricingDashboard'), { ssr: false });
const LoyaltyProgramDashboard = dynamic(() => import('./intelligence/LoyaltyProgramDashboard'), { ssr: false });
import MarketingAnalyticsDashboard from '@/components/marketing/MarketingAnalyticsDashboard';
import CampaignManager from '@/components/marketing/CampaignManager';
import FlashSaleManager from '@/components/marketing/FlashSaleManager';
import CampaignForm from '@/components/marketing/CampaignForm'; // Added import
import BundleManager from '@/components/marketing/BundleManager'; // Added import
import SubscriptionPlanManager from '@/components/marketing/SubscriptionPlanManager'; // Added import
import SubscriptionDataManager from '@/components/marketing/SubscriptionDataManager'; // Added import
import DynamicPricingManager from './intelligence/DynamicPricingManager';
import IncomeEntryModal from './IncomeEntryModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import { syncDailyOverheadAction } from '@/lib/actions/rasa-ibu/finance';
import { syncDemandAccuracyAction } from '@/lib/actions/rasa-ibu/demandForecast';
import AssetManagementHub from './AssetManagementHub';
const InventoryBalancingHub = dynamic(() => import('./inventory/InventoryBalancingHub'), { ssr: false });
const PricingAdvantageHub = dynamic(() => import('./intelligence/PricingAdvantageHub'), { ssr: false });
import RecipeManager from './RecipeManager';
import SeasonalSettingsPage from '@/app/dashboard/rasa-ibu/seasonal-settings/page';


interface DashboardClientWrapperProps {
    brandId: string;
    initialOrders?: any[];
    initialProducts?: any[];
    initialRecipes?: any[];
    activities?: any[];
    intelligence?: any;
    serverUser?: any; // Added for robust auth bypass
}

export default function DashboardClientWrapper({
    brandId,
    initialOrders = [],
    initialProducts = [],
    initialRecipes = [],
    activities = [],
    intelligence,
    serverUser
}: DashboardClientWrapperProps) {
    const [showLedger, setShowLedger] = React.useState(false);
    const [showReports, setShowReports] = React.useState(false);
    const [showReconciliation, setShowReconciliation] = React.useState(false);
    const [showWarehouse, setShowWarehouse] = React.useState(false);
    const [showAudit, setShowAudit] = React.useState(false);
    const [showIngestion, setShowIngestion] = React.useState(false);
    const [showOrderEntry, setShowOrderEntry] = React.useState(false);
    const [showExpenseEntry, setShowExpenseEntry] = React.useState(false);
    const [showProcurement, setShowProcurement] = React.useState(false);
    const [showKDS, setShowKDS] = React.useState(false);
    const [showBarcodeAudit, setShowBarcodeAudit] = React.useState(false);
    const [showCRM, setShowCRM] = React.useState(false);
    const [showSecurityPulse, setShowSecurityPulse] = React.useState(false);
    const [showTaxCompliance, setShowTaxCompliance] = React.useState(false);
    const [showAutomationHub, setShowAutomationHub] = React.useState(false);
    const [showEmailIntelligence, setShowEmailIntelligence] = React.useState(false);
    const [showDemandForecast, setShowDemandForecast] = React.useState(false);
    const [showSmartPricing, setShowSmartPricing] = React.useState(false);
    const [showLoyaltyProgram, setShowLoyaltyProgram] = React.useState(false);
    const [showDynamicPricing, setShowDynamicPricing] = React.useState(false);
    const [selectedReceiptOrder, setSelectedReceiptOrder] = React.useState<any>(null);
    const [selectedCampaign, setSelectedCampaign] = React.useState<any>(null); // State for editing campaign
    const [showPlatformSettings, setShowPlatformSettings] = React.useState(false);
    const [showAccountManager, setShowAccountManager] = React.useState(false);
    const [showIncomeEntry, setShowIncomeEntry] = React.useState(false);
    const [showAssetHub, setShowAssetHub] = React.useState(false);
    const [showInventoryBalancing, setShowInventoryBalancing] = React.useState(false);
    const [showPricingAdvantage, setShowPricingAdvantage] = React.useState(false);
    const [showQRISPayment, setShowQRISPayment] = React.useState<any>(null);
    const [showPaymentVerification, setShowPaymentVerification] = React.useState(false);
    const [showPaymentHistory, setShowPaymentHistory] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<'OPERATIONAL' | 'FINANCE' | 'INTELLIGENCE' | 'PRODUCTION' | 'CATALOG' | 'RAW_MATERIAL' | 'RECIPES' | 'MARKETING' | 'MARKETING_CAMPAIGNS' | 'MARKETING_CAMPAIGN_FORM' | 'MARKETING_FLASHSALE' | 'MARKETING_SUBSCRIPTIONS' | 'MARKETING_SUBSCRIPTION_DATA' | 'MARKETING_BUNDLE_MANAGER' | 'MARKETING_SEASONAL' | 'ORDER_LEDGER'>('OPERATIONAL');

    const [pulseActivities, setPulseActivities] = React.useState<any[]>(activities || []);
    const [categories, setCategories] = React.useState<any[]>([]);

    React.useEffect(() => {
        // Sync daily overhead on load
        if (brandId) {
            syncDailyOverheadAction(brandId);
            syncDemandAccuracyAction(brandId);
        }
    }, [brandId]);

    const closeAllModals = React.useCallback(() => {
        setShowLedger(false);
        setShowReports(false);
        setShowReconciliation(false);
        setShowWarehouse(false);
        setShowAudit(false);
        setShowAudit(false);
        setShowIngestion(false);
        setShowOrderEntry(false);
        setShowExpenseEntry(false);
        setShowPlatformSettings(false);
        setShowKDS(false);
        setShowBarcodeAudit(false);
        setShowCRM(false);
        setShowSecurityPulse(false);
        setShowTaxCompliance(false);
        setShowAutomationHub(false);
        setShowEmailIntelligence(false);
        setShowDemandForecast(false);
        setShowSmartPricing(false);
        setShowLoyaltyProgram(false);
        setShowDynamicPricing(false);
        setShowAccountManager(false);
        setShowIncomeEntry(false);
        setShowInventoryBalancing(false);
        setShowPricingAdvantage(false);
        setShowQRISPayment(null);
        setShowPaymentVerification(false);
        setShowPaymentHistory(false);
        setSelectedReceiptOrder(null);
    }, []);

    const openOperationalHub = (mode: 'PRODUCTION' | 'CATALOG' | 'RAW_MATERIAL' | 'RECIPES') => {
        closeAllModals();
        setViewMode(mode);
    };

    // Expose control to window for nested components (ledger buttons)
    React.useEffect(() => {
        (window as any).openIngestion = () => { closeAllModals(); setShowIngestion(true); };
        (window as any).openOrderEntry = () => { closeAllModals(); setShowOrderEntry(true); };
        (window as any).openExpenseEntry = () => { closeAllModals(); setShowExpenseEntry(true); };
        (window as any).openAudit = () => { closeAllModals(); setShowAudit(true); };
        (window as any).openCatalog = () => openOperationalHub('CATALOG');
        (window as any).openPlatformSettings = () => { closeAllModals(); setShowPlatformSettings(true); };
        (window as any).openProduction = () => openOperationalHub('PRODUCTION');
        (window as any).openRecipes = () => openOperationalHub('RECIPES');
        (window as any).openRawMaterial = () => openOperationalHub('RAW_MATERIAL');
        (window as any).openReceipt = (order: any) => { closeAllModals(); setSelectedReceiptOrder(order); };
        (window as any).openIntel = () => setViewMode('INTELLIGENCE');
        (window as any).showTaxCompliance = () => { closeAllModals(); setShowTaxCompliance(true); };
        (window as any).showAutomationHub = () => { closeAllModals(); setShowAutomationHub(true); };
        (window as any).showEmailIntelligence = () => { closeAllModals(); setShowEmailIntelligence(true); };
        (window as any).showDemandForecast = () => { closeAllModals(); setShowDemandForecast(true); };
        (window as any).showSmartPricing = () => { closeAllModals(); setShowSmartPricing(true); };
        (window as any).showLoyaltyProgram = () => { closeAllModals(); setShowLoyaltyProgram(true); };
        (window as any).showAccountManager = () => { closeAllModals(); setShowAccountManager(true); };
        (window as any).showIncomeEntry = () => { closeAllModals(); setShowIncomeEntry(true); };
        (window as any).showAssetHub = () => { closeAllModals(); setViewMode('FINANCE'); setShowAssetHub(true); };
        (window as any).showInventoryBalancing = () => { closeAllModals(); setShowInventoryBalancing(true); };
        (window as any).showPricingAdvantage = () => { closeAllModals(); setShowPricingAdvantage(true); };


        return () => {
            delete (window as any).openIngestion;
            delete (window as any).openOrderEntry;
            delete (window as any).openExpenseEntry;
            delete (window as any).openAudit;
            delete (window as any).openCatalog;
            delete (window as any).openPlatformSettings;
            delete (window as any).openProduction;
            delete (window as any).openReceipt;
            delete (window as any).openIntel;
            delete (window as any).showTaxCompliance;
            delete (window as any).showAutomationHub;
            delete (window as any).showEmailIntelligence;
            delete (window as any).showDemandForecast;
            delete (window as any).showSmartPricing;
            delete (window as any).showLoyaltyProgram;
        };
    }, [closeAllModals]);

    // Fetch WhatsApp Pulse data
    React.useEffect(() => {
        async function fetchPulse() {
            const result = await getWhatsAppPulseAction(brandId);
            if (result.success && result.data) {
                setPulseActivities(result.data);
            }
        }

        fetchPulse();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchPulse, 30000);
        return () => clearInterval(interval);
    }, [brandId]);

    // Fetch Categories
    React.useEffect(() => {
        async function fetchCats() {
            const cats = await getIbuCategories(brandId);
            setCategories(cats);
        }
        if (brandId) fetchCats();
    }, [brandId]);

    // Auth & Permission Logic (Prioritize Server User for consistency)
    const { data: clientSession, status: authStatus } = useSession();
    const user = serverUser || clientSession?.user;
    const isAuthLoading = authStatus === 'loading' && !serverUser;

    // Direct Bypass Logic for Owner (Mahesa)
    const isMahesa = !!(
        user?.email?.toLowerCase().includes('mahesa') ||
        user?.email?.toLowerCase().includes('achiera') ||
        user?.name?.toLowerCase().includes('mahesa') ||
        user?.id === 'cmk5kkbnc000013lpokgbhmjy' || // Achiera Account
        user?.id === 'cmk8mdya50001zn3vz7azydoz'    // Gmail Account
    );

    // 1. Global Authority (Super Admin / Platform Admin)
    const isGlobalOwner = ['OWNER', 'PLATFORM_ADMIN', 'SUPER_ADMIN'].includes(user?.globalRole?.toUpperCase() || '');

    // 2. Brand Specific Role Resolution (Try multiple paths for robustness)
    const brandRoleInBrands = user?.brands?.find((b: any) =>
        b.brandId === brandId || b.brandSlug === 'rasa-ibu'
    )?.role || '';

    const brandRoleInRoles = (user as any)?.brandRoles?.find((br: any) =>
        br.brandId === brandId || br.brand?.slug === 'rasa-ibu'
    )?.role || '';

    const normalizedRole = (brandRoleInBrands || brandRoleInRoles || '').toUpperCase();

    // 3. Absolute Permission Fallback
    const hasAnyAdminAuthority = user?.brands?.some((b: any) => ['OWNER', 'ADMIN', 'BRAND_ADMIN', 'BRAND_OWNER'].includes(b?.role?.toUpperCase() || '')) ||
        user?.brandRoles?.some((br: any) => ['OWNER', 'ADMIN', 'BRAND_ADMIN', 'BRAND_OWNER'].includes(br?.role?.toUpperCase() || ''));

    // 4. Final Permission Sets - OWNER BYPASS ACTIVATED
    const canManageBrand = !isAuthLoading && (isMahesa || isGlobalOwner || ['BRAND_ADMIN', 'OWNER', 'ADMIN', 'BRAND_OWNER'].includes(normalizedRole) || hasAnyAdminAuthority);
    const canAccessWarehouse = canManageBrand || ['BRAND_WAREHOUSE_ADMIN', 'WAREHOUSE_STAFF'].includes(normalizedRole);
    const canAccessIntelligence = canManageBrand || ['BRAND_FINANCE'].includes(normalizedRole);

    // Debug Pulse
    React.useEffect(() => {
        if (isMahesa || user?.email) {
            console.log('🛡️ AUTH DEBUG:', { email: user?.email, id: user?.id, role: normalizedRole, managed: canManageBrand });
        }
    }, [user, normalizedRole, canManageBrand, isMahesa]);

    // ... (effects)

    // ... (effects)

    // ... (effects)

    return (
        <div suppressHydrationWarning className="p-8 space-y-10 min-h-screen bg-[#FDFBF7]/50 relative overflow-hidden">
            {/* Background Aura */}
            <div suppressHydrationWarning className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-100/30 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
            <div suppressHydrationWarning className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-100/30 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/2"></div>

            {/* DIAGNOSTIC BANNER (Temporary) */}
            <div className="fixed top-0 left-0 right-0 z-[10000] bg-black text-white text-[10px] p-2 flex justify-center gap-6 font-mono">
                <span>USER: {user?.email || 'Guest'}</span>
                <span>ROLE: {normalizedRole || 'NONE'}</span>
                <span>GLOBAL: {user?.globalRole || 'NONE'}</span>
                <span className={canManageBrand ? 'text-emerald-400' : 'text-rose-400'}>MANAGE: {canManageBrand ? 'YES' : 'NO'}</span>
                <span className={isMahesa ? 'text-emerald-400' : 'text-white'}>MAHESA: {isMahesa ? 'YES' : 'NO'}</span>
                <span>ID: {user?.id || 'NO_ID'}</span>
            </div>

            {/* Modals Selection */}
            {showLedger && <LedgerModal brandId={brandId} onClose={() => setShowLedger(false)} />}
            {showReports && <FinancialReportsModal brandId={brandId} onClose={() => setShowReports(false)} />}
            {showReconciliation && <PaymentReconciliationModal brandId={brandId} onClose={() => setShowReconciliation(false)} />}
            {showWarehouse && <WarehouseManager brandId={brandId} onClose={() => setShowWarehouse(false)} />}
            {showAudit && <StockAuditHub brandId={brandId} products={initialProducts} onClose={() => setShowAudit(false)} />}
            {showIngestion && <SmartIngestionPanel brandId={brandId} onClose={() => setShowIngestion(false)} />}
            {showOrderEntry && <OrderEntryModal brandId={brandId} products={initialProducts} onClose={() => setShowOrderEntry(false)} />}
            {showExpenseEntry && <ExpenseEntryModal brandId={brandId} onClose={() => setShowExpenseEntry(false)} />}
            {showPlatformSettings && <PlatformSettingsModal brandId={brandId} onClose={() => setShowPlatformSettings(false)} />}
            {showProcurement && <ProcurementAdvisor brandId={brandId} onClose={() => setShowProcurement(false)} />}
            {showKDS && <KitchenDisplay brandId={brandId} orders={initialOrders} onClose={() => setShowKDS(false)} />}
            {showBarcodeAudit && <BarcodeStockAudit brandId={brandId} onClose={() => setShowBarcodeAudit(false)} />}
            {showCRM && <CRMIntelligence brandId={brandId} onClose={() => setShowCRM(false)} />}
            {showSecurityPulse && <SecurityPulse brandId={brandId} onClose={() => setShowSecurityPulse(false)} />}
            {showAccountManager && <AccountManagerModal brandId={brandId} onClose={() => setShowAccountManager(false)} />}
            {showIncomeEntry && <IncomeEntryModal brandId={brandId} onClose={() => setShowIncomeEntry(false)} />}
            {showTaxCompliance && <TaxComplianceModal brandId={brandId} onClose={() => setShowTaxCompliance(false)} />}

            {showQRISPayment && (
                <QRISPaymentModal
                    order={showQRISPayment}
                    onClose={() => setShowQRISPayment(null)}
                    onSuccess={() => { setShowQRISPayment(null); window.location.reload(); }}
                />
            )}

            {showPaymentVerification && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-[#FDFBF7] rounded-[3rem] w-full max-w-lg relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowPaymentVerification(false)}
                            className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-all shadow-sm z-10"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                        <div className="max-h-[85vh] overflow-y-auto">
                            <PaymentVerificationPanel
                                brandId={brandId}
                                onVerificationSuccess={() => { window.location.reload(); }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {
                showPaymentHistory && (
                    <PaymentHistoryModal
                        brandId={brandId}
                        onClose={() => setShowPaymentHistory(false)}
                    />
                )
            }

            {
                showAutomationHub && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                        <div className="bg-gray-50 rounded-3xl w-full max-w-5xl relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowAutomationHub(false)}
                                className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-all shadow-sm z-10"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                            <div className="max-h-[85vh] overflow-y-auto p-8 md:p-12">
                                <AutomationHub brandId={brandId} onClose={() => setShowAutomationHub(false)} />
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showEmailIntelligence && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                        <div className="bg-gray-50 rounded-3xl w-full max-w-6xl relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowEmailIntelligence(false)}
                                className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-all shadow-sm z-10"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                            <div className="max-h-[85vh] overflow-y-auto p-8 md:p-12">
                                <EmailIntelligenceHub brandId={brandId} onClose={() => setShowEmailIntelligence(false)} />
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDemandForecast && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                        <div className="bg-gray-50 rounded-3xl w-full max-w-6xl relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowDemandForecast(false)}
                                className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-all shadow-sm z-10"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                            <div className="max-h-[85vh] overflow-y-auto p-8 md:p-12">
                                <DemandForecastDashboard brandId={brandId} onClose={() => setShowDemandForecast(false)} />
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showSmartPricing && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                        <div className="bg-gray-50 rounded-3xl w-full max-w-5xl relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowSmartPricing(false)}
                                className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-all shadow-sm z-10"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                            <div className="max-h-[85vh] overflow-y-auto p-8 md:p-12">
                                <SmartPricingDashboard brandId={brandId} onClose={() => setShowSmartPricing(false)} />
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showLoyaltyProgram && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                        <div className="bg-gray-50 rounded-3xl w-full max-w-6xl relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowLoyaltyProgram(false)}
                                className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-full transition-all shadow-sm z-10"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                            <div className="max-h-[85vh] overflow-y-auto p-8 md:p-12">
                                <LoyaltyProgramDashboard brandId={brandId} onClose={() => setShowLoyaltyProgram(false)} />
                            </div>
                        </div>
                    </div>
                )
            }

            {showDynamicPricing && <DynamicPricingManager brandId={brandId} onClose={() => setShowDynamicPricing(false)} />}

            {
                showInventoryBalancing && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                        <div className="bg-gray-50 rounded-3xl w-full max-w-6xl relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="max-h-[85vh] overflow-y-auto p-12">
                                <InventoryBalancingHub brandId={brandId} onClose={() => setShowInventoryBalancing(false)} />
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showPricingAdvantage && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                        <div className="bg-gray-50 rounded-3xl w-full max-w-6xl relative shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="max-h-[85vh] overflow-y-auto p-12">
                                <PricingAdvantageHub brandId={brandId} onClose={() => setShowPricingAdvantage(false)} />
                            </div>
                        </div>
                    </div>
                )
            }

            {
                selectedReceiptOrder && (
                    <div id="receipt-content">
                        <DigitalReceipt order={selectedReceiptOrder} onClose={() => setSelectedReceiptOrder(null)} />
                    </div>
                )
            }

            {/* Top Navigation & Core Actions */}
            <div suppressHydrationWarning className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#2D3A2D] rounded-2xl flex items-center justify-center shadow-lg shadow-green-900/10">
                            <span className="text-xl">🥗</span>
                        </div>
                        <h1 className="text-4xl font-black text-[#1A241A] tracking-tighter">
                            Rasa <span className="text-amber-600">Ibu</span> <span className="text-stone-300 font-light">{isMahesa ? 'OWNER OPS' : 'OPS'}</span>
                        </h1>
                    </div>
                    <p className="text-[#8B7E66] font-medium text-sm ml-1">Ecosystem Operational Command • Live Health Update</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {canManageBrand && (
                        <div className="flex bg-[#F9F7F2] p-1 rounded-2xl border border-[#E5E1D8]">
                            <button
                                onClick={() => setViewMode('OPERATIONAL')}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'OPERATIONAL'
                                    ? 'bg-[#2D3A2D] text-white shadow-lg'
                                    : 'text-[#8B7E66] hover:bg-white'
                                    }`}
                            >
                                Operational
                            </button>
                            <button
                                onClick={() => setViewMode('FINANCE')}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'FINANCE'
                                    ? 'bg-emerald-600 text-white shadow-lg'
                                    : 'text-[#8B7E66] hover:bg-white'
                                    }`}
                            >
                                Finance Hub
                            </button>
                            <button
                                onClick={() => setViewMode('INTELLIGENCE')}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'INTELLIGENCE'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-[#8B7E66] hover:bg-white'
                                    }`}
                            >
                                Analisis Hub
                            </button>
                            <button
                                onClick={() => setViewMode('MARKETING')}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'MARKETING'
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'text-[#8B7E66] hover:bg-white'
                                    }`}
                            >
                                Marketing Hub
                            </button>
                        </div>
                    )}

                    <Link
                        href="/rasa-ibu"
                        target="_blank"
                        className="px-6 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-100 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Globe className="w-4 h-4" />
                        Lihat Website
                    </Link>

                    {(isGlobalOwner || (user?.brands?.length || 0) > 1) && (
                        <Link
                            href="/dashboard?select=manual"
                            className="px-6 py-2.5 bg-white border border-[#E5E1D8] rounded-xl text-xs font-bold text-[#8B7E66] hover:bg-stone-50 transition-all shadow-sm"
                        >
                            Ganti Brand
                        </Link>
                    )}

                    {canAccessWarehouse && (
                        <button
                            onClick={() => setShowWarehouse(true)}
                            className="px-6 py-2.5 bg-[#2D3A2D] text-white rounded-xl text-xs font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-green-900/10"
                        >
                            Manajemen Gudang
                        </button>
                    )}

                    {canManageBrand && (
                        <button
                            onClick={() => setViewMode('RECIPES')}
                            className="px-6 py-2.5 bg-white border border-[#E5E1D8] text-[#2D3A2D] rounded-xl text-xs font-bold hover:bg-stone-50 transition-all shadow-sm"
                        >
                            Manajemen Resep
                        </button>
                    )}

                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-100 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* AI SYSTEM PULSE - Persistent Status bar */}
            <div className="mt-8 mb-4">
                <BIPulseWidget
                    brandId={brandId}
                    onOpenForecast={() => { closeAllModals(); setShowDemandForecast(true); }}
                    onOpenLoyalty={() => { closeAllModals(); setShowLoyaltyProgram(true); }}
                    onOpenPricing={() => { closeAllModals(); setShowSmartPricing(true); }}
                />
            </div>

            {/* Content Transition */}
            {
                viewMode === 'FINANCE' && canManageBrand ? (
                    showAssetHub ? (
                        <AssetManagementHub
                            brandId={brandId}
                            onBack={() => setShowAssetHub(false)}
                        />
                    ) : (
                        <FinanceHub
                            brandId={brandId}
                            pulse={intelligence?.finance}
                            onBack={() => setViewMode('OPERATIONAL')}
                            onOpenExpenseEntry={() => { closeAllModals(); setShowExpenseEntry(true); }}
                            onOpenIncomeEntry={() => { closeAllModals(); setShowIncomeEntry(true); }}
                            onOpenIntel={() => setViewMode('INTELLIGENCE')}
                            onOpenAccountManager={() => setShowAccountManager(true)}
                            onOpenAssetHub={() => setShowAssetHub(true)}
                            onOpenSettings={() => { closeAllModals(); setShowPlatformSettings(true); }}
                            onOpenPricing={() => { closeAllModals(); setShowPricingAdvantage(true); }}
                        />
                    )
                ) : viewMode === 'INTELLIGENCE' && canAccessIntelligence ? (

                    <IntelligenceHub
                        brandId={brandId}
                        onClose={() => setViewMode('OPERATIONAL')}
                    />
                ) : viewMode === 'MARKETING' ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-black text-[#2D3A2D] font-serif italic">Pusat Pemasaran Ibu</h2>
                                <p className="text-[#8B7E66] text-sm">Kelola kampanye, langganan, dan pertumbuhan brand dalam satu atap.</p>
                            </div>
                            <button
                                onClick={() => setViewMode('OPERATIONAL')}
                                className="px-6 py-2.5 bg-white border border-[#E5E1D8] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:bg-stone-50 transition-all flex items-center gap-2"
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                Kembali ke Operasional
                            </button>
                        </div>

                        {/* Marketing Navigation Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <button
                                onClick={() => setViewMode('MARKETING_FLASHSALE')}
                                className="group p-8 bg-white border border-[#E5E1D8] rounded-[2.5rem] hover:border-amber-200 hover:shadow-2xl hover:shadow-amber-500/5 transition-all text-left flex flex-col gap-5 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 group-hover:bg-amber-100 transition-colors"></div>
                                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors relative z-10">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Promo Kilat</p>
                                    <p className="text-xl font-black text-[#1A241A] font-serif">Flash Sale</p>
                                    <p className="text-xs text-[#8B7E66] mt-2 leading-relaxed italic">Atur harga promo berbatas waktu untuk tingkatkan konversi.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setViewMode('MARKETING_CAMPAIGNS')}
                                className="group p-8 bg-white border border-[#E5E1D8] rounded-[2.5rem] hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-500/5 transition-all text-left flex flex-col gap-5 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 group-hover:bg-rose-100 transition-colors"></div>
                                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors relative z-10">
                                    <Megaphone className="w-6 h-6" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest mb-1">Kampanye Aktif</p>
                                    <p className="text-xl font-black text-[#1A241A] font-serif">Campaigns</p>
                                    <p className="text-xs text-[#8B7E66] mt-2 leading-relaxed italic">Kelola iklan, promo bundle, dan pengumuman spesial.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setViewMode('MARKETING_SUBSCRIPTIONS')}
                                className="group p-8 bg-white border border-[#E5E1D8] rounded-[2.5rem] hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all text-left flex flex-col gap-5 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:bg-indigo-100 transition-colors"></div>
                                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors relative z-10">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Member Rutin</p>
                                    <p className="text-xl font-black text-[#1A241A] font-serif">Subscription</p>
                                    <p className="text-xs text-[#8B7E66] mt-2 leading-relaxed italic">Atur paket langganan harian dan mingguan keluarga.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setViewMode('MARKETING_SUBSCRIPTION_DATA')}
                                className="group p-8 bg-white border border-[#E5E1D8] rounded-[2.5rem] hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-500/5 transition-all text-left flex flex-col gap-5 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 group-hover:bg-purple-100 transition-colors"></div>
                                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors relative z-10">
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-purple-900 uppercase tracking-widest mb-1">Basis Data</p>
                                    <p className="text-xl font-black text-[#1A241A] font-serif">Customer Data</p>
                                    <p className="text-xs text-[#8B7E66] mt-2 leading-relaxed italic">Analisis perilaku dan preferensi Bunda secara mendalam.</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setViewMode('MARKETING_SEASONAL')}
                                className="group p-8 bg-white border border-[#E5E1D8] rounded-[2.5rem] hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all text-left flex flex-col gap-5 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 group-hover:bg-emerald-100 transition-colors"></div>
                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors relative z-10">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest mb-1">Perayaan</p>
                                    <p className="text-xl font-black text-[#1A241A] font-serif">Seasonal</p>
                                    <p className="text-xs text-[#8B7E66] mt-2 leading-relaxed italic">Kelola tampilan perayaan musiman di website.</p>
                                </div>
                            </button>
                        </div>

                        <div className="pt-8 border-t border-[#E5E1D8]/50">
                            <div className="flex items-center gap-2 mb-6">
                                <Activity className="w-4 h-4 text-emerald-600" />
                                <h3 className="text-xs font-black text-[#2D3A2D] uppercase tracking-widest">Analitik Pemasaran Langsung</h3>
                            </div>
                            <MarketingAnalyticsDashboard brandId={brandId} />
                        </div>
                    </div>
                )
                    : viewMode === 'MARKETING_CAMPAIGNS' ? (
                        <CampaignManager
                            brandId={brandId}
                            onClose={() => setViewMode('MARKETING')}
                            onCreate={() => {
                                setSelectedCampaign(null);
                                setViewMode('MARKETING_CAMPAIGN_FORM');
                            }}
                            onEdit={(campaign) => {
                                setSelectedCampaign(campaign);
                                setViewMode('MARKETING_CAMPAIGN_FORM');
                            }}
                            onManageBundles={(campaign) => {
                                setSelectedCampaign(campaign);
                                setViewMode('MARKETING_BUNDLE_MANAGER');
                            }}
                        />
                    ) : viewMode === 'MARKETING_CAMPAIGN_FORM' ? (
                        <CampaignForm
                            brandId={brandId}
                            initialData={selectedCampaign}
                            onCancel={() => {
                                setSelectedCampaign(null);
                                setViewMode('MARKETING_CAMPAIGNS');
                            }}
                            onSuccess={() => {
                                setSelectedCampaign(null);
                                setViewMode('MARKETING_CAMPAIGNS');
                            }}
                        />
                    ) : viewMode === 'MARKETING_BUNDLE_MANAGER' ? (
                        <BundleManager
                            brandId={brandId}
                            campaign={selectedCampaign}
                            onClose={() => {
                                setSelectedCampaign(null);
                                setViewMode('MARKETING_CAMPAIGNS');
                            }}
                        />
                    ) : viewMode === 'MARKETING_FLASHSALE' ? (
                        <FlashSaleManager
                            brandId={brandId}
                            onClose={() => setViewMode('MARKETING')}
                        />
                    ) : viewMode === 'MARKETING_SUBSCRIPTIONS' ? (
                        <SubscriptionPlanManager
                            brandId={brandId}
                            onClose={() => setViewMode('MARKETING')}
                        />
                    ) : viewMode === 'MARKETING_SUBSCRIPTION_DATA' ? (
                        <div className="space-y-6">
                            <button
                                onClick={() => setViewMode('MARKETING')}
                                className="text-sm font-medium text-stone-500 hover:text-stone-900 flex items-center gap-2"
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                Back to Marketing
                            </button>
                            <SubscriptionDataManager brandId={brandId} />
                        </div>
                    ) : viewMode === 'MARKETING_SEASONAL' ? (
                        <div className="space-y-6">
                            <button
                                onClick={() => setViewMode('MARKETING')}
                                className="px-6 py-2.5 bg-white border border-[#E5E1D8] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:bg-stone-50 transition-all flex items-center gap-2"
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                Kembali ke Marketing Hub
                            </button>
                            <SeasonalSettingsPage />
                        </div>
                    ) : viewMode === 'PRODUCTION' ? (
                        <ProductionHub
                            brandId={brandId}
                            onClose={() => setViewMode('OPERATIONAL')}
                        />
                    ) : viewMode === 'CATALOG' ? (
                        <CatalogManager
                            brandId={brandId}
                            products={initialProducts}
                            categories={categories}
                            onClose={() => setViewMode('OPERATIONAL')}
                        />
                    ) : viewMode === 'RECIPES' ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-[#2D3A2D] font-serif italic">Manajemen Resep Ibu</h2>
                                    <p className="text-[#8B7E66] text-sm">Moderasi resep dari Bunda dan kelola ulasan komunitas.</p>
                                </div>
                                <button
                                    onClick={() => setViewMode('OPERATIONAL')}
                                    className="px-6 py-2.5 bg-white border border-[#E5E1D8] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:bg-stone-50 transition-all flex items-center gap-2"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                    Kembali ke Dashboard
                                </button>
                            </div>
                            <RecipeManager brandId={brandId} recipes={initialRecipes} />
                        </div>
                    ) : viewMode === 'RAW_MATERIAL' ? (
                        <RawMaterialHub
                            brandId={brandId}
                            onClose={() => setViewMode('OPERATIONAL')}
                        />
                    ) : viewMode === 'ORDER_LEDGER' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex items-center justify-between mb-2">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-[#2D3A2D] font-serif italic">Buku Pesanan Ibu</h2>
                                    <p className="text-[#8B7E66] text-sm">Kelola pesanan keluarga dengan pandangan yang lebih luas.</p>
                                </div>
                                <button
                                    onClick={() => setViewMode('OPERATIONAL')}
                                    className="px-6 py-2.5 bg-white border border-[#E5E1D8] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#8B7E66] hover:bg-stone-50 transition-all flex items-center gap-2"
                                >
                                    <ChevronRight className="w-4 h-4 rotate-180" />
                                    Kembali ke Dashboard
                                </button>
                            </div>
                            <ManualOrderLedger
                                orders={initialOrders}
                                onOpenIngestion={() => { closeAllModals(); setShowIngestion(true); }}
                                onOpenOrderEntry={() => { closeAllModals(); setShowOrderEntry(true); }}
                                onOpenReceipt={(order) => { closeAllModals(); setSelectedReceiptOrder(order); }}
                                onOpenQRISPayment={(order) => { closeAllModals(); setShowQRISPayment(order); }}
                                onOpenPaymentVerification={() => { closeAllModals(); setShowPaymentVerification(true); }}
                                onOpenPaymentHistory={() => { closeAllModals(); setShowPaymentHistory(true); }}
                                isFullscreen={true}
                                onToggleFullscreen={() => setViewMode('OPERATIONAL')}
                            />
                        </div>
                    ) : (
                        <>
                            {/* QUICK LAUNCHPAD - High Accessibility Action Grid (Moved Top for Visibility) */}
                            <div className="mb-10">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h2 className="text-xs font-black text-[#2D3A2D] uppercase tracking-widest flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                                        Pusat Kendali Operasional
                                    </h2>
                                    <span className="text-[10px] font-bold text-[#8B7E66] bg-[#F9F7F2] px-3 py-1 rounded-full border border-[#E5E1D8]">
                                        Akses Cepat Alat Pintar
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {/* Demand Forecast */}
                                    <button
                                        onClick={() => setShowDemandForecast(true)}
                                        className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-left flex flex-col gap-3"
                                    >
                                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                            <BrainCircuit className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-900 uppercase">Demand</p>
                                            <p className="text-[11px] font-bold text-[#1A241A]">Forecast AI</p>
                                        </div>
                                    </button>

                                    {/* Smart Pricing */}
                                    <button
                                        onClick={() => setShowSmartPricing(true)}
                                        className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-left flex flex-col gap-3"
                                    >
                                        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-900 uppercase">Pricing</p>
                                            <p className="text-[11px] font-bold text-[#1A241A]">Smart Optimizer</p>
                                        </div>
                                    </button>

                                    {/* Loyalty Hub */}
                                    <button
                                        onClick={() => setShowLoyaltyProgram(true)}
                                        className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all text-left flex flex-col gap-3"
                                    >
                                        <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                            <Star className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-purple-900 uppercase">Loyalty</p>
                                            <p className="text-[11px] font-bold text-[#1A241A]">Reward Engine</p>
                                        </div>
                                    </button>

                                    {/* AAE Autopilot */}
                                    <button
                                        onClick={() => setShowAutomationHub(true)}
                                        className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-slate-300 hover:shadow-xl hover:shadow-slate-500/5 transition-all text-left flex flex-col gap-3"
                                    >
                                        <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-[#2D3A2D] group-hover:text-white transition-colors">
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase">Robot AAE</p>
                                            <p className="text-[11px] font-bold text-[#1A241A]">Auto-Processing</p>
                                        </div>
                                    </button>

                                    {/* Email Intel */}
                                    <button
                                        onClick={() => setShowEmailIntelligence(true)}
                                        className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left flex flex-col gap-3"
                                    >
                                        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                            <Zap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-900 uppercase">Input Pintar</p>
                                            <p className="text-[11px] font-bold text-[#1A241A]">Email Intel Hub</p>
                                        </div>
                                    </button>

                                    {/* Produksi & Resep */}
                                    {canManageBrand && (
                                        <button
                                            onClick={() => setViewMode('PRODUCTION')}
                                            className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-left flex flex-col gap-3"
                                        >
                                            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                <ChefHat className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-900 uppercase">Dapur Intel</p>
                                                <p className="text-[11px] font-bold text-[#1A241A]">Produksi & Resep</p>
                                            </div>
                                        </button>
                                    )}

                                    {/* Katalog Menu */}
                                    {canManageBrand && (
                                        <button
                                            onClick={() => setViewMode('CATALOG')}
                                            className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all text-left flex flex-col gap-3"
                                        >
                                            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                                <LayoutGrid className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-amber-900 uppercase">Master Data</p>
                                                <p className="text-[11px] font-bold text-[#1A241A]">Manajemen Menu</p>
                                            </div>
                                        </button>
                                    )}

                                    {/* Inventory Balancing */}
                                    <button
                                        onClick={() => setShowInventoryBalancing(true)}
                                        className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-left flex flex-col gap-3"
                                    >
                                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            <ArrowRightLeft className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-900 uppercase">Equilibrium</p>
                                            <p className="text-[11px] font-bold text-[#1A241A]">Balancing Hub</p>
                                        </div>
                                    </button>

                                    {/* Pricing Advantage */}
                                    <button
                                        onClick={() => setShowPricingAdvantage(true)}
                                        className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-left flex flex-col gap-3"
                                    >
                                        <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                            <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-900 uppercase">Strategy</p>
                                            <p className="text-[11px] font-bold text-[#1A241A]">Pricing Hub</p>
                                        </div>
                                    </button>

                                    {/* Ingredient Hub */}
                                    {canManageBrand && (
                                        <button
                                            onClick={() => setViewMode('RAW_MATERIAL')}
                                            className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left flex flex-col gap-3"
                                        >
                                            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                                <ShoppingBasket className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-blue-900 uppercase">Ingredient Hub</p>
                                                <p className="text-[11px] font-bold text-[#1A241A]">Bahan Baku</p>
                                            </div>
                                        </button>
                                    )}

                                    {/* Audit Stok */}
                                    {canManageBrand && (
                                        <button
                                            onClick={() => setShowAudit(true)}
                                            className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all text-left flex flex-col gap-3"
                                        >
                                            <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-amber-900 uppercase">Audit</p>
                                                <p className="text-[11px] font-bold text-[#1A241A]">Stok Fisik Hub</p>
                                            </div>
                                        </button>
                                    )}

                                    {/* Label Printer */}
                                    <Link
                                        href="/dashboard/rasa-ibu/inventory/labels"
                                        className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-stone-200 hover:shadow-xl hover:shadow-stone-500/5 transition-all text-left flex flex-col gap-3"
                                    >
                                        <div className="w-10 h-10 bg-stone-50 rounded-2xl flex items-center justify-center group-hover:bg-[#2D3A2D] group-hover:text-white transition-colors">
                                            <Printer className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-stone-900 uppercase">Labeling</p>
                                            <p className="text-[11px] font-bold text-[#1A241A]">Cetak SKU & QR</p>
                                        </div>
                                    </Link>

                                    {/* CMS Content Manager */}
                                    <Link
                                        href="/dashboard/rasa-ibu/content"
                                        className="group p-5 bg-white border border-[#E5E1D8] rounded-[2rem] hover:border-sky-200 hover:shadow-xl hover:shadow-sky-500/5 transition-all text-left flex flex-col gap-3"
                                    >
                                        <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-colors">
                                            <Globe className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-sky-900 uppercase">Website</p>
                                            <p className="text-[11px] font-bold text-[#1A241A]">Edit Public Content</p>
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            {/* Executive Intelligence Tier */}
                            <div className="grid grid-cols-1 gap-8">
                                <SmartAdvisory intelligence={intelligence} />

                                {canManageBrand && (
                                    <FinancialInsight
                                        pulse={intelligence?.finance}
                                        onOpenLedger={() => setShowLedger(true)}
                                        onOpenReports={() => setShowReports(true)}
                                        onOpenReconciliation={() => setShowReconciliation(true)}
                                        onOpenAccountManager={() => setShowAccountManager(true)}
                                    />
                                )}
                            </div>

                            {/* Operational Grid Tier */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* Secondary Actions & Activity Sidebar */}
                                <div className="space-y-6 order-2 lg:order-1">
                                    <WhatsAppActivityPulse activities={pulseActivities} />
                                </div>

                                {/* Primary Data Grid (Inventory & Orders) */}
                                <div className="lg:col-span-2 space-y-8 order-1 lg:order-2">
                                    <PantryStockGrid
                                        products={initialProducts}
                                        canAudit={canManageBrand}
                                        onOpenAudit={() => { closeAllModals(); setShowAudit(true); }}
                                        onOpenProduction={() => openOperationalHub('PRODUCTION')}
                                    />
                                    <ManualOrderLedger
                                        orders={initialOrders}
                                        onOpenIngestion={() => { closeAllModals(); setShowIngestion(true); }}
                                        onOpenOrderEntry={() => { closeAllModals(); setShowOrderEntry(true); }}
                                        onOpenReceipt={(order) => { closeAllModals(); setSelectedReceiptOrder(order); }}
                                        onOpenQRISPayment={(order) => { closeAllModals(); setShowQRISPayment(order); }}
                                        onOpenPaymentVerification={() => { closeAllModals(); setShowPaymentVerification(true); }}
                                        onOpenPaymentHistory={() => { closeAllModals(); setShowPaymentHistory(true); }}
                                        onToggleFullscreen={() => setViewMode('ORDER_LEDGER')}
                                    />
                                </div>
                            </div>
                        </>
                    )}

            {/* Platform Governance Footer */}
            <div className="pt-10 border-t border-[#E5E1D8] flex flex-col md:flex-row justify-between items-center gap-4 opacity-70">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-[#8B7E66] uppercase tracking-widest">Platform Core:</span>
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">v2.12_ADVISORY</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-[#8B7E66] uppercase tracking-widest">Data Isolation:</span>
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase">ENFORCED</span>
                    </div>
                </div>
                <p className="text-[10px] font-medium text-[#8B7E66] italic text-center md:text-right">
                    Operational insight provided by Achiera AI Hub. <br /> "Powered by human care. Insight does not equal instruction."
                </p>
            </div>
        </div >
    );
}
