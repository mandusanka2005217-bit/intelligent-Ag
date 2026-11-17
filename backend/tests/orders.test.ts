import { describe, expect, it } from 'vitest';
import supertest from 'supertest';
import pino from 'pino';
import { createApp } from '../src/app';
import { loadData } from '../src/data/loader';
import { DataStore } from '../src/data/store';

describe('Orders and Inventory Management API', () => {
  const loaded = loadData();
  const store = new DataStore(loaded);
  const app = createApp(store, { logger: pino({ level: 'silent' }), serveFrontend: false });
  const request = supertest(app);

  it('creates an order with valid stock and initial Pending status', async () => {
    // Farmer F01 has Tomato stock
    const farmer = store.getFarmer('A', 'F01');
    const initialQty = farmer.quantityKg;

    const res = await request
      .post('/api/orders')
      .send({
        buyerId: 'B01',
        buyerName: 'Keells Logistics',
        farmerId: 'F01',
        cropId: 'F01',
        quantityKg: 100,
        deliveryLocation: 'Colombo',
        orderNote: 'Urgent fresh delivery',
        buyerContact: '+94 77 123 4567',
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.orderStatus).toBe('Pending');
    expect(res.body.quantityKg).toBe(100);
    expect(res.body.totalAmount).toBe(100 * farmer.pricePerKg);

    // Initial pending order does not decrease quantity or reserve yet
    const fAfter = store.getFarmer('A', 'F01');
    expect(fAfter.quantityKg).toBe(initialQty);
    expect(fAfter.reservedKg).toBe(0);

    const orderId = res.body.id;

    // Accept order: reserves quantity
    const acceptRes = await request
      .patch(`/api/orders/${orderId}/status`)
      .send({ orderStatus: 'Accepted' })
      .expect(200);

    expect(acceptRes.body.orderStatus).toBe('Accepted');
    const fAccepted = store.getFarmer('A', 'F01');
    expect(fAccepted.reservedKg).toBe(100);

    // Complete order: moves reserved to completed
    const completeRes = await request
      .patch(`/api/orders/${orderId}/status`)
      .send({ orderStatus: 'Completed' })
      .expect(200);

    expect(completeRes.body.orderStatus).toBe('Completed');
    const fCompleted = store.getFarmer('A', 'F01');
    expect(fCompleted.reservedKg).toBe(0);
    expect(fCompleted.completedKg).toBe(100);
  });

  it('rejects order placement exceeding available stock', async () => {
    const farmer = store.getFarmer('A', 'F02');
    const tooMuch = farmer.quantityKg + 50000;

    const res = await request
      .post('/api/orders')
      .send({
        buyerId: 'B02',
        buyerName: 'Cargills',
        farmerId: 'F02',
        cropId: 'F02',
        quantityKg: tooMuch,
        deliveryLocation: 'Kandy',
      })
      .expect(400);

    expect(res.body.error.message).toContain('exceeds available quantity');
  });

  it('releases reserved quantity when an accepted order is rejected', async () => {
    const createRes = await request
      .post('/api/orders')
      .send({
        buyerId: 'B01',
        buyerName: 'Keells',
        farmerId: 'F03',
        cropId: 'F03',
        quantityKg: 50,
        deliveryLocation: 'Peliyagoda',
      })
      .expect(201);

    const orderId = createRes.body.id;

    // Accept
    await request
      .patch(`/api/orders/${orderId}/status`)
      .send({ orderStatus: 'Accepted' })
      .expect(200);

    expect(store.getFarmer('A', 'F03').reservedKg).toBe(50);

    // Reject with reason
    const rejectRes = await request
      .patch(`/api/orders/${orderId}/status`)
      .send({ orderStatus: 'Rejected', rejectionReason: 'Weather damage to harvest' })
      .expect(200);

    expect(rejectRes.body.orderStatus).toBe('Rejected');
    expect(rejectRes.body.rejectionReason).toBe('Weather damage to harvest');
    expect(store.getFarmer('A', 'F03').reservedKg).toBe(0);
  });
});
