// Accessible modal dialogs on top of <dialog>: native focus trap, ESC to close, focus returns to the opener.
import { h } from "./dom.js";
import { t } from "./i18n.js";

let count = 0;

export const dialogSupported = () => typeof HTMLDialogElement === "function" && typeof HTMLDialogElement.prototype.showModal === "function";

/** openDialog({ title, body: Node|Node[], returnFocus?, className? }) -> { dialog, body, close, setTitle } */
export function openDialog({ title, body, returnFocus, className }) {
  const opener = returnFocus || document.activeElement;
  const id = "dlg" + ++count;
  const titleEl = h("h2", { id: id + "-t", text: title });
  const closeBtn = h("button", { type: "button", class: "btn btn-ghost", "aria-label": t("dialog.close"), onclick: () => close() }, "✕ " + t("dialog.close"));
  const bodyEl = h("div", { class: "dialog-body" }, body);
  const dialog = h("dialog", { "aria-labelledby": id + "-t", class: className || "" }, h("div", { class: "dialog-head" }, titleEl, closeBtn), bodyEl);
  document.body.append(dialog);
  const onCancelled = () => cleanup();
  const cleanup = () => {
    dialog.remove();
    if (opener && document.contains(opener)) { try { opener.focus(); } catch { /* ignore */ } }
  };
  dialog.addEventListener("close", onCancelled);
  dialog.addEventListener("click", (e) => { if (e.target === dialog) close(); });
  const close = () => { if (dialog.open) dialog.close(); else cleanup(); };
  dialog.showModal();
  closeBtn.focus();
  return { dialog, body: bodyEl, close, setTitle: (s) => { titleEl.textContent = s; } };
}

/** Yes/no confirmation. Resolves true when confirmed. */
export function confirmDialog({ title, message, confirmLabel, cancelLabel }) {
  return new Promise((resolve) => {
    let result = false;
    const yes = h("button", { type: "button", class: "btn btn-primary", onclick: () => { result = true; d.close(); } }, confirmLabel || t("dialog.ok"));
    const no = h("button", { type: "button", class: "btn", onclick: () => d.close() }, cancelLabel || t("dialog.cancel"));
    const d = openDialog({ title, body: [h("p", { text: message }), h("div", { class: "btn-row" }, yes, no)] });
    d.dialog.addEventListener("close", () => resolve(result));
  });
}
