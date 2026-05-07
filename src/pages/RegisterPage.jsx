import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isSupabaseConfigured } = useApp();
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await register(form);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    if (result.message) {
      setMessage(result.message);
      return;
    }

    navigate("/couple");
  }

  return (
    <div className="stack-lg auth-screen">
      <section className="card hero-card auth-hero">
        <div className="stack-sm">
          <p className="eyebrow">Create Space</p>
          <h1 className="hero-title">先把你们的空间建起来</h1>
          <p className="copy">先注册一个账号，接下来就可以创建情侣空间，开始保存你们的日常和纪念。</p>
        </div>
        <div className="auth-note">
          <span className="auth-note-dot" />
          <p>{isSupabaseConfigured ? "设置唯一用户名和密码即可注册。" : "Supabase 还没配置完成，当前无法注册。"}</p>
        </div>
      </section>

      <form className="card stack-md auth-form-card" onSubmit={handleSubmit}>
        <div className="section-head">
          <h3 className="page-title">注册</h3>
          <span className="tag">开始创建</span>
        </div>

        <div className="input-group">
          <span className="label">用户名</span>
          <input
            type="text"
            placeholder="2-20 位中文、字母、数字或下划线"
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
          注册并继续
        </button>

        <div className="auth-footer auth-footer-icon">
          <p className="muted">已经有账号了？</p>
          <Link className="icon-button auth-back-button" to="/login" aria-label="返回登录">
            <Icon name="back" />
          </Link>
        </div>
      </form>
    </div>
  );
}
