 "use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
};

type ResourceFormProps = {
  categories: Category[];
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
];

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".pptx",
  ".xlsx",
  ".zip",
];

function getFileExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? `.${parts.pop()}` : "";
}

function getSafeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourceForm({
  categories,
}: ResourceFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [format, setFormat] = useState("PDF");
  const [pricingModel, setPricingModel] = useState("paid");
  const [price, setPrice] = useState("100");
  const [status, setStatus] = useState("published");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slug || slug === createSlug(title)) {
      setSlug(createSlug(value));
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setErrorMessage("");
    setSuccessMessage("");

    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setErrorMessage(
        "The selected file is too large. The maximum allowed size is 50 MB.",
      );
      return;
    }

    const extension = getFileExtension(file.name);

    if (
      !ALLOWED_FILE_TYPES.includes(file.type) &&
      !ALLOWED_EXTENSIONS.includes(extension)
    ) {
      setSelectedFile(null);
      setErrorMessage(
        "Unsupported file type. Please upload PDF, DOCX, PPTX, XLSX or ZIP.",
      );
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!title.trim()) {
      setErrorMessage("Please enter a resource title.");
      return;
    }

    if (!slug.trim()) {
      setErrorMessage("Please enter a resource slug.");
      return;
    }

    if (!categoryId) {
      setErrorMessage("Please select a category.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Please select the resource file to upload.");
      return;
    }

    if (pricingModel === "paid") {
      const numericPrice = Number(price);

      if (!Number.isFinite(numericPrice) || numericPrice < 0) {
        setErrorMessage("Please enter a valid resource price.");
        return;
      }
    }

    setIsSubmitting(true);

    let createdResourceId: string | null = null;
    let uploadedStoragePath: string | null = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const numericPrice =
        pricingModel === "paid" ? Number(price) : 0;

      const { data: resource, error: resourceError } = await supabase
        .from("resources")
        .insert({
          title: title.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          category_id: categoryId,
          format,
          pricing_model: pricingModel,
          price: numericPrice,
          status,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (resourceError) {
        throw new Error(resourceError.message);
      }

      if (!resource) {
        throw new Error("The resource could not be created.");
      }

      createdResourceId = resource.id;

      const safeFileName =
        getSafeFileName(selectedFile.name) || "resource-file";

      const storagePath = `${slug.trim()}/${crypto.randomUUID()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType:
            selectedFile.type || "application/octet-stream",
        });

      if (uploadError) {
        throw new Error(
          `Resource was created, but file upload failed: ${uploadError.message}`,
        );
      }

      uploadedStoragePath = storagePath;

      const { error: fileRecordError } = await supabase
        .from("resource_files")
        .insert({
          resource_id: resource.id,
          storage_path: storagePath,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type:
            selectedFile.type || "application/octet-stream",
        });

      if (fileRecordError) {
        throw new Error(
          `File uploaded, but the file record could not be saved: ${fileRecordError.message}`,
        );
      }

      setSuccessMessage(
        "Resource created and file uploaded successfully.",
      );

      setTitle("");
      setSlug("");
      setDescription("");
      setCategoryId("");
      setFormat("PDF");
      setPricingModel("paid");
      setPrice("100");
      setStatus("published");
      setSelectedFile(null);

      const fileInput = document.getElementById(
        "resource-file",
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      setTimeout(() => {
        router.push("/admin/resources");
        router.refresh();
      }, 800);
    } catch (error) {
      if (uploadedStoragePath) {
        await supabase.storage
          .from("resources")
          .remove([uploadedStoragePath]);
      }

      if (createdResourceId) {
        await supabase
          .from("resource_files")
          .delete()
          .eq("resource_id", createdResourceId);

        await supabase
          .from("resources")
          .delete()
          .eq("id", createdResourceId);
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the resource.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <XCircle className="mt-0.5 shrink-0" size={20} />
          <div>
            <p className="font-bold">Unable to create resource</p>
            <p className="mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2
            className="mt-0.5 shrink-0"
            size={20}
          />
          <div>
            <p className="font-bold">Success</p>
            <p className="mt-1">{successMessage}</p>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="resource-title"
          className="mb-2 block text-sm font-bold text-slate-900"
        >
          Resource title
        </label>

        <input
          id="resource-title"
          type="text"
          value={title}
          onChange={(event) =>
            handleTitleChange(event.target.value)
          }
          placeholder="e.g. Grade 6 Mathematics Term 1 Exams"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor="resource-slug"
          className="mb-2 block text-sm font-bold text-slate-900"
        >
          Slug
        </label>

        <input
          id="resource-slug"
          type="text"
          value={slug}
          onChange={(event) =>
            setSlug(createSlug(event.target.value))
          }
          placeholder="grade-6-mathematics-term-1-exams"
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label
          htmlFor="resource-description"
          className="mb-2 block text-sm font-bold text-slate-900"
        >
          Description
        </label>

        <textarea
          id="resource-description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Describe what this resource contains..."
          rows={6}
          className="w-full resize-y rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="resource-category"
            className="mb-2 block text-sm font-bold text-slate-900"
          >
            Category
          </label>

          <select
            id="resource-category"
            value={categoryId}
            onChange={(event) =>
              setCategoryId(event.target.value)
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            disabled={isSubmitting}
          >
            <option value="">
              Select a category
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="resource-format"
            className="mb-2 block text-sm font-bold text-slate-900"
          >
            Format
          </label>

          <select
            id="resource-format"
            value={format}
            onChange={(event) =>
              setFormat(event.target.value)
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            disabled={isSubmitting}
          >
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
            <option value="PPTX">PPTX</option>
            <option value="XLSX">XLSX</option>
            <option value="ZIP">ZIP</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="resource-pricing"
            className="mb-2 block text-sm font-bold text-slate-900"
          >
            Pricing
          </label>

          <select
            id="resource-pricing"
            value={pricingModel}
            onChange={(event) =>
              setPricingModel(event.target.value)
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            disabled={isSubmitting}
          >
            <option value="paid">Paid</option>
            <option value="free">Free</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="resource-price"
            className="mb-2 block text-sm font-bold text-slate-900"
          >
            Price (KES)
          </label>

          <input
            id="resource-price"
            type="number"
            min="0"
            step="1"
            value={pricingModel === "free" ? "0" : price}
            onChange={(event) =>
              setPrice(event.target.value)
            }
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-100"
            disabled={
              isSubmitting || pricingModel === "free"
            }
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="resource-status"
          className="mb-2 block text-sm font-bold text-slate-900"
        >
          Status
        </label>

        <select
          id="resource-status"
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          disabled={isSubmitting}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="resource-file"
          className="mb-2 block text-sm font-bold text-slate-900"
        >
          Resource file
        </label>

        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-emerald-400 hover:bg-emerald-50/30">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Upload size={25} />
            </div>

            <h3 className="mt-4 text-sm font-black text-slate-900">
              Upload your resource
            </h3>

            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
              PDF, DOCX, PPTX, XLSX or ZIP. Maximum file size:
              50 MB.
            </p>

            <label
              htmlFor="resource-file"
              className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <FileText size={17} />
              Choose file
            </label>

            <input
              id="resource-file"
              type="file"
              accept=".pdf,.docx,.pptx,.xlsx,.zip"
              onChange={handleFileChange}
              className="hidden"
              disabled={isSubmitting}
            />

            {selectedFile && (
              <div className="mt-5 flex w-full max-w-lg items-center gap-3 rounded-xl border border-emerald-200 bg-white p-4 text-left shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <FileText size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {selectedFile.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  disabled={isSubmitting}
                  aria-label="Remove selected file"
                >
                  <XCircle size={19} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/admin/resources")}
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />
              Creating resource...
            </>
          ) : (
            <>
              <Upload size={18} />
              Create Resource
            </>
          )}
        </button>
      </div>
    </form>
  );
}