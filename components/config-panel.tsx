"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { obtenerConfiguracion, actualizarConfiguracion } from "@/servicios/configuracionService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Save, Clock, DollarSign, AlertCircle, Lock, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

// ✅ CONTRASEÑA DE ACCESO (Cámbiala por la que quieras)
const PASSWORD_ADMIN = "admin2024"

export function ConfigPanel() {
  const { data: config, error, isLoading, mutate } = useSWR<Configuracion>("configuracion", obtenerConfiguracion)
  
  // Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  
  // Estados de edición
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState<Partial<Configuracion>>({})

  // ✅ Verificar si ya está autenticado en esta sesión
  useEffect(() => {
    const authSession = sessionStorage.getItem('config_authenticated')
    if (authSession === 'true') {
      setIsAuthenticated(true)
    } else {
      // Mostrar diálogo de contraseña al cargar el componente
      setShowPasswordDialog(true)
    }
  }, [])

  // ✅ Manejar verificación de contraseña
  const handlePasswordSubmit = () => {
    if (passwordInput === PASSWORD_ADMIN) {
      setIsAuthenticated(true)
      setShowPasswordDialog(false)
      setPasswordError("")
      setPasswordInput("")
      setAttemptCount(0)
      // Guardar en sessionStorage (se borra al cerrar la pestaña)
      sessionStorage.setItem('config_authenticated', 'true')
    } else {
      const newAttemptCount = attemptCount + 1
      setAttemptCount(newAttemptCount)
      setPasswordError(`Contraseña incorrecta. Intentos: ${newAttemptCount}/3`)
      
      // Después de 3 intentos, bloquear temporalmente
      if (newAttemptCount >= 3) {
        setPasswordError("Demasiados intentos fallidos. Recarga la página para intentar de nuevo.")
        setPasswordInput("")
        // Opcionalmente, puedes cerrar el diálogo después de 3 segundos
        setTimeout(() => {
          setShowPasswordDialog(false)
        }, 3000)
      } else {
        setPasswordInput("")
      }
    }
  }

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
        setSaveError(resultado.message || "Error desconocido")
      }
    } catch (err) {
      if (err instanceof Error) {
        setSaveError(err.message)
      } else {
        setSaveError("Error inesperado al guardar")
      }
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

  // ✅ Función para cerrar sesión
  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('config_authenticated')
    setShowPasswordDialog(true)
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

  // ✅ Si no está autenticado, mostrar solo el diálogo
  if (!isAuthenticated) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              Acceso Restringido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <Lock className="h-8 w-8 text-amber-600" />
              </div>
              <p className="text-muted-foreground mb-4">
                Esta sección requiere autenticación de administrador
              </p>
              <Button onClick={() => setShowPasswordDialog(true)}>
                <Lock className="h-4 w-4 mr-2" />
                Ingresar Contraseña
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Diálogo de contraseña */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-600" />
                Acceso a Configuración
              </DialogTitle>
              <DialogDescription>
                Ingrese la contraseña de administrador para acceder a la configuración de precios
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña de Administrador</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingrese la contraseña"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && passwordInput.trim() && attemptCount < 3) {
                        handlePasswordSubmit()
                      }
                    }}
                    className="pl-10 pr-10"
                    disabled={attemptCount >= 3}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors"
                    disabled={attemptCount >= 3}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {passwordError && (
                <Alert variant={attemptCount >= 3 ? "destructive" : "default"}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPasswordDialog(false)
                  setPasswordInput("")
                  setPasswordError("")
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handlePasswordSubmit}
                disabled={!passwordInput.trim() || attemptCount >= 3}
                className="bg-amber-600 hover:bg-amber-700"
              >
                Verificar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // ✅ Si está autenticado, mostrar el panel normal
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
          <div className="flex gap-2">
            {!editMode && (
              <Button variant="outline" onClick={handleEdit}>
                Editar
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            >
              <Lock className="h-4 w-4 mr-1" />
              Cerrar Sesión
            </Button>
          </div>
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