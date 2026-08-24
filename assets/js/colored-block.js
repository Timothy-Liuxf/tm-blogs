const alertTypes = {
    NOTE: {
        className: "note",
        title: "Note",
        path: "M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
    },
    TIP: {
        className: "tip",
        title: "Tip",
        path: "M8 1.5c-2.363 0-4 1.69-4 3.75 0 1.252.62 2.276 1.36 3.073.44.474.73.99.82 1.527h3.64c.09-.537.38-1.053.82-1.527C11.38 7.526 12 6.502 12 5.25c0-2.06-1.637-3.75-4-3.75ZM2.5 5.25C2.5 2.38 4.92 0 8 0s5.5 2.38 5.5 5.25c0 1.718-.84 3.083-1.76 4.073-.527.566-.74 1.102-.74 1.552v.375a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-.375c0-.45-.213-.986-.74-1.552C3.34 8.333 2.5 6.968 2.5 5.25Zm3.75 8.25a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1-.75-.75Zm.75 2.5a.75.75 0 0 1 0-1.5h2a.75.75 0 0 1 0 1.5Z"
    },
    IMPORTANT: {
        className: "important",
        title: "Important",
        path: "M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
    },
    WARNING: {
        className: "warning",
        title: "Warning",
        path: "M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
    },
    CAUTION: {
        className: "caution",
        title: "Caution",
        path: "M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"
    }
};

const addColoredBlockHandler = () => {
    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("blockquote").forEach((blockquote) => {
            const first = blockquote.firstElementChild;
            if (!first) return;

            const match = first.textContent.trim().match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/);
            if (!match) return;

            const rawType = match[1];
            const alert = alertTypes[rawType];

            blockquote.classList.add("markdown-alert", `markdown-alert-${alert.className}`);

            const title = document.createElement("p");
            title.className = "markdown-alert-title";

            const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            icon.setAttribute("class", "markdown-alert-icon");
            icon.setAttribute("viewBox", "0 0 16 16");
            icon.setAttribute("width", "16");
            icon.setAttribute("height", "16");
            icon.setAttribute("aria-hidden", "true");

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", alert.path);
            icon.appendChild(path);

            const label = document.createElement("span");
            label.textContent = alert.title;

            title.appendChild(icon);
            title.appendChild(label);

            first.textContent = first.textContent.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/, "");

            if (first.textContent.trim() === "") {
                first.remove();
            }

            blockquote.prepend(title);
        });
    });
};
