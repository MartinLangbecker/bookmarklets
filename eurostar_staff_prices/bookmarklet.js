javascript: (() => {
  const PUB_MARKER = '%22productFamilies%22:[%22PUB%22]';
  const STAFF_MARKER = '%22productFamilies%22:[%22PUB%22]'.replace('PUB', 'STAFF');

  const originalFetch = window.fetch;
  window.fetch = async function (url, options) {
    if (options && options.body && typeof options.body === 'string' && options.body.includes(PUB_MARKER)) {
      options.body = options.body.replace(PUB_MARKER, STAFF_MARKER);
      console.log('[STAFF] fetch intercepted');
    }
    return originalFetch.apply(this, arguments);
  };

  const originalXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    if (body && typeof body === 'string' && body.includes(PUB_MARKER)) {
      body = body.replace(PUB_MARKER, STAFF_MARKER);
      console.log('[STAFF] XHR intercepted');
    }
    originalXhrSend.call(this, body);
  };

  alert('STAFF prices active\n\nReload page to revert.');
})();
