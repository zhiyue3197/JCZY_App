import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

function Icon({ name }) {
  const icons = {
    back: "M15 18l-6-6 6-6M9 12h12",
  };

  return (
    <svg aria-hidden="true" className="ui-icon" viewBox="0 0 24 24">
      <path d={icons[name]} />
    </svg>
  );
}

function repeatLabel(type, language) {
  if (language === "en") {
    return { none: "No repeat", monthly: "Monthly", yearly: "Yearly" }[type || "none"];
  }
  return { none: "不重复", monthly: "每月重复", yearly: "每年重复" }[type || "none"];
}

export default function AnniversaryPage() {
  const { coupleAnniversaries, deleteAnniversary, language, t } = useApp();

  return (
    <div className="stack-lg">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t("importantDays")}</p>
          <h2>{language === "en" ? "Important Days" : "重要日子"}</h2>
        </div>
        <Link className="icon-button back-icon-button" to="/me" aria-label={language === "en" ? "Back" : "返回"}>
          <Icon name="back" />
        </Link>
      </header>

      <section className="card stack-sm anniversary-intro">
        <div className="section-head">
          <h3 className="page-title">{language === "en" ? "Keep moments" : "把日子收好"}</h3>
          <Link className="tag" to="/anniversaries/new">
            {language === "en" ? "Add" : "新增"}
          </Link>
        </div>
        <p className="copy">
          {language === "en"
            ? "Birthdays, first meetings, monthly rituals, or any date worth counting down to."
            : "生日、见面日、每月约定，或任何想一起倒数和纪念的时刻。"}
        </p>
      </section>

      <section className="stack-md anniversary-list">
        {coupleAnniversaries.length === 0 ? (
          <div className="card empty-card compact-empty-card">
            <p className="copy">{language === "en" ? "No important days yet." : "还没有重要日子。"}</p>
            <Link className="primary-button full-width" to="/anniversaries/new">
              {t("addImportantDay")}
            </Link>
          </div>
        ) : (
          coupleAnniversaries.map((item) => (
            <article className="card anniversary-card anniversary-summary-card" key={item.id}>
              <div className="anniversary-card-head">
                <div>
                  <p className="feature-title">{item.title}</p>
                  <p className="muted">{item.date}</p>
                </div>
                <span className="feature-badge">{repeatLabel(item.repeatType, language)}</span>
              </div>
              <div className="anniversary-card-actions">
                <Link className="ghost-button" to={`/anniversaries/${item.id}/edit`}>
                  {language === "en" ? "Edit" : "编辑"}
                </Link>
                <button className="ghost-button danger-button" type="button" onClick={() => deleteAnniversary(item.id)}>
                  {t("delete")}
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
