import { useEffect, useMemo, useState } from 'react'
import './App.css'

const currency = new Intl.NumberFormat('ko-KR')
const formatPrice = (price) => `${currency.format(price)}원`
const getCoffeeStyle = (name) =>
  name.includes('ICE') ? 'iced' : name.includes('HOT') ? 'hot' : 'latte'
const orderStatuses = {
  received: '주문접수',
  preparing: '제조 중',
  completed: '제조 완료',
}

async function requestJson(url, options) {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error?.message ?? `요청에 실패했습니다. (${response.status})`)
  }

  return data
}

function CoffeeIllustration({ style, imageUrl }) {
  return (
    <div className={`coffee-art coffee-art--${style}`} aria-hidden="true">
      {imageUrl ? (
        <img className="coffee-art__image" src={imageUrl} alt="" />
      ) : (
        <>
          <span className="coffee-art__steam coffee-art__steam--one" />
          <span className="coffee-art__steam coffee-art__steam--two" />
          <span className="coffee-art__cup">
            <span className="coffee-art__drink" />
            <span className="coffee-art__sleeve" />
            <span className="coffee-art__logo">C</span>
          </span>
          <span className="coffee-art__shadow" />
          <span className="coffee-art__caption">COZY COFFEE</span>
        </>
      )}
    </div>
  )
}

function AdminDashboard({
  inventory,
  onStockChange,
  orders,
  dashboard,
  isLoading,
  error,
  onRetry,
  onAdvanceOrder,
  pendingStockIds,
  pendingOrderIds,
}) {
  const dashboardItems = [
    { label: '총 주문', count: dashboard?.total ?? 0, style: 'total' },
    { label: '주문 접수', count: dashboard?.received ?? 0, style: 'received' },
    { label: '제조 중', count: dashboard?.preparing ?? 0, style: 'preparing' },
    { label: '제조 완료', count: dashboard?.completed ?? 0, style: 'completed' },
  ]

  function getStockStatus(quantity) {
    if (quantity === 0) return { label: '품절', style: 'sold-out' }
    if (quantity < 5) return { label: '주의', style: 'warning' }
    return { label: '정상', style: 'normal' }
  }

  function formatOrderDate(date) {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(date))
  }

  return (
    <div className="admin-page">
      <div className="admin-heading">
        <div>
          <span className="section-kicker">STORE OVERVIEW</span>
          <h1>매장 관리</h1>
          <p>오늘의 주문과 재고를 한눈에 확인하세요.</p>
        </div>
        <span className="demo-label"><span /> 서버 연결 데이터</span>
      </div>

      {error && (
        <div className="feedback__error api-feedback" role="alert">
          <span>{error}</span>
          <button className="button button--primary" onClick={onRetry} type="button">
            다시 시도
          </button>
        </div>
      )}

      <section className="admin-section dashboard-section" aria-labelledby="dashboard-title">
        <div className="admin-section__heading">
          <div>
            <span className="section-kicker">AT A GLANCE</span>
            <h2 id="dashboard-title">관리자 대시보드</h2>
          </div>
          <span className="admin-section__meta">실시간 주문 현황</span>
        </div>
        {isLoading ? (
          <p className="api-loading" role="status">관리자 데이터를 불러오는 중...</p>
        ) : (
        <div className="dashboard-grid">
          {dashboardItems.map((item, index) => (
            <article
              className={`dashboard-card dashboard-card--${item.style}`}
              key={item.style}
            >
              <span className="dashboard-card__icon" aria-hidden="true">
                {['▤', '◷', '♨', '✓'][index]}
              </span>
              <span className="dashboard-card__label">{item.label}</span>
              <strong>{item.count}<span>건</span></strong>
            </article>
          ))}
        </div>
        )}
      </section>

      <section className="admin-section inventory-section" aria-labelledby="inventory-title">
        <div className="admin-section__heading">
          <div>
            <span className="section-kicker">STOCK CONTROL</span>
            <h2 id="inventory-title">재고 현황</h2>
          </div>
          <span className="admin-section__meta">재고를 1개씩 조정할 수 있어요</span>
        </div>
        {isLoading ? (
          <p className="api-loading" role="status">재고 정보를 불러오는 중...</p>
        ) : (
        <div className="inventory-grid">
          {inventory.map((item) => {
            const status = getStockStatus(item.stockQuantity)

            return (
              <article className="inventory-card" key={item.id}>
                <div className="inventory-card__content">
                  <div className="inventory-card__summary">
                    <h3>{item.name}</h3>
                    <div className="inventory-card__quantity">
                      <strong>{item.stockQuantity}</strong>
                      <span>개</span>
                    </div>
                    <span className={`stock-status stock-status--${status.style}`}>
                      <span />
                      {status.label}
                    </span>
                  </div>
                  <div className="stock-controls" aria-label={`${item.name} 재고 조절`}>
                    <button
                      aria-label={`${item.name} 재고 늘리기`}
                      disabled={pendingStockIds.includes(item.id)}
                      onClick={() => onStockChange(item.id, 1)}
                      type="button"
                    >
                      +
                    </button>
                    <button
                      aria-label={`${item.name} 재고 줄이기`}
                      disabled={item.stockQuantity === 0 || pendingStockIds.includes(item.id)}
                      onClick={() => onStockChange(item.id, -1)}
                      type="button"
                    >
                      −
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        )}
      </section>

      <section className="admin-section orders-section" aria-labelledby="orders-title">
        <div className="admin-section__heading">
          <div>
            <span className="section-kicker">ORDER QUEUE</span>
            <h2 id="orders-title">주문 현황</h2>
          </div>
          <span className="order-count">{orders.length}건의 주문</span>
        </div>

        {isLoading ? (
          <p className="api-loading" role="status">주문 정보를 불러오는 중...</p>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <span aria-hidden="true">☕</span>
            <p>아직 접수된 주문이 없습니다.</p>
            <span>새 주문이 들어오면 이곳에 표시됩니다.</span>
          </div>
        ) : (
          <div className="order-table-wrap">
            <table className="order-table">
              <thead>
                <tr>
                  <th scope="col">주문 시각</th>
                  <th scope="col">주문 메뉴</th>
                  <th scope="col">주문 금액</th>
                  <th scope="col">상태</th>
                  <th scope="col">처리</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="order-date">{formatOrderDate(order.orderedAt)}</td>
                    <td>
                      <div className="order-menu-list">
                        {order.items.map((item) => (
                          <span key={item.id}>
                            {item.menuName}
                            {item.options.length > 0 && (
                              <small className="order-menu-options">
                                {item.options.map((option) => option.name).join(' · ')}
                              </small>
                            )}
                            {' '}<b>× {item.quantity}</b>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="order-price">{formatPrice(order.totalAmount)}</td>
                    <td>
                      <span className={`order-status order-status--${order.status}`}>
                        <span />
                        {orderStatuses[order.status]}
                      </span>
                    </td>
                    <td>
                      {order.status !== 'completed' ? (
                        <button
                          className="button button--primary order-action"
                          disabled={pendingOrderIds.includes(order.id)}
                          onClick={() => onAdvanceOrder(order.id)}
                          type="button"
                        >
                          {order.status === 'received' ? '제조 시작' : '제조 완료'}
                          <span aria-hidden="true">→</span>
                        </button>
                      ) : (
                        <span className="order-action-done">처리 완료</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {orders.length > 0 && (
          <div className="order-cards">
            {orders.map((order) => (
              <article className="order-card" key={order.id}>
                <div className="order-card__heading">
                  <span className="order-card__date">{formatOrderDate(order.orderedAt)}</span>
                  <span className={`order-status order-status--${order.status}`}>
                    <span />
                    {orderStatuses[order.status]}
                  </span>
                </div>
                <div className="order-card__items">
                  {order.items.map((item) => (
                    <div className="order-card__item" key={item.id}>
                      <span>
                        {item.menuName}
                        {item.options.length > 0 && (
                          <small className="order-menu-options">
                            {item.options.map((option) => option.name).join(' · ')}
                          </small>
                        )}
                      </span>
                      <b>× {item.quantity}</b>
                    </div>
                  ))}
                </div>
                <div className="order-card__footer">
                  <strong>{formatPrice(order.totalAmount)}</strong>
                  {order.status !== 'completed' ? (
                    <button
                      className="button button--primary order-action"
                      disabled={pendingOrderIds.includes(order.id)}
                      onClick={() => onAdvanceOrder(order.id)}
                      type="button"
                    >
                      {order.status === 'received' ? '제조 시작' : '제조 완료'}
                      <span aria-hidden="true">→</span>
                    </button>
                  ) : (
                    <span className="order-action-done">처리 완료</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        <p className="admin-demo-note">주문과 재고는 서버에 저장됩니다.</p>
      </section>
    </div>
  )
}

function App() {
  const [activePage, setActivePage] = useState('order')
  const [menu, setMenu] = useState([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError] = useState('')
  const [selectedOptions, setSelectedOptions] = useState({})
  const [cart, setCart] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderComplete, setOrderComplete] = useState(false)
  const [notice, setNotice] = useState('')
  const [inventory, setInventory] = useState([])
  const [orders, setOrders] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [pendingStockIds, setPendingStockIds] = useState([])
  const [pendingOrderIds, setPendingOrderIds] = useState([])

  async function loadMenus() {
    try {
      const data = await requestJson('/api/menus')
      setMenu(data.menus)
      setMenuError('')
    } catch (error) {
      console.error('Failed to load menus:', error)
      setMenuError(error.message)
    } finally {
      setMenuLoading(false)
    }
  }

  async function loadAdminData() {
    try {
      const [menuData, orderData, dashboardData] = await Promise.all([
        requestJson('/api/admin/menus'),
        requestJson('/api/admin/orders'),
        requestJson('/api/admin/dashboard'),
      ])
      setInventory(menuData.menus)
      setOrders(orderData.orders)
      setDashboard(dashboardData.dashboard)
      setAdminError('')
    } catch (error) {
      console.error('Failed to load admin data:', error)
      setAdminError(error.message)
    } finally {
      setAdminLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      if (activePage === 'order') {
        loadMenus()
      } else {
        loadAdminData()
      }
    })

    return () => {
      cancelled = true
    }
  }, [activePage])

  async function changeStock(itemId, adjustment) {
    if (pendingStockIds.includes(itemId)) return
    setPendingStockIds((current) => [...current, itemId])
    setAdminError('')
    try {
      const data = await requestJson(`/api/admin/menus/${itemId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustment }),
      })
      setInventory((current) =>
        current.map((item) =>
          item.id === itemId
            ? { ...item, stockQuantity: data.menu.stockQuantity }
            : item,
        ),
      )
    } catch (error) {
      console.error('Failed to update stock:', error)
      setAdminError(error.message)
    } finally {
      setPendingStockIds((current) => current.filter((id) => id !== itemId))
    }
  }

  async function advanceOrder(orderId) {
    if (pendingOrderIds.includes(orderId)) return
    const currentOrder = orders.find((order) => order.id === orderId)
    if (!currentOrder || currentOrder.status === 'completed') return

    const status = currentOrder.status === 'received' ? 'preparing' : 'completed'
    setPendingOrderIds((current) => [...current, orderId])
    setAdminError('')
    try {
      const data = await requestJson(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? data.order : order)),
      )
      const dashboardData = await requestJson('/api/admin/dashboard')
      setDashboard(dashboardData.dashboard)
    } catch (error) {
      console.error('Failed to update order status:', error)
      setAdminError(error.message)
    } finally {
      setPendingOrderIds((current) => current.filter((id) => id !== orderId))
    }
  }

  const totalPrice = useMemo(
    () => cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0),
    [cart],
  )

  function toggleOption(menuId, optionId) {
    setSelectedOptions((current) => {
      const currentForMenu = current[menuId] ?? []
      const nextForMenu = currentForMenu.includes(optionId)
        ? currentForMenu.filter((id) => id !== optionId)
        : [...currentForMenu, optionId]

      return { ...current, [menuId]: nextForMenu }
    })
  }

  function addToCart(item) {
    if (!item.isAvailable) return

    const options = item.options.filter((option) =>
      (selectedOptions[item.id] ?? []).includes(option.id),
    )
    const optionIds = options.map((option) => option.id).sort()
    const cartKey = `${item.id}:${optionIds.join(',')}`
    const unitPrice = item.price + options.reduce((sum, option) => sum + option.price, 0)

    setCart((current) => {
      const existingItem = current.find((cartItem) => cartItem.cartKey === cartKey)

      if (existingItem) {
        return current.map((cartItem) =>
          cartItem.cartKey === cartKey
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        )
      }

      return [
        ...current,
        {
          cartKey,
          menuId: item.id,
          name: item.name,
          options,
          unitPrice,
          quantity: 1,
        },
      ]
    })
    setOrderComplete(false)
    setOrderError('')
  }

  function changeQuantity(cartKey, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + amount }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
    setOrderComplete(false)
    setOrderError('')
  }

  async function submitOrder() {
    if (cart.length === 0 || isSubmitting) return

    setIsSubmitting(true)
    setOrderError('')
    setOrderComplete(false)

    try {
      await requestJson('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            menuId: item.menuId,
            quantity: item.quantity,
            optionIds: item.options.map((option) => option.id),
          })),
        }),
      })

      setCart([])
      setOrderComplete(true)
      setOrderError('')
    } catch (error) {
      console.error('Failed to submit order:', error)
      setOrderError('주문을 저장하지 못했어요. 장바구니는 그대로 보관했으니 다시 시도해 주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="COZY 홈">
          <span className="brand__mark" aria-hidden="true">C</span>
          <span>COZY</span>
        </a>
        <nav className="main-nav" aria-label="주요 메뉴">
          <button
            aria-current={activePage === 'order' ? 'page' : undefined}
            className={`main-nav__link${activePage === 'order' ? ' main-nav__link--active' : ''}`}
            onClick={() => {
              if (activePage !== 'order') {
                setMenuLoading(true)
                setActivePage('order')
              }
            }}
            type="button"
          >
            주문하기
          </button>
          <button
            aria-current={activePage === 'admin' ? 'page' : undefined}
            className={`main-nav__link${activePage === 'admin' ? ' main-nav__link--active' : ''}`}
            onClick={() => {
              if (activePage !== 'admin') {
                setAdminLoading(true)
                setActivePage('admin')
              }
            }}
            type="button"
          >
            관리자
          </button>
        </nav>
      </header>

      <main id="top" key={activePage}>
        {activePage === 'admin' ? (
          <AdminDashboard
            inventory={inventory}
            onStockChange={changeStock}
            orders={orders}
            dashboard={dashboard}
            isLoading={adminLoading}
            error={adminError}
            onRetry={() => {
              setAdminLoading(true)
              loadAdminData()
            }}
            onAdvanceOrder={advanceOrder}
            pendingStockIds={pendingStockIds}
            pendingOrderIds={pendingOrderIds}
          />
        ) : (
          <>
        <section className="menu-section" id="order" aria-labelledby="menu-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">MADE FRESH, JUST FOR YOU</span>
              <h1 id="menu-title">오늘의 커피</h1>
              <p>좋아하는 한 잔에 작은 여유를 더해 보세요.</p>
            </div>
            <span className="menu-count">COFFEE <span>{String(menu.length).padStart(2, '0')}</span></span>
          </div>

          {menuLoading ? (
            <p className="api-loading" role="status">메뉴를 불러오는 중...</p>
          ) : menuError ? (
            <div className="feedback__error api-feedback" role="alert">
              <span>메뉴를 불러오지 못했어요. {menuError}</span>
              <button
                className="button button--primary"
                onClick={() => {
                  setMenuLoading(true)
                  loadMenus()
                }}
                type="button"
              >
                다시 시도
              </button>
            </div>
          ) : menu.length === 0 ? (
            <div className="orders-empty">
              <span aria-hidden="true">☕</span>
              <p>현재 주문 가능한 메뉴가 없습니다.</p>
            </div>
          ) : (
          <div className="menu-grid">
            {menu.map((item, index) => (
              <article className="menu-card" key={item.id}>
                <CoffeeIllustration
                  style={getCoffeeStyle(item.name)}
                  imageUrl={item.imageUrl}
                />
                <div className="menu-card__body">
                  <div className="menu-card__title-row">
                    <div>
                      <span className="menu-card__number">0{index + 1} / COZY PICK</span>
                      <h2>{item.name}</h2>
                    </div>
                    <span className="menu-card__price">{formatPrice(item.price)}</span>
                  </div>
                  <p className="menu-card__description">{item.description}</p>
                  <fieldset className="option-list">
                    <legend>추가 옵션</legend>
                    {item.options.map((option) => (
                      <label className="option" key={option.id}>
                        <input
                          checked={(selectedOptions[item.id] ?? []).includes(option.id)}
                          onChange={() => toggleOption(item.id, option.id)}
                          type="checkbox"
                        />
                        <span className="option__name">{option.name}</span>
                        <span className="option__price">
                          {option.price > 0 ? `+${formatPrice(option.price)}` : '+0원'}
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  <button
                    className="button button--primary menu-card__add"
                    disabled={!item.isAvailable}
                    onClick={() => addToCart(item)}
                    type="button"
                  >
                    {item.isAvailable ? (
                      <><span aria-hidden="true">+</span> 담기</>
                    ) : (
                      '품절'
                    )}
                  </button>
                </div>
              </article>
            ))}
          </div>
          )}
        </section>

        <section className="cart-panel" aria-labelledby="cart-title">
          <div className="cart-panel__main">
            <div className="cart-panel__heading">
              <div>
                <span className="section-kicker">YOUR SELECTION</span>
                <h2 id="cart-title">장바구니 <span>{cart.length}</span></h2>
              </div>
              {cart.length > 0 && (
                <button
                  className="cart-clear"
                  onClick={() => {
                    setCart([])
                    setOrderError('')
                    setOrderComplete(false)
                  }}
                  type="button"
                >
                  전체 비우기
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <span className="cart-empty__icon" aria-hidden="true">☕</span>
                <p>아직 담긴 메뉴가 없어요.</p>
                <span>마음에 드는 커피를 골라 담아 보세요.</span>
              </div>
            ) : (
              <ul className="cart-list">
                {cart.map((item) => (
                  <li className="cart-item" key={item.cartKey}>
                    <div className="cart-item__details">
                      <h3>{item.name}</h3>
                      <span className="cart-item__options">
                        {item.options.length > 0
                          ? item.options.map((option) => option.name).join(' · ')
                          : '기본'}
                      </span>
                    </div>
                    <div className="quantity-control" aria-label={`${item.name} 수량`}>
                      <button
                        aria-label={`${item.name} 수량 줄이기`}
                        onClick={() => changeQuantity(item.cartKey, -1)}
                        type="button"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label={`${item.name} 수량 늘리기`}
                        onClick={() => changeQuantity(item.cartKey, 1)}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <span className="cart-item__total">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className="cart-summary" aria-label="주문 금액">
            <div className="cart-summary__total">
              <span>총 주문 금액</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>
            <button
              className="button button--primary cart-summary__submit"
              disabled={cart.length === 0 || isSubmitting}
              onClick={submitOrder}
              type="button"
            >
              {isSubmitting ? '주문 전송 중...' : '주문하기'}
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>
            <p className="cart-summary__note">결제 없이 주문이 접수됩니다.</p>
          </aside>
        </section>

        <div className="feedback" aria-live="polite" role="status">
          {orderComplete && (
            <p className="feedback__success">주문이 접수됐어요. 맛있게 준비해 드릴게요!</p>
          )}
          {orderError && <p className="feedback__error">{orderError}</p>}
          {notice && (
            <p className="feedback__notice">
              {notice}
              <button onClick={() => setNotice('')} type="button" aria-label="안내 닫기">×</button>
            </p>
          )}
        </div>
          </>
        )}
      </main>
      <footer className="site-footer">
        <span>COZY COFFEE</span>
        <span>좋은 커피와 함께하는 편안한 시간</span>
      </footer>
    </div>
  )
}

export default App
