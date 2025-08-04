const fs = require('fs')
const path = require('path')

const IGNORED_DIRS = ['node_modules', '.next','prisma']

function generateDirectoryTree(startPath, indent = '') {
  const items = fs.readdirSync(startPath).filter(item => 
    !IGNORED_DIRS.includes(item) && !item.startsWith('.')
  )
  
  let tree = ''

  items.forEach((item, index) => {
    const fullPath = path.join(startPath, item)
    const isLast = index === items.length - 1
    const stats = fs.statSync(fullPath)

    tree += `${indent}${isLast ? '└──' : '├──'} ${item}\n`

    if (stats.isDirectory()) {
      tree += generateDirectoryTree(fullPath, `${indent}${isLast ? '    ' : '│   '}`)
    }
  })

  return tree
}

console.log(generateDirectoryTree('.'))