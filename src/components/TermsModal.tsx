
import { X } from 'lucide-react';
import { useState } from 'react';

interface TermsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
}

export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
    const [isChecked, setIsChecked] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-stone-900">Terms & Conditions</h3>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
                        <X className="w-5 h-5 text-stone-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 text-sm text-stone-600 leading-relaxed">
                    <p>Before proceeding with your order, please read and agree to the following terms:</p>

                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Down Payment (DP):</strong> A minimum DP of 50% is required to start production.</li>
                        <li><strong>Production Time:</strong> Production estimates vary by product type and current queue.</li>
                        <li><strong>Revisions:</strong> Revisions are only allowed during the pre-production (design proofing) stage.</li>
                        <li><strong>Design Responsibility:</strong> Achiera is not responsible for low-resolution or incorrect designs uploaded by the user.</li>
                        <li><strong>Refunds:</strong> Refunds are subject to company policy and are generally not available once production has started.</li>
                    </ul>

                    <p>By continuing, you agree to all the terms mentioned above.</p>
                </div>

                <div className="p-4 border-t border-stone-100 bg-stone-50">
                    <label className="flex items-center gap-3 cursor-pointer mb-4 p-2 rounded-lg hover:bg-stone-100/50">
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            className="w-5 h-5 rounded border-stone-300 text-amber-600 focus:ring-amber-500 transition-all"
                        />
                        <span className="text-sm font-medium text-stone-800">I agree to the Terms & Conditions</span>
                    </label>

                    <button
                        onClick={onAccept}
                        disabled={!isChecked}
                        className={`w-full py-3 rounded-xl font-bold transition-all ${isChecked ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                    >
                        Continue to Order
                    </button>
                </div>
            </div>
        </div>
    );
}
