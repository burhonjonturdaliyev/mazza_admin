import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  FileText,
  Images,
  LoaderCircle,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import "./PropertiesBookings.css";
import { adminFetch } from "../auth";
const API_URL = "https://mazzajoy.uz/api/v1/admin/platform/";
const MEDIA_URL = "https://mazzajoy.uz/media/";
type Property = {
  id: number;
  name: string;
  is_active: boolean;
  moderation_status?: string;
  is_banner?: boolean;
  is_famous?: boolean;
  is_best_offer?: boolean;
  is_recommended?: boolean;
  rating: number | null;
  user__phone: string | null;
  user__first_name?: string | null;
  region__name: string | null;
  category__name: string | null;
  info?: string | null;
  address?: string | null;
  phone?: string | null;
  stir?: string | null;
  id_passport?: string | null;
  cadastor?: string | null;
  contract_pechat?: string | null;
  is_property_owner?: boolean;
  property_owner_phone?: string | null;
  images?: string[];
  image?: string | null;
  media?: string[];
  pending_changes?: Record<string, unknown>;
  room_reviews?: RoomReview[];
};
type RoomReview = {
  id: number;
  name: string;
  price: number | string;
  moderation_status: "pending" | "pending_delete";
  pending_changes?: Record<string, unknown>;
};
type Booking = {
  id: number;
  status: string;
  payment: number | string | null;
  is_paid: boolean;
  is_active?: boolean;
  payment_expires_at?: string | null;
  date_access: string | null;
  date_exit: string | null;
  user__phone: string | null;
  item__property__name: string | null;
};
const msg = (e: unknown) =>
  e instanceof Error ? e.message : "Kutilmagan xatolik yuz berdi.";
const money = (v: number | string | null) =>
  `${new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 }).format(Number(v ?? 0))} so‘m`;
const date = (v: string | null) => {
  if (!v) return "—";
  const parsed = new Date(`${v.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "—";
  const months = [
    "yan", "fev", "mar", "apr", "may", "iyun",
    "iyul", "avg", "sen", "okt", "noy", "dek",
  ];
  return `${String(parsed.getDate()).padStart(2, "0")} ${months[parsed.getMonth()]} ${parsed.getFullYear()}`;
};
const countdown = (expiresAt?: string | null) => {
  const seconds = Math.max(
    0,
    Math.floor((new Date(expiresAt || 0).getTime() - Date.now()) / 1000),
  );
  return seconds
    ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")} qoldi`
    : "To‘lov vaqti tugagan";
};
const mediaUrl = (path?: string | null) =>
  !path
    ? ""
    : /^https?:\/\//.test(path)
      ? path
      : `${MEDIA_URL}${path.replace(/^\//, "")}`;
const propertyFieldLabel = (field: string) =>
  ({
    name: "Nomi", info: "Tavsif", address: "Manzil", price: "Narx",
    phone: "Aloqa telefoni", phone_message: "Xabar telefoni", stir: "STIR",
    shot_number: "Shot raqami", cadastor_number: "Kadastr raqami",
    region_id: "Hudud", category_id: "Kategoriya", lat: "Kenglik", lon: "Uzunlik",
    tags: "Teglar", cancellation_policy: "Bekor qilish siyosati",
    comfortable: "Qulayliklar", is_items_null: "Xona turi", is_property_owner: "Mulk egasi",
    property_owner_phone: "Mulk egasi telefoni", image: "Muqova rasmi", images: "Mulk rasmlari",
  } as Record<string, string>)[field] || field;
const propertyChangeValue = (value: unknown) => {
  if (typeof value === "boolean") return value ? "Ha" : "Yo‘q";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

export function PropertiesBookings({
  section,
  token: _token,
  query,
}: {
  section: "properties" | "bookings";
  token: string;
  query: string;
}) {
  const [properties, setProperties] = useState<Property[]>([]),
    [bookings, setBookings] = useState<Booking[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState<number | null>(null),
    [selected, setSelected] = useState<Property | null>(null),
    [reason, setReason] = useState("");
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await adminFetch(`${API_URL}?section=${section}`),
        d = await r.json().catch(() => ({}));
      if (!r.ok) throw Error(d.detail || "Ma’lumotlarni yuklab bo‘lmadi");
      if (section === "properties") {
        setProperties(Array.isArray(d.results) ? d.results : []);
      } else {
        setBookings(Array.isArray(d.results) ? d.results : []);
      }
    } catch (e) {
      setError(msg(e));
    } finally {
      setLoading(false);
    }
  }, [section]);
  useEffect(() => {
    void load();
  }, [load]);
  const needle = query.toLowerCase(),
    props = useMemo(
      () =>
        properties.filter((x) =>
          [x.name, x.user__phone, x.region__name, x.category__name].some((v) =>
            v?.toLowerCase().includes(needle),
          ),
        ),
      [properties, needle],
    ),
    books = useMemo(
      () =>
        bookings.filter((x) =>
          [x.item__property__name, x.user__phone, x.status, String(x.id)].some(
            (v) => v?.toLowerCase().includes(needle),
          ),
        ),
      [bookings, needle],
    );
  const moderation = (p: Property) => {
    const value = p.moderation_status?.toLowerCase();
    if (value === "pending_delete")
      return { label: "O‘chirish so‘rovi", tone: "delete" };
    if (["pending_update", "pending_edit"].includes(value || ""))
      return { label: "Tahrirlash so‘rovi", tone: "update" };
    if (
      ["pending", "submitted", "review"].includes(value || "") ||
      (!p.is_active && value !== "rejected")
    )
      return { label: "Admin tasdig‘i kutilmoqda", tone: "pending" };
    if (value === "rejected" || !p.is_active)
      return { label: "Rad etilgan", tone: "rejected" };
    return { label: "Tasdiqlangan", tone: "approved" };
  };
  const moderationCounts = useMemo(
    () => ({
      pending: props.filter(
        (p) =>
          moderation(p).tone === "pending" ||
          moderation(p).tone === "delete" ||
          moderation(p).tone === "update" ||
          Boolean(p.room_reviews?.length),
      ).length,
      approved: props.filter((p) => moderation(p).tone === "approved").length,
      rejected: props.filter((p) => moderation(p).tone === "rejected").length,
    }),
    [props],
  );
  const bookingState = (booking: Booking) => {
    const raw = booking.status?.toLowerCase() || "";
    if (booking.is_paid || raw.includes("paid") || raw.includes("to‘langan"))
      return { label: "To‘langan", tone: "paid" };
    if (booking.is_active === false || raw.includes("expired"))
      return { label: "Muddati tugagan", tone: "expired" };
    if (raw.includes("reject") || raw.includes("cancel") || raw.includes("rad"))
      return { label: "Rad etilgan", tone: "rejected" };
    return { label: "To‘lov kutilmoqda", tone: "pending" };
  };
  const bookingCounts = useMemo(() => {
    const counts = { pending: 0, paid: 0, expired: 0 };
    books.forEach((booking) => {
      const tone = bookingState(booking).tone;
      if (tone === "pending") counts.pending += 1;
      if (tone === "paid") counts.paid += 1;
      if (tone === "expired" || tone === "rejected") counts.expired += 1;
    });
    return counts;
  }, [books]);
  const images = (p: Property) =>
    [...(p.images || []), ...(p.media || []), p.image].filter(
      (v): v is string => Boolean(v),
    );
  async function action(body: Record<string, unknown>, id: number) {
    setBusy(id);
    setError("");
    try {
      const r = await adminFetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        d = await r.json().catch(() => ({}));
      if (!r.ok) throw Error(d.detail || "Amal bajarilmadi");
      return true;
    } catch (e) {
      setError(msg(e));
      return false;
    } finally {
      setBusy(null);
    }
  }
  async function review(p: Property, decision: "approved" | "rejected") {
    if (decision === "rejected" && !reason.trim()) {
      setError("Rad etish sababini kiriting.");
      return;
    }
    if (
      await action(
        {
          action: "review_property",
          property_id: p.id,
          decision,
          reason: reason.trim(),
        },
        p.id,
      )
    ) {
      if (p.moderation_status === "pending_delete" && decision === "approved") {
        setProperties((old) => old.filter((x) => x.id !== p.id));
      } else {
        setProperties((old) =>
          old.map((x) =>
            x.id === p.id
              ? {
                  ...x,
                  is_active: decision === "approved",
                  moderation_status: decision,
                }
              : x,
          ),
        );
      }
      setSelected(null);
      setReason("");
    }
  }
  async function reviewRoom(
    room: RoomReview,
    decision: "approved" | "rejected",
  ) {
    if (decision === "rejected" && !reason.trim()) {
      setError("Rad etish sababini kiriting.");
      return;
    }
    if (
      await action(
        {
          action: "review_property_item",
          property_item_id: room.id,
          decision,
          reason: reason.trim(),
        },
        room.id,
      )
    ) {
      setSelected(null);
      setReason("");
      void load();
    }
  }
  async function visibility(
    p: Property,
    field: "is_banner" | "is_famous" | "is_best_offer" | "is_recommended",
  ) {
    const value = !p[field];
    if (
      await action(
        { action: "set_property_visibility", property_id: p.id, field, value },
        p.id,
      )
    )
      setProperties((old) =>
        old.map((x) => (x.id === p.id ? { ...x, [field]: value } : x)),
      );
  }
  async function toggle(p: Property) {
    const is_active = !p.is_active;
    if (
      !window.confirm(
        `“${p.name}” mulkini ${is_active ? "faollashtirish" : "to‘xtatish"}ni tasdiqlaysizmi?`,
      )
    )
      return;
    if (
      await action(
        { action: "set_property_status", property_id: p.id, is_active },
        p.id,
      )
    )
      setProperties((old) =>
        old.map((x) => (x.id === p.id ? { ...x, is_active } : x)),
      );
  }
  return (
    <section className="panel directory platform-directory">
      <div className="panel-head">
        <div>
          <h2>{section === "properties" ? "Mulklar" : "Bronlar"}</h2>
          <p>
            {section === "properties"
              ? "Har bir e’lonni hujjatlari va fotosi bilan tekshirib, keyin nashrga chiqaring."
              : "Platformadagi bronlar va to‘lov holatlarini kuzating."}
          </p>
        </div>
        <button
          className="refresh-button"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={loading ? "spin" : ""} size={16} /> Yangilash
        </button>
      </div>
      <div className="filter-row platform-filter-row">
        <span className="results-count">
          {loading
            ? "Yuklanmoqda…"
            : `${section === "properties" ? props.length : books.length} ta natija`}
        </span>
      </div>
      {section === "properties" && (
        <div className="moderation-summary">
          <div>
            <small>ADMIN JAVOBINI KUTMOQDA</small>
            <strong>{moderationCounts.pending}</strong>
          </div>
          <div>
            <small>TASDIQLANGAN</small>
            <strong>{moderationCounts.approved}</strong>
          </div>
          <div className="rejected">
            <small>RAD ETILGAN</small>
            <strong>{moderationCounts.rejected}</strong>
          </div>
        </div>
      )}
      {section === "bookings" && (
        <div className="booking-summary">
          <div className="summary-pending"><small>TO‘LOV KUTILMOQDA</small><strong>{bookingCounts.pending}</strong></div>
          <div className="summary-paid"><small>TO‘LANGAN</small><strong>{bookingCounts.paid}</strong></div>
          <div className="summary-expired"><small>MUDDATI TUGAGAN</small><strong>{bookingCounts.expired}</strong></div>
        </div>
      )}
      {error && (
        <div className="directory-message error-message">
          <CircleAlert size={19} />
          <div>
            <strong>Amal bajarilmadi</strong>
            <span>{error}</span>
          </div>
          <button onClick={() => void load()}>Qayta urinish</button>
        </div>
      )}
      {loading && <LoadingRows />}
      {!loading &&
        !error &&
        section === "properties" &&
        props.map((p) => {
          const state = moderation(p);
          const pending = state.tone === "pending" || state.tone === "delete";
          return (
            <article
              className={`platform-row property-row moderation-${state.tone}`}
              key={p.id}
            >
              <span className="entity-icon property-icon">
                <MapPin size={18} />
              </span>
              <div className="entity-main">
                <strong>{p.name}</strong>
                <small>
                  {p.category__name || "Kategoriya belgilanmagan"} ·{" "}
                  {p.region__name || "Hudud belgilanmagan"}
                </small>
              </div>
              <div className="entity-detail">
                <Phone size={13} />
                {p.user__phone || "—"}
              </div>
              <div className="entity-rating">★ {p.rating ?? "—"}</div>
              <span className={`moderation-pill ${state.tone}`}>
                {state.label}
              </span>
              {!!p.room_reviews?.length && (
                <span className="room-review-chip">
                  {p.room_reviews.length} ta xona so‘rovi
                </span>
              )}
              <div className="visibility-actions">
                <button
                  className="status-action details-action"
                  onClick={() => {
                    setSelected(p);
                    setReason("");
                  }}
                >
                  <FileText size={14} /> Ko‘rib chiqish
                </button>
                <button
                  className={
                    p.is_famous ? "status-action approve" : "status-action"
                  }
                  disabled={busy === p.id || pending}
                  onClick={() => void visibility(p, "is_famous")}
                >
                  Ommabop
                </button>
                <button
                  className={
                    p.is_best_offer ? "status-action approve" : "status-action"
                  }
                  disabled={busy === p.id || pending}
                  onClick={() => void visibility(p, "is_best_offer")}
                >
                  Eng yaxshi taklif
                </button>
                <button
                  className={
                    p.is_recommended ? "status-action approve" : "status-action"
                  }
                  disabled={busy === p.id || pending}
                  onClick={() => void visibility(p, "is_recommended")}
                >
                  Tavsiya etamiz
                </button>
                <button
                  className={
                    p.is_banner ? "status-action approve" : "status-action"
                  }
                  disabled={busy === p.id || pending}
                  onClick={() => void visibility(p, "is_banner")}
                >
                  Banner
                </button>
              </div>
              <button
                className={
                  p.is_active ? "status-action stop" : "status-action approve"
                }
                disabled={busy === p.id || pending}
                onClick={() => void toggle(p)}
              >
                {busy === p.id ? (
                  <LoaderCircle className="spin" size={16} />
                ) : p.is_active ? (
                  <X size={16} />
                ) : (
                  <Check size={16} />
                )}
                {p.is_active ? "To‘xtatish" : "Faollashtirish"}
              </button>
            </article>
          );
        })}
      {!loading &&
        !error &&
        section === "bookings" &&
        books.map((b) => {
          const state = bookingState(b);
          return (
          <article className="platform-row booking-row" key={b.id}>
            <span className="entity-icon booking-icon">
              <CalendarDays size={18} />
            </span>
            <div className="entity-main">
              <strong>{b.item__property__name || "Mulk ko‘rsatilmagan"}</strong>
              <small>
                Bron #{b.id} · {b.user__phone || "Mijoz telefoni yo‘q"}
              </small>
            </div>
            <div className="booking-dates">
              <span>{date(b.date_access)}</span>
              <ChevronRight size={14} />
              <span>{date(b.date_exit)}</span>
            </div>
            <div className="booking-payment">
              <strong>{money(b.payment)}</strong>
              <small>
                {b.is_paid
                  ? "To‘langan"
                  : b.is_active === false
                    ? "To‘lov vaqti tugagan"
                    : `To‘lov kutilmoqda · ${countdown(b.payment_expires_at)}`}
              </small>
            </div>
            <span className={`booking-status ${state.tone}`}>{state.label}</span>
            <span className={state.tone === "paid" ? "payment-mark paid" : "payment-mark"}>
              {state.tone === "paid" ? (
                <ShieldCheck size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
            </span>
          </article>
          );
        })}
      {!loading &&
        !error &&
        ((section === "properties" && !props.length) ||
          (section === "bookings" && !books.length)) && (
          <div className="directory-message empty-message">
            <Search size={22} />
            <div>
              <strong>Hech narsa topilmadi</strong>
              <span>Hozircha bu bo‘limda ma’lumot yo‘q.</span>
            </div>
          </div>
        )}
      {selected && (
        <div className="review-backdrop" onMouseDown={() => setSelected(null)}>
          <section
            className="review-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="review-title">
              <div>
                <p className="eyebrow">
                  {moderation(selected).tone === "delete"
                    ? "O‘CHIRISH SO‘ROVI"
                    : moderation(selected).tone === "update"
                      ? "TAHRIRLASH SO‘ROVI"
                      : "E’LON MODERATSIYASI"}
                </p>
                <h2>{selected.name}</h2>
                <small>
                  #{selected.id} ·{" "}
                  {selected.user__first_name || selected.user__phone || "Agent"}
                </small>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>
                <X size={19} />
              </button>
            </div>
            <div className="review-content">
              <div className="review-media">
                {images(selected).length ? (
                  images(selected)
                    .slice(0, 6)
                    .map((src, i) => (
                      <a
                        href={mediaUrl(src)}
                        target="_blank"
                        rel="noreferrer"
                        key={`${src}-${i}`}
                      >
                        <img
                          src={mediaUrl(src)}
                          alt={`${selected.name} ${i + 1}`}
                        />
                      </a>
                    ))
                ) : (
                  <div className="media-empty">
                    <Images size={25} />
                    <span>Rasmlar biriktirilmagan</span>
                  </div>
                )}
              </div>
              <div className="review-grid">
                <Info label="Kategoriya" value={selected.category__name} />
                <Info label="Hudud" value={selected.region__name} />
                <Info label="To‘liq manzil" value={selected.address} />
                <Info
                  label="Aloqa"
                  value={selected.phone || selected.user__phone}
                />
                <Info label="STIR" value={selected.stir} />
                <Info label="Kadastr" value={selected.cadastor} />
                <Info label="Pasport" value={selected.id_passport} />
                <Info
                  label="Mulk egasi"
                  value={
                    selected.is_property_owner === false
                      ? "Boshqa shaxs"
                      : "Agentning o‘zi"
                  }
                />
                {selected.is_property_owner === false && (
                  <Info
                    label="Egasi telefoni"
                    value={selected.property_owner_phone}
                  />
                )}
              </div>
              {moderation(selected).tone === "update" && (
                <section className="room-review-list property-change-list">
                  <div className="room-review-heading">
                    <div>
                      <small>ADMIN TASDIG‘I KUTILMOQDA</small>
                      <h3>So‘ralgan mulk o‘zgarishlari</h3>
                    </div>
                    <span>{Object.keys(selected.pending_changes || {}).length} ta maydon</span>
                  </div>
                  {Object.entries(selected.pending_changes || {}).length ? (
                    <div className="room-change-grid property-change-grid">
                      {Object.entries(selected.pending_changes || {}).map(([field, value]) => (
                        <div key={field}>
                          <small>{propertyFieldLabel(field)}</small>
                          <strong>{propertyChangeValue(value)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : <p>Agent tahrir so‘rovi yuborgan, ammo o‘zgargan maydonlar kelmadi.</p>}
                </section>
              )}
              {!!selected.room_reviews?.length && (
                <section className="room-review-list">
                  <div className="room-review-heading">
                    <div>
                      <small>ADMIN TASDIG‘I KUTILMOQDA</small>
                      <h3>Xona o‘zgarishlari</h3>
                    </div>
                    <span>{selected.room_reviews.length} ta so‘rov</span>
                  </div>
                  {selected.room_reviews.map((room) => {
                    const changes = Object.entries(room.pending_changes || {})
                      .filter(([key]) => key !== "existing")
                      .map(([key, value]) => [roomFieldLabel(key), value] as const);
                    const isDelete = room.moderation_status === "pending_delete";
                    const isNew = room.pending_changes?.existing === false;
                    return (
                      <article className="room-review-card" key={room.id}>
                        <div className="room-review-card-title">
                          <div>
                            <strong>{room.name}</strong>
                            <small>#{room.id} · {money(room.price)}</small>
                          </div>
                          <span className={isDelete ? "room-state delete" : "room-state"}>
                            {isDelete ? "O‘chirish" : isNew ? "Yangi xona" : "Tahrirlash"}
                          </span>
                        </div>
                        {!isDelete && !isNew && changes.length > 0 && (
                          <div className="room-change-grid">
                            {changes.map(([label, value]) => (
                              <div key={label}>
                                <small>{label}</small>
                                <strong>{formatChangeValue(value)}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                        {isNew && <p>Yangi xona nashr qilinishini kutmoqda.</p>}
                        {isDelete && <p>Agent ushbu xonani o‘chirishni so‘radi.</p>}
                        <div className="room-review-actions">
                          <button
                            className="reject-review"
                            disabled={busy === room.id}
                            onClick={() => void reviewRoom(room, "rejected")}
                          >
                            <X size={15} /> Rad etish
                          </button>
                          <button
                            className="approve-review"
                            disabled={busy === room.id}
                            onClick={() => void reviewRoom(room, "approved")}
                          >
                            <Check size={15} /> {isDelete ? "O‘chirishni tasdiqlash" : "Tasdiqlash"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </section>
              )}
              {selected.info && (
                <div className="review-description">
                  <strong>Tavsif</strong>
                  <p>{selected.info}</p>
                </div>
              )}
              <div className="review-documents">
                <strong>Biriktirilgan fayllar</strong>
                {(
                  [
                    ["ID / Pasport", selected.id_passport],
                    ["Kadastr", selected.cadastor],
                    ["Shartnoma va muhr", selected.contract_pechat],
                  ] as const
                ).map(([label, file]) =>
                  file ? (
                    <a
                      className="document-link"
                      href={mediaUrl(file)}
                      target="_blank"
                      rel="noreferrer"
                      key={label}
                    >
                      <FileText size={16} />
                      {label} faylini ochish
                    </a>
                  ) : (
                    <span className="document-missing" key={label}>
                      {label}: biriktirilmagan
                    </span>
                  ),
                )}
              </div>
              <label className="review-reason">
                Rad etish sababi <span>(rad etilganda majburiy)</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </label>
            </div>
            <div className="review-footer">
              <button
                className="reject-review"
                disabled={busy === selected.id}
                onClick={() => void review(selected, "rejected")}
              >
                <X size={16} />
                {moderation(selected).tone === "delete"
                  ? "O‘chirishni rad etish"
                  : moderation(selected).tone === "update"
                    ? "Tahrirni rad etish"
                    : "Rad etish"}
              </button>
              <button
                className="approve-review"
                disabled={busy === selected.id}
                onClick={() => void review(selected, "approved")}
              >
                <Check size={16} />
                {moderation(selected).tone === "delete"
                  ? "O‘chirishni tasdiqlash"
                  : moderation(selected).tone === "update"
                    ? "Yangilanishni tasdiqlash"
                    : "Tasdiqlab nashr qilish"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value || "Kiritilmagan"}</strong>
    </div>
  );
}
function roomFieldLabel(field: string) {
  const labels: Record<string, string> = {
    name: "Nomi", price: "Narxi", price_discount: "Chegirma narxi",
    minimum_payment: "Minimal to‘lov", info: "Tavsifi", room_count: "Xonalar soni",
    adults_capacity: "Kattalar", children_capacity: "Bolalar", area_sqm: "Maydoni",
    is_discount: "Chegirma", is_active: "Faolligi", comfortable: "Qulayliklar",
    access_times: "Check-in / check-out", rules: "Qoidalar", sum: "Valyuta",
  };
  return labels[field] || field;
}
function formatChangeValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.map((id) => `#${id}`).join(", ") : "Tozalangan";
  if (typeof value === "boolean") return value ? "Ha" : "Yo‘q";
  return String(value ?? "—");
}
function LoadingRows() {
  return (
    <div className="loading-list">
      {Array.from({ length: 5 }, (_, i) => (
        <div className="skeleton-row" key={i}>
          <i />
          <div>
            <b />
            <small />
          </div>
          <span />
          <span />
          <em />
        </div>
      ))}
    </div>
  );
}
