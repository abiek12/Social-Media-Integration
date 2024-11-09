import app from './app';
import { createAdminUser } from './utils/common';
import ngrok from '@ngrok/ngrok';
import { cronJob } from './utils/cronJob';

// let ngrokUrl: string | null;
const start = async (): Promise<void> => {
  try {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

    // Start the Express server
    app.listen(PORT, async () => {
      createAdminUser();
      cronJob.start();
      console.log(`Server listening on ${PORT}`);
            
      // Start ngrok tunnel
      // ngrok.connect({ addr: PORT, authtoken: process.env.NGROK_AUTHTOKEN })
      //   .then(listener => {
      //     ngrokUrl = listener.url();
      //     console.log(`Ingress established at: ${listener.url()}`)
      //   });
    });
    
  } catch (error) {
    console.log(`Error starting server: ${error}`);
    process.exit(1);
  }
};

// export { ngrokUrl };
start();
