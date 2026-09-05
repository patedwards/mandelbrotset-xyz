import { useEffect } from "react";
import { useToast } from "../hooks/state";

export default function Toast() {
  const [toast, setToast] = useToast();
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast, setToast]);
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      {toast}
    </div>
  );
}
