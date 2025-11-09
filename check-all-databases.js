const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const checkAllDatabases = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();
    
    console.log(`Found ${databases.length} databases:\n`);
    
    for (const dbInfo of databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'config' || dbInfo.name === 'local') {
        continue;
      }
      
      console.log(`📁 Database: ${dbInfo.name}`);
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      
      if (collections.length === 0) {
        console.log('   (no collections)');
      } else {
        for (const col of collections) {
          const collection = db.collection(col.name);
          const count = await collection.countDocuments();
          if (count > 0) {
            console.log(`   ✓ ${col.name}: ${count} documents`);
            const sample = await collection.find({}).limit(1).toArray();
            if (sample.length > 0) {
              console.log(`     Sample keys: ${Object.keys(sample[0]).join(', ')}`);
            }
          } else {
            console.log(`   ✗ ${col.name}: 0 documents`);
          }
        }
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
};

checkAllDatabases();
