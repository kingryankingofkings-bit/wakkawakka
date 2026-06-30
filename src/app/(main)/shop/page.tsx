'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ShoppingBag, ShoppingCart, Search, Star, Plus, ChevronRight, X, CreditCard, ShieldCheck, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
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
  const { addItem, items, isOpen, toggleCart, clearCart, fetchCart } = useCartStore();

  // Checkout States
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'form' | 'processing' | 'success'>('form');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [realOrderId, setRealOrderId] = useState('');

  // Product Details Modal States
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Products from Database
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchCart();
    fetch('/api/marketplace')
      .then((res) => res.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          const parsed = json.data.map((p: any) => {
            let images = p.images;
            if (typeof images === 'string') {
              try {
                images = JSON.parse(images);
              } catch {
                images = [];
              }
            }
            return {
              ...p,
              images: Array.isArray(images) && images.length > 0 ? images : ['https://picsum.photos/seed/' + p.id + '/400/400'],
            };
          });
          setDbProducts(parsed);
        }
      })
      .catch((err) => console.error('Failed to load products:', err));
  }, [fetchCart]);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const activeProducts = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;

  const filtered = activeProducts.filter(p =>
    (category === 'All' || p.category === category) &&
    (query === '' || p.name.toLowerCase().includes(query.toLowerCase()))
  );

  function handleAddToCart(product: any) {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  }

  // Real Checkout Submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !cardExpiry || !cardCVC) {
      toast.error('Please fill in all credit card details');
      return;
    }

    setCheckoutStep('processing');
    try {
      const res = await fetch('/api/marketplace/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': useAuthStore.getState().user?.id || '',
        },
        body: JSON.stringify({
          shippingAddress: 'Digital Delivery to ' + cardName,
          notes: 'Credit Card Checkout Sandbox',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRealOrderId(data.orderId);
        setCheckoutStep('success');
        toast.success('Payment authorized successfully!');
      } else {
        toast.error(data.error || 'Checkout failed');
        setCheckoutStep('form');
      }
    } catch (err) {
      toast.error('Network error during checkout');
      setCheckoutStep('form');
    }
  };

  const handleFinishCheckout = () => {
    clearCart();
    setShowCheckout(false);
    setCheckoutStep('form');
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCVC('');
    setRealOrderId('');
  };

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
                'px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors',
                category === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured banner */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-primary/85 via-indigo-600/80 to-purple-600/80 p-5 text-white relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/shopbanner/800/200')] bg-cover" />
          <div className="relative">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-1">Featured</p>
            <h2 className="text-xl font-bold mb-1">Creator Marketplace</h2>
            <p className="text-sm opacity-80 mb-3">Support creators by buying their digital goods</p>
            <Button size="sm" variant="secondary" className="text-foreground">
              Browse All <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>



        {/* Products grid */}
        <div>
          <h2 className="font-bold text-base mb-3">
            {category === 'All' ? 'All Products' : category}
            <span className="text-xs font-normal text-muted-foreground ml-2">({filtered.length})</span>
          </h2>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-sm">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map(product => (
                <Card
                  key={product.id}
                  padding="none"
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowDetailModal(true);
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {product.images[0] && (
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" />
                    )}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold bg-black/60 px-3 py-1 rounded-full text-xs">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Avatar src={product.seller.avatar} name={product.seller.displayName} size="xs" />
                      <span className="text-xs text-muted-foreground">{product.seller.displayName}</span>
                    </div>
                    <p className="font-semibold text-sm leading-tight text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    {product.rating && <StarRating rating={product.rating} count={product.reviewCount} />}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base font-bold text-primary">{formatCurrency(product.price)}</span>
                      <Button
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
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
          <h2 className="font-bold text-base mb-3">Top Sellers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MOCK_USERS.slice(0, 4).map(seller => (
              <Card key={seller.id} padding="sm" hover className="flex flex-col items-center text-center gap-2">
                <Avatar src={seller.avatar} name={seller.displayName} size="lg" />
                <div>
                  <p className="text-sm font-semibold">{seller.displayName}</p>
                  <p className="text-[10px] text-muted-foreground">{seller.isPremium ? 'Premium Creator' : 'Creator'}</p>
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
              <h2 className="font-bold text-foreground">Cart ({cartCount})</h2>
              <button onClick={toggleCart} className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground">✕</button>
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
                    <img src={product.images[0]} alt={product.name} className="h-14 w-14 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(product.price)}</p>
                    </div>
                    <span className="text-sm font-medium text-foreground">×{quantity}</span>
                  </div>
                ))
              )}
            </div>
            {items.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-foreground">Subtotal</span>
                  <span className="text-primary">{formatCurrency(subtotal)}</span>
                </div>
                <Button className="w-full" onClick={() => { toggleCart(); setShowCheckout(true); }}>
                  Checkout
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stripe Checkout Simulation Modal */}
      <Modal isOpen={showCheckout} onClose={() => setShowCheckout(false)} title="Checkout Details">
        <AnimatePresence mode="wait">
          {checkoutStep === 'form' && (
            <motion.form
              key="form"
              onSubmit={handleCheckoutSubmit}
              className="space-y-4 p-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-primary font-medium">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Simulated Secure Checkout powered by Stripe sandbox.</span>
              </div>

              {/* Order summary */}
              <div className="border border-border/80 rounded-2xl p-3 bg-muted/20 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Summary</h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex justify-between text-xs text-foreground font-semibold">
                      <span className="truncate max-w-[200px]">{product.name} (x{quantity})</span>
                      <span>{formatCurrency(product.price * quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-border my-2" />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Cardholder Name</label>
                  <Input
                    required
                    placeholder="Jane Doe"
                    value={cardName}
                    onChange={e => setCardName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Card Number</label>
                  <Input
                    required
                    maxLength={19}
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    leftIcon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Expiration Date</label>
                    <Input
                      required
                      maxLength={5}
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">CVC / CVV</label>
                    <Input
                      required
                      maxLength={3}
                      placeholder="123"
                      value={cardCVC}
                      onChange={e => setCardCVC(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <Button variant="ghost" onClick={() => setShowCheckout(false)}>Cancel</Button>
                <Button type="submit" className="w-40">Pay {formatCurrency(subtotal)}</Button>
              </div>
            </motion.form>
          )}

          {checkoutStep === 'processing' && (
            <motion.div
              key="processing"
              className="flex flex-col items-center justify-center py-12 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <h4 className="font-semibold text-base text-foreground">Processing secure payment...</h4>
                <p className="text-xs text-muted-foreground">Contacting Stripe payment gateways...</p>
              </div>
            </motion.div>
          )}

          {checkoutStep === 'success' && (
            <motion.div
              key="success"
              className="flex flex-col items-center justify-center py-8 space-y-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <CheckCircle className="h-16 w-16 text-success animate-bounce-subtle" />
              
              <div className="text-center space-y-1">
                <h3 className="font-bold text-lg text-foreground">Payment Successful!</h3>
                <p className="text-xs text-muted-foreground">Thank you for supporting creators on Wakka</p>
              </div>

              <div className="border border-border/80 bg-muted/20 rounded-2xl p-4 w-full text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-bold text-foreground">{realOrderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card ending in</span>
                  <span className="font-bold text-foreground">•••• 4242</span>
                </div>
                <div className="flex justify-between border-t border-border/80 pt-2 font-bold text-sm">
                  <span className="text-foreground">Total Paid</span>
                  <span className="text-primary">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <Button onClick={handleFinishCheckout} className="w-full">
                Close & Clear Cart
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Product Details">
          <div className="p-5 space-y-4">
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-muted">
              <img src={selectedProduct.images[0]} alt={selectedProduct.name} className="h-full w-full object-cover" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {selectedProduct.category}
                </span>
                <span className="text-xs text-muted-foreground font-medium border border-border px-2 py-0.5 rounded-full">
                  Condition: {selectedProduct.condition || 'NEW'}
                </span>
              </div>
              <h3 className="font-bold text-lg text-foreground">{selectedProduct.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
              
              <div className="flex items-center gap-3 pt-2 pb-2 border-y border-border">
                <img src={selectedProduct.seller.avatar || 'https://picsum.photos/seed/avatar/100/100'} alt={selectedProduct.seller.displayName} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedProduct.seller.displayName}</p>
                  {selectedProduct.seller.location && <p className="text-xs text-muted-foreground">{selectedProduct.seller.location}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Price</p>
                  <p className="text-2xl font-extrabold text-foreground">{formatCurrency(selectedProduct.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider text-right">Availability</p>
                  <p className={cn("text-sm font-bold text-right", selectedProduct.stockCount === 0 || !selectedProduct.inStock ? "text-destructive" : "text-success")}>
                    {selectedProduct.stockCount !== null 
                      ? (selectedProduct.stockCount > 0 ? `${selectedProduct.stockCount} in stock` : 'Out of Stock')
                      : 'In Stock'
                    }
                  </p>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={(e) => {
                    handleAddToCart(selectedProduct);
                    setShowDetailModal(false);
                  }}
                  disabled={selectedProduct.stockCount === 0 || !selectedProduct.inStock}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
