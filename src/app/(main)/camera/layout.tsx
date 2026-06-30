import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Camera & AR",
  description: "Capture and share moments with AR lenses.",
};

export default function CameraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full min-h-screen md:min-h-0 md:h-[calc(100vh)] flex flex-col">{children}</div>;
}
