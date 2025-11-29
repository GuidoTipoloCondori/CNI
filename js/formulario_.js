// formulario.js
// -----------------------------------------------------
// MATRIZ GLOBAL PARA GUARDAR TODAS LAS FILAS
// -----------------------------------------------------
let tablaFinal = [];  // matriz principal donde se guardarán todas las filas

// -----------------------------------------------------
// FORMULARIO POR ETAPAS
// -----------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
  const etapas = ["Desayuno", "Merienda AM", "Almuerzo", "Merienda PM", "Cena"];
  let etapaIndex = 0;

  const datos = { desayuno: [], merienda_am: [], almuerzo: [], merienda_pm: [], cena: [] };

  // ELEMENTOS
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

  // -----------------------------------------------------
  // ENTER PASA AL SIGUIENTE INPUT
  // -----------------------------------------------------
  const inputsOrden = [inputComida, inputDetalle, inputIngrediente, inputCantidad];
  inputsOrden.forEach((input, idx) => {
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        const siguiente = inputsOrden[idx + 1];
        if (siguiente) siguiente.focus();
        else btnAgregar.focus(); // opcional: btnAgregar.click();
      }
    });
  });

  if (!tituloEl || !inputComida || !inputDetalle || !inputIngrediente || !inputCantidad || !tbody ||
      !btnAgregar || !btnAnterior || !btnSiguiente || !btnGuardar) {
    console.error("Faltan elementos del DOM. Revisa IDs.");
    return;
  }

  function obtenerClaveEtapa() {
    return ["desayuno", "merienda_am", "almuerzo", "merienda_pm", "cena"][etapaIndex];
  }

  function actualizarEstadoBotones() {
    btnAnterior.classList.toggle("is-disabled", etapaIndex === 0);
    btnSiguiente.classList.toggle("is-disabled", etapaIndex === etapas.length - 1);
  }

  function mostrarTitulo() {
    tituloEl.innerText = etapas[etapaIndex];
    actualizarEstadoBotones();
  }

  // -----------------------------------------------------
  // CARGAR TABLA VISUAL
  // -----------------------------------------------------
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

      // BOTÓN EDITAR
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn btn-warning btn-sm me-1";
      btnEdit.textContent = "Editar";
      btnEdit.addEventListener("click", () => {
        inputComida.value = item.comida;
        inputDetalle.value = item.detalle;
        inputIngrediente.value = item.ingrediente;
        inputCantidad.value = item.cantidad;

        inputComida.dataset.editIndex = index; // guardamos solo el índice de edición
      });
      tdAcc.appendChild(btnEdit);

      // BOTÓN ELIMINAR
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

  // -----------------------------------------------------
  // AGREGAR O EDITAR INGREDIENTE CON DATOS DEL CSV
  // -----------------------------------------------------
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

    // BUSCAR DATOS CSV DEL ALIMENTO
    const infoCSV = listaAlimentos.find(a => a["Nombre del alimento"].toLowerCase() === ing.toLowerCase()) || {};

    if (editIndex !== undefined) {
      // --------- EDICIÓN ---------
      datos[etapa][editIndex] = { comida, detalle, ingrediente: ing, cantidad: cant };

      // Actualizamos tablaFinal usando el mismo índice en datos[etapa]
      const globalIndex = tablaFinal.findIndex(fila =>
        fila.etapa === etapas[etapaIndex] &&
        fila.ingrediente === datos[etapa][editIndex].ingrediente &&
        fila.comida === datos[etapa][editIndex].comida &&
        fila.detalle === datos[etapa][editIndex].detalle &&
        fila.cantidad === datos[etapa][editIndex].cantidad
      );

      if (globalIndex !== -1) {
        tablaFinal[globalIndex] = { etapa: etapas[etapaIndex], comida, detalle, ingrediente: ing, cantidad: cant, ...infoCSV };
      }

      delete inputComida.dataset.editIndex;
      console.log("Matriz actualizada después de editar:", tablaFinal);
    } else {
      // --------- NUEVO ELEMENTO ---------
      datos[etapa].push({ comida, detalle, ingrediente: ing, cantidad: cant });
      tablaFinal.push({ etapa: etapas[etapaIndex], comida, detalle, ingrediente: ing, cantidad: cant, ...infoCSV });
      console.log("Matriz actualizada:", tablaFinal);
    }

    inputDetalle.value = "";
    inputIngrediente.value = "";
    inputCantidad.value = "";
    cargarTabla();
  }

  // -----------------------------------------------------
  // ELIMINAR INGREDIENTE
  // -----------------------------------------------------
  function eliminarIngrediente(index) {
    const etapa = obtenerClaveEtapa();
    const item = datos[etapa][index];

    datos[etapa].splice(index, 1);

    tablaFinal = tablaFinal.filter(fila =>
      !(fila.etapa === etapas[etapaIndex] &&
        fila.comida === item.comida &&
        fila.detalle === item.detalle &&
        fila.ingrediente === item.ingrediente &&
        fila.cantidad === item.cantidad)
    );

    cargarTabla();
    console.log("Matriz actualizada después de eliminar:", tablaFinal);
  }

  // -----------------------------------------------------
  // NAVEGACIÓN ENTRE ETAPAS
  // -----------------------------------------------------
  function siguiente(e) {
    if (e) e.preventDefault();
    if (etapaIndex < etapas.length - 1) {
      etapaIndex++;
      mostrarTitulo();
      cargarTabla();
      console.log("Matriz actual (al cambiar etapa):", tablaFinal);
    }
    inputComida.value = "";
  }

  function anterior(e) {
    if (e) e.preventDefault();
    if (etapaIndex > 0) {
      etapaIndex--;
      mostrarTitulo();
      cargarTabla();
      console.log("Matriz actual (al cambiar etapa):", tablaFinal);
    }
  }

  function enviarFormulario(e) {
    if (e) e.preventDefault();
    console.log("TABLA FINAL COMPLETA CON DATOS CSV:", tablaFinal);
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
