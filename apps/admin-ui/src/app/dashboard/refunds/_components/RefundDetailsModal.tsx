'use client';

import React from 'react';
import { X, CheckCircle, XCircle, User, Store, Package, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { formatEGP } from '../../../../utils/formatEGP';

interface Refund {
  id: string;
  orderId: string;
  userId: string;
  shopId: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  adminId?: string;
  adminNotes?: string;
  userNotes?: string;
  requestedAt: string;
  reviewedAt?: string;
  completedAt?: string;
  order: {
    id: string;
    total: number;
    paymentType: string;
    status: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
  shop: {
    id: string;
    name: string;
  };
}

interface RefundDetailsModalProps {
  refund: Refund;
  onClose: () => void;
  onApprove: (refundId: string) => void;
  onReject: (refundId: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}

export default function RefundDetailsModal({
  refund,
  onClose,
  onApprove,
  onReject,
  isApproving,
  isRejecting
}: RefundDetailsModalProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Pending' },
      APPROVED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: 'Approved' },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Rejected' },
      PROCESSING: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Processing' },
      COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Completed' },
      FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Failed' }
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(refund.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Refund Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Current Status</span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Order Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Order ID:</span>
                <p className="font-mono text-gray-900">{refund.orderId}</p>
              </div>
              <div>
                <span className="text-gray-500">Order Total:</span>
                <p className="font-medium text-gray-900">{formatEGP(refund.order.total)}</p>
              </div>
              <div>
                <span className="text-gray-500">Payment Type:</span>
                <p className="font-medium text-gray-900">{refund.order.paymentType}</p>
              </div>
              <div>
                <span className="text-gray-500">Order Status:</span>
                <p className="font-medium text-gray-900">{refund.order.status}</p>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              User Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="font-medium text-gray-900">{refund.user.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium text-gray-900">{refund.user.email}</p>
              </div>
            </div>
          </div>

          {/* Shop Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Store className="h-4 w-4" />
              Shop Information
            </h3>
            <div className="text-sm">
              <span className="text-gray-500">Shop Name:</span>
              <p className="font-medium text-gray-900">{refund.shop.name}</p>
            </div>
          </div>

          {/* Refund Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Refund Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Refund Amount:</span>
                <p className="font-medium text-lg text-gray-900">{formatEGP(refund.amount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Reason:</span>
                <p className="font-medium text-gray-900">{refund.reason}</p>
              </div>
              {refund.userNotes && (
                <div>
                  <span className="text-gray-500">User Notes:</span>
                  <p className="font-medium text-gray-900">{refund.userNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Requested:</span>
                <span className="font-medium text-gray-900">
                  {new Date(refund.requestedAt).toLocaleString()}
                </span>
              </div>
              {refund.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reviewed:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(refund.reviewedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {refund.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(refund.completedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          {refund.adminNotes && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Admin Notes
              </h3>
              <p className="text-sm text-gray-900">{refund.adminNotes}</p>
            </div>
          )}

          {/* Warning Message */}
          {refund.status === 'PENDING' && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">This refund request is pending your review and action.</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {refund.status === 'PENDING' && (
          <div className="flex gap-3 p-6 border-t">
            <button
              onClick={() => onApprove(refund.id)}
              disabled={isApproving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {isApproving ? 'Approving...' : 'Approve Refund'}
            </button>
            <button
              onClick={() => onReject(refund.id)}
              disabled={isRejecting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              {isRejecting ? 'Rejecting...' : 'Reject Refund'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
