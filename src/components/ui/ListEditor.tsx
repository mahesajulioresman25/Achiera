import React from 'react';
import { Plus, X, GripVertical } from 'lucide-react';

interface ListEditorProps {
    label: string;
    items: any[];
    onChange: (items: any[]) => void;
    renderItem: (item: any, index: number, onChange: (val: any) => void) => React.ReactNode;
    getNewItem: () => any;
}

export default function ListEditor({ label, items = [], onChange, renderItem, getNewItem }: ListEditorProps) {
    const handleAdd = () => {
        onChange([...items, getNewItem()]);
    };

    const handleRemove = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        onChange(newItems);
    };

    const handleItemChange = (index: number, value: any) => {
        const newItems = [...items];
        newItems[index] = value;
        onChange(newItems);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase text-gray-500">{label}</label>
                <button
                    type="button"
                    onClick={handleAdd}
                    className="text-xs flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-bold hover:bg-emerald-100 transition-colors"
                >
                    <Plus className="w-3 h-3" />
                    Add Item
                </button>
            </div>

            <div className="space-y-3">
                {items.length === 0 && (
                    <div className="text-sm text-gray-400 italic bg-gray-50 p-4 rounded-xl text-center">
                        No items yet. Click "Add Item" to start.
                    </div>
                )}

                {items.map((item, index) => (
                    <div key={index} className="group relative flex gap-3 items-start bg-gray-50 p-4 rounded-xl border border-transparent hover:border-gray-200 transition-all">
                        <div className="mt-2 text-gray-300 cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4" />
                        </div>

                        <div className="flex-1">
                            {renderItem(item, index, (val) => handleItemChange(index, val))}
                        </div>

                        <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            className="bg-white text-gray-400 p-1.5 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
