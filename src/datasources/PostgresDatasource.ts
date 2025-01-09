import { registerProvider } from "@tsed/di";
import { Logger } from "@tsed/logger";
import { DataSource } from "typeorm";

export const PostgresDatasource = Symbol.for("PostgresDatasource");
export type PostgresDatasource = DataSource;

// Function to get database config from environment
export const getDatabaseConfig = () => ({
    type: "postgres" as const,
    entities: [],
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    username: process.env.POSTGRES_USER || "test",
    password: process.env.POSTGRES_PASSWORD || "test",
    database: process.env.POSTGRES_DB || "test"
});

// Create datasource with config
export const postgresDatasource = new DataSource(getDatabaseConfig());

registerProvider<DataSource>({
    provide: PostgresDatasource,
    type: "typeorm:datasource",
    deps: [Logger],
    async useAsyncFactory(logger: Logger) {
        await postgresDatasource.initialize();
        logger.info("Connected with typeorm to database: Postgres");
        return postgresDatasource;
    },
    hooks: {
        $onDestroy(dataSource) {
            return dataSource.isInitialized && dataSource.close();
        }
    }
});
