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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
