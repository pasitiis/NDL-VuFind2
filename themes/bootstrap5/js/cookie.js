/*global VuFind, CookieConsent */

VuFind.register('cookie', function cookie() {
  let consentConfig = null;
  var _COOKIE_DOMAIN = false;
  var _COOKIE_PATH = '/';
  var _COOKIE_SAMESITE = 'Lax';

  function setDomain(domain) {
    _COOKIE_DOMAIN = domain;
  }

  function setCookiePath(path) {
    _COOKIE_PATH = path;
  }

  function setCookieSameSite(sameSite) {
    _COOKIE_SAMESITE = sameSite;
  }

  function _getCookieParams() {
    return { path: _COOKIE_PATH, domain: _COOKIE_DOMAIN, SameSite: _COOKIE_SAMESITE };
  }

  function get(name) {
    return window.Cookies.get(name);
  }

  function set(name, value) {
    return window.Cookies.set(name, value, _getCookieParams());
  }

  function remove(name) {
    return window.Cookies.remove(name, _getCookieParams());
  }

  function updateServiceStatus() {
    Object.entries(consentConfig.controlledVuFindServices).forEach(([category, services]) => {
      // Matomo:
      if (window._paq && services.indexOf('matomo') !== -1) {
        if (CookieConsent.acceptedCategory(category)) {
          window._paq.push(['setCookieConsentGiven']);
        }
      }
    });
  }

  function setupConsent(_config) {
    consentConfig = _config;
    consentConfig.consentDialog.onFirstConsent = function onFirstConsent() {
      VuFind.emit('cookie-consent-first-done');
    };
    consentConfig.consentDialog.onConsent = function onConsent() {
      updateServiceStatus();
      VuFind.emit('cookie-consent-done');
    };
    consentConfig.consentDialog.onChange = function onChange() {
      updateServiceStatus();
      VuFind.emit('cookie-consent-changed');
    };
    consentConfig.consentDialog.onModalReady = function onModalReady({ modalName, modal }) {
      if (modalName === 'consentModal') {

        modal.setAttribute('role', 'section');
        modal.removeAttribute('aria-modal');
        modal.removeAttribute('aria-labelledby');

        // Allow normal tab behavior
        modal.addEventListener('keydown', (e) => {
          if (e.key === 'Tab') {
            e.stopPropagation();
          }
        }, true);

        // Remove tabindex from div-element
        modal.querySelectorAll('div[tabindex="-1"]').forEach(el => {
          el.remove();
        });

        // Focus the title element
        const titleElement = modal.querySelector('.cm__title');
        if (titleElement) {
          titleElement.setAttribute('tabindex', '-1'); // Make it focusable
          setTimeout(() => {
            titleElement.focus();
          }, 300); // Delay for screen readers
        }
      }
    };
    CookieConsent.run(consentConfig.consentDialog);
    VuFind.emit('cookie-consent-initialized');
  }

  function isCategoryAccepted(category) {
    return CookieConsent.acceptedCategory(category);
  }

  function isServiceAllowed(serviceName) {
    for (const [category, services] of Object.entries(consentConfig.controlledVuFindServices)) {
      if (services.indexOf(serviceName) !== -1
        && CookieConsent.acceptedCategory(category)
      ) {
        return true;
      }
    }
    return false;
  }

  function getConsentConfig() {
    return consentConfig;
  }

  return {
    setDomain: setDomain,
    setCookiePath: setCookiePath,
    setCookieSameSite: setCookieSameSite,
    get: get,
    set: set,
    remove: remove,
    setupConsent: setupConsent,
    isCategoryAccepted: isCategoryAccepted,
    isServiceAllowed: isServiceAllowed,
    getConsentConfig: getConsentConfig
  };
});
