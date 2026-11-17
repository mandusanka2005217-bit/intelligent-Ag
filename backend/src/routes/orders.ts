import { Router } from 'express';
import type { DataStore } from '../data/store';
import { parseOrThrow } from '../middleware/validate';
import { orderCreateSchema, orderStatusUpdateSchema } from './schemas';

export function createOrdersRouter(store: DataStore): Router {
  const router = Router();

  // List orders with optional filters: buyerId, farmerId, status
  router.get('/', (req, res) => {
    const { buyerId, farmerId, status } = req.query;
    const orders = store.listOrders({
      buyerId: buyerId as string | undefined,
      farmerId: farmerId as string | undefined,
      status: status as any,
    });
    res.json(orders);
  });

  // Get single order
  router.get('/:id', (req, res) => {
    res.json(store.getOrder(req.params.id));
  });

  // Create new order
  router.post('/', (req, res) => {
    const scenarioId = (req.query.scenarioId as any) || 'A';
    const body = parseOrThrow(orderCreateSchema, req.body, 'Order creation');
    const order = store.createOrder(body, scenarioId);
    res.status(201).json(order);
  });

  // Update order status (Accept, Reject, Complete, Cancel)
  router.patch('/:id/status', (req, res) => {
    const scenarioId = (req.query.scenarioId as any) || 'A';
    const body = parseOrThrow(orderStatusUpdateSchema, req.body, 'Order status update');
    const updated = store.updateOrderStatus(req.params.id, body, scenarioId);
    res.json(updated);
  });

  return router;
}
