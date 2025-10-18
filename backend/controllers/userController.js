import prisma from '../utils/database.js';
import { handleError } from '../utils/helpers.js';

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    res.json(users);
  } catch (error) {
    handleError(res, error);
  }
};
