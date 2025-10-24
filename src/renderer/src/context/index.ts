import { DatabaseBackupIcon, DatabaseIcon, DatabaseZapIcon, IdCardIcon, Mail } from 'lucide-react'

const data = {
  user: {
    name: 'GDG RBU',
    ico: './assets/icons/icon.png',
    email: 'rbugdgoc@gmail.com'
  },

  Assets: [
    {
      title: 'Certificate',
      url: '#',
      icon: IdCardIcon,
      isActive: true,
      items: [
        {
          title: 'Templates',
          url: '#'
        },
        {
          title: 'Parameters',
          url: '#'
        }
      ]
    },
    {
      title: 'Email',
      url: '#',
      icon: Mail,
      isActive: true,
      items: [
        {
          title: 'Editor',
          url: '#'
        },
        {
          title: 'Templates',
          url: '#'
        },
        {
          title: 'Guide',
          url: '#'
        }
      ]
    }
  ],
  database: [
    {
      name: 'DATA',
      url: '/data',
      icon: DatabaseIcon
    },
    {
      name: 'TEST DATA',
      url: '/test-data',
      icon: DatabaseBackupIcon
    },
    {
      name: 'DATA CONVERSION',
      url: '#',
      icon: DatabaseZapIcon
    }
  ]
}

export default data
