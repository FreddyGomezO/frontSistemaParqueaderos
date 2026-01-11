// src/servicios/vehiculoService.js
import { BASE_URL } from "./api";

const VEHICULO_URL = `${BASE_URL}/api/vehiculos`;

// ============================
// 📌 Obtener estado de los 15 espacios
// ============================
export async function obtenerEspacios() {
  try {
    const response = await fetch(`${VEHICULO_URL}/espacios`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Error al obtener los espacios");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error en obtenerEspacios:", error);
    throw error;
  }
}

// ============================
// 📌 Registrar entrada de un vehículo
// ============================
export async function registrarEntrada(placa, espacioNumero) {
  const response = await fetch(`${VEHICULO_URL}/entrada`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      placa: placa.toUpperCase().trim(),
      espacio_numero: espacioNumero,
    }),
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {}

    return {
      ok: false,
      message: errorData.detail || "Error al registrar la entrada",
    };
  }

  const data = await response.json();

  return {
    ok: true,
    data,
  };
}

// ============================
// 📌 Registrar salida de un vehículo
// ============================
export async function registrarSalida(placa) {
  const response = await fetch(`${VEHICULO_URL}/salida`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      placa: placa.toUpperCase().trim(),
    }),
  });

  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {}

    return {
      ok: false,
      message: errorData.detail || "Error al registrar la salida",
    };
  }

  const data = await response.json();

  return {
    ok: true,
    data,
  };
}

// ============================
// 📌 Buscar vehículo por placa
// ============================
export async function buscarVehiculo(placa) {
  try {
    const placaFormatted = placa.toUpperCase().trim();
    const url = `${VEHICULO_URL}/buscar/${placaFormatted}`;
    
    console.log("🔍 Buscando vehículo:", url);
    
    // Crear un timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log("📡 Respuesta status:", response.status);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {}

      throw new Error(errorData.detail || "Vehículo no encontrado");
    }

    const data = await response.json();
    console.log("✅ Datos recibidos:", data);
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("⏱️ Timeout: El servidor no respondió a tiempo");
      throw new Error("El servidor no responde. Verifica que el backend esté corriendo.");
    }
    console.error("❌ Error en buscarVehiculo:", error);
    throw error;
  }
}

// ============================
// 📌 Obtener historial de facturas
// ============================
export async function obtenerHistorial(fecha = null, limite = 50) {
  try {
    let url = `${VEHICULO_URL}/historial?limite=${limite}`;
    
    if (fecha) {
      url += `&fecha=${fecha}`;
    }

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Error al obtener el historial");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error en obtenerHistorial:", error);
    throw error;
  }
}

// ============================
// 📌 Health check del servicio
// ============================
export async function healthCheck() {
  try {
    const response = await fetch(`${VEHICULO_URL}/health`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Servicio no disponible");
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Error en healthCheck:", error);
    throw error;
  }
}