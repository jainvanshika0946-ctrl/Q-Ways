import React, { useState, useRef } from 'react';
import { useNetworkStore } from '../store/useNetworkStore';
import {
  Package,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Weight,
  Layers,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';
import { BulkOrder, OrderPriority } from '../api/types';
import { Card } from '../components/common/Card';
import { Stat } from '../components/common/Stat';
import { Modal } from '../components/common/Modal';
import { cn } from '../lib/cn';

interface OrderFormState {
  id: string;
  customerName: string;
  location: string;
  lat: string;
  lng: string;
  quantity: string;
  weightKg: string;
  priority: OrderPriority;
  timeWindow: string;
  status: 'Pending' | 'Assigned' | 'In Transit' | 'Delivered';
}

const INITIAL_FORM: OrderFormState = {
  id: '',
  customerName: '',
  location: '',
  lat: '12.9716',
  lng: '77.5946',
  quantity: '1',
  weightKg: '10.0',
  priority: 'Medium',
  timeWindow: '09:00 - 12:00',
  status: 'Pending',
};

const LOCATION_PRESETS = [
  { name: 'Indiranagar 100ft Rd', lat: 12.9716, lng: 77.6412 },
  { name: 'MG Road Trinity', lat: 12.9738, lng: 77.6186 },
  { name: 'Koramangala 4th Block', lat: 12.9352, lng: 77.6245 },
  { name: 'HSR Layout Sector 1', lat: 12.9116, lng: 77.6389 },
  { name: 'Whitefield ITPL Gate', lat: 12.9863, lng: 77.7337 },
  { name: 'Electronic City Toll', lat: 12.8452, lng: 77.6602 },
];

export const BulkOrders: React.FC = () => {
  const { addNode, clearNodes } = useNetworkStore();

  const {
    orders,
    searchQuery,
    priorityFilter,
    setSearchQuery,
    setPriorityFilter,
    addOrder,
    updateOrder,
    deleteOrder,
    clearOrders,
    loadSampleOrders,
    generateOrders,
    importCSV,
    exportCSV,
  } = useOrderStore();

  // Generator State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(true);
  const [genCount, setGenCount] = useState<number>(10);
  const [genArea, setGenArea] = useState<string>('Bengaluru');
  const [genPackageProfile, setGenPackageProfile] = useState<string>('standard');
  const [genPriority, setGenPriority] = useState<'Mixed' | OrderPriority>('Mixed');
  const [genTimeWindow, setGenTimeWindow] = useState<string>('Mixed');

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrderFormState>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute Summary KPIs (Totals for orders, locations, packages and weight)
  const totalOrders = orders.length;
  const uniqueLocations = new Set(orders.map((o) => o.location)).size;
  const totalPackages = orders.reduce((sum, o) => sum + (o.quantity || 0), 0);
  const totalWeightKg = orders.reduce((sum, o) => sum + (o.weightKg || 0), 0);

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || o.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleGenerateOrders = () => {
    let quantityRange: [number, number] = [2, 8];
    let weightRangeKg: [number, number] = [8, 30];

    if (genPackageProfile === 'light') {
      quantityRange = [1, 4];
      weightRangeKg = [2, 12];
    } else if (genPackageProfile === 'heavy') {
      quantityRange = [5, 18];
      weightRangeKg = [25, 70];
    }

    const count = generateOrders({
      orderCount: genCount,
      geographicArea: genArea,
      quantityRange,
      weightRangeKg,
      priority: genPriority,
      timeWindow: genTimeWindow,
    });

    showNotification('success', `Batch generated ${count} delivery orders across ${genArea}.`);
  };

  const handleOpenAddModal = () => {
    setEditingOrderId(null);
    setFormData({
      ...INITIAL_FORM,
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (order: BulkOrder) => {
    setEditingOrderId(order.id);
    setFormData({
      id: order.id,
      customerName: order.customerName,
      location: order.location,
      lat: order.lat.toString(),
      lng: order.lng.toString(),
      quantity: order.quantity.toString(),
      weightKg: order.weightKg.toString(),
      priority: order.priority,
      timeWindow: order.timeWindow,
      status: order.status || 'Pending',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.id.trim()) errors.id = 'Order ID is required';
    if (!formData.customerName.trim()) errors.customerName = 'Customer name is required';
    if (!formData.location.trim()) errors.location = 'Destination location is required';

    const latNum = parseFloat(formData.lat);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.lat = 'Latitude must be between -90 and 90';
    }

    const lngNum = parseFloat(formData.lng);
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.lng = 'Longitude must be between -180 and 180';
    }

    const qtyNum = parseInt(formData.quantity);
    if (isNaN(qtyNum) || qtyNum < 1) {
      errors.quantity = 'Quantity must be at least 1';
    }

    const weightNum = parseFloat(formData.weightKg);
    if (isNaN(weightNum) || weightNum <= 0) {
      errors.weightKg = 'Weight must be greater than 0';
    }

    if (!formData.timeWindow.trim()) {
      errors.timeWindow = 'Delivery time window is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newOrder: BulkOrder = {
      id: formData.id.trim(),
      customerName: formData.customerName.trim(),
      location: formData.location.trim(),
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      quantity: parseInt(formData.quantity),
      weightKg: parseFloat(formData.weightKg),
      priority: formData.priority,
      timeWindow: formData.timeWindow.trim(),
      status: formData.status,
    };

    if (editingOrderId) {
      updateOrder(editingOrderId, newOrder);
      showNotification('success', `Order ${newOrder.id} successfully updated.`);
    } else {
      addOrder(newOrder);
      // ---> NEW LINE: Push the dot to the visual map too! <---
      addNode({ name: newOrder.customerName, lat: newOrder.lat, lng: newOrder.lng, demand: newOrder.weightKg });
      showNotification('success', `Order ${newOrder.id} successfully added.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(`Delete order ${id}?`)) {
      deleteOrder(id);
      showNotification('success', `Order ${id} removed.`);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all orders?')) {
      clearOrders();

      // ---> NEW LINE: Wipe the map clean! <---
      clearNodes();
      
      showNotification('success', 'All orders cleared.');
    }
  };

  const handleExportCSV = () => {
    const csvContent = exportCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bulk_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'CSV export downloaded successfully.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const result = importCSV(text);
        if (result.success) {
          showNotification('success', `Successfully imported ${result.count} orders from CSV.`);
        } else {
          showNotification('error', result.error || 'Failed to parse CSV file.');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Toast Notification */}
      {notification && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded border text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200',
            notification.type === 'success'
              ? 'bg-emerald-500/10 text-traffic-low border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 4 Summary KPI Cards: Totals for Orders, Locations, Packages, Weight */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Stat
          label="Total Orders"
          value={totalOrders}
          unit="manifests"
          icon={<Package className="w-4 h-4 text-accent" />}
          description="Registered dispatch jobs"
        />
        <Stat
          label="Total Locations"
          value={uniqueLocations}
          unit="hubs"
          icon={<MapPin className="w-4 h-4 text-emerald-500" />}
          description="Unique delivery drop points"
        />
        <Stat
          label="Total Packages"
          value={totalPackages}
          unit="units"
          icon={<Layers className="w-4 h-4 text-amber-500" />}
          description="Consolidated parcel volume"
        />
        <Stat
          label="Total Weight"
          value={totalWeightKg.toFixed(1)}
          unit="kg"
          icon={<Weight className="w-4 h-4 text-blue-500" />}
          description="Aggregated fleet payload"
        />
      </div>

      {/* Bulk Order Generator Card */}
      <Card
        title="Bulk Order Generator"
        subtitle="Batch synthesize enterprise delivery demand by configuring scale, geography, payload profiles, and delivery windows"
        action={
          <button
            type="button"
            onClick={() => setIsGeneratorOpen(!isGeneratorOpen)}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-bg-subtle transition-colors flex items-center gap-1 text-[11px]"
          >
            <span>{isGeneratorOpen ? 'Hide Generator' : 'Show Generator'}</span>
            {isGeneratorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        }
      >
        {isGeneratorOpen && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* 1. Number of Orders */}
              <div>
                <label className="text-[11px] font-medium text-text-primary block mb-1">
                  Number of Orders
                </label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value))}
                  className="w-full text-xs font-mono bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value={5}>5 Orders</option>
                  <option value={10}>10 Orders</option>
                  <option value={15}>15 Orders</option>
                  <option value={20}>20 Orders</option>
                  <option value={30}>30 Orders</option>
                  <option value={50}>50 Orders</option>
                </select>
              </div>

              {/* 2. Geographic Area */}
              <div>
                <label className="text-[11px] font-medium text-text-primary block mb-1">
                  Geographic Area
                </label>
                <select
                  value={genArea}
                  onChange={(e) => setGenArea(e.target.value)}
                  className="w-full text-xs bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="Bengaluru">Bengaluru Metropolitan</option>
                  <option value="Mumbai">Mumbai MMR Network</option>
                  <option value="Delhi">Delhi NCR Corridor</option>
                  <option value="Hyderabad">Hyderabad Cyberabad</option>
                  <option value="Bhopal">Bhopal Urban Grid</option>
                </select>
              </div>

              {/* 3. Package Quantity / Weight */}
              <div>
                <label className="text-[11px] font-medium text-text-primary block mb-1">
                  Package Qty / Weight
                </label>
                <select
                  value={genPackageProfile}
                  onChange={(e) => setGenPackageProfile(e.target.value)}
                  className="w-full text-xs bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="light">Light (1-4 units, 2-12 kg)</option>
                  <option value="standard">Standard (2-8 units, 8-30 kg)</option>
                  <option value="heavy">Heavy (5-18 units, 25-70 kg)</option>
                </select>
              </div>

              {/* 4. Priority */}
              <div>
                <label className="text-[11px] font-medium text-text-primary block mb-1">
                  Priority
                </label>
                <select
                  value={genPriority}
                  onChange={(e) => setGenPriority(e.target.value as any)}
                  className="w-full text-xs bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="Mixed">Mixed (Realistic SLA)</option>
                  <option value="High">High (Express Rush)</option>
                  <option value="Medium">Medium (Standard Delivery)</option>
                  <option value="Low">Low (Off-Peak Flexible)</option>
                </select>
              </div>

              {/* 5. Optional Time Window */}
              <div>
                <label className="text-[11px] font-medium text-text-primary block mb-1">
                  Optional Time Window
                </label>
                <select
                  value={genTimeWindow}
                  onChange={(e) => setGenTimeWindow(e.target.value)}
                  className="w-full text-xs font-mono bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="Mixed">Mixed Windows</option>
                  <option value="09:00 - 13:00">Morning (09:00 - 13:00)</option>
                  <option value="13:00 - 18:00">Afternoon (13:00 - 18:00)</option>
                  <option value="09:00 - 18:00">Full Day (09:00 - 18:00)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <span className="text-[11px] text-text-muted">
                Synthesizes realistic logistics orders anchored on real metropolitan road intersections.
              </span>
              <button
                type="button"
                onClick={handleGenerateOrders}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-subtle"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Orders</span>
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Main Table Card */}
      <Card
        title="Delivery Orders Table"
        subtitle="Manage dispatch jobs, coordinates, payload weights, delivery windows, and priority tiers"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-subtle"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Order</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border-default hover:bg-bg-subtle text-text-primary text-xs font-medium transition-colors"
              title="Upload CSV File"
            >
              <Upload className="w-3.5 h-3.5 text-text-secondary" />
              <span>Import CSV</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={handleExportCSV}
              disabled={orders.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border-default hover:bg-bg-subtle text-text-primary text-xs font-medium transition-colors disabled:opacity-40"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-text-secondary" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={loadSampleOrders}
              className="p-1.5 rounded border border-border-default hover:bg-bg-subtle text-text-secondary hover:text-text-primary transition-colors"
              title="Reload Sample Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleClearAll}
              disabled={orders.length === 0}
              className="p-1.5 rounded border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-40"
              title="Clear Orders"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        <div className="space-y-3.5">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search order ID, customer, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 bg-bg-surface border border-border-default rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent text-xs"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-text-secondary text-[11px] font-medium">Priority:</span>
              {(['All', 'High', 'Medium', 'Low'] as (OrderPriority | 'All')[]).map((pri) => (
                <button
                  key={pri}
                  onClick={() => setPriorityFilter(pri)}
                  className={cn(
                    'px-2 py-1 rounded text-[11px] font-medium border transition-colors',
                    priorityFilter === pri
                      ? 'bg-accent-subtle text-accent-text border-accent/40 font-semibold'
                      : 'border-border-default bg-bg-surface hover:bg-bg-subtle text-text-secondary'
                  )}
                >
                  {pri}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table: Order ID, Customer, Location, Latitude, Longitude, Quantity, Weight, Priority, Time Window */}
          <div className="border border-border-subtle rounded-md overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-bg-subtle/80 border-b border-border-subtle text-text-secondary font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Latitude</th>
                  <th className="py-2.5 px-3">Longitude</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Weight</th>
                  <th className="py-2.5 px-3 text-center">Priority</th>
                  <th className="py-2.5 px-3">Time Window</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle font-mono text-[11px]">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-bg-subtle/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-text-primary">
                        <span className="bg-bg-subtle border border-border-subtle px-1.5 py-0.5 rounded">
                          {order.id}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-sans font-medium text-text-primary">
                        {order.customerName}
                      </td>

                      <td className="py-2.5 px-3 font-sans text-text-secondary">
                        <div className="flex items-center gap-1 truncate max-w-[200px]" title={order.location}>
                          <MapPin className="w-3 h-3 text-accent shrink-0" />
                          <span className="truncate">{order.location}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-text-secondary">
                        {order.lat.toFixed(4)}°
                      </td>

                      <td className="py-2.5 px-3 text-text-secondary">
                        {order.lng.toFixed(4)}°
                      </td>

                      <td className="py-2.5 px-3 text-center font-semibold text-text-primary">
                        {order.quantity}
                      </td>

                      <td className="py-2.5 px-3 text-right font-medium text-text-primary">
                        {order.weightKg.toFixed(1)} kg
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded font-sans text-[10px] font-semibold border',
                            order.priority === 'High' && 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                            order.priority === 'Medium' && 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                            order.priority === 'Low' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          )}
                        >
                          {order.priority}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-text-secondary">
                        <span className="inline-flex items-center gap-1 font-sans text-[11px]">
                          <Clock className="w-3 h-3 text-text-muted" />
                          <span className="font-mono">{order.timeWindow}</span>
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(order)}
                            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
                            title="Edit Order"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-1 rounded text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-text-muted font-sans">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30 text-text-secondary" />
                      <p className="text-xs font-medium">No bulk orders found matching your criteria.</p>
                      <p className="text-[11px] mt-1">Use the Batch Order Generator above or click &quot;Add Order&quot; to populate.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Add / Edit Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrderId ? `Edit Order (${formData.id})` : 'Register New Delivery Order'}
        subtitle="Specify dispatch coordinates, parcel load parameters, priority, and required delivery window"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Order ID */}
            <div>
              <label className="text-[11px] font-medium text-text-primary block mb-1">
                Order ID *
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className={cn(
                  'w-full text-xs font-mono bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors',
                  formErrors.id ? 'border-rose-500' : 'border-border-default focus:border-accent'
                )}
                placeholder="ORD-8051"
              />
              {formErrors.id && <p className="text-[10px] text-rose-500 mt-0.5">{formErrors.id}</p>}
            </div>

            {/* Customer Name */}
            <div>
              <label className="text-[11px] font-medium text-text-primary block mb-1">
                Customer Name / Enterprise *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={cn(
                  'w-full text-xs bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors',
                  formErrors.customerName ? 'border-rose-500' : 'border-border-default focus:border-accent'
                )}
                placeholder="Reliance Logistics / Flipkart Hub"
              />
              {formErrors.customerName && (
                <p className="text-[10px] text-rose-500 mt-0.5">{formErrors.customerName}</p>
              )}
            </div>
          </div>

          {/* Destination / Location & Preset Picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-text-primary">
                Destination / Drop Location *
              </label>
              <span className="text-[10px] text-text-muted">Or pick standard junction:</span>
            </div>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className={cn(
                'w-full text-xs bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors mb-1.5',
                formErrors.location ? 'border-rose-500' : 'border-border-default focus:border-accent'
              )}
              placeholder="e.g. Indiranagar 100ft Road"
            />
            {formErrors.location && <p className="text-[10px] text-rose-500 mb-1">{formErrors.location}</p>}

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1">
              {LOCATION_PRESETS.map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      location: loc.name,
                      lat: loc.lat.toFixed(4),
                      lng: loc.lng.toFixed(4),
                    })
                  }
                  className="px-2 py-0.5 text-[10px] rounded border border-border-default bg-bg-subtle hover:bg-bg-subtle/80 text-text-secondary transition-colors"
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-medium text-text-primary block mb-1">
                Latitude (-90 to 90) *
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                className={cn(
                  'w-full text-xs font-mono bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors',
                  formErrors.lat ? 'border-rose-500' : 'border-border-default focus:border-accent'
                )}
                placeholder="12.9716"
              />
              {formErrors.lat && <p className="text-[10px] text-rose-500 mt-0.5">{formErrors.lat}</p>}
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-primary block mb-1">
                Longitude (-180 to 180) *
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                className={cn(
                  'w-full text-xs font-mono bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors',
                  formErrors.lng ? 'border-rose-500' : 'border-border-default focus:border-accent'
                )}
                placeholder="77.5946"
              />
              {formErrors.lng && <p className="text-[10px] text-rose-500 mt-0.5">{formErrors.lng}</p>}
            </div>
          </div>

          {/* Quantity & Weight */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-medium text-text-primary block mb-1">
                Package Quantity (Units) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className={cn(
                  'w-full text-xs font-mono bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors',
                  formErrors.quantity ? 'border-rose-500' : 'border-border-default focus:border-accent'
                )}
                placeholder="4"
              />
              {formErrors.quantity && (
                <p className="text-[10px] text-rose-500 mt-0.5">{formErrors.quantity}</p>
              )}
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-primary block mb-1">
                Package Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                className={cn(
                  'w-full text-xs font-mono bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors',
                  formErrors.weightKg ? 'border-rose-500' : 'border-border-default focus:border-accent'
                )}
                placeholder="25.0"
              />
              {formErrors.weightKg && (
                <p className="text-[10px] text-rose-500 mt-0.5">{formErrors.weightKg}</p>
              )}
            </div>
          </div>

          {/* Priority & Delivery Time Window */}
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-medium text-text-primary block mb-1">
                Priority Tier *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as OrderPriority })}
                className="w-full text-xs bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
              >
                <option value="High">High (Immediate / SLA Express)</option>
                <option value="Medium">Medium (Standard Dispatch)</option>
                <option value="Low">Low (Flexible Off-Peak)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-text-primary block mb-1">
                Delivery Time Window *
              </label>
              <input
                type="text"
                value={formData.timeWindow}
                onChange={(e) => setFormData({ ...formData, timeWindow: e.target.value })}
                className={cn(
                  'w-full text-xs font-mono bg-bg-surface border rounded px-2.5 py-1.5 text-text-primary focus:outline-none transition-colors',
                  formErrors.timeWindow ? 'border-rose-500' : 'border-border-default focus:border-accent'
                )}
                placeholder="09:00 - 12:00"
              />
              {formErrors.timeWindow && (
                <p className="text-[10px] text-rose-500 mt-0.5">{formErrors.timeWindow}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-[11px] font-medium text-text-primary block mb-1">
              Dispatch Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full text-xs bg-bg-surface border border-border-default rounded px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-colors"
            >
              <option value="Pending">Pending (Awaiting Allocation)</option>
              <option value="Assigned">Assigned (Assigned to Vehicle)</option>
              <option value="In Transit">In Transit (Active on Route)</option>
              <option value="Delivered">Delivered (Completed)</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded border border-border-default hover:bg-bg-subtle text-text-secondary text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-accent hover:bg-accent-hover text-white text-xs font-medium transition-colors shadow-subtle"
            >
              {editingOrderId ? 'Update Order' : 'Add Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
