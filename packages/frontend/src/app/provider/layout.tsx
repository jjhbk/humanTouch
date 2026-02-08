import { Header } from "@/components/layout/header";
import { ProviderSidebar } from "@/components/layout/provider-sidebar";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <ProviderSidebar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
