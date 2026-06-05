import { APP_VERSION, APP_BRAND_NAME, AD_CONFIG } from './config.js';

// 当前接入策略：
// 1. 优先打通 TikTok Minis 激励视频广告（Rewarded Video Ads）
// 2. Banner / 插屏仍保留桥接骨架，待后台补齐广告位后再打开
// 3. 保持 mock 开关，便于本地浏览器环境回退验证

export class TikTokAdsBridge {
  constructor(state, refs) {
    this.state = state;
    this.refs = refs;
    this.sdk = null;
    this.config = AD_CONFIG;
    this.bannerAd = null;
    this.rewardedAds = new Map();
    this.interstitialAd = null;
  }

  log(level, event, payload = {}) {
    const tag = `[TikTokAdsBridge] ${event}`;
    const data = {
      ts: new Date().toISOString(),
      ...payload
    };
    const logger = console[level] || console.log;
    logger.call(console, tag, data);
  }

  init() {
    this.sdk = window.tt || window.TiktokGame || window.tiktok || null;
    this.log('log', 'init', {
      sdkAvailable: !!this.sdk,
      sdkKeys: this.sdk ? Object.keys(this.sdk).slice(0, 12) : [],
      enabled: this.config.enabled,
      mockSuccess: !!this.config.mockSuccess,
      brand: APP_BRAND_NAME,
      version: APP_VERSION
    });
    this.updateBannerPlaceholder();
  }

  updateBannerPlaceholder() {
    if (!this.refs?.bannerSlot) return;
    const bannerEnabled = this.config.banner?.enabled;
    const mockText = this.config.mockSuccess ? ' / Mock 成功模式已启用' : '';
    this.refs.bannerSlot.textContent = bannerEnabled
      ? `Banner 广告位已预留：${this.config.banner.placement || 'game_bottom'}${mockText}`
      : `Banner 广告位已预留（暂未启用）${mockText}`;
  }

  isEnabled(type) {
    if (!this.config.enabled) return false;
    if (!type) return true;
    return !!this.config[type]?.enabled;
  }

  resolvePlacementId(type, placement) {
    const conf = this.config?.[type];
    if (!conf) return '';
    if (typeof conf.adUnitId === 'string' && conf.adUnitId) return conf.adUnitId;
    if (conf.adUnitIds && placement && conf.adUnitIds[placement]) return conf.adUnitIds[placement];
    return '';
  }

  getRewardedAd(adUnitId) {
    if (!adUnitId || !this.sdk?.createRewardedVideoAd) return null;
    if (!this.rewardedAds.has(adUnitId)) {
      this.log('log', 'rewarded.create', { adUnitId });
      this.rewardedAds.set(adUnitId, this.sdk.createRewardedVideoAd({ adUnitId }));
    } else {
      this.log('log', 'rewarded.reuse', { adUnitId });
    }
    return this.rewardedAds.get(adUnitId);
  }

  async safeLoad(adInstance, label, meta = {}) {
    if (!adInstance?.load) {
      this.log('warn', `${label}.load.unavailable`, meta);
      return true;
    }
    this.log('log', `${label}.load.start`, meta);
    try {
      await adInstance.load();
      this.log('log', `${label}.load.success`, meta);
      return true;
    } catch (err) {
      this.log('warn', `${label}.load.failed`, { ...meta, err });
      return false;
    }
  }

  async safeShow(adInstance, label, meta = {}) {
    if (!adInstance?.show) {
      this.log('warn', `${label}.show.unavailable`, meta);
      return false;
    }
    this.log('log', `${label}.show.start`, meta);
    try {
      await adInstance.show();
      this.log('log', `${label}.show.success`, meta);
      return true;
    } catch (err) {
      this.log('warn', `${label}.show.failed`, { ...meta, err });
      return false;
    }
  }

  attachListener(ad, onName, offName, handler, meta = {}) {
    if (typeof ad?.[onName] === 'function') {
      this.log('log', `listener.attach.${onName}`, meta);
      ad[onName](handler);
    } else {
      this.log('warn', `listener.missing.${onName}`, meta);
    }
    return () => {
      if (typeof ad?.[offName] === 'function') {
        this.log('log', `listener.detach.${offName}`, meta);
        ad[offName](handler);
      }
    };
  }

  async showBanner({ placement } = {}) {
    this.state.bannerVisible = true;
    this.updateBannerPlaceholder();

    const adUnitId = this.resolvePlacementId('banner', placement);
    const meta = { type: 'banner', placement, adUnitId };
    this.log('log', 'banner.request', meta);

    if (!this.isEnabled('banner')) {
      this.log('info', 'banner.skipped.disabled', meta);
      return !!this.config.mockSuccess;
    }

    if (!this.sdk?.createBannerAd) {
      this.log('warn', 'banner.sdk.unavailable', meta);
      return !!this.config.mockSuccess;
    }

    if (!adUnitId) {
      this.log('warn', 'banner.adUnitId.missing', meta);
      return false;
    }

    try {
      if (!this.bannerAd) {
        this.log('log', 'banner.create', meta);
        this.bannerAd = this.sdk.createBannerAd({
          adUnitId,
          style: { left: 0, top: 0, width: 320 }
        });
      }
      const loaded = await this.safeLoad(this.bannerAd, 'banner', meta);
      if (!loaded) return false;
      return await this.safeShow(this.bannerAd, 'banner', meta);
    } catch (err) {
      this.log('warn', 'banner.error', { ...meta, err });
      return false;
    }
  }

  hideBanner() {
    this.state.bannerVisible = false;
    this.updateBannerPlaceholder();

    const meta = { type: 'banner' };
    this.log('log', 'banner.hide.request', meta);

    if (!this.isEnabled('banner')) {
      this.log('info', 'banner.hide.skipped.disabled', meta);
      return !!this.config.mockSuccess;
    }

    try {
      this.bannerAd?.hide?.();
      this.log('log', 'banner.hide.success', meta);
      return true;
    } catch (err) {
      this.log('warn', 'banner.hide.failed', { ...meta, err });
      return false;
    }
  }

  async showInterstitial({ placement } = {}) {
    const adUnitId = this.resolvePlacementId('interstitial', placement);
    const meta = { type: 'interstitial', placement, adUnitId };
    this.log('log', 'interstitial.request', meta);

    if (!this.isEnabled('interstitial')) {
      this.log('info', 'interstitial.skipped.disabled', meta);
      return !!this.config.mockSuccess;
    }

    if (!this.sdk?.createInterstitialAd) {
      this.log('warn', 'interstitial.sdk.unavailable', meta);
      return !!this.config.mockSuccess;
    }

    if (!adUnitId) {
      this.log('warn', 'interstitial.adUnitId.missing', meta);
      return false;
    }

    try {
      if (!this.interstitialAd || this.interstitialAd.__adUnitId !== adUnitId) {
        this.log('log', 'interstitial.create', meta);
        this.interstitialAd = this.sdk.createInterstitialAd({ adUnitId });
        this.interstitialAd.__adUnitId = adUnitId;
      }
      const loaded = await this.safeLoad(this.interstitialAd, 'interstitial', meta);
      if (!loaded) return false;
      return await this.safeShow(this.interstitialAd, 'interstitial', meta);
    } catch (err) {
      this.log('warn', 'interstitial.error', { ...meta, err });
      return false;
    }
  }

  async showRewarded({ placement } = {}) {
    const adUnitId = this.resolvePlacementId('rewarded', placement);
    const meta = { type: 'rewarded', placement, adUnitId };
    this.log('log', 'rewarded.request', meta);

    if (!this.isEnabled('rewarded')) {
      this.log('info', 'rewarded.skipped.disabled', meta);
      return !!this.config.mockSuccess;
    }

    if (!this.sdk?.createRewardedVideoAd) {
      this.log('warn', 'rewarded.sdk.unavailable', meta);
      return !!this.config.mockSuccess;
    }

    if (!adUnitId) {
      this.log('warn', 'rewarded.adUnitId.missing', meta);
      return false;
    }

    const rewardedAd = this.getRewardedAd(adUnitId);
    if (!rewardedAd) {
      this.log('warn', 'rewarded.instance.unavailable', meta);
      return false;
    }

    const loaded = await this.safeLoad(rewardedAd, 'rewarded', meta);
    if (!loaded) return false;

    return new Promise(resolve => {
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        this.log('log', 'rewarded.finish', { ...meta, result: value });
        cleanupFns.forEach(fn => fn());
        resolve(value);
      };

      const handleClose = res => {
        const completed = !!(res?.isEnded || res?.completed || res === undefined);
        this.log('log', 'rewarded.close', { ...meta, closePayload: res, completed });
        finish(completed);
      };

      const handleError = err => {
        this.log('warn', 'rewarded.error', { ...meta, err });
        finish(false);
      };

      const cleanupFns = [
        this.attachListener(rewardedAd, 'onClose', 'offClose', handleClose, meta),
        this.attachListener(rewardedAd, 'onError', 'offError', handleError, meta)
      ];

      this.safeShow(rewardedAd, 'rewarded', meta).then(ok => {
        if (!ok) finish(false);
      });
    });
  }

  async maybeShowLevelInterstitial() {
    const cooldownMs = this.config.interstitial?.cooldownMs || 45000;
    const now = Date.now();
    const elapsed = now - this.state.interstitialShownAt;
    if (elapsed < cooldownMs) {
      this.log('info', 'interstitial.cooldown.hit', { placement: this.config.interstitial?.placement || 'level_finish', elapsed, cooldownMs });
      return false;
    }
    this.state.interstitialShownAt = now;
    this.log('log', 'interstitial.cooldown.pass', { placement: this.config.interstitial?.placement || 'level_finish', elapsed, cooldownMs });
    return this.showInterstitial({ placement: this.config.interstitial?.placement || 'level_finish' });
  }
}
