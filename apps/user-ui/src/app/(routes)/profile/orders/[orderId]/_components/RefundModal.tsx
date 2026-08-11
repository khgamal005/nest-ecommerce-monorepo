'use client';

import React, { useState } from 'react';
import { X, AlertCircle, DollarSign } from 'lucide-react';
import { formatEGP } from '@/utils/formatEGP';
import axiosInstance from '@/utils/axiosInstance';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderTotal: number;
  onSuccess: () => void;
}

interface RefundRequest {
  amount: number;
  reason: string;
  userNotes?: string;
}

const REFUND_REASONS = [
  'Product not as described',
  'Product arrived damaged',
  'Wrong item received',
  'Product quality issues',
  'Changed my mind',
  'Delivery took too long',
  'Other'
];

export default function RefundModal({ isOpen, onClose, orderId, orderTotal, onSuccess }: RefundModalProps) {
  const [formData, setFormData] = useState<RefundRequest>({
    amount: orderTotal,
    reason: '',
    userNotes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await axiosInstance.post('/api/orders/refunds/request', {
        orderId,
        ...formData
      });
      
      onSuccess();
      onClose();
      setFormData({ amount: orderTotal, reason: '', userNotes: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit refund request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    if (amount >= 0 && amount <= orderTotal) {
      setFormData(prev => ({ ...prev, amount }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Request Refund</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                max={orderTotal}
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {formatEGP(orderTotal)}
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Refund
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a reason</option>
              {REFUND_REASONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.userNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, userNotes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Please provide any additional details about your refund request..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
