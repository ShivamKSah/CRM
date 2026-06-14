import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Upload, X, MapPin, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import Papa from 'papaparse';
import { customersApi, ordersApi } from '../utils/api';
import { useToast } from '../utils/ToastContext';
import type { Customer, Order } from '../types';

const PAGE_SIZE = 20;

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterMinSpend, setFilterMinSpend] = useState('');
  const [page, setPage] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      loadCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterCity, filterMinSpend]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      };
      if (search) params.search = search;
      if (filterCity) params.city = filterCity;
      if (filterMinSpend) params.min_spend = filterMinSpend;

      const result = await customersApi.list(Object.keys(params).length > 0 ? params : undefined);
      setCustomers(result.customers || []);
      setTotalCustomers(result.total || 0);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const customers = (results.data as any[]).map(row => ({
            name: row.name || row.Name,
            email: row.email || row.Email,
            phone: row.phone || row.Phone || null,
            city: row.city || row.City || null,
            total_orders: parseInt(row.total_orders) || 0,
            total_spend: parseFloat(row.total_spend) || 0,
            last_order_date: row.last_order_date || null,
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
          }));

          await customersApi.bulkCreate(customers);
          showToast(`Imported ${customers.length} customers`);
          loadCustomers();
        } catch (err) {
          showToast('Failed to import customers', 'error');
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: () => {
        showToast('Failed to parse CSV file', 'error');
        setImporting(false);
      },
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalPages = Math.max(1, Math.ceil(totalCustomers / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customers</h1>
        <label className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl cursor-pointer hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300">
          <Upload className="w-4 h-4" />
          Import CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            disabled={importing}
          />
        </label>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="customer-search" className="sr-only">Search customers</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="customer-search"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          <label htmlFor="filter-city" className="sr-only">Filter by city</label>
          <select
            id="filter-city"
            value={filterCity}
            onChange={e => setFilterCity(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none"
          >
            <option value="">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Chennai">Chennai</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Pune">Pune</option>
          </select>
          <label htmlFor="filter-min-spend" className="sr-only">Minimum spend</label>
          <input
            id="filter-min-spend"
            type="number"
            value={filterMinSpend}
            onChange={e => setFilterMinSpend(e.target.value)}
            placeholder="Min Spend"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-32 transition-all"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <p className="text-slate-500 text-sm">{totalCustomers} customers found</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            No customers found. Import a CSV or adjust your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Customer</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">City</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Spend</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Orders</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Tags</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(customer => (
                  <tr
                    key={customer.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-slate-900 font-medium group-hover:text-indigo-600 transition-colors">{customer.name}</p>
                          <p className="text-slate-500 text-sm">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {customer.city || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-slate-900 font-medium">{formatCurrency(customer.total_spend)}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-slate-600">{customer.total_orders}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(customer.tags || []).slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 text-xs bg-slate-100 border border-slate-200 text-slate-600 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button className="text-slate-400 hover:text-slate-600 transition-colors" aria-label={`More options for ${customer.name}`}>
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCustomers > PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <p className="text-sm text-slate-500">
              Page <span className="text-slate-900 font-medium">{page + 1}</span> of <span className="text-slate-900 font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

function CustomerDetailModal({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [customer.id]);

  const loadOrders = async () => {
    try {
      const result = await ordersApi.list({ customer_id: customer.id });
      setOrders(result.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Customer details" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{customer.name}</h2>
              <p className="text-slate-500">{customer.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors" aria-label="Close customer details">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-slate-500 text-sm tracking-tight mb-1">Total Spend</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(customer.total_spend)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-slate-500 text-sm tracking-tight mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900">{customer.total_orders}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-slate-500 text-sm tracking-tight mb-1">Last Order</p>
              <p className="text-2xl font-bold text-slate-900">
                {customer.last_order_date
                  ? new Date(customer.last_order_date).toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {(customer.tags || []).map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
              {(!customer.tags || customer.tags.length === 0) && (
                <span className="text-slate-500 italic">No tags</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Order History</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-4 hover:bg-slate-100 transition-all"
                  >
                    <div>
                      <p className="text-slate-900 font-medium">{order.product_name}</p>
                      <p className="text-slate-500 text-sm">{order.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-900 font-medium">{formatCurrency(order.amount)}</p>
                      <p className="text-slate-500 text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
