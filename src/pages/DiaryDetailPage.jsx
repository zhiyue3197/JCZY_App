import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
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

function Icon({ name }) {
  const icons = {
    back: "M15 18l-6-6 6-6M9 12h12",
    edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z",
    trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14",
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z",
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
    <span className="mood-pill mood-pill-soft">
      <span>{meta.label}</span>
    </span>
  );
}

export default function DiaryDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser, partnerUser, getDiaryById, state, diaryReplies, saveDiaryReply, deleteDiary, deleteDiaryReply, t } = useApp();
  const diary = getDiaryById(id);
  const [replyContent, setReplyContent] = useState("");
  const [message, setMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState("");

  const author = useMemo(() => {
    if (diary?.authorId === currentUser?.id) return currentUser;
    if (diary?.authorId === partnerUser?.id) return partnerUser;
    return state.users.find((user) => user.id === diary?.authorId) || null;
  }, [currentUser, diary?.authorId, partnerUser, state.users]);

  const replies = useMemo(
    () =>
      diaryReplies
        .filter((item) => item.diaryId === diary?.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [diary?.id, diaryReplies],
  );

  const images = diary?.imageUrls?.length ? diary.imageUrls : diary?.imageUrl ? [diary.imageUrl] : [];
  const ownerClass = author?.gender === "male" ? "diary-card-male" : "diary-card-female";

  if (!diary) {
    return <Navigate to="/diary" replace />;
  }

  async function handleReplySubmit(event) {
    event.preventDefault();
    const result = await saveDiaryReply({ diaryId: diary.id, content: replyContent });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMessage(t("saved"));
    setReplyContent("");
  }

  async function handleDelete() {
    if (!window.confirm(t("deleteDiaryConfirm"))) return;
    setIsDeleting(true);
    const result = await deleteDiary(diary.id);
    if (!result.ok) {
      setMessage(result.message);
      setIsDeleting(false);
      return;
    }
    navigate("/diary");
  }

  async function handleReplyDelete(replyId) {
    const result = await deleteDiaryReply(replyId);
    setMessage(result.ok ? t("delete") : result.message);
  }

  return (
    <div className="stack-lg">
      <header className="diary-detail-header">
        <div className="diary-title-block">
          <p className="eyebrow">{diary.diaryDate}</p>
          <div className="diary-title-with-avatar">
            <UserDot user={author} />
            <h2>{author?.nickname || t("partner")}{t("diaryOf")}</h2>
          </div>
          <MoodPill mood={diary.mood} />
        </div>
        <div className="icon-actions">
          {diary.authorId === currentUser?.id ? (
            <>
              <Link className="icon-button" to={`/diary/edit/${diary.id}`} aria-label={t("editDiary")}>
                <Icon name="edit" />
              </Link>
              <button className="icon-button" type="button" onClick={handleDelete} disabled={isDeleting} aria-label={t("delete")}>
                <Icon name="trash" />
              </button>
            </>
          ) : null}
          <Link className="icon-button" to="/diary" aria-label="返回">
            <Icon name="back" />
          </Link>
        </div>
      </header>

      <section className={`card stack-md diary-detail-card ${ownerClass}`}>
        {images.length > 0 ? (
          <div className="diary-detail-images">
            {images.map((url, index) => (
              <button className="image-button" type="button" onClick={() => setLightboxUrl(url)} key={`${url}-${index}`}>
                <img className="detail-image" src={url} alt={`日记配图 ${index + 1}`} />
              </button>
            ))}
          </div>
        ) : null}
        <div className="diary-reading">
          {diary.content.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </section>

      <form className={`card reply-panel compact-reply-panel ${ownerClass}`} onSubmit={handleReplySubmit}>
        <textarea
          rows={3}
          maxLength={300}
          placeholder={t("writeComment")}
          value={replyContent}
          onChange={(event) => setReplyContent(event.target.value)}
        />
        <button className="icon-submit-button" type="submit" aria-label="发送评论">
          <Icon name="send" />
        </button>
      </form>
      {message ? <p className={`form-message ${message.includes("已") ? "success-text" : "error-text"}`}>{message}</p> : null}

      {replies.length > 0 ? (
        <section className="card stack-sm comments-card">
          <div className="section-head">
            <h3 className="page-title">{t("comment")}</h3>
            <span className="tag">{replies.length}</span>
          </div>
          {replies.map((reply) => {
            const replyAuthor =
              reply.authorId === currentUser?.id
                ? currentUser
                : reply.authorId === partnerUser?.id
                  ? partnerUser
                  : state.users.find((user) => user.id === reply.authorId);
            return (
              <div className="reply-item stack-sm" key={reply.id}>
                <div className="row-between">
                  <div className="reply-author">
                    <UserDot user={replyAuthor} />
                    <strong>{replyAuthor?.nickname || t("partner")}</strong>
                  </div>
                  <span className="meta-line">
                    {new Date(reply.createdAt).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p>{reply.content}</p>
                {reply.authorId === currentUser?.id ? (
                  <button className="tiny-text-button" type="button" onClick={() => handleReplyDelete(reply.id)}>
                    {t("delete")}
                  </button>
                ) : null}
              </div>
            );
          })}
        </section>
      ) : null}

      {lightboxUrl ? (
        <button className="lightbox" type="button" onClick={() => setLightboxUrl("")} aria-label="关闭图片预览">
          <img src={lightboxUrl} alt="图片预览" />
        </button>
      ) : null}
    </div>
  );
}
