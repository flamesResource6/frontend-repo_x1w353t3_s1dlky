import React, { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Spline from '@splinetool/react-spline'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '')
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => setProfile(data))
        .catch(() => setProfile(null))
    } else {
      setProfile(null)
    }
  }, [token])

  const login = (t) => { localStorage.setItem('token', t); setToken(t) }
  const logout = () => { localStorage.removeItem('token'); setToken('') }

  return { token, profile, login, logout }
}

function Layout({ children }) {
  const { token, profile, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-slate-100">
      <header className="sticky top-0 z-50 backdrop-blur bg-white/5 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="text-xl font-bold tracking-tight">FluxShop</Link>
          <nav className="ml-auto flex items-center gap-3 text-sm">
            <Link to="/" className="hover:text-white/90">Home</Link>
            <Link to="/cart" className="hover:text-white/90">Cart</Link>
            {profile?.is_admin && <Link to="/admin" className="hover:text-white/90">Admin</Link>}
            {token ? (
              <button onClick={() => { logout(); navigate('/') }} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Logout</button>
            ) : (
              <Link to="/login" className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Login</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="min-h-[70vh]">{children}</main>

      <footer className="border-t border-white/10 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-white/60 flex flex-col sm:flex-row items-center justify-between">
          <p>© {new Date().getFullYear()} FluxShop • A student-built mini store</p>
          <p className="opacity-70">Made with React, FastAPI, and MongoDB</p>
        </div>
      </footer>
    </div>
  )
}

function Hero() {
  return (
    <section className="relative h-[420px] overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/41MGRk-UDPKO-l6W/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />
      <div className="relative max-w-6xl mx-auto px-4 h-full flex items-end pb-10">
        <div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">Swipe-worthy finds for everyday</h1>
          <p className="mt-3 text-white/70 max-w-2xl">A tiny commerce project with a glassmorphic, fintech-inspired vibe. Search, add to cart, and checkout.</p>
        </div>
      </div>
    </section>
  )
}

function ProductCard({ p, onAdd }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition">
      {p.image && <img src={p.image} alt={p.title} className="h-40 w-full object-cover" />}
      <div className="p-4">
        <h3 className="font-semibold">{p.title}</h3>
        <p className="text-xs text-white/60 line-clamp-2 min-h-[2.5rem]">{p.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold">${p.price.toFixed(2)}</span>
          <button onClick={() => onAdd(p)} className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-medium">Add to Cart</button>
        </div>
      </div>
    </div>
  )
}

function useCart() {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'))
  useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)) }, [cart])
  const add = (p) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i._id === p._id)
      if (idx >= 0) { const copy = [...prev]; copy[idx].quantity += 1; return copy }
      return [...prev, { ...p, quantity: 1 }]
    })
  }
  const remove = (id) => setCart(prev => prev.filter(i => i._id !== id))
  const changeQty = (id, q) => setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: Math.max(1, q) } : i))
  const clear = () => setCart([])
  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart])
  return { cart, add, remove, changeQty, clear, total }
}

function Home() {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState([])
  const { add } = useCart()

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/api/products?search=${encodeURIComponent(search)}`)
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div>
      <Hero />
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products" className="w-full sm:w-80 px-3 py-2 rounded bg-white/10 border border-white/10 focus:outline-none" />
        </div>
        {loading ? (
          <p className="text-white/70">Loading products...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {products.map(p => <ProductCard key={p._id} p={p} onAdd={add} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function CartPage() {
  const { cart, changeQty, remove, total } = useCart()
  const navigate = useNavigate()
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold mb-6">Your Cart</h2>
      {cart.length === 0 ? (
        <div className="text-white/70">Cart is empty. <button className="underline" onClick={() => navigate('/')}>Browse products</button></div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            {cart.map(item => (
              <div key={item._id} className="flex gap-4 items-center bg-white/5 border border-white/10 rounded-lg p-3">
                {item.image && <img src={item.image} className="w-20 h-20 object-cover rounded" />}
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-white/60 text-sm">${item.price.toFixed(2)}</div>
                </div>
                <input type="number" min={1} value={item.quantity} onChange={e => changeQty(item._id, parseInt(e.target.value || '1'))} className="w-16 bg-transparent border border-white/10 rounded px-2 py-1" />
                <button onClick={() => remove(item._id)} className="text-sm text-red-300 hover:text-red-200">Remove</button>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 h-fit">
            <div className="flex items-center justify-between mb-2"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            <button onClick={() => navigate('/checkout')} className="w-full mt-3 px-4 py-2 rounded bg-emerald-400 hover:bg-emerald-300 text-black font-medium">Checkout</button>
          </div>
        </div>
      )}
    </section>
  )
}

function CheckoutPage() {
  const { cart, total, clear } = useCart()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', address: '', payment_method: 'card' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (cart.length === 0) return
    setSubmitting(true)
    const items = cart.map(c => ({ product_id: c._id, title: c.title, price: c.price, quantity: c.quantity, image: c.image }))
    const res = await fetch(`${API_BASE}/api/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, items }) })
    const data = await res.json()
    setSubmitting(false)
    if (res.ok) {
      clear()
      navigate(`/thank-you?total=${data.total.toFixed(2)}`)
    } else {
      alert(data.detail || 'Failed to place order')
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold mb-6">Checkout</h2>
      <form onSubmit={submit} className="space-y-4">
        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
        <textarea required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Shipping address" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
        <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="w-full px-3 py-2 rounded bg-white/10 border border-white/10">
          <option value="card">Card</option>
          <option value="cod">Cash on Delivery</option>
        </select>
        <div className="flex items-center justify-between text-sm text-white/70">
          <span>Items: {cart.length}</span>
          <span>Total: ${total.toFixed(2)}</span>
        </div>
        <button disabled={submitting || cart.length === 0} className="px-4 py-2 rounded bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-black font-medium">{submitting ? 'Placing order...' : 'Place Order'}</button>
      </form>
    </section>
  )
}

function ThankYou() {
  const params = new URLSearchParams(window.location.search)
  const total = params.get('total')
  return (
    <section className="max-w-3xl mx-auto px-4 py-20 text-center">
      <h2 className="text-3xl font-semibold">Thank you!</h2>
      <p className="mt-2 text-white/70">Your order has been received. Total paid: ${total}</p>
      <Link to="/" className="inline-block mt-6 px-4 py-2 rounded bg-white/10 hover:bg-white/20">Continue shopping</Link>
    </section>
  )
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) || form.password.length < 6) {
      setError('Enter a valid email and a 6+ character password.')
      return
    }
    const res = await fetch(`${API_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) {
      login(data.token)
      navigate('/')
    } else setError(data.detail || 'Login failed')
  }

  return (
    <section className="max-w-md mx-auto px-4 py-16">
      <h2 className="text-2xl font-semibold mb-6">Login</h2>
      <form onSubmit={submit} className="space-y-4">
        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
        <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
        {error && <p className="text-red-300 text-sm">{error}</p>}
        <button className="px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-medium">Login</button>
      </form>
      <p className="mt-3 text-sm text-white/70">No account? <Link className="underline" to="/signup">Sign up</Link></p>
    </section>
  )
}

function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email) || form.password.length < 6) {
      setError('Enter name, valid email, and a 6+ character password.')
      return
    }
    const res = await fetch(`${API_BASE}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) navigate('/login')
    else setError(data.detail || 'Signup failed')
  }

  return (
    <section className="max-w-md mx-auto px-4 py-16">
      <h2 className="text-2xl font-semibold mb-6">Create account</h2>
      <form onSubmit={submit} className="space-y-4">
        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
        <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
        <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password (min 6)" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
        {error && <p className="text-red-300 text-sm">{error}</p>}
        <button className="px-4 py-2 rounded bg-emerald-400 hover:bg-emerald-300 text-black font-medium">Sign up</button>
      </form>
    </section>
  )
}

function AdminPage() {
  const { token, profile } = useAuth()
  const [products, setProducts] = useState([])
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '', image: '' })
  const [editingId, setEditingId] = useState('')

  const load = async () => {
    const res = await fetch(`${API_BASE}/api/products`)
    const data = await res.json()
    setProducts(data.products || [])
  }
  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    const method = editingId ? 'PUT' : 'POST'
    const url = editingId ? `${API_BASE}/api/products/${editingId}` : `${API_BASE}/api/products`
    const payload = { ...form, price: parseFloat(form.price || '0') }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
    if (res.ok) { setForm({ title: '', description: '', price: '', category: '', image: '' }); setEditingId(''); load() }
    else alert('Failed to save')
  }

  const edit = (p) => { setEditingId(p._id); setForm({ title: p.title, description: p.description || '', price: String(p.price), category: p.category || '', image: p.image || '' }) }
  const del = async (id) => { if (!confirm('Delete product?')) return; await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); load() }

  if (!profile?.is_admin) return <section className="max-w-3xl mx-auto px-4 py-16">Admin only</section>

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-semibold mb-6">Admin Dashboard</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={save} className="md:col-span-1 space-y-3 bg-white/5 border border-white/10 rounded-lg p-4">
          <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
          <input required type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
          <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Category" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
          <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Image URL" className="w-full px-3 py-2 rounded bg-white/10 border border-white/10" />
          <button className="px-4 py-2 rounded bg-cyan-400 hover:bg-cyan-300 text-black font-medium">{editingId ? 'Update' : 'Add'} product</button>
        </form>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map(p => (
            <div key={p._id} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex gap-3">
                {p.image && <img src={p.image} className="w-24 h-24 object-cover rounded" />}
                <div className="flex-1">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-white/60 text-sm">${p.price.toFixed(2)}</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => edit(p)} className="text-xs px-2 py-1 rounded bg-white/10">Edit</button>
                    <button onClick={() => del(p._id)} className="text-xs px-2 py-1 rounded bg-red-400/80 text-black">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Layout>
  )
}
