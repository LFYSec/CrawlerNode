export const inlineEventTrigger = (nodes, eventName) => {
    // console.log(eventName)
    // for (let node of nodes) {
    //     console.log("inline event: "+node.nodeName + "  " + eventName);
    //     let event = document.createEvent("CustomEvent");
    //     event.initCustomEvent(eventName, false, true, null);
    //     try {
    //         node.dispatchEvent(event);
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }


};

export const domEventTrigger = () => {
    for(let event of EVENT_LIST){
        console.log("dom event: "+event["element"].tagName);
        let newEvent = document.createEvent('CustomEvent');
        newEvent.initCustomEvent(event["eventName"], true, true, null);
        event["element"].dispatchEvent(newEvent);
    }
};