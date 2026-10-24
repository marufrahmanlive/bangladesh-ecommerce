import { StorefrontLayout } from "@/components/storefront/storefront-layout";

export default function StorefrontGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StorefrontLayout>{children}</StorefrontLayout>;
}
