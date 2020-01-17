import {Cluster} from "puppeteer-cluster"
import * as func from "./func"
import * as config from "./config"
import * as eventHandler from "./handler/eventHandler"
import * as formHandler from "./handler/formHandler"
import * as linkHandler from "./handler/linkHandler"
import * as navHandler from "./handler/navHandler"

async function preparePage(page) {
    // set ua
    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36");
    // insert hook code
    await page.evaluateOnNewDocument(func.hookJS);
    // open req intercept
    await page.setRequestInterception(true);
    // open js ability
    await page.setJavaScriptEnabled(true);
    // close catch
    await page.setCacheEnabled(false);
}

const init = async ({page, data: url}) => {
    // prepare page
    await preparePage(page);
    page.setCookie({
        "name": "PHPSESSID",
        "value": "16ff5a492ee3cdaad357e48dc4c97c8d",
        "domain": "speed.test"
    });

    // dismiss dialog
    await page.on("dialog", async dialog => {
        await dialog.dismiss();
    });

    // lock the navigate
    await page.on("request", async (req) => {
        const navUrls = await navHandler.navHandler(req, page);
        if (navUrls !== undefined) {
            for (let url of navUrls) {
                let parsedUrl = func.parseURL(url, page.url());
                func.addQueue(parsedUrl);
            }
        }
    });

    await page.goto(url, {
        waitUntil: "networkidle2",   // avoid network congestion
        timeout: 3000,
    });

    // collect node links and comment links
    let links = await page.$$eval("[src],[href],[data-url],[longDesc],[lowsrc]", linkHandler.getNodeLink);
    for (let link of links) {
        let parsedUrl = func.parseURL(link, await page.url());
        if (parsedUrl != null) {
            //console.log("parsedURL: " + parsedURL);
            func.addQueue(parsedUrl);
        }
    }

    const commentNodes = await page.$x("//comment()");
    const commentUrls = await linkHandler.parseCommentUrl(commentNodes);
    if (commentUrls !== undefined) {
        for (let url of commentUrls) {
            let parsedUrl = func.parseURL(url, await page.url());
            if(parsedUrl){
                func.addQueue(parsedUrl);
            }
        }
    }

    // inline event trigger TODO fix bug
    const inlineEvents = ["onclick", "onblur", "onchange", "onabort", "ondblclick", "onerror", "onfocus", "onkeydown", "onkeypress", "onkeyup", "onload", "onmousedown", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onreset", "onresize", "onselect", "onsubmit", "onunload"];
    // for (let i = 0; i < inlineEvents.length; i++) {
    //     let eventName = inlineEvents[i];
    //     console.log(eventName);
    //     await page.$$eval("[" + eventName + "]", eventHandler.inlineEventTrigger, eventName.replace("on", ""));
    // }
    for(let eventName of inlineEvents){
        let nodes = await page.$$("[" + eventName + "]");
        for(let node of nodes){
            let nodename = await node.executionContext().evaluate(node => node.nodeName, node);
            console.log(nodename);
        }
        await page.$$eval("[" + eventName + "]", eventHandler.inlineEventTrigger, eventName.replace("on", ""));
    }

    // dom event collection and trigger
    eventHandler.domEventTrigger();

    // form collection and auto submit
    const formNodes = await page.$$("form");
    await formHandler.formHandler(formNodes, page);

    // handle hooked url
    for(let hookedUrl of HOOK_URL_LIST){
        console.log(hookedUrl);
        let parsedUrl = func.parseURL(hookedUrl);
        if(parsedUrl){
            func.addQueue(parsedUrl);
        }
    }
    // const title = await page.title();
    // console.log(title);
};


(async () => {
    /*eslint no-undef:0*/
    global.cluster = await Cluster.launch(config.clusterLaunchOptions);
    global.EVENT_LIST = [];
    global.HOOK_URL_LIST = [];

    cluster.on("taskerror", (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`);
    });

    await cluster.task(init);

    func.addQueue("http://speed.test/");

    await cluster.idle();
    await cluster.close();
})();

