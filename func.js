import urlparser from 'url'

// parse the nav url
export const parseURL = (url, pageURL) => {
    let result = urlparser.parse(url);
    let parsedUrl = result.href;
    let path = result.pathname;

    let staticSuffix = ['css', 'js', 'jpg', 'png', 'gif', 'svg', 'jpeg', 'ico']

    // drop static resources request
    if (path && path !== '/') {
        let pos = path.lastIndexOf('.');
        if (path.substr(pos + 1) in staticSuffix) {
            return null;
        }
    }

    // drop other hosts
    if (result.host !== urlparser.parse(pageURL).host) {
        return null;
    }

    // url start with '//'
    if (url.startsWith("//")) {
        parsedUrl = "http://" + url.substr(2);
    }

    // relative oath
    if (result.host == null) {
        parsedUrl = pageURL + "/" + result.href;
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
        //return type;
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
            //node.press("Enter");
        }
        return type;
    },
    "selector": 1,
    "textarea": (node) => {
        node.setAttribute("value", "' or 1#");
    },
};
