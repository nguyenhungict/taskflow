const express = require('express');
const router = express.Router();
const {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addMember,
    removeMember
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

// ==================================================================
// IMPORTANT: Tất cả routes đều cần authentication (protect middleware)
// WHY: Project là private resource, không có public access
// ==================================================================

/**
 * @swagger
 * /api/projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create new project
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "My Project" }
 *               description: { type: string, example: "Project description" }
 *     responses:
 *       201: { description: Project created }
 *       400: { description: Validation error }
 *       401: { description: Not authenticated }
 */
router.post('/', protect, createProject);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: Get all projects of current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: List of projects }
 *       401: { description: Not authenticated }
 */
router.get('/', protect, getAllProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *     responses:
 *       200: { description: Project details }
 *       404: { description: Project not found }
 *       403: { description: Not authorized }
 */
router.get('/:id', protect, getProjectById);

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     tags: [Projects]
 *     summary: Update project (owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200: { description: Project updated }
 *       403: { description: Only owner can update }
 */
router.patch('/:id', protect, updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete project (owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Project deleted }
 *       403: { description: Only owner can delete }
 */
router.delete('/:id', protect, deleteProject);

/**
 * @swagger
 * /api/projects/{id}/members/{userId}:
 *   post:
 *     tags: [Projects]
 *     summary: Add member to project (owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User ID to add
 *     responses:
 *       200: { description: Member added }
 *       400: { description: User already member }
 *       403: { description: Only owner can add members }
 */
router.post('/:id/members/:userId', protect, addMember);

/**
 * @swagger
 * /api/projects/{id}/members/{userId}:
 *   delete:
 *     tags: [Projects]
 *     summary: Remove member from project (owner only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Project ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         description: User ID to remove
 *     responses:
 *       200: { description: Member removed }
 *       400: { description: Cannot remove owner or user not member }
 *       403: { description: Only owner can remove members }
 */
router.delete('/:id/members/:userId', protect, removeMember);

// ==================================================================
// ROUTE ORGANIZATION EXPLAINED:
// ==================================================================
// 
// Pattern 1: Resource routes (REST standard)
// POST   /api/projects          → Create
// GET    /api/projects          → List all
// GET    /api/projects/:id      → Get one
// PATCH  /api/projects/:id      → Update
// DELETE /api/projects/:id      → Delete
//
// Pattern 2: Nested resource routes (Sub-actions)
// POST   /api/projects/:id/members/:userId    → Add member
// DELETE /api/projects/:id/members/:userId    → Remove member
//
// WHY nested routes?
// - Rõ ràng: /projects/:id/members → "members của project này"
// - RESTful: Thể hiện relationship giữa resources
// - Scalable: Dễ thêm actions khác (/projects/:id/tasks, etc.)
//
// ==================================================================

module.exports = router;
