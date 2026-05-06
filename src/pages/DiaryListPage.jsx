import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

const moodMeta = {
  开心: { label: "开心" },
  平静: { label: "平静" },
  疲惫: { label: "疲惫" },
  难过: { label: "难过" },
  想你: { label: "想你" },
  甜蜜: { label: "甜蜜" },
  生气: { label: "生气" },
  焦虑: { label: "焦虑" },
  感动: { label: "感动" },
  期待: { label: "期待" },
};

const moods = Object.keys(moodMeta);

function Icon({ name }) {
  const icons = {
    plus: "M12 5v14M5 12h14",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z",
  };
  return (
    <svg aria-hidden="true" className="ui-icon" viewBox="0 0 24 24">
      <path d={icons[name]} />
    </svg>
  );
}

function UserDot({ user }) {
  const initial = user?.nickname?.slice(0, 1)?.toUpperCase() || "?";
  return <span className={`user-dot user-dot-${user?.gender || "female"}`}>{initial}</span>;
}

function MoodPill({ mood }) {
  const meta = moodMeta[mood] || { label: mood };
  return (
    <span className="mood-pill">
      <span>{meta.label}</span>
    </span>
  );
}

export default function DiaryListPage() {
  const { coupleDiaries, currentUser, partnerUser, state, diaryReplies, todayString, t } = useApp();

  const todaysDiary = coupleDiaries.find(
    (item) => item.authorId === currentUser?.id && item.diaryDate === todayString(),
  );

  const moodCounts = moods.map((mood) => ({
    mood,
    count: coupleDiaries.filter((item) => item.mood === mood).length,
  }));

  return (
    <div className="stack-md app-view">
      <header className="compact-topbar">
        <div>
          <p className="eyebrow">{t("diary")}</p>
          <h2>{t("diarySmall")}</h2>
        </div>
        <Link className="icon-button" to={todaysDiary ? `/diary/edit/${todaysDiary.id}` : "/diary/new"} aria-label={t("writeDiary")}>
          <Icon name={todaysDiary ? "edit" : "plus"} />
        </Link>
      </header>

      <section className="card diary-intro">
        <div className="mood-stats mood-stats-cute">
          {moodCounts.map((item) => (
            <div className="mood-stat" key={item.mood}>
              <small>{moodMeta[item.mood].label}</small>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="stack-sm">
        {coupleDiaries.length === 0 ? (
          <div className="card empty-card">
            <p className="copy">{t("noDiary")}</p>
          </div>
        ) : (
          coupleDiaries.map((item) => {
            const author =
              item.authorId === currentUser?.id
                ? currentUser
                : item.authorId === partnerUser?.id
                  ? partnerUser
                  : state.users.find((user) => user.id === item.authorId);
            const replies = diaryReplies.filter((reply) => reply.diaryId === item.id);
            const images = item.imageUrls?.length ? item.imageUrls : item.imageUrl ? [item.imageUrl] : [];
            const ownerClass = author?.gender === "male" ? "diary-card-male" : "diary-card-female";

            return (
              <Link key={item.id} to={`/diary/${item.id}`} className={`list-card stack-sm diary-list-card ${ownerClass}`}>
                <div className="row-between">
                  <div className="reply-author">
                    <UserDot user={author} />
                    <div className="stack-xs">
                      <strong>{author?.nickname || t("unknownUser")}</strong>
                      <span className="meta-line">{item.diaryDate}</span>
                    </div>
                  </div>
                  <MoodPill mood={item.mood} />
                </div>
                <p className="snippet">{item.content}</p>
                <div className="row-between">
                  <span className="meta-line">
                    {images.length} 图 · {replies.length} 评
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </section>
    </div>
  );
}
