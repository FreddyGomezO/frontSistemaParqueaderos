"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { obtenerEspacios, registrarEntrada } from "@/servicios/vehiculoService"
import { obtenerConfiguracion } from "@/servicios/configuracionService"
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
import { Car, Clock, Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

interface Espacio {
  numero: number
  ocupado: boolean
  placa: string | null
  entrada: string | null
}

interface Configuracion {
  id: number
  precio_media_hora: number
  precio_hora_adicional: number
  precio_nocturno: number
  hora_inicio_nocturno: string
  hora_fin_nocturno: string
  actualizado_en: string | null
}

export function ParkingGrid() {
  const {
    data: espacios,
    error,
    isLoading,
    mutate,
  } = useSWR<Espacio[]>("espacios", obtenerEspacios, {
    refreshInterval: 5000,
  })

  // Obtener configuración
  const { data: config } = useSWR<Configuracion>("configuracion", obtenerConfiguracion)

  const [selectedEspacio, setSelectedEspacio] = useState<number | null>(null)
  const [placa, setPlaca] = useState("")
  const [esNocturno, setEsNocturno] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // Función para verificar si estamos en horario nocturno
  const estaEnHorarioNocturno = (): boolean => {
    if (!config) return false
    
    const ahora = new Date()
    const horaActual = ahora.getHours()
    const minutoActual = ahora.getMinutes()
    const horaActualEnMinutos = horaActual * 60 + minutoActual
    
    // Parsear horas de configuración
    const [horaInicioStr, minutoInicioStr] = config.hora_inicio_nocturno.split(':')
    const [horaFinStr, minutoFinStr] = config.hora_fin_nocturno.split(':')
    
    const horaInicio = parseInt(horaInicioStr)
    const minutoInicio = parseInt(minutoInicioStr)
    const horaFin = parseInt(horaFinStr)
    const minutoFin = parseInt(minutoFinStr)
    
    const inicioEnMinutos = horaInicio * 60 + minutoInicio
    const finEnMinutos = horaFin * 60 + minutoFin
    
    // Lógica de horario nocturno (puede pasar al día siguiente)
    if (inicioEnMinutos < finEnMinutos) {
      // Horario normal: 18:00 - 06:00 del mismo día
      return horaActualEnMinutos >= inicioEnMinutos && horaActualEnMinutos < finEnMinutos
    } else {
      // Horario que pasa al día siguiente: 18:00 - 06:00 (pasa medianoche)
      return horaActualEnMinutos >= inicioEnMinutos || horaActualEnMinutos < finEnMinutos
    }
  }

  const handleEspacioClick = (espacio: Espacio) => {
    if (!espacio.ocupado) {
      setSelectedEspacio(espacio.numero)
      setPlaca("")
      
      // Determinar si mostrar el switch según la hora actual
      const mostrarSwitch = estaEnHorarioNocturno()
      setEsNocturno(mostrarSwitch) // Si está en horario nocturno, activar por defecto
      
      setSubmitError("")
      setDialogOpen(true)
    }
  }

  const handleRegistrarEntrada = async () => {
    if (!selectedEspacio || !placa.trim()) return

    setSubmitting(true)
    setSubmitError("")

    try {
      // Pasar esNocturno al servicio (solo si está en horario nocturno)
      const aplicarNocturno = estaEnHorarioNocturno() ? esNocturno : false
      const resultado = await registrarEntrada(placa.trim(), selectedEspacio, aplicarNocturno)

      if (resultado.ok) {
        // Imprimir ticket de entrada automáticamente
        imprimirTicketEntrada(resultado.data, aplicarNocturno)

        await mutate()
        setDialogOpen(false)
        setPlaca("")
        setEsNocturno(false)
        setSelectedEspacio(null)
      } else {
        setSubmitError(resultado.message || "Error al registrar entrada")
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al registrar entrada")
    } finally {
      setSubmitting(false)
    }
  }
  const imprimirTicketEntrada = (vehiculo: any, esNocturno: boolean) => {
    const fechaEntrada = new Date(vehiculo.fecha_hora_entrada)
    const fecha = fechaEntrada.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
    const hora = fechaEntrada.toLocaleTimeString("es-EC", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })

    const printWindow = window.open("", "", "width=400,height=600")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Ticket</title>
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
              .center { 
                text-align: center; 
              }
              .bold { 
                font-weight: bold; 
              }
              .logo {
                text-align: center;
                margin: 8px 0 10px 0;
              }
              .logo img {
                width: 120px;
                height: auto;
                object-fit: contain;
              }
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
                margin: 4px 0;
                font-size: 13px;
              }
              td {
                padding: 2px 0;
              }
              .nocturno {
                text-align: center;
                color: #dc2626;
                font-weight: bold;
                margin: 4px 0;
              }
              .label {
                width: 28%;
              }
              .mensaje {
                text-align: center;
                font-size: 12px;
                line-height: 1.4;
                margin-top: 4px;
              }
            </style>
          </head>
          <body>
            <div class="logo">
              <img src="${window.location.origin}/42dd1c4b-77e6-48fa-b3c1-df5bfd43fee7.png" alt="Hotel La Farola">
            </div>
            <div class="center">Sistema de Parqueadero</div>
            <hr>
            <div class="center bold">TICKET DE ENTRADA</div>
            ${esNocturno ? '<div class="nocturno">⚠️ TARIFA NOCTURNA ⚠️</div>' : ''}
            <div class="placa">${vehiculo.placa}</div>
            <div class="center bold">ESPACIO #${vehiculo.espacio_numero}</div>
            <hr>
            <table>
              <tr>
                <td class="label">Fecha:</td>
                <td>${fecha}</td>
              </tr>
              <tr>
                <td class="label">Hora:</td>
                <td>${hora}</td>
              </tr>
              ${esNocturno ? '<tr><td class="label">Tarifa:</td><td><strong>NOCTURNA</strong></td></tr>' : ''}
            </table>
            <hr>
            <div class="mensaje">
Entregue este comprobante
para su salida. Parqueadero
tarifado. La perdida de
ticket generara una perdida
de 10.00$
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()

      setTimeout(() => {
        printWindow.print()
        setTimeout(() => {
          printWindow.close()
        }, 100)
      }, 500)
    }
  }

  const formatEntrada = (entrada: string) => {
    const date = new Date(entrada)
    return date.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })
  }

  // Verificar si debemos mostrar el switch
  const mostrarSwitchNocturno = estaEnHorarioNocturno()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Espacios de Estacionamiento</CardTitle>
          <CardDescription>Cargando espacios...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Espacios de Estacionamiento</CardTitle>
          <CardDescription className="text-destructive">
            Error al conectar con el servidor. Verifica que el backend esté corriendo en http://127.0.0.1:8000
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const espaciosOcupados = espacios?.filter((e) => e.ocupado).length || 0
  const espaciosLibres = 15 - espaciosOcupados

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Espacios de Estacionamiento</CardTitle>
              <CardDescription>Click en un espacio libre para registrar entrada</CardDescription>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span>Libres: {espaciosLibres}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <span>Ocupados: {espaciosOcupados}</span>
              </div>
              {/* Mostrar estado del horario nocturno */}
              {config && (
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${mostrarSwitchNocturno ? 'bg-amber-500' : 'bg-gray-300'}`} />
                  <span>
                    {mostrarSwitchNocturno ? 'Horario Nocturno' : 'Horario Normal'} 
                    ({config.hora_inicio_nocturno} - {config.hora_fin_nocturno})
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {espacios?.map((espacio) => (
              <button
                key={espacio.numero}
                onClick={() => handleEspacioClick(espacio)}
                disabled={espacio.ocupado}
                className={cn(
                  "relative h-24 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1",
                  espacio.ocupado
                    ? "bg-rose-500/10 border-rose-500/50 cursor-not-allowed"
                    : "bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20 hover:border-emerald-500 cursor-pointer",
                )}
              >
                <span className={cn("text-2xl font-bold", espacio.ocupado ? "text-rose-600" : "text-emerald-600")}>
                  {espacio.numero}
                </span>
                {espacio.ocupado ? (
                  <>
                    <Car className="h-4 w-4 text-rose-500" />
                    <span className="text-xs font-mono text-rose-600">{espacio.placa}</span>
                    {espacio.entrada && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatEntrada(espacio.entrada)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-emerald-600">Disponible</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Entrada - Espacio {selectedEspacio}</DialogTitle>
            <DialogDescription>Ingrese la placa del vehículo para registrar la entrada</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="placa">Placa del Vehículo</Label>
              <Input
                id="placa"
                placeholder="ABC-1234"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                className="font-mono text-lg uppercase"
                maxLength={10}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && placa.trim() && !submitting) {
                    handleRegistrarEntrada()
                  }
                }}
              />
            </div>

            {/* NUEVO: Switch SOLO si estamos en horario nocturno */}
            {mostrarSwitchNocturno && (
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${esNocturno ? 'bg-amber-500/20' : 'bg-gray-200'}`}>
                    {esNocturno ? (
                      <Moon className="h-5 w-5 text-amber-600" />
                    ) : (
                      <Sun className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="nocturno" className="font-medium">
                      Tarifa Nocturna
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {esNocturno
                        ? "El vehículo pagará tarifa nocturna completa ($10.00)"
                        : "Tarifa normal por horas progresiva"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Horario nocturno configurado: {config?.hora_inicio_nocturno} - {config?.hora_fin_nocturno}
                    </p>
                  </div>
                </div>
                <Switch
                  id="nocturno"
                  checked={esNocturno}
                  onCheckedChange={setEsNocturno}
                  className="data-[state=checked]:bg-amber-600"
                />
              </div>
            )}

            {/* Mensaje si NO estamos en horario nocturno */}
            {!mostrarSwitchNocturno && config && (
              <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-sm text-muted-foreground">
                  ⏰ <strong>Horario Normal</strong><br/>
                  Fuera del horario nocturno ({config.hora_inicio_nocturno} - {config.hora_fin_nocturno})<br/>
                  Se aplicará tarifa progresiva por horas.
                </p>
              </div>
            )}

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleRegistrarEntrada}
              disabled={!placa.trim() || submitting}
              className={esNocturno && mostrarSwitchNocturno ? "bg-amber-600 hover:bg-amber-700" : ""}
            >
              {submitting
                ? "Registrando..."
                : esNocturno && mostrarSwitchNocturno
                  ? `Registrar (Nocturno - $${config?.precio_nocturno || '10.00'})`
                  : "Registrar Entrada"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}