let handlerSelect = async (node, page) => {
    let optionValue = await node.executionContext().evaluate((node) => {
        let result = [];
        for (let option of node.children) {
            let value = option.getAttribute("value");
            if (value) {
                result.push(value)
            }
        }
        return result;
    }, node);

    if (optionValue.length > 0) {
        page.evaluate("(select) => select.options[i].selected = true;", node);
    }
};

export const nodeHandler = {
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
            case "radio":
                await node.click();
                break;
            case "checkbox":
                await node.click();
                break;
            case "submit":
                break;
            default:
                await node.type("' or 1#", {delay: 100});
        }
        return type;
    },
    "select": handlerSelect,
    "datalist": handlerSelect,
    "textarea": async (node) => {
        await node.type("' or 1#", {delay: 100});
    },
};

export const formHandler = async (formNodes, page) => {
    for (let formNode of formNodes) {
        await formNode.executionContext().evaluate(form => form.setAttribute("target", "i_frame"), formNode);

        const nodes = await formNode.$$("input, select, textarea, datalist");
        for (let node of nodes) {
            let nodeName = (await node.executionContext().evaluate(node => node.nodeName, node)).toLowerCase();

            if (nodeName === "input") {
                let type = await node.executionContext().evaluate(node => node.getAttribute("type"), node);
                await nodeHandler[nodeName](node, type);
            } else if (nodeName === "textarea") {
                await nodeHandler[nodeName](node);
            } else {
                await nodeHandler[nodeName](node, page);
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
};
