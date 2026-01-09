
import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface OrderFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    isSubmitting: boolean;
    totalAmount: number;
}

export default function OrderFormModal({ isOpen, onClose, onSubmit, isSubmitting, totalAmount }: OrderFormModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        note: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-stone-900">Finish Your Order</h3>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
                        <X className="w-5 h-5 text-stone-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                            <span className="text-sm text-amber-800 block">Total Payment Required</span>
                            <span className="text-2xl font-bold text-amber-900">Rp {totalAmount.toLocaleString()}</span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Full Name</label>
                            <input
                                required
                                type="text"
                                className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">WhatsApp</label>
                                <input
                                    required
                                    type="tel"
                                    className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="0812..."
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Shipping Address (Optional)</label>
                            <textarea
                                className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                rows={3}
                                placeholder="Street, City, Zip Code..."
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">Additional Notes (Optional)</label>
                            <textarea
                                className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                rows={2}
                                placeholder="Specific size requests, etc..."
                                value={formData.note}
                                onChange={e => setFormData({ ...formData, note: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t border-stone-100 bg-stone-50">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                                </>
                            ) : (
                                "Place Order"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
