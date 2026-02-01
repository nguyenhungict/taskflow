const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Taskflow API Documentation',
            version: '1.0.0',
            description: 'Project Management System with AI-powered features',
            contact: {
                name: 'API Support',
                email: 'support@taskflow.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:8000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token (you will get it from login/register)'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['username', 'email', 'password'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'User ID'
                        },
                        username: {
                            type: 'string',
                            description: 'Username (unique)'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Email address (unique)'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 6,
                            description: 'Password (min 6 characters)'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'member'],
                            default: 'member',
                            description: 'User role'
                        },
                        avatar: {
                            type: 'string',
                            description: 'Avatar URL'
                        }
                    }
                },
                Project: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Project ID'
                        },
                        name: {
                            type: 'string',
                            description: 'Project name'
                        },
                        description: {
                            type: 'string',
                            description: 'Project description'
                        },
                        owner: {
                            type: 'string',
                            description: 'Owner user ID'
                        },
                        members: {
                            type: 'array',
                            items: {
                                type: 'string'
                            },
                            description: 'Array of member user IDs'
                        }
                    }
                },
                Task: {
                    type: 'object',
                    required: ['title', 'project'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Task ID'
                        },
                        title: {
                            type: 'string',
                            description: 'Task title'
                        },
                        description: {
                            type: 'string',
                            description: 'Task description'
                        },
                        status: {
                            type: 'string',
                            enum: ['todo', 'in-progress', 'done'],
                            default: 'todo',
                            description: 'Task status'
                        },
                        priority: {
                            type: 'string',
                            enum: ['low', 'medium', 'high'],
                            default: 'medium',
                            description: 'Task priority'
                        },
                        project: {
                            type: 'string',
                            description: 'Project ID'
                        },
                        assignee: {
                            type: 'string',
                            description: 'Assigned user ID'
                        },
                        createdBy: {
                            type: 'string',
                            description: 'Creator user ID'
                        },
                        estimated_hours: {
                            type: 'number',
                            description: 'AI predicted estimated hours'
                        },
                        actual_hours: {
                            type: 'number',
                            description: 'Actual logged hours'
                        },
                        dueDate: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Due date'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            description: 'Error message'
                        }
                    }
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            description: 'Success message'
                        },
                        data: {
                            type: 'object',
                            description: 'Response data'
                        }
                    }
                }
            }
        },
        security: [{
            bearerAuth: []
        }]
    },
    apis: [
        require('path').join(__dirname, '../routes/*.js'),
        require('path').join(__dirname, '../controllers/*.js')
    ]
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Taskflow API Docs'
    }));

    // JSON endpoint for Swagger spec
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log('📚 Swagger documentation available at http://localhost:8000/api-docs');
};

module.exports = setupSwagger;
