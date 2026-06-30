import { headers } from "next/headers";
import DesktopFallback from "@/components/camera/DesktopFallback";
import CameraGateway from "@/components/camera/CameraGateway";

export default function CameraPage() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";

  // Regular expression to check if User-Agent matches common mobile device patterns
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  if (!isMobileUA) {
    return <DesktopFallback />;
  }

  return <CameraGateway />;
}
