'use server';
import { userEventsQueue } from '@packages/utils/queue';

export async function sendKafkaEvent(eventData:{
    userId: string,
    productId: string,
    action: string,
    shopId: string,
    city: string,
    device: string,
}) {
    try {
        await userEventsQueue.add('user-event', {
            userId: eventData.userId,
            productId: eventData.productId,
            action: eventData.action,
            shopId: eventData.shopId,
            city: eventData.city,
            device: eventData.device,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error sending event to BullMQ:', error);
    }
}


