import { useState, useEffect } from 'react';
import { getInventory } from '../api/inventoryService';
import { Package, AlertTriangle, ArrowRight } from 'lucide-react';

const ReorderList = () => {
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    setInventory(getInventory());
  }, []);

  const reorderItems = inventory
    .filter(item => item.quantity < (item.stableQuantity || 0))
    .map(item => ({
      ...item,
      needed: (item.stableQuantity || 0) - item.quantity
    }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        
        {/* Reorder List - Desktop Table */}
        <div className="hidden md:block bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-6">Item Name</th>
                <th className="p-6">Current Stock</th>
                <th className="p-6">Stable Level</th>
                <th className="p-6">Quantity to Add</th>
                <th className="p-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reorderItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Package size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-medium">All inventory levels are stable. No reordering needed.</p>
                  </td>
                </tr>
              ) : (
                reorderItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                          <Package size={20} />
                        </div>
                        <span className="font-bold text-dark">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-bold text-red-500">{item.quantity} {item.unit}</span>
                    </td>
                    <td className="p-6">
                      <span className="text-gray-500 font-medium">{item.stableQuantity} {item.unit}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-primary font-bold">
                        <ArrowRight size={16} />
                        <span>+{item.needed} {item.unit}</span>
                      </div>
                    </td>
                    <td className="p-6 text-right">
                      <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-100">
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Reorder List - Mobile Cards */}
        <div className="md:hidden space-y-4">
          {reorderItems.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
              <Package size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-medium">All levels stable.</p>
            </div>
          ) : (
            reorderItems.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-dark">{item.name}</h3>
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[8px] font-bold uppercase tracking-widest border border-red-100">
                      Low Stock
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Current</p>
                    <span className="text-lg font-bold text-red-500">{item.quantity} {item.unit}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stable</p>
                    <span className="text-lg font-bold text-gray-500">{item.stableQuantity} {item.unit}</span>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Quantity to Add</span>
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <ArrowRight size={16} />
                    <span className="text-lg">+{item.needed} {item.unit}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {reorderItems.length > 0 && (
          <div className="mt-6 bg-primary/5 border border-primary/10 p-6 rounded-2xl flex items-start gap-4">
            <AlertTriangle className="text-primary shrink-0" size={24} />
            <div>
              <h4 className="text-primary font-bold text-sm">Restock Required</h4>
              <p className="text-primary/80 text-xs mt-1">
                There are {reorderItems.length} items currently below their stable quantity levels. Please coordinate with suppliers to replenish stock.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReorderList;
