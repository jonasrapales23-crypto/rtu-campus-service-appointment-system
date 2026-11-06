// Client-side upload check. Returns null when no file is chosen, otherwise
// { ok, reason }. The content check (NLP) will be added by the backend;
// when it is connected, merge its result with this one.

const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_BYTES = 5 * 1024 * 1024;

export function checkUpload(file) {
  if (!file) {
    return null;
  }

  const name = file.name.toLowerCase();

  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return {
      ok: false,
      reason: "Unsupported file type. Upload a PDF, JPG, JPEG, or PNG.",
    };
  }

  if (file.size === 0) {
    return { ok: false, reason: "The file is empty. Choose another file." };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, reason: "The file is larger than 5 MB." };
  }

  return { ok: true, reason: "" };
}
