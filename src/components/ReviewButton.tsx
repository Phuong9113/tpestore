"use client"

import { Button } from "@/components/ui/button"
import { StarIcon } from "@heroicons/react/24/solid"

interface ReviewButtonProps {
  productId: string
  productName: string
  productImage: string
  orderId: string
  hasReviewed: boolean
  onReviewClick: () => void
}

export default function ReviewButton({
  productId,
  productName,
  productImage,
  orderId,
  hasReviewed,
  onReviewClick,
}: ReviewButtonProps) {
  if (hasReviewed) {
    return (
      <Button
        variant="outline"
        disabled
        className="w-full"
      >
        <StarIcon className="w-4 h-4 mr-2 text-yellow-400" />
        Đã đánh giá
      </Button>
    )
  }

  return (
    <Button
      onClick={onReviewClick}
      className="w-full"
    >
      <StarIcon className="w-4 h-4 mr-2" />
      Đánh giá sản phẩm
    </Button>
  )
}

