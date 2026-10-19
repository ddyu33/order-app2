import { Router } from 'express'
import { pool } from '../db/pool.js'

const router = Router()

async function listMenus(includeStock) {
  const stockColumn = includeStock ? 'menus.stock_quantity AS "stockQuantity",' : ''
  const { rows } = await pool.query(
    `SELECT
       menus.id,
       menus.name,
       menus.description,
       menus.price,
       menus.image_url AS "imageUrl",
       menus.stock_quantity > 0 AS "isAvailable",
       ${stockColumn}
       COALESCE(
         json_agg(
           json_build_object(
             'id', options.id,
             'name', options.name,
             'price', options.price
           )
           ORDER BY options.name
         ) FILTER (WHERE options.id IS NOT NULL),
         '[]'::json
       ) AS options
     FROM menus
     LEFT JOIN options ON options.menu_id = menus.id
     GROUP BY menus.id
     ORDER BY menus.id`,
  )

  return rows.map((menu) => ({
    ...menu,
    price: Number(menu.price),
    ...(includeStock ? { stockQuantity: Number(menu.stockQuantity) } : {}),
    options: menu.options.map((option) => ({
      ...option,
      price: Number(option.price),
    })),
  }))
}

router.get('/', async (_request, response) => {
  response.json({ menus: await listMenus(false) })
})

export async function listAdminMenus(_request, response) {
  response.json({ menus: await listMenus(true) })
}

export default router
