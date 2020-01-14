import {Cluster} from "puppeteer-cluster";

export const inlineEvents = ["onabort", "onblur", "onchange", "onclick", "ondblclick", "onerror","onfocus", "onkeydown","onkeypress", "onkeyup", "onload", "onmousedown","onmousemove", "onmouseout", "onmouseover","onmouseup", "onreset", "onresize", "onselect", "onsubmit", "onunload"];

export const launchOptions = {
    "executablePath": "/Users/lfy/Dev/Node/CrawlerNode/node_modules/puppeteer/.local-chromium/mac-706915/chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    "ignoreHTTPSErrors": true,
    defaultViewport:{
        width: 1920,
        height: 1080
    },
    timeout: 5000,
    args: [
        '--headless',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-xss-auditor',
        '--no-zygote',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--allow-running-insecure-content',
        '--disable-webgl',
        '--disable-popup-blocking',
        '--proxy-server=http://127.0.0.1:8080'
    ],
};

export const clusterLaunchOptions = {
    concurrency: Cluster.CONCURRENCY_PAGE,  // 单Chrome多tab模式 TODO (? CONCURRENCY_CONTEXT)
    maxConcurrency:  3,  // 并发的workers数
    retryLimit: 2,   // 重试次数
    skipDuplicateUrls: true,  // 不爬重复的url
    //monitor: true,  // 显示性能消耗
    puppeteerOptions: launchOptions,

    // concurrency: Cluster.CONCURRENCY_CONTEXT,
};
