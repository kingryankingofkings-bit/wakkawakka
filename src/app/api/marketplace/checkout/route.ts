import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { shippingAddress, notes } = body;

    // Fetch the active user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty" },
        { status: 400 },
      );
    }

    // Run the checkout transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify stock count of products
      let total = 0;
      for (const item of cart.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || product.isDeleted || !product.isActive) {
          throw new Error(
            `Product "${item.product.name}" is no longer available.`,
          );
        }

        if (product.stockCount !== null) {
          if (product.stockCount < item.quantity) {
            throw new Error(
              `Insufficient stock for "${product.name}". Only ${product.stockCount} left.`,
            );
          }
        }
        total += item.quantity * product.price;
      }

      // 2. Create main Order record calculating total sum
      const order = await tx.order.create({
        data: {
          buyerId: userId,
          productId: null,
          quantity: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          unitPrice: 0,
          total,
          status: "CONFIRMED",
          shippingAddress: shippingAddress || "Digital Delivery",
          notes: notes || "",
        },
      });

      // 3. Create matching OrderItem rows & decrement product stock levels
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.product.price,
          },
        });

        if (item.product.stockCount !== null) {
          const updatedProduct = await tx.product.update({
            where: { id: item.productId },
            data: {
              stockCount: { decrement: item.quantity },
            },
          });

          if (
            updatedProduct.stockCount !== null &&
            updatedProduct.stockCount <= 0
          ) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                inStock: false,
                stockCount: 0,
              },
            });
          }
        }
      }

      // 4. Delete the user's cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });

    return NextResponse.json({ orderId: result.id, total: result.total });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Checkout failed" },
      { status: 400 },
    );
  }
}
