import fs from "fs";
import request from "request";
import * as func from "../func";

export const navHandler = async (req, page) => {
    let result = [];
    let url = req.url();
    let parsedUrl = func.parseURL(url, page.url());

    if (url.endsWith(".ico") || req.resourceType() === "image" || req.resourceType() === "media") {
        let img = fs.readFileSync("./image/1.jpg");
        req.respond({
            "status": 200,
            "contentType": "image/png",
            "body": img,
        });
        return;
    }

    // 前或后端跳转，且跳转url经过解析后非空(host与当前page相同)，且非初始化page请求
    if (req.isNavigationRequest() && !req.frame().parentFrame() && parsedUrl != null && parsedUrl !== page.url() && page.url() !== "about:blank") {
        // check 302
        request(parsedUrl, function (error, response, body) {
            if (!error && response.statusCode.toString().substr(0, 2) === '30') {
                result.push(response.headers().location);
                if (body === null) {
                    // TODO (?)
                }
                req.respond({
                    "status": 200,
                    "body": body,
                });
                return result;
            }
        });

        // check frontend location
        result.push(parsedUrl);

        req.respond({
            "status": 204,
        });
        return result;
    }

    if (url.indexOf("logout") !== -1) {
        req.respond({
            "status": 204,
        });
        return;
    }

    if (parsedUrl != null || page.url() === "about:blank") {
        req.continue();
    } else {
        req.respond({
            "status": 204,
        });
    }
};
