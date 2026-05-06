import { Link } from "react-router-dom";
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

export default function AnniversaryPage() {
  const { coupleAnniversaries, addAnniversary, updateAnniversary, deleteAnniversary, language, t } = useApp();
  const repeatOptions = getRepeatOptions(language);

  return (
    <div className="stack-lg">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t("importantDays")}</p>
          <h2>{language === "en" ? "Keep the days that matter" : "把值得记住的日子存下来"}</h2>
        </div>
        <Link className="ghost-button" to="/me">
          {language === "en" ? "Back" : "返回"}
        </Link>
      </header>

      <section className="card stack-sm anniversary-intro">
        <p className="eyebrow">Days</p>
        <p className="copy">
          {language === "en"
            ? "Birthdays, first meetings, monthly rituals, or any moment you want to count down to."
            : "生日、见面日、每月的小约定，或任何你们想倒数和纪念的时刻。"}
        </p>
      </section>

      <section className="stack-md">
        {coupleAnniversaries.length === 0 ? (
          <div className="card empty-card">
            <p className="copy">{language === "en" ? "No important days yet." : "还没有重要日子，点击下面按钮先加一个吧。"}</p>
          </div>
        ) : (
          coupleAnniversaries.map((item) => (
            <div className="card anniversary-card" key={item.id}>
              <div className="anniversary-card-head">
                <div>
                  <p className="feature-title">{item.title}</p>
                  <p className="muted">{item.date}</p>
                </div>
                <button className="ghost-button" type="button" onClick={() => deleteAnniversary(item.id)}>
                  {t("delete")}
                </button>
              </div>
              <div className="anniversary-row">
                <input
                  type="text"
                  value={item.title}
                  onChange={(event) => updateAnniversary(item.id, { title: event.target.value })}
                />
                <input
                  type="date"
                  value={item.date}
                  onChange={(event) => updateAnniversary(item.id, { date: event.target.value })}
                />
                <select
                  value={item.repeatType || "none"}
                  onChange={(event) => updateAnniversary(item.id, { repeatType: event.target.value })}
                >
                  {repeatOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </section>

      <button className="secondary-button full-width" type="button" onClick={addAnniversary}>
        {t("addImportantDay")}
      </button>
    </div>
  );
}
