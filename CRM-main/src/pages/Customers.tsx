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
          const headers = results.meta.fields || [];
          let hasDirectName = headers.some(h => h.toLowerCase() === 'name');
          let hasDirectEmail = headers.some(h => h.toLowerCase() === 'email');
          
          let mapping: Record<string, string | null> = {};
          
          if (!hasDirectName || !hasDirectEmail) {
            showToast('Mapping columns with AI...');
            const { mapping: aiMapping } = await customersApi.mapColumns(headers);
            mapping = aiMapping;
            
            const mappedValues = Object.values(mapping);
            if (!mappedValues.includes('name') || !mappedValues.includes('email')) {
              showToast(`Couldn't find name/email columns in your CSV. Found: ${headers.join(', ')}. Please ensure your CSV includes a name and email column.`, 'error');
              setImporting(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
              return;
            }
          }

          const customers = (results.data as any[]).map(row => {
            const mappedRow: any = {};
            
            if (Object.keys(mapping).length > 0) {
              for (const [csvHeader, dbField] of Object.entries(mapping)) {
                if (dbField) mappedRow[dbField] = row[csvHeader];
              }
            } else {
              mappedRow.name = row.name || row.Name;
              mappedRow.email = row.email || row.Email;
              mappedRow.phone = row.phone || row.Phone;
              mappedRow.city = row.city || row.City;
              mappedRow.total_orders = row.total_orders;
              mappedRow.total_spend = row.total_spend;
              mappedRow.last_order_date = row.last_order_date;
              mappedRow.tags = row.tags;
            }

            return {
              name: mappedRow.name,
              email: mappedRow.email,
              phone: mappedRow.phone || null,
              city: mappedRow.city || null,
              total_orders: parseInt(mappedRow.total_orders) || 0,
              total_spend: parseFloat(mappedRow.total_spend) || 0,
              last_order_date: mappedRow.last_order_date || null,
              tags: typeof mappedRow.tags === 'string' ? mappedRow.tags.split(',').map((t: string) => t.trim()) : [],
            };
          });

          const CHUNK_SIZE = 1000;
          let totalImported = 0;
          
          for (let i = 0; i < customers.length; i += CHUNK_SIZE) {
            const batch = customers.slice(i, i + CHUNK_SIZE);
            await customersApi.bulkCreate(batch);
            totalImported += batch.length;
          }

          showToast(`Imported ${totalImported} customers`);
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
        <h1 className="text-2xl font-bold text-[#1F1E1D] tracking-tight">Customers</h1>
        <label className="flex items-center gap-2 px-6 py-2.5 bg-[#C96442] text-white rounded-xl cursor-pointer hover:bg-[#B85638] hover:shadow-lg hover:shadow-[#C96442]/20 transition-all duration-300 font-medium">
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
      <div className="bg-white border border-[#E8E6DE] rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="customer-search" className="sr-only">Search customers</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B6B6B]" />
              <input
                id="customer-search"
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl pl-10 pr-4 py-2.5 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all"
              />
            </div>
          </div>
          <label htmlFor="filter-city" className="sr-only">Filter by city</label>
          <select
            id="filter-city"
            value={filterCity}
            onChange={e => setFilterCity(e.target.value)}
            className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-2.5 text-[#1F1E1D] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] transition-all appearance-none"
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
            className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl px-4 py-2.5 text-[#1F1E1D] placeholder-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#C96442] focus:border-[#C96442] w-32 transition-all"
          />
        </div>
      </div>

      {/* Results */}
      <div className="bg-white border border-[#E8E6DE] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E8E6DE] flex items-center justify-between">
          <p className="text-[#6B6B6B] text-sm">{totalCustomers} customers found</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C96442]" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-[#6B6B6B]">
            No customers found. Import a CSV or adjust your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FAF9F5]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Customer</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">City</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Total Spend</th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Orders</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-[#6B6B6B] uppercase tracking-widest">Tags</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6DE]/60">
                {customers.map(customer => (
                  <tr
                    key={customer.id}
                    className="hover:bg-[#FAF9F5] transition-colors cursor-pointer group"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#C96442]/10 flex items-center justify-center text-[#C96442] font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-[#1F1E1D] font-medium group-hover:text-[#C96442] transition-colors">{customer.name}</p>
                          <p className="text-[#6B6B6B] text-sm">{customer.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-[#6B6B6B]">
                        <MapPin className="w-4 h-4 text-[#6B6B6B]" />
                        {customer.city || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-[#1F1E1D] font-medium">{formatCurrency(customer.total_spend)}</p>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-[#6B6B6B]">{customer.total_orders}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {(customer.tags || []).slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2.5 py-0.5 text-xs bg-[#FAF9F5] border border-[#E8E6DE] text-[#6B6B6B] rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button className="text-[#6B6B6B] hover:text-[#1F1E1D] transition-colors" aria-label={`More options for ${customer.name}`}>
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
          <div className="px-6 py-4 border-t border-[#E8E6DE] flex items-center justify-between bg-[#FAF9F5]">
            <p className="text-sm text-[#6B6B6B]">
              Page <span className="text-[#1F1E1D] font-medium">{page + 1}</span> of <span className="text-[#1F1E1D] font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-[#E8E6DE] text-[#1F1E1D] hover:bg-[#FAF9F5] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-[#E8E6DE] text-[#1F1E1D] hover:bg-[#FAF9F5] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
    <div className="fixed inset-0 bg-[#1F1E1D]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Customer details" onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl border border-[#E8E6DE]">
        <div className="flex items-center justify-between p-6 border-b border-[#E8E6DE]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#C96442]/10 flex items-center justify-center text-[#C96442] text-2xl font-bold">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1F1E1D] tracking-tight">{customer.name}</h2>
              <p className="text-[#6B6B6B]">{customer.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#1F1E1D] transition-colors" aria-label="Close customer details">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl p-4">
              <p className="text-[#6B6B6B] text-sm tracking-tight mb-1">Total Spend</p>
              <p className="text-2xl font-bold text-[#1F1E1D]">{formatCurrency(customer.total_spend)}</p>
            </div>
            <div className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl p-4">
              <p className="text-[#6B6B6B] text-sm tracking-tight mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-[#1F1E1D]">{customer.total_orders}</p>
            </div>
            <div className="bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl p-4">
              <p className="text-[#6B6B6B] text-sm tracking-tight mb-1">Last Order</p>
              <p className="text-2xl font-bold text-[#1F1E1D]">
                {customer.last_order_date
                  ? new Date(customer.last_order_date).toLocaleDateString()
                  : '-'}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-bold text-[#1F1E1D] mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {(customer.tags || []).map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-[#FAF9F5] border border-[#E8E6DE] text-[#6B6B6B] rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
              {(!customer.tags || customer.tags.length === 0) && (
                <span className="text-[#6B6B6B] italic">No tags</span>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#1F1E1D] mb-4">Order History</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C96442]" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-[#6B6B6B] text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between bg-[#FAF9F5] border border-[#E8E6DE] rounded-xl p-4 hover:bg-[#F5F3ED] transition-all"
                  >
                    <div>
                      <p className="text-[#1F1E1D] font-medium">{order.product_name}</p>
                      <p className="text-[#6B6B6B] text-sm">{order.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#1F1E1D] font-medium">{formatCurrency(order.amount)}</p>
                      <p className="text-[#6B6B6B] text-sm">
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
