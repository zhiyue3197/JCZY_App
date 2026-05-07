import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";

function getRepeatOptions(language) {
  return language === "en"
    ? [
        { value: "none", label: "No repeat" },
        { value: "monthly", label: "Monthly" },
        { value: "yearly", label: "Yearly" },
      ]
    : [
        { value: "none", label: "不重复" },
        { value: "monthly", label: "每月重复" },
        { value: "yearly", label: "每年重复" },
      ];
}

function Icon({ name }) {
  const icons = {
    back: "M15 18l-6-6 6-6M9 12h12",
    calendar: "M7 3v4M17 3v4M4 8h16M5 5h14v16H5z",
    save: "M5 5h12l2 2v12H5zM8 5v6h8M8 19v-5h8v5",
    sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  };

  return (
    <svg aria-hidden="true" className="ui-icon" viewBox="0 0 24 24">
      <path d={icons[name]} />
    </svg>
  );
}

export default function AnniversaryEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { coupleAnniversaries, addAnniversary, updateAnniversary, todayString, language, t } = useApp();
  const editingItem = useMemo(() => coupleAnniversaries.find((item) => item.id === id) || null, [coupleAnniversaries, id]);
  const repeatOptions = getRepeatOptions(language);
  const [form, setForm] = useState({
    title: editingItem?.title || "",
    date: editingItem?.date || todayString(),
    repeatType: editingItem?.repeatType || "yearly",
  });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!form.title.trim()) {
      setMessage(language === "en" ? "Please enter a title." : "请填写重要日子的名称。");
      return;
    }

    setIsSaving(true);
    const payload = {
      title: form.title.trim(),
      date: form.date,
      repeatType: form.repeatType,
    };
    const result = editingItem ? await updateAnniversary(editingItem.id, payload) : await addAnniversary(payload);
    setIsSaving(false);

    if (!result?.ok) {
      setMessage(result?.message || (language === "en" ? "Save failed." : "保存失败。"));
      return;
    }

    navigate("/anniversaries");
  }

  return (
    <div className="stack-lg">
      <header className="compact-topbar">
        <div>
          <p className="eyebrow">{t("importantDays")}</p>
          <h2>{editingItem ? (language === "en" ? "Edit Day" : "编辑日子") : t("addImportantDay")}</h2>
        </div>
        <Link className="icon-button back-icon-button" to="/anniversaries" aria-label={language === "en" ? "Back" : "返回"}>
          <Icon name="back" />
        </Link>
      </header>

      <form className="card stack-md anniversary-form-card" onSubmit={handleSubmit}>
        <div className="settings-row icon-input-row">
          <Icon name="sparkle" />
          <input
            type="text"
            placeholder={language === "en" ? "Title" : "日子名称"}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </div>

        <div className="settings-row icon-input-row">
          <Icon name="calendar" />
          <input
            type="date"
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
        </div>

        <div className="segmented-control anniversary-repeat-control">
          {repeatOptions.map((option) => (
            <button
              key={option.value}
              className={form.repeatType === option.value ? "is-selected" : ""}
              type="button"
              onClick={() => setForm({ ...form, repeatType: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>

        {message ? <p className="form-message error-text">{message}</p> : null}

        <button className="primary-button full-width icon-label-button" type="submit" disabled={isSaving}>
          <Icon name="save" />
          <span>{isSaving ? `${t("saving")}...` : t("save")}</span>
        </button>
      </form>
    </div>
  );
}
