import { create } from 'zustand'

export type Page = 
  | 'dashboard' 
  | 'products' 
  | 'pos' 
  | 'sales' 
  | 'inventory' 
  | 'categories' 
  | 'customers' 
  | 'suppliers' 
  | 'expenses' 
  | 'reports'

interface AppState {
  currentPage: Page
  sidebarOpen: boolean
  setCurrentPage: (page: Page) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: true,
  setCurrentPage: (page) => set({ currentPage: page }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))

export interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
  maxStock: number
}

interface CartState {
  items: CartItem[]
  customerId: string | null
  discount: number
  paymentMethod: string
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setCustomerId: (id: string | null) => void
  setDiscount: (amount: number) => void
  setPaymentMethod: (method: string) => void
  getTotal: () => number
  getFinalTotal: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  discount: 0,
  paymentMethod: 'نقدی',
  addItem: (item) => set((state) => {
    const existing = state.items.find(i => i.productId === item.productId)
    if (existing) {
      return {
        items: state.items.map(i => 
          i.productId === item.productId 
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.maxStock) }
            : i
        )
      }
    }
    return { items: [...state.items, item] }
  }),
  removeItem: (productId) => set((state) => ({
    items: state.items.filter(i => i.productId !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map(i => 
      i.productId === productId 
        ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
        : i
    )
  })),
  clearCart: () => set({ items: [], customerId: null, discount: 0, paymentMethod: 'نقدی' }),
  setCustomerId: (id) => set({ customerId: id }),
  setDiscount: (amount) => set({ discount: Math.max(0, amount) }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  getTotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  getFinalTotal: () => {
    const total = get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return Math.max(0, total - get().discount)
  },
}))
