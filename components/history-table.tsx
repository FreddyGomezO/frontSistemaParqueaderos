"use client"

import { useState } from "react"
import useSWR from "swr"
import { obtenerHistorial } from "@/servicios/vehiculoService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { History, Calendar, Search } from "lucide-react"

// Tipo para factura del historial
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
}

export function HistoryTable() {
  const [fecha, setFecha] = useState("")
  const [searchFecha, setSearchFecha] = useState<string | null>(null)

  const { data, error, isLoading } = useSWR(
    ["historial", searchFecha],
    async () => {
      // @ts-ignore - JS function with loose types
      return await obtenerHistorial(searchFecha, 100)
    },
    {
      refreshInterval: 30000, // Actualizar cada 30 segundos
    }
  )

  const handleBuscar = () => {
    setSearchFecha(fecha || null)
  }

  const handleLimpiar = () => {
    setFecha("")
    setSearchFecha(null)
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

  // Extraer el array de facturas dependiendo de la estructura de respuesta
  const facturas: FacturaHistorial[] = data?.success ? data.data : data || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Facturas
        </CardTitle>
        <CardDescription>Consulte el historial de vehículos y facturas generadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
              />
            </div>
            <Button onClick={handleBuscar} variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
            {searchFecha && (
              <Button onClick={handleLimpiar} variant="outline">
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error al cargar historial. Verifica la conexión con el servidor.
          </div>
        ) : !facturas?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchFecha
              ? "No hay registros para la fecha seleccionada"
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
                    <TableCell className="text-right font-bold">${factura.costo_total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Footer con total de registros */}
            <div className="px-4 py-2 text-sm text-muted-foreground border-t">
              Mostrando {facturas.length} registro{facturas.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}