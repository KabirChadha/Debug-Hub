"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { 
  Terminal, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  Video, 
  Download, 
  Upload, 
  RefreshCw, 
  Search, 
  AlertCircle, 
  ExternalLink, 
  LogOut, 
  X,
  FileArchive,
  MessageSquare,
  Clock,
  CheckCheck
} from "lucide-react";
import { Toast } from "@/components/Toast";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/types/database.types";

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Initializing admin portal...</p>
        </div>
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}

function getAdminFileBadge(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".py")) {
    return { badge: "[.PY]", style: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
  }
  if (lower.endsWith(".c") || lower.endsWith(".cpp")) {
    const ext = lower.endsWith(".cpp") ? "[.CPP]" : "[.C]";
    return { badge: ext, style: "bg-sky-500/15 text-sky-400 border-sky-500/30" };
  }
  if (lower.endsWith(".java")) {
    return { badge: "[.JAVA]", style: "bg-red-500/15 text-red-400 border-red-500/30" };
  }
  if (lower.endsWith(".ts") || lower.endsWith(".tsx") || lower.endsWith(".js") || lower.endsWith(".jsx")) {
    const ext = lower.slice(lower.lastIndexOf(".")).toUpperCase();
    return { badge: `[${ext}]`, style: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" };
  }
  if (lower.endsWith(".sql")) {
    return { badge: "[.SQL]", style: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
  }
  if (lower.endsWith(".pdf")) {
    return { badge: "[.PDF]", style: "bg-rose-500/15 text-rose-400 border-rose-500/30" };
  }
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) {
    const ext = lower.endsWith(".docx") ? "[.DOCX]" : "[.DOC]";
    return { badge: ext, style: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
  }
  if (lower.endsWith(".md") || lower.endsWith(".txt")) {
    const ext = lower.slice(lower.lastIndexOf(".")).toUpperCase();
    return { badge: `[${ext}]`, style: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  }
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")).toUpperCase() : "[.ZIP]";
  return { badge: ext.startsWith("[") ? ext : `[${ext}]`, style: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
}

const emptySubscribe = () => () => {};

function AdminDashboardContent() {
  // Hydration safety mount state via official useSyncExternalStore
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Authentication state
  const [adminKey, setAdminKey] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<"all" | "bug_fix" | "custom_project">("all");

  // Dynamic Quote states
  const [quoteInputs, setQuoteInputs] = useState<Record<string, string>>({});
  const [editingQuoteCodes, setEditingQuoteCodes] = useState<Record<string, boolean>>({});
  const [isSendingQuote, setIsSendingQuote] = useState<Record<string, boolean>>({});

  // Action / Upload Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeModalOrder, setActiveModalOrder] = useState<Order | null>(null);
  const [uploadType, setUploadType] = useState<"video" | "fixed_zip" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastSub, setToastSub] = useState<string>("");
  const [isToastVisible, setIsToastVisible] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, sub?: string) => {
    setToastMessage(msg);
    setToastSub(sub || "");
    setIsToastVisible(true);
  };

  // Mount effect: Ensure client-dependent state (sessionStorage, timestamps) only runs after mount
  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore && typeof window !== "undefined") {
        const storedKey = sessionStorage.getItem("ccf_admin_key");
        if (storedKey) {
          setAdminKey(storedKey);
          setIsAuthenticated(true);
        }
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch orders from API
  const fetchOrders = useCallback(async (keyToUse?: string) => {
    const key = keyToUse || adminKey;
    if (!key) return;
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { "x-admin-key": key },
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem("ccf_admin_key");
        setAuthError("Session expired or invalid key. Please log in again.");
        return;
      }

      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch {
      console.warn("Could not fetch remote admin orders");
    } finally {
      setIsLoadingOrders(false);
    }
  }, [adminKey]);

  // Effect to load orders when authenticated
  useEffect(() => {
    let isMounted = true;
    if (!isAuthenticated || !adminKey) return;

    async function load() {
      try {
        const res = await fetch("/api/admin/orders", {
          headers: { "x-admin-key": adminKey },
        });

        if (!isMounted) return;

        if (res.status === 401) {
          setIsAuthenticated(false);
          sessionStorage.removeItem("ccf_admin_key");
          setAuthError("Session expired or invalid key. Please log in again.");
          return;
        }

        const data = await res.json();
        if (isMounted && data.orders) {
          setOrders(data.orders);
        }
      } catch {
        console.warn("Could not load initial admin orders");
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, adminKey]);

  // Handle Passcode Unlock
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsVerifying(true);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcodeInput }),
      });

      const data = await res.json();

      if (res.ok && data.authorized) {
        setAdminKey(passcodeInput);
        setIsAuthenticated(true);
        sessionStorage.setItem("ccf_admin_key", passcodeInput);
        showToast("Access Granted", "Welcome to the CampusCodeFix Admin Console.");
        fetchOrders(passcodeInput);
      } else {
        setAuthError(data.error || "Incorrect admin passcode. Access denied.");
      }
    } catch {
      setAuthError("Network connection error. Could not verify passcode.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ccf_admin_key");
    setAdminKey("");
    setIsAuthenticated(false);
    setPasscodeInput("");
  };

  // Action 1: Set to In Progress
  const handleSetInProgress = async (orderCode: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          order_code: orderCode,
          status: "in_progress",
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.order_code === orderCode ? { ...o, status: "in_progress" } : o))
        );
        showToast(`Order ${orderCode} → In Progress`, "Student telemetry now displays active debugging.");
      }
    } catch {
      console.warn("Failed to set in_progress");
    }
  };

  // Action 2 & 3: Trigger File Upload Modal
  const openUploadModal = (order: Order, type: "video" | "fixed_zip") => {
    setActiveModalOrder(order);
    setUploadType(type);
    setSelectedFile(null);
    setUploadError(null);
    setIsModalOpen(true);
  };

  // Action 4: Approve Payment (Sets payment_status='approved', status='completed', is_paid=true)
  const handleApprovePayment = async (orderId: string, orderCode: string) => {
    try {
      const supabase = createClient();
      let updateError = null;

      const { error: directError } = await supabase
        .from("orders")
        .update({
          payment_status: "approved",
          status: "completed",
          is_paid: true,
          updated_at: new Date().toISOString(),
        })
        .eq("order_code", orderCode);

      updateError = directError;

      // If direct update failed (e.g. column updated_at missing or RLS), try serverless admin route
      if (updateError) {
        const res = await fetch("/api/admin/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            order_code: orderCode,
            payment_status: "approved",
            status: "completed",
            is_paid: true,
          }),
        });

        if (res.ok) {
          updateError = null;
        } else {
          const errData = await res.json().catch(() => ({}));
          updateError = new Error(errData.error || "Failed to update payment status via serverless API");
        }
      }

      if (updateError) {
        alert("Failed to update payment status: " + (updateError as Error).message);
        return;
      }

      // Optimistic local state update
      setOrders((prev) =>
        prev.map((o) =>
          o.order_code === orderCode
            ? { ...o, payment_status: "approved", status: "completed", is_paid: true }
            : o
        )
      );

      showToast(
        `Payment Approved: #${orderCode}`,
        "Order marked completed and client downloads unlocked."
      );

      // Refresh local admin state
      fetchOrders(adminKey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve payment";
      alert("Failed to update payment status: " + msg);
    }
  };

  // Action: Set / Update Quoted Price
  const handleSetQuote = async (orderCode: string, price: number) => {
    if (isNaN(price) || price <= 0) {
      alert("Please enter a valid quote price in ₹.");
      return;
    }

    setIsSendingQuote((prev) => ({ ...prev, [orderCode]: true }));

    try {
      const supabase = createClient();
      let updateError = null;

      const { error: directError } = await supabase
        .from("orders")
        .update({
          quoted_price: price,
          payment_status: "unpaid",
          status: "quote_ready",
          updated_at: new Date().toISOString(),
        })
        .eq("order_code", orderCode);

      updateError = directError;

      if (updateError) {
        const res = await fetch("/api/admin/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            order_code: orderCode,
            quoted_price: price,
            payment_status: "unpaid",
            status: "quote_ready",
          }),
        });

        if (res.ok) {
          updateError = null;
        } else {
          const errData = await res.json().catch(() => ({}));
          updateError = new Error(errData.error || "Failed to update quote via API");
        }
      }

      if (updateError) {
        alert("Failed to send quote: " + (updateError as Error).message);
        return;
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.order_code === orderCode
            ? { ...o, quoted_price: price, payment_status: "unpaid", status: "quote_ready" }
            : o
        )
      );

      setEditingQuoteCodes((prev) => ({ ...prev, [orderCode]: false }));
      showToast(
        `Quote Sent: #${orderCode}`,
        `Custom quote of ₹${price} dispatched to client telemetry.`
      );
      fetchOrders(adminKey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending quote";
      alert("Failed to send quote: " + msg);
    } finally {
      setIsSendingQuote((prev) => ({ ...prev, [orderCode]: false }));
    }
  };

  // Action 5: Mark Completed
  const handleMarkCompleted = async (orderCode: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          order_code: orderCode,
          status: "completed",
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.order_code === orderCode ? { ...o, status: "completed" } : o))
        );
        showToast(`Order ${orderCode} Completed!`, "Client download page unlocked.");
      }
    } catch {
      console.warn("Failed to mark completed");
    }
  };

  // Action: Download original student code / source file directly from 'project-intakes'
  const handleDownloadIntake = async (order: Order) => {
    // 1. Check order.file_url if directly accessible
    if (order.file_url) {
      window.open(order.file_url, "_blank");
      return;
    }

    // 2. Locate intake storage path from order record
    const storagePath =
      order.file_storage_path ||
      order.intake_file_path ||
      order.zip_storage_path;

    if (storagePath) {
      const fileName =
        order.file_name ||
        storagePath.split("/").pop() ||
        `intake-${order.order_code}`;

      setDownloadingOrderId(order.id || order.order_code);

      try {
        // Direct query via Supabase client to 'project-intakes' bucket
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from("project-intakes")
          .createSignedUrl(storagePath, 3600, { download: fileName });

        if (!error && data?.signedUrl) {
          window.open(data.signedUrl, "_blank");
          return;
        }

        // Authoritative server-side download via admin endpoint
        const res = await fetch(
          `/api/admin/download-intake?code=${encodeURIComponent(order.order_code)}&path=${encodeURIComponent(storagePath)}&filename=${encodeURIComponent(fileName)}`,
          {
            headers: {
              "x-admin-key": adminKey,
            },
          }
        );

        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const json = await res.json();
            if (json.signedUrl) {
              window.open(json.signedUrl, "_blank");
              return;
            }
          } else {
            const blob = await res.blob();
            const objectUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = objectUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(objectUrl);
            return;
          }
        }
      } catch (err) {
        console.error("Intake file download error:", err);
      } finally {
        setDownloadingOrderId(null);
      }
    }

    alert("Intake file not found in Supabase storage.");
    showToast(
      "Intake file not found in Supabase storage.",
      "Ensure the student completed file upload."
    );
  };

  // Action: Upload & Sync Reuploaded / Fixed Deliverable Solution directly to 'deliverables' bucket
  const handleReuploadSolution = async (orderCode: string, file: File) => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    // 1. Sanitize file name & generate storage path
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${orderCode}/deliverables/${Date.now()}_${cleanName}`;

    try {
      const supabase = createClient();

      // 2. Upload file to deliverables bucket with upsert: true
      const { error: uploadError } = await supabase.storage
        .from("deliverables")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });

      if (uploadError) {
        console.error("Deliverable upload error:", uploadError);
        alert(`Failed to upload deliverable: ${uploadError.message}`);
        setUploadError(uploadError.message);
        setIsUploading(false);
        return;
      }

      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from("deliverables")
        .getPublicUrl(filePath);

      const deliverableUrl = urlData.publicUrl;

      // 4. Update orders row in Supabase
      let { error: dbError } = await supabase
        .from("orders")
        .update({
          deliverable_url: deliverableUrl,
          fixed_zip_url: deliverableUrl,
          deliverable_storage_path: filePath,
          deliverable_file_name: file.name,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("order_code", orderCode);

      // Fallback: If direct client update hit RLS or schema column cache, fallback to admin API
      if (dbError) {
        const res = await fetch("/api/admin/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            order_code: orderCode,
            deliverable_url: deliverableUrl,
            fixed_zip_url: deliverableUrl,
            deliverable_storage_path: filePath,
            deliverable_file_name: file.name,
            status: "completed",
            updated_at: new Date().toISOString(),
          }),
        });

        if (res.ok) {
          dbError = null;
        }
      }

      if (dbError) {
        console.error("Database update error:", dbError);
        alert(`Storage upload succeeded, but database sync failed: ${dbError.message}`);
        setUploadError(dbError.message);
        setIsUploading(false);
        return;
      }

      alert("Deliverable re-uploaded and synced successfully!");
      showToast(`Deliverable Synced: #${orderCode}`, "Deliverable solution file is now live.");
      setIsUploading(false);
      setIsModalOpen(false);
      setActiveModalOrder(null);
      setUploadType(null);
      setSelectedFile(null);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Deliverable upload failure";
      console.error("Deliverable upload exception:", err);
      alert(`Upload error: ${msg}`);
      setUploadError(msg);
      setIsUploading(false);
    }
  };

  // Action: Upload Proof Video directly to 'deliverables' bucket
  const handleUploadProofVideo = async (orderCode: string, file: File) => {
    if (!file) {
      alert("Please select a video to upload.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const cleanCode = orderCode.trim().toUpperCase();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const videoPath = `${cleanCode}/proof/${Date.now()}_${cleanName}`;

    try {
      const supabase = createClient();
      const { error: videoUploadError } = await supabase.storage
        .from("deliverables")
        .upload(videoPath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || "video/mp4",
        });

      if (videoUploadError) {
        console.error("Video upload error:", videoUploadError);
        alert(`Failed to upload proof video: ${videoUploadError.message}`);
        setUploadError(videoUploadError.message);
        setIsUploading(false);
        return;
      }

      const { data: videoUrlData } = supabase.storage
        .from("deliverables")
        .getPublicUrl(videoPath);

      const videoUrl = videoUrlData.publicUrl;

      let { error: dbError } = await supabase
        .from("orders")
        .update({
          proof_video_url: videoUrl,
          status: "proof_ready",
          updated_at: new Date().toISOString(),
        })
        .eq("order_code", cleanCode);

      if (dbError) {
        const res = await fetch("/api/admin/orders", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-key": adminKey,
          },
          body: JSON.stringify({
            order_code: cleanCode,
            proof_video_url: videoUrl,
            status: "proof_ready",
          }),
        });

        if (res.ok) {
          dbError = null;
        }
      }

      if (dbError) {
        console.error("Database update error:", dbError);
        alert(`Video upload succeeded, but database sync failed: ${dbError.message}`);
        setUploadError(dbError.message);
        setIsUploading(false);
        return;
      }

      alert("Proof video uploaded successfully!");
      showToast(`Proof Video Live: #${cleanCode}`, "Student can now preview the fix execution.");
      setIsUploading(false);
      setIsModalOpen(false);
      setActiveModalOrder(null);
      setUploadType(null);
      setSelectedFile(null);
      fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Video upload failure";
      alert(`Upload error: ${msg}`);
      setUploadError(msg);
      setIsUploading(false);
    }
  };

  // Execute Upload in Modal
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !activeModalOrder || !uploadType) {
      alert("Please select a file to upload.");
      return;
    }

    if (uploadType === "fixed_zip") {
      await handleReuploadSolution(activeModalOrder.order_code, selectedFile);
      return;
    }

    if (uploadType === "video") {
      await handleUploadProofVideo(activeModalOrder.order_code, selectedFile);
      return;
    }
  };

  // High-level service counts
  const bugFixCount = orders.filter((o) => !o.service_type || o.service_type === "bug_fix").length;
  const customProjectCount = orders.filter((o) => o.service_type === "custom_project").length;

  // Filtered orders list (Service filter + Search + Status sub-filter)
  const filteredOrders = orders.filter((o) => {
    // 1. Service filter
    if (selectedService === "bug_fix") {
      if (o.service_type && o.service_type !== "bug_fix") return false;
    } else if (selectedService === "custom_project") {
      if (o.service_type !== "custom_project") return false;
    }

    // 2. Search query filter
    const matchesSearch =
      o.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.contact_handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.tech_stack.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.user_email && o.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.utr_number && o.utr_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.project_title && o.project_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.requirements && o.requirements.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.issue_description && o.issue_description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 3. Status filter
    if (statusFilter === "verifying_payment") {
      return o.payment_status === "verifying";
    }

    if (statusFilter === "needs_quote") {
      return o.quoted_price === null || o.quoted_price === undefined || o.payment_status === "unquoted";
    }

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    return matchesStatus;
  });

  // Calculate quick stats scoped to the selected service tab
  const serviceScopedOrders = orders.filter((o) => {
    if (selectedService === "bug_fix") {
      return !o.service_type || o.service_type === "bug_fix";
    }
    if (selectedService === "custom_project") {
      return o.service_type === "custom_project";
    }
    return true;
  });

  const stats = {
    total: serviceScopedOrders.length,
    submitted: serviceScopedOrders.filter((o) => o.status === "submitted").length,
    in_progress: serviceScopedOrders.filter((o) => o.status === "in_progress").length,
    proof_ready: serviceScopedOrders.filter((o) => o.status === "proof_ready").length,
    completed: serviceScopedOrders.filter((o) => o.status === "completed").length,
    pending_utr: serviceScopedOrders.filter((o) => o.payment_status === "verifying").length,
    needs_quote: serviceScopedOrders.filter((o) => o.quoted_price === null || o.quoted_price === undefined || o.payment_status === "unquoted").length,
  };

  // Helper: Status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Submitted
          </span>
        );
      case "quote_ready":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Quote Ready
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30 whitespace-nowrap animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            In Progress
          </span>
        );
      case "proof_ready":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            Proof Ready
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  // Helper: File cell with dynamic badge and download
  const renderFileCell = (order: Order, isCustomProject: boolean) => {
    const rawFileName =
      order.file_name ||
      (order.file_storage_path || order.intake_file_path || order.zip_storage_path || "").split("/").pop();

    if (!rawFileName && isCustomProject) {
      return (
        <span className="text-[11px] font-mono text-zinc-600 italic block">
          No syllabus/doc
        </span>
      );
    }

    const fileName = rawFileName || `client-intake-${order.order_code}.zip`;
    const { badge, style } = getAdminFileBadge(fileName);
    const isDownloading = downloadingOrderId === (order.id || order.order_code);

    return (
      <div className="flex flex-col gap-1 items-start min-w-[130px]">
        <div className="flex items-center gap-1.5 max-w-[180px]" title={fileName}>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${style}`}>
            {badge}
          </span>
          <span className="text-xs text-white font-mono truncate font-medium">
            {fileName}
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleDownloadIntake(order)}
          disabled={isDownloading}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#09090b] hover:bg-zinc-800 text-orange-400 border border-[#27272a] hover:border-orange-500/40 text-[10px] font-mono transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          title={`Download ${fileName}`}
        >
          {isDownloading ? (
            <RefreshCw className="w-3 h-3 text-orange-400 animate-spin" />
          ) : (
            <Download className="w-3 h-3 text-orange-400" />
          )}
          <span>{isDownloading ? "Downloading..." : "Download"}</span>
        </button>
      </div>
    );
  };

  // Helper: Payment and Quote input cell
  const renderPaymentQuoteCell = (order: Order) => {
    const isUnquoted =
      order.quoted_price === null ||
      order.quoted_price === undefined ||
      order.payment_status === "unquoted";
    const isEditing = editingQuoteCodes[order.order_code];

    return (
      <div className="flex flex-col gap-1.5 items-start">
        {/* If unquoted or currently editing quote */}
        {isUnquoted || isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Quote ₹"
              value={
                quoteInputs[order.order_code] !== undefined
                  ? quoteInputs[order.order_code]
                  : order.quoted_price
                  ? String(order.quoted_price)
                  : ""
              }
              onChange={(e) =>
                setQuoteInputs((prev) => ({
                  ...prev,
                  [order.order_code]: e.target.value,
                }))
              }
              className="w-20 bg-[#09090b] border border-orange-500/40 text-white text-xs px-2 py-1 rounded font-mono focus:outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={() => {
                const val =
                  quoteInputs[order.order_code] !== undefined
                    ? Number(quoteInputs[order.order_code])
                    : order.quoted_price || 0;
                handleSetQuote(order.order_code, val);
              }}
              disabled={isSendingQuote[order.order_code]}
              className="px-2 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-[0_0_10px_rgba(249,115,22,0.3)]"
            >
              {isSendingQuote[order.order_code] ? "Sending..." : "Send Quote"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() =>
                  setEditingQuoteCodes((prev) => ({
                    ...prev,
                    [order.order_code]: false,
                  }))
                }
                className="text-zinc-500 hover:text-white p-0.5 text-xs cursor-pointer"
                title="Cancel"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            {order.payment_status === "approved" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Approved (₹{order.quoted_price})
              </span>
            ) : order.payment_status === "verifying" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap animate-pulse">
                <Clock className="w-3 h-3 text-amber-400" />
                Verifying UTR (₹{order.quoted_price})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 whitespace-nowrap">
                Quoted: ₹{order.quoted_price}
              </span>
            )}

            {order.payment_status !== "approved" && (
              <button
                type="button"
                onClick={() => {
                  setQuoteInputs((prev) => ({
                    ...prev,
                    [order.order_code]: String(order.quoted_price || ""),
                  }));
                  setEditingQuoteCodes((prev) => ({
                    ...prev,
                    [order.order_code]: true,
                  }));
                }}
                className="text-zinc-500 hover:text-orange-400 text-[10px] font-mono underline ml-0.5 cursor-pointer"
                title="Adjust quote"
              >
                Edit
              </button>
            )}
          </div>
        )}

        {order.utr_number ? (
          <div className="font-mono text-[11px] text-zinc-300">
            <span className="text-zinc-500 text-[10px]">UTR: </span>
            <span className="font-bold text-amber-300 select-all" title="Submitted UTR Number">
              {order.utr_number}
            </span>
          </div>
        ) : (
          <span className="font-mono text-[10px] text-zinc-600 block">No UTR</span>
        )}
      </div>
    );
  };

  // Helper: Action buttons per row
  const renderRowActions = (order: Order) => (
    <div className="inline-flex items-center gap-1.5 justify-end">
      {/* APPROVE PAYMENT BUTTON */}
      {order.payment_status !== "approved" && (
        <button
          onClick={() => handleApprovePayment(order.id, order.order_code)}
          className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black border border-emerald-400 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          title="Approve payment and unlock client downloads"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Approve Payment</span>
        </button>
      )}

      {/* WHATSAPP DIRECT BUTTON */}
      <a
        href={`https://wa.me/919289942337?text=Hi%2C%20regarding%20your%20CampusCodeFix%20order%20${encodeURIComponent(order.order_code)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
        title="Chat with student on WhatsApp"
      >
        <MessageSquare className="w-3 h-3 text-emerald-400" />
        <span>WhatsApp</span>
      </a>

      {/* Action: Set to In Progress */}
      {order.status === "submitted" && (
        <button
          onClick={() => handleSetInProgress(order.order_code)}
          className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap"
          title="Assign to active debugging sandbox"
        >
          Set to In Progress
        </button>
      )}

      {/* Action: Upload Proof Video */}
      <button
        onClick={() => openUploadModal(order, "video")}
        className="px-2.5 py-1 rounded-lg bg-[#09090b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] hover:border-cyan-500/40 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
        title="Upload verified execution MP4/WebM"
      >
        <Video className="w-3 h-3 text-cyan-400" />
        <span>{order.proof_video_url ? "Reupload Video" : "Upload Proof Video"}</span>
      </button>

      {/* Action: Upload Fixed Solution */}
      <button
        onClick={() => openUploadModal(order, "fixed_zip")}
        className="px-2.5 py-1 rounded-lg bg-[#09090b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] hover:border-orange-500/40 text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
        title="Upload fixed solution (.zip) to deliverables bucket"
      >
        <FileArchive className="w-3 h-3 text-orange-400" />
        <span>{order.fixed_zip_url ? "Reupload Solution" : "Upload Solution"}</span>
      </button>

      {/* Action: Mark Completed */}
      {order.status !== "completed" && (
        <button
          onClick={() => handleMarkCompleted(order.order_code)}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-[#27272a] text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
          title="Unlocks client download page at /order/[code]"
        >
          <span>Complete</span>
        </button>
      )}
    </div>
  );

  // --------------------------------------------------------------------------
  // 0. HYDRATION GUARD (Loading skeleton until client mount)
  // --------------------------------------------------------------------------
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 font-mono">Mounting admin telemetry portal...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 1. LOGIN GATE SCREEN (If not authenticated)
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#09090b] text-[#a1a1aa] flex items-center justify-center p-4">
        <Toast
          isVisible={isToastVisible}
          message={toastMessage}
          submessage={toastSub}
          onClose={() => setIsToastVisible(false)}
        />

        <div className="w-full max-w-md p-8 rounded-3xl bg-[#18181b] border border-[#27272a] shadow-2xl relative overflow-hidden glow-orange-border text-center">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(249,115,22,0.25)]">
            <Lock className="w-7 h-7" />
          </div>

          <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold block mb-1">
            RESTRICTED ACCESS
          </span>
          <h1 className="text-2xl font-extrabold text-white">
            Engineer Command Center
          </h1>
          <p className="text-xs text-zinc-400 mt-1 mb-6">
            Enter the master <code className="text-orange-400 font-mono">ADMIN_ACCESS_KEY</code> to access triage queues.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative text-left">
              <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="Enter admin passcode..."
                className="w-full bg-[#09090b] border border-[#27272a] text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono placeholder:text-zinc-600"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all duration-200 shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_30px_rgba(249,115,22,0.55)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isVerifying ? "Verifying Passcode..." : "Unlock Dashboard"}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#27272a] text-[11px] text-zinc-500 flex items-center justify-between">
            <Link href="/" className="hover:text-orange-400 transition-colors">
              ← Return Home
            </Link>
            <span className="font-mono">campus.fix v2.4</span>
          </div>
        </div>
      </main>
    );
  }

  // --------------------------------------------------------------------------
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // --------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-[#09090b] text-[#a1a1aa] py-8 px-4 sm:px-6 lg:px-8">
      <Toast
        isVisible={isToastVisible}
        message={toastMessage}
        submessage={toastSub}
        onClose={() => setIsToastVisible(false)}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono">
                  campus<span className="text-orange-500">.fix</span> Admin Console
                </h1>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Live triage dispatch, repository sandbox inspection, UTR verification &amp; deliverable handover
              </p>
            </div>
          </div>

          {/* Action buttons top right */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-zinc-300 hover:text-white border border-[#27272a] text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <span>View Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
            </Link>

            <button
              onClick={() => fetchOrders(adminKey)}
              disabled={isLoadingOrders}
              className="px-3.5 py-2 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-zinc-300 hover:text-white border border-[#27272a] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isLoadingOrders ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/40 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a]">
            <span className="text-xs text-zinc-500 block mb-1">Total Orders</span>
            <span className="text-2xl font-extrabold text-white font-mono">{stats.total}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a]">
            <span className="text-xs text-amber-400 block mb-1">Submitted &amp; Queued</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono">{stats.submitted}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a]">
            <span className="text-xs text-orange-400 block mb-1">Under Debugging</span>
            <span className="text-2xl font-extrabold text-orange-400 font-mono">{stats.in_progress}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a]">
            <span className="text-xs text-cyan-400 block mb-1">Proof Video Ready</span>
            <span className="text-2xl font-extrabold text-cyan-400 font-mono">{stats.proof_ready}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#18181b] border border-amber-500/30 bg-amber-500/5">
            <span className="text-xs text-amber-400 block mb-1">Pending UTR Check</span>
            <span className="text-2xl font-extrabold text-amber-300 font-mono">{stats.pending_utr}</span>
          </div>
          <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a]">
            <span className="text-xs text-emerald-400 block mb-1">Completed</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">{stats.completed}</span>
          </div>
        </div>

        {/* High-Level Service Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-[#18181b] border border-[#27272a] shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedService("all")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                selectedService === "all"
                  ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                  : "text-zinc-400 hover:text-white hover:bg-[#09090b] border border-transparent"
              }`}
            >
              <span>All Submissions</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  selectedService === "all"
                    ? "bg-black/30 text-white"
                    : "bg-[#09090b] text-zinc-400 border border-[#27272a]"
                }`}
              >
                {orders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedService("bug_fix")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                selectedService === "bug_fix"
                  ? "bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]"
                  : "text-zinc-400 hover:text-white hover:bg-[#09090b] border border-transparent"
              }`}
            >
              <span>🛠️ Bug Fixes</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  selectedService === "bug_fix"
                    ? "bg-black/30 text-white"
                    : "bg-[#09090b] text-sky-400 border border-sky-500/30"
                }`}
              >
                {bugFixCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedService("custom_project")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                selectedService === "custom_project"
                  ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                  : "text-zinc-400 hover:text-white hover:bg-[#09090b] border border-transparent"
              }`}
            >
              <span>🚀 New Projects / Builds</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  selectedService === "custom_project"
                    ? "bg-black/30 text-white"
                    : "bg-[#09090b] text-purple-400 border border-purple-500/30"
                }`}
              >
                {customProjectCount}
              </span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-500 hidden sm:block pr-3">
            {selectedService === "bug_fix" && "Prioritizing: Error Logs • Code Files • 1-2 Hr SLA Handover"}
            {selectedService === "custom_project" && "Prioritizing: Specifications • Syllabus Scope • Quoting"}
            {selectedService === "all" && "Displaying consolidated engineering dispatch queue"}
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="p-4 rounded-2xl bg-[#18181b] border border-[#27272a] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, handle, email, UTR, or stack..."
              className="w-full bg-[#09090b] border border-[#27272a] text-xs text-white placeholder:text-zinc-500 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {["all", "submitted", "in_progress", "proof_ready", "completed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  statusFilter === st
                    ? "bg-orange-500 text-white font-bold shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                    : "bg-[#09090b] text-zinc-400 hover:text-white border border-[#27272a]"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}

            <button
              onClick={() => setStatusFilter(statusFilter === "verifying_payment" ? "all" : "verifying_payment")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                statusFilter === "verifying_payment"
                  ? "bg-amber-500 text-black font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "bg-[#09090b] text-amber-400 hover:text-amber-300 border border-amber-500/30"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending UTR ({stats.pending_utr})</span>
            </button>

            <button
              onClick={() => setStatusFilter(statusFilter === "needs_quote" ? "all" : "needs_quote")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                statusFilter === "needs_quote"
                  ? "bg-purple-500 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                  : "bg-[#09090b] text-purple-400 hover:text-purple-300 border border-purple-500/30"
              }`}
            >
              <span>Needs Quote ({stats.needs_quote})</span>
            </button>
          </div>
        </div>

        {/* CLEAN DARK ORDERS TABLE */}
        <div className="rounded-2xl bg-[#18181b] border border-[#27272a] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {selectedService === "bug_fix" ? (
                  <tr className="border-b border-[#27272a] bg-[#09090b]/80 text-zinc-400 font-mono uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Order &amp; Student</th>
                    <th className="py-3.5 px-4 min-w-[200px]">Reported Issue / Bug</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Attached Code File</th>
                    <th className="py-3.5 px-4">Tech Stack</th>
                    <th className="py-3.5 px-4">SLA &amp; Status</th>
                    <th className="py-3.5 px-4 min-w-[170px]">Payment &amp; UTR</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                ) : selectedService === "custom_project" ? (
                  <tr className="border-b border-[#27272a] bg-[#09090b]/80 text-zinc-400 font-mono uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4 min-w-[190px]">Project Title &amp; Code</th>
                    <th className="py-3.5 px-4">Client / Student Email</th>
                    <th className="py-3.5 px-4">Tech Stack</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Requirements &amp; Specs</th>
                    <th className="py-3.5 px-4 min-w-[160px]">Syllabus / Reference Docs</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 min-w-[190px]">Quoted Price &amp; Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                ) : (
                  <tr className="border-b border-[#27272a] bg-[#09090b]/80 text-zinc-400 font-mono uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Order Code &amp; Service</th>
                    <th className="py-3.5 px-4">Client / Student Email</th>
                    <th className="py-3.5 px-4">Tech Stack</th>
                    <th className="py-3.5 px-4">Issue Description / Specs</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 min-w-[190px]">Payment &amp; Quote</th>
                    <th className="py-3.5 px-4 min-w-[160px]">INTAKE FILE / DOC</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-[#27272a]/70">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={selectedService === "bug_fix" ? 7 : 8}
                      className="py-12 text-center text-zinc-500 font-mono text-xs"
                    >
                      {selectedService === "bug_fix"
                        ? "No bug fix tickets found matching your criteria."
                        : selectedService === "custom_project"
                        ? "No custom project build tickets found matching your criteria."
                        : "No active orders found matching your criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    // TAB 1: BUG FIX SPECIFIC VIEW
                    if (selectedService === "bug_fix") {
                      return (
                        <tr key={order.id || order.order_code} className="hover:bg-[#09090b]/40 transition-colors">
                          {/* Order & Student */}
                          <td className="py-4 px-4 font-mono">
                            <div className="flex flex-col gap-1 items-start">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/order/${order.order_code}`}
                                  target="_blank"
                                  className="font-bold text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1"
                                  title="Open Client View"
                                >
                                  <span>{order.order_code}</span>
                                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                                </Link>
                                <span className="bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold px-1.5 py-0.2 rounded text-[9px]">
                                  [Bug Fix]
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-zinc-300">
                                <MessageSquare className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                                <span className="font-semibold text-white text-[11px]">{order.contact_handle}</span>
                              </div>
                              {order.user_email && (
                                <span className="text-[10px] text-zinc-500 truncate max-w-[140px]" title={order.user_email}>
                                  {order.user_email}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Reported Issue / Bug */}
                          <td className="py-4 px-4 max-w-sm">
                            <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] shadow-inner">
                              <p className="text-zinc-300 font-mono text-[11px] line-clamp-2 leading-relaxed" title={order.issue_description}>
                                <span className="text-orange-400 font-bold mr-1">$</span>
                                {order.issue_description || "No crash details provided"}
                              </p>
                            </div>
                          </td>

                          {/* Attached Code File */}
                          <td className="py-4 px-4">
                            {renderFileCell(order, false)}
                          </td>

                          {/* Tech Stack */}
                          <td className="py-4 px-4">
                            <span className="inline-block px-2.5 py-1 rounded bg-[#09090b] border border-[#27272a] text-zinc-300 font-mono text-[11px] whitespace-nowrap">
                              {order.tech_stack}
                            </span>
                          </td>

                          {/* SLA & Status */}
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-[10px] font-mono text-orange-400 font-semibold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                                ⚡ 1–2 Hr Triage
                              </span>
                              {renderStatusBadge(order.status)}
                            </div>
                          </td>

                          {/* Payment & UTR */}
                          <td className="py-4 px-4">
                            {renderPaymentQuoteCell(order)}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            {renderRowActions(order)}
                          </td>
                        </tr>
                      );
                    }

                    // TAB 2: CUSTOM PROJECT BUILD SPECIFIC VIEW
                    if (selectedService === "custom_project") {
                      return (
                        <tr key={order.id || order.order_code} className="hover:bg-[#09090b]/40 transition-colors">
                          {/* Project Title & Code */}
                          <td className="py-4 px-4 font-mono">
                            <div className="flex flex-col gap-1 items-start">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold px-1.5 py-0.2 rounded text-[9px] font-mono">
                                  [New Project]
                                </span>
                                <Link
                                  href={`/order/${order.order_code}`}
                                  target="_blank"
                                  className="font-bold text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1 text-xs"
                                  title="Open Client View"
                                >
                                  <span>#{order.order_code}</span>
                                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                                </Link>
                              </div>
                              <h4 className="text-xs font-bold text-white font-mono mt-0.5 max-w-[200px] truncate" title={order.project_title || "Custom Project Build"}>
                                {order.project_title || "Custom Project Build"}
                              </h4>
                            </div>
                          </td>

                          {/* Client / Student Email */}
                          <td className="py-4 px-4 font-mono text-zinc-300">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                                <span className="font-semibold text-white">{order.contact_handle}</span>
                              </div>
                              {order.user_email ? (
                                <span className="text-[10px] text-zinc-400 truncate max-w-[160px]" title={order.user_email}>
                                  {order.user_email}
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-600">Guest Order</span>
                              )}
                            </div>
                          </td>

                          {/* Tech Stack */}
                          <td className="py-4 px-4">
                            <span className="inline-block px-2.5 py-1 rounded bg-[#09090b] border border-purple-500/30 text-purple-300 font-mono text-[11px] whitespace-nowrap">
                              {order.tech_stack}
                            </span>
                          </td>

                          {/* Requirements & Specifications */}
                          <td className="py-4 px-4 max-w-sm">
                            <div className="p-2.5 rounded-xl bg-[#09090b] border border-[#27272a] shadow-inner">
                              <p className="text-zinc-300 font-mono text-[11px] line-clamp-3 leading-relaxed" title={order.requirements || order.issue_description}>
                                {order.requirements || order.issue_description || "No specifications recorded"}
                              </p>
                            </div>
                          </td>

                          {/* Syllabus / Reference Docs */}
                          <td className="py-4 px-4">
                            {renderFileCell(order, true)}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4">
                            {renderStatusBadge(order.status)}
                          </td>

                          {/* Quoted Price & Status */}
                          <td className="py-4 px-4">
                            {renderPaymentQuoteCell(order)}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            {renderRowActions(order)}
                          </td>
                        </tr>
                      );
                    }

                    // TAB 3: ALL SUBMISSIONS (CONSOLIDATED VIEW)
                    return (
                      <tr key={order.id || order.order_code} className="hover:bg-[#09090b]/40 transition-colors">
                        {/* Order Code & Service */}
                        <td className="py-4 px-4 font-mono">
                          <div className="flex flex-col gap-1 items-start">
                            <Link
                              href={`/order/${order.order_code}`}
                              target="_blank"
                              className="font-bold text-orange-400 hover:text-orange-300 hover:underline flex items-center gap-1"
                              title="Open Client View"
                            >
                              <span>{order.order_code}</span>
                              <ExternalLink className="w-3 h-3 text-zinc-500" />
                            </Link>

                            {order.service_type === "custom_project" ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap">
                                  [New Project]
                                </span>
                                {order.project_title && (
                                  <span className="text-[10px] font-semibold text-zinc-200 truncate max-w-[120px]" title={order.project_title}>
                                    {order.project_title}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap">
                                [Bug Fix]
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Client / Student Email */}
                        <td className="py-4 px-4 font-mono text-zinc-300">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                              <span className="font-semibold text-white">{order.contact_handle}</span>
                            </div>
                            {order.user_email ? (
                              <span className="text-[10px] text-zinc-400 truncate max-w-[160px]" title={order.user_email}>
                                {order.user_email}
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-600">Guest Order</span>
                            )}
                          </div>
                        </td>

                        {/* Tech Stack */}
                        <td className="py-4 px-4">
                          <span className="inline-block px-2 py-0.5 rounded bg-[#09090b] border border-[#27272a] text-zinc-300 font-mono text-[11px] whitespace-nowrap">
                            {order.tech_stack}
                          </span>
                        </td>

                        {/* Issue Description / Project Specs */}
                        <td className="py-4 px-4 max-w-xs">
                          <p className="text-zinc-300 font-mono text-[11px] line-clamp-2" title={order.requirements || order.issue_description}>
                            {order.requirements || order.issue_description}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {renderStatusBadge(order.status)}
                        </td>

                        {/* Payment & Quote */}
                        <td className="py-4 px-4">
                          {renderPaymentQuoteCell(order)}
                        </td>

                        {/* Direct Download Client File with Format Badge */}
                        <td className="py-4 px-4">
                          {renderFileCell(order, order.service_type === "custom_project")}
                        </td>

                        {/* ACTION BUTTONS PER ROW */}
                        <td className="py-4 px-4 text-right">
                          {renderRowActions(order)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* UPLOAD / REUPLOAD MODAL FOR PROOF VIDEO & FIXED ZIP */}
      {isModalOpen && activeModalOrder && uploadType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg p-6 rounded-3xl bg-[#18181b] border border-[#27272a] shadow-2xl relative glow-orange-border text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500">
                  {uploadType === "video" ? <Video className="w-5 h-5 text-cyan-400" /> : <Upload className="w-5 h-5 text-orange-500" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {uploadType === "video" 
                      ? "Upload Verified Proof Video" 
                      : (activeModalOrder.deliverable_url || activeModalOrder.fixed_zip_url 
                          ? "Reupload Fixed Solution (Deliverables Bucket)" 
                          : "Upload Fixed Solution (Deliverables Bucket)")}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Order Reference: #{activeModalOrder.order_code} • Bucket: deliverables
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setActiveModalOrder(null);
                  setUploadType(null);
                  setSelectedFile(null);
                  setUploadError(null);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUploadSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-2">
                  {uploadType === "video" ? "Select MP4 / WebM Execution Recording" : "Select Fixed Project Archive / Solution Code for Deliverables Bucket"}
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept={uploadType === "video" ? "video/mp4,video/webm,video/*" : ".zip,.rar,.tar.gz,.7z,.py,.c,.cpp,.java,.js,.ts,.jsx,.tsx,.html,.css,.sql,.doc,.docx,.pdf,.txt,.md"}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files[0]) {
                      setSelectedFile(files[0]);
                      setUploadError(null);
                    }
                  }}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 file:cursor-pointer cursor-pointer bg-[#09090b] border border-[#27272a] rounded-xl p-2"
                />

                {selectedFile && (
                  <div className="mt-2 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setActiveModalOrder(null);
                    setUploadType(null);
                    setSelectedFile(null);
                    setUploadError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-zinc-300 text-xs font-semibold border border-[#27272a] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.35)] hover:shadow-[0_0_25px_rgba(249,115,22,0.55)] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{uploadType === "video" ? "Uploading Video..." : "Uploading to Deliverables Bucket..."}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadType === "video" ? "Confirm & Publish Video" : "Confirm Reupload"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
