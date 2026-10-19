import { Router } from 'express'
import { pool } from '../db/pool.js'
import { getOrderById } from '../lib/order-repository.js'
import { HttpError, isUuid } from '../lib/http-error.js'

const router = Router()
const MAX_INTEGER = 2_147_483_647

function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    throw new HttpError(400, 'INVALID_ITEMS', 'Order must contain between 1 and 100 items')
  }

  for (const item of items) {
    if (
      !item ||
      !isUuid(item.menuId) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      !Array.isArray(item.optionIds) ||
      item.optionIds.some((optionId) => !isUuid(optionId)) ||
      new Set(item.optionIds).size !== item.optionIds.length
    ) {
      throw new HttpError(400, 'INVALID_ITEMS', 'Order item data is invalid')
    }
  }
}

router.post('/', async (request, response) => {
  const { items } = request.body ?? {}
  validateOrderItems(items)

  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const menuIds = [...new Set(items.map((item) => item.menuId))].sort()
    const menuResult = await client.query(
      `SELECT id, name, price, stock_quantity AS "stockQuantity"
       FROM menus
       WHERE id = ANY($1::uuid[])
       ORDER BY id
       FOR UPDATE`,
      [menuIds],
    )
    const menusById = new Map(menuResult.rows.map((menu) => [menu.id, menu]))

    if (menusById.size !== menuIds.length) {
      throw new HttpError(404, 'MENU_NOT_FOUND', 'One or more menus were not found')
    }

    const optionIds = [...new Set(items.flatMap((item) => item.optionIds))]
    const optionsResult =
      optionIds.length === 0
        ? { rows: [] }
        : await client.query(
            `SELECT id, menu_id AS "menuId", name, price
             FROM options
             WHERE id = ANY($1::uuid[])`,
            [optionIds],
          )
    const optionsById = new Map(optionsResult.rows.map((option) => [option.id, option]))

    if (optionsById.size !== optionIds.length) {
      throw new HttpError(404, 'OPTION_NOT_FOUND', 'One or more options were not found')
    }

    const pricedItems = items.map((item) => {
      const menu = menusById.get(item.menuId)
      const options = item.optionIds.map((optionId) => {
        const option = optionsById.get(optionId)
        if (option.menuId !== menu.id) {
          throw new HttpError(400, 'OPTION_MENU_MISMATCH', 'Option does not belong to the selected menu')
        }
        return option
      })
      const unitPrice =
        Number(menu.price) +
        options.reduce((total, option) => total + Number(option.price), 0)
      const lineTotal = unitPrice * item.quantity

      if (!Number.isSafeInteger(lineTotal) || lineTotal > MAX_INTEGER) {
        throw new HttpError(400, 'ORDER_TOTAL_TOO_LARGE', 'Order amount is too large')
      }

      return { ...item, menu, options, unitPrice, lineTotal }
    })

    const requestedQuantities = new Map()
    for (const item of pricedItems) {
      requestedQuantities.set(
        item.menu.id,
        (requestedQuantities.get(item.menu.id) ?? 0) + item.quantity,
      )
    }

    for (const [menuId, quantity] of requestedQuantities) {
      const menu = menusById.get(menuId)
      if (quantity > Number(menu.stockQuantity)) {
        throw new HttpError(409, 'INSUFFICIENT_STOCK', `${menu.name} 재고가 부족합니다.`)
      }
    }

    const totalAmount = pricedItems.reduce((total, item) => total + item.lineTotal, 0)
    if (!Number.isSafeInteger(totalAmount) || totalAmount > MAX_INTEGER) {
      throw new HttpError(400, 'ORDER_TOTAL_TOO_LARGE', 'Order amount is too large')
    }

    const orderResult = await client.query(
      `INSERT INTO orders (total_amount)
       VALUES ($1)
       RETURNING id`,
      [totalAmount],
    )
    const orderId = orderResult.rows[0].id

    for (const item of pricedItems) {
      const itemResult = await client.query(
        `INSERT INTO order_items (
           order_id, menu_id, menu_name, quantity, unit_price, line_total
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          orderId,
          item.menu.id,
          item.menu.name,
          item.quantity,
          item.unitPrice,
          item.lineTotal,
        ],
      )
      const orderItemId = itemResult.rows[0].id

      for (const option of item.options) {
        await client.query(
          `INSERT INTO order_item_options (
             order_item_id, option_id, option_name, option_price
           )
           VALUES ($1, $2, $3, $4)`,
          [orderItemId, option.id, option.name, option.price],
        )
      }
    }

    for (const [menuId, quantity] of requestedQuantities) {
      await client.query(
        `UPDATE menus
         SET stock_quantity = stock_quantity - $2,
             updated_at = NOW()
         WHERE id = $1`,
        [menuId, quantity],
      )
    }

    const order = await getOrderById(client, orderId)
    await client.query('COMMIT')
    response.status(201).json({ order })
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
})

router.get('/:orderId', async (request, response) => {
  const { orderId } = request.params
  if (!isUuid(orderId)) {
    throw new HttpError(400, 'INVALID_ORDER_ID', 'Order ID must be a UUID')
  }

  const order = await getOrderById(pool, orderId)
  if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND', 'Order was not found')
  response.json({ order })
})

export default router
