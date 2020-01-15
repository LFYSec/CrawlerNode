import urlparser from 'url'
import request from "request";
import fs from "fs";

// parse the nav url
export const parseURL = (url, pageURL) => {
    let result = urlparser.parse(url);
    let parsedUrl = result.href;
    let path = result.pathname;
    let pageHost = urlparser.parse(pageURL).host

    let staticSuffix = ['css', 'js', 'jpg', 'png', 'gif', 'svg', 'jpeg', 'ico']

    // drop static resources request
    if (path && path !== '/') {
        let pos = path.lastIndexOf('.');
        if (path.substr(pos + 1) in staticSuffix) {
            return null;
        }
    }

    // relative oath
    if (result.host == null) {
        parsedUrl =  urlparser.resolve("http://" + pageHost, result.href);
    }

    // drop other hosts
    if (result.host !== null && result.host !== pageHost) {
        return null;
    }

    // url start with '//'
    if (url.startsWith("//")) {
        parsedUrl = "http://" + url.substr(2);
    }

    return parsedUrl;
};

export const getNodeLink = (nodes) => {
    let result = [];
    let attrs = ['src', 'href', 'data-url', 'longDesc', 'lowsrc']
    for (let node of nodes) {
        for (let attr of attrs) {
            let link = node.getAttribute(attr);
            if (link) {
                result.push(link)
            }
        }
    }
    return result;
};

export const inlineEventTrigger = (nodes, eventName) => {
    for (let node of nodes) {
        let event = document.createEvent("CustomEvent");
        event.initCustomEvent(eventName, false, true, null);
        try {
            node.dispatchEvent(event);
        } catch (e) {
            console.log(e);
        }
    }
};

export const formHandler = {
    "input": async (node, type) => {
        let nodeExec = await node.executionContext();
        if (type === "text") {
            let guessType = [];
            let typeList = ["email", "password", "url", "tel", "date"];
            guessType.push(await nodeExec.evaluate(node => node.getAttribute("id"), node));
            guessType.push(await nodeExec.evaluate(node => node.getAttribute("class"), node));
            guessType.push(await nodeExec.evaluate(node => node.getAttribute("name"), node));
            typeList.forEach((v) => {
                if (v in typeList) {
                    type = v;
                }
            });
        }

        switch (type) {
            case "email":
                await node.type("lfy@qq.com");
                break;
            case "password":
                await node.type("' or 1#");
                break;
            case "url":
                await node.type("http://www.baidu.com");
                break;
            case "tel":
                await node.type("18181881818");
                break;
            case "date":
                await node.type("2020-10-10");
                break;
            case "file":
                await nodeExec.evaluate(node => node.removeAttribute('accept'), node);
                await nodeExec.evaluate(node => node.removeAttribute('required'), node);
                await node.uploadFile("./image/1.png");
                break;
            case "submit":
                break;
            default:
                await node.type("' or 1#", {delay: 100});
        }
        return type;
    },
    "selector": 1,
    "textarea": async (node) => {
        await node.type("' or 1#", {delay: 100});
    },
};

export const handleNav = async (req, page) => {
    let url = req.url();
    //console.log(req.url());
    let parsedUrl = parseURL(url, page.url());

    // 前或后端跳转，且跳转url经过解析后非空(host与当前page相同)，且非初始化page请求
    if (req.isNavigationRequest() && !req.frame().parentFrame() && parsedUrl != null && parsedUrl !== page.url() && page.url() !== "about:blank") {
        // check 302
        request(parsedUrl, function (error, response, body) {
            if (!error && response.statusCode.toString().substr(0, 2) === '30') {
                if (body != null) {
                    cluster.queue(parsedUrl);
                }
                cluster.queue(response.headers().location);
                req.respond({
                    "status": 204,
                });
                return;
            }
        });

        // check frontend location
        cluster.queue(parsedUrl);

        req.respond({
            "status": 204,
        });
        return;
    }

    if (url.endsWith(".ico") || req.resourceType() === "image" || req.resourceType() === "media") {
        let img = fs.readFileSync("./image/1.jpg");
        req.respond({
            "status": 200,
            "contentType": "image/png",
            "body": img,
        });
        return;
    }

    if (url.indexOf("logout") !== -1) {
        req.respond({
            "status": 204,
        });
    }

    if (parsedUrl != null || page.url() === "about:blank") {
        req.continue();
    } else {
        req.respond({
            "status": 204,
        });
    }
};

export const hookJS = () => {
    const unChange = {writable: false, configurable: false};

    // hook history route
    window.history.pushState = function (a, b, url) {
        console.log(url);
    };
    Object.defineProperty(window.history, "pushState", unChange);

    window.history.replaceState = function (a, b, url) {
        console.log(url);
    };
    Object.defineProperty(window.history, "replaceState", unChange);

    // hook hash change route
    window.addEventListener("hashchange", function () {
        console.log(document.location.href);
    });

    // hook new window
    window.open = function (url) {
        console.log(url);
    };
    Object.defineProperty(window, 'open', unChange);

    window.close = function () {
        console.log(`trying to close page.`);
    };
    Object.defineProperty(window, "close", unChange);

    // hook new requests
    let oldWebSocket = window.WebSocket;
    window.WebSocket = function (url) {
        console.log(`WebSocket: ${url}`);
        return new oldWebSocket(url);
    };

    let oldEventSource = window.EventSource;
    window.EventSource = function (url) {
        console.log(`EventSource: ${url}`);
        return new oldEventSource(url);
    };

    let oldFetch = window.fetch;
    window.fetch = function (url) {
        console.log(`fetch: ${url}`);
        return oldFetch(url);
    };

    // hook form reset
    HTMLFormElement.prototype.reset = function () {
        console.log("cancel reset form")
    };
    Object.defineProperty(HTMLFormElement.prototype, "reset", unChange);

    // hook time func
    let oldSetTimeout = window.setTimeout;
    window.setTimeout = function (time) {
        console.log(`setInterval: ${time}`);
        return oldSetTimeout(1.5);
    };

    let oldSetInterval = window.setInterval;
    window.setInterval = function (time) {
        console.log(`setInterval: ${time}`);
        return oldSetInterval(1.5);
    }

    // inject a hidden iframe to submit form
    let iframe = document.createElement('iframe');
    iframe.name = "i_frame";
    iframe.display = "none";
    document.body.appendChild(iframe);

}