import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../model/Admins.js'

const DEFAULT_PASSWORD = 'Simpolo@2025'

/* ================= REGISTER ADMIN ================= */
export const registerAdmin = async (req, res) => {
  try {
    const { email } = req.body

    const existing = await Admin.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'Admin already exists' })
    }

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    const admin = await Admin.create({
      email,
      password: hash,
      isDefaultPassword: true
    })

    res.json({ success: true, adminId: admin._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ================= SEED ADMINS ================= */
export const seedAdmins = async (req, res) => {
  try {
    const emails = [
      'info@simpolotrading.com',
      'Mohd.aslam@simpolotrading.com',
      'Accounts@simpolotrading.com',
      'Operations@simpolotrading.com'
    ]

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    for (const email of emails) {
      const exists = await Admin.findOne({ email })
      if (!exists) {
        await Admin.create({
          email,
          password: hash,
          isDefaultPassword: true
        })
      }
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ================= LOGIN ADMIN ================= */
export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body   // username = email

    if (!username || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    const admin = await Admin.findOne({ email: username })

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {

      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    console.log("first")

    res.json({
      token,
      mustChangePassword: admin.isDefaultPassword
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ================= CHANGE PASSWORD ================= */
export const changePassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id)
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' })
    }

    const { oldPassword, newPassword } = req.body

    const match = await bcrypt.compare(oldPassword, admin.password)
    if (!match) {
      return res.status(400).json({ message: 'Old password incorrect' })
    }

    const hash = await bcrypt.hash(newPassword, 10)
    admin.password = hash
    admin.isDefaultPassword = false
    await admin.save()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
