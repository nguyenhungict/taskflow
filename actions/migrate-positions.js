/**
 * Migration Script: Set position for existing tasks
 * Run this once to initialize position field for all existing tasks
 */

const mongoose = require('mongoose');
const Task = require('./models/Task');
const Project = require('./models/Project');
require('dotenv').config();

const migrateTaskPositions = async () => {
    try {
        console.log('🚀 Starting task position migration...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all projects
        const projects = await Project.find({});
        console.log(`📦 Found ${projects.length} projects`);

        let totalUpdated = 0;

        for (const project of projects) {
            console.log(`\n📂 Processing project: ${project.name}`);

            // Process each status column
            for (const status of ['todo', 'in-progress', 'done']) {
                const tasks = await Task.find({
                    project: project._id,
                    status: status
                }).sort({ createdAt: 1 }); // Old tasks first

                console.log(`  ${status}: ${tasks.length} tasks`);

                // Assign positions based on creation order
                for (let i = 0; i < tasks.length; i++) {
                    tasks[i].position = (i + 1) * 1000; // Use 1000, 2000, 3000... (room for insertion)
                    await tasks[i].save();
                    totalUpdated++;
                }
            }
        }

        console.log(`\n✅ Migration complete! Updated ${totalUpdated} tasks`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateTaskPositions();
