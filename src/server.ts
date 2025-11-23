import express from 'express';
import {errorHandler} from "./errorHandler/errorHandler.js";
import {loggerWinston} from "./winston/logger.js";
import {apiRouter} from "./routers/apiRouter.js";
import {PORT} from "./configuration/appConfig.js";

export const launchServer = async () => {
    const app = express();

    const server = app.listen(PORT, () => {
        console.log(`Server runs at http://localhost:${PORT}`)
        loggerWinston.warn("server successfully started");
    });

    //============middleware========
    app.use(express.json())
    //============routers=====
    app.use('/api', apiRouter)

    app.use((req, res) => {
        res.status(404).send("Page not found");
    })

    //===========errorHandler=======
    app.use(errorHandler);
    //===============================
    process.on('SIGINT', shutdown); //server stopped by Ctrl+C
    process.on('uncaughtException', handleFatalError);
    process.on('unhandledRejection', handleFatalError);

    async function shutdown() {
        loggerWinston.warn("server shutdown....")
        loggerWinston.warn("all connections closed");
        server.close(() => {
            process.exit(0);
        });
    }

    function handleFatalError(err: any) {
        if (err instanceof Error)
            loggerWinston.error("server failed by fatal error" + err.message + "\n" + err.stack);
        else
            loggerWinston.error("server failed by fatal error" + err);
        server.close(() => process.exit(1));
    }
}
