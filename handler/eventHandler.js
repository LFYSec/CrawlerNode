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

