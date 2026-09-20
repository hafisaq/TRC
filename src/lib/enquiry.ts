const ENQUIRY_EMAIL = import.meta.env.VITE_ENQUIRY_EMAIL || "hello@theretreatcollection.com";
// The site ships its own endpoint (public/api/enquiry.php on the host). In
// local dev there is no PHP, so the request fails and the caller falls back.
const ENQUIRY_ENDPOINT = import.meta.env.VITE_ENQUIRY_ENDPOINT || (import.meta.env.PROD ? "/api/enquiry.php" : "");

const getValue = (formData: FormData, key: string) => String(formData.get(key) || "").trim();

const buildMailtoHref = (formData: FormData, source: string) => {
  const name = getValue(formData, "name") || "Website visitor";
  const email = getValue(formData, "email");
  const interest = getValue(formData, "interest") || "Not selected";
  const message = getValue(formData, "message");
  const subject = encodeURIComponent(`New ${source} enquiry from ${name}`);
  const body = encodeURIComponent(
    [
      `Name: ${name}`,
      `Email: ${email}`,
      `Interest: ${interest}`,
      source ? `Source: ${source}` : "",
      message ? `Message: ${message}` : ""
    ]
      .filter(Boolean)
      .join("\n")
  );

  return `mailto:${ENQUIRY_EMAIL}?subject=${subject}&body=${body}`;
};

// when the endpoint cannot be reached the traveller's own mail app opens
// with everything filled in, so the enquiry is never lost
export function openMailFallback(form: HTMLFormElement, source: string) {
  window.location.href = buildMailtoHref(new FormData(form), source);
}

export async function submitEnquiry(form: HTMLFormElement, source: string) {
  const formData = new FormData(form);

  if (ENQUIRY_ENDPOINT) {
    formData.set("source", source);
    const response = await fetch(ENQUIRY_ENDPOINT, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Enquiry submission failed");
    }

    return;
  }

  openMailFallback(form, source);
}
