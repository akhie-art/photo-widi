"use client";

import { useState, useEffect } from "react";
import QrSharingTab from "../components/QrSharingTab";

export default function QrSharingPage() {
  const [customerUrl, setCustomerUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCustomerUrl(window.location.origin);
    }
  }, []);

  return <QrSharingTab customerUrl={customerUrl} />;
}
