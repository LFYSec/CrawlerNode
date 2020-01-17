import {Cluster} from "puppeteer-cluster"
import * as func from "./func"
import * as config from "./config"

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
        const navUrls = await func.handleNav(req, page);
        if (navUrls !== undefined) {
            for (let url of navUrls) {
                cluster.queue(url);
            }
        }
    });

    await page.goto(url, {
        waitUntil: "networkidle2",   // avoid network congestion
        timeout: 3000,
    });

    // collect node links and comment links
    const links = await page.$$eval("[src],[href],[data-url],[longDesc],[lowsrc]", func.getNodeLink);

    for (let link of links) {
        let parsedURL = func.parseURL(link, page.url());
        if (parsedURL != null) {
            console.log("parsedURL: " + parsedURL);
            cluster.queue(parsedURL);
        }
    }

    const commentNodes = await page.$x("//comment()");
    const commentUrls = await func.parseCommentUrl(commentNodes);
    if(commentUrls !== undefined){
        for(let url of commentUrls){
            cluster.queue(url);
        }
    }

    // inline event trigger
    for (let i = 0; i < config.inlineEvents.length; i++) {
        let eventName = config.inlineEvents[i];
        await page.$$eval("[" + eventName + "]", func.inlineEventTrigger, eventName.replace("on", ""));
    }

    // dom event collection and trigger
    // TODO

    // form collection and auto submit
    const formNodes = await page.$$("form");

    for (let formNode of formNodes) {
        await formNode.executionContext().evaluate(form => form.setAttribute("target", "i_frame"), formNode);

        const nodes = await formNode.$$("input, select, textarea, datalist");
        for (let node of nodes) {
            let nodeName = (await node.executionContext().evaluate(node => node.nodeName, node)).toLowerCase();

            if (nodeName === "input") {
                let type = await node.executionContext().evaluate(node => node.getAttribute("type"), node);
                await func.formHandler[nodeName](node, type);
            } else if (nodeName === "textarea") {
                await func.formHandler[nodeName](node);
            } else {
                await func.formHandler[nodeName](node, page);
            }
        }

        try {
            await formNode.executionContext().evaluate(form => form.submit(), formNode);
        } catch (e) {
            try {
                let submit = await formNode.$("input[type=submit]");
                submit.click();
            } catch (e) {
                try {
                    let button = await formNode.$("button");
                    button.click();
                } catch (e) {
                    console.log("form submit error!" + await page.url());
                }
            }
        }


    }

    const title = await page.title();
    console.log(title);
};


(async () => {
    /*eslint no-undef:0*/
    global.cluster = await Cluster.launch(config.clusterLaunchOptions);

    cluster.on("taskerror", (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`);
    });

    await cluster.task(init);

    cluster.queue("http://ctf.ctf/1.html");

    await cluster.idle();
    await cluster.close();
})();

