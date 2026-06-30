import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequestUserId } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';

// GET /api/cart - Fetches active user's cart including items and products
export async function GET(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                seller: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  seller: {
                    select: {
                      id: true,
                      username: true,
                      displayName: true,
                      avatar: true,
                    }
                  }
                }
              }
            }
          }
        }
      });
    }

    return NextResponse.json({ data: cart });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch cart', detail: String(err) }, { status: 500 });
  }
}

// POST /api/cart - Adds a product to the cart (or increments quantity if exists)
export async function POST(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { productId, quantity = 1 } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        }
      }
    });

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true }
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity
        },
        include: { product: true }
      });
    }

    return NextResponse.json({ data: cartItem }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to add item to cart', detail: String(err) }, { status: 500 });
  }
}

// PUT /api/cart - Modifies the quantity of a cart item
export async function PUT(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const { productId, quantity } = await req.json();
    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: 'productId and quantity are required' }, { status: 400 });
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        }
      }
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: existingItem.id } });
      return NextResponse.json({ message: 'Item removed from cart' });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
      include: { product: true }
    });

    return NextResponse.json({ data: updatedItem });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update cart item', detail: String(err) }, { status: 500 });
  }
}

// DELETE /api/cart - Removes an item (or clears cart)
export async function DELETE(req: NextRequest) {
  const userId = getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const action = sp.get('action');
  const productId = sp.get('productId');

  try {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    if (action === 'clear') {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      return NextResponse.json({ message: 'Cart cleared successfully' });
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId is required to remove specific item' }, { status: 400 });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        }
      }
    });

    if (!existingItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id: existingItem.id } });
    return NextResponse.json({ message: 'Item removed from cart' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete cart item(s)', detail: String(err) }, { status: 500 });
  }
}
