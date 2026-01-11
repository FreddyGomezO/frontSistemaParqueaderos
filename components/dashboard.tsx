"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ParkingGrid } from "@/components/parking-grid"
import { VehicleExit } from "@/components/vehicle-exit"
import { HistoryTable } from "@/components/history-table"
import { DailyReport } from "@/components/daily-report"
import { ConfigPanel } from "@/components/config-panel"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, LogOut, LayoutDashboard, History, BarChart3, Settings } from "lucide-react"

export function Dashboard() {
  const { operador, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="min-h-screen bg-muted/30">
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-6 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Sistema de Parqueadero</h1>
              <p className="text-xs text-muted-foreground">Hotel</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Operador:{" "}
              <span className="font-medium text-foreground">
                {operador}
              </span>
            </span>

            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex justify-center py-6">
        <div className="w-full max-w-7xl px-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>

              <TabsTrigger value="historial" className="gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>

              <TabsTrigger value="reportes" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Reportes</span>
              </TabsTrigger>

              <TabsTrigger value="configuracion" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <ParkingGrid />
                <VehicleExit />
              </div>
            </TabsContent>

            <TabsContent value="historial">
              <HistoryTable />
            </TabsContent>

            <TabsContent value="reportes">
              <DailyReport />
            </TabsContent>

            <TabsContent value="configuracion">
              <ConfigPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
