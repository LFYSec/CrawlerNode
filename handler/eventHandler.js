export const inlineEventTrigger = (nodes, eventName) => {
    let result = [];
    for (let node of nodes) {
        let event = document.createEvent("CustomEvent");
        event.initCustomEvent(eventName, false, true, null);
        try {
            node.dispatchEvent(event);
        } catch (e) {
            console.log(e);
        }
    }
    return result;
};

export const domEventTrigger = () => {
    for(let event of EVENT_LIST){
        console.log("dom event: "+event["element"].tagName);
        let newEvent = document.createEvent('CustomEvent');
        newEvent.initCustomEvent(event["eventName"], true, true, null);
        event["element"].dispatchEvent(newEvent);
    }
};