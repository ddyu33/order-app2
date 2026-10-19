import { Router } from 'express'
import { pool } from '../db/pool.js'
import { getOrderById } from '../lib/order-repository.js'
import { HttpError, isUuid } from '../lib/http-error.js'
import { listAdminMenus } from './menus.js'

const router = Router()

router.get('/menus', listAdminMenus)

router.patch('/menus/:menuId/stock', async (request, response) => {
  const { menuId } = request.params
  const { adjustment } = request.body ?? {}

  if (!isUuid(menuId)) {
    throw new HttpError(400, 'INVALID_MENU_ID', 'Menu ID must be a UUID')
  }
  if (!Number.isSafeInteger(adjustment) || adjustment === 0) {
    throw new HttpError(400, 'INVALID_ADJUSTMENT', 'Adjustment must be a non-zero integer')
  }

  const result = await pool.query(
    `UPDATE menus
     SET stock_quantity = stock_quantity + $2,
         updated_at = NOW()
     WHERE id = $1
       AND stock_quantity + $2 >= 0
     RETURNING id, stock_quantity AS "stockQuantity"`,
    [menuId, adjustment],
  )

  if (result.rows.length === 0) {
    const menuResult = await pool.query('SELECT 1 FROM menus WHERE id = $1', [menuId])
    if (menuResult.rows.length === 0) {
      throw new HttpError(404, 'MENU_NOT_FOUND', 'Menu was not found')
    }
    throw new HttpError(409, 'INSUFFICIENT_STOCK', 'Stock quantity cannot be negative')
  }

  response.json({
    menu: {
      id: result.rows[0].id,
      stockQuantity: Number(result.rows[0].stockQuantity),
    },
  })
})

router.get('/orders', async (_request, response) => {
  const { rows } = await pool.query(
    'SELECT id FROM orders ORDER BY ordered_at DESC, id DESC',
  )
  const orders = await Promise.all(rows.map(({ id }) => getOrderById(pool, id)))
  response.json({ orders })
})

router.get('/dashboard', async (_request, response) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::integer AS total,
       COUNT(*) FILTER (WHERE status = 'received')::integer AS received,
       COUNT(*) FILTER (WHERE status = 'preparing')::integer AS preparing,
       COUNT(*) FILTER (WHERE status = 'completed')::integer AS completed
     FROM orders`,
  )
  response.json({ dashboard: rows[0] })
})

router.patch('/orders/:orderId/status', async (request, response) => {
  const { orderId } = request.params
  const { status } = request.body ?? {}

  if (!isUuid(orderId)) {
    throw new HttpError(400, 'INVALID_ORDER_ID', 'Order ID must be a UUID')
  }

  const transitions = {
    preparing: 'received',
    completed: 'preparing',
  }
  const expectedStatus = transitions[status]
  if (!expectedStatus) {
    throw new HttpError(400, 'INVALID_STATUS', 'Requested order status is invalid')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const updated = await client.query(
      `UPDATE orders
       SET status = $2,
           updated_at = NOW()
       WHERE id = $1
         AND status = $3
       RETURNING id`,
      [orderId, status, expectedStatus],
    )

    if (updated.rows.length === 0) {
      const current = await client.query('SELECT status FROM orders WHERE id = $1', [orderId])
      if (current.rows.length === 0) {
        throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order was not found')
      }
      throw new HttpError(409, 'INVALID_STATUS_TRANSITION', 'Order status has changed or transition is not allowed')
    }

    const order = await getOrderById(client, orderId)
    await client.query('COMMIT')
    response.json({ order })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})

export default router
