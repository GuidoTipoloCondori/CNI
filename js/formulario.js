// -----------------------------------------------------
// MATRICES GLOBALES Y CONTADOR ID
// -----------------------------------------------------
window.tablaFinal = [];        // formulario + csv            
window.tablaCalculoNutricional = []; //     formulario + calculo nuticional (csv)* cantidad 
window.tablaMenuPlanificacion = [];    //report    
window.tablaTiempoComida = [];  //
window.tablaTiempoComidaPrimerRegistro = []; // el primer registro de cada etapa //report
window.contadorId = 0; // ID incremental para registros

// -----------------------------------------------------
// COLUMNAS NUTRICIONALES A CALCULAR
// -----------------------------------------------------
const columnasNutricionales = [
  "Calorías", "Humedad", "Proteínas", "grasas", "Carbohid.", "Fibra",
  "Calcio", "Fósforo", "Hierro", "Sodio", "Potasio", "Zinc",
  "Vit. A", "Vit. B1", "Vit. B2", "Niacina", "Vit. C"
];

// -----------------------------------------------------
// FUNCIÓN PARA ACTUALIZAR LA TABLA CALCULADA
// -----------------------------------------------------
function actualizarTablaCalculoNutricional() {
  window.tablaCalculoNutricional = window.tablaFinal.map(item => {
    const nuevoItem = {
      id: item.id,             
      etapa: item.etapa || "",
      comida: item.comida || "",
      ingrediente: item.ingrediente || "",
      cantidad: item.cantidad || 0
    };

    columnasNutricionales.forEach(col => {
      const valorOriginal = parseFloat(item[col]?.toString().replace(",", ".") || "0") || 0;
      const cantidad = parseFloat(item.cantidad?.toString().replace(",", ".") || "0") || 0;
      nuevoItem[col] = parseFloat(((cantidad / 100) * valorOriginal).toFixed(2));
    });

      // 2) POST-PROCESO PARA REEMPLAZAR CALORÍAS 
      const prote = nuevoItem["Proteínas"] || 0;
      const grasa = nuevoItem["grasas"] || 0;
      const carbo = nuevoItem["Carbohid."] || 0;
      nuevoItem["Calorías"] = parseFloat(
        (prote * 4 + grasa * 9 + carbo * 4).toFixed(2)
      );
        console.log(prote," - ",grasa," - ",carbo)
    return nuevoItem;
  });

  console.log("tablaFinal actualizada:", window.tablaFinal);
  console.log("tablaCalculoNutricional actualizada:", window.tablaCalculoNutricional);

  actualizarTablaMenuPlanificacion();
  actualizarTablaTiempoComida();
  actualizartablaTiempoComidaPrimerRegistro();
  actualizarTablaSumaGeneral();  
}

// -----------------------------------------------------
// FUNCIÓN PARA ACTUALIZAR LA TABLA DE MENU PLANIFICACION
// -----------------------------------------------------
function actualizarTablaMenuPlanificacion() {
  const agrupados = {};

  window.tablaFinal.forEach(item => {
    const key = `${item.etapa}||${item.comida}`;
    if (!agrupados[key]) agrupados[key] = [];
    agrupados[key].push(item);
  });

  window.tablaMenuPlanificacion = Object.values(agrupados).map(grupo => {
    const primerItem = grupo[0];
    const descripcion = grupo.map(i => `${i.detalle} (${i.cantidad} g)`).join(", ");
    return {
      id: primerItem.id,
      etapa: primerItem.etapa,
      comida: primerItem.comida,
      descripcion: `ingredientes: ${descripcion}`
    };
  });

  console.log("tablaMenuPlanificacion actualizada:", window.tablaMenuPlanificacion);
}

// -----------------------------------------------------
// FUNCIÓN PARA ACTUALIZAR LA PRIMERA COMIDA DE CADA ETAPA
// -----------------------------------------------------
function actualizartablaTiempoComidaPrimerRegistro() {
  const primeraComidaPorEtapa = {};   // Objeto temporal para agrupar

  // Recorrer toda la tablaTiempoComida
  window.tablaTiempoComida.forEach(item => {
    const etapa = item.etapa;

    // Si la etapa aún NO fue registrada, guardamos este primer item
    if (!primeraComidaPorEtapa[etapa]) {
      primeraComidaPorEtapa[etapa] = item;
    }
  });

  // Convertimos el objeto a matriz final
  window.tablaTiempoComidaPrimerRegistro = Object.values(primeraComidaPorEtapa);

  console.log("tablaTiempoComidaPrimerRegistro:", window.tablaTiempoComidaPrimerRegistro);
}


// -----------------------------------------------------
// FUNCIÓN PARA ACTUALIZAR LA TABLA TIEMPO COMIDA
// -----------------------------------------------------
function actualizarTablaTiempoComida() {
  const agrupados = {};

  window.tablaCalculoNutricional.forEach(item => {
    const key = `${item.etapa}||${item.comida}`;
    if (!agrupados[key]) agrupados[key] = [];
    agrupados[key].push(item);
  });

  window.tablaTiempoComida = Object.values(agrupados).map(grupo => {
    const primerItem = grupo[0];
    const nuevoItem = { id: primerItem.id, etapa: primerItem.etapa, comida: primerItem.comida };

    columnasNutricionales.forEach(col => {
      nuevoItem[col] = grupo.reduce((acc, i) => acc + (parseFloat(i[col]) || 0), 0);
    });

    return nuevoItem;
  });

  console.log("tablaTiempoComida actualizada:", window.tablaTiempoComida);
}

// -----------------------------------------------------
// FORMULARIO POR ETAPAS
// -----------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  const etapas = ["Desayuno", "Merienda AM", "Almuerzo", "Merienda PM", "Cena", "Pre Entreno", "Post Entreno"];
  let etapaIndex = 0;

  const datos = { desayuno: [], merienda_am: [], almuerzo: [], merienda_pm: [], cena: [], pre_entreno: [], post_entreno: [] };

  // ELEMENTOS DEL DOM
  const tituloEl = document.getElementById("titulo-etapa");
  const inputComida = document.getElementById("input-comida");
  const inputDetalle = document.getElementById("input-detalle");
  const inputIngrediente = document.getElementById("input-ingrediente");
  const inputCantidad = document.getElementById("input-cantidad");
  const tbody = document.getElementById("tabla-ingredientes");

  const btnAgregar = document.getElementById("btn-agregar");
  const btnAnterior = document.getElementById("btn-anterior");
  const btnSiguiente = document.getElementById("btn-siguiente");
  const btnGuardar = document.getElementById("btn-guardar");

  // ENTER PASA AL SIGUIENTE INPUT
  const inputsOrden = [inputComida, inputDetalle, inputIngrediente, inputCantidad];
  inputsOrden.forEach((input, idx) => {
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const siguiente = inputsOrden[idx + 1];
        if (siguiente) siguiente.focus();
        else btnAgregar.focus();
      }
    });
  });

  if (!tituloEl || !inputComida || !inputDetalle || !inputIngrediente || !inputCantidad || !tbody ||
      !btnAgregar || !btnAnterior || !btnSiguiente || !btnGuardar) {
    console.error("Faltan elementos del DOM. Revisa IDs.");
    return;
  }

  function obtenerClaveEtapa() {
    return ["desayuno", "merienda_am", "almuerzo", "merienda_pm", "cena", "pre_entreno", "post_entreno"][etapaIndex];
  }

  function actualizarEstadoBotones() {
    btnAnterior.classList.toggle("is-disabled", etapaIndex === 0);
    btnSiguiente.classList.toggle("is-disabled", etapaIndex === etapas.length - 1);
  }

  function mostrarTitulo() {
    tituloEl.innerText = etapas[etapaIndex];
    actualizarEstadoBotones();
  }

  // CARGAR TABLA VISUAL
  function cargarTabla() {
    tbody.innerHTML = "";
    const etapa = obtenerClaveEtapa();

    datos[etapa].forEach((item, index) => {
      const tr = document.createElement("tr");

      const tdComida = document.createElement("td");
      tdComida.textContent = item.comida;
      tr.appendChild(tdComida);

      const tdIng = document.createElement("td");
      tdIng.textContent = item.ingrediente;
      tr.appendChild(tdIng);

      const tdCant = document.createElement("td");
      tdCant.textContent = item.cantidad;
      tr.appendChild(tdCant);

      const tdAcc = document.createElement("td");

      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn btn-warning btn-sm me-1";
      btnEdit.textContent = "Editar";
      btnEdit.addEventListener("click", () => {
        inputComida.value = item.comida;
        inputDetalle.value = item.detalle;
        inputIngrediente.value = item.ingrediente;
        inputCantidad.value = item.cantidad;
        inputComida.dataset.editIndex = index;
      });
      tdAcc.appendChild(btnEdit);

      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn btn-danger btn-sm";
      btnDel.textContent = "Eliminar";
      btnDel.addEventListener("click", e => { e.preventDefault(); eliminarIngrediente(index); });
      tdAcc.appendChild(btnDel);

      tr.appendChild(tdAcc);
      tbody.appendChild(tr);
    });
  }

  // AGREGAR O EDITAR INGREDIENTE
  function agregarIngrediente(e) {
    if (e) e.preventDefault();

    const comida = inputComida.value.trim();
    const detalle = inputDetalle.value.trim();
    const ing = inputIngrediente.value.trim();
    const cant = inputCantidad.value.trim();

    if (!comida || !detalle || !ing || !cant) {
      alert("Completa comida, detalle, ingrediente y cantidad.");
      return;
    }

    const etapa = obtenerClaveEtapa();
    const editIndex = inputComida.dataset.editIndex;
    const infoCSV = listaAlimentos.find(a => a["Nombre del alimento"].toLowerCase() === ing.toLowerCase()) || {};

    if (editIndex !== undefined) {
      const itemAntiguo = { ...datos[etapa][editIndex] };
      datos[etapa][editIndex] = { comida, detalle, ingrediente: ing, cantidad: cant, id: datos[etapa][editIndex].id };

      const globalIndex = tablaFinal.findIndex(fila => fila.id === itemAntiguo.id);
      if (globalIndex !== -1) {
        tablaFinal[globalIndex] = { id: tablaFinal[globalIndex].id, etapa: etapas[etapaIndex], comida, detalle, ingrediente: ing, cantidad: cant, ...infoCSV };
      }

      delete inputComida.dataset.editIndex;
    } else {
      const nuevoRegistro = {
        id: window.contadorId++,
        etapa: etapas[etapaIndex],
        comida,
        detalle,
        ingrediente: ing,
        cantidad: cant,
        ...infoCSV
      };

      datos[etapa].push({ ...nuevoRegistro });
      tablaFinal.push(nuevoRegistro);
    }

    actualizarTablaCalculoNutricional();

    inputDetalle.value = "";
    inputIngrediente.value = "";
    inputCantidad.value = "";
    cargarTabla();
  }

  // ELIMINAR INGREDIENTE
  function eliminarIngrediente(index) {
    const etapa = obtenerClaveEtapa();
    const item = datos[etapa][index];

    datos[etapa].splice(index, 1);
    tablaFinal = tablaFinal.filter(fila => fila.id !== item.id);

    actualizarTablaCalculoNutricional();
    cargarTabla();
  }

  // NAVEGACIÓN ENTRE ETAPAS
  function siguiente(e) {
    if (e) e.preventDefault();
    if (etapaIndex < etapas.length - 1) {
      etapaIndex++;
      mostrarTitulo();
      cargarTabla();
    }
    inputComida.value = "";
  }

  function anterior(e) {
    if (e) e.preventDefault();
    if (etapaIndex > 0) {
      etapaIndex--;
      mostrarTitulo();
      cargarTabla();
    }
  }

  function enviarFormulario(e) {
    if (e) e.preventDefault();
    console.log("TABLA FINAL:", tablaFinal);
    console.log("TABLA CALCULO NUTRICIONAL:", window.tablaCalculoNutricional);
    console.log("TABLA MENU PLANIFICACION:", window.tablaMenuPlanificacion);
    console.log("TABLA TIEMPO COMIDA:", window.tablaTiempoComida);
    alert("Datos guardados. Revisa la consola.");
  }

  // LISTENERS
  btnAgregar.addEventListener("click", agregarIngrediente);
  btnAnterior.addEventListener("click", ev => { if (!btnAnterior.classList.contains("is-disabled")) anterior(ev); });
  btnSiguiente.addEventListener("click", ev => { if (!btnSiguiente.classList.contains("is-disabled")) siguiente(ev); });
  btnGuardar.addEventListener("click", enviarFormulario);

  mostrarTitulo();
  cargarTabla();
});

// -----------------------------------------------------
// AUTOCOMPLETE DESDE CSV
// -----------------------------------------------------
const CSV_PATH = "alimentos.csv";
let listaAlimentos = [];

fetch(CSV_PATH)
  .then(res => res.text())
  .then(text => { listaAlimentos = convertirCSV(text); })
  .catch(err => console.error("Error al cargar CSV:", err));

function convertirCSV(texto) {
  const filas = texto.split("\n").map(f => f.trim());
  const headers = filas[0].split(";");

  return filas.slice(1).map(fila => {
    const cols = fila.split(";");
    let obj = {};
    headers.forEach((h, i) => obj[h] = cols[i] || "");
    return obj;
  });
}

const inputIng = document.getElementById("input-ingrediente");
const listaSug = document.getElementById("lista-sugerencias");

inputIng.addEventListener("input", function () {
  const texto = this.value.trim().toLowerCase();
  if (texto.length < 1) { listaSug.innerHTML = ""; return; }

  const matches = listaAlimentos
    .filter(item => item["Nombre del alimento"].toLowerCase().includes(texto))
    .slice(0, 10);

  mostrarSugerencias(matches);
});

function mostrarSugerencias(items) {
  listaSug.innerHTML = "";
  items.forEach(item => {
    const opcion = document.createElement("button");
    opcion.className = "list-group-item list-group-item-action";
    opcion.textContent = item["Nombre del alimento"];
    opcion.addEventListener("click", () => {
      inputIng.value = item["Nombre del alimento"];
      listaSug.innerHTML = "";
    });
    listaSug.appendChild(opcion);
  });
}

document.addEventListener("click", function (e) {
  if (!inputIng.contains(e.target)) listaSug.innerHTML = "";
});















//para mostrar en la tabla de html el tiempo de comida

function mostrarTablaTiempoComida() {
  const tbody = document.querySelector("#tabla-tiempo-comida tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  window.tablaTiempoComida.forEach(item => {
    const tr = document.createElement("tr");

    // Etapa y Comida
    const tdEtapa = document.createElement("td");
    tdEtapa.textContent = item.etapa;
    tr.appendChild(tdEtapa);

    const tdComida = document.createElement("td");
    tdComida.textContent = item.comida;
    tr.appendChild(tdComida);

    // Columnas nutricionales
    columnasNutricionales.forEach(col => {
      const td = document.createElement("td");
      td.textContent = item[col]?.toFixed(2) || 0;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

// Llamar a esta función después de actualizar tablaTiempoComida
function actualizarTablaTiempoComida() {
  const agrupados = {};

  window.tablaCalculoNutricional.forEach(item => {
    const key = `${item.etapa}||${item.comida}`;
    if (!agrupados[key]) agrupados[key] = [];
    agrupados[key].push(item);
  });

  window.tablaTiempoComida = Object.values(agrupados).map(grupo => {
    const primerItem = grupo[0];
    const nuevoItem = { etapa: primerItem.etapa, comida: primerItem.comida };

    columnasNutricionales.forEach(col => {
      nuevoItem[col] = grupo.reduce((acc, i) => acc + (parseFloat(i[col]) || 0), 0);
    });

    return nuevoItem;
  });

  mostrarTablaTiempoComida();
}

//-------------------------------
// MOSTARA SUMA GENERAL 
//----------------------------------
function actualizarTablaSumaGeneral() {
  const origen = window.tablaTiempoComidaPrimerRegistro;

  const suma = {};

  // Inicializar en 0
  columnasNutricionales.forEach(col => suma[col] = 0);

  // Sumar cada registro
  origen.forEach(item => {
    columnasNutricionales.forEach(col => {
      suma[col] += parseFloat(item[col] || 0);
    });
  });

  window.tablaSumaGeneral = [suma];

  console.log("tablaSumaGeneral:", window.tablaSumaGeneral);

  mostrarTablaSumaGeneral();
}


function mostrarTablaSumaGeneral() {
  // 1. Mostrar comidas sumadas en el <h3>
  const titulo = document.querySelector("#titulo-suma-general");
  if (titulo) {
    const comidas = window.tablaTiempoComidaPrimerRegistro.map(i => i.comida).join(" + ");
    titulo.textContent = `Total Aporte del Dia (${comidas})`;
  }

  // 2. Mostrar tabla normal
  const tbody = document.querySelector("#tabla-suma-general tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const item = window.tablaSumaGeneral[0];
  const tr = document.createElement("tr");

  columnasNutricionales.forEach(col => {
    const td = document.createElement("td");
    td.textContent = item[col].toFixed(2);
    tr.appendChild(td);
  });

  tbody.appendChild(tr);
}




//-------------------------------
// CALCULOS
//----------------------------------
function calcularInterpretacionResultados() {

  if (!window.tablaSumaGeneral || window.tablaSumaGeneral.length === 0) {
      alert("No hay datos en tablaSumaGeneral para calcular.");
      return;
  }

  // Solo hay un registro en tablaSumaGeneral (suma total)
  const total = window.tablaSumaGeneral[0];

  // Pauta Alimentaria (datos reales del cálculo)
  const pautaCalorias   = total["Calorías"] || 0;
  const pautaCarbo      = total["Carbohid."] || 0;
  const pautaProte      = total["Proteínas"] || 0;
  const pautaGrasas     = total["grasas"] || 0;

  // Requerimientos (valor por defecto)
  const reqCalorias = 2500;
  const reqCarbo    = 227;
  const reqProte    = 133;
  const reqGrasas   = 117;

  // Grado de adecuación (pauta / requerimiento * 100)
  const adecCalorias = (pautaCalorias / reqCalorias) * 100;
  const adecCarbo    = (pautaCarbo / reqCarbo) * 100;
  const adecProte    = (pautaProte / reqProte) * 100;
  const adecGrasas   = (pautaGrasas / reqGrasas) * 100;

  // Ahora llenamos la tabla
  const tbody = document.querySelector("#tabla-cuadro-2 tbody");
  tbody.innerHTML = ""; // limpiar

  // ------- FILA: PAUTA ALIMENTARIA -------
  let tr1 = document.createElement("tr");
  tr1.innerHTML = `
      <td><b>PAUTA ALIMENTARIA</b></td>
      <td>${pautaCalorias.toFixed(2)}</td>
      <td>${pautaCarbo.toFixed(2)}</td>
      <td>${pautaProte.toFixed(2)}</td>
      <td>${pautaGrasas.toFixed(2)}</td>
  `;
  tbody.appendChild(tr1);

  // ------- FILA: REQUERIMIENTO -------
  let tr2 = document.createElement("tr");
  tr2.innerHTML = `
      <td><b>REQUERIMIENTO</b></td>
      <td>${reqCalorias}</td>
      <td>${reqCarbo}</td>
      <td>${reqProte}</td>
      <td>${reqGrasas}</td>
  `;
  tbody.appendChild(tr2);

  // ------- FILA: GRADO DE ADECUACIÓN -------
  let tr3 = document.createElement("tr");
  tr3.innerHTML = `
      <td><b>GRADO DE ADECUACIÓN</b></td>
      <td>${adecCalorias.toFixed(2)}</td>
      <td>${adecCarbo.toFixed(2)}</td>
      <td>${adecProte.toFixed(2)}</td>
      <td>${adecGrasas.toFixed(2)}</td>
  `;
  tbody.appendChild(tr3);
  
  
  //-------  PARA PRIMER CUADRO (PESO)
// 1. Leer peso
const peso = parseFloat(document.getElementById("input-peso").value) || 1;

// 2. Obtener las sumas totales
const total02 = window.tablaSumaGeneral[0] || {
    "Proteínas": 0,
    "grasas": 0,
    "Carbohid.": 0,
    "Calorías": 0
};

const prote = total02["Proteínas"];
const grasa = total02["grasas"];       // corregido: antes decía "grasas"
const carbo = total02["Carbohid."];
const kcalTotal02 = total02["Calorías"];

// 3. Calcular valores
const filas = [
    {
        nombre: "Proteínas",
        g: prote,
        kcal: prote * 4,
        porcentaje: (prote * 4 / kcalTotal02) * 100,
        gKg: prote / peso
    },
    {
        nombre: "Lípidos",
        g: grasa,
        kcal: grasa * 9,
        porcentaje: (grasa * 9 / kcalTotal02) * 100,
        gKg: grasa / peso
    },
    {
        nombre: "Carbohidratos",
        g: carbo,
        kcal: carbo * 4,
        porcentaje: (carbo * 4 / kcalTotal02) * 100,
        gKg: carbo / peso
    }
];

// 4. Calcular totales
const total02Porcentaje = filas.reduce((a, b) => a + b.porcentaje, 0);
const total02Kcal = kcalTotal02;
const total02GKcal = "Kcal/kg";
const total02GKkg = kcalTotal02 / peso;

// 5. Insertar en tabla
const tbody02 = document.querySelector("#tabla-cuadro-1 tbody");
tbody02.innerHTML = "";

// Insertar filas individuales
filas.forEach(f => {
    tbody02.innerHTML += `
        <tr>
            <td>${f.nombre}</td>
            <td>${f.porcentaje.toFixed(2)}</td>
            <td>${f.kcal.toFixed(2)}</td>
            <td>${f.g.toFixed(2)}</td>
            <td>${f.gKg.toFixed(2)}</td>
        </tr>
    `;
});

// Insertar fila total
tbody02.innerHTML += `
    <tr>
        <td><b>TOTAL</b></td>
        <td>${total02Porcentaje.toFixed(2)}</td>
        <td>${total02Kcal.toFixed(2)}</td>
        <td>${total02GKcal}</td>
        <td>${total02GKkg.toFixed(2)}</td>
    </tr>
`;

}

//----- La etiqueta sea simpre en el mismo formato

document.getElementById("input-nombre").addEventListener("input", function () {
  this.value = this.value
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
});













// -----------------------------------------------------
// CONFIGURACIÓN PRINCIPAL
// -----------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado");

  const btnDescargar = document.getElementById("btn-descargar-excel");
  const inputNombre = document.getElementById("input-nombre");

  if (!btnDescargar) return console.error("No se encontró btn-descargar-excel");

  btnDescargar.addEventListener("click", async function (e) {
    e.preventDefault();

    // Obtener nombre
    let nombre = inputNombre && inputNombre.value.trim();
    if (!nombre) {
      nombre = prompt("Ingresa el nombre del paciente:");
      if (!nombre) {
        alert("Nombre vacío. Cancelando descarga.");
        return;
      }
    }

    try {
      console.log("Cargando tabla_nutricion Excel...");
      const response = await fetch("tabla_nutricion.xlsx");
      if (!response.ok) throw new Error("No se pudo cargar la plantilla");

      const arrayBuffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet("Hoja1"); // hoja por nombre
      if (!worksheet) throw new Error("No se encontró la hoja Hoja1");

      // Nombre en C2
      worksheet.getCell("C2").value = nombre;

      // Fecha en F2
      const fecha = new Date();
      const fechaStr = `${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2,"0")}-${fecha.getDate().toString().padStart(2,"0")} ${fecha.getHours().toString().padStart(2,"0")}:${fecha.getMinutes().toString().padStart(2,"0")}`;
      worksheet.getCell("F2").value = fechaStr;

      console.log("Nombre y fecha escritos:", nombre, fechaStr);

      // --------------------------
      // Ordenar tabla por etapa y por id
      // --------------------------
      const ETAPAS_ORDEN = ["Desayuno","Merienda AM","Almuerzo","Merienda PM","Cena","Pre Entrena","Post Entrena"];
      let filaInicio = 5; // fila inicial para comidas

      ETAPAS_ORDEN.forEach(etapa => {
        const items = window.tablaMenuPlanificacion
          .filter(f => f.etapa === etapa)
          .sort((a,b) => a.id - b.id);

        if (items.length > 0) {
          // solo tomamos hasta 7 comidas por etapa
          const maxComidas = Math.min(items.length, 7);

          for (let i = 0; i < maxComidas; i++) {
            const item = items[i];
            const col = 4 + i; // D=4, E=5, ... hasta J=10
            const filaComida = filaInicio;
            const filaDesc = filaInicio + 1;

            const cellComida = worksheet.getRow(filaComida).getCell(col);
            const cellDesc = worksheet.getRow(filaDesc).getCell(col);

            cellComida.value = item.comida;
            cellDesc.value = item.descripcion;

            console.log(`Escrito ${item.comida}/${item.descripcion} en col ${col}, filas ${filaComida}/${filaDesc}`);
          }
        } else {
          console.log(`Etapa "${etapa}" vacía, se mantiene sin cambios.`);
        }

        filaInicio += 2; // siguiente etapa
      });

// -----------------------------------------------------
// ESCRIBIR EN HOJA 2
// -----------------------------------------------------
// -----------------------------------------------------
// ESCRIBIR EN HOJA 2
// -----------------------------------------------------
const hoja2 = workbook.getWorksheet("Hoja2");
if (!hoja2) throw new Error("No se encontró la hoja Hoja2");

// Ordenar antes de escribir
const ORDEN_ETAPAS_2 = [
  "desayuno",
  "merienda_am",
  "almuerzo",
  "merienda_pm",
  "cena",
  "pre_entreno",
  "post_entreno"
];

// Crea tabla ordenada
const tablaOrdenadaCalculo = [...window.tablaCalculoNutricional].sort((a, b) => {
  return ORDEN_ETAPAS_2.indexOf(a.etapa) - ORDEN_ETAPAS_2.indexOf(b.etapa);
});

// Limpia hoja
for (let r = 1; r <= 200; r++) {
  hoja2.getRow(r).values = [];
}

// Encabezados
hoja2.getCell("A1").value = "etapa";
hoja2.getCell("B1").value = "comida";
hoja2.getCell("C1").value = "ingrediente";
hoja2.getCell("D1").value = "cantidad";
hoja2.getCell("E1").value = "Calorías"; 
hoja2.getCell("F1").value = "Humedad"; 
hoja2.getCell("G1").value = "Proteínas"; 
hoja2.getCell("H1").value = "grasas"; 
hoja2.getCell("I1").value = "Carbohid."; 
hoja2.getCell("J1").value = "Fibra";
hoja2.getCell("K1").value = "Calcio"; 
hoja2.getCell("L1").value = "Fósforo"; 
hoja2.getCell("M1").value = "Hierro"; 
hoja2.getCell("N1").value = "Sodio"; 
hoja2.getCell("O1").value = "Potasio"; 
hoja2.getCell("P1").value = "Zinc";
hoja2.getCell("Q1").value = "Vit. A"; 
hoja2.getCell("R1").value = "Vit. B1"; 
hoja2.getCell("S1").value = "Vit. B2"; 
hoja2.getCell("T1").value = "Niacina"; 
hoja2.getCell("U1").value = "Vit. C";

// Llenado ordenado
let fila = 2;

tablaOrdenadaCalculo.forEach(item => {
  hoja2.getCell(`A${fila}`).value = item.etapa || "";
  hoja2.getCell(`B${fila}`).value = item.comida || "";
  hoja2.getCell(`C${fila}`).value = item.ingrediente || "";
  hoja2.getCell(`D${fila}`).value = item.cantidad || "";
  hoja2.getCell(`E${fila}`).value = item["Calorías"] || 0;
  hoja2.getCell(`F${fila}`).value = item["Humedad"] || 0;
  hoja2.getCell(`G${fila}`).value = item["Proteínas"] || 0;
  hoja2.getCell(`H${fila}`).value = item["grasas"] || 0;
  hoja2.getCell(`I${fila}`).value = item["Carbohid."] || 0;
  hoja2.getCell(`J${fila}`).value = item["Fibr"] || 0;
  hoja2.getCell(`K${fila}`).value = item["Calcio"] || 0;
  hoja2.getCell(`L${fila}`).value = item["Fósforo"] || 0;
  hoja2.getCell(`M${fila}`).value = item["Hierro"] || 0;
  hoja2.getCell(`N${fila}`).value = item["Sodio"] || 0;
  hoja2.getCell(`O${fila}`).value = item["Potasio"] || 0;
  hoja2.getCell(`P${fila}`).value = item["Zin"] || 0;
  hoja2.getCell(`Q${fila}`).value = item["Vit. A"] || 0;
  hoja2.getCell(`R${fila}`).value = item["Vit. B1"] || 0;
  hoja2.getCell(`S${fila}`).value = item["Vit. B2"] || 0;
  hoja2.getCell(`T${fila}`).value = item["Niacina"] || 0;
  hoja2.getCell(`U${fila}`).value = item["Vit. C"] || 0;
  fila++;
});







      // --------------------------
      // Descargar archivo
      // --------------------------
      const nombreArchivo = `CNI_${nombre}_${fecha.getFullYear()}${(fecha.getMonth()+1).toString().padStart(2,"0")}${fecha.getDate().toString().padStart(2,"0")}_${fecha.getHours().toString().padStart(2,"0")}${fecha.getMinutes().toString().padStart(2,"0")}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = nombreArchivo;
      link.click();

      console.log("Descarga iniciada:", nombreArchivo);
      alert("Descarga iniciada:", nombreArchivo);      

    } catch (err) {
      console.error("Error al generar Excel:", err);
      alert("Ocurrió un error al descargar Excel. Revisa la consola.");
    }
  });
});



///------------------------------------------
// notificaion de descarga
//-----------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const boton = document.getElementById("btn-descargar-excel");
  const notificacion = document.getElementById("notificacion-descarga");

  boton.addEventListener("click", () => {
    // Mostrar la notificación
    notificacion.style.display = "block";

    // Ocultarla después de 2.5 segundos
    setTimeout(() => {
      notificacion.style.display = "none";
    }, 2500);
  });
});
