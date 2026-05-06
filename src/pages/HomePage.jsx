import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

const repeatLabels = {
  "zh-CN": {
    none: "不重复",
    monthly: "每月重复",
    yearly: "每年重复",
  },
  en: {
    none: "No repeat",
    monthly: "Monthly",
    yearly: "Yearly",
  },
};

const weatherCodeLabels = {
  "zh-CN": {
    0: "晴朗",
    1: "大部晴朗",
    2: "局部多云",
    3: "多云",
    45: "有雾",
    48: "霜雾",
    51: "小雨",
    53: "小雨",
    55: "中雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    71: "小雪",
    73: "中雪",
    75: "大雪",
    80: "阵雨",
    81: "阵雨",
    82: "强阵雨",
    95: "雷暴",
  },
  en: {
    0: "Sunny",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Cloudy",
    45: "Foggy",
    48: "Rime fog",
    51: "Light rain",
    53: "Light rain",
    55: "Rain",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Showers",
    81: "Showers",
    82: "Heavy showers",
    95: "Thunderstorm",
  },
};

function toDateOnly(date) {
  return new Date(`${date}T00:00:00`);
}

function getLoveSummary(startDate, language) {
  if (!startDate) {
    return {
      days: null,
      detail: language === "en" ? "Set your love start date in Me" : "请先在“我的”里设置恋爱开始日期",
    };
  }

  const start = toDateOnly(startDate);
  const today = toDateOnly(new Date().toISOString().slice(0, 10));
  const diffDays = Math.max(1, Math.floor((today - start) / 86400000) + 1);

  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  let days = today.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    days: diffDays,
    detail:
      language === "en"
        ? `Together for ${years}y ${months}m ${days}d`
        : `已经在一起 ${years} 年 ${months} 月 ${days} 天`,
  };
}

function clampDay(year, monthIndex, day) {
  return Math.min(day, new Date(year, monthIndex + 1, 0).getDate());
}

function getNextDate(item, base) {
  const original = toDateOnly(item.date);
  const repeatType = item.repeatType || "none";

  if (repeatType === "none") {
    return original >= base ? original : null;
  }

  if (repeatType === "monthly") {
    const day = original.getDate();
    let next = new Date(base.getFullYear(), base.getMonth(), clampDay(base.getFullYear(), base.getMonth(), day));
    if (next < base) {
      const month = base.getMonth() + 1;
      const year = base.getFullYear() + Math.floor(month / 12);
      const monthIndex = month % 12;
      next = new Date(year, monthIndex, clampDay(year, monthIndex, day));
    }
    return next;
  }

  const month = original.getMonth();
  const day = original.getDate();
  let next = new Date(base.getFullYear(), month, clampDay(base.getFullYear(), month, day));
  if (next < base) {
    next = new Date(base.getFullYear() + 1, month, clampDay(base.getFullYear() + 1, month, day));
  }
  return next;
}

function getNextImportantDay(items) {
  const base = toDateOnly(new Date().toISOString().slice(0, 10));

  const sorted = items
    .map((item) => {
      const nextDate = getNextDate(item, base);
      if (!nextDate) return null;
      return {
        ...item,
        nextDate: nextDate.toISOString().slice(0, 10),
        diff: Math.ceil((nextDate - base) / 86400000),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.diff - b.diff || a.title.localeCompare(b.title));

  return sorted[0] || null;
}

async function fetchCityWeather(city, signal, language) {
  if (!city) {
    return {
      city: language === "en" ? "Not set" : "未设置",
      text: language === "en" ? "Set city first" : "请先设置城市",
      temperature: "--",
      status: "idle",
    };
  }

  const geocodeUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
  geocodeUrl.searchParams.set("name", city);
  geocodeUrl.searchParams.set("count", "1");
  geocodeUrl.searchParams.set("language", language === "en" ? "en" : "zh");
  geocodeUrl.searchParams.set("format", "json");

  const geocodeResponse = await fetch(geocodeUrl, { signal });
  if (!geocodeResponse.ok) throw new Error("weather failed");
  const geocodeData = await geocodeResponse.json();
  const location = geocodeData.results?.[0];
  if (!location) {
    return {
      city,
      text: language === "en" ? "City not found" : "没有找到城市",
      temperature: "--",
      status: "error",
    };
  }

  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", location.latitude);
  weatherUrl.searchParams.set("longitude", location.longitude);
  weatherUrl.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  weatherUrl.searchParams.set("timezone", "auto");

  const weatherResponse = await fetch(weatherUrl, { signal });
  if (!weatherResponse.ok) throw new Error("weather failed");
  const weatherData = await weatherResponse.json();
  const current = weatherData.current;

  return {
    city: location.name || city,
    text: weatherCodeLabels[language]?.[current?.weather_code] || (language === "en" ? "Unknown" : "天气未知"),
    temperature: Number.isFinite(current?.temperature_2m) ? `${Math.round(current.temperature_2m)}°C` : "--",
    wind: Number.isFinite(current?.wind_speed_10m) ? `${Math.round(current.wind_speed_10m)} km/h` : "",
    status: "ready",
  };
}

function WeatherPanel({ label, city, weather, language }) {
  return (
    <div className="soft-box stack-xs weather-panel compact-weather-panel">
      <p className="muted">{label}</p>
      <h4>{weather?.city || city || (language === "en" ? "Not set" : "未设置")}</h4>
      <p>
        {weather?.text || (language === "en" ? "Loading" : "加载中")} · {weather?.temperature || "--"}
      </p>
      {weather?.wind ? <p className="meta-line">{language === "en" ? "Wind" : "风速"} {weather.wind}</p> : null}
    </div>
  );
}

export default function HomePage() {
  const { currentUser, partnerUser, currentCouple, coupleAnniversaries, coupleDiaries, todayString, language, t } = useApp();
  const loadingText = language === "en" ? "Loading" : "加载中";
  const unsetText = t("unset");
  const [weatherState, setWeatherState] = useState({
    mine: { city: loadingText, text: loadingText, temperature: "--", status: "loading" },
    partner: { city: loadingText, text: loadingText, temperature: "--", status: "loading" },
  });
  const next = getNextImportantDay(coupleAnniversaries);
  const love = getLoveSummary(currentCouple?.loveStartDate, language);
  const todaysDiary = coupleDiaries.find(
    (item) => item.authorId === currentUser?.id && item.diaryDate === todayString(),
  );
  const loveHeroStyle = currentCouple?.homeBackgroundUrl
    ? { "--love-hero-bg": `url("${currentCouple.homeBackgroundUrl}")` }
    : undefined;

  useEffect(() => {
    const controller = new AbortController();

    async function loadWeather() {
      setWeatherState({
        mine: { city: currentUser?.city || unsetText, text: loadingText, temperature: "--", status: "loading" },
        partner: { city: partnerUser?.city || unsetText, text: loadingText, temperature: "--", status: "loading" },
      });

      try {
        const [mine, partner] = await Promise.all([
          fetchCityWeather(currentUser?.city || "", controller.signal, language),
          fetchCityWeather(partnerUser?.city || "", controller.signal, language),
        ]);
        setWeatherState({ mine, partner });
      } catch (error) {
        if (error.name === "AbortError") return;
        const failed = language === "en" ? "Weather failed" : "天气获取失败";
        setWeatherState({
          mine: { city: currentUser?.city || unsetText, text: failed, temperature: "--", status: "error" },
          partner: { city: partnerUser?.city || unsetText, text: failed, temperature: "--", status: "error" },
        });
      }
    }

    loadWeather();
    return () => controller.abort();
  }, [currentUser?.city, language, loadingText, partnerUser?.city, unsetText]);

  return (
    <div className="stack-lg">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t("home")}</p>
          <h2>Hi, {currentUser?.nickname}</h2>
        </div>
      </header>

      <section className={`card hero-card home-hero ${currentCouple?.homeBackgroundUrl ? "home-hero-photo" : ""}`} style={loveHeroStyle}>
        <div className="stack-sm">
          <p className="eyebrow">{t("loveDays")}</p>
          <h3 className="highlight-number">{love.days ? (language === "en" ? `Day ${love.days}` : `第 ${love.days} 天`) : "--"}</h3>
          <p className="copy">{love.detail}</p>
        </div>
      </section>

      {!todaysDiary ? (
        <Link className="card stack-sm today-diary-reminder" to="/diary/new">
          <div className="section-head">
            <h3 className="page-title">{t("noDiaryToday")}</h3>
            <span className="tag">{language === "en" ? "Write" : "去记录"}</span>
          </div>
          <p className="copy">{t("diaryPrompt")}</p>
        </Link>
      ) : null}

      <section className="card stack-sm important-day-card">
        <div className="section-head">
          <h3 className="page-title">{t("importantDays")}</h3>
          <span className="tag">{t("onlyOne")}</span>
        </div>
        {next ? (
          <Link className="important-day-link" to="/anniversaries">
            <div className="feature-row">
              <div>
                <p className="feature-title">{next.title}</p>
                <p className="muted">{next.nextDate}</p>
              </div>
              <div className="feature-badge">{next.diff === 0 ? (language === "en" ? "Today" : "今天") : (language === "en" ? "Soon" : "即将到来")}</div>
            </div>
            <p className="copy">
              {next.diff === 0
                ? language === "en"
                  ? `${next.title} is today`
                  : `今天就是 ${next.title}`
                : language === "en"
                  ? `${next.diff} days until ${next.title}`
                  : `距离 ${next.title} 还有 ${next.diff} 天`}
            </p>
            <p className="meta-line">{repeatLabels[language][next.repeatType || "none"]}</p>
          </Link>
        ) : (
          <Link className="copy" to="/anniversaries">
            {t("noImportantDays")}
          </Link>
        )}
      </section>

      <section className="card stack-sm weather-card-compact">
        <div className="section-head">
          <h3 className="page-title">{t("weather")}</h3>
          <span className="tag">{language === "en" ? "Live" : "实时"}</span>
        </div>
        <div className="weather-grid compact-weather-grid">
          <WeatherPanel label={t("myCity")} city={currentUser?.city} weather={weatherState.mine} language={language} />
          <WeatherPanel label={t("partnerCity")} city={partnerUser?.city} weather={weatherState.partner} language={language} />
        </div>
      </section>
    </div>
  );
}
