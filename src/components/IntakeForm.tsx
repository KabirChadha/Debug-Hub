"use client";

import React, { useState, useEffect, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  FileArchive, 
  FileCode2,
  FileText,
  Database,
  Terminal,
  X, 
  AlertTriangle, 
  Lock, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  MessageSquare,
  Mail,
  Sparkles
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Toast } from "./Toast";
import { MagicLinkAuth } from "./MagicLinkAuth";

const TECH_STACK_OPTIONS = [
  "Python/Flask",
  "React/Next.js",
  "Java/Spring",
  "C/C++",
  "MySQL/PostgreSQL",
  "Other",
] as const;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

const ACCEPTED_EXTENSIONS = [
  // Archives
  ".zip", ".rar", ".tar.gz", ".7z", ".gz", ".tar",
  // Code files
  ".py", ".c", ".cpp", ".java", ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".sql",
  // Documents
  ".docx", ".doc", ".pdf", ".txt", ".md"
];

const ACCEPT_ATTRIBUTE =
  ".zip,.rar,.tar.gz,.7z,.py,.c,.cpp,.java,.js,.ts,.jsx,.tsx,.html,.css,.sql,.doc,.docx,.pdf,.txt,.md";

/**
 * Returns dynamic UI badge and icon for selected file format
 */
function getFileInfo(fileName: string) {
  const lower = fileName.toLowerCase();

  if (lower.endsWith(".py")) {
    return {
      type: "Python Source",
      badge: "[.PY]",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: Terminal,
      iconColor: "text-amber-400",
    };
  }
  if (lower.endsWith(".c") || lower.endsWith(".cpp")) {
    const ext = lower.endsWith(".cpp") ? "[.CPP]" : "[.C]";
    return {
      type: "C / C++ Source",
      badge: ext,
      badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      icon: FileCode2,
      iconColor: "text-sky-400",
    };
  }
  if (lower.endsWith(".java")) {
    return {
      type: "Java Source",
      badge: "[.JAVA]",
      badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
      icon: FileCode2,
      iconColor: "text-red-400",
    };
  }
  if (lower.endsWith(".ts") || lower.endsWith(".tsx") || lower.endsWith(".js") || lower.endsWith(".jsx")) {
    const ext = lower.slice(lower.lastIndexOf(".")).toUpperCase();
    return {
      type: "JavaScript / TypeScript",
      badge: `[${ext}]`,
      badgeClass: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
      icon: FileCode2,
      iconColor: "text-yellow-400",
    };
  }
  if (lower.endsWith(".sql")) {
    return {
      type: "SQL Script / Schema",
      badge: "[.SQL]",
      badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      icon: Database,
      iconColor: "text-purple-400",
    };
  }
  if (lower.endsWith(".html") || lower.endsWith(".css")) {
    const ext = lower.slice(lower.lastIndexOf(".")).toUpperCase();
    return {
      type: "Web Markup / Styling",
      badge: `[${ext}]`,
      badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      icon: FileCode2,
      iconColor: "text-orange-400",
    };
  }
  if (lower.endsWith(".pdf")) {
    return {
      type: "PDF Document",
      badge: "[.PDF]",
      badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      icon: FileText,
      iconColor: "text-rose-400",
    };
  }
  if (lower.endsWith(".doc") || lower.endsWith(".docx")) {
    const ext = lower.endsWith(".docx") ? "[.DOCX]" : "[.DOC]";
    return {
      type: "Word Document",
      badge: ext,
      badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      icon: FileText,
      iconColor: "text-blue-400",
    };
  }
  if (lower.endsWith(".md") || lower.endsWith(".txt")) {
    const ext = lower.slice(lower.lastIndexOf(".")).toUpperCase();
    return {
      type: "Text / Markdown Document",
      badge: `[${ext}]`,
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: FileText,
      iconColor: "text-emerald-400",
    };
  }

  // Default Archive
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".")).toUpperCase() : "[.ZIP]";
  return {
    type: "Project Archive",
    badge: ext.startsWith("[") ? ext : `[${ext}]`,
    badgeClass: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    icon: FileArchive,
    iconColor: "text-orange-400",
  };
}

import type { User } from "@supabase/supabase-js";

export function IntakeForm() {
  const router = useRouter();

  // User state
  const [user, setUser] = useState<User | null>(null);

  // Form states
  const [contactHandle, setContactHandle] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [techStack, setTechStack] = useState<string>("React/Next.js");
  const [customStack, setCustomStack] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  
  // File upload states
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Submission & progress states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [copiedCode, setCopiedCode] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check user session
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        if (data.user.email) {
          setStudentEmail(data.user.email);
          setContactHandle((prev) => prev || data.user.email?.split("@")[0] || "");
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        setStudentEmail(session.user.email);
        setContactHandle((prev) => prev || session.user.email?.split("@")[0] || "");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Generate random 6-character tracking code (e.g., FIX-4921)
  const generateTrackingCode = (): string => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `FIX-${randomDigits}`;
  };

  // Validate and set file
  const validateAndSetFile = (selectedFile: File) => {
    setFileError(null);
    const fileName = selectedFile.name.toLowerCase();
    const isValidExtension = ACCEPTED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (!isValidExtension) {
      setFileError(
        "Invalid format. Please upload a code file (.py, .c, .cpp, .java, .js, .sql), document (.docx, .pdf, .txt, .md), or archive (.zip, .rar, .7z)."
      );
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
      setFileError(`File too large (${sizeMB}MB). Max permitted file size is 50MB. Tip: delete node_modules or large build assets.`);
      return false;
    }

    setFile(selectedFile);
    return true;
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFileError(null);

    if (!file) {
      setFileError("Please attach your project archive or source file so our engineers can test it.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(10);
    setStatusMessage("Generating secure sandbox tracking code...");

    const orderCode = generateTrackingCode();
    const chosenStack = techStack === "Other" && customStack.trim() ? customStack.trim() : techStack;
    
    // Preserve original filename, sanitizing for storage key
    const originalFileName = file.name;
    const sanitizedFileName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `raw/${orderCode}/${sanitizedFileName}`;

    try {
      // 1. Upload file directly to Supabase storage 'project-intakes'
      setStatusMessage(`Uploading ${originalFileName} to 'project-intakes'...`);
      
      const supabase = createClient();
      
      // Simulate stepped progress during upload
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 250);

      const { error: uploadError } = await supabase.storage
        .from("project-intakes")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || "application/octet-stream",
        });

      clearInterval(progressTimer);
      setUploadProgress(90);

      if (uploadError) {
        console.warn("Storage upload notice (dev mode fallback):", uploadError.message);
      }

      // 2. Insert order record into the 'orders' table via API handler
      setStatusMessage("Registering intake ticket into orders database...");
      setUploadProgress(95);

      const enteredEmail = studentEmail.trim().toLowerCase();
      const effectiveUserEmail =
        user?.email ||
        (enteredEmail && enteredEmail.includes("@") && enteredEmail.includes(".") ? enteredEmail : null) ||
        (contactHandle.includes("@") && contactHandle.includes(".") ? contactHandle.trim().toLowerCase() : null);

      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_code: orderCode,
          contact_handle: contactHandle.trim() || effectiveUserEmail || "@anonymous_student",
          tech_stack: chosenStack,
          issue_description: issueDescription.trim(),
          file_name: originalFileName,
          file_storage_path: storagePath,
          zip_storage_path: storagePath,
          user_id: user?.id || null,
          user_email: effectiveUserEmail,
          payment_status: "unpaid",
          status: "submitted",
        }),
      });

      setUploadProgress(100);
      setStatusMessage("Order confirmed! Copying code to clipboard...");

      // 3. Copy tracking code to clipboard
      try {
        await navigator.clipboard.writeText(orderCode);
      } catch (clipErr) {
        console.warn("Clipboard auto-write warning:", clipErr);
      }

      setCopiedCode(orderCode);
      setToastVisible(true);

      // 4. Redirect immediately to /order/[order_code]
      setTimeout(() => {
        router.push(`/order/${orderCode}?copied=true`);
      }, 650);

    } catch (err: unknown) {
      console.error("Intake submission error:", err);
      // Even if network glitches, ensure student is navigated with their generated code
      setCopiedCode(orderCode);
      setToastVisible(true);
      setTimeout(() => {
        router.push(`/order/${orderCode}?copied=true`);
      }, 700);
    }
  };

  return (
    <>
      <Toast
        isVisible={toastVisible}
        message={`Tracking Code ${copiedCode} Copied!`}
        submessage="Your code was copied to clipboard. Redirecting to your live dashboard..."
        onClose={() => setToastVisible(false)}
      />

      <div className="w-full rounded-3xl bg-[#18181b] border border-[#27272a] shadow-2xl p-6 sm:p-10 text-left relative overflow-hidden glow-orange-border">
        {/* Ambient Top Edge Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-80" />

        {/* Form Title & Student Privacy Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#27272a] gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs text-orange-400 font-mono mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>DIRECT DISPATCH INTAKE</span>
            </div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              Submit Broken Code for 1–2 Hr Triage
            </h3>
            <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1">
              Flat rate <strong className="text-orange-400">₹400</strong> • Guaranteed run or ₹0 charge. Includes verified proof recording.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#09090b] border border-[#27272a] text-xs text-zinc-300 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>100% Anonymous &amp; Encrypted</span>
          </div>
        </div>

        {/* Auth Integration Banner */}
        {user ? (
          <div className="flex items-center justify-between p-3.5 mb-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>
                Authenticated as <strong className="font-mono text-white">{user.email}</strong> • Order will bind to your personal dashboard automatically
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-orange-400 flex items-center gap-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SAVE ORDER TO DASHBOARD (OPTIONAL 1-CLICK MAGIC LINK)</span>
              </span>
              <span className="text-zinc-500 text-[11px] hidden sm:inline">Passwordless Email Login</span>
            </div>
            <MagicLinkAuth
              compact={true}
              initialEmail={studentEmail}
              onSuccess={(em) => setStudentEmail(em)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-7">
          
          {/* Field 1: Anonymous Alias + Optional Student Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-2">
                1. Anonymous Alias / Handle <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={contactHandle}
                  onChange={(e) => setContactHandle(e.target.value)}
                  placeholder="@student_telegram or anon_alias"
                  className="w-full bg-[#09090b] border border-[#27272a] text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono placeholder:text-zinc-600"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Zero college roll numbers required.</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-2">
                Student Email <span className="text-zinc-500 text-[10px] font-normal lowercase">(college or personal Gmail)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@college.edu or gmail.com"
                  className="w-full bg-[#09090b] border border-[#27272a] text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono placeholder:text-zinc-600"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-orange-400" />
                <span>Auto-binds order to your /dashboard for Magic Link retrieval.</span>
              </p>
            </div>
          </div>

          {/* Field 2: Tech Stack selector (Pill buttons) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-2.5">
              2. Tech Stack Selector <span className="text-red-400">*</span>
            </label>
            
            <div className="flex flex-wrap gap-2.5">
              {TECH_STACK_OPTIONS.map((stack) => {
                const isSelected = techStack === stack;
                return (
                  <button
                    key={stack}
                    type="button"
                    onClick={() => setTechStack(stack)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer border ${
                      isSelected
                        ? "bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-105"
                        : "bg-[#09090b] text-zinc-300 border-[#27272a] hover:border-zinc-600 hover:text-white"
                    }`}
                  >
                    {stack}
                  </button>
                );
              })}
            </div>

            {/* Custom stack text if Other is picked */}
            {techStack === "Other" && (
              <div className="mt-3 animate-in fade-in duration-150">
                <input
                  type="text"
                  required
                  value={customStack}
                  onChange={(e) => setCustomStack(e.target.value)}
                  placeholder="Specify stack (e.g. Flutter, Django, Rust, PyTorch)..."
                  className="w-full bg-[#09090b] border border-[#27272a] text-white text-xs sm:text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono placeholder:text-zinc-600"
                />
              </div>
            )}
          </div>

          {/* Field 3: Issue Description Textarea */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-2">
              3. Issue Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="What is crashing or failing to run before your review? (Paste terminal error stack trace, failing commands, broken dependencies, or exit codes...)"
              className="w-full bg-[#09090b] border border-[#27272a] text-white text-xs sm:text-sm rounded-xl p-3.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono placeholder:text-zinc-600 leading-relaxed"
            />
          </div>

          {/* Field 4: Drag-and-drop file uploader with dynamic icon & badge feedback */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-2">
              4. Upload project archive (.zip, .rar) or source files (.py, .c, .cpp, .docx, .pdf, etc.) <span className="text-red-400">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 group ${
                  isDragging
                    ? "border-orange-500 bg-orange-500/10 shadow-[0_0_25px_rgba(249,115,22,0.3)]"
                    : "border-[#27272a] bg-[#09090b] hover:border-orange-500/50 hover:bg-[#18181b]/50"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#18181b] border border-[#27272a] group-hover:border-orange-500/60 flex items-center justify-center text-orange-500 mx-auto mb-3 transition-colors shadow-inner">
                  <Upload className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform" />
                </div>
                <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
                  Drag &amp; drop project archive or source file here, or <span className="text-orange-400 underline underline-offset-4">browse</span>
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                  Supports code (.py, .c, .cpp, .java, .js, .sql), documents (.docx, .pdf, .txt, .md), and archives (.zip, .rar) up to 50MB.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 bg-[#18181b] px-3 py-1 rounded-full border border-[#27272a]">
                  <span>🔒 Direct storage upload to `project-intakes`</span>
                </div>
              </div>
            ) : (() => {
              const fileInfo = getFileInfo(file.name);
              const FileIcon = fileInfo.icon;
              const isSizeInMB = file.size >= 1024 * 1024;
              const formattedSize = isSizeInMB 
                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
                : `${(file.size / 1024).toFixed(1)} KB`;

              return (
                <div className="p-4 rounded-2xl bg-[#09090b] border border-orange-500/40 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center flex-shrink-0 shadow-inner">
                      <FileIcon className={`w-5 h-5 ${fileInfo.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${fileInfo.badgeClass}`}>
                          {fileInfo.badge}
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-white truncate block">
                          {file.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 font-mono mt-0.5 block">
                        {formattedSize} • <strong className="text-zinc-300 font-normal">{fileInfo.type}</strong> • Ready for sandbox mount
                      </span>
                    </div>
                  </div>

                  {!isSubmitting && (
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer flex-shrink-0"
                      title="Remove File"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })()}

            {/* File Error Message */}
            {fileError && (
              <div className="mt-2.5 p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Upload Progress Indicator */}
            {isSubmitting && (
              <div className="mt-4 p-4 rounded-xl bg-[#09090b] border border-[#27272a] space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-orange-400 font-semibold flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    {statusMessage}
                  </span>
                  <span className="text-white font-bold">{uploadProgress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.6)]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Guarantee Reminder & Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-[#27272a]">
            <div className="flex items-center gap-2.5 text-xs text-zinc-400">
              <ShieldCheck className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <span>
                <strong className="text-white">Flat Rate • ₹400 • No Run = ₹0 Charged:</strong> Pay only after verified proof.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all duration-200 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isSubmitting ? "Dispatching To Engineer..." : "Submit For Instant Debug"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
