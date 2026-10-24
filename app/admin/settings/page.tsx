"use client";

import { useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { useI18n } from "@/features/i18n";
import { useCatalog } from "@/features/catalog/store";
import { useUiStore } from "@/features/ui/store";
import { formatMoney } from "@/lib/format";
import { exportAllData, importAllData, resetDemoData } from "@/lib/seed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";

export default function SettingsPage() {
  const { locale, t } = useI18n();
  const { settings, repos, refresh } = useCatalog();
  const addToast = useUiStore((s) => s.addToast);
  const [name, setName] = useState(settings?.storeName.en ?? "");
  const [phone, setPhone] = useState(settings?.phone ?? "");
  const [email, setEmail] = useState(settings?.email ?? "");
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!settings) return <div className="min-h-[40vh]" />;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repos) return;
    repos.settings.save({
      ...settings,
      storeName: { en: name || settings.storeName.en, bn: settings.storeName.bn },
      phone,
      email,
    });
    refresh();
    addToast(t("toast.saved"), "success");
  };

  const toggleCod = () => {
    if (!repos) return;
    repos.settings.save({ ...settings, codEnabled: !settings.codEnabled });
    refresh();
    addToast(t("toast.saved"), "success");
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "banglajbazar-export.json";
    a.click();
    URL.revokeObjectURL(url);
    addToast(t("toast.saved"), "success");
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPendingImport(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmImport = () => {
    if (pendingImport === null) return;
    try {
      const parsed = JSON.parse(pendingImport);
      const res = importAllData(parsed);
      if (res.ok) {
        refresh();
        addToast(t("toast.saved"), "success");
      } else {
        addToast(t("toast.error"), "error");
      }
    } catch {
      addToast(t("toast.error"), "error");
    }
    setPendingImport(null);
  };

  const doReset = () => {
    resetDemoData();
    setConfirmReset(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-sm">Store Information</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-3">
            <div><Label className="mb-1 block">Store Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label className="mb-1 block">Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label className="mb-1 block">Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button type="submit">{t("common.save")}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Cash on Delivery</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <span>{settings.codEnabled ? "Enabled" : "Disabled"}</span>
          <Button variant="outline" onClick={toggleCod}>
            {settings.codEnabled ? "Disable" : "Enable"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Delivery Zones</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {settings.deliveryZones.map((z) => (
            <div key={z.id} className="flex justify-between rounded-md border p-3 text-sm">
              <span className="font-medium">{z.name.en}</span>
              <span className="text-muted-foreground">{z.districts.join(", ")} · {formatMoney(z.chargeMinor, locale)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Data Management</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export Data
          </Button>
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import Data
          </Button>
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          <Button variant="destructive" onClick={() => setConfirmReset(true)}>
            <Trash2 className="h-4 w-4" /> Reset Demo Data
          </Button>
        </CardContent>
      </Card>

      <Dialog open={pendingImport !== null} onClose={() => setPendingImport(null)} title="Import Data">
        <p className="text-sm">Import validated records from the selected file. Existing collections will be overwritten.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setPendingImport(null)}>{t("common.cancel")}</Button>
          <Button onClick={confirmImport}>{t("common.confirm")}</Button>
        </div>
      </Dialog>

      <Dialog open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset Demo Data">
        <p className="text-sm">This clears all locally stored data and reseeds the sample catalog. This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmReset(false)}>{t("common.cancel")}</Button>
          <Button variant="destructive" onClick={doReset}>{t("common.confirm")}</Button>
        </div>
      </Dialog>
    </div>
  );
}
