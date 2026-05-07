import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function CouplePage() {
  const navigate = useNavigate();
  const { currentCouple, createCouple, joinCouple, coupleMemberCount, partnerUser } = useApp();
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [message, setMessage] = useState("");
  const canEnterHome = useMemo(() => Boolean(currentCouple), [currentCouple]);

  async function handleCreate() {
    const result = await createCouple();
    setMessage(result.ok ? `情侣空间已创建，邀请码是 ${result.inviteCode}` : result.message);
  }

  async function handleJoin() {
    const result = await joinCouple(inviteCodeInput);
    setMessage(result.ok ? "加入成功，现在可以进入首页了。" : result.message);
  }

  return (
    <div className="stack-lg auth-screen">
      <section className="card hero-card auth-hero">
        <div className="stack-sm">
          <p className="eyebrow">Couple Space</p>
          <h1 className="hero-title couple-hero-title">把两个人放进同一个空间</h1>
        </div>
        <div className="auth-note">
          <span className="auth-note-dot" />
          <p>你可以先创建情侣空间，再把邀请码发给对方；也可以直接输入对方的邀请码加入。</p>
        </div>
      </section>

      <section className="card stack-md auth-form-card">
        <div className="section-head">
          <h3 className="page-title">开始绑定</h3>
          <span className="tag">双人专属</span>
        </div>

        {currentCouple ? (
          <div className="status-box">
            <p className="copy">
              {coupleMemberCount < 2
                ? "你的情侣空间已经创建好了，正在等待对方输入邀请码加入。"
                : `绑定完成，你和 ${partnerUser?.nickname || "TA"} 已经进入同一个空间。`}
            </p>
          </div>
        ) : null}

        <button className="primary-button full-width" type="button" onClick={handleCreate}>
          创建情侣空间
        </button>

        <div className="invite-panel">
          <p className="muted">当前邀请码</p>
          <h3 className="invite-code">{currentCouple?.inviteCode || "------"}</h3>
          <p className="copy">创建成功后，这里会显示邀请码。</p>
        </div>

        <div className="input-group">
          <span className="label">输入邀请码</span>
          <input
            type="text"
            placeholder="6 位邀请码"
            value={inviteCodeInput}
            onChange={(event) => setInviteCodeInput(event.target.value.toUpperCase())}
          />
        </div>

        <button className="secondary-button full-width" type="button" onClick={handleJoin}>
          用邀请码加入
        </button>

        {message ? <p className={`form-message ${message.includes("成功") || message.includes("创建") ? "success-text" : "error-text"}`}>{message}</p> : null}

        <button className="primary-button full-width" type="button" disabled={!canEnterHome} onClick={() => navigate("/home")}>
          进入首页
        </button>
      </section>
    </div>
  );
}
