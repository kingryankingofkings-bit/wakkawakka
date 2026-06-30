'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Coffee, Star, ArrowLeft, ShoppingBag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCommerceStore } from '@/store/commerceStore';
import { formatCurrency } from '@/lib/utils';

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const orders = useCommerceStore(s => s.orders);
  const tips = useCommerceStore(s => s.tips);
  const subscriptions = useCommerceStore(s => s.subscriptions);
  const unsubscribe = useCommerceStore(s => s.unsubscribe);

  const spent = mounted
    ? orders.reduce((s, o) => s + o.total, 0) + tips.reduce((s, t) => s + t.amount, 0)
    : 0;

  return (
    <div className="px-4 py-5 space-y-6">
      <div>
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>
        <h1 className="text-2xl font-bold">Purchases & support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Total spent supporting creators: <span className="font-semibold text-foreground">{formatCurrency(spent)}</span>
        </p>
      </div>

      {!mounted ? null : (
        <>
          {/* Subscriptions */}
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Star className="h-4 w-4 text-primary" /> Active subscriptions</h2>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active subscriptions.</p>
            ) : (
              subscriptions.map(sub => (
                <div key={sub.creatorId} className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3">
                  <div>
                    <p className="text-sm font-semibold">{sub.creatorName}</p>
                    <p className="text-xs text-muted-foreground">{sub.tier} · {formatCurrency(sub.monthly)}/mo</p>
                  </div>
                  <button
                    onClick={() => { unsubscribe(sub.creatorId); toast('Subscription cancelled'); }}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Cancel
                  </button>
                </div>
              ))
            )}
          </section>

          {/* Orders */}
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Package className="h-4 w-4 text-primary" /> Order history</h2>
            {orders.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-2xl">
                <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No orders yet.</p>
                <Link href="/shop" className="text-sm text-primary hover:underline font-medium">Browse the shop</Link>
              </div>
            ) : (
              orders.map(order => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card/60 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">{order.id}</span>
                    <span className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  {order.lines.map(line => (
                    <div key={line.productId} className="flex items-center gap-2">
                      {line.image && <img src={line.image} alt="" className="h-9 w-9 rounded-lg object-cover" />}
                      <span className="flex-1 text-sm truncate">{line.name} <span className="text-muted-foreground">×{line.quantity}</span></span>
                      <span className="text-sm font-medium">{formatCurrency(line.price * line.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(order.total)}</span>
                  </div>
                </motion.div>
              ))
            )}
          </section>

          {/* Tips */}
          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-bold"><Coffee className="h-4 w-4 text-primary" /> Tips sent</h2>
            {tips.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tips sent yet.</p>
            ) : (
              tips.map(tip => (
                <div key={tip.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{tip.creatorName}</p>
                    {tip.message && <p className="text-xs text-muted-foreground truncate">“{tip.message}”</p>}
                  </div>
                  <span className="text-sm font-bold text-primary">{formatCurrency(tip.amount)}</span>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
