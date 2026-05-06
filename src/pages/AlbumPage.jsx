import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";

function Icon({ name }) {
  const icons = {
    upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
    trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14",
    image: "M4 6h16v12H4zM7 15l3-3 2 2 3-4 3 5",
  };

  return (
    <svg aria-hidden="true" className="ui-icon" viewBox="0 0 24 24">
      <path d={icons[name]} />
    </svg>
  );
}

export default function AlbumPage() {
  const { coupleAlbumEntries, saveAlbumEntry, deleteAlbumEntry, uploadImage, state, todayString, language, t } = useApp();
  const [albumDate, setAlbumDate] = useState(todayString());
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState("");

  const selectedDateEntry = useMemo(
    () => coupleAlbumEntries.find((item) => item.albumDate === albumDate),
    [albumDate, coupleAlbumEntries],
  );

  async function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;

    setIsSaving(true);
    setMessage(language === "en" ? "Uploading..." : "正在上传...");

    const uploadResult = await uploadImage(file, "album");
    if (!uploadResult.ok) {
      setMessage(uploadResult.message);
      setIsSaving(false);
      return;
    }

    const result = await saveAlbumEntry({
      albumDate,
      imageUrl: uploadResult.url,
      note: "",
    });

    setMessage(result.ok ? t("saved") : result.message);
    setIsSaving(false);
  }

  async function handleDelete(id) {
    if (!window.confirm(language === "en" ? "Delete this image?" : "确定要删除这张图片吗？")) return;
    const result = await deleteAlbumEntry(id);
    setMessage(result.ok ? (language === "en" ? "Deleted" : "已删除") : result.message);
  }

  return (
    <div className="stack-lg">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t("album")}</p>
          <h2>{t("galleryWall")}</h2>
        </div>
        <span className="pill">{coupleAlbumEntries.length}</span>
      </header>

      <section className="card album-upload-card">
        <div className="album-upload-main">
          <div className="stack-xs">
            <p className="eyebrow">Upload</p>
            <input
              className="album-date-input"
              type="date"
              value={albumDate}
              onChange={(event) => setAlbumDate(event.target.value)}
            />
            {selectedDateEntry ? (
              <p className="meta-line">{language === "en" ? "This date already has an image. Uploading will replace it." : "这一天已有图片，上传会更新它。"}</p>
            ) : null}
          </div>
          <label className={`round-upload-button ${isSaving ? "is-loading" : ""}`} aria-label={language === "en" ? "Upload image" : "上传图片"}>
            <input type="file" accept="image/*" onChange={handleImageChange} disabled={isSaving} />
            <Icon name="upload" />
          </label>
        </div>
        {message ? (
          <p className={`form-message ${message === t("saved") || message === "Deleted" || message === "已删除" ? "success-text" : "error-text"}`}>
            {message}
          </p>
        ) : null}
      </section>

      <section className="card stack-sm album-gallery-card">
        <div className="section-head">
          <h3 className="page-title">{language === "en" ? "All Images" : "全部图片"}</h3>
          <span className="tag">{language === "en" ? "Thumbs" : "缩略图"}</span>
        </div>

        {coupleAlbumEntries.length === 0 ? (
          <div className="empty-gallery">
            <Icon name="image" />
            <p className="copy">{language === "en" ? "No images yet." : "还没有图片，先上传一张吧。"}</p>
          </div>
        ) : (
          <div className="album-thumb-grid">
            {coupleAlbumEntries.map((item) => {
              const uploader = state.users.find((user) => user.id === item.uploadedBy);
              return (
                <article className="album-thumb-card" key={item.id}>
                  <button className="album-thumb-button" type="button" onClick={() => setLightboxUrl(item.imageUrl)}>
                    <img src={item.imageUrl} alt="" />
                  </button>
                  <div className="album-thumb-meta">
                    <span>{item.albumDate.slice(5)}</span>
                    <span>{uploader?.nickname || (language === "en" ? "Unknown" : "未知")}</span>
                  </div>
                  <button className="thumb-delete-button" type="button" onClick={() => handleDelete(item.id)} aria-label={t("delete")}>
                    <Icon name="trash" />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {lightboxUrl ? (
        <button className="lightbox" type="button" onClick={() => setLightboxUrl("")} aria-label="close">
          <img src={lightboxUrl} alt="" />
        </button>
      ) : null}
    </div>
  );
}
