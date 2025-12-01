import mongoose, { Schema, Document, Model } from 'mongoose';

// Function to connect to MongoDB
export async function connectToDatabase() {
    try {
      await mongoose.connect('mongodb+srv://mohamedamine:medaminetlili123@cluster0.qf8cb49.mongodb.net/?retryWrites=true&w=majority', {
        dbName:"certichain",
        writeConcern: {
          w:"majority" // Ensure you use a valid write concern here
        }
      });
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to MongoDB', error);
      process.exit(1); // Exit process with failure
    }
  }
  