// Seed script: populates database with sample data for development and testing
// Creates manager, engineers, projects, and assignments with realistic relationships
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Project = require('../models/Project');
const Assignment = require('../models/Assignment');

async function seedData() {
  try {
    // Connect to MongoDB
    console.log('MONGODB_URI=', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Assignment.deleteMany({});
    console.log('Cleared existing data');

    // Hash password for all users
    const hashedPassword = await bcrypt.hash('Password123', 10);

    // Create manager
    const manager = new User({
      email: 'manager@example.com',
      name: 'John Manager',
      passwordHash: hashedPassword,
      role: 'manager',
      department: 'Engineering'
    });
    await manager.save();
    console.log('Manager created:', manager.email);

    // Create engineers with varied skills and capacities
    const engineers = [
      {
        email: 'alice@example.com',
        name: 'Alice Johnson',
        passwordHash: hashedPassword,
        role: 'engineer',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        seniority: 'senior',
        maxCapacity: 100,
        department: 'Frontend Team'
      },
      {
        email: 'bob@example.com',
        name: 'Bob Smith',
        passwordHash: hashedPassword,
        role: 'engineer',
        skills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
        seniority: 'mid',
        maxCapacity: 100,
        department: 'Backend Team'
      },
      {
        email: 'carol@example.com',
        name: 'Carol Davis',
        passwordHash: hashedPassword,
        role: 'engineer',
        skills: ['React', 'TypeScript', 'GraphQL', 'AWS'],
        seniority: 'senior',
        maxCapacity: 80, // Part-time
        department: 'Frontend Team'
      },
      {
        email: 'david@example.com',
        name: 'David Wilson',
        passwordHash: hashedPassword,
        role: 'engineer',
        skills: ['Java', 'Spring Boot', 'MySQL', 'Kubernetes'],
        seniority: 'junior',
        maxCapacity: 100,
        department: 'Backend Team'
      }
    ];

    const createdEngineers = [];
    for (const engineerData of engineers) {
      const engineer = new User(engineerData);
      await engineer.save();
      createdEngineers.push(engineer);
      console.log('Engineer created:', engineer.email);
    }

    // Create projects with realistic timelines and skill requirements
    const projects = [
      {
        name: 'E-commerce Platform Redesign',
        description: 'Complete redesign of the customer-facing e-commerce platform with modern UI/UX and improved performance.',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
        teamSize: 3,
        status: 'active',
        managerId: manager._id
      },
      {
        name: 'Mobile App Development',
        description: 'Native mobile application for iOS and Android platforms with real-time synchronization.',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-08-15'),
        requiredSkills: ['React Native', 'TypeScript', 'GraphQL'],
        teamSize: 2,
        status: 'planning',
        managerId: manager._id
      },
      {
        name: 'Data Analytics Dashboard',
        description: 'Business intelligence dashboard for real-time analytics and reporting.',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-31'),
        requiredSkills: ['Python', 'Django', 'PostgreSQL', 'Docker'],
        teamSize: 2,
        status: 'active',
        managerId: manager._id
      },
      {
        name: 'Microservices Migration',
        description: 'Migration from monolithic architecture to microservices with containerization.',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-10-31'),
        requiredSkills: ['Java', 'Spring Boot', 'Docker', 'Kubernetes'],
        teamSize: 2,
        status: 'planning',
        managerId: manager._id
      }
    ];

    const createdProjects = [];
    for (const projectData of projects) {
      const project = new Project(projectData);
      await project.save();
      createdProjects.push(project);
      console.log('Project created:', project.name);
    }

    // Create assignments showing various scenarios (overlapping, sequential, capacity utilization)
    const assignments = [
      // Alice: Senior frontend developer on multiple projects
      {
        engineerId: createdEngineers[0]._id, // Alice
        projectId: createdProjects[0]._id, // E-commerce Platform
        allocationPercentage: 60,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-30'),
        role: 'Lead Frontend Developer'
      },
      {
        engineerId: createdEngineers[0]._id, // Alice
        projectId: createdProjects[1]._id, // Mobile App
        allocationPercentage: 40,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-08-15'),
        role: 'Senior Developer'
      },
      
      // Bob: Backend specialist
      {
        engineerId: createdEngineers[1]._id, // Bob
        projectId: createdProjects[2]._id, // Data Analytics Dashboard
        allocationPercentage: 80,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-31'),
        role: 'Backend Developer'
      },
      {
        engineerId: createdEngineers[1]._id, // Bob
        projectId: createdProjects[0]._id, // E-commerce Platform (backend support)
        allocationPercentage: 20,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
        role: 'Backend Consultant'
      },
      
      // Carol: Part-time senior developer
      {
        engineerId: createdEngineers[2]._id, // Carol
        projectId: createdProjects[1]._id, // Mobile App
        allocationPercentage: 60,
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-07-31'),
        role: 'TypeScript Specialist'
      },
      
      // David: Junior developer learning on projects
      {
        engineerId: createdEngineers[3]._id, // David
        projectId: createdProjects[3]._id, // Microservices Migration
        allocationPercentage: 80,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-10-31'),
        role: 'Junior Backend Developer'
      },
      {
        engineerId: createdEngineers[3]._id, // David
        projectId: createdProjects[2]._id, // Data Analytics (learning opportunity)
        allocationPercentage: 20,
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-04-30'),
        role: 'Junior Developer'
      },
      
      // Additional assignment showing capacity constraints
      {
        engineerId: createdEngineers[2]._id, // Carol (part-time, already at 60%)
        projectId: createdProjects[0]._id, // E-commerce Platform
        allocationPercentage: 20, // Total will be 80% (within her 80% capacity)
        startDate: new Date('2024-05-01'),
        endDate: new Date('2024-06-30'),
        role: 'UI/UX Consultant'
      }
    ];

    for (const assignmentData of assignments) {
      const assignment = new Assignment(assignmentData);
      await assignment.save();
      console.log(`Assignment created: ${assignment.role} on project ${assignment.projectId}`);
    }

    console.log('\n=== Seed Data Summary ===');
    console.log(`✓ 1 Manager: ${manager.email}`);
    console.log(`✓ ${createdEngineers.length} Engineers:`);
    createdEngineers.forEach(engineer => {
      console.log(`  - ${engineer.name} (${engineer.seniority}, ${engineer.maxCapacity}% capacity)`);
    });
    console.log(`✓ ${createdProjects.length} Projects:`);
    createdProjects.forEach(project => {
      console.log(`  - ${project.name} (${project.status})`);
    });
    console.log(`✓ ${assignments.length} Assignments created`);
    console.log('\n=== Login Credentials ===');
    console.log('Manager: manager@example.com / Password123');
    console.log('Engineers: alice@example.com, bob@example.com, carol@example.com, david@example.com');
    console.log('All passwords: Password123');

  } catch (error) {
    console.error('Seed data error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run seed script
seedData();