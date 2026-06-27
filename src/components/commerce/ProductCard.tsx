'use client';

import { useState } from 'react';
import { Heart, ShoppingCart, Star, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { cn, formatCurrency, truncate } from '@/lib/utils';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';

interface ProductCardProps {
  product: Product;
  className?: string;
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.min(1, Math.max(0, rating - i));
          const pct = Math.round(fill * 100);
          return (
            <span key={i} className="relative inline-block w-4 h-4">
              <Star className="w-4 h-4 text-gray-300 fill-gray-300 absolute inset-0" />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${pct}%` }}
              >
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </span>
            </span>
          );
        })}
      </div>
      {reviewCount !== undefined && (
        <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>
      )}
    </div>
  );
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const images = product.images.length > 0 ? product.images : ['https://picsum.photos/seed/placeholder/400/400'];

  function handlePrev(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((c) => (c - 1 + images.length) % images.length);
  }

  function handleNext(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((c) => (c + 1) % images.length);
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    addItem(product);
    setAddedToCart(true);
    openCart();
    setTimeout(() => setAddedToCart(false), 2000);
  }

  function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    setIsSaved((s) => !s);
  }

  return (
    <div
      className={cn(
        'group relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col',
        className
      )}
    >
      {/* Image carousel */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={images[currentImage]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 300px"
          unoptimized
        />

        {/* Carousel controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setCurrentImage(i); }}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all',
                    i === currentImage ? 'bg-white w-3' : 'bg-white/60'
                  )}
                  aria-label={`Image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleSave}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm',
            isSaved
              ? 'bg-red-500 text-white'
              : 'bg-white/90 backdrop-blur-sm text-muted-foreground hover:text-red-500 hover:bg-white'
          )}
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart className={cn('w-4 h-4', isSaved && 'fill-current')} />
        </button>

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/50 backdrop-blur-sm text-white">
            {product.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-3 flex-1">
        {/* Seller info */}
        <div className="flex items-center gap-1.5">
          <div className="relative w-5 h-5 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {product.seller.avatar ? (
              <Image
                src={product.seller.avatar}
                alt={product.seller.displayName}
                fill
                className="object-cover"
                sizes="20px"
                unoptimized
              />
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground flex items-center justify-center w-full h-full">
                {product.seller.displayName[0]}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {product.seller.displayName}
          </span>
          {product.seller.isVerified && (
            <CheckCircle2 className="w-3 h-3 text-blue-500 flex-shrink-0" />
          )}
        </div>

        {/* Product name */}
        <h3 className="font-semibold text-sm leading-snug text-foreground">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed flex-1">
          {truncate(product.description, 80)}
        </p>

        {/* Rating */}
        {product.rating !== undefined && (
          <StarRating rating={product.rating} reviewCount={product.reviewCount} />
        )}

        {/* Price + Add to cart */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="font-bold text-base text-foreground">
            {formatCurrency(product.price)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={addedToCart}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
              addedToCart
                ? 'bg-green-500 text-white'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            )}
          >
            {addedToCart ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Added
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
