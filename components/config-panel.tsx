"use client"

import { useState } from "react"
import useSWR from "swr"
import { obtenerConfiguracion, actualizarConfiguracion } from "@/servicios/configuracionService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Save, Clock, DollarSign, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Tipo para la configuración
interface Configuracion {
  id: number
  precio_media_hora: number
  precio_hora_adicional: number
  precio_nocturno: number
  hora_inicio_nocturno: string
  hora_fin_nocturno: string
  actualizado_en: string | null
}

export function ConfigPanel() {
  const { data: config, error, isLoading, mutate } = useSWR<Configuracion>("configuracion", obtenerConfiguracion)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState<Partial<Configuracion>>({})

  const handleEdit = () => {
    if (config) {
      setFormData({
        precio_media_hora: config.precio_media_hora,
        precio_hora_adicional: config.precio_hora_adicional,
        precio_nocturno: config.precio_nocturno,
        hora_inicio_nocturno: config.hora_inicio_nocturno,
        hora_fin_nocturno: config.hora_fin_nocturno,
      })
    }
    setEditMode(true)
    setSaveError("")
    setSaveSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError("")
    setSaveSuccess(false)

    try {
      const resultado = await actualizarConfiguracion(formData)

      if (resultado.ok) {
        await mutate()
        setEditMode(false)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setSaveError(resultado.message || "Error al guardar la configuración")
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar configuración")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditMode(false)
    setFormData({})
    setSaveError("")
    setSaveSuccess(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Precios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cargando configuración...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Precios</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error al cargar configuración. Verifica la conexión con el servidor.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración de Precios
            </CardTitle>
            <CardDescription>Ajuste las tarifas del parqueadero</CardDescription>
          </div>
          {!editMode && (
            <Button variant="outline" onClick={handleEdit}>
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {saveSuccess && (
          <Alert className="bg-emerald-500/10 border-emerald-500/50">
            <AlertCircle className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-600">
              Configuración actualizada exitosamente
            </AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {editMode ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="precio_media_hora">Precio Media Hora ($)</Label>
                <Input
                  id="precio_media_hora"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_media_hora || ""}
                  onChange={(e) => setFormData({ ...formData, precio_media_hora: Number.parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_hora_adicional">Precio Hora Adicional ($)</Label>
                <Input
                  id="precio_hora_adicional"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_hora_adicional || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, precio_hora_adicional: Number.parseFloat(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio_nocturno">Precio Nocturno 12h ($)</Label>
                <Input
                  id="precio_nocturno"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_nocturno || ""}
                  onChange={(e) => setFormData({ ...formData, precio_nocturno: Number.parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="hora_inicio_nocturno">Inicio Horario Nocturno</Label>
                <Input
                  id="hora_inicio_nocturno"
                  type="time"
                  value={formData.hora_inicio_nocturno || ""}
                  onChange={(e) => setFormData({ ...formData, hora_inicio_nocturno: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Ejemplo: 19:00 (7:00 PM)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hora_fin_nocturno">Fin Horario Nocturno</Label>
                <Input
                  id="hora_fin_nocturno"
                  type="time"
                  value={formData.hora_fin_nocturno || ""}
                  onChange={(e) => setFormData({ ...formData, hora_fin_nocturno: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Ejemplo: 07:00 (7:00 AM)</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        ) : config ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Tarifas
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio media hora:</span>
                  <span className="font-medium">${config.precio_media_hora.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio hora adicional:</span>
                  <span className="font-medium">${config.precio_hora_adicional.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarifa nocturna (12h):</span>
                  <span className="font-medium">${config.precio_nocturno.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horario Nocturno
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inicio:</span>
                  <span className="font-medium">{config.hora_inicio_nocturno}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fin:</span>
                  <span className="font-medium">{config.hora_fin_nocturno}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  Si un vehículo permanece 12 horas completas dentro de este horario, se cobra la tarifa nocturna.
                </p>
              </div>
            </div>
            {config.actualizado_en && (
              <div className="md:col-span-2 text-xs text-muted-foreground">
                Última actualización: {new Date(config.actualizado_en).toLocaleString("es-EC")}
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}