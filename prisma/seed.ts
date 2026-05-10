import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding database...\n')

  // ─── Clean existing data (in correct order due to relations) ───
  await db.saleItem.deleteMany()
  await db.sale.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.customer.deleteMany()
  await db.expense.deleteMany()
  await db.supplier.deleteMany()

  // ═══════════════════════════════════════════════════════════════
  // 1. CATEGORIES
  // ═══════════════════════════════════════════════════════════════
  console.log('📦 Creating categories...')

  const categoriesData = [
    { name: 'لباس', description: 'انواع لباس‌های مردانه، زنانه و بچگانه', color: '#6366f1' },
    { name: 'الکترونیک', description: 'لوازم الکترونیکی و دیجیتال', color: '#3b82f6' },
    { name: 'مواد غذایی', description: 'مواد غذایی و خوراکی', color: '#22c55e' },
    { name: 'لوازم خانگی', description: 'لوازم مورد نیاز خانه', color: '#f59e0b' },
    { name: 'بهداشتی', description: 'لوازم بهداشتی و آرایشی', color: '#ec4899' },
    { name: 'کتاب', description: 'کتاب‌های آموزشی و تفریحی', color: '#8b5cf6' },
    { name: 'اسباب بازی', description: 'اسباب بازی‌های کودکان', color: '#f97316' },
    { name: 'ورزشی', description: 'لوازم ورزشی و تجهیزات', color: '#14b8a6' },
    { name: 'لوازم التحریر', description: 'لوازم التحریر و اداری', color: '#06b6d4' },
  ]

  const categories: Record<string, string> = {}
  for (const cat of categoriesData) {
    const created = await db.category.create({ data: cat })
    categories[cat.name] = created.id
    console.log(`   ✅ ${cat.name}`)
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. PRODUCTS (28 products across categories)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🛍️  Creating products...')

  const productsData = [
    // لباس (Clothing) - 4 products
    { name: 'پیراهن مردانه سفید', sku: 'LB-001', barcode: '6211001000011', categoryId: categories['لباس'], buyPrice: 800, sellPrice: 1200, stock: 45, minStock: 10, unit: 'عدد', description: 'پیراهن مردانه نخی سفید سایز متوسط' },
    { name: 'شلوار جین مردانه', sku: 'LB-002', barcode: '6211001000028', categoryId: categories['لباس'], buyPrice: 1200, sellPrice: 1800, stock: 30, minStock: 8, unit: 'عدد', description: 'شلوار جین آبی تیره سایز ۳۲' },
    { name: 'بلوز زنانه گلدار', sku: 'LB-003', barcode: '6211001000035', categoryId: categories['لباس'], buyPrice: 600, sellPrice: 950, stock: 3, minStock: 10, unit: 'عدد', description: 'بلوز زنانه طرح گلدار رنگی' },
    { name: 'کتانی بچگانه', sku: 'LB-004', barcode: '6211001000042', categoryId: categories['لباس'], buyPrice: 500, sellPrice: 850, stock: 20, minStock: 5, unit: 'جفت', description: 'کتانی بچگانه اسپرت' },

    // الکترونیک (Electronics) - 4 products
    { name: 'هدفون بلوتوثی', sku: 'EL-001', barcode: '6211001000059', categoryId: categories['الکترونیک'], buyPrice: 2500, sellPrice: 3800, stock: 15, minStock: 5, unit: 'عدد', description: 'هدفون بی‌سیم بلوتوثی با میکروفون' },
    { name: 'شارژر گوشی تایپ سی', sku: 'EL-002', barcode: '6211001000066', categoryId: categories['الکترونیک'], buyPrice: 300, sellPrice: 500, stock: 50, minStock: 15, unit: 'عدد', description: 'شارژر سریع تایپ سی ۲۰ وات' },
    { name: 'پاوربانک ۱۰۰۰۰ میلی‌آمپر', sku: 'EL-003', barcode: '6211001000073', categoryId: categories['الکترونیک'], buyPrice: 3000, sellPrice: 4500, stock: 2, minStock: 5, unit: 'عدد', description: 'پاوربانک قابل حمل با دو خروجی USB' },
    { name: 'فلش مموری ۳۲ گیگابایت', sku: 'EL-004', barcode: '6211001000080', categoryId: categories['الکترونیک'], buyPrice: 400, sellPrice: 650, stock: 35, minStock: 10, unit: 'عدد', description: 'فلش مموری USB 3.0' },

    // مواد غذایی (Food) - 4 products
    { name: 'برنج بسمتی ۵ کیلویی', sku: 'FD-001', barcode: '6211001000097', categoryId: categories['مواد غذایی'], buyPrice: 1500, sellPrice: 2100, stock: 100, minStock: 20, unit: 'کیلو', description: 'برنج معطر بسمتی درجه یک' },
    { name: 'روغن زیتون ۱ لیتری', sku: 'FD-002', barcode: '6211001000103', categoryId: categories['مواد غذایی'], buyPrice: 600, sellPrice: 900, stock: 60, minStock: 15, unit: 'بطری', description: 'روغن زیتون خالص فرابکر' },
    { name: 'چای سبز ۵۰۰ گرمی', sku: 'FD-003', barcode: '6211001000110', categoryId: categories['مواد غذایی'], buyPrice: 350, sellPrice: 550, stock: 4, minStock: 10, unit: 'بسته', description: 'چای سبز طبیعی کابل' },
    { name: 'عسل طبیعی ۱ کیلویی', sku: 'FD-004', barcode: '6211001000127', categoryId: categories['مواد غذایی'], buyPrice: 1800, sellPrice: 2800, stock: 25, minStock: 8, unit: 'جار', description: 'عسل طبیعی باغ‌های نیمروز' },

    // لوازم خانگی (Home appliances) - 3 products
    { name: 'سماور برقی ۳ لیتری', sku: 'HM-001', barcode: '6211001000134', categoryId: categories['لوازم خانگی'], buyPrice: 3500, sellPrice: 5200, stock: 12, minStock: 3, unit: 'عدد', description: 'سماور برقی استیل ضد زنگ' },
    { name: 'جاروبرقی ۱۵۰۰ وات', sku: 'HM-002', barcode: '6211001000141', categoryId: categories['لوازم خانگی'], buyPrice: 8000, sellPrice: 12000, stock: 7, minStock: 3, unit: 'عدد', description: 'جاروبرقی قدرتمند خانگی' },
    { name: 'بشقاب سرامیکی ۶ عددی', sku: 'HM-003', barcode: '6211001000158', categoryId: categories['لوازم خانگی'], buyPrice: 900, sellPrice: 1400, stock: 1, minStock: 5, unit: 'ست', description: 'ست بشقاب سرامیکی طرح سنتی' },

    // بهداشتی (Hygiene) - 4 products
    { name: 'شامپو ضد شوره ۴۰۰ مل', sku: 'HY-001', barcode: '6211001000165', categoryId: categories['بهداشتی'], buyPrice: 180, sellPrice: 300, stock: 80, minStock: 20, unit: 'عدد', description: 'شامپو ضد شوره و خارش' },
    { name: 'صابون عصاره گلاب', sku: 'HY-002', barcode: '6211001000172', categoryId: categories['بهداشتی'], buyPrice: 60, sellPrice: 100, stock: 120, minStock: 30, unit: 'عدد', description: 'صابون طبیعی عصاره گلاب' },
    { name: 'خمیردندان حساس ۱۲۰ گرم', sku: 'HY-003', barcode: '6211001000189', categoryId: categories['بهداشتی'], buyPrice: 120, sellPrice: 200, stock: 65, minStock: 20, unit: 'عدد', description: 'خمیردندان برای دندان‌های حساس' },
    { name: 'کرم ضد آفتاب SPF50', sku: 'HY-004', barcode: '6211001000196', categoryId: categories['بهداشتی'], buyPrice: 350, sellPrice: 550, stock: 0, minStock: 10, unit: 'عدد', description: 'کرم ضد آفتاب رنگی فاکتور ۵۰' },

    // کتاب (Books) - 3 products
    { name: 'دیوان حافظ', sku: 'BK-001', barcode: '6211001000202', categoryId: categories['کتاب'], buyPrice: 150, sellPrice: 250, stock: 40, minStock: 10, unit: 'جلد', description: 'دیوان غزلیات حافظ شیرازی با تصحیح قاسم‌غانیمی' },
    { name: 'کتاب آموزش زبان انگلیسی', sku: 'BK-002', barcode: '6211001000219', categoryId: categories['کتاب'], buyPrice: 400, sellPrice: 600, stock: 18, minStock: 5, unit: 'جلد', description: 'آموزش زبان انگلیسی سطح مبتدی تا متوسط' },
    { name: 'ریاضیات پایه دوازدهم', sku: 'BK-003', barcode: '6211001000226', categoryId: categories['کتاب'], buyPrice: 200, sellPrice: 320, stock: 55, minStock: 15, unit: 'جلد', description: 'کتاب درسی ریاضیات پایه دوازدهم رشته تجربی' },

    // اسباب بازی (Toys) - 3 products
    { name: 'لاستیک بازی کودک', sku: 'TY-001', barcode: '6211001000233', categoryId: categories['اسباب بازی'], buyPrice: 200, sellPrice: 350, stock: 30, minStock: 8, unit: 'عدد', description: 'لاستیک بازی پلاستیکی رنگی' },
    { name: 'مجموعه لگو شهر', sku: 'TY-002', barcode: '6211001000240', categoryId: categories['اسباب بازی'], buyPrice: 2000, sellPrice: 3200, stock: 8, minStock: 3, unit: 'عدد', description: 'مجموعه لگو ساخت شهر با ۲۵۰ قطعه' },
    { name: 'عروسک پارچه‌ای دخترانه', sku: 'TY-003', barcode: '6211001000257', categoryId: categories['اسباب بازی'], buyPrice: 400, sellPrice: 650, stock: 15, minStock: 5, unit: 'عدد', description: 'عروسک پارچه‌ای دست‌ساز افغانی' },

    // ورزشی (Sports) - 3 products
    { name: 'توپ فوتبال سایز ۵', sku: 'SP-001', barcode: '6211001000264', categoryId: categories['ورزشی'], buyPrice: 800, sellPrice: 1300, stock: 20, minStock: 5, unit: 'عدد', description: 'توپ فوتبال استاندارد FIFA سایز ۵' },
    { name: 'دمبل ۵ کیلویی', sku: 'SP-002', barcode: '6211001000271', categoryId: categories['ورزشی'], buyPrice: 900, sellPrice: 1500, stock: 10, minStock: 3, unit: 'عدد', description: 'دمبل تمرینی روکش لاستیکی' },
    { name: 'طناب ورزشی حرفه‌ای', sku: 'SP-003', barcode: '6211001000288', categoryId: categories['ورزشی'], buyPrice: 250, sellPrice: 400, stock: 2, minStock: 5, unit: 'عدد', description: 'طناب ورزشی با دسته‌های ارگونومیک' },
  ]

  const products: Record<string, { id: string; sellPrice: number; stock: number }> = {}
  for (const prod of productsData) {
    const created = await db.product.create({ data: prod })
    products[prod.sku] = { id: created.id, sellPrice: prod.sellPrice, stock: prod.stock }
    console.log(`   ✅ ${prod.name} (${prod.sku})`)
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. CUSTOMERS (12 customers with Afghan names)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n👥 Creating customers...')

  const customersData = [
    { name: 'احمد محمدی', phone: '0770123456', email: 'ahmed.m@gmail.com', address: 'کابل، حوزه نهم، سرای شهزاده', balance: 0 },
    { name: 'محمدعلی رضایی', phone: '0781234567', email: 'mali.rezaei@yahoo.com', address: 'کابل، حوزه سوم، خیابان فروش', balance: 1500 },
    { name: 'فاطمه احمدی', phone: '0792345678', email: null, address: 'کابل، حوزه چهارم، شیرپور', balance: 0 },
    { name: 'حامد کریمی', phone: '0773456789', email: 'hamed.karimi@gmail.com', address: 'هرات، خیابان خیام', balance: 3200 },
    { name: 'زینب نورزی', phone: '0784567890', email: 'zainab.noori@yahoo.com', address: 'مزار شریف، حوزه دوم', balance: 0 },
    { name: 'عبدالرحمن حقانی', phone: '0795678901', email: null, address: 'کندز، مرکز شهر', balance: 800 },
    { name: 'مریم نوری', phone: '0776789012', email: 'maryam.n@gmail.com', address: 'کابل، حوزه دهم، بلا حصار', balance: 0 },
    { name: 'سید اسماعیل حسینی', phone: '0787890123', email: null, address: 'جلال‌آباد، سیدabad', balance: 0 },
    { name: 'نرگس خاتمی', phone: '0798901234', email: 'narges.khatami@gmail.com', address: 'کابل، حوزه یازدهم، خیرخانه', balance: 2100 },
    { name: 'یوسف عزیزی', phone: '0779012345', email: null, address: 'بامیان، مرکز شهر', balance: 0 },
    { name: 'شیرین اکبری', phone: '0780123456', email: 'shirin.akbari@yahoo.com', address: 'غزنی، شهر نو', balance: 4500 },
    { name: 'عمر فاروقی', phone: '0791234567', email: 'omar.farooqi@gmail.com', address: 'کابل، حوزه اول، دنگری', balance: 0 },
  ]

  const customers: string[] = []
  for (const cust of customersData) {
    const created = await db.customer.create({ data: cust })
    customers.push(created.id)
    console.log(`   ✅ ${cust.name} (${cust.phone})`)
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. SUPPLIERS (6 suppliers)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🏭 Creating suppliers...')

  const suppliersData = [
    { name: 'شرکت وارداتی آریانا', phone: '0700111222', email: 'info@ariana-import.af', address: 'کابل، میدان هوایی، جاده کارخانه‌ها' },
    { name: 'بازرگانی افغان طلایی', phone: '0700222333', email: 'sales@golden-afghan.af', address: 'هرات، منطقه صنعتی' },
    { name: 'تأمین‌کننده مواد غذایی رشید', phone: '0700333444', email: 'rashid.food@gmail.com', address: 'کابل، بازار مالدان' },
    { name: 'فروشگاه عمده‌فروشی برادران نوری', phone: '0700444555', email: null, address: 'جلال‌آباد، میدان شهدا' },
    { name: 'شرکت الکترونیک پامیر', phone: '0700555666', email: 'contact@pamir-tech.af', address: 'کابل، لایه عالی‌پور' },
    { name: 'واردات لوازم بهداشتی سحر', phone: '0700666777', email: 'sahar.hygienic@gmail.com', address: 'کابل، شارinheritdocم venta' },
    { name: 'چاپخانه و نشر نوربخش', phone: '0700777888', email: 'noorbakhsh.pub@gmail.com', address: 'کابل، کارته سخی' },
  ]

  for (const sup of suppliersData) {
    await db.supplier.create({ data: sup })
    console.log(`   ✅ ${sup.name}`)
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. SALES (18 sales with sale items from past 30 days)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🧾 Creating sales...')

  const paymentMethods = ['نقدی', 'کارتی', 'نسیه'] as const

  type SaleDefinition = {
    invoiceNumber: string
    customerId: string | null
    paymentMethod: string
    daysAgo: number
    items: { sku: string; quantity: number }[]
    discount?: number
    notes?: string
  }

  const salesData: SaleDefinition[] = [
    {
      invoiceNumber: 'INV-1001',
      customerId: customers[0],
      paymentMethod: 'نقدی',
      daysAgo: 28,
      items: [
        { sku: 'LB-001', quantity: 2 },
        { sku: 'LB-002', quantity: 1 },
      ],
      discount: 100,
      notes: 'مشتری دائمی',
    },
    {
      invoiceNumber: 'INV-1002',
      customerId: customers[1],
      paymentMethod: 'نسیه',
      daysAgo: 26,
      items: [
        { sku: 'EL-001', quantity: 1 },
        { sku: 'EL-004', quantity: 2 },
      ],
      notes: 'پرداخت در دو قسط',
    },
    {
      invoiceNumber: 'INV-1003',
      customerId: customers[2],
      paymentMethod: 'کارتی',
      daysAgo: 24,
      items: [
        { sku: 'FD-001', quantity: 2 },
        { sku: 'FD-002', quantity: 1 },
        { sku: 'FD-004', quantity: 1 },
      ],
    },
    {
      invoiceNumber: 'INV-1004',
      customerId: customers[3],
      paymentMethod: 'نقدی',
      daysAgo: 22,
      items: [
        { sku: 'HM-001', quantity: 1 },
      ],
    },
    {
      invoiceNumber: 'INV-1005',
      customerId: customers[4],
      paymentMethod: 'نقدی',
      daysAgo: 20,
      items: [
        { sku: 'HY-001', quantity: 3 },
        { sku: 'HY-002', quantity: 5 },
        { sku: 'HY-003', quantity: 2 },
      ],
      discount: 50,
    },
    {
      invoiceNumber: 'INV-1006',
      customerId: customers[5],
      paymentMethod: 'کارتی',
      daysAgo: 18,
      items: [
        { sku: 'BK-001', quantity: 2 },
        { sku: 'BK-002', quantity: 1 },
      ],
    },
    {
      invoiceNumber: 'INV-1007',
      customerId: customers[6],
      paymentMethod: 'نقدی',
      daysAgo: 16,
      items: [
        { sku: 'TY-002', quantity: 1 },
        { sku: 'TY-003', quantity: 2 },
      ],
      notes: 'هدیه تولد',
    },
    {
      invoiceNumber: 'INV-1008',
      customerId: customers[7],
      paymentMethod: 'نسیه',
      daysAgo: 14,
      items: [
        { sku: 'SP-001', quantity: 2 },
        { sku: 'SP-003', quantity: 1 },
      ],
      discount: 200,
    },
    {
      invoiceNumber: 'INV-1009',
      customerId: customers[8],
      paymentMethod: 'نقدی',
      daysAgo: 12,
      items: [
        { sku: 'LB-003', quantity: 3 },
        { sku: 'LB-004', quantity: 2 },
      ],
    },
    {
      invoiceNumber: 'INV-1010',
      customerId: customers[9],
      paymentMethod: 'کارتی',
      daysAgo: 10,
      items: [
        { sku: 'EL-002', quantity: 3 },
        { sku: 'EL-003', quantity: 1 },
      ],
    },
    {
      invoiceNumber: 'INV-1011',
      customerId: customers[10],
      paymentMethod: 'نقدی',
      daysAgo: 9,
      items: [
        { sku: 'FD-001', quantity: 3 },
        { sku: 'FD-003', quantity: 2 },
        { sku: 'FD-002', quantity: 2 },
      ],
      discount: 300,
      notes: 'خرید عمده',
    },
    {
      invoiceNumber: 'INV-1012',
      customerId: customers[11],
      paymentMethod: 'نقدی',
      daysAgo: 7,
      items: [
        { sku: 'HM-002', quantity: 1 },
      ],
    },
    {
      invoiceNumber: 'INV-1013',
      customerId: customers[0],
      paymentMethod: 'کارتی',
      daysAgo: 5,
      items: [
        { sku: 'HY-001', quantity: 2 },
        { sku: 'HY-004', quantity: 1 },
      ],
    },
    {
      invoiceNumber: 'INV-1014',
      customerId: customers[2],
      paymentMethod: 'نقدی',
      daysAgo: 4,
      items: [
        { sku: 'BK-003', quantity: 4 },
      ],
      notes: 'خرید برای کتابخانه مدرسه',
    },
    {
      invoiceNumber: 'INV-1015',
      customerId: customers[4],
      paymentMethod: 'نقدی',
      daysAgo: 3,
      items: [
        { sku: 'LB-001', quantity: 1 },
        { sku: 'LB-003', quantity: 2 },
        { sku: 'HY-002', quantity: 4 },
      ],
      discount: 150,
    },
    {
      invoiceNumber: 'INV-1016',
      customerId: customers[1],
      paymentMethod: 'نسیه',
      daysAgo: 2,
      items: [
        { sku: 'EL-001', quantity: 1 },
        { sku: 'EL-002', quantity: 2 },
        { sku: 'EL-004', quantity: 1 },
      ],
      notes: 'تسویه قبض قبلی',
    },
    {
      invoiceNumber: 'INV-1017',
      customerId: customers[6],
      paymentMethod: 'کارتی',
      daysAgo: 1,
      items: [
        { sku: 'TY-001', quantity: 3 },
        { sku: 'TY-003', quantity: 1 },
      ],
    },
    {
      invoiceNumber: 'INV-1018',
      customerId: customers[9],
      paymentMethod: 'نقدی',
      daysAgo: 0,
      items: [
        { sku: 'FD-004', quantity: 2 },
        { sku: 'SP-002', quantity: 1 },
      ],
      discount: 100,
    },
  ]

  let totalSales = 0
  let totalItems = 0

  for (const saleDef of salesData) {
    const saleDate = new Date()
    saleDate.setDate(saleDate.getDate() - saleDef.daysAgo)
    saleDate.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))

    // Build sale items
    const saleItems = saleDef.items.map((item) => {
      const productInfo = products[item.sku]
      const totalPrice = productInfo.sellPrice * item.quantity
      return {
        productId: productInfo.id,
        quantity: item.quantity,
        unitPrice: productInfo.sellPrice,
        totalPrice,
      }
    })

    const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const discount = saleDef.discount ?? 0
    const finalAmount = totalAmount - discount
    const isCash = saleDef.paymentMethod === 'نقدی'
    const isCredit = saleDef.paymentMethod === 'نسیه'
    const paidAmount = isCash ? finalAmount : isCredit ? Math.round(finalAmount * 0.6) : finalAmount
    const change = isCash ? 0 : 0

    const sale = await db.sale.create({
      data: {
        invoiceNumber: saleDef.invoiceNumber,
        customerId: saleDef.customerId,
        totalAmount,
        discount,
        finalAmount,
        paymentMethod: saleDef.paymentMethod,
        paidAmount,
        change,
        notes: saleDef.notes ?? null,
        createdAt: saleDate,
        items: {
          create: saleItems,
        },
      },
    })

    totalSales += finalAmount
    totalItems += saleDef.items.reduce((s, i) => s + i.quantity, 0)
    console.log(
      `   ✅ ${saleDef.invoiceNumber} | ${saleDef.items.length} items | ${finalAmount.toLocaleString()} AFN | ${saleDef.paymentMethod}`
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. EXPENSES (9 expenses)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n💰 Creating expenses...')

  const expensesData = [
    { description: 'اجاره مغازه - اسفند ۱۴۰۳', amount: 25000, category: 'اجاره', date: new Date(Date.now() - 30 * 86400000) },
    { description: 'قبض برق ماهانه', amount: 4500, category: 'قبوض', date: new Date(Date.now() - 28 * 86400000) },
    { description: 'حقوق کارمند شماره ۱', amount: 12000, category: 'حقوق', date: new Date(Date.now() - 27 * 86400000) },
    { description: 'حقوق کارمند شماره ۲', amount: 10000, category: 'حقوق', date: new Date(Date.now() - 27 * 86400000) },
    { description: 'قبض آب شهری', amount: 1500, category: 'قبوض', date: new Date(Date.now() - 20 * 86400000) },
    { description: 'تعمیر چیلر و سیستم سرمایشی', amount: 3500, category: 'تعمیرات', date: new Date(Date.now() - 15 * 86400000) },
    { description: 'خرید پاکت و بسته‌بندی', amount: 2000, category: 'لوازم فروشگاه', date: new Date(Date.now() - 12 * 86400000) },
    { description: 'هزینه حمل و نقل کالا', amount: 5000, category: 'حمل و نقل', date: new Date(Date.now() - 8 * 86400000) },
    { description: 'حقوق کارمند شماره ۳', amount: 12000, category: 'حقوق', date: new Date(Date.now() - 2 * 86400000) },
  ]

  let totalExpenses = 0
  for (const exp of expensesData) {
    await db.expense.create({ data: exp })
    totalExpenses += exp.amount
    console.log(`   ✅ ${exp.description} | ${exp.amount.toLocaleString()} AFN`)
  }

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(55))
  console.log('  ✅ Seed completed successfully!')
  console.log('═'.repeat(55))
  console.log(`  📦 Categories:     ${categoriesData.length}`)
  console.log(`  🛍️  Products:       ${productsData.length}`)
  console.log(`  👥 Customers:      ${customersData.length}`)
  console.log(`  🧾 Sales:          ${salesData.length} (${totalItems} items)`)
  console.log(`  💰 Total Revenue:  ${totalSales.toLocaleString()} AFN`)
  console.log(`  📉 Total Expenses: ${totalExpenses.toLocaleString()} AFN`)
  console.log(`  🏭 Suppliers:      ${suppliersData.length}`)
  console.log('═'.repeat(55) + '\n')
}

main()
  .then(async () => {
    await db.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await db.$disconnect()
    process.exit(1)
  })
