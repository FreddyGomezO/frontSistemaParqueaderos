"use client"

import { useState, useRef } from "react"
import { buscarVehiculo, registrarSalida } from "@/servicios/vehiculoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Clock, DollarSign, Car, Printer, Moon } from "lucide-react"
import { useSWRConfig } from "swr"

// Tipos
interface VehiculoBusqueda {
  id: number
  placa: string
  espacio_numero: number
  fecha_hora_entrada: string
  fecha_hora_salida: string | null
  costo_total: number | null
  estado: string
  es_nocturno: boolean  // ✅ AGREGADO
  creado_en: string
  costo_estimado: number
  tiempo_estimado: string
  detalles: string
}

interface Factura {
  placa: string
  espacio: number
  entrada: string
  salida: string
  tiempo_total: string
  costo_total: number
  detalles: string
  es_nocturno: boolean  // ✅ AGREGADO
  tarifa_aplicada?: string  // ✅ OPCIONAL
}

// Datos del hotel para la factura
const HOTEL_INFO = {
  nombre: "Hotel Gran Plaza",
  direccion: "Av. Principal 123, Centro Histórico",
  telefono: "(02) 234-5678",
  ruc: "1234567890001",
}

export function VehicleExit() {
  const { mutate } = useSWRConfig()
  const [placa, setPlaca] = useState("")
  const [vehiculo, setVehiculo] = useState<VehiculoBusqueda | null>(null)
  const [factura, setFactura] = useState<Factura | null>(null)
  const [searching, setSearching] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const facturaRef = useRef<HTMLDivElement>(null)

  const handleBuscar = async () => {
    if (!placa.trim()) return

    setSearching(true)
    setError("")
    setVehiculo(null)

    try {
      const result = await buscarVehiculo(placa.trim())
      
      // El backend retorna { success: true, data: {...} }
      if (result && result.success && result.data) {
        setVehiculo(result.data)
      } else if (result && result.data) {
        // Por si acaso solo viene data sin success
        setVehiculo(result.data)
      } else {
        setError("Vehículo no encontrado o ya salió del parqueadero")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar vehículo")
    } finally {
      setSearching(false)
    }
  }

  const handleRegistrarSalida = async () => {
    if (!vehiculo) return

    setProcessing(true)
    setError("")

    try {
      const result = await registrarSalida(vehiculo.placa)
      
      if (result.ok && result.data) {
        setFactura(result.data.factura)
        setDialogOpen(true)
        setVehiculo(null)
        setPlaca("")
        mutate("espacios") // Refrescar los espacios
      } else {
        setError(result.message || "Error al registrar salida")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar salida")
    } finally {
      setProcessing(false)
    }
  }

  const handleImprimir = () => {
    if (!factura) return

    const entrada = new Date(factura.entrada)
    const salida = new Date(factura.salida)

    const fEntrada = entrada.toLocaleDateString("es-EC")
    const hEntrada = entrada.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", hour12: true })

    const fSalida = salida.toLocaleDateString("es-EC")
    const hSalida = salida.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", hour12: true })

    const printWindow = window.open("", "", "width=400,height=600")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Ticket Salida</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 2mm;
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 13px;
              margin: 0;
              padding: 2mm;
              width: 70mm;
              line-height: 1.3;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .placa {
              text-align: center;
              font-size: 22px;
              font-weight: bold;
              letter-spacing: 2px;
              margin: 6px 0;
              border: 2px solid #000;
              padding: 5px;
            }
            hr {
              border: 0;
              border-top: 1px dashed #000;
              margin: 5px 0;
            }
            table {
              width: 100%;
              font-size: 13px;
            }
            td {
              padding: 2px 0;
            }
            .total {
              font-size: 18px;
              font-weight: bold;
            }
            .mensaje {
              text-align: center;
              font-size: 12px;
              margin-top: 6px;
            }
            .nocturno {
              text-align: center;
              color: #dc2626;
              font-weight: bold;
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="center bold">${HOTEL_INFO.nombre}</div>
          <div class="center">Sistema de Parqueadero</div>
          <hr>

          <div class="center bold">TICKET DE SALIDA</div>
          
          ${factura.es_nocturno ? '<div class="nocturno">⚠️ TARIFA NOCTURNA ⚠️</div>' : ''}

          <div class="placa">${factura.placa}</div>
          <div class="center bold">ESPACIO #${factura.espacio}</div>

          <hr>

          <table>
            <tr>
              <td>Entrada:</td>
              <td align="right">${fEntrada} ${hEntrada}</td>
            </tr>
            <tr>
              <td>Salida:</td>
              <td align="right">${fSalida} ${hSalida}</td>
            </tr>
            <tr>
              <td>Tiempo:</td>
              <td align="right">${factura.tiempo_total}</td>
            </tr>
            ${factura.es_nocturno ? 
              '<tr><td>Tarifa:</td><td align="right"><strong>NOCTURNA</strong></td></tr>' : 
              ''
            }
          </table>

          <hr>

          <table>
            <tr class="total">
              <td>TOTAL:</td>
              <td align="right">$${factura.costo_total.toFixed(2)}</td>
            </tr>
          </table>

          <hr>

          <div class="mensaje">
            ${factura.detalles}<br>
            Gracias por su visita<br>
            ${new Date().toLocaleString("es-EC")}
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
      setTimeout(() => printWindow.close(), 100)
    }, 400)
  }

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return {
      fecha: date.toLocaleDateString("es-EC"),
      hora: date.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Salida de Vehículo
          </CardTitle>
          <CardDescription>Busque un vehículo por su placa para registrar la salida y generar factura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="buscar-placa" className="sr-only">
                Placa
              </Label>
              <Input
                id="buscar-placa"
                placeholder="Ingrese la placa (ej: ABC-1234)"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="font-mono text-lg uppercase"
                onKeyDown={(e) => e.key === "Enter" && !searching && handleBuscar()}
              />
            </div>
            <Button onClick={handleBuscar} disabled={!placa.trim() || searching}>
              <Search className="h-4 w-4 mr-2" />
              {searching ? "Buscando..." : "Buscar"}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {vehiculo && (
            <div className="rounded-lg border bg-card p-4 space-y-4">
              {/* AGREGAR BADGE NOCTURNO */}
              {vehiculo.es_nocturno && (
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50">
                    <Moon className="h-3 w-3 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">
                      ⚠️ VEHÍCULO NOCTURNO - Tarifa Fija: ${vehiculo.costo_estimado.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Placa</p>
                  <p className="text-xl font-mono font-bold">{vehiculo.placa}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Espacio</p>
                  <p className="text-xl font-bold">{vehiculo.espacio_numero}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tiempo estacionado</p>
                    <p className="font-medium">{vehiculo.tiempo_estimado}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Costo estimado</p>
                    <p className={`font-bold text-lg ${vehiculo.es_nocturno ? 'text-amber-600' : ''}`}>
                      ${vehiculo.costo_estimado.toFixed(2)}
                      {vehiculo.es_nocturno && ' (Nocturno)'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                {vehiculo.detalles}
                {vehiculo.es_nocturno && (
                  <div className="mt-1 text-amber-600 font-medium">
                    ⭐ Tarifa nocturna fija aplicada
                  </div>
                )}
              </div>

              <Button 
                onClick={handleRegistrarSalida} 
                className={`w-full ${vehiculo.es_nocturno ? "bg-amber-600 hover:bg-amber-700" : ""}`} 
                size="lg" 
                disabled={processing}
                variant={vehiculo.es_nocturno ? "default" : "default"}
              >
                {processing 
                  ? "Procesando..." 
                  : vehiculo.es_nocturno 
                    ? `Registrar Salida (Nocturno - $${vehiculo.costo_estimado.toFixed(2)})`
                    : "Registrar Salida y Generar Factura"
                }
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Factura Generada</DialogTitle>
            <DialogDescription>El vehículo ha salido exitosamente</DialogDescription>
          </DialogHeader>

          {factura && (
            <div ref={facturaRef} className="font-mono text-sm space-y-3 border rounded-lg p-4 bg-background">
              {/* AGREGAR BADGE NOCTURNO */}
              {factura.es_nocturno && (
                <div className="text-center mb-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50">
                    <span className="text-xs font-medium text-amber-700">
                      ⚠️ TARIFA NOCTURNA APLICADA
                    </span>
                  </div>
                </div>
              )}
              
              <div className="header text-center border-b-2 border-dashed pb-3">
                <p className="hotel-name text-lg font-bold">{HOTEL_INFO.nombre}</p>
                <p className="info text-xs text-muted-foreground">{HOTEL_INFO.direccion}</p>
                <p className="info text-xs text-muted-foreground">Tel: {HOTEL_INFO.telefono}</p>
                <p className="info text-xs text-muted-foreground">RUC: {HOTEL_INFO.ruc}</p>
              </div>

              <div className="text-center text-xs text-muted-foreground">COMPROBANTE DE PARQUEO</div>

              <div className="divider border-t border-dashed my-2" />

              <div className="space-y-1">
                <div className="row flex justify-between">
                  <span>Placa:</span>
                  <span className="font-bold">{factura.placa}</span>
                </div>
                <div className="row flex justify-between">
                  <span>Espacio:</span>
                  <span>{factura.espacio}</span>
                </div>
              </div>

              <div className="divider border-t border-dashed my-2" />

              <div className="space-y-1">
                <div className="row flex justify-between">
                  <span>Entrada:</span>
                  <span>
                    {formatDateTime(factura.entrada).fecha} {formatDateTime(factura.entrada).hora}
                  </span>
                </div>
                <div className="row flex justify-between">
                  <span>Salida:</span>
                  <span>
                    {formatDateTime(factura.salida).fecha} {formatDateTime(factura.salida).hora}
                  </span>
                </div>
                <div className="row flex justify-between">
                  <span>Tiempo:</span>
                  <span>{factura.tiempo_total}</span>
                </div>
              </div>

              <div className="divider border-t border-dashed my-2" />

              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                {factura.detalles}
                {factura.es_nocturno && (
                  <div className="mt-1 text-amber-600 font-medium">
                    ⭐ Tarifa nocturna fija aplicada
                  </div>
                )}
              </div>

              <div className="divider border-t-2 border-dashed my-2" />

              <div className="row flex justify-between total text-lg">
                <span>TOTAL:</span>
                <span className="font-bold">${factura.costo_total.toFixed(2)}</span>
              </div>

              <div className="footer text-center text-xs text-muted-foreground mt-4">
                <p>¡Gracias por su visita!</p>
                <p>{new Date().toLocaleString("es-EC")}</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={handleImprimir}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}