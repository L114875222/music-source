/*
 * 网易云音乐 API 适配器（试用版）
 * API 基址：https://api.iosxt.online
 *
 * 注意：这是通用 ES Module 试验版，不代表已适配歌一刀的专有插件规范。
 * 若应用仍提示不支持，需要根据歌一刀要求的脚本格式继续适配。
 */

const API_BASE = "https://api.iosxt.online";

async function request(path, params = {}) {
  const url = new URL(path, API_BASE);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`API 请求失败：HTTP ${response.status}`);
  return response.json();
}

export async function search(keyword, page = 1, limit = 20) {
  return request("/search", {
    keywords: keyword,
    type: 1,
    limit,
    offset: (page - 1) * limit
  });
}

export async function getTrackUrl(id, level = "exhigh") {
  const result = await request("/song/url/v1", { id, level });
  const item = result?.data?.[0];
  if (!item?.url) throw new Error("接口未返回可播放地址，可能是歌曲无版权或音质不可用");
  return { url: item.url, type: item.type || "mp3", bitrate: item.br || null, raw: result };
}

export async function getLyric(id) {
  return request("/lyric", { id });
}

export async function getSongDetail(ids) {
  return request("/song/detail", {
    ids: Array.isArray(ids) ? ids.join(",") : ids
  });
}

export async function test() {
  return request("/search", { keywords: "晴天", type: 1, limit: 1 });
}

export default {
  name: "网易云音乐 API（试用版）",
  id: "netease-api-iosxt",
  baseUrl: API_BASE,
  search,
  getTrackUrl,
  getLyric,
  getSongDetail,
  test
};
