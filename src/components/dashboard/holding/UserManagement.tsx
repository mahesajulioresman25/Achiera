'use client';

import React, { useState } from 'react';
import {
    Users,
    UserPlus,
    Shield,
    Building,
    Trash2,
    Mail,
    Key,
    ChevronRight,
    Search,
    UserCheck,
    Settings2,
    X,
    Plus,
    CheckCircle2,
    Lock
} from 'lucide-react';
import { toast } from 'sonner';
import {
    createUserAction,
    deleteUserAction,
    updateUserAction,
    assignBrandRoleAction,
    removeBrandRoleAction,
    getUsersAction
} from '@/lib/actions/users';
import { GlobalRole, BrandRole } from '@prisma/client';

interface UserManagementProps {
    initialUsers: any[];
    availableBrands: any[];
}

export default function UserManagement({ initialUsers, availableBrands }: UserManagementProps) {
    const [users, setUsers] = useState(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const activeUser = users.find(u => u.id === selectedUserId);

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        globalRole: 'USER' as GlobalRole
    });

    const refreshUsers = async () => {
        const res = await getUsersAction();
        if (res.success) setUsers(res.data);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const res = await createUserAction(newUser);
        if (res.success) {
            setIsCreateModalOpen(false);
            setNewUser({ name: '', email: '', password: '', globalRole: 'USER' });
            await refreshUsers();
            toast.success('Identity deployed successfully');
        } else {
            toast.error(res.error);
        }
        setIsLoading(false);
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        setIsLoading(true);
        const res = await deleteUserAction(userId);
        if (res.success) {
            await refreshUsers();
            toast.success('User berhasil dihapus');
        } else {
            toast.error(res.error);
        }
        setIsLoading(false);
    };

    const handleUpdateGlobalRole = async (userId: string, role: GlobalRole) => {
        setIsLoading(true);
        const res = await updateUserAction(userId, { globalRole: role });
        if (res.success) {
            await refreshUsers();
            toast.success('Peran global berhasil diperbarui');
        } else {
            toast.error(res.error);
        }
        setIsLoading(false);
    };

    const handleAssignBrandRole = async (userId: string, brandId: string, role: BrandRole) => {
        setIsLoading(true);
        const res = await assignBrandRoleAction(userId, brandId, role);
        if (res.success) {
            await refreshUsers();
            toast.success('Peran brand berhasil ditetapkan');
        } else {
            toast.error(res.error);
        }
        setIsLoading(false);
    };

    const handleRemoveBrandRole = async (userId: string, brandId: string) => {
        setIsLoading(true);
        const res = await removeBrandRoleAction(userId, brandId);
        if (res.success) {
            await refreshUsers();
            toast.success('Akses brand berhasil dihapus');
        } else {
            toast.error(res.error);
        }
        setIsLoading(false);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#FDFBF7] p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-stone-500 mb-2">
                        <Users className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-[0.2em]">Platform Governance</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-stone-900">User Management</h1>
                    <p className="text-stone-500 text-sm md:text-base">Manage system access, global roles, and brand-specific permissions.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/10 w-full md:w-auto"
                >
                    <UserPlus className="w-5 h-5" />
                    Create New User
                </button>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Search & Stats */}
                <div className="flex flex-col md:flex-row gap-4 md:items-center bg-white p-4 rounded-3xl border border-stone-200 shadow-sm">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-12 pr-4 py-3 bg-stone-50 rounded-2xl border-none focus:ring-2 focus:ring-stone-900 outline-none transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="px-6 py-3 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-center gap-3">
                        <UserCheck className="w-5 h-5 text-amber-600" />
                        <div className="text-sm font-bold text-amber-900">
                            {users.length} Total Users
                        </div>
                    </div>
                </div>

                {/* User Table Card */}
                <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[800px]">
                            <thead>
                                <tr className="bg-stone-50 border-b border-stone-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Global Role</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Brand Access</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-stone-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center font-black text-stone-500">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-stone-900">{user.name}</p>
                                                    <p className="text-xs text-stone-400">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <Shield className={`w-4 h-4 ${user.globalRole === 'OWNER' ? 'text-amber-500' : 'text-stone-400'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${user.globalRole === 'OWNER' ? 'text-amber-600' : 'text-stone-500'}`}>
                                                    {user.globalRole}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-wrap gap-2">
                                                {user.globalRole === 'OWNER' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-tight border border-amber-200">
                                                        <Shield className="w-3 h-3" />
                                                        All Brands (Master)
                                                    </span>
                                                ) : user.brandRoles?.length > 0 ? (
                                                    user.brandRoles.map((br: any) => (
                                                        <span key={br.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-[10px] font-black uppercase tracking-tight">
                                                            <Building className="w-3 h-3" />
                                                            {br.brand.name} ({br.role})
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] font-bold text-stone-300 italic">No brand access</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setSelectedUserId(user.id); setIsRoleModalOpen(true); }}
                                                    className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-stone-200 text-stone-400 hover:text-stone-900 transition-all"
                                                    title="Permissions"
                                                >
                                                    <Settings2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 text-stone-400 hover:text-rose-600 transition-all"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-10 py-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Platform Registry</span>
                                <h2 className="text-2xl font-black text-stone-900">Create New Identity</h2>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-stone-100 rounded-xl transition-all">
                                <X className="w-6 h-6 text-stone-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Full Name</label>
                                    <div className="relative">
                                        <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                                        <input
                                            required
                                            className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-12 py-3 text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                                            placeholder="Achiera Staff"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                                        <input
                                            type="email"
                                            required
                                            className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-12 py-3 text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                                            placeholder="staff@achiera.com"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Initialize Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
                                        <input
                                            type="password"
                                            required
                                            className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-12 py-3 text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                                            placeholder="Min. 8 characters"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Global System Role</label>
                                    <select
                                        className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-stone-900 outline-none transition-all"
                                        value={newUser.globalRole}
                                        onChange={(e) => setNewUser({ ...newUser, globalRole: e.target.value as GlobalRole })}
                                    >
                                        <option value="USER">USER (Standard)</option>
                                        <option value="PLATFORM_ADMIN">PLATFORM_ADMIN</option>
                                        <option value="PLATFORM_FINANCE">PLATFORM_FINANCE</option>
                                        <option value="OWNER">OWNER (Full Master)</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full py-4 bg-stone-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-stone-800 transition-all shadow-xl shadow-stone-900/20 disabled:opacity-50">
                                {isLoading ? 'Processing...' : 'Deploy Identity'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Permissions & Roles Modal */}
            {isRoleModalOpen && activeUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in duration-300">
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-stone-900 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <div className="px-10 py-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center font-black text-white text-xl">
                                    {activeUser.name.charAt(0)}
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Permissions Matrix</span>
                                    <h2 className="text-xl font-black text-stone-900">{activeUser.name}</h2>
                                </div>
                            </div>
                            <button onClick={() => { setIsRoleModalOpen(false); setSelectedUserId(null); }} className="p-2 hover:bg-stone-100 rounded-xl transition-all">
                                <X className="w-6 h-6 text-stone-400" />
                            </button>
                        </div>

                        <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto">
                            {/* Global Role Section */}
                            <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-stone-400" />
                                        Global System Responsibility
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${activeUser.globalRole === 'OWNER' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-stone-100 text-stone-600 border-stone-200'
                                        }`}>
                                        Current: {activeUser.globalRole}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {['USER', 'PLATFORM_ADMIN', 'PLATFORM_FINANCE', 'OWNER'].map((role) => (
                                        <button
                                            key={role}
                                            disabled={isLoading}
                                            onClick={() => handleUpdateGlobalRole(activeUser.id, role as GlobalRole)}
                                            className={`px-4 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeUser.globalRole === role
                                                ? 'bg-stone-900 border-stone-900 text-white shadow-lg shadow-stone-900/20'
                                                : 'bg-white border-stone-100 text-stone-400 hover:border-stone-300'
                                                } disabled:opacity-50`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Brand Access Section */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-stone-900 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
                                    <Building className="w-4 h-4 text-stone-400" />
                                    Brand Specific Permissions
                                </h3>

                                {activeUser.globalRole === 'OWNER' ? (
                                    <div className="p-8 bg-amber-50 rounded-[2rem] border-2 border-amber-200 border-dashed text-center space-y-3">
                                        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Master Authority</h4>
                                            <p className="text-xs text-amber-700 font-medium max-w-[280px] mx-auto">
                                                As an OWNER, this user automatically inherits full administrative permissions across all brands in the Achiera ecosystem.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {availableBrands.map((brand) => {
                                            const currentRole = activeUser.brandRoles?.find((br: any) => br.brandId === brand.id);
                                            return (
                                                <div key={brand.id} className="p-5 bg-white rounded-3xl flex items-center justify-between border border-stone-200 hover:border-stone-300 transition-all group/brand">
                                                    <div className="font-bold text-stone-900 flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-lg grayscale group-hover/brand:grayscale-0 transition-all">
                                                            {brand.slug.includes('rasa-ibu') ? '🥗' : brand.slug.includes('it-solution') ? '💻' : brand.slug.includes('merch') ? '👕' : '🏛️'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-stone-900">{brand.name}</p>
                                                            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                                                                {currentRole ? currentRole.role : 'No Access'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <select
                                                            disabled={isLoading}
                                                            className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-stone-900 disabled:opacity-50 transition-all cursor-pointer"
                                                            value={currentRole?.role || ''}
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    handleAssignBrandRole(activeUser.id, brand.id, e.target.value as BrandRole);
                                                                } else {
                                                                    handleRemoveBrandRole(activeUser.id, brand.id);
                                                                }
                                                            }}
                                                        >
                                                            <option value="">No Access</option>
                                                            <option value="BRAND_ADMIN">BRAND_ADMIN</option>
                                                            <option value="BRAND_FINANCE">BRAND_FINANCE</option>
                                                            <option value="BRAND_WAREHOUSE_ADMIN">WAREHOUSE_ADMIN</option>
                                                            <option value="WAREHOUSE_STAFF">STAFF</option>
                                                            <option value="BRAND_MARKETING">MARKETING</option>
                                                            <option value="CUSTOMER_SUPPORT">SUPPORT</option>
                                                        </select>
                                                        {currentRole && (
                                                            <button
                                                                disabled={isLoading}
                                                                onClick={() => handleRemoveBrandRole(activeUser.id, brand.id)}
                                                                className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition-all disabled:opacity-50 border border-transparent hover:border-rose-100"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-10 py-8 bg-stone-50 border-t border-stone-100 flex justify-end">
                            <button
                                onClick={() => { setIsRoleModalOpen(false); setSelectedUserId(null); }}
                                className="px-8 py-3 bg-stone-900 text-white rounded-2xl font-bold hover:shadow-lg transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
