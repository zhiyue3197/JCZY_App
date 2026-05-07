import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const STORAGE_KEY = "needu-app-state-v1";
const LANGUAGE_KEY = "needu-language";
const IMAGE_BUCKET = "needu-images";

const AppContext = createContext(null);

const initialState = {
  users: [],
  couples: [],
  anniversaries: [],
  diaries: [],
  diaryReplies: [],
  albumEntries: [],
  sessionUserId: null,
};

function generateId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createInviteCode(existingCodes) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (existingCodes.has(code));

  return code;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function nowString() {
  return new Date().toISOString();
}

function normalizeUsername(username) {
  return username.trim();
}

function canonicalUsername(username) {
  return normalizeUsername(username).toLowerCase();
}

function isValidUsername(username) {
  return /^[\p{Script=Han}A-Za-z0-9_]{2,20}$/u.test(username);
}

function hashUsername(username) {
  let hash = 2166136261;
  for (let index = 0; index < username.length; index += 1) {
    hash ^= username.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function usernameToInternalEmail(username) {
  const canonical = canonicalUsername(username);
  if (/^[a-z0-9_]{3,20}$/.test(canonical)) {
    return `${canonical}@needu.local`;
  }
  return `u_${hashUsername(canonical)}@needu.local`;
}

function getFileExtension(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext && ext !== fileName ? ext.replace(/[^a-z0-9]/g, "") : "jpg";
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    return { ...initialState, ...JSON.parse(raw) };
  } catch {
    return initialState;
  }
}

function loadLanguage() {
  return localStorage.getItem(LANGUAGE_KEY) || "zh-CN";
}

const translations = {
  "zh-CN": {
    home: "首页",
    diary: "日记",
    album: "相册",
    me: "我的",
    settings: "设置",
    profile: "个人资料",
    coupleSettings: "恋爱空间",
    display: "显示",
    account: "账号",
    importantDays: "重要日子",
    passwordLogout: "密码 / 退出",
    female: "女生",
    male: "男生",
    city: "城市",
    unset: "未设置",
    save: "保存",
    saving: "保存中",
    logout: "退出账号",
    changePassword: "修改密码",
    newPassword: "新密码",
    username: "用户名",
    nickname: "昵称",
    loveStart: "恋爱开始日",
    homeBackground: "恋爱天数背景",
    selectedBackground: "已选背景",
    themeColor: "系统颜色",
    language: "语言",
    pink: "粉色",
    blue: "蓝色",
    green: "绿色",
    avatar: "头像",
    selectedAvatar: "已选头像",
    saveFailed: "保存失败，请稍后再试。",
    passwordUpdated: "密码已更新",
    version: "NeedU v1.0 Beta",
    diarySmall: "小记",
    writeDiary: "写日记",
    editDiary: "编辑日记",
    writeALittle: "写一写",
    editALittle: "改一改",
    diaryDate: "日记日期",
    writeToday: "写下今天...",
    image: "图片",
    noDiary: "还没有日记。",
    unknownUser: "未知用户",
    diaryOf: "的日记",
    partner: "对方",
    comment: "评论",
    writeComment: "写评论",
    editComment: "改一改评论",
    delete: "删除",
    saved: "已保存",
    deleteDiaryConfirm: "确定要删除这篇日记吗？",
    loveDays: "恋爱天数",
    noDiaryToday: "今天还没写日记",
    diaryPrompt: "只写一句也可以，把今天的心情留给彼此。",
    weather: "天气",
    myCity: "我的城市",
    partnerCity: "对方城市",
    onlyOne: "只显示 1 个",
    noImportantDays: "还没有重要日子，去添加生日、见面日或其他想记住的日子吧。",
    addImportantDay: "新增重要日子",
    galleryWall: "图片墙",
    uploading: "上传中",
  },
  en: {
    home: "Home",
    diary: "Diary",
    album: "Album",
    me: "Me",
    settings: "Settings",
    profile: "Profile",
    coupleSettings: "Love Space",
    display: "Display",
    account: "Account",
    importantDays: "Important Days",
    passwordLogout: "Password / Logout",
    female: "Girl",
    male: "Boy",
    city: "City",
    unset: "Not set",
    save: "Save",
    saving: "Saving",
    logout: "Log out",
    changePassword: "Change password",
    newPassword: "New password",
    username: "Username",
    nickname: "Nickname",
    loveStart: "Love start date",
    homeBackground: "Love-days background",
    selectedBackground: "Background selected",
    themeColor: "Theme color",
    language: "Language",
    pink: "Pink",
    blue: "Blue",
    green: "Green",
    avatar: "Avatar",
    selectedAvatar: "Avatar selected",
    saveFailed: "Save failed. Please try again.",
    passwordUpdated: "Password updated",
    version: "NeedU v1.0 Beta",
    diarySmall: "Notes",
    writeDiary: "Write diary",
    editDiary: "Edit diary",
    writeALittle: "Write",
    editALittle: "Edit",
    diaryDate: "Diary date",
    writeToday: "Write about today...",
    image: "Image",
    noDiary: "No diaries yet.",
    unknownUser: "Unknown",
    diaryOf: "'s diary",
    partner: "Partner",
    comment: "Comments",
    writeComment: "Write a comment",
    editComment: "Edit comment",
    delete: "Delete",
    saved: "Saved",
    deleteDiaryConfirm: "Delete this diary?",
    loveDays: "Love Days",
    noDiaryToday: "No diary today",
    diaryPrompt: "One sentence is enough. Leave today here.",
    weather: "Weather",
    myCity: "My city",
    partnerCity: "Partner city",
    onlyOne: "Show 1",
    noImportantDays: "No important days yet. Add a birthday, first date, or anything worth keeping.",
    addImportantDay: "Add important day",
    galleryWall: "Gallery",
    uploading: "Uploading",
  },
};

function buildWeather(city) {
  if (!city) return { text: "请先设置城市", temperature: "--" };

  const presets = [
    { text: "多云", temperature: "22°C" },
    { text: "晴朗", temperature: "24°C" },
    { text: "小雨", temperature: "19°C" },
    { text: "阴天", temperature: "20°C" },
    { text: "微风", temperature: "21°C" },
  ];

  const score = city.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return presets[score % presets.length];
}

function mapProfile(row, existing = {}) {
  return {
    id: row.id,
    email: existing.email || "",
    username: row.username || existing.username || "",
    nickname: row.nickname || "",
    city: row.city || "",
    gender: row.gender || existing.gender || "female",
    avatarUrl: row.avatar_url || "",
    coupleId: row.couple_id || null,
    createdAt: row.created_at || existing.createdAt || nowString(),
    updatedAt: row.updated_at || existing.updatedAt || nowString(),
  };
}

function mapCouple(row, memberIds = []) {
  return {
    id: row.id,
    inviteCode: row.invite_code,
    createdBy: row.created_by,
    memberIds,
    loveStartDate: row.love_start_date || "",
    homeBackgroundUrl: row.home_background_url || "",
    createdAt: row.created_at || nowString(),
  };
}

function mapAnniversary(row) {
  return {
    id: row.id,
    coupleId: row.couple_id,
    title: row.title,
    date: row.date,
    repeatType: row.repeat_type || "none",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDiary(row) {
  const imageUrls = Array.isArray(row.image_urls)
    ? row.image_urls
    : row.image_url
      ? [row.image_url]
      : [];

  return {
    id: row.id,
    coupleId: row.couple_id,
    authorId: row.author_id,
    diaryDate: row.diary_date,
    mood: row.mood,
    content: row.content,
    imageUrl: row.image_url || "",
    imageUrls,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDiaryReply(row) {
  return {
    id: row.id,
    diaryId: row.diary_id,
    authorId: row.author_id,
    content: row.content,
    createdAt: row.created_at,
  };
}

function mapAlbumEntry(row) {
  return {
    id: row.id,
    coupleId: row.couple_id,
    albumDate: row.album_date,
    imageUrl: row.image_url,
    note: row.note || "",
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mergeById(localItems, remoteItems) {
  const remoteIds = new Set(remoteItems.map((item) => item.id));
  return [...localItems.filter((item) => !remoteIds.has(item.id)), ...remoteItems];
}

async function ensureProfileRecord(user, existingUser) {
  if (!supabase || !user) return;

  const remoteProfile = await fetchProfile(user.id);
  const payload = {
    id: user.id,
    username: remoteProfile?.username || existingUser?.username || user.user_metadata?.username || "",
    nickname: remoteProfile?.nickname || existingUser?.nickname || user.user_metadata?.nickname || "",
    city: remoteProfile?.city || existingUser?.city || user.user_metadata?.city || "",
    gender: remoteProfile?.gender || existingUser?.gender || user.user_metadata?.gender || "female",
    avatar_url: remoteProfile?.avatar_url || existingUser?.avatarUrl || "",
    couple_id: remoteProfile?.couple_id || existingUser?.coupleId || null,
  };

  await supabase.from("profiles").upsert(payload, { onConflict: "id" });
}

async function fetchProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,nickname,city,gender,avatar_url,couple_id,created_at,updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export function AppProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [language, setLanguageState] = useState(loadLanguage);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function setLanguage(nextLanguage) {
    const normalized = nextLanguage === "en" ? "en" : "zh-CN";
    localStorage.setItem(LANGUAGE_KEY, normalized);
    setLanguageState(normalized);
  }

  function t(key) {
    return translations[language]?.[key] || translations["zh-CN"][key] || key;
  }

  async function loadRemoteData(userId, authUser) {
    if (!supabase || !userId) return;

    const localSnapshot = loadState();
    const existingUser = localSnapshot.users.find((user) => user.id === userId);
    await ensureProfileRecord(authUser, existingUser);

    const profile = await fetchProfile(userId);
    if (!profile) return;

    let coupleId = profile.couple_id;
    if (!coupleId) {
      const { data: ownMembership } = await supabase
        .from("couple_members")
        .select("couple_id")
        .eq("user_id", userId)
        .maybeSingle();
      coupleId = ownMembership?.couple_id || null;
    }

    const remoteUsers = [mapProfile(profile, existingUser)];
    let remoteCouple = null;
    let remoteAnniversaries = [];
    let remoteDiaries = [];
    let remoteReplies = [];
    let remoteAlbumEntries = [];

    if (coupleId) {
      const [
        coupleResult,
        membersResult,
        anniversariesResult,
        diariesResult,
        repliesResult,
        albumResult,
      ] = await Promise.all([
        supabase.from("couples").select("id,invite_code,created_by,love_start_date,home_background_url,created_at").eq("id", coupleId).maybeSingle(),
        supabase.from("couple_members").select("couple_id,user_id,created_at").eq("couple_id", coupleId),
        supabase.from("anniversaries").select("*").eq("couple_id", coupleId),
        supabase.from("diaries").select("*").eq("couple_id", coupleId),
        supabase.from("diary_replies").select("id,diary_id,author_id,content,created_at"),
        supabase.from("album_entries").select("*").eq("couple_id", coupleId),
      ]);

      const memberIds = membersResult.data?.map((member) => member.user_id) || [userId];

      if (memberIds.length > 0) {
        const { data: memberProfiles } = await supabase
          .from("profiles")
          .select("id,username,nickname,city,gender,avatar_url,couple_id,created_at,updated_at")
          .in("id", memberIds);

        for (const memberProfile of memberProfiles || []) {
          const localUser = localSnapshot.users.find((user) => user.id === memberProfile.id);
          if (!remoteUsers.some((user) => user.id === memberProfile.id)) {
            remoteUsers.push(mapProfile(memberProfile, localUser));
          }
        }
      }

      if (coupleResult.data) {
        remoteCouple = mapCouple(coupleResult.data, memberIds);
      }

      const visibleDiaryIds = new Set((diariesResult.data || []).map((diary) => diary.id));
      remoteAnniversaries = (anniversariesResult.data || []).map(mapAnniversary);
      remoteDiaries = (diariesResult.data || []).map(mapDiary);
      remoteReplies = (repliesResult.data || []).filter((reply) => visibleDiaryIds.has(reply.diary_id)).map(mapDiaryReply);
      remoteAlbumEntries = (albumResult.data || []).map(mapAlbumEntry);
    }

    setState((current) => {
      const users = mergeById(current.users, remoteUsers).map((user) =>
        user.id === userId ? { ...user, coupleId: coupleId || user.coupleId } : user,
      );

      return {
        ...current,
        users,
        couples: remoteCouple ? mergeById(current.couples, [remoteCouple]) : current.couples,
        anniversaries: mergeById(current.anniversaries, remoteAnniversaries),
        diaries: mergeById(current.diaries, remoteDiaries),
        diaryReplies: mergeById(current.diaryReplies, remoteReplies),
        albumEntries: mergeById(current.albumEntries, remoteAlbumEntries),
        sessionUserId: userId,
      };
    });
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthReady(true);
      return;
    }

    let mounted = true;

    function applySessionUser(sessionUser) {
      setState((current) => {
        const existing = current.users.find((user) => user.id === sessionUser.id);
        const nextUser = {
          id: sessionUser.id,
          email: sessionUser.email || existing?.email || "",
          username: existing?.username || sessionUser.user_metadata?.username || "",
          nickname: existing?.nickname || sessionUser.user_metadata?.nickname || "",
          city: existing?.city || sessionUser.user_metadata?.city || "",
          gender: existing?.gender || sessionUser.user_metadata?.gender || "female",
          coupleId: existing?.coupleId || null,
          createdAt: existing?.createdAt || nowString(),
          updatedAt: nowString(),
        };

        return {
          ...current,
          users: existing
            ? current.users.map((user) => (user.id === sessionUser.id ? { ...user, ...nextUser } : user))
            : [...current.users, nextUser],
          sessionUserId: sessionUser.id,
        };
      });

      loadRemoteData(sessionUser.id, sessionUser).finally(() => {
        if (mounted) setAuthReady(true);
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        applySessionUser(data.session.user);
      } else {
        setState((current) => ({ ...current, sessionUserId: null }));
        setAuthReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        applySessionUser(session.user);
      } else {
        setState((current) => ({ ...current, sessionUserId: null }));
        if (mounted) setAuthReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const currentUser = useMemo(
    () => state.users.find((user) => user.id === state.sessionUserId) || null,
    [state.sessionUserId, state.users],
  );

  const currentCouple = useMemo(
    () => state.couples.find((couple) => couple.id === currentUser?.coupleId) || null,
    [currentUser?.coupleId, state.couples],
  );

  const partnerUser = useMemo(() => {
    if (!currentCouple || !currentUser) return null;

    return (
      state.users.find(
        (user) => user.id !== currentUser.id && currentCouple.memberIds.includes(user.id),
      ) || null
    );
  }, [currentCouple, currentUser, state.users]);

  const coupleMemberCount = currentCouple?.memberIds.length || 0;

  const coupleAnniversaries = useMemo(() => {
    if (!currentCouple) return [];
    return state.anniversaries
      .filter((item) => item.coupleId === currentCouple.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [currentCouple, state.anniversaries]);

  const coupleDiaries = useMemo(() => {
    if (!currentCouple) return [];
    return state.diaries
      .filter((item) => item.coupleId === currentCouple.id)
      .sort((a, b) => b.diaryDate.localeCompare(a.diaryDate) || b.createdAt.localeCompare(a.createdAt));
  }, [currentCouple, state.diaries]);

  const coupleAlbumEntries = useMemo(() => {
    if (!currentCouple) return [];
    return state.albumEntries
      .filter((item) => item.coupleId === currentCouple.id)
      .sort((a, b) => b.albumDate.localeCompare(a.albumDate));
  }, [currentCouple, state.albumEntries]);

  async function register({ username, password }) {
    const normalizedUsername = normalizeUsername(username);
    const internalEmail = usernameToInternalEmail(normalizedUsername);

    if (!normalizedUsername || !password) {
      return { ok: false, message: "请先填写用户名和密码。" };
    }
    if (!isValidUsername(normalizedUsername)) {
      return { ok: false, message: "用户名可使用 2-20 位中文、英文字母、数字或下划线。" };
    }
    if (password.length < 6) {
      return { ok: false, message: "密码至少 6 位。" };
    }
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, message: "Supabase 还没有配置完成。" };
    }

    const { data: isAvailable, error: availabilityError } = await supabase.rpc("is_username_available", {
      target_username: normalizedUsername,
    });

    if (availabilityError) {
      return { ok: false, message: availabilityError.message };
    }
    if (!isAvailable) {
      return { ok: false, message: "这个用户名已经被使用了。" };
    }

    const { data, error } = await supabase.auth.signUp({
      email: internalEmail,
      password,
      options: {
        data: {
          username: normalizedUsername,
          nickname: normalizedUsername,
          city: "",
          gender: "female",
        },
      },
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    if (data.user) {
      setState((current) => {
        const exists = current.users.find((user) => user.id === data.user.id);
        const profile = {
          id: data.user.id,
          email: data.user.email || internalEmail,
          username: normalizedUsername,
          nickname: normalizedUsername,
          city: "",
          gender: "female",
          coupleId: exists?.coupleId || null,
          createdAt: exists?.createdAt || nowString(),
          updatedAt: nowString(),
        };

        return {
          ...current,
          users: exists
            ? current.users.map((user) => (user.id === data.user.id ? profile : user))
            : [...current.users, profile],
          sessionUserId: data.session ? data.user.id : current.sessionUserId,
        };
      });
    }

    if (!data.session) {
      return { ok: true, message: "注册成功。请先在 Supabase 关闭邮箱确认，然后重新登录。" };
    }

    return { ok: true };
  }

  async function login({ username, password }) {
    const normalizedUsername = normalizeUsername(username);
    const internalEmail = usernameToInternalEmail(normalizedUsername);
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, message: "Supabase 还没有配置完成。" };
    }
    if (!normalizedUsername || !password) {
      return { ok: false, message: "请先填写用户名和密码。" };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    if (data.user) {
      await loadRemoteData(data.user.id, data.user);
    }

    return { ok: true };
  }

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setState((current) => ({ ...current, sessionUserId: null }));
  }

  async function createCouple() {
    if (!currentUser) return { ok: false, message: "请先登录。" };
    if (currentUser.coupleId) return { ok: false, message: "你已经在情侣空间里了。" };

    const inviteCode = createInviteCode(new Set(state.couples.map((item) => item.inviteCode)));

    if (supabase) {
      const { data: coupleRow, error: coupleError } = await supabase
        .from("couples")
        .insert({
          invite_code: inviteCode,
          created_by: currentUser.id,
          love_start_date: null,
        })
        .select("id,invite_code,created_by,love_start_date,home_background_url,created_at")
        .single();

      if (coupleError) return { ok: false, message: coupleError.message };

      const { error: memberError } = await supabase.from("couple_members").insert({
        couple_id: coupleRow.id,
        user_id: currentUser.id,
      });
      if (memberError) return { ok: false, message: memberError.message };

      await supabase.from("profiles").update({ couple_id: coupleRow.id }).eq("id", currentUser.id);

      const couple = mapCouple(coupleRow, [currentUser.id]);
      setState((current) => ({
        ...current,
        couples: [...current.couples, couple],
        users: current.users.map((user) =>
          user.id === currentUser.id
            ? { ...user, coupleId: couple.id, updatedAt: nowString() }
            : user,
        ),
      }));

      return { ok: true, inviteCode };
    }

    const couple = {
      id: generateId("couple"),
      inviteCode,
      createdBy: currentUser.id,
      memberIds: [currentUser.id],
      loveStartDate: "",
      homeBackgroundUrl: "",
      createdAt: nowString(),
    };

    setState((current) => ({
      ...current,
      couples: [...current.couples, couple],
      users: current.users.map((user) =>
        user.id === currentUser.id
          ? { ...user, coupleId: couple.id, updatedAt: nowString() }
          : user,
      ),
    }));

    return { ok: true, inviteCode };
  }

  async function joinCouple(inviteCode) {
    if (!currentUser) return { ok: false, message: "请先登录。" };
    if (currentUser.coupleId) return { ok: false, message: "你已经在情侣空间里了。" };

    const normalizedCode = inviteCode.trim().toUpperCase();

    if (supabase) {
      const { data: coupleRow, error: coupleError } = await supabase
        .from("couples")
        .select("id,invite_code,created_by,love_start_date,home_background_url,created_at")
        .eq("invite_code", normalizedCode)
        .maybeSingle();

      if (coupleError) return { ok: false, message: coupleError.message };
      if (!coupleRow) return { ok: false, message: "邀请码错误。" };

      const { data: memberRows, error: membersError } = await supabase
        .from("couple_members")
        .select("user_id")
        .eq("couple_id", coupleRow.id);

      if (membersError) return { ok: false, message: membersError.message };
      if ((memberRows || []).length >= 2) {
        return { ok: false, message: "这个情侣空间已经满员了。" };
      }

      const { error: joinError } = await supabase.from("couple_members").insert({
        couple_id: coupleRow.id,
        user_id: currentUser.id,
      });
      if (joinError) return { ok: false, message: joinError.message };

      await supabase.from("profiles").update({ couple_id: coupleRow.id }).eq("id", currentUser.id);
      await loadRemoteData(currentUser.id, { id: currentUser.id, email: currentUser.email, user_metadata: currentUser });

      return { ok: true };
    }

    const target = state.couples.find((item) => item.inviteCode === normalizedCode);

    if (!target) {
      return { ok: false, message: "邀请码错误。" };
    }
    if (target.memberIds.length >= 2) {
      return { ok: false, message: "这个情侣空间已经满员了。" };
    }

    setState((current) => ({
      ...current,
      couples: current.couples.map((couple) =>
        couple.id === target.id
          ? { ...couple, memberIds: [...couple.memberIds, currentUser.id] }
          : couple,
      ),
      users: current.users.map((user) =>
        user.id === currentUser.id
          ? { ...user, coupleId: target.id, updatedAt: nowString() }
          : user,
      ),
    }));

    return { ok: true };
  }

  async function updateProfile(payload) {
    if (!currentUser) return { ok: false, message: "请先登录。" };

    const nickname = payload.nickname.trim();
    const city = payload.city.trim();
    const gender = payload.gender === "male" ? "male" : "female";
    const avatarUrl = payload.avatarUrl || "";
    const loveStartDate = payload.loveStartDate || "";
    const homeBackgroundUrl = payload.homeBackgroundUrl || currentCouple?.homeBackgroundUrl || "";

    if (supabase) {
      const profilePayload = {
        username: currentUser.username || nickname,
        nickname,
        city,
        gender,
        avatar_url: avatarUrl,
        couple_id: currentUser.coupleId || null,
      };

      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .update(profilePayload)
        .eq("id", currentUser.id)
        .select("id,username,nickname,city,gender,avatar_url,couple_id,created_at,updated_at")
        .maybeSingle();

      if (profileError) {
        return { ok: false, message: profileError.message };
      }

      if (!profileData) {
        const insertResult = await supabase
          .from("profiles")
          .insert({ id: currentUser.id, ...profilePayload })
          .select("id,username,nickname,city,gender,avatar_url,couple_id,created_at,updated_at")
          .single();

        profileData = insertResult.data;
        profileError = insertResult.error;

        if (profileError) {
          return { ok: false, message: profileError.message };
        }
      }

      if (currentUser.coupleId) {
        const { error: coupleError } = await supabase
          .from("couples")
          .update({
            love_start_date: loveStartDate || null,
            home_background_url: homeBackgroundUrl,
          })
          .eq("id", currentUser.coupleId);

        if (coupleError) {
          return { ok: false, message: coupleError.message };
        }
      }

      const savedUser = mapProfile(profileData, currentUser);

      setState((current) => ({
        ...current,
        users: current.users.map((user) => (user.id === currentUser.id ? savedUser : user)),
        couples: current.couples.map((couple) =>
          couple.id === currentUser.coupleId ? { ...couple, loveStartDate, homeBackgroundUrl } : couple,
        ),
      }));

      return { ok: true, user: savedUser };
    }

    const savedUser = {
      ...currentUser,
      nickname,
      city,
      gender,
      avatarUrl,
      updatedAt: nowString(),
    };

    setState((current) => ({
      ...current,
      users: current.users.map((user) => (user.id === currentUser.id ? savedUser : user)),
      couples: current.couples.map((couple) =>
        couple.id === currentUser.coupleId ? { ...couple, loveStartDate, homeBackgroundUrl } : couple,
      ),
    }));

    return { ok: true, user: savedUser };
  }

  async function updatePassword(password) {
    if (!currentUser) return { ok: false, message: "请先登录。" };
    if (!password || password.length < 6) {
      return { ok: false, message: "密码至少 6 位。" };
    }
    if (!supabase) {
      return { ok: false, message: "Supabase 还没有配置完成。" };
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  }

  async function ensureInviteCode() {
    if (!currentCouple) return { ok: false, message: "请先创建恋爱空间。" };
    if (currentCouple.inviteCode) return { ok: true, inviteCode: currentCouple.inviteCode };

    const inviteCode = createInviteCode(new Set(state.couples.map((item) => item.inviteCode).filter(Boolean)));

    if (supabase) {
      const { error } = await supabase
        .from("couples")
        .update({ invite_code: inviteCode })
        .eq("id", currentCouple.id);

      if (error) return { ok: false, message: error.message };
    }

    setState((current) => ({
      ...current,
      couples: current.couples.map((couple) =>
        couple.id === currentCouple.id ? { ...couple, inviteCode } : couple,
      ),
    }));

    return { ok: true, inviteCode };
  }

  async function addAnniversary(payload = {}) {
    if (!currentCouple) return { ok: false, message: "请先完成情侣绑定。" };

    const base = {
      coupleId: currentCouple.id,
      title: "新的重要日子",
      date: payload.date || todayString(),
      repeatType: payload.repeatType || "yearly",
      createdAt: nowString(),
      updatedAt: nowString(),
    };
    base.title = (payload.title || "").trim();

    if (!base.title) return { ok: false, message: "请填写重要日子的名称。" };

    if (supabase) {
      const { data, error } = await supabase
        .from("anniversaries")
        .insert({
          couple_id: base.coupleId,
          title: base.title,
          date: base.date,
          repeat_type: base.repeatType,
        })
        .select("*")
        .single();
      if (error) return { ok: false, message: error.message };
      const anniversary = mapAnniversary(data);
      setState((current) => ({ ...current, anniversaries: [...current.anniversaries, anniversary] }));
      return { ok: true, id: anniversary.id };
    }

    const anniversary = { id: generateId("ann"), ...base };
    setState((current) => ({
      ...current,
      anniversaries: [...current.anniversaries, anniversary],
    }));
    return { ok: true, id: anniversary.id };
  }

  async function updateAnniversary(id, patch) {
    setState((current) => ({
      ...current,
      anniversaries: current.anniversaries.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: nowString() } : item,
      ),
    }));

    if (supabase) {
      const dbPatch = {};
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.date !== undefined) dbPatch.date = patch.date;
      if (patch.repeatType !== undefined) dbPatch.repeat_type = patch.repeatType;
      const { error } = await supabase.from("anniversaries").update(dbPatch).eq("id", id);
      if (error) return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  async function deleteAnniversary(id) {
    setState((current) => ({
      ...current,
      anniversaries: current.anniversaries.filter((item) => item.id !== id),
    }));

    if (supabase) {
      await supabase.from("anniversaries").delete().eq("id", id);
    }
  }

  function getDiaryById(id) {
    return state.diaries.find((item) => item.id === id) || null;
  }

  async function saveDiary({ id, diaryDate, mood, content, imageUrl = "", imageUrls = [] }) {
    if (!currentUser || !currentCouple) return { ok: false, message: "请先完成情侣绑定。" };
    if (!content.trim()) return { ok: false, message: "日记正文不能为空。" };
    if (content.trim().length > 2000) return { ok: false, message: "正文最多 2000 字。" };

    const cleanImageUrls = imageUrls.map((url) => url.trim()).filter(Boolean);
    const firstImageUrl = cleanImageUrls[0] || imageUrl.trim();

    const sameDayDiary = state.diaries.find(
      (item) =>
        item.coupleId === currentCouple.id &&
        item.authorId === currentUser.id &&
        item.diaryDate === diaryDate,
    );

    if (sameDayDiary && sameDayDiary.id !== id) {
      return { ok: false, message: "你当天已经写过日记了，请直接编辑那篇。" };
    }

    const payload = {
      coupleId: currentCouple.id,
      authorId: currentUser.id,
      diaryDate,
      mood,
      content: content.trim(),
      imageUrl: firstImageUrl,
      imageUrls: cleanImageUrls.length > 0 ? cleanImageUrls : firstImageUrl ? [firstImageUrl] : [],
      updatedAt: nowString(),
    };

    if (supabase) {
      const dbPayload = {
        couple_id: payload.coupleId,
        author_id: payload.authorId,
        diary_date: payload.diaryDate,
        mood: payload.mood,
        content: payload.content,
        image_url: payload.imageUrl,
        image_urls: payload.imageUrls,
      };

      const request = id
        ? supabase.from("diaries").update(dbPayload).eq("id", id).select("*").single()
        : supabase.from("diaries").insert(dbPayload).select("*").single();

      const { data, error } = await request;
      if (error) return { ok: false, message: error.message };

      const diary = mapDiary(data);
      setState((current) => ({
        ...current,
        diaries: id
          ? current.diaries.map((item) => (item.id === id ? diary : item))
          : [...current.diaries, diary],
      }));

      return { ok: true, id: diary.id };
    }

    if (id) {
      setState((current) => ({
        ...current,
        diaries: current.diaries.map((item) => (item.id === id ? { ...item, ...payload } : item)),
      }));
      return { ok: true, id };
    }

    const diary = {
      id: generateId("diary"),
      ...payload,
      createdAt: nowString(),
    };

    setState((current) => ({
      ...current,
      diaries: [...current.diaries, diary],
    }));

    return { ok: true, id: diary.id };
  }

  async function deleteDiary(id) {
    const diary = getDiaryById(id);
    if (!diary || diary.authorId !== currentUser?.id) {
      return { ok: false, message: "只能删除自己的日记。" };
    }

    setState((current) => ({
      ...current,
      diaries: current.diaries.filter((item) => item.id !== id),
      diaryReplies: current.diaryReplies.filter((reply) => reply.diaryId !== id),
    }));

    if (supabase) {
      const { error } = await supabase.from("diaries").delete().eq("id", id);
      if (error) return { ok: false, message: error.message };
    }

    return { ok: true };
  }

  async function saveDiaryReply({ diaryId, content }) {
    if (!currentUser) return { ok: false, message: "请先登录。" };
    const diary = getDiaryById(diaryId);

    if (!diary) return { ok: false, message: "这篇日记不存在。" };
    if (!content.trim()) return { ok: false, message: "回复内容不能为空。" };
    if (content.trim().length > 300) return { ok: false, message: "回复最多 300 字。" };

    if (supabase) {
      const dbPayload = {
        diary_id: diaryId,
        author_id: currentUser.id,
        content: content.trim(),
      };

      const { data, error } = await supabase.from("diary_replies").insert(dbPayload).select("*").single();
      if (error) {
        if (error.code === "23505" && error.message.includes("diary_replies_diary_id_author_id_key")) {
          return {
            ok: false,
            message: "数据库里还保留着旧限制。请在 Supabase 重新运行 schema.sql 里的 diary_replies 更新后再试。",
          };
        }
        return { ok: false, message: error.message };
      }

      const reply = mapDiaryReply(data);
      setState((current) => ({
        ...current,
        diaryReplies: [...current.diaryReplies, reply],
      }));
      return { ok: true };
    }

    const reply = {
      id: generateId("reply"),
      diaryId,
      authorId: currentUser.id,
      content: content.trim(),
      createdAt: nowString(),
    };

    setState((current) => ({
      ...current,
      diaryReplies: [...current.diaryReplies, reply],
    }));

    return { ok: true };
  }

  async function deleteDiaryReply(id) {
    const reply = state.diaryReplies.find((item) => item.id === id);
    if (!reply || reply.authorId !== currentUser?.id) {
      return { ok: false, message: "只能删除自己的评论。" };
    }

    setState((current) => ({
      ...current,
      diaryReplies: current.diaryReplies.filter((item) => item.id !== id),
    }));

    if (supabase) {
      const { error } = await supabase.from("diary_replies").delete().eq("id", id);
      if (error) return { ok: false, message: error.message };
    }

    return { ok: true };
  }

  async function saveAlbumEntry({ albumDate, imageUrl, note }) {
    if (!currentUser || !currentCouple) return { ok: false, message: "请先完成情侣绑定。" };
    if (!imageUrl.trim()) return { ok: false, message: "请先填写图片链接。" };
    if (note.trim().length > 100) return { ok: false, message: "备注最多 100 字。" };

    const existingEntry = state.albumEntries.find(
      (item) => item.coupleId === currentCouple.id && item.albumDate === albumDate,
    );

    const payload = {
      coupleId: currentCouple.id,
      albumDate,
      imageUrl: imageUrl.trim(),
      note: note.trim(),
      uploadedBy: currentUser.id,
      updatedAt: nowString(),
    };

    if (supabase) {
      const dbPayload = {
        couple_id: payload.coupleId,
        album_date: payload.albumDate,
        image_url: payload.imageUrl,
        note: payload.note,
        uploaded_by: payload.uploadedBy,
      };

      const request = existingEntry
        ? supabase.from("album_entries").update(dbPayload).eq("id", existingEntry.id).select("*").single()
        : supabase.from("album_entries").insert(dbPayload).select("*").single();

      const { data, error } = await request;
      if (error) return { ok: false, message: error.message };

      const entry = mapAlbumEntry(data);
      setState((current) => ({
        ...current,
        albumEntries: existingEntry
          ? current.albumEntries.map((item) => (item.id === existingEntry.id ? entry : item))
          : [...current.albumEntries, entry],
      }));
      return { ok: true };
    }

    if (existingEntry) {
      setState((current) => ({
        ...current,
        albumEntries: current.albumEntries.map((item) =>
          item.id === existingEntry.id ? { ...item, ...payload } : item,
        ),
      }));
      return { ok: true };
    }

    const entry = {
      id: generateId("album"),
      ...payload,
      createdAt: nowString(),
    };

    setState((current) => ({
      ...current,
      albumEntries: [...current.albumEntries, entry],
    }));

    return { ok: true };
  }

  async function deleteAlbumEntry(id) {
    const entry = state.albumEntries.find((item) => item.id === id);
    if (!entry) return { ok: false, message: "这张相册记录不存在。" };

    setState((current) => ({
      ...current,
      albumEntries: current.albumEntries.filter((item) => item.id !== id),
    }));

    if (supabase) {
      const { error } = await supabase.from("album_entries").delete().eq("id", id);
      if (error) return { ok: false, message: error.message };
    }

    return { ok: true };
  }

  async function uploadImage(file, scope = "images") {
    if (!currentUser || !currentCouple) return { ok: false, message: "请先完成情侣绑定。" };
    if (!supabase) return { ok: false, message: "Supabase 还没有配置完成，暂时不能上传图片。" };
    if (!file) return { ok: false, message: "请先选择图片。" };
    if (!file.type.startsWith("image/")) return { ok: false, message: "只能上传图片文件。" };

    const extension = getFileExtension(file.name);
    const filePath = `${currentCouple.id}/${currentUser.id}/${scope}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${extension}`;

    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) return { ok: false, message: error.message };

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
    return { ok: true, url: data.publicUrl };
  }

  const value = {
    state,
    authReady,
    currentUser,
    currentCouple,
    partnerUser,
    coupleMemberCount,
    coupleAnniversaries,
    coupleDiaries,
    coupleAlbumEntries,
    diaryReplies: state.diaryReplies,
    register,
    login,
    logout,
    createCouple,
    joinCouple,
    updateProfile,
    updatePassword,
    ensureInviteCode,
    addAnniversary,
    updateAnniversary,
    deleteAnniversary,
    getDiaryById,
    saveDiary,
    deleteDiary,
    saveDiaryReply,
    deleteDiaryReply,
    saveAlbumEntry,
    deleteAlbumEntry,
    uploadImage,
    buildWeather,
    todayString,
    isSupabaseConfigured,
    language,
    setLanguage,
    t,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
