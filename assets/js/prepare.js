const base_url = "{{ site.github.url }}";
const repo_url = "{{ site.github.repository_url }}";
const repo_branch = "{{ site.github.source.branch }}";
const repo_path = "{{ site.github.source.path }}";
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

const returnToBackPage = () => {
    if (lang_index !== -1) {
        if (lang_index + 2 === paths.length) {
            window.location.href = paths.slice(0, lang_index).join('/') + '/';
        } else {
            window.location.href = paths.slice(0, lang_index + 1).join('/') + '/';
        }
    } else {
        window.location.href = paths.slice(0, 4).join('/') + '/'
    }
};

const viewOnGitHub = () => {
    if (is_main_page) {
        window.location.href = repo_url + '/';
    } else {
        let target = `${repo_url}/blob/${repo_branch}/${repo_path.replace(/\/$/, '')}`;
        if (!target.endsWith('/')) {
            target += '/';
        }
        target += current_url.slice(base_url.length + 1);
        if (target.endsWith('/')) {
            target += 'README.md';
        } else if (target.endsWith('.html')) {
            target = target.replace(/\.html$/, '.md');
        }
        window.location.href = target;
    }
};
