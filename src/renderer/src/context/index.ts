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
      name: 'Production Database',
      url: '/data',
      icon: DatabaseIcon
    },
    {
      name: 'Test Database',
      url: '/test-data',
      icon: DatabaseBackupIcon
    },
    {
      name: 'Data Conversion',
      url: '#',
      icon: DatabaseZapIcon
    }
  ]
}

export default data
