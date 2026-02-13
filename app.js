let cajaInicial = Number(localStorage.getItem("cajaInicial"))|| 0;
let totalVentas = Number(localStorage.getItem("totalVentas"))|| 0;
let textoBuscador = "";
let categoriasAbiertas = {};
let ventas = JSON.parse(localStorage.getItem("ventas")) || [];
let productos = 
JSON.parse(localStorage.getItem("productos")) || [];
let turnos = JSON.parse(localStorage.getItem("turnos")) || [];

function guardarCaja(){
	localStorage.setItem("cajaInicial", cajaInicial);
	localStorage.setItem("totalVentas", totalVentas);
}

function iniciarTurno(){
	let monto = prompt("Caja inicial");
	if(monto !==null){
		cajaInicial = Number(monto);
		totalVentas = 0;
		guardarCaja();
		mostrarCaja();
	}
}

function guardarTurnos(){
	localStorage.setItem("turnos", JSON.stringify(turnos));
}

function mostrarCaja(){
	const div = document.getElementById("caja");
	if(!div) return;
	div.innerHTML =`
		<p>Caja inicial: $${cajaInicial}</p>
		<p>Total vendido: $${totalVentas}</p>
		<p><strong>Caja actual: $${cajaInicial + totalVentas}</strong></p>
	`;
}

function generarResumenTurno(){
	let resumen = {};
	let total = 0;

	ventas.forEach(v => {
		if (!resumen[v.categoria]) {
			resumen[v.categoria] = {};
		}

		const clave = `${v.producto} (${v.variante})`;

		if (!resumen[v.categoria][clave]) {
			resumen[v.categoria][clave] = {
				cantidad: 0,
				total: 0 };
	}

	resumen[v.categoria][clave].cantidad++;
	resumen[v.categoria][clave].total += v.precio;
	total += v.precio;
	});

	return{
		fecha: new Date().toLocaleString(),
		cajaInicial,
		totalVentas: total,
		cajaEsperada: cajaInicial + total,
		resumen
	};
}


function guardarVentas(){
	localStorage.setItem("ventas",JSON.stringify(ventas));
}

function mostrarVentas(){
	const contenedor = document.getElementById("historial-ventas");
	if(!contenedor) return;
	contenedor.innerHTML = "";

	if(ventas.length === 0){
		contenedor.innerHTML = "<p>No hay ventas registradas.</p>";
	return;
	}

	ventas.slice().reverse().forEach(v => {
		const fecha = new Date(v.fecha).toLocaleString();

		contenedor.innerHTML +=`
		<div class="producto-card">
			<strong>${v.producto}</strong>(${v.variante})<br>
			$${v.precio} -- ${fecha}
		</div>
		`;
	});
}

function guardar() {
	localStorage.setItem("productos",JSON.stringify(productos));
}

function agregarProducto() {
	let categoria = document.getElementById("categoria").value.trim();
	let producto = document.getElementById("producto").value.trim();
	let variante = document.getElementById("variante").value.trim();
	let precio = Number(document.getElementById("precio").value);
	let stock = Number(document.getElementById("stock").value);
	let min = Number(document.getElementById("min").value);

	if(!categoria||!producto||!variante||precio <= 0||stock <= 0){
		alert("Completá bien los datos");
		return;
}
	let existente = productos.find(p => 
		p.categoria.toLowerCase() === categoria.toLowerCase() 
			&& 
		p.producto.toLowerCase() === producto.toLowerCase() 
			&& 
		p.variante.toLowerCase() === variante.toLowerCase()
	);
	
	if(existente){
		existente.stock += stock;
		existente.precio = precio;
		existente.stockMin = min;
	}else{
		let p = {
			id: Date.now(),
			categoria,
			producto,
			variante,
			precio,
			stock,
			stockMin: min
		};
		productos.push(p);
	}

	guardar();
	mostrar();

	document.getElementById("categoria").value = "";
	document.getElementById("producto").value = "";
	document.getElementById("variante").value = "";
	document.getElementById("precio").value = "";
	document.getElementById("stock").value ="";
	document.getElementById("min").value ="";
}

function filtrarProductos(){
	textoBuscador = document.getElementById("buscador").value.toLowerCase();

	if(textoBuscador){
		for(let cat in categoriasAbiertas){
			categoriasAbiertas[cat] = true;
		}
	}
	mostrar();
}

function toggleCategoria(cat){
	for(let c in categoriasAbiertas){
		if(c!==cat)categoriasAbiertas[c]=false;
	}
	categoriasAbiertas[cat]=!categoriasAbiertas[cat];
	mostrar();
}

function resaltarTexto(texto, busqueda){
	if (!busqueda) return texto;

	const regex = new RegExp(`(${busqueda})`, "gi");
	return texto.replace(regex, `<mark>$1</mark>`);
}

function mostrar(){
	let lista = document.getElementById("lista");
	lista.innerHTML = "";
	
	let hayResultados = false;
	let categorias = {};

	productos.forEach(p =>{
		if(!categorias[p.categoria]){
			categorias[p.categoria] = [];
		}
		categorias[p.categoria].push(p);
	});
	
	for(let cat in categorias){
		const productosFiltrados = categorias[cat].filter(p => {
			if (!textoBuscador) return true;

			const texto = `${p.categoria}${p.producto}${p.variante}`.toLowerCase();
			return texto.includes(textoBuscador);
		});
			if (productosFiltrados.length === 0) continue;
			hayResultados = true;
			
			if (textoBuscador) categoriasAbiertas[cat] = true;
			if (categoriasAbiertas[cat] === undefined) categoriasAbiertas[cat] = false;

			const flecha = categoriasAbiertas[cat] ? "\u25BC" : "\u25B6";
		
			lista.innerHTML +=`
			<div class="categoria-titulo" onclick="toggleCategoria('${cat}')">
				<strong>${cat.toUpperCase()}</strong> <span class="flecha">${flecha}</span>
			</div>
			<div class="productos-categoria" style="display:${categoriasAbiertas[cat]?'block':'none'}">
			</div>
			`;

			const contenedores = lista.querySelectorAll(".productos-categoria");
			const contenedor = contenedores[contenedores.length - 1];
	
		
		productosFiltrados.forEach(p =>{
			hayResultados = true;
			let sinStock = p.stock <=0;
			let bajo = p.stock <= p.stockMin && !sinStock;
		
			let clase = sinStock ? "sin-stock" : bajo ? "stock-bajo":"";
			let textoStock = sinStock ? "SIN STOCK": `Stock: ${p.stock}`;

			contenedor.innerHTML +=`
				<div class="producto-card ${clase}">
				<div class="producto-info">
				<strong>${resaltarTexto(p.producto, textoBuscador)}</strong> (${resaltarTexto(p.variante, textoBuscador)}) <br> 
				$${p.precio} -- ${textoStock}
				</div>
				<div class="producto-buttons">
				<button class="vender" onclick="vender(${p.id})" ${sinStock ? "disabled" : ""}>
				🛒 Vender
				</button>
				<div class="menu-wrapper">
		<button class="menu-btn" onclick="toggleMenu(${p.id})">
			⁝
		</button>
		<div class="menu-opciones" id="menu-${p.id}">
			<button onclick="editarNombre(${p.id})">
				📝 Editar nombre
			</button>
			<button onclick="editarPrecio(${p.id})">
				💲 Editar precio
			</button>
			<button onclick="sumarStock(${p.id})">
				📦 Ajustar stock
			</button>
			<button onclick="borrarProducto(${p.id})">
				❌ Eliminar
			</button>
		</div>
	</div>
				`;
			});
		}

	const sinResultados = document.getElementById("sin-resultados");
		if(hayResultados){
			sinResultados.style.display = "none";
		}else{
			sinResultados.style.display = "block";
		}
	mostrarVentas();
}

function vender(id){
	const producto = productos.find(p => p.id === id);
	if(!producto  || producto.stock <= 0){
		alert(`No hay stock de ${producto?.producto}`);
		return;
	}

	producto.stock--;
	totalVentas += producto.precio;

	ventas.push({
		idProducto: producto.id,
		producto: producto.producto,
		variante: producto.variante,
		categoria: producto.categoria,
		precio: producto.precio,
		fecha: new Date().toISOString()
	});

	guardar();
	guardarVentas();
	guardarCaja();

	mostrar();
	mostrarCaja();
}

function editarNombre(id){
	const producto = productos.find(p => p.id === id);
	if (!producto) return;

	const nuevoNombre = prompt("Nuevo nombre del producto", producto.producto);
	if (!nuevoNombre) return;

	producto.producto = nuevoNombre.trim();
	guardar();
	mostrar();
}

function sumarStock(id){
	let prod = productos.find(p => p.id === id);
	let cantidad = prompt(`¿Cuánto stock entra para ${prod.producto} (${prod.variante})?`);
	
	if(cantidad === null)return;

	cantidad = Number(cantidad);

	if(cantidad > 0){
		prod.stock += cantidad;
		guardar();
		mostrar();
	}else{
		alert("Cantidad inválida");
	}
}

function borrarProducto(id){
	let prod = productos.find(p=>p.id === id);
	let ok = confirm(`¿Seguro que querés borrar "${prod.producto} (${prod.variante})"?`);

	if(!ok) return;

	productos = productos.filter(p => p.id !== id);
	guardar();
	mostrar();
}

function cerrarTurno(){
	document.getElementById("titulo-resumen") ?.scrollIntoView({ behavior: "smooth" });
	if(ventas.length === 0){
		alert("No hay ventas para cerrar el turno");
		return;
	}

	const esperado = cajaInicial + totalVentas;
	let real = prompt(`Caja esperada: $${esperado}\nCaja real:`);

	if(real === null) return;
	real = Number(real);

	const diferencia = real - esperado;

	let mensaje =
		`Resumen del turno\n\n` +
		`Caja inicial: $${cajaInicial}\n` +
		`Total vendido: $${totalVentas}\n` +
		`Caja esperada: $${esperado}\n` +
		`Caja real: $${real}\n\n`;

	if(diferencia === 0){
		mensaje += "Caja perfecta ✅";
	}else if(diferencia > 0){
		mensaje += `Sobra $${diferencia} ⚠️`;
	}else{
		mensaje +=` Falta $${Math.abs(diferencia)} ❌`;
	}

	alert(mensaje);

	mostrarResumenTurno();

	const resumenTurno = generarResumenTurno();

		const turno = {
			id: Date.now(),
			fecha: Date.now(),
			cajaInicial: resumenTurno.cajaInicial,
			totalVentas: resumenTurno.totalVentas,
			cajaEsperada: resumenTurno.cajaEsperada,
			resumen: resumenTurno.resumen,
			diferencia: diferencia
		};

		turnos.push(turno);
		guardarTurnos();

	
	cajaInicial = 0;
	totalVentas = 0;
	ventas = [];

	guardarCaja();
	guardarVentas();
	mostrarCaja();
	mostrarVentas();
}


mostrar();
mostrarCaja();

function toggleModo(){
	document.body.classList.toggle("dark");
	let btn = document.getElementById("btn-modo");

	if(document.body.classList.contains("dark")){
		localStorage.setItem("modo", "dark");
		btn.textContent = "☀ Modo claro";
	}else{
		localStorage.setItem("modo", "light");
		btn.textContent = "🌙 Modo Oscuro";
	}
}

	if(localStorage.getItem("modo") === "dark"){
		document.body.classList.add("dark");
	}

	let btn = document.getElementById("btn-modo");
	if(btn  && document.body.classList.contains("dark")){
		btn.textContent = "☀ Modo claro";
}

function toggleMenu(id){
	document.querySelectorAll(".menu-opciones").forEach(m => {
		if (m.id !== `menu-${id}`) {
			m.style.display = "none";
		}
	});

	const menu = document.getElementById(`menu-${id}`);
		menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function editarPrecio(id){
	const prod = productos.find(p => p.id === id);
	let nuevo = prompt(`Nuevo precio para ${prod.producto}:`, prod.precio);
	if(nuevo !== null){
		prod.precio = Number(nuevo);
		guardar();
		mostrar();
	}
}

const picker = document.getElementById("colorPicker");

const colorGuardado = localStorage.getItem("colorPrincipal");
	if(colorGuardado){
	document.documentElement.style.setProperty("--primary",colorGuardado);
		picker.value = colorGuardado;
	}

picker.addEventListener("input", ()=>{
	const color = picker.value;

document.documentElement.style.setProperty("--primary",color);
	localStorage.setItem("colorPrincipal",color);
});

function mostrarResumenTurno(){
	const contenedor = document.getElementById("resumen-turno");
	if (!contenedor) return;
	if (turnos.length === 0){
		contenedor.innerHTML = "<p>No hay turnos registrados.</p>";
		return;
	}

	const data = turnos[turnos.length - 1];

	let html =`
		<p><strong>Fecha</strong> ${new Date(data.fecha).toLocaleString()}</p>
		<p>Caja inicial: $${data.cajaInicial}</p>
		<p>Total vendido: $${data.totalVentas}</p>
		<p>Caja esperada: $${data.cajaEsperada}</p>
		<hr>
		`;

	for (let categoria in data.resumen){
		html +=`<h4>${categoria.toUpperCase()}</h4>`;

		for (let prod in data.resumen[categoria]){
			const p = data.resumen[categoria][prod];
			html +=`
				<p>
					${prod} x ${p.cantidad}
				<strong>($${p.total})</strong>
				</p>
			`;
		}
	}

	contenedor.innerHTML = html;
}

function exportarTurnoTXT(){
	if (ventas.length === 0){
		alert("No hay ventas para exportar");
		return;
	}

	const data = generarResumenTurno();

	let texto = "";
	texto += "RESUMEN DEL TURNO\n";
	texto += "=================\n\n";
	texto += `Fecha: ${data.fecha}\n`;
	texto += `Caja inicial: $${data.cajaInicial}\n`;
	texto += `Total vendido: $${data.totalVentas}\n`;
	texto += `Caja esperada: $${data.cajaEsperada}\n\n`;

	for (let categoria in data.resumen){
		texto += `${categoria.toUpperCase()}\n`;
		texto += "-----------------\n";

		for (let prod in data.resumen[categoria]){
			const p = data.resumen[categoria][prod];
			texto += `${prod} x ${p.cantidad} ($${p.total})\n`;
		}

	texto += "\n";
		}

	const blob = new Blob([texto], {type: "text/plain;charset=utf-8"});
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = `resumen_turno_${Date.now()}.text`;
	a.click();

	URL.revokeObjectURL(url);
}	

function cargarSelectorMes(){
	const selectMes = document.getElementById("mes");
	const selectAnio = document.getElementById("anio");

	if(!selectMes || !selectAnio) return;

		const meses = [
			"Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
		];

		selectMes.innerHTML = "";
		meses.forEach((m,i)=>{
			selectMes.innerHTML +=`<option value="${i}">${m}</option>`;
		});

		turnos = JSON.parse(localStorage.getItem("turnos")) || [];
		const anios = [...new Set(turnos.map(t => new Date(t.fecha).getFullYear()))];

		selectAnio.innerHTML = "";
		anios.forEach(a=>{
			selectAnio.innerHTML +=`<option value="${a}">${a}</option>`;
		});

		const hoy = new Date();
		selectMes.value = hoy.getMonth();
		selectAnio.value = hoy.getFullYear();
}

function mostrarResumenMensual(){
	const mes = Number(document.getElementById("mes").value);
	const anio = Number(document.getElementById("anio").value);

	const contenedor = document.getElementById("resumen-mensual");
	if(!contenedor) return;

	const filtrados = turnos.filter(t => {
		const f = new Date(t.fecha);
		return f.getMonth() === mes && f.getFullYear() === anio;
	});

	if(filtrados.length === 0){
		contenedor.innerHTML = "<p>No hay turnos en este período.</p>";
	return;
	}

	let totalGeneral = 0;
	let resumen = {};

	filtrados.forEach(t => { 
	totalGeneral += t.totalVentas;

	for(let categoria in t.resumen){
		if(!resumen[categoria]){
			resumen[categoria] = {};
		}
	for(let prod in t.resumen[categoria]){
		const p = t.resumen[categoria][prod];

		if(!resumen[categoria][prod]){
			resumen[categoria][prod] = { cantidad: 0, total: 0 };
		}

	resumen[categoria][prod].cantidad += p.cantidad;
		resumen[categoria][prod].total += p.total;
			}
		}
	});

	const promedio = Math.round(totalGeneral / filtrados.length);

	let html =`
	<h3>Resumen mensual</h3>
	<p><strong>Mes:</strong> ${mes + 1}/${anio}</p>
	<p>Turnos: ${filtrados.length}</p>
	<p>Total vendido: $${totalGeneral}</p>
	<p>Promedio por turno: $${promedio}</p>
	<hr>
	`;
	
	for(let categoria in resumen){
		html += `<h4>${categoria.toUpperCase()}</h4>`;

	for(let prod in resumen[categoria]){
		const p = resumen[categoria][prod];
		html +=`
			<p>
				${prod} x ${p.cantidad}
			<strong>($${p.total})</strong>
			</p>
		`;
		}
	}

	contenedor.innerHTML = html; 
}

function exportarResumenMensualTXT(){
	const mes = Number(document.getElementById("mes").value);
	const anio = Number(document.getElementById("anio").value);

	const filtrados = turnos.filter(t => {
		const f = new Date(t.fecha);
		return f.getMonth() === mes && f.getFullYear() === anio;
	});

	if(filtrados.length === 0){
		alert("No hay datos para exportar este mes");
		return;
	}

	let resumen = {};
	let totalGeneral = 0;

	filtrados.forEach(t =>{
		totalGeneral += t.totalVentas;

		for(let categoria in t.resumen){
			if(!resumen[categoria]) resumen[categoria] = {};

		for(let prod in t.resumen[categoria]){
			const p = t.resumen[categoria][prod];

			if(!resumen[categoria][prod]){
				resumen[categoria][prod] = {cantidad: 0, total: 0 };
		}

		resumen[categoria][prod].cantidad += p.cantidad;
			resumen[categoria][prod].total += p.total;
			}
		}
	});

	let texto = "";
	texto += "RESUMEN MENSUAL\n";
	texto += "====================\n\n";
	texto += `Mes: ${mes + 1}/${anio}\n`;
	texto += `Total vendido: $${totalGeneral}\n\n`;

	for(let categoria in resumen){
		texto += `${categoria.toUpperCase()}\n`;
		texto += "------------------\n";

		for(let prod in resumen[categoria]){
			const p = resumen[categoria][prod];
			texto += `${prod} x ${p.cantidad} ($${p.total})\n`;
		}
		texto += "\n";
	}

	const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = `resumen_mensual_${anio}_${mes+1}.txt`;
	a.click();

	URL.revokeObjectURL(url);
}

function obtenerSemana(fecha){
	const f = new Date(fecha);
	const inicio = new Date(f.getFullYear(), 0, 1);
	const dias = Math.floor((f - inicio) / 86400000);
	return Math.ceil((dias + inicio.getDay() + 1) / 7);
}

function obtenerRangoSemana(anio, semana){
	const inicio = new Date(anio, 0, 1 + (semana - 1) * 7);
	const dia = inicio.getDay();
	const lunes = new Date(inicio);
	lunes.setDate(inicio.getDate() - dia + (dia === 0 ? -6 : 1));

	const domingo = new Date(lunes);
	domingo.setDate(lunes.getDate() + 6);

	return { lunes, domingo };
}

function cargarSelectorSemana(){
	const selectSemana = document.getElementById("semana");
	const selectAnio = document.getElementById("anio-semana");

	if(!selectSemana || !selectAnio) return;

	turnos = JSON.parse(localStorage.getItem("turnos")) || [];

	const anios = [...new Set(turnos.map(t => new Date(t.fecha).getFullYear()))];
	selectAnio.innerHTML = "";

	anios.forEach(a=>{
		selectAnio.innerHTML += `<option value="${a}">${a}</option>`;
	});

	selectSemana.innerHTML = "";
	for(let i = 1; i <= 53; i++){
		const rango = obtenerRangoSemana(selectAnio.value || new Date().getFullYear(), i);

		const texto = `
			${rango.lunes.toLocaleDateString()} al ${rango.domingo.toLocaleDateString()}
		`;

		selectSemana.innerHTML += `<option value="${i}">${texto}</option>`;
	}
}

function mostrarResumenSemanal(){
	const semana = Number(document.getElementById("semana").value);
	const anio = Number(document.getElementById("anio-semana").value);

	const contenedor = document.getElementById("resumen-semanal");
		if(!contenedor) return;

	const filtrados = turnos.filter(t => {
		const f = new Date(t.fecha);
		return obtenerSemana(f) === semana && f.getFullYear() === anio;
	});

	if(filtrados.length === 0){
		contenedor.innerHTML = "<p>No hay turnos en esta semana.</p>";
		return;
	}

	let resumen = {};
	let totalGeneral = 0;

	filtrados.forEach(t => {
		totalGeneral += t.totalVentas;

		for(let categoria in t.resumen){
			if(!resumen[categoria]) resumen[categoria] = {};

		for(let prod in t.resumen[categoria]){
			const p = t.resumen[categoria][prod];

			if(!resumen[categoria][prod]){
				resumen[categoria][prod] = { cantidad: 0, total: 0 };
			}

		resumen[categoria][prod].cantidad += p.cantidad;
		resumen[categoria][prod].total += p.total;
			}
		}
	});

	const rango = obtenerRangoSemana(anio, semana);

	let html = `
		<h3>Resumen semanal</h3>
		<p><strong>Período:</strong> ${rango.lunes.toLocaleDateString()} al ${rango.domingo.toLocaleDateString()}</p>
		<p><strong>Total vendido:</strong> $${totalGeneral}</p>
		<hr>
	`;

	for(let categoria in resumen){
		html +=  `<h4>${categoria.toUpperCase()}</h4>`;

		for(let prod in resumen[categoria]){
			const p = resumen[categoria][prod];
			html += `
				<p>${prod} x ${p.cantidad}<strong>($${p.total})</strong></p>
			`;
		}
	}

	contenedor.innerHTML = html;
}

function exportarResumenSemanalPDF(){
	const semana = Number(document.getElementById("semana").value);
	const anio = Number(document.getElementById("anio-semana").value);

	const rango = obtenerRangoSemana(anio, semana);

	let total = 0;
	let detalle = {};

	turnos.forEach(t => {
		const f = new Date(t.fecha);
		if(f.getFullYear() === anio && obtenerSemana(f) === semana){
			total += t.totalVentas;

		for(let cat in t.resumen){
			if(!detalle[cat]) detalle[cat] = {};

		for(let prod in t.resumen[cat]){
			if(!detalle[cat][prod]){
				detalle[cat][prod] = { cantidad: 0, total: 0};
			}
				detalle[cat][prod].cantidad += t.resumen[cat][prod].cantidad;
				detalle[cat][prod].total += t.resumen[cat][prod].total;
				}
			}
		}
	});

	let html = `
	<h1>Resumen semanal</h1>
	<p><strong>Período:</strong> ${rango.lunes.toLocaleDateString()} al ${rango.domingo.toLocaleDateString()}</p>
	<p><strong>Total vendido:</strong> $${total}</p>
	<hr>
	`;

	for (let cat in detalle){
		html += `<h2>${cat.toUpperCase()}</h2>`;
		for (let prod in detalle[cat]){
			const p = detalle[cat][prod];
			html += `<p>${prod} x ${p.cantidad} -- $${p.total}</p>`;
		}
	}

	const ventana = window.open("", "_blank");
	ventana.document.write(`
		<!DOCTYPE html>
		<html>
		<head>
			<title>Resumen semanal</title>
			<style>
			body { 
				font-family: Arial, sans-serif; 
				padding: 30px;
				font-size: 14px;
			}
			h1 {
				font-size: 24px;
				margin-bottom: 10px;
			}
			h2 {
				margin-top: 20px;
				font-size: 18px;
				border-bottom: 1px solid #ccc;
			}
			p {
				margin: 4px 0;
			}
			hr {
				margin: 15px 0;
			}
			</style>
		</head>
		<body>
			${html}
		</body>
		</html>
	`);

	ventana.document.close();

	setTimeout(() => {
		ventana.print();
	}, 500);
}

function exportarResumenSemanalTXT(){
	const anio = Number(document.getElementById("anio-semana").value);
	const semana = Number(document.getElementById("semana").value);

	const filtrados = turnos.filter(t => {
		const f = new Date(t.fecha);
		return obtenerSemana(f) === semana && f.getFullYear() === anio;
	});

	if(filtrados.length === 0){
		alert("No hay turnos en esta semana");
		return;
	}

	let resumen = {};
	let totalGeneral = 0;

	filtrados.forEach(t => {
		totalGeneral += t.totalVentas;

		for(let categoria in t.resumen){
			if(!resumen[categoria]) resumen[categoria] = {};

		for(let prod in t.resumen[categoria]){
			const p = t.resumen[categoria][prod];

			if(!resumen[categoria][prod]){
				resumen[categoria][prod] = {cantidad: 0, total: 0 };
			}

			resumen[categoria][prod].cantidad += p.cantidad;
			resumen[categoria][prod].total += p.total;
			}
		}
	});

	const rango = obtenerRangoSemana(anio, semana);

	let texto = "";
	texto += "RESUMEN SEMANAL\n";
	texto += "============================\n\n";
	texto += `Año: ${anio}\n`;
	texto += `Semana: ${semana}\n`;
	texto += `Período: ${rango.lunes.toLocaleDateString()} al ${rango.domingo.toLocaleDateString()}\n\n`;

	for(let categoria in resumen){
		texto += `${categoria.toUpperCase()}\n`;
		texto += "----------------------\n";

		for(let prod in resumen[categoria]){
			const p = resumen[categoria][prod];
			texto += `${prod} x ${p.cantidad} ($${p.total})\n`;
		}
	texto += "\n";
	}

	texto += `TOTAL SEMANAL: $${totalGeneral}\n`;

	const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = `resumen_semanal_${anio}_semana_${semana}.txt`;
	a.click();

	URL.revokeObjectURL(url);
}


function exportarResumenMensualPDF(){
	const mes = Number(document.getElementById("mes").value);
	const anio = Number(document.getElementById("anio").value);

	const rango = obtenerRangoSemana(anio, mes + 1);

	let total = 0;
	let detalle = {};

	turnos.forEach(t => {
		const f = new Date(t.fecha);
		if(f.getFullYear() === anio && f.getMonth() === mes){
			total += t.totalVentas;

		for(let cat in t.resumen){
			if(!detalle[cat]) detalle[cat] = {};

		for(let prod in t.resumen[cat]){
			if(!detalle[cat][prod]){
				detalle[cat][prod] = { cantidad: 0, total: 0};
			}
				detalle[cat][prod].cantidad += t.resumen[cat][prod].cantidad;
				detalle[cat][prod].total += t.resumen[cat][prod].total;
				}
			}
		}
	});

	const nombreMes = new Date(anio, mes).toLocaleString("es-AR", { month: "long" });

	let html = `
	<h1>Resumen mensual</h1>
	<p><strong>Mes:</strong> ${nombreMes} ${anio}</p>
	<p><strong>Total vendido:</strong> $${total}</p>
	<hr>
	`;

	for (let cat in detalle){
		html += `<h2>${cat.toUpperCase()}</h2>`;
		for (let prod in detalle[cat]){
			const p = detalle[cat][prod];
			html += `<p>${prod} x ${p.cantidad} -- $${p.total}</p>`;
		}
	}

	const ventana = window.open("", "_blank");
	ventana.document.write(`
		<!DOCTYPE html>
		<html>
		<head>
			<title>Resumen mensual</title>
			<style>
			body { 
				font-family: Arial, sans-serif; 
				padding: 30px;
				font-size: 14px;
			}
			h1 {
				font-size: 24px;
				margin-bottom: 10px;
			}
			h2 {
				margin-top: 20px;
				font-size: 18px;
				border-bottom: 1px solid #ccc;
			}
			p {
				margin: 4px 0;
			}
			hr {
				margin: 15px 0;
			}
			</style>
		</head>
		<body>
			${html}
		</body>
		</html>
	`);

	ventana.document.close();

	setTimeout(() => {
		ventana.print();
	}, 500);
}

document.addEventListener("click", e => {
	if(!e.target.closest(".menu-wrapper")){

		document.querySelectorAll(".menu-opciones").forEach(m => {
			m.style.display = "none";
		});
	}
});
	
cargarSelectorSemana();
cargarSelectorMes();