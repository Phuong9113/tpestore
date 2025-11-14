"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { StarIcon } from "@heroicons/react/24/solid"
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createReview, checkUserPurchasedProduct, type PurchaseStatus } from "@/lib/api"
import { toast } from "sonner"
import { me } from "@/lib/auth"

interface ProductReviewFormProps {
  productId: string
  orderId?: string
}

export default function ProductReviewForm({ productId, orderId: propOrderId }: ProductReviewFormProps) {
  const searchParams = useSearchParams()
  // Get orderId from URL params (priority) or from props
  const orderId = searchParams?.get('orderId') || propOrderId
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await me()
        setIsAuthenticated(!!user)
        if (user) {
          // Fetch purchase status - pass orderId if available
          const status = await checkUserPurchasedProduct(productId, orderId)
          setPurchaseStatus(status)
        }
      } catch (error) {
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [productId, orderId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating < 1 || rating > 5) {
      toast.error("Vui lòng chọn số sao từ 1 đến 5")
      return
    }

    if (!comment.trim()) {
      toast.error("Vui lòng nhập bình luận")
      return
    }

    setSubmitting(true)
    try {
      // Use orderId from props or from purchaseStatus
      const reviewOrderId = orderId || purchaseStatus?.orders.find(o => o.isDelivered)?.orderId
      
      await createReview(productId, {
        rating,
        comment: comment.trim(),
        orderId: reviewOrderId,
      })
      toast.success("Đánh giá đã được gửi thành công!")
      setRating(0)
      setComment("")
      
      // Refresh purchase status
      if (isAuthenticated) {
        try {
          const status = await checkUserPurchasedProduct(productId)
          setPurchaseStatus(status)
        } catch (error) {
          console.error("Error refreshing purchase status:", error)
        }
      }
      
      // Refresh page to update order review status
      if (typeof window !== 'undefined') {
        // Small delay to ensure backend has processed the review
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi gửi đánh giá")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mt-8 bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground">Đang kiểm tra...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // If orderId is provided from URL, be more lenient - user came from order page
  const hasOrderIdFromUrl = !!orderId && !!searchParams?.get('orderId')
  const hasDeliveredOrderInStatus = purchaseStatus?.orders?.some(o => o.isDelivered) ?? false
  
  // If user came with orderId from URL, allow review form even if backend check fails or is null
  // The backend will validate when submitting
  if (!purchaseStatus || !purchaseStatus.hasPurchased) {
    if (hasOrderIdFromUrl) {
      // Still show the form - backend will validate on submit
      // This handles cases where order status might not be updated but order is delivered
      // Continue to show form below
    } else {
      return null
    }
  }

  // Check if already reviewed - if orderId is provided, only block if review is for this specific order
  if (purchaseStatus?.hasReviewed) {
    // If orderId is provided from URL, only block if we're sure it's for this order
    // Otherwise, allow review (might be for different order)
    if (!hasOrderIdFromUrl || purchaseStatus.reviewId) {
      return (
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <StarIcon className="w-5 h-5 text-yellow-400" />
            <p className="font-medium">Bạn đã đánh giá sản phẩm này</p>
          </div>
        </div>
      )
    }
    // If orderId is provided but review might be for different order, allow review
  }

  // Check if can review - if orderId is provided from URL, be more lenient
  if (purchaseStatus && !purchaseStatus.canReview) {
    // If user came with orderId from URL, still allow review form
    // Backend will validate on submit
    if (!hasOrderIdFromUrl) {
      // Show more detailed message only if no orderId from URL
      const hasDeliveredOrder = purchaseStatus.orders.some(o => o.isDelivered)
      return (
        <div className="mt-8 bg-card border border-border rounded-xl p-6">
          <p className="text-muted-foreground">
            {hasDeliveredOrder 
              ? "Bạn đã đánh giá sản phẩm này rồi hoặc đơn hàng chưa được giao thành công."
              : "Đơn hàng của bạn chưa được giao. Vui lòng đợi đơn hàng được giao thành công để có thể đánh giá."}
          </p>
        </div>
      )
    }
    // If hasOrderIdFromUrl, continue to show form below
  }

  return (
    <div className="mt-8 bg-card border border-border rounded-xl p-6">
      <h3 className="text-xl font-bold text-foreground mb-4">Đánh giá sản phẩm</h3>
      <p className="text-sm text-muted-foreground mb-6">
        {hasOrderIdFromUrl && (!purchaseStatus || !purchaseStatus.hasPurchased)
          ? "Hãy chia sẻ trải nghiệm của bạn về sản phẩm này!"
          : "Bạn đã mua sản phẩm này. Hãy chia sẻ trải nghiệm của bạn!"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Đánh giá của bạn <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none"
                disabled={submitting}
              >
                {(hoveredRating >= star || rating >= star) ? (
                  <StarIcon className="w-8 h-8 text-yellow-400" />
                ) : (
                  <StarOutlineIcon className="w-8 h-8 text-muted-foreground" />
                )}
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                {rating === 1 && "Rất tệ"}
                {rating === 2 && "Tệ"}
                {rating === 3 && "Bình thường"}
                {rating === 4 && "Tốt"}
                {rating === 5 && "Rất tốt"}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
            Bình luận <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            rows={5}
            className="resize-none"
            disabled={submitting}
            required
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {comment.length} / 500 ký tự
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={submitting || rating < 1 || !comment.trim()}
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </div>
      </form>
    </div>
  )
}

