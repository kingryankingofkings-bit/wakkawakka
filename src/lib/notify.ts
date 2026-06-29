import { prisma } from '@/lib/prisma';

interface NotifyInput {
  userId: string;       // recipient
  actorId?: string;     // who triggered it
  type: string;         // NotificationType
  targetId?: string;
  targetType?: string;
  message?: string;
  actionUrl?: string;
  imageUrl?: string;
}

/**
 * Create a notification. Never throws — notification failures must not break the
 * primary action that triggered them.
 */
export async function notify(input: NotifyInput): Promise<void> {
  if (input.actorId && input.actorId === input.userId) return; // no self-notifications
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        actorId: input.actorId,
        type: input.type,
        targetId: input.targetId,
        targetType: input.targetType,
        message: input.message,
        actionUrl: input.actionUrl,
        imageUrl: input.imageUrl,
      },
    });
  } catch {
    // swallow — best-effort
  }
}
