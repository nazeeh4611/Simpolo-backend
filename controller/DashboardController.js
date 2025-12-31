import Admin from '../model/Admins.js'
import Gallery from '../model/Gallery.js'
import Project from '../model/Project.js'

export const getDashboardStats = async (req, res) => {
  try {
    const [
      galleryCount,
      projectsCount,
      recentGallery,
      recentProjects,
      adminsCount,
      allGallery
    ] = await Promise.all([
      Gallery.countDocuments(),
      Project.countDocuments(),
      Gallery.find().sort({ createdAt: -1 }).limit(5),
      Project.find().sort({ createdAt: -1 }).limit(5),
      Admin.countDocuments(),
      Gallery.find().sort({ createdAt: -1 }).limit(10)
    ])

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [galleryLastMonth, projectsLastMonth] = await Promise.all([
      Gallery.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Project.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
    ])

    const galleryGrowth = galleryCount > 0 ? 
      Math.round((galleryLastMonth / galleryCount) * 100) : 0
    const projectsGrowth = projectsCount > 0 ? 
      Math.round((projectsLastMonth / projectsCount) * 100) : 0

    const recentActivity = allGallery.map(item => ({
      _id: item._id,
      action: 'Gallery added',
      item: item.title,
      createdAt: item.createdAt,
      type: 'gallery',
      color: 'blue',
      user: 'Admin'
    }))

    

    res.json({
      stats: {
        galleryCount,
        projectsCount,
        categoriesCount: 0,
        adminsCount,
        galleryGrowth,
        projectsGrowth,
        viewsGrowth: 15
      },
      recent: {
        gallery: recentGallery,
        projects: recentProjects
      },
      activity: recentActivity
    })
  } catch (err) {
    console.error('Dashboard stats error:', err)
    res.status(500).json({ message: err.message })
  }
}