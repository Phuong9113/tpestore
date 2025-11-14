"use client"

import { useState, useEffect } from "react"
import { StarIcon } from "@heroicons/react/24/solid"
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline"
import { getProductReviews, type Review, type ReviewsResponse } from "@/lib/api"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface ProductReviewsProps {
  productId: string
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 10

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true)
      try {
        const data = await getProductReviews(productId, page, limit)
        setReviewsData(data)
      } catch (error) {
        console.error("Error fetching reviews:", error)
        setReviewsData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [productId, page])

  if (loading) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Đánh giá sản phẩm</h2>
        <div className="text-center py-8 text-muted-foreground">Đang tải đánh giá...</div>
      </div>
    )
  }

  if (!reviewsData || reviewsData.reviews.length === 0) {
    return (
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Đánh giá sản phẩm</h2>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">Chưa có đánh giá nào cho sản phẩm này.</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Đánh giá sản phẩm</h2>
        {reviewsData.averageRating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span key={i}>
                  {i < Math.round(reviewsData.averageRating) ? (
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <StarOutlineIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </span>
              ))}
            </div>
            <span className="text-lg font-semibold text-foreground">
              {reviewsData.averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({reviewsData.pagination.total} đánh giá)
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {reviewsData.reviews.map((review: Review) => (
          <div
            key={review.id}
            className="bg-card border border-border rounded-xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">
                    {review.user.name?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {review.user.name || "Người dùng"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>
                    {i < review.rating ? (
                      <StarIcon className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <StarOutlineIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-foreground leading-relaxed">{review.comment}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {reviewsData.pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {[...Array(reviewsData.pagination.totalPages)].map((_, i) => {
                const pageNum = i + 1
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setPage(pageNum)}
                      isActive={page === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setPage((p) => Math.min(reviewsData.pagination.totalPages, p + 1))
                  }
                  className={
                    page === reviewsData.pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}

