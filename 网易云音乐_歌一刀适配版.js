/**
 * @name 网易云音乐（iosxt API）
 * @description 使用 https://api.iosxt.online 获取网易云歌曲播放地址
 * @version 1.0.1
 * @author ChatGPT
 */

(function () {
  'use strict';

  var lx = globalThis.lx;
  if (!lx || !lx.EVENT_NAMES || typeof lx.on !== 'function' || typeof lx.send !== 'function') {
    console.log('[网易云音源] 歌一刀 lx 接口不存在，脚本无法初始化');
    return;
  }

  var qualityMap = {
    '128k': 'standard',
    '192k': 'higher',
    '320k': 'exhigh',
    'flac': 'lossless',
    'flac24bit': 'hires'
  };

  function requestJson(url) {
    return new Promise(function (resolve, reject) {
      lx.request(url, {
        method: 'GET',
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      }, function (err, response) {
        if (err) return reject(err);
        if (!response || response.statusCode < 200 || response.statusCode >= 300) {
          return reject(new Error('HTTP 请求失败'));
        }
        var body = response.body;
        if (typeof body === 'string') {
          try { body = JSON.parse(body); }
          catch (e) { return reject(new Error('API 返回内容不是 JSON')); }
        }
        resolve(body || {});
      });
    });
  }

  async function getMusicUrl(info, quality) {
    var musicInfo = info && (info.musicInfo || info);
    var id = musicInfo && (musicInfo.songmid || musicInfo.id || musicInfo.musicId);
    if (!id) throw new Error('歌曲信息缺少 id');

    var level = qualityMap[quality] || 'exhigh';
    var url = 'https://api.iosxt.online/song/url/v1?id=' +
      encodeURIComponent(id) + '&level=' + encodeURIComponent(level);

    var data = await requestJson(url);
    var item = data && data.data;
    if (Array.isArray(item)) item = item[0];
    var playUrl = item && (item.url || item.encodeUrl);
    if (!playUrl) {
      // API 可能对部分歌曲不提供所请求音质，降级到标准音质再试
      if (level !== 'standard') {
        var fallback = await requestJson(
          'https://api.iosxt.online/song/url/v1?id=' +
          encodeURIComponent(id) + '&level=standard'
        );
        var fallbackItem = fallback && fallback.data;
        if (Array.isArray(fallbackItem)) fallbackItem = fallbackItem[0];
        playUrl = fallbackItem && (fallbackItem.url || fallbackItem.encodeUrl);
      }
    }
    if (!playUrl) throw new Error('接口没有返回可播放地址');
    return playUrl;
  }

  lx.on(lx.EVENT_NAMES.request, function (data) {
    if (!data || data.action !== 'musicUrl') {
      return Promise.reject(new Error('不支持的操作'));
    }
    return getMusicUrl(data.info, data.info && data.info.type);
  });

  setTimeout(function () {
    lx.send(lx.EVENT_NAMES.inited, {
      sources: {
        wy: {
          name: '网易云音乐（iosxt）',
          type: 'music',
          actions: ['musicUrl'],
          qualitys: ['128k', '320k', 'flac']
        }
      }
    });
    console.log('[网易云音源] 初始化完成');
  }, 100);
})();
