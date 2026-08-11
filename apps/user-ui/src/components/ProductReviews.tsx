'use client';

import { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
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
  userId?: string;
}

export default function ProductReviews({ productId, userId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
    if (userId) {
      checkCanReview();
      fetchUserReview();
    }
  }, [productId, userId]);

  const fetchReviews = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/user/api/reviews/product/${productId}`
      );
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/user/api/reviews/can-review/${productId}`
      );
      setCanReview(data.canReview);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const fetchUserReview = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/user/api/reviews/user/${productId}`
      );
      if (data.review) {
        setUserReview(data.review);
        setRating(data.review.rating);
        setComment(data.review.comment);
      }
    } catch (error) {
      console.error('Error fetching user review:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing && userReview) {
        // Update existing review
        const { data } = await axiosInstance.put(
          `/user/api/reviews/${userReview.id}`,
          { rating, comment },
        );
        setUserReview(data.review);
        alert('Review updated successfully!');
      } else {
        // Create new review
        const { data } = await axiosInstance.post(
          `/user/api/reviews/create`,
          { productId, rating, comment },
        );
        setUserReview(data.review);
        alert('Review submitted successfully!');
      }
      
      setShowReviewForm(false);
      setIsEditing(false);
      fetchReviews();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview || !confirm('Are you sure you want to delete your review?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/user/api/reviews/${userReview.id}`);
      setUserReview(null);
      setRating(5);
      setComment('');
      alert('Review deleted successfully!');
      fetchReviews();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete review');
    }
  };

  const handleEditReview = () => {
    setIsEditing(true);
    setShowReviewForm(true);
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate?.(star)}
            className={`text-2xl ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading reviews...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

      {/* User Review Section */}
      {userId && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          {userReview && !showReviewForm ? (
            <div>
              <h3 className="font-semibold mb-2">Your Review</h3>
              <div className="mb-2">{renderStars(userReview.rating)}</div>
              <p className="text-gray-700 mb-3">{userReview.comment}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleEditReview}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit Review
                </button>
                <button
                  onClick={handleDeleteReview}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete Review
                </button>
              </div>
            </div>
          ) : canReview && !userReview ? (
            <div>
              {!showReviewForm ? (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Write a Review
                </button>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <h3 className="font-semibold">
                    {isEditing ? 'Edit Your Review' : 'Write Your Review'}
                  </h3>
                  
                  <div>
                    <label className="block mb-2 font-medium">Rating</label>
                    {renderStars(rating, true, setRating)}
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">Comment</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                      rows={4}
                      placeholder="Share your experience with this product..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                    >
                      {submitting ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false);
                        setIsEditing(false);
                      }}
                      className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : showReviewForm && isEditing ? (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <h3 className="font-semibold">Edit Your Review</h3>
              
              <div>
                <label className="block mb-2 font-medium">Rating</label>
                {renderStars(rating, true, setRating)}
              </div>

              <div>
                <label className="block mb-2 font-medium">Comment</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="Share your experience with this product..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {submitting ? 'Submitting...' : 'Update Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setIsEditing(false);
                    if (userReview) {
                      setRating(userReview.rating);
                      setComment(userReview.comment);
                    }
                  }}
                  className="px-6 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : !canReview && !userReview ? (
            <p className="text-gray-600">
              ℹ️ You can only review products you have purchased and received.
            </p>
          ) : null}
        </div>
      )}

      {/* All Reviews */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">
          All Reviews ({reviews.length})
        </h3>
        
        {reviews.length === 0 ? (
          <p className="text-gray-500">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center relative">
                  {review.user.avatar ? (
                    <SafeImage
                      src={review.user.avatar}
                      alt={review.user.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold">
                      {review.user.name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.user.name}</span>
                    {review.isVerifiedPurchase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-2">{renderStars(review.rating)}</div>
                  
                  <p className="text-gray-700 mb-2">{review.comment}</p>
                  
                  <span className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
