import app from './app';

const start = async (): Promise<void> => {
  try {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    const address = await app.listen({
      port: PORT,
      host: "0.0.0.0",
    });
    // app.cron.startAllJobs();
    console.log(`Server listening on ${address}`); 
  } catch (error) {
    console.log(`Error starting server: ${error}`);
    process.exit(1);
  }
};

start();