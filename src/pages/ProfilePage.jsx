import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const THEME_STORAGE_KEY = "needu-theme-v2";
const THEME_OPTIONS = ["beige", "blue", "pink", "purple", "orange"];

function Icon({ name }) {
  const icons = {
    logout: "M10 17l5-5-5-5M15 12H3M21 4v16",
    calendar: "M7 3v4M17 3v4M4 8h16M5 5h14v16H5z",
    save: "M5 5h12l2 2v12H5zM8 5v6h8M8 19v-5h8v5",
    user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
    image: "M4 5h16v14H4zM8 13l2.5-2.5L14 14l2-2 4 4M8.5 9.5h.01",
    camera: "M4 8h4l2-3h4l2 3h4v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    palette: "M12 22a10 10 0 1 1 10-10c0 2.2-1.8 4-4 4h-1.5c-.9 0-1.5.7-1.5 1.5 0 .4.2.8.4 1.1.2.3.3.6.3.9 0 1.4-1.4 2.5-3.2 2.5ZM7.5 10.5h.01M10 7.5h.01M14 7.5h.01M16.5 10.5h.01",
    lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6z",
    chevron: "M9 18l6-6-6-6",
    back: "M15 18l-6-6 6-6",
    globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20",
  };

  return (
    <svg aria-hidden="true" className="ui-icon" viewBox="0 0 24 24">
      <path d={icons[name]} />
    </svg>
  );
}

function PersonBadge({ user }) {
  const initial = user?.nickname?.slice(0, 1)?.toUpperCase() || "?";
  return (
    <span className={`person-badge person-badge-${user?.gender || "female"}`}>
      {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initial}
    </span>
  );
}

function SettingsItem({ icon, title, value, onClick, to }) {
  const content = (
    <>
      <span className="settings-item-icon">
        <Icon name={icon} />
      </span>
      <span className="settings-item-main">
        <strong>{title}</strong>
        {value ? <small>{value}</small> : null}
      </span>
      <Icon name="chevron" />
    </>
  );

  if (to) {
    return (
      <Link className="settings-item" to={to}>
        {content}
      </Link>
    );
  }

  return (
    <button className="settings-item" type="button" onClick={onClick}>
      {content}
    </button>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const {
    currentUser,
    currentCouple,
    partnerUser,
    updateProfile,
    updatePassword,
    uploadImage,
    logout,
    language,
    setLanguage,
    t,
  } = useApp();
  const [panel, setPanel] = useState("main");
  const [form, setForm] = useState({
    nickname: currentUser?.nickname || "",
    city: currentUser?.city || "",
    gender: currentUser?.gender || "female",
    loveStartDate: currentCouple?.loveStartDate || "",
    homeBackgroundUrl: currentCouple?.homeBackgroundUrl || "",
  });
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState(currentCouple?.homeBackgroundUrl || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || "");
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_OPTIONS.includes(saved) ? saved : "beige";
  });
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm({
      nickname: currentUser?.nickname || "",
      city: currentUser?.city || "",
      gender: currentUser?.gender || "female",
      loveStartDate: currentCouple?.loveStartDate || "",
      homeBackgroundUrl: currentCouple?.homeBackgroundUrl || "",
    });
    setBackgroundPreview(currentCouple?.homeBackgroundUrl || "");
    setBackgroundFile(null);
    setAvatarPreview(currentUser?.avatarUrl || "");
    setAvatarFile(null);
  }, [
    currentCouple?.homeBackgroundUrl,
    currentCouple?.loveStartDate,
    currentUser?.city,
    currentUser?.gender,
    currentUser?.avatarUrl,
    currentUser?.nickname,
  ]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleBackgroundChange(event) {
    const file = event.target.files?.[0] || null;
    setBackgroundFile(file);
    setBackgroundPreview(file ? URL.createObjectURL(file) : form.homeBackgroundUrl);
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0] || null;
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : currentUser?.avatarUrl || "");
  }

  async function handleQuickAvatarChange(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = "";
    if (!file) return;

    setMessage("");
    setIsSaving(true);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    const uploadResult = await uploadImage(file, "avatar");
    if (!uploadResult.ok) {
      setMessageType("error");
      setMessage(uploadResult.message);
      setIsSaving(false);
      return;
    }

    const result = await updateProfile({ ...form, avatarUrl: uploadResult.url });
    if (!result.ok) {
      setMessageType("error");
      setMessage(result.message || t("saveFailed"));
      setIsSaving(false);
      return;
    }

    setMessageType("success");
    setAvatarPreview(uploadResult.url);
    setMessage(t("saved"));
    setIsSaving(false);
  }

  async function saveProfile(patch = {}) {
    setIsSaving(true);
    setMessage(backgroundFile ? "正在上传背景..." : "");

    let homeBackgroundUrl = patch.homeBackgroundUrl ?? form.homeBackgroundUrl;
    let avatarUrl = patch.avatarUrl ?? currentUser?.avatarUrl ?? "";

    if (avatarFile) {
      const uploadResult = await uploadImage(avatarFile, "avatar");
      if (!uploadResult.ok) {
        setMessageType("error");
        setMessage(uploadResult.message);
        setIsSaving(false);
        return;
      }
      avatarUrl = uploadResult.url;
    }

    if (backgroundFile) {
      const uploadResult = await uploadImage(backgroundFile, "home-bg");
      if (!uploadResult.ok) {
        setMessageType("error");
        setMessage(uploadResult.message);
        setIsSaving(false);
        return;
      }
      homeBackgroundUrl = uploadResult.url;
    }

    const nextForm = { ...form, ...patch, homeBackgroundUrl };
    const result = await updateProfile({ ...nextForm, avatarUrl });
    if (!result.ok) {
      setMessageType("error");
      setMessage(result.message || t("saveFailed"));
      setIsSaving(false);
      return;
    }

    setMessageType("success");
    setForm(nextForm);
    setBackgroundPreview(homeBackgroundUrl);
    setBackgroundFile(null);
    setAvatarPreview(avatarUrl);
    setAvatarFile(null);
    setMessage(t("saved"));
    setIsSaving(false);
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    const result = await updatePassword(password);
    setMessageType(result.ok ? "success" : "error");
    setMessage(result.ok ? t("passwordUpdated") : result.message);
    if (result.ok) setPassword("");
    setIsSaving(false);
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const panelTitle = {
    main: t("settings"),
    profile: t("profile"),
    couple: t("coupleSettings"),
    appearance: t("display"),
    account: t("account"),
  }[panel];
  const themeLabel = {
    beige: language === "en" ? "Beige" : "米色",
    blue: t("blue"),
    pink: t("pink"),
    purple: language === "en" ? "Purple" : "紫色",
    orange: language === "en" ? "Orange" : "橙色",
  };

  return (
    <div className="stack-md app-view">
      <header className="compact-topbar">
        <div>
          <p className="eyebrow">{t("me")}</p>
          <h2>{panelTitle}</h2>
        </div>
        {panel === "main" ? (
          <button className="icon-button" type="button" onClick={handleLogout} aria-label={t("logout")}>
            <Icon name="logout" />
          </button>
        ) : (
          <button className="icon-button" type="button" onClick={() => setPanel("main")} aria-label="返回">
            <Icon name="back" />
          </button>
        )}
      </header>

      {panel === "main" ? (
        <>
          <section className="card profile-compact-card">
            <div className="couple-profile-card">
              <div className="couple-avatar-row">
                <span className="avatar-with-upload">
                  <PersonBadge user={{ ...currentUser, avatarUrl: avatarPreview || currentUser?.avatarUrl }} />
                  <label className="avatar-inline-upload" aria-label={t("avatar")}>
                    <input type="file" accept="image/*" onChange={handleQuickAvatarChange} disabled={isSaving} />
                    <Icon name="camera" />
                  </label>
                </span>
                <span className="couple-link-dot">♡</span>
                <PersonBadge user={partnerUser} />
              </div>
              <div className="couple-name-row">
                <div>
                  <strong>{currentUser?.nickname}</strong>
                  <span>{currentUser?.city || t("city")}</span>
                </div>
                <div>
                  <strong>{partnerUser?.nickname || "TA"}</strong>
                  <span>{partnerUser?.city || t("city")}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="settings-list-card">
            <SettingsItem icon="user" title={t("profile")} value={currentUser?.gender === "male" ? t("male") : t("female")} onClick={() => setPanel("profile")} />
            <SettingsItem icon="calendar" title={t("coupleSettings")} value={currentCouple?.loveStartDate || t("unset")} onClick={() => setPanel("couple")} />
            <SettingsItem icon="palette" title={t("display")} value={themeLabel[theme]} onClick={() => setPanel("appearance")} />
            <SettingsItem icon="calendar" title={t("importantDays")} to="/anniversaries" />
            <SettingsItem icon="lock" title={t("account")} value={t("passwordLogout")} onClick={() => setPanel("account")} />
          </section>

          <p className="settings-version">{t("version")}</p>
        </>
      ) : null}

      {panel === "profile" ? (
        <section className="card stack-sm profile-form-card">
          <div className="avatar-setting-row">
            <PersonBadge user={{ ...currentUser, avatarUrl: avatarPreview }} />
            <label className="icon-field-button avatar-upload-button">
              <input type="file" accept="image/*" onChange={handleAvatarChange} />
              <Icon name="image" />
              <span>{avatarFile ? t("selectedAvatar") : t("avatar")}</span>
            </label>
          </div>
          <div className="settings-row icon-input-row">
            <Icon name="user" />
            <input
              type="text"
              placeholder={t("nickname")}
              value={form.nickname}
              onChange={(event) => setField("nickname", event.target.value)}
            />
          </div>
          <div className="settings-row">
            <input
              type="text"
              placeholder="城市"
              value={form.city}
              onChange={(event) => setField("city", event.target.value)}
            />
          </div>
          <div className="segmented-control">
            <button
              className={form.gender === "female" ? "is-selected" : ""}
              type="button"
              onClick={() => setField("gender", "female")}
            >
              {t("female")}
            </button>
            <button
              className={form.gender === "male" ? "is-selected" : ""}
              type="button"
              onClick={() => setField("gender", "male")}
            >
              {t("male")}
            </button>
          </div>
          {message ? <p className={`form-message ${messageType === "success" ? "success-text" : "error-text"}`}>{message}</p> : null}
          <button className="primary-button full-width icon-label-button" type="button" disabled={isSaving} onClick={() => saveProfile()}>
            <Icon name="save" />
            <span>{isSaving ? t("saving") : t("save")}</span>
          </button>
        </section>
      ) : null}

      {panel === "couple" ? (
        <section className="card stack-sm profile-form-card">
          <div className="settings-row icon-input-row">
            <Icon name="calendar" />
            <input
              type="date"
              value={form.loveStartDate}
              onChange={(event) => setField("loveStartDate", event.target.value)}
            />
          </div>
          {backgroundPreview ? (
            <div className="home-bg-preview">
              <img src={backgroundPreview} alt="" />
            </div>
          ) : null}
          <label className="icon-field-button">
            <input type="file" accept="image/*" onChange={handleBackgroundChange} />
            <Icon name="image" />
            <span>{backgroundFile ? t("selectedBackground") : t("homeBackground")}</span>
          </label>
          {message ? <p className={`form-message ${messageType === "success" ? "success-text" : "error-text"}`}>{message}</p> : null}
          <button className="primary-button full-width icon-label-button" type="button" disabled={isSaving} onClick={() => saveProfile()}>
            <Icon name="save" />
            <span>{isSaving ? t("saving") : t("save")}</span>
          </button>
        </section>
      ) : null}

      {panel === "appearance" ? (
        <section className="card stack-md profile-form-card">
          <div className="settings-subgroup">
            <p className="eyebrow">{t("themeColor")}</p>
            <div className="theme-swatches">
              {THEME_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`theme-swatch theme-${item} ${theme === item ? "is-selected" : ""}`}
                  onClick={() => setTheme(item)}
                  aria-label={themeLabel[item]}
                  title={themeLabel[item]}
                />
              ))}
            </div>
          </div>
          <div className="settings-subgroup">
            <p className="eyebrow">{t("language")}</p>
            <div className="segmented-control">
              <button className={language === "zh-CN" ? "is-selected" : ""} type="button" onClick={() => setLanguage("zh-CN")}>
                简体中文
              </button>
              <button className={language === "en" ? "is-selected" : ""} type="button" onClick={() => setLanguage("en")}>
                English
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {panel === "account" ? (
        <section className="card stack-sm profile-form-card">
          <div className="settings-row icon-input-row">
            <Icon name="user" />
            <input type="text" value={currentUser?.username || ""} disabled aria-label={t("username")} />
          </div>
          <form className="stack-sm" onSubmit={handlePasswordSubmit}>
            <div className="settings-row icon-input-row">
              <Icon name="lock" />
              <input
                type="password"
                placeholder={t("newPassword")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {message ? <p className={`form-message ${messageType === "success" ? "success-text" : "error-text"}`}>{message}</p> : null}
            <button className="primary-button full-width icon-label-button" type="submit" disabled={isSaving}>
              <Icon name="save" />
              <span>{isSaving ? t("saving") : t("changePassword")}</span>
            </button>
          </form>
          <button className="secondary-button full-width icon-label-button" type="button" onClick={handleLogout}>
            <Icon name="logout" />
            <span>{t("logout")}</span>
          </button>
        </section>
      ) : null}
    </div>
  );
}
