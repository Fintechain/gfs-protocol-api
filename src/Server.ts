import "@tsed/platform-log-request"; // remove this import if you don&#x27;t want log request
import "@tsed/platform-express"; // /!\ keep this import
import "@tsed/ajv";
import "@tsed/swagger";

import { Configuration } from "@tsed/di";
import { application } from "@tsed/platform-http";
import { join } from "path";

import { config } from "./config/index.js";
import * as pages from "./controllers/pages/index.js";
import * as rest from "./controllers/rest/index.js";
import * as messages from "./features/messages/controllers/index.js";

@Configuration({
    ...config,
    acceptMimes: ["application/json"],
    httpPort: process.env.PORT || 8083,
    httpsPort: false, // CHANGE
    disableComponentsScan: true,
    ajv: {
        returnsCoercedValues: true
    },
    mount: {
        //"/messages": [...Object.values(messages)],
        "/rest": [...Object.values(rest)],
        "/": [...Object.values(pages)]
    },
    swagger: [
        {
            path: "/doc",
            specVersion: "3.0.1"
        }
    ],
    middlewares: [
        "cors",
        "cookie-parser",
        "compression",
        "method-override",
        "json-parser",
        { use: "urlencoded-parser", options: { extended: true } }
    ],
    views: {
        root: join(process.cwd(), "../views"),
        extensions: {
            ejs: "ejs"
        }
    },
    exclude: ["**/*.spec.ts"]
})
export class Server {
    protected app = application();
}
