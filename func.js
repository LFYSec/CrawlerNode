import urlparser from "url"

// parse the nav url
export const parseURL = (url, pageURL) => {
    let result = urlparser.parse(url);
    let parsedUrl = result.href;
    let path = result.pathname;
    let pageHost = urlparser.parse(pageURL).host;

    const staticSuffix = ['css', 'js', 'jpg', 'png', 'gif', 'svg', 'jpeg', 'ico']

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

function isRepeat(url) {
    let path = urlparser.parse(url).path; //TODO
    //console.log(path);
    return false;
}

export const addQueue = (url) => {
    if (!isRepeat(url)) {
/*eslint no-undef:0*/
        cluster.queue(url);
    }
};

export const hookJS = () => {
    const unChange = {writable: false, configurable: false};

    // hook history route
    window.history.pushState = function (a, b, url) {
        HOOK_URL_LIST.push(url);
    };
    Object.defineProperty(window.history, "pushState", unChange);

    window.history.replaceState = function (a, b, url) {
        HOOK_URL_LIST.push(url);
    };
    Object.defineProperty(window.history, "replaceState", unChange);

    // hook hash change route
    window.addEventListener("hashchange", function () {
        HOOK_URL_LIST.push(document.location.href);
    });

    // hook new window
    window.open = function (url) {
        HOOK_URL_LIST.push(url);
    };
    Object.defineProperty(window, 'open', unChange);

    window.close = function () {
        console.log(`trying to close page.`);
    };
    Object.defineProperty(window, "close", unChange);

    // hook new requests
    let oldWebSocket = window.WebSocket;
    window.WebSocket = function (url) {
        HOOK_URL_LIST.push(url);
        console.log(`WebSocket: ${url}`);
        return new oldWebSocket(url);
    };

    let oldEventSource = window.EventSource;
    window.EventSource = function (url) {
        HOOK_URL_LIST.push(url);
        console.log(`EventSource: ${url}`);
        return new oldEventSource(url);
    };

    let oldFetch = window.fetch;
    window.fetch = function (url) {
        HOOK_URL_LIST.push(url);
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

    // hook new dom node
    document.addEventListener('DOMNodeInserted', function(e) {
        let node = e.target;
        if(node.src || node.href){
            let parsedUrl = parseURL(node.src || node.href);
            addQueue(parsedUrl);
        }
    }, true);

    // hook dom2 event
    let _addEventListener = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function(eventName,func,capture) {
        console.log(eventName + ": " + this.tagName);
        EVENT_LIST.push({"eventName": eventName, "element": this})
        _addEventListener.apply(this, arguments);
    };

    // hook dom0 event
    function dom0Hook(that, eventName) {
        console.log(eventName + ": " + that.tagName);
        EVENT_LIST.push({"element": that, "eventName": eventName})
    }

    Object.defineProperties(HTMLElement.prototype, {
        onclick: {set: function(newValue){onclick = newValue;dom0Hook(this, "click");}},
        onchange: {set: function(newValue){onchange = newValue;dom0Hook(this, "change");}},
        onblur: {set: function(newValue){onblur = newValue;dom0Hook(this, "blur");}},
        ondblclick: {set: function(newValue){ondblclick = newValue;dom0Hook(this, "dblclick");}},
        onfocus: {set: function(newValue){onfocus = newValue;dom0Hook(this, "focus");}},
    });

    // 禁止重定义访问器属性
    for(let eventName of ["onclick", "onchange", "onblur", "onfocus", "ondblclick"]){
        Object.defineProperty(HTMLElement.prototype,eventName,{"configurable": false});
    }
};

