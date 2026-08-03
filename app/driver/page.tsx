import { DriverDashboard } from "@/components/driver/driver-dashboard";
import { DEMO_RUN_ID } from "@/lib/constants/delivery";

export default function DriverPage() {
  const runId = process.env.NEXT_PUBLIC_DEMO_RUN_ID || DEMO_RUN_ID;

  return <DriverDashboard runId={runId} />;
}
