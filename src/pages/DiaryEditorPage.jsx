import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";

const moodMeta = {
  开心: "开心",
  平静: "平静",
  疲惫: "疲惫",
  难过: "难过",
  想你: "想你",
  甜蜜: "甜蜜",
  生气: "生气",
  焦虑: "焦虑",
  感动: "感动",
  期待: "期待",
};

const moods = Object.keys(moodMeta);

function Icon({ name }) {
  const icons = {
    back: "M15 18l-6-6 6-6M9 12h12",
    image: "M4 5h16v14H4zM8 13l2.5-2.5L14 14l2-2 4 4M8.5 9.5h.01",
    save: "M5 5h12l2 2v12H5zM8 5v6h8M8 19v-5h8v5",
  };

  return (
    <svg aria-hidden="true" className="ui-icon" viewBox="0 0 24 24">
      <path d={icons[name]} />
    </svg>
  );
}

export default function DiaryEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getDiaryById, saveDiary, todayString, uploadImage, t } = useApp();
  const editingDiary = useMemo(() => (id ? getDiaryById(id) : null), [getDiaryById, id]);
  const existingImages = editingDiary?.imageUrls?.length
    ? editingDiary.imageUrls
    : editingDiary?.imageUrl
      ? [editingDiary.imageUrl]
      : [];
  const [form, setForm] = useState({
    diaryDate: editingDiary?.diaryDate || todayString(),
    mood: editingDiary?.mood || moods[0],
    content: editingDiary?.content || "",
    imageUrls: existingImages,
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState(existingImages);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []);
    setImageFiles(files);
    setMessage("");
    setPreviewUrls([...form.imageUrls, ...files.map((file) => URL.createObjectURL(file))]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(imageFiles.length > 0 ? "正在上传图片..." : "");

    const uploadedUrls = [];
    for (const file of imageFiles) {
      const uploadResult = await uploadImage(file, "diary");
      if (!uploadResult.ok) {
        setMessage(uploadResult.message);
        setIsSaving(false);
        return;
      }
      uploadedUrls.push(uploadResult.url);
    }

    const imageUrls = [...form.imageUrls, ...uploadedUrls];
    const result = await saveDiary({
      id: editingDiary?.id,
      ...form,
      imageUrl: imageUrls[0] || "",
      imageUrls,
    });

    if (!result.ok) {
      setMessage(result.message);
      setIsSaving(false);
      return;
    }

    navigate(`/diary/${result.id}`);
  }

  return (
    <div className="stack-lg">
      <header className="compact-topbar">
        <div>
          <p className="eyebrow">{editingDiary ? t("editDiary") : t("writeDiary")}</p>
          <h2>{editingDiary ? t("editALittle") : t("writeALittle")}</h2>
        </div>
        <Link className="icon-button back-icon-button" to="/diary" aria-label="返回">
          <Icon name="back" />
        </Link>
      </header>

      <form className="card stack-md diary-editor-card" onSubmit={handleSubmit}>
        <div className="diary-editor-topline">
          <input
            aria-label={t("diaryDate")}
            type="date"
            value={form.diaryDate}
            onChange={(event) => setForm({ ...form, diaryDate: event.target.value })}
          />
        </div>

        <div className="mood-picker">
          {moods.map((mood) => (
            <button
              key={mood}
              className={`mood-choice ${form.mood === mood ? "mood-choice-active" : ""}`}
              type="button"
              onClick={() => setForm({ ...form, mood })}
              aria-label={mood}
            >
              <small>{moodMeta[mood]}</small>
            </button>
          ))}
        </div>

        <textarea
          className="diary-textarea"
          rows={9}
          maxLength={2000}
          placeholder={t("writeToday")}
          value={form.content}
          onChange={(event) => setForm({ ...form, content: event.target.value })}
        />

        <div className="input-group">
          {previewUrls.length > 0 ? (
            <div className="diary-image-grid">
              {previewUrls.map((url, index) => (
                <img className="diary-thumb" src={url} alt={`日记图片 ${index + 1}`} key={`${url}-${index}`} />
              ))}
            </div>
          ) : null}
          <div className="editor-action-row">
            <label className="circle-file-button" aria-label={t("image")}>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} />
              <Icon name="image" />
            </label>
            <button className="primary-button icon-label-button editor-save-button" type="submit" disabled={isSaving}>
              <Icon name="save" />
              <span>{isSaving ? `${t("saving")}...` : t("save")}</span>
            </button>
          </div>
        </div>

        {message ? <p className="form-message error-text">{message}</p> : null}
      </form>
    </div>
  );
}
