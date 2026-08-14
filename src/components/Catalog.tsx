import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ImagePlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { adminFetch } from "../auth";

const API = "https://mazzajoy.uz/api/v1/admin/platform/";
type Category = {
  id: number;
  name: string;
  icon?: string | null;
  minimum_payment_mode?: "percent" | "fixed";
  minimum_payment_value?: string | number;
  allows_multiple_rooms?: boolean;
  product_template?: "standard" | "rooms";
};
type CatalogData = {
  regions: any[];
  categories: Category[];
  comfortables: any[];
  rules: any[];
  cancellation_policies?: any[];
  banners: any[];
};

export function Catalog() {
  const [data, setData] = useState<CatalogData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState<File | null>(null);
  const [paymentMode, setPaymentMode] = useState<"percent" | "fixed">("percent");
  const [paymentValue, setPaymentValue] = useState("15");
  const [productTemplate, setProductTemplate] = useState<"standard" | "rooms">("standard");
  const [allowsMultipleRooms, setAllowsMultipleRooms] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const load = async () => {
    setBusy("load");
    setError("");
    try {
      const r = await adminFetch(`${API}?section=catalog`);
      const d = await r.json();
      if (!r.ok) throw Error(d.detail);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy("");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const add = async (entity: string) => {
    if (entity === "category") {
      setError("");
      setCategoryDialog(true);
      return;
    }
    const name = window.prompt("Nomi:");
    if (!name) return;
    setBusy(entity);
    try {
      const r = await adminFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "catalog_create", entity, name }),
      });
      if (!r.ok) throw Error((await r.json()).detail);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saqlanmadi");
    } finally {
      setBusy("");
    }
  };
  const closeCategoryDialog = (force = false) => {
    if (busy === "category" && !force) return;
    setCategoryDialog(false);
    setCategoryName("");
    setCategoryIcon(null);
    setPaymentMode("percent");
    setPaymentValue("15");
    setProductTemplate("standard");
    setAllowsMultipleRooms(false);
    setEditingCategory(null);
    if (iconInputRef.current) iconInputRef.current.value = "";
  };
  const selectCategoryIcon = (event: ChangeEvent<HTMLInputElement>) =>
    setCategoryIcon(event.target.files?.[0] || null);
  const createCategory = async () => {
    const name = categoryName.trim();
    if (!name) {
      setError("Kategoriya nomini kiriting.");
      return;
    }
    if (!categoryIcon && !editingCategory) {
      setError("Kategoriya uchun icon rasmini tanlang.");
      return;
    }
    const value = Number(paymentValue.replace(",", "."));
    if (!Number.isFinite(value) || value < 0 || (paymentMode === "percent" && value > 100)) {
      setError(paymentMode === "percent" ? "Foiz 0 dan 100 gacha bo‘lishi kerak." : "Minimal summa noto‘g‘ri.");
      return;
    }
    setBusy("category");
    setError("");
    try {
      const form = new FormData();
      form.append("action", editingCategory ? "catalog_update" : "catalog_create");
      form.append("entity", "category");
      if (editingCategory) form.append("category_id", String(editingCategory.id));
      form.append("name", name);
      if (categoryIcon) form.append("icon", categoryIcon);
      form.append("minimum_payment_mode", paymentMode);
      form.append("minimum_payment_value", paymentValue.replace(",", "."));
      form.append("product_template", productTemplate);
      form.append("allows_multiple_rooms", String(allowsMultipleRooms));
      const r = await adminFetch(API, { method: "POST", body: form });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw Error(body.detail || "Kategoriya saqlanmadi");
      closeCategoryDialog(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saqlanmadi");
    } finally {
      setBusy("");
    }
  };
  const openCategoryEdit = (category: Category) => {
    setSelectedCategory(null);
    setEditingCategory(category);
    setCategoryName(category.name);
    setPaymentMode(category.minimum_payment_mode === "fixed" ? "fixed" : "percent");
    setPaymentValue(String(category.minimum_payment_value ?? 15));
    setProductTemplate(category.product_template === "rooms" ? "rooms" : "standard");
    setAllowsMultipleRooms(category.allows_multiple_rooms === true);
    setCategoryIcon(null);
    setError("");
    setCategoryDialog(true);
  };
  const remove = async (entity: string, id: number) => {
    if (!confirm("O‘chirishni tasdiqlaysizmi?")) return;
    setBusy(`${entity}${id}`);
    try {
      const r = await adminFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "catalog_delete", entity, id }),
      });
      if (!r.ok) throw Error((await r.json()).detail);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "O‘chirilmadi");
    } finally {
      setBusy("");
    }
  };
  const configureMinimumPayment = async (category: Category) => {
    const current =
      category.minimum_payment_mode === "fixed"
        ? `${category.minimum_payment_value || 0} so‘m`
        : `${category.minimum_payment_value || 0}%`;
    const input = window.prompt(
      "Oldindan to‘lovni kiriting.\n\n50 yoki 50% — bron narxidan 50%\n50 000 so‘m — qat’iy minimal summa",
      current,
    );
    if (input === null || !input.trim()) return;
    const raw = input.trim().toLowerCase();
    const isFixed = /so['‘`]?m|uzs|fixed/.test(raw);
    const value = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
    const number = Number(value);
    const mode: "fixed" | "percent" = isFixed ? "fixed" : "percent";
    if (
      !Number.isFinite(number) ||
      number < 0 ||
      (mode === "percent" && number > 100)
    ) {
      setError(
        mode === "percent"
          ? "Foiz 0 dan 100 gacha bo‘lishi kerak."
          : "Minimal summa noto‘g‘ri kiritildi.",
      );
      return;
    }
    setBusy(`payment${category.id}`);
    try {
      const r = await adminFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_category_payment_rule",
          category_id: category.id,
          minimum_payment_mode: mode,
          minimum_payment_value: value,
        }),
      });
      if (!r.ok) throw Error((await r.json()).detail);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Minimal to‘lov yangilanmadi");
    } finally {
      setBusy("");
    }
  };
  const configureTemplate = async (category: Category) => {
    const rooms = window.confirm(
      `${category.name} uchun qaysi product shabloni ishlatiladi?\n\nOK — xonali shablon: agent xonalar qo‘shadi, mijoz xonani tanlaydi.\nBekor qilish — oddiy shablon: mulk bitta bron qilinadigan obyekt.`,
    );
    setBusy(`template${category.id}`);
    try {
      const r = await adminFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_category_template",
          category_id: category.id,
          product_template: rooms ? "rooms" : "standard",
        }),
      });
      if (!r.ok) throw Error((await r.json()).detail);
      await load();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Product shabloni yangilanmadi",
      );
    } finally {
      setBusy("");
    }
  };
  const addPolicy = async () => {
    const title = window.prompt("Siyosat sarlavhasi:");
    if (!title) return;
    const description = window.prompt("Tavsif:");
    if (!description) return;
    const type = window.prompt("Turi: success, warning yoki danger", "warning");
    if (!type) return;
    setBusy("policy");
    try {
      const r = await adminFetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancellation_policy_create",
          title,
          description,
          type,
        }),
      });
      if (!r.ok) throw Error((await r.json()).detail);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Siyosat saqlanmadi");
    } finally {
      setBusy("");
    }
  };
  if (!data)
    return (
      <section className="panel finance-state">
        <LoaderCircle className="spin" /> {error || "Katalog yuklanmoqda..."}
      </section>
    );
  const groups: [string, string, any[]][] = [
    ["Hududlar", "region", data.regions],
    ["Kategoriyalar", "category", data.categories],
    ["Qulayliklar", "comfortable", data.comfortables],
    ["Qoidalar", "rule", data.rules],
  ];
  const categoryIconUrl = (icon?: string | null) => {
    if (!icon) return "";
    if (icon.startsWith("http")) return icon;
    return `https://mazzajoy.uz${icon.startsWith("/") ? icon : `/media/${icon}`}`;
  };
  return (
    <section className="panel directory">
      <div className="panel-head">
        <div>
          <h2>Platforma sozlamalari</h2>
          <p>
            Katalog, kategoriya bron to‘lovi va product shablonlarini
            boshqaring.
          </p>
        </div>
        <button className="range" onClick={() => void load()}>
          <RefreshCw size={14} /> Yangilash
        </button>
      </div>
      {error && <p className="directory-notice error">{error}</p>}
      <div className="catalog-grid">
        {groups.map(([title, entity, items]) => (
          <div className="catalog-card" key={entity}>
            <div>
              <strong>{title}</strong>
              <button onClick={() => void add(entity)} disabled={!!busy}>
                <Plus size={15} /> Qo‘shish
              </button>
            </div>
            {items.length ? (
              items.map((item) => (
                <p key={item.id}>
                  <button
                    type="button"
                    className="catalog-name catalog-details"
                    onClick={() => entity === "category" && setSelectedCategory(item as Category)}
                    disabled={entity !== "category"}
                  >
                    {item.name}
                  </button>
                  {entity === "category" ? (
                    <>
                      <button
                        className="payment-rule"
                        onClick={() =>
                          void configureMinimumPayment(item as Category)
                        }
                        disabled={!!busy}
                      >
                        {(item as Category).minimum_payment_mode === "fixed"
                          ? `${(item as Category).minimum_payment_value || 0} so‘m`
                          : `${(item as Category).minimum_payment_value || 0}%`}
                      </button>
                      <button
                        className="payment-rule"
                        onClick={() => void configureTemplate(item as Category)}
                        disabled={!!busy}
                      >
                        {(item as Category).product_template === "rooms"
                          ? "Xonali shablon"
                          : "Oddiy shablon"}
                      </button>
                    </>
                  ) : null}
                  <button
                    onClick={() => void remove(entity, item.id)}
                    disabled={!!busy}
                  >
                    <Trash2 size={14} />
                  </button>
                </p>
              ))
            ) : (
              <small>Hozircha yo‘q</small>
            )}
          </div>
        ))}
      </div>
      <div className="catalog-grid catalog-extra">
        <div className="catalog-card">
          <div>
            <strong>Bekor qilish siyosati</strong>
            <button onClick={() => void addPolicy()} disabled={!!busy}>
              <Plus size={15} /> Qo‘shish
            </button>
          </div>
          {(data.cancellation_policies || []).length ? (
            (data.cancellation_policies || []).map((item) => (
              <p key={item.id}>
                <span>{item.title}</span>
                <button
                  onClick={() => void remove("cancellation_policy", item.id)}
                  disabled={!!busy}
                >
                  <Trash2 size={14} />
                </button>
              </p>
            ))
          ) : (
            <small>Hozircha yo‘q</small>
          )}
        </div>
        <div className="catalog-card">
          <div>
            <strong>Valyuta</strong>
          </div>
          <p>
            <span>Barcha hisob-kitoblar</span>
            <b>Faqat UZS / so‘m</b>
          </p>
        </div>
      </div>
      {categoryDialog && (
        <div
          className="catalog-backdrop"
          role="presentation"
          onMouseDown={() => closeCategoryDialog()}
        >
          <form
            className="catalog-modal"
            onSubmit={(event) => {
              event.preventDefault();
              void createCategory();
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="catalog-modal-head">
              <div>
                <h2>{editingCategory ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</h2>
                <p>{editingCategory ? "Kerakli sozlamalarni yangilang. Icon ixtiyoriy." : "Nomi va ilova uchun icon rasmini kiriting."}</p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => closeCategoryDialog()}
              >
                <X size={18} />
              </button>
            </div>
            <label>
              Kategoriya nomi
              <input
                autoFocus
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Masalan: Dacha"
                maxLength={100}
              />
            </label>
            <label>
              Icon rasmi
              <input
                ref={iconInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={selectCategoryIcon}
              />
              <span className="catalog-file">
                <ImagePlus size={18} />
                {categoryIcon
                  ? categoryIcon.name
                  : "PNG, JPG yoki WEBP faylini tanlang"}
              </span>
            </label>
            <div className="category-form-grid">
              <label>
                Oldindan to‘lov turi
                <select value={paymentMode} onChange={(event) => setPaymentMode(event.target.value as "percent" | "fixed")}>
                  <option value="percent">Bron narxidan foiz</option>
                  <option value="fixed">Qat’iy summa (UZS)</option>
                </select>
              </label>
              <label>
                {paymentMode === "percent" ? "Foiz (%)" : "Minimal summa (so‘m)"}
                <input value={paymentValue} inputMode="decimal" onChange={(event) => setPaymentValue(event.target.value)} placeholder={paymentMode === "percent" ? "15" : "100 000"} />
              </label>
              <label>
                Product shabloni
                <select value={productTemplate} onChange={(event) => setProductTemplate(event.target.value as "standard" | "rooms")}>
                  <option value="standard">Oddiy shablon</option>
                  <option value="rooms">Xonali shablon</option>
                </select>
              </label>
              <label className="category-check">
                <input type="checkbox" checked={allowsMultipleRooms} onChange={(event) => setAllowsMultipleRooms(event.target.checked)} />
                Agent mustaqil bron qilinadigan bir nechta xona qo‘sha oladi
              </label>
            </div>
            <div className="catalog-modal-actions">
              <button
                type="button"
                className="catalog-cancel"
                onClick={() => closeCategoryDialog()}
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="catalog-save"
                disabled={busy === "category"}
              >
                {busy === "category" ? "Yuklanmoqda..." : editingCategory ? "O‘zgarishlarni saqlash" : "Kategoriya yaratish"}
              </button>
            </div>
          </form>
        </div>
      )}
      {selectedCategory && (
        <div className="catalog-backdrop" role="presentation" onMouseDown={() => setSelectedCategory(null)}>
          <article className="catalog-modal category-preview" onMouseDown={(event) => event.stopPropagation()}>
            <div className="catalog-modal-head">
              <div><h2>{selectedCategory.name}</h2><p>Kategoriya sozlamalari</p></div>
              <button type="button" className="modal-close" onClick={() => setSelectedCategory(null)}><X size={18} /></button>
            </div>
            {categoryIconUrl(selectedCategory.icon) ? <img className="category-preview-image" src={categoryIconUrl(selectedCategory.icon)} alt={`${selectedCategory.name} iconi`} /> : <div className="category-preview-empty">Icon yuklanmagan</div>}
            <dl className="category-preview-details">
              <div><dt>Oldindan to‘lov</dt><dd>{selectedCategory.minimum_payment_mode === "fixed" ? `${selectedCategory.minimum_payment_value || 0} so‘m` : `${selectedCategory.minimum_payment_value || 0}%`}</dd></div>
              <div><dt>Product shabloni</dt><dd>{selectedCategory.product_template === "rooms" ? "Xonali shablon" : "Oddiy shablon"}</dd></div>
              <div><dt>Xonalar</dt><dd>{selectedCategory.allows_multiple_rooms ? "Bir nechta mustaqil xona" : "Bitta bron qilinadigan obyekt"}</dd></div>
            </dl>
            <div className="catalog-modal-actions">
              <button type="button" className="catalog-save" onClick={() => openCategoryEdit(selectedCategory)}>Tahrirlash</button>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
