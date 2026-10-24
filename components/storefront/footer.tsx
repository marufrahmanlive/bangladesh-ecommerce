"use client";

import Link from "next/link";
import { useI18n } from "@/features/i18n";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="text-lg font-bold text-primary">
            BanglaBazar
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">{t("footer.about")}</p>
          <p className="mt-4 text-xs text-muted-foreground">{t("footer.demoNotice")}</p>
        </div>
        <div>
          <h4 className="font-semibold">{t("footer.customerService")}</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-primary" href="/shipping-policy">{t("footer.deliveryPolicy")}</Link></li>
            <li><Link className="hover:text-primary" href="/return-policy">{t("footer.returnPolicy")}</Link></li>
            <li><Link className="hover:text-primary" href="/privacy-policy">{t("footer.privacyPolicy")}</Link></li>
            <li><Link className="hover:text-primary" href="/terms">{t("footer.terms")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">{t("nav.categories")}</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-primary" href="/categories/kantha-handmade">Kantha</Link></li>
            <li><Link className="hover:text-primary" href="/categories/clothing">Clothing</Link></li>
            <li><Link className="hover:text-primary" href="/categories/cosmetics">Cosmetics</Link></li>
            <li><Link className="hover:text-primary" href="/categories/home-living">Home</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">{t("footer.contactInfo")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>+880 1700-000000</li>
            <li>support@banglajbazar.example.test</li>
            <li>Dhaka, Bangladesh</li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © BanglaBazar. {t("footer.allRights")}
      </div>
    </footer>
  );
}


