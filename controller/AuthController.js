import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

export const registerAdmin = async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10)
  await Admin.create({ email: req.body.email, password: hash })
  res.json({ success: true })
}

export const loginAdmin = async (req, res) => {
  const admin = await Admin.findOne({ email: req.body.email })
  if (!admin) return res.status(401).json({ message: 'Invalid credentials' })
  const ok = await bcrypt.compare(req.body.password, admin.password)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
}
