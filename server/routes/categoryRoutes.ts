import { Router, Request, Response } from 'express';
import { Category, Product } from '../models';
import { getDbStatus, memoryStore, DEFAULT_CATEGORIES } from '../db';

const router = Router();

function isAuthorizedStaffOrAdmin(req: Request): boolean {
  const role = (req.headers['x-user-role'] as string || '').toLowerCase();
  return role === 'admin' || role === 'staff';
}

// 1. GET /api/categories - List all categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const { isConnected } = await getDbStatus();
    const categorySet = new Set<string>(DEFAULT_CATEGORIES);

    if (isConnected) {
      const dbCategories = await Category.find().sort({ name: 1 }).lean();
      dbCategories.forEach(c => {
        if (c.name && c.name.trim()) categorySet.add(c.name.trim());
      });

      // Also include any distinct categories from products
      const productCategories = await Product.distinct('category');
      productCategories.forEach(c => {
        if (c && typeof c === 'string' && c.trim()) categorySet.add(c.trim());
      });
    } else {
      (memoryStore.categories || []).forEach(c => {
        if (c && c.trim()) categorySet.add(c.trim());
      });
      (memoryStore.products || []).forEach(p => {
        if (p.category && p.category.trim()) categorySet.add(p.category.trim());
      });
    }

    const categoriesList = Array.from(categorySet);
    return res.json(categoriesList);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// 2. POST /api/categories - Create new category (Admin/Staff only)
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!isAuthorizedStaffOrAdmin(req)) {
      return res.status(403).json({ error: 'Forbidden: Admin or staff authorization required' });
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    if (name.length > 50) {
      return res.status(400).json({ error: 'Category name cannot exceed 50 characters' });
    }

    const { isConnected } = await getDbStatus();

    if (isConnected) {
      const existing = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });

      if (!existing) {
        await Category.create({ name });
      }
    } else {
      if (!memoryStore.categories) memoryStore.categories = [...DEFAULT_CATEGORIES];
      const exists = memoryStore.categories.some(
        c => c.toLowerCase() === name.toLowerCase()
      );
      if (!exists) {
        memoryStore.categories.push(name);
      }
    }

    return res.status(201).json({ success: true, name, message: 'Category added successfully' });
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message || 'Failed to create category' });
  }
});

export default router;
