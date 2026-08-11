'use server';
import { userEventsQueue } from '@packages/utils/queue';

export async function sendUserEvent(eventData: {
  userId: string;
  productId: string;
  action: string;
  shopId: string;
  city: string;
  device: string;
}) {
  try {
    await userEventsQueue.add('user-event', eventData, {
      removeOnComplete: true,
      removeOnFail: 1000, // keep last 1000 failed jobs for debugging
    });
  } catch (error) {
    console.error('Error adding event to queue:', error);
  }
}