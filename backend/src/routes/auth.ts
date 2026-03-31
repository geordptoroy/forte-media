import { Router, Request, Response } from 'express';
import { generateToken, hashPassword, comparePassword } from '../services/auth';
import { query } from '../services/database';
import { config } from '../config';
import { authMiddleware } from '../middleware/auth';
import { MOCK_USER } from '../services/mockData';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  if (config.useMock) {
    const token = generateToken({ userId: 1, email: req.body.email || 'demo@fortemedia.com' });
    return res.json({ token, user: { ...MOCK_USER, email: req.body.email, name: req.body.name } });
  }
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }
    const hashed = await hashPassword(password);
    const result = await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashed]
    );
    const user = result.rows[0];
    const token = generateToken({ userId: user.id, email: user.email });
    return res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  if (config.useMock) {
    const token = generateToken({ userId: 1, email: req.body.email || 'demo@fortemedia.com' });
    return res.json({ token, user: { ...MOCK_USER, email: req.body.email || MOCK_USER.email } });
  }
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
    }
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const user = result.rows[0];
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = generateToken({ userId: user.id, email: user.email });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  if (config.useMock) {
    return res.json(MOCK_USER);
  }
  try {
    const result = await query('SELECT id, name, email FROM users WHERE id = $1', [req.user!.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
