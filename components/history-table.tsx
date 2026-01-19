"use client"

import { useState } from "react"
import useSWR from "swr"
import { obtenerHistorial } from "@/servicios/vehiculoService"
import { obtenerReporteDiario } from "@/servicios/reporteService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { History, Calendar, Moon, Sun, Printer, DollarSign, Car, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface FacturaHistorial {
  id: number
  vehiculo_id: number
  placa: string
  espacio_numero: number
  fecha_hora_entrada: string
  fecha_hora_salida: string
  tiempo_total_minutos: number
  costo_total: number
  detalles_cobro: string
  fecha_generacion: string
  es_nocturno: boolean
}

interface ReporteDiario {
  fecha: string
  total_vehiculos: number
  vehiculos_nocturnos: number
  vehiculos_normales: number
  ingresos_total: number
  ingresos_nocturnos: number
  ingresos_normales: number
  detalle?: FacturaHistorial[]
}

interface TotalesCalculados {
  total: number
  nocturnos: number
  normales: number
  totalNocturnos: number
  totalNormales: number
}

export function HistoryTable() {
  const [fecha, setFecha] = useState("")
  const [mes, setMes] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState<"dia" | "mes">("dia")
  const [generandoReporte, setGenerandoReporte] = useState(false)

  // Obtener historial - se actualiza automáticamente cuando cambian fecha o mes
  const { data, error, isLoading } = useSWR(
    ["historial", tipoFiltro === "dia" ? fecha : mes, tipoFiltro],
    async () => {
      // @ts-ignore
      const todos = await obtenerHistorial(null, 1000)

      console.log("Datos recibidos:", todos)

      // Extraer el array de facturas
      let todasFacturas = []
      if (todos?.success && todos.data) {
        todasFacturas = todos.data
      } else if (Array.isArray(todos)) {
        todasFacturas = todos
      } else {
        return todos
      }

      console.log("Total facturas:", todasFacturas.length)

      if (tipoFiltro === "dia" && fecha) {
        // Filtrar por día - comparar solo la fecha sin hora
        const fechaSeleccionada = new Date(fecha + "T00:00:00")
        const facturasFiltradas = todasFacturas.filter((factura: FacturaHistorial) => {
          // Usar fecha_hora_salida en lugar de fecha_generacion para evitar problemas de zona horaria
          const fechaFactura = new Date(factura.fecha_hora_salida)
          const coincide = fechaFactura.getFullYear() === fechaSeleccionada.getFullYear() &&
            fechaFactura.getMonth() === fechaSeleccionada.getMonth() &&
            fechaFactura.getDate() === fechaSeleccionada.getDate()

          console.log(`Factura ${factura.placa}:`, {
            fecha_hora_salida: factura.fecha_hora_salida,
            fechaFactura: fechaFactura.toLocaleDateString(),
            fechaSeleccionada: fechaSeleccionada.toLocaleDateString(),
            coincide
          })

          return coincide
        })

        console.log("Facturas filtradas:", facturasFiltradas.length)
        return facturasFiltradas
      } else if (tipoFiltro === "mes" && mes) {
        // Filtrar por mes
        const [anio, mesNum] = mes.split("-")
        const facturasFiltradas = todasFacturas.filter((factura: FacturaHistorial) => {
          // Usar fecha_hora_salida para consistencia
          const fechaFactura = new Date(factura.fecha_hora_salida)
          return fechaFactura.getFullYear() === parseInt(anio) &&
            (fechaFactura.getMonth() + 1) === parseInt(mesNum)
        })
        return facturasFiltradas
      }

      return todasFacturas
    },
    {
      refreshInterval: 30000,
    }
  )

  const filtrarPorMes = (facturas: FacturaHistorial[], mesAnio: string) => {
    const [anio, mes] = mesAnio.split("-")
    return facturas.filter(factura => {
      // Usar fecha_generacion que es cuando se generó la factura (salida)
      const fechaFactura = new Date(factura.fecha_generacion)
      return fechaFactura.getFullYear() === parseInt(anio) &&
        (fechaFactura.getMonth() + 1) === parseInt(mes)
    })
  }

  const handleLimpiar = () => {
    setFecha("")
    setMes("")
  }

  const handleImprimirReporte = async () => {
    if (!facturas || facturas.length === 0) {
      toast.error("No hay datos para imprimir")
      return
    }

    setGenerandoReporte(true)

    try {
      let reporte: ReporteDiario | null = null
      let facturasParaReporte: FacturaHistorial[] = []

      if (tipoFiltro === "dia" && fecha) {
        try {
          // @ts-ignore
          const resultado = await obtenerReporteDiario(fecha)
          console.log("Resultado reporte diario:", resultado)
          if (resultado.success) {
            reporte = resultado.data
            facturasParaReporte = reporte?.detalle || []
          } else {
            // Si el endpoint falla, usar los datos actuales
            console.log("Endpoint falló, usando datos actuales")
            facturasParaReporte = facturas
            const vehiculosNocturnos = facturas.filter(f => f.es_nocturno).length
            const vehiculosNormales = facturas.filter(f => !f.es_nocturno).length
            const ingresosNocturnos = facturas.filter(f => f.es_nocturno).reduce((sum, f) => sum + f.costo_total, 0)
            const ingresosNormales = facturas.filter(f => !f.es_nocturno).reduce((sum, f) => sum + f.costo_total, 0)

            reporte = {
              fecha: new Date(fecha).toLocaleDateString("es-EC"),
              total_vehiculos: facturas.length,
              vehiculos_nocturnos: vehiculosNocturnos,
              vehiculos_normales: vehiculosNormales,
              ingresos_total: ingresosNocturnos + ingresosNormales,
              ingresos_nocturnos: ingresosNocturnos,
              ingresos_normales: ingresosNormales
            }
          }
        } catch (error) {
          console.error("Error obteniendo reporte diario:", error)
          // Usar datos actuales como fallback
          facturasParaReporte = facturas
          const vehiculosNocturnos = facturas.filter(f => f.es_nocturno).length
          const vehiculosNormales = facturas.filter(f => !f.es_nocturno).length
          const ingresosNocturnos = facturas.filter(f => f.es_nocturno).reduce((sum, f) => sum + f.costo_total, 0)
          const ingresosNormales = facturas.filter(f => !f.es_nocturno).reduce((sum, f) => sum + f.costo_total, 0)

          reporte = {
            fecha: new Date(fecha).toLocaleDateString("es-EC"),
            total_vehiculos: facturas.length,
            vehiculos_nocturnos: vehiculosNocturnos,
            vehiculos_normales: vehiculosNormales,
            ingresos_total: ingresosNocturnos + ingresosNormales,
            ingresos_nocturnos: ingresosNocturnos,
            ingresos_normales: ingresosNormales
          }
        }
      } else if (tipoFiltro === "mes" && mes) {
        const [anio, mesNum] = mes.split("-")

        let vehiculosNocturnos = 0
        let vehiculosNormales = 0
        let ingresosNocturnos = 0
        let ingresosNormales = 0

        facturasParaReporte = facturas || []

        facturasParaReporte.forEach(factura => {
          if (factura.es_nocturno) {
            vehiculosNocturnos++
            ingresosNocturnos += factura.costo_total
          } else {
            vehiculosNormales++
            ingresosNormales += factura.costo_total
          }
        })

        reporte = {
          fecha: `${mesNum}/${anio}`,
          total_vehiculos: facturasParaReporte.length,
          vehiculos_nocturnos: vehiculosNocturnos,
          vehiculos_normales: vehiculosNormales,
          ingresos_total: ingresosNocturnos + ingresosNormales,
          ingresos_nocturnos: ingresosNocturnos,
          ingresos_normales: ingresosNormales
        }
      } else {
        // Sin filtro - todo el historial
        let vehiculosNocturnos = 0
        let vehiculosNormales = 0
        let ingresosNocturnos = 0
        let ingresosNormales = 0

        facturasParaReporte = facturas || []

        facturasParaReporte.forEach(factura => {
          if (factura.es_nocturno) {
            vehiculosNocturnos++
            ingresosNocturnos += factura.costo_total
          } else {
            vehiculosNormales++
            ingresosNormales += factura.costo_total
          }
        })

        reporte = {
          fecha: "Todo el historial",
          total_vehiculos: facturasParaReporte.length,
          vehiculos_nocturnos: vehiculosNocturnos,
          vehiculos_normales: vehiculosNormales,
          ingresos_total: ingresosNocturnos + ingresosNormales,
          ingresos_nocturnos: ingresosNocturnos,
          ingresos_normales: ingresosNormales
        }
      }

      if (!reporte) {
        toast.error("No se pudo generar el reporte")
        return
      }

      imprimirReporte(reporte, facturasParaReporte)

      toast.success("Reporte generado para imprimir", {
        description: "Se abrirá la ventana de impresión",
        icon: <Printer className="h-4 w-4" />,
      })
    } catch (error) {
      console.error("Error generando reporte:", error)
      toast.error("Error al generar reporte", {
        description: "Verifique la conexión con el servidor",
      })
    } finally {
      setGenerandoReporte(false)
    }
  }

  const imprimirReporte = (reporte: ReporteDiario, facturas: FacturaHistorial[]) => {
    const printWindow = window.open("", "_blank", "width=72mm,height=600")
    if (!printWindow) {
      toast.error("No se pudo abrir ventana de impresión")
      return
    }

    let fechaFormateada = reporte.fecha
    if (tipoFiltro === "dia" && fecha) {
      fechaFormateada = new Date(fecha).toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      })
    }

    printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Parqueadero</title>
        <style>
          /* RESET COMPLETO - IMPORTANTE PARA IMPRESORAS TÉRMICAS */
          * {
            margin: 0 !important;
            padding: 0 !important;
            box-sizing: border-box !important;
            line-height: 1 !important;
            font-family: 'Arial Narrow', 'Courier New', monospace !important;
          }
          
          /* ELIMINAR TODOS LOS MÁRGENES DE IMPRESIÓN */
          @page {
            size: 72mm auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          html, body {
            width: 72mm !important;
            max-width: 72mm !important;
            min-width: 72mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .ticket {
            width: 70mm !important;  /* Dejar 1mm de margen cada lado */
            max-width: 70mm !important;
            margin: 0 auto !important;
            padding: 1mm !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          
          .logo {
            text-align: center !important;
            margin-bottom: 2mm !important;
          }
          
          .logo img {
            max-width: 50mm !important;
            height: auto !important;
            margin: 0 auto !important;
          }
          
          .title {
            font-size: 12px !important;
            font-weight: bold !important;
            text-align: center !important;
            text-transform: uppercase !important;
            margin: 2mm 0 !important;
          }
          
          .subtitle {
            font-size: 10px !important;
            text-align: center !important;
            margin: 1mm 0 3mm 0 !important;
          }
          
          /* LÍNEA DIVISORIA */
          hr {
            border: none !important;
            border-top: 1px dashed #000 !important;
            margin: 3mm 0 !important;
          }
          
          /* TABLA AJUSTADA AL TICKET */
          .table-container {
            width: 100% !important;
            overflow: hidden !important;
          }
          
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            font-size: 10px !important;
          }
          
          td {
            padding: 0 !important;
            word-break: break-all !important;
            overflow: hidden !important;
          }
          
          .placa-col {
            width: 45% !important;
            max-width: 45% !important;
          }
          
          .valor-col {
            width: 55% !important;
            max-width: 55% !important;
            text-align: right !important;
          }
          
          .header-row {
            font-weight: bold !important;
            border-bottom: 1px solid #000 !important;
            padding-bottom: 1mm !important;
          }
          
          /* TOTAL */
          .total {
            font-size: 11px !important;
            font-weight: bold !important;
            border-top: 1px solid #000 !important;
            padding-top: 2mm !important;
            margin-top: 2mm !important;
          }
          
          .total td {
            padding-top: 1mm !important;
          }
          
          /* RESUMEN */
          .summary {
            font-size: 10px !important;
            margin: 2mm 0 !important;
          }
          
          .summary div {
            margin: 1mm 0 !important;
          }
          
          /* FOOTER */
          .footer {
            font-size: 9px !important;
            color: #666 !important;
            text-align: center !important;
            margin-top: 3mm !important;
            padding-top: 2mm !important;
            border-top: 1px dashed #000 !important;
          }
          
          /* PARA FORZAR EL ANCHO EN TODOS LOS NAVEGADORES */
          @media print {
            html, body {
              width: 72mm !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .ticket {
              width: 70mm !important;
              transform: none !important;
            }
            
            /* OCULTAR TODO EXCEPTO EL CONTENIDO DEL TICKET */
            body * {
              visibility: hidden;
            }
            .ticket, .ticket * {
              visibility: visible;
            }
            .ticket {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="logo">
            <img src="${window.location.origin}/42dd1c4b-77e6-48fa-b3c1-df5bfd43fee7.png" alt="Hotel Gran Plaza">
          </div>
          
          <div class="title">REPORTE DE PARQUEADERO</div>
          <div class="subtitle">${tipoFiltro === "dia" ? "Fecha" : "Mes"}: ${fechaFormateada}</div>
          
          <hr>
          
          <div class="table-container">
            <table>
              <tr class="header-row">
                <td class="placa-col">Placa</td>
                <td class="valor-col">Valor</td>
              </tr>
              ${facturas.map(factura => `
                <tr>
                  <td class="placa-col">${factura.placa}</td>
                  <td class="valor-col">$${factura.costo_total.toFixed(2)}</td>
                </tr>
              `).join("")}
            </table>
          </div>
          
          <hr>
          
          <div class="table-container">
            <table class="total">
              <tr>
                <td class="placa-col">TOTAL:</td>
                <td class="valor-col">$${reporte.ingresos_total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div class="summary">
            <div><strong>Total Vehículos:</strong> ${reporte.total_vehiculos}</div>
            <div><strong>Nocturnos:</strong> ${reporte.vehiculos_nocturnos} ($${reporte.ingresos_nocturnos.toFixed(2)})</div>
            <div><strong>Normales:</strong> ${reporte.vehiculos_normales} ($${reporte.ingresos_normales.toFixed(2)})</div>
          </div>
          
          <hr>
          
          <div class="footer">
            Generado: ${new Date().toLocaleString("es-EC")}<br>
            Sistema de Parqueadero<br>
            Hotel Gran Plaza
          </div>
        </div>
        
        <script>
          // FORZAR AJUSTE DEL TAMAÑO
          (function() {
            // Ajustar después de que todo cargue
            setTimeout(function() {
              const ticket = document.querySelector('.ticket');
              const body = document.body;
              
              // Forzar dimensiones exactas
              body.style.width = '72mm';
              body.style.minWidth = '72mm';
              body.style.maxWidth = '72mm';
              body.style.margin = '0 auto';
              body.style.padding = '0';
              
              ticket.style.width = '70mm';
              ticket.style.maxWidth = '70mm';
              
              // Si el contenido se sale, reducir fuente
              if (ticket.offsetWidth > 70) {
                const currentFontSize = parseFloat(window.getComputedStyle(ticket).fontSize);
                ticket.style.fontSize = (currentFontSize * 0.95) + 'px';
              }
              
              // Disparar evento de carga completa
              window.dispatchEvent(new Event('load'));
            }, 100);
          })();
        </script>
      </body>
    </html>
  `)

    printWindow.document.close()

    // IMPORTANTE: Esperar más tiempo para que se carguen todos los estilos
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()

      // No cerrar inmediatamente, dejar que el usuario cancele si quiere
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close()
        }
      }, 5000)
    }, 1000) // Aumentar el tiempo de espera
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatMinutos = (minutos: number) => {
    const horas = Math.floor(minutos / 60)
    const mins = minutos % 60
    if (horas > 0) {
      return `${horas}h ${mins}m`
    }
    return `${mins}m`
  }

  const facturas: FacturaHistorial[] = data?.success ? data.data : data || []

  const calcularTotales = (): TotalesCalculados => {
    if (!facturas.length) return {
      total: 0,
      nocturnos: 0,
      normales: 0,
      totalNocturnos: 0,
      totalNormales: 0
    }

    const nocturnos = facturas.filter(f => f.es_nocturno)
    const normales = facturas.filter(f => !f.es_nocturno)

    const totalNocturnos = nocturnos.reduce((sum, f) => sum + f.costo_total, 0)
    const totalNormales = normales.reduce((sum, f) => sum + f.costo_total, 0)

    return {
      total: totalNocturnos + totalNormales,
      nocturnos: nocturnos.length,
      normales: normales.length,
      totalNocturnos,
      totalNormales
    }
  }

  const totales = calcularTotales()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Facturas
        </CardTitle>
        <CardDescription>Consulte el historial de vehículos y facturas generadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar por:</span>
            <Select value={tipoFiltro} onValueChange={(value: "dia" | "mes") => setTipoFiltro(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccione filtro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Día específico</SelectItem>
                <SelectItem value="mes">Mes completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {tipoFiltro === "dia" ? (
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            ) : (
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="month"
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {(fecha || mes) && (
              <Button onClick={handleLimpiar} variant="outline">
                Limpiar
              </Button>
            )}

            {facturas.length > 0 && (
              <Button
                onClick={handleImprimirReporte}
                disabled={generandoReporte}
                className="bg-green-600 hover:bg-green-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                {generandoReporte ? "Generando..." : "Imprimir Reporte"}
              </Button>
            )}
          </div>
        </div>

        {facturas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Total Vehículos</p>
                  <p className="text-2xl font-bold text-blue-700">{facturas.length}</p>
                </div>
                <Car className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600">Vehículos Nocturnos</p>
                  <p className="text-2xl font-bold text-amber-700">{totales.nocturnos}</p>
                  <p className="text-xs text-amber-500">${totales.totalNocturnos.toFixed(2)}</p>
                </div>
                <Moon className="h-8 w-8 text-amber-400" />
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-600">Vehículos Normales</p>
                  <p className="text-2xl font-bold text-emerald-700">{totales.normales}</p>
                  <p className="text-xs text-emerald-500">${totales.totalNormales.toFixed(2)}</p>
                </div>
                <Sun className="h-8 w-8 text-emerald-400" />
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-purple-700">${totales.total.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error al cargar historial. Verifica la conexión con el servidor.
          </div>
        ) : !facturas?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            {fecha || mes
              ? `No hay registros para ${tipoFiltro === "dia" ? "la fecha seleccionada" : "el mes seleccionado"}`
              : "No hay registros en el historial"}
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Espacio</TableHead>
                  <TableHead>Entrada</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead>Tiempo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell className="font-mono font-medium">{factura.placa}</TableCell>
                    <TableCell>{factura.espacio_numero}</TableCell>
                    <TableCell className="text-sm">{formatDateTime(factura.fecha_hora_entrada)}</TableCell>
                    <TableCell className="text-sm">{formatDateTime(factura.fecha_hora_salida)}</TableCell>
                    <TableCell>{formatMinutos(factura.tiempo_total_minutos)}</TableCell>
                    <TableCell>
                      {factura.es_nocturno ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Moon className="h-3 w-3 mr-1" />
                          Nocturno
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Sun className="h-3 w-3 mr-1" />
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">${factura.costo_total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="px-4 py-3 border-t bg-slate-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Mostrando {facturas.length} registro{facturas.length !== 1 ? "s" : ""}
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total General:</div>
                  <div className="text-lg font-bold text-slate-800">${totales.total.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}