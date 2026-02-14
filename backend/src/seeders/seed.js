// ============================================================================
// Seeder - Datos de Prueba para InfraDigital
// Carga datos iniciales: usuarios, productos, clientes y facturas
// Ejecutar con: npm run seed
// ============================================================================

require('dotenv').config();

const { sequelize, User, Product, Client, Invoice, InvoiceItem, InventoryMovement } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Función auxiliar para generar UUIDs sin dependencia externa
const uuidv4 = () => crypto.randomUUID();

// ══════════════════════════════════════════════════════════════════════════════
// DATOS DE MUESTRA
// ══════════════════════════════════════════════════════════════════════════════

// ── Usuarios ─────────────────────────────────────────────────────────────────
const usersData = [
  {
    id: uuidv4(),
    name: 'Administrador InfraDigital',
    email: 'admin@infradigital.co',
    password: 'admin123',
    role: 'admin',
    isActive: true
  },
  {
    id: uuidv4(),
    name: 'María López Vendedora',
    email: 'maria@infradigital.co',
    password: 'maria123',
    role: 'user',
    isActive: true
  }
];

// ── Productos típicos de pequeñas empresas colombianas ───────────────────────
const productsData = [
  {
    id: uuidv4(),
    name: 'Arroz Diana 500g',
    description: 'Arroz blanco de grano largo, marca Diana',
    sku: 'ALI-001',
    price: 3200,
    cost: 2600,
    stock: 150,
    minStock: 30,
    category: 'Alimentos',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Aceite Girasol 1L',
    description: 'Aceite vegetal de girasol para cocina',
    sku: 'ALI-002',
    price: 8500,
    cost: 6800,
    stock: 80,
    minStock: 15,
    category: 'Alimentos',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Azúcar Manuelita 1kg',
    description: 'Azúcar blanca refinada del Valle del Cauca',
    sku: 'ALI-003',
    price: 4100,
    cost: 3200,
    stock: 120,
    minStock: 25,
    category: 'Alimentos',
    unit: 'kilogramo'
  },
  {
    id: uuidv4(),
    name: 'Café Sello Rojo 500g',
    description: 'Café molido colombiano tradicional',
    sku: 'ALI-004',
    price: 12500,
    cost: 9800,
    stock: 60,
    minStock: 10,
    category: 'Alimentos',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Panela en bloque 1kg',
    description: 'Panela orgánica colombiana',
    sku: 'ALI-005',
    price: 3800,
    cost: 2900,
    stock: 90,
    minStock: 20,
    category: 'Alimentos',
    unit: 'kilogramo'
  },
  {
    id: uuidv4(),
    name: 'Leche entera bolsa 1L',
    description: 'Leche entera pasteurizada en bolsa',
    sku: 'ALI-006',
    price: 3500,
    cost: 2800,
    stock: 200,
    minStock: 50,
    category: 'Lácteos',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Jabón Rey barra 300g',
    description: 'Jabón de lavar ropa, barra tradicional',
    sku: 'ASE-001',
    price: 2800,
    cost: 2100,
    stock: 100,
    minStock: 20,
    category: 'Aseo',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Detergente Fab 1kg',
    description: 'Detergente en polvo para ropa, floral',
    sku: 'ASE-002',
    price: 9200,
    cost: 7400,
    stock: 45,
    minStock: 10,
    category: 'Aseo',
    unit: 'kilogramo'
  },
  {
    id: uuidv4(),
    name: 'Papel higiénico Familia x4',
    description: 'Paquete de 4 rollos doble hoja',
    sku: 'ASE-003',
    price: 6500,
    cost: 5100,
    stock: 70,
    minStock: 15,
    category: 'Aseo',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Gaseosa Colombiana 1.5L',
    description: 'Bebida gaseosa sabor colombiana Postobón',
    sku: 'BEB-001',
    price: 4200,
    cost: 3300,
    stock: 110,
    minStock: 25,
    category: 'Bebidas',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Agua cristal 600ml',
    description: 'Agua purificada en botella personal',
    sku: 'BEB-002',
    price: 1800,
    cost: 1200,
    stock: 240,
    minStock: 50,
    category: 'Bebidas',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Harina de trigo 1kg',
    description: 'Harina de trigo para todo uso',
    sku: 'ALI-007',
    price: 4500,
    cost: 3500,
    stock: 55,
    minStock: 10,
    category: 'Alimentos',
    unit: 'kilogramo'
  },
  {
    id: uuidv4(),
    name: 'Pasta Doria espagueti 250g',
    description: 'Pasta espagueti marca Doria',
    sku: 'ALI-008',
    price: 2200,
    cost: 1700,
    stock: 130,
    minStock: 25,
    category: 'Alimentos',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Huevos AA x30',
    description: 'Cubeta de 30 huevos tamaño AA',
    sku: 'ALI-009',
    price: 18500,
    cost: 15000,
    stock: 25,
    minStock: 8,
    category: 'Alimentos',
    unit: 'caja'
  },
  {
    id: uuidv4(),
    name: 'Salchichas Zenú 250g',
    description: 'Salchichas tipo viena marca Zenú',
    sku: 'ALI-010',
    price: 5200,
    cost: 4100,
    stock: 40,
    minStock: 10,
    category: 'Alimentos',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Cloro Clorox 1L',
    description: 'Blanqueador y desinfectante líquido',
    sku: 'ASE-004',
    price: 4800,
    cost: 3600,
    stock: 3,
    minStock: 10,
    category: 'Aseo',
    unit: 'litro'
  },
  {
    id: uuidv4(),
    name: 'Bolsa basura x10',
    description: 'Bolsas plásticas para basura grandes',
    sku: 'ASE-005',
    price: 3500,
    cost: 2500,
    stock: 4,
    minStock: 8,
    category: 'Aseo',
    unit: 'unidad'
  },
  {
    id: uuidv4(),
    name: 'Chocolate Corona 500g',
    description: 'Chocolate de mesa colombiano tradicional',
    sku: 'ALI-011',
    price: 7800,
    cost: 6200,
    stock: 35,
    minStock: 8,
    category: 'Alimentos',
    unit: 'unidad'
  }
];

// ── Clientes de muestra ──────────────────────────────────────────────────────
const clientsData = [
  {
    id: uuidv4(),
    name: 'Tienda Don José',
    email: 'donjose@tienda.com',
    phone: '3001234567',
    address: 'Calle 10 #25-30, Barrio Centro',
    city: 'Bogotá',
    nit_cc: '900123456-1',
    type: 'persona_juridica',
    notes: 'Cliente frecuente, pedidos semanales'
  },
  {
    id: uuidv4(),
    name: 'María Fernanda García',
    email: 'mfgarcia@correo.com',
    phone: '3109876543',
    address: 'Carrera 7 #45-12, Apto 301',
    city: 'Medellín',
    nit_cc: '52456789',
    type: 'persona_natural',
    notes: 'Compras al por menor, pago en efectivo'
  },
  {
    id: uuidv4(),
    name: 'Restaurante El Buen Sabor',
    email: 'contacto@elbuensabor.co',
    phone: '3205551234',
    address: 'Avenida 68 #12-45',
    city: 'Cali',
    nit_cc: '900789012-3',
    type: 'persona_juridica',
    notes: 'Compras al por mayor de alimentos'
  },
  {
    id: uuidv4(),
    name: 'Carlos Andrés Pérez',
    email: 'cperez@email.com',
    phone: '3157894561',
    address: 'Calle 50 #8-20',
    city: 'Barranquilla',
    nit_cc: '80123456',
    type: 'persona_natural',
    notes: null
  },
  {
    id: uuidv4(),
    name: 'Minimercado La Esquina',
    email: 'laesquina@mini.co',
    phone: '3012345678',
    address: 'Carrera 15 #80-10',
    city: 'Bucaramanga',
    nit_cc: '900456789-5',
    type: 'persona_juridica',
    notes: 'Pedidos quincenales, crédito a 15 días'
  },
  {
    id: uuidv4(),
    name: 'Ana Patricia Rodríguez',
    email: 'ana.rodriguez@correo.com',
    phone: '3178523641',
    address: 'Transversal 6 #42-18',
    city: 'Pereira',
    nit_cc: '41258963',
    type: 'persona_natural',
    notes: 'Preferencia por productos orgánicos'
  },
  {
    id: uuidv4(),
    name: 'Cafetería El Tinto',
    email: 'eltinto@cafe.co',
    phone: '3024567890',
    address: 'Calle 72 #11-25',
    city: 'Bogotá',
    nit_cc: '900234567-8',
    type: 'persona_juridica',
    notes: 'Compras de café y azúcar frecuentes'
  },
  {
    id: uuidv4(),
    name: 'Luis Fernando Martínez',
    email: 'lfmartinez@hotmail.com',
    phone: '3113698521',
    address: 'Diagonal 25 #30-50',
    city: 'Manizales',
    nit_cc: '73456123',
    type: 'persona_natural',
    notes: null
  },
  {
    id: uuidv4(),
    name: 'Panadería San Rafael',
    email: 'sanrafael@pan.co',
    phone: '3167894523',
    address: 'Carrera 30 #15-68',
    city: 'Ibagué',
    nit_cc: '900345678-2',
    type: 'persona_juridica',
    notes: 'Compras de harina y huevos al por mayor'
  },
  {
    id: uuidv4(),
    name: 'Gloria Stella Ospina',
    email: 'gstella@gmail.com',
    phone: '3045678912',
    address: 'Calle 5 #20-15, Casa 8',
    city: 'Cartagena',
    nit_cc: '32789456',
    type: 'persona_natural',
    notes: 'Compras de aseo y hogar'
  }
];

// ══════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL DE SEED
// ══════════════════════════════════════════════════════════════════════════════

const seed = async () => {
  try {
    console.log('🌱 Iniciando proceso de seed de la base de datos...');
    console.log('═══════════════════════════════════════════════════');

    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida.');

    // Sincronizar modelos (force: true elimina y recrea las tablas)
    await sequelize.sync({ force: true });
    console.log('✅ Tablas recreadas exitosamente.');

    // ── 1. Crear Usuarios ────────────────────────────────────────────────
    console.log('\n📌 Creando usuarios...');
    const users = [];
    for (const userData of usersData) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const user = await User.scope('withPassword').create({
        ...userData,
        password: hashedPassword
      });
      users.push(user);
      console.log(`   ✓ Usuario: ${userData.email} (${userData.role})`);
    }

    // ── 2. Crear Productos ───────────────────────────────────────────────
    console.log('\n📦 Creando productos...');
    const products = [];
    for (const productData of productsData) {
      const product = await Product.create(productData);
      products.push(product);

      // Crear movimiento de inventario inicial
      await InventoryMovement.create({
        productId: product.id,
        userId: users[0].id,
        type: 'entrada',
        quantity: product.stock,
        previousStock: 0,
        newStock: product.stock,
        reason: 'Stock inicial - Seed del sistema',
        reference: `SEED-INIT`
      });

      console.log(`   ✓ Producto: ${productData.name} (Stock: ${productData.stock})`);
    }

    // ── 3. Crear Clientes ────────────────────────────────────────────────
    console.log('\n👥 Creando clientes...');
    const clients = [];
    for (const clientData of clientsData) {
      const client = await Client.create(clientData);
      clients.push(client);
      console.log(`   ✓ Cliente: ${clientData.name} (${clientData.city})`);
    }

    // ── 4. Crear Facturas con Ítems ──────────────────────────────────────
    console.log('\n🧾 Creando facturas de ejemplo...');

    // Datos de facturas de ejemplo
    const invoicesData = [
      {
        clientIndex: 0,
        userIndex: 0,
        items: [
          { productIndex: 0, quantity: 10 },
          { productIndex: 3, quantity: 5 },
          { productIndex: 5, quantity: 20 }
        ],
        paymentMethod: 'efectivo',
        status: 'pagada',
        daysAgo: 28
      },
      {
        clientIndex: 2,
        userIndex: 1,
        items: [
          { productIndex: 1, quantity: 8 },
          { productIndex: 4, quantity: 15 },
          { productIndex: 13, quantity: 3 }
        ],
        paymentMethod: 'transferencia',
        status: 'pagada',
        daysAgo: 25
      },
      {
        clientIndex: 4,
        userIndex: 0,
        items: [
          { productIndex: 6, quantity: 20 },
          { productIndex: 7, quantity: 5 },
          { productIndex: 8, quantity: 10 }
        ],
        paymentMethod: 'tarjeta',
        status: 'pagada',
        daysAgo: 20
      },
      {
        clientIndex: 6,
        userIndex: 1,
        items: [
          { productIndex: 3, quantity: 10 },
          { productIndex: 2, quantity: 8 }
        ],
        paymentMethod: 'efectivo',
        status: 'pagada',
        daysAgo: 15
      },
      {
        clientIndex: 8,
        userIndex: 0,
        items: [
          { productIndex: 11, quantity: 20 },
          { productIndex: 13, quantity: 5 }
        ],
        paymentMethod: 'transferencia',
        status: 'pagada',
        daysAgo: 12
      },
      {
        clientIndex: 1,
        userIndex: 1,
        items: [
          { productIndex: 9, quantity: 6 },
          { productIndex: 10, quantity: 12 },
          { productIndex: 14, quantity: 4 }
        ],
        paymentMethod: 'efectivo',
        status: 'pendiente',
        daysAgo: 8
      },
      {
        clientIndex: 3,
        userIndex: 0,
        items: [
          { productIndex: 0, quantity: 5 },
          { productIndex: 5, quantity: 10 },
          { productIndex: 12, quantity: 8 }
        ],
        paymentMethod: 'tarjeta',
        status: 'pagada',
        daysAgo: 5
      },
      {
        clientIndex: 5,
        userIndex: 1,
        items: [
          { productIndex: 17, quantity: 3 },
          { productIndex: 4, quantity: 5 }
        ],
        paymentMethod: 'efectivo',
        status: 'pendiente',
        daysAgo: 3
      },
      {
        clientIndex: 7,
        userIndex: 0,
        items: [
          { productIndex: 15, quantity: 2 },
          { productIndex: 16, quantity: 3 },
          { productIndex: 8, quantity: 5 }
        ],
        paymentMethod: 'transferencia',
        status: 'pendiente',
        daysAgo: 1
      },
      {
        clientIndex: 9,
        userIndex: 1,
        items: [
          { productIndex: 6, quantity: 10 },
          { productIndex: 7, quantity: 3 },
          { productIndex: 9, quantity: 8 }
        ],
        paymentMethod: 'efectivo',
        status: 'pagada',
        daysAgo: 0
      }
    ];

    let invoiceCounter = 0;
    const currentYear = new Date().getFullYear();

    for (const invoiceData of invoicesData) {
      invoiceCounter++;
      const invoiceNumber = `FE-${currentYear}-${String(invoiceCounter).padStart(4, '0')}`;

      // Calcular fechas
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - invoiceData.daysAgo);

      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 30);

      // Calcular subtotal de la factura
      let subtotal = 0;
      const invoiceItems = [];

      for (const itemData of invoiceData.items) {
        const product = products[itemData.productIndex];
        const itemSubtotal = parseFloat((itemData.quantity * parseFloat(product.price)).toFixed(2));
        subtotal += itemSubtotal;

        invoiceItems.push({
          productId: product.id,
          productName: product.name,
          quantity: itemData.quantity,
          unitPrice: parseFloat(product.price),
          subtotal: itemSubtotal
        });
      }

      // Calcular IVA (19%) y total
      const taxRate = 19.00;
      const taxAmount = parseFloat((subtotal * 0.19).toFixed(2));
      const total = parseFloat((subtotal + taxAmount).toFixed(2));

      // Crear la factura
      const invoice = await Invoice.create({
        invoiceNumber,
        userId: users[invoiceData.userIndex].id,
        clientId: clients[invoiceData.clientIndex].id,
        subtotal,
        taxRate,
        taxAmount,
        total,
        status: invoiceData.status,
        paymentMethod: invoiceData.paymentMethod,
        notes: null,
        issueDate,
        dueDate
      });

      // Crear ítems de la factura
      for (const item of invoiceItems) {
        await InvoiceItem.create({
          invoiceId: invoice.id,
          ...item
        });
      }

      console.log(`   ✓ Factura: ${invoiceNumber} | Cliente: ${clients[invoiceData.clientIndex].name} | Total: $${total.toLocaleString('es-CO')} | Estado: ${invoiceData.status}`);
    }

    // ── Resumen final ────────────────────────────────────────────────────
    console.log('\n═══════════════════════════════════════════════════');
    console.log('✅ Seed completado exitosamente');
    console.log('═══════════════════════════════════════════════════');
    console.log(`📊 Resumen:`);
    console.log(`   • Usuarios creados: ${usersData.length}`);
    console.log(`   • Productos creados: ${productsData.length}`);
    console.log(`   • Clientes creados: ${clientsData.length}`);
    console.log(`   • Facturas creadas: ${invoicesData.length}`);
    console.log('');
    console.log('🔑 Credenciales de acceso:');
    console.log('   Admin:    admin@infradigital.co / admin123');
    console.log('   Usuario:  maria@infradigital.co / maria123');
    console.log('═══════════════════════════════════════════════════');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante el seed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Ejecutar seed
seed();
