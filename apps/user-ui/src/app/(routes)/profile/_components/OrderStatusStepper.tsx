import React from 'react';

interface OrderStatusStepperProps {
  currentStatus: string;
}

const steps = ['تم الطلب', 'تم التعبئة', 'تم الشحن', 'في الطريق للتوصيل', 'تم التوصيل'];

const OrderStatusStepper: React.FC<OrderStatusStepperProps> = ({
  currentStatus,
}) => {
  // Check if order is cancelled
  const isCancelled =
    currentStatus?.toLowerCase() === 'canceled' || currentStatus === 'ملغى';

  // If cancelled, show special cancelled state
  if (isCancelled) {
    return (
      <div className="w-full py-4 md:py-8 px-4 md:px-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-600">❌</span>
            </div>
            <h3 className="text-lg font-bold text-red-800 mb-2">تم إلغاء الطلب</h3>
            <p className="text-sm text-red-600">
              هذا الطلب تم إلغاؤه ولن يتم إكماله
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Normalize status for comparison (case-insensitive)
  const normalizedCurrentStatus = currentStatus?.toLowerCase();

  // Find the index of the current status
  let activeIndex = steps.findIndex(
    (step) =>
      step.toLowerCase() === normalizedCurrentStatus ||
      (normalizedCurrentStatus === 'pending' && step === 'تم الطلب') ||
      (normalizedCurrentStatus === 'processing' && step === 'تم التعبئة') ||
      (normalizedCurrentStatus === 'shipped' && step === 'تم الشحن') ||
      (normalizedCurrentStatus === 'delivered' && step === 'تم التوصيل')
  );

  // Fallback: simple mapping if exact match fails
  if (activeIndex === -1) {
    if (normalizedCurrentStatus === 'pending') activeIndex = 0; // Ordered
    else if (
      normalizedCurrentStatus === 'processing' ||
      normalizedCurrentStatus === 'packed'
    )
      activeIndex = 1; // Packed
    else if (normalizedCurrentStatus === 'shipped') activeIndex = 2; // Shipped
    else if (normalizedCurrentStatus === 'out_for_delivery')
      activeIndex = 3; // Out for delivery
    else if (
      normalizedCurrentStatus === 'completed' ||
      normalizedCurrentStatus === 'delivered'
    )
      activeIndex = 4; // Delivered
    else if (normalizedCurrentStatus === 'paid') activeIndex = 0; // Paid = Ordered
    else activeIndex = 0; // Default to first step if unknown
  }

  // Calculate progress percentage
  const progressPercentage = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-4 md:py-8 px-4 md:px-8">
      <div className="relative w-full">
        {/* Desktop View (Horizontal) */}
        <div className="hidden md:block relative py-8">
          {/* Background Track */}
          <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-100 rounded-full -translate-y-1/2" />

          {/* Active Progress Bar */}
          <div
            className="absolute top-1/2 left-0 h-2 bg-linear-to-r from-blue-400 to-blue-600 rounded-full -translate-y-1/2 transition-all duration-700 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />

          {/* Steps Overlay */}
          <div className="relative flex justify-between w-full">
            {steps.map((step, index) => {
              const isActive = index <= activeIndex;
              const isCurrent = index === activeIndex;

              return (
                <div key={step} className="flex flex-col items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-4 z-10 transition-all duration-500 ${
                      isActive
                        ? 'bg-blue-500 border-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.4)]'
                        : 'bg-white border-gray-200'
                    } ${isCurrent ? 'scale-125' : ''}`}
                  />
                  <div
                    className={`absolute top-12 text-[10px] md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                      isActive ? 'text-gray-900' : 'text-gray-400'
                    } ${isCurrent ? 'scale-110' : ''}`}
                    style={{
                      left: `${(index / (steps.length - 1)) * 100}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile View (Vertical) */}
        <div className="block md:hidden relative pr-8 py-2">
          {/* Background Track (Vertical) */}
          <div className="absolute right-[3.5px] top-4 bottom-4 w-1 bg-gray-100 rounded-full" />

          {/* Active Progress Bar (Vertical) */}
          <div
            className="absolute right-[3.5px] top-4 bg-linear-to-b from-blue-400 to-blue-600 rounded-full transition-all duration-700 ease-out"
            style={{
              height:
                activeIndex === 0
                  ? '0%'
                  : `${(activeIndex / (steps.length - 1)) * 100}%`,
              bottom: activeIndex === steps.length - 1 ? '16px' : 'auto',
              width: '4px',
            }}
          />

          <div className="flex flex-col gap-10">
            {steps.map((step, index) => {
              const isActive = index <= activeIndex;
              const isCurrent = index === activeIndex;

              return (
                <div key={step} className="flex items-center gap-4 relative">
                  <div
                    className={`w-3 h-3 rounded-full border-2 z-10 -mr-[29px] transition-colors duration-500 ${
                      isActive
                        ? 'bg-blue-500 border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                        : 'bg-white border-gray-300'
                    } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-bold transition-colors ${
                        isActive ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {step}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
                        الحالة الحالية
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusStepper;
