// db.js - Versión corregida para exportar 'db'

// Si usas CDN, Dexie ya está en window.Dexie
// NO uses import Dexie from 'dexie';

const db = new Dexie("TallerCosturaDB");
db.version(1).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
});

// ✅ Versión 2: agrega tabla de pagos a trabajadores
db.version(2).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha",
});

// ✅ Versión 3: agrega índice para fechaFinalizacion
db.version(3).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha",
});

// ✅ Versión 4: agrega índice corteId en pagos para poder eliminar por corte
db.version(4).stores({
  prendas: "++id, &nombre",
  trabajadores: "++id, &nombre",
  cortes: "++id, estado, fechaCreacion",
  pagos: "++id, trabajadorId, fecha, corteId",
});

// Sembrar prendas base si la DB es nueva
db.on("populate", async () => {
  console.log("🌱 Sembrando prendas base...");

  // Precios en CENTAVOS (enteros) - más fácil de editar en móvil
  // Para mostrar en Bolivianos: dividir por 100
  const prendasBase = [
    {
      nombre: "Pantalón",
      tareas: [
        { nombre: "over aleta simple", precioUnitario: 5 },
        { nombre: "over aleta doble", precioUnitario: 5 },
        { nombre: "over bolsillo", precioUnitario: 5 },
        { nombre: "over refuerzo", precioUnitario: 5 },
        { nombre: "armado de relojero completo", precioUnitario: 30 },
        { nombre: "cierre a aleta", precioUnitario: 5 },
        { nombre: "cierre a delantero", precioUnitario: 10 },
        { nombre: "baston", precioUnitario: 15 },
        { nombre: "vista a popelina", precioUnitario: 5 },
        { nombre: "despunte popelina", precioUnitario: 10 },
        { nombre: "vista a delantero", precioUnitario: 20 },
        { nombre: "despunte vista", precioUnitario: 15 },
        { nombre: "asegurar vista", precioUnitario: 10 },
        { nombre: "ensamblado", precioUnitario: 25 },
        { nombre: "despunte bolsillo", precioUnitario: 10 },
        { nombre: "planchar bolsillo", precioUnitario: 20 },
        { nombre: "inter canezu-trasero", precioUnitario: 10 },
        { nombre: "despunte canezu", precioUnitario: 15 },
        { nombre: "union traseros", precioUnitario: 30 },
        { nombre: "parchar bolsillo", precioUnitario: 35 },
        { nombre: "atracar bolsillo", precioUnitario: 10 },
        { nombre: "inter cerrar lateral", precioUnitario: 15 },
        { nombre: "recta despunte lateral", precioUnitario: 15 },
        { nombre: "inter cerrar entre pierna", precioUnitario: 15 },
        { nombre: "unir faja", precioUnitario: 5 },
        { nombre: "hacer pasador", precioUnitario: 15 },
        { nombre: "pretina", precioUnitario: 30 },
        { nombre: "atracar pasador baston", precioUnitario: 25 },
        { nombre: "asegurar cintura", precioUnitario: 20 },
        { nombre: "poner talla", precioUnitario: 10 },
        { nombre: "botear", precioUnitario: 20 },
      ],
    },
    {
      nombre: "Short",
      tareas: [
        { nombre: "over aleta simple", precioUnitario: 5 },
        { nombre: "over aleta doble", precioUnitario: 5 },
        { nombre: "over bolsillo", precioUnitario: 5 },
        { nombre: "over refuerzo", precioUnitario: 5 },
        { nombre: "armado de relojero completo", precioUnitario: 30 },
        { nombre: "cierre a aleta", precioUnitario: 5 },
        { nombre: "cierre a delantero", precioUnitario: 10 },
        { nombre: "baston", precioUnitario: 15 },
        { nombre: "vista a popelina", precioUnitario: 5 },
        { nombre: "despunte popelina", precioUnitario: 10 },
        { nombre: "vista a delantero", precioUnitario: 20 },
        { nombre: "despunte vista", precioUnitario: 15 },
        { nombre: "asegurar vista", precioUnitario: 10 },
        { nombre: "ensamblado", precioUnitario: 25 },
        { nombre: "atracar baston", precioUnitario: 5 },
        { nombre: "despunte bolsillo", precioUnitario: 10 },
        { nombre: "planchar bolsillo", precioUnitario: 20 },
        { nombre: "inter canezu-trasero", precioUnitario: 10 },
        { nombre: "despunte canezu", precioUnitario: 15 },
        { nombre: "union traseros", precioUnitario: 30 },
        { nombre: "parchar bolsillo", precioUnitario: 35 },
        { nombre: "atracar bolsillo", precioUnitario: 10 },
        { nombre: "inter cerrar lateral", precioUnitario: 10 },
        { nombre: "recta despunte lateral", precioUnitario: 10 },
        { nombre: "inter cerrar entre pierna", precioUnitario: 10 },
        { nombre: "unir faja", precioUnitario: 5 },
        { nombre: "hacer pasador", precioUnitario: 15 },
        { nombre: "pretina", precioUnitario: 30 },
        { nombre: "atracar pasador", precioUnitario: 25 },
        { nombre: "asegurar cintura", precioUnitario: 20 },
        { nombre: "poner talla", precioUnitario: 10 },
        { nombre: "botear", precioUnitario: 20 },
      ],
    },
    {
      nombre: "Falda",
      tareas: [
        { nombre: "over aleta simple", precioUnitario: 5 },
        { nombre: "over aleta doble", precioUnitario: 5 },
        { nombre: "over bolsillo", precioUnitario: 5 },
        { nombre: "over refuerzo", precioUnitario: 5 },
        { nombre: "armado de relojero completo", precioUnitario: 30 },
        { nombre: "cierre a aleta", precioUnitario: 5 },
        { nombre: "cierre a delantero", precioUnitario: 10 },
        { nombre: "baston", precioUnitario: 15 },
        { nombre: "vista a popelina", precioUnitario: 5 },
        { nombre: "despunte popelina", precioUnitario: 10 },
        { nombre: "vista a delantero", precioUnitario: 20 },
        { nombre: "despunte vista", precioUnitario: 15 },
        { nombre: "asegurar vista", precioUnitario: 10 },
        { nombre: "ensamblado", precioUnitario: 25 },
        { nombre: "despunte bolsillo", precioUnitario: 10 },
        { nombre: "planchar bolsillo", precioUnitario: 20 },
        { nombre: "inter canezu-trasero", precioUnitario: 10 },
        { nombre: "despunte canezu", precioUnitario: 15 },
        { nombre: "union traseros", precioUnitario: 30 },
        { nombre: "parchar bolsillo", precioUnitario: 35 },
        { nombre: "atracar bolsillo", precioUnitario: 10 },
        { nombre: "inter cerrar lateral", precioUnitario: 15 },
        { nombre: "recta despunte lateral", precioUnitario: 15 },
        { nombre: "unir faja", precioUnitario: 15 },
        { nombre: "hacer pasador", precioUnitario: 5 },
        { nombre: "pretina", precioUnitario: 15 },
        { nombre: "atracar pasador baston", precioUnitario: 30 },
        { nombre: "asegurar cintura", precioUnitario: 25 },
        { nombre: "poner talla", precioUnitario: 20 },
        { nombre: "botear", precioUnitario: 35 },
      ],
    },
  ];

  await db.prendas.bulkAdd(prendasBase);
  console.log("✅ Prendas base sembradas con precios en centavos!");
});

// Exportar la instancia de db para que app.js pueda usarla
export { db };

// Mostrar datos en consola después de 1 segundo
setTimeout(async () => {
  try {
    const prendas = await db.prendas.toArray();
    console.log("📦 Prendas en DB:", prendas);

    if (prendas.length === 0) {
      console.warn("⚠️ No hay prendas. ¿Se ejecutó 'populate'?");
    } else {
      console.log(`🎉 ${prendas.length} prendas cargadas correctamente.`);
    }
  } catch (error) {
    console.error("🔥 Error al leer prendas:", error);
  }
}, 1000);
