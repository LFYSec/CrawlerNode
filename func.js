import urlparser from 'url'

// parse the nav url
export const parseURL = (url, pageURL) => {
    let result = urlparser.parse(url);
    let parsedUrl = result.href;
    let path = result.pathname;

    let staticSuffix = ['css', 'js', 'jpg', 'png', 'gif', 'svg', 'jpeg', 'ico']

    // drop static resources request
    if(path && path!='/'){
        let pos = path.lastIndexOf('.');
        if(path.substr(pos+1) in staticSuffix){
            return null;
        }
    }

    // drop other hosts
    if(result.host != urlparser.parse(pageURL).host){
        return null;
    }

    // url start with '//'
    if(url.startsWith("//")){
        parsedUrl = "http://" + url.substr(2);
    }

    // relative oath
    if(result.host == null){
        parsedUrl = pageURL + "/" + result.href;
    }

    return parsedUrl;
};

export const getNodeLink = (nodes) => {
    let result = [];
    let attrs = ['src','href','data-url','longDesc','lowsrc']
    for (let node of nodes) {
        for (let attr of attrs){
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