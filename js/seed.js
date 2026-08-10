// ============================================================
// UCVInventario · Catalogo semilla (conteo fisico)
// ------------------------------------------------------------
// 1674 insumos importados desde la BD de AcopioUCV
// (snapshot 2026-07-06).
// Se conserva el "id" original de cada insumo para poder
// cargar los conteos de vuelta al sistema de acopio.
// Todas las cantidades arrancan en 0: el voluntario cuenta el
// stock fisico real y escribe la cantidad encontrada.
// NO editar a mano — regenerar desde el catalogo de la BD.
//
// Actualizado 2026-07-26: categorias reescritas de las 12 viejas
// (agua/alimentos/higiene/bebes/mascotas/medicina/herramientas/
// limpieza/ropa/papeleria/otros/bebidas) a las 13 nuevas
// (alimentos_no_perecederos/alimentos/higiene_personal/snacks/
// alimentos_bebe/limpieza/panales_higiene_ninos/hidratacion/
// veterinaria/herramientas/ropa_descanso/medicina/papeleria),
// reclasificadas por nombre de producto con el mismo criterio
// aplicado a la migracion real de new_schema_archive.products.
// ============================================================
export const CATALOGO = [
  {
    "id": "seed0199",
    "nombre": "Ac tranexamico 500mg/5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0200",
    "nombre": "Ac tranexamico 75mg/5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0201",
    "nombre": "Ac tranoxemico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0202",
    "nombre": "Aceblu",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0203",
    "nombre": "Acetaminofem jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0209",
    "nombre": "Acetaminofén (Jarabe Pediátrico)",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0210",
    "nombre": "Acetaminofén (Tabletas)",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0204",
    "nombre": "Acetaminofen + clorfeniramina 120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0205",
    "nombre": "Acetaminofen 1 g 24 uni",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0206",
    "nombre": "Acetaminofen 100 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0207",
    "nombre": "Acetaminofen 120 sobre 5",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0213",
    "nombre": "Acetaminofen 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0214",
    "nombre": "Acetaminofén 650 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 12
  },
  {
    "id": "seed0218",
    "nombre": "Acetaminofen blister",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0220",
    "nombre": "Acetaminofen de 180 sobre 5",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0221",
    "nombre": "Acetaminofen de 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0222",
    "nombre": "Acetaminofen de 65mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 500
  },
  {
    "id": "seed0224",
    "nombre": "Acetaminofen generico 650mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 41
  },
  {
    "id": "seed0225",
    "nombre": "Acetaminofén gotas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0227",
    "nombre": "Acetaminofen oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0231",
    "nombre": "Acetataminofen 650 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 32
  },
  {
    "id": "seed0232",
    "nombre": "Acetato de clormadinona + etinilestradiol 3mg /0,02 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0233",
    "nombre": "Acetazolamide 250mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0234",
    "nombre": "Acetilcisteina 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0235",
    "nombre": "Acetinofen 180mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0236",
    "nombre": "Aceval 650mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0237",
    "nombre": "Aciclovir 400 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1097",
    "nombre": "Ácido acetilsalicílico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0238",
    "nombre": "Acido acetilsalicilico 81 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0239",
    "nombre": "Acido folico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0240",
    "nombre": "Acido folico 5mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0241",
    "nombre": "Ácido fólico amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0242",
    "nombre": "Acido folico ampolla 5mg/10 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0243",
    "nombre": "Acido folico con hierro 400mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0244",
    "nombre": "Acido tranexamico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0245",
    "nombre": "Acido tranexamico ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0246",
    "nombre": "Acido valproreo 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 11
  },
  {
    "id": "seed0247",
    "nombre": "Acitromiana susp oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0248",
    "nombre": "Actaminofen",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0249",
    "nombre": "Actaminofen pediatricos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0250",
    "nombre": "Acuatabs",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0251",
    "nombre": "Adehesivo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0252",
    "nombre": "Adehesivo para ojos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0253",
    "nombre": "Adehesivo transparente",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0254",
    "nombre": "Adehesivos de tela",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0255",
    "nombre": "Adehesivos plasticos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0256",
    "nombre": "Adhesivo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0257",
    "nombre": "Adhesivo de tela",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 14
  },
  {
    "id": "seed0258",
    "nombre": "Adhesivo micropore blanco",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0259",
    "nombre": "Adhesivo micropore marron",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0260",
    "nombre": "Adhesivo para bolsa de orina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0262",
    "nombre": "Adhesivos de papel",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0263",
    "nombre": "Admnistracion intravenosa",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0264",
    "nombre": "Adrenalina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0265",
    "nombre": "Adrenalina 1mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0266",
    "nombre": "Adrenalina ampollas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0267",
    "nombre": "Aerosol salbutamol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0268",
    "nombre": "Afoncotib caja",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0011",
    "nombre": "Agua oxigenada",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0269",
    "nombre": "Agua oxigenada 1 lt",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0270",
    "nombre": "Agua oxigenada 120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0273",
    "nombre": "Agua oxigenada 140 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0275",
    "nombre": "Agua oxigenada 200 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0276",
    "nombre": "Agua oxigenada 230 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0278",
    "nombre": "Agua oxigenada 240 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0280",
    "nombre": "Agua oxigenada 500 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0282",
    "nombre": "Agua oxigenada 750L",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0283",
    "nombre": "Agua oxigenada 800 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0284",
    "nombre": "Agua oxigenada 950 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0012",
    "nombre": "Agua para inyección",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0285",
    "nombre": "Aguja 21",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0286",
    "nombre": "Aguja 26",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0287",
    "nombre": "Aguja de insulina 32 gr 4mm azul",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0288",
    "nombre": "Aguja de insulina morada 5mm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 13
  },
  {
    "id": "seed0289",
    "nombre": "Aguja espinal",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0290",
    "nombre": "Agujas 0.5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0291",
    "nombre": "Agujas 10 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 22
  },
  {
    "id": "seed0292",
    "nombre": "Agujas 1 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0293",
    "nombre": "Agujas 20 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0294",
    "nombre": "Agujas 25",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0295",
    "nombre": "Agujas 3 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0296",
    "nombre": "Agujas 5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 24
  },
  {
    "id": "seed0297",
    "nombre": "Agujas 60 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0298",
    "nombre": "Agujas de insulina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 28
  },
  {
    "id": "seed0300",
    "nombre": "Agujas de insulina verde 4mm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0301",
    "nombre": "Agujas de puncion lumbar 25 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0302",
    "nombre": "Agujas hipotérmicas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0303",
    "nombre": "Ahdesivos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0304",
    "nombre": "Albendazol 200 mg / 5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0305",
    "nombre": "Albendazol 400mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0306",
    "nombre": "Albendazol 400mg/10 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0307",
    "nombre": "Albendazol jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0308",
    "nombre": "Albuterol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0309",
    "nombre": "Alcohol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0317",
    "nombre": "Alcohol 1 lt",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0311",
    "nombre": "Alcohol 10 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0312",
    "nombre": "Alcohol 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 11
  },
  {
    "id": "mr893wpi-188oa1i10hvy5",
    "nombre": "Alcohol 1000 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0314",
    "nombre": "Alcohol 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0315",
    "nombre": "Alcohol 120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 14
  },
  {
    "id": "seed0318",
    "nombre": "Alcohol 240 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 19
  },
  {
    "id": "seed0320",
    "nombre": "Alcohol 25 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0321",
    "nombre": "Alcohol 3750 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0322",
    "nombre": "Alcohol 500 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0325",
    "nombre": "Alcohol 800 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0326",
    "nombre": "Alcohol 950 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0327",
    "nombre": "Alcohol absoluto",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0328",
    "nombre": "Alcohol antiseptico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0329",
    "nombre": "Alcohol de 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0332",
    "nombre": "Alcohol de 1litrol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0333",
    "nombre": "Alcohol de 200 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0336",
    "nombre": "Alcohol de 700 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0339",
    "nombre": "Algodon",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 35
  },
  {
    "id": "seed0340",
    "nombre": "Algodon 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0341",
    "nombre": "Algodon aséptico 50 gr",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0342",
    "nombre": "Algodon de 10 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0343",
    "nombre": "Algodon de 25mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0345",
    "nombre": "Algodones absorbente",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0346",
    "nombre": "Algodones absorbente paq",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0347",
    "nombre": "Alivet",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0348",
    "nombre": "Almodipina tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0349",
    "nombre": "Almodipina via oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0350",
    "nombre": "Alocurinol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0351",
    "nombre": "Alopurinal oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0352",
    "nombre": "Ambroxol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0353",
    "nombre": "Ambroxol 15 mg jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0354",
    "nombre": "Ambroxol 30 MG 30 cc",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0355",
    "nombre": "Amikacina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0356",
    "nombre": "Aminnofilina 20mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0357",
    "nombre": "Amiodarona 200mg 20 unidades",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0358",
    "nombre": "Amlodipina 10mg oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0359",
    "nombre": "Amlodipina 40mg oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0360",
    "nombre": "Amlodipina 5mg oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0361",
    "nombre": "Amoxiciina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0362",
    "nombre": "Amoxicilina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0363",
    "nombre": "Amoxicilina + acido clavulanico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0364",
    "nombre": "Amoxicilina 500 mg tab 10",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0365",
    "nombre": "Amoxicilina 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0366",
    "nombre": "Amoxicilina amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0367",
    "nombre": "Amoxicilina capsulas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0368",
    "nombre": "Amoxicilina con acido clavulanico inyectable",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0369",
    "nombre": "Amoxicilina con acido clavulanico oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0370",
    "nombre": "Amoxicilina de 250mg sobre 2.5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0372",
    "nombre": "Amoxicilina susp oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0374",
    "nombre": "Amoxicilina+acido clavulanico 60 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0375",
    "nombre": "Ampicilina 500 mg cap",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0376",
    "nombre": "Ampicilina amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0377",
    "nombre": "Ampolla amoxicilina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0378",
    "nombre": "Ampolla ampicilina+sulbactan",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0379",
    "nombre": "Ampolla atropina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0380",
    "nombre": "Ampolla bupiracaina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0381",
    "nombre": "Ampolla ceftriaxona",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0382",
    "nombre": "Ampolla clindamicina 90mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0384",
    "nombre": "Ampolla de acido tranexamico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0386",
    "nombre": "Ampolla de ketoprofeno",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0387",
    "nombre": "Ampolla de lidocina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0388",
    "nombre": "Ampolla de meroperen",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0390",
    "nombre": "Ampolla dexametasona",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0392",
    "nombre": "Ampolla diclofenac",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0393",
    "nombre": "Ampolla dipirona",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0394",
    "nombre": "Ampolla dipirona 1 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0395",
    "nombre": "Ampolla fenitoina sodica 250mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0396",
    "nombre": "Ampolla fitometadiona 10mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0397",
    "nombre": "Ampolla furosemida",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0398",
    "nombre": "Ampolla hidrocortisona 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0399",
    "nombre": "Ampolla hiosina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0400",
    "nombre": "Ampolla masaputen",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0401",
    "nombre": "Ampolla medoxican",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0402",
    "nombre": "Ampolla omeprazol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0403",
    "nombre": "Ampolla pantoprazol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0404",
    "nombre": "Ampolla vancomicina 1 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0405",
    "nombre": "Ampolla vitamina k",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0406",
    "nombre": "Ampolla vitamina K 10mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0407",
    "nombre": "Ampollas acido tranexamico 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0408",
    "nombre": "Ampollas amikacina 100mg/2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0409",
    "nombre": "Ampollas ampicilina 1 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0410",
    "nombre": "Ampollas cafepina1 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0412",
    "nombre": "Ampollas de adrenalina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0413",
    "nombre": "Ampollas de amicacina 50 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0414",
    "nombre": "Ampollas de cefaxolina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0415",
    "nombre": "Ampollas de cefriaxona",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0416",
    "nombre": "Ampollas de diclofenac",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0417",
    "nombre": "Ampollas de hierro",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0418",
    "nombre": "Ampollas de keterolac",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0419",
    "nombre": "Ampollas de vancomicina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0420",
    "nombre": "Ampollas declofenac potasico 75mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0421",
    "nombre": "Ampollas declofenac sodico 75mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0422",
    "nombre": "Ampollas dexametasona 4mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0423",
    "nombre": "Ampollas dexametasona 8mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0424",
    "nombre": "Ampollas furosemida 20mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0425",
    "nombre": "Ampollas ketoprofeno 100mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0426",
    "nombre": "Ampollas miovit",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0427",
    "nombre": "Ampollas omeprazol 40mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0428",
    "nombre": "Ampollas ondasetron 8mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0429",
    "nombre": "Ampollas salbutamol 2.5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0430",
    "nombre": "Ampollas sulmetrin 40mg/120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0431",
    "nombre": "Ampollas tiocolchosido 4mg/2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0432",
    "nombre": "Ampollas tiolchicosido 4mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0433",
    "nombre": "Amprolina sulbactam amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1214",
    "nombre": "Analgésico pediátrico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0434",
    "nombre": "Analper pedriatico jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0435",
    "nombre": "Anitanipal",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1330",
    "nombre": "Antiácido 240 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0436",
    "nombre": "Antibacterial",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 25
  },
  {
    "id": "seed0437",
    "nombre": "Antibacterial 500 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0438",
    "nombre": "Antifungico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0439",
    "nombre": "Antigripal",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 16
  },
  {
    "id": "seed0440",
    "nombre": "Anydol forte jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0441",
    "nombre": "Aoxicilina+ acido claudanico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0442",
    "nombre": "Apiret 65mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0443",
    "nombre": "Apiret jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0444",
    "nombre": "Apositos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0445",
    "nombre": "Aquatabs tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1362",
    "nombre": "Árnica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0446",
    "nombre": "Arterial blood sampling kit",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0447",
    "nombre": "Artrovit",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0448",
    "nombre": "Arudil rivaroxaben 20 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0449",
    "nombre": "Aspirina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0450",
    "nombre": "Aspirina oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0451",
    "nombre": "Atamel",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0452",
    "nombre": "Atamel forte 650 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0453",
    "nombre": "Atamel susp oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0454",
    "nombre": "Atorvastatina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0455",
    "nombre": "Atorvastatina 20 mg cápsulas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0456",
    "nombre": "Atorvastatina 40 mg cápsulas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0457",
    "nombre": "Atropina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0458",
    "nombre": "Atropina sulfato 1mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0459",
    "nombre": "Atrovatadia 20mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0460",
    "nombre": "Avantina 50 sobre 5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0461",
    "nombre": "Azitromicina 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0462",
    "nombre": "Azitromicina susp. oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0463",
    "nombre": "Baberos de bebé",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0464",
    "nombre": "Bacitracina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0465",
    "nombre": "Baciuermina amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0466",
    "nombre": "Bajalengua und",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 30
  },
  {
    "id": "seed0467",
    "nombre": "Bajolengua",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 450
  },
  {
    "id": "seed0468",
    "nombre": "Bandas elasticas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0469",
    "nombre": "Base colostomia",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0470",
    "nombre": "Base de colostomia 70 mm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0471",
    "nombre": "Batas quirúrgicas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 32
  },
  {
    "id": "seed0472",
    "nombre": "Bencidamina jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0473",
    "nombre": "Benzodrazol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0474",
    "nombre": "Betadine",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1106",
    "nombre": "Betahistina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0475",
    "nombre": "Betahistina oral 8mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0476",
    "nombre": "Betametasona 0,25-5mg oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1108",
    "nombre": "Bicarbonato de sodio 3%",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0477",
    "nombre": "Bipirona 100mg/ 2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1109",
    "nombre": "Biprolil",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0478",
    "nombre": "Bisoprolol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0479",
    "nombre": "Bisoprolol oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1110",
    "nombre": "Bisturí",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0480",
    "nombre": "Blister ciclobnzapins cloridrato 5mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1113",
    "nombre": "Bolsa colectora de orina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0481",
    "nombre": "Bolsas de algodon",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1118",
    "nombre": "Botas quirúrgicas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0482",
    "nombre": "Brolat jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0483",
    "nombre": "Bromhexina 8mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0484",
    "nombre": "Bromuro de ipratropio 20 ml/ 0,25 mg/ml solucion para inhalar",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0486",
    "nombre": "Bromuro ipratropio",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0487",
    "nombre": "Broxol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0488",
    "nombre": "Broxol 50mg/5 ml jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0489",
    "nombre": "Bucoxol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0490",
    "nombre": "Budesonida 0,5 mg amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1120",
    "nombre": "Budesonida inhalador",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0491",
    "nombre": "Budesonido 1mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0492",
    "nombre": "Bupivacaina 5mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0493",
    "nombre": "Bupropion 150 MG",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1122",
    "nombre": "Bureta de infusión",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0494",
    "nombre": "Buscapina 20mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1123",
    "nombre": "Buscapina amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1124",
    "nombre": "Butalol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1125",
    "nombre": "Cabestrillo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0495",
    "nombre": "Cacao en polvo / tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0496",
    "nombre": "Caja acetaminofén 150 mg 20 tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0497",
    "nombre": "Caja agujas hipodérmicas 100 und",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0499",
    "nombre": "Caja de algodon 50un",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0500",
    "nombre": "Caja de bisoprolol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0501",
    "nombre": "Caja de cateter",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0502",
    "nombre": "Cajas de acetaminofen",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0503",
    "nombre": "Cajas de acido folico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0504",
    "nombre": "Cajas de algodon de 100 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0505",
    "nombre": "Cajas de compresas de gasas esteriles",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 240
  },
  {
    "id": "seed0506",
    "nombre": "Cajas de diclofenac potasico 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 14
  },
  {
    "id": "seed0507",
    "nombre": "Cajas de diclofenac potasico 50mg 40 tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0508",
    "nombre": "Cajas diclofenac potásico 50 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 14
  },
  {
    "id": "seed0509",
    "nombre": "Cajas pantoprazol 40mg ampollas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0510",
    "nombre": "Cajs de algodon de 500 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0511",
    "nombre": "Calamine 500 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0512",
    "nombre": "Calcio 600mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1139",
    "nombre": "Camilla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1140",
    "nombre": "Campo quirúrgico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0513",
    "nombre": "Candesartan 16mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1141",
    "nombre": "Cánula médica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 23
  },
  {
    "id": "seed1142",
    "nombre": "Capillo de yodo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0514",
    "nombre": "Capsula oral de loratadina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0515",
    "nombre": "Captopril 25mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0516",
    "nombre": "Captopril 25mg oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0517",
    "nombre": "Captopril oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1144",
    "nombre": "Carbamazepina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 30
  },
  {
    "id": "seed0518",
    "nombre": "Carbocisteina 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0519",
    "nombre": "Carbocisteina 250 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0520",
    "nombre": "Carbonato de calcio 600mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0521",
    "nombre": "Carboximetilcestina 250mg/5 ml jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1145",
    "nombre": "Careta de protección",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 13
  },
  {
    "id": "seed1149",
    "nombre": "Carvedilol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0522",
    "nombre": "Carvedilol 12.5 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0524",
    "nombre": "Cataprestan tabs 0,150 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0525",
    "nombre": "Cateter",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0526",
    "nombre": "Cateter 20",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0527",
    "nombre": "Cateter cardiaco",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0528",
    "nombre": "Cateter de 20 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0529",
    "nombre": "Cateter de 24",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0530",
    "nombre": "Cateter de latex desechable",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0531",
    "nombre": "Cateter de mujer",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0532",
    "nombre": "Cateter de silicon",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0533",
    "nombre": "Catéter de succión",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0534",
    "nombre": "Cateter foley con balón",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0535",
    "nombre": "Cateter intravenoso",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 51
  },
  {
    "id": "seed0536",
    "nombre": "Cateter IV",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0537",
    "nombre": "Cateter nro 16",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1151",
    "nombre": "Catéter número 20",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0538",
    "nombre": "Cateter pericraneal",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0539",
    "nombre": "Cateter verde",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0540",
    "nombre": "Cateteres de 18",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0541",
    "nombre": "Cateteres de 22",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0542",
    "nombre": "Cateteres de 24 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0543",
    "nombre": "Cateteres nro 18",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0544",
    "nombre": "Cateteres nro 22",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0545",
    "nombre": "Cateteres nro 24",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0546",
    "nombre": "Cefadroxil 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1152",
    "nombre": "Cefadroxilo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1153",
    "nombre": "Cefalexina 60 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1156",
    "nombre": "Cefalosporina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0547",
    "nombre": "Cefalosporina capsulas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1162",
    "nombre": "Cefalotina 1 gr",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0548",
    "nombre": "Cefazolina amp polvo para solu",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1154",
    "nombre": "Cefepime polvo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1155",
    "nombre": "Cefixima 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0549",
    "nombre": "Cefixima 200 mg jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1163",
    "nombre": "Ceftazidima",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0550",
    "nombre": "Ceftriaxona",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1157",
    "nombre": "Ceftriaxona 1 gr",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0552",
    "nombre": "Ceftriaxona ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0553",
    "nombre": "Centro de cama",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 55
  },
  {
    "id": "seed1158",
    "nombre": "Centwise",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0554",
    "nombre": "Cepillos quirúrgicos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0555",
    "nombre": "Cetinzina 1mg/5l",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0556",
    "nombre": "Cetinzina 5mg/5l",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0557",
    "nombre": "Cetinzina diclorhidrato 10mg/ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0558",
    "nombre": "Cetiricina de 1 mg sobre ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0559",
    "nombre": "Cetirizina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0560",
    "nombre": "Cetirizina 10 mg 10 tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 38
  },
  {
    "id": "seed0561",
    "nombre": "Cetirizina gotas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0562",
    "nombre": "Cetirizina jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0563",
    "nombre": "Cetirizina jarabe pediatrica 5 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0564",
    "nombre": "Cetirizina pediatrica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0565",
    "nombre": "Cetrizina 10 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0566",
    "nombre": "Cido ascorbico 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0567",
    "nombre": "Ciprafloxacina solucion 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1172",
    "nombre": "Ciprofloxacina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0568",
    "nombre": "Ciprofloxacina 100mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 12
  },
  {
    "id": "seed0569",
    "nombre": "Ciprofloxacina 2mg/200 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0570",
    "nombre": "Ciprofloxacina 500 mg tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0571",
    "nombre": "Ciprofloxacina solucion",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0572",
    "nombre": "Ciprofloxacina tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0573",
    "nombre": "Ciprofloxaima 200mg 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1173",
    "nombre": "Citercaína",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0574",
    "nombre": "Citicolina 1000mg/4 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1174",
    "nombre": "Citicolina 2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0576",
    "nombre": "Citicolina 500mg/2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1175",
    "nombre": "Citrato de calcio",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0577",
    "nombre": "Citrato de magnesio",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1176",
    "nombre": "Citrato de potasio",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0578",
    "nombre": "Clafeniremina 10mg/ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0579",
    "nombre": "Clanidina amp 150 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1178",
    "nombre": "Clarasol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1179",
    "nombre": "Clindamicina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0580",
    "nombre": "Clindamicina 300 mg tab 16",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0581",
    "nombre": "Clindamicina 900 mg / 6 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0582",
    "nombre": "Clindemicina 90mg/6 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1180",
    "nombre": "Clodopan gotas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1181",
    "nombre": "Clonidina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0583",
    "nombre": "Clorferniranina maleato 10mg tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1182",
    "nombre": "Clorhexidina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0584",
    "nombre": "Clorhidrato de oximetazdine",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0585",
    "nombre": "Cloruro de magnesio",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1185",
    "nombre": "Cloruro de potasio",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0586",
    "nombre": "Cloruro de potasio ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1189",
    "nombre": "Collarín cervical",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1191",
    "nombre": "Complejo vitamínico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0587",
    "nombre": "Compresas de gasas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0588",
    "nombre": "Compresas de gasas con guia",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0589",
    "nombre": "Compresas de gasas esteril 4x4",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0590",
    "nombre": "Compresas laparatomia esteriles",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed1192",
    "nombre": "Compresas médicas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 36
  },
  {
    "id": "seed0591",
    "nombre": "Compresas para laparatomía",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0592",
    "nombre": "Coresan 81 mg 40",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0593",
    "nombre": "Crema de arroz 400 gr",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0594",
    "nombre": "Crema de arroz 500 gr",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0595",
    "nombre": "Crema de arroz 800 gr",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0596",
    "nombre": "Cuptopril",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1129",
    "nombre": "Curitas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 57
  },
  {
    "id": "seed0597",
    "nombre": "Dapagliflozina 10mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0598",
    "nombre": "Decaxona 8 g/2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0599",
    "nombre": "Deflacort 6mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0600",
    "nombre": "Dencoru 40mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1205",
    "nombre": "Dencorub con rolón",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1206",
    "nombre": "Depósito antiasfixia",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0601",
    "nombre": "Desketoprofeno 2mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0602",
    "nombre": "Desloratadina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0603",
    "nombre": "Desloratadina 5mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0604",
    "nombre": "Desloratadina oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0607",
    "nombre": "Desloratadina pediatrica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0605",
    "nombre": "Desloratadina pediatrica 1 caja",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0608",
    "nombre": "Dexametasona 20mg 10 tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0609",
    "nombre": "Dexametasona 4mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0610",
    "nombre": "Dexametasona ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 12
  },
  {
    "id": "seed0611",
    "nombre": "Dexametasona ampolla 8mg 2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0612",
    "nombre": "Dextansoprazol 30 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0061",
    "nombre": "Dextro sal 5%",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1207",
    "nombre": "Dextrometorfano",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0613",
    "nombre": "Dextrometorfano bromhidrato 15 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0614",
    "nombre": "Dextrometorfano gotas 15 mg 30 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0615",
    "nombre": "Dextrometorfano jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0616",
    "nombre": "Dextrosa",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0617",
    "nombre": "Dextrosa 500 cc",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0618",
    "nombre": "Dexttrometorfano bomhidrato 15MG/120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1208",
    "nombre": "Diadex",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0619",
    "nombre": "Diasepan rectan 20mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0620",
    "nombre": "Diazepam",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0621",
    "nombre": "Diazepam 5mg/ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0622",
    "nombre": "Diclifenac potasico 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0623",
    "nombre": "Diclofenac",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0624",
    "nombre": "Diclofenac 100mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0625",
    "nombre": "Diclofenac 75/3 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0626",
    "nombre": "Diclofenac 75mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 12
  },
  {
    "id": "seed0627",
    "nombre": "Diclofenac 75 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0628",
    "nombre": "Diclofenac ácido libre 1.8mg/ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0629",
    "nombre": "Diclofenac endovenoso",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0630",
    "nombre": "Diclofenac potasico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 34
  },
  {
    "id": "seed0631",
    "nombre": "Diclofenac potasico 1.8mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0632",
    "nombre": "Diclofenac potasico 100 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0633",
    "nombre": "Diclofenac potasico 100mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 167
  },
  {
    "id": "seed0634",
    "nombre": "Diclofenac potasico 3 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0635",
    "nombre": "Diclofenac potasico 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0636",
    "nombre": "Diclofenac potasico 50mg tab 10",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 114
  },
  {
    "id": "seed0637",
    "nombre": "Diclofenac potasico 75 ml amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0638",
    "nombre": "Diclofenac potasico 75mg/5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0639",
    "nombre": "Diclofenac potasico ampolla 75 mg/1",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0640",
    "nombre": "Diclofenac potasico pediatrico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0641",
    "nombre": "Diclofenac sodico 120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0642",
    "nombre": "Diclofenac sodico 65 mg ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0643",
    "nombre": "Diclofenac sódico 75 MG ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0644",
    "nombre": "Diclofenac sodico 7mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0645",
    "nombre": "Diclofenac sodico supusitorio 50 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0646",
    "nombre": "Diclofennac potasico 75mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0648",
    "nombre": "Diosmina + hesperidina 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1209",
    "nombre": "Dioxigen",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0649",
    "nombre": "Dipirona 1 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0651",
    "nombre": "Dipirona 500 mg ampollas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0652",
    "nombre": "Dipirona amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0653",
    "nombre": "Dipirona amp 1 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0654",
    "nombre": "Dipirona amp 500 mg/3 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0655",
    "nombre": "Dipirona ampolla 1 g 2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0656",
    "nombre": "Dipirona endovenosa",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0657",
    "nombre": "Dipirona tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0658",
    "nombre": "Disbiotic en polvo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0661",
    "nombre": "Discos corte de esmeril",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0662",
    "nombre": "Discos de esmeril",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1212",
    "nombre": "Diurético",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1213",
    "nombre": "Doble vía IV",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0663",
    "nombre": "DOL acetaminofén 450mg + cafeína 40mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0664",
    "nombre": "DOL acetaminofén 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0665",
    "nombre": "DOL acetaminofén 650mg + cafeína 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0666",
    "nombre": "Dologesic 400mg/60mg cápsulas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0667",
    "nombre": "Domperidona 10mg oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0668",
    "nombre": "Dotosxil 30 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0669",
    "nombre": "Drospirena 3mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0670",
    "nombre": "Drospirenona + etinilestradiol 3mg /0,02 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0671",
    "nombre": "Duloxetina 30 MG cápsulas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0672",
    "nombre": "Duloxetina 60 MG cápsulas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1216",
    "nombre": "Efedrina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1295",
    "nombre": "Electrobisturí (lápiz)",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1218",
    "nombre": "Electrodos médicos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1211",
    "nombre": "Electrodos para marcapasos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1217",
    "nombre": "Electrolitos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0673",
    "nombre": "Enalapril 10 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0674",
    "nombre": "Enalapril 20 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0675",
    "nombre": "Enapril 20mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0676",
    "nombre": "Enoxaparina inyectable",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1219",
    "nombre": "Enoxaparina sódica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1223",
    "nombre": "Enterogermina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0677",
    "nombre": "Epidrina 6% ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0678",
    "nombre": "Equipo peroneal",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0679",
    "nombre": "Escitalopram",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0680",
    "nombre": "Esmeril",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0681",
    "nombre": "Esomeprazol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0682",
    "nombre": "Esomeprazol 20mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1227",
    "nombre": "Espodarin",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0683",
    "nombre": "Esponja de gasas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1229",
    "nombre": "Esponjas médicas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0685",
    "nombre": "Etoricoxib tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0686",
    "nombre": "Evogliptina 25 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1232",
    "nombre": "Femex",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0687",
    "nombre": "Femmex 200mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0688",
    "nombre": "Fenitoina sodica 100mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0689",
    "nombre": "Fenitona suspo 125mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1233",
    "nombre": "Férula de mano",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1234",
    "nombre": "Festal oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0690",
    "nombre": "Fexofenadina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0691",
    "nombre": "Fexofenadina caja",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0692",
    "nombre": "Fin al grip antigripal",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1237",
    "nombre": "Fitomenadiona",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0693",
    "nombre": "Flatoril",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0694",
    "nombre": "Fluconazol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0695",
    "nombre": "Fluconazol 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1238",
    "nombre": "Flunarizina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1239",
    "nombre": "Formol 1000 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0696",
    "nombre": "Fuconazol ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1243",
    "nombre": "Fumarato ferroso 120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0697",
    "nombre": "Fumarato ferroso jarabe 120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0698",
    "nombre": "Furocemina 20mg/2 ml ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0699",
    "nombre": "Furosemida 1mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0700",
    "nombre": "Furosemida 20mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1245",
    "nombre": "Furosemida amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0701",
    "nombre": "Gabapentina 300mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0702",
    "nombre": "Galon de alcohol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0703",
    "nombre": "Galone de alcohol normal",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0704",
    "nombre": "Gasas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 99
  },
  {
    "id": "seed0705",
    "nombre": "Gasas 2x2",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 11
  },
  {
    "id": "seed0706",
    "nombre": "Gasas 3x3",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0707",
    "nombre": "Gasas 4x4",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 24
  },
  {
    "id": "seed0708",
    "nombre": "Gasas esteriles",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 442
  },
  {
    "id": "seed0709",
    "nombre": "Gasas no esteriles",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 59
  },
  {
    "id": "seed0710",
    "nombre": "Gasas no esteriles caja 50 uni",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1247",
    "nombre": "Gastroaliv",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0711",
    "nombre": "Gebapentina 300mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0712",
    "nombre": "Gel antibacterial",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0713",
    "nombre": "Gel antibacterial 120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0714",
    "nombre": "Gel antibacterial 500 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0715",
    "nombre": "Gel antibacterial de 1 L",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1249",
    "nombre": "Gel antiinflamatorio",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0716",
    "nombre": "Gel de ultrasinido 250 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1250",
    "nombre": "Gel de ultrasonido",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0717",
    "nombre": "Genfibrozilo 600 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 11
  },
  {
    "id": "seed0718",
    "nombre": "Gentamicina 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0719",
    "nombre": "Gentamicina 160 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0720",
    "nombre": "Gentamicina 2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1251",
    "nombre": "Gerdex 240 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0721",
    "nombre": "Glibencamida 5mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0722",
    "nombre": "Gluconasol inyectable",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1138",
    "nombre": "Gluconato de calcio",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0723",
    "nombre": "Gluconato de calcio 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1252",
    "nombre": "Glucosamina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 51
  },
  {
    "id": "seed1253",
    "nombre": "Gorro quirúrgico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0725",
    "nombre": "Gotas antibioticas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1255",
    "nombre": "Gotas oftalmológicas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 21
  },
  {
    "id": "seed0726",
    "nombre": "Gotas para la nariz",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0727",
    "nombre": "Guantes de latex",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 18
  },
  {
    "id": "seed0728",
    "nombre": "Guantes de nitrilo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 79
  },
  {
    "id": "seed0729",
    "nombre": "Guantes de nitrilo L",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "mr48eve8-zhmylt10ppaie",
    "nombre": "Guantes de nitrilo L 100 und",
    "categoria": "medicina",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0730",
    "nombre": "Guantes de nitrilo M",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 105
  },
  {
    "id": "seed0731",
    "nombre": "Guantes de nitrilo pares",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 35
  },
  {
    "id": "seed0732",
    "nombre": "Guantes de nitrilo S",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 75
  },
  {
    "id": "seed0733",
    "nombre": "Guantes esteriles 6.5",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0734",
    "nombre": "Guantes esteriles 7",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0735",
    "nombre": "Guantes estériles 7.5",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 35
  },
  {
    "id": "seed0736",
    "nombre": "Guantes esteriles pares",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0737",
    "nombre": "Guantes esteriles s/t pares",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 19
  },
  {
    "id": "seed1132",
    "nombre": "Guantes médicos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 109
  },
  {
    "id": "seed0739",
    "nombre": "Guantes para examinar (bolsa)",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1257",
    "nombre": "Guata médica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1259",
    "nombre": "Haloperidol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0740",
    "nombre": "Haloperidol 5mg en ampollas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0741",
    "nombre": "Hamerer 450mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1260",
    "nombre": "Hemorroidal",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0185",
    "nombre": "Hidroclorotiazida",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0742",
    "nombre": "Hidrocortasol 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0743",
    "nombre": "Hidrocortisona 100mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0744",
    "nombre": "Hidrocortisona 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0745",
    "nombre": "Hidrocortisona ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1261",
    "nombre": "Hidrocortisona EV",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0746",
    "nombre": "Hierro + acido folico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0747",
    "nombre": "Hierro oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0748",
    "nombre": "Hierro tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1263",
    "nombre": "Hisopos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0749",
    "nombre": "Hisopos de betadine",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0750",
    "nombre": "Histaler 5mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1264",
    "nombre": "Hojas de corte médico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0751",
    "nombre": "Hrtrodar 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1265",
    "nombre": "Humidificador de oxígeno",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0752",
    "nombre": "Ibersartan via oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0753",
    "nombre": "Ibuprofeno",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 18
  },
  {
    "id": "seed0754",
    "nombre": "IBUPROFENO 200",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0755",
    "nombre": "Ibuprofeno 200 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0756",
    "nombre": "Ibuprofeno 200mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0757",
    "nombre": "Ibuprofeno 20mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0758",
    "nombre": "Ibuprofeno 400 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 50
  },
  {
    "id": "seed0759",
    "nombre": "Ibuprofeno 400mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0760",
    "nombre": "Ibuprofeno 600 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0761",
    "nombre": "Ibuprofeno 600mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0762",
    "nombre": "Ibuprofeno 800 mg tab 10",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0763",
    "nombre": "Ibuprofeno de 600mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0764",
    "nombre": "Ibuprofeno en suspension pediatrica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0766",
    "nombre": "Ibuprofeno jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0767",
    "nombre": "Ibuprofeno oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0768",
    "nombre": "Ibuprofeno suspension",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0769",
    "nombre": "Ictafin",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 150
  },
  {
    "id": "seed1266",
    "nombre": "Infusor manual 1000 cc",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0770",
    "nombre": "Inmovilizador de brazo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0771",
    "nombre": "Inmovilizador de pierna",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1267",
    "nombre": "Inmovilizadores",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0772",
    "nombre": "Inyectadora 10 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0773",
    "nombre": "Inyectadora 3 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0774",
    "nombre": "Inyectadora 5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 32
  },
  {
    "id": "seed0775",
    "nombre": "Inyectadoras",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 37
  },
  {
    "id": "seed0777",
    "nombre": "Inyectadoras de 10 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0778",
    "nombre": "Iodine",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0779",
    "nombre": "Iodopuidana 1% solucion topica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0780",
    "nombre": "Irbesartan tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0781",
    "nombre": "Irtopam",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0782",
    "nombre": "Jarabe acetaminofen",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0784",
    "nombre": "Jarabe de hierro 40/15",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0785",
    "nombre": "Jarabe levofloxacina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0786",
    "nombre": "Jarabe para la tos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0787",
    "nombre": "Jarabe pediátrico diclofenac",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0788",
    "nombre": "Jarabe pediatrico diclofenac 1.8mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0789",
    "nombre": "Jarabe pediatrico diclofenac 120/5",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0790",
    "nombre": "Jarabe tos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1273",
    "nombre": "Jelco IV",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0791",
    "nombre": "Jeringa",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 32
  },
  {
    "id": "seed0807",
    "nombre": "Jeringa 1 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 63
  },
  {
    "id": "seed0792",
    "nombre": "Jeringa 10 cc und",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0808",
    "nombre": "Jeringa 10 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 51
  },
  {
    "id": "seed0794",
    "nombre": "Jeringa 20 cc und",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0802",
    "nombre": "Jeringa 20 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0795",
    "nombre": "Jeringa 3 cc und",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0803",
    "nombre": "Jeringa 3 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0804",
    "nombre": "Jeringa 5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0806",
    "nombre": "Jeringa esteril 20 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0814",
    "nombre": "Jeringas 6cc",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0817",
    "nombre": "Jeringas de 2'0",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0823",
    "nombre": "Jeringas de 60cc",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0824",
    "nombre": "Jeringas de 60 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0825",
    "nombre": "Jeringas de insulina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 108
  },
  {
    "id": "seed0826",
    "nombre": "Jeringas desechables",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0827",
    "nombre": "Katoprofeno amp 100 mg/2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0828",
    "nombre": "Ketaproxan 100mg/2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0829",
    "nombre": "Ketoprofeno",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0830",
    "nombre": "Ketoprofeno 100 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0832",
    "nombre": "Ketoprofeno 100mg en polvo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0833",
    "nombre": "Ketoprofeno 100mg/`5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0834",
    "nombre": "Ketoprofeno ampollas 100 mg 3 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0835",
    "nombre": "Ketoprofeno oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0836",
    "nombre": "Ketorolaco 100 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0837",
    "nombre": "Ketorolaco 20 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0838",
    "nombre": "Ketorolaco 30 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0839",
    "nombre": "Ketorolaco 30mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0840",
    "nombre": "Ketotifeno",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1276",
    "nombre": "Kidcol pediátrico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1277",
    "nombre": "Kinerton",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0841",
    "nombre": "Kit de cateter",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0842",
    "nombre": "Kit de higine feminina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0843",
    "nombre": "Lagrimas artificiales",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1294",
    "nombre": "Lancetas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1302",
    "nombre": "Lentes de protección",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 24
  },
  {
    "id": "seed0845",
    "nombre": "Levetiraceten 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0846",
    "nombre": "Levocetirizina diclorhidrato solución",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0847",
    "nombre": "Levofloxacina 250 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0848",
    "nombre": "Levofloxacina 5000mg/ 200 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0849",
    "nombre": "Levofloxuna 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0850",
    "nombre": "Levotiroxina sodica 50 mcg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1293",
    "nombre": "Lidocaína",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0851",
    "nombre": "Lidocaína endovenosa ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1305",
    "nombre": "Ligadura quirúrgica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1306",
    "nombre": "Liolactil",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0852",
    "nombre": "Livaroxaban",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1298",
    "nombre": "Llave de tres vías",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0q2hbt8r3yv",
    "nombre": "Loción jabonosa",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0854",
    "nombre": "Loperamida 2mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0855",
    "nombre": "Loratadina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0856",
    "nombre": "Loratadina 10 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 16
  },
  {
    "id": "seed0857",
    "nombre": "Loratadina 1mg sobre ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0858",
    "nombre": "Loratadina oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0859",
    "nombre": "Loratadina suspension oral 5mg/2 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0860",
    "nombre": "Losartan 10mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0861",
    "nombre": "Losartan 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0862",
    "nombre": "Losartan potasico 100 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0864",
    "nombre": "Losartan potasico 50 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 29
  },
  {
    "id": "seed0865",
    "nombre": "Losartán potásico 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0866",
    "nombre": "Lozatan 10mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1308",
    "nombre": "Lubricante médico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0867",
    "nombre": "Maacrogoteros",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0868",
    "nombre": "Macro gotero",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0869",
    "nombre": "Macro goteros de 20",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0870",
    "nombre": "Macrogotero",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 100
  },
  {
    "id": "seed0872",
    "nombre": "Magnesio",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0873",
    "nombre": "Magnesio oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1311",
    "nombre": "Manguera de succión",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0874",
    "nombre": "Manta térmica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1312",
    "nombre": "Máscara de oxígeno/nebulización",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1314",
    "nombre": "Mascarilla médica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1114",
    "nombre": "Material de transfusión",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1316",
    "nombre": "Megardena",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0875",
    "nombre": "Meloxicam 15mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0876",
    "nombre": "Meloxican 15 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1319",
    "nombre": "Mentolato 50 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1320",
    "nombre": "Meropenem 1 gr",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0877",
    "nombre": "Mesodiazol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0878",
    "nombre": "Metamizol sodico 100mg / 2 ml ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0879",
    "nombre": "Metamizol Sódico 1 g Ampollas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0880",
    "nombre": "Metanizol 1 g amo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1184",
    "nombre": "Metformina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0881",
    "nombre": "Metformina clorhidrato 500 MG oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0882",
    "nombre": "Metformina clorhidrato 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0883",
    "nombre": "Metformina clorhidrato 850 MG",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 12
  },
  {
    "id": "seed0884",
    "nombre": "Metformina clorhidrato 850 MG oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0885",
    "nombre": "Metilprednisolona 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0886",
    "nombre": "Metmorfina 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0887",
    "nombre": "Metoclopramida",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0888",
    "nombre": "Metoclopramida 5 MG 120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0889",
    "nombre": "Metoclopramida amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0890",
    "nombre": "Metoclopramida jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0891",
    "nombre": "Metronidazol 200mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0892",
    "nombre": "Metronidazol 200mg/120mg ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0893",
    "nombre": "Metronidazol 500 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0894",
    "nombre": "Metronidazol 500 mg /100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0895",
    "nombre": "Metronidazol amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0896",
    "nombre": "Metronidazol jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0897",
    "nombre": "Metrovax 500 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0898",
    "nombre": "Mevopenen 1 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0899",
    "nombre": "Micro gotero",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0900",
    "nombre": "Microgotero",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 32
  },
  {
    "id": "seed1322",
    "nombre": "Midazolam",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0901",
    "nombre": "Migren 65mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1323",
    "nombre": "Milax",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0902",
    "nombre": "Miovit jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1244",
    "nombre": "Mometasona 500 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0903",
    "nombre": "Mometasona 5micro gramo suspensión",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 52
  },
  {
    "id": "seed0904",
    "nombre": "Montelukast 10mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0905",
    "nombre": "Moxifloxacino 400mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0906",
    "nombre": "Mulpirocin 15mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0907",
    "nombre": "Multivitaminico jarabe 120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1325",
    "nombre": "Muñequeras",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0909",
    "nombre": "N-acetilcisteína 600mg oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0910",
    "nombre": "N-butilbromuro de hioscina 10 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0911",
    "nombre": "Naproxeno 250mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0912",
    "nombre": "Naproxeno 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1326",
    "nombre": "Nas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1284",
    "nombre": "Nebulizador",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1327",
    "nombre": "Neopra amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1328",
    "nombre": "Neostigmina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1331",
    "nombre": "Nifedipina 10 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0913",
    "nombre": "Nifedipina 20mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1254",
    "nombre": "Nifedipina gotas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1332",
    "nombre": "Ninazo 15 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0914",
    "nombre": "Nipe jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0915",
    "nombre": "Nitazoxasina 100mg/30 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0916",
    "nombre": "Nortcicol 200 mg cápsulas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0917",
    "nombre": "Notolac sublingual",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0918",
    "nombre": "Noxipiril gripe noche 10 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1333",
    "nombre": "Obturadores IV",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 53
  },
  {
    "id": "seed0919",
    "nombre": "Omeprazol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0920",
    "nombre": "Omeprazol 20 mg tab 10",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0921",
    "nombre": "Omeprazol 40 MG ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0922",
    "nombre": "Omeprazol 40 mg tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0923",
    "nombre": "Omeprazol amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0924",
    "nombre": "Omeprazol solucion inyectable 40mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1334",
    "nombre": "Onatrin",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0925",
    "nombre": "Ondansetron 8mg/4 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0926",
    "nombre": "Ondensentron 8mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0927",
    "nombre": "Osteotrex",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0928",
    "nombre": "Overskin 40%",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1183",
    "nombre": "Oximetazolina gotas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1335",
    "nombre": "Oxímetro",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0929",
    "nombre": "Pantoprazol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0930",
    "nombre": "Pantoprazol 40 mg caja",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0931",
    "nombre": "Paq agua oxigenada 120cc (72un)",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0934",
    "nombre": "Paq alcohol 120cc (72un)",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 21
  },
  {
    "id": "seed0935",
    "nombre": "Paquete de gasas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0936",
    "nombre": "Paracetamol 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0937",
    "nombre": "Paracetamol 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0938",
    "nombre": "Paracetamol intravenoso 1 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1345",
    "nombre": "Parche ocular",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0940",
    "nombre": "Parches adhesivos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 16
  },
  {
    "id": "seed0941",
    "nombre": "Pares de guantes esteriles",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1349",
    "nombre": "Pedialyte 500 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1351",
    "nombre": "Penicilina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0943",
    "nombre": "Perebrom 28mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0944",
    "nombre": "Pericranecil aguja de 19",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0945",
    "nombre": "Pericranecil aguja de 21",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 26
  },
  {
    "id": "seed0946",
    "nombre": "Pericranecil aguja de 23",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 11
  },
  {
    "id": "seed1354",
    "nombre": "Pinzas médicas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0947",
    "nombre": "Piperacilina sodica 4.5 polvo inyectable",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0948",
    "nombre": "Piperacilina sodica polvo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0949",
    "nombre": "Piperazina 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1409",
    "nombre": "Pirantel",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1358",
    "nombre": "Polivitamínico gotas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1363",
    "nombre": "Poudire",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0950",
    "nombre": "Predixolona de 3mg sobre ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1364",
    "nombre": "Prednisona",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0951",
    "nombre": "Prednisona 5 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0952",
    "nombre": "Prednisona 5 mg 30 tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0953",
    "nombre": "Prednisona 50 mg de 10 tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1365",
    "nombre": "Pregabalina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0954",
    "nombre": "Pregabalina 75mg oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0955",
    "nombre": "Probioticos 90 tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0956",
    "nombre": "Progesterona 200mg oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1367",
    "nombre": "Propofol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0957",
    "nombre": "Protector de cama",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 12
  },
  {
    "id": "seed0958",
    "nombre": "Protector de cama 10und",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1369",
    "nombre": "Protosufile crema",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0960",
    "nombre": "Protosurfil 30mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0961",
    "nombre": "Psicoactivos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1373",
    "nombre": "Quetiapina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0962",
    "nombre": "Ranitidina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 13
  },
  {
    "id": "seed0963",
    "nombre": "Ranitidina amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0964",
    "nombre": "Ranitidina susp oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0965",
    "nombre": "Ranitinida 25mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0966",
    "nombre": "Ranitinida 50mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0967",
    "nombre": "Recolector de heces",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1376",
    "nombre": "Regulador de flujo IV",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0968",
    "nombre": "Reservorio insulina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1379",
    "nombre": "Ringer lactato",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1381",
    "nombre": "Rivaroxabán",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0969",
    "nombre": "Rivaroxabán 20mg x 28 pas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0970",
    "nombre": "Rollo de algodon",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0971",
    "nombre": "Rollo de vendas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1383",
    "nombre": "Rollo de yeso",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0972",
    "nombre": "Runilibina susp oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0973",
    "nombre": "Salbutamol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0974",
    "nombre": "Salbutamol 10 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0975",
    "nombre": "Salbutamol 2.5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0976",
    "nombre": "Salbutamol suspension 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0098",
    "nombre": "Sales de rehidratación",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1262",
    "nombre": "Sales de rehidratación oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1133",
    "nombre": "Scalp IV",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 11
  },
  {
    "id": "seed1310",
    "nombre": "Scalp/Mariposa IV",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 37
  },
  {
    "id": "seed1386",
    "nombre": "Sertralina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1388",
    "nombre": "Set de extensión IV",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1389",
    "nombre": "Set de infusión IV",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1391",
    "nombre": "Set ginecológico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0977",
    "nombre": "Situsin",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0978",
    "nombre": "Sobres de alivet",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0979",
    "nombre": "Sobres de suero oral en polvo",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0980",
    "nombre": "Solucion antiseptica 115",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0981",
    "nombre": "Solución antiséptica 460 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0982",
    "nombre": "Solucion cloruro de sodio 10 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0983",
    "nombre": "Solucion de cloruro de sodio 0,9%",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0984",
    "nombre": "Solucion dextrosa",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0985",
    "nombre": "Solución fisiológica 0.9%",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 115
  },
  {
    "id": "seed0987",
    "nombre": "Solucion fisiologica pediatrica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0988",
    "nombre": "Solucion Fisiologica ssn 0,9",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 18
  },
  {
    "id": "seed0989",
    "nombre": "Solucion hartman",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0991",
    "nombre": "Solucion nazal 15 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0992",
    "nombre": "Solucion rindec",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0993",
    "nombre": "Solucion salina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0994",
    "nombre": "Solucion yodada",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0995",
    "nombre": "Solucion yodada 180 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0996",
    "nombre": "Soluciones con dextrosa",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0997",
    "nombre": "Sonda",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1397",
    "nombre": "Sonda de Levin",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0998",
    "nombre": "Sonda de succion",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1382",
    "nombre": "Soporte ortopédico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 27
  },
  {
    "id": "seed1401",
    "nombre": "Sucralfato",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1387",
    "nombre": "Suero",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0999",
    "nombre": "Suero fisiologico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1406",
    "nombre": "Suero hidratante",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1405",
    "nombre": "Sulfadiazina de plata",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1001",
    "nombre": "Sulfadiazina de plata 30 mg crema",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1002",
    "nombre": "Sulfadiazina de platab 30mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1003",
    "nombre": "Sulmetrina 40mg sobre 5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1004",
    "nombre": "Supositorios glicerina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1134",
    "nombre": "Suturas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 24
  },
  {
    "id": "seed1126",
    "nombre": "Tabillas de ferulización",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1005",
    "nombre": "Tableta antimosquitos / zancudos",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1006",
    "nombre": "Tableta de chocolate",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1007",
    "nombre": "Tabs irvesartan 150mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1008",
    "nombre": "Tachipirin 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1009",
    "nombre": "Tamoa 250 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1411",
    "nombre": "Tarsilax",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1010",
    "nombre": "Teragrip tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1011",
    "nombre": "Teratosil jarabe",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1012",
    "nombre": "Termometro",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1013",
    "nombre": "Termometro digital",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1417",
    "nombre": "Tetraciclina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1014",
    "nombre": "Tiamina 300 mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1015",
    "nombre": "Timetropin 80mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1016",
    "nombre": "Tiocolchicosido",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1017",
    "nombre": "Tiocolchicosido 4mg ampolla",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1018",
    "nombre": "Tiocolchicosido tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1418",
    "nombre": "Tiras glucosa",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 33
  },
  {
    "id": "seed1019",
    "nombre": "Tiroxin (levotiroxina sodica) 25mcg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1020",
    "nombre": "Toallas impregnadas de alcohol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1423",
    "nombre": "Tobramicina 5 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1427",
    "nombre": "Tragin oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1428",
    "nombre": "Transfer médico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1429",
    "nombre": "Tridetarmon 15 gr",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1021",
    "nombre": "Trimetacidina tabletas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1022",
    "nombre": "Tritromicina 250mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1372",
    "nombre": "Tubo endotraqueal",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1430",
    "nombre": "Tubos de muestra de sangre",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 120
  },
  {
    "id": "seed1431",
    "nombre": "Ungüento Vick Vaporub",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1023",
    "nombre": "Vacitracina de 15mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1024",
    "nombre": "Vacomicina amp 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1432",
    "nombre": "Valeriana",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1433",
    "nombre": "Valproato sódico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1025",
    "nombre": "Valprom",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1026",
    "nombre": "Valsartán",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 12
  },
  {
    "id": "seed1027",
    "nombre": "Valsatan 160mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1028",
    "nombre": "Valvula sin aguja",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1029",
    "nombre": "Vancomicina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1030",
    "nombre": "Vancomicina 0,5 g",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1031",
    "nombre": "Vancomicina 500mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1436",
    "nombre": "Vecuronio",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1033",
    "nombre": "Venda de gasas esteril",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1035",
    "nombre": "Venda elastica de 10cm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1036",
    "nombre": "Venda enyesada",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1037",
    "nombre": "Venda ortopedica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1038",
    "nombre": "Venda para Yeso",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1039",
    "nombre": "Vendaje de algodon Laminado",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1040",
    "nombre": "Vendas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1041",
    "nombre": "Vendas 10cm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1042",
    "nombre": "Vendas 15cm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1043",
    "nombre": "Vendas adehesivas 20cm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1044",
    "nombre": "Vendas autoadhesivas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1045",
    "nombre": "Vendas de tela 15cm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1046",
    "nombre": "Vendas de yeso",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1047",
    "nombre": "Vendas elasticas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1048",
    "nombre": "Vendas elasticas 15cm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 14
  },
  {
    "id": "seed1049",
    "nombre": "Vendas elasticas 20cm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 12
  },
  {
    "id": "seed1050",
    "nombre": "Vendas elasticas 5cm",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1051",
    "nombre": "Vendas elasticas sin empaue",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1052",
    "nombre": "Vendas enyesadas tipo faris",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1053",
    "nombre": "Vendas grandes",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1054",
    "nombre": "Vendas redondas",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1055",
    "nombre": "Vitamina B2 B6 B12",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1056",
    "nombre": "Vitamina B6",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1057",
    "nombre": "Vitamina C",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1058",
    "nombre": "Vitamina C 10 tab",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1143",
    "nombre": "Vitamina C masticable",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1059",
    "nombre": "Vitamina c via oral",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1060",
    "nombre": "Vitamina k amp",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1061",
    "nombre": "Vitamina K1",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1062",
    "nombre": "Vitamina K2",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 108
  },
  {
    "id": "seed1063",
    "nombre": "Vitamina k5",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1438",
    "nombre": "Vitaozono",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1064",
    "nombre": "Xarelto 10mg",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1439",
    "nombre": "Yeso/Venda de yeso",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1440",
    "nombre": "Yodo 120 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1442",
    "nombre": "Zinc",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0032",
    "nombre": "Aceite 1 lt",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58fz0h-7g7n4x1mqccv2",
    "nombre": "Aceite 2 Lt",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58fupcx19mb",
    "nombre": "Aceite 3 lt",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0033",
    "nombre": "Aceite 430 ml",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57lmaki2bh8",
    "nombre": "Aceite 450 ml",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr7z52jw-ggspqo1f21oq8",
    "nombre": "Aceite 500 ml",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0034",
    "nombre": "Aceite 850 ml",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58b2xr2o968",
    "nombre": "Aceite 900 ml",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr86ae8j-104xg7lfs3z8y",
    "nombre": "Arequipe 500 g",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0036",
    "nombre": "Arroz 1 kg",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0037",
    "nombre": "Arroz 2 kg",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57jysw-qby2yx1jz6sxx",
    "nombre": "Arroz 2.5 kg",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57iszlc78sj",
    "nombre": "Arroz 250 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57i2dyz5qfi",
    "nombre": "Arroz 3 kg",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr585g60apics",
    "nombre": "Arroz 400 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr56q3uf-1b4hoc3az3auj",
    "nombre": "Arroz 450 gr",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0038",
    "nombre": "Arroz 5 kg",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56ro2g-kkk8bp1try9gu",
    "nombre": "Arroz 500 gr",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56rlg4bhstx",
    "nombre": "Arroz 500 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr56oudk-1oqxz4f1n5agd5",
    "nombre": "Arroz 500 g",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr52tjmcgeho6",
    "nombre": "Arroz 900 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0039",
    "nombre": "Arvejas 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56q8dlz2qwy",
    "nombre": "Arvejas 250 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mqziej4elmkqd",
    "nombre": "Arvejas 400 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58p15l192jb",
    "nombre": "Arvejas 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0040",
    "nombre": "Atún (lata)",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0042",
    "nombre": "Avena 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 12
  },
  {
    "id": "mr586inb-182zh4378wk90",
    "nombre": "Avena 180 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58aqi5-1xxmja01rx67nf",
    "nombre": "Avena 200 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0041",
    "nombre": "Avena 400 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr581mgm-s72ywo1xefdk4",
    "nombre": "Avena 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0043",
    "nombre": "Avena 800 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0044",
    "nombre": "Azúcar 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 48
  },
  {
    "id": "mr58bfps-gfe9ss1tau4ie",
    "nombre": "Azucar 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr4yltw37zkjs",
    "nombre": "Azúcar 700 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6j05kc-1h0qsu0nnqp1o",
    "nombre": "Azúcar 900 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed1392",
    "nombre": "Bicarbonato de cocina",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1112",
    "nombre": "Bocadillos",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0045",
    "nombre": "Bulto de arroz",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5eb8ju-x6f7uxcrfxe5",
    "nombre": "Bulto de harina",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57psd0-kflezr18pb90t",
    "nombre": "Buñuelos paquete",
    "categoria": "snacks",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed1127",
    "nombre": "Cachapas",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58s6po-1hup9gt12rrwr0",
    "nombre": "Cafe 250 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58st8r-rpqh3l1uh4wfx",
    "nombre": "Cafe 30 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58ryzo-tufzrm1m966ks",
    "nombre": "Cafe 300 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58rjjb-1r88nam1qj9ohm",
    "nombre": "Cafe 450 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0050",
    "nombre": "Café 50 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0049",
    "nombre": "Café 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5ewzg6-nn6vxy184dcx5",
    "nombre": "Cafe 50 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0051",
    "nombre": "Café instantáneo",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0052",
    "nombre": "Canolas",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 30
  },
  {
    "id": "seed0053",
    "nombre": "Caramelos",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0w12yrgb4hv",
    "nombre": "Caramelos 100 und",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0054",
    "nombre": "Caraotas 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "mqzpif4yku0hb",
    "nombre": "Caraotas 400 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "kg",
    "umbral": 10
  },
  {
    "id": "seed0055",
    "nombre": "Caraotas 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0slvf42xr9c",
    "nombre": "Caraotas enlatadas 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57hluqqnqgb",
    "nombre": "Caraotas rojas 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0056",
    "nombre": "Caraotas rojas 200 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1146",
    "nombre": "Carne de almuerzo",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzpqyxb5y8ek",
    "nombre": "Carne de pollo enlatada 340 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "kg",
    "umbral": 10
  },
  {
    "id": "mqzpqc16jp206",
    "nombre": "Carne de res enlatada 340 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "kg",
    "umbral": 10
  },
  {
    "id": "seed1148",
    "nombre": "Cartón de huevos",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed1150",
    "nombre": "Casabe",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1160",
    "nombre": "Cereal",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 26
  },
  {
    "id": "mr6r685b-hd79mh17d9ssl",
    "nombre": "Cereal de 20 gr",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr4a2nxj-ecj5341fvpve3",
    "nombre": "Cerelac 400 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0058",
    "nombre": "Chicha líquida",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1136",
    "nombre": "Chocolate",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1167",
    "nombre": "Chucherías/snacks",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 26
  },
  {
    "id": "seed1342",
    "nombre": "Chupetas",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1393",
    "nombre": "Complementos alimentarios",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0yd4pe83xeq",
    "nombre": "Compotas 25 gr",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1135",
    "nombre": "Conos de helado",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr583o8l69wsa",
    "nombre": "Conserva de pescado 224 gr (lata)",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57oad25e4bf",
    "nombre": "Conserva de pescado 280 gr (lata)",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57p1u3t6w6s",
    "nombre": "Conserva de pescado 400 gr (lata)",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57otfjnat0x",
    "nombre": "Conserva de pescado 425 gr (lata)",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0059",
    "nombre": "Conservas de guayaba",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1194",
    "nombre": "Cotufas",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0060",
    "nombre": "Crema de arroz",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 42
  },
  {
    "id": "mr586x1c-1t3xmhq182yjp7",
    "nombre": "Crema de arroz 175 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6vavszkribr",
    "nombre": "Crema de arroz 1 kg",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzusb3a5ddsh",
    "nombre": "Crema de arroz 225 gr",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzszdihigttd",
    "nombre": "Crema de arroz 450 gr",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr17vh3g4fbcs",
    "nombre": "Crema de leche",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56l7t6-13314v21p7p2f8",
    "nombre": "Desodorante de Sobre",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0062",
    "nombre": "Diablito",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 53
  },
  {
    "id": "seed1241",
    "nombre": "Durazno en conserva 680 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1220",
    "nombre": "Encurtidos",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1221",
    "nombre": "Enlatados variados",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 170
  },
  {
    "id": "mr59ewax-9qs5i08kqq06",
    "nombre": "Ensalada de vegetales",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1222",
    "nombre": "Ensure 237 ml",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1235",
    "nombre": "Fideos",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0063",
    "nombre": "Fororo 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr4ympvzydfxw",
    "nombre": "Fororo 350 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr7y4tli-1oewao9b9o6dz",
    "nombre": "Fororo 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58mpg4qi17n",
    "nombre": "Frijol enlatado",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0066",
    "nombre": "Frijoles 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0065",
    "nombre": "Frijoles 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1242",
    "nombre": "Fruta confitada",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0067",
    "nombre": "Galletas",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 131
  },
  {
    "id": "seed0068",
    "nombre": "Gelatina",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57fhfb-1mk0gu7krau65",
    "nombre": "Granola",
    "categoria": "snacks",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0069",
    "nombre": "Granos variados",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 62
  },
  {
    "id": "seed1258",
    "nombre": "Guisantes",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0070",
    "nombre": "Harina de avena 400 gr",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0047",
    "nombre": "Harina de maíz 1 kg",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 449
  },
  {
    "id": "seed0072",
    "nombre": "Harina de maíz 2 kg",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr563bhru0fx6",
    "nombre": "Harina de maíz 500 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr56417rronef",
    "nombre": "Harina de maiz 800 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr54m4xnr5hfg",
    "nombre": "Harina de maíz 900 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr564ydzbzbjo",
    "nombre": "Harina de maíz dulce 500 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr570ruit6z6q",
    "nombre": "Harina de plátano 250 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0071",
    "nombre": "Harina de trigo 1 kg",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 21
  },
  {
    "id": "mr58momk-15xzywtxetrpq",
    "nombre": "Harina de trigo 250 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr566xoakml5v",
    "nombre": "Harina de trigo 500 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr56ghqi-3y9bqbws8dyl",
    "nombre": "Harina de trigo 900 gr",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5743rfsw9jv",
    "nombre": "Harina de trigo 900 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr566sjy-17ldwqi1efhh9t",
    "nombre": "Harina de Yuca 900 g",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0v267cx4gsh",
    "nombre": "Jamón",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1272",
    "nombre": "Jamón enlatado",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0t9vx3iccyr",
    "nombre": "Jugo 200 ml",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6r6r4l-1j6bflg1901qa2",
    "nombre": "Jugo 330 ml",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr84p5qa-egb4xygx984n",
    "nombre": "Lactovigor 400 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr588ujs-1hokenq13wxab3",
    "nombre": "Lactovigor 900 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr2w1sgja1ptb",
    "nombre": "Lata de salchicha",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5839z0pt9xg",
    "nombre": "Latas de arbejas 300 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5715i4assor",
    "nombre": "Leche 200 ml",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed1299",
    "nombre": "Leche condensada",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6rwzad-io7k1lp99m8l",
    "nombre": "Leche de bebe 200 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0077",
    "nombre": "Leche en polvo 200 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed0080",
    "nombre": "Leche en polvo 250 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr1b9sabxt298",
    "nombre": "Leche en polvo 2k",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0076",
    "nombre": "Leche en polvo 400 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56ha3i-1dfn673txl1a0",
    "nombre": "Leche en polvo 750 g",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6ty3ww-tbtq50ujhg6t",
    "nombre": "Leche en polvo 800 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr7y2pvy-dtzazc4wa8y",
    "nombre": "Leche en polvo 862 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0078",
    "nombre": "Leche en polvo 900 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0082",
    "nombre": "Lentejas 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57vq12hyszk",
    "nombre": "Lentejas 250 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58juou-1knopv9dog1da",
    "nombre": "Lentejas 250 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mqzie8bi1dh38",
    "nombre": "Lentejas 400 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58jee7-1uw1wqca9xcju",
    "nombre": "Lentejas 460 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0083",
    "nombre": "Lentejas 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6rirr0-19gx9eq1xcbajc",
    "nombre": "Lentejas 900 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1309",
    "nombre": "Maicena",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr589kah-1y43xv1h6zcb3",
    "nombre": "Maicena 24 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0084",
    "nombre": "Maíz",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5899mz-1ms2z2tifc4fv",
    "nombre": "Maizena de 200 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr1bcbm6fv8av",
    "nombre": "Mantequilla 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr586erm-1k2et501uu34fk",
    "nombre": "Mantequilla de mani",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0085",
    "nombre": "Margarina 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 13
  },
  {
    "id": "seed0086",
    "nombre": "Margarina 225 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6unt8t-kuxp5r1kf6vlt",
    "nombre": "Margarina 250 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0087",
    "nombre": "Margarina 450 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6hpc6h-1u9u86v14avmtl",
    "nombre": "Margarina 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0064",
    "nombre": "Mayonesa",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 11
  },
  {
    "id": "seed1317",
    "nombre": "Mejillones",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1318",
    "nombre": "Melocotón",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0089",
    "nombre": "Mermelada",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 23
  },
  {
    "id": "seed1321",
    "nombre": "Mezcla de panquecas",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr86clra-cg57wf1rzukkv",
    "nombre": "Miel 340 g",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqznvaio9iktd",
    "nombre": "Mortadela 900 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "kg",
    "umbral": 10
  },
  {
    "id": "seed0074",
    "nombre": "Mortadela enlatada",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 36
  },
  {
    "id": "seed0090",
    "nombre": "Mostaza",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr585cfq-h2ky1x16pvfnw",
    "nombre": "Nestum 200 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr585liu-1vgy17pm94mvo",
    "nombre": "Nestum 25 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0091",
    "nombre": "Paca de azúcar",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr86qik1-sixz6nab52gl",
    "nombre": "Palitos de nutella",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1337",
    "nombre": "Pan",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 60
  },
  {
    "id": "mqzl2obshxzvo",
    "nombre": "Pan de sandwich 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0092",
    "nombre": "Panelas",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr577u18-5g6jchkdguk8",
    "nombre": "Panelas de Papelon",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6wi89w-mucs231grp7d0",
    "nombre": "Panes de perro caliente",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1343",
    "nombre": "Papas chips",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56zcfgosez0",
    "nombre": "Papas fritas de perro caliente 150 gr",
    "categoria": "snacks",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed1340",
    "nombre": "Papelón",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0zdn96nzij6",
    "nombre": "Paquete de caramelos 48 und",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0046",
    "nombre": "Pasta 1 kg",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 189
  },
  {
    "id": "mr56g0n9xtajz",
    "nombre": "Pasta 125 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr56g2xo-1j7z72b12a8edi",
    "nombre": "Pasta 125 g",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0094",
    "nombre": "Pasta 250 gr",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56f2gphwpfl",
    "nombre": "Pasta 275 gr",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0093",
    "nombre": "Pasta 500 gr",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 28
  },
  {
    "id": "mr0rgc9vphf6v",
    "nombre": "Pasta Vermicelli 1 kg",
    "categoria": "alimentos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57iiwb-1vx7m0x1nknanf",
    "nombre": "Pastas 200 gr",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57ivm5-jbq7h369nu56",
    "nombre": "Pastas 400 gr",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr86a1w9-dlkimb1knh3gh",
    "nombre": "Pepitona en lata",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1356",
    "nombre": "Plátanos",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1359",
    "nombre": "Pollo enlatado",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0095",
    "nombre": "Ponque",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 50
  },
  {
    "id": "seed1368",
    "nombre": "Proteína en polvo",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1370",
    "nombre": "Pudín",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1371",
    "nombre": "Puffy",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0v1gqj5ewmu",
    "nombre": "Queso amarillo",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6jdthq-15uhdue1x4j8rl",
    "nombre": "Queso fundido",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1375",
    "nombre": "Ramen",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1378",
    "nombre": "Ricomalt",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1380",
    "nombre": "Riqueza",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0096",
    "nombre": "Sal 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 24
  },
  {
    "id": "mr58n3h5w2teq",
    "nombre": "Sal 3 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr5f62dp-trwxd91wsdpkv",
    "nombre": "Sal 400 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0097",
    "nombre": "Sal 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58mu3gs4fg6",
    "nombre": "Sal 800 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed1385",
    "nombre": "Salchichón",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr55bs2bkzjab",
    "nombre": "Salsa 200 g",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6jdo9t-1omiwzeujarrh",
    "nombre": "Salsa de pasta",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0099",
    "nombre": "Salsa de tomate",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 18
  },
  {
    "id": "seed0075",
    "nombre": "Sardinas enlatadas",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 624
  },
  {
    "id": "mqzgus04xd5ng",
    "nombre": "Sobre de azúcar 4 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0100",
    "nombre": "Sobre de sal",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1394",
    "nombre": "Sobres variados",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0101",
    "nombre": "Sopa de sobre",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1296",
    "nombre": "Sopa enlatada",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1395",
    "nombre": "Stevia en sobres",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1407",
    "nombre": "Super Atol",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58wd3a-1e4pk4ta35vvb",
    "nombre": "Te 15 gr",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr88ev1r-1o5blcdn0l7e0",
    "nombre": "Tenedor de bebé (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1424",
    "nombre": "Toddy",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1426",
    "nombre": "Tortillas",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr16iqabev9u4",
    "nombre": "Tostón",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0103",
    "nombre": "Tripack de salsa de soya",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0104",
    "nombre": "Vinagre",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 18
  },
  {
    "id": "seed1441",
    "nombre": "Yogurt",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57r5e3yj78z",
    "nombre": "Aceite hidratante",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0147",
    "nombre": "Acondicionador",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0148",
    "nombre": "Afeitadora",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6n843n-1nxn3bc1oye45l",
    "nombre": "Bañera para bebé",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0151",
    "nombre": "Cepillo de cabello",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0152",
    "nombre": "Cepillo de dientes",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0153",
    "nombre": "Cepillo de dientes bebé",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1159",
    "nombre": "Cepillo dental",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 65
  },
  {
    "id": "mr80kwfs-arf6zj1f83cd1",
    "nombre": "Cono urinario femenino",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0156",
    "nombre": "Copa menstrual",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1196",
    "nombre": "Crema corporal",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr515ckqxye8s",
    "nombre": "Crema de arroz 900 gr",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56kmjwuob8g",
    "nombre": "Crema de bebe",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1099",
    "nombre": "Crema de peinar",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57raxi-1h9ubg81uscgf0",
    "nombre": "Crema humectante",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56l3xeqch52",
    "nombre": "Crema para piel",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57q0myrze44",
    "nombre": "Crema para pies",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57sqdrpitpi",
    "nombre": "Crema termoprotectora",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1195",
    "nombre": "Cremas variadas",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0157",
    "nombre": "Desodorante",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0158",
    "nombre": "Enjuague bucal",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0rw7q8l43hr",
    "nombre": "Enjuague bucal 250 ml",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1230",
    "nombre": "Espuma de afeitar",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1248",
    "nombre": "Gel de baño",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr83yduk-12rmnig1rbi904",
    "nombre": "Gel de cabello",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0159",
    "nombre": "Guantes de garnaza",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 44
  },
  {
    "id": "seed0160",
    "nombre": "Hilo dental",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0161",
    "nombre": "Jabón de baño",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzim7mr7ljou",
    "nombre": "Jabón de tocador tipo hotel",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr3q8anxw2o61",
    "nombre": "Jabón en barra",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr28143gybohq",
    "nombre": "Jabón líquido",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56kzp0kif3x",
    "nombre": "Jabón líquido íntimo",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1275",
    "nombre": "Keratina",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr1dsdskphfdv",
    "nombre": "Kit de higiene con pañales de adulto",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0162",
    "nombre": "Kit de higiene personal",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 17
  },
  {
    "id": "seed1307",
    "nombre": "Loción antimosquito",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56m629bzfqq",
    "nombre": "Loción en gel",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0163",
    "nombre": "Mascarilla de tela",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr50xhp48ozz8",
    "nombre": "Mascarilla facial",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr53z59e4ei0z",
    "nombre": "Pañal de adulto talla G 6 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr86cjf6-dc9oo1r6mut1",
    "nombre": "Pañal de adulto talla L 10 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58oequ-akgdd5uo9loo",
    "nombre": "Pañal de adulto talla L 21 und(paquete)",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr82qleh-14qk2to6jvrwf",
    "nombre": "Pañal de adulto talla L 8 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr99v2ky-m9oag6rn9wo8",
    "nombre": "Pañal de adulto talla M 10 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr0ybqkjv2doh",
    "nombre": "Pañal de adulto talla M 3 und (paquete)",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr514j8praqjr",
    "nombre": "Pañal de adulto talla M 6 und (paquete)",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr8979ac-cmqcf11su0zjx",
    "nombre": "Pañal de bebe G 9 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr5b78fq-71euv2197b2s7",
    "nombre": "Pañal de bebe talla G 12 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr3pzxdjuroo4",
    "nombre": "Pañal de bebe talla G 20 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr2l9ctou3qok",
    "nombre": "Pañal de bebe talla M 18 und (paquetes)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr2ia6ck2nhbm",
    "nombre": "Pañal de bebe talla M 30 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr897t21-1cfjm4vn4ptqj",
    "nombre": "Pañal de bebe talla P 9 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr5b6w58-g51szm1te2udm",
    "nombre": "Pañal de bebe talla XG 20 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr53q7ce2x2fw",
    "nombre": "Pañal de bebé talla XG 20 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr4yoh15h3rdn",
    "nombre": "Pañal de bebe talla XXG 18 und (paquetes)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr84xwlo-usharw1tt1cil",
    "nombre": "Pañal de bebe talla XXG 20 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6scig7-1qksfc21ps7zek",
    "nombre": "Pañal para adulto talla L 16 und (paquete)",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr7xy9zq-1j629vd1n4ayuj",
    "nombre": "Pañales de bebe XG 18",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 6
  },
  {
    "id": "seed1338",
    "nombre": "Pañitos húmedos",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57zgd33jghd",
    "nombre": "Papel higiénico 12 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr8395qo-185uuixiucpnt",
    "nombre": "Papel higiénico 2 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58k01p-1pvqk7y71ifhh",
    "nombre": "Papel higiénico 3 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0165",
    "nombre": "Papel higiénico 4 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6nknwb-1w0e221d19d5g",
    "nombre": "Papel higiénico 8 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0166",
    "nombre": "Papel higiénico und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0155",
    "nombre": "Pasta dental",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0171",
    "nombre": "Pasta dental niños",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0172",
    "nombre": "Peine",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr88fq8w-l0g8ibl6hyd9",
    "nombre": "Peine de niño",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr8dbrgu-11pueq0172afqp",
    "nombre": "Protector diario 50 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0173",
    "nombre": "Protector solar",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0170",
    "nombre": "Protectores diarios",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqztf8nsx8jhl",
    "nombre": "Protectores diarios 12 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr3vovsdndr2x",
    "nombre": "Protectores diarios 20 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0149",
    "nombre": "Shampoo",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0154",
    "nombre": "Shampoo bebé",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0175",
    "nombre": "Sobres de champú/shampoo",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1399",
    "nombre": "Splash mujer",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1408",
    "nombre": "Talco",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 27
  },
  {
    "id": "seed1130",
    "nombre": "Tampones",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0150",
    "nombre": "Tapabocas",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0176",
    "nombre": "Tapabocas 50 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0177",
    "nombre": "Tapabocas KN95",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 26
  },
  {
    "id": "mr0t944wsxcft",
    "nombre": "Toalla de secado",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5ffux0-v6cu0m14ezptv",
    "nombre": "Toalla humedas 70 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr2epa9xd0zzd",
    "nombre": "Toalla humedas 80 und (paquete)",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57ctez9jzmb",
    "nombre": "Toalla nocturnas 8 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6v970k-6lz8b611bsuzm",
    "nombre": "Toalla sanitaria 7 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58salk0p1u3",
    "nombre": "Toallas de húmedas 30 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57dhezcqnel",
    "nombre": "Toallas diarias 10 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57d5d9eaa87",
    "nombre": "Toallas diarias 12 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57fk3g4mqfg",
    "nombre": "Toallas diarias 24 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57e60dgmq85",
    "nombre": "Toallas diarias 30 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0180",
    "nombre": "Toallas húmedas",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58qcse23lzk",
    "nombre": "Toallas humedas 120 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58150x-1w3i3afntp6em",
    "nombre": "Toallas humedas 130 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr7yvk3e-kxusa1ekznio",
    "nombre": "Toallas húmedas 140 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6qsj0l-1qbiig1xyq363",
    "nombre": "Toallas húmedas 20 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr7y6vu1-12dp8831o5y4px",
    "nombre": "Toallas húmedas 216 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6smfcf-1f2uu4d151633a",
    "nombre": "Toallas humedas 24und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0rvowllhk1z",
    "nombre": "Toallas humedas 25 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57xcrpkhqo3",
    "nombre": "Toallas humedas 40 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr82amls-1wx9rsz14ceake",
    "nombre": "Toallas húmedas 42 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr5b6cl7-9rcl3s1n2nebl",
    "nombre": "Toallas húmedas 48 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57ifch-fbc7ol1ef9hhe",
    "nombre": "Toallas humedas 5 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr50vi8p03an5",
    "nombre": "Toallas húmedas 50 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58r7mu8m025",
    "nombre": "Toallas humedas 60 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6icc4a-1nt7qb91kzzafs",
    "nombre": "Toallas húmedas 64 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr0siz00s2c1k",
    "nombre": "Toallas húmedas 72 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6sm6vw-14icw054k5dmi",
    "nombre": "Toallas húmedas de 24 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6k6h62-e1obef1vmhu4l",
    "nombre": "Toallas húmedas de 42 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr0x32wcahj21",
    "nombre": "Toallas humedas femeninas",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57b5cugvh6i",
    "nombre": "Toallas intimas 12 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57amh7fzpm8",
    "nombre": "Toallas intimas 24 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57a6rbe2q7l",
    "nombre": "Toallas intimas 8 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57au2q0xy2e",
    "nombre": "Toallas intimas und 10",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzqurlnkm9af",
    "nombre": "Toallas sanitarias",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzsm9ktwvts2",
    "nombre": "Toallas sanitarias 10 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr571vsrhb59z",
    "nombre": "Toallas sanitarias 12 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6l86xz-1vezwc6k05hgb",
    "nombre": "Toallas sanitarias 16 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 6
  },
  {
    "id": "mr58wdu62heb9",
    "nombre": "Toallas sanitarias 20 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr8012mj-15a36oe1mw8vxp",
    "nombre": "Toallas sanitarias 24 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr575w5ruiy52",
    "nombre": "Toallas sanitarias 3 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr50n1r2xr7vn",
    "nombre": "Toallas sanitarias 32 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58hx7cxnl5q",
    "nombre": "Toallas sanitarias 40 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6ixves-wmp6kqj3btxj",
    "nombre": "Toallas sanitarias 6 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mqzohwhd923ek",
    "nombre": "Toallas sanitarias 8 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr0yca53djuah",
    "nombre": "Toallas sanitarias nocturnas 10 und",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzh1ynr90jrm",
    "nombre": "Toallín",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57hx1k-krmlne10akbjz",
    "nombre": "Toallitas humedas 10 und",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57bpwu-1xs4hvc11m2zg6",
    "nombre": "Toallitas paquetes",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5evu70-no5zueh1mvb5",
    "nombre": "Vacenilla",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0035",
    "nombre": "Aceite para bebé",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr537isv66xci",
    "nombre": "Cepillo de cabello de bebé",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0057",
    "nombre": "Cereal de bebé",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0106",
    "nombre": "Cerelac",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 14
  },
  {
    "id": "seed0107",
    "nombre": "Chupón",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0108",
    "nombre": "Colador",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0109",
    "nombre": "Compotas",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 1019
  },
  {
    "id": "seed0110",
    "nombre": "Crema antipañalitis",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57kldd-144ftbk1rcc34d",
    "nombre": "Crema Dermoprotectora 150 g",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1198",
    "nombre": "Crema para bebé",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1200",
    "nombre": "Cuchara de bebé",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58csmnno00w",
    "nombre": "Enjuague bucal niño",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0111",
    "nombre": "Esterilizador de teteros",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0112",
    "nombre": "Extractor de leche materna",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzrk4s2ijism",
    "nombre": "Jabón de bebé en barra",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr84b04n-1rv51to1m5p8x6",
    "nombre": "Jabón de bebé líquido",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr9fxdd1-17ss2qlo9wp8a",
    "nombre": "Jugo 200 ml und",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzvo3qg4uwvc",
    "nombre": "Kit de higiene niños",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr4a5j8o-k37lwmas6q61",
    "nombre": "Leche de bebe (fórmula) 400 gr",
    "categoria": "alimentos_bebe",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0113",
    "nombre": "Leche de fórmula para bebé",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 25
  },
  {
    "id": "mr7yyvjc-14i8xp8vi3s0r",
    "nombre": "Leche/Fórmula para bebé 375 g",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzpggvjc8jbj",
    "nombre": "Libro para colorear",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57o17d-7jmp96tss37p",
    "nombre": "Loción de bebe",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1329",
    "nombre": "Nestum",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0uljvv96s8b",
    "nombre": "Pañal bebe talla M 20 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr9fe52s-1juxko4g03l6",
    "nombre": "Pañal bebé talla S und",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0115",
    "nombre": "Pañal de adulto talla G (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr488mf4-tptycn183qzj9",
    "nombre": "Pañal de adulto talla G 8 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0116",
    "nombre": "Pañal de adulto talla L (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 24
  },
  {
    "id": "seed0117",
    "nombre": "Pañal de adulto talla M (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 27
  },
  {
    "id": "seed0118",
    "nombre": "Pañal de adulto talla XG (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 13
  },
  {
    "id": "seed0114",
    "nombre": "Pañal de adulto talla XL (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0130",
    "nombre": "Pañal de adulto talla XXG (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr8bytyi-1f3muag160z210",
    "nombre": "Pañal de bebe talla XXG 8 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0119",
    "nombre": "Pañal de bebé talla G (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 748
  },
  {
    "id": "mr5965cr-191pj8268wkge",
    "nombre": "Pañal de bebe talla G 10 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58v3a5-b5i4tj1u3bntt",
    "nombre": "Pañal de bebe talla g 14 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr7xws7e-wmz4bhgmeaan",
    "nombre": "Pañal de bebé talla G 18 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58y02k-1tso05l151lhmr",
    "nombre": "Pañal de bebe talla G 24 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr4a0830-kll82tk0tm9b",
    "nombre": "Pañal de bebe talla G 30 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr0v6f20yoyxn",
    "nombre": "Pañal de bebé talla G 30 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr7z68ez-1t6lhit1aisqe2",
    "nombre": "Pañal de bebé talla G 40 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0126",
    "nombre": "Pañal de bebé talla L (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 24
  },
  {
    "id": "mr0zne2ea25ap",
    "nombre": "Pañal de bebe talla L 8 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0120",
    "nombre": "Pañal de bebé talla M (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5966c4u3mvs",
    "nombre": "Pañal de bebe talla M 10 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr539dxckmyo8",
    "nombre": "Pañal de bebe talla M 11 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6stga7-fjd8qycqozct",
    "nombre": "Pañal de bebe talla M 12 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr7y1ijn-t1fwgc9fs55e",
    "nombre": "Pañal de bebé talla M 14 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58erymnxgnj",
    "nombre": "Pañal de bebe talla M 20 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6idv0i-nqmyih5ach2o",
    "nombre": "Pañal de bebe talla M 22 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr5959xt-uisi0c1s9o19s",
    "nombre": "Pañal de bebe talla M 24 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr59i0ar-rhdec8tjlsja",
    "nombre": "Pañal de bebe talla M 28 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr89uyri-1u74xbnnypktc",
    "nombre": "Pañal de bebe talla M 36 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6i9ad9-1jmdetl8n78kz",
    "nombre": "Pañal de bebé talla M 40 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr8bl6m8-1e3ufi9150nffg",
    "nombre": "Pañal de bebe talla M 8 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr80bmwa-1k0n3dx1qhs2le",
    "nombre": "Pañal de bebé talla M 9 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0121",
    "nombre": "Pañal de bebé talla P (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58f0wh-dxlf831n10ozr",
    "nombre": "Pañal de bebe talla p 10 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57m9qkezbjn",
    "nombre": "Pañal de bebe talla P 100 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6qefo7-64keddmkv0jq",
    "nombre": "Pañal de bebé talla P 12 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 4
  },
  {
    "id": "mr5evn9r-kub03m3q177w",
    "nombre": "Pañal de bebe talla P 20 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr489tmd-1oqveuy1750xn4",
    "nombre": "Pañal de bebe talla P 24 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr589alcazs5v",
    "nombre": "Pañal de bebé talla P 24 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5dnkpi-1ohwwt81vu8xd0",
    "nombre": "Pañal de bebe talla P 30 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr0v5isglxc0v",
    "nombre": "Pañal de bebé talla P 30 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6sdur3-1yvzd5j14rlz2l",
    "nombre": "Pañal de bebe talla P 34 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6iqklc-1jfv7n3d3jdie",
    "nombre": "Pañal de bebé talla P 40 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mqzpu4uy7b6n6",
    "nombre": "Pañal de bebe talla RN (recién nacido) (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr7xrsn3-kum6sp3nirmi",
    "nombre": "Pañal de bebé talla RN 10 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6tsekk-w4yr2v1bgj30",
    "nombre": "Pañal de bebé talla RN 20 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0123",
    "nombre": "Pañal de bebé talla S (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6rfhwi-ntl6l415k20oa",
    "nombre": "Pañal de bebé talla S 60 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0124",
    "nombre": "Pañal de bebé talla X (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0125",
    "nombre": "Pañal de bebé talla XG (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 301
  },
  {
    "id": "mr6r7mzo-1b6srl01eamlfx",
    "nombre": "Pañal de bebé talla XG 10 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6r0wgj-2cfzbewrg1zm",
    "nombre": "Pañal de bebé talla XG 16 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 16
  },
  {
    "id": "mr6ifkop-19kysac1pfqygp",
    "nombre": "Pañal de bebé talla XG 18 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr56h4inctzys",
    "nombre": "Pañal de bebe talla XG 25 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr48bb0q-rvp3h6hf37hi",
    "nombre": "Pañal de bebe talla XG 30 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6ir1qd-7tu82x193wdkz",
    "nombre": "Pañal de bebé talla XG 40 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr58e32ayp1kj",
    "nombre": "Pañal de bebe talla XG 50 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr57eim6432dy",
    "nombre": "Pañal de bébe talla XG 50 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6qfhmd-4g6j1ek7t5wm",
    "nombre": "Pañal de bebé talla XG 8 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 4
  },
  {
    "id": "mr7udk9c-1969nsg1psr7h3",
    "nombre": "Pañal de bebé talla XG 9 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr0txhwbgzawh",
    "nombre": "Pañal de bebé talla XL 20 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0127",
    "nombre": "Pañal de bebé talla XXG (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 383
  },
  {
    "id": "mr6r3vo0-1mez4xu189s2yk",
    "nombre": "Pañal de bebé talla XXG 10 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6ttiwp-1luh3du1w8xoft",
    "nombre": "Pañal de bebe talla XXG 16 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr59ekzy0zewq",
    "nombre": "Pañal de bebé talla XXG 18 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58e7ni-1prj2tx1ytszel",
    "nombre": "Pañal de bebe talla xxg 30 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0128",
    "nombre": "Pañal de bebé talla XXL (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 20
  },
  {
    "id": "mr0zc1fn020bo",
    "nombre": "Pañal de bebé talla XXL 14 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6kzgdq-jfu4jlasu4qx",
    "nombre": "Pañal de bebe talla xxxg",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58acghdb3ng",
    "nombre": "Pañal de bebé XXG 30 und (paquete)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0129",
    "nombre": "Pañales de adulto variados (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 49
  },
  {
    "id": "mr58c8i2psgvb",
    "nombre": "Pañales de bebe XG 24 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr9cfwhm-cfk3hv189c8qd",
    "nombre": "Pañales de recién nacido",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0164",
    "nombre": "Pañales panty",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr9fbzzp-16p193r1kkzxuz",
    "nombre": "Pañales TALLA RN 10 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0105",
    "nombre": "Pañales variados (unidad)",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 439
  },
  {
    "id": "seed1350",
    "nombre": "Pediasure",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1352",
    "nombre": "Pezoneras",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1377",
    "nombre": "Revitalizante capilar de bebé",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0133",
    "nombre": "Talco bebé",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0134",
    "nombre": "Tetero",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 50
  },
  {
    "id": "seed1416",
    "nombre": "Tetinas",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5e9esk-10n8d2q1np75un",
    "nombre": "Toalla humedas 100 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed0132",
    "nombre": "Toallas post parto",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 45
  },
  {
    "id": "seed1341",
    "nombre": "Toallitas de bebé",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0001",
    "nombre": "Agua 1 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0002",
    "nombre": "Agua 1.5 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 53
  },
  {
    "id": "mr89i4ir-wdxb3630u7or",
    "nombre": "Agua 10 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6xysm2-lwmftl1tt1bee",
    "nombre": "Agua 15 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0004",
    "nombre": "Agua 2 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6jsv2h-144nlxbb0xrg1",
    "nombre": "Agua 3 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0005",
    "nombre": "Agua 3.5 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58i5kzwawsn",
    "nombre": "Agua 325 ml",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5cry0d-17efspvj3ww92",
    "nombre": "Agua 330 ml",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0003",
    "nombre": "Agua 350 ml",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 165
  },
  {
    "id": "mqzr52qog0cfc",
    "nombre": "Agua 355 ml",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr109ervloi1k",
    "nombre": "Agua 380 ml",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzf7waew80mj",
    "nombre": "Agua 4 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0006",
    "nombre": "Agua 5 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 14
  },
  {
    "id": "seed0007",
    "nombre": "Agua 500 ml",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 129
  },
  {
    "id": "mr50ub5n0bhtl",
    "nombre": "Agua 550 ml",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0030",
    "nombre": "Agua 600 ml",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr55xtd4yekhi",
    "nombre": "Agua 620 ml",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0009",
    "nombre": "Agua destilada",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0013",
    "nombre": "Agua saborizada 500 ml",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr1b3ae1dphbt",
    "nombre": "Avena molida 650 g",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr170onzoui36",
    "nombre": "Barra de granola",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1103",
    "nombre": "Bebida chocolatada",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1398",
    "nombre": "Bebida energética 310 ml",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1104",
    "nombre": "Bebidas energéticas",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5ih6vg-1bgg7ww1vleje5",
    "nombre": "Botellon agua 16 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr4z4rjgc2h9d",
    "nombre": "Botellón agua 18 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0008",
    "nombre": "Botellón agua 20 lt",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57pnun-p2mgyg1u6y3n",
    "nombre": "Cafe 100 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57q0ts-1mahbzg1jev5yo",
    "nombre": "Cafe 110 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0048",
    "nombre": "Café 200 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 14
  },
  {
    "id": "mr56t60e-pkq51k1kseryx",
    "nombre": "Cafe 90 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6xqbfn-1v9blbgmdrgb2",
    "nombre": "Cerelac 100 gr",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0014",
    "nombre": "Chicha",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr146j1fzvmg3",
    "nombre": "Cloro Galon",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6p998gtpuyg",
    "nombre": "Colas de cabello",
    "categoria": "higiene_personal",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr147e4abw881",
    "nombre": "Desinfectante Galon",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5erzbc-1a7wunex14si7",
    "nombre": "Detergente 200 g",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr59bka3-h8w8231f3n7n9",
    "nombre": "Durazno 425 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr59avoi-214qrdgxcwqx",
    "nombre": "Durazno en 820 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "mr6qbint-45o0etztard0",
    "nombre": "Formula para bebe 800 g",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0rcxzfxjyld",
    "nombre": "Frijoles 454 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5ibp51-1fh0f8lw0b45j",
    "nombre": "Frut boy 1.5",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0015",
    "nombre": "Gatorade 500 ml",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 19
  },
  {
    "id": "seed0016",
    "nombre": "Jugo 1.5 lt",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57wi6b-kufc2ybmltfc",
    "nombre": "Jugo 188 ml",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr9ideke-1f4xb8l1vbstbj",
    "nombre": "Jugo 1 lt",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0017",
    "nombre": "Jugo 250 ml",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0019",
    "nombre": "Jugo 400 ml",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0020",
    "nombre": "Jugo 500 ml",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr58euntq1jl4",
    "nombre": "Jugo en polvo",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr1binz6vaj82",
    "nombre": "Leche descremada 1 lt",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr580rn2-1t2srwp1yz04o8",
    "nombre": "Leche en en polvo entera",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzpyk4dru6co",
    "nombre": "Leche en polvo 125 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57sgum-12nr5g7l962m",
    "nombre": "Leche en polvo 1 kg",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr57rzjn-ldavom6x159f",
    "nombre": "Leche en polvo 350 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0nephf8ah6m",
    "nombre": "Leche en polvo 375 g",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6r2x32lbs9e",
    "nombre": "Leche en polvo 500 gr",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr1b0lsa642k4",
    "nombre": "Leche en polvo para bebe 400 g",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0022",
    "nombre": "Leche líquida 1 lt",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr1au1ws5zxgw",
    "nombre": "Leche para bebe 800 g",
    "categoria": "alimentos_bebe",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr2w39znabxzu",
    "nombre": "Macarron con queso",
    "categoria": "alimentos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzoivk8imfyl",
    "nombre": "Mamila para tetero",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0v74gp9p0ym",
    "nombre": "Nestea",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr17789m6f7y0",
    "nombre": "Nutrichicha",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0025",
    "nombre": "Pastillas purificadoras x10",
    "categoria": "hidratacion",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr5ic9f4-1qd9pmdhxhzom",
    "nombre": "Power max 400 ml",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr1bgazfslc5l",
    "nombre": "Protectores tipo pants talla M",
    "categoria": "higiene_personal",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0026",
    "nombre": "Refresco 1 lt",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0028",
    "nombre": "Refresco 1.5 lt",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0027",
    "nombre": "Refresco 2 lt",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0029",
    "nombre": "Refresco pequeño",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr9juviw-1jouaso122g3zo",
    "nombre": "Te de manzanilla",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0031",
    "nombre": "Té en sobre",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1098",
    "nombre": "Bandejas desechables",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1100",
    "nombre": "Bastones",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1105",
    "nombre": "Bencilpenicilina bezatinica",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1107",
    "nombre": "Bicarbonato",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1111",
    "nombre": "Blister candessatan y amlodipino",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1115",
    "nombre": "Bolsas",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1116",
    "nombre": "Bombas de Succión de Drenaje",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1119",
    "nombre": "Bragas voluntarios",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1128",
    "nombre": "Caja astrovastatina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1131",
    "nombre": "Caja de trimetazidina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1147",
    "nombre": "Carpa",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1161",
    "nombre": "Cestas de reciclaje",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1165",
    "nombre": "Chuchería",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1166",
    "nombre": "Chuchería variada",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1168",
    "nombre": "Cianomaloriro",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1169",
    "nombre": "Cilestan",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1170",
    "nombre": "Cinta adhesiva",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1187",
    "nombre": "Cocina eléctrica",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 36
  },
  {
    "id": "seed1190",
    "nombre": "Combitos variados",
    "categoria": "snacks",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1199",
    "nombre": "Cubiertos desechables",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1201",
    "nombre": "Cucharas desechables",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 34
  },
  {
    "id": "seed1203",
    "nombre": "Cuentas (varios)",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 17
  },
  {
    "id": "seed1202",
    "nombre": "Cuerdas",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1204",
    "nombre": "Curpinol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1240",
    "nombre": "Encendedor/Fósforos",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 11
  },
  {
    "id": "seed1224",
    "nombre": "Envases",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 17
  },
  {
    "id": "seed1225",
    "nombre": "Escal 25 cc",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1231",
    "nombre": "Extensión",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1236",
    "nombre": "Finalistas",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzf9sl7w8ii7",
    "nombre": "Gel fijador pelo 120 g",
    "categoria": "higiene_personal",
    "unidad": "litros",
    "umbral": 1
  },
  {
    "id": "seed1256",
    "nombre": "Guantes de trabajo",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 31
  },
  {
    "id": "seed1268",
    "nombre": "Intercomunicador",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1271",
    "nombre": "Jabón líquido para bebés",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1274",
    "nombre": "Juguetes",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1279",
    "nombre": "Kit cirujano",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1280",
    "nombre": "Kit comida",
    "categoria": "alimentos_no_perecederos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1282",
    "nombre": "Kit de laparatomia",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1283",
    "nombre": "Kit de lobotomia",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1286",
    "nombre": "Kit de pacientes",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1287",
    "nombre": "Kit medico",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1288",
    "nombre": "Kit polarotomia",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1289",
    "nombre": "Kits",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1291",
    "nombre": "Kits de bebe",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1301",
    "nombre": "Lentes de lectura",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1303",
    "nombre": "Levalvuterol",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1304",
    "nombre": "Levofloxacina 100 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1117",
    "nombre": "Linternas / lámparas",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1269",
    "nombre": "Lytectadora de 22 gr",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1313",
    "nombre": "Mascara de nebulizaciòn",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 17
  },
  {
    "id": "seed1215",
    "nombre": "Mesa armable",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1339",
    "nombre": "Papel aluminio/film",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 77
  },
  {
    "id": "seed1344",
    "nombre": "Papel bambú",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0s7e4d88dpg",
    "nombre": "Papel de embalaje 4 kg",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0024",
    "nombre": "Paraguas",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr2bdznce8nxk",
    "nombre": "Pelota de juguete",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1102",
    "nombre": "Pilas/Baterías",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1355",
    "nombre": "Pitillo",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1357",
    "nombre": "Platos desechables",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 15
  },
  {
    "id": "seed1360",
    "nombre": "Poncheras",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1361",
    "nombre": "Potes de aluminio",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1374",
    "nombre": "Radio",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1121",
    "nombre": "Servilletas",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 185
  },
  {
    "id": "seed1390",
    "nombre": "Set de infusion de bureta 150 ml",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1396",
    "nombre": "Sol oral solfato ferroso (hierro)",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1402",
    "nombre": "Sueros de hidratación und",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1403",
    "nombre": "Sueros pedialite",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1404",
    "nombre": "Sueros variados",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1410",
    "nombre": "Tan",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1413",
    "nombre": "Tenedor desechable",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1414",
    "nombre": "Teragrip en sobre",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1415",
    "nombre": "Termos",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1421",
    "nombre": "Toallas protectores",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1422",
    "nombre": "Tobo",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1425",
    "nombre": "Toldo",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1434",
    "nombre": "Vaporub",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed2235",
    "nombre": "Vaselina",
    "categoria": "medicina",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzmtj0eh9j5h",
    "nombre": "Vaso plásticos no desechables",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1336",
    "nombre": "Vasos desechables",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 1448
  },
  {
    "id": "seed1437",
    "nombre": "Velas",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 100
  },
  {
    "id": "mqzf7kgk9csx5",
    "nombre": "Bombillos recargables",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0136",
    "nombre": "Carretilla",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0137",
    "nombre": "Casco de construcción",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 13
  },
  {
    "id": "seed0138",
    "nombre": "Cerrucho",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0139",
    "nombre": "Chuzo forjado",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0140",
    "nombre": "Cincel",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1164",
    "nombre": "Cinchas de amarre",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1171",
    "nombre": "Cinturón de peso",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1177",
    "nombre": "Cizalla",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0141",
    "nombre": "Disco abrasivo",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 43
  },
  {
    "id": "mr9jl9vk-fi62i11qlxrx6",
    "nombre": "Disco para metal",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1226",
    "nombre": "Escardilla",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0142",
    "nombre": "Guantes de construcción",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0143",
    "nombre": "Kit de herramientas",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0144",
    "nombre": "Mandarria",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0145",
    "nombre": "Martillo",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1315",
    "nombre": "Mecate",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0146",
    "nombre": "Pala",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr576uyj-c7fhvy10laicl",
    "nombre": "Pañal de bebe talla XG 50 und",
    "categoria": "panales_higiene_ninos",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1348",
    "nombre": "Pata de cabra",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1353",
    "nombre": "Pico",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0vz08qbs2px",
    "nombre": "Pilas AA",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr56y5cq-631ekak0qaop",
    "nombre": "Pilas AAA",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6lmfez-1jgdbooybpkp",
    "nombre": "Pilas/Baterías D",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6n5d2t-1b3sa1v1kwnolt",
    "nombre": "Plagatox",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzfa0hrjek5b",
    "nombre": "Power Bank",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0135",
    "nombre": "Segueta",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0191",
    "nombre": "Spray de pintura",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1412",
    "nombre": "Tenazas",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr13l55ke0eey",
    "nombre": "Tirrap",
    "categoria": "herramientas",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0181",
    "nombre": "Baygon",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0182",
    "nombre": "Bolsa negra",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0183",
    "nombre": "Cloro 1 lt",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0184",
    "nombre": "Cloro 2 lt",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr817cua-3s34te1e6uk64",
    "nombre": "Cloro 3 lt",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr0u1gfvpf0ba",
    "nombre": "Cloro 4 lt",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr71se76-lvp88a162uvrl",
    "nombre": "Cloro 900 ml",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6x95iv-1brj9p91mdibx2",
    "nombre": "Cloro jabonoso 1 lt",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1188",
    "nombre": "Coleto",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0186",
    "nombre": "Desinfectante 1 lt",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr52ivn5c9rh0",
    "nombre": "Desinfectante 2 lt",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6frceb-1bxvwex2wt5la",
    "nombre": "Desinfectante 850 ml",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr7ydmkz-3k502ww8tmru",
    "nombre": "Detergente 400 gr",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr7xzd6c-aaqd9xqioxtx",
    "nombre": "Detergente 500 gr",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr80vsyd-eiiy2h1y8rut4",
    "nombre": "Detergente 900 gr",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1228",
    "nombre": "Esponja",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1246",
    "nombre": "Galón antiséptico",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0188",
    "nombre": "Guantes de limpieza",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 145
  },
  {
    "id": "mqzh4114gt3ov",
    "nombre": "Jabón azul",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0189",
    "nombre": "Jabón en polvo",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 17
  },
  {
    "id": "mr6uia6p-1xked36hvomle",
    "nombre": "Jabon liquido de fregar",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1297",
    "nombre": "Lavaplatos",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mqzh54rjny0bg",
    "nombre": "Lavaplatos líquido 2 lt",
    "categoria": "limpieza",
    "unidad": "litros",
    "umbral": 10
  },
  {
    "id": "mr6y3kef-55png42m8acl",
    "nombre": "Liapiateteros",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr1688du8x5h1",
    "nombre": "Paños de limpieza",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1366",
    "nombre": "Productos de limpieza",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0190",
    "nombre": "Repelente",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1400",
    "nombre": "Suavitel",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0192",
    "nombre": "Toalla desinfectante",
    "categoria": "limpieza",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1080",
    "nombre": "Almohadas",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1081",
    "nombre": "Almohadas clinicas",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1082",
    "nombre": "Cobija",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1083",
    "nombre": "Colchon infa",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1084",
    "nombre": "Colchon inflable",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1085",
    "nombre": "Colchoneta",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1086",
    "nombre": "Colchoneta de niño",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1087",
    "nombre": "Colchoneta peq",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1089",
    "nombre": "Decalona",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6e8esv-1edmjicxsjnd4",
    "nombre": "Kit de panty y toalla sanitaria",
    "categoria": "ropa_descanso",
    "unidad": "paquetes",
    "umbral": 10
  },
  {
    "id": "seed1090",
    "nombre": "Paquete de colchonetas (10 un)",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1092",
    "nombre": "Sábana",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1093",
    "nombre": "Sabana paciente",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1094",
    "nombre": "Toalla clinica",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1095",
    "nombre": "Toalla limpieza",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1096",
    "nombre": "Zapato para yeso",
    "categoria": "ropa_descanso",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1065",
    "nombre": "Boligrafos",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1066",
    "nombre": "Bolígrafos viejos",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1067",
    "nombre": "Caja de bolígrafos",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 17
  },
  {
    "id": "mqzglfhhju169",
    "nombre": "Caja de colores",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1068",
    "nombre": "Cajas de lapiz",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1070",
    "nombre": "Cuadernos",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1071",
    "nombre": "Engrapadora",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1072",
    "nombre": "Hojas blancas sueltas",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1073",
    "nombre": "Lapiceros",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1137",
    "nombre": "Lápices",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 17
  },
  {
    "id": "seed1074",
    "nombre": "Lapiz electro",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1075",
    "nombre": "Marcadores",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1076",
    "nombre": "Paquete Marcadores",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1077",
    "nombre": "Resma de papel",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed1078",
    "nombre": "Tirros",
    "categoria": "papeleria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0193",
    "nombre": "Comida mascota (general)",
    "categoria": "veterinaria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6txkin-1cc9z241wc75yf",
    "nombre": "Gatarina 500 gr",
    "categoria": "veterinaria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0195",
    "nombre": "Gatarina 1 kg",
    "categoria": "veterinaria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6qr2mm-1l7idad17l0beq",
    "nombre": "Gatarina 500 g",
    "categoria": "veterinaria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0194",
    "nombre": "Perrarina 18 kg",
    "categoria": "veterinaria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0196",
    "nombre": "Perrarina 1 kg",
    "categoria": "veterinaria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "mr6qq989-5o1dxb1gscsk8",
    "nombre": "Perrarina 2 kg",
    "categoria": "veterinaria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0197",
    "nombre": "Perrarina 4 kg",
    "categoria": "veterinaria",
    "unidad": "und",
    "umbral": 10
  },
  {
    "id": "seed0198",
    "nombre": "Perrarina 5 kg",
    "categoria": "veterinaria",
    "unidad": "und",
    "umbral": 10
  }
];
