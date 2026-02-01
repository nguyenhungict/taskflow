const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Sample data arrays
const TASK_TITLES = [
    'Fix login bug',
    'Implement user profile page',
    'Add search functionality',
    'Optimize database queries',
    'Write unit tests for auth',
    'Design new landing page',
    'Integrate payment gateway',
    'Setup CI/CD pipeline',
    'Refactor authentication logic',
    'Add email notifications',
    'Implement real-time chat',
    'Create mobile responsive design',
    'Add data export feature',
    'Setup error logging',
    'Improve API documentation',
    'Add user permissions system',
    'Implement caching layer',
    'Add analytics dashboard',
    'Setup automated backups',
    'Optimize image loading'
];

const TASK_DESCRIPTIONS = [
    'Users are unable to login after password reset',
    'Create a comprehensive user profile with avatar upload',
    'Add global search across all resources',
    'Database queries are taking too long, need optimization',
    'Write comprehensive test coverage for authentication module',
    'Design a modern and attractive landing page',
    'Integrate Stripe payment gateway for subscriptions',
    'Setup automated deployment pipeline with GitHub Actions',
    'Current auth code is messy, needs refactoring',
    'Send email notifications for important events',
    'Add real-time messaging between users',
    'Ensure app works well on mobile devices',
    'Allow users to export their data in CSV/JSON',
    'Implement Sentry for error tracking',
    'Add detailed API documentation with examples',
    'Implement role-based access control',
    'Add Redis caching to improve performance',
    'Create dashboard with charts and metrics',
    'Setup daily automated database backups',
    'Lazy load images to improve page load speed'
];

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

/**
 * Clear existing data
 * WHY: Để tránh duplicate data khi chạy seed nhiều lần
 */
const clearData = async () => {
    try {
        await User.deleteMany({});
        await Project.deleteMany({});
        await Task.deleteMany({});
        console.log('🗑️  Cleared existing data');
    } catch (error) {
        console.error('Error clearing data:', error);
    }
};

/**
 * Create sample users
 * Returns: { admin, members: [...] }
 */
const createUsers = async () => {
    try {
        console.log('\n👥 Creating users...');

        // Admin user
        const admin = await User.create({
            username: 'admin',
            email: 'admin@taskflow.com',
            password: '123456',
            role: 'admin',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
        });
        console.log(`  ✓ Admin: ${admin.email}`);

        // Regular members
        const memberData = [
            { username: 'john', email: 'john@taskflow.com', name: 'John Doe' },
            { username: 'jane', email: 'jane@taskflow.com', name: 'Jane Smith' },
            { username: 'mike', email: 'mike@taskflow.com', name: 'Mike Johnson' },
            { username: 'sarah', email: 'sarah@taskflow.com', name: 'Sarah Wilson' }
        ];

        const members = await Promise.all(
            memberData.map(data => User.create({
                username: data.username,
                email: data.email,
                password: '123456',
                role: 'member',
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`
            }))
        );

        members.forEach(member => {
            console.log(`  ✓ Member: ${member.email}`);
        });

        return { admin, members };
    } catch (error) {
        console.error('Error creating users:', error);
        throw error;
    }
};

/**
 * Create sample projects
 */
const createProjects = async (admin, members) => {
    try {
        console.log('\n📁 Creating projects...');

        // Project 1: E-commerce Platform (admin owner, 3 members)
        const project1 = await Project.create({
            name: 'E-commerce Platform',
            description: 'Building a modern e-commerce platform with React and Node.js',
            owner: admin._id,
            members: [admin._id, members[0]._id, members[1]._id, members[2]._id]
        });
        console.log(`  ✓ ${project1.name} (${project1.members.length} members)`);

        // Project 2: Mobile App (member owner, 2 members)
        const project2 = await Project.create({
            name: 'Task Manager Mobile App',
            description: 'React Native mobile app for task management',
            owner: members[0]._id,
            members: [members[0]._id, members[1]._id, members[3]._id]
        });
        console.log(`  ✓ ${project2.name} (${project2.members.length} members)`);

        // Project 3: Internal Dashboard (admin only)
        const project3 = await Project.create({
            name: 'Analytics Dashboard',
            description: 'Internal analytics and reporting dashboard',
            owner: admin._id,
            members: [admin._id, members[2]._id, members[3]._id]
        });
        console.log(`  ✓ ${project3.name} (${project3.members.length} members)`);

        return [project1, project2, project3];
    } catch (error) {
        console.error('Error creating projects:', error);
        throw error;
    }
};

/**
 * Create sample tasks
 */
const createTasks = async (projects, admin, members) => {
    try {
        console.log('\n📝 Creating tasks...');

        const tasks = [];
        const statuses = ['todo', 'in-progress', 'done'];
        const priorities = ['low', 'medium', 'high'];

        // Distribute tasks across projects
        // WHY: More tasks for better visualization
        const taskDistribution = [
            { project: projects[0], count: 20 },  // E-commerce: 20 tasks
            { project: projects[1], count: 15 },  // Mobile App: 15 tasks
            { project: projects[2], count: 12 }    // Dashboard: 12 tasks
        ];

        let taskIndex = 0;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        for (const dist of taskDistribution) {
            const projectMembers = await User.find({
                _id: { $in: dist.project.members }
            });

            console.log(`  Creating ${dist.count} tasks for "${dist.project.name}"`);

            for (let i = 0; i < dist.count; i++) {
                // Status distribution
                let status;
                const rand = Math.random();
                if (rand < 0.25) status = 'todo';
                else if (rand < 0.7) status = 'in-progress';
                else status = 'done';

                const assignee = projectMembers[Math.floor(Math.random() * projectMembers.length)];

                // Priority
                let priority;
                const priorityRand = Math.random();
                if (priorityRand < 0.15) priority = 'low';
                else if (priorityRand < 0.7) priority = 'medium';
                else priority = 'high';

                // Date logic for Calendar/Timeline
                // Spread tasks across 45 days (starting 10 days ago)
                const startOffset = Math.floor(Math.random() * 45) - 10;
                const duration = Math.floor(Math.random() * 3) + 3; // 3 to 5 days duration

                const startDate = new Date(startOfMonth);
                startDate.setDate(startOfMonth.getDate() + startOffset);

                const dueDate = new Date(startDate);
                dueDate.setDate(startDate.getDate() + duration);

                // Create task
                const task = await Task.create({
                    title: TASK_TITLES[taskIndex % TASK_TITLES.length],
                    description: TASK_DESCRIPTIONS[taskIndex % TASK_DESCRIPTIONS.length],
                    status,
                    priority,
                    project: dist.project._id,
                    assignee: assignee._id,
                    createdBy: dist.project.owner,
                    startDate,
                    dueDate,
                    estimated_hours: Math.floor(Math.random() * 40) + 4,
                    actual_hours: status === 'done' ? Math.floor(Math.random() * 40) + 4 : null
                });

                tasks.push(task);
                taskIndex++;
            }
        }

        // Summary
        console.log(`\n  ✅ Created ${tasks.length} tasks:`);
        console.log(`     - TODO: ${tasks.filter(t => t.status === 'todo').length}`);
        console.log(`     - IN PROGRESS: ${tasks.filter(t => t.status === 'in-progress').length}`);
        console.log(`     - DONE: ${tasks.filter(t => t.status === 'done').length}`);

        return tasks;
    } catch (error) {
        console.error('Error creating tasks:', error);
        throw error;
    }
};

/**
 * Main seed function
 */
const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...\n');
        console.log('═══════════════════════════════════════');

        // Connect to database
        await connectDB();

        // Clear existing data (optional - comment out to keep existing data)
        await clearData();

        // Create users
        const { admin, members } = await createUsers();

        // Create projects
        const projects = await createProjects(admin, members);

        // Create tasks
        const tasks = await createTasks(projects, admin, members);

        // Success summary
        console.log('\n═══════════════════════════════════════');
        console.log('🎉 Database seeding completed!\n');
        console.log('📊 Summary:');
        console.log(`   - Users: ${members.length + 1} (1 admin, ${members.length} members)`);
        console.log(`   - Projects: ${projects.length}`);
        console.log(`   - Tasks: ${tasks.length}`);
        console.log('\n🔑 Login credentials (all passwords: 123456):');
        console.log(`   - Admin: admin@taskflow.com`);
        console.log(`   - Users: john@taskflow.com, jane@taskflow.com, mike@taskflow.com, sarah@taskflow.com`);
        console.log('\n✅ You can now test the application!\n');

        // Disconnect
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Run if executed directly
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;
