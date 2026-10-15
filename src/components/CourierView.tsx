import React, { useState, useMemo } from 'react';
import {
  Truck,
  Send,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Printer,
  Trash2,
  RefreshCw,
  Copy,
  Sliders,
  X,
  Package,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  CourierParcel,
  CourierPartner,
  CourierDeliveryType,
  CourierItemType,
  CourierParcelStatus,
  CourierApiSettings,
  Order,
  AppSettings,
} from '../types';
import { formatCurrency, formatDate, getTodayString } from '../utils/accounting';

interface CourierViewProps {
  parcels: CourierParcel[];
  orders: Order[];
  settings: AppSettings;
  courierSettings: CourierApiSettings;
  initialOrderToDispatch?: Order | null;
  onClearInitialOrder?: () => void;
  onSaveParcel: (parcel: CourierParcel) => void;
  onUpdateParcelStatus: (parcelId: string, status: CourierParcelStatus) => void;
  onDeleteParcel: (parcelId: string) => void;
  onSaveCourierSettings: (settings: CourierApiSettings) => void;
  onUpdateOrderStatus?: (orderId: string, status: any) => void;
}

export const CourierView: React.FC<CourierViewProps> = ({
  parcels,
  orders,
  settings,
  courierSettings,
  initialOrderToDispatch,
  onClearInitialOrder,
  onSaveParcel,
  onUpdateParcelStatus,
  onDeleteParcel,
  onSaveCourierSettings,
  onUpdateOrderStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<string>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(!!initialOrderToDispatch);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [trackingParcel, setTrackingParcel] = useState<CourierParcel | null>(null);
  const [labelParcel, setLabelParcel] = useState<CourierParcel | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Booking Form State
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    initialOrderToDispatch?.id || ''
  );
  const [courierPartner, setCourierPartner] = useState<CourierPartner>(
    courierSettings.defaultCourier || 'Pathao'
  );
  const [recipientName, setRecipientName] = useState(
    initialOrderToDispatch?.customerName || ''
  );
  const [recipientPhone, setRecipientPhone] = useState(
    initialOrderToDispatch?.customerPhone || ''
  );
  const [recipientAddress, setRecipientAddress] = useState(
    initialOrderToDispatch?.customerAddress || ''
  );
  const [recipientCity, setRecipientCity] = useState('Dhaka');
  const [recipientZone, setRecipientZone] = useState('Dhanmondi');
  const [itemType, setItemType] = useState<CourierItemType>('gift_package');
  const [weightKg, setWeightKg] = useState<number>(1);
  const [numberOfItems, setNumberOfItems] = useState<number>(1);
  const [codAmount, setCodAmount] = useState<number>(
    initialOrderToDispatch?.totalAmount || 0
  );
  const [deliveryType, setDeliveryType] = useState<CourierDeliveryType>('inside_dhaka');
  const [deliveryFee, setDeliveryFee] = useState<number>(60);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Settings form
  const [tempSettings, setTempSettings] = useState<CourierApiSettings>(courierSettings);

  // Populate from order when order dropdown changes
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    if (!orderId) return;
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      setRecipientName(ord.customerName);
      setRecipientPhone(ord.customerPhone);
      setRecipientAddress(ord.customerAddress);
      setCodAmount(ord.totalAmount);
      setSpecialInstructions(`Order #${ord.orderNumber}. Handle with care.`);
      const isOutsideDhaka =
        ord.customerAddress.toLowerCase().includes('chittagong') ||
        ord.customerAddress.toLowerCase().includes('sylhet') ||
        ord.customerAddress.toLowerCase().includes('rajshahi') ||
        ord.customerAddress.toLowerCase().includes('khulna') ||
        ord.customerAddress.toLowerCase().includes('barisal') ||
        ord.customerAddress.toLowerCase().includes('rangpur');
      if (isOutsideDhaka) {
        setDeliveryType('outside_dhaka');
        setDeliveryFee(130);
        setRecipientCity('Outside Dhaka');
      } else {
        setDeliveryType('inside_dhaka');
        setDeliveryFee(60);
        setRecipientCity('Dhaka');
      }
    }
  };

  const handleDeliveryTypeChange = (type: CourierDeliveryType) => {
    setDeliveryType(type);
    if (type === 'inside_dhaka') setDeliveryFee(60);
    else if (type === 'sub_dhaka') setDeliveryFee(100);
    else if (type === 'outside_dhaka') setDeliveryFee(130);
    else if (type === 'express') setDeliveryFee(150);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit Parcel Booking (Pathao / Courier Dispatch)
  const handleDispatchParcel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientPhone.trim() || !recipientAddress.trim()) {
      alert('Please fill recipient name, phone, and delivery address.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Generate realistic consignment ID for Pathao / Courier
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      const prefix =
        courierPartner === 'Pathao'
          ? 'PTH'
          : courierPartner === 'Steadfast'
          ? 'STD'
          : courierPartner === 'RedX'
          ? 'RDX'
          : 'CUR';
      const consignmentId = `${prefix}-${randomDigits}`;
      const trackingCode = `TRK-${Date.now().toString().slice(-7)}`;

      const linkedOrder = orders.find((o) => o.id === selectedOrderId);

      const newParcel: CourierParcel = {
        id: `pcl-${Date.now()}`,
        consignmentId,
        trackingCode,
        orderId: linkedOrder?.id,
        orderNumber: linkedOrder?.orderNumber,
        courierPartner,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientAddress: recipientAddress.trim(),
        recipientCity,
        recipientZone,
        itemType,
        weightKg: Number(weightKg) || 1,
        numberOfItems: Number(numberOfItems) || 1,
        codAmount: Number(codAmount) || 0,
        deliveryFee: Number(deliveryFee) || 60,
        deliveryType,
        specialInstructions: specialInstructions.trim(),
        status: 'pending_pickup',
        statusHistory: [
          {
            status: 'pending_pickup',
            timestamp: new Date().toISOString(),
            note: `Parcel booked with ${courierPartner}. Consignment generated: ${consignmentId}`,
          },
        ],
        dispatchedAt: new Date().toISOString(),
      };

      onSaveParcel(newParcel);

      // If linked with order, update order status to shipped
      if (linkedOrder && onUpdateOrderStatus) {
        onUpdateOrderStatus(linkedOrder.id, 'shipped');
      }

      setIsSubmitting(false);
      setIsBookModalOpen(false);
      if (onClearInitialOrder) onClearInitialOrder();

      // Reset form
      setSelectedOrderId('');
      setRecipientName('');
      setRecipientPhone('');
      setRecipientAddress('');
      setCodAmount(0);
      setSpecialInstructions('');
    }, 450);
  };

  // Filtered parcels
  const filteredParcels = useMemo(() => {
    return parcels.filter((p) => {
      const matchesSearch =
        p.consignmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.trackingCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.recipientPhone.includes(searchTerm) ||
        (p.orderNumber && p.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPartner =
        selectedPartnerFilter === 'All' || p.courierPartner === selectedPartnerFilter;

      const matchesStatus =
        selectedStatusFilter === 'All' || p.status === selectedStatusFilter;

      return matchesSearch && matchesPartner && matchesStatus;
    });
  }, [parcels, searchTerm, selectedPartnerFilter, selectedStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = parcels.length;
    const inTransit = parcels.filter(
      (p) => p.status === 'in_transit' || p.status === 'out_for_delivery'
    ).length;
    const delivered = parcels.filter((p) => p.status === 'delivered').length;
    const pendingPickup = parcels.filter((p) => p.status === 'pending_pickup').length;
    const pendingCod = parcels
      .filter((p) => p.status !== 'delivered' && p.status !== 'cancelled' && p.status !== 'returned')
      .reduce((sum, p) => sum + (p.codAmount || 0), 0);
    const collectedCod = parcels
      .filter((p) => p.status === 'delivered')
      .reduce((sum, p) => sum + (p.codAmount || 0), 0);

    return { total, inTransit, delivered, pendingPickup, pendingCod, collectedCod };
  }, [parcels]);

  // Courier badge styling
  const getCourierBadge = (partner: CourierPartner) => {
    switch (partner) {
      case 'Pathao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Pathao Courier
          </span>
        );
      case 'Steadfast':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Steadfast
          </span>
        );
      case 'RedX':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
            RedX
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
            {partner}
          </span>
        );
    }
  };

  const getStatusBadge = (status: CourierParcelStatus) => {
    switch (status) {
      case 'pending_pickup':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Pending Pickup
          </span>
        );
      case 'in_transit':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            In Transit
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
            Out For Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Delivered
          </span>
        );
      case 'returned':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            Returned
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-200">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Courier & Delivery Service
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
              Pathao Integration
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Book, dispatch, and live track your customer parcels with Pathao and other couriers
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 cursor-pointer shadow-2xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            Pathao API Settings
          </button>
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send Parcel to Pathao
          </button>
        </div>
      </div>

      {/* Pathao & Courier Partners Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 text-white p-4 rounded-xl shadow-xs relative overflow-hidden">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded">
                  Featured Partner
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3" /> Ready
                </span>
              </div>
              <div className="mt-2 font-bold text-lg">Pathao Courier Service</div>
              <div className="text-xs text-rose-100 mt-0.5">
                Fast doorstep pickup across Dhaka & 64 districts in Bangladesh.
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="font-medium">One-Click Dispatch</span>
              <a
                href="https://merchant.pathao.com"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-white/80 inline-flex items-center gap-1 text-[11px]"
              >
                Pathao Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Steadfast Courier
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">Available</span>
            </div>
            <div className="mt-2 font-bold text-neutral-900 text-sm">Nationwide Coverage</div>
            <div className="text-xs text-neutral-500 mt-0.5">
              Rapid deliveries with next-day payment settlement options.
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 text-xs text-neutral-500 flex items-center justify-between">
            <span>COD Available</span>
            <span className="font-semibold text-neutral-700">64 Districts</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                Pickup Address
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Store Active</span>
            </div>
            <div className="mt-2 font-bold text-neutral-900 text-sm truncate">
              {settings.shopName || 'Main Hub'}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
              {settings.shopAddress || 'Dhaka, Bangladesh'}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 text-xs text-neutral-500 flex items-center justify-between">
            <span>Phone: {settings.shopPhone || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            Total Dispatched
          </div>
          <div className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
            {stats.total}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {stats.pendingPickup} awaiting pickup
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            In Transit
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-1">
            {stats.inTransit}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Riders on the way</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Delivered Successfully
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
            {stats.delivered}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            Collected: {formatCurrency(stats.collectedCod)}
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
            Pending COD Receivable
          </div>
          <div className="text-xl sm:text-2xl font-bold text-rose-700 mt-1">
            {formatCurrency(stats.pendingCod)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">To collect from courier</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search consignment, tracking ID, phone, customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Courier:</span>
          </div>
          <select
            value={selectedPartnerFilter}
            onChange={(e) => setSelectedPartnerFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          >
            <option value="All">All Couriers</option>
            <option value="Pathao">Pathao Courier</option>
            <option value="Steadfast">Steadfast</option>
            <option value="RedX">RedX</option>
            <option value="Paperfly">Paperfly</option>
            <option value="Sundarban">Sundarban</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500 shrink-0 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          >
            <option value="All">All Statuses</option>
            <option value="pending_pickup">Pending Pickup</option>
            <option value="in_transit">In Transit</option>
            <option value="out_for_delivery">Out For Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="returned">Returned</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Parcels Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px] text-xs">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                <th className="p-3">Consignment & Tracking</th>
                <th className="p-3">Order #</th>
                <th className="p-3">Courier Partner</th>
                <th className="p-3">Recipient & Destination</th>
                <th className="p-3 text-right">COD Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="max-w-xs mx-auto text-neutral-400 space-y-3">
                      <Truck className="w-10 h-10 mx-auto text-neutral-300 stroke-[1.5]" />
                      <div className="font-semibold text-neutral-700 text-sm">
                        No courier parcels found
                      </div>
                      <p className="text-xs text-neutral-400">
                        Ready to send your first order parcel to Pathao Courier? Click below to book
                        a dispatch.
                      </p>
                      <button
                        onClick={() => setIsBookModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 cursor-pointer shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Parcel to Pathao
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredParcels.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-neutral-50/80 transition-all">
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-900">
                        <span>{parcel.consignmentId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(parcel.consignmentId)}
                          className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
                          title="Copy Consignment ID"
                        >
                          {copiedId === parcel.consignmentId ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        Track: {parcel.trackingCode}
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
                        {formatDate(parcel.dispatchedAt.split('T')[0])}
                      </div>
                    </td>

                    <td className="p-3">
                      {parcel.orderNumber ? (
                        <span className="font-mono font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                          #{parcel.orderNumber}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">Direct Parcel</span>
                      )}
                    </td>

                    <td className="p-3">{getCourierBadge(parcel.courierPartner)}</td>

                    <td className="p-3">
                      <div className="font-bold text-neutral-900">{parcel.recipientName}</div>
                      <div className="text-[11px] text-neutral-600 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        {parcel.recipientPhone}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate max-w-[220px] mt-0.5">
                        {parcel.recipientAddress}
                        {parcel.recipientCity ? `, ${parcel.recipientCity}` : ''}
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <div className="font-bold font-mono text-neutral-900 text-sm">
                        {formatCurrency(parcel.codAmount)}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Fee: {formatCurrency(parcel.deliveryFee)} ({parcel.weightKg} kg)
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="inline-block">{getStatusBadge(parcel.status)}</div>
                      <div className="mt-1">
                        <select
                          value={parcel.status}
                          onChange={(e) =>
                            onUpdateParcelStatus(parcel.id, e.target.value as CourierParcelStatus)
                          }
                          className="text-[10px] bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-600 focus:outline-hidden"
                        >
                          <option value="pending_pickup">Pending Pickup</option>
                          <option value="in_transit">In Transit</option>
                          <option value="out_for_delivery">Out For Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="returned">Returned</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTrackingParcel(parcel)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                          title="Track Parcel Timeline"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setLabelParcel(parcel)}
                          className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                          title="Print Courier Waybill / Label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete parcel entry "${parcel.consignmentId}"?`)) {
                              onDeleteParcel(parcel.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Parcel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Book Parcel / Send to Courier */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-neutral-200 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900 leading-tight">
                    Send Parcel to Courier (Pathao)
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    Book doorstep pickup and auto-generate consignment code
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsBookModalOpen(false);
                  if (onClearInitialOrder) onClearInitialOrder();
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleDispatchParcel} className="p-5 space-y-4">
              {/* Option to load from Order */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Select Order to Dispatch (Optional)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-medium"
                >
                  <option value="">-- Direct Customer Parcel (Manual Entry) --</option>
                  {orders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      #{ord.orderNumber} - {ord.customerName} ({formatCurrency(ord.totalAmount)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Courier Partner Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                  Courier Partner *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCourierPartner('Pathao')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      courierPartner === 'Pathao'
                        ? 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-700">Pathao</span>
                      {courierPartner === 'Pathao' && (
                        <Check className="w-3.5 h-3.5 text-rose-600" />
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Recommended</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCourierPartner('Steadfast')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      courierPartner === 'Steadfast'
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-blue-700">Steadfast</span>
                      {courierPartner === 'Steadfast' && (
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Nationwide</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCourierPartner('RedX')}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      courierPartner === 'RedX'
                        ? 'border-red-500 bg-red-50/50 ring-2 ring-red-500/20'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-red-600">RedX</span>
                      {courierPartner === 'RedX' && (
                        <Check className="w-3.5 h-3.5 text-red-600" />
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Fast COD</div>
                  </button>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="space-y-3 pt-1">
                <div className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-neutral-400" /> Recipient Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tanvir Hasan"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Customer Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 01711-223344"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="House, Road, Area, Landmark..."
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      City / District
                    </label>
                    <input
                      type="text"
                      placeholder="Dhaka / Chittagong / etc."
                      value={recipientCity}
                      onChange={(e) => setRecipientCity(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Zone / Thana
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dhanmondi, Mirpur"
                      value={recipientZone}
                      onChange={(e) => setRecipientZone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery & Package Details */}
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <div className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-neutral-400" /> Parcel & COD Details
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('inside_dhaka')}
                    className={`p-2 rounded-lg border text-center cursor-pointer text-xs ${
                      deliveryType === 'inside_dhaka'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                        : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <div>Inside Dhaka</div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">৳60</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('sub_dhaka')}
                    className={`p-2 rounded-lg border text-center cursor-pointer text-xs ${
                      deliveryType === 'sub_dhaka'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                        : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <div>Sub-Dhaka</div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">৳100</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('outside_dhaka')}
                    className={`p-2 rounded-lg border text-center cursor-pointer text-xs ${
                      deliveryType === 'outside_dhaka'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                        : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <div>Outside Dhaka</div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">৳130</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeliveryTypeChange('express')}
                    className={`p-2 rounded-lg border text-center cursor-pointer text-xs ${
                      deliveryType === 'express'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                        : 'border-neutral-200 text-neutral-600'
                    }`}
                  >
                    <div>Same Day Express</div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">৳150</div>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Cash on Delivery (৳) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      placeholder="0"
                      value={codAmount || ''}
                      onChange={(e) => setCodAmount(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-bold text-rose-700 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Weight (KG)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min={0.5}
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Delivery Charge (৳)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Special Delivery Notes / Instructions
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fragile gift box, please call before delivery"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Dispatching to Pathao...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send to {courierPartner} (Auto Consign)
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Live Parcel Tracking Modal */}
      {trackingParcel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-200 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">
                    Live Parcel Tracking ({trackingParcel.courierPartner})
                  </h3>
                  <div className="text-xs text-neutral-500 font-mono">
                    Consignment: {trackingParcel.consignmentId}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setTrackingParcel(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Recipient summary */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1">
                <div className="font-bold text-neutral-800">{trackingParcel.recipientName}</div>
                <div className="text-neutral-600 font-mono">{trackingParcel.recipientPhone}</div>
                <div className="text-neutral-500">{trackingParcel.recipientAddress}</div>
                <div className="pt-2 mt-2 border-t border-neutral-200 flex justify-between font-semibold">
                  <span>COD Amount:</span>
                  <span className="text-rose-600 font-bold font-mono">
                    {formatCurrency(trackingParcel.codAmount)}
                  </span>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 pl-8">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-[27px] top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div className="font-bold text-xs text-neutral-900">
                    Consignment Created & Assigned
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {formatDate(trackingParcel.dispatchedAt.split('T')[0])} - Dispatched via{' '}
                    {trackingParcel.courierPartner}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div
                    className={`absolute -left-[27px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                      trackingParcel.status !== 'pending_pickup'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-amber-400 text-white animate-pulse'
                    }`}
                  >
                    {trackingParcel.status !== 'pending_pickup' ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </div>
                  <div className="font-bold text-xs text-neutral-900">Doorstep Pickup</div>
                  <div className="text-[11px] text-neutral-500">
                    {trackingParcel.status === 'pending_pickup'
                      ? 'Rider assigned for parcel pickup from your store'
                      : 'Picked up by courier rider'}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div
                    className={`absolute -left-[27px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                      trackingParcel.status === 'in_transit' ||
                      trackingParcel.status === 'out_for_delivery' ||
                      trackingParcel.status === 'delivered'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-200 text-neutral-400'
                    }`}
                  >
                    <Truck className="w-3 h-3" />
                  </div>
                  <div className="font-bold text-xs text-neutral-900">
                    Sorting Center & In Transit
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {trackingParcel.status === 'in_transit' ||
                    trackingParcel.status === 'out_for_delivery' ||
                    trackingParcel.status === 'delivered'
                      ? 'Processed at Dhaka sorting hub and out for destination'
                      : 'Awaiting hub arrival'}
                  </div>
                </div>

                {/* Step 4 */}
                <div className="relative">
                  <div
                    className={`absolute -left-[27px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
                      trackingParcel.status === 'delivered'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-neutral-200 text-neutral-400'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <div className="font-bold text-xs text-neutral-900">
                    Delivered & COD Collection
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {trackingParcel.status === 'delivered'
                      ? 'Delivered to recipient. COD collected.'
                      : 'Scheduled for final delivery'}
                  </div>
                </div>
              </div>

              {/* External Pathao Tracking Link */}
              <div className="pt-3 border-t border-neutral-100 flex justify-between items-center">
                <a
                  href={`https://merchant.pathao.com/tracking?consignment_id=${trackingParcel.consignmentId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  Open in Pathao Merchant Website <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setTrackingParcel(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Printable Shipping Waybill / Courier Label */}
      {labelParcel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-neutral-200 my-8 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between no-print bg-neutral-50">
              <div className="font-bold text-neutral-900 text-xs">Print Shipping Label</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Label
                </button>
                <button
                  onClick={() => setLabelParcel(null)}
                  className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thermal / Paper Label Layout */}
            <div className="p-6 bg-white text-black font-sans border-2 border-dashed border-neutral-300 m-4 rounded-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-black pb-3">
                <div>
                  <div className="font-black text-lg tracking-tight uppercase">
                    {labelParcel.courierPartner}
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider">
                    Express Logistics & Delivery
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase">{labelParcel.deliveryType}</div>
                  <div className="text-[10px] text-neutral-600">Weight: {labelParcel.weightKg} KG</div>
                </div>
              </div>

              {/* Consignment Code & Barcode Mock */}
              <div className="py-4 text-center border-b border-black/20">
                <div className="font-mono text-xl font-black tracking-wider">
                  {labelParcel.consignmentId}
                </div>
                {/* Barcode visual representation */}
                <div className="h-10 flex items-center justify-center gap-0.5 mt-1.5 px-4">
                  {[4, 2, 5, 1, 3, 6, 2, 4, 1, 5, 3, 2, 6, 4, 1, 3, 5, 2, 4, 6, 2, 3, 5, 1].map(
                    (w, i) => (
                      <div
                        key={i}
                        className="bg-black h-8"
                        style={{ width: `${w}px` }}
                      />
                    )
                  )}
                </div>
                <div className="text-[9px] font-mono mt-0.5">TRACKING: {labelParcel.trackingCode}</div>
              </div>

              {/* Destination & Recipient */}
              <div className="py-3 border-b border-black/20 text-left">
                <div className="text-[10px] uppercase font-bold text-neutral-500">Deliver To:</div>
                <div className="font-black text-base mt-0.5">{labelParcel.recipientName}</div>
                <div className="font-mono font-bold text-sm mt-0.5">{labelParcel.recipientPhone}</div>
                <div className="text-xs mt-1 leading-relaxed">{labelParcel.recipientAddress}</div>
                {labelParcel.recipientCity && (
                  <div className="text-xs font-bold mt-1">
                    City: {labelParcel.recipientCity}
                    {labelParcel.recipientZone ? ` - ${labelParcel.recipientZone}` : ''}
                  </div>
                )}
              </div>

              {/* COD Amount Banner */}
              <div className="my-3 p-3 bg-neutral-100 border-2 border-black rounded-lg text-center">
                <div className="text-[10px] uppercase font-bold text-neutral-600">
                  Cash On Delivery (COD) Collectable:
                </div>
                <div className="text-2xl font-black font-mono mt-0.5">
                  {formatCurrency(labelParcel.codAmount)}
                </div>
              </div>

              {/* Sender Details */}
              <div className="pt-2 text-[10px] text-neutral-600 flex justify-between">
                <div>
                  <span className="font-bold">Sender: </span>
                  {settings.shopName || 'Store Till'}
                  <br />
                  <span>{settings.shopPhone}</span>
                </div>
                <div className="text-right">
                  <span>Order: #{labelParcel.orderNumber || 'N/A'}</span>
                </div>
              </div>

              {labelParcel.specialInstructions && (
                <div className="mt-2 pt-2 border-t border-dashed border-neutral-300 text-[10px] text-rose-700 font-semibold">
                  Note: {labelParcel.specialInstructions}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Pathao API & Courier Settings */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-neutral-200 my-8 overflow-hidden">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-neutral-700" />
                <h3 className="font-bold text-neutral-900 text-sm">
                  Pathao Courier API Credentials
                </h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-relaxed">
                Enter your Pathao Merchant API credentials to automatically sync orders with Pathao
                Courier. You can get these from your Pathao Merchant Developer Portal.
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Default Courier Partner
                </label>
                <select
                  value={tempSettings.defaultCourier}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      defaultCourier: e.target.value as CourierPartner,
                    })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg"
                >
                  <option value="Pathao">Pathao Courier</option>
                  <option value="Steadfast">Steadfast Courier</option>
                  <option value="RedX">RedX Courier</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Pathao Store ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 19283"
                  value={tempSettings.pathaoStoreId || ''}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, pathaoStoreId: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Pathao Client ID
                  </label>
                  <input
                    type="text"
                    placeholder="Client ID"
                    value={tempSettings.pathaoClientId || ''}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, pathaoClientId: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Pathao Client Secret
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={tempSettings.pathaoClientSecret || ''}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, pathaoClientSecret: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Merchant Email / Username
                  </label>
                  <input
                    type="text"
                    placeholder="merchant@example.com"
                    value={tempSettings.pathaoUsername || ''}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, pathaoUsername: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={tempSettings.pathaoPassword || ''}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, pathaoPassword: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSaveCourierSettings(tempSettings);
                    setIsSettingsModalOpen(false);
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg cursor-pointer shadow-xs"
                >
                  Save API Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
