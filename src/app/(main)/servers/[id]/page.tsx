"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useServerStore } from "@/store/serverStore";

export default function ServerPageRedirect() {
  const router = useRouter();
  const params = useParams();
  const serverId = params?.id as string;
  const setActiveServerId = useServerStore((s) => s.setActiveServerId);

  useEffect(() => {
    if (!serverId) {
      router.replace("/servers");
      return;
    }

    // Set active server in store
    setActiveServerId(serverId);

    // Fetch server details and redirect to first channel
    const loadAndRedirect = async () => {
      try {
        const res = await fetch(`/api/servers/${serverId}`);
        if (res.ok) {
          const data = await res.json();
          const serverData = data.data;

          if (
            serverData &&
            serverData.channels &&
            serverData.channels.length > 0
          ) {
            // Redirect to first channel
            const firstChannel = serverData.channels[0];
            router.replace(`/servers/${serverId}/${firstChannel.id}`);
          } else {
            // If server has no channels, redirect to explore
            router.replace("/servers");
          }
        } else {
          router.replace("/servers");
        }
      } catch (err) {
        console.error(err);
        router.replace("/servers");
      }
    };

    loadAndRedirect();
  }, [serverId, router, setActiveServerId]);

  return (
    <div className="flex items-center justify-center h-screen bg-background text-muted-foreground text-sm">
      <div className="flex flex-col items-center gap-3">
        <span className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Loading server workspace...</span>
      </div>
    </div>
  );
}
