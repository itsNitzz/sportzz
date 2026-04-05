import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import CONFIG from "./env-variables.js";
import { PrismaClient } from "../generated/prisma/client.js";

const poolConnection = new Pool({connectionString: CONFIG.DATABASE_URL});
const adapter = new PrismaPg(poolConnection);

export const prisma = new PrismaClient({adapter});