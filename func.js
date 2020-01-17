import urlparser from "url"

// parse the nav url
export const parseURL = (url, pageURL) => {
    let result = urlparser.parse(url);
    let parsedUrl = result.href;
    let path = result.pathname;
    let pageHost = urlparser.parse(pageURL).host;

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
        parsedUrl = urlparser.resolve("http://" + pageHost, result.href);
    }

    // drop other hosts
    if (result.host !== null && result.host !== pageHost) {
        return null;
    }

    // url start with '//'
    if (url.startsWith("//")) {
        parsedUrl = "http://" + url.substr(2); // TODO https?
    }

    return parsedUrl;
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
    };

    // inject a hidden iframe to submit form
    let iframe = document.createElement('iframe');
    iframe.name = "i_frame";
    iframe.display = "none";
    document.body.appendChild(iframe);
};

function isRepeat(url) {
    let path = urlparser.parse(url).path;
    console.log(url);
    return false;
}

export const addQueue = async (url) => {
    if (!isRepeat(url)) {
        cluster.queue(url);
    }
};