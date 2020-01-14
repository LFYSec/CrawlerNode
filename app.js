import {Cluster} from 'puppeteer-cluster'
import fs from 'fs'
import request from 'request'
import * as func from './func'
import * as config from './config'

async function preparePage(page) {
    // set ua
    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36");
    // insert hook code
    await page.evaluateOnNewDocument(hookJS);
    // open req intercept
    await page.setRequestInterception(true);
    // open js ability
    await page.setJavaScriptEnabled(true);
    // close catch
    await page.setCacheEnabled(false);
}

function hookJS() {
    const unChange = {writable: false, configurable: false};

    // hook history route
    window.history.pushState = function (a, b, url) { console.log(url);};
    Object.defineProperty(window.history,"pushState",unChange);

    window.history.replaceState = function (a, b, url) { console.log(url);};
    Object.defineProperty(window.history,"replaceState",unChange);

    // hook hash change route
    window.addEventListener("hashchange", function () {console.log(document.location.href);});

    // hook new window
    window.open = function (url) { console.log(url);};
    Object.defineProperty(window, 'open', unChange);

    window.close = function () {console.log(`trying to close page.`);};
    Object.defineProperty(window,"close",unChange);

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
    HTMLFormElement.prototype.reset = function () {console.log("cancel reset form")};
    Object.defineProperty(HTMLFormElement.prototype,"reset",unChange);

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

}

async function handleNav(req, page) {
    let url = req.url();
    //console.log(req.url());
    let parsedUrl = func.parseURL(url, page.url());

    // 前或后端跳转，且跳转url经过解析后非空(host与当前page相同)，且非初始化page请求
    if (req.isNavigationRequest() && !req.frame().parentFrame() && parsedUrl != null && parsedUrl != page.url() && page.url() != "about:blank") {
        // check 302
        request(parsedUrl, function (error, response, body) {
            if (!error && response.statusCode.toString().substr(0, 2) == '30') {
                if (body != null) {
                    // TODO func.parseHTML(body, page);
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

    if (url.endsWith(".ico") || req.resourceType() == "image" || req.resourceType() == "media") {
        let img = fs.readFileSync("./image/1.jpg");
        req.respond({
            "status": 200,
            "contentType": "image/png",
            "body": img,
        });
        return;
    }

    if(url.indexOf("logout") != -1){
        req.respond({
            "status": 204,
        });
    }

    if(parsedUrl != null || page.url() == "about:blank"){
        req.continue();
    } else {
        req.respond({
            "status": 204,
        });
    }
}

const init = async ({ page, data: url }) => {
    // prepare page
    await preparePage(page);

    // dismiss dialog
    await page.on('dialog', async dialog => {
        await dialog.dismiss();
    });

    // lock the navigate
    await page.on('request', async (req) => {
        await handleNav(req, page);
    });

    await page.goto(url, {
        waitUntil: 'networkidle2'   // avoid network congestion
    });

    // TODO 整合下边三处
    // parse node links
    const links = await page.$$eval("[src],[href],[data-url],[longDesc],[lowsrc]",func.getNodeLink);

    for (let link of links){
        //console.log("link: "+link);
        let parsedURL = func.parseURL(link, page.url());

        if(parsedURL != null){
            console.log("parsedURL: "+parsedURL);
            cluster.queue(parsedURL);
        }
    }

    // inline event trigger
    for (let i=0; i<config.inlineEvents.length; i++){
        let eventName = config.inlineEvents[i];
        await page.$$eval("["+eventName+"]", func.inlineEventTrigger, eventName.replace("on", ""));
    }

    // dom event collection and trigger
    // TODO

    const title = await page.title();
    console.log(title);
};



(async ()=>{
    global.cluster = await Cluster.launch(config.clusterLaunchOptions);

    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`);
    });

    await cluster.task(init);

    cluster.queue('http://ctf.ctf/1.html');

    await cluster.idle();
    await cluster.close();
})();

