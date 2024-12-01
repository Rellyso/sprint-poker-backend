const dbUser = process.env.DB_USER
const dbPass = process.env.DB_PASS
const dbDomain = process.env.DB_DOMAIN
const dbName = process.env.DB_APP_NAME

export const MONGO_URL = `mongodb+srv://${dbUser}:${dbPass}@${dbDomain}/?retryWrites=true&w=majority&appName=${dbName}`
