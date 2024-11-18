
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

export const MONGO_URL = `mongodb+srv://${dbUser}:${dbPass}@cluster.iso2u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster`