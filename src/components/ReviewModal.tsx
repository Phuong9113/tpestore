"use client"

import { useState } from "react"
import { XMarkIcon, StarIcon } from "@heroicons/react/24/solid"
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createReview } from "@/lib/api"
import { toast } from "sonner"

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  productImage: string
  orderId?: string
  onSuccess?: () => void
}

export default function ReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  orderId,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

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
      await createReview(productId, {
        rating,
        comment: comment.trim(),
        orderId,
      })
      toast.success("Đánh giá đã được gửi thành công!")
      setRating(0)
      setComment("")
      onClose()
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra khi gửi đánh giá")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Đánh giá sản phẩm</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            disabled={submitting}
          >
            <XMarkIcon className="w-6 h-6 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Info */}
          <div className="flex gap-4 p-4 bg-secondary/30 rounded-lg">
            <img
              src={productImage || "/placeholder.svg"}
              alt={productName}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{productName}</h3>
              <p className="text-sm text-muted-foreground mt-1">Sản phẩm trong đơn hàng của bạn</p>
            </div>
          </div>

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
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length} / 500 ký tự
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting || rating < 1 || !comment.trim()}
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

