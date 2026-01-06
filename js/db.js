// db.js - Versión corregida para exportar 'db'

// Si usas CDN, Dexie ya está en window.Dexie
// NO uses import Dexie from 'dexie';

const db = new Dexie('TallerCosturaDB');
db.version(1).stores({
    prendas: '++id, &nombre',
    trabajadores: '++id, &nombre',
    cortes: '++id, estado, fechaCreacion'
});

// Sembrar prendas base si la DB es nueva
db.on('populate', async () => {
    console.log("🌱 Sembrando prendas base reales...");

    // Datos reales de tu taller (convertidos de centavos a dólares)
    const prendasBase = [
            {
                nombre: "Pantalón",
                tareas: [
                    { nombre: "over aleta simple", precioUnitario: 0.05 },
                    { nombre: "over aleta doble", precioUnitario: 0.05 },
                    { nombre: "over bolsillo", precioUnitario: 0.05 },
                    { nombre: "over refuerzo", precioUnitario: 0.05 },
                    { nombre: "armado de relojero completo", precioUnitario: 0.30 },
                    { nombre: "cierre a aleta", precioUnitario: 0.05 },
                    { nombre: "cierre a delantero", precioUnitario: 0.10 },
                    { nombre: "baston", precioUnitario: 0.15 },
                    { nombre: "vista a popelina", precioUnitario: 0.05 },
                    { nombre: "despunte popelina", precioUnitario: 0.10 },
                    { nombre: "vista a delantero", precioUnitario: 0.20 },
                    { nombre: "despunte vista", precioUnitario: 0.15 },
                    { nombre: "asegurar vista", precioUnitario: 0.10 },
                    { nombre: "ensamblado", precioUnitario: 0.25 },
                    { nombre: "despunte bolsillo", precioUnitario: 0.10 },
                    { nombre: "planchar bolsillo", precioUnitario: 0.20 },
                    { nombre: "inter canezu-trasero", precioUnitario: 0.10 },
                    { nombre: "despunte canezu", precioUnitario: 0.15 },
                    { nombre: "union traseros", precioUnitario: 0.30 },
                    { nombre: "parchar bolsillo", precioUnitario: 0.35 },
                    { nombre: "atracar bolsillo", precioUnitario: 0.10 },
                    { nombre: "inter cerrar lateral", precioUnitario: 0.15 },
                    { nombre: "recta despunte lateral", precioUnitario: 0.15 },
                    { nombre: "inter cerrar entre pierna", precioUnitario: 0.15 },
                    { nombre: "unir faja", precioUnitario: 0.05 },
                    { nombre: "hacer pasador", precioUnitario: 0.15 },
                    { nombre: "pretina", precioUnitario: 0.30 },
                    { nombre: "atracar pasador baston", precioUnitario: 0.25 },
                    { nombre: "asegurar cintura", precioUnitario: 0.20 },
                    { nombre: "poner talla", precioUnitario: 0.10 },
                    { nombre: "botear", precioUnitario: 0.20 }
                ]
            },
            {
                nombre: "Short",
                tareas: [
                    { nombre: "over aleta simple", precioUnitario: 0.05 },
                    { nombre: "over aleta doble", precioUnitario: 0.05 },
                    { nombre: "over bolsillo", precioUnitario: 0.05 },
                    { nombre: "over refuerzo", precioUnitario: 0.05 },
                    { nombre: "armado de relojero completo", precioUnitario: 0.30 },
                    { nombre: "cierre a aleta", precioUnitario: 0.05 },
                    { nombre: "cierre a delantero", precioUnitario: 0.10 },
                    { nombre: "baston", precioUnitario: 0.15 },
                    { nombre: "vista a popelina", precioUnitario: 0.05 },
                    { nombre: "despunte popelina", precioUnitario: 0.10 },
                    { nombre: "vista a delantero", precioUnitario: 0.20 },
                    { nombre: "despunte vista", precioUnitario: 0.15 },
                    { nombre: "asegurar vista", precioUnitario: 0.10 },
                    { nombre: "ensamblado", precioUnitario: 0.25 },
                    { nombre: "atracar baston", precioUnitario: 0.05 },
                    { nombre: "despunte bolsillo", precioUnitario: 0.10 },
                    { nombre: "planchar bolsillo", precioUnitario: 0.20 },
                    { nombre: "inter canezu-trasero", precioUnitario: 0.10 },
                    { nombre: "despunte canezu", precioUnitario: 0.15 },
                    { nombre: "union traseros", precioUnitario: 0.30 },
                    { nombre: "parchar bolsillo", precioUnitario: 0.35 },
                    { nombre: "atracar bolsillo", precioUnitario: 0.10 },
                    { nombre: "inter cerrar lateral", precioUnitario: 0.10 },
                    { nombre: "recta despunte lateral", precioUnitario: 0.10 },
                    { nombre: "inter cerrar entre pierna", precioUnitario: 0.10 },
                    { nombre: "unir faja", precioUnitario: 0.05 },
                    { nombre: "hacer pasador", precioUnitario: 0.15 },
                    { nombre: "pretina", precioUnitario: 0.30 },
                    { nombre: "atracar pasador", precioUnitario: 0.25 },
                    { nombre: "asegurar cintura", precioUnitario: 0.20 },
                    { nombre: "poner talla", precioUnitario: 0.10 },
                    { nombre: "botear", precioUnitario: 0.20 }
                ]
            },
            {
                nombre: "Falda",
                tareas: [
                    { nombre: "over aleta simple", precioUnitario: 0.05 },
                    { nombre: "over aleta doble", precioUnitario: 0.05 },
                    { nombre: "over bolsillo", precioUnitario: 0.05 },
                    { nombre: "over refuerzo", precioUnitario: 0.05 },
                    { nombre: "armado de relojero completo", precioUnitario: 0.30 },
                    { nombre: "cierre a aleta", precioUnitario: 0.05 },
                    { nombre: "cierre a delantero", precioUnitario: 0.10 },
                    { nombre: "baston", precioUnitario: 0.15 },
                    { nombre: "vista a popelina", precioUnitario: 0.05 },
                    { nombre: "despunte popelina", precioUnitario: 0.10 },
                    { nombre: "vista a delantero", precioUnitario: 0.20 },
                    { nombre: "despunte vista", precioUnitario: 0.15 },
                    { nombre: "asegurar vista", precioUnitario: 0.10 },
                    { nombre: "ensamblado", precioUnitario: 0.25 },
                    { nombre: "despunte bolsillo", precioUnitario: 0.10 },
                    { nombre: "planchar bolsillo", precioUnitario: 0.20 },
                    { nombre: "inter canezu-trasero", precioUnitario: 0.10 },
                    { nombre: "despunte canezu", precioUnitario: 0.15 },
                    { nombre: "union traseros", precioUnitario: 0.30 },
                    { nombre: "parchar bolsillo", precioUnitario: 0.35 },
                    { nombre: "atracar bolsillo", precioUnitario: 0.10 },
                    { nombre: "inter cerrar lateral", precioUnitario: 0.15 },
                    { nombre: "recta despunte lateral", precioUnitario: 0.15 },
                    { nombre: "unir faja", precioUnitario: 0.15 },
                    { nombre: "hacer pasador", precioUnitario: 0.05 },
                    { nombre: "pretina", precioUnitario: 0.15 },
                    { nombre: "atracar pasador baston", precioUnitario: 0.30 },
                    { nombre: "asegurar cintura", precioUnitario: 0.25 },
                    { nombre: "poner talla", precioUnitario: 0.20 },
                    { nombre: "botear", precioUnitario: 0.35 }
                ]
            }
        ];

    await db.prendas.bulkAdd(prendasBase);
    console.log("✅ Prendas base reales sembradas!");
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