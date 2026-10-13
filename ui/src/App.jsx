import { useMemo, useState } from 'react'
import './App.css'

const menu = [
  {
    id: 'iced-americano',
    name: '아메리카노 (ICE)',
    price: 4000,
    description: '산뜻한 산미와 깔끔한 여운의 아이스 커피',
    style: 'iced',
    options: [
      { id: 'extra-shot', name: '샷 추가', price: 500 },
      { id: 'vanilla-syrup', name: '시럽 추가', price: 0 },
    ],
  },
  {
    id: 'hot-americano',
    name: '아메리카노 (HOT)',
    price: 4000,
    description: '깊은 향을 따뜻하게 즐기는 클래식 커피',
    style: 'hot',
    options: [
      { id: 'extra-shot', name: '샷 추가', price: 500 },
      { id: 'vanilla-syrup', name: '시럽 추가', price: 0 },
    ],
  },
  {
    id: 'cafe-latte',
    name: '카페라떼',
    price: 5000,
    description: '부드러운 우유와 에스프레소의 조화',
    style: 'latte',
    options: [
      { id: 'extra-shot', name: '샷 추가', price: 500 },
      { id: 'vanilla-syrup', name: '시럽 추가', price: 0 },
    ],
  },
]

const currency = new Intl.NumberFormat('ko-KR')
const formatPrice = (price) => `${currency.format(price)}원`

function CoffeeIllustration({ style }) {
  return (
    <div className={`coffee-art coffee-art--${style}`} aria-hidden="true">
      <span className="coffee-art__steam coffee-art__steam--one" />
      <span className="coffee-art__steam coffee-art__steam--two" />
      <span className="coffee-art__cup">
        <span className="coffee-art__drink" />
        <span className="coffee-art__sleeve" />
        <span className="coffee-art__logo">C</span>
      </span>
      <span className="coffee-art__shadow" />
      <span className="coffee-art__caption">COZY COFFEE</span>
    </div>
  )
}

function App() {
  const [selectedOptions, setSelectedOptions] = useState({})
  const [cart, setCart] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [orderComplete, setOrderComplete] = useState(false)
  const [notice, setNotice] = useState('')

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
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            menuId: item.menuId,
            quantity: item.quantity,
            optionIds: item.options.map((option) => option.id),
          })),
          totalAmount: totalPrice,
        }),
      })

      if (!response.ok) {
        throw new Error(`Order request failed with status ${response.status}`)
      }

      setCart([])
      setOrderComplete(true)
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
          <a className="main-nav__link main-nav__link--active" href="#order">
            주문하기
          </a>
          <button
            className="main-nav__link"
            type="button"
            onClick={() => setNotice('관리자 화면은 준비 중입니다.')}
          >
            관리자
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="menu-section" id="order" aria-labelledby="menu-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">MADE FRESH, JUST FOR YOU</span>
              <h1 id="menu-title">오늘의 커피</h1>
              <p>좋아하는 한 잔에 작은 여유를 더해 보세요.</p>
            </div>
            <span className="menu-count">COFFEE <span>03</span></span>
          </div>

          <div className="menu-grid">
            {menu.map((item, index) => (
              <article className="menu-card" key={item.id}>
                <CoffeeIllustration style={item.style} />
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
                    onClick={() => addToCart(item)}
                    type="button"
                  >
                    <span aria-hidden="true">+</span> 담기
                  </button>
                </div>
              </article>
            ))}
          </div>
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
      </main>
      <footer className="site-footer">
        <span>COZY COFFEE</span>
        <span>좋은 커피와 함께하는 편안한 시간</span>
      </footer>
    </div>
  )
}

export default App
