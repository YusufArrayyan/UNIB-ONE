import { useEffect, useState } from "react";
import { fetchSiteConfig, WA_DEFAULT } from "@/lib/api";

const FALLBACK = { site_name: "BPU UNIB", whatsapp_bpu: WA_DEFAULT, contact_phone: "", contact_email: "", address: "", hero_slides: [] };

export function useSiteConfig() {
  const [config, setConfig] = useState(FALLBACK);
  useEffect(() => {
    let alive = true;
    fetchSiteConfig().then((c) => alive && setConfig({ ...FALLBACK, ...c }));
    return () => { alive = false; };
  }, []);
  return config;
}
