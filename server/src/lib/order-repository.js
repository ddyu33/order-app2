export async function getOrderById(queryable, orderId) {
  const { rows } = await queryable.query(
    `SELECT
       id,
       ordered_at AS "orderedAt",
       status,
       total_amount AS "totalAmount"
     FROM orders
     WHERE id = $1`,
    [orderId],
  )

  if (rows.length === 0) return null

  const order = rows[0]
  const itemResult = await queryable.query(
    `SELECT
       items.id,
       items.menu_id AS "menuId",
       items.menu_name AS "menuName",
       items.quantity,
       items.unit_price AS "unitPrice",
       items.line_total AS "lineTotal",
       COALESCE(
         json_agg(
           json_build_object(
             'id', item_options.option_id,
             'name', item_options.option_name,
             'price', item_options.option_price
           )
           ORDER BY item_options.option_name
         ) FILTER (WHERE item_options.id IS NOT NULL),
         '[]'::json
       ) AS options
     FROM order_items AS items
     LEFT JOIN order_item_options AS item_options
       ON item_options.order_item_id = items.id
     WHERE items.order_id = $1
     GROUP BY items.id
     ORDER BY items.id`,
    [orderId],
  )

  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    items: itemResult.rows.map((item) => ({
      id: item.id,
      menuId: item.menuId,
      menuName: item.menuName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      options: item.options.map((option) => ({
        ...option,
        price: Number(option.price),
      })),
    })),
  }
}
