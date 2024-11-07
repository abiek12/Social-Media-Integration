import "reflect-metadata";
import { DataSource } from "typeorm";
import { AppDataSource } from "./dbConfig";

async function initializeDataSource() {
  try {
    await AppDataSource.initialize().then(() => {
      console.log("Database connection established");
    });

    return AppDataSource;
  } catch (error) {
    console.log("Failed to initialize database connection", error);
    throw error; // Rethrow or handle as needed
  }
}

export const AppDataSourcePromise = initializeDataSource();

export const getDataSource = async (delay = 3000): Promise<DataSource> => {
  try {
    const dataSource = await AppDataSourcePromise;
    return dataSource;
  } catch (error) {
    console.log("Database connection error after delay", error);
    throw new Error("Failed to create connection with database");
  }
};
