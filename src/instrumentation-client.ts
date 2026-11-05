import { initBotId } from "botid/client/core";

// The path must match the page that invokes subscribeAction and the server
// check in that action. Server actions POST to the current page path.
initBotId({
  protect: [{ method: "POST", path: "/alerts" }],
});
