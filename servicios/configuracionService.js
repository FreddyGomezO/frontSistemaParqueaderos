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
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
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
  try {
    // 1. Preparar datos - asegurar que números sean floats
    const datosPreparados = {};
    
    // Campos numéricos
    const camposNumericos = [
      'precio_media_hora', 
      'precio_hora_adicional', 
      'precio_nocturno'
    ];
    
    // Campos de texto/hora
    const camposTexto = [
      'hora_inicio_nocturno', 
      'hora_fin_nocturno'
    ];
    
    // Procesar campos numéricos
    camposNumericos.forEach(campo => {
      if (datos[campo] !== undefined && datos[campo] !== null) {
        // Convertir comas a puntos y luego a número
        const valor = datos[campo];
        let valorNum = valor;
        
        if (typeof valor === 'string') {
          // Reemplazar comas por puntos
          valorNum = parseFloat(valor.replace(',', '.'));
        } else if (typeof valor === 'number') {
          valorNum = valor;
        }
        
        datosPreparados[campo] = valorNum;
        console.log(`Campo ${campo}: ${valor} -> ${valorNum}`);
      }
    });
    
    // ==============================================
    // 🔍 NUEVO: DEBUG PROFUNDO y LIMPIEZA DE HORAS
    // ==============================================
    console.log("🔍 DEBUG - ANTES de procesar horas:");
    console.log("hora_fin_nocturno crudo:", datos.hora_fin_nocturno);
    console.log("Tipo:", typeof datos.hora_fin_nocturno);
    
    // Procesar campos de texto/hora CON LIMPIEZA
    camposTexto.forEach(campo => {
      if (datos[campo] !== undefined && datos[campo] !== null) {
        let valor = datos[campo];
        
        console.log(`\n🔄 Procesando ${campo}:`);
        console.log(`  Valor original: "${valor}"`);
        
        if (typeof valor === 'string') {
          // 1. Eliminar TODOS los espacios
          valor = valor.replace(/\s+/g, '');
          console.log(`  Sin espacios: "${valor}"`);
          
          // 2. Eliminar segundos si existen (HH:MM:SS → HH:MM)
          if (valor.includes(':')) {
            const partes = valor.split(':');
            if (partes.length >= 2) {
              // Tomar solo HH y MM, ignorar SS
              valor = `${partes[0]}:${partes[1]}`;
              console.log(`  Sin segundos: "${valor}"`);
            }
          }
          
          // 3. Asegurar que hora y minutos tengan 2 dígitos
          const [horaStr, minutoStr] = valor.split(':');
          if (horaStr && minutoStr) {
            const hora = horaStr.padStart(2, '0');
            const minuto = minutoStr.padStart(2, '0');
            valor = `${hora}:${minuto}`;
            console.log(`  Con 2 dígitos: "${valor}"`);
          }
          
          // 4. Validación final con regex estricta
          const regex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
          if (!regex.test(valor)) {
            console.error(`❌ ${campo} tiene formato inválido después de limpiar: "${valor}"`);
            console.log(`  ¿Contiene ':'? ${valor.includes(':')}`);
            console.log(`  Longitud: ${valor.length}`);
            console.log(`  Caracteres:`, valor.split('').map((c, i) => `${i}:'${c}'(${c.charCodeAt(0)})`).join(', '));
            
            // Si es inválido, poner null para que falle claramente
            valor = null;
          } else {
            console.log(`✅ ${campo} validado correctamente: "${valor}"`);
          }
        }
        
        datosPreparados[campo] = valor;
      }
    });
    
    console.log("\n📤 Datos preparados para enviar:", datosPreparados);
    
    // ==============================================
    // 🔍 DEBUG EXTRA: Verificar EXACTAMENTE qué se envía
    // ==============================================
    console.log("\n🔍 DEBUG FINAL - Body que se enviará:");
    console.log("hora_fin_nocturno final:", datosPreparados.hora_fin_nocturno);
    console.log("JSON.stringify:", JSON.stringify(datosPreparados));
    
    // 2. Enviar la petición
    const response = await fetch(`${CONFIGURACION_URL}/`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datosPreparados),
    });
    
    console.log("📨 Estado de respuesta:", response.status);
    
    // 3. Manejar la respuesta
    const responseData = await response.json();
    console.log("📥 Respuesta del backend:", responseData);
    
    if (!response.ok) {
      // Manejo detallado de errores
      let mensajeError = "Error al actualizar la configuración";
      
      if (responseData.detail) {
        // Si el error viene de FastAPI Pydantic validation
        if (Array.isArray(responseData.detail)) {
          // Formato de validación de campos
          const errores = responseData.detail.map(err => 
            `${err.loc?.join('.')}: ${err.msg}`
          ).join(', ');
          mensajeError = `Errores de validación: ${errores}`;
        } else if (typeof responseData.detail === 'string') {
          mensajeError = responseData.detail;
        } else if (responseData.detail.message) {
          mensajeError = responseData.detail.message;
        }
      }
      
      console.error("❌ Error en actualizarConfiguracion:", {
        status: response.status,
        data: responseData,
        mensaje: mensajeError
      });
      
      return {
        ok: false,
        status: response.status,
        message: mensajeError,
        errors: responseData.detail || null
      };
    }
    
    return {
      ok: true,
      data: responseData,
    };
    
  } catch (error) {
    console.error("❌ Error crítico en actualizarConfiguracion:", error);
    return {
      ok: false,
      message: error.message || "Error de conexión con el servidor",
      error: error
    };
  }
}

// ============================
// 🔧 Helper: Validar formato de hora HH:MM
// ============================
export function validarFormatoHora(hora) {
  if (!hora) return false;
  
  // Primero limpiar como en la función principal
  let valor = hora.toString().trim();
  valor = valor.replace(/\s+/g, '');
  
  if (valor.includes(':')) {
    const partes = valor.split(':');
    if (partes.length >= 2) {
      valor = `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}`;
    }
  }
  
  const regex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(valor);
}

// ============================
// 🔧 Helper: Validar precio mayor a 0
// ============================
export function validarPrecio(precio) {
  if (precio === undefined || precio === null) return false;
  
  let precioNum;
  if (typeof precio === 'string') {
    // Convertir comas a puntos
    precioNum = parseFloat(precio.replace(',', '.'));
  } else {
    precioNum = parseFloat(precio);
  }
  
  return !isNaN(precioNum) && precioNum >= 0;
}