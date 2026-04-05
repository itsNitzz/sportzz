import 'dotenv/config.js'

if(!process.env.DATABASE_URL) throw new Error('database url is undefined.');

const CONFIG = {
    DATABASE_URL: process.env.DATABASE_URL,
}

export default CONFIG;