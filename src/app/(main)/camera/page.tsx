import { headers } from "next/headers";
import CameraGateway from "@/components/camera/CameraGateway";

export default function CameraPage() {
  const headersList = headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return <CameraGateway ssrMobile={isMobileUA} />;
}
