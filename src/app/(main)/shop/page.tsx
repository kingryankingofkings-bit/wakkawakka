'use client';

import { useState } from 'react';
import { ShoppingBag, Search, Star, Plus, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { formatCurrency, formatCount, cn } from '@/lib/utils';
import { MOCK_PRODUCTS, MOCK_USERS } from '@/lib/mockData';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Digital Downloads', 'Music', 'Art', 'Physical', 'Services'];

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={cn('h-3.5 w-3.5', i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}

export default function ShopPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const { addItem, items, isOpen, toggleCart } = useCartStore();

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const filtered = MOCK_PRODUCTS.filter(p =>
    (category === 'All' || p.category === category) &&
    (query === '' || p.name.toLowerCase().includes(query.toLowerCase()))
  );

  function handleAddToCart(product: typeof MOCK_PRODUCTS[0]) {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Shop</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => alert('Creator store setup coming soon!')}>
            <Plus className="h-4 w-4" />
            Sell
          </Button>
          <button
            onClick={toggleCart}
            className="relative p-2 rounded-xl hover:bg-muted transition-colors"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Search */}
        <Input
          placeholder="Search products..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors',
                category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured banner */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-primary/80 to-purple-600/80 p-5 text-white relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/shopbanner/800/200')] bg-cover" />
          <div className="relative">
            <p className="text-xs font-semibold opacity-80 uppercase tracking-wider mb-1">Featured</p>
            <h2 className="text-xl font-bold mb-1">Creator Marketplace</h2>
            <p className="text-sm opacity-80 mb-3">Support creators by buying their digital goods</p>
            <Button size="sm" variant="secondary" className="text-foreground">
              Browse All <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Products grid */}
        <div>
          <h2 className="font-bold text-lg mb-3">
            {category === 'All' ? 'All Products' : category}
            <span className="text-sm font-normal text-muted-foreground ml-2">({filtered.length})</span>
          </h2>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-semibold">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(product => (
                <Card key={product.id} padding="none" className="overflow-hidden hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {product.images[0] && (
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
                    )}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold bg-black/60 px-3 py-1 rounded-full text-sm">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Avatar src={product.seller.avatar} name={product.seller.displayName} size="xs" />
                      <span className="text-xs text-muted-foreground">{product.seller.displayName}</span>
                    </div>
                    <p className="font-semibold text-sm leading-tight">{product.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    {product.rating && <StarRating rating={product.rating} count={product.reviewCount} />}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base font-bold text-primary">{formatCurrency(product.price)}</span>
                      <Button
                        size="xs"
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Creators selling */}
        <div>
          <h2 className="font-bold text-lg mb-3">Top Sellers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MOCK_USERS.slice(0, 4).map(seller => (
              <Card key={seller.id} padding="sm" hover className="flex flex-col items-center text-center gap-2">
                <Avatar src={seller.avatar} name={seller.displayName} size="lg" />
                <div>
                  <p className="text-sm font-semibold">{seller.displayName}</p>
                  <p className="text-xs text-muted-foreground">{seller.isPremium ? 'Premium Creator' : 'Creator'}</p>
                </div>
                <Button size="xs" variant="outline">View Shop</Button>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={toggleCart} />
          <div className="relative w-80 h-full bg-card border-l border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold">Cart ({cartCount})</h2>
              <button onClick={toggleCart} className="p-1 hover:bg-muted rounded-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-center">
                  <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Your cart is empty</p>
                </div>
              ) : (
                items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <img src={product.images[0]} alt={product.name} className="h-14 w-14 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(product.price)}</p>
                    </div>
                    <span className="text-sm font-medium">×{quantity}</span>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Subtotal</span>
                  <span>{formatCurrency(items.reduce((sum, i) => sum + i.product.price * i.quantity, 0))}</span>
                </div>
                <Button className="w-full" onClick={() => toast.success('Checkout coming soon!')}>
                  Checkout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
