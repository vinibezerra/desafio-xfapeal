export interface HealthStatus {
  status: 'ok'
  timestamp: string
  uptimeSeconds: number
}

export function getHealthStatus(): HealthStatus {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  }
}
