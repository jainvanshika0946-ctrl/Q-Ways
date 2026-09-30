import { create } from 'zustand';
import { BulkOrder, OrderPriority, BulkOrderGeneratorParams } from '../api/types';

interface OrderStoreState {
  orders: BulkOrder[];
  searchQuery: string;
  priorityFilter: OrderPriority | 'All';
  
  // Actions
  setSearchQuery: (query: string) => void;
  setPriorityFilter: (filter: OrderPriority | 'All') => void;
  addOrder: (order: BulkOrder) => void;
  updateOrder: (id: string, updates: Partial<BulkOrder>) => void;
  deleteOrder: (id: string) => void;
  clearOrders: () => void;
  loadSampleOrders: () => void;
  generateOrders: (params: BulkOrderGeneratorParams) => number;
  importCSV: (csvText: string) => { success: boolean; count: number; error?: string };
  exportCSV: () => string;
}

const SAMPLE_ORDERS: BulkOrder[] = [
  {
    id: 'ORD-8041',
    customerName: 'Reliance Fresh Hypermarket',
    location: 'Indiranagar 100ft Road',
    lat: 12.9716,
    lng: 77.6412,
    quantity: 6,
    weightKg: 38.5,
    priority: 'High',
    timeWindow: '09:00 - 11:30',
    status: 'In Transit',
  },
  {
    id: 'ORD-8042',
    customerName: 'Flipkart Logistics Hub',
    location: 'MG Road Trinity Circle',
    lat: 12.9738,
    lng: 77.6186,
    quantity: 8,
    weightKg: 46.2,
    priority: 'High',
    timeWindow: '09:30 - 12:00',
    status: 'Pending',
  },
  {
    id: 'ORD-8043',
    customerName: 'FabIndia Lifestyle Flagship',
    location: 'Koramangala 4th Block',
    lat: 12.9352,
    lng: 77.6245,
    quantity: 3,
    weightKg: 14.8,
    priority: 'Medium',
    timeWindow: '10:00 - 13:00',
    status: 'Pending',
  },
  {
    id: 'ORD-8044',
    customerName: 'Swiggy Instamart Pod #12',
    location: 'Domlur Flyover Junction',
    lat: 12.9609,
    lng: 77.6387,
    quantity: 5,
    weightKg: 24.0,
    priority: 'High',
    timeWindow: '09:00 - 10:45',
    status: 'In Transit',
  },
  {
    id: 'ORD-8045',
    customerName: 'Croma Megastore Electronics',
    location: 'HSR Layout Sector 1',
    lat: 12.9116,
    lng: 77.6389,
    quantity: 11,
    weightKg: 62.4,
    priority: 'Medium',
    timeWindow: '11:00 - 14:00',
    status: 'Pending',
  },
  {
    id: 'ORD-8046',
    customerName: 'Apollo Hospital Dispensary',
    location: 'BTM Layout Water Tank',
    lat: 12.9166,
    lng: 77.6101,
    quantity: 4,
    weightKg: 18.0,
    priority: 'High',
    timeWindow: '10:30 - 12:30',
    status: 'Pending',
  },
  {
    id: 'ORD-8047',
    customerName: 'Lenskart Experience Hub',
    location: 'Jayanagar 4th Block Cross',
    lat: 12.9299,
    lng: 77.5824,
    quantity: 2,
    weightKg: 7.5,
    priority: 'Low',
    timeWindow: '13:00 - 16:00',
    status: 'Pending',
  },
  {
    id: 'ORD-8048',
    customerName: 'Tata CliQ Regional Depot',
    location: 'Electronic City Toll Plaza',
    lat: 12.8452,
    lng: 77.6602,
    quantity: 9,
    weightKg: 58.2,
    priority: 'Medium',
    timeWindow: '12:00 - 15:30',
    status: 'Pending',
  },
  {
    id: 'ORD-8049',
    customerName: 'Zepto Dark Store #7',
    location: 'Bellandur Central Hub',
    lat: 12.9304,
    lng: 77.6784,
    quantity: 14,
    weightKg: 42.1,
    priority: 'High',
    timeWindow: '08:30 - 10:30',
    status: 'In Transit',
  },
  {
    id: 'ORD-8050',
    customerName: 'Decathlon Sports Distribution',
    location: 'Whitefield ITPL Main Gate',
    lat: 12.9863,
    lng: 77.7337,
    quantity: 5,
    weightKg: 49.0,
    priority: 'Low',
    timeWindow: '14:00 - 18:00',
    status: 'Pending',
  },
];

const CITY_JUNCTIONS_MAP: Record<string, { name: string; lat: number; lng: number }[]> = {
  Bengaluru: [
    { name: 'Koramangala 4th Block Depot', lat: 12.9352, lng: 77.6245 },
    { name: 'Indiranagar 100ft Road', lat: 12.9716, lng: 77.6412 },
    { name: 'MG Road Trinity Circle', lat: 12.9738, lng: 77.6186 },
    { name: 'Domlur Flyover Junction', lat: 12.9609, lng: 77.6387 },
    { name: 'HSR Layout Sector 1', lat: 12.9116, lng: 77.6389 },
    { name: 'BTM Layout Water Tank', lat: 12.9166, lng: 77.6101 },
    { name: 'Jayanagar 4th Block Cross', lat: 12.9299, lng: 77.5824 },
    { name: 'Richmond Circle Flyover', lat: 12.9667, lng: 77.5992 },
    { name: 'Shivajinagar Bus Terminus', lat: 12.9866, lng: 77.6033 },
    { name: 'Ulsoor Lake Promenade', lat: 12.9822, lng: 77.6244 },
    { name: 'Electronic City Toll Plaza', lat: 12.8452, lng: 77.6602 },
    { name: 'Bellandur Central Hub', lat: 12.9304, lng: 77.6784 },
    { name: 'Marathahalli Multiplex Junc', lat: 12.9553, lng: 77.7011 },
    { name: 'Whitefield ITPL Main Gate', lat: 12.9863, lng: 77.7337 },
    { name: 'Hebbal Interchange Lake', lat: 13.0358, lng: 77.5970 },
    { name: 'Yeshwanthpur Industrial Area', lat: 13.0238, lng: 77.5529 },
    { name: 'Rajajinagar 1st Block', lat: 12.9982, lng: 77.5530 },
    { name: 'Malleswaram 8th Cross', lat: 12.9988, lng: 77.5714 },
    { name: 'Majestic City Railway Stn', lat: 12.9772, lng: 77.5708 },
    { name: 'Basavanagudi Gandhi Bazaar', lat: 12.9421, lng: 77.5746 },
    { name: 'JP Nagar 6th Phase Ring Rd', lat: 12.9063, lng: 77.5855 },
    { name: 'Bannerghatta Vega City', lat: 12.8984, lng: 77.5997 },
    { name: 'Kalyan Nagar HRBR Layout', lat: 13.0182, lng: 77.6433 },
    { name: 'Banashankari BDA Complex', lat: 12.9255, lng: 77.5468 },
  ],
  Mumbai: [
    { name: 'Bandra Kurla Complex (BKC)', lat: 19.0657, lng: 72.8687 },
    { name: 'Andheri East MIDC Hub', lat: 19.1136, lng: 72.8697 },
    { name: 'Lower Parel Phoenix Mills', lat: 18.9926, lng: 72.8295 },
    { name: 'Powai Hiranandani Estate', lat: 19.1176, lng: 72.9060 },
    { name: 'Nariman Point Express Towers', lat: 18.9260, lng: 72.8228 },
    { name: 'Dadar TT Circle Junction', lat: 19.0178, lng: 72.8478 },
    { name: 'Goregaon Nesco Complex', lat: 19.1553, lng: 72.8526 },
    { name: 'Thane West Viviana Mall', lat: 19.2062, lng: 72.9744 },
    { name: 'Navi Mumbai Vashi Plaza', lat: 19.0770, lng: 72.9986 },
    { name: 'Worli Sea Face Link', lat: 19.0134, lng: 72.8152 },
  ],
  Delhi: [
    { name: 'Connaught Place Inner Circle', lat: 28.6315, lng: 77.2167 },
    { name: 'Okhla Industrial Area Ph-III', lat: 28.5355, lng: 77.2680 },
    { name: 'Nehru Place Commercial Hub', lat: 28.5494, lng: 77.2528 },
    { name: 'Saket District Centre', lat: 28.5284, lng: 77.2195 },
    { name: 'Karol Bagh Market', lat: 28.6517, lng: 77.1906 },
    { name: 'Dwarka Sector 10 Metro', lat: 28.5823, lng: 77.0500 },
    { name: 'Noida Sector 62 Tech Park', lat: 28.6280, lng: 77.3649 },
    { name: 'Gurgaon Cyber City Ph-2', lat: 28.4950, lng: 77.0895 },
  ],
  Hyderabad: [
    { name: 'Hitec City Cyber Towers', lat: 17.4504, lng: 78.3808 },
    { name: 'Gachibowli Financial District', lat: 17.4401, lng: 78.3489 },
    { name: 'Banjara Hills Road No 1', lat: 17.4156, lng: 78.4487 },
    { name: 'Jubilee Hills Checkpost', lat: 17.4319, lng: 78.4073 },
    { name: 'Madhapur Inorbit Mall', lat: 17.4338, lng: 78.3866 },
    { name: 'Secunderabad Junction Hub', lat: 17.4399, lng: 78.4983 },
    { name: 'Begumpet Airport Concourse', lat: 17.4447, lng: 78.4664 },
  ],
  Bhopal: [
    { name: 'MP Nagar Zone 1 Commercial', lat: 23.2332, lng: 77.4343 },
    { name: 'Arera Colony E-3 Market', lat: 23.2132, lng: 77.4312 },
    { name: 'New Market TT Nagar Hub', lat: 23.2384, lng: 77.4014 },
    { name: 'Kolar Road Sector A', lat: 23.1845, lng: 77.4187 },
    { name: 'BHEL Govindpura Ind Area', lat: 23.2599, lng: 77.4660 },
  ],
};

const CLIENT_COMPANIES = [
  'Amazon Fulfillment Hub',
  'Flipkart Logistics DC',
  'Reliance Retail Express',
  'Zepto Dark Store',
  'Swiggy Instamart Pod',
  'Blinkit Delivery Node',
  'Tata Neu Regional Warehouse',
  'Croma Megastore Logistics',
  'Apollo Healthcare DC',
  'Decathlon Sports Terminal',
  'Delhivery Surface Center',
  'Blue Dart Gateway',
  'FabIndia Retail Center',
  'BigBasket Hyperlocal Depot',
  'Lenskart Vision DC',
  'Licious Express Node',
];

export const useOrderStore = create<OrderStoreState>((set, get) => ({
  orders: SAMPLE_ORDERS,
  searchQuery: '',
  priorityFilter: 'All',

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setPriorityFilter: (filter: OrderPriority | 'All') => set({ priorityFilter: filter }),

  addOrder: (order: BulkOrder) => {
    set((state) => ({
      orders: [order, ...state.orders],
    }));
  },

  updateOrder: (id: string, updates: Partial<BulkOrder>) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
  },

  deleteOrder: (id: string) => {
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    }));
  },

  clearOrders: () => set({ orders: [] }),

  loadSampleOrders: () => set({ orders: SAMPLE_ORDERS }),

  generateOrders: (params: BulkOrderGeneratorParams) => {
    const junctions = CITY_JUNCTIONS_MAP[params.geographicArea] || CITY_JUNCTIONS_MAP['Bengaluru'];
    const count = Math.max(1, params.orderCount);
    const newOrders: BulkOrder[] = [];
    const baseId = 8200 + Math.floor(Math.random() * 800);

    const timeWindowOptions = [
      '08:30 - 11:30',
      '09:00 - 12:30',
      '11:00 - 14:00',
      '13:00 - 16:30',
      '15:00 - 18:30',
      '18:00 - 21:00',
    ];

    for (let i = 0; i < count; i++) {
      const junction = junctions[i % junctions.length];
      const company = CLIENT_COMPANIES[i % CLIENT_COMPANIES.length];
      const id = `ORD-${baseId + i}`;

      // Slight GPS jitter to simulate multi-stop door drops
      const jitterLat = (Math.random() - 0.5) * 0.006;
      const jitterLng = (Math.random() - 0.5) * 0.006;

      const minQty = Math.max(1, params.quantityRange[0]);
      const maxQty = Math.max(minQty, params.quantityRange[1]);
      const quantity = Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;

      const minWt = Math.max(0.5, params.weightRangeKg[0]);
      const maxWt = Math.max(minWt, params.weightRangeKg[1]);
      const weightKg = parseFloat((Math.random() * (maxWt - minWt) + minWt).toFixed(1));

      let priority: OrderPriority = 'Medium';
      if (params.priority === 'Mixed') {
        const rand = Math.random();
        if (rand < 0.3) priority = 'High';
        else if (rand < 0.75) priority = 'Medium';
        else priority = 'Low';
      } else {
        priority = params.priority;
      }

      let timeWindow = params.timeWindow;
      if (!timeWindow || timeWindow === 'Mixed') {
        timeWindow = timeWindowOptions[i % timeWindowOptions.length];
      }

      newOrders.push({
        id,
        customerName: `${company} #${(i % 5) + 1}`,
        location: junction.name,
        lat: parseFloat((junction.lat + jitterLat).toFixed(4)),
        lng: parseFloat((junction.lng + jitterLng).toFixed(4)),
        quantity,
        weightKg,
        priority,
        timeWindow,
        status: i % 4 === 0 ? 'In Transit' : 'Pending',
      });
    }

    set({ orders: newOrders });
    return count;
  },

  importCSV: (csvText: string) => {
    try {
      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        return { success: false, count: 0, error: 'CSV file is empty or missing data rows.' };
      }

      const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      
      const idIdx = header.findIndex((h) => h.includes('id'));
      const nameIdx = header.findIndex((h) => h.includes('name') || h.includes('customer'));
      const locIdx = header.findIndex((h) => h.includes('location') || h.includes('dest'));
      const latIdx = header.findIndex((h) => h.includes('lat'));
      const lngIdx = header.findIndex((h) => h.includes('lng') || h.includes('lon'));
      const qtyIdx = header.findIndex((h) => h.includes('quantity') || h.includes('qty') || h.includes('package'));
      const weightIdx = header.findIndex((h) => h.includes('weight'));
      const prioIdx = header.findIndex((h) => h.includes('priority'));
      const windowIdx = header.findIndex((h) => h.includes('window') || h.includes('time'));

      const parsedOrders: BulkOrder[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split CSV handling basic quotes
        const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.length < 4) continue;

        const id = idIdx >= 0 && cols[idIdx] ? cols[idIdx] : `ORD-${8100 + i}`;
        const customerName = nameIdx >= 0 && cols[nameIdx] ? cols[nameIdx] : `Customer ${i}`;
        const location = locIdx >= 0 && cols[locIdx] ? cols[locIdx] : 'Bengaluru Sector';
        const lat = latIdx >= 0 ? parseFloat(cols[latIdx]) : 12.9716;
        const lng = lngIdx >= 0 ? parseFloat(cols[lngIdx]) : 77.5946;
        const quantity = qtyIdx >= 0 ? parseInt(cols[qtyIdx]) || 1 : 1;
        const weightKg = weightIdx >= 0 ? parseFloat(cols[weightIdx]) || 10 : 10;
        
        let priority: OrderPriority = 'Medium';
        if (prioIdx >= 0 && cols[prioIdx]) {
          const p = cols[prioIdx].toLowerCase();
          if (p.includes('high')) priority = 'High';
          else if (p.includes('low')) priority = 'Low';
        }

        const timeWindow = windowIdx >= 0 && cols[windowIdx] ? cols[windowIdx] : '09:00 - 18:00';

        parsedOrders.push({
          id,
          customerName,
          location,
          lat: isNaN(lat) ? 12.9716 : lat,
          lng: isNaN(lng) ? 77.5946 : lng,
          quantity,
          weightKg,
          priority,
          timeWindow,
          status: 'Pending',
        });
      }

      if (parsedOrders.length === 0) {
        return { success: false, count: 0, error: 'Could not parse any valid order rows from CSV.' };
      }

      set((state) => ({
        orders: [...parsedOrders, ...state.orders],
      }));

      return { success: true, count: parsedOrders.length };
    } catch (err) {
      return {
        success: false,
        count: 0,
        error: err instanceof Error ? err.message : 'Unknown CSV parsing error',
      };
    }
  },

  exportCSV: () => {
    const { orders } = get();
    const headers = [
      'Order ID',
      'Customer Name',
      'Destination / Location',
      'Latitude',
      'Longitude',
      'Package Quantity',
      'Package Weight (kg)',
      'Priority',
      'Delivery Time Window',
      'Status',
    ];

    const rows = orders.map((o) => [
      `"${o.id}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.location.replace(/"/g, '""')}"`,
      o.lat.toFixed(4),
      o.lng.toFixed(4),
      o.quantity,
      o.weightKg.toFixed(1),
      o.priority,
      `"${o.timeWindow}"`,
      o.status || 'Pending',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
}));
