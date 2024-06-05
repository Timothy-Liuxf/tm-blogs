const full_url = window.location.href;
const page_hash = window.location.hash;
const page_search = window.location.search;
const current_url = window.location.origin + window.location.pathname;
const paths = current_url.split('/');
const pattern = /^(zh-CN|zh-TW|en-US|fr-FR)$/;
const lang_index = paths.findIndex(path => pattern.test(path));
const is_main_page = paths.length === 5 && current_url.endsWith('/');

// Get the params and #id in current_url
const params = current_url.split('?')[1];
const hash = current_url.split('#')[1];

document.documentElement.lang = lang_index !== -1 ? paths[lang_index] : 'en-US';
