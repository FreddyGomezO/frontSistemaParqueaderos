// src/servicios/configuracionService.js
import { BASE_URL } from "./api";

const CONFIGURACION_URL = `${BASE_URL}/api/configuracion`;

// ============================
// 📌 Obtener configuración actual
// ============================
export async function obtenerConfiguracion() {
  try {
    const response = await fetch(`${CONFIGURACION_URL}/`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Error al obtener la configuración");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error en obtenerConfiguracion:", error);
    throw error;
  }
}

// ============================
// 📌 Actualizar configuración de precios
// ============================
export async function actualizarConfiguracion(datos) {
  // Filtrar solo los campos que no sean null/undefined
  const datosLimpios = Object.entries(datos).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {});

  const response = await fetch(`${CONFIGURACION_URL}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datosLimpios),
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {}

    return {
      ok: false,
      message: errorData.detail || "Error al actualizar la configuración",
    };
  }

  const data = await response.json();

  return {
    ok: true,
    data,
  };
}

// ============================
// 🔧 Helper: Validar formato de hora HH:MM
// ============================
export function validarFormatoHora(hora) {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(hora);
}

// ============================
// 🔧 Helper: Validar precio mayor a 0
// ============================
export function validarPrecio(precio) {
  const precioNum = parseFloat(precio);
  return !isNaN(precioNum) && precioNum >= 0;
}