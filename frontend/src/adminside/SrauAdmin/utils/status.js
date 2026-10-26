import { HANDLED_STATUSES, PENDING_REQUEST_STATUSES } from "../data/demoData.js";

export const normalizeStatus = (status) => String(status ?? "").trim().toLowerCase().replace(/\s+/g, " ");
export const isHandled = (item) => HANDLED_STATUSES.has(normalizeStatus(item.status));
export const isPendingRequest = (item) => PENDING_REQUEST_STATUSES.has(normalizeStatus(item.status));
