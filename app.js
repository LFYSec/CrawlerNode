import {Cluster} from 'puppeteer-cluster'
import * as func from './func'
import * as config from './config'

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
    await page.on('dialog', async dialog => {
        await dialog.dismiss();
    });

    // lock the navigate
    await page.on('request', async (req) => {
        await func.handleNav(req, page);
    });

    await page.goto(url, {
        waitUntil: 'networkidle2',   // avoid network congestion
        timeout: 3000,
    });

    // parse node links
    const links = await page.$$eval("[src],[href],[data-url],[longDesc],[lowsrc]", func.getNodeLink);

    for (let link of links) {
        let parsedURL = func.parseURL(link, page.url());
        if (parsedURL != null) {
            console.log("parsedURL: " + parsedURL);
            cluster.queue(parsedURL);
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

        const nodes = await formNode.$$("input, selector, textarea");
        for (let node of nodes) {
            let nodeName = (await node.executionContext().evaluate(node => node.nodeName, node)).toLowerCase();
            let type = await node.executionContext().evaluate(node => node.getAttribute("type"), node);
            await func.formHandler[nodeName](node, type);
        }
        formNode.executionContext().evaluate(form => form.submit(), formNode);
    }

    const title = await page.title();
    console.log(title);
};


(async () => {
/*eslint no-undef:0*/
    global.cluster = await Cluster.launch(config.clusterLaunchOptions);

    cluster.on('taskerror', (err, data) => {
        console.log(`Error crawling ${data}: ${err.message}`);
    });

    await cluster.task(init);

    cluster.queue('http://speed.test');

    await cluster.idle();
    await cluster.close();
})();

