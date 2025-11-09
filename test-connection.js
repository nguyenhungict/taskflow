const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const testConnection = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    console.log('Testing MongoDB connection...');
    console.log(`URI: ${mongoURI}`);
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('\n✓ Connection successful!');
    console.log(`  Database: ${conn.connection.name}`);
    console.log(`  Host: ${conn.connection.host}`);
    console.log(`  Port: ${conn.connection.port}`);
    
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`\nCollections in database (${collections.length}):`);
    let foundData = false;
    for (const col of collections) {
      const collection = db.collection(col.name);
      const count = await collection.countDocuments();
      const hasData = count > 0 ? '✓' : '✗';
      console.log(`  ${hasData} ${col.name}: ${count} documents`);
      
      if (count > 0) {
        foundData = true;
        const sample = await collection.find({}).limit(1).toArray();
        if (sample.length > 0) {
          console.log(`    Sample document keys: ${Object.keys(sample[0]).join(', ')}`);
        }
      }
    }
    
    if (!foundData) {
      console.log('\n⚠ Warning: No collections with data found!');
      console.log('   Please check if data exists in this database.');
    }
    
    await mongoose.connection.close();
    console.log('\n✓ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Connection failed!');
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

testConnection();
