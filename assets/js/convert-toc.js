import fs from "fs";
import path from "path";

const root = ".";

function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    if (item === "_site" || item === ".git" || item === "node_modules") continue;

    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      walk(full);
    } else if (full.endsWith(".md")) {
      convertFile(full);
    }
  }
}

function convertFile(file) {
  let text = fs.readFileSync(file, "utf8");

  // text = text.replace(/^\[TOC\]\s*$/gm, "* TOC\n{:toc}");
  text = text.replace(/^\[TOC\]\s*$/gm, "<div class=\"toc\" markdown=\"1\">\n* TOC\n{:toc}\n</div>");

  fs.writeFileSync(file, text, "utf8");
}

walk(root);
