'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { updateCartQuantity, removeFromCart } from '../marketplace/actions';
import { useState } from 'react';

export function CartItemControls({ itemId, quantity: initialQuantity }: { itemId: string, quantity: number }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [qty, setQty] = useState(initialQuantity);

  const handleUpdate = async (newQty: number) => {
    if (isUpdating) return;
    setIsUpdating(true);
    setQty(newQty); // optimistic
    await updateCartQuantity(itemId, newQty);
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    await removeFromCart(itemId);
    setIsUpdating(false);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border border-slate-200 rounded-lg">
        <button 
          onClick={() => handleUpdate(qty - 1)}
          disabled={isUpdating || qty <= 1}
          className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-50"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center text-sm font-medium">{qty}</span>
        <button 
          onClick={() => handleUpdate(qty + 1)}
          disabled={isUpdating}
          className="p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <button 
        onClick={handleRemove}
        disabled={isUpdating}
        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
        title="Hapus"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}
