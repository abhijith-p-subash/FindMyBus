export type StopColor = 'color_green' | 'color_yellow' | 'color_gray' | 'color_red'

export interface Stop {
  geofence_name: string
  id: number
  scheduled_time: string
  service_place_name: string
  color: StopColor
  delay_time: number | null
  expected_time: string
  skipped: boolean
  running_status: string | null
  is_pick_up: number
  arrival_time: string
  departure_time: string
}

export interface CurrentStatusDetails {
  lat_long: [number, number]
  details: {
    speed: number
    timestamp: string
    location: string
    astl_id: number
    class_name: string
  }
}

export interface ApiResponse {
  status: 200
  eta_map_data: Stop[]
  current_sp_id: number
  is_passed: boolean
  current_status_details: CurrentStatusDetails
  last_dropoff_id: number
  last_boarding_id: number
}

export interface ApiCompleted {
  status: 302
  message: string
}

export type ApiResult = ApiResponse | ApiCompleted

export interface TripLastKnown {
  at: string          // ISO timestamp
  currentStop: string
  firstStop: string   // deduped first stop name
  lastStop: string    // deduped last stop name
  delay: number | null
  progress: number    // 0–100
}

export interface Trip {
  key: string         // unique tracking key, e.g. "YE0407"
  name: string        // user-provided name or key fallback
  originalUrl: string // what the user pasted
  addedAt: string     // ISO timestamp
  lastKnown: TripLastKnown | null
}
