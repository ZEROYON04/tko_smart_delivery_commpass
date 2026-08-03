export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      delivery_runs: { Row: Record<string, Json> };
      deliveries: { Row: Record<string, Json> };
      route_stops: { Row: Record<string, Json> };
      route_legs: { Row: Record<string, Json> };
      driver_locations: { Row: Record<string, Json> };
      delivery_events: { Row: Record<string, Json> };
      route_optimizations: { Row: Record<string, Json> };
    };
    Views: Record<string, never>;
    Functions: {
      recalculate_run_eta: { Args: { p_run_id: string }; Returns: undefined };
      change_delivery_method: {
        Args: {
          p_delivery_id: string;
          p_method: string;
          p_expected_version: number;
        };
        Returns: Json;
      };
      change_delivery_status: {
        Args: {
          p_delivery_id: string;
          p_status: string;
          p_expected_version: number;
        };
        Returns: Json;
      };
      schedule_delivery_reattempt: {
        Args: {
          p_delivery_id: string;
          p_expected_version: number;
          p_available_at: string;
          p_window_code: string;
          p_window_start: string;
          p_window_end: string;
        };
        Returns: Json;
      };
      change_delivery_window: {
        Args: {
          p_delivery_id: string;
          p_expected_version: number;
          p_window_code: string;
          p_window_start: string;
          p_window_end: string;
        };
        Returns: Json;
      };
      apply_active_route_plan: {
        Args: {
          p_run_id: string;
          p_plan: Json;
          p_provider: string;
          p_reason: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
