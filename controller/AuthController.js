import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../model/Admins.js'

const DEFAULT_PASSWORD = 'Simpolo@2025'

export const registerAdmin = async (req, res) => {
  try {
    const { email, name } = req.body

    const existing = await Admin.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: 'Admin already exists' })
    }

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    const admin = await Admin.create({
      email,
      name,
      password: hash,
      isDefaultPassword: true
    })

    res.json({ success: true, adminId: admin._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const seedAdmins = async (req, res) => {
  try {
    const admins = [
      { email: 'info@simpolotrading.com', name: 'Main Admin' },
      { email: 'Mohd.aslam@simpolotrading.com', name: 'Mohd Aslam' },
      { email: 'Accounts@simpolotrading.com', name: 'Accounts Department' },
      { email: 'Operations@simpolotrading.com', name: 'Operations Department' }
    ]

    for (const adminData of admins) {
      const exists = await Admin.findOne({ email: adminData.email })
      if (!exists) {
        const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
        await Admin.create({
          ...adminData,
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

export const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      console.log("tte")

      return res.status(400).json({ message: 'Email and password required' })
    }

    const admin = await Admin.findOne({ email: username })
    console.log("tte1")

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    admin.lastLogin = new Date()
    await admin.save()

    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )



    res.json({
      token,
      mustChangePassword: admin.isDefaultPassword,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

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

export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password')
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' })
    }
    res.json(admin)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id)
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' })
    }

    const { name, email } = req.body
    if (email && email !== admin.email) {
      const emailExists = await Admin.findOne({ email })
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' })
      }
      admin.email = email
    }
    
    if (name) admin.name = name
    
    await admin.save()
    
    const adminData = admin.toObject()
    delete adminData.password
    
    res.json(adminData)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const resetAdminPassword = async (req, res) => {
  try {
    const { adminId } = req.params
    const admin = await Admin.findById(adminId)
    
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' })
    }

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    admin.password = hash
    admin.isDefaultPassword = true
    await admin.save()

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 })
    res.json(admins)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}