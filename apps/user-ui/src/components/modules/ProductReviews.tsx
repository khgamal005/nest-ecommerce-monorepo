'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import {
  Star,
  ThumbsUp,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  Upload,
  ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useImageManagement } from '../../hooks/useImageManagement';
import { SafeImage } from '@/components/media';

interface Review {
  id: string;
  rating: number;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string;
  };
}

interface ProductReviewsProps {
  productId: string;
  productTitle: string;
  userId?: string;
}

export default function ProductReviews({
  productId,
  productTitle,
  userId,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Image management hook
  const {
    images: reviewImages,
    setImages: setReviewImages,
    uploadImage: uploadReviewImage,
    removeImage: deleteReviewImage,
    uploading: uploadingImage,
    clearImages,
  } = useImageManagement([], 1);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    fetchReviews();
    if (userId) {
      checkCanReview();
      fetchUserReview();
    }
  }, [productId, userId, currentPage, sortBy]);

  const fetchReviews = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/user/api/reviews/product/${productId}?page=${currentPage}&limit=5&sort=${sortBy}`,
      );
      setReviews(data.reviews);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
const { data } = await axiosInstance.get(
        `/user/api/reviews/can-review/${productId}`,
      );
      setCanReview(data.canReview);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const fetchUserReview = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/user/api/reviews/user/${productId}`,
      );
      if (data.review) {
        setUserReview(data.review);
        setRating(data.review.rating);
        setComment(data.review.comment);
        // Map existing images
        setReviewImages(
          data.review.images?.map((url: string) => ({
            url,
            fileId: url.split('/').pop() || url,
          })) || [],
        );
      }
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const imageUrls = reviewImages.map((img) => img.url);

      if (isEditing && userReview) {
        const { data } = await axiosInstance.put(
          `/user/api/reviews/${userReview.id}`,
          { rating, comment, images: imageUrls },
        );
        setUserReview(data.review);
        toast.success('تم تحديث التقييم بنجاح!');
      } else {
        const { data } = await axiosInstance.post(
          `/user/api/reviews/create`,
          { productId, rating, comment, images: imageUrls },
        );
        setUserReview(data.review);
        toast.success('تم إرسال التقييم بنجاح!');
      }

      setShowReviewForm(false);
      setIsEditing(false);
      clearImages();
      fetchReviews();
      // Refresh user review to get latest data
      fetchUserReview();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في إرسال التقييم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadReviewImage(file);
  };

  const handleDeleteReview = async () => {
    if (!userReview || !confirm('هل أنت متأكد من رغبتك في حذف تقييمك؟')) {
      return;
    }

    try {
      await axiosInstance.delete(`/user/api/reviews/${userReview.id}`);
      setUserReview(null);
      setRating(5);
      setComment('');
      clearImages();
      toast.success('تم حذف التقييم بنجاح!');
      fetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'فشل في حذف التقييم');
    }
  };

  const handleEditReview = () => {
    setIsEditing(true);
    setShowReviewForm(true);
  };

  const renderStars = (rating: number, interactive = false, size = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredRating(star)}
            onMouseLeave={() => interactive && setHoveredRating(0)}
            className={`${
              interactive
                ? 'cursor-pointer hover:scale-110 transition-transform'
                : 'cursor-default'
            }`}
          >
            <Star
              className={`${sizeClasses[size as keyof typeof sizeClasses]} ${
                star <= (interactive ? hoveredRating || rating : rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8">
      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">
        تقييمات وآراء العملاء
      </h2>

      {/* User Review Section */}
      {userId && (
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          {userReview && !showReviewForm ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">تقييمك</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditReview}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                  >
                    <Edit2 size={16} />
                    تعديل
                  </button>
                  <button
                    onClick={handleDeleteReview}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
                  >
                    <Trash2 size={16} />
                    حذف
                  </button>
                </div>
              </div>
              <div className="mb-3">
                {renderStars(userReview.rating, false, 'lg')}
              </div>
              <p className="text-gray-700 leading-relaxed">
                {userReview.comment}
              </p>

              {/* User Review Images */}
              {userReview.images && userReview.images.length > 0 && (
                 <div className="grid grid-cols-3 gap-3 mt-4">
                  {userReview.images.map((imageUrl: string, index: number) => (
                    <div
                      key={index}
                      className="relative group h-24 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(imageUrl, '_blank')}
                    >
                      <SafeImage
                        src={imageUrl}
                        alt={`Your review image ${index + 1}`}
                        fill
                        sizes="80px"
                        useNextImage={false}
                        className="object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-500 mt-3">
                تم النشر في {formatDate(userReview.createdAt)}
              </p>
            </div>
          ) : userReview && showReviewForm ? (
            <form onSubmit={handleSubmitReview} className="space-y-5">
              <h3 className="text-lg font-semibold text-gray-900">
                تعديل تقييمك
              </h3>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  تقييمك
                </label>
                {renderStars(rating, true, 'xl')}
                <p className="text-sm text-gray-600 mt-2">
                  {rating === 1 && 'سيء'}
                  {rating === 2 && 'مقبول'}
                  {rating === 3 && 'جيد'}
                  {rating === 4 && 'جيد جداً'}
                  {rating === 5 && 'ممتاز'}
                </p>
              </div>

              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  رأيك
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={5}
                  placeholder="شاركنا برأيك عن هذا المنتج..."
                  required
                />
              </div>

              {/* Image Upload Section */}
              <div>
                <label className="block mb-2 font-medium text-gray-700">
                  إضافة صور (اختياري)
                </label>
                <div className="space-y-3">
                  {/* Upload Button */}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage || reviewImages.length >= 1}
                    />
                    {uploadingImage ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600">جاري الرفع...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-gray-600" />
                        <span className="text-gray-600">
                          {reviewImages.length >= 1
                            ? 'الحد الأقصى صورة واحدة'
                            : 'رفع صورة'}
                        </span>
                      </>
                    )}
                  </label>

                  {/* Image Preview Grid */}
                  {reviewImages.length > 0 && (
                     <div className="grid grid-cols-3 gap-3">
                       {reviewImages.map((image, index) => (
                         <div key={index} className="relative group">
                           <SafeImage
                             src={image.url}
                             alt={`Review ${index + 1}`}
                             fill
                             sizes="80px"
                             useNextImage={false}
                             className="w-full h-24 object-cover rounded-lg border border-gray-200"
                           />
                           <button
                             type="button"
                             onClick={() => deleteReviewImage(index)}
                             className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <X size={14} />
                           </button>
                         </div>
                       ))}
                     </div>
                  )}
                  <p className="text-xs text-gray-500">
                    يمكنك رفع صورة واحدة (الحد الأقصى 10 ميجابايت، سيتم تحسينها
                    تلقائياً)
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
                >
                  {submitting ? 'جاري التحديث...' : 'تحديث التقييم'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setIsEditing(false);
                    clearImages();
                    if (userReview) {
                      setRating(userReview.rating);
                      setComment(userReview.comment);
                      // Reload user review to get fresh data
                      fetchUserReview();
                    }
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  إلغاء
                </button>
              </div>
            </form>
          ) : canReview && !userReview ? (
            <div>
              {!showReviewForm ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-700 mb-4">
                    لقد اشتريت هذا المنتج! شارك تجربتك مع الآخرين.
                  </p>
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    اكتب تقييماً
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900">
                    كتابة تقييمك
                  </h3>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      تقييمك
                    </label>
                    {renderStars(rating, true, 'xl')}
                    <p className="text-sm text-gray-600 mt-2">
                      {rating === 1 && 'سيء'}
                      {rating === 2 && 'مقبول'}
                      {rating === 3 && 'جيد'}
                      {rating === 4 && 'جيد جداً'}
                      {rating === 5 && 'ممتاز'}
                    </p>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      رأيك
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      rows={5}
                      placeholder="شاركنا برأيك عن هذا المنتج..."
                      required
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      إضافة صور (اختياري)
                    </label>
                    <div className="space-y-3">
                      {/* Upload Button */}
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage || reviewImages.length >= 1}
                        />
                        {uploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <span className="text-gray-600">جاري الرفع...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={20} className="text-gray-600" />
                            <span className="text-gray-600">
                              {reviewImages.length >= 1
                                ? 'الحد الأقصى صورة واحدة'
                                : 'رفع صورة'}
                            </span>
                          </>
                        )}
                      </label>

                      {/* Image Preview Grid */}
                      {reviewImages.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {reviewImages.map((image, index) => (
                            <div key={index} className="relative group h-24">
                              <SafeImage
                                src={image.url}
                                alt={`Review ${index + 1}`}
                                fill
                                className="object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => deleteReviewImage(index)}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500">
                        يمكنك رفع صورة واحدة (الحد الأقصى 10 ميجابايت، سيتم
                        تحسينها تلقائياً)
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
                    >
                      {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setRating(5);
                        setComment('');
                        clearImages();
                      }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : !canReview && !userReview ? (
            <div className="text-center py-4">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-gray-700">
                يمكنك فقط تقييم المنتجات التي اشتريتها واستلمتها.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Reviews List Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <h3 className="text-xl font-semibold text-gray-900">
          كل التقييمات ({reviews.length > 0 ? `${reviews.length}+` : '0'})
        </h3>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="latest">الأحدث أولاً</option>
          <option value="highest">الأعلى تقييماً</option>
          <option value="lowest">الأقل تقييماً</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">لا توجد تقييمات بعد</p>
            <p className="text-gray-400 mt-2">كن أول من يقيم هذا المنتج!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-200 pb-6 last:border-0"
            >
              <div className="flex items-start gap-4">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {review.user.avatar ? (
                      <Image
                        src={review.user.avatar}
                        alt={review.user.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span>{review.user.name?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">
                      {review.user.name}
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        <CheckCircle size={12} />
                        تم الشراء
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    {renderStars(review.rating, false, 'sm')}
                  </div>

                  <p className="text-gray-700 leading-relaxed mb-3">
                    {review.comment}
                  </p>

                  {/* Review Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-3">
                      {review.images.map((imageUrl: string, index: number) => (
                        <div
                          key={index}
                          className="relative group h-24 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(imageUrl, '_blank')}
                        >
                          <SafeImage
                            src={imageUrl}
                            alt={`Review image ${index + 1}`}
                            fill
                            className="object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatDate(review.createdAt)}</span>
                    {/* <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                      <ThumbsUp size={14} />
                      Helpful (0)
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8 pt-6 border-t">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            السابق
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
