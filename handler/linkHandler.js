export const getNodeLink = (nodes) => {
    let result = [];
    let attrs = ['src', 'href', 'data-url', 'longDesc', 'lowsrc'];
    for (let node of nodes) {
        for (let attr of attrs) {
            let link = node.getAttribute(attr);
            if (link) {
                result.push(link);
            }
        }
    }
    return result;
};

export const parseCommentUrl = async (nodes) => {
    let result = [];
    for (let node of nodes) {
        let commentContent = await node.executionContext().evaluate(node => node.textContent, node);
        let matches = regexCommentUrl(commentContent);
        if (matches) {
            for (let url of matches) {
                result.push(url);
            }
        }
    }
    return result;
};

function regexCommentUrl(commentContent) {
    let pattern = /(https?|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/gi; // TODO nodeJS多行正则没法用
    let urls = commentContent.match(pattern);
    return urls;
}