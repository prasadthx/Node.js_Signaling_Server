import dotenv from 'dotenv';

export default{
    "emailFrom": process.env.SMTP_EMAIL,
    "smtpOptions": {
        "host": process.env.SMTP_HOST,
        "port": process.env.SMTP_PORT,
        "auth": {
            "user": process.env.SMTP_USERNAME,
            "pass": process.env.SMTP_PASSWORD
        }
    }
}