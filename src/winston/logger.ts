import winston from 'winston';

const { printf, timestamp, splat} = winston.format;
const logLevels ={
    warn: 0,
    info: 1,
    error: 2,
}

export const loggerWinston = winston.createLogger({
    levels: logLevels,
    level: process.env.LOG_LEVEL,
    format: winston.format.combine(
        timestamp(),
        splat(),
        printf((info) => {
            if(info.level === "error")
                return JSON.stringify({timestamp: info.timestamp, type: "error", message: info.message, });
            else if(info.level === "info")
                return JSON.stringify({timestamp: info.timestamp, type: "response", message: info.message, });
            else if(info.level === "warn")
                return JSON.stringify({timestamp: info.timestamp, type: "service", message: info.message, });
            return ""
        }),
    ),
    transports: [new winston.transports.Console({level: 'error'}),
        new winston.transports.File({
            filename: "./logs/" + new Date().toLocaleDateString("de-DE", {year: 'numeric',month: '2-digit', day: '2-digit'}) + ".txt",
            level: 'info',
        }),
    ],
});
