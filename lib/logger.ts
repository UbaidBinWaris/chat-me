import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        // - Write OTP events to `otp.log`
        // - Write security events to `security.log`
        //
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.File({ filename: 'logs/otp.log', level: 'info' }),
        new winston.transports.File({ filename: 'logs/security.log', level: 'warn' }),
    ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

// Helper functions for specific log types
export function logOTP(action: string, email: string, data?: any): void {
    logger.info(`OTP ${action} for ${email}`, data || {});
}

export function logSecurity(event: string, details: any): void {
    logger.warn(`Security Event: ${event}`, details);
}

export function logError(error: Error, context?: string): void {
    logger.error(context ? `Error in ${context}` : 'Error occurred', {
        message: error.message,
        stack: error.stack,
    });
}

export { logger };
