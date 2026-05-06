import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isSupabaseConfigured } = useApp();
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await login(form);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    navigate("/couple");
  }

  return (
    <div className="stack-lg auth-screen">
      <section className="card hero-card auth-hero">
        <div className="stack-sm">
          <p className="eyebrow">NeedU</p>
          <h1 className="hero-title auth-title-split">
            <span>Love u, need u</span>
            <span>爱你，需要你</span>
          </h1>
          <p className="copy">
            一个给异地情侣准备的温柔角落，用来记录日常、回应情绪，也把重要时刻慢慢留下。
          </p>
        </div>
        <div className="auth-note">
          <span className="auth-note-dot" />
          <p>
            {isSupabaseConfigured
              ? "使用用户名和密码登录。"
              : "Supabase 还没配置完成，当前无法登录。"}
          </p>
        </div>
      </section>

      <form className="card stack-md auth-form-card" onSubmit={handleSubmit}>
        <div className="section-head">
          <h3 className="page-title">登录</h3>
          <span className="tag">欢迎回来</span>
        </div>

        <div className="input-group">
          <span className="label">用户名</span>
          <input
            type="text"
            placeholder="例如：needu_520"
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
          />
        </div>

        <div className="input-group">
          <span className="label">密码</span>
          <input
            type="password"
            placeholder="至少 6 位"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </div>

        {message ? <p className="form-message error-text">{message}</p> : null}

        <button className="primary-button full-width" type="submit" disabled={!isSupabaseConfigured}>
          进入 NeedU
        </button>

        <div className="auth-footer">
          <p className="muted">还没有账号？</p>
          <Link className="link-line" to="/register">
            去注册
          </Link>
        </div>
      </form>
    </div>
  );
}
