"use client"

import { useState } from "react"
import useSWR from "swr"
import { obtenerReporteDiario } from "@/servicios/reporteService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Calendar, DollarSign, Car, TrendingUp } from "lucide-react"

// Tipo para el reporte diario
interface ReporteDiario {
  fecha: string
  total_vehiculos: number
  ingresos_total: number
}

export function DailyReport() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [searchFecha, setSearchFecha] = useState<string | null>(null)

  const {
    data: reporte,
    error,
    isLoading,
  } = useSWR<ReporteDiario>(
    ["reporte-diario", searchFecha],
    async () => {
      // @ts-ignore - JS function with loose types
      return await obtenerReporteDiario(searchFecha)
    },
    { refreshInterval: 60000 } // Actualizar cada minuto
  )

  const handleBuscar = () => {
    setSearchFecha(fecha)
  }

  const handleHoy = () => {
    const hoy = new Date().toISOString().split("T")[0]
    setFecha(hoy)
    setSearchFecha(hoy)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Reporte Diario
        </CardTitle>
        <CardDescription>Resumen de ingresos y actividad del día</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
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
          <Button onClick={handleBuscar}>Ver Reporte</Button>
          <Button onClick={handleHoy} variant="outline">
            Hoy
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Cargando reporte...</div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Error al cargar reporte. Verifica la conexión con el servidor.
          </div>
        ) : reporte ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ingresos del Día</p>
                    <p className="text-2xl font-bold">${reporte.ingresos_total.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-full">
                    <Car className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehículos Atendidos</p>
                    <p className="text-2xl font-bold">{reporte.total_vehiculos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-full">
                    <TrendingUp className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Promedio por Vehículo</p>
                    <p className="text-2xl font-bold">
                      $
                      {reporte.total_vehiculos > 0
                        ? (reporte.ingresos_total / reporte.total_vehiculos).toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Selecciona una fecha para ver el reporte
          </div>
        )}
      </CardContent>
    </Card>
  )
}